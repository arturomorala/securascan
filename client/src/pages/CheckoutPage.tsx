import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState as useStateReact } from "react";

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useStateReact(false);
  const [paymentStatus, setPaymentStatus] = useStateReact<"idle" | "success" | "error">("idle");

  const oneTimeScanMutation = trpc.stripe.createOneTimeScanCheckout.useMutation();
  const proCheckoutMutation = trpc.stripe.createProCheckout.useMutation();
  const businessCheckoutMutation = trpc.stripe.createBusinessCheckout.useMutation();
  const businessAnnualCheckoutMutation = trpc.stripe.createBusinessAnnualCheckout.useMutation();

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Verificar parámetros de pago en URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    const plan = params.get("plan");
    const billing = params.get("billing");
    
    if (status === "success") {
      setPaymentStatus("success");
      toast.success("¡Pago completado exitosamente!");
      setTimeout(() => navigate("/scan"), 2000);
    } else if (status === "cancelled") {
      setPaymentStatus("error");
      toast.error("El pago fue cancelado");
    }

    // Si viene con plan específico, procesar automáticamente
    if (plan && isAuthenticated) {
      handlePlanCheckout(plan, billing || "month");
    }
  }, [navigate, isAuthenticated]);

  const handlePlanCheckout = async (plan: string, billing: string = "month") => {
    setIsProcessing(true);
    try {
      let result;
      if (plan === "one_time") {
        result = await oneTimeScanMutation.mutateAsync();
      } else if (plan === "pro") {
        result = await proCheckoutMutation.mutateAsync();
      } else if (plan === "business") {
        if (billing === "year") {
          result = await businessAnnualCheckoutMutation.mutateAsync();
        } else {
          result = await businessCheckoutMutation.mutateAsync();
        }
      }
      
      if (result?.checkoutUrl) {
        window.open(result.checkoutUrl, "_blank");
      }
    } catch (error) {
      toast.error("Error al crear sesión de pago");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOneTimeScan = async () => {
    await handlePlanCheckout("one_time");
  };

  const handleProPlan = async () => {
    await handlePlanCheckout("pro");
  };

  const handleBusinessPlan = async () => {
    await handlePlanCheckout("business", "month");
  };

  const handleBusinessAnnual = async () => {
    await handlePlanCheckout("business", "year");
  };

  if (!isAuthenticated) {
    return null;
  }

  // Mostrar estado de pago exitoso
  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-24">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500/10 rounded-full p-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <CardTitle>¡Pago Completado!</CardTitle>
            <CardDescription>Tu pago ha sido procesado exitosamente</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Redirigiendo a tu próximo escaneo...
            </p>
            <Button onClick={() => navigate("/scan")} className="w-full">
              Ir a Escanear
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar error de pago
  if (paymentStatus === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-24">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-500/10 rounded-full p-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <CardTitle>Pago Cancelado</CardTitle>
            <CardDescription>Intenta de nuevo o elige otro plan</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/pricing")} className="w-full">
              Volver a Planes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar resumen de pago antes de procesar
  return (
    <div className="min-h-screen bg-background py-12 px-4 pt-24">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Resumen de Pago</h1>
          <p className="text-lg text-muted-foreground">
            Revisa los detalles de tu compra antes de proceder
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Detalles de la Compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-muted-foreground">Usuario:</span>
              <span className="font-medium">{user?.name || user?.email}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-muted-foreground">Moneda:</span>
              <span className="font-medium">EUR (€)</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* One-Time Scan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">One-Time Scan</CardTitle>
              <CardDescription>Escaneo único de seguridad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Precio:</span>
                <span className="text-primary">€4,99</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>✓ Escaneo único de vulnerabilidades</li>
                <li>✓ Puntuación de seguridad 0-100</li>
                <li>✓ Clasificación por severidad</li>
              </ul>
              <Button
                onClick={handleOneTimeScan}
                disabled={isProcessing || oneTimeScanMutation.isPending}
                className="w-full"
              >
                {isProcessing || oneTimeScanMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Pagar €4,99"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Plan Pro</CardTitle>
              <CardDescription>Suscripción mensual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Precio mensual:</span>
                <span className="text-primary">€29,99</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>✓ Escaneos ilimitados</li>
                <li>✓ Detalles técnicos completos</li>
                <li>✓ Reportes PDF</li>
                <li>✓ Explicaciones IA</li>
              </ul>
              <Button
                onClick={handleProPlan}
                disabled={isProcessing || proCheckoutMutation.isPending}
                className="w-full"
              >
                {isProcessing || proCheckoutMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Pagar €29,99/mes"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Business Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Plan Business</CardTitle>
              <CardDescription>Suscripción empresarial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {/* Monthly Option */}
                <div className="border border-border/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-semibold">Mensual</p>
                      <p className="text-sm text-muted-foreground">Renovación automática cada mes</p>
                    </div>
                    <span className="text-lg font-bold text-primary">€79,99</span>
                  </div>
                  <Button
                    onClick={handleBusinessPlan}
                    disabled={isProcessing || businessCheckoutMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {isProcessing || businessCheckoutMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Pagar €79,99/mes"
                    )}
                  </Button>
                </div>

                {/* Annual Option */}
                <div className="border-2 border-primary/50 rounded-lg p-4 relative">
                  <Badge className="absolute -top-2 -right-2 bg-green-500 text-white">Ahorra 15%</Badge>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-semibold">Anual</p>
                      <p className="text-sm text-muted-foreground">Renovación automática cada año</p>
                    </div>
                    <span className="text-lg font-bold text-primary">€815,88</span>
                  </div>
                  <p className="text-xs text-green-400 mb-3">Ahorras €144,12 comparado con pago mensual</p>
                  <Button
                    onClick={handleBusinessAnnual}
                    disabled={isProcessing || businessAnnualCheckoutMutation.isPending}
                    className="w-full cyber-glow"
                  >
                    {isProcessing || businessAnnualCheckoutMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Pagar €815,88/año"
                    )}
                  </Button>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-muted-foreground mt-4">
                <li>✓ Escaneos ilimitados</li>
                <li>✓ Todos los features de Pro</li>
                <li>✓ Monitorización automática</li>
                <li>✓ Acceso multiusuario</li>
                <li>✓ Soporte prioritario</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
          <p>Serás redirigido a Stripe para completar el pago de forma segura.</p>
          <p className="mt-2">Para testing, usa tarjeta: 4242 4242 4242 4242</p>
        </div>
      </div>
    </div>
  );
}
