import sqlite3

# Danh sách cập nhật các sản phẩm bị lỗi ảnh:
# 1. ID 18: Nón Bucket Hat (Unsplash 404)
# 2. ID 48-62: 15 sản phẩm Gucci từ vuahanghieu bị chặn 403 Forbidden
# -> Cập nhật URL ảnh Unsplash CDN chuẩn HD, load cực nhanh, không bao giờ bị chặn

UPDATES = {
    # Nón Bucket Hat
    18: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&auto=format&fit=crop&q=80",
    
    # Áo Polo Nam Gucci Striped Colar In Beige
    48: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80",
    
    # Áo Polo Nam Gucci Navy Check Polo
    49: "https://images.unsplash.com/photo-1625910513413-7e4cb79e72aa?w=800&auto=format&fit=crop&q=80",
    
    # Áo Sơ Mi Nam Gucci Double G Print Shirt
    50: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
    
    # Áo Sơ Mi Nam Gucci Cotton Bowling White
    51: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    
    # Áo Sơ Mi Nam Gucci Blue Shirt With Multiple Letters
    52: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80",
    
    # Áo Sơ Mi Nam Gucci Be Xám
    53: "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800&auto=format&fit=crop&q=80",
    
    # Áo Khoác Hai Mặt Nam Gucci Reversible Blue Monogram
    54: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80",
    
    # Áo Len Nam Gucci Monogram Màu Xám Họa Tiết
    55: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80",
    
    # Quần Jean Nam Gucci Màu Xanh Nhạt
    56: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=80",
    
    # Quần Jean Nam Gucci Monogram Xanh Họa Tiết
    57: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
    
    # Quần Jean Nam Gucci Monogram Xanh Họa Tiết 2
    58: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop&q=80",
    
    # Quần Jean Nam Gucci Xanh Đậm
    59: "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&auto=format&fit=crop&q=80",
    
    # Quần Jean Nam Gucci Xanh Họa Tiết Vintage
    60: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&auto=format&fit=crop&q=80",
    
    # Quần Jean Nam Gucci Wash Xanh Nhạt
    61: "https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&auto=format&fit=crop&q=80",
    
    # Quần Gió Nam Gucci Moon Striped Flag Jogger Trắng
    62: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80",
}

def update_images():
    conn = sqlite3.connect("fashion_store.db")
    cursor = conn.cursor()
    for pid, url in UPDATES.items():
        cursor.execute("UPDATE products SET image_url = ? WHERE id = ?", (url, pid))
    conn.commit()
    print(f"Da cap nhat thanh cong {len(UPDATES)} anh san pham!")
    
    # Kiểm tra lại xem còn domain vuahanghieu nào không
    cursor.execute("SELECT count(*) FROM products WHERE image_url LIKE '%vuahanghieu%'")
    remaining = cursor.fetchone()[0]
    print(f"So luong anh loi vuahanghieu con lai: {remaining}")
    conn.close()

if __name__ == "__main__":
    update_images()
