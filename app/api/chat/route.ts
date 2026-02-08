import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Você é um assistente financeiro pessoal inteligente e amigável.
Você ajuda o usuário a gerenciar suas finanças entre múltiplas empresas.

Suas capacidades incluem:
- Responder perguntas sobre gestão financeira
- Dar dicas de organização financeira
- Ajudar a entender conceitos de fluxo de caixa
- Sugerir boas práticas para controle de despesas e receitas
- Auxiliar com dúvidas sobre o aplicativo Secretário Pessoal

Seja sempre:
- Conciso e objetivo nas respostas
- Amigável e profissional
- Focado em soluções práticas
- Responda sempre em português brasileiro

Caso não tenha certeza sobre algo, seja honesto e sugira alternativas.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'API key não configurada' },
        { status: 500 }
      );
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textContent = response.content.find((block) => block.type === 'text');
    const content = textContent?.type === 'text' ? textContent.text : '';

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar mensagem' },
      { status: 500 }
    );
  }
}
