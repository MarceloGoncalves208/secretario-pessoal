'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Trash2, Bot, User, Loader2 } from 'lucide-react';
import { useChat, Message } from '@/lib/hooks/use-chat';

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={`text-xs mt-1 ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chat IA</h1>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearMessages}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>

      <Card className="flex flex-col h-[calc(100%-4rem)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Assistente Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
            {messages.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Olá! Sou seu assistente financeiro.</p>
                <p className="text-sm mt-2">
                  Posso ajudar com dúvidas sobre gestão financeira, organização e o uso do aplicativo.
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="font-medium">Experimente perguntar:</p>
                  <ul className="space-y-1">
                    <li>&quot;Como organizar minhas finanças entre empresas?&quot;</li>
                    <li>&quot;O que é matriz de saldos?&quot;</li>
                    <li>&quot;Dicas para controle de fluxo de caixa&quot;</li>
                  </ul>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            {error && (
              <div className="text-center py-2">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
