'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmpresas } from '@/lib/hooks/use-empresas';
import { useCategorias } from '@/lib/hooks/use-categorias';
import { useSpeechRecognition } from '@/lib/hooks/use-speech-recognition';
import type { Transacao, TransacaoFormData } from '@/types';

const schema = z.object({
  tipo: z.enum(['entrada', 'saida']),
  valor: z.number().positive('Valor deve ser positivo'),
  descricao: z.string().optional(),
  data: z.string().min(1, 'Data é obrigatória'),
  empresa_origem_id: z.string().optional(),
  empresa_destino_id: z.string().optional(),
  categoria_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface TransacaoFormProps {
  transacao?: Transacao;
  onSubmit: (data: TransacaoFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TransacaoForm({ transacao, onSubmit, onCancel, isLoading }: TransacaoFormProps) {
  const { empresas, empresasAtivas } = useEmpresas();
  const { categorias } = useCategorias();
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  const {
    isSupported: isSpeechSupported,
    isRecording,
    transcript,
    interimTranscript,
    error: speechError,
    startRecording,
    stopRecording,
  } = useSpeechRecognition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: transacao?.tipo ?? 'saida',
      valor: transacao?.valor ?? 0,
      descricao: transacao?.descricao ?? '',
      data: transacao?.data ?? new Date().toISOString().split('T')[0],
      empresa_origem_id: transacao?.empresa_origem_id ?? undefined,
      empresa_destino_id: transacao?.empresa_destino_id ?? undefined,
      categoria_id: transacao?.categoria_id ?? undefined,
    },
  });

  const onFormSubmit = async (data: FormData) => {
    await onSubmit(data as TransacaoFormData);
  };

  const selectedTipo = watch('tipo');
  const selectedOrigemId = watch('empresa_origem_id');
  const selectedDestinoId = watch('empresa_destino_id');
  const selectedCategoriaId = watch('categoria_id');

  // Filter categories based on transaction type
  const filteredCategorias = categorias.filter(
    (c) => c.tipo === 'ambos' || c.tipo === selectedTipo
  );

  // Handle voice recording
  const handleMicClick = async () => {
    if (isRecording) {
      stopRecording();
      // Process the transcript when stopping
      if (transcript) {
        await processTranscription(transcript);
      }
    } else {
      startRecording();
    }
  };

  // Process transcription with AI
  const processTranscription = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessingAudio(true);
    try {
      const response = await fetch('/api/extract-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: text,
          empresas: empresas.filter(e => e.ativa).map(e => ({ id: e.id, nome: e.nome })),
          categorias: categorias.map(c => ({ id: c.id, nome: c.nome, tipo: c.tipo })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao processar transcrição');
      }

      const { extraction } = await response.json();

      // Fill form fields with extracted data
      setValue('tipo', extraction.tipo);
      setValue('valor', extraction.valor);
      setValue('data', extraction.data);
      setValue('descricao', extraction.descricao || '');

      // Find empresa IDs by name
      if (extraction.empresa_origem_nome) {
        const empresa = empresas.find(
          e => e.nome.toLowerCase() === extraction.empresa_origem_nome?.toLowerCase()
        );
        if (empresa) setValue('empresa_origem_id', empresa.id);
      }

      if (extraction.empresa_destino_nome) {
        const empresa = empresas.find(
          e => e.nome.toLowerCase() === extraction.empresa_destino_nome?.toLowerCase()
        );
        if (empresa) setValue('empresa_destino_id', empresa.id);
      }

      // Find categoria ID by name
      if (extraction.categoria_sugerida) {
        const categoria = categorias.find(
          c => c.nome.toLowerCase() === extraction.categoria_sugerida?.toLowerCase()
        );
        if (categoria) setValue('categoria_id', categoria.id);
      }

      toast.success(`Campos preenchidos! Confiança: ${Math.round(extraction.confianca * 100)}%`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao processar transcrição';
      toast.error(message);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  // Auto-process when transcript changes after recording stops
  const handleStopAndProcess = async () => {
    stopRecording();
    // Small delay to ensure transcript is updated
    setTimeout(async () => {
      if (transcript) {
        await processTranscription(transcript);
      }
    }, 100);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Voice Input Section */}
      {isSpeechSupported && !transacao && (
        <div className="p-3 bg-muted rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isRecording ? 'destructive' : 'secondary'}
              size="sm"
              onClick={isRecording ? handleStopAndProcess : handleMicClick}
              disabled={isProcessingAudio}
            >
              {isProcessingAudio ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : isRecording ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Parar
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Falar transação
                </>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">
              {isRecording ? 'Ouvindo...' : 'Diga ex: "Paguei 50 reais de luz ontem"'}
            </span>
          </div>

          {(isRecording || interimTranscript || transcript) && (
            <div className="text-sm">
              <span className="text-muted-foreground">
                {interimTranscript || transcript || 'Aguardando fala...'}
              </span>
            </div>
          )}

          {speechError && (
            <p className="text-sm text-destructive">{speechError}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo *</Label>
          <Select
            value={selectedTipo}
            onValueChange={(value) => setValue('tipo', value as 'entrada' | 'saida')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
            </SelectContent>
          </Select>
          {errors.tipo && (
            <p className="text-sm text-destructive">{errors.tipo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="data">Data *</Label>
          <Input
            id="data"
            type="date"
            {...register('data')}
          />
          {errors.data && (
            <p className="text-sm text-destructive">{errors.data.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="valor">Valor *</Label>
        <Input
          id="valor"
          type="number"
          step="0.01"
          min="0"
          {...register('valor', { valueAsNumber: true })}
          placeholder="0.00"
        />
        {errors.valor && (
          <p className="text-sm text-destructive">{errors.valor.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Origem</Label>
          <Select
            value={selectedOrigemId || 'none'}
            onValueChange={(value) => setValue('empresa_origem_id', value === 'none' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {empresasAtivas.map((empresa) => (
                <SelectItem key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Destino</Label>
          <Select
            value={selectedDestinoId || 'none'}
            onValueChange={(value) => setValue('empresa_destino_id', value === 'none' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o destino" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {empresasAtivas.map((empresa) => (
                <SelectItem key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select
          value={selectedCategoriaId || 'none'}
          onValueChange={(value) => setValue('categoria_id', value === 'none' ? undefined : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            {filteredCategorias.map((categoria) => (
              <SelectItem key={categoria.id} value={categoria.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoria.cor }}
                  />
                  {categoria.nome}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...register('descricao')}
          placeholder="Descrição opcional"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || isProcessingAudio}>
          {isLoading ? 'Salvando...' : transacao ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
