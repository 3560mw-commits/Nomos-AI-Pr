// ═══════════════════════════════════════════════
// Nomos AI Pro  |  main.js  (v2 — updated)
// ═══════════════════════════════════════════════

// ── Admin Secret Access System ──
// Admin login is NOT exposed in the UI (no "Admin" option in the dropdown).
// To access admin: on the login page, type "nomos.admin" in the email field
// → a hidden "Admin Access" button appears below the login form.
// Clicking it opens a secure admin gate modal separate from the normal login flow.
//
// TO CHANGE YOUR ADMIN KEY:
//   In your browser console, run: btoa(encodeURIComponent('YOUR_NEW_KEY').split('').reverse().join(''))
//   Paste the result into ADMIN_KEY_HASH below.
//
const ADMIN_KEY_HASH = 'MzIlNTIwMm5pbWRBc29tb04=';

function _verifyAdminKey(inputKey) {
  try {
    const h = btoa(encodeURIComponent(inputKey).split('').reverse().join(''));
    return h === ADMIN_KEY_HASH;
  } catch(e) { return false; }
}

const ADMIN_ACCOUNT = {
  firstName: 'Admin', lastName: 'Nomos',
  role: 'admin', initials: 'AN',
  email: 'admin@nomosai.ke',
  avatarGrad: 'linear-gradient(135deg,#c9a84c,#8b5e00)'
};

// ── In-memory "database" of registered users ──
const USERS = [
  {
    email: 'sarah.njoroge@nomosai.ke', password: 'Password1',
    firstName: 'Sarah', lastName: 'Njoroge', role: 'lawyer',
    specialty: 'Tenant & Property Rights', county: 'Nairobi',
    experience: 8, rating: 4.9, fee: 'KES 5,000–15,000', available: true,
    initials: 'SN', avatarGrad: 'linear-gradient(135deg,#1e3a5f,#2d7a8e)'
  },
  {
    email: 'kevin.odhiambo@nomosai.ke', password: 'Password1',
    firstName: 'Kevin', lastName: 'Odhiambo', role: 'lawyer',
    specialty: 'Civil & Housing Law', county: 'Nairobi',
    experience: 12, rating: 4.7, fee: 'KES 3,000–10,000', available: false,
    initials: 'KO', avatarGrad: 'linear-gradient(135deg,#2d1a5f,#5a2d8e)'
  },
  {
    email: 'amina.mohamed@nomosai.ke', password: 'Password1',
    firstName: 'Amina', lastName: 'Mohamed', role: 'lawyer',
    specialty: 'Probono — LSK Network', county: 'Kiambu',
    experience: 6, rating: 4.8, fee: 'FREE (Probono)', available: true,
    initials: 'AM', avatarGrad: 'linear-gradient(135deg,#1a4731,#2d7a52)'
  }
];

// Currently logged-in user (null when signed out)
let currentUser = null;

// ── Admin stats (simulated data) ──
const adminStats = {
  totalUsers: 1247,
  newUsersToday: 34,
  consultations: 8934,
  consultationsToday: 127,
  lawyers: 103,
  totalRevenue: 4782600,
  revenueToday: 18400,
  dailyActiveSubscribers: 412,
  weeklyActiveSubscribers: 1893,
  monthlyActiveSubscribers: 5621,
  codeRequests: 289
};

// ── Page Router ──
let currentPage = 'landing';
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + id);
  if (pg) { pg.classList.add('active'); currentPage = id; window.scrollTo(0, 0); }
  const navbar = document.getElementById('navbar');
  if (navbar) navbar.style.display = (id === 'dashboard') ? 'none' : 'flex';
  // Clear login/register inputs on every visit to those pages
  if (id === 'login') {
    ['loginEmail','loginPass'].forEach(fid => { const el=document.getElementById(fid); if(el){el.value='';el.classList.remove('error');} });
    const sel=document.getElementById('loginUserType'); if(sel){sel.value='';sel.classList.remove('error');}
    ['loginEmailErr','loginPassErr','loginUserTypeErr'].forEach(eid=>{const e=document.getElementById(eid);if(e)e.classList.remove('show');});
    const la=document.getElementById('loginAlert'); if(la){la.classList.remove('show'); la.textContent='Please enter your email and password to sign in.';}
  }
  if (id === 'register') {
    // Reset individual fields
    ['regFirst','regLast','regEmail','regPhone','regPass','regPass2'].forEach(fid => { const el=document.getElementById(fid); if(el){el.value='';el.classList.remove('error');} });
    // Reset org fields
    ['regFirmName','regOrgCounty'].forEach(fid => { const el=document.getElementById(fid); if(el){el.value='';el.classList.remove('error');} });
    const cb=document.getElementById('regTerms'); if(cb) cb.checked=false;
    ['regFirstErr','regLastErr','regFirmNameErr','regOrgCountyErr','regEmailErr','regPassErr','regPass2Err','regTermsErr'].forEach(eid=>{const e=document.getElementById(eid);if(e)e.classList.remove('show');});
    const ra=document.getElementById('regAlert'); if(ra){ra.classList.remove('show'); ra.textContent='Please fill in all required fields to continue.';}
    // Apply current type's form layout
    _updateRegisterFormForType(selectedUserType || 'citizen');
  }
  if (id === 'dashboard') {
    setTimeout(() => startReveal(), 100);
    applyUserToDashboard();
  }
}

// ── Apply logged-in user's name & role throughout dashboard ──
function applyUserToDashboard() {
  if (!currentUser) return;

  if (currentUser.role === 'admin') {
    applyAdminDashboard();
    return;
  }

  const isOrg  = ['ngo','corporate'].includes(currentUser.role);
  const full   = isOrg && currentUser.firmName
    ? currentUser.firmName
    : (currentUser.firstName + (currentUser.lastName ? ' ' + currentUser.lastName : ''));
  const initials = currentUser.initials || (full.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase());

  const nameEl = document.getElementById('dashUserName');
  const typeEl = document.getElementById('dashUserType');
  const avEls  = document.querySelectorAll('.dash-user-av');
  if (nameEl) nameEl.textContent = full;
  if (typeEl) typeEl.textContent = capitalise(currentUser.role || 'Citizen') + ' Account';
  avEls.forEach(el => el.textContent = initials);

  const topAv = document.getElementById('dashTopAvatar');
  if (topAv) topAv.textContent = initials;

  const greet = document.getElementById('overviewGreeting');
  const role = currentUser.role;
  const displayName = isOrg && currentUser.firmName ? currentUser.firmName.split(' ')[0] : currentUser.firstName;

  // ── Show the correct sidebar based on role ──
  const sidebarCitizen  = document.getElementById('sidebarCitizen');
  const sidebarLawyer   = document.getElementById('sidebarLawyer');
  const sidebarNGO      = document.getElementById('sidebarNGO');
  const sidebarCorp     = document.getElementById('sidebarCorp');
  const sidebarAdmin    = document.getElementById('sidebarAdmin');
  [sidebarCitizen, sidebarLawyer, sidebarNGO, sidebarCorp, sidebarAdmin].forEach(s => { if(s) s.style.display='none'; });

  if (role === 'lawyer') {
    if (sidebarLawyer) sidebarLawyer.style.display = '';
    if (greet) greet.textContent = 'Good day, ' + displayName + ' ⚖️';
    applyLawyerOverview();
    renderPendingRequests();
  } else if (role === 'ngo') {
    if (sidebarNGO) sidebarNGO.style.display = '';
    if (greet) greet.textContent = 'Good day, ' + displayName + ' 🏢';
    applyNGOOverview();
  } else if (role === 'corporate') {
    if (sidebarCorp) sidebarCorp.style.display = '';
    if (greet) greet.textContent = 'Good day, ' + displayName + ' 🏛️';
    applyCorporateOverview();
  } else {
    // citizen / student
    if (sidebarCitizen) sidebarCitizen.style.display = '';
    if (greet) greet.textContent = 'Good day, ' + displayName + ' 👋';
  }

  const chatWelcome = document.getElementById('chatWelcomeMsg');
  if (chatWelcome) chatWelcome.innerHTML =
    'Hello ' + displayName + '! I\'m Nomos, your AI legal companion. I can help you with legal research, draft documents, and answer any legal questions. What would you like to discuss today?';

  const setFirst  = document.getElementById('settingsFirst');
  const setLast   = document.getElementById('settingsLast');
  const setEmail  = document.getElementById('settingsEmail');
  const setAvName = document.getElementById('settingsAvName');
  const setAvInit = document.getElementById('settingsAvInit');
  if (setFirst) setFirst.value = isOrg ? (currentUser.firmName || '') : (currentUser.firstName || '');
  if (setLast)  setLast.value  = isOrg ? (currentUser.county || '')   : (currentUser.lastName || '');
  if (setEmail) setEmail.value = currentUser.email;
  if (setAvName) setAvName.textContent = full;
  if (setAvInit) setAvInit.textContent = initials;

  renderLawyerMatches();

  if (currentUser.role === 'lawyer') renderNotifPanel();

  // Default tab for each role
  if (role === 'lawyer') switchDashTab('overview');
  else if (role === 'ngo') switchDashTab('ngo-overview');
  else if (role === 'corporate') switchDashTab('corp-overview');
  else switchDashTab('overview');
}

// ── Admin dashboard ──
function applyAdminDashboard() {
  const full = currentUser.firstName + ' ' + currentUser.lastName;
  const initials = currentUser.initials || 'AN';

  const nameEl = document.getElementById('dashUserName');
  const typeEl = document.getElementById('dashUserType');
  const avEls  = document.querySelectorAll('.dash-user-av');
  if (nameEl) nameEl.textContent = full;
  if (typeEl) typeEl.textContent = 'Administrator';
  avEls.forEach(el => { el.textContent = initials; el.style.background = 'linear-gradient(135deg,#c9a84c,#8b5e00)'; });

  const topAv = document.getElementById('dashTopAvatar');
  if (topAv) { topAv.textContent = initials; topAv.style.background = 'linear-gradient(135deg,#c9a84c,#8b5e00)'; }

  const sidebarCitizen = document.getElementById('sidebarCitizen');
  const sidebarLawyer  = document.getElementById('sidebarLawyer');
  const sidebarNGO     = document.getElementById('sidebarNGO');
  const sidebarCorp    = document.getElementById('sidebarCorp');
  const sidebarAdmin   = document.getElementById('sidebarAdmin');
  [sidebarCitizen, sidebarLawyer, sidebarNGO, sidebarCorp].forEach(s => { if(s) s.style.display='none'; });
  if (sidebarAdmin) sidebarAdmin.style.display = '';

  switchDashTab('admin-overview');
}

function applyLawyerOverview() {
  const kpiRow = document.getElementById('lawyerKpiRow');
  if (kpiRow) {
    kpiRow.innerHTML = `
      <div class="kpi-card" style="--kpi-color:var(--g400)"><div class="kpi-label">Active Cases</div><div class="kpi-num">3</div><div class="kpi-change" style="color:var(--suc)">↑ 1 new this week</div><div class="kpi-icon">⚖️</div></div>
      <div class="kpi-card" style="--kpi-color:var(--t400)"><div class="kpi-label">My Clients</div><div class="kpi-num">8</div><div class="kpi-change" style="color:var(--suc)">↑ 2 new</div><div class="kpi-icon">👥</div></div>
      <div class="kpi-card" style="--kpi-color:var(--suc)"><div class="kpi-label">Documents</div><div class="kpi-num">14</div><div class="kpi-change" style="color:var(--s400)">Advanced Suite</div><div class="kpi-icon">📄</div></div>
      <div class="kpi-card" style="--kpi-color:var(--warn)"><div class="kpi-label">Next Hearing</div><div class="kpi-num">7d</div><div class="kpi-change" style="color:var(--warn)">⚠ 28 May 2025</div><div class="kpi-icon">🏛️</div></div>
    `;
  }
}

function applyNGOOverview() {
  const el = document.getElementById('ngoKpiRow');
  if (el) {
    el.innerHTML = `
      <div class="kpi-card" style="--kpi-color:var(--t400)"><div class="kpi-label">Case Intakes</div><div class="kpi-num">42</div><div class="kpi-change" style="color:var(--suc)">↑ 6 this week</div><div class="kpi-icon">📋</div></div>
      <div class="kpi-card" style="--kpi-color:var(--g400)"><div class="kpi-label">Beneficiaries</div><div class="kpi-num">218</div><div class="kpi-change" style="color:var(--suc)">↑ 14 new</div><div class="kpi-icon">🤝</div></div>
      <div class="kpi-card" style="--kpi-color:var(--suc)"><div class="kpi-label">Impact Reports</div><div class="kpi-num">7</div><div class="kpi-change" style="color:var(--s400)">Last: Apr 2025</div><div class="kpi-icon">📊</div></div>
      <div class="kpi-card" style="--kpi-color:var(--warn)"><div class="kpi-label">County Coverage</div><div class="kpi-num">9</div><div class="kpi-change" style="color:var(--t400)">of 14 counties</div><div class="kpi-icon">🗺️</div></div>
    `;
  }
}

function applyCorporateOverview() {
  const el = document.getElementById('corpKpiRow');
  if (el) {
    el.innerHTML = `
      <div class="kpi-card" style="--kpi-color:var(--g400)"><div class="kpi-label">Contracts Analysed</div><div class="kpi-num">27</div><div class="kpi-change" style="color:var(--suc)">↑ 3 this week</div><div class="kpi-icon">📄</div></div>
      <div class="kpi-card" style="--kpi-color:var(--warn)"><div class="kpi-label">Compliance Alerts</div><div class="kpi-num">4</div><div class="kpi-change" style="color:var(--warn)">⚠ 2 urgent</div><div class="kpi-icon">⚠️</div></div>
      <div class="kpi-card" style="--kpi-color:var(--t400)"><div class="kpi-label">Regulatory Items</div><div class="kpi-num">11</div><div class="kpi-change" style="color:var(--suc)">3 resolved</div><div class="kpi-icon">📋</div></div>
      <div class="kpi-card" style="--kpi-color:var(--suc)"><div class="kpi-label">Team Members</div><div class="kpi-num">6</div><div class="kpi-change" style="color:var(--s400)">Multi-user workspace</div><div class="kpi-icon">👥</div></div>
    `;
  }
}

function capitalise(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

// ── Navbar scroll ──
window.addEventListener('scroll', () => {
  const nb = document.getElementById('navbar');
  if (nb) nb.classList.toggle('scrolled', window.scrollY > 20);
});

// ── Mobile nav ──
function toggleMobileNav() {
  document.getElementById('navbar').classList.toggle('mobile-nav-open');
}
document.addEventListener('click', e => {
  const nb = document.getElementById('navbar');
  if (nb && !nb.contains(e.target)) nb.classList.remove('mobile-nav-open');
});

// ── Scroll to section ──
function scrollToSection(id) {
  if (currentPage !== 'landing') showPage('landing');
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, currentPage === 'landing' ? 0 : 300);
}

// ── Command Bar ──
function showCmd() { document.getElementById('cmdOverlay').classList.add('open'); setTimeout(() => document.getElementById('cmdInput').focus(), 100); }
function hideCmd() { document.getElementById('cmdOverlay').classList.remove('open'); document.getElementById('cmdInput').value = ''; }
function closeCmdOverlay(e) { if (e.target === document.getElementById('cmdOverlay')) hideCmd(); }
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); showCmd(); }
  if (e.key === 'Escape') hideCmd();
});
function filterCmd(v) {}
function cmdKeyNav(e) { if (e.key === 'Escape') hideCmd(); }

// ── Scroll Reveal ──
function startReveal() {
  const els = document.querySelectorAll('.page.active [data-reveal]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('revealed'); obs.unobserve(en.target); } });
  }, { threshold: .1 });
  els.forEach(el => { el.classList.remove('revealed'); obs.observe(el); });
}
window.addEventListener('load', startReveal);

// ── Stat bars ──
function animateBars() {
  document.querySelectorAll('.sc-fill[data-w]').forEach(el => { el.style.width = el.dataset.w + '%'; });
}
const barObs = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { animateBars(); barObs.disconnect(); } });
}, { threshold: .3 });
const statsEl = document.getElementById('stats');
if (statsEl) barObs.observe(statsEl);

// ── Testimonials ──
let testiIdx = 0;
function goTesti(n) {
  document.querySelectorAll('.testi-card').forEach((c, i) => { c.classList.toggle('visible', i === n); });
  document.querySelectorAll('.tn-dot').forEach((d, i) => { d.classList.toggle('active', i === n); });
  testiIdx = n;
}
function nextTesti() { goTesti((testiIdx + 1) % 3); }
function prevTesti() { goTesti((testiIdx + 2) % 3); }
setInterval(() => { if (currentPage === 'landing') nextTesti(); }, 5000);

// ── User type selection (landing) ──
function selectUserType(el, type) {
  document.querySelectorAll('.ut-card').forEach(c => c.classList.remove('active-type'));
  el.classList.add('active-type');
}

// ── User type picker (register page) ──
let selectedUserType = 'citizen';

// Config for each type's banner and form display
const REG_TYPE_CONFIG = {
  citizen:   { icon: '👤', label: 'Individual Citizen',       org: false },
  lawyer:    { icon: '⚖️', label: 'Legal Practitioner',       org: false },
  student:   { icon: '🎓', label: 'Student',                  org: false },
  ngo:       { icon: '🏢', label: 'NGO / Probono Organisation', org: true,  firmLabel: 'Organisation / NGO Name' },
  corporate: { icon: '🏛️', label: 'Corporate / Government',   org: true,  firmLabel: 'Company / Government Entity Name' },
};

function pickType(el, type) {
  document.querySelectorAll('.utype-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  selectedUserType = type;
  _updateRegisterFormForType(type);
}

function _updateRegisterFormForType(type) {
  const cfg = REG_TYPE_CONFIG[type] || REG_TYPE_CONFIG.citizen;
  const isOrg = cfg.org;

  // Toggle individual vs org field blocks
  const indiv = document.getElementById('regIndividualFields');
  const org   = document.getElementById('regOrgFields');
  if (indiv) indiv.style.display = isOrg ? 'none' : '';
  if (org)   org.style.display   = isOrg ? ''     : 'none';

  // Update firm label text
  const firmLbl = document.getElementById('regFirmLabel');
  if (firmLbl && cfg.firmLabel) firmLbl.textContent = cfg.firmLabel + ' *';

  // Update page title + sub
  const title = document.getElementById('regPageTitle');
  const sub   = document.getElementById('regPageSub');
  if (title) title.textContent = isOrg ? 'Register Organisation' : 'Create Account';
  if (sub)   sub.textContent   = isOrg
    ? 'Register your ' + cfg.label + ' on Nomos AI Pro'
    : "Join Kenya's legal intelligence platform — free to start";

  // Show/hide banner
  const banner     = document.getElementById('regTypeBanner');
  const bannerIcon = document.getElementById('regTypeBannerIcon');
  const bannerText = document.getElementById('regTypeBannerText');
  if (banner) banner.style.display = 'flex';
  if (bannerIcon) bannerIcon.textContent = cfg.icon;
  if (bannerText) bannerText.textContent = 'Registering as: ' + cfg.label;
}

// ════════════════════════════════════════
// ★ VALIDATION HELPERS
// ════════════════════════════════════════
function showErr(inputId, errId, message) {
  const inp = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (inp) inp.classList.add('error');
  if (err) { if (message) err.textContent = message; err.classList.add('show'); }
}
function clearErr(inputEl, errId) {
  if (inputEl) inputEl.classList.remove('error');
  const err = document.getElementById(errId);
  if (err) err.classList.remove('show');
  const alert = inputEl && inputEl.closest('.auth-card') && inputEl.closest('.auth-card').querySelector('.form-alert');
  if (alert) alert.classList.remove('show');
}
function clearTermsErr() {
  document.getElementById('regTermsErr').classList.remove('show');
  const alert = document.getElementById('regAlert');
  if (alert) alert.classList.remove('show');
}
function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }

// ── LOGIN VALIDATION ──
function validateLogin() {
  let valid = true;
  const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass     = document.getElementById('loginPass').value;
  const userType = document.getElementById('loginUserType') ? document.getElementById('loginUserType').value : '';

  ['loginEmail', 'loginPass', 'loginUserType'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('error'); });
  ['loginEmailErr', 'loginPassErr', 'loginUserTypeErr'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('show'); });
  document.getElementById('loginAlert').classList.remove('show');

  // Admin login is handled via the secret gate modal — not the normal flow

  if (!userType) { showErr('loginUserType', 'loginUserTypeErr', 'Please select your account type.'); valid = false; }
  if (!email || !isValidEmail(email)) { showErr('loginEmail', 'loginEmailErr', 'Please enter a valid email address.'); valid = false; }
  if (!pass) { showErr('loginPass', 'loginPassErr', 'Password is required.'); valid = false; }
  if (!valid) { document.getElementById('loginAlert').classList.add('show'); return; }

  const found = USERS.find(u => u.email.toLowerCase() === email);
  if (!found) {
    document.getElementById('loginAlert').textContent = 'No account found with this email. Please register first.';
    document.getElementById('loginAlert').classList.add('show');
    showErr('loginEmail', 'loginEmailErr', 'Email not registered.');
    return;
  }
  if (found.password !== pass) {
    document.getElementById('loginAlert').textContent = 'Incorrect password. Please try again.';
    document.getElementById('loginAlert').classList.add('show');
    showErr('loginPass', 'loginPassErr', 'Incorrect password.');
    return;
  }

  currentUser = found;
  showPage('dashboard');
}

// ── REGISTER VALIDATION ──
function validateRegister() {
  let valid = true;
  const isOrg = ['ngo','corporate'].includes(selectedUserType);

  // Clear all errors
  ['regFirst','regLast','regFirmName','regOrgCounty','regEmail','regPass','regPass2'].forEach(id => {
    const el = document.getElementById(id); if (el) el.classList.remove('error');
  });
  ['regFirstErr','regLastErr','regFirmNameErr','regOrgCountyErr','regEmailErr','regPassErr','regPass2Err','regTermsErr'].forEach(id => {
    const el = document.getElementById(id); if (el) el.classList.remove('show');
  });
  document.getElementById('regAlert').classList.remove('show');

  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;
  const terms = document.getElementById('regTerms').checked;

  let firstName, lastName, initials, county;

  if (isOrg) {
    // Organisation registration — Firm Name + County
    const firmName  = document.getElementById('regFirmName').value.trim();
    const orgCounty = document.getElementById('regOrgCounty').value;
    if (!firmName) { showErr('regFirmName', 'regFirmNameErr', 'Organisation name is required.'); valid = false; }
    if (!orgCounty){ showErr('regOrgCounty', 'regOrgCountyErr', 'Please select a county.'); valid = false; }
    // Build display name from firm name
    const words = firmName.split(' ').filter(Boolean);
    firstName = words.slice(0, -1).join(' ') || firmName;
    lastName  = words.length > 1 ? words[words.length - 1] : '';
    initials  = words.slice(0, 2).map(w => w[0]).join('').toUpperCase() || firmName[0].toUpperCase();
    county    = orgCounty;
  } else {
    // Individual registration — First + Last Name
    const first = document.getElementById('regFirst').value.trim();
    const last  = document.getElementById('regLast').value.trim();
    if (!first) { showErr('regFirst', 'regFirstErr', 'First name is required.'); valid = false; }
    if (!last)  { showErr('regLast',  'regLastErr',  'Last name is required.');  valid = false; }
    firstName = first;
    lastName  = last;
    initials  = (first[0] || '') + (last[0] || '');
    initials  = initials.toUpperCase();
    county    = null;
  }

  if (!email || !isValidEmail(email)) { showErr('regEmail', 'regEmailErr', 'A valid email address is required.'); valid = false; }
  if (!pass || pass.length < 8) { showErr('regPass', 'regPassErr', 'Password must be at least 8 characters.'); valid = false; }
  if (!pass2 || pass !== pass2) { showErr('regPass2', 'regPass2Err', 'Passwords do not match.'); valid = false; }
  if (!terms) { document.getElementById('regTermsErr').classList.add('show'); valid = false; }

  if (!valid) {
    document.getElementById('regAlert').classList.add('show');
    const firstErr = document.querySelector('#page-register .form-input.error');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  if (USERS.find(u => u.email.toLowerCase() === email)) {
    document.getElementById('regAlert').textContent = 'An account with this email already exists. Please sign in.';
    document.getElementById('regAlert').classList.add('show');
    showErr('regEmail', 'regEmailErr', 'Email already registered.');
    return;
  }

  // Build the firm display name for org accounts
  const firmNameRaw = isOrg ? document.getElementById('regFirmName').value.trim() : null;

  const newUser = {
    email,
    password: pass,
    firstName,
    lastName,
    firmName: isOrg ? firmNameRaw : null,
    role: selectedUserType || 'citizen',
    specialty: null,
    county,
    experience: null,
    rating: null,
    fee: null,
    available: false,
    initials,
    avatarGrad: isOrg
      ? (selectedUserType === 'ngo' ? 'linear-gradient(135deg,#0e4d3a,#1a7a5a)' : 'linear-gradient(135deg,#1a2a5e,#2d4a9e)')
      : 'linear-gradient(135deg,var(--n600),var(--n500))'
  };
  USERS.push(newUser);
  currentUser = newUser;
  showPage('dashboard');
}

// ── Dashboard ──
let dashOpen = true;
function toggleSidebar() {
  dashOpen = !dashOpen;
  document.getElementById('dashSidebar').classList.toggle('collapsed', !dashOpen);
  document.getElementById('dashMain').classList.toggle('full', !dashOpen);
  if (window.innerWidth <= 1100) {
    document.getElementById('dashSidebar').classList.toggle('open', dashOpen);
    document.getElementById('dashSidebar').classList.remove('collapsed');
    document.getElementById('dashMain').classList.remove('full');
  }
}

const tabs = {
  overview: 'Overview', chat: 'AI Legal Chat', cases: 'My Cases',
  documents: 'Document Vault', lawyers: 'Lawyer Matching',
  health: 'Legal Health Check', assess: 'Case Assessment',
  gendoc: 'Generate Document', settings: 'Settings',
  'law-clients': 'My Clients', 'law-cases': 'Active Cases',
  'law-services': 'My Services & Rates', 'law-research': 'Legal Research',
  'law-hearings': 'Court Hearings', 'law-pending': 'Connection Requests',
  'messaging': 'Messages',
  // NGO tabs
  'ngo-overview': 'NGO Overview', 'ngo-intake': 'Case Intake Management',
  'ngo-all-intakes': 'All Case Intakes',
  'ngo-coverage': 'County Coverage Analytics', 'ngo-impact': 'Impact Reporting Suite',
  'ngo-beneficiary': 'Beneficiary Tracking', 'ngo-partners': 'Partner Network Access',
  // Corporate tabs
  'corp-overview': 'Corporate Overview', 'corp-contracts': 'Contract Intelligence AI',
  'corp-compliance': 'Compliance Monitor', 'corp-regulatory': 'Regulatory Risk Dashboard',
  'corp-workspace': 'Multi-user Workspace', 'corp-api': 'API Integration',
  // Admin tabs
  'admin-overview': 'Admin Dashboard', 'admin-users': 'User Management',
  'admin-revenue': 'Revenue Analytics', 'admin-consultations': 'Consultations',
  'admin-lawyers': 'Lawyers', 'admin-ngo': 'NGO / Probono Management',
  'admin-corp': 'Corporate / Government Management',
  'admin-settings': 'Admin Settings'
};

function switchDashTab(tab) {
  document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('panel-' + tab);
  if (panel) panel.classList.add('active');
  document.querySelectorAll('.ds-nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('onclick') && item.getAttribute('onclick').includes("'" + tab + "'"));
  });
  const titleEl = document.getElementById('dashTitle');
  const bcEl    = document.getElementById('dashBreadcrumb');
  if (titleEl) titleEl.textContent = tabs[tab] || tab;
  if (bcEl)    bcEl.textContent    = tabs[tab] || tab;
  window.scrollTo(0, 0);
  if (window.innerWidth <= 1100 && dashOpen) { toggleSidebar(); }
  // Post-switch renders
  if (tab === 'admin-overview')  { setTimeout(renderAdminOverview, 50); }
  if (tab === 'admin-users')     { setTimeout(renderAdminUserTable, 50); }
  if (tab === 'admin-lawyers')   { setTimeout(renderAdminLawyers, 50); }
  if (tab === 'admin-ngo')       { setTimeout(renderAdminNgoPanel, 50); }
  if (tab === 'admin-corp')      { setTimeout(renderAdminCorpPanel, 50); }
  if (tab === 'law-services')    { setTimeout(renderLawyerServices, 50); }
  if (tab === 'law-clients')     { setTimeout(() => { renderClientRoster(); const cl = document.getElementById('clientCountLabel'); if(cl) cl.textContent = lawyerClients.length + ' clients registered'; }, 50); }
  if (tab === 'law-hearings')    { setTimeout(renderHearingsList, 50); }
  if (tab === 'ngo-all-intakes') { setTimeout(renderAllIntakes, 50); }
  if (tab === 'messaging')       { setTimeout(() => renderMessagingPanel(activeConvId), 50); }
  if (tab === 'law-pending')     { setTimeout(renderPendingRequestsPanel, 50); }
  if (tab === 'lawyers')         { setTimeout(renderLawyerMatches, 50); }
}

// ── Dashboard Chat ──
const aiResponses = [
  "Under the <strong style='color:var(--g300)'>Distress for Rent Act (Cap. 293)</strong> and <strong>Landlord and Tenant Act</strong>, your landlord cannot evict you without serving proper notice — at least 30 days for monthly tenancy. Do you need me to draft a formal notice?",
  "Based on Kenya's <strong style='color:var(--g300)'>Employment Act 2007, Section 45</strong>, wrongful dismissal without proper cause or procedure entitles you to compensation of up to 12 months' salary. Have you been given a termination letter?",
  "For land disputes in Kenya, the <strong style='color:var(--g300)'>Land Act 2012</strong> and <strong>Environment and Land Court</strong> have jurisdiction. I recommend starting with mediation before formal litigation. Shall I research relevant precedents?",
  "I've found <strong style='color:var(--g300)'>3 relevant case precedents</strong> in the Kenya Law Reports that support your position. The strongest is <em>Muthoni v. Housing Board [2022]</em> which established tenant protections against illegal rent increases.",
  "Your case has a <strong style='color:var(--g300)'>72% success probability</strong> based on similar cases in our database. I recommend sending a formal demand letter first — I can generate one for you right now. Would you like to proceed?"
];
let aiIdx = 0;

// ── Notification System ──
const lawyerNotifications = {};

function addLawyerNotification(lawyerEmail, message, reqId) {
  if (!lawyerNotifications[lawyerEmail]) lawyerNotifications[lawyerEmail] = [];
  lawyerNotifications[lawyerEmail].push({
    message, time: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }), read: false, reqId: reqId || null
  });
  if (currentUser && currentUser.email.toLowerCase() === lawyerEmail.toLowerCase()) renderNotifPanel();
  // Update pending requests badge
  renderPendingRequests();
}

function getUnreadCount() {
  if (!currentUser || currentUser.role !== 'lawyer') return 0;
  const notifs = lawyerNotifications[currentUser.email] || [];
  return notifs.filter(n => !n.read).length;
}

function renderNotifPanel() {
  const badge = document.getElementById('notifBadge');
  const list  = document.getElementById('notifList');
  const empty = document.getElementById('notifEmpty');
  if (!badge || !list) return;

  const notifs = currentUser ? (lawyerNotifications[currentUser.email] || []) : [];
  const unread = notifs.filter(n => !n.read).length;

  if (unread > 0) { badge.textContent = unread > 9 ? '9+' : unread; badge.style.display = 'flex'; }
  else badge.style.display = 'none';

  if (notifs.length === 0) { if (empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';

  const items = [...notifs].reverse();
  list.innerHTML = items.map((n, i) => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotifRead(${notifs.length - 1 - i})">
      <div class="notif-ico">🤝</div>
      <div class="notif-body"><div class="notif-msg">${n.message}</div><div class="notif-time">${n.time}</div></div>
    </div>`).join('') + `<div class="notif-panel-view-all" onclick="clearAllNotifs()">Mark all as read</div>`;
}

function markNotifRead(idx) {
  if (!currentUser) return;
  const notifs = lawyerNotifications[currentUser.email];
  if (notifs && notifs[idx]) { notifs[idx].read = true; renderNotifPanel(); }
}

function clearAllNotifs() {
  if (!currentUser) return;
  (lawyerNotifications[currentUser.email] || []).forEach(n => n.read = true);
  renderNotifPanel();
}

function toggleNotifPanel() {
  const panel = document.getElementById('notifPanel');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) { renderNotifPanel(); setTimeout(() => clearAllNotifs(), 3000); }
}

document.addEventListener('click', e => {
  const panel = document.getElementById('notifPanel');
  const btn   = document.getElementById('notifBtn');
  if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) panel.style.display = 'none';
});

// ── Render lawyer matches ──
function renderLawyerMatches() {
  const container = document.getElementById('lawyerMatchList');
  if (!container) return;
  const lawyers = USERS.filter(u => u.role === 'lawyer');
  if (lawyers.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--s400)">No lawyers registered on the platform yet.</div>`;
    return;
  }
  container.innerHTML = lawyers.map(l => {
    const myReq = currentUser ? connectionRequests.find(r => r.fromEmail === currentUser.email && r.toEmail === l.email) : null;
    const status = myReq ? myReq.status : null;
    let btnHtml = '';
    if (status === 'accepted') {
      const conn = acceptedConnections.find(c => c.clientEmail === (currentUser&&currentUser.email) && c.lawyerEmail === l.email);
      btnHtml = `<button class="btn btn-teal sm" onclick="if('${conn?conn.id:''}'){openMessagingWith('${conn?conn.id:''}');}">💬 Message</button>`;
    } else if (status === 'pending') {
      btnHtml = `<button class="btn btn-ghost sm" disabled style="opacity:.5;cursor:default">⏳ Pending…</button>`;
    } else if (status === 'declined') {
      btnHtml = `<button class="btn btn-outline sm" onclick="connectToLawyer('${l.email}','${l.firstName}','${l.lastName}',${l.available})">↩ Try Again</button>`;
    } else {
      btnHtml = `<button class="btn ${l.available ? 'btn-gold' : 'btn-ghost'} sm" onclick="connectToLawyer('${l.email}','${l.firstName}','${l.lastName}',${l.available})">${l.available ? 'Connect' : 'Request'}</button>`;
    }
    return `
    <div class="match-card">
      <div class="match-av" style="background:${l.avatarGrad}">${l.initials}</div>
      <div style="flex:1">
        <div class="match-name">Adv. ${l.firstName} ${l.lastName}</div>
        <div class="match-spec">${l.specialty || 'General Practice'}</div>
        <div class="match-meta">${l.county || 'Kenya'} · ${l.experience ? l.experience + ' yrs exp' : 'New'} · ${l.rating ? l.rating + '★' : 'No rating yet'} · ${l.fee || 'TBD'}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
        <div class="match-badge ${l.available ? 'avail' : 'busy'}">${l.available ? 'Available' : 'Busy'}</div>
        ${btnHtml}
      </div>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════════════════
// CONNECTION REQUEST SYSTEM
// ════════════════════════════════════════════════════

// Each connection request:
// { id, fromEmail, fromName, fromRole, toEmail, toLawyerName, caseDesc, caseType, status, time, docs[] }
const connectionRequests = [];
// Accepted connections (for messaging): { id, clientEmail, clientName, lawyerEmail, lawyerName, time }
const acceptedConnections = [];
// Messages: keyed by connectionId → [{ sender, text, time }]
const connectionMessages = {};

function connectToLawyer(lawyerEmail, firstName, lastName, available) {
  if (!currentUser) return;
  // Check if already requested
  const existing = connectionRequests.find(r => r.fromEmail === currentUser.email && r.toEmail === lawyerEmail && r.status !== 'declined');
  if (existing) {
    if (existing.status === 'accepted') {
      showToast(`✅ You are already connected with Adv. ${firstName} ${lastName}.`);
    } else {
      showToast(`⏳ Request already sent to Adv. ${firstName} ${lastName} — awaiting response.`);
    }
    return;
  }
  // Open the connection request modal
  openConnectRequestModal(lawyerEmail, firstName, lastName, available);
}

function openConnectRequestModal(lawyerEmail, firstName, lastName, available) {
  const el = document.getElementById('connectRequestOverlay');
  if (!el) return;
  document.getElementById('crLawyerName').textContent = `Adv. ${firstName} ${lastName}`;
  document.getElementById('crLawyerEmail').value = lawyerEmail;
  document.getElementById('crCaseType').value = '';
  document.getElementById('crCaseDesc').value = '';
  document.getElementById('crSubmitBtn').textContent = available ? '📨 Send Connection Request' : '📨 Send Request (Lawyer is Busy)';
  // Clear any previous file list
  const fl = document.getElementById('crFileList');
  if (fl) fl.innerHTML = '';
  _crFiles = [];
  el.classList.add('open');
}
function closeConnectRequestModal() {
  document.getElementById('connectRequestOverlay').classList.remove('open');
}
function closeConnectRequestOverlay(e) {
  if (e.target === document.getElementById('connectRequestOverlay')) closeConnectRequestModal();
}

let _crFiles = [];
function handleCrFileUpload(input) {
  const files = Array.from(input.files);
  files.forEach(f => {
    _crFiles.push(f);
    const ext = f.name.split('.').pop().toUpperCase();
    const icons = { PDF:'📜', DOCX:'📝', DOC:'📝', PNG:'🖼️', JPG:'🖼️', JPEG:'🖼️', TXT:'📄' };
    const size = f.size > 1024*1024 ? (f.size/(1024*1024)).toFixed(1)+' MB' : (f.size/1024).toFixed(0)+' KB';
    const row = document.createElement('div');
    row.className = 'nc-doc-row';
    row.innerHTML = `<span>${icons[ext]||'📄'}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.name}</span><span style="color:var(--s400);font-size:.72rem;flex-shrink:0">${size}</span><button onclick="removeCrFile(this,'${f.name}')">✕</button>`;
    document.getElementById('crFileList').appendChild(row);
  });
  input.value = '';
}
function removeCrFile(btn, name) {
  _crFiles = _crFiles.filter(f => f.name !== name);
  btn.parentElement.remove();
}

function submitConnectRequest() {
  const lawyerEmail = document.getElementById('crLawyerEmail').value;
  const caseType    = document.getElementById('crCaseType').value;
  const caseDesc    = document.getElementById('crCaseDesc').value.trim();
  if (!caseType) { showToast('⚠️ Please select a case type.'); return; }
  if (!caseDesc) { showToast('⚠️ Please describe your case briefly.'); return; }
  const lawyer = USERS.find(u => u.email === lawyerEmail);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-KE', { hour:'2-digit', minute:'2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
  const reqId = 'req_' + Date.now();
  const req = {
    id: reqId,
    fromEmail: currentUser.email,
    fromName: currentUser.firstName + ' ' + currentUser.lastName,
    fromRole: capitalise(currentUser.role || 'Citizen'),
    fromInitials: currentUser.initials || (currentUser.firstName[0]+currentUser.lastName[0]).toUpperCase(),
    fromGrad: currentUser.avatarGrad || 'linear-gradient(135deg,var(--n600),var(--n500))',
    toEmail: lawyerEmail,
    toLawyerName: lawyer ? `${lawyer.firstName} ${lawyer.lastName}` : 'Lawyer',
    caseType, caseDesc,
    docs: _crFiles.map(f => ({
      name: f.name, objectURL: URL.createObjectURL(f),
      size: f.size > 1024*1024 ? (f.size/(1024*1024)).toFixed(1)+' MB' : (f.size/1024).toFixed(0)+' KB',
      ext: f.name.split('.').pop().toUpperCase()
    })),
    status: 'pending',
    time: timeStr, date: dateStr
  };
  connectionRequests.push(req);

  // Notify lawyer
  const notifMsg = `🤝 <strong>${req.fromName}</strong> (${req.fromRole}) has sent you a connection request — <em>${caseType}</em>. <a href="#" onclick="event.preventDefault();openLawyerRequestModal('${reqId}')" style="color:var(--g300);font-weight:700">View Request →</a>`;
  addLawyerNotification(lawyerEmail, notifMsg, reqId);

  closeConnectRequestModal();
  showToast(`📨 Request sent to Adv. ${lawyer ? lawyer.firstName : ''} ${lawyer ? lawyer.lastName : ''}! Awaiting their response.`);

  // If client has a notification system too, add to client's store
  if (!lawyerNotifications[currentUser.email]) lawyerNotifications[currentUser.email] = [];
  lawyerNotifications[currentUser.email].push({
    message: `📨 Your connection request to <strong>Adv. ${req.toLawyerName}</strong> (${caseType}) has been sent — awaiting acceptance.`,
    time: timeStr, read: false, reqId
  });
}

// ── Lawyer: Open incoming request modal ──
function openLawyerRequestModal(reqId) {
  const req = connectionRequests.find(r => r.id === reqId);
  if (!req) return;
  const overlay = document.getElementById('lawyerReqOverlay');
  const body    = document.getElementById('lawyerReqBody');
  if (!overlay || !body) return;
  document.getElementById('lawyerReqTitle').textContent = `📨 Connection Request — ${req.fromName}`;
  const docsHtml = req.docs.length ? req.docs.map(d => {
    const icons = { PDF:'📜', DOCX:'📝', DOC:'📝', PNG:'🖼️', JPG:'🖼️', JPEG:'🖼️', TXT:'📄' };
    return `<div class="cf-doc-item" style="cursor:pointer" onclick="viewUploadedDoc('${d.objectURL}','${d.name}','${['PNG','JPG','JPEG'].includes(d.ext)?'image':d.ext==='PDF'?'pdf':'other'}')">
      <div class="cf-doc-icon">${icons[d.ext]||'📄'}</div>
      <div><div class="cf-doc-name">${d.name}</div><div class="cf-doc-meta">${d.size}</div></div>
      <div style="margin-left:auto"><button class="btn btn-ghost sm" style="padding:4px 10px;font-size:.72rem" onclick="event.stopPropagation();viewUploadedDoc('${d.objectURL}','${d.name}','${['PNG','JPG','JPEG'].includes(d.ext)?'image':d.ext==='PDF'?'pdf':'other'}')">👁 View</button></div>
    </div>`;
  }).join('') : `<div style="color:var(--s400);font-size:.82rem;padding:10px 0">No documents attached.</div>`;

  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--gbord)">
      <div style="width:52px;height:52px;border-radius:50%;background:${req.fromGrad};display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:700;color:#fff;flex-shrink:0">${req.fromInitials}</div>
      <div>
        <div style="font-size:1.05rem;font-weight:700;color:#fff">${req.fromName}</div>
        <div style="font-size:.8rem;color:var(--g400);font-weight:600">${req.fromRole} · ${req.date} at ${req.time}</div>
      </div>
      <div style="margin-left:auto"><span style="padding:4px 12px;border-radius:20px;font-size:.72rem;font-weight:700;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.25);color:var(--warn)">Pending</span></div>
    </div>
    <div class="cf-section-title">Case Type</div>
    <div style="background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r10);padding:12px 14px;font-size:.9rem;font-weight:600;color:var(--g300);margin-bottom:14px">${req.caseType}</div>
    <div class="cf-section-title">Case Description</div>
    <div style="background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r10);padding:14px;font-size:.86rem;color:var(--s300);line-height:1.7;margin-bottom:16px">${req.caseDesc}</div>
    <div class="cf-section-title">Supporting Documents (${req.docs.length})</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">${docsHtml}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-gold" style="flex:1" onclick="acceptConnectionRequest('${reqId}')">✅ Accept Request</button>
      <button class="btn btn-danger" onclick="declineConnectionRequest('${reqId}')">✗ Decline</button>
      <button class="btn btn-teal" onclick="viewClientProfile('${req.fromEmail}')">👁 View Full Profile</button>
    </div>`;
  document.getElementById('lawyerReqCurrId').value = reqId;
  overlay.classList.add('open');
}
function closeLawyerReqModal() { document.getElementById('lawyerReqOverlay').classList.remove('open'); }
function closeLawyerReqOverlay(e) { if (e.target === document.getElementById('lawyerReqOverlay')) closeLawyerReqModal(); }

function acceptConnectionRequest(reqId) {
  const req = connectionRequests.find(r => r.id === reqId);
  if (!req) return;
  req.status = 'accepted';
  const connId = 'conn_' + Date.now();
  acceptedConnections.push({
    id: connId, reqId,
    clientEmail: req.fromEmail, clientName: req.fromName,
    lawyerEmail: req.toEmail, lawyerName: req.toLawyerName,
    caseType: req.caseType, time: new Date().toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'})
  });
  connectionMessages[connId] = [];
  closeLawyerReqModal();
  showToast(`✅ Connected with ${req.fromName}! They have been notified.`);
  // Notify client
  if (!lawyerNotifications[req.fromEmail]) lawyerNotifications[req.fromEmail] = [];
  lawyerNotifications[req.fromEmail].push({
    message: `🎉 <strong>Adv. ${req.toLawyerName}</strong> has <strong style="color:var(--suc)">accepted</strong> your connection request for <em>${req.caseType}</em>. You can now message them directly. <a href="#" onclick="event.preventDefault();switchDashTab('messaging')" style="color:var(--g300);font-weight:700">Open Chat →</a>`,
    time: new Date().toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'}), read: false
  });
  if (currentUser && currentUser.email === req.toEmail) renderNotifPanel();
  // Refresh pending requests count
  renderPendingRequests();
}

function declineConnectionRequest(reqId) {
  const req = connectionRequests.find(r => r.id === reqId);
  if (!req) return;
  req.status = 'declined';
  closeLawyerReqModal();
  showToast('Request declined.');
  if (!lawyerNotifications[req.fromEmail]) lawyerNotifications[req.fromEmail] = [];
  lawyerNotifications[req.fromEmail].push({
    message: `❌ <strong>Adv. ${req.toLawyerName}</strong> is unable to take your case at this time. Please try connecting with another advocate.`,
    time: new Date().toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'}), read: false
  });
  renderPendingRequests();
}

// ── Render pending requests for lawyer ──
function renderPendingRequests() {
  if (!currentUser || currentUser.role !== 'lawyer') return;
  const myReqs = connectionRequests.filter(r => r.toEmail === currentUser.email && r.status === 'pending');
  const badge = document.getElementById('pendingReqBadge');
  if (badge) { badge.textContent = myReqs.length; badge.style.display = myReqs.length ? 'flex' : 'none'; }
}

// ── View client's full dashboard profile (lawyer read-only) ──
function viewClientProfile(clientEmail) {
  const client = USERS.find(u => u.email === clientEmail);
  const req = connectionRequests.find(r => r.fromEmail === clientEmail && r.toEmail === (currentUser && currentUser.email));
  const overlay = document.getElementById('clientProfileOverlay');
  const body    = document.getElementById('clientProfileBody');
  if (!overlay || !body) return;

  const initials = client ? client.initials : (clientEmail[0]+clientEmail[1]).toUpperCase();
  const grad = client ? (client.avatarGrad || 'linear-gradient(135deg,var(--n600),var(--n500))') : 'linear-gradient(135deg,var(--n600),var(--n500))';
  const name = client ? `${client.firstName} ${client.lastName}` : (req ? req.fromName : clientEmail);
  const role = client ? capitalise(client.role) : (req ? req.fromRole : 'Client');

  const docsHtml = req && req.docs.length ? `
    <div class="cf-section-title">Uploaded Case Documents</div>
    ${req.docs.map(d => {
      const icons = { PDF:'📜', DOCX:'📝', DOC:'📝', PNG:'🖼️', JPG:'🖼️', JPEG:'🖼️', TXT:'📄' };
      return `<div class="cf-doc-item" onclick="viewUploadedDoc('${d.objectURL}','${d.name}','${['PNG','JPG','JPEG'].includes(d.ext)?'image':d.ext==='PDF'?'pdf':'other'}')">
        <div class="cf-doc-icon">${icons[d.ext]||'📄'}</div>
        <div><div class="cf-doc-name">${d.name}</div><div class="cf-doc-meta">${d.size}</div></div>
        <button class="btn btn-ghost sm" style="margin-left:auto;padding:4px 10px;font-size:.72rem" onclick="event.stopPropagation();viewUploadedDoc('${d.objectURL}','${d.name}','${['PNG','JPG','JPEG'].includes(d.ext)?'image':d.ext==='PDF'?'pdf':'other'}')">👁 View</button>
      </div>`;
    }).join('')}` : '';

  const conn = acceptedConnections.find(c => c.clientEmail === clientEmail && c.lawyerEmail === (currentUser && currentUser.email));

  body.innerHTML = `
    <div class="cf-header-row">
      <div class="cf-av" style="background:${grad}">${initials}</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="cf-name">${name}</div>
          <span style="font-size:.72rem;padding:3px 10px;border-radius:20px;font-weight:700;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);color:var(--suc)">Connected</span>
        </div>
        <div class="cf-meta">${role} · ${client ? (client.county || 'Kenya') : ''}</div>
      </div>
    </div>
    ${req ? `
    <div class="cf-section-title">Case Matter</div>
    <div class="cf-detail-grid">
      <div class="cf-detail-item"><div class="cf-detail-label">Case Type</div><div class="cf-detail-value" style="color:var(--g300)">${req.caseType}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Request Date</div><div class="cf-detail-value">${req.date}</div></div>
    </div>
    <div class="cf-section-title">Client's Case Description</div>
    <div style="padding:12px 14px;background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r10);font-size:.86rem;color:var(--s300);line-height:1.7;margin-bottom:14px">${req.caseDesc}</div>
    ${docsHtml}` : ''}
    ${client ? `
    <div class="cf-section-title" style="margin-top:16px">Platform Profile</div>
    <div class="cf-detail-grid">
      <div class="cf-detail-item"><div class="cf-detail-label">Email</div><div class="cf-detail-value">${client.email}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Role</div><div class="cf-detail-value">${capitalise(client.role)}</div></div>
      ${client.county ? `<div class="cf-detail-item"><div class="cf-detail-label">County</div><div class="cf-detail-value">${client.county}</div></div>` : ''}
    </div>` : ''}
    <div style="display:flex;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--gbord)">
      ${conn ? `<button class="btn btn-gold" style="flex:1" onclick="closeClientProfileModal();openMessagingWith('${conn.id}')">💬 Message ${name.split(' ')[0]}</button>` : ''}
      <button class="btn btn-ghost" onclick="closeClientProfileModal()">Close</button>
    </div>`;
  overlay.classList.add('open');
}
function closeClientProfileModal() { document.getElementById('clientProfileOverlay').classList.remove('open'); }
function closeClientProfileOverlay(e) { if (e.target === document.getElementById('clientProfileOverlay')) closeClientProfileModal(); }

// ════════════════════════════════════════════════════
// MESSAGING SYSTEM
// ════════════════════════════════════════════════════
let activeConvId = null;

function openMessagingWith(connId) {
  activeConvId = connId;
  switchDashTab('messaging');
  setTimeout(() => renderMessagingPanel(connId), 50);
}

function renderMessagingPanel(connId) {
  const conn = connId ? acceptedConnections.find(c => c.id === connId) : null;
  const convListEl = document.getElementById('msgConvList');
  const chatAreaEl = document.getElementById('msgChatArea');
  if (!convListEl) return;

  // Build conversation list for current user
  const myConvs = acceptedConnections.filter(c =>
    (currentUser && (c.clientEmail === currentUser.email || c.lawyerEmail === currentUser.email))
  );

  convListEl.innerHTML = myConvs.length ? myConvs.map(c => {
    const isLawyer = currentUser && currentUser.role === 'lawyer';
    const otherName = isLawyer ? c.clientName : `Adv. ${c.lawyerName}`;
    const msgs = connectionMessages[c.id] || [];
    const lastMsg = msgs.length ? msgs[msgs.length-1] : null;
    const isActive = c.id === activeConvId;
    return `<div class="msg-conv-item ${isActive?'active':''}" onclick="openMessagingWith('${c.id}')">
      <div class="msg-conv-av">${otherName.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
      <div style="flex:1;min-width:0">
        <div class="msg-conv-name">${otherName}</div>
        <div class="msg-conv-preview">${lastMsg ? lastMsg.text.substring(0,42)+'…' : c.caseType}</div>
      </div>
      <div class="msg-conv-time">${lastMsg ? lastMsg.time : c.time}</div>
    </div>`;
  }).join('') : `<div style="text-align:center;padding:32px 16px;color:var(--s400);font-size:.84rem">No conversations yet.<br/>Accept a connection request to start messaging.</div>`;

  if (!chatAreaEl) return;
  if (!conn) {
    chatAreaEl.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--s400)"><div style="font-size:3rem;margin-bottom:16px;opacity:.3">💬</div><div style="font-size:.92rem;font-weight:600;color:var(--s200);margin-bottom:8px">Select a conversation</div><div style="font-size:.82rem">Choose a connected contact to start messaging.</div></div>`;
    return;
  }

  const isLawyer = currentUser && currentUser.role === 'lawyer';
  const otherName = isLawyer ? conn.clientName : `Adv. ${conn.lawyerName}`;
  const msgs = connectionMessages[conn.id] || [];

  chatAreaEl.innerHTML = `
    <div class="msg-chat-header">
      <div class="msg-chat-av">${otherName.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
      <div>
        <div style="font-size:.92rem;font-weight:700;color:#fff">${otherName}</div>
        <div style="font-size:.75rem;color:var(--g400);font-weight:600">${conn.caseType}</div>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px">
        ${isLawyer ? `<button class="btn btn-ghost sm" onclick="viewClientProfile('${conn.clientEmail}')">👁 View Profile</button>` : ''}
      </div>
    </div>
    <div class="msg-messages" id="msgMessages_${conn.id}">
      ${msgs.length === 0 ? `<div style="text-align:center;padding:32px;color:var(--s400);font-size:.82rem">No messages yet — say hello!</div>` :
        msgs.map(m => `
          <div class="msg-bubble-wrap ${m.senderEmail === (currentUser && currentUser.email) ? 'me' : 'them'}">
            <div class="msg-bubble ${m.senderEmail === (currentUser && currentUser.email) ? 'mine' : 'theirs'}">${m.text}</div>
            <div class="msg-time">${m.time}</div>
          </div>`).join('')}
    </div>
    <div class="msg-input-bar">
      <input class="msg-input" id="msgInput_${conn.id}" type="text" placeholder="Type a message…" onkeydown="if(event.key==='Enter')sendMessage('${conn.id}')"/>
      <button class="btn btn-gold" style="padding:10px 18px;flex-shrink:0" onclick="sendMessage('${conn.id}')">Send ↑</button>
    </div>`;
  // Scroll to bottom
  setTimeout(() => {
    const msgEl = document.getElementById('msgMessages_' + conn.id);
    if (msgEl) msgEl.scrollTop = msgEl.scrollHeight;
  }, 50);
}

function sendMessage(connId) {
  const input = document.getElementById('msgInput_' + connId);
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  if (!connectionMessages[connId]) connectionMessages[connId] = [];
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-KE', { hour:'2-digit', minute:'2-digit' });
  connectionMessages[connId].push({
    senderEmail: currentUser ? currentUser.email : '',
    senderName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'User',
    text, time: timeStr
  });
  input.value = '';
  // Re-render chat area
  const conn = acceptedConnections.find(c => c.id === connId);
  if (conn) {
    const isLawyer = currentUser && currentUser.role === 'lawyer';
    const otherEmail = isLawyer ? conn.clientEmail : conn.lawyerEmail;
    // Notify the other party
    if (!lawyerNotifications[otherEmail]) lawyerNotifications[otherEmail] = [];
    const otherName = isLawyer ? conn.clientName : `Adv. ${conn.lawyerName}`;
    const senderName = currentUser ? currentUser.firstName : 'Someone';
    lawyerNotifications[otherEmail].push({
      message: `💬 New message from <strong>${senderName}</strong>: "${text.substring(0,40)}${text.length>40?'…':''}" <a href="#" onclick="event.preventDefault();switchDashTab('messaging')" style="color:var(--g300)">Reply →</a>`,
      time: timeStr, read: false
    });
    if (currentUser && currentUser.email !== otherEmail) renderNotifPanel();
  }
  renderMessagingPanel(connId);
}

// ── Document Upload ──
function triggerDocUpload() { const inp = document.getElementById('docUploadInput'); if (inp) inp.click(); }
function handleDocUpload(input) {
  const files = Array.from(input.files);
  if (!files.length) return;
  const list = document.getElementById('docUploadedList');
  const empty = document.getElementById('docEmptyState');
  if (empty) empty.style.display = 'none';
  files.forEach(file => {
    const ext = file.name.split('.').pop().toUpperCase();
    const size = file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : (file.size / 1024).toFixed(0) + ' KB';
    const icons = { PDF: '📜', DOCX: '📝', DOC: '📝', PNG: '🖼️', JPG: '🖼️', JPEG: '🖼️' };
    const ico = icons[ext] || '📄';
    const objectURL = URL.createObjectURL(file);
    const isImage = ['PNG','JPG','JPEG','GIF','WEBP'].includes(ext);
    const isPDF   = ext === 'PDF';
    const row = document.createElement('div');
    row.className = 'doc-row';
    row.style.alignItems = 'center';
    row.innerHTML = `
      <div class="doc-ico">${ico}</div>
      <div style="flex:1;min-width:0">
        <div class="doc-row-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${file.name}</div>
        <div class="doc-row-meta">Uploaded just now · ${size}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
        <button class="btn btn-ghost sm" style="padding:6px 12px;font-size:.75rem" onclick="viewUploadedDoc('${objectURL}','${file.name}','${isImage ? 'image' : isPDF ? 'pdf' : 'other'}')">👁 View</button>
        <a href="${objectURL}" download="${file.name}" class="btn btn-ghost sm" style="padding:6px 12px;font-size:.75rem;text-decoration:none">⬇ Download</a>
        <div class="doc-chip ok">✓ Saved</div>
      </div>`;
    if (list) list.prepend(row);
  });
  input.value = '';
  showToast('📁 ' + files.length + ' file' + (files.length > 1 ? 's' : '') + ' uploaded to Document Vault');
}

function viewUploadedDoc(url, name, type) {
  const existing = document.getElementById('docViewerOverlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'docViewerOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(8px);z-index:11000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  let contentHTML = '';
  if (type === 'image') contentHTML = `<img src="${url}" alt="${name}" style="max-width:100%;max-height:70vh;border-radius:12px;border:1px solid rgba(255,255,255,.1)"/>`;
  else if (type === 'pdf') contentHTML = `<iframe src="${url}" style="width:min(900px,90vw);height:70vh;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:#fff"></iframe>`;
  else contentHTML = `<div style="background:var(--surf2);border:1px solid var(--gbord);border-radius:16px;padding:40px;text-align:center;max-width:420px"><div style="font-size:3rem;margin-bottom:16px">📄</div><div style="font-size:.95rem;font-weight:600;color:#fff;margin-bottom:8px">${name}</div><div style="font-size:.82rem;color:var(--s400);margin-bottom:24px">This file type cannot be previewed in the browser.</div><a href="${url}" download="${name}" class="btn btn-gold" style="text-decoration:none;display:inline-flex;align-items:center;gap:8px">⬇ Download to View</a></div>`;
  overlay.innerHTML = `<div style="width:100%;max-width:960px;display:flex;flex-direction:column;gap:14px"><div style="display:flex;align-items:center;justify-content:space-between;padding:0 4px"><div style="font-size:.88rem;font-weight:600;color:var(--s200);display:flex;align-items:center;gap:8px"><span>📄</span><span style="max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span></div><button onclick="document.getElementById('docViewerOverlay').remove()" style="background:var(--surf3);border:1px solid var(--gbord);border-radius:8px;color:var(--s300);padding:6px 14px;cursor:pointer;font-size:.82rem;font-family:var(--sans);transition:background .2s">✕ Close</button></div><div style="display:flex;justify-content:center">${contentHTML}</div></div>`;
  document.body.appendChild(overlay);
}

// ── Toast ──
function showToast(msg) {
  let toast = document.getElementById('nomosToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'nomosToast';
    toast.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--surf2);border:1px solid var(--gbord-g);border-radius:var(--r12);padding:13px 22px;font-size:.86rem;color:var(--g300);font-weight:600;z-index:9999;transition:transform .35s var(--ease),opacity .35s;opacity:0;pointer-events:none;box-shadow:0 12px 36px rgba(0,0,0,.5)';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(80px)'; }, 3000);
}

// ── Case Assessment ──
function runAssessment() {
  const btn = document.getElementById('assessBtn');
  btn.textContent = '🧠 Analysing…'; btn.disabled = true;
  setTimeout(() => {
    btn.textContent = '🔍 Run AI Assessment'; btn.disabled = false;
    document.getElementById('assessResult').style.display = 'block';
  }, 2200);
}

// ── Generate Document ──
function generateDoc() {
  const formEl = document.getElementById('gendoc-' + currentDocType);
  if (!formEl) return;
  formEl.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
  let hasEmpty = false;
  formEl.querySelectorAll('.form-group').forEach(group => {
    if (group.querySelector('.req')) {
      const input = group.querySelector('.form-input');
      if (input) {
        const val = input.tagName === 'SELECT' ? input.value : (input.value || '').trim();
        if (!val) { input.classList.add('error'); hasEmpty = true; }
      }
    }
  });
  if (hasEmpty) { showToast('⚠️ Please fill in all required (*) fields before generating.'); const firstErr = formEl.querySelector('.form-input.error'); if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  const btn = document.getElementById('genBtn');
  btn.textContent = '⏳ Generating…'; btn.disabled = true;
  setTimeout(() => {
    btn.textContent = '📄 Generate Document'; btn.disabled = false;
    generateDocPDF(currentDocType);
    document.getElementById('genResult').style.display = 'block';
    document.getElementById('genResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 1800);
}

function getInputVal(formEl, label) {
  const groups = formEl.querySelectorAll('.form-group');
  for (const g of groups) {
    const lbl = g.querySelector('.form-label');
    if (lbl && lbl.textContent.replace('*','').trim().toLowerCase() === label.toLowerCase()) {
      const inp = g.querySelector('.form-input');
      return inp ? (inp.value || '') : '';
    }
  }
  return '';
}

function collectFormData(docType) {
  const formEl = document.getElementById('gendoc-' + docType);
  if (!formEl) return {};
  const data = {};
  formEl.querySelectorAll('.form-group').forEach(g => {
    const lbl = g.querySelector('.form-label');
    const inp = g.querySelector('.form-input');
    if (lbl && inp) {
      const key = lbl.textContent.replace('*','').trim();
      data[key] = inp.value || '';
    }
  });
  return data;
}

function generateDocPDF(docType) {
  const formEl = document.getElementById('gendoc-' + docType);
  if (!formEl) return;
  const d = collectFormData(docType);
  const dateStr = getCurrentDateStr();
  const userName = currentUser ? (currentUser.firstName + ' ' + currentUser.lastName) : 'User';
  let content = '';
  const title = DOC_TITLES[docType] || docType;

  // Common header
  const headerHTML = `
    <div class="header-block">
      <div class="seal">⚖️</div>
      <h1>Nomos AI Pro</h1>
      <div class="subtitle">${title}</div>
      <div class="subtitle" style="margin-top:6px;font-size:10pt;color:#888">Prepared: ${dateStr} | Generated by: ${userName}</div>
    </div>`;

  if (docType === 'tenancy') {
    const inputs = formEl.querySelectorAll('.form-input');
    const vals = Array.from(inputs).map(i => i.value || '___________');
    content = headerHTML + `
    <p class="constitutional-ref">This Tenancy Agreement is prepared pursuant to the Landlord and Tenant (Shops, Hotels and Catering Establishments) Act (Cap. 301), the Rent Restriction Act (Cap. 296), and Articles 40 and 43 of the Constitution of Kenya 2010.</p>
    <h2>TENANCY AGREEMENT</h2>
    <p>THIS TENANCY AGREEMENT is made on <strong>${dateStr}</strong> between:</p>
    <p><strong>LANDLORD:</strong> ${vals[0] || '___________'} (hereinafter "the Landlord")</p>
    <p><strong>TENANT:</strong> ${vals[1] || '___________'} (hereinafter "the Tenant")</p>
    <h2>1. Property</h2>
    <p>The Landlord agrees to let and the Tenant agrees to take the premises situated at: <strong>${vals[2] || '___________'}</strong></p>
    <h2>2. Term & Rent</h2>
    <p>The tenancy shall commence on <strong>${vals[4] || '___________'}</strong> for a period of <strong>${vals[5] || '1 year'}</strong>.</p>
    <p>Monthly rent: <strong>KES ${vals[3] || '___________'}</strong>, payable on the 1st of each month. Security deposit: <strong>${vals[6] || '2 months'}</strong> rent.</p>
    <h2>3. Obligations of the Parties</h2>
    <p>3.1 The Landlord shall: maintain the premises in habitable condition; not harass or unlawfully evict the Tenant; give at least one (1) month written notice of any rent increase.</p>
    <p>3.2 The Tenant shall: pay rent promptly; keep premises clean; not sublet without written consent; not cause nuisance; vacate on termination.</p>
    <h2>4. Termination</h2>
    <p>Either party may terminate this agreement by giving one (1) month written notice as required under the Distress for Rent Act (Cap. 293). Eviction without court order is illegal under Kenyan law.</p>
    <h2>5. Special Conditions</h2>
    <p>${vals[7] || 'None.'}</p>
    <h2>6. Governing Law</h2>
    <p>This agreement is governed by the Laws of Kenya including the Landlord and Tenant Act and the Constitution of Kenya 2010.</p>
    <div class="sig-block">
      <div class="sig-line">Landlord Signature<br/>Name: ${vals[0] || '___'}<br/>ID: ___________<br/>Date: ___________</div>
      <div class="sig-line">Tenant Signature<br/>Name: ${vals[1] || '___'}<br/>ID: ___________<br/>Date: ___________</div>
      <div class="sig-line">Witness Signature<br/>Name: ___________<br/>Date: ___________</div>
    </div>`;
  } else if (docType === 'demand') {
    const inputs = formEl.querySelectorAll('.form-input');
    const vals = Array.from(inputs).map(i => i.value || '___________');
    content = headerHTML + `
    <p class="constitutional-ref">This Demand Letter is issued pursuant to the Law of Contract Act (Cap. 23) and Articles 48 and 50 of the Constitution of Kenya 2010 — access to justice and fair hearing.</p>
    <p style="text-align:right"><strong>${dateStr}</strong></p>
    <p><strong>FROM:</strong> ${vals[0] || '___________'}<br/>ID/Passport: ${vals[1] || '___________'}<br/>Address: ${vals[2] || '___________'}<br/>Email: ${vals[4] || '___________'} | Tel: ${vals[5] || '___________'}</p>
    <p style="margin-top:14px"><strong>TO:</strong> ${vals[7] || '___________'}<br/>Address: ${vals[9] || '___________'}</p>
    <p><strong>RE: FORMAL DEMAND LETTER — WITHOUT PREJUDICE</strong></p>
    <p>We write on behalf of the above-named claimant to formally demand that you immediately remedy the breach described herein:</p>
    <h2>PARTICULARS OF CLAIM</h2>
    <p>${vals[12] || '___________'}</p>
    <p>Amount owed: <strong>KES ${vals[10] || '___________'}</strong> | Date of default: <strong>${vals[11] || '___________'}</strong></p>
    <h2>DEMAND</h2>
    <p>TAKE NOTICE that unless payment / remedy is made within <strong>FOURTEEN (14) DAYS</strong> of the date of this letter, we shall, without further notice, institute legal proceedings against you in the competent court, seeking:</p>
    <p>a) The sum of KES ${vals[10] || '___________'} together with interest at court rates;<br/>b) General damages;<br/>c) Legal costs of and incidental to these proceedings.</p>
    <p class="constitutional-ref">Pursuant to Article 159(2)(c) of the Constitution of Kenya 2010, we encourage resolution of this matter without recourse to litigation.</p>
    <div class="sig-block">
      <div class="sig-line">Claimant / Advocate Signature<br/>Name: ${vals[0] || '___'}<br/>Date: ___________</div>
    </div>`;
  } else if (docType === 'nda') {
    const inputs = formEl.querySelectorAll('.form-input');
    const vals = Array.from(inputs).map(i => i.value || '___________');
    content = headerHTML + `
    <p class="constitutional-ref">This Non-Disclosure Agreement is governed by the Law of Contract Act (Cap. 23), the Data Protection Act 2019, and Articles 31 and 40 of the Constitution of Kenya 2010 — right to privacy and property.</p>
    <h2>NON-DISCLOSURE AGREEMENT</h2>
    <p>THIS NON-DISCLOSURE AGREEMENT ("Agreement") is entered into on <strong>${dateStr}</strong> between:</p>
    <p><strong>DISCLOSING PARTY:</strong> ${vals[0] || '___________'} (Registration/ID: ${vals[1] || '___'}, KRA PIN: ${vals[2] || '___'})<br/>Address: ${vals[4] || '___________'}</p>
    <p><strong>RECEIVING PARTY:</strong> ${vals[7] || '___________'} (Registration/ID: ${vals[8] || '___'}, KRA PIN: ${vals[9] || '___'})<br/>Address: ${vals[11] || '___________'}</p>
    <h2>1. Purpose</h2>
    <p>${vals[13] || '___________'}</p>
    <h2>2. Confidential Information</h2>
    <p>All technical, commercial, financial, legal, or other information disclosed by the Disclosing Party, whether oral, written, or in electronic form, is deemed confidential.</p>
    <h2>3. Obligations</h2>
    <p>The Receiving Party shall: (a) keep all confidential information strictly secret; (b) not disclose to any third party without prior written consent; (c) use only for the stated Purpose; (d) apply no less than reasonable care to protect the information.</p>
    <h2>4. Duration</h2>
    <p>This Agreement shall remain in force for <strong>${vals[14] || '2 years'}</strong> from the date of execution.</p>
    <h2>5. Governing Law & Jurisdiction</h2>
    <p>This Agreement is governed by the <strong>Laws of Kenya</strong>. Any disputes shall be resolved before the competent courts of Kenya or through arbitration under the Arbitration Act 1995.</p>
    <div class="sig-block">
      <div class="sig-line">Disclosing Party<br/>${vals[0] || '___'}<br/>Date: ___________</div>
      <div class="sig-line">Receiving Party<br/>${vals[7] || '___'}<br/>Date: ___________</div>
      <div class="sig-line">Witness<br/>Name: ___________<br/>Date: ___________</div>
    </div>`;
  } else if (docType === 'affidavit') {
    const inputs = formEl.querySelectorAll('.form-input');
    const vals = Array.from(inputs).map(i => i.value || '___________');
    const affType = (document.getElementById('affidavitTypeSelect') || {}).value || 'general';
    content = headerHTML + `
    <p class="constitutional-ref">This Affidavit is sworn pursuant to the Oaths and Statutory Declarations Act (Cap. 15) and Rule 7 of the Civil Procedure Rules 2010.</p>
    <h2>REPUBLIC OF KENYA</h2>
    <h3>AFFIDAVIT OF ${vals[0] ? vals[0].toUpperCase() : '___________'}</h3>
    <p>I, <strong>${vals[0] || '___________'}</strong>, holder of National ID No. <strong>${vals[1] || '___________'}</strong>, aged <strong>${vals[2] || '___'}</strong> years, of ${vals[4] || '___________'}, occupation <strong>${vals[5] || '___________'}</strong>, do hereby MAKE OATH and STATE as follows:</p>
    <h2>THAT</h2>
    <p>${vals[6] || '___________'}</p>
    <p class="constitutional-ref">Article 50(2)(a) — Every accused person has the right to be presumed innocent until the contrary is proved.</p>
    <h2>DEPONENT'S DECLARATION</h2>
    <p>The contents of this affidavit are true to the best of my knowledge and belief.</p>
    <div class="sig-block">
      <div class="sig-line">Deponent's Signature<br/>${vals[0] || '___'}<br/>Date: ___________</div>
      <div class="sig-line">SWORN at ___________<br/>Before me on ___________<br/>Commissioner for Oaths<br/>LSK No.: ___________</div>
    </div>`;
  } else if (docType === 'will') {
    const inputs = formEl.querySelectorAll('.form-input');
    const vals = Array.from(inputs).map(i => i.value || '___________');
    content = headerHTML + `
    <p class="constitutional-ref">This Will is prepared pursuant to the Law of Succession Act (Cap. 160) of Kenya and Articles 40 and 60 of the Constitution of Kenya 2010 — right to property and land.</p>
    <h2>LAST WILL AND TESTAMENT</h2>
    <p>I, <strong>${vals[0] || '___________'}</strong>, holder of National ID No. <strong>${vals[2] || '___________'}</strong>, aged <strong>${vals[1] || '___'}</strong> years, residing at <strong>${vals[4] || '___________'}</strong>, being of sound mind and body, hereby revoke all former Wills and Testamentary Dispositions and declare this to be my LAST WILL AND TESTAMENT:</p>
    <h2>1. Executors</h2>
    <p>I appoint <strong>${vals[5] || '___________'}</strong> (ID: ${vals[6] || '___'}) and <strong>${vals[8] || '___________'}</strong> (ID: ${vals[9] || '___'}) as joint executors of this Will.</p>
    <h2>2. Beneficiaries</h2>
    <p>${vals[11] || '___________'}</p>
    <h2>3. Distribution of Assets</h2>
    <p>${vals[13] || '___________'}</p>
    <h2>4. Witnesses</h2>
    <p>This Will is signed in the presence of the undersigned witnesses who are not beneficiaries under this Will, as required under the Law of Succession Act Section 11.</p>
    <div class="sig-block">
      <div class="sig-line">Testator Signature<br/>${vals[0] || '___'}<br/>Date: ___________</div>
      <div class="sig-line">Witness 1<br/>${vals[14] || '___'} (ID: ${vals[15] || '___'})<br/>Date: ___________</div>
      <div class="sig-line">Witness 2<br/>${vals[16] || '___'} (ID: ${vals[17] || '___'})<br/>Date: ___________</div>
    </div>`;
  } else if (docType === 'poa') {
    const inputs = formEl.querySelectorAll('.form-input');
    const vals = Array.from(inputs).map(i => i.value || '___________');
    content = headerHTML + `
    <p class="constitutional-ref">This Power of Attorney is prepared pursuant to the Powers of Attorney Act (Cap. 56) of Kenya, the Registration of Documents Act (Cap. 285), and Article 40 of the Constitution of Kenya 2010.</p>
    <h2>POWER OF ATTORNEY</h2>
    <p>KNOW ALL MEN BY THESE PRESENTS that I, <strong>${vals[0] || '___________'}</strong>, holder of National ID/Passport No. <strong>${vals[1] || '___________'}</strong>, KRA PIN <strong>${vals[2] || '___________'}</strong>, of <strong>${vals[4] || '___________'}</strong> (hereinafter "the Donor"), do hereby appoint:</p>
    <p><strong>${vals[7] || '___________'}</strong>, holder of National ID/Passport No. <strong>${vals[8] || '___________'}</strong>, of <strong>${vals[9] || '___________'}</strong> (hereinafter "the Attorney/Agent"),</p>
    <p>to be my true and lawful attorney to act on my behalf in all matters relating to:</p>
    <h2>Scope of Authority</h2>
    <p><strong>Type:</strong> ${vals[12] || '___________'}</p>
    <p><strong>Specific Powers:</strong> ${vals[13] || '___________'}</p>
    <p>This Power of Attorney shall be effective from <strong>${vals[14] || dateStr}</strong>${vals[15] ? ' to <strong>' + vals[15] + '</strong>' : ' and shall remain in force until revoked in writing'}.</p>
    <p class="constitutional-ref">This Power of Attorney is executed pursuant to the Powers of Attorney Act Cap. 56, which provides that all lawful acts performed by the Attorney under this power shall be binding on the Donor.</p>
    <div class="sig-block">
      <div class="sig-line">Donor Signature<br/>${vals[0] || '___'}<br/>Date: ___________</div>
      <div class="sig-line">Attorney Signature<br/>${vals[7] || '___'}<br/>Date: ___________</div>
      <div class="sig-line">Commissioner for Oaths<br/>LSK No.: ___________<br/>Date: ___________</div>
    </div>`;
  } else if (docType === 'employment') {
    const inputs = formEl.querySelectorAll('.form-input');
    const vals = Array.from(inputs).map(i => i.value || '___________');
    content = headerHTML + `
    <p class="constitutional-ref">This Employment Contract is prepared pursuant to the Employment Act 2007, the Labour Relations Act 2007, the Work Injury Benefits Act 2007, and Articles 41 and 43 of the Constitution of Kenya 2010.</p>
    <h2>CONTRACT OF EMPLOYMENT</h2>
    <p>THIS AGREEMENT is made on <strong>${dateStr}</strong> between:</p>
    <p><strong>EMPLOYER:</strong> ${vals[0] || '___________'} (Reg. No: ${vals[1] || '___'}, KRA PIN: ${vals[2] || '___'}, NSSF: ${vals[3] || '___'})<br/>Address: ${vals[5] || '___________'}</p>
    <p><strong>EMPLOYEE:</strong> ${vals[12] || '___________'} (ID/Passport: ${vals[13] || '___'}, KRA PIN: ${vals[14] || '___'})<br/>Address: ${vals[20] || '___________'}</p>
    <h2>1. Appointment</h2>
    <p>The Employer employs the Employee as <strong>${vals[24] || '___________'}</strong> in the <strong>${vals[25] || '___________'}</strong> department, commencing <strong>${vals[26] || '___________'}</strong>. Employment type: <strong>${vals[27] || '___________'}</strong>. Probation: <strong>${vals[29] || '___________'}</strong>.</p>
    <h2>2. Remuneration</h2>
    <p>Basic salary: <strong>KES ${vals[33] || '___________'}</strong> per month. House allowance: KES ${vals[34] || '0'}. Transport: KES ${vals[35] || '0'}. Payable on: ${vals[37] || '___________'}.</p>
    <h2>3. Leave Entitlement</h2>
    <p>Annual leave: <strong>${vals[41] || '21 days'}</strong> (statutory minimum per Employment Act 2007 s.28). Sick leave: <strong>${vals[42] || '7 days full pay + 7 days half pay'}</strong> per annum.</p>
    <h2>4. Notice & Termination</h2>
    <p>Either party may terminate this contract on giving <strong>${vals[43] || '28 days'}</strong> written notice. Summary dismissal is governed by Section 44 of the Employment Act 2007.</p>
    <h2>5. Confidentiality</h2>
    <p>${vals[45] || 'The Employee shall not disclose any confidential information obtained during employment. Kenya Data Protection Act 2019 applies.'}</p>
    <div class="sig-block">
      <div class="sig-line">Employer Signature<br/>${vals[0] || '___'}<br/>Date: ___________</div>
      <div class="sig-line">Employee Signature<br/>${vals[12] || '___'}<br/>Date: ___________</div>
      <div class="sig-line">Witness<br/>Name: ${vals[47] || '___'}<br/>Date: ___________</div>
    </div>`;
  } else {
    content = headerHTML + `<h2>${title}</h2><p>Document generated on ${dateStr} by Nomos AI Pro.</p>`;
  }

  buildA4Window(title, content);
  showToast('📄 Document generating — printing dialog will open shortly.');
}

// Update the genResult download button to trigger PDF
document.addEventListener('DOMContentLoaded', () => {
  const genResult = document.getElementById('genResult');
  if (genResult) {
    const dlBtn = genResult.querySelector('.btn-gold');
    if (dlBtn) dlBtn.onclick = () => generateDocPDF(currentDocType);
  }
});

const DOC_TITLES = {
  tenancy: 'Tenancy Agreement', employment: 'Employment Agreement',
  demand: 'Demand Letter', nda: 'Non-Disclosure Agreement (NDA)',
  affidavit: 'Affidavit', will: 'Will & Testament', poa: 'Power of Attorney'
};

let currentDocType = 'tenancy';

function setDocType(el, key) {
  currentDocType = key;
  document.querySelectorAll('.doc-row').forEach(r => { r.style.borderColor = ''; r.style.background = ''; });
  el.style.borderColor = 'rgba(201,168,76,.35)'; el.style.background = 'rgba(201,168,76,.06)';
  const title = DOC_TITLES[key] || key;
  document.getElementById('genDocTitle').textContent = title;
  ['tenancy','employment','demand','nda','affidavit','will','poa'].forEach(t => {
    const el2 = document.getElementById('gendoc-' + t);
    if (el2) el2.style.display = t === key ? '' : 'none';
  });
  const res = document.getElementById('genResult');
  if (res) res.style.display = 'none';
}

// ── Toggle affidavit hints ──
function toggleAffidavitHints() {
  const val = document.getElementById('affidavitTypeSelect').value;
  document.getElementById('affidavit-hint-names').style.display = val === 'names' ? '' : 'none';
  document.getElementById('affidavit-hint-loss').style.display  = val === 'loss'  ? '' : 'none';
}

// ── Gendoc file upload ──
function handleGendocUpload(input, listId) {
  const files = Array.from(input.files);
  if (!files.length) return;
  const list = document.getElementById(listId);
  if (!list) return;
  files.forEach(file => {
    const ext  = file.name.split('.').pop().toUpperCase();
    const size = file.size > 1024*1024 ? (file.size/(1024*1024)).toFixed(1)+' MB' : (file.size/1024).toFixed(0)+' KB';
    const icons = { PDF:'📜', DOCX:'📝', DOC:'📝', PNG:'🖼️', JPG:'🖼️', JPEG:'🖼️' };
    const ico = icons[ext] || '📄';
    const row = document.createElement('div');
    row.className = 'gendoc-file-row';
    row.innerHTML = `<span>${ico}</span><span class="gendoc-file-name">${file.name}</span><span class="gendoc-file-size">${size}</span><button onclick="this.parentElement.remove()" title="Remove">✕</button>`;
    list.appendChild(row);
  });
  input.value = '';
}

// ── Chat document upload ──
let _chatPendingFiles = [];
function handleChatDocUpload(input) {
  const files = Array.from(input.files);
  if (!files.length) return;
  const strip = document.getElementById('chatAttachedFiles');
  files.forEach(file => {
    _chatPendingFiles.push(file);
    const ext   = file.name.split('.').pop().toUpperCase();
    const size  = file.size > 1024*1024 ? (file.size/(1024*1024)).toFixed(1)+' MB' : (file.size/1024).toFixed(0)+' KB';
    const icons = { PDF:'📜', DOCX:'📝', DOC:'📝', PNG:'🖼️', JPG:'🖼️', JPEG:'🖼️', TXT:'📄' };
    const ico = icons[ext] || '📄';
    const chip = document.createElement('div');
    chip.className = 'chat-file-chip';
    const fname = file.name;
    chip.innerHTML = `<span>${ico}</span><span class="chat-chip-name">${fname}</span><span class="chat-chip-size">${size}</span><button onclick="removeChatFile(this,'${fname}')" title="Remove">✕</button>`;
    strip.appendChild(chip);
  });
  strip.style.display = 'flex';
  input.value = '';
  showToast('📎 ' + files.length + ' file' + (files.length > 1 ? 's' : '') + ' attached to chat');
}

function removeChatFile(btn, name) {
  _chatPendingFiles = _chatPendingFiles.filter(f => f.name !== name);
  btn.parentElement.remove();
  const strip = document.getElementById('chatAttachedFiles');
  if (strip && !strip.children.length) strip.style.display = 'none';
}

function sendDashChat() {
  const input = document.getElementById('dcwInput');
  const msgs  = document.getElementById('dcwMessages');
  const text  = input ? input.value.trim() : '';
  const files = [..._chatPendingFiles];
  if (!text && !files.length) return;
  const initials = currentUser ? currentUser.initials : 'U';
  const uDiv = document.createElement('div');
  uDiv.className = 'dcw-msg u';
  let filesHTML = '';
  if (files.length) {
    filesHTML = `<div class="dcw-attached-files">${files.map(f => {
      const ext = f.name.split('.').pop().toUpperCase();
      const icons = { PDF:'📜', DOCX:'📝', DOC:'📝', PNG:'🖼️', JPG:'🖼️', JPEG:'🖼️', TXT:'📄' };
      return `<div class="dcw-file-chip">${icons[ext]||'📄'} ${f.name}</div>`;
    }).join('')}</div>`;
  }
  uDiv.innerHTML = `<div class="dcw-bub user">${text ? `<p>${text}</p>` : ''}${filesHTML}</div><div class="hv-av usr" style="width:30px;height:30px;font-size:.68rem;flex-shrink:0">${initials}</div>`;
  msgs.appendChild(uDiv);
  if (input) input.value = '';
  _chatPendingFiles = [];
  const strip = document.getElementById('chatAttachedFiles');
  if (strip) { strip.innerHTML = ''; strip.style.display = 'none'; }
  msgs.scrollTop = msgs.scrollHeight;
  const typDiv = document.createElement('div');
  typDiv.className = 'dcw-msg';
  typDiv.id = 'dash-typing';
  typDiv.innerHTML = `<div class="hv-av ai" style="width:30px;height:30px;font-size:.68rem;flex-shrink:0">N</div><div class="dcw-bub ai"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  msgs.appendChild(typDiv);
  msgs.scrollTop = msgs.scrollHeight;
  const hasFiles = files.length > 0;
  const fileAnalysisResponses = [
    `I've received your ${files.length > 1 ? files.length + ' documents' : '<strong style="color:var(--g300)">' + (files[0]?.name||'document') + '</strong>'}. Let me analyse ${files.length > 1 ? 'them' : 'it'} for legal issues…<br/><br/>⚠️ <strong>Preliminary Analysis:</strong> I've identified <strong style="color:var(--warn)">2 potential risk areas</strong> — please review the clauses on liability limitation and termination notice periods. I recommend having a qualified advocate review before signing. Shall I draft suggested amendments?`,
    `Document received: <strong style="color:var(--g300)">${files[0]?.name||'your file'}</strong>.<br/><br/>📋 <strong>AI Review Summary:</strong><br/>• <span style="color:var(--suc)">✓</span> Structure and format appear legally sound<br/>• <span style="color:var(--warn)">⚠</span> Clause 4.2 may conflict with the Employment Act 2007, Section 35<br/>• <span style="color:var(--err)">✗</span> Missing mandatory disclosure under the Data Protection Act 2019<br/><br/>Would you like me to generate a corrected version?`
  ];
  setTimeout(() => {
    const t = document.getElementById('dash-typing');
    if (t) t.remove();
    const aDiv = document.createElement('div');
    aDiv.className = 'dcw-msg';
    const reply = hasFiles ? fileAnalysisResponses[Math.floor(Math.random() * fileAnalysisResponses.length)] : aiResponses[aiIdx % aiResponses.length];
    aDiv.innerHTML = `<div class="hv-av ai" style="width:30px;height:30px;font-size:.68rem;flex-shrink:0">N</div><div class="dcw-bub ai">${reply}</div>`;
    msgs.appendChild(aDiv);
    if (!hasFiles) aiIdx++;
    msgs.scrollTop = msgs.scrollHeight;
  }, 1800);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.activeElement && document.activeElement.id === 'dcwInput') sendDashChat();
});

// ── Research panel chat ──
function sendResearch() {
  const input = document.getElementById('researchInput');
  const msgs  = document.getElementById('researchMessages');
  if (!input || !msgs) return;
  const text  = input.value.trim();
  if (!text) return;
  const initials = currentUser ? currentUser.initials : 'U';
  const uDiv = document.createElement('div');
  uDiv.className = 'dcw-msg u';
  uDiv.innerHTML = `<div class="dcw-bub user">${text}</div><div class="hv-av usr" style="width:30px;height:30px;font-size:.68rem;flex-shrink:0">${initials}</div>`;
  msgs.appendChild(uDiv);
  input.value = '';
  msgs.scrollTop = msgs.scrollHeight;
  const typDiv = document.createElement('div');
  typDiv.className = 'dcw-msg';
  typDiv.id = 'research-typing';
  typDiv.innerHTML = `<div class="hv-av ai" style="width:30px;height:30px;font-size:.68rem;flex-shrink:0">N</div><div class="dcw-bub ai"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  msgs.appendChild(typDiv);
  msgs.scrollTop = msgs.scrollHeight;
  const researchResponses = [
    `Found <strong style="color:var(--g300)">7 relevant precedents</strong> in the Kenya Law corpus matching your query:<br/><br/><div class="cite-pill" style="margin:4px 0"><span class="cite-n">[1]</span> <em>Ochieng v. Nairobi City Council [2022] eKLR</em> — Established principle of proportionality in administrative action</div><div class="cite-pill" style="margin:4px 0"><span class="cite-n">[2]</span> <em>Wanjiku v. Attorney General [2021] eKLR</em> — Right to fair hearing under Art. 47</div><div class="cite-pill" style="margin:4px 0"><span class="cite-n">[3]</span> <em>Land Act 2012, Section 26</em> — Compulsory acquisition procedures</div><br/>Shall I extract full text for any of these?`,
    `Statute analysis complete. Under <strong style="color:var(--g300)">Companies Act 2015, Sections 208–218</strong>, director liability provisions include:<br/>• Personal liability for fraudulent trading<br/>• Liability for breach of fiduciary duty<br/>• Director disqualification procedures<br/><br/>Cross-referenced with <em>Kamau v. Safaricom Ltd [2023]</em> confirming extended liability doctrine. Want me to prepare a research brief?`
  ];
  let researchIdx = Math.floor(Math.random() * researchResponses.length);
  setTimeout(() => {
    const t = document.getElementById('research-typing');
    if (t) t.remove();
    const aDiv = document.createElement('div');
    aDiv.className = 'dcw-msg';
    aDiv.innerHTML = `<div class="hv-av ai" style="width:30px;height:30px;font-size:.68rem;flex-shrink:0">N</div><div class="dcw-bub ai">${researchResponses[researchIdx]}</div>`;
    msgs.appendChild(aDiv);
    msgs.scrollTop = msgs.scrollHeight;
  }, 1600);
}

// ════════════════════
// NGO PANEL ACTIONS
// ════════════════════

// In-memory NGO case intakes store
const ngoIntakes = [
  { id: 'WKL-10001', clientName: 'Mary Onyango', clientID: '34567890', clientPhone: '+254 722 001 100', county: 'Kisumu', category: 'Land Dispute', urgency: 'Urgent', description: 'Client disputes ownership of family land after father\'s death. Neighbour claims adverse possession.', lawyer: 'Adv. Sarah Njoroge', status: 'Active', date: '08 Jun 2025', initials: 'MO', grad: 'linear-gradient(135deg,#0e4d2d,#1a7a4d)' },
  { id: 'WKL-10002', clientName: 'James Kamau', clientID: '23456781', clientPhone: '+254 733 002 200', county: 'Nairobi', category: 'Employment Rights', urgency: 'Normal', description: 'Client was dismissed without cause after 6 years of service. Employer alleges redundancy.', lawyer: 'Adv. Amina Mohamed', status: 'Active', date: '06 Jun 2025', initials: 'JK', grad: 'linear-gradient(135deg,#1a2a5e,#2d4a9e)' },
  { id: 'WKL-10003', clientName: 'Fatuma Waweru', clientID: '45678902', clientPhone: '+254 711 003 300', county: 'Mombasa', category: 'Domestic Violence', urgency: 'Emergency', description: 'Client needs urgent protection order. Spouse is violent and has made threats.', lawyer: 'Auto-assign', status: 'Pending', date: '05 Jun 2025', initials: 'FW', grad: 'linear-gradient(135deg,#4d1a0e,#8e2d1a)' }
];

// In-memory beneficiaries store (starts with existing ones)
const ngoBeneficiaries = [
  { name: 'Mary Onyango', service: 'Legal Consultation', county: 'Kisumu', status: 'Open', initials: 'MO', grad: 'linear-gradient(135deg,#0e4d2d,#1a7a4d)' },
  { name: 'James Kamau', service: 'Court Representation', county: 'Nairobi', status: 'Resolved', initials: 'JK', grad: 'linear-gradient(135deg,#1a2a5e,#2d4a9e)' },
  { name: 'Fatuma Waweru', service: 'Document Assistance', county: 'Mombasa', status: 'In Progress', initials: 'FW', grad: 'linear-gradient(135deg,#4d1a0e,#8e2d1a)' }
];
const BENE_SEED_COUNT = 215; // offset so display shows 218 total initially

function submitNGOIntakeNew() {
  const name     = (document.getElementById('intakeClientName') || {}).value?.trim();
  const id       = (document.getElementById('intakeClientID') || {}).value?.trim();
  const phone    = (document.getElementById('intakeClientPhone') || {}).value?.trim();
  const county   = (document.getElementById('intakeClientCounty') || {}).value;
  const category = (document.getElementById('intakeCaseCategory') || {}).value;
  const urgency  = (document.getElementById('intakeUrgency') || {}).value;
  const desc     = (document.getElementById('intakeCaseDesc') || {}).value?.trim();
  const lawyer   = (document.getElementById('intakeAssignLawyer') || {}).value;

  if (!name || !id || !phone || !county || !category || !urgency || !desc) {
    showToast('⚠️ Please fill in all required fields before submitting.');
    return;
  }

  const refNum = 'WKL-' + (10000 + ngoIntakes.length + 1);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const dateStr = String(now.getDate()).padStart(2,'0') + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
  const initials = name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const grads = ['linear-gradient(135deg,#1e3a5f,#2d7a8e)','linear-gradient(135deg,#1a4731,#2d7a52)','linear-gradient(135deg,#3d1a5f,#6b2d8e)','linear-gradient(135deg,#4d2a0e,#8e5a1a)'];
  const grad = grads[ngoIntakes.length % grads.length];

  ngoIntakes.unshift({ id: refNum, clientName: name, clientID: id, clientPhone: phone, county, category, urgency, description: desc, lawyer: lawyer || 'Auto-assign', status: 'Active', date: dateStr, initials, grad });

  // Clear form
  ['intakeClientName','intakeClientID','intakeClientPhone','intakeCaseDesc'].forEach(fid => { const el=document.getElementById(fid); if(el) el.value=''; });
  ['intakeClientCounty','intakeCaseCategory','intakeUrgency','intakeAssignLawyer'].forEach(fid => { const el=document.getElementById(fid); if(el) el.value=''; });

  document.getElementById('intakeRef').textContent = 'Ref: ' + refNum;
  showToast('📋 Case intake submitted! Reference: ' + refNum);
}

// Keep backward compat
function submitNGOIntake() { submitNGOIntakeNew(); }

function renderAllIntakes(filterStatus) {
  const list  = document.getElementById('allIntakesList');
  const count = document.getElementById('allIntakesCount');
  if (!list) return;
  const filtered = filterStatus && filterStatus !== 'all'
    ? ngoIntakes.filter(i => i.status === filterStatus)
    : ngoIntakes;
  if (count) count.textContent = filtered.length + ' intake' + (filtered.length !== 1 ? 's' : '') + ' found';
  if (!filtered.length) {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--s400)">No intakes found.</div>`;
    return;
  }
  list.innerHTML = filtered.map((intake, idx) => {
    const urgColor = intake.urgency === 'Emergency' ? 'var(--err)' : intake.urgency === 'Urgent' ? 'var(--warn)' : 'var(--suc)';
    const statusClass = intake.status === 'Active' ? 'avail' : intake.status === 'Resolved' ? '' : 'busy';
    const statusStyle = intake.status === 'Resolved' ? 'background:rgba(14,122,140,.2);color:var(--t400);border-color:rgba(14,163,184,.3)' : '';
    return `<div class="law-client-row" style="cursor:pointer" onclick="openIntakeDetail(${ngoIntakes.indexOf(intake)})">
      <div class="law-cl-av" style="background:${intake.grad}">${intake.initials}</div>
      <div style="flex:1;min-width:0">
        <div class="law-cl-name">${intake.clientName} <span style="font-size:.72rem;color:var(--s400);font-weight:400">· ${intake.id}</span></div>
        <div class="law-cl-meta">${intake.category} · ${intake.county} · ${intake.date}</div>
        <div class="law-cl-meta" style="margin-top:2px">Assigned: ${intake.lawyer}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        <div class="match-badge ${statusClass}" style="${statusStyle}">${intake.status}</div>
        <span style="font-size:.7rem;font-weight:700;color:${urgColor}">${intake.urgency}</span>
      </div>
      <button class="btn btn-ghost sm" style="margin-left:8px" onclick="event.stopPropagation();openIntakeDetail(${ngoIntakes.indexOf(intake)})">👁 Open</button>
    </div>`;
  }).join('');
}

function filterAllIntakes(status) { renderAllIntakes(status); }

function openIntakeDetail(idx) {
  const intake = ngoIntakes[idx];
  if (!intake) return;
  const overlay = document.getElementById('intakeDetailOverlay');
  const body    = document.getElementById('intakeDetailBody');
  const title   = document.getElementById('intakeDetailTitle');
  if (!overlay || !body) return;
  if (title) title.textContent = '📋 Case Intake — ' + intake.clientName;
  const urgColor = intake.urgency === 'Emergency' ? 'var(--err)' : intake.urgency === 'Urgent' ? 'var(--warn)' : 'var(--suc)';
  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
      <div class="law-cl-av" style="background:${intake.grad};width:52px;height:52px;font-size:1.1rem;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff">${intake.initials}</div>
      <div>
        <div style="font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:4px">${intake.clientName}</div>
        <div style="font-size:.8rem;color:var(--g400);font-weight:600">Ref: ${intake.id} · ${intake.date}</div>
      </div>
    </div>
    <div class="cf-detail-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div style="background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r10);padding:12px"><div style="font-size:.72rem;color:var(--s400);margin-bottom:4px">National ID</div><div style="font-size:.88rem;color:#fff;font-weight:600">${intake.clientID}</div></div>
      <div style="background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r10);padding:12px"><div style="font-size:.72rem;color:var(--s400);margin-bottom:4px">Phone</div><div style="font-size:.88rem;color:#fff;font-weight:600">${intake.clientPhone}</div></div>
      <div style="background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r10);padding:12px"><div style="font-size:.72rem;color:var(--s400);margin-bottom:4px">County</div><div style="font-size:.88rem;color:#fff;font-weight:600">${intake.county}</div></div>
      <div style="background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r10);padding:12px"><div style="font-size:.72rem;color:var(--s400);margin-bottom:4px">Case Category</div><div style="font-size:.88rem;color:#fff;font-weight:600">${intake.category}</div></div>
      <div style="background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r10);padding:12px"><div style="font-size:.72rem;color:var(--s400);margin-bottom:4px">Urgency Level</div><div style="font-size:.88rem;font-weight:700;color:${urgColor}">${intake.urgency}</div></div>
      <div style="background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r10);padding:12px"><div style="font-size:.72rem;color:var(--s400);margin-bottom:4px">Status</div><div style="font-size:.88rem;color:#fff;font-weight:600">${intake.status}</div></div>
    </div>
    <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--s400);font-weight:700;margin-bottom:8px">Assigned Lawyer</div>
    <div style="background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r10);padding:12px 14px;font-size:.88rem;color:var(--g300);font-weight:600;margin-bottom:16px">${intake.lawyer}</div>
    <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--s400);font-weight:700;margin-bottom:8px">Case Description</div>
    <div style="background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r10);padding:14px;font-size:.86rem;color:var(--s300);line-height:1.7;margin-bottom:20px">${intake.description}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-gold sm" onclick="closeIntakeDetailModal();switchDashTab('chat');showToast('AI Chat opened for case ${intake.id}')">💬 Discuss with AI</button>
      <button class="btn btn-ghost sm" onclick="generateIntakePDF(${idx})">📄 Download Case Report (PDF)</button>
      <button class="btn btn-ghost sm" onclick="updateIntakeStatus(${idx},'Resolved');closeIntakeDetailModal()">✅ Mark Resolved</button>
    </div>`;
  overlay.classList.add('open');
}

function updateIntakeStatus(idx, status) {
  if (ngoIntakes[idx]) {
    ngoIntakes[idx].status = status;
    renderAllIntakes();
    showToast('✅ Case ' + ngoIntakes[idx].id + ' marked as ' + status);
  }
}

function closeIntakeDetailModal() { document.getElementById('intakeDetailOverlay').classList.remove('open'); }
function closeIntakeDetailOverlay(e) { if (e.target === document.getElementById('intakeDetailOverlay')) closeIntakeDetailModal(); }

function addBeneficiaryNew() {
  const name    = (document.getElementById('beneficiaryName') || {}).value?.trim();
  const service = (document.getElementById('beneficiaryServiceType') || {}).value;
  const county  = (document.getElementById('beneficiaryCounty') || {}).value;
  const status  = (document.getElementById('beneficiaryCaseStatus') || {}).value;

  if (!name || !service || !county || !status) {
    showToast('⚠️ Please fill in all required beneficiary fields.');
    return;
  }

  const initials = name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const grads = ['linear-gradient(135deg,#1e3a5f,#2d7a8e)','linear-gradient(135deg,#1a4731,#2d7a52)','linear-gradient(135deg,#3d1a5f,#6b2d8e)','linear-gradient(135deg,#4d2a0e,#8e5a1a)','linear-gradient(135deg,#4d1a0e,#8e2d1a)'];
  const grad = grads[ngoBeneficiaries.length % grads.length];

  ngoBeneficiaries.unshift({ name, service, county, status, initials, grad });
  renderBeneficiaryRegister();

  // Clear fields
  ['beneficiaryName'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  ['beneficiaryServiceType','beneficiaryCounty','beneficiaryCaseStatus'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });

  showToast('✅ Beneficiary ' + name + ' added to the register.');
}

// Keep backward compat
function addBeneficiary() { addBeneficiaryNew(); }

function renderBeneficiaryRegister() {
  const container = document.getElementById('beneficiaryRegisterList');
  const countEl   = document.getElementById('beneficiaryCount');
  if (!container) return;
  const total = ngoBeneficiaries.length + BENE_SEED_COUNT;
  if (countEl) countEl.textContent = total + ' Total';

  container.innerHTML = ngoBeneficiaries.map(b => {
    const statusClass = b.status === 'Resolved' ? '' : b.status === 'Open' ? 'avail' : 'busy';
    const statusStyle = b.status === 'Resolved' ? 'background:rgba(14,122,140,.2);color:var(--t400);border-color:rgba(14,163,184,.3)' : '';
    return `<div class="law-client-row">
      <div class="law-cl-av" style="background:${b.grad}">${b.initials}</div>
      <div style="flex:1"><div class="law-cl-name">${b.name}</div><div class="law-cl-meta">${b.service} · ${b.county} · ${b.status}</div></div>
      <div class="match-badge ${statusClass}" style="${statusStyle}">${b.status === 'Resolved' ? 'Resolved' : b.status === 'Open' ? 'Active' : 'Pending'}</div>
    </div>`;
  }).join('');
}

function runCountyAnalytics() {
  const btn = document.getElementById('countyAnalyticsBtn');
  if(btn){ btn.textContent='🔄 Analysing…'; btn.disabled=true; }
  setTimeout(() => {
    if(btn){ btn.textContent='📊 Run Analytics'; btn.disabled=false; }
    const result = document.getElementById('countyAnalyticsResult');
    if(result) result.style.display='block';
    showToast('✅ County coverage analytics updated.');
  }, 2000);
}

function generateImpactReport() {
  const btn = document.getElementById('impactReportBtn');
  if(btn){ btn.textContent='⏳ Generating…'; btn.disabled=true; }
  setTimeout(() => {
    if(btn){ btn.textContent='📊 Generate Report'; btn.disabled=false; }
    generateImpactReportPDF();
  }, 2200);
}

function connectPartner() {
  showToast('🤝 Partner connection request sent! They will be notified via email.');
}

// ──── PDF GENERATION UTILITIES ────

function buildA4Window(title, content) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { showToast('⚠️ Please allow pop-ups to download the document.'); return null; }
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    @page { size: A4; margin: 25mm 20mm; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #111; background: #fff; margin: 0; padding: 20px; }
    h1 { font-size: 16pt; text-align: center; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .05em; }
    h2 { font-size: 13pt; margin: 18px 0 6px; border-bottom: 1.5px solid #333; padding-bottom: 4px; }
    h3 { font-size: 11pt; margin: 14px 0 4px; }
    p { margin: 6px 0; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #888; padding: 6px 10px; font-size: 10pt; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    .header-block { text-align: center; border-bottom: 2px solid #111; padding-bottom: 14px; margin-bottom: 18px; }
    .seal { font-size: 28pt; margin-bottom: 6px; }
    .subtitle { font-size: 11pt; color: #444; margin-top: 4px; }
    .section { margin: 16px 0; }
    .field-row { display: flex; gap: 20px; margin: 6px 0; }
    .field { flex: 1; }
    .field-label { font-size: 9pt; color: #555; text-transform: uppercase; letter-spacing: .06em; }
    .field-value { font-size: 11pt; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 2px; }
    .sig-block { display: flex; justify-content: space-between; margin-top: 40px; }
    .sig-line { width: 200px; border-top: 1.5px solid #333; padding-top: 6px; font-size: 9pt; color: #555; text-align: center; }
    .constitutional-ref { font-size: 9pt; color: #555; font-style: italic; border-left: 3px solid #c9a84c; padding-left: 10px; margin: 10px 0; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-35deg); font-size: 72pt; color: rgba(0,0,0,0.04); font-family: sans-serif; font-weight: 900; pointer-events: none; z-index: 0; }
    .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 8.5pt; color: #666; text-align: center; }
    @media print { body { padding: 0; } }
  </style></head><body>
  <div class="watermark">NOMOS AI PRO</div>
  ${content}
  <div class="footer">Generated by Nomos AI Pro | Kenya's Legal Intelligence Platform | nomosai.co.ke | +254 794 153 677<br/>
  This document is computer-generated. Prepared in accordance with the Laws of Kenya and the Constitution of Kenya 2010.</div>
  <script>window.onload=()=>{ setTimeout(()=>{ window.print(); }, 500); }<\/script>
  </body></html>`);
  w.document.close();
  return w;
}

function getCurrentDateStr() {
  const d = new Date();
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
}

function generateIntakePDF(idx) {
  const i = ngoIntakes[idx];
  if (!i) return;
  const dateStr = getCurrentDateStr();
  const content = `
    <div class="header-block">
      <div class="seal">⚖️</div>
      <h1>Nomos AI Pro</h1>
      <div class="subtitle">Legal Aid Organisation — Case Intake Report</div>
      <div class="subtitle" style="margin-top:6px;font-size:10pt;color:#888">Reference: ${i.id} | Date: ${dateStr}</div>
    </div>
    <p class="constitutional-ref">Prepared pursuant to Article 48 of the Constitution of Kenya 2010 — Access to Justice, and in compliance with the Legal Aid Act No. 6 of 2016.</p>
    <h2>1. Client Particulars</h2>
    <table><tr><th>Full Name</th><td>${i.clientName}</td><th>National ID</th><td>${i.clientID}</td></tr>
    <tr><th>Phone</th><td>${i.clientPhone}</td><th>County</th><td>${i.county}</td></tr>
    <tr><th>Date of Intake</th><td>${i.date}</td><th>Case Reference</th><td>${i.id}</td></tr></table>
    <h2>2. Case Details</h2>
    <table><tr><th>Category</th><td>${i.category}</td><th>Urgency Level</th><td>${i.urgency}</td></tr>
    <tr><th>Assigned Advocate</th><td colspan="3">${i.lawyer}</td></tr>
    <tr><th>Case Status</th><td colspan="3">${i.status}</td></tr></table>
    <h2>3. Case Description</h2>
    <p>${i.description}</p>
    <h2>4. Legal Framework</h2>
    <p class="constitutional-ref">Article 48 — The State shall ensure access to justice for all persons and, if any fee is required, it shall be reasonable and shall not impede access to justice.</p>
    <p class="constitutional-ref">Article 50(2)(h) — Every accused person has the right to have an advocate assigned by the State and at State expense, if substantial injustice would otherwise result.</p>
    <p class="constitutional-ref">Legal Aid Act 2016, Section 3 — Legal aid services shall be provided to eligible persons in civil and criminal matters.</p>
    <div class="sig-block">
      <div class="sig-line">Intake Officer Signature<br/><span style="font-weight:bold">Date: ___________</span></div>
      <div class="sig-line">Advocate Signature<br/><span style="font-weight:bold">LSK No.: ___________</span></div>
      <div class="sig-line">Organisation Stamp</div>
    </div>`;
  buildA4Window('Case Intake Report — ' + i.id, content);
  showToast('📄 Downloading case intake report…');
}

function generateImpactReportPDF() {
  const dateStr = getCurrentDateStr();
  const org = currentUser ? (currentUser.firstName + ' ' + currentUser.lastName) : 'NGO Organisation';
  const content = `
    <div class="header-block">
      <div class="seal">📊</div>
      <h1>Nomos AI Pro</h1>
      <div class="subtitle">Legal Aid Impact Report — Q2 2025</div>
      <div class="subtitle" style="margin-top:6px;font-size:10pt;color:#888">Organisation: ${org} | Generated: ${dateStr}</div>
    </div>
    <p class="constitutional-ref">Prepared in accordance with Article 10 of the Constitution of Kenya 2010 (Public participation & transparency), Legal Aid Act 2016, and NGO Coordination Act Cap. 134.</p>
    <h2>1. Executive Summary</h2>
    <p>This report summarises the legal aid services rendered by this organisation during Q2 2025 (April–June 2025). Services were delivered pursuant to the Constitution of Kenya 2010, the Legal Aid Act 2016, and guided by the National Legal Aid Policy.</p>
    <h2>2. Key Performance Indicators</h2>
    <table><tr><th>Indicator</th><th>Q1 2025</th><th>Q2 2025</th><th>Change</th></tr>
    <tr><td>Cases Resolved</td><td>119</td><td>134</td><td style="color:green">↑ 12.6%</td></tr>
    <tr><td>Success Rate</td><td>73%</td><td>78%</td><td style="color:green">↑ 5pp</td></tr>
    <tr><td>Beneficiaries Served</td><td>184</td><td>218</td><td style="color:green">↑ 18.5%</td></tr>
    <tr><td>Counties Covered</td><td>7</td><td>9</td><td style="color:green">↑ 2</td></tr>
    <tr><td>Estimated Legal Value (KES)</td><td>3,200,000</td><td>4,200,000</td><td style="color:green">↑ 31.3%</td></tr>
    </table>
    <h2>3. Case Intake Register (${ngoIntakes.length} recorded this period)</h2>
    <table><tr><th>Ref</th><th>Client</th><th>Category</th><th>County</th><th>Status</th></tr>
    ${ngoIntakes.map(i=>`<tr><td>${i.id}</td><td>${i.clientName}</td><td>${i.category}</td><td>${i.county}</td><td>${i.status}</td></tr>`).join('')}
    </table>
    <h2>4. Constitutional & Legal Basis</h2>
    <p class="constitutional-ref">Article 19 — Rights and Fundamental Freedoms: The purpose of recognising and protecting human rights is to preserve the dignity of individuals and communities.</p>
    <p class="constitutional-ref">Article 22 — Every person has the right to institute court proceedings claiming that a right or fundamental freedom in the Bill of Rights has been denied.</p>
    <p class="constitutional-ref">Article 43 — Social and Economic Rights: Every person has the right to the highest attainable standard of health, adequate housing, food, water, social security and education.</p>
    <h2>5. Recommendations</h2>
    <p>1. Expand coverage to Turkana and Garissa counties to address identified unmet need.</p>
    <p>2. Increase probono lawyer pool in Mombasa and Kisumu to address case backlogs.</p>
    <p>3. Strengthen partnerships with the Law Society of Kenya for accelerated case resolution.</p>
    <div class="sig-block">
      <div class="sig-line">Programme Director<br/>Name: ___________</div>
      <div class="sig-line">Executive Director<br/>Signature: ___________</div>
      <div class="sig-line">Organisation Seal & Date</div>
    </div>`;
  buildA4Window('Impact Report Q2 2025', content);
  showToast('📊 Impact Report PDF downloading…');
}

// ════════════════════
// CORPORATE PANEL ACTIONS
// ════════════════════
function analyseContract() {
  const btn = document.getElementById('contractAnalyseBtn');
  if(btn){ btn.textContent='🧠 Analysing…'; btn.disabled=true; }
  setTimeout(() => {
    if(btn){ btn.textContent='🔍 Analyse Contract'; btn.disabled=false; }
    const result = document.getElementById('contractAnalysisResult');
    if(result) result.style.display='block';
    showToast('✅ Contract analysis complete — 3 issues flagged.');
  }, 2400);
}

function runComplianceCheck() {
  const btn = document.getElementById('complianceBtn');
  if(btn){ btn.textContent='🔄 Checking…'; btn.disabled=true; }
  setTimeout(() => {
    if(btn){ btn.textContent='✅ Run Compliance Check'; btn.disabled=false; }
    showToast('✅ Compliance check complete. 4 items require attention.');
    const result = document.getElementById('complianceResult');
    if(result) result.style.display='block';
  }, 2000);
}

function runRegulatoryRisk() {
  const btn = document.getElementById('regulatoryRiskBtn');
  if(btn){ btn.textContent='🔄 Scanning…'; btn.disabled=true; }
  setTimeout(() => {
    if(btn){ btn.textContent='🔍 Run Risk Scan'; btn.disabled=false; }
    showToast('⚠️ Regulatory risk scan complete — 2 high-priority items detected.');
    const result = document.getElementById('regulatoryResult');
    if(result) result.style.display='block';
  }, 2200);
}

function inviteTeamMember() {
  const email = document.getElementById('teamMemberEmail') ? document.getElementById('teamMemberEmail').value.trim() : '';
  if(!email || !isValidEmail(email)){ showToast('⚠️ Please enter a valid email address.'); return; }
  showToast('✉️ Invitation sent to ' + email + '!');
  const input = document.getElementById('teamMemberEmail');
  if(input) input.value='';
}

function generateAPIKey() {
  const key = 'NOMOS-' + Array.from({length:4}, ()=>Math.random().toString(36).substr(2,6).toUpperCase()).join('-');
  const display = document.getElementById('apiKeyDisplay');
  if(display){ display.textContent = key; display.style.display='block'; }
  showToast('🔑 New API key generated!');
}

// ════════════════════
// LAWYER PANEL ACTIONS
// ════════════════════
let lawyerServices = [
  { name: 'Legal Consultation (per hour)', desc: '', min: 5000, max: 15000, available: true },
  { name: 'Contract Drafting', desc: '', min: 8000, max: 25000, available: true },
  { name: 'Court Representation', desc: '', min: 20000, max: 80000, available: true }
];

function renderLawyerServices() {
  const list = document.getElementById('lawServicesList');
  if (!list) return;
  if (!lawyerServices.length) {
    list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--s400);font-size:.84rem">No services added yet. Add your first service →</div>`;
    return;
  }
  list.innerHTML = lawyerServices.map((s, i) => `
    <div class="law-svc-row">
      <div style="flex:1">
        <div class="law-svc-name">${s.name}</div>
        <div class="law-svc-range">KES ${s.min.toLocaleString()} – ${s.max.toLocaleString()}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <div class="match-badge ${s.available?'avail':'busy'}" style="cursor:pointer" onclick="toggleServiceAvail(${i})">${s.available?'Active':'Hidden'}</div>
        <button class="btn btn-ghost sm" onclick="deleteLawyerService(${i})">🗑</button>
      </div>
    </div>`).join('');
}

function toggleServiceAvail(i) {
  lawyerServices[i].available = !lawyerServices[i].available;
  renderLawyerServices();
}
function deleteLawyerService(i) {
  lawyerServices.splice(i, 1);
  renderLawyerServices();
  showToast('Service removed.');
}

function addNewService() {
  const name   = (document.getElementById('svcName') ? document.getElementById('svcName').value : '').trim();
  const custom = (document.getElementById('svcCustomName') ? document.getElementById('svcCustomName').value : '').trim();
  const min    = parseInt(document.getElementById('svcMin') ? document.getElementById('svcMin').value : '0') || 0;
  const max    = parseInt(document.getElementById('svcMax') ? document.getElementById('svcMax').value : '0') || 0;
  const finalName = name === 'Other (specify below)' ? custom : name;
  if (!finalName) { showToast('⚠️ Please select or enter a service name.'); return; }
  if (!min || !max) { showToast('⚠️ Please enter a fee range.'); return; }
  lawyerServices.push({ name: finalName, desc: '', min, max, available: true });
  renderLawyerServices();
  showToast('✅ Service "' + finalName + '" added!');
  if(document.getElementById('svcName')) document.getElementById('svcName').value='';
  if(document.getElementById('svcMin'))  document.getElementById('svcMin').value='';
  if(document.getElementById('svcMax'))  document.getElementById('svcMax').value='';
  updateRangeDisplay();
}

function updateRangeDisplay() {
  const min = parseInt(document.getElementById('svcMin') ? document.getElementById('svcMin').value : '0') || 0;
  const max = parseInt(document.getElementById('svcMax') ? document.getElementById('svcMax').value : '0') || 0;
  const preview = document.getElementById('svcRangeVal');
  if (preview) preview.textContent = (min||max) ? 'KES ' + (min||0).toLocaleString() + ' to ' + (max||0).toLocaleString() : 'KES — to —';
}

function svcNameChange() {
  const val = document.getElementById('svcName') ? document.getElementById('svcName').value : '';
  const custom = document.getElementById('svcCustomNameGroup');
  if (custom) custom.style.display = val === 'Other (specify below)' ? '' : 'none';
}

// ════════════════════
// ADMIN PANEL
// ════════════════════
function renderAdminOverview() {
  const el = document.getElementById('adminStatsGrid');
  if (!el) return;
  el.innerHTML = `
    <div class="admin-stat-card"><div class="asc-icon">👥</div><div class="asc-num">${adminStats.totalUsers.toLocaleString()}</div><div class="asc-label">Total Users</div><div class="asc-sub" style="color:var(--suc)">↑ ${adminStats.newUsersToday} today</div></div>
    <div class="admin-stat-card"><div class="asc-icon">🆕</div><div class="asc-num">${adminStats.newUsersToday}</div><div class="asc-label">New Users Today</div><div class="asc-sub">Registered 24h</div></div>
    <div class="admin-stat-card"><div class="asc-icon">💬</div><div class="asc-num">${adminStats.consultations.toLocaleString()}</div><div class="asc-label">Total Consultations</div><div class="asc-sub" style="color:var(--suc)">↑ ${adminStats.consultationsToday} today</div></div>
    <div class="admin-stat-card"><div class="asc-icon">📅</div><div class="asc-num">${adminStats.consultationsToday}</div><div class="asc-label">Consultations Today</div><div class="asc-sub">Last 24 hours</div></div>
    <div class="admin-stat-card"><div class="asc-icon">⚖️</div><div class="asc-num">${adminStats.lawyers}</div><div class="asc-label">Lawyers</div><div class="asc-sub">Verified Advocates</div></div>
    <div class="admin-stat-card"><div class="asc-icon">💰</div><div class="asc-num">KES ${(adminStats.totalRevenue/1000).toFixed(0)}K</div><div class="asc-label">Total Revenue</div><div class="asc-sub" style="color:var(--suc)">↑ KES ${adminStats.revenueToday.toLocaleString()} today</div></div>
    <div class="admin-stat-card"><div class="asc-icon">📈</div><div class="asc-num">KES ${adminStats.revenueToday.toLocaleString()}</div><div class="asc-label">Revenue Today</div><div class="asc-sub">Real-time tracking</div></div>
    <div class="admin-stat-card"><div class="asc-icon">🟢</div><div class="asc-num">${adminStats.dailyActiveSubscribers.toLocaleString()}</div><div class="asc-label">Daily Active Subscribers</div><div class="asc-sub">Active today</div></div>
    <div class="admin-stat-card"><div class="asc-icon">📊</div><div class="asc-num">${adminStats.weeklyActiveSubscribers.toLocaleString()}</div><div class="asc-label">Weekly Active Subscribers</div><div class="asc-sub">Last 7 days</div></div>
    <div class="admin-stat-card"><div class="asc-icon">📆</div><div class="asc-num">${adminStats.monthlyActiveSubscribers.toLocaleString()}</div><div class="asc-label">Monthly Active Subscribers</div><div class="asc-sub">Last 30 days</div></div>
    <div class="admin-stat-card"><div class="asc-icon">🔑</div><div class="asc-num">${adminStats.codeRequests}</div><div class="asc-label">Code Requests</div><div class="asc-sub">Pending activation</div></div>
    <div class="admin-stat-card" style="background:linear-gradient(135deg,rgba(201,168,76,.12),rgba(201,168,76,.04));border-color:rgba(201,168,76,.25)"><div class="asc-icon">🏆</div><div class="asc-num" style="color:var(--g400)">${USERS.filter(u=>u.role==='lawyer').length}</div><div class="asc-label" style="color:var(--g300)">Registered Lawyers</div><div class="asc-sub">On platform</div></div>
  `;
}

function renderAdminUserTable() {
  const tbody = document.getElementById('adminUserTableBody');
  if(!tbody) return;
  const allUsers = [...USERS];
  tbody.innerHTML = allUsers.map((u,i) => {
    const displayName = u.firmName || (u.firstName + ' ' + u.lastName);
    const displaySub  = u.firmName ? (u.county ? u.county + ' · ' : '') + u.email : u.email;
    return `
    <tr>
      <td><div style="display:flex;align-items:center;gap:10px">
        <div style="width:34px;height:34px;border-radius:50%;background:${u.avatarGrad||'var(--surf3)'};display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;color:#fff;flex-shrink:0">${u.initials||'??'}</div>
        <div><div style="font-weight:600;color:#fff;font-size:.84rem">${displayName}</div><div style="font-size:.72rem;color:var(--s400)">${displaySub}</div></div>
      </div></td>
      <td><span style="background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);color:var(--g300);font-size:.72rem;padding:2px 8px;border-radius:20px;font-weight:600;text-transform:uppercase">${u.role||'citizen'}</span></td>
      <td><span style="font-size:.78rem;color:var(--suc)">Active</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-ghost sm" style="font-size:.7rem;padding:4px 10px" onclick="openAdminUserDetail(${i})">👁 View</button>
        <button class="btn btn-danger sm" style="font-size:.7rem;padding:4px 8px;margin-left:4px" onclick="adminSuspendUser(${i})">Suspend</button>
      </td>
    </tr>`;
  }).join('');
}

// ════════════════════════════════════════
// LEGAL TIPS POOL
// ════════════════════════════════════════
// ════════════════════════════════════════════════════
// BILINGUAL LEGAL TIPS SYSTEM
// Language state: 'en' = English, 'sw' = Swahili
// ════════════════════════════════════════════════════
let currentChatLang = 'en';

// ── English Tips (20 core tips) ──
const LEGAL_TIPS_EN = [
  "Under the Constitution of Kenya 2010, every citizen has the right to access information held by the State.",
  "A verbal contract is legally binding in Kenya, but written contracts are far easier to enforce in court.",
  "Under the Employment Act 2007, employees are entitled to 21 days of annual leave after 12 months of service.",
  "Landlords must give a tenant at least one month's written notice before increasing rent.",
  "The Limitation of Actions Act requires most civil suits to be filed within 6 years of the cause of action.",
  "Under the Land Act 2012, all Kenyan citizens have the right to own land anywhere in Kenya regardless of ethnicity.",
  "A will must be signed by the testator and witnessed by two independent adults to be valid in Kenya.",
  "The Employment Act 2007 requires employers to provide written terms of employment within 2 months of hiring.",
  "Domestic violence victims can apply for a Protection Order at their nearest magistrate's court at no cost.",
  "Under the Children Act, child maintenance obligations can be enforced through court orders regardless of marital status.",
  "Any contract obtained through fraud, duress, or misrepresentation is voidable at the injured party's option.",
  "Kenya's Arbitration Act allows parties to resolve disputes privately without going to court.",
  "Under the Consumer Protection Act, goods must be fit for purpose — if not, you're entitled to a refund or replacement.",
  "Employees dismissed without cause are entitled to severance pay of at least 15 days' basic wages per completed year.",
  "A power of attorney must be registered at the Lands Registry if it relates to any property transaction.",
  "A landlord cannot forcibly evict a tenant without a valid court order — doing so is illegal harassment.",
  "Kenya's Companies Act 2015 requires companies to file annual returns with the Registrar of Companies.",
  "The Small Claims Court handles civil claims of up to KES 1,000,000 quickly and without needing a lawyer.",
  "Under the Data Protection Act 2019, organisations must obtain your consent before processing your personal data.",
  "Cyber-bullying and online harassment can attract criminal charges under the Computer Misuse and Cybercrimes Act 2018.",
  "Article 50 of the Constitution guarantees every person the right to a fair hearing before any court or tribunal.",
  "Under the Traffic Act, a person involved in an accident must stop and give their details to the other party and police.",
  "The National Gender and Equality Commission protects Kenyans from discrimination based on sex, gender, or marital status.",
  "A child born in Kenya to at least one Kenyan parent is automatically a Kenyan citizen by birth.",
  "Under the Succession Act, a spouse has the right to inherit the matrimonial home regardless of whether they are named in the will.",
  "The Kenya Revenue Authority cannot seize property without a valid court order authorising distraint.",
  "Under the Banking Act, a bank must give a borrower 30 days' written notice before selling charged property.",
  "Employees are entitled to 3 months' maternity leave under the Employment Act 2007.",
  "Male employees are entitled to 2 weeks of paternity leave upon the birth of their child.",
  "The National Construction Authority must certify all residential and commercial buildings before occupation.",
  "Defamation — making false statements that damage another person's reputation — can lead to civil or criminal liability in Kenya.",
  "A police officer must inform you of the reason for your arrest at the time of arrest under Article 49 of the Constitution.",
  "You have the right to remain silent and to consult a lawyer before answering any police questions.",
  "Under the Trespass Act, unauthorised entry onto someone's land is a criminal offence punishable by a fine or imprisonment.",
  "The Kenya Copyright Board protects original literary, artistic, and musical works for the creator's lifetime plus 50 years.",
  "A tenant who has lived on land for over 12 years without the owner's objection may claim adverse possession.",
  "Under the Rent Restriction Act, a landlord cannot increase rent by more than 10% per year without tribunal approval.",
  "The National Environment Management Authority (NEMA) can prosecute individuals and companies for illegal dumping.",
  "Under Article 43, every Kenyan has the right to accessible and adequate housing and not to be evicted arbitrarily.",
  "A person acquitted of a criminal charge cannot be tried again for the same offence — this is the rule against double jeopardy.",
  "Employees working more than 8 hours a day are entitled to overtime pay at a rate of 1.5 times the normal hourly rate.",
  "Under the Occupational Safety Act, employers must provide a safe working environment for all employees.",
  "Landlords are legally required to maintain rental property in a habitable and safe condition.",
  "The Marriage Act 2014 recognises civil, religious, and customary marriages as equally valid in Kenya.",
  "Divorce proceedings under the Marriage Act can be filed after a minimum of 3 years of marriage.",
  "Child custody decisions in Kenya are always guided by the best interests of the child, not the preferences of the parents.",
  "The Anti-Corruption and Economic Crimes Act makes it illegal to solicit or accept a bribe from any public officer.",
  "Kenya's Constitution prohibits torture, cruel treatment, and degrading punishment in all circumstances.",
  "A company director can be personally liable for debts if the company was used fraudulently.",
  "Under the Insolvency Act 2015, individuals can apply for bankruptcy protection and have debts restructured or discharged.",
  "Article 35 of the Constitution gives every Kenyan the right to access information needed to exercise their legal rights.",
  "The National Land Commission resolves historical land injustices and manages public land on behalf of the national government.",
  "Domestic workers are employees under the Employment Act and are entitled to leave, rest days, and minimum wage.",
  "You can report discrimination in employment to the Employment and Labour Relations Court free of charge.",
  "Under the Persons with Disabilities Act, employers with more than 25 staff must reserve 5% of jobs for persons with disabilities.",
  "Kenya's Witness Protection Agency provides protection to witnesses in serious criminal trials.",
  "Under the Public Procurement Act, all government contracts above KES 100,000 must go through a competitive tender process.",
  "A lease of more than one year must be registered at the Lands Registry to be legally enforceable in Kenya.",
  "The National Council for Law Reporting publishes all official Kenya Law Reports freely at kenyalaw.org.",
  "Under the Sexual Offences Act, consent obtained by fraud, force, or intoxication is not valid consent.",
  "Every Kenyan has the right to form and join associations, including trade unions, under Article 36 of the Constitution.",
];

// ── Swahili Tips (300 Vidokezo vya Kisheria) ──
const LEGAL_TIPS_SW = [
  // KATIBA (Haki za Msingi)
  "Chini ya Katiba ya Kenya 2010, kila raia ana haki ya kupata taarifa inayoshikiliwa na serikali.",
  "Kifungu cha 19 cha Katiba kinasema kwamba haki na uhuru wa kimsingi ni wa kila mtu bila ubaguzi wowote.",
  "Katiba ya Kenya inahakikisha haki ya maisha kwa kila mtu — hakuna mtu anayeweza kunyimwa maisha kiholela.",
  "Kifungu cha 28 cha Katiba kinatoa haki ya kuheshimiwa na kutambuliwa utu wa mtu.",
  "Kila mtu ana haki ya kupata elimu ya msingi bure chini ya Katiba ya Kenya 2010.",
  "Chini ya Kifungu cha 43, kila Mkenya ana haki ya matibabu ya msingi bila malipo.",
  "Katiba inalinda haki ya kila mtu kuishi mahali salama na pasipo tishio la unyakuzi wa nyumba.",
  "Hakuna mtu anayeweza kufungwa jela kwa deni la kawaida la biashara chini ya sheria ya Kenya.",
  "Chini ya Kifungu cha 27, wanawake na wanaume wana haki sawa mbele ya sheria.",
  "Haki ya kumiliki mali inalindwa na Kifungu cha 40 cha Katiba ya Kenya.",
  "Chini ya Katiba, kila mtu ana haki ya kujieleza bila hofu ya kuadhibiwa isipokuwa pale ambapo inasababisha madhara.",
  "Kifungu cha 50 kinahakikisha haki ya kusikilizwa kwa haki mbele ya mahakama yoyote.",
  "Hakuna mtu anayeweza kutiwa hatiani bila ushahidi wa kutosha mbele ya mahakama.",
  "Chini ya Kifungu cha 49, mtu aliyekamatwa ana haki ya kujulishwa sababu za kukamatwa kwake.",
  "Kila mtu ana haki ya kuwasiliana na wakili wake mara baada ya kukamatwa.",
  "Mshtakiwa ana haki ya kutafsiriwa lugha anayoielewa wakati wa kesi yake mahakamani.",
  "Chini ya Katiba, taifa haliwezi kumfanya mtu asiye na makazi au ardhi bila kupata fidia ya haki.",
  "Haki ya kura na ushiriki katika uchaguzi inalindwa na Katiba kwa kila raia mzima wa Kenya.",
  "Chini ya Kifungu cha 36, kila Mkenya ana uhuru wa kujiunga na vyama vya siasa na mashirika.",
  "Katiba ya Kenya inakataza matumizi ya mateso, udhalilishaji na adhabu za kikatili.",
  // ARDHI NA MAKAZI
  "Chini ya Sheria ya Ardhi 2012, raia wote wa Kenya wana haki ya kumiliki ardhi popote nchini bila kuzuiwa na kabila.",
  "Mpangaji anayeishi katika nyumba kwa zaidi ya miaka 12 bila kupinga mmiliki anaweza kudai miliki kwa njia ya 'adverse possession'.",
  "Mmiliki wa nyumba hawezi kukufukuza bila amri ya mahakama — kufanya hivyo ni uhalifu wa kutesa mpangaji.",
  "Chini ya Sheria ya Makazi, mpangaji ana haki ya kupokea notisi ya siku 30 kabla ya kuongezwa kwa kodi ya nyumba.",
  "Kodi ya nyumba haiwezi kuongezwa kwa zaidi ya asilimia 10 kwa mwaka bila idhini ya Tribunal ya Ukodishaji.",
  "Mkataba wa kukodisha unaozidi mwaka mmoja lazima usajiliwe katika Usajili wa Ardhi ili uwe halali kisheria.",
  "Chini ya Sheria ya Ardhi, ardhi ya umma inayosimamiwa na Tume ya Ardhi ya Taifa haiwezi kuuzwa bila idhini ya bunge.",
  "Tume ya Ardhi ya Taifa inashughulikia madai ya ardhi ya kihistoria na injustisi za ardhi.",
  "Kabla ya kuuza ardhi, mmiliki lazima azingatie haki ya kwanza ya kununua (right of pre-emption) kwa wakaazi wanaokaa pale.",
  "Chini ya Sheria ya Usajili wa Ardhi, hati ya ardhi iliyosajiliwa ni ushahidi wa nguvu wa umiliki.",
  "Serikali haiwezi kuchukua ardhi bila kutoa fidia ya haki na kwa wakati muafaka chini ya Katiba.",
  "Kupima ardhi bila ruhusa ya mmiliki ni kosa la jinai chini ya Sheria ya Ardhi.",
  "Mpangaji ana haki ya kupata risiti ya malipo ya kodi kila wakati analipa.",
  "Kumiliki ardhi kwa pamoja na mwenzi wa ndoa kunamaanisha hakuna anayeweza kuiuza bila idhini ya mwingine.",
  "Sheria ya Udhibiti wa Kodi inalinda wapangaji kutoka kwa ongezeko la ghafla la kodi zisizo na msingi.",
  "Migogoro ya ardhi inashughulikiwa na Mahakama ya Mazingira na Ardhi (ELC) nchini Kenya.",
  "Haki ya kupita kwenye njia ya umma (right of way) haiwezi kuzuiwa na mmiliki wa ardhi kama njia hiyo imetambuliwa kisheria.",
  "Chini ya Sheria ya Makazi, nyumba ya ndoa haiwezi kuuzwa bila idhini ya mwenzi wa ndoa.",
  "Mmiliki wa ardhi lazima alipe kodi ya ardhi (land rates) kwa serikali ya kaunti kila mwaka.",
  "Hati ya ardhi inayopatikana kwa ulaghai inaweza kubatilishwa mahakamani wakati wowote.",
  // AJIRA NA WAFANYAKAZI
  "Chini ya Sheria ya Ajira 2007, mfanyakazi ana haki ya likizo ya siku 21 za kila mwaka baada ya miezi 12 ya kufanya kazi.",
  "Wafanyakazi wa kike wana haki ya likizo ya uzazi ya miezi 3 bila kupoteza mshahara wao.",
  "Wafanyakazi wa kiume wana haki ya likizo ya uzazi wa baba ya wiki 2 baada ya kuzaliwa kwa mtoto.",
  "Mwajiri lazima atoe notisi ya maandishi ya miezi 3 au kulipa fidia badala ya notisi kabla ya kumaliza mkataba.",
  "Chini ya Sheria ya Ajira, mfanyakazi anayefukuzwa kazi bila sababu ana haki ya fidia ya siku 15 za mshahara kwa kila mwaka.",
  "Mwajiri lazima atoe mkataba wa maandishi wa ajira ndani ya miezi 2 ya kuanza kazi.",
  "Wafanyakazi wa nyumbani (wasaidizi wa nyumbani) wana haki sawa za kisheria kama wafanyakazi wengine.",
  "Kufanya kazi zaidi ya saa 8 kwa siku inapaswa kulipwa kwa kiwango cha mara 1.5 ya mshahara wa kawaida.",
  "Mwajiri hawezi kubagua wafanyakazi kwa misingi ya jinsia, dini, kabila au hali ya ndoa.",
  "Mfanyakazi ana haki ya kuomba likizo ya ugonjwa ya siku 7 kwa mshahara kamili na siku 7 kwa nusu mshahara.",
  "Sheria ya Ajira inahakikisha kuwa wafanyakazi wote wanastahili mshahara wa chini (minimum wage) uliowekwa na serikali.",
  "Mwajiri anayemfukuza mfanyakazi bila kufuata taratibu za kisheria anastahili kulipa fidia kubwa mahakamani.",
  "Wafanyakazi wana haki ya kujiunga na vyama vya wafanyakazi (trade unions) na kupiga mgomo kwa amani.",
  "Chini ya Sheria ya Usalama Kazini, mwajiri lazima atoe mazingira salama ya kazi kwa wafanyakazi wote.",
  "Mfanyakazi anayeumia kazini ana haki ya fidia chini ya Sheria ya Majeraha ya Kazini (WIBA).",
  "Mkataba wa ajira unaowekwa kwa nguvu au hadaa ni batili na hauna nguvu kisheria.",
  "Mfanyakazi ana haki ya kuona nakala ya mkataba wake wa ajira wakati wowote.",
  "Mwajiri hawezi kupunguza mshahara wa mfanyakazi bila idhini yake au amri ya mahakama.",
  "Watoto chini ya miaka 13 hawaruhusiwi kufanya kazi yoyote nchini Kenya — ni kosa la jinai.",
  "Mfanyakazi anayeacha kazi kwa sababu za hatari za usalama ana haki ya kulindwa kisheria.",
  // NDOA NA FAMILIA
  "Sheria ya Ndoa ya 2014 inatambua ndoa za kiraia, za kidini na za kimila kama ndoa halali sawa kabisa.",
  "Ndoa haiwezi kufanywa bila idhini ya wazazi au walezi kwa mtu chini ya miaka 18.",
  "Chini ya Sheria ya Ndoa, mtu anaweza kuomba talaka baada ya kuolewa kwa miaka 3 bila kuendelea.",
  "Mke na mume wana haki sawa za kumiliki mali iliyopatikana wakati wa ndoa.",
  "Familia za mitala zinazostawi chini ya sheria za kimila zinatambuliwa kisheria nchini Kenya.",
  "Watoto wote — wa ndani na nje ya ndoa — wana haki sawa za kisheria za ulinzi na matunzo.",
  "Mzazi anayemtunza mtoto ana haki ya kupata malipo ya mtoto (child maintenance) kutoka kwa mzazi mwingine.",
  "Mahakama inazingatia manufaa bora ya mtoto katika kila uamuzi wa ulezi wa watoto.",
  "Mtu anayepigana nyumbani na mwenzi wake ana haki ya kupata 'Protection Order' bila malipo kutoka mahakamani.",
  "Chini ya Sheria ya Watoto, kubana, kupiga au kutesa mtoto ni kosa la jinai linaloadhibiwa kwa kifungo.",
  "Wazazi wote wawili wana wajibu wa kisheria wa kumhudumia mtoto hadi afikiapo umri wa miaka 18.",
  "Mahakama inaweza kuamua kumkabidhi mtoto kwa mzazi mmoja au wote wawili kulingana na hali.",
  "Ndoa isiyofanyika mbele ya shahidi mbili sio halali kisheria nchini Kenya.",
  "Mtu anayeshiriki katika ndoa mbili za kiraia wakati huo huo anatenda kosa la jinai la 'bigamy'.",
  "Chini ya Sheria ya Familia, ndugu wa karibu wanaweza kutaka mahakama kumhudumia mzee asiye na uwezo.",
  "Wazazi wasio katika ndoa wana wajibu sawa wa kisheria wa kumhudumia watoto wao.",
  "Talaka lazima ihukumiwe na mahakama — makubaliano ya kimya kimya ya kuachana hayatambuliwi kisheria.",
  "Mali iliyopatikana kabla ya ndoa inabaki mali ya mtu mmoja isipokuwa pale ambapo mkataba wa kabla ya ndoa unasema vinginevyo.",
  "Mashirika ya serikali kama NGEC yanaweza kusaidia familia zenye migogoro ya haki za wanawake na watoto.",
  "Chini ya Sheria ya Watoto Wanaookotwa, mtu anaweza kupitia mchakato wa kisheria wa kuasili mtoto.",
  // MAKOSA YA JINAI
  "Mshukiwa ana haki ya kuwasiliana na wakili wake mara moja baada ya kukamatwa.",
  "Polisi hawana haki ya kukuchukua dhamana ya mali yako bila amri ya mahakama.",
  "Chini ya Katiba, hakuna mtu anayeweza kufungwa zaidi ya masaa 24 bila kupelekwa mahakamani.",
  "Kukana dhamana kwa mshtakiwa lazima kuwe na sababu za msingi za kisheria.",
  "Kanuni ya 'habeas corpus' inamaanisha mahakama inaweza kuamuru mtu aliyeshikiliwa bila sababu aachiliwe huru.",
  "Chini ya Sheria ya Usalama wa Mtandao, ulaghai wa mtandaoni, udanganyifu wa mtandao na unyanyasaji wa mtandao ni makosa ya jinai.",
  "Mtu anayejua taarifa za ugaidi na kutotoa taarifa hizo kwa mamlaka ana hatari ya kuchukuliwa hatua za kisheria.",
  "Sheria ya Kenya inakataza ubakaji wa ndani ya ndoa — hii ni kosa la jinai kama ubakaji wowote mwingine.",
  "Kutoa rushwa kwa afisa wa umma ni kosa la jinai linaloadhibiwa hadi kifungo cha miaka 10.",
  "Mshtakiwa ana haki ya kutafsiriwa kesi yake katika lugha anayoielewa bila malipo.",
  "Kufungwa jela kwa kipindi cha miaka mingi bila kusikilizwa kesi ni kinyume cha Katiba.",
  "Chini ya Sheria ya Silaha, kumiliki silaha bila leseni ni kosa zito la jinai.",
  "Mtu aliyeachiliwa kwa makosa ana haki ya kulipwa fidia na serikali kwa muda wake wa kufungwa bila sababu.",
  "Kuvunja amri ya mahakama (contempt of court) kunaadhibiwa kwa faini au kifungo.",
  "Sheria ya Kompyuta na Uhalifu wa Mtandao inakataza kupiga picha au kurekodi mtu bila idhini yake.",
  "Polisi wanaopokea malalamiko lazima watoe nakala ya OB (Occurrence Book) kwa mlalamikaji bila malipo.",
  "Shahidi wa kesi ya uhalifu ana haki ya kulindwa na Wakala wa Ulinzi wa Mashahidi nchini Kenya.",
  "Rushwa ya afisa wa polisi inaweza kuripotiwa kwa IPOA (Mamlaka ya Kuangalia Masuala ya Polisi) bila hofu.",
  "Chini ya Sheria ya Kutoa Fidia ya Wahanga, wahanga wa uhalifu mkubwa wanaweza kupata fidia ya serikali.",
  "Mtu anayeshikiliwa na polisi ana haki ya kupiga simu kwa familia yake au wakili wake mara moja.",
  // BIASHARA NA MIKATABA
  "Mkataba wowote unaohitaji mtindo wa maandishi ukifanywa kwa mdomo peke yake unaweza kuwa mgumu kutekeleza.",
  "Mkataba wa biashara unaofanya kazi inayopingana na sheria ni batili na hauna nguvu.",
  "Chini ya Sheria ya Kampuni 2015, kampuni lazima iwasilishe ripoti yake ya kila mwaka katika Usajili wa Makampuni.",
  "Mkurugenzi wa kampuni anaweza kuchukuliwa dhambi binafsi kwa madeni ya kampuni kama alitumia kampuni kwa ulaghai.",
  "Biashara zote nchini Kenya zinahitaji leseni ya biashara kutoka kwa serikali ya kaunti husika.",
  "Ushirika wa biashara unaohitaji hisa lazima usajiliwe katika Mamlaka ya Soko la Hisa la Nairobi (NSE) au SASRA.",
  "Mkataba wa pango wa biashara la zaidi ya mwaka mmoja lazima usajiliwe kisheria ili uwe wa nguvu.",
  "Mwanachama wa biashara ya ushirika ana haki ya kuona mahesabu ya kampuni kila wakati.",
  "Chini ya Sheria ya Kulinda Watumiaji, bidhaa lazima ziwe salama na zinazofaa kwa kusudi lililotangazwa.",
  "Mfanyabiashara anayedanganya wateja wake kwa matangazo ya uongo anaweza kushtakiwa kisheria.",
  "Chini ya Sheria ya Ushindani, kampuni zinazokuja pamoja ili kupandisha bei ni kinyume cha sheria.",
  "Mkataba wa NDA (Non-Disclosure Agreement) unalinda siri za biashara na unaweza kutekelezwa mahakamani.",
  "Deni la biashara linaweza kudaiwa mahakamani hadi miaka 6 baada ya kutokea kwa deni hilo.",
  "Wakati kampuni inafilisika, madai ya wafanyakazi (mishahara na fidia) yanasimama mbele ya madai ya wadai wengine.",
  "Biashara ya mtandaoni inayofanya kazi Kenya lazima izingatie sheria za Kenya hata kama seva ipo nje ya nchi.",
  "Mkulima au msambazaji anayeuzwa bidhaa feki au za udanganyifu ana haki ya kudai fidia kisheria.",
  "Sheria ya Ufilisi 2015 inaruhusu watu binafsi kudai hifadhi ya madeni na kuanza upya kiuchumi.",
  "Kampuni inayochukua pesa za wateja bila kutoa huduma zinazostahili inaweza kufunguliwa kesi ya udanganyifu.",
  "Mkataba wa kazi unaopingana na Sheria ya Ajira ni batili kwa sehemu inayopingana na sheria.",
  "Wakurugenzi wa kampuni wana wajibu wa kisheria wa kutenda kwa manufaa ya kampuni na wanahisa.",
  // MIRATHI NA WOSIA
  "Wosia lazima uwe wa maandishi na kusainiwa na mtu mwenye umri wa miaka 18 na zaidi.",
  "Wosia lazima ushuhudiwe na watu wawili wazima wasio warithi wa mali iliyotajwa.",
  "Chini ya Sheria ya Mirathi (Cap. 160), mke/mme ana haki ya kurithi nyumba ya familia hata bila kutajwa kwenye wosia.",
  "Mtoto ambaye hajatajwa kwenye wosia ana haki ya kudai sehemu ya mali mbele ya mahakama.",
  "Kama mtu atafariki bila wosia, mali yake itagawanywa kulingana na sheria ya mirathi ya kawaida ya Kenya.",
  "Msimamizi wa wosia (executor) ana wajibu wa kisheria wa kulinda mali ya marehemu mpaka mali igawanywe.",
  "Chini ya Sheria ya Mirathi, madeni ya marehemu lazima yalipwe kwanza kabla ya kugawa mali kwa warithi.",
  "Kuhangaika kwa ardhi ya familia mara nyingi hutokea pale ambapo hakuna wosia ulioandikwa.",
  "Wosia unaofanywa kwa nguvu, hadaa au shinikizo unaweza kubatilishwa na mahakama.",
  "Wakati mtu atafariki, familia inaweza kuomba amri ya mahakama (Letters of Administration) kusimamia mali.",
  "Watoto wa nje ya ndoa wana haki sawa za mirathi chini ya Sheria ya Mirathi ya Kenya.",
  "Chini ya sheria ya mirathi ya kimila, ardhi ya ukoo inaweza kuzuiwa kutoka kwa mtu asiye wa ukoo.",
  "Barua za usimamizi (Letters of Administration) zinaweza kuombiwa mahakamani bila wakili.",
  "Chini ya Sheria ya Mirathi, wazazi wa marehemu wanaweza kurithi kama hakuna mwenzi au watoto.",
  "Wosia uliofanywa kwa Kiswahili au lugha nyingine yoyote ya Kenya ni halali kisheria.",
  "Kama mtu atafariki na mali nyingi, mahakama inaweza kutaka faili la mirathi kabla ya kugawa mali.",
  "Thamani ya mali ya marehemu inahitaji tathmini ya mtaalamu kabla ya kugawanywa kwa warithi.",
  "Mtu anaweza kubadilisha wosia wake wakati wowote akiwa hai na mwenye akili timamu.",
  "Katiba ya Kenya inalinda haki ya wanawake kurithi mali sawa na wanaume.",
  "Usimamizi wa mirathi unaweza kuchukua miaka 2-3 mahakamani — kwa hivyo wosia wa mapema ni muhimu.",
  // HAKI ZA ARDHI — MIJI
  "Ruhusa ya ujenzi inahitajika kwa kila jengo jipya au ukarabati mkubwa nchini Kenya.",
  "Serikali ya kaunti ina haki ya kubomoa jengo lililojengwa bila ruhusa bila kulipa fidia.",
  "Kiwango cha ghorofa ambacho unaweza kujenga kwenye ardhi yako kimedhibitiwa na NCA na serikali ya kaunti.",
  "Chini ya Sheria ya Mazingira, ujenzi karibu na mto au ziwa bila idhini ya NEMA ni kosa la kisheria.",
  "Mpaka wa ardhi lazima uwekwe wazi na upimaji rasmi kufanywa na msurveyor aliyeidhinishwa.",
  "Jengo la kuuza au kukodisha lazima liwe na hati ya ukaguzi wa mwisho kutoka kwa mamlaka ya kaunti.",
  "Mtu anayenunua nyumba lazima ahakikishe ardhi haina madeni ya kodi ya ardhi kabla ya ununuzi.",
  "Agano la muda wa matumizi ya ardhi (leasehold) linaisha baada ya muda wake na lazima lipyaishwe au migogoro inaweza kutokea.",
  "Nyumba ya hisa (apartment) inaweza kuwa na mgawanyo wa matumizi ya pamoja (common areas) uliolindwa kisheria.",
  "Kamati ya wenyeji wa nyumba za ghorofa ina mamlaka ya kisheria kudhibiti matumizi ya maeneo ya pamoja.",
  // AFYA NA MAZINGIRA
  "Kila Mkenya ana haki ya matibabu ya dharura bila kulazimishwa kulipa kwanza.",
  "Hospitali ya serikali haiwezi kukataa matibabu ya dharura kwa mgonjwa yeyote.",
  "Chini ya Sheria ya Afya ya Umma, mazingira machafu yanayosababisha magonjwa yanaweza kufuatiwa na mamlaka.",
  "Dawa za bandia au zenye madhara zinaweza kuripotiwa kwa KEBS au Mamlaka ya Dawa nchini Kenya.",
  "Mgonjwa ana haki ya kupata taarifa kamili kuhusu hali yake ya afya na matibabu anayopewa.",
  "Idhini ya mgonjwa (informed consent) lazima ipatikane kabla ya upasuaji wowote wa lazima.",
  "Hospitali haipaswi kuzuia mgonjwa aliyepona bila sababu ya kisheria kama kisingizio cha malipo.",
  "Chini ya Sheria ya Mazingira, kutupa taka sumu kwenye ardhi au mito ni kosa linaloadhibiwa kwa faini kubwa.",
  "NEMA ina mamlaka ya kufunga biashara yoyote inayoharibu mazingira bila idhini.",
  "Mtu anayeumia kwa sababu ya uzembe wa daktari ana haki ya kudai fidia mahakamani.",
  // MTANDAO NA TEKNOLOJIA
  "Sheria ya Ulinzi wa Takwimu ya 2019 inahakikisha kwamba data yako ya kibinafsi inalindwa na kampuni zinazoshika.",
  "Kampuni au mtu anayeshiriki data yako ya kibinafsi bila idhini yako amekiuka Sheria ya Ulinzi wa Takwimu.",
  "Uthibitisho wa kidijitali (digital signature) unachukuliwa kama sahihi halisi kisheria nchini Kenya.",
  "Udanganyifu wa mtandaoni (online fraud) unaweza kuripotiwa kwa DCI Cybercrime Unit.",
  "Picha za ngono ambazo hazikuridhiwa (non-consensual intimate images) ni kosa la jinai nchini Kenya.",
  "Mtoto aliyepigiwa picha za ngono au kusambazwa picha hizo ana ulinzi mkubwa wa kisheria.",
  "Unyanyasaji wa mtandaoni (cyberbullying) ni kosa la jinai chini ya Sheria ya Kompyuta na Uhalifu 2018.",
  "Biashara ya mtandaoni lazima iwe na masharti ya matumizi (terms of service) wazi kwa wateja.",
  "Kampuni inayokusanya data ya watoto lazima iwe na idhini ya wazazi kwanza.",
  "Haki ya kusahaulika kidijitali (right to be forgotten) inakuruhusu kuomba kuondolewa data yako mtandaoni.",
  // USHURU NA FEDHA
  "KRA ina haki ya kukufuatilia kwa kodi ambazo haujailipa, lakini lazima ikupe notisi ya kwanza.",
  "Mfanyabiashara mwenye mapato ya zaidi ya KES 5,000,000 kwa mwaka lazima asajili kwa VAT.",
  "Chini ya Sheria ya Mapato, mishahara yote inayozidi kikomo cha ushuru lazima itozwe ushuru wa PAYE.",
  "NHIF na NSSF ni michango ya lazima — mwajiri anayeshindwa kulipa anaweza kushtakiwa kisheria.",
  "Mnunuzi wa nyumba au ardhi analazimika kulipa kodi ya stamp duty kabla ya kufanya usajili.",
  "Kampuni ya bima inayokataa kudai bila sababu ya msingi inaweza kushtakiwa katika Mamlaka ya Bima (IRA).",
  "Benki haiwezi kuuza mali ya mkopo bila kutoa notisi ya maandishi ya siku 90 kwanza.",
  "Mtu ambaye amenyimwa mkopo bila sababu ya kisheria ana haki ya kuomba mapitio ya uamuzi huo.",
  "Chini ya Sheria ya Ufilisi, mtu anayefilisika ana haki ya kulindwa dhidi ya madhara ya wadai wakati wa mchakato.",
  "Mahesabu ya benki yanaweza kuombiwa kama ushahidi mahakamani kwa amri ya hakimu.",
  // ELIMU NA VIJANA
  "Elimu ya msingi ni haki ya msingi na ni bure kwa watoto wote nchini Kenya chini ya Katiba.",
  "Mtoto hawezi kufukuzwa shule kwa sababu ya ujauzito chini ya mwongozo wa Wizara ya Elimu.",
  "Adhabu ya kupiga wanafunzi (corporal punishment) ni marufuku nchini Kenya na ni kosa la jinai.",
  "Shule haina haki ya kumzuia mtoto ambaye hajalipa ada kwa zaidi ya siku tatu bila idhini ya wazazi.",
  "Mtoto mwenye ulemavu ana haki ya elimu ya msaada maalum (special needs education) bila malipo.",
  "Wazazi au walezi wanaweza kulalamika kwa TSC (Tume ya Utumishi wa Walimu) kuhusu tabia mbaya ya mwalimu.",
  "Vijana wenye umri wa miaka 18 wana haki ya kupiga kura katika uchaguzi wote wa kitaifa na wa kaunti.",
  "Mtoto wa shule ya sekondari hawezi kufanya kazi ya kulipwa wakati wa masaa ya shule.",
  "Usajili wa kuzaliwa ni haki ya msingi ya mtoto — familia inaweza kupata nakala bure mahakamani kama ilipotea.",
  "Bodi ya Wakurugenzi ya shule ina wajibu wa kisheria wa kuhakikisha usalama na hali njema ya wanafunzi.",
  // USALAMA WA JAMII
  "Serikali ya kaunti ina wajibu wa kutoa maji safi na usafi wa mazingira kwa wakazi wake.",
  "Wakazi wa mtaa wanaweza kuunda kamati za usalama wa mitaa ambazo zinatambuliwa kisheria.",
  "Polisi wana wajibu wa kutoa taarifa ya usimamizi (OB extract) ndani ya saa 24 kwa mtu aliyeomba.",
  "Mtu aliyedhulumwa na polisi ana haki ya kulalamika kwa IPOA bila hofu ya kulipizwa kisasi.",
  "Mtu aliyeumia katika ajali ya barabara ana haki ya kudai fidia kutoka kwa Mfuko wa Fidia ya Waathirika wa Barabara.",
  "Kampuni ya basi au treni inayosababisha ajali kwa uzembe inaweza kushtakiwa na abiria walioumia.",
  "Chini ya Sheria ya Trafiki, dereva anayepiga mtu barabara lazima asimame na kutoa taarifa kwa polisi.",
  "Maumivu ya moyo au mateso ya kiakili yanayosababishwa na mtu mwingine yanaweza kudaiwa fidia mahakamani.",
  "Mlalamikaji wa uhalifu ana haki ya kupata mwisho wa kesi na taarifa kuhusu uamuzi wa mahakama.",
  "Serikali inalazimika kulinda raia wake dhidi ya vitendo vya ugaidi chini ya Sheria ya Kuzuia Ugaidi.",
  // HAKI ZA WANAWAKE
  "Mwanamke ana haki sawa ya kumiliki ardhi na mali kama mwanaume chini ya Katiba ya Kenya.",
  "Mwanamke mjamzito hawezi kufukuzwa kazi kwa sababu ya ujauzito — ni ubaguzi haramu.",
  "Sheria ya Uchaguzi inahakikisha uwakilishi wa angalau theluthi moja (1/3) ya jinsia moja katika uongozi.",
  "Ubakaji wa ndani ya ndoa ni kosa la jinai nchini Kenya na unaweza kuripotiwa polisi mara moja.",
  "Ukeketaji (FGM) ni kosa la jinai la hali ya juu nchini Kenya, linalowahusu pia wale wanaopeleka msichana nje ya nchi kwa ukeketaji.",
  "NGEC (Tume ya Kitaifa ya Jinsia na Usawa) inalinda haki za wanawake na inaweza kusaidia bila malipo.",
  "Mwanamke anayefanyiwa ukatili wa kimwili, kijinsia au kiakili ana haki ya amri ya ulinzi (Protection Order).",
  "Mwanamke aliyeacha ndoa ana haki ya nusu ya mali iliyopatikana wakati wa ndoa.",
  "Mwanamke asiye na ajira ana haki ya kupata msaada wa mali kutoka kwa mme wake hata baada ya talaka.",
  "Sehemu maalum za mahakama (Gender Violence Courts) zimeundwa kushughulikia kesi za ukatili wa kijinsia kwa haraka.",
  // ULEMAVU NA WAZEE
  "Watu wenye ulemavu wana haki ya kupata huduma zote za umma bila vikwazo au ubaguzi.",
  "Mwajiri mwenye zaidi ya wafanyakazi 25 lazima atekeleze sera ya kuhifadhi asilimia 5 ya nafasi za kazi kwa watu wenye ulemavu.",
  "Wazee wana haki ya kupata msaada wa fedha (Inua Jamii) kutoka kwa serikali kwa mwaka.",
  "Mtu mzee asiye na uwezo wa kujiamua anaweza kupewa mlindaji wa kisheria (guardian) na mahakama.",
  "Unyanyasaji wa wazee — kimwili, kiakili au kiuchumi — ni kosa la jinai nchini Kenya.",
  "Watu wenye ulemavu wana haki ya sauti za kuchagua katika nyumba za hadhira na matukio ya umma.",
  "Fomu za umma kama fomu za uchaguzi lazima ziwe katika muundo unaofikiwa na watu wenye ulemavu.",
  "Mtu aliye na ulemavu wa akili haastahili kuchukuliwa hatua za kisheria peke yake bila msaada wa mlindaji.",
  "Watoto wenye ulemavu wana haki ya elimu bora na bila kubaguliwa katika shule za kawaida.",
  "Serikali ina wajibu wa kutoa upatikanaji wa bure wa vifaa vya usaidizi kwa watu wenye ulemavu wa hali ya juu.",
  // RASILIMALI ZA KISHERIA
  "Msaada wa kisheria wa bure unapatikana kupitia Shirika la Msaada wa Kisheria Kenya (Legal Aid Kenya).",
  "Kituo cha Sheria (Kituo Cha Sheria) kinatoa huduma za kisheria bure kwa watu masikini nchini Kenya.",
  "Kenyalaw.org ni tovuti rasmi ya bure ambayo ina sheria zote, mashauri ya mahakama na katiba ya Kenya.",
  "Chama cha Mawakili wa Kenya (LSK) kina orodha ya mawakili wote walioidhinishwa ambayo unaweza kutumia.",
  "Ofisi ya Ombudsman wa Kitaifa (CAJ) inashughulikia malalamiko dhidi ya utawala mbaya wa serikali.",
  "Mahakama Ndogo za Madai (Small Claims Court) zinashughulikia madai ya hadi KES 1,000,000 kwa haraka na bila wakili.",
  "Tume ya Haki za Binadamu ya Kenya (KNCHR) inashughulikia ukiukwaji wa haki za binadamu bila malipo.",
  "Jopo la Mahakama la Kenya (Judiciary) lina programu ya msaada wa kisheria kwa watu wasioweza kumudu wakili.",
  "Baraza la Usuluhishi la Ardhi (Land Disputes Tribunals) linashughulikia migogoro ya ardhi bila ada kubwa.",
  "Mtu yeyote anaweza kuwasiliana na ofisi ya DPP (Mkurugenzi wa Mashtaka ya Umma) kama ana ushahidi wa uhalifu.",
  // HAKI ZA MAKAZI YA MJINI
  "Wakazi wa vijiji visivyo rasmi (informal settlements) wana haki ya kupinga kuhamishwa bila fidia ya haki.",
  "Serikali lazima itoe notisi ya angalau siku 90 kabla ya kuanza kuvunja makazi yoyote ya wakazi.",
  "Wakazi wa makazi duni wanaweza kudai umiliki kwa ardhi wanayoishi kwa kutumia kanuni ya adverse possession.",
  "Kamati za wakazi wa mtaa zina haki za kisheria za kuwakilisha wanakijiji katika mazungumzo na serikali.",
  "Mradi wa makazi ya bei nafuu wa serikali unalazimisha kuwa 20% ya nyumba zote zitengwe kwa watu wa kipato cha chini.",
  "Mabadiliko ya matumizi ya ardhi kutoka makazi kwenda biashara yanahitaji idhini ya kaunti.",
  "Mkodishaji wa nyumba ana wajibu wa kuhakikisha maji, umeme na mfumo wa maji taka unafanya kazi vizuri.",
  "Kampuni za mjenzi zinazodai pesa bila kuanza ujenzi zinaweza kushtakiwa kwa udanganyifu.",
  "Mkataba wa manunuzi ya nyumba lazima usainiwe mbele ya notari ili uwe na nguvu kisheria.",
  "Wakati wa kununua nyumba, angalia kama ardhi ina madai yoyote ya kisheria (caveats) katika Usajili wa Ardhi.",
  // MAJI NA NISHATI
  "Kila Mkenya ana haki ya maji safi ya kunywa yanayotolewa na serikali au WASCO iliyoidhinishwa.",
  "Kampuni ya usambazaji wa maji haiwezi kukata maji bila toa notisi ya siku 14.",
  "Kutumia umeme bila malipo (kuchakachua) ni kosa la jinai linalolazimu fidia na kifungo.",
  "Mnunuzi wa paneli za jua (solar panels) ana haki ya udhamini wa vifaa kutoka kwa muuzaji.",
  "EPRA (Mamlaka ya Udhibiti wa Nishati na Petroli) inashughulikia malalamiko kuhusu bei za umeme na nishati.",
  "Serikali ya kaunti ina wajibu wa kuhakikisha taa za barabara zinafanya kazi katika maeneo ya makazi.",
  "Kampuni ya mafuta inayosababisha umwagikaji wa mafuta inajibu kisheria kwa hasara yote ya mazingira.",
  "Mtu anayechimba kisima cha maji bila ruhusa ya WRMA (Mamlaka ya Rasilimali za Maji) anatenda kosa la kisheria.",
  "Leseni ya uchimbaji wa maumivu ya ardhi (minerals) inamilikiwa na serikali ya kitaifa, sio mmiliki wa ardhi.",
  "Kampuni za gesi zinazofanya kazi Kenya lazima ziwe na bima ya mazingira na leseni ya NEMA.",
  // HAKI ZA KILIMO
  "Mkulima ana haki ya kupata dawa, mbegu na mbolea zilizo salama na zilizopitiwa na KEPHIS.",
  "Serikali inalazimika kulipa mkulima fidia kama mazao yake yanaathiriwa na hatua za serikali.",
  "Ushirika wa kilimo una wajibu wa kisheria wa kulipa wakulima bei ya haki ndani ya siku 30 za kuwasilisha mazao.",
  "Wanyama wa mtu hayawezi kukamatiwa na jirani au kukaa jirani bila amri ya mahakama.",
  "Mtu anayeharibu mazao ya mkulima kwa makusudi anaweza kushtakiwa kisheria na kulazimika kulipa fidia.",
  "Ardhi ya kilimo inayoathiriwa na mmomonyoko wa udongo kutokana na ujenzi wa jirani ina haki ya kudaiwa fidia.",
  "Chini ya Sheria ya Mifugo, uuzaji wa mifugo lazima ufanyike katika masoko yaliyoidhinishwa.",
  "Mkulima anayepigwa na ukame una haki ya kudai msaada wa dharura wa chakula kutoka kwa serikali.",
  "Ushirika wa kilimo (SACCO) lazima usajiliwe na kuangaliwa na SASRA ili kulinda wanachama.",
  "Biashara ya samaki, nyama au mazao yoyote yanayoathiriwa na hali ya hewa lazima yaidhinishwe na KEBS.",
  // HAKI ZA USAFIRI
  "Dereva wa basi lazima awe na leseni halali na hati ya usafiri wa abiria (PSV) kabla ya kubeba abiria.",
  "Makampuni ya usafiri yanawajibika kisheria kwa majeraha ya abiria wanaoumia katika ajali.",
  "Polisi wa barabarani hawana haki ya kuchukua leseni ya dereva bila kutoa risiti rasmi.",
  "Gari zisizokuwa na bima hazipaswi kuendeleza barabarani — hii ni kosa la jinai.",
  "Abiria wa Uber, Bolt na huduma nyingine za umma ana haki ya kulindwa na bima ya kampuni.",
  "NTSA ina mamlaka ya kufunga kampuni yoyote ya usafiri inayokiuka sheria za usalama.",
  "Kuchukua faini ya barabarani bila kutoa risiti rasmi na kukubalika ni kosa la rushwa.",
  "Mtu aliyenyang'anywa gari lake bila ruhusa halisi ana haki ya kupata gari lake likirudishwa na polisi.",
  "Chini ya Sheria ya Trafiki, dereva lazima asimame pale polisi atakapowaashiria kusimama.",
  "Mtu anayeumia katika ajali ya barabara ana hadi miaka 3 ya kudai fidia kisheria.",
  // HAKI ZA WAFUGAJI
  "Wafugaji wa kaskazini mwa Kenya wana haki za kihistoria za kutumia ardhi ya malisho ya jamii.",
  "Ardhi ya malisho ya jamii haiwezi kugawiwa kwa watu binafsi bila idhini ya jamii nzima.",
  "Migogoro ya mifugo na ardhi inashughulikiwa na Baraza la Mwisho la Ardhi la Kaunti.",
  "Wafugaji wana haki ya kupitia barabara za mifugo (stock routes) zilizotambuliwa kisheria.",
  "Serengeti ya kimataifa na hifadhi za taifa zinalinda wanyamapori lakini haidhibiti maisha ya wafugaji wa jirani bila fidia.",
  // VIDOKEZO VYA ZIADA VYA KISHERIA
  "Kila mtu ana haki ya kupinga amri ya serikali ambayo anaamini ni kinyume cha katiba mahakamani.",
  "Mtu anayedhulumiwa na msimamizi wake wa serikali (civil servant) anaweza kulalamika kwa CAJ bila malipo.",
  "Kila mtu anayeishi Kenya — raia au mgeni — ana haki ya ulinzi wa kisheria dhidi ya udhalimu.",
  "Katiba ya Kenya ni sheria ya juu zaidi na sheria yoyote inayopingana nayo ni batili.",
  "Haki yako ya kimsingi haiwezi kuondolewa na serikali au mtu mwingine isipokuwa mahakama ya juu iwe imeidhinisha.",
  "Chini ya Sheria ya Takwimu, Ofisi ya Takwimu ya Kitaifa (KNBS) inaweza kukusanya data yako lakini lazima ilinde siri yako.",
  "Hati halisi ya kuzaliwa, ndoa au kifo inaweza kuombwa tena katika Usajili wa Raia bila malipo makubwa.",
  "Chini ya Sheria ya Hifadhi ya Jeshi, raia hawana haki ya kubeba silaha wazi bila leseni maalum.",
  "Faini za trafiki zinaweza kupingwa mahakamani ikiwa una ushahidi kwamba hazikuwa za haki.",
  "Mtu anayejua uhalifu unaopangwa ana wajibu wa kisheria wa kutoa taarifa kwa mamlaka husika.",
  "Wakati wa kusimamishwa na polisi, una haki ya kuuliza kwa nini umesimamishwa na jibu unapaswa kupewa.",
  "Hakuna mtu anayeweza kulazimishwa kushuhudia dhidi yake mwenyewe (privilege against self-incrimination).",
  "Sheria ya Kenya inalinda haki ya kila mtu kuomba fidia kwa uharibifu wa mali yake uliosababishwa na mtu mwingine.",
  "Mgawanyo wa majukumu ya serikali katika matawi matatu (mtendaji, bunge na mahakama) unalinda uhuru wa raia.",
  "Kila mtu ana haki ya kupata huduma za umma bila ulazimishwa kulipa rushwa.",
  "Kikomo cha muda wa kuhifadhi data yako ya kibinafsi kimewekwa kisheria — baada ya muda huo lazima ifutwe.",
  "Ofisi ya Ombudsman wa Kitaifa inashughulikia malalamiko dhidi ya huduma mbaya za serikali bila malipo.",
  "Haki ya kukusanyika kwa amani inalindwa na Katiba — polisi wanaweza kuomba mkutano uzingatie taratibu lakini haiwezi kupigwa marufuku kiholela.",
  "Wajumbe wa bunge na mabaraza ya kaunti wana wajibu wa kisheria wa kuwasiliana na wapiga kura wao mara kwa mara.",
  "Kila Mkenya ana haki ya kupata taarifa za matumizi ya fedha za umma kupitia Sheria ya Uwazi (Access to Information Act).",
  "Mtu anayebaguliwa katika hospitali, shule au ofisi ya serikali kwa sababu ya rangi, kabila au dini ana haki ya kulalamika KNCHR.",
  "Chini ya Sheria ya Usawa wa Jinsia, mwajiri lazima alipe mshahara sawa kwa kazi sawa bila kujali jinsia ya mfanyakazi.",
  "Hati ya kusafiri (passport) ni haki ya kila raia wa Kenya — serikali haiwezi kuikataa bila sababu halisi ya kisheria.",
  "Mtu aliyeumia kwa sababu ya bidhaa ya kasoro ya kiwanda ana haki ya kudai fidia kutoka kwa mtengenezaji au muuzaji chini ya Sheria ya Kulinda Watumiaji.",
  "Chini ya Katiba ya Kenya, hakuna mtu anayeweza kufungwa jela kwa kukosa uwezo wa kulipa deni la kawaida la biashara au la kibinafsi.",
];

let lastTipIndexEn = -1;
let lastTipIndexSw = -1;

function getRandomTip() {
  if (currentChatLang === 'sw') {
    let idx;
    do { idx = Math.floor(Math.random() * LEGAL_TIPS_SW.length); } while (idx === lastTipIndexSw);
    lastTipIndexSw = idx;
    return LEGAL_TIPS_SW[idx];
  } else {
    let idx;
    do { idx = Math.floor(Math.random() * LEGAL_TIPS_EN.length); } while (idx === lastTipIndexEn);
    lastTipIndexEn = idx;
    return LEGAL_TIPS_EN[idx];
  }
}

// ── Language change handler ──
function onChatLangChange(lang) {
  currentChatLang = lang;
  const isSw = lang === 'sw';

  // Update Legal Tips button name
  const tipsBtn = document.getElementById('dashLegalTipsBtn');
  if (tipsBtn) {
    tipsBtn.textContent = isSw ? '💡 Vidokezo vya Katiba' : '💡 Legal Tips';
  }

  // Update chat placeholder
  const chatInput = document.getElementById('dcwInput');
  if (chatInput) {
    chatInput.placeholder = isSw ? 'Uliza swali la kisheria…' : 'Ask a legal question…';
  }

  // Update chat greeting
  const welcomeMsg = document.getElementById('chatWelcomeMsg');
  if (welcomeMsg && currentUser) {
    const name = (currentUser.firmName || currentUser.firstName) || '';
    if (isSw) {
      welcomeMsg.innerHTML = `Habari ${name}! Mimi ni Nomos, msaidizi wako wa kisheria wa AI. Ninaweza kukusaidia na utafiti wa kisheria, kuandika hati na kujibu maswali yoyote ya kisheria. Leo ungependa kujadili nini?`;
    } else {
      welcomeMsg.innerHTML = `Hello ${name}! I'm Nomos, your AI legal companion. I can help you with legal research, draft documents, and answer any legal questions. What would you like to discuss today?`;
    }
  }

  // Inject a language-appropriate tip in the chat
  const msgs = document.getElementById('dcwMessages');
  if (msgs) {
    const tip = getRandomTip();
    const tipLabel = isSw ? '💡 <strong style="color:var(--g300)">Kidokezo cha Kisheria:</strong>' : '💡 <strong style="color:var(--g300)">Legal Tip:</strong>';
    const langNotice = isSw
      ? `<div class="dcw-msg"><div class="hv-av ai" style="width:30px;height:30px;font-size:.68rem;flex-shrink:0">N</div><div class="dcw-bub ai">🇰🇪 <strong style="color:var(--g300)">Sasa unaongea Kiswahili</strong> — Vidokezo vyote vya kisheria vitaonyeshwa kwa Kiswahili.<br/><br/>${tipLabel}<br/>${tip}</div></div>`
      : `<div class="dcw-msg"><div class="hv-av ai" style="width:30px;height:30px;font-size:.68rem;flex-shrink:0">N</div><div class="dcw-bub ai">🇬🇧 <strong style="color:var(--g300)">Switched to English</strong> — Legal tips will now display in English.<br/><br/>${tipLabel}<br/>${tip}</div></div>`;
    msgs.insertAdjacentHTML('beforeend', langNotice);
    msgs.scrollTop = msgs.scrollHeight;
  }
}

function startHeroChatTips() {
  const chat = document.querySelector('.hv-chat');
  if (!chat) return;
  setTimeout(() => injectHeroTip(chat), 2000);
  setInterval(() => injectHeroTip(chat), 8000);
}

function injectHeroTip(chat) {
  const oldTips = chat.querySelectorAll('.hero-auto-tip');
  oldTips.forEach(t => t.remove());
  const tip = getRandomTip();
  const div = document.createElement('div');
  div.className = 'hv-msg hero-auto-tip';
  div.style.cssText = 'animation:fadeInMsg .5s ease';
  div.innerHTML = `<div class="hv-av ai">N</div><div class="hv-bub ai"><strong style="color:var(--g300)">💡 Legal Tip:</strong><br/>${tip}</div>`;
  const typing = chat.querySelector('.hv-typing');
  if (typing) chat.insertBefore(div, typing);
  else chat.appendChild(div);
}

function showHeroLegalTip() {
  const chat = document.querySelector('.hv-chat');
  if (!chat) return;
  const tip = getRandomTip();
  const div = document.createElement('div');
  div.className = 'hv-msg hero-auto-tip';
  div.style.cssText = 'animation:fadeInMsg .5s ease';
  div.innerHTML = `<div class="hv-av ai">N</div><div class="hv-bub ai"><strong style="color:var(--g300)">💡 Legal Tip:</strong><br/>${tip}</div>`;
  const typing = chat.querySelector('.hv-typing');
  if (typing) chat.insertBefore(div, typing);
  else chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function showDashLegalTip() {
  const msgs = document.getElementById('dcwMessages');
  if (!msgs) return;
  const tip = getRandomTip();
  const isSw = currentChatLang === 'sw';
  const tipLabel = isSw ? '💡 <strong style="color:var(--g300)">Kidokezo cha Kisheria:</strong>' : '💡 <strong style="color:var(--g300)">Legal Tip:</strong>';
  const div = document.createElement('div');
  div.className = 'dcw-msg';
  div.innerHTML = `<div class="hv-av ai" style="width:30px;height:30px;font-size:.68rem;flex-shrink:0">N</div><div class="dcw-bub ai">${tipLabel}<br/>${tip}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// ════════════════════════════════════════
// SUBSCRIPTION POPUP
// ════════════════════════════════════════
function openSubscriptionPopup() { document.getElementById('subscriptionOverlay').classList.add('open'); }
function closeSubscriptionPopup() { document.getElementById('subscriptionOverlay').classList.remove('open'); }
function closeSubOverlay(e) { if (e.target === document.getElementById('subscriptionOverlay')) closeSubscriptionPopup(); }
function selectPlan(value, el) {
  document.querySelectorAll('.sub-plan-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const sel = document.getElementById('subPlan');
  if (sel) sel.value = value;
}
function submitSubscription() {
  let valid = true;
  const name  = document.getElementById('subName').value.trim();
  const email = document.getElementById('subEmail').value.trim();
  const phone = document.getElementById('subPhone').value.trim();
  const plan  = document.getElementById('subPlan').value;
  ['subName','subEmail','subPhone','subPlan'].forEach(id => { document.getElementById(id).style.borderColor = ''; });
  ['subNameErr','subEmailErr','subPhoneErr','subPlanErr'].forEach(id => { document.getElementById(id).style.display = 'none'; });
  if (!name)  { document.getElementById('subName').style.borderColor='#ef4444'; document.getElementById('subNameErr').style.display='block'; valid=false; }
  if (!email||!email.includes('@')) { document.getElementById('subEmail').style.borderColor='#ef4444'; document.getElementById('subEmailErr').style.display='block'; valid=false; }
  if (!phone) { document.getElementById('subPhone').style.borderColor='#ef4444'; document.getElementById('subPhoneErr').style.display='block'; valid=false; }
  if (!plan)  { document.getElementById('subPlan').style.borderColor='#ef4444'; document.getElementById('subPlanErr').style.display='block'; valid=false; }
  if (!valid) return;
  closeSubscriptionPopup();
  const emailDisplay = document.getElementById('accessCodeEmailDisplay');
  if (emailDisplay) emailDisplay.textContent = email;
  setTimeout(() => { document.getElementById('accessCodeOverlay').classList.add('open'); }, 300);
}

// ════════════════════════════════════════
// CONTACT FORM
// ════════════════════════════════════════
function submitContactForm() {
  let valid = true;
  ['contactFirst','contactLast','contactEmail','contactMessage'].forEach(id => { const el=document.getElementById(id); if(el) el.classList.remove('error'); });
  ['contactFirstErr','contactLastErr','contactEmailErr','contactMessageErr'].forEach(id => { const el=document.getElementById(id); if(el) el.classList.remove('show'); });
  const alertEl = document.getElementById('contactAlert');
  if (alertEl) alertEl.classList.remove('show');
  const first   = document.getElementById('contactFirst').value.trim();
  const last    = document.getElementById('contactLast').value.trim();
  const email   = document.getElementById('contactEmail').value.trim();
  const message = document.getElementById('contactMessage').value.trim();
  if (!first)  { showErr('contactFirst','contactFirstErr','First name is required.'); valid=false; }
  if (!last)   { showErr('contactLast','contactLastErr','Last name is required.'); valid=false; }
  if (!email||!isValidEmail(email)) { showErr('contactEmail','contactEmailErr','A valid email is required.'); valid=false; }
  if (!message){ showErr('contactMessage','contactMessageErr','Please enter your message.'); valid=false; }
  if (!valid) { if(alertEl) alertEl.classList.add('show'); return; }
  showToast('✅ Message sent! We will be in touch within 24 hours.');
  ['contactFirst','contactLast','contactEmail','contactMessage'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
}

// ════════════════════════════════════════
// FORGOT PASSWORD FLOW
// ════════════════════════════════════════
let _otpCode = '';
let _otpUser = null;

function openForgotPassword() {
  document.getElementById('forgotPwOverlay').classList.add('open');
  document.getElementById('forgotAlert').classList.remove('show');
  document.getElementById('forgotEmail').classList.remove('error');
  document.getElementById('forgotEmailErr').classList.remove('show');
  document.getElementById('forgotEmail').value = '';
}
function closeForgotPassword() { document.getElementById('forgotPwOverlay').classList.remove('open'); }
function closeForgotPwOverlay(e) { if (e.target===document.getElementById('forgotPwOverlay')) closeForgotPassword(); }
function clearForgotErr() {
  document.getElementById('forgotEmail').classList.remove('error');
  document.getElementById('forgotEmailErr').classList.remove('show');
  document.getElementById('forgotAlert').classList.remove('show');
}
function submitForgotPassword() {
  const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
  document.getElementById('forgotEmail').classList.remove('error');
  document.getElementById('forgotEmailErr').classList.remove('show');
  document.getElementById('forgotAlert').classList.remove('show');
  if (!email||!isValidEmail(email)) { showErr('forgotEmail','forgotEmailErr','Please enter a valid email address.'); document.getElementById('forgotAlert').classList.add('show'); return; }
  const found = USERS.find(u => u.email.toLowerCase()===email);
  if (!found) { document.getElementById('forgotAlert').textContent='No account found with this email address.'; document.getElementById('forgotAlert').classList.add('show'); showErr('forgotEmail','forgotEmailErr','Email not registered.'); return; }
  _otpUser = found;
  _otpCode = String(Math.floor(100000+Math.random()*900000));
  closeForgotPassword();
  setTimeout(() => {
    const infoBox = document.getElementById('otpInfoBox');
    if(infoBox) infoBox.innerHTML=`A 6-digit OTP has been sent to <strong style="color:var(--g300)">${found.email}</strong>.<br/><span style="font-size:.75rem;opacity:.7">(Demo OTP: <strong style="color:var(--g400);letter-spacing:.15em">${_otpCode}</strong>)</span>`;
    document.querySelectorAll('.otp-digit').forEach(d=>{d.value='';d.classList.remove('filled');});
    document.getElementById('otpErr').classList.remove('show');
    document.getElementById('otpOverlay').classList.add('open');
    setTimeout(()=>{const first=document.querySelector('.otp-digit');if(first)first.focus();},200);
  }, 300);
}
function resendOtp() {
  if(!_otpUser) return;
  _otpCode = String(Math.floor(100000+Math.random()*900000));
  const infoBox = document.getElementById('otpInfoBox');
  if(infoBox) infoBox.innerHTML=`New OTP sent to <strong style="color:var(--g300)">${_otpUser.email}</strong>.<br/><span style="font-size:.75rem;opacity:.7">(Demo OTP: <strong style="color:var(--g400);letter-spacing:.15em">${_otpCode}</strong>)</span>`;
  showToast('📨 New OTP sent!');
}
function closeOtpModal() { document.getElementById('otpOverlay').classList.remove('open'); }
function closeOtpOverlay(e) { if(e.target===document.getElementById('otpOverlay')) closeOtpModal(); }
function otpNext(input,idx) {
  input.value=input.value.replace(/[^0-9]/g,'');
  input.classList.toggle('filled',input.value.length>0);
  const digits=document.querySelectorAll('.otp-digit');
  if(input.value&&idx<5) digits[idx+1].focus();
}
function otpBack(e,input,idx) {
  const digits=document.querySelectorAll('.otp-digit');
  if(e.key==='Backspace'&&!input.value&&idx>0){digits[idx-1].focus();digits[idx-1].value='';digits[idx-1].classList.remove('filled');}
}
function verifyOtp() {
  const digits=document.querySelectorAll('.otp-digit');
  const entered=Array.from(digits).map(d=>d.value).join('');
  document.getElementById('otpErr').classList.remove('show');
  if(entered.length<6){document.getElementById('otpErr').classList.add('show');return;}
  if(entered!==_otpCode){document.getElementById('otpErr').classList.add('show');digits.forEach(d=>{d.classList.add('error');setTimeout(()=>d.classList.remove('error'),600);});return;}
  currentUser=_otpUser;
  closeOtpModal();
  setTimeout(()=>{
    showPage('dashboard');
    setTimeout(()=>{
      document.getElementById('newPw').value='';
      document.getElementById('newPw2').value='';
      document.getElementById('newPwErr').classList.remove('show');
      document.getElementById('newPw2Err').classList.remove('show');
      document.getElementById('changePwOverlay').classList.add('open');
    },500);
  },300);
}
function closeChangePwOverlay(e){if(e.target===document.getElementById('changePwOverlay')){}/* mandatory */}
function clearChangePwErr(){document.getElementById('newPwErr').classList.remove('show');document.getElementById('newPw2Err').classList.remove('show');}
function submitNewPassword(){
  const pw=document.getElementById('newPw').value;
  const pw2=document.getElementById('newPw2').value;
  clearChangePwErr();
  let valid=true;
  if(!pw||pw.length<8){document.getElementById('newPwErr').classList.add('show');valid=false;}
  if(!pw2||pw!==pw2){document.getElementById('newPw2Err').classList.add('show');valid=false;}
  if(!valid)return;
  if(currentUser)currentUser.password=pw;
  document.getElementById('changePwOverlay').classList.remove('open');
  showToast('🔒 Password updated successfully! You are now logged in.');
}

// ════════════════════════════════════════
// ACCESS CODE MODAL
// ════════════════════════════════════════
let _chatUnlocked = false;
function closeAccessCodeModal(){document.getElementById('accessCodeOverlay').classList.remove('open');}
function closeAccessCodeOverlay(e){if(e.target===document.getElementById('accessCodeOverlay'))closeAccessCodeModal();}
function clearAccessCodeErr(){document.getElementById('accessCodeInput').classList.remove('error');document.getElementById('accessCodeErr').classList.remove('show');}
function verifyAccessCode(){
  const code=document.getElementById('accessCodeInput').value.trim().toUpperCase();
  clearAccessCodeErr();
  if(!code){showErr('accessCodeInput','accessCodeErr','Please enter a valid access code.');return;}
  _chatUnlocked=true;
  closeAccessCodeModal();
  showToast('🎉 Access code verified! AI Legal Chat is now unlocked.');
  sendDashChat();
}

function openHaveCodeModal(){
  closeSubscriptionPopup();
  setTimeout(()=>{
    document.getElementById('haveCodeEmail').value='';
    document.getElementById('haveCodeCode').value='';
    document.getElementById('haveCodeEmailErr').classList.remove('show');
    document.getElementById('haveCodeCodeErr').classList.remove('show');
    document.getElementById('haveCodeEmail').classList.remove('error');
    document.getElementById('haveCodeCode').classList.remove('error');
    document.getElementById('haveCodeOverlay').classList.add('open');
  },300);
}
function closeHaveCodeModal(){document.getElementById('haveCodeOverlay').classList.remove('open');}
function closeHaveCodeOverlay(e){if(e.target===document.getElementById('haveCodeOverlay'))closeHaveCodeModal();}
function clearHaveCodeErr(){
  ['haveCodeEmail','haveCodeCode'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('error');});
  ['haveCodeEmailErr','haveCodeCodeErr'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('show');});
}
function submitHaveCode(){
  const email=document.getElementById('haveCodeEmail').value.trim();
  const code=document.getElementById('haveCodeCode').value.trim();
  clearHaveCodeErr();
  let valid=true;
  if(!email||!isValidEmail(email)){showErr('haveCodeEmail','haveCodeEmailErr','Please enter a valid email address.');valid=false;}
  if(!code){showErr('haveCodeCode','haveCodeCodeErr','Please enter your access code.');valid=false;}
  if(!valid)return;
  _chatUnlocked=true;
  closeHaveCodeModal();
  showToast('✅ Access code accepted! AI Legal Chat is now active.');
  sendDashChat();
}

function renderAdminLawyers() {
  const list = document.getElementById('adminLawyerList');
  if(!list) return;
  const lawyers = USERS.filter(u => u.role === 'lawyer');
  if (!lawyers.length) {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--s400)">No lawyers registered yet.</div>`;
    return;
  }
  list.innerHTML = lawyers.map((l,i) => `
    <div class="match-card">
      <div class="match-av" style="background:${l.avatarGrad}">${l.initials}</div>
      <div style="flex:1">
        <div class="match-name">Adv. ${l.firstName} ${l.lastName}</div>
        <div class="match-spec">${l.specialty || 'General Practice'} · ${l.county || 'Kenya'}</div>
        <div class="match-meta">${l.experience ? l.experience + ' yrs exp' : 'New'} · ${l.rating ? l.rating + '★' : 'No rating'} · ${l.fee || 'TBD'}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
        <div class="match-badge ${l.available ? 'avail' : 'busy'}">${l.available ? 'Available' : 'Busy'}</div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-gold sm" onclick="openAdminLawyerProfile('${l.email}')">👁 View Profile</button>
          <button class="btn btn-ghost sm" onclick="adminToggleLawyerStatus('${l.email}')">
            ${l.available ? '🔴 Set Busy' : '🟢 Set Available'}
          </button>
        </div>
      </div>
    </div>`).join('');
}

// ════════════════════════════════════════════════════
// PENDING REQUESTS PANEL (Lawyer Dashboard)
// ════════════════════════════════════════════════════
function renderPendingRequestsPanel() {
  const container = document.getElementById('pendingReqList');
  if (!container) return;
  const myReqs = connectionRequests.filter(r => r.toEmail === (currentUser && currentUser.email));
  const countEl = document.getElementById('pendingReqCount');
  if (countEl) countEl.textContent = myReqs.length + ' request' + (myReqs.length !== 1 ? 's' : '');
  if (!myReqs.length) {
    container.innerHTML = `<div style="text-align:center;padding:48px 24px;color:var(--s400)"><div style="font-size:3rem;margin-bottom:14px;opacity:.3">📨</div><div style="font-size:.92rem;font-weight:600;color:var(--s200);margin-bottom:6px">No requests yet</div><div style="font-size:.82rem">When clients or citizens connect with you, their requests will appear here.</div></div>`;
    return;
  }
  container.innerHTML = myReqs.map(req => {
    const statusStyles = {
      pending: 'background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.25);color:var(--warn)',
      accepted: 'background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);color:var(--suc)',
      declined: 'background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:var(--err)'
    };
    const statusLabel = { pending:'⏳ Pending', accepted:'✅ Accepted', declined:'✗ Declined' };
    return `
    <div class="match-card" style="flex-direction:column;gap:12px;cursor:default">
      <div style="display:flex;gap:14px;align-items:flex-start">
        <div class="match-av" style="background:${req.fromGrad}">${req.fromInitials}</div>
        <div style="flex:1;min-width:0">
          <div class="match-name">${req.fromName}</div>
          <div class="match-spec">${req.caseType}</div>
          <div class="match-meta">${req.fromRole} · ${req.date} at ${req.time}</div>
        </div>
        <span style="font-size:.7rem;font-weight:700;padding:4px 10px;border-radius:20px;white-space:nowrap;${statusStyles[req.status]||statusStyles.pending}">${statusLabel[req.status]||'Pending'}</span>
      </div>
      <div style="font-size:.82rem;color:var(--s300);line-height:1.55;background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r8);padding:10px 12px">${req.caseDesc.length>160?req.caseDesc.substring(0,160)+'…':req.caseDesc}</div>
      ${req.docs.length ? `<div style="font-size:.75rem;color:var(--g400)">📎 ${req.docs.length} document${req.docs.length!==1?'s':''} attached</div>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-gold sm" onclick="openLawyerRequestModal('${req.id}')">👁 View Full Request</button>
        ${req.status==='pending' ? `<button class="btn btn-teal sm" onclick="acceptConnectionRequest('${req.id}');renderPendingRequestsPanel()">✅ Accept</button><button class="btn btn-danger sm" onclick="declineConnectionRequest('${req.id}');renderPendingRequestsPanel()">✗ Decline</button>` : ''}
        ${req.status==='accepted' ? `<button class="btn btn-ghost sm" onclick="viewClientProfile('${req.fromEmail}')">👤 View Profile</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════════════════
// ADMIN SECRET GATE
// ════════════════════════════════════════════════════
function checkAdminTrigger() {
  const emailInput = document.getElementById('loginEmail');
  if (!emailInput) return;
  const val = emailInput.value.trim().toLowerCase();
  const secretBtn = document.getElementById('adminSecretBtn');
  if (secretBtn) secretBtn.style.display = val === 'nomos.admin' ? 'flex' : 'none';
}

function openAdminGate() {
  const overlay = document.getElementById('adminGateOverlay');
  if (overlay) {
    document.getElementById('adminKeyInput').value = '';
    document.getElementById('adminKeyErr').classList.remove('show');
    overlay.classList.add('open');
    setTimeout(() => document.getElementById('adminKeyInput').focus(), 150);
  }
}
function closeAdminGate() { document.getElementById('adminGateOverlay').classList.remove('open'); }
function closeAdminGateOverlay(e) { if (e.target === document.getElementById('adminGateOverlay')) closeAdminGate(); }
function clearAdminKeyErr() { document.getElementById('adminKeyErr').classList.remove('show'); document.getElementById('adminKeyInput').classList.remove('error'); }

function submitAdminKey() {
  const key = document.getElementById('adminKeyInput').value;
  if (!key) { showErr('adminKeyInput','adminKeyErr','Please enter the admin key.'); return; }
  if (_verifyAdminKey(key)) {
    closeAdminGate();
    currentUser = { ...ADMIN_ACCOUNT };
    showPage('dashboard');
  } else {
    showErr('adminKeyInput','adminKeyErr','Incorrect admin key. Access denied.');
    document.getElementById('adminKeyInput').value = '';
    setTimeout(() => document.getElementById('adminKeyInput').focus(), 100);
  }
}
showPage('landing');
setTimeout(startHeroChatTips, 1500);

// Render services & admin on dashboard load
document.addEventListener('DOMContentLoaded', () => {
  renderLawyerServices();
});

// Note: switchDashTab already handles all tabs above.

// ════════════════════════════════════════════════════
// LAWYER — CLIENT DATA STORE
// ════════════════════════════════════════════════════
const lawyerClients = [
  {
    id: 'c001', initials: 'JM', name: 'James Mwangi', idNo: '12345678',
    phone: '+254 722 001 001', email: 'james.mwangi@email.com',
    county: 'Nairobi', gender: 'Male',
    caseType: 'Tenant Rights', court: 'ELC Nairobi', caseRef: 'ELC/E001/2025',
    retainer: 'Fixed Fee', status: 'Active',
    summary: 'Client facing illegal eviction from landlord. Landlord has not served formal notice and is threatening to change locks. Client has been a tenant for 3 years with no written agreement.',
    since: 'Jan 2025', grad: 'linear-gradient(135deg,#1e3a5f,#2d7a8e)',
    docs: [
      { name: 'Tenancy Agreement.pdf', type: '📜', date: 'Jan 2025', size: '340 KB' },
      { name: 'Landlord Notice (Scan).jpg', type: '🖼️', date: 'Feb 2025', size: '1.2 MB' },
      { name: 'Demand Letter Draft.docx', type: '📝', date: 'Mar 2025', size: '88 KB' }
    ],
    timeline: [
      { text: 'Initial consultation — tenant rights briefing', date: '12 Jan 2025' },
      { text: 'Demand letter drafted and sent to landlord', date: '28 Jan 2025' },
      { text: 'Landlord responded — dispute escalating', date: '14 Feb 2025' },
      { text: 'Filed ELC/E001/2025 — court date pending', date: '1 Mar 2025' }
    ]
  },
  {
    id: 'c002', initials: 'AW', name: 'Amara Wanjiru', idNo: '23456789',
    phone: '+254 733 002 002', email: 'amara.wanjiru@email.com',
    county: 'Kiambu', gender: 'Female',
    caseType: 'Employment Law', court: 'ELRC Nairobi', caseRef: 'ELRC/E055/2025',
    retainer: 'Hourly', status: 'Active',
    summary: 'Client was dismissed without cause after 6 years of service. Employer alleges redundancy but selected only this employee. Client is seeking reinstatement or 12 months\' salary compensation.',
    since: 'Feb 2025', grad: 'linear-gradient(135deg,#3d1a5f,#6b2d8e)',
    docs: [
      { name: 'Termination Letter.pdf', type: '📜', date: 'Feb 2025', size: '210 KB' },
      { name: 'Employment Contract.pdf', type: '📜', date: 'Feb 2025', size: '560 KB' },
      { name: 'Payslips 2024.pdf', type: '📜', date: 'Feb 2025', size: '980 KB' }
    ],
    timeline: [
      { text: 'Client approached — wrongful dismissal assessment', date: '5 Feb 2025' },
      { text: 'Filed ELRC claim ELRC/E055/2025', date: '20 Feb 2025' },
      { text: 'Employer filed response — mediation proposed', date: '10 Mar 2025' },
      { text: 'Mediation session 1 — no resolution reached', date: '28 Mar 2025' }
    ]
  },
  {
    id: 'c003', initials: 'FK', name: 'Faith Kamau', idNo: '34567890',
    phone: '+254 711 003 003', email: 'faith.kamau@email.com',
    county: 'Nakuru', gender: 'Female',
    caseType: 'Land Dispute', court: 'ELC Nakuru', caseRef: 'ELC/N012/2025',
    retainer: 'Contingency', status: 'Pending',
    summary: 'Disputed ownership of 3-acre parcel in Nakuru. Client holds title deed but neighbour claims encroachment via adverse possession. Survey report commissioned.',
    since: 'Mar 2025', grad: 'linear-gradient(135deg,#1a4731,#2d7a52)',
    docs: [
      { name: 'Title Deed (Copy).pdf', type: '📜', date: 'Mar 2025', size: '780 KB' },
      { name: 'Survey Report.pdf', type: '📜', date: 'Apr 2025', size: '1.4 MB' }
    ],
    timeline: [
      { text: 'Client intake — land dispute assessment completed', date: '3 Mar 2025' },
      { text: 'Survey commissioned — awaiting report', date: '18 Mar 2025' },
      { text: 'Survey report received — supports client\'s claim', date: '10 Apr 2025' },
      { text: 'Filed ELC/N012/2025 — hearing date awaited', date: '28 Apr 2025' }
    ]
  }
];

// ═══════════════════════════════════════
// HEARING DATA STORE
// ═══════════════════════════════════════
const lawyerHearings = [
  { id: 'h001', day: '28', month: 'MAY', caseName: 'Mwangi v. Nairobi Housing Ltd', court: 'ELC Nairobi', room: 'Courtroom 4', time: '9:00 AM', daysAway: 7, type: 'Main Hearing', client: 'James Mwangi', ref: 'ELC/E001/2025' },
  { id: 'h002', day: '2', month: 'JUN', caseName: 'Wanjiru v. Kenya Tea Packers', court: 'ELRC Nairobi', room: 'Courtroom 7', time: '10:30 AM', daysAway: 12, type: 'Mention', client: 'Amara Wanjiru', ref: 'ELRC/E055/2025' },
  { id: 'h003', day: '15', month: 'JUN', caseName: 'Kamau v. Nakuru Land Board', court: 'ELC Nakuru', room: 'Courtroom 2', time: '2:00 PM', daysAway: 25, type: 'Pre-trial Conference', client: 'Faith Kamau', ref: 'ELC/N012/2025' }
];

// ═══════════════════════════════════════
// RENDER FUNCTIONS
// ═══════════════════════════════════════
function renderClientRoster() {
  const list = document.getElementById('clientRosterList');
  if (!list) return;
  if (!lawyerClients.length) {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--s400);font-size:.88rem">No clients registered yet. Click <strong style="color:var(--g400)">+ New Client</strong> to add your first client.</div>`;
    return;
  }
  list.innerHTML = lawyerClients.map(c => `
    <div class="law-client-row">
      <div class="law-cl-av" style="background:${c.grad}">${c.initials}</div>
      <div style="flex:1;min-width:0">
        <div class="law-cl-name">${c.name}</div>
        <div class="law-cl-meta">${c.caseType} · ${c.county} · Since ${c.since}</div>
      </div>
      <div class="match-badge ${c.status === 'Active' ? 'avail' : 'busy'}">${c.status}</div>
      <button class="btn btn-ghost sm"
        onclick="viewClientFile('${c.name}','${c.initials}','${c.caseType}','${c.county}','${c.since}','${c.status}','${c.grad}')">
        📁 View File
      </button>
    </div>`).join('');
}

function renderHearingsList() {
  const container = document.getElementById('hearingsList');
  if (!container) return;
  if (!lawyerHearings.length) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--s400);font-size:.88rem">No hearings scheduled. Click <strong style="color:var(--g400)">+ Add Hearing</strong> to schedule one.</div>`;
    return;
  }
  container.innerHTML = lawyerHearings.map(h => `
    <div class="law-hearing-row" id="hearing-${h.id}">
      <div class="law-hearing-date"><div class="lhd-day">${h.day}</div><div class="lhd-mon">${h.month}</div></div>
      <div style="flex:1;min-width:0">
        <div class="law-case-title">${h.caseName}</div>
        <div class="law-cl-meta">${h.court} · ${h.room} · ${h.time} · ${h.type}</div>
        <div class="law-cl-meta" style="color:var(--s400);font-size:.72rem;margin-top:2px">Client: ${h.client} · ${h.ref}</div>
      </div>
      <div class="hearing-actions">
        <span class="law-tag ${h.daysAway <= 7 ? 'warn' : ''}">In ${h.daysAway} days</span>
        <button class="btn btn-ghost sm" style="padding:5px 10px;font-size:.72rem"
          onclick="deleteHearing('${h.id}')" title="Remove hearing">🗑</button>
      </div>
    </div>`).join('');
}

function deleteHearing(id) {
  const idx = lawyerHearings.findIndex(h => h.id === id);
  if (idx > -1) {
    lawyerHearings.splice(idx, 1);
    renderHearingsList();
    showToast('🗑 Hearing removed from schedule.');
  }
}

// ═══════════════════════════════════════
// NEW CLIENT MODAL
// ═══════════════════════════════════════
function openNewClientModal() {
  ['ncFullName','ncID','ncPhone','ncEmail','ncCounty','ncGender','ncCaseType','ncCourt','ncCaseRef','ncRetainer','ncSummary'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('error'); }
  });
  ['ncFullNameErr','ncIDErr','ncPhoneErr','ncCountyErr','ncCaseTypeErr','ncRetainerErr','ncSummaryErr'].forEach(id => {
    const el = document.getElementById(id); if (el) el.classList.remove('show');
  });
  const docList = document.getElementById('ncDocList');
  if (docList) docList.innerHTML = '';
  const alert = document.getElementById('ncAlert');
  if (alert) alert.style.display = 'none';
  _ncFiles = [];
  document.getElementById('newClientOverlay').classList.add('open');
}
function closeNewClientModal() { document.getElementById('newClientOverlay').classList.remove('open'); }
function closeNewClientOverlay(e) { if (e.target === document.getElementById('newClientOverlay')) closeNewClientModal(); }

let _ncFiles = [];
function handleNcDocUpload(input) {
  const files = Array.from(input.files);
  files.forEach(file => {
    _ncFiles.push(file);
    const ext = file.name.split('.').pop().toUpperCase();
    const icons = { PDF:'📜', DOCX:'📝', DOC:'📝', PNG:'🖼️', JPG:'🖼️', JPEG:'🖼️' };
    const size = file.size > 1024*1024 ? (file.size/(1024*1024)).toFixed(1)+' MB' : (file.size/1024).toFixed(0)+' KB';
    const row = document.createElement('div');
    row.className = 'nc-doc-row';
    row.dataset.fname = file.name;
    row.innerHTML = `<span>${icons[ext]||'📄'}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${file.name}</span><span style="color:var(--s400);font-size:.72rem;flex-shrink:0">${size}</span><button onclick="removeNcDoc(this,'${file.name}')">✕</button>`;
    document.getElementById('ncDocList').appendChild(row);
  });
  input.value = '';
}
function handleNcDocDrop(e) {
  e.preventDefault();
  const fakeInput = { files: e.dataTransfer.files };
  handleNcDocUpload(fakeInput);
}
function removeNcDoc(btn, name) {
  _ncFiles = _ncFiles.filter(f => f.name !== name);
  btn.parentElement.remove();
}

function clearModalErr(inputId, errId) {
  const el = document.getElementById(inputId); if (el) el.classList.remove('error');
  const err = document.getElementById(errId); if (err) err.classList.remove('show');
}

function submitNewClient() {
  let valid = true;
  const required = [
    ['ncFullName','ncFullNameErr'],['ncID','ncIDErr'],['ncPhone','ncPhoneErr'],
    ['ncCounty','ncCountyErr'],['ncCaseType','ncCaseTypeErr'],
    ['ncRetainer','ncRetainerErr'],['ncSummary','ncSummaryErr']
  ];
  required.forEach(([inputId, errId]) => {
    const el = document.getElementById(inputId);
    if (!el || !el.value.trim()) { showErr(inputId, errId, null); valid = false; }
  });
  if (!valid) {
    const a = document.getElementById('ncAlert'); if (a) a.style.display = 'block';
    const firstErr = document.querySelector('#newClientOverlay .form-input.error');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const name     = document.getElementById('ncFullName').value.trim();
  const initials = name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const grads    = [
    'linear-gradient(135deg,#1e3a5f,#2d7a8e)',
    'linear-gradient(135deg,#3d1a5f,#6b2d8e)',
    'linear-gradient(135deg,#1a4731,#2d7a52)',
    'linear-gradient(135deg,#4d2a0e,#8e5a1a)',
    'linear-gradient(135deg,#1a1a4d,#2d2d8e)'
  ];
  const grad = grads[lawyerClients.length % grads.length];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const since = months[now.getMonth()] + ' ' + now.getFullYear();

  const newClient = {
    id: 'c' + (Date.now()),
    initials, name, grad, since,
    idNo: document.getElementById('ncID').value.trim(),
    phone: document.getElementById('ncPhone').value.trim(),
    email: document.getElementById('ncEmail').value.trim(),
    county: document.getElementById('ncCounty').value,
    gender: document.getElementById('ncGender').value,
    caseType: document.getElementById('ncCaseType').value,
    court: document.getElementById('ncCourt').value || 'Not yet assigned',
    caseRef: document.getElementById('ncCaseRef').value.trim() || 'TBC',
    retainer: document.getElementById('ncRetainer').value,
    status: 'Active',
    summary: document.getElementById('ncSummary').value.trim(),
    docs: _ncFiles.map(f => ({
      name: f.name,
      type: ({ pdf:'📜', docx:'📝', doc:'📝', png:'🖼️', jpg:'🖼️', jpeg:'🖼️' })[f.name.split('.').pop().toLowerCase()] || '📄',
      date: since,
      size: f.size > 1024*1024 ? (f.size/(1024*1024)).toFixed(1)+' MB' : (f.size/1024).toFixed(0)+' KB'
    })),
    timeline: [
      { text: 'Client registered — initial intake recorded', date: now.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) }
    ]
  };

  lawyerClients.push(newClient);
  closeNewClientModal();
  renderClientRoster();
  showToast('✅ Client ' + name + ' registered successfully!');
}

// ═══════════════════════════════════════
// VIEW CLIENT FILE MODAL
// ═══════════════════════════════════════
function viewClientFile(name, initials, caseType, county, since, status, grad) {
  const client = lawyerClients.find(c => c.name === name);
  const overlay = document.getElementById('clientFileOverlay');
  const title   = document.getElementById('clientFileTitle');
  const body    = document.getElementById('clientFileBody');
  if (!overlay || !body) return;

  if (title) title.textContent = '📁 Case File — ' + name;

  const badgeColor = status === 'Active'
    ? 'background:rgba(34,197,94,.12);color:var(--suc);border:1px solid rgba(34,197,94,.25)'
    : 'background:rgba(239,68,68,.1);color:var(--err);border:1px solid rgba(239,68,68,.2)';

  const docs = client ? client.docs : [
    { name: 'Case Documents.pdf', type: '📜', date: since, size: '—' }
  ];
  const timeline = client ? client.timeline : [
    { text: 'Client intake registered', date: since }
  ];

  body.innerHTML = `
    <div class="cf-header-row">
      <div class="cf-av" style="background:${grad}">${initials}</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="cf-name">${name}</div>
          <span style="font-size:.72rem;padding:3px 10px;border-radius:20px;font-weight:700;${badgeColor}">${status}</span>
        </div>
        <div class="cf-meta">${caseType} · ${county} · Client since ${since}</div>
        ${client ? `<div class="cf-meta" style="margin-top:4px;color:var(--g400)">Ref: ${client.caseRef} · ${client.court}</div>` : ''}
      </div>
    </div>

    ${client ? `
    <div class="cf-section-title">Client Information</div>
    <div class="cf-detail-grid">
      <div class="cf-detail-item"><div class="cf-detail-label">Phone</div><div class="cf-detail-value">${client.phone}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Email</div><div class="cf-detail-value">${client.email || '—'}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">National ID</div><div class="cf-detail-value">${client.idNo}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">County</div><div class="cf-detail-value">${client.county}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Retainer</div><div class="cf-detail-value">${client.retainer}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Case Type</div><div class="cf-detail-value">${client.caseType}</div></div>
    </div>

    <div class="cf-section-title">Case Summary</div>
    <div style="padding:12px 14px;background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r10);font-size:.84rem;color:var(--s300);line-height:1.6;margin-bottom:4px">${client.summary}</div>
    ` : ''}

    <div class="cf-section-title">Documents (${docs.length})</div>
    ${docs.map(d => `
      <div class="cf-doc-item" onclick="showToast('Opening ${d.name}…')">
        <div class="cf-doc-icon">${d.type}</div>
        <div>
          <div class="cf-doc-name">${d.name}</div>
          <div class="cf-doc-meta">Added ${d.date} · ${d.size}</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:6px">
          <button class="btn btn-ghost sm" style="padding:4px 10px;font-size:.72rem" onclick="event.stopPropagation();showToast('Downloading ${d.name}…')">⬇</button>
        </div>
      </div>`).join('')}

    <div class="cf-section-title" style="margin-top:16px">Case Timeline</div>
    ${timeline.map(t => `
      <div class="cf-timeline-item">
        <div class="cf-timeline-dot"></div>
        <div>
          <div class="cf-timeline-text">${t.text}</div>
          <div class="cf-timeline-date">${t.date}</div>
        </div>
      </div>`).join('')}

    <div style="display:flex;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--gbord)">
      <button class="btn btn-gold" style="flex:1" onclick="switchDashTab('chat');closeClientFileModal();showToast('Chat opened for ${name}')">💬 Chat about this case</button>
      <button class="btn btn-ghost" style="flex:1" onclick="showToast('Generating case report for ${name}…')">📄 Generate Report</button>
    </div>`;

  overlay.classList.add('open');
}
function closeClientFileModal() { document.getElementById('clientFileOverlay').classList.remove('open'); }
function closeClientFileOverlay(e) { if (e.target === document.getElementById('clientFileOverlay')) closeClientFileModal(); }

// ═══════════════════════════════════════
// ADD HEARING MODAL
// ═══════════════════════════════════════
function openAddHearingModal() {
  ['ahCase','ahClient','ahRef','ahDate','ahTime','ahRoom','ahJudge','ahNotes'].forEach(id => {
    const el = document.getElementById(id); if (el) { el.value = ''; el.classList.remove('error'); }
  });
  ['ahCourt','ahType','ahReminder'].forEach(id => {
    const el = document.getElementById(id); if (el) { el.value = ''; el.classList.remove('error'); }
  });
  ['ahCaseErr','ahDateErr','ahTimeErr','ahCourtErr','ahTypeErr'].forEach(id => {
    const el = document.getElementById(id); if (el) el.classList.remove('show');
  });
  // Pre-fill today +7 days as default date
  const d = new Date(); d.setDate(d.getDate() + 7);
  const dateInput = document.getElementById('ahDate');
  if (dateInput) dateInput.value = d.toISOString().split('T')[0];
  document.getElementById('addHearingOverlay').classList.add('open');
}
function closeAddHearingModal() { document.getElementById('addHearingOverlay').classList.remove('open'); }
function closeAddHearingOverlay(e) { if (e.target === document.getElementById('addHearingOverlay')) closeAddHearingModal(); }

function submitNewHearing() {
  let valid = true;
  [['ahCase','ahCaseErr'],['ahDate','ahDateErr'],['ahTime','ahTimeErr'],['ahCourt','ahCourtErr'],['ahType','ahTypeErr']].forEach(([inputId, errId]) => {
    const el = document.getElementById(inputId);
    if (!el || !el.value.trim()) { showErr(inputId, errId, null); valid = false; }
  });
  if (!valid) { showToast('⚠️ Please fill all required fields.'); return; }

  const dateStr = document.getElementById('ahDate').value;
  const timeStr = document.getElementById('ahTime').value;
  const dateObj  = new Date(dateStr);
  const months   = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const day      = dateObj.getDate();
  const month    = months[dateObj.getMonth()];
  const today    = new Date();
  const daysAway = Math.ceil((dateObj - today) / (1000*60*60*24));

  // Format time nicely
  let [hh, mm] = timeStr.split(':');
  hh = parseInt(hh);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12  = hh % 12 || 12;
  const timeFormatted = h12 + ':' + mm + ' ' + ampm;

  const newHearing = {
    id: 'h' + Date.now(),
    day: String(day), month,
    caseName: document.getElementById('ahCase').value.trim(),
    court: document.getElementById('ahCourt').value,
    room: document.getElementById('ahRoom').value.trim() || 'TBC',
    time: timeFormatted,
    daysAway: Math.max(0, daysAway),
    type: document.getElementById('ahType').value,
    client: document.getElementById('ahClient').value.trim() || 'N/A',
    ref: document.getElementById('ahRef').value.trim() || 'TBC',
    notes: document.getElementById('ahNotes').value.trim()
  };

  // Insert in date order
  const insertIdx = lawyerHearings.findIndex(h => {
    const hDate = new Date(`${h.day} ${h.month} 2025`);
    return dateObj < hDate;
  });
  if (insertIdx === -1) lawyerHearings.push(newHearing);
  else lawyerHearings.splice(insertIdx, 0, newHearing);

  closeAddHearingModal();
  renderHearingsList();
  showToast('🏛️ Hearing scheduled — ' + newHearing.caseName + ' on ' + day + ' ' + month);
}

function filterClients(status) {
  const list = document.getElementById('clientRosterList');
  if (!list) return;
  const filtered = status === 'all' ? lawyerClients : lawyerClients.filter(c => c.status === status);
  const countLabel = document.getElementById('clientCountLabel');
  if (countLabel) countLabel.textContent = filtered.length + ' client' + (filtered.length !== 1 ? 's' : '') + (status !== 'all' ? ' (' + status + ')' : ' registered');
  list.innerHTML = filtered.map(c => `
    <div class="law-client-row">
      <div class="law-cl-av" style="background:${c.grad}">${c.initials}</div>
      <div style="flex:1;min-width:0">
        <div class="law-cl-name">${c.name}</div>
        <div class="law-cl-meta">${c.caseType} · ${c.county} · Since ${c.since}</div>
      </div>
      <div class="match-badge ${c.status === 'Active' ? 'avail' : 'busy'}">${c.status}</div>
      <button class="btn btn-ghost sm"
        onclick="viewClientFile('${c.name}','${c.initials}','${c.caseType}','${c.county}','${c.since}','${c.status}','${c.grad}')">
        📁 View File
      </button>
    </div>`).join('');
}

// ════════════════════════════════════════════════════
// MISSING UTILITY FUNCTIONS
// ════════════════════════════════════════════════════

// ── Service form: saveService, onSliderMin/Max, resetServiceForm ──
function saveService() {
  addNewService();
  const msg = document.getElementById('svcSaveMsg');
  if (msg) { msg.style.display = 'block'; setTimeout(() => msg.style.display = 'none', 3000); }
}

function onSliderMin() {
  const val = document.getElementById('sliderMin').value;
  document.getElementById('sliderMinLbl').textContent = parseInt(val).toLocaleString();
  const minInput = document.getElementById('svcMin');
  if (minInput) { minInput.value = val; updateRangeDisplay(); }
}

function onSliderMax() {
  const val = document.getElementById('sliderMax').value;
  document.getElementById('sliderMaxLbl').textContent = parseInt(val).toLocaleString();
  const maxInput = document.getElementById('svcMax');
  if (maxInput) { maxInput.value = val; updateRangeDisplay(); }
}

function resetServiceForm() {
  ['svcName','svcDesc','svcMin','svcMax'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  const custom = document.getElementById('svcCustomNameGroup');
  if (custom) custom.style.display = 'none';
  ['sliderMin','sliderMax'].forEach(id => { const el=document.getElementById(id); if(el) el.value=0; });
  ['sliderMinLbl','sliderMaxLbl'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent='0'; });
  updateRangeDisplay();
  const msg = document.getElementById('svcSaveMsg');
  if (msg) msg.style.display = 'none';
}

// ── Hero Tip modal ──
function closeHeroTip(e) {
  const overlay = document.getElementById('heroTipOverlay');
  if (!overlay) return;
  if (!e || e.target === overlay || e.currentTarget === overlay) overlay.classList.remove('open');
}

function openHeroTipModal() {
  const overlay = document.getElementById('heroTipOverlay');
  const body    = document.getElementById('heroTipBody');
  if (!overlay || !body) return;
  body.textContent = getRandomTip();
  overlay.classList.add('open');
}

// ── Notification panel render patch (ensure reqId links work) ──
function renderNotifPanel() {
  const badge = document.getElementById('notifBadge');
  const list  = document.getElementById('notifList');
  const empty = document.getElementById('notifEmpty');
  if (!badge || !list) return;

  const notifs = currentUser ? (lawyerNotifications[currentUser.email] || []) : [];
  const unread = notifs.filter(n => !n.read).length;

  if (unread > 0) { badge.textContent = unread > 9 ? '9+' : unread; badge.style.display = 'flex'; }
  else badge.style.display = 'none';

  if (notifs.length === 0) {
    if (empty) empty.style.display = 'block';
    list.innerHTML = `<div id="notifEmpty" style="text-align:center;padding:24px 16px;color:var(--s400);font-size:.82rem">No notifications yet</div>`;
    return;
  }
  if (empty) empty.style.display = 'none';

  const items = [...notifs].reverse();
  list.innerHTML = items.map((n, i) => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotifRead(${notifs.length - 1 - i})">
      <div class="notif-ico">${n.reqId ? '🤝' : '🔔'}</div>
      <div class="notif-body">
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>`).join('') + `<div class="notif-panel-view-all" onclick="clearAllNotifs()">Mark all as read</div>`;

  // Also update pending request badge for lawyers
  renderPendingRequests();
}


// ════════════════════════════════════════════════════
// ADMIN — USER DETAIL MODAL
// ════════════════════════════════════════════════════
function openAdminUserDetail(idx) {
  const u = USERS[idx];
  if (!u) return;
  const overlay = document.getElementById('adminUserDetailOverlay');
  const body    = document.getElementById('adminUserDetailBody');
  const title   = document.getElementById('adminUserDetailTitle');
  if (!overlay || !body) return;

  const displayName = u.firmName || (u.firstName + ' ' + u.lastName);
  const isOrg = ['ngo','corporate'].includes(u.role);
  if (title) title.textContent = '👤 ' + displayName;

  // Connection requests this user has made
  const userReqs = connectionRequests.filter(r => r.fromEmail === u.email);
  const userConns = acceptedConnections.filter(c => c.clientEmail === u.email || c.lawyerEmail === u.email);

  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;padding-bottom:20px;border-bottom:1px solid var(--gbord);margin-bottom:20px">
      <div style="width:56px;height:56px;border-radius:50%;background:${u.avatarGrad||'var(--surf3)'};display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;color:#fff;flex-shrink:0">${u.initials||'?'}</div>
      <div style="flex:1">
        <div style="font-size:1.1rem;font-weight:700;color:#fff">${displayName}</div>
        <div style="font-size:.8rem;color:var(--g400);font-weight:600;margin-top:3px">${capitalise(u.role||'citizen')} Account</div>
        <div style="font-size:.78rem;color:var(--s400);margin-top:2px">${u.email}</div>
      </div>
      <span style="padding:5px 14px;border-radius:20px;font-size:.74rem;font-weight:700;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);color:var(--suc)">Active</span>
    </div>

    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--g400);margin-bottom:10px">Account Information</div>
    <div class="cf-detail-grid" style="margin-bottom:18px">
      <div class="cf-detail-item"><div class="cf-detail-label">Role</div><div class="cf-detail-value">${capitalise(u.role||'citizen')}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Email</div><div class="cf-detail-value" style="font-size:.8rem;word-break:break-all">${u.email}</div></div>
      ${u.county ? `<div class="cf-detail-item"><div class="cf-detail-label">County</div><div class="cf-detail-value">${u.county}</div></div>` : ''}
      ${isOrg && u.firmName ? `<div class="cf-detail-item"><div class="cf-detail-label">${u.role==='ngo'?'Organisation':'Company'} Name</div><div class="cf-detail-value">${u.firmName}</div></div>` : ''}
      ${u.specialty ? `<div class="cf-detail-item"><div class="cf-detail-label">Specialisation</div><div class="cf-detail-value">${u.specialty}</div></div>` : ''}
      ${u.experience ? `<div class="cf-detail-item"><div class="cf-detail-label">Experience</div><div class="cf-detail-value">${u.experience} years</div></div>` : ''}
      ${u.rating ? `<div class="cf-detail-item"><div class="cf-detail-label">Rating</div><div class="cf-detail-value">${u.rating} ★</div></div>` : ''}
      ${u.fee ? `<div class="cf-detail-item"><div class="cf-detail-label">Fee Range</div><div class="cf-detail-value">${u.fee}</div></div>` : ''}
    </div>

    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--g400);margin-bottom:10px">Platform Activity</div>
    <div class="cf-detail-grid" style="margin-bottom:18px">
      <div class="cf-detail-item"><div class="cf-detail-label">Connection Requests</div><div class="cf-detail-value">${userReqs.length}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Active Connections</div><div class="cf-detail-value">${userConns.length}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Joined</div><div class="cf-detail-value">2025</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Last Active</div><div class="cf-detail-value">Today</div></div>
    </div>

    ${userReqs.length ? `
    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--g400);margin-bottom:10px">Recent Requests (${userReqs.length})</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
      ${userReqs.slice(0,3).map(r => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r8)">
          <div><div style="font-size:.82rem;font-weight:600;color:var(--s200)">${r.caseType}</div><div style="font-size:.72rem;color:var(--s400)">To: Adv. ${r.toLawyerName} · ${r.date}</div></div>
          <span style="font-size:.7rem;padding:2px 8px;border-radius:20px;font-weight:700;${r.status==='accepted'?'background:rgba(34,197,94,.1);color:var(--suc)':r.status==='declined'?'background:rgba(239,68,68,.1);color:var(--err)':'background:rgba(245,158,11,.1);color:var(--warn)'}">${r.status}</span>
        </div>`).join('')}
    </div>` : ''}

    <div style="display:flex;gap:10px;padding-top:16px;border-top:1px solid var(--gbord)">
      <button class="btn btn-ghost" style="flex:1" onclick="closeAdminUserDetailModal()">Close</button>
      <button class="btn btn-gold" style="flex:1" onclick="showToast('Reset email sent to ${u.email}');closeAdminUserDetailModal()">📧 Send Reset Email</button>
      <button class="btn btn-danger" onclick="adminSuspendUser(${idx});closeAdminUserDetailModal()">Suspend Account</button>
    </div>`;

  overlay.classList.add('open');
}

function closeAdminUserDetailModal() { document.getElementById('adminUserDetailOverlay').classList.remove('open'); }
function closeAdminUserDetail(e) { if (e.target === document.getElementById('adminUserDetailOverlay')) closeAdminUserDetailModal(); }

function adminSuspendUser(idx) {
  const u = USERS[idx];
  if (!u) return;
  const name = u.firmName || (u.firstName + ' ' + u.lastName);
  showToast('⚠️ Account suspended: ' + name + '. They have been notified by email.');
  renderAdminUserTable();
}

// ════════════════════════════════════════════════════
// ADMIN — LAWYER PROFILE MODAL
// ════════════════════════════════════════════════════
function openAdminLawyerProfile(email) {
  const l = USERS.find(u => u.email === email && u.role === 'lawyer');
  if (!l) return;
  const overlay = document.getElementById('adminLawyerProfileOverlay');
  const body    = document.getElementById('adminLawyerProfileBody');
  const title   = document.getElementById('adminLawyerProfileTitle');
  if (!overlay || !body) return;
  if (title) title.textContent = '⚖️ Adv. ' + l.firstName + ' ' + l.lastName;

  // Their connection requests received
  const reqsReceived = connectionRequests.filter(r => r.toEmail === l.email);
  const accepted     = reqsReceived.filter(r => r.status === 'accepted');
  const pending      = reqsReceived.filter(r => r.status === 'pending');

  // Their services
  const svcCount = lawyerServices ? lawyerServices.length : 0;

  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;padding-bottom:20px;border-bottom:1px solid var(--gbord);margin-bottom:20px">
      <div style="width:60px;height:60px;border-radius:50%;background:${l.avatarGrad};display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:700;color:#fff;flex-shrink:0">${l.initials}</div>
      <div style="flex:1">
        <div style="font-size:1.15rem;font-weight:700;color:#fff">Adv. ${l.firstName} ${l.lastName}</div>
        <div style="font-size:.82rem;color:var(--g400);font-weight:600;margin-top:3px">${l.specialty || 'General Practice'}</div>
        <div style="font-size:.78rem;color:var(--s400);margin-top:2px">${l.email}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <div class="match-badge ${l.available ? 'avail' : 'busy'}">${l.available ? 'Available' : 'Busy'}</div>
        ${l.rating ? `<div style="font-size:.82rem;font-weight:700;color:var(--g400)">${l.rating} ★</div>` : ''}
      </div>
    </div>

    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--g400);margin-bottom:10px">Lawyer Profile</div>
    <div class="cf-detail-grid" style="margin-bottom:18px">
      <div class="cf-detail-item"><div class="cf-detail-label">County</div><div class="cf-detail-value">${l.county || 'Not specified'}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Experience</div><div class="cf-detail-value">${l.experience ? l.experience + ' years' : 'New Advocate'}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Fee Range</div><div class="cf-detail-value">${l.fee || 'Not set'}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Rating</div><div class="cf-detail-value">${l.rating ? l.rating + ' ★' : 'No rating yet'}</div></div>
    </div>

    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--g400);margin-bottom:10px">Caseload & Activity</div>
    <div class="cf-detail-grid" style="margin-bottom:18px">
      <div class="cf-detail-item"><div class="cf-detail-label">Total Requests Received</div><div class="cf-detail-value">${reqsReceived.length}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Active Connections</div><div class="cf-detail-value">${accepted.length}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Pending Requests</div><div class="cf-detail-value">${pending.length}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Services Listed</div><div class="cf-detail-value">${svcCount}</div></div>
    </div>

    ${reqsReceived.length ? `
    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--g400);margin-bottom:10px">Recent Client Requests</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:18px">
      ${reqsReceived.slice(0,4).map(r => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r8)">
          <div>
            <div style="font-size:.82rem;font-weight:600;color:var(--s200)">${r.fromName} <span style="color:var(--s400);font-weight:400">— ${r.caseType}</span></div>
            <div style="font-size:.72rem;color:var(--s400)">${r.date} at ${r.time}</div>
          </div>
          <span style="font-size:.7rem;padding:2px 8px;border-radius:20px;font-weight:700;${r.status==='accepted'?'background:rgba(34,197,94,.1);color:var(--suc)':r.status==='declined'?'background:rgba(239,68,68,.1);color:var(--err)':'background:rgba(245,158,11,.1);color:var(--warn)'}">${r.status}</span>
        </div>`).join('')}
    </div>` : ''}

    <div style="display:flex;gap:10px;padding-top:16px;border-top:1px solid var(--gbord)">
      <button class="btn btn-ghost" style="flex:1" onclick="closeAdminLawyerProfileModal()">Close</button>
      <button class="btn btn-gold" onclick="adminToggleLawyerStatus('${l.email}');renderAdminLawyers();closeAdminLawyerProfileModal()">${l.available ? '🔴 Set Unavailable' : '🟢 Set Available'}</button>
      <button class="btn btn-danger" onclick="showToast('Suspension notice sent to ${l.email}');closeAdminLawyerProfileModal()">Suspend</button>
    </div>`;

  overlay.classList.add('open');
}

function closeAdminLawyerProfileModal() { document.getElementById('adminLawyerProfileOverlay').classList.remove('open'); }
function closeAdminLawyerProfile(e) { if (e.target === document.getElementById('adminLawyerProfileOverlay')) closeAdminLawyerProfileModal(); }

function adminToggleLawyerStatus(email) {
  const l = USERS.find(u => u.email === email && u.role === 'lawyer');
  if (!l) return;
  l.available = !l.available;
  showToast('Adv. ' + l.firstName + ' ' + l.lastName + ' set to ' + (l.available ? 'Available' : 'Busy'));
  renderAdminLawyers();
}

// ════════════════════════════════════════════════════
// ADMIN — NGO PANEL FUNCTIONS
// ════════════════════════════════════════════════════
function renderAdminNgoPanel() {
  const ngoUsers = USERS.filter(u => u.role === 'ngo');
  const countEl  = document.getElementById('adminNgoCount');
  const intEl    = document.getElementById('adminNgoIntakes');
  if (countEl) countEl.textContent = ngoUsers.length;
  if (intEl)   intEl.textContent   = ngoIntakes.length;
  const countLbl = document.getElementById('adminNgoListCount');
  if (countLbl) countLbl.textContent = ngoUsers.length + ' organisations';
  renderAdminNgoList();
  renderAdminAllIntakes();
}

function renderAdminNgoList(filter) {
  const container = document.getElementById('adminNgoOrgList');
  if (!container) return;
  let list = USERS.filter(u => u.role === 'ngo');
  const search = (document.getElementById('adminNgoSearch')||{}).value || '';
  if (search) list = list.filter(u => (u.firmName||u.firstName+''+u.lastName).toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const countLbl = document.getElementById('adminNgoListCount');
  if (countLbl) countLbl.textContent = list.length + ' organisation' + (list.length!==1?'s':'');

  if (!list.length) {
    container.innerHTML = `<div style="text-align:center;padding:48px;color:var(--s400)"><div style="font-size:3rem;margin-bottom:14px;opacity:.3">🏢</div><div style="font-size:.92rem;font-weight:600;color:var(--s200);margin-bottom:6px">No NGO organisations registered yet</div><div style="font-size:.82rem">NGO/Probono organisations that register will appear here.</div></div>`;
    return;
  }
  container.innerHTML = list.map((u, i) => {
    const name = u.firmName || (u.firstName + ' ' + u.lastName);
    const initials = u.initials || name[0].toUpperCase();
    const myIntakes = ngoIntakes.length; // all platform intakes
    return `
    <div class="law-client-row">
      <div class="law-cl-av" style="background:${u.avatarGrad||'linear-gradient(135deg,#0e4d3a,#1a7a5a)'}">${initials}</div>
      <div style="flex:1;min-width:0">
        <div class="law-cl-name">${name}</div>
        <div class="law-cl-meta">${u.email} · ${u.county || 'Kenya'}</div>
        <div class="law-cl-meta" style="margin-top:2px;color:var(--t400)">${myIntakes} case intakes registered on platform</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <div class="match-badge avail">Active</div>
        <button class="btn btn-gold sm" onclick="openAdminNgoDetail(${USERS.indexOf(u)})">👁 View Profile</button>
      </div>
    </div>`;
  }).join('');
}

function filterAdminNgoList() { renderAdminNgoList(); }

function renderAdminAllIntakes() {
  const container = document.getElementById('adminNgoIntakeList');
  if (!container) return;
  const recent = ngoIntakes.slice(0, 5);
  if (!recent.length) {
    container.innerHTML = `<div style="text-align:center;padding:32px;color:var(--s400);font-size:.84rem">No case intakes recorded yet.</div>`;
    return;
  }
  container.innerHTML = recent.map((i, idx) => {
    const urgColor = i.urgency === 'Emergency' ? 'var(--err)' : i.urgency === 'Urgent' ? 'var(--warn)' : 'var(--suc)';
    return `
    <div class="law-client-row" style="cursor:pointer" onclick="openIntakeDetail(${ngoIntakes.indexOf(i)})">
      <div class="law-cl-av" style="background:${i.grad}">${i.initials}</div>
      <div style="flex:1;min-width:0">
        <div class="law-cl-name">${i.clientName} <span style="font-size:.72rem;color:var(--s400);font-weight:400">· ${i.id}</span></div>
        <div class="law-cl-meta">${i.category} · ${i.county} · ${i.date}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <span style="font-size:.7rem;font-weight:700;color:${urgColor}">${i.urgency}</span>
        <div class="match-badge ${i.status==='Active'?'avail':'busy'}">${i.status}</div>
      </div>
    </div>`;
  }).join('') + (ngoIntakes.length > 5 ? `<div style="text-align:center;padding:12px;font-size:.8rem;color:var(--g400);cursor:pointer" onclick="switchDashTab('ngo-all-intakes')">View all ${ngoIntakes.length} intakes →</div>` : '');
}

function openAdminNgoDetail(idx) {
  const u = USERS[idx];
  if (!u) return;
  const overlay = document.getElementById('adminNgoDetailOverlay');
  const body    = document.getElementById('adminNgoDetailBody');
  const title   = document.getElementById('adminNgoDetailTitle');
  if (!overlay || !body) return;
  const name = u.firmName || (u.firstName + ' ' + u.lastName);
  if (title) title.textContent = '🏢 ' + name;

  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;padding-bottom:20px;border-bottom:1px solid var(--gbord);margin-bottom:20px">
      <div style="width:56px;height:56px;border-radius:50%;background:${u.avatarGrad||'linear-gradient(135deg,#0e4d3a,#1a7a5a)'};display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;color:#fff;flex-shrink:0">${u.initials||name[0].toUpperCase()}</div>
      <div>
        <div style="font-size:1.1rem;font-weight:700;color:#fff">${name}</div>
        <div style="font-size:.8rem;color:var(--t400);font-weight:600;margin-top:3px">NGO / Probono Organisation</div>
        <div style="font-size:.78rem;color:var(--s400);margin-top:2px">${u.email}</div>
      </div>
    </div>
    <div class="cf-detail-grid" style="margin-bottom:20px">
      <div class="cf-detail-item"><div class="cf-detail-label">Organisation</div><div class="cf-detail-value">${u.firmName||'N/A'}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">County</div><div class="cf-detail-value">${u.county||'Not specified'}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Email</div><div class="cf-detail-value" style="font-size:.8rem;word-break:break-all">${u.email}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Account Status</div><div class="cf-detail-value" style="color:var(--suc)">Active</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Platform Intakes</div><div class="cf-detail-value">${ngoIntakes.length} total</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Beneficiaries</div><div class="cf-detail-value">218</div></div>
    </div>
    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--g400);margin-bottom:10px">Recent Platform Intakes</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:18px">
      ${ngoIntakes.slice(0,3).map(i => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r8)">
          <div><div style="font-size:.82rem;font-weight:600;color:var(--s200)">${i.clientName} — ${i.category}</div><div style="font-size:.72rem;color:var(--s400)">${i.county} · ${i.date}</div></div>
          <div class="match-badge ${i.status==='Active'?'avail':'busy'}">${i.status}</div>
        </div>`).join('')}
    </div>
    <div style="display:flex;gap:10px;padding-top:16px;border-top:1px solid var(--gbord)">
      <button class="btn btn-ghost" style="flex:1" onclick="closeAdminNgoDetailModal()">Close</button>
      <button class="btn btn-gold" onclick="showToast('Email sent to ${u.email}');closeAdminNgoDetailModal()">📧 Contact Organisation</button>
      <button class="btn btn-danger" onclick="showToast('Account suspended: ${name}');closeAdminNgoDetailModal()">Suspend</button>
    </div>`;
  overlay.classList.add('open');
}
function closeAdminNgoDetailModal() { document.getElementById('adminNgoDetailOverlay').classList.remove('open'); }
function closeAdminNgoDetail(e) { if (e.target === document.getElementById('adminNgoDetailOverlay')) closeAdminNgoDetailModal(); }

function exportAdminNgoCSV() {
  const ngoUsers = USERS.filter(u => u.role === 'ngo');
  const rows = [['Organisation','Email','County','Status']];
  ngoUsers.forEach(u => rows.push([(u.firmName||u.firstName+' '+u.lastName), u.email, u.county||'', 'Active']));
  _downloadCSV(rows, 'nomos_ngo_organisations.csv');
  showToast('📥 NGO organisations CSV downloaded.');
}

// ════════════════════════════════════════════════════
// ADMIN — CORPORATE PANEL FUNCTIONS
// ════════════════════════════════════════════════════

// Simulated API key log
const _adminApiKeyLog = [
  { org: 'Savannah Enterprises Ltd.', key: 'NOMOS-PROD-••••-XXXX', action: 'Key Generated', time: '10:42 AM', date: '12 Jun 2025', status: 'Active' },
  { org: 'Kenya Revenue Authority', key: 'NOMOS-PROD-••••-YYYY', action: 'Key Revoked', time: '2:15 PM', date: '8 Jun 2025', status: 'Revoked' },
  { org: 'Nairobi City County', key: 'NOMOS-PROD-••••-ZZZZ', action: 'Key Generated', time: '9:00 AM', date: '5 Jun 2025', status: 'Active' },
];

function renderAdminCorpPanel() {
  const corpUsers = USERS.filter(u => u.role === 'corporate');
  const countEl   = document.getElementById('adminCorpCount');
  const keysEl    = document.getElementById('adminCorpApiKeys');
  if (countEl) countEl.textContent = corpUsers.length;
  if (keysEl)  keysEl.textContent  = _adminApiKeyLog.filter(k=>k.status==='Active').length;
  const countLbl = document.getElementById('adminCorpListCount');
  if (countLbl) countLbl.textContent = corpUsers.length + ' account' + (corpUsers.length!==1?'s':'');
  renderAdminCorpList();
  renderAdminApiKeyLog();
}

function renderAdminCorpList(filter) {
  const container = document.getElementById('adminCorpOrgList');
  if (!container) return;
  let list = USERS.filter(u => u.role === 'corporate');
  const search = (document.getElementById('adminCorpSearch')||{}).value || '';
  if (search) list = list.filter(u => (u.firmName||u.firstName+''+u.lastName).toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const countLbl = document.getElementById('adminCorpListCount');
  if (countLbl) countLbl.textContent = list.length + ' account' + (list.length!==1?'s':'');

  if (!list.length) {
    container.innerHTML = `<div style="text-align:center;padding:48px;color:var(--s400)"><div style="font-size:3rem;margin-bottom:14px;opacity:.3">🏛️</div><div style="font-size:.92rem;font-weight:600;color:var(--s200);margin-bottom:6px">No corporate accounts registered yet</div><div style="font-size:.82rem">Corporate/Government organisations that register will appear here.</div></div>`;
    return;
  }
  container.innerHTML = list.map((u, i) => {
    const name = u.firmName || (u.firstName + ' ' + u.lastName);
    const initials = u.initials || name[0].toUpperCase();
    return `
    <div class="law-client-row">
      <div class="law-cl-av" style="background:${u.avatarGrad||'linear-gradient(135deg,#1a2a5e,#2d4a9e)'}">${initials}</div>
      <div style="flex:1;min-width:0">
        <div class="law-cl-name">${name}</div>
        <div class="law-cl-meta">${u.email} · ${u.county||'Kenya'}</div>
        <div class="law-cl-meta" style="margin-top:2px;color:var(--g400)">Corporate / Government Account</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <div class="match-badge avail">Active</div>
        <button class="btn btn-gold sm" onclick="openAdminCorpDetail(${USERS.indexOf(u)})">👁 View Profile</button>
      </div>
    </div>`;
  }).join('');
}

function filterAdminCorpList() { renderAdminCorpList(); }

function renderAdminApiKeyLog() {
  const container = document.getElementById('adminApiKeyLog');
  if (!container) return;
  container.innerHTML = _adminApiKeyLog.map(entry => `
    <div style="display:flex;align-items:center;gap:14px;padding:12px 14px;background:var(--surf3);border:1px solid var(--gbord);border-radius:var(--r8)">
      <div style="width:34px;height:34px;border-radius:50%;background:${entry.status==='Active'?'rgba(34,197,94,.15)':'rgba(239,68,68,.12)'};display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">🔑</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:.84rem;font-weight:600;color:var(--s200)">${entry.org}</div>
        <div style="font-family:monospace;font-size:.72rem;color:var(--s400)">${entry.key}</div>
        <div style="font-size:.72rem;color:var(--s400);margin-top:2px">${entry.action} · ${entry.date} at ${entry.time}</div>
      </div>
      <span style="font-size:.7rem;padding:3px 10px;border-radius:20px;font-weight:700;${entry.status==='Active'?'background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);color:var(--suc)':'background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:var(--err)'}">${entry.status}</span>
      ${entry.status==='Active' ? `<button class="btn btn-ghost sm" style="font-size:.72rem;padding:4px 10px" onclick="revokeApiKeyLog('${entry.key}')">Revoke</button>` : ''}
    </div>`).join('');
}

function revokeApiKeyLog(key) {
  const entry = _adminApiKeyLog.find(e => e.key === key);
  if (entry) { entry.status = 'Revoked'; entry.action = 'Key Revoked'; }
  renderAdminApiKeyLog();
  const keysEl = document.getElementById('adminCorpApiKeys');
  if (keysEl) keysEl.textContent = _adminApiKeyLog.filter(k=>k.status==='Active').length;
  showToast('🔑 API key revoked successfully.');
}

function openAdminCorpDetail(idx) {
  const u = USERS[idx];
  if (!u) return;
  const overlay = document.getElementById('adminCorpDetailOverlay');
  const body    = document.getElementById('adminCorpDetailBody');
  const title   = document.getElementById('adminCorpDetailTitle');
  if (!overlay || !body) return;
  const name = u.firmName || (u.firstName + ' ' + u.lastName);
  if (title) title.textContent = '🏛️ ' + name;
  const myKeys = _adminApiKeyLog.filter(k => k.org === name);

  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;padding-bottom:20px;border-bottom:1px solid var(--gbord);margin-bottom:20px">
      <div style="width:56px;height:56px;border-radius:50%;background:${u.avatarGrad||'linear-gradient(135deg,#1a2a5e,#2d4a9e)'};display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;color:#fff;flex-shrink:0">${u.initials||name[0].toUpperCase()}</div>
      <div>
        <div style="font-size:1.1rem;font-weight:700;color:#fff">${name}</div>
        <div style="font-size:.8rem;color:var(--g400);font-weight:600;margin-top:3px">Corporate / Government Account</div>
        <div style="font-size:.78rem;color:var(--s400);margin-top:2px">${u.email}</div>
      </div>
    </div>
    <div class="cf-detail-grid" style="margin-bottom:18px">
      <div class="cf-detail-item"><div class="cf-detail-label">Entity Name</div><div class="cf-detail-value">${u.firmName||'N/A'}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">County</div><div class="cf-detail-value">${u.county||'Not specified'}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Email</div><div class="cf-detail-value" style="font-size:.8rem;word-break:break-all">${u.email}</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Account Status</div><div class="cf-detail-value" style="color:var(--suc)">Active</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">API Keys</div><div class="cf-detail-value">${myKeys.length} key${myKeys.length!==1?'s':''} (${myKeys.filter(k=>k.status==='Active').length} active)</div></div>
      <div class="cf-detail-item"><div class="cf-detail-label">Team Members</div><div class="cf-detail-value">6</div></div>
    </div>
    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--g400);margin-bottom:10px">Compliance Status</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(34,197,94,.05);border:1px solid rgba(34,197,94,.15);border-radius:var(--r8)">
        <div style="font-size:.82rem;color:var(--s200)">Companies Act — Annual Returns</div>
        <span style="font-size:.7rem;padding:2px 8px;border-radius:20px;background:rgba(34,197,94,.1);color:var(--suc);font-weight:700">✓ Filed</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(245,158,11,.05);border:1px solid rgba(245,158,11,.15);border-radius:var(--r8)">
        <div style="font-size:.82rem;color:var(--s200)">Data Protection Act Audit</div>
        <span style="font-size:.7rem;padding:2px 8px;border-radius:20px;background:rgba(245,158,11,.1);color:var(--warn);font-weight:700">⚠ Due Soon</span>
      </div>
    </div>
    <div style="display:flex;gap:10px;padding-top:16px;border-top:1px solid var(--gbord)">
      <button class="btn btn-ghost" style="flex:1" onclick="closeAdminCorpDetailModal()">Close</button>
      <button class="btn btn-gold" onclick="showToast('Email sent to ${u.email}');closeAdminCorpDetailModal()">📧 Contact</button>
      <button class="btn btn-danger" onclick="showToast('Account suspended: ${name}');closeAdminCorpDetailModal()">Suspend</button>
    </div>`;
  overlay.classList.add('open');
}

function closeAdminCorpDetailModal() { document.getElementById('adminCorpDetailOverlay').classList.remove('open'); }
function closeAdminCorpDetail(e) { if (e.target === document.getElementById('adminCorpDetailOverlay')) closeAdminCorpDetailModal(); }

function exportAdminCorpCSV() {
  const corpUsers = USERS.filter(u => u.role === 'corporate');
  const rows = [['Entity Name','Email','County','Status']];
  corpUsers.forEach(u => rows.push([(u.firmName||u.firstName+' '+u.lastName), u.email, u.county||'', 'Active']));
  _downloadCSV(rows, 'nomos_corporate_accounts.csv');
  showToast('📥 Corporate accounts CSV downloaded.');
}

// ════════════════════════════════════════════════════
// CSV DOWNLOAD UTILITY
// ════════════════════════════════════════════════════
function _downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════════
// API DOCUMENTATION MODAL
// ════════════════════════════════════════════════════
function openApiDocModal() {
  const overlay = document.getElementById('apiDocOverlay');
  if (overlay) overlay.classList.add('open');
}
function closeApiDocModalBtn() {
  const overlay = document.getElementById('apiDocOverlay');
  if (overlay) overlay.classList.remove('open');
}
function closeApiDocModal(e) {
  if (e.target === document.getElementById('apiDocOverlay')) closeApiDocModalBtn();
}

// ════════════════════════════════════════════════════
// POSTMAN COLLECTION DOWNLOAD
// ════════════════════════════════════════════════════
function downloadPostmanCollection() {
  const collection = {
    info: {
      name: 'Nomos AI Pro API',
      description: "Kenya's Legal Intelligence Engine — REST API Collection",
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: [
      {
        name: 'Analyse Document / Contract',
        request: {
          method: 'POST',
          header: [
            { key: 'Authorization', value: 'Bearer {{API_KEY}}' },
            { key: 'Content-Type', value: 'application/json' }
          ],
          url: { raw: 'https://api.nomosai.ke/v1/analyse', host: ['api.nomosai.ke'], path: ['v1','analyse'] },
          body: { mode: 'raw', raw: JSON.stringify({ document_text: '...', analysis_type: 'contract' }, null, 2) }
        }
      },
      {
        name: 'Case Strength Assessment',
        request: {
          method: 'POST',
          header: [
            { key: 'Authorization', value: 'Bearer {{API_KEY}}' },
            { key: 'Content-Type', value: 'application/json' }
          ],
          url: { raw: 'https://api.nomosai.ke/v1/assess', host: ['api.nomosai.ke'], path: ['v1','assess'] },
          body: { mode: 'raw', raw: JSON.stringify({ case_type: 'tenant_rights', description: '...', county: 'Nairobi' }, null, 2) }
        }
      },
      {
        name: 'Generate Legal Document',
        request: {
          method: 'POST',
          header: [
            { key: 'Authorization', value: 'Bearer {{API_KEY}}' },
            { key: 'Content-Type', value: 'application/json' }
          ],
          url: { raw: 'https://api.nomosai.ke/v1/generate', host: ['api.nomosai.ke'], path: ['v1','generate'] },
          body: { mode: 'raw', raw: JSON.stringify({ doc_type: 'nda', parties: [], jurisdiction: 'Kenya' }, null, 2) }
        }
      },
      {
        name: 'Search Legal Precedents',
        request: {
          method: 'GET',
          header: [{ key: 'Authorization', value: 'Bearer {{API_KEY}}' }],
          url: { raw: 'https://api.nomosai.ke/v1/precedents?q=eviction&county=Nairobi&limit=10', host: ['api.nomosai.ke'], path: ['v1','precedents'], query: [{ key:'q', value:'eviction' },{ key:'county', value:'Nairobi' },{ key:'limit', value:'10' }] }
        }
      }
    ],
    variable: [{ key: 'API_KEY', value: 'YOUR_API_KEY_HERE', type: 'string' }]
  };
  _downloadCSV([], ''); // ensure function loaded
  const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'Nomos_AI_Pro_API.postman_collection.json';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📥 Postman collection downloaded — import it in Postman to get started!');
}

