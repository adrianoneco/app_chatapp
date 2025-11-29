import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Forward, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@shared/schema";

interface ForwardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  currentConversationId: string;
}

export function ForwardModal({
  open,
  onOpenChange,
  messageId,
  currentConversationId,
}: ForwardModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);

  // Load conversations when modal opens
  useEffect(() => {
    if (open && conversations.length === 0) {
      loadConversations();
    }
  }, [open]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/conversations", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // Filter out current conversation
        setConversations(
          data.conversations.filter((c: Conversation) => c.id !== currentConversationId)
        );
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleForward = async () => {
    if (selectedIds.length === 0) return;

    try {
      setIsForwarding(true);
      const response = await fetch(`/api/messages/${messageId}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversationIds: selectedIds }),
      });

      if (response.ok) {
        onOpenChange(false);
        setSelectedIds([]);
      }
    } catch (error) {
      console.error("Failed to forward message:", error);
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Encaminhar mensagem</DialogTitle>
          <DialogDescription>
            Selecione uma ou mais conversas para encaminhar esta mensagem
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Nenhuma conversa disponível
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedIds.includes(conv.id)
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-secondary/50"
                  )}
                  onClick={() => toggleSelection(conv.id)}
                >
                  <Checkbox
                    checked={selectedIds.includes(conv.id)}
                    onCheckedChange={() => toggleSelection(conv.id)}
                  />
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {conv.clientName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{conv.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.subject || conv.protocol}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {conv.channel}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            {selectedIds.length} selecionada(s)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isForwarding}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleForward}
              disabled={selectedIds.length === 0 || isForwarding}
            >
              {isForwarding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Encaminhando...
                </>
              ) : (
                <>
                  <Forward className="h-4 w-4 mr-2" />
                  Encaminhar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
