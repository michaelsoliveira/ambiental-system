import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useEffect, useState, DragEvent, useRef } from 'react'
import { toast } from 'sonner'
import { Trash2, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { useAuthContext } from '@/context/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import React from 'react'
import { VencimentoCondicionante } from 'types'

interface CompleteCondicionanteDialogProps {
  isOpen: boolean
  onClose: () => void
  data?: VencimentoCondicionante | null
}

type PreviewFile = {
    id?: string;
    file: File;
    previewUrl: string;
};

export function CompleteCondicionanteDialog({ isOpen, onClose, data }: CompleteCondicionanteDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [files, setFiles] = useState<PreviewFile[]>([]);
    const [observacao, setObservacao] = useState("");
    const [dataCumprimento, setDataCumprimento] = useState("");
    const [erro, setErro] = useState<string | null>(null);
    const maxSizeMB = 5;
    const { client } = useAuthContext()
    const queryClient = useQueryClient()

    useEffect(() => {
        setObservacao(data?.observacao ?? "");
        setDataCumprimento(data?.dataCumprimento ?? "")
        const documentos = data?.documentos?.map((doc: any) => ({
            id: doc.id,
            file: {
            name: doc.name,
            size: doc.size,
            type: "application/pdf",
            } as File,
            previewUrl: doc.path,
        })) ?? [];

        setDocumentosExistentes(documentos);
    }, [data]);

    useEffect(() => {
        if (isOpen) {
          // Resetar arquivos novos e erro ao abrir o diálogo
          setFiles([]);
          setErro(null);
        }
      }, [isOpen]);

    const documentos = data?.documentos?.map((doc: any) => ({
        id: doc.id,
        file: {
            name: doc.name,
            size: doc.size,
            type: "application/pdf",
        } as File,
        previewUrl: doc.path
    }));

    const [documentosExistentes, setDocumentosExistentes] = useState<PreviewFile[]>(documentos);

    const inputRef = useRef<HTMLInputElement>(null);

    const handleSelectFiles = () => {
        inputRef.current?.click();
    };

    const addFiles = (files: FileList) => {
        const valids: PreviewFile[] = [];
        
        Array.from(files).forEach(file => {
          if (file.type !== "application/pdf") {
            setErro("Apenas arquivos PDF são permitidos.");
            return;
          }
          if (file.size > maxSizeMB * 1024 * 1024) {
            setErro(`Arquivo ${file.name} excede o tamanho máximo de ${maxSizeMB}MB.`);
            return;
          }
          valids.push({
            file,
            previewUrl: URL.createObjectURL(file),
          });
        });
    
        if (valids.length > 0) {
          setFiles(prev => [...prev, ...valids]);
          setErro(null);
        }
      };

    const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        if (files) {
            addFiles(files)
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => {
          const file = prev[index];
          if (file) {
            URL.revokeObjectURL(file.previewUrl);
          }
          return prev.filter((_, i) => i !== index);
        });
    };

    const handleRemoveDocumento = async (id: string, index: number) => {
        try {
            const { data } = await client.delete(`/documento/${id}`);
            queryClient.invalidateQueries({ queryKey: ['documentos-licenca']})
            queryClient.invalidateQueries({ queryKey: ['licenca-condicionantes']})
            toast.success(data.message);
            setDocumentosExistentes(prev => prev.filter((_, i) => i !== index));
        } catch (error) {
            toast.error('Erro ao excluir documento.');
            console.error(error);
        }
    }

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const droppedFiles = event.dataTransfer.files;
        if (droppedFiles) {
            addFiles(droppedFiles);
        }
    };
    
    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    async function handleSubmit() {
        try {
            setIsSubmitting(true)
            
            const formData = new FormData()
            files?.forEach((file) => {
                formData.append('files', file.file)
            })
            formData.append('dataCumprimento', dataCumprimento ?? "")
            formData.append('observacao', observacao ?? "")

            await client.put(`/vencimento-condicionante/${data?.id}/complete-condicionante`, formData)
            
        } catch (error) {
            console.error(error)
            toast.error('Erro ao concluir a condicionante.')
        } finally {
            setIsSubmitting(false)
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['licenca-condicionantes'] }),
                queryClient.invalidateQueries({ queryKey: ['documentos-licenca'] }),
                queryClient.invalidateQueries({ queryKey: ['dashboard-totals'] })
            ])
            toast.success('Condicionante concluida com sucesso!')
            onClose();
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Concluir Condicionante</DialogTitle>
                    <DialogDescription>Conclua a condicionante e anexe os documentos relacionados.</DialogDescription>
                </DialogHeader>
                    <div className="space-y-4 p-4">
                        {/* Área de Upload */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Anexar Documentos</Label>
                            <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className={cn(
                                "flex flex-col items-center justify-center border-2 border-dashed rounded-lg px-6 py-4 transition cursor-pointer",
                                erro ? "border-destructive" : "border-muted hover:border-primary"
                            )}
                            >
                            <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">
                                Arraste e solte ou clique para selecionar
                            </p>
                            <Input
                                ref={inputRef}
                                id="file-upload"
                                type="file"
                                multiple
                                accept="application/pdf"
                                className="hidden"
                                onChange={handleFilesChange}
                            />
                            <Label htmlFor="file-upload mt-2">
                                <Button onClick={handleSelectFiles} type='button' size="sm" variant="outline">
                                    Selecionar Arquivos
                                </Button>
                            </Label>
                            </div>
                            {erro && <p className="text-xs text-destructive mt-1">{erro}</p>}
                        </div>
                        <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                            { documentosExistentes?.length > 0 && (
                                <>
                                <AnimatePresence>
                                <Label className="text-sm font-medium">Documentos já anexados</Label>
                                { documentosExistentes.map((file: PreviewFile, index: number) => (
                                    <motion.div
                                        key={file.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                    <Badge variant="secondary" className="flex items-center justify-between w-full p-2 gap-2">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                        <Image src="/pdf-icon.svg" alt="PDF" width={25} height={25} />
                                        <a
                                            href={process.env.NEXT_PUBLIC_API_URL + file.previewUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 underline"
                                        >
                                            <span className="truncate text-xs">{file.file.name}</span>
                                        </a>
                                        <span className="text-xs text-muted-foreground ml-1">
                                            ({(file.file.size / (1024 * 1024)).toFixed(2)} MB)
                                        </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveDocumento(file.id!, index)}
                                            className="w-6 h-6 text-destructive"
                                        >
                                        <Trash2 size={16} />
                                        </Button>
                                    </Badge>
                                    </motion.div>
                                )) 
                                }
                                </AnimatePresence>
                            </>
                            )}
                            { 
                                files?.length > 0 && (
                                <>
                                    <AnimatePresence>
                                    <Label className="text-sm font-medium">Novos Documentos</Label>
                                    { files?.map((file, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                            >
                                            <Badge variant="secondary" className="flex items-center justify-between w-full p-2 gap-2">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                <Image src="/pdf-icon.svg" alt="PDF" width={25} height={25} />
                                                <span className="truncate text-xs">{file.file.name}</span>
                                                <span className="text-xs text-muted-foreground ml-1">
                                                    ({(file.file.size / (1024 * 1024)).toFixed(2)} MB)
                                                </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveFile(index)}
                                                    className="w-6 h-6 text-destructive"
                                                >
                                                <Trash2 size={16} />
                                                </Button>
                                            </Badge>
                                        </motion.div>                                    

                                ))}
                                </AnimatePresence>
                                </>
                            )}
                        </div>
                    </div> 
                    <div className="space-y-2">
                        <Label htmlFor="observacao" className="text-sm font-medium">Data do Protocolo</Label>
                        <Input 
                            type="date" 
                            value={dataCumprimento}
                            onChange={(e) => setDataCumprimento(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="observacao" className="text-sm font-medium">
                        Observações
                        </Label>
                        <Textarea
                            id="observacao"
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            placeholder="Digite observações (opcional)..."
                            className="min-h-[100px]"
                        />
                    </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>Concluir</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
