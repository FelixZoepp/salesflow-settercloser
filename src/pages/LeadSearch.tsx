import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Sparkles, Save, Download, Zap, Building, MapPin, Users, Loader2, ListPlus, ExternalLink, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAccountFilter } from "@/hooks/useAccountFilter";
import EnrichmentUpsellBanner from "@/components/EnrichmentUpsellBanner";

interface SearchLead {
  first_name: string;
  last_name: string;
  position: string;
  company: string;
  industry: string;
  employee_count: string;
  city: string;
  country: string;
  website: string;
  linkedin_url: string;
}

interface SavedList {
  id: string;
  name: string;
  description: string | null;
  total_leads: number;
  search_filters: any;
  created_at: string;
}

const INDUSTRIES = [
  "Software & IT",
  "E-Commerce",
  "Marketing & Werbung",
  "Beratung & Consulting",
  "Finanzdienstleistungen",
  "Immobilien",
  "Gesundheitswesen",
  "Maschinenbau",
  "Automotive",
  "Logistik & Transport",
  "Energie & Umwelt",
  "Lebensmittel & Gastronomie",
  "Bildung & Coaching",
  "Medien & Verlag",
  "Telekommunikation",
  "Versicherungen",
  "Personaldienstleistung",
  "Handwerk & Bau",
  "Einzelhandel",
  "Pharma & Chemie",
];

const EMPLOYEE_COUNTS = [
  { value: "1-10", label: "1-10 Mitarbeiter" },
  { value: "11-50", label: "11-50 Mitarbeiter" },
  { value: "51-200", label: "51-200 Mitarbeiter" },
  { value: "201-500", label: "201-500 Mitarbeiter" },
  { value: "501-1000", label: "501-1.000 Mitarbeiter" },
  { value: "1000+", label: "1.000+ Mitarbeiter" },
];

const LeadSearch = () => {
  const navigate = useNavigate();
  const { accountId } = useAccountFilter();

  // Search filters
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [resultCount, setResultCount] = useState("10");

  // Results
  const [leads, setLeads] = useState<SearchLead[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());

  // Save dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Saved lists
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  useEffect(() => {
    fetchSavedLists();
  }, []);

  const fetchSavedLists = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_lists')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setSavedLists((data as SavedList[]) || []);
    } catch { /* ignore */ }
    setLoadingLists(false);
  };

  const handleSearch = async () => {
    const searchIndustry = industry === "custom" ? customIndustry : industry;
    if (!searchIndustry.trim()) {
      toast.error("Bitte wähle eine Branche aus");
      return;
    }

    setSearching(true);
    setLeads([]);
    setSelectedLeads(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('search-leads', {
        body: {
          action: 'search',
          industry: searchIndustry,
          location: location || undefined,
          employee_count: employeeCount || undefined,
          count: parseInt(resultCount),
        },
      });

      if (error) throw error;

      if (data?.leads) {
        setLeads(data.leads);
        toast.success(`${data.leads.length} Entscheider gefunden`);
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      toast.error("Fehler bei der KI-Recherche");
    } finally {
      setSearching(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map((_, i) => i)));
    }
  };

  const toggleSelect = (index: number) => {
    const next = new Set(selectedLeads);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedLeads(next);
  };

  const handleSaveList = async () => {
    if (!listName.trim()) {
      toast.error("Bitte gib einen Listennamen ein");
      return;
    }

    const leadsToSave = selectedLeads.size > 0
      ? Array.from(selectedLeads).map(i => leads[i])
      : leads;

    if (leadsToSave.length === 0) {
      toast.error("Keine Leads zum Speichern");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-leads', {
        body: {
          action: 'save_list',
          name: listName,
          description: listDescription || undefined,
          leads: leadsToSave,
          filters: {
            industry: industry === "custom" ? customIndustry : industry,
            location,
            employee_count: employeeCount,
          },
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Liste "${listName}" mit ${leadsToSave.length} Leads gespeichert`);
        setSaveDialogOpen(false);
        setListName("");
        setListDescription("");
        fetchSavedLists();
      } else {
        toast.error(data?.error || "Fehler beim Speichern");
      }
    } catch {
      toast.error("Fehler beim Speichern der Liste");
    } finally {
      setSaving(false);
    }
  };

  const handleImportSelected = async (listId: string) => {
    try {
      // Get items from this list
      const { data: items, error } = await supabase
        .from('lead_list_items')
        .select('id')
        .eq('list_id', listId)
        .eq('imported', false);

      if (error || !items?.length) {
        toast.error("Keine neuen Leads zum Importieren");
        return;
      }

      const { data, error: importErr } = await supabase.functions.invoke('search-leads', {
        body: {
          action: 'import_to_contacts',
          item_ids: items.map(i => i.id),
        },
      });

      if (importErr) throw importErr;

      if (data?.success) {
        toast.success(`${data.imported} Leads als Kontakte importiert`);
        fetchSavedLists();
      }
    } catch {
      toast.error("Fehler beim Importieren");
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Lead-Recherche</h1>
              <p className="text-sm text-muted-foreground">KI-gestützte Suche nach Entscheidern</p>
            </div>
          </div>
        </div>

        <EnrichmentUpsellBanner />

        {/* Search Filters */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Suchkriterien
            </CardTitle>
            <CardDescription>Definiere deine Zielgruppe – die KI findet passende Entscheider</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Industry */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  Branche *
                </Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Branche wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(ind => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                    <SelectItem value="custom">Eigene Branche eingeben...</SelectItem>
                  </SelectContent>
                </Select>
                {industry === "custom" && (
                  <Input
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    placeholder="z.B. Biotechnologie"
                    className="mt-2"
                  />
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Standort
                </Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="z.B. München, Österreich..."
                />
              </div>

              {/* Employee Count */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Mitarbeiteranzahl
                </Label>
                <Select value={employeeCount} onValueChange={setEmployeeCount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Größen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Größen</SelectItem>
                    {EMPLOYEE_COUNTS.map(ec => (
                      <SelectItem key={ec.value} value={ec.value}>{ec.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Result Count */}
              <div className="space-y-2">
                <Label>Anzahl Ergebnisse</Label>
                <Select value={resultCount} onValueChange={setResultCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Leads</SelectItem>
                    <SelectItem value="10">10 Leads</SelectItem>
                    <SelectItem value="20">20 Leads</SelectItem>
                    <SelectItem value="30">30 Leads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={searching}
              className="mt-4 w-full md:w-auto"
              size="lg"
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  KI recherchiert...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Entscheider suchen
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {leads.length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {leads.length} Entscheider gefunden
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setListName(`${industry === "custom" ? customIndustry : industry} - ${new Date().toLocaleDateString('de-DE')}`);
                      setSaveDialogOpen(true);
                    }}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Liste speichern
                  </Button>
                </div>
              </div>
              {selectedLeads.size > 0 && (
                <p className="text-sm text-muted-foreground">{selectedLeads.size} ausgewählt</p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedLeads.size === leads.length && leads.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Unternehmen</TableHead>
                      <TableHead>Standort</TableHead>
                      <TableHead>Größe</TableHead>
                      <TableHead>Website</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead, idx) => (
                      <TableRow key={idx} className={selectedLeads.has(idx) ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedLeads.has(idx)}
                            onCheckedChange={() => toggleSelect(idx)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {lead.first_name} {lead.last_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{lead.position}</TableCell>
                        <TableCell>{lead.company}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {[lead.city, lead.country].filter(Boolean).join(', ')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{lead.employee_count}</Badge>
                        </TableCell>
                        <TableCell>
                          {lead.website && (
                            <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              Website
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Lists */}
        {savedLists.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ListPlus className="w-5 h-5" />
                Gespeicherte Listen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedLists.map(list => (
                  <div key={list.id} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{list.name}</h4>
                        {list.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{list.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary">{list.total_leads} Leads</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {list.search_filters?.industry && <span>Branche: {list.search_filters.industry}</span>}
                      {list.search_filters?.location && <span> • {list.search_filters.location}</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleImportSelected(list.id)}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Importieren
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate('/contacts')}
                      >
                        <Zap className="w-3.5 h-3.5 mr-1" />
                        Anreichern
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Erstellt am {new Date(list.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lead-Liste speichern</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Listenname *</Label>
                <Input
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="z.B. IT-Entscheider München"
                />
              </div>
              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Input
                  value={listDescription}
                  onChange={(e) => setListDescription(e.target.value)}
                  placeholder="Optional..."
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedLeads.size > 0
                  ? `${selectedLeads.size} ausgewählte Leads werden gespeichert`
                  : `Alle ${leads.length} Leads werden gespeichert`}
              </p>
              <Button onClick={handleSaveList} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Wird gespeichert..." : "Liste speichern"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default LeadSearch;
