// ─── cart.js — Glow & Scent ───────────────────────────────────────
// Single source of truth for all cart logic.

const API_BASE = 'http://localhost:4000'; 

// ── Storage helpers ───────────────────────────────────────────────
function getCart() {
  try { return JSON.parse(localStorage.getItem('cart')) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// ── Badge update ──────────────────────────────────────────────────
function updateCartBadge() {
  const total = getCart().reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  
  const badges = document.querySelectorAll('#cartCount, #cartCountFloat, .cart-count');
  badges.forEach(el => {
    if (el.textContent !== String(total)) {
      el.textContent = total;
      
      // Modern pop animation
      el.style.transform = 'scale(1.3)';
      el.style.transition = 'transform 0.2s';
      setTimeout(() => el.style.transform = 'scale(1)', 200);
    }
  });
}

// ── Add to cart ──────────────────────────────────────────────────
function addToCart(name, price, image = null, btnEl = null) {
  if (!image && btnEl) {
    const card = btnEl.closest('.product-card');
    if (card) image = card.querySelector('img')?.src || null;
  }

  const cart = getCart();
  const existing = cart.find(item => item.name === name);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price: Number(price), image, qty: 1 });
  }

  saveCart(cart);
  updateCartBadge();

  // Modern Visual feedback

}

// ── Remove item ───────────────────────────────────────────────────
function removeItem(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  updateCartBadge();
  renderCart();
}

// ── Quantity change ───────────────────────────────────────────────
function changeQty(index, delta) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].qty = Math.max(1, (cart[index].qty || 1) + delta);
  saveCart(cart);
  updateCartBadge();
  renderCart();
}

// ── Render cart page ──────────────────────────────────────────────
function renderCart() {
  const container = document.querySelector('.cart-container');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <h1>Your Cart</h1>
      <div class="empty-cart">
        <i class="fas fa-shopping-basket empty-icon"></i>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <a href="moreproduct.html" class="shop-now-btn">Browse Products</a>
      </div>`;
    return;
  }

  let subtotal = 0;
  
  let itemsHtml = '<div class="cart-items-wrapper">';

  cart.forEach((item, idx) => {
    const qty   = Number(item.qty) || 1;
    const price = Number(item.price) || 0;
    subtotal += qty * price;

    itemsHtml += `
      <div class="cart-item">
        <img src="${item.image || 'https://via.placeholder.com/90x90'}" alt="${item.name}">
        <div class="cart-item-info">
          <h3>${item.name}</h3>
          <p>₹${price.toFixed(2)} each</p>
          <div class="qty-controls">
            <button class="qty-btn" onclick="changeQty(${idx}, -1)"><i class="fas fa-minus" style="font-size:0.7rem;"></i></button>
            <span class="qty-num">${qty}</span>
            <button class="qty-btn" onclick="changeQty(${idx}, 1)"><i class="fas fa-plus" style="font-size:0.7rem;"></i></button>
          </div>
        </div>
        <div class="cart-item-price">₹${(price * qty).toFixed(2)}</div>
        <button class="remove-btn" onclick="removeItem(${idx})" title="Remove item">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>`;
  });

  itemsHtml += '</div>'; // close cart-items-wrapper
  
  const shipping = subtotal > 1500 ? 0 : 99;
  const total = subtotal + shipping;

  const summaryHtml = `
    <div class="cart-summary">
      <h2>Order Summary</h2>
      <div class="summary-row">
        <span>Subtotal</span>
        <span>₹${subtotal.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping</span>
        <span>${shipping === 0 ? 'Free' : '₹' + shipping.toFixed(2)}</span>
      </div>
      <div class="summary-row total-row">
        <span>Total</span>
        <span>₹${total.toFixed(2)}</span>
      </div>
      <button onclick="window.location.href='Checkout.html'" class="checkout-btn">
        Proceed to Checkout <i class="fas fa-arrow-right"></i>
      </button>
      
      <div class="payment-methods">
        <i class="fab fa-cc-visa" title="Visa"></i>
        <i class="fab fa-cc-mastercard" title="Mastercard"></i>
        <i class="fab fa-cc-paypal" title="PayPal"></i>
        <i class="fab fa-google-pay" title="GPay"></i>
      </div>
    </div>
  `;

  container.innerHTML = `
    <h1>Your Cart</h1>
    <div class="cart-layout">
      ${itemsHtml}
      ${summaryHtml}
    </div>
  `;
}

// ── Clean Initialization ──────────────────────────────────────────
let isRendering = false;

document.addEventListener('DOMContentLoaded', () => {
  if (isRendering) return;
  
  updateCartBadge();
  
  const cartContainer = document.querySelector('.cart-container');
  if (cartContainer) {
    isRendering = true;
    renderCart();
    isRendering = false;
  }
});

// Update on cross-tab storage changes
window.addEventListener('storage', (e) => {
  if (e.key !== 'cart') return;
  updateCartBadge();
  if (document.querySelector('.cart-container') && !isRendering) {
    isRendering = true;
    renderCart();
    isRendering = false;
  }
});