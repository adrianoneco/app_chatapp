import { Play, Pause, Download, Forward, Reply, Volume2, Image as ImageIcon, User, Phone, Mail, Music, Video, File, Check, CheckCheck, Smile, MoreVertical } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

interface QuotedMessage {
  id: string;
  senderName: string;
  content: string;
  contentType?: string;
}

interface ContactInfo {
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

interface AudioMetadata {
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  duration?: number;
}

interface BaseMessageProps {
  isOwn: boolean;
  quotedMessage?: QuotedMessage;
  isForwarded?: boolean;
  reactions?: MessageReaction[];
  isPrivate?: boolean;
}

// Quoted/Reply Message Component
export function QuotedMessageBubble({ message }: { message: QuotedMessage }) {
  return (
    <div className="flex items-start gap-2 mb-2 p-2 border-l-4 border-primary/50 bg-black/10 rounded-r">
      <Reply className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-primary">{message.senderName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {message.contentType === "image" && "📷 Imagem"}
          {message.contentType === "video" && "🎥 Vídeo"}
          {message.contentType === "audio" && "🎵 Áudio"}
          {message.contentType === "text" && message.content}
          {!message.contentType && message.content}
        </p>
      </div>
    </div>
  );
}

// Forwarded Indicator
export function ForwardedIndicator() {
  return (
    <div className="flex items-center gap-1.5 mb-1 text-xs text-muted-foreground italic">
      <Forward className="h-3 w-3" />
      <span>Encaminhada</span>
    </div>
  );
}

// Private Message Indicator
export function PrivateIndicator() {
  return (
    <div className="flex items-center gap-1.5 mb-1 text-xs text-orange-500">
      <span className="font-semibold">🔒 Mensagem Privada</span>
    </div>
  );
}

// Message Status Indicator
export function MessageStatus({ status }: { status?: 'sent' | 'delivered' | 'read' }) {
  if (!status || status === 'sent') {
    return <Check className="h-3 w-3" />;
  }
  
  return (
    <CheckCheck 
      className={cn(
        "h-3 w-3",
        status === 'read' && "text-blue-500"
      )} 
    />
  );
}

// Image Message
export function ImageMessage({ src, caption }: { src: string; caption?: string }) {
  return (
    <div className="rounded-lg overflow-hidden">
      <img src={src} alt="" className="max-w-full h-auto rounded-lg" />
      {caption && <p className="mt-2 text-sm">{caption}</p>}
    </div>
  );
}

// Video Message
export function VideoMessage({ src, caption, thumbnail, duration }: { src: string; caption?: string; thumbnail?: string; duration?: number }) {
  return (
    <div className="rounded-lg overflow-hidden max-w-sm relative group">
      {thumbnail ? (
        <img src={thumbnail} alt="Thumbnail" className="w-full h-auto" />
      ) : (
        <div className="w-full h-48 bg-secondary/50 flex items-center justify-center">
          <Video className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
        <Button size="icon" variant="secondary" className="rounded-full h-12 w-12">
          <Play className="h-6 w-6" />
        </Button>
      </div>
      {caption && <p className="mt-2 text-sm">{caption}</p>}
    </div>
  );
}

// Audio Message
export function AudioMessage({ src, duration }: { src: string; duration: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-w-[280px] bg-secondary/30 rounded-lg overflow-hidden">
      <div className="p-3">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden cursor-pointer">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(currentTime / duration) * 100}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 border-t border-border/30">
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full flex-shrink-0 h-8 w-8"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatTime(currentTime)}
        </span>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatTime(duration)}
        </span>
        <div className="flex-1" />
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full flex-shrink-0 h-8 w-8"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Music/Audio with ID3 Tags
export function MusicMessage({ metadata, src }: { metadata: AudioMetadata; src: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = metadata.duration || 180;

  return (
    <div className="flex items-center gap-3 min-w-[320px] max-w-sm">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
        {metadata.albumArt ? (
          <img src={metadata.albumArt} alt={metadata.album} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{metadata.title}</p>
        <p className="text-xs text-muted-foreground truncate">{metadata.artist}</p>
        {metadata.album && <p className="text-xs text-muted-foreground truncate">{metadata.album}</p>}
        <div className="mt-2 flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full flex-shrink-0"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <div className="flex-1">
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(currentTime / duration) * 100}%` }} />
            </div>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}

// Contact Message
export function ContactMessage({ metadata }: { metadata: ContactInfo }) {
  return (
    <div className="flex items-center gap-3 min-w-[250px] p-2 bg-secondary/30 rounded-lg">
      <Avatar className="h-12 w-12 border border-border/50">
        <AvatarImage src={metadata.avatar} />
        <AvatarFallback>
          {metadata.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{metadata.name}</p>
        {metadata.phone && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <Phone className="h-3 w-3" />
            <span>{metadata.phone}</span>
          </div>
        )}
        {metadata.email && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <Mail className="h-3 w-3" />
            <span className="truncate">{metadata.email}</span>
          </div>
        )}
      </div>
      <Button size="sm" variant="outline" className="flex-shrink-0">
        <User className="h-3.5 w-3.5 mr-1" />
        Ver
      </Button>
    </div>
  );
}

// Message Reactions
export function MessageReactions({ reactions }: { reactions: MessageReaction[] }) {
  if (!reactions.length) return null;

  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      {reactions.map((reaction, idx) => (
        <button
          key={idx}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/50 hover:bg-secondary transition-colors text-xs"
        >
          <span>{reaction.emoji}</span>
          <span className="text-muted-foreground">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}

// Message Actions Component
export function MessageActions({ 
  onReply, 
  onForward, 
  onReact,
  onMore 
}: { 
  onReply?: () => void; 
  onForward?: () => void; 
  onReact?: () => void;
  onMore?: () => void;
}) {
  return (
    <div className="absolute -bottom-2 right-2 flex items-center gap-0.5 bg-background border border-border shadow-lg rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
      <TooltipProvider delayDuration={100}>
        {onReply && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-primary/10"
                onClick={onReply}
              >
                <Reply className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Responder</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {onForward && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-primary/10"
                onClick={onForward}
              >
                <Forward className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Encaminhar</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {onReact && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-primary/10"
                onClick={onReact}
              >
                <Smile className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Reagir</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {onMore && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-primary/10"
                onClick={onMore}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Mais opções</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}

// Wrapper Component
export function MessageWrapper({ 
  isOwn, 
  quotedMessage, 
  isForwarded, 
  reactions, 
  isPrivate,
  timestamp,
  status,
  onReply,
  onForward,
  onReact,
  onMore,
  children 
}: BaseMessageProps & { 
  children: React.ReactNode; 
  timestamp?: string; 
  status?: 'sent' | 'delivered' | 'read';
  onReply?: () => void;
  onForward?: () => void;
  onReact?: () => void;
  onMore?: () => void;
}) {
  return (
    <div className="relative group">
      <div
        className={cn(
          "rounded-xl px-4 py-2.5 relative overflow-visible",
          isOwn
            ? "bg-primary text-primary-foreground before:content-[''] before:absolute before:top-3 before:-right-3 before:w-0 before:h-0 before:border-l-[14px] before:border-l-primary before:border-t-[8px] before:border-t-transparent before:border-b-[8px] before:border-b-transparent"
            : "bg-secondary/70 before:content-[''] before:absolute before:top-3 before:-left-3 before:w-0 before:h-0 before:border-r-[14px] before:border-r-secondary/70 before:border-t-[8px] before:border-t-transparent before:border-b-[8px] before:border-b-transparent"
        )}
      >
        {isPrivate && <PrivateIndicator />}
        {isForwarded && <ForwardedIndicator />}
        {quotedMessage && <QuotedMessageBubble message={quotedMessage} />}
        {children}
        {timestamp && (
          <div className="flex items-center justify-end gap-1.5 mt-1">
            <p className={cn(
              "text-xs",
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {timestamp}
            </p>
            {isOwn && status && <MessageStatus status={status} />}
          </div>
        )}
        {reactions && <MessageReactions reactions={reactions} />}
      </div>
      
      {/* Message Actions */}
      <MessageActions 
        onReply={onReply}
        onForward={onForward}
        onReact={onReact}
        onMore={onMore}
      />
    </div>
  );
}
