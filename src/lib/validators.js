import { z } from 'zod';
import { TURNO_IDS } from './turnos';

const onlyDigits = (v) => (typeof v === 'string' ? v.replace(/\D/g, '') : v);

/** Confere os dois dígitos verificadores do CPF (algoritmo da Receita Federal). */
export function cpfDigitosValidos(cpf) {
  const d = cpf.split('').map(Number);
  const dv = (n) => {
    let soma = 0;
    for (let i = 0; i < n; i += 1) soma += d[i] * (n + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return dv(9) === d[9] && dv(10) === d[10];
}

export const cpfSchema = z.preprocess(
  onlyDigits,
  z
    .string({ error: 'CPF obrigatório.' })
    .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos.')
    .refine((v) => !/^(\d)\1{10}$/.test(v) && cpfDigitosValidos(v), 'CPF inválido.'),
);

export const senhaForteSchema = z
  .string({ error: 'Senha obrigatória.' })
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .max(72, 'A senha deve ter no máximo 72 caracteres.') // limite do bcrypt
  .regex(/[A-Z]/, 'A senha deve ter ao menos uma letra maiúscula.')
  .regex(/[a-z]/, 'A senha deve ter ao menos uma letra minúscula.')
  .regex(/\d/, 'A senha deve ter ao menos um número.')
  .regex(/[^A-Za-z0-9]/, 'A senha deve ter ao menos um caractere especial.');

const idSchema = z.coerce.number().int().positive();

// Perfis que podem se cadastrar pela tela pública (ADMIN é criado só via banco)
export const PERFIS_CADASTRO = ['MORADOR', 'PORTARIA', 'SINDICO'];

export const registerSchema = z
  .object({
    nome: z.string().trim().min(3, 'Informe o nome completo.').max(150),
    email: z.string().trim().toLowerCase().email('E-mail inválido.').max(254),
    telefone: z.preprocess(
      onlyDigits,
      z.string().regex(/^\d{10,11}$/, 'Telefone deve ter DDD + número (10 ou 11 dígitos).'),
    ),
    cpf: cpfSchema,
    dataNascimento: z.iso
      .date('Data de nascimento inválida (use AAAA-MM-DD).')
      .refine((v) => v <= new Date().toISOString().slice(0, 10), 'Data de nascimento no futuro.'),
    senha: senhaForteSchema,
    perfil: z.enum(PERFIS_CADASTRO, { error: 'Perfil inválido.' }),
    condominioId: idSchema.optional(),
    unidadeId: idSchema.optional(),
    aceiteTermos: z.literal(true, { error: 'É necessário aceitar os Termos de Uso.' }),
    aceitePrivacidade: z.literal(true, {
      error: 'É necessário aceitar a Política de Privacidade.',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.perfil === 'MORADOR' && !data.unidadeId) {
      ctx.addIssue({
        code: 'custom',
        path: ['unidadeId'],
        message: 'Morador deve informar a unidade.',
      });
    }
    if (data.perfil !== 'MORADOR' && !data.condominioId) {
      ctx.addIssue({ code: 'custom', path: ['condominioId'], message: 'Informe o condomínio.' });
    }
  });

const emailSchema = z.string().trim().toLowerCase().email().max(254);

/**
 * Login por e-mail OU CPF (com ou sem máscara).
 * Resultado: { tipo: 'email' | 'cpf', valor, senha }.
 * A mensagem de erro é genérica para não indicar qual formato falhou.
 */
export const loginSchema = z
  .object({
    identificador: z
      .string({ error: 'Informe o e-mail ou CPF.' })
      .trim()
      .min(1, 'Informe o e-mail ou CPF.')
      .max(254),
    senha: z.string().min(1, 'Informe a senha.').max(72),
  })
  .transform((data, ctx) => {
    if (data.identificador.includes('@')) {
      const email = emailSchema.safeParse(data.identificador);
      if (email.success) return { tipo: 'email', valor: email.data, senha: data.senha };
    } else {
      const cpf = cpfSchema.safeParse(data.identificador);
      if (cpf.success) return { tipo: 'cpf', valor: cpf.data, senha: data.senha };
    }
    ctx.addIssue({
      code: 'custom',
      path: ['identificador'],
      message: 'Informe um e-mail ou CPF válido.',
    });
    return z.NEVER;
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.').max(254),
});

export const resetPasswordSchema = z.object({
  token: z.string({ error: 'Link inválido.' }).min(20, 'Link inválido.').max(200, 'Link inválido.'),
  senha: senhaForteSchema,
});

export const resetTokenSchema = z.object({
  token: z.string({ error: 'Link inválido.' }).min(20, 'Link inválido.').max(200, 'Link inválido.'),
});

// RF.09 — nova reserva de área comum
export const reservaSchema = z.object({
  espacoId: z.coerce.number({ error: 'Escolha um espaço.' }).int().positive('Escolha um espaço.'),
  data: z
    .string({ error: 'Escolha a data da reserva.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Escolha a data da reserva.'),
  turno: z.enum(TURNO_IDS, { error: 'Escolha um turno.' }),
  convidados: z.coerce
    .number({ error: 'Informe o número de convidados.' })
    .int('Informe um número inteiro.')
    .min(1, 'Informe ao menos 1 convidado.'),
});

// RF.10 / RN.14 — visitantes
const placaSchema = z.preprocess(
  (v) => (typeof v === 'string' ? v.toUpperCase().replace(/[^A-Z0-9]/g, '') : v),
  z
    .string()
    .regex(/^([A-Z]{3}\d{4}|[A-Z]{3}\d[A-Z]\d{2})$/, 'Placa inválida (ex.: ABC-1234 ou ABC1D23).')
    .optional()
    .or(z.literal('').transform(() => undefined)),
);

const visitanteBase = z
  .object({
    nome: z
      .string({ error: 'Informe o nome do visitante.' })
      .trim()
      .min(3, 'Informe o nome completo do visitante.')
      .max(150, 'Nome muito longo.'),
    tipoDocumento: z.enum(['CPF', 'RG'], { error: 'Escolha o tipo de documento.' }),
    documento: z
      .string({ error: 'Informe o documento.' })
      .trim()
      .transform((v) => v.toUpperCase().replace(/[^0-9A-Z]/g, '')),
    placa: placaSchema,
  })
  .superRefine((v, ctx) => {
    if (v.tipoDocumento === 'CPF') {
      if (
        !/^\d{11}$/.test(v.documento) ||
        /^(\d)\1{10}$/.test(v.documento) ||
        !cpfDigitosValidos(v.documento)
      ) {
        ctx.addIssue({ code: 'custom', path: ['documento'], message: 'CPF inválido.' });
      }
    } else if (v.documento.length < 5 || v.documento.length > 14) {
      ctx.addIssue({ code: 'custom', path: ['documento'], message: 'RG inválido.' });
    }
  });

/** Morador pré-autoriza um visitante para a própria unidade. */
export const preAutorizacaoSchema = visitanteBase.and(
  z.object({
    previsao: z
      .string({ error: 'Informe a data e o horário previstos.' })
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Informe a data e o horário previstos.'),
  }),
);

/** Portaria registra um visitante que chegou sem pré-autorização. */
export const visitaNaoPrevistaSchema = visitanteBase.and(
  z.object({
    unidadeId: z.coerce
      .number({ error: 'Escolha a unidade de destino.' })
      .int()
      .positive('Escolha a unidade de destino.'),
  }),
);

export const ACOES_VISITA = ['AUTORIZAR', 'RECUSAR', 'CANCELAR', 'ENTRADA', 'SAIDA'];
export const acaoVisitaSchema = z.object({
  acao: z.enum(ACOES_VISITA, { error: 'Ação inválida.' }),
});
