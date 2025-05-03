import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(1, { message: "Digite sua senha" }),
});

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    const success = await login(values.email, values.password);
    
    if (success) {
      onClose();
      navigate("/");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
        
        <h3 className="text-2xl font-bold font-montserrat mb-6 text-center">Acesso ao Painel</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Sua senha" {...field} />
                  </FormControl>
                  <a href="#" className="text-sm text-primary hover:text-secondary block mt-1">Esqueceu sua senha?</a>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-secondary text-white font-medium py-3 px-4 rounded-lg transition duration-300"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Form>
        
        <div className="my-4 flex items-center">
          <hr className="flex-grow border-gray-300" />
          <span className="px-4 text-gray-500 text-sm">OU</span>
          <hr className="flex-grow border-gray-300" />
        </div>
        
        <Button 
          type="button" 
          variant="outline"
          className="w-full flex items-center justify-center"
          onClick={() => {
            toast({
              title: "Google Login",
              description: "Função disponível em breve",
            });
          }}
        >
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
          Entrar com Google
        </Button>
        
        <p className="text-center mt-6 text-gray-600">
          Ainda não tem uma conta? <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/register")}>Cadastre-se</Button>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
