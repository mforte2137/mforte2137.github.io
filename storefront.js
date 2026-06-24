/* ═══════════════════════════════════════════════════════════════════
   SALESBUILDR STOREFRONT — storefront.js
   Simulated storefront — no real payment/API integration
   AI assistant powered by Anthropic API (claude-sonnet-4-6)
═══════════════════════════════════════════════════════════════════ */

// ── DOM REFS ─────────────────────────────────────────────────────
const productGrid       = document.getElementById('productGrid');
const cartBtn           = document.getElementById('cartBtn');
const cartCount         = document.getElementById('cartCount');
const cartDrawer        = document.getElementById('cartDrawer');
const cartOverlay       = document.getElementById('cartOverlay');
const cartClose         = document.getElementById('cartClose');
const cartItems         = document.getElementById('cartItems');
const cartEmpty         = document.getElementById('cartEmpty');
const cartFooter        = document.getElementById('cartFooter');
const cartSubtotal      = document.getElementById('cartSubtotal');
const cartShipping      = document.getElementById('cartShipping');
const cartTax           = document.getElementById('cartTax');
const cartTotal         = document.getElementById('cartTotal');
const shippingSelect    = document.getElementById('shippingSelect');
const checkoutBtn       = document.getElementById('checkoutBtn');
const saveBasketBtn     = document.getElementById('saveBasketBtn');
const cartEmptyShop     = document.getElementById('cartEmptyShop');
const resultCount       = document.getElementById('resultCount');
const activeFiltersEl   = document.getElementById('activeFilters');
const sortSelect        = document.getElementById('sortSelect');
const filterReset       = document.getElementById('filterReset');
const compareBtn        = document.getElementById('compareBtn');
const compareSummary    = document.getElementById('compareSummary');
const aiToggleBtn       = document.getElementById('aiToggleBtn');
const heroAiBtn         = document.getElementById('heroAiBtn');
const heroBundlesBtn    = document.getElementById('heroBundlesBtn');
const aiPanel           = document.getElementById('aiPanel');
const aiOverlay         = document.getElementById('aiOverlay');
const aiClose           = document.getElementById('aiClose');
const aiChat            = document.getElementById('aiChat');
const aiInput           = document.getElementById('aiInput');
const aiSendBtn         = document.getElementById('aiSendBtn');
const aiQuickPrompts    = document.getElementById('aiQuickPrompts');
const aiResultBanner    = document.getElementById('aiResultBanner');
const aiResultTitle     = document.getElementById('aiResultTitle');
const aiResultSub       = document.getElementById('aiResultSub');
const aiBannerClear     = document.getElementById('aiBannerClear');
const quotesList        = document.getElementById('quotesList');
const productModalBackdrop  = document.getElementById('productModalBackdrop');
const productModalBody      = document.getElementById('productModalBody');
const productModalClose     = document.getElementById('productModalClose');
const compareModalBackdrop  = document.getElementById('compareModalBackdrop');
const compareTableWrap      = document.getElementById('compareTableWrap');
const compareModalClose     = document.getElementById('compareModalClose');
const orderModalBackdrop    = document.getElementById('orderModalBackdrop');
const orderRef              = document.getElementById('orderRef');
const orderModalClose       = document.getElementById('orderModalClose');
const savedBasketsBtn       = document.getElementById('savedBasketsBtn');
const savedDrawer           = document.getElementById('savedDrawer');
const savedOverlay          = document.getElementById('savedOverlay');
const savedClose            = document.getElementById('savedClose');
const savedBasketsList      = document.getElementById('savedBasketsList');
const savedEmpty            = document.getElementById('savedEmpty');
const savedCountBadge       = document.getElementById('savedCountBadge');
const ordersList            = document.getElementById('ordersList');
const productSearchInput    = document.getElementById('productSearch');
const productSearchClear    = document.getElementById('productSearchClear');
const payModalBackdrop      = document.getElementById('payModalBackdrop');
const payModalClose         = document.getElementById('payModalClose');
const payModalTotal         = document.getElementById('payModalTotal');
const payForm               = document.getElementById('payForm');
const payProcessing         = document.getElementById('payProcessing');
const payCardNum            = document.getElementById('payCardNum');
const payExpiry             = document.getElementById('payExpiry');
const payCvv                = document.getElementById('payCvv');
const payName               = document.getElementById('payName');
const payZip                = document.getElementById('payZip');
const payCardType           = document.getElementById('payCardType');
const payError              = document.getElementById('payError');
const paySubmitBtn          = document.getElementById('paySubmitBtn');
const payBtnAmount          = document.getElementById('payBtnAmount');
const toast                 = document.getElementById('toast');
const cartSnackbar          = document.getElementById('cartSnackbar');
const snackbarName          = document.getElementById('snackbarName');
const snackbarDismiss       = document.getElementById('snackbarDismiss');
const snackbarShop          = document.getElementById('snackbarShop');
const snackbarCart          = document.getElementById('snackbarCart');
const drawerAddressSection  = document.getElementById('drawerAddressSection');
const shipToItemList        = document.getElementById('shipToItemList');
const billingEditBtn        = document.getElementById('billingEditBtn');
const billingDisplay        = document.getElementById('billingDisplay');
const billingForm           = document.getElementById('billingForm');
const applyAllShipBtn       = document.getElementById('applyAllShipBtn');
const endUserItemList       = document.getElementById('endUserItemList');

// ── STATE ─────────────────────────────────────────────────────────
let cart          = [];
let compareList   = [];
let activeFilters = { category: 'all', cpu: 'all', ram: 'all' };
let sortBy        = 'featured';
let priceMin      = null;
let priceMax      = null;
let aiFilteredIds = null;   // null = show all, array = AI filtered
let currentQuoteTab = 'pending';
let aiConversation  = [];   // conversation history for multi-turn

// Ship-to destinations per cart item: { [cartItemId]: 'msp'|'branch-X'|'custom' }
let shipDestinations = {};
// Custom address per cart item
let customAddresses  = {};
// End-user info per cart item: { [id]: { name, email, notes } }
let endUserData = {};

const SHIPPING_COSTS = { standard: 12, express: 28, overnight: 55 };

// Saved baskets: array of { id, name, items, total, date }
let savedBaskets = [];
let productSearchQuery = '';

// ── ORDER HISTORY DATA ────────────────────────────────────────────
const ORDER_HISTORY = [
  {
    ref: 'ORD-2025-0112', status: 'processing',
    date: 'Ordered 20 Jun 2025', total: '$3,248.00',
    shipped: 'MSP staging → Acme Corp HQ',
    po: 'PO-2025-0091',
    tracking: null,
    eta: 'Expected 26–28 Jun 2025',
    note: 'Imaging and Intune enrolment in progress at MSP.',
    items: [
      { qty: 2, name: 'Dell Latitude 5550', price: '$1,049.00 each', img: 'https://mforte2137.github.io/images/store/laptop-lat-5550.png' },
      { qty: 2, name: 'Dell Thunderbolt Dock WD19TBS', price: '$289.00 each', img: 'https://mforte2137.github.io/images/store/dock-wd19tbs.png' },
      { qty: 2, name: 'Dell Premier Backpack 15', price: '$89.00 each', img: 'https://mforte2137.github.io/images/store/bag-premier.png' },
    ]
  },
  {
    ref: 'ORD-2025-0108', status: 'ready',
    date: 'Ordered 17 Jun 2025', total: '$1,699.00',
    shipped: 'James Taylor, 88 Franklin Street, New York, NY 10013',
    po: 'PO-2025-0088',
    tracking: 'UPS: 1Z999AA10123456784',
    eta: 'Out for delivery 24 Jun 2025',
    note: 'Dispatched from MSP. Direct delivery to employee home address.',
    items: [
      { qty: 1, name: 'Remote Worker Bundle', price: '$1,699.00', img: 'https://mforte2137.github.io/images/store/bundle-remote.png' },
    ]
  },
  {
    ref: 'ORD-2025-0101', status: 'ready',
    date: 'Ordered 12 Jun 2025', total: '$638.00',
    shipped: 'Chicago Office, 330 N Wabash Ave, Chicago, IL 60611',
    po: null,
    tracking: 'FedEx: 7489 2362 8741',
    eta: 'Expected 25 Jun 2025',
    note: null,
    items: [
      { qty: 1, name: 'Dell P2725H 27" Monitor', price: '$319.00', img: 'https://mforte2137.github.io/images/store/monitor-p2725h.png' },
      { qty: 1, name: 'Dell Thunderbolt Dock WD19TBS', price: '$289.00', img: 'https://mforte2137.github.io/images/store/dock-wd19tbs.png' },
      { qty: 1, name: 'Dell Premier Mouse MS5120W', price: '$59.00', img: 'https://mforte2137.github.io/images/store/mouse-ms5120w.png' },
    ]
  },
  {
    ref: 'ORD-2025-0089', status: 'fulfilled',
    date: 'Delivered 3 Jun 2025', total: '$2,549.00',
    shipped: 'Acme Corp HQ, 142 West 36th Street, New York, NY 10018',
    po: 'PO-2025-0079',
    tracking: 'UPS: 1Z999AA10187654321',
    eta: null,
    note: null,
    items: [
      { qty: 1, name: 'Executive Bundle', price: '$2,549.00', img: 'https://mforte2137.github.io/images/store/bundle-exec.png' },
    ]
  },
  {
    ref: 'ORD-2025-0074', status: 'fulfilled',
    date: 'Delivered 19 May 2025', total: '$5,452.00',
    shipped: 'MSP staging → Acme Corp HQ',
    po: 'PO-2025-0068',
    tracking: 'FedEx: 6194 8201 3374',
    eta: null,
    note: null,
    items: [
      { qty: 4, name: 'Dell Latitude 5450', price: '$969.00 each', img: 'https://mforte2137.github.io/images/store/laptop-lat-5450.png' },
      { qty: 4, name: 'Dell Premier Backpack 15', price: '$89.00 each', img: 'https://mforte2137.github.io/images/store/bag-premier.png' },
    ]
  },
  {
    ref: 'ORD-2025-0061', status: 'fulfilled',
    date: 'Delivered 8 May 2025', total: '$1,699.00',
    shipped: 'Sarah Chen, 45 Pine Street, Brooklyn, NY 11201',
    po: 'PO-2025-0055',
    tracking: 'UPS: 1Z999AA10156781234',
    eta: null,
    note: null,
    items: [
      { qty: 1, name: 'Remote Worker Bundle', price: '$1,699.00', img: 'https://mforte2137.github.io/images/store/bundle-remote.png' },
    ]
  },
  {
    ref: 'ORD-2025-0049', status: 'fulfilled',
    date: 'Delivered 22 Apr 2025', total: '$638.00',
    shipped: 'Chicago Office, 330 N Wabash Ave, Chicago, IL 60611',
    po: null,
    tracking: 'FedEx: 7489 1122 3344',
    eta: null,
    note: null,
    items: [
      { qty: 1, name: 'Dell P2725H 27" Monitor', price: '$319.00', img: 'https://mforte2137.github.io/images/store/monitor-p2725h.png' },
      { qty: 1, name: 'Dell Thunderbolt Dock WD19TBS', price: '$289.00', img: 'https://mforte2137.github.io/images/store/dock-wd19tbs.png' },
      { qty: 1, name: 'Dell Premier Mouse MS5120W', price: '$59.00', img: 'https://mforte2137.github.io/images/store/mouse-ms5120w.png' },
    ]
  },
  {
    ref: 'ORD-2025-0033', status: 'fulfilled',
    date: 'Delivered 5 Apr 2025', total: '$1,049.00',
    shipped: 'MSP staging → Marcus Reid, Austin Office',
    po: 'PO-2025-0031',
    tracking: 'UPS: 1Z999AA10144332211',
    eta: null,
    note: null,
    items: [
      { qty: 1, name: 'Dell Latitude 5550', price: '$1,049.00', img: 'https://mforte2137.github.io/images/store/laptop-lat-5550.png' },
    ]
  },
  {
    ref: 'ORD-2025-0018', status: 'fulfilled',
    date: 'Delivered 14 Mar 2025', total: '$3,398.00',
    shipped: 'MSP staging → Los Angeles Office',
    po: 'PO-2025-0016',
    tracking: 'FedEx: 6194 7700 9921',
    eta: null,
    note: null,
    items: [
      { qty: 2, name: 'Dell Latitude 7450', price: '$1,649.00 each', img: 'https://mforte2137.github.io/images/store/laptop-lat-7450.png' },
      { qty: 2, name: 'Dell Thunderbolt Dock WD22TB4', price: '$349.00 each', img: 'https://mforte2137.github.io/images/store/dock-wd22tb4.png' },
    ]
  },
];
const TAX_RATE = 0.085;

// ── BRANCH OFFICES ────────────────────────────────────────────────
const BRANCH_OFFICES = [
  { id: 'branch-hq',     label: 'HQ — New York, NY',       addr: '142 West 36th Street, New York, NY 10018' },
  { id: 'branch-chi',    label: 'Chicago Office',           addr: '330 N Wabash Ave, Chicago, IL 60611' },
  { id: 'branch-la',     label: 'Los Angeles Office',       addr: '2000 Avenue of the Stars, Los Angeles, CA 90067' },
  { id: 'branch-austin', label: 'Austin Office',            addr: '500 W 2nd Street, Austin, TX 78701' },
];

// ── PRODUCT DATA ──────────────────────────────────────────────────
// Real Dell Latitude product line — seeded data with authentic specs
// Images from Dell's public CDN / press image URLs
const PRODUCTS = [
  // ─── LAPTOPS ───────────────────────────────────────────────────
  {
    id: 'lat-5550',
    category: 'laptop', brand: 'Dell Latitude', featured: true, badge: 'popular',
    name: 'Latitude 5550',
    shortDesc: '15.6" business laptop with Intel Core Ultra 5, ideal for everyday office and remote work.',
    desc: 'The Latitude 5550 delivers solid performance for the modern hybrid worker. Intel Core Ultra 5 processor, a sharp 15.6" FHD display, and all-day battery life make it a dependable choice for office and remote environments.',
    img: 'https://mforte2137.github.io/images/store/laptop-lat-5550.png',
    price: 1049,
    cpu: 'intel', ram: '16', storage: '512GB SSD', display: '15.6" FHD',
    weight: '1.78 kg', battery: 'Up to 13 hrs',
    specs: [
      { label: 'CPU', val: 'Intel Core Ultra 5 125U' },
      { label: 'RAM', val: '16 GB DDR5' },
      { label: 'Storage', val: '512 GB NVMe SSD' },
      { label: 'Display', val: '15.6" FHD IPS' },
      { label: 'Battery', val: 'Up to 13 hrs' },
      { label: 'Weight', val: '1.78 kg' },
    ]
  },
  {
    id: 'lat-7450',
    category: 'laptop', brand: 'Dell Latitude', featured: true, badge: 'new',
    name: 'Latitude 7450',
    shortDesc: '14" ultralight with Intel Core Ultra 7, for power users and frequent travellers.',
    desc: 'The premium Latitude 7450 is built for professionals who demand performance and portability. Military-grade durability, Intel Core Ultra 7, and a stunning 14" 2.5K display.',
    img: 'https://mforte2137.github.io/images/store/laptop-lat-7450.png',
    price: 1649,
    cpu: 'intel', ram: '32', storage: '1TB SSD', display: '14" 2.5K',
    weight: '1.33 kg', battery: 'Up to 14 hrs',
    specs: [
      { label: 'CPU', val: 'Intel Core Ultra 7 165U' },
      { label: 'RAM', val: '32 GB DDR5' },
      { label: 'Storage', val: '1 TB NVMe SSD' },
      { label: 'Display', val: '14" 2.5K QHD+ IPS' },
      { label: 'Battery', val: 'Up to 14 hrs' },
      { label: 'Weight', val: '1.33 kg' },
    ]
  },
  {
    id: 'lat-5450',
    category: 'laptop', brand: 'Dell Latitude', featured: false, badge: null,
    name: 'Latitude 5450',
    shortDesc: '14" mid-range workhorse with Intel Core Ultra 5 and a comfortable full-day battery.',
    desc: 'A well-rounded 14" business laptop that balances performance, portability, and price. Perfect for knowledge workers who need a reliable daily driver.',
    img: 'https://mforte2137.github.io/images/store/laptop-lat-5450.png',
    price: 969,
    cpu: 'intel', ram: '16', storage: '512GB SSD', display: '14" FHD',
    weight: '1.45 kg', battery: 'Up to 12 hrs',
    specs: [
      { label: 'CPU', val: 'Intel Core Ultra 5 125U' },
      { label: 'RAM', val: '16 GB DDR5' },
      { label: 'Storage', val: '512 GB NVMe SSD' },
      { label: 'Display', val: '14" FHD IPS' },
      { label: 'Battery', val: 'Up to 12 hrs' },
      { label: 'Weight', val: '1.45 kg' },
    ]
  },
  {
    id: 'lat-5350',
    category: 'laptop', brand: 'Dell Latitude', featured: false, badge: null,
    name: 'Latitude 5350',
    shortDesc: '13.3" compact business laptop for on-the-go employees, under $1,000.',
    desc: 'The compact Latitude 5350 is designed for employees who prioritise mobility. Lightweight chassis, solid battery life, and a great price point for budget-conscious deployments.',
    img: 'https://mforte2137.github.io/images/store/laptop-lat-5350.png',
    price: 879,
    cpu: 'intel', ram: '8', storage: '256GB SSD', display: '13.3" FHD',
    weight: '1.25 kg', battery: 'Up to 11 hrs',
    specs: [
      { label: 'CPU', val: 'Intel Core i5-1345U' },
      { label: 'RAM', val: '8 GB DDR4' },
      { label: 'Storage', val: '256 GB NVMe SSD' },
      { label: 'Display', val: '13.3" FHD IPS' },
      { label: 'Battery', val: 'Up to 11 hrs' },
      { label: 'Weight', val: '1.25 kg' },
    ]
  },
  {
    id: 'lat-5350-16',
    category: 'laptop', brand: 'Dell Latitude', featured: false, badge: null,
    name: 'Latitude 5350 (16 GB)',
    shortDesc: '13.3" compact business laptop with 16 GB RAM — best value ultraportable.',
    desc: 'The Latitude 5350 with a 16 GB RAM upgrade offers excellent value for employees who want speed and portability without a premium price tag.',
    img: 'https://mforte2137.github.io/images/store/laptop-lat-5350.png',
    price: 999,
    cpu: 'intel', ram: '16', storage: '512GB SSD', display: '13.3" FHD',
    weight: '1.25 kg', battery: 'Up to 11 hrs',
    specs: [
      { label: 'CPU', val: 'Intel Core i5-1345U' },
      { label: 'RAM', val: '16 GB DDR4' },
      { label: 'Storage', val: '512 GB NVMe SSD' },
      { label: 'Display', val: '13.3" FHD IPS' },
      { label: 'Battery', val: 'Up to 11 hrs' },
      { label: 'Weight', val: '1.25 kg' },
    ]
  },
  {
    id: 'lat-5550-amd',
    category: 'laptop', brand: 'Dell Latitude', featured: false, badge: null,
    name: 'Latitude 5550 (AMD)',
    shortDesc: '15.6" AMD Ryzen 7 laptop — powerful multitasking at a great price.',
    desc: 'The AMD-powered Latitude 5550 brings excellent multi-threaded performance for users running complex applications, VMs, or heavy multitasking workflows.',
    img: 'https://mforte2137.github.io/images/store/laptop-lat-5550.png',
    price: 1129,
    cpu: 'amd', ram: '16', storage: '512GB SSD', display: '15.6" FHD',
    weight: '1.80 kg', battery: 'Up to 12 hrs',
    specs: [
      { label: 'CPU', val: 'AMD Ryzen 7 7745U' },
      { label: 'RAM', val: '16 GB DDR5' },
      { label: 'Storage', val: '512 GB NVMe SSD' },
      { label: 'Display', val: '15.6" FHD IPS' },
      { label: 'Battery', val: 'Up to 12 hrs' },
      { label: 'Weight', val: '1.80 kg' },
    ]
  },
  {
    id: 'lat-9450',
    category: 'laptop', brand: 'Dell Latitude', featured: false, badge: 'new',
    name: 'Latitude 9450 2-in-1',
    shortDesc: '14" flagship 2-in-1 convertible — the best Latitude money can buy.',
    desc: 'The Latitude 9450 2-in-1 is Dell\'s flagship business laptop. Stunning OLED display, Intel Core Ultra 7, thin-and-light chassis, and enterprise-grade security features.',
    img: 'https://mforte2137.github.io/images/store/laptop-lat-9450.png',
    price: 2149,
    cpu: 'intel', ram: '32', storage: '1TB SSD', display: '14" OLED Touch',
    weight: '1.28 kg', battery: 'Up to 16 hrs',
    specs: [
      { label: 'CPU', val: 'Intel Core Ultra 7 165U' },
      { label: 'RAM', val: '32 GB DDR5' },
      { label: 'Storage', val: '1 TB NVMe SSD' },
      { label: 'Display', val: '14" OLED Touch 2.8K' },
      { label: 'Battery', val: 'Up to 16 hrs' },
      { label: 'Weight', val: '1.28 kg' },
    ]
  },
  {
    id: 'lat-3550',
    category: 'laptop', brand: 'Dell Latitude', featured: false, badge: null,
    name: 'Latitude 3550',
    shortDesc: 'Entry-level 15.6" business laptop — dependable and budget-friendly.',
    desc: 'The Latitude 3550 is the go-to for cost-conscious deployments that still need business reliability. Perfect for reception desks, light office work, and first-time setups.',
    img: 'https://mforte2137.github.io/images/store/laptop-lat-3550.png',
    price: 699,
    cpu: 'intel', ram: '8', storage: '256GB SSD', display: '15.6" FHD',
    weight: '1.79 kg', battery: 'Up to 8 hrs',
    specs: [
      { label: 'CPU', val: 'Intel Core i3-1315U' },
      { label: 'RAM', val: '8 GB DDR4' },
      { label: 'Storage', val: '256 GB NVMe SSD' },
      { label: 'Display', val: '15.6" FHD' },
      { label: 'Battery', val: 'Up to 8 hrs' },
      { label: 'Weight', val: '1.79 kg' },
    ]
  },

  // ─── MONITORS ──────────────────────────────────────────────────
  {
    id: 'mon-p2425h',
    category: 'monitor', brand: 'Dell', featured: true, badge: 'popular',
    name: 'Dell P2425H Monitor',
    shortDesc: '24" FHD IPS — the standard business monitor, USB-C included.',
    desc: 'The P2425H is the workhorse of business monitors. 24" FHD IPS panel, USB-C with power delivery, ergonomic stand, and excellent colour accuracy for all-day use.',
    img: 'https://mforte2137.github.io/images/store/monitor-p2425h.png',
    price: 259,
    cpu: null, ram: null, storage: null,
    display: '24" FHD IPS', weight: null, battery: null,
    specs: [
      { label: 'Size', val: '24" FHD (1920×1080)' },
      { label: 'Panel', val: 'IPS, 100Hz' },
      { label: 'Connectivity', val: 'USB-C 65W, HDMI, DP' },
      { label: 'Refresh', val: '100 Hz' },
      { label: 'Brightness', val: '300 nits' },
      { label: 'Stand', val: 'Height, tilt, pivot' },
    ]
  },
  {
    id: 'mon-p2725h',
    category: 'monitor', brand: 'Dell', featured: false, badge: null,
    name: 'Dell P2725H Monitor',
    shortDesc: '27" FHD IPS — extra screen real estate for power users.',
    desc: 'More screen, same great quality. The P2725H brings 27" of FHD IPS display with USB-C connectivity, perfect for multitaskers who need room to spread out.',
    img: 'https://mforte2137.github.io/images/store/monitor-p2725h.png',
    price: 319,
    cpu: null, ram: null, storage: null,
    display: '27" FHD IPS', weight: null, battery: null,
    specs: [
      { label: 'Size', val: '27" FHD (1920×1080)' },
      { label: 'Panel', val: 'IPS, 100Hz' },
      { label: 'Connectivity', val: 'USB-C 65W, HDMI, DP' },
      { label: 'Refresh', val: '100 Hz' },
      { label: 'Brightness', val: '300 nits' },
      { label: 'Stand', val: 'Height, tilt, pivot' },
    ]
  },
  {
    id: 'mon-u2724d',
    category: 'monitor', brand: 'Dell UltraSharp', featured: false, badge: 'new',
    name: 'Dell UltraSharp U2724D',
    shortDesc: '27" QHD IPS Black — premium display for designers and power users.',
    desc: 'The UltraSharp U2724D features Dell\'s IPS Black technology for exceptional contrast, 27" QHD resolution, and Thunderbolt 4 connectivity. The best monitor in its class.',
    img: 'https://mforte2137.github.io/images/store/monitor-u2724d.png',
    price: 549,
    cpu: null, ram: null, storage: null,
    display: '27" QHD IPS Black', weight: null, battery: null,
    specs: [
      { label: 'Size', val: '27" QHD (2560×1440)' },
      { label: 'Panel', val: 'IPS Black' },
      { label: 'Connectivity', val: 'Thunderbolt 4, USB-C, DP' },
      { label: 'Refresh', val: '60 Hz' },
      { label: 'Brightness', val: '400 nits' },
      { label: 'Stand', val: 'Height, tilt, pivot, rotate' },
    ]
  },

  // ─── DOCKING STATIONS ──────────────────────────────────────────
  {
    id: 'dock-wd22tb4',
    category: 'dock', brand: 'Dell', featured: true, badge: 'popular',
    name: 'Dell Thunderbolt Dock WD22TB4',
    shortDesc: 'Thunderbolt 4 dock — single cable connects laptop to everything on your desk.',
    desc: 'Connect a Dell Latitude to up to three 4K monitors, gigabit ethernet, and multiple USB devices with a single Thunderbolt 4 cable. The gold standard for desk setups.',
    img: 'https://mforte2137.github.io/images/store/dock-wd22tb4.png',
    price: 349,
    cpu: null, ram: null, storage: null, display: null, weight: null, battery: null,
    specs: [
      { label: 'Interface', val: 'Thunderbolt 4 (single cable)' },
      { label: 'Power', val: '130W laptop charging' },
      { label: 'Displays', val: 'Up to 3 × 4K' },
      { label: 'USB', val: '4× USB-A, 2× USB-C' },
      { label: 'Network', val: 'Gigabit Ethernet' },
      { label: 'Audio', val: 'Combo jack' },
    ]
  },
  {
    id: 'dock-wd19tbs',
    category: 'dock', brand: 'Dell', featured: false, badge: null,
    name: 'Dell Thunderbolt Dock WD19TBS',
    shortDesc: 'Slim Thunderbolt 3 dock — clean desk setup with 180W power delivery.',
    desc: 'The WD19TBS is a compact, stylish dock that fits neatly on any desk. Thunderbolt 3 single-cable connection with 180W power delivery and support for dual 4K displays.',
    img: 'https://mforte2137.github.io/images/store/dock-wd19tbs.png',
    price: 289,
    cpu: null, ram: null, storage: null, display: null, weight: null, battery: null,
    specs: [
      { label: 'Interface', val: 'Thunderbolt 3 (single cable)' },
      { label: 'Power', val: '180W laptop charging' },
      { label: 'Displays', val: 'Up to 2 × 4K' },
      { label: 'USB', val: '3× USB-A, 2× USB-C' },
      { label: 'Network', val: 'Gigabit Ethernet' },
      { label: 'Audio', val: 'Combo jack' },
    ]
  },

  // ─── ACCESSORIES ───────────────────────────────────────────────
  {
    id: 'bag-premier',
    category: 'accessory', brand: 'Dell', featured: false, badge: null,
    name: 'Dell Premier Backpack 15',
    shortDesc: 'Premium 15" laptop backpack with organisation and padded protection.',
    desc: 'A professional backpack designed for the Latitude series. Dedicated laptop and tablet compartments, cable passthrough, and durable PU leather finish.',
    img: 'https://mforte2137.github.io/images/store/bag-premier.png',
    price: 89,
    cpu: null, ram: null, storage: null, display: null, weight: null, battery: null,
    specs: [
      { label: 'Fits', val: 'Up to 15" laptops' },
      { label: 'Material', val: 'PU leather, recycled poly' },
      { label: 'Compartments', val: 'Laptop, tablet, accessories' },
      { label: 'Weight', val: '0.7 kg' },
    ]
  },
  {
    id: 'bag-pro-sleeve',
    category: 'accessory', brand: 'Dell', featured: false, badge: null,
    name: 'Dell Pro Sleeve 14',
    shortDesc: 'Slim protective sleeve for the Latitude 5450 and 7450.',
    desc: 'A minimalist sleeve that slips easily into any bag. Memory foam interior protection, subtle Dell branding, and a durable exterior.',
    img: 'https://mforte2137.github.io/images/store/bag-sleeve.png',
    price: 39,
    cpu: null, ram: null, storage: null, display: null, weight: null, battery: null,
    specs: [
      { label: 'Fits', val: '13"–14.1" laptops' },
      { label: 'Material', val: 'Neoprene, memory foam' },
      { label: 'Pockets', val: 'External accessory pocket' },
    ]
  },
  {
    id: 'mouse-ms5120w',
    category: 'accessory', brand: 'Dell', featured: false, badge: null,
    name: 'Dell Premier Wireless Mouse MS5120W',
    shortDesc: 'Silent, ergonomic wireless mouse — pairs with up to 3 devices.',
    desc: 'The MS5120W is a premium wireless mouse designed for business users. Silent clicks, customisable side buttons, and multi-device pairing via Bluetooth or USB receiver.',
    img: 'https://mforte2137.github.io/images/store/mouse-ms5120w.png',
    price: 59,
    cpu: null, ram: null, storage: null, display: null, weight: null, battery: null,
    specs: [
      { label: 'Connectivity', val: 'Bluetooth 5.0, USB' },
      { label: 'DPI', val: '1000 / 1600 / 4000' },
      { label: 'Battery', val: 'Up to 36 months (AA)' },
      { label: 'OS', val: 'Windows, macOS, Chrome, Linux' },
    ]
  },
  {
    id: 'kb-km7321w',
    category: 'accessory', brand: 'Dell', featured: false, badge: null,
    name: 'Dell Premier Wireless Keyboard & Mouse KM7321W',
    shortDesc: 'Wireless keyboard and mouse combo — productive and tidy desk setup.',
    desc: 'Full-sized wireless keyboard paired with the Premier wireless mouse. Both connect to a single USB nanoreceiver or Bluetooth, with a rechargeable keyboard and 36-month mouse battery.',
    img: 'https://mforte2137.github.io/images/store/kb-km7321w.png',
    price: 99,
    cpu: null, ram: null, storage: null, display: null, weight: null, battery: null,
    specs: [
      { label: 'Connectivity', val: 'Bluetooth 5.0, USB Nano' },
      { label: 'Keyboard', val: 'Full-size, rechargeable' },
      { label: 'Mouse', val: '4000 DPI, 3 device pairing' },
      { label: 'Battery', val: 'Mouse: 36 months' },
    ]
  },

  // ─── BUNDLES ───────────────────────────────────────────────────
  {
    id: 'bundle-remote',
    category: 'bundle', brand: 'Acme Corp', featured: true, badge: 'bundle',
    name: 'Remote Worker Bundle',
    shortDesc: 'Everything a remote employee needs — laptop, monitor, dock, and peripherals.',
    desc: 'The complete remote worker setup, curated by your IT team. Includes a Dell Latitude 5450, 24" monitor, Thunderbolt dock, wireless keyboard & mouse, and a Dell Premier backpack. Ready to deploy, day one.',
    img: 'https://mforte2137.github.io/images/store/bundle-remote.png',
    price: 1699,
    cpu: null, ram: null, storage: null, display: null, weight: null, battery: null,
    specs: [
      { label: 'Laptop', val: 'Latitude 5450 (16GB, 512GB)' },
      { label: 'Monitor', val: 'Dell P2425H 24" FHD' },
      { label: 'Dock', val: 'Dell WD19TBS Thunderbolt' },
      { label: 'Peripherals', val: 'KM7321W Keyboard & Mouse' },
      { label: 'Bag', val: 'Dell Premier Backpack 15' },
      { label: 'Saving', val: '$176 vs. individual items' },
    ]
  },
  {
    id: 'bundle-exec',
    category: 'bundle', brand: 'Acme Corp', featured: true, badge: 'bundle',
    name: 'Executive Bundle',
    shortDesc: 'Premium setup for senior staff — the best Latitude with UltraSharp display.',
    desc: 'Reserved for senior employees and executives who need the best. Dell Latitude 7450 paired with the UltraSharp 27" QHD monitor, premium Thunderbolt 4 dock, and MS5120W mouse. Everything needed to perform at the highest level.',
    img: 'https://mforte2137.github.io/images/store/bundle-exec.png',
    price: 2549,
    cpu: null, ram: null, storage: null, display: null, weight: null, battery: null,
    specs: [
      { label: 'Laptop', val: 'Latitude 7450 (32GB, 1TB)' },
      { label: 'Monitor', val: 'Dell UltraSharp U2724D 27"' },
      { label: 'Dock', val: 'Dell WD22TB4 Thunderbolt 4' },
      { label: 'Mouse', val: 'Dell Premier MS5120W' },
      { label: 'Bag', val: 'Dell Pro Sleeve 14' },
      { label: 'Saving', val: '$296 vs. individual items' },
    ]
  },
  {
    id: 'bundle-starter',
    category: 'bundle', brand: 'Acme Corp', featured: false, badge: 'bundle',
    name: 'New Starter Bundle',
    shortDesc: 'Cost-effective onboarding bundle — good specs, great price.',
    desc: 'The ideal package for new starters who need everything to hit the ground running without blowing the budget. Latitude 5350, 24" monitor, USB-C hub, and a wireless mouse.',
    img: 'https://mforte2137.github.io/images/store/bundle-starter.png',
    price: 1199,
    cpu: null, ram: null, storage: null, display: null, weight: null, battery: null,
    specs: [
      { label: 'Laptop', val: 'Latitude 5350 (16GB, 512GB)' },
      { label: 'Monitor', val: 'Dell P2425H 24" FHD' },
      { label: 'Dock', val: 'Dell WD19TBS Thunderbolt' },
      { label: 'Mouse', val: 'Dell Premier MS5120W' },
      { label: 'Saving', val: '$87 vs. individual items' },
    ]
  }
];

// ── QUOTE DATA ────────────────────────────────────────────────────
const QUOTES = {
  pending: [
    {
      ref: 'QUO-2024-0312', date: '12 Jun 2025', total: '$3,398.00',
      items: [
        { qty: 2, name: 'Dell Latitude 7450', price: '$1,649.00 each' },
        { qty: 2, name: 'Dell WD22TB4 Dock', price: '$349.00 each' },
      ],
      note: 'Raised by IT for the new Product team hires. Awaiting approval from Finance.'
    },
    {
      ref: 'QUO-2024-0309', date: '8 Jun 2025', total: '$1,699.00',
      items: [
        { qty: 1, name: 'Remote Worker Bundle', price: '$1,699.00' },
      ],
      note: 'Setup for Sarah Chen — starting 1 July. Please approve by 20 June.'
    }
  ],
  approved: [
    {
      ref: 'QUO-2024-0301', date: '28 May 2025', total: '$2,549.00',
      items: [
        { qty: 1, name: 'Executive Bundle', price: '$2,549.00' },
      ],
      note: 'Approved by Marcus Reid. Shipped 30 May — delivered 2 June.'
    },
    {
      ref: 'QUO-2024-0289', date: '14 May 2025', total: '$5,096.00',
      items: [
        { qty: 4, name: 'New Starter Bundle', price: '$1,199.00 each' },
        { qty: 4, name: 'Dell Premier Backpack 15', price: '$89.00 each' },
      ],
      note: 'Q2 onboarding batch — 4 new hires in customer success.'
    },
    {
      ref: 'QUO-2024-0274', date: '2 May 2025', total: '$969.00',
      items: [
        { qty: 1, name: 'Dell Latitude 5450', price: '$969.00' },
      ],
      note: 'Replacement laptop for James Taylor (Lat. 3540 failed).'
    },
    {
      ref: 'QUO-2024-0260', date: '18 Apr 2025', total: '$608.00',
      items: [
        { qty: 1, name: 'Dell P2725H Monitor', price: '$319.00' },
        { qty: 1, name: 'Dell WD19TBS Dock', price: '$289.00' },
      ],
      note: 'Home office upgrade for Alex Kim. Approved by line manager.'
    },
    {
      ref: 'QUO-2024-0248', date: '3 Apr 2025', total: '$1,049.00',
      items: [
        { qty: 1, name: 'Dell Latitude 5550', price: '$1,049.00' },
      ],
      note: 'Onboarding — engineering team.'
    }
  ],
  declined: [
    {
      ref: 'QUO-2024-0298', date: '24 May 2025', total: '$4,298.00',
      items: [
        { qty: 2, name: 'Dell Latitude 9450 2-in-1', price: '$2,149.00 each' },
      ],
      note: 'Declined by Finance — budget not available this quarter. Please re-submit in Q3 with manager sign-off.'
    }
  ]
};

// ── HELPERS ───────────────────────────────────────────────────────
function fmt(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

let snackbarTimer = null;
function showCartSnackbar(productName) {
  snackbarName.textContent = productName;
  cartSnackbar.classList.add('show');
  clearTimeout(snackbarTimer);
  snackbarTimer = setTimeout(hideCartSnackbar, 5000);
}
function hideCartSnackbar() {
  cartSnackbar.classList.remove('show');
  clearTimeout(snackbarTimer);
}

// Snackbar button handlers
snackbarDismiss.addEventListener('click', hideCartSnackbar);
snackbarShop.addEventListener('click', hideCartSnackbar);
snackbarCart.addEventListener('click', () => { hideCartSnackbar(); openCart(); });

function genOrderRef() {
  return 'ORD-' + Date.now().toString(36).toUpperCase().slice(-6);
}

// ── TAB SWITCHING ─────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'quotes') renderQuotes();
    if (btn.dataset.tab === 'orders') renderOrders();
  });
});

// ── FILTER LOGIC ──────────────────────────────────────────────────
function getFilteredProducts() {
  let list = [...PRODUCTS];

  // AI override
  if (aiFilteredIds !== null) {
    const idSet = new Set(aiFilteredIds);
    list = list.filter(p => idSet.has(p.id));
  } else {
    // Search query
    if (productSearchQuery) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(productSearchQuery) ||
        p.brand.toLowerCase().includes(productSearchQuery) ||
        (p.specs && p.specs.some(s => s.val.toLowerCase().includes(productSearchQuery)))
      );
    }
    // Category
    if (activeFilters.category !== 'all') {
      list = list.filter(p => p.category === activeFilters.category);
    }
    // CPU
    if (activeFilters.cpu !== 'all') {
      list = list.filter(p => p.cpu === activeFilters.cpu || !p.cpu);
    }
    // RAM
    if (activeFilters.ram !== 'all') {
      list = list.filter(p => p.ram === activeFilters.ram || !p.ram);
    }
    // Price
    if (priceMin !== null) list = list.filter(p => p.price >= priceMin);
    if (priceMax !== null) list = list.filter(p => p.price <= priceMax);
  }

  // Sort
  if (sortBy === 'price-asc')  list.sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
  if (sortBy === 'name')       list.sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === 'featured')   list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return list;
}

function renderProductGrid() {
  const list = getFilteredProducts();
  resultCount.textContent = list.length + ' product' + (list.length !== 1 ? 's' : '');

  productGrid.innerHTML = '';
  if (list.length === 0) {
    productGrid.innerHTML = '<div style="grid-column:1/-1;padding:48px;text-align:center;color:var(--text-3);font-family:\'JetBrains Mono\',monospace;font-size:13px;">No products match your filters.</div>';
    return;
  }

  list.forEach(p => {
    const inCompare = compareList.includes(p.id);
    const card = document.createElement('div');
    card.className = 'product-card' + (inCompare ? ' compare-selected' : '');
    card.dataset.id = p.id;

    const imgHtml = p.img
      ? `<img src="${p.img}" alt="${p.name}" onerror="this.parentNode.innerHTML='<span class=card-img-placeholder>${p.brand}</span>'">`
      : `<span class="card-img-placeholder">${p.brand}</span>`;

    const badgeHtml = p.badge ? `<div class="card-badge badge-${p.badge}">${p.badge}</div>` : '';

    const specsHtml = p.specs.slice(0, 4).map(s =>
      `<div class="card-spec"><span class="spec-label">${s.label}</span><span class="spec-val">${s.val}</span></div>`
    ).join('');

    card.innerHTML = `
      <div class="card-compare-toggle" title="Add to compare">✓</div>
      ${badgeHtml}
      <div class="card-img-wrap">${imgHtml}</div>
      <div class="card-body">
        <div class="card-brand">${p.brand}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-specs">${specsHtml}</div>
        <div class="card-footer">
          <div class="card-price">${fmt(p.price)}</div>
          <div class="card-actions">
            <button class="card-detail-btn" data-id="${p.id}">Details</button>
            <button class="card-add-btn" data-id="${p.id}">Add</button>
          </div>
        </div>
      </div>
    `;

    card.querySelector('.card-compare-toggle').addEventListener('click', e => {
      e.stopPropagation();
      toggleCompare(p.id);
    });
    card.querySelector('.card-add-btn').addEventListener('click', e => {
      e.stopPropagation();
      addToCart(p.id);
    });
    card.querySelector('.card-detail-btn').addEventListener('click', e => {
      e.stopPropagation();
      openProductModal(p.id);
    });
    card.addEventListener('click', () => openProductModal(p.id));

    productGrid.appendChild(card);
  });
}

function renderActiveFilters() {
  activeFiltersEl.innerHTML = '';
  if (aiFilteredIds !== null) return;
  Object.entries(activeFilters).forEach(([key, val]) => {
    if (val === 'all') return;
    const chip = document.createElement('div');
    chip.className = 'active-filter-chip';
    chip.textContent = val + ' ×';
    chip.addEventListener('click', () => {
      activeFilters[key] = 'all';
      document.querySelectorAll(`[data-filter="${key}"]`).forEach(el => {
        el.classList.toggle('active', el.dataset.value === 'all');
      });
      renderActiveFilters();
      renderProductGrid();
    });
    activeFiltersEl.appendChild(chip);
  });
}

// Filter option clicks
document.querySelectorAll('.filter-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    const filterGroup = opt.dataset.filter;
    const val = opt.dataset.value;
    activeFilters[filterGroup] = val;
    document.querySelectorAll(`[data-filter="${filterGroup}"]`).forEach(el => {
      el.classList.toggle('active', el.dataset.value === val);
    });
    aiFilteredIds = null;
    aiResultBanner.style.display = 'none';
    renderActiveFilters();
    renderProductGrid();
  });
});

// Price filter
[document.getElementById('priceMin'), document.getElementById('priceMax')].forEach(input => {
  input.addEventListener('input', () => {
    priceMin = document.getElementById('priceMin').value ? +document.getElementById('priceMin').value : null;
    priceMax = document.getElementById('priceMax').value ? +document.getElementById('priceMax').value : null;
    renderProductGrid();
  });
});

// Sort
sortSelect.addEventListener('change', () => { sortBy = sortSelect.value; renderProductGrid(); });

// Reset filters
// ── PRODUCT SEARCH ────────────────────────────────────────────────
productSearchInput?.addEventListener('input', e => {
  productSearchQuery = e.target.value.trim().toLowerCase();
  productSearchClear.style.display = productSearchQuery ? 'flex' : 'none';
  aiFilteredIds = null;
  aiResultBanner.style.display = 'none';
  renderProductGrid();
});

productSearchClear?.addEventListener('click', () => {
  productSearchInput.value = '';
  productSearchQuery = '';
  productSearchClear.style.display = 'none';
  productSearchInput.focus();
  renderProductGrid();
});

filterReset.addEventListener('click', () => {
  activeFilters = { category: 'all', cpu: 'all', ram: 'all' };
  priceMin = null; priceMax = null;
  aiFilteredIds = null;
  document.getElementById('priceMin').value = '';
  document.getElementById('priceMax').value = '';
  document.querySelectorAll('.filter-opt').forEach(el => {
    el.classList.toggle('active', el.dataset.value === 'all');
  });
  aiResultBanner.style.display = 'none';
  renderActiveFilters();
  renderProductGrid();
});

// Hero bundles button
heroBundlesBtn.addEventListener('click', () => {
  activeFilters.category = 'bundle';
  document.querySelectorAll('[data-filter="category"]').forEach(el => {
    el.classList.toggle('active', el.dataset.value === 'bundle');
  });
  renderProductGrid();
});

// AI banner clear
aiBannerClear.addEventListener('click', () => {
  aiFilteredIds = null;
  aiResultBanner.style.display = 'none';
  renderProductGrid();
});

// ── COMPARE ───────────────────────────────────────────────────────
function toggleCompare(id) {
  if (compareList.includes(id)) {
    compareList = compareList.filter(i => i !== id);
  } else {
    if (compareList.length >= 3) { showToast('You can compare up to 3 products'); return; }
    compareList.push(id);
  }
  updateCompareSummary();
  renderProductGrid();
}

function updateCompareSummary() {
  if (compareList.length === 0) {
    compareSummary.innerHTML = '<span class="compare-hint">Select up to 3 products to compare</span>';
    compareBtn.style.display = 'none';
    return;
  }
  const items = compareList.map(id => {
    const p = PRODUCTS.find(x => x.id === id);
    return `<div class="compare-item">${p.name} <span class="compare-remove" data-id="${id}">×</span></div>`;
  }).join('');
  compareSummary.innerHTML = `<div class="compare-selected-list">${items}</div>`;
  compareBtn.style.display = 'block';
  compareSummary.querySelectorAll('.compare-remove').forEach(el => {
    el.addEventListener('click', () => toggleCompare(el.dataset.id));
  });
}

compareBtn.addEventListener('click', openCompareModal);

function openCompareModal() {
  const products = compareList.map(id => PRODUCTS.find(p => p.id === id));
  const allSpecKeys = ['CPU', 'RAM', 'Storage', 'Display', 'Battery', 'Weight'];

  const headers = ['<th>Specification</th>', ...products.map(p =>
    `<th>
      <div class="compare-img-cell">
        <img src="${p.img || ''}" alt="${p.name}" onerror="this.style.display='none'">
        <div class="compare-product-name">${p.name}</div>
        <div class="compare-product-price">${fmt(p.price)}</div>
        <button class="compare-add-btn" data-id="${p.id}">Add to basket</button>
      </div>
    </th>`
  )].join('');

  const rows = allSpecKeys.map(key => {
    const vals = products.map(p => {
      const s = p.specs.find(x => x.label === key);
      return s ? s.val : '—';
    });
    return `<tr>
      <td class="row-label">${key}</td>
      ${vals.map(v => `<td>${v}</td>`).join('')}
    </tr>`;
  }).join('');

  // Price row
  const priceRow = `<tr>
    <td class="row-label">Price</td>
    ${products.map(p => `<td><strong>${fmt(p.price)}</strong></td>`).join('')}
  </tr>`;

  compareTableWrap.innerHTML = `
    <table class="compare-table">
      <thead><tr>${headers}</tr></thead>
      <tbody>${rows}${priceRow}</tbody>
    </table>
  `;

  compareTableWrap.querySelectorAll('.compare-add-btn').forEach(btn => {
    btn.addEventListener('click', () => { addToCart(btn.dataset.id); closeCompareModal(); });
  });

  compareModalBackdrop.style.display = 'flex';
}

function closeCompareModal() { compareModalBackdrop.style.display = 'none'; }
compareModalClose.addEventListener('click', closeCompareModal);
compareModalBackdrop.addEventListener('click', e => { if (e.target === compareModalBackdrop) closeCompareModal(); });

// ── PRODUCT DETAIL MODAL ──────────────────────────────────────────
function openProductModal(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;

  let qty = 1;

  const specsHtml = p.specs.map(s =>
    `<div class="pm-spec-row">
      <div class="pm-spec-key">${s.label}</div>
      <div class="pm-spec-val">${s.val}</div>
    </div>`
  ).join('');

  productModalBody.innerHTML = `
    <div class="pm-layout">
      <div class="pm-img-col">
        <img src="${p.img || ''}" alt="${p.name}" onerror="this.style.display='none'">
      </div>
      <div class="pm-info-col">
        <div class="pm-brand">${p.brand}</div>
        <h2 class="pm-name">${p.name}</h2>
        <p class="pm-desc">${p.desc}</p>
        <div class="pm-spec-table">${specsHtml}</div>
        <div class="pm-footer">
          <div class="pm-price">${fmt(p.price)}</div>
          <div class="pm-actions">
            <div class="pm-qty">
              <button class="pm-qty-btn" id="pmQtyDown">−</button>
              <div class="pm-qty-val" id="pmQtyVal">1</div>
              <button class="pm-qty-btn" id="pmQtyUp">+</button>
            </div>
            <button class="btn-accent pm-add-btn" id="pmAddBtn">Add to basket</button>
          </div>
        </div>
      </div>
    </div>
  `;

  productModalBody.querySelector('#pmQtyDown').addEventListener('click', () => {
    if (qty > 1) { qty--; productModalBody.querySelector('#pmQtyVal').textContent = qty; }
  });
  productModalBody.querySelector('#pmQtyUp').addEventListener('click', () => {
    qty++; productModalBody.querySelector('#pmQtyVal').textContent = qty;
  });
  productModalBody.querySelector('#pmAddBtn').addEventListener('click', () => {
    for (let i = 0; i < qty; i++) addToCart(p.id);
    closeProductModal();
  });

  productModalBackdrop.style.display = 'flex';
}

function closeProductModal() { productModalBackdrop.style.display = 'none'; }
productModalClose.addEventListener('click', closeProductModal);
productModalBackdrop.addEventListener('click', e => { if (e.target === productModalBackdrop) closeProductModal(); });

// ── CART ──────────────────────────────────────────────────────────
function addToCart(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const existing = cart.find(i => i.id === id);
  if (existing) { existing.qty++; }
  else { cart.push({ ...p, qty: 1 }); }
  renderCart();
  showCartSnackbar(p.name);
}

function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
}

cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
cartEmptyShop.addEventListener('click', closeCart);


// Products that REQUIRE end-user assignment (need M365/Intune provisioning)
const REQUIRES_USER = ['laptop', 'bundle'];
function itemRequiresUser(item) {
  return REQUIRES_USER.includes(item.category);
}

function renderCart() {
  // Count badge
  const total = cart.reduce((s, i) => s + i.qty, 0);
  cartCount.textContent = total;
  cartCount.classList.toggle('hidden', total === 0);

  // Empty state
  if (cart.length === 0) {
    cartEmpty.style.display = 'flex';
    cartFooter.style.display = 'none';
    drawerAddressSection.style.display = 'none';
    cartItems.innerHTML = '';
    cartItems.appendChild(cartEmpty);
    return;
  }

  cartEmpty.style.display = 'none';
  cartFooter.style.display = 'flex';
  drawerAddressSection.style.display = 'block';

  // Remove old cart-item rows
  cartItems.querySelectorAll('.cart-item').forEach(el => el.remove());

  cart.forEach(item => {
    // Ensure a default destination exists
    if (!shipDestinations[item.id]) shipDestinations[item.id] = 'msp';

    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="cart-item-img">
        <img src="${item.img || ''}" alt="${item.name}" onerror="this.style.display='none'">
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${fmt(item.price)} each</div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-id="${item.id}" data-dir="-1">−</button>
          <div class="qty-val">${item.qty}</div>
          <button class="qty-btn" data-id="${item.id}" data-dir="1">+</button>
          <button class="cart-item-remove" data-id="${item.id}">Remove</button>
        </div>
      </div>
    `;

    el.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ci = cart.find(i => i.id === btn.dataset.id);
        if (!ci) return;
        ci.qty += +btn.dataset.dir;
        if (ci.qty <= 0) {
          delete shipDestinations[ci.id];
          delete customAddresses[ci.id];
          cart = cart.filter(i => i.id !== btn.dataset.id);
        }
        renderCart();
      });
    });

    el.querySelector('.cart-item-remove').addEventListener('click', e => {
      const id = e.target.dataset.id;
      delete shipDestinations[id];
      delete customAddresses[id];
      cart = cart.filter(i => i.id !== id);
      renderCart();
    });

    cartItems.insertBefore(el, cartEmpty);
  });

  renderShipToList();
  renderEndUserList();
  updateCartTotals();
}

// ── SHIP-TO PER ITEM ─────────────────────────────────────────────
function shipDestLabel(dest) {
  if (dest === 'msp') return 'Ship to MSP (staging)';
  if (dest === 'custom') return 'Custom address';
  const branch = BRANCH_OFFICES.find(b => b.id === dest);
  return branch ? branch.label : dest;
}

function renderShipToList() {
  shipToItemList.innerHTML = '';
  cart.forEach(item => {
    const dest = shipDestinations[item.id] || 'msp';
    const wrapper = document.createElement('div');
    wrapper.className = 'shipto-item';

    // Build select options
    const mspOpt    = `<option value="msp" ${dest === 'msp' ? 'selected' : ''}>Ship to MSP (staging & imaging)</option>`;
    const branchOpts = BRANCH_OFFICES.map(b =>
      `<option value="${b.id}" ${dest === b.id ? 'selected' : ''}>${b.label}</option>`
    ).join('');
    const customOpt = `<option value="custom" ${dest === 'custom' ? 'selected' : ''}>Custom address…</option>`;

    const customAddr = customAddresses[item.id] || {};
    const customFormHtml = dest === 'custom' ? `
      <div class="shipto-custom-form" data-id="${item.id}">
        <input type="text"  class="addr-input" placeholder="Recipient name" value="${customAddr.name   || ''}" data-field="name">
        <input type="text"  class="addr-input" placeholder="Street address"  value="${customAddr.street || ''}" data-field="street">
        <div class="shipto-form-row">
          <input type="text"  class="addr-input" placeholder="City"  value="${customAddr.city  || ''}" data-field="city" style="flex:1">
          <input type="text"  class="addr-input addr-state" placeholder="ST" value="${customAddr.state || ''}" data-field="state" maxlength="2">
          <input type="text"  class="addr-input addr-zip"   placeholder="ZIP" value="${customAddr.zip   || ''}" data-field="zip" maxlength="10">
        </div>
      </div>
    ` : '';

    wrapper.innerHTML = `
      <div class="shipto-item-name">${item.name}</div>
      <select class="shipto-select" data-id="${item.id}">
        <optgroup label="MSP">${mspOpt}</optgroup>
        <optgroup label="Branch offices">${branchOpts}</optgroup>
        <optgroup label="Other">${customOpt}</optgroup>
      </select>
      ${customFormHtml}
    `;

    // Select change handler
    wrapper.querySelector('.shipto-select').addEventListener('change', e => {
      shipDestinations[item.id] = e.target.value;
      renderShipToList();
    });

    // Custom address field listeners
    if (dest === 'custom') {
      wrapper.querySelectorAll('.shipto-custom-form input').forEach(input => {
        input.addEventListener('input', e => {
          if (!customAddresses[item.id]) customAddresses[item.id] = {};
          customAddresses[item.id][e.target.dataset.field] = e.target.value;
        });
      });
    }

    shipToItemList.appendChild(wrapper);
  });
}

// Apply-all ship destination — inline picker
applyAllShipBtn.addEventListener('click', () => {
  if (cart.length === 0) return;

  const existing = document.getElementById('applyAllPicker');
  if (existing) { existing.remove(); return; }

  const picker = document.createElement('div');
  picker.id = 'applyAllPicker';
  picker.style.cssText = 'position:absolute;z-index:600;background:var(--bg-panel);border:1px solid var(--border-2);min-width:230px;right:0;top:100%;margin-top:4px;';

  const opts = [
    { val: 'msp', label: 'Ship to MSP (staging & imaging)' },
    ...BRANCH_OFFICES.map(b => ({ val: b.id, label: b.label })),
  ];

  picker.innerHTML = '<div style="padding:8px 12px;font-family:\'JetBrains Mono\',monospace;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);border-bottom:1px solid var(--border);">Apply to all items</div>' +
    opts.map(o => '<div class="apply-all-opt" data-val="' + o.val + '" style="padding:9px 12px;font-size:13px;font-family:\'Inter\',sans-serif;color:var(--text-2);cursor:pointer;">' + o.label + '</div>').join('');

  const addrBlock = applyAllShipBtn.closest('.addr-block');
  addrBlock.style.position = 'relative';
  addrBlock.appendChild(picker);

  picker.querySelectorAll('.apply-all-opt').forEach(opt => {
    opt.addEventListener('mouseover', () => { opt.style.background = 'var(--bg-row)'; });
    opt.addEventListener('mouseout',  () => { opt.style.background = ''; });
    opt.addEventListener('click', () => {
      cart.forEach(item => { shipDestinations[item.id] = opt.dataset.val; });
      renderShipToList();
      picker.remove();
      showToast('Destination applied to all items');
    });
  });

  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!picker.contains(e.target) && e.target !== applyAllShipBtn) {
        picker.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 10);
});


// ── END USER ASSIGNMENT ───────────────────────────────────────────
function renderEndUserList() {
  if (!endUserItemList) return;
  endUserItemList.innerHTML = '';

  // Only show items that could need a user (laptops + bundles = required; others = optional)
  // Show ALL items but mark required ones clearly
  const hasAny = cart.length > 0;
  if (!hasAny) return;

  cart.forEach(item => {
    const required = itemRequiresUser(item);
    const eu = endUserData[item.id] || {};
    const hasData = eu.name || eu.email;

    const wrapper = document.createElement('div');
    wrapper.className = 'eusr-item';
    wrapper.dataset.id = item.id;

    // For optional items, start collapsed if no data
    const showFields = required || hasData || item._euExpanded;

    wrapper.innerHTML = `
      <div class="eusr-item-header">
        <div class="eusr-item-name">${item.name}</div>
        ${required
          ? '<span class="eusr-required-badge">Required</span>'
          : '<span class="eusr-optional-badge">Optional</span>'}
      </div>
      ${showFields ? `
        <div class="eusr-fields">
          <div class="eusr-row">
            <input type="text" class="eusr-input" data-field="name" data-id="${item.id}"
              placeholder="Full name" value="${eu.name || ''}" />
            <input type="email" class="eusr-input" data-field="email" data-id="${item.id}"
              placeholder="Work email" value="${eu.email || ''}" />
          </div>
          <textarea class="eusr-input eusr-notes" data-field="notes" data-id="${item.id}"
            placeholder="Notes for MSP — e.g. start date, admin rights, preferred language">${eu.notes || ''}</textarea>
        </div>
        ${!required ? '<button class="eusr-toggle-link" data-id="' + item.id + '" data-action="hide">Hide ↑</button>' : ''}
      ` : `
        <button class="eusr-toggle-link" data-id="${item.id}" data-action="show">+ Assign a user</button>
      `}
      ${hasData ? '<div class="eusr-assigned-tag">✓ ' + (eu.name || eu.email) + '</div>' : ''}
    `;

    // Input listeners
    wrapper.querySelectorAll('.eusr-input').forEach(input => {
      input.addEventListener('input', e => {
        if (!endUserData[item.id]) endUserData[item.id] = {};
        endUserData[item.id][e.target.dataset.field] = e.target.value;
      });
    });

    // Toggle show/hide for optional items
    const toggleBtn = wrapper.querySelector('.eusr-toggle-link');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        item._euExpanded = toggleBtn.dataset.action === 'show';
        renderEndUserList();
      });
    }

    endUserItemList.appendChild(wrapper);
  });

  // Auto-open end-user block if any items require a user
  const hasRequired = cart.some(i => itemRequiresUser(i));
  if (hasRequired) {
    const block = document.getElementById('endUserBlock');
    if (block && !block.classList.contains('open')) block.classList.add('open');
  }
}

// ── BILLING ADDRESS EDIT ──────────────────────────────────────────
billingEditBtn.addEventListener('click', () => {
  billingForm.style.display = 'flex';
  billingDisplay.style.display = 'none';
});

document.getElementById('billingSaveBtn').addEventListener('click', () => {
  const company = document.getElementById('billCompany').value.trim();
  const street  = document.getElementById('billStreet').value.trim();
  const city    = document.getElementById('billCity').value.trim();
  const state   = document.getElementById('billState').value.trim().toUpperCase();
  const zip     = document.getElementById('billZip').value.trim();
  billingDisplay.innerHTML = [company, street, `${city}, ${state} ${zip}`, 'United States']
    .filter(Boolean)
    .map(l => `<div class="addr-line">${l}</div>`)
    .join('');
  billingForm.style.display = 'none';
  billingDisplay.style.display = 'block';
  showToast('Billing address saved');
});

function updateCartTotals() {
  const shipping = SHIPPING_COSTS[shippingSelect.value] || 12;
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + shipping;
  cartSubtotal.textContent = fmt(subtotal);
  cartShipping.textContent = fmt(shipping);
  cartTax.textContent = fmt(tax);
  cartTotal.textContent = fmt(total);
}

shippingSelect.addEventListener('change', updateCartTotals);

// ── CHECKOUT PATHS ───────────────────────────────────────────────
function completeOrder() {
  orderRef.textContent = genOrderRef();
  closeCart();
  orderModalBackdrop.style.display = 'flex';
  cart = [];
  shipDestinations = {};
  customAddresses  = {};
  endUserData = {};
  renderCart();
}

// Invoice path — straight to Salesbuildr
document.getElementById('checkoutInvoiceBtn').addEventListener('click', () => {
  if (cart.length === 0) return;
  completeOrder();
});

// Pay now path — open Global Payments modal
document.getElementById('checkoutPayBtn').addEventListener('click', () => {
  if (cart.length === 0) return;
  openPayModal();
});

// Save basket
saveBasketBtn.addEventListener('click', () => {
  if (cart.length === 0) return;
  const name = document.getElementById('basketName').value.trim() || 'My order';
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = SHIPPING_COSTS[shippingSelect.value] || 12;
  const total = subtotal + (subtotal * TAX_RATE) + shipping;
  const basket = {
    id: Date.now().toString(36),
    name,
    date: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
    items: cart.map(i => ({ ...i })),
    total: fmt(total),
    preview: cart.slice(0, 3).map(i => i.name).join(', ') + (cart.length > 3 ? ` +${cart.length - 3} more` : ''),
  };
  savedBaskets.unshift(basket);
  updateSavedBadge();
  showToast('"' + name + '" saved');
});

// ── SAVED BASKETS ─────────────────────────────────────────────────
function updateSavedBadge() {
  if (savedBaskets.length > 0) {
    savedCountBadge.textContent = savedBaskets.length;
    savedCountBadge.style.display = 'inline-flex';
  } else {
    savedCountBadge.style.display = 'none';
  }
}

function openSavedDrawer() {
  renderSavedBaskets();
  savedDrawer.classList.add('open');
  savedOverlay.classList.add('open');
}
function closeSavedDrawer() {
  savedDrawer.classList.remove('open');
  savedOverlay.classList.remove('open');
}

savedBasketsBtn?.addEventListener('click', openSavedDrawer);
savedClose?.addEventListener('click', closeSavedDrawer);
savedOverlay?.addEventListener('click', closeSavedDrawer);

function renderSavedBaskets() {
  savedBasketsList.querySelectorAll('.saved-basket-card').forEach(el => el.remove());

  if (savedBaskets.length === 0) {
    savedEmpty.style.display = 'flex';
    return;
  }
  savedEmpty.style.display = 'none';

  savedBaskets.forEach(basket => {
    const card = document.createElement('div');
    card.className = 'saved-basket-card';
    card.innerHTML = `
      <div class="saved-basket-header">
        <div>
          <div class="saved-basket-name">\${basket.name}</div>
          <div class="saved-basket-meta">Saved \${basket.date} · \${basket.items.length} item\${basket.items.length !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <div class="saved-basket-body">
        <div class="saved-basket-preview">\${basket.preview}</div>
        <div class="saved-basket-total">\${basket.total}</div>
        <div class="saved-basket-actions">
          <button class="saved-restore-btn" data-id="\${basket.id}">Restore to basket</button>
          <button class="saved-delete-btn" data-id="\${basket.id}">Delete</button>
        </div>
      </div>
    `;

    card.querySelector('.saved-restore-btn').addEventListener('click', () => {
      cart = basket.items.map(i => ({ ...i }));
      renderCart();
      closeSavedDrawer();
      openCart();
      showToast('"' + basket.name + '" restored to basket');
    });

    card.querySelector('.saved-delete-btn').addEventListener('click', () => {
      savedBaskets = savedBaskets.filter(b => b.id !== basket.id);
      updateSavedBadge();
      renderSavedBaskets();
    });

    savedBasketsList.insertBefore(card, savedEmpty);
  });
}

// ── ORDER HISTORY ─────────────────────────────────────────────────
const ORDER_STATUS = {
  processing: { label: 'Processing',     cls: 'badge-info',      icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>' },
  ready:      { label: 'Ready to ship',  cls: 'badge-warn',      icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>' },
  fulfilled:  { label: 'Fulfilled',      cls: 'badge-approved',  icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' },
};

function renderOrders() {
  if (!ordersList) return;
  ordersList.innerHTML = '';

  ORDER_HISTORY.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';
    const st = ORDER_STATUS[order.status] || ORDER_STATUS.fulfilled;

    const linesHtml = order.items.map(item => {
      const imgTag = item.img ? '<img src="' + item.img + '" alt="' + item.name + '" style="max-width:100%;max-height:100%;object-fit:contain;">' : '';
      return '<div class="order-line">' +
        '<div class="ol-thumb">' + imgTag + '</div>' +
        '<div class="ol-qty">' + item.qty + '×</div>' +
        '<div class="ol-name">' + item.name + '</div>' +
        '<div class="ol-price">' + item.price + '</div>' +
        '</div>';
    }).join('');

    // Status-specific detail rows
    const trackingHtml = order.tracking
      ? '<div class="order-detail-row"><span class="order-detail-label">Tracking</span><a class="order-tracking-link" href="#" onclick="return false;">' + order.tracking + '</a></div>'
      : '';
    const etaHtml = order.eta
      ? '<div class="order-detail-row"><span class="order-detail-label">ETA</span><span class="order-detail-val">' + order.eta + '</span></div>'
      : '';
    const poHtml = order.po
      ? '<div class="order-detail-row"><span class="order-detail-label">PO</span><span class="order-detail-val">' + order.po + '</span></div>'
      : '';
    const noteHtml = order.note
      ? '<div class="order-note">' + order.note + '</div>'
      : '';

    // Progress bar steps
    const steps = ['Order placed', 'Processing', 'Ready to ship', 'Delivered'];
    const stepIdx = { processing: 1, ready: 2, fulfilled: 3 }[order.status] ?? 3;
    const progressHtml = '<div class="order-progress">' +
      steps.map((s, i) => {
        const done    = i < stepIdx;
        const current = i === stepIdx;
        return '<div class="order-step' + (done ? ' done' : '') + (current ? ' current' : '') + '">' +
          '<div class="order-step-dot"></div>' +
          '<div class="order-step-label">' + s + '</div>' +
          '</div>';
      }).join('<div class="order-step-line' + '"></div>') +
      '</div>';

    // Reorder only for fulfilled orders
    const actionHtml = order.status === 'fulfilled'
      ? '<button class="btn-secondary order-reorder-btn" style="font-size:11px;padding:6px 14px;" data-reorder-ref="' + order.ref + '">Reorder</button>'
      : order.status === 'ready'
        ? '<span class="order-dispatch-note">Contact your MSP to arrange delivery</span>'
        : '<span class="order-dispatch-note">Your MSP is preparing this order</span>';

    card.innerHTML =
      '<div class="order-card-header">' +
        '<div class="order-meta">' +
          '<div class="order-ref">' + order.ref + '</div>' +
          '<div class="order-date">' + order.date + '</div>' +
        '</div>' +
        '<div class="order-right">' +
          '<div class="order-total">' + order.total + '</div>' +
          '<span class="badge ' + st.cls + '" style="display:inline-flex;align-items:center;gap:4px;">' + st.icon + st.label + '</span>' +
          '<svg class="order-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
        '</div>' +
      '</div>' +
      '<div class="order-card-body">' +
        progressHtml +
        '<div class="order-details">' +
          poHtml + trackingHtml + etaHtml +
          '<div class="order-detail-row"><span class="order-detail-label">Ship to</span><span class="order-detail-val">' + order.shipped + '</span></div>' +
        '</div>' +
        noteHtml +
        '<div class="order-lines">' + linesHtml + '</div>' +
        '<div class="order-footer">' +
          actionHtml +
        '</div>' +
      '</div>';

    card.querySelector('.order-card-header').addEventListener('click', () => {
      card.classList.toggle('open');
    });

    const reorderBtn = card.querySelector('[data-reorder-ref]');
    if (reorderBtn) {
      reorderBtn.addEventListener('click', e => {
        e.stopPropagation();
        order.items.forEach(item => {
          const product = PRODUCTS.find(p => p.name === item.name);
          if (product) for (let i = 0; i < item.qty; i++) addToCart(product.id);
        });
        document.querySelector('[data-tab="shop"]').click();
        showCartSnackbar('Items from ' + order.ref + ' added');
      });
    }

    ordersList.appendChild(card);
  });
}

// Order modal close
orderModalClose.addEventListener('click', () => { orderModalBackdrop.style.display = 'none'; });
orderModalBackdrop.addEventListener('click', e => { if (e.target === orderModalBackdrop) orderModalBackdrop.style.display = 'none'; });

// ── GLOBAL PAYMENTS MODAL ─────────────────────────────────────────
function openPayModal() {
  // Set amount
  const shipping = SHIPPING_COSTS[shippingSelect.value] || 12;
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + (subtotal * TAX_RATE) + shipping;
  payModalTotal.textContent = fmt(total);
  payBtnAmount.textContent  = fmt(total);

  // Reset form state
  payForm.style.display      = 'flex';
  payProcessing.style.display = 'none';
  payError.style.display     = 'none';
  payCardNum.value = payExpiry.value = payCvv.value = payZip.value = payName.value = '';
  payCardType.textContent = '';
  payCardType.className = 'pay-card-type';
  [payCardNum, payExpiry, payCvv, payZip, payName].forEach(el => el.classList.remove('error'));
  paySubmitBtn.disabled = false;
  paySubmitBtn.querySelector('#paySubmitLabel').style.display = '';

  payModalBackdrop.style.display = 'flex';
}

function closePayModal() {
  payModalBackdrop.style.display = 'none';
}

payModalClose.addEventListener('click', closePayModal);
payModalBackdrop.addEventListener('click', e => { if (e.target === payModalBackdrop) closePayModal(); });

// ── CARD NUMBER FORMATTING + TYPE DETECTION ───────────────────────
payCardNum.addEventListener('input', e => {
  let val = e.target.value.replace(/\D/g, '').slice(0, 16);
  // Format with spaces every 4 digits
  val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
  e.target.value = val;
  detectCardType(val.replace(/\s/g, ''));
});

function detectCardType(num) {
  payCardType.className = 'pay-card-type';
  if (/^4/.test(num))          { payCardType.textContent = 'VISA';  payCardType.classList.add('visa'); }
  else if (/^5[1-5]/.test(num)) { payCardType.textContent = 'MC';    payCardType.classList.add('mc'); }
  else if (/^3[47]/.test(num))  { payCardType.textContent = 'AMEX';  payCardType.classList.add('amex'); }
  else                           { payCardType.textContent = ''; }
}

// Expiry formatting
payExpiry.addEventListener('input', e => {
  let val = e.target.value.replace(/\D/g, '').slice(0, 4);
  if (val.length >= 3) val = val.slice(0,2) + ' / ' + val.slice(2);
  e.target.value = val;
});

// CVV — numbers only
payCvv.addEventListener('input', e => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

// ZIP — numbers only
payZip.addEventListener('input', e => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
});

// ── PAYMENT SUBMISSION ────────────────────────────────────────────
paySubmitBtn.addEventListener('click', () => {
  payError.style.display = 'none';
  let valid = true;

  // Basic validation
  const name  = payName.value.trim();
  const num   = payCardNum.value.replace(/\s/g, '');
  const exp   = payExpiry.value.trim();
  const cvv   = payCvv.value.trim();
  const zip   = payZip.value.trim();

  if (!name)         { payName.classList.add('error');    valid = false; }
  else               { payName.classList.remove('error'); }

  if (num.length < 13) { payCardNum.classList.add('error');  valid = false; }
  else                  { payCardNum.classList.remove('error'); }

  if (!/^\d{2} \/ \d{2}$/.test(exp)) { payExpiry.classList.add('error');  valid = false; }
  else                               { payExpiry.classList.remove('error'); }

  if (cvv.length < 3) { payCvv.classList.add('error');  valid = false; }
  else                { payCvv.classList.remove('error'); }

  if (zip.length < 4) { payZip.classList.add('error');  valid = false; }
  else                { payZip.classList.remove('error'); }

  if (!valid) {
    payError.textContent = 'Please check the highlighted fields and try again.';
    payError.style.display = 'block';
    return;
  }

  // Show processing
  payForm.style.display       = 'none';
  payProcessing.style.display = 'flex';

  // Simulate processing delay then succeed
  setTimeout(() => {
    closePayModal();
    completeOrder();
  }, 2800);
});

// ── QUOTES ────────────────────────────────────────────────────────
function renderQuotes() {
  quotesList.innerHTML = '';
  const list = QUOTES[currentQuoteTab] || [];

  if (list.length === 0) {
    quotesList.innerHTML = '<div style="padding:32px;color:var(--text-3);font-family:\'JetBrains Mono\',monospace;font-size:13px;">No quotes in this category.</div>';
    return;
  }

  list.forEach(q => {
    const card = document.createElement('div');
    card.className = 'quote-card';

    const badgeClass = { pending: 'badge-pending', approved: 'badge-approved', declined: 'badge-declined' }[currentQuoteTab];
    const badgeText  = { pending: 'Pending', approved: 'Approved', declined: 'Declined' }[currentQuoteTab];

    const linesHtml = q.items.map(i =>
      `<div class="quote-line">
        <div class="ql-qty">${i.qty}×</div>
        <div class="ql-name">${i.name}</div>
        <div class="ql-price">${i.price}</div>
      </div>`
    ).join('');

    const actionsHtml = currentQuoteTab === 'pending' ? `
      <button class="btn-accent" onclick="showToast('Quote approved — sent to Salesbuildr')">Approve</button>
      <button class="btn-secondary" onclick="showToast('Quote declined')">Decline</button>
    ` : currentQuoteTab === 'approved' ? `
      <button class="btn-secondary" onclick="showToast('Reorder added to basket')">Reorder</button>
    ` : `
      <button class="btn-secondary" onclick="showToast('Quote resubmitted for approval')">Resubmit</button>
    `;

    card.innerHTML = `
      <div class="quote-card-header">
        <div class="quote-meta">
          <div class="quote-ref">${q.ref}</div>
          <div class="quote-date">${q.date}</div>
        </div>
        <div class="quote-right">
          <div class="quote-total">${q.total}</div>
          <span class="badge ${badgeClass}">${badgeText}</span>
          <svg class="quote-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div class="quote-card-body">
        <div class="quote-lines">${linesHtml}</div>
        <div style="font-size:12px;color:var(--text-3);margin-bottom:12px;font-family:'Inter',sans-serif;">${q.note}</div>
        <div class="quote-actions">${actionsHtml}</div>
      </div>
    `;

    card.querySelector('.quote-card-header').addEventListener('click', () => {
      card.classList.toggle('open');
    });

    quotesList.appendChild(card);
  });
}

// Quotes sub-tabs
document.querySelectorAll('.qtab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.qtab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentQuoteTab = btn.dataset.qtab;
    renderQuotes();
  });
});

// ── AI ASSISTANT ──────────────────────────────────────────────────
function openAiPanel() {
  aiPanel.classList.add('open');
  aiOverlay.classList.add('open');
  aiInput.focus();
}

function closeAiPanel() {
  aiPanel.classList.remove('open');
  aiOverlay.classList.remove('open');
}

aiToggleBtn.addEventListener('click', openAiPanel);
heroAiBtn.addEventListener('click', openAiPanel);
aiClose.addEventListener('click', closeAiPanel);
aiOverlay.addEventListener('click', closeAiPanel);

// Quick prompts
document.querySelectorAll('.ai-quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    aiInput.value = btn.dataset.prompt;
    aiQuickPrompts.style.display = 'none';
    sendAiMessage();
  });
});

aiSendBtn.addEventListener('click', sendAiMessage);
aiInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(); }
});

function appendAiMessage(role, content) {
  const div = document.createElement('div');
  div.className = 'ai-message ai-msg-' + role;
  div.innerHTML = `<div class="ai-msg-content">${content}</div>`;
  aiChat.appendChild(div);
  aiChat.scrollTop = aiChat.scrollHeight;
  return div;
}

function appendTyping() {
  const div = document.createElement('div');
  div.className = 'ai-message ai-msg-typing';
  div.innerHTML = `<div class="ai-msg-content"><div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  aiChat.appendChild(div);
  aiChat.scrollTop = aiChat.scrollHeight;
  return div;
}

async function sendAiMessage() {
  const msg = aiInput.value.trim();
  if (!msg) return;

  aiInput.value = '';
  aiSendBtn.disabled = true;
  aiQuickPrompts.style.display = 'none';

  appendAiMessage('user', msg);
  const typingEl = appendTyping();

  // Build product catalog summary for Claude
  const catalog = PRODUCTS.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    shortDesc: p.shortDesc,
    cpu: p.cpu,
    ram: p.ram,
    weight: p.weight,
    display: p.display,
    battery: p.battery
  }));

  const systemPrompt = `You are a helpful IT procurement assistant for Acme Corp's internal technology store. Your job is to help employees find the right technology products from their company's approved catalog.

The product catalog is:
${JSON.stringify(catalog, null, 2)}

When a user describes what they need, recommend specific products from the catalog by their exact ID. 
Respond in JSON with this exact format:
{
  "message": "Your helpful response in plain text (no markdown)",
  "recommendedIds": ["product-id-1", "product-id-2"],
  "filterTitle": "Short title for what you found, e.g. 'Best for remote workers'",
  "filterSub": "Short explanation, e.g. 'Based on your budget and requirements'"
}

Keep message conversational and under 80 words. Always recommend at least 1 product. Recommend up to 4 products max.
Return ONLY the JSON object, nothing else.`;

  // Maintain conversation history
  aiConversation.push({ role: 'user', content: msg });

  try {
    const response = await fetch('/api/ai-shop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: systemPrompt,
        messages: aiConversation
      })
    });

    const data = await response.json();
    typingEl.remove();

    if (!data.ok) {
      appendAiMessage('assistant', 'Sorry, I couldn\'t connect to the AI service right now. Please try again in a moment.');
      aiSendBtn.disabled = false;
      return;
    }

    let parsed;
    try {
      const raw = data.content[0].text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        message: data.content[0].text,
        recommendedIds: [],
        filterTitle: 'AI recommendations',
        filterSub: ''
      };
    }

    // Add assistant reply to history
    aiConversation.push({ role: 'assistant', content: data.content[0].text });

    appendAiMessage('assistant', parsed.message);

    // Apply product filter if IDs returned
    if (parsed.recommendedIds && parsed.recommendedIds.length > 0) {
      aiFilteredIds = parsed.recommendedIds;
      aiResultTitle.textContent = parsed.filterTitle || 'AI recommendations';
      aiResultSub.textContent = parsed.filterSub || '';
      aiResultBanner.style.display = 'flex';
      renderProductGrid();

      // Show a "View results" action in the chat — don't auto-close
      const resultMsg = document.createElement('div');
      resultMsg.className = 'ai-message';
      resultMsg.innerHTML = `
        <div class="ai-result-action">
          <span class="ai-result-count">${parsed.recommendedIds.length} product${parsed.recommendedIds.length !== 1 ? 's' : ''} found</span>
          <button class="ai-view-results-btn" id="aiViewResultsBtn">View results →</button>
        </div>
      `;
      resultMsg.querySelector('#aiViewResultsBtn').addEventListener('click', closeAiPanel);
      aiChat.appendChild(resultMsg);
      aiChat.scrollTop = aiChat.scrollHeight;
    }

  } catch (err) {
    typingEl.remove();
    appendAiMessage('assistant', 'Sorry, I couldn\'t connect to the AI service right now. Please try again in a moment.');
    console.error('AI error:', err);
  }

  aiSendBtn.disabled = false;
}


// ── ACCORDION TOGGLES ─────────────────────────────────────────────
document.addEventListener('click', e => {
  const header = e.target.closest('[data-toggle]');
  if (!header) return;
  const blockId = header.dataset.toggle;
  const block = document.getElementById(blockId);
  if (block) block.classList.toggle('open');
});

// ── INIT ──────────────────────────────────────────────────────────
function init() {
  renderProductGrid();
  renderCart();
}

init();
