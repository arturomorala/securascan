import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Shield, ShieldCheck, FileText, Download, ArrowLeft, Brain, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Streamdown } from "streamdown";
import { useTranslation } from "react-i18next";

function SeverityBadge({ severity, t }: { severity: string; t: any }) {
  const map: Record<string, string> = { critical: "severity-critical", high: "severity-high", medium: "severity-medium", low: "severity-low" };
  const labels: Record<string, string> = { critical: t('scan.critical'), high: t('scan.high'), medium: t('scan.medium'), low: t('scan.low') };
  return <span className={`text-xs px-2 py-0.5 rounded font-medium ${map[severity] || ""}`}>{labels[severity] || severity}</span>;
}

function VulnerabilityCard({ vuln, t, language }: { vuln: any; t: any; language: string }) {
  const [expanded, setExpanded] = useState(false);
  const [aiLevel, setAiLevel] = useState<"basic" | "technical" | "expert" | null>(null);
  const [aiContent, setAiContent] = useState<string | null>(null);

  const explainMutation = trpc.ai.explainVulnerability.useMutation({
    onSuccess: (data) => setAiContent(data.explanation),
    onError: (err) => toast.error(err.message),
  });

  const handleExplain = (level: "basic" | "technical" | "expert") => {
    setAiLevel(level);
    setAiContent(null);
    explainMutation.mutate({ vulnerabilityId: vuln.id, level, language: language as 'es' | 'en' });
  };

  const borderColor = vuln.severity === "critical" ? "border-red-500/30" : vuln.severity === "high" ? "border-orange-500/30" : vuln.severity === "medium" ? "border-yellow-500/30" : "border-blue-500/30";
  const bgColor = vuln.severity === "critical" ? "bg-red-500/5" : vuln.severity === "high" ? "bg-orange-500/5" : vuln.severity === "medium" ? "bg-yellow-500/5" : "bg-blue-500/5";

  return (
    <div className={`border ${borderColor} ${bgColor} rounded-xl overflow-hidden`}>
      <button className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <SeverityBadge severity={vuln.severity} t={t} />
          <span className="font-semibold text-sm">{vuln.name}</span>
          <span className="text-xs text-muted-foreground hidden sm:block">{vuln.category}</span>
        </div>
        <div className="flex items-center gap-2">
          {vuln.cvssScore && <span className="text-xs text-muted-foreground">CVSS {vuln.cvssScore}</span>}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('scan.description')}</p>
            <p className="text-sm text-foreground/90">{vuln.description}</p>
          </div>
          {vuln.detectionMethod && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('scan.detection_method')}</p>
              <p className="text-sm text-foreground/90">{vuln.detectionMethod}</p>
            </div>
          )}
          {vuln.impact && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('scan.potential_impact')}</p>
              <p className="text-sm text-foreground/90">{vuln.impact}</p>
            </div>
          )}
          {vuln.technicalDetails && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('scan.technical_details')}</p>
              <p className="text-sm font-mono bg-muted/30 rounded-lg p-3 text-foreground/80">{vuln.technicalDetails}</p>
            </div>
          )}
          {vuln.remediation && (
            <div>
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">{t('scan.remediation_steps')}</p>
              <p className="text-sm text-foreground/90">{vuln.remediation}</p>
            </div>
          )}
          {vuln.evidence && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('scan.how_it_affects')}</p>
              <p className="text-sm font-mono bg-muted/30 rounded-lg p-3 text-foreground/80">{vuln.evidence}</p>
            </div>
          )}
          {vuln.owaspReference && (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-primary/15 text-primary border border-primary/30 px-2 py-1 rounded">{vuln.owaspReference}</span>
            </div>
          )}

          {/* AI Explanation */}
          <div className="border-t border-white/5 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">{t('scan.ai_explanation')}</span>
            </div>
            <div className="flex gap-2 mb-3">
              {(["basic", "technical", "expert"] as const).map(level => (
                <Button key={level} size="sm" variant={aiLevel === level ? "default" : "outline"}
                  className="text-xs h-7"
                  onClick={() => handleExplain(level)}
                  disabled={explainMutation.isPending && aiLevel === level}>
                  {level === "basic" ? t('scan.technical_details') : level === "technical" ? t('scan.solutions') : t('scan.ai_explanation')}
                </Button>
              ))}
            </div>
            {explainMutation.isPending && aiLevel && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                {t('common.loading')}
              </div>
            )}
            {aiContent && (
              <div className="bg-muted/20 border border-border/30 rounded-xl p-4 text-sm">
                <Streamdown>{aiContent}</Streamdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportPage() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const scanId = parseInt(params.id);

  const { data: scan, isLoading: scanLoading } = trpc.scans.getPublicSummary.useQuery({ scanId }, { enabled: !!scanId && isAuthenticated });
  const { data: vulnerabilities, isLoading: vulnsLoading } = trpc.scans.getVulnerabilities.useQuery({ scanId }, { enabled: !!scanId && isAuthenticated && !!scan?.isPaid });

  const generatePdf = trpc.scans.generatePdf.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("PDF generado correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  if (authLoading || scanLoading) {
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
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-3">{t('scan.login_required')}</h2>
          <p className="text-muted-foreground mb-6">{t('scan.login_required_desc')}</p>
          <a href="/"><Button className="w-full">{t('scan.back_home')}</Button></a>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-3">{t('errors.not_found')}</h2>
          <Link href="/dashboard"><Button>{t('dashboard.title')}</Button></Link>
        </div>
      </div>
    );
  }

  const score = scan.securityScore ?? 0;
  const scoreColor = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";

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
            <Link href="/dashboard"><Button variant="ghost" size="sm" className="text-xs text-muted-foreground"><ArrowLeft className="w-3.5 h-3.5 mr-1" />{t('dashboard.title')}</Button></Link>
            {scan.isPaid && (
              <Button size="sm" className="text-xs" onClick={() => generatePdf.mutate({ scanId })} disabled={generatePdf.isPending}>
                {generatePdf.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1" />}
                {t('scan.download_report')}
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="container py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-black">{t('scan.security_report')}</h1>
              </div>
              <p className="text-sm text-muted-foreground truncate">{scan.url}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(scan.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor} strokeWidth="10"
                    strokeDasharray={`${(score / 100) * 314} 314`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black" style={{ color: scoreColor }}>{score}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground mt-1">{t('scan.security_score')}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-5">
            {[
              { label: t('scan.critical_count'), count: scan.criticalCount, cls: "severity-critical" },
              { label: t('scan.high_count'), count: scan.highCount, cls: "severity-high" },
              { label: t('scan.medium_count'), count: scan.mediumCount, cls: "severity-medium" },
              { label: t('scan.low_count'), count: scan.lowCount, cls: "severity-low" },
            ].map(item => (
              <div key={item.label} className={`rounded-xl p-3 text-center ${item.cls}`}>
                <div className="text-xl font-bold">{item.count}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Vulnerabilities */}
        {vulnerabilities && vulnerabilities.length > 0 ? (
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('scan.detected_vulnerabilities')}</h2>
              <span className="text-sm text-muted-foreground">{vulnerabilities.length} {t('scan.total_vulnerabilities')}</span>
            </div>
            <div className="space-y-3">
              {vulnerabilities?.map((vuln) => (
                <VulnerabilityCard key={vuln.id} vuln={vuln} t={t} language={i18n.language} />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-3">{t('scan.no_vulnerabilities')}</h3>
            <p className="text-muted-foreground">{t('scan.no_vulnerabilities_desc')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
