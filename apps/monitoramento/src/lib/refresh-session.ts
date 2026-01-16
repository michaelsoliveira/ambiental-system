export async function refreshSession(refreshToken: string) {
    try {
      const response = await fetch(`/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken }),
      });
  
      if (!response.ok) throw new Error('Erro ao tentar renovar o token.');
  
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar o token:', error);
      return null;
    }
  }