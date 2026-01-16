import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth } from './auth';
import { toPng } from 'html-to-image';
import { z } from 'zod';
import { signOut } from 'next-auth/react';
import { refreshSession } from './refresh-session';
import { format, parseISO } from 'date-fns';

const isServer = typeof window === "undefined"

const API_URL = isServer ? process.env.INTERNAL_API_URL : process.env.NEXT_PUBLIC_API_URL

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type DrawRoundedRectType = {
  ctx: any, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  radius?: number
}

type optionFieldMinType = {
  field: string,
  min?: number | null,
  type?: string
}

export const optionalFieldMin = ({ field, min, type = "string" }: optionFieldMinType) => {
  switch(type) {
    case "string": 
      return z.string()
        .optional()
        .refine((val) => !val || val.length >= min!, {
          message: `O campo '${field}' deve ter ao menos ${min} caracteres, se preenchido.`,
        });
    case "number":
      return z.literal("").transform(() => undefined)
      .or(z.coerce.number().positive().transform((value: any) => value ?? NaN));
    case "email": 
      return z.string()
          .optional()
          .refine(
            (val) => !val || val.length >= min!, {
            message: `O campo '${field}' deve ter ao menos ${min} caracteres, se preenchido.`,
          }).refine((val: any) => !val || emailRegex.test(val), {
            message: "O email informado está inválido",
          })
    default:
      return z.string().optional()
        .refine((val) => !val || val.length >= min!, {
          message: `O campo '${field}' deve ter ao menos ${min} caracteres, se preenchido.`,
        })
  }
}

export function isValidCnpj(cnpj: string): boolean {
  cnpj = cnpj?.replace(/[^\d]+/g, '');

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

// Adicione esta função ao seu arquivo @/lib/utils

export function isValidCpf(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCpf = cpf?.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  
  // Calcula o primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit >= 10) firstDigit = 0;
  
  // Verifica o primeiro dígito
  if (parseInt(cleanCpf.charAt(9)) !== firstDigit) return false;
  
  // Calcula o segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit >= 10) secondDigit = 0;
  
  // Verifica o segundo dígito
  return parseInt(cleanCpf.charAt(10)) === secondDigit;
}

export function formatCpf(cpf: string): string {
  const cleanCpf = cpf?.replace(/\D/g, '');
  return cleanCpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatCep(cep: string): string {
  const cleanCep = cep?.replace(/\D/g, '');
  return cleanCep?.replace(/(\d{5})(\d{3})/, '$1-$2');
}

export function formatTel(numero: string): string {
  const cleanNum = numero?.replace(/\D/g, '');
  return cleanNum?.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$4');
}

export const formatCnpj = (cnpj: string) => {
  const cnpjFormatado = cnpj?.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );

  return cnpjFormatado
}

export const downloadChart = ({ chartRef, title, description }: { chartRef: any, title?: string, description?: string }) => {
  if (chartRef?.current === null) return;

  // const svgElement = chartRef?.current.querySelector("svg");

  // if (!svgElement) return;
  // const texts = svgElement.querySelectorAll("text");
  // texts.forEach((text: any) => {
  //   text.setAttribute("font-family", "Arial");
  //   text.setAttribute("font-size", "12px");
  // });
  // const serializer = new XMLSerializer();
  // const svgString = serializer.serializeToString(svgElement);
  // const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  // const url = URL.createObjectURL(svgBlob);

  // const img = new Image();
  // img.onload = () => {
  //   const canvas = document.createElement("canvas");
  //   const headerHeight = 80;
  //   canvas.width = svgElement.clientWidth + 20;
  //   canvas.height = svgElement.clientHeight + 80;
  //   const ctx = canvas.getContext("2d");
  //   if (!ctx) return

  //   ctx.font = "bold 12px Arial"
  //   ctx.fillStyle = "#FFFFFF";
  //   // ctx.fillRect(0, 0, canvas.width, canvas.height);
  //   drawRoundedRect({ctx, x: 0, y: 0, width: canvas.width, height: canvas.height, radius: 10});

  //   if (title) {
  //     // Desenhar título
  //     ctx.fillStyle = "#000000";
  //     ctx.font = "bold 16px Arial";
  //     ctx.fillText(title, 20, 30);
  //   }

  //   if (description) {
  //     // Desenhar descrição
  //     ctx.font = "12px Arial";
  //     ctx.fillText(description, 20, 50);
  //   }

  //   ctx.drawImage(img, 0, headerHeight);

  //   // Criar link para download
  //   const link = document.createElement("a");
  //   link.href = canvas.toDataURL("image/png");
  //   link.download = "grafico.png";
  //   link.click();

  //   URL.revokeObjectURL(url);
  // };

  // img.src = url;

    toPng(chartRef.current, {
        backgroundColor: '#ffffff', // 🎨 define fundo branco
      })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'grafico.png';
        link.click();
      })
      .catch((error) => {
        console.log('Erro ao capturar o gráfico', error)
      })
}

export function formatDateToDB(data: string | Date) {
  const date = new Date(data);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export const toDateString = (value: any): string => {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  if (typeof value === "string") {
    return value.split("T")[0];
  }
  return "";
};

export const toDatePtBr = (value: string): string => {
  try {
    const date = parseISO(value);
    return format(date, "yyyy-MM-dd");
  } catch {
    return "";
  }
};

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
 
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
 
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export const drawRoundedRect = ({ ctx, x, y, width, height, radius = 10 }: DrawRoundedRectType) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
};

export const fetchAPI = async (route: string, options?: any, tags?: string[]) => {
  const url = route.startsWith('/') ? route : '/' + route;

  let session = await auth();
  
  if (!session) {
    console.log('Sem sessão ativa');
    return [];
  }

  let response = await fetch(`${API_URL}${url}`, {
      ...options,
      method: options?.method || "GET",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: options?.data ? JSON.stringify(options.data) : undefined,
      next: {
        tags: tags || [],
      },
    });

    // 3. Se o token expirou (ex: 401), tenta refrescar
    if (response.status === 401 && session?.refreshToken) {
      // Tenta renovar o token
      const newTokens = await refreshSession(session.refreshToken);

      if (newTokens?.accessToken) {
        // Atualiza a session manualmente
        session.accessToken = newTokens.access_token;
        session.refreshToken = newTokens.refresh_token || session.refreshToken;

        // (Opcional: atualize o cookie da session também se necessário)

        // Refaz o request com novo token
        response = await fetch(`${API_URL}${url}`, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newTokens.accessToken}`,
          },
          body: options?.data ? JSON.stringify(options.data) : undefined,
          next: {
            tags: tags || [],
          },
        });
      }
    }

    return response.json();
}

export function empresaSemLicencas(empresa: any) {
  const { licencas, ...rest } = empresa
  return rest
}

export function convertToCSV(data: any[]) {
  if (!data.length) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(';'), // header row
    ...data.map(row =>
      headers.map(fieldName => JSON.stringify(row[fieldName] ?? '')).join(';')
    )
  ];

  const csv = csvRows.join('\n');

  return '\uFEFF' + csv;
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const formatData = ({ data }: { data: any }) => {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(data));
}

export const formatHora = ({ hora }: { hora: any }) => {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(hora));
}

// Função para quebrar os rótulos do eixo Y em duas linhas
export const formatLabel = (label: string) => {
  const words = label.split(" ");
  if (words.length > 3) {
    return [words.slice(0, 4).join(" "), words.slice(4).join(" ")]; // Divide após 2 palavras
  }
  return [label];
};

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: 'accurate' | 'normal';
  } = {}
) {
  const { decimals = 0, sizeType = 'normal' } = opts;

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const accurateSizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === 'accurate'
      ? (accurateSizes[i] ?? 'Bytest')
      : (sizes[i] ?? 'Bytes')
  }`;
}
