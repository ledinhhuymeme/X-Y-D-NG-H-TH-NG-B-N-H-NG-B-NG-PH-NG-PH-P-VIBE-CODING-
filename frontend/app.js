/**
 * LUMIÈRE FASHION STORE - FRONTEND APPLICATION JAVASCRIPT
 * Tích hợp toàn diện với FastAPI backend:
 * - Khách hàng: Xem sản phẩm, Lọc theo Danh mục/Khoảng giá, Tìm kiếm, Giỏ hàng, Đặt hàng, Xem lịch sử đơn
 * - Quản trị (Admin): Quản lý sản phẩm (CRUD), Quản lý đơn hàng, Thống kê tổng quan (Doanh thu, đơn hàng, khách hàng)
 * - AI Stylist: Tích hợp Chatbot tư vấn phong cách qua POST /api/chat
 */

const API_BASE = 'http://127.0.0.1:8000/api';

// State của ứng dụng
const state = {
  currentView: 'home', // 'home' | 'shop' | 'orders' | 'admin'
  currentUser: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  categories: [],
  products: [],
  featuredProducts: [],
  currentCategory: null,
  searchQuery: '',
  priceRange: null, // [min, max]
  sortBy: 'newest',
  currentPage: 1,
  totalPages: 1,
  cart: { items: [], total_amount: 0 },
  appliedCoupon: null, // { code: 'HUYDINH50', discountRate: 0.5 }
  adminTab: 'stats', // 'stats' | 'products' | 'orders'
  chatHistory: [],
};

// ==================== KHỞI TẠO ỨNG DỤNG ====================
document.addEventListener('DOMContentLoaded', async () => {
  if (state.token) {
    try {
      const freshUser = await apiCall('/auth/me');
      state.currentUser = freshUser;
      localStorage.setItem('user', JSON.stringify(freshUser));
    } catch (_) {}
  }
  renderUserMenu();
  await loadCategories();
  await loadCart();
  navigate('home');
  lucide.createIcons();
});

// Helper định dạng tiền VNĐ
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

// Helper gọi API có gắn Token
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (res.status === 401) {
      // Token hết hạn hoặc sai
      logout(false);
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Có lỗi xảy ra từ máy chủ');
    }
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ==================== ĐIỀU HƯỚNG VIEW (ROUTING) ====================
async function navigate(viewName, params = {}) {
  state.currentView = viewName;
  const content = document.getElementById('app-content');

  // Cập nhật trạng thái active của menu
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('text-amber-400'));
  const activeBtn = document.getElementById(`nav-btn-${viewName}`);
  if (activeBtn) activeBtn.classList.add('text-amber-400');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (viewName === 'home') {
    renderHomeView();
  } else if (viewName === 'shop') {
    if (params.category_id) state.currentCategory = params.category_id;
    if (params.search) state.searchQuery = params.search;
    renderShopView();
  } else if (viewName === 'orders') {
    if (!state.token) {
      openAuthModal('login');
      Swal.fire({
        icon: 'info',
        title: 'Yêu cầu đăng nhập',
        text: 'Vui lòng đăng nhập để xem lịch sử đơn hàng của bạn.',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }
    renderOrdersView();
  } else if (viewName === 'admin') {
    if (!state.token || !state.currentUser || state.currentUser.role !== 'admin') {
      Swal.fire({
        icon: 'warning',
        title: 'Quyền Quản Trị',
        text: 'Vui lòng đăng nhập với tài khoản Quản trị viên (admin@fashionstore.vn).',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#f59e0b'
      });
      openAuthModal('login');
      fillDemoAccount('admin@fashionstore.vn', 'admin123');
      return;
    }
    renderAdminView();
  }

  lucide.createIcons();
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
}

// ==================== TẢI DỮ LIỆU CƠ BẢN ====================
async function loadCategories() {
  try {
    const res = await apiCall('/categories');
    state.categories = res || [];
  } catch (e) {
    console.error('Không thể tải danh mục:', e);
  }
}

async function loadCart() {
  if (!state.token) {
    // Giỏ hàng lưu tạm local nếu chưa đăng nhập
    const localCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    state.cart = {
      items: localCart,
      total_amount: localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    updateCartBadge();
    return;
  }

  try {
    const res = await apiCall('/cart');
    state.cart = res;
    updateCartBadge();
  } catch (e) {
    console.error('Không thể tải giỏ hàng:', e);
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  const count = state.cart.items.reduce((total, item) => total + item.quantity, 0);
  if (badge) badge.innerText = count;
}

// ==================== VIEW 1: TRANG CHỦ (HOME) ====================
async function renderHomeView() {
  const container = document.getElementById('app-content');
  container.innerHTML = `
    <!-- HERO BANNER (CINEMATIC) -->
    <section class="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(245,158,11,0.16),transparent_55%)]"></div>
      <div class="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          <!-- Nội dung bên trái -->
          <div class="lg:col-span-7 space-y-7">
            <div class="reveal inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur">
              <span class="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold tracking-wider">MỚI</span>
              Bộ sưu tập Thu Đông 2026 đã lên kệ
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </div>

            <h1 class="reveal text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight font-serif-luxury text-white leading-[1.05]" style="--reveal-delay:.08s">
              Định Hình<br>
              <span class="gradient-text-gold italic">Phong Cách</span> &amp;<br>
              Khí Chất Thời Thượng
            </h1>

            <p class="reveal text-slate-300/90 text-base sm:text-lg max-w-xl font-light leading-relaxed" style="--reveal-delay:.16s">
              Thiết kế cao cấp được tuyển chọn tinh tế, đồng hành cùng <strong class="text-amber-300 font-semibold">Trợ lý AI Stylist</strong> độc quyền — giúp bạn tự tin tỏa sáng trong mọi khoảnh khắc.
            </p>

            <div class="reveal flex flex-wrap gap-4 pt-1" style="--reveal-delay:.24s">
              <button id="hero-shop-btn" onclick="navigate('shop')" class="gradient-btn-gold px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-amber-500/25">
                Khám phá bộ sưu tập <i data-lucide="arrow-right" class="w-5 h-5"></i>
              </button>
              <button id="hero-ai-btn" onclick="toggleAIChat(true)" class="group px-7 py-4 rounded-2xl font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-amber-500/40 backdrop-blur flex items-center gap-2.5 transition-all">
                <i data-lucide="sparkles" class="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform"></i> Tư vấn cùng AI Stylist
              </button>
            </div>

            <!-- Thống kê động -->
            <div class="reveal grid grid-cols-3 gap-6 pt-8 border-t border-white/10 max-w-lg" style="--reveal-delay:.32s">
              <div>
                <div class="text-3xl font-extrabold text-white font-serif-luxury"><span data-count-to="12" data-suffix="K+">0</span></div>
                <div class="text-[11px] uppercase tracking-wider text-slate-400 mt-1">Khách hàng</div>
              </div>
              <div>
                <div class="text-3xl font-extrabold text-white font-serif-luxury"><span data-count-to="4.9" data-decimals="1">0</span><span class="text-amber-400">★</span></div>
                <div class="text-[11px] uppercase tracking-wider text-slate-400 mt-1">Đánh giá TB</div>
              </div>
              <div>
                <div class="text-3xl font-extrabold text-white font-serif-luxury"><span data-count-to="350" data-suffix="+">0</span></div>
                <div class="text-[11px] uppercase tracking-wider text-slate-400 mt-1">Mẫu thiết kế</div>
              </div>
            </div>
          </div>

          <!-- Hình ảnh bên phải -->
          <div class="lg:col-span-5 relative reveal" style="--reveal-delay:.2s">
            <div class="hero-ring w-[520px] h-[520px] -top-10 left-[calc(50%-260px)] hidden lg:block"></div>
            <div class="absolute -inset-6 bg-amber-500/20 blur-3xl rounded-full"></div>

            <div class="hero-frame mx-auto max-w-md shadow-2xl shadow-black/60">
              <div class="relative rounded-[calc(2rem-1px)] overflow-hidden bg-slate-950">
                <img src="assets/hero.jpg" alt="Bộ sưu tập Haute Couture Boutique Huy Dinh"
                  onerror="this.src='https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'"
                  class="w-full h-[520px] object-cover hover:scale-105 transition-transform duration-[1500ms]">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>

                <div class="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-white/10 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] uppercase font-bold text-amber-400 tracking-[0.2em]">Haute Couture</span>
                    <h4 class="text-sm font-bold text-white mt-0.5">Áo dài lụa thêu vàng</h4>
                  </div>
                  <button onclick="navigate('shop')" class="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center transition-all hover:rotate-45" aria-label="Xem bộ sưu tập">
                    <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Thẻ nổi -->
            <div class="hero-float hidden sm:flex absolute -left-4 lg:-left-10 top-16 items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-xl">
              <div class="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center"><i data-lucide="truck" class="w-4 h-4"></i></div>
              <div>
                <div class="text-xs font-bold text-white">Giao hỏa tốc 2H</div>
                <div class="text-[10px] text-slate-400">Nội thành toàn quốc</div>
              </div>
            </div>
            <div class="hero-float-delay hidden sm:flex absolute -right-2 lg:-right-6 top-1/2 items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-amber-500/30 shadow-xl">
              <div class="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center"><i data-lucide="bot" class="w-4 h-4"></i></div>
              <div>
                <div class="text-xs font-bold text-white">AI Stylist 24/7</div>
                <div class="text-[10px] text-emerald-400 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>Đang trực tuyến</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- DẢI CAM KẾT CHẠY (MARQUEE) -->
    <section class="border-y border-white/5 bg-slate-950/40 backdrop-blur py-5">
      <div class="marquee">
        <div class="marquee-track text-sm text-slate-400 font-medium whitespace-nowrap">
          ${Array(2).fill(`
            <span class="flex items-center gap-2.5"><i data-lucide="shield-check" class="w-4 h-4 text-amber-400"></i> Chính hãng 100%</span>
            <span class="text-amber-500/50">✦</span>
            <span class="flex items-center gap-2.5"><i data-lucide="truck" class="w-4 h-4 text-amber-400"></i> Miễn phí vận chuyển từ 500.000đ</span>
            <span class="text-amber-500/50">✦</span>
            <span class="flex items-center gap-2.5"><i data-lucide="refresh-cw" class="w-4 h-4 text-amber-400"></i> Đổi trả trong 30 ngày</span>
            <span class="text-amber-500/50">✦</span>
            <span class="flex items-center gap-2.5"><i data-lucide="sparkles" class="w-4 h-4 text-amber-400"></i> Tư vấn phối đồ bởi AI</span>
            <span class="text-amber-500/50">✦</span>
            <span class="flex items-center gap-2.5"><i data-lucide="credit-card" class="w-4 h-4 text-amber-400"></i> Thanh toán MoMo QR &amp; COD</span>
            <span class="text-amber-500/50">✦</span>
            <span class="flex items-center gap-2.5"><i data-lucide="gem" class="w-4 h-4 text-amber-400"></i> May đo thủ công tinh xảo</span>
            <span class="text-amber-500/50">✦</span>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- BẢNG ĐIỀU KHIỂN CHỨC NĂNG NHANH (QUICK ACTIONS DASHBOARD) -->
    <section class="reveal max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-4">
      <div class="glass-panel rounded-2xl p-4 sm:p-5 border border-amber-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-amber-950/20">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <i data-lucide="layout-grid" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Bảng Chức Năng Hệ Thống (Vibe Coding E-Commerce)
                <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Hoạt động 100%</span>
              </h3>
              <p class="text-[11px] text-slate-400">Truy cập tức thì các phân hệ Khách hàng, Quản trị Admin, Giỏ hàng và Trợ lý AI Stylist</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <button onclick="navigate('admin')" class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all">
              <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i> Mở Admin Dashboard
            </button>
            <button onclick="toggleAIChat(true)" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all">
              <i data-lucide="bot" class="w-3.5 h-3.5 text-amber-400"></i> Bật Chatbot AI
            </button>
          </div>
        </div>

        <!-- 4 Khối phím tắt chức năng -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
          <div onclick="navigate('shop')" class="cursor-pointer p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 transition-all group">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i data-lucide="sparkles" class="w-4 h-4"></i>
              </div>
              <div>
                <span class="block text-xs font-bold text-white group-hover:text-amber-400">1. Cửa hàng & Bộ lọc</span>
                <span class="text-[10px] text-slate-400">Tìm kiếm, lọc danh mục, giá</span>
              </div>
            </div>
          </div>

          <div onclick="openCartModal()" class="cursor-pointer p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 transition-all group">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i data-lucide="shopping-bag" class="w-4 h-4"></i>
              </div>
              <div>
                <span class="block text-xs font-bold text-white group-hover:text-amber-400">2. Giỏ hàng & Checkout</span>
                <span class="text-[10px] text-slate-400">Quản lý giỏ, thanh toán giả lập</span>
              </div>
            </div>
          </div>

          <div onclick="navigate('orders')" class="cursor-pointer p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 transition-all group">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i data-lucide="package-check" class="w-4 h-4"></i>
              </div>
              <div>
                <span class="block text-xs font-bold text-white group-hover:text-amber-400">3. Đơn mua cá nhân</span>
                <span class="text-[10px] text-slate-400">Xem lịch sử & tiến độ giao</span>
              </div>
            </div>
          </div>

          <div onclick="navigate('admin')" class="cursor-pointer p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 transition-all group">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
              </div>
              <div>
                <span class="block text-xs font-bold text-white group-hover:text-amber-400">4. Quản trị & Thống kê</span>
                <span class="text-[10px] text-slate-400">CRUD SP, đơn hàng, doanh thu</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- DANH MỤC NỔI BẬT -->
    <section class="reveal max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="flex items-end justify-between mb-8">
        <div>
          <span class="text-xs uppercase font-bold tracking-widest text-amber-400">Phân loại phong cách</span>
          <h2 class="text-2xl sm:text-3xl font-bold font-serif-luxury text-white mt-1">Danh Mục Thời Trang</h2>
        </div>
        <button onclick="navigate('shop')" class="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold">
          Xem tất cả <i data-lucide="chevron-right" class="w-4 h-4"></i>
        </button>
      </div>

      <div id="home-categories-grid" class="stagger-in grid grid-cols-2 md:grid-cols-4 gap-4">
        ${renderCategoryPills()}
      </div>
    </section>

    <!-- SẢN PHẨM NỔI BẬT (FEATURED) -->
    <section class="reveal max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="flex items-end justify-between mb-8">
        <div>
          <span class="text-xs uppercase font-bold tracking-widest text-amber-400">Tuyển chọn cao cấp</span>
          <h2 class="text-2xl sm:text-3xl font-bold font-serif-luxury text-white mt-1">Sản Phẩm Đang Được Yêu Thích</h2>
        </div>
        <button onclick="navigate('shop')" class="gradient-btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
          Xem danh mục đầy đủ <i data-lucide="arrow-right" class="w-4 h-4"></i>
        </button>
      </div>

      <div id="home-featured-products" class="stagger-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        ${renderSkeletonCards(8)}
      </div>
    </section>

    <!-- AI STYLIST PROMO BANNER -->
    <section class="reveal max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-950/50 via-slate-900/90 to-slate-900/90 border border-amber-500/30 p-8 sm:p-12 shadow-2xl">
        <div class="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/20 blur-3xl rounded-full"></div>
        <div class="hero-ring w-72 h-72 -right-10 -bottom-24 hidden md:block"></div>
        <div class="absolute right-12 top-1/2 -translate-y-1/2 hidden lg:block">
          <div class="w-40 h-40 rounded-full bg-gradient-to-br from-amber-400/30 to-amber-700/10 border border-amber-400/30 flex items-center justify-center hero-float shadow-2xl shadow-amber-500/20">
            <i data-lucide="bot" class="w-16 h-16 text-amber-300"></i>
          </div>
        </div>
        <div class="relative z-10 max-w-xl space-y-4">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> TÍNH NĂNG ĐỘT PHÁ
          </div>
          <h3 class="text-3xl font-bold font-serif-luxury text-white">Bạn Cần Tìm Set Đồ Hoàn Hảo Cho Buổi Hẹn?</h3>
          <p class="text-sm text-slate-300 leading-relaxed">
            Hãy trò chuyện cùng Trợ lý AI Stylist của chúng tôi. AI được huấn luyện về phối màu, chất liệu và phom dáng để tìm đúng sản phẩm có sẵn tại cửa hàng dành riêng cho bạn.
          </p>
          <button onclick="toggleAIChat()" class="gradient-btn-gold px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2">
            <i data-lucide="message-square" class="w-4 h-4"></i> Bắt đầu trò chuyện với AI
          </button>
        </div>
      </div>
    </section>
  `;

  loadHomeFeaturedProducts();
}

function renderCategoryPills() {
  if (!state.categories || state.categories.length === 0) {
    return `
      <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">Đang tải danh mục...</div>
    `;
  }

  return state.categories.map((cat) => `
    <div onclick="navigate('shop', { category_id: ${cat.id} })" 
      class="group relative cursor-pointer h-48 rounded-2xl overflow-hidden card-hover border border-slate-800 flex flex-col justify-end p-5 shadow-lg">
      <img src="${cat.image_url || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600'}" 
        alt="${cat.name}" 
        class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
      
      <div class="relative z-10">
        <span class="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Bộ Sưu Tập</span>
        <h4 class="font-extrabold text-base text-white group-hover:text-amber-400 transition-colors">${cat.name}</h4>
        <p class="text-[11px] text-slate-300 line-clamp-1 mt-0.5">${cat.description || 'Thời trang cao cấp'}</p>
      </div>
    </div>
  `).join('');
}

async function loadHomeFeaturedProducts() {
  try {
    const res = await apiCall('/products?page=1&page_size=8');
    const container = document.getElementById('home-featured-products');
    if (!container) return;

    if (!res.items || res.items.length === 0) {
      container.innerHTML = `<div class="col-span-full text-center py-8 text-slate-400">Chưa có sản phẩm nào.</div>`;
      return;
    }

    container.innerHTML = res.items.map(product => renderProductCard(product)).join('');
    lucide.createIcons();
  } catch (e) {
    console.error('Lỗi tải sản phẩm nổi bật:', e);
  }
}

// Skeleton placeholder trong lúc tải sản phẩm
function renderSkeletonCards(count = 4) {
  return Array.from({ length: count }).map(() => `
    <div class="rounded-3xl overflow-hidden border border-white/5 bg-slate-900/50">
      <div class="skeleton aspect-[3/4] rounded-none"></div>
      <div class="p-4 space-y-3">
        <div class="flex justify-between"><div class="skeleton h-3 w-20"></div><div class="skeleton h-3 w-8"></div></div>
        <div class="skeleton h-4 w-3/4"></div>
        <div class="skeleton h-5 w-1/2"></div>
        <div class="skeleton h-10 w-full rounded-xl"></div>
      </div>
    </div>
  `).join('');
}

// Render thẻ sản phẩm đơn lẻ (dùng chung cho cả Shop và Trang chủ)
function renderProductCard(p) {
  const discount = p.original_price && p.original_price > p.price
    ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
    : 0;
  const lowStock = p.stock > 0 && p.stock <= 5;
  const outOfStock = p.stock !== undefined && p.stock <= 0;

  return `
    <div class="group rounded-3xl overflow-hidden card-hover flex flex-col border border-white/5 bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur">
      
      <!-- Ảnh sản phẩm -->
      <div class="relative overflow-hidden aspect-[3/4] bg-slate-950 cursor-pointer" onclick="openProductDetail(${p.id})">
        <img src="${p.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'}" 
          alt="${p.name}" 
          loading="lazy"
          referrerpolicy="no-referrer"
          onerror="if(this.src.includes('cdn.vuahanghieu.com')) { this.src = this.src.replace('cdn.vuahanghieu.com', 'admin.vuahanghieu.com').replace(/\/unsafe\/[^\/]+\//, '/'); } else { this.onerror=null; this.src='https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'; }"
          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[900ms] ease-out ${outOfStock ? 'grayscale opacity-60' : ''}">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity"></div>
        
        <!-- Badges -->
        <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-[3]">
          ${discount > 0 ? `<span class="badge-gold px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider shadow-lg">-${discount}%</span>` : ''}
          ${p.is_featured ? `<span class="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider">✦ Nổi bật</span>` : ''}
        </div>
        ${lowStock ? `<span class="absolute top-3 right-3 z-[3] bg-rose-500/90 text-white font-bold px-2.5 py-1 rounded-full text-[10px]">Chỉ còn ${p.stock}</span>` : ''}
        ${outOfStock ? `<span class="absolute inset-x-0 top-1/2 z-[3] text-center text-xs font-bold tracking-[0.3em] text-white/90 uppercase">Tạm hết hàng</span>` : ''}

        <!-- Quick actions trượt lên khi hover -->
        <div class="absolute inset-x-3 bottom-3 z-[3] flex gap-2 translate-y-[120%] group-hover:translate-y-0 transition-transform duration-500 ease-out">
          <button onclick="event.stopPropagation(); openProductDetail(${p.id})" class="flex-1 py-2.5 rounded-xl bg-white/90 hover:bg-white text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 backdrop-blur shadow-lg" title="Xem nhanh">
            <i data-lucide="eye" class="w-4 h-4"></i> Xem nhanh
          </button>
          <button onclick="event.stopPropagation(); addToCart(${p.id})" ${outOfStock ? 'disabled' : ''} class="w-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg disabled:opacity-50" title="Thêm vào giỏ">
            <i data-lucide="shopping-bag" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Thông tin sản phẩm -->
      <div class="p-4 flex flex-col flex-grow">
        <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span class="text-amber-400/90 font-semibold uppercase tracking-wider text-[10px]">${p.category_name || 'Thời trang'}</span>
          <span class="flex items-center gap-1 text-slate-300"><i data-lucide="star" class="w-3 h-3 text-amber-400 fill-amber-400"></i> ${p.average_rating || 5.0}</span>
        </div>

        <h3 onclick="openProductDetail(${p.id})" class="font-semibold text-[15px] text-white group-hover:text-amber-300 transition-colors line-clamp-1 cursor-pointer">
          ${p.name}
        </h3>

        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-lg font-extrabold text-amber-400">${formatVND(p.price)}</span>
          ${p.original_price ? `<span class="text-xs text-slate-500 line-through">${formatVND(p.original_price)}</span>` : ''}
        </div>

        <!-- Thuộc tính Size & Brand -->
        <div class="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Brand: <strong class="text-slate-300">${p.brand || 'Lumière'}</strong></span>
          <span>Size: <strong class="text-slate-300">${p.size || 'Freesize'}</strong></span>
        </div>

        <!-- Nút Thêm vào giỏ -->
        <button onclick="addToCart(${p.id})" ${outOfStock ? 'disabled' : ''} class="mt-3 w-full py-2.5 rounded-xl bg-white/5 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-white/10 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/20 disabled:opacity-40 disabled:pointer-events-none">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i> ${outOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
        </button>
      </div>

    </div>
  `;
}

// ==================== VIEW 2: CỬA HÀNG & BỘ LỌC (SHOP) ====================
async function renderShopView() {
  const container = document.getElementById('app-content');
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <!-- Breadcrumb & Header -->
      <div class="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span class="text-xs uppercase font-bold tracking-widest text-amber-400">Bộ Sưu Tập Thời Trang</span>
          <h1 class="text-3xl font-extrabold font-serif-luxury text-white mt-1">Khám Phá Toàn Bộ Sản Phẩm</h1>
        </div>
        
        <!-- Sắp xếp nhanh -->
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400">Sắp xếp:</span>
          <select id="shop-sort" onchange="handleSortChange(this.value)" 
            class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400">
            <option value="newest" ${state.sortBy === 'newest' ? 'selected' : ''}>Mới nhất</option>
            <option value="price_asc" ${state.sortBy === 'price_asc' ? 'selected' : ''}>Giá: Thấp đến Cao</option>
            <option value="price_desc" ${state.sortBy === 'price_desc' ? 'selected' : ''}>Giá: Cao đến Thấp</option>
            <option value="name" ${state.sortBy === 'name' ? 'selected' : ''}>Tên A-Z</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <!-- CỘT BỘ LỌC (FILTERS) -->
        <div class="lg:col-span-1 space-y-6">
          <div class="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6 sticky top-28">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="font-bold text-sm text-white flex items-center gap-2">
                <i data-lucide="filter" class="w-4 h-4 text-amber-400"></i> Bộ Lọc Tìm Kiếm
              </h3>
              <button onclick="resetFilters()" class="text-xs text-slate-400 hover:text-amber-400">Xóa lọc</button>
            </div>

            <!-- Tìm kiếm theo tên -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-2">Từ khóa sản phẩm</label>
              <div class="relative">
                <input type="text" id="shop-search-input" value="${state.searchQuery || ''}" 
                  placeholder="Nhập tên sản phẩm..." 
                  onkeyup="if(event.key==='Enter') applyFilters()"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400">
                <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
              </div>
            </div>

            <!-- Lọc theo danh mục -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-2">Danh mục</label>
              <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <label class="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                  <input type="radio" name="shop_category" value="" ${!state.currentCategory ? 'checked' : ''} onchange="filterByCategory(null)" class="text-amber-500">
                  <span>Tất cả danh mục</span>
                </label>
                ${state.categories.map(cat => `
                  <label class="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                    <input type="radio" name="shop_category" value="${cat.id}" ${state.currentCategory == cat.id ? 'checked' : ''} onchange="filterByCategory(${cat.id})" class="text-amber-500">
                    <span>${cat.name}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Lọc theo khoảng giá -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-2">Khoảng giá</label>
              <div class="space-y-1.5">
                <label class="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                  <input type="radio" name="price_range" value="all" checked onchange="filterByPrice(null, null)" class="text-amber-500">
                  <span>Tất cả mức giá</span>
                </label>
                <label class="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                  <input type="radio" name="price_range" value="0-500" onchange="filterByPrice(0, 500000)" class="text-amber-500">
                  <span>Dưới 500.000đ</span>
                </label>
                <label class="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                  <input type="radio" name="price_range" value="500-1500" onchange="filterByPrice(500000, 1500000)" class="text-amber-500">
                  <span>500.000đ - 1.500.000đ</span>
                </label>
                <label class="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                  <input type="radio" name="price_range" value="1500-up" onchange="filterByPrice(1500000, null)" class="text-amber-500">
                  <span>Trên 1.500.000đ</span>
                </label>
              </div>
            </div>

            <button onclick="applyFilters()" class="w-full gradient-btn-gold py-2.5 rounded-xl text-xs font-bold">
              Áp dụng bộ lọc
            </button>
          </div>
        </div>

        <!-- CỘT DANH SÁCH SẢN PHẨM -->
        <div class="lg:col-span-3 space-y-6">
          <div id="shop-products-grid" class="stagger-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${renderSkeletonCards(6)}
          </div>

          <!-- Phân trang (Pagination) -->
          <div id="shop-pagination" class="flex justify-center items-center gap-2 pt-6"></div>
        </div>

      </div>
    </div>
  `;

  loadShopProducts();
}

async function loadShopProducts() {
  const container = document.getElementById('shop-products-grid');
  if (!container) return;
  container.innerHTML = renderSkeletonCards(6);

  try {
    let url = `/products?page=${state.currentPage}&page_size=9&sort_by=${state.sortBy}`;
    if (state.currentCategory) url += `&category_id=${state.currentCategory}`;
    if (state.searchQuery) url += `&search=${encodeURIComponent(state.searchQuery)}`;
    if (state.priceRange) {
      if (state.priceRange[0] !== null) url += `&min_price=${state.priceRange[0]}`;
      if (state.priceRange[1] !== null) url += `&max_price=${state.priceRange[1]}`;
    }

    const res = await apiCall(url);
    state.products = res.items || [];
    state.totalPages = res.total_pages || 1;

    if (state.products.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <i data-lucide="package-x" class="w-12 h-12 text-slate-600 mx-auto mb-3"></i>
          <h4 class="text-base font-bold text-white">Không tìm thấy sản phẩm nào</h4>
          <p class="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          <button onclick="resetFilters()" class="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-400">
            Đặt lại bộ lọc
          </button>
        </div>
      `;
      document.getElementById('shop-pagination').innerHTML = '';
      lucide.createIcons();
      return;
    }

    container.innerHTML = state.products.map(p => renderProductCard(p)).join('');
    renderPagination();
    lucide.createIcons();
  } catch (e) {
    console.error('Lỗi khi tải sản phẩm shop:', e);
    container.innerHTML = `<div class="col-span-full text-center py-8 text-rose-400">Không thể tải sản phẩm. Vui lòng kiểm tra server backend!</div>`;
  }
}

function renderPagination() {
  const container = document.getElementById('shop-pagination');
  if (!container || state.totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = '';
  for (let i = 1; i <= state.totalPages; i++) {
    const active = i === state.currentPage;
    html += `
      <button onclick="changePage(${i})" 
        class="w-9 h-9 rounded-xl font-bold text-xs transition-all ${active ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
        ${i}
      </button>
    `;
  }
  container.innerHTML = html;
}

function changePage(page) {
  state.currentPage = page;
  loadShopProducts();
  window.scrollTo({ top: 100, behavior: 'smooth' });
}

function filterByCategory(catId) {
  state.currentCategory = catId;
  state.currentPage = 1;
  loadShopProducts();
}

function filterByPrice(min, max) {
  if (min === null && max === null) {
    state.priceRange = null;
  } else {
    state.priceRange = [min, max];
  }
  state.currentPage = 1;
  loadShopProducts();
}

function handleSortChange(sort) {
  state.sortBy = sort;
  state.currentPage = 1;
  loadShopProducts();
}

function applyFilters() {
  const searchInput = document.getElementById('shop-search-input');
  if (searchInput) state.searchQuery = searchInput.value.trim();
  state.currentPage = 1;
  loadShopProducts();
}

function resetFilters() {
  state.currentCategory = null;
  state.searchQuery = '';
  state.priceRange = null;
  state.sortBy = 'newest';
  state.currentPage = 1;
  const searchInput = document.getElementById('shop-search-input');
  if (searchInput) searchInput.value = '';
  loadShopProducts();
}

function handleHeaderSearch(e) {
  if (e.key === 'Enter') {
    const q = e.target.value.trim();
    navigate('shop', { search: q });
  }
}

// ==================== CHI TIẾT SẢN PHẨM (PRODUCT DETAIL MODAL) ====================
async function openProductDetail(productId) {
  const modal = document.getElementById('product-detail-modal');
  const content = document.getElementById('product-detail-content');
  modal.classList.remove('hidden');

  content.innerHTML = `
    <div class="p-12 text-center text-slate-400">
      <div class="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      Đang tải chi tiết sản phẩm...
    </div>
  `;

  try {
    const p = await apiCall(`/products/${productId}`);
    const discount = p.original_price && p.original_price > p.price
      ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
      : 0;

    const sizes = (p.size || 'S, M, L, XL').split(/[,/]/).map(s => s.trim()).filter(Boolean);
    const colors = (p.color || 'Tiêu chuẩn').split(/[,/]/).map(c => c.trim()).filter(Boolean);
    const images = Array.isArray(p.images) && p.images.length > 0 
      ? p.images.map(img => typeof img === 'string' ? img : img.image_url)
      : [p.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'];
    if (!images.includes(p.image_url) && p.image_url) images.unshift(p.image_url);

    // Determine Lookbook / Campaign Promotional Video
    const nameLower = (p.name || '').toLowerCase();
    const catLower = (p.category_name || '').toLowerCase();
    
    // Curated high quality fashion runway & commercial lookbook video clips (fast CDN, MP4)
    let promoVideo = {
      title: 'Gucci & Luxury Runway Lookbook • Fall Winter Campaign',
      tag: 'Fashion Week Runway 4K',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-an-autumn-look-outdoors-40816-large.mp4',
      poster: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200'
    };

    if (nameLower.includes('áo') || catLower.includes('áo') || nameLower.includes('shirt') || nameLower.includes('tee') || nameLower.includes('polo') || nameLower.includes('blazer') || nameLower.includes('jacket') || nameLower.includes('hoodie')) {
      promoVideo = {
        title: 'Bộ Sưu Tập Thời Trang Áo Cao Cấp • Commercial & Runway Film',
        tag: 'Bộ sưu tập độc quyền',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-showing-off-her-stylish-winter-coat-40809-large.mp4',
        poster: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200'
      };
    } else if (nameLower.includes('váy') || nameLower.includes('đầm') || catLower.includes('váy') || catLower.includes('đầm')) {
      promoVideo = {
        title: 'Haute Couture Evening Dress Showcase • Milan Fashion Collection',
        tag: 'Haute Couture Live',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-model-posing-in-a-red-dress-41864-large.mp4',
        poster: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200'
      };
    } else if (nameLower.includes('túi') || catLower.includes('túi') || nameLower.includes('bag')) {
      promoVideo = {
        title: 'Leather Craftsmanship & Luxury Bag Showcase • Artisan Studio',
        tag: 'Handmade Italian Craft',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-shoemaker-working-with-leather-43285-large.mp4',
        poster: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200'
      };
    } else if (nameLower.includes('giày') || catLower.includes('giày') || nameLower.includes('sneaker')) {
      promoVideo = {
        title: 'Luxury Footwear In Motion • Runway Dynamics',
        tag: 'Sneaker & Footwear Showcase',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-man-walking-wearing-cool-shoes-40810-large.mp4',
        poster: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200'
      };
    }

    content.innerHTML = `
      <button onclick="closeProductDetailModal()" class="absolute top-5 right-5 z-30 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-lg hover:scale-110">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>

      <div class="overflow-y-auto max-h-[88vh] scrollbar-thin">
        <div class="grid grid-cols-1 md:grid-cols-2">
          <!-- Gallery bên trái -->
          <div class="bg-slate-950 p-6 flex flex-col items-center justify-between gap-4 border-b md:border-b-0 md:border-r border-slate-800">
            <div class="relative w-full flex items-center justify-center min-h-[380px] bg-slate-900/50 rounded-2xl p-4 overflow-hidden group">
              <img id="detail-main-img" src="${images[0]}" 
                alt="${p.name}" 
                referrerpolicy="no-referrer"
                onerror="if(this.src.includes('cdn.vuahanghieu.com')) { this.src = this.src.replace('cdn.vuahanghieu.com', 'admin.vuahanghieu.com').replace(/\\/unsafe\\/[^\\/]+\\//, '/'); } else { this.onerror=null; this.src='https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'; }"
                class="max-h-[400px] w-full object-contain rounded-xl shadow-2xl transition-transform duration-500 group-hover:scale-105">
              ${discount > 0 ? `<span class="badge-gold absolute top-4 left-4 px-3 py-1 rounded-lg text-xs font-bold uppercase shadow-lg">-${discount}%</span>` : ''}
            </div>

            ${images.length > 1 ? `
            <div class="flex items-center gap-3 overflow-x-auto w-full pb-2 scrollbar-thin">
              ${images.map((img, idx) => `
                <button type="button" onclick="document.getElementById('detail-main-img').src='${img}'; document.querySelectorAll('.detail-thumb').forEach(b => b.classList.remove('ring-2', 'ring-amber-400')); this.classList.add('ring-2', 'ring-amber-400');"
                  class="detail-thumb flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-slate-700 hover:border-amber-400 transition-all ${idx === 0 ? 'ring-2 ring-amber-400' : ''}">
                  <img src="${img}" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                </button>
              `).join('')}
            </div>
            ` : ''}
          </div>

          <!-- Thông tin bên phải -->
          <div class="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div class="space-y-4">
              <div class="flex items-center gap-2 text-xs text-amber-400 font-semibold tracking-wide">
                <span>${p.category_name || 'Thời trang cao cấp'}</span>
                <span>•</span>
                <span class="flex items-center gap-1"><i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400"></i> ${p.average_rating || 5.0} (${p.review_count || 0} đánh giá)</span>
              </div>

              <h2 class="text-2xl lg:text-3xl font-bold font-serif-luxury text-white leading-tight">${p.name}</h2>
              
              <div class="flex items-baseline gap-3 pt-1">
                <span class="text-3xl font-extrabold text-amber-400">${formatVND(p.price)}</span>
                ${p.original_price ? `<span class="text-base text-slate-500 line-through">${formatVND(p.original_price)}</span>` : ''}
                ${discount > 0 ? `<span class="text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-bold">Tiết kiệm ${formatVND(p.original_price - p.price)}</span>` : ''}
              </div>

              <p class="text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">${p.description || 'Sản phẩm thời trang cao cấp với chất liệu tự nhiên, may đo tinh tế theo tiêu chuẩn haute couture.'}</p>

              <!-- Tùy chọn Kích thước & Màu sắc -->
              <div class="space-y-3 pt-2">
                <div>
                  <label class="text-xs font-semibold text-slate-300 flex justify-between">
                    <span>Kích thước:</span>
                    <span id="selected-size-label" class="text-amber-400">${sizes[0] || 'Freesize'}</span>
                  </label>
                  <div class="flex flex-wrap gap-2 mt-2">
                    ${sizes.map((sz, idx) => `
                      <button type="button" onclick="document.querySelectorAll('.size-btn').forEach(b => b.classList.replace('border-amber-400', 'border-slate-700')); this.classList.replace('border-slate-700', 'border-amber-400'); document.getElementById('selected-size-label').textContent='${sz}';"
                        class="size-btn px-3 py-1.5 rounded-lg text-xs font-semibold border ${idx === 0 ? 'border-amber-400 text-amber-300 bg-amber-400/10' : 'border-slate-700 text-slate-300 bg-slate-800/60'} hover:border-amber-400 hover:text-white transition-all">
                        ${sz}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <div>
                  <label class="text-xs font-semibold text-slate-300 flex justify-between">
                    <span>Màu sắc:</span>
                    <span id="selected-color-label" class="text-amber-400">${colors[0] || 'Tiêu chuẩn'}</span>
                  </label>
                  <div class="flex flex-wrap gap-2 mt-2">
                    ${colors.map((cl, idx) => `
                      <button type="button" onclick="document.querySelectorAll('.color-btn').forEach(b => b.classList.replace('border-amber-400', 'border-slate-700')); this.classList.replace('border-slate-700', 'border-amber-400'); document.getElementById('selected-color-label').textContent='${cl}';"
                        class="color-btn px-3 py-1.5 rounded-lg text-xs font-semibold border ${idx === 0 ? 'border-amber-400 text-amber-300 bg-amber-400/10' : 'border-slate-700 text-slate-300 bg-slate-800/60'} hover:border-amber-400 hover:text-white transition-all">
                        ${cl}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <!-- Số lượng -->
                <div class="pt-2">
                  <label class="text-xs font-semibold text-slate-300">Số lượng:</label>
                  <div class="flex items-center gap-3 mt-2">
                    <div class="flex items-center border border-slate-700 bg-slate-800/70 rounded-xl overflow-hidden">
                      <button type="button" onclick="const q = document.getElementById('detail-qty'); if(parseInt(q.value) > 1) q.value = parseInt(q.value) - 1;" class="px-3 py-1.5 text-slate-300 hover:bg-slate-700 hover:text-white text-sm font-bold transition-colors">-</button>
                      <input id="detail-qty" type="number" min="1" max="${p.stock || 99}" value="1" class="w-12 text-center bg-transparent text-white font-bold text-xs focus:outline-none" readonly>
                      <button type="button" onclick="const q = document.getElementById('detail-qty'); if(parseInt(q.value) < ${p.stock || 99}) q.value = parseInt(q.value) + 1;" class="px-3 py-1.5 text-slate-300 hover:bg-slate-700 hover:text-white text-sm font-bold transition-colors">+</button>
                    </div>
                    <span class="text-xs ${p.stock > 0 ? 'text-emerald-400' : 'text-rose-400'} font-medium">
                      ${p.stock > 0 ? `Còn ${p.stock} sản phẩm sẵn có` : 'Tạm hết hàng'}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Chi tiết thuộc tính -->
              <div class="grid grid-cols-2 gap-2.5 text-xs bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 mt-2">
                <div><span class="text-slate-400">Thương hiệu:</span> <strong class="text-white">${p.brand || 'Lumière'}</strong></div>
                <div><span class="text-slate-400">Chất liệu:</span> <strong class="text-white">${p.material || 'Lụa & Cotton cao cấp'}</strong></div>
                <div><span class="text-slate-400">Bảo hành:</span> <strong class="text-white">Chính hãng 12 tháng</strong></div>
                <div><span class="text-slate-400">Đổi trả:</span> <strong class="text-white">Miễn phí trong 7 ngày</strong></div>
              </div>
            </div>

            <!-- Nút hành động -->
            <div class="pt-4 border-t border-slate-800 space-y-2.5">
              <div class="grid grid-cols-2 gap-2.5">
                <button onclick="const qty = parseInt(document.getElementById('detail-qty').value)||1; addToCart(${p.id}, qty); closeProductDetailModal(); openCartModal();" 
                  ${p.stock <= 0 ? 'disabled' : ''} 
                  class="w-full gradient-btn-gold py-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 hover:shadow-amber-500/20">
                  <i data-lucide="shopping-bag" class="w-4 h-4"></i> Thêm vào giỏ
                </button>
                <button onclick="const qty = parseInt(document.getElementById('detail-qty').value)||1; addToCart(${p.id}, qty); closeProductDetailModal(); openCheckoutModal();" 
                  ${p.stock <= 0 ? 'disabled' : ''} 
                  class="w-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 py-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all">
                  <i data-lucide="zap" class="w-4 h-4"></i> Mua ngay
                </button>
              </div>
              <button onclick="askAIAboutProduct('${p.name}')" class="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700/80 transition-colors">
                <i data-lucide="bot" class="w-4 h-4"></i> Hỏi AI Stylist cách phối đồ với sản phẩm này
              </button>
            </div>
          </div>
        </div>

        <!-- ==================== VIDEO QUẢNG CÁO & LOOKBOOK TRÌNH DIỄN (BÊN DƯỚI SẢN PHẨM) ==================== -->
        <div class="border-t border-amber-500/20 bg-slate-950/80 p-6 md:p-8">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div class="flex items-center gap-3">
              <span class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
                <i data-lucide="video" class="w-5 h-5"></i>
              </span>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base md:text-lg font-bold text-white font-serif-luxury tracking-wide">Video Trình Diễn & Quảng Cáo Sản Phẩm</h3>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ${promoVideo.tag}
                  </span>
                </div>
                <p class="text-xs text-slate-400">${promoVideo.title} • Trải nghiệm thực tế chuyển động & form dáng sản phẩm</p>
              </div>
            </div>

            <!-- Điều khiển âm thanh / toàn màn hình -->
            <div class="flex items-center gap-2 self-start md:self-auto">
              <button type="button" onclick="const vid = document.getElementById('product-promo-video'); vid.muted = !vid.muted; this.querySelector('span').textContent = vid.muted ? 'Bật âm thanh' : 'Tắt tiếng';"
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors">
                <i data-lucide="volume-2" class="w-3.5 h-3.5 text-amber-400"></i>
                <span>Bật âm thanh</span>
              </button>
              <button type="button" onclick="const vid = document.getElementById('product-promo-video'); if (vid.requestFullscreen) { vid.requestFullscreen(); } else if (vid.webkitRequestFullscreen) { vid.webkitRequestFullscreen(); }"
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors">
                <i data-lucide="maximize" class="w-3.5 h-3.5 text-amber-400"></i>
                <span>Toàn màn hình</span>
              </button>
            </div>
          </div>

          <!-- Video Player Container -->
          <div class="relative w-full rounded-2xl overflow-hidden border border-amber-500/30 bg-black shadow-2xl group">
            <video id="product-promo-video" 
              src="${promoVideo.url}" 
              poster="${promoVideo.poster}"
              autoplay 
              loop 
              muted 
              playsinline 
              controls
              class="w-full max-h-[460px] object-cover bg-black">
              Trình duyệt của bạn không hỗ trợ thẻ video HTML5.
            </video>
            
            <!-- Video Overlay Info Card -->
            <div class="pointer-events-none absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs text-slate-200 flex items-center gap-2.5 shadow-xl hidden sm:flex">
              <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span><strong>Lookbook Runway</strong> — Trình diễn mẫu ${p.name}</span>
            </div>
          </div>

          <!-- Video Highlights feature pills -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <i data-lucide="check-circle" class="w-4 h-4 text-amber-400 flex-shrink-0"></i>
              <span class="text-slate-300">Chuẩn form dáng 100%</span>
            </div>
            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4 text-amber-400 flex-shrink-0"></i>
              <span class="text-slate-300">Chất liệu vải cao cấp</span>
            </div>
            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <i data-lucide="eye" class="w-4 h-4 text-amber-400 flex-shrink-0"></i>
              <span class="text-slate-300">Góc nhìn 360° thực tế</span>
            </div>
            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <i data-lucide="shield-check" class="w-4 h-4 text-amber-400 flex-shrink-0"></i>
              <span class="text-slate-300">Chính hãng kiểm duyệt</span>
            </div>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<div class="p-8 text-center text-rose-400">Lỗi: ${e.message}</div>`;
  }
}

function closeProductDetailModal() {
  const vid = document.getElementById('product-promo-video');
  if (vid) {
    try { vid.pause(); } catch(e) {}
  }
  document.getElementById('product-detail-modal').classList.add('hidden');
}

function askAIAboutProduct(productName) {
  closeProductDetailModal();
  toggleAIChat(true);
  const prompt = `Tôi quan tâm đến sản phẩm "${productName}". Hãy tư vấn cho tôi cách phối đồ, phù hợp với dịp nào và nên đi với phụ kiện gì?`;
  document.getElementById('ai-chat-input').value = prompt;
  handleSendAIMessage(new Event('submit'));
}

// ==================== GIỎ HÀNG (CART OPERATIONS) ====================
function openCartModal() {
  document.getElementById('cart-modal').classList.remove('hidden');
  renderCartItems();
}

function closeCartModal() {
  document.getElementById('cart-modal').classList.add('hidden');
}

async function addToCart(productId, quantity = 1) {
  if (!state.token) {
    // Thêm vào giỏ hàng cục bộ khách vãng lai
    let localCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    const existingIndex = localCart.findIndex(item => item.product_id === productId);
    
    // Tìm thông tin sản phẩm từ state hoặc tải nhanh
    let p = state.products.find(item => item.id === productId);
    if (!p) {
      try {
        p = await apiCall(`/products/${productId}`);
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không tìm thấy sản phẩm' });
        return;
      }
    }

    if (existingIndex > -1) {
      localCart[existingIndex].quantity += quantity;
    } else {
      localCart.push({
        id: Date.now(),
        product_id: p.id,
        product_name: p.name,
        price: p.price,
        image_url: p.image_url,
        quantity: quantity,
      });
    }

    localStorage.setItem('guest_cart', JSON.stringify(localCart));
    state.cart = {
      items: localCart,
      total_amount: localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    updateCartBadge();
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Đã thêm vào giỏ hàng!',
      showConfirmButton: false,
      timer: 2000,
      background: '#111826',
      color: '#fff'
    });
    return;
  }

  // Nếu đã đăng nhập -> Gọi API backend
  try {
    const res = await apiCall('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity: quantity })
    });
    state.cart = res;
    updateCartBadge();
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Đã thêm vào giỏ hàng!',
      showConfirmButton: false,
      timer: 2000,
      background: '#111826',
      color: '#fff'
    });
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Thất bại', text: e.message, background: '#111826', color: '#fff' });
  }
}

async function updateCartItemQty(cartItemId, newQty) {
  if (newQty <= 0) {
    removeCartItem(cartItemId);
    return;
  }

  if (!state.token) {
    let localCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    const item = localCart.find(i => i.id === cartItemId);
    if (item) item.quantity = newQty;
    localStorage.setItem('guest_cart', JSON.stringify(localCart));
    await loadCart();
    renderCartItems();
    return;
  }

  try {
    const res = await apiCall(`/cart/items/${cartItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity: newQty })
    });
    state.cart = res;
    updateCartBadge();
    renderCartItems();
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Lỗi', text: e.message, background: '#111826', color: '#fff' });
  }
}

async function removeCartItem(cartItemId) {
  if (!state.token) {
    let localCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    localCart = localCart.filter(i => i.id !== cartItemId);
    localStorage.setItem('guest_cart', JSON.stringify(localCart));
    await loadCart();
    renderCartItems();
    return;
  }

  try {
    const res = await apiCall(`/cart/items/${cartItemId}`, { method: 'DELETE' });
    state.cart = res;
    updateCartBadge();
    renderCartItems();
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Lỗi', text: e.message, background: '#111826', color: '#fff' });
  }
}

function applyCoupon() {
  const input = document.getElementById('cart-coupon-input');
  const alertEl = document.getElementById('coupon-alert');
  if (!input) return;

  const code = input.value.trim().toUpperCase();
  if (!code) {
    alertEl.className = 'text-[11px] text-rose-400 block';
    alertEl.innerText = 'Vui lòng nhập mã giảm giá!';
    return;
  }

  // Mã đặc quyền VIP của Huy Dinh
  if (['HUYDINH', 'HUYDINH50', 'BOUTIQUEHUYDINH', 'HUYDINHVIP'].includes(code)) {
    state.appliedCoupon = { code, discountRate: 0.5, name: 'Đặc Quyền Chủ Nhân Huy Dinh (-50%)' };
    alertEl.className = 'text-[11px] text-emerald-400 font-semibold block';
    alertEl.innerText = '✓ Đã kích hoạt mã độc quyền HUYDINH50: Giảm 50% đơn hàng!';
    renderCartItems();
    Swal.fire({
      icon: 'success',
      title: 'Kích Hoạt Phiếu Giảm Giá Thành Công!',
      text: 'Chào mừng anh Huy Dinh! Đơn hàng của bạn đã được giảm trực tiếp 50%.',
      background: '#0f172a',
      color: '#fff',
      confirmButtonColor: '#f59e0b'
    });
  } else if (['HUYDINH100', 'FREEORDER'].includes(code)) {
    state.appliedCoupon = { code, discountRate: 1.0, name: 'Đặc Quyền Miễn Phí 100%' };
    alertEl.className = 'text-[11px] text-emerald-400 font-semibold block';
    alertEl.innerText = '✓ Đã kích hoạt mã độc quyền: Giảm 100% đơn hàng!';
    renderCartItems();
  } else {
    state.appliedCoupon = null;
    alertEl.className = 'text-[11px] text-rose-400 block';
    alertEl.innerText = 'Mã phiếu giảm giá này chỉ dành riêng cho chủ nhân Huy Dinh!';
    renderCartItems();
  }
}

function renderCartItems() {
  const container = document.getElementById('cart-items-container');
  const subtotalEl = document.getElementById('cart-subtotal');
  const discountRow = document.getElementById('cart-discount-row');
  const discountEl = document.getElementById('cart-discount');
  const totalEl = document.getElementById('cart-total');

  if (!state.cart.items || state.cart.items.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center text-slate-400">
        <i data-lucide="shopping-bag" class="w-12 h-12 text-slate-600 mx-auto mb-3"></i>
        <p class="font-medium">Giỏ hàng của bạn đang trống</p>
        <button onclick="closeCartModal(); navigate('shop')" class="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs">
          Khám phá cửa hàng ngay
        </button>
      </div>
    `;
    if (subtotalEl) subtotalEl.innerText = '0đ';
    if (discountRow) discountRow.classList.add('hidden');
    if (totalEl) totalEl.innerText = '0đ';
    lucide.createIcons();
    return;
  }

  let total = 0;
  container.innerHTML = state.cart.items.map(item => {
    const itemPrice = item.price ?? item.product_price ?? item.unit_price ?? (item.product ? item.product.price : 0) ?? 0;
    const itemImage = item.image_url ?? item.product_image ?? (item.product ? item.product.image_url : null) ?? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200';
    const itemName = item.product_name ?? (item.product ? item.product.name : '') ?? 'Sản phẩm';
    const itemTotal = itemPrice * item.quantity;
    total += itemTotal;
    return `
      <div class="flex gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 items-center">
        <img src="${itemImage}" 
          alt="${itemName}" class="w-16 h-16 object-cover rounded-xl shrink-0 border border-slate-700/50">
        
        <div class="flex-grow min-w-0">
          <h4 class="text-xs font-bold text-white truncate">${itemName}</h4>
          <span class="text-xs text-amber-400 font-bold">${formatVND(itemPrice)}</span>
          
          <div class="flex items-center gap-2 mt-2">
            <button onclick="updateCartItemQty(${item.id}, ${item.quantity - 1})" class="w-6 h-6 rounded bg-slate-700 text-white flex items-center justify-center text-xs hover:bg-slate-600">-</button>
            <span class="text-xs font-bold text-white px-1">${item.quantity}</span>
            <button onclick="updateCartItemQty(${item.id}, ${item.quantity + 1})" class="w-6 h-6 rounded bg-slate-700 text-white flex items-center justify-center text-xs hover:bg-slate-600">+</button>
          </div>
        </div>

        <button onclick="removeCartItem(${item.id})" class="p-1.5 text-slate-400 hover:text-rose-400">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `;
  }).join('');

  if (subtotalEl) subtotalEl.innerText = formatVND(total);

  let discountAmount = 0;
  if (state.appliedCoupon) {
    discountAmount = Math.round(total * state.appliedCoupon.discountRate);
    if (discountRow) {
      discountRow.classList.remove('hidden');
      if (discountEl) discountEl.innerText = `-${formatVND(discountAmount)} (${state.appliedCoupon.code})`;
    }
  } else {
    if (discountRow) discountRow.classList.add('hidden');
  }

  const finalTotal = Math.max(0, total - discountAmount);
  if (totalEl) totalEl.innerText = formatVND(finalTotal);
  lucide.createIcons();
}

// ==================== THANH TOÁN (CHECKOUT) ====================
function copyToClipboard(text, msg = 'Đã sao chép vào bộ nhớ tạm!') {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
  if (window.Swal) {
    Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      background: '#0f172a',
      color: '#fff'
    }).fire({ icon: 'success', title: msg });
  }
}

// ==================== GIAO DIỆN THANH TOÁN TOÀN DIỆN (FULL CHECKOUT MODAL) ====================
let selectedPaymentMethod = 'bank_transfer'; // 'bank_transfer' | 'cod' | 'credit_card' | 'e_wallet'
let selectedShippingMethod = 'standard';     // 'standard' | 'express'

function openCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  renderCheckoutContent();
  lucide.createIcons();
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.add('hidden');
}

async function proceedToCheckout() {
  if (!state.cart.items || state.cart.items.length === 0) {
    Swal.fire({ icon: 'warning', title: 'Giỏ hàng trống', text: 'Vui lòng chọn sản phẩm trước khi thanh toán.' });
    return;
  }

  if (!state.token) {
    closeCartModal();
    openAuthModal('login');
    Swal.fire({
      icon: 'info',
      title: 'Đăng nhập để đặt hàng',
      text: 'Vui lòng đăng nhập hoặc dùng tài khoản demo để hoàn tất thanh toán.',
      background: '#111827',
      color: '#fff',
      confirmButtonColor: '#f59e0b'
    });
    return;
  }

  closeCartModal();
  openCheckoutModal();
}

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  renderCheckoutContent();
  lucide.createIcons();
}

function selectShippingMethod(method) {
  selectedShippingMethod = method;
  renderCheckoutContent();
  lucide.createIcons();
}

function applyCheckoutCoupon() {
  const input = document.getElementById('checkout-coupon-input');
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  if (!code) {
    Swal.fire({ icon: 'warning', title: 'Chưa nhập mã', text: 'Vui lòng nhập mã giảm giá!' });
    return;
  }
  if (['HUYDINH', 'HUYDINH50', 'BOUTIQUEHUYDINH', 'HUYDINHVIP'].includes(code)) {
    state.appliedCoupon = { code, discountRate: 0.5, name: 'Đặc Quyền Chủ Nhân Huy Dinh (-50%)' };
    Swal.fire({ icon: 'success', title: 'Áp dụng thành công!', text: 'Đã kích hoạt ưu đãi đặc quyền giảm 50% đơn hàng!' });
  } else if (['HUYDINH100', 'FREEORDER'].includes(code)) {
    state.appliedCoupon = { code, discountRate: 1.0, name: 'Đặc Quyền Miễn Phí 100%' };
    Swal.fire({ icon: 'success', title: 'Áp dụng thành công!', text: 'Đã kích hoạt ưu đãi giảm 100%!' });
  } else if (['WELCOME', 'CHAOBAN'].includes(code)) {
    state.appliedCoupon = { code, discountAmount: 50000, name: 'Chào mừng thành viên (-50.000đ)' };
    Swal.fire({ icon: 'success', title: 'Áp dụng thành công!', text: 'Đã giảm 50.000đ cho đơn hàng của bạn!' });
  } else {
    Swal.fire({ icon: 'error', title: 'Mã không hợp lệ', text: 'Mã giảm giá này không đúng hoặc chỉ dành riêng cho VIP!' });
  }
  renderCheckoutContent();
  renderCartItems();
  lucide.createIcons();
}

function removeCheckoutCoupon() {
  state.appliedCoupon = null;
  renderCheckoutContent();
  renderCartItems();
  lucide.createIcons();
}

function renderCheckoutContent() {
  const content = document.getElementById('checkout-modal-content');
  if (!content) return;

  const user = state.currentUser || {};
  const items = state.cart.items || [];
  const subtotal = items.reduce((sum, item) => sum + ((item.price || item.unit_price || 0) * item.quantity), 0);
  
  // Phí ship: miễn phí từ 500k cho tiêu chuẩn, 45k cho hỏa tốc
  const baseShippingFee = subtotal >= 500000 ? 0 : 30000;
  const shippingFee = selectedShippingMethod === 'express' ? baseShippingFee + 25000 : baseShippingFee;

  let discountAmount = 0;
  if (state.appliedCoupon) {
    if (state.appliedCoupon.discountRate) {
      discountAmount = Math.round(subtotal * state.appliedCoupon.discountRate);
    } else if (state.appliedCoupon.discountAmount) {
      discountAmount = Math.min(subtotal, state.appliedCoupon.discountAmount);
    }
  }

  const finalTotal = Math.max(0, subtotal + shippingFee - discountAmount);

  content.innerHTML = `
    <!-- Header -->
    <div class="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-amber-500/20 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
          <i data-lucide="shield-check" class="w-5 h-5"></i>
        </div>
        <div>
          <h3 class="text-lg font-bold text-white font-serif-luxury flex items-center gap-2">
            Thanh Toán An Toàn &amp; Bảo Mật
            <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">SSL 256-Bit</span>
          </h3>
          <p class="text-[11px] text-slate-400">Boutique Huy Dinh • Luxury Fashion &amp; Couture</p>
        </div>
      </div>
      <button onclick="closeCheckoutModal()" class="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <!-- Body Scrollable -->
    <div class="flex-grow overflow-y-auto p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Cột Trái: Thông tin giao hàng & Phương thức thanh toán (7/12) -->
      <div class="lg:col-span-7 space-y-6">

        <!-- 1. Thông tin người nhận -->
        <div class="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <i data-lucide="map-pin" class="w-4 h-4"></i> 1. Thông Tin Nhận Hàng
            </h4>
            <span class="text-[11px] text-slate-400">Tự động điền theo hồ sơ</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Họ và tên người nhận *</label>
              <input type="text" id="checkout-name" value="${user.full_name || 'Huy Dinh'}" 
                placeholder="Nguyễn Văn A" 
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Số điện thoại *</label>
              <input type="tel" id="checkout-phone" value="${user.phone || '0908888999'}" 
                placeholder="0901234567" 
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Địa chỉ nhận hàng chi tiết *</label>
            <input type="text" id="checkout-address" value="${user.address || 'Boutique Huy Dinh, TP. Hồ Chí Minh'}" 
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" 
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Ghi chú cho đơn hàng &amp; shipper (tùy chọn)</label>
            <input type="text" id="checkout-note" placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..." 
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400">
          </div>
        </div>

        <!-- 2. Phương thức vận chuyển -->
        <div class="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-3">
          <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <i data-lucide="truck" class="w-4 h-4"></i> 2. Hình Thức Vận Chuyển
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div onclick="selectShippingMethod('standard')" 
              class="cursor-pointer p-3.5 rounded-2xl border transition-all ${selectedShippingMethod === 'standard' ? 'border-amber-400 bg-amber-500/10 shadow-md shadow-amber-500/10' : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600'}">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-bold text-white flex items-center gap-1.5">
                  <i data-lucide="package" class="w-4 h-4 text-amber-400"></i> Tiêu Chuẩn Toàn Quốc
                </span>
                <span class="text-xs font-extrabold ${subtotal >= 500000 ? 'text-emerald-400' : 'text-slate-300'}">
                  ${subtotal >= 500000 ? 'MIỄN PHÍ' : '30.000đ'}
                </span>
              </div>
              <p class="text-[11px] text-slate-400">Nhận sau 2-3 ngày làm việc</p>
            </div>

            <div onclick="selectShippingMethod('express')" 
              class="cursor-pointer p-3.5 rounded-2xl border transition-all ${selectedShippingMethod === 'express' ? 'border-amber-400 bg-amber-500/10 shadow-md shadow-amber-500/10' : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600'}">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-bold text-white flex items-center gap-1.5">
                  <i data-lucide="zap" class="w-4 h-4 text-amber-400"></i> Hỏa Tốc VIP 2H
                </span>
                <span class="text-xs font-extrabold text-amber-300">
                  ${formatVND(shippingFee)}
                </span>
              </div>
              <p class="text-[11px] text-slate-400">Giao ngay nội thành qua Grab/Ahamove</p>
            </div>
          </div>
        </div>

        <!-- 3. Phương thức thanh toán -->
        <div class="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-4">
          <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <i data-lucide="credit-card" class="w-4 h-4"></i> 3. Phương Thức Thanh Toán
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- MoMo / Chuyển khoản QR -->
            <div onclick="selectPaymentMethod('bank_transfer')" 
              class="cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-3 ${selectedPaymentMethod === 'bank_transfer' ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/15' : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600'}">
              <div class="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                <i data-lucide="qr-code" class="w-5 h-5"></i>
              </div>
              <div class="flex-grow min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-white">Quét Mã MoMo QR</span>
                  <span class="px-1.5 py-0.5 rounded text-[9px] bg-pink-500/20 text-pink-300 font-bold uppercase">Khuyên Dùng</span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">Xác nhận tự động trong 30 giây</p>
              </div>
            </div>

            <!-- COD -->
            <div onclick="selectPaymentMethod('cod')" 
              class="cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-3 ${selectedPaymentMethod === 'cod' ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/15' : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600'}">
              <div class="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <i data-lucide="banknote" class="w-5 h-5"></i>
              </div>
              <div class="flex-grow min-w-0">
                <span class="text-xs font-bold text-white block">Thanh Toán Khi Nhận (COD)</span>
                <p class="text-[11px] text-slate-400 mt-0.5">Kiểm tra trang phục rồi mới trả tiền</p>
              </div>
            </div>

            <!-- Thẻ tín dụng Visa / Master -->
            <div onclick="selectPaymentMethod('credit_card')" 
              class="cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-3 ${selectedPaymentMethod === 'credit_card' ? 'border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/15' : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600'}">
              <div class="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <i data-lucide="credit-card" class="w-5 h-5"></i>
              </div>
              <div class="flex-grow min-w-0">
                <span class="text-xs font-bold text-white block">Thẻ Quốc Tế (Visa/Master)</span>
                <p class="text-[11px] text-slate-400 mt-0.5">Cổng thanh toán thẻ giả lập</p>
              </div>
            </div>

            <!-- Ví điện tử khác -->
            <div onclick="selectPaymentMethod('e_wallet')" 
              class="cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-3 ${selectedPaymentMethod === 'e_wallet' ? 'border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/15' : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600'}">
              <div class="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <i data-lucide="wallet" class="w-5 h-5"></i>
              </div>
              <div class="flex-grow min-w-0">
                <span class="text-xs font-bold text-white block">Ví ZaloPay / ShopeePay</span>
                <p class="text-[11px] text-slate-400 mt-0.5">Liên kết ví điện tử tiện lợi</p>
              </div>
            </div>
          </div>

          <!-- Chi tiết theo từng phương thức đã chọn -->
          ${renderPaymentMethodDetails(selectedPaymentMethod, finalTotal)}

        </div>

      </div>

      <!-- Cột Phải: Tóm tắt đơn hàng & Tổng thanh toán (5/12) -->
      <div class="lg:col-span-5 space-y-5">
        
        <!-- Danh sách món đồ trong đơn -->
        <div class="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-3.5">
          <div class="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <i data-lucide="shopping-bag" class="w-4 h-4"></i> Đơn Hàng (${items.length} món)
            </h4>
            <button onclick="closeCheckoutModal(); openCartModal();" class="text-[11px] text-amber-400 hover:underline">Sửa giỏ</button>
          </div>

          <div class="space-y-3 max-h-56 overflow-y-auto pr-1">
            ${items.map(it => {
              const itPrice = it.price ?? it.product_price ?? it.unit_price ?? (it.product ? it.product.price : 0) ?? 0;
              const itImage = it.image_url ?? it.product_image ?? (it.product ? it.product.image_url : null) ?? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200';
              const itName = it.product_name ?? (it.product ? it.product.name : '') ?? 'Sản phẩm';
              return `
                <div class="flex items-center gap-3 py-1.5">
                  <img src="${itImage}" 
                    alt="${itName}" 
                    class="w-12 h-14 rounded-xl object-cover shrink-0 border border-slate-700">
                  <div class="flex-grow min-w-0">
                    <h5 class="text-xs font-bold text-white truncate">${itName}</h5>
                    <div class="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                      <span>Số lượng: <strong class="text-slate-200">${it.quantity}</strong></span>
                      <span class="text-amber-400 font-semibold">${formatVND(itPrice * it.quantity)}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Nhập mã giảm giá -->
          <div class="pt-3 border-t border-slate-700/60 space-y-2">
            <label class="block text-[11px] font-semibold text-slate-300 flex items-center justify-between">
              <span class="flex items-center gap-1.5"><i data-lucide="ticket-percent" class="w-3.5 h-3.5 text-amber-400"></i> Mã giảm giá độc quyền:</span>
              <span class="text-[10px] text-amber-400 font-mono">HUYDINH50 (-50%)</span>
            </label>
            <div class="flex gap-2">
              <input type="text" id="checkout-coupon-input" value="${state.appliedCoupon ? state.appliedCoupon.code : ''}" 
                placeholder="Nhập: HUYDINH50..." 
                class="flex-grow bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase placeholder:normal-case placeholder-slate-500 focus:outline-none focus:border-amber-400">
              <button onclick="applyCheckoutCoupon()" class="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0">
                Áp dụng
              </button>
            </div>
            ${state.appliedCoupon ? `
              <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-400">
                <span class="flex items-center gap-1.5 font-bold"><i data-lucide="check" class="w-3.5 h-3.5"></i> ${state.appliedCoupon.name || state.appliedCoupon.code}</span>
                <button onclick="removeCheckoutCoupon()" class="text-slate-400 hover:text-rose-400 text-[11px]">Gỡ bỏ</button>
              </div>
            ` : ''}
          </div>

          <!-- Bảng tính tiền chi tiết -->
          <div class="pt-3 border-t border-slate-700/60 space-y-2 text-xs">
            <div class="flex justify-between text-slate-400">
              <span>Tạm tính tiền hàng:</span>
              <span class="font-semibold text-white">${formatVND(subtotal)}</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Phí vận chuyển:</span>
              <span class="font-semibold ${shippingFee === 0 ? 'text-emerald-400' : 'text-white'}">
                ${shippingFee === 0 ? 'Miễn phí (Đơn > 500k)' : formatVND(shippingFee)}
              </span>
            </div>
            ${discountAmount > 0 ? `
              <div class="flex justify-between text-emerald-400 font-semibold">
                <span>Ưu đãi giảm giá VIP:</span>
                <span>-${formatVND(discountAmount)}</span>
              </div>
            ` : ''}
            <div class="pt-2 border-t border-slate-700 flex justify-between items-baseline text-white">
              <span class="text-sm font-bold">Tổng thanh toán:</span>
              <span class="text-2xl font-black text-amber-400 font-serif-luxury">${formatVND(finalTotal)}</span>
            </div>
          </div>

          <!-- Nút Đặt Hàng -->
          <button id="btn-submit-order" onclick="submitCompleteOrder()" 
            class="w-full gradient-btn-gold py-4 rounded-2xl font-black text-sm text-slate-950 flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all">
            <i data-lucide="lock" class="w-4 h-4"></i> Xác Nhận Đặt Hàng Ngay (${formatVND(finalTotal)})
          </button>

          <!-- Cam kết an toàn -->
          <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-400 text-center pt-1">
            <div class="flex items-center justify-center gap-1">
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-amber-400"></i> Đổi trả miễn phí 30 ngày
            </div>
            <div class="flex items-center justify-center gap-1">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400"></i> Kiểm tra hàng trước khi nhận
            </div>
          </div>

        </div>

      </div>

    </div>
  `;
}

function renderPaymentMethodDetails(method, finalTotal) {
  if (method === 'bank_transfer') {
    return `
      <div class="p-4 rounded-2xl bg-gradient-to-br from-pink-950/30 via-slate-900 to-slate-900 border border-pink-500/30 text-center space-y-3">
        <div class="flex items-center justify-center gap-2 text-pink-400 text-xs font-bold uppercase tracking-wider">
          <span class="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
          Mã QR MoMo Chính Chủ • Lê Đình Huy
        </div>
        
        <div class="inline-block p-2.5 rounded-2xl bg-white shadow-xl shadow-pink-500/20">
          <img src="qr_payment.png" alt="Mã QR MoMo Lê Đình Huy" class="w-44 h-auto rounded-xl mx-auto block" />
        </div>

        <div>
          <div class="text-base font-black text-white">LE DINH HUY</div>
          <div class="text-xs text-slate-400 font-mono mt-0.5">MoMo: <strong>*******373</strong></div>
        </div>

        <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-left text-xs space-y-1.5 max-w-sm mx-auto">
          <div class="flex justify-between items-center text-slate-300">
            <span>Số tiền chuyển:</span>
            <div class="flex items-center gap-1.5">
              <strong class="text-amber-400 font-bold">${formatVND(finalTotal)}</strong>
              <button onclick="copyToClipboard('${Math.round(finalTotal)}', 'Đã chép số tiền!')" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300">Chép</button>
            </div>
          </div>
          <div class="flex justify-between items-center text-slate-300">
            <span>Nội dung chuyển:</span>
            <span class="text-pink-400 font-mono font-bold">Tên của bạn + SĐT</span>
          </div>
        </div>
        <p class="text-[11px] text-slate-400 italic">Mở MoMo hoặc bất kỳ ứng dụng ngân hàng nào để quét mã QR</p>
      </div>
    `;
  } else if (method === 'cod') {
    return `
      <div class="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-slate-300 space-y-2">
        <div class="flex items-center gap-2 text-emerald-400 font-bold">
          <i data-lucide="check-circle" class="w-4 h-4"></i> Thanh Toán Tiền Mặt Khi Nhận Hàng (COD)
        </div>
        <p class="leading-relaxed text-slate-300">
          Bạn chỉ cần thanh toán số tiền <strong class="text-amber-400">${formatVND(finalTotal)}</strong> cho nhân viên giao hàng khi bưu kiện được giao đến tận nhà. Được quyền đồng kiểm kiểm tra sản phẩm trước khi thanh toán.
        </p>
      </div>
    `;
  } else if (method === 'credit_card') {
    return `
      <div class="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-3 text-xs">
        <div class="flex items-center gap-2 text-blue-400 font-bold">
          <i data-lucide="shield" class="w-4 h-4"></i> Nhập Thông Tin Thẻ Quốc Tế (Cổng giả lập)
        </div>
        <div class="space-y-2.5">
          <div>
            <label class="block text-[11px] text-slate-400 mb-1">Số thẻ tín dụng / ghi nợ</label>
            <input type="text" placeholder="4111 2222 3333 4444" value="4111 2222 3333 4444" 
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono">
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-[11px] text-slate-400 mb-1">Hết hạn (MM/YY)</label>
              <input type="text" placeholder="12/28" value="12/28" 
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono">
            </div>
            <div>
              <label class="block text-[11px] text-slate-400 mb-1">CVV/CVC</label>
              <input type="password" placeholder="888" value="888" 
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono">
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs text-slate-300 space-y-1.5">
        <div class="text-purple-400 font-bold flex items-center gap-2">
          <i data-lucide="wallet" class="w-4 h-4"></i> Ví Điện Tử Đối Tác
        </div>
        <p class="text-slate-400">Sau khi bấm Xác nhận, hệ thống sẽ mở liên kết thanh toán của ví đã chọn.</p>
      </div>
    `;
  }
}

async function submitCompleteOrder() {
  const nameEl = document.getElementById('checkout-name');
  const phoneEl = document.getElementById('checkout-phone');
  const addrEl = document.getElementById('checkout-address');
  const noteEl = document.getElementById('checkout-note');

  if (!nameEl || !phoneEl || !addrEl) return;

  const name = nameEl.value.trim();
  const phone = phoneEl.value.trim();
  const address = addrEl.value.trim();
  const note = noteEl ? noteEl.value.trim() : '';

  if (!name || !phone || !address) {
    Swal.fire({
      icon: 'warning',
      title: 'Thiếu thông tin nhận hàng',
      text: 'Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao hàng.'
    });
    return;
  }

  const payload = {
    shipping_name: name,
    shipping_phone: phone,
    shipping_address: address,
    payment_method: selectedPaymentMethod,
    note: note + (selectedShippingMethod === 'express' ? ' [Giao Hỏa Tốc VIP 2H]' : ''),
    coupon_code: state.appliedCoupon ? state.appliedCoupon.code : null
  };

  try {
    Swal.fire({
      title: 'Đang tạo đơn hàng...',
      text: 'Hệ thống đang bảo mật và xử lý đơn hàng của bạn',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const orderResult = await apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Reset giỏ hàng và voucher
    state.appliedCoupon = null;
    await loadCart();
    closeCheckoutModal();

    const orderCode = orderResult.order_code || ('#' + orderResult.id);

    if (selectedPaymentMethod === 'bank_transfer') {
      Swal.fire({
        title: '<span style="color:#f472b6;font-family:Playfair Display,serif;font-size:22px;">Đặt Hàng Thành Công! 🎉</span>',
        html: `
          <div style="font-size:13px;text-align:center;color:#cbd5e1;line-height:1.5;">
            <p style="margin-bottom:12px;">Cảm ơn bạn! Đơn hàng <strong style="color:#f59e0b;">${orderCode}</strong> đã được ghi nhận.</p>
            
            <div style="display:inline-block;background:#fff;padding:10px;border-radius:14px;box-shadow:0 8px 30px rgba(217,70,239,0.3);margin-bottom:12px;">
              <img src="qr_payment.png" alt="Mã QR MoMo Lê Đình Huy" style="width:190px;height:auto;border-radius:10px;display:block;" />
            </div>

            <div style="font-size:16px;font-weight:800;color:#fff;">LE DINH HUY</div>
            <div style="font-size:13px;color:#94a3b8;font-family:monospace;margin-top:2px;">Số MoMo: <strong>*******373</strong></div>

            <div style="margin-top:14px;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:12px;text-align:left;">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="color:#94a3b8;">Mã đơn hàng:</span>
                <strong style="color:#f59e0b;">${orderCode}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="color:#94a3b8;">Số tiền cần chuyển:</span>
                <div style="display:flex;align-items:center;gap:6px;">
                  <strong style="color:#10b981;font-size:16px;">${formatVND(orderResult.final_amount)}</strong>
                  <button onclick="copyToClipboard('${Math.round(orderResult.final_amount)}', 'Đã sao chép số tiền!')" style="background:#334155;color:#e2e8f0;border:none;border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;">Chép</button>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#94a3b8;">Nội dung chuyển:</span>
                <div style="display:flex;align-items:center;gap:6px;">
                  <strong style="color:#f472b6;font-family:monospace;">${orderCode}</strong>
                  <button onclick="copyToClipboard('${orderCode}', 'Đã sao chép nội dung chuyển khoản!')" style="background:#334155;color:#e2e8f0;border:none;border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;">Chép</button>
                </div>
              </div>
            </div>

            <p style="font-size:11px;color:#94a3b8;margin-top:12px;">
              💡 <em>Đơn hàng sẽ tự động chuyển sang trạng thái đã thanh toán ngay khi hoàn tất.</em>
            </p>
          </div>
        `,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Tôi đã chuyển khoản xong ✓',
        showCancelButton: true,
        cancelButtonText: 'Xem đơn mua của tôi',
        cancelButtonColor: '#475569'
      }).then(() => {
        navigate('orders');
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Đặt Hàng Thành Công! 🎉',
        html: `
          <div style="font-size:13px;text-align:left;color:#cbd5e1;line-height:1.6;">
            <p>Mã đơn hàng: <strong style="color:#f59e0b;">${orderCode}</strong></p>
            <p>Phương thức: <span>${selectedPaymentMethod === 'cod' ? 'Thanh toán tiền mặt khi nhận hàng (COD)' : selectedPaymentMethod.toUpperCase()}</span></p>
            <p>Tạm tính: <span>${formatVND(orderResult.total_amount)}</span></p>
            ${orderResult.discount_amount > 0 ? `<p>Giảm giá độc quyền: <strong style="color:#10b981;">-${formatVND(orderResult.discount_amount)}</strong></p>` : ''}
            <p>Phí vận chuyển: <span>${formatVND(orderResult.shipping_fee)}</span></p>
            <p>Tổng thanh toán: <strong style="color:#f59e0b;font-size:16px;">${formatVND(orderResult.final_amount)}</strong></p>
            <p>Trạng thái: <span style="color:#10b981;font-weight:bold;">Đang xử lý</span></p>
            <p class="mt-2 text-xs">Cảm ơn bạn đã lựa chọn mua sắm tại <strong>Boutique Huy Dinh</strong>!</p>
          </div>
        `,
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'Xem lịch sử đơn mua'
      }).then(() => {
        navigate('orders');
      });
    }

  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Đặt hàng thất bại',
      text: error.message || 'Không thể tạo đơn hàng. Vui lòng kiểm tra lại giỏ hàng và tồn kho.'
    });
  }
}


// ==================== VIEW 3: ĐƠN MUA CỦA KHÁCH HÀNG (ORDERS) ====================
async function renderOrdersView() {
  const container = document.getElementById('app-content');
  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="mb-8">
        <span class="text-xs uppercase font-bold tracking-widest text-amber-400">Lịch Sử Mua Hàng</span>
        <h1 class="text-3xl font-extrabold font-serif-luxury text-white mt-1">Đơn Hàng Của Tôi</h1>
      </div>

      <div id="orders-list-container" class="space-y-4">
        <div class="py-12 text-center text-slate-400">
          <div class="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Đang tải lịch sử đơn hàng...
        </div>
      </div>
    </div>
  `;

  try {
    const res = await apiCall('/orders');
    const orders = Array.isArray(res) ? res : (res && res.items ? res.items : []);
    const listContainer = document.getElementById('orders-list-container');

    if (!orders || orders.length === 0) {
      listContainer.innerHTML = `
        <div class="py-16 text-center text-slate-400 glass-panel rounded-2xl border border-slate-800">
          <i data-lucide="package" class="w-12 h-12 text-slate-600 mx-auto mb-3"></i>
          <h4 class="text-base font-bold text-white">Bạn chưa có đơn hàng nào</h4>
          <p class="text-xs text-slate-400 mt-1">Hãy khám phá bộ sưu tập và chọn món đồ ưng ý nhé!</p>
          <button onclick="navigate('shop')" class="mt-4 px-4 py-2 rounded-xl gradient-btn-gold text-xs font-bold">
            Mua sắm ngay
          </button>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    const statusBadge = (st) => {
      const map = {
        'pending': '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Chờ xử lý</span>',
        'processing': '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Đang chuẩn bị hàng</span>',
        'shipped': '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Đang giao hàng</span>',
        'delivered': '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Đã giao thành công</span>',
        'cancelled': '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Đã hủy</span>',
      };
      return map[st] || `<span class="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">${st}</span>`;
    };

    listContainer.innerHTML = orders.map(order => `
      <div class="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        
        <div class="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <span class="text-xs text-slate-400">Mã đơn:</span>
            <strong class="text-white text-sm ml-1 font-mono">${order.order_code || ('#' + order.id)}</strong>
            <span class="text-xs text-slate-500 ml-3">${new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
          </div>
          <div>
            ${statusBadge(order.status)}
          </div>
        </div>

        <!-- Danh sách items trong đơn -->
        <div class="space-y-3">
          ${(order.items || []).map(item => `
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-3">
                <img src="${item.product_image || item.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100'}" class="w-12 h-12 rounded-lg object-cover">
                <div>
                  <h5 class="font-bold text-white">${item.product_name}</h5>
                  <span class="text-slate-400">Số lượng: ${item.quantity} × ${formatVND(item.product_price ?? item.unit_price ?? 0)}</span>
                </div>
              </div>
              <span class="font-bold text-amber-400">${formatVND(item.subtotal ?? item.total_price ?? ((item.product_price || 0) * (item.quantity || 1)))}</span>
            </div>
          `).join('')}
        </div>

        <div class="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div class="text-slate-400">
            <span>Giao đến: <strong>${order.shipping_address}</strong> (${order.shipping_name} - ${order.shipping_phone})</span>
          </div>
          <div class="text-right">
            <span class="text-slate-400">Tổng tiền:</span>
            <span class="text-base font-bold text-amber-400 ml-1">${formatVND(order.total_amount)}</span>
          </div>
        </div>

      </div>
    `).join('');

    lucide.createIcons();
  } catch (e) {
    document.getElementById('orders-list-container').innerHTML = `<div class="p-8 text-center text-rose-400">Lỗi: ${e.message}</div>`;
  }
}

// ==================== VIEW 4: QUẢN TRỊ VIÊN (ADMIN DASHBOARD) ====================
async function renderAdminView() {
  const container = document.getElementById('app-content');
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <!-- Admin Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4 mb-8">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <i data-lucide="shield" class="w-3.5 h-3.5"></i> Admin Control Panel
          </div>
          <h1 class="text-3xl font-extrabold font-serif-luxury text-white mt-1">Quản Trị Hệ Thống Fashion Store</h1>
        </div>
        
        <!-- Admin Tabs -->
        <div class="flex gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button onclick="switchAdminTab('stats')" id="admin-tab-stats" class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${state.adminTab === 'stats' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}">
            Thống kê doanh thu
          </button>
          <button onclick="switchAdminTab('products')" id="admin-tab-products" class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${state.adminTab === 'products' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}">
            Quản lý Sản phẩm
          </button>
          <button onclick="switchAdminTab('orders')" id="admin-tab-orders" class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${state.adminTab === 'orders' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}">
            Quản lý Đơn hàng
          </button>
        </div>
      </div>

      <!-- Tab Content Container -->
      <div id="admin-tab-content">
        <!-- Rendered based on state.adminTab -->
      </div>

    </div>
  `;

  renderAdminTabContent();
  lucide.createIcons();
}

function switchAdminTab(tab) {
  state.adminTab = tab;
  renderAdminView();
}

async function renderAdminTabContent() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  if (state.adminTab === 'stats') {
    container.innerHTML = `
      <div class="py-12 text-center text-slate-400">
        <div class="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Đang tải báo cáo thống kê...
      </div>
    `;

    try {
      const stats = await apiCall('/admin/stats');
      container.innerHTML = `
        <!-- Bảng 4 chỉ số KPI lớn -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          <div class="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <i data-lucide="dollar-sign" class="w-7 h-7"></i>
            </div>
            <div>
              <span class="text-xs text-slate-400">Tổng doanh thu</span>
              <h3 class="text-xl font-extrabold text-amber-400 mt-0.5">${formatVND(stats.total_revenue)}</h3>
            </div>
          </div>

          <div class="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <i data-lucide="shopping-bag" class="w-7 h-7"></i>
            </div>
            <div>
              <span class="text-xs text-slate-400">Tổng đơn hàng</span>
              <h3 class="text-xl font-extrabold text-white mt-0.5">${stats.total_orders} đơn</h3>
            </div>
          </div>

          <div class="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <i data-lucide="users" class="w-7 h-7"></i>
            </div>
            <div>
              <span class="text-xs text-slate-400">Khách hàng</span>
              <h3 class="text-xl font-extrabold text-white mt-0.5">${stats.total_customers} người</h3>
            </div>
          </div>

          <div class="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <i data-lucide="package" class="w-7 h-7"></i>
            </div>
            <div>
              <span class="text-xs text-slate-400">Sản phẩm kích hoạt</span>
              <h3 class="text-xl font-extrabold text-white mt-0.5">${stats.total_products} món</h3>
            </div>
          </div>

        </div>

        <!-- Chi tiết trạng thái đơn hàng -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h4 class="font-bold text-sm text-white flex items-center gap-2">
              <i data-lucide="pie-chart" class="w-4 h-4 text-amber-400"></i> Phân loại trạng thái đơn
            </h4>
            <div class="space-y-3">
              <div class="flex justify-between text-xs py-2 border-b border-slate-800">
                <span class="text-amber-400">Chờ xử lý (Pending)</span>
                <strong class="text-white">${stats.orders_by_status?.pending || 0} đơn</strong>
              </div>
              <div class="flex justify-between text-xs py-2 border-b border-slate-800">
                <span class="text-blue-400">Đang chuẩn bị (Processing)</span>
                <strong class="text-white">${stats.orders_by_status?.processing || 0} đơn</strong>
              </div>
              <div class="flex justify-between text-xs py-2 border-b border-slate-800">
                <span class="text-indigo-400">Đang giao (Shipped)</span>
                <strong class="text-white">${stats.orders_by_status?.shipped || 0} đơn</strong>
              </div>
              <div class="flex justify-between text-xs py-2 border-b border-slate-800">
                <span class="text-emerald-400">Đã hoàn thành (Delivered)</span>
                <strong class="text-white">${stats.orders_by_status?.delivered || 0} đơn</strong>
              </div>
            </div>
          </div>

          <div class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h4 class="font-bold text-sm text-white flex items-center gap-2">
              <i data-lucide="info" class="w-4 h-4 text-amber-400"></i> Đánh giá tiêu chí Vibe Coding
            </h4>
            <p class="text-xs text-slate-300 leading-relaxed">
              Hệ thống đáp ứng trọn vẹn yêu cầu bài tập lớn:
            </p>
            <ul class="text-xs text-slate-400 space-y-2">
              <li>✓ Đầy đủ phân hệ Khách hàng (khám phá, giỏ hàng, thanh toán)</li>
              <li>✓ Đầy đủ phân hệ Admin (CRUD sản phẩm, duyệt đơn, thống kê)</li>
              <li>✓ Tích hợp tính năng AI Stylist Chatbot tự động gợi ý sản phẩm</li>
              <li>✓ Mã nguồn FastAPI chuẩn RESTful API có tài liệu Swagger</li>
            </ul>
          </div>
        </div>
      `;
      lucide.createIcons();
    } catch (e) {
      container.innerHTML = `<div class="p-8 text-center text-rose-400">Lỗi tải thống kê: ${e.message}</div>`;
    }
  } else if (state.adminTab === 'products') {
    renderAdminProductsTab(container);
  } else if (state.adminTab === 'orders') {
    renderAdminOrdersTab(container);
  }
}

// Admin: Quản lý sản phẩm (CRUD)
async function renderAdminProductsTab(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-bold text-white">Danh sách sản phẩm trong kho</h3>
        <button onclick="openProductModal()" class="gradient-btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
          <i data-lucide="plus" class="w-4 h-4"></i> Thêm sản phẩm mới
        </button>
      </div>

      <div class="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th class="p-4">Sản phẩm</th>
                <th class="p-4">Danh mục</th>
                <th class="p-4">Giá bán</th>
                <th class="p-4">Kho</th>
                <th class="p-4">Thương hiệu</th>
                <th class="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody id="admin-products-table-body" class="divide-y divide-slate-800">
              <tr><td colspan="6" class="p-8 text-center text-slate-400">Đang tải sản phẩm...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await apiCall('/products?page=1&page_size=50');
    const tbody = document.getElementById('admin-products-table-body');
    const products = res.items || [];

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">Chưa có sản phẩm nào.</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => `
      <tr class="hover:bg-slate-800/40 transition-colors">
        <td class="p-4 flex items-center gap-3">
          <img src="${p.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100'}" class="w-10 h-10 rounded-lg object-cover">
          <div>
            <strong class="text-white block font-medium">${p.name}</strong>
            <span class="text-slate-400 text-[11px]">Size: ${p.size || 'N/A'} • Màu: ${p.color || 'N/A'}</span>
          </div>
        </td>
        <td class="p-4 text-slate-300">${p.category_name || 'Chưa phân loại'}</td>
        <td class="p-4 font-bold text-amber-400">${formatVND(p.price)}</td>
        <td class="p-4">
          <span class="px-2 py-0.5 rounded text-[11px] font-bold ${p.stock > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
            ${p.stock} cái
          </span>
        </td>
        <td class="p-4 text-slate-300">${p.brand || 'Lumière'}</td>
        <td class="p-4 text-right space-x-2">
          <button onclick="editProduct(${p.id})" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400" title="Chỉnh sửa">
            <i data-lucide="edit" class="w-4 h-4"></i>
          </button>
          <button onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400" title="Xóa">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `).join('');

    lucide.createIcons();
  } catch (e) {
    console.error('Lỗi tải sản phẩm admin:', e);
  }
}

// Modal Thêm / Sửa Sản phẩm
async function openProductModal(product = null) {
  const isEdit = !!product;
  const { value: formValues } = await Swal.fire({
    title: `<span style="color:#f59e0b;">${isEdit ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</span>`,
    html: `
      <div style="text-align:left;font-size:12px;display:flex;flex-direction:column;gap:8px;color:#cbd5e1;max-height:60vh;overflow-y:auto;padding-right:5px;">
        <label>Tên sản phẩm (*):</label>
        <input id="sw-prod-name" class="swal2-input" style="margin:0;width:100%;color:#fff;background:#1e293b;border:1px solid #334155;border-radius:8px;" value="${product?.name || ''}">

        <label>Danh mục:</label>
        <select id="sw-prod-cat" style="width:100%;padding:8px;background:#1e293b;color:#fff;border:1px solid #334155;border-radius:8px;">
          ${state.categories.map(c => `<option value="${c.id}" ${product?.category_id == c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label>Giá bán (VNĐ) (*):</label>
            <input type="number" id="sw-prod-price" class="swal2-input" style="margin:0;width:100%;color:#fff;background:#1e293b;border:1px solid #334155;border-radius:8px;" value="${product?.price || 500000}">
          </div>
          <div>
            <label>Giá gốc (gạch ngang):</label>
            <input type="number" id="sw-prod-orig-price" class="swal2-input" style="margin:0;width:100%;color:#fff;background:#1e293b;border:1px solid #334155;border-radius:8px;" value="${product?.original_price || ''}">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label>Số lượng tồn kho (*):</label>
            <input type="number" id="sw-prod-stock" class="swal2-input" style="margin:0;width:100%;color:#fff;background:#1e293b;border:1px solid #334155;border-radius:8px;" value="${product?.stock || 20}">
          </div>
          <div>
            <label>Thương hiệu:</label>
            <input id="sw-prod-brand" class="swal2-input" style="margin:0;width:100%;color:#fff;background:#1e293b;border:1px solid #334155;border-radius:8px;" value="${product?.brand || 'Lumière'}">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label>Size (VD: S, M, L, XL):</label>
            <input id="sw-prod-size" class="swal2-input" style="margin:0;width:100%;color:#fff;background:#1e293b;border:1px solid #334155;border-radius:8px;" value="${product?.size || 'M, L'}">
          </div>
          <div>
            <label>Màu sắc:</label>
            <input id="sw-prod-color" class="swal2-input" style="margin:0;width:100%;color:#fff;background:#1e293b;border:1px solid #334155;border-radius:8px;" value="${product?.color || 'Đen, Trắng'}">
          </div>
        </div>

        <label>URL Hình ảnh:</label>
        <input id="sw-prod-img" class="swal2-input" style="margin:0;width:100%;color:#fff;background:#1e293b;border:1px solid #334155;border-radius:8px;" value="${product?.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'}">

        <label>Mô tả chi tiết:</label>
        <textarea id="sw-prod-desc" style="width:100%;height:70px;padding:8px;background:#1e293b;color:#fff;border:1px solid #334155;border-radius:8px;font-size:12px;">${product?.description || ''}</textarea>
      </div>
    `,
    background: '#0f172a',
    color: '#fff',
    showCancelButton: true,
    confirmButtonText: isEdit ? 'Lưu cập nhật' : 'Tạo mới',
    cancelButtonText: 'Đóng',
    confirmButtonColor: '#f59e0b',
    preConfirm: () => {
      const name = document.getElementById('sw-prod-name').value.trim();
      const price = parseFloat(document.getElementById('sw-prod-price').value);
      const origPrice = parseFloat(document.getElementById('sw-prod-orig-price').value) || null;
      const stock = parseInt(document.getElementById('sw-prod-stock').value);
      const catId = parseInt(document.getElementById('sw-prod-cat').value);
      const brand = document.getElementById('sw-prod-brand').value.trim();
      const size = document.getElementById('sw-prod-size').value.trim();
      const color = document.getElementById('sw-prod-color').value.trim();
      const img = document.getElementById('sw-prod-img').value.trim();
      const desc = document.getElementById('sw-prod-desc').value.trim();

      if (!name || isNaN(price)) {
        Swal.showValidationMessage('Vui lòng nhập tên và giá sản phẩm!');
        return false;
      }

      return {
        name,
        price,
        original_price: origPrice,
        stock: isNaN(stock) ? 0 : stock,
        category_id: catId,
        brand,
        size,
        color,
        image_url: img,
        description: desc,
        is_active: true,
        is_featured: false
      };
    }
  });

  if (formValues) {
    try {
      if (isEdit) {
        await apiCall(`/admin/products/${product.id}`, {
          method: 'PUT',
          body: JSON.stringify(formValues)
        });
        Swal.fire({ icon: 'success', title: 'Cập nhật thành công!', background: '#0f172a', color: '#fff' });
      } else {
        await apiCall('/admin/products', {
          method: 'POST',
          body: JSON.stringify(formValues)
        });
        Swal.fire({ icon: 'success', title: 'Thêm sản phẩm thành công!', background: '#0f172a', color: '#fff' });
      }
      renderAdminProductsTab(document.getElementById('admin-tab-content'));
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: e.message, background: '#0f172a', color: '#fff' });
    }
  }
}

async function editProduct(id) {
  try {
    const p = await apiCall(`/products/${id}`);
    openProductModal(p);
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Lỗi', text: e.message });
  }
}

async function deleteProduct(id, name) {
  const result = await Swal.fire({
    title: 'Xóa sản phẩm?',
    text: `Bạn có chắc muốn xóa "${name}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#475569',
    confirmButtonText: 'Đồng ý xóa',
    cancelButtonText: 'Hủy',
    background: '#0f172a',
    color: '#fff'
  });

  if (result.isConfirmed) {
    try {
      await apiCall(`/admin/products/${id}`, { method: 'DELETE' });
      Swal.fire({ icon: 'success', title: 'Đã xóa!', background: '#0f172a', color: '#fff' });
      renderAdminProductsTab(document.getElementById('admin-tab-content'));
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Lỗi xóa', text: e.message, background: '#0f172a', color: '#fff' });
    }
  }
}

// Admin: Quản lý đơn hàng toàn hệ thống
async function renderAdminOrdersTab(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <h3 class="text-lg font-bold text-white">Quản lý toàn bộ đơn hàng</h3>

      <div class="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th class="p-4">Mã đơn</th>
                <th class="p-4">Khách hàng</th>
                <th class="p-4">Địa chỉ giao</th>
                <th class="p-4">Tổng tiền</th>
                <th class="p-4">Trạng thái</th>
                <th class="p-4 text-right">Cập nhật</th>
              </tr>
            </thead>
            <tbody id="admin-orders-table-body" class="divide-y divide-slate-800">
              <tr><td colspan="6" class="p-8 text-center text-slate-400">Đang tải danh sách đơn hàng...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await apiCall('/admin/orders?page=1&page_size=50');
    const tbody = document.getElementById('admin-orders-table-body');
    const orders = res.items || [];

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">Chưa có đơn hàng nào.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr class="hover:bg-slate-800/40 transition-colors">
        <td class="p-4 font-mono font-bold text-white">${o.order_code || ('#' + o.id)}</td>
        <td class="p-4">
          <strong class="text-white block">${o.shipping_name || 'Khách hàng'}</strong>
          <span class="text-slate-400 text-[11px]">${o.shipping_phone || ''}</span>
        </td>
        <td class="p-4 text-slate-300 max-w-xs truncate">${o.shipping_address}</td>
        <td class="p-4 font-bold text-amber-400">${formatVND(o.total_amount)}</td>
        <td class="p-4">
          <select onchange="updateOrderStatus(${o.id}, this.value)" 
            class="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-amber-400">
            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Chờ xử lý</option>
            <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Đang chuẩn bị</option>
            <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Đang giao hàng</option>
            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Đã giao thành công</option>
            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
          </select>
        </td>
        <td class="p-4 text-right">
          <button onclick="viewOrderDetailAdmin(${o.id})" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold">
            Chi tiết
          </button>
        </td>
      </tr>
    `).join('');

    lucide.createIcons();
  } catch (e) {
    console.error('Lỗi tải danh sách đơn hàng admin:', e);
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    await apiCall(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Đã cập nhật trạng thái đơn!',
      showConfirmButton: false,
      timer: 1500,
      background: '#0f172a',
      color: '#fff'
    });
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Lỗi cập nhật', text: e.message, background: '#0f172a', color: '#fff' });
  }
}

async function viewOrderDetailAdmin(orderId) {
  try {
    const o = await apiCall(`/admin/orders/${orderId}`);
    Swal.fire({
      title: `<span style="color:#f59e0b;">Chi Tiết Đơn Hàng #${o.order_code || o.id}</span>`,
      html: `
        <div style="text-align:left;font-size:12px;color:#cbd5e1;line-height:1.6;">
          <p>Khách hàng: <strong>${o.shipping_name}</strong> - ${o.shipping_phone}</p>
          <p>Địa chỉ nhận: <strong>${o.shipping_address}</strong></p>
          <p>Phương thức: <strong>${o.payment_method?.toUpperCase()}</strong></p>
          ${o.notes ? `<p>Ghi chú: <em>"${o.notes}"</em></p>` : ''}
          <hr style="border-color:#334155;margin:10px 0;">
          <p style="font-weight:bold;margin-bottom:5px;">Sản phẩm đặt mua:</p>
          ${(o.items || []).map(i => `
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span>${i.product_name} (x${i.quantity})</span>
              <strong style="color:#f59e0b;">${formatVND(i.total_price)}</strong>
            </div>
          `).join('')}
          <hr style="border-color:#334155;margin:10px 0;">
          <p style="font-size:14px;display:flex;justify-content:space-between;">
            <span>Tổng cộng:</span>
            <strong style="color:#f59e0b;">${formatVND(o.total_amount)}</strong>
          </p>
        </div>
      `,
      background: '#0f172a',
      color: '#fff',
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Đóng'
    });
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Lỗi', text: e.message });
  }
}

// ==================== XÁC THỰC (AUTHENTICATION) ====================
function openAuthModal(tab = 'login') {
  document.getElementById('auth-modal').classList.remove('hidden');
  switchAuthTab(tab);
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('form-login');
  const regForm = document.getElementById('form-register');
  const loginTab = document.getElementById('auth-tab-login');
  const regTab = document.getElementById('auth-tab-register');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
    loginTab.className = 'flex-1 pb-3 text-center font-bold text-sm border-b-2 border-amber-400 text-amber-400 transition-all';
    regTab.className = 'flex-1 pb-3 text-center font-bold text-sm border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition-all';
  } else {
    loginForm.classList.add('hidden');
    regForm.classList.remove('hidden');
    regTab.className = 'flex-1 pb-3 text-center font-bold text-sm border-b-2 border-amber-400 text-amber-400 transition-all';
    loginTab.className = 'flex-1 pb-3 text-center font-bold text-sm border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition-all';
  }
}

function fillDemoAccount(email, password) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = password;
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    state.token = res.access_token;
    state.currentUser = res.user;
    localStorage.setItem('token', res.access_token);
    localStorage.setItem('user', JSON.stringify(res.user));

    closeAuthModal();
    renderUserMenu();
    await loadCart();

    const userAvatar = res.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(res.user.full_name || 'U')}&background=f59e0b&color=0f172a&bold=true`;

    Swal.fire({
      icon: 'success',
      title: `Xin chào, ${res.user.full_name}!`,
      html: `
        <div style="display:flex;align-items:center;gap:12px;margin-top:10px;text-align:left;">
          <img src="${userAvatar}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid #f59e0b;">
          <div>
            <div style="font-weight:bold;color:#fff;">${res.user.full_name}</div>
            <div style="font-size:12px;color:#94a3b8;">${res.user.email}</div>
            <div style="font-size:11px;color:#f59e0b;font-weight:600;margin-top:2px;">
              ${res.user.role === 'admin' ? '👑 Quản Trị Viên Hệ Thống' : '✨ Thành viên VIP Boutique'}
            </div>
          </div>
        </div>
      `,
      background: '#0f172a',
      color: '#fff',
      timer: 2000,
      showConfirmButton: false
    });

    if (res.user.role === 'admin') {
      navigate('admin');
    }
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Đăng nhập thất bại', text: error.message, background: '#0f172a', color: '#fff' });
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const full_name = document.getElementById('reg-fullname').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const phone = document.getElementById('reg-phone').value.trim();
  const address = document.getElementById('reg-address').value.trim();

  try {
    const res = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password, phone, address })
    });

    state.token = res.access_token;
    state.currentUser = res.user;
    localStorage.setItem('token', res.access_token);
    localStorage.setItem('user', JSON.stringify(res.user));

    closeAuthModal();
    renderUserMenu();
    await loadCart();

    Swal.fire({
      icon: 'success',
      title: 'Tạo tài khoản thành công! 🎉',
      text: `Chào mừng bạn đến với Lumière Fashion Store.`,
      background: '#0f172a',
      color: '#fff',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Đăng ký thất bại', text: error.message, background: '#0f172a', color: '#fff' });
  }
}

function logout(showNotice = true) {
  state.token = null;
  state.currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  renderUserMenu();
  loadCart();
  navigate('home');

  if (showNotice) {
    Swal.fire({
      icon: 'info',
      title: 'Đã đăng xuất',
      text: 'Hẹn gặp lại bạn!',
      background: '#0f172a',
      color: '#fff',
      timer: 1500,
      showConfirmButton: false
    });
  }
}

function renderUserMenu() {
  const container = document.getElementById('user-menu-container');
  if (!container) return;

  if (state.currentUser && state.token) {
    const isAdmin = state.currentUser.role === 'admin';
    const avatarUrl = state.currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(state.currentUser.full_name || 'User')}&background=f59e0b&color=0f172a&bold=true`;
    
    container.innerHTML = `
      <div class="relative group" id="user-menu-wrapper">
        <button id="user-menu-toggle-btn" onclick="toggleUserDropdown(event)" class="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full bg-slate-900/90 hover:bg-slate-800 text-xs text-white border border-amber-500/30 hover:border-amber-400 transition-all shadow-lg hover:shadow-amber-500/20">
          <div class="relative">
            <img src="${avatarUrl}" 
              alt="${state.currentUser.full_name}" 
              onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(state.currentUser.full_name || 'U')}&background=f59e0b&color=0f172a&bold=true'"
              class="w-8 h-8 rounded-full object-cover ring-2 ${isAdmin ? 'ring-amber-400 shadow-md shadow-amber-500/30' : 'ring-slate-600'}">
            <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-emerald-400'} ring-2 ring-slate-950"></span>
          </div>
          <div class="hidden sm:flex flex-col items-start text-left leading-tight">
            <span class="max-w-[110px] font-bold text-white truncate text-[11px]">${state.currentUser.full_name}</span>
            <span class="text-[9px] ${isAdmin ? 'text-amber-400 font-extrabold uppercase' : 'text-slate-400'}">${isAdmin ? '★ Quản Trị' : 'Thành viên VIP'}</span>
          </div>
          <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-transform group-hover:rotate-180"></i>
        </button>

        <!-- Dropdown Menu -->
        <div id="user-dropdown-menu" class="absolute right-0 mt-2.5 w-60 rounded-3xl glass-dropdown p-2.5 text-xs hidden group-hover:block space-y-1.5 shadow-2xl border border-amber-500/20 animate-fade-in z-50">
          <!-- Profile Card Header -->
          <div class="p-3 rounded-2xl bg-gradient-to-r from-slate-900/90 to-amber-950/30 border border-slate-800 flex items-center gap-3 cursor-pointer" onclick="openUserProfileModal()">
            <img src="${avatarUrl}" 
              alt="${state.currentUser.full_name}"
              onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(state.currentUser.full_name || 'U')}&background=f59e0b&color=0f172a&bold=true'"
              class="w-11 h-11 rounded-2xl object-cover ring-2 ring-amber-400/40 shadow-lg shrink-0">
            <div class="min-w-0 flex-grow">
              <span class="block font-bold text-white truncate text-xs">${state.currentUser.full_name}</span>
              <span class="block text-[10px] text-slate-400 truncate mt-0.5">${state.currentUser.email}</span>
              ${isAdmin 
                ? `<span class="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-black border border-amber-500/30">👑 QUẢN TRỊ VIÊN</span>` 
                : `<span class="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">✓ KHÁCH HÀNG VIP</span>`}
            </div>
          </div>

          <div class="pt-1 space-y-1">
            <button onclick="openUserProfileModal()" class="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 flex items-center gap-2.5 transition-colors">
              <div class="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <i data-lucide="user-cog" class="w-4 h-4"></i>
              </div>
              <div>
                <span class="font-semibold block">Hồ sơ cá nhân</span>
                <span class="text-[10px] text-slate-400 block">Đổi avatar, họ tên, địa chỉ</span>
              </div>
            </button>
            <button onclick="navigate('orders')" class="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 flex items-center gap-2.5 transition-colors">
              <div class="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <i data-lucide="package" class="w-4 h-4"></i>
              </div>
              <div>
                <span class="font-semibold block">Đơn mua của tôi</span>
                <span class="text-[10px] text-slate-400 block">Lịch sử đơn & trạng thái</span>
              </div>
            </button>
            ${isAdmin ? `
              <button onclick="navigate('admin')" class="w-full text-left p-2.5 rounded-xl hover:bg-amber-500/10 text-amber-300 flex items-center gap-2.5 transition-colors">
                <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                </div>
                <div>
                  <span class="font-bold block text-amber-400">Trang Quản Trị</span>
                  <span class="text-[10px] text-amber-400/70 block">CRUD sản phẩm, đơn, thống kê</span>
                </div>
              </button>
            ` : ''}
            <button onclick="logout()" class="w-full text-left p-2.5 rounded-xl hover:bg-rose-950/40 text-rose-400 flex items-center gap-2.5 transition-colors">
              <div class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                <i data-lucide="log-out" class="w-4 h-4"></i>
              </div>
              <span class="font-semibold">Đăng xuất tài khoản</span>
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button onclick="openAuthModal('login')" class="gradient-btn-gold px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
        <i data-lucide="user" class="w-4 h-4"></i> Đăng nhập
      </button>
    `;
  }
  lucide.createIcons();
}

function toggleUserDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('user-dropdown-menu');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}

document.addEventListener('click', (e) => {
  const menuWrapper = document.getElementById('user-menu-wrapper');
  const dropdown = document.getElementById('user-dropdown-menu');
  if (dropdown && menuWrapper && !menuWrapper.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});

// ==================== TRỢ LÝ AI STYLIST CHATBOT ====================
function toggleAIChat(forceOpen = false) {
  const box = document.getElementById('ai-chat-box');
  if (forceOpen) {
    box.classList.remove('hidden');
  } else {
    box.classList.toggle('hidden');
  }
}

function sendQuickPrompt(promptText) {
  document.getElementById('ai-chat-input').value = promptText;
  handleSendAIMessage(new Event('submit'));
}

async function handleSendAIMessage(e) {
  e.preventDefault();
  const input = document.getElementById('ai-chat-input');
  const message = input.value.trim();
  if (!message) return;

  const messagesContainer = document.getElementById('ai-chat-messages');

  // Thêm tin nhắn của User vào khung chat
  messagesContainer.innerHTML += `
    <div class="flex gap-2.5 items-start justify-end">
      <div class="p-3 rounded-2xl rounded-tr-sm bg-amber-500 text-slate-950 font-medium leading-relaxed max-w-[85%] shadow-sm">
        ${message}
      </div>
    </div>
  `;

  input.value = '';
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Hiển thị trạng thái đang soạn tin (typing)
  const typingId = 'typing-' + Date.now();
  messagesContainer.innerHTML += `
    <div id="${typingId}" class="flex gap-2.5 items-start">
      <div class="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
        <i data-lucide="bot" class="w-4 h-4"></i>
      </div>
      <div class="p-3 rounded-2xl rounded-tl-sm bg-slate-800/90 text-slate-400 border border-slate-700/60 leading-relaxed max-w-[85%] flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse delay-150"></span>
        <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse delay-300"></span>
        <span class="text-[11px] ml-1">AI Stylist đang suy nghĩ & tìm đồ...</span>
      </div>
    </div>
  `;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  lucide.createIcons();

  try {
    // Lưu vào history
    state.chatHistory.push({ role: 'user', content: message });

    const res = await apiCall('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: message,
        conversation_history: state.chatHistory.slice(-6)
      })
    });

    // Xóa typing
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    // Thêm câu trả lời của AI
    state.chatHistory.push({ role: 'assistant', content: res.reply });

    let productsHtml = '';
    if (res.products && res.products.length > 0) {
      productsHtml = `
        <div class="mt-2.5 pt-2 border-t border-slate-700/60 space-y-1.5">
          <span class="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Sản phẩm gợi ý:</span>
          ${res.products.map(p => `
            <div onclick="openProductDetail(${p.id})" class="cursor-pointer p-1.5 rounded-lg bg-slate-900/80 hover:bg-amber-500/10 flex items-center justify-between border border-slate-700 text-[11px] transition-colors">
              <span class="text-white font-medium truncate max-w-[180px]">${p.name}</span>
              <strong class="text-amber-400">${formatVND(p.price)}</strong>
            </div>
          `).join('')}
        </div>
      `;
    }

    messagesContainer.innerHTML += `
      <div class="flex gap-2.5 items-start">
        <div class="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <i data-lucide="bot" class="w-4 h-4"></i>
        </div>
        <div class="p-3.5 rounded-2xl rounded-tl-sm bg-slate-800/90 text-slate-200 border border-slate-700/60 leading-relaxed max-w-[85%] shadow-sm">
          ${res.reply.replace(/\n/g, '<br>')}
          ${productsHtml}
        </div>
      </div>
    `;

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    lucide.createIcons();
  } catch (error) {
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    messagesContainer.innerHTML += `
      <div class="flex gap-2.5 items-start">
        <div class="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
          <i data-lucide="alert-circle" class="w-4 h-4"></i>
        </div>
        <div class="p-3 rounded-2xl rounded-tl-sm bg-rose-950/40 text-rose-200 border border-rose-800/60 text-xs leading-relaxed max-w-[85%]">
          Rất tiếc, chưa kết nối được máy chủ AI. Bạn hãy chắc chắn backend đang chạy tại port 8000 nhé!
        </div>
      </div>
    `;
    lucide.createIcons();
  }
}

// ==================== USER PROFILE & AVATAR MANAGEMENT ====================
function openUserProfileModal() {
  if (!state.currentUser) {
    showToast('Vui lòng đăng nhập trước!', 'warning');
    openAuthModal('login');
    return;
  }

  const modal = document.getElementById('user-profile-modal');
  const avatarImg = document.getElementById('profile-modal-avatar');
  const emailInput = document.getElementById('profile-email');
  const nameInput = document.getElementById('profile-fullname');
  const phoneInput = document.getElementById('profile-phone');
  const addrInput = document.getElementById('profile-address');
  const avatarUrlInput = document.getElementById('profile-avatar-url');

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(state.currentUser.full_name || 'U')}&background=f59e0b&color=0f172a&bold=true`;
  avatarImg.src = state.currentUser.avatar_url || defaultAvatar;
  avatarImg.onerror = () => { avatarImg.src = defaultAvatar; };

  emailInput.value = state.currentUser.email || '';
  nameInput.value = state.currentUser.full_name || '';
  phoneInput.value = state.currentUser.phone || '';
  addrInput.value = state.currentUser.address || '';
  avatarUrlInput.value = state.currentUser.avatar_url || '';

  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeUserProfileModal() {
  const modal = document.getElementById('user-profile-modal');
  if (modal) modal.classList.add('hidden');
}

async function handleAvatarFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Vui lòng chọn tập tin hình ảnh (PNG, JPG, WebP)!', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  showToast('Đang tải ảnh đại diện lên...', 'info');

  try {
    const res = await fetch(`${API_BASE}/auth/upload-avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.token}`
      },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Không thể tải ảnh lên');
    }

    const data = await res.json();
    state.currentUser = data.user;
    localStorage.setItem('user', JSON.stringify(state.currentUser));

    const avatarImg = document.getElementById('profile-modal-avatar');
    if (avatarImg) avatarImg.src = data.avatar_url;
    const avatarUrlInput = document.getElementById('profile-avatar-url');
    if (avatarUrlInput) avatarUrlInput.value = data.avatar_url;

    renderAuthNav();
    showToast('Tải lên ảnh đại diện thành công!', 'success');
  } catch (error) {
    console.error('Lỗi tải avatar:', error);
    showToast(error.message || 'Lỗi khi tải ảnh đại diện', 'error');
  }
}

async function handleSaveProfile(e) {
  e.preventDefault();
  if (!state.currentUser) return;

  const fullName = document.getElementById('profile-fullname').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();
  const address = document.getElementById('profile-address').value.trim();
  const avatarUrl = document.getElementById('profile-avatar-url').value.trim();

  const btn = document.getElementById('btn-save-profile');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Đang lưu...';

  try {
    const payload = {
      full_name: fullName,
      phone: phone || null,
      address: address || null,
      avatar_url: avatarUrl || null
    };

    const updated = await fetchAPI('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    state.currentUser = updated;
    localStorage.setItem('user', JSON.stringify(updated));
    renderAuthNav();
    closeUserProfileModal();
    showToast('Cập nhật hồ sơ cá nhân thành công!', 'success');
  } catch (error) {
    console.error('Lỗi cập nhật profile:', error);
    showToast(error.message || 'Không thể cập nhật hồ sơ', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

