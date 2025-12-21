import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy, Check, Send, Megaphone } from "lucide-react";
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

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  personalized_url: string | null;
  outreach_message: string | null;
  created_at: string;
}

const OutboundLeads = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

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
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="w-6 h-6 text-cyan-500" />
            <h1 className="text-2xl font-semibold text-foreground">Outbound Pipeline</h1>
          </div>
          <p className="text-muted-foreground">
            {contacts.length} offene Leads • Limit 20 pro Tag
          </p>
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
