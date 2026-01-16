import { useFormContext, useFieldArray } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SelectSearchable } from "@/components/select-searchable"
import { Trash2, Plus } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/format"

export function ParcelasTab() {
  const form = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "parcelas"
  })

  const formaParcelamento = form.watch('forma_parcelamento')
  const valor = form.watch('valor')
  const numeroParcelas = form.watch('numero_parcelas')

  const statusOptions = [
    { label: 'Pendente', value: 'PENDENTE' },
    { label: 'Paga', value: 'PAGA' },
    { label: 'Cancelada', value: 'CANCELADA' },
    { label: 'Atrasada', value: 'ATRASADA' }
  ]

  const handleAddParcela = () => {
    const novaParcela = {
      numero_parcela: (fields.length || 0) + 1,
      data_vencimento: new Date().toISOString().split('T')[0],
      valor: '0.00',
      pago: false,
      status_parcela: 'PENDENTE'
    }
    append(novaParcela)
  }

  const calcularTotalParcelas = () => {
    return fields.reduce((total, field: any) => {
      const val = parseFloat(field.valor || '0')
      return total + (isNaN(val) ? 0 : val)
    }, 0)
  }

  const totalParcelas = calcularTotalParcelas()
  const valorOriginal = parseFloat(valor || '0')
  const diferenca = valorOriginal - totalParcelas

  if (formaParcelamento === 'UNICA' || !fields || fields.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Nenhuma parcela configurada. Altere a forma de parcelamento para criar parcelas.
        </p>
        <Button 
          type="button"
          variant="outline"
          onClick={handleAddParcela}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Parcela Manual
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-muted-foreground">Valor Total</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(valorOriginal)}
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-muted-foreground">Total Parcelas</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalParcelas)}
          </p>
        </div>
        
        <div className={`${diferenca === 0 ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'} p-4 rounded-lg border`}>
          <p className="text-sm text-muted-foreground">Diferença</p>
          <p className={`text-2xl font-bold ${diferenca === 0 ? 'text-gray-600 dark:text-gray-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
            {formatCurrency(diferenca)}
          </p>
        </div>
      </div>

      {/* Tabela de Parcelas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Detalhes das Parcelas</h3>
          <Button 
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddParcela}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Parcela
          </Button>
        </div>

        {fields.length > 0 ? (
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-16">Nº</TableHead>
                  <TableHead>Data Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field: any, index: number) => (
                  <TableRow key={field.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {field.numero_parcela}
                    </TableCell>
                    
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`parcelas.${index}.data_vencimento`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="date"
                                {...field}
                                className="h-8"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`parcelas.${index}.valor`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                  R$
                                </span>
                                <Input 
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="h-8 pl-6"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`parcelas.${index}.status_parcela`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <SelectSearchable
                                options={statusOptions}
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Status"
                                emptyText="Nenhum status"
                                searchPlaceholder="Buscar..."
                                truncate
                                truncateWidth="100px"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">Nenhuma parcela adicionada</p>
            <Button 
              type="button"
              variant="outline"
              onClick={handleAddParcela}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Parcela
            </Button>
          </div>
        )}
      </div>

      {diferenca !== 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Existe uma diferença de <strong>{formatCurrency(Math.abs(diferenca))}</strong> entre o valor total e a soma das parcelas.
            {diferenca > 0 ? ' Adicione mais parcelas ou aumente os valores.' : ' Reduza os valores das parcelas.'}
          </p>
        </div>
      )}
    </div>
  )
}