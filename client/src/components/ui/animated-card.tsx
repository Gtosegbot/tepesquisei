import React from 'react';
import { Card } from './card';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  animation?: 'hover' | 'float' | 'highlight' | 'none';
  delay?: number;
}

export function AnimatedCard({
  children,
  className,
  animation = 'hover',
  delay = 0,
  ...props
}: AnimatedCardProps) {
  // Adicionar classes de animação com base no tipo
  const getAnimationClass = () => {
    switch (animation) {
      case 'hover':
        return 'hover:-translate-y-1 hover:shadow-lg transition-all duration-300';
      case 'float':
        return 'animate-float';
      case 'highlight':
        return 'hover:scale-[1.02] active:scale-[0.98] transition-transform';
      case 'none':
      default:
        return '';
    }
  };

  // Adicionar classes para animação de entrada
  const getEntranceClass = () => {
    const delayClass = delay > 0 ? `animate-delay-${Math.min(delay * 100, 500)}` : '';
    return `animate-in fade-in slide-in-from-bottom-5 duration-500 ${delayClass}`;
  };

  return (
    <Card
      className={cn(getEntranceClass(), getAnimationClass(), className)}
      {...props}
    >
      {children}
    </Card>
  );
}