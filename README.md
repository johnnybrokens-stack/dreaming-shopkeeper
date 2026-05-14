# Dreaming Shopkeeper — E-Shop Copywriter AI

AI copywriter specializovaný na e-commerce. Profesionální texty pro váš e-shop během sekund.

## Funkce
- 4 specializované e-commerce šablony (popisy produktů, titulky, SEO meta, e-maily)
- Veškerý output v profesionální češtině
- Uživatelská autentizace s JWT
- Stripe předplatné (3 úrovně)
- Systém kreditů
- Historie generovaného obsahu

---

## Rychlý start

### 1. Instalace
```bash
npm install
```

### 2. Nastavení .env
Zkopírujte `.env.example` na `.env` a vyplňte:
- `OPENAI_API_KEY` — z https://platform.openai.com
- `JWT_SECRET` — libovolný silný řetězec
- `STRIPE_SECRET_KEY` — z Stripe dashboardu
- `STRIPE_PRICE_*` — ID produktů ze Stripe

### 3. Spuštění
```bash
npm start        # Produkce
npm run dev      # Vývoj (auto-reload)
```

Server běží na `http://localhost:3000`

---

## Šablony

| Šablona | Popis |
|---|---|
| 🛍️ Popis produktu | Profesionální popis zaměřený na výhody, vlastnosti a CTA |
| 📌 Poutavý titulek (H1) | 5 vysoce konverzních nadpisů pro produkt |
| 🔍 Meta popisky pro SEO | SEO titulky a popisky optimalizované pro Google |
| 📧 E-mail o opuštěném košíku | Přesvědčivý e-mail pro znovuzískání zákazníků |

---

## Ceník

| Funkce | Zdarma | Základní (490 Kč) | Profesionál (1 290 Kč) | Enterprise (3 990 Kč) |
|---|---|---|---|---|
| Kredity/měsíc | 5 | 100 | 500 | Neomezené |
| Max slov | 500 | 1 500 | 3 000 | 10 000 |
| Šablony | 1 | 3 | Všechny 4 | Vše + vlastní |

---

## API Endpointy

### Autentizace
- `POST /api/auth/register` — Registrace
- `POST /api/auth/login` — Přihlášení

### Obsah
- `GET /api/content/templates` — Seznam šablon
- `POST /api/content/generate` — Generování obsahu (1 kredit)
- `GET /api/content/history` — Historie
- `DELETE /api/content/history/:id` — Smazání

### Platby
- `GET /api/payment/pricing` — Ceník
- `POST /api/payment/checkout` — Vytvoření checkout session
- `POST /api/payment/portal` — Platební portál
- `POST /api/payment/webhook` — Stripe webhook

---

## Struktura projektu
```
config/db.js              — SQLite databáze
middleware/auth.js        — JWT auth + kontrola kreditů
routes/auth.js            — Autentizační routy
routes/content.js         — Generování obsahu
routes/payment.js         — Stripe platby
services/openai.js        — OpenAI API + šablony
services/stripe.js        — Stripe platební služba
public/index.html         — Hlavní stránka
public/dashboard.html     — Uživatelský panel
public/paywall.html       — Ceník/platby
public/css/style.css      — Styly
public/js/app.js          — Frontend JavaScript
server.js                 — Express server
```

---

## Licence
MIT
