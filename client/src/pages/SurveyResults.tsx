import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Survey, Question, Response, Answer } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';
import { ArrowLeft, Download, Send, Filter, List, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';

// Cores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

export default function SurveyResults() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'table' | 'charts'>('charts');
  
  // Buscar dados da pesquisa
  const { data: survey, isLoading: isLoadingSurvey } = useQuery<Survey>({
    queryKey: ['/api/surveys', id],
  });
  
  // Buscar perguntas da pesquisa
  const { data: questions, isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: ['/api/surveys', id, 'questions'],
    enabled: !!survey,
  });
  
  // Buscar respostas da pesquisa
  const { data: responses, isLoading: isLoadingResponses } = useQuery<Response[]>({
    queryKey: ['/api/surveys', id, 'responses'],
    enabled: !!survey,
  });
  
  // Buscar respostas para cada pergunta
  const { data: answers, isLoading: isLoadingAnswers } = useQuery<Record<number, Answer[]>>({
    queryKey: ['/api/surveys', id, 'answers'],
    enabled: !!questions && !!responses,
    queryFn: async () => {
      if (!questions) return {};
      
      const allAnswers: Record<number, Answer[]> = {};
      
      // Para cada pergunta, buscar suas respostas
      for (const question of questions) {
        try {
          const response = await fetch(`/api/questions/${question.id}/answers`);
          const questionAnswers: Answer[] = await response.json();
          allAnswers[question.id] = questionAnswers;
        } catch (error) {
          console.error(`Error fetching answers for question ${question.id}:`, error);
          allAnswers[question.id] = [];
        }
      }
      
      return allAnswers;
    },
  });
  
  // Função para preparar dados para gráficos
  const prepareChartData = (questionId: number) => {
    if (!answers || !answers[questionId]) return [];
    
    const question = questions?.find(q => q.id === questionId);
    if (!question) return [];
    
    // Para perguntas de escolha única ou múltipla
    if (['single_choice', 'multiple_choice'].includes(question.type)) {
      const options = question.options || [];
      const counts: Record<string, number> = {};
      
      // Inicializar contadores para cada opção
      options.forEach(option => {
        counts[option.text] = 0;
      });
      
      // Contar respostas
      answers[questionId].forEach(answer => {
        if (answer.value) {
          // Para escolha única
          const matchingOption = options.find(opt => opt.value === answer.value);
          if (matchingOption) {
            counts[matchingOption.text] = (counts[matchingOption.text] || 0) + 1;
          }
        } else if (answer.values) {
          // Para múltipla escolha
          const values = answer.values as string[];
          values.forEach(val => {
            const matchingOption = options.find(opt => opt.value === val);
            if (matchingOption) {
              counts[matchingOption.text] = (counts[matchingOption.text] || 0) + 1;
            }
          });
        }
      });
      
      // Converter para formato adequado para gráficos
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }
    
    // Para perguntas de escala
    if (question.type === 'scale') {
      const counts: Record<string, number> = {};
      
      answers[questionId].forEach(answer => {
        if (answer.value) {
          counts[answer.value] = (counts[answer.value] || 0) + 1;
        }
      });
      
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => {
          // Ordenar por valor numérico da escala, se possível
          const aNum = parseFloat(a.name);
          const bNum = parseFloat(b.name);
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          
          return a.name.localeCompare(b.name);
        });
    }
    
    return [];
  };
  
  // Função para exportar resultados para CSV
  const exportToCSV = () => {
    if (!survey || !questions || !responses || !answers) return;
    
    // Preparar cabeçalho
    let csv = 'RespondentID,Timestamp';
    questions.forEach(q => {
      csv += `,${q.text.replace(/,/g, ' ')}`; // Remover vírgulas do texto da pergunta
    });
    csv += '\n';
    
    // Preparar linhas (uma por resposta)
    responses.forEach(response => {
      const responseTime = response.completedAt 
        ? format(new Date(response.completedAt), 'yyyy-MM-dd HH:mm:ss')
        : '';
        
      let row = `${response.respondentId},${responseTime}`;
      
      questions.forEach(question => {
        const questionAnswers = answers[question.id] || [];
        const responseAnswer = questionAnswers.find(a => a.responseId === response.id);
        
        if (!responseAnswer) {
          row += ',';
          return;
        }
        
        let answerText = '';
        
        // Formatar resposta de acordo com o tipo de pergunta
        if (question.type === 'open_text') {
          answerText = responseAnswer.value || '';
          // Escapar aspas e remover quebras de linha
          answerText = `"${answerText.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        } else if (question.type === 'multiple_choice' && responseAnswer.values) {
          const values = responseAnswer.values as string[];
          const optionTexts = values.map(v => {
            const option = question.options?.find(opt => opt.value === v);
            return option ? option.text : v;
          });
          answerText = `"${optionTexts.join('; ')}"`;
        } else if (responseAnswer.value) {
          // Para escolha única e escala
          if (question.type === 'single_choice') {
            const option = question.options?.find(opt => opt.value === responseAnswer.value);
            answerText = option ? option.text : responseAnswer.value;
          } else {
            answerText = responseAnswer.value;
          }
          
          // Escapar texto se contiver vírgulas
          if (answerText.includes(',')) {
            answerText = `"${answerText}"`;
          }
        }
        
        row += `,${answerText}`;
      });
      
      csv += row + '\n';
    });
    
    // Criar e baixar o arquivo CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${survey.title.replace(/\s+/g, '_')}_results.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Preparar estatísticas gerais
  const prepareOverviewStats = () => {
    if (!survey || !responses || !questions) return null;
    
    const stats = {
      totalResponses: responses.length,
      completionRate: 0, // Será calculado abaixo
      averageTimeToComplete: 0, // Seria calculado com timestamps reais
      totalQuestions: questions.length,
      questionTypes: {} as Record<string, number>,
    };
    
    // Calcular estatísticas de tipos de perguntas
    questions.forEach(q => {
      stats.questionTypes[q.type] = (stats.questionTypes[q.type] || 0) + 1;
    });
    
    // Taxa de conclusão (simulada)
    stats.completionRate = 92; // Normalmente seria calculada com base em dados reais
    
    return stats;
  };
  
  const stats = prepareOverviewStats();
  const isLoading = isLoadingSurvey || isLoadingQuestions || isLoadingResponses || isLoadingAnswers;
  
  if (isLoading) {
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
  
  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation('/surveys')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Resultados da Pesquisa</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'table' ? 'charts' : 'table')}>
            {viewMode === 'table' ? <BarChartIcon className="mr-2 h-4 w-4" /> : <List className="mr-2 h-4 w-4" />}
            {viewMode === 'table' ? 'Ver Gráficos' : 'Ver Tabelas'}
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={() => setLocation(`/surveys/${id}/share`)}>
            <Send className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{survey.title}</CardTitle>
          {survey.description && <CardDescription>{survey.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold">{responses?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Respostas</div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold">{questions?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Perguntas</div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold">{stats?.completionRate || 0}%</div>
              <div className="text-sm text-muted-foreground">Taxa de conclusão</div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold">{survey.status}</div>
              <div className="text-sm text-muted-foreground">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {questions && questions.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            {questions.map((question) => (
              <TabsTrigger value={`question-${question.id}`} key={question.id}>
                Pergunta {question.order + 1}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Visão Geral da Pesquisa</CardTitle>
                <CardDescription>
                  Resumo de todas as respostas coletadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Estatísticas</h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Total de respostas</TableCell>
                          <TableCell>{stats?.totalResponses || 0}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Taxa de conclusão</TableCell>
                          <TableCell>{stats?.completionRate || 0}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Total de perguntas</TableCell>
                          <TableCell>{stats?.totalQuestions || 0}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Status da pesquisa</TableCell>
                          <TableCell className="capitalize">{survey.status}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Data de criação</TableCell>
                          <TableCell>
                            {survey.createdAt ? format(new Date(survey.createdAt), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Tipos de Perguntas</h3>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(stats?.questionTypes || {}).map(([type, count]) => ({
                              name: (() => {
                                switch (type) {
                                  case 'single_choice': return 'Escolha Única';
                                  case 'multiple_choice': return 'Múltipla Escolha';
                                  case 'open_text': return 'Texto Livre';
                                  case 'scale': return 'Escala';
                                  case 'demographic': return 'Demográfica';
                                  default: return type;
                                }
                              })(),
                              value: count,
                            }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {Object.keys(stats?.questionTypes || {}).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 space-y-4">
                  <h3 className="text-lg font-medium">Últimas Respostas</h3>
                  {responses && responses.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID do Respondente</TableHead>
                          <TableHead>Data de Resposta</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {responses.slice(0, 5).map((response) => (
                          <TableRow key={response.id}>
                            <TableCell className="font-medium">{response.respondentId}</TableCell>
                            <TableCell>
                              {response.completedAt ? format(new Date(response.completedAt), 'dd/MM/yyyy HH:mm') : '-'}
                            </TableCell>
                            <TableCell>Completa</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma resposta recebida ainda.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {questions.map((question) => (
            <TabsContent value={`question-${question.id}`} key={question.id}>
              <Card>
                <CardHeader>
                  <CardTitle>Pergunta {question.order + 1}</CardTitle>
                  <CardDescription>
                    {question.text}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">Tipo: </span>
                        <span className="capitalize">
                          {(() => {
                            switch (question.type) {
                              case 'single_choice': return 'Escolha Única';
                              case 'multiple_choice': return 'Múltipla Escolha';
                              case 'open_text': return 'Texto Livre';
                              case 'scale': return 'Escala';
                              case 'demographic': return 'Demográfica';
                              default: return question.type;
                            }
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Respostas: </span>
                        <span>{answers && answers[question.id] ? answers[question.id].length : 0}</span>
                      </div>
                    </div>
                    
                    {/* Visualização de resultados em gráficos */}
                    {viewMode === 'charts' && ['single_choice', 'multiple_choice', 'scale'].includes(question.type) && (
                      <div className="h-80 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          {question.type === 'scale' ? (
                            <BarChart data={prepareChartData(question.id)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="value" fill="#8884d8" name="Contagem" />
                            </BarChart>
                          ) : (
                            <PieChart>
                              <Pie
                                data={prepareChartData(question.id)}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label
                              >
                                {prepareChartData(question.id).map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    {/* Visualização em tabela */}
                    {viewMode === 'table' && ['single_choice', 'multiple_choice', 'scale'].includes(question.type) && (
                      <Table className="mt-4">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Opção</TableHead>
                            <TableHead>Contagem</TableHead>
                            <TableHead>Porcentagem</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {prepareChartData(question.id).map((item, index) => {
                            const total = answers && answers[question.id] ? answers[question.id].length : 0;
                            const percentage = total > 0 ? (item.value / total) * 100 : 0;
                            
                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.value}</TableCell>
                                <TableCell>{percentage.toFixed(1)}%</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                    
                    {/* Perguntas de texto livre */}
                    {question.type === 'open_text' && answers && answers[question.id] && (
                      <div className="mt-4 space-y-4">
                        <h3 className="text-lg font-medium">Respostas de texto</h3>
                        {answers[question.id].length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Respondente</TableHead>
                                <TableHead>Resposta</TableHead>
                                <TableHead>Data</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {answers[question.id].map((answer) => {
                                // Buscar a resposta completa para obter timestamp
                                const response = responses?.find(r => r.id === answer.responseId);
                                
                                return (
                                  <TableRow key={answer.id}>
                                    <TableCell className="font-medium">
                                      {response?.respondentId || 'Anônimo'}
                                    </TableCell>
                                    <TableCell>{answer.value || ''}</TableCell>
                                    <TableCell>
                                      {response?.completedAt
                                        ? format(new Date(response.completedAt), 'dd/MM/yyyy HH:mm')
                                        : '-'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-muted-foreground">Nenhuma resposta recebida para esta pergunta.</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Esta pesquisa não possui perguntas ou você não tem permissão para visualizá-las.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}