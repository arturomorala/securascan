import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Shield, Lock, Loader2, ArrowLeft } from "lucide-react";
import { ScanFormPhase } from "@/components/ScanFormPhase";
import { ScanScanningPhase } from "@/components/ScanScanningPhase";
import { ScanResultPhase } from "@/components/ScanResultPhase";

export default function ScanPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();
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
      utils.scans.getPublicSummary.invalidate({ scanId: scanId! });
    }
  }, [scanSummary?.status, scanId, utils]);

  const unlockReport = trpc.scans.unlockReport.useMutation({
    onSuccess: () => {
      toast.success("¡Informe desbloqueado!");
      utils.scans.getPublicSummary.invalidate({ scanId: scanId! });
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

  const handleNewAnalysis = () => {
    setPhase("form");
    setScanId(null);
    navigate("/scan");
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
              <Shield className="w-3.5 h-3.5 text-primary" />
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
        {phase === "form" && (
          <ScanFormPhase
            url={url}
            setUrl={setUrl}
            ownerConfirmation={ownerConfirmation}
            setOwnerConfirmation={setOwnerConfirmation}
            termsAccepted={termsAccepted}
            setTermsAccepted={setTermsAccepted}
            onSubmit={handleSubmit}
            isLoading={createScan.isPending}
          />
        )}

        {phase === "scanning" && (
          <ScanScanningPhase
            url={scanSummary?.url || url}
            progress={scanSummary?.progress ?? 0}
            currentStep={scanSummary?.currentStep || "Iniciando análisis..."}
          />
        )}

        {phase === "result" && scanSummary && (
          <ScanResultPhase
            scanSummary={scanSummary}
            userPlan={user?.subscriptionPlan || 'free'}
            scanId={scanId!}
            onNewAnalysis={handleNewAnalysis}
            onUnlock={() => unlockReport.mutate({ scanId: scanId! })}
            isUnlocking={unlockReport.isPending}
          />
        )}
      </div>
    </div>
  );
}
