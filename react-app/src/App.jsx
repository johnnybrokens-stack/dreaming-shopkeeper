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
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-lg font-extrabold">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-sm shadow-lg shadow-primary/30">🏪</span>
            Dreaming<span className="text-primary">Shopkeeper</span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Přihlásit se</a>
            <a href="/register" className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/30">Začít zdarma</a>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-extrabold">
            🤖 AI <span className="gradient-text">Generátor textů</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Vyplňte údaje a AI během pár sekund vytvoří profesionální e-commerce text na míru vaší šabloně.
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
          className="rounded-2xl border border-white/10 p-6 md:p-8 transition-all duration-500"
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
