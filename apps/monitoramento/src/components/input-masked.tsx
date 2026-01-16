import React, { FocusEventHandler } from "react"
import { useMask } from '@react-input/mask'
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils" // se usar função de classes

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement> | undefined;
  replacement?: any;
  className?: string;
  placeholder?: string;
}

export const InputMasked = React.forwardRef<HTMLInputElement, InputProps>(
  ({ mask, value, onChange, replacement, error, onBlur, className, placeholder, ...props }, ref) => {
    const inputRef = useMask({
      mask,
      replacement,
      showMask: true
    });

    React.useImperativeHandle(ref, () => inputRef.current!);

    return (
      <Input
        value={value}
        onChange={onChange}
        className={cn("w-full", error && "border-red-500", className)}
        placeholder={placeholder}
        ref={inputRef}
        onBlur={onBlur}
        {...props}
      />
    )}
);

InputMasked.displayName = "InputMasked";
