import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Play, Video, Users, Calendar, Clock, CheckCircle, Lock } from "lucide-react";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";

const Training = () => {
  const { subscribed, loading } = useSubscriptionContext();
  const navigate = useNavigate();

  // Memberspot course URL - can be configured
  const memberSpotUrl = "https://pitchfirst.memberspot.de";
  
  // Live Call URL - Zoom link for weekly Wednesday 17:00 call
  const liveCallUrl = "https://us06web.zoom.us/j/84439071732?pwd=b1gqdFZ9eZuk5zmJIrLIpyWAxJGKux.1";

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!subscribed) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="bg-card border border-border rounded-2xl p-8">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Exklusiv für Kunden
            </h1>
            <p className="text-muted-foreground mb-6">
              Der Videokurs und die wöchentlichen Live-Calls sind exklusiv für aktive PitchFirst Kunden verfügbar.
              Werde jetzt Kunde und erhalte sofortigen Zugang.
            </p>
            <Button onClick={() => navigate("/upgrade")} size="lg">
              Jetzt Kunde werden
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training & Support</h1>
          <p className="text-muted-foreground mt-2">
            Dein exklusiver Zugang zu Videokurs und wöchentlichem Live-Call
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Video Course Card */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Play className="h-3 w-3 mr-1" />
                  Videokurs
                </Badge>
                <Badge variant="outline" className="text-green-500 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Freigeschaltet
                </Badge>
              </div>
              <CardTitle className="text-2xl mt-4">PitchFirst Masterclass</CardTitle>
              <CardDescription>
                Lerne Schritt für Schritt, wie du mit PitchFirst maximale Ergebnisse erzielst
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Video className="h-4 w-4 text-primary" />
                  <span className="text-foreground">Kompletter Videokurs</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-foreground">Automatisch freigeschaltet als Kunde</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-foreground">Jederzeit abrufbar</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Inhalte:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Setup & Einrichtung
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Outreach-Strategien
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Video-Personalisierung
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Best Practices & Tipps
                  </li>
                </ul>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => window.open(memberSpotUrl, '_blank')}
              >
                <Play className="h-4 w-4 mr-2" />
                Zum Videokurs
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Live Call Card */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Users className="h-3 w-3 mr-1" />
                  Live Call
                </Badge>
                <Badge variant="outline" className="text-primary border-primary/30">
                  <Calendar className="h-3 w-3 mr-1" />
                  Wöchentlich
                </Badge>
              </div>
              <CardTitle className="text-2xl mt-4">Weekly Outreach Call</CardTitle>
              <CardDescription>
                Jeden Woche live mit mir – Fragen, Strategien und Austausch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span className="text-foreground font-medium">Jeden Mittwoch</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="text-foreground font-medium">17:00 Uhr</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-foreground">Exklusiv für Kunden</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Video className="h-4 w-4 text-green-500" />
                  <span className="text-foreground">Live Q&A via Zoom</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Themen:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Outreach-Optimierung
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    LinkedIn-Strategien
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Deine individuellen Fragen
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Best Practices aus der Community
                  </li>
                </ul>
              </div>

              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                size="lg"
                onClick={() => window.open(liveCallUrl, '_blank')}
              >
                <Video className="h-4 w-4 mr-2" />
                Zoom-Call beitreten
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Du hast vollen Zugang!</h3>
                <p className="text-sm text-muted-foreground">
                  Als aktiver Kunde hast du Zugriff auf alle Trainings und Live-Calls, solange dein Abo aktiv ist.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Training;
