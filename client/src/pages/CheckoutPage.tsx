import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const plansQuery = trpc.stripe.getPlans.useQuery();
  const checkoutMutation = trpc.stripe.createCheckout.useMutation();
  const currentSubQuery = trpc.stripe.getCurrentSubscription.useQuery();

  // Parsear session_id desde query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session_id");
    if (sid) {
      setSessionId(sid);
    }
  }, []);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Verificar estado del checkout si hay session_id
  useEffect(() => {
    if (sessionId && currentSubQuery.data) {
      toast.success("¡Pago completado! Tu suscripción está activa.");
      setTimeout(() => navigate("/dashboard"), 2000);
    }
  }, [sessionId, currentSubQuery.data, navigate]);

  const handleSelectPlan = async (planId: string) => {
    setIsProcessing(true);
    try {
      const result = await checkoutMutation.mutateAsync({ planId: planId as any });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error("Error al crear sesión de pago");
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Mostrar estado de pago procesado
  if (sessionId && currentSubQuery.data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500/10 rounded-full p-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <CardTitle>¡Pago Completado!</CardTitle>
            <CardDescription>Tu suscripción está activa</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Redirigiendo al panel de control...
            </p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Ir al Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar error de pago
  if (sessionId && !currentSubQuery.data && !currentSubQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-500/10 rounded-full p-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <CardTitle>Pago No Completado</CardTitle>
            <CardDescription>Intenta de nuevo o contacta soporte</CardDescription>
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

  // Mostrar planes disponibles
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Planes de Suscripción</h1>
          <p className="text-lg text-muted-foreground">
            Elige el plan que mejor se adapte a tus necesidades
          </p>
        </div>

        {plansQuery.isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plansQuery.data?.map((plan: any) => (
              <Card key={plan.planId} className="relative flex flex-col">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">/mes</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-6">
                    <Badge variant="outline" className="mb-4">
                      {plan.scans} escaneos/mes
                    </Badge>
                    <ul className="space-y-3">
                      {plan.features.map((feature: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    onClick={() => handleSelectPlan(plan.planId)}
                    disabled={isProcessing || checkoutMutation.isPending}
                    className="w-full mt-auto"
                  >
                    {isProcessing || checkoutMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Seleccionar Plan"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 bg-muted/50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">¿Necesitas más información?</h3>
          <p className="text-muted-foreground mb-4">
            Contáctanos para planes personalizados o consultas sobre nuestros servicios
          </p>
          <Button variant="outline">Contactar Ventas</Button>
        </div>
      </div>
    </div>
  );
}
