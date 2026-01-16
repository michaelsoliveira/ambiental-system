export type UserData = {
    email: string;
    username: string;
    password: string;
    provider: string;
    id_provider: string;
    id_role?: string;
    image: string;
}

export type ResponseData = {
    data: {};
    message: string;
    error: boolean
}

export async function create(dataRequest: UserData) : Promise<ResponseData> {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/users/create`
    
    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify({
            ...dataRequest
        }),
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    })

    const data = await response.json()

    return {
        data: data.user,
        message: data.message,
        error: data.error
    }
}

export async function update(id:string, dataRequest: UserData, token: string) : Promise<any> {
    
    const url = `${process.env.NEXT_PUBLIC_API_URL}/users/${id}`
    
    const response = await fetch(url, {
        method: "PUT",
        body: JSON.stringify({
            ...dataRequest
        }),
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            "Authorization": `Bearer ${token}`
        }
    })

    const data = await response.json()

    return {
        data: data.user,
        message: data.message,
        error: data.error
    }
}

export async function sendEmail(dataResponse: any): Promise<void> {
    const { email, username: name, password } = dataResponse
    const url = `${process.env.NEXT_PUBLIC_API_URL}/users/send-email`

    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify({
            email,
            name,
            message: `Sua senha de acesso é: <b>${password}</b>`
        }),
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    const data = response.json()

    return data
}

export async function findProvider(token?: any): Promise<any> {
    try {

        const url =
          `${process.env.NEXT_PUBLIC_API_URL}/users/provider/find-by-email?` +
          new URLSearchParams({
            email: token?.email
          })
          
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token?.access_token
            } 
        })
        const data = await response.json()

        return data.user
    } catch (error: any) {
        return false
    }
}

const UserService = {
    create,
    sendEmail,
    findProvider,
    update
}

export default UserService
