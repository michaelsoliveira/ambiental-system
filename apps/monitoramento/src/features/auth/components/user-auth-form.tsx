'use client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import GithubSignInButton from './github-auth-button';
import GoogleSignInButton from './google-auth-button';
import { useAuthContext } from '@/context/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, informe em email válido' }),
  password: z.string().min(3, { message: "A senha deve conter no mínimo 3 caracteres" }),
  username: z.string()
});

type UserFormValue = z.infer<typeof formSchema>;

export default function UserAuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const callbackUrl = searchParams.get('callbackUrl');
  const { client } = useAuthContext()

  const [loading, startTransition] = useTransition();
  const defaultValues = {
    email: '',
    password: '',
    username: ''
  };
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: UserFormValue) => {
    startTransition(async () => {
        if (!register) {
          const response = await signIn("credentials", {
            email: data.email,
            password: data.password,
            // callbackUrl: callbackUrl ?? "/dashboard",
            // redirectTo: '/dashboard'
            redirect: false
          })
          // console.log(JSON.stringify(response))
          if (response?.error && response?.error === "CredentialsSignin") 
            {
              toast.success('Oops, Ocorreu um erro na autenticação', {
                description: "Por favor, verifique sua senha e tente novamente",
                action: {
                  label: 'Fechar',
                  onClick: () => true
                }
              });
              return
            }
  
            if (!response?.error) {
              toast.success('Login realizado com sucesso')
              router.push('/selecionar-modulo')
            }    
        } else {
          try {
            // Cadastra o usuário
            const registerResponse = await client.post('/users/create', data);
            const { error, message } = registerResponse.data;
    
            if (error) {
              toast.error('Erro ao cadastrar', {
                description: message || "Tente novamente",
              });
              return;
            }
    
            toast.success('Usuário cadastrado com sucesso');
    
            // Faz login automático após cadastro
            const loginResponse = await signIn("credentials", {
              email: data.email,
              password: data.password,
              redirect: false
            });
    
            if (!loginResponse?.error) {
              toast.success('Login realizado com sucesso');
              router.push('/dashboard');
            } else {
              toast.error('Cadastro ok, mas erro ao logar');
            }
    
          } catch (err: any) {
            toast.error('Erro inesperado', {
              description: err?.message || 'Tente novamente'
            });
          }
        }
      })
        
  }

  return (
    <>
      <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-2xl font-semibold text-center mb-2 text-white">
          LOGIN
        </h2>
        {/* <p className="text-sm text-center text-white mb-4">
          Entre com um email e senha para ter acesso ao sistema
        </p> */}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="pb-2">
              <FormLabel className='text-white'>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Digite seu email"
                  {...field}
                  className='bg-white'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="pb-2">
              <FormLabel className='text-white'>Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Digite sua senha"
                  {...field}
                  className='bg-white'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center space-x-2 mt-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className='text-white'>Lembre-me</Label>
        </div>

        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
          Entrar
        </Button>

        <div className="my-6 text-center text-white">OU CONTINUE COM</div>

        <GoogleSignInButton />

        <p className="text-xs text-center text-white mt-6">
          Ao clicar em entrar, você está de acordo com os nossos{' '}
          <Link href='/docs/terms' className='underline hover:text-primary'>
            Termos de Serviço
          </Link>{' '}
          e{' '}
          <Link href='/docs/privacy' className='underline hover:text-primary'>
            Política de Privacidade
          </Link>.
        </p>
      </form>
    </Form>
    </>
  );
}
