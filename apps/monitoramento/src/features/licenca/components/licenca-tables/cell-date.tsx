export const CellDate = ({ data }: { data: any }) => {
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'UTC',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(data));
    }