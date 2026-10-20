/* =========================================================
   ERP — a sessão do protótipo (19 out. 2026)
   Não há servidor de autenticação: o 01 · Entrar v10 guarda aqui quem entrou (na sessão do navegador),
   o «Terminar sessão» do Início apaga-a, e a 00 · Abertura v2 lê-a para saber o que mostrar
   («Entrar no ERP» ou «Abrir espaço de trabalho»). No produto isto é o Keycloak: a abertura pergunta ao
   servidor se a sessão é válida, e só depois mostra a ação.
   ========================================================= */
import type { IdPerfil } from './inicio-dados';

export interface Sessao { correio: string; desde: string }
const CHAVE = 'erp:sessao';
export function lerSessao(): Sessao | null { try { const v = sessionStorage.getItem(CHAVE); return v ? JSON.parse(v) as Sessao : null; } catch { return null; } }
export function abrirSessao(correio: string): void { try { sessionStorage.setItem(CHAVE, JSON.stringify({ correio, desde: new Date().toISOString() })); } catch { /* sem armazenamento: não fica */ } }
export function terminarSessao(): void { try { sessionStorage.removeItem(CHAVE); } catch { /* */ } }
/** O perfil de quem está na sessão: o de «Ver como» (protótipo), senão o de Compras (o Rui Matos do login). */
export function perfilDaSessao(): IdPerfil { try { const v = sessionStorage.getItem('erp:perfil'); return v ? JSON.parse(v) as IdPerfil : 'compras'; } catch { return 'compras'; } }

/* 20 out. 2026: a v11 (o início de sessão geral) escolhe a empresa depois de entrar. A da sessão fica na
   sessão do navegador; a última usada fica guardada neste computador, para vir marcada da próxima vez. */
const CHAVE_EMPRESA = 'erp:empresa', CHAVE_ULTIMA = 'romafe:empresa-ultima';
export function lerEmpresa(): string | null { try { return sessionStorage.getItem(CHAVE_EMPRESA); } catch { return null; } }
export function escolherEmpresa(id: string): void {
  try { sessionStorage.setItem(CHAVE_EMPRESA, id); } catch { /* */ }
  try { localStorage.setItem(CHAVE_ULTIMA, id); } catch { /* */ }
}
export function ultimaEmpresa(): string | null { try { return localStorage.getItem(CHAVE_ULTIMA); } catch { return null; } }
