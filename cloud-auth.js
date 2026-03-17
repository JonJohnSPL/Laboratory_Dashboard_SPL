(function(){
  const SESSION_KEY = 'lab-wip-auth-session';
  const LOCAL_MODE_LABEL = 'Local browser mode';
  const state = {
    config: {},
    mode: 'local',
    session: null,
    user: null,
    ready: false,
    readyResolve: null,
    overlay: null,
    statusEl: null,
    formEl: null
  };

  const localAdapter = {
    get: async (key) => ({ value: localStorage.getItem(key) }),
    set: async (key, value) => { localStorage.setItem(key, value); }
  };

  window.storage = localAdapter;
  window.authReadyPromise = new Promise((resolve) => {
    state.readyResolve = resolve;
  });
  window.appAuth = {
    getMode: () => state.mode,
    getUser: () => state.user,
    signOut: () => signOut(),
    fetch: (path, options) => authorizedFetch(path, options),
    requestJson: (path, options) => requestJson(path, options)
  };

  init();

  async function init(){
    state.config = normalizeConfig(window.APP_CONFIG || {});
    injectStyles();
    await onDomReady();

    if(!isRemoteConfigured()){
      renderSessionControls();
      markReady();
      return;
    }

    state.mode = 'remote';
    window.storage = createRemoteAdapter();
    ensureOverlay();
    renderSessionControls();

    try {
      state.session = loadStoredSession();
      if(state.session){
        await ensureSession();
      }
      if(state.session){
        hideOverlay();
        renderSessionControls();
        markReady();
        return;
      }
    } catch (error){
      console.error('Session restore failed:', error);
      clearStoredSession();
    }

    showOverlay(state.config.authHelpText || 'Sign in to continue.');
  }

  function normalizeConfig(config){
    return {
      supabaseUrl: String(config.supabaseUrl || '').replace(/\/+$/, ''),
      supabaseAnonKey: String(config.supabaseAnonKey || ''),
      authEmailSuffix: String(config.authEmailSuffix || '').trim(),
      authTitle: String(config.authTitle || 'Lab WIP Dashboard'),
      authHelpText: String(config.authHelpText || 'Sign in to access the shared dashboard data.')
    };
  }

  function isRemoteConfigured(){
    return !!(state.config.supabaseUrl && state.config.supabaseAnonKey);
  }

  function markReady(){
    if(state.ready){
      return;
    }
    state.ready = true;
    document.body.classList.remove('app-auth-pending');
    state.readyResolve();
    window.dispatchEvent(new CustomEvent('app-auth-ready', {
      detail: { mode: state.mode, user: state.user }
    }));
  }

  function onDomReady(){
    if(document.readyState === 'loading'){
      return new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', resolve, { once:true });
      });
    }
    return Promise.resolve();
  }

  function injectStyles(){
    if(document.getElementById('lab-auth-style')){
      return;
    }

    const style = document.createElement('style');
    style.id = 'lab-auth-style';
    style.textContent = `
      body.app-auth-pending { overflow:hidden; }
      .session-controls { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
      .session-pill { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:999px; border:1px solid rgba(100,116,139,.25); background:rgba(19,22,30,.88); color:#e2e8f0; font-family:'Share Tech Mono',monospace; font-size:11px; letter-spacing:1px; text-transform:uppercase; }
      .session-pill.local { color:#94a3b8; }
      .session-pill.remote { color:#00d4ff; border-color:rgba(0,212,255,.22); }
      .session-signout { background:transparent; color:#64748b; border:1px solid rgba(100,116,139,.3); padding:7px 12px; border-radius:6px; cursor:pointer; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
      .session-signout:hover { color:#ff3860; border-color:rgba(255,56,96,.3); }
      .auth-overlay { position:fixed; inset:0; z-index:3000; display:none; align-items:center; justify-content:center; padding:20px; background:rgba(4,6,10,.82); backdrop-filter:blur(8px); }
      .auth-overlay.open { display:flex; }
      .auth-card { width:min(440px, 100%); border:1px solid rgba(42,47,63,.95); border-radius:18px; background:linear-gradient(180deg, rgba(19,22,30,.98), rgba(13,15,20,.98)); color:#e2e8f0; box-shadow:0 28px 60px rgba(0,0,0,.45); overflow:hidden; }
      .auth-card-head { padding:22px 24px 14px; border-bottom:1px solid rgba(42,47,63,.9); }
      .auth-kicker { color:#64748b; font-family:'Share Tech Mono',monospace; font-size:11px; letter-spacing:2px; text-transform:uppercase; }
      .auth-title { margin-top:8px; font-family:'Barlow Condensed',sans-serif; font-size:30px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#00d4ff; }
      .auth-copy { margin-top:8px; color:#94a3b8; font-family:'Share Tech Mono',monospace; font-size:12px; line-height:1.5; }
      .auth-form { padding:20px 24px 24px; display:grid; gap:14px; }
      .auth-field { display:grid; gap:6px; }
      .auth-field label { color:#64748b; font-family:'Share Tech Mono',monospace; font-size:10px; letter-spacing:2px; text-transform:uppercase; }
      .auth-field input { width:100%; border:1px solid rgba(42,47,63,.95); border-radius:8px; background:#0d0f14; color:#e2e8f0; padding:12px 14px; outline:none; font-family:'Share Tech Mono',monospace; font-size:13px; }
      .auth-field input:focus { border-color:#00d4ff; box-shadow:0 0 0 1px rgba(0,212,255,.18); }
      .auth-status { min-height:18px; color:#94a3b8; font-family:'Share Tech Mono',monospace; font-size:11px; }
      .auth-status.error { color:#ff3860; }
      .auth-submit { border:none; border-radius:8px; background:#00d4ff; color:#05080c; padding:12px 14px; cursor:pointer; font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; letter-spacing:2px; text-transform:uppercase; }
      .auth-submit:hover { filter:brightness(1.05); }
      @media (max-width: 700px){
        .session-controls { justify-content:flex-start; }
        .auth-card-head { padding:18px 18px 12px; }
        .auth-form { padding:18px; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay(){
    if(state.overlay){
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'auth-overlay';
    overlay.innerHTML = `
      <div class="auth-card">
        <div class="auth-card-head">
          <div class="auth-kicker">Secure Access</div>
          <div class="auth-title">${escapeHtml(state.config.authTitle)}</div>
          <div class="auth-copy">${escapeHtml(state.config.authHelpText)}</div>
        </div>
        <form class="auth-form" autocomplete="on">
          <div class="auth-field">
            <label for="auth-identifier">${state.config.authEmailSuffix ? 'Username' : 'Email'}</label>
            <input id="auth-identifier" name="identifier" type="${state.config.authEmailSuffix ? 'text' : 'email'}" autocomplete="username" required>
          </div>
          <div class="auth-field">
            <label for="auth-password">Password</label>
            <input id="auth-password" name="password" type="password" autocomplete="current-password" required>
          </div>
          <div class="auth-status" aria-live="polite"></div>
          <button type="submit" class="auth-submit">Sign In</button>
        </form>
      </div>
    `;

    state.overlay = overlay;
    state.formEl = overlay.querySelector('form');
    state.statusEl = overlay.querySelector('.auth-status');
    state.formEl.addEventListener('submit', handleSignInSubmit);
    document.body.appendChild(overlay);
  }

  function renderSessionControls(){
    const slot = document.querySelector('[data-session-slot]');
    if(!slot){
      return;
    }

    slot.classList.add('session-controls');
    if(state.mode !== 'remote'){
      slot.innerHTML = `<div class="session-pill local">${LOCAL_MODE_LABEL}</div>`;
      return;
    }

    if(!state.user){
      slot.innerHTML = `<div class="session-pill remote">Sign-in required</div>`;
      return;
    }

    const label = state.config.authEmailSuffix
      ? userAlias(state.user.email, state.config.authEmailSuffix)
      : (state.user.email || 'Authenticated user');
    slot.innerHTML = `
      <div class="session-pill remote">${escapeHtml(label)}</div>
      <button type="button" class="session-signout">Sign Out</button>
    `;
    const signOutBtn = slot.querySelector('.session-signout');
    signOutBtn.addEventListener('click', () => signOut());
  }

  function showOverlay(message){
    ensureOverlay();
    document.body.classList.add('app-auth-pending');
    state.overlay.classList.add('open');
    setStatus(message || state.config.authHelpText, false);
  }

  function hideOverlay(){
    if(state.overlay){
      state.overlay.classList.remove('open');
    }
  }

  function setStatus(message, isError){
    if(!state.statusEl){
      return;
    }
    state.statusEl.textContent = message || '';
    state.statusEl.classList.toggle('error', !!isError);
  }

  async function handleSignInSubmit(event){
    event.preventDefault();
    const formData = new FormData(state.formEl);
    const identifier = String(formData.get('identifier') || '').trim();
    const password = String(formData.get('password') || '');

    if(!identifier || !password){
      setStatus('Enter your username and password.', true);
      return;
    }

    const submitBtn = state.formEl.querySelector('.auth-submit');
    submitBtn.disabled = true;
    setStatus('Signing in...', false);

    try {
      const session = await passwordSignIn(identifier, password);
      state.session = session;
      state.user = session.user || await fetchCurrentUser(session.access_token);
      persistSession(session);
      renderSessionControls();
      hideOverlay();
      markReady();
    } catch (error){
      console.error('Sign-in failed:', error);
      setStatus(error.message || 'Sign-in failed.', true);
    } finally {
      submitBtn.disabled = false;
    }
  }

  async function signOut(){
    if(state.mode !== 'remote'){
      return;
    }

    try {
      if(state.session?.access_token){
        await fetch(buildUrl('/auth/v1/logout'), {
          method: 'POST',
          headers: {
            'apikey': state.config.supabaseAnonKey,
            'Authorization': `Bearer ${state.session.access_token}`
          }
        });
      }
    } catch (error){
      console.error('Sign-out request failed:', error);
    } finally {
      clearStoredSession();
      state.session = null;
      state.user = null;
      renderSessionControls();
      showOverlay('Signed out. Enter credentials to continue.');
    }
  }

  function loadStoredSession(){
    const raw = localStorage.getItem(SESSION_KEY);
    if(!raw){
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function persistSession(session){
    const expiresAt = session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600);
    const nextSession = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: expiresAt,
      user: session.user || null
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  }

  function clearStoredSession(){
    localStorage.removeItem(SESSION_KEY);
  }

  function isSessionExpiring(session){
    const expiresAt = Number(session?.expires_at || 0);
    return !expiresAt || ((expiresAt * 1000) - Date.now()) < 120000;
  }

  async function ensureSession(){
    if(state.mode !== 'remote'){
      return null;
    }
    if(!state.session){
      throw new Error('Sign-in required.');
    }
    if(isSessionExpiring(state.session)){
      state.session = await refreshSession(state.session.refresh_token);
      persistSession(state.session);
    }
    if(!state.user){
      state.user = state.session.user || await fetchCurrentUser(state.session.access_token);
      persistSession({ ...state.session, user: state.user });
    }
    return state.session;
  }

  async function passwordSignIn(identifier, password){
    const response = await fetch(buildUrl('/auth/v1/token?grant_type=password'), {
      method: 'POST',
      headers: {
        'apikey': state.config.supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: resolveEmail(identifier),
        password
      })
    });
    return parseAuthResponse(response);
  }

  async function refreshSession(refreshToken){
    const response = await fetch(buildUrl('/auth/v1/token?grant_type=refresh_token'), {
      method: 'POST',
      headers: {
        'apikey': state.config.supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    return parseAuthResponse(response);
  }

  async function fetchCurrentUser(accessToken){
    const response = await fetch(buildUrl('/auth/v1/user'), {
      headers: {
        'apikey': state.config.supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if(!response.ok){
      throw new Error('Unable to load user profile.');
    }
    return response.json();
  }

  async function parseAuthResponse(response){
    const payload = await response.json().catch(() => ({}));
    if(!response.ok){
      throw new Error(payload?.msg || payload?.error_description || payload?.error || 'Authentication request failed.');
    }
    return payload;
  }

  function createRemoteAdapter(){
    return {
      get: async (key) => {
        const rows = await requestJson(
          `/rest/v1/app_state?select=storage_value&storage_key=eq.${encodeURIComponent(key)}`
        );
        return { value: Array.isArray(rows) && rows.length ? rows[0].storage_value : null };
      },
      set: async (key, value) => {
        await requestJson('/rest/v1/app_state?on_conflict=storage_key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify([{
            storage_key: key,
            storage_value: String(value ?? '')
          }])
        });
      }
    };
  }

  async function requestJson(path, options){
    const response = await authorizedFetch(path, options);
    if(response.status === 204){
      return null;
    }

    const payload = await response.json().catch(() => null);
    if(!response.ok){
      if(response.status === 401){
        clearStoredSession();
        state.session = null;
        state.user = null;
        renderSessionControls();
        showOverlay('Session expired. Sign in again.');
      }
      throw new Error(payload?.message || payload?.error || `Request failed (${response.status}).`);
    }
    return payload;
  }

  async function authorizedFetch(path, options){
    const session = await ensureSession();
    const headers = new Headers(options?.headers || {});
    headers.set('apikey', state.config.supabaseAnonKey);
    headers.set('Authorization', `Bearer ${session.access_token}`);
    headers.set('Accept', headers.get('Accept') || 'application/json');

    return fetch(buildUrl(path), {
      ...options,
      headers
    });
  }

  function buildUrl(path){
    return `${state.config.supabaseUrl}${path}`;
  }

  function resolveEmail(identifier){
    if(!state.config.authEmailSuffix){
      return identifier;
    }
    return identifier.includes('@') ? identifier : `${identifier}${state.config.authEmailSuffix}`;
  }

  function userAlias(email, suffix){
    if(!email){
      return 'Authenticated user';
    }
    return suffix && email.endsWith(suffix) ? email.slice(0, -suffix.length) : email;
  }

  function escapeHtml(value){
    return String(value || '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }
})();
