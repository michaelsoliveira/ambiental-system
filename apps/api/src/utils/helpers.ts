import { z } from 'zod'

// Query schemas
export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  orderBy: z.string().default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  ativo: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
})

export type ListQuery = z.infer<typeof listQuerySchema>

type Order = 'asc' | 'desc';

export function clean<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T;
}

export function processPessoa(data: Record<string, any> | null) {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      value instanceof Date ? value.toISOString() : value
    )
  );
}

export function buildOrderBy(
  orderByStr?: string,
  orderStr?: string
): Record<string, any>[] {
  if (!orderByStr || !orderStr) return [];

  const fields = orderByStr.split(',').map((s) => s.trim());
  const directions = orderStr.split(',').map((s) =>
    s.trim().toLowerCase() as Order
  );

  return fields.map((field, index) => {
    const dir = directions[index] || 'asc';
    const parts = field.split('.');

    // Start with `dir`, but cast result to object explicitly
    const orderObj = parts.reduceRight<Record<string, any>>(
      (acc, key) => ({ [key]: acc }),
      dir as unknown as Record<string, any>
    );

    return orderObj;
  });
}

export async function parseMultipartForm(request: any) {
  const data: Record<string, any> = {}
  const files: any[] = []

  for await (const part of request.parts()) {
    if (part.type === 'field') {
      data[part.fieldname] = part.value
    } else if (part.type === 'file') {
      const buffer = await part.toBuffer()
      files.push({
        filename: part.filename,
        mimetype: part.mimetype,
        encoding: part.encoding,
        buffer,
      })
    }
  }

  return { data, files }
}