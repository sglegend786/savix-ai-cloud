// SAVIX_AI — Fittr Experience JavaScript Suite
(function(){
  // ---- Mobile Navigation ----
  const navToggle = document.getElementById('navToggle');
  const navList = document.getElementById('navLinks');
  if(navToggle && navList){
    navToggle.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    navList.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navList.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Scroll Progress Bar & Header Shadow ----
  const scrollProgress = document.getElementById('scrollProgress');
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if(scrollProgress && scrollHeight > 0){
      const pct = (scrollTop / scrollHeight) * 100;
      scrollProgress.style.width = pct + '%';
    }
    if(header){
      header.classList.toggle('scrolled', scrollTop > 20);
    }
  }, { passive: true });

  // ---- Toast System ----
  const toast = document.getElementById('toast');
  // App specific routing mapping
  const appRoutes = {
    'scheme': 'https://savix-scheme-ui.onrender.com/sso',
    'tasks': 'https://savix-tasks-api.onrender.com/sso',
    'finance': 'https://savix-finance-api.onrender.com/sso',
    'pharm': 'https://savix-pharmacy-api.onrender.com/sso',
    'hospital': 'https://savix-hospital-api.onrender.com/sso'
  };
  window.savixToast = (text) => {
    if(!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(window.savixToast._t);
    window.savixToast._t = setTimeout(() => toast.classList.remove('show'), 2800);
  };

  // ---- Login / Onboarding Modal ----
  const modal = document.getElementById('loginModal');
  const openers = document.querySelectorAll('[data-open-login]');
  const closeBtn = document.getElementById('closeModal');
  const continueBtn = document.getElementById('continueLogin');
  const mobileInput = document.getElementById('mobileInput');

  // Track which app the user clicked
  let pendingApp = null;

  const openModal = (e) => {
    if(!modal) return;
    const btn = e && e.currentTarget;
    pendingApp = btn ? btn.getAttribute('data-app') : null;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => mobileInput && mobileInput.focus(), 50);
  };
  const closeModal = () => {
    if(!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  };

  openers.forEach(b => b.addEventListener('click', openModal));
  if(closeBtn) closeBtn.addEventListener('click', closeModal);
  if(modal) modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && modal && modal.classList.contains('show')) closeModal();
  });
  if(continueBtn){
    continueBtn.addEventListener('click', () => {
      if(mobileInput && !mobileInput.value.trim()){
        savixToast('Please enter your 10-digit mobile number.');
        return;
      }
      closeModal();
      if(pendingApp && appRoutes[pendingApp]){
        savixToast('Redirecting... Please wait.');
        setTimeout(() => { window.location.href = appRoutes[pendingApp]; }, 800);
      } else {
        savixToast('Welcome to SAVIX_AI!');
      }
      pendingApp = null;
    });
  }

  // ---- Transformations Carousel Slider Next/Prev ----
  const transGrid = document.querySelector('.transformations-grid');
  const btnPrev = document.getElementById('sliderPrev');
  const btnNext = document.getElementById('sliderNext');
  if(transGrid && btnPrev && btnNext){
    btnNext.addEventListener('click', () => {
      transGrid.scrollBy({ left: 320, behavior: 'smooth' });
    });
    btnPrev.addEventListener('click', () => {
      transGrid.scrollBy({ left: -320, behavior: 'smooth' });
    });
  }

  // ---- Footer & General Accordions ----
  document.querySelectorAll('.f-acc-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.f-acc-item');
      const panel = item.querySelector('.f-acc-panel');
      const isOpen = item.classList.contains('open');

      // Toggle current
      item.classList.toggle('open', !isOpen);
      panel.style.maxHeight = !isOpen ? panel.scrollHeight + 'px' : null;
      const icon = trigger.querySelector('.acc-icon');
      if(icon) icon.textContent = !isOpen ? '−' : '+';
    });
  });

  // ---- Live Simulated Biometric Pulse ----
  const hrElement = document.getElementById('liveHeartRate');
  if(hrElement){
    setInterval(() => {
      const variation = Math.floor(Math.random() * 5) - 2; // -2 to +2
      const current = parseInt(hrElement.textContent, 10) || 72;
      const next = Math.max(68, Math.min(78, current + variation));
      hrElement.textContent = next;
    }, 2500);
  }

  // ---- Smooth Anchor Scrolling ----
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if(id === '#' || !id.startsWith('#')) return;
      const target = document.querySelector(id);
      if(target){
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

})();





