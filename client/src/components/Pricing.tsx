import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, cardAnimation, pulseAnimation } from "@/lib/animate";

const Pricing = () => {
  const [, navigate] = useLocation();
  
  const pricingPlans = [
    {
      id: "inicial",
      name: "Pacote Inicial",
      description: "Para pequenas pesquisas e testes",
      price: 3000,
      priceUnit: "único",
      features: [
        "3.000 créditos",
        "Até 300 respostas completas",
        "Análise básica de dados",
        "Suporte por email"
      ],
      isPopular: false
    },
    {
      id: "profissional",
      name: "Pacote Profissional",
      description: "Para pesquisas médias e completas",
      price: 5000,
      priceUnit: "único",
      features: [
        "5.000 créditos",
        "Até 500 respostas completas",
        "Análise avançada de dados",
        "Suporte prioritário",
        "Exportação em vários formatos"
      ],
      isPopular: true
    },
    {
      id: "empresarial",
      name: "Pacote Empresarial",
      description: "Para pesquisas de grande escala",
      price: 10000,
      priceUnit: "único",
      features: [
        "10.000 créditos",
        "Até 1.000 respostas completas",
        "Análise avançada e relatórios",
        "Suporte 24/7",
        "Integração com API",
        "Treinamento personalizado"
      ],
      isPopular: false
    },
    {
      id: "demo",
      name: "Demonstração Gratuita",
      description: "Experimente nossa plataforma",
      price: 0,
      priceUnit: "gratuito",
      features: [
        "10 créditos gratuitos",
        "Até 5 respostas completas",
        "Todas as funcionalidades",
        "Válido por 7 dias",
        "Sem compromisso"
      ],
      isPopular: false,
      isDemoButton: true
    }
  ];
  
  const handlePurchase = (planId: string) => {
    // Abrir diretamente a página de demonstração para o admin
    if (planId === "demo") {
      navigate(`/checkout?plan=${planId}&method=demo`);
      return;
    }
    navigate(`/checkout?plan=${planId}`);
  };
  
  return (
    <section id="precos" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
        >
          <h2 className="text-3xl md:text-4xl font-bold font-montserrat mb-4">Pacotes de Créditos</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Escolha o pacote que melhor atenda às suas necessidades de pesquisa política ou de opinião
          </p>
          <p className="mt-3 text-lg text-primary font-semibold max-w-3xl mx-auto">
            Especializados em pesquisas políticas e estudos de opinião pública
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button 
              onClick={() => handlePurchase("demo")}
              className="mt-4 bg-secondary hover:bg-secondary/90 text-white font-medium py-2 px-6 rounded-full transition duration-300"
            >
              Solicitar Demonstração (10 créditos grátis)
            </Button>
          </motion.div>
        </motion.div>

        <div className="bg-white p-4 rounded-lg border-2 border-red-500 mb-8 max-w-3xl mx-auto">
          <div className="flex items-start space-x-4">
            <div className="bg-red-500 text-white p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-600">Importante: Solicite seu link de pagamento</h3>
              <p className="text-gray-700 mt-1">Para adquirir qualquer plano, entre em contato via WhatsApp para receber seu link de pagamento personalizado.</p>
              <a 
                href="https://wa.me/5511951947025?text=Olá!%20Gostaria%20de%20solicitar%20um%20link%20de%20pagamento%20para%20o%20plano%20da%20plataforma%20Te%20Pesquisei."
                className="inline-flex items-center mt-2 text-green-600 font-medium hover:text-green-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Solicitar link de pagamento
              </a>
            </div>
          </div>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {pricingPlans.map((plan, index) => (
            <motion.div 
              key={index}
              variants={fadeInUp}
              whileHover={{ 
                y: -10,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`${
                plan.isPopular ? "bg-primary text-white" : "bg-gray-50"
              } rounded-2xl overflow-hidden shadow-lg relative`}
            >
              {plan.isPopular && (
                <motion.div 
                  className="absolute top-0 right-0 bg-accent text-white font-medium px-4 py-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  MAIS POPULAR
                </motion.div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold font-montserrat mb-2">{plan.name}</h3>
                <p className={`${plan.isPopular ? "text-blue-100" : "text-gray-600"} mb-6`}>{plan.description}</p>
                
                <div className="flex items-baseline mb-8">
                  <span className="text-4xl font-bold">R${plan.price}</span>
                  <span className={`${plan.isPopular ? "text-blue-100" : "text-gray-600"} ml-2`}>/ {plan.priceUnit}</span>
                </div>
                
                <motion.ul 
                  className="space-y-3 mb-8"
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                >
                  {plan.features.map((feature, featureIndex) => (
                    <motion.li 
                      key={featureIndex} 
                      className="flex items-center"
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        visible: { 
                          opacity: 1, 
                          x: 0,
                          transition: {
                            delay: featureIndex * 0.1 + 0.3,
                            duration: 0.3
                          }
                        }
                      }}
                    >
                      <i className={`fas fa-check ${plan.isPopular ? "text-accent" : "text-green-500"} mr-2`}></i>
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </motion.ul>
                
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button 
                    onClick={() => handlePurchase(plan.id)}
                    className={`w-full ${
                      plan.isPopular 
                        ? "bg-white hover:bg-gray-100 text-primary dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700" 
                        : "bg-accent hover:bg-accent/90 text-white"
                    } font-medium py-3 px-6 rounded-full transition duration-300`}
                    variant={plan.isPopular ? "outline" : "default"}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Comprar Agora
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          viewport={{ once: true }}
        >
          <p className="text-gray-600 mb-4">Precisa de um plano personalizado para sua empresa?</p>
          <motion.a 
            href="https://wa.me/5511951947025" 
            className="inline-flex items-center text-primary font-medium hover:text-secondary transition"
            whileHover={{ scale: 1.05, x: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <i className="fab fa-whatsapp mr-2"></i>
            Entre em contato para um orçamento personalizado
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
