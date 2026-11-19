'use client'

import { AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import githubIcon from '@/assets/github-icon.svg'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useFormState } from '@/hooks/use-form-state'

import { signInWithGithub } from '../auth-actions'
import { signUpAction } from './sign-up-actions'

export function SignUpForm() {
  const router = useRouter()
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPasswordConfirmationVisible, setIsPasswordConfirmationVisible] =
    useState(false)

  const [{ errors, message, success }, handleSubmit, isPending] = useFormState(
    signUpAction,
    () => {
      router.push('/auth/sign-in')
    },
  )

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-5">
        {success === false && message && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Não foi possível criar a conta</AlertTitle>
            <AlertDescription>
              <p>{message}</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-1">
          <Label htmlFor="username" className="text-slate-700">
            Nome completo
          </Label>
          <Input
            name="username"
            id="username"
            placeholder="Seu nome completo"
            className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white"
          />

          {errors?.username && (
            <p className="text-xs font-medium text-red-500 dark:text-red-400">
              {errors.username[0]}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="text-slate-700">
            E-mail
          </Label>
          <Input
            name="email"
            type="email"
            id="email"
            placeholder="voce@empresa.com"
            className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white"
          />

          {errors?.email && (
            <p className="text-xs font-medium text-red-500 dark:text-red-400">
              {errors.email[0]}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="password" className="text-slate-700">
            Senha
          </Label>
          <div className="relative">
            <Input
              name="password"
              type={isPasswordVisible ? 'text' : 'password'}
              id="password"
              placeholder="Mínimo de 6 caracteres"
              className="h-11 border-slate-200 bg-slate-50 pr-10 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white"
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              aria-pressed={isPasswordVisible}
            >
              {isPasswordVisible ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {errors?.password && (
            <p className="text-xs font-medium text-red-500 dark:text-red-400">
              {errors.password[0]}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="password_confirmation" className="text-slate-700">
            Confirme sua senha
          </Label>
          <div className="relative">
            <Input
              name="password_confirmation"
              type={isPasswordConfirmationVisible ? 'text' : 'password'}
              id="password_confirmation"
              placeholder="Digite a senha novamente"
              className="h-11 border-slate-200 bg-slate-50 pr-10 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white"
            />
            <button
              type="button"
              onClick={() =>
                setIsPasswordConfirmationVisible((visible) => !visible)
              }
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={
                isPasswordConfirmationVisible
                  ? 'Hide password confirmation'
                  : 'Show password confirmation'
              }
              aria-pressed={isPasswordConfirmationVisible}
            >
              {isPasswordConfirmationVisible ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {errors?.password_confirmation && (
            <p className="text-xs font-medium text-red-500 dark:text-red-400">
              {errors.password_confirmation[0]}
            </p>
          )}
        </div>

        <Button
          className="h-11 w-full bg-blue-600 text-sm font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700"
          type="submit"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'Criar conta'
          )}
        </Button>

        <p className="text-center text-sm text-slate-500">
          Já possui uma conta?{' '}
          <Link
            href="/auth/sign-in"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Entrar
          </Link>
        </p>

        <Separator />

        {/* <Button type="submit" className="w-full" variant="outline">
          <Image src={githubIcon} alt="" className="mr-2 size-4 dark:invert" />
          Cadastre-se com GitHub
        </Button> */}
      </form>

      <Separator />

      <form action={signInWithGithub}>
        <Button type="submit" className="w-full" variant="outline">
          <Image src={githubIcon} alt="" className="mr-2 size-4 dark:invert" />
          Cadastre-se com GitHub
        </Button>
      </form>
    </div>
  )
}
