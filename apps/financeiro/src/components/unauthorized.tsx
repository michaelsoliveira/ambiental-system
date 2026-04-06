"use client";

import { ArrowLeft,Home, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface UnauthorizedProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
}

export function Unauthorized({
  title = "Acesso Negado",
  message = "Você não tem permissão para acessar este recurso.",
  showHomeButton = true,
  showBackButton = true,
}: UnauthorizedProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-red-100 p-6">
            <ShieldAlert className="h-16 w-16 text-red-600" />
          </div>
        </div>

        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          {title}
        </h1>

        <p className="mb-8 text-base text-gray-600">
          {message}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {showBackButton && (
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}

          {showHomeButton && (
            <Button asChild>
              <Link href="/" className="inline-flex items-center gap-2">
                <Home className="h-4 w-4" />
                Ir para Início
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}