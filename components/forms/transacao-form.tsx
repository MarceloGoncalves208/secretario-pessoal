'use client';

import { useState, useCallback } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  // Modo: 'individual' (uma empresa) ou 'transferencia' (entre empresas)
  const [modo, setModo] = useState<'individual' | 'transferencia'>(() => {
    // Se editando, detecta o modo baseado nos dados existentes
    if (transacao) {
      const temOrigem = !!transacao.empresa_origem_id;
      const temDestino = !!transacao.empresa_destino_id;
      return (temOrigem && temDestino) ? 'transferencia' : 'individual';
    }
    return 'individual';
  });

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

  // Process transcription with AI
  const processTranscription = useCallback(async (text: string) => {
    if (!text.trim()) {
      toast.error('Nenhuma fala detectada');
      return;
    }

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

      console.log('Extraction result:', extraction); // Debug

      // Fill form fields with extracted data
      if (extraction.tipo) {
        setValue('tipo', extraction.tipo);
      }
      if (extraction.valor && extraction.valor > 0) {
        setValue('valor', extraction.valor);
      }
      if (extraction.data) {
        setValue('data', extraction.data);
      }
      if (extraction.descricao) {
        setValue('descricao', extraction.descricao);
      }

      // Detectar modo baseado nas empresas extraídas
      const temOrigem = !!extraction.empresa_origem_nome;
      const temDestino = !!extraction.empresa_destino_nome;

      if (temOrigem && temDestino) {
        setModo('transferencia');
      } else {
        setModo('individual');
      }

      // Find empresa IDs by name
      if (extraction.empresa_origem_nome) {
        const empresa = empresas.find(
          e => e.nome.toLowerCase().includes(extraction.empresa_origem_nome?.toLowerCase()) ||
               extraction.empresa_origem_nome?.toLowerCase().includes(e.nome.toLowerCase())
        );
        if (empresa) setValue('empresa_origem_id', empresa.id);
      }

      if (extraction.empresa_destino_nome) {
        const empresa = empresas.find(
          e => e.nome.toLowerCase().includes(extraction.empresa_destino_nome?.toLowerCase()) ||
               extraction.empresa_destino_nome?.toLowerCase().includes(e.nome.toLowerCase())
        );
        if (empresa) setValue('empresa_destino_id', empresa.id);
      }

      // Find categoria ID by name
      if (extraction.categoria_sugerida) {
        const categoria = categorias.find(
          c => c.nome.toLowerCase().includes(extraction.categoria_sugerida?.toLowerCase()) ||
               extraction.categoria_sugerida?.toLowerCase().includes(c.nome.toLowerCase())
        );
        if (categoria) setValue('categoria_id', categoria.id);
      }

      const confianca = Math.round((extraction.confianca || 0.5) * 100);
      toast.success(`Campos preenchidos! Confiança: ${confianca}%`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao processar transcrição';
      toast.error(message);
    } finally {
      setIsProcessingAudio(false);
    }
  }, [empresas, categorias, setValue]);

  const {
    isSupported: isSpeechSupported,
    isRecording,
    interimTranscript,
    transcript,
    error: speechError,
    startRecording,
    stopRecording,
  } = useSpeechRecognition({
    onTranscriptionComplete: processTranscription,
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

  // Handle mode change
  const handleModoChange = (novoModo: 'individual' | 'transferencia') => {
    setModo(novoModo);
    // Limpar empresas ao trocar modo
    if (novoModo === 'individual') {
      setValue('empresa_origem_id', undefined);
      setValue('empresa_destino_id', undefined);
    }
  };

  // Handle empresa selection in individual mode
  const handleEmpresaIndividual = (empresaId: string | undefined) => {
    if (selectedTipo === 'saida') {
      // Saída = despesa própria = empresa origem
      setValue('empresa_origem_id', empresaId);
      setValue('empresa_destino_id', undefined);
    } else {
      // Entrada = receita própria = empresa destino
      setValue('empresa_destino_id', empresaId);
      setValue('empresa_origem_id', undefined);
    }
  };

  // Get current empresa in individual mode
  const empresaIndividualId = selectedTipo === 'saida' ? selectedOrigemId : selectedDestinoId;

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
              onClick={isRecording ? stopRecording : startRecording}
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
              {isRecording ? 'Ouvindo...' : 'Ex: "Paguei 50 reais de luz da loja ontem"'}
            </span>
          </div>

          {(isRecording || interimTranscript || transcript) && (
            <div className="text-sm p-2 bg-background rounded">
              <span className="font-medium">Você disse: </span>
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

      {/* Tipo e Data */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo *</Label>
          <Select
            value={selectedTipo}
            onValueChange={(value) => {
              setValue('tipo', value as 'entrada' | 'saida');
              // Atualizar empresa ao trocar tipo no modo individual
              if (modo === 'individual' && empresaIndividualId) {
                handleEmpresaIndividual(empresaIndividualId);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada">Entrada (Receita)</SelectItem>
              <SelectItem value="saida">Saída (Despesa)</SelectItem>
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

      {/* Valor */}
      <div className="space-y-2">
        <Label htmlFor="valor">Valor (R$) *</Label>
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

      {/* Modo de Transação */}
      <div className="space-y-2">
        <Label>Tipo de Operação</Label>
        <Tabs value={modo} onValueChange={(v) => handleModoChange(v as 'individual' | 'transferencia')}>
          <TabsList className="w-full">
            <TabsTrigger value="individual" className="flex-1">
              Individual (uma empresa)
            </TabsTrigger>
            <TabsTrigger value="transferencia" className="flex-1">
              Entre Empresas
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">
          {modo === 'individual'
            ? selectedTipo === 'saida'
              ? 'Despesa própria da empresa selecionada'
              : 'Receita própria da empresa selecionada'
            : 'Transferência de recursos entre duas empresas'}
        </p>
      </div>

      {/* Empresa(s) */}
      {modo === 'individual' ? (
        <div className="space-y-2">
          <Label>
            {selectedTipo === 'saida' ? 'Empresa (quem pagou)' : 'Empresa (quem recebeu)'}
          </Label>
          <Select
            value={empresaIndividualId || 'none'}
            onValueChange={(value) => handleEmpresaIndividual(value === 'none' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a empresa" />
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
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Origem (quem paga)</Label>
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
            <Label>Destino (quem recebe)</Label>
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
      )}

      {/* Categoria */}
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

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...register('descricao')}
          placeholder="Descrição opcional"
          rows={2}
        />
      </div>

      {/* Botões */}
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
