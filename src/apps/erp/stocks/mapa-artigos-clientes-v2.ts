/* =========================================================
   ERP — Stocks ▸ Mapas ▸ 75 · Artigos/Clientes, v2 (19 nov. 2026), do briefing dela «Redesign do módulo
   Artigos/Clientes». A v1 (stocks/mapa-artigos-clientes.ts) fica no código e sai da lista.
     - Fica tudo da v1: Por artigo (Ctrl+F1) e Por cliente (Ctrl+F2); Iniciado por / Contendo / Igual a
       (Shift+F1–F3), que o IDE leva para a barra de cima; as hipóteses enquanto se escreve (↑ ↓ Enter); o outro
       campo (cliente ou artigo) filtra; período e tipo de documento; uma faixa por cliente (ou artigo) com as linhas;
       «Ver o que comprou / quem comprou» e Voltar; as colunas todas; F9, F11, Excel; os estados de erro;
     - novo: o escolhido fica à vista com Trocar (os filtros ficam); família no modo cliente; filtros aplicados à
       vista; indicadores com hierarquia (valor líquido sem IVA, com as notas de crédito a abater; quantidade;
       clientes ou artigos; preço médio líquido; documentos; última venda); informação factual (quem mais comprou,
       o intervalo do preço líquido, a concentração); quatro vistas — Tabela (faixas que abrem e fecham, ordenar as
       faixas, colunas por grupos), Cartões (um por cliente ou artigo, com Ver documentos e Ver compras), Hierarquia
       (Artigo › Clientes › Documentos; Cliente › Família › Subfamília › Artigo › Documentos) e Análise; o detalhe do
       cliente, do artigo ou do documento numa janela.
   Regras (stocks/vendas.ts): o preço líquido é o preço sem IVA com o desconto 1 e depois o desconto 2; o valor é
   preço líquido × quantidade, sem IVA; as notas de crédito têm quantidade negativa e abatem; cada linha conta uma
   vez (um documento não repete o artigo). O grafo de relações não entra: com um cliente ou um artigo de cada vez,
   a hierarquia e as barras da análise já mostram as ligações e o seu peso sem uma rede difícil de ler.
   CSS: css/mapa-artigos-clientes-v2.css, sobre o do 78 v2, do 77 v2 e do 76 v2.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { topoErp } from '../inicio-v2';
import { L, esc } from '../espaco';
import { BTN } from '../compras/docs-v2';
import { ARTIGOS, artigo, dia, HOJE } from '../compras/dominio';
import { xlsx, descarregar, type Celula } from '../compras/xlsx';
import { familiaDe } from '../ficheiros/ecras';
import { subfamiliaDe } from './mapa-stocks';
import { CLIENTES, cliente, vendas, NOME_VENDA, type LinhaVenda, type TipoVenda } from './vendas';
import usersIc from 'lucide-static/icons/users.svg?raw';
import boxes from 'lucide-static/icons/boxes.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import sheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import funnelX from 'lucide-static/icons/funnel-x.svg?raw';
import columns from 'lucide-static/icons/columns-3.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import grid from 'lucide-static/icons/layout-grid.svg?raw';
import table from 'lucide-static/icons/table-2.svg?raw';
import chartBar from 'lucide-static/icons/chart-bar.svg?raw';
import folderTree from 'lucide-static/icons/folder-tree.svg?raw';
import folder from 'lucide-static/icons/folder.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import user from 'lucide-static/icons/user.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import euroIc from 'lucide-static/icons/euro.svg?raw';
import calendar from 'lucide-static/icons/calendar.svg?raw';
import tag from 'lucide-static/icons/tag.svg?raw';
import chevR from 'lucide-static/icons/chevron-right.svg?raw';
import chevD from 'lucide-static/icons/chevron-down.svg?raw';
import arrowLeftRight from 'lucide-static/icons/arrow-left-right.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import lightbulb from 'lucide-static/icons/lightbulb.svg?raw';
import loader from 'lucide-static/icons/loader-circle.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';

/* ---------- números ---------- */
const NF = new Intl.NumberFormat('pt-PT', { useGrouping: 'always' } as unknown as Intl.NumberFormatOptions);
const EF = new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' } as unknown as Intl.NumberFormatOptions);
const nf = (n: number) => (n < 0 ? '−' : '') + NF.format(Math.abs(n));
const eur = (c: number) => (c < 0 ? '−' : '') + EF.format(Math.abs(c) / 100) + ' €';
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : '—');
const pl = (n: number, um: string, varios: string) => `${nf(n)} ${n === 1 ? um : varios}`;
const sem = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
const somaQ = (ls: LinhaVenda[]) => ls.reduce((s, l) => s + l.qtd, 0);
const somaV = (ls: LinhaVenda[]) => ls.reduce((s, l) => s + l.valor, 0);
const comIva = (ls: LinhaVenda[]) => ls.reduce((s, l) => s + Math.round(l.valor * (1 + l.iva / 10000)), 0);
const docs = (ls: LinhaVenda[]) => new Set(ls.map((l) => l.doc)).size;
const ultima = (ls: LinhaVenda[]) => ls.reduce<LinhaVenda | undefined>((u, l) => (!u || l.data > u.data || (l.data === u.data && l.doc > u.doc) ? l : u), undefined);
const unids = (ls: LinhaVenda[]) => [...new Set(ls.map((l) => l.un))];
const qtdTxt = (ls: LinhaVenda[]) => unids(ls).length === 1 ? `${nf(somaQ(ls))} ${esc(unids(ls)[0])}` : `${nf(somaQ(ls))} <small title="Unidades diferentes">unid. mistas</small>`;
const famDe = (ref: string) => familiaDe(artigo(ref)?.desc ?? '');
const subDe = (ref: string) => subfamiliaDe(artigo(ref)?.desc ?? '');

/* ---------- o estado ---------- */
type Modo = 'artigo' | 'cliente';
type Comp = 'inicio' | 'contem' | 'igual';
type Vista = 'tabela' | 'cartoes' | 'hierarquia' | 'analise';
type GCol = 'req' | 'desc';
interface Est {
  modo: Modo; comp: Comp; q: string; art: string; cli: string; outro: string; de: string; ate: string; tipo: string; fam: string; hip: number; sugAberta: boolean;
  vista: Vista; ordemG: 'valor' | 'qtd' | 'data' | 'nome'; fechadas: string[]; abertos: string[]; grupos: GCol[]; colsAberto: boolean; antes: { modo: Modo; art: string; cli: string } | null;
  jan: { tipo: 'cli' | 'art' | 'doc'; id: string } | null; fase: 'ok' | 'carregar' | 'atualizar' | 'erro'; erro?: 'servidor' | 'offline' | 'sessao' | 'permissao'; aviso: string; editor: boolean;
}
const CHAVE = 'erp:stocks:mapa-ac-v2';
const guardado = (): Partial<Est> => { try { return JSON.parse(localStorage.getItem(CHAVE) ?? '{}'); } catch { return {}; } };
const novo = (): Est => {
  const editor = document.body.classList.contains('editando'), g = editor ? {} : guardado();
  return { modo: g.modo ?? 'artigo', comp: 'inicio', q: '', art: '', cli: '', outro: '', de: '', ate: '', tipo: '', fam: '', hip: 0, sugAberta: false, vista: g.vista ?? 'tabela', ordemG: 'valor', fechadas: [], abertos: [], grupos: g.grupos ?? ['req', 'desc'], colsAberto: false, antes: null, jan: null, fase: 'ok', aviso: '', editor };
};
const guardar = (e: Est) => { if (!e.editor) try { localStorage.setItem(CHAVE, JSON.stringify({ modo: e.modo, vista: e.vista, grupos: e.grupos })); } catch { /* */ } };
const estados = new WeakMap<HTMLElement, Est>();
const de = (r: HTMLElement) => { let e = estados.get(r); if (!e) { e = novo(); estados.set(r, e); } return e; };
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
const raiz = (t: Element | null) => t?.closest<HTMLElement>('[data-mac2]') ?? null;
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-mac2]');
const escolhido = (e: Est) => (e.modo === 'artigo' ? e.art : e.cli);
const compara = (c: Comp, v: string, q: string) => { const a = sem(v), b = sem(q); return c === 'igual' ? a === b : c === 'contem' ? a.includes(b) : a.startsWith(b); };
/** As hipóteses da pesquisa: artigos (referência ou descrição) ou clientes (número ou nome). */
function hipoteses(e: Est): { id: string; t: string; d: string }[] {
  const q = e.q.trim(); if (!q) return [];
  return e.modo === 'artigo'
    ? ARTIGOS.filter((a) => compara(e.comp, a.ref, q) || compara(e.comp, a.desc, q)).slice(0, 8).map((a) => ({ id: a.ref, t: a.ref, d: a.desc }))
    : CLIENTES.filter((c) => compara(e.comp, c.num, q) || compara(e.comp, c.nome, q)).slice(0, 8).map((c) => ({ id: c.num, t: `${c.num} · ${c.nome}`, d: c.cidade }));
}
/** As linhas da consulta: as do escolhido, com o período, o tipo, o outro campo e a família. */
function linhas(e: Est): LinhaVenda[] {
  const id = escolhido(e); if (!id) return [];
  return vendas().filter((l) => (e.modo === 'artigo' ? l.ref === id : l.cli === id) && (!e.de || l.data >= e.de) && (!e.ate || l.data <= e.ate) && (!e.tipo || l.tipo === e.tipo)
    && (!e.outro || (e.modo === 'artigo' ? l.cli === e.outro : l.ref === e.outro)) && (!e.fam || e.modo !== 'cliente' || famDe(l.ref) === e.fam));
}
const chaveG = (e: Est, l: LinhaVenda) => (e.modo === 'artigo' ? l.cli : l.ref);
const nomeG = (e: Est, k: string) => (e.modo === 'artigo' ? cliente(k)?.nome ?? k : artigo(k)?.desc ?? k);
function gruposDe(e: Est, ls: LinhaVenda[]): [string, LinhaVenda[]][] {
  const m = new Map<string, LinhaVenda[]>(); ls.forEach((l) => { const k = chaveG(e, l); m.set(k, [...(m.get(k) ?? []), l]); });
  const f = { valor: (x: LinhaVenda[]) => -somaV(x), qtd: (x: LinhaVenda[]) => -somaQ(x), data: (x: LinhaVenda[]) => -Date.parse(ultima(x)!.data), nome: () => 0 }[e.ordemG];
  return [...m].sort((a, b) => f(a[1]) - f(b[1]) || nomeG(e, a[0]).localeCompare(nomeG(e, b[0]), 'pt'));
}

/* ---------- a página ---------- */
const op = (v: string, t: string) => `<option value="${esc(v)}">${esc(t)}</option>`;
function html(cen: string): string {
  const id = (x: string) => `mac2-${x}-${cen}`;
  const B = (k: string, ic: string, t: string, tecla: string, cls = '') => BTN(k, ic, t, tecla, '', cls).replace('data-dv2-acao', 'data-mac2-acao');
  const VIS: [Vista, string, string][] = [['tabela', 'Tabela', table], ['cartoes', 'Cartões', grid], ['hierarquia', 'Hierarquia', folderTree], ['analise', 'Análise', chartBar]];
  return `<div class="hm ak lf2 dv2 mac minv2 mva2 mst2 mac2" data-hm data-mac2 data-mac2-cenario="${cen}" data-teclas="F9 F11 Escape">
  ${topoErp([['ERP', 'inicio'], ['Stocks', ''], ['Mapas', ''], ['Artigos/Clientes', '']])}
  <header class="ak-cab lf2-cab"><span class="ak-cab-ic">${L(usersIc)}</span>
    <div><h1>Artigos / Clientes</h1><p>Analise as relações comerciais entre artigos, clientes e documentos de venda.</p></div></header>
  <div class="ak-barra lf2-barra mac2-barra" role="toolbar" aria-label="Ações">
    ${B('atualizar', refresh, 'Atualizar', 'F9')}${B('imprimir', printer, 'Imprimir', 'F11')}<i class="ak-sep" aria-hidden="true"></i>${B('excel', sheet, 'Exportar para Excel', '')}<i class="ak-sep" aria-hidden="true"></i>
    <span class="mst-valz mac2-modo" role="radiogroup" aria-label="Consultar"><small>Consultar</small><button type="button" role="radio" aria-checked="true" data-mac2-modo="artigo" title="Por artigo: quem o comprou (Ctrl+F1)">${L(boxes)}Por artigo<kbd>Ctrl+F1</kbd></button><button type="button" role="radio" aria-checked="false" data-mac2-modo="cliente" title="Por cliente: o que comprou (Ctrl+F2)">${L(usersIc)}Por cliente<kbd>Ctrl+F2</kbd></button></span>
    <span class="ak2-esp"></span>
    <span class="minv2-vistas" role="group" aria-label="Vista">${VIS.map(([k, t, ic], i) => `<button type="button" data-mac2-vista="${k}" aria-pressed="${i === 0}" title="Vista ${t.toLowerCase()}">${L(ic)}<span>${t}</span></button>`).join('')}</span>
  </div>
  <form class="minv2-filtros mva2-filtros mac2-filtros" novalidate aria-label="Pesquisa e filtros">
    <div class="ak-campo mva2-pesq" role="group" aria-labelledby="${id('pq')}"><span id="${id('pq')}" data-mac2-pq-t>Artigo</span>
      <div class="mva2-pq">
        <span class="lf2-comp" role="radiogroup" aria-label="Como compara">${([['inicio', 'Iniciado por', 'Shift+F1'], ['contem', 'Contendo', 'Shift+F2'], ['igual', 'Igual a', 'Shift+F3']] as const).map(([k, t, tc], i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-mac2-comp="${k}" title="Pesquisa ${t.toLowerCase()} (${tc})">${t}</button>`).join('')}</span>
        <div class="minv2-pesq-c mac2-pesq-c">${L(search)}<input type="search" data-mac2-q autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id('sug')}" aria-labelledby="${id('pq')}">
          <ul class="mac2-sug" id="${id('sug')}" role="listbox" data-mac2-sug hidden></ul></div>
        <span class="mac2-esc" data-mac2-esc hidden></span>
      </div></div>
    <div class="ak-campo dv2-periodo" role="group" aria-labelledby="${id('per')}"><span id="${id('per')}">Período</span><span class="ak2-per"><input type="date" data-mac2-f="de" aria-label="Período — de"><i>a</i><input type="date" data-mac2-f="ate" aria-label="Período — até"></span></div>
    <label class="ak-campo"><span>Tipo de documento</span><select data-mac2-f="tipo">${op('', 'Todos')}${(Object.keys(NOME_VENDA) as TipoVenda[]).map((k) => op(k, `${k} · ${NOME_VENDA[k]}`)).join('')}</select></label>
    <span class="minv2-filtros-bts"><button type="button" class="ak-btn ak-btn--linha" data-mac2-acao="limpar">${L(funnelX)}<span>Limpar filtros</span></button></span>
    <div class="minv2-mais mac2-mais">
      <label class="ak-campo" data-mac2-outro-c><span data-mac2-outro-t>Cliente</span><select data-mac2-f="outro"></select></label>
      <label class="ak-campo" data-mac2-fam-c hidden><span>Família</span><select data-mac2-f="fam">${op('', 'Todas')}${[...new Set(ARTIGOS.map((a) => familiaDe(a.desc)))].sort((a, b) => a.localeCompare(b, 'pt')).map((f) => op(f, f)).join('')}</select></label>
    </div>
  </form>
  <ul class="mva2-chips" data-mac2-chips aria-label="Filtros aplicados"></ul>
  <section class="minv2-kpis mac2-kpis" data-mac2-kpis aria-label="Resumo"></section>
  <section class="lf2-lista dv2-lista minv2-lista mac2-lista">
    <div class="lf2-lista-cab minv2-lista-cab"><h2 data-mac2-t>Vendas</h2><p class="lf2-resumo" data-mac2-resumo></p>
      <label class="minv2-ordem" data-mac2-ordem-c><span>Ordenar</span><select data-mac2-ordem aria-label="Ordenar as faixas">${op('valor', 'Valor (maior primeiro)')}${op('qtd', 'Quantidade (maior primeiro)')}${op('data', 'Última compra (mais recente)')}${op('nome', 'Nome (A–Z)')}</select></label>
      <span class="mst2-cols-c" data-mac2-cols-c><button type="button" class="ak-btn ak-btn--linha" data-mac2-acao="colunas" aria-expanded="false">${L(columns)}<span>Colunas</span></button>
        <div data-por-cima class="mst2-cols" data-mac2-cols role="group" aria-label="Grupos de colunas" hidden><label><input type="checkbox" data-mac2-gcol="req" checked><span>Requisição e unidade</span></label><label><input type="checkbox" data-mac2-gcol="desc" checked><span>Descontos e IVA</span></label></div></span>
      <button type="button" class="ak-btn ak-btn--linha" data-mac2-acao="faixas" hidden><span>Fechar todas</span></button></div>
    <nav class="mst2-migalhas" data-mac2-migalhas aria-label="Caminho" hidden></nav>
    <div class="lf2-grelha lf2-grelha--ajusta minv2-g mac2-g" data-mac2-g tabindex="-1"></div>
  </section>
  <div data-mac2-janela></div>
  <div class="mac-impressao" aria-hidden="true" data-mac2-impressao></div>
  <footer class="ak-estado lf2-estado" data-mac2-estado role="status" aria-live="polite"></footer>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

/* ---------- desenhar ---------- */
const avisos = new WeakMap<HTMLElement, number>();
function toast(r: HTMLElement, t: string): void { const p = r.querySelector<HTMLElement>('[data-hm-aviso]'); if (!p || !t) return; p.textContent = t; p.classList.add('is-visivel'); clearTimeout(avisos.get(r)); avisos.set(r, window.setTimeout(() => p.classList.remove('is-visivel'), 3200)); }
const vazio = (ic: string, t: string, d: string, botao = '') => `<div class="ak-vazio lf2-vazio">${L(ic)}<p><b>${t}</b>${d}</p>${botao}</div>`;
const kpi = (cls: string, ic: string, t: string, v: string, ctx: string) => `<div class="minv2-kpi ${cls}"><span class="minv2-kpi-ic">${L(ic)}</span><small>${t}</small><b>${v}</b><i>${ctx}</i></div>`;
const tipoTxt = (l: LinhaVenda) => `<span class="mac2-tipo is-${l.tipo}" title="${esc(NOME_VENDA[l.tipo])}">${l.tipo}</span>`;
const docBtn = (l: LinhaVenda) => `<button type="button" class="mac2-doc" data-mac2-doc="${esc(l.id)}" title="Ver o documento">${esc(l.doc)}</button>`;
/** O estado inicial: uma linha curta e hipóteses reais (os mais vendidos ou os maiores clientes), que se tocam. */
function inicial(e: Est): string {
  const vs = vendas(), m = new Map<string, LinhaVenda[]>(); vs.forEach((l) => { const k = e.modo === 'artigo' ? l.ref : l.cli; m.set(k, [...(m.get(k) ?? []), l]); });
  const top = [...m].sort((a, b) => somaV(b[1]) - somaV(a[1])).slice(0, 6);
  return `<div class="mac2-ini"><p><b>${e.modo === 'artigo' ? 'Escreve a referência ou a descrição de um artigo' : 'Escreve o número ou o nome de um cliente'}</b> e escolhe nas hipóteses. ${e.modo === 'artigo' ? 'Os mais vendidos deste ano:' : 'Os maiores clientes deste ano:'}</p>
    <ul class="mac2-ini-l">${top.map(([k, ls]) => `<li><button type="button" class="mac2-ini-b" data-mac2-escolher="${esc(k)}"><b class="${e.modo === 'artigo' ? 'is-mono' : ''}">${esc(e.modo === 'artigo' ? k : cliente(k)?.nome ?? k)}</b><small>${esc(e.modo === 'artigo' ? artigo(k)?.desc ?? '' : `${k} · ${cliente(k)?.cidade ?? ''}`)}</small><span>${eur(somaV(ls))} · ${pl(docs(ls), 'documento', 'documentos')}</span></button></li>`).join('')}</ul></div>`;
}
function kpis(r: HTMLElement, e: Est, ls: LinhaVenda[]): void {
  const k = r.querySelector<HTMLElement>('[data-mac2-kpis]')!; k.hidden = !ls.length || e.fase === 'erro' || e.fase === 'carregar'; if (k.hidden) return;
  const nc = ls.filter((l) => l.tipo === 'NC'), u = ultima(ls)!, q = somaQ(ls), v = somaV(ls), outros = new Set(ls.map((l) => chaveG(e, l))).size;
  const porTipo = (Object.keys(NOME_VENDA) as TipoVenda[]).map((t) => [t, new Set(ls.filter((l) => l.tipo === t).map((l) => l.doc)).size] as const).filter(([, n]) => n).map(([t, n]) => `${n} ${t}`).join(' · ');
  const gs = gruposDe({ ...e, ordemG: 'valor' }, ls), maior = gs[0], lqs = ls.filter((l) => l.tipo !== 'NC').map((l) => l.liq);
  const top3 = gs.slice(0, 3).reduce((s, [, x]) => s + somaV(x), 0);
  k.innerHTML = `${kpi('is-total', euroIc, 'Valor líquido vendido', eur(v), `sem IVA (com IVA ${eur(comIva(ls))})${nc.length ? ` · notas de crédito ${eur(somaV(nc))} já abatidas` : ''}`)}
    ${kpi('', boxes, 'Quantidade vendida', qtdTxt(ls), nc.length ? `líquida: ${nf(somaQ(nc))} devolvidas` : 'líquida')}
    ${kpi('', e.modo === 'artigo' ? usersIc : pkg, e.modo === 'artigo' ? 'Clientes compradores' : 'Artigos comprados', nf(outros), e.modo === 'artigo' ? 'clientes distintos' : 'artigos distintos')}
    ${unids(ls).length > 1 ? kpi('', tag, 'Preço médio líquido', '—', 'unidades diferentes: vê-se por artigo') : kpi('', tag, 'Preço médio líquido', q ? eur(Math.round(v / q)) : '—', 'valor líquido ÷ quantidade')}
    <p class="mst2-sec"><span>${L(fileText)}Documentos <b>${nf(docs(ls))}</b> <small>${porTipo}</small></span><span>${L(calendar)}Última venda <b>${dia(u.data)}</b> ${docBtn(u)}</span></p>
    ${maior ? `<p class="mac2-info">${L(lightbulb)}<span><b>${esc(e.modo === 'artigo' ? cliente(maior[0])?.nome ?? '' : maior[0])}</b> é ${e.modo === 'artigo' ? 'quem mais comprou' : 'o artigo mais comprado'}: ${eur(somaV(maior[1]))} (${pct(somaV(maior[1]), v)} do valor).</span>${gs.length > 3 ? `<span>Os 3 maiores somam ${pct(top3, v)} do valor.</span>` : ''}${e.modo === 'artigo' && lqs.length > 1 ? `<span>Preço líquido entre ${eur(Math.min(...lqs))} e ${eur(Math.max(...lqs))} no período.</span>` : ''}</p>` : ''}`;
}
function tabela(e: Est, ls: LinhaVenda[]): string {
  const req = e.grupos.includes('req'), dsc = e.grupos.includes('desc');
  const cs: [string, string, boolean, string?][] = [['doc', 'Nr. doc.', false], ['data', 'Data', false], ['tipo', 'Tipo', false], ...(req ? [['req', 'Req. cliente', false], ['un', 'Un.', false]] as [string, string, boolean][] : []), ['qtd', 'Qt.', true], ['preco', 'Pr. unit.', true, 'Preço de venda unitário, sem IVA'], ...(dsc ? [['d1', 'Desc. 1', true], ['d2', 'Desc. 2', true, 'Aplicado depois do desconto 1'], ['iva', 'IVA', true]] as [string, string, boolean, string?][] : []), ['liq', 'Pr. unit. líq.', true, 'Preço unitário com os dois descontos, sem IVA'], ['valor', 'Valor', true, 'Preço líquido × quantidade, sem IVA']];
  const cel = (l: LinhaVenda, k: string) => k === 'doc' ? docBtn(l) : k === 'data' ? dia(l.data) : k === 'tipo' ? tipoTxt(l) : k === 'req' ? esc(l.req || '—') : k === 'un' ? esc(l.un) : k === 'qtd' ? nf(l.qtd) : k === 'preco' ? eur(l.preco) : k === 'd1' ? (l.d1 ? `${l.d1} %` : '<span class="is-nada">—</span>') : k === 'd2' ? (l.d2 ? `${l.d2} %` : '<span class="is-nada">—</span>') : k === 'iva' ? `${l.iva / 100} %` : k === 'liq' ? eur(l.liq) : eur(l.valor);
  const corpo = gruposDe(e, ls).map(([k, xs]) => {
    const f = e.fechadas.includes(k), u = ultima(xs)!, c = cliente(k), a = artigo(k);
    return `<tr class="mac-g mac2-g-l"><td colspan="${cs.length}"><div class="mac-g-c"><button type="button" class="mac-g-abrir mva2-g-abrir" data-mac2-faixa="${esc(k)}" aria-expanded="${!f}">${L(chevD)}<b class="${e.modo === 'cliente' ? 'is-mono' : ''}">${esc(e.modo === 'artigo' ? `${k} · ${c?.nome ?? k}` : k)}</b><small>${esc(e.modo === 'artigo' ? c?.cidade ?? '' : a?.desc ?? '')}</small></button>
      <span class="mac-g-n">${pl(docs(xs), 'documento', 'documentos')} · ${qtdTxt(xs)} · <b>${eur(somaV(xs))}</b> · última ${dia(u.data)}</span>
      <span class="mac2-g-acoes"><button type="button" class="ak-btn ak-btn--linha" data-mac2-entidade="${esc(k)}">${L(e.modo === 'artigo' ? user : pkg)}<span>Detalhe</span></button><button type="button" class="ak-btn ak-btn--linha" data-mac2-trocar="${esc(k)}">${L(arrowLeftRight)}<span>${e.modo === 'artigo' ? 'Ver o que comprou' : 'Ver quem comprou'}</span></button></span></div></td></tr>
      ${xs.map((l) => `<tr class="mac2-linha${l.tipo === 'NC' ? ' is-nc' : ''}" data-mac2-linha="${esc(l.id)}" tabindex="-1"${f ? ' hidden' : ''}>${cs.map(([k2, , n]) => `<td class="${n ? 'is-num' : ''}">${cel(l, k2)}</td>`).join('')}</tr>`).join('')}
      <tr class="rc-g-soma"${f ? ' hidden' : ''}><td colspan="${cs.findIndex((c) => c[0] === 'qtd')}"><b>Subtotal · ${esc(e.modo === 'artigo' ? c?.nome ?? k : k)}</b></td><td class="is-num"><b>${nf(somaQ(xs))}</b></td><td colspan="${cs.length - cs.findIndex((c) => c[0] === 'qtd') - 2}"></td><td class="is-num"><b>${eur(somaV(xs))}</b></td></tr>`;
  }).join('');
  const W: Record<string, number> = { doc: 12, data: 8.5, tipo: 5, req: 8, un: 5, qtd: 6, preco: 8, d1: 6.5, d2: 6.5, iva: 5.5, liq: 9, valor: 9.5 };
  return `<table class="lf2-tab lf2-tab--ajusta mac-tab mac2-tab" aria-label="Linhas de venda"><colgroup>${cs.map(([k]) => `<col style="width:${W[k]}%">`).join('')}</colgroup><thead><tr>${cs.map(([, t, n, ti]) => `<th scope="col" class="${n ? 'is-num' : ''}"${ti ? ` title="${esc(ti)}"` : ''}>${t}</th>`).join('')}</tr></thead><tbody>${corpo}</tbody>
    <tfoot><tr class="rc-total mac-total"><td colspan="${cs.findIndex((c) => c[0] === 'qtd')}"><b>Total · ${pl(docs(ls), 'documento', 'documentos')}</b></td><td class="is-num"><b>${nf(somaQ(ls))}</b></td><td colspan="${cs.length - cs.findIndex((c) => c[0] === 'qtd') - 2}"></td><td class="is-num"><b>${eur(somaV(ls))}</b></td></tr></tfoot></table>`;
}
function cartoes(e: Est, ls: LinhaVenda[]): string {
  const id = escolhido(e);
  return `<div class="minv2-cartoes">${gruposDe(e, ls).map(([k, xs]) => {
    const c = cliente(k), a = artigo(k), u = ultima(xs)!;
    return `<article class="minv2-cartao mac2-cartao" data-mac2-entidade-c="${esc(k)}"><header><b class="${e.modo === 'cliente' ? 'is-mono' : ''}">${esc(e.modo === 'artigo' ? k : k)}</b><span class="minv2-fam">${esc(e.modo === 'artigo' ? c?.cidade ?? '' : famDe(k))}</span></header>
      <h3 title="${esc(e.modo === 'artigo' ? c?.nome ?? '' : a?.desc ?? '')}">${esc(e.modo === 'artigo' ? c?.nome ?? k : a?.desc ?? k)}</h3>
      <p class="minv2-fam">${e.modo === 'artigo' ? `Artigo <b class="is-mono">${esc(id)}</b>` : `${esc(famDe(k))} › ${esc(subDe(k))}`}</p>
      <dl class="mst2-q"><div><dt>Quantidade</dt><dd>${qtdTxt(xs)}</dd></div><div><dt>Documentos</dt><dd>${nf(docs(xs))}</dd></div><div class="is-nom"><dt>Última compra</dt><dd>${dia(u.data)}</dd></div></dl>
      <dl class="minv2-nums"><div><dt>Preço médio líq.</dt><dd>${somaQ(xs) ? eur(Math.round(somaV(xs) / somaQ(xs))) : '—'}</dd></div><div class="is-valor"><dt>Valor líquido</dt><dd>${eur(somaV(xs))}</dd></div></dl>
      <footer class="mac2-c-pe"><button type="button" class="ak-btn ak-btn--linha" data-mac2-ver-docs="${esc(k)}">${L(fileText)}<span>Consultar documentos</span></button><button type="button" class="ak-btn ak-btn--linha" data-mac2-trocar="${esc(k)}">${L(arrowLeftRight)}<span>${e.modo === 'artigo' ? 'Ver compras do cliente' : 'Ver quem comprou'}</span></button></footer></article>`;
  }).join('')}</div>`;
}
/* a hierarquia: cada linha de venda conta uma vez; os nós somam os descendentes */
function hierarquia(e: Est, ls: LinhaVenda[]): string {
  const no = (k: string, nivel: number, ic: string, nome: string, sub: string, xs: LinhaVenda[], filhos: () => string, folha = false) => {
    const aberto = !folha && (e.abertos.includes(k) || nivel === 1);
    return `<li role="treeitem" aria-level="${nivel}"${folha ? '' : ` aria-expanded="${aberto}"`} data-mac2-no="${esc(k)}" tabindex="${nivel === 1 ? 0 : -1}"><div class="mst2-no${folha ? ' is-art' : ''}" style="--n:${nivel}">${folha ? '<span class="mst2-no-ab" aria-hidden="true"></span>' : `<button type="button" class="mst2-no-ab" data-mac2-abrir="${esc(k)}" aria-label="${aberto ? 'Recolher' : 'Expandir'}">${L(chevR)}</button>`}${L(ic)}<b>${esc(nome)}</b><small>${sub}</small><span class="mst2-no-q">${qtdTxt(xs)}</span><span class="mst2-no-v">${eur(somaV(xs))}</span></div>${aberto ? `<ul role="group">${filhos()}</ul>` : ''}</li>`;
  };
  const docsNos = (pref: string, xs: LinhaVenda[], nivel: number) => xs.map((l) => no(`${pref}|${l.id}`, nivel, fileText, `${l.doc}`, `${dia(l.data)} · ${esc(NOME_VENDA[l.tipo])} · ${nf(l.qtd)} × ${eur(l.liq)}`, [l], () => '', true)).join('');
  const id = escolhido(e);
  let arv: string;
  if (e.modo === 'artigo') {
    const a = artigo(id)!;
    arv = no(id, 1, pkg, `${a.ref} · ${a.desc}`, `${pl(new Set(ls.map((l) => l.cli)).size, 'cliente', 'clientes')} · ${pl(docs(ls), 'documento', 'documentos')}`, ls, () => gruposDe(e, ls).map(([c, xs]) => no(`${id}|${c}`, 2, user, cliente(c)?.nome ?? c, `${esc(cliente(c)?.cidade ?? '')} · ${pl(docs(xs), 'documento', 'documentos')}`, xs, () => docsNos(`${id}|${c}`, xs, 3))).join(''));
  } else {
    const c = cliente(id)!, fams = new Map<string, LinhaVenda[]>(); ls.forEach((l) => fams.set(famDe(l.ref), [...(fams.get(famDe(l.ref)) ?? []), l]));
    arv = no(id, 1, user, `${c.num} · ${c.nome}`, `${pl(new Set(ls.map((l) => l.ref)).size, 'artigo', 'artigos')} · ${pl(docs(ls), 'documento', 'documentos')}`, ls, () => [...fams].sort((x, y) => somaV(y[1]) - somaV(x[1])).map(([f, xf]) => {
      const subs = new Map<string, LinhaVenda[]>(); xf.forEach((l) => subs.set(subDe(l.ref), [...(subs.get(subDe(l.ref)) ?? []), l]));
      return no(`${id}|${f}`, 2, folderTree, f || 'Sem família', pl(new Set(xf.map((l) => l.ref)).size, 'artigo', 'artigos'), xf, () => [...subs].map(([s, xs]) => {
        const arts = new Map<string, LinhaVenda[]>(); xs.forEach((l) => arts.set(l.ref, [...(arts.get(l.ref) ?? []), l]));
        return no(`${id}|${f}|${s}`, 3, folder, s || 'Sem subfamília', pl(arts.size, 'artigo', 'artigos'), xs, () => [...arts].map(([ref, xa]) => no(`${id}|${f}|${s}|${ref}`, 4, pkg, ref, `${esc(artigo(ref)?.desc ?? '')} · ${pl(docs(xa), 'documento', 'documentos')}`, xa, () => docsNos(`${id}|${f}|${s}|${ref}`, xa, 5))).join(''));
      }).join(''));
    }).join(''));
  }
  return `<div class="mst2-arv-cab"><span>${e.modo === 'artigo' ? 'Artigo › Clientes › Documentos' : 'Cliente › Família › Subfamília › Artigo › Documentos'}</span><span>Quantidade</span><span>Valor líquido</span></div><ul class="mst2-arv" role="tree" aria-label="Hierarquia das vendas">${arv}</ul>
    <p class="mst2-arv-pe"><button type="button" class="ak-btn ak-btn--linha" data-mac2-acao="abrir-tudo">Expandir tudo</button><button type="button" class="ak-btn ak-btn--linha" data-mac2-acao="fechar-tudo">Recolher tudo</button></p>`;
}
const barras = (titulo: string, ic: string, xs: [string, number, string][], nota = '') => {
  const max = Math.max(1, ...xs.map((x) => Math.abs(x[1])));
  return `<section class="mst2-an"><h3>${L(ic)}${titulo}</h3>${nota ? `<p class="mst2-an-nota">${nota}</p>` : ''}${xs.length ? `<ul class="mst2-barras">${xs.map(([t, v, txt]) => `<li><span class="mst2-b-t" title="${esc(t)}">${esc(t)}</span><span class="mst2-b-b"><i class="${v < 0 ? 'is-neg' : ''}" style="width:${(Math.abs(v) / max) * 100}%"></i></span><b>${txt}</b></li>`).join('')}</ul>` : '<p class="mst2-an-nota">Nada no período.</p>'}</section>`;
};
function analise(e: Est, ls: LinhaVenda[]): string {
  const gs = gruposDe({ ...e, ordemG: 'valor' }, ls), nome = (k: string) => (e.modo === 'artigo' ? cliente(k)?.nome ?? k : `${k} · ${artigo(k)?.desc ?? ''}`);
  const meses = [...ls.reduce((m, l) => m.set(l.data.slice(0, 7), [...(m.get(l.data.slice(0, 7)) ?? []), l]), new Map<string, LinhaVenda[]>())].sort((a, b) => a[0].localeCompare(b[0]));
  const mesNome = (k: string) => new Date(`${k}-01`).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }).replace('.', '');
  const vendasP = ls.filter((l) => l.tipo !== 'NC'), qtdP = vendasP.reduce((s, l) => s + l.qtd, 0);
  const d1m = qtdP ? vendasP.reduce((s, l) => s + l.d1 * l.qtd, 0) / qtdP : 0, d2m = qtdP ? vendasP.reduce((s, l) => s + l.d2 * l.qtd, 0) / qtdP : 0;
  const poucos = ls.length < 4;
  const blocos = [
    barras(e.modo === 'artigo' ? 'Clientes por valor líquido' : 'Artigos por valor líquido', euroIc, gs.slice(0, 8).map(([k, xs]) => [nome(k), somaV(xs), eur(somaV(xs))]), `${pl(gs.length, e.modo === 'artigo' ? 'cliente' : 'artigo', e.modo === 'artigo' ? 'clientes' : 'artigos')} · sem IVA`),
    e.modo === 'artigo' ? barras('Clientes por quantidade', boxes, [...gs].sort((a, b) => somaQ(b[1]) - somaQ(a[1])).slice(0, 8).map(([k, xs]) => [nome(k), somaQ(xs), qtdTxt(xs)])) : barras('Compras por família', folderTree, [...ls.reduce((m, l) => m.set(famDe(l.ref), (m.get(famDe(l.ref)) ?? 0) + l.valor), new Map<string, number>())].sort((a, b) => b[1] - a[1]).map(([f, v]) => [f, v, eur(v)])),
    barras(e.modo === 'artigo' ? 'Vendas por mês' : 'Compras por mês', calendar, meses.map(([k, xs]) => [mesNome(k), somaV(xs), `${eur(somaV(xs))} · ${qtdTxt(xs)}`]), 'Só os meses com vendas; as notas de crédito abatem no mês delas.'),
    e.modo === 'artigo'
      ? `<section class="mst2-an"><h3>${L(tag)}Preço líquido e descontos</h3><table class="mst2-mini"><thead><tr><th>Mês</th><th class="is-num">Mín.</th><th class="is-num">Médio</th><th class="is-num">Máx.</th></tr></thead><tbody>${meses.map(([k, xs]) => { const v = xs.filter((l) => l.tipo !== 'NC'); if (!v.length) return ''; const q = v.reduce((s, l) => s + l.qtd, 0); return `<tr><td>${mesNome(k)}</td><td class="is-num">${eur(Math.min(...v.map((l) => l.liq)))}</td><td class="is-num">${eur(Math.round(v.reduce((s, l) => s + l.valor, 0) / q))}</td><td class="is-num">${eur(Math.max(...v.map((l) => l.liq)))}</td></tr>`; }).join('')}</tbody></table>
        <p class="mst2-an-nota">Desconto médio efetivo (pesado pela quantidade): desconto 1 ${d1m.toFixed(1).replace('.', ',')} % · desconto 2 ${d2m.toFixed(1).replace('.', ',')} %.</p></section>`
      : `<section class="mst2-an"><h3>${L(fileText)}Últimas compras e frequência</h3><table class="mst2-mini"><thead><tr><th>Data</th><th>Documento</th><th>Artigo</th><th class="is-num">Valor</th></tr></thead><tbody>${[...ls].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 6).map((l) => `<tr><td>${dia(l.data)}</td><td>${docBtn(l)}</td><td class="is-mono">${esc(l.ref)}</td><td class="is-num">${eur(l.valor)}</td></tr>`).join('')}</tbody></table>
        ${(() => { const ds = [...new Set(ls.map((l) => l.data))].sort(); if (ds.length < 2) return '<p class="mst2-an-nota">Só um dia com compras no período.</p>'; const dif = (Date.parse(ds[ds.length - 1]) - Date.parse(ds[0])) / 86400000 / (ds.length - 1); return `<p class="mst2-an-nota">${pl(ds.length, 'dia', 'dias')} com compras · em média uma a cada ${Math.round(dif)} dias · a última há ${Math.round((Date.parse(HOJE) - Date.parse(ds[ds.length - 1])) / 86400000)} dias (a ${dia(HOJE)}).</p>`; })()}</section>`,
  ];
  return poucos ? `<p class="mac2-poucos">Com ${pl(ls.length, 'linha', 'linhas')}, os números dizem mais do que um gráfico:</p><div class="mst2-analise">${blocos[0]}${blocos[3]}</div>` : `<div class="mst2-analise">${blocos.join('')}</div>`;
}
function migalhas(r: HTMLElement, e: Est): void {
  const m = r.querySelector<HTMLElement>('[data-mac2-migalhas]')!; m.hidden = e.vista !== 'hierarquia' || !escolhido(e); if (m.hidden) return;
  const id = escolhido(e), nome = e.modo === 'artigo' ? id : cliente(id)?.nome ?? id;
  m.innerHTML = `<button type="button" data-mac2-acao="trocar-esc">Artigos/Clientes</button>${L(chevR)}<span>${e.modo === 'artigo' ? 'Por artigo' : 'Por cliente'}</span>${L(chevR)}<span aria-current="location">${esc(nome)}</span>`;
}
function tudo(r: HTMLElement, e: Est, revelar = false): void {
  const id = escolhido(e), ls = linhas(e), g = r.querySelector<HTMLElement>('[data-mac2-g]')!;
  r.querySelectorAll<HTMLElement>('[data-mac2-modo]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mac2Modo === e.modo)));
  r.querySelectorAll<HTMLElement>('[data-mac2-comp]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mac2Comp === e.comp)));
  r.querySelectorAll<HTMLElement>('[data-mac2-vista]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mac2Vista === e.vista)));
  r.querySelector<HTMLElement>('[data-mac2-pq-t]')!.textContent = e.modo === 'artigo' ? 'Artigo' : 'Cliente';
  const q = r.querySelector<HTMLInputElement>('[data-mac2-q]')!; if (q.value !== e.q && document.activeElement !== q) q.value = e.q;
  q.placeholder = e.modo === 'artigo' ? 'Referência ou descrição, ex.: 6206 ou pastilhas' : 'Número ou nome, ex.: 10231 ou Mondego';
  /* o escolhido à vista, com Trocar */
  const es = r.querySelector<HTMLElement>('[data-mac2-esc]')!; es.hidden = !id;
  es.innerHTML = id ? `${L(e.modo === 'artigo' ? pkg : user)}<b class="${e.modo === 'artigo' ? 'is-mono' : ''}">${esc(e.modo === 'artigo' ? id : cliente(id)?.nome ?? id)}</b><span>${esc(e.modo === 'artigo' ? artigo(id)?.desc ?? '' : `${id} · ${cliente(id)?.cidade ?? ''}`)}</span><button type="button" class="ak-btn ak-btn--linha" data-mac2-acao="trocar-esc" title="Escolher outro (os filtros ficam)">${L(xIc)}<span>Trocar</span></button>` : '';
  q.closest('.mac2-pesq-c')!.toggleAttribute('hidden', !!id);
  /* as hipóteses */
  const hs = hipoteses(e), sug = r.querySelector<HTMLElement>('[data-mac2-sug]')!, ab = e.sugAberta && !id && !!e.q.trim();
  sug.hidden = !ab; q.setAttribute('aria-expanded', String(ab));
  e.hip = Math.max(0, Math.min(hs.length - 1, e.hip));
  sug.innerHTML = ab ? (hs.length ? hs.map((h, i) => `<li role="option" id="mac2-h-${i}-${esc(r.dataset.mac2Cenario ?? '')}" aria-selected="${i === e.hip}" data-mac2-escolher="${esc(h.id)}"><b>${esc(h.t)}</b><small>${esc(h.d)}</small></li>`).join('') : `<li class="mac2-sug-nada" role="presentation">Nenhum ${e.modo === 'artigo' ? 'artigo' : 'cliente'} ${({ inicio: 'começa por', contem: 'contém', igual: 'é igual a' })[e.comp]} «${esc(e.q.trim())}».${e.comp !== 'contem' ? ' Experimenta Contendo (Shift+F2).' : ''}</li>`) : '';
  if (ab && hs.length) q.setAttribute('aria-activedescendant', `mac2-h-${e.hip}-${r.dataset.mac2Cenario ?? ''}`); else q.removeAttribute('aria-activedescendant');
  /* os filtros */
  const ot = r.querySelector<HTMLSelectElement>('[data-mac2-f="outro"]')!;
  if (ot.dataset.modo !== e.modo || ot.dataset.id !== id) { const base = vendas().filter((l) => (e.modo === 'artigo' ? l.ref === id : l.cli === id)); const ks = [...new Set(base.map((l) => (e.modo === 'artigo' ? l.cli : l.ref)))]; ot.innerHTML = op('', 'Todos') + ks.map((k) => op(k, e.modo === 'artigo' ? `${k} · ${cliente(k)?.nome ?? ''}` : `${k} · ${artigo(k)?.desc ?? ''}`)).join(''); ot.dataset.modo = e.modo; ot.dataset.id = id; }
  r.querySelector<HTMLElement>('[data-mac2-outro-t]')!.textContent = e.modo === 'artigo' ? 'Cliente' : 'Artigo';
  r.querySelector<HTMLElement>('[data-mac2-fam-c]')!.hidden = e.modo !== 'cliente';
  (['de', 'ate', 'tipo', 'outro', 'fam'] as const).forEach((k) => { const el = r.querySelector<HTMLInputElement>(`[data-mac2-f="${k}"]`)!; if (el.value !== e[k]) el.value = e[k]; el.disabled = !id; el.closest('.ak-campo')?.classList.toggle('is-ativo', !!e[k]); });
  const chips: [string, string][] = [];
  if (e.de || e.ate) chips.push(['periodo', `${e.de ? dia(e.de) : '…'} a ${e.ate ? dia(e.ate) : '…'}`]);
  if (e.tipo) chips.push(['tipo', NOME_VENDA[e.tipo as TipoVenda]]);
  if (e.outro) chips.push(['outro', e.modo === 'artigo' ? `Cliente ${cliente(e.outro)?.nome ?? e.outro}` : `Artigo ${e.outro}`]);
  if (e.fam && e.modo === 'cliente') chips.push(['fam', e.fam]);
  const ch = r.querySelector<HTMLElement>('[data-mac2-chips]')!; ch.hidden = !chips.length;
  ch.innerHTML = chips.map(([k, t]) => `<li><button type="button" data-mac2-tirar="${k}" title="Tirar este filtro">${esc(t)}${L(xIc)}</button></li>`).join('');
  r.querySelector<HTMLElement>('[data-mac2-acao="limpar"]')!.setAttribute('aria-disabled', String(!chips.length));
  kpis(r, e, ls);
  const gs = gruposDe(e, ls);
  r.querySelector<HTMLElement>('[data-mac2-t]')!.textContent = !id ? 'Vendas' : e.modo === 'artigo' ? `Quem comprou ${id}` : `O que ${cliente(id)?.nome ?? id} comprou`;
  r.querySelector<HTMLElement>('[data-mac2-resumo]')!.innerHTML = id && ls.length ? `<span><b>${nf(gs.length)}</b> ${e.modo === 'artigo' ? (gs.length === 1 ? 'cliente' : 'clientes') : (gs.length === 1 ? 'artigo' : 'artigos')}</span><span>${pl(ls.length, 'linha', 'linhas')}</span>${e.antes ? `<button type="button" class="lf2-limpar" data-mac2-acao="voltar">${L(undo)}<span>Voltar a ${esc(e.antes.modo === 'artigo' ? e.antes.art : cliente(e.antes.cli)?.nome ?? '')}</span></button>` : ''}` : '';
  const tab = e.vista === 'tabela' && !!ls.length;
  r.querySelector<HTMLElement>('[data-mac2-ordem-c]')!.hidden = !(tab || e.vista === 'cartoes') || !ls.length;
  (r.querySelector<HTMLSelectElement>('[data-mac2-ordem]')!).value = e.ordemG;
  r.querySelector<HTMLElement>('[data-mac2-cols-c]')!.hidden = !tab;
  r.querySelector<HTMLElement>('[data-mac2-cols]')!.hidden = !e.colsAberto; r.querySelector('[data-mac2-acao="colunas"]')!.setAttribute('aria-expanded', String(e.colsAberto));
  r.querySelectorAll<HTMLInputElement>('[data-mac2-gcol]').forEach((x) => { x.checked = e.grupos.includes(x.dataset.mac2Gcol as GCol); });
  const fb = r.querySelector<HTMLElement>('[data-mac2-acao="faixas"]')!; fb.hidden = !tab; fb.querySelector('span')!.textContent = e.fechadas.length >= gs.length && gs.length ? 'Abrir todas' : 'Fechar todas';
  migalhas(r, e);
  g.dataset.vista = e.vista; g.classList.toggle('is-a-atualizar', e.fase === 'atualizar');
  if (e.fase === 'carregar') g.innerHTML = `<div class="minv2-a-gerar" role="status">${L(loader)}<p><b>A ler as vendas…</b>A pesquisa já serve.</p></div><div class="minv2-esq" aria-hidden="true">${'<i></i>'.repeat(5)}</div>`;
  else if (e.fase === 'erro') { const tentar = `<button type="button" class="ak-btn ak-btn--acao" data-mac2-acao="atualizar">${L(refresh)}<span>Tentar outra vez</span></button>`; g.innerHTML = e.erro === 'offline' ? vazio(wifiOff, 'Sem ligação à rede.', 'A pesquisa e os filtros ficam; atualiza (F9) quando voltar.', tentar) : e.erro === 'sessao' ? vazio(logIn, 'A sessão terminou.', 'Volta a entrar; a pesquisa fica.', `<button type="button" class="ak-btn ak-btn--acao" data-login>${L(logIn)}<span>Voltar a entrar</span></button>`) : e.erro === 'permissao' ? vazio(lock, 'Sem permissão para os mapas de Stocks.', 'Pede o acesso a quem gere os perfis.') : vazio(circleAlert, 'O servidor das vendas não respondeu.', 'A pesquisa e os filtros ficam; tenta outra vez.', tentar); }
  else if (!id) g.innerHTML = inicial(e);
  else if (!ls.length) g.innerHTML = vendas().some((l) => (e.modo === 'artigo' ? l.ref === id : l.cli === id)) ? vazio(searchX, 'Sem linhas com estes filtros.', 'Alarga o período ou tira um filtro; o escolhido fica.', `<button type="button" class="ak-btn" data-mac2-acao="limpar">${L(funnelX)}<span>Limpar filtros</span></button>`) : vazio(searchX, e.modo === 'artigo' ? `${esc(id)} ainda não se vendeu este ano.` : 'Este cliente ainda não comprou este ano.', 'Escolhe outro.', `<button type="button" class="ak-btn" data-mac2-acao="trocar-esc">${L(xIc)}<span>Trocar</span></button>`);
  else g.innerHTML = e.vista === 'cartoes' ? cartoes(e, ls) : e.vista === 'hierarquia' ? hierarquia(e, ls) : e.vista === 'analise' ? analise(e, ls) : tabela(e, ls);
  janela(r, e);
  r.querySelector<HTMLElement>('[data-mac2-estado]')!.innerHTML = `<span>${e.modo === 'artigo' ? 'Por artigo' : 'Por cliente'}${id ? ` · <b>${esc(e.modo === 'artigo' ? id : cliente(id)?.nome ?? id)}</b>` : ''}</span><span>Valores sem IVA</span><span>Vista ${({ tabela: 'tabela', cartoes: 'cartões', hierarquia: 'hierarquia', analise: 'análise' })[e.vista]}</span>${e.fase === 'atualizar' || e.fase === 'carregar' ? `<span class="ak-estado-f">${L(loader)}A atualizar…</span>` : e.fase === 'erro' ? '<span class="ak-estado-f is-erro">Sem dados</span>' : '<span class="ak-estado-f is-ok">Pronto</span>'}${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  const ip = r.querySelector<HTMLElement>('[data-mac2-impressao]'); if (ip) ip.innerHTML = `<h1>Artigos/Clientes · ${esc(id ? (e.modo === 'artigo' ? id : cliente(id)?.nome ?? id) : '')}</h1><p>${chips.map((c) => c[1]).join(' · ') || 'Todo o ano'} · valores sem IVA · impresso a ${new Date().toLocaleString('pt-PT')}</p>`;
  if (revelar && !quieto()) g.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}

/* ---------- o detalhe: cliente, artigo ou documento (numa janela) ---------- */
function janela(r: HTMLElement, e: Est): void {
  const c = r.querySelector<HTMLElement>('[data-mac2-janela]')!; if (!e.jan) { c.innerHTML = ''; return; }
  const { tipo, id } = e.jan, ls = linhas(e), foco = c.contains(document.activeElement);
  let tit = '', ic = fileText, corpo = '';
  if (tipo === 'doc') {
    const l = vendas().find((x) => x.id === id); if (!l) { c.innerHTML = ''; return; }
    const doc = vendas().filter((x) => x.doc === l.doc), cl = cliente(l.cli), a = artigo(l.ref);
    tit = `Documento · <b>${esc(l.doc)}</b>`;
    corpo = `<div class="minv2-jan-id"><p class="minv2-jan-desc">${esc(NOME_VENDA[l.tipo])}</p><p class="minv2-fam">${dia(l.data)} · série ${esc(l.doc.split('/')[0])} · número ${esc(l.doc.split('/')[1] ?? '')}${l.req ? ` · requisição ${esc(l.req)}` : ''}</p></div>
      <dl class="mva2-dl"><div><dt>Cliente</dt><dd><b>${esc(cl?.num ?? '')}</b> ${esc(cl?.nome ?? '')}</dd></div><div><dt>Artigo</dt><dd><b class="is-mono">${esc(l.ref)}</b> ${esc(a?.desc ?? '')}</dd></div><div><dt>Quantidade</dt><dd>${nf(l.qtd)} ${esc(l.un)}</dd></div><div><dt>Preço unitário</dt><dd>${eur(l.preco)} sem IVA</dd></div><div><dt>Descontos</dt><dd>${l.d1 ? `${l.d1} %` : '—'}${l.d2 ? ` e depois ${l.d2} %` : ''}</dd></div><div><dt>Preço líquido</dt><dd>${eur(l.liq)}</dd></div><div><dt>Valor</dt><dd><b>${eur(l.valor)}</b> sem IVA · ${eur(Math.round(l.valor * (1 + l.iva / 10000)))} com IVA (${l.iva / 100} %)</dd></div></dl>
      ${doc.length > 1 ? `<h4 class="minv2-jan-t">${L(fileText)}As ${doc.length} linhas deste documento</h4><ul class="minv2-movs">${doc.map((x) => `<li><span class="minv2-mov-d is-mono">${esc(x.ref)}</span><span class="minv2-mov-t">${esc(artigo(x.ref)?.desc ?? '')}<small>${nf(x.qtd)} × ${eur(x.liq)}</small></span><b>${eur(x.valor)}</b></li>`).join('')}</ul><p class="minv2-jan-nota">Total do documento ${eur(somaV(doc))} sem IVA.</p>` : ''}`;
  } else {
    const ehCli = tipo === 'cli', xs = vendas().filter((l) => (ehCli ? l.cli === id : l.ref === id) && (!e.de || l.data >= e.de) && (!e.ate || l.data <= e.ate)), cl = cliente(id), a = artigo(id);
    ic = ehCli ? user : pkg; tit = ehCli ? `Cliente · <b>${esc(id)}</b>` : `Artigo · <b>${esc(id)}</b>`;
    const outros = [...xs.reduce((m, l) => m.set(ehCli ? l.ref : l.cli, (m.get(ehCli ? l.ref : l.cli) ?? 0) + l.valor), new Map<string, number>())].sort((p, q) => q[1] - p[1]);
    const lqs = xs.filter((l) => l.tipo !== 'NC');
    corpo = `<div class="minv2-jan-id"><p class="minv2-jan-desc">${esc(ehCli ? cl?.nome ?? id : a?.desc ?? id)}</p><p class="minv2-fam">${ehCli ? `${esc(cl?.cidade ?? '')} · NIF ${esc(cl?.nif ?? '')}` : `${esc(a?.marca ?? '')} · ${esc(famDe(id))} › ${esc(subDe(id))}`}</p></div>
      <dl class="minv2-nums minv2-jan-nums"><div><dt>${ehCli ? 'Comprou' : 'Vendido'}</dt><dd>${eur(somaV(xs))}</dd></div><div><dt>Documentos</dt><dd>${nf(docs(xs))}</dd></div><div class="is-valor"><dt>Última</dt><dd>${xs.length ? dia(ultima(xs)!.data) : '—'}</dd></div></dl>
      ${!ehCli && lqs.length ? `<p class="mst2-conta">Preço líquido no período: ${eur(Math.min(...lqs.map((l) => l.liq)))} a ${eur(Math.max(...lqs.map((l) => l.liq)))} · ${qtdTxt(xs)} vendidas</p>` : ''}
      <h4 class="minv2-jan-t">${L(ehCli ? pkg : usersIc)}${ehCli ? 'Artigos comprados' : 'Clientes compradores'}</h4>
      <ul class="minv2-movs">${outros.slice(0, 8).map(([k, v]) => `<li><span class="minv2-mov-d ${ehCli ? 'is-mono' : ''}">${esc(ehCli ? k : k)}</span><span class="minv2-mov-t">${esc(ehCli ? artigo(k)?.desc ?? '' : cliente(k)?.nome ?? '')}</span><b>${eur(v)}</b></li>`).join('')}</ul>${outros.length > 8 ? `<p class="minv2-jan-nota">e mais ${nf(outros.length - 8)}.</p>` : ''}
      <h4 class="minv2-jan-t">${L(calendar)}Datas das compras</h4><p class="minv2-jan-nota">${[...new Set(xs.map((l) => l.data))].sort().reverse().slice(0, 10).map(dia).join(' · ')}${new Set(xs.map((l) => l.data)).size > 10 ? ' …' : ''}</p>
      <p class="mva2-jan-acoes"><button type="button" class="ak-btn" data-mac2-trocar-j="${esc(id)}" data-mac2-para="${ehCli ? 'cliente' : 'artigo'}">${L(arrowLeftRight)}<span>${ehCli ? 'Ver o que comprou' : 'Ver quem comprou'}</span></button></p>`;
    void ls;
  }
  const w = Math.min(460, innerWidth - 24), y = Math.round(Math.max(0, r.querySelector('.mac2-barra')?.getBoundingClientRect().bottom ?? 88) + 8), x = Math.max(12, innerWidth - w - 24);
  c.innerHTML = `<section data-por-cima class="lf2-jan minv2-jan" data-mac2-jan role="dialog" aria-label="${esc(tit.replace(/<[^>]+>/g, ''))}" tabindex="-1" style="left:${x}px;top:${y}px;width:${w}px;max-height:min(660px, calc(100vh - ${y + 12}px))">
    <header class="lf2-jan-cab">${L(ic)}<h3>${tit}</h3><span class="lf2-jan-bts"><button type="button" data-mac2-acao="fechar-jan" data-lf2-jan-acao="fechar" aria-label="Fechar (Esc)" title="Fechar (Esc)">${L(xIc)}</button></span></header>
    <div class="lf2-jan-corpo">${corpo}</div></section>`;
  if (foco) c.querySelector<HTMLElement>('[data-mac2-jan]')?.focus({ preventScroll: true });
}

/* ---------- ações ---------- */
function escolher(r: HTMLElement, e: Est, id: string, revelar = true): void {
  if (e.modo === 'artigo') e.art = id; else e.cli = id;
  e.q = ''; e.sugAberta = false; e.outro = ''; e.fechadas = []; e.abertos = []; e.jan = null; tudo(r, e, revelar);
}
function trocar(r: HTMLElement, e: Est, k: string): void {
  e.antes = { modo: e.modo, art: e.art, cli: e.cli };
  if (e.modo === 'artigo') { e.modo = 'cliente'; e.cli = k; } else { e.modo = 'artigo'; e.art = k; }
  e.outro = ''; e.fam = ''; e.fechadas = []; e.abertos = []; e.jan = null; guardar(e); tudo(r, e, true);
  toast(r, e.modo === 'cliente' ? `O que ${cliente(k)?.nome ?? k} comprou.` : `Quem comprou ${k}.`);
}
function atualizar(r: HTMLElement, e: Est): void { e.fase = 'atualizar'; tudo(r, e); window.setTimeout(() => { e.fase = 'ok'; e.erro = undefined; e.aviso = 'Vendas atualizadas.'; tudo(r, e); toast(r, e.aviso); }, quieto() ? 100 : 500); }
function exportar(r: HTMLElement, e: Est): void {
  const ls = linhas(e); if (!ls.length) { toast(r, 'Escolhe primeiro um artigo ou um cliente com vendas.'); return; }
  const ts = ['Nr. doc.', 'Data', 'Tipo', 'Req. cliente', 'Cliente', 'Nome do cliente', 'Artigo', 'Descrição', 'Un.', 'Qt.', 'Pr. unit.', 'Desc. 1', 'Desc. 2', 'IVA', 'Pr. unit. líq.', 'Valor (sem IVA)'];
  const rows: Celula[][] = ls.map((l) => [l.doc, dia(l.data), l.tipo, l.req, l.cli, cliente(l.cli)?.nome ?? '', l.ref, artigo(l.ref)?.desc ?? '', l.un, l.qtd, { euros: l.preco }, l.d1, l.d2, l.iva / 100, { euros: l.liq }, { euros: l.valor }]);
  rows.push([`Total · ${docs(ls)} documentos`, null, null, null, null, null, null, null, null, somaQ(ls), null, null, null, null, null, { euros: somaV(ls) }]);
  const nome = `Artigos-clientes-${(e.modo === 'artigo' ? e.art : e.cli).replace(/\W+/g, '-')}.xlsx`;
  try { descarregar(xlsx({ nome: 'Vendas', colunas: ts, linhas: rows, larguras: ts.map((t) => Math.max(10, t.length + 4)) }), nome); e.aviso = `Exportado: ${nome} · ${pl(ls.length, 'linha', 'linhas')}.`; }
  catch { e.aviso = 'A exportação falhou; tenta outra vez.'; }
  tudo(r, e); toast(r, e.aviso);
}
const chavesArv = (e: Est, ls: LinhaVenda[]) => { const id = escolhido(e); return e.modo === 'artigo' ? [...new Set(ls.map((l) => `${id}|${l.cli}`))] : [...new Set(ls.flatMap((l) => [`${id}|${famDe(l.ref)}`, `${id}|${famDe(l.ref)}|${subDe(l.ref)}`, `${id}|${famDe(l.ref)}|${subDe(l.ref)}|${l.ref}`]))]; };

/* ---------- os cenários ---------- */
function armar(r: HTMLElement): void {
  if (estados.has(r)) return;
  const e = de(r), cen = r.dataset.mac2Cenario ?? 'inicial';
  if (e.editor) Object.assign(e, { modo: 'artigo', vista: 'tabela', grupos: ['req', 'desc'] });
  if (cen.startsWith('cliente') || cen === 'por-cliente') e.modo = 'cliente';
  if (['por-artigo', 'filtro-cliente', 'periodo', 'notas-credito', 'faixas-fechadas', 'cartoes', 'hierarquia', 'analise', 'detalhe-doc', 'detalhe-cliente', 'colunas', 'trocado', 'a-atualizar', 'exportado'].includes(cen)) e.art = '6206-2RSH';
  if (['por-cliente', 'cliente-filtro', 'cliente-cartoes', 'cliente-hierarquia', 'cliente-analise'].includes(cen)) { e.modo = 'cliente'; e.cli = '10388'; }
  if (cen === 'sugestoes') { e.comp = 'contem'; e.q = 'pastilhas'; e.sugAberta = true; }
  if (cen === 'igual') { e.comp = 'igual'; e.q = 'bkr6e'; e.sugAberta = true; }
  if (cen === 'sem-hipoteses') { e.q = 'travão'; e.sugAberta = true; }
  if (cen === 'cliente-sug') { e.comp = 'contem'; e.q = 'mec'; e.sugAberta = true; }
  if (cen === 'filtro-cliente') e.outro = '10231';
  if (cen === 'cliente-filtro') e.outro = 'LGMT 2/1';
  if (cen === 'periodo') { e.de = '2026-07-01'; e.ate = '2026-09-30'; }
  if (cen === 'notas-credito') e.tipo = 'NC';
  if (cen === 'faixas-fechadas') e.fechadas = vendas().filter((l) => l.ref === '6206-2RSH').map((l) => l.cli);
  if (cen.endsWith('cartoes')) e.vista = 'cartoes';
  if (cen.endsWith('hierarquia')) { e.vista = 'hierarquia'; e.abertos = cen === 'hierarquia' ? ['6206-2RSH|10231'] : []; }
  if (cen.endsWith('analise')) e.vista = 'analise';
  if (cen === 'colunas') { e.colsAberto = true; e.grupos = ['desc']; }
  if (cen === 'detalhe-doc') { const l = vendas().find((x) => x.ref === '6206-2RSH'); if (l) e.jan = { tipo: 'doc', id: l.id }; }
  if (cen === 'detalhe-cliente') e.jan = { tipo: 'cli', id: '10231' };
  if (cen === 'trocado') { e.antes = { modo: 'artigo', art: '6206-2RSH', cli: '' }; e.modo = 'cliente'; e.cli = '10231'; }
  if (cen === 'sem-vendas') e.art = '0 986 424 797';
  if (cen === 'sem-vendas-filtros') { e.art = '6206-2RSH'; e.tipo = 'NC'; e.outro = '1'; }
  if (cen === 'a-carregar') e.fase = 'carregar';
  if (cen === 'a-atualizar') e.fase = 'atualizar';
  if (['servidor', 'offline', 'sessao', 'permissao'].includes(cen)) { e.fase = 'erro'; e.erro = cen as Est['erro']; }
  if (cen === 'exportado') e.aviso = 'Exportado: Artigos-clientes-6206-2RSH.xlsx.';
  tudo(r, e);
  if (!e.editor && r.closest('.ecra:not([hidden]) > .versao:not([hidden])') && !quieto()) r.classList.add('lf2-entra');
}
const armarTodos = () => document.querySelectorAll<HTMLElement>('[data-mac2]').forEach(armar);
let espera = 0;
export function iniciar(): void {
  requestAnimationFrame(armarTodos);
  ['romafe:versao', 'romafe:ecra'].forEach((y) => document.addEventListener(y, () => requestAnimationFrame(armarTodos)));
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const e = de(r); let b: HTMLElement | null;
    if ((b = t.closest('[data-mac2-acao][aria-disabled="true"]'))) { toast(r, 'Não há filtros.'); return; }
    if ((b = t.closest('[data-mac2-modo]'))) { const m = b.dataset.mac2Modo as Modo; if (m !== e.modo) { e.modo = m; e.q = ''; e.outro = ''; e.fam = ''; e.jan = null; e.antes = null; guardar(e); tudo(r, e, true); r.querySelector<HTMLElement>('[data-mac2-q]')?.focus(); } return; }
    if ((b = t.closest('[data-mac2-comp]'))) { e.comp = b.dataset.mac2Comp as Comp; e.sugAberta = true; tudo(r, e); r.querySelector<HTMLElement>('[data-mac2-q]')?.focus(); return; }
    if ((b = t.closest('[data-mac2-vista]'))) { e.vista = b.dataset.mac2Vista as Vista; guardar(e); tudo(r, e, true); return; }
    if ((b = t.closest('[data-mac2-escolher]'))) { escolher(r, e, b.dataset.mac2Escolher!); return; }
    if ((b = t.closest('[data-mac2-tirar]'))) { const k = b.dataset.mac2Tirar!; if (k === 'periodo') { e.de = ''; e.ate = ''; } else (e as unknown as Record<string, string>)[k] = ''; tudo(r, e); return; }
    if ((b = t.closest('[data-mac2-faixa]'))) { const k = b.dataset.mac2Faixa!; e.fechadas = e.fechadas.includes(k) ? e.fechadas.filter((x) => x !== k) : [...e.fechadas, k]; tudo(r, e); r.querySelector<HTMLElement>(`[data-mac2-faixa="${CSS.escape(k)}"]`)?.focus(); return; }
    if ((b = t.closest('[data-mac2-trocar]'))) { trocar(r, e, b.dataset.mac2Trocar!); return; }
    if ((b = t.closest('[data-mac2-trocar-j]'))) { const k = b.dataset.mac2TrocarJ!, para = b.dataset.mac2Para as Modo; e.antes = { modo: e.modo, art: e.art, cli: e.cli }; e.modo = para; if (para === 'cliente') e.cli = k; else e.art = k; e.outro = ''; e.jan = null; guardar(e); tudo(r, e, true); return; }
    if ((b = t.closest('[data-mac2-entidade]'))) { e.jan = { tipo: e.modo === 'artigo' ? 'cli' : 'art', id: b.dataset.mac2Entidade! }; janela(r, e); r.querySelector<HTMLElement>('[data-mac2-jan]')?.focus(); return; }
    if ((b = t.closest('[data-mac2-ver-docs]'))) { const k = b.dataset.mac2VerDocs!; e.vista = 'tabela'; const ks = gruposDe(e, linhas(e)).map(([x]) => x); e.fechadas = ks.filter((x) => x !== k); tudo(r, e); r.querySelector<HTMLElement>(`[data-mac2-faixa="${CSS.escape(k)}"]`)?.scrollIntoView({ block: 'start' }); r.querySelector<HTMLElement>(`[data-mac2-faixa="${CSS.escape(k)}"]`)?.focus({ preventScroll: true }); return; }
    if ((b = t.closest('[data-mac2-doc]'))) { e.jan = { tipo: 'doc', id: b.dataset.mac2Doc! }; janela(r, e); r.querySelector<HTMLElement>('[data-mac2-jan]')?.focus(); return; }
    if ((b = t.closest('[data-mac2-abrir]'))) { const k = b.dataset.mac2Abrir!; e.abertos = e.abertos.includes(k) ? e.abertos.filter((x) => x !== k) : [...e.abertos, k]; tudo(r, e); r.querySelector<HTMLElement>(`[data-mac2-abrir="${CSS.escape(k)}"]`)?.focus(); return; }
    if ((b = t.closest('[data-mac2-acao]'))) {
      const k = b.dataset.mac2Acao!;
      if (k === 'atualizar') atualizar(r, e);
      else if (k === 'imprimir') window.print();
      else if (k === 'excel') exportar(r, e);
      else if (k === 'limpar') { Object.assign(e, { de: '', ate: '', tipo: '', outro: '', fam: '' }); tudo(r, e); toast(r, 'Filtros limpos; o escolhido fica.'); }
      else if (k === 'trocar-esc') { if (e.modo === 'artigo') e.art = ''; else e.cli = ''; e.jan = null; e.antes = null; tudo(r, e); r.querySelector<HTMLElement>('[data-mac2-q]')?.focus(); }
      else if (k === 'voltar' && e.antes) { Object.assign(e, { modo: e.antes.modo, art: e.antes.art, cli: e.antes.cli, antes: null, outro: '', jan: null }); tudo(r, e, true); }
      else if (k === 'colunas') { e.colsAberto = !e.colsAberto; tudo(r, e); }
      else if (k === 'faixas') { const ks = gruposDe(e, linhas(e)).map(([x]) => x); e.fechadas = e.fechadas.length >= ks.length ? [] : ks; tudo(r, e); }
      else if (k === 'fechar-jan') { e.jan = null; tudo(r, e); }
      else if (k === 'abrir-tudo') { e.abertos = chavesArv(e, linhas(e)); tudo(r, e); }
      else if (k === 'fechar-tudo') { e.abertos = []; tudo(r, e); }
      return;
    }
    const tr = t.closest<HTMLElement>('[data-mac2-g] tr[data-mac2-linha]');
    if (tr && !t.closest('button')) { r.querySelectorAll('[data-mac2-g] tr.is-ativo').forEach((x) => x.classList.remove('is-ativo')); tr.classList.add('is-ativo'); tr.tabIndex = 0; tr.focus({ preventScroll: true }); e.jan = { tipo: 'doc', id: tr.dataset.mac2Linha! }; janela(r, e); }
    if (!t.closest('[data-mac2-sug], [data-mac2-q]') && e.sugAberta) { e.sugAberta = false; tudo(r, e); }
  });
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r || !t.matches('[data-mac2-q]')) return; const e = de(r);
    clearTimeout(espera); espera = window.setTimeout(() => { e.q = t.value; e.hip = 0; e.sugAberta = true; tudo(r, e); }, 100);
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r || editando()) return; const e = de(r);
    if (t.matches('[data-mac2-f]')) { (e as unknown as Record<string, string>)[t.dataset.mac2F!] = t.value; tudo(r, e); r.querySelector<HTMLElement>(`[data-mac2-f="${t.dataset.mac2F}"]`)?.focus(); }
    if (t.matches('[data-mac2-ordem]')) { e.ordemG = t.value as Est['ordemG']; tudo(r, e); r.querySelector<HTMLElement>('[data-mac2-ordem]')?.focus(); }
    if (t.matches('[data-mac2-gcol]')) { const g = t.dataset.mac2Gcol as GCol; e.grupos = t.checked ? [...e.grupos, g] : e.grupos.filter((x) => x !== g); guardar(e); tudo(r, e); r.querySelector<HTMLElement>(`[data-mac2-gcol="${g}"]`)?.focus(); }
  });
  document.addEventListener('submit', (ev) => { if (raiz(ev.target as HTMLElement)) ev.preventDefault(); });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t) ?? visivel(); if (!r || editando()) return; const e = de(r);
    if (ev.ctrlKey && !ev.altKey && !ev.shiftKey && (ev.key === 'F1' || ev.key === 'F2')) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mac2-modo="${ev.key === 'F1' ? 'artigo' : 'cliente'}"]`)?.click(); return; }
    const so = !ev.ctrlKey && !ev.altKey && !ev.metaKey;
    if (so && ev.shiftKey && ['F1', 'F2', 'F3'].includes(ev.key)) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mac2-comp="${{ F1: 'inicio', F2: 'contem', F3: 'igual' }[ev.key]}"]`)?.click(); return; }
    if (so && !ev.shiftKey && (ev.key === 'F9' || ev.key === 'F11')) { ev.preventDefault(); if (ev.key === 'F9') atualizar(r, e); else window.print(); return; }
    if (t.matches('[data-mac2-q]')) {
      const hs = hipoteses(e);
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); e.sugAberta = true; e.hip = Math.max(0, Math.min(hs.length - 1, e.hip + (ev.key === 'ArrowDown' ? 1 : -1))); tudo(r, e); return; }
      if (ev.key === 'Enter') { ev.preventDefault(); clearTimeout(espera); e.q = (t as HTMLInputElement).value; const h = hipoteses(e)[e.hip]; if (h) escolher(r, e, h.id); return; }
      if (ev.key === 'Escape' && e.sugAberta) { ev.preventDefault(); e.sugAberta = false; tudo(r, e); return; }
    }
    if (ev.key === 'Escape') { if (e.jan) { e.jan = null; tudo(r, e); ev.preventDefault(); return; } if (e.colsAberto) { e.colsAberto = false; tudo(r, e); ev.preventDefault(); return; } return; }
    /* a árvore */
    const no = t.closest<HTMLElement>('[data-mac2-g] li[role="treeitem"]');
    if (no && so) {
      const vis = [...r.querySelectorAll<HTMLElement>('[data-mac2-g] li[role="treeitem"]')], i = vis.indexOf(no), k = no.dataset.mac2No!, folha = !no.hasAttribute('aria-expanded');
      const ir = (x?: HTMLElement | null) => { if (!x) return; vis.forEach((y) => { y.tabIndex = -1; }); x.tabIndex = 0; x.focus(); };
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); ev.stopImmediatePropagation(); ir(vis[i + (ev.key === 'ArrowDown' ? 1 : -1)]); return; }
      if (ev.key === 'ArrowRight' && !folha) { ev.preventDefault(); if (no.getAttribute('aria-expanded') !== 'true') { e.abertos.push(k); tudo(r, e); r.querySelector<HTMLElement>(`[data-mac2-no="${CSS.escape(k)}"]`)?.focus(); } else ir(vis[i + 1]); return; }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); if (!folha && no.getAttribute('aria-expanded') === 'true' && no.getAttribute('aria-level') !== '1') { e.abertos = e.abertos.filter((x) => x !== k); tudo(r, e); r.querySelector<HTMLElement>(`[data-mac2-no="${CSS.escape(k)}"]`)?.focus(); } else ir(no.parentElement?.closest<HTMLElement>('li[role="treeitem"]')); return; }
      if (ev.key === 'Enter' && folha) { ev.preventDefault(); const lid = k.split('|').pop()!; e.jan = { tipo: 'doc', id: lid }; janela(r, e); return; }
    }
    /* as linhas da tabela: ↑ ↓ e a janela do documento acompanha */
    const tr = t.closest<HTMLElement>('[data-mac2-g] tr[data-mac2-linha]');
    if (tr && so && ['ArrowDown', 'ArrowUp', 'Enter'].includes(ev.key)) {
      ev.preventDefault(); ev.stopImmediatePropagation();
      const ls = [...r.querySelectorAll<HTMLElement>('[data-mac2-g] tr[data-mac2-linha]:not([hidden])')], i = ls.indexOf(tr);
      const n = ev.key === 'Enter' ? tr : ls[Math.max(0, Math.min(ls.length - 1, i + (ev.key === 'ArrowDown' ? 1 : -1)))];
      if (n) { ls.forEach((x) => { x.classList.remove('is-ativo'); x.tabIndex = -1; }); n.classList.add('is-ativo'); n.tabIndex = 0; n.focus(); n.scrollIntoView({ block: 'nearest' }); if (e.jan || ev.key === 'Enter') { e.jan = { tipo: 'doc', id: n.dataset.mac2Linha! }; janela(r, e); n.focus(); } }
    }
  });
}

/* ---------- os ecrãs ---------- */
const NOTA = 'Artigos/Clientes v2 (19 nov., do briefing «Redesign do módulo Artigos/Clientes»): Por artigo (Ctrl+F1) e Por cliente (Ctrl+F2); Iniciado por / Contendo / Igual a (Shift+F1–F3), que o IDE leva para a barra de cima; hipóteses enquanto se escreve; o escolhido à vista com Trocar; período, tipo de documento, o outro campo e a família (por cliente), aplicados à vista; indicadores (valor líquido sem IVA com as NC abatidas, quantidade, clientes ou artigos, preço médio líquido, documentos, última venda) e informação factual; vistas Tabela (faixas, colunas por grupos), Cartões, Hierarquia e Análise; o detalhe do cliente, do artigo ou do documento numa janela; Ver o que comprou / Voltar; F9, F11, Excel.';
const ESTADOS: [string, string, string][] = [
  ['por-artigo', 'Por artigo', 'O 6206-2RSH: uma faixa por cliente com as linhas, ordenadas pelo valor; os indicadores e a informação.'],
  ['sugestoes', 'Hipóteses da pesquisa', '«pastilhas» contendo: os artigos que servem; ↑ ↓ e Enter escolhem.'],
  ['igual', 'Exatamente igual a', 'Shift+F3: só a referência certa (BKR6E).'],
  ['sem-hipoteses', 'A pesquisa não encontra', '«travão» iniciado por não dá nenhum; sugere Contendo.'],
  ['filtro-cliente', 'Artigo e um só cliente', 'O campo Cliente filtra: só o que esse cliente levou deste artigo.'],
  ['por-cliente', 'Por cliente', 'Ctrl+F2: o que o cliente comprou, uma faixa por artigo.'],
  ['cliente-vazio', 'Por cliente, sem cliente', 'À espera do número ou do nome; os maiores clientes para tocar.'],
  ['cliente-sug', 'Hipóteses de clientes', '«mec» contendo: os clientes com a cidade.'],
  ['cliente-filtro', 'Cliente e um só artigo', 'O campo Artigo filtra: só esse artigo nas compras do cliente.'],
  ['trocado', 'Trocar de visualização', '«Ver o que comprou» numa faixa: passa a esse cliente; «Voltar» repõe.'],
  ['periodo', 'Um trimestre', 'O período encurta as linhas, os indicadores e as outras vistas.'],
  ['notas-credito', 'Só notas de crédito', 'O tipo de documento: as devoluções, a subtrair.'],
  ['faixas-fechadas', 'Faixas fechadas', 'Cada faixa fecha-se e fica só o resumo do cliente.'],
  ['colunas', 'Colunas por grupos', 'Sem a requisição e a unidade; fica guardado.'],
  ['cartoes', 'Cartões por cliente', 'Um cartão por cliente comprador: quantidade, valor, documentos, última compra, as duas ações.'],
  ['cliente-cartoes', 'Cartões por artigo', 'Por cliente: um cartão por artigo comprado, com a família.'],
  ['hierarquia', 'Hierarquia por artigo', 'Artigo › Clientes › Documentos, com a quantidade e o valor de cada nível.'],
  ['cliente-hierarquia', 'Hierarquia por cliente', 'Cliente › Família › Subfamília › Artigo › Documentos.'],
  ['analise', 'Análise por artigo', 'Clientes por valor e quantidade, vendas por mês, preço líquido por mês e descontos médios.'],
  ['cliente-analise', 'Análise por cliente', 'Artigos por valor, por família, por mês, últimas compras e frequência.'],
  ['detalhe-doc', 'Detalhe do documento', 'Série, número, data, tipo, cliente, artigo, quantidade, preço, descontos, valor com e sem IVA.'],
  ['detalhe-cliente', 'Detalhe do cliente', 'O que comprou, os documentos e as datas.'],
  ['sem-vendas', 'Artigo sem vendas', 'Um artigo novo na tabela: diz que ainda não se vendeu.'],
  ['sem-vendas-filtros', 'Sem linhas com estes filtros', 'Os filtros deixam zero; Limpar filtros, o escolhido fica.'],
  ['a-carregar', 'A ler as vendas', 'A espera em esqueleto; a pesquisa já serve.'],
  ['a-atualizar', 'A atualizar (F9)', 'As linhas ficam à vista, esbatidas, até chegar a resposta.'],
  ['exportado', 'Exportado para Excel', 'As linhas com o nome do cliente e a descrição; valores sem IVA.'],
  ['servidor', 'Servidor indisponível', 'O servidor das vendas não respondeu: Tentar outra vez.'],
  ['offline', 'Sem ligação', 'Sem rede: a pesquisa e os filtros ficam.'],
  ['sessao', 'Sessão terminada', 'Voltar a entrar pelo login comum.'],
  ['permissao', 'Sem permissão', 'O perfil não tem acesso aos mapas de Stocks.'],
];
export type IdMapaAc = 'stocks-mapa-artigos-clientes' | `mac-${string}`;
export function ecrasMapaArtigosClientes(): Ecra<IdErp>[] {
  const v = (cen: string) => ({ id: 'v2', nota: NOTA, html: html(cen) });
  return [
    { id: 'stocks-mapa-artigos-clientes', nome: '75 · Artigos/Clientes', fluxo: 'Stocks', objetivo: 'Quem comprou um artigo e o que comprou um cliente: quanto, quando, a que preço; em tabela, cartões, hierarquia ou análise.', versoes: [v('inicial')] as Ecra<IdErp>['versoes'] },
    ...ESTADOS.map(([cen, nome, objetivo], i) => ({ id: `mac-${cen}` as IdErp, nome: `75.${i + 1} · ${nome}`, fluxo: 'Stocks', estadoDe: 'stocks-mapa-artigos-clientes' as IdErp, objetivo, versoes: [v(cen)] as Ecra<IdErp>['versoes'] })),
  ] as Ecra<IdErp>[];
}
