/* =========================================================
   ERP — 20 · Lista de faltas (22 out. 2026), do briefing dela «redesenhar o ecrã do módulo de Compras… Lista de
   faltas / Ruturas / Reposição», e da nota «quero simples e wow»
   Um ecrã de trabalho, denso mas arrumado, de cima para baixo:
     1. o cabeçalho do ERP (o caminho ERP / Compras / Lista de faltas) e o da página: título, uma linha, a procura
        rápida e as ações (Nova encomenda; Gerar proposta, Exportar, Imprimir, Atualizar);
     2. os filtros — os rápidos numa linha (indústria/auto, armazém, classe, stock, fornecedor) e os avançados
        que se abrem (encomenda de fornecedor e de cliente, «pesquisa iniciada por», tipo, datas, código);
        etiquetas com o que está ativo, «Limpar filtros» e «Aplicar». Enter passa ao campo seguinte; no último,
        aplica;
     3. a encomenda ativa (a que recebe os artigos escolhidos): número, data, fornecedor, valor líquido, estado e a
        observação que importa;
     4. a tabela dos artigos em falta — cabeçalho preso, as duas primeiras colunas presas, ordenar, mostrar e
        esconder colunas, a rutura a vermelho, o abaixo do mínimo a âmbar e a sugestão de compra em destaque;
        com seleção, as ações rápidas;
     5. em baixo, do artigo escolhido: o stock por armazém (com a posição), as classes de reposição e a rotação
        (90 dias de entradas e saídas, a linha das 12 semanas, mínimo, económica, consignada, preços).
   Dados: os artigos, o stock e as encomendas são os do protótipo (compras/dominio.ts) — a quantidade encomendada
   sai das encomendas em curso e a encomenda ativa é o rascunho; a classe, a família, o mínimo, a rotação e os
   outros armazéns são de exemplo (aqui), até haver o modelo de stock.
   Comportamento: compras/faltas-comportamento.ts. CSS: css/faltas.css.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { topoErp } from '../inicio-v2';
import { ARTIGOS, FORNECEDORES, encomendas, stock, totais, type Encomenda } from './dominio';
import search from 'lucide-static/icons/search.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import fileSpreadsheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import download from 'lucide-static/icons/download.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import refreshCw from 'lucide-static/icons/refresh-cw.svg?raw';
import slidersHorizontal from 'lucide-static/icons/sliders-horizontal.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import columns3 from 'lucide-static/icons/columns-3.svg?raw';
import packageX from 'lucide-static/icons/package-x.svg?raw';
import shoppingCart from 'lucide-static/icons/shopping-cart.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import box from 'lucide-static/icons/box.svg?raw';
import building from 'lucide-static/icons/building-2.svg?raw';
import wandSparkles from 'lucide-static/icons/wand-sparkles.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import zap from 'lucide-static/icons/zap.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';
import activity from 'lucide-static/icons/activity.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import arrowUpDown from 'lucide-static/icons/arrow-up-down.svg?raw';

export const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-lucide="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export const euros = (c: number | null) => c === null ? '—' : (c / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const dataPt = (iso: string) => iso.split('-').reverse().join('/');

/* ---------- o que ainda não está no protótipo: de exemplo, por artigo ---------- */
type Extra = { custo: number | null; classe: 'A' | 'B' | 'C'; ind: 'Auto' | 'Indústria'; fam: string; sub: string; min: number; econ: number; tipo: 'Normal' | 'Urgente' | 'Consignação'; equiv: string; opcoes: string[]; conjunto: string; cliente: string; rutura: string; pedida: number; consig: number; conta: string; custoData: string };
const E = (classe: Extra['classe'], ind: Extra['ind'], fam: string, sub: string, min: number, econ: number, tipo: Extra['tipo'], equiv: string, opcoes: string[], conjunto: string, cliente: string, rutura: string, pedida: number, consig: number, conta: string, custoData: string): Omit<Extra, 'custo'> => ({ classe, ind, fam, sub, min, econ, tipo, equiv, opcoes, conjunto, cliente, rutura, pedida, consig, conta, custoData });
const EXTRA: Record<string, Omit<Extra, 'custo'>> = {
  '0 986 424 797': E('A', 'Auto', 'Travagem', 'Pastilhas', 24, 12, 'Urgente', 'TRW GDB1550', ['Subst.'], '—', 'Auto Mondego', '2026-10-17', 8, 0, 'F00031', '2026-09-22'),
  'GDB2042': E('A', 'Auto', 'Travagem', 'Pastilhas', 20, 10, 'Urgente', 'BOSCH 0 986 494 524', ['Subst.'], '—', 'Recauchutagem Mondego', '2026-10-19', 6, 0, 'F00044', '2026-09-30'),
  '826210': E('B', 'Auto', 'Embraiagem', 'Kits', 6, 2, 'Normal', 'LUK 623 3087 00', [], 'Kit 3 peças', 'Oficina Central', '2026-10-21', 2, 0, 'F00052', '2026-08-14'),
  'P 23 133': E('B', 'Auto', 'Travagem', 'Pastilhas', 12, 6, 'Normal', 'TRW GDB1330', ['Consig.'], '—', '—', '2026-10-20', 0, 4, 'F00027', '2026-09-03'),
  'K015603XS': E('B', 'Auto', 'Distribuição', 'Kits de distribuição', 15, 5, 'Normal', 'SKF VKMA 01250', [], 'Kit c/ bomba', 'Auto Mondego', '2026-10-22', 3, 0, 'F00019', '2026-09-18'),
  'GDB1330': E('A', 'Auto', 'Travagem', 'Pastilhas', 30, 10, 'Normal', 'BOSCH 0 986 424 707', ['Subst.'], '—', '—', '2026-10-22', 0, 0, 'F00044', '2026-10-01'),
  '0 986 494 524': E('A', 'Auto', 'Travagem', 'Pastilhas', 24, 12, 'Normal', 'TRW GDB2042', [], '—', 'Pneus Beira', '2026-10-22', 4, 0, 'F00031', '2026-09-22'),
  '30205': E('B', 'Indústria', 'Rolamentos', 'Rolos cónicos', 30, 10, 'Normal', 'FAG 30205-A', ['Consig.'], '—', 'Metalúrgica Lis', '2026-10-21', 10, 6, 'F00002', '2026-09-12'),
};

export interface Falta extends Extra { ref: string; desc: string; marca: string; forn: string; fornNome: string; preco: number | null; stock: number; encomendada: number; sugestao: number; estado: 'rutura' | 'baixo'; refForn: string }
/** As faltas: os artigos do protótipo com o stock abaixo do mínimo (de exemplo), com o que já está encomendado. */
export function faltas(): Falta[] {
  const enc = encomendas().filter((e) => e.estado === 'Aprovada' || e.estado === 'Emitida' || e.estado === 'Parcialmente recebida');
  return ARTIGOS.flatMap((a) => {
    const x = EXTRA[a.ref]; if (!x) return [];
    const s = stock(a.ref); if (s >= x.min) return [];
    const encomendada = enc.reduce((t, e) => t + e.linhas.filter((l) => l.ref === a.ref).reduce((u, l) => u + Math.max(0, l.qtd - l.recebida), 0), 0);
    const falta = x.min * 2 + x.pedida - s - encomendada;
    const sugestao = falta > 0 ? Math.ceil(falta / x.econ) * x.econ : 0;
    const f = FORNECEDORES.find((ff) => ff.id === a.forn);
    return [{ ...x, ref: a.ref, desc: a.desc, marca: a.marca, forn: a.forn, fornNome: f?.nome ?? a.forn, preco: a.preco, stock: s, encomendada, sugestao, estado: s <= 0 ? 'rutura' : 'baixo', refForn: a.refForn, custo: a.preco === null ? null : Math.round(a.preco * .62) } as Falta];
  }).sort((p, q) => (p.estado === q.estado ? p.rutura.localeCompare(q.rutura) : p.estado === 'rutura' ? -1 : 1));
}
/** A rotação de exemplo: as saídas das últimas 12 semanas (a mesma para a mesma referência). */
export function semanas(ref: string): number[] {
  let h = 0; for (const c of ref) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return Array.from({ length: 12 }, (_, i) => { h = (h * 1103515245 + 12345) >>> 0; return 2 + (h % 9) + (i > 8 ? 3 : 0); });
}
export const encomendaAtiva = (): Encomenda | undefined => encomendas().find((e) => e.estado === 'Rascunho');

/* ---------- as colunas: as presas, as que se veem por omissão e as que se escondem ---------- */
export interface Coluna { k: string; t: string; num?: boolean; ver: boolean; presa?: boolean }
export const COLUNAS: Coluna[] = [
  { k: 'artigo', t: 'Artigo', ver: true, presa: true }, { k: 'classe', t: 'Classe', ver: true }, { k: 'refForn', t: 'Cód. art. encomenda', ver: false },
  { k: 'rutura', t: 'Data rutura', ver: true }, { k: 'stock', t: 'Stock', num: true, ver: true }, { k: 'sugestao', t: 'Sugestão', num: true, ver: true }, { k: 'tipo', t: 'Tipo enc.', ver: true }, { k: 'equiv', t: 'Equivalente', ver: false }, { k: 'opcoes', t: 'Opções', ver: false },
  { k: 'conjunto', t: 'Conjunto', ver: false }, { k: 'cliente', t: 'Cliente representado', ver: false }, { k: 'fam', t: 'Família', ver: true }, { k: 'sub', t: 'Subfamília', ver: false },
  { k: 'fornNome', t: 'Fornecedor', ver: true }, { k: 'encomendada', t: 'Qtd. encomendada', num: true, ver: true }, { k: 'pedida', t: 'Qtd. em rutura', num: true, ver: true },
  { k: 'conta', t: 'Conta', ver: false }, { k: 'preco', t: 'Preço', num: true, ver: true },
];
export function celula(f: Falta, k: string): string {
  switch (k) {
    case 'artigo': return `<span class="lf-art"><b>${esc(f.ref)}</b><small>${esc(f.marca)} · ${esc(f.desc)}</small></span>`;
    case 'classe': return `<span class="lf-classe lf-classe--${f.classe}">${f.classe}</span>`;
    case 'rutura': return `<span class="lf-estado lf-estado--${f.estado}">${f.estado === 'rutura' ? 'Rutura' : 'Abaixo do mín.'}</span><small class="lf-data">${dataPt(f.rutura)}</small>`;
    case 'tipo': return f.tipo === 'Urgente' ? `<span class="lf-tag lf-tag--urgente">${L(zap)}Urgente</span>` : `<span class="lf-tag">${f.tipo}</span>`;
    case 'opcoes': return f.opcoes.map((o) => `<span class="lf-tag">${o}</span>`).join(' ') || '—';
    case 'fornNome': return `<span class="lf-forn"><i></i>${esc(f.fornNome)}</span>`;
    case 'preco': return euros(f.preco);
    case 'stock': return `<b class="lf-stock lf-stock--${f.estado}">${f.stock}</b><small class="lf-min">mín. ${f.min}</small>`;
    case 'sugestao': return f.sugestao ? `<span class="lf-sugestao">${f.sugestao}</span>` : '<span class="lf-zero">0</span>';
    case 'encomendada': case 'pedida': return String((f as unknown as Record<string, number>)[k] || '—');
    default: return esc(String((f as unknown as Record<string, string>)[k] ?? '—'));
  }
}

/* ---------- os painéis de baixo, do artigo escolhido ---------- */
export function paineis(f: Falta | undefined): string {
  if (!f) return `<p class="lf-sem-escolha">${L(box)}Escolha um artigo na tabela para ver o stock por armazém, a classe e a rotação.</p>`;
  const sem = semanas(f.ref), max = Math.max(...sem), saidas = sem.reduce((a, b) => a + b, 0) * 7 / 12 * 1.0, entradas = Math.round(saidas * .82), saldo = entradas - Math.round(saidas);
  const pts = sem.map((v, i) => `${(i * 100 / 11).toFixed(1)},${(30 - (v / max) * 26).toFixed(1)}`).join(' ');
  const outros = [['10', 'Porto', Math.max(0, Math.round(f.min * .4) - (f.estado === 'rutura' ? 6 : 0)), '10 · 12 · 03 · 01'], ['20', 'Sacavém', Math.max(0, Math.round(f.min * .2)), '20 · 04 · 07 · 02']] as const;
  const armazens: [string, string, number, string][] = [['60', 'Coimbra', f.stock, '60 · 30 · 01 · 02'], ...outros.map((o) => [...o] as [string, string, number, string])];
  return `<section class="lf-painel" aria-labelledby="lf-pa-t"><h3 id="lf-pa-t">${L(warehouse)}Stock por armazém</h3>
    <table class="lf-mini"><thead><tr><th>Armazém</th><th>Posição</th><th class="is-num">Qtd.</th></tr></thead><tbody>${armazens.map(([n, d, q, pos]) => `<tr><td><b>${n}</b> ${d}</td><td class="lf-pos">${pos}</td><td class="is-num${q <= 0 ? ' is-zero' : ''}">${q}</td></tr>`).join('')}</tbody></table>
    <p class="lf-painel-nota">${esc(f.desc)} · ${esc(f.ref)}</p></section>
  <section class="lf-painel" aria-labelledby="lf-pb-t"><h3 id="lf-pb-t">${L(layers)}Classes de reposição</h3>
    <ul class="lf-arvore">${([['A', 'Rotação alta', 'repõe-se todas as semanas'], ['B', 'Rotação média', 'repõe-se de 15 em 15 dias'], ['C', 'Rotação baixa', 'repõe-se por pedido']] as const).map(([c, t, d]) => `<li class="${c === f.classe ? 'is-esta' : ''}"><span class="lf-classe lf-classe--${c}">${c}</span><span><b>${t}</b><small>${d}</small></span>${c === f.classe ? `<small class="lf-esta">${L(check)}este artigo</small>` : ''}</li>`).join('')}
      <li class="lf-arvore-sub">${esc(f.fam)} › ${esc(f.sub)}</li></ul></section>
  <section class="lf-painel lf-painel--rot" aria-labelledby="lf-pc-t"><h3 id="lf-pc-t">${L(activity)}Rotação · últimos 90 dias</h3>
    <div class="lf-rot-numeros"><div><small>Entradas</small><b>${entradas}</b></div><div><small>Saídas</small><b>${Math.round(saidas)}</b></div><div><small>Saldo</small><b class="${saldo < 0 ? 'is-neg' : ''}">${saldo > 0 ? '+' : ''}${saldo}</b></div></div>
    <svg class="lf-linha" viewBox="0 0 100 32" preserveAspectRatio="none" aria-label="Saídas das últimas 12 semanas"><polyline points="${pts}"/><polyline class="is-area" points="0,32 ${pts} 100,32"/></svg>
    <dl class="lf-rot-dados"><div><dt>Qtd. económica</dt><dd>${f.econ}</dd></div><div><dt>Stock mínimo</dt><dd>${f.min}</dd></div><div><dt>Qtd. stock</dt><dd>${f.stock}</dd></div><div><dt>Qtd. consignada</dt><dd>${f.consig}</dd></div>
      <div><dt>Preço médio</dt><dd>${euros(f.preco === null ? null : Math.round(f.preco * .97))}</dd></div><div><dt>Último preço de custo</dt><dd>${euros(f.custo)}<small>${dataPt(f.custoData)}</small></dd></div></dl></section>`;
}

/* ---------- o ecrã ---------- */
export type CenarioFaltas = 'normal' | 'carregar' | 'sem-resultados' | 'erro' | 'offline' | 'primeira' | 'filtros' | 'vazia' | 'sem-ativa' | 'sem-fornecedor' | 'avancados';
export type IdFaltas = 'compras-faltas' | `faltas-${Exclude<CenarioFaltas, 'normal'>}`;

function vazio(ic: string, t: string, d: string, acao = ''): string { return `<div class="lf-vazio">${L(ic)}<b>${t}</b><p>${d}</p>${acao}</div>`; }
const BTN = (t: string, i: string, extra = '', cls = '') => `<button type="button" class="lf-btn${cls ? ` ${cls}` : ''}"${extra}>${L(i)}<span>${t}</span></button>`;

function tabela(lista: Falta[], cen: CenarioFaltas): string {
  if (cen === 'carregar') return `<div class="lf-esqueleto">${Array.from({ length: 7 }, () => '<i></i>').join('')}</div>`;
  if (cen === 'erro') return vazio(circleAlert, 'Não foi possível carregar as faltas.', 'O servidor não respondeu (ERP-COMP-502). O que tinha nos filtros ficou.', BTN('Tentar outra vez', refreshCw, ' data-lf-repetir', 'lf-btn--acao'));
  if (cen === 'offline') return vazio(wifiOff, 'Sem ligação.', 'A lista precisa do servidor. Volta sozinha quando a ligação voltar.', BTN('Tentar outra vez', refreshCw, ' data-lf-repetir'));
  if (cen === 'primeira') return vazio(slidersHorizontal, 'Escolha o que quer ver.', 'Comece pelo armazém e pela classe; os filtros ficam guardados para a próxima vez.', BTN('Ver as faltas do armazém 60', check, ' data-lf-primeira', 'lf-btn--acao'));
  if (cen === 'vazia') return vazio(circleCheck, 'Sem faltas.', 'Nenhum artigo está em rutura nem abaixo do mínimo no armazém 60.');
  if (cen === 'filtros') return vazio(searchX, 'Nenhum artigo com estes filtros.', 'Há 8 faltas no total; tire um filtro, ou limpe-os.', BTN('Limpar filtros', x, ' data-lf-limpar'));
  if (cen === 'sem-resultados') return vazio(searchX, 'Nada encontrado para «VKMA 9999».', 'Confirme o código; a pesquisa procura a referência, o código do fornecedor e o EAN.', BTN('Limpar a pesquisa', x, ' data-lf-limpar'));
  return `<div class="lf-rolo"><table class="lf-tabela" aria-label="Artigos em falta">
    <thead><tr><th class="lf-sel is-presa"><input type="checkbox" aria-label="Escolher todos" data-lf-todos></th>${COLUNAS.map((c) => `<th class="${c.presa ? 'is-presa is-presa2' : ''}${c.num ? ' is-num' : ''}" data-col="${c.k}"${c.ver ? '' : ' hidden'}><button type="button" data-lf-ordem="${c.k}">${c.t}${L(arrowUpDown)}</button></th>`).join('')}</tr></thead>
    <tbody>${lista.map((f, i) => `<tr data-lf-ref="${esc(f.ref)}" class="${i === 0 ? 'is-escolhida' : ''}" style="--i:${i}"><td class="lf-sel is-presa"><input type="checkbox" aria-label="Escolher ${esc(f.ref)}" data-lf-marcar></td>${COLUNAS.map((c) => `<td class="${c.presa ? 'is-presa is-presa2' : ''}${c.num ? ' is-num' : ''}" data-col="${c.k}"${c.ver ? '' : ' hidden'}>${celula(f, c.k)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

function html(cen: CenarioFaltas): string {
  const lista = faltas();
  const ativa = cen === 'sem-ativa' ? undefined : encomendaAtiva();
  const t = ativa ? totais(ativa) : undefined;
  const fornAtiva = ativa ? FORNECEDORES.find((f) => f.id === ativa.forn)?.nome ?? ativa.forn : '';
  const sel = cen === 'normal' || cen === 'avancados' || cen === 'sem-ativa' || cen === 'sem-fornecedor' ? lista[0] : undefined;
  const rutura = lista.filter((f) => f.estado === 'rutura').length;
  const fornecedores = [...new Set(lista.map((f) => f.fornNome))];
  const campo = (id: string, rotulo: string, input: string) => `<label class="lf-campo" for="lf-${id}-${cen}"><span>${rotulo}</span>${input}</label>`;
  const sel_ = (id: string, rotulo: string, opcoes: string[], escolhida = 0) => campo(id, rotulo, `<select id="lf-${id}-${cen}" data-lf-filtro="${id}" data-lf-campo>${opcoes.map((o, i) => `<option${i === escolhida ? ' selected' : ''}>${o}</option>`).join('')}</select>`);
  return `<div class="hm lf${cen === 'avancados' ? ' is-avancados' : ''}" data-hm data-lf data-lf-cenario="${cen}">
  ${topoErp([['ERP', 'inicio'], ['Compras', 'compras'], ['Lista de faltas', '']])}
  <header class="lf-cabeca">
    <div><h1 class="lf-titulo">Lista de faltas</h1><p class="lf-sub">${cen === 'carregar' ? 'A carregar…' : `<b>${rutura}</b> em rutura e <b>${lista.length - rutura}</b> abaixo do mínimo, no armazém 60 · o que comprar.`}</p></div>
    <label class="lf-procura">${L(search)}<input type="search" placeholder="Código, referência ou EAN" aria-label="Pesquisa rápida por código ou referência" value="${cen === 'sem-resultados' ? 'VKMA 9999' : ''}" data-lf-procura></label>
    <div class="lf-accoes">
      ${BTN('Nova encomenda', plus, ' data-lf-acao="nova"', 'lf-btn--acao')}
      ${BTN('Gerar proposta', fileSpreadsheet, ` data-lf-acao="proposta"${cen === 'sem-fornecedor' ? ' aria-describedby="lf-forn-falta"' : ''}`)}
      <span class="lf-icones">${[[download, 'Exportar', 'exportar'], [printer, 'Imprimir', 'imprimir'], [refreshCw, 'Atualizar', 'atualizar']].map(([i, t, a]) => `<button type="button" class="lf-icone" aria-label="${t}" title="${t}" data-lf-acao="${a}">${L(i)}</button>`).join('')}</span>
    </div>
  </header>

  <section class="lf-filtros" aria-label="Filtros">
    <div class="lf-rapidos">
      <div class="lf-seg" role="group" aria-label="Indústria ou auto">${['Todos', 'Auto', 'Indústria'].map((o, i) => `<button type="button" aria-pressed="${i === 0}" data-lf-ind="${o}">${o}</button>`).join('')}</div>
      ${sel_('armazem', 'Armazém', ['60 · Coimbra', 'Todos', '10 · Porto', '20 · Sacavém'])}
      <div class="lf-classes" role="group" aria-label="Classe">${['A', 'B', 'C'].map((c) => `<button type="button" class="lf-classe lf-classe--${c}" aria-pressed="true" data-lf-cl="${c}">${c}</button>`).join('')}</div>
      ${sel_('stock', 'Stock', ['Rutura e abaixo do mínimo', 'Só em rutura', 'Só abaixo do mínimo'])}
      ${sel_('fornecedor', 'Fornecedor', ['Todos', ...fornecedores], cen === 'filtros' ? 1 : 0)}
      <button type="button" class="lf-mais" data-lf-avancados aria-expanded="${cen === 'avancados'}" aria-controls="lf-av-${cen}">${L(slidersHorizontal)}Filtros avançados${L(chevronDown, 'lf-mais-seta')}</button>
    </div>
    <div class="lf-avancados" id="lf-av-${cen}"${cen === 'avancados' ? '' : ' hidden'}>
      ${sel_('encforn', 'Encomenda fornecedor', ['Todas', 'Com encomenda', 'Sem encomenda'])}
      ${sel_('enccli', 'Encomenda cliente', ['Todas', 'Com encomenda de cliente', 'Sem encomenda de cliente'])}
      ${campo('inicio', 'Pesquisa iniciada por', `<input id="lf-inicio-${cen}" type="text" placeholder="ex.: GDB" data-lf-campo>`)}
      ${sel_('tipo', 'Tipo de encomenda', ['Todos', 'Normal', 'Urgente', 'Consignação'])}
      ${campo('de', 'Rutura desde', `<input id="lf-de-${cen}" type="date" value="2026-10-01" data-lf-campo>`)}
      ${campo('ate', 'Até', `<input id="lf-ate-${cen}" type="date" value="2026-10-22" data-lf-campo>`)}
      ${campo('codigo', 'Código / referência', `<input id="lf-codigo-${cen}" type="text" placeholder="Enter aplica" data-lf-campo data-lf-ultimo>`)}
    </div>
    <div class="lf-ativos">
      <span class="lf-ativos-t">Ativos:</span>
      <span class="lf-chip">Armazém 60<button type="button" aria-label="Tirar o filtro do armazém" data-lf-tirar="armazem">${L(x)}</button></span>
      <span class="lf-chip">Rutura e abaixo do mínimo<button type="button" aria-label="Tirar o filtro do stock" data-lf-tirar="stock">${L(x)}</button></span>
      ${cen === 'filtros' ? `<span class="lf-chip">${esc(fornecedores[0])}<button type="button" aria-label="Tirar o filtro do fornecedor" data-lf-tirar="fornecedor">${L(x)}</button></span>` : ''}
      <button type="button" class="lf-ligacao" data-lf-limpar>Limpar filtros</button>
      <button type="button" class="lf-btn lf-btn--aplicar" data-lf-aplicar>${L(check)}<span>Aplicar</span></button>
    </div>
  </section>

  <div class="lf-corpo">
    <section class="lf-ativa${ativa ? '' : ' is-falta'}" aria-label="Encomenda ativa">
      ${ativa && t ? `<div class="lf-ativa-cab"><span class="lf-ativa-ic">${L(shoppingCart)}</span><div><small>Encomenda ativa</small><b>${esc(ativa.ref)}</b></div><span class="lf-estado lf-estado--rascunho">${esc(ativa.estado)}</span></div>
        <dl class="lf-ativa-dados"><div><dt>Data</dt><dd>${dataPt(ativa.data)}</dd></div><div><dt>Fornecedor</dt><dd>${esc(fornAtiva)}</dd></div><div><dt>Valor líquido</dt><dd class="lf-valor">${euros(t.liquido)}</dd></div><div><dt>Linhas</dt><dd>${ativa.linhas.length}</dd></div></dl>
        ${ativa.notas ? `<p class="lf-ativa-nota">${L(circleAlert)}${esc(ativa.notas)}</p>` : ''}
        <div class="lf-ativa-accoes">${BTN('Adicionar escolhidos', plus, ' data-lf-acao="adicionar"', 'lf-btn--acao lf-btn--peq')}${BTN('Abrir', fileText, ' data-lf-acao="abrir-enc"', 'lf-btn--peq')}</div>`
      : `<div class="lf-ativa-cab"><span class="lf-ativa-ic">${L(shoppingCart)}</span><div><small>Encomenda ativa</small><b>Nenhuma</b></div></div><p class="lf-ativa-nota">Os artigos escolhidos precisam de uma encomenda para onde ir.</p><div class="lf-ativa-accoes">${BTN('Criar encomenda', plus, ' data-lf-acao="nova"', 'lf-btn--acao lf-btn--peq')}</div>`}
    </section>

    <section class="lf-lista" aria-label="Artigos em falta">
      <div class="lf-barra">
        <p class="lf-contagem" data-lf-contagem>${cen === 'carregar' ? '' : `<b>${lista.length}</b> artigos`}<span data-lf-escolhidos></span></p>
        <div class="lf-rapidas" role="toolbar" aria-label="Ações rápidas">
          ${BTN('Gerar ruturas', packageX, ' data-lf-acao="ruturas"')}${BTN('Ajudar à compra', wandSparkles, ' data-lf-acao="ajudar"')}${BTN('Criar encomenda', shoppingCart, ' data-lf-acao="criar"')}${BTN('Apoiar proposta', fileSpreadsheet, ' data-lf-acao="proposta"')}
          ${BTN('Histórico', history, ' data-lf-acao="historico"')}${BTN('Artigo', box, ' data-lf-acao="artigo"')}${BTN('Fornecedor', building, ' data-lf-acao="fornecedor"')}${BTN('Exportar análise', download, ' data-lf-acao="analise"')}
          <span class="lf-colunas"><button type="button" class="lf-icone" aria-label="Mostrar e esconder colunas" aria-expanded="false" data-lf-colunas>${L(columns3)}</button>
            <div class="lf-colunas-menu" hidden role="group" aria-label="Colunas">${COLUNAS.filter((c) => !c.presa).map((c) => `<label><input type="checkbox" data-lf-ver="${c.k}"${c.ver ? ' checked' : ''}>${c.t}</label>`).join('')}</div></span>
        </div>
      </div>
      ${cen === 'sem-fornecedor' ? `<p class="lf-faixa" id="lf-forn-falta">${L(building)}Para gerar a proposta, escolha um fornecedor nos filtros: cada proposta é de um só fornecedor.</p>` : ''}
      ${tabela(lista, cen)}
    </section>
  </div>

  <div class="lf-baixo" data-lf-paineis>${paineis(sel)}</div>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

const NOTA = 'A Lista de faltas (22 out., briefing do ecrã de Compras «Lista de faltas / Ruturas / Reposição», «simples e wow»): filtros rápidos e avançados, a encomenda ativa, a tabela com as faltas e, em baixo, o stock por armazém, a classe e a rotação';
export function ecrasFaltas(): Ecra<IdErp>[] {
  const v = (cen: CenarioFaltas) => [{ id: 'v1', nota: NOTA, html: html(cen) }] as Ecra<IdErp>['versoes'];
  const e = (cen: Exclude<CenarioFaltas, 'normal'>, nome: string, objetivo: string): Ecra<IdErp> => ({ id: `faltas-${cen}` as IdErp, nome, fluxo: 'Compras', estadoDe: 'compras-faltas' as IdErp, objetivo, versoes: v(cen) });
  return [
    { id: 'compras-faltas' as IdErp, nome: '20 · Lista de faltas', fluxo: 'Compras', objetivo: 'Os artigos em rutura ou abaixo do mínimo e o que comprar: filtrar, ver a encomenda ativa, escolher artigos e juntá-los, e, do artigo escolhido, o stock por armazém, a classe e a rotação. Enter passa ao campo seguinte.', versoes: v('normal') },
    e('avancados', '20.1 · Filtros avançados', 'Os filtros avançados abertos: encomenda de fornecedor e de cliente, «pesquisa iniciada por», tipo, datas e código; Enter passa ao seguinte e, no último, aplica.'),
    e('carregar', '20.2 · A carregar', 'Os filtros e a encomenda ativa já servem; a tabela em esqueleto, do tamanho das linhas.'),
    e('sem-resultados', '20.3 · Sem resultados', 'A pesquisa rápida não encontrou o código: diz o que procurou e onde procura.'),
    e('filtros', '20.4 · Filtros sem correspondência', 'Os filtros não deixam nenhuma falta: quantas há sem eles e «Limpar filtros».'),
    e('vazia', '20.5 · Sem faltas', 'Nenhum artigo em rutura nem abaixo do mínimo: diz-se, sem ilustrações.'),
    e('primeira', '20.6 · Primeira utilização', 'Ainda sem filtros guardados: começar pelo armazém e pela classe.'),
    e('erro', '20.7 · Erro', 'O servidor não respondeu: a referência do erro e «Tentar outra vez»; os filtros ficam.'),
    e('offline', '20.8 · Sem ligação', 'Sem rede: a lista não carrega e volta sozinha.'),
    e('sem-ativa', '20.9 · Sem encomenda ativa', 'Não há encomenda em rascunho: o bloco diz para onde iriam os artigos e oferece «Criar encomenda».'),
    e('sem-fornecedor', '20.10 · Sem fornecedor escolhido', '«Gerar proposta» precisa de um fornecedor: a faixa diz porquê, ao pé da tabela.'),
  ];
}
