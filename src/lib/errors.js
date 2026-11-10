/**
 * Tipo de erro usado pelas regras de negócio: carrega o código HTTP e a mensagem para o usuário.
 * O detalhe (details) leva os erros por campo do formulário.
 */

/** Erro de negócio com status HTTP; a mensagem é segura para enviar ao cliente. */
export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
  }
}
