import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Definição de tipos para filtros demográficos
type SexDistribution = {
  male: number;  // Porcentagem masculina
  female: number; // Porcentagem feminina
  other: number;  // Porcentagem outros
};

type AgeRange = {
  min: number;
  max: number;
  percentage: number;
};

type LocationItem = {
  name: string;    // Nome do estado/cidade
  percentage: number; // Porcentagem para este local
};

const demographicSchema = z.object({
  sexDistribution: z.object({
    male: z.number().min(0).max(100),
    female: z.number().min(0).max(100),
    other: z.number().min(0).max(100),
  }).refine(data => (data.male + data.female + data.other) === 100, {
    message: "A soma das porcentagens deve ser igual a 100%",
    path: ["male"] // mostra o erro no campo masculino
  }),
  ageDistribution: z.array(z.object({
    min: z.number().min(0),
    max: z.number().max(100),
    percentage: z.number().min(0).max(100),
  })).refine(data => {
    const sum = data.reduce((acc, curr) => acc + curr.percentage, 0);
    return sum === 100;
  }, {
    message: "A soma das porcentagens de idade deve ser igual a 100%",
    path: ["0.percentage"] // mostra o erro no primeiro campo de porcentagem
  }),
  locationDistribution: z.array(z.object({
    name: z.string().min(1, "Nome do local é obrigatório"),
    percentage: z.number().min(0).max(100),
  })).refine(data => {
    const sum = data.reduce((acc, curr) => acc + curr.percentage, 0);
    return sum === 100;
  }, {
    message: "A soma das porcentagens de localização deve ser igual a 100%",
    path: ["0.percentage"] // mostra o erro no primeiro campo de porcentagem
  }),
});

type DemographicFormValues = z.infer<typeof demographicSchema>;

interface DemographicRequirementsProps {
  surveyId: number;
  initialData?: {
    sexDistribution?: SexDistribution | null;
    ageDistribution?: AgeRange[] | null;
    locationDistribution?: LocationItem[] | null;
    demographicsComplete?: boolean;
  };
  onComplete?: () => void;
}

export function DemographicRequirements({ 
  surveyId, 
  initialData,
  onComplete 
}: DemographicRequirementsProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pré-preencher com valores padrão ou iniciais
  const defaultValues: DemographicFormValues = {
    sexDistribution: initialData?.sexDistribution || { male: 50, female: 50, other: 0 },
    ageDistribution: initialData?.ageDistribution || [
      { min: 16, max: 24, percentage: 25 },
      { min: 25, max: 34, percentage: 25 },
      { min: 35, max: 49, percentage: 25 },
      { min: 50, max: 69, percentage: 20 },
      { min: 70, max: 100, percentage: 5 },
    ],
    locationDistribution: initialData?.locationDistribution || [
      { name: "São Paulo", percentage: 50 },
      { name: "Rio de Janeiro", percentage: 30 },
      { name: "Outros", percentage: 20 },
    ],
  };

  const form = useForm<DemographicFormValues>({
    resolver: zodResolver(demographicSchema),
    defaultValues,
  });

  const onSubmit = async (data: DemographicFormValues) => {
    setIsSubmitting(true);
    try {
      await apiRequest("PUT", `/api/surveys/${surveyId}/demographics`, {
        sexDistribution: data.sexDistribution,
        ageDistribution: data.ageDistribution,
        locationDistribution: data.locationDistribution,
        demographicsComplete: true
      });

      toast({
        title: "Requisitos demográficos salvos",
        description: "Seus requisitos foram salvos com sucesso.",
        variant: "default",
      });

      // Invalidar cache para atualizar a pesquisa
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/${surveyId}`] });
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar requisitos",
        description: "Ocorreu um erro ao salvar os requisitos demográficos.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funções auxiliares para gerenciar distribuições
  const updateSexDistribution = (key: keyof SexDistribution, value: number) => {
    const currentDist = form.getValues().sexDistribution;
    const others = 100 - value;
    
    // Ajustar automaticamente os outros valores
    if (key === "male") {
      const femalePct = Math.min(others, currentDist.female);
      const otherPct = others - femalePct;
      form.setValue("sexDistribution", {
        male: value,
        female: femalePct,
        other: otherPct
      });
    } else if (key === "female") {
      const malePct = Math.min(others, currentDist.male);
      const otherPct = others - malePct;
      form.setValue("sexDistribution", {
        male: malePct,
        female: value,
        other: otherPct
      });
    } else {
      const malePct = Math.min(others, currentDist.male);
      const femalePct = others - malePct;
      form.setValue("sexDistribution", {
        male: malePct,
        female: femalePct,
        other: value
      });
    }
  };

  const addAgeRange = () => {
    const current = form.getValues().ageDistribution || [];
    if (current.length >= 8) return; // Limitar a 8 faixas etárias
    
    const newRange = { min: 18, max: 65, percentage: 0 };
    form.setValue("ageDistribution", [...current, newRange]);
  };

  const removeAgeRange = (index: number) => {
    const current = form.getValues().ageDistribution || [];
    if (current.length <= 1) return; // Manter pelo menos uma faixa etária
    
    const newRanges = current.filter((_, i) => i !== index);
    form.setValue("ageDistribution", newRanges);
  };

  const addLocation = () => {
    const current = form.getValues().locationDistribution || [];
    if (current.length >= 20) return; // Limitar a 20 localizações
    
    const newLocation = { name: "", percentage: 0 };
    form.setValue("locationDistribution", [...current, newLocation]);
  };

  const removeLocation = (index: number) => {
    const current = form.getValues().locationDistribution || [];
    if (current.length <= 1) return; // Manter pelo menos uma localização
    
    const newLocations = current.filter((_, i) => i !== index);
    form.setValue("locationDistribution", newLocations);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Requisitos Demográficos</CardTitle>
        <CardDescription>
          Defina os requisitos demográficos para sua pesquisa. Estes controles determinam
          como os participantes serão selecionados para garantir a representatividade adequada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Distribuição por Sexo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="sexDistribution.male"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Masculino (%)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[field.value]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={values => updateSexDistribution("male", values[0])}
                          />
                          <Input
                            type="number"
                            className="w-16"
                            value={field.value}
                            onChange={e => updateSexDistribution("male", parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sexDistribution.female"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feminino (%)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[field.value]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={values => updateSexDistribution("female", values[0])}
                          />
                          <Input
                            type="number"
                            className="w-16"
                            value={field.value}
                            onChange={e => updateSexDistribution("female", parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sexDistribution.other"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outros (%)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[field.value]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={values => updateSexDistribution("other", values[0])}
                          />
                          <Input
                            type="number"
                            className="w-16"
                            value={field.value}
                            onChange={e => updateSexDistribution("other", parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Distribuição por Idade</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addAgeRange} 
                  size="sm"
                >
                  Adicionar Faixa Etária
                </Button>
              </div>
              
              {form.watch("ageDistribution").map((_, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 border rounded-md">
                  <FormField
                    control={form.control}
                    name={`ageDistribution.${index}.min`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idade Mínima</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`ageDistribution.${index}.max`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{field.value >= 70 ? "70 ou +" : `Idade Máxima`}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`ageDistribution.${index}.percentage`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porcentagem (%)</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex flex-col items-end justify-between">
                    <span className="text-sm text-muted-foreground mt-2 mb-auto">
                      {form.watch(`ageDistribution.${index}.min`)} à {form.watch(`ageDistribution.${index}.max`) >= 70 ? 
                        "70+" : form.watch(`ageDistribution.${index}.max`)}
                    </span>
                    <Button 
                      type="button" 
                      variant="destructive"
                      size="icon"
                      onClick={() => removeAgeRange(index)}
                      className="mb-2"
                    >
                      <span>×</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Distribuição por Localização</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addLocation} 
                  size="sm"
                >
                  Adicionar Localização
                </Button>
              </div>
              
              {form.watch("locationDistribution").map((_, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 border rounded-md">
                  <FormField
                    control={form.control}
                    name={`locationDistribution.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Local (Estado/Cidade)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name={`locationDistribution.${index}.percentage`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Porcentagem (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-end">
                      <Button 
                        type="button" 
                        variant="destructive"
                        size="icon"
                        onClick={() => removeLocation(index)}
                        className="mb-2"
                      >
                        <span>×</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Salvando..." : "Salvar Requisitos Demográficos"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}