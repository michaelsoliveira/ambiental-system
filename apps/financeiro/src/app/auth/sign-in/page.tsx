import { SignInForm } from "@/features/auth/sign-in/sign-in-form";

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex w-full"
      style={{
        backgroundImage: "url('/bg_sidebar.jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="hidden w-1/2 md:flex justify-center items-center px-10 bg-black/55">
        <div className="text-center text-white space-y-3">
          <h1 className="text-4xl font-bold">AmbientalSystem</h1>
          <p className="text-sm text-white/80">Consultoria & Serviços</p>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex justify-center items-center p-8">
        <div className="w-full max-w-md backdrop-blur-md dark:bg-black/35 p-8 rounded-xl shadow-xl">
          <SignInForm />
        </div>
      </div>
    </div>
  )
}