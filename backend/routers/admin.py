from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sql_func
from typing import Optional, List
from datetime import datetime, timedelta
import math
import re

from database import get_db
from models.user import User, UserRole
from models.product import Product
from models.category import Category
from models.order import Order, OrderItem, OrderStatus
from models.review import Review
from schemas.product import ProductCreate, ProductUpdate, ProductResponse
from schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from schemas.order import OrderResponse, OrderStatusUpdate, OrderListResponse
from auth.jwt_handler import get_current_admin
from routers.products import _product_to_response
from routers.orders import _order_to_response

router = APIRouter(prefix="/api/admin", tags=["Quản trị (Admin Dashboard)"])


def _slugify(text: str) -> str:
    """Tạo slug từ text tiếng Việt."""
    text = text.lower().strip()
    # Thay thế ký tự tiếng Việt
    vietnamese_map = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'đ': 'd',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    }
    for vn_char, ascii_char in vietnamese_map.items():
        text = text.replace(vn_char, ascii_char)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text.strip('-')


# ==================== QUẢN LÝ DANH MỤC ====================

@router.get("/categories", response_model=List[CategoryResponse])
def admin_get_categories(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """[Admin] Danh sách tất cả danh mục (bao gồm cả inactive)."""
    categories = db.query(Category).order_by(Category.id.asc()).all()
    result = []
    for cat in categories:
        product_count = db.query(Product).filter(Product.category_id == cat.id).count()
        result.append(CategoryResponse(
            id=cat.id,
            name=cat.name,
            slug=cat.slug,
            description=cat.description,
            image_url=cat.image_url,
            is_active=cat.is_active,
            created_at=cat.created_at,
            product_count=product_count,
        ))
    return result


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def admin_create_category(
    data: CategoryCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """[Admin] Thêm danh mục mới."""
    # Kiểm tra trùng tên
    existing = db.query(Category).filter(Category.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tên danh mục đã tồn tại")

    slug = data.slug or _slugify(data.name)
    category = Category(
        name=data.name,
        slug=slug,
        description=data.description,
        image_url=data.image_url,
        is_active=data.is_active,
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    return CategoryResponse(
        id=category.id,
        name=category.name,
        slug=category.slug,
        description=category.description,
        image_url=category.image_url,
        is_active=category.is_active,
        created_at=category.created_at,
        product_count=0,
    )


@router.put("/categories/{category_id}", response_model=CategoryResponse)
def admin_update_category(
    category_id: int,
    data: CategoryUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """[Admin] Cập nhật danh mục."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục")

    if data.name is not None:
        category.name = data.name
        if data.slug is None:
            category.slug = _slugify(data.name)
    if data.slug is not None:
        category.slug = data.slug
    if data.description is not None:
        category.description = data.description
    if data.image_url is not None:
        category.image_url = data.image_url
    if data.is_active is not None:
        category.is_active = data.is_active

    db.commit()
    db.refresh(category)

    product_count = db.query(Product).filter(Product.category_id == category.id).count()
    return CategoryResponse(
        id=category.id,
        name=category.name,
        slug=category.slug,
        description=category.description,
        image_url=category.image_url,
        is_active=category.is_active,
        created_at=category.created_at,
        product_count=product_count,
    )


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_category(
    category_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """[Admin] Xóa danh mục."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục")

    # Kiểm tra có sản phẩm không
    product_count = db.query(Product).filter(Product.category_id == category_id).count()
    if product_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Không thể xóa: danh mục có {product_count} sản phẩm",
        )

    db.delete(category)
    db.commit()


# ==================== QUẢN LÝ SẢN PHẨM ====================

@router.get("/products", response_model=List[ProductResponse])
def admin_get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """[Admin] Danh sách sản phẩm (bao gồm inactive)."""
    query = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.reviews),
    )

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    if category_id:
        query = query.filter(Product.category_id == category_id)

    products = (
        query
        .order_by(Product.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return [_product_to_response(p) for p in products]


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def admin_create_product(
    data: ProductCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """[Admin] Thêm sản phẩm mới."""
    # Kiểm tra danh mục tồn tại
    category = db.query(Category).filter(Category.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Danh mục không tồn tại")

    slug = data.slug or _slugify(data.name)

    # Kiểm tra slug trùng
    existing = db.query(Product).filter(Product.slug == slug).first()
    if existing:
        slug = f"{slug}-{existing.id + 1}"

    product = Product(
        name=data.name,
        slug=slug,
        description=data.description,
        price=data.price,
        original_price=data.original_price,
        stock=data.stock,
        image_url=data.image_url,
        is_featured=data.is_featured,
        is_active=data.is_active,
        size=data.size,
        color=data.color,
        material=data.material,
        brand=data.brand,
        category_id=data.category_id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    product = (
        db.query(Product)
        .options(joinedload(Product.category), joinedload(Product.reviews))
        .filter(Product.id == product.id)
        .first()
    )
    return _product_to_response(product)


@router.put("/products/{product_id}", response_model=ProductResponse)
def admin_update_product(
    product_id: int,
    data: ProductUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """[Admin] Cập nhật thông tin sản phẩm."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(product, field, value)

    # Auto-generate slug nếu đổi tên
    if data.name and not data.slug:
        product.slug = _slugify(data.name)

    db.commit()
    db.refresh(product)

    product = (
        db.query(Product)
        .options(joinedload(Product.category), joinedload(Product.reviews))
        .filter(Product.id == product.id)
        .first()
    )
    return _product_to_response(product)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_product(
    product_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """[Admin] Xóa sản phẩm."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")

    db.delete(product)
    db.commit()


# ==================== QUẢN LÝ ĐƠN HÀNG ====================

@router.get("/orders", response_model=OrderListResponse)
def admin_get_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """[Admin] Danh sách toàn bộ đơn hàng."""
    query = db.query(Order)

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


@router.put("/orders/{order_id}/status", response_model=OrderResponse)
def admin_update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """[Admin] Cập nhật trạng thái đơn hàng."""
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.user))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

    try:
        new_status = OrderStatus(data.status)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Trạng thái không hợp lệ. Chọn: pending, confirmed, shipping, delivered, completed, cancelled",
        )

    # Nếu hủy đơn, hoàn lại tồn kho
    if new_status == OrderStatus.CANCELLED and order.status != OrderStatus.CANCELLED:
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock += item.quantity

    order.status = new_status
    db.commit()
    db.refresh(order)

    return _order_to_response(order)


# ==================== THỐNG KÊ ====================

@router.get("/statistics")
def admin_get_statistics(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    [Admin] Thống kê tổng quan Dashboard.
    
    Trả về: tổng doanh thu, tổng đơn hàng, tổng khách hàng, sản phẩm, 
    đơn hàng theo trạng thái, doanh thu 7 ngày gần nhất.
    """
    # Tổng doanh thu (chỉ tính đơn completed/delivered)
    total_revenue = db.query(sql_func.sum(Order.final_amount)).filter(
        Order.status.in_([OrderStatus.COMPLETED, OrderStatus.DELIVERED])
    ).scalar() or 0

    # Tổng đơn hàng
    total_orders = db.query(sql_func.count(Order.id)).scalar() or 0

    # Tổng khách hàng
    total_customers = db.query(sql_func.count(User.id)).filter(
        User.role == UserRole.CUSTOMER
    ).scalar() or 0

    # Tổng sản phẩm
    total_products = db.query(sql_func.count(Product.id)).scalar() or 0

    # Đơn hàng theo trạng thái
    orders_by_status = {}
    for status_val in OrderStatus:
        count = db.query(sql_func.count(Order.id)).filter(Order.status == status_val).scalar() or 0
        orders_by_status[status_val.value] = count

    # Doanh thu 7 ngày gần nhất
    revenue_last_7_days = []
    for i in range(6, -1, -1):
        day = datetime.now() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        daily_revenue = db.query(sql_func.sum(Order.final_amount)).filter(
            Order.created_at.between(day_start, day_end),
            Order.status.in_([OrderStatus.COMPLETED, OrderStatus.DELIVERED]),
        ).scalar() or 0
        revenue_last_7_days.append({
            "date": day.strftime("%Y-%m-%d"),
            "revenue": round(daily_revenue, 2),
        })

    # Đơn hàng gần nhất (5 đơn)
    recent_orders = (
        db.query(Order)
        .options(joinedload(Order.user))
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )

    # Top sản phẩm bán chạy
    top_products = (
        db.query(
            OrderItem.product_name,
            sql_func.sum(OrderItem.quantity).label("total_sold"),
            sql_func.sum(OrderItem.subtotal).label("total_revenue"),
        )
        .group_by(OrderItem.product_name)
        .order_by(sql_func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "total_customers": total_customers,
        "total_products": total_products,
        "orders_by_status": orders_by_status,
        "revenue_last_7_days": revenue_last_7_days,
        "recent_orders": [
            {
                "id": o.id,
                "order_code": o.order_code,
                "customer_name": o.user.full_name if o.user else "N/A",
                "final_amount": o.final_amount,
                "status": o.status.value,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in recent_orders
        ],
        "top_products": [
            {
                "product_name": p.product_name,
                "total_sold": p.total_sold,
                "total_revenue": round(p.total_revenue, 2),
            }
            for p in top_products
        ],
    }
