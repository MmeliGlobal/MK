// app.js - Frontend E-Commerce Logic
const API_BASE = 'http://localhost:5000/api';
let token = localStorage.getItem('token');
let currentUser = null;
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentPage = 'home';
let allProducts = [];

// DOM Elements
const homePage = document.getElementById('homePage');
const shopPage = document.getElementById('shopPage');
const trackingPage = document.getElementById('trackingPage');
const adminPanel = document.getElementById('adminPanel');
const cartSidebar = document.getElementById('cartSidebar');
const cartCountSpan = document.getElementById('cartCount');
const cartItemsDiv = document.getElementById('cartItems');
const cartTotalSpan = document.getElementById('cartTotal');
const productModal = document.getElementById('productModal');
const authModal = document.getElementById('authModal');

// Helper Functions
function updateCartUI() {
  cartCountSpan.innerText = cart.reduce((sum, i) => sum + i.quantity, 0);
  renderCartItems();
  localStorage.setItem('cart', JSON.stringify(cart));
}

function renderCartItems() {
  if (!cartItemsDiv) return;
  if (cart.length === 0) {
    cartItemsDiv.innerHTML = '<p>Your cart is empty</p>';
    cartTotalSpan.innerText = '0.00';
    return;
  }
  let total = 0;
  cartItemsDiv.innerHTML = cart.map((item, idx) => {
    total += item.price * item.quantity;
    return `
      <div class="cart-item">
        <img src="${item.image}" class="cart-item-img" onerror="this.src='https://via.placeholder.com/70'">
        <div class="cart-item-details">
          <strong>${item.name}</strong><br>
          $${item.price} x ${item.quantity}<br>
          <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
        <button class="remove-item" data-index="${idx}"><i class="fas fa-trash"></i></button>
      </div>
    `;
  }).join('');
  cartTotalSpan.innerText = total.toFixed(2);
  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.dataset.index);
      cart.splice(idx, 1);
      updateCartUI();
    });
  });
}

async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    location.reload();
  }
  return res.json();
}

async function loadProducts() {
  const data = await apiCall('/products');
  allProducts = data.products || [];
  renderProducts(allProducts, 'allProducts');
  renderFeatured(allProducts.slice(0, 6));
}

function renderProducts(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (products.length === 0) {
    container.innerHTML = '<p>No products found.</p>';
    return;
  }
  container.innerHTML = products.map(p => `
    <div class="product-card" data-id="${p._id}">
      <img src="${p.images?.[0] || 'https://via.placeholder.com/260'}" class="product-img" onerror="this.src='https://via.placeholder.com/260'">
      <div class="product-info">
        <div class="product-title">${p.name}</div>
        <div class="product-price">$${p.price}</div>
        <div class="product-category">${p.category}</div>
        <button class="add-to-cart" data-id="${p._id}">Add to Cart</button>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const product = allProducts.find(p => p._id === id);
      if (product) addToCart(product);
    });
  });
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => showProductDetail(card.dataset.id));
  });
}

function renderFeatured(products) {
  const container = document.getElementById('featuredProducts');
  if (!container) return;
  container.innerHTML = products.map(p => `
    <div class="product-card" data-id="${p._id}">
      <img src="${p.images?.[0] || 'https://via.placeholder.com/260'}" class="product-img">
      <div class="product-info">
        <div class="product-title">${p.name}</div>
        <div class="product-price">$${p.price}</div>
        <button class="add-to-cart" data-id="${p._id}">Add to Cart</button>
      </div>
    </div>
  `).join('');
  attachCartEvents();
}

function attachCartEvents() {
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const product = allProducts.find(p => p._id === id);
      if (product) addToCart(product);
    });
  });
}

function addToCart(product) {
  const existing = cart.find(i => i.id === product._id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || 'https://via.placeholder.com/70',
      quantity: 1
    });
  }
  updateCartUI();
  cartSidebar.classList.add('open');
}

async function showProductDetail(id) {
  const product = allProducts.find(p => p._id === id);
  if (!product) return;
  const detailDiv = document.getElementById('productDetail');
  detailDiv.innerHTML = `
    <div class="product-detail-grid">
      <img src="${product.images?.[0]}" class="product-detail-img" onerror="this.src='https://via.placeholder.com/400'">
      <div class="product-detail-info">
        <h2>${product.name}</h2>
        <p>${product.description || 'Premium quality product'}</p>
        <div class="product-detail-price">$${product.price}</div>
        <div class="quantity-selector">
          <button id="qtyMinus">-</button>
          <span id="detailQty">1</span>
          <button id="qtyPlus">+</button>
        </div>
        <button id="detailAddCart" class="add-to-cart">Add to Cart</button>
      </div>
    </div>
  `;
  let qty = 1;
  document.getElementById('qtyMinus').onclick = () => { if (qty > 1) qty--; document.getElementById('detailQty').innerText = qty; };
  document.getElementById('qtyPlus').onclick = () => { qty++; document.getElementById('detailQty').innerText = qty; };
  document.getElementById('detailAddCart').onclick = () => {
    for(let i=0;i<qty;i++) addToCart(product);
    productModal.classList.remove('active');
  };
  productModal.classList.add('active');
}

// Checkout
document.getElementById('checkoutBtn')?.addEventListener('click', () => {
  if (!token) {
    alert('Please login first');
    authModal.classList.add('active');
    return;
  }
  if (cart.length === 0) {
    alert('Cart is empty');
    return;
  }
  document.getElementById('checkoutModal').classList.add('active');
});

document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const address = document.getElementById('address').value;
  const city = document.getElementById('city').value;
  const zip = document.getElementById('zip').value;
  const payment = document.getElementById('paymentMethod').value;
  const orderData = {
    items: cart.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price })),
    total: cart.reduce((s,i) => s + i.price * i.quantity, 0),
    shippingAddress: { address, city, zip },
    paymentMethod: payment
  };
  const res = await apiCall('/orders', 'POST', orderData);
  if (res.success) {
    alert('Order placed successfully!');
    cart = [];
    updateCartUI();
    document.getElementById('checkoutModal').classList.remove('active');
    cartSidebar.classList.remove('open');
  } else {
    alert('Order failed: ' + (res.message || 'Error'));
  }
});

// Auth
document.getElementById('authBtn').onclick = () => authModal.classList.add('active');
document.querySelectorAll('.close-modal').forEach(btn => {
  btn.onclick = () => {
    productModal.classList.remove('active');
    authModal.classList.remove('active');
    document.getElementById('checkoutModal').classList.remove('active');
  };
});
document.getElementById('loginTab').onclick = () => {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginTab').classList.add('active');
  document.getElementById('registerTab').classList.remove('active');
};
document.getElementById('registerTab').onclick = () => {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.getElementById('registerTab').classList.add('active');
  document.getElementById('loginTab').classList.remove('active');
};
document.getElementById('loginForm').onsubmit = async (e) => {
  e.preventDefault();
  const email = e.target[0].value;
  const password = e.target[1].value;
  const res = await apiCall('/auth/login', 'POST', { email, password });
  if (res.token) {
    token = res.token;
    localStorage.setItem('token', token);
    currentUser = res.user;
    alert('Login successful');
    authModal.classList.remove('active');
    checkAdminAccess();
    loadProducts();
  } else alert('Login failed');
};
document.getElementById('registerForm').onsubmit = async (e) => {
  e.preventDefault();
  const name = e.target[0].value;
  const email = e.target[1].value;
  const password = e.target[2].value;
  const res = await apiCall('/auth/register', 'POST', { name, email, password });
  if (res.token) {
    token = res.token;
    localStorage.setItem('token', token);
    alert('Registration successful');
    authModal.classList.remove('active');
    loadProducts();
  } else alert('Registration failed');
};

// Navigation
document.querySelectorAll('.nav-link, [data-page]').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page || btn.getAttribute('data-page');
    if (page === 'home') showPage('homePage');
    else if (page === 'shop') showPage('shopPage');
    else if (page === 'tracking') showPage('trackingPage');
    else if (page === 'admin' && currentUser?.isAdmin) showPage('adminPanel');
  });
});
document.getElementById('cartIconBtn').onclick = () => cartSidebar.classList.add('open');
document.getElementById('closeCartBtn').onclick = () => cartSidebar.classList.remove('open');
document.getElementById('logo').onclick = () => showPage('homePage');

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if (pageId === 'shopPage') renderProducts(allProducts, 'allProducts');
  if (pageId === 'adminPanel' && currentUser?.isAdmin) loadAdminData();
}

async function checkAdminAccess() {
  if (!token) return;
  const user = await apiCall('/auth/me');
  if (user.isAdmin) {
    currentUser = user;
    const adminNav = document.createElement('button');
    adminNav.className = 'nav-link';
    adminNav.setAttribute('data-page', 'admin');
    adminNav.innerHTML = '<i class="fas fa-crown"></i> Admin';
    document.querySelector('.nav-links').appendChild(adminNav);
    adminNav.addEventListener('click', () => showPage('adminPanel'));
  }
}

async function loadAdminData() {
  const products = await apiCall('/admin/products');
  const orders = await apiCall('/admin/orders');
  const users = await apiCall('/admin/users');
  renderAdminProducts(products);
  renderAdminOrders(orders);
  renderAdminUsers(users);
}

function renderAdminProducts(products) {
  const container = document.getElementById('adminProducts');
  container.innerHTML = `
    <h3>Manage Products</h3>
    <button id="addProductBtn">+ Add Product</button>
    <table class="admin-table"><thead><tr><th>Name</th><th>Price</th><th>Category</th><th>Actions</th></tr></thead><tbody>
    ${products.map(p => `<tr><td>${p.name}</td><td>$${p.price}</td><td>${p.category}</td><td><button class="edit-btn" data-id="${p._id}">Edit</button><button class="delete-btn" data-id="${p._id}">Delete</button></td></tr>`).join('')}
    </tbody></table>
  `;
}

function renderAdminOrders(orders) {
  const container = document.getElementById('adminOrders');
  container.innerHTML = `<h3>Orders</h3><table class="admin-table"><thead><tr><th>Order ID</th><th>User</th><th>Total</th><th>Status</th></tr></thead><tbody>
    ${orders.map(o => `<tr><td>${o._id}</td><td>${o.userEmail}</td><td>$${o.total}</td><td>${o.status}</td></tr>`).join('')}
  </tbody></table>`;
}

function renderAdminUsers(users) {
  const container = document.getElementById('adminUsers');
  container.innerHTML = `<h3>Users</h3><table class="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>
    ${users.map(u => `<tr><td>${u.name}</td><td>${u.email}</td><td>${u.isAdmin ? 'Admin' : 'User'}</td></tr>`).join('')}
  </tbody></table>`;
}

// Search & Filter
document.getElementById('searchBtn').onclick = () => {
  const term = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
  renderProducts(filtered, 'allProducts');
};
document.getElementById('resetFilterBtn').onclick = () => {
  document.getElementById('searchInput').value = '';
  document.getElementById('categoryFilter').value = '';
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  renderProducts(allProducts, 'allProducts');
};

// Tracking
document.getElementById('trackOrderBtn').onclick = async () => {
  const orderId = document.getElementById('trackingId').value;
  const res = await apiCall(`/orders/${orderId}/track`);
  const resultDiv = document.getElementById('trackingResult');
  if (res.order) {
    resultDiv.innerHTML = `<div class="tracking-result"><strong>Order #${res.order._id}</strong><br>Status: ${res.order.status}<br>Total: $${res.order.total}<br>Placed: ${new Date(res.order.createdAt).toLocaleString()}</div>`;
  } else {
    resultDiv.innerHTML = '<p>Order not found</p>';
  }
};

// Initialize
loadProducts();
updateCartUI();
checkAdminAccess();
document.querySelectorAll('.admin-tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.getElementById(`admin${btn.innerText}`).style.display = 'block';
  });
});
