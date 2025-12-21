import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy, Check, Send, Megaphone, Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Campaign {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  personalized_url: string | null;
  outreach_message: string | null;
  created_at: string;
}

interface ImportResult {
  imported_count: number;
  updated_count: number;
  skipped_count: number;
  errors: Array<{ row: number; message: string }>;
}

const OutboundLeads = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");

  const csvTemplate = `first_name,last_name,company,email,linkedin_url,phone
Max,Mustermann,Musterfirma GmbH,max@musterfirma.de,https://linkedin.com/in/max-mustermann,+49 30 12345678
Erika,Musterfrau,Beispiel AG,erika@beispiel.de,https://linkedin.com/in/erika-musterfrau,+49 89 87654321`;

  useEffect(() => {
    fetchContacts();
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, name')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setCampaigns(data);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, company, personalized_url, outreach_message, created_at')
        .eq('lead_type', 'outbound')
        .is('outreach_status', null)
        .order('created_at', { ascending: true })
        .limit(20);

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast.error("Fehler beim Laden der Outbound-Leads");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'outbound_leads_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Bitte wählen Sie eine CSV-Datei aus");
      return;
    }
    
    if (!selectedCampaignId) {
      toast.error("Bitte wählen Sie eine Kampagne aus");
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const fileContent = await file.text();
      
      const { data, error } = await supabase.functions.invoke('import-leads', {
        body: { csvData: fileContent, leadType: 'outbound', campaignId: selectedCampaignId },
      });

      if (error) throw error;

      setImportResult(data);
      toast.success(`${data.imported_count} importiert, ${data.updated_count} aktualisiert`);
      fetchContacts();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : "Ein Fehler ist aufgetreten");
    } finally {
      setImporting(false);
    }
  };

  const resetImportDialog = () => {
    setFile(null);
    setImportResult(null);
    setSelectedCampaignId("");
  };

  const copyMessage = (contact: Contact) => {
    if (!contact.outreach_message) {
      toast.error("Keine Nachricht vorhanden");
      return;
    }
    // The outreach_message already contains the full URL from the database
    navigator.clipboard.writeText(contact.outreach_message);
    setCopiedId(contact.id);
    toast.success("Nachricht kopiert!");
    
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const markAsSent = async (contact: Contact) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ outreach_status: 'gesendet' as any })
        .eq('id', contact.id);

      if (error) throw error;
      
      toast.success(`${contact.first_name} als gesendet markiert`);
      fetchContacts();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error("Fehler beim Aktualisieren");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Lädt...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Megaphone className="w-6 h-6 text-cyan-500" />
              <h1 className="text-2xl font-semibold text-foreground">Outbound Pipeline</h1>
            </div>
            <p className="text-muted-foreground">
              {contacts.length} offene Leads • Limit 20 pro Tag
            </p>
          </div>
          
          <Dialog open={importDialogOpen} onOpenChange={(open) => {
            setImportDialogOpen(open);
            if (!open) resetImportDialog();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                CSV Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Outbound Leads importieren</DialogTitle>
                <DialogDescription>
                  Laden Sie eine CSV-Datei mit Ihren Outbound-Leads hoch
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Template Download */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2 text-sm">CSV-Vorlage</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Laden Sie unsere Vorlage herunter und füllen Sie sie mit Ihren Daten aus.
                  </p>
                  <Button onClick={downloadTemplate} variant="outline" size="sm">
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Vorlage herunterladen
                  </Button>
                </div>
                
                {/* Fields Info */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2 text-sm">Erforderliche Felder</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <div><code>first_name</code> - Vorname *</div>
                    <div><code>last_name</code> - Nachname *</div>
                    <div><code>company</code> - Firma *</div>
                    <div><code>email</code> - E-Mail *</div>
                    <div><code>linkedin_url</code> - LinkedIn URL *</div>
                    <div><code>phone</code> - Telefon *</div>
                  </div>
                </div>
                
                {/* Campaign Selection */}
                <div className="space-y-2">
                  <Label>Kampagne auswählen *</Label>
                  <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kampagne wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* File Upload */}
                <div className="space-y-2">
                  <Label>CSV-Datei *</Label>
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
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleImport} 
                  disabled={!file || !selectedCampaignId || importing}
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
                
                {/* Import Result */}
                {importResult && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {importResult.imported_count}
                        </div>
                        <div className="text-xs text-muted-foreground">Neu</div>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {importResult.updated_count}
                        </div>
                        <div className="text-xs text-muted-foreground">Aktualisiert</div>
                      </div>
                      <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg text-center">
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          {importResult.skipped_count}
                        </div>
                        <div className="text-xs text-muted-foreground">Übersprungen</div>
                      </div>
                    </div>
                    
                    {importResult.errors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {importResult.errors.length} Fehler: {importResult.errors[0]?.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        {contacts.length > 0 ? (
          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Firma</TableHead>
                  <TableHead className="font-medium text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id} className="group">
                    <TableCell className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.company || "–"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyMessage(contact)}
                                disabled={!contact.outreach_message}
                                className="h-8"
                              >
                                {copiedId === contact.id ? (
                                  <Check className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-[300px] text-xs">
                              {contact.outreach_message || "Keine Nachricht"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          size="sm"
                          onClick={() => markAsSent(contact)}
                          className="h-8 bg-cyan-600 hover:bg-cyan-700"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-20 border rounded-lg bg-card">
            <Megaphone className="w-10 h-10 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Keine offenen Outbound-Leads</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Alle Leads wurden bereits bearbeitet
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OutboundLeads;
