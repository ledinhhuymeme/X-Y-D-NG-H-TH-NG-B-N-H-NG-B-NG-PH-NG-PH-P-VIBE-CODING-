from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.user import User
from models.cart import Cart, CartItem
from models.product import Product
from schemas.cart import CartResponse, CartItemResponse, CartItemAdd, CartItemUpdate
from auth.jwt_handler import get_current_user

router = APIRouter(prefix="/api/cart", tags=["Giỏ hàng (Cart)"])


def _get_or_create_cart(user: User, db: Session) -> Cart:
    """Lấy hoặc tạo giỏ hàng cho user."""
    cart = db.query(Cart).filter(Cart.user_id == user.id).first()
    if not cart:
        cart = Cart(user_id=user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def _cart_to_response(cart: Cart) -> CartResponse:
    """Chuyển đổi Cart model sang response."""
    items = []
    total_price = 0
    total_items = 0

    for item in cart.items:
        subtotal = item.product.price * item.quantity if item.product else 0
        total_price += subtotal
        total_items += item.quantity
        items.append(CartItemResponse(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name if item.product else "",
            product_price=item.product.price if item.product else 0,
            product_image=item.product.image_url if item.product else None,
            price=item.product.price if item.product else 0,
            image_url=item.product.image_url if item.product else None,
            quantity=item.quantity,
            subtotal=subtotal,
        ))

    return CartResponse(
        id=cart.id,
        user_id=cart.user_id,
        items=items,
        total_price=round(total_price, 2),
        total_amount=round(total_price, 2),
        total_items=total_items,
    )


@router.get("", response_model=CartResponse)
def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Xem giỏ hàng hiện tại."""
    cart = _get_or_create_cart(current_user, db)
    # Eager load items and products
    cart = (
        db.query(Cart)
        .options(joinedload(Cart.items).joinedload(CartItem.product))
        .filter(Cart.id == cart.id)
        .first()
    )
    return _cart_to_response(cart)


@router.post("/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    item_data: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Thêm sản phẩm vào giỏ hàng."""
    # Kiểm tra sản phẩm tồn tại
    product = db.query(Product).filter(Product.id == item_data.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm",
        )

    # Kiểm tra tồn kho
    if product.stock < item_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sản phẩm chỉ còn {product.stock} trong kho",
        )

    cart = _get_or_create_cart(current_user, db)

    # Kiểm tra sản phẩm đã có trong giỏ chưa
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == item_data.product_id,
    ).first()

    if existing_item:
        existing_item.quantity += item_data.quantity
        if existing_item.quantity > product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tổng số lượng vượt quá tồn kho ({product.stock})",
            )
    else:
        new_item = CartItem(
            cart_id=cart.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
        )
        db.add(new_item)

    db.commit()

    # Reload cart
    cart = (
        db.query(Cart)
        .options(joinedload(Cart.items).joinedload(CartItem.product))
        .filter(Cart.id == cart.id)
        .first()
    )
    return _cart_to_response(cart)


@router.put("/items/{item_id}", response_model=CartResponse)
def update_cart_item(
    item_id: int,
    item_data: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cập nhật số lượng sản phẩm trong giỏ hàng."""
    cart = _get_or_create_cart(current_user, db)

    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id,
    ).first()

    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm trong giỏ hàng",
        )

    if item_data.quantity <= 0:
        db.delete(cart_item)
    else:
        # Kiểm tra tồn kho
        if cart_item.product.stock < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sản phẩm chỉ còn {cart_item.product.stock} trong kho",
            )
        cart_item.quantity = item_data.quantity

    db.commit()

    cart = (
        db.query(Cart)
        .options(joinedload(Cart.items).joinedload(CartItem.product))
        .filter(Cart.id == cart.id)
        .first()
    )
    return _cart_to_response(cart)


@router.delete("/items/{item_id}", response_model=CartResponse)
def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Xóa sản phẩm khỏi giỏ hàng."""
    cart = _get_or_create_cart(current_user, db)

    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id,
    ).first()

    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm trong giỏ hàng",
        )

    db.delete(cart_item)
    db.commit()

    cart = (
        db.query(Cart)
        .options(joinedload(Cart.items).joinedload(CartItem.product))
        .filter(Cart.id == cart.id)
        .first()
    )
    return _cart_to_response(cart)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Xóa toàn bộ giỏ hàng."""
    cart = _get_or_create_cart(current_user, db)
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
