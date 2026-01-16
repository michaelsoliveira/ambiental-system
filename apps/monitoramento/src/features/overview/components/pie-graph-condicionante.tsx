// app/dashboard/_components/DashboardCondicionantesPorEmpresa.tsx

'use client';

import { useAuthContext } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type CondicionanteEmpresaData = {
  nome: string;
  tipoCondicionante: string;
  total: number;
};

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28EFF',
  '#FF6666', '#66CC99', '#FFCC00', '#9933FF', '#FF9999',
];

export function PieGraphCondicionante() {
  // const [data, setData] = useState<CondicionanteEmpresaData[]>([]);
  const { client } = useAuthContext();
  const { data = []} = useQuery<CondicionanteEmpresaData[]>({
    queryKey: ['condicionantes-empresa'],
    queryFn: async () => {
      const { data } = await client.get('/dashboard/get-condicionantes-empresa')

      return data
    }
  })

  // Agrupar por empresa
  const empresas = Array.from(
    new Set(data?.map((d) => d.nome))
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {empresas && empresas.map((empresa, index) => {
        const dadosEmpresa = data.filter((d) => d.nome === empresa);

        return (
          <div
            key={index}
            className="rounded-xl shadow-md p-4 bg-white"
          >
            <h3 className="text-lg font-semibold text-center mb-4">
              {empresa}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosEmpresa}
                  dataKey="total"
                  nameKey="tipoCondicionante"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  // label
                >
                  {dadosEmpresa.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}
