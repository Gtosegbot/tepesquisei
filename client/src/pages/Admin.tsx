import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";

const Admin = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) return [];
      
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      
      return res.json();
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.role !== "admin") {
      toast({
        title: "Acesso restrito",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAuthenticated, user, navigate, toast]);

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Painel Admin</h1>
            <p className="text-gray-600">Bem-vindo, {user.username}</p>
          </div>
          <Button variant="outline" onClick={() => {
            logout();
            navigate("/login");
          }}>
            Sair
          </Button>
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Total de Usuários</CardTitle>
                  <CardDescription>Usuários registrados na plataforma</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{users.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Pesquisas Ativas</CardTitle>
                  <CardDescription>Pesquisas em andamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Créditos Vendidos</CardTitle>
                  <CardDescription>Total de créditos vendidos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Registrados</CardTitle>
                <CardDescription>Gerenciar usuários da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <p>Carregando usuários...</p>
                ) : (
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 p-4 font-medium bg-gray-50">
                      <div>ID</div>
                      <div>Nome</div>
                      <div>Email</div>
                      <div>Função</div>
                      <div>Créditos</div>
                    </div>
                    <Separator />
                    {users.map((user: any) => (
                      <div key={user.id} className="grid grid-cols-5 p-4">
                        <div>{user.id}</div>
                        <div>{user.username}</div>
                        <div>{user.email}</div>
                        <div>{user.role}</div>
                        <div>{user.credits}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Pagamentos</CardTitle>
                <CardDescription>Histórico de pagamentos e transações</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Nenhum pagamento registrado.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>Configurações da plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Configurações de API</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">API Cloudinary</p>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded">cloudinary://643293469221315:cgyH2rA1suW71pquhhvXFPONPKg@dnzajmmae</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">API ARCEE</p>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded">AjC67cj2eAojeSibCwlhSBti6z15Ry3g2182YY3mUV0nwcpa8J8ciDiNwWP6lSkjs8CM9V0rR4X1fsGmuD72t99zu4U</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Configurações de Pagamento</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">PayPal 3000 créditos</p>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded truncate">56MGZGLGQY2R8</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">PayPal 5000 créditos</p>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded truncate">8YMAFF3BBJG9U</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">PayPal 10000 créditos</p>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded truncate">4FDUQYRWCL3QS</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
