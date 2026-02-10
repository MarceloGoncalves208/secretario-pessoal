'use client';

import { useState, useEffect, useMemo } from 'react';
import { Mic, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AudioExtractionResult, TransacaoFormData, Empresa, Categoria } from '@/types';

interface TransacaoPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extraction: AudioExtractionResult | null;
  empresas: Empresa[];
  categorias: Categoria[];
  onConfirm: (data: TransacaoFormData) => void;
  onRecordAgain: () => void;
  isLoading?: boolean;
}

export function TransacaoPreviewDialog({
  open,
  onOpenChange,
  extraction,
  empresas,
  categorias,
  onConfirm,
  onRecordAgain,
  isLoading = false,
}: TransacaoPreviewDialogProps) {
  const [formData, setFormData] = useState<TransacaoFormData>({
    tipo: 'saida',
    valor: 0,
    descricao: '',
    data: new Date().toISOString().split('T')[0],
    empresa_origem_id: undefined,
    empresa_destino_id: undefined,
    categoria_id: undefined,
  });

  // Update form when extraction changes
  useEffect(() => {
    if (!extraction) return;

    // Find empresa IDs by name
    const empresaOrigem = extraction.empresa_origem_nome
      ? empresas.find(e => e.nome.toLowerCase() === extraction.empresa_origem_nome?.toLowerCase())
      : undefined;

    const empresaDestino = extraction.empresa_destino_nome
      ? empresas.find(e => e.nome.toLowerCase() === extraction.empresa_destino_nome?.toLowerCase())
      : undefined;

    // Find categoria ID by name
    const categoria = extraction.categoria_sugerida
      ? categorias.find(c => c.nome.toLowerCase() === extraction.categoria_sugerida?.toLowerCase())
      : undefined;

    setFormData({
      tipo: extraction.tipo,
      valor: extraction.valor,
      descricao: extraction.descricao || '',
      data: extraction.data,
      empresa_origem_id: empresaOrigem?.id,
      empresa_destino_id: empresaDestino?.id,
      categoria_id: categoria?.id,
    });
  }, [extraction, empresas, categorias]);

  // Filter categories based on transaction type
  const filteredCategorias = useMemo(() => {
    return categorias.filter(c => c.tipo === 'ambos' || c.tipo === formData.tipo);
  }, [categorias, formData.tipo]);

  const handleSubmit = () => {
    onConfirm(formData);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.6) return 'Média';
    return 'Baixa';
  };

  if (!extraction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Confirmação de Transação por Voz
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original transcription */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Você disse:</p>
            <p className="text-sm font-medium">&quot;{extraction.texto_original}&quot;</p>
          </div>

          {/* Confidence indicator */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Confiança:</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${getConfidenceColor(extraction.confianca)} transition-all`}
                style={{ width: `${extraction.confianca * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {getConfidenceLabel(extraction.confianca)} ({Math.round(extraction.confianca * 100)}%)
            </span>
          </div>

          {extraction.confianca < 0.7 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Revise os campos abaixo - alguns dados podem estar incorretos.
              </p>
            </div>
          )}

          {/* Editable fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value as 'entrada' | 'saida' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (Receita)</SelectItem>
                  <SelectItem value="saida">Saída (Despesa)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
            />
          </div>

          {/* Empresa fields - simplified for individual transactions */}
          <div className="space-y-2">
            <Label>
              {formData.tipo === 'entrada' ? 'Empresa que recebeu' : 'Empresa que pagou'}
            </Label>
            <Select
              value={
                formData.tipo === 'entrada'
                  ? formData.empresa_destino_id || 'none'
                  : formData.empresa_origem_id || 'none'
              }
              onValueChange={(value) => {
                if (formData.tipo === 'entrada') {
                  setFormData({
                    ...formData,
                    empresa_destino_id: value === 'none' ? undefined : value,
                    empresa_origem_id: undefined,
                  });
                } else {
                  setFormData({
                    ...formData,
                    empresa_origem_id: value === 'none' ? undefined : value,
                    empresa_destino_id: undefined,
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {empresas.filter(e => e.ativa).map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.tipo === 'entrada'
                ? 'Receita própria da empresa selecionada'
                : 'Despesa própria da empresa selecionada'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={formData.categoria_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, categoria_id: value === 'none' ? undefined : value })}
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
            <Label>Descrição</Label>
            <Textarea
              value={formData.descricao || ''}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição da transação"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onRecordAgain} disabled={isLoading}>
            <Mic className="h-4 w-4 mr-2" />
            Gravar Novamente
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || formData.valor <= 0}>
            <Check className="h-4 w-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
