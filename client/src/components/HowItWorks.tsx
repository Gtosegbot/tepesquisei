const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: "Crie sua pesquisa",
      description: "Faça login e crie uma nova pesquisa. Adicione perguntas personalizadas e configure a segmentação demográfica."
    },
    {
      number: 2,
      title: "Compartilhe com seu público",
      description: "Distribua sua pesquisa por email, SMS, WhatsApp ou link direto. Adicione pesquisadores à sua equipe se necessário."
    },
    {
      number: 3,
      title: "Analise os resultados",
      description: "Visualize os dados em tempo real com gráficos e relatórios detalhados. Exporte os resultados para análise posterior."
    }
  ];
  
  return (
    <section id="como-funciona" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-montserrat mb-4">Como Funciona</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comece a criar pesquisas profissionais em apenas 3 etapas simples
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                {step.number}
              </div>
              <h3 className="text-xl font-bold font-montserrat mb-3">{step.title}</h3>
              <p className="text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <img 
            src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
            alt="Interface do aplicativo Te Pesquisei" 
            className="rounded-lg shadow-xl mx-auto max-w-4xl" 
          />
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
