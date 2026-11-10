/**
 * Resposta provisória (501) usada nas primeiras sprints para rotas ainda não implementadas.
 * Hoje nenhuma rota usa este arquivo; ficou como apoio para módulos futuros.
 */

import { NextResponse } from 'next/server';
import { handleError } from './http';
import { requireSession } from './session';

/** Handler provisório para módulos ainda não implementados (exige sessão, responde 501). */
export function notImplemented(modulo) {
  return async function handler() {
    try {
      await requireSession();
      return NextResponse.json(
        { error: `Módulo "${modulo}" ainda não implementado.` },
        { status: 501 },
      );
    } catch (err) {
      return handleError(err, modulo);
    }
  };
}
