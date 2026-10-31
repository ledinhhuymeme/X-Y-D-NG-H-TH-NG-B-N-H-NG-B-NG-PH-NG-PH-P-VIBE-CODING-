from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional
import math

from database import get_db
from models.product import Product
from models.category import Category
from schemas.product import ProductResponse, ProductListResponse
from config import settings

router = APIRouter(prefix="/api/products", tags=["Sản phẩm (Products)"])


def _product_to_response(product: Product) -> ProductResponse:
    """Chuyển đổi Product model sang ProductResponse schema."""
    return ProductResponse(
        id=product.id,
        name=product.name,
        slug=product.slug,
        description=product.description,
        price=product.price,
        original_price=product.original_price,
        stock=product.stock,
        image_url=product.image_url,
        is_featured=product.is_featured,
        is_active=product.is_active,
        size=product.size,
        color=product.color,
        material=product.material,
        brand=product.brand,
        category_id=product.category_id,
        category_name=product.category.name if product.category else None,
        average_rating=round(product.average_rating, 1),
        review_count=product.review_count,
        discount_percentage=product.discount_percentage,
        images=[],
        created_at=product.created_at,
    )


@router.get("", response_model=ProductListResponse)
def get_products(
    page: int = Query(1, ge=1, description="Số trang"),
    page_size: int = Query(None, ge=1, le=50, description="Số sản phẩm mỗi trang"),
    category_id: Optional[int] = Query(None, description="Lọc theo danh mục"),
    min_price: Optional[float] = Query(None, ge=0, description="Giá tối thiểu"),
    max_price: Optional[float] = Query(None, ge=0, description="Giá tối đa"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo tên"),
    brand: Optional[str] = Query(None, description="Lọc theo thương hiệu"),
    sort_by: Optional[str] = Query("newest", description="Sắp xếp: newest, price_asc, price_desc, name"),
    db: Session = Depends(get_db),
):
    """
    Danh sách sản phẩm với phân trang, lọc và tìm kiếm.
    
    - **page**: Số trang (bắt đầu từ 1)
    - **page_size**: Số sản phẩm mỗi trang (mặc định 12, tối đa 50)
    - **category_id**: Lọc theo ID danh mục
    - **min_price** / **max_price**: Lọc theo khoảng giá
    - **search**: Tìm kiếm theo tên sản phẩm
    - **brand**: Lọc theo thương hiệu
    - **sort_by**: Sắp xếp (newest, price_asc, price_desc, name)
    """
    if page_size is None:
        page_size = settings.DEFAULT_PAGE_SIZE

    query = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.reviews),
    ).filter(Product.is_active == True)

    # Lọc theo danh mục
    if category_id:
        query = query.filter(Product.category_id == category_id)

    # Lọc theo khoảng giá
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    # Tìm kiếm theo tên
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.brand.ilike(search_term),
            )
        )

    # Lọc theo thương hiệu
    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))

    # Đếm tổng
    total = query.count()

    # Sắp xếp
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "name":
        query = query.order_by(Product.name.asc())
    else:  # newest
        query = query.order_by(Product.created_at.desc())

    # Phân trang
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size
    products = query.offset(offset).limit(page_size).all()

    return ProductListResponse(
        items=[_product_to_response(p) for p in products],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/featured", response_model=list[ProductResponse])
def get_featured_products(
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Danh sách sản phẩm nổi bật."""
    products = (
        db.query(Product)
        .options(joinedload(Product.category), joinedload(Product.reviews))
        .filter(Product.is_featured == True, Product.is_active == True)
        .order_by(Product.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_product_to_response(p) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Chi tiết sản phẩm theo ID."""
    product = (
        db.query(Product)
        .options(
            joinedload(Product.category),
            joinedload(Product.reviews),
            joinedload(Product.images),
        )
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm",
        )

    response = _product_to_response(product)
    response.images = [
        {
            "id": img.id,
            "image_url": img.image_url,
            "alt_text": img.alt_text,
            "is_primary": img.is_primary,
            "sort_order": img.sort_order,
        }
        for img in product.images
    ]
    return response
