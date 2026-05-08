(function(){
  'use strict';

  const STORAGE_KEY = 'field-ops-dashboard-data';
  const LEGACY_STORAGE_KEY = 'spl-client-map-v1';
  const FIELD_ASSET_BUCKET = 'field-assets';
  const CLIENT_STATUS_OPTIONS = ['Active', 'Pending', 'On Hold', 'Inactive'];
  const CLIENT_SECTOR_OPTIONS = ['Upstream', 'Midstream', 'Downstream', 'Other'];
  const SITE_TYPE_OPTIONS = ['Well Site', 'Meter Station', 'Field Site', 'Well Pad', 'LACT Unit', 'Facility', 'Pipeline Location', 'Office / Yard', 'Other'];
  const SITE_TYPE_KEY_BY_LABEL = Object.fromEntries(SITE_TYPE_OPTIONS.map((label) => [label, label.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')]));
  const SITE_TYPE_LABEL_BY_KEY = Object.fromEntries(Object.entries(SITE_TYPE_KEY_BY_LABEL).map(([label, key]) => [key, label]));
  const SITE_STATUS_OPTIONS = ['Active', 'Restricted', 'Inactive'];
  const DEFAULT_JOB_TYPE_DEFS = [
    { jobTypeKey:'ALLOCATION_PROVING', jobTypeName:'Allocation Proving', isActive:true, sortOrder:10 },
    { jobTypeKey:'LACT_PROVING', jobTypeName:'LACT Proving', isActive:true, sortOrder:20 },
    { jobTypeKey:'SAMPLE_PICKUP', jobTypeName:'Sample Pickup', isActive:true, sortOrder:30 },
    { jobTypeKey:'SAMPLE_DROP_OFF', jobTypeName:'Sample Drop-Off', isActive:true, sortOrder:40 },
    { jobTypeKey:'MAINTENANCE', jobTypeName:'Maintenance', isActive:true, sortOrder:50 },
    { jobTypeKey:'MULTI_SERVICE', jobTypeName:'Multi-Service', isActive:true, sortOrder:60 }
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
  const remoteAssetPhotoUrlCache = new Map();
  const remoteAssetPhotoLoadPromises = new Map();

  const state = {
    data: createEmptyData(),
    viewClients: [],
    filteredClients: [],
    filterTag: 'All',
    searchQuery: '',
    clientPickerQuery: '',
    activeClientId: '',
    activeSiteId: '',
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
    booted: false,
    searchTimer: null,
    hideSaveTimer: null,
    mapResizeTimer: null,
    tileErrorNotified: false
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
      'all-clients-btn', 'list-summary', 'map-summary', 'fit-sites-btn', 'filter-row', 'client-list', 'map',
      'map-placeholder', 'detail-panel'
    ].forEach((id) => { els[id] = document.getElementById(id); });
  }

  function createEmptyData(){
    return { clients: [], projects: [], sites: [], siteProjects: [], jobTypes: getDefaultJobTypeRecords(), jobs: [], jobAssignments: [], samples: [] };
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
      const first = getClientPickerMatches()[0];
      if(first) selectClientFromPicker(first.id);
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
      const option = event.target.closest('[data-client-picker-id]');
      if(option) selectClientFromPicker(option.dataset.clientPickerId);
    });
    els['fit-sites-btn'].addEventListener('click', fitVisibleSites);
    els['all-clients-btn'].addEventListener('click', showAllClients);
  }

  function bindPanels(){
    els['filter-row'].addEventListener('change', (event) => {
      const select = event.target.closest('[data-site-type-filter]');
      if(!select) return;
      state.filterTag = select.value || 'All';
      refreshFilteredView({ syncMap:true, preserveSelection:true, focusSelection:false });
    });

    els['client-list'].addEventListener('click', (event) => {
      const siteCard = event.target.closest('[data-site-id]');
      if(siteCard){
        selectSite(siteCard.dataset.clientId, siteCard.dataset.siteId, { focusMap:true });
        return;
      }
      const clientToggle = event.target.closest('[data-client-toggle-id]');
      if(clientToggle){
        toggleClientSites(clientToggle.dataset.clientToggleId);
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
      jobs: Array.isArray(raw.jobs) ? raw.jobs.map((row) => ({ id:String(row?.id || ''), clientId:String(row?.clientId || ''), projectId:String(row?.projectId || ''), siteId:String(row?.siteId || '') })) : [],
      jobAssignments: Array.isArray(raw.jobAssignments) ? raw.jobAssignments.map((row) => ({ id:String(row?.id || ''), jobId:String(row?.jobId || '') })) : [],
      samples: Array.isArray(raw.samples) ? raw.samples.map((row) => ({ id:String(row?.id || ''), jobId:String(row?.jobId || ''), clientId:String(row?.clientId || ''), siteId:String(row?.siteId || '') })) : []
    };
    ensureJobTypes(data);
    syncSiteProjectLinks(data);
    return data;
  }

  async function readRemoteData(){
    const [clients, projects, sites, siteProjects, jobTypes, jobs, jobAssignments, samples] = await Promise.all([
      window.appAuth.requestJson('/rest/v1/field_clients?select=*'),
      window.appAuth.requestJson('/rest/v1/field_projects?select=*'),
      window.appAuth.requestJson('/rest/v1/field_sites?select=*'),
      window.appAuth.requestJson('/rest/v1/field_site_projects?select=*'),
      window.appAuth.requestJson('/rest/v1/field_job_types?select=*').catch((error) => {
        console.warn('Unable to load SureMap job types. Using defaults.', error);
        return [];
      }),
      window.appAuth.requestJson('/rest/v1/field_jobs?select=id,client_id,project_id,site_id'),
      window.appAuth.requestJson('/rest/v1/field_job_assignments?select=id,job_id'),
      window.appAuth.requestJson('/rest/v1/field_samples?select=id,job_id,client_id,site_id')
    ]);
    const data = {
      clients: (clients || []).map((row) => normalizeClient(row, true)).sort(sortByClientName),
      projects: (projects || []).map((row) => normalizeProject(row, true)).sort(sortByProjectName),
      sites: (sites || []).map((row) => normalizeSite(row, true)).sort(sortBySiteName),
      siteProjects: (siteProjects || []).map((row) => normalizeSiteProject(row, true)).sort(sortBySiteProject),
      jobTypes: (jobTypes || []).map((row) => normalizeJobType(row, true)).filter((row) => row.jobTypeName).sort(sortByJobType),
      jobs: (jobs || []).map((row) => ({ id:String(row?.id || ''), clientId:String(row?.client_id || ''), projectId:String(row?.project_id || ''), siteId:String(row?.site_id || '') })),
      jobAssignments: (jobAssignments || []).map((row) => ({ id:String(row?.id || ''), jobId:String(row?.job_id || '') })),
      samples: (samples || []).map((row) => ({ id:String(row?.id || ''), jobId:String(row?.job_id || ''), clientId:String(row?.client_id || ''), siteId:String(row?.site_id || '') }))
    };
    ensureJobTypes(data);
    syncSiteProjectLinks(data);
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
      hqLongitude: normalizeNumber(fromRemote ? row?.hq_longitude : row?.hqLongitude),
      assetPhotoPath: String((fromRemote ? row?.logo_path : row?.assetPhotoPath) || '').trim(),
      assetPhotoDataUrl: fromRemote ? '' : String(row?.assetPhotoDataUrl || '').trim()
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
      sortOrder: normalizeNumber((fromRemote ? row?.sort_order : row?.sortOrder) ?? row?.sortOrder ?? row?.sort_order) || 0
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
    data.sites.forEach((site) => {
      const projectIds = data.siteProjects.filter((link) => link.siteId === site.id).map((link) => link.projectId);
      site.projectIds = [...new Set(projectIds.filter(Boolean))];
      site.projectId = site.projectIds[0] || site.projectId || '';
    });
  }

  function sortByClientName(left, right){ return left.clientName.localeCompare(right.clientName); }
  function sortByProjectName(left, right){ return left.projectName.localeCompare(right.projectName); }
  function sortBySiteName(left, right){ return left.siteName.localeCompare(right.siteName); }
  function sortBySiteProject(left, right){ return left.siteId.localeCompare(right.siteId) || left.projectId.localeCompare(right.projectId); }
  function sortByJobType(left, right){ return (Number(left.sortOrder || 0) - Number(right.sortOrder || 0)) || left.jobTypeName.localeCompare(right.jobTypeName); }

  function buildViewClients(data){
    const sitesByClient = new Map();
    data.sites.forEach((site) => {
      const list = sitesByClient.get(site.clientId) || [];
      const coords = parseGps(site.gpsCoordinates);
      const projectIds = getProjectIdsForSite(site.id, data);
      const projectNames = projectIds.map((projectId) => getProjectRecord(projectId, data)?.projectName || '').filter(Boolean);
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
      assetPhotoPath: client.assetPhotoPath || '',
      assetPhotoDataUrl: client.assetPhotoDataUrl || '',
      sublocations: (sitesByClient.get(client.id) || []).sort((a, b) => a.name.localeCompare(b.name))
    }));
  }

  function refreshFilteredView(options = {}){
    state.filteredClients = getFilteredClients();
    normalizeSelection(options.preserveSelection !== false);
    renderToolbarSummary();
    renderClientPicker();
    renderFilterRow();
    renderList();
    renderMapSummary();
    renderDetailPanel();
    hydrateAssetPhotoPreviews(document);
    if(options.syncMap !== false) syncMarkers();
    if(options.focusSelection !== false) focusSelectionOnMap();
  }

  function getFilteredClients(){
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

  function renderToolbarSummary(){
    if(state.activeSiteId){
      const site = getActiveSite();
      const client = getActiveClient();
      els['toolbar-summary'].textContent = `${client?.name || 'Client'} / ${site?.name || 'Site'} selected. Shared data updates write back to Field Ops.`;
      els['all-clients-btn'].classList.remove('active');
      return;
    }
    if(state.activeClientId){
      const client = getActiveClient();
      els['toolbar-summary'].textContent = `${client?.name || 'Client'} selected. SureMap adds mapped sites back to the shared Clients directory.`;
      els['all-clients-btn'].classList.remove('active');
      return;
    }
    els['toolbar-summary'].textContent = 'Shared client and site directory synced with Field Ops.';
    els['all-clients-btn'].classList.add('active');
  }

  function renderClientPicker(){
    const activeClient = getActiveClient();
    const value = state.clientPickerQuery || activeClient?.name || '';
    els['client-picker'].innerHTML = `
      <div class="client-picker-shell">
        <input id="suremap-client-picker-input" type="text" value="${esc(value)}" placeholder="${state.viewClients.length ? 'Search clients...' : 'No clients yet'}" autocomplete="off">
        <button class="act-btn client-picker-trigger" type="button" data-client-picker-trigger aria-label="Open client picker">Select</button>
        <div class="client-picker-results" id="suremap-client-picker-results">${getClientPickerResultsMarkup()}</div>
      </div>
    `;
  }

  function getClientPickerMatches(){
    const query = state.clientPickerQuery.trim().toLowerCase();
    return [...state.viewClients].sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''))).filter((client) => {
      if(!query) return true;
      const haystack = [client.name, client.sector, client.accountStatus, client.contact, client.phone, client.email, client.address].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  function getClientPickerResultsMarkup(){
    if(!state.viewClients.length) return '<div class="client-picker-empty">Add clients from the Clients page to start mapping.</div>';
    const matches = getClientPickerMatches();
    if(!matches.length) return '<div class="client-picker-empty">No matching clients.</div>';
    return matches.map((client) => {
      const active = client.id === state.activeClientId ? ' active' : '';
      return `<button type="button" class="client-picker-option${active}" data-client-picker-id="${esc(client.id)}"><strong>${esc(client.name || 'Unnamed client')}</strong><span>${esc(client.sector || 'No sector')} | ${esc(client.sublocations.length)} site${client.sublocations.length === 1 ? '' : 's'} | ${esc(client.accountStatus)}</span></button>`;
    }).join('');
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
    const activeClient = getActiveClient();
    state.clientPickerQuery = '';
    if(input) input.value = activeClient?.name || '';
  }

  function selectClientFromPicker(clientId){
    state.clientPickerQuery = '';
    state.searchQuery = '';
    closeClientPickerResults();
    selectClient(clientId, { focusMap:true });
  }

  function showAllClients(){
    state.activeClientId = '';
    state.activeSiteId = '';
    state.clientPickerQuery = '';
    state.searchQuery = '';
    refreshFilteredView({ syncMap:true, preserveSelection:true, focusSelection:false });
  }

  function renderFilterRow(){
    const tags = ['All', ...SITE_TYPE_OPTIONS];
    if(!tags.includes(state.filterTag)) state.filterTag = 'All';
    els['filter-row'].innerHTML = `
      <label class="label" for="site-type-filter">Site Type</label>
      <select class="suremap-filter-select" id="site-type-filter" data-site-type-filter>
        ${tags.map((tag) => `<option value="${esc(tag)}" ${state.filterTag === tag ? 'selected' : ''}>${esc(tag)}</option>`).join('')}
      </select>
    `;
  }

  function renderList(){
    if(!state.viewClients.length){
      els['list-summary'].textContent = '0 clients';
      els['client-list'].innerHTML = `<div class="empty-state"><strong>No shared clients yet</strong>Add clients from the Clients page to start mapping.</div>`;
      return;
    }
    const client = getActiveClient();
    if(!client){
      const visibleSites = state.filteredClients.flatMap((row) => (row.sublocations || []).map((site) => ({ client:row, site })));
      const totalSites = state.viewClients.reduce((sum, row) => sum + row.sublocations.length, 0);
      els['list-summary'].textContent = state.filterTag === 'All'
        ? `${totalSites} site${totalSites === 1 ? '' : 's'} across ${state.viewClients.length} clients`
        : `${visibleSites.length} visible / ${totalSites} sites`;
      if(!totalSites){
        els['client-list'].innerHTML = `<div class="empty-state"><strong>No sites yet</strong>Select a client and add a mapped site from the details card.</div>`;
        return;
      }
      if(!visibleSites.length){
        els['client-list'].innerHTML = `<div class="empty-state"><strong>No ${esc(state.filterTag)} sites</strong>Choose another site type or select a client to add a matching site.</div>`;
        return;
      }
      els['client-list'].innerHTML = state.filteredClients
        .filter((row) => (row.sublocations || []).length)
        .map((row) => renderClientSitesCardMarkup(row, getAvatarColor(row.id)))
        .join('');
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
    els['client-list'].innerHTML = renderClientSitesCardMarkup(visibleClient, getAvatarColor(client.id));
  }

  function toggleClientSites(clientId){
    const id = String(clientId || '');
    if(!id) return;
    if(state.expandedIds.has(id)) state.expandedIds.delete(id);
    else state.expandedIds.add(id);
    renderList();
    hydrateAssetPhotoPreviews(els['client-list']);
  }

  function renderClientLogoMarkup(client, color, className = 'suremap-client-logo'){
    const label = String(client?.name || 'C').slice(0, 2).toUpperCase();
    const alt = `Logo for ${client?.name || 'client'}`;
    if(client?.assetPhotoDataUrl) return `<img class="${esc(className)}" src="${esc(client.assetPhotoDataUrl)}" alt="${esc(alt)}">`;
    if(client?.assetPhotoPath && isRemoteMode()) return `<img class="${esc(className)}" src="" alt="${esc(alt)}" data-asset-photo-path="${esc(client.assetPhotoPath)}">`;
    return `<span class="${esc(className)} empty" style="background:${color}22;color:${color}">${esc(label)}</span>`;
  }

  function renderClientSitesCardMarkup(client, color){
    const siteCount = client.sublocations.length;
    const expanded = state.expandedIds.has(client.id);
    return `
      <div class="suremap-client-site-card ${expanded ? 'expanded' : 'collapsed'}" data-client-id="${esc(client.id)}">
        <button class="suremap-client-site-header" type="button" data-client-toggle-id="${esc(client.id)}" aria-expanded="${expanded ? 'true' : 'false'}">
          ${renderClientLogoMarkup(client, color)}
          <div class="suremap-site-copy">
            <div class="item-title">${esc(client.name)}</div>
            <div class="item-sub">${esc(siteCount)} site${siteCount === 1 ? '' : 's'}${client.sector ? ` | ${esc(client.sector)}` : ''}</div>
          </div>
        </button>
        <div class="suremap-client-site-list" ${expanded ? '' : 'hidden'}>
          ${client.sublocations.map((site) => renderGroupedSiteRowMarkup(client, site, color)).join('')}
        </div>
      </div>
    `;
  }

  function renderGroupedSiteRowMarkup(client, site, color){
    const active = state.activeSiteId === site.id;
    const locationLabel = site.address || site.coordsLabel || 'No location yet';
    return `
      <button class="suremap-grouped-site ${active ? 'active' : ''}" type="button" data-client-id="${esc(client.id)}" data-site-id="${esc(site.id)}">
        <span class="suremap-grouped-site-token" style="background:${color}22;color:${color}">${esc(getSiteIconToken(site.type))}</span>
        <span class="suremap-grouped-site-copy">
          <strong>${esc(site.name)}</strong>
          <span>${esc(site.type)} | ${esc(locationLabel)}</span>
        </span>
        <span class="status-badge ${esc(siteStatusClass(site.status))}">${esc(site.status)}</span>
      </button>
    `;
  }

  function renderSiteCardMarkup(client, site, color, showClient = false){
    const active = state.activeSiteId === site.id;
    const projectLabel = (site.projectNames || []).join(', ') || 'No linked project';
    return `
      <div class="suremap-site-card ${active ? 'active' : ''}" data-client-id="${esc(client.id)}" data-site-id="${esc(site.id)}">
        ${showClient ? renderClientLogoMarkup(client, color, 'suremap-client-logo small') : `<div class="suremap-site-icon" style="background:${color}22;color:${color}">${esc(getSiteIconToken(site.type))}</div>`}
        <div class="suremap-site-copy">
          <div class="item-title">${esc(site.name)}</div>
          ${showClient ? `<div class="item-sub">${esc(client.name)}</div>` : ''}
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
    const siteCount = state.filteredClients.reduce((sum, client) => sum + client.sublocations.length, 0);
    const providerLabel = state.mapProvider === 'google' ? 'SureMap' : 'Default map';
    els['map-summary'].textContent = `${siteCount} site${siteCount === 1 ? '' : 's'} visible | ${providerLabel}`;
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
    const color = getAvatarColor(client.id);
    return `
      <div class="suremap-detail-card">
        <div class="suremap-detail-title">
          <div class="suremap-detail-heading">
            ${renderClientLogoMarkup(client, color, 'suremap-client-logo large')}
            <div>
              <div class="item-title">${esc(client.name)}</div>
              <div class="item-sub">${esc(client.sublocations.length)} mapped site${client.sublocations.length === 1 ? '' : 's'}</div>
            </div>
          </div>
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
    const color = getAvatarColor(client.id);
    return `
      <div class="suremap-detail-card">
        <div class="suremap-detail-title">
          <div class="suremap-detail-heading">
            ${renderClientLogoMarkup(client, color, 'suremap-client-logo large')}
            <div>
              <div class="item-title">${esc(site.name)}</div>
              <div class="item-sub">${esc(client.name)}</div>
            </div>
          </div>
          <div class="tag-row">
            <span class="status-badge ${esc(siteStatusClass(site.status))}">${esc(site.status)}</span>
            <span class="tag-chip">${esc(site.type)}</span>
          </div>
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

  function syncMarkers(){
    if(!state.map) return;
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

  function encodeStoragePath(path){
    return String(path || '').split('/').map((segment) => encodeURIComponent(segment)).join('/');
  }

  async function ensureAssetPhotoUrl(record){
    if(!record) return '';
    if(record.assetPhotoDataUrl) return record.assetPhotoDataUrl;
    if(!record.assetPhotoPath || !isRemoteMode()) return '';
    if(remoteAssetPhotoUrlCache.has(record.assetPhotoPath)) return remoteAssetPhotoUrlCache.get(record.assetPhotoPath);
    if(remoteAssetPhotoLoadPromises.has(record.assetPhotoPath)) return remoteAssetPhotoLoadPromises.get(record.assetPhotoPath);
    const promise = (async () => {
      const response = await window.appAuth.fetch(`/storage/v1/object/authenticated/${FIELD_ASSET_BUCKET}/${encodeStoragePath(record.assetPhotoPath)}`, { headers:{ Accept:'*/*' } });
      if(!response.ok) throw new Error(`Logo request failed (${response.status}).`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      remoteAssetPhotoUrlCache.set(record.assetPhotoPath, url);
      return url;
    })();
    remoteAssetPhotoLoadPromises.set(record.assetPhotoPath, promise);
    try {
      return await promise;
    } finally {
      remoteAssetPhotoLoadPromises.delete(record.assetPhotoPath);
    }
  }

  async function hydrateAssetPhotoPreviews(scope = document){
    const nodes = Array.from(scope.querySelectorAll('img[data-asset-photo-path]'));
    await Promise.all(nodes.map(async (node) => {
      const path = node.dataset.assetPhotoPath || '';
      if(!path || node.getAttribute('src')) return;
      try {
        node.src = await ensureAssetPhotoUrl({ assetPhotoPath:path });
      } catch (error){
        console.warn('Unable to load SureMap client logo:', error);
        node.classList.add('asset-photo-error');
      }
    }));
  }

  function svgToDataUri(svg){
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function makeMarkerIcon(color, isSite){
    const size = isSite ? [22, 30] : [28, 36];
    const anchor = isSite ? [11, 30] : [14, 36];
    const inner = isSite ? 4 : 5;
    const svg = `<svg width="${size[0]}" height="${size[1]}" viewBox="0 0 ${size[0]} ${size[1]}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M${size[0] / 2} 0C${isSite ? '4.9 0 0 4.9 0 11c0 8.3 11 19 11 19s11-10.7 11-19C22 4.9 17.1 0 11 0Z' : '6.7 0 0 6.7 0 14.5c0 10.5 14 21.5 14 21.5s14-11 14-21.5C28 6.7 21.3 0 14 0Z'}" fill="${color}"/><circle cx="${size[0] / 2}" cy="${isSite ? 11 : 14}" r="${inner}" fill="#071009"/></svg>`;
    if(state.mapProvider === 'google'){
      return {
        url: svgToDataUri(svg),
        scaledSize: new google.maps.Size(size[0], size[1]),
        anchor: new google.maps.Point(anchor[0], anchor[1])
      };
    }
    return L.divIcon({
      className: '',
      iconSize: size,
      iconAnchor: anchor,
      popupAnchor: [0, isSite ? -26 : -32],
      html: svg
    });
  }

  function makeHomeIcon(){
    const svg = '<svg width="30" height="34" viewBox="0 0 30 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 1 2 12v20h26V12L15 1Z" fill="#ffd166"/><path d="M10 32V19h10v13" fill="#071009"/><path d="M8 15h14" stroke="#071009" stroke-width="2"/></svg>';
    if(state.mapProvider === 'google'){
      return {
        url: svgToDataUri(svg),
        scaledSize: new google.maps.Size(30, 34),
        anchor: new google.maps.Point(15, 34)
      };
    }
    return L.divIcon({
      className: '',
      iconSize: [30, 34],
      iconAnchor: [15, 34],
      popupAnchor: [0, -30],
      html: svg
    });
  }

  function focusSelectionOnMap(){
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
    return state.filteredClients.flatMap((client) => (client.sublocations || []).map((site) => ({ client, site })))
      .filter(({ site }) => hasUsableCoords(site.lat, site.lng));
  }

  function fitVisibleSites(){
    if(!state.map) return;
    const visibleSites = getVisibleMappedSites();
    if(!visibleSites.length){
      alert('No visible mapped sites have GPS coordinates to fit on the map.');
      return;
    }
    els['map-placeholder'].classList.add('hidden');
    if(state.mapProvider === 'google'){
      if(visibleSites.length === 1){
        const site = visibleSites[0].site;
        state.map.panTo({ lat:site.lat, lng:site.lng });
        state.map.setZoom(13);
        return;
      }
      const bounds = new google.maps.LatLngBounds();
      visibleSites.forEach(({ site }) => bounds.extend({ lat:site.lat, lng:site.lng }));
      state.map.fitBounds(bounds);
      return;
    }
    const points = visibleSites.map(({ site }) => [site.lat, site.lng]);
    if(points.length === 1){
      state.map.flyTo(points[0], 13, { animate:true, duration:.6 });
      return;
    }
    state.map.fitBounds(L.latLngBounds(points), { padding:[28, 28] });
  }

  function selectClient(clientId, options = {}){
    const client = state.viewClients.find((row) => row.id === String(clientId));
    if(!client) return;
    state.activeClientId = client.id;
    state.activeSiteId = '';
    state.expandedIds.add(client.id);
    state.filteredClients = getFilteredClients();
    renderClientPicker();
    renderFilterRow();
    renderList();
    renderToolbarSummary();
    renderDetailPanel();
    hydrateAssetPhotoPreviews(document);
    syncMarkers();
    if(options.focusMap !== false) focusSelectionOnMap();
  }

  function selectSite(clientId, siteId, options = {}){
    const sourceClient = state.viewClients.find((row) => row.id === String(clientId));
    const sourceSite = sourceClient?.sublocations.find((row) => row.id === String(siteId));
    if(!sourceClient || !sourceSite) return;
    state.activeClientId = sourceClient.id;
    state.activeSiteId = sourceSite.id;
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
    hydrateAssetPhotoPreviews(document);
    syncMarkers();
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
  function getProjectRecord(id, data = state.data){ return (data.projects || []).find((row) => row.id === String(id)) || null; }
  function getSiteRecord(id){ return state.data.sites.find((row) => row.id === String(id)) || null; }
  function getProjectsForClient(clientId){ return state.data.projects.filter((project) => project.clientId === String(clientId)).sort(sortByProjectName); }
  function getProjectIdsForSite(siteId, data = state.data){
    const ids = (data.siteProjects || []).filter((row) => row.siteId === String(siteId)).map((row) => row.projectId);
    const legacyProjectId = (data.sites || []).find((row) => row.id === String(siteId))?.projectId || '';
    if(legacyProjectId) ids.push(legacyProjectId);
    return [...new Set(ids.filter(Boolean))];
  }
  function getLinkedProjectsForSite(siteId, data = state.data){
    return getProjectIdsForSite(siteId, data).map((projectId) => getProjectRecord(projectId, data)).filter(Boolean).sort(sortByProjectName);
  }
  function getClientAddress(id){ const client = getClientRecord(id); return formatAddress(client?.hqStreet, client?.hqCity, client?.hqState, client?.hqZip); }
  function getSiteCoords(id){ return getSiteRecord(id)?.gpsCoordinates || ''; }
  function getSiteDirections(id){ const site = getSiteRecord(id); return site?.physicalAddress || site?.gpsCoordinates || ''; }
  function openClientInDirectory(clientId){
    const suffix = clientId ? `#client=${encodeURIComponent(clientId)}` : '';
    window.location.href = `../clients.html${suffix}`;
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
    const jobIds = state.data.jobs.filter((job) => job.siteId === siteId).map((job) => job.id);
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
