import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

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

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'API key não configurada' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build conversation history for Gemini
    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history,
      systemInstruction: SYSTEM_PROMPT,
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const content = response.text();

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar mensagem' },
      { status: 500 }
    );
  }
}
