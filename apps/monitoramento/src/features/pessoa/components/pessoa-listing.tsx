import { searchParamsCache } from '@/lib/searchparams';
import { DataTable as EmpresaTable } from '@/components/ui/table/data-table';
import { columns } from './pessoa-tables/columns';
import { fetchAPI } from '@/lib/utils';

type PessoaListingPage = object;

export default async function PessoaListingPage({}: PessoaListingPage) {
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const pageLimit = searchParamsCache.get('limit') || 10;
  const orderBy = searchParamsCache.get('orderBy') || 'juridica.nome_fantasia'
  const order = searchParamsCache.get('order') || 'asc'

  const url = `/pessoa/list-all?search=${search}&page=${page}&limit=${pageLimit}&orderBy=${orderBy}&order=${order}`
  try {
    const result = await fetchAPI(url, {}, ['pessoas']);
  
    const { data, error, total } = result;
    return (
      <EmpresaTable
        columns={columns}
        data={data ?? []}
        totalItems={total}
      />
    );
  } catch(error) {
    console.log(JSON.stringify(error))
  }

}
