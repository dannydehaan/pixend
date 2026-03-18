import { heroContent } from "../../data/collectionOverviewData";

const HeroSection = () => (
  <section className="hero-gradient px-8 pt-12 pb-16">
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase">{heroContent.collectionLabel}</span>
            <span className="text-outline-variant text-xs">•</span>
            <span className="text-on-surface-variant text-xs font-mono">{heroContent.version}</span>
          </div>
          <h1 className="text-5xl font-headline font-black tracking-tighter text-on-surface">{heroContent.title}</h1>
          <p className="text-on-surface-variant text-lg leading-relaxed font-light">{heroContent.description}</p>
          <div className="flex items-center gap-6 pt-2">
            {heroContent.stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">{stat.icon}</span>
                <span className="text-sm text-on-surface/80">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {heroContent.actions.map((action) => (
            <button
              key={action.label}
              className={`flex items-center justify-center gap-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                action.variant === "primary"
                  ? "cta-gradient text-on-primary px-8 py-4 shadow-2xl shadow-primary/10 hover:brightness-110"
                  : "border border-outline-variant/30 text-on-surface font-semibold px-8 py-3 hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
