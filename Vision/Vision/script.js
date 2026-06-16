'use strict';

/* ============================================================================
 * VISION — Premium Eyewear · script.js
 * ----------------------------------------------------------------------------
 * Single-file application logic for the Vision static front-end (SPEC §6).
 * Vanilla ES6, no frameworks. One `App` namespace exposing module objects:
 * Utils, Theme, Router, UI, Store, Home, Shop, ProductModal, Constructor,
 * Cart, Checkout, Newsletter.
 *
 * Loaded with `defer` from index.html; works over file:// (no fetch calls).
 * ==========================================================================*/

const App = (function () {

  /* ==========================================================================
   * §6.1 CONSTANTS
   * ========================================================================*/

  /** Sales tax rate applied to cart subtotal. OWNER TODO: adjust to your
   *  real tax handling / jurisdiction. */
  const TAX_RATE = 0.08;

  /** Flat shipping fee used at checkout when below the free-shipping minimum. */
  const SHIPPING_FLAT = 9.99;

  /** Subtotal threshold (USD) at/above which checkout shipping is free. */
  const FREE_SHIPPING_MIN = 150;

  /* localStorage keys (shared with the head theme-bootstrap snippet). */
  const LS_THEME = 'vision-theme';
  const LS_CART = 'vision-cart';
  const LS_WISHLIST = 'vision-wishlist';

  /* ==========================================================================
   * MODULE: Utils
   * Small generic helpers shared by every other module.
   * ========================================================================*/
  const Utils = {

    /** Currency formatter (shared instance). */
    _fmt: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),

    /**
     * Format a number as USD currency, e.g. 149 -> "$149.00".
     * @param {number} n
     * @returns {string}
     */
    money(n) {
      return Utils._fmt.format(n);
    },

    /**
     * Debounce: returns a wrapper that delays `fn` until `wait` ms have
     * passed without another call (used for the shop search box).
     * @param {Function} fn
     * @param {number} wait milliseconds
     * @returns {Function}
     */
    debounce(fn, wait) {
      let t = null;
      return function (...args) {
        window.clearTimeout(t);
        t = window.setTimeout(() => fn.apply(this, args), wait);
      };
    },

    /**
     * Slugify a label for asset filenames: 'Cat Eye' -> 'cat-eye'.
     * @param {string} str
     * @returns {string}
     */
    slug(str) {
      return String(str).trim().toLowerCase().replace(/\s+/g, '-');
    },

    /**
     * Escape a string for safe interpolation into innerHTML templates.
     * @param {string} str
     * @returns {string}
     */
    esc(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /**
     * Clamp a number into [min, max].
     * @param {number} n
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    clamp(n, min, max) {
      return Math.min(max, Math.max(min, n));
    },

    /** Shorthand query helpers. */
    $(sel, ctx) { return (ctx || document).querySelector(sel); },
    $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); },

    /**
     * Basic email shape validation (demo-grade, UI only).
     * @param {string} v
     * @returns {boolean}
     */
    isEmail(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
    }
  };

  /* ==========================================================================
   * PRODUCT CATALOG — expanded verbatim from SPEC §3 (24 items).
   * --------------------------------------------------------------------------
   * OWNER TODO (applies to EVERY product below):
   *   - `rating` and `popularity` are sample placeholder data — replace with
   *     real review ratings and sales metrics.
   *   - `specs` measurements are plausible placeholders — replace with the
   *     real measured dimensions and weight for each frame.
   * Descriptions are neutral product copy with no company claims.
   * ========================================================================*/
  const PRODUCTS = [
    {
      id: 'p01', name: 'Aster Round', frameType: 'Round', material: 'Metal',
      lensType: 'Blue Light', gender: 'Unisex', color: 'Gold',
      frameHex: '#c9a227', lensHex: '#dce8f5', price: 149,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.6, popularity: 87,
      dateAdded: '2025-09-14', featured: true,
      image: 'assets/products/p01.svg',
      description: 'A slim gold-tone metal round frame paired with blue-light filtering lenses. Light on the face and easy to wear through long screen days.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '136 mm', lensWidth: '50 mm', bridge: '21 mm', templeLength: '145 mm', weight: '19 g' }
    },
    {
      id: 'p02', name: 'Meridian Round', frameType: 'Round', material: 'Titanium',
      lensType: 'Clear', gender: 'Men', color: 'Silver',
      frameHex: '#c0c4c8', lensHex: '#e8eef0', price: 219,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.8, popularity: 91,
      dateAdded: '2025-07-22', featured: false,
      image: 'assets/products/p02.svg',
      description: 'Brushed titanium rounds with clear lenses and a barely-there feel. A clean, durable choice for everyday wear.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '138 mm', lensWidth: '51 mm', bridge: '20 mm', templeLength: '145 mm', weight: '16 g' }
    },
    {
      id: 'p03', name: 'Orbit Round', frameType: 'Round', material: 'Plastic',
      lensType: 'Sunglasses', gender: 'Women', color: 'Brown',
      frameHex: '#6b4a2f', lensHex: '#5a4634', price: 119,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.3, popularity: 64,
      dateAdded: '2026-01-18', featured: false,
      image: 'assets/products/p03.svg',
      description: 'Warm brown rounds with tinted sun lenses and a relaxed retro profile. An easy companion for bright days.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '140 mm', lensWidth: '52 mm', bridge: '19 mm', templeLength: '147 mm', weight: '24 g' }
    },
    {
      id: 'p04', name: 'Lumen Round', frameType: 'Round', material: 'Carbon Fiber',
      lensType: 'Photochromic', gender: 'Unisex', color: 'Black',
      frameHex: '#1c1c1e', lensHex: '#8a93a0', price: 289,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.7, popularity: 73,
      dateAdded: '2026-03-05', featured: false,
      image: 'assets/products/p04.svg',
      description: 'Matte black carbon-fiber rounds with photochromic lenses that darken outdoors and clear up inside. Built light and rigid.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '137 mm', lensWidth: '50 mm', bridge: '20 mm', templeLength: '145 mm', weight: '17 g' }
    },
    {
      id: 'p05', name: 'Halcyon Square', frameType: 'Square', material: 'Plastic',
      lensType: 'Clear', gender: 'Men', color: 'Black',
      frameHex: '#1c1c1e', lensHex: '#e8eef0', price: 99,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.4, popularity: 82,
      dateAdded: '2025-06-30', featured: false,
      image: 'assets/products/p05.svg',
      description: 'A bold black square frame with clear lenses and a confident, modern line. An easy staple at an accessible price.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '142 mm', lensWidth: '54 mm', bridge: '18 mm', templeLength: '148 mm', weight: '26 g' }
    },
    {
      id: 'p06', name: 'Vertex Square', frameType: 'Square', material: 'Metal',
      lensType: 'Blue Light', gender: 'Unisex', color: 'Silver',
      frameHex: '#c0c4c8', lensHex: '#dce8f5', price: 159,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.5, popularity: 58,
      dateAdded: '2025-10-09', featured: false,
      image: 'assets/products/p06.svg',
      description: 'Sharp silver metal squares with blue-light filtering lenses. Slim temples keep the look refined.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '140 mm', lensWidth: '53 mm', bridge: '19 mm', templeLength: '145 mm', weight: '22 g' }
    },
    {
      id: 'p07', name: 'Monolith Square', frameType: 'Square', material: 'Carbon Fiber',
      lensType: 'Polarized', gender: 'Men', color: 'Black',
      frameHex: '#26262a', lensHex: '#3f4f48', price: 309,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.9, popularity: 95,
      dateAdded: '2025-08-15', featured: true,
      image: 'assets/products/p07.svg',
      description: 'An angular carbon-fiber square with deep green polarized lenses. Strong, featherweight construction for serious sun.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '143 mm', lensWidth: '55 mm', bridge: '18 mm', templeLength: '150 mm', weight: '19 g' }
    },
    {
      id: 'p08', name: 'Quarry Square', frameType: 'Square', material: 'Plastic',
      lensType: 'Sunglasses', gender: 'Women', color: 'White',
      frameHex: '#f2f0eb', lensHex: '#555a60', price: 129,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.2, popularity: 47,
      dateAdded: '2026-02-21', featured: false,
      image: 'assets/products/p08.svg',
      description: 'Crisp white square frames with smoky sun lenses. A graphic, fashion-forward statement piece.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '141 mm', lensWidth: '54 mm', bridge: '18 mm', templeLength: '148 mm', weight: '25 g' }
    },
    {
      id: 'p09', name: 'Stratos Aviator', frameType: 'Aviator', material: 'Metal',
      lensType: 'Polarized', gender: 'Men', color: 'Gold',
      frameHex: '#c9a227', lensHex: '#33506e', price: 199,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.7, popularity: 89,
      dateAdded: '2025-07-04', featured: false,
      image: 'assets/products/p09.svg',
      description: 'A classic gold aviator with blue polarized lenses and a double-bridge profile. Cuts glare on the road and on the water.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '144 mm', lensWidth: '56 mm', bridge: '17 mm', templeLength: '148 mm', weight: '23 g' }
    },
    {
      id: 'p10', name: 'Zephyr Aviator', frameType: 'Aviator', material: 'Titanium',
      lensType: 'Sunglasses', gender: 'Unisex', color: 'Silver',
      frameHex: '#c0c4c8', lensHex: '#555a60', price: 249,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.6, popularity: 76,
      dateAdded: '2025-11-27', featured: false,
      image: 'assets/products/p10.svg',
      description: 'Featherlight titanium aviators with neutral gray sun lenses. A timeless teardrop shape in modern materials.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '145 mm', lensWidth: '57 mm', bridge: '16 mm', templeLength: '150 mm', weight: '17 g' }
    },
    {
      id: 'p11', name: 'Altair Aviator', frameType: 'Aviator', material: 'Metal',
      lensType: 'Photochromic', gender: 'Men', color: 'Brown',
      frameHex: '#6b4a2f', lensHex: '#8a93a0', price: 229,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.5, popularity: 61,
      dateAdded: '2026-04-02', featured: false,
      image: 'assets/products/p11.svg',
      description: 'Warm bronze-brown aviators with adaptive photochromic lenses. One pair that moves seamlessly between indoors and out.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '144 mm', lensWidth: '56 mm', bridge: '17 mm', templeLength: '148 mm', weight: '24 g' }
    },
    {
      id: 'p12', name: 'Corsair Aviator', frameType: 'Aviator', material: 'Carbon Fiber',
      lensType: 'Polarized', gender: 'Unisex', color: 'Black',
      frameHex: '#1c1c1e', lensHex: '#3f4f48', price: 329,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.8, popularity: 84,
      dateAdded: '2025-09-30', featured: true,
      image: 'assets/products/p12.svg',
      description: 'A stealthy black carbon-fiber aviator with green polarized lenses. Rigid, ultralight, and glare-free.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '145 mm', lensWidth: '58 mm', bridge: '16 mm', templeLength: '150 mm', weight: '20 g' }
    },
    {
      id: 'p13', name: 'Ledger Rectangle', frameType: 'Rectangle', material: 'Plastic',
      lensType: 'Blue Light', gender: 'Men', color: 'Black',
      frameHex: '#1c1c1e', lensHex: '#dce8f5', price: 109,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.3, popularity: 71,
      dateAdded: '2025-08-08', featured: false,
      image: 'assets/products/p13.svg',
      description: 'A slim black rectangle with blue-light filtering lenses. A no-fuss desk-to-dinner frame.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '138 mm', lensWidth: '52 mm', bridge: '19 mm', templeLength: '145 mm', weight: '21 g' }
    },
    {
      id: 'p14', name: 'Axiom Rectangle', frameType: 'Rectangle', material: 'Metal',
      lensType: 'Clear', gender: 'Unisex', color: 'Silver',
      frameHex: '#c0c4c8', lensHex: '#e8eef0', price: 139,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.4, popularity: 55,
      dateAdded: '2025-12-12', featured: false,
      image: 'assets/products/p14.svg',
      description: 'Minimal silver rectangles with clear lenses and clean lines. Understated enough to disappear into any look.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '137 mm', lensWidth: '51 mm', bridge: '20 mm', templeLength: '143 mm', weight: '20 g' }
    },
    {
      id: 'p15', name: 'Parallel Rectangle', frameType: 'Rectangle', material: 'Titanium',
      lensType: 'Blue Light', gender: 'Women', color: 'Gold',
      frameHex: '#c9a227', lensHex: '#dce8f5', price: 209,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.6, popularity: 66,
      dateAdded: '2026-01-29', featured: false,
      image: 'assets/products/p15.svg',
      description: 'Refined gold titanium rectangles with blue-light filtering lenses. Light weight with a precise, tailored fit.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '136 mm', lensWidth: '50 mm', bridge: '20 mm', templeLength: '143 mm', weight: '15 g' }
    },
    {
      id: 'p16', name: 'Drafter Rectangle', frameType: 'Rectangle', material: 'Plastic',
      lensType: 'Clear', gender: 'Men', color: 'Brown',
      frameHex: '#6b4a2f', lensHex: '#e8eef0', price: 89,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.1, popularity: 43,
      dateAdded: '2025-06-12', featured: false,
      image: 'assets/products/p16.svg',
      description: 'A warm brown rectangular frame with clear lenses. Simple, dependable, and easy on the budget.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '139 mm', lensWidth: '53 mm', bridge: '18 mm', templeLength: '145 mm', weight: '23 g' }
    },
    {
      id: 'p17', name: 'Felina Cat Eye', frameType: 'Cat Eye', material: 'Plastic',
      lensType: 'Sunglasses', gender: 'Women', color: 'Black',
      frameHex: '#1c1c1e', lensHex: '#555a60', price: 139,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.7, popularity: 88,
      dateAdded: '2025-07-19', featured: false,
      image: 'assets/products/p17.svg',
      description: 'A sculpted black cat-eye with smoky sun lenses. Vintage attitude with a modern, wearable lift.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '141 mm', lensWidth: '53 mm', bridge: '18 mm', templeLength: '145 mm', weight: '24 g' }
    },
    {
      id: 'p18', name: 'Riviera Cat Eye', frameType: 'Cat Eye', material: 'Metal',
      lensType: 'Sunglasses', gender: 'Women', color: 'Gold',
      frameHex: '#c9a227', lensHex: '#5a4634', price: 179,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.6, popularity: 79,
      dateAdded: '2025-10-25', featured: true,
      image: 'assets/products/p18.svg',
      description: 'Gold-wire cat-eyes with warm brown sun lenses. An elegant upswept profile made for golden hour.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '139 mm', lensWidth: '52 mm', bridge: '19 mm', templeLength: '143 mm', weight: '21 g' }
    },
    {
      id: 'p19', name: 'Vesper Cat Eye', frameType: 'Cat Eye', material: 'Plastic',
      lensType: 'Blue Light', gender: 'Women', color: 'White',
      frameHex: '#f2f0eb', lensHex: '#dce8f5', price: 119,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.4, popularity: 52,
      dateAdded: '2026-02-07', featured: false,
      image: 'assets/products/p19.svg',
      description: 'A soft white cat-eye with blue-light filtering lenses. A playful shape with practical everyday lenses.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '140 mm', lensWidth: '53 mm', bridge: '18 mm', templeLength: '145 mm', weight: '23 g' }
    },
    {
      id: 'p20', name: 'Soiree Cat Eye', frameType: 'Cat Eye', material: 'Titanium',
      lensType: 'Photochromic', gender: 'Women', color: 'Brown',
      frameHex: '#6b4a2f', lensHex: '#8a93a0', price: 259,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.8, popularity: 69,
      dateAdded: '2025-12-03', featured: false,
      image: 'assets/products/p20.svg',
      description: 'Brown titanium cat-eyes with adaptive photochromic lenses. Polished detail with all-day comfort.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '138 mm', lensWidth: '52 mm', bridge: '19 mm', templeLength: '143 mm', weight: '16 g' }
    },
    {
      id: 'p21', name: 'Aether Rimless', frameType: 'Rimless', material: 'Titanium',
      lensType: 'Clear', gender: 'Unisex', color: 'Silver',
      frameHex: '#c0c4c8', lensHex: '#e8eef0', price: 239,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.7, popularity: 74,
      dateAdded: '2025-09-01', featured: false,
      image: 'assets/products/p21.svg',
      description: 'A barely-visible rimless design on silver titanium hardware with clear lenses. Minimalism at its lightest.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '134 mm', lensWidth: '50 mm', bridge: '19 mm', templeLength: '140 mm', weight: '12 g' }
    },
    {
      id: 'p22', name: 'Featherlight Rimless', frameType: 'Rimless', material: 'Titanium',
      lensType: 'Blue Light', gender: 'Unisex', color: 'Gold',
      frameHex: '#c9a227', lensHex: '#dce8f5', price: 269,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.8, popularity: 81,
      dateAdded: '2025-11-11', featured: false,
      image: 'assets/products/p22.svg',
      description: 'Gold titanium rimless frames with blue-light filtering lenses. Nearly weightless and quietly refined.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '135 mm', lensWidth: '51 mm', bridge: '18 mm', templeLength: '142 mm', weight: '13 g' }
    },
    {
      id: 'p23', name: 'Halo Rimless', frameType: 'Rimless', material: 'Metal',
      lensType: 'Photochromic', gender: 'Women', color: 'Blue',
      frameHex: '#2e4a6b', lensHex: '#8a93a0', price: 199,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.5, popularity: 59,
      dateAdded: '2026-04-20', featured: false,
      image: 'assets/products/p23.svg',
      description: 'A rimless silhouette on slate-blue metal hardware with photochromic lenses. Subtle color, adaptable tint.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '136 mm', lensWidth: '51 mm', bridge: '19 mm', templeLength: '142 mm', weight: '15 g' }
    },
    {
      id: 'p24', name: 'Mirage Rimless', frameType: 'Rimless', material: 'Carbon Fiber',
      lensType: 'Sunglasses', gender: 'Men', color: 'Blue',
      frameHex: '#2e4a6b', lensHex: '#33506e', price: 299,
      // OWNER TODO: replace sample rating/popularity with real data.
      rating: 4.6, popularity: 68,
      dateAdded: '2026-05-06', featured: false,
      image: 'assets/products/p24.svg',
      description: 'Rimless sun lenses in deep blue mounted on carbon-fiber hardware. Open, airy, and shaded from glare.',
      // OWNER TODO: replace with this frame's real measurements.
      specs: { frameWidth: '137 mm', lensWidth: '52 mm', bridge: '18 mm', templeLength: '145 mm', weight: '14 g' }
    }
  ];

  /* ==========================================================================
   * MODULE: Store
   * Catalog access, derived collections (computed — never stored as flags),
   * and the persisted wishlist.
   * ========================================================================*/
  const Store = {

    /** @type {Set<string>} product ids currently wishlisted */
    wishlist: new Set(),

    /* Lazy caches for badge lookups (built on first use). */
    _bestSellerIds: null,
    _newArrivalIds: null,

    /** Load persisted wishlist from localStorage. */
    init() {
      try {
        const raw = JSON.parse(localStorage.getItem(LS_WISHLIST));
        Store.wishlist = new Set(Array.isArray(raw) ? raw : []);
      } catch (err) {
        Store.wishlist = new Set();
      }
    },

    /** @returns {Array<Object>} full catalog */
    all() { return PRODUCTS; },

    /**
     * Find a product by id.
     * @param {string} id
     * @returns {Object|undefined}
     */
    byId(id) { return PRODUCTS.find((p) => p.id === id); },

    /** Featured = `featured === true` (4 items). @returns {Array<Object>} */
    featured() {
      return PRODUCTS.filter((p) => p.featured === true);
    },

    /** Best Sellers = top 6 by popularity desc. @returns {Array<Object>} */
    bestSellers() {
      return PRODUCTS.slice().sort((a, b) => b.popularity - a.popularity).slice(0, 6);
    },

    /** New Arrivals = 8 newest by dateAdded desc. @returns {Array<Object>} */
    newArrivals() {
      return PRODUCTS.slice()
        .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
        .slice(0, 8);
    },

    /** @param {string} id @returns {boolean} member of Best Sellers */
    isBestSeller(id) {
      if (!Store._bestSellerIds) {
        Store._bestSellerIds = new Set(Store.bestSellers().map((p) => p.id));
      }
      return Store._bestSellerIds.has(id);
    },

    /** @param {string} id @returns {boolean} member of New Arrivals */
    isNewArrival(id) {
      if (!Store._newArrivalIds) {
        Store._newArrivalIds = new Set(Store.newArrivals().map((p) => p.id));
      }
      return Store._newArrivalIds.has(id);
    },

    /** @param {string} id @returns {boolean} */
    wishlistHas(id) { return Store.wishlist.has(id); },

    /**
     * Toggle wishlist membership and persist.
     * @param {string} id
     * @returns {boolean} new state (true = wishlisted)
     */
    toggleWishlist(id) {
      const on = !Store.wishlist.has(id);
      if (on) Store.wishlist.add(id);
      else Store.wishlist.delete(id);
      try {
        localStorage.setItem(LS_WISHLIST, JSON.stringify(Array.from(Store.wishlist)));
      } catch (err) { /* storage unavailable — wishlist stays in-memory */ }
      return on;
    }
  };

  /* ==========================================================================
   * MODULE: Theme (§6.2)
   * Toggles `data-theme` on <html> and persists the choice. The head
   * bootstrap snippet (§11) already applied the saved theme pre-paint;
   * icon swap is CSS-driven via [data-theme].
   * ========================================================================*/
  const Theme = {

    /** Bind the toggle button. */
    init() {
      const btn = document.getElementById('theme-toggle');
      if (btn) btn.addEventListener('click', Theme.toggle);
    },

    /** Flip light <-> dark, persist to localStorage. */
    toggle() {
      const html = document.documentElement;
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      try {
        localStorage.setItem(LS_THEME, next);
      } catch (err) { /* storage unavailable — theme not persisted */ }
    }
  };

  /* ==========================================================================
   * MODULE: UI (§6.3)
   * Toasts, page loader, star ratings, product-card rendering, reveal
   * animations, navbar behaviors, and delegated card actions.
   * ========================================================================*/
  const UI = {

    /** IntersectionObserver for .reveal elements (created once). */
    _revealObserver: null,

    /** Wire navbar + global delegated listeners. */
    init() {
      UI._initNavbar();
      UI._initCardDelegation();
      UI._initRevealObserver();
    },

    /**
     * Show a toast notification; auto-dismisses after 3.2s.
     * @param {string} msg
     * @param {string} [type='info'] 'info' | 'success'
     */
    toast(msg, type = 'info') {
      const host = document.getElementById('toast-container');
      if (!host) return;
      const el = document.createElement('div');
      el.className = `toast toast--${type}`;
      el.textContent = msg;
      host.appendChild(el);
      // Let CSS animate it in, then fade out (.toast--hide) and remove.
      window.setTimeout(() => {
        el.classList.add('toast--hide');
        window.setTimeout(() => el.remove(), 350);
      }, 3200);
    },

    /**
     * Show/hide the full-screen page loader.
     * @param {boolean} show
     */
    loader(show) {
      const el = document.getElementById('page-loader');
      if (el) el.classList.toggle('visible', Boolean(show));
    },

    /**
     * Layered-stars rating HTML: 5 outline stars with a clipped filled-star
     * layer whose width encodes the score. NOTE: ratings are sample data for
     * the owner to replace with real review scores.
     * @param {number} rating 0..5
     * @returns {string} HTML string
     */
    stars(rating) {
      const pct = Utils.clamp((rating / 5) * 100, 0, 100);
      return (
        `<span class="stars" role="img" aria-label="Rated ${rating} out of 5">` +
        '☆☆☆☆☆' +
        `<span class="stars-fill" aria-hidden="true" style="width:${pct.toFixed(1)}%">` +
        '★★★★★' +
        '</span></span>'
      );
    },

    /**
     * Build a product card element from #tpl-product-card.
     * @param {Object} p product record
     * @returns {HTMLElement}
     */
    productCard(p) {
      const tpl = document.getElementById('tpl-product-card');
      const card = tpl.content.firstElementChild.cloneNode(true);
      card.dataset.id = p.id;

      // Badges — derived collections, computed (not stored on the product).
      const badges = card.querySelector('.card-badges');
      if (Store.isNewArrival(p.id)) {
        badges.insertAdjacentHTML('beforeend', '<span class="badge badge--new">New</span>');
      }
      if (Store.isBestSeller(p.id)) {
        badges.insertAdjacentHTML('beforeend', '<span class="badge badge--bestseller">Best Seller</span>');
      }

      card.querySelector('.card-wish')
        .setAttribute('aria-pressed', String(Store.wishlistHas(p.id)));

      const img = card.querySelector('.card-img');
      img.src = p.image;
      img.alt = `${p.name} — ${p.frameType} frames in ${p.color.toLowerCase()}`;

      card.querySelector('.card-name').textContent = p.name;
      card.querySelector('.card-meta').textContent = `${p.frameType} · ${p.lensType}`;
      card.querySelector('.card-rating').innerHTML =
        UI.stars(p.rating) + `<span class="rating-val">${p.rating.toFixed(1)}</span>`;
      card.querySelector('.card-price').textContent = Utils.money(p.price);
      return card;
    },

    /**
     * Render a list of products into a grid container.
     * @param {HTMLElement|null} container
     * @param {Array<Object>} products
     */
    renderGrid(container, products) {
      if (!container) return;
      const frag = document.createDocumentFragment();
      products.forEach((p) => frag.appendChild(UI.productCard(p)));
      container.innerHTML = '';
      container.appendChild(frag);
      UI.observeReveals();
    },

    /**
     * Sync wishlist button pressed-state everywhere a product appears
     * (home grids, shop grid, and the open modal).
     * @param {string} id product id
     * @param {boolean} on
     */
    syncWish(id, on) {
      Utils.$$(`.product-card[data-id="${id}"] .card-wish`).forEach((btn) => {
        btn.setAttribute('aria-pressed', String(on));
      });
      if (ProductModal.current && ProductModal.current.id === id) {
        const pmWish = document.getElementById('pm-wishlist');
        if (pmWish) pmWish.setAttribute('aria-pressed', String(on));
      }
    },

    /** Create the .reveal IntersectionObserver (once). */
    _initRevealObserver() {
      if (!('IntersectionObserver' in window)) return;
      UI._revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in');
            UI._revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
    },

    /** Observe any not-yet-revealed .reveal elements (call after renders). */
    observeReveals() {
      if (!UI._revealObserver) {
        // No IO support — reveal everything immediately.
        Utils.$$('.reveal:not(.reveal-in)').forEach((el) => el.classList.add('reveal-in'));
        return;
      }
      Utils.$$('.reveal:not(.reveal-in)').forEach((el) => UI._revealObserver.observe(el));
    },

    /** Sticky-glass navbar, hamburger menu, and Information dropdown. */
    _initNavbar() {
      const navbar = document.getElementById('navbar');
      const toggle = document.getElementById('nav-toggle');
      const menu = document.getElementById('nav-menu');
      const infoBtn = document.getElementById('nav-info-btn');

      // Elevation shadow once scrolled past 24px.
      window.addEventListener('scroll', () => {
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 24);
      }, { passive: true });

      // Mobile hamburger.
      if (toggle && menu) {
        toggle.addEventListener('click', () => {
          const open = menu.classList.toggle('open');
          toggle.setAttribute('aria-expanded', String(open));
        });
      }

      // "Information" dropdown.
      if (infoBtn) {
        infoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const dd = infoBtn.closest('.nav-dropdown');
          if (dd) dd.classList.toggle('open');
        });
      }

      // Click outside closes the dropdown.
      document.addEventListener('click', (e) => {
        const dd = Utils.$('.nav-dropdown.open');
        if (dd && !dd.contains(e.target)) dd.classList.remove('open');
      });
    },

    /** Close mobile nav menu + Information dropdown (used by the Router). */
    closeMenus() {
      const menu = document.getElementById('nav-menu');
      const toggle = document.getElementById('nav-toggle');
      if (menu) menu.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      const dd = Utils.$('.nav-dropdown.open');
      if (dd) dd.classList.remove('open');
    },

    /**
     * One delegated click listener handles every product card on the page
     * (quick view, add to cart, wishlist, image click -> modal).
     */
    _initCardDelegation() {
      document.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        if (!card) return;
        const id = card.dataset.id;
        const actionBtn = e.target.closest('[data-action]');

        if (actionBtn && card.contains(actionBtn)) {
          const action = actionBtn.dataset.action;
          if (action === 'quick-view') {
            ProductModal.open(id, actionBtn);
          } else if (action === 'add-cart') {
            Cart.addProduct(id, 1);
          } else if (action === 'wish') {
            const on = Store.toggleWishlist(id);
            UI.syncWish(id, on);
            const p = Store.byId(id);
            UI.toast(on ? `${p.name} added to wishlist` : `${p.name} removed from wishlist`, 'info');
          }
          return;
        }

        // Clicking the product image also opens the quick-view modal.
        if (e.target.closest('.card-img-wrap')) {
          ProductModal.open(id, card.querySelector('[data-action="quick-view"]') || card);
        }
      });
    }
  };

  /* ==========================================================================
   * MODULE: Router (§6.4)
   * Hash-based routing between the §4.2 views. Shows the page loader for at
   * least 250ms, swaps `.view--active`, scrolls to top, updates nav state
   * and document.title (§9), and re-arms reveal animations.
   * ========================================================================*/
  const Router = {

    /** Valid routes (§4.2). */
    ROUTES: [
      'home', 'shop', 'constructor', 'cart', 'checkout', 'about', 'faq',
      'shipping', 'returns', 'lens-guide', 'size-guide', 'contact'
    ],

    /** Route -> document.title (§9). */
    TITLES: {
      'home': 'Vision — Premium Eyewear',
      'shop': 'Vision — Shop',
      'constructor': 'Vision — Glasses Constructor',
      'cart': 'Vision — Your Cart',
      'checkout': 'Vision — Checkout',
      'about': 'Vision — About Us',
      'faq': 'Vision — FAQ',
      'shipping': 'Vision — Shipping Information',
      'returns': 'Vision — Returns & Refunds',
      'lens-guide': 'Vision — Lens Guide',
      'size-guide': 'Vision — Frame Size Guide',
      'contact': 'Vision — Contact'
    },

    /** @type {string} currently active route */
    current: 'home',

    /** Bind hashchange and run the initial route. */
    init() {
      window.addEventListener('hashchange', Router.handle);
      Router.handle();
    },

    /**
     * Resolve the current location.hash to a valid route (fallback 'home').
     * @returns {string}
     */
    parse() {
      const raw = window.location.hash.replace(/^#/, '').trim();
      return Router.ROUTES.indexOf(raw) !== -1 ? raw : 'home';
    },

    /** Handle a (possibly initial) hash change with a >=250ms loader veil. */
    handle() {
      const route = Router.parse();
      UI.loader(true);
      window.setTimeout(() => {
        Router.activate(route);
        UI.loader(false);
      }, 250);
    },

    /**
     * Activate a route: swap views, update chrome, run per-view hooks.
     * @param {string} route
     */
    activate(route) {
      Router.current = route;

      // Only one .view--active at a time.
      Utils.$$('.view').forEach((v) => {
        v.classList.toggle('view--active', v.id === `view-${route}`);
      });

      window.scrollTo({ top: 0 });

      // Highlight the matching nav link (top-level or dropdown).
      Utils.$$('.nav-link').forEach((a) => {
        const target = a.dataset.route || (a.getAttribute('href') || '').replace(/^#/, '');
        a.classList.toggle('active', target === route);
      });

      UI.closeMenus();
      document.title = Router.TITLES[route] || Router.TITLES.home;

      // Per-view refresh hooks (cart/checkout reflect latest cart state).
      if (route === 'cart') Cart.render();
      if (route === 'checkout') Checkout.render();

      UI.observeReveals();
    }
  };

  /* ==========================================================================
   * MODULE: Home (§6.9)
   * Renders the three derived §3 collections into their home-page grids.
   * ========================================================================*/
  const Home = {

    /** Fill Featured / Best Sellers / New Arrivals grids. */
    render() {
      UI.renderGrid(document.getElementById('featured-grid'), Store.featured());
      UI.renderGrid(document.getElementById('bestsellers-grid'), Store.bestSellers());
      UI.renderGrid(document.getElementById('newarrivals-grid'), Store.newArrivals());
    }
  };

  /* ==========================================================================
   * MODULE: Shop (§6.5)
   * Search (debounced 200ms), checkbox filter groups (AND across groups,
   * OR within a group), max-price slider, sorting, and grid rendering.
   * ========================================================================*/
  const Shop = {

    /** Filter/sort state. */
    state: {
      search: '',
      sort: 'popular',
      groups: {
        frameType: new Set(),
        lensType: new Set(),
        gender: new Set(),
        color: new Set()
      },
      maxPrice: 350
    },

    /** Bind toolbar + filter controls, then render the initial grid. */
    init() {
      const search = document.getElementById('search-input');
      const sort = document.getElementById('sort-select');
      const filters = document.getElementById('shop-filters');
      const range = document.getElementById('price-range');
      const clear = document.getElementById('clear-filters');
      const filtersToggle = document.getElementById('filters-toggle');

      if (search) {
        search.addEventListener('input', Utils.debounce(() => {
          Shop.state.search = search.value.trim().toLowerCase();
          Shop.render();
        }, 200));
      }

      if (sort) {
        sort.addEventListener('change', () => {
          Shop.state.sort = sort.value;
          Shop.render();
        });
      }

      // Checkbox filters — one delegated listener for every group.
      if (filters) {
        filters.addEventListener('change', (e) => {
          const cb = e.target.closest('.filter-cb');
          if (!cb) return;
          const group = Shop.state.groups[cb.dataset.group];
          if (!group) return;
          if (cb.checked) group.add(cb.value);
          else group.delete(cb.value);
          Shop.render();
        });
      }

      if (range) {
        range.addEventListener('input', () => {
          Shop.state.maxPrice = Number(range.value);
          Shop._updatePriceLabel();
          Shop.render();
        });
        Shop._updatePriceLabel();
      }

      if (clear) clear.addEventListener('click', Shop.clearFilters);

      // Mobile filter panel toggle.
      if (filtersToggle && filters) {
        filtersToggle.addEventListener('click', () => {
          filters.classList.toggle('open');
        });
      }

      Shop.render();
    },

    /** Reflect the slider value into #price-max-label. */
    _updatePriceLabel() {
      const label = document.getElementById('price-max-label');
      if (label) label.textContent = Utils.money(Shop.state.maxPrice);
    },

    /** Reset search, every checkbox group, and the price slider. */
    clearFilters() {
      Shop.state.search = '';
      Shop.state.maxPrice = 350;
      Object.keys(Shop.state.groups).forEach((k) => Shop.state.groups[k].clear());

      const search = document.getElementById('search-input');
      if (search) search.value = '';
      Utils.$$('.filter-cb').forEach((cb) => { cb.checked = false; });
      const range = document.getElementById('price-range');
      if (range) range.value = '350';
      Shop._updatePriceLabel();
      Shop.render();
    },

    /**
     * Apply search + filters (AND across groups, OR within) + sort.
     * @returns {Array<Object>} filtered, sorted product list
     */
    apply() {
      const s = Shop.state;
      let list = Store.all().filter((p) => {
        // Search matches name / frameType / lensType / color.
        if (s.search) {
          const hay = `${p.name} ${p.frameType} ${p.lensType} ${p.color}`.toLowerCase();
          if (hay.indexOf(s.search) === -1) return false;
        }
        // Each active group must match (OR within the group).
        for (const key of Object.keys(s.groups)) {
          const set = s.groups[key];
          if (set.size > 0 && !set.has(p[key])) return false;
        }
        return p.price <= s.maxPrice;
      });

      switch (s.sort) {
        case 'newest':
          list = list.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
          break;
        case 'price-asc':
          list = list.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          list = list.sort((a, b) => b.price - a.price);
          break;
        case 'popular':
        default:
          list = list.sort((a, b) => b.popularity - a.popularity);
          break;
      }
      return list;
    },

    /** Render the shop grid, results count, and empty-state visibility. */
    render() {
      const grid = document.getElementById('shop-grid');
      const count = document.getElementById('results-count');
      const empty = document.getElementById('shop-empty');
      if (!grid) return;

      const list = Shop.apply();
      UI.renderGrid(grid, list);
      if (count) count.textContent = `${list.length} ${list.length === 1 ? 'style' : 'styles'}`;
      if (empty) empty.classList.toggle('hidden', list.length > 0);
    }
  };

  /* ==========================================================================
   * MODULE: ProductModal (§6.6)
   * Quick-view dialog with a 3-image gallery (front / side profile / lens
   * macro), hover zoom, qty stepper (1–10), add-to-cart and wishlist.
   * ========================================================================*/
  const ProductModal = {

    /** @type {Object|null} product currently shown */
    current: null,

    /** @type {HTMLElement|null} element to restore focus to on close */
    _opener: null,

    /** Generic lens-type notes used in the "Lens Information" details. */
    LENS_NOTES: {
      'Clear': 'Clear lenses with no tint — suited to everyday prescription or non-prescription wear.',
      'Blue Light': 'Blue-light filtering lenses reduce a portion of high-energy visible light from screens.',
      'Sunglasses': 'Tinted sun lenses reduce overall brightness for comfortable outdoor wear.',
      'Polarized': 'Polarized lenses filter reflected glare from roads, water, and glass surfaces.',
      'Photochromic': 'Photochromic lenses darken automatically in sunlight and fade back indoors.'
    },

    /** Generic material notes used in the "Frame Information" details. */
    MATERIAL_NOTES: {
      'Plastic': 'Lightweight molded plastic construction with a comfortable, flexible fit.',
      'Metal': 'Alloy metal construction with a slim profile and adjustable nose pads.',
      'Titanium': 'Titanium construction — exceptionally light, strong, and corrosion-resistant.',
      'Carbon Fiber': 'Carbon-fiber construction — rigid and ultra-light with a matte technical finish.'
    },

    /** Bind static modal controls (close, gallery, zoom, qty, actions). */
    init() {
      const modal = document.getElementById('product-modal');
      if (!modal) return;

      // Backdrop and × button both carry [data-close].
      modal.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) ProductModal.close();
      });

      // Esc closes when open.
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) ProductModal.close();
      });

      // Thumbnail clicks swap the main image.
      const thumbs = document.getElementById('pm-thumbs');
      if (thumbs) {
        thumbs.addEventListener('click', (e) => {
          const btn = e.target.closest('.pm-thumb');
          if (!btn) return;
          const img = btn.querySelector('img');
          if (img) ProductModal._setMain(img.src);
          Utils.$$('.pm-thumb', thumbs).forEach((t) => t.classList.toggle('active', t === btn));
        });
      }

      // Hover zoom — transform-origin follows the cursor, scale 1.6.
      const wrap = Utils.$('.pm-main-wrap');
      const main = document.getElementById('pm-main');
      if (wrap && main) {
        wrap.addEventListener('mousemove', (e) => {
          const r = wrap.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * 100;
          const y = ((e.clientY - r.top) / r.height) * 100;
          main.style.transformOrigin = `${x.toFixed(1)}% ${y.toFixed(1)}%`;
          main.style.transform = 'scale(1.6)';
        });
        wrap.addEventListener('mouseleave', () => {
          main.style.transformOrigin = 'center center';
          main.style.transform = 'none';
        });
      }

      // Quantity stepper, clamped 1..10.
      const qty = document.getElementById('pm-qty');
      const minus = document.getElementById('pm-qty-minus');
      const plus = document.getElementById('pm-qty-plus');
      const step = (delta) => {
        if (!qty) return;
        qty.value = String(Utils.clamp((parseInt(qty.value, 10) || 1) + delta, 1, 10));
      };
      if (minus) minus.addEventListener('click', () => step(-1));
      if (plus) plus.addEventListener('click', () => step(1));
      if (qty) {
        qty.addEventListener('change', () => {
          qty.value = String(Utils.clamp(parseInt(qty.value, 10) || 1, 1, 10));
        });
      }

      // Add to cart respects the chosen quantity.
      const add = document.getElementById('pm-add-cart');
      if (add) {
        add.addEventListener('click', () => {
          if (!ProductModal.current) return;
          const n = qty ? Utils.clamp(parseInt(qty.value, 10) || 1, 1, 10) : 1;
          Cart.addProduct(ProductModal.current.id, n);
        });
      }

      // Wishlist toggle (persists via Store).
      const wish = document.getElementById('pm-wishlist');
      if (wish) {
        wish.addEventListener('click', () => {
          if (!ProductModal.current) return;
          const id = ProductModal.current.id;
          const on = Store.toggleWishlist(id);
          UI.syncWish(id, on);
          UI.toast(on ? `${ProductModal.current.name} added to wishlist`
                      : `${ProductModal.current.name} removed from wishlist`, 'info');
        });
      }
    },

    /**
     * Gallery image list for a product (§6.6):
     * front view, frame-type side profile, shared lens macro.
     * @param {Object} p
     * @returns {Array<string>}
     */
    galleryFor(p) {
      return [
        p.image,
        `assets/products/side-${Utils.slug(p.frameType)}.svg`,
        'assets/products/detail-lens.svg'
      ];
    },

    /** Swap the main gallery image (resets any zoom). */
    _setMain(src) {
      const main = document.getElementById('pm-main');
      if (!main) return;
      main.src = src;
      main.style.transform = 'none';
      main.style.transformOrigin = 'center center';
    },

    /**
     * Open the modal for a product.
     * @param {string} id product id
     * @param {HTMLElement} [opener] element to restore focus to on close
     */
    open(id, opener) {
      const p = Store.byId(id);
      const modal = document.getElementById('product-modal');
      if (!p || !modal) return;
      ProductModal.current = p;
      ProductModal._opener = opener || null;

      // --- Gallery ----------------------------------------------------------
      const images = ProductModal.galleryFor(p);
      ProductModal._setMain(images[0]);
      const main = document.getElementById('pm-main');
      if (main) main.alt = `${p.name} — product view`;
      Utils.$$('.pm-thumb', document.getElementById('pm-thumbs')).forEach((btn, i) => {
        const img = btn.querySelector('img');
        if (img && images[i]) {
          img.src = images[i];
          img.alt = ['Front view', 'Side profile', 'Lens detail'][i] || '';
        }
        btn.classList.toggle('active', i === 0);
      });

      // --- Info column ------------------------------------------------------
      const name = document.getElementById('pm-name');
      if (name) name.textContent = p.name;
      const rating = document.getElementById('pm-rating');
      if (rating) {
        rating.innerHTML = UI.stars(p.rating) + `<span class="rating-val">${p.rating.toFixed(1)}</span>`;
      }
      const price = document.getElementById('pm-price');
      if (price) price.textContent = Utils.money(p.price);
      const desc = document.getElementById('pm-desc');
      if (desc) desc.textContent = p.description;

      // Single colorway dot. NOTE: if the owner adds colour variants later,
      // render one .swatch per variant here.
      const colors = document.getElementById('pm-colors');
      if (colors) {
        colors.innerHTML =
          `<span class="swatch" style="background:${p.frameHex}" title="${Utils.esc(p.color)}" aria-label="${Utils.esc(p.color)}"></span>`;
      }

      // Specs <dl>. (Values are owner-replaceable placeholders — see catalog.)
      const specs = document.getElementById('pm-specs');
      if (specs) {
        const rows = [
          ['Frame width', p.specs.frameWidth],
          ['Lens width', p.specs.lensWidth],
          ['Bridge', p.specs.bridge],
          ['Temple length', p.specs.templeLength],
          ['Weight', p.specs.weight]
        ];
        specs.innerHTML = rows
          .map(([dt, dd]) => `<dt>${dt}</dt><dd>${Utils.esc(dd)}</dd>`)
          .join('');
      }

      // Frame / lens information details — generic educational notes only.
      ProductModal._fillDetails('pm-frame-info',
        `${p.frameType} silhouette · ${p.material}. ${ProductModal.MATERIAL_NOTES[p.material] || ''}`);
      ProductModal._fillDetails('pm-lens-info',
        ProductModal.LENS_NOTES[p.lensType] || '');

      // Reset quantity + wishlist state.
      const qty = document.getElementById('pm-qty');
      if (qty) qty.value = '1';
      const wish = document.getElementById('pm-wishlist');
      if (wish) wish.setAttribute('aria-pressed', String(Store.wishlistHas(p.id)));

      // --- Show -------------------------------------------------------------
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const closeBtn = Utils.$('.modal-close', modal);
      if (closeBtn) closeBtn.focus();
    },

    /**
     * Write a paragraph of body copy into a <details> block, preserving its
     * <summary> (the paragraph is created on first use).
     * @param {string} id details element id
     * @param {string} text
     */
    _fillDetails(id, text) {
      const det = document.getElementById(id);
      if (!det) return;
      let body = det.querySelector('p');
      if (!body) {
        body = document.createElement('p');
        det.appendChild(body);
      }
      body.textContent = text;
    },

    /** Close the modal and restore focus to the opener. */
    close() {
      const modal = document.getElementById('product-modal');
      if (!modal) return;
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      ProductModal.current = null;
      if (ProductModal._opener && document.contains(ProductModal._opener)) {
        ProductModal._opener.focus();
      }
      ProductModal._opener = null;
    }
  };

  /* ==========================================================================
   * MODULE: Constructor (§6.8)
   * Custom-glasses builder: live SVG preview (recolor + reshape), exact
   * pricing tables with an itemised breakdown, and add-to-cart with a
   * serialized-SVG thumbnail.
   *
   * Geometry: the SVG viewBox is 600x260; lenses are ~150x110, centered
   * around x=180 (left) / x=420 (right), y=130. Left-side paths are authored
   * by hand using only absolute M/C/L/Z commands so the right side can be
   * generated by mirroring every x across the centerline (x' = 600 - x).
   * ========================================================================*/
  const Constructor = {

    /** Builder state (defaults match the initial HTML markup). */
    state: {
      frame: 'Round',
      material: 'Plastic',
      frameColor: '#1c1c1e',
      frameCustom: false,
      lensType: 'Clear',
      lensColor: '#555a60',
      lensCustom: false
    },

    /* --- Pricing tables (§6.8 — exact values) ------------------------------ */

    /** Base price per frame silhouette. */
    BASE_PRICE: {
      'Round': 79, 'Rectangle': 85, 'Square': 89,
      'Cat Eye': 95, 'Aviator': 99, 'Rimless': 119
    },

    /** Material surcharge. */
    MATERIAL_PRICE: { 'Plastic': 0, 'Metal': 25, 'Titanium': 60, 'Carbon Fiber': 85 },

    /** Lens-type surcharge. */
    LENS_PRICE: {
      'Clear': 0, 'Blue Light': 30, 'Sunglasses': 40,
      'Polarized': 65, 'Photochromic': 90
    },

    /** Fee added per custom (color-picker) colour. */
    CUSTOM_COLOR_FEE: 10,

    /** Lens fill opacity by lens type (§6.8). */
    LENS_OPACITY: {
      'Clear': 0.18, 'Blue Light': 0.25, 'Photochromic': 0.55,
      'Sunglasses': 0.85, 'Polarized': 0.9
    },

    /** Friendly names for the preset swatch hexes (used in cart meta). */
    COLOR_NAMES: {
      '#1c1c1e': 'Black', '#f2f0eb': 'White', '#c0c4c8': 'Silver',
      '#c9a227': 'Gold', '#6b4a2f': 'Brown',
      '#555a60': 'Gray', '#5a4634': 'Brown', '#3e5547': 'Green', '#33506e': 'Blue'
    },

    /* --- Geometry ----------------------------------------------------------
     * Left-half master paths per frame type. `lens` doubles as the rim
     * outline (rims are the stroked lens shape); `bridge` is authored
     * symmetric (the Aviator uses two subpaths for its double bridge);
     * `temple` runs from the outer rim edge toward the viewBox edge.
     * `rimWidth`/`rimOpacity`: normal frames stroke 7..9 at full opacity;
     * Rimless uses a 1.5 hairline at 0.35 (§6.8).
     * ----------------------------------------------------------------------*/
    LEFT_GEOMETRY: {
      'Round': {
        lens: 'M108 130 C108 95 140 66 180 66 C220 66 252 95 252 130 C252 165 220 194 180 194 C140 194 108 165 108 130 Z',
        bridge: 'M252 116 C268 96 332 96 348 116',
        temple: 'M112 112 C76 100 36 98 8 108',
        rimWidth: 8, rimOpacity: 1
      },
      'Square': {
        lens: 'M123 75 L237 75 C249 75 255 81 255 93 L255 167 C255 179 249 185 237 185 L123 185 C111 185 105 179 105 167 L105 93 C105 81 111 75 123 75 Z',
        bridge: 'M255 108 C272 96 328 96 345 108',
        temple: 'M108 96 C74 88 34 86 8 96',
        rimWidth: 9, rimOpacity: 1
      },
      'Aviator': {
        lens: 'M112 88 C138 72 226 72 248 90 C256 97 257 112 252 132 C244 166 214 192 178 192 C140 192 110 162 106 124 C104 108 104 94 112 88 Z',
        // Double bridge — two stacked subpaths.
        bridge: 'M250 102 C270 88 330 88 350 102 M254 122 C274 110 326 110 346 122',
        temple: 'M110 94 C76 84 36 82 8 92',
        rimWidth: 7, rimOpacity: 1
      },
      'Rectangle': {
        lens: 'M121 92 L239 92 C250 92 255 97 255 108 L255 152 C255 163 250 168 239 168 L121 168 C110 168 105 163 105 152 L105 108 C105 97 110 92 121 92 Z',
        bridge: 'M255 112 C272 102 328 102 345 112',
        temple: 'M108 106 C74 98 34 96 8 104',
        rimWidth: 7, rimOpacity: 1
      },
      'Cat Eye': {
        // Outer (temporal) corner sweeps up to a raised point.
        lens: 'M108 80 C146 94 224 88 250 100 C258 104 257 122 251 140 C241 168 210 186 176 184 C140 182 112 160 105 126 C101 108 100 88 108 80 Z',
        bridge: 'M250 106 C270 94 330 94 350 106',
        temple: 'M110 88 C76 76 36 76 8 88',
        rimWidth: 8, rimOpacity: 1
      },
      'Rimless': {
        // Soft pillow lens; rims become hairlines (see rimWidth/rimOpacity).
        lens: 'M116 84 L244 84 C251 84 255 90 255 100 L255 152 C255 170 240 184 216 186 L144 186 C120 184 105 170 105 152 L105 100 C105 90 109 84 116 84 Z',
        bridge: 'M255 106 C272 96 328 96 345 106',
        temple: 'M108 96 C74 88 34 86 8 96',
        rimWidth: 1.5, rimOpacity: 0.35
      }
    },

    /**
     * Mirror a left-half path across the vertical centerline (x' = 600 - x).
     * Only safe for paths built from absolute M/C/L/Z commands, where every
     * numeric argument alternates x, y (which all LEFT_GEOMETRY paths obey).
     * @param {string} d path data
     * @returns {string} mirrored path data
     */
    mirrorX(d) {
      const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+/g) || [];
      let isX = true; // command letters reset the x/y alternation
      return tokens.map((t) => {
        if (/^[A-Za-z]$/.test(t)) { isX = true; return t; }
        const v = parseFloat(t);
        const out = isX ? 600 - v : v;
        isX = !isX;
        return String(out);
      }).join(' ');
    },

    /** @type {Object|null} FRAME_GEOMETRY — built lazily from LEFT_GEOMETRY */
    _geometry: null,

    /**
     * Complete geometry dictionary: 6 frame names -> `d` strings for all
     * seven §4.7 path ids (plus rim styling hints).
     * @returns {Object}
     */
    FRAME_GEOMETRY() {
      if (Constructor._geometry) return Constructor._geometry;
      const dict = {};
      Object.keys(Constructor.LEFT_GEOMETRY).forEach((name) => {
        const g = Constructor.LEFT_GEOMETRY[name];
        dict[name] = {
          'ctor-lens-l': g.lens,
          'ctor-lens-r': Constructor.mirrorX(g.lens),
          'ctor-rim-l': g.lens,
          'ctor-rim-r': Constructor.mirrorX(g.lens),
          'ctor-bridge': g.bridge,
          'ctor-temple-l': g.temple,
          'ctor-temple-r': Constructor.mirrorX(g.temple),
          rimWidth: g.rimWidth,
          rimOpacity: g.rimOpacity
        };
      });
      Constructor._geometry = dict;
      return dict;
    },

    /** Bind option groups, custom colour pickers, and add-to-cart. */
    init() {
      if (!document.getElementById('ctor-svg')) return;

      // Option buttons — one delegated listener per fieldset group.
      Utils.$$('.ctor-group[data-option]').forEach((group) => {
        group.addEventListener('click', (e) => {
          const btn = e.target.closest('.ctor-opt');
          if (!btn || !group.contains(btn)) return;
          Constructor.select(group.dataset.option, btn.dataset.value, group, btn);
        });
      });

      // Custom colour pickers (each adds the §6.8 +$10 fee).
      const frameCustom = document.getElementById('ctor-frame-custom');
      if (frameCustom) {
        frameCustom.addEventListener('input', () => {
          Constructor.state.frameColor = frameCustom.value;
          Constructor.state.frameCustom = true;
          Constructor._clearPressed('frameColor');
          Constructor.update();
        });
      }
      const lensCustom = document.getElementById('ctor-lens-custom');
      if (lensCustom) {
        lensCustom.addEventListener('input', () => {
          Constructor.state.lensColor = lensCustom.value;
          Constructor.state.lensCustom = true;
          Constructor._clearPressed('lensColor');
          Constructor.update();
        });
      }

      const add = document.getElementById('ctor-add-cart');
      if (add) add.addEventListener('click', Constructor.addToCart);

      // Sync the preview/pricing with the default state.
      Constructor._markPressedFromState();
      Constructor.update();
    },

    /**
     * Apply an option-button selection to state.
     * @param {string} option fieldset data-option key
     * @param {string} value  button data-value
     * @param {HTMLElement} group fieldset element
     * @param {HTMLElement} btn   clicked button
     */
    select(option, value, group, btn) {
      const s = Constructor.state;
      if (option === 'frame') s.frame = value;
      else if (option === 'material') s.material = value;
      else if (option === 'lensType') s.lensType = value;
      else if (option === 'frameColor') { s.frameColor = value; s.frameCustom = false; }
      else if (option === 'lensColor') { s.lensColor = value; s.lensCustom = false; }
      else return;

      Utils.$$('.ctor-opt', group).forEach((b) => {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      Constructor.update();
    },

    /** Clear aria-pressed within one swatch group (custom colour chosen). */
    _clearPressed(option) {
      const group = Utils.$(`.ctor-group[data-option="${option}"]`);
      if (group) {
        Utils.$$('.ctor-opt', group).forEach((b) => b.setAttribute('aria-pressed', 'false'));
      }
    },

    /** Set initial aria-pressed states to mirror the default state. */
    _markPressedFromState() {
      const s = Constructor.state;
      const map = {
        frame: s.frame, material: s.material, lensType: s.lensType,
        frameColor: s.frameColor, lensColor: s.lensColor
      };
      Object.keys(map).forEach((option) => {
        const group = Utils.$(`.ctor-group[data-option="${option}"]`);
        if (!group) return;
        Utils.$$('.ctor-opt', group).forEach((b) => {
          b.setAttribute('aria-pressed', String(b.dataset.value === map[option]));
        });
      });
    },

    /** Re-render geometry, colours, label, and pricing after any change. */
    update() {
      Constructor.applyGeometry();
      Constructor.applyColors();
      const label = document.getElementById('ctor-name-label');
      if (label) {
        label.textContent = `Custom ${Constructor.state.frame} · ${Constructor.state.material}`;
      }
      Constructor.renderPrice();
    },

    /** Swap all seven path `d` attributes for the selected frame type. */
    applyGeometry() {
      const geo = Constructor.FRAME_GEOMETRY()[Constructor.state.frame];
      if (!geo) return;
      ['ctor-lens-l', 'ctor-lens-r', 'ctor-rim-l', 'ctor-rim-r',
        'ctor-bridge', 'ctor-temple-l', 'ctor-temple-r'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('d', geo[id]);
      });
    },

    /**
     * Recolour the preview. Presentation is written as SVG attributes (not
     * inline CSS) so the serialized cart thumbnail keeps its styling.
     */
    applyColors() {
      const s = Constructor.state;
      const geo = Constructor.FRAME_GEOMETRY()[s.frame];
      const lensOpacity = Constructor.LENS_OPACITY[s.lensType] || 0.18;

      // Lenses: tinted fill, no stroke.
      ['ctor-lens-l', 'ctor-lens-r'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.setAttribute('fill', s.lensColor);
        el.setAttribute('fill-opacity', String(lensOpacity));
        el.setAttribute('stroke', 'none');
      });

      // Rims: stroked lens outline (hairline + faded for Rimless).
      ['ctor-rim-l', 'ctor-rim-r'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', s.frameColor);
        el.setAttribute('stroke-width', String(geo.rimWidth));
        el.setAttribute('opacity', String(geo.rimOpacity));
        el.setAttribute('stroke-linejoin', 'round');
      });

      // Bridge + temples: always full-strength frame colour.
      ['ctor-bridge', 'ctor-temple-l', 'ctor-temple-r'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', s.frameColor);
        el.setAttribute('stroke-width', '7');
        el.setAttribute('opacity', '1');
        el.setAttribute('stroke-linecap', 'round');
      });
    },

    /**
     * Compute the itemised price.
     * @returns {{rows: Array<{label:string, amount:number, isBase:boolean}>, total: number}}
     */
    price() {
      const s = Constructor.state;
      const rows = [
        { label: `${s.frame} frame base`, amount: Constructor.BASE_PRICE[s.frame] || 0, isBase: true },
        { label: `Material — ${s.material}`, amount: Constructor.MATERIAL_PRICE[s.material] || 0, isBase: false },
        { label: `Lenses — ${s.lensType}`, amount: Constructor.LENS_PRICE[s.lensType] || 0, isBase: false }
      ];
      if (s.frameCustom) {
        rows.push({ label: 'Custom frame color', amount: Constructor.CUSTOM_COLOR_FEE, isBase: false });
      }
      if (s.lensCustom) {
        rows.push({ label: 'Custom lens color', amount: Constructor.CUSTOM_COLOR_FEE, isBase: false });
      }
      const total = rows.reduce((sum, r) => sum + r.amount, 0);
      return { rows, total };
    },

    /** Render the breakdown <li> rows and the total into the price bar. */
    renderPrice() {
      const { rows, total } = Constructor.price();
      const list = document.getElementById('ctor-breakdown');
      if (list) {
        list.innerHTML = rows.map((r) => {
          const amt = r.isBase ? Utils.money(r.amount) : `+${Utils.money(r.amount)}`;
          return `<li><span>${Utils.esc(r.label)}</span><span>${amt}</span></li>`;
        }).join('');
      }
      const priceEl = document.getElementById('ctor-price');
      if (priceEl) priceEl.textContent = Utils.money(total);
    },

    /**
     * Human-readable colour name for the cart meta line.
     * @param {string} hex
     * @returns {string}
     */
    colorName(hex) {
      return Constructor.COLOR_NAMES[String(hex).toLowerCase()] || String(hex).toUpperCase();
    },

    /** Serialize the live preview and push the custom build into the cart. */
    addToCart() {
      const s = Constructor.state;
      const svg = document.getElementById('ctor-svg');
      if (!svg) return;

      // Thumbnail = the current preview SVG as a data URI (§6.8).
      const image = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.outerHTML);
      const { total } = Constructor.price();
      const meta =
        `${s.frame} · ${s.material} · ${s.lensType} lens · ` +
        `${Constructor.colorName(s.frameColor)} frame / ${Constructor.colorName(s.lensColor)} tint`;

      Cart.add({
        key: 'custom-' + Date.now(),
        type: 'custom',
        name: `Custom ${s.frame} · ${s.material}`,
        price: total,
        qty: 1,
        image,
        meta
      });
      UI.toast('Custom build added to cart', 'success');
    }
  };

  /* ==========================================================================
   * MODULE: Cart (§6.7)
   * Item shape: {key, type:'product'|'custom', id?, name, price, qty, image,
   * meta}. Product key = product id; custom key = 'custom-' + Date.now().
   * Persists to localStorage on every change; keeps the navbar badge and the
   * cart view in sync. Math: subtotal = Σ(price×qty); tax = subtotal×TAX_RATE;
   * total = subtotal + tax (shipping is added at checkout only).
   * ========================================================================*/
  const Cart = {

    /** @type {Array<Object>} cart line items */
    items: [],

    /** Load persisted cart, bind row actions, render badge (+ view). */
    init() {
      Cart.load();

      // Delegated qty / remove actions inside the cart view.
      const host = document.getElementById('cart-items');
      if (host) {
        host.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-action][data-key]');
          if (!btn) return;
          const key = btn.dataset.key;
          const action = btn.dataset.action;
          if (action === 'qty-minus') Cart.changeQty(key, -1);
          else if (action === 'qty-plus') Cart.changeQty(key, 1);
          else if (action === 'remove') Cart.remove(key);
        });
      }

      // Guard checkout navigation while the cart is empty.
      const checkoutBtn = document.getElementById('checkout-btn');
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
          if (checkoutBtn.classList.contains('disabled')) {
            e.preventDefault();
            UI.toast('Your cart is empty — add something first', 'info');
          }
        });
      }

      Cart.renderBadge(false);
    },

    /** Restore cart items from localStorage (tolerates bad data). */
    load() {
      try {
        const raw = JSON.parse(localStorage.getItem(LS_CART));
        Cart.items = Array.isArray(raw) ? raw : [];
      } catch (err) {
        Cart.items = [];
      }
    },

    /** Persist cart to localStorage (called after every mutation). */
    save() {
      try {
        localStorage.setItem(LS_CART, JSON.stringify(Cart.items));
      } catch (err) { /* storage unavailable — cart stays in-memory */ }
    },

    /** @returns {number} total unit count (badge value) */
    count() {
      return Cart.items.reduce((n, it) => n + it.qty, 0);
    },

    /** @returns {number} Σ price × qty */
    subtotal() {
      return Cart.items.reduce((sum, it) => sum + it.price * it.qty, 0);
    },

    /**
     * Add an item; merges quantity when the key already exists.
     * @param {Object} item cart line item (§6.7 shape)
     */
    add(item) {
      const existing = Cart.items.find((it) => it.key === item.key);
      if (existing) existing.qty += item.qty;
      else Cart.items.push(item);
      Cart.save();
      Cart.renderBadge(true);
      if (Router.current === 'cart') Cart.render();
      if (Router.current === 'checkout') Checkout.render();
    },

    /**
     * Convenience: add a catalog product (used by cards and the modal).
     * @param {string} id product id
     * @param {number} qty units to add
     */
    addProduct(id, qty) {
      const p = Store.byId(id);
      if (!p) return;
      Cart.add({
        key: p.id,                 // product key = product id (§6.7)
        type: 'product',
        id: p.id,
        name: p.name,
        price: p.price,
        qty,
        image: p.image,
        meta: `${p.frameType} · ${p.lensType}`
      });
      UI.toast(`${p.name} added to cart`, 'success');
    },

    /**
     * Adjust a line's quantity (clamped to >=1; use Remove to delete).
     * @param {string} key
     * @param {number} delta +1 / -1
     */
    changeQty(key, delta) {
      const item = Cart.items.find((it) => it.key === key);
      if (!item) return;
      item.qty = Utils.clamp(item.qty + delta, 1, 99);
      Cart.save();
      Cart.renderBadge(false);
      Cart.render();
    },

    /**
     * Remove a line item entirely.
     * @param {string} key
     */
    remove(key) {
      Cart.items = Cart.items.filter((it) => it.key !== key);
      Cart.save();
      Cart.renderBadge(false);
      Cart.render();
      UI.toast('Item removed from cart', 'info');
    },

    /**
     * Update the navbar badge #cart-count.
     * @param {boolean} bump play the .bump add-to-cart animation
     */
    renderBadge(bump) {
      const badge = document.getElementById('cart-count');
      if (!badge) return;
      const n = Cart.count();
      badge.textContent = String(n);
      badge.classList.toggle('hidden', n === 0);
      if (bump && n > 0) {
        badge.classList.remove('bump');
        // Force a reflow so the animation can restart back-to-back.
        void badge.offsetWidth;
        badge.classList.add('bump');
      }
    },

    /** Render rows, empty state, and the summary card in #view-cart. */
    render() {
      const host = document.getElementById('cart-items');
      const empty = document.getElementById('cart-empty');
      const checkoutBtn = document.getElementById('checkout-btn');
      if (!host) return;

      const has = Cart.items.length > 0;
      if (empty) empty.classList.toggle('hidden', has);
      if (checkoutBtn) checkoutBtn.classList.toggle('disabled', !has);

      host.innerHTML = Cart.items.map((it) => `
        <article class="cart-row" data-key="${Utils.esc(it.key)}">
          <img class="cart-img" src="${it.image}" alt="">
          <div class="cart-info">
            <h3 class="cart-name">${Utils.esc(it.name)}</h3>
            <p class="cart-meta">${Utils.esc(it.meta)}</p>
          </div>
          <div class="cart-qty">
            <button data-action="qty-minus" data-key="${Utils.esc(it.key)}" aria-label="Decrease quantity">&minus;</button>
            <span class="cart-qty-val">${it.qty}</span>
            <button data-action="qty-plus" data-key="${Utils.esc(it.key)}" aria-label="Increase quantity">+</button>
          </div>
          <span class="cart-line-price">${Utils.money(it.price * it.qty)}</span>
          <button class="cart-remove" data-action="remove" data-key="${Utils.esc(it.key)}" aria-label="Remove ${Utils.esc(it.name)}">&times;</button>
        </article>`).join('');

      // Summary math (§6.7 — shipping is a checkout-only concern).
      const subtotal = Cart.subtotal();
      const tax = subtotal * TAX_RATE;
      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      set('cart-subtotal', Utils.money(subtotal));
      set('cart-tax', Utils.money(tax));
      set('cart-total', Utils.money(subtotal + tax));
    }
  };

  /* ==========================================================================
   * MODULE: Checkout (§6.7 / §6.9)
   * Order summary with shipping (free at/above FREE_SHIPPING_MIN), the
   * "same as billing" copier, and the demo-only submit. Payment fields are
   * UI ONLY — nothing is processed, stored, or transmitted.
   * ========================================================================*/
  const Checkout = {

    /** Bind the same-as-billing checkbox and the demo form submit. */
    init() {
      const same = document.getElementById('same-as-billing');
      if (same) {
        same.addEventListener('change', () => {
          if (same.checked) Checkout.copyBillingToShipping();
        });
      }

      const form = document.getElementById('checkout-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault(); // demo only — no order is placed (§4.9)
          if (Cart.items.length === 0) {
            UI.toast('Your cart is empty — nothing to order', 'info');
            return;
          }
          // Validate any email fields present in the form.
          const emails = Utils.$$('input[type="email"]', form);
          const bad = emails.find((el) => el.value.trim() && !Utils.isEmail(el.value));
          const missing = emails.find((el) => el.required && !el.value.trim());
          if (bad || missing) {
            UI.toast('Please enter a valid email address', 'info');
            (bad || missing).focus();
            return;
          }
          UI.toast('Demo checkout — no order was placed and no payment was processed', 'success');
          form.reset();
        });
      }
    },

    /**
     * Copy billing field values into the shipping section. Fields are paired
     * by their `data-field` attribute (address1, city, postal, …) — for each
     * shipping control the matching billing control is looked up, so adding
     * or reordering fields in either section cannot misalign the copy.
     */
    copyBillingToShipping() {
      const billing = document.getElementById('co-billing');
      const shipping = document.getElementById('co-shipping');
      if (!billing || !shipping) return;

      Utils.$$('[data-field]', shipping).forEach((el) => {
        const src = billing.querySelector(`[data-field="${el.dataset.field}"]`);
        if (src) el.value = src.value;
      });
    },

    /** Render the order summary (+ empty state) in #view-checkout. */
    render() {
      const emptyNote = document.getElementById('checkout-empty');
      const form = document.getElementById('checkout-form');
      const summary = Utils.$('.co-summary');
      const has = Cart.items.length > 0;

      if (emptyNote) emptyNote.classList.toggle('hidden', has);
      if (form) form.classList.toggle('hidden', !has);
      if (summary) summary.classList.toggle('hidden', !has);
      if (!has) return;

      const list = document.getElementById('os-items');
      if (list) {
        list.innerHTML = Cart.items.map((it) =>
          `<li><span>${Utils.esc(it.name)} × ${it.qty}</span>` +
          `<span>${Utils.money(it.price * it.qty)}</span></li>`
        ).join('');
      }

      // Checkout math (§6.7): shipping is free at/above FREE_SHIPPING_MIN.
      const subtotal = Cart.subtotal();
      const tax = subtotal * TAX_RATE;
      const shipping = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FLAT;
      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      set('os-subtotal', Utils.money(subtotal));
      set('os-shipping', shipping === 0 ? 'Free' : Utils.money(shipping));
      set('os-tax', Utils.money(tax));
      set('os-total', Utils.money(subtotal + tax + shipping));
    }
  };

  /* ==========================================================================
   * MODULE: Newsletter (§6.9)
   * UI-only demo submits for the newsletter signup and the contact form —
   * nothing is sent or stored anywhere.
   * ========================================================================*/
  const Newsletter = {

    /** Bind newsletter + contact form demo submits. */
    init() {
      const form = document.getElementById('newsletter-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault(); // UI only (§4.3)
          const email = document.getElementById('newsletter-email');
          if (!email || !Utils.isEmail(email.value)) {
            UI.toast('Please enter a valid email address', 'info');
            if (email) email.focus();
            return;
          }
          UI.toast('Demo signup — the newsletter is not connected yet', 'success');
          form.reset();
        });
      }

      // Contact form (§4.10): structure-only demo, handled here alongside
      // the other simple demo submits.
      const contactView = document.getElementById('view-contact');
      const contactForm = contactView ? Utils.$('form', contactView) : null;
      if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
          e.preventDefault(); // demo toast only (§4.10)
          const email = Utils.$('input[type="email"]', contactForm);
          if (email && !Utils.isEmail(email.value)) {
            UI.toast('Please enter a valid email address', 'info');
            email.focus();
            return;
          }
          UI.toast('Demo message — the contact form is not connected yet', 'success');
          contactForm.reset();
        });
      }
    }
  };

  /* ==========================================================================
   * APP BOOTSTRAP
   * ========================================================================*/

  /** Initialise every module in dependency order, then start the router. */
  function init() {
    Theme.init();
    UI.init();
    Store.init();
    Home.render();
    Shop.init();
    ProductModal.init();
    Constructor.init();
    Cart.init();
    Checkout.init();
    Newsletter.init();
    Router.init(); // last — triggers the initial view render + reveals

    // Footer copyright year (§6.9).
    const year = document.getElementById('footer-year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  return {
    Utils, Theme, Router, UI, Store, Home, Shop,
    ProductModal, Constructor, Cart, Checkout, Newsletter,
    init
  };
})();

/* Boot — script is loaded with `defer`, so the DOM is parsed by the time this
 * runs; the listener covers any other loading scenario. */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', App.init);
} else {
  App.init();
}
