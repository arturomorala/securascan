import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Shield, ShieldCheck, AlertTriangle, CheckCircle, Loader2,
  Globe, Lock, ArrowRight, ArrowLeft, FileText, Zap, Eye, Server, Code
} from "lucide-react";

const SCAN_STEPS_DISPLAY = [
  { label: "Analizando headers de seguridad HTTP", icon: Shield },
  { label: "Verificando configuración HTTPS/TLS", icon: Lock },
  { label: "Detectando tecnologías y versiones", icon: Code },
  { label: "Analizando política de cookies", icon: Eye },
  { label: "Verificando Content Security Policy", icon: ShieldCheck },
  { label: "Comprobando configuración CORS", icon: Globe },
  { label: "Buscando archivos sensibles expuestos", icon: AlertTriangle },
  { label: "Analizando formularios y endpoints", icon: Server },
  { label: "Evaluando configuración del servidor", icon: Zap },
  { label: "Generando resultados del análisis", icon: FileText },
];

function getRiskColor(risk: string | null | undefined) {
  switch (risk) {
    case "critical": return "text-red-400";
    case "high": return "text-orange-400";
    case "medium": return "text-yellow-400";
    case "low": return "text-blue-400";
    default: return "text-muted-foreground";
  }
}

function getRiskLabel(risk: string | null | undefined) {
  switch (risk) {
    case "critical": return "CRÍTICO";
    case "high": return "ALTO";
    case "medium": return "MEDIO";
    case "low": return "BAJO";
    default: return "N/A";
  }
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";
  const label = score >= 80 ? "Bueno" : score >= 60 ? "Moderado" : score >= 40 ? "Deficiente" : "Crítico";
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
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();

  const [url, setUrl] = useState("");
  const [ownerConfirmation, setOwnerConfirmation] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [scanId, setScanId] = useState<number | null>(params.id ? parseInt(params.id) : null);
  const [phase, setPhase] = useState<"form" | "scanning" | "result">(params.id ? "scanning" : "form");

  const createScan = trpc.scans.create.useMutation({
    onSuccess: (data) => {
      setScanId(data.id);
      setPhase("scanning");
      navigate(`/scan/${data.id}`, { replace: true });
    },
    onError: (err) => toast.error(err.message || "Error al iniciar el escaneo"),
  });

  const { data: scanSummary } = trpc.scans.getPublicSummary.useQuery(
    { scanId: scanId! },
    { enabled: !!scanId, refetchInterval: phase === "scanning" ? 2000 : false }
  );

  const utils = trpc.useUtils();

  useEffect(() => {
    if (scanSummary?.status === "completed" || scanSummary?.status === "failed") {
      setPhase("result");
    }
  }, [scanSummary?.status]);

  const unlockReport = trpc.scans.unlockReport.useMutation({
    onSuccess: () => {
      toast.success("¡Informe desbloqueado!");
      setScanId(null);
      setPhase("form");
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) { toast.error("Introduce una URL válida"); return; }
    if (!ownerConfirmation) { toast.error("Debes confirmar que eres propietario o tienes permiso"); return; }
    if (!termsAccepted) { toast.error("Debes aceptar los términos de uso"); return; }
    createScan.mutate({ url: url.trim(), ownerConfirmation, termsAccepted });
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
        {/* FORM */}
        {phase === "form" && (
          <div>
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-5 cyber-glow">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-black mb-3">Analizar sitio web</h1>
              <p className="text-muted-foreground">Introduce la URL del sitio que deseas analizar. El análisis tarda entre 2 y 5 minutos.</p>
            </div>
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="url" className="text-sm font-medium mb-2 block">URL del sitio web *</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="url" type="url" placeholder="https://ejemplo.com" value={url}
                      onChange={e => setUrl(e.target.value)}
                      className="pl-10 bg-muted/30 border-border/50 focus:border-primary/50" required />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Solo URLs públicas. No se permiten IPs privadas ni localhost.</p>
                </div>
                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-3">
                    <Checkbox id="owner" checked={ownerConfirmation} onCheckedChange={v => setOwnerConfirmation(!!v)} className="mt-0.5" />
                    <Label htmlFor="owner" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                      Confirmo que soy el propietario de este sitio o tengo autorización explícita para realizar este análisis.
                    </Label>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox id="terms" checked={termsAccepted} onCheckedChange={v => setTermsAccepted(!!v)} className="mt-0.5" />
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      Acepto los <a href="/terms" className="text-primary hover:underline cursor-pointer">Términos de uso</a> y la <a href="/privacy" className="text-primary hover:underline cursor-pointer">Política de privacidad</a>.
                    </div>
                  </div>
                </div>
                <div className="bg-muted/20 border border-border/30 rounded-xl p-4 flex items-start gap-3">
                  <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">El análisis suele tardar entre <strong className="text-foreground">2 y 5 minutos</strong> dependiendo del tamaño y complejidad del sitio. Verás el progreso en tiempo real.</p>
                </div>
                <Button type="submit" className="w-full cyber-glow h-11 font-semibold" disabled={createScan.isPending}>
                  {createScan.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Iniciando...</> : <><Shield className="w-4 h-4 mr-2" />Iniciar análisis<ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* SCANNING */}
        {phase === "scanning" && (
          <div>
            <div className="text-center mb-8">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center cyber-glow">
                  <Shield className="w-9 h-9 text-primary animate-pulse" />
                </div>
              </div>
              <h1 className="text-2xl font-black mb-2">Analizando seguridad...</h1>
              <p className="text-muted-foreground text-sm">{scanSummary?.url || url}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-2xl p-6 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Progreso</span>
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
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Pasos del análisis</p>
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
        )}

        {/* RESULT */}
        {phase === "result" && scanSummary && (
          <div>
            {scanSummary.status === "failed" ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h1 className="text-2xl font-black mb-3">Error en el análisis</h1>
                <p className="text-muted-foreground mb-6">No se pudo completar el análisis. Verifica que la URL sea accesible.</p>
                <Button onClick={() => { setPhase("form"); setScanId(null); navigate("/scan"); }}>Intentar de nuevo</Button>
              </div>
            ) : (
              <div>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5 cyber-glow-green">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h1 className="text-2xl font-black mb-2">Análisis completado</h1>
                  <p className="text-muted-foreground text-sm">{scanSummary.url}</p>
                </div>
                <div className="bg-card border border-border/50 rounded-2xl p-6 mb-4">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-bold mb-1">Resultado del análisis</h2>
                      <p className="text-sm text-muted-foreground">Se han encontrado <span className="font-bold text-foreground">{scanSummary.totalVulnerabilities} vulnerabilidades</span>.</p>
                    </div>
                    {scanSummary.securityScore !== null && scanSummary.securityScore !== undefined && (
                      <ScoreGauge score={scanSummary.securityScore} />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-muted/20 rounded-xl p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Nivel de riesgo</p>
                      <span className={`text-xl font-black ${getRiskColor(scanSummary.riskLevel)}`}>{getRiskLabel(scanSummary.riskLevel)}</span>
                    </div>
                    <div className="bg-muted/20 rounded-xl p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total vulnerabilidades</p>
                      <span className="text-xl font-black">{scanSummary.totalVulnerabilities}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Crítico", count: scanSummary.criticalCount, cls: "severity-critical" },
                      { label: "Alto", count: scanSummary.highCount, cls: "severity-high" },
                      { label: "Medio", count: scanSummary.mediumCount, cls: "severity-medium" },
                      { label: "Bajo", count: scanSummary.lowCount, cls: "severity-low" },
                    ].map(item => (
                      <div key={item.label} className={`rounded-lg p-3 text-center ${item.cls}`}>
                        <div className="text-lg font-black">{item.count}</div>
                        <div className="text-xs">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {!scanSummary.isPaid ? (
                  <div className="bg-gradient-to-br from-primary/10 to-purple-500/5 border border-primary/30 rounded-2xl p-6 text-center cyber-glow">
                    <Lock className="w-10 h-10 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">Desbloquea el informe completo</h3>
                    <p className="text-sm text-muted-foreground mb-4">Obtén detalles técnicos, soluciones, explicaciones con IA y el PDF profesional.</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
                      {["Detalles técnicos", "Soluciones", "Explicación IA", "PDF descargable"].map(f => (
                        <span key={f} className="text-xs bg-primary/15 text-primary border border-primary/30 px-2 py-1 rounded-full">{f}</span>
                      ))}
                    </div>
                    <Button className="cyber-glow px-8 h-11 font-semibold" onClick={() => unlockReport.mutate({ scanId: scanId! })} disabled={unlockReport.isPending}>
                      {unlockReport.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</> : <><Shield className="w-4 h-4 mr-2" />Desbloquear informe — Gratis</>}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3">Pago único. Sin suscripción obligatoria.</p>
                  </div>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                    <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">Informe desbloqueado</h3>
                    <p className="text-sm text-muted-foreground mb-5">Accede al informe completo con todos los detalles técnicos y el PDF profesional.</p>
                    <Link href={`/report/${scanId}`}>
                      <Button className="px-8 h-11 font-semibold bg-green-600 hover:bg-green-700">
                        <FileText className="w-4 h-4 mr-2" />Ver informe completo<ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" className="flex-1" onClick={() => { setPhase("form"); setScanId(null); navigate("/scan"); }}>Nuevo análisis</Button>
                  <Link href="/dashboard" className="flex-1"><a><Button variant="ghost" className="w-full text-muted-foreground">Ver historial</Button></a></Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
