'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoriaForm } from '@/components/forms/categoria-form';
import { useCategorias } from '@/lib/hooks/use-categorias';
import type { Categoria, CategoriaFormData } from '@/types';

const tipoLabels = {
  entrada: 'Entrada',
  saida: 'Saída',
  ambos: 'Ambos',
};

const tipoColors = {
  entrada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  saida: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  ambos: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export default function CategoriasPage() {
  const { categorias, isLoading, createCategoria, updateCategoria, deleteCategoria } = useCategorias();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | undefined>();
  const [deletingCategoria, setDeletingCategoria] = useState<Categoria | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCategorias = categorias.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditingCategoria(undefined);
    setModalOpen(true);
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setModalOpen(true);
  };

  const handleDeleteClick = (categoria: Categoria) => {
    setDeletingCategoria(categoria);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (data: CategoriaFormData) => {
    setIsSubmitting(true);
    try {
      if (editingCategoria) {
        await updateCategoria(editingCategoria.id, data);
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await createCategoria(data);
        toast.success('Categoria criada com sucesso!');
      }
      setModalOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar categoria';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategoria) return;

    try {
      await deleteCategoria(deletingCategoria.id);
      toast.success('Categoria excluída com sucesso!');
      setDeleteDialogOpen(false);
      setDeletingCategoria(undefined);
    } catch {
      toast.error('Erro ao excluir categoria. Verifique se não há transações vinculadas.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Categorias de Transação</CardTitle>
            <span className="text-sm text-muted-foreground">
              {categorias.length} categorias
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar categoria..."
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
          ) : filteredCategorias.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {search
                ? 'Nenhuma categoria encontrada.'
                : 'Nenhuma categoria cadastrada ainda.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cor</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategorias.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell>
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: categoria.cor }}
                        title={categoria.cor}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{categoria.nome}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          tipoColors[categoria.tipo]
                        }`}
                      >
                        {tipoLabels[categoria.tipo]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(categoria)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(categoria)}
                        >
                          <Trash2 className="h-4 w-4" />
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
              {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <CategoriaForm
            categoria={editingCategoria}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria &quot;{deletingCategoria?.nome}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
