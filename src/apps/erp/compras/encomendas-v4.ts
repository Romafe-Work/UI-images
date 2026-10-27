/* =========================================================
   ERP — Compras: Encomendas v4, «num só ecrã» (27 out. 2026). Ela: «coloca isto num só ecrã — clientes encomendas
   especiais e agendamento de encomendas e encomendas». O ecrã das Encomendas v3 (o mesmo motor, as mesmas regras)
   com três vistas por cima da lista, e os detalhes em janelas como na Lista de Faltas e nos Orçamentos:
     - Encomendas (Alt+1): a lista dos documentos, como na v3;
     - Agendamento (Alt+2): o que falta receber das encomendas aprovadas, emitidas e parcialmente recebidas, linha a
       linha pela data de entrega, em grupos (atrasadas, hoje, próximos 7 dias, mais tarde);
     - Pedidos de clientes (Alt+3): os artigos em falta pedidos por clientes (da Lista de Faltas; o cliente é de
       exemplo), com a encomenda que os cobre ou «por encomendar».
   Os filtros de cima (fornecedor, período) e a pesquisa servem as três vistas. Tocar numa linha abre a janela da
   encomenda (no Agendamento e nos Pedidos, já nas Linhas). Os itens «Agendamento de encomendas» e «Clientes —
   encomendas especiais» do menu abrem este ecrã na vista deles (espaco.ts).
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { registar, paginaDoc, L, esc, type EstDoc } from './docs-v2';
import { nf } from './docs-v2-comportamento';
import { CFG, fornecedoresDaLista } from './encomendas-v3';
import { encomendas, artigo, fornecedor, dia, pendente, diasAtraso, HOJE } from './dominio';
import { faltas } from './faltas';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import calendarClock from 'lucide-static/icons/calendar-clock.svg?raw';
import userStar from 'lucide-static/icons/user-star.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import listIc from 'lucide-static/icons/list-checks.svg?raw';

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
export const nomeF = (id: string) => fornecedor(id)?.nome ?? id;
/** Os filtros de cima e a pesquisa, nas vistas que não são a lista: fornecedor, período (pela data dada) e texto. */
export function passa(e: EstDoc, forn: string, data: string, texto: string[]): boolean {
  if (e.f.forn && e.f.forn !== forn) return false;
  if (e.f.de && data < e.f.de) return false;
  if (e.f.ate && data > e.f.ate) return false;
  return !e.q || texto.some((t) => norm(t).includes(norm(e.q)));
}
const vazio = (ic: string, t: string, d: string) => `<div class="ak-vazio lf2-vazio">${L(ic)}<p><b>${t}</b>${d}</p></div>`;
const semNada = (e: EstDoc, um: string) => vazio(searchX, `Nenhum ${um} com estes filtros.`, e.q ? `Procura-se «${esc(e.q)}» em qualquer parte da linha.` : 'Tira um filtro, ou limpa-os.');

/* ---------- Agendamento: o que falta receber, pela data de entrega ---------- */
export interface Entrega { enc: string; forn: string; ref: string; desc: string; pend: number; qtd: number; un: string; entrega: string; atraso: number; estado: string }
export const entregas = (): Entrega[] => encomendas().filter((x) => ['Aprovada', 'Emitida', 'Parcialmente recebida'].includes(x.estado))
  .flatMap((x) => x.linhas.filter((l) => pendente(l) > 0).map((l) => ({ enc: x.ref, forn: x.forn, ref: l.ref, desc: artigo(l.ref)?.desc ?? '', pend: pendente(l), qtd: l.qtd, un: artigo(l.ref)?.un ?? 'un.', entrega: l.entrega, atraso: diasAtraso(l.entrega), estado: x.estado })))
  .sort((a, b) => a.entrega.localeCompare(b.entrega) || a.enc.localeCompare(b.enc));
const agenda = (e: EstDoc) => entregas().filter((x) => passa(e, x.forn, x.entrega, [x.enc, nomeF(x.forn), x.ref, x.desc]));
const SEMANA = new Date(Date.parse(HOJE) + 7 * 86_400_000).toISOString().slice(0, 10);
const GRUPOS: [string, (x: Entrega) => boolean][] = [
  ['Atrasadas', (x) => x.entrega < HOJE], ['Hoje', (x) => x.entrega === HOJE], ['Próximos 7 dias', (x) => x.entrega > HOJE && x.entrega <= SEMANA], ['Mais tarde', (x) => x.entrega > SEMANA],
];
function tabelaAgenda(_r: HTMLElement, e: EstDoc): string {
  const ls = agenda(e);
  if (!entregas().length) return vazio(inbox, 'Nada por receber.', 'Todas as encomendas em curso estão recebidas.');
  if (!ls.length) return semNada(e, 'entrega');
  const cab = ['Entrega', 'Situação', 'Encomenda', 'Fornecedor', 'Artigo', 'Descrição', 'Por receber', 'Encomendado'];
  const w = [104, 150, 128, 190, 138, 230, 112, 112];
  return `<table class="lf2-tab dv2-vt" aria-label="Agendamento das entregas"><colgroup>${w.map((x) => `<col style="width:${x}px">`).join('')}</colgroup>
    <thead><tr>${cab.map((t, i) => `<th scope="col"${i >= 6 ? ' class="is-num"' : ''}><span>${t}</span></th>`).join('')}</tr></thead>
    <tbody>${GRUPOS.map(([g, f]) => { const xs = ls.filter(f); return xs.length ? `<tr class="dv2-vt-grupo"><th colspan="8" scope="rowgroup">${g} <small>${nf(xs.length)} ${xs.length === 1 ? 'linha' : 'linhas'}</small></th></tr>${xs.map((x) => `<tr data-dv2-vjan="${esc(x.enc)}|linhas" tabindex="0" title="Abrir a ${esc(x.enc)}">
      <td>${dia(x.entrega)}</td>
      <td>${x.entrega < HOJE ? `<span class="lf2-b lf2-b--rutura">Atrasada ${nf(x.atraso)} ${x.atraso === 1 ? 'dia' : 'dias'}</span>` : x.entrega === HOJE ? '<span class="lf2-b lf2-b--baixo">Hoje</span>' : '<span class="lf2-b lf2-b--enc">No prazo</span>'}</td>
      <td class="is-mono"><b>${esc(x.enc)}</b></td><td>${esc(nomeF(x.forn))}</td><td class="is-mono">${esc(x.ref)}</td><td>${esc(x.desc)}</td>
      <td class="is-num"><b>${nf(x.pend)}</b><small>${esc(x.un)}</small></td><td class="is-num">${nf(x.qtd)}<small>${esc(x.un)}</small></td></tr>`).join('')}` : ''; }).join('')}</tbody></table>`;
}
function resumoAgenda(e: EstDoc): string {
  const ls = agenda(e), atr = ls.filter((x) => x.entrega < HOJE).length, encs = new Set(ls.map((x) => x.enc)).size;
  return `<span><b>${nf(ls.length)}</b> por receber</span><span><b>${nf(atr)}</b> ${atr === 1 ? 'atrasada' : 'atrasadas'}</span><span><b>${nf(encs)}</b> ${encs === 1 ? 'encomenda' : 'encomendas'}</span>`;
}

/* ---------- Pedidos de clientes: os artigos em falta pedidos por clientes ---------- */
export interface Pedido { cli: string; ref: string; desc: string; un: string; qtd: number; stock: number; forn: string; fornNome: string; enc: string; aCaminho: number }
export const pedidos = (): Pedido[] => faltas().filter((f) => f.cliente && f.cliente !== '—').map((f) => {
  const x = encomendas().find((y) => ['Rascunho', 'A aprovar', 'Aprovada', 'Emitida', 'Parcialmente recebida'].includes(y.estado) && y.linhas.some((l) => l.ref === f.ref && pendente(l) > 0));
  const aCaminho = x?.linhas.filter((l) => l.ref === f.ref).reduce((s, l) => s + pendente(l), 0) ?? 0;
  return { cli: f.cliente, ref: f.ref, desc: f.desc, un: artigo(f.ref)?.un ?? 'un.', qtd: f.pedida, stock: f.stock, forn: f.forn, fornNome: f.fornNome, enc: x?.ref ?? '', aCaminho };
}).sort((a, b) => Number(!!a.enc) - Number(!!b.enc) || a.cli.localeCompare(b.cli, 'pt'));
const doCliente = (e: EstDoc) => pedidos().filter((x) => passa(e, x.forn, HOJE, [x.cli, x.ref, x.desc, x.fornNome, x.enc]));
function tabelaPedidos(_r: HTMLElement, e: EstDoc): string {
  const ls = doCliente(e);
  if (!pedidos().length) return vazio(inbox, 'Sem pedidos de clientes.', 'Nenhum artigo em falta foi pedido por um cliente.');
  if (!ls.length) return semNada(e, 'pedido');
  const cab = ['Cliente', 'Artigo', 'Descrição', 'Pedida', 'Stock', 'Fornecedor', 'Encomenda', 'Situação'];
  const w = [190, 138, 230, 96, 90, 180, 128, 220];
  return `<table class="lf2-tab dv2-vt" aria-label="Clientes — encomendas especiais"><colgroup>${w.map((x) => `<col style="width:${x}px">`).join('')}</colgroup>
    <thead><tr>${cab.map((t, i) => `<th scope="col"${i === 3 || i === 4 ? ' class="is-num"' : ''}><span>${t}</span></th>`).join('')}</tr></thead>
    <tbody>${ls.map((x) => `<tr data-dv2-vjan="${esc(x.enc || '-')}|linhas" data-dv2-vsem="${esc(`${x.ref} ainda não está em nenhuma encomenda: junta-o a uma na Lista de Faltas (Ctrl+F7).`)}" tabindex="0" title="${x.enc ? `Abrir a ${esc(x.enc)}` : 'Ainda sem encomenda'}">
      <td><b>${esc(x.cli)}</b></td><td class="is-mono">${esc(x.ref)}</td><td>${esc(x.desc)}</td>
      <td class="is-num"><b>${nf(x.qtd)}</b><small>${esc(x.un)}</small></td><td class="is-num">${x.stock <= 0 ? `<b class="is-rutura">${nf(x.stock)}</b>` : nf(x.stock)}</td>
      <td>${esc(x.fornNome)}</td><td class="is-mono">${x.enc ? `<b>${esc(x.enc)}</b>` : '—'}</td>
      <td>${x.enc ? `<span class="lf2-b lf2-b--enc">${nf(x.aCaminho)} ${esc(x.un)} a caminho</span>` : `<span class="lf2-b lf2-b--rutura">Por encomendar</span> <button type="button" class="dv2-vt-ir" data-dv2-acao="abrir-doc" data-rota="compras.faltas" data-titulo="Lista de Faltas" data-ecra="compras-faltas" data-ref="${esc(x.ref)}">${L(listIc)}<span>Lista de Faltas</span></button>`}</td></tr>`).join('')}</tbody></table>`;
}
function resumoPedidos(e: EstDoc): string {
  const ls = doCliente(e), sem = ls.filter((x) => !x.enc).length;
  return `<span><b>${nf(ls.length)}</b> ${ls.length === 1 ? 'pedido' : 'pedidos'}</span><span><b>${nf(sem)}</b> por encomendar</span><span><b>${nf(new Set(ls.map((x) => x.cli)).size)}</b> clientes</span>`;
}

/* ---------- registar e os ecrãs ---------- */
const CFG4 = registar({
  ...CFG, k: 'enc4',
  sub: 'Encomendas aos fornecedores, o agendamento das entregas e os pedidos especiais de clientes, num só ecrã.',
  teclasExtra: `${CFG.teclasExtra ? `${CFG.teclasExtra} ` : ''}Alt+1 Alt+2 Alt+3`,
  janelas: { titulo: 'Encomenda', icone: fileText, estados: [] },
  vistas: [
    { k: 'docs', t: 'Encomendas', ic: fileText, tecla: 'Alt+1', titulo: 'Encomendas a Fornecedores' },
    { k: 'agenda', t: 'Agendamento', ic: calendarClock, tecla: 'Alt+2', titulo: 'Agendamento das entregas', tabela: tabelaAgenda, resumo: resumoAgenda },
    { k: 'clientes', t: 'Pedidos de clientes', ic: userStar, tecla: 'Alt+3', titulo: 'Clientes — encomendas especiais', tabela: tabelaPedidos, resumo: resumoPedidos },
  ],
});
const NOTA4 = 'Encomendas v4 (27 out., ela: «coloca isto num só ecrã»): Encomendas, Agendamento de encomendas e Clientes — encomendas especiais num só ecrã, em três vistas (Alt+1, Alt+2, Alt+3) com os mesmos filtros e a mesma pesquisa; os detalhes de cada encomenda numa janela, como na Lista de Faltas. Os dois itens do menu abrem este ecrã na vista deles.';
const versao4 = (cen = 'normal') => ({ id: 'v4', nota: NOTA4, html: paginaDoc(CFG4, cen, fornecedoresDaLista()) });
const ESTADOS4: [string, string, string][] = [
  ['vista-agenda', '10.60 · Agendamento', 'A vista do agendamento: o que falta receber, pela data de entrega, em grupos; tocar abre a encomenda nas Linhas.'],
  ['vista-clientes', '10.61 · Pedidos de clientes', 'Os artigos em falta pedidos por clientes, com a encomenda que os cobre ou «Por encomendar» e o caminho para a Lista de Faltas.'],
];
export function comEncomendasV4(ecras: Ecra<IdErp>[]): Ecra<IdErp>[] {
  return [...ecras.map((e) => e.id === 'compras' ? { ...e, versoes: [...e.versoes, versao4()] as Ecra<IdErp>['versoes'] } : e),
    ...ESTADOS4.map(([cen, nome, objetivo]) => ({ id: `enc4-${cen}` as IdErp, nome, fluxo: 'Compras', estadoDe: 'compras' as IdErp, objetivo, versoes: [versao4(cen)] as Ecra<IdErp>['versoes'] }))];
}
export type IdEnc4 = `enc4-${string}`;
