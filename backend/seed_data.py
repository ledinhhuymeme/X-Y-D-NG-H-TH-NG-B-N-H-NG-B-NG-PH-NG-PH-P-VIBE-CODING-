"""
Script tạo dữ liệu mẫu cho hệ thống Fashion Store.
Chạy: python seed_data.py
"""
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
from models.user import User, UserRole
from models.category import Category
from models.product import Product
from models.cart import Cart
from auth.jwt_handler import hash_password


def seed_database():
    """Tạo dữ liệu mẫu."""
    # Tạo tables
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    try:
        # Kiểm tra đã có dữ liệu chưa
        if db.query(User).first():
            print("⚠️  Dữ liệu đã tồn tại. Bỏ qua seed.")
            return

        print("🌱 Bắt đầu tạo dữ liệu mẫu...")

        # ==================== USERS ====================
        admin_user = User(
            full_name="Admin Fashion Store",
            email="admin@fashionstore.vn",
            hashed_password=hash_password("admin123"),
            phone="0901234567",
            address="123 Nguyễn Huệ, Q.1, TP.HCM",
            role=UserRole.ADMIN,
        )
        db.add(admin_user)

        customer1 = User(
            full_name="Nguyễn Văn An",
            email="an@gmail.com",
            hashed_password=hash_password("123456"),
            phone="0912345678",
            address="456 Lê Lợi, Q.3, TP.HCM",
            role=UserRole.CUSTOMER,
        )
        db.add(customer1)

        customer2 = User(
            full_name="Trần Thị Bình",
            email="binh@gmail.com",
            hashed_password=hash_password("123456"),
            phone="0923456789",
            address="789 Trần Hưng Đạo, Q.5, TP.HCM",
            role=UserRole.CUSTOMER,
        )
        db.add(customer2)

        customer3 = User(
            full_name="Lê Minh Cường",
            email="cuong@gmail.com",
            hashed_password=hash_password("123456"),
            phone="0934567890",
            address="321 Điện Biên Phủ, Q. Bình Thạnh, TP.HCM",
            role=UserRole.CUSTOMER,
        )
        db.add(customer3)

        db.flush()

        # Tạo giỏ hàng cho customers
        for user in [customer1, customer2, customer3]:
            cart = Cart(user_id=user.id)
            db.add(cart)

        # ==================== CATEGORIES ====================
        categories_data = [
            {
                "name": "Áo nam",
                "slug": "ao-nam",
                "description": "Bộ sưu tập áo nam đa dạng: áo thun, áo polo, áo sơ mi, áo khoác",
                "image_url": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400",
            },
            {
                "name": "Áo nữ",
                "slug": "ao-nu",
                "description": "Bộ sưu tập áo nữ thời trang: áo kiểu, áo croptop, áo sơ mi nữ",
                "image_url": "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=400",
            },
            {
                "name": "Quần nam",
                "slug": "quan-nam",
                "description": "Quần jean, quần kaki, quần short nam chất lượng cao",
                "image_url": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
            },
            {
                "name": "Quần nữ",
                "slug": "quan-nu",
                "description": "Quần jean nữ, quần ống rộng, quần short nữ trendy",
                "image_url": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400",
            },
            {
                "name": "Giày dép",
                "slug": "giay-dep",
                "description": "Giày sneaker, giày thể thao, sandal, dép thời trang",
                "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
            },
            {
                "name": "Phụ kiện",
                "slug": "phu-kien",
                "description": "Túi xách, mũ nón, kính mắt, thắt lưng, đồng hồ",
                "image_url": "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400",
            },
            {
                "name": "Váy đầm",
                "slug": "vay-dam",
                "description": "Váy liền, đầm maxi, đầm công sở, đầm dạ hội",
                "image_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
            },
        ]

        categories = []
        for cat_data in categories_data:
            cat = Category(**cat_data)
            db.add(cat)
            categories.append(cat)

        db.flush()

        # ==================== PRODUCTS ====================
        products_data = [
            # --- Áo nam ---
            {
                "name": "Áo Thun Nam Basic Cotton",
                "slug": "ao-thun-nam-basic-cotton",
                "description": "Áo thun nam basic chất liệu cotton 100% mềm mại, thoáng mát. Phù hợp mặc hàng ngày, đi chơi, đi làm. Form regular fit thoải mái.",
                "price": 199000,
                "original_price": 299000,
                "stock": 150,
                "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
                "is_featured": True,
                "size": "S, M, L, XL",
                "color": "Trắng, Đen, Xám, Navy",
                "material": "Cotton 100%",
                "brand": "FashionVN",
                "category_id": categories[0].id,
            },
            {
                "name": "Áo Polo Nam Cao Cấp",
                "slug": "ao-polo-nam-cao-cap",
                "description": "Áo polo nam thiết kế cổ bẻ thanh lịch, chất liệu cotton pha polyester co giãn nhẹ. Thích hợp mặc đi làm, đi chơi golf.",
                "price": 359000,
                "original_price": 450000,
                "stock": 80,
                "image_url": "https://images.unsplash.com/photo-1625910513413-5fc5e37e7214?w=400",
                "is_featured": True,
                "size": "M, L, XL, XXL",
                "color": "Trắng, Đen, Xanh Navy, Đỏ đô",
                "material": "Cotton Polyester",
                "brand": "FashionVN",
                "category_id": categories[0].id,
            },
            {
                "name": "Áo Sơ Mi Nam Trắng Slim Fit",
                "slug": "ao-so-mi-nam-trang-slim-fit",
                "description": "Áo sơ mi nam trắng form slim fit ôm dáng. Chất liệu vải lụa cao cấp, không nhăn, phù hợp đi làm văn phòng.",
                "price": 450000,
                "original_price": 550000,
                "stock": 60,
                "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400",
                "is_featured": False,
                "size": "S, M, L, XL",
                "color": "Trắng, Xanh nhạt",
                "material": "Lụa cao cấp",
                "brand": "Giovanni",
                "category_id": categories[0].id,
            },
            {
                "name": "Áo Khoác Bomber Nam",
                "slug": "ao-khoac-bomber-nam",
                "description": "Áo khoác bomber nam phong cách street style. Chất liệu dù chống nước nhẹ, có túi trong tiện lợi.",
                "price": 590000,
                "original_price": 790000,
                "stock": 45,
                "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400",
                "is_featured": True,
                "size": "M, L, XL",
                "color": "Đen, Xanh rêu, Be",
                "material": "Vải dù chống nước",
                "brand": "UrbanStyle",
                "category_id": categories[0].id,
            },
            # --- Áo nữ ---
            {
                "name": "Áo Croptop Nữ Thể Thao",
                "slug": "ao-croptop-nu-the-thao",
                "description": "Áo croptop nữ form ôm thể thao, chất liệu thun co giãn 4 chiều, thoáng mát khi tập luyện.",
                "price": 189000,
                "original_price": 250000,
                "stock": 120,
                "image_url": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
                "is_featured": True,
                "size": "S, M, L",
                "color": "Đen, Trắng, Hồng, Tím",
                "material": "Thun co giãn 4 chiều",
                "brand": "ActiveWear",
                "category_id": categories[1].id,
            },
            {
                "name": "Áo Kiểu Nữ Tay Phồng",
                "slug": "ao-kieu-nu-tay-phong",
                "description": "Áo kiểu nữ tay phồng nhẹ nhàng, nữ tính. Chất liệu voan mỏng mát, phù hợp đi làm, đi chơi.",
                "price": 320000,
                "original_price": 420000,
                "stock": 70,
                "image_url": "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400",
                "is_featured": False,
                "size": "S, M, L",
                "color": "Trắng, Hồng pastel, Xanh mint",
                "material": "Voan cao cấp",
                "brand": "Elise",
                "category_id": categories[1].id,
            },
            {
                "name": "Áo Sơ Mi Nữ Oversize",
                "slug": "ao-so-mi-nu-oversize",
                "description": "Áo sơ mi nữ form oversize trẻ trung, năng động. Có thể mặc cùng quần short hoặc chân váy.",
                "price": 380000,
                "original_price": None,
                "stock": 55,
                "image_url": "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=400",
                "is_featured": True,
                "size": "Free size",
                "color": "Trắng, Xanh denim, Kẻ caro",
                "material": "Cotton linen",
                "brand": "UrbanStyle",
                "category_id": categories[1].id,
            },
            # --- Quần nam ---
            {
                "name": "Quần Jean Nam Slim Fit",
                "slug": "quan-jean-nam-slim-fit",
                "description": "Quần jean nam form slim fit ôm vừa, co giãn thoải mái. Wash màu xanh đậm cổ điển, phù hợp nhiều phong cách.",
                "price": 490000,
                "original_price": 650000,
                "stock": 90,
                "image_url": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
                "is_featured": True,
                "size": "29, 30, 31, 32, 33, 34",
                "color": "Xanh đậm, Xanh nhạt, Đen",
                "material": "Denim co giãn",
                "brand": "LeviStyle",
                "category_id": categories[2].id,
            },
            {
                "name": "Quần Kaki Nam Công Sở",
                "slug": "quan-kaki-nam-cong-so",
                "description": "Quần kaki nam form regular, chất liệu cotton kaki mềm mại, không nhăn. Phù hợp mặc đi làm.",
                "price": 420000,
                "original_price": 520000,
                "stock": 65,
                "image_url": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400",
                "is_featured": False,
                "size": "29, 30, 31, 32, 33",
                "color": "Be, Xám, Đen, Navy",
                "material": "Cotton Kaki",
                "brand": "Giovanni",
                "category_id": categories[2].id,
            },
            {
                "name": "Quần Short Nam Thể Thao",
                "slug": "quan-short-nam-the-thao",
                "description": "Quần short nam thể thao, chất liệu thun poly nhanh khô, thoáng mát. Có túi khóa kéo tiện lợi.",
                "price": 250000,
                "original_price": 320000,
                "stock": 100,
                "image_url": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400",
                "is_featured": False,
                "size": "M, L, XL, XXL",
                "color": "Đen, Xám, Navy",
                "material": "Polyester nhanh khô",
                "brand": "ActiveWear",
                "category_id": categories[2].id,
            },
            # --- Quần nữ ---
            {
                "name": "Quần Jean Nữ Ống Rộng",
                "slug": "quan-jean-nu-ong-rong",
                "description": "Quần jean nữ ống rộng phong cách Y2K, cạp cao tôn dáng. Chất liệu denim dày dặn, form đẹp.",
                "price": 520000,
                "original_price": 680000,
                "stock": 75,
                "image_url": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400",
                "is_featured": True,
                "size": "26, 27, 28, 29, 30",
                "color": "Xanh nhạt, Xanh đậm",
                "material": "Denim 100%",
                "brand": "DenimLab",
                "category_id": categories[3].id,
            },
            {
                "name": "Quần Culottes Nữ Thanh Lịch",
                "slug": "quan-culottes-nu-thanh-lich",
                "description": "Quần culottes nữ ống rộng, dáng suông thanh lịch. Chất liệu linen mát mẻ, phù hợp đi làm và đi chơi.",
                "price": 380000,
                "original_price": None,
                "stock": 50,
                "image_url": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400",
                "is_featured": False,
                "size": "S, M, L",
                "color": "Đen, Be, Nâu",
                "material": "Linen pha",
                "brand": "Elise",
                "category_id": categories[3].id,
            },
            # --- Giày dép ---
            {
                "name": "Giày Sneaker Nam Trắng Classic",
                "slug": "giay-sneaker-nam-trang-classic",
                "description": "Giày sneaker nam trắng phong cách classic, đế cao su bền bỉ, form giày vừa vặn. Phù hợp mọi phong cách.",
                "price": 790000,
                "original_price": 990000,
                "stock": 40,
                "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
                "is_featured": True,
                "size": "39, 40, 41, 42, 43",
                "color": "Trắng, Đen-Trắng",
                "material": "Da PU cao cấp",
                "brand": "StepUp",
                "category_id": categories[4].id,
            },
            {
                "name": "Giày Thể Thao Running",
                "slug": "giay-the-thao-running",
                "description": "Giày thể thao chạy bộ, đế foam siêu nhẹ, mesh thoáng khí. Thiết kế hiện đại, bám đường tốt.",
                "price": 890000,
                "original_price": 1200000,
                "stock": 35,
                "image_url": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400",
                "is_featured": True,
                "size": "39, 40, 41, 42, 43, 44",
                "color": "Đen, Xanh dương, Đỏ",
                "material": "Mesh + Foam",
                "brand": "ActiveWear",
                "category_id": categories[4].id,
            },
            {
                "name": "Sandal Nữ Quai Chéo",
                "slug": "sandal-nu-quai-cheo",
                "description": "Sandal nữ quai chéo thanh lịch, đế bệt êm chân. Thiết kế tối giản, phù hợp đi biển, đi dạo.",
                "price": 290000,
                "original_price": 380000,
                "stock": 60,
                "image_url": "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400",
                "is_featured": False,
                "size": "36, 37, 38, 39",
                "color": "Đen, Nâu, Kem",
                "material": "Da bò thật",
                "brand": "Elise",
                "category_id": categories[4].id,
            },
            # --- Phụ kiện ---
            {
                "name": "Túi Tote Vải Canvas",
                "slug": "tui-tote-vai-canvas",
                "description": "Túi tote vải canvas phong cách minimalist, chứa được laptop 13 inch. In logo thời trang, bền đẹp.",
                "price": 180000,
                "original_price": 250000,
                "stock": 200,
                "image_url": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400",
                "is_featured": False,
                "size": "Free size",
                "color": "Trắng kem, Đen, Be",
                "material": "Vải canvas dày",
                "brand": "UrbanStyle",
                "category_id": categories[5].id,
            },
            {
                "name": "Kính Mắt Thời Trang Unisex",
                "slug": "kinh-mat-thoi-trang-unisex",
                "description": "Kính mắt thời trang unisex chống UV400, gọng kim loại nhẹ, mắt kính polarized chống chói.",
                "price": 350000,
                "original_price": 480000,
                "stock": 85,
                "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400",
                "is_featured": True,
                "size": "Free size",
                "color": "Đen, Vàng gold, Bạc",
                "material": "Kim loại + Polarized lens",
                "brand": "SunVibe",
                "category_id": categories[5].id,
            },
            {
                "name": "Nón Bucket Hat",
                "slug": "non-bucket-hat",
                "description": "Nón bucket hat phong cách streetwear, chất liệu vải cotton dày dặn, chống nắng tốt.",
                "price": 150000,
                "original_price": 200000,
                "stock": 120,
                "image_url": "https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=400",
                "is_featured": False,
                "size": "Free size",
                "color": "Đen, Trắng, Be, Kẻ caro",
                "material": "Cotton 100%",
                "brand": "UrbanStyle",
                "category_id": categories[5].id,
            },
            # --- Váy đầm ---
            {
                "name": "Đầm Maxi Hoa Nhí",
                "slug": "dam-maxi-hoa-nhi",
                "description": "Đầm maxi hoạ tiết hoa nhí lãng mạn, chất liệu voan mềm mại, bay bổng. Phù hợp đi biển, dạo phố.",
                "price": 480000,
                "original_price": 650000,
                "stock": 40,
                "image_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
                "is_featured": True,
                "size": "S, M, L",
                "color": "Hoa xanh, Hoa đỏ, Hoa vàng",
                "material": "Voan cao cấp",
                "brand": "Elise",
                "category_id": categories[6].id,
            },
            {
                "name": "Váy Công Sở A-line",
                "slug": "vay-cong-so-a-line",
                "description": "Váy công sở form A-line thanh lịch, chất liệu vải tweed dày dặn, không nhăn. Dáng váy tôn eo.",
                "price": 550000,
                "original_price": 700000,
                "stock": 35,
                "image_url": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400",
                "is_featured": False,
                "size": "S, M, L, XL",
                "color": "Đen, Xám, Hồng nhạt",
                "material": "Tweed cao cấp",
                "brand": "Giovanni",
                "category_id": categories[6].id,
            },
        ]

        for product_data in products_data:
            product = Product(**product_data)
            db.add(product)

        db.commit()
        print(f"✅ Đã tạo {len(products_data)} sản phẩm mẫu!")
        print(f"✅ Đã tạo {len(categories_data)} danh mục!")
        print(f"✅ Đã tạo 4 tài khoản (1 admin + 3 customers)!")
        print()
        print("📋 Thông tin đăng nhập:")
        print("   Admin:    admin@fashionstore.vn / admin123")
        print("   Customer: an@gmail.com / 123456")
        print("   Customer: binh@gmail.com / 123456")
        print("   Customer: cuong@gmail.com / 123456")

    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
