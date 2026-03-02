import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus, Check } from "lucide-react";
import { toast } from "sonner";

export function SuggestionModal() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");

  const submit = () => {
    if (!url.trim()) return;
    const existing = JSON.parse(localStorage.getItem("placar_suggestions") || "[]");
    existing.push({ url: url.trim(), description: desc.trim().slice(0, 280), createdAt: new Date().toISOString() });
    localStorage.setItem("placar_suggestions", JSON.stringify(existing));
    setUrl("");
    setDesc("");
    setOpen(false);
    toast.success("Sugestão salva localmente. Obrigado!");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <MessageSquarePlus className="w-4 h-4" />
          Sugestão de Correção
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sugerir Correção</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Informe o link da fonte oficial que comprova a correção.
        </p>
        <div className="space-y-3 mt-2">
          <Input
            placeholder="https://fonte-oficial.gov.br/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Textarea
            placeholder="Descrição breve (máx. 280 caracteres)"
            maxLength={280}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button onClick={submit} disabled={!url.trim()} size="sm" className="gap-1.5">
              <Check className="w-4 h-4" /> Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
