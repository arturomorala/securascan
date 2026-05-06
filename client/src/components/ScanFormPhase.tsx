import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Globe, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface ScanFormPhaseProps {
  url: string;
  setUrl: (url: string) => void;
  ownerConfirmation: boolean;
  setOwnerConfirmation: (value: boolean) => void;
  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export function ScanFormPhase({
  url,
  setUrl,
  ownerConfirmation,
  setOwnerConfirmation,
  termsAccepted,
  setTermsAccepted,
  onSubmit,
  isLoading,
}: ScanFormPhaseProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-5 cyber-glow">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-black mb-3">{t('scan.title')}</h1>
        <p className="text-muted-foreground">{t('scan.subtitle')}</p>
      </div>
      <div className="bg-card border border-border/50 rounded-2xl p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label htmlFor="url" className="text-sm font-medium mb-2 block">{t('scan.url_label')} *</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="url" type="url" placeholder={t('scan.url_placeholder')} value={url}
                onChange={e => setUrl(e.target.value)}
                className="pl-10 bg-muted/30 border-border/50 focus:border-primary/50" required />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{t('scan.url_placeholder')}</p>
          </div>
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3">
              <div className="p-1.5 border-2 border-white/40 rounded-md hover:border-white/60 transition-colors">
                <Checkbox id="owner" checked={ownerConfirmation} onCheckedChange={v => setOwnerConfirmation(!!v)} className="mt-0" />
              </div>
              <Label htmlFor="owner" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                {t('scan.owner_confirmation')}
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 border-2 border-white/40 rounded-md hover:border-white/60 transition-colors">
                <Checkbox id="terms" checked={termsAccepted} onCheckedChange={v => setTermsAccepted(!!v)} className="mt-0" />
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {t('scan.terms_accepted')} <a href="/terms" className="text-primary hover:underline cursor-pointer">{t('common.save')}</a> {t('common.cancel')} <a href="/privacy" className="text-primary hover:underline cursor-pointer">{t('common.close')}</a>.
              </div>
            </div>
          </div>
          <div className="bg-muted/20 border border-border/30 rounded-xl p-4 flex items-start gap-3">
            <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">{t('scan.scanning')}</p>
          </div>
          <Button type="submit" className="w-full cyber-glow h-11 font-semibold" disabled={isLoading}>
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.loading')}</> : <><Shield className="w-4 h-4 mr-2" />{t('scan.submit_button')}<ArrowRight className="w-4 h-4 ml-2" /></>}
          </Button>
        </form>
      </div>
    </div>
  );
}
