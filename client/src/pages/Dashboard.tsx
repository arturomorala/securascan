import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Loader2, Shield, ShieldCheck, Plus, FileText, Eye, Clock, AlertTriangle, CheckCircle, XCircle, BarChart3, Globe, CreditCard, X, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { toast } from "sonner";

function getStatusBadge(status: string, t: any) {
  switch (status) {
    case "completed": return <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-3 h-3" />{t('dashboard.completed')}</span>;
    case "running": return <span className="flex items-center gap-1 text-xs text-primary"><Loader2 className="w-3 h-3 animate-spin" />{t('dashboard.analyzing')}</span>;
    case "pending": return <span className="flex items-center gap-1 text-xs text-yellow-400"><Clock className="w-3 h-3" />{t('dashboard.pending')}</span>;
    case "failed": return <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="w-3 h-3" />{t('dashboard.error')}</span>;
    default: return <span className="text-xs text-muted-foreground">{status}</span>;
  }
}

function getRiskBadge(risk: string | null, t: any) {
  if (!risk) return null;
  const classes = { critical: "severity-critical", high: "severity-high", medium: "severity-medium", low: "severity-low" };
  const labels = { critical: t('dashboard.critical'), high: t('dashboard.high'), medium: t('dashboard.medium'), low: t('dashboard.low') };
  return <span className={`text-xs px-2 py-0.5 rounded font-medium ${classes[risk as keyof typeof classes] || ""}`}>{labels[risk as keyof typeof labels] || risk}</span>;
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null || score === undefined) return <span className="text-xs text-muted-foreground">N/A</span>;
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : score >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold">{score}</span>
    </div>
  );
}

function getPlanLabel(plan: string, t: any) {
  const labels: Record<string, string> = {
    free: t('pricing.free') || "Free",
    basic: "One-Time Scan",
    professional: t('pricing.pro') || "Pro",
    enterprise: t('pricing.business') || "Business",
  };
  return labels[plan] || plan;
}

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { data: scans, isLoading: scansLoading } = trpc.scans.list.useQuery(undefined, { enabled: isAuthenticated });
  const { t } = useTranslation();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelSubscriptionMutation = trpc.stripe.cancelSubscription.useMutation();

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
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-3">{t('dashboard.access_required')}</h2>
          <p className="text-muted-foreground mb-6">{t('dashboard.login_to_access')}</p>
          <a href={getLoginUrl()}><Button className="w-full cyber-glow">{t('dashboard.login')}</Button></a>
        </div>
      </div>
    );
  }

  const completedScans = scans?.filter(s => s.status === "completed") ?? [];
  const criticalScans = scans?.filter(s => s.criticalCount > 0) ?? [];
  const avgScore = completedScans.length > 0
    ? Math.round(completedScans.reduce((acc, s) => acc + (s.securityScore ?? 0), 0) / completedScans.length)
    : null;

  const isSubscribed = user?.subscriptionStatus === "active" && (user?.subscriptionPlan === "professional" || user?.subscriptionPlan === "enterprise");
  const nextRenewalDate = user?.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString("es-ES") : null;
  const currentPlan = user?.subscriptionPlan || "free";
  const subscriptionStatus = user?.subscriptionStatus || "inactive";

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-bold text-sm"><span className="gradient-text">Secura</span>Scan</span>
          </Link>
          <div className="flex items-center gap-3">
            {user?.role === "admin" && (
              <Link href="/admin"><Button variant="ghost" size="sm" className="text-xs text-orange-400 hover:text-orange-300">{t('dashboard.admin')}</Button></Link>
            )}
            <Link href="/scan"><Button size="sm" className="cyber-glow text-xs"><Plus className="w-3.5 h-3.5 mr-1" />{t('dashboard.new_scan')}</Button></Link>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={logout}>{t('dashboard.logout')}</Button>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black mb-1">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('dashboard.welcome')}, <span className="text-foreground font-medium">{user?.name || user?.email}</span></p>
        </div>

        {/* Subscription Card */}
        <div className={`${isSubscribed ? 'bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30' : 'bg-card border-border/50'} border rounded-2xl p-6 mb-8`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg ${isSubscribed ? 'bg-primary/20 border-primary/30' : 'bg-muted border-border/50'} border flex items-center justify-center`}>
                <CreditCard className={`w-6 h-6 ${isSubscribed ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">{getPlanLabel(currentPlan, t)}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {isSubscribed && nextRenewalDate && `${t('dashboard.next_renewal_label')}: ${nextRenewalDate}`}
                  {!isSubscribed && currentPlan === "free" && t('dashboard.free_plan_info')}
                </p>
                <div className="flex gap-2">
                  <Link href="/pricing">
                    <Button size="sm" variant="outline" className="text-xs">
                      {isSubscribed ? t('dashboard.change_plan_btn') : t('dashboard.upgrade_plan_btn')}
                    </Button>
                  </Link>
                  {isSubscribed && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs text-red-400 hover:text-red-300"
                      onClick={() => setShowCancelModal(true)}
                    >
                      {t('dashboard.cancel_subscription_btn')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <Badge className={`${isSubscribed ? 'bg-primary/30 text-primary border-primary/50' : 'bg-muted text-muted-foreground border-border/50'} border`}>
              {isSubscribed ? t('dashboard.active_status') : t('dashboard.inactive_status')}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('dashboard.total_scans'), value: scans?.length ?? 0, icon: Globe, color: "text-primary" },
            { label: t('dashboard.completed'), value: completedScans.length, icon: CheckCircle, color: "text-green-400" },
            { label: t('dashboard.critical_vulns'), value: criticalScans.length, icon: AlertTriangle, color: "text-red-400" },
            { label: t('dashboard.avg_score'), value: avgScore !== null ? `${avgScore}/100` : "N/A", icon: BarChart3, color: "text-yellow-400" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border/50 rounded-xl p-4 card-hover">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-black">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Scans list */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border/30">
            <h2 className="font-bold">{t('dashboard.scan_history')}</h2>
            <Link href="/scan">
              <Button size="sm" className="cyber-glow text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />{t('dashboard.new_analysis')}
              </Button>
            </Link>
          </div>

          {scansLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : !scans || scans.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">{t('dashboard.no_scans')}</h3>
              <p className="text-sm text-muted-foreground mb-6">{t('dashboard.no_scans_desc')}</p>
              <Link href="/scan"><Button className="cyber-glow"><Plus className="w-4 h-4 mr-2" />{t('dashboard.start_first_scan')}</Button></Link>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {scans.map(scan => (
                <div key={scan.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Globe className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate max-w-xs">{scan.url}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {getStatusBadge(scan.status, t)}
                        {scan.riskLevel && getRiskBadge(scan.riskLevel, t)}
                        <span className="text-xs text-muted-foreground">{new Date(scan.createdAt).toLocaleDateString("es-ES")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    <div className="hidden sm:block">
                      <ScoreBar score={scan.securityScore} />
                    </div>
                    <div className="flex items-center gap-2">
                      {scan.status === "completed" && (
                        <>
                          <Link href={`/scan/${scan.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 px-2">
                              <Eye className="w-3.5 h-3.5 mr-1" />{t('dashboard.view')}
                            </Button>
                          </Link>
                          {scan.isPaid && (
                            <Link href={`/report/${scan.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs text-primary h-7 px-2">
                                <FileText className="w-3.5 h-3.5 mr-1" />{t('dashboard.report')}
                              </Button>
                            </Link>
                          )}
                        </>
                      )}
                      {(scan.status === "running" || scan.status === "pending") && (
                        <Link href={`/scan/${scan.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-primary h-7 px-2">
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />{t('dashboard.view_progress')}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold">{t('dashboard.cancel_subscription_title')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('dashboard.cancel_subscription_desc')}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCancelModal(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowCancelModal(false)}
              >
                {t('dashboard.keep_subscription_btn')}
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={async () => {
                  try {
                    await cancelSubscriptionMutation.mutateAsync();
                    setShowCancelModal(false);
                    toast.success(t('dashboard.cancel_subscription_success'));
                  } catch (error) {
                    toast.error(t('dashboard.cancel_subscription_error'));
                  }
                }}
                disabled={cancelSubscriptionMutation.isPending}
              >
                {cancelSubscriptionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {t('dashboard.confirm_cancel_btn')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
