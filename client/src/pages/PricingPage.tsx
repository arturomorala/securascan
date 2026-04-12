import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ShieldCheck, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useTranslation } from "react-i18next";

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();

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
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              {t('home.hero_title')}
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container py-24">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/10 text-xs uppercase tracking-wider">
            {t('pricing.title')}
          </Badge>
          <h1 className="text-4xl font-black mb-4">{t('pricing.hero')}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{t('pricing.hero_desc')}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {[
            { name: t('pricing.free'), price: t('pricing.free_price'), period: t('pricing.free_period'), desc: t('pricing.free_desc'), features: [t('pricing.free_feature_1'), t('pricing.free_feature_2'), t('pricing.free_feature_3'), t('pricing.free_feature_4')], notFeatures: [t('pricing.free_feature_not_1'), t('pricing.free_feature_not_2'), t('pricing.free_feature_not_3')], popular: false, color: "border-border/50", cta: t('pricing.free_cta') },
            { name: t('pricing.one_time'), price: t('pricing.one_time_price'), period: t('pricing.one_time_period'), desc: t('pricing.one_time_desc'), features: [t('pricing.one_time_feature_1'), t('pricing.one_time_feature_2'), t('pricing.one_time_feature_3'), t('pricing.one_time_feature_4'), t('pricing.one_time_feature_5')], note: t('pricing.one_time_note'), popular: false, color: "border-border/50", cta: t('pricing.one_time_cta') },
            { name: t('pricing.pro'), price: t('pricing.pro_price'), period: t('pricing.pro_period'), desc: t('pricing.pro_desc'), features: [t('pricing.pro_feature_1'), t('pricing.pro_feature_2'), t('pricing.pro_feature_3'), t('pricing.pro_feature_4'), t('pricing.pro_feature_5'), t('pricing.pro_feature_6'), t('pricing.pro_feature_7')], note: t('pricing.pro_note'), popular: true, badge: t('pricing.pro_badge'), color: "border-primary/50", cta: t('pricing.pro_cta') },
            { name: t('pricing.business'), price: t('pricing.business_price'), period: t('pricing.business_period'), desc: t('pricing.business_desc'), features: [t('pricing.business_feature_1'), t('pricing.business_feature_2'), t('pricing.business_feature_3'), t('pricing.business_feature_4'), t('pricing.business_feature_5'), t('pricing.business_feature_6'), t('pricing.business_feature_7')], note: t('pricing.business_note'), popular: false, color: "border-border/50", cta: t('pricing.business_cta') },
          ].map(plan => (
            <div key={plan.name} className={`relative bg-card border-2 ${plan.color} rounded-2xl p-6 card-hover ${plan.popular ? 'cyber-glow' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-3">{plan.badge || t('pricing.most_popular')}</Badge>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-4">
                {plan.features.map((f, idx) => (
                  <li key={`${plan.name}-${idx}`} className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {plan.notFeatures && (
                <ul className="space-y-2 mb-4">
                  {plan.notFeatures.map((f, idx) => (
                    <li key={`${plan.name}-not-${idx}`} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-4 h-4 flex-shrink-0">❌</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
              {plan.note && (
                <p className="text-xs text-muted-foreground mb-4 italic">{plan.note}</p>
              )}
              {isAuthenticated ? (
                <Link href="/scan">
                  <Button className={`w-full ${plan.popular ? 'cyber-glow' : ''}`} variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button className={`w-full ${plan.popular ? 'cyber-glow' : ''}`} variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
