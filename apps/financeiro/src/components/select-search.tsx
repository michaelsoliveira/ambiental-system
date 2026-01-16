'use client'

import { cn } from '@/lib/utils';
import AsyncSelect from 'react-select/async';
import { Label } from './ui/label';
import { ComponentProps, forwardRef } from 'react';

interface State {
    readonly inputValue: string;
}

export interface OptionType {
    readonly label: string;
    readonly value: string | Number | undefined;
}

type AsyncSelectProps = ComponentProps<typeof AsyncSelect>;

export type SelectType = {
  label?: string;
  onChange: (option: any) => void;
  defaultOptions?: OptionType[];
  placeholder?: string;
  value?: any;
  options?: any;
  isMulti?: boolean;
  initialData?: any;
  styleLabel?: string;
  selectStyle?: string;
  filterOption?: any;
} & AsyncSelectProps

export const SelectSearch = forwardRef<any, SelectType>(
  ({ label, onChange, options, defaultOptions, placeholder, styleLabel, filterOption, value, selectStyle, isMulti = false, initialData, ...rest }, ref) => {
    return (
      <div>
        { label && (<Label className={cn("text-sm", styleLabel)} htmlFor="">{ label }</Label>) }
        <AsyncSelect
          ref={ref}
          isMulti={isMulti}
          loadOptions={options}
          filterOption={filterOption}
          className={cn("text-sm", selectStyle)}
          defaultOptions={defaultOptions}
          placeholder={placeholder}
          value={Array.isArray(value)
            ? value.map((data: any) => ({ label: data.label, value: data.value }))
            : value}
          onChange={onChange}
          theme={(theme: any) => ({
            ...theme,
            colors: {
              ...theme.colors,
              primary: 'rgb(83 114 53)',
              primary75: 'rgb(109 128 58)',
              primary50: 'rgb(158 179 132)',
              primary25: 'rgb(206 222 189)',
            },
          })}
          menuPortalTarget={typeof window !== "undefined" ? document.body : null}
          menuPosition="fixed"
          menuShouldBlockScroll
          styles={{
            menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
          }}
          {...rest}
        />

      </div>
    )
}
)

SelectSearch.displayName = 'SelectSearch'