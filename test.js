fetch('http://localhost:3000/api/content/free-sample', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic: 'Testovaci produkt' })
}).then(r => { console.log('Status:', r.status); return r.json(); })
  .then(d => console.log(JSON.stringify(d, null, 2)))
  .catch(e => console.error(e));
