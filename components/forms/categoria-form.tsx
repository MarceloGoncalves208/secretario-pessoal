'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Categoria, CategoriaFormData } from '@/types';

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.enum(['entrada', 'saida', 'ambos']),
  cor: z.string().min(1, 'Cor é obrigatória'),
});

const cores = [
  { value: '#22c55e', label: 'Verde' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#eab308', label: 'Amarelo' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#a855f7', label: 'Roxo' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#6b7280', label: 'Cinza' },
];

interface CategoriaFormProps {
  categoria?: Categoria;
  onSubmit: (data: CategoriaFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CategoriaForm({ categoria, onSubmit, onCancel, isLoading }: CategoriaFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoriaFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: categoria?.nome ?? '',
      tipo: categoria?.tipo ?? 'ambos',
      cor: categoria?.cor ?? '#6b7280',
    },
  });

  const selectedCor = watch('cor');
  const selectedTipo = watch('tipo');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          {...register('nome')}
          placeholder="Nome da categoria"
        />
        {errors.nome && (
          <p className="text-sm text-destructive">{errors.nome.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tipo *</Label>
        <Select
          value={selectedTipo}
          onValueChange={(value) => setValue('tipo', value as 'entrada' | 'saida' | 'ambos')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="saida">Saída</SelectItem>
            <SelectItem value="ambos">Ambos</SelectItem>
          </SelectContent>
        </Select>
        {errors.tipo && (
          <p className="text-sm text-destructive">{errors.tipo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Cor *</Label>
        <div className="flex flex-wrap gap-2">
          {cores.map((cor) => (
            <button
              key={cor.value}
              type="button"
              onClick={() => setValue('cor', cor.value)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                selectedCor === cor.value
                  ? 'border-foreground scale-110'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: cor.value }}
              title={cor.label}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : categoria ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
