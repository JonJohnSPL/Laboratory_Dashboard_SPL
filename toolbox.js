(function () {
  'use strict';

  const TOOL_DEFINITIONS = [
    {
      id: 'sample-scheduler',
      name: 'Sample Scheduler',
      description: 'Build a personal daily equipment schedule from a sample queue.',
      url: 'sample-scheduler.html',
      featureKey: 'lab.toolbox.sample_scheduler',
      scopeLabel: 'Lab tool',
      icon: 'SS'
    }
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character];
    });
  }

  function tickClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', {
      hour:'2-digit', minute:'2-digit', second:'2-digit'
    });
    document.getElementById('datedisp').textContent = now.toLocaleDateString('en-US', {
      weekday:'short', month:'short', day:'numeric', year:'numeric'
    });
    window.setTimeout(tickClock, 1000);
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

  function renderTools() {
    const tools = TOOL_DEFINITIONS.filter(function (tool) {
      return !!(window.appAuth && window.appAuth.hasFeature && window.appAuth.hasFeature(tool.featureKey));
    });
    const grid = document.getElementById('tool-grid');
    if (!tools.length) {
      grid.innerHTML = '<div class="empty-tools">Your SPL login is active, but no Toolbox apps have been enabled for your employee profile.</div>';
      return;
    }
    grid.innerHTML = tools.map(function (tool) {
      return '<a class="tool-card" href="' + escapeHtml(tool.url) + '" target="_blank" rel="noopener" aria-label="Open ' + escapeHtml(tool.name) + ' in a new tab">' +
        '<div><div class="tool-icon" aria-hidden="true">' + escapeHtml(tool.icon) + '</div>' +
        '<h3>' + escapeHtml(tool.name) + '</h3><p>' + escapeHtml(tool.description) + '</p></div>' +
        '<div class="tool-meta"><span>' + escapeHtml(tool.scopeLabel) + '</span><strong>Open tool &nearr;</strong></div></a>';
    }).join('');
  }

  async function init() {
    tickClock();
    await (window.authReadyPromise || Promise.resolve());
    const remote = window.appAuth && window.appAuth.getMode && window.appAuth.getMode() === 'remote';
    const user = window.appAuth && window.appAuth.getUser ? window.appAuth.getUser() : null;
    if (!remote || !user) {
      deny('Toolbox requires an authenticated SPL employee account. Remote sign-in is not available.');
      return;
    }
    if (!isEnabledEmployee()) {
      deny('This login is not linked to an active SPL employee profile. Contact a dashboard administrator.');
      return;
    }
    document.getElementById('access-message').hidden = true;
    document.getElementById('toolbox-content').hidden = false;
    renderTools();
  }

  init();
})();
