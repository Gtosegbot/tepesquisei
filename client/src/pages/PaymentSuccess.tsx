import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [credits, setCredits] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const processPayment = async () => {
      try {
        // Obter os parâmetros da URL
        const params = new URLSearchParams(window.location.search);
        const paymentIntentId = params.get("payment_intent");
        const isDemo = params.get("demo") === "true";
        
        // Se for demonstração, processar como demo
        if (isDemo) {
          // Confirmar a demonstração no servidor
          const response = await apiRequest("POST", "/api/request-demo", {});
          const data = await response.json();
          
          setPaymentProcessed(true);
          setCredits(data.credits || 10);
          toast({
            title: "Demonstração ativada!",
            description: "Seus créditos de demonstração foram adicionados à sua conta.",
            variant: "default",
          });
          setIsLoading(false);
          return;
        }
        
        // Se não tivermos um payment_intent (e não for demo), não fazemos nada
        if (!paymentIntentId) {
          setIsLoading(false);
          return;
        }

        // Confirmar o pagamento no servidor
        const response = await apiRequest("POST", "/api/payment-success", {
          paymentIntentId
        });
        
        const data = await response.json();
        
        if (data.success) {
          setPaymentProcessed(true);
          setCredits(data.credits);
          toast({
            title: "Pagamento processado com sucesso!",
            description: "Os créditos foram adicionados à sua conta.",
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Erro ao processar pagamento:", error);
        toast({
          title: "Erro ao processar pagamento",
          description: "Ocorreu um erro ao processar seu pagamento. Por favor, entre em contato com o suporte.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    processPayment();
  }, [isAuthenticated, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processando seu pagamento</h2>
          <p className="text-gray-600">Aguarde enquanto confirmamos seu pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {window.location.search.includes("demo=true") 
              ? "Demonstração Ativada!" 
              : `Pagamento ${paymentProcessed ? "Confirmado" : "Recebido"}!`}
          </h1>
          
          <div className="mb-8 text-gray-600">
            {window.location.search.includes("demo=true") ? (
              <>
                <p className="mb-4">
                  Seus créditos de demonstração foram adicionados à sua conta. Agora você pode testar nossos serviços gratuitamente!
                </p>
                <div className="bg-gray-50 p-4 rounded-lg inline-block mb-4">
                  <p className="text-gray-700 font-medium">Seus créditos de demonstração:</p>
                  <p className="text-3xl font-bold text-primary">{credits.toLocaleString("pt-BR")}</p>
                </div>
              </>
            ) : paymentProcessed ? (
              <>
                <p className="mb-4">
                  Seu pagamento foi processado com sucesso e os créditos já foram adicionados à sua conta.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg inline-block mb-4">
                  <p className="text-gray-700 font-medium">Seu saldo atual de créditos:</p>
                  <p className="text-3xl font-bold text-primary">{credits.toLocaleString("pt-BR")}</p>
                </div>
              </>
            ) : (
              <>
                <p className="mb-4">
                  Recebemos seu pagamento e estamos processando a transação. Os créditos serão adicionados
                  à sua conta em breve.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg inline-block mb-4">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 mr-2 text-primary animate-spin" />
                    <span className="text-gray-700">Processando créditos...</span>
                  </div>
                </div>
              </>
            )}
            <p>
              Obrigado por confiar na TeRespondeu! Agora você pode começar a utilizar nossos serviços
              de pesquisa com IA.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="flex items-center justify-center"
            >
              <Home className="mr-2 h-4 w-4" />
              Voltar ao início
            </Button>
            
            <Button 
              onClick={() => navigate("/dashboard")}
              className="bg-primary hover:bg-primary/90"
            >
              Ir para o dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;