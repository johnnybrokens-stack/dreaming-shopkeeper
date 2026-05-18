import { useState, useCallback } from 'react'
import TemplateGrid from './components/TemplateGrid'
import GeneratorForm from './components/GeneratorForm'
import { templates, defaultTemplate } from './data/templates'

export default function App() {
  const [activeTemplate, setActiveTemplate] = useState(defaultTemplate)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const currentTemplate = templates.find(t => t.id === activeTemplate)
  const themeColor = currentTemplate?.themeColor || '#10b981'

  const handleGenerate = useCallback(async (formData) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/content/public-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: activeTemplate,
          ...formData
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generování selhalo')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [activeTemplate])

  const handleReset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="w-full mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-base sm:text-lg font-extrabold shrink-0">
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-xs sm:text-sm shadow-lg shadow-primary/30">🏪</span>
            <span className="hidden xs:inline">Dreaming</span><span className="text-primary hidden xs:inline">Shopkeeper</span>
            <span className="xs:hidden text-white">DS</span>
          </a>
          <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto">
            <a href="/" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap px-2 py-1">← Zpět</a>
            <a href="/login" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap px-2 py-1">Přihlásit se</a>
            <a href="/register" className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 transition-all shadow-lg shadow-purple-500/30 hover:-translate-y-0.5 whitespace-nowrap">Začít zdarma</a>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-7xl">
        {/* Header */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">
            🤖 <span className="gradient-text">SAMO UI</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto px-2">
            Vyplňte údaje a AI během pár sekund vytvoří profesionální e-commerce text na míru vaší šabloně. Každý text spotřebuje 1 kredit.
          </p>
        </div>

        {/* Template Grid */}
        <TemplateGrid
          templates={templates}
          active={activeTemplate}
          onSelect={id => { setActiveTemplate(id); handleReset() }}
        />

        {/* Generator Container with dynamic background */}
        <div
          className="rounded-2xl border border-white/10 p-4 sm:p-6 md:p-8 transition-all duration-500"
          style={{
            background: `linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(15,23,42,0.9) 100%)`,
            boxShadow: `0 0 40px ${themeColor}15, inset 0 0 80px ${themeColor}08`
          }}
        >
          <GeneratorForm
            template={currentTemplate}
            onGenerate={handleGenerate}
            loading={loading}
            result={result}
            error={error}
            onReset={handleReset}
          />
        </div>
      </main>
    </div>
  )
}
