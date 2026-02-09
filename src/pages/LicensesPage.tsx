import { LicenseManager } from "@/components/LicenseManager";
import { Shield } from "lucide-react";

export function LicensesPage() {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Licenças</h1>
            <p className="text-sm text-muted-foreground">Gere, gerencie e revogue chaves de licença para seus clientes</p>
          </div>
        </div>
        <LicenseManager />
      </div>
    </div>
  );
}
