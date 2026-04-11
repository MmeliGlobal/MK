// ==================== SUPABASE CLIENT ====================
const SUPABASE_URL = "https://ceyrltlpxfyfriwzfdqt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nsXB_KjMeLGBGWIqqYFJuA_CPPIAK2-";
let supabaseClient = null;
let useSupabase = false;

function loadSupabase() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload = () => {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    useSupabase = true;
    initApp();
  };
  script.onerror = () => {
    console.error("Supabase failed. Using demo mode.");
    useSupabase = false;
    initApp();
  };
  document.head.appendChild(script);
}

// ==================== GLOBAL VARIABLES ====================
let allProducts = [];
let currentProduct = null;
let cart = [];
let orders = [];
let quotations = [];
let shipments = [];
let currentPage = "home";
let lastClickedMainCat = "";
let loggedInUser = null;
let editProductId = null;
let isAdmin = false;

// ==================== CATEGORY HIERARCHY ====================
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
  "Phones": "Phones", "Cameras": "Cameras", "Farming": "Farming", "Construction": "Constr.",
  "Electronics": "Electr.", "Hardware": "Hardware", "Home Appliances": "Appliances", "Beauty": "Beauty",
  "Women Hair": "Women Hair", "E-Bikes": "E-Bikes", "Furniture": "Furniture", "Industrial": "Industrial",
  "Fashion": "Fashion", "Fitness": "Fitness", "Animal": "Animal", "Packaging": "Packaging"
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

// ==================== HELPER FUNCTIONS ====================
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ==================== LOAD PRODUCTS FROM SUPABASE ====================
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
    allProducts = [
      { id: 1, name: "Elegant Leather Tote", desc: "Premium full-grain leather tote bag.", cat: "Fashion", subcat: "Handbags", price: 129.99, colors: ["Black","Brown"], sizeOptions: [{size:"One Size",price:129.99}], mainImage: "https://i.imgur.com/Z1aTPZl.jpeg", subImages: [] },
      { id: 2, name: "iPhone 16e", desc: "Latest iPhone with advanced features.", cat: "Phones", subcat: "iPhones", price: 357, colors: ["Blue","Black"], sizeOptions: [{size:"128GB",price:357}], mainImage: "https://i.imgur.com/9wBjqIU.jpeg", subImages: [] }
    ];
  }
  allProducts = shuffleArray(allProducts);
  afterLoad();
}

async function saveProduct(product) {
  if (!useSupabase) {
    const index = allProducts.findIndex(p => p.id == product.id);
    if (index !== -1) allProducts[index] = product;
    else allProducts.push(product);
    localStorage.setItem('customProducts', JSON.stringify(allProducts));
    return product;
  }
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

// ==================== AUTH & PROFILE ====================
async function checkUser() {
  if (!useSupabase) {
    const localUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (localUser) {
      loggedInUser = localUser;
      document.getElementById("loginBox").style.display = "none";
      document.getElementById("dashboard").style.display = "block";
      document.getElementById("userInfo").innerText = `${localUser.name} ${localUser.surname}`;
      cart = JSON.parse(localStorage.getItem('cart') || '[]');
      updateCartCount();
      renderCart();
    } else {
      loggedInUser = null;
      document.getElementById("loginBox").style.display = "block";
      document.getElementById("dashboard").style.display = "none";
      cart = [];
      updateCartCount();
      renderCart();
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
    isAdmin = profile?.is_admin || false;
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("userInfo").innerHTML = profile?.full_name || user.email;
    await loadCartFromDB();
  } else {
    loggedInUser = null;
    isAdmin = false;
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
    cart = [];
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
  if (!useSupabase) {
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
  } else {
    localStorage.removeItem("user");
  }
  loggedInUser = null;
  isAdmin = false;
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
      image: item.product_variants.products.images?.[0] || "",
      size: "Standard",
      color: "Default"
    }));
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
  }
}

async function addToCartDB(product, selectedSize, selectedColor) {
  if (!useSupabase) {
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
  if (currentPage === "cart") renderCart();
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
        <div><img src="${item.image || 'https://via.placeholder.com/50'}" width="50" height="50" style="object-fit:cover; border-radius:8px;" loading="lazy"> ${escapeHtml(item.name)} (${escapeHtml(item.size)}, ${escapeHtml(item.color)})</div>
        <div>$${item.price.toFixed(2)} <button style="width:auto; padding:4px 12px;" onclick="removeFromCart(${idx})">Remove</button></div>
      </div>
    `;
  });
  html += `<div class="cart-item"><strong>Total:</strong> <strong>$${total.toFixed(2)}</strong></div>`;
  cartContainer.innerHTML = html;
}

// ==================== CHECKOUT ====================
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
    const order = {
      id: Date.now(),
      items: [...cart],
      total: total,
      user: loggedInUser,
      trackingCode: trackingCode,
      status: "Processing",
      date: new Date().toISOString()
    };
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
  }
  cart = [];
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
  let whatsappMsg = `I need to pay my order%0A%0AProduct Name | Color | Size | Qty | Price%0A----------------------------------------%0A`;
  cart.forEach(item => {
    whatsappMsg += `${escapeHtml(item.name)} | ${escapeHtml(item.color)} | ${escapeHtml(item.size)} | 1 | $${item.price.toFixed(2)}%0A`;
  });
  whatsappMsg += `----------------------------------------%0ATotal: $${total.toFixed(2)}%0ATracking Code: ${trackingCode}`;
  window.open(`https://wa.me/263776871711?text=${whatsappMsg}`);
  alert(`Order placed! Tracking code: ${trackingCode}\nWhatsApp message sent to admin.`);
  switchPage("home");
}

// ==================== UI DISPLAY FUNCTIONS (unchanged from original) ====================
function displayHomeProducts(products) {
  const container = document.getElementById("productsContainer");
  if (!container) return;
  container.innerHTML = "";
  if (products.length === 0) {
    container.innerHTML = "<p>No products found.</p>";
    return;
  }
  const firstBatch = products.slice(0, 8);
  renderProductBatch(firstBatch, container);
  if (products.length > 8) {
    const remaining = products.slice(8);
    let index = 0;
    const chunkSize = 8;
    function renderNextChunk() {
      const chunk = remaining.slice(index, index + chunkSize);
      renderProductBatch(chunk, container);
      index += chunkSize;
      if (index < remaining.length) setTimeout(renderNextChunk, 50);
    }
    setTimeout(renderNextChunk, 100);
  }
}

function renderProductBatch(products, container) {
  products.forEach(product => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.setAttribute("data-product-id", product.id);
    card.onclick = () => openProductById(product.id);
    let imgUrl = product.mainImage;
    if (imgUrl.includes('i.imgur.com') && !imgUrl.includes('?')) imgUrl += '?width=300';
    card.innerHTML = `
      <img src="${imgUrl}" alt="${product.name}" loading="lazy" decoding="async" fetchpriority="low" class="loading">
      <div class="product-info">
        <div class="product-name">${escapeHtml(product.name)}</div>
        <div class="product-price">$${product.price}</div>
      </div>
    `;
    container.appendChild(card);
    const img = card.querySelector('img');
    img.onload = () => img.classList.remove('loading');
    img.onerror = () => img.classList.remove('loading');
  });
}

function openProductById(id) {
  const product = allProducts.find(p => p.id == id);
  if (product) openProduct(product);
}

function openProduct(product) {
  if (!product) return;
  currentProduct = product;
  document.getElementById("pName").innerText = product.name;
  document.getElementById("pDesc").innerText = product.desc;
  document.getElementById("pPrice").innerText = `$${product.price}`;
  document.getElementById("mainImage").src = product.mainImage;
  const colorSelect = document.getElementById("colorSelect");
  if (colorSelect) {
    colorSelect.innerHTML = "";
    product.colors.forEach(color => {
      colorSelect.innerHTML += `<option value="${escapeHtml(color)}">${escapeHtml(color)}</option>`;
    });
  }
  const subContainer = document.getElementById("subImages");
  if (subContainer) {
    subContainer.innerHTML = "";
    const allImages = [product.mainImage, ...(product.subImages || [])];
    allImages.forEach((img, idx) => {
      if (img && img.trim()) {
        const imgEl = document.createElement("img");
        imgEl.src = img;
        imgEl.loading = "lazy";
        imgEl.decoding = "async";
        imgEl.onclick = () => changeMainImage(img, imgEl);
        if (idx === 0) imgEl.classList.add("active");
        subContainer.appendChild(imgEl);
      }
    });
  }
  const sizeSelect = document.getElementById("sizeSelect");
  if (sizeSelect) {
    sizeSelect.innerHTML = "";
    product.sizeOptions.forEach(s => {
      sizeSelect.innerHTML += `<option value="${s.price}">${escapeHtml(s.size)} - $${s.price}</option>`;
    });
    sizeSelect.onchange = () => {
      document.getElementById("pPrice").innerText = `$${sizeSelect.value}`;
    };
  }
  loadRecommendations("product");
  switchPage("productPage");
}

function changeMainImage(src, el) {
  document.getElementById("mainImage").src = src;
  document.querySelectorAll(".sub-images img").forEach(i => i.classList.remove("active"));
  el.classList.add("active");
}

function downloadImage() {
  const imgUrl = document.getElementById("mainImage").src;
  if (!imgUrl) return;
  const a = document.createElement('a');
  a.href = imgUrl;
  a.download = 'product-image.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ==================== FILTERS & MENU ====================
function populateFilters() {
  const categorySelect = document.getElementById("categoryFilter");
  const categories = Object.keys(categoryHierarchy);
  categorySelect.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    categorySelect.innerHTML += `<option value="${cat}">${topLevelNames[cat] || cat}</option>`;
  });
}

function filterProducts() {
  const category = document.getElementById("categoryFilter").value;
  const subcategory = document.getElementById("subcategoryFilter").value;
  const minPrice = parseFloat(document.getElementById("minPrice").value) || 0;
  const maxPrice = parseFloat(document.getElementById("maxPrice").value) || Infinity;
  let filtered = [...allProducts];
  if (category !== "all") {
    filtered = filtered.filter(p => p.cat === category);
    const subSelect = document.getElementById("subcategoryFilter");
    if (category !== "all") {
      const subcats = [];
      const subcatsObj = categoryHierarchy[category];
      if (subcatsObj) {
        Object.keys(subcatsObj).forEach(sub => {
          subcatsObj[sub].forEach(leaf => subcats.push(leaf));
        });
      }
      subSelect.innerHTML = '<option value="all">All Subcategories</option>';
      subcats.forEach(sub => {
        subSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
      });
    } else {
      subSelect.innerHTML = '<option value="all">All Subcategories</option>';
    }
    if (subcategory !== "all") {
      filtered = filtered.filter(p => p.subcat === subcategory);
    }
  } else {
    document.getElementById("subcategoryFilter").innerHTML = '<option value="all">All Subcategories</option>';
  }
  filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);
  filtered = shuffleArray(filtered);
  displayHomeProducts(filtered);
}

function resetFilters() {
  document.getElementById("categoryFilter").value = "all";
  document.getElementById("subcategoryFilter").innerHTML = '<option value="all">All Subcategories</option>';
  document.getElementById("minPrice").value = "";
  document.getElementById("maxPrice").value = "";
  filterProducts();
}

function loadMenu() {
  const menuDiv = document.getElementById("mainMenu");
  menuDiv.innerHTML = "";
  const categories = Object.keys(categoryHierarchy);
  categories.forEach(cat => {
    const shortName = topLevelNames[cat] || cat;
    menuDiv.innerHTML += `<div onclick="selectMainCategory('${cat}')">${shortName}</div>`;
  });
}

function selectMainCategory(category) {
  lastClickedMainCat = category;
  const subMenuDiv = document.getElementById("subMenu");
  subMenuDiv.innerHTML = "";
  const subcats = categoryHierarchy[category];
  if (subcats) {
    Object.keys(subcats).forEach(sub => {
      const iconUrl = subcategoryIcons[sub] || defaultIcon;
      subMenuDiv.innerHTML += `
        <div onclick="selectSubCategory('${sub}')">
          <img src="${iconUrl}" style="width:32px; height:32px;" alt="${sub}">
        </div>
      `;
    });
  }
}

function selectSubCategory(sub) {
  const mainCat = lastClickedMainCat;
  const leaves = categoryHierarchy[mainCat][sub];
  if (leaves) {
    let filtered = allProducts.filter(p => leaves.includes(p.subcat));
    filtered = shuffleArray(filtered);
    displayHomeProducts(filtered);
    switchPage("home");
  }
}

// ==================== NAVIGATION ====================
function switchPage(pageId) {
  if (currentPage === pageId) return;
  currentPage = pageId;
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const activePage = document.getElementById(pageId);
  if (activePage) activePage.classList.add("active");
  if (pageId === "home") {
    if (lastClickedMainCat) selectMainCategory(lastClickedMainCat);
    else filterProducts();
    document.getElementById("subMenu").innerHTML = "";
  } else if (pageId === "cart") {
    renderCart();
    loadRecommendations("cart");
  } else if (pageId === "tracking") {
    initMap();
    loadRecommendations("tracking");
  } else if (pageId === "chat") {
    loadRecommendations("chat");
  } else if (pageId === "promo") {
    loadRecommendations("promo");
  } else if (pageId === "account") {
    loadRecommendations("account");
  } else if (pageId === "adminDashboard") {
    if (document.getElementById("adminPanel").style.display !== "block") {
      document.getElementById("adminLogin").style.display = "block";
      document.getElementById("adminPanel").style.display = "none";
    }
  } else if (pageId === "adminOrdersPage") {
    loadOrdersFull();
  } else if (pageId === "adminProductsPage") {
    loadProductsFull();
  } else if (pageId === "adminQuotesPage") {
    setupQuotationForm();
  } else if (pageId === "adminShippingPage") {
    loadShipments();
  }
}

function resetHome() {
  lastClickedMainCat = "";
  document.getElementById("subMenu").innerHTML = "";
  filterProducts();
  switchPage("home");
}

function loadRecommendations(pageId) {
  let container = null;
  if (pageId === "product") container = document.getElementById("productRecommend");
  else if (pageId === "cart") container = document.getElementById("cartRecommend");
  else if (pageId === "tracking") container = document.getElementById("trackingRecommend");
  else if (pageId === "chat") container = document.getElementById("chatRecommend");
  else if (pageId === "promo") container = document.getElementById("promoRecommend");
  else if (pageId === "account") container = document.getElementById("accountRecommend");
  if (!container) return;
  let recs = [...allProducts];
  if (currentProduct) {
    recs = recs.filter(p => p.id !== currentProduct.id);
  }
  recs = recs.slice(0, 4);
  container.innerHTML = "<h4>You may also like</h4><div class='recommend-grid'></div>";
  const grid = container.querySelector(".recommend-grid");
  recs.forEach(prod => {
    const card = document.createElement("div");
    card.className = "recommend-card";
    card.onclick = () => openProduct(prod);
    card.innerHTML = `
      <img src="${prod.mainImage}" alt="${escapeHtml(prod.name)}" loading="lazy" decoding="async">
      <p>${escapeHtml(prod.name)}<br><strong>$${prod.price}</strong></p>
    `;
    grid.appendChild(card);
  });
}

// ==================== SEARCH & SCAN ====================
function searchProducts() {
  const term = document.getElementById("searchInput").value.toLowerCase();
  if (term === "") {
    filterProducts();
    return;
  }
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
  displayHomeProducts(filtered);
  switchPage("home");
}

document.getElementById("scanInput")?.addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (!file) return;
  alert("Scanning product... (demo)");
  filterProducts();
  switchPage("home");
});

// ==================== TRACKING & MAP ====================
function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;
  if (typeof L !== 'undefined') {
    const map = L.map(mapElement).setView([-17, 30], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.marker([-17, 30]).addTo(map)
      .bindPopup('Mmeli Global<br>Your location.')
      .openPopup();
  }
}

function trackNow() {
  const code = document.getElementById("trackCode").value.trim();
  const last4 = document.getElementById("phoneLast4").value.trim();
  if (!code || !last4) {
    alert("Please enter tracking code and last 4 digits of phone.");
    return;
  }
  let ordersArray = [];
  if (useSupabase) {
    // We'll need to fetch orders from Supabase for the user
    alert("Tracking from Supabase: please implement order fetch or use demo orders.");
    return;
  } else {
    ordersArray = JSON.parse(localStorage.getItem('orders') || '[]');
  }
  const order = ordersArray.find(o => o.trackingCode === code && o.user.phone.endsWith(last4));
  if (!order) {
    document.getElementById("shipmentHistory").innerHTML = "<p>No order found with that tracking code and phone.</p>";
    return;
  }
  let history = `<strong>Tracking for ${escapeHtml(code)}</strong><br>Status: ${order.status}<br>Items: ${order.items.map(i => i.name).join(", ")}<br>Total: $${order.total}<br>Date: ${new Date(order.date).toLocaleString()}<br>`;
  if (order.status === "Processing") history += "Your order is being prepared.";
  else if (order.status === "Shipped") history += "Your order is on the way!";
  else if (order.status === "Delivered") history += "Delivered. Enjoy!";
  document.getElementById("shipmentHistory").innerHTML = history;
}

// ==================== CHAT & PROMO ====================
function sendMsg(msg) {
  window.open(`https://wa.me/263776871711?text=${encodeURIComponent(msg)}`);
}

function loadPromos() {
  const promoDiv = document.getElementById("promoList");
  if (promoDiv) promoDiv.innerHTML = "<h3>🔥 Limited Time: 20% off all handbags! Use code MMELI20 🔥</h3>";
}

// ==================== ACCOUNT FUNCTIONS (localStorage fallback for quotations/orders view) ====================
function viewMyQuotations() {
  if (!loggedInUser) { alert("Please sign in first."); return; }
  let quotes = [];
  if (useSupabase) {
    // For simplicity, load from localStorage for now – you can extend to Supabase later
    quotes = JSON.parse(localStorage.getItem('quotations') || '[]');
  } else {
    quotes = JSON.parse(localStorage.getItem('quotations') || '[]');
  }
  const myQuotes = quotes.filter(q => q.clientPhone === (loggedInUser.phone || loggedInUser.user_metadata?.phone));
  const container = document.getElementById("quotationsList");
  if (myQuotes.length === 0) container.innerHTML = "<p>No quotations found.</p>";
  else {
    container.innerHTML = myQuotes.map(q => `
      <div style="border:1px solid #ddd; padding:12px; margin-bottom:12px; border-radius:12px;">
        <strong>Quote #${escapeHtml(q.quoteNumber)}</strong><br>
        <strong>Date:</strong> ${new Date(q.issueDate).toLocaleDateString()}<br>
        <strong>Total:</strong> $${q.total}<br>
        <button onclick="viewQuote('${q.id}')">View Quote</button>
      </div>
    `).join('');
  }
  document.getElementById("myQuotations").style.display = "block";
  document.getElementById("myOrders").style.display = "none";
  document.getElementById("settingsForm").style.display = "none";
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("dashboard").style.display = "none";
}

function viewMyOrders() {
  if (!loggedInUser) { alert("Please sign in first."); return; }
  let ordersArray = [];
  if (useSupabase) {
    // For simplicity, load from localStorage – you can replace with Supabase query
    ordersArray = JSON.parse(localStorage.getItem('orders') || '[]');
  } else {
    ordersArray = JSON.parse(localStorage.getItem('orders') || '[]');
  }
  const myOrders = ordersArray.filter(o => o.user.phone === (loggedInUser.phone || loggedInUser.user_metadata?.phone));
  const container = document.getElementById("ordersList");
  if (myOrders.length === 0) container.innerHTML = "<p>No orders found.</p>";
  else {
    container.innerHTML = myOrders.map(o => `
      <div style="border:1px solid #ddd; padding:12px; margin-bottom:12px; border-radius:12px;">
        <strong>Order #:</strong> ${escapeHtml(o.trackingCode)}<br>
        <strong>Date:</strong> ${new Date(o.date).toLocaleString()}<br>
        <strong>Status:</strong> ${escapeHtml(o.status)}<br>
        <strong>Total:</strong> $${o.total}<br>
        <button onclick="reorder('${o.trackingCode}')">Reorder</button>
      </div>
    `).join('');
  }
  document.getElementById("myOrders").style.display = "block";
  document.getElementById("myQuotations").style.display = "none";
  document.getElementById("settingsForm").style.display = "none";
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("dashboard").style.display = "none";
}

function reorder(trackingCode) {
  let ordersArray = JSON.parse(localStorage.getItem('orders') || '[]');
  const order = ordersArray.find(o => o.trackingCode === trackingCode);
  if (order) {
    cart = [...order.items];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert("Items added to cart. Go to cart to checkout.");
    switchPage("cart");
  }
}

function showSettings() {
  if (!loggedInUser) return;
  const userData = loggedInUser.user_metadata || loggedInUser;
  document.getElementById("editName").value = userData.full_name?.split(' ')[0] || "";
  document.getElementById("editSurname").value = userData.full_name?.split(' ')[1] || "";
  document.getElementById("editPhone").value = userData.phone || "";
  document.getElementById("editAddress").value = userData.address || "";
  document.getElementById("settingsForm").style.display = "block";
  document.getElementById("myQuotations").style.display = "none";
  document.getElementById("myOrders").style.display = "none";
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("dashboard").style.display = "none";
}

function saveProfile() {
  // For Supabase, update profiles table – but keeping simple for now
  const newName = document.getElementById("editName").value;
  const newSurname = document.getElementById("editSurname").value;
  const newPhone = document.getElementById("editPhone").value;
  const newAddress = document.getElementById("editAddress").value;
  if (useSupabase && loggedInUser) {
    supabaseClient.auth.updateUser({
      data: { full_name: `${newName} ${newSurname}`, phone: newPhone, address: newAddress }
    }).then(() => {
      alert("Profile updated.");
      closeSettings();
      checkUser();
    });
  } else {
    if (loggedInUser) {
      loggedInUser.name = newName;
      loggedInUser.surname = newSurname;
      loggedInUser.phone = newPhone;
      loggedInUser.address = newAddress;
      localStorage.setItem("user", JSON.stringify(loggedInUser));
    }
    alert("Profile updated.");
    closeSettings();
    checkUser();
  }
}

function closeSettings() {
  document.getElementById("settingsForm").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("dashboard").style.display = "block";
}

function closeQuotations() {
  document.getElementById("myQuotations").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("dashboard").style.display = "block";
}

function closeOrders() {
  document.getElementById("myOrders").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("dashboard").style.display = "block";
}

// ==================== ADMIN FUNCTIONS ====================
function adminLogin() {
  const user = document.getElementById("adminUser").value;
  const pass = document.getElementById("adminPass").value;
  if (user === "admin" && pass === "admin123") {
    document.getElementById("adminLogin").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    loadAdminSummaries();
  } else {
    alert("Invalid admin credentials");
  }
}

function loadAdminSummaries() {
  let ordersCount = 0;
  if (useSupabase) {
    // Fetch from Supabase or fallback to localStorage
    supabaseClient.from('orders').select('*', { count: 'exact', head: true }).then(({ count }) => {
      document.getElementById("adminOrdersSummary").innerHTML = `📦 ${count || 0} orders`;
    });
  } else {
    let ordersArray = JSON.parse(localStorage.getItem('orders') || '[]');
    document.getElementById("adminOrdersSummary").innerHTML = `📦 ${ordersArray.length} orders`;
  }
  document.getElementById("adminProductsSummary").innerHTML = `🛍️ ${allProducts.length} products`;
  loadOrdersFull();
  loadProductsFull();
}

function loadOrdersFull() {
  const container = document.getElementById("adminOrdersFull");
  if (!container) return;
  if (useSupabase) {
    supabaseClient.from('orders').select('*, profiles(full_name)').then(({ data, error }) => {
      if (error) { container.innerHTML = "<p>Error loading orders.</p>"; return; }
      container.innerHTML = data.length ? data.map(o => `
        <div style="border-bottom:1px solid #ccc; margin-bottom:8px;">
          <strong>${escapeHtml(o.order_number || o.id)}</strong> - ${o.status}<br>
          User: ${o.profiles?.full_name || 'Guest'}<br>
          Total: $${o.total_amount}<br>
          <button onclick="updateOrderStatus('${o.id}')">Mark as Shipped</button>
        </div>
      `).join('') : "<p>No orders yet.</p>";
    });
  } else {
    let ordersArray = JSON.parse(localStorage.getItem('orders') || '[]');
    container.innerHTML = ordersArray.length ? ordersArray.map(o => `
      <div style="border-bottom:1px solid #ccc; margin-bottom:8px;">
        <strong>${escapeHtml(o.trackingCode)}</strong> - ${o.status}<br>
        User: ${escapeHtml(o.user.name)} ${escapeHtml(o.user.surname)}<br>
        Total: $${o.total}<br>
        <button onclick="updateOrderStatus('${o.trackingCode}')">Mark as Shipped</button>
      </div>
    `).join('') : "<p>No orders yet.</p>";
  }
}

function updateOrderStatus(idOrCode) {
  if (useSupabase) {
    supabaseClient.from('orders').update({ status: 'shipped' }).eq('id', idOrCode).then(() => {
      alert("Order marked as shipped.");
      loadOrdersFull();
    });
  } else {
    let ordersArray = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = ordersArray.find(o => o.trackingCode === idOrCode);
    if (order) {
      order.status = "Shipped";
      localStorage.setItem('orders', JSON.stringify(ordersArray));
      loadOrdersFull();
      alert(`Order ${idOrCode} marked as shipped.`);
    }
  }
}

function loadProductsFull() {
  const container = document.getElementById("adminProductsFull");
  if (!container) return;
  if (allProducts.length === 0) {
    container.innerHTML = "<p>No products. Click 'Add New Product' to create one.</p>";
    return;
  }
  container.innerHTML = allProducts.map(p => `
    <div style="border-bottom:1px solid #ccc; margin-bottom:8px; padding:8px;">
      <strong>${escapeHtml(p.name)}</strong> - $${p.price}<br>
      ${p.cat} / ${p.subcat}<br>
      <button onclick="editProduct(${p.id})">✏️ Edit</button>
      <button onclick="deleteProduct(${p.id})" style="background:#e74c3c;">🗑️ Delete</button>
    </div>
  `).join('');
}

async function addProduct() {
  const name = document.getElementById("newName").value;
  const price = parseFloat(document.getElementById("newPrice").value);
  const image = document.getElementById("newImage").value;
  const extraImages = document.getElementById("newExtraImages").value;
  const desc = document.getElementById("newDesc").value;
  const category = document.getElementById("newCategory").value;
  const subcategory = document.getElementById("newSubcategory").value;
  const colorInput = document.getElementById("newColor").value;
  const sizeInput = document.getElementById("newSize").value;
  if (!name || isNaN(price) || !image || !category || !subcategory) {
    alert("Please fill required fields.");
    return;
  }
  let sizeOptions = [];
  if (sizeInput) {
    const pairs = sizeInput.split(',');
    pairs.forEach(pair => {
      const [size, p] = pair.split(':');
      if (size && p) sizeOptions.push({ size: size.trim(), price: parseFloat(p) });
    });
  }
  if (sizeOptions.length === 0) sizeOptions.push({ size: "Standard", price: price });
  let colors = [];
  if (colorInput) colors = colorInput.split(',').map(c => c.trim());
  if (colors.length === 0) colors = ["Default"];
  let subImages = extraImages ? extraImages.split(',').map(url => url.trim()).filter(u => u) : [];
  const newProduct = {
    name: name,
    desc: desc || "Added by admin",
    cat: category,
    subcat: subcategory,
    price: price,
    colors: colors,
    sizeOptions: sizeOptions,
    mainImage: image,
    subImages: subImages
  };
  const inserted = await saveProduct(newProduct);
  if (inserted) {
    allProducts.push(inserted);
    allProducts = shuffleArray(allProducts);
    displayHomeProducts(allProducts);
    loadAdminSummaries();
    loadProductsFull();
    alert("Product added!");
  } else if (useSupabase) {
    alert("Failed to add product to Supabase.");
  } else {
    newProduct.id = Date.now();
    allProducts.push(newProduct);
    allProducts = shuffleArray(allProducts);
    displayHomeProducts(allProducts);
    loadAdminSummaries();
    loadProductsFull();
    alert("Product added locally.");
  }
  document.getElementById("newName").value = "";
  document.getElementById("newPrice").value = "";
  document.getElementById("newImage").value = "";
  document.getElementById("newExtraImages").value = "";
  document.getElementById("newDesc").value = "";
  document.getElementById("newCategory").value = "";
  document.getElementById("newSubcategory").value = "";
  document.getElementById("newColor").value = "";
  document.getElementById("newSize").value = "";
  switchPage("adminDashboard");
}

async function editProduct(id) {
  const product = allProducts.find(p => p.id == id);
  if (!product) return;
  editProductId = id;
  document.getElementById("newName").value = product.name;
  document.getElementById("newPrice").value = product.price;
  document.getElementById("newImage").value = product.mainImage;
  document.getElementById("newExtraImages").value = (product.subImages || []).join(", ");
  document.getElementById("newDesc").value = product.desc;
  document.getElementById("newCategory").value = product.cat;
  document.getElementById("newSubcategory").value = product.subcat;
  document.getElementById("newColor").value = product.colors.join(", ");
  const sizeString = product.sizeOptions.map(s => `${s.size}:${s.price}`).join(", ");
  document.getElementById("newSize").value = sizeString;
  const addBtn = document.querySelector("#adminAddProductPage button");
  addBtn.innerText = "Update Product";
  addBtn.onclick = () => updateProduct();
  switchPage("adminAddProductPage");
}

async function updateProduct() {
  const name = document.getElementById("newName").value;
  const price = parseFloat(document.getElementById("newPrice").value);
  const image = document.getElementById("newImage").value;
  const extraImages = document.getElementById("newExtraImages").value;
  const desc = document.getElementById("newDesc").value;
  const category = document.getElementById("newCategory").value;
  const subcategory = document.getElementById("newSubcategory").value;
  const colorInput = document.getElementById("newColor").value;
  const sizeInput = document.getElementById("newSize").value;
  if (!name || isNaN(price) || !image || !category || !subcategory) {
    alert("Please fill required fields.");
    return;
  }
  let sizeOptions = [];
  if (sizeInput) {
    const pairs = sizeInput.split(',');
    pairs.forEach(pair => {
      const [size, p] = pair.split(':');
      if (size && p) sizeOptions.push({ size: size.trim(), price: parseFloat(p) });
    });
  }
  if (sizeOptions.length === 0) sizeOptions.push({ size: "Standard", price: price });
  let colors = [];
  if (colorInput) colors = colorInput.split(',').map(c => c.trim());
  if (colors.length === 0) colors = ["Default"];
  let subImages = extraImages ? extraImages.split(',').map(url => url.trim()).filter(u => u) : [];
  const updatedProduct = {
    id: editProductId,
    name: name,
    desc: desc || "Added by admin",
    cat: category,
    subcat: subcategory,
    price: price,
    colors: colors,
    sizeOptions: sizeOptions,
    mainImage: image,
    subImages: subImages
  };
  const saved = await saveProduct(updatedProduct);
  if (saved) {
    const index = allProducts.findIndex(p => p.id == editProductId);
    if (index !== -1) allProducts[index] = saved;
    allProducts = shuffleArray(allProducts);
    displayHomeProducts(allProducts);
    loadAdminSummaries();
    loadProductsFull();
    alert("Product updated.");
  } else if (useSupabase) {
    alert("Update failed.");
  } else {
    const index = allProducts.findIndex(p => p.id == editProductId);
    if (index !== -1) allProducts[index] = updatedProduct;
    allProducts = shuffleArray(allProducts);
    displayHomeProducts(allProducts);
    loadAdminSummaries();
    loadProductsFull();
    alert("Product updated locally.");
  }
  document.getElementById("newName").value = "";
  document.getElementById("newPrice").value = "";
  document.getElementById("newImage").value = "";
  document.getElementById("newExtraImages").value = "";
  document.getElementById("newDesc").value = "";
  document.getElementById("newCategory").value = "";
  document.getElementById("newSubcategory").value = "";
  document.getElementById("newColor").value = "";
  document.getElementById("newSize").value = "";
  const addBtn = document.querySelector("#adminAddProductPage button");
  addBtn.innerText = "Add Product";
  addBtn.onclick = () => addProduct();
  editProductId = null;
  switchPage("adminDashboard");
}

async function deleteProduct(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    const success = await deleteProductFromDB(id);
    if (success) {
      allProducts = allProducts.filter(p => p.id != id);
      allProducts = shuffleArray(allProducts);
      displayHomeProducts(allProducts);
      loadAdminSummaries();
      loadProductsFull();
      alert("Product deleted.");
    } else {
      alert("Delete failed.");
    }
  }
}

function saveSettings() {
  const siteName = document.getElementById("siteName").value;
  const contactPhone = document.getElementById("contactPhone").value;
  localStorage.setItem('siteName', siteName);
  localStorage.setItem('contactPhone', contactPhone);
  document.querySelector(".logo-text").innerText = siteName;
  alert("Settings saved.");
  switchPage("adminDashboard");
}

// ==================== QUOTATION FUNCTIONS ====================
function setupQuotationForm() {
  const today = new Date().toISOString().split('T')[0];
  const issueDateInput = document.getElementById("quoteIssueDate");
  if (issueDateInput) issueDateInput.value = today;
  const validThroughInput = document.getElementById("quoteValidThrough");
  if (validThroughInput) {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    validThroughInput.value = future.toISOString().split('T')[0];
  }
  const addBtn = document.getElementById("addItemBtn");
  if (addBtn) addBtn.addEventListener("click", addItemRow);
  const container = document.getElementById("quoteItemsContainer");
  if (container) {
    container.addEventListener("input", calculateQuoteTotals);
    const discountValue = document.getElementById("discountValue");
    if (discountValue) discountValue.addEventListener("input", calculateQuoteTotals);
    const taxRate = document.getElementById("taxRate");
    if (taxRate) taxRate.addEventListener("input", calculateQuoteTotals);
    const discountType = document.getElementById("discountType");
    if (discountType) discountType.addEventListener("change", calculateQuoteTotals);
    calculateQuoteTotals();
  }
}

function addItemRow() {
  const container = document.getElementById("quoteItemsContainer");
  if (!container) return;
  const row = document.createElement("div");
  row.className = "quote-item-row";
  row.innerHTML = `
    <input type="text" class="item-desc" placeholder="Description" style="width:40%">
    <input type="number" class="item-qty" placeholder="Qty" value="1" style="width:15%">
    <input type="number" class="item-price" placeholder="Unit Price" style="width:20%">
    <span class="item-subtotal">0.00</span>
    <button type="button" class="remove-item" style="width:10%">✖</button>
  `;
  row.querySelector(".remove-item").addEventListener("click", () => row.remove());
  container.appendChild(row);
  calculateQuoteTotals();
}

function calculateQuoteTotals() {
  let subtotal = 0;
  const rows = document.querySelectorAll("#quoteItemsContainer .quote-item-row");
  rows.forEach(row => {
    const qty = parseFloat(row.querySelector(".item-qty").value) || 0;
    const price = parseFloat(row.querySelector(".item-price").value) || 0;
    const subtotalRow = qty * price;
    row.querySelector(".item-subtotal").innerText = subtotalRow.toFixed(2);
    subtotal += subtotalRow;
  });
  const discountType = document.getElementById("discountType").value;
  let discountValue = parseFloat(document.getElementById("discountValue").value) || 0;
  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = (discountValue / 100) * subtotal;
  } else {
    discountAmount = discountValue;
  }
  const afterDiscount = subtotal - discountAmount;
  const taxRate = parseFloat(document.getElementById("taxRate").value) || 0;
  const taxAmount = (taxRate / 100) * afterDiscount;
  const total = afterDiscount + taxAmount;
  document.getElementById("subtotal").innerText = subtotal.toFixed(2);
  document.getElementById("discountAmount").innerText = discountAmount.toFixed(2);
  document.getElementById("taxAmount").innerText = taxAmount.toFixed(2);
  document.getElementById("totalAmount").innerText = total.toFixed(2);
}

function generateQuote() {
  const quoteData = {
    id: Date.now(),
    quoteNumber: document.getElementById("quoteNumber").value.trim() || "QT" + Math.floor(Math.random() * 10000),
    issueDate: document.getElementById("quoteIssueDate").value,
    validThrough: document.getElementById("quoteValidThrough").value,
    company: {
      name: document.getElementById("quoteCompanyName").value,
      address1: document.getElementById("quoteCompanyAddress").value,
      address2: document.getElementById("quoteCompanyAddress2").value,
      address3: document.getElementById("quoteCompanyAddress3").value,
      phone: document.getElementById("quoteCompanyPhone").value
    },
    client: {
      name: document.getElementById("quoteClientName").value,
      phone: document.getElementById("quoteClientPhone").value,
      address1: document.getElementById("quoteClientAddress1").value,
      address2: document.getElementById("quoteClientAddress2").value,
      address3: document.getElementById("quoteClientAddress3").value
    },
    items: [],
    discountType: document.getElementById("discountType").value,
    discountValue: parseFloat(document.getElementById("discountValue").value) || 0,
    taxRate: parseFloat(document.getElementById("taxRate").value) || 0,
    notes: document.getElementById("quoteNotes").value
  };
  const rows = document.querySelectorAll("#quoteItemsContainer .quote-item-row");
  rows.forEach(row => {
    const desc = row.querySelector(".item-desc").value;
    const qty = parseFloat(row.querySelector(".item-qty").value) || 0;
    const price = parseFloat(row.querySelector(".item-price").value) || 0;
    if (desc && qty > 0 && price > 0) {
      quoteData.items.push({ desc, qty, price, subtotal: qty * price });
    }
  });
  if (quoteData.items.length === 0) {
    alert("Add at least one item.");
    return;
  }
  let subtotal = quoteData.items.reduce((sum, i) => sum + i.subtotal, 0);
  let discountAmount = quoteData.discountType === "percentage" ? (quoteData.discountValue / 100) * subtotal : quoteData.discountValue;
  let afterDiscount = subtotal - discountAmount;
  let taxAmount = (quoteData.taxRate / 100) * afterDiscount;
  quoteData.subtotal = subtotal;
  quoteData.discountAmount = discountAmount;
  quoteData.taxAmount = taxAmount;
  quoteData.total = afterDiscount + taxAmount;
  let quotationsArray = JSON.parse(localStorage.getItem('quotations') || '[]');
  quotationsArray.push(quoteData);
  localStorage.setItem('quotations', JSON.stringify(quotationsArray));
  alert("Quote saved!");
  viewQuote(quoteData.id);
}

function viewQuote(quoteId) {
  let quotationsArray = JSON.parse(localStorage.getItem('quotations') || '[]');
  const quote = quotationsArray.find(q => q.id == quoteId);
  if (!quote) return;
  let html = `
    <div style="font-family: monospace; max-width: 800px; margin:0 auto;">
      <h2>${escapeHtml(quote.company.name)}</h2>
      <div>${escapeHtml(quote.company.address1)}</div>
      <div>${escapeHtml(quote.company.address2)}</div>
      <div>${escapeHtml(quote.company.address3)}</div>
      <div>${escapeHtml(quote.company.phone)}</div>
      <hr>
      <h3>RECEIVER</h3>
      <div>${escapeHtml(quote.client.name)}</div>
      <div>${escapeHtml(quote.client.address1)}</div>
      <div>${escapeHtml(quote.client.address2)}</div>
      <div>${escapeHtml(quote.client.address3)}</div>
      <hr>
      <h3>Logistics Quote</h3>
      <p>Quote Number: ${escapeHtml(quote.quoteNumber)}</p>
      <p>Issue Date: ${new Date(quote.issueDate).toLocaleDateString()}</p>
      <p>Valid Through: ${new Date(quote.validThrough).toLocaleDateString()}</p>
      <hr>
      <h4>PAYMENT CONDITIONS</h4>
      <table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse: collapse;">
        <thead><tr><th>DESCRIPTION</th><th>QTY</th><th>UNIT PRICE</th><th>SUBTOTAL</th><th>TAX</th></tr></thead>
        <tbody>
  `;
  quote.items.forEach(item => {
    const itemTax = (item.subtotal / quote.subtotal) * quote.taxAmount;
    html += `<tr><td>${escapeHtml(item.desc)}</td><td>${item.qty}</td><td>$${item.price.toFixed(2)}</td><td>$${item.subtotal.toFixed(2)}</td><td>$${itemTax.toFixed(2)}</td></tr>`;
  });
  html += `</tbody></table>`;
  if (quote.notes) html += `<p><em>${escapeHtml(quote.notes)}</em></p>`;
  html += `
      <hr>
      <p>Subtotal: $${quote.subtotal.toFixed(2)}</p>
      <p>Discount (${quote.discountType === 'percentage' ? quote.discountValue + '%' : '$' + quote.discountValue}): -$${quote.discountAmount.toFixed(2)}</p>
      <p>Tax (${quote.taxRate}%): $${quote.taxAmount.toFixed(2)}</p>
      <p><strong>Total: $${quote.total.toFixed(2)}</strong></p>
    </div>
  `;
  document.getElementById("quotePreview").innerHTML = html;
  document.getElementById("quoteModal").style.display = "flex";
}

function closeQuoteModal() {
  document.getElementById("quoteModal").style.display = "none";
}

function printQuote() {
  const printContents = document.getElementById("quotePreview").innerHTML;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html><head><title>Quote</title><style>body { font-family: monospace; padding: 20px; } table { width:100%; border-collapse: collapse; } th, td { border: 1px solid #000; padding: 8px; text-align: left; }</style></head><body>${printContents}</body></html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// ==================== SHIPPING FUNCTIONS ====================
function saveShipment() {
  const clientName = document.getElementById("shipClientName").value;
  const clientPhone = document.getElementById("shipClientPhone").value;
  const clientAddress = document.getElementById("shipClientAddress").value;
  const receiverName = document.getElementById("shipReceiverName").value;
  const receiverPhone = document.getElementById("shipReceiverPhone").value;
  const receiverAddress = document.getElementById("shipReceiverAddress").value;
  let trackingCode = document.getElementById("shipTrackingCode").value.trim();
  if (!trackingCode) trackingCode = "SHIP" + Math.floor(Math.random() * 1000000);
  const notes = document.getElementById("shipNotes").value;
  const imageFile = document.getElementById("packageImage").files[0];
  if (!clientName || !receiverName) {
    alert("Client name and receiver name are required.");
    return;
  }
  let imageData = null;
  const saveData = () => {
    const shipment = {
      id: Date.now(),
      trackingCode,
      client: { name: clientName, phone: clientPhone, address: clientAddress },
      receiver: { name: receiverName, phone: receiverPhone, address: receiverAddress },
      notes,
      image: imageData,
      status: "pending",
      paid: false,
      date: new Date().toISOString()
    };
    let shipmentsArray = JSON.parse(localStorage.getItem('shipments') || '[]');
    shipmentsArray.push(shipment);
    localStorage.setItem('shipments', JSON.stringify(shipmentsArray));
    alert("Shipment saved.");
    clearShippingForm();
    loadShipments();
  };
  if (imageFile) {
    const reader = new FileReader();
    reader.onload = e => {
      imageData = e.target.result;
      saveData();
    };
    reader.readAsDataURL(imageFile);
  } else {
    saveData();
  }
}

function clearShippingForm() {
  document.getElementById("shipClientName").value = "";
  document.getElementById("shipClientPhone").value = "";
  document.getElementById("shipClientAddress").value = "";
  document.getElementById("shipReceiverName").value = "";
  document.getElementById("shipReceiverPhone").value = "";
  document.getElementById("shipReceiverAddress").value = "";
  document.getElementById("shipTrackingCode").value = "";
  document.getElementById("shipNotes").value = "";
  document.getElementById("packageImage").value = "";
}

function loadShipments() {
  const pendingDiv = document.getElementById("pendingShipmentsList");
  const unpaidDiv = document.getElementById("unpaidShipmentsList");
  if (!pendingDiv || !unpaidDiv) return;
  let shipmentsArray = JSON.parse(localStorage.getItem('shipments') || '[]');
  const pending = shipmentsArray.filter(s => s.status === "pending");
  const unpaid = shipmentsArray.filter(s => s.paid === false);
  pendingDiv.innerHTML = pending.map(s => `
    <div class="shipment-card">
      <strong>Tracking:</strong> ${escapeHtml(s.trackingCode)}<br>
      <strong>Client:</strong> ${escapeHtml(s.client.name)}<br>
      <strong>Receiver:</strong> ${escapeHtml(s.receiver.name)}<br>
      ${s.image ? `<img src="${s.image}" style="max-width:100px;" loading="lazy">` : ''}<br>
      <button onclick="markAsPaid('${s.trackingCode}')">Mark Paid</button>
      <button onclick="markAsShippedShipment('${s.trackingCode}')">Mark Shipped</button>
    </div>
  `).join('');
  unpaidDiv.innerHTML = unpaid.map(s => `
    <div class="shipment-card">
      <strong>Tracking:</strong> ${escapeHtml(s.trackingCode)}<br>
      <strong>Client:</strong> ${escapeHtml(s.client.name)}<br>
      <strong>Total:</strong> $${s.total || '0'}<br>
      <button onclick="markAsPaid('${s.trackingCode}')">Mark Paid</button>
    </div>
  `).join('');
}

function markAsPaid(trackingCode) {
  let shipmentsArray = JSON.parse(localStorage.getItem('shipments') || '[]');
  const shipment = shipmentsArray.find(s => s.trackingCode === trackingCode);
  if (shipment) {
    shipment.paid = true;
    localStorage.setItem('shipments', JSON.stringify(shipmentsArray));
    loadShipments();
    alert("Marked as paid.");
  }
}

function markAsShippedShipment(trackingCode) {
  let shipmentsArray = JSON.parse(localStorage.getItem('shipments') || '[]');
  const shipment = shipmentsArray.find(s => s.trackingCode === trackingCode);
  if (shipment) {
    shipment.status = "shipped";
    localStorage.setItem('shipments', JSON.stringify(shipmentsArray));
    loadShipments();
    alert("Marked as shipped.");
  }
}

// ==================== ADMIN ACCESS ====================
document.getElementById("adminEntry")?.addEventListener("click", () => {
  switchPage("adminDashboard");
});
document.getElementById("logoArea")?.addEventListener("dblclick", () => {
  switchPage("adminDashboard");
});

// ==================== AFTER LOAD & INIT ====================
function afterLoad() {
  populateFilters();
  displayHomeProducts(allProducts);
  loadMenu();
  checkUser();
  loadPromos();
  updateCartCount();
  renderCart();
  checkUrlForProduct();
  addShareButton();
}

function initApp() {
  loadProducts();
  updateCartCount();
  renderCart();
  const savedSiteName = localStorage.getItem('siteName');
  if (savedSiteName) document.querySelector(".logo-text").innerText = savedSiteName;
}

window.onload = () => {
  loadSupabase();
};

// ==================== PRODUCT SHARING & UNIQUE LINKS ====================

// Add a share button to the product page (if not already present)
function addShareButton() {
  const productActions = document.querySelector('.product-actions');
  if (productActions && !document.getElementById('shareProductBtn')) {
    const shareBtn = document.createElement('button');
    shareBtn.id = 'shareProductBtn';
    shareBtn.className = 'download-btn-transparent';
    shareBtn.innerHTML = '🔗';
    shareBtn.title = 'Share product';
    shareBtn.onclick = shareProduct;
    productActions.appendChild(shareBtn);
  }
}

// Share product: copy link or use native share
function shareProduct() {
  if (!currentProduct) return;
  const shareUrl = `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(currentProduct.slug || currentProduct.id)}`;
  if (navigator.share) {
    navigator.share({ title: currentProduct.name, url: shareUrl });
  } else {
    navigator.clipboard.writeText(shareUrl);
    alert("Product link copied to clipboard!");
  }
}

// Update browser URL without reload when product opens
const originalOpenProduct = openProduct;
window.openProduct = function(product) {
  originalOpenProduct(product);
  const slug = product.slug || product.id;
  const newUrl = `${window.location.pathname}?product=${encodeURIComponent(slug)}`;
  window.history.pushState({ product: slug }, '', newUrl);
  addShareButton();
};

// On page load, check URL for product parameter and open it
function checkUrlForProduct() {
  if (!allProducts.length) return;
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('product');
  if (productId) {
    const product = allProducts.find(p => (p.slug || p.id) == productId);
    if (product) openProduct(product);
  }
}

// Override switchPage to preserve share button when returning to product page
const originalSwitchPage = switchPage;
window.switchPage = function(pageId) {
  originalSwitchPage(pageId);
  if (pageId === 'productPage') addShareButton();
};

// Listen to back/forward navigation
window.addEventListener('popstate', function(event) {
  if (event.state && event.state.product) {
    const product = allProducts.find(p => (p.slug || p.id) == event.state.product);
    if (product) openProduct(product);
  } else {
    // If no product in state, go home
    switchPage('home');
  }
});

// Call this after products are loaded (inside your existing afterLoad or init)
// Add this line inside your afterLoad() function:
// checkUrlForProduct();

// To avoid editing existing functions, we monkey-patch afterLoad
const originalAfterLoad = afterLoad;
if (typeof afterLoad === 'function') {
  window.afterLoad = function() {
    originalAfterLoad();
    checkUrlForProduct();
    addShareButton();
  };
}

// ==================== DYNAMIC SOCIAL MEDIA PREVIEW ====================
function updateMetaTags(product) {
  if (!product) return;
  
  // Update or create Open Graph meta tags
  let metaTitle = document.querySelector('meta[property="og:title"]');
  let metaDesc = document.querySelector('meta[property="og:description"]');
  let metaImage = document.querySelector('meta[property="og:image"]');
  let metaUrl = document.querySelector('meta[property="og:url"]');
  
  if (!metaTitle) {
    metaTitle = document.createElement('meta');
    metaTitle.setAttribute('property', 'og:title');
    document.head.appendChild(metaTitle);
  }
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('property', 'og:description');
    document.head.appendChild(metaDesc);
  }
  if (!metaImage) {
    metaImage = document.createElement('meta');
    metaImage.setAttribute('property', 'og:image');
    document.head.appendChild(metaImage);
  }
  if (!metaUrl) {
    metaUrl = document.createElement('meta');
    metaUrl.setAttribute('property', 'og:url');
    document.head.appendChild(metaUrl);
  }
  
  metaTitle.setAttribute('content', product.name + ' | Mmeli Global');
  metaDesc.setAttribute('content', product.desc.substring(0, 200));
  metaImage.setAttribute('content', product.mainImage);
  metaUrl.setAttribute('content', window.location.href);
  
  // Also update standard title
  document.title = product.name + ' | Mmeli Global';
}

// Override openProduct to update meta tags when product opens
const originalOpenProductForMeta = openProduct;
window.openProduct = function(product) {
  originalOpenProductForMeta(product);
  updateMetaTags(product);
};

// When returning to home, reset meta tags to default
function resetMetaTags() {
  let metaTitle = document.querySelector('meta[property="og:title"]');
  let metaDesc = document.querySelector('meta[property="og:description"]');
  let metaImage = document.querySelector('meta[property="og:image"]');
  if (metaTitle) metaTitle.setAttribute('content', 'Mmeli Global | Premium Products');
  if (metaDesc) metaDesc.setAttribute('content', 'Shop premium products, track shipments, get quotations, and manage your account at Mmeli Global.');
  if (metaImage) metaImage.setAttribute('content', 'https://mmeliglobal.com/socialmedia.PNG');
  document.title = 'Mmeli Global | Premium Products';
}

// Override switchPage to reset meta when leaving product page
const originalSwitchPageForMeta = switchPage;
window.switchPage = function(pageId) {
  originalSwitchPageForMeta(pageId);
  if (pageId !== 'productPage') resetMetaTags();
};

// Call this when products are loaded and URL has product parameter
function applyMetaFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('product');
  if (productId && allProducts.length) {
    const product = allProducts.find(p => (p.slug || p.id) == productId);
    if (product) updateMetaTags(product);
  }
}

// Add to your afterLoad function: applyMetaFromUrl();
// (or monkey-patch again)
const originalAfterLoadForMeta = afterLoad;
if (typeof afterLoad === 'function') {
  window.afterLoad = function() {
    originalAfterLoadForMeta();
    applyMetaFromUrl();
  };
}
