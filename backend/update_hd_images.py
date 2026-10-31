"""
Script nâng cấp toàn bộ hình ảnh sản phẩm thời trang trong CSDL SQLite sang ảnh thời trang Studio HD tuyệt đẹp, chuẩn phân giải cao.
"""
from database import SessionLocal
from models.product import Product
from models.category import Category

# Bảng map ảnh thời trang chuyên nghiệp cao cấp chuẩn Unsplash HD (800px)
HIGH_QUALITY_IMAGES = {
    # 1. Áo nam
    "ao-thun-nam-basic-cotton": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    "ao-polo-nam-cao-cap": "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&auto=format&fit=crop&q=80",
    "ao-so-mi-nam-trang-slim-fit": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    "ao-khoac-bomber-nam": "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80",

    # 2. Áo nữ
    "ao-croptop-nu-the-thao": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    "ao-kieu-nu-tay-phong": "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&auto=format&fit=crop&q=80",
    "ao-so-mi-nu-oversize": "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800&auto=format&fit=crop&q=80",

    # 3. Quần nam
    "quan-jean-nam-slim-fit": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=80",
    "quan-kaki-nam-cong-so": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80",
    "quan-short-nam-the-thao": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop&q=80",

    # 4. Quần nữ
    "quan-jean-nu-ong-rong": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
    "quan-culottes-nu-thanh-lich": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80",

    # 5. Giày dép
    "giay-sneaker-nam-trang-classic": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80",
    "giay-the-thao-running": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
    "sandal-nu-quai-cheo": "https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=800&auto=format&fit=crop&q=80",

    # 6. Phụ kiện
    "tui-tote-vai-canvas": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
    "kinh-mat-thoi-trang-unisex": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
    "non-bucket-hat": "https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=800&auto=format&fit=crop&q=80",

    # 7. Váy đầm
    "dam-maxi-hoa-nhi": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",
    "vay-cong-so-a-line": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
}

# Cập nhật ảnh danh mục thời trang đẹp mắt
CATEGORY_IMAGES = {
    "ao-nam": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
    "ao-nu": "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&auto=format&fit=crop&q=80",
    "quan-nam": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80",
    "quan-nu": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80",
    "giay-dep": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80",
    "phu-kien": "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&auto=format&fit=crop&q=80",
    "vay-dam": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
}

def update_images():
    db = SessionLocal()
    try:
        updated_count = 0
        products = db.query(Product).all()
        for p in products:
            if p.slug in HIGH_QUALITY_IMAGES:
                p.image_url = HIGH_QUALITY_IMAGES[p.slug]
                updated_count += 1
            elif not p.image_url or "photo-1515886657613" in p.image_url:
                p.image_url = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80"
                updated_count += 1

        cats = db.query(Category).all()
        for c in cats:
            if c.slug in CATEGORY_IMAGES:
                c.image_url = CATEGORY_IMAGES[c.slug]

        db.commit()
        print(f"✅ Đã nâng cấp thành công {updated_count} hình ảnh sản phẩm thời trang HD!")
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_images()
