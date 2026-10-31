from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import datetime
import math
import random
import string

from database import get_db
from models.user import User
from models.cart import Cart, CartItem
from models.order import Order, OrderItem, OrderStatus, PaymentMethod
from models.product import Product
from schemas.order import OrderCreate, OrderResponse, OrderItemResponse, OrderListResponse
from auth.jwt_handler import get_current_user

router = APIRouter(prefix="/api/orders", tags=["Đơn hàng (Orders)"])


def _generate_order_code() -> str:
    """Tạo mã đơn hàng dạng: ORD-20241022-XXXX"""
    date_str = datetime.now().strftime("%Y%m%d")
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"ORD-{date_str}-{random_str}"


def _order_to_response(order: Order) -> OrderResponse:
    """Chuyển đổi Order model sang response."""
    return OrderResponse(
        id=order.id,
        order_code=order.order_code,
        user_id=order.user_id,
        user_name=order.user.full_name if order.user else None,
        total_amount=order.total_amount,
        shipping_fee=order.shipping_fee,
        discount_amount=order.discount_amount,
        final_amount=order.final_amount,
        status=order.status.value,
        payment_method=order.payment_method.value,
        shipping_name=order.shipping_name,
        shipping_phone=order.shipping_phone,
        shipping_address=order.shipping_address,
        note=order.note,
        items=[
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product_name,
                product_price=item.product_price,
                product_image=item.product_image,
                quantity=item.quantity,
                subtotal=item.subtotal,
            )
            for item in order.items
        ],
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Tạo đơn hàng mới từ giỏ hàng hiện tại.
    
    Sau khi đặt hàng thành công, giỏ hàng sẽ được xóa sạch.
    """
    # Lấy giỏ hàng
    cart = (
        db.query(Cart)
        .options(joinedload(Cart.items).joinedload(CartItem.product))
        .filter(Cart.user_id == current_user.id)
        .first()
    )

    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Giỏ hàng trống, không thể tạo đơn hàng",
        )

    # Validate payment method
    try:
        payment_method = PaymentMethod(order_data.payment_method)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phương thức thanh toán không hợp lệ. Chọn: cod, bank_transfer, credit_card, e_wallet",
        )

    # Tính tổng tiền và kiểm tra tồn kho
    total_amount = 0
    order_items = []

    for cart_item in cart.items:
        product = cart_item.product
        if not product or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sản phẩm '{cart_item.product_id}' không còn khả dụng",
            )
        if product.stock < cart_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sản phẩm '{product.name}' chỉ còn {product.stock} trong kho",
            )

        subtotal = product.price * cart_item.quantity
        total_amount += subtotal

        order_items.append(OrderItem(
            product_id=product.id,
            product_name=product.name,
            product_price=product.price,
            product_image=product.image_url,
            quantity=cart_item.quantity,
            subtotal=subtotal,
        ))

    # Phí ship (giả lập: miễn phí cho đơn > 500k)
    shipping_fee = 0 if total_amount >= 500000 else 30000

    # Xử lý phiếu giảm giá đặc quyền (Exclusive Coupon)
    discount_amount = 0.0
    if order_data.coupon_code:
        code = order_data.coupon_code.strip().upper()
        if code in ["HUYDINH", "HUYDINH50", "BOUTIQUEHUYDINH", "HUYDINHVIP"]:
            # Mã độc quyền VIP: Giảm 50% tổng đơn hàng dành riêng cho chủ nhân Huy Dinh
            discount_amount = round(total_amount * 0.5)
        elif code in ["HUYDINH100", "FREEORDER"]:
            discount_amount = total_amount
        elif code in ["WELCOME", "CHAOBAN"]:
            discount_amount = min(50000.0, total_amount)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mã giảm giá '{order_data.coupon_code}' không hợp lệ hoặc bạn không có quyền áp dụng!",
            )

    final_amount = max(0.0, total_amount + shipping_fee - discount_amount)

    # Tạo đơn hàng
    order = Order(
        order_code=_generate_order_code(),
        user_id=current_user.id,
        total_amount=total_amount,
        shipping_fee=shipping_fee,
        discount_amount=discount_amount,
        final_amount=final_amount,
        status=OrderStatus.PENDING,
        payment_method=payment_method,
        shipping_name=order_data.shipping_name,
        shipping_phone=order_data.shipping_phone,
        shipping_address=order_data.shipping_address,
        note=f"[Mã giảm giá: {order_data.coupon_code.upper()}] {order_data.note}" if order_data.coupon_code and order_data.note else (f"[Mã giảm giá: {order_data.coupon_code.upper()}]" if order_data.coupon_code else order_data.note),
    )
    db.add(order)
    db.flush()

    # Thêm order items
    for item in order_items:
        item.order_id = order.id
        db.add(item)

    # Giảm tồn kho
    for cart_item in cart.items:
        product = cart_item.product
        product.stock -= cart_item.quantity

    # Xóa giỏ hàng
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()

    db.commit()
    db.refresh(order)

    # Reload with relationships
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.user))
        .filter(Order.id == order.id)
        .first()
    )

    return _order_to_response(order)


@router.get("", response_model=OrderListResponse)
def get_my_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    status_filter: Optional[str] = Query(None, alias="status", description="Lọc theo trạng thái"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lịch sử đơn hàng cá nhân (có phân trang)."""
    query = db.query(Order).filter(Order.user_id == current_user.id)

    if status_filter:
        try:
            order_status = OrderStatus(status_filter)
            query = query.filter(Order.status == order_status)
        except ValueError:
            pass

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    orders = (
        query
        .options(joinedload(Order.items), joinedload(Order.user))
        .order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return OrderListResponse(
        items=[_order_to_response(o) for o in orders],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_order_detail(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Chi tiết một đơn hàng."""
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.user))
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy đơn hàng",
        )

    return _order_to_response(order)


@router.put("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Hủy đơn hàng (chỉ khi đang ở trạng thái 'pending')."""
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.user))
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy đơn hàng",
        )

    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ có thể hủy đơn hàng đang chờ xử lý",
        )

    order.status = OrderStatus.CANCELLED

    # Hoàn lại tồn kho
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity

    db.commit()
    db.refresh(order)

    return _order_to_response(order)
