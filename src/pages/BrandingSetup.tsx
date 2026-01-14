import Layout from "@/components/Layout";
import { BrandingSetup } from "@/components/BrandingSetup";

export default function BrandingSetupPage() {
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Lead-Seite Anpassen</h1>
          <p className="text-muted-foreground">
            Passe deine Lead-Seiten mit deinem Branding, Dienstleistung und Fallstudien an. 
            Diese Informationen werden auf allen personalisierten Lead-Seiten verwendet.
          </p>
        </div>
        
        <BrandingSetup />
      </div>
    </Layout>
  );
}
