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
  const termsEl = document.getElementById('register-terms');
  if (termsEl && !termsEl.checked) { alert('Pro registraci je nutné souhlasit s obchodními podmínkami.'); return; }
  try {
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, termsAccepted: true }) });
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

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function scrollToFreeTrial() {
  scrollToSection('free-trial');
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

/* ─── Reviews ─── */
let reviewRating = 0;

function setRating(val) {
  reviewRating = val;
  document.getElementById('review-rating').value = val;
  const stars = document.querySelectorAll('#star-rating span');
  stars.forEach((s, i) => {
    s.textContent = i < val ? '★' : '☆';
  });
}

async function submitReview(e) {
  e.preventDefault();
  const name = document.getElementById('review-name').value;
  const email = document.getElementById('review-email').value;
  const rating = reviewRating;
  const text = document.getElementById('review-text').value;
  const error = document.getElementById('review-error');
  const success = document.getElementById('review-success');
  const btn = document.getElementById('review-submit-btn');

  if (rating < 1) {
    error.textContent = 'Prosím vyberte hodnocení (1-5 hvězdiček)';
    error.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Odesílám...';
  error.style.display = 'none';
  success.style.display = 'none';

  try {
    const res = await fetch('/api/reviews/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, rating, text })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Odeslání selhalo');

    success.textContent = data.message;
    success.style.display = 'block';
    document.getElementById('review-name').value = '';
    document.getElementById('review-email').value = '';
    document.getElementById('review-text').value = '';
    setRating(0);
    document.querySelector('[onclick*="review-form"]')?.click();
    document.getElementById('review-form').style.display = 'none';
  } catch (err) {
    error.textContent = err.message;
    error.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Odeslat recenzi';
  }
}

async function loadReviews() {
  const list = document.getElementById('reviews-list');
  if (!list) return;
  try {
    const res = await fetch('/api/reviews/list');
    const data = await res.json();
    if (!data.reviews || data.reviews.length === 0) {
      list.innerHTML = '<div class="empty-state" style="color:var(--gray-light);grid-column:1/-1"><div class="empty-icon" style="font-size:3rem">💬</div><h3 style="color:var(--white)">Zatím žádné recenze</h3><p>Buďte první, kdo ohodnotí Dreaming Shopkeeper!</p></div>';
      return;
    }
    list.innerHTML = data.reviews.map(r => {
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      const initials = r.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const date = new Date(r.created_at).toLocaleDateString('cs-CZ');
      return `
        <div class="testimonial-card">
          <div class="testimonial-stars">${stars}</div>
          <p class="testimonial-text">"${escapeHtml(r.text)}"</p>
          <div class="testimonial-author">
            <div class="testimonial-avatar">${initials}</div>
            <div>
              <strong>${escapeHtml(r.name)}</strong>
              <span>${date}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch {
    list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--gray-light);grid-column:1/-1">Nepodařilo se načíst recenze. Zkuste to prosím později.</div>';
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initCookieConsent();
  loadReviews();

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

/* ─── Cookie Consent Banner ─── */
const COOKIE_CONSENT_KEY = 'cookie_consent';

function getCookieConsent() {
  try { return JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY)) || null; }
  catch { return null; }
}

function setCookieConsent(prefs) {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
}

function getDefaultConsent() {
  return { necessary: true, analytics: false, marketing: false };
}

function showCookieBanner() {
  const existing = document.getElementById('cookie-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.className = 'cookie-banner';
  banner.innerHTML = `
    <div class="cookie-banner-inner">
      <div class="cookie-banner-text">
        <strong>🍪 Tento web používá cookies</strong><br>
        Používáme nezbytné cookies pro fungování služby. Analytické a marketingové cookies používáme pouze s vaším souhlasem.
        <a href="/zasady-cookies">Více informací</a>
      </div>
      <div class="cookie-banner-buttons">
        <button class="btn btn-outline btn-sm" onclick="showCookiePreferences()">Nastavení</button>
        <button class="btn btn-outline btn-sm" onclick="rejectAllCookies()">Odmítnout vše</button>
        <button class="btn btn-primary btn-sm" onclick="acceptAllCookies()">Přijmout vše</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);
}

function hideCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  if (banner) banner.remove();
}

function acceptAllCookies() {
  setCookieConsent({ necessary: true, analytics: true, marketing: true });
  hideCookieBanner();
  applyCookieConsent();
}

function rejectAllCookies() {
  setCookieConsent(getDefaultConsent());
  hideCookieBanner();
  applyCookieConsent();
}

function saveCookiePreferences() {
  const analytics = document.getElementById('cookie-analytics')?.checked || false;
  const marketing = document.getElementById('cookie-marketing')?.checked || false;
  setCookieConsent({ necessary: true, analytics, marketing });
  const modal = document.getElementById('cookie-preferences-modal');
  if (modal) modal.remove();
  hideCookieBanner();
  applyCookieConsent();
}

function showCookiePreferences() {
  const existing = document.getElementById('cookie-preferences-modal');
  if (existing) existing.remove();

  const consent = getCookieConsent() || getDefaultConsent();
  const modal = document.createElement('div');
  modal.id = 'cookie-preferences-modal';
  modal.className = 'cookie-preferences';
  modal.innerHTML = `
    <div class="cookie-preferences-inner">
      <h2>Nastavení cookies</h2>
      <p>Zde můžete spravovat své preference pro používání cookies.</p>
      <div class="cookie-pref-item">
        <div class="cookie-pref-label">
          <strong>Nezbytné</strong>
          <span>Tyto cookies jsou potřebné pro fungování webu. Nelze je vypnout.</span>
        </div>
        <input type="checkbox" checked disabled>
      </div>
      <div class="cookie-pref-item">
        <div class="cookie-pref-label">
          <strong>Analytické</strong>
          <span>Pomáhají nám zlepšovat službu analýzou způsobu používání.</span>
        </div>
        <input type="checkbox" id="cookie-analytics" ${consent.analytics ? 'checked' : ''}>
      </div>
      <div class="cookie-pref-item">
        <div class="cookie-pref-label">
          <strong>Marketingové</strong>
          <span>Umožňují zobrazování relevantních nabídek.</span>
        </div>
        <input type="checkbox" id="cookie-marketing" ${consent.marketing ? 'checked' : ''}>
      </div>
      <div class="cookie-pref-actions">
        <button class="btn btn-outline" onclick="rejectAllCookies()">Odmítnout vše</button>
        <button class="btn btn-outline" onclick="document.getElementById('cookie-preferences-modal').remove();showCookieBanner()">Zpět</button>
        <button class="btn btn-primary" onclick="saveCookiePreferences()">Uložit nastavení</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function applyCookieConsent() {
  const consent = getCookieConsent();
  if (!consent) return;
  // Future: apply analytics/marketing scripts here based on consent
  // if (consent.analytics) { loadAnalytics(); }
  // if (consent.marketing) { loadMarketing(); }
  console.log('Cookie consent applied:', JSON.stringify(consent));
}

function initCookieConsent() {
  const consent = getCookieConsent();
  if (!consent) {
    showCookieBanner();
  } else {
    applyCookieConsent();
  }
}


