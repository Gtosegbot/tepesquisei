/**
 * Biblioteca de animações e micro-interações para o Te Pesquisei
 * Utiliza framer-motion para criar animações fluidas e consistentes
 */

// Efeitos de entrada gerais - para cards, sections, etc.
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.4 }
  }
};

export const fadeInUp = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export const fadeInDown = {
  hidden: { 
    opacity: 0, 
    y: -20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Animação específica para componentes de lista
export const listItem = {
  hidden: { 
    opacity: 0, 
    x: -20 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// Animação para botões e controles interativos
export const pulseAnimation = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.03,
    transition: { 
      duration: 0.2,
      ease: "easeInOut"
    }
  },
  tap: { 
    scale: 0.97,
    transition: { 
      duration: 0.1,
      ease: "easeInOut"
    }
  }
};

// Animação para cards e containers
export const cardAnimation = {
  initial: { 
    scale: 1,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
  },
  hover: { 
    scale: 1.02,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: { 
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};

// Animação para exibição de detalhes ou paineis expansíveis
export const expandAnimation = {
  collapsed: { 
    height: 0,
    opacity: 0,
    overflow: "hidden"
  },
  expanded: { 
    height: "auto",
    opacity: 1,
    transition: {
      height: {
        duration: 0.3,
        ease: "easeOut"
      },
      opacity: {
        duration: 0.4,
        delay: 0.1
      }
    }
  }
};

// Animações para feedback visual
export const successAnimation = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.175, 0.885, 0.32, 1.275] // Efeito bounce suave
    }
  }
};

export const notificationAnimation = {
  initial: { opacity: 0, y: -20, scale: 0.9 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scale: 0.9,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

// Utilitários de animação de página
export const pageTransition = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};

// Efeito de carregamento
export const loadingDots = {
  initial: { opacity: 0 },
  animate: {
    opacity: [0.2, 1, 0.2],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut" 
    }
  }
};

// Animação de entrada para questionários
export const questionAnimation = {
  hidden: { 
    opacity: 0, 
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};