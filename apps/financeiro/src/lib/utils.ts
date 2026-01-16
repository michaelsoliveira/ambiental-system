import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractErrors(errors: any): string[] {
  const messages: string[] = [];

  function traverse(obj: any, prefix = '') {
    if (typeof obj === 'string') {
      messages.push(`${prefix}${obj}`);
    } else if (Array.isArray(obj)) {
      for (const msg of obj) {
        messages.push(`${prefix}${msg}`);
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        traverse(value, prefix ? `${prefix}.${key}: ` : `${key}: `);
      }
    }
  }

  traverse(errors);
  return messages;
}

export function isValidCnpj(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]+/g, '');

  if (!cnpj || cnpj.length !== 14) return false;

  if (/^(\d)\1+$/.test(cnpj)) return false; // todos os dígitos iguais

  let t = cnpj.length - 2;
  let d = cnpj.substring(t);
  let d1 = parseInt(d.charAt(0));
  let d2 = parseInt(d.charAt(1));
  let calc = (x: number) => {
    let n = cnpj.substring(0, x);
    let y = x - 7;
    let s = 0;
    let r = 0;

    for (let i = x; i >= 1; i--) {
      s += +n.charAt(x - i) * y--;
      if (y < 2) y = 9;
    }

    r = 11 - (s % 11);
    return r > 9 ? 0 : r;
  };

  return calc(t) === d1 && calc(t + 1) === d2;
}

export function isValidCpf(cpf: string): boolean {
  // Remove tudo que não for dígito
  cpf = cpf.replace(/[^\d]+/g, '');

  if (!cpf || cpf.length !== 11) return false;

  // Elimina CPFs com todos os dígitos iguais (ex.: 00000000000)
  if (/^(\d)\1+$/.test(cpf)) return false;

  // Função para calcular os dígitos
  const calcCheckDigit = (base: string, factor: number): number => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += parseInt(base.charAt(i)) * factor--;
    }
    const remainder = 11 - (sum % 11);
    return remainder > 9 ? 0 : remainder;
  };

  const baseNine = cpf.substring(0, 9);
  const d1 = calcCheckDigit(baseNine, 10); // primeiro dígito verificador
  const d2 = calcCheckDigit(baseNine + d1, 11); // segundo dígito verificador

  return d1 === parseInt(cpf.charAt(9)) && d2 === parseInt(cpf.charAt(10));
}


export const formatCnpj = (cnpj: string) => {
  const cnpjFormatado = cnpj?.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );

  return cnpjFormatado
}

export const formatCpf = (cpf: string) => {
  const cpfFormatado = cpf.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    "$1.$2.$3-$4"
  );

  return cpfFormatado
}
