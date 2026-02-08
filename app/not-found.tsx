import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Página não encontrada
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
