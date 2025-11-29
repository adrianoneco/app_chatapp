import { useState, useEffect } from "react";
import * as React from "react";
import { useLocation, useRoute } from "wouter";
import { Layout } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Send, 
  Copy, 
  Check,
  Phone,
  Mail,
  MapPin,
  Globe,
  MessageSquare,
  Clock,
  User,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  Monitor,
  MessageCircle,
  History,
  PanelRightOpen,
  PanelRightClose,
  PanelLeftOpen,
  PanelLeftClose,
  Reply,
  Forward,
  Smile,
  Loader2
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ForwardModal } from "@/components/forward-modal";
import type { Conversation, Message } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import {
  QuotedMessageBubble,
  ForwardedIndicator,
  PrivateIndicator,
  ImageMessage,
  VideoMessage,
  AudioMessage,
  MusicMessage,
  ContactMessage,
  MessageReactions,
  MessageWrapper
} from "@/components/message-types";

const mockConversations: (Conversation & { unreadCount: number; lastMessage: string })[] = [
  {
    id: "1",
    protocol: "ATD-2024-001234",
    clientId: "c1",
    clientName: "MARIA SILVA",
    clientEmail: "maria.silva@email.com",
    clientPhone: "+55 11 99999-1234",
    attendantId: "a1",
    channel: "whatsapp",
    status: "open",
    priority: "high",
    subject: "Problema com pedido",
    latitude: "-23.5505",
    longitude: "-46.6333",
    city: "Sao Paulo",
    state: "SP",
    country: "Brasil",
    lastMessageAt: new Date(),
    closedAt: null,
    createdAt: new Date(),
    unreadCount: 3,
    lastMessage: "Ola, preciso de ajuda com meu pedido #12345",
  },
  {
    id: "2",
    protocol: "ATD-2024-001235",
    clientId: "c2",
    clientName: "JOAO SANTOS",
    clientEmail: "joao.santos@email.com",
    clientPhone: "+55 21 98888-5678",
    attendantId: "a1",
    channel: "web",
    status: "pending",
    priority: "normal",
    subject: "Duvida sobre produto",
    latitude: "-22.9068",
    longitude: "-43.1729",
    city: "Rio de Janeiro",
    state: "RJ",
    country: "Brasil",
    lastMessageAt: new Date(Date.now() - 3600000),
    closedAt: null,
    createdAt: new Date(Date.now() - 86400000),
    unreadCount: 0,
    lastMessage: "Qual o prazo de entrega para minha regiao?",
  },
  {
    id: "3",
    protocol: "ATD-2024-001236",
    clientId: "c3",
    clientName: "ANA OLIVEIRA",
    clientEmail: "ana.oliveira@email.com",
    clientPhone: "+55 31 97777-9012",
    attendantId: null,
    channel: "telegram",
    status: "open",
    priority: "urgent",
    subject: "Reclamacao urgente",
    latitude: "-19.9167",
    longitude: "-43.9345",
    city: "Belo Horizonte",
    state: "MG",
    country: "Brasil",
    lastMessageAt: new Date(Date.now() - 1800000),
    closedAt: null,
    createdAt: new Date(Date.now() - 172800000),
    unreadCount: 5,
    lastMessage: "Preciso resolver isso urgentemente!",
  },
];

const mockMessages: any[] = [
  {
    id: "m1",
    conversationId: "1",
    senderId: "c1",
    senderType: "client",
    senderName: "Maria Silva",
    content: "Ola, preciso de ajuda com meu pedido #12345",
    contentType: "text",
    fileUrl: null,
    isRead: true,
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: "m2",
    conversationId: "1",
    senderId: "a1",
    senderType: "attendant",
    senderName: "Suporte",
    content: "Ola Maria! Claro, vou verificar o status do seu pedido. Um momento por favor.",
    contentType: "text",
    fileUrl: null,
    isRead: true,
    createdAt: new Date(Date.now() - 3500000),
    reactions: [
      { emoji: "👍", count: 2, users: ["Maria Silva", "João"] },
      { emoji: "❤️", count: 1, users: ["Maria Silva"] }
    ]
  },
  {
    id: "m3",
    conversationId: "1",
    senderId: "a1",
    senderType: "attendant",
    senderName: "Suporte",
    content: "https://example.com/tracking.jpg",
    contentType: "image",
    fileUrl: "https://picsum.photos/400/300",
    caption: "Aqui está o código de rastreamento do seu pedido",
    isRead: true,
    createdAt: new Date(Date.now() - 3400000),
  },
  {
    id: "m4",
    conversationId: "1",
    senderId: "c1",
    senderType: "client",
    senderName: "Maria Silva",
    content: "Obrigada! Mas nao recebi o codigo de rastreamento ainda.",
    contentType: "text",
    fileUrl: null,
    isRead: false,
    quotedMessageId: "m2",
    quotedMessage: {
      id: "m2",
      senderName: "Suporte",
      content: "Ola Maria! Claro, vou verificar o status do seu pedido.",
      contentType: "text"
    },
    createdAt: new Date(Date.now() - 1800000),
  },
  {
    id: "m5",
    conversationId: "1",
    senderId: "a1",
    senderType: "attendant",
    senderName: "Suporte",
    content: "Gravei um audio explicando o processo",
    contentType: "audio",
    fileUrl: "/audio.mp3",
    duration: 45,
    isRead: true,
    createdAt: new Date(Date.now() - 1700000),
  },
  {
    id: "m6",
    conversationId: "1",
    senderId: "c1",
    senderType: "client",
    senderName: "Maria Silva",
    content: "Aqui está o video do problema",
    contentType: "video",
    fileUrl: "/video.mp4",
    thumbnail: "https://picsum.photos/400/225",
    duration: 120,
    caption: "O produto chegou com defeito",
    isRead: false,
    createdAt: new Date(Date.now() - 1600000),
    reactions: [
      { emoji: "😮", count: 1, users: ["Suporte"] }
    ]
  },
  {
    id: "m7",
    conversationId: "1",
    senderId: "a1",
    senderType: "attendant",
    senderName: "Suporte",
    content: "Segue o contato do gerente para resolver isso",
    contentType: "contact",
    metadata: JSON.stringify({
      name: "Carlos Santos - Gerente",
      phone: "+55 11 98765-4321",
      email: "carlos.santos@empresa.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos"
    }),
    isRead: true,
    isPrivate: true,
    createdAt: new Date(Date.now() - 1500000),
  },
  {
    id: "m8",
    conversationId: "1",
    senderId: "c1",
    senderType: "client",
    senderName: "Maria Silva",
    content: "Essa música me lembra do problema rsrs",
    contentType: "music",
    fileUrl: "/music.mp3",
    metadata: JSON.stringify({
      title: "Don't Stop Me Now",
      artist: "Queen",
      album: "Jazz",
      albumArt: "https://picsum.photos/200/200",
      duration: 209
    }),
    isRead: false,
    createdAt: new Date(Date.now() - 1400000),
  },
  {
    id: "m9",
    conversationId: "1",
    senderId: "a1",
    senderType: "attendant",
    senderName: "Suporte",
    content: "Vou resolver isso para você!",
    contentType: "text",
    fileUrl: null,
    isRead: true,
    isForwarded: true,
    createdAt: new Date(Date.now() - 1300000),
    reactions: [
      { emoji: "🎉", count: 3, users: ["Maria Silva", "João", "Ana"] },
      { emoji: "👏", count: 2, users: ["Maria Silva", "João"] }
    ]
  },
];

const mockPreviousConversations = [
  { id: "prev1", protocol: "ATD-2024-000987", date: "15/10/2024", status: "closed" },
  { id: "prev2", protocol: "ATD-2024-000654", date: "02/09/2024", status: "closed" },
];

const channelIcons: Record<string, typeof MessageSquare> = {
  whatsapp: MessageCircle,
  web: Monitor,
  telegram: Smartphone,
  email: Mail,
};

const channelLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  web: "Web Chat",
  telegram: "Telegram",
  email: "E-mail",
};

const statusColors: Record<string, string> = {
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/20 text-blue-400",
  normal: "bg-gray-500/20 text-gray-400",
  high: "bg-orange-500/20 text-orange-400",
  urgent: "bg-red-500/20 text-red-400",
};

export default function ConversationsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/conversation/:channelSlug/:conversationId");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [copiedProtocol, setCopiedProtocol] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("open");
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardMessageId, setForwardMessageId] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<any | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load user preferences
  useEffect(() => {
    if (user) {
      if (user.conversationsSidebarWidth) {
        setLeftSidebarWidth(user.conversationsSidebarWidth);
      }
      if (user.conversationsSidebarCollapsed !== undefined) {
        setIsLeftSidebarCollapsed(user.conversationsSidebarCollapsed);
      }
    } else {
      // Fallback to localStorage
      const savedWidth = localStorage.getItem("conversationsSidebarWidth");
      const savedCollapsed = localStorage.getItem("conversationsSidebarCollapsed");
      if (savedWidth) setLeftSidebarWidth(parseInt(savedWidth));
      if (savedCollapsed) setIsLeftSidebarCollapsed(savedCollapsed === "true");
    }
  }, [user]);

  // Load channels
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const response = await fetch("/api/channels", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setChannels(data.channels || []);
        }
      } catch (error) {
        console.error("Failed to load channels:", error);
      }
    };
    loadChannels();
  }, []);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoadingConversations(true);
        const response = await fetch("/api/conversations", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setIsLoadingConversations(false);
      }
    };
    loadConversations();
  }, [params?.conversationId]); // Recarrega quando a URL muda

  // Handle URL params and select conversation
  useEffect(() => {
    if (params?.conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === params.conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    } else if (!selectedConversation && conversations.length > 0 && !match) {
      // Auto-select first conversation only if not on specific URL
      const firstConv = conversations[0];
      const channel = channels.find(ch => ch.id === firstConv.channelId);
      if (channel?.slug) {
        navigate(`/conversation/${channel.slug}/${firstConv.id}`);
      }
    }
  }, [params, conversations, channels, match, navigate]);

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) return;
      
      try {
        setIsLoadingMessages(true);
        const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    loadMessages();
  }, [selectedConversation]);

  const filteredConversations = conversations.filter(
    (conv) => {
      const matchesSearch = conv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.protocol.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTab = 
        (activeTab === "pending" && conv.status === "pending") ||
        (activeTab === "open" && conv.status === "open") ||
        (activeTab === "closed" && conv.status === "closed");
      
      return matchesSearch && matchesTab;
    }
  );

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    const channel = channels.find(ch => ch.id === conversation.channelId);
    if (channel?.slug) {
      navigate(`/conversation/${channel.slug}/${conversation.id}`);
    } else {
      setSelectedConversation(conversation);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || isSendingMessage) return;

    try {
      setIsSendingMessage(true);
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: messageInput,
          contentType: "text",
          quotedMessageId: replyToMessage?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
        setMessageInput("");
        setReplyToMessage(null);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar mensagem",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  // React to message
  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        // Reload messages to get updated reactions
        if (selectedConversation) {
          const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            setMessages(data.messages || []);
          }
        }
      }
    } catch (error) {
      console.error("Failed to react:", error);
    }
  };

  // Open forward modal
  const handleForward = (messageId: string) => {
    setForwardMessageId(messageId);
    setForwardModalOpen(true);
  };

  const copyProtocol = () => {
    if (selectedConversation) {
      navigator.clipboard.writeText(selectedConversation.protocol);
      setCopiedProtocol(true);
      toast({
        title: "Protocolo copiado",
        description: selectedConversation.protocol,
      });
      setTimeout(() => setCopiedProtocol(false), 2000);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "";
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "";
    
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }).format(dateObj);
  };

  const getChannelIcon = () => {
    if (!selectedConversation?.channelId) return MessageSquare;
    const channel = channels.find(ch => ch.id === selectedConversation.channelId);
    return channel ? channelIcons[channel.type] || MessageSquare : MessageSquare;
  };
  
  const ChannelIcon = getChannelIcon();

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = Math.min(Math.max(e.clientX - 256, 240), 600); // 256 = sidebar width, min 240px, max 600px
    setLeftSidebarWidth(newWidth);
  };

  const handleMouseUp = async () => {
    if (isResizing) {
      setIsResizing(false);
      localStorage.setItem("conversationsSidebarWidth", leftSidebarWidth.toString());
      
      // Save to database if user is logged in
      if (user) {
        try {
          const response = await fetch("/api/users/preferences", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ 
              conversationsSidebarWidth: leftSidebarWidth 
            }),
          });
          if (!response.ok) {
            console.error("Failed to save sidebar width, status:", response.status);
          }
        } catch (error) {
          console.error("Failed to save sidebar width:", error);
        }
      }
    }
  };

  // Add/remove event listeners for resizing
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, leftSidebarWidth]);

  return (
    <Layout>
      <TooltipProvider>
        <div className="h-[calc(100vh-4rem)] flex -m-6">
          {/* Left Sidebar - Conversations List */}
          <div 
            className={cn(
              "flex flex-col bg-card/30 border-r border-border/40 overflow-hidden relative",
              isLeftSidebarCollapsed ? "w-16" : ""
            )}
            style={{ width: isLeftSidebarCollapsed ? undefined : `${leftSidebarWidth}px` }}
          >
            {/* Resize Handle */}
            {!isLeftSidebarCollapsed && (
              <div
                onMouseDown={handleMouseDown}
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10 group"
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            <div className="h-[60px] px-4 border-b border-border/40 flex items-center justify-between">
              {!isLeftSidebarCollapsed && <h2 className="text-lg font-semibold">Conversas</h2>}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      const newState = !isLeftSidebarCollapsed;
                      setIsLeftSidebarCollapsed(newState);
                      localStorage.setItem("conversationsSidebarCollapsed", newState.toString());
                      
                      if (user) {
                        try {
                          const response = await fetch("/api/users/preferences", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ conversationsSidebarCollapsed: newState }),
                          });
                          if (!response.ok) {
                            console.error("Failed to save sidebar state, status:", response.status);
                          }
                        } catch (error) {
                          console.error("Failed to save sidebar state:", error);
                        }
                      }
                    }}
                    className={cn("h-8 w-8", isLeftSidebarCollapsed && "mx-auto")}
                  >
                    {isLeftSidebarCollapsed ? (
                      <PanelLeftOpen className="h-4 w-4" />
                    ) : (
                      <PanelLeftClose className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{isLeftSidebarCollapsed ? "Expandir" : "Colapsar"} sidebar</p>
                </TooltipContent>
              </Tooltip>
            </div>
          
            {!isLeftSidebarCollapsed ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="w-full grid grid-cols-3 rounded-none border-b border-border/40 bg-transparent h-12">
                  <TabsTrigger 
                    value="pending" 
                    className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  >
                    Pendentes
                  </TabsTrigger>
                  <TabsTrigger 
                    value="open" 
                    className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  >
                    Atendendo
                  </TabsTrigger>
                  <TabsTrigger 
                    value="closed" 
                    className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  >
                    Fechadas
                  </TabsTrigger>
                </TabsList>

                <div className="p-3 border-b border-border/40">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar conversa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-secondary/50 border-border/50"
                      data-testid="input-search-conversations"
                    />
                  </div>
                </div>

                <TabsContent value={activeTab} className="flex-1 m-0 overflow-hidden h-0">
                  <ScrollArea className="h-full overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => handleSelectConversation(conversation)}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-all hover-elevate",
                            selectedConversation?.id === conversation.id
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-secondary/50"
                          )}
                          data-testid={`conversation-item-${conversation.id}`}
                        >
                          <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border border-border/50">
                      <AvatarFallback className="bg-secondary text-xs">
                        {conversation.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">
                          {conversation.clientName}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(conversation.lastMessageAt!)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conversation.lastMessage}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={cn("text-xs", statusColors[conversation.status])}>
                          {conversation.status === "open" ? "Aberto" : conversation.status === "pending" ? "Pendente" : "Fechado"}
                        </Badge>
                      </div>
                    </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex-1 overflow-y-auto py-2">
                {filteredConversations.map((conversation) => {
                  const channel = channels.find(ch => ch.id === conversation.channelId);
                  const ChannelIcon = channel ? channelIcons[channel.type] || MessageSquare : MessageSquare;
                  return (
                    <Tooltip key={conversation.id}>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => handleSelectConversation(conversation)}
                          className={cn(
                            "p-2 cursor-pointer transition-all mx-1 my-1 rounded-lg flex items-center justify-center relative",
                            selectedConversation?.id === conversation.id
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-secondary/50"
                          )}
                        >
                          <ChannelIcon className="h-5 w-5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="space-y-1">
                          <p className="font-medium">{conversation.clientName}</p>
                          <p className="text-xs text-muted-foreground">{conversation.subject}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </div>
        {/* Center - Chat Area */}
        <div className="flex-1 flex flex-col bg-card/30 overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-[60px] px-4 border-b border-border/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border/50">
                    <AvatarFallback className="bg-secondary">
                      {selectedConversation.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedConversation.clientName}</h3>
                    <p className="text-xs text-muted-foreground">{selectedConversation.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(priorityColors[selectedConversation.priority])}>
                    {selectedConversation.priority === "urgent" ? "Urgente" : 
                     selectedConversation.priority === "high" ? "Alta" : 
                     selectedConversation.priority === "low" ? "Baixa" : "Normal"}
                  </Badge>
                  <Badge variant="outline" className={cn(statusColors[selectedConversation.status])}>
                    {selectedConversation.status === "open" ? "Aberto" : 
                     selectedConversation.status === "pending" ? "Pendente" : "Fechado"}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                    data-testid="button-toggle-details"
                  >
                    {isRightSidebarOpen ? (
                      <PanelRightClose className="h-4 w-4" />
                    ) : (
                      <PanelRightOpen className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4 overflow-y-auto" data-testid="messages-area">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Nenhuma mensagem ainda
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.senderType === "attendant";
                      const avatar = (
                        <Avatar className="h-8 w-8 border border-border/50">
                          <AvatarFallback className={cn(
                            "text-xs",
                            isOwn ? "bg-primary/20 text-primary" : "bg-secondary"
                          )}>
                            {isOwn ? "SP" : message.senderName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      );

                      // Parse metadata if it's a string
                      let metadata = message.metadata;
                      let reactions = [];
                      try {
                        if (typeof message.metadata === 'string') {
                          const parsed = JSON.parse(message.metadata);
                          reactions = parsed.reactions || [];
                          metadata = parsed;
                        }
                      } catch (e) {
                        metadata = message.metadata;
                      }

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-3 group relative",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                          onMouseEnter={() => setHoveredMessageId(message.id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                          data-testid={`message-${message.id}`}
                        >
                          {!isOwn && avatar}
                          
                          <div className="flex flex-col gap-2 max-w-[70%]">
                            {/* Action buttons */}
                            {hoveredMessageId === message.id && (
                              <div className={cn(
                                "flex gap-1 mb-1",
                                isOwn ? "justify-end" : "justify-start"
                              )}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2"
                                  onClick={() => setReplyToMessage(message)}
                                >
                                  <Reply className="h-3 w-3 mr-1" />
                                  Responder
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2"
                                  onClick={() => handleForward(message.id)}
                                >
                                  <Forward className="h-3 w-3 mr-1" />
                                  Encaminhar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2"
                                  onClick={() => handleReact(message.id, "👍")}
                                >
                                  <Smile className="h-3 w-3 mr-1" />
                                  Reagir
                                </Button>
                              </div>
                            )}

                            <MessageWrapper
                              isOwn={isOwn}
                              isPrivate={message.isPrivate}
                              isForwarded={message.isForwarded}
                              quotedMessage={message.quotedMessage}
                              reactions={reactions}
                              timestamp={formatTime(new Date(message.createdAt))}
                              status={message.status as 'sent' | 'delivered' | 'read'}
                              onReply={() => setReplyToMessage(message)}
                              onForward={() => {
                                setForwardMessageId(message.id);
                                setForwardModalOpen(true);
                              }}
                              onReact={() => {
                                toast({
                                  title: "Em breve",
                                  description: "Funcionalidade de reações será implementada em breve.",
                                });
                              }}
                              onMore={() => {
                                toast({
                                  title: "Mais opções",
                                  description: "Menu de opções da mensagem.",
                                });
                              }}
                            >
                              {message.contentType === 'image' && (
                                <ImageMessage
                                  src={message.fileUrl || ''}
                                  caption={metadata?.caption}
                                />
                              )}
                              {message.contentType === 'video' && (
                                <VideoMessage
                                  src={message.fileUrl || ''}
                                  thumbnail={message.thumbnail || undefined}
                                  duration={message.duration || undefined}
                                  caption={metadata?.caption}
                                />
                              )}
                              {message.contentType === 'audio' && (
                                <AudioMessage
                                  src={message.fileUrl || ''}
                                  duration={message.duration || 0}
                                />
                              )}
                              {message.contentType === 'music' && metadata && (
                                <MusicMessage
                                  src={message.fileUrl || ''}
                                  metadata={metadata}
                                />
                              )}
                              {message.contentType === 'contact' && metadata && (
                                <ContactMessage metadata={metadata} />
                              )}
                              {message.contentType === 'text' && (
                                <p className="text-sm">{message.content}</p>
                              )}
                            </MessageWrapper>
                          </div>

                          {isOwn && avatar}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border/40">
                {replyToMessage && (
                  <div className="mb-3 p-2 bg-secondary/50 rounded-lg flex items-start gap-2">
                    <Reply className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary">{replyToMessage.senderName}</p>
                      <p className="text-xs text-muted-foreground truncate">{replyToMessage.content}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => setReplyToMessage(null)}
                    >
                      ✕
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 bg-secondary/50 border-border/50"
                    data-testid="input-message"
                    disabled={isSendingMessage}
                  />
                  <Button 
                    size="icon" 
                    className="bg-primary" 
                    data-testid="button-send-message"
                    onClick={handleSendMessage}
                    disabled={isSendingMessage || !messageInput.trim()}
                  >
                    {isSendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma conversa para visualizar</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Conversation Info */}
        {isRightSidebarOpen && (
          <div className="w-80 flex flex-col bg-card/30 border-l border-border/40 overflow-hidden">
            <div className="h-[60px] px-4 border-b border-border/40 flex items-center">
              <h2 className="text-lg font-semibold">Detalhes da Conversa</h2>
            </div>
            {selectedConversation ? (
              <ScrollArea className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                {/* Protocol and Channel Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2.5 bg-secondary/50 rounded-lg">
                    <code className="flex-1 text-sm font-mono text-foreground" data-testid="text-protocol-value">
                      {selectedConversation.protocol}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={copyProtocol}
                      className="h-7 w-7"
                      data-testid="button-copy-protocol"
                    >
                      {copiedProtocol ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-secondary/50 rounded-lg" data-testid="info-channel">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <ChannelIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium" data-testid="text-channel-label">
                      {(() => {
                        const channel = channels.find(ch => ch.id === selectedConversation.channelId);
                        return channel ? channelLabels[channel.type] || channel.name : 'Canal não identificado';
                      })()}
                    </span>
                  </div>
                </div>

                <Separator className="bg-border/40" />

                {/* Geolocation Section */}
                <div data-testid="section-geolocation">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Localização
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" data-testid="text-location-city">
                          {selectedConversation.city}, {selectedConversation.state}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid="text-location-country">
                          {selectedConversation.country}
                        </p>
                      </div>
                    </div>
                    {selectedConversation.latitude && selectedConversation.longitude && (
                      <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs font-mono text-muted-foreground truncate" data-testid="text-coordinates">
                          {selectedConversation.latitude}, {selectedConversation.longitude}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="bg-border/40" />

                {/* Attendant Section */}
                <div data-testid="section-attendant">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Atendente
                  </h4>
                  {selectedConversation.attendantId ? (
                    <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg" data-testid="info-attendant">
                      <Avatar className="h-8 w-8 border border-border/50">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          SP
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" data-testid="text-attendant-name">Suporte Nexus</p>
                        <p className="text-xs text-muted-foreground" data-testid="text-attendant-status">Online</p>
                      </div>
                      <span className="flex h-2 w-2 rounded-full bg-green-500" data-testid="status-attendant-online"></span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg text-muted-foreground" data-testid="info-attendant-empty">
                      <User className="h-4 w-4" />
                      <span className="text-sm">Não atribuído</span>
                    </div>
                  )}
                </div>

                <Separator className="bg-border/40" />

                {/* Client Contact Info */}
                <div data-testid="section-client-contact">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Contato
                  </h4>
                  <div className="space-y-1.5">
                    {selectedConversation.clientEmail && (
                      <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate" data-testid="text-client-email">{selectedConversation.clientEmail}</span>
                      </div>
                    )}
                    {selectedConversation.clientPhone && (
                      <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm" data-testid="text-client-phone">{selectedConversation.clientPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="bg-border/40" />

                {/* Previous Conversations */}
                <div data-testid="section-previous-conversations">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" />
                    Histórico
                  </h4>
                  {mockPreviousConversations.length > 0 ? (
                    <div className="space-y-1.5">
                      {mockPreviousConversations.map((prev) => (
                        <div
                          key={prev.id}
                          className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg cursor-pointer hover-elevate"
                          data-testid={`previous-conversation-${prev.id}`}
                        >
                          <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono truncate" data-testid={`text-previous-protocol-${prev.id}`}>{prev.protocol}</p>
                            <p className="text-xs text-muted-foreground" data-testid={`text-previous-date-${prev.id}`}>{prev.date}</p>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 bg-secondary/50 rounded-lg text-center" data-testid="empty-previous-conversations">
                      <p className="text-xs text-muted-foreground">Nenhum histórico</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
                <p className="text-sm text-center">Selecione uma conversa para ver os detalhes</p>
              </div>
            )}
          </div>
        )}
        </div>

        {/* Forward Modal */}
        {forwardMessageId && (
          <ForwardModal
            open={forwardModalOpen}
            onOpenChange={setForwardModalOpen}
            messageId={forwardMessageId}
            currentConversationId={selectedConversation?.id || ""}
          />
        )}
      </TooltipProvider>
    </Layout>
  );
}
