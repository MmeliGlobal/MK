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

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}
function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ==================== LOAD PRODUCTS ====================
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
    console.error(error);
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
      subImages: p.images ? p.images.slice(1) : [],
      slug: p.slug
    }));
    allProducts = shuffleArray(allProducts);
    afterLoad();
  }
}
function loadDemoProducts() {
  const stored = localStorage.getItem('customProducts');
  if (stored) allProducts = JSON.parse(stored);
  else allProducts = [
    { id: 1, name: "Elegant Leather Tote", desc: "Premium full-grain leather tote bag.", cat: "Fashion", subcat: "Handbags", price: 129.99, colors: ["Black","Brown"], sizeOptions: [{size:"One Size",price:129.99}], mainImage: "https://i.imgur.com/Z1aTPZl.jpeg", subImages: [], slug: "elegant-leather-tote" },
    { id: 2, name: "iPhone 16e", desc: "Latest iPhone with advanced features.", cat: "Phones", subcat: "iPhones", price: 357, colors: ["Blue","Black"], sizeOptions: [{size:"128GB",price:357}], mainImage: "https://i.imgur.com/9wBjqIU.jpeg", subImages: [], slug: "iphone-16e" }
  ];
  allProducts = shuffleArray(allProducts);
  afterLoad();
}

// ==================== SAVE PRODUCT (with slug uniqueness & variant creation) ====================
async function saveProduct(product) {
  if (!useSupabase) {
    // local save
    const index = allProducts.findIndex(p => p.id == product.id);
    if (index !== -1) allProducts[index] = product;
    else allProducts.push(product);
    localStorage.setItem('customProducts', JSON.stringify(allProducts));
    return product;
  }

  // Ensure slug is unique
  let slug = product.slug || generateSlug(product.name);
  let uniqueSlug = slug;
  let counter = 1;
  while (true) {
    const { data: existing } = await supabaseClient
      .from('products')
      .select('id')
      .eq('slug', uniqueSlug)
      .maybeSingle();
    if (!existing) break;
    uniqueSlug = `${slug}-${counter++}`;
  }
  product.slug = uniqueSlug;

  if (!product.id || product.id === 0) {
    // INSERT new product
    const { data, error } = await supabaseClient
      .from('products')
      .insert([{
        name: product.name,
        slug: product.slug,
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
    if (error) {
      console.error("Insert error:", error);
      alert("Supabase insert error: " + error.message);
      return null;
    }
    const newProduct = data[0];

    // Automatically create a default variant for this product
    const defaultSku = `${newProduct.slug}-DEFAULT`;
    const { error: variantError } = await supabaseClient
      .from('product_variants')
      .insert([{
        product_id: newProduct.id,
        sku: defaultSku,
        price: product.price,
        stock_quantity: 100
      }]);
    if (variantError) {
      console.error("Variant creation error:", variantError);
      alert("Product added but variant creation failed: " + variantError.message);
    }
    return newProduct;
  } else {
    // UPDATE existing product
    const { error } = await supabaseClient
      .from('products')
      .update({
        name: product.name,
        slug: product.slug,
        description: product.desc,
        cat: product.cat,
        subcat: product.subcat,
        price: product.price,
        colors: product.colors,
        size_options: product.sizeOptions,
        images: [product.mainImage, ...(product.subImages || [])]
      })
      .eq('id', product.id);
    if (error) {
      console.error("Update error:", error);
      alert("Supabase update error: " + error.message);
      return null;
    }
    // Also update the default variant's price if needed
    const { data: variant } = await supabaseClient
      .from('product_variants')
      .select('id')
      .eq('product_id', product.id)
      .limit(1)
      .maybeSingle();
    if (variant) {
      await supabaseClient
        .from('product_variants')
        .update({ price: product.price })
        .eq('id', variant.id);
    }
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
      updateCartCount(); renderCart();
    } else {
      loggedInUser = null;
      document.getElementById("loginBox").style.display = "block";
      document.getElementById("dashboard").style.display = "none";
      cart = [];
      updateCartCount(); renderCart();
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
    loggedInUser = null; isAdmin = false;
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
    cart = [];
    updateCartCount(); renderCart();
  }
}
async function login() {
  const name = document.getElementById("name").value, surname = document.getElementById("surname").value, phone = document.getElementById("phone").value, address = document.getElementById("address").value;
  if (!name || !surname || !phone || !address) { alert("Please fill all fields."); return; }
  if (!useSupabase) {
    loggedInUser = { name, surname, phone, address };
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("userInfo").innerText = `${name} ${surname}`;
    alert("Signed in successfully!");
    return;
  }
  const tempEmail = `${phone}@temp.mmeli.com`, tempPassword = phone;
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
  if (useSupabase) supabaseClient.auth.signOut();
  else localStorage.removeItem("user");
  loggedInUser = null; isAdmin = false; cart = [];
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount(); renderCart();
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("settingsForm").style.display = "none";
  alert("Logged out.");
  switchPage("account");
}

// ==================== CART ====================
async function loadCartFromDB() {
  if (!useSupabase || !loggedInUser) return;
  const { data: cartRecord } = await supabaseClient
    .from('carts')
    .select('id')
    .eq('user_id', loggedInUser.id)
    .maybeSingle();
  if (!cartRecord) return;
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
    updateCartCount(); renderCart();
  }
}
async function addToCartDB(product, selectedSize, selectedColor) {
  if (!useSupabase) {
    cart.push({
      id: product.id, name: product.name, size: selectedSize || "Standard", color: selectedColor || "Default",
      price: product.price, image: product.mainImage
    });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount(); renderCart(); alert("Added to cart");
    return;
  }
  if (!loggedInUser) { alert("Please sign in first."); switchPage("account"); return; }
  let variantId;
  const { data: variants } = await supabaseClient
    .from('product_variants')
    .select('id')
    .eq('product_id', product.id)
    .limit(1);
  if (variants && variants.length) variantId = variants[0].id;
  else {
    const { data: newVariant } = await supabaseClient
      .from('product_variants')
      .insert({ product_id: product.id, sku: `SKU-${product.id}`, price: product.price, stock_quantity: 999 })
      .select();
    variantId = newVariant[0].id;
  }
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
  updateCartCount(); renderCart();
  if (currentPage === "cart") renderCart();
}
function updateCartCount() { const span = document.getElementById("cartCount"); if (span) span.innerText = cart.length; }
function renderCart() {
  const container = document.getElementById("cartList");
  if (!container) return;
  if (cart.length === 0) { container.innerHTML = "<p>Your cart is empty.</p>"; return; }
  let html = "", total = 0;
  cart.forEach((item, idx) => {
    total += item.price;
    html += `<div class="cart-item"><div><img src="${item.image || 'https://via.placeholder.com/50'}" width="50" height="50" style="object-fit:cover; border-radius:8px;" loading="lazy"> ${escapeHtml(item.name)} (${escapeHtml(item.size)}, ${escapeHtml(item.color)})</div><div>$${item.price.toFixed(2)} <button style="width:auto; padding:4px 12px;" onclick="removeFromCart(${idx})">Remove</button></div></div>`;
  });
  html += `<div class="cart-item"><strong>Total:</strong> <strong>$${total.toFixed(2)}</strong></div>`;
  container.innerHTML = html;
}
async function checkout() {
  if (cart.length === 0) { alert("Cart is empty"); return; }
  if (!loggedInUser) { alert("Please sign in to place an order."); switchPage("account"); return; }
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
    if (error) { alert("Order failed: " + error.message); return; }
    const orderId = order[0].id;
    for (const item of cart) {
      await supabaseClient.from('order_items').insert({
        order_id: orderId,
        product_name: item.name,
        variant_sku: `VAR-${item.id}`,
        quantity: item.quantity || 1,
        unit_price: item.price,
        total_price: item.price * (item.quantity || 1)
      });
    }
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
  const itemsForMsg = [...cart];
  cart = [];
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount(); renderCart();
  let whatsappMsg = `I need to pay my order%0A%0AProduct Name | Color | Size | Qty | Price%0A----------------------------------------%0A`;
  itemsForMsg.forEach(item => {
    whatsappMsg += `${escapeHtml(item.name)} | ${escapeHtml(item.color)} | ${escapeHtml(item.size)} | 1 | $${item.price.toFixed(2)}%0A`;
  });
  whatsappMsg += `----------------------------------------%0ATotal: $${total.toFixed(2)}%0ATracking Code: ${trackingCode}`;
  window.open(`https://wa.me/263776871711?text=${whatsappMsg}`);
  alert(`Order placed! Tracking code: ${trackingCode}\nWhatsApp message sent to admin.`);
  switchPage("home");
}

// ==================== UI DISPLAY ====================
function displayHomeProducts(products) {
  const container = document.getElementById("productsContainer");
  if (!container) return;
  container.innerHTML = "";
  if (products.length === 0) { container.innerHTML = "<p>No products found.</p>"; return; }
  const firstBatch = products.slice(0, 8);
  renderProductBatch(firstBatch, container);
  if (products.length > 8) {
    const remaining = products.slice(8);
    let index = 0;
    function renderNextChunk() {
      const chunk = remaining.slice(index, index + 8);
      renderProductBatch(chunk, container);
      index += 8;
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
    card.innerHTML = `<img src="${imgUrl}" alt="${product.name}" loading="lazy" decoding="async" fetchpriority="low" class="loading"><div class="product-info"><div class="product-name">${escapeHtml(product.name)}</div><div class="product-price">$${product.price}</div></div>`;
    container.appendChild(card);
    const img = card.querySelector('img');
    img.onload = () => img.classList.remove('loading');
    img.onerror = () => img.classList.remove('loading');
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
  if (colorSelect) {
    colorSelect.innerHTML = "";
    product.colors.forEach(color => { colorSelect.innerHTML += `<option value="${escapeHtml(color)}">${escapeHtml(color)}</option>`; });
  }
  const subContainer = document.getElementById("subImages");
  if (subContainer) {
    subContainer.innerHTML = "";
    const allImages = [product.mainImage, ...(product.subImages || [])];
    allImages.forEach((img, idx) => {
      if (img && img.trim()) {
        const imgEl = document.createElement("img");
        imgEl.src = img; imgEl.loading = "lazy"; imgEl.decoding = "async";
        imgEl.onclick = () => changeMainImage(img, imgEl);
        if (idx === 0) imgEl.classList.add("active");
        subContainer.appendChild(imgEl);
      }
    });
  }
  const sizeSelect = document.getElementById("sizeSelect");
  if (sizeSelect) {
    sizeSelect.innerHTML = "";
    product.sizeOptions.forEach(s => { sizeSelect.innerHTML += `<option value="${s.price}">${escapeHtml(s.size)} - $${s.price}</option>`; });
    sizeSelect.onchange = () => { document.getElementById("pPrice").innerText = `$${sizeSelect.value}`; };
  }
  loadRecommendations("product");
  switchPage("productPage");
  updateProductURLAndMeta(product);
}
function changeMainImage(src, el) { document.getElementById("mainImage").src = src; document.querySelectorAll(".sub-images img").forEach(i => i.classList.remove("active")); el.classList.add("active"); }
function downloadImage() { const imgUrl = document.getElementById("mainImage").src; if (!imgUrl) return; const a = document.createElement('a'); a.href = imgUrl; a.download = 'product-image.jpg'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }

// ==================== FILTERS & MENU ====================
function populateFilters() {
  const categorySelect = document.getElementById("categoryFilter");
  const categories = Object.keys(categoryHierarchy);
  categorySelect.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => { categorySelect.innerHTML += `<option value="${cat}">${topLevelNames[cat] || cat}</option>`; });
}
function filterProducts() {
  const category = document.getElementById("categoryFilter").value, subcategory = document.getElementById("subcategoryFilter").value;
  const minPrice = parseFloat(document.getElementById("minPrice").value) || 0, maxPrice = parseFloat(document.getElementById("maxPrice").value) || Infinity;
  let filtered = [...allProducts];
  if (category !== "all") {
    filtered = filtered.filter(p => p.cat === category);
    const subSelect = document.getElementById("subcategoryFilter");
    const subcats = [];
    const subcatsObj = categoryHierarchy[category];
    if (subcatsObj) Object.keys(subcatsObj).forEach(sub => { subcatsObj[sub].forEach(leaf => subcats.push(leaf)); });
    subSelect.innerHTML = '<option value="all">All Subcategories</option>';
    subcats.forEach(sub => { subSelect.innerHTML += `<option value="${sub}">${sub}</option>`; });
    if (subcategory !== "all") filtered = filtered.filter(p => p.subcat === subcategory);
  } else document.getElementById("subcategoryFilter").innerHTML = '<option value="all">All Subcategories</option>';
  filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);
  filtered = shuffleArray(filtered);
  displayHomeProducts(filtered);
}
function resetFilters() { document.getElementById("categoryFilter").value = "all"; document.getElementById("subcategoryFilter").innerHTML = '<option value="all">All Subcategories</option>'; document.getElementById("minPrice").value = ""; document.getElementById("maxPrice").value = ""; filterProducts(); }
function loadMenu() {
  const menuDiv = document.getElementById("mainMenu"); if (!menuDiv) return;
  menuDiv.innerHTML = "";
  const categories = Object.keys(categoryHierarchy);
  categories.forEach(cat => { const shortName = topLevelNames[cat] || cat; menuDiv.innerHTML += `<div onclick="selectMainCategory('${cat}')">${shortName}</div>`; });
}
function selectMainCategory(category) {
  lastClickedMainCat = category;
  const subMenuDiv = document.getElementById("subMenu"); if (!subMenuDiv) return;
  subMenuDiv.innerHTML = "";
  const subcats = categoryHierarchy[category];
  if (subcats) Object.keys(subcats).forEach(sub => { const iconUrl = subcategoryIcons[sub] || defaultIcon; subMenuDiv.innerHTML += `<div onclick="selectSubCategory('${sub}')"><img src="${iconUrl}" style="width:32px; height:32px;" alt="${sub}"></div>`; });
}
function selectSubCategory(sub) {
  const mainCat = lastClickedMainCat, leaves = categoryHierarchy[mainCat][sub];
  if (leaves) { let filtered = allProducts.filter(p => leaves.includes(p.subcat)); filtered = shuffleArray(filtered); displayHomeProducts(filtered); switchPage("home"); }
}
function switchPage(pageId) {
  if (currentPage === pageId) return;
  currentPage = pageId;
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const activePage = document.getElementById(pageId);
  if (activePage) activePage.classList.add("active");
  if (pageId === "home") { if (lastClickedMainCat) selectMainCategory(lastClickedMainCat); else filterProducts(); document.getElementById("subMenu").innerHTML = ""; resetMetaTags(); }
  else if (pageId === "cart") { renderCart(); loadRecommendations("cart"); }
  else if (pageId === "tracking") { initMap(); loadRecommendations("tracking"); }
  else if (pageId === "chat") loadRecommendations("chat");
  else if (pageId === "promo") loadRecommendations("promo");
  else if (pageId === "account") loadRecommendations("account");
  else if (pageId === "adminDashboard") { if (document.getElementById("adminPanel").style.display !== "block") { document.getElementById("adminLogin").style.display = "block"; document.getElementById("adminPanel").style.display = "none"; } }
  else if (pageId === "adminOrdersPage") loadOrdersFull();
  else if (pageId === "adminProductsPage") loadProductsFull();
  else if (pageId === "adminQuotesPage") setupQuotationForm();
  else if (pageId === "adminShippingPage") loadShipments();
  else if (pageId === "productPage") addShareButton();
}
function resetHome() { lastClickedMainCat = ""; document.getElementById("subMenu").innerHTML = ""; filterProducts(); switchPage("home"); }
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
  if (currentProduct) recs = recs.filter(p => p.id !== currentProduct.id);
  recs = recs.slice(0, 4);
  container.innerHTML = "<h4>You may also like</h4><div class='recommend-grid'></div>";
  const grid = container.querySelector(".recommend-grid");
  recs.forEach(prod => { const card = document.createElement("div"); card.className = "recommend-card"; card.onclick = () => openProduct(prod); card.innerHTML = `<img src="${prod.mainImage}" alt="${escapeHtml(prod.name)}" loading="lazy" decoding="async"><p>${escapeHtml(prod.name)}<br><strong>$${prod.price}</strong></p>`; grid.appendChild(card); });
}
function searchProducts() {
  const term = document.getElementById("searchInput").value.toLowerCase().trim();
  if (term === "") { filterProducts(); return; }
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term) || (p.desc && p.desc.toLowerCase().includes(term)));
  displayHomeProducts(filtered);
  switchPage("home");
}
document.getElementById("scanInput")?.addEventListener("change", () => { alert("Scanning product... (demo)"); filterProducts(); switchPage("home"); });
function initMap() { const mapElement = document.getElementById("map"); if (!mapElement || typeof L === 'undefined') return; const map = L.map(mapElement).setView([-17,30],5); L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map); L.marker([-17,30]).addTo(map).bindPopup('Mmeli Global<br>Your location.').openPopup(); }
function trackNow() { const code = document.getElementById("trackCode").value.trim(), last4 = document.getElementById("phoneLast4").value.trim(); if (!code || !last4) { alert("Please enter tracking code and last 4 digits of phone."); return; } let ordersArray = []; if (useSupabase) { alert("Tracking from Supabase: please implement order fetch or use demo orders."); return; } else ordersArray = JSON.parse(localStorage.getItem('orders') || '[]'); const order = ordersArray.find(o => o.trackingCode === code && o.user.phone.endsWith(last4)); if (!order) { document.getElementById("shipmentHistory").innerHTML = "<p>No order found with that tracking code and phone.</p>"; return; } let history = `<strong>Tracking for ${escapeHtml(code)}</strong><br>Status: ${order.status}<br>Items: ${order.items.map(i=>i.name).join(", ")}<br>Total: $${order.total}<br>Date: ${new Date(order.date).toLocaleString()}<br>`; if (order.status === "Processing") history += "Your order is being prepared."; else if (order.status === "Shipped") history += "Your order is on the way!"; else if (order.status === "Delivered") history += "Delivered. Enjoy!"; document.getElementById("shipmentHistory").innerHTML = history; }
function sendMsg(msg) { window.open(`https://wa.me/263776871711?text=${encodeURIComponent(msg)}`); }
function loadPromos() { const promoDiv = document.getElementById("promoList"); if (promoDiv) promoDiv.innerHTML = "<h3>🔥 Limited Time: 20% off all handbags! Use code MMELI20 🔥</h3>"; }

// ==================== ACCOUNT FUNCTIONS ====================
function viewMyQuotations() { if (!loggedInUser) { alert("Please sign in first."); return; } let quotes = JSON.parse(localStorage.getItem('quotations') || '[]'); const myQuotes = quotes.filter(q => q.clientPhone === (loggedInUser.phone || loggedInUser.user_metadata?.phone)); const container = document.getElementById("quotationsList"); if (myQuotes.length === 0) container.innerHTML = "<p>No quotations found.</p>"; else container.innerHTML = myQuotes.map(q => `<div style="border:1px solid #ddd; padding:12px; margin-bottom:12px; border-radius:12px;"><strong>Quote #${escapeHtml(q.quoteNumber)}</strong><br><strong>Date:</strong> ${new Date(q.issueDate).toLocaleDateString()}<br><strong>Total:</strong> $${q.total}<br><button onclick="viewQuote('${q.id}')"><i class="fas fa-file-pdf"></i> View Quote</button></div>`).join(''); document.getElementById("myQuotations").style.display = "block"; document.getElementById("myOrders").style.display = "none"; document.getElementById("settingsForm").style.display = "none"; document.getElementById("loginBox").style.display = "none"; document.getElementById("dashboard").style.display = "none"; }
function viewMyOrders() { if (!loggedInUser) { alert("Please sign in first."); return; } let ordersArray = JSON.parse(localStorage.getItem('orders') || '[]'); const myOrders = ordersArray.filter(o => o.user.phone === (loggedInUser.phone || loggedInUser.user_metadata?.phone)); const container = document.getElementById("ordersList"); if (myOrders.length === 0) container.innerHTML = "<p>No orders found.</p>"; else container.innerHTML = myOrders.map(o => `<div style="border:1px solid #ddd; padding:12px; margin-bottom:12px; border-radius:12px;"><strong>Order #:</strong> ${escapeHtml(o.trackingCode)}<br><strong>Date:</strong> ${new Date(o.date).toLocaleString()}<br><strong>Status:</strong> ${escapeHtml(o.status)}<br><strong>Total:</strong> $${o.total}<br><button onclick="reorder('${o.trackingCode}')"><i class="fas fa-redo"></i> Reorder</button></div>`).join(''); document.getElementById("myOrders").style.display = "block"; document.getElementById("myQuotations").style.display = "none"; document.getElementById("settingsForm").style.display = "none"; document.getElementById("loginBox").style.display = "none"; document.getElementById("dashboard").style.display = "none"; }
function reorder(trackingCode) { let ordersArray = JSON.parse(localStorage.getItem('orders') || '[]'); const order = ordersArray.find(o => o.trackingCode === trackingCode); if (order) { cart = [...order.items]; localStorage.setItem('cart', JSON.stringify(cart)); updateCartCount(); alert("Items added to cart. Go to cart to checkout."); switchPage("cart"); } }
function showSettings() { if (!loggedInUser) return; const userData = loggedInUser.user_metadata || loggedInUser; document.getElementById("editName").value = userData.full_name?.split(' ')[0] || ""; document.getElementById("editSurname").value = userData.full_name?.split(' ')[1] || ""; document.getElementById("editPhone").value = userData.phone || ""; document.getElementById("editAddress").value = userData.address || ""; document.getElementById("settingsForm").style.display = "block"; document.getElementById("myQuotations").style.display = "none"; document.getElementById("myOrders").style.display = "none"; document.getElementById("loginBox").style.display = "none"; document.getElementById("dashboard").style.display = "none"; }
function saveProfile() { const newName = document.getElementById("editName").value, newSurname = document.getElementById("editSurname").value, newPhone = document.getElementById("editPhone").value, newAddress = document.getElementById("editAddress").value; if (useSupabase && loggedInUser) { supabaseClient.auth.updateUser({ data: { full_name: `${newName} ${newSurname}`, phone: newPhone, address: newAddress } }).then(() => { alert("Profile updated."); closeSettings(); checkUser(); }); } else { if (loggedInUser) { loggedInUser.name = newName; loggedInUser.surname = newSurname; loggedInUser.phone = newPhone; loggedInUser.address = newAddress; localStorage.setItem("user", JSON.stringify(loggedInUser)); } alert("Profile updated."); closeSettings(); checkUser(); } }
function closeSettings() { document.getElementById("settingsForm").style.display = "none"; document.getElementById("loginBox").style.display = "block"; document.getElementById("dashboard").style.display = "block"; }
function closeQuotations() { document.getElementById("myQuotations").style.display = "none"; document.getElementById("loginBox").style.display = "block"; document.getElementById("dashboard").style.display = "block"; }
function closeOrders() { document.getElementById("myOrders").style.display = "none"; document.getElementById("loginBox").style.display = "block"; document.getElementById("dashboard").style.display = "block"; }

// ==================== ADMIN FUNCTIONS ====================
function adminLogin() { const user = document.getElementById("adminUser").value, pass = document.getElementById("adminPass").value; if (user === "admin" && pass === "admin123") { document.getElementById("adminLogin").style.display = "none"; document.getElementById("adminPanel").style.display = "block"; loadAdminSummaries(); } else alert("Invalid admin credentials"); }
let adminOrdersLoaded = false, adminProductsLoaded = false;
function loadAdminSummaries() { if (useSupabase) supabaseClient.from('orders').select('*', { count: 'exact', head: true }).then(({ count }) => { document.getElementById("adminOrdersSummary").innerHTML = `<i class="fas fa-box"></i> ${count || 0} orders`; }); else { let ordersArray = JSON.parse(localStorage.getItem('orders') || '[]'); document.getElementById("adminOrdersSummary").innerHTML = `<i class="fas fa-box"></i> ${ordersArray.length} orders`; } document.getElementById("adminProductsSummary").innerHTML = `<i class="fas fa-tags"></i> ${allProducts.length} products`; if (!adminOrdersLoaded) loadOrdersFull(); if (!adminProductsLoaded) loadProductsFull(); adminOrdersLoaded = true; adminProductsLoaded = true; }
function loadOrdersFull() { const container = document.getElementById("adminOrdersFull"); if (!container) return; if (useSupabase) { supabaseClient.from('orders').select('*, profiles(full_name)').then(({ data, error }) => { if (error) { container.innerHTML = "<p>Error loading orders.</p>"; return; } container.innerHTML = data.length ? data.map(o => `<div style="border-bottom:1px solid #ccc; margin-bottom:8px; padding:8px;"><strong><i class="fas fa-receipt"></i> ${escapeHtml(o.order_number || o.id)}</strong> - ${o.status}<br><i class="fas fa-user"></i> User: ${o.profiles?.full_name || 'Guest'}<br><i class="fas fa-dollar-sign"></i> Total: $${o.total_amount}<br><button onclick="updateOrderStatus('${o.id}')" style="background:#28a745; color:white;"><i class="fas fa-shipping-fast"></i> Mark as Shipped</button></div>`).join('') : "<p>No orders yet.</p>"; }); } else { let ordersArray = JSON.parse(localStorage.getItem('orders') || '[]'); container.innerHTML = ordersArray.length ? ordersArray.map(o => `<div style="border-bottom:1px solid #ccc; margin-bottom:8px; padding:8px;"><strong><i class="fas fa-receipt"></i> ${escapeHtml(o.trackingCode)}</strong> - ${o.status}<br><i class="fas fa-user"></i> User: ${escapeHtml(o.user.name)} ${escapeHtml(o.user.surname)}<br><i class="fas fa-dollar-sign"></i> Total: $${o.total}<br><button onclick="updateOrderStatus('${o.trackingCode}')" style="background:#28a745;"><i class="fas fa-shipping-fast"></i> Mark as Shipped</button></div>`).join('') : "<p>No orders yet.</p>"; } }
function updateOrderStatus(idOrCode) { if (useSupabase) { supabaseClient.from('orders').update({ status: 'shipped' }).eq('id', idOrCode).then(() => { alert("Order marked as shipped."); loadOrdersFull(); }); } else { let ordersArray = JSON.parse(localStorage.getItem('orders') || '[]'); const order = ordersArray.find(o => o.trackingCode === idOrCode); if (order) { order.status = "Shipped"; localStorage.setItem('orders', JSON.stringify(ordersArray)); loadOrdersFull(); alert(`Order ${idOrCode} marked as shipped.`); } } }
function loadProductsFull() { const container = document.getElementById("adminProductsFull"); if (!container) return; if (allProducts.length === 0) { container.innerHTML = "<p>No products. Click 'Add New Product' to create one.</p>"; return; } container.innerHTML = allProducts.map(p => `<div style="border-bottom:1px solid #ccc; margin-bottom:8px; padding:8px;"><strong><i class="fas fa-cube"></i> ${escapeHtml(p.name)}</strong> - $${p.price}<br><i class="fas fa-folder"></i> ${p.cat} / ${p.subcat}<br><button onclick="editProduct(${p.id})" style="background:#ffc107; color:#000;"><i class="fas fa-edit"></i> Edit</button> <button onclick="deleteProduct(${p.id})" style="background:#dc3545; color:white;"><i class="fas fa-trash"></i> Delete</button></div>`).join(''); }
async function addProduct() {
  const name = document.getElementById("newName").value.trim();
  const price = parseFloat(document.getElementById("newPrice").value);
  const image = document.getElementById("newImage").value.trim();
  const extraImages = document.getElementById("newExtraImages").value.trim();
  const desc = document.getElementById("newDesc").value.trim();
  const category = document.getElementById("newCategory").value.trim();
  const subcategory = document.getElementById("newSubcategory").value.trim();
  const colorInput = document.getElementById("newColor").value.trim();
  const sizeInput = document.getElementById("newSize").value.trim();

  if (!name || isNaN(price) || !image || !category || !subcategory) {
    alert("Please fill required fields: Name, Price, Main Image, Category, Subcategory.");
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

  let colors = colorInput ? colorInput.split(',').map(c => c.trim()) : ["Default"];
  let subImages = extraImages ? extraImages.split(',').map(url => url.trim()).filter(u => u) : [];

  const newProduct = {
    name: name,
    slug: generateSlug(name),
    desc: desc || "",
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
    alert("Product added successfully!");
    clearProductForm();
    switchPage("adminDashboard");
  } else {
    alert("Failed to add product. Check the browser console (F12) for the detailed error.");
  }
}
async function editProduct(id) { const product = allProducts.find(p => p.id == id); if (!product) return; editProductId = id; document.getElementById("newName").value = product.name; document.getElementById("newPrice").value = product.price; document.getElementById("newImage").value = product.mainImage; document.getElementById("newExtraImages").value = (product.subImages || []).join(", "); document.getElementById("newDesc").value = product.desc; document.getElementById("newCategory").value = product.cat; document.getElementById("newSubcategory").value = product.subcat; document.getElementById("newColor").value = product.colors.join(", "); const sizeString = product.sizeOptions.map(s => `${s.size}:${s.price}`).join(", "); document.getElementById("newSize").value = sizeString; const addBtn = document.querySelector("#adminAddProductPage button"); addBtn.innerHTML = '<i class="fas fa-save"></i> Update Product'; addBtn.onclick = () => updateProduct(); switchPage("adminAddProductPage"); }
async function updateProduct() {
  if (!editProductId) { alert("No product selected for update."); return; }
  const name = document.getElementById("newName").value.trim();
  const price = parseFloat(document.getElementById("newPrice").value);
  const image = document.getElementById("newImage").value.trim();
  const extraImages = document.getElementById("newExtraImages").value.trim();
  const desc = document.getElementById("newDesc").value.trim();
  const category = document.getElementById("newCategory").value.trim();
  const subcategory = document.getElementById("newSubcategory").value.trim();
  const colorInput = document.getElementById("newColor").value.trim();
  const sizeInput = document.getElementById("newSize").value.trim();
  if (!name || isNaN(price) || !image || !category || !subcategory) { alert("Please fill required fields."); return; }
  let sizeOptions = []; if (sizeInput) { const pairs = sizeInput.split(','); pairs.forEach(pair => { const [size, p] = pair.split(':'); if (size && p) sizeOptions.push({ size: size.trim(), price: parseFloat(p) }); }); } if (sizeOptions.length === 0) sizeOptions.push({ size: "Standard", price: price });
  let colors = colorInput ? colorInput.split(',').map(c => c.trim()) : ["Default"];
  let subImages = extraImages ? extraImages.split(',').map(url => url.trim()).filter(u => u) : [];
  const updatedProduct = {
    id: editProductId,
    name: name,
    slug: generateSlug(name),
    desc: desc || "",
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
    alert("Product updated successfully!");
    clearProductForm();
    switchPage("adminDashboard");
  } else { alert("Update failed."); }
}
async function deleteProduct(id) { if (confirm("Are you sure you want to delete this product?")) { const success = await deleteProductFromDB(id); if (success) { allProducts = allProducts.filter(p => p.id != id); allProducts = shuffleArray(allProducts); displayHomeProducts(allProducts); loadAdminSummaries(); loadProductsFull(); alert("Product deleted."); } else alert("Delete failed."); } }
function saveSettings() { const siteName = document.getElementById("siteName").value, contactPhone = document.getElementById("contactPhone").value; localStorage.setItem('siteName', siteName); localStorage.setItem('contactPhone', contactPhone); document.querySelector(".logo-text").innerText = siteName; alert("Settings saved."); switchPage("adminDashboard"); }
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
  const addBtn = document.querySelector("#adminAddProductPage button");
  addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
  addBtn.onclick = () => addProduct();
  editProductId = null;
}

// ==================== QUOTATION FUNCTIONS ====================
function setupQuotationForm() { /* unchanged from original – keep your existing code */ }
function addItemRow() { /* unchanged */ }
function calculateQuoteTotals() { /* unchanged */ }
function generateQuote() { /* unchanged */ }
function viewQuote(quoteId) { /* unchanged */ }
function closeQuoteModal() { /* unchanged */ }
function printQuote() { /* unchanged */ }

// ==================== SHIPPING FUNCTIONS ====================
function saveShipment() { /* unchanged – keep your existing code */ }
function clearShippingForm() { /* unchanged */ }
function loadShipments() { /* unchanged */ }
function markAsPaid(trackingCode) { /* unchanged */ }
function markAsShippedShipment(trackingCode) { /* unchanged */ }

// ==================== PRODUCT SHARING & META TAGS ====================
function addShareButton() { const productActions = document.querySelector('.product-actions'); if (productActions && !document.getElementById('shareProductBtn')) { const shareBtn = document.createElement('button'); shareBtn.id = 'shareProductBtn'; shareBtn.className = 'download-btn-transparent'; shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>'; shareBtn.title = 'Share product'; shareBtn.style.fontSize = '24px'; shareBtn.style.cursor = 'pointer'; shareBtn.onclick = shareProduct; productActions.appendChild(shareBtn); } }
function shareProduct() { if (!currentProduct) return; const productId = currentProduct.slug || currentProduct.id; const shareUrl = `https://proljdccjrifqgbmsyco.supabase.co/functions/v1/smooth-processor?p=${encodeURIComponent(productId)}`; if (navigator.share) navigator.share({ title: currentProduct.name, url: shareUrl }); else { navigator.clipboard.writeText(shareUrl); alert("Product link copied to clipboard!\nShare it on WhatsApp, etc."); } }
function updateProductURLAndMeta(product) { if (!product) return; const slug = product.slug || product.id; const newUrl = `${window.location.pathname}?product=${encodeURIComponent(slug)}`; window.history.pushState({ product: slug }, '', newUrl); let metaTitle = document.querySelector('meta[property="og:title"]'), metaDesc = document.querySelector('meta[property="og:description"]'), metaImage = document.querySelector('meta[property="og:image"]'), metaUrl = document.querySelector('meta[property="og:url"]'); if (!metaTitle) { metaTitle = document.createElement('meta'); metaTitle.setAttribute('property', 'og:title'); document.head.appendChild(metaTitle); } if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.setAttribute('property', 'og:description'); document.head.appendChild(metaDesc); } if (!metaImage) { metaImage = document.createElement('meta'); metaImage.setAttribute('property', 'og:image'); document.head.appendChild(metaImage); } if (!metaUrl) { metaUrl = document.createElement('meta'); metaUrl.setAttribute('property', 'og:url'); document.head.appendChild(metaUrl); } metaTitle.setAttribute('content', product.name + ' | Mmeli Global'); metaDesc.setAttribute('content', (product.desc || '').substring(0,200)); metaImage.setAttribute('content', product.mainImage); metaUrl.setAttribute('content', window.location.href); document.title = product.name + ' | Mmeli Global'; }
function resetMetaTags() { let metaTitle = document.querySelector('meta[property="og:title"]'), metaDesc = document.querySelector('meta[property="og:description"]'), metaImage = document.querySelector('meta[property="og:image"]'); if (metaTitle) metaTitle.setAttribute('content', 'Mmeli Global | Premium Products'); if (metaDesc) metaDesc.setAttribute('content', 'Shop premium products, track shipments, get quotations, and manage your account at Mmeli Global.'); if (metaImage) metaImage.setAttribute('content', 'https://mmeliglobal.com/socialmedia.PNG'); document.title = 'Mmeli Global | Premium Products'; }
function checkUrlForProduct() { if (!allProducts.length) return; const params = new URLSearchParams(window.location.search); const productId = params.get('product'); if (productId) { const product = allProducts.find(p => (p.slug || p.id) == productId); if (product) openProduct(product); } }

// ==================== ADMIN ACCESS ====================
document.getElementById("adminEntry")?.addEventListener("click", () => { switchPage("adminDashboard"); });
document.getElementById("logoArea")?.addEventListener("dblclick", () => { switchPage("adminDashboard"); });

// ==================== AFTER LOAD & INIT ====================
function afterLoad() { populateFilters(); displayHomeProducts(allProducts); loadMenu(); checkUser(); loadPromos(); updateCartCount(); renderCart(); checkUrlForProduct(); addShareButton(); }
function initApp() { loadProducts(); updateCartCount(); renderCart(); const savedSiteName = localStorage.getItem('siteName'); if (savedSiteName) document.querySelector(".logo-text").innerText = savedSiteName; }
window.onload = () => { loadSupabase(); };
