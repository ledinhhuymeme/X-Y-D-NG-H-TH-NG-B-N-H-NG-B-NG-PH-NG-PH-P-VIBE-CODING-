@echo off
chcp 65001 > nul
echo ========================================================
echo   MỞ GIAO DIỆN THỜI TRANG LUMIÈRE FASHION STORE
echo ========================================================
echo.

set FRONTEND_FILE=%~dp0frontend\index.html

echo [*] Đang kiểm tra trạng thái Backend FastAPI tại http://127.0.0.1:8000 ...
python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)" > nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Backend chưa chạy. Đang tự động mở Backend trong cửa sổ mới...
    start "Backend FastAPI" cmd /c "%~dp0run_backend.bat"
    timeout /t 3 > nul
) else (
    echo [OK] Backend FastAPI đang chạy sẵn sàng!
)

echo [*] Đang khởi động máy chủ Web Frontend tại cổng 3000...
start "Frontend Web Server" cmd /c "python -m http.server 3000 --directory %~dp0frontend"
timeout /t 2 > nul

echo [*] Đang mở giao diện trên trình duyệt của bạn: http://localhost:3000 ...
start "" "http://localhost:3000"

echo.
echo ========================================================
echo   Giao diện đã được mở thành công!
echo   - Khách hàng: Mua sắm, lọc, giỏ hàng, đặt hàng
echo   - Quản trị: Bấm 'Quản trị Admin' (Tài khoản demo có sẵn trên form)
echo   - AI Stylist: Bấm nút tròn góc phải dưới màn hình
echo ========================================================
echo.
pause
