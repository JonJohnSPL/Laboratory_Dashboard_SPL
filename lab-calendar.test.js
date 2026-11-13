/* Browser integration checks loaded by lab-calendar-smoke.py into a local fixture. */
(async () => {
  const result = document.createElement('pre');
  result.id = 'smoke-result';
  document.body.append(result);
  const failures = [];
  window.addEventListener('error', event => failures.push(event.message));
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const cards = selector => document.querySelectorAll(selector);
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    WOs = [
      {id:'due',number:'1001',client:'Calendar Client',dueDate:'2026-11-13',priority:'HIGH',stage:'running',samples:[{sampleId:'001'}]},
      {id:'conflict',number:'1002',client:'Other Client',dueDate:'2026-11-20',priority:'LOW',stage:'running',samples:[{sampleId:'001',dueDate:'11/21/26'}]},
      {id:'pending',number:'2001',dueDate:'2026-11-13',stage:'pending'},
      {id:'done',number:'2002',dueDate:'2026-11-13',stage:'done'},
      {id:'undated',number:'1003',client:'No Date Client',stage:'running'},
      {id:'weekend',number:'1004',client:'Weekend Client',dueDate:'2026-11-14',stage:'running'},
      {id:'sub',number:'2003',dueDate:'2026-11-13',stage:'running',testRows:[{id:'r1',sampleId:'001',testCode:'C6GAS'}],subcontractedTests:[{rowKey:'r1',labId:'outside'}]}
    ].map(normalizeWorkOrder);
    labCalendarAnchor = new Date(2026,10,13);
    switchView('calendar');
    check(document.getElementById('calendar-screen').classList.contains('active'), 'Calendar tab');
    check(cards('#lab-calendar-board [data-wo-id="due"]').length === 1, 'One card per WO due date');
    for (const id of ['pending','done','sub']) check(!cards(`#calendar-screen [data-wo-id="${id}"]`).length, `Exclude ${id}`);
    check(!document.getElementById('lab-calendar-warning').hidden, 'Conflict warning');
    check(document.getElementById('lab-calendar-warning').textContent.includes('2026-11-21'), 'Conflict dates');
    check(!document.getElementById('lab-calendar-undated-section').hidden, 'Undated WO visibility');
    cards('#lab-calendar-board [data-wo-id="due"]')[0].click();
    check(document.getElementById('modal-overlay').classList.contains('open'), 'Original modal opens');
    check(document.getElementById('modal-title').textContent === 'WO 1001', 'Correct WO modal');
    closeModal();
    document.getElementById('lab-calendar-work_week').click();
    check(cards('.lab-calendar-day').length === 5, 'Five work-week days');
    check(document.getElementById('lab-calendar-period').textContent.includes('Nov 9, 2026'), 'Monday start');
    check(!cards('#lab-calendar-board [data-wo-id="weekend"]').length, 'Work week excludes weekend');
    document.getElementById('lab-calendar-search').value = 'Calendar Client';
    document.getElementById('lab-calendar-search').dispatchEvent(new Event('input'));
    check(cards('#lab-calendar-board .lab-calendar-card').length === 1, 'Client search');
    document.getElementById('lab-calendar-search').value = '';
    document.getElementById('lab-calendar-priority').value = 'LOW';
    document.getElementById('lab-calendar-priority').dispatchEvent(new Event('change'));
    check(!cards('#lab-calendar-board .lab-calendar-card').length, 'Priority filter');
    document.getElementById('lab-calendar-priority').value = 'all';
    setLabCalendarView('month');
    check(cards('#lab-calendar-board [data-wo-id="weekend"]').length === 1, 'Month includes weekend');
    check(getLabCalendarDates(new Date(2024,1,29),'month').some(d => labCalendarISO(d) === '2024-02-29'), 'Leap day');
    check(getLabCalendarDates(new Date(2026,2,9),'work_week').map(labCalendarISO).join(',') === '2026-03-09,2026-03-10,2026-03-11,2026-03-12,2026-03-13', 'DST week');
    labCalendarAnchor = new Date(2026,0,31);
    moveLabCalendar(1);
    check(document.getElementById('lab-calendar-period').textContent === 'February 2026', 'Month boundary navigation');
    labCalendarAnchor = new Date(2026,11,1);
    moveLabCalendar(1);
    check(document.getElementById('lab-calendar-period').textContent === 'January 2027', 'Year boundary navigation');
    resetLabCalendar();
    check(labCalendarISO(labCalendarAnchor) === labCalendarISO(new Date()), 'Today navigation');
    labCalendarAnchor = new Date(2026,10,13);
    openModal('due');
    document.getElementById('f-notes').value = 'Browser smoke check';
    saveWO();
    check(WOs.find(w => w.id === 'due').notes === 'Browser smoke check', 'Original modal save');
    WOs.find(w => w.id === 'due').stage = 'pending';
    render();
    check(!cards('#lab-calendar-board [data-wo-id="due"]').length, 'Stage change refresh');
    for (const name of ['queue','pending','schedule']) {
      switchView(name);
      check(document.getElementById(`${name}-screen`).classList.contains('active'), `Existing ${name} tab`);
    }
    const frame = document.createElement('iframe');
    frame.hidden = true;
    const loaded = new Promise(resolve => frame.onload = resolve);
    frame.src = '__IMPORT_FIXTURE__';
    document.body.append(frame);
    await loaded;
    const importer = frame.contentWindow;
    const header = 'Work Order,Test Code,Sample,Due Date,Client Code\n';
    const valid = header + '123,C6GAS,001,11/13/26,TEST\n123,C6GAS,002,2026-11-13,TEST\n';
    const imported = await importer.buildWOsFromSureChemCSV(valid);
    const wo = imported.workOrders[0];
    check(wo.dueDate === '2026-11-13', 'Canonical imported WO due date');
    check([...wo.samples, ...wo.testRows].every(row => row.dueDate === wo.dueDate), 'All samples inherit WO deadline');
    let rejected = false;
    try { await importer.buildWOsFromSureChemCSV(valid + '123,C6GAS,003,11/20/26,TEST\n'); }
    catch (error) { rejected = error.message.includes('WO 123: 2026-11-13, 2026-11-20') && error.message.includes('No data was saved'); }
    check(rejected, 'Reject conflicting import before storage');
    check(LabWipDates.iso('2026-02-30') === '', 'Invalid calendar date');
    let invalidRejected = false;
    try { await importer.buildWOsFromSureChemCSV(header + '123,C6GAS,001,2/30/26,TEST\n'); }
    catch (error) { invalidRejected = error.message.includes('invalid due date'); }
    check(invalidRejected, 'Reject impossible imported date');
    check(!failures.length, failures.join('; '));
    switchView('calendar');
    result.textContent = 'PASS: calendar views, filters, original modal and save, stage exclusions, date navigation, leap day, DST, original tabs, import deadline normalization and conflict rejection.';
  } catch (error) {
    result.textContent = `FAIL: ${error.stack}`;
  }
})();
