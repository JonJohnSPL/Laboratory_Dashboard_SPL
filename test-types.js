const TEST_DEFINITION_STORAGE_KEY = 'lab-wip-test-definitions';
const AUTO_REFRESH_MS = 15000;
const DEFAULT_TEST_DEFS = [
  { key:'AS-BFV_DENSITY', label:'AS-BFV_DENSITY', shortLabel:'DENS', minutes:15, countMode:'perSample', matrixType:'Liquid', aliases:['AS-BFV_DENSITY','ASBFVDENSITY'] },
  { key:'AS-BFV_MW', label:'AS-BFV_MW', shortLabel:'MW', minutes:15, countMode:'perSample', matrixType:'Liquid', aliases:['AS-BFV_MW','ASBFVMW'] },
  { key:'C6GAS', label:'C6GAS', shortLabel:'C6GAS', minutes:15, countMode:'perSample', matrixType:'Gas', aliases:['C6GAS','C6-GAS','GAS','GC-C6GAS'] },
  { key:'GC-BFVC6MZ', label:'GC-BFVC6MZ', shortLabel:'BFVC6', minutes:40, countMode:'perSample', matrixType:'Liquid', groupKey:'GC-BFVC', groupRank:6, aliases:['GC-BFVC6MZ','BFVC6MZ','BFVC6'] },
  { key:'GC-BFVC7MZ', label:'GC-BFVC7MZ', shortLabel:'BFVC7', minutes:40, countMode:'perSample', matrixType:'Liquid', groupKey:'GC-BFVC', groupRank:7, aliases:['GC-BFVC7MZ','BFVC7MZ','BFVC7'] },
  { key:'GC-BFVC10MZ', label:'GC-BFVC10MZ', shortLabel:'BFVC10', minutes:40, countMode:'perSample', matrixType:'Liquid', groupKey:'GC-BFVC', groupRank:10, aliases:['GC-BFVC10MZ','BFVC10MZ','BFVC10','GC'] },
  { key:'GC-2103-C10MZ', label:'GC-2103-C10MZ', shortLabel:'GC2103', minutes:90, countMode:'perSample', matrixType:'Gas', aliases:['GC-2103-C10MZ','2103C10MZ'] },
  { key:'C6LIQ', label:'C6LIQ', shortLabel:'C6LIQ', minutes:40, countMode:'perSample', matrixType:'Liquid', aliases:['C6LIQ','C6-LIQ','LIQ'] },
  { key:'C10LIQ', label:'C10LIQ', shortLabel:'C10LIQ', minutes:40, countMode:'perSample', matrixType:'Liquid', aliases:['C10LIQ','C10-LIQ'] },
];

let testDefinitions = [];
let selectedTestTypeId = null;
let editTestTypeId = null;
let searchTerm = '';
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
    clockNode.textContent = now.toLocaleTimeString('en-US', {
      hour:'2-digit',
      minute:'2-digit',
      second:'2-digit'
    });
  }
  if(dateNode){
    dateNode.textContent = now.toLocaleDateString('en-US', {
      weekday:'short',
      month:'short',
      day:'numeric',
      year:'numeric'
    });
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

function normalizeCatalogKey(raw){
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_-]/g, '');
}

function uniqueList(list){
  return [...new Set((Array.isArray(list) ? list : []).map((value) => String(value || '').trim()).filter(Boolean))];
}

function inferTone(definition){
  const key = String(definition?.key || '').toUpperCase();
  if(definition?.groupKey) return 'grouped';
  if(key.includes('LIQ')) return 'liquid';
  if(key.includes('2103')) return 'grouped';
  return 'standard';
}

function inferMatrixType(definition){
  const key = String(definition?.key || definition?.label || '').toUpperCase();
  const explicit = String(definition?.matrixType || '').trim().toLowerCase();
  if(explicit === 'gas') return 'Gas';
  if(explicit === 'liquid') return 'Liquid';
  if(explicit === 'calculated') return 'Calculated';
  if(key.includes('LIQ') || key.includes('DENS')) return 'Liquid';
  if(key.includes('GAS') || key.includes('2103')) return 'Gas';
  return '';
}

function normalizeMinutesForMatrixType(matrixType, minutes){
  if(matrixType === 'Calculated') return 0;
  return Math.max(0, Number(minutes || 0));
}

function normalizeTestDefinition(definition, index = 0){
  const key = normalizeCatalogKey(definition?.key || definition?.code || definition?.label || `TEST_${index + 1}`);
  if(!key) return null;
  const label = String(definition?.label || key).trim() || key;
  const aliasSource = Array.isArray(definition?.aliases)
    ? definition.aliases
    : String(definition?.aliases || '').split(',');
  const matrixType = inferMatrixType(definition);
  return {
    id: String(definition?.id || key),
    key,
    label,
    shortLabel: String(definition?.shortLabel || label).trim() || label,
    minutes: normalizeMinutesForMatrixType(matrixType, definition?.minutes),
    countMode: definition?.countMode === 'perRow' ? 'perRow' : 'perSample',
    matrixType,
    groupKey: normalizeCatalogKey(definition?.groupKey || ''),
    groupRank: Math.max(0, Number(definition?.groupRank || 0)),
    aliases: uniqueList([key, label, ...aliasSource]),
    sortOrder: Number.isFinite(Number(definition?.sortOrder)) ? Number(definition.sortOrder) : index,
    tone: inferTone(definition)
  };
}

function normalizeDefinitions(list){
  const source = Array.isArray(list) && list.length ? list : DEFAULT_TEST_DEFS;
  return source
    .map((definition, index) => normalizeTestDefinition(definition, index))
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
}

function serializeDefinitions(list){
  return JSON.stringify(list.map((definition) => ({
    id: definition.id,
    key: definition.key,
    label: definition.label,
    shortLabel: definition.shortLabel,
    minutes: definition.minutes,
    countMode: definition.countMode,
    matrixType: definition.matrixType,
    groupKey: definition.groupKey,
    groupRank: definition.groupRank,
    aliases: definition.aliases,
    sortOrder: definition.sortOrder
  })));
}

function getStorageAdapter(){
  return (
    window.storage &&
    typeof window.storage.get === 'function' &&
    typeof window.storage.set === 'function'
  ) ? window.storage : {
    get: async (key) => ({ value: localStorage.getItem(key) }),
    set: async (key, value) => { localStorage.setItem(key, value); }
  };
}

function isRemoteMode(){
  return !!(window.appAuth && typeof window.appAuth.getMode === 'function' && window.appAuth.getMode() === 'remote');
}

function showSaveStatus(state, message){
  const indicator = document.getElementById('save-indicator');
  if(!indicator) return;
  clearTimeout(hideSaveStatusTimer);
  indicator.style.visibility = 'visible';
  indicator.className = `save-indicator ${state}`;
  indicator.textContent = message;
}

function hideSaveStatusSoon(delay = 2400){
  clearTimeout(hideSaveStatusTimer);
  hideSaveStatusTimer = setTimeout(() => {
    const indicator = document.getElementById('save-indicator');
    if(indicator){
      indicator.style.visibility = 'hidden';
    }
  }, delay);
}

function setLastUpdateText(message){
  const node = document.getElementById('last-update');
  if(node){
    node.textContent = message;
  }
}

function getVisibleTestDefinitions(){
  const query = searchTerm.trim().toLowerCase();
  if(!query) return testDefinitions;
  return testDefinitions.filter((definition) => {
    return [
      definition.key,
      definition.label,
      definition.shortLabel,
      definition.groupKey,
      ...definition.aliases
    ].some((value) => String(value || '').toLowerCase().includes(query));
  });
}

function selectTestType(id){
  selectedTestTypeId = id;
  renderTable();
  renderDetail();
}

function updateSearch(value){
  searchTerm = String(value || '');
  const visible = getVisibleTestDefinitions();
  if(!visible.some((definition) => definition.id === selectedTestTypeId)){
    selectedTestTypeId = visible[0]?.id || testDefinitions[0]?.id || null;
  }
  renderTable();
  renderDetail();
}

function updateStats(){
  const groupCount = new Set(testDefinitions.filter((definition) => definition.groupKey).map((definition) => definition.groupKey)).size;
  document.getElementById('stat-total').textContent = String(testDefinitions.length);
  document.getElementById('stat-per-sample').textContent = String(testDefinitions.filter((definition) => definition.countMode === 'perSample').length);
  document.getElementById('stat-per-row').textContent = String(testDefinitions.filter((definition) => definition.countMode === 'perRow').length);
  document.getElementById('stat-groups').textContent = String(groupCount);
}

function renderTable(){
  const tbody = document.getElementById('test-types-tbody');
  if(!tbody) return;
  const visible = getVisibleTestDefinitions();
  if(!visible.length){
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="big">[]</div>
            No test types match the current search.
          </div>
        </td>
      </tr>
    `;
    return;
  }
  tbody.innerHTML = visible.map((definition) => `
    <tr class="${selectedTestTypeId === definition.id ? 'selected' : ''}" onclick="selectTestType('${esc(definition.id)}')">
      <td>
        <div class="record-title">${esc(definition.key)}</div>
        <div class="record-sub">${esc(definition.shortLabel)}</div>
      </td>
      <td>
        <div>${esc(definition.label)}</div>
        <div class="record-sub">${esc(definition.aliases.length)} alias(es)</div>
      </td>
      <td>${esc(definition.matrixType || 'Unspecified')}</td>
      <td>${esc(definition.minutes)} min</td>
      <td>${esc(definition.countMode === 'perRow' ? 'Per Row' : 'Per Sample')}</td>
      <td>${esc(definition.groupKey ? `${definition.groupKey} / ${definition.groupRank}` : 'Standalone')}</td>
    </tr>
  `).join('');
}

function renderDetail(){
  const panel = document.getElementById('detail-panel');
  if(!panel) return;
  const definition = testDefinitions.find((row) => row.id === selectedTestTypeId) || null;
  if(!definition){
    panel.innerHTML = `
      <div class="detail-empty">
        <h2>No Test Type Selected</h2>
        <p>Add a test type or choose one from the list to review timing, grouping, and alias rules.</p>
      </div>
    `;
    return;
  }
  const aliases = definition.aliases.filter((alias) => alias !== definition.key && alias !== definition.label);
  panel.innerHTML = `
    <div class="detail-card">
      <div class="detail-head">
        <div>
        <div class="detail-title">${esc(definition.label)}</div>
        <div class="detail-meta">
          Code ${esc(definition.key)} | ${esc(definition.countMode === 'perRow' ? 'Per Row' : 'Per Sample')} | ${esc(definition.minutes)} min
        </div>
        </div>
        <div class="detail-actions">
          <button class="sec-btn small" type="button" onclick="openTestTypeModal('${esc(definition.id)}')">Edit Record</button>
          <button class="sec-btn small" type="button" onclick="window.location.href='lab-dashboard.html'">Open Dashboard</button>
        </div>
      </div>
    <div class="detail-grid">
      <div class="detail-item">
        <div class="detail-item-label">Test Code</div>
        <div class="detail-item-value">${esc(definition.key)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">Display Label</div>
        <div class="detail-item-value">${esc(definition.label)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">Short Label</div>
        <div class="detail-item-value">${esc(definition.shortLabel)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">Minutes</div>
        <div class="detail-item-value">${esc(definition.minutes)} min</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">Count Method</div>
        <div class="detail-item-value">${esc(definition.countMode === 'perRow' ? 'Every matching row' : 'Once per sample')}</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">Matrix Type</div>
        <div class="detail-item-value">${esc(definition.matrixType || 'Unspecified')}</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">Group Family</div>
        <div class="detail-item-value">${esc(definition.groupKey || 'Standalone')}</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">Group Rank</div>
        <div class="detail-item-value">${esc(definition.groupKey ? definition.groupRank : 'Not used')}</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">Aliases</div>
        <div class="detail-item-value">${esc(aliases.length ? aliases.join(', ') : 'None')}</div>
      </div>
    </div>
    <div class="component-card">
      <h2>Behavior</h2>
      <div class="image-meta">
        ${definition.matrixType
          ? `This is configured as a ${esc(definition.matrixType.toLowerCase())} test.`
          : 'This test does not have a matrix type selected yet.'}
      </div>
      <div class="image-meta">
        ${definition.groupKey
          ? `This test belongs to grouped family ${esc(definition.groupKey)} and only the highest rank present in a sample is counted in the dashboard.`
          : 'This test counts independently and is not part of a grouped family.'}
      </div>
      <div class="image-meta" style="margin-top:10px;">
        Historical work orders continue to resolve through the saved alias list, so renamed test codes stay readable in the Lab Dashboard.
      </div>
    </div>
    </div>
  `;
}

function renderAll(){
  updateStats();
  renderTable();
  renderDetail();
}

function openTestTypeModal(id = ''){
  const definition = id ? testDefinitions.find((row) => row.id === id) : null;
  editTestTypeId = definition?.id || null;
  document.getElementById('test-type-modal-title').textContent = definition ? 'Edit Test Type' : 'Add Test Type';
  document.getElementById('type-key').value = definition?.key || '';
  document.getElementById('type-label').value = definition?.label || '';
  document.getElementById('type-short-label').value = definition?.shortLabel || '';
  document.getElementById('type-minutes').value = definition ? String(definition.minutes) : '15';
  document.getElementById('type-count-mode').value = definition?.countMode || 'perSample';
  document.getElementById('type-matrix-type').value = definition?.matrixType || inferMatrixType(definition) || '';
  document.getElementById('type-group-key').value = definition?.groupKey || '';
  document.getElementById('type-group-rank').value = definition?.groupKey ? String(definition.groupRank) : '';
  document.getElementById('type-aliases').value = definition
    ? definition.aliases.filter((alias) => alias !== definition.key && alias !== definition.label).join(', ')
    : '';
  applyTestTypeFormMatrixDefaults(false);
  document.getElementById('test-type-modal-overlay').classList.add('open');
}

function closeTestTypeModal(){
  editTestTypeId = null;
  document.getElementById('test-type-modal-overlay').classList.remove('open');
}

async function saveTestTypeFromModal(){
  const keyInput = document.getElementById('type-key').value.trim();
  if(!keyInput){
    alert('Test code is required.');
    return;
  }
  const key = normalizeCatalogKey(keyInput);
  const label = document.getElementById('type-label').value.trim() || key;
  const shortLabel = document.getElementById('type-short-label').value.trim() || label;
  const matrixType = inferMatrixType({ matrixType:document.getElementById('type-matrix-type').value, key, label });
  const minutes = normalizeMinutesForMatrixType(matrixType, document.getElementById('type-minutes').value);
  const countMode = document.getElementById('type-count-mode').value === 'perRow' ? 'perRow' : 'perSample';
  const groupKey = normalizeCatalogKey(document.getElementById('type-group-key').value.trim());
  const groupRank = Math.max(0, Number(document.getElementById('type-group-rank').value || 0));
  const aliasValues = uniqueList(String(document.getElementById('type-aliases').value || '').split(',').map((value) => value.trim()));
  const nextDefinitions = [...testDefinitions];
  const existingIndex = nextDefinitions.findIndex((definition) => definition.id === editTestTypeId);
  const duplicate = nextDefinitions.find((definition, index) => definition.key === key && index !== existingIndex);
  if(duplicate){
    alert(`A test type named ${key} already exists.`);
    return;
  }

  const previous = existingIndex >= 0 ? nextDefinitions[existingIndex] : null;
  const aliases = previous && previous.key !== key
    ? uniqueList([previous.key, ...previous.aliases, ...aliasValues])
    : uniqueList([...(previous?.aliases || []), ...aliasValues]);
  const nextDefinition = normalizeTestDefinition({
    id: previous?.id || key,
    key,
    label,
    shortLabel,
    minutes,
    countMode,
    matrixType,
    groupKey,
    groupRank,
    aliases,
    sortOrder: previous?.sortOrder ?? nextDefinitions.length
  });

  if(existingIndex >= 0){
    nextDefinitions[existingIndex] = nextDefinition;
  } else {
    nextDefinitions.push(nextDefinition);
  }

  try {
    saveInFlight = true;
    showSaveStatus('saving', 'SAVING...');
    const normalized = normalizeDefinitions(nextDefinitions);
    const raw = serializeDefinitions(normalized);
    await getStorageAdapter().set(TEST_DEFINITION_STORAGE_KEY, raw);
    testDefinitions = normalized;
    lastLoadedSnapshot = raw;
    selectedTestTypeId = nextDefinition.id;
    closeTestTypeModal();
    renderAll();
    setLastUpdateText(`${testDefinitions.length} type(s) | ${isRemoteMode() ? 'Remote' : 'Local'} | ${new Date().toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })}`);
    showSaveStatus('saved', 'SAVED');
    hideSaveStatusSoon();
  } catch (error) {
    console.error('Unable to save test type catalog:', error);
    showSaveStatus('error', 'SAVE FAILED');
    alert(error.message || 'Unable to save the test type catalog.');
  } finally {
    saveInFlight = false;
  }
}

function applyTestTypeFormMatrixDefaults(forceZero = true){
  const matrixSelect = document.getElementById('type-matrix-type');
  const minutesInput = document.getElementById('type-minutes');
  if(!matrixSelect || !minutesInput) return;
  if(matrixSelect.value === 'Calculated'){
    minutesInput.value = '0';
  } else if(forceZero && minutesInput.value === '' && matrixSelect.value){
    minutesInput.value = '15';
  }
}

async function loadTestTypes(options = {}){
  try {
    const result = await getStorageAdapter().get(TEST_DEFINITION_STORAGE_KEY);
    const raw = typeof result?.value === 'string' && result.value ? result.value : serializeDefinitions(normalizeDefinitions(DEFAULT_TEST_DEFS));
    if(!options.force && raw === lastLoadedSnapshot){
      return false;
    }
    const parsed = JSON.parse(raw);
    testDefinitions = normalizeDefinitions(parsed);
    lastLoadedSnapshot = serializeDefinitions(testDefinitions);
    const visible = getVisibleTestDefinitions();
    if(options.preferredId && testDefinitions.some((definition) => definition.id === options.preferredId)){
      selectedTestTypeId = options.preferredId;
    } else if(!visible.some((definition) => definition.id === selectedTestTypeId)){
      selectedTestTypeId = visible[0]?.id || testDefinitions[0]?.id || null;
    }
    renderAll();
    setLastUpdateText(`${testDefinitions.length} type(s) | ${isRemoteMode() ? 'Remote' : 'Local'} | ${new Date().toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })}`);
    if(!options.silent){
      showSaveStatus('loaded', isRemoteMode() ? 'SYNCED' : 'LOADED');
      hideSaveStatusSoon();
    }
    return true;
  } catch (error) {
    console.error('Unable to load test type catalog:', error);
    setLastUpdateText('Unable to load test types');
    if(!options.silent){
      showSaveStatus('error', 'LOAD FAILED');
      hideSaveStatusSoon();
    }
    return false;
  }
}

function isInteractionOverlayOpen(){
  return document.getElementById('test-type-modal-overlay')?.classList.contains('open');
}

async function refreshFromSharedStorage(){
  if(!isRemoteMode() || document.hidden || isInteractionOverlayOpen() || autoRefreshInFlight || saveInFlight){
    return;
  }
  autoRefreshInFlight = true;
  try {
    const changed = await loadTestTypes({ silent:true });
    if(changed){
      showSaveStatus('loaded', 'SYNCED');
      hideSaveStatusSoon(1800);
    }
  } finally {
    autoRefreshInFlight = false;
  }
}

function stopAutoRefresh(){
  if(autoRefreshTimer){
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

function startAutoRefresh(){
  stopAutoRefresh();
  if(!isRemoteMode()) return;
  autoRefreshTimer = setInterval(() => {
    refreshFromSharedStorage();
  }, AUTO_REFRESH_MS);
}

document.addEventListener('visibilitychange', () => {
  if(!document.hidden){
    refreshFromSharedStorage();
  }
});

document.getElementById('test-type-modal-overlay').addEventListener('click', (event) => {
  if(event.target === document.getElementById('test-type-modal-overlay')){
    closeTestTypeModal();
  }
});

(async function init(){
  await (window.authReadyPromise || Promise.resolve());
  await loadTestTypes({ silent:true, force:true });
  startAutoRefresh();
  refreshFromSharedStorage();
})();
