const PRI = {CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3,NONE:4};
const TEST_CODES = ['AS-BFV_DENSITY','AS-BFV_MW','C6GAS','GC-BFVC6MZ','GC-BFVC7MZ','GC-BFVC10MZ','GC-2103-C10MZ','C6LIQ','C10LIQ'];
const TEST_COLUMNS = [...TEST_CODES];
const HYDROCARBON_OPTIONS = [...Array.from({length:10}, (_, idx) => `C${idx + 1}`), 'UNKNOWN'];
const TEST_MINS = { 'AS-BFV_DENSITY':15, 'AS-BFV_MW':15, 'C6GAS':15, 'GC-BFVC6MZ':40, 'GC-BFVC7MZ':40, 'GC-BFVC10MZ':40, 'GC-2103-C10MZ':90, 'C6LIQ':40, 'C10LIQ':40
};
const COLUMN_STORAGE_KEY = 'lab-wip-column-visibility';
let columnVisibility = {};
const COLUMN_DEFS = [ {key:'number', label:'Work Order', width:190, fixed:true}, {key:'priority', label:'Priority', width:120}, {key:'client', label:'Client', width:200}, {key:'assignedTo', label:'Assigned To', width:180}, {key:'AS-BFV_DENSITY', label:'AS-BFV_DENSITY', width:130}, {key:'AS-BFV_MW', label:'AS-BFV_MW', width:130}, {key:'C6GAS', label:'C6GAS', width:110}, {key:'GC-BFVC6MZ', label:'GC-BFVC6MZ', width:130}, {key:'GC-BFVC7MZ', label:'GC-BFVC7MZ', width:130}, {key:'GC-BFVC10MZ', label:'GC-BFVC10MZ', width:130}, {key:'GC-2103-C10MZ', label:'GC-2103-C10MZ', width:150}, {key:'C6LIQ', label:'C6LIQ', width:110}, {key:'C10LIQ', label:'C10LIQ', width:110}, {key:'estTime', label:'Est. Time', width:120}, {key:'dueDate', label:'Due Date', width:130}, {key:'status', label:'Status', width:170},
];
const TEST_DEFINITION_STORAGE_KEY = 'lab-wip-test-definitions';
const FIXED_COLUMN_KEYS = ['number','priority','client','assignedTo'];
const TRAILING_COLUMN_KEYS = ['estTime','dueDate','status'];
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
let WOs = [];
let editId = null;
let sortState = {field:'priority',dir:'asc'};
let modalDraftTestRows = [];
let selectedTestRowId = null;
let modalSampleGroupKeys = [];
let expandedSampleGroups = new Set();
let activeActionWO = null;
let modalPdfAttachment = null;
let appView = 'queue';
let scheduleDragIndex = null;
let scheduleState = {date:'',employees:[],entries:[],tasks:[]};
let editingTestDefinitionId = null;
const WO_STAGE = { RUNNING:'running', PENDING:'pending', DONE:'done' };
function normalizeCatalogKey(raw){ return String(raw || '').trim().toUpperCase().replace(/\s+/g,'_').replace(/[^A-Z0-9_-]/g,''); }
function normalizeAliasToken(raw){ return String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g,''); }
function uniqueList(list){ return [...new Set((Array.isArray(list) ? list : []).map(item => String(item || '').trim()).filter(Boolean))]; }
function getColumnWidthForTest(def){ return Math.max(110, Math.min(180, 20 + String(def?.label || '').length * 8)); }
function inferTestTone(def){ const key = String(def?.key || '').toUpperCase(); if(def?.groupKey) return 'gc'; if(key.includes('LIQ')) return 'liq'; if(key.includes('2103')) return 'gc'; return 'default'; }
function inferMatrixType(def){ const key = String(def?.key || def?.label || '').toUpperCase(); const explicit = String(def?.matrixType || '').trim().toLowerCase(); if(explicit === 'gas') return 'Gas'; if(explicit === 'liquid') return 'Liquid'; if(explicit === 'calculated') return 'Calculated'; if(key.includes('LIQ') || key.includes('DENS')) return 'Liquid'; if(key.includes('GAS') || key.includes('2103')) return 'Gas'; return ''; }
function normalizeMinutesForMatrixType(matrixType, minutes){ if(matrixType === 'Calculated') return 0; return Math.max(0, Number(minutes || 0)); }
function normalizeTestDefinition(def, index = 0){ const key = normalizeCatalogKey(def?.key || def?.code || def?.label || `TEST_${index + 1}`); if(!key) return null; const label = String(def?.label || key).trim() || key; const aliasSource = Array.isArray(def?.aliases) ? def.aliases : String(def?.aliases || '').split(','); const aliases = uniqueList([key, label, ...aliasSource]); const matrixType = inferMatrixType(def); return { id:String(def?.id || key), key, label, shortLabel:String(def?.shortLabel || label).trim() || label, minutes:normalizeMinutesForMatrixType(matrixType, def?.minutes), countMode:def?.countMode === 'perRow' ? 'perRow' : 'perSample', matrixType, groupKey:normalizeCatalogKey(def?.groupKey || ''), groupRank:Math.max(0, Number(def?.groupRank || 0)), aliases, tone:matrixType === 'Liquid' ? 'liq' : inferTestTone({ key, groupKey:def?.groupKey || '' }), sortOrder:Number.isFinite(Number(def?.sortOrder)) ? Number(def.sortOrder) : index, columnWidth:getColumnWidthForTest(def) }; }
function getDefaultTestDefinitions(){ return DEFAULT_TEST_DEFS.map((def, index) => normalizeTestDefinition({ ...def, sortOrder:index }, index)).filter(Boolean); }
function getTestDefinitions(){ return testDefinitions.length ? testDefinitions : getDefaultTestDefinitions(); }
function getTestKeys(){ return getTestDefinitions().map(def => def.key); }
function getTestDefinitionByKey(key){ const normalized = normalizeCatalogKey(key); return getTestDefinitions().find(def => def.key === normalized) || null; }
function getTestLabel(key){ const direct = getTestDefinitionByKey(key); if(direct) return direct.label; const normalized = normalizeTestCode(key); return getTestDefinitionByKey(normalized)?.label || String(key || ''); }
function getTestShortLabel(key){ const direct = getTestDefinitionByKey(key); if(direct) return direct.shortLabel; const normalized = normalizeTestCode(key); return getTestDefinitionByKey(normalized)?.shortLabel || getTestLabel(key); }
function getDefaultTestKey(){ return getTestDefinitions()[0]?.key || 'TEST'; }
function getTestHeaderMeta(def){ if(def?.groupKey) return `${def.minutes} min grouped`; if(def?.countMode === 'perRow') return `${def.minutes} min each`; return `${def?.minutes || 0} min`; }
function syncLegacyTestArrays(){ TEST_CODES.splice(0, TEST_CODES.length, ...getTestKeys()); Object.keys(TEST_MINS).forEach(key => delete TEST_MINS[key]); getTestDefinitions().forEach(def => { TEST_MINS[def.key] = Number(def.minutes || 0); }); const fixedColumns = COLUMN_DEFS.filter(col => FIXED_COLUMN_KEYS.includes(col.key)); const trailingColumns = COLUMN_DEFS.filter(col => TRAILING_COLUMN_KEYS.includes(col.key)); COLUMN_DEFS.splice(0, COLUMN_DEFS.length, ...fixedColumns, ...getTestDefinitions().map(def => ({ key:def.key, label:def.label, width:def.columnWidth })), ...trailingColumns); }
function reconcileColumnVisibility(){ const defaults = {}; COLUMN_DEFS.forEach(col => { defaults[col.key] = true; }); columnVisibility = { ...defaults, ...(columnVisibility || {}) }; COLUMN_DEFS.forEach(col => { if(col.fixed) columnVisibility[col.key] = true; }); }
function setTestDefinitions(defs){ const next = (Array.isArray(defs) && defs.length ? defs : getDefaultTestDefinitions()).map((def, index) => normalizeTestDefinition(def, index)).filter(Boolean).sort((a,b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)); testDefinitions = next.length ? next : getDefaultTestDefinitions(); syncLegacyTestArrays(); reconcileColumnVisibility(); }
function normalizeTestCode(code){ const raw = String(code || '').trim(); if(!raw) return ''; const normalizedKey = normalizeCatalogKey(raw); if(getTestDefinitionByKey(normalizedKey)) return normalizedKey; const token = normalizeAliasToken(raw); if(!token) return ''; for(const def of getTestDefinitions()){ for(const alias of def.aliases){ const aliasToken = normalizeAliasToken(alias); if(aliasToken && aliasToken === token) return def.key; } } return ''; }
function getCanonicalTestTypeForRow(row){ const fromCode = normalizeTestCode(row?.testCode); if(fromCode) return fromCode; const fromType = normalizeTestCode(row?.type); return fromType || ''; }
function getTestRowDiagnostics(row){ const rawCode = String(row?.testCode || '').trim(); const storedType = String(row?.type || '').trim(); const canonicalFromCode = normalizeTestCode(rawCode); const canonicalFromType = normalizeTestCode(storedType); const canonicalType = canonicalFromCode || canonicalFromType || ''; const codeLooksCanonical = !!rawCode && normalizeCatalogKey(rawCode) === canonicalType; const usedAlias = !!rawCode && !!canonicalFromCode && !codeLooksCanonical; const unmapped = !!rawCode && !canonicalFromCode; const mismatch = !!canonicalFromCode && !!canonicalFromType && canonicalFromCode !== canonicalFromType; const missing = !rawCode && !canonicalFromType; const statusLabel = unmapped ? `Unmapped code: ${rawCode}` : mismatch ? `Mismatch: code maps to ${canonicalFromCode}, stored type is ${canonicalFromType}` : usedAlias ? `Legacy alias mapped to ${canonicalType}` : missing ? 'No test code mapped' : canonicalType ? `Mapped to ${canonicalType}` : 'No mapped test type'; return { rawCode, storedType, canonicalFromCode, canonicalFromType, canonicalType, usedAlias, unmapped, mismatch, missing, isMapped:!!canonicalType && !unmapped, statusLabel }; }
function normalizeHydrocarbonCode(code){ const raw = String(code || '').trim().toUpperCase().replace(/\s+/g,''); if(raw === 'UNKNOWN' || raw === 'UNK') return 'UNKNOWN'; if(/^C(?:10|[1-9])$/.test(raw)) return raw; const numeric = raw.replace(/^C/i,''); return /^(?:10|[1-9])$/.test(numeric) ? `C${numeric}` : ''; }
function getHydrocarbonRank(code){ const normalized = normalizeHydrocarbonCode(code); if(!normalized) return 999; if(normalized === 'UNKNOWN') return 998; return Number(normalized.slice(1)); }
function isLiquidTestCode(code){ const def = getTestDefinitionByKey(normalizeTestCode(code)); return !!def && (def.matrixType === 'Liquid' || def.tone === 'liq'); }
function blankCounts(){ return TEST_CODES.reduce((acc,code)=>{acc[code]=0;
return acc;},{});
}
function calculateCountsFromRows(rows){ const counts = blankCounts();
let minutes = 0;
let totalTests = 0;
const definitions = getTestDefinitions();
const defMap = new Map(definitions.map(def => [def.key, def]));
const sampleMap = new Map();
rows.forEach((row, idx) => { const sampleKey = (row?.sampleId && String(row.sampleId).trim()) || `ROW_${idx}`;
if(!sampleMap.has(sampleKey)) sampleMap.set(sampleKey, []); sampleMap.get(sampleKey).push(row); });
for(const sampleRows of sampleMap.values()){ const rowCodes = sampleRows.map(row => getCanonicalTestTypeForRow(row)).filter(Boolean);
const codeSet = new Set(rowCodes);
const rowCounts = rowCodes.reduce((acc, key) => { acc[key] = (acc[key] || 0) + 1; return acc; }, {});
const groupedSelections = new Map();
codeSet.forEach(key => { const def = defMap.get(key);
if(!def?.groupKey) return;
const current = groupedSelections.get(def.groupKey);
if(!current || def.groupRank > current.groupRank) groupedSelections.set(def.groupKey, def); });
groupedSelections.forEach(def => { counts[def.key] += 1; totalTests += 1; minutes += Number(def.minutes || 0); });
definitions.forEach(def => { if(def.groupKey) return;
if(def.countMode === 'perRow'){ const rowCount = Number(rowCounts[def.key] || 0);
if(!rowCount) return;
counts[def.key] += rowCount;
totalTests += rowCount;
minutes += rowCount * Number(def.minutes || 0);
return; }
if(codeSet.has(def.key)){ counts[def.key] += 1; totalTests += 1; minutes += Number(def.minutes || 0); } }); }
return {counts,minutes,totalTests};
}
function getWOMetrics(w){ const rows = Array.isArray(w.testRows) ? w.testRows : [];
if(rows.length) return calculateCountsFromRows(rows);
const counts = blankCounts();
let minutes = 0;
let totalTests = 0;
const legacyMap = { C6GAS:Number(w.gas || 0), C6LIQ:Number(w.liq || 0), 'GC-BFVC10MZ':Number(w.gc || 0) };
Object.entries(legacyMap).forEach(([key, count]) => { if(!count || !TEST_MINS[key]) return;
counts[key] += count;
totalTests += count;
minutes += count * TEST_MINS[key]; });
return {counts,minutes,totalTests};
}
const WO_FALLBACK_ASSIGNMENT_KEY = '__WO_TASK__';
function buildScheduleAssignmentKey(testType){ return testType ? String(testType || '') : WO_FALLBACK_ASSIGNMENT_KEY; }
function getScheduleTaskRowsForWO(w){
const testRows = Array.isArray(w?.testRows) ? w.testRows : [];
if(testRows.length){
return testRows.map((row, rowIndex) => { const diag = getTestRowDiagnostics(row); return { sampleId:String(row?.sampleId || `UNASSIGNED-${rowIndex + 1}`), testType:diag.canonicalType || '', matrix:String(row?.matrix || ''), hydrocarbon:normalizeHydrocarbonCode(row?.hydrocarbon), containerType:String(row?.containerType || ''), cylinderNumber:String(row?.cylinderNumber || ''), received:String(row?.received || ''), logDate:String(row?.logDate || ''), rawIndex:rowIndex, }; }).filter(row => row.testType);
}
const samples = Array.isArray(w?.samples) ? w.samples : [];
if(samples.length){
const rows = [];
samples.forEach((sample, sampleIndex) => { const sampleId = String(sample?.sampleId || `UNASSIGNED-${sampleIndex + 1}`); const codes = Array.isArray(sample?.testCodes) ? sample.testCodes : []; codes.forEach((code, codeIndex) => { const testType = normalizeTestCode(code); if(!testType) return; rows.push({ sampleId, testType, matrix:String(sample?.matrix || ''), hydrocarbon:normalizeHydrocarbonCode(sample?.hydrocarbon), containerType:String(sample?.containerType || ''), cylinderNumber:String(sample?.cylinderNumber || ''), received:String(sample?.received || ''), logDate:String(sample?.logDate || ''), rawIndex:(sampleIndex * 1000) + codeIndex, }); }); });
return rows;
}
return [];
}
function getSchedulableTasksForWO(w){
const counts = getWOCounts(w);
const assignments = getTestDefinitions().map(def => { const quantity = Number(counts[def.key] || 0); if(!quantity) return null; const isAutoCalculated = def.matrixType === 'Calculated'; return { assignmentKey:buildScheduleAssignmentKey(def.key), testType:def.key, label:def.label, quantity, taskMinutes:quantity * Number(def.minutes || 0), matrixType:def.matrixType || '', sortOrder:Number(def.sortOrder || 0), isFallback:false, assignable:!isAutoCalculated, isAutoCalculated }; }).filter(Boolean).sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
if(assignments.length) return assignments;
return [{ assignmentKey:WO_FALLBACK_ASSIGNMENT_KEY, testType:'', label:'WO Task', quantity:1, taskMinutes:calcM(w), matrixType:getPrimaryMatrixGroup(w), sortOrder:99999, isFallback:true, assignable:true, isAutoCalculated:false }];
}
function aggregateTaskCounts(tasks){ const totals = blankCounts(); (Array.isArray(tasks) ? tasks : []).forEach(task => { if(!task?.testType || totals[task.testType] === undefined) return; totals[task.testType] += Number(task.quantity || 0); }); return totals; }
function normalizePdfAttachment(a){ if(!a || typeof a !== 'object') return null;
const dataUrl = typeof a.dataUrl === 'string' ? a.dataUrl : '';
if(!dataUrl) return null;
return { name: String(a.name || 'attachment.pdf'), type: 'application/pdf', size: Number(a.size || 0), dataUrl }; }
function normalizeStage(src){ const raw = String(src?.stage || '').trim().toLowerCase();
if(raw === WO_STAGE.PENDING) return WO_STAGE.PENDING;
if(raw === WO_STAGE.DONE) return WO_STAGE.DONE;
if(src?.complete) return WO_STAGE.DONE;
return WO_STAGE.RUNNING;
}
function normalizeWorkOrder(w){ const src = (w && typeof w === 'object') ? w : {};
const stage = normalizeStage(src);
return { ...src, id: String(src.id || uid()), number: String(src.number || ''), client: String(src.client || ''), location: String(src.location || 'Pittsburgh'), dueDate: src.dueDate || null, priority: PRI[String(src.priority || '').toUpperCase()] !== undefined ? String(src.priority).toUpperCase() : 'NONE', stage, complete: stage === WO_STAGE.DONE, notes: String(src.notes || ''), gas: Number(src.gas || 0), liq: Number(src.liq || 0), gc: Number(src.gc || 0), samples: Array.isArray(src.samples) ? src.samples : [], testRows: Array.isArray(src.testRows) ? src.testRows : [], pdfAttachment: normalizePdfAttachment(src.pdfAttachment) }; }
function normalizeWorkOrders(list){ if(!Array.isArray(list)) return [];
return list.map(normalizeWorkOrder).filter(w => w.number || w.id); } const calcM = w => getWOMetrics(w).minutes;
const getWOCounts = w => getWOMetrics(w).counts;
const getWOTestTotal = w => getWOMetrics(w).totalTests;
const fmtM = m => { if(!m)return '';
const h=Math.floor(m/60),n=m%60;
return h===0?`${n}m`:n===0?`${h}h`:`${h}h ${n}m`; };
const fmtMOrZero = m => m ? fmtM(m) : '0m';
const uid = () => 'w'+Date.now()+Math.random().toString(36).slice(2,5);
const todayISO = () => { const d = new Date();
return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const parseDate = s => { if(!s)return null;
const raw = String(s).trim();
const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
const d = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(raw);
d.setHours(0,0,0,0);
return isNaN(d)?null:d; };
const fmtDate = s => { const d=parseDate(s);
return d?d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):null; };
const toInputDate = s => { const d = parseDate(s);
if(!d) return '';
const y = d.getFullYear();
const m = String(d.getMonth()+1).padStart(2,'0');
const day = String(d.getDate()).padStart(2,'0');
return `${y}-${m}-${day}`; };
const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const inferTypeFromCode = code => normalizeTestCode(code); setTestDefinitions(getDefaultTestDefinitions()); scheduleState = {date:todayISO(),employees:[],entries:[],tasks:[]}; (function tick(){ const n=new Date(); document.getElementById('clock').textContent=n.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'}); document.getElementById('datedisp').textContent=n.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'}); setTimeout(tick,1000); })();
function clickSort(f){ if(sortState.field===f) sortState.dir=sortState.dir==='asc'?'desc':'asc'; else{sortState.field=f;sortState.dir='asc';} document.getElementById('sort-field').value=f; document.getElementById('sort-dir').value=sortState.dir; render(); }
function sortByPriority(){ sortState = {field:'priority',dir:'asc'}; document.getElementById('sort-field').value='priority'; document.getElementById('sort-dir').value='asc'; render(); }
function getSorted(){ const f=document.getElementById('sort-field').value;
const d=document.getElementById('sort-dir').value; sortState={field:f,dir:d};
const now=new Date();now.setHours(0,0,0,0);
const diff=w=>{const dt=parseDate(w.dueDate);
return dt?Math.round((dt-now)/86400000):9999;};
const arr=[...WOs]; arr.sort((a,b)=>{ let av,bv;
if(f==='priority'){av=PRI[a.priority||'NONE'];bv=PRI[b.priority||'NONE'];} else if(f==='dueDate'||f==='status'){av=diff(a);bv=diff(b);} else if(f==='number'){av=a.number;bv=b.number;} else if(f==='client'){av=(a.client||'').toLowerCase();bv=(b.client||'').toLowerCase();} else if(f==='assignedTo'){av=getWOAssigneeLabel(a).toLowerCase();bv=getWOAssigneeLabel(b).toLowerCase();} else if(f==='estTime'){av=calcM(a);bv=calcM(b);} else if(TEST_CODES.includes(f)){av=getWOCounts(a)[f]||0;bv=getWOCounts(b)[f]||0;} else {av=0;bv=0;} if(av<bv)return d==='asc'?-1:1;
if(av>bv)return d==='asc'?1:-1;
return 0; }); arr.sort((a,b)=>a.complete===b.complete?0:a.complete?1:-1);
return arr; }
function getStatus(w){ if(w.stage===WO_STAGE.DONE)return{label:'COMPLETE',cls:'sb-done',overdue:false,dl:''};
if(w.stage===WO_STAGE.PENDING)return{label:'RESULTS PENDING',cls:'sb-pending',overdue:false,dl:'Waiting for posting/review'};
const d=parseDate(w.dueDate);
if(!d)return{label:'No Due Date',cls:'sb-warn',overdue:false,dl:''};
const dif=Math.round((d-((x=>{x.setHours(0,0,0,0);
return x;})(new Date())))/86400000);
if(dif<0)return{label:'OVERDUE',cls:'sb-danger',overdue:true,dl:`${Math.abs(dif)} day(s) past due`};
if(dif===0)return{label:'DUE TODAY',cls:'sb-warn',overdue:false,dl:'Due today'}; return{label:`${dif}d remaining`,cls:'sb-ok',overdue:false,dl:''}; }
function switchView(view){ appView = view === 'schedule' ? 'schedule' : view === 'pending' ? 'pending' : 'queue'; document.getElementById('queue-screen').classList.toggle('active', appView === 'queue'); document.getElementById('pending-screen').classList.toggle('active', appView === 'pending'); document.getElementById('schedule-screen').classList.toggle('active', appView === 'schedule'); document.getElementById('view-queue-btn').classList.toggle('active', appView === 'queue'); document.getElementById('view-pending-btn').classList.toggle('active', appView === 'pending'); document.getElementById('view-schedule-btn').classList.toggle('active', appView === 'schedule');
if(appView === 'schedule') renderSchedule(); else render();
}
function getOpenScheduleTaskMap(){ const map = new Map(); getOpenWOsSorted().forEach(wo => { map.set(wo.id, wo); }); return map; }
function normalizeScheduleAssignmentsForWO(wo, assignments, employeeSet){
const validKeys = new Set(getSchedulableTasksForWO(wo).filter(item => item.assignable !== false).map(item => item.assignmentKey));
const normalized = {};
Object.entries(assignments && typeof assignments === 'object' ? assignments : {}).forEach(([key, value]) => {
const assignmentKey = String(key || '').trim();
const tech = String(value || '').trim();
if(!assignmentKey || !tech || !validKeys.has(assignmentKey) || !employeeSet.has(tech)) return;
normalized[assignmentKey] = tech;
});
return normalized;
}
function getScheduleAssignmentsForWO(wo, assignments = {}){
return getSchedulableTasksForWO(wo).map(item => ({ ...item, tech:item.assignable === false ? '' : String(assignments?.[item.assignmentKey] || '').trim() }));
}
function collectAssignmentTechs(items){
return [...new Set((Array.isArray(items) ? items : []).filter(item => item?.assignable !== false).map(item => String(item?.tech || '').trim()).filter(Boolean))];
}
function buildAssignmentSummary(items, includeTech = true){
const parts = (Array.isArray(items) ? items : []).map(item => {
const quantity = Number(item?.quantity || 0);
const label = `${item?.label || 'WO Task'}${quantity > 1 ? ` x${quantity}` : ''}`;
if(item?.assignable === false) return includeTech ? `${label} -> Auto-calculated` : `${label} (Auto)`;
return includeTech ? `${label} -> ${item?.tech || 'Unassigned'}` : label;
}).filter(Boolean);
return parts.length ? parts.join(' | ') : 'No test assignments';
}
function normalizeScheduleState(){ if(!scheduleState || typeof scheduleState !== 'object') scheduleState = {};
if(!scheduleState.date) scheduleState.date = todayISO();
if(!Array.isArray(scheduleState.employees)) scheduleState.employees = [];
if(!Array.isArray(scheduleState.entries)) scheduleState.entries = [];
if(!Array.isArray(scheduleState.tasks)) scheduleState.tasks = [];
scheduleState.employees = [...new Set(scheduleState.employees.map(name => String(name || '').trim()).filter(Boolean))];
const employeeSet = new Set(scheduleState.employees);
const runningWOs = getOpenWOsSorted();
const woMap = new Map(runningWOs.map(wo => [wo.id, wo]));
const normalizedEntries = [];
const groupedLegacyEntries = new Map();
const groupedLegacyOrder = [];
const seenWOIds = new Set();
const ensureLegacyGroup = (woId, mode) => {
if(groupedLegacyEntries.has(woId)) return groupedLegacyEntries.get(woId);
const group = { woId, mode, items:[] };
groupedLegacyEntries.set(woId, group);
groupedLegacyOrder.push(group);
return group;
};
scheduleState.entries.forEach((entry) => {
const woId = String(entry?.woId || '').trim();
if(!woId || !woMap.has(woId)) return;
const wo = woMap.get(woId);
const isCurrentShape = entry && typeof entry === 'object' && !entry.taskKey && !Array.isArray(entry.assignees) && entry.assignments && typeof entry.assignments === 'object';
if(isCurrentShape){
if(seenWOIds.has(woId)) return;
normalizedEntries.push({ woId, assignments:normalizeScheduleAssignmentsForWO(wo, entry.assignments, employeeSet), notes:String(entry.notes || '') });
seenWOIds.add(woId);
return;
}
if(entry && typeof entry === 'object' && Array.isArray(entry.assignees)){
const group = ensureLegacyGroup(woId, 'assignees');
group.items.push(entry);
return;
}
if(entry && typeof entry === 'object'){
const group = ensureLegacyGroup(woId, 'tasks');
group.items.push(entry);
}
});
groupedLegacyOrder.forEach(group => {
if(seenWOIds.has(group.woId)) return;
const wo = woMap.get(group.woId);
if(!wo) return;
let notes = '';
let assignments = {};
if(group.mode === 'assignees'){
const legacyAssignees = [...new Set(group.items.flatMap(item => Array.isArray(item?.assignees) ? item.assignees : []).map(name => String(name || '').trim()).filter(name => employeeSet.has(name)))];
notes = group.items.map(item => String(item?.notes || '')).find(Boolean) || '';
assignments = {};
getSchedulableTasksForWO(wo).forEach((item, index) => {
const tech = legacyAssignees.length ? legacyAssignees[index % legacyAssignees.length] : '';
if(tech) assignments[item.assignmentKey] = tech;
});
} else {
notes = group.items.map(item => String(item?.notes || '')).find(Boolean) || '';
assignments = {};
group.items.forEach(item => {
const assignmentKey = buildScheduleAssignmentKey(item?.testType || '');
const tech = String(item?.tech || '').trim();
if(!assignments[assignmentKey] && tech) assignments[assignmentKey] = tech;
});
}
normalizedEntries.push({ woId:group.woId, assignments:normalizeScheduleAssignmentsForWO(wo, assignments, employeeSet), notes });
seenWOIds.add(group.woId);
});
scheduleState.entries = normalizedEntries;
scheduleState.tasks = scheduleState.tasks.map(task => ({ id: String(task?.id || uid()), employee: String(task?.employee || '').trim(), name: String(task?.name || '').trim(), minutes: Number(task?.minutes || 0) })).filter(task => task.employee && employeeSet.has(task.employee) && task.name).map(task => ({ ...task, minutes: task.minutes > 0 ? task.minutes : 0 }));
}
function getOpenWOsSorted(){ const arr = WOs.filter(w => w.stage === WO_STAGE.RUNNING);
const now = new Date(); now.setHours(0,0,0,0);
const diff = (w) => { const dt = parseDate(w.dueDate);
return dt ? Math.round((dt - now) / 86400000) : 9999; }; arr.sort((a,b) => { const priA = PRI[a.priority || 'NONE'];
const priB = PRI[b.priority || 'NONE'];
if(priA !== priB) return priA - priB;
const dueA = diff(a);
const dueB = diff(b);
if(dueA !== dueB) return dueA - dueB;
return String(a.number || '').localeCompare(String(b.number || '')); });
return arr;
}
function getScheduleRows(){ normalizeScheduleState();
return scheduleState.entries.map((entry, index) => {
const wo = WOs.find(w => w.id === entry.woId && w.stage === WO_STAGE.RUNNING);
if(!wo) return null;
const assignmentItems = getScheduleAssignmentsForWO(wo, entry.assignments);
const assignedTechs = collectAssignmentTechs(assignmentItems);
const totalMinutes = assignmentItems.reduce((sum, item) => sum + Number(item.taskMinutes || 0), 0);
const assignedMinutes = assignmentItems.reduce((sum, item) => sum + (item.tech ? Number(item.taskMinutes || 0) : 0), 0);
return { entry, wo, order:index + 1, assignmentItems, assignmentMap:{ ...(entry.assignments || {}) }, assignedTechs, totalMinutes, assignedMinutes, unassignedMinutes:Math.max(0, totalMinutes - assignedMinutes), matrixType:getPrimaryMatrixGroup(wo) };
}).filter(Boolean);
}
function buildEmployeePlan(rows){ const plan = new Map(scheduleState.employees.map(name => [name, {name, minutes:0, items:[]}]));
const unassigned = {name:'Unassigned', minutes:0, items:[]};
for(const row of rows){
row.assignmentItems.forEach(item => {
if(item.assignable === false) return;
const owner = String(item.tech || '').trim();
const target = owner ? (plan.get(owner) || {name:owner, minutes:0, items:[]}) : unassigned;
if(owner && !plan.has(owner)) plan.set(owner, target);
target.minutes += Number(item.taskMinutes || 0);
target.items.push({ order:row.order, woNumber:row.wo.number, testType:item.label, quantity:Number(item.quantity || 0), minutes:Number(item.taskMinutes || 0) });
});
}
const out = [...plan.values()].filter(p => p.minutes > 0 || scheduleState.employees.includes(p.name));
if(unassigned.minutes > 0) out.push(unassigned); out.sort((a,b) => b.minutes - a.minutes);
return out;
}
function getEmployeeTasks(employeeName){ return scheduleState.tasks.filter(task => task.employee === employeeName); }
function getWOAssigneeList(w){ const entry = scheduleState.entries.find(item => item.woId === w?.id); if(!entry) return []; const wo = WOs.find(item => item.id === w?.id); if(!wo) return []; return collectAssignmentTechs(getScheduleAssignmentsForWO(wo, entry.assignments)); }
function getWOAssigneeLabel(w){ const assignees = getWOAssigneeList(w); return assignees.length ? assignees.join(' | ') : 'Unassigned'; }
function getFilteredWorkOrders(){ const showDone = document.getElementById('show-done').checked;
let sorted = getSorted();
if(appView === 'pending') return sorted.filter(w => w.stage === WO_STAGE.PENDING);
if(showDone) return sorted.filter(w => w.stage !== WO_STAGE.PENDING);
return sorted.filter(w => w.stage === WO_STAGE.RUNNING);
}
function updateMoveButton(){ const btn = document.getElementById('btn-move');
if(!btn) return;
const w = editId ? WOs.find(x => x.id === editId) : null;
if(!w || w.stage === WO_STAGE.DONE){ btn.style.display = 'none'; return; }
btn.style.display = 'inline-block';
btn.textContent = w.stage === WO_STAGE.PENDING ? 'Move to Running Queue' : 'Move to Results Pending';
}
function moveWorkOrderStage(id, nextStage){ const w = WOs.find(x => x.id === id);
if(!w) return;
w.stage = nextStage;
w.complete = nextStage === WO_STAGE.DONE;
normalizeScheduleState();
render();
scheduleSave();
}
function moveWorkOrderStageFromModal(){ if(!editId) return;
const w = WOs.find(x => x.id === editId);
if(!w || w.stage === WO_STAGE.DONE) return;
const nextStage = w.stage === WO_STAGE.PENDING ? WO_STAGE.RUNNING : WO_STAGE.PENDING;
moveWorkOrderStage(editId, nextStage);
openModal(editId);
}
function buildReportData(scope = '__master__'){ const rows = getScheduleRows().map(row => ({ ...row, matrixType:row.matrixType || getPrimaryMatrixGroup(row.wo) }));
const isMaster = !scope || scope === '__master__';
const employeeName = isMaster ? 'Master Report' : scope;
const filteredRows = rows.map(row => {
const reportAssignmentItems = isMaster ? row.assignmentItems : row.assignmentItems.filter(item => item.tech === scope);
return { ...row, reportAssignmentItems, reportTechs:collectAssignmentTechs(reportAssignmentItems), reportMinutes:reportAssignmentItems.reduce((sum, item) => sum + Number(item.taskMinutes || 0), 0) };
}).filter(row => isMaster ? true : row.reportAssignmentItems.length > 0);
const gasRows = filteredRows.map(row => {
const gasAssignmentItems = row.reportAssignmentItems.filter(item => normalizeMatrixBucket(item.matrixType) === 'Gas');
if(!gasAssignmentItems.length) return null;
return { ...row, reportAssignmentItems:gasAssignmentItems, reportTechs:collectAssignmentTechs(gasAssignmentItems), reportMinutes:gasAssignmentItems.reduce((sum, item) => sum + Number(item.taskMinutes || 0), 0) };
}).filter(Boolean);
const liquidSampleRows = getLiquidLaneRows(filteredRows, isMaster ? '' : scope);
const plan = buildEmployeePlan(rows);
const filteredPlan = isMaster ? plan : plan.filter(p => p.name === scope);
const reportEmployees = isMaster ? scheduleState.employees : [scope];
const taskBuckets = reportEmployees.filter(name => !!name).map(name => ({ name, tasks:getEmployeeTasks(name) }));
const hasTasks = taskBuckets.some(bucket => bucket.tasks.length);
return { isMaster, employeeName, rows, filteredRows, gasRows, liquidSampleRows, plan:filteredPlan, taskBuckets, hasTasks };
}
function renderPrintTargetOptions(){ const select = document.getElementById('print-report-target');
if(!select) return;
const current = select.value || '__master__';
select.innerHTML = ['<option value="__master__">Master Report</option>', ...scheduleState.employees.map(name => `<option value="${esc(name)}">${esc(name)}</option>`)].join('');
select.value = scheduleState.employees.includes(current) || current === '__master__' ? current : '__master__';
}
function renderTaskEmployeeOptions(){ const select = document.getElementById('task-employee-select');
if(!select) return;
const current = select.value || '';
select.innerHTML = ['<option value="">Select employee...</option>', ...scheduleState.employees.map(name => `<option value="${esc(name)}">${esc(name)}</option>`)].join('');
select.value = scheduleState.employees.includes(current) ? current : '';
}
function renderTaskList(){ const taskList = document.getElementById('task-list');
if(!taskList) return;
if(!scheduleState.employees.length){ taskList.innerHTML = '<div class="task-empty">Add employees before assigning tasks.</div>'; return; }
const buckets = scheduleState.employees.map(name => ({ name, tasks:getEmployeeTasks(name) }));
if(!buckets.some(bucket => bucket.tasks.length)){ taskList.innerHTML = '<div class="task-empty">No additional tasks assigned yet.</div>'; return; }
taskList.innerHTML = buckets.filter(bucket => bucket.tasks.length).map(bucket => { const totalMinutes = bucket.tasks.reduce((sum, task) => sum + Number(task.minutes || 0), 0);
return ` <div class="task-card"> <div class="task-card-head"> <div class="task-card-name">${esc(bucket.name)}</div> <div class="task-card-total">${totalMinutes ? fmtMOrZero(totalMinutes) : 'No time set'}</div> </div> <div class="task-card-lines"> ${bucket.tasks.map(task => `<div><span>${esc(task.name)}${task.minutes ? ` (${fmtMOrZero(task.minutes)})` : ''}</span><button class="act-btn" type="button" onclick="removeEmployeeTask('${esc(task.id)}')">Remove</button></div>`).join('')} </div> </div> `;
}).join('');
}
function renderSortFieldOptions(){ const select = document.getElementById('sort-field');
if(!select) return;
const current = sortState.field || select.value || 'priority';
const baseOptions = [
{ value:'priority', label:'Priority' },
{ value:'dueDate', label:'Due Date' },
{ value:'number', label:'WO Number' },
{ value:'client', label:'Client' },
{ value:'assignedTo', label:'Assigned To' },
];
const testOptions = getTestDefinitions().map(def => ({ value:def.key, label:def.label }));
const trailingOptions = [
{ value:'estTime', label:'Est. Time' },
{ value:'status', label:'Status' },
];
select.innerHTML = [...baseOptions, ...testOptions, ...trailingOptions].map(option => `<option value="${esc(option.value)}">${esc(option.label)}</option>`).join('');
select.value = [...baseOptions, ...testOptions, ...trailingOptions].some(option => option.value === current) ? current : 'priority';
sortState.field = select.value;
}
function renderWorkOrderTableHeaders(){ const buildHeader = () => COLUMN_DEFS.map(col => { if(FIXED_COLUMN_KEYS.includes(col.key) || TRAILING_COLUMN_KEYS.includes(col.key)){ return `<th class="sortable col-${col.key}" onclick="clickSort('${col.key}')">${esc(col.label)}</th>`; } const def = getTestDefinitionByKey(col.key); const meta = def ? getTestHeaderMeta(def) : ''; return `<th class="num sortable col-${col.key}" onclick="clickSort('${col.key}')">${esc(col.label)}<br><span style="font-size:9px;font-weight:400;color:#4a5568">${esc(meta)}</span></th>`; }).join(''); const queueHead = document.getElementById('wo-table-head'); const pendingHead = document.getElementById('pending-wo-table-head'); if(queueHead) queueHead.innerHTML = `<tr>${buildHeader()}</tr>`; if(pendingHead) pendingHead.innerHTML = `<tr>${buildHeader()}</tr>`; }
function renderTestTypeOptions(){ const options = getTestDefinitions().map(def => `<option value="${esc(def.key)}">${esc(def.label)}</option>`).join(''); ['f-test-type','e-test-type'].forEach(id => { const select = document.getElementById(id); if(!select) return; const current = select.value; const normalizedCurrent = normalizeTestCode(current); select.innerHTML = options; select.value = getTestDefinitionByKey(current)?.key || getTestDefinitionByKey(normalizedCurrent)?.key || getDefaultTestKey(); }); }
function renderTestEstimateFooter(){ const footer = document.getElementById('test-estimates-footer');
if(!footer) return;
const parts = getTestDefinitions().map(def => `${def.label} = ${def.minutes} min${def.groupKey ? ' grouped by highest rank per sample' : def.countMode === 'perRow' ? ' per row' : ''}`);
footer.textContent = `TIME ESTIMATES: ${parts.join(' | ')}`;
}
function renderTestCatalogList(){ const container = document.getElementById('test-catalog-list');
if(!container) return;
container.innerHTML = getTestDefinitions().map(def => { const detail = [`${def.minutes} min`, def.countMode === 'perRow' ? 'per row' : 'per sample', def.groupKey ? `group ${def.groupKey} rank ${def.groupRank}` : 'standalone'].join(' | '); return `<div style="border:1px solid var(--border);border-radius:6px;padding:8px;background:var(--surface);"> <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;"> <div> <div style="color:var(--text);font-family:var(--sans);font-size:14px;">${esc(def.label)}</div> <div style="color:var(--muted);font-family:var(--mono);font-size:11px;">${esc(def.key)} | ${esc(detail)}</div> </div> <button type="button" class="act-btn" onclick="editTestCatalogEntry('${esc(def.id)}')">Edit</button> </div> </div>`; }).join('');
}
function renderDynamicTestUI(){ renderSortFieldOptions(); renderWorkOrderTableHeaders(); renderTestTypeOptions(); renderTestEstimateFooter(); renderColumnSelector(); renderTestCatalogList(); applyColumnVisibility(); }
function initColumnVisibility(){ const defaults = {}; COLUMN_DEFS.forEach(col => { defaults[col.key] = true; }); try { const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
const parsed = raw ? JSON.parse(raw) : {}; columnVisibility = {...defaults, ...(parsed && typeof parsed === 'object' ? parsed : {})}; } catch { columnVisibility = defaults; }
reconcileColumnVisibility();
}
function getVisibleColumnCount(){ return COLUMN_DEFS.filter(col => col.fixed || columnVisibility[col.key] !== false).length;
}
function persistColumnVisibility(){ try { localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columnVisibility)); } catch {}
}
function applyColumnVisibility(){ COLUMN_DEFS.forEach(col => { const visible = col.fixed ? true : columnVisibility[col.key] !== false; document.querySelectorAll(`.col-${col.key}`).forEach(el => { el.style.display = visible ? '' : 'none'; }); });
const tbl = document.getElementById('wo-table');
if(tbl){ const width = COLUMN_DEFS.reduce((sum,col)=> sum + (columnVisibility[col.key] !== false ? col.width : 0), 0); tbl.style.minWidth = `${Math.max(580, width)}px`; }
}
function renderColumnSelector(){ const grid = document.getElementById('column-grid');
if(!grid) return; grid.innerHTML = COLUMN_DEFS.filter(col => !col.fixed).map(col => ` <label class="column-opt"> <input type="checkbox" ${columnVisibility[col.key] === false ? '' : 'checked'} onchange="setColumnVisibility('${col.key}', this.checked)"> <span>${col.label}</span> </label> `).join('');
}
function showAllColumns(){ COLUMN_DEFS.forEach(col => { if(!col.fixed) columnVisibility[col.key] = true; }); applyColumnVisibility(); persistColumnVisibility(); render(); renderColumnSelector(); }
function showColumnsWithData(){ const visibleWorkOrders = getFilteredWorkOrders(); const testColumnsWithData = new Set(); visibleWorkOrders.forEach(w => { const counts = getWOCounts(w); TEST_CODES.forEach(code => { if(Number(counts?.[code] || 0) > 0) testColumnsWithData.add(code); }); }); COLUMN_DEFS.forEach(col => { if(col.fixed) return; columnVisibility[col.key] = TEST_CODES.includes(col.key) ? testColumnsWithData.has(col.key) : true; }); applyColumnVisibility(); persistColumnVisibility(); render(); renderColumnSelector(); }
function toggleColumnSelector(){ const panel = document.getElementById('column-panel'); panel.classList.toggle('open');
}
function setColumnVisibility(code, isVisible){ const colDef = COLUMN_DEFS.find(col => col.key === code);
if(colDef?.fixed) return;
const next = {...columnVisibility, [code]: !!isVisible};
const visibleCount = COLUMN_DEFS.filter(col => col.fixed || next[col.key] !== false).length;
if(visibleCount === 0) return; columnVisibility = next; applyColumnVisibility(); persistColumnVisibility(); render();
}
function aggregateCounts(workOrders){ const totals = blankCounts(); workOrders.forEach(w => { const counts = getWOCounts(w); TEST_CODES.forEach(code => { totals[code] += counts[code] || 0; }); });
return totals;
}
function formatCountsSummary(counts){ const parts = getTestDefinitions().map(def => ({label:getTestShortLabel(def.key), value:Number(counts[def.key] || 0)})).filter(item => item.value > 0).map(item => `${item.label} ${item.value}`);
return parts.length ? parts.join(' | ') : 'None'; }
function normalizeMatrixBucket(raw){ const m = (raw || '').toString().trim().toLowerCase();
if(!m) return '';
if(m.includes('gas')) return 'Gas';
if(m.includes('oil') || m.includes('liq')) return 'Liquid';
return ''; }
function isLiquidSampleRecord(sample){ return normalizeMatrixBucket(sample?.matrix) === 'Liquid'; }
function isLiquidScheduleTask(task){ if(!task || task.isFallback) return false; if(task.matrixType === 'Liquid') return true; if(normalizeMatrixBucket(task.matrixType) === 'Liquid') return true; if(normalizeMatrixBucket(task.matrix) === 'Liquid') return true; return !!task.testType && isLiquidTestCode(task.testType); }
function getLiquidSamplesForWO(w){ const samples = Array.isArray(w?.samples) ? w.samples : []; if(samples.length){ return samples.map((sample, sampleIndex) => ({ sampleId:String(sample?.sampleId || `UNASSIGNED-${sampleIndex + 1}`), matrix:String(sample?.matrix || ''), hydrocarbon:normalizeHydrocarbonCode(sample?.hydrocarbon), sourceIndex:sampleIndex })).filter(sample => isLiquidSampleRecord(sample)); } const rows = Array.isArray(w?.testRows) ? w.testRows : []; const grouped = new Map(); rows.forEach((row, rowIndex) => { const sampleId = String(row?.sampleId || `UNASSIGNED-${rowIndex + 1}`); if(!grouped.has(sampleId)) grouped.set(sampleId, { sampleId, matrix:String(row?.matrix || ''), hydrocarbon:normalizeHydrocarbonCode(row?.hydrocarbon), sourceIndex:rowIndex, hasLiquidTest:false }); const sample = grouped.get(sampleId); if(!sample.matrix) sample.matrix = String(row?.matrix || ''); if(!sample.hydrocarbon) sample.hydrocarbon = normalizeHydrocarbonCode(row?.hydrocarbon); if(isLiquidTestCode(row?.testCode || row?.type)) sample.hasLiquidTest = true; }); return [...grouped.values()].filter(sample => isLiquidSampleRecord(sample) || sample.hasLiquidTest); }
function getLiquidLaneRows(scheduleRows, techScope = ''){ const grouped = new Map(); scheduleRows.forEach(row => { const taskRows = getScheduleTaskRowsForWO(row.wo); const liquidSamples = getLiquidSamplesForWO(row.wo); liquidSamples.forEach(sample => { const liquidTypes = [...new Set(taskRows.filter(task => String(task.sampleId || '') === String(sample.sampleId || '') && isLiquidScheduleTask(task)).map(task => task.testType).filter(Boolean))]; const techs = new Set(); liquidTypes.forEach(testType => { const tech = String(row.assignmentMap?.[buildScheduleAssignmentKey(testType)] || '').trim(); if(tech && (!techScope || tech === techScope)) techs.add(tech); }); if(techScope && !techs.size) return; const key = `${row.wo.id}::${sample.sampleId}`; if(!grouped.has(key)) grouped.set(key, { wo:row.wo, scheduleOrder:row.order, sampleId:String(sample.sampleId || 'UNASSIGNED'), hydrocarbon:sample.hydrocarbon || '', hydrocarbonRank:getHydrocarbonRank(sample.hydrocarbon), sourceIndex:Number(sample.sourceIndex || 0), techs:new Set(), }); const lane = grouped.get(key); lane.scheduleOrder = Math.min(lane.scheduleOrder, row.order); if(!lane.hydrocarbon && sample.hydrocarbon) lane.hydrocarbon = sample.hydrocarbon; lane.hydrocarbonRank = getHydrocarbonRank(lane.hydrocarbon); lane.sourceIndex = Math.min(lane.sourceIndex, Number(sample.sourceIndex || 0)); techs.forEach(name => lane.techs.add(name)); }); }); const laneRows = [...grouped.values()]; laneRows.sort((a,b) => { if(a.hydrocarbonRank !== b.hydrocarbonRank) return a.hydrocarbonRank - b.hydrocarbonRank; if(a.scheduleOrder !== b.scheduleOrder) return a.scheduleOrder - b.scheduleOrder; if(a.sourceIndex !== b.sourceIndex) return a.sourceIndex - b.sourceIndex; return a.sampleId.localeCompare(b.sampleId); }); return laneRows.map((row, index) => ({ ...row, assignees:[...row.techs], laneOrder:index + 1 })); }
function updateSampleHydrocarbon(woId, sampleId, hydrocarbon){ const wo = WOs.find(item => item.id === woId); if(!wo) return; const nextCode = normalizeHydrocarbonCode(hydrocarbon); if(Array.isArray(wo.samples)){ wo.samples.forEach(sample => { if(String(sample?.sampleId || '') === String(sampleId || '')) sample.hydrocarbon = nextCode; }); } if(Array.isArray(wo.testRows)){ wo.testRows.forEach(row => { if(String(row?.sampleId || '') === String(sampleId || '')) row.hydrocarbon = nextCode; }); } render(); scheduleSave(); }
function getPrimaryMatrixGroup(w){ let gas = 0;
let liquid = 0;
const samples = Array.isArray(w.samples) ? w.samples : [];
const rows = Array.isArray(w.testRows) ? w.testRows : [];
if(samples.length){ for(const s of samples){ const bucket = normalizeMatrixBucket(s.matrix);
if(bucket==='Gas') gas += 1; else if(bucket==='Liquid') liquid += 1; } } else if(rows.length){ for(const r of rows){ const bucket = normalizeMatrixBucket(r.matrix);
if(bucket==='Gas') gas += 1; else if(bucket==='Liquid') liquid += 1; } } else { gas = Number(w.gas || 0); liquid = Number(w.liq || 0); } if(gas===0 && liquid===0) return 'Unknown Matrix';
return gas >= liquid ? 'Gas' : 'Liquid'; }
function renderSchedule(){ normalizeScheduleState();
const schedDate = document.getElementById('sched-date');
if(schedDate) schedDate.value = scheduleState.date || todayISO();
renderPrintTargetOptions();
renderTaskEmployeeOptions();
const employeeList = document.getElementById('employee-list');
if(!scheduleState.employees.length){ employeeList.innerHTML = '<span class="split-hint">No employees added yet.</span>'; } else { employeeList.innerHTML = scheduleState.employees.map((name, idx) => ` <span class="employee-chip">${esc(name)} <button title="Remove employee" onclick="removeEmployee(${idx})">x</button></span> `).join(''); }
const openWOs = getOpenWOsSorted();
const rows = getScheduleRows();
const scheduledWOIds = new Set(rows.map(row => row.wo.id));
const unscheduledWOs = openWOs.filter(wo => !scheduledWOIds.has(wo.id));
const scheduledCounts = aggregateTaskCounts(rows.flatMap(row => row.assignmentItems));
const unscheduledCounts = aggregateTaskCounts(unscheduledWOs.flatMap(wo => getSchedulableTasksForWO(wo)));
document.getElementById('sch-wo').textContent = rows.length;
document.getElementById('sch-unscheduled').textContent = unscheduledWOs.length;
document.getElementById('sch-time').textContent = fmtMOrZero(rows.reduce((sum, row) => sum + row.totalMinutes, 0));
document.getElementById('sch-employees').textContent = scheduleState.employees.length;
const testSummaryEl = document.getElementById('schedule-test-summary');
if(testSummaryEl){ testSummaryEl.innerHTML = ` <div><strong>Scheduled:</strong> ${formatCountsSummary(scheduledCounts)}</div> <div class="test-summary-line"><strong>Remaining:</strong> ${formatCountsSummary(unscheduledCounts)}</div> `; }
const unscheduledList = document.getElementById('unscheduled-list');
if(!unscheduledWOs.length){
unscheduledList.innerHTML = '<div class="schedule-empty">All open work orders are already on the run order.</div>';
} else {
unscheduledList.innerHTML = unscheduledWOs.map(wo => {
const assignments = getSchedulableTasksForWO(wo);
return ` <div class="schedule-item task-group-item"> <div class="schedule-item-main"> <div class="run-rank">WO</div> <div> <div class="schedule-title">${esc(wo.number)}</div> <div class="schedule-sub">${esc(wo.client || 'Unassigned client')} | Priority ${esc(wo.priority || 'NONE')} | ${fmtDate(wo.dueDate) || 'No due date'}</div> <div class="schedule-sub">${fmtMOrZero(calcM(wo))} total | ${getWOTestTotal(wo)} total test units</div> </div> <button class="act-btn" onclick="addToSchedule('${esc(wo.id)}')">Schedule WO</button> </div> <div class="schedule-task-list"> ${assignments.map(item => ` <div class="schedule-task-row"> <div> <div class="schedule-task-name">${esc(item.label)}${item.quantity > 1 ? ` | Qty ${item.quantity}` : ''}</div> <div class="schedule-sub">${fmtMOrZero(item.taskMinutes)} | ${esc(item.matrixType || 'Unknown Matrix')}</div> </div> </div> `).join('')} </div> </div> `;
}).join('');
}
const scheduledList = document.getElementById('scheduled-list');
if(!rows.length){
scheduledList.innerHTML = '<div class="schedule-empty">No run order set yet. Add work orders from the left panel.</div>';
} else {
scheduledList.innerHTML = rows.map((row, index) => {
const assigneeLabel = row.assignedTechs.length ? row.assignedTechs.join(', ') : 'Unassigned';
const assignmentRows = row.assignmentItems.map(item => {
if(item.assignable === false){
return ` <div class="schedule-task-row"> <div> <div class="schedule-task-name">${esc(item.label)}${item.quantity > 1 ? ` | Qty ${item.quantity}` : ''}</div> <div class="schedule-sub">${fmtMOrZero(item.taskMinutes)} | Auto-calculated | ${esc(item.matrixType || 'Unknown Matrix')}</div> </div> <div class="schedule-assignees"><span class="split-hint">Automatic</span></div> </div> `;
}
const techButtons = scheduleState.employees.length ? scheduleState.employees.map((name, empIndex) => {
const active = item.tech === name;
return `<button type="button" class="assignee-btn ${active ? 'on' : ''}" onclick="assignWorkOrderTest(${index}, '${esc(item.assignmentKey)}', ${empIndex})">${esc(name)}</button>`;
}).join('') : '<span class="split-hint">Add employees above to assign this test type.</span>';
return ` <div class="schedule-task-row"> <div> <div class="schedule-task-name">${esc(item.label)}${item.quantity > 1 ? ` | Qty ${item.quantity}` : ''}</div> <div class="schedule-sub">${fmtMOrZero(item.taskMinutes)} | ${esc(item.tech || 'Unassigned')} | ${esc(item.matrixType || 'Unknown Matrix')}</div> </div> <div class="schedule-assignees">${techButtons}</div> </div> `;
}).join('');
return ` <div class="schedule-item run-item" draggable="true" data-index="${index}" ondragstart="onScheduleDragStart(event)" ondragover="onScheduleDragOver(event)" ondrop="onScheduleDrop(event)" ondragend="onScheduleDragEnd()"> <div class="schedule-item-main"> <div class="run-rank">#${row.order}</div> <div> <div class="schedule-title">${esc(row.wo.number)} | ${esc(row.wo.client || 'Unassigned client')}</div> <div class="schedule-sub">Priority ${esc(row.wo.priority || 'NONE')} | Due ${fmtDate(row.wo.dueDate) || 'Not set'} | ${fmtMOrZero(row.totalMinutes)}</div> <div class="schedule-sub">${esc(assigneeLabel)} | ${esc(buildAssignmentSummary(row.assignmentItems, false))}</div> </div> <button class="act-btn" onclick="removeFromSchedule(${index})">Remove</button> </div> <div class="schedule-task-list">${assignmentRows}</div> <div class="schedule-notes"> <textarea placeholder="Work order notes..." oninput="updateScheduleNotes(${index}, this.value)">${esc(row.entry.notes || '')}</textarea> </div> </div> `;
}).join('');
}
const liquidLaneList = document.getElementById('liquid-lane-list');
if(liquidLaneList){ const liquidLaneRows = getLiquidLaneRows(rows); if(!liquidLaneRows.length){ liquidLaneList.innerHTML = '<div class="schedule-empty">No scheduled liquid samples yet.</div>'; } else { liquidLaneList.innerHTML = liquidLaneRows.map(row => { const options = ['<option value="">Set hydrocarbon...</option>', ...HYDROCARBON_OPTIONS.map(code => `<option value="${code}" ${row.hydrocarbon === code ? 'selected' : ''}>${code === 'UNKNOWN' ? 'Unknown' : code}</option>`)].join(''); const rankLabel = row.hydrocarbon === 'UNKNOWN' ? 'Unknown' : (row.hydrocarbon || 'Unset'); const assigneeLabel = row.assignees.length ? row.assignees.join(', ') : 'Unassigned'; return ` <div class="schedule-item liquid-lane-item ${row.hydrocarbon ? '' : 'missing-hydrocarbon'}"> <div class="schedule-item-main"> <div class="run-rank">L${row.laneOrder}</div> <div> <div class="schedule-title">${esc(row.wo.number)} | Sample ${esc(row.sampleId)}</div> <div class="schedule-sub">${esc(row.wo.client || 'Unassigned client')} | Queue #${row.scheduleOrder} | ${esc(assigneeLabel)}</div> <div class="schedule-sub">Hydrocarbon ${esc(rankLabel)} | Liquid lane sorted lightest to heaviest</div> </div> <select class="form-input hydrocarbon-select" onchange="updateSampleHydrocarbon('${esc(row.wo.id)}','${esc(row.sampleId)}', this.value)">${options}</select> </div> </div> `; }).join(''); } }
const plan = buildEmployeePlan(rows);
const planNode = document.getElementById('employee-plan');
const planSummary = document.getElementById('employee-plan-summary');
if(planSummary){ const totalPlan = plan.reduce((sum, p) => sum + p.minutes, 0); planSummary.textContent = `${plan.length} workload bucket(s) | ${fmtMOrZero(totalPlan)}`; }
if(!plan.length){ planNode.innerHTML = '<div class="schedule-empty">Add employees and assign test types to build workloads.</div>'; } else { planNode.innerHTML = plan.map(p => ` <div class="plan-card"> <div class="plan-name">${esc(p.name)}</div> <div class="plan-total">${fmtMOrZero(Math.round(p.minutes))}</div> <div class="plan-lines"> ${p.items.length ? p.items.map(item => `<div>#${item.order} WO ${esc(item.woNumber)} | ${esc(item.testType)}${item.quantity > 1 ? ` x${item.quantity}` : ''} (${fmtMOrZero(Math.round(item.minutes))})</div>`).join('') : '<div>No assigned test work.</div>'} </div> </div> `).join(''); }
renderTaskList();
}
function changeScheduleDate(value){ scheduleState.date = value || todayISO(); renderSchedule(); scheduleSave();
}
function addEmployee(){ const input = document.getElementById('employee-input');
const raw = (input.value || '').trim();
if(!raw) return;
const exists = scheduleState.employees.some(name => name.toLowerCase() === raw.toLowerCase());
if(!exists) scheduleState.employees.push(raw); input.value = ''; normalizeScheduleState(); renderSchedule(); scheduleSave();
}
function removeEmployee(index){ if(index < 0 || index >= scheduleState.employees.length) return; scheduleState.employees.splice(index, 1); normalizeScheduleState(); render(); scheduleSave();
}
function addEmployeeTask(){ const employee = String(document.getElementById('task-employee-select')?.value || '').trim();
const name = String(document.getElementById('task-name-input')?.value || '').trim();
const minutesRaw = document.getElementById('task-time-input')?.value;
const minutes = Number(minutesRaw || 0);
if(!employee){ alert('Select an employee for the task.'); return; }
if(!name){ alert('Task name is required.'); return; }
scheduleState.tasks.push({ id:uid(), employee, name, minutes: minutes > 0 ? minutes : 0 });
document.getElementById('task-name-input').value = '';
document.getElementById('task-time-input').value = '';
renderSchedule(); scheduleSave();
}
function removeEmployeeTask(taskId){ const id = String(taskId || '');
const idx = scheduleState.tasks.findIndex(task => task.id === id);
if(idx < 0) return;
scheduleState.tasks.splice(idx, 1);
renderSchedule(); scheduleSave();
}
function addToSchedule(woId){ normalizeScheduleState(); const workOrderId = String(woId || '').trim(); const wo = WOs.find(item => item.id === workOrderId && item.stage === WO_STAGE.RUNNING); if(!wo) return; if(scheduleState.entries.some(entry => entry.woId === workOrderId)) return; scheduleState.entries.push({ woId:workOrderId, assignments:{}, notes:'' }); render(); scheduleSave();
}
function removeFromSchedule(index){ if(index < 0 || index >= scheduleState.entries.length) return; scheduleState.entries.splice(index, 1); render(); scheduleSave();
}
function assignWorkOrderTest(scheduleIndex, assignmentKey, employeeIndex){ const entry = scheduleState.entries[scheduleIndex];
const name = scheduleState.employees[employeeIndex];
if(!entry || !name) return;
if(!entry.assignments || typeof entry.assignments !== 'object') entry.assignments = {};
const key = String(assignmentKey || '').trim();
if(!key) return;
const wo = WOs.find(item => item.id === entry.woId && item.stage === WO_STAGE.RUNNING);
if(!wo) return;
const assignableKeys = new Set(getSchedulableTasksForWO(wo).filter(item => item.assignable !== false).map(item => item.assignmentKey));
if(!assignableKeys.has(key)) return;
entry.assignments[key] = entry.assignments[key] === name ? '' : name;
if(!entry.assignments[key]) delete entry.assignments[key];
normalizeScheduleState(); render(); scheduleSave();
}
function updateScheduleNotes(index, notes){ if(index < 0 || index >= scheduleState.entries.length) return; scheduleState.entries[index].notes = String(notes || ''); scheduleSave();
}
function moveScheduleEntry(fromIndex, toIndex){ if(fromIndex === toIndex) return;
if(fromIndex < 0 || toIndex < 0) return;
if(fromIndex >= scheduleState.entries.length || toIndex >= scheduleState.entries.length) return;
const [moved] = scheduleState.entries.splice(fromIndex, 1); scheduleState.entries.splice(toIndex, 0, moved);
}
function onScheduleDragStart(event){ const idx = Number(event.currentTarget?.dataset?.index);
if(Number.isNaN(idx)) return; scheduleDragIndex = idx; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(idx)); event.currentTarget.classList.add('dragging');
}
function onScheduleDragOver(event){ event.preventDefault(); event.dataTransfer.dropEffect = 'move';
}
function onScheduleDrop(event){ event.preventDefault();
const targetIndex = Number(event.currentTarget?.dataset?.index);
const fromIndex = scheduleDragIndex; scheduleDragIndex = null;
if(Number.isNaN(targetIndex) || fromIndex === null || Number.isNaN(fromIndex)) return; moveScheduleEntry(fromIndex, targetIndex); renderSchedule(); scheduleSave();
}
function onScheduleDragEnd(){ scheduleDragIndex = null; document.querySelectorAll('.run-item.dragging').forEach(node => node.classList.remove('dragging'));
}
function clearSchedule(){ if(!confirm('Clear this daily run order?')) return; scheduleState.entries = []; render(); scheduleSave();
}
function autofillScheduleFromQueue(){ normalizeScheduleState();
const existing = new Map(scheduleState.entries.map(entry => [entry.woId, entry]));
scheduleState.entries = getOpenWOsSorted().map(wo => { const prior = existing.get(wo.id); return { woId:wo.id, assignments:{ ...(prior?.assignments && typeof prior.assignments === 'object' ? prior.assignments : {}) }, notes:String(prior?.notes || '') }; }); render(); scheduleSave();
}
function csvEsc(value){ return `"${String(value ?? '').replace(/"/g, '""')}"`;
}
function exportRunOrderCsv(){ const rows = getScheduleRows();
if(!rows.length){ alert('No scheduled work to export.'); return; } const lines = [ ['Schedule Date','Run Order','WO Number','Client','Priority','Due Date','Total Minutes','Assigned Techs','Test Assignments','Notes'].map(csvEsc).join(',') ];
for(const row of rows){ lines.push([ scheduleState.date || todayISO(), row.order, row.wo.number || '', row.wo.client || '', row.wo.priority || 'NONE', row.wo.dueDate || '', row.totalMinutes, row.assignedTechs.join(' | ') || 'Unassigned', buildAssignmentSummary(row.assignmentItems, true), row.entry.notes || '' ].map(csvEsc).join(',')); } const blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8;'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a'); a.href = url; a.download = `run-order-${scheduleState.date || todayISO()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function printRunOrder(){ const scope = document.getElementById('print-report-target')?.value || '__master__';
const report = buildReportData(scope);
if(!report.rows.length && !report.hasTasks){ alert('No scheduled work or tasks to print.'); return; }
if(!report.isMaster && !report.filteredRows.length && !report.hasTasks){ alert('No scheduled work or additional tasks are assigned to that employee.'); return; }
const win = window.open('', '_blank');
if(!win){ alert('Unable to open print window. Please allow pop-ups.'); return; }
const runRows = report.filteredRows.length ? report.filteredRows.map(row => ` <tr> <td>${row.order}</td> <td>${esc(row.wo.number || '')}</td> <td>${esc(row.wo.client || '')}</td> <td>${esc(row.wo.priority || 'NONE')}</td> <td>${esc(row.wo.dueDate || '')}</td> <td>${fmtMOrZero(row.reportMinutes)}</td> <td>${esc(row.reportTechs.join(', ') || 'Unassigned')}</td> <td>${esc(buildAssignmentSummary(row.reportAssignmentItems, true))}</td> <td>${esc(row.entry.notes || '')}</td> </tr> `).join('') : '<tr><td colspan="9">No scheduled work orders in this report.</td></tr>';
const laneRows = laneList => laneList.length ? laneList.map(row => ` <tr> <td>${row.order}</td> <td>${esc(row.wo.number || '')}</td> <td>${esc(row.wo.client || '')}</td> <td>${fmtMOrZero(row.reportMinutes)}</td> <td>${esc(row.reportTechs.join(', ') || 'Unassigned')}</td> <td>${esc(buildAssignmentSummary(row.reportAssignmentItems, true))}</td> </tr> `).join('') : '<tr><td colspan="6">No gas work assigned.</td></tr>';
const liquidSampleRows = report.liquidSampleRows.length ? report.liquidSampleRows.map(row => ` <tr> <td>${row.laneOrder}</td> <td>${esc(row.wo.number || '')}</td> <td>${esc(row.wo.client || '')}</td> <td>${esc(row.sampleId || '')}</td> <td>${esc(row.hydrocarbon || 'Unset')}</td> <td>${esc(row.assignees.length ? row.assignees.join(', ') : 'Unassigned')}</td> </tr> `).join('') : '<tr><td colspan="6">No liquid samples scheduled.</td></tr>';
const planRows = report.plan.length ? report.plan.map(p => ` <tr> <td>${esc(p.name)}</td> <td>${fmtMOrZero(Math.round(p.minutes))}</td> <td>${esc(p.items.map(item => `#${item.order} ${item.woNumber} ${item.testType}${item.quantity > 1 ? ` x${item.quantity}` : ''}`.trim()).join(' | ')) || 'No assigned test work'}</td> </tr> `).join('') : '<tr><td colspan="3">No workload assigned.</td></tr>';
const taskRows = report.taskBuckets.length ? report.taskBuckets.map(bucket => bucket.tasks.length ? bucket.tasks.map((task, index) => ` <tr> <td>${index === 0 ? esc(bucket.name) : ''}</td> <td>${esc(task.name)}</td> <td>${task.minutes ? fmtMOrZero(task.minutes) : 'Not set'}</td> </tr> `).join('') : ` <tr><td>${esc(bucket.name)}</td><td>No additional tasks</td><td>Not set</td></tr> `).join('') : '<tr><td colspan="3">No additional tasks assigned.</td></tr>';
const reportTitle = report.isMaster ? 'Daily Run Order - Master Report' : `Daily Run Order - ${report.employeeName}`;
const html = `<!doctype html> <html> <head> <meta charset="utf-8"> <title>${esc(reportTitle)} ${esc(scheduleState.date || todayISO())}</title> <style> body{font-family:Arial,sans-serif;padding:20px;color:#111;} h1{margin:0 0 4px 0;font-size:24px;} .meta{color:#444;margin-bottom:16px;} table{width:100%;border-collapse:collapse;margin-top:8px;margin-bottom:20px;} th,td{border:1px solid #bbb;padding:6px 8px;font-size:12px;vertical-align:top;text-align:left;} th{background:#f2f2f2;} h2{margin:18px 0 6px 0;font-size:16px;} h3{margin:10px 0 6px 0;font-size:14px;} </style> </head> <body> <h1>${esc(reportTitle)}</h1> <div class="meta">Schedule Date: ${esc(scheduleState.date || todayISO())}</div> <table> <thead> <tr><th>Run</th><th>WO</th><th>Client</th><th>Priority</th><th>Due Date</th><th>Minutes</th><th>Assigned Techs</th><th>Test Assignments</th><th>Notes</th></tr> </thead> <tbody>${runRows}</tbody> </table> <h2>Lane Split</h2> <h3>1. Gas Lane</h3> <table> <thead> <tr><th>Run</th><th>WO</th><th>Client</th><th>Minutes</th><th>Assigned Techs</th><th>Gas Assignments</th></tr> </thead> <tbody>${laneRows(report.gasRows)}</tbody> </table> <h3>2. Liquid Lane</h3> <table> <thead> <tr><th>Lane</th><th>WO</th><th>Client</th><th>Sample</th><th>Hydrocarbon</th><th>Assignees</th></tr> </thead> <tbody>${liquidSampleRows}</tbody> </table> <h2>Employee Workload</h2> <table> <thead> <tr><th>Employee</th><th>Total Time</th><th>Assigned Run Steps</th></tr> </thead> <tbody>${planRows}</tbody> </table> <h2>Additional Tasks</h2> <table> <thead> <tr><th>Employee</th><th>Task</th><th>Time</th></tr> </thead> <tbody>${taskRows}</tbody> </table> </body> </html>`; win.document.open(); win.document.write(html); win.document.close(); win.focus(); win.print();}
function render(){ const visibleCols = getVisibleColumnCount();
const grpBy=document.getElementById('grp-by').value;
const search=document.getElementById('search').value.toLowerCase().trim(); document.querySelectorAll('thead th').forEach(th=>{ th.classList.remove('sorted-asc','sorted-desc'); });
 let sorted=getFilteredWorkOrders();
const activeSortTh = document.querySelector(`thead th.sortable[onclick="clickSort('${sortState.field}')"]`); if (activeSortTh) activeSortTh.classList.add(sortState.dir==='asc' ? 'sorted-asc' : 'sorted-desc');
 if(search)sorted=sorted.filter(w=> String(w.number||'').toLowerCase().includes(search)||(w.client||'').toLowerCase().includes(search)|| (w.location||'').toLowerCase().includes(search) || getWOAssigneeLabel(w).toLowerCase().includes(search) );
 const tbodyId = appView === 'pending' ? 'pending-wo-tbody' : 'wo-tbody';
 const emptyLabel = appView === 'pending' ? 'No work orders are waiting to report.' : 'No work orders match current filters.';
 if(!sorted.length){ document.getElementById(tbodyId).innerHTML=`<tr><td colspan="${visibleCols}"><div class="empty-state"><div class="big"></div>${emptyLabel}</div></td></tr>`; applyColumnVisibility(); updateStats(); renderSchedule(); const ts = new Date().toLocaleTimeString(); document.getElementById(appView === 'pending' ? 'pending-last-update' : 'last-update').textContent=`Updated ${ts}`; return; } const groups={};
if(grpBy==='none'){ groups['__all__']=sorted; } else if(grpBy==='client'){ for(const w of sorted){ const k=w.client||'Unassigned';
if(!groups[k])groups[k]=[]; groups[k].push(w); } } else if(grpBy==='priority'){ for(const w of sorted){ const k=w.priority||'NONE';
if(!groups[k])groups[k]=[]; groups[k].push(w); } } else if(grpBy==='matrix'){ for(const w of sorted){ const k=getPrimaryMatrixGroup(w);
if(!groups[k])groups[k]=[]; groups[k].push(w); } } else if(grpBy==='assignedTo'){ for(const w of sorted){ const k=getWOAssigneeLabel(w);
if(!groups[k])groups[k]=[]; groups[k].push(w); } } else { for(const w of sorted){ const k=w.location||'Unknown';
if(!groups[k])groups[k]=[]; groups[k].push(w); } } let html='';
const groupEntries = grpBy==='priority' ? ['CRITICAL','HIGH','MEDIUM','LOW','NONE'] .filter(k => groups[k]?.length) .map(k => [k, groups[k]]) : grpBy==='matrix' ? ['Gas','Liquid','Unknown Matrix'].filter(k => groups[k]?.length).map(k => [k, groups[k]]) : grpBy==='assignedTo' ? Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0])) : Object.entries(groups);
for(const[grp,wos]of groupEntries){ if(grpBy!=='none'){ const priIcons = {CRITICAL:'',HIGH:'',MEDIUM:'',LOW:'',NONE:''};
const priLabels = {CRITICAL:'Critical',HIGH:'High',MEDIUM:'Medium',LOW:'Low',NONE:'No Priority'};
const rc=grpBy==='client' ?'grp-row grp-cli' :grpBy==='priority' ?`grp-row grp-pri-${grp}` :'grp-row grp-loc';
const ic=grpBy==='client' ?'' :grpBy==='priority' ?(priIcons[grp] || '') :'';
const gl=grpBy==='priority' ? (priLabels[grp] || grp) : grp; html+=`<tr class="${rc}"><td colspan="${visibleCols}">${ic} ${esc(gl)}</td></tr>`; } for(const w of wos){ const st=getStatus(w);
const mins=calcM(w);
const pri=w.priority||'NONE';
const sampleCount = Array.isArray(w.samples) && w.samples.length ? w.samples.length : (Array.isArray(w.testRows) ? new Set(w.testRows.map(r=>r.sampleId||'UNASSIGNED')).size : 0);
const safeNum = esc(w.number);
const safeNotes = esc(w.notes || '');
const safeClient = esc(w.client || '');
const safeAssignedTo = esc(getWOAssigneeLabel(w));
const counts = getWOCounts(w);
const priBadge=(pri==='CRITICAL'||pri==='HIGH'||pri==='MEDIUM'||pri==='LOW') ?`<div class="pri-badge pb-${pri}">${pri==='CRITICAL'?'&#128680;':pri==='HIGH'?'&#128293;':pri==='MEDIUM'?'&#9888;&#65039;':'&#128998;'} ${pri}</div>`: `<span style="color:var(--muted);font-size:11px"></span>`;
const testCell=(v,cls='')=>v?`<span class="tc ${cls}">${v}</span>`:`<span class="tc empty"></span>`;
 const testCells = getTestDefinitions().map(def => { const cls = def.matrixType === 'Calculated' ? 'calc' : def.tone === 'gc' ? 'gc' : def.tone === 'liq' ? 'liq' : ''; return `<td class="num col-${def.key}">${testCell(counts[def.key], cls)}</td>`; }).join('');
 const dueFmt=fmtDate(w.dueDate)||'<span style="color:var(--muted)">Not set</span>'; html+=` <tr class="p-${pri}${w.stage===WO_STAGE.DONE?' complete-row':''} wo-clickable-row" data-id="${w.id}" onclick="openActionsModal('${w.id}')" title="Click for actions"> <td class="col-number"><div class="wo-num">${safeNum}</div>${safeNotes?`<div class="wo-sub">${safeNotes}</div>`:''}${sampleCount?`<div class="wo-sub">${sampleCount} sample(s)</div>`:''}</td> <td class="col-priority">${priBadge}</td> <td class="col-client" style="font-family:var(--sans);font-size:14px">${safeClient||'<span style="color:var(--muted)"></span>'}</td> <td class="col-assignedTo" style="font-family:var(--mono);font-size:12px">${safeAssignedTo}</td> ${testCells} <td class="col-estTime"><div class="est-time">${fmtMOrZero(mins)}${mins?`<div class="est-mins">${mins} min</div>`:''}</div></td> <td class="col-dueDate"><div style="font-family:var(--mono);font-size:12px">${dueFmt}</div></td> <td class="col-status"><span class="sb ${st.cls}">${st.label}</span>${st.dl?`<span class="overdue-info">${st.dl}</span>`:''}</td> </tr>`; } } document.getElementById(tbodyId).innerHTML=html; applyColumnVisibility(); const stamp = `Updated ${new Date().toLocaleTimeString()}`; document.getElementById('last-update').textContent=stamp; const pendingStamp = document.getElementById('pending-last-update'); if(pendingStamp) pendingStamp.textContent=stamp; updateStats(); renderSchedule(); }
function renderPdfAttachmentInfo(){ const meta = document.getElementById('f-pdf-meta');
if(!meta) return;
if(modalPdfAttachment && modalPdfAttachment.name){ const sizeLabel = modalPdfAttachment.size ? ` (${Math.round(modalPdfAttachment.size/1024)} KB)` : ''; meta.innerHTML = `Attached: ${esc(modalPdfAttachment.name)}${sizeLabel} <button type="button" class="act-btn" style="margin-left:8px;padding:2px 6px;" onclick="openCurrentPdfAttachment()">Open</button> <button type="button" class="act-btn" style="margin-left:6px;padding:2px 6px;" onclick="clearCurrentPdfAttachment()">Remove</button>`; } else { meta.textContent = 'No PDF attached'; } }
function dataUrlToBlob(dataUrl){ const parts = String(dataUrl || '').split(',');
if(parts.length < 2) return null;
const mimeMatch = parts[0].match(/data:([^;]+);base64/i);
const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
const bytes = atob(parts[1]);
const arr = new Uint8Array(bytes.length);
for(let i=0;i<bytes.length;i++) arr[i] = bytes.charCodeAt(i);
return new Blob([arr], {type:mime}); }
function openPdfAttachment(attachment){ if(!attachment || !attachment.dataUrl){ alert('No PDF attached.'); return; } const blob = dataUrlToBlob(attachment.dataUrl);
if(!blob){ alert('Unable to open PDF attachment.'); return; } const url = URL.createObjectURL(blob);
const win = window.open(url, '_blank');
if(!win){ alert('Unable to open PDF. Please allow pop-ups.'); URL.revokeObjectURL(url); return; } setTimeout(() => URL.revokeObjectURL(url), 60000); }
function openCurrentPdfAttachment(){ openPdfAttachment(modalPdfAttachment); }
function clearCurrentPdfAttachment(){ modalPdfAttachment = null;
const input = document.getElementById('f-pdf');
if(input) input.value = ''; renderPdfAttachmentInfo(); }
function onPdfSelected(event){ const file = event?.target?.files?.[0];
if(!file) return;
const name = String(file.name || '');
const isPdf = (file.type === 'application/pdf') || name.toLowerCase().endsWith('.pdf');
if(!isPdf){ alert('Please select a PDF file.'); event.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => { modalPdfAttachment = { name, type:'application/pdf', size:Number(file.size || 0), dataUrl:String(reader.result || '') }; renderPdfAttachmentInfo(); }; reader.onerror = () => { alert('Unable to read PDF file.'); event.target.value = ''; }; reader.readAsDataURL(file); }
function updateStats(){ const now=new Date();now.setHours(0,0,0,0);
const running=WOs.filter(w=>w.stage===WO_STAGE.RUNNING);
const pending=WOs.filter(w=>w.stage===WO_STAGE.PENDING);
const countOverdue = list => list.filter(w=>{const d=parseDate(w.dueDate); return d&&(d-now)<0;}).length;
const countHigh = list => list.filter(w=>w.priority==='CRITICAL'||w.priority==='HIGH').length;
document.getElementById('s-wo').textContent=running.length; document.getElementById('s-tests').textContent=running.reduce((s,w)=>s+getWOTestTotal(w),0); document.getElementById('s-overdue').textContent=countOverdue(running); document.getElementById('s-time').textContent=fmtMOrZero(running.reduce((s,w)=>s+calcM(w),0)); document.getElementById('s-pri').textContent=countHigh(running);
const pendingCount = document.getElementById('p-wo');
if(pendingCount){ document.getElementById('p-wo').textContent=pending.length; document.getElementById('p-tests').textContent=pending.reduce((s,w)=>s+getWOTestTotal(w),0); document.getElementById('p-overdue').textContent=countOverdue(pending); document.getElementById('p-time').textContent=fmtMOrZero(pending.reduce((s,w)=>s+calcM(w),0)); document.getElementById('p-pri').textContent=countHigh(pending); }
}
function toggleDone(id){ const w=WOs.find(x=>x.id===id);
if(w){ w.stage = w.stage === WO_STAGE.DONE ? WO_STAGE.RUNNING : WO_STAGE.DONE; w.complete = w.stage === WO_STAGE.DONE; normalizeScheduleState(); render(); } }
function openModal(id){ editId=id;
const isNew=id===null; document.getElementById('modal-title').textContent=isNew?'Add Work Order':'Edit Work Order'; document.getElementById('btn-del').style.display=isNew?'none':'inline-block';
const clients=[...new Set(WOs.map(w=>w.client).filter(Boolean))]; document.getElementById('client-dl').innerHTML=clients.map(c=>`<option value="${esc(c)}">`).join('');
 if(isNew){ document.getElementById('f-num').value=''; document.getElementById('f-client').value=''; document.getElementById('f-loc').value='Pittsburgh'; document.getElementById('f-due').value=''; document.getElementById('f-notes').value=''; modalPdfAttachment = null; document.getElementById('f-pdf').value=''; renderPdfAttachmentInfo(); modalDraftTestRows = []; selectedTestRowId = null; modalSampleGroupKeys = []; expandedSampleGroups = new Set(); resetDraftTestForm(); renderDraftTests(); selPriVal('NONE'); } else { const w=WOs.find(x=>x.id===id);
 if(!w)return; document.getElementById('f-num').value=w.number; document.getElementById('f-client').value=w.client||''; document.getElementById('f-loc').value=w.location||''; document.getElementById('f-due').value=toInputDate(w.dueDate)||''; modalPdfAttachment = w.pdfAttachment || null; document.getElementById('f-pdf').value=''; renderPdfAttachmentInfo(); modalDraftTestRows = getDraftRowsFromWO(w); selectedTestRowId = null; modalSampleGroupKeys = []; expandedSampleGroups = new Set(); resetDraftTestForm(); renderDraftTests(); document.getElementById('f-notes').value=w.notes||''; selPriVal(w.priority||'NONE'); } updateMoveButton(); document.getElementById('modal-overlay').classList.add('open'); }
function closeModal(){document.getElementById('modal-overlay').classList.remove('open');editId=null;modalPdfAttachment=null;
const input = document.getElementById('f-pdf');
if(input) input.value='';}
function getDraftRowsFromWO(w){ if(Array.isArray(w.testRows) && w.testRows.length){ return w.testRows.map(r=>({ id:r.id || uid(), type:normalizeTestCode(r.testCode) || normalizeTestCode(r.type) || '', testCode:r.testCode || '', sampleId:r.sampleId || '', cylinderNumber:r.cylinderNumber || '', matrix:r.matrix || '', hydrocarbon:normalizeHydrocarbonCode(r.hydrocarbon), containerType:r.containerType || '', received:r.received || '', logDate:r.logDate || '', dueDate:r.dueDate || w.dueDate || '', mappingStatus:r.mappingStatus || '', mappingError:r.mappingError || '', })); } if(Array.isArray(w.samples) && w.samples.length){ const rows = [];
for(const s of w.samples){ const codes = Array.isArray(s.testCodes) && s.testCodes.length ? s.testCodes : [''];
for(const tc of codes){ rows.push({ id:uid(), type:inferTypeFromCode(tc), testCode:tc || '', sampleId:s.sampleId || '', cylinderNumber:s.cylinderNumber || '', matrix:s.matrix || '', hydrocarbon:normalizeHydrocarbonCode(s.hydrocarbon), containerType:s.containerType || '', received:s.received || '', logDate:s.logDate || '', dueDate:s.dueDate || w.dueDate || '', mappingStatus:'', mappingError:'' }); } } return rows; } const rows = [];
const addPlaceholder = (code,count) => { for(let i=0;i<count;i++){ rows.push({id:uid(),type:code,testCode:getTestLabel(code),sampleId:`AUTO-${code}-${i+1}`,cylinderNumber:'',matrix:'',hydrocarbon:'',containerType:'',received:'',logDate:'',dueDate:w.dueDate||''}); } };
const metrics = getWOMetrics(w); TEST_CODES.forEach(code => addPlaceholder(code, metrics.counts[code] || 0));
return rows;
}
function openSamplesModal(id){ const w = WOs.find(x=>x.id===id);
if(!w) return;
const samples = Array.isArray(w.samples) ? w.samples : [];
const testRows = Array.isArray(w.testRows) ? w.testRows.length : getWOTestTotal(w); document.getElementById('samples-title').textContent = `Sample Details WO ${w.number}`; document.getElementById('samples-summary').textContent = `${samples.length} sample(s) ${testRows} test row(s)`;
if(!samples.length){ document.getElementById('samples-tbody').innerHTML = '<tr><td colspan="9" style="color:var(--muted)">No sample-level data available for this work order.</td></tr>'; } else { document.getElementById('samples-tbody').innerHTML = samples.map(s=>{ const rawCodes = Array.isArray(s.testCodes) ? s.testCodes : []; const unmappedCodes = rawCodes.filter(code => code && !normalizeTestCode(code)); const testsLabel = rawCodes.length ? rawCodes.join(', ') : ''; const testsDisplay = unmappedCodes.length ? `${testsLabel}${testsLabel ? ' | ' : ''}UNMAPPED: ${unmappedCodes.join(', ')}` : (testsLabel || 'No test codes'); return ` <tr> <td>${esc(s.sampleId)}</td> <td>${esc(testsDisplay)}</td> <td>${esc(s.matrix || '')}</td> <td>${esc(normalizeHydrocarbonCode(s.hydrocarbon) || '')}</td> <td>${esc(s.containerType || '')}</td> <td>${esc(s.cylinderNumber || '')}</td> <td>${esc(s.received || '')}</td> <td>${esc(s.logDate || '')}</td> <td>${esc(s.dueDate || '')}</td> </tr> `; }).join(''); } document.getElementById('samples-overlay').classList.add('open'); }
function closeSamplesModal(){ document.getElementById('samples-overlay').classList.remove('open'); }
function openActionsModal(id){ const w = WOs.find(x=>x.id===id);
if(!w) return; activeActionWO = id; document.getElementById('actions-title').textContent = `WO ${w.number} Actions`; document.getElementById('actions-summary').textContent = `${w.client || 'Unassigned client'} Priority ${w.priority || 'NONE'}`; document.getElementById('actions-done-btn').textContent = w.stage === WO_STAGE.DONE ? 'Reopen' : 'Done'; document.getElementById('actions-done-btn').classList.toggle('done-active', w.stage === WO_STAGE.DONE);
const pdfBtn = document.getElementById('actions-pdf-btn');
if(pdfBtn) pdfBtn.style.display = (w.pdfAttachment && w.pdfAttachment.dataUrl) ? '' : 'none'; document.getElementById('actions-overlay').classList.add('open'); }
function closeActionsModal(){ document.getElementById('actions-overlay').classList.remove('open'); activeActionWO = null; }
function toggleDoneFromActions(){ if(!activeActionWO) return;
const id = activeActionWO; closeActionsModal(); toggleDone(id); }
function openSamplesFromActions(){ if(!activeActionWO) return;
const id = activeActionWO; closeActionsModal(); openSamplesModal(id); }
function openPdfFromActions(){ if(!activeActionWO) return;
const w = WOs.find(x=>x.id===activeActionWO);
if(!w || !w.pdfAttachment || !w.pdfAttachment.dataUrl){ alert('No PDF attached to this work order.'); return; } openPdfAttachment(w.pdfAttachment); }
function openEditFromActions(){ if(!activeActionWO) return;
const id = activeActionWO; closeActionsModal(); openModal(id); }
function resetDraftTestForm(){ document.getElementById('f-test-type').value=getDefaultTestKey(); document.getElementById('f-test-code').value=''; document.getElementById('f-test-sample').value=''; document.getElementById('f-test-cylinder').value=''; document.getElementById('f-test-matrix').value=''; document.getElementById('f-test-hydrocarbon').value=''; document.getElementById('f-test-container').value=''; document.getElementById('f-test-received').value=''; document.getElementById('f-test-log-date').value=''; }
function showImportOnlyTestRowsAlert(){ alert('Sample and test rows are import-only. Re-import the CSV to change sample/test detail, or update Test Types separately.'); }
function getDraftTestRowFromForm(){ showImportOnlyTestRowsAlert(); return null; }
function upsertDraftTestRow(){ showImportOnlyTestRowsAlert(); }
function openTestSelectorModal(){ if(!modalDraftTestRows.length){ alert('No imported test rows are attached to this work order.'); return; } showImportOnlyTestRowsAlert(); }
function closeTestSelectorModal(){ document.getElementById('test-select-overlay').classList.remove('open'); }
function deleteSelectedTestRow(){ showImportOnlyTestRowsAlert(); closeTestSelectorModal(); }
function openEditTestModalFromSelector(){ showImportOnlyTestRowsAlert(); closeTestSelectorModal(); }
function closeTestEditModal(){ document.getElementById('test-edit-overlay').classList.remove('open'); selectedTestRowId = null; }
function saveEditedTestRow(){ showImportOnlyTestRowsAlert(); closeTestEditModal(); }
function deriveCountsAndSamplesFromRows(rows){ const counts = blankCounts();
const normalizedRows = rows.map(row => { const diag = getTestRowDiagnostics(row); return { ...row, type:diag.canonicalType || '', testCode:String(row?.testCode || '').trim(), mappingStatus:diag.unmapped ? 'unmapped' : diag.mismatch ? 'mismatch' : diag.usedAlias ? 'alias' : diag.isMapped ? 'mapped' : '', mappingError:diag.unmapped || diag.mismatch ? diag.statusLabel : '' }; });
const sampleMap = new Map();
for(const r of normalizedRows){ const sid = r.sampleId || 'UNASSIGNED';
if(!sampleMap.has(sid)){ sampleMap.set(sid,{ sampleId:sid, testCodes:[], mappedTestTypes:[], unmappedTestCodes:[], matrix:r.matrix || '', hydrocarbon:normalizeHydrocarbonCode(r.hydrocarbon), containerType:r.containerType || '', cylinderNumber:r.cylinderNumber || '', received:r.received || '', logDate:r.logDate || '', dueDate:r.dueDate || '', }); } const s = sampleMap.get(sid);
const storedCode = r.testCode || getTestLabel(r.type);
if(storedCode && !s.testCodes.includes(storedCode)) s.testCodes.push(storedCode);
if(r.type && !s.mappedTestTypes.includes(r.type)) s.mappedTestTypes.push(r.type);
if(r.mappingStatus === 'unmapped' && r.testCode && !s.unmappedTestCodes.includes(r.testCode)) s.unmappedTestCodes.push(r.testCode);
if(!s.matrix) s.matrix = r.matrix || '';
if(!s.hydrocarbon) s.hydrocarbon = normalizeHydrocarbonCode(r.hydrocarbon);
if(!s.containerType) s.containerType = r.containerType || '';
if(!s.cylinderNumber) s.cylinderNumber = r.cylinderNumber || '';
if(!s.received) s.received = r.received || '';
if(!s.logDate) s.logDate = r.logDate || '';
if(!s.dueDate) s.dueDate = r.dueDate || ''; }
Object.assign(counts, calculateCountsFromRows(normalizedRows).counts);
return {counts, samples:[...sampleMap.values()], testRows:normalizedRows};
}
function renderDraftTests(){ const container = document.getElementById('test-draft-list');
if(!modalDraftTestRows.length){ container.innerHTML = '<div style="margin-top:6px;">No imported sample/test rows attached to this work order yet.</div>'; return; } const sampleCount = new Set(modalDraftTestRows.map(r=>r.sampleId || 'UNASSIGNED')).size;
const header = `<div style="margin-bottom:6px;">${sampleCount} sample(s) ${modalDraftTestRows.length} imported test row(s)</div>`;
const grouped = new Map();
for(const r of modalDraftTestRows){ const sampleId = r.sampleId || 'UNASSIGNED';
if(!grouped.has(sampleId)) grouped.set(sampleId, []); grouped.get(sampleId).push(r); } modalSampleGroupKeys = [...grouped.keys()].sort((a,b)=>a.localeCompare(b));
const rows = modalSampleGroupKeys.map((sampleId, idx)=>{ const tests = grouped.get(sampleId) || [];
const isOpen = expandedSampleGroups.has(sampleId);
const byType = blankCounts();
const unmappedCodes = [];
for(const t of tests){ const diag = getTestRowDiagnostics(t); const code = diag.canonicalType;
if(code) byType[code] += 1; }
for(const t of tests){ const diag = getTestRowDiagnostics(t); if(diag.unmapped && diag.rawCode && !unmappedCodes.includes(diag.rawCode)) unmappedCodes.push(diag.rawCode); }
const summaryParts = getTestDefinitions().map(def => ({ label:getTestShortLabel(def.key), value:Number(byType[def.key] || 0) })).filter(item => item.value > 0).map(item => `${item.label} ${item.value}`);
const mappedSummary = summaryParts.length ? summaryParts.join(' | ') : '';
const unmappedSummary = unmappedCodes.length ? `Unmapped test codes: ${unmappedCodes.join(', ')}` : '';
const summaryText = [mappedSummary, unmappedSummary].filter(Boolean).join(' | ') || 'No mapped test types';
const details = isOpen ? tests.map((r, i)=>{ const diag = getTestRowDiagnostics(r); const mappedLabel = diag.canonicalType ? getTestLabel(diag.canonicalType) : 'Unmapped'; const statusTone = diag.unmapped || diag.mismatch ? 'var(--danger)' : diag.usedAlias ? 'var(--warn)' : 'var(--ok)'; return ` <div style="display:grid;grid-template-columns:46px 140px 1.2fr 1.3fr 90px;gap:8px;align-items:center;margin:4px 0 0 26px;"> <span>${i+1}</span> <span style="color:${statusTone}">${esc(mappedLabel)}</span> <span>${esc(r.testCode || '')}</span> <span style="color:var(--muted)">${esc(diag.statusLabel)}</span> <span>${esc(normalizeHydrocarbonCode(r.hydrocarbon) || '')}</span> </div> `; }).join('') : '';
return ` <div style="margin-top:8px;padding:6px 8px;border:1px solid var(--border);border-radius:6px;background:var(--surface2);"> <div style="display:grid;grid-template-columns:22px 1fr auto;gap:8px;align-items:center;"> <button type="button" class="act-btn" onclick="toggleSampleGroup(${idx})" style="padding:2px 6px;">${isOpen?'-':'+'}</button> <div><span style="color:var(--text)">Sample ${esc(sampleId)}</span></div> <div style="color:var(--muted);font-size:11px;">${summaryText}</div> </div> ${details} </div> `; }).join(''); container.innerHTML = `${header}${rows}`; }
function toggleSampleGroup(index){ const sampleId = modalSampleGroupKeys[index];
if(!sampleId) return;
if(expandedSampleGroups.has(sampleId)) expandedSampleGroups.delete(sampleId); else expandedSampleGroups.add(sampleId); renderDraftTests(); }
function openTestCatalogModal(){ resetTestCatalogForm(); renderTestCatalogList(); document.getElementById('test-catalog-overlay').classList.add('open'); }
function closeTestCatalogModal(){ document.getElementById('test-catalog-overlay').classList.remove('open'); editingTestDefinitionId = null; }
function resetTestCatalogForm(id = null){ const target = id ? getTestDefinitions().find(def => def.id === id || def.key === normalizeCatalogKey(id)) : null; editingTestDefinitionId = target?.id || null; document.getElementById('tc-key').value = target?.key || ''; document.getElementById('tc-label').value = target?.label || ''; document.getElementById('tc-short-label').value = target?.shortLabel || ''; document.getElementById('tc-minutes').value = target ? String(target.minutes) : '15'; document.getElementById('tc-count-mode').value = target?.countMode || 'perSample'; document.getElementById('tc-matrix-type').value = target?.matrixType || inferMatrixType(target) || ''; document.getElementById('tc-group-key').value = target?.groupKey || ''; document.getElementById('tc-group-rank').value = target?.groupRank ? String(target.groupRank) : ''; document.getElementById('tc-aliases').value = target?.aliases?.filter(alias => alias !== target.key && alias !== target.label).join(', ') || ''; applyTestCatalogMatrixDefaults(false); }
function applyTestCatalogMatrixDefaults(forceZero = true){ const matrixSelect = document.getElementById('tc-matrix-type'); const minutesInput = document.getElementById('tc-minutes'); if(!matrixSelect || !minutesInput) return; if(matrixSelect.value === 'Calculated'){ minutesInput.value = '0'; } else if(forceZero && minutesInput.value === '' && matrixSelect.value){ minutesInput.value = '15'; } }
function editTestCatalogEntry(id){ resetTestCatalogForm(id); }
function saveTestCatalogEntry(){ const keyInput = document.getElementById('tc-key').value.trim(); if(!keyInput){ alert('Test code is required.'); return; } const key = normalizeCatalogKey(keyInput); const label = document.getElementById('tc-label').value.trim() || key; const shortLabel = document.getElementById('tc-short-label').value.trim() || label; const matrixType = inferMatrixType({ matrixType:document.getElementById('tc-matrix-type').value, key, label }); const minutes = normalizeMinutesForMatrixType(matrixType, document.getElementById('tc-minutes').value); const countMode = document.getElementById('tc-count-mode').value === 'perRow' ? 'perRow' : 'perSample'; const groupKey = normalizeCatalogKey(document.getElementById('tc-group-key').value.trim()); const groupRank = Math.max(0, Number(document.getElementById('tc-group-rank').value || 0)); const aliasValues = uniqueList(String(document.getElementById('tc-aliases').value || '').split(',').map(value => value.trim())); const defs = [...getTestDefinitions()]; const existingIndex = defs.findIndex(def => def.id === editingTestDefinitionId); const duplicate = defs.find((def, index) => def.key === key && index !== existingIndex); if(duplicate){ alert(`A test type named ${key} already exists.`); return; } const previous = existingIndex >= 0 ? defs[existingIndex] : null; const aliases = previous && previous.key !== key ? uniqueList([previous.key, ...previous.aliases, ...aliasValues]) : aliasValues; const nextDef = normalizeTestDefinition({ id:previous?.id || key, key, label, shortLabel, minutes, countMode, matrixType, groupKey, groupRank, aliases, sortOrder:previous?.sortOrder ?? defs.length }); if(existingIndex >= 0) defs[existingIndex] = nextDef; else defs.push(nextDef); setTestDefinitions(defs); renderDynamicTestUI(); renderDraftTests(); render(); renderSchedule(); resetTestCatalogForm(nextDef.id); scheduleSave(); }
function saveWO(){ const num=document.getElementById('f-num').value.trim();
if(!num){alert('Work Order number is required.');
return false;} const derived = deriveCountsAndSamplesFromRows(modalDraftTestRows);
const vals={ number:num, client:document.getElementById('f-client').value.trim(), location:document.getElementById('f-loc').value.trim(), dueDate:document.getElementById('f-due').value||null, testCounts:derived.counts, gas:derived.counts['C6GAS'] || 0, liq:(derived.counts['C6LIQ'] || 0) + (derived.counts['C10LIQ'] || 0), gc:(derived.counts['GC-BFVC7MZ'] || 0) + (derived.counts['GC-BFVC10MZ'] || 0), samples:derived.samples, testRows:derived.testRows, notes:document.getElementById('f-notes').value.trim(), pdfAttachment:modalPdfAttachment ? {name:modalPdfAttachment.name || '', type:'application/pdf', size:Number(modalPdfAttachment.size || 0), dataUrl:modalPdfAttachment.dataUrl || ''} : null, priority:document.querySelector('#pri-grid .pri-opt.sel')?.dataset.p||'NONE', };
if(editId===null){ WOs.push(normalizeWorkOrder({id:uid(),stage:WO_STAGE.RUNNING,complete:false,...vals})); } else { const w=WOs.find(x=>x.id===editId);
if(w)Object.assign(w,vals); } closeModal();render();
return true; }
function deleteWO(){/* overridden by storage wrapper below */}
function selPri(el){ document.querySelectorAll('#pri-grid .pri-opt').forEach(e=>e.classList.remove('sel')); el.classList.add('sel'); }
function selPriVal(v){ document.querySelectorAll('#pri-grid .pri-opt').forEach(e=>e.classList.toggle('sel',e.dataset.p===v)); } document.getElementById('modal-overlay').addEventListener('click',e=>{ if(e.target===document.getElementById('modal-overlay'))closeModal(); }); document.getElementById('samples-overlay').addEventListener('click',e=>{ if(e.target===document.getElementById('samples-overlay'))closeSamplesModal(); }); document.getElementById('actions-overlay').addEventListener('click',e=>{ if(e.target===document.getElementById('actions-overlay'))closeActionsModal(); }); document.getElementById('test-select-overlay').addEventListener('click',e=>{ if(e.target===document.getElementById('test-select-overlay'))closeTestSelectorModal(); }); document.getElementById('test-edit-overlay').addEventListener('click',e=>{ if(e.target===document.getElementById('test-edit-overlay'))closeTestEditModal();
}); document.getElementById('test-catalog-overlay').addEventListener('click',e=>{ if(e.target===document.getElementById('test-catalog-overlay'))closeTestCatalogModal();
});
document.getElementById('employee-input').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addEmployee(); }
});
document.getElementById('task-name-input').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addEmployeeTask(); } });
document.getElementById('task-time-input').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addEmployeeTask(); } });
document.addEventListener('click',e=>{ const panel = document.getElementById('column-panel');
const wrap = e.target?.closest('.column-wrap');
if(!wrap && panel.classList.contains('open')) panel.classList.remove('open');
});
const STORAGE_KEY = 'lab-wip-workorders';
const SCHEDULE_STORAGE_KEY = 'lab-wip-daily-schedule';
const AUTO_REFRESH_MS = 15000;
let saveTimer = null;
let autoRefreshTimer = null;
let autoRefreshInFlight = false;
let lastLoadedWorkOrdersRaw = '';
let lastLoadedScheduleRaw = '';
let lastLoadedTestDefinitionsRaw = '';
function getStorageAdapter() { return ( window.storage && typeof window.storage.get === 'function' && typeof window.storage.set === 'function' ) ? window.storage : { get: async (key) => ({ value: localStorage.getItem(key) }), set: async (key, value) => { localStorage.setItem(key, value); } }; }
function showSaveStatus(state, msg) { const el = document.getElementById('save-indicator'); el.style.visibility = 'visible'; el.className = 'save-indicator ' + state; el.textContent = msg; }
function hideSaveStatusSoon(delay = 3000) { setTimeout(() => { const el = document.getElementById('save-indicator'); if(el) el.style.visibility = 'hidden'; }, delay); }
function isRemoteStorageMode(){ return !!(window.appAuth && typeof window.appAuth.getMode === 'function' && window.appAuth.getMode() === 'remote'); }
function isInteractionOverlayOpen(){ return ['modal-overlay','samples-overlay','actions-overlay','test-select-overlay','test-edit-overlay','test-catalog-overlay'].some(id => document.getElementById(id)?.classList.contains('open')); }
function rememberLoadedState(woRaw, scheduleRaw, testDefinitionsRaw){ lastLoadedWorkOrdersRaw = typeof woRaw === 'string' ? woRaw : ''; lastLoadedScheduleRaw = typeof scheduleRaw === 'string' ? scheduleRaw : ''; lastLoadedTestDefinitionsRaw = typeof testDefinitionsRaw === 'string' ? testDefinitionsRaw : ''; }
async function saveData() { const storageAdapter = getStorageAdapter(); clearTimeout(saveTimer); saveTimer = null; showSaveStatus('saving', 'SAVING...'); try { normalizeScheduleState(); const woRaw = JSON.stringify(WOs); const scheduleRaw = JSON.stringify(scheduleState); const testDefinitionsRaw = JSON.stringify(getTestDefinitions()); await Promise.all([ storageAdapter.set(STORAGE_KEY, woRaw), storageAdapter.set(SCHEDULE_STORAGE_KEY, scheduleRaw), storageAdapter.set(TEST_DEFINITION_STORAGE_KEY, testDefinitionsRaw) ]); rememberLoadedState(woRaw, scheduleRaw, testDefinitionsRaw); showSaveStatus('saved', 'SAVED'); hideSaveStatusSoon(); } catch (e) { showSaveStatus('error', 'SAVE FAILED'); console.error('Storage save error:', e); } }
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveData, 600); }
async function loadData(options = {}) { const silent = !!options.silent; let loadedWOs = false; let loadedSchedule = false; let loadedTestDefinitions = false; let changed = false; try { const storageAdapter = getStorageAdapter(); const [woResult, scheduleResult, testDefinitionsResult] = await Promise.all([ storageAdapter.get(STORAGE_KEY), storageAdapter.get(SCHEDULE_STORAGE_KEY), storageAdapter.get(TEST_DEFINITION_STORAGE_KEY) ]); const woRaw = typeof woResult?.value === 'string' ? woResult.value : ''; const scheduleRaw = typeof scheduleResult?.value === 'string' ? scheduleResult.value : ''; const testDefinitionsRaw = typeof testDefinitionsResult?.value === 'string' ? testDefinitionsResult.value : ''; if(woRaw === lastLoadedWorkOrdersRaw && scheduleRaw === lastLoadedScheduleRaw && testDefinitionsRaw === lastLoadedTestDefinitionsRaw) return false; if(testDefinitionsRaw) { const parsedTestDefinitions = JSON.parse(testDefinitionsRaw); if(Array.isArray(parsedTestDefinitions) && parsedTestDefinitions.length) { setTestDefinitions(parsedTestDefinitions); loadedTestDefinitions = true; changed = true; } } else if(lastLoadedTestDefinitionsRaw !== '') { setTestDefinitions(getDefaultTestDefinitions()); changed = true; } if(woRaw) { const parsed = JSON.parse(woRaw); if (Array.isArray(parsed)) { WOs = normalizeWorkOrders(parsed); loadedWOs = true; changed = true; } else if(parsed && Array.isArray(parsed.workOrders)) { WOs = normalizeWorkOrders(parsed.workOrders); loadedWOs = true; changed = true; } } else if(lastLoadedWorkOrdersRaw !== '') { WOs = []; changed = true; } if (scheduleRaw) { const parsedSchedule = JSON.parse(scheduleRaw); if(parsedSchedule && typeof parsedSchedule === 'object') { scheduleState = { date: parsedSchedule.date || todayISO(), employees: Array.isArray(parsedSchedule.employees) ? parsedSchedule.employees : [], entries: Array.isArray(parsedSchedule.entries) ? parsedSchedule.entries : [], tasks: Array.isArray(parsedSchedule.tasks) ? parsedSchedule.tasks : [] }; loadedSchedule = true; changed = true; } } else if(lastLoadedScheduleRaw !== '') { scheduleState = {date:todayISO(),employees:[],entries:[],tasks:[]}; changed = true; } normalizeScheduleState(); renderDynamicTestUI(); rememberLoadedState(woRaw, scheduleRaw, testDefinitionsRaw); if (changed) { render(); renderSchedule(); if (!silent) { showSaveStatus('loaded', `${WOs.length} WOs | ${scheduleState.entries.length} scheduled`); hideSaveStatusSoon(); } } } catch (e) { console.log('No saved data found.'); } return changed || loadedWOs || loadedSchedule || loadedTestDefinitions; }
async function refreshFromSharedStorage(){ if(!isRemoteStorageMode() || document.hidden || saveTimer || isInteractionOverlayOpen() || autoRefreshInFlight) return; autoRefreshInFlight = true; try { const changed = await loadData({ silent:true }); if(changed){ showSaveStatus('loaded', 'SYNCED'); hideSaveStatusSoon(1800); } } finally { autoRefreshInFlight = false; } }
function stopAutoRefresh(){ if(autoRefreshTimer){ clearInterval(autoRefreshTimer); autoRefreshTimer = null; } }
function startAutoRefresh(){ stopAutoRefresh(); if(!isRemoteStorageMode()) return; autoRefreshTimer = setInterval(() => { refreshFromSharedStorage(); }, AUTO_REFRESH_MS); }
document.addEventListener('visibilitychange', () => { if(!document.hidden) refreshFromSharedStorage(); });
const _origToggleDone = toggleDone; toggleDone = function(id) { _origToggleDone(id); scheduleSave(); };
const _origSaveWO = saveWO; saveWO = function() { if(_origSaveWO()) scheduleSave(); };
const _origDeleteWO = deleteWO; deleteWO = function() { if(!editId)return;
if(!confirm('Delete this work order? This cannot be undone.'))return; WOs=WOs.filter(w=>w.id!==editId); closeModal();render(); scheduleSave(); };
(async function init() { initColumnVisibility(); renderDynamicTestUI(); await (window.authReadyPromise || Promise.resolve()); await loadData(); renderDynamicTestUI(); render(); renderSchedule(); switchView('queue'); startAutoRefresh(); refreshFromSharedStorage();
})();

