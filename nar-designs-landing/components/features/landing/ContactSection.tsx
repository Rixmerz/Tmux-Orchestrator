export default function ContactSection() {
  return (
    <section id="contact" class="py-24 bg-gradient-to-t from-[#0D0D0D] via-[#2C2C2E] to-[#0D0D0D] relative">
      {/* Background ambient effects */}
      <div class="absolute inset-0">
        <div class="absolute top-1/3 left-1/3 w-64 h-64 bg-[#A259FF]/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div class="absolute bottom-1/3 right-1/3 w-48 h-48 bg-[#FF6F5E]/10 rounded-full blur-3xl animate-pulse-glow" style="animation-delay: 1.5s;"></div>
      </div>

      <div class="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div class="text-center mb-16">
          <div class="mb-4">
            <span class="text-accent text-xs font-mono uppercase tracking-widest animate-toxic-glitch">
              × × × solicita.tu.diseño × × ×
            </span>
          </div>
          <h2 class="text-3xl md:text-4xl font-bold font-mono mb-8">
            <span class="glow-toxic text-primary">DISEÑA</span>
            <br />
            <span class="glow-acid text-secondary">TU.ESTILO</span>
            <br />
            <span class="glow-blood text-accent">ÚNICO</span>
          </h2>
          <div class="max-w-2xl mx-auto">
            <p class="text-xs font-mono text-ash-white opacity-70 leading-relaxed tracking-wide">
              tienes.una.idea.para.tu.diseño.personalizado
              <br />
              &lt; trabajamos.juntos.para.crear.algo.único /&gt;
            </p>
          </div>
        </div>

        {/* Contact form */}
        <div class="card max-w-2xl mx-auto">
          <form class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Nombre
                </label>
                <input 
                  type="text" 
                  class="input"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Email
                </label>
                <input 
                  type="email" 
                  class="input"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                Tipo de Producto
              </label>
              <select class="input">
                <option>Elige un producto</option>
                <option>Polera Negra Personalizada</option>
                <option>Polera Blanca Personalizada</option>
                <option>Taza Personalizada</option>
                <option>Combo Polera + Taza</option>
                <option>Diseño Personalizado</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                Cuéntanos tu idea
              </label>
              <textarea 
                rows="5" 
                class="input resize-none"
                placeholder="Describe tu diseño ideal, estilo preferido, tallas, cantidad, y cualquier detalle especial..."
              ></textarea>
            </div>

            <div class="text-center pt-4">
              <button type="submit" class="btn-primary glow-purple text-lg px-12 py-4">
                Enviar Solicitud
              </button>
            </div>
          </form>
        </div>

        {/* Alternative contact methods */}
        <div class="mt-16 text-center">
          <p class="text-sm font-mono text-[#E3DCD2]/60 mb-6">
            // O contáctanos directamente
          </p>
          <div class="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a href="mailto:info@nar-designs.com" class="flex items-center text-secondary hover:text-[#00A3D1] transition-colors duration-200">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
              info@nar-designs.com
            </a>
            
            <div class="hidden sm:block w-px h-6 bg-[#E3DCD2]/20"></div>
            
            <a href="tel:+56912345678" class="flex items-center text-accent hover:text-[#FF5A4A] transition-colors duration-200">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
              </svg>
              +56 9 1234 5678
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}