import { api } from './api-client'

interface SignUpRequest {
  username: string
  email: string
  password: string
}

type SignUpResponse = void

export async function signUp({
  username,
  email,
  password,
}: SignUpRequest): Promise<SignUpResponse> {
  await api.post('users', {
    json: {
      username,
      email,
      password,
    },
  })
}