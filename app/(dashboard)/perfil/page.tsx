import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>

          <div>
            <label className="text-sm font-medium">ID</label>
            <p className="text-muted-foreground text-xs font-mono">{user?.id}</p>
          </div>

          <form action={signOut}>
            <Button type="submit" variant="destructive">
              Sair da Conta
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
