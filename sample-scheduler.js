(function () {
  'use strict';

  const FEATURE_KEY = 'lab.toolbox.sample_scheduler';
  const STORAGE_PREFIX = 'spl.toolbox.sample-scheduler.v1:';
  const START_MINS = 0;
  const END_MINS = 24 * 60;
  const DEFAULT_VIEW_MINS = 8 * 60;
  const INTERVAL = 10;
  const DURATION_INTERVAL = 5;
  const SLOT_HEIGHT = 64;
  const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4'];

  let storageKey = '';
  let errorTimer = 0;
  let dragId = '';
  let resizeState = null;
  let state = createDefaultState();

  function createDefaultState() {
    return {
      categories: [
        { id:'cat_1', name:'Microbiology', color:DEFAULT_COLORS[0] },
        { id:'cat_2', name:'Chemistry', color:DEFAULT_COLORS[1] },
        { id:'cat_3', name:'Urgent Processing', color:DEFAULT_COLORS[4] }
      ],
      resources: [
        { id:'res_1', name:'Centrifuge A' },
        { id:'res_2', name:'Centrifuge B' },
        { id:'res_3', name:'Microscope 1' }
      ],
      queue: [],
      scheduled: [],
      selectedId: '',
      manageEquipment: false,
      manageCategories: false
    };
  }

  function makeId(prefix) {
    const value = window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    return prefix + '_' + value;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character];
    });
  }

  function formatTime(mins) {
    const hour = Math.floor(mins / 60);
    const minute = mins % 60;
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return displayHour + ':' + String(minute).padStart(2, '0') + ' ' + (hour >= 12 ? 'PM' : 'AM');
  }

  function categoryStyle(categoryId) {
    const category = state.categories.find(function (item) { return item.id === categoryId; });
    const color = category && category.color ? category.color : DEFAULT_COLORS[0];
    return '--sample-border:' + color + ';--sample-bg:color-mix(in srgb,' + color + ' 24%,#13161e);--sample-text:#f8fafc;';
  }

  function categoryName(categoryId) {
    const category = state.categories.find(function (item) { return item.id === categoryId; });
    return category ? category.name : 'Unknown';
  }

  function validStoredState(value) {
    if (!value || !Array.isArray(value.categories) || !Array.isArray(value.resources) ||
        !Array.isArray(value.queue) || !Array.isArray(value.scheduled) || !value.resources.length) {
      return null;
    }
    return {
      categories: (value.categories.length ? value.categories : createDefaultState().categories).map(function (category, index) {
        return Object.assign({}, category, { color:category.color || DEFAULT_COLORS[Number(category.colorIdx) % DEFAULT_COLORS.length] || DEFAULT_COLORS[index % DEFAULT_COLORS.length] });
      }),
      resources: value.resources,
      queue: value.queue,
      scheduled: value.scheduled,
      selectedId: '',
      manageEquipment: false,
      manageCategories: false
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || 'null');
      state = validStoredState(parsed) || createDefaultState();
    } catch (error) {
      console.warn('Unable to load Sample Scheduler state:', error);
      state = createDefaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        categories: state.categories,
        resources: state.resources,
        queue: state.queue,
        scheduled: state.scheduled
      }));
    } catch (error) {
      showError('Unable to save this schedule in the browser.');
      console.error(error);
    }
  }

  function showError(message) {
    const toast = document.getElementById('error-toast');
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(errorTimer);
    errorTimer = window.setTimeout(function () { toast.hidden = true; }, 3200);
  }

  function isEnabledEmployee() {
    if (window.appAuth && window.appAuth.isAdmin && window.appAuth.isAdmin()) return true;
    const profile = window.appAuth && window.appAuth.getProfile ? window.appAuth.getProfile() : null;
    const employee = window.appAuth && window.appAuth.getEmployee ? window.appAuth.getEmployee() : null;
    return !!(profile && employee && profile.accessRole === 'employee' &&
      profile.isActive !== false && profile.portalEnabled === true && employee.isActive !== false);
  }

  function deny(message) {
    const node = document.getElementById('access-message');
    node.className = 'access-message error';
    node.textContent = message;
  }

  function render() {
    renderManagement();
    renderCategoryOptions();
    renderQueue();
    renderSchedule();
  }

  function renderManagement() {
    const equipmentPanel = document.getElementById('equipment-panel');
    const categoryPanel = document.getElementById('categories-panel');
    equipmentPanel.hidden = !state.manageEquipment;
    categoryPanel.hidden = !state.manageCategories;
    document.getElementById('manage-equipment').classList.toggle('active', state.manageEquipment);
    document.getElementById('manage-categories').classList.toggle('active', state.manageCategories);

    document.getElementById('equipment-list').innerHTML = state.resources.map(function (resource) {
      return '<div class="manage-row resource"><input type="text" maxlength="60" data-resource-name="' +
        escapeHtml(resource.id) + '" value="' + escapeHtml(resource.name) + '" aria-label="Equipment name">' +
        '<button type="button" class="delete-btn" data-delete-resource="' + escapeHtml(resource.id) + '">Delete</button></div>';
    }).join('');

    document.getElementById('category-list').innerHTML = state.categories.map(function (category) {
      const color = category.color || DEFAULT_COLORS[0];
      return '<div class="manage-row"><input type="color" class="category-color" data-category-color="' + escapeHtml(category.id) +
        '" value="' + escapeHtml(color) + '" style="background:' + escapeHtml(color) + ';border-color:' + escapeHtml(color) + '" title="Choose category color" aria-label="Choose color for ' + escapeHtml(category.name) + '">' +
        '<input type="text" maxlength="60" data-category-name="' + escapeHtml(category.id) + '" value="' +
        escapeHtml(category.name) + '" aria-label="Category name"></div>';
    }).join('');
  }

  function renderCategoryOptions() {
    const select = document.getElementById('sample-category');
    const previous = select.value;
    select.innerHTML = state.categories.map(function (category) {
      return '<option value="' + escapeHtml(category.id) + '">' + escapeHtml(category.name) + '</option>';
    }).join('');
    if (state.categories.some(function (category) { return category.id === previous; })) select.value = previous;
  }

  function renderQueue() {
    document.getElementById('queue-count').textContent = state.queue.length;
    const list = document.getElementById('queue-list');
    if (!state.queue.length) {
      list.innerHTML = '<div class="queue-empty">Queue is empty. Add a sample above to begin.</div>';
      return;
    }
    list.innerHTML = state.queue.map(function (sample) {
      const selected = state.selectedId === sample.id ? ' selected' : '';
      return '<article class="sample-card' + selected + '" style="' + categoryStyle(sample.categoryId) + '" draggable="true" tabindex="0" data-queue-id="' +
        escapeHtml(sample.id) + '"><div class="sample-head"><div class="sample-name">' + escapeHtml(sample.name) +
        '</div><button type="button" class="sample-delete" data-delete-sample="' + escapeHtml(sample.id) +
        '" title="Delete sample" aria-label="Delete ' + escapeHtml(sample.name) + '">&times;</button></div>' +
        '<div class="sample-meta"><span>' + sample.duration + ' min</span><span>' +
        escapeHtml(categoryName(sample.categoryId)) + '</span></div></article>';
    }).join('');
  }

  function renderSchedule() {
    const grid = document.getElementById('schedule-grid');
    grid.style.gridTemplateColumns = '86px repeat(' + state.resources.length + ', minmax(220px, 1fr))';
    let timeHtml = '<div class="time-column"><div class="column-header">Time</div>';
    for (let mins = START_MINS; mins < END_MINS; mins += INTERVAL) {
      timeHtml += '<div class="time-slot">' + escapeHtml(formatTime(mins)) + '</div>';
    }
    timeHtml += '</div>';

    const resourceHtml = state.resources.map(function (resource) {
      let slots = '';
      for (let mins = START_MINS; mins < END_MINS; mins += INTERVAL) {
        slots += '<div class="schedule-slot' + (state.selectedId ? ' assignable' : '') +
          '" tabindex="0" role="button" aria-label="' + escapeHtml(resource.name + ' at ' + formatTime(mins)) +
          '" data-resource-id="' + escapeHtml(resource.id) + '" data-start-mins="' + mins + '"></div>';
      }
      const events = state.scheduled.filter(function (sample) {
        return sample.resourceId === resource.id;
      }).map(function (sample) {
        const top = ((sample.startMins - START_MINS) / INTERVAL) * SLOT_HEIGHT;
        const height = (sample.duration / INTERVAL) * SLOT_HEIGHT;
        return '<article class="scheduled-event" style="' + categoryStyle(sample.categoryId) + 'top:' + top + 'px;height:' + height + 'px" draggable="true" data-scheduled-id="' +
          escapeHtml(sample.id) + '">' +
          '<div class="sample-name">' + escapeHtml(sample.name) + '</div>' +
          '<button type="button" class="event-remove" data-unschedule="' + escapeHtml(sample.id) +
          '" title="Return to queue" aria-label="Return ' + escapeHtml(sample.name) + ' to queue">&times;</button>' +
          '<div class="event-time">' + escapeHtml(formatTime(sample.startMins)) + ' - ' +
          escapeHtml(formatTime(sample.startMins + sample.duration)) + ' (' + sample.duration + 'm)</div>' +
          '<div class="resize-handle" data-resize-id="' + escapeHtml(sample.id) + '" title="Drag to resize"></div></article>';
      }).join('');
      return '<section class="resource-column"><div class="column-header">' + escapeHtml(resource.name) +
        '</div><div class="resource-body">' + slots + events + '</div></section>';
    }).join('');
    grid.innerHTML = timeHtml + resourceHtml;
  }

  function findSample(id) {
    return state.queue.find(function (sample) { return sample.id === id; }) ||
      state.scheduled.find(function (sample) { return sample.id === id; });
  }

  function attemptAssignment(sampleId, startMins, resourceId) {
    const sample = findSample(sampleId);
    if (!sample) return false;
    const endMins = startMins + Number(sample.duration);
    if (endMins > END_MINS) {
      showError('Sample duration exceeds the 6:00 PM schedule end time.');
      return false;
    }
    const overlaps = state.scheduled.some(function (existing) {
      if (existing.id === sampleId || existing.resourceId !== resourceId) return false;
      return startMins < existing.startMins + existing.duration && endMins > existing.startMins;
    });
    if (overlaps) {
      showError('That time overlaps another sample on this equipment.');
      return false;
    }
    state.queue = state.queue.filter(function (item) { return item.id !== sampleId; });
    state.scheduled = state.scheduled.filter(function (item) { return item.id !== sampleId; });
    state.scheduled.push(Object.assign({}, sample, { startMins:startMins, resourceId:resourceId }));
    state.selectedId = '';
    saveState();
    render();
    return true;
  }

  function unschedule(id) {
    const sample = state.scheduled.find(function (item) { return item.id === id; });
    if (!sample) return;
    state.scheduled = state.scheduled.filter(function (item) { return item.id !== id; });
    state.queue.push({ id:sample.id, name:sample.name, duration:sample.duration, categoryId:sample.categoryId });
    saveState();
    render();
  }

  function deleteResource(id) {
    if (state.resources.length <= 1) {
      showError('You must keep at least one equipment column.');
      return;
    }
    const moved = state.scheduled.filter(function (sample) { return sample.resourceId === id; })
      .map(function (sample) {
        return { id:sample.id, name:sample.name, duration:sample.duration, categoryId:sample.categoryId };
      });
    state.queue = state.queue.concat(moved);
    state.scheduled = state.scheduled.filter(function (sample) { return sample.resourceId !== id; });
    state.resources = state.resources.filter(function (resource) { return resource.id !== id; });
    saveState();
    render();
  }

  function startResize(event, id) {
    const sample = state.scheduled.find(function (item) { return item.id === id; });
    if (!sample) return;
    event.preventDefault();
    event.stopPropagation();
    let maxDuration = END_MINS - sample.startMins;
    state.scheduled.forEach(function (other) {
      if (other.id !== sample.id && other.resourceId === sample.resourceId && other.startMins > sample.startMins) {
        maxDuration = Math.min(maxDuration, other.startMins - sample.startMins);
      }
    });
    resizeState = {
      id:id, startY:event.clientY, startDuration:sample.duration,
      maxDuration:maxDuration, element:event.target.closest('.scheduled-event')
    };
  }

  function onResizeMove(event) {
    if (!resizeState) return;
    const intervals = Math.round((event.clientY - resizeState.startY) / (SLOT_HEIGHT * DURATION_INTERVAL / INTERVAL));
    const duration = Math.max(DURATION_INTERVAL, Math.min(resizeState.maxDuration, resizeState.startDuration + intervals * DURATION_INTERVAL));
    const sample = state.scheduled.find(function (item) { return item.id === resizeState.id; });
    if (!sample || sample.duration === duration) return;
    sample.duration = duration;
    if (resizeState.element) resizeState.element.style.height = (duration / INTERVAL * SLOT_HEIGHT) + 'px';
  }

  function finishResize() {
    if (!resizeState) return;
    resizeState = null;
    saveState();
    render();
  }

  function bindEvents() {
    document.getElementById('sample-form').addEventListener('submit', function (event) {
      event.preventDefault();
      const nameInput = document.getElementById('sample-name');
      const name = nameInput.value.trim();
      if (!name) return;
      state.queue.push({
        id:makeId('sample'), name:name,
        duration:Number(document.getElementById('sample-duration').value),
        categoryId:document.getElementById('sample-category').value || state.categories[0].id
      });
      nameInput.value = '';
      document.getElementById('sample-duration').value = '15';
      saveState();
      render();
    });

    document.getElementById('manage-equipment').addEventListener('click', function () {
      state.manageEquipment = !state.manageEquipment;
      state.manageCategories = false;
      renderManagement();
    });
    document.getElementById('manage-categories').addEventListener('click', function () {
      state.manageCategories = !state.manageCategories;
      state.manageEquipment = false;
      renderManagement();
    });
    document.getElementById('add-equipment').addEventListener('click', function () {
      state.resources.push({ id:makeId('res'), name:'New Equipment' });
      saveState();
      render();
    });
    document.getElementById('add-category').addEventListener('click', function () {
      state.categories.push({ id:makeId('cat'), name:'New Category', color:DEFAULT_COLORS[state.categories.length % DEFAULT_COLORS.length] });
      saveState();
      render();
    });
    document.getElementById('equipment-list').addEventListener('input', function (event) {
      const id = event.target.getAttribute('data-resource-name');
      if (!id) return;
      const resource = state.resources.find(function (item) { return item.id === id; });
      if (resource) { resource.name = event.target.value; saveState(); renderSchedule(); }
    });
    document.getElementById('equipment-list').addEventListener('click', function (event) {
      const id = event.target.getAttribute('data-delete-resource');
      if (id) deleteResource(id);
    });
    document.getElementById('category-list').addEventListener('input', function (event) {
      const id = event.target.getAttribute('data-category-name');
      if (!id) return;
      const category = state.categories.find(function (item) { return item.id === id; });
      if (category) { category.name = event.target.value; saveState(); renderCategoryOptions(); renderQueue(); renderSchedule(); }
    });
    document.getElementById('category-list').addEventListener('input', function (event) {
      const id = event.target.getAttribute('data-category-color');
      if (!id) return;
      const category = state.categories.find(function (item) { return item.id === id; });
      if (category) {
        category.color = event.target.value;
        event.target.style.background = category.color;
        event.target.style.borderColor = category.color;
        saveState();
        renderQueue();
        renderSchedule();
      }
    });

    document.getElementById('queue-list').addEventListener('click', function (event) {
      const deleteId = event.target.getAttribute('data-delete-sample');
      if (deleteId) {
        event.stopPropagation();
        state.queue = state.queue.filter(function (sample) { return sample.id !== deleteId; });
        if (state.selectedId === deleteId) state.selectedId = '';
        saveState(); render(); return;
      }
      const card = event.target.closest('[data-queue-id]');
      if (card) {
        state.selectedId = state.selectedId === card.dataset.queueId ? '' : card.dataset.queueId;
        render();
      }
    });
    document.getElementById('queue-list').addEventListener('keydown', function (event) {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-queue-id]')) {
        event.preventDefault(); event.target.click();
      }
    });
    document.getElementById('queue-list').addEventListener('dragstart', function (event) {
      const card = event.target.closest('[data-queue-id]');
      if (!card) return;
      dragId = card.dataset.queueId;
      event.dataTransfer.setData('text/plain', dragId);
      event.dataTransfer.effectAllowed = 'move';
    });

    const grid = document.getElementById('schedule-grid');
    grid.addEventListener('dragstart', function (event) {
      if (resizeState) { event.preventDefault(); return; }
      const card = event.target.closest('[data-scheduled-id]');
      if (!card) return;
      dragId = card.dataset.scheduledId;
      event.dataTransfer.setData('text/plain', dragId);
      event.dataTransfer.effectAllowed = 'move';
    });
    grid.addEventListener('dragend', function () {
      dragId = '';
      grid.querySelectorAll('.drag-over').forEach(function (slot) { slot.classList.remove('drag-over'); });
    });
    grid.addEventListener('dragover', function (event) {
      const slot = event.target.closest('[data-start-mins]');
      if (!slot) return;
      event.preventDefault();
      grid.querySelectorAll('.drag-over').forEach(function (item) { item.classList.remove('drag-over'); });
      slot.classList.add('drag-over');
    });
    grid.addEventListener('dragleave', function (event) {
      const slot = event.target.closest('[data-start-mins]');
      if (slot) slot.classList.remove('drag-over');
    });
    grid.addEventListener('drop', function (event) {
      const slot = event.target.closest('[data-start-mins]');
      if (!slot) return;
      event.preventDefault();
      const id = event.dataTransfer.getData('text/plain') || dragId;
      attemptAssignment(id, Number(slot.dataset.startMins), slot.dataset.resourceId);
      dragId = '';
    });
    grid.addEventListener('click', function (event) {
      const removeId = event.target.getAttribute('data-unschedule');
      if (removeId) { event.stopPropagation(); unschedule(removeId); return; }
      const slot = event.target.closest('[data-start-mins]');
      if (slot && state.selectedId) attemptAssignment(state.selectedId, Number(slot.dataset.startMins), slot.dataset.resourceId);
    });
    grid.addEventListener('keydown', function (event) {
      const slot = event.target.closest('[data-start-mins]');
      if (slot && state.selectedId && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        attemptAssignment(state.selectedId, Number(slot.dataset.startMins), slot.dataset.resourceId);
      }
    });
    grid.addEventListener('pointerdown', function (event) {
      const id = event.target.getAttribute('data-resize-id');
      if (id) startResize(event, id);
    });
    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', finishResize);
  }

  async function init() {
    await (window.authReadyPromise || Promise.resolve());
    const remote = window.appAuth && window.appAuth.getMode && window.appAuth.getMode() === 'remote';
    const user = window.appAuth && window.appAuth.getUser ? window.appAuth.getUser() : null;
    if (!remote || !user) {
      deny('Sample Scheduler requires an authenticated SPL employee account. Remote sign-in is not available.');
      return;
    }
    if (!isEnabledEmployee()) {
      deny('This login is not linked to an active SPL employee profile.');
      return;
    }
    if (!(window.appAuth.hasFeature && window.appAuth.hasFeature(FEATURE_KEY))) {
      deny('Sample Scheduler has not been enabled for your employee profile. Ask a dashboard administrator for access.');
      return;
    }
    storageKey = STORAGE_PREFIX + user.id;
    loadState();
    bindEvents();
    render();
    document.getElementById('schedule-scroll').scrollTop =
      ((DEFAULT_VIEW_MINS - START_MINS) / INTERVAL) * SLOT_HEIGHT;
    document.getElementById('access-message').hidden = true;
    document.getElementById('scheduler-app').hidden = false;
  }

  init();
})();
