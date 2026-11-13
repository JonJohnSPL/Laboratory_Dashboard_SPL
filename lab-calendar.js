/* The calendar is an overview of WO deadlines; it does not change daily schedules. */
let labCalendarView = 'month';
let labCalendarAnchor = new Date();

function labCalendarISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getLabCalendarDates(anchor, view) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), view === 'month' ? 1 : anchor.getDate());
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  const end = view === 'month' ? new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0) : new Date(start);
  if (view === 'month') end.setDate(end.getDate() + (7 - end.getDay()) % 7);
  else end.setDate(end.getDate() + 4);
  const dates = [];
  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) dates.push(new Date(day));
  return dates;
}

function setLabCalendarView(view) {
  labCalendarView = view === 'work_week' ? 'work_week' : 'month';
  renderLabCalendar();
}

function moveLabCalendar(direction) {
  if (labCalendarView === 'month') labCalendarAnchor = new Date(labCalendarAnchor.getFullYear(), labCalendarAnchor.getMonth() + direction, 1);
  else labCalendarAnchor.setDate(labCalendarAnchor.getDate() + direction * 7);
  renderLabCalendar();
}

function resetLabCalendar() {
  labCalendarAnchor = new Date();
  renderLabCalendar();
}

function renderLabCalendarCard(wo, today) {
  const due = window.LabWipDates.iso(wo.dueDate);
  const conflict = window.LabWipDates.datesForWorkOrder(wo).length > 1;
  const samples = new Set([...(wo.samples || []), ...(wo.testRows || [])].map(row => row.sampleId).filter(Boolean)).size;
  const priority = Object.hasOwn(PRI, wo.priority) ? wo.priority : 'NONE';
  return `<button type="button" class="lab-calendar-card${due && due < today ? ' is-overdue' : ''}" data-wo-id="${esc(wo.id)}">
    <span class="lab-calendar-card-title">WO ${esc(wo.number)}</span>
    <span>${esc(getWorkOrderClientLabel(wo))}</span>
    <span class="lab-calendar-meta">${samples} sample(s) · ${esc(priority)}</span>
    <span class="lab-calendar-due lab-calendar-meta">Due ${esc(fmtDate(wo.dueDate) || 'not set')}</span>
    ${due && due < today ? '<span class="lab-calendar-alert">Overdue</span>' : ''}
    ${conflict ? '<span class="lab-calendar-alert">Conflicting source due dates</span>' : ''}
  </button>`;
}

function renderLabCalendar() {
  const board = document.getElementById('lab-calendar-board');
  if (!board) return;
  const today = labCalendarISO(new Date());
  const dates = getLabCalendarDates(labCalendarAnchor, labCalendarView);
  const search = document.getElementById('lab-calendar-search').value.trim().toLowerCase();
  const priority = document.getElementById('lab-calendar-priority').value;
  const open = WOs.filter(wo => wo.stage === WO_STAGE.RUNNING && !isFullySubcontractedWO(wo));
  const visible = open.filter(wo => (priority === 'all' || (wo.priority || 'NONE') === priority) &&
    (!search || `${wo.number} ${getWorkOrderClientLabel(wo)}`.toLowerCase().includes(search)))
    .sort((a, b) => (PRI[a.priority] ?? 4) - (PRI[b.priority] ?? 4) || String(a.number).localeCompare(String(b.number)));
  const byDate = new Map();
  for (const wo of visible) {
    const key = window.LabWipDates.iso(wo.dueDate);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(wo);
  }
  const shortDate = date => date.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
  const period = labCalendarView === 'month' ? labCalendarAnchor.toLocaleDateString('en-US', {month:'long', year:'numeric'}) : `${shortDate(dates[0])} – ${shortDate(dates[4])}`;
  document.getElementById('lab-calendar-period').textContent = period;
  for (const view of ['month', 'work_week']) {
    const button = document.getElementById(`lab-calendar-${view}`);
    button.classList.toggle('active', labCalendarView === view);
    button.setAttribute('aria-pressed', String(labCalendarView === view));
  }
  const inPeriod = dates.reduce((sum, day) => sum + (byDate.get(labCalendarISO(day)) || []).length, 0);
  const overdue = visible.filter(wo => { const due = window.LabWipDates.iso(wo.dueDate); return due && due < today; });
  document.getElementById('lab-calendar-summary').textContent = `${inPeriod} WOs in view · ${visible.length} matching open WOs · ${overdue.length} overdue · ${(byDate.get('') || []).length} without a valid due date${labCalendarView === 'work_week' ? ' · Weekend deadlines appear in Month view' : ''}`;
  const conflicts = open.filter(wo => window.LabWipDates.datesForWorkOrder(wo).length > 1);
  const warning = document.getElementById('lab-calendar-warning');
  warning.hidden = conflicts.length === 0;
  warning.textContent = conflicts.length ? `${conflicts.length} open WO(s) have conflicting source due dates: ${conflicts.map(wo => `${wo.number} (${window.LabWipDates.datesForWorkOrder(wo).join(', ')})`).join('; ')}. Calendar placement uses the recorded WO due date. Correct the source before reimporting.` : '';
  board.className = `lab-calendar-board ${labCalendarView === 'month' ? 'is-month' : 'is-work-week'}`;
  const weekdays = labCalendarView === 'month' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : ['Mon','Tue','Wed','Thu','Fri'];
  board.innerHTML = weekdays.map(day => `<div class="lab-calendar-weekday">${day}</div>`).join('') + dates.map(day => {
    const key = labCalendarISO(day);
    const wos = byDate.get(key) || [];
    const outside = labCalendarView === 'month' && day.getMonth() !== labCalendarAnchor.getMonth();
    return `<section class="lab-calendar-day${outside ? ' outside-month' : ''}${key === today ? ' is-today' : ''}" aria-label="${esc(shortDate(day))}">
      <div class="lab-calendar-day-head"><time datetime="${key}"${key === today ? ' aria-current="date"' : ''}>${day.getDate()}${key === today ? ' · Today' : ''}</time><span>${wos.length ? `${wos.length} WO` : ''}</span></div>
      <div class="lab-calendar-cards">${wos.map(wo => renderLabCalendarCard(wo, today)).join('') || '<span class="lab-calendar-empty">No deadlines</span>'}</div>
    </section>`;
  }).join('');
  document.getElementById('lab-calendar-undated').innerHTML = (byDate.get('') || []).map(wo => renderLabCalendarCard(wo, today)).join('');
  document.getElementById('lab-calendar-undated-section').hidden = !(byDate.get('') || []).length;
  document.getElementById('lab-calendar-overdue').innerHTML = overdue.map(wo => renderLabCalendarCard(wo, today)).join('');
  document.getElementById('lab-calendar-overdue-section').hidden = !overdue.length;
}

document.getElementById('calendar-screen').addEventListener('click', event => {
  const card = event.target.closest('[data-wo-id]');
  if (card) openModal(card.dataset.woId);
});
