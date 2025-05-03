const Features = () => {
  const featureItems = [
    {
      icon: "fas fa-poll",
      title: "Surveys Personalizados",
      description: "Crie pesquisas completas com segmentação demográfica e perguntas personalizadas para seu público-alvo."
    },
    {
      icon: "fas fa-robot",
      title: "IA Avançada",
      description: "Inteligência artificial integrada para análise de dados e pesquisas por telefone automatizadas."
    },
    {
      icon: "fas fa-chart-pie",
      title: "Análise em Tempo Real",
      description: "Visualize resultados em tempo real com gráficos e estatísticas detalhadas para tomada de decisões."
    },
    {
      icon: "fas fa-users",
      title: "Gerenciamento de Pesquisadores",
      description: "Adicione pesquisadores à sua equipe e monitore o progresso de cada um em tempo real."
    },
    {
      icon: "fas fa-share-alt",
      title: "Compartilhamento Fácil",
      description: "Compartilhe pesquisas por email, SMS, WhatsApp ou link direto com apenas alguns cliques."
    },
    {
      icon: "fas fa-lock",
      title: "Segurança Garantida",
      description: "Seus dados e pesquisas são protegidos com medidas avançadas de segurança e criptografia."
    }
  ];
  
  return (
    <section id="recursos" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-montserrat mb-4">Recursos Poderosos</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Nossa plataforma oferece tudo o que você precisa para criar pesquisas profissionais e obter resultados confiáveis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureItems.map((feature, index) => (
            <div 
              key={index} 
              className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1"
            >
              <div className="bg-primary bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <i className={`${feature.icon} text-primary text-2xl`}></i>
              </div>
              <h3 className="text-xl font-bold font-montserrat mb-3">{feature.title}</h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
