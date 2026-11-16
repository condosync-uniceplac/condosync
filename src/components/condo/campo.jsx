'use client';

/**
 * Peças comuns dos formulários do painel:
 * - Campo: rótulo (com * quando obrigatório), o controle, e a dica ou o erro logo abaixo;
 * - LegendaObrigatorio: a legenda "* campo obrigatório";
 * - Sugestoes: botões de preenchimento rápido (o usuário clica em vez de digitar);
 * - Contador: número com botões − e + (capacidade, convidados).
 * E a função `faltando`, que confere os obrigatórios antes de enviar, e o hook `useErros`,
 * que some com o erro de um campo assim que a pessoa altera o valor dele.
 */

import { Minus, Plus } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Mensagem padrão de campo obrigatório vazio.
export const MSG_OBRIGATORIO = 'Campo obrigatório.';

/**
 * Devolve { campo: mensagem } para cada obrigatório vazio.
 * `obrigatorios` = lista de nomes de campos do objeto `form`.
 */
export function faltando(form, obrigatorios) {
  const erros = {};
  for (const campo of obrigatorios) {
    const v = form[campo];
    if (v === undefined || v === null || String(v).trim() === '') erros[campo] = MSG_OBRIGATORIO;
  }
  return erros;
}

/**
 * Erros por campo de um formulário. Guarda os valores do momento em que o erro apareceu;
 * quando o valor de um campo muda, o erro dele deixa de ser mostrado.
 * Uso: const [erros, setErros] = useErros(form);
 */
export function useErros(form) {
  const atual = useRef(form);
  atual.current = form;
  const [estado, setEstado] = useState({ erros: {}, base: {} });
  const setErros = useCallback(
    (erros) => setEstado({ erros: erros ?? {}, base: atual.current }),
    [],
  );
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const erros = Object.fromEntries(
    Object.entries(estado.erros).filter(([k]) => igual(form?.[k], estado.base?.[k])),
  );
  return [erros, setErros];
}

/** Rótulo + controle + dica/erro. Com erro, a borda do controle fica vermelha. */
export function Campo({ id, label, obrigatorio, erro, dica, className, children }) {
  const idMsg = `${id}-msg`;
  return (
    <div
      className={cn(
        'space-y-1.5',
        // Pinta de vermelho a borda do input/select/textarea dentro do campo.
        erro &&
          '[&_input]:border-destructive [&_select]:border-destructive [&_textarea]:border-destructive',
        className,
      )}
      aria-describedby={erro || dica ? idMsg : undefined}
    >
      <Label htmlFor={id}>
        {label}
        {obrigatorio && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
        {obrigatorio && <span className="sr-only"> (obrigatório)</span>}
      </Label>
      {children}
      {erro ? (
        <p id={idMsg} role="alert" className="text-xs font-medium text-destructive">
          {erro}
        </p>
      ) : (
        dica && (
          <p id={idMsg} className="text-xs text-muted-foreground">
            {dica}
          </p>
        )
      )}
    </div>
  );
}

/** Legenda exibida no topo de cada formulário. */
export function LegendaObrigatorio({ className }) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      Campos com <span className="font-bold text-destructive">*</span> são obrigatórios.
    </p>
  );
}

/** Botões de preenchimento rápido. `itens` = textos ou { rotulo, valor }. */
export function Sugestoes({ itens, onEscolher, ativo, rotulo = 'Sugestões:' }) {
  if (!itens?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground">{rotulo}</span>
      {itens.map((item) => {
        const { rotulo: texto, valor } =
          typeof item === 'string' ? { rotulo: item, valor: item } : item;
        return (
          <button
            key={texto}
            type="button"
            onClick={() => onEscolher(valor)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
              ativo === texto
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-foreground hover:border-primary hover:text-primary',
            )}
          >
            {texto}
          </button>
        );
      })}
    </div>
  );
}

/** Número com botões − e + (sem precisar digitar). Ainda aceita digitar. */
export function Contador({ id, valor, onChange, min = 0, max = 9999, passo = 1 }) {
  const n = Number(valor) || 0;
  const mudar = (v) => onChange(String(Math.min(max, Math.max(min, v))));
  return (
    <div className="flex h-11 items-center overflow-hidden rounded-xl border border-input bg-background">
      <button
        type="button"
        aria-label="Diminuir"
        onClick={() => mudar(n - passo)}
        disabled={n <= min}
        className="flex h-full w-11 items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-w-0 flex-1 border-x border-input bg-transparent text-center text-sm focus-visible:outline-none"
      />
      <button
        type="button"
        aria-label="Aumentar"
        onClick={() => mudar(n + passo)}
        disabled={n >= max}
        className="flex h-full w-11 items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
