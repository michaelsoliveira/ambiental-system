export const prepareFormData = (data: any, entity: string) => {
    const formData = new FormData();
    
    // Separar dados do processo dos files
    const { files = [], ...dados } = data;
    
    // Adicionar dados do processo como JSON
    formData.append(entity, JSON.stringify(dados));
    
    // Preparar metadados dos files (sem os arquivos File)
    const filesMetadata = files.map((doc: any) => ({
      id: doc.id,
      tipo: doc.tipo,
      description: doc.description,
      required: doc.required,
      created_at: doc.created_at,
      size: doc.size,
      name: doc.name,
      type: doc.type
    })) || [];
    
    formData.append('files', JSON.stringify(filesMetadata));
    
    // Adicionar cada arquivo com sua chave única
    files.forEach((doc: any) => {
      const file = doc.file ? doc.file : doc.originalFile;
      if (file instanceof File) {
        formData.append(`file_${doc.id}`, file, file.name);
      }
    });
    
    return formData;
  };
  