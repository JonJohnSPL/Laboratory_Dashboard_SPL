const STANDARDS_STORAGE_KEY = 'lab-standards-records';
const AUTO_REFRESH_MS = 15000;
const SCAN_STATUS_DEFAULT = 'Scan Tag uses OCR to pull concentration rows from the uploaded image.';

let standards = [];
let currentFilter = 'all';
let currentView = 'inventory';
let searchTerm = '';
let logsSortState = { field:'receivedOn', dir:'desc' };
let selectedStandardId = null;
let editStandardId = null;
let modalComponentRows = [];
let modalImageState = createEmptyImageState();
let modalExpiryTouched = false;
let autoRefreshTimer = null;
let autoRefreshInFlight = false;
let saveInFlight = false;
let scanInFlight = false;
let activeScanToken = 0;
let hideSaveStatusTimer = null;
let lastLoadedSnapshot = '';

const remoteImageUrlCache = new Map();
const remoteImageLoadPromises = new Map();

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

function uid(prefix = 'std'){
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
  if(value instanceof Date){
    const clone = new Date(value.getTime());
    clone.setHours(0, 0, 0, 0);
    return Number.isNaN(clone.getTime()) ? null : clone;
  }
  const raw = String(value).trim();
  if(!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(raw);
  date.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toInputDate(value){
  const date = parseDate(value);
  if(!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fmtDate(value){
  const date = parseDate(value);
  return date
    ? date.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    : 'Not set';
}

function fmtDateTime(value){
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' })
    : 'Not set';
}

function normalizeNumber(value){
  if(value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value){
  const parsed = normalizeNumber(value);
  if(parsed === null) return '';
  const asString = parsed.toString().includes('e')
    ? parsed.toFixed(6)
    : String(parsed);
  return asString.includes('.')
    ? asString.replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1')
    : asString;
}

function addOneYear(value){
  const date = parseDate(value);
  if(!date) return '';
  const next = new Date(date.getTime());
  next.setFullYear(next.getFullYear() + 1);
  return toInputDate(next);
}

function createBlankComponent(){
  return {
    id: uid('cmp'),
    componentName: '',
    concentrationValue: '',
    concentrationUnit: '%',
    sortOrder: modalComponentRows.length
  };
}

function createEmptyImageState(){
  return {
    mode: 'none',
    path: '',
    dataUrl: '',
    previewUrl: '',
    name: '',
    type: '',
    size: 0
  };
}

function setScanButtonBusy(isBusy){
  const button = document.getElementById('scan-tag-btn');
  if(!button) return;
  button.disabled = !!isBusy;
  button.textContent = isBusy ? 'Scanning...' : 'Scan Tag';
}

function setTagScanStatus(message = '', tone = ''){
  const el = document.getElementById('tag-scan-status');
  if(!el) return;
  el.className = 'image-meta';
  if(tone === 'working'){
    el.classList.add('scan-working');
  } else if(tone === 'success'){
    el.classList.add('scan-success');
  } else if(tone === 'error'){
    el.classList.add('scan-error');
  }
  el.textContent = message || SCAN_STATUS_DEFAULT;
}

function resetTagScanStatus(){
  setTagScanStatus(SCAN_STATUS_DEFAULT);
}

function normalizeOcrText(text){
  return String(text || '').replace(/\r/g, '');
}

function normalizeOcrLine(line){
  return String(line || '')
    .toUpperCase()
    .replace(/[|]/g, 'I')
    .replace(/[`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function getNormalizedOcrLines(text){
  return normalizeOcrText(text).split('\n').map(normalizeOcrLine).filter(Boolean);
}

function parseTagComponentLine(line){
  const match = String(line || '').match(/^([A-Z0-9+\- ]{2,})\s+([0-9]+(?:[.,][0-9]+)?)\s*(%|PPM|PPB|MOL%|VOL%)$/);
  if(!match){
    return null;
  }
  const componentName = match[1].replace(/\s+/g, ' ').trim();
  if(/^(DATE|QC|LOT|CYL|CYLINDER|SHELF|LIFE|PRESSURE|PSIA|READ|BOARD|LAFAYETTE|M%)\b/.test(componentName)){
    return null;
  }
  const concentrationValue = normalizeNumber(match[2].replace(',', '.'));
  if(concentrationValue === null){
    return null;
  }
  return {
    id: uid('cmp'),
    componentName,
    concentrationValue: formatNumber(concentrationValue),
    concentrationUnit: match[3],
    sortOrder: 0
  };
}

function extractTagComponents(lines){
  return lines
    .map(parseTagComponentLine)
    .filter(Boolean)
    .map((component, index) => ({
      ...component,
      sortOrder: index
    }));
}

function extractTagDataFromText(text){
  const lines = getNormalizedOcrLines(text);
  return {
    components: extractTagComponents(lines),
    rawText: normalizeOcrText(text)
  };
}

function applyScannedTagData(parsed){
  let replacedComponents = 0;
  const meaningfulRows = modalComponentRows.filter((component) => {
    return String(component.componentName || '').trim() || String(component.concentrationValue || '').trim();
  });
  if(parsed.components.length){
    const shouldReplace = !meaningfulRows.length || confirm('Replace the current concentration rows with the scanned mix from the tag?');
    if(shouldReplace){
      modalComponentRows = parsed.components.map((component, index) => ({
        id: uid('cmp'),
        componentName: component.componentName,
        concentrationValue: component.concentrationValue,
        concentrationUnit: component.concentrationUnit || '%',
        sortOrder: index
      }));
      renderComponentRows();
      replacedComponents = modalComponentRows.length;
    }
  }
  return { replacedComponents };
}

async function getModalTagImageSource(){
  if(modalImageState.previewUrl || modalImageState.dataUrl){
    return modalImageState.previewUrl || modalImageState.dataUrl;
  }
  if(modalImageState.mode === 'existing-remote' && modalImageState.path){
    const url = await ensureStandardImageUrl({ tagImagePath:modalImageState.path, tagImageDataUrl:'' });
    if(url){
      modalImageState.previewUrl = url;
      renderModalImageState();
    }
    return url;
  }
  return '';
}

async function scanTagImage(){
  if(scanInFlight){
    return;
  }
  let token = 0;
  try {
    const imageSource = await getModalTagImageSource();
    if(!imageSource){
      setTagScanStatus('Attach or load a tag image before scanning.', 'error');
      return;
    }
    if(!window.Tesseract || typeof window.Tesseract.recognize !== 'function'){
      setTagScanStatus('OCR is not ready. Refresh the page and try the scan again.', 'error');
      return;
    }
    token = Date.now();
    activeScanToken = token;
    scanInFlight = true;
    setScanButtonBusy(true);
    setTagScanStatus('Scanning tag image... this can take several seconds.', 'working');
    const result = await window.Tesseract.recognize(imageSource, 'eng');
    if(activeScanToken !== token){
      return;
    }
    const parsed = extractTagDataFromText(result?.data?.text || '');
    const outcome = applyScannedTagData(parsed);
    if(!outcome.replacedComponents){
      setTagScanStatus('Scan finished, but no concentration rows could be read confidently from this tag.', 'error');
      return;
    }
    setTagScanStatus(`Scan complete: loaded ${outcome.replacedComponents} component row(s). Review everything before saving.`, 'success');
  } catch (error){
    console.error('Unable to scan tag image:', error);
    setTagScanStatus(error?.message || 'Unable to scan the tag image right now.', 'error');
  } finally {
    if(activeScanToken === token){
      activeScanToken = 0;
    }
    scanInFlight = false;
    setScanButtonBusy(false);
  }
}

function normalizeComponent(raw, index = 0){
  return {
    id: String(raw?.id || uid('cmp')),
    componentName: String(raw?.componentName ?? raw?.component_name ?? '').trim(),
    concentrationValue: formatNumber(raw?.concentrationValue ?? raw?.concentration_value ?? ''),
    concentrationUnit: String(raw?.concentrationUnit ?? raw?.concentration_unit ?? '%').trim() || '%',
    sortOrder: Number(raw?.sortOrder ?? raw?.sort_order ?? index)
  };
}

function normalizeStandard(raw){
  const components = Array.isArray(raw?.components) ? raw.components : [];
  return {
    id: String(raw?.id || uid()),
    standardIdentifier: String(raw?.standardIdentifier ?? raw?.standard_identifier ?? '').trim(),
    standardName: String(raw?.standardName ?? raw?.standard_name ?? '').trim(),
    vendorName: String(raw?.vendorName ?? raw?.vendor_name ?? '').trim(),
    qcNumber: String(raw?.qcNumber ?? raw?.qc_number ?? '').trim(),
    cylinderNumber: String(raw?.cylinderNumber ?? raw?.cylinder_number ?? '').trim(),
    receivedOn: toInputDate(raw?.receivedOn ?? raw?.received_on ?? ''),
    certifiedOn: toInputDate(raw?.certifiedOn ?? raw?.certified_on ?? ''),
    expiresOn: toInputDate(raw?.expiresOn ?? raw?.expires_on ?? ''),
    receivingAnalystInitials: String(raw?.receivingAnalystInitials ?? raw?.receiving_analyst_initials ?? '').trim().toUpperCase(),
    pressurePsia: normalizeNumber(raw?.pressurePsia ?? raw?.pressure_psia ?? null),
    isActive: raw?.isActive ?? raw?.is_active ?? true,
    notes: String(raw?.notes ?? '').trim(),
    tagImagePath: String(raw?.tagImagePath ?? raw?.tag_image_path ?? '').trim(),
    tagImageDataUrl: String(raw?.tagImageDataUrl ?? '').trim(),
    tagImageName: String(raw?.tagImageName ?? '').trim(),
    tagImageType: String(raw?.tagImageType ?? '').trim(),
    createdAt: String(raw?.createdAt ?? raw?.created_at ?? '').trim(),
    updatedAt: String(raw?.updatedAt ?? raw?.updated_at ?? '').trim(),
    components: components
      .map((component, index) => normalizeComponent(component, index))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.componentName.localeCompare(b.componentName))
  };
}

function normalizeStandards(list){
  return (Array.isArray(list) ? list : [])
    .map(normalizeStandard)
    .sort((a, b) => {
      const receivedA = parseDate(a.receivedOn)?.getTime() ?? 0;
      const receivedB = parseDate(b.receivedOn)?.getTime() ?? 0;
      if(receivedA !== receivedB) return receivedB - receivedA;
      const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      if(updatedA !== updatedB) return updatedB - updatedA;
      return (a.standardIdentifier || a.cylinderNumber).localeCompare(b.standardIdentifier || b.cylinderNumber);
    });
}

function buildSnapshot(list){
  return JSON.stringify(list.map((standard) => ({
    id: standard.id,
    standardIdentifier: standard.standardIdentifier,
    standardName: standard.standardName,
    vendorName: standard.vendorName,
    qcNumber: standard.qcNumber,
    cylinderNumber: standard.cylinderNumber,
    receivedOn: standard.receivedOn,
    certifiedOn: standard.certifiedOn,
    expiresOn: standard.expiresOn,
    receivingAnalystInitials: standard.receivingAnalystInitials,
    pressurePsia: standard.pressurePsia,
    isActive: standard.isActive,
    notes: standard.notes,
    tagImagePath: standard.tagImagePath,
    tagImageDataUrl: standard.tagImageDataUrl,
    tagImageName: standard.tagImageName,
    tagImageType: standard.tagImageType,
    createdAt: standard.createdAt,
    updatedAt: standard.updatedAt,
    components: standard.components
  })));
}

function getStatusInfo(standard){
  const expiry = parseDate(standard.expiresOn);
  const today = parseDate(todayISO());
  if(!standard.isActive){
    return { key:'inactive', label:'Inactive' };
  }
  if(expiry && today && expiry.getTime() < today.getTime()){
    return { key:'expired', label:'Expired' };
  }
  return { key:'active', label:'Active' };
}

function isRemoteMode(){
  return !!(window.appAuth && typeof window.appAuth.getMode === 'function' && window.appAuth.getMode() === 'remote');
}

function hasTagImage(standard){
  return !!(standard?.tagImageDataUrl || standard?.tagImagePath);
}

function getSelectedStandard(){
  return standards.find((standard) => standard.id === selectedStandardId) || null;
}

function getVisibleStandards(){
  const needle = searchTerm.trim().toLowerCase();
  return standards.filter((standard) => {
    const status = getStatusInfo(standard).key;
    if(currentFilter !== 'all' && status !== currentFilter){
      return false;
    }
    if(!needle){
      return true;
    }
    const searchBlob = [
      standard.standardIdentifier,
      standard.standardName,
      standard.cylinderNumber,
      standard.vendorName,
      standard.qcNumber,
      standard.notes,
      ...standard.components.map((component) => `${component.componentName} ${component.concentrationValue}${component.concentrationUnit}`)
    ].join(' ').toLowerCase();
    return searchBlob.includes(needle);
  });
}

function ensureSelectedStandard(preferredId = ''){
  const visible = getVisibleStandards();
  if(!visible.length){
    selectedStandardId = null;
    return;
  }
  if(preferredId && standards.some((standard) => standard.id === preferredId)){
    selectedStandardId = preferredId;
    return;
  }
  if(selectedStandardId && visible.some((standard) => standard.id === selectedStandardId)){
    return;
  }
  selectedStandardId = visible[0]?.id || standards[0]?.id || null;
}

function componentSummary(standard){
  if(!standard.components.length){
    return 'No concentrations saved';
  }
  const first = [...standard.components]
    .sort((a, b) => {
      const valueA = normalizeNumber(a.concentrationValue) ?? -1;
      const valueB = normalizeNumber(b.concentrationValue) ?? -1;
      return valueB - valueA;
    })
    .slice(0, 3)
    .map((component) => component.componentName || 'Unnamed');
  const suffix = standard.components.length > 3 ? ` +${standard.components.length - 3} more` : '';
  return `${first.join(' | ')}${suffix}`;
}

function abbreviateComponentName(name){
  const cleaned = String(name || '').trim().replace(/\s+/g, ' ');
  if(!cleaned) return '';
  const tokens = cleaned.split(' ');
  if(tokens.length > 1){
    return tokens.map((token) => token[0]).join('').toUpperCase();
  }
  if(/^[A-Z0-9-]+$/.test(cleaned)){
    return cleaned;
  }
  return cleaned.slice(0, 4).toUpperCase();
}

function concentrationSummary(standard){
  const ranked = [...(standard?.components || [])]
    .map((component) => ({
      component,
      numericValue: normalizeNumber(component.concentrationValue) ?? -1
    }))
    .filter((entry) => entry.component.componentName && entry.numericValue >= 0)
    .sort((a, b) => b.numericValue - a.numericValue);
  const top = ranked[0];
  if(!top){
    return 'Not set';
  }
  return `${abbreviateComponentName(top.component.componentName)} ${formatNumber(top.numericValue)}${top.component.concentrationUnit || '%'}`;
}

function showSaveStatus(state, message){
  const el = document.getElementById('save-indicator');
  if(!el) return;
  clearTimeout(hideSaveStatusTimer);
  el.style.visibility = 'visible';
  el.className = `save-indicator ${state}`;
  el.textContent = message;
}

function hideSaveStatusSoon(delay = 2400){
  clearTimeout(hideSaveStatusTimer);
  hideSaveStatusTimer = setTimeout(() => {
    const el = document.getElementById('save-indicator');
    if(el){
      el.style.visibility = 'hidden';
    }
  }, delay);
}

function setLastUpdateText(message){
  const el = document.getElementById('last-update');
  if(el){
    el.textContent = message;
  }
}

function renderStats(){
  const counts = { total: standards.length, active:0, expired:0, inactive:0 };
  standards.forEach((standard) => {
    counts[getStatusInfo(standard).key] += 1;
  });
  document.getElementById('stat-total').textContent = String(counts.total);
  document.getElementById('stat-active').textContent = String(counts.active);
  document.getElementById('stat-expired').textContent = String(counts.expired);
  document.getElementById('stat-inactive').textContent = String(counts.inactive);
}

function renderFilterButtons(){
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filter === currentFilter);
  });
}

function renderViewButtons(){
  document.querySelectorAll('.view-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === currentView);
  });
  document.getElementById('inventory-screen')?.classList.toggle('active', currentView === 'inventory');
  document.getElementById('logs-screen')?.classList.toggle('active', currentView === 'logs');
}

function getDefaultLogsSortDir(field){
  return ['receivedOn', 'certifiedOn', 'expiresOn'].includes(field) ? 'desc' : 'asc';
}

function getStandardLogSortValue(standard, field){
  switch (field){
    case 'receivedOn':
      return parseDate(standard.receivedOn)?.getTime() ?? -1;
    case 'certifiedOn':
      return parseDate(standard.certifiedOn)?.getTime() ?? -1;
    case 'expiresOn':
      return parseDate(standard.expiresOn)?.getTime() ?? -1;
    case 'standardIdentifier':
      return String(standard.standardIdentifier || '');
    case 'standardName':
      return String(standard.standardName || '');
    case 'vendorName':
      return String(standard.vendorName || '');
    case 'qcNumber':
      return String(standard.qcNumber || '');
    case 'receivingAnalystInitials':
      return String(standard.receivingAnalystInitials || '');
    case 'concentrationSummary':
      return String(concentrationSummary(standard) || '');
    default:
      return String(standard.standardIdentifier || standard.cylinderNumber || '');
  }
}

function compareLogSortValues(valueA, valueB){
  if(typeof valueA === 'number' && typeof valueB === 'number'){
    return valueA - valueB;
  }
  return String(valueA || '').localeCompare(String(valueB || ''), undefined, { numeric:true, sensitivity:'base' });
}

function getSortedVisibleStandards(){
  return [...getVisibleStandards()].sort((a, b) => {
    const primary = compareLogSortValues(
      getStandardLogSortValue(a, logsSortState.field),
      getStandardLogSortValue(b, logsSortState.field)
    );
    if(primary !== 0){
      return logsSortState.dir === 'asc' ? primary : -primary;
    }
    const fallback = (a.standardIdentifier || a.cylinderNumber || '').localeCompare(
      b.standardIdentifier || b.cylinderNumber || '',
      undefined,
      { numeric:true, sensitivity:'base' }
    );
    if(fallback !== 0){
      return fallback;
    }
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
}

function renderLogsSortButtons(){
  document.querySelectorAll('.logs-sort-btn').forEach((button) => {
    const field = button.id.replace('logs-sort-', '');
    const baseLabel = button.dataset.label || button.textContent.replace(/\s+\((?:asc|desc)\)$/i, '').trim();
    button.dataset.label = baseLabel;
    const isActive = field === logsSortState.field;
    button.classList.toggle('active', isActive);
    button.textContent = isActive
      ? `${baseLabel} (${logsSortState.dir})`
      : baseLabel;
  });
}

function setLogsSort(field){
  if(logsSortState.field === field){
    logsSortState.dir = logsSortState.dir === 'asc' ? 'desc' : 'asc';
  } else {
    logsSortState = { field, dir:getDefaultLogsSortDir(field) };
  }
  renderLogs();
}

function renderTable(){
  const tbody = document.getElementById('standards-tbody');
  const visible = getVisibleStandards();
  ensureSelectedStandard();
  if(!visible.length){
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="big">[]</div>
            No standards match the current filter.
          </div>
        </td>
      </tr>
    `;
    return;
  }
  tbody.innerHTML = visible.map((standard) => {
    const status = getStatusInfo(standard);
    return `
      <tr class="${selectedStandardId === standard.id ? 'selected' : ''}" onclick="selectStandard('${esc(standard.id)}')">
        <td>
          <div class="record-title">${esc(standard.standardIdentifier || 'Unassigned ID')}</div>
          <div class="record-sub">Cylinder # ${esc(standard.cylinderNumber || 'Not set')}</div>
        </td>
        <td>
          <div>${esc(standard.standardName || 'Unnamed Standard')}</div>
          <div class="record-sub">Lot/QC # ${esc(standard.qcNumber || 'Not set')}</div>
        </td>
        <td>${esc(fmtDate(standard.receivedOn))}</td>
        <td>${esc(fmtDate(standard.expiresOn))}</td>
        <td><div class="mix-preview">${esc(componentSummary(standard))}</div></td>
        <td><span class="status-pill ${esc(status.key)}">${esc(status.label)}</span></td>
      </tr>
    `;
  }).join('');
}

function renderDetail(){
  const panel = document.getElementById('detail-panel');
  const standard = getSelectedStandard();
  if(!standard){
    panel.innerHTML = `
      <div class="detail-empty">
        <h2>No Standard Selected</h2>
        <p>Add a standard or choose one from the list to review its identifiers, concentrations, and tag image.</p>
      </div>
    `;
    return;
  }
  const status = getStatusInfo(standard);
  const imageMarkup = hasTagImage(standard)
    ? `<div id="detail-tag-preview" class="image-preview empty">Loading tag image...</div>`
    : `<div class="image-preview empty">No tag image attached.</div>`;
  panel.innerHTML = `
    <div class="detail-card">
      <div class="detail-head">
        <div>
          <div class="detail-title">${esc(standard.standardName || 'Unnamed Standard')}</div>
          <div class="detail-meta">
            ID # ${esc(standard.standardIdentifier || 'Not set')} | Lot/QC # ${esc(standard.qcNumber || 'Not set')} | Cylinder # ${esc(standard.cylinderNumber || 'Not set')}<br>
            Last updated ${esc(fmtDateTime(standard.updatedAt || standard.createdAt))}
          </div>
        </div>
        <div class="detail-actions">
          <button class="sec-btn small" type="button" onclick="openStandardModal('${esc(standard.id)}')">Edit Record</button>
          <button class="sec-btn small danger" type="button" onclick="deleteCurrentStandard('${esc(standard.id)}')">Delete</button>
          <button class="sec-btn small" type="button" onclick="openSelectedTagImage()">Open Tag</button>
        </div>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-item-label">Standard ID #</div>
          <div class="detail-item-value">${esc(standard.standardIdentifier || 'Not set')}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Standard Name</div>
          <div class="detail-item-value">${esc(standard.standardName || 'Unnamed Standard')}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Status</div>
          <div class="detail-item-value"><span class="status-pill ${esc(status.key)}">${esc(status.label)}</span></div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Lot / QC #</div>
          <div class="detail-item-value">${esc(standard.qcNumber || 'Not set')}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Cylinder #</div>
          <div class="detail-item-value">${esc(standard.cylinderNumber || 'Not set')}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Received On</div>
          <div class="detail-item-value">${esc(fmtDate(standard.receivedOn))}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Certified / Tag Date</div>
          <div class="detail-item-value">${esc(fmtDate(standard.certifiedOn))}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Expires On</div>
          <div class="detail-item-value">${esc(fmtDate(standard.expiresOn))}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Pressure (PSIA)</div>
          <div class="detail-item-value">${esc(formatNumber(standard.pressurePsia) || 'Not set')}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Notes</div>
          <div class="detail-item-value">${esc(standard.notes || 'None')}</div>
        </div>
      </div>
      <div class="component-card">
        <h3>Concentrations</h3>
        <table class="component-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Value</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            ${standard.components.length
              ? standard.components.map((component) => `
                <tr>
                  <td>${esc(component.componentName)}</td>
                  <td>${esc(component.concentrationValue)}</td>
                  <td>${esc(component.concentrationUnit)}</td>
                </tr>
              `).join('')
              : `
                <tr>
                  <td colspan="3">No concentrations recorded.</td>
                </tr>
              `}
          </tbody>
        </table>
      </div>
      <div class="image-card">
        <h3>Tag Image</h3>
        ${imageMarkup}
      </div>
    </div>
  `;
  if(hasTagImage(standard)){
    renderStandardImagePreview('detail-tag-preview', standard, standard.id);
  }
}

function renderLogs(){
  const tbody = document.getElementById('logs-tbody');
  const summary = document.getElementById('logs-summary');
  if(!tbody || !summary) return;
  const visible = getSortedVisibleStandards();
  renderLogsSortButtons();
  const sortLabel = document.querySelector(`#logs-sort-${logsSortState.field}`)?.dataset.label || 'Received';
  summary.textContent = `${visible.length} record(s) | Sorted by ${sortLabel} ${logsSortState.dir === 'asc' ? 'ascending' : 'descending'}`;
  if(!visible.length){
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <div class="big">[]</div>
            No standards match the current log filter.
          </div>
        </td>
      </tr>
    `;
    return;
  }
  tbody.innerHTML = visible.map((standard) => {
    return `
      <tr>
        <td>${esc(standard.standardIdentifier || 'Not set')}</td>
        <td>${esc(fmtDate(standard.receivedOn))}</td>
        <td>${esc(standard.standardName || 'Unnamed Standard')}</td>
        <td>${esc(concentrationSummary(standard))}</td>
        <td>${esc(standard.vendorName || 'Not set')}</td>
        <td>${esc(standard.qcNumber || 'Not set')}</td>
        <td>${esc(fmtDate(standard.expiresOn))}</td>
        <td>${esc(standard.receivingAnalystInitials || 'Not set')}</td>
      </tr>
    `;
  }).join('');
}

function printLogs(){
  const visible = getSortedVisibleStandards();
  if(!visible.length){
    alert('No standards are available to print.');
    return;
  }
  const popup = window.open('', '_blank', 'width=1100,height=800');
  if(!popup || popup.closed){
    alert('Unable to open the print window. Please allow pop-ups and try again.');
    return;
  }
  try {
    const printedAt = new Date().toLocaleString('en-US', {
      month:'short',
      day:'numeric',
      year:'numeric',
      hour:'numeric',
      minute:'2-digit'
    });
    const rows = visible.map((standard) => {
      return `
        <tr>
          <td>${esc(standard.standardIdentifier || 'Not set')}</td>
          <td>${esc(fmtDate(standard.receivedOn))}</td>
          <td>${esc(standard.standardName || 'Unnamed Standard')}</td>
          <td>${esc(concentrationSummary(standard))}</td>
          <td>${esc(standard.vendorName || 'Not set')}</td>
          <td>${esc(standard.qcNumber || 'Not set')}</td>
          <td>${esc(fmtDate(standard.expiresOn))}</td>
          <td>${esc(standard.receivingAnalystInitials || 'Not set')}</td>
        </tr>
      `;
    }).join('');
    popup.document.open();
    popup.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Standards Receipt Log</title>
<style>
body{font-family:Arial,sans-serif;color:#111;padding:24px;}
h1{margin:0 0 8px;font-size:24px;}
p{margin:0 0 18px;color:#444;font-size:12px;}
table{width:100%;border-collapse:collapse;}
th,td{border:1px solid #bbb;padding:8px 10px;text-align:left;font-size:12px;vertical-align:top;}
th{background:#efefef;text-transform:uppercase;letter-spacing:.08em;font-size:10px;}
@media print{
  body{padding:12px;}
}
</style>
</head>
<body>
<h1>Standards Receipt Log</h1>
<p>Printed ${esc(printedAt)} | ${esc(visible.length)} record(s)</p>
<table>
<thead>
<tr>
<th>ID Number</th>
<th>Date Receive</th>
<th>Name of Standard</th>
<th>Conc</th>
<th>Vendor</th>
<th>Lot Number</th>
<th>Exp Date</th>
<th>Receiving Analyst Initials</th>
</tr>
</thead>
<tbody>${rows}</tbody>
</table>
<script>
window.addEventListener('load', function(){
  setTimeout(function(){
    window.focus();
    window.print();
  }, 250);
});
window.addEventListener('afterprint', function(){
  window.close();
});
</script>
</body>
</html>`);
    popup.document.close();
  } catch (error){
    console.error('Unable to prepare the print window:', error);
    try {
      popup.close();
    } catch (_error) {}
    alert('Unable to prepare the print window. Please try again.');
  }
}

async function renderStandardImagePreview(containerId, standard, guardId = ''){
  const container = document.getElementById(containerId);
  if(!container) return;
  try {
    const url = await ensureStandardImageUrl(standard);
    if(!url) return;
    if(guardId && selectedStandardId !== guardId && containerId === 'detail-tag-preview'){
      return;
    }
    const nextContainer = document.getElementById(containerId);
    if(nextContainer){
      nextContainer.classList.remove('empty');
      nextContainer.innerHTML = `<img src="${esc(url)}" alt="Tag image">`;
    }
  } catch (error){
    console.error('Unable to load tag image preview:', error);
    const nextContainer = document.getElementById(containerId);
    if(nextContainer){
      nextContainer.classList.add('empty');
      nextContainer.textContent = 'Unable to load tag image preview.';
    }
  }
}

async function ensureStandardImageUrl(standard){
  if(!standard) return '';
  if(standard.tagImageDataUrl){
    return standard.tagImageDataUrl;
  }
  if(!standard.tagImagePath || !isRemoteMode()){
    return '';
  }
  if(remoteImageUrlCache.has(standard.tagImagePath)){
    return remoteImageUrlCache.get(standard.tagImagePath);
  }
  if(remoteImageLoadPromises.has(standard.tagImagePath)){
    return remoteImageLoadPromises.get(standard.tagImagePath);
  }
  const promise = (async () => {
    const response = await window.appAuth.fetch(
      `/storage/v1/object/authenticated/standard-tags/${encodeStoragePath(standard.tagImagePath)}`,
      { headers:{ Accept:'*/*' } }
    );
    if(!response.ok){
      throw new Error(`Image request failed (${response.status}).`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    remoteImageUrlCache.set(standard.tagImagePath, url);
    return url;
  })();
  remoteImageLoadPromises.set(standard.tagImagePath, promise);
  try {
    return await promise;
  } finally {
    remoteImageLoadPromises.delete(standard.tagImagePath);
  }
}

function clearCachedImage(path){
  const cached = remoteImageUrlCache.get(path);
  if(cached){
    URL.revokeObjectURL(cached);
    remoteImageUrlCache.delete(path);
  }
}

function selectStandard(id){
  selectedStandardId = id;
  render();
}

function setView(view){
  currentView = view === 'logs' ? 'logs' : 'inventory';
  render();
}

function setFilter(filter){
  currentFilter = filter;
  ensureSelectedStandard();
  render();
}

function updateSearch(value){
  searchTerm = String(value || '');
  ensureSelectedStandard();
  render();
}

function openPreviewUrl(url){
  if(!url){
    alert('No tag image attached.');
    return;
  }
  window.open(url, '_blank', 'noopener');
}

async function openSelectedTagImage(){
  const standard = getSelectedStandard();
  if(!standard || !hasTagImage(standard)){
    alert('No tag image attached.');
    return;
  }
  try {
    openPreviewUrl(await ensureStandardImageUrl(standard));
  } catch (error){
    console.error('Unable to open tag image:', error);
    alert('Unable to open the tag image.');
  }
}

function openStandardModal(id = ''){
  const standard = id ? standards.find((row) => row.id === id) : null;
  editStandardId = standard?.id || null;
  modalComponentRows = standard?.components.length
    ? standard.components.map((component, index) => ({
        id: component.id || uid('cmp'),
        componentName: component.componentName,
        concentrationValue: component.concentrationValue,
        concentrationUnit: component.concentrationUnit || '%',
        sortOrder: index
      }))
    : [createBlankComponent()];
  modalImageState = standard
    ? standard.tagImageDataUrl
      ? {
          mode:'existing-local',
          path:'',
          dataUrl:standard.tagImageDataUrl,
          previewUrl:standard.tagImageDataUrl,
          name:standard.tagImageName || 'tag-image',
          type:standard.tagImageType || 'image/jpeg',
          size:0
        }
      : standard.tagImagePath
        ? {
            mode:'existing-remote',
            path:standard.tagImagePath,
            dataUrl:'',
            previewUrl:remoteImageUrlCache.get(standard.tagImagePath) || '',
            name:standard.tagImageName || standard.tagImagePath.split('/').pop() || 'tag-image',
            type:'image/jpeg',
            size:0
          }
        : createEmptyImageState()
    : createEmptyImageState();
  document.getElementById('standard-modal-title').textContent = standard ? 'Edit Standard' : 'Add Standard';
  document.getElementById('std-id').value = standard?.standardIdentifier || '';
  document.getElementById('std-name').value = standard?.standardName || '';
  document.getElementById('std-vendor').value = standard?.vendorName || '';
  document.getElementById('std-qc').value = standard?.qcNumber || '';
  document.getElementById('std-cylinder').value = standard?.cylinderNumber || '';
  document.getElementById('std-pressure').value = standard?.pressurePsia ?? '';
  document.getElementById('std-received').value = standard?.receivedOn || '';
  document.getElementById('std-certified').value = standard?.certifiedOn || '';
  document.getElementById('std-expires').value = standard?.expiresOn || '';
  document.getElementById('std-analyst-initials').value = standard?.receivingAnalystInitials || '';
  document.getElementById('std-active').checked = standard?.isActive ?? true;
  document.getElementById('std-notes').value = standard?.notes || '';
  document.getElementById('std-tag-image').value = '';
  document.getElementById('delete-standard-btn').style.display = standard ? '' : 'none';
  modalExpiryTouched = !!standard?.expiresOn;
  activeScanToken = 0;
  scanInFlight = false;
  setScanButtonBusy(false);
  resetTagScanStatus();
  renderComponentRows();
  renderModalImageState();
  document.getElementById('standard-modal-overlay').classList.add('open');
  if(modalImageState.mode === 'existing-remote' && !modalImageState.previewUrl){
    renderModalRemotePreview();
  }
}

function closeStandardModal(){
  document.getElementById('standard-modal-overlay').classList.remove('open');
  editStandardId = null;
  modalComponentRows = [];
  modalImageState = createEmptyImageState();
  modalExpiryTouched = false;
  activeScanToken = 0;
  scanInFlight = false;
  setScanButtonBusy(false);
  resetTagScanStatus();
  document.getElementById('delete-standard-btn').style.display = 'none';
}

function renderComponentRows(){
  const container = document.getElementById('component-rows');
  if(!modalComponentRows.length){
    modalComponentRows = [createBlankComponent()];
  }
  container.innerHTML = modalComponentRows.map((component, index) => `
    <div class="component-row">
      <input class="component-input" type="text" placeholder="Component name" value="${esc(component.componentName)}" oninput="updateComponentRow(${index}, 'componentName', this.value)">
      <input class="component-input" type="number" min="0" step="0.000001" placeholder="Concentration" value="${esc(component.concentrationValue)}" oninput="updateComponentRow(${index}, 'concentrationValue', this.value)">
      <input class="component-input" type="text" placeholder="Unit" value="${esc(component.concentrationUnit)}" oninput="updateComponentRow(${index}, 'concentrationUnit', this.value)">
      <button class="component-remove" type="button" onclick="removeComponentRow(${index})">Remove</button>
    </div>
  `).join('');
}

function addComponentRow(){
  modalComponentRows.push(createBlankComponent());
  renderComponentRows();
}

function updateComponentRow(index, field, value){
  if(!modalComponentRows[index]) return;
  modalComponentRows[index][field] = value;
}

function removeComponentRow(index){
  modalComponentRows.splice(index, 1);
  renderComponentRows();
}

function chooseTagImage(){
  document.getElementById('std-tag-image').click();
}

function onTagImageSelected(event){
  const file = event?.target?.files?.[0];
  if(!file) return;
  if(!(file.type || '').startsWith('image/')){
    alert('Please select an image file.');
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    modalImageState = {
      mode:'new',
      path:'',
      dataUrl:String(reader.result || ''),
      previewUrl:String(reader.result || ''),
      name:file.name || 'tag-image',
      type:file.type || 'image/jpeg',
      size:Number(file.size || 0)
    };
    renderModalImageState();
    resetTagScanStatus();
  };
  reader.onerror = () => {
    alert('Unable to read the selected image.');
  };
  reader.readAsDataURL(file);
}

function removeTagImage(){
  if(modalImageState.mode === 'none'){
    return;
  }
  modalImageState = { ...createEmptyImageState(), mode:'removed' };
  renderModalImageState();
  resetTagScanStatus();
}

async function renderModalRemotePreview(){
  if(modalImageState.mode !== 'existing-remote' || !modalImageState.path){
    return;
  }
  const preview = document.getElementById('tag-image-preview');
  if(preview){
    preview.classList.add('empty');
    preview.textContent = 'Loading tag preview...';
  }
  try {
    const url = await ensureStandardImageUrl({ tagImagePath:modalImageState.path, tagImageDataUrl:'' });
    if(modalImageState.mode === 'existing-remote' && modalImageState.path){
      modalImageState.previewUrl = url;
      renderModalImageState();
    }
  } catch (error){
    console.error('Unable to load modal tag image preview:', error);
    if(preview){
      preview.classList.add('empty');
      preview.textContent = 'Unable to load tag preview.';
    }
  }
}

function renderModalImageState(){
  const meta = document.getElementById('tag-image-meta');
  const preview = document.getElementById('tag-image-preview');
  if(!meta || !preview) return;
  if(modalImageState.mode === 'removed'){
    meta.textContent = 'Tag image will be removed when you save.';
    preview.className = 'image-preview empty';
    preview.textContent = 'This record will not have a tag image.';
    return;
  }
  const previewUrl = modalImageState.previewUrl || modalImageState.dataUrl;
  if(!previewUrl){
    meta.textContent = modalImageState.mode === 'existing-remote'
      ? (modalImageState.name || 'Existing tag image')
      : 'No tag image attached.';
    preview.className = 'image-preview empty';
    preview.textContent = modalImageState.mode === 'existing-remote'
      ? 'Loading tag preview...'
      : 'Tag preview will appear here.';
    return;
  }
  meta.textContent = modalImageState.name
    ? `${modalImageState.name}${modalImageState.size ? ` | ${Math.round(modalImageState.size / 1024)} KB` : ''}`
    : 'Tag image attached.';
  preview.className = 'image-preview';
  preview.innerHTML = `<img src="${esc(previewUrl)}" alt="Tag preview">`;
}

async function openModalTagImage(){
  if(modalImageState.mode === 'removed' || modalImageState.mode === 'none'){
    alert('No tag image attached.');
    return;
  }
  if(modalImageState.previewUrl || modalImageState.dataUrl){
    openPreviewUrl(modalImageState.previewUrl || modalImageState.dataUrl);
    return;
  }
  if(modalImageState.mode === 'existing-remote' && modalImageState.path){
    try {
      const url = await ensureStandardImageUrl({ tagImagePath:modalImageState.path, tagImageDataUrl:'' });
      modalImageState.previewUrl = url;
      openPreviewUrl(url);
    } catch (error){
      console.error('Unable to open modal tag image:', error);
      alert('Unable to open the tag image.');
    }
  }
}

function markExpiryTouched(){
  modalExpiryTouched = document.getElementById('std-expires').value.trim() !== '';
  if(!modalExpiryTouched){
    handleDateInputChange();
  }
}

function handleDateInputChange(){
  if(modalExpiryTouched) return;
  const certified = document.getElementById('std-certified').value;
  const received = document.getElementById('std-received').value;
  document.getElementById('std-expires').value = addOneYear(certified || received);
}

function buildDraftFromModal(){
  const standardIdentifier = document.getElementById('std-id').value.trim();
  const standardName = document.getElementById('std-name').value.trim();
  const cylinderNumber = document.getElementById('std-cylinder').value.trim();
  const receivedOn = document.getElementById('std-received').value;
  const certifiedOn = document.getElementById('std-certified').value;
  const expiresValue = document.getElementById('std-expires').value || addOneYear(certifiedOn || receivedOn);
  if(!standardIdentifier){
    throw new Error('Standard ID # is required.');
  }
  if(!standardName){
    throw new Error('Standard name is required.');
  }
  if(!receivedOn){
    throw new Error('Received date is required.');
  }
  const receivingAnalystInitials = document.getElementById('std-analyst-initials').value.trim().toUpperCase();
  if(!editStandardId && !receivingAnalystInitials){
    throw new Error('Receiving analyst initials are required for new entries.');
  }
  const components = modalComponentRows
    .map((component, index) => ({
      id: component.id || uid('cmp'),
      componentName: String(component.componentName || '').trim(),
      concentrationValue: String(component.concentrationValue || '').trim(),
      concentrationUnit: String(component.concentrationUnit || '').trim() || '%',
      sortOrder: index
    }))
    .filter((component) => component.componentName || component.concentrationValue);
  if(!components.length){
    throw new Error('Add at least one concentration row.');
  }
  const incomplete = components.find((component) => !component.componentName || component.concentrationValue === '');
  if(incomplete){
    throw new Error('Each concentration row needs a component name and value.');
  }
  return {
    id: editStandardId || '',
    standardIdentifier,
    standardName,
    vendorName: document.getElementById('std-vendor').value.trim(),
    qcNumber: document.getElementById('std-qc').value.trim(),
    cylinderNumber,
    receivingAnalystInitials,
    pressurePsia: normalizeNumber(document.getElementById('std-pressure').value),
    receivedOn,
    certifiedOn,
    expiresOn: expiresValue,
    isActive: document.getElementById('std-active').checked,
    notes: document.getElementById('std-notes').value.trim(),
    components,
    imageState: { ...modalImageState }
  };
}

async function saveStandardFromModal(){
  const existing = editStandardId ? standards.find((standard) => standard.id === editStandardId) : null;
  try {
    const draft = buildDraftFromModal();
    showSaveStatus('saving', 'SAVING...');
    saveInFlight = true;
    const savedId = await getRepository().save(draft, existing);
    selectedStandardId = savedId;
    closeStandardModal();
    await loadStandards({ silent:true, force:true, preferredId:savedId });
    showSaveStatus('saved', 'SAVED');
    hideSaveStatusSoon();
  } catch (error){
    console.error('Unable to save standard record:', error);
    showSaveStatus('error', 'SAVE FAILED');
    alert(error.message || 'Unable to save the standard record.');
  } finally {
    saveInFlight = false;
  }
}

async function deleteCurrentStandard(id = ''){
  const targetId = id || editStandardId || selectedStandardId;
  if(!targetId) return;
  const existing = standards.find((standard) => standard.id === targetId);
  if(!existing) return;
  const label = existing.standardIdentifier || existing.standardName || existing.cylinderNumber || 'this standard';
  if(!confirm(`Delete ${label}? This cannot be undone.`)){
    return;
  }
  try {
    showSaveStatus('saving', 'DELETING...');
    saveInFlight = true;
    await getRepository().delete(existing);
    if(editStandardId === existing.id){
      closeStandardModal();
    }
    await loadStandards({ silent:true, force:true });
    showSaveStatus('saved', 'DELETED');
    hideSaveStatusSoon();
  } catch (error){
    console.error('Unable to delete standard record:', error);
    showSaveStatus('error', 'DELETE FAILED');
    alert(error.message || 'Unable to delete the standard record.');
  } finally {
    saveInFlight = false;
  }
}

function getRepository(){
  return isRemoteMode() ? remoteRepository : localRepository;
}

const localRepository = {
  async list(){
    try {
      const raw = localStorage.getItem(STANDARDS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async save(draft, existing){
    const list = normalizeStandards(await this.list());
    const now = new Date().toISOString();
    const nextRecord = normalizeStandard({
      ...existing,
      ...draft,
      id: existing?.id || draft.id || uid(),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      tagImagePath: '',
      tagImageDataUrl: resolveLocalImageData(draft.imageState, existing),
      tagImageName: resolveLocalImageName(draft.imageState, existing),
      tagImageType: resolveLocalImageType(draft.imageState, existing)
    });
    const nextList = existing
      ? list.map((row) => row.id === existing.id ? nextRecord : row)
      : [nextRecord, ...list];
    localStorage.setItem(STANDARDS_STORAGE_KEY, JSON.stringify(nextList));
    return nextRecord.id;
  },

  async delete(existing){
    const list = normalizeStandards(await this.list());
    const nextList = list.filter((row) => row.id !== existing.id);
    localStorage.setItem(STANDARDS_STORAGE_KEY, JSON.stringify(nextList));
  }
};

const remoteRepository = {
  async list(){
    return window.appAuth.requestJson('/rest/v1/standards?select=id,standard_identifier,standard_name,vendor_name,qc_number,cylinder_number,received_on,certified_on,expires_on,receiving_analyst_initials,pressure_psia,is_active,notes,tag_image_path,created_at,updated_at,components:standard_components(id,component_name,concentration_value,concentration_unit,sort_order)');
  },

  async save(draft, existing){
    const currentPath = existing?.tagImagePath || '';
    const imageState = draft.imageState || createEmptyImageState();
    const payload = {
      standard_identifier: draft.standardIdentifier,
      standard_name: draft.standardName,
      vendor_name: draft.vendorName,
      qc_number: draft.qcNumber,
      cylinder_number: draft.cylinderNumber,
      received_on: draft.receivedOn,
      certified_on: draft.certifiedOn || null,
      expires_on: draft.expiresOn || null,
      receiving_analyst_initials: draft.receivingAnalystInitials || '',
      pressure_psia: draft.pressurePsia,
      is_active: !!draft.isActive,
      notes: draft.notes,
      tag_image_path: imageState.mode === 'removed' ? null : currentPath || null
    };
    const row = draft.id
      ? firstRow(await window.appAuth.requestJson(
          `/rest/v1/standards?id=eq.${encodeURIComponent(draft.id)}&select=id,tag_image_path`,
          {
            method:'PATCH',
            headers:{
              'Content-Type':'application/json',
              'Prefer':'return=representation'
            },
            body:JSON.stringify(payload)
          }
        ))
      : firstRow(await window.appAuth.requestJson(
          '/rest/v1/standards?select=id,tag_image_path',
          {
            method:'POST',
            headers:{
              'Content-Type':'application/json',
              'Prefer':'return=representation'
            },
            body:JSON.stringify(payload)
          }
        ));
    if(!row?.id){
      throw new Error('Supabase did not return the saved record.');
    }
    await window.appAuth.requestJson(
      `/rest/v1/standard_components?standard_id=eq.${encodeURIComponent(row.id)}`,
      { method:'DELETE' }
    );
    if(draft.components.length){
      await window.appAuth.requestJson('/rest/v1/standard_components', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Prefer':'return=minimal'
        },
        body:JSON.stringify(draft.components.map((component, index) => ({
          standard_id: row.id,
          component_name: component.componentName,
          concentration_value: normalizeNumber(component.concentrationValue),
          concentration_unit: component.concentrationUnit || '%',
          sort_order: index
        })))
      });
    }
    let finalPath = row.tag_image_path || currentPath || '';
    if(imageState.mode === 'new' && imageState.dataUrl){
      const uploadPath = buildStorageObjectPath(row.id, imageState.name || 'tag-image.jpg');
      await uploadRemoteTagImage(uploadPath, imageState.dataUrl, imageState.type || 'image/jpeg');
      const patched = firstRow(await window.appAuth.requestJson(
        `/rest/v1/standards?id=eq.${encodeURIComponent(row.id)}&select=id,tag_image_path`,
        {
          method:'PATCH',
          headers:{
            'Content-Type':'application/json',
            'Prefer':'return=representation'
          },
          body:JSON.stringify({ tag_image_path: uploadPath })
        }
      ));
      finalPath = patched?.tag_image_path || uploadPath;
      if(currentPath && currentPath !== finalPath){
        await removeRemoteTagImage(currentPath);
        clearCachedImage(currentPath);
      }
    }
    if(imageState.mode === 'removed' && currentPath){
      await window.appAuth.requestJson(
        `/rest/v1/standards?id=eq.${encodeURIComponent(row.id)}&select=id,tag_image_path`,
        {
          method:'PATCH',
          headers:{
            'Content-Type':'application/json',
            'Prefer':'return=representation'
          },
          body:JSON.stringify({ tag_image_path: null })
        }
      );
      await removeRemoteTagImage(currentPath);
      clearCachedImage(currentPath);
    }
    return row.id;
  },

  async delete(existing){
    if(existing?.tagImagePath){
      await removeRemoteTagImage(existing.tagImagePath).catch((error) => {
        console.warn('Unable to remove remote tag image during delete:', error);
      });
      clearCachedImage(existing.tagImagePath);
    }
    await window.appAuth.requestJson(
      `/rest/v1/standards?id=eq.${encodeURIComponent(existing.id)}`,
      { method:'DELETE' }
    );
  }
};

function resolveLocalImageData(imageState, existing){
  if(imageState.mode === 'new'){
    return imageState.dataUrl || '';
  }
  if(imageState.mode === 'existing-local'){
    return imageState.dataUrl || '';
  }
  if(imageState.mode === 'removed'){
    return '';
  }
  return existing?.tagImageDataUrl || '';
}

function resolveLocalImageName(imageState, existing){
  if(imageState.mode === 'new' || imageState.mode === 'existing-local'){
    return imageState.name || '';
  }
  if(imageState.mode === 'removed'){
    return '';
  }
  return existing?.tagImageName || '';
}

function resolveLocalImageType(imageState, existing){
  if(imageState.mode === 'new' || imageState.mode === 'existing-local'){
    return imageState.type || '';
  }
  if(imageState.mode === 'removed'){
    return '';
  }
  return existing?.tagImageType || '';
}

function firstRow(payload){
  return Array.isArray(payload) ? payload[0] || null : payload;
}

function buildStorageObjectPath(standardId, fileName){
  const cleaned = String(fileName || 'tag-image.jpg')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'tag-image.jpg';
  return `${standardId}/${Date.now()}-${cleaned}`;
}

function encodeStoragePath(path){
  return String(path || '').split('/').map((segment) => encodeURIComponent(segment)).join('/');
}

function dataUrlToBlob(dataUrl){
  const parts = String(dataUrl || '').split(',');
  if(parts.length < 2){
    throw new Error('Invalid image payload.');
  }
  const match = parts[0].match(/data:([^;]+);base64/i);
  const mime = match ? match[1] : 'application/octet-stream';
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for(let i = 0; i < binary.length; i += 1){
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type:mime });
}

async function uploadRemoteTagImage(path, dataUrl, type){
  const response = await window.appAuth.fetch(
    `/storage/v1/object/standard-tags/${encodeStoragePath(path)}`,
    {
      method:'POST',
      headers:{
        'Accept':'application/json',
        'Content-Type':type || 'image/jpeg',
        'x-upsert':'true'
      },
      body:dataUrlToBlob(dataUrl)
    }
  );
  if(!response.ok){
    const payload = await response.json().catch(() => ({}));
    const message = String(payload?.message || payload?.error || `Image upload failed (${response.status}).`);
    if(message.toLowerCase().includes('bucket not found')){
      throw new Error('Supabase storage bucket "standard-tags" was not found. Run the storage bucket section of supabase/schema.sql in Supabase, then try again.');
    }
    throw new Error(message);
  }
}

async function removeRemoteTagImage(path){
  await window.appAuth.requestJson('/storage/v1/object/remove', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({ prefixes:[path] })
  });
}

async function loadStandards(options = {}){
  try {
    const loaded = normalizeStandards(await getRepository().list());
    const snapshot = buildSnapshot(loaded);
    if(!options.force && snapshot === lastLoadedSnapshot){
      return false;
    }
    standards = loaded;
    lastLoadedSnapshot = snapshot;
    ensureSelectedStandard(options.preferredId || '');
    render();
    const modeLabel = isRemoteMode() ? 'Remote sync' : 'Local browser mode';
    setLastUpdateText(`${standards.length} record(s) | ${modeLabel} | ${new Date().toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })}`);
    if(!options.silent){
      showSaveStatus('loaded', isRemoteMode() ? 'SYNCED' : 'LOADED');
      hideSaveStatusSoon(1800);
    }
    return true;
  } catch (error){
    console.error('Unable to load standards:', error);
    setLastUpdateText('Unable to load standards records');
    if(!options.silent){
      showSaveStatus('error', 'LOAD FAILED');
      hideSaveStatusSoon(2400);
    }
    return false;
  }
}

function render(){
  renderStats();
  renderFilterButtons();
  renderViewButtons();
  renderTable();
  renderDetail();
  renderLogs();
}

function isInteractionOverlayOpen(){
  return document.getElementById('standard-modal-overlay')?.classList.contains('open');
}

async function refreshFromRemote(){
  if(!isRemoteMode() || document.hidden || isInteractionOverlayOpen() || autoRefreshInFlight || saveInFlight){
    return;
  }
  autoRefreshInFlight = true;
  try {
    const changed = await loadStandards({ silent:true });
    if(changed){
      showSaveStatus('loaded', 'SYNCED');
      hideSaveStatusSoon(1800);
    }
  } finally {
    autoRefreshInFlight = false;
  }
}

function startAutoRefresh(){
  stopAutoRefresh();
  if(!isRemoteMode()) return;
  autoRefreshTimer = setInterval(refreshFromRemote, AUTO_REFRESH_MS);
}

function stopAutoRefresh(){
  if(autoRefreshTimer){
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

document.getElementById('standard-modal-overlay').addEventListener('click', (event) => {
  if(event.target === document.getElementById('standard-modal-overlay')){
    closeStandardModal();
  }
});

document.addEventListener('visibilitychange', () => {
  if(!document.hidden){
    refreshFromRemote();
  }
});

window.addEventListener('beforeunload', () => {
  remoteImageUrlCache.forEach((url) => URL.revokeObjectURL(url));
  remoteImageUrlCache.clear();
});

(async function init(){
  await (window.authReadyPromise || Promise.resolve());
  await loadStandards({ silent:true });
  render();
  startAutoRefresh();
})();

