'use client'

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
    const router = useRouter()
  return (
    <div className="flex justify-center items-center min-h-screen p-6 bg-gray-100">
      <Card className="max-w-3xl w-full bg-white shadow-lg rounded-2xl p-6">
        <CardContent>
          <h1 className="text-2xl font-bold mb-4">Política de Privacidade</h1>
          <ScrollArea className="h-72 border p-4 rounded-lg">
            <p className="mb-4">
              Sua privacidade é importante para nós. Leia atentamente nossa Política de Privacidade.
            </p>
            <h2 className="text-lg font-semibold mt-4">1. Coleta de Informações</h2>
            <p className="text-sm text-gray-600">
              Coletamos informações pessoais fornecidas por você, como nome, e-mail e telefone...
            </p>
            <h2 className="text-lg font-semibold mt-4">2. Uso das Informações</h2>
            <p className="text-sm text-gray-600">
              Utilizamos suas informações para melhorar nossos serviços e comunicação...
            </p>
            <h2 className="text-lg font-semibold mt-4">3. Compartilhamento de Dados</h2>
            <p className="text-sm text-gray-600">
              Não vendemos ou compartilhamos seus dados sem consentimento, exceto quando exigido por lei...
            </p>
            <h2 className="text-lg font-semibold mt-4">4. Segurança</h2>
            <p className="text-sm text-gray-600">
              Implementamos medidas de segurança para proteger suas informações contra acessos não autorizados...
            </p>
          </ScrollArea>
          <div className="flex justify-end mt-4">
            <Button onClick={() => router.push('/dashboard')} className="mr-2">Concordo</Button>
            <Button onClick={() => router.push('/auth/signin')} variant="outline">Voltar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
