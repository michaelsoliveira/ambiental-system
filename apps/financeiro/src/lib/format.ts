/**
 * Formata um número como moeda brasileira
 */
export function formatCurrency(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
  
    if (isNaN(numValue)) {
      return 'R$ 0,00'
    }
  
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue)
  }
  
  /**
   * Formata uma data para o padrão brasileiro
   */
  export function formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
  
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj)
  }
  
  /**
   * Formata uma data curta (dd/mm/yyyy)
   */
  export function formatDateShort(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
  
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dateObj)
  }
  
  /**
   * Formata uma data com hora
   */
  export function formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
  
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj)
  }
  
  /**
   * Retorna a diferença entre duas datas em dias
   */
  export function getDaysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  /**
   * Verifica se uma data está vencida
   */
  export function isOverdue(dueDate: Date | string): boolean {
    const dueDateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
    return dueDateObj < new Date()
  }
  
  /**
   * Formata um número como percentual
   */
  export function formatPercent(value: number | string, decimals: number = 2): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
  
    if (isNaN(numValue)) {
      return '0,00%'
    }
  
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numValue / 100)
  }