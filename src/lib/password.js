/**
 * Hash e conferência de senhas com bcrypt (a senha nunca é guardada em texto).
 */

import bcrypt from 'bcryptjs';

// Custo do bcrypt: quanto maior, mais lento (e mais difícil) é testar senhas por força bruta.
const COST = 12;

// Hash usado quando o usuário não existe, para o tempo de resposta do login
// não revelar se o e-mail/CPF está cadastrado.
const DUMMY_HASH = '$2b$12$ZdloeDRKNQfXMvW8yeIpWeqoNYGMRKXcJdqvNpAbMVFM5Ek0YzDny';

// Gera o hash da senha para guardar no banco.
export function hashPassword(plain) {
  return bcrypt.hash(plain, COST);
}

// Compara a senha digitada com o hash guardado.
export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash || DUMMY_HASH);
}
