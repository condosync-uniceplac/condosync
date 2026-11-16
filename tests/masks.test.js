/**
 * Testes automatizados (Vitest) de máscaras de CPF/telefone e critérios de senha.
 * Rodam com `npm test` e em todo Pull Request (GitHub Actions).
 * describe agrupa os casos; cada it(...) é um caso de teste; expect(...) confere o resultado.
 */

import { describe, expect, it } from 'vitest';
import {
  centavosDoTexto,
  formatCpf,
  formatMoeda,
  formatTelefone,
  proximoValorMoeda,
} from '@/lib/masks';
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

describe('campo de dinheiro estilo Pix (taxa do espaço)', () => {
  it('os dígitos entram pela direita: centavos, depois reais', () => {
    expect(centavosDoTexto('1')).toBe(1);
    expect(centavosDoTexto('R$ 0,015')).toBe(15);
    expect(centavosDoTexto('R$ 0,150')).toBe(150);
    expect(centavosDoTexto('R$ 1,500')).toBe(1500);
    expect(centavosDoTexto('R$ 15,000')).toBe(15000);
  });

  it('apagar um dígito volta uma casa', () => {
    expect(centavosDoTexto('R$ 150,0')).toBe(1500);
    expect(centavosDoTexto('R$ 0,0')).toBe(0);
  });

  it('formata em reais e limita a R$ 100.000,00', () => {
    expect(formatMoeda(0).replace(/\s/g, ' ')).toBe('R$ 0,00');
    expect(formatMoeda(123456).replace(/\s/g, ' ')).toBe('R$ 1.234,56');
    expect(centavosDoTexto('999999999')).toBe(10_000_000);
  });
});

describe('digitação no campo de dinheiro (cursor em qualquer posição)', () => {
  const digitar = (centavos, novoTexto) =>
    proximoValorMoeda(centavos, formatMoeda(centavos), novoTexto);
  it('dígito inserido no meio do texto ainda entra pela direita', () => {
    // cursor antes de ",00": "R$ 01,00" -> 1 centavo
    expect(digitar(0, formatMoeda(0).replace('0,', '01,'))).toBe(1);
    expect(digitar(1, formatMoeda(1) + '5')).toBe(15);
    expect(digitar(15, formatMoeda(15) + '0')).toBe(150);
  });
  it('apagar remove o último dígito', () => {
    expect(digitar(15000, formatMoeda(15000).slice(0, -1))).toBe(1500);
  });
  it('colar um valor', () => {
    expect(digitar(0, '150')).toBe(150);
  });
});
