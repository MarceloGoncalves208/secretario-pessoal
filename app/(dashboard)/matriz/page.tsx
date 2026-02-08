'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSaldos } from '@/lib/hooks/use-saldos';
import { useEmpresas } from '@/lib/hooks/use-empresas';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function MatrizPage() {
  const { saldos, matrix, totaisPorEmpresa, isLoading: loadingSaldos } = useSaldos();
  const { empresasAtivas, isLoading: loadingEmpresas } = useEmpresas();

  const isLoading = loadingSaldos || loadingEmpresas;

  // Filter saldos with non-zero values for the list view
  const saldosNaoZerados = saldos.filter((s) => s.saldo !== 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Matriz de Saldos</h1>
        <p className="text-muted-foreground">
          Visualize quem deve para quem entre suas empresas
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : empresasAtivas.length < 2 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground text-center">
              Cadastre pelo menos 2 empresas ativas e registre transações entre elas
              para visualizar a matriz de saldos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary per Company */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(totaisPorEmpresa).map(([id, totais]) => (
              <Card key={id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{totais.nome}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        A Receber
                      </span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(totais.aReceber)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        A Pagar
                      </span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(totais.aPagar)}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Saldo</span>
                      <span className={`font-bold ${totais.aReceber - totais.aPagar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(totais.aReceber - totais.aPagar)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Balance List */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento de Saldos</CardTitle>
            </CardHeader>
            <CardContent>
              {saldosNaoZerados.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Todas as contas estão zeradas.
                </p>
              ) : (
                <div className="space-y-3">
                  {saldosNaoZerados.map((saldo, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {saldo.saldo > 0 ? saldo.destino_nome : saldo.origem_nome}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {saldo.saldo > 0 ? saldo.origem_nome : saldo.destino_nome}
                        </span>
                      </div>
                      <span className="font-bold text-red-600">
                        {formatCurrency(Math.abs(saldo.saldo))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Matrix Table */}
          {matrix.empresas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Matriz Completa</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2 border-b font-medium">De / Para</th>
                      {matrix.empresas.map((e) => (
                        <th key={e.id} className="text-center p-2 border-b font-medium">
                          {e.nome}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.empresas.map((origem) => (
                      <tr key={origem.id}>
                        <td className="p-2 border-b font-medium">{origem.nome}</td>
                        {matrix.empresas.map((destino) => {
                          const valor = matrix.matrix[origem.id]?.[destino.id] || 0;
                          const isZero = valor === 0;
                          const isSelf = origem.id === destino.id;

                          return (
                            <td
                              key={destino.id}
                              className={`text-center p-2 border-b ${
                                isSelf
                                  ? 'bg-muted'
                                  : valor > 0
                                  ? 'text-green-600'
                                  : valor < 0
                                  ? 'text-red-600'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {isSelf ? '-' : isZero ? '0' : formatCurrency(valor)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-4">
                  Valores positivos (verde): a linha recebe da coluna.
                  Valores negativos (vermelho): a linha deve para a coluna.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
