'use client';

import { BarChart3, CalendarClock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/condo/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatarData, useCondo } from '@/lib/condo-store';
import { cn } from '@/lib/utils';
export default function Enquetes() {
  const { estado, votar } = useCondo();
  return (
    <AppLayout
      titulo="Enquetes e Votações"
      subtitulo="Participe das decisões da comunidade e acompanhe os resultados em tempo real"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {estado.enquetes.map((enquete) => {
          const total = enquete.opcoes.reduce((soma, o) => soma + o.votos, 0);
          return (
            <Card key={enquete.id} className="rounded-2xl border-border/70 shadow-soft">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base leading-snug">{enquete.pergunta}</CardTitle>
                  <Badge variant="secondary" className="shrink-0 rounded-lg">
                    <BarChart3 className="h-3.5 w-3.5" /> {total} votos
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{enquete.descricao}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Votação aberta até {formatarData(enquete.encerraEm)}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {enquete.opcoes.map((opcao) => {
                  const percentual = total > 0 ? Math.round((opcao.votos / total) * 100) : 0;
                  const escolhida = enquete.votoDoUsuario === opcao.id;
                  return (
                    <button
                      key={opcao.id}
                      type="button"
                      onClick={() => {
                        votar(enquete.id, opcao.id);
                        toast.success(`Voto registrado: ${opcao.texto}`);
                      }}
                      className={cn(
                        'w-full rounded-xl border p-3 text-left transition-all hover:border-primary/60 hover:shadow-soft',
                        escolhida ? 'border-primary bg-primary/5' : 'border-border/70',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3 text-sm font-medium">
                        <span className="flex items-center gap-2">
                          {escolhida && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          {opcao.texto}
                        </span>
                        <span className="text-muted-foreground">
                          {percentual}% · {opcao.votos}
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
                {enquete.votoDoUsuario && (
                  <p className="text-xs text-muted-foreground">
                    Seu voto foi computado. Você pode alterá-lo até o encerramento da votação.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}
