const Testimonials = () => {
  const testimonials = [
    {
      name: "Carolina Silva",
      role: "Gerente de Marketing",
      image: "https://randomuser.me/api/portraits/women/32.jpg",
      rating: 5,
      comment: "A plataforma transformou nossa maneira de fazer pesquisas de mercado. Os recursos de IA são impressionantes e os resultados nos ajudaram a tomar decisões mais fundamentadas."
    },
    {
      name: "Ricardo Oliveira",
      role: "CEO de E-commerce",
      image: "https://randomuser.me/api/portraits/men/42.jpg",
      rating: 5,
      comment: "As pesquisas por telefone com IA são revolucionárias. Conseguimos coletar dados de milhares de clientes em tempo recorde, com uma qualidade superior a qualquer outro método que já usamos."
    },
    {
      name: "Ana Martins",
      role: "Pesquisadora Acadêmica",
      image: "https://randomuser.me/api/portraits/women/58.jpg",
      rating: 4.5,
      comment: "Como pesquisadora, valorizo muito a precisão e a qualidade dos dados. Esta plataforma oferece ferramentas incríveis para segmentação e análise que tornaram meu trabalho muito mais eficiente."
    }
  ];
  
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="fas fa-star"></i>);
    }
    
    if (hasHalfStar) {
      stars.push(<i key="half" className="fas fa-star-half-alt"></i>);
    }
    
    return stars;
  };
  
  return (
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-montserrat mb-4">O Que Nossos Clientes Dizem</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Conheça as experiências de quem já utiliza nossa plataforma
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <img src={testimonial.image} alt={testimonial.name} className="w-16 h-16 rounded-full mr-4" />
                <div>
                  <h4 className="font-bold">{testimonial.name}</h4>
                  <p className="text-gray-600">{testimonial.role}</p>
                </div>
              </div>
              <div className="text-yellow-400 flex mb-4">
                {renderStars(testimonial.rating)}
              </div>
              <p className="text-gray-600">
                "{testimonial.comment}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
