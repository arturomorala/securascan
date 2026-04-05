import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Shield, ShieldCheck, Check, Zap, Building2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useTranslation } from "react-i18next";

// Plans will be generated dynamically with translations

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // Generate plans dynamically with translations
  const plans = [
    {
      name: t('pricing.basic'),
      price: "19",
      period: t('pricing.per_month'),
      description: t('pricing.basic_desc'),
      icon: Shield,
      color: "text-blue-400",
      borderColor: "border-blue-500/30",
      bgColor: "bg-blue-500/5",
      features: [
        t('pricing.basic_feature_1'),
        t('pricing.basic_feature_2'),
        t('pricing.basic_feature_3'),
        t('pricing.basic_feature_4'),
        t('pricing.basic_feature_5'),
      ],
      cta: t('pricing.basic_cta'),
      popular: false,
    },
    {
      name: t('pricing.professional'),
      price: "49",
      period: t('pricing.per_month'),
      description: t('pricing.professional_desc'),
      icon: Zap,
      color: "text-primary",
      borderColor: "border-primary/50",
      bgColor: "bg-primary/5",
      features: [
        t('pricing.professional_feature_1'),
        t('pricing.professional_feature_2'),
        t('pricing.professional_feature_3'),
        t('pricing.professional_feature_4'),
        t('pricing.professional_feature_5'),
        t('pricing.professional_feature_6'),
      ],
      cta: t('pricing.professional_cta'),
      popular: true,
    },
    {
      name: t('pricing.enterprise'),
      price: "99",
      period: t('pricing.per_month'),
      description: t('pricing.enterprise_desc'),
      icon: Building2,
      color: "text-purple-400",
      borderColor: "border-purple-500/30",
      bgColor: "bg-purple-500/5",
      features: [
        t('pricing.enterprise_feature_1'),
        t('pricing.enterprise_feature_2'),
        t('pricing.enterprise_feature_3'),
        t('pricing.enterprise_feature_4'),
        t('pricing.enterprise_feature_5'),
        t('pricing.enterprise_feature_6'),
        t('pricing.enterprise_feature_7'),
      ],
      cta: t('pricing.enterprise_cta'),
      popular: false,
    },
  ];

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
            <Link href="/"><Button variant="ghost" size="sm" className="text-xs text-muted-foreground"><ArrowLeft className="w-3.5 h-3.5 mr-1" />{t('home.hero_title')}</Button></Link>
        </div>
      </nav>

      <div className="container py-16 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-black mb-4">{t('pricing.title')}</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t('pricing.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative border ${plan.borderColor} ${plan.bgColor} rounded-2xl p-6 ${plan.popular ? "ring-1 ring-primary/50" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">{t('pricing.most_popular')}</span>
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
          <h2 className="text-2xl font-bold mb-3">{t('pricing.custom_plan_title')}</h2>
          <p className="text-muted-foreground mb-6">{t('pricing.custom_plan_desc')}</p>
          <Button variant="outline" className="px-8">{t('pricing.contact_sales')}</Button>
        </div>
      </div>
    </div>
  );
}
