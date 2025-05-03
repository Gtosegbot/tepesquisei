import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="bg-gradient-to-r from-primary to-secondary text-white py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold font-montserrat leading-tight mb-6">
            Transforme sua pesquisa de mercado com inteligência artificial
          </h1>
          <p className="text-lg md:text-xl mb-4 text-gray-100">
            Crie, gerencie e analise pesquisas de mercado, políticas e de opinião com facilidade e obtenha insights valiosos para o crescimento do seu negócio ou campanha.
          </p>
          <p className="text-lg md:text-xl mb-8 text-accent font-semibold">
            Especialistas em pesquisas políticas e estudos de opinião pública
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button asChild 
              className="bg-accent hover:bg-opacity-90 text-white text-center font-medium py-3 px-6 rounded-full transition duration-300 transform hover:scale-105 shadow-lg opacity-100"
            >
              <a href="#precos">Solicitar Demonstração</a>
            </Button>
            <Button asChild 
              className="bg-white text-primary hover:bg-gray-100 text-center font-medium py-3 px-6 rounded-full transition duration-300 transform hover:scale-105 shadow-lg"
            >
              <a href="#como-funciona">Saiba como funciona</a>
            </Button>
          </div>
        </div>
        <div className="md:w-1/2">
          <img 
            src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
            alt="Interface da aplicação Te Pesquisei" 
            className="w-full h-auto rounded-lg shadow-2xl" 
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
