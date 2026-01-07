import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  CreditCard, 
  Download, 
  ExternalLink, 
  FileText, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

interface Invoice {
  id: string;
  number: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  created: string;
  due_date: string | null;
  paid_at: string | null;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  description: string;
}

interface Subscription {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan_name: string;
  plan_amount: number;
  plan_interval: string;
}

const Billing = () => {
  const navigate = useNavigate();
  const { openCustomerPortal } = useSubscription();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('list-invoices');
      
      if (error) {
        console.error('Error fetching billing data:', error);
        toast.error('Fehler beim Laden der Rechnungen');
        return;
      }

      setInvoices(data?.invoices || []);
      setSubscription(data?.subscription || null);
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
      toast.error('Fehler beim Laden der Abrechnungsdaten');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Bezahlt</Badge>;
      case 'open':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Offen</Badge>;
      case 'draft':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Entwurf</Badge>;
      case 'uncollectible':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Nicht einziehbar</Badge>;
      case 'void':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Storniert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleManageSubscription = async () => {
    const { error } = await openCustomerPortal();
    if (error) {
      toast.error("Fehler beim Öffnen des Kundenportals");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Lädt Abrechnungsdaten...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen noise-bg dotted-grid">
        <div className="max-w-5xl mx-auto p-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Abrechnung</h1>
                <p className="text-sm text-muted-foreground">Rechnungen und Zahlungsübersicht</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={fetchBillingData}
                className="border-white/10 bg-white/5"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Aktualisieren
              </Button>
              <Button onClick={handleManageSubscription}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Abo verwalten
              </Button>
            </div>
          </div>

          {/* Current Subscription */}
          {subscription && (
            <Card className="mb-8 glass-card border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Aktuelles Abonnement</CardTitle>
                    <CardDescription>Dein aktiver Tarif</CardDescription>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Aktiv
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tarif</p>
                    <p className="text-lg font-semibold text-foreground">
                      {subscription.plan_name || 'Pitchfirst'}
                    </p>
                    <p className="text-sm text-primary">
                      {formatCurrency(subscription.plan_amount, 'eur')} / {subscription.plan_interval === 'year' ? 'Jahr' : 'Monat'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Laufzeit</p>
                    <p className="text-foreground">
                      {format(new Date(subscription.current_period_start), 'dd. MMM yyyy', { locale: de })}
                      {' – '}
                      {format(new Date(subscription.current_period_end), 'dd. MMM yyyy', { locale: de })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nächste Zahlung</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="text-foreground">
                        {format(new Date(subscription.current_period_end), 'dd. MMMM yyyy', { locale: de })}
                      </p>
                    </div>
                    {subscription.cancel_at_period_end && (
                      <p className="text-sm text-yellow-400 mt-1">Wird zum Ende der Laufzeit gekündigt</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoices */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Rechnungen</CardTitle>
              <CardDescription>Alle bisherigen Rechnungen und Zahlungen</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Noch keine Rechnungen vorhanden</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {invoice.number || invoice.description}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{format(new Date(invoice.created), 'dd. MMM yyyy', { locale: de })}</span>
                            {invoice.paid_at && (
                              <>
                                <span>•</span>
                                <span className="text-green-400">
                                  Bezahlt am {format(new Date(invoice.paid_at), 'dd. MMM yyyy', { locale: de })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                          </p>
                          {getStatusBadge(invoice.status)}
                        </div>

                        <div className="flex gap-2">
                          {invoice.invoice_pdf && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(invoice.invoice_pdf!, '_blank')}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          {invoice.hosted_invoice_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(invoice.hosted_invoice_url!, '_blank')}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Billing;
