"""
Script mở rộng thêm 30+ sản phẩm thời trang cao cấp Studio HD vào CSDL SQLite.
"""
from database import SessionLocal
from models.product import Product
from models.category import Category

NEW_PRODUCTS = [
    # 1. Áo nam (Category ID 1 hoặc slug "ao-nam")
    {
        "name": "Áo Khoác Da Biker Nam Classic",
        "slug": "ao-khoac-da-biker-nam-classic",
        "description": "Áo khoác da biker phong trần chuẩn quý ông, lót nỉ ấm áp, khóa kéo hợp kim chống gỉ.",
        "price": 890000,
        "original_price": 1250000,
        "stock": 35,
        "image_url": "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800&auto=format&fit=crop&q=80",
        "is_featured": True,
        "size": "M, L, XL",
        "color": "Đen Classic, Nâu Cà Phê",
        "material": "Da PU thượng hạng",
        "brand": "Lumière Homme",
        "category_slug": "ao-nam"
    },
    {
        "name": "Áo Hoodie Nam Oversized Nỉ Bông",
        "slug": "ao-hoodie-nam-oversized-ni-bong",
        "description": "Áo hoodie nỉ bông định lượng cao 380gsm, form thụng streetwear năng động, giữ ấm hoàn hảo.",
        "price": 420000,
        "original_price": 550000,
        "stock": 80,
        "image_url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
        "is_featured": False,
        "size": "L, XL, XXL",
        "color": "Xám Tiêu, Đen, Xanh Rêu",
        "material": "Nỉ chân cua 100% Cotton",
        "brand": "UrbanStyle",
        "category_slug": "ao-nam"
    },
    {
        "name": "Áo Len Nam Cổ Lọ Dệt Kim",
        "slug": "ao-len-nam-co-lo-det-kim",
        "description": "Áo len cổ lọ dệt kim len cừu mịn màng, tôn dáng lịch lãm, thích hợp phối kèm blazer và trench coat.",
        "price": 530000,
        "original_price": 690000,
        "stock": 40,
        "image_url": "https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?w=800&auto=format&fit=crop&q=80",
        "is_featured": True,
        "size": "M, L, XL",
        "color": "Kem Be, Nâu Đất, Đen",
        "material": "Len dệt kim cao cấp",
        "brand": "Lumière Homme",
        "category_slug": "ao-nam"
    },
    {
        "name": "Áo Blazer Nam May Đo Thanh Lịch",
        "slug": "ao-blazer-nam-may-do-thanh-lich",
        "description": "Áo blazer nam kiểu dáng Modern Fit chuẩn phong cách Ý, may đo tinh xảo với ve áo sắc nét.",
        "price": 1250000,
        "original_price": 1690000,
        "stock": 25,
        "image_url": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80",
        "is_featured": True,
        "size": "48, 50, 52",
        "color": "Xanh Navy, Xám Khói, Đen",
        "material": "Wool pha Tuyết Mưa",
        "brand": "Giovanni Sartoria",
        "category_slug": "ao-nam"
    },
    {
        "name": "Áo Thun Dài Tay Cổ Tròn Nam",
        "slug": "ao-thun-dai-tay-co-tron-nam",
        "description": "Áo thun dài tay cotton compact co giãn 4 chiều mềm mịn, không xù lông sau nhiều lần giặt.",
        "price": 240000,
        "original_price": 310000,
        "stock": 95,
        "image_url": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80",
        "is_featured": False,
        "size": "S, M, L, XL",
        "color": "Trắng, Đen, Xanh Rêu",
        "material": "Cotton Compact",
        "brand": "FashionVN",
        "category_slug": "ao-nam"
    },

    # 2. Áo nữ (Category "ao-nu")
    {
        "name": "Áo Blazer Nữ Dáng Suông Công Sở",
        "slug": "ao-blazer-nu-dang-suong-cong-so",
        "description": "Blazer dáng suông thời thượng phong cách Hàn Quốc, độn vai thanh thoát tạo phong thái tự tin.",
        "price": 680000,
        "original_price": 890000,
        "stock": 50,
        "image_url": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80",
        "is_featured": True,
        "size": "S, M, L",
        "color": "Be Trầm, Đen, Nâu Tây",
        "material": "Tuyết mưa cao cấp",
        "brand": "Elise Atelier",
        "category_slug": "ao-nu"
    },
    {
        "name": "Áo Len Nữ Cardigan Vintage Cúc Gỗ",
        "slug": "ao-len-nu-cardigan-vintage-cuc-go",
        "description": "Áo cardigan len dệt thừng cổ chữ V đính cúc gỗ mộc mạc, chất len mềm mại không gây ngứa.",
        "price": 460000,
        "original_price": 590000,
        "stock": 65,
        "image_url": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop&q=80",
        "is_featured": False,
        "size": "Freesize",
        "color": "Kem Sữa, Nâu Nhạt, Xanh Pastel",
        "material": "Len lông cừu tổng hợp",
        "brand": "Lumière Chic",
        "category_slug": "ao-nu"
    },
    {
        "name": "Áo Khoác Măng Tô Dạ Nữ Cổ Danton",
        "slug": "ao-khoac-mang-to-da-nu-co-danton",
        "description": "Măng tô dạ dáng dài quý phái, dây thắt lưng tôn eo, thiết kế sang trọng cho mùa đông.",
        "price": 1490000,
        "original_price": 1950000,
        "stock": 20,
        "image_url": "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80",
        "is_featured": True,
        "size": "S, M, L",
        "color": "Camel Nâu Bò, Đen Huyền Bí",
        "material": "Dạ ép 2 mặt thượng hạng",
        "brand": "Lumière Couture",
        "category_slug": "ao-nu"
    },
    {
        "name": "Áo Thun Nữ In Họa Tiết Nghệ Thuật",
        "slug": "ao-thun-nu-in-hoa-tiet-nghe-thuat",
        "description": "Áo thun nữ dáng baby tee tôn dáng, in tranh sơn dầu nghệ thuật sắc nét không bong tróc.",
        "price": 220000,
        "original_price": 290000,
        "stock": 110,
        "image_url": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
        "is_featured": False,
        "size": "XS, S, M",
        "color": "Trắng Ngà, Đen, Hồng Phấn",
        "material": "100% Cotton 2 chiều",
        "brand": "ActiveWear",
        "category_slug": "ao-nu"
    },

    # 3. Quần nam (Category "quan-nam")
    {
        "name": "Quần Tây Nam Xếp Ly Phong Cách Ý",
        "slug": "quan-tay-nam-xep-ly-phong-cach-y",
        "description": "Quần tây xếp 2 ly cạp cao sartorial, có tăng đơ hông linh hoạt không cần thắt lưng.",
        "price": 580000,
        "original_price": 750000,
        "stock": 45,
        "image_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
        "is_featured": True,
        "size": "29, 30, 31, 32, 33",
        "color": "Ghi Sáng, Nâu Cigar, Xanh Midnight",
        "material": "Vải Wool pha Spandex",
        "brand": "Giovanni Sartoria",
        "category_slug": "quan-nam"
    },
    {
        "name": "Quần Jogger Nam Túi Hộp Streetwear",
        "slug": "quan-jogger-nam-tui-hop-streetwear",
        "description": "Quần túi hộp cargo dáng jogger bo gấu thể thao, nhiều ngăn tiện lợi, chất vải kaki thun dẻo dai.",
        "price": 390000,
        "original_price": 520000,
        "stock": 70,
        "image_url": "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=80",
        "is_featured": False,
        "size": "M, L, XL, XXL",
        "color": "Xanh Rêu Quân Đội, Đen, Xám Xi Măng",
        "material": "Kaki Cotton Spandex",
        "brand": "UrbanStyle",
        "category_slug": "quan-nam"
    },
    {
        "name": "Quần Jean Nam Rách Gối Cá Tính",
        "slug": "quan-jean-nam-rach-goi-ca-tinh",
        "description": "Quần jean wash bạc mài rách gối nhẹ bụi bặm, form skinny tôn chân thon gọn.",
        "price": 510000,
        "original_price": 680000,
        "stock": 60,
        "image_url": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
        "is_featured": False,
        "size": "29, 30, 31, 32, 34",
        "color": "Xanh Denim Bạc, Đen Smoke",
        "material": "Denim wash co giãn",
        "brand": "LeviStyle",
        "category_slug": "quan-nam"
    },

    # 4. Quần nữ (Category "quan-nu")
    {
        "name": "Quần Suông Nữ Cạp Siêu Cao Tôn Dáng",
        "slug": "quan-suong-nu-cap-sieu-cao-ton-dang",
        "description": "Quần suông dài quét đất hack chân thon dài, khóa kéo hông mượt mà tạo đường cong quyến rũ.",
        "price": 450000,
        "original_price": 580000,
        "stock": 60,
        "image_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80",
        "is_featured": True,
        "size": "S, M, L",
        "color": "Trắng Kem, Đen, Nâu Tây",
        "material": "Vải chéo Hàn Quốc không nhăn",
        "brand": "Elise Atelier",
        "category_slug": "quan-nu"
    },
    {
        "name": "Quần Short Nữ Dạ Tweed Cao Cấp",
        "slug": "quan-short-nu-da-tweed-cao-cap",
        "description": "Quần short dạ tweed kim tuyến đính khuy ngọc trai, thích hợp phối kèm áo len hoặc áo blazer dạ.",
        "price": 360000,
        "original_price": 490000,
        "stock": 55,
        "image_url": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop&q=80",
        "is_featured": False,
        "size": "S, M, L",
        "color": "Hồng Hạt Dẻ, Đen Trắng Ziczac",
        "material": "Dạ Tweed lót lụa habutai",
        "brand": "Lumière Chic",
        "category_slug": "quan-nu"
    },

    # 5. Váy đầm (Category "vay-dam")
    {
        "name": "Đầm Lụa Satin 2 Dây Dạ Hội Sang Trọng",
        "slug": "dam-lua-satin-2-day-da-hoi-sang-trong",
        "description": "Đầm slip dress lụa satin bóng nhẹ ôm trọn đường cong, xẻ tà cao quyến rũ cho các buổi tiệc rượu tối.",
        "price": 950000,
        "original_price": 1390000,
        "stock": 30,
        "image_url": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80",
        "is_featured": True,
        "size": "XS, S, M",
        "color": "Đỏ Rượu Vang, Đen Sang Trọng, Vàng Champagne",
        "material": "Lụa Satin Ý cao cấp",
        "brand": "Lumière Couture",
        "category_slug": "vay-dam"
    },
    {
        "name": "Đầm Chữ A Phối Ren Cổ Vuông Quý Tộc",
        "slug": "dam-chu-a-phoi-ren-co-vuong-quy-toc",
        "description": "Thiết kế cổ vuông tôn xương quai xanh, tay phồng nhẹ tiểu thư phối ren thêu tay thủ công.",
        "price": 720000,
        "original_price": 920000,
        "stock": 40,
        "image_url": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",
        "is_featured": True,
        "size": "S, M, L",
        "color": "Trắng Tinh Khôi, Xanh Pastel",
        "material": "Tơ sống phối ren cotton",
        "brand": "Elise Atelier",
        "category_slug": "vay-dam"
    },
    {
        "name": "Đầm Ôm Body Len Dệt Kim Tôn Dáng",
        "slug": "dam-om-body-len-det-kim-ton-dang",
        "description": "Váy bodycon len tăm cổ 3 phân ôm sát quyến rũ, chất len co giãn thoải mái khi vận động.",
        "price": 490000,
        "original_price": 650000,
        "stock": 45,
        "image_url": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80",
        "is_featured": False,
        "size": "Freesize",
        "color": "Đen, Nâu Moka, Xám Đậm",
        "material": "Len tăm Rib-knit",
        "brand": "Lumière Chic",
        "category_slug": "vay-dam"
    },
    {
        "name": "Chân Váy Xếp Ly Dáng Dài Vintage",
        "slug": "chan-vay-xep-ly-dang-dai-vintage",
        "description": "Chân váy dập ly nhỏ tinh tế, độ rủ bay bổng tự nhiên, cạp thun co giãn dễ phối mọi phong cách.",
        "price": 380000,
        "original_price": 490000,
        "stock": 70,
        "image_url": "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80",
        "is_featured": False,
        "size": "Freesize",
        "color": "Be Ánh Kim, Đen, Xanh Rêu Nhạt",
        "material": "Chiffon dập ly 2 lớp",
        "brand": "UrbanStyle",
        "category_slug": "vay-dam"
    },

    # 6. Giày dép (Category "giay-dep")
    {
        "name": "Giày Tây Nam Oxford Da Bò Thật",
        "slug": "giay-tay-nam-oxford-da-bo-that",
        "description": "Giày da Oxford may thủ công đường chỉ chắc chắn, đế cao su chống trượt tạo tiếng êm khi bước đi.",
        "price": 1350000,
        "original_price": 1850000,
        "stock": 25,
        "image_url": "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&auto=format&fit=crop&q=80",
        "is_featured": True,
        "size": "39, 40, 41, 42, 43",
        "color": "Đen Bóng, Nâu Hạt Dẻ Đánh Patina",
        "material": "Da bò thật 100% lót da cừu",
        "brand": "Giovanni Sartoria",
        "category_slug": "giay-dep"
    },
    {
        "name": "Giày Cao Gót Mũi Nhọn 7cm Quyến Rũ",
        "slug": "giay-cao-got-mui-nhon-7cm-quyen-ru",
        "description": "Giày cao gót mũi nhọn gót mảnh 7cm tôn dáng, lót đệm êm ái chống đau gót chân suốt ngày dài.",
        "price": 590000,
        "original_price": 790000,
        "stock": 40,
        "image_url": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80",
        "is_featured": True,
        "size": "35, 36, 37, 38, 39",
        "color": "Đỏ Nổi Bật, Nude Trang Nhã, Đen Huyền",
        "material": "Da microfiber siêu êm",
        "brand": "Lumière Footwear",
        "category_slug": "giay-dep"
    },
    {
        "name": "Giày Loafer Nam Chuông Tua Rua Da Mềm",
        "slug": "giay-loafer-nam-chuong-tua-rua-da-mem",
        "description": "Tassel Loafer trẻ trung lịch lãm, dễ xỏ chân không cần buộc dây, tiện lợi cho quý ông hiện đại.",
        "price": 890000,
        "original_price": 1150000,
        "stock": 35,
        "image_url": "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop&q=80",
        "is_featured": False,
        "size": "39, 40, 41, 42",
        "color": "Nâu Đậm, Đen",
        "material": "Da Microfiber cao cấp",
        "brand": "Lumière Homme",
        "category_slug": "giay-dep"
    },
    {
        "name": "Giày Sneaker Cổ Thấp Chunky Đế Cao",
        "slug": "giay-sneaker-co-thap-chunky-de-cao",
        "description": "Sneaker chunky tăng chiều cao 5cm êm nhẹ, phong cách trẻ trung năng động mix đồ cực chất.",
        "price": 650000,
        "original_price": 850000,
        "stock": 50,
        "image_url": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80",
        "is_featured": False,
        "size": "36, 37, 38, 39, 40, 41, 42",
        "color": "Trắng Xám Phối Be",
        "material": "Vải lưới dệt phối da tổng hợp",
        "brand": "ActiveWear",
        "category_slug": "giay-dep"
    },

    # 7. Phụ kiện (Category "phu-kien")
    {
        "name": "Túi Xách Nữ Quai Tròn Mini Da Cá Sấu",
        "slug": "tui-xach-nu-quai-tron-mini-da-ca-sau",
        "description": "Túi xách đeo chéo vân dập da cá sấu sắc sảo, ổ khóa mạ vàng ánh kim lấp lánh nâng tầm trang phục.",
        "price": 750000,
        "original_price": 1050000,
        "stock": 30,
        "image_url": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
        "is_featured": True,
        "size": "20cm x 15cm x 8cm",
        "color": "Xanh Cổ Vịt, Đen Sang, Nâu Hổ Phách",
        "material": "Da PU dập vân cá sấu",
        "brand": "Lumière Leather",
        "category_slug": "phu-kien"
    },
    {
        "name": "Đồng Hồ Nam Cơ Tự Động Mặt Sapphire",
        "slug": "dong-ho-nam-co-tu-dong-mat-sapphire",
        "description": "Đồng hồ lộ cơ mặt kính sapphire chống xước tuyệt đối, chống nước 5ATM, dây thép không gỉ 316L.",
        "price": 2890000,
        "original_price": 3690000,
        "stock": 15,
        "image_url": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&auto=format&fit=crop&q=80",
        "is_featured": True,
        "size": "Đường kính mặt 40mm",
        "color": "Mặt Xanh Navy Dây Bạc, Mặt Đen Dây Vàng Hồng",
        "material": "Thép 316L & Kính Sapphire",
        "brand": "Lumière Chrono",
        "category_slug": "phu-kien"
    },
    {
        "name": "Thắt Lưng Nam Da Bò Khóa Tự Động",
        "slug": "that-lung-nam-da-bo-khoa-tu-dong",
        "description": "Dây nịt nam da bò nguyên tấm nguyên miếng, đầu khóa kim loại đúc chống trầy xước sang trọng.",
        "price": 320000,
        "original_price": 450000,
        "stock": 85,
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
        "is_featured": False,
        "size": "Bản rộng 3.5cm, Dài 120cm",
        "color": "Đen, Nâu Đậm",
        "material": "Da bò thật 100%",
        "brand": "FashionVN",
        "category_slug": "phu-kien"
    },
    {
        "name": "Khăn Lụa Vuông Tơ Tằm Họa Tiết Baroque",
        "slug": "khan-lua-vuong-to-tam-hoa-tiet-baroque",
        "description": "Khăn lụa tơ tằm mềm mịn mát lạnh, in họa tiết hoàng gia Baroque quý phái dùng thắt cổ hoặc quấn túi xách.",
        "price": 260000,
        "original_price": 350000,
        "stock": 65,
        "image_url": "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&auto=format&fit=crop&q=80",
        "is_featured": False,
        "size": "70cm x 70cm",
        "color": "Cam Hermes, Xanh Hoàng Gia, Đỏ Bordeaux",
        "material": "Tơ tằm Mulberry 100%",
        "brand": "Lumière Chic",
        "category_slug": "phu-kien"
    },
    {
        "name": "Kính Mát Phi Công Mạ Vàng Chống Tia UV400",
        "slug": "kinh-mat-phi-cong-ma-vang-chong-tia-uv400",
        "description": "Kính phi công gọng kim loại mạ vàng titan siêu nhẹ, tròng phân cực Polarized bảo vệ mắt toàn diện.",
        "price": 480000,
        "original_price": 650000,
        "stock": 40,
        "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
        "is_featured": True,
        "size": "Unisex tiêu chuẩn",
        "color": "Gọng Vàng Mắt Đen Khói, Gọng Bạc Mắt Tráng Gương",
        "material": "Titanium & Tròng Polarized",
        "brand": "Lumière Eyewear",
        "category_slug": "phu-kien"
    }
]

def add_products():
    db = SessionLocal()
    try:
        # Lay danh sach categories co san
        categories = db.query(Category).all()
        cat_map = {c.slug: c.id for c in categories}

        added = 0
        for item in NEW_PRODUCTS:
            slug = item["slug"]
            existing = db.query(Product).filter(Product.slug == slug).first()
            if existing:
                continue

            cat_id = cat_map.get(item["category_slug"], 1)
            prod_dict = {k: v for k, v in item.items() if k != "category_slug"}
            prod_dict["category_id"] = cat_id

            new_prod = Product(**prod_dict)
            db.add(new_prod)
            added += 1

        db.commit()
        total_prods = db.query(Product).count()
        print(f"SUCCESS: Added {added} new products. Total products now: {total_prods}")
    except Exception as e:
        db.rollback()
        print("ERROR:", repr(e))
    finally:
        db.close()

if __name__ == "__main__":
    add_products()
