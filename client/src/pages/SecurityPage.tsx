import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import {
  Shield, ShieldCheck, Lock, Globe, Key, ArrowRight, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SecurityPage() {
  const { t } = useTranslation();

  const certifications = [
    {
      icon: Lock,
      title: t('security.ssl_title'),
      desc: t('security.ssl_desc'),
      color: 'text-green-400',
    },
    {
      icon: ShieldCheck,
      title: t('security.pci_title'),
      desc: t('security.pci_desc'),
      color: 'text-blue-400',
    },
    {
      icon: Shield,
      title: t('security.owasp_title'),
      desc: t('security.owasp_desc'),
      color: 'text-orange-400',
    },
    {
      icon: Globe,
      title: t('security.google_title'),
      desc: t('security.google_desc'),
      color: 'text-purple-400',
    },
    {
      icon: Key,
      title: t('security.gdpr_title'),
      desc: t('security.gdpr_desc'),
      color: 'text-indigo-400',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-20 border-b border-border/30">
        <div className="container">
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            {t('security.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            {t('security.subtitle')}
          </p>
        </div>
      </section>

      {/* Certifications Grid */}
      <section className="py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12">
            {certifications.map((cert) => {
              const Icon = cert.icon;
              return (
                <div
                  key={cert.title}
                  className="bg-card border border-border/50 rounded-xl p-8 hover:border-primary/50 transition"
                >
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-lg bg-background border border-border/50 flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-8 h-8 ${cert.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-3">{cert.title}</h3>
                      <p className="text-muted-foreground mb-4">{cert.desc}</p>
                      <div className="flex items-center gap-2 text-sm text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>Verified & Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Legal Links */}
      <section className="py-16 border-t border-border/30 bg-card/50">
        <div className="container">
          <h2 className="text-2xl font-bold mb-8">Legal & Compliance</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/privacy">
              <Button variant="outline" className="w-full justify-between">
                {t('security.privacy_link')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/terms">
              <Button variant="outline" className="w-full justify-between">
                {t('security.terms_link')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to scan your website?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Start with our free plan and experience enterprise-grade security scanning.
          </p>
          <Link href="/scan">
            <Button size="lg" className="cyber-glow">
              <Shield className="w-5 h-5 mr-2" />
              Scan My Website Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
