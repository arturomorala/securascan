import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center"><ShieldCheck className="w-3.5 h-3.5 text-primary" /></div>
            <span className="font-bold text-sm"><span className="gradient-text">Secura</span>Scan</span>
          </Link>
          <Link href="/"><Button variant="ghost" size="sm" className="text-xs text-muted-foreground"><ArrowLeft className="w-3.5 h-3.5 mr-1" />Inicio</Button></Link>
        </div>
      </nav>
      <div className="container py-12 max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-3xl font-black mb-6">Términos de uso</h1>
        <div className="space-y-6 text-muted-foreground">
          <section><h2 className="text-lg font-bold text-foreground mb-2">1. Uso autorizado</h2><p>SecuraScan es una herramienta de análisis de seguridad web. Al utilizar este servicio, confirmas que eres el propietario del sitio web que deseas analizar o que tienes autorización explícita del propietario para realizar el análisis.</p></section>
          <section><h2 className="text-lg font-bold text-foreground mb-2">2. Prohibiciones</h2><p>Está estrictamente prohibido utilizar SecuraScan para analizar sitios web sin autorización, realizar ataques de denegación de servicio, o cualquier actividad ilegal. El incumplimiento resultará en la suspensión inmediata de la cuenta.</p></section>
          <section><h2 className="text-lg font-bold text-foreground mb-2">3. Responsabilidad</h2><p>SecuraScan proporciona análisis automatizados de seguridad. Los resultados son orientativos y no constituyen una auditoría de seguridad completa. El usuario es responsable de implementar las correcciones necesarias.</p></section>
          <section><h2 className="text-lg font-bold text-foreground mb-2">4. Privacidad de datos</h2><p>Los informes de análisis se almacenan de forma segura y solo son accesibles por el usuario que los generó. No compartimos datos con terceros sin consentimiento explícito.</p></section>
          <section><h2 className="text-lg font-bold text-foreground mb-2">5. Pagos y reembolsos</h2><p>Los pagos por informes son no reembolsables una vez que el análisis se ha completado. En caso de error técnico por nuestra parte, ofrecemos reembolso completo o nuevo análisis sin coste.</p></section>
        </div>
      </div>
    </div>
  );
}
