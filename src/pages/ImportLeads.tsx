import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ImportResult {
  imported_count: number;
  updated_count: number;
  skipped_count: number;
  errors: Array<{ row: number; message: string }>;
}

export default function ImportLeads() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const csvTemplate = `company_name,website,phone,street,zip,city,country,first_name,last_name,email,mobile,position,source,external_id
Musterfirma GmbH,https://musterfirma.de,+49 30 12345678,Musterstraße 1,10115,Berlin,DE,Max,Mustermann,max@musterfirma.de,+49 171 1234567,Geschäftsführer,Website,ext_001
Beispiel AG,https://beispiel.de,+49 89 87654321,Beispielweg 5,80331,München,DE,Erika,Musterfrau,erika@beispiel.de,+49 160 9876543,Vertriebsleiterin,Messe,ext_002`;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine CSV-Datei aus",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      // Read file content
      const fileContent = await file.text();

      // Call edge function
      const { data, error } = await supabase.functions.invoke('import-leads', {
        body: { csvData: fileContent },
      });

      if (error) throw error;

      setResult(data);
      
      toast({
        title: "Import abgeschlossen",
        description: `${data.imported_count} importiert, ${data.updated_count} aktualisiert, ${data.skipped_count} übersprungen`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import fehlgeschlagen",
        description: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Leads importieren</h1>
          <p className="text-muted-foreground">
            Importieren Sie Kontakte und Firmen per CSV-Datei
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>CSV-Vorlage</CardTitle>
            <CardDescription>
              Laden Sie unsere Vorlage herunter und füllen Sie sie mit Ihren Daten aus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Vorlage herunterladen
            </Button>
            
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Erforderliche Felder:</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Mindestens eines der folgenden Felder muss ausgefüllt sein:
              </p>
              <ul className="text-sm list-disc list-inside space-y-1">
                <li><code>company_name</code> - Firmenname</li>
                <li><code>email</code> - E-Mail-Adresse</li>
              </ul>
              
              <h4 className="font-semibold mt-4 mb-2">Optionale Felder:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><code>website</code> - Webseite</div>
                <div><code>phone</code> - Telefon</div>
                <div><code>street</code> - Straße</div>
                <div><code>zip</code> - PLZ</div>
                <div><code>city</code> - Stadt</div>
                <div><code>country</code> - Land</div>
                <div><code>first_name</code> - Vorname</div>
                <div><code>last_name</code> - Nachname</div>
                <div><code>mobile</code> - Mobil</div>
                <div><code>position</code> - Position</div>
                <div><code>source</code> - Quelle</div>
                <div><code>external_id</code> - Externe ID</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CSV-Datei hochladen</CardTitle>
            <CardDescription>
              Wählen Sie Ihre CSV-Datei aus und starten Sie den Import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90"
                />
              </div>

              {file && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Datei ausgewählt: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleImport} 
                disabled={!file || importing}
                className="w-full"
              >
                {importing ? (
                  <>Importiere...</>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import starten
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Import-Ergebnis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.imported_count}
                  </div>
                  <div className="text-sm text-muted-foreground">Neu importiert</div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.updated_count}
                  </div>
                  <div className="text-sm text-muted-foreground">Aktualisiert</div>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {result.skipped_count}
                  </div>
                  <div className="text-sm text-muted-foreground">Übersprungen</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div>
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {result.errors.length} Fehler beim Import aufgetreten
                    </AlertDescription>
                  </Alert>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zeile</TableHead>
                        <TableHead>Fehlermeldung</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.errors.map((error, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{error.row}</TableCell>
                          <TableCell className="text-sm">{error.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
