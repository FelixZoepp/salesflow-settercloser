import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, Building, Upload, PhoneCall, UserPlus, Calendar, TrendingUp } from "lucide-react";
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
  created_at: string;
}

const InboundLeads = () => {
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
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('lead_type', 'inbound')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error: any) {
      toast.error("Fehler beim Laden der Inbound-Leads");
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

  const createDealFromContact = async (contact: Contact) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Nicht angemeldet");
        return;
      }

      const { data: existingDeal } = await supabase
        .from('deals')
        .select('id')
        .eq('contact_id', contact.id)
        .maybeSingle();

      if (existingDeal) {
        toast.info(`Deal existiert bereits für ${contact.first_name} ${contact.last_name}`);
        navigate(`/pipeline`);
        return;
      }

      const { error } = await supabase
        .from('deals')
        .insert({
          contact_id: contact.id,
          title: `${contact.first_name} ${contact.last_name} - ${contact.company || 'Inbound'}`,
          stage: 'New',
          pipeline: 'inbound',
          amount_eur: 0,
          setter_id: user.id
        });

      if (error) throw error;

      toast.success(`Deal erstellt für ${contact.first_name} ${contact.last_name}`);
      navigate(`/pipeline`);
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast.error("Fehler beim Erstellen des Deals");
    }
  };

  const startCallWithContact = async (contact: Contact) => {
    await createDealFromContact(contact);
    navigate(`/power-dialer`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Lädt Inbound-Leads...</p>
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
              <TrendingUp className="w-8 h-8 text-green-500" />
              Inbound-Leads
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredContacts.length} eingehende Leads
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/import-leads')}>
              <Upload className="w-4 h-4 mr-2" />
              Leads importieren
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Inbound-Leads durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Contacts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(contact => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">
                    {contact.first_name} {contact.last_name}
                  </h3>
                  <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/30">
                    Inbound
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

                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {contact.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {contact.source && (
                  <p className="text-xs text-muted-foreground mt-3 mb-3">
                    Quelle: {contact.source}
                  </p>
                )}

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground mt-2">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {new Date(contact.created_at).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => createDealFromContact(contact)}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Deal erstellen
                  </Button>
                  {contact.phone && (
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => startCallWithContact(contact)}
                    >
                      <PhoneCall className="w-4 h-4 mr-1" />
                      Anrufen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Keine Inbound-Leads gefunden</p>
            <p className="text-sm text-muted-foreground mt-1">
              Inbound-Leads werden hier angezeigt, sobald sie eingehen
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default InboundLeads;
