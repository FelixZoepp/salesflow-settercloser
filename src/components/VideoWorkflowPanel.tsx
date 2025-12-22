import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Video, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Upload,
  Link,
  Users,
  Sparkles
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoWorkflowPanelProps {
  campaignId: string;
  campaignName: string;
}

type VideoStatus = 'pending' | 'generating_intro' | 'merging' | 'uploading' | 'ready' | 'error';

const statusConfig: Record<VideoStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Ausstehend', color: 'bg-muted text-muted-foreground', icon: <Video className="h-3 w-3" /> },
  generating_intro: { label: 'Intro wird generiert', color: 'bg-blue-500/20 text-blue-400', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  merging: { label: 'Videos werden zusammengefügt', color: 'bg-yellow-500/20 text-yellow-400', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  uploading: { label: 'Upload läuft', color: 'bg-purple-500/20 text-purple-400', icon: <Upload className="h-3 w-3" /> },
  ready: { label: 'Bereit', color: 'bg-green-500/20 text-green-400', icon: <CheckCircle2 className="h-3 w-3" /> },
  error: { label: 'Fehler', color: 'bg-destructive/20 text-destructive', icon: <AlertCircle className="h-3 w-3" /> },
};

export const VideoWorkflowPanel = ({ campaignId, campaignName }: VideoWorkflowPanelProps) => {
  const queryClient = useQueryClient();
  const [pitchVideoUrl, setPitchVideoUrl] = useState('');

  // Fetch campaign settings
  const { data: campaign } = useQuery({
    queryKey: ['campaign-settings', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('pitch_video_url, heygen_avatar_id, heygen_voice_id')
        .eq('id', campaignId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch contacts with video status
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['campaign-video-contacts', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, company, video_status, video_url, video_error, video_generated_at, slug')
        .eq('campaign_id', campaignId)
        .eq('lead_type', 'outbound')
        .order('first_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Update pitch video URL
  const updatePitchUrl = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase
        .from('campaigns')
        .update({ pitch_video_url: url })
        .eq('id', campaignId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Pitch-Video URL gespeichert');
      queryClient.invalidateQueries({ queryKey: ['campaign-settings', campaignId] });
    },
    onError: () => {
      toast.error('Fehler beim Speichern');
    },
  });

  // Generate video for a contact
  const generateVideo = useMutation({
    mutationFn: async (contact: { id: string; first_name: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-heygen-video', {
        body: {
          contactId: contact.id,
          firstName: contact.first_name,
          avatarId: campaign?.heygen_avatar_id,
          voiceId: campaign?.heygen_voice_id,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Video-Generierung gestartet');
      queryClient.invalidateQueries({ queryKey: ['campaign-video-contacts', campaignId] });
    },
    onError: (error) => {
      toast.error('Fehler beim Starten der Video-Generierung');
      console.error(error);
    },
  });

  // Generate videos for ALL pending contacts
  const generateAllVideos = useMutation({
    mutationFn: async () => {
      const pendingContacts = contacts?.filter(c => c.video_status === 'pending') || [];
      const totalPending = pendingContacts.length;
      
      if (totalPending === 0) {
        throw new Error('Keine ausstehenden Leads');
      }

      // Process all contacts in batches of 10 with delay
      const batchSize = 10;
      let processed = 0;
      
      for (let i = 0; i < pendingContacts.length; i += batchSize) {
        const batch = pendingContacts.slice(i, i + batchSize);
        
        // Process batch in parallel
        await Promise.all(
          batch.map(contact =>
            supabase.functions.invoke('generate-heygen-video', {
              body: {
                contactId: contact.id,
                firstName: contact.first_name,
                avatarId: campaign?.heygen_avatar_id,
                voiceId: campaign?.heygen_voice_id,
              },
            })
          )
        );
        
        processed += batch.length;
        toast.info(`${processed}/${totalPending} Videos gestartet...`);
        
        // Delay between batches to avoid rate limiting
        if (i + batchSize < pendingContacts.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      return { total: totalPending };
    },
    onSuccess: (data) => {
      toast.success(`Alle ${data?.total} Videos werden generiert!`);
      queryClient.invalidateQueries({ queryKey: ['campaign-video-contacts', campaignId] });
    },
    onError: (error) => {
      toast.error(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    },
  });

  const stats = {
    total: contacts?.length || 0,
    pending: contacts?.filter(c => c.video_status === 'pending').length || 0,
    generating: contacts?.filter(c => ['generating_intro', 'merging', 'uploading'].includes(c.video_status || '')).length || 0,
    ready: contacts?.filter(c => c.video_status === 'ready').length || 0,
    error: contacts?.filter(c => c.video_status === 'error').length || 0,
  };

  const progress = stats.total > 0 ? Math.round((stats.ready / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Workflow Overview */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Video-Workflow
          </CardTitle>
          <CardDescription>
            Personalisierte Videos für {campaignName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pitch Video URL */}
          <div className="space-y-2">
            <Label>Standard Pitch-Video URL (2min)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://youtube.com/... oder https://vimeo.com/..."
                value={pitchVideoUrl || campaign?.pitch_video_url || ''}
                onChange={(e) => setPitchVideoUrl(e.target.value)}
              />
              <Button 
                onClick={() => updatePitchUrl.mutate(pitchVideoUrl)}
                disabled={updatePitchUrl.isPending}
              >
                {updatePitchUrl.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
              </Button>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fortschritt</span>
              <span className="font-medium">{stats.ready} / {stats.total} Videos fertig</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="grid grid-cols-4 gap-4 pt-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Ausstehend</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.generating}</div>
                <div className="text-xs text-muted-foreground">In Bearbeitung</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.ready}</div>
                <div className="text-xs text-muted-foreground">Fertig</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{stats.error}</div>
                <div className="text-xs text-muted-foreground">Fehler</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => generateAllVideos.mutate()}
              disabled={generateAllVideos.isPending || stats.pending === 0 || !campaign?.pitch_video_url}
              className="w-full"
              size="lg"
            >
              {generateAllVideos.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Alle {stats.pending} Videos generieren
            </Button>
            
            {stats.pending > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Geschätzte Kosten: ~${((stats.pending * 6 / 60) * 1).toFixed(2)} - ${((stats.pending * 6 / 60) * 2).toFixed(2)} bei HeyGen
                <br />
                <span className="text-yellow-500">(6 Sek. × {stats.pending} Leads = {(stats.pending * 6 / 60).toFixed(1)} Min.)</span>
              </p>
            )}
          </div>

          {!campaign?.pitch_video_url && (
            <p className="text-sm text-yellow-500">
              ⚠️ Bitte zuerst das Pitch-Video URL eintragen
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lead Video Status List */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lead Video Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {contacts?.map((contact) => {
                const status = (contact.video_status as VideoStatus) || 'pending';
                const config = statusConfig[status];
                
                return (
                  <div 
                    key={contact.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {contact.company}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={`${config.color} flex items-center gap-1`}>
                        {config.icon}
                        {config.label}
                      </Badge>
                      
                      {status === 'ready' && contact.slug && (
                        <Button variant="ghost" size="sm" asChild>
                          <a 
                            href={`/p/${contact.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Link className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      
                      {status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => generateVideo.mutate({ 
                            id: contact.id, 
                            first_name: contact.first_name 
                          })}
                          disabled={generateVideo.isPending}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {status === 'error' && contact.video_error && (
                        <span className="text-xs text-destructive max-w-[150px] truncate" title={contact.video_error}>
                          {contact.video_error}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {(!contacts || contacts.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  Keine Outbound-Leads in dieser Kampagne
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
