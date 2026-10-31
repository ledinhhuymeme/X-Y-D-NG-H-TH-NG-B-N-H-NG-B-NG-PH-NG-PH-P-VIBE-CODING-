from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"             # Chờ xử lý
    CONFIRMED = "confirmed"         # Đã xác nhận
    SHIPPING = "shipping"           # Đang giao hàng
    DELIVERED = "delivered"         # Đã giao hàng
    COMPLETED = "completed"         # Hoàn thành
    CANCELLED = "cancelled"         # Đã hủy


class PaymentMethod(str, enum.Enum):
    COD = "cod"                     # Thanh toán khi nhận hàng
    BANK_TRANSFER = "bank_transfer" # Chuyển khoản ngân hàng
    CREDIT_CARD = "credit_card"     # Thẻ tín dụng (giả lập)
    E_WALLET = "e_wallet"           # Ví điện tử (giả lập)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_code = Column(String(50), unique=True, nullable=False, index=True)  # Mã đơn hàng: ORD-20241022-001
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    shipping_fee = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    final_amount = Column(Float, nullable=False)  # = total_amount + shipping_fee - discount
    status = Column(SAEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    payment_method = Column(SAEnum(PaymentMethod), default=PaymentMethod.COD, nullable=False)
    shipping_name = Column(String(100), nullable=False)
    shipping_phone = Column(String(20), nullable=False)
    shipping_address = Column(String(500), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String(255), nullable=False)       # Snapshot tên sản phẩm tại thời điểm mua
    product_price = Column(Float, nullable=False)             # Snapshot giá tại thời điểm mua
    product_image = Column(String(500), nullable=True)        # Snapshot ảnh
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
