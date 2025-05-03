import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import Checkout from "@/pages/Checkout";
import PaymentSuccess from "@/pages/PaymentSuccess";
import SurveyList from "@/pages/SurveyList";
import SurveyEditor from "@/pages/SurveyEditor";
import SurveyResults from "@/pages/SurveyResults";
import SurveySharePage from "@/pages/SurveyShare";
import SurveyPublic from "@/pages/SurveyPublic";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import WhatsAppButton from "@/components/WhatsAppButton";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "./lib/auth.jsx";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />
      <Route path="/admin" component={Admin} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      
      {/* Rotas de pesquisas (autenticadas) */}
      <Route path="/surveys" component={SurveyList} />
      <Route path="/surveys/create" component={SurveyEditor} />
      <Route path="/surveys/:id/edit" component={SurveyEditor} />
      <Route path="/surveys/:id/results" component={SurveyResults} />
      <Route path="/surveys/:id/share" component={SurveySharePage} />
      
      {/* Rota pública para responder pesquisa */}
      <Route path="/s/:shareCode" component={SurveyPublic} />
      
      {/* Páginas institucionais */}
      <Route path="/termos" component={Terms} />
      <Route path="/politicas" component={PrivacyPolicy} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1">
            <Router />
          </main>
          <WhatsAppButton />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
