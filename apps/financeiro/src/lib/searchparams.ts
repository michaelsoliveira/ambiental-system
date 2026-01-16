import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString
} from 'nuqs/server';

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  q: parseAsString,
  tipo: parseAsString,
  cidade: parseAsString,
  estado: parseAsString,
  has_email: parseAsString,
  has_phone: parseAsString,
  created_after: parseAsString,
  created_before: parseAsString,
  orderBy: parseAsString,
  order: parseAsString,
  dataInicio: parseAsString,
  dataFim: parseAsString,
  ano: parseAsString,
  status: parseAsString
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
