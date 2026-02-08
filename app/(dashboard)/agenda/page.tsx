'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, Circle, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TarefaForm } from '@/components/forms/tarefa-form';
import { useTarefas } from '@/lib/hooks/use-tarefas';
import type { Tarefa, TarefaFormData } from '@/types';

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Sem data';
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function isToday(dateString: string | null): boolean {
  if (!dateString) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateString === today;
}

function isPast(dateString: string | null): boolean {
  if (!dateString) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateString < today;
}

export default function AgendaPage() {
  const { tarefas, stats, isLoading, createTarefa, updateTarefa, toggleTarefa, deleteTarefa } = useTarefas();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<Tarefa | undefined>();
  const [deletingTarefa, setDeletingTarefa] = useState<Tarefa | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pendentes');

  const tarefasHoje = tarefas.filter((t) => isToday(t.data) && !t.concluida);
  const tarefasAtrasadas = tarefas.filter((t) => isPast(t.data) && !t.concluida);
  const tarefasPendentes = tarefas.filter((t) => !t.concluida);
  const tarefasConcluidas = tarefas.filter((t) => t.concluida);

  const handleCreate = () => {
    setEditingTarefa(undefined);
    setModalOpen(true);
  };

  const handleEdit = (tarefa: Tarefa) => {
    setEditingTarefa(tarefa);
    setModalOpen(true);
  };

  const handleDeleteClick = (tarefa: Tarefa) => {
    setDeletingTarefa(tarefa);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (data: TarefaFormData) => {
    setIsSubmitting(true);
    try {
      if (editingTarefa) {
        await updateTarefa(editingTarefa.id, data);
        toast.success('Tarefa atualizada com sucesso!');
      } else {
        await createTarefa(data);
        toast.success('Tarefa criada com sucesso!');
      }
      setModalOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar tarefa';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (tarefa: Tarefa) => {
    try {
      await toggleTarefa(tarefa.id, !tarefa.concluida);
      toast.success(tarefa.concluida ? 'Tarefa reaberta' : 'Tarefa concluída!');
    } catch {
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const handleDelete = async () => {
    if (!deletingTarefa) return;

    try {
      await deleteTarefa(deletingTarefa.id);
      toast.success('Tarefa excluída com sucesso!');
      setDeleteDialogOpen(false);
      setDeletingTarefa(undefined);
    } catch {
      toast.error('Erro ao excluir tarefa.');
    }
  };

  const TarefaItem = ({ tarefa }: { tarefa: Tarefa }) => (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${
        tarefa.concluida ? 'bg-muted/50' : 'bg-background'
      } ${isPast(tarefa.data) && !tarefa.concluida ? 'border-red-200 dark:border-red-900' : ''}`}
    >
      <button
        onClick={() => handleToggle(tarefa)}
        className="mt-0.5 flex-shrink-0"
      >
        {tarefa.concluida ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-medium ${tarefa.concluida ? 'line-through text-muted-foreground' : ''}`}>
          {tarefa.titulo}
        </p>
        {tarefa.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {tarefa.descricao}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {tarefa.data && (
            <span className={`flex items-center gap-1 ${isPast(tarefa.data) && !tarefa.concluida ? 'text-red-500' : ''}`}>
              <Calendar className="h-3 w-3" />
              {formatDate(tarefa.data)}
            </span>
          )}
          {tarefa.hora && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {tarefa.hora}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleEdit(tarefa)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleDeleteClick(tarefa)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{tarefasHoje.length}</p>
              <p className="text-sm text-muted-foreground">Hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{tarefasAtrasadas.length}</p>
              <p className="text-sm text-muted-foreground">Atrasadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.pendentes}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{stats.concluidas}</p>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="pendentes">
                  Pendentes ({tarefasPendentes.length})
                </TabsTrigger>
                <TabsTrigger value="concluidas">
                  Concluídas ({tarefasConcluidas.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pendentes">
                {tarefasPendentes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma tarefa pendente. Aproveite o tempo livre!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tarefasPendentes.map((tarefa) => (
                      <TarefaItem key={tarefa.id} tarefa={tarefa} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="concluidas">
                {tarefasConcluidas.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma tarefa concluída ainda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tarefasConcluidas.map((tarefa) => (
                      <TarefaItem key={tarefa.id} tarefa={tarefa} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTarefa ? 'Editar Tarefa' : 'Nova Tarefa'}
            </DialogTitle>
          </DialogHeader>
          <TarefaForm
            tarefa={editingTarefa}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a tarefa &quot;{deletingTarefa?.titulo}&quot;?
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
