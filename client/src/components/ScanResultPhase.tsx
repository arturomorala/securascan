import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, AlertTriangle, Lock, Zap, FileText, ArrowRight, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";

interface ScanSummary {
  id: number;
  url: string;
  status: string;
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  riskLevel: string | null;
  securityScore: number | null;
  isPaid: boolean;
}

interface ScanResultPhaseProps {
  scanSummary: ScanSummary;
  userPlan: string;
  scanId: number;
  onNewAnalysis: () => void;
  onUnlock: () => void;
  isUnlocking: boolean;
}

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

export function ScanResultPhase({
  scanSummary,
  userPlan,
  scanId,
  onNewAnalysis,
  onUnlock,
  isUnlocking,
}: ScanResultPhaseProps) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  if (scanSummary.status === "failed") {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-black mb-3">{t('common.error')}</h1>
        <p className="text-muted-foreground mb-6">{t('errors.server_error')}</p>
        <Button onClick={onNewAnalysis}>{t('common.cancel')}</Button>
      </div>
    );
  }

  return (
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
      {userPlan === 'free' ? (
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
          <Button className="cyber-glow px-8 h-11 font-semibold" onClick={onUnlock} disabled={isUnlocking}>
            {isUnlocking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.loading')}</> : <><Shield className="w-4 h-4 mr-2" />{t('scan.unlock_report_free')}</>}
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
        <Button variant="outline" className="flex-1" onClick={onNewAnalysis}>{t('dashboard.new_analysis')}</Button>
        {userPlan !== 'free' && (
          <Link href="/dashboard" className="flex-1"><Button variant="ghost" className="w-full text-muted-foreground">Ver historial</Button></Link>
        )}
      </div>
    </div>
  );
}
