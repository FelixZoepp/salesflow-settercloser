import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, Phone, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
}

const Contacts = () => {
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error: any) {
      toast.error("Fehler beim Laden der Kontakte");
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Lädt Kontakte...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Kontakte</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Neuer Kontakt
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Kontakte durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Contacts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(contact => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">
                    {contact.first_name} {contact.last_name}
                  </h3>
                  {contact.stage && (
                    <Badge variant="outline" className="text-xs">
                      {contact.stage}
                    </Badge>
                  )}
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
                  <p className="text-xs text-muted-foreground mt-3">
                    Quelle: {contact.source}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Keine Kontakte gefunden</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Contacts;