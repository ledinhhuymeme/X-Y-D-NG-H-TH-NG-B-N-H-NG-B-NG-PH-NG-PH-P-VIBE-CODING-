@echo off
chcp 65001 > nul
title Boutique Huy Dinh - Fashion Store Launcher
echo ======================================================================
echo          BOUTIQUE HUY DINH - HỆ THỐNG THỜI TRANG CAO CẤP
echo ======================================================================
echo.

set ROOT_DIR=%~dp0
set BACKEND_DIR=%ROOT_DIR%backend
set FRONTEND_DIR=%ROOT_DIR%frontend

echo [*] Đang kiểm tra môi trường Python...
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [LỖI] Không tìm thấy Python trên máy tính của bạn!
    echo Vui lòng cài đặt Python (nhớ tích chọn 'Add Python to PATH').
    pause
    exit /b 1
)

echo [OK] Python đã sẵn sàng.
echo.

echo [*] Đang kiểm tra & cài đặt thư viện cần thiết...
python -m pip install -r "%BACKEND_DIR%\requirements.txt" -q --no-warn-script-location

echo [*] Khởi tạo dữ liệu mẫu nếu chưa có...
python -c "from database import init_db; from seed import seed_data; init_db(); seed_data()" 2>nul

echo [*] Đang khởi động Backend FastAPI (Port 8000)...
start "Boutique Huy Dinh - Backend FastAPI" cmd /k "cd /d \"%BACKEND_DIR%\" && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo [*] Đợi 3 giây để Backend khởi động xong...
timeout /t 3 > nul

echo [*] Đang khởi động Frontend Web Server (Port 3000)...
start "Boutique Huy Dinh - Frontend Server" cmd /k "python -m http.server 3000 --directory \"%FRONTEND_DIR%\""

timeout /t 2 > nul

echo [*] Đang tự động mở trình duyệt web...
start "" "http://localhost:3000"

echo.
echo ======================================================================
echo   🎉 HỆ THỐNG ĐÃ KHỞI CHẠY THÀNH CÔNG!
echo.
echo   - 🌐 Giao diện Website:   http://localhost:3000
echo   - 🌐 Giao diện dự phòng: http://127.0.0.1:8000/app
echo   - 📚 Tài liệu API Docs:   http://127.0.0.1:8000/docs
echo   - 🤖 AI Stylist:          Đã tích hợp sẵn (mã giảm giá HUYDINH50)
echo ======================================================================
echo.
echo Giữ hai cửa sổ console đang mở để duy trì máy chủ.
pause
