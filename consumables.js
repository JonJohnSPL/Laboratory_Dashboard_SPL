const CONSUMABLES_STORAGE_KEY = 'lab-consumables-gas-supply';
const AUTO_REFRESH_MS = 15000;
const DEFAULT_ITEMS = [
  { itemKey:'HELIUM', itemName:'Helium', gasSymbol:'He', gasFormula:'He', gasCode:'HE' },
  { itemKey:'ARGON', itemName:'Argon', gasSymbol:'Ar', gasFormula:'Ar', gasCode:'AR' },
  { itemKey:'AIR', itemName:'Air', gasSymbol:'Air', gasFormula:'Air', gasCode:'AI', gasSubtitle:'Compressed' },
  { itemKey:'HYDROGEN', itemName:'Hydrogen', gasSymbol:'H2', gasFormula:'H<sub>2</sub>', gasCode:'HY' },
  { itemKey:'NITROGEN', itemName:'Nitrogen', gasSymbol:'N2', gasFormula:'N<sub>2</sub>', gasCode:'NI' }
];
const OPEN_ORDER_STATUSES = ['Needed', 'Ordered'];

let state = {
  items: [],
  counts: [],
  orders: [],
  activity: []
};
let currentFilter = 'all';
let currentView = 'inventory';
let searchTerm = '';
let selectedItemId = null;
let editItemId = '';
let countModalState = { itemId:'', action:'' };
let editOrderId = '';
let itemIconLabelEdited = false;
let autoRefreshTimer = null;
let autoRefreshInFlight = false;
let saveInFlight = false;
let hideSaveStatusTimer = null;
let lastLoadedSnapshot = '';

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

function uid(prefix = 'cons'){
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function esc(value){
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[ch]));
}

function todayISO(){
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function parseDate(value){
  if(!value) return null;
  const raw = String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function fmtDate(value){
  const date = parseDate(value);
  return date ? date.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : 'Not set';
}

function fmtDateTime(value){
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' })
    : 'Not set';
}

function normalizeKey(value){
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || `GAS_${Date.now()}`;
}

function gasIconAbbreviation(value){
  const letters = String(value || '').match(/[A-Za-z0-9]/g) || [];
  const raw = letters.slice(0, 2).join('');
  if(!raw) return 'Ga';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function gasIconCode(value){
  return gasIconAbbreviation(value).toUpperCase();
}

function toCount(value){
  return Math.max(0, Math.trunc(Number(value || 0)));
}

function toPositiveCount(value, fallback = 1){
  const parsed = Math.trunc(Number(value || fallback));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isRemoteMode(){
  return !!(window.appAuth && typeof window.appAuth.getMode === 'function' && window.appAuth.getMode() === 'remote');
}

function showSaveStatus(status, message){
  const indicator = document.getElementById('save-indicator');
  if(!indicator) return;
  clearTimeout(hideSaveStatusTimer);
  indicator.style.visibility = 'visible';
  indicator.className = `save-indicator ${status}`;
  indicator.textContent = message;
}

function hideSaveStatusSoon(delay = 2200){
  clearTimeout(hideSaveStatusTimer);
  hideSaveStatusTimer = setTimeout(() => {
    const indicator = document.getElementById('save-indicator');
    if(indicator) indicator.style.visibility = 'hidden';
  }, delay);
}

function setLastUpdateText(message){
  const node = document.getElementById('last-update');
  if(node) node.textContent = message;
}

function createDefaultItem(source, index = 0){
  const icon = getGasIconMeta(source.itemKey || source.item_key || source.itemName || source.item_name || '');
  return {
    id: source.id || uid('item'),
    itemKey: normalizeKey(source.itemKey || source.item_key || source.itemName || source.item_name || `GAS_${index + 1}`),
    itemName: String(source.itemName || source.item_name || source.itemKey || source.item_key || '').trim(),
    vendorName: String(source.vendorName || source.vendor_name || 'AirGas').trim() || 'AirGas',
    vendorPartNumber: String(source.vendorPartNumber || source.vendor_part_number || '').trim(),
    cylinderSize: String(source.cylinderSize || source.cylinder_size || '').trim(),
    unitName: String(source.unitName || source.unit_name || 'Cylinder').trim() || 'Cylinder',
    reorderPoint: toCount(source.reorderPoint ?? source.reorder_point ?? 2),
    gasSymbol: String(source.gasSymbol || source.gas_symbol || icon.symbol || '').trim(),
    gasFormula: String(source.gasFormula || source.gas_formula || icon.formula || '').trim(),
    gasCode: String(source.gasCode || source.gas_code || icon.code || '').trim(),
    gasSubtitle: String(source.gasSubtitle || source.gas_subtitle || icon.subtitle || '').trim(),
    isActive: source.isActive ?? source.is_active ?? true,
    notes: String(source.notes || ''),
    createdAt: source.createdAt || source.created_at || '',
    updatedAt: source.updatedAt || source.updated_at || ''
  };
}

function normalizeItem(source, index = 0){
  const item = createDefaultItem(source || {}, index);
  item.itemName = item.itemName || item.itemKey;
  const icon = getGasIconMeta(item.itemKey || item.itemName);
  const defaultSymbol = icon.symbol || gasIconAbbreviation(item.itemName || item.itemKey);
  const defaultFormula = icon.formula || defaultSymbol;
  const defaultCode = icon.code || gasIconCode(item.itemName || item.itemKey);
  const fullNameWasSavedAsIcon = !icon.symbol && item.itemName && (
    item.gasSymbol.toLowerCase() === item.itemName.toLowerCase()
    || item.gasFormula.toLowerCase() === item.itemName.toLowerCase()
  );
  item.gasSymbol = fullNameWasSavedAsIcon ? defaultSymbol : (item.gasSymbol || defaultSymbol);
  item.gasFormula = fullNameWasSavedAsIcon ? defaultFormula : (item.gasFormula || defaultFormula);
  item.gasCode = item.gasCode || defaultCode;
  item.gasSubtitle = item.gasSubtitle || icon.subtitle || item.itemName;
  item.isActive = item.isActive !== false && item.isActive !== 'false';
  return item;
}

function getGasIconMeta(value){
  const key = normalizeKey(value);
  const map = {
    AIR: { symbol:'Air', formula:'Air', code:'AI', subtitle:'Compressed' },
    HELIUM: { symbol:'He', formula:'He', code:'HE', subtitle:'Helium' },
    NITROGEN: { symbol:'N2', formula:'N<sub>2</sub>', code:'NI', subtitle:'Nitrogen' },
    HYDROGEN: { symbol:'H2', formula:'H<sub>2</sub>', code:'HY', subtitle:'Hydrogen' },
    ARGON: { symbol:'Ar', formula:'Ar', code:'AR', subtitle:'Argon' }
  };
  return map[key] || {};
}

function normalizeCount(source){
  return {
    id: String(source?.id || uid('count')),
    itemId: String(source?.itemId || source?.item_id || ''),
    newCount: toCount(source?.newCount ?? source?.new_count),
    inUseCount: toCount(source?.inUseCount ?? source?.in_use_count),
    emptyCount: toCount(source?.emptyCount ?? source?.empty_count),
    updatedAt: source?.updatedAt || source?.updated_at || ''
  };
}

function normalizeOrder(source){
  const status = String(source?.orderStatus || source?.order_status || 'Needed');
  return {
    id: String(source?.id || uid('ord')),
    itemId: String(source?.itemId || source?.item_id || ''),
    quantity: toPositiveCount(source?.quantity, 1),
    orderStatus: ['Needed', 'Ordered', 'Received', 'Canceled'].includes(status) ? status : 'Needed',
    orderedOn: source?.orderedOn || source?.ordered_on || '',
    receivedOn: source?.receivedOn || source?.received_on || '',
    notes: String(source?.notes || ''),
    createdAt: source?.createdAt || source?.created_at || '',
    updatedAt: source?.updatedAt || source?.updated_at || ''
  };
}

function normalizeActivity(source){
  return {
    id: String(source?.id || uid('act')),
    itemId: String(source?.itemId || source?.item_id || ''),
    orderId: String(source?.orderId || source?.order_id || ''),
    activityType: String(source?.activityType || source?.activity_type || ''),
    quantityDelta: Number(source?.quantityDelta ?? source?.quantity_delta ?? 0),
    newBefore: toCount(source?.newBefore ?? source?.new_before),
    newAfter: toCount(source?.newAfter ?? source?.new_after),
    inUseBefore: toCount(source?.inUseBefore ?? source?.in_use_before),
    inUseAfter: toCount(source?.inUseAfter ?? source?.in_use_after),
    emptyBefore: toCount(source?.emptyBefore ?? source?.empty_before),
    emptyAfter: toCount(source?.emptyAfter ?? source?.empty_after),
    notes: String(source?.notes || ''),
    createdAt: source?.createdAt || source?.created_at || new Date().toISOString()
  };
}

function normalizePayload(payload){
  const seededItems = DEFAULT_ITEMS.map((item, index) => createDefaultItem(item, index));
  const rawItems = Array.isArray(payload?.items) && payload.items.length ? payload.items : seededItems;
  const items = rawItems.map(normalizeItem).sort((a, b) => a.itemName.localeCompare(b.itemName));
  const itemIds = new Set(items.map((item) => item.id));
  const counts = (Array.isArray(payload?.counts) ? payload.counts : [])
    .map(normalizeCount)
    .filter((count) => itemIds.has(count.itemId));
  items.forEach((item) => {
    if(!counts.some((count) => count.itemId === item.id)){
      counts.push({ id:uid('count'), itemId:item.id, newCount:0, inUseCount:0, emptyCount:0, updatedAt:'' });
    }
  });
  const orders = (Array.isArray(payload?.orders) ? payload.orders : [])
    .map(normalizeOrder)
    .filter((order) => itemIds.has(order.itemId));
  const activity = (Array.isArray(payload?.activity) ? payload.activity : [])
    .map(normalizeActivity)
    .filter((row) => itemIds.has(row.itemId))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return { items, counts, orders, activity };
}

function serializeState(nextState = state){
  return JSON.stringify(nextState);
}

function snapshotState(nextState = state){
  return JSON.stringify({
    items: nextState.items,
    counts: nextState.counts,
    orders: nextState.orders,
    activity: nextState.activity.slice(0, 100)
  });
}

function getRepository(){
  return isRemoteMode() ? remoteRepository : localRepository;
}

const localRepository = {
  async list(){
    try {
      const raw = localStorage.getItem(CONSUMABLES_STORAGE_KEY);
      return normalizePayload(raw ? JSON.parse(raw) : {});
    } catch {
      return normalizePayload({});
    }
  },

  async persist(nextState){
    localStorage.setItem(CONSUMABLES_STORAGE_KEY, serializeState(nextState));
  },

  async saveItem(draft, existing){
    const now = new Date().toISOString();
    const item = normalizeItem({
      ...existing,
      ...draft,
      id: existing?.id || draft.id || uid('item'),
      createdAt: existing?.createdAt || now,
      updatedAt: now
    });
    const next = { ...state };
    next.items = existing ? next.items.map((row) => row.id === item.id ? item : row) : [...next.items, item];
    if(!next.counts.some((count) => count.itemId === item.id)){
      next.counts = [...next.counts, { id:uid('count'), itemId:item.id, newCount:0, inUseCount:0, emptyCount:0, updatedAt:now }];
    }
    state = normalizePayload(next);
    await this.persist(state);
    return item.id;
  },

  async saveCounts(itemId, nextCounts, activityDraft){
    const now = new Date().toISOString();
    const next = { ...state };
    const count = { ...getCount(itemId), ...nextCounts, updatedAt:now };
    next.counts = next.counts.some((row) => row.itemId === itemId)
      ? next.counts.map((row) => row.itemId === itemId ? count : row)
      : [...next.counts, count];
    if(activityDraft){
      next.activity = [normalizeActivity({ ...activityDraft, id:uid('act'), createdAt:now }), ...next.activity];
    }
    state = normalizePayload(next);
    await this.persist(state);
  },

  async saveOrder(draft, existing){
    const now = new Date().toISOString();
    const order = normalizeOrder({
      ...existing,
      ...draft,
      id: existing?.id || draft.id || uid('ord'),
      createdAt: existing?.createdAt || now,
      updatedAt: now
    });
    const next = { ...state };
    next.orders = existing ? next.orders.map((row) => row.id === order.id ? order : row) : [order, ...next.orders];
    next.activity = [normalizeActivity({
      id:uid('act'),
      itemId: order.itemId,
      orderId: order.id,
      activityType: existing ? 'order_updated' : 'order_created',
      notes: `${order.orderStatus} order for ${order.quantity} ${getItem(order.itemId)?.unitName || 'cylinder'}(s). ${order.notes || ''}`.trim(),
      createdAt:now
    }), ...next.activity];
    state = normalizePayload(next);
    await this.persist(state);
    return order.id;
  }
};

const remoteRepository = {
  async list(){
    const [items, counts, orders, activity] = await Promise.all([
      window.appAuth.requestJson('/rest/v1/consumable_items?select=*&order=item_name.asc'),
      window.appAuth.requestJson('/rest/v1/consumable_stock_counts?select=*'),
      window.appAuth.requestJson('/rest/v1/consumable_orders?select=*&order=created_at.desc'),
      window.appAuth.requestJson('/rest/v1/consumable_activity?select=*&order=created_at.desc&limit=200')
    ]);
    return normalizePayload({ items, counts, orders, activity });
  },

  async saveItem(draft, existing){
    const payload = {
      item_key: draft.itemKey,
      item_name: draft.itemName,
      vendor_name: draft.vendorName,
      vendor_part_number: draft.vendorPartNumber,
      cylinder_size: draft.cylinderSize,
      unit_name: draft.unitName,
      reorder_point: draft.reorderPoint,
      gas_symbol: draft.gasSymbol,
      gas_formula: draft.gasFormula,
      gas_code: draft.gasCode,
      gas_subtitle: draft.gasSubtitle,
      is_active: !!draft.isActive,
      notes: draft.notes
    };
    const url = existing?.id
      ? `/rest/v1/consumable_items?id=eq.${encodeURIComponent(existing.id)}&select=*`
      : '/rest/v1/consumable_items?select=*';
    const row = firstRow(await window.appAuth.requestJson(url, {
      method: existing?.id ? 'PATCH' : 'POST',
      headers:{ 'Content-Type':'application/json', 'Prefer':'return=representation' },
      body:JSON.stringify(payload)
    }));
    if(!row?.id){
      throw new Error('Supabase did not return the saved gas type.');
    }
    await ensureRemoteCount(row.id);
    return row.id;
  },

  async saveCounts(itemId, nextCounts, activityDraft){
    const existingCount = state.counts.find((count) => count.itemId === itemId);
    const payload = {
      item_id: itemId,
      new_count: nextCounts.newCount,
      in_use_count: nextCounts.inUseCount,
      empty_count: nextCounts.emptyCount
    };
    if(existingCount?.id){
      await window.appAuth.requestJson(`/rest/v1/consumable_stock_counts?id=eq.${encodeURIComponent(existingCount.id)}`, {
        method:'PATCH',
        headers:{ 'Content-Type':'application/json', 'Prefer':'return=minimal' },
        body:JSON.stringify(payload)
      });
    } else {
      await window.appAuth.requestJson('/rest/v1/consumable_stock_counts', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Prefer':'return=minimal' },
        body:JSON.stringify(payload)
      });
    }
    if(activityDraft){
      await insertRemoteActivity(activityDraft);
    }
  },

  async saveOrder(draft, existing){
    const payload = {
      item_id: draft.itemId,
      quantity: draft.quantity,
      order_status: draft.orderStatus,
      ordered_on: draft.orderedOn || null,
      received_on: draft.receivedOn || null,
      notes: draft.notes
    };
    const url = existing?.id
      ? `/rest/v1/consumable_orders?id=eq.${encodeURIComponent(existing.id)}&select=*`
      : '/rest/v1/consumable_orders?select=*';
    const row = firstRow(await window.appAuth.requestJson(url, {
      method: existing?.id ? 'PATCH' : 'POST',
      headers:{ 'Content-Type':'application/json', 'Prefer':'return=representation' },
      body:JSON.stringify(payload)
    }));
    if(!row?.id){
      throw new Error('Supabase did not return the saved order.');
    }
    await insertRemoteActivity({
      itemId: draft.itemId,
      orderId: row.id,
      activityType: existing ? 'order_updated' : 'order_created',
      notes: `${draft.orderStatus} order for ${draft.quantity} ${getItem(draft.itemId)?.unitName || 'cylinder'}(s). ${draft.notes || ''}`.trim()
    });
    return row.id;
  }
};

async function ensureRemoteCount(itemId){
  const rows = await window.appAuth.requestJson(`/rest/v1/consumable_stock_counts?item_id=eq.${encodeURIComponent(itemId)}&select=id`);
  if(Array.isArray(rows) && rows.length) return;
  await window.appAuth.requestJson('/rest/v1/consumable_stock_counts', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Prefer':'return=minimal' },
    body:JSON.stringify({ item_id:itemId, new_count:0, in_use_count:0, empty_count:0 })
  });
}

async function insertRemoteActivity(activityDraft){
  await window.appAuth.requestJson('/rest/v1/consumable_activity', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Prefer':'return=minimal' },
    body:JSON.stringify({
      item_id: activityDraft.itemId,
      order_id: activityDraft.orderId || null,
      activity_type: activityDraft.activityType,
      quantity_delta: Number(activityDraft.quantityDelta || 0),
      new_before: toCount(activityDraft.newBefore),
      new_after: toCount(activityDraft.newAfter),
      in_use_before: toCount(activityDraft.inUseBefore),
      in_use_after: toCount(activityDraft.inUseAfter),
      empty_before: toCount(activityDraft.emptyBefore),
      empty_after: toCount(activityDraft.emptyAfter),
      notes: activityDraft.notes || ''
    })
  });
}

function firstRow(payload){
  return Array.isArray(payload) ? payload[0] || null : payload;
}

function getItem(itemId){
  return state.items.find((item) => item.id === itemId) || null;
}

function getCount(itemId){
  return state.counts.find((count) => count.itemId === itemId) || {
    id:uid('count'),
    itemId,
    newCount:0,
    inUseCount:0,
    emptyCount:0,
    updatedAt:''
  };
}

function getOpenOrder(itemId){
  return state.orders
    .filter((order) => order.itemId === itemId && OPEN_ORDER_STATUSES.includes(order.orderStatus))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0] || null;
}

function needsOrder(item){
  const count = getCount(item.id);
  return item.isActive !== false && count.newCount <= item.reorderPoint;
}

function getItemStatus(item){
  if(item.isActive === false) return 'Inactive';
  return needsOrder(item) ? 'Needs Order' : 'Stock OK';
}

function statusPill(label){
  const key = String(label || '').toLowerCase().replace(/\s+/g, '-');
  const cls = key === 'stock-ok' ? 'active'
    : key === 'needs-order' ? 'expired'
    : key === 'inactive' ? 'inactive'
    : key;
  return `<span class="status-pill ${esc(cls)}">${esc(label)}</span>`;
}

function orderStatusPill(status){
  return `<span class="status-pill ${esc(String(status || '').toLowerCase())}">${esc(status || 'Needed')}</span>`;
}

function setFilter(filter){
  currentFilter = filter;
  render();
}

function setView(view){
  currentView = view;
  document.querySelectorAll('.view-btn').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
  const active = document.getElementById(`${view}-screen`);
  if(active) active.classList.add('active');
  render();
}

function updateSearch(value){
  searchTerm = String(value || '');
  const visible = getVisibleItems();
  if(!visible.some((item) => item.id === selectedItemId)){
    selectedItemId = visible[0]?.id || state.items[0]?.id || null;
  }
  render();
}

function selectItem(itemId){
  selectedItemId = itemId;
  renderTable();
  renderDetail();
}

function getVisibleItems(){
  const query = searchTerm.trim().toLowerCase();
  return state.items.filter((item) => {
    const openOrder = getOpenOrder(item.id);
    if(currentFilter === 'needsOrder' && !needsOrder(item)) return false;
    if(currentFilter === 'openOrders' && !openOrder) return false;
    if(currentFilter === 'inactive' && item.isActive !== false) return false;
    if(currentFilter !== 'inactive' && item.isActive === false) return false;
    if(!query) return true;
    return [
      item.itemName,
      item.itemKey,
      item.vendorName,
      item.vendorPartNumber,
      item.cylinderSize,
      item.unitName,
      item.notes,
      openOrder?.notes
    ].some((value) => String(value || '').toLowerCase().includes(query));
  });
}

function render(){
  renderStats();
  renderFilterButtons();
  renderTable();
  renderDetail();
  renderOrders();
  renderActivity();
}

function renderStats(){
  const activeItems = state.items.filter((item) => item.isActive !== false);
  document.getElementById('stat-total').textContent = String(activeItems.length);
  document.getElementById('stat-needs-order').textContent = String(activeItems.filter(needsOrder).length);
  document.getElementById('stat-new').textContent = String(activeItems.reduce((sum, item) => sum + getCount(item.id).newCount, 0));
  document.getElementById('stat-empty').textContent = String(activeItems.reduce((sum, item) => sum + getCount(item.id).emptyCount, 0));
}

function renderFilterButtons(){
  document.querySelectorAll('.filter-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === currentFilter);
  });
}

function renderTable(){
  const tbody = document.getElementById('items-tbody');
  if(!tbody) return;
  const visible = getVisibleItems();
  if(!visible.length){
    tbody.innerHTML = `
      <tr>
        <td colspan="10">
          <div class="empty-state">
            <div class="big">[]</div>
            No gas supply rows match the current filter.
          </div>
        </td>
      </tr>
    `;
    return;
  }
  tbody.innerHTML = visible.map((item) => {
    const count = getCount(item.id);
    const order = getOpenOrder(item.id);
    const openOrderCell = order
      ? `${orderStatusPill(order.orderStatus)}<div class="record-sub">${order.quantity} ${esc(item.unitName)}(s)</div>`
      : (needsOrder(item)
        ? `<button class="mini-btn warn" type="button" onclick="event.stopPropagation(); openOrderModal('', '${esc(item.id)}')">Create Order</button>`
        : '<span class="record-sub">None</span>');
    return `
      <tr class="${selectedItemId === item.id ? 'selected' : ''}" onclick="selectItem('${esc(item.id)}')">
        <td>
          <div class="gas-title-wrap">
            ${gasIconHtml(item)}
            <div>
              <div class="record-title">${esc(item.itemName)}</div>
              <div class="record-sub">${esc(item.unitName)} tally</div>
            </div>
          </div>
        </td>
        <td>${esc(item.vendorName || 'AirGas')}</td>
        <td>${esc(item.vendorPartNumber || 'Not set')}</td>
        <td>${esc(item.cylinderSize || 'Not set')}</td>
        <td class="count-cell new-count">${count.newCount}</td>
        <td class="count-cell in-use-count">${count.inUseCount}</td>
        <td class="count-cell empty-count">${count.emptyCount}</td>
        <td class="count-cell">${item.reorderPoint}</td>
        <td>${statusPill(getItemStatus(item))}</td>
        <td>${openOrderCell}</td>
      </tr>
    `;
  }).join('');
}

function renderDetail(){
  const panel = document.getElementById('detail-panel');
  if(!panel) return;
  const item = getItem(selectedItemId) || state.items[0] || null;
  if(item && !selectedItemId){
    selectedItemId = item.id;
  }
  if(!item){
    panel.innerHTML = `
      <div class="detail-empty">
        <h2>No Gas Selected</h2>
        <p>Add a gas type to begin tracking AirGas cylinder inventory.</p>
      </div>
    `;
    return;
  }
  const count = getCount(item.id);
  const order = getOpenOrder(item.id);
  const itemActivity = state.activity.filter((row) => row.itemId === item.id).slice(0, 5);
  panel.innerHTML = `
    <div class="detail-card">
      <div class="detail-head">
        <div>
          <div class="gas-title-wrap">
            ${gasIconHtml(item, 'large')}
            <div>
              <div class="detail-title">${esc(item.itemName)}</div>
              <div class="detail-meta">${esc(item.vendorName || 'AirGas')} | ${esc(item.unitName || 'Cylinder')} | reorder when New <= ${esc(item.reorderPoint)}</div>
            </div>
          </div>
        </div>
        <div class="detail-actions">
          <button class="sec-btn small" type="button" onclick="openItemModal('${esc(item.id)}')">Edit</button>
          ${needsOrder(item) && !order ? `<button class="sec-btn small" type="button" onclick="openOrderModal('', '${esc(item.id)}')">Create Order</button>` : ''}
        </div>
      </div>

      <div class="stock-strip">
        <div class="stock-box new">
          <div class="detail-item-label">New</div>
          <strong>${count.newCount}</strong>
        </div>
        <div class="stock-box use">
          <div class="detail-item-label">In Use</div>
          <strong>${count.inUseCount}</strong>
        </div>
        <div class="stock-box empty">
          <div class="detail-item-label">Empty</div>
          <strong>${count.emptyCount}</strong>
        </div>
      </div>

      <div class="action-grid">
        <button class="add-wo-btn" type="button" onclick="openCountModal('${esc(item.id)}', 'receive')">Receive Stock</button>
        <button class="add-wo-btn" type="button" onclick="openCountModal('${esc(item.id)}', 'start')">Start Cylinder</button>
        <button class="add-wo-btn" type="button" onclick="openCountModal('${esc(item.id)}', 'empty')">Mark Empty</button>
        <button class="add-wo-btn" type="button" onclick="openCountModal('${esc(item.id)}', 'return')">Return Empty</button>
        <button class="sec-btn small" type="button" onclick="openCountModal('${esc(item.id)}', 'adjust')">Adjust Counts</button>
      </div>

      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-item-label">Status</div>
          <div class="detail-item-value">${statusPill(getItemStatus(item))}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Reorder Rule</div>
          <div class="detail-item-value">Needs order when unopened backup cylinders are ${esc(item.reorderPoint)} or fewer.</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Vendor Part #</div>
          <div class="detail-item-value">${esc(item.vendorPartNumber || 'Not set')}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Cylinder Size</div>
          <div class="detail-item-value">${esc(item.cylinderSize || 'Not set')}</div>
        </div>
      </div>

      <div class="component-card">
        <h3>Open Order</h3>
        <div class="order-list">
          ${order ? renderOrderCard(order) : '<div class="activity-row">No open order for this gas.</div>'}
        </div>
      </div>

      <div class="component-card">
        <h3>Recent Activity</h3>
        <div class="activity-list">
          ${itemActivity.length ? itemActivity.map(renderActivityCard).join('') : '<div class="activity-row">No activity recorded yet.</div>'}
        </div>
      </div>

      <div class="detail-note">${esc(item.notes || 'No notes saved for this gas type.')}</div>
    </div>
  `;
}

function gasIconHtml(item){
  const formula = sanitizeGasFormula(item.gasFormula || item.gasSymbol || item.itemName);
  return `
    <div class="gas-icon" aria-hidden="true">
      <small>${esc(item.gasSubtitle || item.itemName)}</small>
      <strong>${formula}</strong>
      <span>${esc(item.gasCode || item.itemKey.slice(0, 2))}</span>
    </div>
  `;
}

function sanitizeGasFormula(value){
  const raw = String(value || '');
  if(/^[A-Za-z0-9 ]+$/.test(raw)){
    return esc(raw).replace(/([A-Za-z])([0-9]+)/g, '$1<sub>$2</sub>');
  }
  return raw.replace(/<(?!\/?sub\b)[^>]*>/gi, '');
}

function renderOrderCard(order){
  const item = getItem(order.itemId);
  return `
    <div class="order-card">
      <strong>${orderStatusPill(order.orderStatus)} ${esc(order.quantity)} ${esc(item?.unitName || 'Cylinder')}(s)</strong>
      <div>Ordered: ${esc(fmtDate(order.orderedOn))} | Received: ${esc(fmtDate(order.receivedOn))}</div>
      ${order.notes ? `<div>${esc(order.notes)}</div>` : ''}
      <div class="inline-actions" style="margin-top:8px;">
        <button class="mini-btn" type="button" onclick="openOrderModal('${esc(order.id)}')">Edit</button>
        ${order.orderStatus === 'Needed' ? `<button class="mini-btn warn" type="button" onclick="markOrderOrdered('${esc(order.id)}')">Mark Ordered</button>` : ''}
        ${OPEN_ORDER_STATUSES.includes(order.orderStatus) ? `<button class="mini-btn ok" type="button" onclick="receiveOrder('${esc(order.id)}')">Received</button>` : ''}
      </div>
    </div>
  `;
}

function renderActivityCard(row){
  return `
    <div class="activity-row">
      <strong>${esc(activityLabel(row.activityType))}</strong>
      <div>${esc(fmtDateTime(row.createdAt))}</div>
      <div>${esc(formatCountChange(row))}</div>
      ${row.notes ? `<div>${esc(row.notes)}</div>` : ''}
    </div>
  `;
}

function renderOrders(){
  const tbody = document.getElementById('orders-tbody');
  const summary = document.getElementById('orders-summary');
  if(!tbody) return;
  const orders = [...state.orders].sort((a, b) => {
    const openDiff = Number(OPEN_ORDER_STATUSES.includes(b.orderStatus)) - Number(OPEN_ORDER_STATUSES.includes(a.orderStatus));
    return openDiff || String(b.createdAt).localeCompare(String(a.createdAt));
  });
  if(summary){
    summary.textContent = `${orders.filter((order) => OPEN_ORDER_STATUSES.includes(order.orderStatus)).length} open | ${orders.length} total`;
  }
  if(!orders.length){
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="big">[]</div>
            No consumable orders have been created.
          </div>
        </td>
      </tr>
    `;
    return;
  }
  tbody.innerHTML = orders.map((order) => {
    const item = getItem(order.itemId);
    return `
      <tr>
        <td>
          <div class="record-title">${esc(item?.itemName || 'Unknown gas')}</div>
          <div class="record-sub">${esc(item?.vendorName || '')}</div>
        </td>
        <td class="count-cell">${order.quantity}</td>
        <td>${orderStatusPill(order.orderStatus)}</td>
        <td>${esc(fmtDate(order.orderedOn))}</td>
        <td>${esc(fmtDate(order.receivedOn))}</td>
        <td><div class="note-preview">${esc(order.notes || '')}</div></td>
        <td>
          <div class="inline-actions">
            <button class="mini-btn" type="button" onclick="openOrderModal('${esc(order.id)}')">Edit</button>
            ${order.orderStatus === 'Needed' ? `<button class="mini-btn warn" type="button" onclick="markOrderOrdered('${esc(order.id)}')">Ordered</button>` : ''}
            ${OPEN_ORDER_STATUSES.includes(order.orderStatus) ? `<button class="mini-btn ok" type="button" onclick="receiveOrder('${esc(order.id)}')">Received</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderActivity(){
  const tbody = document.getElementById('activity-tbody');
  const summary = document.getElementById('activity-summary');
  if(!tbody) return;
  const rows = state.activity.slice(0, 100);
  if(summary){
    summary.textContent = `${rows.length} recent event(s)`;
  }
  if(!rows.length){
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="big">[]</div>
            No count or order activity has been recorded.
          </div>
        </td>
      </tr>
    `;
    return;
  }
  tbody.innerHTML = rows.map((row) => {
    const item = getItem(row.itemId);
    return `
      <tr>
        <td>${esc(fmtDateTime(row.createdAt))}</td>
        <td>${esc(item?.itemName || 'Unknown gas')}</td>
        <td>${esc(activityLabel(row.activityType))}</td>
        <td>${esc(formatBeforeCounts(row))}</td>
        <td>${esc(formatAfterCounts(row))}</td>
        <td><div class="note-preview">${esc(row.notes || '')}</div></td>
      </tr>
    `;
  }).join('');
}

function activityLabel(type){
  const labels = {
    receive_stock:'Receive Stock',
    start_cylinder:'Start Cylinder',
    mark_empty:'Mark Empty',
    return_empty:'Return Empty',
    adjust_counts:'Adjust Counts',
    order_created:'Order Created',
    order_updated:'Order Updated',
    order_ordered:'Order Marked Ordered',
    order_received:'Order Received'
  };
  return labels[type] || String(type || 'Activity').replace(/_/g, ' ');
}

function formatBeforeCounts(row){
  return `N ${row.newBefore} | U ${row.inUseBefore} | E ${row.emptyBefore}`;
}

function formatAfterCounts(row){
  return `N ${row.newAfter} | U ${row.inUseAfter} | E ${row.emptyAfter}`;
}

function formatCountChange(row){
  return `${formatBeforeCounts(row)} -> ${formatAfterCounts(row)}`;
}

function openItemModal(itemId = ''){
  const item = getItem(itemId) || null;
  editItemId = item?.id || '';
  itemIconLabelEdited = false;
  document.getElementById('item-modal-title').textContent = item ? 'Edit Gas' : 'Add Gas';
  document.getElementById('item-name').value = item?.itemName || '';
  document.getElementById('item-icon-label').value = item?.gasSymbol || item?.gasFormula || '';
  document.getElementById('item-vendor').value = item?.vendorName || 'AirGas';
  document.getElementById('item-vendor-part').value = item?.vendorPartNumber || '';
  document.getElementById('item-cylinder-size').value = item?.cylinderSize || '';
  document.getElementById('item-unit').value = item?.unitName || 'Cylinder';
  document.getElementById('item-reorder').value = String(item?.reorderPoint ?? 2);
  document.getElementById('item-active').checked = item?.isActive !== false;
  document.getElementById('item-notes').value = item?.notes || '';
  document.getElementById('item-modal-overlay').classList.add('open');
}

function markGasIconLabelEdited(){
  itemIconLabelEdited = true;
}

function syncDefaultGasIconLabel(){
  if(editItemId || itemIconLabelEdited) return;
  const name = document.getElementById('item-name')?.value.trim() || '';
  const labelNode = document.getElementById('item-icon-label');
  if(!labelNode) return;
  if(!name){
    labelNode.value = '';
    return;
  }
  const icon = getGasIconMeta(name);
  labelNode.value = icon.symbol || gasIconAbbreviation(name);
}

function closeItemModal(){
  document.getElementById('item-modal-overlay').classList.remove('open');
  editItemId = '';
  itemIconLabelEdited = false;
}

async function saveItemFromModal(){
  const name = document.getElementById('item-name').value.trim();
  if(!name){
    alert('Gas name is required.');
    return;
  }
  const existing = getItem(editItemId);
  const icon = getGasIconMeta(existing?.itemKey || name);
  const defaultIconLabel = icon.symbol || gasIconAbbreviation(name);
  const iconLabel = document.getElementById('item-icon-label').value.trim() || defaultIconLabel;
  const gasCode = existing?.gasCode || icon.code || gasIconCode(name);
  const draft = {
    itemKey: existing?.itemKey || normalizeKey(name),
    itemName: name,
    vendorName: document.getElementById('item-vendor').value.trim() || 'AirGas',
    vendorPartNumber: document.getElementById('item-vendor-part').value.trim(),
    cylinderSize: document.getElementById('item-cylinder-size').value.trim(),
    unitName: document.getElementById('item-unit').value.trim() || 'Cylinder',
    reorderPoint: toCount(document.getElementById('item-reorder').value),
    gasSymbol: iconLabel,
    gasFormula: icon.formula && iconLabel === icon.symbol ? icon.formula : iconLabel,
    gasCode,
    gasSubtitle: existing?.gasSubtitle || icon.subtitle || name,
    isActive: document.getElementById('item-active').checked,
    notes: document.getElementById('item-notes').value.trim()
  };
  try {
    saveInFlight = true;
    showSaveStatus('saving', 'SAVING...');
    const savedId = await getRepository().saveItem(draft, existing);
    closeItemModal();
    await loadConsumables({ force:true, silent:true, preferredId:savedId });
    showSaveStatus('saved', 'SAVED');
    hideSaveStatusSoon();
  } catch (error){
    console.error('Unable to save gas type:', error);
    showSaveStatus('error', 'SAVE FAILED');
    alert(error.message || 'Unable to save the gas type.');
  } finally {
    saveInFlight = false;
  }
}

function openCountModal(itemId, action){
  const item = getItem(itemId);
  if(!item) return;
  countModalState = { itemId, action };
  const count = getCount(itemId);
  const titles = {
    receive:'Receive Stock',
    start:'Start Cylinder',
    empty:'Mark Empty',
    return:'Return Empty',
    adjust:'Adjust Counts'
  };
  document.getElementById('count-modal-title').textContent = `${titles[action] || 'Update Count'} - ${item.itemName}`;
  const body = document.getElementById('count-modal-body');
  const preview = `
    <div class="count-preview">
      <div class="detail-item"><div class="detail-item-label">New</div><div class="detail-item-value">${count.newCount}</div></div>
      <div class="detail-item"><div class="detail-item-label">In Use</div><div class="detail-item-value">${count.inUseCount}</div></div>
      <div class="detail-item"><div class="detail-item-label">Empty</div><div class="detail-item-value">${count.emptyCount}</div></div>
    </div>
  `;
  if(action === 'adjust'){
    body.innerHTML = `
      ${preview}
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label" for="count-new">New</label>
          <input class="form-input" id="count-new" type="number" min="0" step="1" value="${count.newCount}">
        </div>
        <div class="form-group">
          <label class="form-label" for="count-in-use">In Use</label>
          <input class="form-input" id="count-in-use" type="number" min="0" step="1" value="${count.inUseCount}">
        </div>
        <div class="form-group">
          <label class="form-label" for="count-empty">Empty</label>
          <input class="form-input" id="count-empty" type="number" min="0" step="1" value="${count.emptyCount}">
        </div>
        <div class="form-group full">
          <label class="form-label" for="count-note">Reason</label>
          <textarea class="form-input" id="count-note" rows="4" placeholder="Required reason for count correction"></textarea>
        </div>
      </div>
    `;
  } else {
    body.innerHTML = `
      ${preview}
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label" for="count-quantity">Quantity</label>
          <input class="form-input" id="count-quantity" type="number" min="1" step="1" value="1">
        </div>
        <div class="form-group full">
          <label class="form-label" for="count-note">Notes</label>
          <textarea class="form-input" id="count-note" rows="4" placeholder="Optional note"></textarea>
        </div>
      </div>
    `;
  }
  document.getElementById('count-modal-overlay').classList.add('open');
}

function closeCountModal(){
  document.getElementById('count-modal-overlay').classList.remove('open');
  countModalState = { itemId:'', action:'' };
}

async function saveCountAction(){
  const { itemId, action } = countModalState;
  const item = getItem(itemId);
  if(!item) return;
  const current = getCount(itemId);
  let next = { ...current };
  const note = document.getElementById('count-note')?.value.trim() || '';
  let quantity = 0;
  let activityType = '';
  if(action === 'adjust'){
    if(!note){
      alert('A reason is required when adjusting counts.');
      return;
    }
    next = {
      ...next,
      newCount: toCount(document.getElementById('count-new').value),
      inUseCount: toCount(document.getElementById('count-in-use').value),
      emptyCount: toCount(document.getElementById('count-empty').value)
    };
    activityType = 'adjust_counts';
  } else {
    quantity = toPositiveCount(document.getElementById('count-quantity')?.value, 1);
    if(action === 'receive'){
      next.newCount += quantity;
      activityType = 'receive_stock';
    } else if(action === 'start'){
      if(current.newCount < quantity){
        alert('There are not enough new cylinders to start.');
        return;
      }
      next.newCount -= quantity;
      next.inUseCount += quantity;
      activityType = 'start_cylinder';
    } else if(action === 'empty'){
      if(current.inUseCount < quantity){
        alert('There are not enough in-use cylinders to mark empty.');
        return;
      }
      next.inUseCount -= quantity;
      next.emptyCount += quantity;
      activityType = 'mark_empty';
    } else if(action === 'return'){
      if(current.emptyCount < quantity){
        alert('There are not enough empty cylinders to return.');
        return;
      }
      next.emptyCount -= quantity;
      activityType = 'return_empty';
    }
  }
  try {
    saveInFlight = true;
    showSaveStatus('saving', 'SAVING...');
    await getRepository().saveCounts(itemId, next, {
      itemId,
      activityType,
      quantityDelta: quantity,
      newBefore: current.newCount,
      newAfter: next.newCount,
      inUseBefore: current.inUseCount,
      inUseAfter: next.inUseCount,
      emptyBefore: current.emptyCount,
      emptyAfter: next.emptyCount,
      notes: note
    });
    closeCountModal();
    await loadConsumables({ force:true, silent:true, preferredId:itemId });
    showSaveStatus('saved', 'SAVED');
    hideSaveStatusSoon();
  } catch (error){
    console.error('Unable to update count:', error);
    showSaveStatus('error', 'SAVE FAILED');
    alert(error.message || 'Unable to update count.');
  } finally {
    saveInFlight = false;
  }
}

function openOrderModal(orderId = '', itemId = ''){
  const order = state.orders.find((row) => row.id === orderId) || null;
  const item = getItem(itemId || order?.itemId || selectedItemId) || state.items[0] || null;
  if(!item) return;
  editOrderId = order?.id || '';
  document.getElementById('order-modal-title').textContent = order ? 'Edit Order' : 'Create Order';
  const itemSelect = document.getElementById('order-item');
  itemSelect.innerHTML = state.items
    .filter((row) => row.isActive !== false || row.id === item.id)
    .map((row) => `<option value="${esc(row.id)}">${esc(row.itemName)}</option>`)
    .join('');
  itemSelect.value = item.id;
  itemSelect.disabled = !!order;
  document.getElementById('order-quantity').value = String(order?.quantity || Math.max(1, item.reorderPoint));
  document.getElementById('order-status').value = order?.orderStatus || 'Needed';
  document.getElementById('order-ordered-on').value = order?.orderedOn || '';
  document.getElementById('order-received-on').value = order?.receivedOn || '';
  document.getElementById('order-notes').value = order?.notes || '';
  document.getElementById('order-modal-overlay').classList.add('open');
}

function closeOrderModal(){
  document.getElementById('order-modal-overlay').classList.remove('open');
  document.getElementById('order-item').disabled = false;
  editOrderId = '';
}

async function saveOrderFromModal(){
  const existing = state.orders.find((row) => row.id === editOrderId) || null;
  const itemId = existing?.itemId || document.getElementById('order-item').value;
  const draft = {
    itemId,
    quantity: toPositiveCount(document.getElementById('order-quantity').value, 1),
    orderStatus: document.getElementById('order-status').value,
    orderedOn: document.getElementById('order-ordered-on').value,
    receivedOn: document.getElementById('order-received-on').value,
    notes: document.getElementById('order-notes').value.trim()
  };
  if(draft.orderStatus === 'Ordered' && !draft.orderedOn){
    draft.orderedOn = todayISO();
  }
  if(draft.orderStatus === 'Received' && !draft.receivedOn){
    draft.receivedOn = todayISO();
  }
  try {
    saveInFlight = true;
    showSaveStatus('saving', 'SAVING...');
    const savedOrderId = await getRepository().saveOrder(draft, existing);
    if(draft.orderStatus === 'Received' && existing?.orderStatus !== 'Received'){
      await applyReceivedOrder({ ...draft, id:savedOrderId }, existing);
    }
    closeOrderModal();
    await loadConsumables({ force:true, silent:true, preferredId:itemId });
    showSaveStatus('saved', 'SAVED');
    hideSaveStatusSoon();
  } catch (error){
    console.error('Unable to save order:', error);
    showSaveStatus('error', 'SAVE FAILED');
    alert(error.message || 'Unable to save the order.');
  } finally {
    saveInFlight = false;
  }
}

async function markOrderOrdered(orderId){
  const order = state.orders.find((row) => row.id === orderId);
  if(!order) return;
  try {
    saveInFlight = true;
    showSaveStatus('saving', 'SAVING...');
    await getRepository().saveOrder({ ...order, orderStatus:'Ordered', orderedOn:order.orderedOn || todayISO() }, order);
    await loadConsumables({ force:true, silent:true, preferredId:order.itemId });
    showSaveStatus('saved', 'ORDERED');
    hideSaveStatusSoon();
  } catch (error){
    console.error('Unable to mark order ordered:', error);
    showSaveStatus('error', 'SAVE FAILED');
    alert(error.message || 'Unable to mark the order as ordered.');
  } finally {
    saveInFlight = false;
  }
}

async function receiveOrder(orderId){
  const order = state.orders.find((row) => row.id === orderId);
  if(!order || order.orderStatus === 'Received') return;
  try {
    saveInFlight = true;
    showSaveStatus('saving', 'SAVING...');
    const draft = { ...order, orderStatus:'Received', receivedOn:order.receivedOn || todayISO() };
    await getRepository().saveOrder(draft, order);
    await applyReceivedOrder(draft, order);
    await loadConsumables({ force:true, silent:true, preferredId:order.itemId });
    showSaveStatus('saved', 'RECEIVED');
    hideSaveStatusSoon();
  } catch (error){
    console.error('Unable to receive order:', error);
    showSaveStatus('error', 'SAVE FAILED');
    alert(error.message || 'Unable to receive the order.');
  } finally {
    saveInFlight = false;
  }
}

async function applyReceivedOrder(order, existing){
  if(existing?.orderStatus === 'Received') return;
  const current = getCount(order.itemId);
  const next = { ...current, newCount: current.newCount + toPositiveCount(order.quantity, 1) };
  await getRepository().saveCounts(order.itemId, next, {
    itemId: order.itemId,
    orderId: order.id,
    activityType:'order_received',
    quantityDelta: order.quantity,
    newBefore: current.newCount,
    newAfter: next.newCount,
    inUseBefore: current.inUseCount,
    inUseAfter: next.inUseCount,
    emptyBefore: current.emptyCount,
    emptyAfter: next.emptyCount,
    notes: `Received order for ${order.quantity} cylinder(s).`
  });
}

function isInteractionOverlayOpen(){
  return ['item-modal-overlay', 'count-modal-overlay', 'order-modal-overlay'].some((id) => document.getElementById(id)?.classList.contains('open'));
}

async function loadConsumables(options = {}){
  try {
    const loaded = normalizePayload(await getRepository().list());
    const snapshot = snapshotState(loaded);
    if(!options.force && snapshot === lastLoadedSnapshot){
      return false;
    }
    state = loaded;
    lastLoadedSnapshot = snapshot;
    if(options.preferredId && state.items.some((item) => item.id === options.preferredId)){
      selectedItemId = options.preferredId;
    } else if(!state.items.some((item) => item.id === selectedItemId)){
      selectedItemId = state.items[0]?.id || null;
    }
    render();
    const modeLabel = isRemoteMode() ? 'Remote sync' : 'Local browser mode';
    setLastUpdateText(`${state.items.length} gas type(s) | ${modeLabel} | ${new Date().toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })}`);
    if(!options.silent){
      showSaveStatus('loaded', isRemoteMode() ? 'SYNCED' : 'LOADED');
      hideSaveStatusSoon(1800);
    }
    return true;
  } catch (error){
    console.error('Unable to load consumables:', error);
    setLastUpdateText('Unable to load consumables');
    if(!options.silent){
      showSaveStatus('error', 'LOAD FAILED');
      hideSaveStatusSoon(2400);
    }
    return false;
  }
}

async function refreshFromRemote(){
  if(!isRemoteMode() || document.hidden || isInteractionOverlayOpen() || autoRefreshInFlight || saveInFlight){
    return;
  }
  autoRefreshInFlight = true;
  try {
    const changed = await loadConsumables({ silent:true });
    if(changed){
      showSaveStatus('loaded', 'SYNCED');
      hideSaveStatusSoon(1800);
    }
  } finally {
    autoRefreshInFlight = false;
  }
}

function startAutoRefresh(){
  clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(refreshFromRemote, AUTO_REFRESH_MS);
}

window.addEventListener('focus', refreshFromRemote);
document.addEventListener('visibilitychange', () => {
  if(!document.hidden) refreshFromRemote();
});

(async function init(){
  await (window.authReadyPromise || Promise.resolve());
  await loadConsumables();
  setView('inventory');
  startAutoRefresh();
})();
