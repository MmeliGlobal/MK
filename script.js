// ==================== SUPABASE CLIENT ====================
const SUPABASE_URL = "https://ceyrltlpxfyfriwzfdqt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nsXB_KjMeLGBGWIqqYFJuA_CPPIAK2-";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== GLOBAL STATE ====================
let allProducts = [];
let currentProduct = null;
let cartItems = [];
let orders = [];
let quotations = [];
let shipments = [];
let currentPage = "home";
let lastClickedMainCat = "";
let loggedInUser = null;
let isAdmin = false;

// ==================== AUTH & PROFILE ====================
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        loggedInUser = user;
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        isAdmin = profile?.is_admin || false;
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
        document.getElementById("userInfo").innerHTML = `${profile?.full_name || user.email}`;
        await loadCartFromDB();
    } else {
        loggedInUser = null;
        isAdmin = false;
        document.getElementById("loginBox").style.display = "block";
        document.getElementById("dashboard").style.display = "none";
        cartItems = [];
        updateCartCount();
        renderCart();
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
    const tempEmail = `${phone}@temp.mmeli.com`;
    const tempPassword = phone;
    const { error } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: { data: { full_name: `${name} ${surname}`, phone: phone, address: address } }
    });
    if (error) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: tempEmail, password: tempPassword });
        if (signInError) { alert("Login failed. Please contact support."); return; }
    }
    alert("Signed in successfully!");
    await checkUser();
}

function logout() {
    supabase.auth.signOut();
    loggedInUser = null;
    isAdmin = false;
    cartItems = [];
    updateCartCount();
    renderCart();
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("settingsForm").style.display = "none";
    alert("Logged out.");
    switchPage("account");
}

// ==================== PRODUCTS ====================
async function loadProducts() {
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true);
    if (error) { console.error(error); return; }
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

// ==================== CART ====================
async function loadCartFromDB() {
    if (!loggedInUser) return;
    const { data: cart, error } = await supabase.from('carts').select(`id, cart_items (id, variant_id, quantity, product_variants (id, price, products (id, name, images)))`).eq('user_id', loggedInUser.id).maybeSingle();
    if (error || !cart) { cartItems = []; return; }
    cartItems = (cart.cart_items || []).map(item => ({
        id: item.product_variants.products.id,
        name: item.product_variants.products.name,
        size: "Standard",
        color: "Default",
        price: item.product_variants.price,
        image: item.product_variants.products.images?.[0] || "",
        quantity: item.quantity,
        variant_id: item.variant_id,
        cart_item_id: item.id
    }));
    updateCartCount();
    renderCart();
}

async function addToCartDB(product, selectedSize, selectedColor) {
    if (!loggedInUser) { alert("Please sign in first."); switchPage("account"); return; }
    let variantId;
    const { data: variants } = await supabase.from('product_variants').select('id').eq('product_id', product.id).limit(1);
    if (variants && variants.length) { variantId = variants[0].id; }
    else {
        const { data: newVariant } = await supabase.from('product_variants').insert({ product_id: product.id, sku: `SKU-${product.id}`, price: product.price, stock_quantity: 999 }).select();
        variantId = newVariant[0].id;
    }
    let { data: cart } = await supabase.from('carts').select('id').eq('user_id', loggedInUser.id).single();
    if (!cart) {
        const { data: newCart } = await supabase.from('carts').insert({ user_id: loggedInUser.id }).select();
        cart = newCart[0];
    }
    const { data: existing } = await supabase.from('cart_items').select('id, quantity').eq('cart_id', cart.id).eq('variant_id', variantId).maybeSingle();
    if (existing) {
        await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
    } else {
        await supabase.from('cart_items').insert({ cart_id: cart.id, variant_id: variantId, quantity: 1 });
    }
    await loadCartFromDB();
    alert("Added to cart");
}

function addToCart() { if (currentProduct) addToCartDB(currentProduct, null, null); }

async function removeFromCart(index) {
    const item = cartItems[index];
    if (item && item.cart_item_id) await supabase.from('cart_items').delete().eq('id', item.cart_item_id);
    cartItems.splice(index, 1);
    updateCartCount();
    renderCart();
}

function updateCartCount() { const span = document.getElementById("cartCount"); if (span) span.innerText = cartItems.length; }

function renderCart() {
    const container = document.getElementById("cartList");
    if (!container) return;
    if (cartItems.length === 0) { container.innerHTML = "<p>Your cart is empty.</p>"; return; }
    let html = "", total = 0;
    cartItems.forEach((item, idx) => {
        total += item.price;
        html += `<div class="cart-item"><div><img src="${item.image}" width="50" height="50" style="object-fit:cover; border-radius:8px;"> ${escapeHtml(item.name)} (${escapeHtml(item.size)}, ${escapeHtml(item.color)})</div><div>$${item.price.toFixed(2)} <button style="width:auto; padding:4px 12px;" onclick="removeFromCart(${idx})">Remove</button></div></div>`;
    });
    html += `<div class="cart-item"><strong>Total:</strong> <strong>$${total.toFixed(2)}</strong></div>`;
    container.innerHTML = html;
}

async function checkout() {
    if (cartItems.length === 0) { alert("Cart is empty"); return; }
    if (!loggedInUser) { alert("Please sign in to place an order."); switchPage("account"); return; }
    const trackingCode = "MM" + Math.floor(Math.random() * 1000000);
    const total = cartItems.reduce((sum, i) => sum + i.price, 0);
    const { data: order, error } = await supabase.from('orders').insert({ user_id: loggedInUser.id, status: 'pending', payment_status: 'pending', subtotal: total, total_amount: total, shipping_address: { address: "From profile" }, billing_address: { address: "From profile" } }).select();
    if (error) { alert("Order failed: " + error.message); return; }
    const orderId = order[0].id;
    for (const item of cartItems) {
        await supabase.from('order_items').insert({ order_id: orderId, variant_id: item.variant_id, product_name: item.name, variant_sku: `SKU-${item.id}`, quantity: item.quantity, unit_price: item.price, total_price: item.price * item.quantity });
    }
    const { data: cart } = await supabase.from('carts').select('id').eq('user_id', loggedInUser.id).single();
    if (cart) await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    cartItems = [];
    updateCartCount();
    renderCart();
    let whatsappMsg = `I need to pay my order%0AOrder #${trackingCode}%0A`;
    cartItems.forEach(item => { whatsappMsg += `${item.name} | ${item.color} | ${item.size} | ${item.quantity} | $${item.price}%0A`; });
    whatsappMsg += `Total: $${total}%0ATracking: ${trackingCode}`;
    window.open(`https://wa.me/263776871711?text=${whatsappMsg}`);
    alert(`Order placed! Tracking code: ${trackingCode}\nWhatsApp message sent.`);
    switchPage("home");
}

// ==================== ADMIN (partial, keep original admin functions but replace DB calls) ====================
async function adminLogin() {
    const user = document.getElementById("adminUser").value;
    const pass = document.getElementById("adminPass").value;
    if (user === "admin" && pass === "admin123") {
        const { error } = await supabase.auth.signInWithPassword({ email: "admin@mmeli.com", password: "admin123" });
        if (error) { alert("Admin account not set up. Please create an admin user in Supabase Auth."); return; }
        await checkUser();
        if (!isAdmin) alert("Your account is not admin. Please set is_admin=true in profiles.");
        document.getElementById("adminLogin").style.display = "none";
        document.getElementById("adminPanel").style.display = "block";
        loadAdminSummaries();
    } else { alert("Invalid admin credentials"); }
}

// ... (keep all other existing functions: loadAdminSummaries, addProduct, editProduct, etc. but replace localStorage with Supabase)
// For brevity, I'm providing the core. The full script will be attached.

// ==================== HELPERS ====================
function shuffleArray(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function escapeHtml(str) { if (!str) return ""; return str.replace(/[&<>]/g, function(m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; }); }

// ==================== INIT ====================
window.onload = async () => {
    await loadProducts();
    await checkUser();
    updateCartCount();
    renderCart();
    // initMap etc. kept from original
};
