(function(){
  'use strict';

  const STORAGE_KEY = 'field-ops-dashboard-data';
  const LEGACY_STORAGE_KEY = 'spl-client-map-v1';
  const CLIENT_STATUS_OPTIONS = ['Active', 'Pending', 'On Hold', 'Inactive'];
  const CLIENT_SECTOR_OPTIONS = ['Upstream', 'Midstream', 'Downstream', 'Other'];
  const SITE_TYPE_OPTIONS = ['Well Site', 'Meter Station', 'Field Site', 'Well Pad', 'LACT Unit', 'Facility', 'Pipeline Location', 'Office / Yard', 'Other'];
  const SITE_TYPE_KEY_BY_LABEL = Object.fromEntries(SITE_TYPE_OPTIONS.map((label) => [label, label.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')]));
  const SITE_TYPE_LABEL_BY_KEY = Object.fromEntries(Object.entries(SITE_TYPE_KEY_BY_LABEL).map(([label, key]) => [key, label]));
  const SITE_STATUS_OPTIONS = ['Active', 'Restricted', 'Inactive'];
  const ROUTE_STATUS_OPTIONS = ['Draft', 'Planned', 'Assigned', 'Complete', 'Archived'];
  const ROUTE_LOCATION_TYPES = ['spl', 'site', 'address', 'gps'];
  const ROUTE_LOCATION_LABELS = { spl:'SPL Pittsburgh', site:'Client Site', address:'Address', gps:'GPS Coordinates' };
  const ROUTE_STOP_TYPES = ['site', 'place'];
  const ROUTE_PLACE_LOCATION_TYPES = ['address', 'gps'];
  const SITE_LIST_CLIENT_PREFIX = 'client:';
  const SITE_LIST_PLACE_PREFIX = 'place-list:';
  const ROUTE_PLACE_COLORS = ['#6fe3ff', '#ff8fa3', '#ffd166', '#b0f28f', '#c9b6ff', '#8afcc3'];
  const ROUTE_PLACE_ICON_OPTIONS = [
    { key:'pin', label:'Pin' },
    { key:'store', label:'Store' },
    { key:'wrench', label:'Repair' },
    { key:'fuel', label:'Fuel' },
    { key:'warehouse', label:'Warehouse' }
  ];
  const DEFAULT_JOB_TYPE_DEFS = [
    { jobTypeKey:'ALLOCATION_PROVING', jobTypeName:'Allocation Proving', isActive:true, allowMultipleSites:false, sortOrder:10 },
    { jobTypeKey:'LACT_PROVING', jobTypeName:'LACT Proving', isActive:true, allowMultipleSites:true, sortOrder:20 },
    { jobTypeKey:'SAMPLE_PICKUP', jobTypeName:'Sample Pickup', isActive:true, allowMultipleSites:false, sortOrder:30 },
    { jobTypeKey:'SAMPLE_DROP_OFF', jobTypeName:'Sample Drop-Off', isActive:true, allowMultipleSites:false, sortOrder:40 },
    { jobTypeKey:'MAINTENANCE', jobTypeName:'Maintenance', isActive:true, allowMultipleSites:false, sortOrder:50 },
    { jobTypeKey:'MULTI_SERVICE', jobTypeName:'Multi-Service', isActive:true, allowMultipleSites:false, sortOrder:60 }
  ];
  const SITE_TYPE_JOB_TYPE_NAMES = {
    'Well Site': ['Allocation Proving', 'Sample Pickup', 'Maintenance', 'Multi-Service'],
    'Meter Station': ['Allocation Proving', 'Maintenance', 'Multi-Service'],
    'Field Site': ['Sample Pickup', 'Sample Drop-Off', 'Maintenance', 'Multi-Service'],
    'Well Pad': ['Allocation Proving', 'Sample Pickup', 'Maintenance', 'Multi-Service'],
    'LACT Unit': ['LACT Proving', 'Maintenance', 'Multi-Service'],
    'Facility': ['Sample Pickup', 'Sample Drop-Off', 'Maintenance', 'Multi-Service'],
    'Pipeline Location': ['Allocation Proving', 'Maintenance', 'Multi-Service'],
    'Office / Yard': ['Sample Drop-Off', 'Maintenance']
  };
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
  let googleMapsLoadPromise = null;

  const state = {
    data: createEmptyData(),
    viewClients: [],
    filteredClients: [],
    filterTag: 'All',
    searchQuery: '',
    clientPickerQuery: '',
    activeMode: 'sites',
    routeDatePreset: 'next_30_days',
    routeCustomStartDate: '',
    routeCustomEndDate: '',
    routeStatusFilter: 'Active',
    activeSiteListKey: '',
    activeClientId: '',
    activeSiteId: '',
    activeRoutePlaceId: '',
    activeRouteId: '',
    routePlaceListFilter: '',
    routeAddStopListKey: '',
    routePlaceModalPlaceId: '',
    routePlaceListModalListId: '',
    routeDraft: null,
    routeDirty: false,
    expandedIds: new Set(),
    map: null,
    mapProvider: 'leaflet',
    baseLayer: null,
    googleInfoWindow: null,
    geocoder: null,
    placesLibraryPromise: null,
    placesSessionToken: null,
    homeMarker: null,
    markerCache: new Map(),
    routeMarkerCache: new Map(),
    routePolyline: null,
    googleDirectionsRenderer: null,
    googleDirectionsService: null,
    routeRenderToken: 0,
    booted: false,
    searchTimer: null,
    hideSaveTimer: null,
    mapResizeTimer: null,
    tileErrorNotified: false,
    indexes: createEmptyIndexes(),
    viewIndexes: createEmptyViewIndexes(),
    markerIconCache: new Map(),
    routeIconCache: new Map()
  };

  const els = {};

  document.addEventListener('DOMContentLoaded', () => { init().catch(handleLoadError); });

  async function init(){
    cacheElements();
    hydrateSelects();
    bindShell();
    bindToolbar();
    bindPanels();
    bindModals();
    await initMap();
    tickClock();
    setInterval(tickClock, 1000);
    bindPageRefresh();
    showSaveStatus('loaded', 'READY');
    const ready = window.authReadyPromise instanceof Promise ? window.authReadyPromise : Promise.resolve();
    ready.then(() => loadData({ preserveSelection:false, focusSelection:false })).catch(handleLoadError);
  }

  function cacheElements(){
    [
      'clock', 'datedisp', 'save-indicator', 'toolbar-summary', 'client-picker',
      'sites-mode-btn', 'routes-mode-btn', 'route-date-preset', 'route-date-start', 'route-date-end', 'new-route-btn',
      'list-summary', 'map-summary', 'fit-sites-btn', 'filter-row', 'client-list', 'map',
      'map-placeholder', 'detail-panel'
    ].forEach((id) => { els[id] = document.getElementById(id); });
  }

  function createEmptyData(){
    return { clients: [], projects: [], sites: [], siteProjects: [], jobTypes: getDefaultJobTypeRecords(), jobs: [], jobSites: [], jobAssignments: [], employees: [], trucks: [], samples: [], fieldRoutes: [], routePlaceLists: [], routePlaces: [], fieldRouteStops: [], fieldRouteStopJobs: [] };
  }

  function createEmptyIndexes(){
    return {
      clientsById:new Map(),
      projectsById:new Map(),
      projectsByClientId:new Map(),
      sitesById:new Map(),
      siteProjectIdsBySiteId:new Map(),
      routePlaceListsById:new Map(),
      routePlacesById:new Map(),
      routePlacesByListId:new Map(),
      jobsById:new Map(),
      jobSiteIdsByJobId:new Map(),
      jobAssignmentsByJobId:new Map(),
      fieldRoutesById:new Map(),
      routeStopsByRouteId:new Map(),
      routeStopJobsByStopId:new Map(),
      employeesById:new Map(),
      trucksById:new Map(),
      defaultTruckByTechnicianId:new Map()
    };
  }

  function createEmptyViewIndexes(){
    return {
      clientsById:new Map(),
      sitesById:new Map(),
      clientBySiteId:new Map()
    };
  }

  function addIndexedListValue(map, key, value){
    const normalizedKey = String(key || '').trim();
    if(!normalizedKey) return;
    if(!map.has(normalizedKey)) map.set(normalizedKey, []);
    map.get(normalizedKey).push(value);
  }

  function addIndexedUniqueValue(map, key, value){
    const normalizedKey = String(key || '').trim();
    const normalizedValue = String(value || '').trim();
    if(!normalizedKey || !normalizedValue) return;
    if(!map.has(normalizedKey)) map.set(normalizedKey, []);
    const list = map.get(normalizedKey);
    if(!list.includes(normalizedValue)) list.push(normalizedValue);
  }

  function buildDataIndexes(data){
    const indexes = createEmptyIndexes();
    (data.clients || []).forEach((client) => indexes.clientsById.set(client.id, client));
    (data.projects || []).forEach((project) => {
      indexes.projectsById.set(project.id, project);
      addIndexedListValue(indexes.projectsByClientId, project.clientId, project);
    });
    (data.sites || []).forEach((site) => {
      indexes.sitesById.set(site.id, site);
      normalizeStringArray(site.projectIds).forEach((projectId) => addIndexedUniqueValue(indexes.siteProjectIdsBySiteId, site.id, projectId));
      addIndexedUniqueValue(indexes.siteProjectIdsBySiteId, site.id, site.projectId);
    });
    (data.routePlaceLists || []).forEach((list) => indexes.routePlaceListsById.set(list.id, list));
    (data.routePlaces || []).forEach((place) => {
      indexes.routePlacesById.set(place.id, place);
      addIndexedListValue(indexes.routePlacesByListId, place.listId, place);
    });
    (data.siteProjects || []).forEach((link) => addIndexedUniqueValue(indexes.siteProjectIdsBySiteId, link.siteId, link.projectId));
    (data.jobs || []).forEach((job) => {
      indexes.jobsById.set(job.id, job);
      normalizeStringArray(job.siteIds).forEach((siteId) => addIndexedUniqueValue(indexes.jobSiteIdsByJobId, job.id, siteId));
      addIndexedUniqueValue(indexes.jobSiteIdsByJobId, job.id, job.siteId);
    });
    [...(data.jobSites || [])].sort(sortByJobSite).forEach((link) => addIndexedUniqueValue(indexes.jobSiteIdsByJobId, link.jobId, link.siteId));
    (data.jobAssignments || []).forEach((assignment) => addIndexedListValue(indexes.jobAssignmentsByJobId, assignment.jobId, assignment));
    (data.fieldRoutes || []).forEach((route) => indexes.fieldRoutesById.set(route.id, route));
    [...(data.fieldRouteStops || [])].sort(sortByRouteStop).forEach((stop) => addIndexedListValue(indexes.routeStopsByRouteId, stop.routeId, stop));
    [...(data.fieldRouteStopJobs || [])].sort(sortByRouteStopJob).forEach((link) => addIndexedListValue(indexes.routeStopJobsByStopId, link.routeStopId, link));
    (data.employees || []).forEach((employee) => indexes.employeesById.set(employee.id, employee));
    (data.trucks || []).forEach((truck) => {
      indexes.trucksById.set(truck.id, truck);
      if(truck.assignedTechnicianId && !indexes.defaultTruckByTechnicianId.has(truck.assignedTechnicianId)) indexes.defaultTruckByTechnicianId.set(truck.assignedTechnicianId, truck);
    });
    indexes.projectsByClientId.forEach((list) => list.sort(sortByProjectName));
    indexes.routePlacesByListId.forEach((list) => list.sort(sortByRoutePlace));
    return indexes;
  }

  function buildViewIndexes(viewClients){
    const indexes = createEmptyViewIndexes();
    (viewClients || []).forEach((client) => {
      indexes.clientsById.set(client.id, client);
      (client.sublocations || []).forEach((site) => {
        indexes.sitesById.set(site.id, site);
        indexes.clientBySiteId.set(site.id, client);
      });
    });
    return indexes;
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

  function hasUsableCoords(lat, lng){
    return hasCoords(lat, lng) && !(Number(lat) === 0 && Number(lng) === 0);
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
    const raw = String(value ?? '').trim();
    const key = raw.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    return normalizeOption(legacy[raw] || SITE_TYPE_LABEL_BY_KEY[key] || value, SITE_TYPE_OPTIONS, 'Other');
  }
  function toSiteTypeKey(value){ return SITE_TYPE_KEY_BY_LABEL[normalizeSiteType(value)] || 'OTHER'; }

  function parseGps(value){
    if(!value) return null;
    const match = String(value).match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if(!match) return null;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    return hasUsableCoords(lat, lng) ? { lat, lng } : null;
  }

  function formatGps(lat, lng){
    return hasUsableCoords(lat, lng) ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : '';
  }

  function toInputDate(value){
    if(!value) return '';
    if(value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
    const raw = String(value || '').trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
  }

  function todayISO(){
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  function dateFromISO(value){
    const iso = toInputDate(value);
    if(!iso) return null;
    const [year, month, day] = iso.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function addDaysISO(value, days){
    const date = dateFromISO(value) || dateFromISO(todayISO()) || new Date();
    date.setDate(date.getDate() + Number(days || 0));
    return toLocalISODate(date);
  }

  function toLocalISODate(date){
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function startOfWeekISO(value){
    const date = dateFromISO(value) || dateFromISO(todayISO()) || new Date();
    const day = date.getDay();
    date.setDate(date.getDate() - day);
    return toLocalISODate(date);
  }

  function startOfMonthISO(year, monthIndex){
    return toLocalISODate(new Date(year, monthIndex, 1));
  }

  function endOfMonthISO(year, monthIndex){
    return toLocalISODate(new Date(year, monthIndex + 1, 0));
  }

  function parseDateTime(value){
    if(!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function formatDate(value){
    const date = parseDateTime(`${toInputDate(value)}T00:00:00`);
    return date ? date.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : 'No date';
  }

  function fmtDateTime(value){
    const date = parseDateTime(value);
    return date ? date.toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }) : '';
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

  function getRoutePlaceIconToken(iconKey){
    const key = String(iconKey || 'pin').trim().toLowerCase();
    if(key === 'store') return 'SH';
    if(key === 'wrench') return 'RP';
    if(key === 'fuel') return 'FL';
    if(key === 'warehouse') return 'WH';
    return 'OS';
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
    if(els['route-date-preset']) els['route-date-preset'].value = state.routeDatePreset;
    if(els['route-date-start']) els['route-date-start'].value = state.routeCustomStartDate;
    if(els['route-date-end']) els['route-date-end'].value = state.routeCustomEndDate;
    document.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => setActiveMode(button.dataset.mode || 'sites'));
    });
    els['route-date-preset']?.addEventListener('change', (event) => {
      state.routeDatePreset = event.target.value || 'next_30_days';
      if(state.routeDatePreset === 'custom') ensureCustomRouteRange();
      renderModeControls();
      if(state.activeMode === 'routes') refreshFilteredView({ syncMap:true, preserveSelection:true, focusSelection:false });
    });
    els['route-date-start']?.addEventListener('change', (event) => {
      state.routeCustomStartDate = toInputDate(event.target.value);
      state.routeDatePreset = 'custom';
      normalizeCustomRouteRange();
      renderModeControls();
      if(state.activeMode === 'routes') refreshFilteredView({ syncMap:true, preserveSelection:true, focusSelection:false });
    });
    els['route-date-end']?.addEventListener('change', (event) => {
      state.routeCustomEndDate = toInputDate(event.target.value);
      state.routeDatePreset = 'custom';
      normalizeCustomRouteRange();
      renderModeControls();
      if(state.activeMode === 'routes') refreshFilteredView({ syncMap:true, preserveSelection:true, focusSelection:false });
    });
    els['new-route-btn']?.addEventListener('click', () => openRouteStartChooser());
    els['client-picker'].addEventListener('focusin', (event) => {
      if(!event.target.closest('#suremap-client-picker-input')) return;
      state.clientPickerQuery = '';
      event.target.value = '';
      renderClientPickerResults(true);
    });
    els['client-picker'].addEventListener('focusout', () => {
      setTimeout(() => closeClientPickerResults(), 140);
    });
    els['client-picker'].addEventListener('input', (event) => {
      if(!event.target.closest('#suremap-client-picker-input')) return;
      state.clientPickerQuery = event.target.value.trim();
      renderClientPickerResults(true);
    });
    els['client-picker'].addEventListener('keydown', (event) => {
      if(event.key !== 'Enter' || !event.target.closest('#suremap-client-picker-input')) return;
      event.preventDefault();
      const matches = getClientPickerMatches();
      const first = matches.clients[0] || matches.other[0];
      if(first) selectClientFromPicker(first.key);
    });
    els['client-picker'].addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-client-picker-trigger]');
      if(trigger){
        const input = els['client-picker'].querySelector('#suremap-client-picker-input');
        state.clientPickerQuery = '';
        if(input){
          input.value = '';
          input.focus();
        }
        renderClientPickerResults(true);
        return;
      }
      const option = event.target.closest('[data-site-list-key]');
      if(option) selectClientFromPicker(option.dataset.siteListKey);
    });
    els['fit-sites-btn'].addEventListener('click', fitVisibleSites);
  }

  function bindPanels(){
    els['filter-row'].addEventListener('click', (event) => {
      const routeStatusChip = event.target.closest('[data-route-status-filter]');
      if(routeStatusChip){
        state.routeStatusFilter = routeStatusChip.dataset.routeStatusFilter || 'Active';
        renderFilterRow();
        renderRouteList();
        return;
      }
      const chip = event.target.closest('[data-filter]');
      if(!chip) return;
      state.filterTag = chip.dataset.filter || 'All';
      refreshFilteredView({ syncMap:true, preserveSelection:true, focusSelection:false });
    });

    els['client-list'].addEventListener('click', (event) => {
      const routeCard = event.target.closest('[data-route-id]');
      if(routeCard){
        selectRoute(routeCard.dataset.routeId, { focusMap:true });
        return;
      }
      const placeCard = event.target.closest('[data-route-place-id]');
      if(placeCard){
        selectRoutePlace(placeCard.dataset.routePlaceId, { focusMap:true });
        return;
      }
      const siteCard = event.target.closest('[data-site-id]');
      if(siteCard){
        selectSite(siteCard.dataset.clientId, siteCard.dataset.siteId, { focusMap:true });
        return;
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
      if(actionName === 'open-client') openClientInDirectory(clientId);
      if(actionName === 'edit-site') openSiteModal(clientId, siteId);
      if(actionName === 'add-site') openSiteModal(clientId);
      if(actionName === 'delete-site') deleteSiteRecord(clientId, siteId);
      if(actionName === 'add-route-place-list') openRoutePlaceListModal();
      if(actionName === 'edit-route-place-list') openRoutePlaceListModal(action.dataset.listId);
      if(actionName === 'delete-route-place-list') deleteRoutePlaceListRecord(action.dataset.listId);
      if(actionName === 'add-route-place') openRoutePlaceModal({ listId:action.dataset.listId });
      if(actionName === 'edit-route-place') openRoutePlaceModal({ placeId:action.dataset.placeId });
      if(actionName === 'delete-route-place') deleteRoutePlaceRecord(action.dataset.placeId);
      if(actionName === 'copy-route-place') copyToClipboard(getRoutePlaceDirections(getRoutePlace(action.dataset.placeId)), 'Location copied.');
      if(actionName === 'open-directions-route-place') openDirections(getRoutePlaceDirections(getRoutePlace(action.dataset.placeId)));
      if(actionName === 'route-choice-custom') openNewRouteDraft();
      if(actionName === 'route-choice-build-job') buildRouteDraftFromSelectedJob();
      if(actionName === 'save-route') saveCurrentRoute({ assign:true });
      if(actionName === 'save-route-draft') saveCurrentRoute({ draft:true });
      if(actionName === 'delete-route') deleteCurrentRoute();
      if(actionName === 'open-add-route-stop') openRouteAddStopModal();
      if(actionName === 'move-route-stop') moveRouteStop(action.dataset.stopId, Number(action.dataset.delta || 0));
      if(actionName === 'remove-route-stop') removeRouteStop(action.dataset.stopId);
      if(actionName === 'optimize-route') optimizeCurrentRoute();
      if(actionName === 'open-route-directions') openRouteDirections();
      if(actionName === 'assign-route') assignCurrentRoute();
    });

    els['detail-panel'].addEventListener('input', (event) => {
      const field = event.target.closest('[data-route-field]');
      if(!field) return;
      setRouteDraftField(field.dataset.routeField, field.value);
    });

    els['detail-panel'].addEventListener('change', (event) => {
      const field = event.target.closest('[data-route-field]');
      if(field) setRouteDraftField(field.dataset.routeField, field.value);
      const locationField = event.target.closest('[data-route-location-field]');
      if(locationField) setRouteLocationField(locationField.dataset.routeLocationField, locationField.value);
      const jobToggle = event.target.closest('[data-route-job-toggle]');
      if(jobToggle) toggleRouteStopJob(jobToggle.dataset.stopId, jobToggle.value, jobToggle.checked);
    });
  }

  function bindModals(){}

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

  function getGoogleMapsApiKey(){
    return String(window.APP_CONFIG?.googleMapsApiKey || '').trim();
  }

  function getGoogleMapsMapId(){
    return String(window.APP_CONFIG?.googleMapsMapId || '').trim();
  }

  function hasGoogleMapsConfigured(){
    return !!getGoogleMapsApiKey();
  }

  function loadGoogleMapsApi(){
    if(window.google?.maps) return Promise.resolve(window.google.maps);
    if(googleMapsLoadPromise) return googleMapsLoadPromise;
    const apiKey = getGoogleMapsApiKey();
    if(!apiKey) return Promise.reject(new Error('Google Maps API key is not configured.'));
    googleMapsLoadPromise = new Promise((resolve, reject) => {
      const callbackName = `sureMapGoogleInit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const script = document.createElement('script');
      const cleanup = () => {
        delete window[callbackName];
      };
      window[callbackName] = () => {
        cleanup();
        resolve(window.google.maps);
      };
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        cleanup();
        reject(new Error('Google Maps failed to load.'));
      };
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&callback=${encodeURIComponent(callbackName)}`;
      document.head.appendChild(script);
    }).catch((error) => {
      googleMapsLoadPromise = null;
      throw error;
    });
    return googleMapsLoadPromise;
  }

  async function loadPlacesLibrary(){
    if(state.placesLibraryPromise) return state.placesLibraryPromise;
    state.placesLibraryPromise = (async () => {
      await loadGoogleMapsApi();
      if(!window.google?.maps?.importLibrary) throw new Error('Google Places library is unavailable.');
      return window.google.maps.importLibrary('places');
    })().catch((error) => {
      state.placesLibraryPromise = null;
      throw error;
    });
    return state.placesLibraryPromise;
  }

  function getPlacesSessionToken(places){
    const TokenCtor = places?.AutocompleteSessionToken || window.google?.maps?.places?.AutocompleteSessionToken;
    if(!TokenCtor) return null;
    if(!state.placesSessionToken) state.placesSessionToken = new TokenCtor();
    return state.placesSessionToken;
  }

  function resetPlacesSessionToken(){
    state.placesSessionToken = null;
  }

  async function initMap(){
    window.addEventListener('resize', scheduleMapResize);
    if(hasGoogleMapsConfigured()){
      try {
        await loadGoogleMapsApi();
        initGoogleMap();
        return;
      } catch (error){
        console.warn('SureMap Google provider unavailable. Falling back to the default map.', error);
        els['map-summary'].textContent = 'SureMap provider unavailable. Using default map.';
      }
    }
    initLeafletMap();
  }

  function initGoogleMap(){
    state.mapProvider = 'google';
    state.googleInfoWindow = new google.maps.InfoWindow();
    state.geocoder = new google.maps.Geocoder();
    const options = {
      center: { lat:40.44, lng:-79.99 },
      zoom: 10,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true
    };
    const mapId = getGoogleMapsMapId();
    if(mapId) options.mapId = mapId;
    state.map = new google.maps.Map(els.map, options);
    state.googleDirectionsService = new google.maps.DirectionsService();
    state.googleDirectionsRenderer = new google.maps.DirectionsRenderer({
      map: state.map,
      suppressMarkers: true,
      preserveViewport: true
    });
    scheduleMapResize();
  }

  function initLeafletMap(){
    state.mapProvider = 'leaflet';
    state.googleInfoWindow = null;
    state.geocoder = null;
    state.map = L.map(els.map, { zoomControl:true }).setView([40.44, -79.99], 10);
    state.map.options.closePopupOnClick = false;
    replaceBasemapLayer();
  }

  async function loadData(options = {}){
    showSaveStatus('saving', 'LOADING');
    state.data = isRemoteMode() ? await readRemoteData() : readLocalData();
    state.indexes = buildDataIndexes(state.data);
    state.viewClients = buildViewClients(state.data, state.indexes);
    state.viewIndexes = buildViewIndexes(state.viewClients);
    ensureRouteDraftStillValid();
    state.booted = true;
    refreshFilteredView({ syncMap:true, preserveSelection:options.preserveSelection !== false, focusSelection:options.focusSelection !== false });
    scheduleMapResize();
    showSaveStatus('loaded', 'READY');
  }

  function scheduleMapResize(){
    if(!state.map) return;
    clearTimeout(state.mapResizeTimer);
    state.mapResizeTimer = setTimeout(() => {
      if(state.mapProvider === 'google' && window.google?.maps?.event){
        const center = state.map.getCenter();
        google.maps.event.trigger(state.map, 'resize');
        if(center) state.map.setCenter(center);
        return;
      }
      if(typeof state.map.invalidateSize === 'function') state.map.invalidateSize(false);
    }, 90);
  }

  function replaceBasemapLayer(){
    if(state.mapProvider !== 'leaflet' || !state.map || typeof L === 'undefined' || typeof L.TileLayer === 'undefined') return;
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
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 20
      }
    };
  }

  function handleBasemapTileError(){
    if(state.mapProvider !== 'leaflet') return;
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
    const data = {
      clients: Array.isArray(raw.clients) ? raw.clients.map(normalizeClient).sort(sortByClientName) : [],
      projects: Array.isArray(raw.projects) ? raw.projects.map(normalizeProject).sort(sortByProjectName) : [],
      sites: Array.isArray(raw.sites) ? raw.sites.map(normalizeSite).sort(sortBySiteName) : [],
      siteProjects: Array.isArray(raw.siteProjects) ? raw.siteProjects.map(normalizeSiteProject).sort(sortBySiteProject) : [],
      jobTypes: Array.isArray(raw.jobTypes) ? raw.jobTypes.map(normalizeJobType).filter((row) => row.jobTypeName).sort(sortByJobType) : [],
      jobs: Array.isArray(raw.jobs) ? raw.jobs.map(normalizeJob) : [],
      jobSites: Array.isArray(raw.jobSites) ? raw.jobSites.map(normalizeJobSite).sort(sortByJobSite) : [],
      jobAssignments: Array.isArray(raw.jobAssignments) ? raw.jobAssignments.map(normalizeJobAssignment) : [],
      employees: Array.isArray(raw.employees) ? raw.employees.map(normalizeEmployee).sort(sortByEmployee) : [],
      trucks: Array.isArray(raw.trucks) ? raw.trucks.map(normalizeTruck).sort(sortByTruck) : [],
      samples: Array.isArray(raw.samples) ? raw.samples.map((row) => ({ id:String(row?.id || ''), jobId:String(row?.jobId || ''), clientId:String(row?.clientId || ''), siteId:String(row?.siteId || '') })) : [],
      fieldRoutes: Array.isArray(raw.fieldRoutes) ? raw.fieldRoutes.map(normalizeRoute).sort(sortByRoute) : [],
      routePlaceLists: Array.isArray(raw.routePlaceLists) ? raw.routePlaceLists.map(normalizeRoutePlaceList).sort(sortByRoutePlaceList) : [],
      routePlaces: Array.isArray(raw.routePlaces) ? raw.routePlaces.map(normalizeRoutePlace).sort(sortByRoutePlace) : [],
      fieldRouteStops: Array.isArray(raw.fieldRouteStops) ? raw.fieldRouteStops.map(normalizeRouteStop).sort(sortByRouteStop) : [],
      fieldRouteStopJobs: Array.isArray(raw.fieldRouteStopJobs) ? raw.fieldRouteStopJobs.map(normalizeRouteStopJob).sort(sortByRouteStopJob) : []
    };
    ensureJobTypes(data);
    ensureRoutePlaceLists(data);
    syncSiteProjectLinks(data);
    syncJobSiteLinks(data);
    return data;
  }

  async function readRemoteData(){
    const [clients, projects, sites, siteProjects, jobTypes, jobs, jobSites, jobAssignments, employees, trucks, samples, fieldRoutes, routePlaceLists, routePlaces, fieldRouteStops, fieldRouteStopJobs] = await Promise.all([
      window.appAuth.requestJson('/rest/v1/field_clients?select=*'),
      window.appAuth.requestJson('/rest/v1/field_projects?select=*'),
      window.appAuth.requestJson('/rest/v1/field_sites?select=*'),
      window.appAuth.requestJson('/rest/v1/field_site_projects?select=*'),
      window.appAuth.requestJson('/rest/v1/field_job_types?select=*').catch((error) => {
        console.warn('Unable to load SureMap job types. Using defaults.', error);
        return [];
      }),
      window.appAuth.requestJson('/rest/v1/field_jobs?select=id,fieldfx_ticket_id,client_id,project_id,site_id,job_type,priority,requested_date,scheduled_start,scheduled_end,scope_summary'),
      window.appAuth.requestJson('/rest/v1/field_job_sites?select=*'),
      window.appAuth.requestJson('/rest/v1/field_job_assignments?select=id,job_id,assignment_type,resource_id'),
      window.appAuth.requestJson('/rest/v1/employees?select=id,employee_first_name,employee_last_name,employee_name,work_scope,field_role,phone,email'),
      window.appAuth.requestJson('/rest/v1/field_trucks?select=id,unit_number,service_status,assigned_technician_id,current_driver'),
      window.appAuth.requestJson('/rest/v1/field_samples?select=id,job_id,client_id,site_id'),
      window.appAuth.requestJson('/rest/v1/field_routes?select=*'),
      window.appAuth.requestJson('/rest/v1/field_route_place_lists?select=*'),
      window.appAuth.requestJson('/rest/v1/field_route_places?select=*'),
      window.appAuth.requestJson('/rest/v1/field_route_stops?select=*'),
      window.appAuth.requestJson('/rest/v1/field_route_stop_jobs?select=*')
    ]);
    const data = {
      clients: (clients || []).map((row) => normalizeClient(row, true)).sort(sortByClientName),
      projects: (projects || []).map((row) => normalizeProject(row, true)).sort(sortByProjectName),
      sites: (sites || []).map((row) => normalizeSite(row, true)).sort(sortBySiteName),
      siteProjects: (siteProjects || []).map((row) => normalizeSiteProject(row, true)).sort(sortBySiteProject),
      jobTypes: (jobTypes || []).map((row) => normalizeJobType(row, true)).filter((row) => row.jobTypeName).sort(sortByJobType),
      jobs: (jobs || []).map((row) => normalizeJob(row, true)),
      jobSites: (jobSites || []).map((row) => normalizeJobSite(row, true)).sort(sortByJobSite),
      jobAssignments: (jobAssignments || []).map((row) => normalizeJobAssignment(row, true)),
      employees: (employees || []).map((row) => normalizeEmployee(row, true)).sort(sortByEmployee),
      trucks: (trucks || []).map((row) => normalizeTruck(row, true)).sort(sortByTruck),
      samples: (samples || []).map((row) => ({ id:String(row?.id || ''), jobId:String(row?.job_id || ''), clientId:String(row?.client_id || ''), siteId:String(row?.site_id || '') })),
      fieldRoutes: (fieldRoutes || []).map((row) => normalizeRoute(row, true)).sort(sortByRoute),
      routePlaceLists: (routePlaceLists || []).map((row) => normalizeRoutePlaceList(row, true)).sort(sortByRoutePlaceList),
      routePlaces: (routePlaces || []).map((row) => normalizeRoutePlace(row, true)).sort(sortByRoutePlace),
      fieldRouteStops: (fieldRouteStops || []).map((row) => normalizeRouteStop(row, true)).sort(sortByRouteStop),
      fieldRouteStopJobs: (fieldRouteStopJobs || []).map((row) => normalizeRouteStopJob(row, true)).sort(sortByRouteStopJob)
    };
    ensureJobTypes(data);
    ensureRoutePlaceLists(data);
    syncSiteProjectLinks(data);
    syncJobSiteLinks(data);
    return data;
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
      projectId: String((fromRemote ? row?.project_id : row?.projectId) || ''),
      projectIds: normalizeStringArray(fromRemote ? [] : row?.projectIds),
      siteName: String((fromRemote ? row?.site_name : row?.siteName) || '').trim(),
      siteType: normalizeSiteType(fromRemote ? row?.site_type : row?.siteType),
      physicalAddress: String((fromRemote ? row?.physical_address : row?.physicalAddress) || '').trim(),
      countyState: String((fromRemote ? row?.county_state : row?.countyState) || '').trim(),
      gpsCoordinates: parsed ? formatGps(parsed.lat, parsed.lng) : '',
      accessInstructions: String((fromRemote ? row?.access_instructions : row?.accessInstructions) || '').trim(),
      safetyPpeNotes: String((fromRemote ? row?.safety_ppe_notes : row?.safetyPpeNotes) || '').trim(),
      gateCodeEntryRequirements: String((fromRemote ? row?.gate_code_entry_requirements : row?.gateCodeEntryRequirements) || '').trim(),
      clientSiteContact: String((fromRemote ? row?.client_site_contact : row?.clientSiteContact) || '').trim(),
      siteStatus: normalizeSiteStatus(fromRemote ? row?.site_status : row?.siteStatus),
      standardJobTypes: String((fromRemote ? row?.standard_job_types : row?.standardJobTypes) || '').trim(),
      notes: String(row?.notes || '').trim()
    };
  }

  function normalizeProject(row, fromRemote = false){
    return {
      id: String(row?.id || ''),
      clientId: String((fromRemote ? row?.client_id : row?.clientId) || ''),
      projectName: String((fromRemote ? row?.project_name : row?.projectName) || '').trim(),
      serviceScope: String((fromRemote ? row?.service_scope : row?.serviceScope) || 'Field').trim() || 'Field',
      projectStatus: String((fromRemote ? row?.project_status : row?.projectStatus) || 'Active').trim() || 'Active'
    };
  }

  function normalizeSiteProject(row, fromRemote = false){
    const siteId = String((fromRemote ? row?.site_id : row?.siteId) || '').trim();
    const projectId = String((fromRemote ? row?.project_id : row?.projectId) || '').trim();
    return {
      id: String(row?.id || `${siteId}::${projectId}`),
      siteId,
      projectId
    };
  }

  function normalizeStringArray(value){
    if(Array.isArray(value)) return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
    const raw = String(value || '').trim();
    return raw ? [raw] : [];
  }

  function parseStandardJobTypes(value){
    if(Array.isArray(value)) return normalizeStringArray(value);
    return [...new Set(String(value || '').split(',').map((item) => item.trim()).filter(Boolean))];
  }

  function serializeStandardJobTypes(values){
    return parseStandardJobTypes(values).join(', ');
  }

  function normalizeJobType(row, fromRemote = false){
    return {
      id: String(row?.id || row?.jobTypeKey || row?.job_type_key || ''),
      jobTypeKey: String((fromRemote ? row?.job_type_key : row?.jobTypeKey) || row?.jobTypeKey || row?.job_type_key || '').trim(),
      jobTypeName: String((fromRemote ? row?.job_type_name : row?.jobTypeName) || row?.jobTypeName || row?.job_type_name || '').trim(),
      isActive: (fromRemote ? row?.is_active : row?.isActive) !== false,
      allowMultipleSites: (fromRemote ? row?.allow_multiple_sites : row?.allowMultipleSites) === true,
      sortOrder: normalizeNumber((fromRemote ? row?.sort_order : row?.sortOrder) ?? row?.sortOrder ?? row?.sort_order) || 0
    };
  }

  function normalizeJob(row, fromRemote = false){
    return {
      id: String(row?.id || ''),
      fieldfxTicketId: String((fromRemote ? row?.fieldfx_ticket_id : row?.fieldfxTicketId) || '').trim(),
      clientId: String((fromRemote ? row?.client_id : row?.clientId) || ''),
      projectId: String((fromRemote ? row?.project_id : row?.projectId) || ''),
      siteId: String((fromRemote ? row?.site_id : row?.siteId) || ''),
      siteIds: normalizeStringArray(fromRemote ? row?.site_ids : row?.siteIds),
      jobType: String((fromRemote ? row?.job_type : row?.jobType) || '').trim(),
      priority: String((fromRemote ? row?.priority : row?.priority) || 'Normal').trim() || 'Normal',
      requestedDate: toInputDate(fromRemote ? row?.requested_date : row?.requestedDate),
      scheduledStart: String((fromRemote ? row?.scheduled_start : row?.scheduledStart) || '').trim(),
      scheduledEnd: String((fromRemote ? row?.scheduled_end : row?.scheduledEnd) || '').trim(),
      scopeSummary: String((fromRemote ? row?.scope_summary : row?.scopeSummary) || '').trim()
    };
  }

  function normalizeJobSite(row, fromRemote = false){
    const jobId = String((fromRemote ? row?.job_id : row?.jobId) || '');
    const siteId = String((fromRemote ? row?.site_id : row?.siteId) || '');
    return {
      id: String(row?.id || `${jobId}::${siteId}`),
      jobId,
      siteId,
      sortOrder: normalizeNumber((fromRemote ? row?.sort_order : row?.sortOrder) ?? row?.sortOrder ?? row?.sort_order) || 0
    };
  }

  function normalizeJobAssignment(row, fromRemote = false){
    return {
      id: String(row?.id || ''),
      jobId: String((fromRemote ? row?.job_id : row?.jobId) || ''),
      assignmentType: String((fromRemote ? row?.assignment_type : row?.assignmentType) || 'Technician').trim() || 'Technician',
      resourceId: String((fromRemote ? row?.resource_id : row?.resourceId) || '')
    };
  }

  function normalizeEmployee(row, fromRemote = false){
    const first = String((fromRemote ? row?.employee_first_name : row?.employeeFirstName) || '').trim();
    const last = String((fromRemote ? row?.employee_last_name : row?.employeeLastName) || '').trim();
    const name = String((fromRemote ? row?.employee_name : row?.employeeName) || `${first} ${last}`).trim();
    return {
      id: String(row?.id || ''),
      employeeFirstName: first,
      employeeLastName: last,
      employeeName: name || `${first} ${last}`.trim(),
      workScope: String((fromRemote ? row?.work_scope : row?.workScope) || 'Field').trim() || 'Field',
      fieldRole: String((fromRemote ? row?.field_role : row?.fieldRole) || '').trim(),
      phone: String(row?.phone || '').trim(),
      email: String(row?.email || '').trim()
    };
  }

  function normalizeTruck(row, fromRemote = false){
    return {
      id: String(row?.id || ''),
      unitNumber: String((fromRemote ? row?.unit_number : row?.unitNumber) || '').trim(),
      serviceStatus: String((fromRemote ? row?.service_status : row?.serviceStatus) || 'Available').trim() || 'Available',
      assignedTechnicianId: String((fromRemote ? row?.assigned_technician_id : row?.assignedTechnicianId) || ''),
      currentDriver: String((fromRemote ? row?.current_driver : row?.currentDriver) || '').trim()
    };
  }

  function normalizeRoute(row, fromRemote = false){
    const routeDate = toInputDate(fromRemote ? row?.route_date : row?.routeDate) || todayISO();
    return {
      id: String(row?.id || ''),
      routeName: String((fromRemote ? row?.route_name : row?.routeName) || '').trim(),
      routeDate,
      routeStatus: normalizeOption(fromRemote ? row?.route_status : row?.routeStatus, ROUTE_STATUS_OPTIONS, 'Draft'),
      assignedTechnicianId: String((fromRemote ? row?.assigned_technician_id : row?.assignedTechnicianId) || ''),
      originType: normalizeRouteLocationType(fromRemote ? row?.origin_type : row?.originType),
      originSiteId: String((fromRemote ? row?.origin_site_id : row?.originSiteId) || ''),
      originLabel: String((fromRemote ? row?.origin_label : row?.originLabel) || 'SPL Pittsburgh').trim(),
      originValue: String((fromRemote ? row?.origin_value : row?.originValue) || '').trim(),
      originLatitude: normalizeNumber(fromRemote ? row?.origin_latitude : row?.originLatitude),
      originLongitude: normalizeNumber(fromRemote ? row?.origin_longitude : row?.originLongitude),
      destinationType: normalizeRouteLocationType(fromRemote ? row?.destination_type : row?.destinationType),
      destinationSiteId: String((fromRemote ? row?.destination_site_id : row?.destinationSiteId) || ''),
      destinationLabel: String((fromRemote ? row?.destination_label : row?.destinationLabel) || 'SPL Pittsburgh').trim(),
      destinationValue: String((fromRemote ? row?.destination_value : row?.destinationValue) || '').trim(),
      destinationLatitude: normalizeNumber(fromRemote ? row?.destination_latitude : row?.destinationLatitude),
      destinationLongitude: normalizeNumber(fromRemote ? row?.destination_longitude : row?.destinationLongitude),
      distanceMeters: normalizeNumber(fromRemote ? row?.distance_meters : row?.distanceMeters),
      durationSeconds: normalizeNumber(fromRemote ? row?.duration_seconds : row?.durationSeconds),
      returnDistanceMeters: normalizeNumber(fromRemote ? row?.return_distance_meters : row?.returnDistanceMeters),
      returnDurationSeconds: normalizeNumber(fromRemote ? row?.return_duration_seconds : row?.returnDurationSeconds),
      notes: String(row?.notes || '').trim()
    };
  }

  function normalizeRouteLocationType(value){
    const raw = String(value || '').trim().toLowerCase();
    return ROUTE_LOCATION_TYPES.includes(raw) ? raw : 'spl';
  }

  function normalizeRouteStopType(value){
    const raw = String(value || '').trim().toLowerCase();
    return ROUTE_STOP_TYPES.includes(raw) ? raw : 'site';
  }

  function normalizeRoutePlaceLocationType(value){
    const raw = String(value || '').trim().toLowerCase();
    return ROUTE_PLACE_LOCATION_TYPES.includes(raw) ? raw : 'address';
  }

  function normalizeHexColor(value, fallback = ROUTE_PLACE_COLORS[0]){
    const raw = String(value || '').trim();
    return /^#[0-9a-f]{6}$/i.test(raw) ? raw : fallback;
  }

  function normalizeRoutePlaceList(row, fromRemote = false){
    return {
      id: String(row?.id || ''),
      listName: String((fromRemote ? row?.list_name : row?.listName) || '').trim(),
      listColor: normalizeHexColor(fromRemote ? row?.list_color : row?.listColor),
      iconKey: String((fromRemote ? row?.icon_key : row?.iconKey) || 'pin').trim() || 'pin',
      isActive: (fromRemote ? row?.is_active : row?.isActive) !== false,
      notes: String(row?.notes || '').trim()
    };
  }

  function normalizeRoutePlace(row, fromRemote = false){
    return {
      id: String(row?.id || ''),
      listId: String((fromRemote ? row?.list_id : row?.listId) || ''),
      placeName: String((fromRemote ? row?.place_name : row?.placeName) || '').trim(),
      locationType: normalizeRoutePlaceLocationType(fromRemote ? row?.location_type : row?.locationType),
      addressValue: String((fromRemote ? row?.address_value : row?.addressValue) || '').trim(),
      latitude: normalizeNumber(fromRemote ? row?.latitude : row?.latitude),
      longitude: normalizeNumber(fromRemote ? row?.longitude : row?.longitude),
      phone: String(row?.phone || '').trim(),
      websiteUrl: String((fromRemote ? row?.website_url : row?.websiteUrl) || '').trim(),
      isActive: (fromRemote ? row?.is_active : row?.isActive) !== false,
      notes: String(row?.notes || '').trim()
    };
  }

  function normalizeRouteStop(row, fromRemote = false){
    const rawStopType = fromRemote ? row?.stop_type : row?.stopType;
    const stopType = rawStopType ? normalizeRouteStopType(rawStopType) : String((fromRemote ? row?.place_id : row?.placeId) || '') ? 'place' : 'site';
    return {
      id: String(row?.id || ''),
      routeId: String((fromRemote ? row?.route_id : row?.routeId) || ''),
      siteId: String((fromRemote ? row?.site_id : row?.siteId) || ''),
      stopType,
      placeId: String((fromRemote ? row?.place_id : row?.placeId) || ''),
      stopLabel: String((fromRemote ? row?.stop_label : row?.stopLabel) || '').trim(),
      stopValue: String((fromRemote ? row?.stop_value : row?.stopValue) || '').trim(),
      stopLatitude: normalizeNumber(fromRemote ? row?.stop_latitude : row?.stopLatitude),
      stopLongitude: normalizeNumber(fromRemote ? row?.stop_longitude : row?.stopLongitude),
      stopOrder: normalizeNumber(fromRemote ? row?.stop_order : row?.stopOrder) || 0,
      legDistanceMeters: normalizeNumber(fromRemote ? row?.leg_distance_meters : row?.legDistanceMeters),
      legDurationSeconds: normalizeNumber(fromRemote ? row?.leg_duration_seconds : row?.legDurationSeconds),
      stopNotes: String((fromRemote ? row?.stop_notes : row?.stopNotes) || '').trim()
    };
  }

  function normalizeRouteStopJob(row, fromRemote = false){
    const routeStopId = String((fromRemote ? row?.route_stop_id : row?.routeStopId) || '');
    const jobId = String((fromRemote ? row?.job_id : row?.jobId) || '');
    return {
      id: String(row?.id || `${routeStopId}::${jobId}`),
      routeStopId,
      jobId
    };
  }

  function getDefaultJobTypeRecords(){
    return DEFAULT_JOB_TYPE_DEFS.map((row) => normalizeJobType(row)).sort(sortByJobType);
  }

  function ensureJobTypes(data){
    data.jobTypes = Array.isArray(data.jobTypes) ? data.jobTypes.filter((row) => row.jobTypeName) : [];
    if(!data.jobTypes.length) data.jobTypes = getDefaultJobTypeRecords();
    data.jobTypes = data.jobTypes.sort(sortByJobType);
    return data;
  }

  function getDefaultRoutePlaceLists(){
    return [
      { id:'route-place-list-auto-repair', listName:'Auto Repair', listColor:'#ff8fa3', iconKey:'wrench', isActive:true, notes:'' },
      { id:'route-place-list-supply-store', listName:'Supply Store', listColor:'#6fe3ff', iconKey:'store', isActive:true, notes:'' },
      { id:'route-place-list-other', listName:'Other Destinations', listColor:'#ffd166', iconKey:'pin', isActive:true, notes:'' }
    ].map((row) => normalizeRoutePlaceList(row)).sort(sortByRoutePlaceList);
  }

  function ensureRoutePlaceLists(data){
    data.routePlaceLists = Array.isArray(data.routePlaceLists) ? data.routePlaceLists.map(normalizeRoutePlaceList).filter((row) => row.listName) : [];
    if(!data.routePlaceLists.length && !isRemoteMode()) data.routePlaceLists = getDefaultRoutePlaceLists();
    data.routePlaces = Array.isArray(data.routePlaces) ? data.routePlaces.map(normalizeRoutePlace).filter((row) => row.placeName) : [];
    const listIds = new Set(data.routePlaceLists.map((row) => row.id));
    data.routePlaces = data.routePlaces.filter((row) => !row.listId || listIds.has(row.listId));
    data.routePlaceLists = data.routePlaceLists.sort(sortByRoutePlaceList);
    data.routePlaces = data.routePlaces.sort(sortByRoutePlace);
    return data;
  }

  function syncSiteProjectLinks(data){
    const links = [];
    const seen = new Set();
    const addLink = (siteId, projectId) => {
      const normalizedSiteId = String(siteId || '').trim();
      const normalizedProjectId = String(projectId || '').trim();
      if(!normalizedSiteId || !normalizedProjectId) return;
      const key = `${normalizedSiteId}::${normalizedProjectId}`;
      if(seen.has(key)) return;
      seen.add(key);
      links.push({ id:key, siteId:normalizedSiteId, projectId:normalizedProjectId });
    };
    (Array.isArray(data.siteProjects) ? data.siteProjects : []).forEach((link) => addLink(link.siteId, link.projectId));
    (Array.isArray(data.sites) ? data.sites : []).forEach((site) => {
      normalizeStringArray(site.projectIds).forEach((projectId) => addLink(site.id, projectId));
      addLink(site.id, site.projectId);
    });
    data.siteProjects = links.sort(sortBySiteProject);
    const projectIdsBySite = new Map();
    data.siteProjects.forEach((link) => addIndexedUniqueValue(projectIdsBySite, link.siteId, link.projectId));
    data.sites.forEach((site) => {
      site.projectIds = projectIdsBySite.get(site.id) || [];
      site.projectId = site.projectIds[0] || site.projectId || '';
    });
  }

  function syncJobSiteLinks(data){
    const links = [];
    const seen = new Set();
    const jobById = new Map((Array.isArray(data.jobs) ? data.jobs : []).map((job) => [job.id, job]));
    const siteById = new Map((Array.isArray(data.sites) ? data.sites : []).map((site) => [site.id, site]));
    const addLink = (jobId, siteId, sortOrder = links.length) => {
      const normalizedJobId = String(jobId || '').trim();
      const normalizedSiteId = String(siteId || '').trim();
      const job = jobById.get(normalizedJobId);
      const site = siteById.get(normalizedSiteId);
      if(!job || !site || site.clientId !== job.clientId) return;
      const key = `${normalizedJobId}::${normalizedSiteId}`;
      if(seen.has(key)) return;
      seen.add(key);
      links.push(normalizeJobSite({ id:key, jobId:normalizedJobId, siteId:normalizedSiteId, sortOrder }));
    };
    (Array.isArray(data.jobSites) ? data.jobSites : []).sort(sortByJobSite).forEach((link) => addLink(link.jobId, link.siteId, link.sortOrder));
    const jobIdsWithLinks = new Set(links.map((link) => link.jobId));
    (Array.isArray(data.jobs) ? data.jobs : []).forEach((job) => {
      if(!jobIdsWithLinks.has(job.id)) addLink(job.id, job.siteId, 0);
      normalizeStringArray(job.siteIds).forEach((siteId, index) => addLink(job.id, siteId, index));
    });
    data.jobSites = links.sort(sortByJobSite);
    const siteIdsByJob = new Map();
    data.jobSites.forEach((link) => addIndexedUniqueValue(siteIdsByJob, link.jobId, link.siteId));
    data.jobs.forEach((job) => {
      const siteIds = siteIdsByJob.get(job.id) || [];
      job.siteIds = normalizeStringArray(siteIds.length ? siteIds : [job.siteId]);
      job.siteId = job.siteIds[0] || job.siteId || '';
    });
  }

  function sortByClientName(left, right){ return left.clientName.localeCompare(right.clientName); }
  function sortByProjectName(left, right){ return left.projectName.localeCompare(right.projectName); }
  function sortBySiteName(left, right){ return left.siteName.localeCompare(right.siteName); }
  function sortBySiteProject(left, right){ return left.siteId.localeCompare(right.siteId) || left.projectId.localeCompare(right.projectId); }
  function sortByJobType(left, right){ return (Number(left.sortOrder || 0) - Number(right.sortOrder || 0)) || left.jobTypeName.localeCompare(right.jobTypeName); }
  function sortByJobSite(left, right){ return left.jobId.localeCompare(right.jobId) || Number(left.sortOrder || 0) - Number(right.sortOrder || 0) || left.siteId.localeCompare(right.siteId); }
  function sortByEmployee(left, right){ return getEmployeeName(left).localeCompare(getEmployeeName(right)); }
  function sortByTruck(left, right){ return left.unitNumber.localeCompare(right.unitNumber); }
  function sortByRoute(left, right){ return left.routeDate.localeCompare(right.routeDate) || getRouteName(left).localeCompare(getRouteName(right)); }
  function sortByRoutePlaceList(left, right){ return left.listName.localeCompare(right.listName); }
  function sortByRoutePlace(left, right){ return left.listId.localeCompare(right.listId) || left.placeName.localeCompare(right.placeName); }
  function sortByRouteStop(left, right){ return left.routeId.localeCompare(right.routeId) || Number(left.stopOrder || 0) - Number(right.stopOrder || 0); }
  function sortByRouteStopJob(left, right){ return left.routeStopId.localeCompare(right.routeStopId) || left.jobId.localeCompare(right.jobId); }

  function buildViewClients(data, indexes = buildDataIndexes(data)){
    const sitesByClient = new Map();
    data.sites.forEach((site) => {
      const list = sitesByClient.get(site.clientId) || [];
      const coords = parseGps(site.gpsCoordinates);
      const projectIds = getProjectIdsForSite(site.id, data, indexes);
      const projectNames = projectIds.map((projectId) => indexes.projectsById.get(projectId)?.projectName || '').filter(Boolean);
      list.push({
        id: site.id,
        clientId: site.clientId,
        projectIds,
        projectNames,
        name: site.siteName || 'Unnamed Site',
        type: site.siteType,
        status: site.siteStatus,
        standardJobTypes: site.standardJobTypes || '',
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
    renderModeControls();
    state.filteredClients = getFilteredClients();
    normalizeSelection(options.preserveSelection !== false);
    renderToolbarSummary();
    renderClientPicker();
    renderFilterRow();
    renderList();
    renderMapSummary();
    renderDetailPanel();
    if(options.syncMap !== false) syncMarkers();
    if(state.activeMode !== 'routes' && options.focusSelection !== false) focusSelectionOnMap();
  }

  function getFilteredClients(){
    if(state.activeMode === 'routes') return state.viewClients;
    const query = state.searchQuery;
    const clients = state.activeClientId ? state.viewClients.filter((client) => client.id === state.activeClientId) : state.viewClients;
    return clients.map((client) => ({
      ...client,
      sublocations: client.sublocations.filter((site) => {
        if(!siteMatchesTypeFilter(site)) return false;
        if(!query) return true;
        const haystack = [site.name, site.type, site.status, site.address, site.notes, site.standardJobTypes, site.coordsLabel, ...(site.projectNames || [])].join(' ').toLowerCase();
        return haystack.includes(query);
      })
    }));
  }

  function siteMatchesTypeFilter(site){
    return state.filterTag === 'All' || normalizeSiteType(site?.type) === state.filterTag;
  }

  function normalizeSelection(preserveSelection){
    if(!preserveSelection){
      state.activeSiteListKey = '';
      state.activeClientId = '';
      state.activeSiteId = '';
      state.activeRoutePlaceId = '';
      return;
    }
    const parsedList = parseSiteListKey(state.activeSiteListKey);
    if(state.activeRoutePlaceId){
      const place = getRoutePlace(state.activeRoutePlaceId);
      if(place && getRoutePlaceList(place.listId)){
        state.activeSiteListKey = getSiteListKey('place-list', place.listId);
        state.activeClientId = '';
        state.activeSiteId = '';
        return;
      }
    }
    if(parsedList.type === 'place-list'){
      const list = getRoutePlaceList(parsedList.id);
      if(list){
        state.activeClientId = '';
        state.activeSiteId = '';
        state.activeRoutePlaceId = '';
        return;
      }
    }
    if(state.activeSiteId){
      const owner = state.filteredClients.find((client) => client.sublocations.some((site) => site.id === state.activeSiteId));
      if(owner){
        state.activeSiteListKey = getSiteListKey('client', owner.id);
        state.activeClientId = owner.id;
        state.activeRoutePlaceId = '';
        return;
      }
    }
    if(state.activeClientId){
      const client = state.filteredClients.find((row) => row.id === state.activeClientId);
      if(client){
        state.activeSiteListKey = getSiteListKey('client', client.id);
        state.activeSiteId = '';
        state.activeRoutePlaceId = '';
        return;
      }
    }
    state.activeSiteListKey = '';
    state.activeClientId = '';
    state.activeSiteId = '';
    state.activeRoutePlaceId = '';
  }

  function renderToolbarSummary(){
    if(state.activeMode === 'routes'){
      const route = getCurrentRouteDraft();
      els['toolbar-summary'].textContent = route
        ? `${getRouteName(route)} route selected. Build stops, link open jobs, then assign technician and default truck.`
        : 'Route Builder creates dated plans from mapped sites, then links open Field Ops jobs when ready.';
      return;
    }
    if(state.activeSiteId){
      const site = getActiveSite();
      const client = getActiveClient();
      els['toolbar-summary'].textContent = `${client?.name || 'Client'} / ${site?.name || 'Site'} selected. Shared data updates write back to Field Ops.`;
      return;
    }
    if(state.activeRoutePlaceId){
      const place = getActiveRoutePlace();
      const list = getRoutePlaceList(place?.listId);
      els['toolbar-summary'].textContent = `${list?.listName || 'Other Sites'} / ${place?.placeName || 'Other Site'} selected. Other Sites stay out of client records.`;
      return;
    }
    const activePlaceList = getActiveRoutePlaceList();
    if(activePlaceList){
      els['toolbar-summary'].textContent = `${activePlaceList.listName} selected. Manage reusable Other Sites here, then add them to routes.`;
      return;
    }
    if(state.activeClientId){
      const client = getActiveClient();
      els['toolbar-summary'].textContent = `${client?.name || 'Client'} selected. SureMap adds mapped sites back to the shared Clients directory.`;
      return;
    }
    els['toolbar-summary'].textContent = 'Shared client and site directory synced with Field Ops.';
  }

  function renderClientPicker(){
    if(state.activeMode === 'routes'){
      els['client-picker'].innerHTML = '<div class="suremap-route-client-note">Site Lists are managed in Sites mode.</div>';
      return;
    }
    const value = state.clientPickerQuery || getSiteListPickerLabel();
    els['client-picker'].innerHTML = `
      <div class="client-picker-shell">
        <input id="suremap-client-picker-input" type="text" value="${esc(value)}" placeholder="${getAllSiteListOptions().length ? 'Search site lists...' : 'No site lists yet'}" autocomplete="off">
        <button class="act-btn client-picker-trigger" type="button" data-client-picker-trigger aria-label="Open client picker">Select</button>
        <div class="client-picker-results" id="suremap-client-picker-results">${getClientPickerResultsMarkup()}</div>
      </div>
    `;
  }

  function getClientPickerMatches(){
    const query = state.clientPickerQuery.trim().toLowerCase();
    const matches = (option) => {
      if(!query) return true;
      const childText = option.type === 'client'
        ? (option.client?.sublocations || []).map((site) => [site.name, site.address, site.coordsLabel, site.type].join(' ')).join(' ')
        : getRoutePlacesForList(option.id).map((place) => [place.placeName, place.addressValue, place.phone, place.websiteUrl, place.notes].join(' ')).join(' ');
      const haystack = [option.label, option.meta, childText].join(' ').toLowerCase();
      return haystack.includes(query);
    };
    return {
      clients:getClientSiteListOptions().filter(matches),
      other:getOtherSiteListOptions().filter(matches)
    };
  }

  function getClientPickerResultsMarkup(){
    const allOptions = getAllSiteListOptions();
    if(!allOptions.length) return '<div class="client-picker-empty">Add clients or Other Site lists to start mapping.</div>';
    const matches = getClientPickerMatches();
    const sections = [
      { title:'Clients', items:matches.clients },
      { title:'Other Sites', items:matches.other }
    ].filter((section) => section.items.length);
    if(!sections.length) return '<div class="client-picker-empty">No matching site lists.</div>';
    return sections.map((section) => `
      <div class="site-list-picker-section">
        <div class="site-list-picker-heading">${esc(section.title)}</div>
        ${section.items.map((option) => {
          const active = option.key === state.activeSiteListKey ? ' active' : '';
          return `<button type="button" class="client-picker-option site-list-picker-option${active}" data-site-list-key="${esc(option.key)}"><strong>${esc(option.label)}</strong><span>${esc(option.meta)}</span></button>`;
        }).join('')}
      </div>
    `).join('');
  }

  function renderClientPickerResults(open = false){
    const results = document.getElementById('suremap-client-picker-results');
    if(!results) return;
    results.innerHTML = getClientPickerResultsMarkup();
    results.classList.toggle('open', !!open);
  }

  function closeClientPickerResults(){
    document.getElementById('suremap-client-picker-results')?.classList.remove('open');
    const input = document.getElementById('suremap-client-picker-input');
    state.clientPickerQuery = '';
    if(input) input.value = getSiteListPickerLabel();
  }

  function selectClientFromPicker(siteListKey){
    state.clientPickerQuery = '';
    state.searchQuery = '';
    closeClientPickerResults();
    selectSiteList(siteListKey, { focusMap:true });
  }

  function renderFilterRow(){
    if(state.activeMode === 'routes'){
      els['filter-row'].innerHTML = getRouteStatusFilters().map((status) => `<button class="suremap-chip ${status === getRouteStatusFilter() ? 'active' : ''}" type="button" data-route-status-filter="${esc(status)}">${esc(status)}</button>`).join('');
      return;
    }
    if(getActiveRoutePlaceList()){
      els['filter-row'].innerHTML = '<button class="suremap-chip active" type="button">Other Sites</button>';
      return;
    }
    const tags = ['All', ...SITE_TYPE_OPTIONS];
    if(!tags.includes(state.filterTag)) state.filterTag = 'All';
    els['filter-row'].innerHTML = tags.map((tag) => `<button class="suremap-chip ${state.filterTag === tag ? 'active' : ''}" type="button" data-filter="${esc(tag)}">${esc(tag)}</button>`).join('');
  }

  function renderList(){
    if(state.activeMode === 'routes'){
      renderRouteList();
      return;
    }
    const activePlaceList = getActiveRoutePlaceList();
    if(activePlaceList){
      renderRoutePlaceList(activePlaceList);
      return;
    }
    const totalSiteLists = getAllSiteListOptions().length;
    if(!totalSiteLists){
      els['list-summary'].textContent = '0 site lists';
      els['client-list'].innerHTML = `<div class="empty-state"><strong>No site lists yet</strong>Add clients from the Clients page or create an Other Sites list.</div>`;
      return;
    }
    const client = getActiveClient();
    if(!client){
      els['list-summary'].textContent = `${totalSiteLists} site list${totalSiteLists === 1 ? '' : 's'}`;
      els['client-list'].innerHTML = `<div class="empty-state"><strong>No Site List selected</strong>Choose a client or Other Sites list above.</div>`;
      return;
    }
    const visibleClient = state.filteredClients.find((row) => row.id === client.id) || client;
    const sites = visibleClient.sublocations || [];
    const totalSites = client.sublocations.length;
    els['list-summary'].textContent = state.filterTag === 'All' ? `${totalSites} site${totalSites === 1 ? '' : 's'}` : `${sites.length} visible / ${totalSites} sites`;
    if(!totalSites){
      els['client-list'].innerHTML = `<div class="empty-state"><strong>No sites yet</strong>Add a mapped site from the details card.</div>`;
      return;
    }
    if(!sites.length){
      els['client-list'].innerHTML = `<div class="empty-state"><strong>No ${esc(state.filterTag)} sites</strong>Choose another site type or add a matching site from the details card.</div>`;
      return;
    }
    const color = getAvatarColor(client.id);
    els['client-list'].innerHTML = sites.map((site) => renderSiteCardMarkup(client, site, color)).join('');
  }

  function renderRoutePlaceList(list){
    const places = getRoutePlacesForList(list.id).filter((place) => {
      if(!state.searchQuery) return true;
      const haystack = [place.placeName, place.addressValue, place.phone, place.websiteUrl, place.notes].join(' ').toLowerCase();
      return haystack.includes(state.searchQuery);
    });
    const total = getRoutePlacesForList(list.id).length;
    els['list-summary'].textContent = state.searchQuery ? `${places.length} visible / ${total} other sites` : `${total} other site${total === 1 ? '' : 's'}`;
    if(!total){
      els['client-list'].innerHTML = `<div class="empty-state"><strong>No Other Sites yet</strong>Add one from the details panel.</div>`;
      return;
    }
    if(!places.length){
      els['client-list'].innerHTML = `<div class="empty-state"><strong>No matching Other Sites</strong>Clear search to see all saved sites in this list.</div>`;
      return;
    }
    els['client-list'].innerHTML = places.map((place) => renderRoutePlaceCardMarkup(list, place)).join('');
  }

  function renderRoutePlaceCardMarkup(list, place){
    const active = state.activeRoutePlaceId === place.id;
    const color = normalizeHexColor(list?.listColor, ROUTE_PLACE_COLORS[0]);
    const point = getRoutePlacePoint(place);
    return `
      <div class="suremap-site-card suremap-other-site-card ${active ? 'active' : ''}" data-route-place-id="${esc(place.id)}">
        <div class="suremap-site-icon suremap-other-site-icon" style="background:${esc(color)}22;color:${esc(color)}">${esc(getRoutePlaceIconToken(list?.iconKey))}</div>
        <div class="suremap-site-copy">
          <div class="item-title">${esc(getRoutePlaceName(place) || 'Other Site')}</div>
          <div class="item-sub">${esc(list?.listName || 'Other Sites')}</div>
          <div class="item-sub">${esc(point.value || 'No location')}</div>
          <div class="tag-row"><span class="status-badge ok">Other Site</span></div>
        </div>
      </div>
    `;
  }

  function renderSiteCardMarkup(client, site, color){
    const active = state.activeSiteId === site.id;
    const projectLabel = (site.projectNames || []).join(', ') || 'No linked project';
    return `
      <div class="suremap-site-card ${active ? 'active' : ''}" data-client-id="${esc(client.id)}" data-site-id="${esc(site.id)}">
        <div class="suremap-site-icon" style="background:${color}22;color:${color}">${esc(getSiteIconToken(site.type))}</div>
        <div class="suremap-site-copy">
          <div class="item-title">${esc(site.name)}</div>
          <div class="item-sub">${esc(projectLabel)}</div>
          <div class="item-sub">${esc(site.type)} | ${esc(site.address || site.coordsLabel || 'No location yet')}</div>
          <div class="tag-row">
            <span class="status-badge ${esc(siteStatusClass(site.status))}">${esc(site.status)}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderMapSummary(){
    if(state.activeMode === 'routes'){
      const route = getCurrentRouteDraft();
      const stopCount = route ? route.stops.length : 0;
      const providerLabel = state.mapProvider === 'google' ? 'SureMap' : 'Default map';
      els['map-summary'].textContent = route ? `${stopCount} stop${stopCount === 1 ? '' : 's'} | ${providerLabel}` : `Route builder | ${providerLabel}`;
      return;
    }
    const siteCount = state.filteredClients.reduce((sum, client) => sum + client.sublocations.length, 0) + getVisibleRoutePlaces().length;
    const providerLabel = state.mapProvider === 'google' ? 'SureMap' : 'Default map';
    els['map-summary'].textContent = `${siteCount} site${siteCount === 1 ? '' : 's'} visible | ${providerLabel}`;
  }

  function renderDetailPanel(){
    if(state.activeMode === 'routes'){
      renderRouteEditor();
      return;
    }
    const client = getActiveClient();
    const site = getActiveSite();
    const place = getActiveRoutePlace();
    const placeList = getActiveRoutePlaceList();
    if(place){
      els['detail-panel'].innerHTML = renderRoutePlaceDetail(place);
      return;
    }
    if(placeList){
      els['detail-panel'].innerHTML = renderRoutePlaceListDetail(placeList);
      return;
    }
    if(!client){
      els['detail-panel'].innerHTML = `<div class="suremap-empty-state empty-state"><strong>No selection</strong>Choose a Site List to inspect sites, directions, and edit actions.<div class="suremap-detail-actions"><button class="act-btn" type="button" data-action="add-route-place-list">+ Add Other Sites List</button></div></div>`;
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
          <button class="act-btn" type="button" data-action="open-client" data-client-id="${esc(client.id)}">Open In Clients</button>
        </div>
      </div>
    `;
  }

  function renderSiteDetail(client, site){
    const projectLabel = (site.projectNames || []).join(', ') || 'No linked project';
    const jobTypes = site.standardJobTypes || 'No standard job types set';
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
          <div class="suremap-detail-item full"><label>Linked Projects</label><span>${esc(projectLabel)}</span></div>
          <div class="suremap-detail-item full"><label>Standard Job Types</label><span>${esc(jobTypes)}</span></div>
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

  function renderRoutePlaceListDetail(list){
    const places = getRoutePlacesForList(list.id);
    const color = normalizeHexColor(list.listColor, ROUTE_PLACE_COLORS[0]);
    return `
      <div class="suremap-detail-card suremap-other-site-detail">
        <div class="suremap-detail-title">
          <div class="item-title">${esc(list.listName || 'Other Sites')}</div>
          <div class="tag-row">
            <span class="tag-chip" style="border-color:${esc(color)};color:${esc(color)}">Other Sites</span>
            <span class="tag-chip">${esc(places.length)} site${places.length === 1 ? '' : 's'}</span>
          </div>
        </div>
        <div class="suremap-detail-grid">
          <div class="suremap-detail-item"><label>List Color</label><span>${esc(color)}</span></div>
          <div class="suremap-detail-item"><label>Icon</label><span>${esc(getRoutePlaceIconToken(list.iconKey))}</span></div>
          <div class="suremap-detail-item full"><label>Notes</label><span>${esc(list.notes || 'No notes')}</span></div>
        </div>
        <div class="suremap-detail-actions">
          <button class="act-btn" type="button" data-action="add-route-place" data-list-id="${esc(list.id)}">+ Add Other Site</button>
          <button class="act-btn" type="button" data-action="edit-route-place-list" data-list-id="${esc(list.id)}">Edit List</button>
          <button class="act-btn danger" type="button" data-action="delete-route-place-list" data-list-id="${esc(list.id)}" ${places.length ? 'disabled' : ''}>Delete List</button>
        </div>
      </div>
    `;
  }

  function renderRoutePlaceDetail(place){
    const list = getRoutePlaceList(place.listId);
    const point = getRoutePlacePoint(place);
    const color = normalizeHexColor(list?.listColor, ROUTE_PLACE_COLORS[0]);
    return `
      <div class="suremap-detail-card suremap-other-site-detail">
        <div class="suremap-detail-title">
          <div class="item-title">${esc(getRoutePlaceName(place) || 'Other Site')}</div>
          <div class="tag-row">
            <span class="tag-chip" style="border-color:${esc(color)};color:${esc(color)}">${esc(list?.listName || 'Other Sites')}</span>
            <span class="tag-chip">${esc(place.locationType === 'gps' ? 'GPS' : 'Address')}</span>
          </div>
          <div class="item-sub">Other Sites</div>
        </div>
        <div class="suremap-detail-grid">
          <div class="suremap-detail-item full"><label>Location</label><span>${esc(point.value || 'No location')}</span></div>
          <div class="suremap-detail-item"><label>Coordinates</label><span>${esc(hasUsableCoords(point.lat, point.lng) ? formatGps(point.lat, point.lng) : 'Not mapped')}</span></div>
          <div class="suremap-detail-item"><label>Phone</label><span>${esc(place.phone || 'No phone')}</span></div>
          <div class="suremap-detail-item full"><label>Website</label><span>${place.websiteUrl ? `<a href="${esc(place.websiteUrl)}" target="_blank" rel="noopener">${esc(place.websiteUrl)}</a>` : 'No website'}</span></div>
          <div class="suremap-detail-item full"><label>Notes</label><span>${esc(place.notes || 'No notes')}</span></div>
        </div>
        <div class="suremap-detail-actions">
          <button class="act-btn" type="button" data-action="copy-route-place" data-place-id="${esc(place.id)}">Copy Location</button>
          <button class="act-btn" type="button" data-action="open-directions-route-place" data-place-id="${esc(place.id)}">Directions</button>
          <button class="act-btn" type="button" data-action="edit-route-place" data-place-id="${esc(place.id)}">Edit Site</button>
          <button class="act-btn danger" type="button" data-action="delete-route-place" data-place-id="${esc(place.id)}">Delete Site</button>
        </div>
      </div>
    `;
  }

  function syncMarkers(){
    if(!state.map) return;
    if(state.activeMode === 'routes'){
      syncRouteMarkers();
      return;
    }
    clearRouteOverlay();
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
    getVisibleRoutePlaces().forEach(({ list, place, point }) => {
      if(!hasCoords(point.lat, point.lng)) return;
      const color = normalizeHexColor(list?.listColor, ROUTE_PLACE_COLORS[0]);
      const key = `place:${place.id}`;
      visibleKeys.add(key);
      upsertMarker(key, [point.lat, point.lng], makeRoutePlaceMarkerIcon(color, getRoutePlaceIconToken(list?.iconKey)), buildPopup(point.label, point.value || place.notes || 'Other Site'), () => selectRoutePlace(place.id, { focusMap:false, fromMap:true }));
    });
    Array.from(state.markerCache.keys()).forEach((key) => {
      if(!visibleKeys.has(key)){
        removeMapMarker(state.markerCache.get(key));
        state.markerCache.delete(key);
      }
    });
  }

  function removeMapMarker(marker){
    if(!marker) return;
    if(state.mapProvider === 'google'){
      marker.setMap(null);
      return;
    }
    state.map.removeLayer(marker);
  }

  function openMapPopup(marker){
    if(!marker) return;
    if(state.mapProvider === 'google'){
      if(!state.googleInfoWindow) state.googleInfoWindow = new google.maps.InfoWindow();
      state.googleInfoWindow.setContent(marker.__popupHtml || '');
      state.googleInfoWindow.open({ anchor:marker, map:state.map });
      return;
    }
    marker.openPopup();
  }

  function ensureHomeMarker(){
    if(!state.map || !hasCoords(HOME_BASE.lat, HOME_BASE.lng) || state.homeMarker) return;
    const popupHtml = buildPopup(HOME_BASE.name, formatAddress(HOME_BASE.street, HOME_BASE.city, HOME_BASE.state, HOME_BASE.zip));
    if(state.mapProvider === 'google'){
      state.homeMarker = new google.maps.Marker({
        map: state.map,
        position: { lat:HOME_BASE.lat, lng:HOME_BASE.lng },
        icon: makeHomeIcon(),
        title: HOME_BASE.name
      });
      state.homeMarker.__popupHtml = popupHtml;
      state.homeMarker.addListener('click', () => openMapPopup(state.homeMarker));
      return;
    }
    state.homeMarker = L.marker([HOME_BASE.lat, HOME_BASE.lng], { icon:makeHomeIcon() })
      .bindPopup(popupHtml, { autoPan:false })
      .addTo(state.map);
  }

  function upsertMarker(key, latLng, icon, popupHtml, onClick){
    if(state.mapProvider === 'google'){
      const position = { lat:Number(latLng[0]), lng:Number(latLng[1]) };
      let marker = state.markerCache.get(key);
      if(!marker){
        marker = new google.maps.Marker({
          map: state.map,
          position,
          icon
        });
        state.markerCache.set(key, marker);
      } else {
        marker.setMap(state.map);
        marker.setPosition(position);
        marker.setIcon(icon);
      }
      marker.__popupHtml = popupHtml;
      google.maps.event.clearInstanceListeners(marker);
      marker.addListener('click', () => {
        openMapPopup(marker);
        onClick();
      });
      return;
    }
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

  function svgToDataUri(svg){
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function makeMarkerIcon(color, isSite){
    const cacheKey = `${state.mapProvider}:${isSite ? 'site' : 'client'}:${color}`;
    const cached = state.markerIconCache.get(cacheKey);
    if(cached) return cached;
    const size = isSite ? [22, 30] : [28, 36];
    const anchor = isSite ? [11, 30] : [14, 36];
    const inner = isSite ? 4 : 5;
    const svg = `<svg width="${size[0]}" height="${size[1]}" viewBox="0 0 ${size[0]} ${size[1]}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M${size[0] / 2} 0C${isSite ? '4.9 0 0 4.9 0 11c0 8.3 11 19 11 19s11-10.7 11-19C22 4.9 17.1 0 11 0Z' : '6.7 0 0 6.7 0 14.5c0 10.5 14 21.5 14 21.5s14-11 14-21.5C28 6.7 21.3 0 14 0Z'}" fill="${color}"/><circle cx="${size[0] / 2}" cy="${isSite ? 11 : 14}" r="${inner}" fill="#071009"/></svg>`;
    const icon = state.mapProvider === 'google'
      ? {
        url: svgToDataUri(svg),
        scaledSize: new google.maps.Size(size[0], size[1]),
        anchor: new google.maps.Point(anchor[0], anchor[1])
      }
      : L.divIcon({
        className: '',
        iconSize: size,
        iconAnchor: anchor,
        popupAnchor: [0, isSite ? -26 : -32],
        html: svg
      });
    state.markerIconCache.set(cacheKey, icon);
    return icon;
  }

  function makeHomeIcon(){
    const cacheKey = `${state.mapProvider}:home`;
    const cached = state.markerIconCache.get(cacheKey);
    if(cached) return cached;
    const svg = '<svg width="30" height="34" viewBox="0 0 30 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 1 2 12v20h26V12L15 1Z" fill="#ffd166"/><path d="M10 32V19h10v13" fill="#071009"/><path d="M8 15h14" stroke="#071009" stroke-width="2"/></svg>';
    const icon = state.mapProvider === 'google'
      ? {
        url: svgToDataUri(svg),
        scaledSize: new google.maps.Size(30, 34),
        anchor: new google.maps.Point(15, 34)
      }
      : L.divIcon({
        className: '',
        iconSize: [30, 34],
        iconAnchor: [15, 34],
        popupAnchor: [0, -30],
        html: svg
      });
    state.markerIconCache.set(cacheKey, icon);
    return icon;
  }

  function makeRoutePlaceMarkerIcon(color, token){
    const normalizedColor = normalizeHexColor(color, ROUTE_PLACE_COLORS[0]);
    const label = String(token || 'OS').slice(0, 2).toUpperCase();
    const cacheKey = `${state.mapProvider}:other-site:${normalizedColor}:${label}`;
    const cached = state.markerIconCache.get(cacheKey);
    if(cached) return cached;
    const svg = `<svg width="30" height="34" viewBox="0 0 30 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 2h22a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2h-7l-4 7-4-7H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" fill="${normalizedColor}"/><text x="15" y="18" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="700" fill="#071009">${label}</text></svg>`;
    const icon = state.mapProvider === 'google'
      ? {
        url: svgToDataUri(svg),
        scaledSize: new google.maps.Size(30, 34),
        anchor: new google.maps.Point(15, 34)
      }
      : L.divIcon({
        className: '',
        iconSize: [30, 34],
        iconAnchor: [15, 34],
        popupAnchor: [0, -30],
        html: svg
      });
    state.markerIconCache.set(cacheKey, icon);
    return icon;
  }

  function focusSelectionOnMap(){
    const place = getActiveRoutePlace();
    if(place){
      const point = getRoutePlacePoint(place);
      if(hasCoords(point.lat, point.lng)){
        els['map-placeholder'].classList.add('hidden');
        if(state.mapProvider === 'google'){
          state.map.panTo({ lat:point.lat, lng:point.lng });
          state.map.setZoom(14);
          openMapPopup(state.markerCache.get(`place:${place.id}`));
          return;
        }
        state.map.flyTo([point.lat, point.lng], 14, { animate:true, duration:.6 });
        state.markerCache.get(`place:${place.id}`)?.openPopup();
        return;
      }
    }
    const site = getActiveSite();
    if(site && hasCoords(site.lat, site.lng)){
      els['map-placeholder'].classList.add('hidden');
      if(state.mapProvider === 'google'){
        state.map.panTo({ lat:site.lat, lng:site.lng });
        state.map.setZoom(14);
        openMapPopup(state.markerCache.get(`site:${site.id}`));
        return;
      }
      state.map.flyTo([site.lat, site.lng], 14, { animate:true, duration:.6 });
      state.markerCache.get(`site:${site.id}`)?.openPopup();
      return;
    }
    const client = getActiveClient();
    if(client && hasCoords(client.lat, client.lng)){
      els['map-placeholder'].classList.add('hidden');
      if(state.mapProvider === 'google'){
        state.map.panTo({ lat:client.lat, lng:client.lng });
        state.map.setZoom(12);
        openMapPopup(state.markerCache.get(`client:${client.id}`));
        return;
      }
      state.map.flyTo([client.lat, client.lng], 12, { animate:true, duration:.6 });
      state.markerCache.get(`client:${client.id}`)?.openPopup();
      return;
    }
    els['map-placeholder'].classList.remove('hidden');
  }

  function getVisibleMappedSites(){
    if(getActiveRoutePlaceList()) return [];
    return state.filteredClients.flatMap((client) => (client.sublocations || []).map((site) => ({ client, site })))
      .filter(({ site }) => hasUsableCoords(site.lat, site.lng));
  }

  function getVisibleRoutePlaces(){
    if(state.activeMode === 'routes') return [];
    const activeList = getActiveRoutePlaceList();
    if(state.activeClientId && !activeList) return [];
    const places = activeList ? getRoutePlacesForList(activeList.id) : getActiveRoutePlaces();
    const query = String(state.searchQuery || '').trim().toLowerCase();
    return places.map((place) => ({ list:getRoutePlaceList(place.listId), place, point:getRoutePlacePoint(place) }))
      .filter(({ point }) => hasUsableCoords(point.lat, point.lng))
      .filter(({ place, point, list }) => {
        if(!query) return true;
        const haystack = [place.placeName, point.value, place.phone, place.websiteUrl, place.notes, list?.listName].join(' ').toLowerCase();
        return haystack.includes(query);
      });
  }

  function fitVisibleSites(){
    if(!state.map) return;
    if(state.activeMode === 'routes'){
      syncRouteMarkers();
      return;
    }
    const visibleSites = getVisibleMappedSites();
    const visiblePlaces = getVisibleRoutePlaces();
    const points = [
      ...visibleSites.map(({ site }) => ({ lat:site.lat, lng:site.lng })),
      ...visiblePlaces.map(({ point }) => ({ lat:point.lat, lng:point.lng }))
    ];
    if(!points.length){
      alert('No visible sites have GPS coordinates to fit on the map.');
      return;
    }
    els['map-placeholder'].classList.add('hidden');
    if(state.mapProvider === 'google'){
      if(points.length === 1){
        state.map.panTo(points[0]);
        state.map.setZoom(13);
        return;
      }
      const bounds = new google.maps.LatLngBounds();
      points.forEach((point) => bounds.extend(point));
      state.map.fitBounds(bounds);
      return;
    }
    const latLngs = points.map((point) => [point.lat, point.lng]);
    if(latLngs.length === 1){
      state.map.flyTo(latLngs[0], 13, { animate:true, duration:.6 });
      return;
    }
    state.map.fitBounds(L.latLngBounds(latLngs), { padding:[28, 28] });
  }

  function selectSiteList(siteListKey, options = {}){
    const parsed = parseSiteListKey(siteListKey);
    if(parsed.type === 'place-list'){
      const list = getRoutePlaceList(parsed.id);
      if(!list) return;
      state.activeSiteListKey = getSiteListKey('place-list', list.id);
      state.activeClientId = '';
      state.activeSiteId = '';
      state.activeRoutePlaceId = '';
      state.filteredClients = getFilteredClients();
      renderClientPicker();
      renderFilterRow();
      renderList();
      renderToolbarSummary();
      renderDetailPanel();
      syncMarkers();
      if(options.focusMap !== false) focusSelectionOnMap();
      return;
    }
    selectClient(parsed.id, options);
  }

  function selectClient(clientId, options = {}){
    const client = state.viewIndexes.clientsById.get(String(clientId));
    if(!client) return;
    state.activeSiteListKey = getSiteListKey('client', client.id);
    state.activeClientId = client.id;
    state.activeSiteId = '';
    state.activeRoutePlaceId = '';
    state.expandedIds.add(client.id);
    state.filteredClients = getFilteredClients();
    renderClientPicker();
    renderFilterRow();
    renderList();
    renderToolbarSummary();
    renderDetailPanel();
    syncMarkers();
    if(options.focusMap !== false) focusSelectionOnMap();
  }

  function selectSite(clientId, siteId, options = {}){
    const sourceClient = state.viewIndexes.clientBySiteId.get(String(siteId)) || state.viewIndexes.clientsById.get(String(clientId));
    const sourceSite = state.viewIndexes.sitesById.get(String(siteId));
    if(!sourceClient || !sourceSite) return;
    state.activeSiteListKey = getSiteListKey('client', sourceClient.id);
    state.activeClientId = sourceClient.id;
    state.activeSiteId = sourceSite.id;
    state.activeRoutePlaceId = '';
    state.expandedIds.add(sourceClient.id);
    state.filteredClients = getFilteredClients();
    const visibleSite = state.filteredClients.find((row) => row.id === sourceClient.id)?.sublocations.find((row) => row.id === String(siteId));
    if(!visibleSite && state.filterTag !== 'All'){
      state.filterTag = 'All';
      state.filteredClients = getFilteredClients();
    } else if(!visibleSite && state.searchQuery){
      state.searchQuery = '';
      state.filteredClients = getFilteredClients();
    }
    renderClientPicker();
    renderFilterRow();
    renderList();
    renderToolbarSummary();
    renderDetailPanel();
    syncMarkers();
    if(options.focusMap !== false) focusSelectionOnMap();
  }

  function selectRoutePlace(placeId, options = {}){
    const place = getRoutePlace(placeId);
    if(!place) return;
    state.activeSiteListKey = getSiteListKey('place-list', place.listId);
    state.activeClientId = '';
    state.activeSiteId = '';
    state.activeRoutePlaceId = place.id;
    state.filteredClients = getFilteredClients();
    renderClientPicker();
    renderFilterRow();
    renderList();
    renderToolbarSummary();
    renderDetailPanel();
    syncMarkers();
    if(options.focusMap !== false) focusSelectionOnMap();
  }

  function renderModeControls(){
    document.querySelectorAll('[data-mode]').forEach((button) => {
      button.classList.toggle('active', button.dataset.mode === state.activeMode);
    });
    document.querySelectorAll('.suremap-route-filter-control').forEach((node) => {
      node.classList.toggle('hidden', state.activeMode !== 'routes');
    });
    if(els['fit-sites-btn']) els['fit-sites-btn'].textContent = state.activeMode === 'routes' ? 'Fit Route' : 'Fit Sites';
    const listTitle = document.querySelector('#suremap-directory-section .panel-header h2');
    if(listTitle) listTitle.textContent = state.activeMode === 'routes' ? 'Routes' : 'Sites';
    const showCustomRouteRange = state.activeMode === 'routes' && state.routeDatePreset === 'custom';
    document.querySelectorAll('.suremap-route-custom-filter').forEach((node) => node.classList.toggle('hidden', !showCustomRouteRange));
    if(els['route-date-preset'] && els['route-date-preset'].value !== state.routeDatePreset) els['route-date-preset'].value = state.routeDatePreset || 'next_30_days';
    if(els['route-date-start'] && els['route-date-start'].value !== state.routeCustomStartDate) els['route-date-start'].value = state.routeCustomStartDate || '';
    if(els['route-date-end'] && els['route-date-end'].value !== state.routeCustomEndDate) els['route-date-end'].value = state.routeCustomEndDate || '';
  }

  function setActiveMode(mode){
    state.activeMode = mode === 'routes' ? 'routes' : 'sites';
    if(state.activeMode === 'routes'){
      state.activeSiteListKey = '';
      state.activeClientId = '';
      state.activeSiteId = '';
      state.activeRoutePlaceId = '';
      if(!state.activeRouteId && state.data.fieldRoutes.length){
        const first = getFilteredRoutes()[0];
        if(first) selectRoute(first.id, { focusMap:false, refresh:false });
      }
    } else {
      state.activeRouteId = '';
      state.routeAddStopListKey = '';
      state.routeDraft = null;
      state.routeDirty = false;
      clearRouteOverlay();
    }
    refreshFilteredView({ syncMap:true, preserveSelection:true, focusSelection:false });
  }

  function getRouteStatusFilter(){
    return state.routeStatusFilter || 'Active';
  }

  function getRouteStatusFilters(){
    return ['Active', 'Draft', 'Planned', 'Assigned', 'Complete', 'Archived', 'All'];
  }

  function getRouteDatePresetOptions(){
    return [
      { value:'next_30_days', label:'Next 30 Days' },
      { value:'this_month', label:'This Month' },
      { value:'next_month', label:'Next Month' },
      { value:'last_month', label:'Last Month' },
      { value:'this_week', label:'This Week' },
      { value:'next_week', label:'Next Week' },
      { value:'last_week', label:'Last Week' },
      { value:'custom', label:'Custom Date Range' }
    ];
  }

  function getRouteDateRange(){
    const today = todayISO();
    const todayDate = dateFromISO(today) || new Date();
    const preset = state.routeDatePreset || 'next_30_days';
    if(preset === 'custom'){
      ensureCustomRouteRange();
      return { start:state.routeCustomStartDate, end:state.routeCustomEndDate, label:'Custom Date Range' };
    }
    if(preset === 'this_month') return { start:startOfMonthISO(todayDate.getFullYear(), todayDate.getMonth()), end:endOfMonthISO(todayDate.getFullYear(), todayDate.getMonth()), label:'This Month' };
    if(preset === 'next_month') return { start:startOfMonthISO(todayDate.getFullYear(), todayDate.getMonth() + 1), end:endOfMonthISO(todayDate.getFullYear(), todayDate.getMonth() + 1), label:'Next Month' };
    if(preset === 'last_month') return { start:startOfMonthISO(todayDate.getFullYear(), todayDate.getMonth() - 1), end:endOfMonthISO(todayDate.getFullYear(), todayDate.getMonth() - 1), label:'Last Month' };
    if(preset === 'this_week'){
      const start = startOfWeekISO(today);
      return { start, end:addDaysISO(start, 6), label:'This Week' };
    }
    if(preset === 'next_week'){
      const start = addDaysISO(startOfWeekISO(today), 7);
      return { start, end:addDaysISO(start, 6), label:'Next Week' };
    }
    if(preset === 'last_week'){
      const start = addDaysISO(startOfWeekISO(today), -7);
      return { start, end:addDaysISO(start, 6), label:'Last Week' };
    }
    return { start:today, end:addDaysISO(today, 30), label:'Next 30 Days' };
  }

  function ensureCustomRouteRange(){
    if(!state.routeCustomStartDate) state.routeCustomStartDate = todayISO();
    if(!state.routeCustomEndDate) state.routeCustomEndDate = addDaysISO(state.routeCustomStartDate, 30);
    normalizeCustomRouteRange();
  }

  function normalizeCustomRouteRange(){
    state.routeCustomStartDate = toInputDate(state.routeCustomStartDate) || todayISO();
    state.routeCustomEndDate = toInputDate(state.routeCustomEndDate) || state.routeCustomStartDate;
    if(state.routeCustomEndDate < state.routeCustomStartDate) state.routeCustomEndDate = state.routeCustomStartDate;
  }

  function isRouteInCurrentDateRange(route){
    const routeDate = toInputDate(route?.routeDate);
    const range = getRouteDateRange();
    return !!routeDate && (!range.start || routeDate >= range.start) && (!range.end || routeDate <= range.end);
  }

  function setRouteFilterToDate(routeDate){
    const date = toInputDate(routeDate) || todayISO();
    state.routeDatePreset = 'custom';
    state.routeCustomStartDate = date;
    state.routeCustomEndDate = date;
  }

  function getEmployeeName(employee){
    if(!employee) return 'Unassigned';
    return employee.employeeName || `${employee.employeeFirstName || ''} ${employee.employeeLastName || ''}`.trim() || 'Unnamed employee';
  }

  function getFieldEmployees(){
    return state.data.employees.filter((employee) => ['Field', 'Both'].includes(employee.workScope || '')).sort(sortByEmployee);
  }

  function getTruckLabel(truck){
    return truck?.unitNumber || 'Unnamed truck';
  }

  function getRouteName(route){
    return String(route?.routeName || '').trim() || `Route ${formatDate(route?.routeDate || todayISO())}`;
  }

  function getRouteStatusClass(status){
    if(status === 'Assigned' || status === 'Complete') return 'ok';
    if(status === 'Planned') return 'warn';
    if(status === 'Archived') return 'muted';
    return '';
  }

  function getFilteredRoutes(){
    const statusFilter = getRouteStatusFilter();
    const range = getRouteDateRange();
    return state.data.fieldRoutes.filter((route) => {
      const routeDate = toInputDate(route.routeDate);
      if(range.start && routeDate < range.start) return false;
      if(range.end && routeDate > range.end) return false;
      if(statusFilter === 'All') return true;
      if(statusFilter === 'Active') return !['Complete', 'Archived'].includes(route.routeStatus);
      return route.routeStatus === statusFilter;
    }).sort(sortByRoute);
  }

  function renderRouteList(){
    const routes = getFilteredRoutes();
    const range = getRouteDateRange();
    els['list-summary'].textContent = `${routes.length} route${routes.length === 1 ? '' : 's'} | ${range.start === range.end ? formatDate(range.start) : `${formatDate(range.start)} - ${formatDate(range.end)}`}`;
    if(!routes.length){
      els['client-list'].innerHTML = '<div class="empty-state"><strong>No routes found</strong>Create a route or choose another date range.</div>';
      return;
    }
    els['client-list'].innerHTML = routes.map((route) => {
      const stops = getRouteStops(route.id);
      const linkedJobs = stops.reduce((sum, stop) => sum + getRouteStopJobs(stop.id).length, 0);
      const employee = state.indexes.employeesById.get(route.assignedTechnicianId);
      return `<div class="suremap-route-card ${state.activeRouteId === route.id ? 'active' : ''}" data-route-id="${esc(route.id)}">
        <div class="suremap-route-card-head">
          <div>
            <div class="item-title">${esc(getRouteName(route))}</div>
            <div class="item-sub">${esc(formatDate(route.routeDate))} | ${esc(getEmployeeName(employee))}</div>
          </div>
          <span class="status-badge ${esc(getRouteStatusClass(route.routeStatus))}">${esc(route.routeStatus)}</span>
        </div>
        <div class="mini-tags">
          <span class="tag-chip">${stops.length} stop${stops.length === 1 ? '' : 's'}</span>
          <span class="tag-chip">${linkedJobs} linked job${linkedJobs === 1 ? '' : 's'}</span>
          ${route.distanceMeters ? `<span class="tag-chip">${esc(formatDistance(route.distanceMeters))}</span>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  function openRouteStartChooser(){
    state.activeMode = 'routes';
    state.activeRouteId = 'route-choice';
    state.routeDraft = null;
    state.routeDirty = false;
    refreshFilteredView({ syncMap:true, preserveSelection:true, focusSelection:false });
  }

  function openNewRouteDraft(){
    state.activeMode = 'routes';
    state.activeRouteId = 'draft';
    state.routeDraft = createRouteDraft();
    state.routeDirty = true;
    refreshFilteredView({ syncMap:true, preserveSelection:true, focusSelection:false });
  }

  function createRouteDraft(route = null){
    const range = getRouteDateRange();
    const base = normalizeRoute(route || {
      routeDate: range.start || todayISO(),
      routeStatus: 'Draft',
      originType: 'spl',
      originLabel: HOME_BASE.name,
      originLatitude: HOME_BASE.lat,
      originLongitude: HOME_BASE.lng,
      destinationType: 'spl',
      destinationLabel: HOME_BASE.name,
      destinationLatitude: HOME_BASE.lat,
      destinationLongitude: HOME_BASE.lng
    });
    return {
      ...base,
      stops: route?.stops ? clone(route.stops) : getRouteStops(base.id).map((stop) => ({ ...stop, jobIds:getRouteStopJobs(stop.id).map((row) => row.jobId) }))
    };
  }

  function selectRoute(routeId, options = {}){
    const route = state.indexes.fieldRoutesById.get(String(routeId));
    if(!route) return;
    state.activeMode = 'routes';
    state.activeRouteId = route.id;
    state.routeDraft = createRouteDraft(route);
    state.routeDirty = false;
    if(options.refresh !== false) refreshFilteredView({ syncMap:true, preserveSelection:true, focusSelection:options.focusMap !== false });
  }

  function ensureRouteDraftStillValid(){
    if(!state.activeRouteId || state.activeRouteId === 'draft') return;
    const route = state.indexes.fieldRoutesById.get(state.activeRouteId);
    if(!route){
      state.activeRouteId = '';
      state.routeDraft = null;
      state.routeDirty = false;
      return;
    }
    if(!state.routeDirty) state.routeDraft = createRouteDraft(route);
  }

  function getCurrentRouteDraft(){
    if(state.routeDraft) return state.routeDraft;
    if(state.activeRouteId){
      const route = state.indexes.fieldRoutesById.get(state.activeRouteId);
      if(route) state.routeDraft = createRouteDraft(route);
    }
    return state.routeDraft;
  }

  function getRouteStops(routeId){
    return [...(state.indexes.routeStopsByRouteId.get(String(routeId)) || [])];
  }

  function getRouteStopJobs(routeStopId){
    return [...(state.indexes.routeStopJobsByStopId.get(String(routeStopId)) || [])];
  }

  function getSiteById(siteId){
    return state.indexes.sitesById.get(String(siteId)) || null;
  }

  function getViewSite(siteId){
    return state.viewIndexes.sitesById.get(String(siteId)) || null;
  }

  function getRoutePlaceList(listId){
    return state.indexes.routePlaceListsById.get(String(listId || '')) || null;
  }

  function getRoutePlace(placeId){
    return state.indexes.routePlacesById.get(String(placeId || '')) || null;
  }

  function getActiveRoutePlaceLists(){
    return (state.data.routePlaceLists || []).filter((list) => list.isActive !== false).sort(sortByRoutePlaceList);
  }

  function getActiveRoutePlaces(){
    return (state.data.routePlaces || []).filter((place) => place.isActive !== false && getRoutePlaceList(place.listId)?.isActive !== false).sort(sortByRoutePlace);
  }

  function getRoutePlaceName(place){
    return String(place?.placeName || '').trim();
  }

  function getSiteListKey(type, id){
    return `${type === 'place-list' ? SITE_LIST_PLACE_PREFIX : SITE_LIST_CLIENT_PREFIX}${String(id || '')}`;
  }

  function parseSiteListKey(key){
    const raw = String(key || '');
    if(raw.startsWith(SITE_LIST_PLACE_PREFIX)) return { type:'place-list', id:raw.slice(SITE_LIST_PLACE_PREFIX.length) };
    if(raw.startsWith(SITE_LIST_CLIENT_PREFIX)) return { type:'client', id:raw.slice(SITE_LIST_CLIENT_PREFIX.length) };
    if(raw) return { type:'client', id:raw };
    return { type:'', id:'' };
  }

  function getClientSiteListOptions(){
    return (state.viewClients || []).map((client) => ({
      key:getSiteListKey('client', client.id),
      type:'client',
      id:client.id,
      label:client.name || 'Unnamed client',
      meta:`${client.sublocations.length} site${client.sublocations.length === 1 ? '' : 's'} | ${client.accountStatus || 'Active'}`,
      count:client.sublocations.length,
      color:getAvatarColor(client.id),
      client
    })).sort((left, right) => left.label.localeCompare(right.label));
  }

  function getOtherSiteListOptions(){
    return getActiveRoutePlaceLists().map((list) => {
      const places = getRoutePlacesForList(list.id);
      return {
        key:getSiteListKey('place-list', list.id),
        type:'place-list',
        id:list.id,
        label:list.listName || 'Other Sites',
        meta:`${places.length} other site${places.length === 1 ? '' : 's'}`,
        count:places.length,
        color:normalizeHexColor(list.listColor, ROUTE_PLACE_COLORS[0]),
        list
      };
    }).sort((left, right) => left.label.localeCompare(right.label));
  }

  function getAllSiteListOptions(){
    return [...getClientSiteListOptions(), ...getOtherSiteListOptions()];
  }

  function getSiteListOptionByKey(key){
    return getAllSiteListOptions().find((option) => option.key === String(key || '')) || null;
  }

  function getRoutePlacesForList(listId){
    return getActiveRoutePlaces().filter((place) => place.listId === String(listId || '')).sort(sortByRoutePlace);
  }

  function getActiveSiteListOption(){
    return getSiteListOptionByKey(state.activeSiteListKey);
  }

  function getActiveRoutePlaceList(){
    const parsed = parseSiteListKey(state.activeSiteListKey);
    return parsed.type === 'place-list' ? getRoutePlaceList(parsed.id) : null;
  }

  function getActiveRoutePlace(){
    return getRoutePlace(state.activeRoutePlaceId);
  }

  function getSiteListPickerLabel(){
    const active = getActiveSiteListOption();
    return active?.label || '';
  }

  function getRoutePlacePoint(place){
    const lat = normalizeNumber(place?.latitude);
    const lng = normalizeNumber(place?.longitude);
    const value = place?.addressValue || (hasUsableCoords(lat, lng) ? formatGps(lat, lng) : '');
    return {
      lat,
      lng,
      address:place?.locationType === 'address' ? value : '',
      label:getRoutePlaceName(place) || 'Other Site',
      value,
      place,
      list:getRoutePlaceList(place?.listId)
    };
  }

  function getRoutePlaceDirections(place){
    const point = getRoutePlacePoint(place);
    if(point.address) return point.address;
    if(point.value) return point.value;
    if(hasUsableCoords(point.lat, point.lng)) return formatGps(point.lat, point.lng);
    return '';
  }

  function getJobById(jobId){
    return state.indexes.jobsById.get(String(jobId)) || null;
  }

  function getJobTitle(job){
    if(!job) return 'Unknown job';
    return [job.jobType || 'Job', job.fieldfxTicketId ? `#${job.fieldfxTicketId}` : '', job.scopeSummary].filter(Boolean).join(' - ');
  }

  function getJobDate(job){
    return toInputDate(job?.scheduledStart) || toInputDate(job?.requestedDate);
  }

  function getJobTechnicianId(jobId){
    const assignment = (state.indexes.jobAssignmentsByJobId.get(String(jobId)) || []).find((row) => row.assignmentType === 'Technician' && row.resourceId);
    return assignment?.resourceId || '';
  }

  function isJobPast(job){
    const compare = parseDateTime(job?.scheduledEnd) || parseDateTime(job?.scheduledStart) || parseDateTime(`${job?.requestedDate || ''}T23:59:59`);
    return !!(compare && compare < new Date());
  }

  function getLinkedActiveJobIds(exceptRouteId = ''){
    const activeRouteIds = new Set(state.data.fieldRoutes.filter((route) => route.id !== exceptRouteId && !['Complete', 'Archived'].includes(route.routeStatus)).map((route) => route.id));
    const linkedJobIds = new Set();
    activeRouteIds.forEach((routeId) => {
      (state.indexes.routeStopsByRouteId.get(routeId) || []).forEach((stop) => {
        (state.indexes.routeStopJobsByStopId.get(stop.id) || []).forEach((link) => linkedJobIds.add(link.jobId));
      });
    });
    return linkedJobIds;
  }

  function getJobSiteIds(job){
    if(!job) return [];
    const indexedIds = state.indexes.jobSiteIdsByJobId.get(String(job.id)) || [];
    return normalizeStringArray(indexedIds.length ? indexedIds : [job.siteId]);
  }

  function getAvailableJobsForStop(stop, context = {}){
    if(normalizeRouteStopType(stop?.stopType) !== 'site') return [];
    const route = context.route || getCurrentRouteDraft();
    const linkedElsewhere = context.linkedElsewhere || getLinkedActiveJobIds(route?.id || '');
    const currentJobIds = new Set(stop.jobIds || []);
    return state.data.jobs.filter((job) => {
      if(!getJobSiteIds(job).includes(stop.siteId)) return false;
      if(isJobPast(job)) return false;
      if(linkedElsewhere.has(job.id) && !currentJobIds.has(job.id)) return false;
      return true;
    }).sort((left, right) => {
      const leftSame = getJobDate(left) === route?.routeDate ? 0 : 1;
      const rightSame = getJobDate(right) === route?.routeDate ? 0 : 1;
      return leftSame - rightSame || String(getJobDate(left) || '').localeCompare(String(getJobDate(right) || '')) || getJobTitle(left).localeCompare(getJobTitle(right));
    });
  }

  function renderRouteEditor(){
    if(state.activeRouteId === 'route-choice'){
      renderRouteStartChooser();
      return;
    }
    const route = getCurrentRouteDraft();
    if(!route){
      els['detail-panel'].innerHTML = '<div class="suremap-empty-state empty-state"><strong>No route selected</strong>Create a route or select one from the route list.</div>';
      return;
    }
    const siteOptions = state.viewClients.flatMap((client) => client.sublocations.map((site) => ({ ...site, clientName:client.name }))).sort((a, b) => a.name.localeCompare(b.name));
    const employeeOptions = getFieldEmployees();
    const routeRenderContext = { route, linkedElsewhere:getLinkedActiveJobIds(route.id || '') };
    els['detail-panel'].innerHTML = `
      <div class="suremap-detail-card suremap-route-editor">
        <div class="suremap-detail-title">
          <input class="form-input route-title-input" data-route-field="routeName" value="${esc(route.routeName)}" placeholder="${esc(getRouteName(route))}">
          <div class="tag-row">
            <span class="status-badge ${esc(getRouteStatusClass(route.routeStatus))}">${esc(route.routeStatus)}</span>
            ${state.routeDirty ? '<span class="tag-chip warn">Unsaved</span>' : ''}
          </div>
        </div>
        <div class="suremap-route-form-grid">
          <div class="form-group"><label class="form-label">Route Date</label><input class="form-input" type="date" data-route-field="routeDate" value="${esc(route.routeDate)}" required></div>
          <div class="form-group"><label class="form-label">Status</label><select class="form-input" data-route-field="routeStatus">${ROUTE_STATUS_OPTIONS.map((status) => `<option value="${esc(status)}" ${route.routeStatus === status ? 'selected' : ''}>${esc(status)}</option>`).join('')}</select></div>
          <div class="form-group full"><label class="form-label">Technician</label><select class="form-input" data-route-field="assignedTechnicianId"><option value="">Select technician...</option>${employeeOptions.map((employee) => `<option value="${esc(employee.id)}" ${route.assignedTechnicianId === employee.id ? 'selected' : ''}>${esc(getEmployeeName(employee))}</option>`).join('')}</select></div>
        </div>
        <div class="suremap-route-location-grid">
          ${renderRouteLocationEditor('origin', route, siteOptions)}
          ${renderRouteLocationEditor('destination', route, siteOptions)}
        </div>
        <div class="suremap-route-stop-tools">
          <button class="add-btn suremap-add-stop-btn" type="button" data-action="open-add-route-stop">+ Add Stop</button>
        </div>
        <div class="suremap-route-stops">${route.stops.length ? route.stops.map((stop, index) => renderRouteStopEditor(stop, index, route, routeRenderContext)).join('') : '<div class="empty-state">No stops yet. Use Add Stop to choose a client site or Other Site.</div>'}</div>
        <div class="form-group"><label class="form-label">Notes</label><textarea class="form-input" data-route-field="notes">${esc(route.notes)}</textarea></div>
        <div class="suremap-route-summary" id="route-summary">${renderRouteTotals(route)}</div>
        <div class="suremap-detail-actions">
          <button class="btn-save" type="button" data-action="save-route" ${!route.stops.length ? 'disabled' : ''}>Save and Assign</button>
          <button class="act-btn" type="button" data-action="save-route-draft">Save as Draft</button>
          <button class="act-btn" type="button" data-action="open-route-directions" ${!canOpenRouteDirections(route) ? 'disabled' : ''}>Directions</button>
          <button class="act-btn" type="button" data-action="optimize-route" ${route.stops.length < 2 ? 'disabled' : ''}>Optimize</button>
          <button class="act-btn danger" type="button" data-action="delete-route" ${route.id ? '' : 'disabled'}>Delete</button>
        </div>
      </div>
    `;
  }

  function getRouteBuildJobOptions(){
    const linkedElsewhere = getLinkedActiveJobIds('');
    return state.data.jobs.filter((job) => {
      const siteIds = getJobSiteIds(job).filter((siteId) => getViewSite(siteId));
      if(siteIds.length < 1) return false;
      if(isJobPast(job)) return false;
      if(linkedElsewhere.has(job.id)) return false;
      return true;
    }).sort((left, right) => {
      const leftDate = getJobDate(left) || '';
      const rightDate = getJobDate(right) || '';
      return leftDate.localeCompare(rightDate) || getJobTitle(left).localeCompare(getJobTitle(right));
    });
  }

  function renderRouteStartChooser(){
    const jobs = getRouteBuildJobOptions();
    els['detail-panel'].innerHTML = `
      <div class="suremap-detail-card suremap-route-editor">
        <div class="suremap-detail-title">
          <div>
            <div class="item-title">New Route</div>
            <div class="item-sub">Start from an existing field job or build a custom route.</div>
          </div>
        </div>
        <div class="suremap-route-form-grid">
          <div class="form-group full">
            <label class="form-label">Build Route From Job</label>
            <select class="form-input" id="route-build-job-select">
              <option value="">Select job...</option>
              ${jobs.map((job) => {
                const jobDate = getJobDate(job);
                const siteCount = getJobSiteIds(job).length;
                return `<option value="${esc(job.id)}">${esc(getJobTitle(job))} - ${esc(jobDate ? formatDate(jobDate) : 'Unscheduled')} - ${esc(siteCount)} site${siteCount === 1 ? '' : 's'}</option>`;
              }).join('')}
            </select>
          </div>
        </div>
        <div class="suremap-detail-actions">
          <button class="btn-save" type="button" data-action="route-choice-build-job" ${jobs.length ? '' : 'disabled'}>Build Route From Job</button>
          <button class="act-btn" type="button" data-action="route-choice-custom">Custom Route</button>
        </div>
        ${jobs.length ? '' : '<div class="empty-state">No open jobs with mapped sites are available for route building.</div>'}
      </div>
    `;
  }

  function buildRouteDraftFromSelectedJob(){
    const select = document.getElementById('route-build-job-select');
    buildRouteDraftFromJob(select?.value || '');
  }

  function buildRouteDraftFromJob(jobId){
    const job = getJobById(jobId);
    if(!job) return;
    const siteIds = getJobSiteIds(job).filter((siteId) => getViewSite(siteId));
    if(!siteIds.length){
      alert('This job does not have any mapped sites available for routing.');
      return;
    }
    const routeDate = getJobDate(job) || getRouteDateRange().start || todayISO();
    const route = createRouteDraft({
      routeName:`${getJobTitle(job)} Route`,
      routeDate,
      routeStatus:'Draft',
      assignedTechnicianId:getJobTechnicianId(job.id),
      originType:'spl',
      originLabel:HOME_BASE.name,
      originLatitude:HOME_BASE.lat,
      originLongitude:HOME_BASE.lng,
      destinationType:'spl',
      destinationLabel:HOME_BASE.name,
      destinationLatitude:HOME_BASE.lat,
      destinationLongitude:HOME_BASE.lng
    });
    route.stops = siteIds.map((siteId, index) => ({ id:uid('rstop'), routeId:'', siteId, stopType:'site', placeId:'', stopOrder:index, stopNotes:'', jobIds:[job.id] }));
    state.activeMode = 'routes';
    state.activeRouteId = 'draft';
    state.routeDraft = route;
    state.routeDirty = true;
    if(!isRouteInCurrentDateRange(route)) setRouteFilterToDate(routeDate);
    refreshFilteredView({ syncMap:true, preserveSelection:true, focusSelection:true });
  }

  function renderRouteLocationEditor(prefix, route, sites){
    const typeKey = `${prefix}Type`;
    const siteKey = `${prefix}SiteId`;
    const labelKey = `${prefix}Label`;
    const valueKey = `${prefix}Value`;
    const latKey = `${prefix}Latitude`;
    const lngKey = `${prefix}Longitude`;
    const type = route[typeKey] || 'spl';
    return `<div class="suremap-route-location">
      <div class="form-group"><label class="form-label">${esc(prefix)} Type</label><select class="form-input" data-route-location-field="${esc(typeKey)}">${ROUTE_LOCATION_TYPES.map((value) => `<option value="${esc(value)}" ${type === value ? 'selected' : ''}>${esc(ROUTE_LOCATION_LABELS[value])}</option>`).join('')}</select></div>
      ${type === 'site' ? `<div class="form-group"><label class="form-label">${esc(prefix)} Site</label><select class="form-input" data-route-location-field="${esc(siteKey)}"><option value="">Select site...</option>${sites.map((site) => `<option value="${esc(site.id)}" ${route[siteKey] === site.id ? 'selected' : ''}>${esc(site.name)} - ${esc(site.clientName)}</option>`).join('')}</select></div>` : ''}
      ${type === 'address' ? `<div class="form-group"><label class="form-label">${esc(prefix)} Address</label><input class="form-input" data-route-location-field="${esc(valueKey)}" value="${esc(route[valueKey])}" placeholder="Street, city, state"></div>` : ''}
      ${type === 'gps' ? `<div class="form-group"><label class="form-label">${esc(prefix)} GPS</label><input class="form-input" data-route-location-field="${esc(valueKey)}" value="${esc(route[valueKey])}" placeholder="40.123456, -80.123456"></div>` : ''}
      <div class="form-group"><label class="form-label">${esc(prefix)} Label</label><input class="form-input" data-route-location-field="${esc(labelKey)}" value="${esc(route[labelKey])}"></div>
      <input type="hidden" data-route-location-field="${esc(latKey)}" value="${esc(route[latKey] ?? '')}">
      <input type="hidden" data-route-location-field="${esc(lngKey)}" value="${esc(route[lngKey] ?? '')}">
    </div>`;
  }

  function renderRouteStopEditor(stop, index, route, context = {}){
    if(normalizeRouteStopType(stop.stopType) === 'place') return renderRoutePlaceStopEditor(stop, index, route);
    const site = getViewSite(stop.siteId);
    const jobs = getAvailableJobsForStop(stop, context);
    const selected = new Set(stop.jobIds || []);
    return `<div class="suremap-route-stop-card">
      <div class="suremap-route-stop-head">
        <div class="suremap-route-stop-number">${index + 1}</div>
        <div>
          <div class="item-title">${esc(site?.name || 'Unknown site')}</div>
          <div class="item-sub">${esc(site?.address || site?.coordsLabel || 'No location')}</div>
        </div>
        <div class="table-actions">
          <button class="act-btn" type="button" data-action="move-route-stop" data-stop-id="${esc(stop.id)}" data-delta="-1" ${index === 0 ? 'disabled' : ''}>Up</button>
          <button class="act-btn" type="button" data-action="move-route-stop" data-stop-id="${esc(stop.id)}" data-delta="1" ${index === route.stops.length - 1 ? 'disabled' : ''}>Down</button>
          <button class="act-btn danger" type="button" data-action="remove-route-stop" data-stop-id="${esc(stop.id)}">Remove</button>
        </div>
      </div>
      ${renderRouteStopLegMeta(stop, index, route)}
      <div class="suremap-route-job-options">
        ${jobs.length ? jobs.map((job) => `<label class="suremap-route-job-option"><input type="checkbox" data-route-job-toggle data-stop-id="${esc(stop.id)}" value="${esc(job.id)}" ${selected.has(job.id) ? 'checked' : ''}><span><strong>${esc(getJobTitle(job))}</strong><small>${esc(getJobDate(job) ? formatDate(getJobDate(job)) : 'Unscheduled')} | ${esc(job.priority)}</small></span></label>`).join('') : '<div class="empty-state">No open matching-site jobs are available for this stop.</div>'}
      </div>
    </div>`;
  }

  function renderRoutePlaceStopEditor(stop, index, route){
    const place = getRoutePlace(stop.placeId);
    const list = getRoutePlaceList(place?.listId);
    const point = getRouteStopPoint(stop);
    const meta = [list?.listName || 'Other destination', point?.value || stop.stopValue || 'No location'].filter(Boolean).join(' | ');
    return `<div class="suremap-route-stop-card suremap-route-place-stop">
      <div class="suremap-route-stop-head">
        <div class="suremap-route-stop-number suremap-route-place-stop-number" style="--place-color:${esc(normalizeHexColor(list?.listColor, '#6fe3ff'))}">${index + 1}</div>
        <div>
          <div class="item-title">${esc(getRoutePlaceName(place) || stop.stopLabel || 'Other destination')}</div>
          <div class="item-sub">${esc(meta)}</div>
        </div>
        <div class="table-actions">
          <button class="act-btn" type="button" data-action="move-route-stop" data-stop-id="${esc(stop.id)}" data-delta="-1" ${index === 0 ? 'disabled' : ''}>Up</button>
          <button class="act-btn" type="button" data-action="move-route-stop" data-stop-id="${esc(stop.id)}" data-delta="1" ${index === route.stops.length - 1 ? 'disabled' : ''}>Down</button>
          <button class="act-btn danger" type="button" data-action="remove-route-stop" data-stop-id="${esc(stop.id)}">Remove</button>
        </div>
      </div>
      ${renderRouteStopLegMeta(stop, index, route)}
      <div class="suremap-route-place-details">
        ${place?.phone ? `<span class="tag-chip">${esc(place.phone)}</span>` : ''}
        ${place?.websiteUrl ? `<a class="tag-chip" href="${esc(place.websiteUrl)}" target="_blank" rel="noopener">Website</a>` : ''}
        ${place?.notes || stop.stopNotes ? `<div class="item-sub">${esc(place?.notes || stop.stopNotes)}</div>` : ''}
      </div>
    </div>`;
  }

  function renderRouteTotals(route){
    const parts = [];
    if(route.distanceMeters) parts.push(`Distance ${formatDistance(route.distanceMeters)}`);
    if(route.durationSeconds) parts.push(`${isRouteRoundTrip(route) ? 'Total round trip' : 'Total route time'} ${formatDuration(route.durationSeconds)}`);
    if(route.returnDurationSeconds) parts.push(`${isRouteRoundTrip(route) ? 'Return to' : 'Final leg to'} ${getRouteEndpointLabel(route, 'destination')}: ${formatDuration(route.returnDurationSeconds)}`);
    const linkedJobs = route.stops.reduce((sum, stop) => sum + (stop.jobIds || []).length, 0);
    parts.push(`${route.stops.length} stop${route.stops.length === 1 ? '' : 's'}`);
    parts.push(`${linkedJobs} linked job${linkedJobs === 1 ? '' : 's'}`);
    return parts.map((part) => `<span class="tag-chip">${esc(part)}</span>`).join('');
  }

  function renderRouteStopLegMeta(stop, index, route){
    if(!stop?.legDurationSeconds) return '';
    const fromLabel = index === 0 ? getRouteEndpointLabel(route, 'origin') : `Stop ${index}`;
    const label = `From ${fromLabel}: ${formatDuration(stop.legDurationSeconds)}`;
    return `<div class="suremap-route-leg-meta"><span class="tag-chip">${esc(label)}</span></div>`;
  }

  function getRouteEndpointLabel(route, prefix){
    const point = getRouteLocationPoint(route, prefix);
    return String(point?.label || route?.[`${prefix}Label`] || ROUTE_LOCATION_LABELS[route?.[`${prefix}Type`]] || (prefix === 'origin' ? 'Origin' : 'Destination')).trim();
  }

  function isRouteRoundTrip(route){
    if(!route) return false;
    if(route.originType === 'spl' && route.destinationType === 'spl') return true;
    if(route.originType === 'site' && route.destinationType === 'site' && route.originSiteId && route.originSiteId === route.destinationSiteId) return true;
    if(hasUsableCoords(route.originLatitude, route.originLongitude) && hasUsableCoords(route.destinationLatitude, route.destinationLongitude)){
      return Math.abs(Number(route.originLatitude) - Number(route.destinationLatitude)) < .00001
        && Math.abs(Number(route.originLongitude) - Number(route.destinationLongitude)) < .00001;
    }
    const origin = getRouteDirectionsValue(getRouteLocationPoint(route, 'origin')).trim().toLowerCase();
    const destination = getRouteDirectionsValue(getRouteLocationPoint(route, 'destination')).trim().toLowerCase();
    return !!origin && origin === destination;
  }

  function formatDistance(meters){
    const miles = Number(meters || 0) / 1609.344;
    return `${miles.toFixed(miles >= 10 ? 0 : 1)} mi`;
  }

  function formatDuration(seconds){
    const minutes = Math.round(Number(seconds || 0) / 60);
    if(minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
  }

  function setRouteDraftField(field, value){
    const route = getCurrentRouteDraft();
    if(!route) return;
    if(field === 'routeDate') route.routeDate = toInputDate(value) || todayISO();
    else if(field === 'routeStatus') route.routeStatus = normalizeOption(value, ROUTE_STATUS_OPTIONS, 'Draft');
    else if(field === 'assignedTechnicianId') route.assignedTechnicianId = String(value || '');
    else route[field] = String(value || '');
    state.routeDirty = true;
    renderMapSummary();
  }

  function setRouteLocationField(field, value){
    const route = getCurrentRouteDraft();
    if(!route) return;
    const prefix = field.startsWith('origin') ? 'origin' : 'destination';
    route[field] = ['originLatitude', 'originLongitude', 'destinationLatitude', 'destinationLongitude'].includes(field) ? normalizeNumber(value) : String(value || '');
    if(!field.endsWith('Label')) clearRouteTiming(route);
    if(field.endsWith('Type')){
      route[field] = normalizeRouteLocationType(value);
      applyRouteLocationDefaults(route, prefix);
      renderRouteEditor();
    } else if(field.endsWith('SiteId')){
      applyRouteSiteLocation(route, prefix, value);
      renderRouteEditor();
    } else if(field.endsWith('Value') && route[`${prefix}Type`] === 'gps'){
      const coords = parseGps(value);
      route[`${prefix}Latitude`] = coords?.lat ?? null;
      route[`${prefix}Longitude`] = coords?.lng ?? null;
      if(coords && !route[`${prefix}Label`]) route[`${prefix}Label`] = formatGps(coords.lat, coords.lng);
    }
    state.routeDirty = true;
    syncMarkers();
  }

  function applyRouteLocationDefaults(route, prefix){
    const type = route[`${prefix}Type`];
    if(type === 'spl'){
      route[`${prefix}SiteId`] = '';
      route[`${prefix}Label`] = HOME_BASE.name;
      route[`${prefix}Value`] = formatAddress(HOME_BASE.street, HOME_BASE.city, HOME_BASE.state, HOME_BASE.zip);
      route[`${prefix}Latitude`] = HOME_BASE.lat;
      route[`${prefix}Longitude`] = HOME_BASE.lng;
      return;
    }
    if(type === 'site'){
      applyRouteSiteLocation(route, prefix, route[`${prefix}SiteId`]);
      return;
    }
    route[`${prefix}SiteId`] = '';
    route[`${prefix}Latitude`] = null;
    route[`${prefix}Longitude`] = null;
    if(!route[`${prefix}Label`] || route[`${prefix}Label`] === HOME_BASE.name) route[`${prefix}Label`] = ROUTE_LOCATION_LABELS[type];
  }

  function applyRouteSiteLocation(route, prefix, siteId){
    const site = getViewSite(String(siteId || ''));
    route[`${prefix}SiteId`] = site?.id || '';
    route[`${prefix}Label`] = site?.name || ROUTE_LOCATION_LABELS.site;
    route[`${prefix}Value`] = site?.address || site?.coordsLabel || '';
    route[`${prefix}Latitude`] = site?.lat ?? null;
    route[`${prefix}Longitude`] = site?.lng ?? null;
  }

  function ensureRouteAddStopModal(){
    if(document.getElementById('route-add-stop-modal-overlay')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal-overlay site-editor-overlay" id="route-add-stop-modal-overlay">
        <div class="modal suremap-modal-card route-add-stop-modal-card">
          <div class="modal-header">
            <h3>Add Stop</h3>
            <button class="modal-close" type="button" data-route-add-stop-close>X</button>
          </div>
          <div class="modal-body">
            <div class="suremap-add-stop-modal-grid">
              <div>
                <div class="form-label">Site Lists</div>
                <div class="suremap-add-stop-list-options" id="route-add-stop-list-options"></div>
              </div>
              <div>
                <div class="form-label">Sites</div>
                <div class="suremap-add-stop-site-options" id="route-add-stop-site-options"></div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" type="button" data-route-add-stop-close>Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.append(...Array.from(wrapper.children));
    document.querySelectorAll('[data-route-add-stop-close]').forEach((button) => button.addEventListener('click', () => closeModal('route-add-stop-modal-overlay')));
    document.getElementById('route-add-stop-modal-overlay').addEventListener('click', (event) => {
      if(event.target.id === 'route-add-stop-modal-overlay') closeModal('route-add-stop-modal-overlay');
      const listOption = event.target.closest('[data-route-add-stop-list-key]');
      if(listOption){
        state.routeAddStopListKey = listOption.dataset.routeAddStopListKey || '';
        renderRouteAddStopModal();
        return;
      }
      const siteOption = event.target.closest('[data-route-add-stop-site-id]');
      if(siteOption){
        addRouteSiteStop(siteOption.dataset.routeAddStopSiteId);
        closeModal('route-add-stop-modal-overlay');
        return;
      }
      const placeOption = event.target.closest('[data-route-add-stop-place-id]');
      if(placeOption){
        addRoutePlaceStop(placeOption.dataset.routeAddStopPlaceId);
        closeModal('route-add-stop-modal-overlay');
      }
    });
  }

  function openRouteAddStopModal(){
    ensureRouteAddStopModal();
    const lists = getAvailableRouteStopLists();
    if(!lists.length){
      alert('No available sites remain to add to this route.');
      return;
    }
    if(!lists.some((option) => option.key === state.routeAddStopListKey)) state.routeAddStopListKey = lists[0].key;
    renderRouteAddStopModal();
    openModal('route-add-stop-modal-overlay');
  }

  function getAvailableRouteStopLists(){
    const route = getCurrentRouteDraft();
    if(!route) return [];
    return getAllSiteListOptions().map((option) => ({
      ...option,
      availableStops:getAvailableRouteStopsForList(option.key, route)
    })).filter((option) => option.availableStops.length);
  }

  function getAvailableRouteStopsForList(listKey, route = getCurrentRouteDraft()){
    const parsed = parseSiteListKey(listKey);
    if(!route) return [];
    if(parsed.type === 'place-list'){
      const usedPlaceIds = new Set(route.stops.filter((stop) => normalizeRouteStopType(stop.stopType) === 'place').map((stop) => stop.placeId));
      return getRoutePlacesForList(parsed.id)
        .filter((place) => !usedPlaceIds.has(place.id))
        .map((place) => ({ type:'place', id:place.id, label:getRoutePlaceName(place), meta:place.addressValue || 'No location', place }));
    }
    const client = state.viewIndexes.clientsById.get(parsed.id);
    if(!client) return [];
    const usedSiteIds = new Set(route.stops.filter((stop) => normalizeRouteStopType(stop.stopType) === 'site').map((stop) => stop.siteId));
    return (client.sublocations || [])
      .filter((site) => !usedSiteIds.has(site.id))
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((site) => ({ type:'site', id:site.id, label:site.name, meta:site.address || site.coordsLabel || 'No location', site }));
  }

  function renderRouteAddStopModal(){
    const listContainer = document.getElementById('route-add-stop-list-options');
    const siteContainer = document.getElementById('route-add-stop-site-options');
    if(!listContainer || !siteContainer) return;
    const lists = getAvailableRouteStopLists();
    if(!lists.some((option) => option.key === state.routeAddStopListKey)) state.routeAddStopListKey = lists[0]?.key || '';
    listContainer.innerHTML = renderRouteAddStopListSections(lists);
    const active = lists.find((option) => option.key === state.routeAddStopListKey);
    siteContainer.innerHTML = active
      ? active.availableStops.map((stop) => renderRouteAddStopSiteOption(stop, active)).join('')
      : '<div class="empty-state">Select a Site List.</div>';
  }

  function renderRouteAddStopListSections(lists){
    const sections = [
      { title:'Clients', items:lists.filter((option) => option.type === 'client') },
      { title:'Other Sites', items:lists.filter((option) => option.type === 'place-list') }
    ].filter((section) => section.items.length);
    if(!sections.length) return '<div class="empty-state">No available Site Lists.</div>';
    return sections.map((section) => `
      <div class="site-list-picker-section">
        <div class="site-list-picker-heading">${esc(section.title)}</div>
        ${section.items.map((option) => `<button type="button" class="client-picker-option site-list-picker-option ${option.key === state.routeAddStopListKey ? 'active' : ''}" data-route-add-stop-list-key="${esc(option.key)}"><strong>${esc(option.label)}</strong><span>${esc(option.availableStops.length)} available stop${option.availableStops.length === 1 ? '' : 's'}</span></button>`).join('')}
      </div>
    `).join('');
  }

  function renderRouteAddStopSiteOption(stop, listOption){
    const dataAttr = stop.type === 'place' ? `data-route-add-stop-place-id="${esc(stop.id)}"` : `data-route-add-stop-site-id="${esc(stop.id)}"`;
    return `<button type="button" class="suremap-add-stop-site-option" ${dataAttr}>
      <span class="suremap-add-stop-site-token" style="background:${esc(listOption.color)}22;color:${esc(listOption.color)}">${esc(stop.type === 'place' ? getRoutePlaceIconToken(listOption.list?.iconKey) : getSiteIconToken(stop.site?.type))}</span>
      <span><strong>${esc(stop.label || 'Unnamed site')}</strong><small>${esc(stop.meta || 'No location')}</small></span>
    </button>`;
  }

  function addRouteSiteStop(siteId){
    const route = getCurrentRouteDraft();
    const normalizedSiteId = String(siteId || '');
    if(!route || !normalizedSiteId) return;
    if(route.stops.some((stop) => normalizeRouteStopType(stop.stopType) === 'site' && stop.siteId === normalizedSiteId)) return;
    route.stops.push({ id:uid('rstop'), routeId:route.id || '', siteId:normalizedSiteId, stopType:'site', placeId:'', stopOrder:route.stops.length, stopNotes:'', jobIds:[] });
    clearRouteTiming(route);
    state.routeDirty = true;
    renderRouteEditor();
    syncMarkers();
  }


  function addRoutePlaceStop(placeId){
    const route = getCurrentRouteDraft();
    const place = getRoutePlace(placeId);
    if(!route || !place) return;
    const stop = normalizeRouteStop({
      id:uid('rstop'),
      routeId:route.id || '',
      siteId:'',
      stopType:'place',
      placeId:place.id,
      stopOrder:route.stops.length,
      stopNotes:'',
      jobIds:[]
    });
    const snapshot = buildRouteStopSnapshot(stop);
    route.stops.push({ ...stop, stopLabel:snapshot.label, stopValue:snapshot.value, stopLatitude:snapshot.lat, stopLongitude:snapshot.lng, jobIds:[] });
    clearRouteTiming(route);
    state.routeDirty = true;
    renderRouteEditor();
    syncMarkers();
  }

  function moveRouteStop(stopId, delta){
    const route = getCurrentRouteDraft();
    if(!route || !delta) return;
    const index = route.stops.findIndex((stop) => stop.id === stopId);
    const nextIndex = index + delta;
    if(index < 0 || nextIndex < 0 || nextIndex >= route.stops.length) return;
    const [stop] = route.stops.splice(index, 1);
    route.stops.splice(nextIndex, 0, stop);
    route.stops.forEach((row, idx) => { row.stopOrder = idx; });
    clearRouteTiming(route);
    state.routeDirty = true;
    renderRouteEditor();
    syncMarkers();
  }

  function removeRouteStop(stopId){
    const route = getCurrentRouteDraft();
    if(!route) return;
    route.stops = route.stops.filter((stop) => stop.id !== stopId);
    route.stops.forEach((row, idx) => { row.stopOrder = idx; });
    clearRouteTiming(route);
    state.routeDirty = true;
    renderRouteEditor();
    syncMarkers();
  }

  function toggleRouteStopJob(stopId, jobId, checked){
    const route = getCurrentRouteDraft();
    const stop = route?.stops.find((row) => row.id === stopId);
    if(!stop) return;
    const current = new Set(stop.jobIds || []);
    if(checked) current.add(jobId);
    else current.delete(jobId);
    stop.jobIds = Array.from(current);
    state.routeDirty = true;
    const summary = document.getElementById('route-summary');
    if(summary) summary.innerHTML = renderRouteTotals(route);
  }

  function validateRouteDraft(route){
    if(!route.routeDate) throw new Error('Route date is required.');
    if(!route.routeName) route.routeName = getRouteName(route);
    route.stops.forEach((stop, index) => {
      stop.stopType = normalizeRouteStopType(stop.stopType);
      if(stop.stopType === 'site' && !stop.siteId) throw new Error('Each mapped-site stop must have a site.');
      if(stop.stopType === 'place' && !stop.placeId) throw new Error('Each other-destination stop must have a saved destination.');
      stop.stopOrder = index;
    });
  }

  async function saveCurrentRoute(options = {}){
    const route = getCurrentRouteDraft();
    if(!route) return;
    try {
      validateRouteDraft(route);
      if(options.assign){
        if(!route.assignedTechnicianId) throw new Error('Select a technician before saving and assigning the route.');
        if(!getRouteLinkedJobIds(route).length) throw new Error('Link at least one open job to a route stop before saving and assigning.');
        if(!confirmRouteAssignment(route)) return;
        route.routeStatus = 'Assigned';
      } else if(options.draft){
        route.routeStatus = 'Draft';
      }
      showSaveStatus('saving', options.assign ? 'SAVING AND ASSIGNING' : 'SAVING DRAFT');
      const routeId = isRemoteMode() ? await saveRemoteRoute(route) : saveLocalRoute(route);
      if(!isRouteInCurrentDateRange(route)) setRouteFilterToDate(route.routeDate);
      if(options.assign){
        const jobIds = getRouteLinkedJobIds(route);
        const defaultTruck = getTechnicianDefaultTruck(route.assignedTechnicianId);
        if(isRemoteMode()) await assignRemoteRouteJobs(jobIds, route.assignedTechnicianId, defaultTruck?.id || '');
        else assignLocalRouteJobs(jobIds, route.assignedTechnicianId, defaultTruck?.id || '');
      }
      await loadData({ preserveSelection:true, focusSelection:false });
      selectRoute(routeId, { focusMap:true });
      showSaveStatus('saved', options.assign ? 'ROUTE ASSIGNED' : 'DRAFT SAVED');
    } catch (error){
      console.error('Unable to save route:', error);
      showSaveStatus('error', 'ROUTE SAVE FAILED');
      alert(error.message || 'Unable to save the route.');
    }
  }

  function getRoutePayload(route){
    return {
      route_name: route.routeName || getRouteName(route),
      route_date: route.routeDate,
      route_status: route.routeStatus || 'Draft',
      assigned_technician_id: route.assignedTechnicianId || null,
      origin_type: route.originType || 'spl',
      origin_site_id: route.originSiteId || null,
      origin_label: route.originLabel || '',
      origin_value: route.originValue || '',
      origin_latitude: route.originLatitude,
      origin_longitude: route.originLongitude,
      destination_type: route.destinationType || 'spl',
      destination_site_id: route.destinationSiteId || null,
      destination_label: route.destinationLabel || '',
      destination_value: route.destinationValue || '',
      destination_latitude: route.destinationLatitude,
      destination_longitude: route.destinationLongitude,
      distance_meters: route.distanceMeters === null || route.distanceMeters === undefined ? null : Math.round(Number(route.distanceMeters)),
      duration_seconds: route.durationSeconds === null || route.durationSeconds === undefined ? null : Math.round(Number(route.durationSeconds)),
      return_distance_meters: route.returnDistanceMeters === null || route.returnDistanceMeters === undefined ? null : Math.round(Number(route.returnDistanceMeters)),
      return_duration_seconds: route.returnDurationSeconds === null || route.returnDurationSeconds === undefined ? null : Math.round(Number(route.returnDurationSeconds)),
      notes: route.notes || ''
    };
  }

  async function saveRemoteRoute(route){
    const url = route.id ? `/rest/v1/field_routes?id=eq.${encodeURIComponent(route.id)}&select=*` : '/rest/v1/field_routes?select=*';
    const saved = await window.appAuth.requestJson(url, {
      method: route.id ? 'PATCH' : 'POST',
      headers:{ 'Content-Type':'application/json', Prefer:'return=representation' },
      body:JSON.stringify(getRoutePayload(route))
    });
    const routeId = String((Array.isArray(saved) ? saved[0] : saved)?.id || route.id);
    await window.appAuth.requestJson(`/rest/v1/field_route_stops?route_id=eq.${encodeURIComponent(routeId)}`, { method:'DELETE' });
    for(const [index, stop] of route.stops.entries()){
      const savedStop = await window.appAuth.requestJson('/rest/v1/field_route_stops?select=*', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Prefer:'return=representation' },
        body:JSON.stringify(getRouteStopPayload(stop, routeId, index))
      });
      const routeStopId = String((Array.isArray(savedStop) ? savedStop[0] : savedStop)?.id || '');
      const rows = normalizeRouteStopType(stop.stopType) === 'site' ? normalizeStringArray(stop.jobIds).map((jobId) => ({ route_stop_id:routeStopId, job_id:jobId })) : [];
      if(rows.length){
        await window.appAuth.requestJson('/rest/v1/field_route_stop_jobs', {
          method:'POST',
          headers:{ 'Content-Type':'application/json', Prefer:'return=minimal' },
          body:JSON.stringify(rows)
        });
      }
    }
    await saveRemoteJobSiteOrdersFromRoute(route);
    return routeId;
  }

  function saveLocalRoute(route){
    const raw = readLocalRaw();
    raw.fieldRoutes = Array.isArray(raw.fieldRoutes) ? raw.fieldRoutes.map(normalizeRoute) : [];
    raw.fieldRouteStops = Array.isArray(raw.fieldRouteStops) ? raw.fieldRouteStops.map(normalizeRouteStop) : [];
    raw.fieldRouteStopJobs = Array.isArray(raw.fieldRouteStopJobs) ? raw.fieldRouteStopJobs.map(normalizeRouteStopJob) : [];
    const routeId = route.id || uid('route');
    const savedRoute = normalizeRoute({ ...route, id:routeId });
    const routeIndex = raw.fieldRoutes.findIndex((row) => row.id === routeId);
    if(routeIndex >= 0) raw.fieldRoutes[routeIndex] = savedRoute;
    else raw.fieldRoutes.push(savedRoute);
    const previousStopIds = new Set(raw.fieldRouteStops.filter((stop) => stop.routeId === routeId).map((stop) => stop.id));
    raw.fieldRouteStops = raw.fieldRouteStops.filter((stop) => stop.routeId !== routeId);
    raw.fieldRouteStopJobs = raw.fieldRouteStopJobs.filter((link) => !previousStopIds.has(link.routeStopId));
    route.stops.forEach((stop, index) => {
      const stopId = stop.id || uid('rstop');
      raw.fieldRouteStops.push(normalizeRouteStop({ ...stop, id:stopId, routeId, stopOrder:index }));
      if(normalizeRouteStopType(stop.stopType) !== 'site') return;
      normalizeStringArray(stop.jobIds).forEach((jobId) => {
        raw.fieldRouteStopJobs.push(normalizeRouteStopJob({ id:`${stopId}::${jobId}`, routeStopId:stopId, jobId }));
      });
    });
    applyLocalJobSiteOrdersFromRoute(raw, route);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    return routeId;
  }

  function getRouteStopPayload(stop, routeId, index){
    const snapshot = buildRouteStopSnapshot(stop);
    const stopType = normalizeRouteStopType(stop?.stopType);
    return {
      route_id:routeId,
      site_id:stopType === 'site' ? stop.siteId || null : null,
      stop_type:stopType,
      place_id:stopType === 'place' ? stop.placeId || null : null,
      stop_label:snapshot.label || '',
      stop_value:snapshot.value || '',
      stop_latitude:snapshot.lat,
      stop_longitude:snapshot.lng,
      stop_order:index,
      leg_distance_meters:stop.legDistanceMeters === null || stop.legDistanceMeters === undefined ? null : Math.round(Number(stop.legDistanceMeters)),
      leg_duration_seconds:stop.legDurationSeconds === null || stop.legDurationSeconds === undefined ? null : Math.round(Number(stop.legDurationSeconds)),
      stop_notes:stop.stopNotes || ''
    };
  }

  function buildRouteStopSnapshot(stop){
    const point = getRouteStopPoint(stop);
    return {
      label:point?.label || stop?.stopLabel || '',
      value:point?.value || stop?.stopValue || '',
      lat:hasUsableCoords(point?.lat, point?.lng) ? point.lat : null,
      lng:hasUsableCoords(point?.lat, point?.lng) ? point.lng : null
    };
  }

  function getJobSiteOrdersFromRoute(route){
    const orders = new Map();
    (route?.stops || []).forEach((stop) => {
      if(normalizeRouteStopType(stop.stopType) !== 'site') return;
      normalizeStringArray(stop.jobIds).forEach((jobId) => {
        const job = getJobById(jobId);
        if(!job || !getJobSiteIds(job).includes(stop.siteId)) return;
        const list = orders.get(jobId) || [];
        if(!list.includes(stop.siteId)) list.push(stop.siteId);
        orders.set(jobId, list);
      });
    });
    orders.forEach((siteIds, jobId) => {
      getJobSiteIds(getJobById(jobId)).forEach((siteId) => {
        if(!siteIds.includes(siteId)) siteIds.push(siteId);
      });
    });
    return orders;
  }

  function applyLocalJobSiteOrdersFromRoute(raw, route){
    const orders = getJobSiteOrdersFromRoute(route);
    if(!orders.size) return;
    const orderedJobIds = new Set(orders.keys());
    raw.jobs = Array.isArray(raw.jobs) ? raw.jobs : [];
    raw.jobSites = Array.isArray(raw.jobSites) ? raw.jobSites.map(normalizeJobSite) : [];
    raw.jobSites = raw.jobSites.filter((link) => !orderedJobIds.has(link.jobId));
    orders.forEach((siteIds, jobId) => {
      siteIds.forEach((siteId, index) => raw.jobSites.push(normalizeJobSite({ id:`${jobId}::${siteId}`, jobId, siteId, sortOrder:index })));
      const job = raw.jobs.find((row) => String(row.id || '') === jobId);
      if(job){
        job.siteId = siteIds[0] || job.siteId || '';
        job.siteIds = siteIds;
      }
    });
    raw.jobSites.sort(sortByJobSite);
  }

  async function saveRemoteJobSiteOrdersFromRoute(route){
    const orders = getJobSiteOrdersFromRoute(route);
    for(const [jobId, siteIds] of orders.entries()){
      if(!siteIds.length) continue;
      await window.appAuth.requestJson(`/rest/v1/field_jobs?id=eq.${encodeURIComponent(jobId)}`, {
        method:'PATCH',
        headers:{ 'Content-Type':'application/json', Prefer:'return=minimal' },
        body:JSON.stringify({ site_id:siteIds[0] })
      });
      await window.appAuth.requestJson(`/rest/v1/field_job_sites?job_id=eq.${encodeURIComponent(jobId)}`, { method:'DELETE' });
      await window.appAuth.requestJson('/rest/v1/field_job_sites', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Prefer:'return=minimal' },
        body:JSON.stringify(siteIds.map((siteId, index) => ({ job_id:jobId, site_id:siteId, sort_order:index })))
      });
    }
  }

  async function deleteCurrentRoute(){
    const route = getCurrentRouteDraft();
    if(!route?.id) return;
    if(!confirm('Delete this route? Linked jobs will remain in Field Ops.')) return;
    showSaveStatus('saving', 'DELETING');
    try {
      if(isRemoteMode()){
        await window.appAuth.requestJson(`/rest/v1/field_routes?id=eq.${encodeURIComponent(route.id)}`, { method:'DELETE' });
      } else {
        const raw = readLocalRaw();
        const stopIds = new Set((raw.fieldRouteStops || []).filter((stop) => stop.routeId === route.id).map((stop) => stop.id));
        raw.fieldRoutes = (raw.fieldRoutes || []).filter((row) => row.id !== route.id);
        raw.fieldRouteStops = (raw.fieldRouteStops || []).filter((stop) => stop.routeId !== route.id);
        raw.fieldRouteStopJobs = (raw.fieldRouteStopJobs || []).filter((link) => !stopIds.has(link.routeStopId));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
      }
      state.activeRouteId = '';
      state.routeDraft = null;
      state.routeDirty = false;
      await loadData({ preserveSelection:false, focusSelection:false });
      showSaveStatus('saved', 'ROUTE DELETED');
    } catch (error){
      console.error('Unable to delete route:', error);
      showSaveStatus('error', 'DELETE FAILED');
      alert(error.message || 'Unable to delete the route.');
    }
  }

  function getRouteLocationPoint(route, prefix){
    const type = route?.[`${prefix}Type`] || 'spl';
    if(type === 'spl') return { lat:HOME_BASE.lat, lng:HOME_BASE.lng, label:HOME_BASE.name, value:formatAddress(HOME_BASE.street, HOME_BASE.city, HOME_BASE.state, HOME_BASE.zip) };
    if(type === 'site'){
      const site = getViewSite(route[`${prefix}SiteId`]);
      if(site && hasUsableCoords(site.lat, site.lng)) return { lat:site.lat, lng:site.lng, label:site.name, value:site.address || site.coordsLabel };
      if(site?.address) return { address:site.address, label:site.name, value:site.address };
    }
    const lat = normalizeNumber(route?.[`${prefix}Latitude`]);
    const lng = normalizeNumber(route?.[`${prefix}Longitude`]);
    if(hasUsableCoords(lat, lng)) return { lat, lng, label:route[`${prefix}Label`] || ROUTE_LOCATION_LABELS[type], value:route[`${prefix}Value`] || formatGps(lat, lng) };
    if(type === 'gps'){
      const coords = parseGps(route?.[`${prefix}Value`]);
      if(coords) return { lat:coords.lat, lng:coords.lng, label:route[`${prefix}Label`] || formatGps(coords.lat, coords.lng), value:route[`${prefix}Value`] };
    }
    if(type === 'address' && route?.[`${prefix}Value`]) return { address:route[`${prefix}Value`], label:route[`${prefix}Label`] || route[`${prefix}Value`], value:route[`${prefix}Value`] };
    return null;
  }

  function getRouteStopPoints(route){
    return (route?.stops || []).map((stop, index) => {
      const point = getRouteStopPoint(stop);
      if(!point) return null;
      return { ...point, stop, index };
    }).filter(Boolean);
  }

  function getRouteStopPoint(stop){
    const stopType = normalizeRouteStopType(stop?.stopType);
    if(stopType === 'place'){
      const place = getRoutePlace(stop?.placeId);
      const list = getRoutePlaceList(place?.listId);
      const lat = normalizeNumber(place?.latitude ?? stop?.stopLatitude);
      const lng = normalizeNumber(place?.longitude ?? stop?.stopLongitude);
      const label = place?.placeName || stop?.stopLabel || 'Other destination';
      const value = place?.addressValue || stop?.stopValue || (hasUsableCoords(lat, lng) ? formatGps(lat, lng) : '');
      const base = { lat, lng, address:place?.locationType === 'address' ? value : '', label, value, list, place, stopType:'place' };
      if(hasUsableCoords(lat, lng)) return base;
      if(value && (place?.locationType || 'address') === 'address') return { ...base, address:value };
      return null;
    }
    const site = getViewSite(stop?.siteId);
    if(site && hasUsableCoords(site.lat, site.lng)) return { ...site, lat:site.lat, lng:site.lng, label:site.name, value:site.address || site.coordsLabel, stopType:'site' };
    if(site?.address) return { ...site, address:site.address, label:site.name, value:site.address, stopType:'site' };
    return null;
  }

  function getRouteDirectionsValue(point){
    if(!point) return '';
    if(point.address) return point.address;
    if(point.value) return point.value;
    if(hasUsableCoords(point.lat, point.lng)) return formatGps(point.lat, point.lng);
    return '';
  }

  function getRouteStopDirectionsValue(stop){
    return getRouteDirectionsValue(getRouteStopPoint(stop));
  }

  function getRouteDirectionsParts(route){
    const origin = getRouteDirectionsValue(getRouteLocationPoint(route, 'origin'));
    const destination = getRouteDirectionsValue(getRouteLocationPoint(route, 'destination'));
    const waypoints = (route?.stops || []).map(getRouteStopDirectionsValue).filter(Boolean);
    return { origin, destination, waypoints };
  }

  function canOpenRouteDirections(route){
    const parts = getRouteDirectionsParts(route);
    return !!(parts.origin && parts.destination && (route?.stops || []).length && parts.waypoints.length === (route?.stops || []).length);
  }

  function openRouteDirections(){
    const route = getCurrentRouteDraft();
    if(!canOpenRouteDirections(route)){
      alert('Add route stops with addresses or GPS coordinates before opening directions.');
      return;
    }
    const { origin, destination, waypoints } = getRouteDirectionsParts(route);
    const params = new URLSearchParams({
      api: '1',
      origin,
      destination,
      travelmode: 'driving'
    });
    if(waypoints.length) params.set('waypoints', waypoints.join('|'));
    window.open(`https://www.google.com/maps/dir/?${params.toString()}`, '_blank');
  }

  function clearRouteOverlay(){
    state.routeRenderToken += 1;
    state.routeMarkerCache.forEach((marker) => removeMapMarker(marker));
    state.routeMarkerCache.clear();
    if(state.routePolyline){
      if(state.mapProvider === 'google') state.routePolyline.setMap(null);
      else state.map.removeLayer(state.routePolyline);
      state.routePolyline = null;
    }
    if(state.googleDirectionsRenderer){
      state.googleDirectionsRenderer.set('directions', null);
      state.googleDirectionsRenderer.setMap(null);
      if(state.activeMode === 'routes') state.googleDirectionsRenderer.setMap(state.map);
    }
  }

  function syncRouteMarkers(options = {}){
    state.markerCache.forEach((marker) => removeMapMarker(marker));
    state.markerCache.clear();
    clearRouteOverlay();
    const route = getCurrentRouteDraft();
    if(!route || !state.map) return;
    ensureHomeMarker();
    const points = [];
    const origin = getRouteLocationPoint(route, 'origin');
    const destination = getRouteLocationPoint(route, 'destination');
    if(hasUsableCoords(origin?.lat, origin?.lng)) points.push({ ...origin, key:'origin', token:'A' });
    getRouteStopPoints(route).forEach((point, index) => points.push({ ...point, key:`stop:${point.stop.id}`, token:String(index + 1) }));
    if(hasUsableCoords(destination?.lat, destination?.lng)) points.push({ ...destination, key:'destination', token:'B' });
    points.forEach((point) => {
      const icon = point.stopType === 'place' ? makeRoutePlaceIcon(point.token, point.list) : makeRouteIcon(point.token);
      const subtitle = point.stopType === 'place' && point.list?.listName ? `${point.list.listName} | ${point.value || ''}` : point.value || '';
      upsertRouteMarker(point.key, [point.lat, point.lng], icon, buildPopup(point.label, subtitle), () => {});
    });
    if(points.length > 1) fitRoutePoints(points);
    if(options.renderRoadRoute !== false && tryRenderGoogleRoadRoute(route, points)) return;
    if(options.renderManualRouteLine !== false) drawRouteLine(points);
  }

  function upsertRouteMarker(key, latLng, icon, popupHtml, onClick){
    if(state.mapProvider === 'google'){
      const marker = new google.maps.Marker({ map:state.map, position:{ lat:Number(latLng[0]), lng:Number(latLng[1]) }, icon });
      marker.__popupHtml = popupHtml;
      marker.addListener('click', () => openMapPopup(marker));
      state.routeMarkerCache.set(key, marker);
      return;
    }
    const marker = L.marker(latLng, { icon }).bindPopup(popupHtml, { autoPan:false }).addTo(state.map);
    marker.on('click', onClick);
    state.routeMarkerCache.set(key, marker);
  }

  function makeRouteIcon(token){
    const label = String(token || '').slice(0, 2);
    const cacheKey = `${state.mapProvider}:${label}`;
    const cached = state.routeIconCache.get(cacheKey);
    if(cached) return cached;
    const svg = `<svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.7 0 0 6.7 0 15c0 11.2 15 23 15 23s15-11.8 15-23C30 6.7 23.3 0 15 0Z" fill="#ffd166"/><circle cx="15" cy="15" r="10" fill="#071009"/><text x="15" y="19" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#ffd166">${esc(label)}</text></svg>`;
    const icon = state.mapProvider === 'google'
      ? { url:svgToDataUri(svg), scaledSize:new google.maps.Size(30, 38), anchor:new google.maps.Point(15, 38) }
      : L.divIcon({ className:'', iconSize:[30, 38], iconAnchor:[15, 38], popupAnchor:[0, -34], html:svg });
    state.routeIconCache.set(cacheKey, icon);
    return icon;
  }

  function makeRoutePlaceIcon(token, list){
    const label = String(token || '').slice(0, 2);
    const color = normalizeHexColor(list?.listColor, '#6fe3ff');
    const iconKey = String(list?.iconKey || 'pin').trim() || 'pin';
    const cacheKey = `${state.mapProvider}:place:${label}:${color}:${iconKey}`;
    const cached = state.routeIconCache.get(cacheKey);
    if(cached) return cached;
    const glyph = getRoutePlaceGlyph(iconKey);
    const svg = `<svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="30" height="30" rx="8" fill="${esc(color)}"/><rect x="7" y="7" width="20" height="20" rx="5" fill="#071009"/><text x="17" y="16" text-anchor="middle" font-family="Arial" font-size="9" font-weight="700" fill="${esc(color)}">${esc(glyph)}</text><text x="17" y="25" text-anchor="middle" font-family="Arial" font-size="8" font-weight="700" fill="${esc(color)}">${esc(label)}</text></svg>`;
    const icon = state.mapProvider === 'google'
      ? { url:svgToDataUri(svg), scaledSize:new google.maps.Size(34, 34), anchor:new google.maps.Point(17, 17) }
      : L.divIcon({ className:'', iconSize:[34, 34], iconAnchor:[17, 17], popupAnchor:[0, -17], html:svg });
    state.routeIconCache.set(cacheKey, icon);
    return icon;
  }

  function getRoutePlaceGlyph(iconKey){
    switch(String(iconKey || '').trim()){
      case 'store': return 'ST';
      case 'wrench': return 'FX';
      case 'fuel': return 'FU';
      case 'warehouse': return 'WH';
      default: return 'PX';
    }
  }

  function drawRouteLine(points){
    const coords = points.filter((point) => hasUsableCoords(point.lat, point.lng)).map((point) => [point.lat, point.lng]);
    if(coords.length < 2) return;
    if(state.mapProvider === 'google'){
      state.routePolyline = new google.maps.Polyline({
        path: coords.map(([lat, lng]) => ({ lat, lng })),
        geodesic: true,
        strokeColor: '#ffd166',
        strokeOpacity: .84,
        strokeWeight: 4,
        map: state.map
      });
      return;
    }
    state.routePolyline = L.polyline(coords, { color:'#d69a2d', weight:4, opacity:.85 }).addTo(state.map);
  }

  function makeGoogleRouteLocation(point){
    if(point?.address) return point.address;
    if(hasUsableCoords(point?.lat, point?.lng)) return { lat:point.lat, lng:point.lng };
    return null;
  }

  function getRouteDirectionsPayload(route, optimizeWaypoints = false){
    const origin = getRouteLocationPoint(route, 'origin');
    const destination = getRouteLocationPoint(route, 'destination');
    const stops = getRouteStopPoints(route);
    if(!origin || !destination || stops.length !== (route?.stops || []).length) return null;
    if(stops.length > 25) return null;
    const originLocation = makeGoogleRouteLocation(origin);
    const destinationLocation = makeGoogleRouteLocation(destination);
    const waypointLocations = stops.map(makeGoogleRouteLocation);
    if(!originLocation || !destinationLocation || waypointLocations.some((location) => !location)) return null;
    return {
      origin: originLocation,
      destination: destinationLocation,
      waypoints: waypointLocations.map((location) => ({ location, stopover:true })),
      optimizeWaypoints,
      travelMode: google.maps.TravelMode.DRIVING
    };
  }

  async function requestGoogleRouteDirections(route, optimizeWaypoints = false){
    const payload = getRouteDirectionsPayload(route, optimizeWaypoints);
    if(!payload) throw new Error('All route stops and custom origin/destination must have coordinates or a routable address.');
    return new Promise((resolve, reject) => {
      state.googleDirectionsService.route(payload, (response, status) => {
        if(status === 'OK') resolve(response);
        else reject(new Error(`Google Directions returned ${status}.`));
      });
    });
  }

  function summarizeDirectionsResult(route, result){
    const legs = result.routes?.[0]?.legs || [];
    route.distanceMeters = legs.reduce((sum, leg) => sum + Number(leg.distance?.value || 0), 0);
    route.durationSeconds = legs.reduce((sum, leg) => sum + Number(leg.duration?.value || 0), 0);
    route.stops.forEach((stop, index) => {
      const leg = legs[index];
      stop.legDistanceMeters = normalizeNumber(leg?.distance?.value);
      stop.legDurationSeconds = normalizeNumber(leg?.duration?.value);
    });
    const returnLeg = legs[route.stops.length];
    route.returnDistanceMeters = normalizeNumber(returnLeg?.distance?.value);
    route.returnDurationSeconds = normalizeNumber(returnLeg?.duration?.value);
  }

  function clearRouteTiming(route){
    if(!route) return;
    route.distanceMeters = null;
    route.durationSeconds = null;
    route.returnDistanceMeters = null;
    route.returnDurationSeconds = null;
    (route.stops || []).forEach((stop) => {
      stop.legDistanceMeters = null;
      stop.legDurationSeconds = null;
    });
  }

  function tryRenderGoogleRoadRoute(route, fallbackPoints){
    if(state.mapProvider !== 'google' || !state.googleDirectionsService || !state.googleDirectionsRenderer) return false;
    const payload = getRouteDirectionsPayload(route, false);
    if(!payload){
      if(fallbackPoints.length > 1) {
        els['map-summary'].textContent = 'Road route unavailable until all stops have map locations.';
      }
      return false;
    }
    const renderToken = state.routeRenderToken;
    state.googleDirectionsService.route(payload, (response, status) => {
      if(renderToken !== state.routeRenderToken) return;
      if(status === 'OK'){
        state.googleDirectionsRenderer.setDirections(response);
        const providerLabel = 'SureMap roads';
        const stopCount = route.stops.length;
        els['map-summary'].textContent = `${stopCount} stop${stopCount === 1 ? '' : 's'} | ${providerLabel}`;
        return;
      }
      console.warn(`Google road route unavailable (${status}). Falling back to straight route line.`);
      drawRouteLine(fallbackPoints);
      els['map-summary'].textContent = 'Road route unavailable. Showing manual route line.';
    });
    return true;
  }

  function fitRoutePoints(points){
    const coords = points.filter((point) => hasUsableCoords(point.lat, point.lng));
    if(!coords.length) return;
    els['map-placeholder'].classList.add('hidden');
    if(state.mapProvider === 'google'){
      const bounds = new google.maps.LatLngBounds();
      coords.forEach((point) => bounds.extend({ lat:point.lat, lng:point.lng }));
      state.map.fitBounds(bounds);
      return;
    }
    state.map.fitBounds(L.latLngBounds(coords.map((point) => [point.lat, point.lng])), { padding:[28, 28] });
  }

  async function optimizeCurrentRoute(){
    const route = getCurrentRouteDraft();
    if(!route || route.stops.length < 2) return;
    if(state.mapProvider !== 'google' || !state.googleDirectionsService){
      alert('Route optimization requires Google Maps to be configured. Manual stop ordering is still available.');
      return;
    }
    if(route.stops.length > 25){
      alert('Google route optimization supports up to 25 stops in this builder.');
      return;
    }
    if(!getRouteDirectionsPayload(route, true)){
      alert('All route stops and custom origin/destination must have coordinates or a routable address before optimization.');
      return;
    }
    showSaveStatus('saving', 'OPTIMIZING');
    try {
      const result = await requestGoogleRouteDirections(route, true);
      const firstRoute = result.routes?.[0];
      const order = firstRoute?.waypoint_order || [];
      if(order.length === route.stops.length){
        route.stops = order.map((originalIndex) => route.stops[originalIndex]);
        route.stops.forEach((stop, index) => { stop.stopOrder = index; });
      }
      summarizeDirectionsResult(route, result);
      state.routeDirty = true;
      renderRouteEditor();
      syncRouteMarkers({ renderRoadRoute:false, renderManualRouteLine:false });
      state.googleDirectionsRenderer?.setDirections(result);
      showSaveStatus('saved', 'OPTIMIZED');
    } catch (error){
      console.error('Route optimization failed:', error);
      showSaveStatus('error', 'OPTIMIZE FAILED');
      alert(error.message || 'Unable to optimize this route.');
    }
  }

  function getRouteLinkedJobIds(route){
    return [...new Set((route?.stops || []).flatMap((stop) => normalizeStringArray(stop.jobIds)))];
  }

  function getTechnicianDefaultTruck(technicianId){
    return state.indexes.defaultTruckByTechnicianId.get(String(technicianId)) || null;
  }

  function getAssignmentsForJob(jobId){
    return [...(state.indexes.jobAssignmentsByJobId.get(String(jobId)) || [])];
  }

  function confirmRouteAssignment(route){
    const jobIds = getRouteLinkedJobIds(route);
    const defaultTruck = getTechnicianDefaultTruck(route.assignedTechnicianId);
    const replacementWarnings = [];
    jobIds.forEach((jobId) => {
      getAssignmentsForJob(jobId).forEach((assignment) => {
        if(defaultTruck && assignment.assignmentType === 'Truck' && assignment.resourceId && assignment.resourceId !== defaultTruck.id) replacementWarnings.push(`${getJobTitle(getJobById(jobId))}: truck ${getResourceName('Truck', assignment.resourceId)}`);
      });
    });
    if(!replacementWarnings.length) return true;
    return confirm(`Assigning this route will replace existing job assignments:\n\n${replacementWarnings.slice(0, 8).join('\n')}${replacementWarnings.length > 8 ? '\n...' : ''}\n\nContinue?`);
  }

  async function assignCurrentRoute(){
    await saveCurrentRoute({ assign:true });
  }

  function getResourceName(type, resourceId){
    if(type === 'Technician') return getEmployeeName(state.indexes.employeesById.get(String(resourceId)));
    if(type === 'Truck') return getTruckLabel(state.indexes.trucksById.get(String(resourceId)));
    return 'resource';
  }

  async function assignRemoteRouteJobs(jobIds, technicianId, truckId){
    for(const jobId of jobIds){
      if(truckId) await window.appAuth.requestJson(`/rest/v1/field_job_assignments?job_id=eq.${encodeURIComponent(jobId)}&assignment_type=eq.Truck`, { method:'DELETE' });
      const hasRouteTechnician = getAssignmentsForJob(jobId).some((assignment) => assignment.assignmentType === 'Technician' && assignment.resourceId === technicianId);
      const rows = hasRouteTechnician ? [] : [{ job_id:jobId, assignment_type:'Technician', resource_id:technicianId, assignment_status:'Assigned', assignment_notes:'Assigned from SureMap route.' }];
      if(truckId) rows.push({ job_id:jobId, assignment_type:'Truck', resource_id:truckId, assignment_status:'Assigned', assignment_notes:'Default truck assigned from SureMap route.' });
      if(!rows.length) continue;
      await window.appAuth.requestJson('/rest/v1/field_job_assignments', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Prefer:'return=minimal' },
        body:JSON.stringify(rows)
      });
    }
  }

  function assignLocalRouteJobs(jobIds, technicianId, truckId){
    const raw = readLocalRaw();
    raw.jobAssignments = Array.isArray(raw.jobAssignments) ? raw.jobAssignments.map(normalizeJobAssignment) : [];
    const jobSet = new Set(jobIds);
    raw.jobAssignments = raw.jobAssignments.filter((assignment) => {
      if(!jobSet.has(assignment.jobId)) return true;
      if(truckId && assignment.assignmentType === 'Truck') return false;
      return true;
    });
    jobIds.forEach((jobId) => {
      const hasRouteTechnician = raw.jobAssignments.some((assignment) => assignment.jobId === jobId && assignment.assignmentType === 'Technician' && assignment.resourceId === technicianId);
      if(!hasRouteTechnician) raw.jobAssignments.push(normalizeJobAssignment({ id:uid('asg'), jobId, assignmentType:'Technician', resourceId:technicianId }));
      if(truckId) raw.jobAssignments.push(normalizeJobAssignment({ id:uid('asg'), jobId, assignmentType:'Truck', resourceId:truckId }));
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
  }

  function getActiveClient(){
    return state.viewIndexes.clientsById.get(state.activeClientId) || null;
  }

  function getActiveSite(){
    return state.viewIndexes.sitesById.get(state.activeSiteId) || null;
  }

  function getClientRecord(id){ return state.indexes.clientsById.get(String(id)) || null; }
  function getProjectRecord(id, data = state.data, indexes = data === state.data ? state.indexes : buildDataIndexes(data)){ return indexes.projectsById.get(String(id)) || null; }
  function getSiteRecord(id){ return state.indexes.sitesById.get(String(id)) || null; }
  function getProjectsForClient(clientId){ return [...(state.indexes.projectsByClientId.get(String(clientId)) || [])]; }
  function getProjectIdsForSite(siteId, data = state.data, indexes = data === state.data ? state.indexes : buildDataIndexes(data)){
    const ids = [...(indexes.siteProjectIdsBySiteId.get(String(siteId)) || [])];
    const legacyProjectId = indexes.sitesById.get(String(siteId))?.projectId || '';
    if(legacyProjectId && !ids.includes(legacyProjectId)) ids.push(legacyProjectId);
    return ids.filter(Boolean);
  }
  function getLinkedProjectsForSite(siteId, data = state.data){
    const indexes = data === state.data ? state.indexes : buildDataIndexes(data);
    return getProjectIdsForSite(siteId, data, indexes).map((projectId) => getProjectRecord(projectId, data, indexes)).filter(Boolean).sort(sortByProjectName);
  }
  function getClientAddress(id){ const client = getClientRecord(id); return formatAddress(client?.hqStreet, client?.hqCity, client?.hqState, client?.hqZip); }
  function getSiteCoords(id){ return getSiteRecord(id)?.gpsCoordinates || ''; }
  function getSiteDirections(id){ const site = getSiteRecord(id); return site?.physicalAddress || site?.gpsCoordinates || ''; }
  function openClientInDirectory(clientId){
    const suffix = clientId ? `#client=${encodeURIComponent(clientId)}` : '';
    window.location.href = `../clients.html${suffix}`;
  }

  function ensureRoutePlaceModal(){
    if(document.getElementById('route-place-modal-overlay')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal-overlay site-editor-overlay" id="route-place-modal-overlay">
        <div class="modal suremap-modal-card route-place-modal-card">
          <div class="modal-header">
            <h3 id="route-place-modal-title">Other Site</h3>
            <button class="modal-close" type="button" data-route-place-close>X</button>
          </div>
          <div class="modal-body">
            <form class="suremap-route-place-form" id="route-place-form" novalidate>
              <input id="route-place-id" type="hidden">
              <div class="form-group">
                <label class="form-label" for="route-place-list">List</label>
                <select class="form-input" id="route-place-list"></select>
              </div>
              <div class="form-group">
                <label class="form-label" for="route-place-new-list">New List</label>
                <input class="form-input" id="route-place-new-list" type="text" placeholder="Optional new list name">
              </div>
              <div class="form-group">
                <label class="form-label" for="route-place-list-color">List Color</label>
                <select class="form-input" id="route-place-list-color">${ROUTE_PLACE_COLORS.map((color) => `<option value="${esc(color)}">${esc(color)}</option>`).join('')}</select>
              </div>
              <div class="form-group">
                <label class="form-label" for="route-place-list-icon">Icon</label>
                <select class="form-input" id="route-place-list-icon">${ROUTE_PLACE_ICON_OPTIONS.map((option) => `<option value="${esc(option.key)}">${esc(option.label)}</option>`).join('')}</select>
              </div>
              <div class="form-group full">
                <label class="form-label" for="route-place-name">Site Name</label>
                <input class="form-input" id="route-place-name" type="text" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="route-place-location-type">Location Type</label>
                <select class="form-input" id="route-place-location-type">
                  <option value="address">Address</option>
                  <option value="gps">GPS Coordinates</option>
                </select>
              </div>
              <div class="form-group full">
                <label class="form-label" for="route-place-address">Address / GPS</label>
                <input class="form-input" id="route-place-address" type="text" placeholder="Street, city, state or 40.123456, -80.123456" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="route-place-phone">Phone</label>
                <input class="form-input" id="route-place-phone" type="tel">
              </div>
              <div class="form-group">
                <label class="form-label" for="route-place-url">Website</label>
                <input class="form-input" id="route-place-url" type="url">
              </div>
              <div class="form-group full">
                <label class="form-label" for="route-place-notes">Notes</label>
                <textarea class="form-input" id="route-place-notes"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" type="button" data-route-place-close>Cancel</button>
            <button class="btn-save" type="button" id="route-place-save">Save Site</button>
          </div>
        </div>
      </div>
    `;
    document.body.append(...Array.from(wrapper.children));
    document.querySelectorAll('[data-route-place-close]').forEach((button) => button.addEventListener('click', () => closeModal('route-place-modal-overlay')));
    document.getElementById('route-place-modal-overlay').addEventListener('click', (event) => {
      if(event.target.id === 'route-place-modal-overlay') closeModal('route-place-modal-overlay');
    });
    document.getElementById('route-place-save').addEventListener('click', saveRoutePlaceFromModal);
    document.getElementById('route-place-form').addEventListener('submit', (event) => { event.preventDefault(); saveRoutePlaceFromModal(); });
    document.getElementById('route-place-location-type').addEventListener('change', updateRoutePlaceLocationPlaceholder);
  }

  function openRoutePlaceModal(options = {}){
    ensureRoutePlaceModal();
    const place = options.placeId ? getRoutePlace(options.placeId) : null;
    const listSelect = document.getElementById('route-place-list');
    const lists = getActiveRoutePlaceLists();
    listSelect.innerHTML = `<option value="">Select list...</option>${lists.map((list) => `<option value="${esc(list.id)}">${esc(list.listName)}</option>`).join('')}`;
    document.getElementById('route-place-form').reset();
    state.routePlaceModalPlaceId = place?.id || '';
    document.getElementById('route-place-id').value = place?.id || '';
    document.getElementById('route-place-modal-title').textContent = place ? 'Edit Other Site' : 'New Other Site';
    listSelect.value = place?.listId || options.listId || getActiveRoutePlaceList()?.id || lists[0]?.id || '';
    document.getElementById('route-place-new-list').value = '';
    document.getElementById('route-place-list-color').value = ROUTE_PLACE_COLORS[0];
    document.getElementById('route-place-list-icon').value = 'pin';
    document.getElementById('route-place-name').value = place?.placeName || '';
    document.getElementById('route-place-location-type').value = place?.locationType || 'address';
    document.getElementById('route-place-address').value = place?.addressValue || '';
    document.getElementById('route-place-phone').value = place?.phone || '';
    document.getElementById('route-place-url').value = place?.websiteUrl || '';
    document.getElementById('route-place-notes').value = place?.notes || '';
    updateRoutePlaceLocationPlaceholder();
    openModal('route-place-modal-overlay');
    setTimeout(() => document.getElementById('route-place-name')?.focus(), 40);
  }

  function updateRoutePlaceLocationPlaceholder(){
    const type = document.getElementById('route-place-location-type')?.value || 'address';
    const input = document.getElementById('route-place-address');
    if(input) input.placeholder = type === 'gps' ? '40.123456, -80.123456' : 'Street, city, state';
  }

  function ensureRoutePlaceListModal(){
    if(document.getElementById('route-place-list-modal-overlay')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal-overlay site-editor-overlay" id="route-place-list-modal-overlay">
        <div class="modal suremap-modal-card route-place-list-modal-card">
          <div class="modal-header">
            <h3 id="route-place-list-modal-title">Other Sites List</h3>
            <button class="modal-close" type="button" data-route-place-list-close>X</button>
          </div>
          <div class="modal-body">
            <form class="suremap-route-place-form" id="route-place-list-form" novalidate>
              <input id="route-place-list-id" type="hidden">
              <div class="form-group full">
                <label class="form-label" for="route-place-list-name">List Name</label>
                <input class="form-input" id="route-place-list-name" type="text" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="route-place-list-edit-color">List Color</label>
                <select class="form-input" id="route-place-list-edit-color">${ROUTE_PLACE_COLORS.map((color) => `<option value="${esc(color)}">${esc(color)}</option>`).join('')}</select>
              </div>
              <div class="form-group">
                <label class="form-label" for="route-place-list-edit-icon">Icon</label>
                <select class="form-input" id="route-place-list-edit-icon">${ROUTE_PLACE_ICON_OPTIONS.map((option) => `<option value="${esc(option.key)}">${esc(option.label)}</option>`).join('')}</select>
              </div>
              <label class="suremap-checkbox-row full"><input id="route-place-list-active" type="checkbox" checked> Active</label>
              <div class="form-group full">
                <label class="form-label" for="route-place-list-notes">Notes</label>
                <textarea class="form-input" id="route-place-list-notes"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" type="button" data-route-place-list-close>Cancel</button>
            <button class="btn-save" type="button" id="route-place-list-save">Save List</button>
          </div>
        </div>
      </div>
    `;
    document.body.append(...Array.from(wrapper.children));
    document.querySelectorAll('[data-route-place-list-close]').forEach((button) => button.addEventListener('click', () => closeModal('route-place-list-modal-overlay')));
    document.getElementById('route-place-list-modal-overlay').addEventListener('click', (event) => {
      if(event.target.id === 'route-place-list-modal-overlay') closeModal('route-place-list-modal-overlay');
    });
    document.getElementById('route-place-list-save').addEventListener('click', saveRoutePlaceListFromModal);
    document.getElementById('route-place-list-form').addEventListener('submit', (event) => { event.preventDefault(); saveRoutePlaceListFromModal(); });
  }

  function openRoutePlaceListModal(listId = ''){
    ensureRoutePlaceListModal();
    const list = listId ? getRoutePlaceList(listId) : null;
    state.routePlaceListModalListId = list?.id || '';
    document.getElementById('route-place-list-form').reset();
    document.getElementById('route-place-list-id').value = list?.id || '';
    document.getElementById('route-place-list-modal-title').textContent = list ? 'Edit Other Sites List' : 'New Other Sites List';
    document.getElementById('route-place-list-name').value = list?.listName || '';
    document.getElementById('route-place-list-edit-color').value = normalizeHexColor(list?.listColor, ROUTE_PLACE_COLORS[0]);
    document.getElementById('route-place-list-edit-icon').value = list?.iconKey || 'pin';
    document.getElementById('route-place-list-active').checked = list?.isActive !== false;
    document.getElementById('route-place-list-notes').value = list?.notes || '';
    openModal('route-place-list-modal-overlay');
    setTimeout(() => document.getElementById('route-place-list-name')?.focus(), 40);
  }

  async function saveRoutePlaceListFromModal(){
    const saveButton = document.getElementById('route-place-list-save');
    const id = document.getElementById('route-place-list-id')?.value || state.routePlaceListModalListId || '';
    const listName = document.getElementById('route-place-list-name')?.value.trim() || '';
    if(!listName){
      alert('Enter a list name.');
      return;
    }
    saveButton.disabled = true;
    showSaveStatus('saving', 'SAVING LIST');
    try {
      const record = normalizeRoutePlaceList({
        id,
        listName,
        listColor:document.getElementById('route-place-list-edit-color')?.value || ROUTE_PLACE_COLORS[0],
        iconKey:document.getElementById('route-place-list-edit-icon')?.value || 'pin',
        isActive:document.getElementById('route-place-list-active')?.checked !== false,
        notes:document.getElementById('route-place-list-notes')?.value.trim() || ''
      });
      const listId = await saveRoutePlaceListDetails(record);
      closeModal('route-place-list-modal-overlay');
      await loadData({ preserveSelection:true, focusSelection:false });
      upsertRoutePlaceListInMemory({ ...record, id:listId });
      selectSiteList(getSiteListKey('place-list', listId), { focusMap:true });
      showSaveStatus('saved', 'LIST SAVED');
    } catch (error){
      console.error('Unable to save Other Sites list:', error);
      showSaveStatus('error', 'LIST SAVE FAILED');
      alert(error.message || 'Unable to save the list.');
    } finally {
      saveButton.disabled = false;
    }
  }

  async function saveRoutePlaceFromModal(){
    const saveButton = document.getElementById('route-place-save');
    const id = document.getElementById('route-place-id')?.value || state.routePlaceModalPlaceId || '';
    const newListName = document.getElementById('route-place-new-list')?.value.trim() || '';
    const selectedListId = document.getElementById('route-place-list')?.value || '';
    const placeName = document.getElementById('route-place-name')?.value.trim() || '';
    const locationType = normalizeRoutePlaceLocationType(document.getElementById('route-place-location-type')?.value);
    const addressValue = document.getElementById('route-place-address')?.value.trim() || '';
    if(!placeName){
      alert('Enter a destination name.');
      return;
    }
    if(!addressValue){
      alert('Enter an address or GPS coordinates.');
      return;
    }
    saveButton.disabled = true;
    showSaveStatus('saving', 'SAVING OTHER SITE');
    try {
      let listId = selectedListId;
      let savedListSnapshot = listId ? getRoutePlaceList(listId) : null;
      if(newListName){
        const list = normalizeRoutePlaceList({
          id:'',
          listName:newListName,
          listColor:document.getElementById('route-place-list-color')?.value || ROUTE_PLACE_COLORS[0],
          iconKey:document.getElementById('route-place-list-icon')?.value || 'pin',
          isActive:true,
          notes:''
        });
        listId = await saveRoutePlaceListRecord(list);
        savedListSnapshot = normalizeRoutePlaceList({ ...list, id:listId });
      }
      if(!listId) throw new Error('Select a list or create a new list.');
      if(!savedListSnapshot) savedListSnapshot = getRoutePlaceList(listId);
      let lat = null;
      let lng = null;
      if(locationType === 'gps'){
        const coords = parseGps(addressValue);
        if(!coords) throw new Error('Enter valid GPS coordinates.');
        lat = coords.lat;
        lng = coords.lng;
      } else {
        const coords = await geocodeFreeformAddress(addressValue);
        if(coords){
          lat = coords.lat;
          lng = coords.lng;
        }
      }
      const place = normalizeRoutePlace({
        id,
        listId,
        placeName,
        locationType,
        addressValue:locationType === 'gps' && hasUsableCoords(lat, lng) ? formatGps(lat, lng) : addressValue,
        latitude:lat,
        longitude:lng,
        phone:document.getElementById('route-place-phone')?.value.trim() || '',
        websiteUrl:document.getElementById('route-place-url')?.value.trim() || '',
        isActive:true,
        notes:document.getElementById('route-place-notes')?.value.trim() || ''
      });
      const placeId = await saveRoutePlaceRecord(place);
      if(!placeId) throw new Error('Other Site save did not return a record id.');
      const savedPlaceSnapshot = normalizeRoutePlace({ ...place, id:placeId });
      closeModal('route-place-modal-overlay');
      await loadData({ preserveSelection:true, focusSelection:false });
      if(savedListSnapshot) upsertRoutePlaceListInMemory(savedListSnapshot);
      upsertRoutePlaceInMemory(savedPlaceSnapshot);
      selectRoutePlace(placeId, { focusMap:true });
      syncMarkers();
      showSaveStatus('saved', 'OTHER SITE SAVED');
    } catch (error){
      console.error('Unable to save Other Site:', error);
      showSaveStatus('error', 'OTHER SITE SAVE FAILED');
      alert(error.message || 'Unable to save the Other Site.');
    } finally {
      saveButton.disabled = false;
    }
  }

  async function geocodeFreeformAddress(value){
    const raw = String(value || '').trim();
    if(!raw) return null;
    const parsed = parseGps(raw);
    if(parsed) return parsed;
    if(state.mapProvider === 'google' && state.geocoder){
      try {
        const response = await state.geocoder.geocode({ address:raw });
        const first = Array.isArray(response?.results) ? response.results[0] : null;
        const location = first?.geometry?.location || null;
        const lat = typeof location?.lat === 'function' ? location.lat() : normalizeNumber(location?.lat);
        const lng = typeof location?.lng === 'function' ? location.lng() : normalizeNumber(location?.lng);
        if(hasUsableCoords(lat, lng)) return { lat, lng };
      } catch (_error){}
    }
    try {
      const rows = await requestCensusAddressMatches(raw);
      const first = rows[0] || null;
      return hasUsableCoords(first?.lat, first?.lon) ? { lat:first.lat, lng:first.lon } : null;
    } catch (_error){
      return null;
    }
  }

  async function saveRoutePlaceListRecord(list){
    const existingList = (state.data.routePlaceLists || []).find((row) => row.listName.toLowerCase() === list.listName.toLowerCase());
    if(existingList) return existingList.id;
    if(isRemoteMode()){
      let payload;
      try {
        payload = await window.appAuth.requestJson('/rest/v1/field_route_place_lists?select=*', {
          method:'POST',
          headers:{ 'Content-Type':'application/json', Prefer:'return=representation' },
          body:JSON.stringify({ list_name:list.listName, list_color:list.listColor, icon_key:list.iconKey, is_active:true, notes:list.notes || '' })
        });
      } catch (error){
        const remoteLists = await window.appAuth.requestJson('/rest/v1/field_route_place_lists?select=*').catch(() => []);
        const existingRemote = (remoteLists || []).map((row) => normalizeRoutePlaceList(row, true)).find((row) => row.listName.toLowerCase() === list.listName.toLowerCase());
        if(!existingRemote) throw error;
        upsertRoutePlaceListInMemory(existingRemote);
        return existingRemote.id;
      }
      const saved = normalizeRoutePlaceList(Array.isArray(payload) ? payload[0] : payload, true);
      if(!saved.id) throw new Error('Supabase did not return the saved destination list.');
      upsertRoutePlaceListInMemory(saved);
      return saved.id;
    }
    const raw = readLocalRaw();
    raw.routePlaceLists = Array.isArray(raw.routePlaceLists) ? raw.routePlaceLists.map(normalizeRoutePlaceList) : getDefaultRoutePlaceLists();
    const existing = raw.routePlaceLists.find((row) => row.listName.toLowerCase() === list.listName.toLowerCase());
    if(existing) return existing.id;
    const record = normalizeRoutePlaceList({ ...list, id:uid('rplist') });
    raw.routePlaceLists.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    upsertRoutePlaceListInMemory(record);
    return record.id;
  }

  async function saveRoutePlaceListDetails(list){
    const duplicate = (state.data.routePlaceLists || []).find((row) => row.id !== list.id && row.listName.toLowerCase() === list.listName.toLowerCase());
    if(duplicate) throw new Error('A list with that name already exists.');
    if(isRemoteMode()){
      const url = list.id ? `/rest/v1/field_route_place_lists?id=eq.${encodeURIComponent(list.id)}&select=*` : '/rest/v1/field_route_place_lists?select=*';
      const payload = await window.appAuth.requestJson(url, {
        method:list.id ? 'PATCH' : 'POST',
        headers:{ 'Content-Type':'application/json', Prefer:'return=representation' },
        body:JSON.stringify({
          list_name:list.listName,
          list_color:list.listColor,
          icon_key:list.iconKey,
          is_active:list.isActive !== false,
          notes:list.notes || ''
        })
      });
      const saved = normalizeRoutePlaceList(Array.isArray(payload) ? payload[0] : payload, true);
      if(!saved.id) throw new Error('Supabase did not return the saved list.');
      upsertRoutePlaceListInMemory(saved);
      return saved.id;
    }
    const raw = readLocalRaw();
    raw.routePlaceLists = Array.isArray(raw.routePlaceLists) ? raw.routePlaceLists.map(normalizeRoutePlaceList) : getDefaultRoutePlaceLists();
    const record = normalizeRoutePlaceList({ ...list, id:list.id || uid('rplist') });
    const index = raw.routePlaceLists.findIndex((row) => row.id === record.id);
    if(index >= 0) raw.routePlaceLists[index] = record;
    else raw.routePlaceLists.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    upsertRoutePlaceListInMemory(record);
    return record.id;
  }

  async function saveRoutePlaceRecord(place){
    if(isRemoteMode()){
      const url = place.id ? `/rest/v1/field_route_places?id=eq.${encodeURIComponent(place.id)}&select=*` : '/rest/v1/field_route_places?select=*';
      const payload = await window.appAuth.requestJson(url, {
        method:place.id ? 'PATCH' : 'POST',
        headers:{ 'Content-Type':'application/json', Prefer:'return=representation' },
        body:JSON.stringify({
          list_id:place.listId,
          place_name:place.placeName,
          location_type:place.locationType,
          address_value:place.addressValue,
          latitude:place.latitude,
          longitude:place.longitude,
          phone:place.phone,
          website_url:place.websiteUrl,
          is_active:true,
          notes:place.notes
        })
      });
      const saved = normalizeRoutePlace(Array.isArray(payload) ? payload[0] : payload, true);
      if(!saved.id) throw new Error('Supabase did not return the saved destination.');
      upsertRoutePlaceInMemory(saved);
      return saved.id;
    }
    const raw = readLocalRaw();
    raw.routePlaceLists = Array.isArray(raw.routePlaceLists) ? raw.routePlaceLists.map(normalizeRoutePlaceList) : getDefaultRoutePlaceLists();
    raw.routePlaces = Array.isArray(raw.routePlaces) ? raw.routePlaces.map(normalizeRoutePlace) : [];
    const record = normalizeRoutePlace({ ...place, id:place.id || uid('rplace') });
    const index = raw.routePlaces.findIndex((row) => row.id === record.id);
    if(index >= 0) raw.routePlaces[index] = record;
    else raw.routePlaces.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    upsertRoutePlaceInMemory(record);
    return record.id;
  }

  function upsertRoutePlaceListInMemory(list){
    const normalized = normalizeRoutePlaceList(list);
    if(!normalized.id) return;
    state.data.routePlaceLists = Array.isArray(state.data.routePlaceLists) ? state.data.routePlaceLists.filter((row) => row.id !== normalized.id) : [];
    state.data.routePlaceLists.push(normalized);
    ensureRoutePlaceLists(state.data);
    state.indexes = buildDataIndexes(state.data);
  }

  function upsertRoutePlaceInMemory(place){
    const normalized = normalizeRoutePlace(place);
    if(!normalized.id) return;
    state.data.routePlaces = Array.isArray(state.data.routePlaces) ? state.data.routePlaces.filter((row) => row.id !== normalized.id) : [];
    state.data.routePlaces.push(normalized);
    ensureRoutePlaceLists(state.data);
    state.indexes = buildDataIndexes(state.data);
  }

  async function deleteRoutePlaceListRecord(listId){
    const id = String(listId || '');
    if(!id) return false;
    const places = getRoutePlacesForList(id);
    if(places.length){
      alert('Delete or move the Other Sites in this list before deleting the list.');
      return false;
    }
    if(!confirm('Delete this Other Sites list?')) return false;
    showSaveStatus('saving', 'DELETING LIST');
    try {
      if(isRemoteMode()){
        await window.appAuth.requestJson(`/rest/v1/field_route_place_lists?id=eq.${encodeURIComponent(id)}`, { method:'DELETE' });
      } else {
        const raw = readLocalRaw();
        raw.routePlaceLists = (raw.routePlaceLists || []).filter((row) => String(row?.id || '') !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
      }
      state.activeSiteListKey = '';
      state.activeRoutePlaceId = '';
      await loadData({ preserveSelection:false, focusSelection:false });
      showSaveStatus('saved', 'LIST DELETED');
      return true;
    } catch (error){
      console.error('Unable to delete Other Sites list:', error);
      showSaveStatus('error', 'DELETE FAILED');
      alert(error.message || 'Unable to delete the list.');
      return false;
    }
  }

  async function deleteRoutePlaceRecord(placeId){
    const id = String(placeId || '');
    if(!id) return false;
    const routeUseCount = state.data.fieldRouteStops.filter((stop) => normalizeRouteStopType(stop.stopType) === 'place' && stop.placeId === id).length;
    if(routeUseCount){
      alert(`This Other Site is used by ${routeUseCount} route stop${routeUseCount === 1 ? '' : 's'} and cannot be deleted.`);
      return false;
    }
    const place = getRoutePlace(id);
    const listId = place?.listId || '';
    if(!confirm('Delete this Other Site?')) return false;
    showSaveStatus('saving', 'DELETING SITE');
    try {
      if(isRemoteMode()){
        await window.appAuth.requestJson(`/rest/v1/field_route_places?id=eq.${encodeURIComponent(id)}`, { method:'DELETE' });
      } else {
        const raw = readLocalRaw();
        raw.routePlaces = (raw.routePlaces || []).filter((row) => String(row?.id || '') !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
      }
      state.activeRoutePlaceId = '';
      await loadData({ preserveSelection:true, focusSelection:false });
      if(listId) selectSiteList(getSiteListKey('place-list', listId), { focusMap:true });
      showSaveStatus('saved', 'SITE DELETED');
      return true;
    } catch (error){
      console.error('Unable to delete Other Site:', error);
      showSaveStatus('error', 'DELETE FAILED');
      alert(error.message || 'Unable to delete the Other Site.');
      return false;
    }
  }

  function openModal(id){ document.getElementById(id)?.classList.add('open'); }
  function closeModal(id){ document.getElementById(id)?.classList.remove('open'); }

  function setSiteGpsMode(value){
    els['site-gps-mode'].value = value ? 'true' : 'false';
  }

  function isSiteGpsMode(){
    return String(els['site-gps-mode']?.value || '').toLowerCase() === 'true';
  }

  function getSiteAddressDraft(){
    return {
      gpsOnly:isSiteGpsMode(),
      search:els['site-address-search'].value || '',
      street:els['site-street'].value || '',
      city:els['site-city'].value || '',
      state:els['site-state'].value || '',
      zip:els['site-zip'].value || '',
      lat:els['site-lat'].value || '',
      lng:els['site-lng'].value || ''
    };
  }

  function setSiteAddressDraft(draft = {}){
    setSiteGpsMode(!!draft.gpsOnly);
    els['site-address-search'].value = String(draft.search || '');
    els['site-street'].value = String(draft.street || '');
    els['site-city'].value = String(draft.city || '');
    els['site-state'].value = String(draft.state || '').toUpperCase();
    els['site-zip'].value = String(draft.zip || '');
    els['site-lat'].value = String(draft.lat ?? '');
    els['site-lng'].value = String(draft.lng ?? '');
    setAutocompleteCoords(els['site-address-search'], draft.lat, draft.lng);
    renderSiteAddressSummary();
  }

  function renderSiteAddressSummary(){
    const draft = getSiteAddressDraft();
    const lat = normalizeNumber(draft.lat);
    const lng = normalizeNumber(draft.lng);
    const address = formatAddress(draft.street, draft.city, draft.state, draft.zip);
    const coords = hasUsableCoords(lat, lng) ? formatGps(lat, lng) : '';
    if(draft.gpsOnly){
      els['site-address-summary'].innerHTML = coords
        ? `<strong>GPS override</strong><span>${esc(coords)}</span>`
        : '<strong>GPS override</strong><span>No coordinates set</span>';
      return;
    }
    els['site-address-summary'].innerHTML = address
      ? `<strong>${esc(address)}</strong>${coords ? `<span>${esc(coords)}</span>` : ''}`
      : '<strong>No address set</strong><span>Choose Edit Address before saving the site.</span>';
  }

  function resetSiteForm(){
    els['site-form'].reset();
    els['site-id'].value = '';
    els['site-client-id'].value = '';
    els['site-project-options'].innerHTML = '';
    els['site-project-hint'].textContent = '';
    els['site-job-type-options'].innerHTML = '';
    els['site-job-type-hint'].textContent = '';
    els['site-type'].value = 'Well Site';
    els['site-status'].value = 'Active';
    clearAutocompleteSelection(els['site-address-search']);
    setSiteAddressDraft({ gpsOnly:false });
    renderSiteJobTypeOptions(els['site-type'].value, []);
    els['site-delete-btn'].style.display = 'none';
    els['site-modal-title'].textContent = 'Add Site';
  }

  function openSiteModal(clientId, siteId = ''){
    if(window.SiteEditor){
      const resolvedClientId = String(clientId || state.activeClientId || '');
      window.SiteEditor.open({
        siteId,
        clientId:resolvedClientId,
        data:state.data,
        getProjectsForClient,
        getProjectIdsForSite,
        getActiveJobTypes,
        saveSite:async (record) => {
          showSaveStatus('saving', 'SAVING');
          return saveSiteRecord(record);
        },
        deleteSite:async (id, record) => deleteSiteRecord(record.clientId || resolvedClientId, id),
        afterSave:async ({ siteId: savedSiteId, record }) => {
          await loadData({ preserveSelection:false, focusSelection:false });
          selectSite(record.clientId, savedSiteId, { focusMap:true });
          showSaveStatus('saved', 'SAVED');
        },
        afterDelete:async ({ record }) => {
          if(record.clientId) selectClient(record.clientId, { focusMap:true });
        },
        showStatus:showSaveStatus
      });
      return;
    }
    alert('The shared site editor is unavailable. Refresh the page and try again.');
    return;
  }

  function openAddressModal(){
    const draft = getSiteAddressDraft();
    els['address-form'].reset();
    els['address-gps-mode'].checked = draft.gpsOnly;
    els['address-search'].value = draft.search || formatAddress(draft.street, draft.city, draft.state, draft.zip);
    els['address-street'].value = draft.street;
    els['address-city'].value = draft.city;
    els['address-state'].value = draft.state;
    els['address-zip'].value = draft.zip;
    els['address-lat'].value = draft.lat;
    els['address-lng'].value = draft.lng;
    setAutocompleteCoords(els['address-search'], draft.lat, draft.lng);
    els['address-results'].innerHTML = '';
    els['address-results'].classList.remove('open');
    updateAddressModalMode();
    openModal('address-modal-overlay');
    setTimeout(() => (els['address-gps-mode'].checked ? els['address-lat'] : els['address-search']).focus(), 50);
  }

  function updateAddressModalMode(){
    const gpsOnly = !!els['address-gps-mode']?.checked;
    ['address-search', 'address-street', 'address-city', 'address-state', 'address-zip'].forEach((id) => {
      const input = els[id];
      if(!input) return;
      input.disabled = gpsOnly;
      input.closest('.form-group')?.classList.toggle('suremap-gps-address-disabled', gpsOnly);
    });
    ['address-lat', 'address-lng'].forEach((id) => {
      const input = els[id];
      if(!input) return;
      input.disabled = !gpsOnly;
      input.required = gpsOnly;
      input.closest('.form-group')?.classList.toggle('suremap-gps-coord-disabled', !gpsOnly);
    });
    if(gpsOnly){
      els['address-results'].innerHTML = '';
      els['address-results'].classList.remove('open');
      clearAutocompleteSelection(els['address-search']);
    }
  }

  function handleAddressModeChange(){
    if(!els['address-gps-mode'].checked && isSiteGpsMode()){
      els['address-lat'].value = '';
      els['address-lng'].value = '';
      clearAutocompleteSelection(els['address-search']);
    }
    updateAddressModalMode();
  }

  function applyAddressModal(){
    const gpsOnly = !!els['address-gps-mode'].checked;
    const lat = normalizeNumber(els['address-lat'].value);
    const lng = normalizeNumber(els['address-lng'].value);
    if(gpsOnly && !hasUsableCoords(lat, lng)){
      alert('Enter valid GPS coordinates before using GPS override.');
      return;
    }
    if(!gpsOnly){
      const street = els['address-street'].value.trim();
      const city = els['address-city'].value.trim();
      if(!street || !city){
        alert('Select or enter a site address before saving it.');
        return;
      }
    }
    setSiteAddressDraft({
      gpsOnly,
      search:gpsOnly ? '' : els['address-search'].value.trim(),
      street:gpsOnly ? '' : els['address-street'].value.trim(),
      city:gpsOnly ? '' : els['address-city'].value.trim(),
      state:gpsOnly ? '' : els['address-state'].value.trim().toUpperCase(),
      zip:gpsOnly ? '' : els['address-zip'].value.trim(),
      lat:hasUsableCoords(lat, lng) ? lat : '',
      lng:hasUsableCoords(lat, lng) ? lng : ''
    });
    closeModal('address-modal-overlay');
  }

  function renderSiteProjectOptions(clientId, selectedProjectIds = []){
    const projects = getProjectsForClient(clientId);
    const selected = new Set(selectedProjectIds);
    if(!projects.length){
      els['site-project-options'].innerHTML = '<div class="empty-state">No projects exist for this client yet.</div>';
      els['site-project-hint'].innerHTML = 'Create a project from the Clients page before adding a mapped site.';
      return;
    }
    els['site-project-options'].innerHTML = projects.map((project) => `
      <label class="suremap-project-option">
        <input type="checkbox" value="${esc(project.id)}" ${selected.has(project.id) ? 'checked' : ''}>
        <span>
          <strong>${esc(project.projectName || 'Unnamed project')}</strong>
          <small>${esc(project.projectStatus || 'Active')} | ${esc(project.serviceScope || 'Field')}</small>
        </span>
      </label>
    `).join('');
    els['site-project-hint'].textContent = projects.length === 1 ? 'This client has one project, so it is selected automatically.' : 'Select every project that uses this site. The first selected project is saved as the primary site project.';
  }

  function getSelectedSiteProjectIds(){
    const ids = Array.from(els['site-project-options'].querySelectorAll('input[type="checkbox"]:checked')).map((node) => String(node.value || '').trim()).filter(Boolean);
    const existingPrimaryId = getSiteRecord(els['site-id'].value)?.projectId || '';
    if(existingPrimaryId && ids.includes(existingPrimaryId)){
      return [existingPrimaryId, ...ids.filter((projectId) => projectId !== existingPrimaryId)];
    }
    return ids;
  }

  function getActiveJobTypes(){
    return (Array.isArray(state.data.jobTypes) ? state.data.jobTypes : getDefaultJobTypeRecords())
      .filter((jobType) => jobType.isActive && jobType.jobTypeName)
      .sort(sortByJobType);
  }

  function getJobTypeOptionsForSiteType(siteType, selectedNames = []){
    const normalizedType = normalizeSiteType(siteType);
    const activeTypes = getActiveJobTypes();
    const byName = new Map(activeTypes.map((jobType) => [jobType.jobTypeName.toLowerCase(), jobType]));
    const mappedNames = normalizedType === 'Other'
      ? activeTypes.map((jobType) => jobType.jobTypeName)
      : (SITE_TYPE_JOB_TYPE_NAMES[normalizedType] || []);
    const options = [];
    const seen = new Set();
    mappedNames.forEach((name) => {
      const jobType = byName.get(String(name || '').toLowerCase());
      if(!jobType || seen.has(jobType.jobTypeName.toLowerCase())) return;
      seen.add(jobType.jobTypeName.toLowerCase());
      options.push({ name:jobType.jobTypeName, existing:false });
    });
    parseStandardJobTypes(selectedNames).forEach((name) => {
      const key = name.toLowerCase();
      if(seen.has(key)) return;
      seen.add(key);
      options.push({ name, existing:true });
    });
    return options;
  }

  function getSelectedSiteJobTypeNames(){
    return Array.from(els['site-job-type-options'].querySelectorAll('input[type="checkbox"]:checked'))
      .map((node) => String(node.value || '').trim())
      .filter(Boolean);
  }

  function renderSiteJobTypeOptions(siteType, selectedNames = []){
    const selected = new Set(parseStandardJobTypes(selectedNames).map((name) => name.toLowerCase()));
    const options = getJobTypeOptionsForSiteType(siteType, selectedNames);
    if(!options.length){
      els['site-job-type-options'].innerHTML = '<div class="empty-state">No active job types are available for this site type.</div>';
      els['site-job-type-hint'].textContent = 'Manage job types from Field Ops, then return to SureMap.';
      return;
    }
    els['site-job-type-options'].innerHTML = options.map((option) => `
      <label class="suremap-job-type-option">
        <input type="checkbox" value="${esc(option.name)}" ${selected.has(option.name.toLowerCase()) ? 'checked' : ''}>
        <span>
          <strong>${esc(option.name)}</strong>
          <small>${option.existing ? 'Existing saved value' : `${esc(normalizeSiteType(siteType))} standard`}</small>
        </span>
      </label>
    `).join('');
    els['site-job-type-hint'].textContent = options.some((option) => option.existing)
      ? 'Existing values outside the current site type are kept checked until you remove them.'
      : 'Select the standard job types normally performed at this site.';
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
    const gpsOnly = isSiteGpsMode();
    if(!clientId || !siteName){
      alert('Select a client first and enter a site name.');
      return;
    }
    const projectIds = getSelectedSiteProjectIds();
    if(!getProjectsForClient(clientId).length){
      alert('This client has no projects yet. Create a project from the Clients page before adding a mapped site.');
      return;
    }
    if(!projectIds.length){
      alert('Select at least one linked project for this site.');
      return;
    }
    const saveButton = els['site-save-btn'];
    saveButton.disabled = true;
    showSaveStatus('saving', 'SAVING');
    try {
      let lat = normalizeNumber(els['site-lat'].value);
      let lng = normalizeNumber(els['site-lng'].value);
      if(gpsOnly && !hasUsableCoords(lat, lng)){
        throw new Error('Enter valid latitude and longitude before saving a GPS-only site.');
      }
      const address = gpsOnly ? '' : (formatAddress(street, city, stateCode, zip) || existing?.physicalAddress || '');
      if(!gpsOnly && !hasUsableCoords(lat, lng)){
        const picked = getAutocompleteCoords(els['site-address-search']);
        const coords = picked || (street && city ? await geocodeAddress(street, city, stateCode, zip) : null);
        if(!hasUsableCoords(coords?.lat, coords?.lng)) throw new Error('Select an address from Edit Address or use GPS override.');
        lat = coords.lat;
        lng = coords.lng;
      }
      const record = {
        ...(existing || {
          accessInstructions: '', safetyPpeNotes: '', gateCodeEntryRequirements: '', clientSiteContact: '', standardJobTypes: ''
        }),
        id: existing?.id || '',
        clientId,
        projectId: projectIds[0],
        projectIds,
        siteName,
        siteType: els['site-type'].value,
        siteStatus: els['site-status'].value,
        standardJobTypes: serializeStandardJobTypes(getSelectedSiteJobTypeNames()),
        notes: els['site-notes'].value.trim(),
        physicalAddress: address,
        countyState: gpsOnly ? '' : [city, stateCode].filter(Boolean).join(', '),
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

  async function saveSiteRecord(record){
    if(isRemoteMode()){
      const url = record.id ? `/rest/v1/field_sites?id=eq.${encodeURIComponent(record.id)}&select=*` : '/rest/v1/field_sites?select=*';
      const payload = await window.appAuth.requestJson(url, {
        method: record.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type':'application/json', Prefer:'return=representation' },
        body: JSON.stringify({
          client_id: record.clientId,
          project_id: record.projectId,
          site_name: record.siteName,
          site_type: toSiteTypeKey(record.siteType),
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
      const siteId = String(row?.id || record.id);
      await replaceRemoteSiteProjectLinks(siteId, record.projectIds);
      return siteId;
    }
    const raw = readLocalRaw();
    const normalized = normalizeSite(record);
    const next = raw.sites ? raw.sites.map(normalizeSite) : [];
    const nextRecord = { ...normalized, id: normalized.id || uid('site') };
    const index = next.findIndex((row) => row.id === nextRecord.id);
    if(index >= 0) next[index] = nextRecord;
    else next.push(nextRecord);
    raw.sites = next;
    raw.siteProjects = replaceLocalSiteProjectLinks(raw.siteProjects, nextRecord.id, nextRecord.projectIds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return nextRecord.id;
  }

  async function replaceRemoteSiteProjectLinks(siteId, projectIds){
    await window.appAuth.requestJson(`/rest/v1/field_site_projects?site_id=eq.${encodeURIComponent(siteId)}`, { method:'DELETE' });
    const rows = normalizeStringArray(projectIds).map((projectId) => ({ site_id:siteId, project_id:projectId }));
    if(!rows.length) return;
    await window.appAuth.requestJson('/rest/v1/field_site_projects', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Prefer:'return=minimal' },
      body:JSON.stringify(rows)
    });
  }

  function replaceLocalSiteProjectLinks(existingLinks, siteId, projectIds){
    const kept = (Array.isArray(existingLinks) ? existingLinks : []).map(normalizeSiteProject).filter((link) => link.siteId !== siteId);
    normalizeStringArray(projectIds).forEach((projectId) => {
      kept.push({ id:`${siteId}::${projectId}`, siteId, projectId });
    });
    return kept.sort(sortBySiteProject);
  }

  async function deleteSiteRecord(clientId, siteId){
    const id = String(siteId || '');
    if(!id) return false;
    const block = getSiteDeleteBlock(id);
    if(block){
      alert(block);
      return false;
    }
    if(!confirm('Delete this mapped site?')) return false;
    showSaveStatus('saving', 'DELETING');
    try {
      if(isRemoteMode()){
        await window.appAuth.requestJson(`/rest/v1/field_sites?id=eq.${encodeURIComponent(id)}`, { method:'DELETE' });
      } else {
        const raw = readLocalRaw();
        raw.sites = (raw.sites || []).filter((row) => String(row?.id || '') !== id);
        raw.siteProjects = (raw.siteProjects || []).filter((row) => String(row?.siteId || '') !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
      }
      await loadData({ preserveSelection:false, focusSelection:false });
      if(clientId) selectClient(clientId, { focusMap:true });
      showSaveStatus('saved', 'DELETED');
      return true;
    } catch (error){
      console.error('SureMap site delete failed:', error);
      showSaveStatus('error', 'DELETE FAILED');
      alert(error.message || 'Unable to delete the site.');
      return false;
    }
  }

  function getSiteDeleteBlock(siteId){
    const jobIds = state.data.jobs.filter((job) => getJobSiteIds(job).includes(siteId)).map((job) => job.id);
    const jobs = jobIds.length;
    const samples = state.data.samples.filter((sample) => sample.siteId === siteId || jobIds.includes(sample.jobId)).length;
    return jobs || samples ? `This site cannot be deleted because it still has ${jobs} linked job${jobs === 1 ? '' : 's'} and ${samples} linked sample${samples === 1 ? '' : 's'}. Clear those records first.` : '';
  }

  function bindAutocomplete(config){
    let timer = null;
    let seq = 0;
    config.input.addEventListener('input', () => {
      if(config.input.disabled) return;
      clearAutocompleteSelection(config.input);
      clearTimeout(timer);
      const query = config.input.value.trim();
      if(query.length < 3){
        config.results.classList.remove('open');
        config.results.innerHTML = '';
        return;
      }
      timer = setTimeout(async () => {
        const current = ++seq;
        try {
          const { rows, message } = await lookupAddressSuggestions(query);
          if(current !== seq) return;
          config.results.innerHTML = (message ? `<div class="suremap-autocomplete-item muted"><strong>${esc(message.title)}</strong><span>${esc(message.copy)}</span></div>` : '')
            + (Array.isArray(rows) ? rows : []).map((item, index) => `<div class="suremap-autocomplete-item" data-index="${index}"><strong>${esc(item.display_name)}</strong><span>${esc(item.type || 'address')}</span></div>`).join('');
          if(!config.results.innerHTML){
            config.results.innerHTML = '<div class="suremap-autocomplete-item muted"><strong>No matches found</strong><span>Keep typing or enter the address manually.</span></div>';
          }
          config.results.classList.toggle('open', !!config.results.innerHTML);
          config.results.querySelectorAll('[data-index]').forEach((row) => {
            row.addEventListener('mousedown', async (event) => {
              event.preventDefault();
              const item = rows[Number(row.dataset.index)];
              if(!item) return;
              const valueBeforePick = config.input.value;
              try {
                await config.onPick(item);
              } catch (error){
                console.warn('Unable to apply selected address:', error);
                alert(error.message || 'Unable to load that address.');
                return;
              }
              if(!config.input.value.trim() || config.input.value === valueBeforePick) config.input.value = item.display_name;
              config.results.classList.remove('open');
              resetPlacesSessionToken();
            });
          });
        } catch (_error){
          config.results.innerHTML = '<div class="suremap-autocomplete-item"><strong>Lookup unavailable</strong><span>Enter the address manually and the map will geocode it on save.</span></div>';
          config.results.classList.add('open');
        }
      }, 220);
    });
    config.input.addEventListener('blur', () => setTimeout(() => config.results.classList.remove('open'), 120));
  }

  async function applyAddressPick(item, ids){
    if(!item) return;
    const place = item.placePrediction ? await resolveGooglePlace(item) : null;
    const address = place?.address || item.address || {};
    document.getElementById(ids.street).value = buildStreet(address);
    document.getElementById(ids.city).value = address.city || address.town || address.village || address.hamlet || '';
    document.getElementById(ids.state).value = getStateCode(address);
    document.getElementById(ids.zip).value = address.postcode || '';
    const lat = place?.lat ?? item.lat ?? '';
    const lng = place?.lng ?? item.lon ?? '';
    if(ids.lat) document.getElementById(ids.lat).value = lat;
    if(ids.lng) document.getElementById(ids.lng).value = lng;
    setAutocompleteCoords(document.getElementById(ids.input), lat, lng);
    if(place?.displayName) document.getElementById(ids.input).value = place.displayName;
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
    if(!input) return;
    input.dataset.selLat = '';
    input.dataset.selLng = '';
  }

  function setAutocompleteCoords(input, lat, lng){
    if(!input) return;
    input.dataset.selLat = hasUsableCoords(lat, lng) ? String(lat) : '';
    input.dataset.selLng = hasUsableCoords(lat, lng) ? String(lng) : '';
  }

  function getAutocompleteCoords(input){
    if(!input) return null;
    const lat = normalizeNumber(input.dataset.selLat);
    const lng = normalizeNumber(input.dataset.selLng);
    return hasUsableCoords(lat, lng) ? { lat, lng } : null;
  }

  async function lookupAddressSuggestions(query){
    try {
      const googleRows = await requestGooglePlaceSuggestions(query);
      if(googleRows.length) return { rows:googleRows.slice(0, 5), message:null };
    } catch (error){
      console.warn('Google Places autocomplete unavailable. Falling back to Census lookup.', error);
      const censusRows = await requestCensusAddressMatches(query).catch(() => []);
      return {
        rows:censusRows.slice(0, 5),
        message:{
          title:'Google address lookup unavailable',
          copy:censusRows.length ? 'Showing Census matches instead.' : 'Enter coordinates or keep typing the address manually.'
        }
      };
    }
    const censusRows = await requestCensusAddressMatches(query).catch(() => []);
    return { rows:censusRows.slice(0, 5), message:null };
  }

  async function requestGooglePlaceSuggestions(query){
    const places = await loadPlacesLibrary();
    const AutocompleteSuggestion = places?.AutocompleteSuggestion || window.google?.maps?.places?.AutocompleteSuggestion;
    if(!AutocompleteSuggestion?.fetchAutocompleteSuggestions) throw new Error('Google Places suggestions are not available.');
    const request = {
      input:query,
      includedRegionCodes:['us'],
      locationBias:{ center:{ lat:HOME_BASE.lat, lng:HOME_BASE.lng }, radius:250000 }
    };
    const sessionToken = getPlacesSessionToken(places);
    if(sessionToken) request.sessionToken = sessionToken;
    const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
    const suggestions = Array.isArray(response?.suggestions) ? response.suggestions : [];
    return suggestions.map((suggestion) => {
      const prediction = suggestion?.placePrediction || null;
      const text = prediction?.text?.text || prediction?.text?.toString?.() || prediction?.text || prediction?.mainText?.text || prediction?.mainText?.toString?.() || '';
      return {
        display_name:String(text || '').trim(),
        type:'Google Places',
        placePrediction:prediction
      };
    }).filter((item) => item.display_name && item.placePrediction);
  }

  async function resolveGooglePlace(item){
    const place = item?.placePrediction?.toPlace?.();
    if(!place) throw new Error('Unable to load the selected Google address.');
    await place.fetchFields({ fields:['formattedAddress', 'location', 'addressComponents'] });
    const location = place.location || null;
    const lat = typeof location?.lat === 'function' ? location.lat() : normalizeNumber(location?.lat);
    const lng = typeof location?.lng === 'function' ? location.lng() : normalizeNumber(location?.lng);
    return {
      displayName:String(place.formattedAddress || item.display_name || '').trim(),
      lat:hasUsableCoords(lat, lng) ? lat : '',
      lng:hasUsableCoords(lat, lng) ? lng : '',
      address:buildGoogleAddressObject(place.addressComponents || [])
    };
  }

  function buildGoogleAddressObject(components){
    const findComponent = (...types) => {
      const row = (Array.isArray(components) ? components : []).find((component) => {
        const componentTypes = Array.isArray(component?.types) ? component.types : [];
        return types.some((type) => componentTypes.includes(type));
      }) || {};
      return {
        long: row.longText || row.long_name || '',
        short: row.shortText || row.short_name || row.longText || row.long_name || ''
      };
    };
    const streetNumber = findComponent('street_number').long;
    const route = findComponent('route').long;
    const city = findComponent('locality').long || findComponent('postal_town').long || findComponent('sublocality', 'neighborhood').long || findComponent('administrative_area_level_3').long;
    return {
      house_number: streetNumber,
      road: route,
      city,
      town: city,
      state_code: findComponent('administrative_area_level_1').short,
      postcode: findComponent('postal_code').long
    };
  }

  async function geocodeAddress(street, city, stateCode, zip){
    const query = formatAddress(street, city, stateCode, zip);
    if(state.mapProvider === 'google' && state.geocoder && query){
      try {
        const response = await state.geocoder.geocode({ address:query });
        const first = Array.isArray(response?.results) ? response.results[0] : null;
        const location = first?.geometry?.location || null;
        const lat = typeof location?.lat === 'function' ? location.lat() : normalizeNumber(location?.lat);
        const lng = typeof location?.lng === 'function' ? location.lng() : normalizeNumber(location?.lng);
        if(hasUsableCoords(lat, lng)) return { lat, lng };
      } catch (_error){
        // Fall through to the existing Census geocoder.
      }
    }
    try {
      const rows = await requestCensusAddressMatches(query);
      if(!rows.length) return null;
      const lat = normalizeNumber(rows[0].lat);
      const lng = normalizeNumber(rows[0].lon);
      return hasUsableCoords(lat, lng) ? { lat, lng } : null;
    } catch (_error){
      return null;
    }
  }

  async function requestCensusAddressMatches(query){
    const payload = await requestJsonp(`https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(query)}&benchmark=4&format=jsonp`);
    return parseCensusAddressMatches(payload);
  }

  function parseCensusAddressMatches(payload){
    const matches = Array.isArray(payload?.result?.addressMatches) ? payload.result.addressMatches : [];
    return matches.map((match) => {
      const lat = normalizeNumber(match?.coordinates?.y);
      const lon = normalizeNumber(match?.coordinates?.x);
      const components = match?.addressComponents || {};
      const address = buildCensusAddressObject(components);
      return {
        display_name: String(match?.matchedAddress || formatAddress(address.road, address.city, address.state_code, address.postcode) || '').trim(),
        type: 'census match',
        lat: lat ?? '',
        lon: lon ?? '',
        address
      };
    }).filter((item) => hasUsableCoords(item.lat, item.lon));
  }

  function buildCensusAddressObject(components){
    const streetParts = [
      components.preDirection,
      components.preType,
      components.streetName,
      components.suffixType,
      components.suffixDirection
    ].filter(Boolean);
    return {
      house_number: components.fromAddress || '',
      road: streetParts.join(' ').trim(),
      city: components.city || '',
      state_code: components.state || '',
      postcode: components.zip || ''
    };
  }

  function requestJsonp(url){
    return new Promise((resolve, reject) => {
      const callbackName = `sureMapJsonp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const script = document.createElement('script');
      const cleanup = () => {
        delete window[callbackName];
        script.remove();
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Address lookup timed out.'));
      }, 8000);
      window[callbackName] = (payload) => {
        clearTimeout(timer);
        cleanup();
        resolve(payload);
      };
      script.onerror = () => {
        clearTimeout(timer);
        cleanup();
        reject(new Error('Address lookup failed to load.'));
      };
      script.src = `${url}&callback=${encodeURIComponent(callbackName)}`;
      document.head.appendChild(script);
    });
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
