(function(){
  'use strict';

  const SITE_STATUS_OPTIONS = ['Active', 'Restricted', 'Inactive'];
  const HOME_BASE = { lat:40.435349, lng:-80.130022 };

  let ctx = null;
  let draft = null;
  let addressDraft = null;
  let addressEditDraft = null;
  let autocompleteTimer = null;
  let autocompleteSeq = 0;
  let placesSessionToken = null;
  let googleMapsLoadPromise = null;

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  }

  function normalizeNumber(value){
    if(value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeStringArray(value){
    if(Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
    return String(value || '').split(/[,|]/).map((item) => item.trim()).filter(Boolean);
  }

  function normalizeCatalogKey(value){
    return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  }

  function normalizeSiteType(value){
    if(typeof ctx?.resolveSiteTypeValue === 'function') return ctx.resolveSiteTypeValue(value);
    return normalizeCatalogKey(value) || 'OTHER';
  }

  function normalizeSiteStatus(value){
    return SITE_STATUS_OPTIONS.includes(value) ? value : 'Active';
  }

  function hasUsableCoords(lat, lng){
    const parsedLat = normalizeNumber(lat);
    const parsedLng = normalizeNumber(lng);
    return parsedLat !== null && parsedLng !== null && Math.abs(parsedLat) <= 90 && Math.abs(parsedLng) <= 180;
  }

  function formatGps(lat, lng){
    return hasUsableCoords(lat, lng) ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : '';
  }

  function parseGps(value){
    const parts = String(value || '').split(',').map((part) => normalizeNumber(part.trim()));
    if(parts.length < 2) return null;
    return hasUsableCoords(parts[0], parts[1]) ? { lat:parts[0], lng:parts[1] } : null;
  }

  function formatAddress(street, city, stateCode, zip){
    const cityLine = [city, stateCode].filter(Boolean).join(', ');
    return [street, cityLine, zip].filter(Boolean).join(' ').trim();
  }

  function splitAddress(address){
    const raw = String(address || '').trim();
    if(!raw) return { street:'', city:'', state:'', zip:'' };
    const zipMatch = raw.match(/\b(\d{5}(?:-\d{4})?)$/);
    const zip = zipMatch ? zipMatch[1] : '';
    const withoutZip = zip ? raw.slice(0, -zip.length).trim() : raw;
    const stateMatch = withoutZip.match(/\b([A-Z]{2})$/i);
    const state = stateMatch ? stateMatch[1].toUpperCase() : '';
    const withoutState = state ? withoutZip.slice(0, -state.length).replace(/,\s*$/, '').trim() : withoutZip;
    const commaParts = withoutState.split(',').map((part) => part.trim()).filter(Boolean);
    if(commaParts.length >= 2) return { street:commaParts.slice(0, -1).join(', '), city:commaParts[commaParts.length - 1], state, zip };
    const tokens = withoutState.split(/\s+/);
    const city = tokens.length > 3 ? tokens.slice(-2).join(' ') : '';
    const street = city ? tokens.slice(0, -2).join(' ') : withoutState;
    return { street, city, state, zip };
  }

  function getSiteTypeOptions(currentValue = ''){
    if(typeof ctx?.getSiteTypeOptions === 'function'){
      const options = ctx.getSiteTypeOptions(currentValue) || [];
      if(options.length) return options;
    }
    const rows = Array.isArray(ctx?.data?.siteTypes) ? ctx.data.siteTypes : [];
      const options = rows
      .filter((row) => row?.isActive !== false || normalizeSiteType(row?.siteTypeKey) === normalizeSiteType(currentValue))
      .sort((a, b) => String(a.siteTypeName || a.siteTypeKey || '').localeCompare(String(b.siteTypeName || b.siteTypeKey || ''), undefined, { sensitivity:'base' }))
      .map((row) => ({ value:String(row.siteTypeKey || ''), label:String(row.siteTypeName || 'Unnamed site type') }))
      .filter((option) => option.value && option.label);
    return options.length ? options : [{ value:normalizeSiteType(currentValue), label:'Other' }];
  }

  function getSiteTypeDefaultJobTypeLabels(siteType){
    if(typeof ctx?.getSiteTypeDefaultJobTypes === 'function') return normalizeStringArray(ctx.getSiteTypeDefaultJobTypes(siteType));
    const siteTypeKey = normalizeSiteType(siteType);
    const links = Array.isArray(ctx?.data?.siteTypeJobTypes) ? ctx.data.siteTypeJobTypes : [];
    const jobTypes = Array.isArray(ctx?.data?.jobTypes) ? ctx.data.jobTypes : [];
    return links
      .filter((link) => normalizeCatalogKey(link.siteTypeKey) === siteTypeKey)
      .map((link) => jobTypes.find((jobType) => normalizeCatalogKey(jobType.jobTypeKey) === normalizeCatalogKey(link.jobTypeKey))?.jobTypeName || 'Unknown job type')
      .filter(Boolean);
  }

  function showStatus(type, label){
    if(typeof ctx?.showStatus === 'function') ctx.showStatus(type, label);
  }

  function ensureModal(){
    if(document.getElementById('site-editor-overlay')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal-overlay site-editor-overlay" id="site-editor-overlay">
        <div class="modal site-editor-card">
          <div class="modal-header">
            <h3 id="site-editor-title">Add Site</h3>
            <button class="modal-close" type="button" data-site-editor-close>X</button>
          </div>
          <div class="modal-body" id="site-editor-body"></div>
          <div class="modal-footer">
            <button class="btn-del" type="button" id="site-editor-delete" style="display:none;">Delete</button>
            <button class="btn-cancel" type="button" data-site-editor-close>Cancel</button>
            <button class="btn-save" type="button" id="site-editor-save">Save</button>
          </div>
        </div>
      </div>
      <div class="modal-overlay site-editor-overlay" id="site-editor-address-overlay">
        <div class="modal site-editor-card">
          <div class="modal-header">
            <h3>Edit Address</h3>
            <button class="modal-close" type="button" data-site-editor-address-close>X</button>
          </div>
          <div class="modal-body" id="site-editor-address-body"></div>
          <div class="modal-footer">
            <button class="btn-cancel" type="button" data-site-editor-address-close>Cancel</button>
            <button class="btn-save" type="button" id="site-editor-address-save">Use Address</button>
          </div>
        </div>
      </div>
    `;
    document.body.append(...Array.from(wrapper.children));
    document.getElementById('site-editor-overlay').addEventListener('click', (event) => {
      if(event.target.id === 'site-editor-overlay') close();
    });
    document.getElementById('site-editor-address-overlay').addEventListener('click', (event) => {
      if(event.target.id === 'site-editor-address-overlay') closeAddressModal();
    });
    document.addEventListener('keydown', (event) => {
      if(event.key !== 'Escape') return;
      if(document.getElementById('site-editor-address-overlay')?.classList.contains('open')) closeAddressModal();
      else if(document.getElementById('site-editor-overlay')?.classList.contains('open')) close();
    });
  }

  function getSite(siteId){
    return (ctx?.data?.sites || []).find((row) => String(row.id || '') === String(siteId || '')) || null;
  }

  function getProjectsForClient(clientId){
    if(typeof ctx?.getProjectsForClient === 'function') return ctx.getProjectsForClient(clientId) || [];
    return (ctx?.data?.projects || []).filter((project) => String(project.clientId || '') === String(clientId || ''));
  }

  function getProjectIdsForSite(siteId){
    if(typeof ctx?.getProjectIdsForSite === 'function') return normalizeStringArray(ctx.getProjectIdsForSite(siteId));
    const site = getSite(siteId);
    return normalizeStringArray(site?.projectIds).concat(normalizeStringArray(site?.projectId)).filter((value, index, list) => list.indexOf(value) === index);
  }

  function getContactsForSite(siteId){
    if(typeof ctx?.getContactsForSite === 'function') return ctx.getContactsForSite(siteId) || [];
    const site = getSite(siteId);
    if(!site) return [];
    const linkedContactIds = new Set((ctx?.data?.contactSites || [])
      .filter((row) => String(row.siteId || row.site_id || '') === String(site.id || ''))
      .map((row) => String(row.contactId || row.contact_id || ''))
      .filter(Boolean));
    return (ctx?.data?.contacts || [])
      .filter((contact) => {
        if(String(contact.clientId || '') !== String(site.clientId || '')) return false;
        const contactSiteIds = normalizeStringArray(contact.siteIds).concat(normalizeStringArray(contact.siteId));
        return linkedContactIds.has(String(contact.id || '')) || contactSiteIds.includes(String(site.id || ''));
      })
      .sort((a, b) => String(a.contactName || '').localeCompare(String(b.contactName || '')));
  }

  function getContactOptionValue(contact){
    const firstName = String(contact?.contactFirstName || '').trim();
    const lastName = String(contact?.contactLastName || '').trim();
    const splitName = [firstName, lastName].filter(Boolean).join(' ');
    return String(contact?.contactName || contact?.name || splitName || 'Unnamed contact').trim() || 'Unnamed contact';
  }

  function renderSiteContactOptions(){
    const contacts = getContactsForSite(draft.id);
    const currentValue = String(draft.clientSiteContact || '').trim();
    const options = [{ value:'', label:contacts.length ? 'Select linked contact' : 'No linked contacts for this site' }];
    const seenValues = new Set(['']);
    contacts.forEach((contact) => {
      const value = getContactOptionValue(contact);
      if(seenValues.has(value)) return;
      seenValues.add(value);
      const title = String(contact.contactRole || '').trim();
      options.push({ value, label:title ? `${value} | ${title}` : value });
    });
    if(currentValue && !seenValues.has(currentValue)){
      options.push({ value:currentValue, label:`Current: ${currentValue}` });
    }
    return options.map((option) => `<option value="${esc(option.value)}" ${currentValue === option.value ? 'selected' : ''}>${esc(option.label)}</option>`).join('');
  }

  function normalizeProjectOption(project){
    return {
      id:String(project?.id || ''),
      name:String(project?.projectName || project?.name || 'Unnamed project'),
      status:String(project?.projectStatus || project?.status || 'Active'),
      serviceScope:String(project?.serviceScope || 'Field')
    };
  }

  function buildDraft(siteId, clientId){
    const existing = getSite(siteId);
    const resolvedClientId = String(clientId || existing?.clientId || '');
    const coords = parseGps(existing?.gpsCoordinates);
    const address = splitAddress(existing?.physicalAddress);
    let projectIds = existing ? getProjectIdsForSite(existing.id) : [];
    if(!projectIds.length){
      const projects = getProjectsForClient(resolvedClientId);
      if(projects.length === 1) projectIds = [String(projects[0].id || '')].filter(Boolean);
    }
    draft = {
      ...(existing || {}),
      id:String(existing?.id || ''),
      clientId:resolvedClientId,
      projectId:String(existing?.projectId || projectIds[0] || ''),
      projectIds,
      siteName:String(existing?.siteName || ''),
      siteType:normalizeSiteType(existing?.siteType || 'OTHER'),
      siteStatus:normalizeSiteStatus(existing?.siteStatus || 'Active'),
      standardJobTypes:String(existing?.standardJobTypes || ''),
      notes:String(existing?.notes || ''),
      clientSiteContact:String(existing?.clientSiteContact || ''),
      accessInstructions:String(existing?.accessInstructions || ''),
      safetyPpeNotes:String(existing?.safetyPpeNotes || ''),
      gateCodeEntryRequirements:String(existing?.gateCodeEntryRequirements || ''),
      accessRequired:existing?.accessRequired === true || String(existing?.accessRequired || '').toLowerCase() === 'true',
      approvedAccessLabel:String(existing?.approvedAccessLabel || ''),
      approvedAccessLatitude:normalizeNumber(existing?.approvedAccessLatitude),
      approvedAccessLongitude:normalizeNumber(existing?.approvedAccessLongitude),
      approvedAccessNotes:String(existing?.approvedAccessNotes || ''),
      physicalAddress:String(existing?.physicalAddress || ''),
      countyState:String(existing?.countyState || ''),
      gpsCoordinates:String(existing?.gpsCoordinates || '')
    };
    addressDraft = {
      gpsOnly:!draft.physicalAddress && hasUsableCoords(coords?.lat, coords?.lng),
      search:draft.physicalAddress,
      street:address.street,
      city:address.city,
      state:address.state || String(draft.countyState || '').split(',').pop().trim().toUpperCase(),
      zip:address.zip,
      lat:hasUsableCoords(coords?.lat, coords?.lng) ? coords.lat : '',
      lng:hasUsableCoords(coords?.lat, coords?.lng) ? coords.lng : ''
    };
  }

  function open(options = {}){
    ensureModal();
    ctx = options;
    buildDraft(options.siteId, options.clientId);
    render();
    document.getElementById('site-editor-overlay').classList.add('open');
    setTimeout(() => document.getElementById('site-editor-site-name')?.focus(), 40);
  }

  function close(){
    document.getElementById('site-editor-overlay')?.classList.remove('open');
    closeAddressModal();
  }

  function closeAddressModal(){
    document.getElementById('site-editor-address-overlay')?.classList.remove('open');
  }

  function render(){
    const siteTypeOptions = getSiteTypeOptions(draft.siteType);
    const siteTypeDefaults = getSiteTypeDefaultJobTypeLabels(draft.siteType);
    document.getElementById('site-editor-title').textContent = draft.id ? 'Edit Site' : 'Add Site';
    document.getElementById('site-editor-delete').style.display = draft.id ? '' : 'none';
    document.getElementById('site-editor-body').innerHTML = `
      <form class="site-editor-form" id="site-editor-form" novalidate>
        <div class="form-group full">
          <label class="form-label">Linked Projects</label>
          <div class="site-editor-project-options">${renderProjectOptions()}</div>
          <div class="form-hint">${esc(getProjectHint())}</div>
        </div>
        <div class="form-group full">
          <label class="form-label" for="site-editor-site-name">Site Name</label>
          <input class="form-input" id="site-editor-site-name" type="text" value="${esc(draft.siteName)}" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="site-editor-site-type">Site Type</label>
          <select class="form-input" id="site-editor-site-type">${siteTypeOptions.map((option) => `<option value="${esc(option.value)}" ${draft.siteType === option.value ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select>
          <div class="form-hint">${esc(siteTypeDefaults.length ? `Default job types: ${siteTypeDefaults.join(', ')}` : 'No default job types assigned for this site type.')}</div>
        </div>
        <div class="form-group">
          <label class="form-label" for="site-editor-site-status">Site Status</label>
          <select class="form-input" id="site-editor-site-status">${SITE_STATUS_OPTIONS.map((value) => `<option value="${esc(value)}" ${draft.siteStatus === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select>
        </div>
        <div class="form-group full">
          <label class="form-label" for="site-editor-notes">Notes</label>
          <textarea class="form-input" id="site-editor-notes">${esc(draft.notes)}</textarea>
        </div>
        <div class="form-section">
          <h4>Address And Coordinates</h4>
        </div>
        <div class="form-group full">
          <label class="form-label">Site Address</label>
          <div class="site-editor-address-summary">${renderAddressSummary()}</div>
          <button class="act-btn" type="button" id="site-editor-edit-address">Edit Address</button>
        </div>
        <div class="form-section">
          <h4>Approved Access</h4>
        </div>
        <div class="form-group full">
          <label class="site-editor-toggle-option" for="site-editor-access-required">
            <input id="site-editor-access-required" type="checkbox" ${draft.accessRequired ? 'checked' : ''}>
            <span>Approved access point required for routing</span>
          </label>
        </div>
        <div class="form-group">
          <label class="form-label" for="site-editor-approved-access-label">Access Point Label</label>
          <input class="form-input" id="site-editor-approved-access-label" type="text" value="${esc(draft.approvedAccessLabel)}" placeholder="Main gate, south lease road">
        </div>
        <div class="form-group">
          <label class="form-label" for="site-editor-approved-access-lat">Access Latitude</label>
          <input class="form-input" id="site-editor-approved-access-lat" type="number" step="any" value="${esc(draft.approvedAccessLatitude ?? '')}">
        </div>
        <div class="form-group">
          <label class="form-label" for="site-editor-approved-access-lng">Access Longitude</label>
          <input class="form-input" id="site-editor-approved-access-lng" type="number" step="any" value="${esc(draft.approvedAccessLongitude ?? '')}">
        </div>
        <div class="form-group full">
          <label class="form-label" for="site-editor-approved-access-notes">Access Notes</label>
          <textarea class="form-input" id="site-editor-approved-access-notes">${esc(draft.approvedAccessNotes)}</textarea>
        </div>
        <div class="form-section">
          <h4>Operational Details</h4>
        </div>
        <div class="form-group full">
          <label class="form-label" for="site-editor-contact">Client Site Contact</label>
          <select class="form-input" id="site-editor-contact">${renderSiteContactOptions()}</select>
          <div class="form-hint">Contacts appear here after they are linked to this site in the contact record.</div>
        </div>
        <div class="form-group full">
          <label class="form-label" for="site-editor-access">Access Instructions</label>
          <textarea class="form-input" id="site-editor-access">${esc(draft.accessInstructions)}</textarea>
        </div>
        <div class="form-group full">
          <label class="form-label" for="site-editor-safety">Safety / PPE Notes</label>
          <textarea class="form-input" id="site-editor-safety">${esc(draft.safetyPpeNotes)}</textarea>
        </div>
        <div class="form-group full">
          <label class="form-label" for="site-editor-gate">Gate Code / Entry Requirements</label>
          <textarea class="form-input" id="site-editor-gate">${esc(draft.gateCodeEntryRequirements)}</textarea>
        </div>
      </form>
    `;
    bindEditorControls();
  }

  function getProjectHint(){
    const projects = getProjectsForClient(draft.clientId);
    if(!projects.length) return 'Create a project before adding a site/location.';
    return projects.length === 1 ? 'This client has one project, so it is selected automatically.' : 'Select every project that uses this site. The first selected project is saved as the primary site project.';
  }

  function renderProjectOptions(){
    const projects = getProjectsForClient(draft.clientId).map(normalizeProjectOption);
    const selected = new Set(normalizeStringArray(draft.projectIds));
    if(!projects.length) return '<div class="empty-state">No projects exist for this client yet.</div>';
    return `
      <div class="site-editor-project-select" data-site-editor-project-select>
        <button class="site-editor-project-trigger" type="button" id="site-editor-project-trigger" aria-expanded="false">
          <span data-site-editor-project-summary>${esc(getProjectSelectionSummary(projects))}</span>
          <span class="site-editor-project-caret">v</span>
        </button>
        <div class="site-editor-project-selected" data-site-editor-project-selected>${esc(getProjectSelectionDetail(projects))}</div>
        <div class="site-editor-project-menu" data-site-editor-project-menu>
          ${projects.map((project) => `
            <label class="site-editor-project-option">
              <input type="checkbox" value="${esc(project.id)}" ${selected.has(project.id) ? 'checked' : ''} data-site-editor-project>
              <span>
                <strong>${esc(project.name)}</strong>
                <small>${esc(project.status)} | ${esc(project.serviceScope)}</small>
              </span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }

  function getProjectSelectionNames(projects){
    const selected = new Set(normalizeStringArray(draft.projectIds));
    return projects.filter((project) => selected.has(project.id)).map((project) => project.name);
  }

  function getProjectSelectionSummary(projects){
    const names = getProjectSelectionNames(projects);
    if(!names.length) return 'Select linked projects';
    if(names.length === 1) return names[0];
    return `${names.length} projects selected`;
  }

  function getProjectSelectionDetail(projects){
    const names = getProjectSelectionNames(projects);
    return names.length ? names.join(', ') : 'No linked projects selected';
  }

  function updateProjectSelectionSummary(){
    const projects = getProjectsForClient(draft.clientId).map(normalizeProjectOption);
    const summary = document.querySelector('[data-site-editor-project-summary]');
    const detail = document.querySelector('[data-site-editor-project-selected]');
    if(summary) summary.textContent = getProjectSelectionSummary(projects);
    if(detail) detail.textContent = getProjectSelectionDetail(projects);
  }

  function renderAddressSummary(){
    const lat = normalizeNumber(addressDraft.lat);
    const lng = normalizeNumber(addressDraft.lng);
    const address = formatAddress(addressDraft.street, addressDraft.city, addressDraft.state, addressDraft.zip);
    const coords = hasUsableCoords(lat, lng) ? formatGps(lat, lng) : '';
    if(addressDraft.gpsOnly){
      const detail = [coords || 'No coordinates set', addressDraft.state].filter(Boolean).join(' | ');
      return `<strong>GPS override</strong><span>${esc(detail)}</span>`;
    }
    return address ? `<strong>${esc(address)}</strong>${coords ? `<span>${esc(coords)}</span>` : ''}` : '<strong>No address set</strong><span>Use Edit Address when this site needs map coordinates.</span>';
  }

  function syncDraftFromDom(){
    draft.siteName = document.getElementById('site-editor-site-name')?.value.trim() || '';
    draft.siteType = normalizeSiteType(document.getElementById('site-editor-site-type')?.value || draft.siteType);
    draft.siteStatus = normalizeSiteStatus(document.getElementById('site-editor-site-status')?.value || draft.siteStatus);
    draft.notes = document.getElementById('site-editor-notes')?.value.trim() || '';
    draft.clientSiteContact = document.getElementById('site-editor-contact')?.value.trim() || '';
    draft.accessRequired = document.getElementById('site-editor-access-required')?.checked === true;
    draft.approvedAccessLabel = document.getElementById('site-editor-approved-access-label')?.value.trim() || '';
    draft.approvedAccessLatitude = normalizeNumber(document.getElementById('site-editor-approved-access-lat')?.value);
    draft.approvedAccessLongitude = normalizeNumber(document.getElementById('site-editor-approved-access-lng')?.value);
    draft.approvedAccessNotes = document.getElementById('site-editor-approved-access-notes')?.value.trim() || '';
    draft.accessInstructions = document.getElementById('site-editor-access')?.value.trim() || '';
    draft.safetyPpeNotes = document.getElementById('site-editor-safety')?.value.trim() || '';
    draft.gateCodeEntryRequirements = document.getElementById('site-editor-gate')?.value.trim() || '';
    draft.projectIds = Array.from(document.querySelectorAll('[data-site-editor-project]:checked')).map((node) => node.value).filter(Boolean);
    draft.projectId = draft.projectIds[0] || '';
  }

  function bindEditorControls(){
    document.querySelectorAll('[data-site-editor-close]').forEach((button) => button.onclick = close);
    document.getElementById('site-editor-save').onclick = save;
    document.getElementById('site-editor-delete').onclick = remove;
    document.getElementById('site-editor-form').onsubmit = (event) => { event.preventDefault(); save(); };
    document.getElementById('site-editor-edit-address').onclick = openAddressModal;
    document.getElementById('site-editor-site-type').onchange = () => {
      syncDraftFromDom();
      render();
    };
    document.getElementById('site-editor-project-trigger')?.addEventListener('click', () => {
      const select = document.querySelector('[data-site-editor-project-select]');
      const isOpen = select?.classList.toggle('open');
      document.getElementById('site-editor-project-trigger')?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    document.querySelector('[data-site-editor-project-menu]')?.addEventListener('click', (event) => event.stopPropagation());
    document.querySelectorAll('[data-site-editor-project]').forEach((input) => {
      input.onchange = () => {
        syncDraftFromDom();
        updateProjectSelectionSummary();
      };
    });
  }

  function openAddressModal(){
    addressEditDraft = { ...addressDraft };
    renderAddressModal();
    document.getElementById('site-editor-address-overlay').classList.add('open');
    setTimeout(() => document.getElementById(addressEditDraft.gpsOnly ? 'site-editor-address-lat' : 'site-editor-address-search')?.focus(), 40);
  }

  function renderAddressModal(){
    document.getElementById('site-editor-address-body').innerHTML = `
      <form class="site-editor-form" id="site-editor-address-form" novalidate>
        <div class="form-group full">
          <label class="site-editor-toggle-option" for="site-editor-address-gps-mode">
            <input id="site-editor-address-gps-mode" type="checkbox" ${addressEditDraft.gpsOnly ? 'checked' : ''}>
            <span>Use GPS coordinates</span>
          </label>
        </div>
        <div class="form-group full site-editor-autocomplete-wrap ${addressEditDraft.gpsOnly ? 'site-editor-disabled' : ''}" data-address-field>
          <label class="form-label" for="site-editor-address-search">Address Search</label>
          <input class="form-input" id="site-editor-address-search" type="text" autocomplete="off" value="${esc(addressEditDraft.search || formatAddress(addressEditDraft.street, addressEditDraft.city, addressEditDraft.state, addressEditDraft.zip))}" ${addressEditDraft.gpsOnly ? 'disabled' : ''}>
          <div class="site-editor-autocomplete" id="site-editor-address-results"></div>
        </div>
        <div class="form-group full ${addressEditDraft.gpsOnly ? 'site-editor-disabled' : ''}" data-address-field>
          <label class="form-label" for="site-editor-address-street">Street Address</label>
          <input class="form-input" id="site-editor-address-street" type="text" value="${esc(addressEditDraft.street)}" ${addressEditDraft.gpsOnly ? 'disabled' : ''}>
        </div>
        <div class="form-group ${addressEditDraft.gpsOnly ? 'site-editor-disabled' : ''}" data-address-field>
          <label class="form-label" for="site-editor-address-city">City</label>
          <input class="form-input" id="site-editor-address-city" type="text" value="${esc(addressEditDraft.city)}" ${addressEditDraft.gpsOnly ? 'disabled' : ''}>
        </div>
        <div class="form-group" data-state-field>
          <label class="form-label" for="site-editor-address-state">State</label>
          <input class="form-input" id="site-editor-address-state" type="text" maxlength="2" value="${esc(addressEditDraft.state)}">
        </div>
        <div class="form-group ${addressEditDraft.gpsOnly ? 'site-editor-disabled' : ''}" data-address-field>
          <label class="form-label" for="site-editor-address-zip">ZIP</label>
          <input class="form-input" id="site-editor-address-zip" type="text" value="${esc(addressEditDraft.zip)}" ${addressEditDraft.gpsOnly ? 'disabled' : ''}>
        </div>
        <div class="form-group ${addressEditDraft.gpsOnly ? '' : 'site-editor-disabled'}" data-gps-field>
          <label class="form-label" for="site-editor-address-lat">Latitude</label>
          <input class="form-input" id="site-editor-address-lat" type="number" step="any" value="${esc(addressEditDraft.lat)}" ${addressEditDraft.gpsOnly ? '' : 'disabled'}>
        </div>
        <div class="form-group ${addressEditDraft.gpsOnly ? '' : 'site-editor-disabled'}" data-gps-field>
          <label class="form-label" for="site-editor-address-lng">Longitude</label>
          <input class="form-input" id="site-editor-address-lng" type="number" step="any" value="${esc(addressEditDraft.lng)}" ${addressEditDraft.gpsOnly ? '' : 'disabled'}>
        </div>
      </form>
    `;
    document.querySelectorAll('[data-site-editor-address-close]').forEach((button) => button.onclick = closeAddressModal);
    document.getElementById('site-editor-address-save').onclick = applyAddressModal;
    document.getElementById('site-editor-address-form').onsubmit = (event) => { event.preventDefault(); applyAddressModal(); };
    document.getElementById('site-editor-address-gps-mode').onchange = handleAddressModeChange;
    bindAddressAutocomplete();
  }

  function syncAddressEditDraft(){
    addressEditDraft.gpsOnly = !!document.getElementById('site-editor-address-gps-mode')?.checked;
    addressEditDraft.search = document.getElementById('site-editor-address-search')?.value.trim() || '';
    addressEditDraft.street = document.getElementById('site-editor-address-street')?.value.trim() || '';
    addressEditDraft.city = document.getElementById('site-editor-address-city')?.value.trim() || '';
    addressEditDraft.state = (document.getElementById('site-editor-address-state')?.value.trim() || '').toUpperCase();
    addressEditDraft.zip = document.getElementById('site-editor-address-zip')?.value.trim() || '';
    addressEditDraft.lat = document.getElementById('site-editor-address-lat')?.value.trim() || '';
    addressEditDraft.lng = document.getElementById('site-editor-address-lng')?.value.trim() || '';
  }

  function handleAddressModeChange(){
    syncAddressEditDraft();
    if(addressEditDraft.gpsOnly){
      addressEditDraft.search = '';
      addressEditDraft.street = '';
      addressEditDraft.city = '';
      addressEditDraft.zip = '';
    }
    renderAddressModal();
  }

  function applyAddressModal(){
    syncAddressEditDraft();
    const lat = normalizeNumber(addressEditDraft.lat);
    const lng = normalizeNumber(addressEditDraft.lng);
    if(addressEditDraft.gpsOnly && !hasUsableCoords(lat, lng)){
      alert('Enter valid GPS coordinates before using GPS override.');
      return;
    }
    if(!addressEditDraft.gpsOnly && addressEditDraft.search && !addressEditDraft.street && !addressEditDraft.city){
      const parsed = splitAddress(addressEditDraft.search);
      addressEditDraft.street = parsed.street;
      addressEditDraft.city = parsed.city;
      addressEditDraft.state = parsed.state;
      addressEditDraft.zip = parsed.zip;
    }
    addressDraft = {
      gpsOnly:addressEditDraft.gpsOnly,
      search:addressEditDraft.gpsOnly ? '' : addressEditDraft.search,
      street:addressEditDraft.gpsOnly ? '' : addressEditDraft.street,
      city:addressEditDraft.gpsOnly ? '' : addressEditDraft.city,
      state:addressEditDraft.state,
      zip:addressEditDraft.gpsOnly ? '' : addressEditDraft.zip,
      lat:hasUsableCoords(lat, lng) ? lat : '',
      lng:hasUsableCoords(lat, lng) ? lng : ''
    };
    closeAddressModal();
    render();
  }

  function bindAddressAutocomplete(){
    const input = document.getElementById('site-editor-address-search');
    const results = document.getElementById('site-editor-address-results');
    if(!input || !results) return;
    input.addEventListener('input', () => {
      clearTimeout(autocompleteTimer);
      const query = input.value.trim();
      if(query.length < 3){
        results.classList.remove('open');
        results.innerHTML = '';
        return;
      }
      autocompleteTimer = setTimeout(async () => {
        const current = ++autocompleteSeq;
        try {
          const { rows, message } = await lookupAddressSuggestions(query);
          if(current !== autocompleteSeq) return;
          results.innerHTML = (message ? `<div class="site-editor-autocomplete-item site-editor-muted"><strong>${esc(message.title)}</strong><span>${esc(message.copy)}</span></div>` : '')
            + rows.map((item, index) => `<div class="site-editor-autocomplete-item" data-index="${index}"><strong>${esc(item.display_name)}</strong><span>${esc(item.type || 'address')}</span></div>`).join('');
          if(!results.innerHTML) results.innerHTML = '<div class="site-editor-autocomplete-item site-editor-muted"><strong>No matches found</strong><span>Keep typing or enter the address manually.</span></div>';
          results.classList.add('open');
          results.querySelectorAll('[data-index]').forEach((row) => {
            row.addEventListener('mousedown', async (event) => {
              event.preventDefault();
              const item = rows[Number(row.dataset.index)];
              if(!item) return;
              try {
                await applyAddressPick(item);
              } catch (error){
                alert(error.message || 'Unable to load that address.');
                return;
              }
              results.classList.remove('open');
            });
          });
        } catch (_error){
          results.innerHTML = '<div class="site-editor-autocomplete-item"><strong>Lookup unavailable</strong><span>Enter the address manually and the map will geocode it on save.</span></div>';
          results.classList.add('open');
        }
      }, 220);
    });
    input.addEventListener('blur', () => setTimeout(() => results.classList.remove('open'), 120));
  }

  async function lookupAddressSuggestions(query){
    let googleUnavailable = false;
    try {
      const googleRows = await requestGooglePlaceSuggestions(query);
      if(googleRows.length) return { rows:googleRows.slice(0, 5), message:null };
    } catch (_error){ googleUnavailable = true; }
    const censusRows = await requestCensusAddressMatches(query).catch(() => []);
    return {
      rows:censusRows.slice(0, 5),
      message: googleUnavailable ? {
        title:'Address lookup fallback',
        copy:censusRows.length ? 'Showing address matches from the fallback lookup.' : 'Keep typing or enter the address manually.'
      } : null
    };
  }

  async function requestGooglePlaceSuggestions(query){
    const places = await loadPlacesLibrary();
    const AutocompleteSuggestion = places?.AutocompleteSuggestion || window.google?.maps?.places?.AutocompleteSuggestion;
    if(AutocompleteSuggestion?.fetchAutocompleteSuggestions){
      const request = {
        input:query,
        includedRegionCodes:['us'],
        locationBias:{ center:{ lat:HOME_BASE.lat, lng:HOME_BASE.lng }, radius:250000 }
      };
      const sessionToken = getPlacesSessionToken(places);
      if(sessionToken) request.sessionToken = sessionToken;
      const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      const suggestions = Array.isArray(response?.suggestions) ? response.suggestions : [];
      const rows = suggestions.map((suggestion) => {
        const prediction = suggestion?.placePrediction || null;
        const text = prediction?.text?.text || prediction?.text?.toString?.() || prediction?.text || prediction?.mainText?.text || prediction?.mainText?.toString?.() || '';
        return { display_name:String(text || '').trim(), type:'Google Places', placePrediction:prediction };
      }).filter((item) => item.display_name && item.placePrediction);
      if(rows.length) return rows;
    }
    const legacyRows = await requestLegacyGooglePlaceSuggestions(query).catch(() => []);
    if(legacyRows.length) return legacyRows;
    return requestGoogleGeocodeSuggestions(query);
  }

  async function requestLegacyGooglePlaceSuggestions(query){
    await loadGoogleMapsApi();
    const Service = window.google?.maps?.places?.AutocompleteService;
    if(!Service) throw new Error('Legacy Google Places autocomplete is not available.');
    const service = new Service();
    const request = {
      input:query,
      componentRestrictions:{ country:'us' },
      location:new window.google.maps.LatLng(HOME_BASE.lat, HOME_BASE.lng),
      radius:250000
    };
    return new Promise((resolve, reject) => {
      service.getPlacePredictions(request, (predictions, status) => {
        const placesStatus = window.google?.maps?.places?.PlacesServiceStatus || {};
        if(status !== placesStatus.OK || !Array.isArray(predictions)){
          if(status === placesStatus.ZERO_RESULTS) resolve([]);
          else reject(new Error(`Google Places autocomplete failed: ${status || 'unknown status'}`));
          return;
        }
        resolve(predictions.map((prediction) => ({
          display_name:String(prediction.description || prediction.structured_formatting?.main_text || '').trim(),
          type:'Google Places',
          placeId:prediction.place_id
        })).filter((item) => item.display_name && item.placeId));
      });
    });
  }

  async function requestGoogleGeocodeSuggestions(query){
    await loadGoogleMapsApi();
    if(!window.google?.maps?.Geocoder) return [];
    const response = await new window.google.maps.Geocoder().geocode({ address:query, region:'US' });
    const results = Array.isArray(response?.results) ? response.results : [];
    return results.slice(0, 5).map((result) => ({
      display_name:String(result.formatted_address || '').trim(),
      type:'Google geocode',
      geocodeResult:result
    })).filter((item) => item.display_name);
  }

  async function loadPlacesLibrary(){
    await loadGoogleMapsApi();
    if(window.google?.maps?.importLibrary) return window.google.maps.importLibrary('places');
    if(window.google?.maps?.places) return window.google.maps.places;
    throw new Error('Google Places is not available.');
  }

  function getGoogleMapsApiKey(){
    return String(window.APP_CONFIG?.googleMapsApiKey || '').trim();
  }

  function loadGoogleMapsApi(){
    if(window.google?.maps) return Promise.resolve(window.google.maps);
    if(googleMapsLoadPromise) return googleMapsLoadPromise;
    const apiKey = getGoogleMapsApiKey();
    if(!apiKey) return Promise.reject(new Error('Google Maps API key is not configured.'));
    googleMapsLoadPromise = new Promise((resolve, reject) => {
      const callbackName = `siteEditorGoogleMaps_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const script = document.createElement('script');
      const cleanup = () => {
        delete window[callbackName];
        script.removeEventListener('error', onError);
      };
      const onError = () => {
        cleanup();
        googleMapsLoadPromise = null;
        reject(new Error('Google Maps failed to load.'));
      };
      window[callbackName] = () => {
        cleanup();
        resolve(window.google.maps);
      };
      script.addEventListener('error', onError);
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async&callback=${encodeURIComponent(callbackName)}`;
      document.head.appendChild(script);
    });
    return googleMapsLoadPromise;
  }

  function getPlacesSessionToken(places){
    const TokenCtor = places?.AutocompleteSessionToken || window.google?.maps?.places?.AutocompleteSessionToken;
    if(!TokenCtor) return null;
    if(!placesSessionToken) placesSessionToken = new TokenCtor();
    return placesSessionToken;
  }

  async function applyAddressPick(item){
    const place = item.placePrediction ? await resolveGooglePlace(item) : null;
    const legacyPlace = !place && item.placeId ? await resolveLegacyGooglePlace(item) : null;
    const geocodePlace = !place && !legacyPlace && item.geocodeResult ? resolveGoogleGeocodeResult(item.geocodeResult) : null;
    const address = place?.address || legacyPlace?.address || geocodePlace?.address || item.address || {};
    addressEditDraft.search = place?.displayName || legacyPlace?.displayName || geocodePlace?.displayName || item.display_name || '';
    addressEditDraft.street = buildStreet(address);
    addressEditDraft.city = address.city || address.town || address.village || address.hamlet || '';
    addressEditDraft.state = getStateCode(address);
    addressEditDraft.zip = address.postcode || '';
    addressEditDraft.lat = place?.lat ?? legacyPlace?.lat ?? geocodePlace?.lat ?? item.lat ?? '';
    addressEditDraft.lng = place?.lng ?? legacyPlace?.lng ?? geocodePlace?.lng ?? item.lon ?? '';
    placesSessionToken = null;
    renderAddressModal();
  }

  async function resolveLegacyGooglePlace(item){
    await loadGoogleMapsApi();
    const PlacesService = window.google?.maps?.places?.PlacesService;
    if(!PlacesService || !item.placeId) return null;
    const serviceHost = document.createElement('div');
    const service = new PlacesService(serviceHost);
    return new Promise((resolve, reject) => {
      service.getDetails({ placeId:item.placeId, fields:['formatted_address', 'geometry', 'address_components'] }, (place, status) => {
        const placesStatus = window.google?.maps?.places?.PlacesServiceStatus || {};
        if(status !== placesStatus.OK || !place){
          reject(new Error(`Google place details failed: ${status || 'unknown status'}`));
          return;
        }
        const location = place.geometry?.location || null;
        const lat = typeof location?.lat === 'function' ? location.lat() : normalizeNumber(location?.lat);
        const lng = typeof location?.lng === 'function' ? location.lng() : normalizeNumber(location?.lng);
        resolve({
          displayName:String(place.formatted_address || item.display_name || '').trim(),
          lat:hasUsableCoords(lat, lng) ? lat : '',
          lng:hasUsableCoords(lat, lng) ? lng : '',
          address:buildGoogleAddressObject(place.address_components || [])
        });
      });
    });
  }

  function resolveGoogleGeocodeResult(result){
    const location = result?.geometry?.location || null;
    const lat = typeof location?.lat === 'function' ? location.lat() : normalizeNumber(location?.lat);
    const lng = typeof location?.lng === 'function' ? location.lng() : normalizeNumber(location?.lng);
    return {
      displayName:String(result?.formatted_address || '').trim(),
      lat:hasUsableCoords(lat, lng) ? lat : '',
      lng:hasUsableCoords(lat, lng) ? lng : '',
      address:buildGoogleAddressObject(result?.address_components || [])
    };
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
    const city = findComponent('locality').long || findComponent('postal_town').long || findComponent('sublocality', 'neighborhood').long || findComponent('administrative_area_level_3').long;
    return {
      house_number: findComponent('street_number').long,
      road: findComponent('route').long,
      city,
      town: city,
      state_code: findComponent('administrative_area_level_1').short,
      postcode: findComponent('postal_code').long
    };
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

  async function geocodeAddress(street, city, stateCode, zip){
    const query = formatAddress(street, city, stateCode, zip);
    if(query){
      try {
        await loadGoogleMapsApi();
        const response = await new window.google.maps.Geocoder().geocode({ address:query });
        const first = Array.isArray(response?.results) ? response.results[0] : null;
        const location = first?.geometry?.location || null;
        const lat = typeof location?.lat === 'function' ? location.lat() : normalizeNumber(location?.lat);
        const lng = typeof location?.lng === 'function' ? location.lng() : normalizeNumber(location?.lng);
        if(hasUsableCoords(lat, lng)) return { lat, lng };
      } catch (_error){}
    }
    const rows = await requestCensusAddressMatches(query).catch(() => []);
    if(!rows.length) return null;
    const lat = normalizeNumber(rows[0].lat);
    const lng = normalizeNumber(rows[0].lon);
    return hasUsableCoords(lat, lng) ? { lat, lng } : null;
  }

  async function requestCensusAddressMatches(query){
    const payload = await requestJsonp(`https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(query)}&benchmark=4&format=jsonp`);
    const matches = Array.isArray(payload?.result?.addressMatches) ? payload.result.addressMatches : [];
    return matches.map((match) => {
      const lat = normalizeNumber(match?.coordinates?.y);
      const lon = normalizeNumber(match?.coordinates?.x);
      const components = match?.addressComponents || {};
      const address = buildCensusAddressObject(components);
      return {
        display_name:String(match?.matchedAddress || formatAddress(address.road, address.city, address.state_code, address.postcode) || '').trim(),
        type:'census match',
        lat:lat ?? '',
        lon:lon ?? '',
        address
      };
    }).filter((item) => hasUsableCoords(item.lat, item.lon));
  }

  function buildCensusAddressObject(components){
    const streetParts = [components.preDirection, components.preType, components.streetName, components.suffixType, components.suffixDirection].filter(Boolean);
    return {
      house_number:components.fromAddress || '',
      road:streetParts.join(' ').trim(),
      city:components.city || '',
      state_code:components.state || '',
      postcode:components.zip || ''
    };
  }

  function requestJsonp(url){
    return new Promise((resolve, reject) => {
      const callbackName = `siteEditorJsonp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

  function validate(){
    if(!String(draft.clientId || '').trim()) return 'Client is required.';
    if(!normalizeStringArray(draft.projectIds).length) return 'At least one linked project is required.';
    if(!String(draft.siteName || '').trim()) return 'Site / location name is required.';
    if(addressDraft.gpsOnly && !hasUsableCoords(addressDraft.lat, addressDraft.lng)) return 'Enter valid latitude and longitude before saving a GPS-only site.';
    return '';
  }

  async function buildRecordForSave(){
    const lat = normalizeNumber(addressDraft.lat);
    const lng = normalizeNumber(addressDraft.lng);
    let nextLat = hasUsableCoords(lat, lng) ? lat : '';
    let nextLng = hasUsableCoords(lat, lng) ? lng : '';
    const address = addressDraft.gpsOnly ? '' : formatAddress(addressDraft.street, addressDraft.city, addressDraft.state, addressDraft.zip);
    if(!addressDraft.gpsOnly && address && !hasUsableCoords(nextLat, nextLng)){
      const coords = await geocodeAddress(addressDraft.street, addressDraft.city, addressDraft.state, addressDraft.zip);
      if(hasUsableCoords(coords?.lat, coords?.lng)){
        nextLat = coords.lat;
        nextLng = coords.lng;
      }
    }
    return {
      ...draft,
      projectId:draft.projectIds[0] || '',
      physicalAddress:address,
      countyState:addressDraft.gpsOnly ? addressDraft.state : [addressDraft.city, addressDraft.state].filter(Boolean).join(', '),
      gpsCoordinates:formatGps(nextLat, nextLng)
    };
  }

  async function save(){
    syncDraftFromDom();
    const validationMessage = validate();
    if(validationMessage){
      alert(validationMessage);
      return;
    }
    const saveButton = document.getElementById('site-editor-save');
    saveButton.disabled = true;
    showStatus('saving', 'SAVING');
    try {
      const record = await buildRecordForSave();
      const siteId = await ctx.saveSite(record);
      if(typeof ctx.afterSave === 'function') await ctx.afterSave({ siteId, record });
      close();
      showStatus('saved', 'SAVED');
    } catch (error){
      console.error('Site editor save failed:', error);
      showStatus('error', 'SAVE FAILED');
      alert(error.message || 'Unable to save the site.');
    } finally {
      saveButton.disabled = false;
    }
  }

  async function remove(){
    if(!draft.id || typeof ctx?.deleteSite !== 'function') return;
    const result = await ctx.deleteSite(draft.id, draft);
    if(result === false) return;
    if(typeof ctx.afterDelete === 'function') await ctx.afterDelete({ siteId:draft.id, record:draft });
    close();
  }

  window.SiteEditor = { open };
})();
