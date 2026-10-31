"""
Script cập nhật 15 sản phẩm Quần Áo Gucci THẬT 100% - ĐÚNG TÊN, ĐÚNG ẢNH, ĐÚNG MÃ CHÍNH HÃNG.
Chạy: python add_gucci_products.py
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from database import SessionLocal
from models.category import Category
from models.product import Product

# Danh sách 15 sản phẩm Quần Áo Gucci thật 100% từ Vua Hàng Hiệu / Gucci Official
gucci_items = [
    # 1. Áo Polo Nam Striped Collar Embroidered Logo In Beige
    {
        "name": "Áo Polo Nam Gucci Striped Colar Embroidered Logo In Beige 788024 XJGJY 2219",
        "slug": "ao-polo-nam-gucci-striped-colar-embroidered-logo-in-beige-788024-xjgjy-2219",
        "description": "Áo polo nam Gucci 788024 XJGJY 2219 dệt từ chất liệu Cotton Piquet cao cấp mềm mại, thoáng mát và co giãn nhẹ. Thiết kế cổ bẻ viền sọc nổi bật kết hợp logo thêu tinh xảo trước ngực.",
        "price": 14500000,
        "original_price": 16500000,
        "stock": 20,
        "image_url": "https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/07/ao-polo-nam-gucci-striped-colar-embroidered-logo-in-beige-788024-xjgjy-2219-mau-be-size-s-66a7b29a27c7f-29072024103106.jpg",
        "is_featured": True,
        "size": "S, M, L, XL",
        "color": "Màu Be",
        "material": "100% Cotton Piquet Ý",
        "brand": "Gucci",
        "cat_slug": "ao-nam"
    },
    # 2. Áo Polo Nam Navy Check Polo With Pink Collar
    {
        "name": "Áo Polo Nam Gucci Navy Check Polo With Pink Collar 768579 XJF4N 4140",
        "slug": "ao-polo-nam-gucci-navy-check-polo-with-pink-collar-768579-xjf4n-4140",
        "description": "Áo Polo nam Gucci Navy Check họa tiết kẻ sọc xanh navy kết hợp cổ dệt sắc hồng tương phản độc đáo. Chất liệu vải thun dệt cao cấp, dáng slim fit hiện đại chuẩn phong cách quý ông thanh lịch.",
        "price": 15600000,
        "original_price": 17800000,
        "stock": 15,
        "image_url": "https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/11/ao-polo-nam-gucci-navy-check-polo-with-pink-collar-768579-xjf4n-4140-mau-xanh-navy-size-xs-673abf16b2cd6-18112024110302.jpg",
        "is_featured": True,
        "size": "XS, S, M, L",
        "color": "Xanh Navy Phối Hồng",
        "material": "100% Cotton dệt Jacquard",
        "brand": "Gucci",
        "cat_slug": "ao-nam"
    },
    # 3. Áo Sơ Mi Nam Double G Print Shirt With Mixed Patterns
    {
        "name": "Áo Sơ Mi Nam Gucci Double G Print Shirt With Mixed Patterns 787257 ZAQPD 9194",
        "slug": "ao-so-mi-nam-gucci-double-g-print-shirt-787257-zaqpd-9194",
        "description": "Áo sơ mi nam Gucci với sự pha trộn họa tiết Double G monogram trên chất liệu cotton poplin thượng hạng. Thiết kế cúc cài tinh xảo cùng phom dáng suông phóng khoáng tạo nên phong cách sang trọng nổi bật.",
        "price": 10080000,
        "original_price": 12500000,
        "stock": 18,
        "image_url": "https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/11/ao-so-mi-nam-gucci-double-g-print-shirt-with-mixed-patterns-787257-zaqpd-9194-mau-nau-trang-size-48-673abe8be52e6-18112024110043.jpg",
        "is_featured": True,
        "size": "46, 48, 50, 52",
        "color": "Nâu Trắng Họa Tiết GG",
        "material": "100% Cotton Poplin",
        "brand": "Gucci",
        "cat_slug": "ao-nam"
    },
    # 4. Áo Sơ Mi Nam Cotton Bowling In White
    {
        "name": "Áo Sơ Mi Nam Gucci Cotton Bowling In White 791771 ZAQ0R 9669",
        "slug": "ao-so-mi-nam-gucci-cotton-bowling-in-white-791771-zaq0r-9669",
        "description": "Áo sơ mi cổ bowling Gucci màu trắng sữa sang trọng, điểm nhấn đường viền tương phản và chất vải cotton thoáng khí cao cấp. Thích hợp cho kỳ nghỉ mát dưỡng và phong cách resort wear thời thượng.",
        "price": 16800000,
        "original_price": 19500000,
        "stock": 12,
        "image_url": "https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/11/ao-so-mi-nam-gucci-cotton-bowling-in-white-791771-zaq0r-9669-mau-trang-size-xs-673abd9eb0155-18112024105646.jpg",
        "is_featured": True,
        "size": "XS, S, M, L",
        "color": "Trắng Kem",
        "material": "100% Cotton Ý",
        "brand": "Gucci",
        "cat_slug": "ao-nam"
    },
    # 5. Áo Sơ Mi Nam Blue Shirt With Multiple Letters
    {
        "name": "Áo Sơ Mi Nam Gucci Blue Shirt With Multiple Letters 770438 ZAOBM 4061",
        "slug": "ao-so-mi-nam-gucci-blue-shirt-with-multiple-letters-770438-zaobm-4061",
        "description": "Mẫu áo sơ mi tay dài Gucci in tràn ký tự chữ lồng thương hiệu đa sắc trên nền xanh Blue quý phái. Form áo đứng dáng thanh lịch, cúc áo dập chìm tên thương hiệu.",
        "price": 18000000,
        "original_price": 21000000,
        "stock": 14,
        "image_url": "https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/11/ao-so-mi-nam-gucci-blue-shirt-with-multiple-letters-770438-zaobm-4061-mau-xanh-blue-size-50-673abc5aa2ee2-18112024105122.jpg",
        "is_featured": False,
        "size": "48, 50, 52",
        "color": "Xanh Blue Họa Tiết",
        "material": "Cotton lụa cao cấp",
        "brand": "Gucci",
        "cat_slug": "ao-nam"
    },
    # 6. Áo Sơ Mi Nam Gucci Be Xám
    {
        "name": "Áo Sơ Mi Nam Gucci 782499 ZAQD8 2270 Màu Be Xám",
        "slug": "ao-so-mi-nam-gucci-782499-zaqd8-2270-mau-be-xam",
        "description": "Thiết kế áo sơ mi tối giản mang hơi thở đương đại của Gucci với tông màu be xám trung tính, dễ dàng phối hợp cùng quần tây hoặc quần âu cho phong cách công sở cao cấp.",
        "price": 12000000,
        "original_price": 14000000,
        "stock": 16,
        "image_url": "https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/11/ao-so-mi-nam-gucci-782499-zaqd8-2270-mau-be-xam-size-46-673ab9a3e30f1-18112024103947.jpg",
        "is_featured": False,
        "size": "46, 48, 50",
        "color": "Be Xám",
        "material": "100% Cotton Poplin Ý",
        "brand": "Gucci",
        "cat_slug": "ao-nam"
    },
    # 7. Áo Khoác Hai Mặt Gucci Reversible Blue Monogram Jacket
    {
        "name": "Áo Khoác Hai Mặt Nam Gucci Reversible Blue Monogram Jacket 406011 Z9687 3371",
        "slug": "ao-khoac-hai-mat-nam-gucci-reversible-blue-monogram-jacket-406011-z9687-3371",
        "description": "Áo khoác gió bomber Gucci mặc được 2 mặt: một mặt họa tiết Monogram GG xanh lá/xanh biển sang trọng, một mặt trơn tối giản. Khóa kéo cao cấp chống gió, chống nước nhẹ.",
        "price": 23500000,
        "original_price": 28000000,
        "stock": 10,
        "image_url": "https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/11/ao-khoac-hai-mat-nam-gucci-reversible-blue-monogram-jacket-406011-z9687-3371-mau-xanh-la-size-56-673ab90d3d528-18112024103717.jpg",
        "is_featured": True,
        "size": "48, 50, 52, 54, 56",
        "color": "Xanh Lá / Xanh Navy Monogram",
        "material": "Polyester kén gió kỹ thuật cao cấp",
        "brand": "Gucci",
        "cat_slug": "ao-nam"
    },
    # 8. Áo Len Nam Gucci Monogram
    {
        "name": "Áo Len Nam Gucci Monogram GAK99 GU100 161 Màu Xám Họa Tiết",
        "slug": "ao-len-nam-gucci-monogram-gak99-gu100-161",
        "description": "Áo len dệt kim Gucci Jacquard với hoa văn monogram cổ điển đan xen, chất liệu len wool ấm áp mềm mượt không gây dặm ngứa, bo gấu tay và vạt áo chắc chắn.",
        "price": 10800000,
        "original_price": 13500000,
        "stock": 15,
        "image_url": "https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/12/ao-len-nam-gucci-monogram-gak99-gu100-161-mau-xam-hoa-tiet-size-l-675e2363574c8-14122024190803.jpg",
        "is_featured": True,
        "size": "M, L, XL",
        "color": "Xám Họa Tiết GG",
        "material": "Len dệt Wool cao cấp",
        "brand": "Gucci",
        "cat_slug": "ao-nam"
    },
    # 9. Quần Jean Nam Gucci 408637 XDBCD 4009 Màu Xanh Nhạt
    {
        "name": "Quần Jean Nam Gucci 408637 XDBCD 4009 Màu Xanh Nhạt",
        "slug": "quan-jean-nam-gucci-408637-xdbcd-4009-mau-xanh-nhat",
        "description": "Quần jean nam Gucci form straight fit kinh điển wash màu xanh sáng trẻ trung. Đường may chỉ vàng nổi chắc chắn, tag da bò phía sau in dập logo Gucci Florence biểu tượng.",
        "price": 12000000,
        "original_price": 14500000,
        "stock": 25,
        "image_url": "https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/11/quan-jean-nam-gucci-408637-xdbcd-4009-mau-xanh-nhat-size-32-673ab8bbd3ac5-18112024103555.jpg",
        "is_featured": True,
        "size": "29, 30, 31, 32, 33, 34",
        "color": "Xanh Nhạt Denim",
        "material": "100% Cotton Denim Ý",
        "brand": "Gucci",
        "cat_slug": "quan-nam"
    },
    # 10. Quần Jean Nam Gucci Monogram 649092 XDBK1 4266
    {
        "name": "Quần Jean Nam Gucci Monogram 649092 XDBK1 4266 Màu Xanh Họa Tiết",
        "slug": "quan-jean-nam-gucci-monogram-649092-xdbk1-4266",
        "description": "Mẫu quần jean dệt hoa văn GG Supreme chìm toàn thân quần cực kỳ đẳng cấp và độc quyền của Gucci. Form dáng ống đứng tôn vóc dáng mạnh mẽ.",
        "price": 16800000,
        "original_price": 19500000,
        "stock": 18,
        "image_url": "https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/11/quan-jean-nam-gucci-monogram-649092-xdbk1-4266-mau-xanh-hoa-tiet-size-32-673ab87140f0d-18112024103441.jpg",
        "is_featured": True,
        "size": "30, 31, 32, 33, 34",
        "color": "Xanh Denim Dệt Monogram GG",
        "material": "Denim Jacquard Organic Cotton",
        "brand": "Gucci",
        "cat_slug": "quan-nam"
    },
    # 11. Quần Jean Nam Gucci Monogram 623953 XDCXD 4632
    {
        "name": "Quần Jean Nam Gucci Monogram 623953 XDCXD 4632 Màu Xanh Họa Tiết",
        "slug": "quan-jean-nam-gucci-monogram-623953-xdcxd-4632",
        "description": "Quần jean nam Gucci Monogram hoa văn dập viền laser sắc sảo, đinh tán và nút cài mạ đồng phong cách vintage. Một tuyệt tác thời trang đường phố cao cấp.",
        "price": 16500000,
        "original_price": 18900000,
        "stock": 20,
        "image_url": "https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/11/quan-jean-nam-gucci-monogram-623953-xdcxd-4632-mau-xanh-hoa-tiet-size-32-673ab6fc49ae2-18112024102828.jpg",
        "is_featured": False,
        "size": "29, 30, 31, 32, 33",
        "color": "Xanh Họa Tiết GG",
        "material": "100% Cotton Denim Ý",
        "brand": "Gucci",
        "cat_slug": "quan-nam"
    },
    # 12. Quần Jean Nam Gucci 774080 XDCUY 4759 Màu Xanh Đậm
    {
        "name": "Quần Jean Nam Gucci 774080 XDCUY 4759 Màu Xanh Đậm",
        "slug": "quan-jean-nam-gucci-774080-xdcuy-4759-mau-xanh-dam",
        "description": "Quần jean Gucci xanh đậm indigo phong cách tối giản thanh lịch, chất vải co giãn nhẹ đem lại sự thoải mái tối đa trong mọi cử động hàng ngày.",
        "price": 15000000,
        "original_price": 17200000,
        "stock": 22,
        "image_url": "https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/11/quan-jean-nam-gucci-774080-xdcuy-4759-mau-xanh-dam-size-32-673ab60d69616-18112024102429.jpg",
        "is_featured": False,
        "size": "30, 31, 32, 33, 34",
        "color": "Xanh Đậm Indigo",
        "material": "Cotton Denim 98%, Elastane 2%",
        "brand": "Gucci",
        "cat_slug": "quan-nam"
    },
    # 13. Quần Jean Nam Gucci 430368 XR611 4395 Màu Xanh Họa Tiết
    {
        "name": "Quần Jean Nam Gucci 430368 XR611 4395 Màu Xanh Họa Tiết",
        "slug": "quan-jean-nam-gucci-430368-xr611-4395-mau-xanh-hoa-tiet",
        "description": "Mẫu quần jean Gucci wash hiệu ứng bạc màu độc đáo, kết hợp thêu chi tiết hoa văn độc quyền tinh xảo, thể hiện cá tính thời trang sành điệu bậc nhất.",
        "price": 13200000,
        "original_price": 15500000,
        "stock": 16,
        "image_url": "https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/11/quan-jean-nam-gucci-430368-xr611-4395-mau-xanh-hoa-tiet-size-32-673ab5bc10e9f-18112024102308.jpg",
        "is_featured": False,
        "size": "30, 31, 32, 33",
        "color": "Xanh Họa Tiết Wash",
        "material": "Denim Cotton Cao Cấp",
        "brand": "Gucci",
        "cat_slug": "quan-nam"
    },
    # 14. Quần Jean Nam Gucci Wash 623953 XDBFM 4009 Màu Xanh Nhạt
    {
        "name": "Quần Jean Nam Gucci Wash 623953 XDBFM 4009 Màu Xanh Nhạt",
        "slug": "quan-jean-nam-gucci-wash-623953-xdbfm-4009-mau-xanh-nhat",
        "description": "Quần jean nam Gucci Wash 623953 màu xanh nhạt retro, ống suông nhẹ dễ mặc, lưng quần phối đỉa da và phụ kiện mạ đồng sáng bóng.",
        "price": 12000000,
        "original_price": 14000000,
        "stock": 20,
        "image_url": "https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/11/quan-jean-nam-gucci-wash-623953-xdbfm-4009-mau-xanh-nhat-size-31-673ab50b691bf-18112024102011.jpg",
        "is_featured": False,
        "size": "29, 30, 31, 32, 33",
        "color": "Xanh Nhạt Retro",
        "material": "Denim 100% Cotton",
        "brand": "Gucci",
        "cat_slug": "quan-nam"
    },
    # 15. Quần Gió Nam Gucci Moon Striped Flag Jogger 604171 XDAX3 9061
    {
        "name": "Quần Gió Nam Gucci Moon Striped Flag Jogger 604171 XDAX3 9061 Màu Trắng",
        "slug": "quan-gio-nam-gucci-moon-striped-flag-jogger-604171-xdax3-9061",
        "description": "Quần jogger dù thể thao Gucci Moon Striped Flag viền sọc cờ đặc trưng, chất vải dù cao cấp nhẹ nhàng, thoáng khí và cản gió tốt, bo gấu cá tính năng động.",
        "price": 10800000,
        "original_price": 13000000,
        "stock": 18,
        "image_url": "https://cdn.vuahanghieu.com/unsafe/0x500/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/11/quan-gio-nam-gucci-moon-striped-flag-jogger-604171-xdax3-9061-mau-trang-size-46-673ac28236142-18112024111810.jpg",
        "is_featured": True,
        "size": "44, 46, 48, 50",
        "color": "Trắng Viền Sọc",
        "material": "Nylon kỹ thuật cao cấp",
        "brand": "Gucci",
        "cat_slug": "quan-nam"
    }
]

def add_gucci():
    db = SessionLocal()
    try:
        categories = {c.slug: c.id for c in db.query(Category).all()}
        print("Danh sách category hiện có:", categories)
        
        # Xóa các sản phẩm Gucci mẫu cũ nếu có để đảm bảo 100% sản phẩm Gucci là hàng thật
        old_dummy_gucci = db.query(Product).filter(
            Product.brand == "Gucci",
            Product.image_url.like("%unsplash.com%")
        ).all()
        if old_dummy_gucci:
            print(f"Đang xóa {len(old_dummy_gucci)} sản phẩm Gucci ảnh minh họa cũ...")
            for old_p in old_dummy_gucci:
                db.delete(old_p)
            db.commit()

        added_count = 0
        updated_count = 0

        for item in gucci_items:
            cat_slug = item.pop("cat_slug")
            cat_id = categories.get(cat_slug)
            if not cat_id:
                print(f"Bỏ qua {item['name']} vì không tìm thấy cat_slug: {cat_slug}")
                continue
            item["category_id"] = cat_id

            existing = db.query(Product).filter(Product.slug == item["slug"]).first()
            if existing:
                for k, v in item.items():
                    setattr(existing, k, v)
                updated_count += 1
            else:
                prod = Product(**item)
                db.add(prod)
                added_count += 1

        db.commit()
        print(f"✅ Hoàn tất! Đã thêm mới: {added_count} sản phẩm Gucci THẬT, cập nhật: {updated_count} sản phẩm.")
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_gucci()
