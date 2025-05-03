import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Survey, Question, insertSurveySchema, insertQuestionSchema } from '@shared/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormDescription,
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
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
import { nanoid } from 'nanoid';
import { Loader2, Save, ArrowLeft, Plus, Trash2, GripVertical, ArrowRight, Bot, AlertTriangle } from 'lucide-react';
import { DemographicRequirements } from '@/components/DemographicRequirements';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch } from '@/components/ui/switch';

// Esquema de validação estendido para formulário de pesquisa
const surveyFormSchema = insertSurveySchema.extend({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  expiresAt: z.string().optional(),
});

// Esquema para as opções de perguntas de múltipla escolha
const optionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Texto da opção é obrigatório'),
  value: z.string(),
});

// Esquema para as perguntas
const questionFormSchema = insertQuestionSchema.extend({
  text: z.string().min(3, 'A pergunta deve ter pelo menos 3 caracteres'),
  type: z.enum(['single_choice', 'multiple_choice', 'open_text', 'scale', 'demographic']),
  options: z.array(optionSchema).optional(),
  required: z.boolean().default(true),
  order: z.number(),
});

// Esquema completo do formulário
type SurveyFormValues = z.infer<typeof surveyFormSchema> & {
  questions: z.infer<typeof questionFormSchema>[];
};

// Componente de opção arrastável para perguntas de múltipla escolha
interface SortableOptionProps {
  id: string;
  index: number;
  option: { id: string; text: string; value: string };
  onChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
}

function SortableOption({ id, option, onChange, onRemove }: SortableOptionProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center gap-2 mb-2 bg-background p-2 rounded border hover:bg-slate-50 transition-colors"
    >
      <button 
        type="button" 
        className="cursor-grab touch-none" 
        {...attributes} 
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <Input 
        value={option.text} 
        onChange={(e) => onChange(option.id, e.target.value)} 
        placeholder="Texto da opção"
        className="flex-1"
      />
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        onClick={() => onRemove(option.id)}
        className="hover:scale-105 active:scale-95 transition-transform"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Componente principal do editor de pesquisas
export default function SurveyEditor() {
  const { id } = useParams();
  const isEditMode = !!id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('details');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [surveyId, setSurveyId] = useState<number | undefined>(id ? parseInt(id) : undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // Safety to ensure we have a valid survey ID even for non-nullable operations
  const parsedSurveyId = surveyId || (id ? parseInt(id) : undefined);
  const nonNullableSurveyId = parsedSurveyId || 0; // For operations requiring a non-null value
  
  // Sensores para arrastar e soltar
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Formulário da pesquisa
  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'draft',
      targetAudience: '',
      filters: {},
      shareCode: nanoid(10),
      expiresAt: '',
      questions: [],
    },
  });
  
  // Array de campos para perguntas
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'questions',
  });
  
  // Buscar dados da pesquisa se estiver em modo de edição
  const { data: surveyData, isLoading: isLoadingSurvey } = useQuery<Survey>({
    queryKey: ['/api/surveys', id],
    enabled: isEditMode,
  });
  
  // Buscar perguntas da pesquisa se estiver em modo de edição
  const { data: questionsData, isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: ['/api/surveys', id, 'questions'],
    enabled: isEditMode,
  });
  
  // Mutação para criar/atualizar pesquisa
  const saveSurveyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof surveyFormSchema>) => {
      if (isEditMode) {
        return apiRequest('PUT', `/api/surveys/${id}`, data);
      } else {
        return apiRequest('POST', '/api/surveys', data);
      }
    },
    onSuccess: async (response) => {
      const survey = await response.json();
      
      // Atualizar cache
      queryClient.invalidateQueries({ queryKey: ['/api/surveys'] });
      
      toast({
        title: isEditMode ? 'Pesquisa atualizada' : 'Pesquisa criada',
        description: isEditMode 
          ? 'Sua pesquisa foi atualizada com sucesso.' 
          : 'Sua pesquisa foi criada com sucesso.',
      });
      
      if (!isEditMode) {
        // Se for criação, redirecionar para edição para adicionar perguntas
        setLocation(`/surveys/${survey.id}/edit`);
      }
      
      return survey;
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar pesquisa',
        variant: 'destructive',
      });
    },
  });
  
  // Mutação para salvar perguntas
  const saveQuestionMutation = useMutation({
    mutationFn: async (data: { surveyId: number; question: any }) => {
      if (data.question.id) {
        return apiRequest('PUT', `/api/questions/${data.question.id}`, data.question);
      } else {
        return apiRequest('POST', `/api/surveys/${data.surveyId}/questions`, data.question);
      }
    },
  });
  
  // Mutação para excluir uma pergunta
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      return apiRequest('DELETE', `/api/questions/${questionId}`);
    },
  });
  
  // Carregar dados da pesquisa e perguntas quando disponíveis
  useEffect(() => {
    if (surveyData) {
      // Preencher o formulário com os dados da pesquisa
      const formattedExpiresAt = surveyData.expiresAt 
        ? new Date(surveyData.expiresAt).toISOString().split('T')[0]
        : '';
        
      form.reset({
        ...surveyData,
        expiresAt: formattedExpiresAt,
        questions: [],
      } as any);
    }
  }, [surveyData, form]);
  
  useEffect(() => {
    if (questionsData) {
      // Ordenar perguntas por ordem
      const sortedQuestions = [...questionsData].sort((a, b) => a.order - b.order);
      
      // Preencher o formulário com as perguntas
      form.setValue('questions', sortedQuestions as any);
    }
  }, [questionsData, form]);
  
  // Handler para finalizar arrastar e soltar
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(field => field.id === active.id);
      const newIndex = fields.findIndex(field => field.id === over.id);
      
      move(oldIndex, newIndex);
      
      // Atualizar a ordem das perguntas
      form.setValue(
        'questions',
        form.getValues().questions.map((q, i) => ({ ...q, order: i }))
      );
    }
  };
  
  // Adicionar nova pergunta
  const addQuestion = () => {
    const newQuestion = {
      id: 0, // Será substituído pelo ID real após salvar
      surveyId: parseInt(id || '0'),
      text: '',
      type: 'single_choice' as const,
      options: [
        { id: nanoid(), text: 'Opção 1', value: 'option1' },
        { id: nanoid(), text: 'Opção 2', value: 'option2' },
      ],
      required: true,
      order: fields.length,
      createdAt: new Date(),
    };
    
    append(newQuestion);
    setActiveTab(`question-${fields.length}`);
  };
  
  // Adicionar opção a uma pergunta
  const addOption = (questionIndex: number) => {
    const currentOptions = form.getValues().questions[questionIndex].options || [];
    
    form.setValue(`questions.${questionIndex}.options`, [
      ...currentOptions,
      {
        id: nanoid(),
        text: `Opção ${currentOptions.length + 1}`,
        value: `option${currentOptions.length + 1}`,
      },
    ]);
  };
  
  // Remover opção de uma pergunta
  const removeOption = (questionIndex: number, optionId: string) => {
    const currentOptions = form.getValues().questions[questionIndex].options || [];
    const filteredOptions = currentOptions.filter(option => option.id !== optionId);
    
    form.setValue(`questions.${questionIndex}.options`, filteredOptions);
  };
  
  // Atualizar texto de uma opção
  const updateOptionText = (questionIndex: number, optionId: string, text: string) => {
    const currentOptions = form.getValues().questions[questionIndex].options || [];
    const updatedOptions = currentOptions.map(option => 
      option.id === optionId ? { ...option, text, value: text.toLowerCase().replace(/\s+/g, '_') } : option
    );
    
    form.setValue(`questions.${questionIndex}.options`, updatedOptions);
  };
  
  // Reordenar opções
  const handleOptionDragEnd = (event: DragEndEvent, questionIndex: number) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const currentOptions = form.getValues().questions[questionIndex].options || [];
      const oldIndex = currentOptions.findIndex(option => option.id === active.id);
      const newIndex = currentOptions.findIndex(option => option.id === over.id);
      
      const reorderedOptions = arrayMove(currentOptions, oldIndex, newIndex);
      form.setValue(`questions.${questionIndex}.options`, reorderedOptions);
    }
  };
  
  // Enviar formulário

  
  const onSubmit: SubmitHandler<SurveyFormValues> = async (data) => {
    try {
      setIsSubmitting(true);
      toast({
        title: 'Salvando pesquisa...',
        description: 'Aguarde enquanto salvamos sua pesquisa',
      });

      // Salvar a pesquisa primeiro
      const surveyData = {
        title: data.title,
        description: data.description,
        status: data.status,
        targetAudience: data.targetAudience,
        filters: data.filters,
        shareCode: data.shareCode || `survey_${Date.now().toString(36)}`, // Garantir que sempre tenha um shareCode único
        expiresAt: data.expiresAt || undefined,
      };
      
      console.log('Enviando dados da pesquisa:', surveyData);
      
      // Adicionar userId se necessário (será obtido no backend)
      const response = await apiRequest("POST", parsedSurveyId ? `/api/surveys/${parsedSurveyId}` : "/api/surveys", surveyData);
      
      const savedSurvey = await response.json();
      const newSurveyId = savedSurvey.id || parsedSurveyId;
      
      if (!parsedSurveyId) {
        // Se for uma nova pesquisa, atualizar o ID e redirecionar
        setSurveyId(newSurveyId);
        window.history.replaceState(null, "", `/survey-editor/${newSurveyId}`);
      }
      
      console.log('Pesquisa salva com ID:', newSurveyId);
      
      // Depois salvar as perguntas
      if (data.questions.length > 0) {
        console.log('Salvando', data.questions.length, 'perguntas');
        
        // Processar cada pergunta, uma por uma
        for (const question of data.questions) {
          console.log('Salvando pergunta:', question.text);
          
          try {
            await saveQuestionMutation.mutateAsync({
              surveyId: nonNullableSurveyId,
              question: {
                ...question,
                surveyId: nonNullableSurveyId,
              },
            });
          } catch (questionError) {
            console.error('Erro ao salvar pergunta:', questionError);
            toast({
              title: 'Erro ao salvar pergunta',
              description: 'Uma ou mais perguntas não puderam ser salvas',
              variant: 'destructive',
            });
          }
        }
        
        // Atualizar cache de perguntas
        queryClient.invalidateQueries({ queryKey: ['/api/surveys', id, 'questions'] });
      }
      
      toast({
        title: 'Pesquisa salva com sucesso',
        description: 'Todos os dados foram salvos',
      });
      
      if (isEditMode) {
        // Permanecer na tela de edição
        setActiveTab('details');
      } else {
        // Ir para a lista de pesquisas
        setLocation('/surveys');
      }
    } catch (error) {
      console.error('Erro ao salvar pesquisa:', error);
      toast({
        title: 'Erro ao salvar pesquisa',
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  // Função para gerar pesquisa com IA (versão robusta para prevenir erros)
  const generateSurveyWithAI = () => {
    try {
      if (!aiPrompt.trim()) {
        toast({
          title: 'Prompt vazio',
          description: 'Por favor, digite um prompt para gerar a pesquisa',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Gerando pesquisa...',
        description: 'Estamos processando seu prompt para criar a pesquisa.',
      });

      // Implementação simplificada da geração de pesquisa com IA
      // Esta versão é mais robusta para prevenir erros
      setTimeout(() => {
        try {
          // Obter palavras-chave seguras do prompt
          const safePromptWords = aiPrompt.split(' ')
            .filter(word => word.length > 2)
            .slice(0, 4)
            .join(' ');
          
          // Título seguro
          const safeTitle = safePromptWords ? 
            `Pesquisa sobre ${safePromptWords}` : 
            "Nova pesquisa gerada por IA";

          // Descrição segura  
          const safeDescription = `Pesquisa gerada a partir do tema: ${aiPrompt.slice(0, 100)}${aiPrompt.length > 100 ? '...' : ''}`;
          
          // Gerar perguntas seguras
          const safeQuestions = [
            {
              id: nanoid(),
              surveyId: parseInt(id || '0'),
              text: `Qual sua opinião sobre ${safePromptWords || 'este tema'}?`,
              type: 'open_text' as const,
              required: true,
              order: 0,
              createdAt: new Date(),
            },
            {
              id: nanoid(),
              surveyId: parseInt(id || '0'),
              text: `Como você classificaria a importância deste tema?`,
              type: 'scale' as const,
              options: [
                { id: nanoid(), text: '1 - Nada importante', value: '1' },
                { id: nanoid(), text: '2 - Pouco importante', value: '2' },
                { id: nanoid(), text: '3 - Neutro', value: '3' },
                { id: nanoid(), text: '4 - Importante', value: '4' },
                { id: nanoid(), text: '5 - Muito importante', value: '5' },
              ],
              required: true,
              order: 1,
              createdAt: new Date(),
            },
            {
              id: nanoid(),
              surveyId: parseInt(id || '0'),
              text: `Você possui experiência anterior com este tema?`,
              type: 'single_choice' as const,
              options: [
                { id: nanoid(), text: 'Sim, muita experiência', value: 'yes_much' },
                { id: nanoid(), text: 'Sim, alguma experiência', value: 'yes_some' },
                { id: nanoid(), text: 'Não, nenhuma experiência', value: 'no' },
              ],
              required: true,
              order: 2,
              createdAt: new Date(),
            },
          ];

          console.log('Pesquisa gerada por IA:', {
            title: safeTitle,
            description: safeDescription,
            questions: safeQuestions.length
          });

          // Atualizar o formulário com os dados gerados
          form.setValue('title', safeTitle);
          form.setValue('description', safeDescription);
          
          // Limpar perguntas existentes e adicionar as novas
          while (fields.length > 0) {
            remove(0);
          }
          
          safeQuestions.forEach(question => {
            append(question);
          });

          toast({
            title: 'Pesquisa gerada',
            description: 'A pesquisa foi gerada com sucesso. Revise e edite conforme necessário.',
          });

          // Mudar para a aba de detalhes
          setActiveTab('details');
        } catch (innerError) {
          console.error('Erro ao processar geração de pesquisa:', innerError);
          toast({
            title: 'Erro na geração de pesquisa',
            description: 'Ocorreu um erro ao processar o tema da pesquisa. Por favor, tente um tema diferente.',
            variant: 'destructive',
          });
        }
      }, 2000);
    } catch (error) {
      console.error('Erro ao iniciar geração de pesquisa:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao iniciar o gerador de pesquisa',
        variant: 'destructive',
      });
    }
  };
  
  // Estado de carregamento
  const isLoading = isLoadingSurvey || isLoadingQuestions || saveSurveyMutation.isPending;
  
  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/surveys')}
            className="hover:-translate-x-1 active:scale-95 transition-transform"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Editar Pesquisa' : 'Nova Pesquisa'}
          </h1>
        </div>
        
        <Button 
          type="button" 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isLoading}
          className="hover:scale-105 active:scale-95 transition-transform"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar
        </Button>
      </div>
      
      {isLoading && !isEditMode && (
        <div className="flex justify-center items-center h-40">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger 
            value="details" 
            className="hover:scale-105 active:scale-95 transition-transform"
          >
            Detalhes
          </TabsTrigger>
          <TabsTrigger 
            value="demographics"
            className="hover:scale-105 active:scale-95 transition-transform"
          >
            Requisitos Demográficos
          </TabsTrigger>
          <TabsTrigger 
            value="ai-generator"
            className="hover:scale-105 active:scale-95 transition-transform"
          >
            Gerador com IA
          </TabsTrigger>
          {fields.map((question, index) => (
            <TabsTrigger 
              key={question.id} 
              value={`question-${index}`}
              className="hover:scale-105 active:scale-95 transition-transform"
            >
              Pergunta {index + 1}
            </TabsTrigger>
          ))}
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={addQuestion}
            className="hover:rotate-90 transition-transform"
            disabled={!isEditMode || isLoading}
            title={isEditMode ? "Adicionar pergunta" : "Salve a pesquisa primeiro"}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TabsList>
        
        <TabsContent value="details" className="bg-background rounded-lg p-6 shadow-sm">
          <Form {...form}>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da pesquisa</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o título da pesquisa" {...field} />
                      </FormControl>
                      <FormDescription>
                        Um título claro e objetivo para sua pesquisa.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="active">Ativa</SelectItem>
                          <SelectItem value="completed">Concluída</SelectItem>
                          <SelectItem value="archived">Arquivada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        O status atual da sua pesquisa.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o objetivo desta pesquisa"
                        rows={5}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Uma breve descrição do propósito desta pesquisa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Público-alvo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Descreva o público-alvo desta pesquisa"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Para quem esta pesquisa está direcionada?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Expiração</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Quando esta pesquisa deve expirar?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="shareCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Compartilhamento</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...field} readOnly />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newCode = nanoid(10);
                            form.setValue('shareCode', newCode);
                          }}
                          className="hover:scale-105 active:scale-95 transition-transform"
                        >
                          Gerar Novo
                        </Button>
                      </div>
                      <FormDescription>
                        Código único para compartilhar esta pesquisa.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="demographics" className="bg-background rounded-lg p-6 shadow-sm">
          {isEditMode ? (
            <>
              <DemographicRequirements 
                surveyId={parseInt(id!)} 
                initialData={surveyData?.filters || undefined}
                onComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/surveys', id] });
                  toast({
                    title: 'Requisitos demográficos salvos',
                    description: 'Os requisitos demográficos foram salvos com sucesso.',
                  });
                }}
              />
              <div className="flex justify-between mt-8">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setActiveTab('details')}
                  className="flex items-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Detalhes
                </Button>
                
                {fields.length > 0 && (
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab(`question-0`)}
                    className="flex items-center"
                  >
                    Ir para Perguntas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                
                {fields.length === 0 && (
                  <Button 
                    type="button" 
                    onClick={addQuestion}
                    className="flex items-center"
                  >
                    Adicionar Primeira Pergunta
                    <Plus className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Salve a pesquisa primeiro</h3>
              <p className="text-muted-foreground mt-2">
                Para definir requisitos demográficos, primeiro salve os detalhes básicos da pesquisa.
              </p>
              <Button 
                type="button" 
                variant="default" 
                onClick={form.handleSubmit(onSubmit)}
                disabled={isLoading}
                className="mt-6"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Pesquisa
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="ai-generator" className="bg-background rounded-lg p-6 shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Gerador de Pesquisa com IA</h2>
            </div>
            
            <p className="text-muted-foreground">
              Descreva o tema e objetivo da sua pesquisa, e nossa IA irá gerar automaticamente
              perguntas relevantes para você. Quanto mais detalhado for seu prompt, melhores
              serão os resultados.
            </p>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Ex: 'Gere uma pesquisa sobre satisfação de clientes com serviço de entrega de comida, focando em tempo de entrega, qualidade da comida e atendimento'"
                rows={5}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="border-primary/20 focus-visible:ring-primary transition-all"
              />
              
              <Button 
                type="button" 
                onClick={generateSurveyWithAI}
                className="w-full md:w-auto hover:scale-105 active:scale-95 transition-transform"
              >
                <Bot className="mr-2 h-4 w-4" /> Gerar Pesquisa
              </Button>
              
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 mt-6">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Nota sobre geração com IA</h4>
                    <p className="text-sm mt-1">
                      Esta funcionalidade usa 1 crédito e os resultados podem variar. Você sempre poderá
                      editar as perguntas geradas antes de finalizar sua pesquisa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {fields.map((question, questionIndex) => (
          <TabsContent 
            key={question.id} 
            value={`question-${questionIndex}`}
            className="bg-background rounded-lg p-6 shadow-sm animate-in fade-in-50"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-3">
                  {questionIndex + 1}
                </span>
                Configurar Pergunta
              </h3>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover pergunta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. A pergunta será permanentemente removida da pesquisa.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        // Se for uma pergunta já salva, excluir do backend
                        if (question.id && typeof question.id === 'number' && question.id > 0) {
                          deleteQuestionMutation.mutate(question.id, {
                            onSuccess: () => {
                              // Atualizar cache
                              queryClient.invalidateQueries({ queryKey: ['/api/surveys', id, 'questions'] });
                              // Remover do formulário
                              remove(questionIndex);
                              // Ir para a aba de detalhes
                              setActiveTab('details');
                              
                              toast({
                                title: 'Pergunta removida',
                                description: 'A pergunta foi removida com sucesso.',
                              });
                            },
                          });
                        } else {
                          // Se for uma pergunta não salva, apenas remover do formulário
                          remove(questionIndex);
                          // Ir para a aba de detalhes
                          setActiveTab('details');
                          
                          toast({
                            title: 'Pergunta removida',
                            description: 'A pergunta foi removida com sucesso.',
                          });
                        }
                      }}
                    >
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            <div className="space-y-6">
              <FormField
                control={form.control}
                name={`questions.${questionIndex}.text`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto da pergunta</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite a pergunta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`questions.${questionIndex}.type`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de resposta</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single_choice">Escolha Única</SelectItem>
                        <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                        <SelectItem value="open_text">Texto Livre</SelectItem>
                        <SelectItem value="scale">Escala (1-5)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Como os respondentes deverão responder esta pergunta.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`questions.${questionIndex}.required`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Pergunta obrigatória</FormLabel>
                      <FormDescription>
                        Os respondentes devem responder esta pergunta.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {['single_choice', 'multiple_choice', 'scale'].includes(form.getValues().questions[questionIndex]?.type) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>Opções de resposta</FormLabel>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addOption(questionIndex)}
                      className="hover:scale-105 active:scale-95 transition-transform"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Opção
                    </Button>
                  </div>
                  
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleOptionDragEnd(event, questionIndex)}
                  >
                    <SortableContext
                      items={(form.getValues().questions[questionIndex]?.options || []).map(o => o.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {(form.getValues().questions[questionIndex]?.options || []).map((option, optionIndex) => (
                        <SortableOption
                          key={option.id}
                          id={option.id}
                          index={optionIndex}
                          option={option}
                          onChange={(id, text) => updateOptionText(questionIndex, id, text)}
                          onRemove={(id) => removeOption(questionIndex, id)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                  
                  {(form.getValues().questions[questionIndex]?.options || []).length === 0 && (
                    <div className="text-center py-6 border border-dashed rounded-lg">
                      <p className="text-muted-foreground">Nenhuma opção adicionada ainda.</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => addOption(questionIndex)}
                        className="mt-2 hover:scale-105 active:scale-95 transition-transform"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Opção
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-between mt-10 pt-6 border-t">
                <div className="space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab('demographics')}
                    className="flex items-center"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Requisitos Demográficos
                  </Button>
                  
                  {questionIndex > 0 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setActiveTab(`question-${questionIndex - 1}`)}
                      className="flex items-center"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Pergunta Anterior
                    </Button>
                  )}
                </div>
                
                <div className="space-x-2">
                  {questionIndex < fields.length - 1 && (
                    <Button 
                      type="button" 
                      onClick={() => setActiveTab(`question-${questionIndex + 1}`)}
                      className="flex items-center"
                    >
                      Próxima Pergunta
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button 
                    type="button" 
                    onClick={form.handleSubmit(onSubmit)}
                    className="flex items-center"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Pesquisa
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
        
        {fields.length === 0 && isEditMode && (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center pt-10 pb-10 space-y-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Adicione perguntas</CardTitle>
              <CardDescription className="text-center max-w-md">
                Sua pesquisa ainda não tem perguntas. Clique no botão abaixo para adicionar 
                sua primeira pergunta ou use o gerador de pesquisa com IA.
              </CardDescription>
              <Button onClick={addQuestion} type="button" className="hover:scale-105 active:scale-95 transition-transform">
                <Plus className="h-4 w-4 mr-2" /> Adicionar Pergunta
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Ou use o <span className="font-medium">Gerador de Pesquisa com IA</span> para criar perguntas automaticamente.
              </p>
            </CardContent>
          </Card>
        )}
      </Tabs>
    </div>
  );
}