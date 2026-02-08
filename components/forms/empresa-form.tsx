'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Empresa, EmpresaFormData } from '@/types';

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
});

interface EmpresaFormProps {
  empresa?: Empresa;
  onSubmit: (data: EmpresaFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EmpresaForm({ empresa, onSubmit, onCancel, isLoading }: EmpresaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: empresa?.nome ?? '',
      descricao: empresa?.descricao ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          {...register('nome')}
          placeholder="Nome da empresa"
        />
        {errors.nome && (
          <p className="text-sm text-destructive">{errors.nome.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...register('descricao')}
          placeholder="Descrição opcional"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : empresa ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
