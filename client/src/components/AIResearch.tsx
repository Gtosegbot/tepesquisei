import { Button } from "@/components/ui/button";

const AIResearch = () => {
  return (
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 p-8 md:p-12 flex items-center">
              <div>
                <div className="inline-block bg-accent bg-opacity-10 text-accent font-semibold px-4 py-2 rounded-full mb-6">NOVO</div>
                <h2 className="text-3xl md:text-4xl font-bold font-montserrat mb-6">Pesquisas por Telefone com Inteligência Artificial</h2>
                <p className="text-lg text-gray-600 mb-8">
                  Nossa tecnologia revolucionária permite realizar pesquisas por telefone utilizando IA avançada. Automatize 
                  o processo de coleta de dados e obtenha resultados mais rapidamente.
                </p>
                <div className="space-y-4">
                  {[
                    "Realize pesquisas telefônicas automatizadas com voz natural",
                    "Alcance mais respondentes em menos tempo",
                    "Processe e analise respostas em tempo real"
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <i className="fas fa-check-circle text-green-500 mt-1"></i>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
                <Button asChild className="mt-8 bg-primary hover:bg-secondary text-white font-medium py-3 px-6 rounded-full transition duration-300">
                  <a href="#ai-detalhes">
                    Saiba Mais
                    <i className="fas fa-arrow-right ml-2"></i>
                  </a>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                alt="Pesquisas por telefone com IA" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIResearch;
