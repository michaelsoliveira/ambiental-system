import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface Document {
  id: string;
  name: string;
  path: string;
}

interface DocumentListDialog {
  documents: Document[];
  open: boolean;
  onClose: () => void;
}

export function DocumentListDialog({ documents, open, onClose }: DocumentListDialog) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedDocument = selectedIndex !== null ? documents[selectedIndex] : null;

  const goNext = () => {
    if (selectedIndex !== null && selectedIndex < documents.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const goPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const closeViewer = () => setSelectedIndex(null);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        {!selectedDocument ? (
          <>
            <DialogTitle>Documentos Anexados</DialogTitle>
            <DialogDescription>Estes documentos estão anexados a condicionante</DialogDescription>
            <div className="flex flex-col space-y-2 mt-4">
              {documents.map((doc, index) => (
                <Button
                  key={doc.id}
                  variant="outline"
                  onClick={() => setSelectedIndex(index)}
                  className="justify-start"
                >
                  📄 {doc.name}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogTitle>{selectedDocument.name}</DialogTitle>
            <DialogDescription>Visualização prévia do documento</DialogDescription>
              <div className="h-[70vh] mt-4">
                <iframe
                  src={process.env.NEXT_PUBLIC_API_URL + selectedDocument.path}
                  title={selectedDocument.name}
                  className="w-full h-full border rounded-md"
                />
              </div>
            <div className="flex justify-between mt-4">
              <div className="space-x-2">
                <Button
                  variant="secondary"
                  onClick={goPrev}
                  disabled={selectedIndex === 0}
                >
                  ⬅️ Anterior
                </Button>
                <Button
                  variant="secondary"
                  onClick={goNext}
                  disabled={selectedIndex === documents.length - 1}
                >
                  Próximo ➡️
                </Button>
              </div>
              <Button variant="outline" onClick={closeViewer}>
                📋 Voltar para a lista
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
