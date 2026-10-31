from database import SessionLocal
from models.user import User, UserRole
from models.cart import Cart
from auth.jwt_handler import hash_password

def setup_huydinh_account():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "huydinh@gmail.com").first()
        if not user:
            user = User(
                full_name="Huy Dinh (Chủ Shop)",
                email="huydinh@gmail.com",
                hashed_password=hash_password("huydinh123"),
                phone="0908888999",
                address="Boutique Huy Dinh Luxury, TP. Hồ Chí Minh",
                role=UserRole.CUSTOMER,
            )
            db.add(user)
            db.flush()
            # Giỏ hàng
            cart = Cart(user_id=user.id)
            db.add(cart)
            db.commit()
            print("OK: Created VIP user Huy Dinh successfully.")
        else:
            print("OK: User Huy Dinh already exists.")
    except Exception as e:
        db.rollback()
        print("ERROR:", repr(e))
    finally:
        db.close()

if __name__ == "__main__":
    setup_huydinh_account()
