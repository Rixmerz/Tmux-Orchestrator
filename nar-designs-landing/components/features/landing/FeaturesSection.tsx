export default function FeaturesSection() {
  const features = [
    {
      title: "POLERAS.NEGRAS",
      description: "diseños.con.contornos.sólidos // iconos.y.símbolos.definidos // mejor.resultado.tipo.parche",
      technical: "Recomendado: diseños con bordes gruesos, iconos simples, tipografías bold",
      icon: "×",
      accent: "toxic",
      delay: "0s"
    },
    {
      title: "POLERAS.BLANCAS", 
      description: "cualquier.tipo.de.diseño // máxima.versatilidad.visual // contrastes.perfectos",
      technical: "Acepta: fotografías, degradados, diseños complejos, cualquier estilo",
      icon: "◇",
      accent: "acid", 
      delay: "0.2s"
    },
    {
      title: "TAZAS.PERSONALIZADAS",
      description: "impresión.de.alta.calidad // resistente.al.uso.diario // diseños.duraderos",
      technical: "Material: cerámica premium, colores vibrantes, lavable en lavavajillas",
      icon: "◆",
      accent: "blood",
      delay: "0.4s"
    }
  ];

  return (
    <section class="py-32 bg-dark relative">
      {/* Dark Indie Background */}
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-20 left-20 w-40 h-40 border-2 border-toxic-purple rotate-45"></div>
        <div class="absolute bottom-20 right-20 w-32 h-32 border border-acid-green rotate-12"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-blood-red rotate-30"></div>
      </div>

      <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header - Professional with visual style */}
        <div class="text-center mb-24">
          <div class="mb-6">
            <span class="text-accent text-xs font-mono uppercase tracking-widest animate-toxic-glitch">
              × × × nuestros.productos.y.servicios × × ×
            </span>
          </div>
          <h2 class="text-3xl md:text-4xl font-bold font-mono mb-8">
            <span class="glow-toxic text-primary">ESTAMPADOS</span>
            <br />
            <span class="glow-blood text-accent">DE.CALIDAD</span>
            <br />
            <span class="glow-acid text-secondary">PROFESIONAL</span>
          </h2>
          <div class="max-w-xl mx-auto">
            <p class="text-xs font-mono text-ash-white leading-relaxed tracking-wide opacity-70">
              técnicas.avanzadas // materiales.premium
              <br />
              &lt; cada.diseño.personalizado.a.tu.gusto /&gt;
            </p>
          </div>
        </div>

        {/* Features grid - EMO INDIE CARDS */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              class="emo-card hover:transform hover:translate-x-1 hover:translate-y-1 animate-pixel-in group cursor-pointer"
              style={`animation-delay: ${feature.delay};`}
            >
              {/* Emo Icon */}
              <div class="mb-8 text-center">
                <div class={`inline-block text-4xl font-mono ${
                  feature.accent === 'toxic' ? 'glow-toxic text-primary' :
                  feature.accent === 'acid' ? 'glow-acid text-secondary' :
                  'glow-blood text-accent'
                }`}>
                  {feature.icon}
                </div>
              </div>

              {/* Title - EMO STYLE */}
              <h3 class={`text-lg font-bold font-mono mb-6 tracking-wide ${
                feature.accent === 'toxic' ? 'glow-toxic text-primary' :
                feature.accent === 'acid' ? 'glow-acid text-secondary' :
                'glow-blood text-accent'
              }`}>
                {feature.title}
              </h3>
              
              {/* Description - INDIE STYLE */}
              <p class="text-xs font-mono text-ash-white leading-relaxed opacity-80 mb-6 tracking-wide">
                {feature.description}
              </p>

              {/* Technical info */}
              <div class="mb-8 p-3 border border-ash-white border-opacity-20 bg-void-black">
                <p class="text-xs font-mono text-ash-white opacity-60 leading-relaxed">
                  {feature.technical}
                </p>
              </div>

              {/* Action link - TERMINAL STYLE */}
              <div class="text-center">
                <span class={`text-xs font-mono ${
                  feature.accent === 'toxic' ? 'text-primary' :
                  feature.accent === 'acid' ? 'text-secondary' :
                  'text-accent'
                } opacity-60 group-hover:opacity-100`}>
                  &gt; ver.detalles_
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom accent - Professional */}
        <div class="text-center mt-24">
          <div class="inline-block border-2 border-ash-white px-8 py-4 bg-void-black">
            <span class="text-xs font-mono text-ash-white opacity-50 tracking-widest">
              &lt; calidad.garantizada // envíos.a.todo.chile /&gt;
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}