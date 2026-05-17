let token = null;

function showModal(type) {
  const modal = document.getElementById('auth-modal');
  if (modal) { modal.classList.add('active'); switchAuth(type); }
}

function closeModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('active');
}

function switchAuth(type) {
  const login = document.getElementById('login-form');
  const register = document.getElementById('register-form');
  if (login && register) {
    login.style.display = type === 'login' ? 'block' : 'none';
    register.style.display = type === 'register' ? 'block' : 'none';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Přihlášení selhalo'); return; }
    token = data.token;
    localStorage.setItem('cf_token', data.token);
    localStorage.setItem('cf_user', JSON.stringify(data.user));
    closeModal();
    window.location.href = '/dashboard';
  } catch (err) { alert('Přihlášení selhalo. Zkuste znovu.'); }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  try {
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Registrace selhala'); return; }
    token = data.token;
    localStorage.setItem('cf_token', data.token);
    localStorage.setItem('cf_user', JSON.stringify(data.user));
    closeModal();
    window.location.href = '/dashboard';
  } catch (err) { alert('Registrace selhala. Zkuste znovu.'); }
}

async function handleGoogleLogin() {
  alert('Pro aktivaci Google přihlášení:\n1. Vytvořte Google Cloud projekt\n2. Nastavte OAuth 2.0 credentials\n3. Přidejte Google One Tap nebo Google Sign-In SDK\n\nZatím použijte e-mailové přihlášení.');
}

function logout() {
  localStorage.removeItem('cf_token');
  localStorage.removeItem('cf_user');
  window.location.href = '/';
}

function scrollToFreeTrial() {
  const el = document.getElementById('free-trial');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

async function generateFreeSample() {
  const topic = document.getElementById('free-topic').value;
  const btn = document.getElementById('free-generate-btn');
  const btnText = document.getElementById('free-btn-text');
  const btnLoading = document.getElementById('free-btn-loading');
  const loading = document.getElementById('free-loading');
  const output = document.getElementById('free-output');
  const error = document.getElementById('free-error');

  if (!topic || topic.length < 3) {
    showErrorFree('Zadejte název produktu (min. 3 znaky)');
    return;
  }

  btn.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';
  loading.style.display = 'block';
  output.style.display = 'none';
  error.style.display = 'none';

  try {
    const res = await fetch('/api/content/free-sample', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Generování selhalo');
    document.getElementById('free-output-content').innerHTML = formatMarkdown(data.output);
    document.getElementById('free-word-count').textContent = data.wordCount + ' slov';
    output.style.display = 'block';
  } catch (err) {
    showErrorFree(err.message);
  } finally {
    btn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    loading.style.display = 'none';
  }
}

function showErrorFree(msg) {
  const error = document.getElementById('free-error');
  error.textContent = msg;
  error.style.display = 'block';
}

function copyFreeOutput() {
  const content = document.getElementById('free-output-content').innerText;
  navigator.clipboard.writeText(content);
  const btn = event.target;
  btn.textContent = '✓ Zkopírováno!';
  setTimeout(() => btn.textContent = '📋 Kopírovat', 2000);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatMarkdown(text) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function toggleMobileMenu() {
  const nav = document.getElementById('nav-links');
  if (nav) nav.classList.toggle('mobile-open');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  }

  const stored = localStorage.getItem('cf_token');
  if (stored) {
    const user = JSON.parse(localStorage.getItem('cf_user') || '{}');
    const creditsEl = document.getElementById('user-credits');
    const nameEl = document.getElementById('user-name');
    const tierEl = document.getElementById('current-tier');
    const upgradeEl = document.getElementById('upgrade-link');
    if (creditsEl) creditsEl.textContent = (user.credits || 5) + ' kreditů';
    if (nameEl) nameEl.textContent = user.name || 'Uživatel';
    if (tierEl) { const m = { free: 'Zdarma', starter: 'Základní', pro: 'Profesionál', enterprise: 'Enterprise' }; tierEl.textContent = m[user.tier] || 'Zdarma'; }
    if (upgradeEl && user.tier !== 'free') upgradeEl.style.display = 'none';

    // Show nav credits + dashboard, hide login/register
    const navCredits = document.getElementById('nav-credits');
    const navCreditsCount = document.getElementById('nav-credits-count');
    const navLogin = document.getElementById('nav-login');
    const navRegister = document.getElementById('nav-register');
    const navDashboard = document.getElementById('nav-dashboard');
    const navLogout = document.getElementById('nav-logout');
    if (navCredits) { navCredits.style.display = 'inline-flex'; navCreditsCount.textContent = user.credits || 5; }
    if (navLogin) navLogin.style.display = 'none';
    if (navRegister) navRegister.style.display = 'none';
    if (navDashboard) navDashboard.style.display = 'inline-flex';
    if (navLogout) navLogout.style.display = 'inline-flex';
  }

  // Particle animation
  const container = document.getElementById('particles');
  if (container) {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 8 + 's';
      p.style.animationDuration = (6 + Math.random() * 6) + 's';
      p.style.width = (2 + Math.random() * 4) + 'px';
      p.style.height = p.style.width;
      container.appendChild(p);
    }
  }

  // Counter animation
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (el.classList.contains('stat-number') && el.dataset.count) animateCounter(el, parseInt(el.dataset.count));
        el.classList.add('visible');
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.stat-number, .feature-card').forEach(el => observer.observe(el));
});

function animateCounter(el, target) {
  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) { current = target; clearInterval(timer); }
    if (target >= 1000000) el.textContent = (current / 1000000).toFixed(1) + 'M+';
    else if (target >= 1000) el.textContent = Math.floor(current / 1000) + 'K+';
    else el.textContent = Math.floor(current);
  }, 40);
}

// Enter key for free sample
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'free-topic') generateFreeSample();
});
