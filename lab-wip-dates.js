/* Date-only helpers shared by the WIP calendar and CSV importer. */
window.LabWipDates = {
  iso(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    if (!iso && !us) return '';
    let year = Number(iso ? iso[1] : us[3]);
    if (year < 100) year += year < 50 ? 2000 : 1900;
    const month = Number(iso ? iso[2] : us[1]);
    const day = Number(iso ? iso[3] : us[2]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return '';
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  },
  datesForWorkOrder(wo) {
    return [...new Set([wo.dueDate, ...(wo.samples || []).map(row => row.dueDate),
      ...(wo.testRows || []).map(row => row.dueDate)].map(value => this.iso(value)).filter(Boolean))].sort();
  }
};
