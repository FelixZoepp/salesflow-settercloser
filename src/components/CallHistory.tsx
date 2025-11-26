import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface CallSession {
  id: string;
  deal_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  recording_duration_seconds: number | null;
}

interface CallHistoryProps {
  contactId?: string;
  dealId?: string;
}

const CallHistory: React.FC<CallHistoryProps> = ({ contactId, dealId }) => {
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchCallHistory();
  }, [contactId, dealId]);

  const fetchCallHistory = async () => {
    try {
      let query = supabase
        .from('call_sessions')
        .select('*')
        .not('recording_url', 'is', null)
        .order('started_at', { ascending: false })
        .limit(10);

      if (dealId) {
        query = query.eq('deal_id', dealId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching call history:', error);
      toast.error('Fehler beim Laden der Call-History');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = (session: CallSession) => {
    if (!session.recording_url) return;

    if (playingId === session.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = session.recording_url;
        audioRef.current.play();
        setPlayingId(session.id);
      }
    }
  };

  const downloadRecording = async (session: CallSession) => {
    if (!session.recording_url) return;

    try {
      const response = await fetch(session.recording_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call_${session.id}_${format(new Date(session.started_at), 'yyyy-MM-dd_HH-mm')}.webm`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download gestartet');
    } catch (error) {
      console.error('Error downloading recording:', error);
      toast.error('Fehler beim Download');
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Call-Aufnahmen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Keine Aufnahmen vorhanden
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Call-Aufnahmen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <audio
          ref={audioRef}
          onEnded={() => setPlayingId(null)}
          className="hidden"
        />
        
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(session.started_at), 'dd. MMM yyyy, HH:mm', { locale: de })}
                </span>
              </div>
              {session.recording_duration_seconds && (
                <p className="text-xs text-muted-foreground mt-1">
                  Dauer: {formatDuration(session.recording_duration_seconds)}
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => togglePlay(session)}
              >
                {playingId === session.id ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadRecording(session)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CallHistory;