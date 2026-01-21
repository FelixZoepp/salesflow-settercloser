import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Mail, Phone, Building, Upload, PhoneCall, UserPlus, Video, Eye, Link, TrendingUp, Megaphone, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  lead_type: 'inbound' | 'outbound' | null;
  position: string | null;
  linkedin_url: string | null;
}

interface EditingContact {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
}

const Contacts = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EditingContact | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    company: "",
    email: "",
    phone: "",
    lead_type: "outbound" as "inbound" | "outbound",
    source: "",
    video_url: "",
  });

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

  const handleCreateContact = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error("Vorname und Nachname sind erforderlich");
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Nicht angemeldet");
        return;
      }

      // Get user's account_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_id')
        .eq('id', user.id)
        .single();

      const { error } = await supabase
        .from('contacts')
        .insert({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          company: formData.company.trim() || null,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          lead_type: formData.lead_type,
          source: formData.source.trim() || null,
          video_url: formData.lead_type === 'outbound' ? (formData.video_url.trim() || null) : null,
          owner_user_id: user.id,
          account_id: profile?.account_id || null,
        });

      if (error) throw error;

      toast.success(`Kontakt ${formData.first_name} ${formData.last_name} erstellt!`);
      setDialogOpen(false);
      setFormData({
        first_name: "",
        last_name: "",
        company: "",
        email: "",
        phone: "",
        lead_type: "outbound",
        source: "",
        video_url: "",
      });
      fetchContacts();
    } catch (error: any) {
      console.error('Error creating contact:', error);
      toast.error("Fehler beim Erstellen des Kontakts");
    } finally {
      setCreating(false);
    }
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
          title: `${contact.first_name} ${contact.last_name} - ${contact.company || 'Kaltakquise'}`,
          stage: 'Lead',
          pipeline: 'cold',
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

  const openEditDialog = (contact: Contact) => {
    setEditingContact({
      id: contact.id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      company: contact.company || '',
      email: contact.email || '',
      phone: contact.phone || '',
      position: contact.position || '',
      linkedin_url: contact.linkedin_url || '',
    });
    setIsEditDialogOpen(true);
  };

  const saveContact = async () => {
    if (!editingContact) return;

    const { error } = await supabase
      .from('contacts')
      .update({
        first_name: editingContact.first_name,
        last_name: editingContact.last_name,
        company: editingContact.company || null,
        email: editingContact.email || null,
        phone: editingContact.phone || null,
        position: editingContact.position || null,
        linkedin_url: editingContact.linkedin_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingContact.id);

    if (error) {
      toast.error("Fehler beim Speichern");
      console.error(error);
    } else {
      toast.success("Kontakt aktualisiert");
      setIsEditDialogOpen(false);
      setEditingContact(null);
      fetchContacts();
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/import-leads')}>
              <Upload className="w-4 h-4 mr-2" />
              Leads importieren
            </Button>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Neuer Kontakt
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Neuen Kontakt anlegen</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Vorname *</Label>
                      <Input 
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        placeholder="Max"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nachname *</Label>
                      <Input 
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        placeholder="Mustermann"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Firma</Label>
                    <Input 
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="Acme GmbH"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>E-Mail</Label>
                    <Input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="max@acme.de"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+49 123 456789"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quelle</Label>
                    <Input 
                      value={formData.source}
                      onChange={(e) => setFormData({...formData, source: e.target.value})}
                      placeholder="LinkedIn, Website, etc."
                    />
                  </div>

                  {/* Video URL - nur für Outbound */}
                  {formData.lead_type === 'outbound' && (
                    <div className="space-y-2">
                      <Label>Video URL (für Videonotiz)</Label>
                      <Input 
                        value={formData.video_url}
                        onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                        placeholder="https://cdn.example.com/video.mp4"
                      />
                      <p className="text-xs text-muted-foreground">
                        Slug & personalisierte URL werden automatisch generiert
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleCreateContact} 
                    className="w-full mt-4"
                    disabled={creating}
                  >
                    {creating ? "Wird erstellt..." : "Kontakt erstellen"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
            <Card key={contact.id} className="hover:shadow-md transition-shadow border-l-4 border-l-cyan-500">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">
                    {contact.first_name} {contact.last_name}
                  </h3>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditDialog(contact)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
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

                {/* Video Note Status - nur für Outbound */}
                {contact.lead_type === 'outbound' && contact.slug && (
                  <div className="mt-3 p-2 bg-cyan-500/5 rounded-lg space-y-1 border border-cyan-500/20">
                    <div className="flex items-center gap-2 text-xs">
                      <Video className="w-3 h-3 text-cyan-500" />
                      <a 
                        href={`/p/${contact.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-600 hover:underline truncate"
                      >
                        /p/{contact.slug}
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/p/${contact.slug}`);
                          toast.success("Link kopiert!");
                        }}
                        className="ml-auto"
                      >
                        <Link className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      {contact.viewed ? (
                        <span className="text-green-600">
                          Angesehen ({contact.view_count || 0}x)
                          {contact.viewed_at && ` • ${new Date(contact.viewed_at).toLocaleDateString('de-DE')}`}
                        </span>
                      ) : (
                        <span>Nicht angesehen</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => createDealFromContact(contact)}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Deal
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
            <p className="text-muted-foreground">Keine Kontakte gefunden</p>
          </div>
        )}

        {/* Edit Contact Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Kontakt bearbeiten</DialogTitle>
            </DialogHeader>
            {editingContact && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Vorname</Label>
                    <Input 
                      value={editingContact.first_name}
                      onChange={(e) => setEditingContact({...editingContact, first_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nachname</Label>
                    <Input 
                      value={editingContact.last_name}
                      onChange={(e) => setEditingContact({...editingContact, last_name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Firma</Label>
                  <Input 
                    value={editingContact.company}
                    onChange={(e) => setEditingContact({...editingContact, company: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input 
                    value={editingContact.position}
                    onChange={(e) => setEditingContact({...editingContact, position: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-Mail</Label>
                  <Input 
                    type="email"
                    value={editingContact.email}
                    onChange={(e) => setEditingContact({...editingContact, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input 
                    value={editingContact.phone}
                    onChange={(e) => setEditingContact({...editingContact, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input 
                    value={editingContact.linkedin_url}
                    onChange={(e) => setEditingContact({...editingContact, linkedin_url: e.target.value})}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <Button onClick={saveContact} className="w-full">
                  Speichern
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Contacts;
