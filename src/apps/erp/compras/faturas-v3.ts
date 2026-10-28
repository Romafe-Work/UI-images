/* =========================================================
   ERP — Compras: Faturas v3, «num só ecrã» (27 out. 2026). Ela mostrou o menu do antigo (Facturas…, Notas de Crédito…,
   Pendentes de Crédito de Fornecedor…, Verificação de Facturas…) e pediu «coloca esses 4 no mesmo ecrã» e «com o conceito
   de windows também»: as Faturas de Compra v2 (compras/faturas-v2.ts, as mesmas regras e a mesma pesquisa) com quatro
   vistas por cima da lista e cada fatura numa janela flutuante, como nas Encomendas v4/v5.
     - Faturas (Alt+1): a lista da v2;
     - Notas de crédito (Alt+2): as notas lançadas, cada uma ligada à sua fatura (abre a fatura nos Créditos);
     - Crédito por receber (Alt+3): por fornecedor, o que a fatura cobra acima da encomenda e da receção (preço maior,
       quantidade a mais) e ainda não veio em nota de crédito (abre a fatura nos Créditos, para lançar o crédito);
     - Verificação (Alt+4): cada fatura contra a encomenda e a receção — com diferenças, sem encomenda, batem certo
       (abre a fatura nos Documentos, onde está a verificação).
   O fornecedor, o período, a moeda e a pesquisa avançada servem as quatro; a Série e o Estado são da lista das faturas.
   Os itens «Notas de crédito», «Pendentes de crédito de fornecedor» e «Verificação de faturas» do menu abrem este ecrã
   na vista deles (espaco.ts). Nada se inventa: os valores saem das faturas de exemplo (compras/faturas.ts).
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { registar, paginaDoc, L, esc, type Doc, type EstDoc } from './docs-v2';
import { nf, mudarVista, quieto } from './docs-v2-comportamento';
import { CFG } from './faturas-v2';
import { faturas, fatura, notasCredito, creditado, liquidoLinha, verificar, type Fatura } from './faturas';
import { encomenda, rececao, rececoes, fornecedor, euros, dia } from './dominio';
import { PERFIS } from '../inicio-dados';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import receiptText from 'lucide-static/icons/receipt-text.svg?raw';
import hourglass from 'lucide-static/icons/hourglass.svg?raw';
import fileCheck from 'lucide-static/icons/file-check.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import circleHelp from 'lucide-static/icons/circle-help.svg?raw';
import triangle from 'lucide-static/icons/triangle-alert.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';

const nomeF = (id: string) => fornecedor(id)?.nome ?? id;
const vazio = (ic: string, t: string, d: string) => `<div class="ak-vazio lf2-vazio">${L(ic)}<p><b>${t}</b>${d}</p></div>`;
const semNada = (um: string) => vazio(searchX, `Nenhum${um.endsWith('a') ? 'a' : ''} ${um} com estes filtros.`, 'Escolhe outro fornecedor ou período, ou remove o filtro (Shift+F2).');
const cabeca = (cs: [string, number, boolean?][]) => `<colgroup>${cs.map(([, w]) => `<col style="width:${w}px">`).join('')}</colgroup><thead><tr>${cs.map(([t, , n]) => `<th scope="col"${n ? ' class="is-num"' : ''}><span>${t}</span></th>`).join('')}</tr></thead>`;

/* ---------- as faturas que os filtros de cima deixam (o fornecedor, o período, a moeda e a pesquisa avançada) ---------- */
function visiveis(e: EstDoc): Fatura[] {
  if (e.vazia) return [];
  const ok = new Set(CFG.linhas(e).filter((d: Doc) => (!e.f.forn || d.forn === e.f.forn) && (!e.f.de || String(d.data) >= e.f.de) && (!e.f.ate || String(d.data) <= e.f.ate)
    && (!e.f.moeda || d.moeda === e.f.moeda) && (!CFG.filtrar || CFG.filtrar(e, d))).map((d) => d.id));
  return faturas().filter((f) => ok.has(f.ref));
}

/* ---------- o crédito por receber: o que a fatura cobra acima da encomenda (preço) e da receção (quantidade) ---------- */
function aceiteDe(f: Fatura, ref: string): number {
  const r = f.rec ? rececao(f.rec) : undefined;
  const ls = r ? r.linhas : rececoes().filter((x) => x.enc === f.enc).flatMap((x) => x.linhas);
  return ls.filter((x) => x.ref === ref).reduce((s, x) => s + x.aceite, 0);
}
/** Com IVA, como o crédito se lança; as mesmas comparações da verificação (compras/faturas.ts, verificar). */
function aReclamar(f: Fatura): { valor: number; motivos: string[] } {
  const e = f.enc ? encomenda(f.enc) : undefined; if (!e || f.anulada) return { valor: 0, motivos: [] };
  let valor = 0; const motivos: string[] = [];
  f.linhas.filter((l) => l.tipo === 'artigo').forEach((l) => {
    const le = e.linhas.find((x) => x.ref === l.ref); if (!le) return;
    const aceite = aceiteDe(f, l.ref), preco = le.preco !== null && le.preco < l.preco ? le.preco : l.preco, qtd = Math.min(l.qtd, aceite);
    const dif = liquidoLinha(l) - liquidoLinha({ qtd, preco, desconto: l.desconto }); if (dif <= 0) return;
    valor += dif + Math.round(dif * l.iva / 10000);
    if (preco !== l.preco) motivos.push(`${l.ref}: ${euros(l.preco)} faturado, ${euros(preco)} na encomenda`);
    if (qtd !== l.qtd) motivos.push(`${l.ref}: ${nf(l.qtd)} faturados, ${nf(aceite)} recebidos`);
  });
  return { valor, motivos };
}
interface Pendente { f: Fatura; valor: number; cr: number; falta: number; motivos: string[] }
const pendentes = (e: EstDoc): Pendente[] => visiveis(e).flatMap((f) => { const a = aReclamar(f), cr = creditado(f), falta = a.valor - cr; return falta > 0 ? [{ f, valor: a.valor, cr, falta, motivos: a.motivos }] : []; });
const temPendentes = () => faturas().some((f) => aReclamar(f).valor > creditado(f));

/* ---------- Notas de crédito ---------- */
const notas = (e: EstDoc) => { const fs = new Set(visiveis(e).map((f) => f.ref)); return notasCredito().filter((n) => fs.has(n.fatura)).sort((a, b) => b.ref.localeCompare(a.ref)); };
function tabelaNotas(_r: HTMLElement, e: EstDoc): string {
  if (!notasCredito().length) return vazio(inbox, 'Ainda não há notas de crédito.', 'Nascem nas faturas: escolhe uma fatura e Lançar crédito (Ctrl+F1).');
  const ls = notas(e); if (!ls.length) return semNada('nota');
  return `<table class="lf2-tab dv2-vt" aria-label="Notas de crédito">${cabeca([['Nota de crédito', 140], ['Data', 100], ['Fatura', 140], ['Fornecedor', 180], ['Documento do fornecedor', 170], ['Motivo', 240], ['Lançada por', 140], ['Valor', 110, true]])}
    <tbody>${ls.map((n) => { const f = fatura(n.fatura); return `<tr data-dv2-vjan="${esc(n.fatura)}|creditos" data-fc3-nc="${esc(n.ref)}" tabindex="0" title="Abrir a ${esc(n.fatura)} nos créditos">
      <td class="is-mono"><b>${esc(n.ref)}</b></td><td>${dia(n.data)}</td><td class="is-mono">${esc(n.fatura)}</td><td>${esc(nomeF(f?.forn ?? ''))}</td><td class="is-mono">${esc(f?.docForn ?? '—')}</td>
      <td>${esc(n.motivo)}</td><td>${esc(PERFIS[n.por].pessoa)}</td><td class="is-num"><b>${euros(n.valor)}</b></td></tr>`; }).join('')}</tbody></table>`;
}
function resumoNotas(e: EstDoc): string {
  const ls = notas(e);
  return `<span><b>${nf(ls.length)}</b> ${ls.length === 1 ? 'nota' : 'notas'}</span><span><b>${nf(new Set(ls.map((n) => n.fatura)).size)}</b> ${new Set(ls.map((n) => n.fatura)).size === 1 ? 'fatura' : 'faturas'}</span><span>Creditado <b>${euros(ls.reduce((s, n) => s + n.valor, 0))}</b></span>`;
}

/* ---------- Crédito por receber, por fornecedor ---------- */
function tabelaPendentes(_r: HTMLElement, e: EstDoc): string {
  if (!temPendentes()) return vazio(circleCheck, 'Nada por receber.', 'Nenhuma fatura cobra acima da encomenda ou da receção sem o crédito já lançado.');
  const ls = pendentes(e); if (!ls.length) return semNada('fatura');
  const grupos = [...new Set(ls.map((p) => p.f.forn))].sort((a, b) => nomeF(a).localeCompare(nomeF(b), 'pt'));
  return `<table class="lf2-tab dv2-vt" aria-label="Crédito por receber">${cabeca([['Fatura', 140], ['Data', 100], ['Documento do fornecedor', 170], ['Diferença', 320], ['Situação', 190], ['A reclamar', 110, true], ['Creditado', 110, true], ['Falta', 110, true]])}
    <tbody>${grupos.map((g) => { const xs = ls.filter((p) => p.f.forn === g); return `<tr class="dv2-vt-grupo"><th colspan="8" scope="rowgroup">${esc(nomeF(g))} <small>${nf(xs.length)} ${xs.length === 1 ? 'fatura' : 'faturas'} · falta ${euros(xs.reduce((s, p) => s + p.falta, 0))}</small></th></tr>${xs.map((p) => `<tr data-dv2-vjan="${esc(p.f.ref)}|creditos" tabindex="0" title="Abrir a ${esc(p.f.ref)} para lançar o crédito">
      <td class="is-mono"><b>${esc(p.f.ref)}</b></td><td>${dia(p.f.data)}</td><td class="is-mono">${esc(p.f.docForn)}</td><td>${esc(p.motivos.join(' · '))}</td>
      <td>${p.f.bloqueada ? `<span class="lf2-b lf2-b--baixo">${L(lock)}Bloqueada à espera</span>` : '<span class="lf2-b lf2-b--pend">Por reclamar</span>'}</td>
      <td class="is-num">${euros(p.valor)}</td><td class="is-num">${p.cr ? euros(p.cr) : '<span class="is-nada">—</span>'}</td><td class="is-num"><b>${euros(p.falta)}</b></td></tr>`).join('')}`; }).join('')}</tbody></table>`;
}
function resumoPendentes(e: EstDoc): string {
  const ls = pendentes(e), fs = new Set(ls.map((p) => p.f.forn)).size;
  return `<span><b>${nf(ls.length)}</b> ${ls.length === 1 ? 'fatura' : 'faturas'}</span><span><b>${nf(fs)}</b> ${fs === 1 ? 'fornecedor' : 'fornecedores'}</span><span>Falta receber <b>${euros(ls.reduce((s, p) => s + p.falta, 0))}</b></span>`;
}

/* ---------- Verificação contra a encomenda e a receção ---------- */
type Res = 'dif' | 'sem' | 'ok';
const resDe = (f: Fatura): Res => !f.enc ? 'sem' : verificar(f).ok ? 'ok' : 'dif';
const conferir = (e: EstDoc) => visiveis(e).filter((f) => !f.anulada);
const GRUPOS_V: [Res, string][] = [['dif', 'Com diferenças'], ['sem', 'Sem encomenda'], ['ok', 'Batem certo']];
function tabelaVerif(_r: HTMLElement, e: EstDoc): string {
  if (!faturas().some((f) => !f.anulada)) return vazio(inbox, 'Não há faturas para verificar.', 'Aparecem quando se regista uma fatura de fornecedor.');
  const ls = conferir(e); if (!ls.length) return semNada('fatura');
  return `<table class="lf2-tab dv2-vt" aria-label="Verificação das faturas">${cabeca([['Fatura', 140], ['Data', 100], ['Fornecedor', 170], ['Encomenda', 130], ['Receção', 130], ['Resultado', 150], ['O que se viu', 380]])}
    <tbody>${GRUPOS_V.map(([k, t]) => { const xs = ls.filter((f) => resDe(f) === k); return xs.length ? `<tr class="dv2-vt-grupo"><th colspan="7" scope="rowgroup">${t} <small>${nf(xs.length)} ${xs.length === 1 ? 'fatura' : 'faturas'}</small></th></tr>${xs.map((f) => {
      const v = verificar(f), erros = v.linhas.filter((y) => y.nivel === 'erro'), primeira = (erros[0] ?? v.linhas[0])?.t ?? '';
      const b = k === 'dif' ? `<span class="lf2-b lf2-b--baixo">${L(triangle)}${nf(erros.length)} ${erros.length === 1 ? 'diferença' : 'diferenças'}</span>` : k === 'sem' ? `<span class="lf2-b lf2-b--pend">${L(circleHelp)}Nada a comparar</span>` : `<span class="lf2-b lf2-b--enc">${L(circleCheck)}Bate certo</span>`;
      return `<tr data-dv2-vjan="${esc(f.ref)}|documentos" tabindex="0" title="Abrir a ${esc(f.ref)} na verificação">
      <td class="is-mono"><b>${esc(f.ref)}</b></td><td>${dia(f.data)}</td><td>${esc(nomeF(f.forn))}</td><td class="is-mono">${esc(f.enc || '—')}</td><td class="is-mono">${esc(f.rec || '—')}</td>
      <td>${b}</td><td>${esc(primeira)}${erros.length > 1 ? ` <small>e mais ${nf(erros.length - 1)}</small>` : ''}</td></tr>`; }).join('')}` : ''; }).join('')}</tbody></table>`;
}
function resumoVerif(e: EstDoc): string {
  const ls = conferir(e), n = (k: Res) => ls.filter((f) => resDe(f) === k).length;
  return `<span><b>${nf(n('dif'))}</b> com diferenças</span><span><b>${nf(n('sem'))}</b> sem encomenda</span><span><b>${nf(n('ok'))}</b> batem certo</span>`;
}

/* ---------- registar ---------- */
/** Uma nota de crédito aberta a partir da janela da fatura: vai à vista das notas e acende-a (em vez do ecrã antigo, que saiu). */
function mostrarNota(r: HTMLElement, x: EstDoc, ref: string): void {
  mudarVista(r, x, 'notas');
  requestAnimationFrame(() => {
    const tr = r.querySelector<HTMLElement>(`[data-dv2-vista-g] [data-fc3-nc="${CSS.escape(ref)}"]`); if (!tr) return;
    r.querySelectorAll('[data-dv2-vista-g] tr.is-ativo').forEach((t) => t.classList.remove('is-ativo'));
    tr.classList.add('is-ativo'); tr.scrollIntoView({ block: 'nearest' }); tr.focus({ preventScroll: true });
    if (!quieto()) tr.animate([{ backgroundColor: 'color-mix(in srgb, var(--h-laranja) 22%, transparent)' }, { backgroundColor: 'transparent' }], { duration: 700, easing: 'ease-out' });
  });
}
const CFG3 = registar({
  ...CFG, k: 'fat3',
  sub: 'Faturas, notas de crédito, crédito por receber e verificação dos fornecedores, num só ecrã.',
  teclasExtra: `${CFG.teclasExtra ? `${CFG.teclasExtra} ` : ''}Alt+1 Alt+2 Alt+3 Alt+4`,
  janelas: { titulo: 'Fatura', icone: receipt, estados: ['bloqueada', 'anulada', 'creditada', 'creditado', 'verificacao', 'documentos-carregar'] },
  vistasEmCima: true,
  vistas: [
    { k: 'docs', t: 'Faturas', ic: receipt, tecla: 'Alt+1', titulo: 'Faturas de Compra' },
    { k: 'notas', t: 'Notas de crédito', ic: receiptText, tecla: 'Alt+2', titulo: 'Notas de crédito', tabela: tabelaNotas, resumo: resumoNotas },
    { k: 'pendentes', t: 'Crédito por receber', ic: hourglass, tecla: 'Alt+3', titulo: 'Crédito por receber, por fornecedor', tabela: tabelaPendentes, resumo: resumoPendentes },
    { k: 'verificar', t: 'Verificação', ic: fileCheck, tecla: 'Alt+4', titulo: 'Verificação das faturas', tabela: tabelaVerif, resumo: resumoVerif },
  ],
  acao(r, x, k, b) {
    if (k === 'abrir-doc' && b.dataset.rota === 'compras.compras-notas-credito') { mostrarNota(r, x, b.dataset.ref ?? ''); return true; }
    return CFG.acao(r, x, k, b);
  },
});

/* ---------- os ecrãs ---------- */
const NOTA3 = 'Faturas v3 (27 out., ela: «coloca esses 4 no mesmo ecrã» e «com o conceito de windows também»): Faturas, Notas de crédito, Crédito por receber e Verificação num só ecrã, em quatro vistas (Alt+1 a Alt+4) com o mesmo fornecedor, período e pesquisa avançada; cada fatura abre numa janela flutuante (Novo e Editar também), no separador que a vista pede. Os outros três itens do menu abrem este ecrã na vista deles.';
const ESTADOS3: [string, string, string][] = [
  ['vista-notas', 'Notas de crédito', 'As notas lançadas, cada uma com a sua fatura; tocar numa abre a fatura nos créditos.'],
  ['vista-pendentes', 'Crédito por receber', 'Por fornecedor: o que a fatura cobra acima da encomenda e da receção e ainda não veio em nota de crédito.'],
  ['vista-verificar', 'Verificação', 'Cada fatura contra a encomenda e a receção: com diferenças, sem encomenda, batem certo.'],
  ['janela', 'Fatura numa janela', 'Tocar numa fatura abre a janela dela, com os detalhes, as linhas, os documentos, os créditos e os anexos.'],
  ['janelas', 'Várias janelas', 'Três faturas abertas ao mesmo tempo, em cascata; uma minimizada.'],
  ['maximizada', 'Janela maximizada', 'A janela ocupa o ecrã (duplo clique no cabeçalho); volta ao tamanho com o mesmo gesto.'],
  ['criar', 'Nova fatura', 'Novo (F5) abre a ficha numa janela: tipo, data, fornecedor, documento, encomenda, receção e linhas.'],
  ['editar', 'Editar numa janela', 'Editar (F6) passa a janela da fatura a ficha; uma fatura do período aberto, sem crédito.'],
  ['editar-sujo', 'A editar, com alterações', 'O ● no cabeçalho da janela: fechar pergunta antes de perder o que se escreveu.'],
  ['credito', 'Lançar crédito (Ctrl+F1)', 'O que falta creditar, o valor e o motivo; a fatura não é anulada.'],
  ['creditado', 'Crédito lançado', 'A nota nasce na fatura, nos créditos da janela, e aparece na vista das notas.'],
  ['verificacao', 'Verificação com diferenças', 'A janela da fatura bloqueada nos documentos: a diferença de preço contra a encomenda.'],
  ['construtor', 'Pesquisa avançada', 'Três condições com E e OU aplicadas (Shift+F1): servem as quatro vistas.'],
  ['sem-resultados', 'Pesquisa sem resultados', 'A condição não deixa nenhuma fatura: Remover filtro (Shift+F2).'],
  ['carregar', 'A carregar', 'As vistas e os filtros já servem; a lista em esqueleto.'],
  ['vazia', 'Sem faturas', 'Ainda não há faturas: Novo (F5).'],
  ['permissao', 'Sem permissão', 'O perfil só consulta: as ações dizem porquê.'],
  ['servidor', 'Servidor indisponível', 'O servidor não respondeu: Tentar outra vez.'],
  ['offline', 'Sem ligação', 'Sem rede: o fornecedor e a pesquisa ficam.'],
  ['sessao', 'Sessão terminada', 'Voltar a entrar pelo login comum; volta-se a este ecrã.'],
];
const fornecedoresDaLista = (): [string, string][] => [...new Set(faturas().map((f) => f.forn))].map((f) => [f, nomeF(f)] as [string, string]).sort((a, b) => a[1].localeCompare(b[1], 'pt'));
const versao = (cen = 'normal') => ({ id: 'v3', nota: NOTA3, html: paginaDoc(CFG3, cen, fornecedoresDaLista()) });
/** O ecrã das Faturas ganha a v3 (abre por omissão) e os estados só dela. */
export function comFaturasV3(ecras: Ecra<IdErp>[]): Ecra<IdErp>[] {
  return ecras.flatMap((e) => {
    if (e.id !== 'cm-compras-faturas' || e.estadoDe) return [e];
    const num = e.nome.split(' · ')[0];
    return [{ ...e, nome: `${num} · Faturas, créditos e verificação`, versoes: [...e.versoes, versao()] as Ecra<IdErp>['versoes'] },
      ...ESTADOS3.map(([cen, nome, objetivo], i) => ({ id: `fat3-${cen}` as IdErp, nome: `${num}.${40 + i} · ${nome}`, fluxo: e.fluxo, estadoDe: e.id, objetivo, versoes: [versao(cen)] as Ecra<IdErp>['versoes'] }))];
  });
}
export type IdFat3 = `fat3-${string}`;
