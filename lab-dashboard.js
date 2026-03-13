const PRI = {CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3,NONE:4};
const TEST_CODES = ['AS-BFV_DENSITY','AS-BFV_MW','C6GAS','GC-BFVC6MZ','GC-BFVC7MZ','GC-BFVC10MZ','GC-2103-C10MZ','C6LIQ','C10LIQ'];
const TEST_COLUMNS = [...TEST_CODES];
const TEST_MINS = { 'AS-BFV_DENSITY':15, 'AS-BFV_MW':15, 'C6GAS':15, 'GC-BFVC6MZ':40, 'GC-BFVC7MZ':40, 'GC-BFVC10MZ':40, 'GC-2103-C10MZ':90, 'C6LIQ':40, 'C10LIQ':40
};
const COLUMN_STORAGE_KEY = 'lab-wip-column-visibility';
let columnVisibility = {};
const COLUMN_DEFS = [ {key:'number', label:'Work Order', width:190, fixed:true}, {key:'priority', label:'Priority', width:120}, {key:'client', label:'Client', width:200}, {key:'AS-BFV_DENSITY', label:'AS-BFV_DENSITY', width:130}, {key:'AS-BFV_MW', label:'AS-BFV_MW', width:130}, {key:'C6GAS', label:'C6GAS', width:110}, {key:'GC-BFVC6MZ', label:'GC-BFVC6MZ', width:130}, {key:'GC-BFVC7MZ', label:'GC-BFVC7MZ', width:130}, {key:'GC-BFVC10MZ', label:'GC-BFVC10MZ', width:130}, {key:'GC-2103-C10MZ', label:'GC-2103-C10MZ', width:150}, {key:'C6LIQ', label:'C6LIQ', width:110}, {key:'C10LIQ', label:'C10LIQ', width:110}, {key:'estTime', label:'Est. Time', width:120}, {key:'dueDate', label:'Due Date', width:130}, {key:'status', label:'Status', width:170},
];
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
const WO_STAGE = { RUNNING:'running', PENDING:'pending', DONE:'done' };
function normalizeTestCode(code){ const c=(code||'').toUpperCase().replace(/\s+/g,'');
if(c==='GAS') return 'C6GAS';
if(c==='LIQ') return 'C6LIQ';
if(c==='GC') return 'GC-BFVC10MZ';
if(c.includes('AS-BFV_DENSITY')) return 'AS-BFV_DENSITY';
if(c.includes('AS-BFV_MW')) return 'AS-BFV_MW';
if(c.includes('C6GAS') || c.includes('C6-GAS')) return 'C6GAS';
if(c.includes('GC-BFVC10MZ') || c.includes('BFVC10MZ') || c.includes('BFVC10')) return 'GC-BFVC10MZ';
if(c.includes('GC-2103-C10MZ') || c.includes('2103C10MZ')) return 'GC-2103-C10MZ';
if(c.includes('GC-BFVC7MZ') || c.includes('BFVC7MZ') || c.includes('BFVC7')) return 'GC-BFVC7MZ';
if(c.includes('GC-BFVC6MZ') || c.includes('BFVC6MZ') || c.includes('BFVC6')) return 'GC-BFVC6MZ';
if(c.includes('C10LIQ') || c.includes('C10-LIQ')) return 'C10LIQ';
if(c.includes('C6LIQ') || c.includes('C6-LIQ')) return 'C6LIQ';
return '';
}
function blankCounts(){ return TEST_CODES.reduce((acc,code)=>{acc[code]=0;
return acc;},{});
}
function getWOMetrics(w){ const counts = blankCounts();
let minutes = 0;
let totalTests = 0;
const rows = Array.isArray(w.testRows) ? w.testRows : [];
if(rows.length){ const sampleMap = new Map(); rows.forEach((r, idx) => { const sampleKey = (r.sampleId && String(r.sampleId).trim()) || `ROW_${idx}`;
if(!sampleMap.has(sampleKey)) sampleMap.set(sampleKey, []); sampleMap.get(sampleKey).push(r); });
for(const sampleRows of sampleMap.values()){ const sampleCodes = new Set(sampleRows.map(r => normalizeTestCode(r.testCode || r.type)).filter(Boolean));
const maxGC = sampleCodes.has('GC-BFVC10MZ') ? 'GC-BFVC10MZ' : sampleCodes.has('GC-BFVC7MZ') ? 'GC-BFVC7MZ' : sampleCodes.has('GC-BFVC6MZ') ? 'GC-BFVC6MZ' : '';
if(maxGC){ counts[maxGC] += 1; totalTests += 1; minutes += TEST_MINS[maxGC]; } ['AS-BFV_DENSITY','AS-BFV_MW','C6GAS','GC-2103-C10MZ','C6LIQ','C10LIQ'].forEach(code => { if(sampleCodes.has(code)){ counts[code] += 1; totalTests += 1; minutes += TEST_MINS[code]; } }); } } else { const legacyGas = Number(w.gas || 0);
const legacyLiq = Number(w.liq || 0);
const legacyGc = Number(w.gc || 0);
if(legacyGas){ counts['C6GAS'] += legacyGas; totalTests += legacyGas; minutes += legacyGas * TEST_MINS['C6GAS']; } if(legacyLiq){ counts['C6LIQ'] += legacyLiq; totalTests += legacyLiq; minutes += legacyLiq * TEST_MINS['C6LIQ']; } if(legacyGc){ counts['GC-BFVC10MZ'] += legacyGc; totalTests += legacyGc; minutes += legacyGc * TEST_MINS['GC-BFVC10MZ']; } } return {counts,minutes,totalTests};
}
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
const d=new Date(s); d.setHours(0,0,0,0);
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
const TEST_LABEL = TEST_CODES.reduce((acc,code)=>{acc[code]=code;
return acc;},{});
const inferTypeFromCode = code => normalizeTestCode(code) || 'AS-BFV_DENSITY'; scheduleState = {date:todayISO(),employees:[],entries:[],tasks:[]}; (function tick(){ const n=new Date(); document.getElementById('clock').textContent=n.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'}); document.getElementById('datedisp').textContent=n.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'}); setTimeout(tick,1000); })();
function clickSort(f){ if(sortState.field===f) sortState.dir=sortState.dir==='asc'?'desc':'asc'; else{sortState.field=f;sortState.dir='asc';} document.getElementById('sort-field').value=f; document.getElementById('sort-dir').value=sortState.dir; render(); }
function sortByPriority(){ sortState = {field:'priority',dir:'asc'}; document.getElementById('sort-field').value='priority'; document.getElementById('sort-dir').value='asc'; render(); }
function getSorted(){ const f=document.getElementById('sort-field').value;
const d=document.getElementById('sort-dir').value; sortState={field:f,dir:d};
const now=new Date();now.setHours(0,0,0,0);
const diff=w=>{const dt=parseDate(w.dueDate);
return dt?Math.round((dt-now)/86400000):9999;};
const arr=[...WOs]; arr.sort((a,b)=>{ let av,bv;
if(f==='priority'){av=PRI[a.priority||'NONE'];bv=PRI[b.priority||'NONE'];} else if(f==='dueDate'||f==='status'){av=diff(a);bv=diff(b);} else if(f==='number'){av=a.number;bv=b.number;} else if(f==='client'){av=(a.client||'').toLowerCase();bv=(b.client||'').toLowerCase();} else if(f==='estTime'){av=calcM(a);bv=calcM(b);} else if(TEST_CODES.includes(f)){av=getWOCounts(a)[f]||0;bv=getWOCounts(b)[f]||0;} else {av=0;bv=0;} if(av<bv)return d==='asc'?-1:1;
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
function normalizeScheduleState(){ if(!scheduleState || typeof scheduleState !== 'object') scheduleState = {};
if(!scheduleState.date) scheduleState.date = todayISO();
if(!Array.isArray(scheduleState.employees)) scheduleState.employees = [];
if(!Array.isArray(scheduleState.entries)) scheduleState.entries = [];
if(!Array.isArray(scheduleState.tasks)) scheduleState.tasks = []; scheduleState.employees = [...new Set( scheduleState.employees .map(name => String(name || '').trim()) .filter(Boolean) )];
const employeeSet = new Set(scheduleState.employees);
const seen = new Set();
const validOpenIds = new Set(WOs.filter(w => w.stage === WO_STAGE.RUNNING).map(w => w.id)); scheduleState.entries = scheduleState.entries .map(entry => ({ woId: entry && entry.woId ? String(entry.woId) : '', assignees: Array.isArray(entry?.assignees) ? entry.assignees : [], notes: String(entry?.notes || '') })) .filter(entry => { if(!entry.woId || seen.has(entry.woId) || !validOpenIds.has(entry.woId)) return false; seen.add(entry.woId);
return true; }) .map(entry => ({ ...entry, assignees: [...new Set( entry.assignees .map(name => String(name || '').trim()) .filter(name => employeeSet.has(name)) )] }));
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
return scheduleState.entries .map((entry, index) => { const wo = WOs.find(w => w.id === entry.woId);
if(!wo || wo.stage !== WO_STAGE.RUNNING) return null;
const totalMinutes = calcM(wo);
const assignees = entry.assignees || [];
const splitCount = assignees.length || 1;
const splitMinutes = totalMinutes ? Math.round((totalMinutes / splitCount) * 10) / 10 : 0;
return { entry, wo, order: index + 1, totalMinutes, assignees, splitMinutes }; }) .filter(Boolean);
}
function buildEmployeePlan(rows){ const plan = new Map(scheduleState.employees.map(name => [name, {name, minutes:0, items:[]}]));
const unassigned = {name:'Unassigned', minutes:0, items:[]};
for(const row of rows){ if(row.assignees.length){ const share = row.totalMinutes / row.assignees.length;
for(const name of row.assignees){ if(!plan.has(name)) plan.set(name, {name, minutes:0, items:[]});
const p = plan.get(name); p.minutes += share; p.items.push({order:row.order, woNumber:row.wo.number, minutes:share}); } } else { unassigned.minutes += row.totalMinutes; unassigned.items.push({order:row.order, woNumber:row.wo.number, minutes:row.totalMinutes}); } } const out = [...plan.values()].filter(p => p.minutes > 0 || scheduleState.employees.includes(p.name));
if(unassigned.minutes > 0) out.push(unassigned); out.sort((a,b) => b.minutes - a.minutes);
return out;
}
function getEmployeeTasks(employeeName){ return scheduleState.tasks.filter(task => task.employee === employeeName); }
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
function buildReportData(scope = '__master__'){ const rows = getScheduleRows().map(row => ({ ...row, matrixType:getPrimaryMatrixGroup(row.wo) }));
const isMaster = !scope || scope === '__master__';
const employeeName = isMaster ? 'Master Report' : scope;
const filteredRows = isMaster ? rows : rows.filter(row => row.assignees.includes(scope));
const laneSource = isMaster ? rows : filteredRows;
const gasRows = laneSource.filter(row => row.matrixType === 'Gas');
const liquidRows = laneSource.filter(row => row.matrixType !== 'Gas');
const plan = buildEmployeePlan(rows);
const filteredPlan = isMaster ? plan : plan.filter(p => p.name === scope);
const reportEmployees = isMaster ? scheduleState.employees : [scope];
const taskBuckets = reportEmployees.filter(name => !!name).map(name => ({ name, tasks:getEmployeeTasks(name) }));
const hasTasks = taskBuckets.some(bucket => bucket.tasks.length);
return { isMaster, employeeName, rows, filteredRows, gasRows, liquidRows, plan:filteredPlan, taskBuckets, hasTasks };
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
function initColumnVisibility(){ const defaults = {}; COLUMN_DEFS.forEach(col => { defaults[col.key] = true; }); try { const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
const parsed = raw ? JSON.parse(raw) : {}; columnVisibility = {...defaults, ...(parsed && typeof parsed === 'object' ? parsed : {})}; } catch { columnVisibility = defaults; }
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
function formatCountsSummary(counts){ const parts = [ ['DENS','AS-BFV_DENSITY'], ['MW','AS-BFV_MW'], ['C6GAS','C6GAS'], ['BFVC6','GC-BFVC6MZ'], ['BFVC7','GC-BFVC7MZ'], ['BFVC10','GC-BFVC10MZ'], ['GC2103','GC-2103-C10MZ'], ['C6LIQ','C6LIQ'], ['C10LIQ','C10LIQ'] ] .map(([label, key]) => ({label, value: Number(counts[key] || 0)})) .filter(item => item.value > 0) .map(item => `${item.label} ${item.value}`);
return parts.length ? parts.join(' | ') : 'None'; }
function normalizeMatrixBucket(raw){ const m = (raw || '').toString().trim().toLowerCase();
if(!m) return '';
if(m.includes('gas')) return 'Gas';
if(m.includes('oil') || m.includes('liq')) return 'Liquid';
return ''; }
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
if(!scheduleState.employees.length){ employeeList.innerHTML = '<span class="split-hint">No employees added yet.</span>'; } else { employeeList.innerHTML = scheduleState.employees.map((name, idx) => ` <span class="employee-chip">${esc(name)} <button title="Remove employee" onclick="removeEmployee(${idx})">x</button></span> `).join(''); } const openWOs = getOpenWOsSorted();
const rows = getScheduleRows();
const scheduledIds = new Set(rows.map(r => r.wo.id));
const unscheduled = openWOs.filter(wo => !scheduledIds.has(wo.id));
const scheduledCounts = aggregateCounts(rows.map(r => r.wo));
const unscheduledCounts = aggregateCounts(unscheduled); document.getElementById('sch-wo').textContent = rows.length; document.getElementById('sch-unscheduled').textContent = unscheduled.length; document.getElementById('sch-time').textContent = fmtMOrZero(rows.reduce((sum, r) => sum + r.totalMinutes, 0)); document.getElementById('sch-employees').textContent = scheduleState.employees.length;
const testSummaryEl = document.getElementById('schedule-test-summary');
if(testSummaryEl){ testSummaryEl.innerHTML = ` <div><strong>Scheduled:</strong> ${formatCountsSummary(scheduledCounts)}</div> <div class="test-summary-line"><strong>Remaining:</strong> ${formatCountsSummary(unscheduledCounts)}</div> `; } const unscheduledList = document.getElementById('unscheduled-list');
if(!unscheduled.length){ unscheduledList.innerHTML = '<div class="schedule-empty">All open work orders are already scheduled.</div>'; } else { unscheduledList.innerHTML = unscheduled.map(wo => ` <div class="schedule-item"> <div class="schedule-item-main"> <div class="run-rank">WO</div> <div> <div class="schedule-title">${esc(wo.number)}</div> <div class="schedule-sub">${esc(wo.client || 'Unassigned client')} | Priority ${esc(wo.priority || 'NONE')} | ${fmtDate(wo.dueDate) || 'No due date'}</div> <div class="schedule-sub">${fmtMOrZero(calcM(wo))} total | ${getWOTestTotal(wo)} scheduled test units</div> </div> <button class="act-btn" onclick="addToSchedule('${wo.id}')">Schedule</button> </div> </div> `).join(''); } const scheduledList = document.getElementById('scheduled-list');
if(!rows.length){ scheduledList.innerHTML = '<div class="schedule-empty">No run order set yet. Add work orders from the left panel.</div>'; } else { scheduledList.innerHTML = rows.map((row, index) => { const assigneeButtons = scheduleState.employees.length ? scheduleState.employees.map((name, empIndex) => { const active = row.assignees.includes(name);
return `<button type="button" class="assignee-btn ${active ? 'on' : ''}" onclick="toggleAssignee(${index}, ${empIndex})">${esc(name)}</button>`; }).join('') : '<span class="split-hint">Add employees above to split this work order.</span>';
const splitLabel = row.assignees.length ? `${row.assignees.length} assignee(s) | ${fmtMOrZero(row.splitMinutes)} each` : 'Unassigned | full time remains unassigned';
const testSummary = formatCountsSummary(getWOCounts(row.wo));
return ` <div class="schedule-item run-item" draggable="true" data-index="${index}" ondragstart="onScheduleDragStart(event)" ondragover="onScheduleDragOver(event)" ondrop="onScheduleDrop(event)" ondragend="onScheduleDragEnd()"> <div class="schedule-item-main"> <div class="run-rank">#${row.order}</div> <div> <div class="schedule-title">${esc(row.wo.number)} | ${esc(row.wo.client || 'Unassigned client')}</div> <div class="schedule-sub">Priority ${esc(row.wo.priority || 'NONE')} | Due ${fmtDate(row.wo.dueDate) || 'Not set'} | ${fmtMOrZero(row.totalMinutes)}</div> <div class="schedule-sub">${splitLabel}</div> <div class="schedule-sub">${testSummary}</div> </div> <button class="act-btn" onclick="removeFromSchedule(${index})">Remove</button> </div> <div class="schedule-assignees">${assigneeButtons}</div> <div class="schedule-notes"> <textarea placeholder="Scheduling notes..." oninput="updateScheduleNotes(${index}, this.value)">${esc(row.entry.notes || '')}</textarea> </div> </div> `; }).join(''); } const plan = buildEmployeePlan(rows);
const planNode = document.getElementById('employee-plan');
const planSummary = document.getElementById('employee-plan-summary');
if(planSummary){ const totalPlan = plan.reduce((sum, p) => sum + p.minutes, 0); planSummary.textContent = `${plan.length} workload bucket(s) | ${fmtMOrZero(totalPlan)}`; } if(!plan.length){ planNode.innerHTML = '<div class="schedule-empty">Add employees and assign work orders to build workloads.</div>'; } else { planNode.innerHTML = plan.map(p => ` <div class="plan-card"> <div class="plan-name">${esc(p.name)}</div> <div class="plan-total">${fmtMOrZero(Math.round(p.minutes))}</div> <div class="plan-lines"> ${p.items.length ? p.items.map(item => `<div>#${item.order} WO ${esc(item.woNumber)} (${fmtMOrZero(Math.round(item.minutes))})</div>`).join('') : '<div>No assigned work orders.</div>'} </div> </div> `).join(''); }
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
function removeEmployee(index){ if(index < 0 || index >= scheduleState.employees.length) return; scheduleState.employees.splice(index, 1); normalizeScheduleState(); renderSchedule(); scheduleSave();
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
function addToSchedule(woId){ const wo = WOs.find(w => w.id === woId && !w.complete);
if(!wo) return;
if(scheduleState.entries.some(entry => entry.woId === woId)) return; scheduleState.entries.push({woId, assignees:[], notes:''}); renderSchedule(); scheduleSave();
}
function removeFromSchedule(index){ if(index < 0 || index >= scheduleState.entries.length) return; scheduleState.entries.splice(index, 1); renderSchedule(); scheduleSave();
}
function toggleAssignee(scheduleIndex, employeeIndex){ const entry = scheduleState.entries[scheduleIndex];
const name = scheduleState.employees[employeeIndex];
if(!entry || !name) return;
if(!Array.isArray(entry.assignees)) entry.assignees = [];
const idx = entry.assignees.indexOf(name);
if(idx >= 0) entry.assignees.splice(idx, 1); else entry.assignees.push(name); normalizeScheduleState(); renderSchedule(); scheduleSave();
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
function clearSchedule(){ if(!confirm('Clear this daily run order?')) return; scheduleState.entries = []; renderSchedule(); scheduleSave();
}
function autofillScheduleFromQueue(){ normalizeScheduleState();
const existing = new Map(scheduleState.entries.map(e => [e.woId, e])); scheduleState.entries = getOpenWOsSorted().map(wo => { const prior = existing.get(wo.id);
return prior ? prior : {woId:wo.id, assignees:[], notes:''}; }); renderSchedule(); scheduleSave();
}
function csvEsc(value){ return `"${String(value ?? '').replace(/"/g, '""')}"`;
}
function exportRunOrderCsv(){ const rows = getScheduleRows();
if(!rows.length){ alert('No scheduled work orders to export.'); return; } const lines = [ ['Schedule Date','Run Order','WO Number','Client','Priority','Due Date','Total Minutes','Assignees','Minutes Each','Notes'].map(csvEsc).join(',') ];
for(const row of rows){ const assignees = row.assignees.length ? row.assignees.join(' | ') : 'Unassigned';
const minsEach = row.assignees.length ? row.splitMinutes : row.totalMinutes; lines.push([ scheduleState.date || todayISO(), row.order, row.wo.number || '', row.wo.client || '', row.wo.priority || 'NONE', row.wo.dueDate || '', row.totalMinutes, assignees, minsEach, row.entry.notes || '' ].map(csvEsc).join(',')); } const blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8;'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a'); a.href = url; a.download = `run-order-${scheduleState.date || todayISO()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function printRunOrder(){ const scope = document.getElementById('print-report-target')?.value || '__master__';
const report = buildReportData(scope);
if(!report.rows.length && !report.hasTasks){ alert('No scheduled work orders or tasks to print.'); return; }
if(!report.isMaster && !report.filteredRows.length && !report.hasTasks){ alert('No work or tasks assigned to that employee for this report.'); return; }
const win = window.open('', '_blank');
if(!win){ alert('Unable to open print window. Please allow pop-ups.'); return; } const displayMinutes = row => report.isMaster ? row.totalMinutes : row.splitMinutes;
const runRows = report.filteredRows.length ? report.filteredRows.map(row => ` <tr> <td>${row.order}</td> <td>${esc(row.wo.number || '')}</td> <td>${esc(row.wo.client || '')}</td> <td>${esc(row.wo.priority || 'NONE')}</td> <td>${esc(row.wo.dueDate || '')}</td> <td>${esc(row.matrixType || 'Unknown Matrix')}</td> <td>${fmtMOrZero(displayMinutes(row))}</td> <td>${esc(row.assignees.length ? row.assignees.join(', ') : 'Unassigned')}</td> <td>${esc(row.entry.notes || '')}</td> </tr> `).join('') : '<tr><td colspan="9">No scheduled work orders in this report.</td></tr>';
const laneRows = laneList => laneList.length ? laneList.map(row => ` <tr> <td>${row.order}</td> <td>${esc(row.wo.number || '')}</td> <td>${esc(row.wo.client || '')}</td> <td>${esc(row.wo.priority || 'NONE')}</td> <td>${esc(row.matrixType || 'Unknown Matrix')}</td> <td>${fmtMOrZero(displayMinutes(row))}</td> </tr> `).join('') : '<tr><td colspan="6">No work orders assigned.</td></tr>';
const planRows = report.plan.length ? report.plan.map(p => ` <tr> <td>${esc(p.name)}</td> <td>${fmtMOrZero(Math.round(p.minutes))}</td> <td>${esc(p.items.map(item => `#${item.order} ${item.woNumber}`).join(' | ')) || 'No assigned work orders'}</td> </tr> `).join('') : '<tr><td colspan="3">No workload assigned.</td></tr>';
const taskRows = report.taskBuckets.length ? report.taskBuckets.map(bucket => bucket.tasks.length ? bucket.tasks.map((task, index) => ` <tr> <td>${index === 0 ? esc(bucket.name) : ''}</td> <td>${esc(task.name)}</td> <td>${task.minutes ? fmtMOrZero(task.minutes) : 'Not set'}</td> </tr> `).join('') : ` <tr><td>${esc(bucket.name)}</td><td>No additional tasks</td><td>Not set</td></tr> `).join('') : '<tr><td colspan="3">No additional tasks assigned.</td></tr>';
const reportTitle = report.isMaster ? 'Daily Run Order - Master Report' : `Daily Run Order - ${report.employeeName}`;
const timeHeader = report.isMaster ? 'Total Time' : 'Assigned Time';
const html = `<!doctype html> <html> <head> <meta charset="utf-8"> <title>${esc(reportTitle)} ${esc(scheduleState.date || todayISO())}</title> <style> body{font-family:Arial,sans-serif;padding:20px;color:#111;} h1{margin:0 0 4px 0;font-size:24px;} .meta{color:#444;margin-bottom:16px;} table{width:100%;border-collapse:collapse;margin-top:8px;margin-bottom:20px;} th,td{border:1px solid #bbb;padding:6px 8px;font-size:12px;vertical-align:top;text-align:left;} th{background:#f2f2f2;} h2{margin:18px 0 6px 0;font-size:16px;} h3{margin:10px 0 6px 0;font-size:14px;} </style> </head> <body> <h1>${esc(reportTitle)}</h1> <div class="meta">Schedule Date: ${esc(scheduleState.date || todayISO())}</div> <table> <thead> <tr><th>Run</th><th>WO</th><th>Client</th><th>Priority</th><th>Due Date</th><th>Matrix Type</th><th>${timeHeader}</th><th>Assignees</th><th>Notes</th></tr> </thead> <tbody>${runRows}</tbody> </table> <h2>Lane Split</h2> <h3>1. Gas Lane</h3> <table> <thead> <tr><th>Run</th><th>WO</th><th>Client</th><th>Priority</th><th>Matrix Type</th><th>${timeHeader}</th></tr> </thead> <tbody>${laneRows(report.gasRows)}</tbody> </table> <h3>2. Liquid Lane</h3> <table> <thead> <tr><th>Run</th><th>WO</th><th>Client</th><th>Priority</th><th>Matrix Type</th><th>${timeHeader}</th></tr> </thead> <tbody>${laneRows(report.liquidRows)}</tbody> </table> <h2>Employee Workload</h2> <table> <thead> <tr><th>Employee</th><th>Total Time</th><th>Assigned Run Steps</th></tr> </thead> <tbody>${planRows}</tbody> </table> <h2>Additional Tasks</h2> <table> <thead> <tr><th>Employee</th><th>Task</th><th>Time</th></tr> </thead> <tbody>${taskRows}</tbody> </table> </body> </html>`; win.document.open(); win.document.write(html); win.document.close(); win.focus(); win.print();}
function render(){ const visibleCols = getVisibleColumnCount();
const grpBy=document.getElementById('grp-by').value;
const search=document.getElementById('search').value.toLowerCase().trim(); document.querySelectorAll('thead th').forEach(th=>{ th.classList.remove('sorted-asc','sorted-desc'); });
 let sorted=getFilteredWorkOrders();
const activeSortTh = document.querySelector(`thead th.sortable[onclick="clickSort('${sortState.field}')"]`); if (activeSortTh) activeSortTh.classList.add(sortState.dir==='asc' ? 'sorted-asc' : 'sorted-desc');
 if(search)sorted=sorted.filter(w=> String(w.number||'').toLowerCase().includes(search)||(w.client||'').toLowerCase().includes(search)|| (w.location||'').toLowerCase().includes(search) );
 const tbodyId = appView === 'pending' ? 'pending-wo-tbody' : 'wo-tbody';
 const emptyLabel = appView === 'pending' ? 'No work orders are waiting to report.' : 'No work orders match current filters.';
 if(!sorted.length){ document.getElementById(tbodyId).innerHTML=`<tr><td colspan="${visibleCols}"><div class="empty-state"><div class="big"></div>${emptyLabel}</div></td></tr>`; applyColumnVisibility(); updateStats(); renderSchedule(); const ts = new Date().toLocaleTimeString(); document.getElementById(appView === 'pending' ? 'pending-last-update' : 'last-update').textContent=`Updated ${ts}`; return; } const groups={};
if(grpBy==='none'){ groups['__all__']=sorted; } else if(grpBy==='client'){ for(const w of sorted){ const k=w.client||'Unassigned';
if(!groups[k])groups[k]=[]; groups[k].push(w); } } else if(grpBy==='priority'){ for(const w of sorted){ const k=w.priority||'NONE';
if(!groups[k])groups[k]=[]; groups[k].push(w); } } else if(grpBy==='matrix'){ for(const w of sorted){ const k=getPrimaryMatrixGroup(w);
if(!groups[k])groups[k]=[]; groups[k].push(w); } } else { for(const w of sorted){ const k=w.location||'Unknown';
if(!groups[k])groups[k]=[]; groups[k].push(w); } } let html='';
const groupEntries = grpBy==='priority' ? ['CRITICAL','HIGH','MEDIUM','LOW','NONE'] .filter(k => groups[k]?.length) .map(k => [k, groups[k]]) : grpBy==='matrix' ? ['Gas','Liquid','Unknown Matrix'].filter(k => groups[k]?.length).map(k => [k, groups[k]]) : Object.entries(groups);
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
const counts = getWOCounts(w);
const priBadge=(pri==='CRITICAL'||pri==='HIGH'||pri==='MEDIUM'||pri==='LOW') ?`<div class="pri-badge pb-${pri}">${pri==='CRITICAL'?'&#128680;':pri==='HIGH'?'&#128293;':pri==='MEDIUM'?'&#9888;&#65039;':'&#128998;'} ${pri}</div>`: `<span style="color:var(--muted);font-size:11px"></span>`;
const testCell=(v,cls='')=>v?`<span class="tc ${cls}">${v}</span>`:`<span class="tc empty"></span>`;
 const dueFmt=fmtDate(w.dueDate)||'<span style="color:var(--muted)">Not set</span>'; html+=` <tr class="p-${pri}${w.stage===WO_STAGE.DONE?' complete-row':''} wo-clickable-row" data-id="${w.id}" onclick="openActionsModal('${w.id}')" title="Click for actions"> <td class="col-number"><div class="wo-num">${safeNum}</div>${safeNotes?`<div class="wo-sub">${safeNotes}</div>`:''}${sampleCount?`<div class="wo-sub">${sampleCount} sample(s)</div>`:''}</td> <td class="col-priority">${priBadge}</td> <td class="col-client" style="font-family:var(--sans);font-size:14px">${safeClient||'<span style="color:var(--muted)"></span>'}</td> <td class="num col-AS-BFV_DENSITY">${testCell(counts['AS-BFV_DENSITY'])}</td> <td class="num col-AS-BFV_MW">${testCell(counts['AS-BFV_MW'],'liq')}</td> <td class="num col-C6GAS">${testCell(counts['C6GAS'])}</td> <td class="num col-GC-BFVC6MZ">${testCell(counts['GC-BFVC6MZ'],'gc')}</td> <td class="num col-GC-BFVC7MZ">${testCell(counts['GC-BFVC7MZ'],'gc')}</td> <td class="num col-GC-BFVC10MZ">${testCell(counts['GC-BFVC10MZ'],'gc')}</td> <td class="num col-GC-2103-C10MZ">${testCell(counts['GC-2103-C10MZ'],'gc')}</td> <td class="num col-C6LIQ">${testCell(counts['C6LIQ'],'liq')}</td> <td class="num col-C10LIQ">${testCell(counts['C10LIQ'],'liq')}</td> <td class="col-estTime"><div class="est-time">${fmtMOrZero(mins)}${mins?`<div class="est-mins">${mins} min</div>`:''}</div></td> <td class="col-dueDate"><div style="font-family:var(--mono);font-size:12px">${dueFmt}</div></td> <td class="col-status"><span class="sb ${st.cls}">${st.label}</span>${st.dl?`<span class="overdue-info">${st.dl}</span>`:''}</td> </tr>`; } } document.getElementById(tbodyId).innerHTML=html; applyColumnVisibility(); const stamp = `Updated ${new Date().toLocaleTimeString()}`; document.getElementById('last-update').textContent=stamp; const pendingStamp = document.getElementById('pending-last-update'); if(pendingStamp) pendingStamp.textContent=stamp; updateStats(); renderSchedule(); }
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
function getDraftRowsFromWO(w){ if(Array.isArray(w.testRows) && w.testRows.length){ return w.testRows.map(r=>({ id:r.id || uid(), type:normalizeTestCode(r.type || r.testCode) || inferTypeFromCode(r.testCode), testCode:r.testCode || '', sampleId:r.sampleId || '', cylinderNumber:r.cylinderNumber || '', matrix:r.matrix || '', containerType:r.containerType || '', received:r.received || '', logDate:r.logDate || '', dueDate:r.dueDate || w.dueDate || '', })); } if(Array.isArray(w.samples) && w.samples.length){ const rows = [];
for(const s of w.samples){ const codes = Array.isArray(s.testCodes) && s.testCodes.length ? s.testCodes : [''];
for(const tc of codes){ rows.push({ id:uid(), type:inferTypeFromCode(tc), testCode:tc || '', sampleId:s.sampleId || '', cylinderNumber:s.cylinderNumber || '', matrix:s.matrix || '', containerType:s.containerType || '', received:s.received || '', logDate:s.logDate || '', dueDate:s.dueDate || w.dueDate || '', }); } } return rows; } const rows = [];
const addPlaceholder = (code,count) => { for(let i=0;i<count;i++){ rows.push({id:uid(),type:code,testCode:code,sampleId:`AUTO-${code}-${i+1}`,cylinderNumber:'',matrix:'',containerType:'',received:'',logDate:'',dueDate:w.dueDate||''}); } };
const metrics = getWOMetrics(w); TEST_CODES.forEach(code => addPlaceholder(code, metrics.counts[code] || 0));
return rows;
}
function openSamplesModal(id){ const w = WOs.find(x=>x.id===id);
if(!w) return;
const samples = Array.isArray(w.samples) ? w.samples : [];
const testRows = Array.isArray(w.testRows) ? w.testRows.length : getWOTestTotal(w); document.getElementById('samples-title').textContent = `Sample Details WO ${w.number}`; document.getElementById('samples-summary').textContent = `${samples.length} sample(s) ${testRows} test row(s)`;
if(!samples.length){ document.getElementById('samples-tbody').innerHTML = '<tr><td colspan="8" style="color:var(--muted)">No sample-level data available for this work order.</td></tr>'; } else { document.getElementById('samples-tbody').innerHTML = samples.map(s=>` <tr> <td>${esc(s.sampleId)}</td> <td>${esc((s.testCodes||[]).join(', '))}</td> <td>${esc(s.matrix || '')}</td> <td>${esc(s.containerType || '')}</td> <td>${esc(s.cylinderNumber || '')}</td> <td>${esc(s.received || '')}</td> <td>${esc(s.logDate || '')}</td> <td>${esc(s.dueDate || '')}</td> </tr> `).join(''); } document.getElementById('samples-overlay').classList.add('open'); }
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
function resetDraftTestForm(){ document.getElementById('f-test-type').value='AS-BFV_DENSITY'; document.getElementById('f-test-code').value=''; document.getElementById('f-test-sample').value=''; document.getElementById('f-test-cylinder').value=''; document.getElementById('f-test-matrix').value=''; document.getElementById('f-test-container').value=''; document.getElementById('f-test-received').value=''; document.getElementById('f-test-log-date').value=''; }
function getDraftTestRowFromForm(){ const sampleId = document.getElementById('f-test-sample').value.trim();
if(!sampleId){ alert('Sample # is required for each test row.');
return null; } const type = document.getElementById('f-test-type').value;
const testCode = document.getElementById('f-test-code').value.trim();
return { id:uid(), type, testCode:testCode || TEST_LABEL[type], sampleId, cylinderNumber:document.getElementById('f-test-cylinder').value.trim(), matrix:document.getElementById('f-test-matrix').value.trim(), containerType:document.getElementById('f-test-container').value.trim(), received:document.getElementById('f-test-received').value.trim(), logDate:document.getElementById('f-test-log-date').value.trim(), dueDate:document.getElementById('f-due').value || '', }; }
function upsertDraftTestRow(){ const row = getDraftTestRowFromForm();
if(!row) return; modalDraftTestRows.push(row); resetDraftTestForm(); renderDraftTests(); }
function openTestSelectorModal(){ if(!modalDraftTestRows.length){ alert('No test rows available to edit.'); return; } const sel = document.getElementById('test-select-list'); sel.innerHTML = modalDraftTestRows.map((r, idx) => `<option value="${r.id}">${idx+1}. Sample ${esc(r.sampleId||'')} | ${TEST_LABEL[r.type] || r.type} | ${esc(r.testCode||'')}</option>` ).join(''); sel.selectedIndex = 0; document.getElementById('test-select-overlay').classList.add('open'); }
function closeTestSelectorModal(){ document.getElementById('test-select-overlay').classList.remove('open'); }
function deleteSelectedTestRow(){ const sel = document.getElementById('test-select-list');
const id = sel.value;
if(!id) return; modalDraftTestRows = modalDraftTestRows.filter(r=>r.id!==id); closeTestSelectorModal(); renderDraftTests(); }
function openEditTestModalFromSelector(){ const sel = document.getElementById('test-select-list');
const id = sel.value;
if(!id) return;
const row = modalDraftTestRows.find(r=>r.id===id);
if(!row) return; selectedTestRowId = id; document.getElementById('e-test-type').value = normalizeTestCode(row.type || row.testCode) || 'AS-BFV_DENSITY'; document.getElementById('e-test-code').value = row.testCode || ''; document.getElementById('e-test-sample').value = row.sampleId || ''; document.getElementById('e-test-cylinder').value = row.cylinderNumber || ''; document.getElementById('e-test-matrix').value = row.matrix || ''; document.getElementById('e-test-container').value = row.containerType || ''; document.getElementById('e-test-received').value = row.received || ''; document.getElementById('e-test-log-date').value = row.logDate || ''; closeTestSelectorModal(); document.getElementById('test-edit-overlay').classList.add('open'); }
function closeTestEditModal(){ document.getElementById('test-edit-overlay').classList.remove('open'); selectedTestRowId = null; }
function saveEditedTestRow(){ if(!selectedTestRowId) return;
const sampleId = document.getElementById('e-test-sample').value.trim();
if(!sampleId){ alert('Sample # is required.'); return; } const type = document.getElementById('e-test-type').value;
const idx = modalDraftTestRows.findIndex(r=>r.id===selectedTestRowId);
if(idx<0) return; modalDraftTestRows[idx] = { ...modalDraftTestRows[idx], type, testCode:document.getElementById('e-test-code').value.trim() || TEST_LABEL[type], sampleId, cylinderNumber:document.getElementById('e-test-cylinder').value.trim(), matrix:document.getElementById('e-test-matrix').value.trim(), containerType:document.getElementById('e-test-container').value.trim(), received:document.getElementById('e-test-received').value.trim(), logDate:document.getElementById('e-test-log-date').value.trim(), dueDate:document.getElementById('f-due').value || '', }; closeTestEditModal(); renderDraftTests(); }
function deriveCountsAndSamplesFromRows(rows){ const counts = blankCounts();
const sampleMap = new Map();
const sampleCodeSets = new Map();
for(const r of rows){ const sid = r.sampleId || 'UNASSIGNED';
const canonical = normalizeTestCode(r.testCode || r.type);
if(!sampleCodeSets.has(sid)) sampleCodeSets.set(sid, new Set());
if(canonical) sampleCodeSets.get(sid).add(canonical);
if(!sampleMap.has(sid)){ sampleMap.set(sid,{ sampleId:sid, testCodes:[], matrix:r.matrix || '', containerType:r.containerType || '', cylinderNumber:r.cylinderNumber || '', received:r.received || '', logDate:r.logDate || '', dueDate:r.dueDate || '', }); } const s = sampleMap.get(sid);
if(r.testCode && !s.testCodes.includes(r.testCode)) s.testCodes.push(r.testCode);
if(!s.matrix) s.matrix = r.matrix || '';
if(!s.containerType) s.containerType = r.containerType || '';
if(!s.cylinderNumber) s.cylinderNumber = r.cylinderNumber || '';
if(!s.received) s.received = r.received || '';
if(!s.logDate) s.logDate = r.logDate || '';
if(!s.dueDate) s.dueDate = r.dueDate || ''; } for(const codeSet of sampleCodeSets.values()){ const maxGC = codeSet.has('GC-BFVC10MZ') ? 'GC-BFVC10MZ' : codeSet.has('GC-BFVC7MZ') ? 'GC-BFVC7MZ' : codeSet.has('GC-BFVC6MZ') ? 'GC-BFVC6MZ' : '';
if(maxGC) counts[maxGC] += 1; ['AS-BFV_DENSITY','AS-BFV_MW','C6GAS','GC-2103-C10MZ','C6LIQ','C10LIQ'].forEach(code => { if(codeSet.has(code)) counts[code] += 1; }); } return {counts, samples:[...sampleMap.values()], testRows:rows};
}
function renderDraftTests(){ const container = document.getElementById('test-draft-list');
if(!modalDraftTestRows.length){ container.innerHTML = '<div style="margin-top:6px;">No tests added yet.</div>'; return; } const sampleCount = new Set(modalDraftTestRows.map(r=>r.sampleId || 'UNASSIGNED')).size;
const header = `<div style="margin-bottom:6px;">${sampleCount} sample(s) ${modalDraftTestRows.length} test row(s)</div>`;
const grouped = new Map();
for(const r of modalDraftTestRows){ const sampleId = r.sampleId || 'UNASSIGNED';
if(!grouped.has(sampleId)) grouped.set(sampleId, []); grouped.get(sampleId).push(r); } modalSampleGroupKeys = [...grouped.keys()].sort((a,b)=>a.localeCompare(b));
const rows = modalSampleGroupKeys.map((sampleId, idx)=>{ const tests = grouped.get(sampleId) || [];
const isOpen = expandedSampleGroups.has(sampleId);
const byType = blankCounts();
for(const t of tests){ const code = normalizeTestCode(t.testCode || t.type);
if(code) byType[code] += 1; } const summary = `${tests.length} rows DENS ${byType['AS-BFV_DENSITY']} MW ${byType['AS-BFV_MW']} C6GAS ${byType['C6GAS']} BFVC6 ${byType['GC-BFVC6MZ']} BFVC7 ${byType['GC-BFVC7MZ']} BFVC10 ${byType['GC-BFVC10MZ']} GC2103 ${byType['GC-2103-C10MZ']} C6LIQ ${byType['C6LIQ']} C10LIQ ${byType['C10LIQ']}`;
const details = isOpen ? tests.map((r, i)=>` <div style="display:grid;grid-template-columns:46px 120px 1fr 1fr;gap:8px;align-items:center;margin:4px 0 0 26px;"> <span>${i+1}</span> <span style="color:var(--accent)">${esc(TEST_LABEL[r.type] || r.type || '')}</span> <span>${esc(r.testCode || '')}</span> <span>${esc(r.cylinderNumber || '')}</span> </div> `).join('') : '';
return ` <div style="margin-top:8px;padding:6px 8px;border:1px solid var(--border);border-radius:6px;background:var(--surface2);"> <div style="display:grid;grid-template-columns:22px 1fr auto;gap:8px;align-items:center;"> <button type="button" class="act-btn" onclick="toggleSampleGroup(${idx})" style="padding:2px 6px;">${isOpen?'-':'+'}</button> <div><span style="color:var(--text)">Sample ${esc(sampleId)}</span></div> <div style="color:var(--muted);font-size:11px;">${summary}</div> </div> ${details} </div> `; }).join(''); container.innerHTML = `${header}${rows}`; }
function toggleSampleGroup(index){ const sampleId = modalSampleGroupKeys[index];
if(!sampleId) return;
if(expandedSampleGroups.has(sampleId)) expandedSampleGroups.delete(sampleId); else expandedSampleGroups.add(sampleId); renderDraftTests(); }
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
function getStorageAdapter() { return ( window.storage && typeof window.storage.get === 'function' && typeof window.storage.set === 'function' ) ? window.storage : { get: async (key) => ({ value: localStorage.getItem(key) }), set: async (key, value) => { localStorage.setItem(key, value); } }; }
function showSaveStatus(state, msg) { const el = document.getElementById('save-indicator'); el.style.visibility = 'visible'; el.className = 'save-indicator ' + state; el.textContent = msg; }
function hideSaveStatusSoon(delay = 3000) { setTimeout(() => { const el = document.getElementById('save-indicator'); if(el) el.style.visibility = 'hidden'; }, delay); }
function isRemoteStorageMode(){ return !!(window.appAuth && typeof window.appAuth.getMode === 'function' && window.appAuth.getMode() === 'remote'); }
function isInteractionOverlayOpen(){ return ['modal-overlay','samples-overlay','actions-overlay','test-select-overlay','test-edit-overlay'].some(id => document.getElementById(id)?.classList.contains('open')); }
function rememberLoadedState(woRaw, scheduleRaw){ lastLoadedWorkOrdersRaw = typeof woRaw === 'string' ? woRaw : ''; lastLoadedScheduleRaw = typeof scheduleRaw === 'string' ? scheduleRaw : ''; }
async function saveData() { const storageAdapter = getStorageAdapter(); clearTimeout(saveTimer); saveTimer = null; showSaveStatus('saving', 'SAVING...'); try { normalizeScheduleState(); const woRaw = JSON.stringify(WOs); const scheduleRaw = JSON.stringify(scheduleState); await Promise.all([ storageAdapter.set(STORAGE_KEY, woRaw), storageAdapter.set(SCHEDULE_STORAGE_KEY, scheduleRaw) ]); rememberLoadedState(woRaw, scheduleRaw); showSaveStatus('saved', 'SAVED'); hideSaveStatusSoon(); } catch (e) { showSaveStatus('error', 'SAVE FAILED'); console.error('Storage save error:', e); } }
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveData, 600); }
async function loadData(options = {}) { const silent = !!options.silent; let loadedWOs = false; let loadedSchedule = false; let changed = false; try { const storageAdapter = getStorageAdapter(); const [woResult, scheduleResult] = await Promise.all([ storageAdapter.get(STORAGE_KEY), storageAdapter.get(SCHEDULE_STORAGE_KEY) ]); const woRaw = typeof woResult?.value === 'string' ? woResult.value : ''; const scheduleRaw = typeof scheduleResult?.value === 'string' ? scheduleResult.value : ''; if(woRaw === lastLoadedWorkOrdersRaw && scheduleRaw === lastLoadedScheduleRaw) return false; if(woRaw) { const parsed = JSON.parse(woRaw); if (Array.isArray(parsed)) { WOs = normalizeWorkOrders(parsed); loadedWOs = true; changed = true; } else if(parsed && Array.isArray(parsed.workOrders)) { WOs = normalizeWorkOrders(parsed.workOrders); loadedWOs = true; changed = true; } } else if(lastLoadedWorkOrdersRaw !== '') { WOs = []; changed = true; } if (scheduleRaw) { const parsedSchedule = JSON.parse(scheduleRaw); if(parsedSchedule && typeof parsedSchedule === 'object') { scheduleState = { date: parsedSchedule.date || todayISO(), employees: Array.isArray(parsedSchedule.employees) ? parsedSchedule.employees : [], entries: Array.isArray(parsedSchedule.entries) ? parsedSchedule.entries : [], tasks: Array.isArray(parsedSchedule.tasks) ? parsedSchedule.tasks : [] }; loadedSchedule = true; changed = true; } } else if(lastLoadedScheduleRaw !== '') { scheduleState = {date:todayISO(),employees:[],entries:[],tasks:[]}; changed = true; } normalizeScheduleState(); rememberLoadedState(woRaw, scheduleRaw); if (changed) { render(); renderSchedule(); if (!silent) { showSaveStatus('loaded', `${WOs.length} WOs | ${scheduleState.entries.length} scheduled`); hideSaveStatusSoon(); } } } catch (e) { console.log('No saved data found.'); } return changed || loadedWOs || loadedSchedule; }
async function refreshFromSharedStorage(){ if(!isRemoteStorageMode() || document.hidden || saveTimer || isInteractionOverlayOpen() || autoRefreshInFlight) return; autoRefreshInFlight = true; try { const changed = await loadData({ silent:true }); if(changed){ showSaveStatus('loaded', 'SYNCED'); hideSaveStatusSoon(1800); } } finally { autoRefreshInFlight = false; } }
function stopAutoRefresh(){ if(autoRefreshTimer){ clearInterval(autoRefreshTimer); autoRefreshTimer = null; } }
function startAutoRefresh(){ stopAutoRefresh(); if(!isRemoteStorageMode()) return; autoRefreshTimer = setInterval(() => { refreshFromSharedStorage(); }, AUTO_REFRESH_MS); }
document.addEventListener('visibilitychange', () => { if(!document.hidden) refreshFromSharedStorage(); });
const _origToggleDone = toggleDone; toggleDone = function(id) { _origToggleDone(id); scheduleSave(); };
const _origSaveWO = saveWO; saveWO = function() { if(_origSaveWO()) scheduleSave(); };
const _origDeleteWO = deleteWO; deleteWO = function() { if(!editId)return;
if(!confirm('Delete this work order? This cannot be undone.'))return; WOs=WOs.filter(w=>w.id!==editId); closeModal();render(); scheduleSave(); };
(async function init() { initColumnVisibility(); renderColumnSelector(); await (window.authReadyPromise || Promise.resolve()); await loadData(); render(); renderSchedule(); switchView('queue'); startAutoRefresh(); refreshFromSharedStorage();
})();

