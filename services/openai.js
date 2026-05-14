const OpenAI = require('openai');
const { Groq } = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const providers = {};

if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-key-here') {
  providers.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'gsk_your-groq-key-here') {
  providers.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-key-here') {
  providers.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const TEMPLATES = {
  'popis-produktu': {
    name: 'Popis produktu',
    description: 'Profesionální popis produktu zaměřený na výhody, vlastnosti a CTA',
    category: 'E-shop',
    icon: '🛍️',
    prompt: (topic, audience, keywords) => {
      let p = `Napiš profesionální a přesvědčivý popis produktu pro e-shop.\nTéma / produkt: "${topic}"`;
      if (audience) p += `\nCílová skupina: ${audience}`;
      if (keywords) p += `\nKlíčová slova k zahrnutí: ${keywords}`;
      p += `\nPožadavky:\n- Piš VŽDY česky, profesionálním a přirozeným tónem\n- Použij přesvědčivý a prodejní styl\n- Struktura:\n  1. Chytlavý úvod (1-2 věty)\n  2. Hlavní přínosy pro zákazníka (4-6 bodů)\n  3. Technické vlastnosti / specifikace\n  4. Důvod, proč si produkt vybrat\n  5. Silná výzva k akci (CTA)\n- Použij formátování Markdown\n- Celková délka: 200-400 slov`;
      return p;
    }
  },
  'poutavy-titulek': {
    name: 'Poutavý titulek (H1)',
    description: 'Vygeneruje 5 vysoce konverzních nadpisů pro produkt nebo kategorii',
    category: 'E-shop',
    icon: '📌',
    prompt: (topic, audience, keywords) => {
      let p = `Vygeneruj 5 poutavých a vysoce konverzních titulků (H1) pro e-shop.\nTéma / produkt: "${topic}"`;
      if (audience) p += `\nCílová skupina: ${audience}`;
      if (keywords) p += `\nKlíčová slova k zahrnutí: ${keywords}`;
      p += `\nPožadavky:\n- Piš VŽDY česky\n- Každý titulek max. 60 znaků\n- Zaměř se na prodejní psychologické principy:\n  1. Titulek s důrazem na přínos\n  2. Titulek s naléhavostí\n  3. Titulek s konkrétním číslem/faktem\n  4. Titulek s řešením problému\n  5. Titulek s emocí/zvědavostí\n- Ke každému titulku přidej krátké vysvětlení, proč funguje\n- Použij formátování Markdown`;
      return p;
    }
  },
  'seo-meta': {
    name: 'Meta popisky pro SEO',
    description: 'SEO meta titulky a popisky optimalizované pro Google',
    category: 'SEO',
    icon: '🔍',
    prompt: (topic, audience, keywords) => {
      let p = `Vytvoř SEO optimalizované meta titulky a popisky pro e-shop.\nTéma / produkt / stránka: "${topic}"`;
      if (audience) p += `\nCílová skupina: ${audience}`;
      if (keywords) p += `\nKlíčová slova k zahrnutí: ${keywords}`;
      p += `\nPožadavky:\n- Piš VŽDY česky\n- Vygeneruj 3 varianty pro každou položku:\n  1. Meta titulek (50-60 znaků včetně mezer)\n  2. Meta popisek (150-160 znaků včetně mezer)\n  3. URL adresa (čistá, SEO-friendly)\n  4. Open Graph titulek\n  5. Open Graph popisek\n- Klíčová slova přirozeně zahrň do textu\n- Zaměř se na CTR optimalizaci\n- Použij formátování Markdown`;
      return p;
    }
  },
  'opusteny-kosik': {
    name: 'E-mail o opuštěném košíku',
    description: 'Přesvědčivý e-mail pro znovuzískání zákazníků s opuštěným košíkem',
    category: 'E-mail',
    icon: '📧',
    prompt: (topic, audience, keywords) => {
      let p = `Napiš profesionální a přesvědčivý e-mail o opuštěném košíku pro e-shop.\nTéma / produkty v košíku: "${topic}"`;
      if (audience) p += `\nCílová skupina: ${audience}`;
      if (keywords) p += `\nKlíčová slova k zahrnutí: ${keywords}`;
      p += `\nPožadavky:\n- Piš VŽDY česky, profesionálním a přátelským tónem\n- Použij přesvědčivý a prodejní styl\n- Struktura:\n  1. 3 varianty předmětu e-mailu (s vysokou mírou otevření)\n  2. Osobní oslovení\n  3. Připomenutí produktů v košíku\n  4. Důvod, proč nakoupit právě teď (výhody, omezená nabídka)\n  5. Odstranění obav (doprava zdarma, garance vrácení, recenze)\n  6. Silná výzva k akci (CTA) s odkazem na košík\n  7. Přátelský závěr\n- Délka: 150-250 slov\n- Použij formátování Markdown`;
      return p;
    }
  }
};

const SYSTEM_PROMPT = `Jsi Dreaming Shopkeeper - profesionální AI copywriter specializující se na e-commerce.

ZÁKLADNÍ PRAVIDLA:
1. Píšeš VŽDY česky, profesionálním, přirozeným a přesvědčivým stylem.
2. Tvůj tón je prodejní, orientovaný na zákazníka.
3. Nikdy nepiš v jiném jazyce než čeština.

ETICKÁ PRAVIDLA (Truth in Advertising):
- Nikdy nevytvářej lživá nebo klamavá tvrzení.
- Nepoužívej falešné statistiky, recenze nebo záruky.
- Nevymýšlej výsledky nebo studie.
- Respektuj zásady férové reklamy a české zákony.

BEZPEČNOST:
- Odmítni generovat obsah pro nezákonné nebo podvodné produkty.`;

async function callOpenAI(userPrompt, maxTokens) {
  if (!providers.openai) throw new Error('OpenAI not configured');
  const res = await providers.openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userPrompt }],
    temperature: 0.7, max_tokens: maxTokens || 2500
  });
  return res.choices[0].message.content;
}

async function callGroq(userPrompt, maxTokens) {
  if (!providers.groq) throw new Error('Groq not configured');
  const res = await providers.groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userPrompt }],
    temperature: 0.7, max_tokens: maxTokens || 4096
  });
  return res.choices[0].message.content;
}

async function callGemini(userPrompt, maxTokens) {
  if (!providers.gemini) throw new Error('Gemini not configured');
  const model = providers.gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(SYSTEM_PROMPT + '\n\n' + userPrompt);
  return result.response.text();
}

async function generateWithFallback(userPrompt, maxTokens) {
  const order = (process.env.AI_PROVIDER || 'auto').split(',');

  if (order[0] === 'auto') {
    const chain = [
      { name: 'openai', fn: () => callOpenAI(userPrompt, maxTokens) },
      { name: 'groq', fn: () => callGroq(userPrompt, maxTokens) },
      { name: 'gemini', fn: () => callGemini(userPrompt, maxTokens) }
    ];

    for (const provider of chain) {
      try {
        const result = await provider.fn();
        console.log(`✅ AI odpověď přes: ${provider.name.toUpperCase()}`);
        return result;
      } catch (err) {
        console.log(`⚠️  ${provider.name.toUpperCase()} selhalo (${err.message}), zkouším další...`);
      }
    }

    throw new Error('Všechny AI providery selhaly. Přidejte alespoň jeden API klíč (.env).');
  }

  const providers_map = {
    openai: () => callOpenAI(userPrompt, maxTokens),
    groq: () => callGroq(userPrompt, maxTokens),
    gemini: () => callGemini(userPrompt, maxTokens)
  };

  const chosen = order[0] && providers_map[order[0]];
  if (!chosen) throw new Error(`Neznámý provider: ${order[0]}`);
  return chosen();
}

async function generateContent(template, topic, audience, keywords, tier = 'free') {
  const tpl = TEMPLATES[template];
  if (!tpl) throw new Error('Neplatná šablona');

  const userPrompt = tpl.prompt(topic, audience, keywords);
  const maxTokens = tier === 'enterprise' ? 4000 : 2500;

  return generateWithFallback(userPrompt, maxTokens);
}

async function generateSample(topic) {
  const prompt = `Napiš krátký popis produktu: "${topic}". Piš česky. Max 150 slov. Dodržuj etická pravidla reklamy.`;
  return generateWithFallback(prompt, 500);
}

function getTemplates(tier) {
  const limits = require('../middleware/auth').TIER_LIMITS;
  const tierLimits = limits[tier];
  if (tierLimits.templates.includes('all')) return TEMPLATES;
  const filtered = {};
  tierLimits.templates.forEach(t => { if (TEMPLATES[t]) filtered[t] = TEMPLATES[t]; });
  return filtered;
}

module.exports = { generateContent, generateSample, getTemplates, TEMPLATES };
