from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.user import User
from models.review import Review
from models.product import Product
from schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate
from auth.jwt_handler import get_current_user

router = APIRouter(prefix="/api/products", tags=["Đánh giá sản phẩm (Reviews)"])


@router.get("/{product_id}/reviews", response_model=List[ReviewResponse])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    """Danh sách đánh giá của một sản phẩm."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm",
        )

    reviews = (
        db.query(Review)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    result = []
    for review in reviews:
        user = db.query(User).filter(User.id == review.user_id).first()
        result.append(ReviewResponse(
            id=review.id,
            user_id=review.user_id,
            user_name=user.full_name if user else "Ẩn danh",
            product_id=review.product_id,
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
        ))

    return result


@router.post("/{product_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    product_id: int,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Viết đánh giá cho sản phẩm."""
    # Kiểm tra sản phẩm tồn tại
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm",
        )

    # Kiểm tra rating hợp lệ
    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đánh giá phải từ 1 đến 5 sao",
        )

    # Kiểm tra đã đánh giá chưa
    existing_review = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.product_id == product_id,
    ).first()

    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn đã đánh giá sản phẩm này rồi",
        )

    # Tạo review
    review = Review(
        user_id=current_user.id,
        product_id=product_id,
        rating=review_data.rating,
        comment=review_data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        user_name=current_user.full_name,
        product_id=review.product_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
    )


@router.put("/{product_id}/reviews/{review_id}", response_model=ReviewResponse)
def update_review(
    product_id: int,
    review_id: int,
    review_data: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cập nhật đánh giá."""
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.product_id == product_id,
        Review.user_id == current_user.id,
    ).first()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy đánh giá",
        )

    if review_data.rating is not None:
        if review_data.rating < 1 or review_data.rating > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Đánh giá phải từ 1 đến 5 sao",
            )
        review.rating = review_data.rating
    if review_data.comment is not None:
        review.comment = review_data.comment

    db.commit()
    db.refresh(review)

    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        user_name=current_user.full_name,
        product_id=review.product_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
    )


@router.delete("/{product_id}/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    product_id: int,
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Xóa đánh giá."""
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.product_id == product_id,
        Review.user_id == current_user.id,
    ).first()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy đánh giá",
        )

    db.delete(review)
    db.commit()
