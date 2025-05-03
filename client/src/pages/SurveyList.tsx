import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Survey } from '@shared/schema';
import { PlusCircle, Edit, Trash2, Eye, Share2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SurveyList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [surveyToDelete, setSurveyToDelete] = useState<number | null>(null);
  
  // Buscar todas as pesquisas do usuário
  const {
    data: surveys,
    isLoading,
    error
  } = useQuery<Survey[]>({
    queryKey: ['/api/surveys'],
    refetchOnWindowFocus: true,
  });

  // Função para deletar uma pesquisa
  const deleteSurvey = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/surveys/${id}`);
      
      // Atualizar cache
      queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
      
      toast({
        title: 'Pesquisa excluída',
        description: 'A pesquisa foi excluída com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir pesquisa',
        variant: 'destructive',
      });
    }
  };

  // Helper para renderizar o status da pesquisa
  const renderStatus = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Rascunho</Badge>;
      case 'active':
        return <Badge variant="success">Ativa</Badge>;
      case 'completed':
        return <Badge variant="secondary">Concluída</Badge>;
      case 'archived':
        return <Badge variant="destructive">Arquivada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="bg-destructive/20 p-4 rounded-md text-center">
          <h3 className="text-xl font-semibold mb-2">Erro ao carregar pesquisas</h3>
          <p>{(error as Error).message || 'Tente novamente mais tarde'}</p>
          <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/surveys'] })}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Minhas Pesquisas</h1>
        <Button onClick={() => setLocation('/surveys/create')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Nova Pesquisa
        </Button>
      </div>

      {surveys && surveys.length === 0 ? (
        <Card className="p-10 flex flex-col items-center justify-center">
          <h3 className="text-xl font-semibold mb-4">Você ainda não tem pesquisas</h3>
          <p className="text-muted-foreground text-center mb-6">
            Crie sua primeira pesquisa para começar a coletar respostas
          </p>
          <Button onClick={() => setLocation('/surveys/create')}>
            <PlusCircle className="mr-2 h-4 w-4" /> Criar Pesquisa
          </Button>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Respostas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys?.map((survey) => (
                <TableRow key={survey.id}>
                  <TableCell className="font-medium">
                    {survey.title}
                    {survey.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {survey.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{renderStatus(survey.status)}</TableCell>
                  <TableCell>
                    {survey.createdAt ? format(new Date(survey.createdAt), 'dd/MM/yyyy') : ''}
                  </TableCell>
                  <TableCell>
                    <Button variant="link" size="sm" onClick={() => setLocation(`/surveys/${survey.id}/results`)}>
                      Ver respostas
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setLocation(`/surveys/${survey.id}/edit`)}
                        disabled={survey.status !== 'draft' && survey.status !== 'active'}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setLocation(`/surveys/${survey.id}/preview`)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Visualizar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setLocation(`/surveys/${survey.id}/share`)}
                        disabled={survey.status !== 'active'}
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="sr-only">Compartilhar</span>
                      </Button>
                      <AlertDialog open={surveyToDelete === survey.id} onOpenChange={(open) => !open && setSurveyToDelete(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-destructive/10 hover:bg-destructive/20 text-destructive"
                            onClick={() => setSurveyToDelete(survey.id)}
                            disabled={survey.status !== 'draft' && survey.status !== 'archived'}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir pesquisa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir esta pesquisa? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => {
                                if (surveyToDelete !== null) {
                                  deleteSurvey(surveyToDelete);
                                  setSurveyToDelete(null);
                                }
                              }}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}