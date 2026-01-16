'use client'

import { useSearchParams } from "react-router-dom";

// Atualiza os parâmetros da URL ao modificar os filtros
export const useUpdateFilters = (newFilters: any) => {
    const [,setSearchParams] = useSearchParams()
  
    setSearchParams((prev) => {
        const updated = new URLSearchParams(prev);
        Object.entries(newFilters).forEach(([key, value]) => {
        if (value) {
            updated.set(key, value.toString());
        } else {
            updated.delete(key);
        }
        });
        return updated;
    });
};