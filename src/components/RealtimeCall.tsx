import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, PhoneOff, Mic, MicOff, Download } from 'lucide-react';
import { toast } from 'sonner';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeCallProps {
  contactName: string;
  contactId?: string;
  dealId?: string;
  onCallEnd: () => void;
  systemPrompt?: string;
}

const RealtimeCall: React.FC<RealtimeCallProps> = ({ 
  contactName,
  contactId,
  dealId,
  onCallEnd,
  systemPrompt 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const chatRef = useRef<RealtimeChat | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const handleMessage = (event: any) => {
    console.log('Received message:', event.type);
    
    if (event.type === 'response.audio_transcript.delta') {
      setTranscript(prev => [...prev, `AI: ${event.delta}`]);
    } else if (event.type === 'conversation.item.input_audio_transcription.completed') {
      setTranscript(prev => [...prev, `Du: ${event.transcript}`]);
    } else if (event.type === 'error') {
      console.error('OpenAI error:', event);
      toast.error(`Fehler: ${event.error?.message || 'Unbekannter Fehler'}`);
    }
  };

  const handleError = (error: string) => {
    toast.error(error);
    endConversation();
  };

  const startConversation = async () => {
    try {
      setIsConnecting(true);
      const defaultPrompt = `Du führst ein professionelles Verkaufsgespräch mit ${contactName}. Sei freundlich, höre aufmerksam zu und stelle relevante Fragen, um den Bedarf zu verstehen.`;
      
      chatRef.current = new RealtimeChat(handleMessage, handleError);
      await chatRef.current.init(systemPrompt || defaultPrompt);
      
      setIsConnected(true);
      setIsConnecting(false);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      
      toast.success("Verbindung hergestellt");
    } catch (error) {
      console.error('Error starting conversation:', error);
      setIsConnecting(false);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Verbinden');
    }
  };

  const endConversation = async () => {
    try {
      setIsSummarizing(true);
      
      // Get recording and transcript before disconnecting
      const recording = await chatRef.current?.getRecording();
      const fullTranscript = chatRef.current?.getTranscript() || '';
      
      let savedSessionId: string | null = null;
      
      if (recording && dealId) {
        savedSessionId = await saveRecording(recording);
      }
      
      chatRef.current?.disconnect();
      setIsConnected(false);
      setIsConnecting(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Generate summary if we have transcript and session
      if (fullTranscript && savedSessionId) {
        await generateSummary(savedSessionId, fullTranscript);
      }
      
      setIsSummarizing(false);
      onCallEnd();
    } catch (error) {
      console.error('Error ending conversation:', error);
      setIsSummarizing(false);
      toast.error('Fehler beim Beenden des Calls');
    }
  };

  const saveRecording = async (recording: Blob): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${user.id}/${dealId || 'unknown'}_${timestamp}.webm`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('call-recordings')
        .upload(fileName, recording, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('call-recordings')
        .getPublicUrl(fileName);

      // Save to call_sessions
      if (dealId) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('call_sessions')
          .insert({
            deal_id: dealId,
            user_id: user.id,
            recording_url: publicUrl,
            recording_duration_seconds: callDuration,
            started_at: new Date(Date.now() - callDuration * 1000).toISOString(),
            ended_at: new Date().toISOString(),
            duration_seconds: callDuration
          })
          .select('id')
          .single();

        if (sessionError) throw sessionError;
        
        toast.success('Call-Recording gespeichert');
        return sessionData?.id || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error('Fehler beim Speichern der Aufnahme');
      return null;
    }
  };

  const generateSummary = async (sessionId: string, transcript: string) => {
    try {
      console.log('Generating summary for session:', sessionId);
      toast.info('Generiere Call-Zusammenfassung...');
      
      const { data, error } = await supabase.functions.invoke('summarize-call', {
        body: { sessionId, transcript }
      });

      if (error) throw error;

      console.log('Summary generated:', data);
      toast.success('Call-Zusammenfassung erstellt');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Fehler beim Generieren der Zusammenfassung');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Implement actual mute/unmute
    toast.info(isMuted ? "Mikrofon aktiviert" : "Mikrofon stummgeschaltet");
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>WebRTC Call: {contactName}</span>
          {isConnected && (
            <span className="text-sm font-normal text-muted-foreground">
              {formatDuration(callDuration)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && !isConnecting ? (
          <div className="text-center py-8">
            <Button 
              onClick={startConversation}
              size="lg"
              className="bg-success hover:bg-success/90"
            >
              <Phone className="mr-2 h-5 w-5" />
              Anruf starten
            </Button>
          </div>
        ) : isConnecting ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verbinde...</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={toggleMute}
                variant="outline"
                size="lg"
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button 
                onClick={endConversation}
                variant="destructive"
                size="lg"
                disabled={isSummarizing}
              >
                <PhoneOff className="mr-2 h-5 w-5" />
                {isSummarizing ? 'Speichert...' : 'Auflegen'}
              </Button>
            </div>

            {transcript.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <h4 className="text-sm font-semibold mb-2">Transkript:</h4>
                <div className="space-y-1 text-sm">
                  {transcript.map((line, i) => (
                    <div key={i} className={line.startsWith('Du:') ? 'text-primary' : 'text-foreground'}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RealtimeCall;