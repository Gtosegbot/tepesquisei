import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, CreditCard } from "lucide-react";

// Certifique-se que a chave pública do Stripe está disponível
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Chave pública do Stripe não encontrada");
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ amount, planName, onSuccess }: { amount: number; planName: string; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/payment-success",
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message || "Ocorreu um erro no processamento do pagamento");
      toast({
        title: "Erro no pagamento",
        description: error.message || "Ocorreu um erro no processamento do pagamento",
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      toast({
        title: "Pagamento realizado com sucesso!",
        description: "Seus créditos serão adicionados em instantes",
        variant: "default",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {errorMessage}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isProcessing}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing} 
          className="bg-primary hover:bg-primary/90"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Processando...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Finalizar Pagamento
            </>
          )}
        </Button>
      </div>
      
      <div className="text-center text-sm text-gray-500 flex items-center justify-center mt-4">
        <ShieldCheck className="h-4 w-4 mr-2 text-green-500" />
        Pagamento seguro via Stripe
      </div>
    </form>
  );
};

const Checkout = () => {
  const [location, navigate] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState<{name: string; credits: number; price: number} | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "pix" | "paypal" | "demo">("stripe");
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  // Parâmetros da URL para obter o plano selecionado e método de pagamento
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const planId = searchParams.get("plan");
  const methodParam = searchParams.get("method");
  
  // Definição dos planos
  const plans = {
    "inicial": { name: "Pacote Inicial", credits: 3000, price: 3000 },
    "profissional": { name: "Pacote Profissional", credits: 5000, price: 5000 },
    "empresarial": { name: "Pacote Empresarial", credits: 10000, price: 10000 },
    "demo": { name: "Demonstração", credits: 10, price: 0 } // Plano de demonstração
  };
  
  useEffect(() => {
    // Verificar se o usuário está autenticado
    if (!isAuthenticated) {
      toast({
        title: "Acesso restrito",
        description: "Você precisa estar logado para continuar",
        variant: "destructive",
      });
      navigate("/login?redirect=/checkout?plan=" + planId);
      return;
    }
    
    // Verificar se o plano é válido
    if (!planId) {
      toast({
        title: "Plano não especificado",
        description: "Por favor, selecione um plano",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    // Usar plano demo se o paramêtro method=demo for usado
    const actualPlanId = (methodParam === "demo") ? "demo" : planId;
    
    if (!plans[actualPlanId as keyof typeof plans]) {
      toast({
        title: "Plano inválido",
        description: "Por favor, selecione um plano válido",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    setPlan(plans[actualPlanId as keyof typeof plans]);
    
    // Definir o método de pagamento a partir do parâmetro URL
    if (methodParam === "demo" || planId === "demo") {
      setPaymentMethod("demo");
    } else if (methodParam === "pix") {
      setPaymentMethod("pix");
    } else if (methodParam === "paypal") {
      setPaymentMethod("paypal");
    } else {
      setPaymentMethod("stripe");
    }
    
    // Se for demonstração, processar diretamente
    if (planId === "demo" || methodParam === "demo") {
      handleDemoRequest();
      return;
    }
    
    // Criar a intenção de pagamento
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        const actualPlanId = (methodParam === "demo") ? "demo" : planId;
        const selectedPlan = plans[actualPlanId as keyof typeof plans];
        
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          amount: selectedPlan.price,
          planName: selectedPlan.name
        });
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Erro ao criar intenção de pagamento:", error);
        toast({
          title: "Erro ao iniciar pagamento",
          description: "Não foi possível iniciar o processo de pagamento",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    createPaymentIntent();
  }, [isAuthenticated, planId, methodParam, location, navigate, toast]);
  
  // Função para processar o pedido de demonstração
  const handleDemoRequest = async () => {
    try {
      setIsLoading(true);
      await apiRequest("POST", "/api/request-demo", {});
      navigate("/payment-success?demo=true");
    } catch (error) {
      console.error("Erro ao processar solicitação de demonstração:", error);
      toast({
        title: "Erro ao processar demonstração",
        description: "Não foi possível processar sua solicitação de demonstração",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePaymentSuccess = () => {
    navigate("/payment-success");
  };
  
  if (isLoading || !plan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Preparando seu pagamento...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finalizar Compra</h1>
          <p className="text-gray-600 mt-2">Complete o pagamento para adquirir seus créditos</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Resumo do Pedido</h2>
          <div className="flex justify-between py-3 border-b">
            <span className="font-medium">{plan.name}</span>
            <span className="text-gray-900">R$ {plan.price.toLocaleString("pt-BR")}</span>
          </div>
          <div className="flex justify-between py-3 border-b">
            <span className="font-medium">Créditos</span>
            <span className="text-gray-900">{plan.credits.toLocaleString("pt-BR")} créditos</span>
          </div>
          <div className="flex justify-between py-3 font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">R$ {plan.price.toLocaleString("pt-BR")}</span>
          </div>
        </div>
        
        {/* Mostrar opções de pagamento se não for demonstração */}
        {paymentMethod !== "demo" && plan.price > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Escolha o método de pagamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className={`border rounded-lg p-4 cursor-pointer text-center hover:shadow-md transition-all ${paymentMethod === "stripe" ? "border-primary bg-primary/5" : "border-gray-200"}`}
                onClick={() => {
                  setPaymentMethod("stripe");
                  navigate(`/checkout?plan=${planId}&method=stripe`);
                }}
              >
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Cartão de Crédito</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer text-center hover:shadow-md transition-all ${paymentMethod === "pix" ? "border-primary bg-primary/5" : "border-gray-200"}`}
                onClick={() => {
                  setPaymentMethod("pix");
                  navigate(`/checkout?plan=${planId}&method=pix`);
                }}
              >
                <svg className="h-8 w-8 mx-auto mb-2 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.5 1.5L3.5 7.5L7.5 11.5L13.5 5.5L9.5 1.5ZM15.5 7.5L9.5 13.5L13.5 17.5L19.5 11.5L15.5 7.5ZM7.5 13.5L1.5 19.5L5.5 23.5L11.5 17.5L7.5 13.5ZM13.5 13.5L17.5 17.5L23.5 11.5L19.5 7.5L13.5 13.5Z" />
                </svg>
                <p className="font-medium">PIX</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer text-center hover:shadow-md transition-all ${paymentMethod === "paypal" ? "border-primary bg-primary/5" : "border-gray-200"}`}
                onClick={() => {
                  setPaymentMethod("paypal");
                  navigate(`/checkout?plan=${planId}&method=paypal`);
                }}
              >
                <svg className="h-8 w-8 mx-auto mb-2 text-[#003087]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.76 3.9-3.339 6.127-7.316 6.127H9.169c-.285 0-.468.186-.519.446L7.011 23.33a.794.794 0 0 0 .784.91h4.6c.548 0 1.015-.397 1.1-.937l.459-2.885c.086-.542.554-.938 1.102-.938h.7c4.47 0 7.12-2.28 8.035-6.75.315-1.538.36-2.82-.568-3.813z"/>
                </svg>
                <p className="font-medium">PayPal</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Conteúdo específico para cada método de pagamento */}
        {paymentMethod === "stripe" && clientSecret && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Pagar com Cartão de Crédito</h2>
            <Elements stripe={stripePromise} options={{ clientSecret, locale: "pt-BR" }}>
              <CheckoutForm 
                amount={plan.price} 
                planName={plan.name} 
                onSuccess={handlePaymentSuccess} 
              />
            </Elements>
          </div>
        )}
        
        {paymentMethod === "pix" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Pagar com PIX</h2>
            
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-medium text-yellow-800">Solicite seu link PIX personalizado</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    Para realizar o pagamento via PIX, entre em contato com nosso suporte pelo WhatsApp para receber um link PIX personalizado para o seu plano.
                  </p>
                  <a 
                    href={`https://wa.me/5511951947025?text=Olá!%20Gostaria%20de%20solicitar%20um%20link%20PIX%20para%20o%20plano%20${plan.name}%20no%20valor%20de%20R$${plan.price}.`}
                    className="inline-flex items-center mt-2 text-green-600 font-medium text-sm hover:text-green-700"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Solicitar Link PIX
                  </a>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center mb-6 space-y-4">
              <div className="w-64 h-64 bg-white p-4 border rounded-lg flex items-center justify-center">
                {/* Logo PIX */}
                <svg className="w-32 h-32" viewBox="0 0 512 512" fill="#32BCAD" xmlns="http://www.w3.org/2000/svg">
                  <path d="M112.57 391.19c20.056 0 38.928-7.808 53.12-22l76.693-76.692c5.385-5.404 14.765-5.384 20.15 0l76.989 76.989c14.191 14.172 33.045 21.98 53.12 21.98h15.098l-97.138-97.139c-30.326-30.344-79.505-30.344-109.85 0l-97.415 97.415h9.232zm280.21-271.41c-20.056 0-38.929 7.809-53.12 22l-76.97 76.99c-5.551 5.53-14.6 5.53-20.15 0l-76.97-76.97c-14.192-14.193-33.046-22-53.121-22h-9.232l97.415 97.415c30.344 30.344 79.523 30.344 109.867 0l97.139-97.139h-15.098zm54.12 135.7c0-11.707-4.62-22.425-12.502-30.327l-40.264-40.264h-24.35c6.308 0 12.254 2.46 16.73 6.917l60.385 60.365v3.31zm-406.38-70.59l-40.264 40.263c-7.863 7.883-12.483 18.62-12.483 30.327v3.31l60.365-60.365c4.475-4.476 10.422-6.936 16.73-6.936h-24.35zm24.35 105.59h24.349c-6.308 0-12.254-2.46-16.73-6.936L12.502 223.399v-3.288l40.264 40.244c7.883 7.883 18.62 12.502 30.327 12.502zm358.02 0c11.726 0 22.425-4.619 30.326-12.502l40.264-40.264v3.31l-60.365 60.365c-4.475 4.456-10.422 6.917-16.73 6.917h24.35z"/>
                </svg>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg w-full max-w-md">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">CNPJ (Chave PIX)</span>
                  <div className="flex items-center">
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">12828011/0001-43</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 h-8 w-8 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText("12828011/0001-43");
                        toast({
                          title: "Copiado!",
                          description: "Chave PIX copiada para a área de transferência",
                        });
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span className="sr-only">Copiar</span>
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Valor</span>
                  <span className="font-bold text-primary">R$ {plan.price.toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-medium">Beneficiário</span>
                  <span>Gtoseg</span>
                </div>
              </div>
              
              <div className="mt-4 space-y-4 text-center w-full">
                <p className="text-sm text-gray-600">
                  Depois de fazer o pagamento, por favor clique no botão abaixo para confirmar
                </p>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => {
                    // Simular verificação de pagamento
                    setIsLoading(true);
                    setTimeout(() => {
                      setIsLoading(false);
                      // Fazer chamada para API para confirmar pagamento
                      apiRequest("POST", "/api/create-pix-payment", {
                        planId: planId,
                        amount: plan.price
                      }).then(() => {
                        navigate("/payment-success");
                      }).catch(error => {
                        toast({
                          title: "Erro na confirmação",
                          description: "Não foi possível confirmar seu pagamento. Por favor, tente novamente mais tarde.",
                          variant: "destructive",
                        });
                      });
                    }, 2000);
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Verificando pagamento...
                    </>
                  ) : "Confirmar Pagamento PIX"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setPaymentMethod("stripe")}
                >
                  Voltar para Cartão de Crédito
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {paymentMethod === "paypal" && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Pagar com PayPal</h2>
            <p className="mb-4">Em breve implementaremos esta opção de pagamento. Por favor, escolha outra forma de pagamento.</p>
            <Button 
              onClick={() => setPaymentMethod("stripe")}
              className="bg-primary hover:bg-primary/90"
            >
              Voltar para Cartão de Crédito
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;