import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  animation?: 'pulse' | 'bounce' | 'shake' | 'subtle';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

// Não usaremos o framer-motion aqui para simplificar

export function AnimatedButton({
  children,
  className,
  animation = 'subtle',
  variant = 'default',
  size = 'default',
  ...props
}: AnimatedButtonProps) {
  // Adicionar classes de animação com base no tipo
  const getAnimationClass = () => {
    switch (animation) {
      case 'pulse':
        return 'hover:scale-105 active:scale-95 animate-pulse';
      case 'bounce':
        return 'hover:-translate-y-1 active:scale-95 animate-bounce';
      case 'shake':
        return 'hover:scale-105 active:scale-95 hover:animate-wiggle';
      case 'subtle':
      default:
        return 'hover:scale-105 active:scale-95 transition-transform';
    }
  };

  return (
    <Button
      className={cn("relative overflow-hidden", getAnimationClass(), className)}
      variant={variant}
      size={size}
      {...props}
    >
      {children}
    </Button>
  );
}