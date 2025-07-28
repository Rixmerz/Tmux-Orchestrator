export default function HeroSection() {
  return (
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
      {/* Background ambient effects */}
      <div class="absolute inset-0">
        <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-[#A259FF]/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div class="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#00C2FF]/10 rounded-full blur-3xl animate-pulse-glow" style="animation-delay: 1s;"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#FF6F5E]/10 rounded-full blur-3xl animate-pulse-glow" style="animation-delay: 2s;"></div>
      </div>

      {/* Main content */}
      <div class="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div class="animate-fade-in">
          {/* Professional accent with visual style */}
          <div class="mb-8">
            <span class="text-accent text-xs font-mono uppercase tracking-widest animate-toxic-glitch">
              × × × estampados personalizados × × ×
            </span>
          </div>

          {/* Main heading - EMO DARK STYLE */}
          <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold mb-12 leading-none font-mono">
            <span class="block glow-toxic text-primary mb-4 animate-pixel-in">
              POLERAS.
            </span>
            <span class="block glow-acid text-secondary mb-4 animate-pixel-in" style="animation-delay: 0.2s;">
              TAZAS.
            </span>
            <span class="block glow-blood text-accent animate-pixel-in" style="animation-delay: 0.4s;">
              DISEÑO.
            </span>
          </h1>

          {/* Subtitle - Professional with visual flair */}
          <div class="mb-16 max-w-2xl mx-auto">
            <p class="text-sm font-mono text-ash-white leading-loose tracking-wide">
              estampados.personalizados.de.calidad
              <br class="hidden md:block" />
              <span class="glow-toxic">poleras</span> // <span class="glow-acid">tazas</span> // <span class="glow-blood">tu.diseño</span>
            </p>
          </div>

          {/* CTA Buttons - INDIE EMO STYLE */}
          <div class="flex flex-col sm:flex-row gap-8 justify-center items-center">
            <button class="indie-button min-w-[180px] animate-emo-shake">
              &gt; POLERAS_
            </button>
            <button class="indie-button min-w-[180px] animate-emo-shake" style="animation-delay: 0.2s;">
              &gt; TAZAS_
            </button>
          </div>

          {/* Professional tagline */}
          <div class="mt-20">
            <p class="text-xs font-mono text-ash-white opacity-40 tracking-widest">
              &lt; calidad.profesional // diseños.únicos /&gt;
            </p>
          </div>
        </div>
      </div>

      {/* Subtle scroll indicator */}
      <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-[#E3DCD2]/40">
        <div class="animate-bounce">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </div>

      {/* Grain overlay for texture */}
      <div class="absolute inset-0 opacity-[0.02] bg-repeat" style="background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIHZpZXdCb3g9IjAgMCA0IDQiPjxwYXRoIGQ9Ik0xIDFoMXYxSDFWMXptMiAyaDF2MUgzVjN6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4xIi8+PC9zdmc+');"></div>
    </section>
  );
}