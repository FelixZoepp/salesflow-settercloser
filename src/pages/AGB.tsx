import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const AGB = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Startseite
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-8">Allgemeine Geschäftsbedingungen</h1>
        
        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Geltungsbereich</h2>
            <p className="text-muted-foreground leading-relaxed">
              Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der von PitchFirst 
              bereitgestellten Software-as-a-Service-Lösung zur Vertriebsunterstützung und 
              Lead-Management.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Leistungsumfang</h2>
            <p className="text-muted-foreground leading-relaxed">
              PitchFirst stellt eine webbasierte Plattform zur Verfügung, die Funktionen für 
              Lead-Management, Kampagnenverwaltung, Video-Personalisierung und 
              Vertriebsunterstützung umfasst.
            </p>
          </section>

          <section className="bg-muted/30 border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">3. Telefonie-Dienste</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p className="font-medium text-foreground">
                Wichtiger Hinweis zur Telefonie:
              </p>
              <p>
                Unser Tool stellt keine Telefonie bereit. Alle Gespräche werden über Ihren 
                bestehenden Telefonieanbieter geführt. Gesprächskosten entstehen ausschließlich 
                in Ihrem Vertrag mit dem Anbieter.
              </p>
              <p>
                Der Kunde ist alleiniger Vertragspartner des Telefonieanbieters. Die Nutzung 
                externer Telefonie-Dienste erfolgt auf eigene Kosten.
              </p>
              <p>
                PitchFirst übernimmt keine Haftung für Kosten, Verbindungsqualität oder 
                Verfügbarkeit der vom Kunden genutzten Telefonie-Dienste.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Datenschutz</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die Erhebung und Verarbeitung personenbezogener Daten erfolgt gemäß unserer 
              Datenschutzerklärung und den geltenden datenschutzrechtlichen Bestimmungen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Haftung</h2>
            <p className="text-muted-foreground leading-relaxed">
              PitchFirst haftet nur für Schäden, die auf vorsätzlichem oder grob fahrlässigem 
              Verhalten beruhen. Die Haftung für leichte Fahrlässigkeit ist ausgeschlossen, 
              soweit keine wesentlichen Vertragspflichten verletzt werden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Kündigung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Der Vertrag kann von beiden Parteien mit einer Frist von 30 Tagen zum Ende des 
              jeweiligen Abrechnungszeitraums gekündigt werden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Schlussbestimmungen</h2>
            <p className="text-muted-foreground leading-relaxed">
              Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist, soweit 
              gesetzlich zulässig, der Sitz des Anbieters.
            </p>
          </section>

          <section className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Stand: Januar 2026
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AGB;
