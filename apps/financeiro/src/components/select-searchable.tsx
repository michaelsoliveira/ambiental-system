"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import { useEffect,useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"

import { ScrollArea } from "./ui/scroll-area"

export interface OptionType {
    readonly label: string;
    readonly value: string | number;
}

export interface GroupedOptionType {
    readonly label: string;
    readonly options: OptionType[];
    readonly badge?: string | number; // Para mostrar contagem ou outras informações
}

export type SelectItemsProps = {
    placeholder?: string;
    value?: any;
    options?: (OptionType | GroupedOptionType)[] | null;
    className?: string;
    emptyText?: string;
    searchPlaceholder?: string;
    isLoading?: boolean;
    onValueChange: (option: any) => void;
    onSearchChange?: (value: string) => void;
    formatGroupLabel?: (group: GroupedOptionType) => React.ReactNode;
    truncate?: boolean;
    truncateWidth?: string;
    styleInputCustom?: string;
    disabled?: boolean;
    name?: string;
    hasMore?: boolean;
    onLoadMore?: () => void;
    isLoadingMore?: boolean;
}

// Função helper para verificar se é um grupo
const isGroupedOption = (option: OptionType | GroupedOptionType): option is GroupedOptionType => {
    return 'options' in option;
};

// Função para achatar as opções e manter referência ao grupo
const flattenOptions = (options: (OptionType | GroupedOptionType)[]): OptionType[] => {
    const flattened: OptionType[] = [];
    
    options.forEach(option => {
        if (isGroupedOption(option)) {
            flattened.push(...option.options);
        } else {
            flattened.push(option);
        }
    });
    
    return flattened;
};

export function SelectSearchable({ 
    onSearchChange,
    value,
    options,
    onValueChange,
    placeholder = "Selecione uma opção...",
    emptyText = "Nenhuma opção encontrada.",
    searchPlaceholder = "Buscar...",
    isLoading,
    formatGroupLabel,
    truncate = false,
    truncateWidth = '14rem',
    styleInputCustom,
    disabled,
    name,
    hasMore,
    onLoadMore,
    isLoadingMore
} : SelectItemsProps) {
  const [open, setOpen] = useState(false)
  const [width, setWidth] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [searchValue, setSearchValue] = useState("");
  
  // Achatar todas as opções para encontrar a selecionada
  const flatOptions = options ? flattenOptions(options) : [];
  const selectedOption = flatOptions.find((option) => option.value == value); // Usando == para comparação flexível

  const handleSearchChange = (newValue: string) => {
    setSearchValue(newValue);
    onSearchChange?.(newValue);
  };

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

  // Componente padrão para label de grupo
  const DefaultGroupLabel = ({ group }: { group: GroupedOptionType }) => (
    <div className="flex items-center justify-between py-1.5 px-2 text-sm font-semibold text-muted-foreground">
      <span>{group.label}</span>
      {group.badge && (
        <Badge variant="secondary" className="text-xs">
          {group.badge}
        </Badge>
      )}
    </div>
  );

  return (
    <div className="relative max-w-4xl">
      <Popover modal open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
              styleInputCustom
            )}
            disabled={disabled}
          >
            <span className={cn(truncate ? `truncate` : "",
              truncateWidth && `max-w-[${truncateWidth}]`
            )}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          style={{ width: width }}
          className="p-0"
          align="start"
        >
          <Command className="w-full">
            <CommandInput 
              value={searchValue}
              onValueChange={handleSearchChange}
              placeholder={searchPlaceholder}
              name={name}
            />
            <CommandList className="max-h-[12rem]">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                {isLoading ? "Carregando..." : emptyText}
              </CommandEmpty>
              
              {options?.map((option, idx) => {
                if (isGroupedOption(option)) {
                  // Renderizar grupo
                  return (
                    <CommandGroup key={`group-${idx}`} heading="">
                      {/* Header do grupo */}
                      <div className="px-2 py-1.5">
                        {formatGroupLabel ? 
                          formatGroupLabel(option) : 
                          <DefaultGroupLabel group={{...option, badge: option.badge || option.options.length}} />
                        }
                      </div>
                      
                      {/* Itens do grupo */}
                      {option.options.map((groupOption) => (
                        <CommandItem
                          key={groupOption.value}
                          value={groupOption.label}
                          onSelect={() => {
                            onValueChange(groupOption.value);
                            setOpen(false);
                          }}
                          className="pl-4" // Indentação para itens do grupo
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value == groupOption.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="text-wrap">
                            {groupOption.label}
                          </span>  
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                } else {
                  // Renderizar item individual (não agrupado)
                  return (
                    <CommandGroup key={`item-${idx}`}>
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => {
                          onValueChange(option.value);
                          setOpen(false);
                        }}
                        className="w-full"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value == option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="text-wrap">
                          {option.label}
                        </span>
                      </CommandItem>
                    </CommandGroup>
                  );
                }
              })}
            </CommandList>
            {hasMore && (
              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}