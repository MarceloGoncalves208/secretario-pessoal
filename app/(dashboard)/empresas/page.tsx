'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmpresaForm } from '@/components/forms/empresa-form';
import { useEmpresas } from '@/lib/hooks/use-empresas';
import type { Empresa, EmpresaFormData } from '@/types';

export default function EmpresasPage() {
  const { empresas, isLoading, createEmpresa, updateEmpresa, toggleEmpresa } = useEmpresas();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredEmpresas = empresas.filter((e) =>
    e.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditingEmpresa(undefined);
    setModalOpen(true);
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    setModalOpen(true);
  };

  const handleSubmit = async (data: EmpresaFormData) => {
    setIsSubmitting(true);
    try {
      if (editingEmpresa) {
        await updateEmpresa(editingEmpresa.id, data);
        toast.success('Empresa atualizada com sucesso!');
      } else {
        await createEmpresa(data);
        toast.success('Empresa criada com sucesso!');
      }
      setModalOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar empresa';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (empresa: Empresa) => {
    try {
      await toggleEmpresa(empresa.id, !empresa.ativa);
      toast.success(
        empresa.ativa ? 'Empresa desativada' : 'Empresa ativada'
      );
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  const ativasCount = empresas.filter((e) => e.ativa).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Empresas</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Suas Empresas</CardTitle>
            <span className="text-sm text-muted-foreground">
              {ativasCount} ativas
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredEmpresas.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {search
                ? 'Nenhuma empresa encontrada.'
                : 'Nenhuma empresa cadastrada ainda.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmpresas.map((empresa) => (
                  <TableRow
                    key={empresa.id}
                    className={!empresa.ativa ? 'opacity-50' : ''}
                  >
                    <TableCell className="font-medium">{empresa.nome}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {empresa.descricao || '-'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          empresa.ativa
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {empresa.ativa ? 'Ativa' : 'Inativa'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(empresa)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggle(empresa)}
                        >
                          {empresa.ativa ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
            </DialogTitle>
          </DialogHeader>
          <EmpresaForm
            empresa={editingEmpresa}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
