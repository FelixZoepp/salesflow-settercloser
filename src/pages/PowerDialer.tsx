import Layout from "@/components/Layout";
import PowerDialerPanel from "@/components/PowerDialerPanel";
import { Phone } from "lucide-react";

export default function PowerDialer() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Phone className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Power Dialer</h1>
            <p className="text-muted-foreground">
              Kaltakquise mit automatischem Lead-Wechsel
            </p>
          </div>
        </div>

        <PowerDialerPanel />
      </div>
    </Layout>
  );
}
