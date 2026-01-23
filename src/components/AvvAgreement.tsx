import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface AvvAgreementProps {
  onAcceptChange?: (accepted: boolean) => void;
  showAcceptCheckbox?: boolean;
  initialAccepted?: boolean;
}

const AVV_TEXT = `Auftragsverarbeitungsvertrag (Kurzfassung)

1. Gegenstand der Verarbeitung

pitchfirst.io verarbeitet personenbezogene Daten ausschließlich zur technischen Bereitstellung, Wartung und Sicherstellung des Plattformbetriebs.

2. Art der Daten

• Bestandsdaten (z. B. Benutzerkonten)
• Technische Nutzungsdaten
• vom Nutzer gespeicherte Inhalte (nur technisch, nicht inhaltlich)

3. Zweck der Verarbeitung

Ausschließlich zur Erbringung der vertraglich geschuldeten Softwareleistung.

4. Weisungsgebundenheit

Die Verarbeitung erfolgt ausschließlich auf Weisung des Nutzers.
pitchfirst.io trifft keine eigenen Entscheidungen über Zwecke oder Mittel der Verarbeitung.

5. Pflichten des Nutzers

Der Nutzer ist verantwortlich für:
• Rechtmäßigkeit der Datenverarbeitung
• Einholung erforderlicher Einwilligungen
• Erfüllung von Informationspflichten gegenüber Betroffenen

6. Technische und organisatorische Maßnahmen

pitchfirst.io setzt geeignete technische und organisatorische Maßnahmen gemäß Art. 32 DSGVO ein, insbesondere:
• Zugriffsbeschränkungen
• Verschlüsselung
• Rollen- und Berechtigungskonzepte

7. Unterauftragsverarbeiter

Der Nutzer stimmt dem Einsatz technischer Unterauftragsverarbeiter (z. B. Hosting, Infrastruktur) zu, insbesondere Supabase.`;

export default function AvvAgreement({ 
  onAcceptChange, 
  showAcceptCheckbox = true,
  initialAccepted = false 
}: AvvAgreementProps) {
  const [accepted, setAccepted] = useState(initialAccepted);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvvStatus();
  }, []);

  const fetchAvvStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('avv_accepted_at')
        .eq('id', user.id)
        .single();

      if (profile?.avv_accepted_at) {
        setAcceptedAt(profile.avv_accepted_at);
        setAccepted(true);
      }
    } catch (error) {
      console.error('Error fetching AVV status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptChange = (checked: boolean) => {
    setAccepted(checked);
    onAcceptChange?.(checked);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Auftragsverarbeitungsvertrag (AVV)
            </CardTitle>
            <CardDescription>
              DSGVO-konforme Vereinbarung zur Datenverarbeitung
            </CardDescription>
          </div>
          {acceptedAt && (
            <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-600">
              <CheckCircle className="h-3 w-3" />
              Akzeptiert am {format(new Date(acceptedAt), "dd.MM.yyyy", { locale: de })}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-64 rounded-lg border bg-muted/30 p-4">
          <div className="whitespace-pre-wrap text-sm text-muted-foreground">
            {AVV_TEXT}
          </div>
        </ScrollArea>

        {showAcceptCheckbox && !acceptedAt && (
          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="avv-accept"
              checked={accepted}
              onCheckedChange={(checked) => handleAcceptChange(checked === true)}
              className="mt-0.5"
            />
            <Label 
              htmlFor="avv-accept" 
              className="text-sm font-normal cursor-pointer leading-relaxed"
            >
              Ich habe den Auftragsverarbeitungsvertrag gelesen und akzeptiere die darin enthaltenen Bedingungen.
            </Label>
          </div>
        )}

        {acceptedAt && (
          <p className="text-sm text-muted-foreground">
            Du hast den AVV bereits akzeptiert. Falls du Fragen hast, kontaktiere uns unter{" "}
            <a href="mailto:support@pitchfirst.io" className="text-primary hover:underline">
              support@pitchfirst.io
            </a>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
