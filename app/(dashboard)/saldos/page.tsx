import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SaldosPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Matriz de Saldos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Quem deve para quem</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhuma empresa cadastrada ainda.
            <br />
            <span className="text-sm">Cadastre empresas primeiro em Empresas.</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
