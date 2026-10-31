from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
from models.category import Category
from models.product import Product
from schemas.category import CategoryResponse
from schemas.product import ProductResponse
from routers.products import _product_to_response

router = APIRouter(prefix="/api/categories", tags=["Danh mục (Categories)"])


@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """Danh sách tất cả danh mục đang hoạt động."""
    categories = (
        db.query(Category)
        .filter(Category.is_active == True)
        .order_by(Category.name.asc())
        .all()
    )

    result = []
    for cat in categories:
        product_count = db.query(Product).filter(
            Product.category_id == cat.id,
            Product.is_active == True,
        ).count()
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


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Chi tiết một danh mục."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy danh mục",
        )
    product_count = db.query(Product).filter(
        Product.category_id == category.id,
        Product.is_active == True,
    ).count()
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


@router.get("/{category_id}/products", response_model=List[ProductResponse])
def get_category_products(category_id: int, db: Session = Depends(get_db)):
    """Danh sách sản phẩm theo danh mục."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy danh mục",
        )

    products = (
        db.query(Product)
        .options(joinedload(Product.category), joinedload(Product.reviews))
        .filter(Product.category_id == category_id, Product.is_active == True)
        .order_by(Product.created_at.desc())
        .all()
    )
    return [_product_to_response(p) for p in products]
