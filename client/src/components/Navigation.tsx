import React from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth.jsx';
import { 
  Search, 
  Bell, 
  Menu, 
  PlusCircle, 
  ChevronDown, 
  BarChartBig, 
  ClipboardList,
  Settings,
  LogOut,
  User as UserIcon
} from 'lucide-react';

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  
  const isActive = (path: string) => {
    return location.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setLocation('/')}
          >
            <BarChartBig className="h-6 w-6" />
            <span className="font-bold hidden sm:inline-block">Te Pesquisei</span>
          </div>
        </div>
        
        {user && (
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
            <Button 
              variant={isActive('/surveys') ? "default" : "ghost"} 
              onClick={() => setLocation('/surveys')}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Pesquisas
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setLocation('/surveys/create')}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Pesquisa
            </Button>
            
            {user.role === 'admin' && (
              <Button 
                variant={isActive('/admin') ? "default" : "ghost"} 
                onClick={() => setLocation('/admin')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Admin
              </Button>
            )}
          </nav>
        )}
        
        <div className="flex-1" />
        
        {user ? (
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <div className="text-sm font-medium">{user.username || user.email}</div>
              <div className="text-xs text-muted-foreground">
                {user.role === 'admin' ? 'Administrador' : 'Usuário'}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user.username || ''} />
                    <AvatarFallback>{user.username?.[0] || user.email?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/surveys')}>
                  <ClipboardList className="mr-2 h-4 w-4" /> Minhas Pesquisas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/surveys/create')}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Nova Pesquisa
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem onClick={() => setLocation('/admin')}>
                    <Settings className="mr-2 h-4 w-4" /> Painel de Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    setLocation("/login");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => setLocation('/login')}>
              Entrar
            </Button>
            <Button onClick={() => setLocation('/login')}>
              Cadastrar
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}