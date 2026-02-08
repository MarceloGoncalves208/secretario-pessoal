'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

export default function ChatPage() {
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Chat IA</h1>

      <Card className="h-[calc(100vh-16rem)]">
        <CardHeader>
          <CardTitle className="text-base">Conversa com Claude</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto mb-4">
            <div className="text-muted-foreground text-center py-8">
              <p>👋 Olá! Sou seu assistente.</p>
              <p className="text-sm mt-2">
                Use comandos como /p (pagamento), /t (tarefa), /s (saldos)
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
