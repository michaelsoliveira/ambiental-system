'use client'

import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"
import { ControllerRenderProps } from "react-hook-form"
import { cn } from "@/lib/utils"
import { ptBR } from "date-fns/locale"

interface DatePickerProps {
  field: ControllerRenderProps<any, any>
  placeholder?: string
  className?: string
}

export function DatePicker({ field, placeholder = "Selecione uma data", className }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground", className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {field.value ? format(new Date(field.value), "dd/MM/yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
            locale={ptBR}
            mode="single"
            selected={field.value ? new Date(field.value) : undefined}
            onSelect={(date) => {
                field.onChange(date)
                setOpen(false)
            }}
            fromYear={2000}
            toYear={new Date().getFullYear() + 6}
        />
      </PopoverContent>
    </Popover>
  )
}
