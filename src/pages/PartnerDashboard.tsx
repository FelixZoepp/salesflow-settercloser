import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Copy, Users, Euro, TrendingUp, Link as LinkIcon, Loader2, UserPlus, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Affiliate {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  link?: string;
  partner_code?: string | null;
  links?: { url: string; id: string; token?: string }[];
  visitors: number;
  leads: number;
  conversions: number;
  created_at: string;
}

interface Referral {
  id: string;
  visitor_id: string;
  email: string;
  customer_email: string;
  stripe_customer_id: string;
  created_at: string;
  conversion_state: string;
}

interface Commission {
  id: string;
  amount: number;
  currency: string;
  state: string;
  created_at: string;
  due_at: string;
  paid_at: string | null;
  referral_id: string;
}

export default function PartnerDashboard() {
  const { session } = useAuth();
  const user = session?.user;
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);

  useEffect(() => {
    if (user) {
      fetchAffiliateData();
    }
  }, [user]);

  const fetchAffiliateData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("rewardful-affiliate", {
        body: { action: "get-affiliate" },
      });

      if (error) throw error;

      if (data.exists) {
        setAffiliate(data.affiliate);
        setReferrals(data.referrals || []);
        setCommissions(data.commissions || []);
      }
    } catch (error) {
      console.error("Error fetching affiliate data:", error);
      toast.error("Fehler beim Laden der Partnerdaten");
    } finally {
      setLoading(false);
    }
  };

  const createAffiliate = async () => {
    try {
      setCreating(true);
      const { data, error } = await supabase.functions.invoke("rewardful-affiliate", {
        body: { action: "create-affiliate" },
      });

      if (error) throw error;

      if (data.exists) {
        setAffiliate(data.affiliate);
        setReferrals(data.referrals || []);
        setCommissions(data.commissions || []);
        toast.success("Partner-Account erfolgreich erstellt!");
      }
    } catch (error) {
      console.error("Error creating affiliate:", error);
      toast.error("Fehler beim Erstellen des Partner-Accounts");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
    const affiliateLink = affiliate?.link || affiliate?.links?.[0]?.url;
    const code = affiliate?.partner_code || affiliate?.links?.[0]?.token;
    if (affiliateLink) {
      navigator.clipboard.writeText(affiliateLink);
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-medium">Affiliate-Link kopiert!</span>
          <span className="text-xs text-muted-foreground font-mono truncate max-w-[260px]">{affiliateLink}</span>
        </div>
      );
    }
  };

  const getAffiliateLink = () => {
    return affiliate?.link || affiliate?.links?.[0]?.url || null;
  };

  const getPartnerCode = () => {
    return affiliate?.partner_code || affiliate?.links?.[0]?.token || null;
  };

  const totalCommissions = commissions.reduce((sum, c) => sum + (c.amount || 0), 0) / 100;
  const paidCommissions = commissions
    .filter(c => c.state === "paid")
    .reduce((sum, c) => sum + (c.amount || 0), 0) / 100;
  const pendingCommissions = commissions
    .filter(c => c.state === "pending" || c.state === "due")
    .reduce((sum, c) => sum + (c.amount || 0), 0) / 100;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!affiliate) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Partner werden</CardTitle>
              <CardDescription className="text-base">
                Verdiene <span className="font-bold text-primary">30% lebenslange Provision</span> für jeden Kunden, den du zu PitchFirst bringst.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">30%</p>
                  <p className="text-sm text-muted-foreground">Provision</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">Lifetime</p>
                  <p className="text-sm text-muted-foreground">Auszahlung</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">∞</p>
                  <p className="text-sm text-muted-foreground">Wiederkehrend</p>
                </div>
              </div>
              <Button 
                size="lg" 
                onClick={createAffiliate}
                disabled={creating}
                className="w-full"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Jetzt Partner werden
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Partner Dashboard</h1>
          <p className="text-muted-foreground">Verwalte deine Affiliate-Links und Provisionen</p>
        </div>

        {/* Affiliate Link */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Dein Affiliate-Link
            </CardTitle>
            <CardDescription>
              Teile diesen Link um 30% lebenslange Provision zu verdienen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-background rounded-lg border font-mono text-sm overflow-x-auto">
                {getAffiliateLink() || "Link wird generiert..."}
              </div>
              <Button onClick={copyLink} variant="outline" disabled={!getAffiliateLink()}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {getPartnerCode() && (
              <div className="text-sm text-muted-foreground">
                Dein Kürzel: <span className="font-mono text-foreground">{getPartnerCode()}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ExternalLink className="h-4 w-4" />
              <span>Teile dein Programm:</span>
              <Link to="/partner" className="text-primary hover:underline" target="_blank">
                Öffentliche Partner-Seite öffnen →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Besucher</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{affiliate.visitors || 0}</div>
              <p className="text-xs text-muted-foreground">Über deinen Link</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{affiliate.conversions || referrals.filter(r => r.conversion_state === "conversion").length}</div>
              <p className="text-xs text-muted-foreground">Zahlende Kunden</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt verdient</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCommissions.toFixed(2)} €</div>
              <p className="text-xs text-muted-foreground">Alle Provisionen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
              <Euro className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCommissions.toFixed(2)} €</div>
              <p className="text-xs text-muted-foreground">Noch auszuzahlen</p>
            </CardContent>
          </Card>
        </div>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Deine Empfehlungen</CardTitle>
            <CardDescription>Alle Nutzer, die über deinen Link gekommen sind</CardDescription>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Empfehlungen</p>
                <p className="text-sm">Teile deinen Affiliate-Link um loszulegen!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        {referral.customer_email || referral.email || "Anonym"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={referral.conversion_state === "conversion" ? "default" : "secondary"}>
                          {referral.conversion_state === "conversion" ? "Konvertiert" : 
                           referral.conversion_state === "lead" ? "Lead" : referral.conversion_state}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(referral.created_at), "dd. MMM yyyy", { locale: de })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Commissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Provisionen</CardTitle>
            <CardDescription>Übersicht deiner verdienten Provisionen</CardDescription>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Euro className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Provisionen</p>
                <p className="text-sm">Sobald deine Empfehlungen zahlen, siehst du hier deine Provisionen.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead>Fällig</TableHead>
                    <TableHead>Ausgezahlt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium">
                        {(commission.amount / 100).toFixed(2)} {commission.currency?.toUpperCase() || "EUR"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            commission.state === "paid" ? "default" : 
                            commission.state === "due" ? "outline" : "secondary"
                          }
                          className={commission.state === "paid" ? "bg-green-500" : ""}
                        >
                          {commission.state === "paid" ? "Ausgezahlt" : 
                           commission.state === "due" ? "Fällig" : 
                           commission.state === "pending" ? "Ausstehend" : commission.state}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(commission.created_at), "dd. MMM yyyy", { locale: de })}
                      </TableCell>
                      <TableCell>
                        {commission.due_at ? format(new Date(commission.due_at), "dd. MMM yyyy", { locale: de }) : "-"}
                      </TableCell>
                      <TableCell>
                        {commission.paid_at ? format(new Date(commission.paid_at), "dd. MMM yyyy", { locale: de }) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Paid Summary */}
        {paidCommissions > 0 && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bereits ausgezahlt</p>
                  <p className="text-2xl font-bold text-green-600">{paidCommissions.toFixed(2)} €</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Ausgezahlt
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
