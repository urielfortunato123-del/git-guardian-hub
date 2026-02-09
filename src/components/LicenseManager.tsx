import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Key, Copy, Trash2, RefreshCw, Shield } from "lucide-react";

type License = {
  id: string;
  license_key: string;
  user_email: string | null;
  max_activations: number;
  current_activations: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  last_heartbeat_at: string | null;
};

function generateKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = 4;
  const segLen = 5;
  const parts: string[] = [];
  for (let s = 0; s < segments; s++) {
    let seg = "";
    for (let i = 0; i < segLen; i++) {
      seg += chars[Math.floor(Math.random() * chars.length)];
    }
    parts.push(seg);
  }
  return `LH-${parts.join("-")}`;
}

function addDuration(duration: string): string {
  const now = new Date();
  switch (duration) {
    case "30d":
      now.setDate(now.getDate() + 30);
      break;
    case "6m":
      now.setMonth(now.getMonth() + 6);
      break;
    case "1y":
      now.setFullYear(now.getFullYear() + 1);
      break;
    case "lifetime":
      now.setFullYear(now.getFullYear() + 100);
      break;
    default:
      now.setDate(now.getDate() + 30);
  }
  return now.toISOString();
}

const DURATION_LABELS: Record<string, string> = {
  "30d": "30 Dias",
  "6m": "6 Meses",
  "1y": "1 Ano",
  "lifetime": "Vitalícia",
};

export function LicenseManager() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [duration, setDuration] = useState("30d");
  const [maxActivations, setMaxActivations] = useState("3");
  const [generating, setGenerating] = useState(false);

  const fetchLicenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Erro ao carregar licenças");
    } else {
      setLicenses((data as License[]) || []);
    }
    setLoading(false);
  };

  const createLicense = async () => {
    setGenerating(true);
    const key = generateKey();
    const expiresAt = addDuration(duration);

    const { error } = await supabase.from("licenses").insert({
      license_key: key,
      user_email: email.trim() || null,
      max_activations: parseInt(maxActivations) || 3,
      is_active: true,
      expires_at: expiresAt,
    });

    if (error) {
      toast.error("Erro ao criar licença: " + error.message);
    } else {
      toast.success("Licença criada com sucesso!");
      setEmail("");
      fetchLicenses();
    }
    setGenerating(false);
  };

  const revokeLicense = async (id: string) => {
    const { error } = await supabase
      .from("licenses")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao revogar");
    } else {
      toast.success("Licença revogada");
      fetchLicenses();
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Chave copiada!");
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = (d: string | null) => {
    if (!d) return false;
    return new Date(d) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Generator */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Gerar Nova Licença</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email do cliente (opcional)</label>
            <Input
              placeholder="cliente@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Duração</label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">30 Dias</SelectItem>
                <SelectItem value="6m">6 Meses</SelectItem>
                <SelectItem value="1y">1 Ano</SelectItem>
                <SelectItem value="lifetime">Vitalícia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Máx. ativações</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={maxActivations}
              onChange={(e) => setMaxActivations(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={createLicense}
              disabled={generating}
              className="w-full"
            >
              <Key className="w-4 h-4 mr-2" />
              {generating ? "Gerando..." : "Gerar Licença"}
            </Button>
          </div>
        </div>
      </div>

      {/* License List */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Licenças</h3>
          <Button variant="outline" size="sm" onClick={fetchLicenses} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Carregar
          </Button>
        </div>

        {licenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Clique em "Carregar" para ver as licenças existentes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chave</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Ativações</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((lic) => (
                  <TableRow key={lic.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                          {lic.license_key}
                        </code>
                        <button
                          onClick={() => copyKey(lic.license_key)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lic.user_email || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(lic.expires_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {lic.current_activations}/{lic.max_activations}
                    </TableCell>
                    <TableCell>
                      {!lic.is_active ? (
                        <Badge variant="destructive" className="text-xs">Revogada</Badge>
                      ) : isExpired(lic.expires_at) ? (
                        <Badge variant="outline" className="text-xs border-destructive text-destructive">Expirada</Badge>
                      ) : (
                        <Badge className="text-xs bg-accent/20 text-accent border-accent/30">Ativa</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(lic.created_at)}
                    </TableCell>
                    <TableCell>
                      {lic.is_active && (
                        <button
                          onClick={() => revokeLicense(lic.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Revogar licença"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
