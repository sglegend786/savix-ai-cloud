/* ═══════════════════════════════════════════════════
   SAVIX Main UI – Auth + SSO Script v9.0
   Central Auth API: https://savix-auth-2aso.onrender.com
═══════════════════════════════════════════════════ */

const AUTH_API = 'https://savix-auth-2aso.onrender.com/api/auth';

  // 🚀 Application Routing Map
  const appRoutes = {
    scheme:   'http://localhost:5173/sso',
    tasks:    'https://savix-tasks-api-9lyi.onrender.com/sso',
    finance:  'https://savix-finance-api-zqa8.onrender.com/sso',
    pharm:    'https://savix-pharmacy-omega.vercel.app/sso',
    hospital: 'https://savix-health-app-api.onrender.com/sso',
    sos:      '/SOS/index.html'
  };

  // Role-specific path overrides
  const roleRedirect = {
    pharm:    { pharmacy_owner: '/dashboard', admin: '/admin' },
    hospital: { hospital: '/admin', admin: '/admin' },
    scheme:   { admin: '/admin' }
  };

document.addEventListener('DOMContentLoaded', () => {

  // Global Logout Check
  if (window.location.search.includes('logout=true')) {
    localStorage.removeItem('savix_session');
    window.location.replace('/index.html');
    return;
  }

  // ──────────────── Toast ────────────────
  const toast = document.getElementById('toast');
  window.savixToast = (text, type = 'info') => {
    if (!toast) return;
    toast.textContent = text;
    toast.className = 'toast show' + (type === 'error' ? ' toast-error' : type === 'success' ? ' toast-success' : '');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
  };

  // ──────────────── Modal Elements ────────────────
  const modal       = document.getElementById('loginModal');
  const tabLogin    = document.getElementById('tabLogin');
  const tabSignup   = document.getElementById('tabSignup');
  const panelLogin  = document.getElementById('panelLogin');
  const panelSignup = document.getElementById('panelSignup');
  const btnGetOtp   = document.getElementById('btnGetOtp');
  const btnLogin    = document.getElementById('btnLogin');
  const btnSignup   = document.getElementById('btnSignup');
  const otpStep     = document.getElementById('otpStep');
  const openers     = document.querySelectorAll('[data-open-login]');

  let pendingApp = null;

  // ──────────────── Auth State ────────────────
  function getSession() {
    try { return JSON.parse(localStorage.getItem('savix_session')) || null; }
    catch { return null; }
  }
  function setSession(data) { localStorage.setItem('savix_session', JSON.stringify(data)); }
  function clearSession()   { localStorage.removeItem('savix_session'); }

  function updateHeroButton() {
    const session = getSession();
    const heroBtn = document.querySelector('[data-open-login].btn-fittr-hero') || document.querySelector('.btn-fittr-hero');
    if (session && heroBtn) {
      heroBtn.textContent = `Hi, ${session.user.name.split(' ')[0]} 👋`;
    }
  }
  updateHeroButton();

  // ──────────────── Role card toggling ────────────────
  const roleCards = {
    user:            document.getElementById('role_user'),
    pharmacy_owner:  document.getElementById('role_pharmacy_owner'),
    hospital:        document.getElementById('role_hospital'),
    admin:           document.getElementById('role_admin')
  };

  function setActiveRole(role) {
    Object.entries(roleCards).forEach(([key, card]) => {
      if (!card) return;
      if (key === role) {
        card.style.border            = '2px solid #00d4ff';
        card.style.background        = 'rgba(0,212,255,.1)';
        card.style.color             = '#fff';
        card.querySelector('input').checked = true;
      } else {
        card.style.border            = '2px solid rgba(255,255,255,.12)';
        card.style.background        = 'transparent';
        card.style.color             = 'rgba(255,255,255,.5)';
      }
    });

    const adminHint = document.getElementById('adminHint');
    if (role === 'admin') {
      btnGetOtp.style.display = 'none';
      btnLogin.style.display  = '';
      btnLogin.textContent    = 'Login →';
      otpStep.style.display   = 'none';
      if (adminHint) adminHint.style.display = '';
    } else {
      btnGetOtp.style.display = '';
      btnLogin.style.display  = 'none';
      if (adminHint) adminHint.style.display = 'none';
      otpStep.style.display   = 'none';
    }
  }

  Object.entries(roleCards).forEach(([role, card]) => {
    card?.addEventListener('click', () => setActiveRole(role));
  });

  function getSelectedRole() {
    const checked = document.querySelector('input[name="loginRole"]:checked');
    return checked ? checked.value : 'user';
  }

  // ──────────────── Tab switching ────────────────
  function switchTab(tab) {
    if (tab === 'login') {
      tabLogin.style.color    = '#fff';
      tabSignup.style.color   = 'rgba(255,255,255,.45)';
      document.getElementById('tabLoginBar').style.display  = 'block';
      document.getElementById('tabSignupBar').style.display = 'none';
      panelLogin.style.display  = '';
      panelSignup.style.display = 'none';
    } else {
      tabSignup.style.color   = '#fff';
      tabLogin.style.color    = 'rgba(255,255,255,.45)';
      document.getElementById('tabSignupBar').style.display = 'block';
      document.getElementById('tabLoginBar').style.display  = 'none';
      panelSignup.style.display = '';
      panelLogin.style.display  = 'none';
    }
    // Reset OTP step
    otpStep.style.display   = 'none';
    btnGetOtp.style.display = '';
    btnLogin.style.display  = 'none';
    // Reset roles to user
    setActiveRole('user');
  }

  tabLogin?.addEventListener('click',  () => switchTab('login'));
  tabSignup?.addEventListener('click', () => switchTab('signup'));

  // ──────────────── Password toggles ────────────────
  document.getElementById('toggleLoginPw')?.addEventListener('click', () => {
    const inp = document.getElementById('loginPassword');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });
  document.getElementById('toggleSuPw')?.addEventListener('click', () => {
    const inp = document.getElementById('suPassword');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  // ──────────────── Open / Close modal ────────────────
  const openModal = (e) => {
    const session = getSession();

    let target = e.target;
    while (target && !target.getAttribute('data-app') && target !== document.body) {
      target = target.parentElement;
    }
    pendingApp = target ? target.getAttribute('data-app') : null;

    if (session && pendingApp) { redirectToApp(pendingApp, session); return; }

    if (!modal) return;
    switchTab('login');
    modal.style.opacity       = '1';
    modal.style.pointerEvents = 'all';
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => document.getElementById('loginEmail')?.focus(), 50);
  };

  const closeModal = () => {
    modal.style.opacity       = '0';
    modal.style.pointerEvents = 'none';
    modal.setAttribute('aria-hidden', 'true');
    pendingApp = null;
  };

  openers.forEach(b => b.addEventListener('click', openModal));
  document.getElementById('closeModal')?.addEventListener('click',  closeModal);
  document.getElementById('closeModal2')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('show')) closeModal();
  });

  // ──────────────── Redirect logic ────────────────
  function redirectToApp(app, session) {
    const base = appRoutes[app];
    if (!base) { savixToast('App not available.', 'error'); return; }

    const isFlask = ['tasks', 'finance', 'hospital'].includes(app);
    const token   = isFlask ? session.flaskToken : session.schemeToken;

    let url = base + '?token=' + token;

    // Role-specific path override
    if (roleRedirect[app] && roleRedirect[app][session.user.role]) {
      url += '&redirect=' + roleRedirect[app][session.user.role];
    }

    savixToast(`Redirecting to ${app}... 🚀`, 'success');
    setTimeout(() => { window.location.href = url; }, 800);
  }

  // ──────────────── Get OTP (non-admin) ────────────────
  btnGetOtp?.addEventListener('click', async () => {
    const email    = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value.trim();

    if (!email || !password) { savixToast('Please enter email and password.', 'error'); return; }

    btnGetOtp.disabled    = true;
    btnGetOtp.textContent = 'Sending...';

    try {
      const res  = await fetch(`${AUTH_API}/send-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        savixToast(data.message, 'success');
        otpStep.style.display   = '';
        btnGetOtp.style.display = 'none';
        btnLogin.style.display  = '';
        btnLogin.textContent    = 'Login →';
        
        setTimeout(() => document.getElementById('loginOtp')?.focus(), 50); 
      } else {
        savixToast(data.message, 'error');
      }
    } catch {
      savixToast('Cannot reach Auth server. Is it running on port 4000?', 'error');
    }

    btnGetOtp.disabled    = false;
    btnGetOtp.textContent = 'Get OTP';
  });

  // ──────────────── Login button ────────────────
  btnLogin?.addEventListener('click', async () => {
    const role     = getSelectedRole();
    const email    = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value.trim();

    if (!email || !password) { savixToast('Please enter email and password.', 'error'); return; }

    btnLogin.disabled    = true;
    btnLogin.textContent = 'Verifying...';

    try {
      // ── ADMIN direct login (no OTP) ──
      if (role === 'admin') {
        const res  = await fetch(`${AUTH_API}/admin-login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password })
        });
        const data = await res.json();

          if (data.success) {
            setSession({ token: data.token, flaskToken: data.flaskToken, schemeToken: data.schemeToken, user: data.user });
            updateHeroButton();
            savixToast(`Welcome, ${data.user.name}! 🌟`, 'success');
            closeModal();
            
            if (pendingApp) { 
              const app = pendingApp; pendingApp = null; setTimeout(() => redirectToApp(app, getSession()), 600); 
            }
          } else {
          savixToast(data.message, 'error');
        }

      // ── Regular user login (needs OTP) ──
      } else {
        const otp = document.getElementById('loginOtp')?.value.trim();
        if (!otp || otp.length !== 6) { savixToast('Please enter the 6-digit OTP.', 'error'); btnLogin.disabled = false; btnLogin.textContent = 'Login →'; return; }

        const res  = await fetch(`${AUTH_API}/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password, otp })
        });
        const data = await res.json();

        if (data.success) {
          setSession({ token: data.token, flaskToken: data.flaskToken, schemeToken: data.schemeToken, user: data.user });
          updateHeroButton();
          savixToast(`Welcome, ${data.user.name.split(' ')[0]}! 🌟`, 'success');
          closeModal();
          
          if (pendingApp) { 
            const app = pendingApp; pendingApp = null; setTimeout(() => redirectToApp(app, getSession()), 600); 
          } else {
            // Role-based auto-redirect if logging in from main hub without a pending app
            const userRole = data.user.role;
            if (userRole === 'hospital') {
              setTimeout(() => redirectToApp('hospital', getSession()), 600);
            } else if (userRole === 'pharmacy_owner') {
              setTimeout(() => redirectToApp('pharm', getSession()), 600);
            }
            // admin and user stay on hub
          }
        } else {
          savixToast(data.message, 'error');
        }
      }
    } catch {
      savixToast('Cannot reach Auth server. Is it running on port 4000?', 'error');
    }

    btnLogin.disabled    = false;
    btnLogin.textContent = 'Login →';
  });

  // ──────────────── Sign Up ────────────────
  btnSignup?.addEventListener('click', async () => {
    const name       = document.getElementById('suName')?.value.trim();
    const email      = document.getElementById('suEmail')?.value.trim();
    const phone      = document.getElementById('suPhone')?.value.trim();
    const age        = document.getElementById('suAge')?.value.trim();
    const gender     = document.getElementById('suGender')?.value;
    const occupation = document.getElementById('suOccupation')?.value.trim();
    const role       = document.getElementById('suRole')?.value;
    const password   = document.getElementById('suPassword')?.value.trim();

    if (!name || !email || !phone || !age || !gender || !occupation || !password) {
      savixToast('Please fill all fields.', 'error'); return;
    }
    if (phone.length !== 10 || isNaN(phone)) {
      savixToast('Enter a valid 10-digit phone number.', 'error'); return;
    }
    if (password.length < 8) {
      savixToast('Password must be at least 8 characters.', 'error'); return;
    }

    btnSignup.disabled    = true;
    btnSignup.textContent = 'Creating Account...';

    try {
      const res  = await fetch(`${AUTH_API}/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, phone, age: Number(age), gender, occupation, role, password })
      });
      const data = await res.json();

      if (data.success) {
        savixToast(data.message + ' Please log in.', 'success');
        switchTab('login');
        document.getElementById('loginEmail').value = email;
      } else {
        savixToast(data.message, 'error');
      }
    } catch {
      savixToast('Cannot reach Auth server. Is it running on port 4000?', 'error');
    }

    btnSignup.disabled    = false;
    btnSignup.textContent = 'Create Account →';
  });

  // ──────────────── Carousel ────────────────
  const transGrid = document.querySelector('.transformations-grid');
  const btnPrev   = document.getElementById('sliderPrev');
  const btnNext   = document.getElementById('sliderNext');
  if (transGrid && btnPrev && btnNext) {
    btnNext.addEventListener('click', () => transGrid.scrollBy({ left: 320, behavior: 'smooth' }));
    btnPrev.addEventListener('click', () => transGrid.scrollBy({ left: -320, behavior: 'smooth' }));
  }

}); // end DOMContentLoaded



