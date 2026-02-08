import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function TransacoesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transações</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhuma transação cadastrada ainda.
            <br />
            <span className="text-sm">Cadastre empresas primeiro em Empresas.</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
