'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Filter } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TransacaoForm } from '@/components/forms/transacao-form';
import { useTransacoes } from '@/lib/hooks/use-transacoes';
import { useEmpresas } from '@/lib/hooks/use-empresas';
import type { Transacao, TransacaoFormData } from '@/types';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
}

export default function TransacoesPage() {
  const [filters, setFilters] = useState<{
    empresaOrigemId?: string;
    empresaDestinoId?: string;
    tipo?: 'entrada' | 'saida';
  }>({});

  const { transacoes, isLoading, totais, createTransacao, updateTransacao, deleteTransacao } = useTransacoes({
    empresaOrigemId: filters.empresaOrigemId,
    empresaDestinoId: filters.empresaDestinoId,
    tipo: filters.tipo,
  });
  const { empresasAtivas } = useEmpresas();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<Transacao | undefined>();
  const [deletingTransacao, setDeletingTransacao] = useState<Transacao | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTransacoes = transacoes.filter((t) =>
    t.descricao?.toLowerCase().includes(search.toLowerCase()) ||
    t.empresa_origem?.nome.toLowerCase().includes(search.toLowerCase()) ||
    t.empresa_destino?.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditingTransacao(undefined);
    setModalOpen(true);
  };

  const handleEdit = (transacao: Transacao) => {
    setEditingTransacao(transacao);
    setModalOpen(true);
  };

  const handleDeleteClick = (transacao: Transacao) => {
    setDeletingTransacao(transacao);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (data: TransacaoFormData) => {
    setIsSubmitting(true);
    try {
      if (editingTransacao) {
        await updateTransacao(editingTransacao.id, data);
        toast.success('Transação atualizada com sucesso!');
      } else {
        await createTransacao(data);
        toast.success('Transação criada com sucesso!');
      }
      setModalOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar transação';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTransacao) return;

    try {
      await deleteTransacao(deletingTransacao.id);
      toast.success('Transação excluída com sucesso!');
      setDeleteDialogOpen(false);
      setDeletingTransacao(undefined);
    } catch {
      toast.error('Erro ao excluir transação.');
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transações</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(totais.entradas)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Saídas</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(totais.saidas)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className={`text-xl font-bold ${totais.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totais.saldo)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Transações</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          {showFilters && (
            <div className="mb-4 p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select
                    value={filters.tipo || 'all'}
                    onValueChange={(value) =>
                      setFilters({ ...filters, tipo: value === 'all' ? undefined : value as 'entrada' | 'saida' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Origem</label>
                  <Select
                    value={filters.empresaOrigemId || 'all'}
                    onValueChange={(value) =>
                      setFilters({ ...filters, empresaOrigemId: value === 'all' ? undefined : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {empresasAtivas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Destino</label>
                  <Select
                    value={filters.empresaDestinoId || 'all'}
                    onValueChange={(value) =>
                      setFilters({ ...filters, empresaDestinoId: value === 'all' ? undefined : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {empresasAtivas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
            <Input
              placeholder="Buscar por descrição ou empresa..."
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
          ) : filteredTransacoes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {search || Object.keys(filters).some(k => filters[k as keyof typeof filters])
                ? 'Nenhuma transação encontrada.'
                : 'Nenhuma transação cadastrada ainda.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransacoes.map((transacao) => (
                  <TableRow key={transacao.id}>
                    <TableCell>{formatDate(transacao.data)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          transacao.tipo === 'entrada'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {transacao.descricao || '-'}
                    </TableCell>
                    <TableCell>{transacao.empresa_origem?.nome || '-'}</TableCell>
                    <TableCell>{transacao.empresa_destino?.nome || '-'}</TableCell>
                    <TableCell>
                      {transacao.categoria ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: transacao.categoria.cor }}
                          />
                          {transacao.categoria.nome}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                        {transacao.tipo === 'entrada' ? '+' : '-'} {formatCurrency(transacao.valor)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(transacao)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(transacao)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTransacao ? 'Editar Transação' : 'Nova Transação'}
            </DialogTitle>
          </DialogHeader>
          <TransacaoForm
            transacao={editingTransacao}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação de{' '}
              {deletingTransacao && formatCurrency(deletingTransacao.valor)}?
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
