'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  const { empresasAtivas } = useEmpresas();
  const { categorias } = useCategorias();

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

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : transacao ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
