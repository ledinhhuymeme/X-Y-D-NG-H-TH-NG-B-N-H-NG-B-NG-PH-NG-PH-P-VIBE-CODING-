/**
 * BOUTIQUE HUY DINH - UI ENHANCEMENTS LAYER
 * Lớp hiệu ứng giao diện (không thay đổi logic nghiệp vụ trong app.js):
 * - Theme SweetAlert2 đồng bộ tông tối/vàng gold
 * - Thanh tiến trình cuộn, header thu gọn, nút "lên đầu trang"
 * - Scroll reveal cho các section render động
 * - Spotlight theo con trỏ trên thẻ sản phẩm
 * - Hiệu ứng "bay vào giỏ" + nảy badge giỏ hàng
 * - Đếm số động (counter) ở hero, phím ESC đóng modal
 */
(function () {
  'use strict';

  // ---------- 1. THEME SWEETALERT2 ----------
  if (window.Swal) {
    const originalFire = Swal.fire;
    const themedFire = function (...args) {
      // Hỗ trợ cả kiểu gọi Swal.fire(title, text, icon)
      let opts = typeof args[0] === 'object' && args[0] !== null
        ? { ...args[0] }
        : { title: args[0], html: args[1], icon: args[2] };

      const isToast = !!opts.toast;
      const extraClass = isToast ? 'hd-toast' : 'hd-swal';
      const customClass = typeof opts.customClass === 'object' ? { ...opts.customClass } : {};
      customClass.popup = `${customClass.popup || ''} ${extraClass}`.trim();

      opts = {
        color: '#f1f5f9',
        confirmButtonColor: '#f59e0b',
        ...opts,
        customClass,
      };
      // Ép nền theo theme để CSS gradient được áp dụng
      opts.background = isToast ? 'rgba(15,23,42,0.92)' : 'transparent';
      if (isToast) {
        opts.timerProgressBar = opts.timerProgressBar ?? true;
        opts.position = opts.position || 'top-end';
      }
      return originalFire.call(Swal, opts);
    };
    Swal.fire = themedFire;
    // Swal.mixin(params).fire(opts) -> gộp params rồi đi qua theme
    Swal.mixin = (mixinParams = {}) => ({
      fire: (opts = {}) => themedFire({ ...mixinParams, ...(typeof opts === 'object' ? opts : { title: opts }) }),
    });
  }

  // ---------- 2. SCROLL: PROGRESS BAR, HEADER, BACK-TO-TOP ----------
  const progressEl = document.getElementById('scroll-progress');
  const backTopEl = document.getElementById('back-to-top');
  const headerEl = document.querySelector('header.glass-nav');

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollTop = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressEl) progressEl.style.width = `${max > 0 ? (scrollTop / max) * 100 : 0}%`;
      if (headerEl) headerEl.classList.toggle('scrolled', scrollTop > 40);
      if (backTopEl) backTopEl.classList.toggle('show', scrollTop > 600);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  if (backTopEl) backTopEl.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ---------- 3. SCROLL REVEAL (hỗ trợ nội dung render động) ----------
  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
            // Kích hoạt counter nếu có
            entry.target.querySelectorAll('[data-count-to]').forEach(animateCounter);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    : null;

  function scanReveal(root = document) {
    root.querySelectorAll('.reveal:not(.is-visible):not([data-reveal-bound])').forEach((el) => {
      el.setAttribute('data-reveal-bound', '1');
      if (revealObserver) revealObserver.observe(el);
      else el.classList.add('is-visible');
    });
  }

  // ---------- 4. COUNTER ----------
  function animateCounter(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const target = parseFloat(el.dataset.countTo);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toLocaleString('vi-VN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Theo dõi #app-content để quét lại khi view thay đổi
  const appContent = document.getElementById('app-content');
  if (appContent && 'MutationObserver' in window) {
    new MutationObserver(() => scanReveal(appContent)).observe(appContent, { childList: true, subtree: true });
  }

  // ---------- 5. SPOTLIGHT THEO CON TRỎ ----------
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest && e.target.closest('.card-hover');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }, { passive: true });

  // ---------- 6. FLY-TO-CART + BADGE BUMP ----------
  const badge = document.getElementById('cart-badge');
  if (badge && 'MutationObserver' in window) {
    let lastValue = badge.textContent;
    new MutationObserver(() => {
      if (badge.textContent !== lastValue) {
        const increased = parseInt(badge.textContent, 10) > parseInt(lastValue, 10);
        lastValue = badge.textContent;
        if (increased) {
          badge.classList.remove('badge-bump');
          void badge.offsetWidth; // restart animation
          badge.classList.add('badge-bump');
        }
      }
    }).observe(badge, { childList: true, characterData: true, subtree: true });
  }

  function flyToCart(sourceEl) {
    if (!sourceEl || !badge) return;
    const from = sourceEl.getBoundingClientRect();
    const to = badge.getBoundingClientRect();
    const dot = document.createElement('div');
    dot.className = 'fly-dot';
    dot.style.left = `${from.left + from.width / 2 - 9}px`;
    dot.style.top = `${from.top + from.height / 2 - 9}px`;
    document.body.appendChild(dot);
    requestAnimationFrame(() => {
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      dot.style.transform = `translate(${dx}px, ${dy}px) scale(0.4)`;
      dot.style.opacity = '0.3';
    });
    setTimeout(() => dot.remove(), 800);
  }

  // Bọc hàm addToCart gốc trong app.js để thêm hiệu ứng
  if (typeof window.addToCart === 'function') {
    const originalAddToCart = window.addToCart;
    window.addToCart = function (...args) {
      try {
        const ev = window.event;
        const src = ev && ev.target && ev.target.closest ? ev.target.closest('button') : null;
        if (src) flyToCart(src);
      } catch (_) { /* bỏ qua */ }
      return originalAddToCart.apply(this, args);
    };
  }

  // ---------- 7. PHÍM ESC ĐÓNG MODAL ----------
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const isOpen = (id) => {
      const el = document.getElementById(id);
      return el && !el.classList.contains('hidden');
    };
    if (isOpen('product-detail-modal') && window.closeProductDetailModal) return closeProductDetailModal();
    if (isOpen('cart-modal') && window.closeCartModal) return closeCartModal();
    if (isOpen('auth-modal') && window.closeAuthModal) return closeAuthModal();
    if (isOpen('checkout-modal') && window.closeCheckoutModal) return closeCheckoutModal();
  });

  // Click ra ngoài backdrop để đóng modal
  [['cart-modal', 'closeCartModal'], ['auth-modal', 'closeAuthModal'], ['product-detail-modal', 'closeProductDetailModal'], ['checkout-modal', 'closeCheckoutModal']]
    .forEach(([id, fn]) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', (e) => {
        if (e.target === el && typeof window[fn] === 'function') window[fn]();
      });
    });

  // Khởi động
  scanReveal();
  onScroll();
  window.HDUI = { scanReveal, flyToCart, animateCounter };
})();
