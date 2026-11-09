import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ROTULOS = {
  AGUARDANDO: 'Aguardando morador',
  AUTORIZADO: 'Autorizado',
  PRESENTE: 'No condomínio',
  FINALIZADO: 'Saiu',
  CANCELADO: 'Recusado / cancelado',
};

const VIA = {
  PRE_AUTORIZACAO: 'pré-autorizado pelo morador',
  APP: 'confirmado pelo morador no app',
  INTERFONE: 'confirmado por interfone',
};

export function VisitaStatus({ status, via }) {
  return (
    <div>
      <Badge
        className={cn(
          'rounded-full border-0 text-[11px]',
          status === 'AGUARDANDO' && 'bg-warning/15 text-warning-foreground',
          status === 'AUTORIZADO' && 'bg-primary/15 text-primary',
          status === 'PRESENTE' && 'bg-success/15 text-success',
          ['FINALIZADO', 'CANCELADO'].includes(status) && 'bg-muted text-muted-foreground',
        )}
      >
        {ROTULOS[status] ?? status}
      </Badge>
      {via && status !== 'CANCELADO' && (
        <p className="mt-1 text-[11px] text-muted-foreground">{VIA[via]}</p>
      )}
    </div>
  );
}

export const formatarDataHora = (iso) =>
  iso
    ? new Date(iso).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
