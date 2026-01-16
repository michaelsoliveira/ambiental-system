import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    expires: string;
    expiresIn?: number;
    user: {
      username: string;
      email: string;
      image: string;
      roles: any;
      permissions: any;
    }
    accessToken?: string;
    refreshToken?: string;
  }

  interface CredentialsInputs {
    email: string;
    password: string;
  }
}
