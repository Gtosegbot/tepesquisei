import { Link } from 'wouter';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12" id="contato">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="text-2xl font-bold font-montserrat mb-4 inline-block no-underline">
              <span className="text-white">Te</span><span className="text-accent">Pesquisei</span>
            </Link>
            <p className="text-gray-400 mb-4">
              Plataforma profissional para pesquisas políticas, mercadológicas e de opinião com inteligência artificial.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <i className="fab fa-twitter"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Plataforma</h3>
            <ul className="space-y-2">
              <li><a href="#recursos" className="text-gray-400 hover:text-white transition">Recursos</a></li>
              <li><a href="#como-funciona" className="text-gray-400 hover:text-white transition">Como Funciona</a></li>
              <li><a href="#precos" className="text-gray-400 hover:text-white transition">Preços</a></li>
              <li><a href="#ai-detalhes" className="text-gray-400 hover:text-white transition">Pesquisas com IA</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Empresa</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">Sobre Nós</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Carreiras</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Imprensa</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Contato</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt text-accent mt-1 mr-2"></i>
                <span className="text-gray-400">São Paulo, SP - Brasil</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-phone-alt text-accent mt-1 mr-2"></i>
                <a href="tel:+5511951947025" className="text-gray-400 hover:text-white transition">+55 (11) 95194-7025</a>
              </li>
              <li className="flex items-start">
                <i className="fas fa-envelope text-accent mt-1 mr-2"></i>
                <a href="mailto:contato@tepesquisei.shop" className="text-gray-400 hover:text-white transition">contato@tepesquisei.shop</a>
              </li>
              <li className="flex items-start">
                <i className="fab fa-whatsapp text-accent mt-1 mr-2"></i>
                <a href="https://wa.me/5511951947025" className="text-gray-400 hover:text-white transition">WhatsApp Business</a>
              </li>
            </ul>
          </div>
        </div>
        
        <hr className="border-gray-800 my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 mb-4 md:mb-0">
            <p>&copy; {new Date().getFullYear()} Te Pesquisei. Todos os direitos reservados.</p>
            <p className="text-sm mt-1">Gtoseg - CNPJ: 12828011/0001-43</p>
          </div>
          <div className="flex space-x-6">
            <Link href="/politicas" className="text-gray-400 hover:text-white transition">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="text-gray-400 hover:text-white transition">
              Termos de Serviço
            </Link>
            <a href="https://wa.me/5511951947025" className="text-gray-400 hover:text-white transition">
              Suporte
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
