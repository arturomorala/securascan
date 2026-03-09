import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
      <div className="container py-12 max-w-3xl mx-auto">
        <h1 className="text-3xl font-black mb-6">Política de privacidad</h1>
        <div className="space-y-6 text-muted-foreground">
          <section><h2 className="text-lg font-bold text-foreground mb-2">Datos que recopilamos</h2><p>Recopilamos únicamente los datos necesarios para proporcionar el servicio: dirección de email, nombre de usuario y las URLs de los sitios web que analizas. No recopilamos datos de los sitios web analizados más allá de lo necesario para el análisis de seguridad.</p></section>
          <section><h2 className="text-lg font-bold text-foreground mb-2">Uso de los datos</h2><p>Tus datos se utilizan exclusivamente para proporcionar el servicio de análisis de seguridad, mejorar la plataforma y enviarte notificaciones relacionadas con tus análisis. No vendemos ni compartimos tus datos con terceros.</p></section>
          <section><h2 className="text-lg font-bold text-foreground mb-2">Almacenamiento seguro</h2><p>Todos los datos se almacenan de forma cifrada. Los informes de análisis son privados y solo accesibles por el usuario que los generó. Aplicamos las mejores prácticas de seguridad para proteger tu información.</p></section>
          <section><h2 className="text-lg font-bold text-foreground mb-2">Tus derechos</h2><p>Tienes derecho a acceder, rectificar y eliminar tus datos en cualquier momento. Para ejercer estos derechos, contacta con nosotros a través del panel de usuario o por email.</p></section>
        </div>
      </div>
    </div>
  );
}
