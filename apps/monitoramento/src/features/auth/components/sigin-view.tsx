'use client';
import { Metadata } from 'next';
import Link from 'next/link';
import UserAuthForm from './user-auth-form';
import Image from 'next/image';
import LogoSection from './logo-section';

export const metadata: Metadata = {
  title: 'Autenticação',
  description: 'Formulário de autenticação',
};

export default function SignInViewPage() {
  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage: "url('/images/fundo-login.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="hidden w-1/2 md:flex justify-center items-center px-10 bg-black/55">
        <LogoSection />
      </div>

      <div className="w-full md:w-1/2 flex justify-center items-center p-8">
        <div className="w-full max-w-md backdrop-blur-md p-8 rounded-xl shadow-xl">
          <UserAuthForm />
        </div>
      </div>
    </div>
  );
}
