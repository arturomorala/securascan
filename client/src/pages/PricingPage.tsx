import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Shield, ShieldCheck, Check, Zap, Building2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const plans = [
  {
    name: "Básico",
    price: "19",
    period: "por informe",
    description: "Para análisis puntuales y pequeños proyectos.",
    icon: Shield,
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/5",
    features: [
      "1 análisis completo",
      "Informe PDF descargable",
      "Detección de vulnerabilidades OWASP Top 10",
      "Explicación básica con IA",
      "Válido 30 días",
    ],
    cta: "Comprar análisis",
    popular: false,
  },
  {
    name: "Profesional",
    price: "49",
    period: "al mes",
    description: "Para desarrolladores y equipos de seguridad.",
    icon: Zap,
    color: "text-primary",
    borderColor: "border-primary/50",
    bgColor: "bg-primary/5",
    features: [
      "10 análisis al mes",
      "Informes PDF ilimitados",
      "Explicaciones técnicas con IA",
      "Historial de escaneos",
      "Alertas de vulnerabilidades críticas",
      "Soporte prioritario",
    ],
    cta: "Comenzar ahora",
    popular: true,
  },
  {
    name: "Empresarial",
    price: "199",
    period: "al mes",
    description: "Para empresas con múltiples proyectos web.",
    icon: Building2,
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/5",
    features: [
      "Análisis ilimitados",
      "Informes PDF con marca personalizada",
      "Explicaciones de nivel experto con IA",
      "Panel de administración multi-usuario",
      "API de integración",
      "SLA garantizado",
      "Soporte dedicado 24/7",
    ],
    cta: "Contactar ventas",
    popular: false,
  },
];

export default function PricingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-bold text-sm"><span className="gradient-text">Secura</span>Scan</span>
          </Link>
          <Link href="/"><a><Button variant="ghost" size="sm" className="text-xs text-muted-foreground"><ArrowLeft className="w-3.5 h-3.5 mr-1" />Inicio</Button></a></Link>
        </div>
      </nav>

      <div className="container py-16 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-black mb-4">Planes y precios</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Elige el plan que mejor se adapte a tus necesidades de seguridad web.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative border ${plan.borderColor} ${plan.bgColor} rounded-2xl p-6 ${plan.popular ? "ring-1 ring-primary/50" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">Más popular</span>
                </div>
              )}
              <div className="mb-5">
                <plan.icon className={`w-8 h-8 ${plan.color} mb-3`} />
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black">{plan.price}€</span>
                <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 ${plan.color} mt-0.5 flex-shrink-0`} />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
              {isAuthenticated ? (
                <Link href="/scan">
                  <Button className={`w-full ${plan.popular ? "cyber-glow" : ""}`} variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button className={`w-full ${plan.popular ? "cyber-glow" : ""}`} variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="mt-14 bg-card border border-border/50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">¿Necesitas un plan personalizado?</h2>
          <p className="text-muted-foreground mb-6">Para empresas con necesidades específicas, ofrecemos planes personalizados con soporte dedicado y características a medida.</p>
          <Button variant="outline" className="px-8">Contactar con ventas</Button>
        </div>
      </div>
    </div>
  );
}
