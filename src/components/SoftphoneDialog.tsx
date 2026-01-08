import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, User, Clock, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlacetelClient, PlacetelConfig, PlacetelCallbacks } from "@/lib/placetelClient";

interface SoftphoneDialogProps {
  open: boolean;
  onClose: () => void;
  phoneNumber: string;
  contactName: string;
  dealId?: string;
}

type CallStatus = 'idle' | 'connecting' | 'registering' | 'dialing' | 'ringing' | 'connected' | 'ended' | 'error';

interface SipSettings {
  sip_provider: string | null;
  sip_server: string | null;
  sip_domain: string | null;
  sip_username: string | null;
  sip_password_encrypted: string | null;
  sip_display_name: string | null;
  sip_enabled: boolean;
}

export default function SoftphoneDialog({ 
  open, 
  onClose, 
  phoneNumber, 
  contactName,
  dealId 
}: SoftphoneDialogProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sipSettings, setSipSettings] = useState<SipSettings | null>(null);
  
  const clientRef = useRef<PlacetelClient | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);

  // Load SIP settings
  useEffect(() => {
    if (open) {
      loadSipSettings();
    }
  }, [open]);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Start call when dialog opens and settings are loaded
  useEffect(() => {
    if (open && sipSettings && callStatus === 'idle') {
      startCall();
    }
  }, [open, sipSettings]);

  const loadSipSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      const { data: profile } = await supabase
        .from('profiles')
        .select('account_id')
        .eq('id', user.id)
        .single();

      if (!profile?.account_id) throw new Error("Kein Account gefunden");

      const { data, error } = await supabase
        .from('account_integrations')
        .select('sip_provider, sip_server, sip_domain, sip_username, sip_password_encrypted, sip_display_name, sip_enabled')
        .eq('account_id', profile.account_id)
        .maybeSingle();

      if (error) throw error;

      if (!data || !data.sip_enabled) {
        setErrorMessage("SIP-Telefonie ist nicht aktiviert. Bitte konfiguriere deine SIP-Einstellungen unter Integrationen.");
        setCallStatus('error');
        return;
      }

      if (!data.sip_server || !data.sip_username || !data.sip_password_encrypted) {
        setErrorMessage("SIP-Zugangsdaten unvollständig. Bitte konfiguriere deine SIP-Einstellungen.");
        setCallStatus('error');
        return;
      }

      setSipSettings(data as SipSettings);
    } catch (error: any) {
      console.error('Error loading SIP settings:', error);
      setErrorMessage(error.message || "Fehler beim Laden der SIP-Einstellungen");
      setCallStatus('error');
    }
  };

  const cleanup = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
  }, []);

  const startCall = async () => {
    if (!sipSettings) return;

    setCallStatus('connecting');
    setErrorMessage(null);

    try {
      // Decode password
      const password = atob(sipSettings.sip_password_encrypted || '');

      const config: PlacetelConfig = {
        sipServer: sipSettings.sip_server!,
        login: sipSettings.sip_username!,
        password: password,
        domain: sipSettings.sip_domain || sipSettings.sip_server!.replace('wss://', '').split('/')[0],
        displayName: sipSettings.sip_display_name || undefined
      };

      const callbacks: PlacetelCallbacks = {
        onRegistered: () => {
          console.log('SIP Registered - starting call');
          setCallStatus('dialing');
          clientRef.current?.call(phoneNumber);
        },
        onUnregistered: () => {
          console.log('SIP Unregistered');
        },
        onRegistrationFailed: (error) => {
          console.error('Registration failed:', error);
          setErrorMessage(`Registrierung fehlgeschlagen: ${error}`);
          setCallStatus('error');
        },
        onCallConnecting: () => {
          console.log('Call connecting...');
          setCallStatus('ringing');
        },
        onCallConnected: () => {
          console.log('Call connected!');
          setCallStatus('connected');
          callStartTimeRef.current = new Date();
          startCallTimer();
          logCallStart();
        },
        onCallEnded: (reason) => {
          console.log('Call ended:', reason);
          setCallStatus('ended');
          stopCallTimer();
        },
        onCallFailed: (error) => {
          console.error('Call failed:', error);
          setErrorMessage(`Anruf fehlgeschlagen: ${error}`);
          setCallStatus('error');
        },
        onRemoteAudio: (stream) => {
          console.log('Remote audio received');
          if (audioRef.current) {
            audioRef.current.srcObject = stream;
            audioRef.current.play().catch(console.error);
          }
        },
        onLocalAudio: (stream) => {
          console.log('Local audio captured');
        }
      };

      clientRef.current = new PlacetelClient(config, callbacks);
      
      setCallStatus('registering');
      await clientRef.current.connect();
      
    } catch (error: any) {
      console.error('Call start error:', error);
      setErrorMessage(error.message || "Fehler beim Starten des Anrufs");
      setCallStatus('error');
    }
  };

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const logCallStart = async () => {
    if (!dealId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('call_sessions').insert({
        deal_id: dealId,
        user_id: user.id,
        started_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging call start:', error);
    }
  };

  const handleHangup = async () => {
    if (clientRef.current) {
      await clientRef.current.hangup();
    }
    cleanup();
    setCallStatus('ended');
    toast.info(`Anruf beendet (${formatDuration(callDuration)})`);
  };

  const handleClose = () => {
    if (callStatus === 'connected' || callStatus === 'ringing' || callStatus === 'dialing') {
      handleHangup();
    }
    cleanup();
    setCallStatus('idle');
    setCallDuration(0);
    setErrorMessage(null);
    setSipSettings(null);
    onClose();
  };

  const toggleMute = () => {
    // TODO: Implement mute functionality via PlacetelClient
    setIsMuted(!isMuted);
    toast.info(isMuted ? "Mikrofon aktiviert" : "Mikrofon stumm");
  };

  const toggleSpeaker = () => {
    if (audioRef.current) {
      audioRef.current.muted = isSpeakerOn;
    }
    setIsSpeakerOn(!isSpeakerOn);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = (): string => {
    switch (callStatus) {
      case 'idle': return 'Bereit';
      case 'connecting': return 'Verbinde...';
      case 'registering': return 'Registriere...';
      case 'dialing': return 'Wähle...';
      case 'ringing': return 'Klingelt...';
      case 'connected': return 'Verbunden';
      case 'ended': return 'Beendet';
      case 'error': return 'Fehler';
      default: return '';
    }
  };

  const getStatusColor = (): string => {
    switch (callStatus) {
      case 'connected': return 'bg-green-500';
      case 'ringing':
      case 'dialing': return 'bg-yellow-500 animate-pulse';
      case 'error': return 'bg-red-500';
      case 'ended': return 'bg-muted';
      default: return 'bg-blue-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Softphone
          </DialogTitle>
        </DialogHeader>

        {/* Hidden audio element for remote audio */}
        <audio ref={audioRef} autoPlay />

        <div className="space-y-6 py-4">
          {/* Contact Info */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">{contactName}</h3>
            <p className="text-muted-foreground font-mono">{phoneNumber}</p>
          </div>

          {/* Status */}
          <div className="flex justify-center items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <span className="text-sm font-medium">{getStatusText()}</span>
            {callStatus === 'connected' && (
              <Badge variant="secondary" className="font-mono">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(callDuration)}
              </Badge>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Loading States */}
          {(callStatus === 'connecting' || callStatus === 'registering' || callStatus === 'dialing') && (
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Call Controls */}
          {callStatus === 'connected' && (
            <div className="flex justify-center gap-4">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="icon"
                className="w-12 h-12 rounded-full"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              <Button
                variant={!isSpeakerOn ? "destructive" : "outline"}
                size="icon"
                className="w-12 h-12 rounded-full"
                onClick={toggleSpeaker}
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
            </div>
          )}

          {/* Main Action Button */}
          <div className="flex justify-center">
            {callStatus === 'connected' || callStatus === 'ringing' || callStatus === 'dialing' ? (
              <Button
                variant="destructive"
                size="lg"
                className="w-16 h-16 rounded-full"
                onClick={handleHangup}
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            ) : callStatus === 'error' || callStatus === 'ended' ? (
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Schließen
                </Button>
                <Button onClick={() => {
                  setCallStatus('idle');
                  setErrorMessage(null);
                  setCallDuration(0);
                  startCall();
                }}>
                  <Phone className="w-4 h-4 mr-2" />
                  Erneut anrufen
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}