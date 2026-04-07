import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  Shield, ShieldCheck, Zap, FileText, Brain, Lock, AlertTriangle,
  ChevronRight, CheckCircle, Globe, Server, Code, Eye, Key,
  ArrowRight, Star, Users, BarChart3, Clock, Download, Menu, X, Send
} from "lucide-react";
import { useState, useEffect } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { FooterLanguageSwitcher } from "@/components/FooterLanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, title: "", content: "" });
  const [testimonialsList, setTestimonialsList] = useState<any[]>([]);

  // Fetch testimonials
  const { data: testimonials } = trpc.testimonials.list.useQuery({ limit: 10 });
  const createReview = trpc.testimonials.create.useMutation();

  useEffect(() => {
    if (testimonials) {
      setTestimonialsList(testimonials);
    }
  }, [testimonials]);

  const handleSubmitReview = async () => {
    if (!reviewData.title || !reviewData.content) {
      alert(t('common.required_field') || "Este campo es requerido");
      return;
    }

    try {
      await createReview.mutateAsync({
        rating: reviewData.rating,
        title: reviewData.title,
        content: reviewData.content,
      });
      
      setReviewData({ rating: 5, title: "", content: "" });
      setShowReviewForm(false);
      
      // Refresh testimonials
      // Note: Testimonials will auto-refresh via useQuery
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

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
    { icon: Code, label: "SQL Injection", severity: "critical", desc: t('home.vuln_sql_injection') },
    { icon: Globe, label: "XSS", severity: "high", desc: t('home.vuln_xss') },
    { icon: Server, label: "CSRF", severity: "high", desc: t('home.vuln_csrf') },
    { icon: Eye, label: "CORS", severity: "high", desc: t('home.vuln_cors') },
    { icon: Lock, label: "HTTPS", severity: "high", desc: t('home.vuln_https') },
    { icon: Key, label: "Authentication", severity: "high", desc: t('home.vuln_auth') },
    { icon: AlertTriangle, label: "Security Headers", severity: "critical", desc: t('home.vuln_headers') },
    { icon: Shield, label: "SSL/TLS", severity: "high", desc: t('home.vuln_ssl') },
    { icon: FileText, label: "CSP", severity: "medium", desc: t('home.vuln_csp') },
    { icon: Server, label: "CMS Detection", severity: "medium", desc: t('home.vuln_cms') },
    { icon: Eye, label: "Clickjacking", severity: "medium", desc: t('home.vuln_clickjacking') },
    { icon: Code, label: "Information Disclosure", severity: "low", desc: t('home.vuln_disclosure') },
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

            {/* Right side */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="hidden md:block">
                    <Button variant="outline" size="sm">{t('home.dashboard_button')}</Button>
                  </Link>
                </>
              ) : (
                <>
                  <a href={getLoginUrl()} className="hidden md:block">
                    <Button variant="outline" size="sm">{t('home.login_button')}</Button>
                  </a>
                </>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border/50 py-4 space-y-3">
              {NAV_LINKS.map(link => (
                <a key={link.label} href={link.href} className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <Badge className="mb-4 border-primary/30 text-primary bg-primary/10 text-xs uppercase tracking-wider">
            {t('home.badge_text')}
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            {t('home.hero_title')}
            <br />
            <span className="gradient-text">{t('home.hero_subtitle')}</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('home.hero_description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button onClick={handleCTA} size="lg" className="gap-2">
              {t('home.scan_free_button')}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Link href="/pricing">
              <Button variant="outline" size="lg">
                {t('home.see_plans_button')}
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: CheckCircle, text: t('home.no_credit_card') },
              { icon: Clock, text: t('home.analysis_time') },
              { icon: Download, text: t('home.free_report') },
              { icon: Shield, text: t('home.owasp_standard') },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 border-t border-border/30">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/10 text-xs uppercase tracking-wider">
              {t('home.how_it_works')}
            </Badge>
            <h2 className="text-4xl font-black mb-4">{t('home.how_it_works')}</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="bg-card border border-border/50 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-6">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-4xl font-black text-primary/30 mb-3">{step.num}</div>
                  <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vulnerabilities */}
      <section id="vulnerabilities" className="py-24 border-t border-border/30 bg-card/20">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/10 text-xs uppercase tracking-wider">
              Detección
            </Badge>
            <h2 className="text-4xl font-black mb-4">{t('home.vulnerabilities_title')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t('home.vulnerabilities_desc')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {VULN_TYPES.map((vuln, idx) => (
              <div key={`vuln-${idx}`} className="bg-card border border-border/50 rounded-xl p-4 card-hover flex items-start gap-3">
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
              {t('pricing.title')}
            </Badge>
            <h2 className="text-4xl font-black mb-4">{t('home.pricing_simple_transparent')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t('home.pricing_no_hidden_costs')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: t('pricing.basic'), price: t('pricing.free'), features: [t('pricing.basic_feature_1'), t('pricing.basic_feature_2'), t('pricing.basic_feature_3')] },
              { name: t('pricing.professional'), price: "€9", features: [t('pricing.professional_feature_1'), t('pricing.professional_feature_2'), t('pricing.professional_feature_3')] },
              { name: t('pricing.enterprise'), price: t('pricing.contact_sales'), features: [t('pricing.enterprise_feature_1'), t('pricing.enterprise_feature_2'), t('pricing.enterprise_feature_3')] },
            ].map((plan, idx) => (
              <div key={idx} className={`rounded-2xl border ${idx === 1 ? 'border-primary/50 bg-primary/5' : 'border-border/50'} p-8`}>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-3xl font-black mb-6">{plan.price}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={idx === 1 ? "default" : "outline"}>
                  {t('pricing.choose_plan')}
                </Button>
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
              {t('home.testimonials_title')}
            </Badge>
            <h2 className="text-4xl font-black mb-4">{t('home.testimonials_title')}</h2>
            <p className="text-muted-foreground">Reseñas de usuarios reales de SecuraScan</p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {testimonialsList.length > 0 ? (
              testimonialsList.map((testimonial) => (
                <div key={testimonial.id} className="bg-card border border-border/50 rounded-2xl p-6 card-hover">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm font-semibold mb-2">{testimonial.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{testimonial.userName?.[0] || "U"}</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{testimonial.userName || "Usuario"}</div>
                      <div className="text-xs text-muted-foreground">Cliente verificado</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center text-muted-foreground py-8">
                Sé el primero en dejar una reseña
              </div>
            )}
          </div>

          {/* Review Form */}
          {isAuthenticated ? (
            <div className="max-w-2xl mx-auto">
              {!showReviewForm ? (
                <Button onClick={() => setShowReviewForm(true)} className="w-full" variant="outline">
                  Dejar una reseña
                </Button>
              ) : (
                <div className="bg-card border border-border/50 rounded-2xl p-8">
                  <h3 className="text-lg font-bold mb-6">Comparte tu experiencia</h3>
                  
                  <div className="space-y-4">
                    {/* Rating */}
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Calificación</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewData({ ...reviewData, rating: star })}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= reviewData.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Título de la reseña</label>
                      <Input
                        placeholder="Ej: Excelente herramienta de seguridad"
                        value={reviewData.title}
                        onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
                        maxLength={255}
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Tu reseña</label>
                      <Textarea
                        placeholder="Cuéntanos tu experiencia con SecuraScan..."
                        value={reviewData.content}
                        onChange={(e) => setReviewData({ ...reviewData, content: e.target.value })}
                        maxLength={1000}
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{reviewData.content.length}/1000</p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleSubmitReview}
                        disabled={createReview.isPending}
                        className="flex-1 gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {createReview.isPending ? "Enviando..." : "Enviar reseña"}
                      </Button>
                      <Button
                        onClick={() => setShowReviewForm(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto text-center py-8">
              <p className="text-muted-foreground mb-4">Inicia sesión para dejar una reseña</p>
              <a href={getLoginUrl()}>
                <Button>{t('home.login_button')}</Button>
              </a>
            </div>
          )}
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
      <section className="py-24 border-t border-border/30 bg-gradient-to-r from-primary/10 via-transparent to-primary/10">
        <div className="container text-center">
          <h2 className="text-4xl font-black mb-6">¿Listo para proteger tu sitio web?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Comienza tu primer análisis de seguridad hoy. Sin tarjeta de crédito requerida.
          </p>
          <Button onClick={handleCTA} size="lg" className="gap-2">
            {t('home.scan_free_button')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12 bg-card/30">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="font-bold">SecuraScan</span>
              </div>
              <p className="text-sm text-muted-foreground">Pentesting automatizado con IA para proteger tu presencia digital.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">Cómo funciona</a></li>
                <li><a href="#vulnerabilities" className="hover:text-foreground transition-colors">Vulnerabilidades</a></li>
                <li><a href="/pricing" className="hover:text-foreground transition-colors">Precios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Cuenta</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href={getLoginUrl()} className="hover:text-foreground transition-colors">Iniciar sesión</a></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Panel de control</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Términos de uso</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Política de privacidad</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-muted-foreground">© 2026 SecuraScan. Todos los derechos reservados.</p>
            <FooterLanguageSwitcher />
          </div>
        </div>
      </footer>
    </div>
  );
}
