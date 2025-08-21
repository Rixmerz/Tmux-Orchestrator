interface NavigationProps {
  currentPath?: string;
}

export default function Navigation({ currentPath }: NavigationProps) {
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/cms", label: "CMS" },
    { href: "/crm", label: "CRM" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <nav class="fixed top-0 left-0 right-0 z-50 bg-dark/80 backdrop-blur-md border-b border-[#E3DCD2]/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          {/* Logo */}
          <div class="flex-shrink-0">
            <a href="/" class="text-xl font-bold text-primary glow-purple">
              NAR.DESIGNS
            </a>
          </div>

          {/* Desktop Navigation */}
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  class={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:text-secondary hover:glow-blue ${
                    currentPath === item.href 
                      ? "text-secondary" 
                      : "text-[#E3DCD2] hover:text-[#00C2FF]"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div class="md:hidden">
            <button
              type="button"
              class="btn-ghost"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span class="sr-only">Open main menu</span>
              <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div class="md:hidden hidden" id="mobile-menu">
        <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-soft-gray">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              class={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                currentPath === item.href 
                  ? "text-secondary bg-[#A259FF]/10" 
                  : "text-[#E3DCD2] hover:text-secondary hover:bg-[#2C2C2E]"
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}