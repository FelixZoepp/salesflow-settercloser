import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, TrendingUp, MessageSquare } from "lucide-react";

interface CoachingCall {
  day: string;
  time: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const coachingCalls: CoachingCall[] = [
  {
    day: "Montag",
    time: "17:00 Uhr",
    title: "Leadgenerierungs-Call",
    description: "Strategien zur Kundengewinnung & LinkedIn-Outreach",
    icon: <Users className="h-5 w-5" />,
    color: "bg-blue-500",
  },
  {
    day: "Mittwoch",
    time: "17:00 Uhr",
    title: "Weekly Outreach Call",
    description: "Q&A, Best Practices & Community-Austausch",
    icon: <MessageSquare className="h-5 w-5" />,
    color: "bg-primary",
  },
  {
    day: "Donnerstag",
    time: "09:00 Uhr",
    title: "Vertriebscall",
    description: "Sales-Training & Abschluss-Techniken",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "bg-amber-500",
  },
];

export function CoachingCalendar() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Dein Coaching-Kalender</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Wöchentliche Live-Calls exklusiv für Coaching-Kunden
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {coachingCalls.map((call) => (
            <div
              key={call.day}
              className="relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/50"
            >
              {/* Color accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${call.color}`} />
              
              <div className="flex items-start gap-3 mt-2">
                <div className={`rounded-lg p-2 ${call.color} text-white`}>
                  {call.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {call.day}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-foreground truncate">
                    {call.title}
                  </h4>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{call.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {call.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly rhythm visualization */}
        <div className="mt-6 p-4 bg-muted/50 rounded-xl">
          <h5 className="text-sm font-medium text-foreground mb-3">Wochenrhythmus</h5>
          <div className="flex gap-1 justify-between">
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day, index) => {
              const hasCall = index === 0 || index === 2 || index === 3;
              const callColors = {
                0: "bg-blue-500",
                2: "bg-primary",
                3: "bg-amber-500",
              };
              return (
                <div key={day} className="flex-1 text-center">
                  <div
                    className={`h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                      hasCall
                        ? `${callColors[index as keyof typeof callColors]} text-white`
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {day}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground justify-center flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Leads
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" /> Outreach
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Vertrieb
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
