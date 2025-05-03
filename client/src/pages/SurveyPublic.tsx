import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Survey, Question } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Mic,
  Loader2
} from 'lucide-react';

// Componente para pergunta de escolha única
const SingleChoiceQuestion = ({ question, questionIndex }: { question: Question, questionIndex: number }) => {
  const form = useFormContext();
  
  return (
    <div className="space-y-4">
      <RadioGroup
        onValueChange={(value) => form.setValue(`answers.${questionIndex}.value`, value)}
        value={form.watch(`answers.${questionIndex}.value`)}
        className="space-y-2"
      >
        {(question.options || []).map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={`option-${option.id}`} />
            <Label htmlFor={`option-${option.id}`} className="flex-1">
              {option.text}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {form.formState.errors.answers?.[questionIndex]?.value && (
        <p className="text-destructive text-sm">
          Esta pergunta é obrigatória
        </p>
      )}
    </div>
  );
};

// Componente para pergunta de múltipla escolha
const MultipleChoiceQuestion = ({ question, questionIndex }: { question: Question, questionIndex: number }) => {
  const form = useFormContext();
  const values = form.watch(`answers.${questionIndex}.values`) || [];
  
  const handleChange = (optionValue: string, checked: boolean) => {
    const currentValues = [...values];
    
    if (checked) {
      if (!currentValues.includes(optionValue)) {
        currentValues.push(optionValue);
      }
    } else {
      const index = currentValues.indexOf(optionValue);
      if (index !== -1) {
        currentValues.splice(index, 1);
      }
    }
    
    form.setValue(`answers.${questionIndex}.values`, currentValues);
  };
  
  return (
    <div className="space-y-4">
      {(question.options || []).map((option) => (
        <div key={option.id} className="flex items-center space-x-2">
          <Checkbox
            id={`option-${option.id}`}
            checked={values.includes(option.value)}
            onCheckedChange={(checked) => handleChange(option.value, checked === true)}
          />
          <Label htmlFor={`option-${option.id}`} className="flex-1">
            {option.text}
          </Label>
        </div>
      ))}
      {form.formState.errors.answers?.[questionIndex]?.values && (
        <p className="text-destructive text-sm">
          Esta pergunta é obrigatória
        </p>
      )}
    </div>
  );
};

// Componente para pergunta de texto livre
const OpenTextQuestion = ({ question, questionIndex }: { question: Question, questionIndex: number }) => {
  const form = useFormContext();
  
  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Digite sua resposta aqui..."
        rows={5}
        {...form.register(`answers.${questionIndex}.value`)}
      />
      {form.formState.errors.answers?.[questionIndex]?.value && (
        <p className="text-destructive text-sm">
          Esta pergunta é obrigatória
        </p>
      )}
    </div>
  );
};

// Componente para pergunta de escala
const ScaleQuestion = ({ question, questionIndex }: { question: Question, questionIndex: number }) => {
  const form = useFormContext();
  const options = question.options || [
    { id: '1', text: '1 - Muito ruim', value: '1' },
    { id: '2', text: '2 - Ruim', value: '2' },
    { id: '3', text: '3 - Neutro', value: '3' },
    { id: '4', text: '4 - Bom', value: '4' },
    { id: '5', text: '5 - Excelente', value: '5' },
  ];
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        {options.map((option) => (
          <div 
            key={option.id} 
            className={`text-center p-2 border rounded-md cursor-pointer transition-colors ${
              form.watch(`answers.${questionIndex}.value`) === option.value
                ? 'border-primary bg-primary/10'
                : 'hover:bg-muted'
            }`}
            onClick={() => form.setValue(`answers.${questionIndex}.value`, option.value)}
          >
            <div className="text-xl font-semibold">{option.value}</div>
            <div className="text-xs text-muted-foreground">{option.text.split(' - ')[1] || ''}</div>
          </div>
        ))}
      </div>
      {form.formState.errors.answers?.[questionIndex]?.value && (
        <p className="text-destructive text-sm">
          Esta pergunta é obrigatória
        </p>
      )}
    </div>
  );
};

// Componente para gravar áudio (mock)
const AudioRecorder = ({ questionIndex }: { questionIndex: number }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const form = useFormContext();
  
  const toggleRecording = () => {
    if (isRecording) {
      // Simulação de parar gravação
      setIsRecording(false);
      setHasRecording(true);
      
      // Simular URL do áudio gravado
      const mockAudioUrl = `recording_${Date.now()}.mp3`;
      form.setValue(`answers.${questionIndex}.audioUrl`, mockAudioUrl);
      
      // Em uma implementação real, aqui enviaríamos o áudio para o servidor
    } else {
      // Simulação de iniciar gravação
      setIsRecording(true);
      setRecordingTime(0);
      
      // Em uma implementação real, aqui iniciaríamos a gravação
    }
  };
  
  // Simular tempo de gravação
  React.useEffect(() => {
    let interval: number | undefined;
    
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);
  
  // Formatação do tempo de gravação
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-muted/30">
        <Button
          type="button"
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          className="rounded-full w-16 h-16 mb-2"
          onClick={toggleRecording}
        >
          <Mic className={`h-6 w-6 ${isRecording ? 'animate-pulse' : ''}`} />
        </Button>
        
        {isRecording ? (
          <div className="flex flex-col items-center">
            <div className="text-destructive text-lg font-semibold">Gravando...</div>
            <div className="text-muted-foreground">{formatTime(recordingTime)}</div>
          </div>
        ) : hasRecording ? (
          <div className="flex flex-col items-center">
            <div className="text-primary text-lg font-semibold">Gravação concluída</div>
            <div className="text-muted-foreground">{formatTime(recordingTime)}</div>
          </div>
        ) : (
          <div className="text-muted-foreground">
            Clique para iniciar a gravação
          </div>
        )}
      </div>
      
      {form.formState.errors.answers?.[questionIndex]?.audioUrl && (
        <p className="text-destructive text-sm">
          Esta gravação é obrigatória
        </p>
      )}
    </div>
  );
};

export default function SurveyPublic() {
  const { shareCode } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [respondentId] = useState(`anonymous_${nanoid(8)}`);
  
  // Buscar dados da pesquisa
  const { data: survey, isLoading: isLoadingSurvey } = useQuery<Survey>({
    queryKey: ['/api/public/surveys', shareCode],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/public/surveys/${shareCode}`);
      return response.json();
    },
  });
  
  // Buscar perguntas da pesquisa
  const { data: questions, isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: ['/api/public/surveys', shareCode, 'questions'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/public/surveys/${shareCode}/questions`);
      return response.json();
    },
    enabled: !!survey,
  });
  
  // Criar esquema de validação dinâmico com base nas perguntas
  const createValidationSchema = (questions: Question[] | undefined) => {
    if (!questions || questions.length === 0) {
      return z.object({
        answers: z.array(z.any()),
      });
    }
    
    // Criar validação para cada pergunta
    const answerSchema = z.array(
      z.object({
        questionId: z.number(),
        value: z.string().optional(),
        values: z.array(z.string()).optional(),
        audioUrl: z.string().optional(),
      })
    ).refine((data) => {
      // Verificar se todas as perguntas obrigatórias têm resposta
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const answer = data[i];
        
        if (question.required) {
          if (question.type === 'single_choice' || question.type === 'scale' || question.type === 'open_text') {
            if (!answer.value) return false;
          } else if (question.type === 'multiple_choice') {
            if (!answer.values || answer.values.length === 0) return false;
          }
        }
      }
      
      return true;
    });
    
    return z.object({
      answers: answerSchema,
    });
  };
  
  // Preparar valores padrão para o formulário
  const getDefaultValues = (questions: Question[] | undefined) => {
    if (!questions) return { answers: [] };
    
    return {
      answers: questions.map((question) => ({
        questionId: question.id,
        value: '',
        values: [],
        audioUrl: '',
      })),
    };
  };
  
  // Criar formulário
  const form = useForm({
    resolver: zodResolver(createValidationSchema(questions)),
    defaultValues: getDefaultValues(questions),
  });
  
  // Mutation para enviar respostas
  const submitSurveyMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', `/api/public/surveys/${shareCode}/submit`, {
        answers: data.answers,
        respondentId,
        userAgent: navigator.userAgent,
        location: null, // Seria obtido com geolocalização real
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: 'Pesquisa enviada',
        description: 'Suas respostas foram enviadas com sucesso. Obrigado pela participação!',
      });
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar respostas',
        variant: 'destructive',
      });
    },
  });
  
  // Enviar formulário
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    await submitSurveyMutation.mutateAsync(data);
  };
  
  // Cálculo do progresso
  const progress = questions && questions.length > 0
    ? Math.round(((currentStep + 1) / (questions.length + 1)) * 100)
    : 0;
  
  // Estados de carregamento
  const isLoading = isLoadingSurvey || isLoadingQuestions;
  
  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }
  
  if (!survey || !questions) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <CardTitle>Pesquisa não encontrada</CardTitle>
              <CardDescription>
                Esta pesquisa não existe, expirou ou não está mais disponível.
              </CardDescription>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Voltar para a página inicial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Tela de agradecimento após submissão
  if (isSubmitted) {
    return (
      <div className="container py-10 max-w-3xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <CheckCircle className="h-16 w-16 text-primary" />
              <CardTitle className="text-2xl">Obrigado por sua participação!</CardTitle>
              <CardDescription className="text-center max-w-md mx-auto">
                Suas respostas foram registradas com sucesso. Elas nos ajudarão a melhorar nossos produtos e serviços.
              </CardDescription>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="mt-4"
              >
                Voltar para a página inicial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-10 max-w-3xl mx-auto">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="mb-8">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>Pergunta {currentStep + 1} de {questions.length}</span>
              <span>{progress}% concluído</span>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>{survey.title}</CardTitle>
              {survey.description && <CardDescription>{survey.description}</CardDescription>}
            </CardHeader>
            
            {currentStep < questions.length ? (
              <>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium">{questions[currentStep].text}</h3>
                      {questions[currentStep].required && (
                        <p className="text-sm text-muted-foreground">* Obrigatória</p>
                      )}
                    </div>
                    
                    {questions[currentStep].type === 'single_choice' && (
                      <SingleChoiceQuestion 
                        question={questions[currentStep]} 
                        questionIndex={currentStep} 
                      />
                    )}
                    
                    {questions[currentStep].type === 'multiple_choice' && (
                      <MultipleChoiceQuestion 
                        question={questions[currentStep]} 
                        questionIndex={currentStep} 
                      />
                    )}
                    
                    {questions[currentStep].type === 'open_text' && (
                      <OpenTextQuestion 
                        question={questions[currentStep]} 
                        questionIndex={currentStep} 
                      />
                    )}
                    
                    {questions[currentStep].type === 'scale' && (
                      <ScaleQuestion 
                        question={questions[currentStep]} 
                        questionIndex={currentStep} 
                      />
                    )}
                    
                    {/* Opção para gravação de áudio */}
                    <div className="mt-8">
                      <details className="border rounded-lg">
                        <summary className="cursor-pointer p-4 font-medium">
                          Responder com áudio (opcional)
                        </summary>
                        <div className="p-4 pt-0 border-t">
                          <AudioRecorder questionIndex={currentStep} />
                        </div>
                      </details>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => {
                      // Verificar se a pergunta atual tem resposta válida
                      const question = questions[currentStep];
                      const isValid = form.trigger(`answers.${currentStep}`);
                      
                      // Prosseguir se não for obrigatória ou se estiver válida
                      if (!question.required || isValid) {
                        if (currentStep < questions.length - 1) {
                          setCurrentStep(currentStep + 1);
                        } else {
                          // Última pergunta, enviar o formulário
                          form.handleSubmit(onSubmit)();
                        }
                      }
                    }}
                  >
                    {currentStep < questions.length - 1 ? (
                      <>
                        Próxima
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      'Enviar Respostas'
                    )}
                  </Button>
                </CardFooter>
              </>
            ) : (
              <CardContent>
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-8">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <h3 className="text-xl font-medium">Enviando suas respostas...</h3>
                        <p className="text-muted-foreground text-center mt-2">
                          Por favor, aguarde enquanto processamos suas respostas.
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-medium">Finalizar Pesquisa</h3>
                        <p className="text-muted-foreground text-center mt-2 mb-6">
                          Você respondeu todas as perguntas. Confira suas respostas e clique em
                          Enviar para concluir a pesquisa.
                        </p>
                        <Button
                          type="submit"
                          className="w-full"
                          onClick={form.handleSubmit(onSubmit)}
                        >
                          Enviar Respostas
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </form>
      </FormProvider>
    </div>
  );
}