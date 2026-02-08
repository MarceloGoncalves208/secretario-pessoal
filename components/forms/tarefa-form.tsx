'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Tarefa, TarefaFormData } from '@/types';

const schema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  data: z.string().optional(),
  hora: z.string().optional(),
});

interface TarefaFormProps {
  tarefa?: Tarefa;
  onSubmit: (data: TarefaFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TarefaForm({ tarefa, onSubmit, onCancel, isLoading }: TarefaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TarefaFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: tarefa?.titulo ?? '',
      descricao: tarefa?.descricao ?? '',
      data: tarefa?.data ?? '',
      hora: tarefa?.hora ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título *</Label>
        <Input
          id="titulo"
          {...register('titulo')}
          placeholder="O que precisa ser feito?"
        />
        {errors.titulo && (
          <p className="text-sm text-destructive">{errors.titulo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...register('descricao')}
          placeholder="Detalhes adicionais (opcional)"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data">Data</Label>
          <Input
            id="data"
            type="date"
            {...register('data')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hora">Hora</Label>
          <Input
            id="hora"
            type="time"
            {...register('hora')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : tarefa ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
