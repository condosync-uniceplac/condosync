import * as avisosRepo from '@/repositories/avisosRepository';

/** Exemplo de serviço de módulo: mural do condomínio da sessão atual. */
export async function listarMural(session) {
  const avisos = await avisosRepo.listByCondominio(session.condominioId);
  return avisos.map((a) => ({ ...a, id: Number(a.id) }));
}
