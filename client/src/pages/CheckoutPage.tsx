import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState as useStateReact } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useStateReact(false);
  const [paymentStatus, setPaymentStatus] = useStateReact<"idle" | "success" | "error">("idle");

  const utils = trpc.useUtils();
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
      toast.success(t("checkout.payment_successful"));
      // Refetch user data to get updated subscription plan
      utils.auth.me.refetch();
      // Wait longer for webhook to process
      setTimeout(() => navigate("/scan"), 3000);
    } else if (status === "cancelled") {
      setPaymentStatus("error");
      toast.error(t("checkout.payment_cancelled"));
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

  // Admin users don't need to pay - redirect to scan page automatically
  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/scan");
    }
  }, [user?.role, navigate]);

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
            <CardTitle>{t("checkout.payment_completed")}</CardTitle>
            <CardDescription>{t("checkout.payment_successful")}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              {t("checkout.redirecting")}
            </p>
            <Button onClick={() => navigate("/scan")} className="w-full">
              {t("checkout.go_to_scan")}
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
            <CardTitle>{t("checkout.payment_cancelled")}</CardTitle>
            <CardDescription>{t("checkout.try_again")}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/pricing")} className="w-full">
              {t("checkout.back_to_plans")}
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
          <h1 className="text-4xl font-bold mb-4">{t("checkout.title")}</h1>
          <p className="text-lg text-muted-foreground">
            {t("checkout.subtitle")}
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("checkout.purchase_details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-muted-foreground">{t("checkout.user_label")}:</span>
              <span className="font-medium">{user?.name || user?.email}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-muted-foreground">{t("checkout.email_label")}:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-muted-foreground">{t("checkout.currency_label")}:</span>
              <span className="font-medium">EUR (€)</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* One-Time Scan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t("checkout.one_time_scan_title")}</CardTitle>
              <CardDescription>{t("checkout.one_time_scan_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>{t("checkout.price_label")}:</span>
                <span className="text-primary">€4.99</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>{t("checkout.single_scan_feature_1")}</li>
                <li>{t("checkout.single_scan_feature_2")}</li>
                <li>{t("checkout.single_scan_feature_3")}</li>
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
                  t("checkout.pay_button")
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t("checkout.pro_plan_title")}</CardTitle>
              <CardDescription>{t("checkout.pro_plan_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>{t("checkout.monthly_price_label")}:</span>
                <span className="text-primary">€29.99</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>{t("checkout.pro_features_1")}</li>
                <li>{t("checkout.pro_features_2")}</li>
                <li>{t("checkout.pro_features_3")}</li>
                <li>{t("checkout.pro_features_4")}</li>
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
                  t("checkout.pro_pay_button")
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Business Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t("checkout.business_plan_title")}</CardTitle>
              <CardDescription>{t("checkout.business_plan_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {/* Monthly Option */}
                <div className="border border-border/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-semibold">{t("checkout.business_monthly_label")}</p>
                      <p className="text-sm text-muted-foreground">{t("checkout.business_monthly_desc")}</p>
                    </div>
                    <span className="text-lg font-bold text-primary">€79.99</span>
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
                      t("checkout.business_monthly_pay")
                    )}
                  </Button>
                </div>

                {/* Annual Option */}
                <div className="border-2 border-primary/50 rounded-lg p-4 relative">
                  <Badge className="absolute -top-2 -right-2 bg-green-500 text-white">{t("checkout.business_save_label")}</Badge>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-semibold">{t("checkout.business_annual_label")}</p>
                      <p className="text-sm text-muted-foreground">{t("checkout.business_annual_desc")}</p>
                    </div>
                    <span className="text-lg font-bold text-primary">€815.88</span>
                  </div>
                  <p className="text-xs text-green-400 mb-3">{t("checkout.business_annual_savings")}</p>
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
                      t("checkout.business_annual_pay")
                    )}
                  </Button>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-muted-foreground mt-4">
                <li>{t("checkout.business_features_1")}</li>
                <li>{t("checkout.business_features_2")}</li>
                <li>{t("checkout.business_features_3")}</li>
                <li>{t("checkout.business_features_4")}</li>
                <li>{t("checkout.business_features_5")}</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
          <p>{t("checkout.secure_redirect")}</p>
          <p className="mt-2">{t("checkout.test_card_info")}</p>
        </div>
      </div>
    </div>
  );
}
