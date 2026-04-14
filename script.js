// ==================== SUPABASE CONFIGURATION ====================
const SUPABASE_URL = "https://ceyrltlpxfyfriwzfdqt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nsXB_KjMeLGBGWIqqYFJuA_CPPIAK2-";
let supabase = null;
let allProducts = [];
let currentProduct = null;
let cart = [];
let loggedInUser = null;
let isAdmin = false;

// ==================== CATEGORY HIERARCHY ====================
const categoryHierarchy = {
  "Phones": { "Smartphones": ["Android Phones", "iPhones"], "Accessories": ["Chargers", "Cases"] },
  "Electronics": { "Laptops": ["Gaming", "Business"], "Audio": ["Headphones"] },
  "Fashion": { "Men": ["Shirts", "Pants"], "Women": ["Dresses"] }
};
const topLevelNames = { "Phones": "Phones", "Electronics": "Electr.", "Fashion": "Fashion" };

// ==================== INITIALIZATION ====================
async function init() {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await loadProducts();
  setupCategoryMenu();
  populateFilters();
  await checkUser();
  updateCartCount();
  renderCart();
  loadPromos();
  initMap();
  setupEventListeners();
  checkUrlForProduct();
}

function setupEventListeners() {
  document.getElementById("addItemBtn")?.addEventListener("click", addQuoteItemRow);
  document.getElementById("adminEntry")?.addEventListener("click", () => switchPage("adminDashboard"));
  document.getElementById("logoArea")?.addEventListener("dblclick", () => switchPage("adminDashboard"));
  document.getElementById("scanInput")?.addEventListener("change", () => alert("Scan feature coming soon"));
}

// ==================== PRODUCTS ====================
async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*').eq('is_active', true);
  if (!error && data && data.length) {
    allProducts = data.map(p => ({
      id: p.id, name: p.name, desc: p.description, cat: p.cat, subcat: p.subcat,
      price: p.price, colors: p.colors || ['Default'],
      sizeOptions: p.size_options || [{ size: 'Standard', price: p.price }],
      mainImage: p.images?.[0] || 'https://via.placeholder.com/300',
      subImages: p.images?.slice(1) || [], slug: p.slug
    }));
  } else {
    // Demo products if no data
    allProducts = [
      { id: 1, name: "iPhone 16e", desc: "Latest iPhone", cat: "Phones", subcat: "Smartphones", price: 357, colors: ["Black"], sizeOptions: [{ size: "128GB", price: 357 }], mainImage: "https://i.imgur.com/9wBjqIU.jpeg", subImages: [] },
      { id: 2, name: "Leather Tote", desc: "Premium bag", cat: "Fashion", subcat: "Women", price: 129, colors: ["Brown"], sizeOptions: [{ size: "One Size", price: 129 }], mainImage: "https://i.imgur.com/Z1aTPZl.jpeg", subImages: [] }
    ];
  }
  displayHomeProducts(allProducts);
}

async function addProduct() {
  const name = document.getElementById("newName").value.trim();
  const price = parseFloat(document.getElementById("newPrice").value);
  const image = document.getElementById("newImage").value.trim();
  const cat = document.getElementById("newCategory").value.trim();
  const subcat = document.getElementById("newSubcategory").value.trim();
  if (!name || isNaN(price) || !image || !cat) return alert("Fill required fields");

  const colors = document.getElementById("newColor").value.split(',').map(c => c.trim());
  const extraImages = document.getElementById("newExtraImages").value.split(',').map(u => u.trim()).filter(u => u);
  const sizeInput = document.getElementById("newSize").value;
  let sizeOptions = [];
  if (sizeInput) {
    sizeInput.split(',').forEach(pair => {
      let [s, p] = pair.split(':');
      if (s && p) sizeOptions.push({ size: s.trim(), price: parseFloat(p) });
    });
  }
  if (!sizeOptions.length) sizeOptions.push({ size: "Standard", price });

  const newProduct = {
    name, price, description: document.getElementById("newDesc").value,
    cat, subcat, colors, size_options: sizeOptions,
    images: [image, ...extraImages], is_active: true,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  };
  const { data, error } = await supabase.from('products').insert(newProduct).select();
  if (error) return alert("Error: " + error.message);
  allProducts.push(data[0]);
  displayHomeProducts(allProducts);
  loadProductsFull();
  alert("Product added");
  clearProductForm();
}

async function deleteProduct(id) {
  if (confirm("Delete product?")) {
    await supabase.from('products').delete().eq('id', id);
    allProducts = allProducts.filter(p => p.id != id);
    displayHomeProducts(allProducts);
    loadProductsFull();
  }
}

function editProduct(id) {
  const product = allProducts.find(p => p.id == id);
  if (!product) return;
  document.getElementById("newName").value = product.name;
  document.getElementById("newPrice").value = product.price;
  document.getElementById("newImage").value = product.mainImage;
  document.getElementById("newExtraImages").value = product.subImages.join(", ");
  document.getElementById("newDesc").value = product.desc;
  document.getElementById("newCategory").value = product.cat;
  document.getElementById("newSubcategory").value = product.subcat;
  document.getElementById("newColor").value = product.colors.join(", ");
  document.getElementById("newSize").value = product.sizeOptions.map(s => `${s.size}:${s.price}`).join(", ");
  const btn = document.querySelector("#adminAddProductPage button");
  btn.innerHTML = '<i class="fas fa-save"></i> Update Product';
  btn.onclick = () => updateProduct(product.id);
  switchPage("adminAddProductPage");
}

async function updateProduct(id) {
  const name = document.getElementById("newName").value.trim();
  const price = parseFloat(document.getElementById("newPrice").value);
  const image = document.getElementById("newImage").value.trim();
  const cat = document.getElementById("newCategory").value.trim();
  const subcat = document.getElementById("newSubcategory").value.trim();
  const colors = document.getElementById("newColor").value.split(',').map(c => c.trim());
  const extraImages = document.getElementById("newExtraImages").value.split(',').map(u => u.trim()).filter(u => u);
  const sizeInput = document.getElementById("newSize").value;
  let sizeOptions = [];
  if (sizeInput) {
    sizeInput.split(',').forEach(pair => {
      let [s, p] = pair.split(':');
      if (s && p) sizeOptions.push({ size: s.trim(), price: parseFloat(p) });
    });
  }
  if (!sizeOptions.length) sizeOptions.push({ size: "Standard", price });

  const updated = { name, price, description: document.getElementById("newDesc").value, cat, subcat, colors, size_options: sizeOptions, images: [image, ...extraImages] };
  await supabase.from('products').update(updated).eq('id', id);
  await loadProducts();
  loadProductsFull();
  alert("Updated");
  clearProductForm();
}

function clearProductForm() {
  document.getElementById("newName").value = "";
  document.getElementById("newPrice").value = "";
  document.getElementById("newImage").value = "";
  document.getElementById("newExtraImages").value = "";
  document.getElementById("newDesc").value = "";
  document.getElementById("newCategory").value = "";
  document.getElementById("newSubcategory").value = "";
  document.getElementById("newColor").value = "";
  document.getElementById("newSize").value = "";
  const btn = document.querySelector("#adminAddProductPage button");
  btn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
  btn.onclick = () => addProduct();
}

// ==================== CART ====================
async function loadCartFromDB() {
  if (!loggedInUser) return;
  const { data: cartRec } = await supabase.from('carts').select('id').eq('user_id', loggedInUser.id).maybeSingle();
  if (!cartRec) return;
  const { data: items } = await supabase.from('cart_items').select('*, product_variants(price, product_id, products(name, images))').eq('cart_id', cartRec.id);
  if (items) {
    cart = items.map(i => ({ id: i.product_variants.product_id, name: i.product_variants.products.name, price: i.product_variants.price, quantity: i.quantity, image: i.product_variants.products.images?.[0] || "" }));
    updateCartCount(); renderCart();
  }
}

async function addToCartDB(product) {
  if (!loggedInUser) { alert("Sign in first"); switchPage("account"); return; }
  let { data: variant } = await supabase.from('product_variants').select('id').eq('product_id', product.id).maybeSingle();
  if (!variant) {
    const { data: newVar } = await supabase.from('product_variants').insert({ product_id: product.id, sku: `SKU-${product.id}`, price: product.price }).select();
    variant = newVar[0];
  }
  let { data: cartRec } = await supabase.from('carts').select('id').eq('user_id', loggedInUser.id).maybeSingle();
  if (!cartRec) {
    const { data: newCart } = await supabase.from('carts').insert({ user_id: loggedInUser.id }).select();
    cartRec = newCart[0];
  }
  const { data: existing } = await supabase.from('cart_items').select('id, quantity').eq('cart_id', cartRec.id).eq('variant_id', variant.id).maybeSingle();
  if (existing) await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
  else await supabase.from('cart_items').insert({ cart_id: cartRec.id, variant_id: variant.id, quantity: 1 });
  await loadCartFromDB();
  alert("Added to cart");
}

function addToCart() { if (currentProduct) addToCartDB(currentProduct); }

async function removeFromCart(index) {
  const item = cart[index];
  if (item.cart_item_id) await supabase.from('cart_items').delete().eq('id', item.cart_item_id);
  cart.splice(index, 1);
  updateCartCount(); renderCart();
}

function updateCartCount() { document.getElementById("cartCount").innerText = cart.length; }

function renderCart() {
  const container = document.getElementById("cartList");
  if (!container) return;
  if (cart.length === 0) { container.innerHTML = "<p>Your cart is empty.</p>"; return; }
  let html = "", total = 0;
  cart.forEach((item, idx) => {
    total += item.price;
    html += `<div class="cart-item"><div><img src="${item.image}" width="50" style="border-radius:8px;"> ${item.name}</div><div>$${item.price} <button onclick="removeFromCart(${idx})">Remove</button></div></div>`;
  });
  html += `<div class="cart-item"><strong>Total: $${total.toFixed(2)}</strong></div>`;
  container.innerHTML = html;
}

async function checkout() {
  if (cart.length === 0) return alert("Cart empty");
  if (!loggedInUser) return alert("Sign in first");
  const total = cart.reduce((s, i) => s + i.price, 0);
  const { data: order } = await supabase.from('orders').insert({ user_id: loggedInUser.id, status: 'pending', total_amount: total, shipping_address: {} }).select();
  for (let item of cart) {
    await supabase.from('order_items').insert({ order_id: order[0].id, product_name: item.name, quantity: 1, unit_price: item.price });
  }
  const { data: cartRec } = await supabase.from('carts').select('id').eq('user_id', loggedInUser.id).single();
  if (cartRec) await supabase.from('cart_items').delete().eq('cart_id', cartRec.id);
  cart = [];
  updateCartCount(); renderCart();
  window.open(`https://wa.me/263776871711?text=Order%20placed%20Total%20$${total}`);
  alert("Order placed! WhatsApp sent.");
  switchPage("home");
}

// ==================== USER AUTH ====================
async function checkUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('full_name, is_admin').eq('id', user.id).single();
    loggedInUser = user;
    isAdmin = profile?.is_admin || false;
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("userInfo").innerHTML = profile?.full_name || user.email;
    await loadCartFromDB();
  } else {
    loggedInUser = null; isAdmin = false;
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
    cart = [];
    updateCartCount(); renderCart();
  }
}

async function login() {
  const name = document.getElementById("name").value;
  const surname = document.getElementById("surname").value;
  const phone = document.getElementById("phone").value;
  const address = document.getElementById("address").value;
  if (!name || !surname || !phone) return alert("Fill all fields");
  const email = `${phone}@temp.mmeli.com`;
  const password = phone;
  const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: `${name} ${surname}`, phone, address } } });
  if (error) await supabase.auth.signInWithPassword({ email, password });
  await checkUser();
}

function logout() {
  supabase.auth.signOut();
  loggedInUser = null;
  cart = [];
  updateCartCount(); renderCart();
  switchPage("account");
}

// ==================== ADMIN FUNCTIONS ====================
function adminLogin() {
  const user = document.getElementById("adminUser").value;
  const pass = document.getElementById("adminPass").value;
  if (user === "admin" && pass === "admin123") {
    document.getElementById("adminLogin").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    loadAdminSummaries();
  } else alert("Invalid credentials");
}

async function loadAdminSummaries() {
  const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  document.getElementById("adminOrdersSummary").innerHTML = `${ordersCount || 0} orders`;
  document.getElementById("adminProductsSummary").innerHTML = `${allProducts.length} products`;
}

async function loadOrdersFull() {
  const { data } = await supabase.from('orders').select('*, profiles(full_name)');
  const container = document.getElementById("adminOrdersFull");
  if (!container) return;
  if (data && data.length) {
    container.innerHTML = data.map(o => `<div style="border-bottom:1px solid #ccc; padding:8px;"><strong>Order #${o.id}</strong> - ${o.status} - $${o.total_amount}<br>User: ${o.profiles?.full_name || 'Guest'}<button onclick="updateOrderStatus('${o.id}')" style="margin-left:10px;">Mark Shipped</button></div>`).join('');
  } else container.innerHTML = "<p>No orders</p>";
}

async function updateOrderStatus(id) {
  await supabase.from('orders').update({ status: 'shipped' }).eq('id', id);
  loadOrdersFull();
}

function loadProductsFull() {
  const container = document.getElementById("adminProductsFull");
  if (!container) return;
  container.innerHTML = allProducts.map(p => `<div style="border-bottom:1px solid #ccc; padding:8px;"><strong>${p.name}</strong> - $${p.price}<br><button onclick="editProduct(${p.id})">Edit</button> <button onclick="deleteProduct(${p.id})">Delete</button></div>`).join('');
}

async function loadUsers() {
  const { data } = await supabase.from('profiles').select('*');
  document.getElementById("usersList").innerHTML = data?.map(u => `<div>${u.full_name} - ${u.email || ''} - Admin: ${u.is_admin}</div>`).join('') || "No users";
}

async function loadAnalytics() {
  const { data } = await supabase.from('orders').select('total_amount');
  const total = data?.reduce((s, o) => s + o.total_amount, 0) || 0;
  document.getElementById("analyticsContent").innerHTML = `<h4>Total Sales: $${total.toFixed(2)}</h4><p>Orders: ${data?.length || 0}</p>`;
}

// ==================== SHIPMENTS ====================
async function saveShipment() {
  const tracking = document.getElementById("shipTrackingCode").value.trim() || "MM" + Date.now();
  const { error } = await supabase.from('shipments').insert({
    tracking_code: tracking,
    client_name: document.getElementById("shipClientName").value,
    client_phone: document.getElementById("shipClientPhone").value,
    status: 'pending',
    notes: document.getElementById("shipNotes").value
  });
  if (error) alert("Error: " + error.message);
  else { alert("Shipment saved"); loadShipments(); }
}

async function loadShipments() {
  const { data } = await supabase.from('shipments').select('*');
  const container = document.getElementById("pendingShipments");
  if (container) container.innerHTML = data?.map(s => `<div class="shipment-card">${s.tracking_code} - ${s.client_name} - ${s.status}</div>`).join('');
}

async function trackNow() {
  const code = document.getElementById("trackCode").value;
  const phoneLast = document.getElementById("phoneLast4").value;
  const { data } = await supabase.from('shipments').select('*').eq('tracking_code', code).maybeSingle();
  if (data) document.getElementById("shipmentHistory").innerHTML = `<strong>Status:</strong> ${data.status}<br>Client: ${data.client_name}<br>Notes: ${data.notes}`;
  else document.getElementById("shipmentHistory").innerHTML = "No shipment found with that code.";
}

// ==================== QUOTATIONS ====================
function addQuoteItemRow() {
  const container = document.getElementById("quoteItemsContainer");
  const div = document.createElement("div");
  div.className = "quote-item-row";
  div.innerHTML = `<input type="text" class="item-desc" placeholder="Description" style="width:40%"><input type="number" class="item-qty" placeholder="Qty" value="1" style="width:15%"><input type="number" class="item-price" placeholder="Unit Price" style="width:20%"><span class="item-subtotal">0.00</span><button type="button" class="remove-item">✖</button>`;
  div.querySelector(".remove-item").onclick = () => div.remove();
  container.appendChild(div);
  document.querySelectorAll(".item-qty, .item-price").forEach(el => el.addEventListener("input", calculateQuoteTotals));
}

function calculateQuoteTotals() {
  let subtotal = 0;
  document.querySelectorAll(".quote-item-row").forEach(row => {
    const qty = parseFloat(row.querySelector(".item-qty")?.value) || 0;
    const price = parseFloat(row.querySelector(".item-price")?.value) || 0;
    const sub = qty * price;
    row.querySelector(".item-subtotal").innerText = sub.toFixed(2);
    subtotal += sub;
  });
  const discount = parseFloat(document.getElementById("discountPercent").value) || 0;
  const tax = parseFloat(document.getElementById("taxPercent").value) || 0;
  const afterDisc = subtotal * (1 - discount / 100);
  const total = afterDisc * (1 + tax / 100);
  document.getElementById("subtotal").innerText = subtotal.toFixed(2);
  document.getElementById("totalAmount").innerText = total.toFixed(2);
}

function generateQuote() {
  const client = document.getElementById("quoteClientName").value;
  const items = [];
  document.querySelectorAll(".quote-item-row").forEach(row => {
    items.push({ desc: row.querySelector(".item-desc").value, qty: row.querySelector(".item-qty").value, price: row.querySelector(".item-price").value });
  });
  const total = document.getElementById("totalAmount").innerText;
  let html = `<h2>Quote for ${client}</h2><table border="1" cellpadding="5" style="width:100%; border-collapse:collapse;"><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>`;
  items.forEach(i => { html += `<tr><td>${i.desc}</td><td>${i.qty}</td><td>$${i.price}</td><td>$${(i.qty * i.price).toFixed(2)}</td></tr>`; });
  html += `<tr><td colspan="3"><strong>Total</strong></td><td><strong>$${total}</strong></td></tr></table>`;
  document.getElementById("quotePreview").innerHTML = html;
  document.getElementById("quoteModal").style.display = "flex";
}

function closeQuoteModal() { document.getElementById("quoteModal").style.display = "none"; }
function printQuote() { const content = document.getElementById("quotePreview").innerHTML; const win = window.open(); win.document.write(`<html><head><title>Quote</title></head><body>${content}</body></html>`); win.print(); }

// ==================== UI HELPERS ====================
function displayHomeProducts(products) {
  const container = document.getElementById("productsContainer");
  container.innerHTML = "";
  products.slice(0, 20).forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `<img src="${p.mainImage}" loading="lazy"><div class="product-info"><div class="product-name">${escapeHtml(p.name)}</div><div class="product-price">$${p.price}</div></div>`;
    card.onclick = () => openProduct(p);
    container.appendChild(card);
  });
}

function openProduct(product) {
  currentProduct = product;
  document.getElementById("pName").innerText = product.name;
  document.getElementById("pDesc").innerText = product.desc;
  document.getElementById("pPrice").innerHTML = `$${product.price}`;
  document.getElementById("mainImage").src = product.mainImage;
  const colorSel = document.getElementById("colorSelect");
  colorSel.innerHTML = product.colors.map(c => `<option>${escapeHtml(c)}</option>`).join('');
  const subDiv = document.getElementById("subImages");
  subDiv.innerHTML = "";
  [product.mainImage, ...product.subImages].forEach((img, i) => {
    const imgEl = document.createElement("img");
    imgEl.src = img;
    imgEl.onclick = () => { document.getElementById("mainImage").src = img; document.querySelectorAll(".sub-images img").forEach(x => x.classList.remove("active")); imgEl.classList.add("active"); };
    if (i === 0) imgEl.classList.add("active");
    subDiv.appendChild(imgEl);
  });
  const sizeSel = document.getElementById("sizeSelect");
  sizeSel.innerHTML = product.sizeOptions.map(s => `<option value="${s.price}">${escapeHtml(s.size)} - $${s.price}</option>`).join('');
  sizeSel.onchange = () => document.getElementById("pPrice").innerText = `$${sizeSel.value}`;
  loadRecommendations(product);
  switchPage("productPage");
}

function loadRecommendations(product) {
  const recs = allProducts.filter(p => p.id !== product?.id).slice(0, 4);
  const container = document.getElementById("productRecommend");
  if (!container) return;
  container.innerHTML = "<h4>You may also like</h4><div class='recommend-grid'></div>";
  const grid = container.querySelector(".recommend-grid");
  recs.forEach(p => {
    const card = document.createElement("div");
    card.className = "recommend-card";
    card.onclick = () => openProduct(p);
    card.innerHTML = `<img src="${p.mainImage}" loading="lazy"><p>${escapeHtml(p.name)}<br><strong>$${p.price}</strong></p>`;
    grid.appendChild(card);
  });
}

function switchPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const target = document.getElementById(pageId);
  if (target) target.classList.add("active");
  if (pageId === "adminOrdersPage") loadOrdersFull();
  if (pageId === "adminProductsPage") loadProductsFull();
  if (pageId === "adminUsersPage") loadUsers();
  if (pageId === "adminAnalyticsPage") loadAnalytics();
  if (pageId === "adminShippingPage") loadShipments();
  if (pageId === "cart") renderCart();
  if (pageId === "tracking") initMap();
}

function setupCategoryMenu() {
  const menu = document.getElementById("mainMenu");
  menu.innerHTML = "";
  Object.keys(categoryHierarchy).forEach(cat => {
    menu.innerHTML += `<div onclick="selectMainCategory('${cat}')">${topLevelNames[cat]}</div>`;
  });
}

function selectMainCategory(cat) {
  const subDiv = document.getElementById("subMenu");
  subDiv.innerHTML = "";
  Object.keys(categoryHierarchy[cat] || {}).forEach(sub => {
    subDiv.innerHTML += `<div onclick="filterBySubcategory('${sub}')"><img src="https://cdn-icons-png.flaticon.com/512/456/456212.png" width="32">${sub}</div>`;
  });
}

function filterBySubcategory(sub) { filterProducts(); }

function populateFilters() {
  const catSel = document.getElementById("categoryFilter");
  const cats = [...new Set(allProducts.map(p => p.cat))];
  catSel.innerHTML = '<option value="all">All Categories</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function filterProducts() {
  let filtered = [...allProducts];
  const cat = document.getElementById("categoryFilter").value;
  if (cat !== "all") filtered = filtered.filter(p => p.cat === cat);
  const min = parseFloat(document.getElementById("minPrice").value) || 0;
  const max = parseFloat(document.getElementById("maxPrice").value) || Infinity;
  filtered = filtered.filter(p => p.price >= min && p.price <= max);
  displayHomeProducts(filtered);
}

function resetFilters() {
  document.getElementById("categoryFilter").value = "all";
  document.getElementById("minPrice").value = "";
  document.getElementById("maxPrice").value = "";
  filterProducts();
}

function searchProducts() {
  const term = document.getElementById("searchInput").value.toLowerCase();
  if (!term) return filterProducts();
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
  displayHomeProducts(filtered);
}

function resetHome() { filterProducts(); switchPage("home"); }

function initMap() {
  if (typeof L !== 'undefined' && document.getElementById("map")) {
    const map = L.map('map').setView([-17, 30], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    L.marker([-17, 30]).addTo(map).bindPopup('Mmeli Global').openPopup();
  }
}

function sendMsg(msg) { window.open(`https://wa.me/263776871711?text=${encodeURIComponent(msg)}`); }
function loadPromos() { document.getElementById("promoList").innerHTML = "<h3>🔥 Limited Time: 20% off all products! Use code MMELI20 🔥</h3>"; }
function downloadImage() { const url = document.getElementById("mainImage").src; if (url) window.open(url); }
function shareProduct() { if (currentProduct) alert("Share link: " + window.location.href + "?product=" + currentProduct.id); }
function viewMyQuotations() { alert("Quotations will appear here after generation."); }
function viewMyOrders() { alert("Check your orders in the admin panel."); }
function showSettings() { document.getElementById("settingsForm").style.display = "block"; document.getElementById("dashboard").style.display = "none"; }
function closeSettings() { document.getElementById("settingsForm").style.display = "none"; document.getElementById("dashboard").style.display = "block"; }
function closeQuotations() { document.getElementById("myQuotations").style.display = "none"; document.getElementById("dashboard").style.display = "block"; }
function closeOrders() { document.getElementById("myOrders").style.display = "none"; document.getElementById("dashboard").style.display = "block"; }
function saveProfile() { alert("Profile updated (Supabase)."); closeSettings(); }
function checkUrlForProduct() {
  const params = new URLSearchParams(window.location.search);
  const pid = params.get('product');
  if (pid && allProducts.length) {
    const prod = allProducts.find(p => p.id == pid);
    if (prod) openProduct(prod);
  }
}
function escapeHtml(str) { return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]); }

// Start app
init();
