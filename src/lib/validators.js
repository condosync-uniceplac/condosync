import { z } from 'zod';

const onlyDigits = (v) => (typeof v === 'string' ? v.replace(/\D/g, '') : v);

export const cpfSchema = z.preprocess(
  onlyDigits,
  z
    .string({ error: 'CPF obrigatório.' })
    .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos.')
    .refine((v) => !/^(\d)\1{10}$/.test(v), 'CPF inválido.'),
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
    rg: z.string().trim().min(4, 'RG inválido.').max(20, 'RG inválido.'),
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

export const loginSchema = z.object({
  // CPF com ou sem máscara (000.000.000-00)
  cpf: cpfSchema,
  senha: z.string().min(1, 'Informe a senha.').max(72),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.').max(254),
});
