import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Survey, SurveyShare, insertSurveyShareSchema } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ArrowLeft, Copy, Globe, Link, Mail, Phone, Share2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Esquema para compartilhamento de pesquisa
const shareFormSchema = insertSurveyShareSchema.extend({
  message: z.string().min(1, "A mensagem é obrigatória"),
  type: z.enum(["email", "sms", "whatsapp", "link"]),
  recipientEmail: z.string().email("E-mail inválido").optional().nullable(),
  recipientPhone: z.string().optional().nullable(),
  phoneList: z.string().optional(),
});

type ShareFormValues = z.infer<typeof shareFormSchema>;

export default function SurveySharePage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('link');
  const [copied, setCopied] = useState(false);
  const [showBulkSuccess, setShowBulkSuccess] = useState(false);
  
  // Buscar dados da pesquisa
  const { data: survey, isLoading: isLoadingSurvey } = useQuery<Survey>({
    queryKey: ['/api/surveys', id],
  });
  
  // Buscar compartilhamentos existentes
  const { 
    data: surveyShares, 
    isLoading: isLoadingShares,
    refetch: refetchShares
  } = useQuery<SurveyShare[]>({
    queryKey: ['/api/surveys', id, 'shares'],
    enabled: !!survey,
  });
  
  // Formulário para compartilhamento
  const form = useForm<ShareFormValues>({
    resolver: zodResolver(shareFormSchema),
    defaultValues: {
      surveyId: parseInt(id || '0'),
      type: 'link',
      message: survey ? `Convite para participar da pesquisa: ${survey.title}` : '',
      recipientEmail: '',
      recipientPhone: '',
      phoneList: '',
      createdBy: 0, // Será preenchido na submissão
    },
  });
  
  // Atualizar mensagem padrão quando a pesquisa carregar
  React.useEffect(() => {
    if (survey) {
      form.setValue('message', `Convite para participar da pesquisa: ${survey.title}`);
    }
  }, [survey, form]);
  
  // Mutation para criar compartilhamento
  const createShareMutation = useMutation({
    mutationFn: async (data: ShareFormValues) => {
      return apiRequest('POST', `/api/surveys/${id}/share`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Compartilhamento criado',
        description: 'O compartilhamento da pesquisa foi criado com sucesso.',
      });
      
      // Limpar campos de destinatário
      form.setValue('recipientEmail', '');
      form.setValue('recipientPhone', '');
      form.setValue('phoneList', '');
      
      // Recarregar lista de compartilhamentos
      refetchShares();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar compartilhamento',
        variant: 'destructive',
      });
    },
  });
  
  // Construir URL da pesquisa para compartilhamento
  const getSurveyPublicUrl = () => {
    if (!survey) return '';
    
    const baseUrl = window.location.origin;
    return `${baseUrl}/s/${survey.shareCode}`;
  };
  
  // Copiar link da pesquisa para a área de transferência
  const copyLinkToClipboard = () => {
    const link = getSurveyPublicUrl();
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: 'Link copiado!',
        description: 'O link da pesquisa foi copiado para a área de transferência.',
      });
    });
  };
  
  // Enviar formulário de compartilhamento individual
  const onSubmit = (data: ShareFormValues) => {
    if (data.type === 'email' && !data.recipientEmail) {
      form.setError('recipientEmail', {
        type: 'manual',
        message: 'O e-mail do destinatário é obrigatório',
      });
      return;
    }
    
    if ((data.type === 'sms' || data.type === 'whatsapp') && !data.recipientPhone) {
      form.setError('recipientPhone', {
        type: 'manual',
        message: 'O telefone do destinatário é obrigatório',
      });
      return;
    }
    
    createShareMutation.mutate(data);
  };
  
  // Enviar compartilhamento em massa
  const handleBulkShare = () => {
    const phoneList = form.getValues('phoneList');
    
    if (!phoneList) {
      form.setError('phoneList', {
        type: 'manual',
        message: 'A lista de telefones é obrigatória',
      });
      return;
    }
    
    // Processar a lista de telefones (um por linha)
    const phones = phoneList
      .split('\n')
      .map(p => p.trim())
      .filter(p => p);
      
    if (phones.length === 0) {
      form.setError('phoneList', {
        type: 'manual',
        message: 'A lista de telefones está vazia',
      });
      return;
    }
    
    // Mostrar indicador de sucesso
    setShowBulkSuccess(true);
    setTimeout(() => setShowBulkSuccess(false), 3000);
    
    toast({
      title: 'Lista processada',
      description: `${phones.length} números de telefone foram processados para envio.`,
    });
    
    // Limpar o campo
    form.setValue('phoneList', '');
    
    // Aqui seria feita a integração com a API para envio em massa
    // Por enquanto, apenas simulamos o envio
  };
  
  // Renderizar status do compartilhamento
  const renderShareStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'sent':
        return <Badge variant="success">Enviado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Estado de carregamento
  const isLoading = isLoadingSurvey || isLoadingShares || createShareMutation.isPending;
  
  if (isLoading && !survey) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }
  
  if (!survey) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="pt-6">
            <p>Pesquisa não encontrada ou você não tem permissão para acessá-la.</p>
            <Button 
              className="mt-4" 
              variant="outline" 
              onClick={() => setLocation('/surveys')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para minhas pesquisas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Verificar se a pesquisa está ativa
  const isActive = survey.status === 'active';
  
  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation('/surveys')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Compartilhar Pesquisa</h1>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{survey.title}</CardTitle>
          {survey.description && <CardDescription>{survey.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Status da Pesquisa</h3>
                <p className="capitalize">{survey.status}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Código de Compartilhamento</h3>
                <p>{survey.shareCode}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Data de Criação</h3>
                <p>{survey.createdAt ? format(new Date(survey.createdAt), 'dd/MM/yyyy') : '-'}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Expira em</h3>
                <p>{survey.expiresAt ? format(new Date(survey.expiresAt), 'dd/MM/yyyy') : 'Sem expiração'}</p>
              </div>
            </div>
            
            {!isActive && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-md text-yellow-800 dark:text-yellow-300 text-sm">
                <p>⚠️ Esta pesquisa não está ativa. Ative-a nas configurações da pesquisa para permitir compartilhamento.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={() => setLocation(`/surveys/${id}/edit`)}
                >
                  Editar Pesquisa
                </Button>
              </div>
            )}
            
            <div className="flex items-center space-x-2 p-4 border rounded-md">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 font-mono text-sm overflow-hidden">
                {getSurveyPublicUrl()}
              </div>
              <Button variant="outline" size="sm" onClick={copyLinkToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2">{copied ? 'Copiado!' : 'Copiar'}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Compartilhar Pesquisa</CardTitle>
              <CardDescription>
                Escolha como deseja compartilhar sua pesquisa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="link" className="flex items-center">
                    <Link className="h-4 w-4 mr-2" />
                    Link
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center" disabled={!isActive}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="flex items-center" disabled={!isActive}>
                    <Phone className="h-4 w-4 mr-2" />
                    WhatsApp
                  </TabsTrigger>
                  <TabsTrigger value="bulk" className="flex items-center" disabled={!isActive}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Em Massa
                  </TabsTrigger>
                </TabsList>
                
                <Form {...form}>
                  <TabsContent value="link">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Copie o link abaixo e compartilhe com seus contatos.
                      </p>
                      
                      <div className="flex items-center space-x-2 p-4 border rounded-md">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 font-mono text-sm overflow-hidden truncate">
                          {getSurveyPublicUrl()}
                        </div>
                        <Button variant="default" size="sm" onClick={copyLinkToClipboard}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <span className="ml-2">{copied ? 'Copiado!' : 'Copiar'}</span>
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="email">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <input type="hidden" {...form.register('type')} value="email" />
                      
                      <FormField
                        control={form.control}
                        name="recipientEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email do Destinatário</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="email@exemplo.com" 
                                {...field} 
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mensagem</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Digite a mensagem de convite" 
                                {...field} 
                                rows={4}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={createShareMutation.isPending || !isActive}
                      >
                        Enviar Convite por Email
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="whatsapp">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <input type="hidden" {...form.register('type')} value="whatsapp" />
                      
                      <FormField
                        control={form.control}
                        name="recipientPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de WhatsApp</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="+5511999999999" 
                                {...field} 
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground mt-1">
                              Digite no formato internacional (Ex: +5511999999999)
                            </p>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mensagem</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Digite a mensagem de convite" 
                                {...field} 
                                rows={4}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={createShareMutation.isPending || !isActive}
                      >
                        Enviar Convite por WhatsApp
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="bulk">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="phoneList"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lista de Telefones (E.164)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="+5511999999999
+5521888888888
+5531777777777" 
                                {...field} 
                                rows={8}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground mt-1">
                              Digite um número por linha no formato internacional E.164 (Ex: +5511999999999)
                            </p>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mensagem</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Digite a mensagem de convite" 
                                {...field} 
                                rows={4}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="button" 
                        className="w-full" 
                        onClick={handleBulkShare}
                        disabled={!isActive || showBulkSuccess}
                      >
                        {showBulkSuccess ? (
                          <>
                            <Check className="mr-2 h-4 w-4" /> 
                            Lista Enviada
                          </>
                        ) : (
                          'Processar Lista'
                        )}
                      </Button>
                      
                      <div className="bg-muted p-4 rounded-md text-sm">
                        <h3 className="font-medium mb-2">Nota sobre pesquisas telefônicas:</h3>
                        <p>
                          As pesquisas por telefone serão encaminhadas para a API de chamadas. 
                          A lista será processada e as chamadas serão realizadas pela plataforma RetellAI.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Form>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Compartilhamentos</CardTitle>
              <CardDescription>
                Visualize todos os compartilhamentos desta pesquisa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {surveyShares && surveyShares.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {surveyShares.map((share) => (
                      <TableRow key={share.id}>
                        <TableCell className="capitalize">{share.type}</TableCell>
                        <TableCell>
                          {share.type === 'email' 
                            ? share.recipientEmail 
                            : share.type === 'whatsapp' || share.type === 'sms'
                              ? share.recipientPhone
                              : 'Link'}
                        </TableCell>
                        <TableCell>{renderShareStatus(share.status)}</TableCell>
                        <TableCell>
                          {share.createdAt ? format(new Date(share.createdAt), 'dd/MM/yyyy HH:mm') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Share2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p>Esta pesquisa ainda não foi compartilhada.</p>
                  <p className="mt-2 text-sm">
                    Use as opções de compartilhamento ao lado para começar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}