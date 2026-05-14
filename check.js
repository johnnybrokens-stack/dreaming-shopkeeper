Promise.all([
  fetch('http://localhost:3000/dashboard').then(r => r.text()),
  fetch('http://localhost:3000/pricing').then(r => r.text()),
  fetch('http://localhost:3000/api/content/free-sample', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: 'Testovací produkt' })
  }).then(r => r.json())
]).then(([dash, pricing, sample]) => {
  console.log('=== DASHBOARD ===');
  console.log('Has history:', dash.includes('Historie'));
  console.log('Has settings:', dash.includes('Nastavení'));
  console.log('Has shareTo:', dash.includes('shareTo'));
  console.log('Has Google:', dash.includes('google'));

  console.log('\n=== PRICING ===');
  console.log('Has Ceník:', pricing.includes('Ceník'));
  console.log('Has Profesionál:', pricing.includes('Profesionál'));

  console.log('\n=== FREE SAMPLE API ===');
  console.log('Status:', sample.output ? 'OK - returns content' : 'Error: ' + (sample.error || 'unknown'));
}).catch(e => console.error(e));
