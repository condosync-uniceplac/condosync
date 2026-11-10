/**
 * Testes automatizados (Vitest) de máscaras de CPF/telefone e critérios de senha.
 * Rodam com `npm test` e em todo Pull Request (GitHub Actions).
 * describe agrupa os casos; cada it(...) é um caso de teste; expect(...) confere o resultado.
 */

import { describe, expect, it } from 'vitest';
import { formatCpf, formatTelefone } from '@/lib/masks';
import { avaliarSenha } from '@/lib/passwordRules';
import { senhaForteSchema } from '@/lib/validators';

describe('formatCpf', () => {
  it.each([
    ['529', '529'],
    ['5299', '529.9'],
    ['5299822', '529.982.2'],
    ['52998224725', '529.982.247-25'],
    ['529.982.247-25999', '529.982.247-25'],
    ['abc529', '529'],
  ])('%s -> %s', (entrada, saida) => expect(formatCpf(entrada)).toBe(saida));
});

describe('formatTelefone', () => {
  it.each([
    ['', ''],
    ['6', '(6'],
    ['61', '(61'],
    ['6199', '(61) 99'],
    ['61999990000', '(61) 99999-0000'],
    ['6133330000', '(61) 3333-0000'],
    ['(61) 99999-00001', '(61) 99999-0000'],
  ])('%s -> %s', (entrada, saida) => expect(formatTelefone(entrada)).toBe(saida));
});

describe('avaliarSenha (#27)', () => {
  it('marca cada critério atendido', () => {
    const r = Object.fromEntries(avaliarSenha('abc').map((c) => [c.id, c.ok]));
    expect(r).toEqual({
      tamanho: false,
      maiuscula: false,
      minuscula: true,
      numero: false,
      especial: false,
    });
  });

  it.each(['Condo@2026', 'fraca', 'SEMMINUSC@1', 'Sem#Numero', 'Sem1Especial'])(
    'concorda com a validação do servidor para "%s"',
    (senha) => {
      const todosOk = avaliarSenha(senha).every((c) => c.ok);
      expect(todosOk).toBe(senhaForteSchema.safeParse(senha).success);
    },
  );
});
