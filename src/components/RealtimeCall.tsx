import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { RealtimeChat } from '@/utils/RealtimeAudio';

interface RealtimeCallProps {
  contactName: string;
  onCallEnd: () => void;
  systemPrompt?: string;
}

const RealtimeCall: React.FC<RealtimeCallProps> = ({ 
  contactName, 
  onCallEnd,
  systemPrompt 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  const chatRef = useRef<RealtimeChat | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const endConversation = () => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    onCallEnd();
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
              >
                <PhoneOff className="mr-2 h-5 w-5" />
                Auflegen
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