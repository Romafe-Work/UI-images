/* =========================================================
   ERP — Compras, fases 1 e 2: os estados que faltavam (26 out. 2026). Ela: «coloca todos os estados por screen».
   As listas (12 Receções, 14 Fornecedores, 16 Requisições) e as fichas (11 Encomenda, 13 Receção, 15 Fornecedor,
   17 Requisição, 19 Cotação) ganham: a carregar, erro do servidor, sem ligação, sem permissão, sessão terminada e, nas
   fichas, documento inexistente e alterado por outra pessoa. O estado entra no lugar do conteúdo da página: o
   cabeçalho dela fica (o título e o caminho), o resto é a peça do estado, com as classes da casa (.cp-vazio).
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { ic } from '../inicio-icones';
import { btn } from '../inicio';

export type CenarioCp = 'carregar' | 'servidor' | 'offline' | 'permissao' | 'sessao' | 'inexistente' | 'conflito';
const PECAS: Record<Exclude<CenarioCp, 'carregar'>, [string, string, string, (destino: string) => string]> = {
  servidor: ['circle-alert', 'O servidor não respondeu.', 'Não foi possível ler os dados (ERP-COMP-503). Nada se perdeu; tenta outra vez.', (d) => btn('Tentar outra vez', 'rotate-ccw', { attrs: `data-ws-ir="${d}"` })],
  offline: ['wifi-off', 'Sem ligação à rede.', 'O que estava escrito fica neste ecrã. Quando a ligação voltar, tenta outra vez.', (d) => btn('Tentar outra vez', 'rotate-ccw', { cls: 'btn--ghost', attrs: `data-ws-ir="${d}"` })],
  permissao: ['lock', 'Sem permissão.', 'O teu perfil não tem acesso a este ecrã. Se precisares, pede-o ao administrador da tua empresa.', () => ''],
  sessao: ['log-out', 'A sessão terminou.', 'Volta a entrar pelo login comum; voltas a este ecrã, com o que estava escrito.', () => btn('Voltar a entrar', 'arrow-right', { attrs: 'data-login' })],
  inexistente: ['search', 'Este documento já não existe.', 'Pode ter sido apagado ou a referência estar errada. Volta à lista e procura-o.', (d) => btn('Ver a lista', 'arrow-right', { cls: 'btn--ghost', attrs: `data-ws-ir="${d}"` })],
  conflito: ['history', 'Outra pessoa alterou este documento.', 'Gravou-se depois de o abrires: as tuas alterações não se gravaram. Volta a abri-lo para ver a versão nova.', (d) => btn('Abrir a versão nova', 'rotate-ccw', { attrs: `data-ws-ir="${d}"` })],
};
/** O estado no lugar do conteúdo da página (o cabeçalho fica). */
export function comEstado(html: string, cen: CenarioCp, repetir: string, lista: string): string {
  const i = html.indexOf('<main class="cp'), j = html.lastIndexOf('</main>'); if (i < 0 || j < 0) return html;
  const ab = html.indexOf('>', i) + 1, dentro = html.slice(ab, j);
  const cab = dentro.match(/<header class="cp-cabeca">[\s\S]*?<\/header>/)?.[0] ?? '';
  const peca = cen === 'carregar'
    ? `<div class="cp-esq" aria-label="A carregar">${Array.from({ length: 7 }, (_, k) => `<i style="--i:${k}"></i>`).join('')}</div>`
    : (() => { const [icone, t, d, b] = PECAS[cen]; return `<div class="cp-vazio${cen === 'permissao' ? ' cp-vazio--fechado' : ''}" role="alert">${ic(icone, 'cp-vazio__icone')}<p class="cp-vazio__titulo">${t}</p><p class="cp-vazio__texto">${d}</p>${b(cen === 'inexistente' ? lista : repetir)}</div>`; })();
  return `${html.slice(0, ab)}${cab}${peca}${html.slice(j)}`;
}
const NOMES: Record<CenarioCp, [string, string]> = {
  carregar: ['A carregar', 'O cabeçalho já está; o conteúdo em esqueleto, do tamanho do que vem.'],
  inexistente: ['Documento inexistente', 'A referência já não existe: diz-se e volta-se à lista.'],
  conflito: ['Alterado por outra pessoa', 'Gravou-se depois de se abrir: nada se gravou; abre-se a versão nova.'],
  servidor: ['Erro do servidor', 'O servidor não respondeu: a referência do erro e «Tentar outra vez».'],
  offline: ['Sem ligação', 'Sem rede: o que estava escrito fica; tenta-se outra vez.'],
  permissao: ['Sem permissão', 'O perfil não tem acesso: diz a quem pedir; não se mostram dados.'],
  sessao: ['Sessão terminada', 'Voltar a entrar pelo login comum; volta-se a este ecrã.'],
};
/** Ao redesenhar (o comportamento da casa volta a desenhar a página), o estado marcado na raiz continua por cima. */
export function comEstadoDaRaiz<P extends { html: string }>(p: P, raiz: HTMLElement | null | undefined): P {
  const cen = raiz?.dataset.wsEstado as CenarioCp | undefined; if (!cen) return p;
  return { ...p, html: comEstado(p.html, cen, raiz!.dataset.wsEstadoRepetir ?? '', raiz!.dataset.wsEstadoLista ?? '') };
}
/** Os estados de um ecrã das fases 1 e 2, numerados depois dos que já tem. */
export function estadosCp(base: Ecra<IdErp>, ficha: boolean, lista: string, ja: number, nota: string): Ecra<IdErp>[] {
  const num = base.nome.split(' · ')[0], html = base.versoes[0].html;
  const cens: CenarioCp[] = ficha ? ['carregar', 'inexistente', 'conflito', 'servidor', 'offline', 'permissao', 'sessao'] : ['carregar', 'servidor', 'offline', 'permissao', 'sessao'];
  return cens.map((cen, k) => ({ id: `${base.id}-est-${cen}` as IdErp, nome: `${num}.${ja + k + 1} · ${NOMES[cen][0]}`, fluxo: base.fluxo, estadoDe: base.id, objetivo: NOMES[cen][1], versoes: [{ id: base.versoes[0].id, nota, html: comEstado(html, cen, base.id, lista).replace('<div class="ws" ', `<div class="ws" data-ws-estado="${cen}" data-ws-estado-repetir="${base.id}" data-ws-estado-lista="${lista}" `) }] as Ecra<IdErp>['versoes'] }));
}
/** Junta os estados que faltam aos ecrãs das fases 1 e 2 (a lista de cada ficha é para onde se volta). */
export function comEstadosCp(ecras: Ecra<IdErp>[]): Ecra<IdErp>[] {
  const ALVOS: Record<string, [boolean, string]> = {
    'compras-encomenda': [true, 'compras'], 'compras-rececoes': [false, ''], 'compras-rececao': [true, 'compras-rececoes'], 'compras-fornecedores': [false, ''],
    'compras-fornecedor': [true, 'compras-fornecedores'], 'compras-requisicoes': [false, ''], 'compras-requisicao': [true, 'compras-requisicoes'], 'compras-cotacao': [true, 'compras-cotacoes'],
  };
  const extra = ecras.flatMap((e) => { const a = ALVOS[e.id as string]; if (!a || e.estadoDe) return []; const ja = ecras.filter((x) => x.estadoDe === e.id).length; return estadosCp(e, a[0], a[1] || (e.id as string), ja, 'Os estados de 26 out. (ela: «coloca todos os estados por screen»)'); });
  return [...ecras, ...extra];
}
