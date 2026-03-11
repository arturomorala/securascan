import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Loader2, Shield, ShieldCheck, Plus, FileText, Eye, Clock, AlertTriangle, CheckCircle, XCircle, BarChart3, Globe } from "lucide-react";

function getStatusBadge(status: string) {
  switch (status) {
    case "completed": return <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-3 h-3" />Completado</span>;
    case "running": return <span className="flex items-center gap-1 text-xs text-primary"><Loader2 className="w-3 h-3 animate-spin" />Analizando</span>;
    case "pending": return <span className="flex items-center gap-1 text-xs text-yellow-400"><Clock className="w-3 h-3" />Pendiente</span>;
    case "failed": return <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="w-3 h-3" />Error</span>;
    default: return <span className="text-xs text-muted-foreground">{status}</span>;
  }
}

function getRiskBadge(risk: string | null) {
  if (!risk) return null;
  const classes = { critical: "severity-critical", high: "severity-high", medium: "severity-medium", low: "severity-low" };
  const labels = { critical: "Crítico", high: "Alto", medium: "Medio", low: "Bajo" };
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

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { data: scans, isLoading: scansLoading } = trpc.scans.list.useQuery(undefined, { enabled: isAuthenticated });

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
          <h2 className="text-xl font-bold mb-3">Acceso requerido</h2>
          <p className="text-muted-foreground mb-6">Inicia sesión para acceder a tu panel de control.</p>
          <a href={getLoginUrl()}><Button className="w-full cyber-glow">Iniciar sesión</Button></a>
        </div>
      </div>
    );
  }

  const completedScans = scans?.filter(s => s.status === "completed") ?? [];
  const criticalScans = scans?.filter(s => s.criticalCount > 0) ?? [];
  const avgScore = completedScans.length > 0
    ? Math.round(completedScans.reduce((acc, s) => acc + (s.securityScore ?? 0), 0) / completedScans.length)
    : null;

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
              <Link href="/admin"><a><Button variant="ghost" size="sm" className="text-xs text-orange-400 hover:text-orange-300">Admin</Button></a></Link>
            )}
            <Link href="/scan"><a><Button size="sm" className="cyber-glow text-xs"><Plus className="w-3.5 h-3.5 mr-1" />Nuevo escaneo</Button></a></Link>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={logout}>Salir</Button>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black mb-1">Panel de control</h1>
          <p className="text-muted-foreground text-sm">Bienvenido, <span className="text-foreground font-medium">{user?.name || user?.email}</span></p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total escaneos", value: scans?.length ?? 0, icon: Globe, color: "text-primary" },
            { label: "Completados", value: completedScans.length, icon: CheckCircle, color: "text-green-400" },
            { label: "Con vulnerabilidades críticas", value: criticalScans.length, icon: AlertTriangle, color: "text-red-400" },
            { label: "Score promedio", value: avgScore !== null ? `${avgScore}/100` : "N/A", icon: BarChart3, color: "text-yellow-400" },
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
            <h2 className="font-bold">Historial de análisis</h2>
            <Link href="/scan">
              <Button size="sm" className="cyber-glow text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />Nuevo análisis
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
              <h3 className="font-semibold mb-2">Sin análisis todavía</h3>
              <p className="text-sm text-muted-foreground mb-6">Realiza tu primer análisis de seguridad para ver los resultados aquí.</p>
              <Link href="/scan"><a><Button className="cyber-glow"><Plus className="w-4 h-4 mr-2" />Iniciar primer análisis</Button></a></Link>
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
                        {getStatusBadge(scan.status)}
                        {scan.riskLevel && getRiskBadge(scan.riskLevel)}
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
                              <Eye className="w-3.5 h-3.5 mr-1" />Ver
                            </Button>
                          </Link>
                          {scan.isPaid && (
                            <Link href={`/report/${scan.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs text-primary h-7 px-2">
                                <FileText className="w-3.5 h-3.5 mr-1" />Informe
                              </Button>
                            </Link>
                          )}
                        </>
                      )}
                      {(scan.status === "running" || scan.status === "pending") && (
                        <Link href={`/scan/${scan.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-primary h-7 px-2">
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Ver progreso
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
    </div>
  );
}
