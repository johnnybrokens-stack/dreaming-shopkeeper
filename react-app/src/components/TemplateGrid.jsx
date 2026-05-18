export default function TemplateGrid({ templates, active, onSelect }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 animate-fade-in">
      {templates.map(t => {
        const isActive = t.id === active
        const Icon = t.icon

        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`
              relative flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 md:p-4 rounded-xl border-2 text-center
              transition-all duration-300 cursor-pointer group
              ${isActive
                ? 'border-[#22c55e] scale-[1.04] sm:scale-[1.07] bg-white/10 shadow-lg shadow-green-500/25 ring-2 ring-green-500/20'
                : 'border-white/5 opacity-60 grayscale hover:opacity-90 hover:grayscale-[0.3] hover:border-white/20 hover:-translate-y-1 hover:shadow-lg'
              }
            `}
          >
            {isActive && (
              <span className="absolute -top-2 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-[#22c55e] text-white shadow animate-pulse">
                Aktivní
              </span>
            )}

            <div
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{ background: isActive ? `${t.themeColor}30` : 'rgba(255,255,255,0.05)' }}
            >
              <Icon size={16} color={isActive ? t.themeColor : '#94a3b8'} />
            </div>

            <h3 className="text-[11px] sm:text-xs md:text-sm font-semibold leading-tight">{t.title}</h3>
            <p className="hidden sm:block text-[11px] text-gray-500 leading-tight line-clamp-2">{t.description}</p>
          </button>
        )
      })}
    </div>
  )
}
