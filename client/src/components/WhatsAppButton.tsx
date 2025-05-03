const WhatsAppButton = () => {
  return (
    <a 
      href="https://wa.me/5511951947025" 
      className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition duration-300 transform hover:scale-110 z-50"
      aria-label="Contato por WhatsApp"
    >
      <i className="fab fa-whatsapp text-3xl"></i>
    </a>
  );
};

export default WhatsAppButton;
