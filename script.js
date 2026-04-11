// ==================== SUPABASE CLIENT ====================
const SUPABASE_URL = "https://ceyrltlpxfyfriwzfdqt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nsXB_KjMeLGBGWIqqYFJuA_CPPIAK2-";
let supabaseClient = null;
let useSupabase = true; // set to false to fallback to demo

function loadSupabase() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload = () => {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    initApp();
  };
  script.onerror = () => {
    console.error("Supabase failed to load. Using demo mode.");
    useSupabase = false;
    initApp();
  };
  document.head.appendChild(script);
}

// ==================== GLOBAL VARIABLES (from your original) ====================
let allProducts = [];
let currentProduct = null;
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let orders = JSON.parse(localStorage.getItem('orders') || '[]');
let quotations = JSON.parse(localStorage.getItem('quotations') || '[]');
let shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
let currentPage = "home";
let lastClickedMainCat = "";
let loggedInUser = JSON.parse(localStorage.getItem('user') || 'null');
let editProductId = null;

// ==================== CATEGORY HIERARCHY (unchanged) ====================
const categoryHierarchy = { /* ... keep your original object ... */ };
const topLevelNames = { /* ... keep your original ... */ };
const subcategoryIcons = { /* ... keep your original ... */ };
const defaultIcon = "https://cdn-icons-png.flaticon.com/512/456/456212.png";

// ==================== HELPER FUNCTIONS (shuffle, escape) ====================
function shuffleArray(arr) { /* ... your original ... */ }
function escapeHtml(str) { /* ... your original ... */ }

// ==================== LOAD PRODUCTS FROM SUPABASE (with fallback) ====================
async function loadProducts() {
  if (!useSupabase || !supabaseClient) {
    loadDemoProducts();
    return;
  }
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .eq('is_active', true);
  if (error) {
    console.error("Supabase error:", error);
    loadDemoProducts();
  } else {
    allProducts = data.map(p => ({
      id: p.id,
      name: p.name,
      desc: p.description || "",
      cat: p.cat || "General",
      subcat: p.subcat || "",
      price: p.price,
      colors: p.colors || ["Default"],
      sizeOptions: p.size_options || [{ size: "Standard", price: p.price }],
      mainImage: (p.images && p.images[0]) || "https://via.placeholder.com/300",
      subImages: p.images ? p.images.slice(1) : []
    }));
    allProducts = shuffleArray(allProducts);
    afterLoad();
  }
}

function loadDemoProducts() {
  const stored = localStorage.getItem('customProducts');
  if (stored) {
    allProducts = JSON.parse(stored);
  } else {
    allProducts = [ /* your original demo products */ ];
  }
  allProducts = shuffleArray(allProducts);
  afterLoad();
}

async function saveProduct(product) {
  if (!useSupabase) {
    // local save
    const index = allProducts.findIndex(p => p.id == product.id);
    if (index !== -1) allProducts[index] = product;
    else allProducts.push(product);
    localStorage.setItem('customProducts', JSON.stringify(allProducts));
    return product;
  }
  // Supabase save
  if (!product.id || product.id === 0) {
    const { data, error } = await supabaseClient
      .from('products')
      .insert([{
        name: product.name,
        description: product.desc,
        cat: product.cat,
        subcat: product.subcat,
        price: product.price,
        colors: product.colors,
        size_options: product.sizeOptions,
        images: [product.mainImage, ...(product.subImages || [])],
        is_active: true
      }])
      .select();
    if (error) { console.error(error); return null; }
    return data[0];
  } else {
    const { error } = await supabaseClient
      .from('products')
      .update({
        name: product.name,
        description: product.desc,
        cat: product.cat,
        subcat: product.subcat,
        price: product.price,
        colors: product.colors,
        size_options: product.sizeOptions,
        images: [product.mainImage, ...(product.subImages || [])]
      })
      .eq('id', product.id);
    if (error) { console.error(error); return null; }
    return product;
  }
}

async function deleteProductFromDB(id) {
  if (!useSupabase) {
    allProducts = allProducts.filter(p => p.id != id);
    localStorage.setItem('customProducts', JSON.stringify(allProducts));
    return true;
  }
  const { error } = await supabaseClient
    .from('products')
    .update({ is_active: false })
    .eq('id', id);
  if (error) { console.error(error); return false; }
  return true;
}

function afterLoad() {
  populateFilters();
  displayHomeProducts(allProducts);
  loadMenu();
  checkUser();
  loadPromos();
  updateCartCount();
  renderCart();
}

// ==================== AUTH & PROFILE (Supabase) ====================
async function checkUser() {
  if (!useSupabase) {
    // fallback to localStorage user
    if (loggedInUser) {
      document.getElementById("loginBox").style.display = "none";
      document.getElementById("dashboard").style.display = "block";
      document.getElementById("userInfo").innerText = `${loggedInUser.name} ${loggedInUser.surname}`;
    }
    return;
  }
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (user) {
    loggedInUser = user;
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, is_admin')
      .eq('id', user.id)
      .single();
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("userInfo").innerHTML = profile?.full_name || user.email;
    await loadCartFromDB();
  } else {
    loggedInUser = null;
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
  }
}

async function login() {
  const name = document.getElementById("name").value;
  const surname = document.getElementById("surname").value;
  const phone = document.getElementById("phone").value;
  const address = document.getElementById("address").value;
  if (!name || !surname || !phone || !address) {
    alert("Please fill all fields.");
    return;
  }
  if (!useSupabase) {
    // fallback
    loggedInUser = { name, surname, phone, address };
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("userInfo").innerText = `${name} ${surname}`;
    alert("Signed in successfully!");
    return;
  }
  const tempEmail = `${phone}@temp.mmeli.com`;
  const tempPassword = phone;
  const { error } = await supabaseClient.auth.signUp({
    email: tempEmail,
    password: tempPassword,
    options: { data: { full_name: `${name} ${surname}`, phone, address } }
  });
  if (error) {
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({ email: tempEmail, password: tempPassword });
    if (signInError) { alert("Login failed. Please contact support."); return; }
  }
  alert("Signed in successfully!");
  await checkUser();
}

function logout() {
  if (useSupabase) {
    supabaseClient.auth.signOut();
  }
  loggedInUser = null;
  localStorage.removeItem("user");
  cart = [];
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("settingsForm").style.display = "none";
  alert("Logged out.");
  switchPage("account");
}

// ==================== CART WITH SUPABASE ====================
async function loadCartFromDB() {
  if (!useSupabase || !loggedInUser) return;
  const { data: cartRecord, error } = await supabaseClient
    .from('carts')
    .select('id')
    .eq('user_id', loggedInUser.id)
    .maybeSingle();
  if (error || !cartRecord) return;
  const { data: items } = await supabaseClient
    .from('cart_items')
    .select('*, product_variants(price, product_id, products(name, images))')
    .eq('cart_id', cartRecord.id);
  if (items) {
    cart = items.map(item => ({
      id: item.product_variants.product_id,
      name: item.product_variants.products.name,
      price: item.product_variants.price,
      quantity: item.quantity,
      variant_id: item.variant_id,
      cart_item_id: item.id,
      image: item.product_variants.products.images?.[0] || ""
    }));
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
  }
}

async function addToCartDB(product, selectedSize, selectedColor) {
  if (!useSupabase) {
    // fallback to original localStorage cart
    cart.push({
      id: product.id,
      name: product.name,
      size: selectedSize || "Standard",
      color: selectedColor || "Default",
      price: product.price,
      image: product.mainImage
    });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
    alert("Added to cart");
    return;
  }
  if (!loggedInUser) {
    alert("Please sign in first.");
    switchPage("account");
    return;
  }
  // Get or create variant
  let variantId;
  const { data: variants } = await supabaseClient
    .from('product_variants')
    .select('id')
    .eq('product_id', product.id)
    .limit(1);
  if (variants && variants.length) {
    variantId = variants[0].id;
  } else {
    const { data: newVariant } = await supabaseClient
      .from('product_variants')
      .insert({ product_id: product.id, sku: `SKU-${product.id}`, price: product.price, stock_quantity: 999 })
      .select();
    variantId = newVariant[0].id;
  }
  // Get or create cart
  let { data: cartRecord } = await supabaseClient
    .from('carts')
    .select('id')
    .eq('user_id', loggedInUser.id)
    .maybeSingle();
  if (!cartRecord) {
    const { data: newCart } = await supabaseClient
      .from('carts')
      .insert({ user_id: loggedInUser.id })
      .select();
    cartRecord = newCart[0];
  }
  // Add item
  const { data: existing } = await supabaseClient
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartRecord.id)
    .eq('variant_id', variantId)
    .maybeSingle();
  if (existing) {
    await supabaseClient
      .from('cart_items')
      .update({ quantity: existing.quantity + 1 })
      .eq('id', existing.id);
  } else {
    await supabaseClient
      .from('cart_items')
      .insert({ cart_id: cartRecord.id, variant_id: variantId, quantity: 1 });
  }
  await loadCartFromDB();
  alert("Added to cart");
}

function addToCart() {
  if (!currentProduct) return;
  const sizeSelect = document.getElementById("sizeSelect");
  const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
  const sizeText = selectedOption.text.split(" - ")[0];
  const color = document.getElementById("colorSelect") ? document.getElementById("colorSelect").value : "Default";
  addToCartDB(currentProduct, sizeText, color);
}

async function removeFromCart(index) {
  const item = cart[index];
  if (useSupabase && item.cart_item_id) {
    await supabaseClient.from('cart_items').delete().eq('id', item.cart_item_id);
  }
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const cartCountSpan = document.getElementById("cartCount");
  if (cartCountSpan) cartCountSpan.innerText = cart.length;
}

function renderCart() {
  const cartContainer = document.getElementById("cartList");
  if (!cartContainer) return;
  if (cart.length === 0) {
    cartContainer.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }
  let html = "";
  let total = 0;
  cart.forEach((item, idx) => {
    total += item.price;
    html += `
      <div class="cart-item">
        <div><img src="${item.image || 'https://via.placeholder.com/50'}" width="50" height="50" style="object-fit:cover; border-radius:8px;"> ${escapeHtml(item.name)} (${escapeHtml(item.size || 'Standard')}, ${escapeHtml(item.color || 'Default')})</div>
        <div>$${item.price.toFixed(2)} <button style="width:auto; padding:4px 12px;" onclick="removeFromCart(${idx})">Remove</button></div>
      </div>
    `;
  });
  html += `<div class="cart-item"><strong>Total:</strong> <strong>$${total.toFixed(2)}</strong></div>`;
  cartContainer.innerHTML = html;
}

async function checkout() {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }
  if (!loggedInUser) {
    alert("Please sign in to place an order.");
    switchPage("account");
    return;
  }
  const trackingCode = "MM" + Math.floor(Math.random() * 1000000);
  const total = cart.reduce((sum, i) => sum + i.price, 0);
  if (useSupabase) {
    const { data: order, error } = await supabaseClient
      .from('orders')
      .insert({
        user_id: loggedInUser.id,
        status: 'pending',
        total_amount: total,
        shipping_address: { address: "From profile" }
      })
      .select();
    if (error) {
      alert("Order failed: " + error.message);
      return;
    }
    const orderId = order[0].id;
    for (const item of cart) {
      await supabaseClient.from('order_items').insert({
        order_id: orderId,
        product_name: item.name,
        quantity: item.quantity || 1,
        price: item.price
      });
    }
    // Clear cart from DB
    const { data: cartRecord } = await supabaseClient
      .from('carts')
      .select('id')
      .eq('user_id', loggedInUser.id)
      .single();
    if (cartRecord) {
      await supabaseClient.from('cart_items').delete().eq('cart_id', cartRecord.id);
    }
  } else {
    // fallback to old order storage
    const order = {
      id: Date.now(),
      items: [...cart],
      total: total,
      user: loggedInUser,
      trackingCode: trackingCode,
      status: "Processing",
      date: new Date().toISOString()
    };
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
  }
  cart = [];
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
  let whatsappMsg = `I need to pay my order%0AOrder #${trackingCode}%0A`;
  cart.forEach(item => {
    whatsappMsg += `${item.name} | ${item.color || 'Default'} | ${item.size || 'Standard'} | 1 | $${item.price}%0A`;
  });
  whatsappMsg += `Total: $${total}%0ATracking: ${trackingCode}`;
  window.open(`https://wa.me/263776871711?text=${whatsappMsg}`);
  alert(`Order placed! Tracking code: ${trackingCode}\nWhatsApp message sent.`);
  switchPage("home");
}

// ==================== ADMIN FUNCTIONS (keep your original ones) ====================
// adminLogin, addProduct, editProduct, updateProduct, deleteProduct, loadAdminSummaries, etc.
// I'm keeping them as they were – only the product save/delete functions have been replaced above.
// Copy your original admin functions here. For brevity, I assume they exist.

// ==================== ALL YOUR ORIGINAL UI FUNCTIONS ====================
// These include: displayHomeProducts, openProduct, changeMainImage, downloadImage,
// populateFilters, filterProducts, resetFilters, loadMenu, selectMainCategory,
// selectSubCategory, switchPage, resetHome, loadRecommendations, searchProducts,
// initMap, trackNow, sendMsg, loadPromos, viewMyQuotations, viewMyOrders, reorder,
// showSettings, saveProfile, closeSettings, closeQuotations, closeOrders,
// setupQuotationForm, addItemRow, calculateQuoteTotals, generateQuote, viewQuote,
// closeQuoteModal, printQuote, saveShipment, clearShippingForm, loadShipments,
// markAsPaid, markAsShippedShipment, and all others.

// Since they are unchanged, I will not repeat them here to save space.
// Please ensure you copy your original script's UI functions below this line.

// ==================== INIT ====================
function initApp() {
  loadProducts();
  updateCartCount();
  renderCart();
  if (typeof initMap === 'function') initMap();
}

window.onload = () => {
  loadSupabase();
};
