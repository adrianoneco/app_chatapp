import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Send,
  Sparkles,
  Mic,
  Video,
  Camera,
  Paperclip,
  FileText,
  Music,
  User,
  Image,
  Loader2,
  X,
  Square,
  Play,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSendMedia?: (type: string, file: File, metadata?: any) => Promise<void>;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
  replyToMessage?: { senderName: string; content: string } | null;
  onClearReply?: () => void;
}

export function EnhancedMessageInput({
  value,
  onChange,
  onSend,
  onSendMedia,
  disabled,
  isSending,
  placeholder = "Digite sua mensagem...",
  replyToMessage,
  onClearReply,
}: EnhancedMessageInputProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isCorrectingText, setIsCorrectingText] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);
  const [videoRecorder, setVideoRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [videoChunks, setVideoChunks] = useState<Blob[]>([]);

  const handleCorrectText = async () => {
    if (!value.trim()) {
      toast({
        title: "Texto vazio",
        description: "Digite algo para corrigir",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCorrectingText(true);
      const response = await fetch("/api/ai/correct-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: value }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Falha ao corrigir texto");
      }

      const data = await response.json();
      if (data.wasChanged) {
        onChange(data.corrected);
        toast({
          title: "Texto corrigido",
          description: "Seu texto foi corrigido com sucesso!",
        });
      } else {
        toast({
          title: "Texto correto",
          description: "Nenhuma correção necessária",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao corrigir texto",
        variant: "destructive",
      });
    } finally {
      setIsCorrectingText(false);
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: "audio/webm" });
        
        if (onSendMedia) {
          await onSendMedia("audio", audioFile, { duration: recordingTime });
        }
        
        setRecordingTime(0);
        setAudioChunks([]);
      };

      recorder.start();
      setAudioRecorder(recorder);
      setIsRecordingAudio(true);
      setAudioChunks(chunks);

      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);

    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível acessar o microfone",
        variant: "destructive",
      });
    }
  };

  const stopAudioRecording = () => {
    if (audioRecorder && audioRecorder.state !== "inactive") {
      audioRecorder.stop();
    }
    setIsRecordingAudio(false);
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
        
        const videoBlob = new Blob(chunks, { type: "video/webm" });
        const videoFile = new File([videoBlob], `video_${Date.now()}.webm`, { type: "video/webm" });
        
        if (onSendMedia) {
          await onSendMedia("video", videoFile, { duration: recordingTime });
        }
        
        setRecordingTime(0);
        setVideoChunks([]);
        setIsRecordingVideo(false);
      };

      recorder.start();
      setVideoRecorder(recorder);
      setIsRecordingVideo(true);
      setVideoChunks(chunks);

      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);

    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível acessar a câmera",
        variant: "destructive",
      });
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorder && videoRecorder.state !== "inactive") {
      videoRecorder.stop();
    }
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setIsCameraOpen(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível acessar a câmera",
        variant: "destructive",
      });
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (blob && onSendMedia) {
          const imageFile = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
          await onSendMedia("image", imageFile);
          closeCamera();
        }
      }, "image/jpeg", 0.9);
    }
  };

  const handleFileUpload = (type: string) => {
    if (type === "image") {
      imageInputRef.current?.click();
    } else {
      if (fileInputRef.current) {
        switch (type) {
          case "document":
            fileInputRef.current.accept = ".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx";
            break;
          case "music":
            fileInputRef.current.accept = "audio/*";
            break;
          default:
            fileInputRef.current.accept = "*/*";
        }
        fileInputRef.current.click();
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file && onSendMedia) {
      await onSendMedia(type, file);
    }
    e.target.value = "";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isSending) {
        onSend();
      }
    }
  };

  return (
    <>
      <div className="space-y-2">
        {replyToMessage && (
          <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg text-sm">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary">{replyToMessage.senderName}</p>
              <p className="text-xs text-muted-foreground truncate">{replyToMessage.content}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={onClearReply}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        <div className="relative">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className="min-h-[80px] pr-12 pb-12 resize-none bg-secondary/50 border-border/50"
            data-testid="input-message"
          />
          
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleCorrectText}
                    disabled={isCorrectingText || !value.trim()}
                    data-testid="button-correct-text"
                  >
                    {isCorrectingText ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Corrigir texto com IA</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={isRecordingAudio ? "destructive" : "ghost"}
                    className="h-8 w-8"
                    onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
                    data-testid="button-record-audio"
                  >
                    {isRecordingAudio ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRecordingAudio ? `Gravando ${formatTime(recordingTime)}` : "Gravar áudio"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={isRecordingVideo ? "destructive" : "ghost"}
                    className="h-8 w-8"
                    onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording}
                    data-testid="button-record-video"
                  >
                    {isRecordingVideo ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Video className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRecordingVideo ? `Gravando ${formatTime(recordingTime)}` : "Gravar vídeo"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={openCamera}
                    data-testid="button-take-photo"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tirar foto</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        data-testid="button-upload-dropdown"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Anexar arquivo</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => handleFileUpload("image")} data-testid="menu-upload-image">
                    <Image className="h-4 w-4 mr-2" />
                    Imagem
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFileUpload("document")} data-testid="menu-upload-document">
                    <FileText className="h-4 w-4 mr-2" />
                    Documento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFileUpload("music")} data-testid="menu-upload-music">
                    <Music className="h-4 w-4 mr-2" />
                    Música
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}} data-testid="menu-upload-contact">
                    <User className="h-4 w-4 mr-2" />
                    Contato
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button
              size="icon"
              className="h-8 w-8 bg-primary"
              onClick={onSend}
              disabled={disabled || isSending || !value.trim()}
              data-testid="button-send-message"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileChange(e, "file")}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, "image")}
      />

      <Dialog open={isCameraOpen} onOpenChange={(open) => !open && closeCamera()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tirar Foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={closeCamera}>
                Cancelar
              </Button>
              <Button onClick={takePhoto} data-testid="button-capture-photo">
                <Camera className="h-4 w-4 mr-2" />
                Capturar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isRecordingVideo && (
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                Gravando vídeo - {formatTime(recordingTime)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex justify-center">
                <Button variant="destructive" onClick={stopVideoRecording}>
                  <Square className="h-4 w-4 mr-2" />
                  Parar gravação
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
