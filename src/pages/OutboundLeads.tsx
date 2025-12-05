import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, Building, Video, Eye, Link, Copy, Send, Calendar, Megaphone, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
  source: string | null;
  stage: string | null;
  status: string | null;
  slug: string | null;
  video_url: string | null;
  viewed: boolean | null;
  viewed_at: string | null;
  view_count: number | null;
  outreach_status: string | null;
  outreach_message: string | null;
  personalized_url: string | null;
  created_at: string;
}

const OutboundLeads = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [searchQuery, contacts]);

  const fetchContacts = async () => {
    try {
      // Fetch outbound leads where outreach_status is NULL (not yet processed)
      // Limited to 20 per day concept
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('lead_type', 'outbound')
        .is('outreach_status', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error: any) {
      toast.error("Fehler beim Laden der Outbound-Leads");
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    if (!searchQuery) {
      setFilteredContacts(contacts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = contacts.filter(contact =>
      contact.first_name.toLowerCase().includes(query) ||
      contact.last_name.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query)
    );
    setFilteredContacts(filtered);
  };

  const copyPersonalizedUrl = (contact: Contact) => {
    if (!contact.slug) {
      toast.error("Kein Slug vorhanden");
      return;
    }
    const url = `${window.location.origin}/p/${contact.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link kopiert!");
  };

  const markAsSent = async (contact: Contact) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ outreach_status: 'gesendet' as any })
        .eq('id', contact.id);

      if (error) throw error;
      
      toast.success("Als gesendet markiert");
      fetchContacts(); // Refresh list
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error("Fehler beim Aktualisieren");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Lädt Outbound-Leads...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-cyan-500" />
              Outbound-Pipeline
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredContacts.length} von max. 20 Leads pro Tag – mit Videonotiz
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Outbound-Leads durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Contacts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(contact => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow border-l-4 border-l-cyan-500">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">
                    {contact.first_name} {contact.last_name}
                  </h3>
                  <Badge variant="default" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/30">
                    Outbound
                  </Badge>
                </div>
                
                {contact.company && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Building className="w-4 h-4" />
                    <span>{contact.company}</span>
                  </div>
                )}

                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}

                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Phone className="w-4 h-4" />
                    <span>{contact.phone}</span>
                  </div>
                )}

                {/* Video Note Section - Prominent for Outbound */}
                <div className="mt-3 p-3 bg-cyan-500/5 rounded-lg border border-cyan-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-cyan-600">
                    <Video className="w-4 h-4" />
                    Videonotiz
                  </div>
                  
                  {contact.slug ? (
                    <>
                      <div className="flex items-center gap-2 text-xs">
                        <Link className="w-3 h-3 text-muted-foreground" />
                        <a 
                          href={`/p/${contact.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate flex-1"
                        >
                          /p/{contact.slug}
                        </a>
                        <button
                          onClick={() => copyPersonalizedUrl(contact)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                        </button>
                        <a 
                          href={`/p/${contact.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-muted rounded"
                        >
                          <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        {contact.viewed ? (
                          <span className="text-green-600">
                            Angesehen ({contact.view_count || 0}x)
                            {contact.viewed_at && ` • ${new Date(contact.viewed_at).toLocaleDateString('de-DE')}`}
                          </span>
                        ) : (
                          <span>Noch nicht angesehen</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Noch kein Slug erstellt
                    </p>
                  )}
                </div>

                {/* Outreach Message Preview */}
                {contact.outreach_message && (
                  <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                    <p className="text-muted-foreground font-medium mb-1">Outreach-Nachricht:</p>
                    <p className="text-foreground line-clamp-2">{contact.outreach_message}</p>
                  </div>
                )}

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {contact.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Source */}
                {contact.source && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Quelle: {contact.source}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => copyPersonalizedUrl(contact)}
                    disabled={!contact.slug}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    URL kopieren
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    onClick={() => markAsSent(contact)}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Gesendet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Keine unbearbeiteten Outbound-Leads</p>
            <p className="text-sm text-muted-foreground mt-1">
              Alle Leads wurden bereits bearbeitet oder es sind keine vorhanden
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OutboundLeads;
