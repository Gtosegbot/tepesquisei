import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

interface HeaderProps {
  onLoginClick: () => void;
}

const Header = ({ onLoginClick }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <a className="text-3xl font-bold font-montserrat">
              <span className="text-primary">Te</span><span className="text-primary opacity-100">Pesquisei</span>
            </a>
          </Link>
        </div>
        
        <nav className="hidden md:flex space-x-8 font-medium">
          <a href="#recursos" className="text-gray-700 hover:text-primary transition">Recursos</a>
          <a href="#como-funciona" className="text-gray-700 hover:text-primary transition">Como Funciona</a>
          <a href="#precos" className="text-gray-700 hover:text-primary transition">Preços</a>
          <a href="#contato" className="text-gray-700 hover:text-primary transition">Contato</a>
        </nav>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <Link href="/admin">
                  <a className="hidden md:inline-block font-medium hover:text-primary transition">Admin</a>
                </Link>
              )}
              <Button 
                variant="link" 
                className="hidden md:inline-block font-medium hover:text-primary transition p-0"
                onClick={() => logout()}
              >
                Sair
              </Button>
            </>
          ) : (
            <Button 
              variant="link" 
              className="hidden md:inline-block font-medium hover:text-primary transition p-0"
              onClick={onLoginClick}
            >
              Login
            </Button>
          )}
          <a href="#precos" className="bg-primary hover:bg-secondary text-white font-medium py-2 px-4 rounded-full transition duration-300 transform hover:scale-105 opacity-100">Solicitar Demonstração</a>
          <button className="md:hidden text-gray-700 focus:outline-none" onClick={toggleMobileMenu}>
            <i className="fas fa-bars text-2xl"></i>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} bg-white w-full absolute left-0 top-full border-t border-gray-100 shadow-lg`}>
        <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">
          <a href="#recursos" className="text-gray-700 hover:text-primary py-2 transition" onClick={() => setIsMobileMenuOpen(false)}>Recursos</a>
          <a href="#como-funciona" className="text-gray-700 hover:text-primary py-2 transition" onClick={() => setIsMobileMenuOpen(false)}>Como Funciona</a>
          <a href="#precos" className="text-gray-700 hover:text-primary py-2 transition" onClick={() => setIsMobileMenuOpen(false)}>Preços</a>
          <a href="#contato" className="text-gray-700 hover:text-primary py-2 transition" onClick={() => setIsMobileMenuOpen(false)}>Contato</a>
          
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <Link href="/admin">
                  <a className="text-gray-700 hover:text-primary py-2 transition" onClick={() => setIsMobileMenuOpen(false)}>Admin</a>
                </Link>
              )}
              <Button 
                variant="link" 
                className="text-gray-700 hover:text-primary py-2 transition justify-start p-0 h-auto"
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
              >
                Sair
              </Button>
            </>
          ) : (
            <Button 
              variant="link" 
              className="text-gray-700 hover:text-primary py-2 transition justify-start p-0 h-auto"
              onClick={() => {
                onLoginClick();
                setIsMobileMenuOpen(false);
              }}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
