import { useState, useEffect, useCallback } from 'react'
import { Link, Globe, Users, Tag, ToggleLeft, ToggleRight, Plus, Trash2, Copy, Check } from 'lucide-react'

/* ─── Zero-Hallucination Prompt Builder ─── */
function buildSystemPrompt(templateId, userData) {
  const parts = [`SYSTEM ROLE: You are a factual extraction engine for e-commerce content.`]

  if (userData.sourceUrl) {
    parts.push(`PRIMARY DATA SOURCE: Use content derived from "${userData.sourceUrl}" as the only source of truth.`)
  }
  if (userData.sourceUrl2) {
    parts.push(`SECONDARY DATA SOURCE: Use content derived from "${userData.sourceUrl2}" as the second source of truth for comparison.`)
  }

  parts.push(`STRICT RULE: If a technical specification (weight, dimensions, material, color) is not present in the provided source(s), return exactly '[MISSING_DATA]' for that field. DO NOT hallucinate, guess, or fabricate any data point.`)

  if (userData.audience) {
    parts.push(`TARGET AUDIENCE: ${userData.audience}`)
  }
  if (userData.keywords) {
    parts.push(`KEYWORDS TO INCLUDE: ${userData.keywords}`)
  }

  parts.push(`TONE: Professional, persuasive, sales-oriented Czech language. Adjust style based on the selected template but maintain 100% factual integrity.`)

  parts.push(`OUTPUT LANGUAGE: Czech only.`)

  return parts.join('\n')
}

/* ─── Copy Button ─── */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* fallback */ }
  }
  return (
    <button onClick={handle} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all">
      {copied ? <><Check size={14} /> Zkopírováno</> : <><Copy size={14} /> Kopírovat</>}
    </button>
  )
}

/* ─── Result Display ─── */
function ResultBlock({ output, wordCount }) {
  const formatted = output
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="bg-black/40 rounded-lg p-4 overflow-x-auto text-sm text-green-300"><code>$2</code></pre>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')

  return (
    <div className="mt-6 rounded-xl border border-white/10 overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/10">
        <h3 className="font-semibold text-sm">✨ Vygenerovaný text</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{wordCount} slov</span>
          <CopyBtn text={output} />
        </div>
      </div>
      <div
        className="p-5 text-sm leading-relaxed text-yellow-300"
        style={{ background: '#1e3a5f' }}
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
      <div className="px-5 py-2 bg-red-900/20 border-t border-red-500/20 text-xs text-red-300 flex items-center gap-2">
        <span>⚠️</span> Text je vygenerovaný AI a může obsahovat nepřesnosti. Před publikací vždy zkontrolujte.
      </div>
    </div>
  )
}

/* ─── Main Form Component ─── */
export default function GeneratorForm({ template, onGenerate, loading, result, error, onReset }) {
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceUrl2, setSourceUrl2] = useState('')
  const [audience, setAudience] = useState('')
  const [keywords, setKeywords] = useState('')
  const [pros, setPros] = useState('')
  const [cons, setCons] = useState('')
  const [deepMode, setDeepMode] = useState(false)

  // Clear all inputs when template changes
  useEffect(() => {
    setSourceUrl('')
    setSourceUrl2('')
    setAudience('')
    setKeywords('')
    setPros('')
    setCons('')
    setDeepMode(false)
    onReset()
  }, [template?.id])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    const topic = sourceUrl || sourceUrl2 || 'produkt'

    const payload = {
      template: template?.id || 'product-desc',
      topic,
      audience,
      keywords
    }

    if (template?.id === 'review-comparison' && sourceUrl && sourceUrl2) {
      payload.topic = `Produkt 1: ${sourceUrl} | Produkt 2: ${sourceUrl2}`
    }

    if (template?.id === 'product-specs') {
      payload.topic = `${sourceUrl || 'produkt'} ${deepMode ? '[DEEP_EXTRACTION]' : ''}`
    }

    // Append pros/cons for review template
    if (template?.id === 'review-comparison' && (pros || cons)) {
      payload.keywords = `${keywords ? keywords + ', ' : ''}PROS:${pros || 'N/A'} CONS:${cons || 'N/A'}`
    }

    await onGenerate(payload)
  }, [template, sourceUrl, sourceUrl2, audience, keywords, pros, cons, deepMode, onGenerate])

  return (
    <div className="space-y-6">
      {/* Credit indicator */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20">
        <div className="flex items-center gap-2">
          <span className="text-lg">💎</span>
          <span className="text-sm font-medium text-gray-300">Cena: <span className="text-white font-bold">1 kredit</span> za generování</span>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold">SAMO UI</span>
      </div>

      {/* Prompt builder preview */}
      <div className="px-4 py-2 rounded-lg bg-black/20 border border-white/5 text-[11px] text-gray-500 font-mono leading-relaxed">
        <span className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">🧠 System Prompt Engine</span>
        <div className="mt-1 truncate">
          {buildSystemPrompt(template?.id, { sourceUrl, sourceUrl2, audience, keywords }).split('\n')[0]}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL input (always shown) */}
        {template?.id !== 'review-comparison' ? (
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
              <Globe size={14} className="text-primary" /> URL / odkaz na produkt
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              placeholder="https://eshop.cz/produkt/..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
            />
          </div>
        ) : (
          /* Comparison: Two URL inputs */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
                <Globe size={14} className="text-primary" /> URL produktu 1
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
                <Plus size={14} className="text-primary" /> URL produktu 2
              </label>
              <input
                type="url"
                value={sourceUrl2}
                onChange={e => setSourceUrl2(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
              />
            </div>
          </div>
        )}

        {/* Conditional: Reviews Pros/Cons */}
        {template?.id === 'review-comparison' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-green-400">
                <Plus size={14} /> Výhody (Pros)
              </label>
              <textarea
                value={pros}
                onChange={e => setPros(e.target.value)}
                rows={3}
                placeholder="cena, kvalita, výdrž..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all text-sm resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-red-400">
                <Trash2 size={14} /> Nevýhody (Cons)
              </label>
              <textarea
                value={cons}
                onChange={e => setCons(e.target.value)}
                rows={3}
                placeholder="hmotnost, cena, materiál..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all text-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* Conditional: Deep Extraction toggle for Specs */}
        {template?.id === 'product-specs' && (
          <button
            type="button"
            onClick={() => setDeepMode(!deepMode)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm"
          >
            {deepMode
              ? <ToggleRight size={20} className="text-primary" />
              : <ToggleLeft size={20} className="text-gray-500" />
            }
            <span className={deepMode ? 'text-primary font-medium' : 'text-gray-400'}>Deep Extraction Mode</span>
            {deepMode && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">AKTIVNÍ</span>}
          </button>
        )}

        {/* Audience + Keywords (always shown except specs) */}
        {template?.id !== 'product-specs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
                <Users size={14} className="text-primary" /> Cílová skupina
              </label>
              <input
                type="text"
                value={audience}
                onChange={e => setAudience(e.target.value)}
                placeholder="např. muži 25-45 let"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
                <Tag size={14} className="text-primary" /> Klíčová slova
              </label>
              <input
                type="text"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="kvalitní, levné, dárek"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-300 active:translate-y-0 active:scale-[0.98] relative overflow-hidden group"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generuji...
            </span>
          ) : (
            `⚡ Vygenerovat — ${template?.title || 'text'}`
          )}
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-10 text-gray-400 animate-fade-in">
          <span className="w-8 h-8 border-[3px] border-white/10 border-t-primary rounded-full animate-spin" />
          <p className="text-sm">AI tvoří text...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
          {error}
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <ResultBlock output={result.output} wordCount={result.wordCount} />
      )}
    </div>
  )
}
