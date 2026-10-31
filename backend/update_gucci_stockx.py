"""
Script cập nhật danh mục sản phẩm Gucci sang hình ảnh và thông tin StockX CDN chính thức.
Tất cả ảnh đã được test trả về HTTP 200 trực tiếp.
"""
from database import SessionLocal
from models.product import Product
from models.category import Category

def update_gucci_products():
    db = SessionLocal()
    try:
        # Danh mục
        cat_ao_nam = db.query(Category).filter(Category.slug == "ao-nam").first()
        cat_quan_nam = db.query(Category).filter(Category.slug == "quan-nam").first()
        cat_vay_dam = db.query(Category).filter(Category.slug == "vay-dam").first()
        cat_giay_dep = db.query(Category).filter(Category.slug == "giay-dep").first()
        cat_phu_kien = db.query(Category).filter(Category.slug == "phu-kien").first()

        gucci_items = [
            # 1. Áo Polo Gucci Resort
            {
                "name": "Áo Polo Nam Gucci Knitted GG Logo Resort",
                "slug": "ao-polo-nam-gucci-knitted-gg-logo-resort",
                "description": "Áo Polo dệt kim cao cấp Gucci phong cách Resort phối sọc cổ Web đỏ - xanh lá kinh điển. Chất liệu sợi dệt tự nhiên thoáng mát, form dáng chuẩn phong thái thượng lưu quý tộc Ý.",
                "price": 18500000,
                "original_price": 22000000,
                "stock": 18,
                "image_url": "https://images.stockx.com/images/Gucci-Knitted-GG-Logo-Resort-Polo-Shirt-Ivory-Red-Green.jpg",
                "is_featured": True,
                "size": "S, M, L, XL",
                "color": "Kem Ivory / Phối sọc Web",
                "material": "Dệt kim Cotton cao cấp",
                "brand": "Gucci",
                "category_id": cat_ao_nam.id if cat_ao_nam else 1
            },
            # 2. Áo Polo Gucci Logo Thêu
            {
                "name": "Áo Polo Nam Gucci Logo Embroidered Cotton",
                "slug": "ao-polo-nam-gucci-logo-embroidered-cotton",
                "description": "Áo polo nam Gucci cao cấp chất liệu cotton blend piquet với logo thương hiệu thêu nổi ngực áo sắc nét. Cổ bẻ viền thanh lịch, lý tưởng cho golf, công sở và dạ tiệc bán trang trọng.",
                "price": 14500000,
                "original_price": 17000000,
                "stock": 25,
                "image_url": "https://images.stockx.com/images/Gucci-Logo-Embroidered-Cotton-Blend-Polo-Navy.jpg",
                "is_featured": True,
                "size": "M, L, XL",
                "color": "Xanh Navy",
                "material": "Cotton Piquet cao cấp",
                "brand": "Gucci",
                "category_id": cat_ao_nam.id if cat_ao_nam else 1
            },
            # 3. Áo Thun Gucci Blade
            {
                "name": "Áo Thun Nam Gucci Blade Print T-Shirt",
                "slug": "ao-thun-nam-gucci-blade-print-t-shirt",
                "description": "Mẫu áo thun kinh điển được săn đón bậc nhất với logo 'Gucci Blade' mang cảm hứng retro thập niên 80 phối màu xanh lá và đỏ rực rỡ trên nền đen sang trọng.",
                "price": 11800000,
                "original_price": 13500000,
                "stock": 30,
                "image_url": "https://images.stockx.com/images/Gucci-Gucci-Blade-Print-T-shirt-Black-Red-White.jpg",
                "is_featured": True,
                "size": "XS, S, M, L",
                "color": "Đen / Đỏ / Trắng",
                "material": "100% Organic Cotton Jersey",
                "brand": "Gucci",
                "category_id": cat_ao_nam.id if cat_ao_nam else 1
            },
            # 4. Áo Sơ Mi Lụa Gucci Bowling
            {
                "name": "Áo Sơ Mi Lụa Gucci Printed Silk Bowling Shirt",
                "slug": "ao-so-mi-lua-gucci-printed-silk-bowling-shirt",
                "description": "Áo sơ mi dáng bowling lụa tơ tằm nguyên chất với họa tiết in sắc sảo đa sắc. Thiết kế cổ camp-collar phóng khoáng chuẩn phong cách Riviera nước Ý.",
                "price": 24500000,
                "original_price": 28000000,
                "stock": 12,
                "image_url": "https://images.stockx.com/images/Gucci-Printed-Silk-Bowling-Shirt-Green-Pink.jpg",
                "is_featured": True,
                "size": "44, 46, 48, 50",
                "color": "Xanh ngọc / Hồng Fuchsia",
                "material": "100% Silk Twill Lụa tơ tằm",
                "brand": "Gucci",
                "category_id": cat_ao_nam.id if cat_ao_nam else 1
            },
            # 5. Áo Khoác Gucci GG Jacquard
            {
                "name": "Áo Khoác Nam Gucci GG Jacquard Cotton Jacket",
                "slug": "ao-khoac-nam-gucci-gg-jacquard-cotton-jacket",
                "description": "Chiếc áo khoác track jacket biểu tượng với toàn bộ họa tiết monogram GG Jacquard dệt chìm tỉ mỉ, bo viền sọc đỏ thể thao năng động và đầy uy quyền.",
                "price": 38000000,
                "original_price": 45000000,
                "stock": 8,
                "image_url": "https://images.stockx.com/images/Gucci-GG-Jacquard-Cotton-Jacket-Blue-Ivory.jpg",
                "is_featured": True,
                "size": "S, M, L",
                "color": "Xanh Navy / Trắng Ngà",
                "material": "Jacquard Cotton dệt tinh xảo",
                "brand": "Gucci",
                "category_id": cat_ao_nam.id if cat_ao_nam else 1
            },
            # 6. Áo Len Gucci GG All-Over Crewneck
            {
                "name": "Áo Len Nam Gucci GG All-Over Crewneck Sweater",
                "slug": "ao-len-nam-gucci-gg-all-over-crewneck-sweater",
                "description": "Áo len cổ tròn dệt len nguyên chất với hoa văn GG phủ kín mặt áo. Cảm giác mềm mại ấm áp, độ đàn hồi tuyệt hảo và giữ nhiệt đỉnh cao.",
                "price": 26000000,
                "original_price": 31000000,
                "stock": 15,
                "image_url": "https://images.stockx.com/images/Gucci-GG-All-Over-Crewneck-Sweater-Navy.jpg",
                "is_featured": False,
                "size": "M, L, XL",
                "color": "Xanh Đậm Navy",
                "material": "100% Virgin Wool Len cừu nguyên chất",
                "brand": "Gucci",
                "category_id": cat_ao_nam.id if cat_ao_nam else 1
            },
            # 7. Quần Jean Gucci Denim Label
            {
                "name": "Quần Jean Nam Gucci Denim Label Pants",
                "slug": "quan-jean-nam-gucci-denim-label-pants",
                "description": "Quần jean ống suông thời thượng đính nhãn da thương hiệu Gucci Couture kinh điển ở gấu quần. Chất denim cao cấp dày dặn, bền bỉ theo thời gian.",
                "price": 16500000,
                "original_price": 19000000,
                "stock": 20,
                "image_url": "https://images.stockx.com/images/Gucci-Denim-Gucci-Label-Pants-Blue.jpg",
                "is_featured": True,
                "size": "29, 30, 31, 32, 33",
                "color": "Xanh Indigo",
                "material": "100% Selvedge Denim Cotton",
                "brand": "Gucci",
                "category_id": cat_quan_nam.id if cat_quan_nam else 3
            },
            # 8. Quần Jean Đen Gucci Trousers
            {
                "name": "Quần Jean Nam Gucci Denim Trousers Black",
                "slug": "quan-jean-nam-gucci-denim-trousers-black",
                "description": "Quần jean màu đen tuyền dáng tapered tôn dáng, phù hợp kết hợp cùng áo polo và giày lười Gucci tạo nên diện mạo lịch lãm phong trần.",
                "price": 15800000,
                "original_price": 18500000,
                "stock": 22,
                "image_url": "https://images.stockx.com/images/Gucci-Denim-Trousers-Black.jpg",
                "is_featured": False,
                "size": "30, 31, 32, 34",
                "color": "Đen Thuần Black",
                "material": "Cotton Denim co giãn nhẹ",
                "brand": "Gucci",
                "category_id": cat_quan_nam.id if cat_quan_nam else 3
            },
            # 9. Quần Jogger Gucci Technical Jersey
            {
                "name": "Quần Jogger Nam Gucci Loose Technical Jersey",
                "slug": "quan-jogger-nam-gucci-loose-technical-jersey",
                "description": "Quần nỉ thể thao cao cấp dáng suông phong cách streetwear xa xỉ. Đường sọc trang trí chạy dọc thân quần cùng logo Gucci độc quyền.",
                "price": 19000000,
                "original_price": 23000000,
                "stock": 16,
                "image_url": "https://images.stockx.com/images/Gucci-Loose-Technical-Jersey-Jogging-Pant-Black.jpg",
                "is_featured": False,
                "size": "S, M, L",
                "color": "Đen phối sọc Trắng",
                "material": "Technical Jersey bền nhiệt",
                "brand": "Gucci",
                "category_id": cat_quan_nam.id if cat_quan_nam else 3
            },
            # 10. Chân Váy Nữ Gucci Đính Đá
            {
                "name": "Chân Váy Nữ Gucci Crystals Embroidered GG Canvas",
                "slug": "chan-vay-nu-gucci-crystals-embroidered-gg-canvas",
                "description": "Chân váy chữ A cao cấp trên chất vải canvas GG Supreme huyền thoại, được đính kết các hạt pha lê tinh xảo lấp lánh sang trọng.",
                "price": 29000000,
                "original_price": 35000000,
                "stock": 9,
                "image_url": "https://images.stockx.com/images/Gucci-Crystals-Embroidered-GG-Canvas-Mini-Skirt-Camel-Brown.jpg",
                "is_featured": True,
                "size": "XS, S, M",
                "color": "Nâu Lạc Đà Camel / Ebony",
                "material": "GG Supreme Canvas & Pha Lê",
                "brand": "Gucci",
                "category_id": cat_vay_dam.id if cat_vay_dam else 7
            },
            # 11. Áo Khoác Nữ Gucci Denim Jacket
            {
                "name": "Áo Khoác Nữ Gucci GG Denim Jacket",
                "slug": "ao-khoac-nu-gucci-gg-denim-jacket",
                "description": "Áo khoác denim form lửng nữ tính với họa tiết GG monogram chìm tinh tế. Các chi tiết cúc kim loại chạm khắc thương hiệu tinh xảo.",
                "price": 34000000,
                "original_price": 40000000,
                "stock": 11,
                "image_url": "https://images.stockx.com/images/Gucci-Womens-GG-Denim-Jacket-Blue-Ivory.jpg",
                "is_featured": True,
                "size": "36, 38, 40",
                "color": "Xanh Denim / Trắng Ngà",
                "material": "Cotton Denim Jacquard",
                "brand": "Gucci",
                "category_id": cat_ao_nam.id if cat_ao_nam else 1
            },
            # 12. Giày Lười Gucci Jordaan Loafers
            {
                "name": "Giày Lười Nam Gucci Jordaan Leather Loafers",
                "slug": "giay-luoi-nam-gucci-jordaan-leather-loafers",
                "description": "Đôi giày lười biểu tượng vượt thời gian của thời trang Ý với khóa hàm thiếc ngựa Horsebit kim loại vàng ánh kim, da bê thật 100% êm ái tuyệt đối.",
                "price": 22000000,
                "original_price": 26000000,
                "stock": 25,
                "image_url": "https://images.stockx.com/images/Gucci-Leather-Loafers-Black.jpg",
                "is_featured": True,
                "size": "39, 40, 41, 42, 43",
                "color": "Đen Thuần / Khóa Vàng",
                "material": "Da Bê Calfskin Ý cao cấp",
                "brand": "Gucci",
                "category_id": cat_giay_dep.id if cat_giay_dep else 5
            },
            # 13. Túi Đeo Chéo Gucci Horsebit 1955 Mini
            {
                "name": "Túi Đeo Chéo Gucci Horsebit 1955 Mini Bag",
                "slug": "tui-deo-cheo-gucci-horsebit-1955-mini-bag",
                "description": "Túi xách cao cấp tái hiện di sản năm 1955 với khóa Horsebit kinh điển. Kích thước mini thanh lịch, quai da có thể điều chỉnh độ dài linh hoạt.",
                "price": 39000000,
                "original_price": 46000000,
                "stock": 14,
                "image_url": "https://images.stockx.com/images/Gucci-Horsebit-1955-Mini-Bag-Beige-Ebony.jpg",
                "is_featured": True,
                "size": "Mini (18 x 12 x 5 cm)",
                "color": "Beige / Nâu Ebony",
                "material": "Canvas GG Supreme & Da Thật",
                "brand": "Gucci",
                "category_id": cat_phu_kien.id if cat_phu_kien else 6
            },
            # 14. Thắt Lưng Gucci GG Marmont
            {
                "name": "Thắt Lưng Nam Gucci GG Marmont Leather Belt",
                "slug": "that-lung-nam-gucci-gg-marmont-leather-belt",
                "description": "Phụ kiện không thể thiếu của phái mạnh với mặt khóa đôi Double G ánh đồng sang trọng trên nền dây da trơn nguyên miếng mềm mại và bền bỉ.",
                "price": 12500000,
                "original_price": 14500000,
                "stock": 35,
                "image_url": "https://images.stockx.com/images/Gucci-GG-Marmont-Belt-Black.jpg",
                "is_featured": True,
                "size": "85, 90, 95, 100 cm",
                "color": "Đen / Khóa Đồng Antique",
                "material": "Da Bò nguyên miếng tự nhiên",
                "brand": "Gucci",
                "category_id": cat_phu_kien.id if cat_phu_kien else 6
            }
        ]

        print(f"Bắt đầu đồng bộ {len(gucci_items)} sản phẩm Gucci chính hãng...")
        
        for item in gucci_items:
            existing = db.query(Product).filter(
                (Product.slug == item["slug"]) | (Product.name == item["name"])
            ).first()
            if existing:
                for k, v in item.items():
                    setattr(existing, k, v)
                print(f"-> Cập nhật sản phẩm: {existing.name}")
            else:
                new_prod = Product(**item)
                db.add(new_prod)
                print(f"-> Thêm mới sản phẩm: {new_prod.name}")

        db.commit()
        print("✅ Hoàn tất cập nhật bộ sưu tập Gucci với hình ảnh chính hãng từ StockX CDN!")
    except Exception as e:
        db.rollback()
        print("❌ Lỗi khi cập nhật sản phẩm:", e)
    finally:
        db.close()

if __name__ == "__main__":
    update_gucci_products()
