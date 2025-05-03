import { Button } from "@/components/ui/button";

const AIDetails = () => {
  const features = [
    {
      icon: "fas fa-microphone",
      title: "Voz Natural",
      description: "Nossa IA utiliza tecnologia de ponta para conversas fluidas e naturais com os entrevistados, proporcionando uma experiência mais humana e engajadora."
    },
    {
      icon: "fas fa-brain",
      title: "Adaptação Contextual",
      description: "O sistema adapta perguntas com base nas respostas anteriores, criando uma experiência personalizada que aumenta a taxa de conclusão e a qualidade dos dados."
    },
    {
      icon: "fas fa-chart-line",
      title: "Análise em Tempo Real",
      description: "Obtenha insights imediatos durante a coleta de dados, identificando tendências e padrões que podem ajudar a refinar sua pesquisa rapidamente."
    },
    {
      icon: "fas fa-shield-alt",
      title: "Segurança e Conformidade",
      description: "Todas as chamadas são realizadas com total conformidade com as leis de proteção de dados, garantindo a segurança das informações e a privacidade dos entrevistados."
    }
  ];
  
  const setupSteps = [
    {
      number: 1,
      title: "Crie seu roteiro de perguntas",
      description: "Defina as perguntas que deseja fazer e as possíveis ramificações com base nas respostas."
    },
    {
      number: 2,
      title: "Adicione sua lista de contatos",
      description: "Importe seus contatos ou defina critérios demográficos para alcançar seu público-alvo."
    },
    {
      number: 3,
      title: "Personalize sua IA",
      description: "Ajuste o tom de voz, velocidade e estilo de conversa para se adequar ao seu público."
    },
    {
      number: 4,
      title: "Acompanhe em tempo real",
      description: "Monitore as chamadas e resultados à medida que são coletados para insights imediatos."
    }
  ];
  
  return (
    <section id="ai-detalhes" className="py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-montserrat mb-4">Pesquisas por Telefone com IA</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Nossa tecnologia exclusiva permite realizar pesquisas por telefone usando inteligência artificial avançada
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 mb-6 shadow-lg">
                <h3 className="text-xl font-bold font-montserrat mb-3 flex items-center">
                  <i className={`${feature.icon} text-primary mr-3`}></i>
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-xl overflow-hidden shadow-xl">
            <div className="p-8">
              <h3 className="text-2xl font-bold font-montserrat mb-6">Como configurar sua pesquisa por telefone</h3>
              
              <div className="space-y-6">
                {setupSteps.map((step) => (
                  <div key={step.number} className="flex items-start">
                    <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">
                      {step.number}
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{step.title}</h4>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button asChild className="mt-8 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-full transition duration-300 flex items-center">
                <a href="https://wa.me/5511951947025">
                  <i className="fab fa-whatsapp mr-2 text-xl"></i>
                  Fale com um especialista
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIDetails;
