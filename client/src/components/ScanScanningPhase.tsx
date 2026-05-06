import { Shield, Loader2, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ScanScanningPhaseProps {
  url: string;
  progress: number;
  currentStep: string;
}

export function ScanScanningPhase({ url, progress, currentStep }: ScanScanningPhaseProps) {
  const { t } = useTranslation();

  const SCAN_STEPS = [
    { label: t('scan.analyzing_headers'), icon: Shield },
    { label: t('scan.verifying_https'), icon: Shield },
    { label: t('scan.detecting_technologies'), icon: Shield },
    { label: t('scan.analyzing_cookies'), icon: Shield },
    { label: t('scan.verifying_csp'), icon: Shield },
    { label: t('scan.checking_cors'), icon: Shield },
    { label: t('scan.finding_exposed_files'), icon: Shield },
    { label: t('scan.analyzing_forms'), icon: Shield },
    { label: t('scan.evaluating_server'), icon: Shield },
    { label: t('scan.generating_results'), icon: Shield },
  ];

  return (
    <div>
      <div className="text-center mb-8">
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center cyber-glow">
            <Shield className="w-9 h-9 text-primary animate-pulse" />
          </div>
        </div>
        <h1 className="text-2xl font-black mb-2">{t('scan.analyzing_headers')}</h1>
        <p className="text-muted-foreground text-sm">{url}</p>
      </div>
      <div className="bg-card border border-border/50 rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">{t('common.loading')}</span>
          <span className="text-sm font-bold text-primary">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
          <div className="h-full progress-shimmer rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin text-primary" />
          {currentStep || "Iniciando análisis..."}
        </p>
      </div>
      <div className="bg-card border border-border/50 rounded-2xl p-4">
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">{t('scan.generating_results')}</p>
        <div className="space-y-2">
          {SCAN_STEPS.map((step, i) => {
            const stepProgress = (i + 1) * 10;
            const isDone = progress >= stepProgress;
            const isActive = progress >= stepProgress - 10 && !isDone;
            return (
              <div key={i} className={`flex items-center gap-3 text-xs transition-colors ${isDone ? "text-green-400" : isActive ? "text-primary" : "text-muted-foreground/40"}`}>
                {isDone ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> :
                  isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> :
                  <div className="w-3.5 h-3.5 rounded-full border border-current flex-shrink-0" />}
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
