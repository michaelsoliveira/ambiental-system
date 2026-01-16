import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import LicencaForm from './licenca-form';
import { LicencaType } from 'types';
import { fetchAPI } from '@/lib/utils';

type LicencaViewPageProps = {
  licencaId: string;
};

export default async function LicencaViewPage({
  licencaId
}: LicencaViewPageProps) {
  let licenca = null;
  let pageTitle = 'Cadastrar Licença';
  const session = await auth();

  if (session && licencaId !== 'new') {
    const data = await fetchAPI(`/licenca/find-one/${licencaId}`)
    licenca = data as LicencaType;
    
    if (!licenca) {
      notFound();
    }
    pageTitle = `Editar Licença`;
  }

  return <LicencaForm initialData={licenca} pageTitle={pageTitle} />;
}




// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { useState } from 'react'
// import { CondicionanteListing, CondicionanteListingItem } from '@/features/condicionante/components/condicionante-listing';
// import { LicencaDetails } from './licenca-details';

// interface LicencaViewPageProps {
//   licenca: LicencaType
//   condicionantes: CondicionanteListingItem[]
// }

// export default function LicencaViewPage({ licenca, condicionantes }: LicencaViewPageProps) {
//   const [tab, setTab] = useState('detalhes')

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <CardTitle>Licença nº {licenca.numeroLicenca}</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Tabs value={tab} onValueChange={setTab} className="w-full">
//             <TabsList>
//               <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
//               <TabsTrigger value="condicionantes">Condicionantes</TabsTrigger>
//               <TabsTrigger value="outros">Outros</TabsTrigger>
//             </TabsList>

//             <TabsContent value="detalhes">
//               { JSON.stringify(licenca, null, 2) }
//               <LicencaDetails licenca={licenca} />
//             </TabsContent>

//             <TabsContent value="condicionantes">
//               <CondicionanteListing data={condicionantes} />
//             </TabsContent>

//             <TabsContent value="outros">
//               <p className="text-muted-foreground italic">Conteúdo adicional em construção.</p>
//             </TabsContent>
//           </Tabs>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
