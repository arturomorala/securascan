import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Loader2, Shield, ShieldCheck, Users, Globe, AlertTriangle, BarChart3, ArrowLeft, CheckCircle, XCircle, Clock, FileText } from "lucide-react";

function getStatusIcon(status: string) {
  switch (status) {
    case "completed": return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
    case "running": return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />;
    case "pending": return <Clock className="w-3.5 h-3.5 text-yellow-400" />;
    case "failed": return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    default: return null;
  }
}

function getRiskBadge(risk: string | null) {
  if (!risk) return null;
  const classes: Record<string, string> = { critical: "severity-critical", high: "severity-high", medium: "severity-medium", low: "severity-low" };
  const labels: Record<string, string> = { critical: "Crítico", high: "Alto", medium: "Medio", low: "Bajo" };
  return <span className={`text-xs px-2 py-0.5 rounded font-medium ${classes[risk] || ""}`}>{labels[risk] || risk}</span>;
}

export default function AdminPanel() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: allScans, isLoading: scansLoading } = trpc.admin.scans.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: allUsers, isLoading: usersLoading } = trpc.admin.users.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border/50 rounded-2xl p-8 max-w-md w-full text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-3">Acceso denegado</h2>
          <p className="text-muted-foreground mb-6">No tienes permisos para acceder al panel de administración.</p>
          <Link href="/dashboard"><Button>Ir al panel de usuario</Button></Link>
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
            <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-1 rounded">Admin</span>
            <Link href="/dashboard"><Button variant="ghost" size="sm" className="text-xs text-muted-foreground"><ArrowLeft className="w-3.5 h-3.5 mr-1" />Panel usuario</Button></Link>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black mb-1">Panel de Administración</h1>
          <p className="text-muted-foreground text-sm">Gestión y monitorización de la plataforma SecuraScan</p>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <div key={i} className="bg-card border border-border/50 rounded-xl p-4 h-24 animate-pulse" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Usuarios registrados", value: stats.users, icon: Users, color: "text-primary" },
              { label: "Total escaneos", value: stats.scans, icon: Globe, color: "text-blue-400" },
              { label: "Vulnerabilidades detectadas", value: stats.vulnerabilities, icon: AlertTriangle, color: "text-red-400" },
              { label: "Ingresos estimados", value: `${stats.revenue}€`, icon: FileText, color: "text-green-400" },
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
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* All Scans */}
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />Últimos escaneos</h2>
              <span className="text-xs text-muted-foreground">{allScans?.length ?? 0} total</span>
            </div>
            {scansLoading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
            ) : !allScans || allScans.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Sin escaneos todavía</div>
            ) : (
              <div className="divide-y divide-border/30 max-h-96 overflow-y-auto">
                {allScans.map(scan => (
                  <div key={scan.id} className="flex items-center justify-between p-3 hover:bg-muted/10 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate max-w-48">{scan.url}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {getStatusIcon(scan.status)}
                        <span className="text-xs text-muted-foreground">Usuario</span>
                        <span className="text-xs text-muted-foreground">{new Date(scan.createdAt).toLocaleDateString("es-ES")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {scan.riskLevel && getRiskBadge(scan.riskLevel)}
                      {scan.securityScore !== null && <span className="text-xs font-bold text-muted-foreground">{scan.securityScore}</span>}
                      {scan.isPaid && <span className="text-xs text-green-400">✓ Pagado</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Users */}
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Usuarios registrados</h2>
              <span className="text-xs text-muted-foreground">{allUsers?.length ?? 0} total</span>
            </div>
            {usersLoading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
            ) : !allUsers || allUsers.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Sin usuarios todavía</div>
            ) : (
              <div className="divide-y divide-border/30 max-h-96 overflow-y-auto">
                {allUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 hover:bg-muted/10 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">{u.name || "Sin nombre"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-48">{u.email || u.openId}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">Usuario</span>
                      {u.role === "admin" && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded">Admin</span>
                      )}
                      <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("es-ES")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
