import { describe, expect, it } from 'vitest';
import {
  cpfSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  senhaForteSchema,
} from '@/lib/validators';

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

describe('cpfSchema — dígitos verificadores (versão 2)', () => {
  it('rejeita CPF com dígito verificador errado', () => {
    expect(cpfSchema.safeParse('529.982.247-26').success).toBe(false);
  });
});

describe('loginSchema — e-mail ou CPF (versão 2)', () => {
  it('identifica login por e-mail e normaliza para minúsculas', () => {
    expect(loginSchema.parse({ identificador: ' Morador@CondoSync.dev ', senha: 'x' })).toEqual({
      tipo: 'email',
      valor: 'morador@condosync.dev',
      senha: 'x',
    });
  });

  it('identifica login por CPF com ou sem máscara', () => {
    expect(loginSchema.parse({ identificador: '111.444.777-35', senha: 'x' }).valor).toBe(
      '11144477735',
    );
    expect(loginSchema.parse({ identificador: '11144477735', senha: 'x' }).tipo).toBe('cpf');
  });

  it('rejeita identificador que não é e-mail nem CPF válido', () => {
    expect(loginSchema.safeParse({ identificador: 'fulano', senha: 'x' }).success).toBe(false);
    expect(loginSchema.safeParse({ identificador: '111.444.777-00', senha: 'x' }).success).toBe(
      false,
    );
  });
});

describe('registerSchema (versão 2)', () => {
  const base = {
    nome: 'Maria Moradora',
    email: 'maria@exemplo.com',
    telefone: '(61) 99999-0000',
    cpf: '529.982.247-25',
    dataNascimento: '1990-05-10',
    senha: 'Condo@2026',
    perfil: 'MORADOR',
    unidadeId: 1,
    aceiteTermos: true,
    aceitePrivacidade: true,
  };

  it('não exige RG', () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it('exige unidade para morador', () => {
    const { unidadeId: _u, ...semUnidade } = base;
    expect(registerSchema.safeParse(semUnidade).success).toBe(false);
  });

  it('exige aceite dos termos', () => {
    expect(registerSchema.safeParse({ ...base, aceiteTermos: false }).success).toBe(false);
  });
});

describe('resetPasswordSchema (RF.07)', () => {
  const token = 'x'.repeat(43);

  it('aceita token e senha forte', () => {
    expect(resetPasswordSchema.safeParse({ token, senha: 'Nova@2026' }).success).toBe(true);
  });

  it('rejeita senha fraca (RN.03)', () => {
    expect(resetPasswordSchema.safeParse({ token, senha: 'fraca' }).success).toBe(false);
  });

  it('rejeita token ausente ou curto', () => {
    expect(resetPasswordSchema.safeParse({ senha: 'Nova@2026' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: 'abc', senha: 'Nova@2026' }).success).toBe(false);
  });
});
