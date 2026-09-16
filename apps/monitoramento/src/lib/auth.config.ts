import { NextAuthConfig } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google'
import KeycloakProvider from 'next-auth/providers/keycloak'
import userService from '@/services/user';
import { isKeycloakConfigured, keycloakClientEnv } from '@/lib/auth-mode';

const isServer = typeof window === "undefined"

const API_URL = isServer ? process.env.INTERNAL_API_URL : process.env.NEXT_PUBLIC_API_URL

async function findProvider(token: any) {
  const { name, email, provider, access_token } = token;

  try {
    const dataProvider = {
      username: name,
      email,
      password: Math.random().toString(36).slice(-8),
      image: token?.picture,
      provider,
      id_provider: token?.sub,
      by_provider: true,
    };

    const userExists = await userService.findProvider(token);

    if (userExists) {
      if (!userExists.provider || !userExists.id_provider)
        await userService.update(userExists?.id, dataProvider, access_token);
    } else {
      const user = await userService.create(dataProvider)
        .then(async (res: any) => {
          await userService.sendEmail(dataProvider)
          return res.data
        }).catch((error: any) => {
          console.log(error)
          return null
        })

        return user
    }
    return userExists;
  } catch (error: any) {
    console.log(error.message);
  }
}


async function refreshAccessToken(token: any) {
  const provider = token.provider ? token.provider : 'local';

  switch (provider) {
    case 'local': {
      try {
        const refreshToken = await fetch(`${API_URL}/auth/refresh`,
          {
            method: 'post',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refreshToken: token.refreshToken,
            }),
          }
        ).then((res) => res.json())
        
        const data = {
          ...token,
          accessToken: refreshToken?.access_token,
          accessTokenExpires: Date.now() + refreshToken?.expires_in,
          refreshToken: refreshToken?.refresh_token ?? token?.refreshToken,
          refreshTokenExpired: refreshToken?.refresh_token_expired
        }
        
        return data
      } catch (error: any) {
        console.log(error);

        return {
          ...token,
          error: 'RefreshAccessTokenError',
        };
      }
    }

    case 'google': {
      try {
        const googleClientId =
          process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || ''
        const googleClientSecret =
          process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || ''
        if (!googleClientId || !googleClientSecret) {
          return { ...token, error: 'RefreshAccessTokenError' as const }
        }
        const url =
          'https://oauth2.googleapis.com/token?' +
          new URLSearchParams({
            client_id: googleClientId,
            client_secret: googleClientSecret,
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken,
          });

        const response = await fetch(url, {
          cache: 'no-store',
          body: null,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          method: 'POST',
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
          throw refreshedTokens;
        }

        return {
          ...token,
          accessToken: refreshedTokens.access_token,
          accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
          refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        };
      } catch (error: any) {
        console.log(error);

        return {
          ...token,
          error: 'RefreshAccessTokenError',
        };
      }
    }

    case 'keycloak': {
      try {
        const { clientId, clientSecret, issuer } = keycloakClientEnv()
        if (!clientId || !clientSecret || !issuer) {
          return { ...token, error: 'RefreshAccessTokenError' as const }
        }
        const response = await fetch(
          `${issuer.replace(/\/$/, '')}/protocol/openid-connect/token`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: token.refreshToken || token.refresh_token,
            }),
          }
        )
        const refreshed = await response.json()
        if (!response.ok) throw refreshed
        return {
          ...token,
          accessToken: refreshed.access_token,
          accessTokenExpires: Date.now() + (refreshed.expires_in || 3600) * 1000,
          refreshToken: refreshed.refresh_token ?? token.refreshToken,
        }
      } catch (error: any) {
        console.log(error)
        return { ...token, error: 'RefreshAccessTokenError' }
      }
    }

    default: {
      return token;
    }
  }
}
  
const authConfig = {
  trustHost: true,
  providers: [
    GithubProvider({}),
    GoogleProvider({}),
    ...(isKeycloakConfigured()
      ? [
          KeycloakProvider({
            clientId: keycloakClientEnv().clientId!,
            clientSecret: keycloakClientEnv().clientSecret!,
            issuer: keycloakClientEnv().issuer!,
          }),
        ]
      : []),
    CredentialProvider({
      credentials: {
        email: {
          type: 'email'
        },
        password: {
          type: 'password'
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios.");
        }
        const { email, password } = credentials 
        try {
          const data = await fetch(
            `${API_URL}/auth/login`,
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              cache: 'no-store',
              next: {
                revalidate: 0
              },
              method: 'POST',
              body: JSON.stringify({ email, password }),
            }
          ).then(response => response.json())
          
          const { user, error, message } = data
          
          return user
  
          // switch(message) {
          //   case "invalid_password": throw new InvalidCredentials();
          //   case "user_not_found": throw new UserNotFound();
          //   default: throw new InvalidCredentials();
          // }
          
        } catch (error) {
          console.log(error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60
  },
  callbacks: {
    // async signIn({ user, account, credentials, email }) {
    //   if (!user) {
    //     return false; // Bloqueia o login
    //   }
    //   return true; // Permite o login
    // },
    async jwt({ user, token, account }: any) {
      if (user) {
        return {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            image: user.image,
            roles: user.roles,
            permissions: user.permissions
          },
          accessToken: user.accessToken,
          accessTokenExpires: Date.now() + user.expiresIn * 1000,
          refreshToken: user.refreshToken,
        }
      }
      if (account) {
        await findProvider({ ...token, ...account });
        return {
          provider: account.provider,
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + account.expires_in * 1000,
          refreshToken: account.refresh_token,
          user: {
            id: user?.id,
            email: user?.email,
            image: user?.image,
            username: user?.name,
            roles: user.roles
          },
        };
      }
      if (Date.now() < token.accessTokenExpires) {
        return token;
      } 
      
      return refreshAccessToken(token);

    },
    async session({ session, token }: any) {
      // Send properties to the client, like an access_token from a provider.
      session.user = token.user;
      session.provider = token.provider;
      session.id = token.id;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expiresIn = token.accessTokenExpires;
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Sempre redireciona para o dashboard após login
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: '/',
    error: '/'
  },
  secret: process.env.AUTH_SECRET
} satisfies NextAuthConfig;

export default authConfig;
