@echo off
chcp 65001 > nul
echo ========================================================
echo   KHỞI ĐỘNG HỆ THỐNG BACKEND FASTAPI - FASHION STORE
echo ========================================================
echo.

cd /d "%~dp0\backend"
set PYTHONIOENCODING=utf-8

echo [*] Kiểm tra dữ liệu mẫu...
python -c "from database import SessionLocal; from models.product import Product; db = SessionLocal(); count = db.query(Product).count(); db.close(); print(f'Tong so san pham hien co: {count}')" 2>nul

echo [*] Đang khởi động Server FastAPI tại http://127.0.0.1:8000 ...
echo [*] Tài liệu Swagger UI xem tại: http://127.0.0.1:8000/docs
echo [*] Bấm Ctrl + C để dừng server.
echo.

python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
