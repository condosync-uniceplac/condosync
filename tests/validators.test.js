import { describe, expect, it } from 'vitest';
import { cpfSchema, senhaForteSchema } from '@/lib/validators';

describe('cpfSchema', () => {
  it('aceita CPF com ou sem máscara e normaliza para 11 dígitos', () => {
    expect(cpfSchema.parse('529.982.247-25')).toBe('52998224725');
    expect(cpfSchema.parse('52998224725')).toBe('52998224725');
  });

  it('rejeita CPF com quantidade errada de dígitos', () => {
    expect(cpfSchema.safeParse('123.456.789').success).toBe(false);
  });

  it('rejeita CPF com todos os dígitos iguais', () => {
    expect(cpfSchema.safeParse('111.111.111-11').success).toBe(false);
  });
});

describe('senhaForteSchema (RN.03)', () => {
  it('aceita senha com maiúscula, minúscula, número e caractere especial', () => {
    expect(senhaForteSchema.safeParse('Condo@2026').success).toBe(true);
  });

  it.each([
    ['curta', 'Ab@1'],
    ['sem maiúscula', 'condo@2026'],
    ['sem minúscula', 'CONDO@2026'],
    ['sem número', 'Condo@Sync'],
    ['sem caractere especial', 'Condo2026x'],
  ])('rejeita senha %s', (_caso, senha) => {
    expect(senhaForteSchema.safeParse(senha).success).toBe(false);
  });
});
