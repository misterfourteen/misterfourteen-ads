import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  MessageCircle, X, Send, Loader2, Bot, User, Minimize2, Maximize2
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  "¿Cómo completo mi Brand Brain?",
  "¿Cómo conecto mi cuenta de Meta?",
  "¿Cómo funciona el A/B testing?",
  "¿Cuál es el límite de mi plan?",
];

export default function SupportChat() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "¡Hola! Soy el asistente de Mister Fourteen. Estoy aquí para ayudarte con la plataforma, tus campañas y cualquier duda sobre Meta Ads. ¿En qué puedo ayudarte?",
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = trpc.support.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      }]);
    },
    onError: () => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "Lo siento, tuve un problema al procesar tu mensaje. Por favor intenta de nuevo.",
        timestamp: new Date(),
      }]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isAuthenticated) return null;

  function handleSend(text?: string) {
    const msg = text ?? input.trim();
    if (!msg || sendMessage.isPending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: msg,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    const history = messages.slice(-6).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    sendMessage.mutate({ message: msg, history });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-brand text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Abrir chat de soporte"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-background" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-80 bg-card border border-border rounded-2xl shadow-2xl flex flex-col transition-all ${isMinimized ? "h-14" : "h-[480px]"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border rounded-t-2xl bg-secondary/30 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Soporte M14</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span className="text-[10px] text-muted-foreground">En línea</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs ${msg.role === "assistant" ? "gradient-brand" : "bg-secondary"}`}>
                      {msg.role === "assistant" ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-secondary text-foreground rounded-tl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {sendMessage.isPending && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full gradient-brand flex-shrink-0 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick questions */}
              {messages.length <= 1 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="text-[10px] bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-full px-2 py-1 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-border flex gap-2 flex-shrink-0">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu pregunta..."
                  className="resize-none text-xs bg-secondary/50 border-border min-h-0 h-9 py-2"
                  rows={1}
                />
                <Button
                  size="icon"
                  className="h-9 w-9 gradient-brand text-white border-0 flex-shrink-0"
                  disabled={!input.trim() || sendMessage.isPending}
                  onClick={() => handleSend()}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
