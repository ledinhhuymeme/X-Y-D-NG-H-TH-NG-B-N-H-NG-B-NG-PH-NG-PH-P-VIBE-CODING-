from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import engine, Base
from models import *  # noqa: F401, F403 - Import tất cả models để tạo tables

from routers.auth import router as auth_router
from routers.products import router as products_router
from routers.categories import router as categories_router
from routers.cart import router as cart_router
from routers.orders import router as orders_router
from routers.reviews import router as reviews_router
from routers.admin import router as admin_router
from routers.chat import router as chat_router

# Tạo FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/docs",        # Swagger UI
    redoc_url="/redoc",      # ReDoc
    openapi_url="/openapi.json",
)

# CORS Middleware - Cho phép Frontend truy cập API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Tạo tất cả tables khi khởi động
@app.on_event("startup")
def on_startup():
    """Tạo các bảng trong database khi server khởi động."""
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables verified/created successfully!")


# Đăng ký tất cả routers
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(categories_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(reviews_router)
app.include_router(admin_router)
app.include_router(chat_router)


import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

if os.path.exists(frontend_dir):
    @app.get("/qr_payment.png", include_in_schema=False)
    def serve_qr_image():
        qr_path = os.path.join(frontend_dir, "qr_payment.png")
        if os.path.exists(qr_path):
            return FileResponse(qr_path)
        return {"error": "QR image not found"}

    @app.get("/app", include_in_schema=False)
    @app.get("/app/{full_path:path}", include_in_schema=False)
    def serve_frontend_app(full_path: str = ""):
        # Nếu yêu cầu file tĩnh trong frontend (như style.css, app.js)
        file_path = os.path.join(frontend_dir, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dir, "index.html"))

    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")


# Root endpoint
@app.get("/", tags=["Root"])
def root():
    """Trang chủ API hoặc chuyển hướng tới web app."""
    return {
        "message": "🛍️ Chào mừng đến với Fashion Store API!",
        "version": settings.APP_VERSION,
        "frontend_app": "/app",
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "auth": "/api/auth",
            "products": "/api/products",
            "categories": "/api/categories",
            "cart": "/api/cart",
            "orders": "/api/orders",
            "admin": "/api/admin",
            "chat": "/api/chat",
        },
    }


@app.get("/health", tags=["Root"])
def health_check():
    """Kiểm tra trạng thái server."""
    return {"status": "healthy", "message": "Server đang hoạt động bình thường ✅"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

