import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  Shield, ShieldCheck, Zap, FileText, Brain, Lock, AlertTriangle,
  ChevronRight, CheckCircle, Globe, Server, Code, Eye, Key,
  ArrowRight, Star, Users, BarChart3, Clock, Download, Menu, X
} from "lucide-react";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

// NAV_LINKS will be generated dynamically in component using translations

// VULN_TYPES will be generated dynamically in component using translations

// STEPS will be generated dynamically in component using translations

// TESTIMONIALS will be generated dynamically in component using translations

// FAQS will be generated dynamically in component using translations

// STATS will be generated dynamically in component using translations

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  // Generate dynamic arrays based on language
  const NAV_LINKS = [
    { label: t('home.how_it_works'), href: "#how-it-works" },
    { label: t('home.vulnerabilities_title'), href: "#vulnerabilities" },
    { label: t('home.pricing_title'), href: "/pricing" },
    { label: t('home.faq_title'), href: "#faq" },
  ];

  const STEPS = [
    { num: "01", title: t('home.step1_title'), desc: t('home.step1_desc'), icon: Globe },
    { num: "02", title: t('home.step2_title'), desc: t('home.step2_desc'), icon: Zap },
    { num: "03", title: t('home.step3_title'), desc: t('home.step3_desc'), icon: Brain },
    { num: "04", title: t('home.step4_title'), desc: t('home.step4_desc'), icon: FileText },
  ];

  const VULN_TYPES = [
    { icon: Code, label: "SQL Injection", severity: "critical", desc: t('home.vulnerabilities_desc') },
    { icon: Globe, label: "XSS", severity: "high", desc: t('home.vulnerabilities_desc') },
    { icon: Server, label: t('home.vulnerabilities_title'), severity: "medium", desc: t('home.vulnerabilities_desc') },
    { icon: Eye, label: "CORS", severity: "high", desc: t('home.vulnerabilities_desc') },
    { icon: Lock, label: t('home.vulnerabilities_title'), severity: "medium", desc: t('home.vulnerabilities_desc') },
    { icon: Key, label: "CSRF", severity: "high", desc: t('home.vulnerabilities_desc') },
    { icon: AlertTriangle, label: t('home.vulnerabilities_title'), severity: "critical", desc: t('home.vulnerabilities_desc') },
    { icon: Shield, label: "HTTPS", severity: "high", desc: t('home.vulnerabilities_desc') },
    { icon: FileText, label: "CSP", severity: "medium", desc: t('home.vulnerabilities_desc') },
    { icon: Server, label: "CMS", severity: "high", desc: t('home.vulnerabilities_desc') },
    { icon: Eye, label: "Clickjacking", severity: "medium", desc: t('home.vulnerabilities_desc') },
    { icon: Code, label: t('home.vulnerabilities_title'), severity: "low", desc: t('home.vulnerabilities_desc') },
  ];

  const STATS = [
    { value: "50+", label: t('home.stats_vectors') },
    { value: "99.9%", label: t('home.stats_uptime') },
    { value: "< 5min", label: t('home.stats_time') },
    { value: "OWASP", label: t('home.stats_standard') },
  ];

  const handleCTA = () => {
    if (isAuthenticated) {
      window.location.href = "/scan";
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center cyber-glow">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                <span className="gradient-text">Secura</span>
                <span className="text-foreground">Scan</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(link => (
                <a key={link.label} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher />
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
        {t('home.dashboard_button')}
                    </Button>
                  </Link>
                  <Link href="/scan">
                    <Button size="sm" className="cyber-glow">
        {t('home.new_scan_button')}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <a href={getLoginUrl()}>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
{t('home.login_button')}
                    </Button>
                  </a>
                  <Button size="sm" onClick={handleCTA} className="cyber-glow">
{t('home.start_free_button')}
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden text-muted-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
            <div className="container py-4 flex flex-col gap-3">
              {NAV_LINKS.map(link => (
                <a key={link.label} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                  onClick={() => setMobileMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
              <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
                {isAuthenticated ? (
                  <Link href="/dashboard"><a className="w-full"><Button className="w-full">Panel de control</Button></a></Link>
                ) : (
                  <>
                    <a href={getLoginUrl()}><Button variant="outline" className="w-full">Iniciar sesión</Button></a>
                    <Button className="w-full" onClick={handleCTA}>Comenzar gratis</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden grid-bg">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 border-primary/40 text-primary bg-primary/10 px-4 py-1.5 text-xs font-medium tracking-wider uppercase">
              <Zap className="w-3 h-3 mr-1.5" />
              {t('home.badge_text')}
            </Badge>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
              {t('home.hero_title')}
              <br />
              <span className="gradient-text">{t('home.hero_subtitle')}</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('home.hero_description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" onClick={handleCTA} className="cyber-glow text-base px-8 h-12 font-semibold">
                <Shield className="w-5 h-5 mr-2" />
{t('home.scan_free_button')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="text-base px-8 h-12 border-border/60 hover:border-primary/50">
{t('home.see_plans_button')}
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
              {[t('home.no_credit_card'), t('home.analysis_time'), t('home.free_report'), t('home.owasp_standard')].map(item => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map(stat => (
              <div key={stat.label} className="bg-card border border-border/50 rounded-xl p-5 text-center card-hover">
                <div className="text-3xl font-black gradient-text mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 border-t border-border/30">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/10 text-xs uppercase tracking-wider">
              Proceso
            </Badge>
            <h2 className="text-4xl font-black mb-4">{t('home.how_it_works')} SecuraScan</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t('home.how_it_works')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-primary/30 to-transparent z-10" />
                )}
                <div className="bg-card border border-border/50 rounded-2xl p-6 card-hover h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center cyber-glow">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-3xl font-black text-primary/20">{step.num}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vulnerability types */}
      <section id="vulnerabilities" className="py-24 border-t border-border/30 bg-card/20">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-red-500/30 text-red-400 bg-red-500/10 text-xs uppercase tracking-wider">
              Detección
            </Badge>
            <h2 className="text-4xl font-black mb-4">{t('home.vulnerabilities_title')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t('home.vulnerabilities_desc')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {VULN_TYPES.map(vuln => (
              <div key={vuln.label} className="bg-card border border-border/50 rounded-xl p-4 card-hover flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  vuln.severity === 'critical' ? 'bg-red-500/15 border border-red-500/30' :
                  vuln.severity === 'high' ? 'bg-orange-500/15 border border-orange-500/30' :
                  vuln.severity === 'medium' ? 'bg-yellow-500/15 border border-yellow-500/30' :
                  'bg-blue-500/15 border border-blue-500/30'
                }`}>
                  <vuln.icon className={`w-4 h-4 ${
                    vuln.severity === 'critical' ? 'text-red-400' :
                    vuln.severity === 'high' ? 'text-orange-400' :
                    vuln.severity === 'medium' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{vuln.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      vuln.severity === 'critical' ? 'severity-critical' :
                      vuln.severity === 'high' ? 'severity-high' :
                      vuln.severity === 'medium' ? 'severity-medium' :
                      'severity-low'
                    }`}>{vuln.severity}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{vuln.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-24 border-t border-border/30">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/10 text-xs uppercase tracking-wider">
              Precios
            </Badge>
            <h2 className="text-4xl font-black mb-4">Planes simples y transparentes</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Sin costes ocultos. Cancela cuando quieras.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Básico", price: "19", period: "mes", scans: "5 escaneos/mes", features: ["Informe PDF completo", "Análisis con IA", "50+ vulnerabilidades", "Soporte por email"], popular: false, color: "border-border/50" },
              { name: "Profesional", price: "49", period: "mes", scans: "25 escaneos/mes", features: ["Todo lo del Básico", "Historial ilimitado", "API de integración", "Soporte prioritario", "Escaneos programados"], popular: true, color: "border-primary/50" },
              { name: "Empresarial", price: "99", period: "mes", scans: "Escaneos ilimitados", features: ["Todo lo del Profesional", "Multi-dominio", "SLA garantizado", "Onboarding dedicado", "Informes personalizados"], popular: false, color: "border-border/50" },
            ].map(plan => (
              <div key={plan.name} className={`relative bg-card border-2 ${plan.color} rounded-2xl p-6 card-hover ${plan.popular ? 'cyber-glow' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-3">Más popular</Badge>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{plan.price}€</span>
                    <span className="text-muted-foreground text-sm">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{plan.scans}</p>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/pricing">
                  <Button className={`w-full ${plan.popular ? 'cyber-glow' : ''}`} variant={plan.popular ? "default" : "outline"}>
                    Empezar ahora
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 border-t border-border/30 bg-card/20">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/10 text-xs uppercase tracking-wider">
              Testimonios
            </Badge>
            <h2 className="text-4xl font-black mb-4">Lo que dicen nuestros clientes</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Carlos Martínez", role: t('home.testimonials_title'), text: t('home.testimonials_title'), rating: 5 },
              { name: "Laura Sánchez", role: t('home.testimonials_title'), text: t('home.testimonials_title'), rating: 5 },
              { name: "Miguel Torres", role: t('home.testimonials_title'), text: t('home.testimonials_title'), rating: 5 },
            ].map(testimonial => (
              <div key={testimonial.name} className="bg-card border border-border/50 rounded-2xl p-6 card-hover">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{testimonial.name[0]}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 border-t border-border/30">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/10 text-xs uppercase tracking-wider">
              FAQ
            </Badge>
            <h2 className="text-4xl font-black mb-4">{t('home.faq_title')}</h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {[
              { q: t('home.faq_q1'), a: t('home.faq_a1') },
              { q: t('home.faq_q2'), a: t('home.faq_a2') },
              { q: t('home.faq_q3'), a: t('home.faq_a3') },
              { q: t('home.faq_q4'), a: t('home.faq_a4') },
            ].map(faq => (
              <details key={faq.q} className="group bg-card border border-border/50 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-muted/30 transition-colors">
                  <span className="font-semibold text-sm">{faq.q}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90 flex-shrink-0 ml-3" />
                </summary>
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-border/30 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/8 rounded-full blur-3xl" />
        <div className="container relative text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            ¿Tu sitio web es seguro?
            <br />
            <span className="gradient-text">Descúbrelo ahora</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-10 text-lg">
            Únete a cientos de empresas que ya protegen sus activos digitales con SecuraScan.
          </p>
          <Button size="lg" onClick={handleCTA} className="cyber-glow text-base px-10 h-12 font-semibold">
            <Shield className="w-5 h-5 mr-2" />
            Escanear mi web gratis
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12 bg-card/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="font-bold"><span className="gradient-text">Secura</span>Scan</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Plataforma profesional de pentesting automatizado. Protege tu presencia digital con tecnología de seguridad de última generación.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Producto</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">Cómo funciona</a></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Precios</Link></li>
                <li><a href="#vulnerabilities" className="hover:text-foreground transition-colors">Vulnerabilidades</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Cuenta</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href={getLoginUrl()} className="hover:text-foreground transition-colors">Iniciar sesión</a></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Panel de control</Link></li>
                <li><Link href="/scan" className="hover:text-foreground transition-colors">Nuevo escaneo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Términos de uso</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Política de privacidad</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/30 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2025 SecuraScan. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-green-400" />OWASP Compliant</span>
              <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-primary" />RGPD Compliant</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-blue-400" />SSL Secured</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
