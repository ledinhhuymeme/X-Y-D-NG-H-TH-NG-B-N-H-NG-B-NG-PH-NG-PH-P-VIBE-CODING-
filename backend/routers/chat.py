import re
import unicodedata
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import httpx

from database import get_db
from models.product import Product
from models.category import Category
from auth.jwt_handler import get_optional_current_user
from models.user import User
from config import settings

router = APIRouter(prefix="/api/chat", tags=["AI Chatbot tư vấn bán hàng"])


class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []


class ChatResponse(BaseModel):
    reply: str
    products: Optional[List[dict]] = []


def _strip_accents(text: str) -> str:
    """Loại bỏ dấu tiếng Việt để tìm kiếm thông minh hơn."""
    text = unicodedata.normalize('NFD', text)
    text = "".join(c for c in text if unicodedata.category(c) != 'Mn')
    return text.replace('đ', 'd').replace('Đ', 'D').lower()


def _get_product_context(db: Session) -> str:
    """Tạo context sản phẩm cho AI."""
    products = (
        db.query(Product)
        .filter(Product.is_active == True, Product.stock > 0)
        .limit(60)
        .all()
    )

    if not products:
        return "Hiện tại cửa hàng chưa có sản phẩm nào."

    product_lines = []
    for p in products:
        category = db.query(Category).filter(Category.id == p.category_id).first()
        cat_name = category.name if category else "Thời trang"
        line = (
            f"- {p.name} (ID: {p.id}) | Giá: {p.price:,.0f}đ"
            f" | Danh mục: {cat_name}"
            f" | Còn: {p.stock} cái"
            f"{f' | Size: {p.size}' if p.size else ''}"
            f"{f' | Màu: {p.color}' if p.color else ''}"
            f"{f' | Chất liệu: {p.material}' if p.material else ''}"
            f"{f' | Thương hiệu: {p.brand}' if p.brand else ''}"
        )
        product_lines.append(line)

    return "\n".join(product_lines)


SYSTEM_PROMPT = """Bạn là Stylist AI thông minh của "Boutique Huy Dinh".
Quy tắc cốt lõi:
1. Hỏi gì trả lời đúng trọng tâm nấy. Trả lời trực diện, súc tích, tự nhiên, KHÔNG lặp lại các câu chào khuôn mẫu sáo rỗng.
2. Nắm rõ ngữ cảnh câu hỏi của khách hàng: nếu khách hỏi giá thì báo giá, hỏi size thì tư vấn size, hỏi phối đồ thì đề xuất set đồ cụ thể từ danh sách sản phẩm.
3. Nếu khách hàng hỏi về chủ shop hoặc mã giảm giá, giới thiệu mã VIP 'HUYDINH50' (giảm 50% đơn hàng).
4. Không lặp lại cùng một câu mở đầu hay lời chào ở mỗi lượt trò chuyện.

Dữ liệu sản phẩm thực tế trong cửa hàng:
{products}
"""


@router.post("", response_model=ChatResponse)
async def chat_with_ai(
    chat_data: ChatMessage,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    product_context = _get_product_context(db)
    system_message = SYSTEM_PROMPT.format(products=product_context)

    # 1. Nếu có cấu hình OpenAI API key
    if settings.OPENAI_API_KEY:
        reply = await _chat_openai(system_message, chat_data)
        matched_products = _extract_matched_products(chat_data.message, db)
        return ChatResponse(reply=reply, products=matched_products)

    # 2. Nếu có cấu hình Gemini API key
    if settings.GEMINI_API_KEY:
        reply = await _chat_gemini(system_message, chat_data)
        if not reply.startswith("AI Gemini phản hồi:") and not reply.startswith("Xin lỗi"):
            matched_products = _extract_matched_products(chat_data.message, db)
            return ChatResponse(reply=reply, products=matched_products)

    # 3. Bộ não tư vấn phản xạ tự nhiên (Smart Natural AI Engine) không lặp từ
    reply, matched_products = _smart_natural_chat(chat_data.message, chat_data.conversation_history or [], db)
    return ChatResponse(reply=reply, products=matched_products)


async def _chat_openai(system_message: str, chat_data: ChatMessage) -> str:
    messages = [{"role": "system", "content": system_message}]
    for msg in (chat_data.conversation_history or []):
        messages.append(msg)
    messages.append({"role": "user", "content": chat_data.message})

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": messages,
                    "max_tokens": 500,
                    "temperature": 0.6,
                },
            )
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return f"Xin lỗi, kết nối OpenAI gặp sự cố: {str(e)}"


async def _chat_gemini(system_message: str, chat_data: ChatMessage) -> str:
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            contents = []
            for msg in (chat_data.conversation_history or []):
                role = "user" if msg.get("role") == "user" else "model"
                contents.append({
                    "role": role,
                    "parts": [{"text": msg.get("content", "")}],
                })
            contents.append({
                "role": "user",
                "parts": [{"text": chat_data.message}],
            })

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            payload = {
                "system_instruction": {"parts": [{"text": system_message}]},
                "contents": contents,
                "generationConfig": {
                    "maxOutputTokens": 600,
                    "temperature": 0.5,
                },
            }
            response = await client.post(url, json=payload)
            data = response.json()
            if "candidates" in data and len(data["candidates"]) > 0:
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
            elif "error" in data:
                return f"AI Gemini phản hồi: {data['error'].get('message', 'Không thể tạo nội dung')}"
            else:
                return "AI chưa phản hồi được nội dung này."
    except Exception as e:
        return f"Xin lỗi, hệ thống AI đang bận. ({str(e)})"


def _extract_matched_products(message: str, db: Session, limit: int = 4) -> List[dict]:
    """Tìm sản phẩm trùng khớp với câu hỏi của khách."""
    msg_raw = message.lower()
    msg_no_accent = _strip_accents(msg_raw)
    
    products = db.query(Product).filter(Product.is_active == True, Product.stock > 0).all()
    results = []

    for p in products:
        p_name = p.name.lower()
        p_name_no_accent = _strip_accents(p_name)
        p_brand = (p.brand or "").lower()

        # So khớp tên hoặc nhãn hiệu
        score = 0
        if any(w in msg_raw for w in p_name.split() if len(w) >= 3):
            score += 2
        if any(w in msg_no_accent for w in p_name_no_accent.split() if len(w) >= 3):
            score += 2
        if p_brand and (p_brand in msg_raw or p_brand in msg_no_accent):
            score += 3
        
        # Nhận diện loại trang phục
        categories_map = {
            "áo thun": ["áo thun", "t-shirt", "ao thun"],
            "sơ mi": ["sơ mi", "so mi", "shirt"],
            "blazer": ["blazer", "vest", "suit", "áo khoác", "ao khoac"],
            "quần": ["quần", "quan", "jean", "tây", "kaki", "short"],
            "đầm": ["đầm", "dam", "váy", "vay", "dress"],
            "giày": ["giày", "giay", "sneaker", "oxford", "cao gót", "loafer"],
            "túi": ["túi", "tui", "ví", "clutch", "balo"],
            "kính": ["kính", "kinh", "mắt kính"],
            "đồng hồ": ["đồng hồ", "dong ho", "watch"],
            "nước hoa": ["nước hoa", "nuoc hoa", "perfume"]
        }
        for kw_group in categories_map.values():
            if any(k in msg_raw or k in msg_no_accent for k in kw_group):
                if any(k in p_name or k in p_name_no_accent for k in kw_group):
                    score += 4

        if score > 0:
            results.append((score, p))

    results.sort(key=lambda x: x[0], reverse=True)
    return [
        {
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "image_url": p.image_url,
            "stock": p.stock,
            "brand": p.brand
        }
        for _, p in results[:limit]
    ]


def _smart_natural_chat(message: str, history: List[dict], db: Session) -> tuple[str, List[dict]]:
    """
    Bộ xử lý hội thoại tự nhiên, hiểu ngữ cảnh câu hỏi, trả lời trực diện,
    không lặp lại câu văn sáo rỗng hay khuôn mẫu kiểu chatbot cũ.
    """
    msg = message.strip()
    msg_lower = msg.lower()
    msg_clean = _strip_accents(msg_lower)

    # 1. Câu hỏi về mã giảm giá, voucher, khuyến mãi hoặc chủ tiệm Huy Dinh
    if any(k in msg_clean for k in ["ma giam gia", "giam gia", "voucher", "coupon", "khuyen mai", "huy dinh", "chu shop", "chu tiem", "sale"]):
        return (
            "Hiện tại Boutique đang có mã độc quyền **HUYDINH50** — áp dụng giảm ngay **50% toàn bộ đơn hàng** khi bạn thanh toán tại giỏ hàng.\n"
            "Mã áp dụng cho cả hàng mới và sản phẩm cao cấp, bạn có thể nhập trực tiếp ở bước thanh toán nhé!",
            []
        )

    # 2. Câu hỏi về Giá / Báo giá
    if any(k in msg_clean for k in ["gia bao nhieu", "bao nhieu tien", "gia ca", "gia sao", "co dat khong", "gia re"]):
        matched = _extract_matched_products(message, db, limit=4)
        if matched:
            lines = [f"Dưới đây là giá các mẫu bạn đang quan tâm:"]
            for p in matched:
                lines.append(f"• **{p['name']}**: **{p['price']:,.0f}đ** (Còn {p['stock']} sản phẩm)")
            lines.append("\nKhi nhập mã **HUYDINH50**, bạn sẽ được giảm thêm 50% trên mức giá này.")
            return ("\n".join(lines), matched)
        return (
            "Các sản phẩm tại Boutique Huy Dinh có phân khúc giá từ **199.000đ** (áo basic) đến các dòng may đo cao cấp từ **850.000đ - 3.200.000đ**.\n"
            "Bạn đang muốn tham khảo mức giá của loại trang phục nào (áo thun, sơ mi, blazer, đầm hay giày)?",
            []
        )

    # 3. Câu hỏi về Size / Chiều cao, Cân nặng
    weight_match = re.search(r'(\d{2,3})\s*(kg|kí|ký)', msg_lower)
    height_match = re.search(r'(\d{1}[m,.]\d{1,2}|\d{3})\s*(cm|m)?', msg_lower)
    if weight_match or height_match or any(k in msg_clean for k in ["size", "bang size", "vua khong", "chieu cao", "can nang", "mac size gi"]):
        advised_size = "M"
        detail = ""
        if weight_match:
            w = int(weight_match.group(1))
            if w < 53:
                advised_size = "S"
            elif w <= 63:
                advised_size = "M"
            elif w <= 74:
                advised_size = "L"
            else:
                advised_size = "XL"
            detail = f"Với cân nặng khoảng **{w}kg**, bạn mặc chuẩn nhất là **Size {advised_size}**."
        else:
            detail = (
                "Bảng size chuẩn của Boutique:\n"
                "• **Size S**: 45 - 53kg (1m50 - 1m62)\n"
                "• **Size M**: 54 - 63kg (1m60 - 1m70)\n"
                "• **Size L**: 64 - 72kg (1m68 - 1m76)\n"
                "• **Size XL**: Trên 73kg (1m75 trở lên)"
            )
        return (
            f"{detail}\nForm áo và quần tại shop được may theo chuẩn Regular & Slim-fit tôn dáng, chất vải co giãn nhẹ nên mặc rất thoải mái.",
            []
        )

    # 4. Tư vấn phối đồ (Mix & Match) theo phong cách hoặc sự kiện
    if any(k in msg_clean for k in ["phoi do", "mix do", "di tiec", "di lam", "hen ho", "da hoi", "di choi", "phong cach", "set do"]):
        matched = _extract_matched_products(message, db, limit=4)
        if not matched:
            matched = _extract_matched_products("blazer sơ mi quần tây đầm", db, limit=3)
        return (
            "Gợi ý phối đồ chuẩn đẹp cho bạn:\n"
            "• **Phong cách Thanh Lịch/Công Sở**: Áo Sơ Mi Lụa kết hợp Blazer may đo + Quần tây xếp ly và Giày da Oxford.\n"
            "• **Phong cách Dự Tiệc/Hẹn Hò**: Đầm Satin dạ hội xẻ tà phối cùng Giày cao gót mũi nhọn và Túi xách mini.\n"
            "• **Phong cách Dạo Phố Thoải Mái**: Áo Polo/Thun Cotton cao cấp + Quần Kaki hoặc Short kết hợp Sneaker trắng.\n\n"
            "Các món trong set đều có sẵn tại kho bên dưới, bạn bấm vào từng mẫu để xem chi tiết ảnh chụp và chất liệu nhé!",
            matched
        )

    # 5. Khách hỏi tìm kiếm sản phẩm cụ thể (áo, quần, váy, đầm, giày, túi, v.v...)
    matched_products = _extract_matched_products(message, db, limit=4)
    if matched_products:
        reply_lines = [f"Dưới đây là các mẫu phù hợp với yêu cầu của bạn:"]
        for p in matched_products:
            reply_lines.append(f"• **{p['name']}** — Giá: **{p['price']:,.0f}đ** (Còn {p['stock']} cái)")
        reply_lines.append("\nBạn có thể nhấn vào từng sản phẩm bên dưới để xem hình ảnh chi tiết hoặc thêm trực tiếp vào giỏ hàng.")
        return ("\n".join(reply_lines), matched_products)

    # 6. Lời chào ngắn gọn (không lặp đi lặp lại văn vẻ)
    if any(k in msg_clean for k in ["chao", "hello", "hi", "hey", "alo"]):
        return (
            "Chào bạn! Bạn đang cần tìm đồ nam hay nữ, hoặc cần tư vấn mẫu trang phục nào hôm nay?",
            []
        )

    # 7. Phản hồi trực tiếp khi khách hỏi những câu thông thường khác
    return (
        f"Tôi đã nhận được câu hỏi về: '{msg}'.\n"
        "Bạn có thể cho biết cụ thể hơn về nhu cầu (ví dụ: cần tìm áo sơ mi, váy đầm, đồ đi làm, tầm giá nào, hoặc chiều cao cân nặng) để tôi lọc chuẩn sản phẩm cho bạn ngay nhé!",
        []
    )
