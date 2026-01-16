'use client'

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

export default function TermsOfUsePage() {
    const router = useRouter();
  return (
    <div className="flex justify-center items-center min-h-screen p-6 bg-gray-100">
      <Card className="max-w-3xl w-full bg-white shadow-lg rounded-2xl p-6">
        <CardContent>
          <h1 className="text-2xl font-bold mb-4">Termos de Uso</h1>
          <ScrollArea className="h-72 border p-4 rounded-lg">
            <p className="mb-4">
              Bem-vindo aos nossos Termos de Uso. Leia atentamente antes de usar nosso serviço.
            </p>
            <h2 className="text-lg font-semibold mt-4">1. Aceitação dos Termos</h2>
            <p className="text-sm text-gray-600">
              Ao acessar e utilizar nossos serviços, você concorda com os seguintes termos...
            </p>
            <h2 className="text-lg font-semibold mt-4">2. Uso do Serviço</h2>
            <p className="text-sm text-gray-600">
              O usuário deve utilizar o serviço de maneira responsável e ética...
            </p>
            <h2 className="text-lg font-semibold mt-4">3. Modificações</h2>
            <p className="text-sm text-gray-600">
              Podemos modificar estes Termos a qualquer momento sem aviso prévio...
            </p>
          </ScrollArea>
          <div className="flex justify-end mt-4">
            <Button onClick={() => router.push('/dashboard')} className="mr-2">Aceitar</Button>
            <Button onClick={() => router.back()} variant="outline">Cancelar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
