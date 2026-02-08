'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { useEmpresas } from '@/lib/hooks/use-empresas';
import { useTransacoes } from '@/lib/hooks/use-transacoes';
import { useTarefas } from '@/lib/hooks/use-tarefas';
import {
  ArrowRightLeft,
  CheckSquare,
  DollarSign,
  Activity,
  Building2,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus
} from 'lucide-react';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClient();

  const { empresas, empresasAtivas, isLoading: loadingEmpresas } = useEmpresas();
  const { transacoes, totais, isLoading: loadingTransacoes } = useTransacoes();
  const { tarefas, stats: tarefaStats, isLoading: loadingTarefas } = useTarefas();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    }
    getUser();
  }, [supabase.auth]);

  const isLoading = loadingEmpresas || loadingTransacoes || loadingTarefas;

  const tarefasHoje = tarefas.filter((t) => {
    if (!t.data) return false;
    const today = new Date().toISOString().split('T')[0];
    return t.data === today && !t.concluida;
  });

  // Recent transactions (last 5)
  const recentTransacoes = transacoes.slice(0, 5);

  // Check if user has data
  const hasEmpresas = empresas.length > 0;
  const hasTransacoes = transacoes.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Olá{userEmail ? `, ${userEmail.split('@')[0]}` : ''}!
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu Secretário Pessoal
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${totais.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totais.saldo)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasTransacoes ? `${transacoes.length} transações` : 'Sem transações'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Hoje</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{tarefasHoje.length}</div>
                <p className="text-xs text-muted-foreground">
                  {tarefaStats.pendentes} pendentes no total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{empresasAtivas.length}</div>
                <p className="text-xs text-muted-foreground">
                  de {empresas.length} cadastradas
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Online</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Supabase conectado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income/Expense Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totais.entradas)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totais.saidas)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Onboarding or Recent Activity */}
      {!hasEmpresas ? (
        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Cadastre suas empresas em <Link href="/empresas" className="text-primary hover:underline font-medium">Empresas</Link></li>
              <li>Crie categorias de transação em <Link href="/categorias" className="text-primary hover:underline font-medium">Categorias</Link></li>
              <li>Registre sua primeira transação em <Link href="/transacoes" className="text-primary hover:underline font-medium">Transações</Link></li>
              <li>Visualize a matriz de saldos em <Link href="/matriz" className="text-primary hover:underline font-medium">Matriz de Saldos</Link></li>
            </ol>
            <div className="mt-4">
              <Button asChild>
                <Link href="/empresas">
                  <Plus className="h-4 w-4 mr-2" />
                  Começar Cadastrando Empresas
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Transações Recentes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/transacoes">Ver todas</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentTransacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma transação ainda.</p>
              ) : (
                <div className="space-y-2">
                  {recentTransacoes.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{t.descricao || 'Sem descrição'}</span>
                        <p className="text-xs text-muted-foreground">
                          {t.empresa_origem?.nome || '-'} → {t.empresa_destino?.nome || '-'}
                        </p>
                      </div>
                      <span className={t.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                        {t.tipo === 'entrada' ? '+' : '-'}{formatCurrency(t.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Tarefas Pendentes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/agenda">Ver todas</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {tarefaStats.pendentes === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente.</p>
              ) : (
                <div className="space-y-2">
                  {tarefas.filter(t => !t.concluida).slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span>{t.titulo}</span>
                      {t.data && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Intl.DateTimeFormat('pt-BR').format(new Date(t.data + 'T00:00:00'))}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
