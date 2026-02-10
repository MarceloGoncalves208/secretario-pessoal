import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AudioExtractionResult } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

interface ExtractRequest {
  transcription: string;
  empresas: Array<{ id: string; nome: string }>;
  categorias: Array<{ id: string; nome: string; tipo: 'entrada' | 'saida' | 'ambos' }>;
}

export async function POST(request: NextRequest) {
  try {
    const { transcription, empresas, categorias }: ExtractRequest = await request.json();

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'API key não configurada' },
        { status: 500 }
      );
    }

    if (!transcription || transcription.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcrição vazia' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const today = new Date().toISOString().split('T')[0];
    const empresasList = empresas.map(e => e.nome).join(', ') || 'Nenhuma empresa cadastrada';
    const categoriasList = categorias.map(c => `${c.nome} (${c.tipo})`).join(', ') || 'Nenhuma categoria cadastrada';

    const prompt = `Você é um assistente que extrai dados de transações financeiras a partir de texto falado em português brasileiro.

EMPRESAS DISPONÍVEIS: ${empresasList}
CATEGORIAS DISPONÍVEIS: ${categoriasList}
DATA DE HOJE: ${today}

TEXTO TRANSCRITO: "${transcription}"

REGRAS DE EXTRAÇÃO:

1. TIPO:
   - "entrada" para: recebimento, ganho, receita, vendeu, faturou, lucro, entrou dinheiro
   - "saida" para: pagamento, gasto, despesa, comprou, pagou, gastou, saiu dinheiro

2. VALOR:
   - Extraia o número mencionado (reais, R$, mil, etc.)
   - Converta "mil" para 1000, "cinquenta" para 50, etc.
   - Se não encontrar valor, use 0

3. EMPRESAS:
   - Uma empresa + recebimento = receita própria (preencha APENAS empresa_destino_nome)
   - Uma empresa + pagamento = despesa própria (preencha APENAS empresa_origem_nome)
   - Duas empresas = transferência (preencha ambos)
   - Se não identificar empresa, deixe null

4. DATA:
   - "hoje" = ${today}
   - "ontem" = data de ontem
   - "segunda", "terça", etc. = última ocorrência desse dia
   - Se não mencionar data, use hoje
   - Formato: YYYY-MM-DD

5. CATEGORIA:
   - Sugira da lista fornecida baseado no contexto
   - Se não conseguir identificar, deixe null

6. DESCRIÇÃO:
   - Crie uma descrição curta e clara baseada no texto
   - Exemplo: "Conta de luz", "Pagamento cliente X"

7. CONFIANÇA:
   - 0.9 a 1.0: Todas informações claras
   - 0.7 a 0.89: Algumas informações inferidas
   - 0.5 a 0.69: Muitas informações incertas
   - Abaixo de 0.5: Texto muito ambíguo

RESPONDA APENAS COM JSON VÁLIDO (sem markdown, sem código):
{
  "tipo": "entrada" ou "saida",
  "valor": número,
  "descricao": "string",
  "empresa_origem_nome": "string ou null",
  "empresa_destino_nome": "string ou null",
  "categoria_sugerida": "string ou null",
  "data": "YYYY-MM-DD",
  "confianca": número entre 0 e 1,
  "texto_original": "transcrição original"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    // Parse JSON response
    let extraction: AudioExtractionResult;
    try {
      // Remove markdown code blocks if present
      const jsonContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      extraction = JSON.parse(jsonContent);
      extraction.texto_original = transcription;
    } catch {
      console.error('Failed to parse Gemini response:', content);
      return NextResponse.json(
        { error: 'Não foi possível interpretar a transação. Tente novamente com mais detalhes.' },
        { status: 422 }
      );
    }

    // Validate extraction
    if (!extraction.tipo || (extraction.tipo !== 'entrada' && extraction.tipo !== 'saida')) {
      extraction.tipo = 'saida'; // Default to expense
      extraction.confianca = Math.min(extraction.confianca || 0.5, 0.5);
    }

    if (!extraction.valor || extraction.valor <= 0) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o valor da transação.' },
        { status: 422 }
      );
    }

    if (!extraction.data) {
      extraction.data = today;
    }

    return NextResponse.json({ extraction });
  } catch (error) {
    console.error('Extract transaction API error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar transcrição' },
      { status: 500 }
    );
  }
}
