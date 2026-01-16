"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface OptionType {
    readonly label: string;
    readonly value: string | number;
}


export type SelectItemsProps = {
    callback: (option: any) => void;
    placeholder?: string;
    field?: any;
    options?: OptionType[] | null;
    className?: string;
}

export function SelectSearchable({ 
    callback,
    placeholder,
    field,
    options,
    ...rest
} : SelectItemsProps) {
  const [open, setOpen] = useState(false)
  const [width, setWidth] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const updateWidth = () => {
    if (triggerRef.current) {
      setWidth(triggerRef.current.offsetWidth);
      triggerRef.current.focus()
    }
  };

  useEffect(() => {
    updateWidth();
    window.addEventListener("resize", updateWidth);
    
    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  return (
    <div className="relative max-w-5xl">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !field && "text-muted-foreground"
            )}
          >
            {field?.value
              ? options?.find((option: OptionType) => option.value === field.value)?.label
              : "Selecione um Item"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          style={{ width: width }}
          className="p-0"
          align="start"
        >
          <Command className="w-full">
            <CommandInput placeholder={placeholder} />
            <CommandList>
              <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
              <CommandGroup>
                {options?.map((option: OptionType, idx: number) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      callback(option)  
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        field?.value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
