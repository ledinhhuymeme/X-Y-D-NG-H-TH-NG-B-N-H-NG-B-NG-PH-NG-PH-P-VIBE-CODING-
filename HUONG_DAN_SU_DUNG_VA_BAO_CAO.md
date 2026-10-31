# 🛍️ BÁO CÁO NGHIỆM THU HỆ THỐNG FULL-STACK - BOUTIQUE HUY DINH

> **Dự án**: Website Thương mại điện tử Thời trang Cao cấp (Boutique Huy Dinh)  
> **Chủ thương hiệu**: Huy Dinh  
> **Phương pháp phát triển**: Vibe Coding with AI Agent  
> **Kiến trúc**: Client/Server - Full-Stack SPA & RESTful API với FastAPI & SQLAlchemy  
> **Database**: SQLite (phát triển tức thì) / MySQL tương thích  

---

## 1. Danh sách các chức năng & API Endpoints

### 🔐 Phân hệ Xác thực & Khách hàng (User)
| Chức năng | Phương thức & URL | Mô tả |
| :--- | :--- | :--- |
| **Đăng ký tài khoản** | `POST /api/auth/register` | Đăng ký tài khoản mới kèm mã hóa mật khẩu bcrypt |
| **Đăng nhập** | `POST /api/auth/login` | Xác thực người dùng và cấp JWT Bearer Token |
| **Thông tin cá nhân** | `GET /api/auth/me` | Lấy profile người dùng hiện tại |
| **Cập nhật profile** | `PUT /api/auth/me` | Sửa họ tên, số điện thoại, địa chỉ, URL avatar |
| **Tải lên Avatar** | `POST /api/auth/upload-avatar` | Tải ảnh đại diện từ máy tính (PNG, JPG, WebP), lưu trữ tự động |
| **Đổi mật khẩu** | `PUT /api/auth/change-password` | Đổi mật khẩu bảo mật |

### 👗 Phân hệ Sản phẩm & Danh mục (Catalog)
| Chức năng | Phương thức & URL | Mô tả |
| :--- | :--- | :--- |
| **Danh mục sản phẩm** | `GET /api/categories` | Lấy toàn bộ danh mục đang hoạt động |
| **Chi tiết danh mục** | `GET /api/categories/{id}` | Lấy thông tin danh mục theo ID hoặc slug |
| **Khám phá sản phẩm** | `GET /api/products` | Hỗ trợ phân trang, tìm kiếm từ khóa, lọc theo danh mục, khoảng giá `min_price`/`max_price`, sắp xếp |
| **Sản phẩm nổi bật** | `GET /api/products/featured` | Lấy danh sách sản phẩm `is_featured` cho Banner/Trang chủ |
| **Chi tiết sản phẩm** | `GET /api/products/{id_or_slug}` | Xem toàn bộ chi tiết, hình ảnh, size, màu, tồn kho |
| **Đánh giá & Review** | `GET /api/products/{id}/reviews` <br> `POST /api/products/{id}/reviews` | Khách hàng đánh giá sao (1-5) và bình luận |

### 🛒 Phân hệ Giỏ hàng & Đơn hàng (Cart & Order)
| Chức năng | Phương thức & URL | Mô tả |
| :--- | :--- | :--- |
| **Xem giỏ hàng** | `GET /api/cart` | Lấy giỏ hàng, tự động tính tổng tiền `total_amount` |
| **Thêm vào giỏ** | `POST /api/cart/items` | Thêm sản phẩm, cộng dồn số lượng nếu đã có |
| **Cập nhật số lượng** | `PUT /api/cart/items/{item_id}` | Tăng/giảm số lượng sản phẩm |
| **Xóa khỏi giỏ** | `DELETE /api/cart/items/{item_id}` | Xóa 1 sản phẩm hoặc xóa sạch giỏ hàng |
| **Tạo đơn hàng** | `POST /api/orders` | Đặt hàng từ giỏ hàng, tạo mã đơn hàng, trừ tồn kho |
| **Lịch sử đơn hàng** | `GET /api/orders/my-orders` | Xem các đơn đã mua và trạng thái đơn |
| **Chi tiết đơn hàng** | `GET /api/orders/{id}` | Xem chi tiết từng món hàng, địa chỉ giao |
| **Hủy đơn hàng** | `PUT /api/orders/{id}/cancel` | Hủy đơn khi đang ở trạng thái chờ xử lý |

### 📊 Phân hệ Quản trị viên (Admin Dashboard)
| Chức năng | Phương thức & URL | Mô tả |
| :--- | :--- | :--- |
| **Thống kê tổng quan** | `GET /api/admin/dashboard/stats` | Tổng doanh thu, tổng số đơn, tổng khách hàng, tổng sản phẩm |
| **Biểu đồ doanh thu** | `GET /api/admin/dashboard/revenue-chart` | Doanh thu theo ngày/tháng |
| **Thống kê theo danh mục** | `GET /api/admin/dashboard/category-stats` | Tỷ trọng sản phẩm và đơn hàng |
| **CRUD Sản phẩm** | `POST /api/admin/products` <br> `PUT /api/admin/products/{id}` <br> `DELETE /api/admin/products/{id}` | Thêm, sửa, xóa và cập nhật tồn kho |
| **CRUD Danh mục** | `POST /api/admin/categories` <br> `PUT /api/admin/categories/{id}` <br> `DELETE /api/admin/categories/{id}` | Thêm, sửa, xóa danh mục sản phẩm |
| **Quản lý đơn hàng** | `GET /api/admin/orders` <br> `PUT /api/admin/orders/{id}/status` | Xem toàn bộ đơn hàng, lọc theo trạng thái, cập nhật tiến độ giao |
| **Quản lý người dùng** | `GET /api/admin/users` <br> `PUT /api/admin/users/{id}/toggle-active` | Danh sách tài khoản và kích hoạt/khóa |

### 🤖 Phân hệ Nâng cao: AI Chatbot Tư vấn bán hàng
| Chức năng | Phương thức & URL | Mô tả |
| :--- | :--- | :--- |
| **AI Sales Assistant** | `POST /api/chat` | Tích hợp ngữ cảnh sản phẩm thời trang trong database, tự động tư vấn, tìm đồ phù hợp ngân sách, hỗ trợ OpenAI GPT, Google Gemini và Fallback thông minh. |

---

## 2. Tài khoản thử nghiệm có sẵn trong Database

| Vai trò | Email | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@fashionstore.vn` | `admin123` | Toàn quyền quản trị Dashboard & CRUD |
| **Khách hàng 1** | `an@gmail.com` | `123456` | Mua hàng, giỏ hàng, đánh giá |
| **Khách hàng 2** | `binh@gmail.com` | `123456` | Mua hàng, giỏ hàng, đánh giá |
| **Khách hàng 3** | `cuong@gmail.com` | `123456` | Mua hàng, giỏ hàng, đánh giá |

---

## 3. Bộ sưu tập thời trang cao cấp Gucci CHÍNH HÃNG THẬT 100% (Hình ảnh & Tên thật)

Hệ thống đã cập nhật bộ sưu tập **15 sản phẩm Quần Áo Gucci Thật 100%** với đầy đủ mã sản phẩm, ảnh chụp trực tiếp sắc nét từ Vua Hàng Hiệu / Gucci Official Store:
1. **Áo Polo Nam Gucci Striped Colar Embroidered Logo In Beige 788024 XJGJY 2219** (14.500.000 đ)
2. **Áo Polo Nam Gucci Navy Check Polo With Pink Collar 768579 XJF4N 4140** (15.600.000 đ)
3. **Áo Sơ Mi Nam Gucci Double G Print Shirt With Mixed Patterns 787257 ZAQPD 9194** (10.080.000 đ)
4. **Áo Sơ Mi Nam Gucci Cotton Bowling In White 791771 ZAQ0R 9669** (16.800.000 đ)
5. **Áo Sơ Mi Nam Gucci Blue Shirt With Multiple Letters 770438 ZAOBM 4061** (18.000.000 đ)
6. **Áo Sơ Mi Nam Gucci 782499 ZAQD8 2270 Màu Be Xám** (12.000.000 đ)
7. **Áo Khoác Hai Mặt Nam Gucci Reversible Blue Monogram Jacket 406011 Z9687 3371** (23.500.000 đ)
8. **Áo Len Nam Gucci Monogram GAK99 GU100 161 Màu Xám Họa Tiết** (10.800.000 đ)
9. **Quần Jean Nam Gucci 408637 XDBCD 4009 Màu Xanh Nhạt** (12.000.000 đ)
10. **Quần Jean Nam Gucci Monogram 649092 XDBK1 4266 Màu Xanh Họa Tiết** (16.800.000 đ)
11. **Quần Jean Nam Gucci Monogram 623953 XDCXD 4632 Màu Xanh Họa Tiết** (16.500.000 đ)
12. **Quần Jean Nam Gucci 774080 XDCUY 4759 Màu Xanh Đậm** (15.000.000 đ)
13. **Quần Jean Nam Gucci 430368 XR611 4395 Màu Xanh Họa Tiết** (13.200.000 đ)
14. **Quần Jean Nam Gucci Wash 623953 XDBFM 4009 Màu Xanh Nhạt** (12.000.000 đ)
15. **Quần Gió Nam Gucci Moon Striped Flag Jogger 604171 XDAX3 9061 Màu Trắng** (10.800.000 đ)

*Script nạp dữ liệu*: [add_gucci_products.py](file:///e:/KETTHUOCHOCPHAN/backend/add_gucci_products.py)

---

## 4. Cách khởi chạy và kiểm thử

1. **Khởi động server**:
   - Chạy file: `run_backend.bat`  
   - Hoặc gõ lệnh:
     ```bash
     cd backend
     python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
     ```
2. **Truy cập tài liệu API tương tác**:
   - **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **Redoc UI**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
   - Bấm nút `Authorize` trên Swagger và nhập token đăng nhập để test các endpoint yêu cầu quyền Admin hoặc Customer.
