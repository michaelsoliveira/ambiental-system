// components/licenca/LicencasStep.tsx
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useTiposLicenca } from "@/hooks/use-tipos-licenca";
import { LicencaForm } from "@/features/pessoa/components/form/licenca-pessoa-form";
import { useRef } from "react";
import { useWatch } from "react-hook-form";

export const LicencasStep = ({ licencas }: any) => {
  const { control, setValue } = useFormContext();
  

  const hasLicencaData = useWatch({ control, name: "hasLicencaData" });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "licencas",
  });
  const tipoLicencaRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const addLicenca = () => {
    const newIndex = licencas.length;

    append({
      tipoLicencaId: "",
      numeroLicenca: "",
      status: "",
      orgaoEmissor: "",
      dataEmissao: format(new Date(), "yyyy-MM-dd"),
      dataValidade: format(new Date(), "yyyy-MM-dd"),
    })

    setTimeout(() => {
      tipoLicencaRefs.current[newIndex]?.focus();
    }, 100);
  }

  // useEffect(() => {
  //   if (!getNumeroLicencaAuto && hasLicencaData) {
  //     for (let i = 0; i < fields.length; i++) {
  //       const path = `licencas.${i}.numeroLicenca`;
  //       setValue(path, "");
  //     }
  //   }
  // }, [getNumeroLicencaAuto, hasLicencaData, fields.length, setValue]);

  const { data: dataTiposLicenca = [], isLoading } = useTiposLicenca({ orderBy: 'descricao' });
  const { data: tiposLicenca } = dataTiposLicenca
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Label htmlFor="hasLicencaData">Possui Licença Ambiental?</Label>
        <Controller
          name="hasLicencaData"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        { hasLicencaData && (
          <>
            <Label htmlFor="gerarNumeroAuto">Gerar Número Licença Automaticamente?</Label>
            <Controller
              name="getNumeroLicencaAuto"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </>
        ) }
      </div>

      {hasLicencaData && (
        <div className="space-y-6">
          {fields.map((field, index) => (
            <LicencaForm
              key={field.id}
              index={index}
              onRemove={() => remove(index)}
              setValue={setValue}
              tiposLicenca={tiposLicenca}
              isLoadingTiposLicenca={isLoading}
              tipoLicencaRefs={tipoLicencaRefs}
            />
          ))}

          <Button
            type="button"
            onClick={addLicenca}
          >
            Adicionar Licença
          </Button>
        </div>
      )}
    </div>
  );
};
