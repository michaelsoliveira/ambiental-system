import { FieldErrors } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'

interface FormErrorWarningProps {
  errors: FieldErrors<any>
}

export function FormErrorWarning({ errors }: FormErrorWarningProps) {
  const errorList = Object.entries(errors)
    .map(([field, error]) => ({
      field,
      message: error?.message || 'Erro no campo'
    }))

  return (
    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
            Erros encontrados
          </h3>
          <ul className="space-y-1 text-sm text-red-800 dark:text-red-300">
            {errorList.map(({ field, message }: any) => (
              <li key={field} className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400 mt-1">•</span>
                <span>
                  <strong>{field}:</strong> {message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}