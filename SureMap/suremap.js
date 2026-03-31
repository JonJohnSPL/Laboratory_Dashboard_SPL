(function(){
  'use strict';

  const STORAGE_KEY = 'field-ops-dashboard-data';
  const LEGACY_STORAGE_KEY = 'spl-client-map-v1';
  const CLIENT_STATUS_OPTIONS = ['Active', 'Pending', 'On Hold', 'Inactive'];
  const CLIENT_SECTOR_OPTIONS = ['Upstream', 'Midstream', 'Downstream', 'Other'];
  const SITE_TYPE_OPTIONS = ['Well Site', 'Meter Station', 'Field Site', 'Well Pad', 'LACT Unit', 'Facility', 'Pipeline Location', 'Office / Yard', 'Other'];
  const SITE_STATUS_OPTIONS = ['Active', 'Restricted', 'Inactive'];
  const AVATAR_COLORS = ['#59d67d', '#b0f28f', '#ffd166', '#6fe3ff', '#ff8fa3', '#c9b6ff'];
  const HOME_BASE = {
    name: 'SPL Pittsburgh',
    street: '1817 Parkway View Drive',
    city: 'Pittsburgh',
    state: 'PA',
    zip: '15205',
    lat: 40.435349,
    lng: -80.130022
  };

  const state = {
    data: createEmptyData(),
    viewClients: [],
    filteredClients: [],
    filterTag: 'All',
    searchQuery: '',
    activeClientId: '',
    activeSiteId: '',
    expandedIds: new Set(),
    map: null,
    baseLayer: null,
    homeMarker: null,
    markerCache: new Map(),
    booted: false,
    searchTimer: null,
    hideSaveTimer: null,
    mapResizeTimer: null,
    tileErrorNotified: false
  };

  const els = {};

  document.addEventListener('DOMContentLoaded', init);

  function init(){
    cacheElements();
    hydrateSelects();
    bindShell();
    bindToolbar();
    bindPanels();
    bindModals();
    initMap();
    tickClock();
    setInterval(tickClock, 1000);
    bindPageRefresh();
    showSaveStatus('loaded', 'READY');
    const ready = window.authReadyPromise instanceof Promise ? window.authReadyPromise : Promise.resolve();
    ready.then(() => loadData({ preserveSelection:false, focusSelection:false })).catch(handleLoadError);
  }

  function cacheElements(){
    [
      'clock', 'datedisp', 'save-indicator', 'toolbar-summary', 'search-input', 'add-client-btn', 'modify-selection-btn',
      'reset-shared-btn', 'suremap-stats', 'list-summary', 'map-summary', 'filter-row', 'client-list', 'map',
      'map-placeholder', 'detail-panel', 'detail-primary-btn', 'client-modal-overlay', 'client-modal-title',
      'client-id', 'client-name', 'client-sector', 'client-status', 'client-contact', 'client-phone', 'client-email',
      'client-address-search', 'client-address-results', 'client-street', 'client-city', 'client-state', 'client-zip',
      'client-delete-btn', 'client-save-btn', 'client-form', 'site-modal-overlay', 'site-modal-title', 'site-id',
      'site-client-id', 'site-name', 'site-type', 'site-status', 'site-notes', 'site-address-search',
      'site-address-results', 'site-street', 'site-city', 'site-state', 'site-zip', 'site-lat', 'site-lng',
      'site-delete-btn', 'site-save-btn', 'site-form'
    ].forEach((id) => { els[id] = document.getElementById(id); });
  }

  function createEmptyData(){
    return { clients: [], sites: [], jobs: [], jobAssignments: [], samples: [] };
  }

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  }

  function uid(prefix){
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function isRemoteMode(){
    return !!(window.appAuth && typeof window.appAuth.getMode === 'function' && window.appAuth.getMode() === 'remote');
  }

  function normalizeNumber(value){
    if(value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function hasCoords(lat, lng){
    return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  }

  function normalizeOption(value, options, fallback){
    const raw = String(value ?? '').trim();
    if(!raw) return fallback;
    const match = options.find((option) => option.toLowerCase() === raw.toLowerCase());
    return match || fallback;
  }

  function normalizeStatus(value){ return normalizeOption(value, CLIENT_STATUS_OPTIONS, 'Active'); }
  function normalizeSector(value){ return normalizeOption(value, CLIENT_SECTOR_OPTIONS, 'Upstream'); }
  function normalizeSiteStatus(value){ return normalizeOption(value, SITE_STATUS_OPTIONS, 'Active'); }
  function normalizeSiteType(value){
    const legacy = { well:'Well Site', meter:'Meter Station', facility:'Facility', field:'Field Site', other:'Other' };
    return normalizeOption(legacy[String(value ?? '').trim()] || value, SITE_TYPE_OPTIONS, 'Other');
  }

  function parseGps(value){
    if(!value) return null;
    const match = String(value).match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if(!match) return null;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    return hasCoords(lat, lng) ? { lat, lng } : null;
  }

  function formatGps(lat, lng){
    return hasCoords(lat, lng) ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : '';
  }

  function formatAddress(street, city, stateCode, zip){
    const parts = [String(street || '').trim(), String(city || '').trim()].filter(Boolean);
    const tail = [String(stateCode || '').trim(), String(zip || '').trim()].filter(Boolean).join(' ');
    if(tail) parts.push(tail);
    return parts.join(', ');
  }

  function splitAddress(address){
    const raw = String(address || '').trim();
    if(!raw) return { street:'', city:'', state:'', zip:'' };
    const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
    const match = (parts.slice(2).join(' ')).match(/^([A-Za-z]{2})\s*(.*)$/);
    return {
      street: parts[0] || '',
      city: parts[1] || '',
      state: match ? match[1].toUpperCase() : '',
      zip: match ? match[2].trim() : ''
    };
  }

  function initials(name){
    return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CL';
  }

  function getAvatarColor(id){
    const key = String(id || '');
    let hash = 0;
    for(let i = 0; i < key.length; i += 1){
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash |= 0;
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  function clientStatusClass(status){
    const normalized = normalizeStatus(status);
    if(normalized === 'Active') return 'ok';
    if(normalized === 'Pending' || normalized === 'On Hold') return 'warn';
    return 'muted';
  }

  function siteStatusClass(status){
    const normalized = normalizeSiteStatus(status);
    if(normalized === 'Active') return 'ok';
    if(normalized === 'Restricted') return 'warn';
    return 'muted';
  }

  function getSiteIcon(type){
    const normalized = normalizeSiteType(type);
    if(normalized === 'Well Site' || normalized === 'Well Pad') return '⛽';
    if(normalized === 'Meter Station') return '📊';
    if(normalized === 'Facility' || normalized === 'LACT Unit') return '🏭';
    if(normalized === 'Field Site' || normalized === 'Pipeline Location') return '📍';
    if(normalized === 'Office / Yard') return '🏢';
    return '📌';
  }

  function showSaveStatus(mode, text){
    if(!els['save-indicator']) return;
    clearTimeout(state.hideSaveTimer);
    els['save-indicator'].className = `save-indicator ${mode}`;
    els['save-indicator'].textContent = text;
    els['save-indicator'].style.visibility = 'visible';
    if(mode === 'saved' || mode === 'loaded'){
      state.hideSaveTimer = setTimeout(() => { els['save-indicator'].style.visibility = 'hidden'; }, 1600);
    }
  }

  function getSiteIconToken(type){
    const normalized = normalizeSiteType(type);
    if(normalized === 'Well Site' || normalized === 'Well Pad') return 'WL';
    if(normalized === 'Meter Station') return 'MT';
    if(normalized === 'Facility' || normalized === 'LACT Unit') return 'FC';
    if(normalized === 'Field Site' || normalized === 'Pipeline Location') return 'FS';
    if(normalized === 'Office / Yard') return 'YD';
    return 'ST';
  }

  function tickClock(){
    const now = new Date();
    if(els.clock){
      els.clock.textContent = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    }
    if(els.datedisp){
      els.datedisp.textContent = now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
    }
  }

  function hydrateSelects(){
    fillSelect(els['client-sector'], CLIENT_SECTOR_OPTIONS);
    fillSelect(els['client-status'], CLIENT_STATUS_OPTIONS);
    fillSelect(els['site-type'], SITE_TYPE_OPTIONS);
    fillSelect(els['site-status'], SITE_STATUS_OPTIONS);
  }

  function fillSelect(select, values){
    if(!select) return;
    select.innerHTML = values.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
  }

  function bindShell(){
    document.querySelectorAll('[data-nav]').forEach((button) => {
      button.addEventListener('click', () => { window.location.href = button.dataset.nav; });
    });
  }

  function bindToolbar(){
    els['search-input'].addEventListener('input', () => {
      state.searchQuery = els['search-input'].value.trim().toLowerCase();
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(() => refreshFilteredView({ syncMap:true, preserveSelection:true, focusSelection:false }), 120);
    });
    els['add-client-btn'].addEventListener('click', () => openClientModal());
    els['modify-selection-btn'].addEventListener('click', handleModifySelection);
    els['reset-shared-btn'].addEventListener('click', resetSharedData);
    els['detail-primary-btn'].addEventListener('click', handleDetailPrimaryAction);
  }

  function bindPanels(){
    els['filter-row'].addEventListener('click', (event) => {
      const chip = event.target.closest('[data-filter]');
      if(!chip) return;
      state.filterTag = chip.dataset.filter || 'All';
      refreshFilteredView({ syncMap:true, preserveSelection:true, focusSelection:false });
    });

    els['client-list'].addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-toggle-client]');
      if(toggle){
        const clientId = toggle.dataset.toggleClient;
        if(state.expandedIds.has(clientId)) state.expandedIds.delete(clientId);
        else state.expandedIds.add(clientId);
        renderList();
        return;
      }
      const siteCard = event.target.closest('[data-site-id]');
      if(siteCard){
        selectSite(siteCard.dataset.clientId, siteCard.dataset.siteId, { focusMap:true });
        return;
      }
      const clientCard = event.target.closest('[data-client-id]');
      if(clientCard){
        selectClient(clientCard.dataset.clientId, { focusMap:true });
      }
    });

    els['detail-panel'].addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]');
      if(!action) return;
      const { action: actionName, clientId, siteId } = action.dataset;
      if(actionName === 'copy-address') copyToClipboard(getClientAddress(clientId), 'Address copied.');
      if(actionName === 'copy-coords') copyToClipboard(getSiteCoords(siteId), 'Coordinates copied.');
      if(actionName === 'open-directions-client') openDirections(getClientAddress(clientId));
      if(actionName === 'open-directions-site') openDirections(getSiteDirections(siteId));
      if(actionName === 'edit-client') openClientModal(clientId);
      if(actionName === 'edit-site') openSiteModal(clientId, siteId);
      if(actionName === 'add-site') openSiteModal(clientId);
      if(actionName === 'delete-client') deleteClientRecord(clientId);
      if(actionName === 'delete-site') deleteSiteRecord(clientId, siteId);
    });
  }

  function bindModals(){
    document.querySelectorAll('[data-close-modal]').forEach((button) => {
      button.addEventListener('click', () => closeModal(button.dataset.closeModal));
    });
    [els['client-modal-overlay'], els['site-modal-overlay']].forEach((overlay) => {
      overlay.addEventListener('click', (event) => {
        if(event.target === overlay) closeModal(overlay.id);
      });
    });
    els['client-save-btn'].addEventListener('click', saveClientFromModal);
    els['site-save-btn'].addEventListener('click', saveSiteFromModal);
    els['client-delete-btn'].addEventListener('click', () => deleteClientRecord(els['client-id'].value));
    els['site-delete-btn'].addEventListener('click', () => deleteSiteRecord(els['site-client-id'].value, els['site-id'].value));
    els['client-form'].addEventListener('submit', (event) => { event.preventDefault(); saveClientFromModal(); });
    els['site-form'].addEventListener('submit', (event) => { event.preventDefault(); saveSiteFromModal(); });
    bindAutocomplete({
      input: els['client-address-search'],
      results: els['client-address-results'],
      onPick: (item) => applyAddressPick(item, { street:'client-street', city:'client-city', state:'client-state', zip:'client-zip', input:'client-address-search' })
    });
    bindAutocomplete({
      input: els['site-address-search'],
      results: els['site-address-results'],
      onPick: (item) => applyAddressPick(item, { street:'site-street', city:'site-city', state:'site-state', zip:'site-zip', input:'site-address-search', lat:'site-lat', lng:'site-lng' })
    });
  }

  function bindPageRefresh(){
    window.addEventListener('storage', (event) => {
      if(!isRemoteMode() && event.key === STORAGE_KEY){
        loadData({ preserveSelection:true, focusSelection:false }).catch(handleLoadError);
      }
    });
    document.addEventListener('visibilitychange', () => {
      if(!document.hidden && state.booted){
        scheduleMapResize();
        loadData({ preserveSelection:true, focusSelection:false }).catch(handleLoadError);
      }
    });
  }

  function initMap(){
    state.map = L.map(els.map, { zoomControl:true }).setView([40.44, -79.99], 10);
    state.map.options.closePopupOnClick = false;
    window.addEventListener('resize', scheduleMapResize);
    scheduleMapResize();
    replaceBasemapLayer();
  }

  async function loadData(options = {}){
    showSaveStatus('saving', 'LOADING');
    state.data = isRemoteMode() ? await readRemoteData() : readLocalData();
    state.viewClients = buildViewClients(state.data);
    state.booted = true;
    refreshFilteredView({ syncMap:true, preserveSelection:options.preserveSelection !== false, focusSelection:options.focusSelection !== false });
    scheduleMapResize();
    showSaveStatus('loaded', 'READY');
  }

  function scheduleMapResize(){
    if(!state.map) return;
    clearTimeout(state.mapResizeTimer);
    state.mapResizeTimer = setTimeout(() => {
      state.map.invalidateSize(false);
    }, 90);
  }

  function replaceBasemapLayer(){
    if(!state.map || typeof L === 'undefined' || typeof L.TileLayer === 'undefined') return;
    state.tileErrorNotified = false;
    state.map.eachLayer((layer) => {
      if(layer instanceof L.TileLayer){
        state.map.removeLayer(layer);
      }
    });
    const basemap = getBasemapConfig();
    state.baseLayer = L.tileLayer(basemap.url, basemap.options).addTo(state.map);
    state.baseLayer.on('tileerror', handleBasemapTileError);
    scheduleMapResize();
  }

  function getBasemapConfig(){
    const configured = window.APP_CONFIG?.sureMapTileLayer;
    if(configured?.url){
      return {
        url: configured.url,
        options: {
          attribution: configured.attribution || '&copy; OpenStreetMap contributors',
          maxZoom: configured.maxZoom || 20,
          subdomains: configured.subdomains || undefined
        }
      };
    }
    return {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      options: {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 20,
        subdomains: 'abcd'
      }
    };
  }

  function handleBasemapTileError(){
    if(state.tileErrorNotified) return;
    state.tileErrorNotified = true;
    console.warn('SureMap basemap tiles failed to load.');
    els['map-summary'].textContent = 'Basemap unavailable. Markers are still active.';
    showSaveStatus('error', 'MAP TILE ERROR');
  }

  function handleLoadError(error){
    console.error('SureMap load failed:', error);
    showSaveStatus('error', 'LOAD FAILED');
    alert(error.message || 'SureMap could not load shared client/site data.');
  }

  function readLocalRaw(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error){
      console.warn('Unable to parse local SureMap data.', error);
      return {};
    }
  }

  function readLocalData(){
    const raw = readLocalRaw();
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return {
      clients: Array.isArray(raw.clients) ? raw.clients.map(normalizeClient).sort(sortByClientName) : [],
      sites: Array.isArray(raw.sites) ? raw.sites.map(normalizeSite).sort(sortBySiteName) : [],
      jobs: Array.isArray(raw.jobs) ? raw.jobs.map((row) => ({ id:String(row?.id || ''), clientId:String(row?.clientId || ''), siteId:String(row?.siteId || '') })) : [],
      jobAssignments: Array.isArray(raw.jobAssignments) ? raw.jobAssignments.map((row) => ({ id:String(row?.id || ''), jobId:String(row?.jobId || '') })) : [],
      samples: Array.isArray(raw.samples) ? raw.samples.map((row) => ({ id:String(row?.id || ''), jobId:String(row?.jobId || ''), clientId:String(row?.clientId || ''), siteId:String(row?.siteId || '') })) : []
    };
  }

  async function readRemoteData(){
    const [clients, sites, jobs, jobAssignments, samples] = await Promise.all([
      window.appAuth.requestJson('/rest/v1/field_clients?select=*'),
      window.appAuth.requestJson('/rest/v1/field_sites?select=*'),
      window.appAuth.requestJson('/rest/v1/field_jobs?select=id,client_id,site_id'),
      window.appAuth.requestJson('/rest/v1/field_job_assignments?select=id,job_id'),
      window.appAuth.requestJson('/rest/v1/field_samples?select=id,job_id,client_id,site_id')
    ]);
    return {
      clients: (clients || []).map((row) => normalizeClient(row, true)).sort(sortByClientName),
      sites: (sites || []).map((row) => normalizeSite(row, true)).sort(sortBySiteName),
      jobs: (jobs || []).map((row) => ({ id:String(row?.id || ''), clientId:String(row?.client_id || ''), siteId:String(row?.site_id || '') })),
      jobAssignments: (jobAssignments || []).map((row) => ({ id:String(row?.id || ''), jobId:String(row?.job_id || '') })),
      samples: (samples || []).map((row) => ({ id:String(row?.id || ''), jobId:String(row?.job_id || ''), clientId:String(row?.client_id || ''), siteId:String(row?.site_id || '') }))
    };
  }

  function normalizeClient(row, fromRemote = false){
    return {
      id: String(row?.id || ''),
      clientName: String((fromRemote ? row?.client_name : row?.clientName) || '').trim(),
      accountStatus: normalizeStatus(fromRemote ? row?.account_status : row?.accountStatus),
      sector: normalizeSector(row?.sector),
      primaryContact: String((fromRemote ? row?.primary_contact : row?.primaryContact) || '').trim(),
      contactPhone: String((fromRemote ? row?.contact_phone : row?.contactPhone) || '').trim(),
      contactEmail: String((fromRemote ? row?.contact_email : row?.contactEmail) || '').trim(),
      billingNotes: String((fromRemote ? row?.billing_notes : row?.billingNotes) || '').trim(),
      operationalNotes: String((fromRemote ? row?.operational_notes : row?.operationalNotes) || '').trim(),
      salesforceAccountId: String((fromRemote ? row?.salesforce_account_id : row?.salesforceAccountId) || '').trim(),
      defaultServiceArea: String((fromRemote ? row?.default_service_area : row?.defaultServiceArea) || '').trim(),
      hqStreet: String((fromRemote ? row?.hq_street : row?.hqStreet) || '').trim(),
      hqCity: String((fromRemote ? row?.hq_city : row?.hqCity) || '').trim(),
      hqState: String((fromRemote ? row?.hq_state : row?.hqState) || '').trim().toUpperCase(),
      hqZip: String((fromRemote ? row?.hq_zip : row?.hqZip) || '').trim(),
      hqLatitude: normalizeNumber(fromRemote ? row?.hq_latitude : row?.hqLatitude),
      hqLongitude: normalizeNumber(fromRemote ? row?.hq_longitude : row?.hqLongitude)
    };
  }

  function normalizeSite(row, fromRemote = false){
    const gps = String((fromRemote ? row?.gps_coordinates : row?.gpsCoordinates) || '').trim();
    const parsed = parseGps(gps);
    return {
      id: String(row?.id || ''),
      clientId: String((fromRemote ? row?.client_id : row?.clientId) || ''),
      siteName: String((fromRemote ? row?.site_name : row?.siteName) || '').trim(),
      siteType: normalizeSiteType(fromRemote ? row?.site_type : row?.siteType),
      physicalAddress: String((fromRemote ? row?.physical_address : row?.physicalAddress) || '').trim(),
      countyState: String((fromRemote ? row?.county_state : row?.countyState) || '').trim(),
      gpsCoordinates: parsed ? formatGps(parsed.lat, parsed.lng) : gps,
      accessInstructions: String((fromRemote ? row?.access_instructions : row?.accessInstructions) || '').trim(),
      safetyPpeNotes: String((fromRemote ? row?.safety_ppe_notes : row?.safetyPpeNotes) || '').trim(),
      gateCodeEntryRequirements: String((fromRemote ? row?.gate_code_entry_requirements : row?.gateCodeEntryRequirements) || '').trim(),
      clientSiteContact: String((fromRemote ? row?.client_site_contact : row?.clientSiteContact) || '').trim(),
      siteStatus: normalizeSiteStatus(fromRemote ? row?.site_status : row?.siteStatus),
      standardJobTypes: String((fromRemote ? row?.standard_job_types : row?.standardJobTypes) || '').trim(),
      notes: String(row?.notes || '').trim()
    };
  }

  function sortByClientName(left, right){ return left.clientName.localeCompare(right.clientName); }
  function sortBySiteName(left, right){ return left.siteName.localeCompare(right.siteName); }

  function buildViewClients(data){
    const sitesByClient = new Map();
    data.sites.forEach((site) => {
      const list = sitesByClient.get(site.clientId) || [];
      const coords = parseGps(site.gpsCoordinates);
      list.push({
        id: site.id,
        clientId: site.clientId,
        name: site.siteName || 'Unnamed Site',
        type: site.siteType,
        status: site.siteStatus,
        notes: site.notes || '',
        address: site.physicalAddress || '',
        coordsLabel: site.gpsCoordinates || '',
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null
      });
      sitesByClient.set(site.clientId, list);
    });

    return data.clients.map((client) => ({
      id: client.id,
      name: client.clientName || 'Unnamed Client',
      accountStatus: client.accountStatus,
      sector: client.sector,
      contact: client.primaryContact || 'Not set',
      phone: client.contactPhone || 'Not set',
      email: client.contactEmail || 'Not set',
      address: formatAddress(client.hqStreet, client.hqCity, client.hqState, client.hqZip),
      lat: client.hqLatitude,
      lng: client.hqLongitude,
      sublocations: (sitesByClient.get(client.id) || []).sort((a, b) => a.name.localeCompare(b.name))
    }));
  }

  function refreshFilteredView(options = {}){
    state.filteredClients = getFilteredClients();
    normalizeSelection(options.preserveSelection !== false);
    renderStats();
    renderToolbarSummary();
    renderFilterRow();
    renderList();
    renderMapSummary();
    renderDetailPanel();
    updateActionButtons();
    if(options.syncMap !== false) syncMarkers();
    if(options.focusSelection !== false) focusSelectionOnMap();
  }

  function getFilteredClients(){
    const query = state.searchQuery;
    return state.viewClients.filter((client) => {
      const matchesTag = state.filterTag === 'All' || client.sector === state.filterTag || client.accountStatus === state.filterTag;
      if(!matchesTag) return false;
      if(!query) return true;
      const haystack = [
        client.name, client.sector, client.accountStatus, client.contact, client.phone, client.email, client.address,
        ...client.sublocations.flatMap((site) => [site.name, site.type, site.status, site.address, site.notes])
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  function normalizeSelection(preserveSelection){
    if(!preserveSelection){
      state.activeClientId = '';
      state.activeSiteId = '';
      return;
    }
    if(state.activeSiteId){
      const owner = state.filteredClients.find((client) => client.sublocations.some((site) => site.id === state.activeSiteId));
      if(owner){
        state.activeClientId = owner.id;
        return;
      }
    }
    if(state.activeClientId){
      const client = state.filteredClients.find((row) => row.id === state.activeClientId);
      if(client){
        state.activeSiteId = '';
        return;
      }
    }
    state.activeClientId = '';
    state.activeSiteId = '';
  }

  function renderStats(){
    const totalSites = state.viewClients.reduce((sum, client) => sum + client.sublocations.length, 0);
    const activeClients = state.viewClients.filter((client) => client.accountStatus === 'Active').length;
    const pendingClients = state.viewClients.filter((client) => client.accountStatus === 'Pending' || client.accountStatus === 'On Hold').length;
    const activeSites = state.data.sites.filter((site) => site.siteStatus === 'Active').length;
    els['suremap-stats'].innerHTML = [
      statCard('Shared Clients', state.viewClients.length, 'loaded'),
      statCard('Mapped Sites', totalSites, 'loaded'),
      statCard('Active Clients', activeClients, 'ok'),
      statCard('Pending / Hold', pendingClients, pendingClients ? 'warn' : 'loaded'),
      statCard('Active Sites', activeSites, 'ok')
    ].join('');
  }

  function statCard(label, value, tone){
    return `<div class="stat-card ${esc(tone)}"><div class="stat-label">${esc(label)}</div><div class="stat-value ${esc(tone === 'loaded' ? '' : tone)}">${esc(value)}</div></div>`;
  }

  function renderToolbarSummary(){
    if(state.activeSiteId){
      const site = getActiveSite();
      const client = getActiveClient();
      els['toolbar-summary'].textContent = `${client?.name || 'Client'} / ${site?.name || 'Site'} selected. Shared data updates write back to Field Ops.`;
      return;
    }
    if(state.activeClientId){
      const client = getActiveClient();
      els['toolbar-summary'].textContent = `${client?.name || 'Client'} selected. Use SureMap to manage HQ pins and site geography from the shared directory.`;
      return;
    }
    els['toolbar-summary'].textContent = 'Shared client and site directory synced with Field Ops.';
  }

  function renderFilterRow(){
    const tags = ['All', ...new Set([...state.viewClients.map((client) => client.sector), ...state.viewClients.map((client) => client.accountStatus)].filter(Boolean))];
    if(!tags.includes(state.filterTag)) state.filterTag = 'All';
    els['filter-row'].innerHTML = tags.map((tag) => `<button class="suremap-chip ${state.filterTag === tag ? 'active' : ''}" type="button" data-filter="${esc(tag)}">${esc(tag)}</button>`).join('');
  }

  function renderList(){
    els['list-summary'].textContent = `${state.filteredClients.length} visible / ${state.viewClients.length} total`;
    if(!state.viewClients.length){
      els['client-list'].innerHTML = `<div class="empty-state"><strong>No shared clients yet</strong>Add a client here or from Field Ops to start mapping.</div>`;
      return;
    }
    if(!state.filteredClients.length){
      els['client-list'].innerHTML = `<div class="empty-state"><strong>No matches</strong>Try a different search or filter.</div>`;
      return;
    }
    els['client-list'].innerHTML = state.filteredClients.map(renderClientCardMarkup).join('');
  }

  function renderClientCardMarkup(client){
    const color = getAvatarColor(client.id);
    const expanded = state.expandedIds.has(client.id);
    const activeClient = state.activeClientId === client.id && !state.activeSiteId;
    const siteRows = client.sublocations.map((site) => renderSiteCardMarkup(client, site, color)).join('');
    const toggleLabel = client.sublocations.length ? `${client.sublocations.length} site${client.sublocations.length === 1 ? '' : 's'}` : 'No sites yet';
    return `
      <article class="suremap-client-card ${activeClient ? 'active' : ''}" data-client-id="${esc(client.id)}">
        <div class="suremap-client-head">
          <div class="suremap-avatar" style="background:${color}22;color:${color}">${esc(initials(client.name))}</div>
          <div class="suremap-client-copy">
            <div class="item-title">${esc(client.name)}</div>
            <div class="item-sub">${esc(client.sector)} | ${esc(client.contact)}</div>
            <div class="tag-row">
              <span class="status-badge ${esc(clientStatusClass(client.accountStatus))}">${esc(client.accountStatus)}</span>
            </div>
          </div>
        </div>
        <div class="suremap-client-address">${esc(client.address || 'No HQ address set')}</div>
        <div class="suremap-site-toggle ${expanded ? 'open' : ''}" data-toggle-client="${esc(client.id)}">
          <span class="arrow">&gt;</span>
          <span>${esc(toggleLabel)}</span>
        </div>
        <div class="suremap-site-list ${expanded ? 'open' : ''}">
          ${siteRows || `<div class="muted">Add a site from the details panel or modify menu.</div>`}
        </div>
      </article>
    `;
  }

  function renderSiteCardMarkup(client, site, color){
    const active = state.activeSiteId === site.id;
    return `
      <div class="suremap-site-card ${active ? 'active' : ''}" data-client-id="${esc(client.id)}" data-site-id="${esc(site.id)}">
        <div class="suremap-site-icon" style="background:${color}22;color:${color}">${esc(getSiteIconToken(site.type))}</div>
        <div class="suremap-site-copy">
          <div class="item-title">${esc(site.name)}</div>
          <div class="item-sub">${esc(site.type)} | ${esc(site.address || site.coordsLabel || 'No location yet')}</div>
          <div class="tag-row">
            <span class="status-badge ${esc(siteStatusClass(site.status))}">${esc(site.status)}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderClientCard(client){
    return renderClientCardMarkup(client);
  }

  function renderSiteCard(client, site, color){
    return renderSiteCardMarkup(client, site, color);
  }

  function renderMapSummary(){
    const siteCount = state.filteredClients.reduce((sum, client) => sum + client.sublocations.length, 0);
    els['map-summary'].textContent = `${state.filteredClients.length} clients / ${siteCount} sites visible`;
  }

  function renderDetailPanel(){
    const client = getActiveClient();
    const site = getActiveSite();
    if(!client){
      els['detail-panel'].innerHTML = `<div class="suremap-empty-state empty-state"><strong>No selection</strong>Choose a client or site to inspect shared details, directions, and edit actions.</div>`;
      return;
    }
    if(site){
      els['detail-panel'].innerHTML = renderSiteDetail(client, site);
      return;
    }
    els['detail-panel'].innerHTML = renderClientDetail(client);
  }

  function renderClientDetail(client){
    const address = client.address || 'No HQ address set';
    return `
      <div class="suremap-detail-card">
        <div class="suremap-detail-title">
          <div class="item-title">${esc(client.name)}</div>
          <div class="tag-row">
            <span class="status-badge ${esc(clientStatusClass(client.accountStatus))}">${esc(client.accountStatus)}</span>
            <span class="tag-chip">${esc(client.sector)}</span>
          </div>
        </div>
        <div class="suremap-detail-grid">
          <div class="suremap-detail-item"><label>Contact</label><span>${esc(client.contact)}</span></div>
          <div class="suremap-detail-item"><label>Phone</label><span>${esc(client.phone)}</span></div>
          <div class="suremap-detail-item full"><label>Email</label><span>${esc(client.email)}</span></div>
          <div class="suremap-detail-item full"><label>HQ Address</label><span>${esc(address)}</span></div>
          <div class="suremap-detail-item"><label>Mapped Sites</label><span>${esc(client.sublocations.length)}</span></div>
          <div class="suremap-detail-item"><label>Directions From</label><span>${esc(HOME_BASE.name)}</span></div>
        </div>
        <div class="suremap-detail-actions">
          <button class="act-btn" type="button" data-action="copy-address" data-client-id="${esc(client.id)}">Copy Address</button>
          <button class="act-btn" type="button" data-action="open-directions-client" data-client-id="${esc(client.id)}">Directions</button>
          <button class="act-btn" type="button" data-action="add-site" data-client-id="${esc(client.id)}">+ Add Site</button>
          <button class="act-btn" type="button" data-action="edit-client" data-client-id="${esc(client.id)}">Edit Client</button>
          <button class="act-btn danger" type="button" data-action="delete-client" data-client-id="${esc(client.id)}">Delete Client</button>
        </div>
      </div>
    `;
  }

  function renderSiteDetail(client, site){
    return `
      <div class="suremap-detail-card">
        <div class="suremap-detail-title">
          <div class="item-title">${esc(site.name)}</div>
          <div class="tag-row">
            <span class="status-badge ${esc(siteStatusClass(site.status))}">${esc(site.status)}</span>
            <span class="tag-chip">${esc(site.type)}</span>
          </div>
          <div class="item-sub">${esc(client.name)}</div>
        </div>
        <div class="suremap-detail-grid">
          <div class="suremap-detail-item"><label>Coordinates</label><span>${esc(site.coordsLabel || 'Not mapped')}</span></div>
          <div class="suremap-detail-item"><label>Type</label><span>${esc(site.type)}</span></div>
          <div class="suremap-detail-item full"><label>Address</label><span>${esc(site.address || 'No address set')}</span></div>
          <div class="suremap-detail-item full"><label>Notes</label><span>${esc(site.notes || 'No notes')}</span></div>
          <div class="suremap-detail-item"><label>Directions From</label><span>${esc(HOME_BASE.name)}</span></div>
        </div>
        <div class="suremap-detail-actions">
          <button class="act-btn" type="button" data-action="copy-coords" data-site-id="${esc(site.id)}">Copy Coords</button>
          <button class="act-btn" type="button" data-action="open-directions-site" data-site-id="${esc(site.id)}">Directions</button>
          <button class="act-btn" type="button" data-action="edit-site" data-client-id="${esc(client.id)}" data-site-id="${esc(site.id)}">Edit Site</button>
          <button class="act-btn danger" type="button" data-action="delete-site" data-client-id="${esc(client.id)}" data-site-id="${esc(site.id)}">Delete Site</button>
        </div>
      </div>
    `;
  }

  function updateActionButtons(){
    const hasSelection = !!state.activeClientId;
    els['modify-selection-btn'].disabled = !hasSelection;
    els['modify-selection-btn'].textContent = state.activeSiteId ? 'Modify Site' : 'Modify Client';
    if(state.activeSiteId){
      els['detail-primary-btn'].disabled = false;
      els['detail-primary-btn'].textContent = 'Edit Site';
      return;
    }
    if(state.activeClientId){
      els['detail-primary-btn'].disabled = false;
      els['detail-primary-btn'].textContent = 'Add Site';
      return;
    }
    els['detail-primary-btn'].disabled = true;
    els['detail-primary-btn'].textContent = 'Modify Selection';
  }

  function handleModifySelection(){
    if(state.activeSiteId){
      openSiteModal(state.activeClientId, state.activeSiteId);
      return;
    }
    if(state.activeClientId){
      openClientModal(state.activeClientId);
    }
  }

  function handleDetailPrimaryAction(){
    if(state.activeSiteId){
      openSiteModal(state.activeClientId, state.activeSiteId);
      return;
    }
    if(state.activeClientId){
      openSiteModal(state.activeClientId);
    }
  }

  function syncMarkers(){
    const visibleKeys = new Set();
    ensureHomeMarker();
    state.filteredClients.forEach((client) => {
      const clientColor = getAvatarColor(client.id);
      if(hasCoords(client.lat, client.lng)){
        const key = `client:${client.id}`;
        visibleKeys.add(key);
        upsertMarker(key, [client.lat, client.lng], makeMarkerIcon(clientColor, false), buildPopup(client.name, client.address || 'No HQ address'), () => selectClient(client.id, { focusMap:false, fromMap:true }));
      }
      client.sublocations.forEach((site) => {
        if(!hasCoords(site.lat, site.lng)) return;
        const key = `site:${site.id}`;
        visibleKeys.add(key);
        upsertMarker(key, [site.lat, site.lng], makeMarkerIcon(clientColor, true), buildPopup(site.name, site.address || site.notes || site.coordsLabel), () => selectSite(client.id, site.id, { focusMap:false, fromMap:true }));
      });
    });
    Array.from(state.markerCache.keys()).forEach((key) => {
      if(!visibleKeys.has(key)){
        state.map.removeLayer(state.markerCache.get(key));
        state.markerCache.delete(key);
      }
    });
  }

  function ensureHomeMarker(){
    if(!hasCoords(HOME_BASE.lat, HOME_BASE.lng) || state.homeMarker) return;
    state.homeMarker = L.marker([HOME_BASE.lat, HOME_BASE.lng], { icon:makeHomeIcon() })
      .bindPopup(buildPopup(HOME_BASE.name, formatAddress(HOME_BASE.street, HOME_BASE.city, HOME_BASE.state, HOME_BASE.zip)), { autoPan:false })
      .addTo(state.map);
  }

  function upsertMarker(key, latLng, icon, popupHtml, onClick){
    let marker = state.markerCache.get(key);
    if(!marker){
      marker = L.marker(latLng, { icon });
      marker.on('click', onClick);
      marker.addTo(state.map);
      state.markerCache.set(key, marker);
    } else {
      marker.setLatLng(latLng);
      marker.setIcon(icon);
    }
    marker.bindPopup(popupHtml, { autoPan:false });
  }

  function buildPopup(title, copy){
    return `<div class="suremap-popup-title">${esc(title)}</div><div class="suremap-popup-copy">${esc(copy)}</div>`;
  }

  function makeMarkerIcon(color, isSite){
    const size = isSite ? [22, 30] : [28, 36];
    const anchor = isSite ? [11, 30] : [14, 36];
    const inner = isSite ? 4 : 5;
    return L.divIcon({
      className: '',
      iconSize: size,
      iconAnchor: anchor,
      popupAnchor: [0, isSite ? -26 : -32],
      html: `<svg width="${size[0]}" height="${size[1]}" viewBox="0 0 ${size[0]} ${size[1]}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M${size[0] / 2} 0C${isSite ? '4.9 0 0 4.9 0 11c0 8.3 11 19 11 19s11-10.7 11-19C22 4.9 17.1 0 11 0Z' : '6.7 0 0 6.7 0 14.5c0 10.5 14 21.5 14 21.5s14-11 14-21.5C28 6.7 21.3 0 14 0Z'}" fill="${color}"/><circle cx="${size[0] / 2}" cy="${isSite ? 11 : 14}" r="${inner}" fill="#071009"/></svg>`
    });
  }

  function makeHomeIcon(){
    return L.divIcon({
      className: '',
      iconSize: [30, 34],
      iconAnchor: [15, 34],
      popupAnchor: [0, -30],
      html: '<svg width="30" height="34" viewBox="0 0 30 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 1 2 12v20h26V12L15 1Z" fill="#ffd166"/><path d="M10 32V19h10v13" fill="#071009"/><path d="M8 15h14" stroke="#071009" stroke-width="2"/></svg>'
    });
  }

  function focusSelectionOnMap(){
    const site = getActiveSite();
    if(site && hasCoords(site.lat, site.lng)){
      els['map-placeholder'].classList.add('hidden');
      state.map.flyTo([site.lat, site.lng], 14, { animate:true, duration:.6 });
      state.markerCache.get(`site:${site.id}`)?.openPopup();
      return;
    }
    const client = getActiveClient();
    if(client && hasCoords(client.lat, client.lng)){
      els['map-placeholder'].classList.add('hidden');
      state.map.flyTo([client.lat, client.lng], 12, { animate:true, duration:.6 });
      state.markerCache.get(`client:${client.id}`)?.openPopup();
      return;
    }
    els['map-placeholder'].classList.remove('hidden');
  }

  function selectClient(clientId, options = {}){
    const client = state.filteredClients.find((row) => row.id === String(clientId));
    if(!client) return;
    state.activeClientId = client.id;
    state.activeSiteId = '';
    state.expandedIds.add(client.id);
    renderList();
    renderToolbarSummary();
    renderDetailPanel();
    updateActionButtons();
    if(options.focusMap !== false) focusSelectionOnMap();
  }

  function selectSite(clientId, siteId, options = {}){
    const client = state.filteredClients.find((row) => row.id === String(clientId));
    const site = client?.sublocations.find((row) => row.id === String(siteId));
    if(!client || !site) return;
    state.activeClientId = client.id;
    state.activeSiteId = site.id;
    state.expandedIds.add(client.id);
    renderList();
    renderToolbarSummary();
    renderDetailPanel();
    updateActionButtons();
    if(options.focusMap !== false) focusSelectionOnMap();
  }

  function getActiveClient(){
    return state.viewClients.find((row) => row.id === state.activeClientId) || null;
  }

  function getActiveSite(){
    const client = getActiveClient();
    return client?.sublocations.find((row) => row.id === state.activeSiteId) || null;
  }

  function getClientRecord(id){ return state.data.clients.find((row) => row.id === String(id)) || null; }
  function getSiteRecord(id){ return state.data.sites.find((row) => row.id === String(id)) || null; }
  function getClientAddress(id){ const client = getClientRecord(id); return formatAddress(client?.hqStreet, client?.hqCity, client?.hqState, client?.hqZip); }
  function getSiteCoords(id){ return getSiteRecord(id)?.gpsCoordinates || ''; }
  function getSiteDirections(id){ const site = getSiteRecord(id); return site?.physicalAddress || site?.gpsCoordinates || ''; }

  function openModal(id){ document.getElementById(id).classList.add('open'); }
  function closeModal(id){ document.getElementById(id).classList.remove('open'); }

  function resetClientForm(){
    els['client-form'].reset();
    els['client-id'].value = '';
    els['client-sector'].value = 'Upstream';
    els['client-status'].value = 'Active';
    clearAutocompleteSelection(els['client-address-search']);
    els['client-address-results'].innerHTML = '';
    els['client-address-results'].classList.remove('open');
    els['client-delete-btn'].style.display = 'none';
    els['client-modal-title'].textContent = 'Add Client';
    els['client-save-btn'].textContent = 'Save';
  }

  function openClientModal(clientId = ''){
    resetClientForm();
    if(clientId){
      const client = getClientRecord(clientId);
      if(!client) return;
      els['client-id'].value = client.id;
      els['client-name'].value = client.clientName;
      els['client-sector'].value = client.sector;
      els['client-status'].value = client.accountStatus;
      els['client-contact'].value = client.primaryContact;
      els['client-phone'].value = client.contactPhone;
      els['client-email'].value = client.contactEmail;
      els['client-street'].value = client.hqStreet;
      els['client-city'].value = client.hqCity;
      els['client-state'].value = client.hqState;
      els['client-zip'].value = client.hqZip;
      els['client-modal-title'].textContent = 'Edit Client';
      els['client-delete-btn'].style.display = '';
    }
    openModal('client-modal-overlay');
  }

  function resetSiteForm(){
    els['site-form'].reset();
    els['site-id'].value = '';
    els['site-client-id'].value = '';
    els['site-type'].value = 'Well Site';
    els['site-status'].value = 'Active';
    clearAutocompleteSelection(els['site-address-search']);
    els['site-address-results'].innerHTML = '';
    els['site-address-results'].classList.remove('open');
    els['site-delete-btn'].style.display = 'none';
    els['site-modal-title'].textContent = 'Add Site';
  }

  function openSiteModal(clientId, siteId = ''){
    resetSiteForm();
    els['site-client-id'].value = String(clientId || state.activeClientId || '');
    if(siteId){
      const site = getSiteRecord(siteId);
      if(!site) return;
      const address = splitAddress(site.physicalAddress);
      const coords = parseGps(site.gpsCoordinates);
      els['site-id'].value = site.id;
      els['site-name'].value = site.siteName;
      els['site-type'].value = site.siteType;
      els['site-status'].value = site.siteStatus;
      els['site-notes'].value = site.notes;
      els['site-street'].value = address.street;
      els['site-city'].value = address.city;
      els['site-state'].value = address.state;
      els['site-zip'].value = address.zip;
      els['site-lat'].value = coords?.lat ?? '';
      els['site-lng'].value = coords?.lng ?? '';
      els['site-address-search'].value = site.physicalAddress || '';
      els['site-modal-title'].textContent = 'Edit Site';
      els['site-delete-btn'].style.display = '';
    }
    openModal('site-modal-overlay');
  }

  async function saveClientFromModal(){
    const id = els['client-id'].value;
    const existing = id ? getClientRecord(id) : null;
    const street = els['client-street'].value.trim();
    const city = els['client-city'].value.trim();
    const stateCode = els['client-state'].value.trim().toUpperCase();
    const zip = els['client-zip'].value.trim();
    const name = els['client-name'].value.trim();
    if(!name || !street || !city){
      alert('Client name, HQ street, and HQ city are required.');
      return;
    }
    const saveButton = els['client-save-btn'];
    saveButton.disabled = true;
    showSaveStatus('saving', 'SAVING');
    try {
      let coords = getAutocompleteCoords(els['client-address-search']);
      if(!coords){
        coords = await geocodeAddress(street, city, stateCode, zip);
      }
      if(!coords) throw new Error('Unable to geocode that HQ address. Use address search or verify the address details.');
      const record = {
        ...(existing || {
          billingNotes: '', operationalNotes: '', salesforceAccountId: '', defaultServiceArea: ''
        }),
        id: existing?.id || '',
        clientName: name,
        sector: els['client-sector'].value,
        accountStatus: els['client-status'].value,
        primaryContact: els['client-contact'].value.trim(),
        contactPhone: els['client-phone'].value.trim(),
        contactEmail: els['client-email'].value.trim(),
        hqStreet: street,
        hqCity: city,
        hqState: stateCode,
        hqZip: zip,
        hqLatitude: coords.lat,
        hqLongitude: coords.lng
      };
      const clientId = await saveClientRecord(record);
      closeModal('client-modal-overlay');
      await loadData({ preserveSelection:false, focusSelection:false });
      selectClient(clientId, { focusMap:true });
      showSaveStatus('saved', 'SAVED');
    } catch (error){
      console.error('SureMap client save failed:', error);
      showSaveStatus('error', 'SAVE FAILED');
      alert(error.message || 'Unable to save the client.');
    } finally {
      saveButton.disabled = false;
    }
  }

  async function saveSiteFromModal(){
    const id = els['site-id'].value;
    const existing = id ? getSiteRecord(id) : null;
    const clientId = els['site-client-id'].value || state.activeClientId;
    const siteName = els['site-name'].value.trim();
    const street = els['site-street'].value.trim();
    const city = els['site-city'].value.trim();
    const stateCode = els['site-state'].value.trim().toUpperCase();
    const zip = els['site-zip'].value.trim();
    if(!clientId || !siteName){
      alert('Select a client first and enter a site name.');
      return;
    }
    const saveButton = els['site-save-btn'];
    saveButton.disabled = true;
    showSaveStatus('saving', 'SAVING');
    try {
      let lat = normalizeNumber(els['site-lat'].value);
      let lng = normalizeNumber(els['site-lng'].value);
      const address = formatAddress(street, city, stateCode, zip) || existing?.physicalAddress || '';
      if(!hasCoords(lat, lng)){
        const picked = getAutocompleteCoords(els['site-address-search']);
        const coords = picked || (street && city ? await geocodeAddress(street, city, stateCode, zip) : null);
        if(!coords) throw new Error('Enter site coordinates directly or provide an address that can be geocoded.');
        lat = coords.lat;
        lng = coords.lng;
      }
      const record = {
        ...(existing || {
          accessInstructions: '', safetyPpeNotes: '', gateCodeEntryRequirements: '', clientSiteContact: '', standardJobTypes: ''
        }),
        id: existing?.id || '',
        clientId,
        siteName,
        siteType: els['site-type'].value,
        siteStatus: els['site-status'].value,
        notes: els['site-notes'].value.trim(),
        physicalAddress: address,
        countyState: [city, stateCode].filter(Boolean).join(', '),
        gpsCoordinates: formatGps(lat, lng)
      };
      const siteId = await saveSiteRecord(record);
      closeModal('site-modal-overlay');
      await loadData({ preserveSelection:false, focusSelection:false });
      selectSite(clientId, siteId, { focusMap:true });
      showSaveStatus('saved', 'SAVED');
    } catch (error){
      console.error('SureMap site save failed:', error);
      showSaveStatus('error', 'SAVE FAILED');
      alert(error.message || 'Unable to save the site.');
    } finally {
      saveButton.disabled = false;
    }
  }

  async function saveClientRecord(record){
    if(isRemoteMode()){
      const url = record.id ? `/rest/v1/field_clients?id=eq.${encodeURIComponent(record.id)}&select=*` : '/rest/v1/field_clients?select=*';
      const payload = await window.appAuth.requestJson(url, {
        method: record.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type':'application/json', Prefer:'return=representation' },
        body: JSON.stringify({
          client_name: record.clientName,
          account_status: record.accountStatus,
          sector: record.sector,
          primary_contact: record.primaryContact,
          contact_phone: record.contactPhone,
          contact_email: record.contactEmail,
          billing_notes: record.billingNotes,
          operational_notes: record.operationalNotes,
          salesforce_account_id: record.salesforceAccountId,
          default_service_area: record.defaultServiceArea,
          hq_street: record.hqStreet,
          hq_city: record.hqCity,
          hq_state: record.hqState,
          hq_zip: record.hqZip,
          hq_latitude: normalizeNumber(record.hqLatitude),
          hq_longitude: normalizeNumber(record.hqLongitude)
        })
      });
      const row = Array.isArray(payload) ? payload[0] : payload;
      return String(row?.id || record.id);
    }
    const raw = readLocalRaw();
    const normalized = normalizeClient(record);
    const next = raw.clients ? raw.clients.map(normalizeClient) : [];
    const nextRecord = { ...normalized, id: normalized.id || uid('client') };
    const index = next.findIndex((row) => row.id === nextRecord.id);
    if(index >= 0) next[index] = nextRecord;
    else next.push(nextRecord);
    raw.clients = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return nextRecord.id;
  }

  async function saveSiteRecord(record){
    if(isRemoteMode()){
      const url = record.id ? `/rest/v1/field_sites?id=eq.${encodeURIComponent(record.id)}&select=*` : '/rest/v1/field_sites?select=*';
      const payload = await window.appAuth.requestJson(url, {
        method: record.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type':'application/json', Prefer:'return=representation' },
        body: JSON.stringify({
          client_id: record.clientId,
          site_name: record.siteName,
          site_type: record.siteType,
          physical_address: record.physicalAddress,
          county_state: record.countyState,
          gps_coordinates: record.gpsCoordinates,
          access_instructions: record.accessInstructions,
          safety_ppe_notes: record.safetyPpeNotes,
          gate_code_entry_requirements: record.gateCodeEntryRequirements,
          client_site_contact: record.clientSiteContact,
          site_status: record.siteStatus,
          standard_job_types: record.standardJobTypes,
          notes: record.notes
        })
      });
      const row = Array.isArray(payload) ? payload[0] : payload;
      return String(row?.id || record.id);
    }
    const raw = readLocalRaw();
    const normalized = normalizeSite(record);
    const next = raw.sites ? raw.sites.map(normalizeSite) : [];
    const nextRecord = { ...normalized, id: normalized.id || uid('site') };
    const index = next.findIndex((row) => row.id === nextRecord.id);
    if(index >= 0) next[index] = nextRecord;
    else next.push(nextRecord);
    raw.sites = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return nextRecord.id;
  }

  async function deleteClientRecord(clientId){
    const id = String(clientId || '');
    if(!id) return;
    const block = getClientDeleteBlock(id);
    if(block){
      alert(block);
      return;
    }
    const siteCount = state.data.sites.filter((site) => site.clientId === id).length;
    if(!confirm(`Delete this client${siteCount ? ` and ${siteCount} mapped site${siteCount === 1 ? '' : 's'}` : ''}?`)) return;
    showSaveStatus('saving', 'DELETING');
    try {
      if(isRemoteMode()){
        await window.appAuth.requestJson(`/rest/v1/field_clients?id=eq.${encodeURIComponent(id)}`, { method:'DELETE' });
      } else {
        const raw = readLocalRaw();
        raw.clients = (raw.clients || []).filter((row) => String(row?.id || '') !== id);
        raw.sites = (raw.sites || []).filter((row) => String(row?.clientId || '') !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
      }
      closeModal('client-modal-overlay');
      await loadData({ preserveSelection:false, focusSelection:false });
      showSaveStatus('saved', 'DELETED');
    } catch (error){
      console.error('SureMap client delete failed:', error);
      showSaveStatus('error', 'DELETE FAILED');
      alert(error.message || 'Unable to delete the client.');
    }
  }

  async function deleteSiteRecord(clientId, siteId){
    const id = String(siteId || '');
    if(!id) return;
    const block = getSiteDeleteBlock(id);
    if(block){
      alert(block);
      return;
    }
    if(!confirm('Delete this mapped site?')) return;
    showSaveStatus('saving', 'DELETING');
    try {
      if(isRemoteMode()){
        await window.appAuth.requestJson(`/rest/v1/field_sites?id=eq.${encodeURIComponent(id)}`, { method:'DELETE' });
      } else {
        const raw = readLocalRaw();
        raw.sites = (raw.sites || []).filter((row) => String(row?.id || '') !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
      }
      closeModal('site-modal-overlay');
      await loadData({ preserveSelection:false, focusSelection:false });
      if(clientId) selectClient(clientId, { focusMap:true });
      showSaveStatus('saved', 'DELETED');
    } catch (error){
      console.error('SureMap site delete failed:', error);
      showSaveStatus('error', 'DELETE FAILED');
      alert(error.message || 'Unable to delete the site.');
    }
  }

  function getClientDeleteBlock(clientId){
    const siteIds = state.data.sites.filter((site) => site.clientId === clientId).map((site) => site.id);
    const jobIds = state.data.jobs.filter((job) => job.clientId === clientId || siteIds.includes(job.siteId)).map((job) => job.id);
    const jobs = jobIds.length;
    const samples = state.data.samples.filter((sample) => sample.clientId === clientId || siteIds.includes(sample.siteId) || jobIds.includes(sample.jobId)).length;
    return jobs || samples ? `This client cannot be deleted because it still has ${jobs} linked job${jobs === 1 ? '' : 's'} and ${samples} linked sample${samples === 1 ? '' : 's'}. Clear those records first.` : '';
  }

  function getSiteDeleteBlock(siteId){
    const jobIds = state.data.jobs.filter((job) => job.siteId === siteId).map((job) => job.id);
    const jobs = jobIds.length;
    const samples = state.data.samples.filter((sample) => sample.siteId === siteId || jobIds.includes(sample.jobId)).length;
    return jobs || samples ? `This site cannot be deleted because it still has ${jobs} linked job${jobs === 1 ? '' : 's'} and ${samples} linked sample${samples === 1 ? '' : 's'}. Clear those records first.` : '';
  }

  async function resetSharedData(){
    if(!confirm('This will permanently clear shared clients, sites, jobs, job assignments, and samples. Continue?')) return;
    if(window.prompt('Type RESET to confirm clearing the shared client/site data.', '') !== 'RESET'){
      alert('Reset canceled.');
      return;
    }
    els['reset-shared-btn'].disabled = true;
    showSaveStatus('saving', 'RESETTING');
    try {
      if(isRemoteMode()){
        for(const table of ['field_job_assignments', 'field_samples', 'field_jobs', 'field_sites', 'field_clients']){
          await window.appAuth.requestJson(`/rest/v1/${table}?id=not.is.null`, { method:'DELETE' });
        }
      } else {
        const raw = readLocalRaw();
        raw.clients = [];
        raw.sites = [];
        raw.jobs = [];
        raw.jobAssignments = [];
        raw.samples = [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
      closeModal('client-modal-overlay');
      closeModal('site-modal-overlay');
      await loadData({ preserveSelection:false, focusSelection:false });
      showSaveStatus('saved', 'RESET');
      alert('Shared client/site data has been reset.');
    } catch (error){
      console.error('SureMap reset failed:', error);
      showSaveStatus('error', 'RESET FAILED');
      alert(error.message || 'Unable to reset the shared client/site data.');
    } finally {
      els['reset-shared-btn'].disabled = false;
    }
  }

  function bindAutocomplete(config){
    let timer = null;
    let seq = 0;
    config.input.addEventListener('input', () => {
      clearAutocompleteSelection(config.input);
      clearTimeout(timer);
      const query = config.input.value.trim();
      if(query.length < 4){
        config.results.classList.remove('open');
        config.results.innerHTML = '';
        return;
      }
      timer = setTimeout(async () => {
        const current = ++seq;
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=us&q=${encodeURIComponent(query)}`;
          const response = await fetch(url);
          const rows = await response.json();
          if(current !== seq) return;
          config.results.innerHTML = (Array.isArray(rows) ? rows : []).map((item, index) => `<div class="suremap-autocomplete-item" data-index="${index}"><strong>${esc(item.display_name)}</strong><span>${esc(item.type || 'address')}</span></div>`).join('');
          config.results.classList.toggle('open', !!config.results.innerHTML);
          config.results.querySelectorAll('[data-index]').forEach((row) => {
            row.addEventListener('mousedown', (event) => {
              event.preventDefault();
              const item = rows[Number(row.dataset.index)];
              config.onPick(item);
              config.input.dataset.selLat = String(item.lat || '');
              config.input.dataset.selLng = String(item.lon || '');
              config.input.value = item.display_name;
              config.results.classList.remove('open');
            });
          });
        } catch (_error){
          config.results.classList.remove('open');
        }
      }, 220);
    });
    config.input.addEventListener('blur', () => setTimeout(() => config.results.classList.remove('open'), 120));
  }

  function applyAddressPick(item, ids){
    const address = item.address || {};
    document.getElementById(ids.street).value = buildStreet(address);
    document.getElementById(ids.city).value = address.city || address.town || address.village || address.hamlet || '';
    document.getElementById(ids.state).value = getStateCode(address);
    document.getElementById(ids.zip).value = address.postcode || '';
    if(ids.lat) document.getElementById(ids.lat).value = item.lat || '';
    if(ids.lng) document.getElementById(ids.lng).value = item.lon || '';
    document.getElementById(ids.input).dataset.selLat = String(item.lat || '');
    document.getElementById(ids.input).dataset.selLng = String(item.lon || '');
  }

  function buildStreet(address){
    return `${address.house_number || ''} ${address.road || address.pedestrian || address.highway || ''}`.trim();
  }

  function getStateCode(address){
    const iso = address['ISO3166-2-lvl4'] || address['ISO3166-2-lvl6'] || '';
    if(iso.includes('-')) return iso.split('-').pop().toUpperCase();
    const stateCode = String(address.state_code || '').toUpperCase();
    return stateCode.length === 2 ? stateCode : '';
  }

  function clearAutocompleteSelection(input){
    input.dataset.selLat = '';
    input.dataset.selLng = '';
  }

  function getAutocompleteCoords(input){
    const lat = normalizeNumber(input.dataset.selLat);
    const lng = normalizeNumber(input.dataset.selLng);
    return hasCoords(lat, lng) ? { lat, lng } : null;
  }

  async function geocodeAddress(street, city, stateCode, zip){
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formatAddress(street, city, stateCode, zip))}&format=jsonv2&limit=1&countrycodes=us`);
      const rows = await response.json();
      if(!Array.isArray(rows) || !rows.length) return null;
      const lat = Number(rows[0].lat);
      const lng = Number(rows[0].lon);
      return hasCoords(lat, lng) ? { lat, lng } : null;
    } catch (_error){
      return null;
    }
  }

  async function copyToClipboard(value, message){
    if(!value){
      alert('Nothing to copy.');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      alert(message);
    } catch (_error){
      alert(value);
    }
  }

  function openDirections(destination){
    if(!destination) return;
    const origin = formatAddress(HOME_BASE.street, HOME_BASE.city, HOME_BASE.state, HOME_BASE.zip);
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`, '_blank');
  }
})();
