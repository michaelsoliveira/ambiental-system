"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

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

export interface OptionType {
  readonly label: string
  readonly value: string | number
}

export interface GroupedOptionType {
  readonly label: string
  readonly options: OptionType[]
  readonly badge?: string | number
}

export type SelectItemsProps = {
  placeholder?: string
  value?: any
  options?: (OptionType | GroupedOptionType)[] | null
  className?: string
  emptyText?: string
  searchPlaceholder?: string
  isLoading?: boolean
  onValueChange: (option: any) => void
  onSearchChange?: (value: string) => void
  formatGroupLabel?: (group: GroupedOptionType) => React.ReactNode
  truncate?: boolean
  truncateWidth?: string
  styleInputCustom?: string
  disabled?: boolean
  name?: string
  hasMore?: boolean
  onLoadMore?: () => void
  isLoadingMore?: boolean
  /** Valores sentinela (ex.: all-contas) ocultados enquanto o usuário digita busca server-side */
  sentinelValues?: Array<string | number>
}

const isGroupedOption = (
  option: OptionType | GroupedOptionType,
): option is GroupedOptionType => "options" in option

const flattenOptions = (options: (OptionType | GroupedOptionType)[]): OptionType[] => {
  const flattened: OptionType[] = []
  options.forEach((option) => {
    if (isGroupedOption(option)) {
      flattened.push(...option.options)
    } else {
      flattened.push(option)
    }
  })
  return flattened
}

const isSentinel = (value: string | number, sentinels: Array<string | number>) =>
  sentinels.some((s) => s == value)

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
  truncateWidth = "14rem",
  styleInputCustom,
  disabled,
  name,
  hasMore,
  onLoadMore,
  isLoadingMore,
  sentinelValues = [],
}: SelectItemsProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [selectedLabelCache, setSelectedLabelCache] = useState<string | null>(null)

  const serverSideSearch = Boolean(onSearchChange)
  const searching = searchValue.trim().length > 0

  const flatOptions = options ? flattenOptions(options) : []
  const selectedOption = flatOptions.find((option) => option.value == value)

  const visibleFlatOptions = useMemo(() => {
    if (!serverSideSearch || !searching) return flatOptions
    if (sentinelValues.length > 0) {
      return flatOptions.filter((o) => !isSentinel(o.value, sentinelValues))
    }
    return flatOptions.filter((o) => !String(o.value).startsWith("all-"))
  }, [flatOptions, serverSideSearch, searching, sentinelValues])

  useEffect(() => {
    if (selectedOption) {
      setSelectedLabelCache(selectedOption.label)
      return
    }
    if (value == null || value === "") {
      setSelectedLabelCache(null)
    }
  }, [value, selectedOption])

  const handleSearchChange = (newValue: string) => {
    setSearchValue(newValue)
    onSearchChange?.(newValue)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSearchValue("")
      if (serverSideSearch) onSearchChange?.("")
    }
  }

  const handleSelect = (option: OptionType) => {
    setSelectedLabelCache(option.label)
    onValueChange(option.value)
    setSearchValue("")
    if (serverSideSearch) onSearchChange?.("")
    setOpen(false)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return

    if (serverSideSearch && searching) {
      e.preventDefault()
      e.stopPropagation()
      if (isLoading || visibleFlatOptions.length === 0) return
      handleSelect(visibleFlatOptions[0])
    }
  }

  const displayLabel = selectedOption?.label ?? selectedLabelCache ?? placeholder

  const DefaultGroupLabel = ({ group }: { group: GroupedOptionType }) => (
    <div className="flex items-center justify-between py-1.5 px-2 text-sm font-semibold text-muted-foreground">
      <span>{group.label}</span>
      {group.badge && (
        <Badge variant="secondary" className="text-xs">
          {group.badge}
        </Badge>
      )}
    </div>
  )

  const renderOptionItem = (option: OptionType, className?: string) => (
    <CommandItem
      key={option.value}
      value={serverSideSearch ? String(option.value) : option.label}
      keywords={[option.label, String(option.value)]}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onSelect={() => handleSelect(option)}
      className={cn("cursor-pointer", className)}
    >
      <Check
        className={cn(
          "mr-2 h-4 w-4 shrink-0",
          value == option.value ? "opacity-100" : "opacity-0",
        )}
      />
      <span className="text-wrap">{option.label}</span>
    </CommandItem>
  )

  const hasGroupedOptions = options?.some(isGroupedOption) ?? false

  return (
    <div className="relative max-w-4xl">
      <Popover modal open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              !value && value !== 0 && "text-muted-foreground",
              styleInputCustom,
            )}
            disabled={disabled}
          >
            <span
              className={cn(
                truncate ? "truncate" : "",
                truncateWidth && `max-w-[${truncateWidth}]`,
              )}
            >
              {displayLabel}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          style={{ minWidth: "var(--radix-popper-anchor-width)" }}
          className="p-0 max-w-[min(200px,calc(100vw-16px))]"
          align="start"
          avoidCollisions
          collisionPadding={8}
        >
          <Command shouldFilter={!serverSideSearch} className="w-full">
            <CommandInput
              value={searchValue}
              onValueChange={handleSearchChange}
              onKeyDown={handleInputKeyDown}
              placeholder={searchPlaceholder}
              name={name}
            />
            <CommandList className="max-h-[12rem]">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                {isLoading ? "Carregando..." : emptyText}
              </CommandEmpty>

              {hasGroupedOptions && !serverSideSearch
                ? options?.map((option, idx) => {
                    if (!isGroupedOption(option)) return null
                    return (
                      <CommandGroup key={`group-${idx}`} heading="">
                        <div className="px-2 py-1.5">
                          {formatGroupLabel ? (
                            formatGroupLabel(option)
                          ) : (
                            <DefaultGroupLabel
                              group={{
                                ...option,
                                badge: option.badge || option.options.length,
                              }}
                            />
                          )}
                        </div>
                        {option.options.map((groupOption) =>
                          renderOptionItem(groupOption, "pl-4"),
                        )}
                      </CommandGroup>
                    )
                  })
                : (
                  <CommandGroup>
                    {visibleFlatOptions.map((option) => renderOptionItem(option))}
                  </CommandGroup>
                )}
            </CommandList>
            {hasMore && (
              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Carregando..." : "Carregar mais"}
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
