import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Controller,
  UseFormSetValue,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { usePreviewNumeroLicenca } from "@/hooks/use-preview-numero-licenca";
import { useEffect, useRef } from "react";

interface LicencaFormProps {
  index: number;
  onRemove: () => void;
  setValue: UseFormSetValue<any>;
  tiposLicenca: { id: string; nome: string; descricao: string }[];
  isLoadingTiposLicenca: boolean;
  tipoLicencaRefs: React.MutableRefObject<Record<number, HTMLButtonElement | null>>;
}

export const LicencaForm = ({
  index,
  onRemove,
  setValue,
  tiposLicenca,
  isLoadingTiposLicenca,
  tipoLicencaRefs
}: LicencaFormProps) => {
  const statusOptions = [
    { label: "Ativa", value: "ativa" },
    { label: "Inativa", value: "inativa" },
  ];
  const ano = new Date().getFullYear();
  const form = useFormContext();
  const tipoLicencaId = useWatch({ name: `licencas.${index}.tipoLicencaId`, control: form.control });
  const getNumeroLicencaAuto = useWatch({ name: "getNumeroLicencaAuto", control: form.control });
  const { data: previewData } = usePreviewNumeroLicenca(tipoLicencaId);
  const errors = form.formState.errors as any

  useEffect(() => {
    if (!previewData?.tipo || !getNumeroLicencaAuto) return;
  
    const tipoAtual = tipoLicencaId;
    const allLicencas = form.getValues("licencas") || [];
  
    const licencasDoMesmoTipoAntes = allLicencas
      .slice(0, index)
      .filter((licenca: any) => licenca.tipoLicencaId === tipoAtual);
  
    const sequencialTotal = previewData.ultimoSequencial + licencasDoMesmoTipoAntes.length + 1;
    const numero = `${previewData.tipo}-${ano}-${String(sequencialTotal).padStart(4, "0")}`;
  
    const currentValue = form.getValues(`licencas.${index}.numeroLicenca`);
    if (currentValue !== numero) {
      form.setValue(`licencas.${index}.numeroLicenca`, numero);
    }
  }, [previewData?.tipo, previewData?.ultimoSequencial, tipoLicencaId, getNumeroLicencaAuto, index, ano, form]);

  return (
    <div className="border p-4 rounded-xl space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`licencas.${index}.tipoLicencaId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Licença</FormLabel>
              <Select 
                onValueChange={field.onChange} value={field.value}
              >
                <FormControl>
                  <SelectTrigger
                    ref={(el) => {
                      tipoLicencaRefs.current[index] = el;
                    }}
                  >
                    <SelectValue placeholder="Selecione o tipo de licença" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingTiposLicenca ? (
                    <SelectItem value="__placeholder__">Carregando...</SelectItem>
                  ) : (
                    tiposLicenca?.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.descricao}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`licencas.${index}.numeroLicenca`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número da Licença <span className="text-zinc-500">(Ex: &ldquo;LO-{ano}-0001&rdquo;)</span> </FormLabel>
              <FormControl>
                <Input {...field} placeholder={`LO-${ano}-0001`} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`licencas.${index}.status`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`licencas.${index}.orgaoEmissor`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Órgão Emissor</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`licencas.${index}.dataEmissao`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Emissão</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`licencas.${index}.dataValidade`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Validade</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Button type="button" variant="destructive" onClick={onRemove}>
        Remover Licença
      </Button>
    </div>
  );
};
