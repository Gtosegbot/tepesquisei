import { Button } from "@/components/ui/button";

const CTA = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold font-montserrat mb-6">Transforme suas pesquisas políticas e de opinião hoje</h2>
        <p className="text-xl text-blue-100 mb-4 max-w-3xl mx-auto">
          Junte-se a centenas de empresas, políticos e pesquisadores que estão revolucionando a forma de coletar e analisar dados.
        </p>
        <p className="text-xl text-accent font-semibold mb-8 max-w-3xl mx-auto">
          Especialistas em pesquisas políticas e estudos de opinião pública
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
          <Button asChild className="bg-white text-primary hover:bg-gray-100 font-medium py-3 px-8 rounded-full transition duration-300 transform hover:scale-105 shadow-lg opacity-100">
            <a href="#precos">Solicitar Demonstração</a>
          </Button>
          <Button asChild className="bg-accent hover:bg-opacity-90 text-white font-medium py-3 px-8 rounded-full transition duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center opacity-100">
            <a href="https://wa.me/5511951947025">
              <i className="fab fa-whatsapp mr-2"></i>
              Falar com Consultor
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
