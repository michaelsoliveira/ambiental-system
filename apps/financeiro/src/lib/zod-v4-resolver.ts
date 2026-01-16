import { z } from 'zod';

export function zodV4Resolver<T extends z.ZodType>(schema: T) {
  return async (data: any) => {
    try {
      // ⭐ v4: parseAsync é mais seguro
      const result = await schema.safeParseAsync(data);
      
      if (!result.success) {
        const errors: Record<string, any> = {};
        
        // ⭐ v4: estrutura de erros mudou
        result.error.issues.forEach((issue) => {
          const path = issue.path.join('.');
          if (path) {
            errors[path] = {
              type: issue.code,
              message: issue.message,
            };
          }
        });

        return { values: {}, errors };
      }

      return { values: result.data, errors: {} };
    } catch (error) {
      // Captura qualquer erro não tratado
      console.warn('Validation error:', error);
      return { values: {}, errors: {} };
    }
  };
}