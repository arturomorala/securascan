import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useParams, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Shield, ShieldCheck, AlertTriangle, CheckCircle, Loader2,
  Globe, Lock, ArrowRight, ArrowLeft, FileText, Zap, Eye, Server, Code
} from "lucide-react";

// SCAN_STEPS_DISPLAY will be generated dynamically with translations

function getRiskColor(risk: string | null | undefined) {
  switch (risk) {
    case "critical": return "text-red-400";
    case "high": return "text-orange-400";
    case "medium": return "text-yellow-400";
    case "low": return "text-blue-400";
    default: return "text-muted-foreground";
  }
}

function getRiskLabel(risk: string | null | undefined, t: any) {
  switch (risk) {
    case "critical": return t('scan.critical');
    case "high": return t('scan.high');
    case "medium": return t('scan.medium');
    case "low": return t('scan.low');
    default: return "N/A";
  }
}

function ScoreGauge({ score, t }: { score: number; t: any }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";
  const labels: { [key: string]: string } = {
    good: t('scan.score_good') || "Good",
    moderate: t('scan.score_moderate') || "Moderate",
    poor: t('scan.score_poor') || "Poor",
    critical: t('scan.score_critical') || "Critical"
  };
  const label = score >= 80 ? labels.good : score >= 60 ? labels.moderate : score >= 40 ? labels.poor : labels.critical;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${(score / 100) * 314} 314`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black" style={{ color }}>{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="text-sm font-semibold mt-1" style={{ color }}>{label}</span>
    </div>
  );
}

export default function ScanPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();

  // Generate SCAN_STEPS_DISPLAY dynamically with translations
  const SCAN_STEPS_DISPLAY = [
    { label: t('scan.analyzing_headers'), icon: Shield },
    { label: t('scan.verifying_https'), icon: Lock },
    { label: t('scan.detecting_technologies'), icon: Code },
    { label: t('scan.analyzing_cookies'), icon: Eye },
    { label: t('scan.verifying_csp'), icon: ShieldCheck },
    { label: t('scan.checking_cors'), icon: Globe },
    { label: t('scan.finding_exposed_files'), icon: AlertTriangle },
    { label: t('scan.analyzing_forms'), icon: Server },
    { label: t('scan.evaluating_server'), icon: Zap },
    { label: t('scan.generating_results'), icon: FileText },
  ];

  const [url, setUrl] = useState("");
  const [ownerConfirmation, setOwnerConfirmation] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [scanId, setScanId] = useState<number | null>(params.id ? parseInt(params.id) : null);
  const [phase, setPhase] = useState<"form" | "scanning" | "result">(params.id ? "scanning" : "form");
  const [shouldPoll, setShouldPoll] = useState(!!params.id);
  const resultFetchedRef = useRef(false);

  const createScan = trpc.scans.create.useMutation({
    onSuccess: (data) => {
      setScanId(data.id);
      setPhase("scanning");
      setShouldPoll(true);
      resultFetchedRef.current = false;
      navigate(`/scan/${data.id}`, { replace: true });
    },
    onError: (err) => toast.error(err.message || "Error al iniciar el escaneo"),
  });

  const { data: scanSummary } = trpc.scans.getPublicSummary.useQuery(
    { scanId: scanId! },
    { enabled: !!scanId && shouldPoll }
  );

  const utils = trpc.useUtils();

  // Control polling and phase transitions separately
  useEffect(() => {
    if (!scanSummary) return;
    
    const isComplete = scanSummary.status === "completed" || scanSummary.status === "failed";
    
    if (isComplete && shouldPoll) {
      // Stop polling when scan completes
      setShouldPoll(false);
      setPhase("result");
      
      // Only fetch isPaid status once after completion
      if (!resultFetchedRef.current) {
        resultFetchedRef.current = true;
        // Use refetch instead of invalidate to avoid concurrent renders
        setTimeout(() => {
          utils.scans.getPublicSummary.refetch({ scanId: scanId! });
        }, 500);
      }
    }
  }, [scanSummary?.status, shouldPoll, scanId, utils]);

  const unlockReport = trpc.scans.unlockReport.useMutation({
    onSuccess: () => {
      toast.success("¡Informe desbloqueado!");
      utils.scans.getPublicSummary.refetch({ scanId: scanId! });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) { toast.error("Introduce una URL válida"); return; }
    if (!ownerConfirmation) { toast.error("Debes confirmar que eres propietario o tienes permiso"); return; }
    if (!termsAccepted) { toast.error("Debes aceptar los términos de uso"); return; }
    createScan.mutate({ url: url.trim(), ownerConfirmation, termsAccepted, language: i18n.language as 'es' | 'en' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border/50 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-6 cyber-glow">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Inicia sesión para escanear</h2>
          <p className="text-muted-foreground mb-6">Necesitas una cuenta para realizar análisis de seguridad.</p>
          <a href={getLoginUrl()} className="block"><Button className="w-full cyber-glow"><Shield className="w-4 h-4 mr-2" />Iniciar sesión</Button></a>
          <Link href="/" className="block mt-3"><Button variant="ghost" className="w-full text-muted-foreground"><ArrowLeft className="w-4 h-4 mr-2" />Volver al inicio</Button></Link>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-3">
            <Link href="/dashboard"><Button variant="ghost" size="sm" className="text-muted-foreground text-xs">Panel</Button></Link>
            <span className="text-xs text-muted-foreground hidden sm:block">{user?.name || user?.email}</span>
          </div>
        </div>
      </nav>

      <div className="container py-10 max-w-2xl mx-auto">
        {/* FORM PHASE - Always rendered, visibility controlled */}
        <div className={phase === "form" ? "block" : "hidden"}>
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-5 cyber-glow">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-black mb-3">{t('scan.title')}</h1>
            <p className="text-muted-foreground">{t('scan.subtitle')}</p>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
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
                <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">{t('scan.scanning')}</p>
              </div>
              <Button type="submit" className="w-full cyber-glow h-11 font-semibold" disabled={createScan.isPending}>
                {createScan.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.loading')}</> : <><Shield className="w-4 h-4 mr-2" />{t('scan.submit_button')}<ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </form>
          </div>
        </div>

        {/* SCANNING PHASE - Always rendered, visibility controlled */}
        <div className={phase === "scanning" ? "block" : "hidden"}>
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center cyber-glow">
                <Shield className="w-9 h-9 text-primary animate-pulse" />
              </div>
            </div>
            <h1 className="text-2xl font-black mb-2">{t('scan.analyzing_headers')}</h1>
            <p className="text-muted-foreground text-sm">{scanSummary?.url || url}</p>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-6 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">{t('common.loading')}</span>
              <span className="text-sm font-bold text-primary">{scanSummary?.progress ?? 0}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
              <div className="h-full progress-shimmer rounded-full transition-all duration-500" style={{ width: `${scanSummary?.progress ?? 0}%` }} />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              {scanSummary?.currentStep || "Iniciando análisis..."}
            </p>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">{t('scan.generating_results')}</p>
            <div className="space-y-2">
              {SCAN_STEPS_DISPLAY.map((step, i) => {
                const stepProgress = (i + 1) * 10;
                const isDone = (scanSummary?.progress ?? 0) >= stepProgress;
                const isActive = (scanSummary?.progress ?? 0) >= stepProgress - 10 && !isDone;
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

        {/* RESULT PHASE - Always rendered, visibility controlled */}
        <div className={phase === "result" ? "block" : "hidden"}>
          {scanSummary && (
            <>
              {scanSummary.status === "failed" ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                  <h1 className="text-2xl font-black mb-3">{t('common.error')}</h1>
                  <p className="text-muted-foreground mb-6">{t('errors.server_error')}</p>
                  <Button onClick={() => { setPhase("form"); setScanId(null); setShouldPoll(false); navigate("/scan"); }}>{t('common.cancel')}</Button>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5 cyber-glow-green">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-black mb-2">{t('scan.results_title')}</h1>
                    <p className="text-muted-foreground text-sm">{scanSummary.url}</p>
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl p-6 mb-4">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-lg font-bold mb-1">{t('scan.analysis_results')}</h2>
                        <p className="text-sm text-muted-foreground">{t('scan.vulnerabilities_found_count')} <span className="font-bold text-foreground">{scanSummary.totalVulnerabilities}</span>.</p>
                      </div>
                      {scanSummary.securityScore !== null && scanSummary.securityScore !== undefined && (
                        <ScoreGauge score={scanSummary.securityScore} t={t} />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-muted/20 rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">{t('scan.risk_level_label')}</p>
                        <span className={`text-xl font-black ${getRiskColor(scanSummary.riskLevel)}`}>{getRiskLabel(scanSummary.riskLevel, t)}</span>
                      </div>
                      <div className="bg-muted/20 rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">{t('scan.detected_vulnerabilities')}</p>
                        <span className="text-xl font-black">{scanSummary.totalVulnerabilities}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: t('scan.critical_count'), count: scanSummary.criticalCount, cls: "severity-critical" },
                        { label: t('scan.high_count'), count: scanSummary.highCount, cls: "severity-high" },
                        { label: t('scan.medium_count'), count: scanSummary.mediumCount, cls: "severity-medium" },
                        { label: t('scan.low_count'), count: scanSummary.lowCount, cls: "severity-low" },
                      ].map(item => (
                        <div key={item.label} className={`rounded-lg p-3 text-center ${item.cls}`}>
                          <div className="text-lg font-black">{item.count}</div>
                          <div className="text-xs">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {user?.subscriptionPlan === 'free' ? (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 text-center">
                      <Shield className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-bold mb-2">{t('scan.free_plan_results')}</h3>
                      <p className="text-sm text-muted-foreground mb-5">{t('scan.free_plan_desc')}</p>
                      <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
                        {[t('scan.security_score'), t('scan.total_vulnerabilities'), t('scan.severity_classification')].map(f => (
                          <span key={f} className="text-xs bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-full">{f}</span>
                        ))}
                      </div>
                      <Link href="/pricing">
                        <Button className="cyber-glow px-8 h-11 font-semibold">
                          <Zap className="w-4 h-4 mr-2" />{t('scan.upgrade_plan')}
                        </Button>
                      </Link>
                    </div>
                  ) : !scanSummary.isPaid ? (
                    <div className="bg-gradient-to-br from-primary/10 to-purple-500/5 border border-primary/30 rounded-2xl p-6 text-center cyber-glow">
                      <Lock className="w-10 h-10 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-bold mb-2">{t('scan.unlock_full_report')}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{t('scan.get_technical_details')}</p>
                      <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
                        {[t('scan.technical_details'), t('scan.solutions'), t('scan.ai_explanation'), t('scan.incomplete_pdf')].map(f => (
                          <span key={f} className="text-xs bg-primary/15 text-primary border border-primary/30 px-2 py-1 rounded-full">{f}</span>
                        ))}
                      </div>
                      <Button className="cyber-glow px-8 h-11 font-semibold" onClick={() => unlockReport.mutate({ scanId: scanId! })} disabled={unlockReport.isPending}>
                        {unlockReport.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.loading')}</> : <><Shield className="w-4 h-4 mr-2" />{t('scan.unlock_report_free')}</>}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-3">{t('pricing.billed_monthly')}</p>
                    </div>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                      <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-bold mb-2">{t('scan.unlock_report')}</h3>
                      <p className="text-sm text-muted-foreground mb-5">{t('scan.report_locked_desc')}</p>
                      <Link href={`/report/${scanId}`}>
                        <Button className="px-8 h-11 font-semibold bg-green-600 hover:bg-green-700">
                          <FileText className="w-4 h-4 mr-2" />{t('scan.security_report')}<ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" className="flex-1" onClick={() => { setPhase("form"); setScanId(null); setShouldPoll(false); navigate("/scan"); }}>{t('dashboard.new_analysis')}</Button>
                    {user?.subscriptionPlan !== 'free' && (
                      <Link href="/dashboard"><Button variant="ghost" className="w-full text-muted-foreground">Ver historial</Button></Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
