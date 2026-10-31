import bcrypt from 'bcryptjs';

const COST = 12;

// Hash usado quando o usuário não existe, para o tempo de resposta do login
// não revelar se o e-mail/CPF está cadastrado.
const DUMMY_HASH = '$2b$12$ZdloeDRKNQfXMvW8yeIpWeqoNYGMRKXcJdqvNpAbMVFM5Ek0YzDny';

export function hashPassword(plain) {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash || DUMMY_HASH);
}
