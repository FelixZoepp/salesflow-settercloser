# Power Dialer - SalesFlow

## Übersicht

Der Power Dialer ist ein automatisiertes Kaltakquise-Tool, das Vertriebsmitarbeitern ermöglicht, schnell durch Leads zu navigieren und Calls effizient zu loggen.

## Features

### ✅ Automatischer Lead-Wechsel
- Nach jedem geloggten Call wird automatisch der nächste Lead aus der Queue geladen
- Keine manuelle Navigation notwendig
- Optimiert für hohe Schlagzahl

### 📞 Multi-Dialer-Support
Der Power Dialer unterstützt verschiedene Dialer-Systeme:

1. **System Dialer** (Standard)
   - Nutzt native `tel:` Links
   - Funktioniert auf allen Geräten
   
2. **Aircall Integration**
   - Öffnet Aircall Desktop-App
   - Setze `VITE_DIALER_KIND=aircall` in `.env`

3. **Custom Dialer**
   - Eigene Dialer-URL konfigurierbar
   - Setze `VITE_DIALER_KIND=custom` und `VITE_DIALER_BASE_URL=https://...` in `.env`

### 🎯 Call Outcomes

Der Power Dialer unterstützt folgende Outcomes:

- **Nicht erreicht** → Stage wird automatisch erhöht (1×, 2×, 3× nicht erreicht)
- **Gatekeeper** → Kontakt wurde erreicht, aber nicht der Entscheider
- **Entscheider** → Entscheider wurde erreicht
- **Termin gelegt** → Stage wird zu "Termin gelegt" gesetzt (Deal kann erstellt werden)
- **Kein Interesse** → Stage wird zu "Kein Interesse / Kein Bedarf" gesetzt
- **Rückruf** → Rückruf wurde vereinbart

### 🔄 Cold Call Queue

Die Queue basiert auf einer intelligenten View (`cold_call_queue`):

**Eingeschlossene Stages:**
- Lead
- 1× nicht erreicht
- 2× nicht erreicht
- 3× nicht erreicht
- Entscheider nicht erreichbar
- Im Urlaub

**Sortierung:**
1. Zuletzt kontaktiert (älteste zuerst)
2. Erstellungsdatum (älteste zuerst)

**Rollenbasierte Filterung:**
- Setter sehen nur ihre eigenen Kontakte (`owner_user_id`)
- Admin sieht alle Kontakte

## Datenbank-Schema

### Neue Felder in `contacts`:
- `stage` (text): Kaltakquise-Stage (default: "Lead")
- `status` (text): Optionaler zusätzlicher Status

### Activities:
Jeder Call wird als Activity geloggt:
- `type`: "call"
- `outcome`: Call-Ergebnis (siehe oben)
- `note`: Optional zusätzliche Notizen
- `timestamp`: Zeitstempel des Calls

### Materialized View:
- `contact_last_activity`: Cached letzte Aktivität pro Kontakt
- Wird nach jedem geloggten Call aktualisiert

## API / Edge Functions

### `/power-dialer-next`
**GET** - Holt den nächsten Lead aus der Queue

**Antwort:**
```json
{
  "id": "uuid",
  "first_name": "Max",
  "last_name": "Mustermann",
  "phone": "+49123456789",
  "company": "ACME GmbH",
  "stage": "Lead"
}
```

### `/power-dialer-log`
**POST** - Loggt einen Call und gibt nächsten Lead zurück

**Body:**
```json
{
  "contact_id": "uuid",
  "outcome": "no_answer",
  "new_stage": "1× nicht erreicht",
  "message": "Optional zusätzliche Info"
}
```

**Antwort:**
```json
{
  "ok": true,
  "next": { /* nächster Lead */ }
}
```

## Sicherheitshinweise

⚠️ **Security Linter Warnings:**

Nach dem Setup gibt es einige Security-Warnungen, die zu beachten sind:

1. **Security Definer View** (cold_call_queue)
   - Die View nutzt die Permissions des Erstellers
   - ✅ **Sicher**, da die zugrundeliegende `contacts` Tabelle RLS hat
   - Users können nur Kontakte sehen, die sie berechtigt sind zu sehen

2. **Materialized View in API** (contact_last_activity)
   - ✅ **Behoben**: Permissions wurden entzogen für anon/authenticated
   - View wird nur intern von `cold_call_queue` genutzt

3. **Leaked Password Protection**
   - ⚠️ Allgemeine Auth-Einstellung, nicht spezifisch für Power Dialer
   - Empfehlung: In Produktion aktivieren

## Workflow

1. User öffnet Power Dialer Page (`/power-dialer`)
2. Erster Lead wird automatisch geladen
3. User klickt "Anrufen" → Dialer öffnet sich
4. Nach Gespräch: User wählt Outcome
5. Call wird geloggt, Stage ggf. aktualisiert
6. Nächster Lead wird automatisch geladen
7. Zurück zu Schritt 3

## Konfiguration

### Environment Variables (.env)

```bash
# Dialer-Konfiguration (optional, default: system)
VITE_DIALER_KIND=system  # Optionen: system, aircall, custom

# Nur bei VITE_DIALER_KIND=custom notwendig:
VITE_DIALER_BASE_URL=https://your-dialer.com/call
```

### Beispiel Custom Dialer URL
Bei `VITE_DIALER_BASE_URL=https://dialer.example.com/call` wird der Link generiert als:
```
https://dialer.example.com/call?to=%2B49123456789
```

## Erweiterungsmöglichkeiten

### Geplante Features:
- ⏰ Rückrufzeiten: `callback_at` Feld für zeitgesteuerte Rückrufe
- 📊 Live-KPIs: Calls pro Stunde, Erreichbarkeitsquote
- 🔔 No-Show Automation: Automatische Follow-Up-Tasks nach 48h
- 📋 Telefonnummern-Normierung: E.164 Format
- 🔍 Duplikate-Check: Deduplizierung bei Import

## Nutzung

1. Gehe zu `/power-dialer` in der Navigation
2. Der erste verfügbare Lead wird automatisch angezeigt
3. Klicke "Anrufen" um den konfigurierten Dialer zu öffnen
4. Nach dem Gespräch: Wähle das passende Outcome
5. Der nächste Lead wird automatisch geladen

**Keine Queue mehr?** 
Alle verfügbaren Leads wurden bearbeitet. Neue Kontakte können über die Kontakte-Seite hinzugefügt werden.
