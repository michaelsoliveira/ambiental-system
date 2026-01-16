import { formatData } from '@/lib/utils';
import React from 'react';

export default function CondicionantesAVencer({ data }: any) {
    return (
        <>
            { data && (
                <ul className="space-y-2 max-h-[46vh] overflow-y-auto scroll-hidden">
                    {data.map((condicionante: any) => (
                        <li key={condicionante.id} className="p-2 rounded-lg shadow-sm bg-blue-100">
                            <div className="flex flex-row items-center justify-between">
                                <p className="line-clamp-3 text-sm text-gray-700">{condicionante?.descricao}</p>
                                <p className="text-sm text-gray-700 pl-1">Vencimento {formatData({ data: condicionante?.data_limite })}</p>
                            </div>
                            <p className="font-medium">{condicionante?.empresa}</p>
                            <p className="text-sm text-gray-700 font-semibold">{condicionante?.status}</p>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
