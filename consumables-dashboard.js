const CONSUMABLES_STORAGE_KEY = 'lab-consumables-v2';
const CONSUMABLES_LEGACY_STORAGE_KEY = 'lab-consumables-gas-supply';
const OPEN_ORDER_STATUSES = ['Needed', 'Ordered'];
const CONSUMABLE_CATEGORIES = [
  {
    name:'Gas Supply',
    href:'consumables-gas.html',
    eyebrow:'Cylinder Inventory',
    description:'AirGas cylinders, reorder thresholds, open orders, and count activity.',
    meta:['Gases', 'Cylinders', 'Orders'],
    tone:'gas'
  },
  {
    name:'Chemicals & Reagents',
    href:'consumables-category.html?category=Chemicals%20%26%20Reagents',
    eyebrow:'Bench Supplies',
    description:'Track reagent bottles, chemical kits, standards-adjacent supplies, and reorder needs.',
    meta:['Reagents', 'Bottles', 'Lots'],
    tone:'chem'
  },
  {
    name:'Sample Containers',
    href:'consumables-category.html?category=Sample%20Containers',
    eyebrow:'Sample Handling',
    description:'Manage bottles, vials, cans, labels, caps, and other sample collection containers.',
    meta:['Bottles', 'Vials', 'Caps'],
    tone:'containers'
  },
  {
    name:'Instrument Supplies',
    href:'consumables-category.html?category=Instrument%20Supplies',
    eyebrow:'Instrument Support',
    description:'Track columns, septa, liners, filters, tubing, and routine instrument consumables.',
    meta:['GC', 'Filters', 'Parts'],
    tone:'instrument'
  },
  {
    name:'General Lab Supplies',
    href:'consumables-category.html?category=General%20Lab%20Supplies',
    eyebrow:'Shared Lab Stock',
    description:'Keep common consumables visible, including gloves, wipes, PPE, and bench supplies.',
    meta:['PPE', 'Bench', 'Shared'],
    tone:'general'
  }
];

let dashboardState = { items: [], counts: [], orders: [], activity: [] };
let refreshTimer = null;

(function tickClock(){
  const now = new Date();
  const clockNode = document.getElementById('clock');
  const dateNode = document.getElementById('datedisp');
  if(clockNode){
    clockNode.textContent = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  }
  if(dateNode){
    dateNode.textContent = now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
  }
  setTimeout(tickClock, 1000);
})();

function esc(value){
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[ch]));
}

function toCount(value){
  return Math.max(0, Math.trunc(Number(value || 0)));
}

function normalizeCategory(value){
  return String(value || 'Gas Supply').trim() || 'Gas Supply';
}

function normalizeItem(source){
  return {
    id:String(source?.id || ''),
    itemName:String(source?.itemName || source?.item_name || source?.itemKey || source?.item_key || '').trim(),
    itemKey:String(source?.itemKey || source?.item_key || '').trim(),
    category:normalizeCategory(source?.category),
    reorderPoint:toCount(source?.reorderPoint ?? source?.reorder_point ?? 2),
    isActive: source?.isActive ?? source?.is_active ?? true
  };
}

function normalizeCount(source){
  return {
    itemId:String(source?.itemId || source?.item_id || ''),
    newCount:toCount(source?.newCount ?? source?.new_count),
    inUseCount:toCount(source?.inUseCount ?? source?.in_use_count),
    emptyCount:toCount(source?.emptyCount ?? source?.empty_count)
  };
}

function normalizeOrder(source){
  return {
    id:String(source?.id || ''),
    itemId:String(source?.itemId || source?.item_id || ''),
    orderStatus:String(source?.orderStatus || source?.order_status || 'Needed'),
    quantity:toCount(source?.quantity || 1)
  };
}

function normalizeActivity(source){
  return {
    id:String(source?.id || ''),
    itemId:String(source?.itemId || source?.item_id || ''),
    createdAt:source?.createdAt || source?.created_at || ''
  };
}

function normalizePayload(payload){
  const items = (Array.isArray(payload?.items) ? payload.items : []).map(normalizeItem).filter((item) => item.id);
  const itemIds = new Set(items.map((item) => item.id));
  const counts = (Array.isArray(payload?.counts) ? payload.counts : []).map(normalizeCount).filter((count) => itemIds.has(count.itemId));
  items.forEach((item) => {
    if(!counts.some((count) => count.itemId === item.id)){
      counts.push({ itemId:item.id, newCount:0, inUseCount:0, emptyCount:0 });
    }
  });
  const orders = (Array.isArray(payload?.orders) ? payload.orders : []).map(normalizeOrder).filter((order) => itemIds.has(order.itemId));
  const activity = (Array.isArray(payload?.activity) ? payload.activity : []).map(normalizeActivity).filter((row) => itemIds.has(row.itemId));
  return { items, counts, orders, activity };
}

function readLocalPayload(){
  const raw = localStorage.getItem(CONSUMABLES_STORAGE_KEY) || localStorage.getItem(CONSUMABLES_LEGACY_STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function isRemoteMode(){
  return !!(window.appAuth && typeof window.appAuth.getMode === 'function' && window.appAuth.getMode() === 'remote');
}

async function loadDashboardData(){
  if(isRemoteMode()){
    const [items, counts, orders, activity] = await Promise.all([
      window.appAuth.requestJson('/rest/v1/consumable_items?select=*&order=category.asc,item_name.asc'),
      window.appAuth.requestJson('/rest/v1/consumable_stock_counts?select=*'),
      window.appAuth.requestJson('/rest/v1/consumable_orders?select=*&order=created_at.desc'),
      window.appAuth.requestJson('/rest/v1/consumable_activity?select=*&order=created_at.desc&limit=200')
    ]);
    return normalizePayload({ items, counts, orders, activity });
  }
  try {
    return normalizePayload(readLocalPayload());
  } catch {
    return normalizePayload({});
  }
}

function getCount(itemId){
  return dashboardState.counts.find((count) => count.itemId === itemId) || { itemId, newCount:0, inUseCount:0, emptyCount:0 };
}

function categorySummary(categoryName){
  const items = dashboardState.items.filter((item) => normalizeCategory(item.category).toLowerCase() === categoryName.toLowerCase());
  const activeItems = items.filter((item) => item.isActive !== false && item.isActive !== 'false');
  const itemIds = new Set(items.map((item) => item.id));
  const openOrders = dashboardState.orders.filter((order) => itemIds.has(order.itemId) && OPEN_ORDER_STATUSES.includes(order.orderStatus));
  const needsOrder = activeItems.filter((item) => getCount(item.id).newCount <= item.reorderPoint);
  return {
    total:activeItems.length,
    needsOrder:needsOrder.length,
    openOrders:openOrders.length,
    onHand:activeItems.reduce((sum, item) => sum + getCount(item.id).newCount, 0),
    depleted:activeItems.reduce((sum, item) => sum + getCount(item.id).emptyCount, 0)
  };
}

function renderStats(){
  const summaries = CONSUMABLE_CATEGORIES.map((category) => categorySummary(category.name));
  document.getElementById('stat-total').textContent = String(CONSUMABLE_CATEGORIES.length);
  document.getElementById('stat-active-items').textContent = String(summaries.reduce((sum, row) => sum + row.total, 0));
  document.getElementById('stat-needs-order').textContent = String(summaries.reduce((sum, row) => sum + row.needsOrder, 0));
  document.getElementById('stat-open-orders').textContent = String(summaries.reduce((sum, row) => sum + row.openOrders, 0));
}

function renderCards(){
  const grid = document.getElementById('category-grid');
  if(!grid) return;
  grid.innerHTML = CONSUMABLE_CATEGORIES.map((category) => {
    const summary = categorySummary(category.name);
    return `
      <a class="category-card ${esc(category.tone)}" href="${esc(category.href)}">
        <div class="category-card-head">
          <div>
            <div class="launch-eyebrow">${esc(category.eyebrow)}</div>
            <h2>${esc(category.name)}</h2>
          </div>
          <div class="category-glyph">${esc(category.name.match(/[A-Za-z0-9]/g)?.slice(0, 2).join('').toUpperCase() || 'LA')}</div>
        </div>
        <p>${esc(category.description)}</p>
        <div class="category-metrics">
          <div><strong>${summary.total}</strong><span>Active Items</span></div>
          <div><strong>${summary.needsOrder}</strong><span>Needs Order</span></div>
          <div><strong>${summary.openOrders}</strong><span>Open Orders</span></div>
          <div><strong>${summary.onHand}</strong><span>On Hand</span></div>
        </div>
        <div class="launch-meta">
          ${category.meta.map((label) => `<span class="meta-pill">${esc(label)}</span>`).join('')}
        </div>
      </a>
    `;
  }).join('');
}

function renderLastUpdate(){
  const node = document.getElementById('last-update');
  if(!node) return;
  const modeLabel = isRemoteMode() ? 'Remote sync' : 'Local browser mode';
  node.textContent = `${modeLabel} | ${new Date().toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })}`;
}

async function refreshDashboard(){
  try {
    dashboardState = await loadDashboardData();
    renderStats();
    renderCards();
    renderLastUpdate();
  } catch (error){
    console.error('Unable to load consumables dashboard:', error);
    const node = document.getElementById('last-update');
    if(node) node.textContent = 'Unable to load consumables';
  }
}

window.addEventListener('focus', refreshDashboard);
document.addEventListener('visibilitychange', () => {
  if(!document.hidden) refreshDashboard();
});

(async function init(){
  await (window.authReadyPromise || Promise.resolve());
  await refreshDashboard();
  clearInterval(refreshTimer);
  refreshTimer = setInterval(refreshDashboard, 30000);
})();
