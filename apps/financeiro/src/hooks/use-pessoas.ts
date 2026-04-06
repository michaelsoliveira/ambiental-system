import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { PessoaFormValues } from '@/features/pessoa/utils/form-schema';
import { api } from '@/http/api-client';
import { queryClient } from '@/lib/react-query';
import { extractErrors } from '@/lib/utils';

interface PessoasParams {
  search?: string;
  page?: number;
  limit?: number;
  cidade?: string;
  estado?: string;
  tipo?: string;
  hasEmail?: string;
  hasPhone?: string;
  createdAfter?: string;
  createdBefore?: string;
  orderBy?: string;
  order?: string;
}

export interface Pessoa {
  id: string
  created_at: string
  updated_at: string
  tipo: string
  email: string
  telefone: string
  endereco_id: string
  user_id: any
  tag_id: any
  created_by_user_id: string
  endereco: Endereco
  fisica?: Fisica
  juridica?: Juridica
}

export interface Endereco {
  id: string
  created_at: string
  updated_at: string
  cep: string
  logradouro: string
  numero: string
  bairro: string
  complemento: string
  estado_id: number
  municipio_id: number
}

export interface Fisica {
  pessoa_id: string
  nome: string
  cpf: string
  data_nascimento: string
  rg: string
}

export interface Juridica {
  pessoa_id: string
  nome_fantasia: string
  cnpj: string
  razao_social: string
  data_abertura: string
  inscricao_estadual: string
  inscricao_municipal: string
}


export function usePessoas(slug: string, params: PessoasParams = {}) {
  return useQuery({
    queryKey: ['pessoas', params],
    queryFn: async () => {
      
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([, value]) => value !== undefined && value !== null && value !== ''
        )
      );

      const res = await api.get(`organizations/${slug}/pessoas`, {
        searchParams: cleanParams,
      });

      return await res.json();
    },
    staleTime: 1000 * 60, // 1 minuto
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!slug,
  });
}

export function useCreatePessoa(slug: string) {
  return useMutation({
    mutationFn: async (data: PessoaFormValues) => {
      const res = await api.post(`organizations/${slug}/pessoas`, { 
        json: data
      });
      
      return await res.json();
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      toast.success(res.message || 'Pessoa criada com sucesso!');
    },
    onError: (error: any) => {
      // Trata diferentes tipos de erro
      let errorMessage = 'Erro ao criar pessoa';

      if (error?.response) {
        // Erro vindo da API
        const errData = error.response;
        errorMessage = errData.error || errData.message || errorMessage;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (Array.isArray(error)) {
        // Múltiplos erros
        errorMessage = extractErrors(error).join('\n');
      }

      toast.error(errorMessage);
    }
  });
}

export function useUpdatePessoa(slug: string) {
  return useMutation({
    mutationFn: async ({
      pessoaId,
      ...data
    }: Partial<PessoaFormValues> & { pessoaId: string }) => {
      try {
        const res = await api.put(
          `organizations/${slug}/pessoas/${pessoaId}`, {
            json: data
          }
        );

        return await res.json();
      } catch (error: any) {
        const errData = await error.response?.json();
        console.log(error.response)
        if (errData?.errors) {
          throw errData.errors;
        }
        throw errData?.error || 'Erro inesperado';
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      toast.success('Pessoa atualizada com sucesso!');
    },
    onError: (errors: any) => {
      const messages = Array.isArray(errors)
        ? errors
        : extractErrors(errors);
      toast.error(messages.join('\n'));
    }
  });
}

export function useDeletePessoa(slug: string) {
  return useMutation({
    mutationFn: async (pessoaId: string) => {
      const response = await api
        .delete(`organizations/${slug}/pessoas/${pessoaId}`)
        .json<any>();

      if (response.error) {
        throw new Error(response.message || 'Erro ao excluir a pessoa');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      toast.success('Pessoa excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir pessoa');
    }
  });
}