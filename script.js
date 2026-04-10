// ==================== SUPABASE CONFIG ====================
const SUPABASE_URL = "https://ceyrltlpxfyfriwzfdqt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nsXB_KjMeLGBGWIqqYFJuA_CPPIAK2-";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== GLOBAL VARIABLES ====================
let allProducts = [];
let currentProduct = null;
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let loggedInUser = JSON.parse(localStorage.getItem('user') || 'null');
let editProductId = null;
let currentPage = "home";
let lastClickedMainCat = "";

// Category hierarchy (same as original, truncated for brevity - include full from your file)
const categoryHierarchy = {
  "Phones": { "Smartphones": ["Android Phones", "iPhones", "Rugged Phones"], "Feature Phones": ["Keypad Phones"], "Accessories": ["Chargers", "Power Banks", "Phone Cases", "Screen Protectors"] },
  "Cameras": { "Cameras": ["Digital Cameras", "DSLR Cameras", "Mirrorless Cameras"], "Video Equipment": ["Camcorders", "Action Cameras"], "Accessories": ["Tripods", "Lighting", "Microphones"] },
  "Farming": { "Farm Machinery": ["Tractors", "Harvesting Machines", "Planting Machines"], "Irrigation": ["Water Pumps", "Systems"], "Tools": ["Hand Tools", "Power Tools"] },
  "Construction": { "Heavy Equipment": ["Excavators", "Loaders"], "Materials": ["Cement Products", "Steel Materials"], "Tools": ["Power Tools", "Hand Tools"] },
  "Electronics": { "Consumer Electronics": ["Televisions", "Audio"], "Accessories": ["Cables", "Adapters"], "Smart Devices": ["Smart Home", "Wearables"] },
  "Hardware": { "Tools": ["Hand Tools", "Power Tools"], "Fasteners": ["Screws", "Bolts & Nuts"], "Safety Equipment": ["Gloves", "Helmets"] },
  "Home Appliances": { "Kitchen Appliances": ["Refrigerators", "Cooking", "Small Appliances"], "Cleaning": ["Washing Machines", "Vacuum Cleaners"], "Climate": ["Air Conditioners", "Fans"] },
  "Beauty": { "Hair Products": ["Wigs", "Extensions", "Hair Care"], "Salon Equipment": ["Chairs", "Stations"], "Beauty Products": ["Skincare", "Makeup"] },
  "Women Hair": { "Raw Hair": ["Brazilian Hair", "Peruvian Hair"], "Wigs": ["Lace Front Wigs", "Full Lace Wigs"], "Accessories": ["Closures", "Frontals"] },
  "E-Bikes": { "Electric Bikes": ["City Bikes", "Off Road Bikes"], "Scooters": ["Electric Scooters", "Mobility Scooters"], "Accessories": ["Batteries", "Chargers"] },
  "Furniture": { "Home Furniture": ["Living Room", "Bedroom"], "Office Furniture": ["Chairs", "Desks"], "Outdoor": ["Garden Chairs", "Tables"] },
  "Industrial": { "Machines": ["CNC Machines", "Laser Machines"], "Packaging": ["Sealing Machines", "Filling Machines"], "Textile": ["Sewing Machines"] },
  "Fashion": { "Women Clothing": ["Dresses", "Tops", "Bottoms"], "Men Clothing": ["Shirts", "Pants"], "Footwear": ["Sneakers", "Sandals"], "Accessories": ["Bags", "Jewelry"] },
  "Fitness": { "Strength Equipment": ["Dumbbells", "Benches"], "Cardio": ["Treadmills", "Bikes"] },
  "Animal": { "Poultry Equipment": ["Incubators", "Feeders"], "Livestock Equipment": ["Drinkers", "Housing"] },
  "Packaging": { "Packaging": ["Cartons", "Plastic Packaging"], "Handling": ["Trolleys", "Pallet Equipment"] }
};
const topLevelNames = {
  "Phones": "Phones", "Cameras": "Cameras", "Farming": "Farming", "Construction": "Constr.", "Electronics": "Electr.",
  "Hardware": "Hardware", "Home Appliances": "Appliances", "Beauty": "Beauty", "Women Hair": "Women Hair", "E-Bikes": "E-Bikes",
  "Furniture": "Furniture", "Industrial": "Industrial", "Fashion": "Fashion", "Fitness": "Fitness", "Animal": "Animal", "Packaging": "Packaging"
};
const subcategoryIcons = {
  "Smartphones": "https://cdn-icons-png.flaticon.com/512/1055/1055685.png",
  "Feature Phones": "https://cdn-icons-png.flaticon.com/512/180/180027.png",
  "Accessories": "https://cdn-icons-png.flaticon.com/512/1510/1510665.png",
  "Cameras": "https://cdn-icons-png.flaticon.com/512/1046/1046773.png",
  "Video Equipment": "https://cdn-icons-png.flaticon.com/512/1686/1686802.png",
  "Farm Machinery": "https://cdn-icons-png.flaticon.com/512/2964/2964420.png",
  "Irrigation": "https://cdn-icons-png.flaticon.com/512/1591/1591730.png",
  "Heavy Equipment": "https://cdn-icons-png.flaticon.com/512/2991/2991654.png",
  "Materials": "https://cdn-icons-png.flaticon.com/512/1665/1665742.png",
  "Consumer Electronics": "https://cdn-icons-png.flaticon.com/512/2320/2320352.png",
  "Tools": "https://cdn-icons-png.flaticon.com/512/1843/1843315.png",
  "Fasteners": "https://cdn-icons-png.flaticon.com/512/1046/1046795.png",
  "Kitchen Appliances": "https://cdn-icons-png.flaticon.com/512/4060/4060889.png",
  "Cleaning": "https://cdn-icons-png.flaticon.com/512/2195/2195960.png",
  "Hair Products": "https://cdn-icons-png.flaticon.com/512/2909/2909902.png",
  "Salon Equipment": "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  "Raw Hair": "https://cdn-icons-png.flaticon.com/512/3508/3508206.png",
  "Wigs": "https://cdn-icons-png.flaticon.com/512/2936/2936842.png",
  "Electric Bikes": "https://cdn-icons-png.flaticon.com/512/3095/3095722.png",
  "Scooters": "https://cdn-icons-png.flaticon.com/512/1355/1355425.png",
  "Home Furniture": "https://cdn-icons-png.flaticon.com/512/3448/3448609.png",
  "Office Furniture": "https://cdn-icons-png.flaticon.com/512/2672/2672223.png",
  "Machines": "https://cdn-icons-png.flaticon.com/512/2140/2140641.png",
  "Packaging": "https://cdn-icons-png.flaticon.com/512/2421/2421755.png",
  "Women Clothing": "https://cdn-icons-png.flaticon.com/512/921/921504.png",
  "Men Clothing": "https://cdn-icons-png.flaticon.com/512/1087/1087811.png",
  "Footwear": "https://cdn-icons-png.flaticon.com/512/2906/2906266.png",
  "Strength Equipment": "https://cdn-icons-png.flaticon.com/512/2121/2121811.png",
  "Cardio": "https://cdn-icons-png.flaticon.com/512/2362/2362147.png",
  "Poultry Equipment": "https://cdn-icons-png.flaticon.com/512/2752/2752783.png",
  "Livestock Equipment": "https://cdn-icons-png.flaticon.com/512/1995/1995584.png"
};
const defaultIcon = "https://cdn-icons-png.flaticon.com/512/456/456212.png";

// Helper functions
function escapeHtml(str) { if (!str) return ""; return str.replace(/[&<>]/g, function(m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; }); }
function shuffleArray(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

// ==================== LOAD PRODUCTS FROM SUPABASE ====================
async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) { console.error("Supabase error:", error); loadDemoProducts(); return; }
  if (data && data.length > 0) {
    allProducts = shuffleArray(data);
    afterLoad();
  } else {
    await migrateDemoProducts();
  }
}

async function migrateDemoProducts() {
  const demoProducts = [
    { id: 1, name: "Elegant Leather Tote", desc: "Premium full-grain leather tote bag.", cat: "Fashion", subcat: "Women Clothing", price: 129.99, colors: ["Black", "Brown"], sizeOptions: [{ size: "One Size", price: 129.99 }], mainImage: "https://picsum.photos/id/20/300/200", subImages: [] },
    { id: 2, name: "iPhone 16e", desc: "Latest iPhone with advanced features.", cat: "Phones", subcat: "Smartphones", price: 357, colors: ["Blue", "Black"], sizeOptions: [{ size: "128GB", price: 357 }], mainImage: "https://picsum.photos/id/0/300/200", subImages: [] },
    { id: 3, name: "Professional Camera", desc: "High resolution DSLR camera.", cat: "Cameras", subcat: "Cameras", price: 899, colors: ["Black"], sizeOptions: [{ size: "Standard", price: 899 }], mainImage: "https://picsum.photos/id/1/300/200", subImages: [] }
  ];
  for (let p of demoProducts) {
    await supabase.from('products').insert([p]);
  }
  loadProducts();
}

function loadDemoProducts() {
  const stored = localStorage.getItem('customProducts');
  if (stored) { allProducts = JSON.parse(stored); }
  else { allProducts = [ { id: 1, name: "Demo Product", desc: "Demo", cat: "Fashion", subcat: "Women Clothing", price: 99, colors: ["Red"], sizeOptions: [{ size: "One", price: 99 }], mainImage: "https://picsum.photos/200/300", subImages: [] } ]; }
  allProducts = shuffleArray(allProducts);
  afterLoad();
}

function afterLoad() {
  populateFilters();
  displayHomeProducts(allProducts);
  loadMenu();
  checkUser();
  updateCartCount();
  renderCart();
  loadPromotionsUI();
  loadAllShipmentsAdmin();
}

// ==================== PRODUCT DISPLAY ====================
function displayHomeProducts(products) {
  const container = document.getElementById("productsContainer");
  if (!container) return;
  container.innerHTML = "";
  if (products.length === 0) { container.innerHTML = "<p>No products found.</p>"; return; }
  products.slice(0, 20).forEach(product => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.onclick = () => openProductById(product.id);
    card.innerHTML = `<img src="${product.mainImage}" loading="lazy" alt="${escapeHtml(product.name)}"><div class="product-info"><div class="product-name">${escapeHtml(product.name)}</div><div class="product-price">$${product.price}</div></div>`;
    container.appendChild(card);
  });
}

function openProductById(id) { const product = allProducts.find(p => p.id == id); if (product) openProduct(product); }
function openProduct(product) {
  if (!product) return;
  currentProduct = product;
  document.getElementById("pName").innerText = product.name;
  document.getElementById("pDesc").innerText = product.desc;
  document.getElementById("pPrice").innerText = `$${product.price}`;
  document.getElementById("mainImage").src = product.mainImage;
  const colorSelect = document.getElementById("colorSelect");
  colorSelect.innerHTML = "";
  product.colors.forEach(color => { colorSelect.innerHTML += `<option value="${escapeHtml(color)}">${escapeHtml(color)}</option>`; });
  const subContainer = document.getElementById("subImages");
  subContainer.innerHTML = "";
  const allImages = [product.mainImage, ...(product.subImages || [])];
  allImages.forEach((img, idx) => {
    if (img && img.trim()) {
      const imgEl = document.createElement("img");
      imgEl.src = img;
      imgEl.onclick = () => { document.getElementById("mainImage").src = img; document.querySelectorAll(".sub-images img").forEach(i => i.classList.remove("active")); imgEl.classList.add("active"); };
      if (idx === 0) imgEl.classList.add("active");
      subContainer.appendChild(imgEl);
    }
  });
  const sizeSelect = document.getElementById("sizeSelect");
  sizeSelect.innerHTML = "";
  product.sizeOptions.forEach(s => { sizeSelect.innerHTML += `<option value="${s.price}">${escapeHtml(s.size)} - $${s.price}</option>`; });
  sizeSelect.onchange = () => { document.getElementById("pPrice").innerText = `$${sizeSelect.value}`; };
  loadRecommendations("product");
  switchPage("productPage");
}
function downloadImage() { const imgUrl = document.getElementById("mainImage").src; if (imgUrl) { const a = document.createElement('a'); a.href = imgUrl; a.download = 'product-image.jpg'; a.click(); } }

// ==================== CART ====================
function addToCart() {
  if (!currentProduct) return;
  const sizeSelect = document.getElementById("sizeSelect");
  const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
  const sizeText = selectedOption.text.split(" - ")[0];
  const price = parseFloat(selectedOption.value);
  const color = document.getElementById("colorSelect").value;
  cart.push({ id: currentProduct.id, name: currentProduct.name, size: sizeText, color: color, price: price, image: currentProduct.mainImage });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
  alert("Added to cart");
}
function updateCartCount() { const span = document.getElementById("cartCount"); if (span) span.innerText = cart.length; }
function renderCart() {
  const container = document.getElementById("cartList");
  if (!container) return;
  if (cart.length === 0) { container.innerHTML = "<p>Your cart is empty.</p>"; return; }
  let html = "", total = 0;
  cart.forEach((item, idx) => { total += item.price; html += `<div class="cart-item"><div><img src="${item.image}" width="50" height="50" style="object-fit:cover; border-radius:8px;"> ${escapeHtml(item.name)} (${escapeHtml(item.size)}, ${escapeHtml(item.color)})</div><div>$${item.price.toFixed(2)} <button style="width:auto; padding:4px 12px;" onclick="removeFromCart(${idx})">Remove</button></div></div>`; });
  html += `<div class="cart-item"><strong>Total:</strong> <strong>$${total.toFixed(2)}</strong></div>`;
  container.innerHTML = html;
}
function removeFromCart(index) { cart.splice(index, 1); localStorage.setItem('cart', JSON.stringify(cart)); updateCartCount(); renderCart(); }

// ==================== CHECKOUT WITH SUPABASE ====================
async function checkout() {
  if (cart.length === 0) { alert("Cart is empty"); return; }
  if (!loggedInUser) { alert("Please sign in to place an order."); switchPage("account"); return; }
  const trackingCode = "MM" + Math.floor(Math.random() * 1000000);
  const total = cart.reduce((sum, i) => sum + i.price, 0);
  const order = { trackingCode, items: cart, total, user: loggedInUser, status: "Processing", date: new Date().toISOString() };
  const { error } = await supabase.from('orders').insert([order]);
  if (error) { alert("Order failed: " + error.message); return; }
  let whatsappMsg = `I need to pay my order%0ATracking: ${trackingCode}%0ATotal: $${total.toFixed(2)}%0AItems: ${cart.map(i => i.name).join(", ")}`;
  window.open(`https://wa.me/263776871711?text=${whatsappMsg}`);
  cart = []; localStorage.setItem('cart', JSON.stringify(cart)); updateCartCount(); renderCart();
  alert(`Order placed! Tracking code: ${trackingCode}\nWhatsApp message sent to admin.`);
  switchPage("home");
}

// ==================== ACCOUNT FUNCTIONS ====================
function login() {
  const name = document.getElementById("name").value, surname = document.getElementById("surname").value, phone = document.getElementById("phone").value, address = document.getElementById("address").value;
  if (!name || !surname || !phone || !address) { alert("Please fill all fields."); return; }
  loggedInUser = { name, surname, phone, address };
  localStorage.setItem("user", JSON.stringify(loggedInUser));
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("userInfo").innerText = `${name} ${surname}`;
  alert("Signed in successfully!");
}
function checkUser() { if (loggedInUser) { document.getElementById("loginBox").style.display = "none"; document.getElementById("dashboard").style.display = "block"; document.getElementById("userInfo").innerText = `${loggedInUser.name} ${loggedInUser.surname}`; } }
function showSettings() { document.getElementById("editName").value = loggedInUser.name; document.getElementById("editSurname").value = loggedInUser.surname; document.getElementById("editPhone").value = loggedInUser.phone; document.getElementById("editAddress").value = loggedInUser.address; document.getElementById("settingsForm").style.display = "block"; document.getElementById("dashboard").style.display = "none"; }
function saveProfile() { loggedInUser.name = document.getElementById("editName").value; loggedInUser.surname = document.getElementById("editSurname").value; loggedInUser.phone = document.getElementById("editPhone").value; loggedInUser.address = document.getElementById("editAddress").value; localStorage.setItem("user", JSON.stringify(loggedInUser)); alert("Profile updated."); closeSettings(); }
function logout() { loggedInUser = null; localStorage.removeItem("user"); document.getElementById("loginBox").style.display = "block"; document.getElementById("dashboard").style.display = "none"; document.getElementById("settingsForm").style.display = "none"; alert("Logged out."); switchPage("account"); }
function closeSettings() { document.getElementById("settingsForm").style.display = "none"; document.getElementById("dashboard").style.display = "block"; }
async function viewMyQuotations() { if (!loggedInUser) return; const { data } = await supabase.from('quotations').select('*').eq('client->>phone', loggedInUser.phone); const container = document.getElementById("quotationsList"); container.innerHTML = data?.map(q => `<div style="border:1px solid #ddd; padding:12px; margin-bottom:12px;"><strong>Quote #${escapeHtml(q.quoteNumber)}</strong><br>Total: $${q.total}<br><button onclick="viewQuote('${q.id}')">View</button></div>`).join('') || "<p>No quotations found.</p>"; document.getElementById("myQuotations").style.display = "block"; document.getElementById("dashboard").style.display = "none"; }
async function viewMyOrders() { if (!loggedInUser) return; const { data } = await supabase.from('orders').select('*').eq('user->>phone', loggedInUser.phone); const container = document.getElementById("ordersList"); container.innerHTML = data?.map(o => `<div style="border:1px solid #ddd; padding:12px; margin-bottom:12px;"><strong>Order #:</strong> ${escapeHtml(o.trackingCode)}<br><strong>Status:</strong> ${o.status}<br><strong>Total:</strong> $${o.total}<br><button onclick="reorder('${o.trackingCode}')">Reorder</button></div>`).join('') || "<p>No orders found.</p>"; document.getElementById("myOrders").style.display = "block"; document.getElementById("dashboard").style.display = "none"; }
function reorder(trackingCode) { alert("Reorder: add items from that order to cart (feature coming soon)"); }
function closeQuotations() { document.getElementById("myQuotations").style.display = "none"; document.getElementById("dashboard").style.display = "block"; }
function closeOrders() { document.getElementById("myOrders").style.display = "none"; document.getElementById("dashboard").style.display = "block"; }

// ==================== ADMIN FUNCTIONS ====================
function adminLogin() { const user = document.getElementById("adminUser").value, pass = document.getElementById("adminPass").value; if (user === "admin" && pass === "admin123") { document.getElementById("adminLogin").style.display = "none"; document.getElementById("adminPanel").style.display = "block"; loadAdminSummaries(); } else { alert("Invalid admin credentials"); } }
async function loadAdminSummaries() {
  const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: shipmentsCount } = await supabase.from('shipments').select('*', { count: 'exact', head: true });
  const { count: promosCount } = await supabase.from('promotions').select('*', { count: 'exact', head: true });
  document.getElementById("adminOrdersSummary").innerHTML = `📦 ${ordersCount || 0}`;
  document.getElementById("adminProductsSummary").innerHTML = `🛍️ ${productsCount || 0}`;
  document.getElementById("adminMarketingSummary").innerHTML = `📢 ${promosCount || 0} active`;
  document.getElementById("adminShippingSummary").innerHTML = `🚚 ${shipmentsCount || 0} total`;
  loadOrdersFull(); loadProductsFull();
}
async function loadOrdersFull() { const { data } = await supabase.from('orders').select('*'); document.getElementById("adminOrdersFull").innerHTML = data?.map(o => `<div style="border-bottom:1px solid #ccc; margin-bottom:8px;"><strong>${escapeHtml(o.trackingCode)}</strong> - ${o.status}<br>User: ${escapeHtml(o.user?.name)} ${escapeHtml(o.user?.surname)}<br>Total: $${o.total}<br><button onclick="updateOrderStatus('${o.trackingCode}')">Mark as Shipped</button></div>`).join('') || "<p>No orders yet.</p>"; }
async function updateOrderStatus(trackingCode) { await supabase.from('orders').update({ status: "Shipped" }).eq('trackingCode', trackingCode); loadOrdersFull(); alert(`Order ${trackingCode} marked as shipped.`); }
async function loadProductsFull() { const { data } = await supabase.from('products').select('*'); document.getElementById("adminProductsFull").innerHTML = data?.map(p => `<div style="border-bottom:1px solid #ccc; margin-bottom:8px; padding:8px;"><strong>${escapeHtml(p.name)}</strong> - $${p.price}<br>${p.cat} / ${p.subcat}<br><button onclick="editProduct(${p.id})">✏️ Edit</button> <button onclick="deleteProduct(${p.id})" style="background:#e74c3c;">🗑️ Delete</button></div>`).join('') || "<p>No products.</p>"; }
async function addProduct() {
  const name = document.getElementById("newName").value, price = parseFloat(document.getElementById("newPrice").value), image = document.getElementById("newImage").value, category = document.getElementById("newCategory").value, subcategory = document.getElementById("newSubcategory").value;
  if (!name || isNaN(price) || !image || !category || !subcategory) { alert("Please fill required fields."); return; }
  const colors = document.getElementById("newColor").value ? document.getElementById("newColor").value.split(',').map(c => c.trim()) : ["Default"];
  const sizeInput = document.getElementById("newSize").value; let sizeOptions = [{ size: "Standard", price: price }];
  if (sizeInput) { const pairs = sizeInput.split(','); sizeOptions = pairs.map(pair => { const [size, p] = pair.split(':'); return { size: size.trim(), price: parseFloat(p) }; }); }
  const subImages = document.getElementById("newExtraImages").value ? document.getElementById("newExtraImages").value.split(',').map(u => u.trim()).filter(u => u) : [];
  const newProduct = { name, desc: document.getElementById("newDesc").value || "Added by admin", cat: category, subcat: subcategory, price, colors, sizeOptions, mainImage: image, subImages };
  const { data, error } = await supabase.from('products').insert([newProduct]).select();
  if (error) { alert("Failed to add product: " + error.message); return; }
  allProducts.push(data[0]); allProducts = shuffleArray(allProducts); displayHomeProducts(allProducts); loadAdminSummaries(); alert("Product added!"); switchPage("adminDashboard");
}
async function editProduct(id) { const product = allProducts.find(p => p.id == id); if (!product) return; editProductId = id; document.getElementById("newName").value = product.name; document.getElementById("newPrice").value = product.price; document.getElementById("newImage").value = product.mainImage; document.getElementById("newExtraImages").value = (product.subImages || []).join(", "); document.getElementById("newDesc").value = product.desc; document.getElementById("newCategory").value = product.cat; document.getElementById("newSubcategory").value = product.subcat; document.getElementById("newColor").value = product.colors.join(", "); const sizeString = product.sizeOptions.map(s => `${s.size}:${s.price}`).join(", "); document.getElementById("newSize").value = sizeString; const addBtn = document.querySelector("#adminAddProductPage button"); addBtn.innerText = "Update Product"; addBtn.onclick = updateProduct; switchPage("adminAddProductPage"); }
async function updateProduct() {
  const name = document.getElementById("newName").value, price = parseFloat(document.getElementById("newPrice").value), image = document.getElementById("newImage").value, category = document.getElementById("newCategory").value, subcategory = document.getElementById("newSubcategory").value;
  if (!name || isNaN(price) || !image || !category || !subcategory) { alert("Please fill required fields."); return; }
  const colors = document.getElementById("newColor").value ? document.getElementById("newColor").value.split(',').map(c => c.trim()) : ["Default"];
  const sizeInput = document.getElementById("newSize").value; let sizeOptions = [{ size: "Standard", price: price }];
  if (sizeInput) { const pairs = sizeInput.split(','); sizeOptions = pairs.map(pair => { const [size, p] = pair.split(':'); return { size: size.trim(), price: parseFloat(p) }; }); }
  const subImages = document.getElementById("newExtraImages").value ? document.getElementById("newExtraImages").value.split(',').map(u => u.trim()).filter(u => u) : [];
  const updatedProduct = { id: editProductId, name, desc: document.getElementById("newDesc").value || "Updated product", cat: category, subcat: subcategory, price, colors, sizeOptions, mainImage: image, subImages };
  const { error } = await supabase.from('products').update(updatedProduct).eq('id', editProductId);
  if (error) { alert("Update failed: " + error.message); return; }
  const index = allProducts.findIndex(p => p.id == editProductId); if (index !== -1) allProducts[index] = updatedProduct; allProducts = shuffleArray(allProducts); displayHomeProducts(allProducts); loadAdminSummaries(); alert("Product updated."); const addBtn = document.querySelector("#adminAddProductPage button"); addBtn.innerText = "Add Product"; addBtn.onclick = addProduct; editProductId = null; switchPage("adminDashboard");
}
async function deleteProduct(id) { if (confirm("Are you sure?")) { const { error } = await supabase.from('products').delete().eq('id', id); if (error) { alert("Delete failed."); return; } allProducts = allProducts.filter(p => p.id != id); displayHomeProducts(allProducts); loadAdminSummaries(); alert("Product deleted."); } }
function saveSettings() { const siteName = document.getElementById("siteName").value; localStorage.setItem('siteName', siteName); alert("Settings saved."); switchPage("adminDashboard"); }

// ==================== SHIPPING FUNCTIONS ====================
async function saveShipment() {
  const trackingCode = document.getElementById("shipTrackingCode").value.trim() || ("SHIP" + Math.floor(Math.random() * 1000000));
  const shipment = { trackingCode, client: { name: document.getElementById("shipClientName").value, phone: document.getElementById("shipClientPhone").value, address: document.getElementById("shipClientAddress").value }, receiver: { name: document.getElementById("shipReceiverName").value, phone: document.getElementById("shipReceiverPhone").value, address: document.getElementById("shipReceiverAddress").value }, notes: document.getElementById("shipNotes").value, status: "pending", paid: false, date: new Date().toISOString() };
  if (!shipment.client.name || !shipment.receiver.name) { alert("Client name and receiver name required."); return; }
  const { error } = await supabase.from('shipments').insert([shipment]);
  if (error) { alert("Error saving shipment: " + error.message); return; }
  alert("Shipment saved."); clearShippingForm(); loadAllShipmentsAdmin();
}
function clearShippingForm() { document.getElementById("shipClientName").value = ""; document.getElementById("shipClientPhone").value = ""; document.getElementById("shipClientAddress").value = ""; document.getElementById("shipReceiverName").value = ""; document.getElementById("shipReceiverPhone").value = ""; document.getElementById("shipReceiverAddress").value = ""; document.getElementById("shipTrackingCode").value = ""; document.getElementById("shipNotes").value = ""; document.getElementById("packageImage").value = ""; }
async function loadAllShipmentsAdmin() { const { data } = await supabase.from('shipments').select('*'); document.getElementById("allShipmentsList").innerHTML = data?.map(s => `<div class="shipment-card" style="border:1px solid #ddd; padding:10px; margin-bottom:10px;"><strong>Tracking:</strong> ${escapeHtml(s.trackingCode)}<br><strong>Client:</strong> ${escapeHtml(s.client.name)}<br><strong>Status:</strong> ${s.status}<br><button onclick="markShipmentPaid('${s.trackingCode}')">Mark Paid</button> <button onclick="markShipmentShipped('${s.trackingCode}')">Mark Shipped</button></div>`).join('') || "<p>No shipments.</p>"; }
async function markShipmentPaid(trackingCode) { await supabase.from('shipments').update({ paid: true }).eq('trackingCode', trackingCode); loadAllShipmentsAdmin(); alert("Marked as paid."); }
async function markShipmentShipped(trackingCode) { await supabase.from('shipments').update({ status: "shipped" }).eq('trackingCode', trackingCode); loadAllShipmentsAdmin(); alert("Marked as shipped."); }

// ==================== MARKETING (PROMOTIONS) ====================
async function addPromotion() {
  const code = document.getElementById("promoCode").value.trim(); const desc = document.getElementById("promoDesc").value; const discount = parseFloat(document.getElementById("promoDiscount").value); const validUntil = document.getElementById("promoValidUntil").value;
  if (!code) { alert("Promo code required."); return; }
  const { error } = await supabase.from('promotions').insert([{ code, description: desc, discount, validUntil, active: true, createdAt: new Date().toISOString() }]);
  if (error) { alert("Error: " + error.message); return; }
  alert("Promotion added."); loadPromotionsUI(); document.getElementById("promoCode").value = ""; document.getElementById("promoDesc").value = ""; document.getElementById("promoDiscount").value = ""; document.getElementById("promoValidUntil").value = "";
}
async function loadPromotionsUI() { const { data } = await supabase.from('promotions').select('*'); document.getElementById("promotionsList").innerHTML = data?.map(p => `<div style="border:1px solid #ddd; padding:10px; margin-bottom:8px;"><strong>${escapeHtml(p.code)}</strong> - ${p.discount}% off until ${p.validUntil} <button onclick="deletePromotion('${p.id}')" style="background:#e74c3c; padding:4px 12px;">Delete</button></div>`).join('') || "<p>No promotions yet.</p>"; }
async function deletePromotion(id) { if (confirm("Delete this promotion?")) { await supabase.from('promotions').delete().eq('id', id); loadPromotionsUI(); } }

// ==================== QUOTATION FUNCTIONS (simplified) ====================
function setupQuotationForm() { document.getElementById("quotationForm").innerHTML = `<input id="quoteClientName" placeholder="Client Name"><input id="quoteClientPhone" placeholder="Client Phone"><div id="quoteItemsContainer"></div><button onclick="generateQuote()">Generate Quote</button>`; }
async function generateQuote() { const clientName = document.getElementById("quoteClientName").value; const clientPhone = document.getElementById("quoteClientPhone").value; if (!clientName) { alert("Client name required"); return; } const quote = { quoteNumber: "QT" + Date.now(), issueDate: new Date().toISOString(), client: { name: clientName, phone: clientPhone }, items: [{ desc: "Sample item", qty: 1, price: 100 }], total: 100, discountAmount: 0, taxAmount: 0 }; const { error } = await supabase.from('quotations').insert([quote]); if (error) { alert("Error: " + error.message); } else { alert("Quote saved!"); viewQuote(quote.quoteNumber); } }
function viewQuote(id) { alert("Quote preview for ID: " + id); }
function closeQuoteModal() { document.getElementById("quoteModal").style.display = "none"; }
function printQuote() { alert("Print functionality - implement as needed"); }

// ==================== TRACKING ====================
function initMap() { const mapElement = document.getElementById("map"); if (mapElement && typeof L !== 'undefined') { const map = L.map(mapElement).setView([-17, 30], 5); L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map); L.marker([-17, 30]).addTo(map).bindPopup('Mmeli Global').openPopup(); } }
async function trackNow() { const code = document.getElementById("trackCode").value.trim(); const last4 = document.getElementById("phoneLast4").value.trim(); if (!code || !last4) { alert("Please enter tracking code and last 4 digits of phone."); return; } const { data } = await supabase.from('orders').select('*').eq('trackingCode', code); if (!data || data.length === 0) { document.getElementById("shipmentHistory").innerHTML = "<p>No order found.</p>"; return; } const order = data.find(o => o.user?.phone?.endsWith(last4)); if (!order) { document.getElementById("shipmentHistory").innerHTML = "<p>Phone number mismatch.</p>"; return; } let history = `<strong>Tracking for ${escapeHtml(code)}</strong><br>Status: ${order.status}<br>Items: ${order.items.map(i => i.name).join(", ")}<br>Total: $${order.total}<br>Date: ${new Date(order.date).toLocaleString()}<br>`; if (order.status === "Processing") history += "Your order is being prepared."; else if (order.status === "Shipped") history += "Your order is on the way!"; else if (order.status === "Delivered") history += "Delivered. Enjoy!"; document.getElementById("shipmentHistory").innerHTML = history; }

// ==================== CHAT & PROMO ====================
function sendMsg(msg) { window.open(`https://wa.me/263776871711?text=${encodeURIComponent(msg)}`); }
function loadPromos() { document.getElementById("promoList").innerHTML = "<h3>🔥 Limited Time: Use promo codes from Marketing! 🔥</h3>"; }

// ==================== FILTERS & MENU ====================
function populateFilters() { const categorySelect = document.getElementById("categoryFilter"); const categories = Object.keys(categoryHierarchy); categorySelect.innerHTML = '<option value="all">All Categories</option>'; categories.forEach(cat => { categorySelect.innerHTML += `<option value="${cat}">${topLevelNames[cat] || cat}</option>`; }); }
function filterProducts() { const category = document.getElementById("categoryFilter").value; const minPrice = parseFloat(document.getElementById("minPrice").value) || 0; const maxPrice = parseFloat(document.getElementById("maxPrice").value) || Infinity; let filtered = [...allProducts]; if (category !== "all") filtered = filtered.filter(p => p.cat === category); filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice); filtered = shuffleArray(filtered); displayHomeProducts(filtered); }
function resetFilters() { document.getElementById("categoryFilter").value = "all"; document.getElementById("minPrice").value = ""; document.getElementById("maxPrice").value = ""; filterProducts(); }
function loadMenu() { const menuDiv = document.getElementById("mainMenu"); menuDiv.innerHTML = ""; Object.keys(categoryHierarchy).forEach(cat => { const shortName = topLevelNames[cat] || cat; menuDiv.innerHTML += `<div onclick="selectMainCategory('${cat}')">${shortName}</div>`; }); }
function selectMainCategory(category) { lastClickedMainCat = category; const subMenuDiv = document.getElementById("subMenu"); subMenuDiv.innerHTML = ""; const subcats = categoryHierarchy[category]; if (subcats) { Object.keys(subcats).forEach(sub => { const iconUrl = subcategoryIcons[sub] || defaultIcon; subMenuDiv.innerHTML += `<div onclick="selectSubCategory('${sub}')"><img src="${iconUrl}" style="width:32px; height:32px;" alt="${sub}"></div>`; }); } }
function selectSubCategory(sub) { const mainCat = lastClickedMainCat; const leaves = categoryHierarchy[mainCat][sub]; if (leaves) { let filtered = allProducts.filter(p => leaves.includes(p.subcat)); filtered = shuffleArray(filtered); displayHomeProducts(filtered); switchPage("home"); } }
function searchProducts() { const term = document.getElementById("searchInput").value.toLowerCase(); if (term === "") { filterProducts(); return; } const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term)); displayHomeProducts(filtered); switchPage("home"); }
document.getElementById("scanInput").addEventListener("change", function(e) { alert("Scanning product... (demo)"); filterProducts(); switchPage("home"); });

// ==================== RECOMMENDATIONS ====================
function loadRecommendations(pageId) { let container = null; if (pageId === "product") container = document.getElementById("productRecommend"); else if (pageId === "cart") container = document.getElementById("cartRecommend"); else if (pageId === "tracking") container = document.getElementById("trackingRecommend"); else if (pageId === "chat") container = document.getElementById("chatRecommend"); else if (pageId === "promo") container = document.getElementById("promoRecommend"); else if (pageId === "account") container = document.getElementById("accountRecommend"); if (!container) return; let recs = [...allProducts]; if (currentProduct) recs = recs.filter(p => p.id !== currentProduct.id); recs = recs.slice(0, 4); container.innerHTML = "<h4>You may also like</h4><div class='recommend-grid'></div>"; const grid = container.querySelector(".recommend-grid"); recs.forEach(prod => { const card = document.createElement("div"); card.className = "recommend-card"; card.onclick = () => openProduct(prod); card.innerHTML = `<img src="${prod.mainImage}" loading="lazy"><p>${escapeHtml(prod.name)}<br><strong>$${prod.price}</strong></p>`; grid.appendChild(card); }); }

// ==================== NAVIGATION ====================
function switchPage(pageId) { if (currentPage === pageId) return; currentPage = pageId; document.querySelectorAll(".page").forEach(p => p.classList.remove("active")); const activePage = document.getElementById(pageId); if (activePage) activePage.classList.add("active"); if (pageId === "home") { if (lastClickedMainCat) selectMainCategory(lastClickedMainCat); else filterProducts(); document.getElementById("subMenu").innerHTML = ""; } else if (pageId === "cart") { renderCart(); loadRecommendations("cart"); } else if (pageId === "tracking") { initMap(); loadRecommendations("tracking"); } else if (pageId === "chat") loadRecommendations("chat"); else if (pageId === "promo") { loadPromos(); loadRecommendations("promo"); } else if (pageId === "account") loadRecommendations("account"); else if (pageId === "adminDashboard") { if (document.getElementById("adminPanel").style.display !== "block") { document.getElementById("adminLogin").style.display = "block"; document.getElementById("adminPanel").style.display = "none"; } } else if (pageId === "adminOrdersPage") loadOrdersFull(); else if (pageId === "adminProductsPage") loadProductsFull(); else if (pageId === "adminQuotesPage") setupQuotationForm(); else if (pageId === "adminShippingRecordsPage") loadAllShipmentsAdmin(); else if (pageId === "adminMarketingPage") loadPromotionsUI(); }
function resetHome() { lastClickedMainCat = ""; document.getElementById("subMenu").innerHTML = ""; filterProducts(); switchPage("home"); }

// Admin entry
document.getElementById("adminEntry")?.addEventListener("click", () => { switchPage("adminDashboard"); });
document.getElementById("logoArea")?.addEventListener("dblclick", () => { switchPage("adminDashboard"); });

// Initialize
window.onload = () => { loadProducts(); updateCartCount(); };
