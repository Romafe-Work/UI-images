/* =========================================================
   ERP — Stocks ▸ Mapas ▸ 77 · Movimentos de artigos (18 nov. 2026). Ela mostrou três ecrãs do ERP antigo e pediu «estes
   devem ficar no mesmo screen, separados por tabs»:
     - Movimentos («Ficha de custeio — movimentos»): Visualizar p/ Artigo (F1), Descrição (F2), Armazém (F3), Data (F4),
       Documento (F5); Pesquisa Iniciado por / Contendo / Exactamente igual (Shift+F1/F2/F3) e Encomenda fornecedor
       (Shift+F6); #Armazém, #Artigo, #Tipo Movimento, Pr. Médio; colunas #Artigo, #Armazém, Data, #Série, Documento,
       Preço, Tipo Movimento, Qt. Entrada, Qt. Saída, Valor Entradas, Valor Saídas; F9, F11;
     - Extrato («Extracto de Movimentos de Artigo»): critérios #Artigo e Ano de análise, Gerar dados (F10); agrupado por
       Ano; #Armazém, Nr. Doc., Data, Documento, Preço unitário, Qt./Valor entrada, Qt./Valor saída, Pr. médio,
       Qt. stock, Valor stock; F4 Excel, F12 Imprimir;
     - Saldo («Movimentos de Stocks — Saldo»): critérios Artigo inicial e final (0 a ZZZZZZ), Gerar dados (F10);
       #Artigo, Descrição, Data, Qt. entrada, Qt. saída, Saldo, Valor entrada, Valor saída, Preço médio, #Tipo,
       Designação tipo doc.; o «arraste para aqui o cabeçalho para agrupar» passa a um Agrupar.
   Os movimentos são os que mexem no stock nos outros ecrãs (o stock de partida, as receções das Compras, o inventário
   inicial, as transferências, os acréscimos, as perdas, as passagens entre artigos) e os ajustes em valor, que não mexem
   na quantidade mas mudam o custo. O preço médio é o ponderado de cada artigo (todos os armazéns): a entrada soma ao
   preço dela; a saída, a transferência e a passagem saem ao preço médio; o ajuste em valor põe o custo novo. O saldo
   final de cada artigo é o stock dos outros ecrãs.
   CSS: css/mapa-artigos-clientes.css, css/mapa-stocks.css e css/mapa-movimentos.css.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { topoErp } from '../inicio-v2';
import { L, esc } from '../espaco';
import { BTN } from '../compras/docs-v2';
import { ARTIGOS, artigo, euros, dia, HOJE, db as dbCompras, rececoes, encomenda, stockInicial, ARMAZEM } from '../compras/dominio';
import { xlsx, descarregar, type Celula } from '../compras/xlsx';
import { ARMAZENS, inventarios, transferencias, movimentos as docsMov, ajustamentos, passagens, stockTotal } from './dominio';
import arrowLeftRight from 'lucide-static/icons/arrow-left-right.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import scale from 'lucide-static/icons/scale.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import sheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import textIc from 'lucide-static/icons/text.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import calendar from 'lucide-static/icons/calendar.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import funnelX from 'lucide-static/icons/funnel-x.svg?raw';
import arrowUp from 'lucide-static/icons/arrow-up.svg?raw';
import arrowDown from 'lucide-static/icons/arrow-down.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';

/* ---------- os movimentos ---------- */
type CodTipo = 'SI' | 'II' | 'RC' | 'TA' | 'AC' | 'QB' | 'TT' | 'AV';
export const NOME_TIPO: Record<CodTipo, string> = { SI: 'Stock de partida', II: 'Inventário inicial', RC: 'Receção de encomenda', TA: 'Transferência', AC: 'Acréscimo', QB: 'Perda', TT: 'Passagem de artigo', AV: 'Ajustamento em valor' };
export interface Mov {
  n: number; ref: string; armazem: string; data: string; serie: string; doc: string; docCompleto: string; cod: CodTipo; anulacao: boolean; enc: string;
  qtd: number; preco: number; vEnt: number; vSai: number; pm: number; saldoArt: number; valorArt: number;
}
const iso = (s: string) => { const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : s.slice(0, 10); };
const codArm = (nome: string) => ARMAZENS.find((a) => a.nome === nome)?.cod ?? nome;
export const designacao = (m: Pick<Mov, 'cod' | 'anulacao' | 'qtd'>) => (m.anulacao ? 'Anulação · ' : '') + NOME_TIPO[m.cod] + (m.cod === 'TA' || m.cod === 'TT' ? (m.qtd < 0 ? ' (sai)' : ' (entra)') : '');

/** Todos os movimentos, pela ordem em que aconteceram, com o preço médio e o saldo de cada artigo depois de cada um. */
export function todosMovimentos(): Mov[] {
  /* os documentos, para a data e o preço de cada movimento */
  const tr = transferencias(); // também sincroniza os documentos de stock com o stock
  const datas = new Map<string, { data: string; anulado?: string }>();
  inventarios().forEach((d) => datas.set(d.ref, { data: d.data, anulado: d.anulado && iso(d.anulado.quando) }));
  tr.forEach((d) => datas.set(d.ref, { data: d.data, anulado: d.anulado && iso(d.anulado.quando) }));
  [...docsMov('AC'), ...docsMov('QB')].forEach((d) => datas.set(d.ref, { data: d.data, anulado: d.anulado && iso(d.anulado.quando) }));
  passagens().forEach((t) => datas.set(t.ref, { data: iso(t.quando) }));
  rececoes().forEach((r) => datas.set(r.ref, { data: iso(r.data), anulado: r.anulada && iso(r.anulada.quando) }));
  const custos = new Map<string, number>(); // chave do movimento → preço da linha
  inventarios().forEach((d) => d.linhas.forEach((l) => custos.set(`${d.ref}:${l.id}`, l.custo)));
  [...docsMov('AC'), ...docsMov('QB')].forEach((d) => d.linhas.forEach((l) => custos.set(`${d.ref}:${l.id}`, l.custo)));
  const recs = new Map(rececoes().map((r) => [r.ref, r]));

  interface Bruto { ref: string; armazem: string; data: string; origem: string; qtd: number; anulacao: boolean; cod: CodTipo; precoLinha?: number; enc: string; novo?: number; ord: number }
  const brutos: Bruto[] = [];
  const ini = stockInicial();
  Object.entries(ini).forEach(([ref, q], i) => { if (q) brutos.push({ ref, armazem: ARMAZEM, data: '2026-01-01', origem: 'Stock de partida', qtd: q, anulacao: false, cod: 'SI', precoLinha: artigo(ref)?.preco ?? 0, enc: '', ord: -10000 + i }); });
  dbCompras().mov.forEach((m, i) => {
    const pre = m.origem.split(' ')[0] as CodTipo, anulacao = m.chave.includes(':anular');
    const cod: CodTipo = (['II', 'TA', 'AC', 'QB', 'TT'] as string[]).includes(pre) ? pre : 'RC';
    const d = datas.get(m.origem), data = (anulacao ? d?.anulado : d?.data) ?? HOJE;
    let precoLinha: number | undefined, enc = '';
    if (cod === 'II' || cod === 'AC' || cod === 'QB') precoLinha = custos.get(m.chave.replace(':anular', ''));
    if (cod === 'RC') { const r = recs.get(m.origem); enc = r?.enc ?? ''; const id = m.chave.split(':').pop()!; const l = r ? encomenda(r.enc)?.linhas.find((x) => x.id === id) : undefined; precoLinha = l?.preco ?? undefined; }
    brutos.push({ ref: m.ref, armazem: m.armazem, data, origem: m.origem, qtd: m.qtd, anulacao, cod, precoLinha, enc, ord: i });
  });
  ajustamentos().filter((a) => a.estado === 'Lançado').forEach((a, i) => a.linhas.forEach((l) => brutos.push({ ref: l.ref, armazem: '', data: a.data, origem: a.ref, qtd: 0, anulacao: false, cod: 'AV', novo: l.novo, enc: '', ord: 5000 + i })));
  brutos.sort((a, b) => a.data.localeCompare(b.data) || a.ord - b.ord);

  /* o preço médio ponderado e o saldo de cada artigo, movimento a movimento */
  const q = new Map<string, number>(), v = new Map<string, number>();
  return brutos.map((b, n): Mov => {
    const q0 = q.get(b.ref) ?? 0, v0 = v.get(b.ref) ?? 0, pm0 = q0 > 0 ? Math.round(v0 / q0) : (artigo(b.ref)?.preco ?? 0);
    let preco = pm0, vEnt = 0, vSai = 0, q1 = q0 + b.qtd, v1 = v0;
    const entraAoPreco = b.qtd > 0 && !b.anulacao && (b.cod === 'SI' || b.cod === 'II' || b.cod === 'RC' || b.cod === 'AC');
    if (b.cod === 'AV') { preco = b.novo ?? pm0; v1 = q0 * preco; const dif = v1 - v0; if (dif >= 0) vEnt = dif; else vSai = -dif; }
    else if (entraAoPreco) { preco = b.precoLinha ?? pm0; vEnt = b.qtd * preco; v1 = v0 + vEnt; }
    else if (b.qtd > 0) { vEnt = b.qtd * pm0; v1 = v0 + vEnt; }
    else { vSai = -b.qtd * pm0; v1 = v0 - vSai; }
    if (q1 <= 0) v1 = 0;
    q.set(b.ref, q1); v.set(b.ref, v1);
    /* «TA 2026/0003»: a série é «TA 2026» e o número «0003» */
    const p = b.origem.match(/^(\S+ \d{4})\/(\S+)$/);
    return { n, ref: b.ref, armazem: b.armazem, data: b.data, serie: b.cod === 'SI' ? '—' : p ? p[1] : b.origem, doc: b.cod === 'SI' ? '—' : p ? p[2] : b.origem, docCompleto: b.cod === 'SI' ? '—' : b.origem, cod: b.cod, anulacao: b.anulacao, enc: b.enc,
      qtd: b.qtd, preco, vEnt, vSai, pm: q1 > 0 ? Math.round(v1 / q1) : preco, saldoArt: q1, valorArt: q1 > 0 ? q1 * Math.round(v1 / q1) : 0 }; // o valor que se mostra é a quantidade × o preço médio mostrado
  });
}

/* ---------- o estado ---------- */
type Tab = 'mov' | 'ext' | 'sal';
type Modo = 'artigo' | 'descricao' | 'armazem' | 'data' | 'documento' | 'encomenda';
type Comp = 'inicio' | 'contem' | 'igual' | 'encomenda';
interface Est {
  tab: Tab; escolhido?: string; modo: Modo; comp: Comp; q: string; armazem: string; art: string; tipo: string; de: string; ate: string; ordem: { k: string; dir: 1 | -1 } | null;
  extArt: string; extAno: string; extFeito?: { art: string; ano: string }; extEditar: boolean;
  salIni: string; salFim: string; salFeito?: { ini: string; fim: string }; salGrupo: '' | 'artigo' | 'tipo'; salEditar: boolean;
  aviso: string; editor: boolean; erroCrit: string;
}
const novo = (): Est => ({ tab: 'mov', modo: 'artigo', comp: 'inicio', q: '', armazem: '', art: '', tipo: '', de: '', ate: '', ordem: null, extArt: '', extAno: '2026', extEditar: true, salIni: '0', salFim: 'ZZZZZZ', salGrupo: '', salEditar: true, aviso: '', editor: document.body.classList.contains('editando'), erroCrit: '' });
const estados = new WeakMap<HTMLElement, Est>();
const de = (r: HTMLElement) => { let e = estados.get(r); if (!e) { e = novo(); estados.set(r, e); } return e; };
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
const raiz = (t: Element | null) => t?.closest<HTMLElement>('[data-mva]') ?? null;
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-mva]');
const nf = (n: number) => n.toLocaleString('pt-PT');
const num = (n: number) => n === 0 ? '<span class="is-nada">0</span>' : `<span class="${n < 0 ? 'mac-neg' : ''}">${n < 0 ? '−' : ''}${nf(Math.abs(n))}</span>`;
const eur = (c: number) => c === 0 ? '<span class="is-nada">0,00 €</span>' : euros(c);
const curto = (nome: string) => nome ? nome.replace('Armazém ', '') : '—';
const sem = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
const compara = (c: Comp, v: string, q: string) => { const a = sem(v), b = sem(q); return c === 'igual' ? a === b : c === 'contem' || c === 'encomenda' ? a.includes(b) : a.startsWith(b); };
const MODOS: { k: Modo; tecla: string; t: string; ic: string; ph: string }[] = [
  { k: 'artigo', tecla: 'F1', t: 'Artigo', ic: hash, ph: 'Referência, ex.: 6206' },
  { k: 'descricao', tecla: 'F2', t: 'Descrição', ic: textIc, ph: 'Descrição, ex.: pastilhas' },
  { k: 'armazem', tecla: 'F3', t: 'Armazém', ic: warehouse, ph: 'Armazém, ex.: 60 ou Porto' },
  { k: 'data', tecla: 'F4', t: 'Data', ic: calendar, ph: 'Data, ex.: 15/10/2026' },
  { k: 'documento', tecla: 'F5', t: 'Documento', ic: fileText, ph: 'Documento, ex.: TA 2026' },
];
const TABS: { k: Tab; t: string; ic: string }[] = [{ k: 'mov', t: 'Movimentos', ic: list }, { k: 'ext', t: 'Extrato por artigo', ic: fileText }, { k: 'sal', t: 'Saldo', ic: scale }];

/* ---------- a página ---------- */
function html(cen: string): string {
  const id = (x: string) => `mva-${x}-${cen}`;
  const op = (v: string, t: string) => `<option value="${esc(v)}">${esc(t)}</option>`;
  const B = (k: string, ic: string, t: string, tecla: string, cls = '') => BTN(k, ic, t, tecla, '', cls).replace('data-dv2-acao', 'data-mva-acao');
  const arts = ARTIGOS.map((a) => op(a.ref, `${a.ref} · ${a.desc}`)).join('');
  return `<div class="hm ak lf2 dv2 mac mst mva" data-hm data-mva data-mva-cenario="${cen}" data-teclas="F1 F2 F3 F4 F5 F9 F10 F11 F12 Escape">
  ${topoErp([['ERP', 'inicio'], ['Stocks', ''], ['Mapas', ''], ['Movimentos de artigos', '']])}
  <header class="ak-cab lf2-cab">
    <span class="ak-cab-ic">${L(arrowLeftRight)}</span>
    <div><h1>Movimentos de artigos</h1><p>Tudo o que entrou e saiu de cada artigo, o extrato com o stock a cada passo e o saldo.</p></div>
  </header>
  <nav class="dv2c-vistas-zona" aria-label="Vistas"><div class="dv2-vistas dv2c-vistas" role="tablist" aria-label="Ver">${TABS.map((t, i) => `<button type="button" role="tab" id="${id(`tab-${t.k}`)}" aria-controls="${id(`p-${t.k}`)}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''} data-mva-tab="${t.k}">${L(t.ic)}<span>${t.t}</span></button>`).join('')}<i class="dv2c-vistas-ind" data-mva-ind aria-hidden="true"></i></div></nav>

  <div class="ak-barra lf2-barra mva-barra" role="toolbar" aria-label="Ações">
    <span data-mva-so="mov">${B('atualizar', refresh, 'Atualizar', 'F9')}${B('imprimir', printer, 'Imprimir', 'F11')}<i class="ak-sep" aria-hidden="true"></i>${B('extrato', fileText, 'Ver extrato', 'Enter')}</span>
    <span data-mva-so="ext sal" hidden>${B('imprimir2', printer, 'Imprimir', 'F12')}</span>
    <i class="ak-sep" aria-hidden="true"></i>
    ${B('excel', sheet, 'Exportar para Excel', '')}
    <span class="ak2-esp"></span>
    <span class="mva-pm" data-mva-pm></span>
  </div>

  <!-- Movimentos -->
  <section role="tabpanel" id="${id('p-mov')}" aria-labelledby="${id('tab-mov')}" data-mva-p="mov">
    <div class="lf-filtros lf2-filtros dv2-filtros mac-filtros">
      <div class="ak-campo dv2-pesquisa mac-pesquisa" role="group" aria-labelledby="${id('pq-t')}">
        <span id="${id('pq-t')}">Visualização</span>
        <div class="dv2-pq mac-pq mva-pq">
          <span class="dv2-modos" role="radiogroup" aria-label="Visualizar por">${MODOS.map((m, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-mva-modo="${m.k}" title="Visualizar por ${m.t.toLowerCase()} (${m.tecla})">${L(m.ic)}<span>${m.t}</span><kbd>${m.tecla}</kbd></button>`).join('')}</span>
          <span class="lf2-comp" role="radiogroup" aria-label="Como compara">
            <button type="button" role="radio" aria-checked="true" data-mva-comp="inicio" title="Pesquisa iniciada por (Shift+F1)">Iniciado por</button>
            <button type="button" role="radio" aria-checked="false" data-mva-comp="contem" title="Pesquisa contendo (Shift+F2)">Contendo</button>
            <button type="button" role="radio" aria-checked="false" data-mva-comp="igual" title="Pesquisa exatamente igual a (Shift+F3)">Igual a</button>
            <button type="button" role="radio" aria-checked="false" data-mva-comp="encomenda" title="As receções de uma encomenda a fornecedor (Shift+F6)">${L(truck)}Encomenda</button>
          </span>
          <label class="lf2-pq-in">${L(search)}<input type="search" id="${id('q')}" data-mva-q autocomplete="off" placeholder="${MODOS[0].ph}" aria-label="Pesquisar"></label>
        </div>
      </div>
      <div class="mst-campos mva-campos">
        <label class="ak-campo" for="${id('arm')}"><span>Armazém</span><select id="${id('arm')}" data-mva-f="armazem">${op('', 'Todos')}${ARMAZENS.map((a) => op(a.cod, curto(a.nome))).join('')}</select></label>
        <label class="ak-campo" for="${id('art')}"><span>Artigo</span><select id="${id('art')}" data-mva-f="art">${op('', 'Todos')}${arts}</select></label>
        <label class="ak-campo" for="${id('tipo')}"><span>Tipo de movimento</span><select id="${id('tipo')}" data-mva-f="tipo">${op('', 'Todos')}${(Object.keys(NOME_TIPO) as CodTipo[]).map((k) => op(k, `${k} · ${NOME_TIPO[k]}`)).join('')}</select></label>
        <div class="ak-campo dv2-periodo" role="group" aria-labelledby="${id('per')}"><span id="${id('per')}">Período</span><span class="ak2-per"><input type="date" data-mva-f="de" aria-label="Período — de"><i>a</i><input type="date" data-mva-f="ate" aria-label="Período — até"></span></div>
      </div>
    </div>
    <div class="rc-somatorios mac-soma" data-mva-soma="mov"></div>
    <section class="lf2-lista dv2-lista"><div class="lf2-lista-cab"><h2>Movimentos</h2><p class="lf2-resumo" data-mva-resumo="mov"></p></div><div class="lf2-grelha lf2-grelha--ajusta" data-mva-g="mov" tabindex="-1"></div></section>
  </section>

  <!-- Extrato -->
  <section role="tabpanel" id="${id('p-ext')}" aria-labelledby="${id('tab-ext')}" data-mva-p="ext" hidden>
    <form class="ak-crit mva-crit" data-mva-crit="ext" novalidate>
      <div class="rc-resumo-crit" data-mva-resumo-crit="ext" hidden></div>
      <div data-mva-aberto="ext"><div class="ak-crit-cab"><h2>Critérios</h2></div>
        <div class="ak-crit-c mva-crit-c"><div class="mva-crit-campos">
          <label class="ak-campo" for="${id('ext-art')}"><span>Artigo</span><select id="${id('ext-art')}" data-mva-c="extArt" data-ak-primeiro>${op('', 'Escolhe um artigo')}${arts}</select></label>
          <label class="ak-campo mva-ano" for="${id('ext-ano')}"><span>Ano de análise</span><input type="number" id="${id('ext-ano')}" data-mva-c="extAno" min="2025" max="2026" step="1"></label>
          <p class="ak-erro-campo" data-mva-erro="ext" role="alert" hidden></p>
        </div><div class="ak-crit-acoes">${B('gerar', play, 'Gerar dados', 'F10', 'ak-btn--acao')}${B('cancelar', xIc, 'Cancelar', 'Esc', 'ak-btn--linha')}</div></div>
      </div>
    </form>
    <div class="rc-somatorios mac-soma" data-mva-soma="ext"></div>
    <section class="lf2-lista dv2-lista"><div class="lf2-lista-cab"><h2 data-mva-t="ext">Extrato</h2><p class="lf2-resumo" data-mva-resumo="ext"></p></div><div class="lf2-grelha lf2-grelha--ajusta" data-mva-g="ext" tabindex="-1"></div></section>
  </section>

  <!-- Saldo -->
  <section role="tabpanel" id="${id('p-sal')}" aria-labelledby="${id('tab-sal')}" data-mva-p="sal" hidden>
    <form class="ak-crit mva-crit" data-mva-crit="sal" novalidate>
      <div class="rc-resumo-crit" data-mva-resumo-crit="sal" hidden></div>
      <div data-mva-aberto="sal"><div class="ak-crit-cab"><h2>Critérios</h2></div>
        <div class="ak-crit-c mva-crit-c"><div class="mva-crit-campos">
          <label class="ak-campo" for="${id('sal-ini')}"><span>Artigo inicial</span><input type="text" id="${id('sal-ini')}" data-mva-c="salIni" list="${id('la')}" autocomplete="off"></label>
          <label class="ak-campo" for="${id('sal-fim')}"><span>Artigo final</span><input type="text" id="${id('sal-fim')}" data-mva-c="salFim" list="${id('la')}" autocomplete="off"></label>
          <datalist id="${id('la')}">${ARTIGOS.map((a) => `<option value="${esc(a.ref)}">${esc(a.desc)}</option>`).join('')}</datalist>
          <p class="ak-erro-campo" data-mva-erro="sal" role="alert" hidden></p>
        </div><div class="ak-crit-acoes">${B('gerar', play, 'Gerar dados', 'F10', 'ak-btn--acao')}${B('cancelar', xIc, 'Cancelar', 'Esc', 'ak-btn--linha')}</div></div>
      </div>
    </form>
    <div class="rc-somatorios mac-soma" data-mva-soma="sal"></div>
    <section class="lf2-lista dv2-lista"><div class="lf2-lista-cab"><h2>Saldo por artigo</h2><p class="lf2-resumo" data-mva-resumo="sal"></p>
      <label class="rc-agrupar mva-agrupar"><span>${L(layers)}Agrupar</span><select data-mva-grupo aria-label="Agrupar por"><option value="">Sem grupos</option><option value="artigo">Por artigo</option><option value="tipo">Por tipo de documento</option></select></label></div>
      <div class="lf2-grelha lf2-grelha--ajusta" data-mva-g="sal" tabindex="-1"></div></section>
  </section>
  <div class="mac-impressao" aria-hidden="true" data-mva-impressao></div>
  <footer class="ak-estado lf2-estado" data-mva-estado role="status" aria-live="polite"></footer>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

/* ---------- as tabelas ---------- */
interface Col { k: string; t: string; w: number; n?: boolean; titulo?: string; cel: (m: Mov) => string; v: (m: Mov) => string | number }
const ent = (m: Mov) => (m.qtd > 0 ? m.qtd : 0), sai = (m: Mov) => (m.qtd < 0 ? -m.qtd : 0);
const C = {
  artigo: { k: 'artigo', t: 'Artigo', w: 17, cel: (m: Mov) => `<span class="mac-ent-c"><b class="is-mono">${esc(m.ref)}</b> ${esc(artigo(m.ref)?.desc ?? '')}</span>`, v: (m: Mov) => m.ref },
  armazem: { k: 'armazem', t: 'Armazém', w: 9, cel: (m: Mov) => esc(m.cod === 'AV' ? 'Todos' : curto(m.armazem)), v: (m: Mov) => m.armazem },
  data: { k: 'data', t: 'Data', w: 7.5, cel: (m: Mov) => dia(m.data), v: (m: Mov) => m.data },
  serie: { k: 'serie', t: 'Série', w: 6.5, cel: (m: Mov) => `<span class="is-mono">${esc(m.serie)}</span>`, v: (m: Mov) => m.serie },
  doc: { k: 'doc', t: 'Documento', w: 7, cel: (m: Mov) => `<b class="is-mono">${esc(m.doc)}</b>`, v: (m: Mov) => m.doc },
  preco: { k: 'preco', t: 'Preço', w: 6.5, n: true, cel: (m: Mov) => euros(m.preco), v: (m: Mov) => m.preco },
  tipo: { k: 'tipo', t: 'Tipo de movimento', w: 14, cel: (m: Mov) => `<span class="mva-tipo${m.anulacao ? ' is-anul' : ''}">${esc(designacao(m))}</span>`, v: (m: Mov) => designacao(m) },
  qEnt: { k: 'qEnt', t: 'Qt. entrada', w: 6.5, n: true, cel: (m: Mov) => num(ent(m)), v: ent },
  qSai: { k: 'qSai', t: 'Qt. saída', w: 6.5, n: true, cel: (m: Mov) => num(sai(m)), v: sai },
  vEnt: { k: 'vEnt', t: 'Valor entradas', w: 9.5, n: true, cel: (m: Mov) => eur(m.vEnt), v: (m: Mov) => m.vEnt },
  vSai: { k: 'vSai', t: 'Valor saídas', w: 9.5, n: true, cel: (m: Mov) => eur(m.vSai), v: (m: Mov) => m.vSai },
  pm: { k: 'pm', t: 'Pr. médio', w: 7, n: true, titulo: 'O preço médio ponderado do artigo depois do movimento', cel: (m: Mov) => euros(m.pm), v: (m: Mov) => m.pm },
  docTipo: { k: 'docTipo', t: 'Tipo', w: 4.5, cel: (m: Mov) => `<span class="is-mono">${m.cod}</span>`, v: (m: Mov) => m.cod },
} satisfies Record<string, Col>;
function tabela(r: HTMLElement, e: Est, chave: string, cs: Col[], corpo: string, rodape: string, rotulo: string): string {
  const sort = (k: string) => e.ordem?.k === k ? (e.ordem.dir === 1 ? 'ascending' : 'descending') : 'none';
  void r; void chave;
  return `<table class="lf2-tab lf2-tab--ajusta mva-tab" aria-label="${esc(rotulo)}"><colgroup>${cs.map((c) => `<col style="width:${c.w}%">`).join('')}</colgroup>
    <thead><tr>${cs.map((c) => `<th scope="col" class="${c.n ? 'is-num' : ''}" aria-sort="${sort(c.k)}"${c.titulo ? ` title="${esc(c.titulo)}"` : ''}><button type="button" data-mva-ordenar="${c.k}">${esc(c.t)}${e.ordem?.k === c.k ? `<span class="lf2-ord">${L(e.ordem.dir === 1 ? arrowUp : arrowDown)}</span>` : ''}</button></th>`).join('')}</tr></thead>
    <tbody>${corpo}</tbody><tfoot>${rodape}</tfoot></table>`;
}
const ordenar = (e: Est, ms: Mov[], cs: Col[]) => { if (!e.ordem) return ms; const c = cs.find((x) => x.k === e.ordem!.k); if (!c) return ms; const d = e.ordem.dir; return ms.slice().sort((a, b) => { const x = c.v(a), y = c.v(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt', { numeric: true })) * d; }); };
const vazio = (ic: string, t: string, d: string, botao = '') => `<div class="ak-vazio lf2-vazio">${L(ic)}<p><b>${t}</b>${d}</p>${botao}</div>`;
const tot = (ms: Mov[], f: (m: Mov) => number) => ms.reduce((s, m) => s + f(m), 0);

/* Movimentos: a lista com a pesquisa e os filtros */
function filtrarMov(e: Est): Mov[] {
  const q = e.q.trim();
  return todosMovimentos().filter((m) => (!e.armazem || codArm(m.armazem) === e.armazem || (m.cod === 'AV')) && (!e.art || m.ref === e.art) && (!e.tipo || m.cod === e.tipo) && (!e.de || m.data >= e.de) && (!e.ate || m.data <= e.ate)
    && (!q || (e.comp === 'encomenda' ? compara('contem', m.enc, q) : e.modo === 'artigo' ? compara(e.comp, m.ref, q) : e.modo === 'descricao' ? compara(e.comp, artigo(m.ref)?.desc ?? '', q)
      : e.modo === 'armazem' ? compara(e.comp, m.armazem, q) || compara(e.comp, codArm(m.armazem), q) : e.modo === 'data' ? compara(e.comp, dia(m.data), q) : compara(e.comp, `${m.serie} ${m.doc}`, q) || compara(e.comp, m.doc, q))))
    .sort((a, b) => e.modo === 'descricao' ? (artigo(a.ref)?.desc ?? '').localeCompare(artigo(b.ref)?.desc ?? '', 'pt') || a.n - b.n : e.modo === 'armazem' ? a.armazem.localeCompare(b.armazem) || a.n - b.n : e.modo === 'artigo' ? a.ref.localeCompare(b.ref, 'pt', { numeric: true }) || a.n - b.n : e.modo === 'documento' ? `${a.serie}${a.doc}`.localeCompare(`${b.serie}${b.doc}`, 'pt', { numeric: true }) : b.n - a.n);
}
function desenharMov(r: HTMLElement, e: Est): void {
  const g = r.querySelector<HTMLElement>('[data-mva-g="mov"]')!, cs: Col[] = [C.artigo, C.armazem, C.data, C.serie, C.doc, C.preco, C.tipo, C.qEnt, C.qSai, C.vEnt, C.vSai];
  const ms = ordenar(e, filtrarMov(e), cs);
  r.querySelector<HTMLElement>('[data-mva-resumo="mov"]')!.innerHTML = `<span><b>${nf(ms.length)}</b> movimentos</span>${[e.armazem && `armazém ${e.armazem}`, e.art, e.tipo && NOME_TIPO[e.tipo as CodTipo], e.q && `«${e.q}»`].filter(Boolean).map((x) => `<span>${esc(String(x))}</span>`).join('')}${e.armazem || e.art || e.tipo || e.q || e.de || e.ate ? `<button type="button" class="lf2-limpar" data-mva-acao="limpar">${L(funnelX)}<span>Limpar</span></button>` : ''}`;
  const s = r.querySelector<HTMLElement>('[data-mva-soma="mov"]')!;
  s.hidden = !ms.length;
  s.innerHTML = ms.length ? `<span class="rc-s rc-s--total"><small>Valor das entradas</small><b>${euros(tot(ms, (m) => m.vEnt))}</b><i>${nf(tot(ms, ent))} unidades</i></span><span class="rc-s"><small>Valor das saídas</small><b>${euros(tot(ms, (m) => m.vSai))}</b><i>${nf(tot(ms, sai))} unidades</i></span><span class="rc-s"><small>Artigos</small><b>${nf(new Set(ms.map((m) => m.ref)).size)}</b><i>${nf(new Set(ms.map((m) => `${m.serie} ${m.doc}`)).size)} documentos</i></span>` : '';
  if (!ms.length && e.comp === 'encomenda' && e.q) { g.innerHTML = vazio(searchX, `Nenhuma receção da encomenda «${esc(e.q)}» lançada no stock.`, 'As receções das Compras entram aqui quando se lançam; no protótipo ainda não há nenhuma.', `<button type="button" class="ak-btn" data-mva-acao="limpar">${L(funnelX)}<span>Limpar a pesquisa</span></button>`); return; }
  if (!ms.length) { g.innerHTML = vazio(searchX, 'Nenhum movimento com estes filtros.', e.q ? `Nada ${e.comp === 'inicio' ? 'começa por' : e.comp === 'igual' ? 'é exatamente' : 'contém'} «${esc(e.q)}».` : 'Alarga o período ou tira um filtro.', `<button type="button" class="ak-btn" data-mva-acao="limpar">${L(funnelX)}<span>Limpar filtros</span></button>`); return; }
  /* tocar num movimento abre o extrato desse artigo nesse ano */
  const corpo = ms.map((m) => `<tr class="mva-linha${m.anulacao ? ' is-anulado' : ''}" data-mva-ref="${esc(m.ref)}" data-mva-ano="${m.data.slice(0, 4)}" data-mva-n="${m.n}" tabindex="${String(m.n) === e.escolhido ? 0 : -1}" title="Enter ou duplo clique: o extrato de ${esc(m.ref)} em ${m.data.slice(0, 4)}">${cs.map((c) => `<td class="${c.n ? 'is-num' : ''}">${c.cel(m)}</td>`).join('')}</tr>`).join('');
  const rod = `<tr class="rc-total mac-total"><td colspan="7"><b>Total · ${nf(ms.length)} movimentos</b></td><td class="is-num"><b>${nf(tot(ms, ent))}</b></td><td class="is-num"><b>${nf(tot(ms, sai))}</b></td><td class="is-num"><b>${euros(tot(ms, (m) => m.vEnt))}</b></td><td class="is-num"><b>${euros(tot(ms, (m) => m.vSai))}</b></td></tr>`;
  g.innerHTML = tabela(r, e, 'mov', cs, corpo, rod, 'Movimentos');
  /* sem nenhum escolhido, a primeira linha recebe o Tab */
  if (!g.querySelector('tr[data-mva-ref][tabindex="0"]')) g.querySelector<HTMLElement>('tr[data-mva-ref]')?.setAttribute('tabindex', '0');
  const sel = e.escolhido ? g.querySelector<HTMLElement>(`tr[data-mva-n="${e.escolhido}"]`) : null; sel?.classList.add('is-ativo');
  barraExtrato(r, e);
}

/* Extrato: um artigo num ano, com o stock a cada passo, por armazém e no total */
function desenharExt(r: HTMLElement, e: Est): void {
  const g = r.querySelector<HTMLElement>('[data-mva-g="ext"]')!, s = r.querySelector<HTMLElement>('[data-mva-soma="ext"]')!, t = r.querySelector<HTMLElement>('[data-mva-t="ext"]')!;
  const f = e.extFeito;
  if (!f) { s.hidden = true; t.textContent = 'Extrato'; g.innerHTML = vazio(play, 'Escolhe o artigo e o ano e gera os dados.', 'F10 em qualquer sítio deste separador.'); return; }
  const a = artigo(f.art)!, todos = todosMovimentos().filter((m) => m.ref === f.art), ano = Number(f.ano);
  const antes = todos.filter((m) => Number(m.data.slice(0, 4)) < ano), noAno = todos.filter((m) => Number(m.data.slice(0, 4)) === ano);
  t.textContent = `Extrato de ${a.ref} · ${a.desc} · ${f.ano}`;
  const ab = antes[antes.length - 1];
  /* o stock de cada armazém a cada passo; o «Qt. stock» é o do armazém do movimento, o total vai na faixa */
  const porArm = new Map<string, number>(); antes.forEach((m) => { if (m.armazem) porArm.set(m.armazem, (porArm.get(m.armazem) ?? 0) + m.qtd); });
  const cs: Col[] = [C.armazem, { k: 'nrdoc', t: 'Nr. doc.', w: 10, cel: (m: Mov) => `<b class="is-mono">${esc(m.docCompleto)}</b>`, v: (m: Mov) => m.docCompleto }, C.data, { ...C.tipo, t: 'Documento', w: 15 }, { ...C.preco, t: 'Preço unitário', w: 8 }, { ...C.qEnt, t: 'Qt. entrada' }, { ...C.vEnt, t: 'Valor entrada', w: 8 }, { ...C.qSai, t: 'Qt. saída' }, { ...C.vSai, t: 'Valor saída', w: 8 }, C.pm,
    { k: 'qStk', t: 'Qt. stock', w: 6.5, n: true, titulo: 'O stock do artigo em todos os armazéns depois do movimento', cel: (m: Mov) => num(m.saldoArt), v: (m: Mov) => m.saldoArt },
    { k: 'vStk', t: 'Valor stock', w: 8.5, n: true, cel: (m: Mov) => eur(m.valorArt), v: (m: Mov) => m.valorArt }];
  s.hidden = false;
  const fim = noAno[noAno.length - 1] ?? ab;
  s.innerHTML = `<span class="rc-s"><small>Stock no início do ano</small><b>${nf(ab?.saldoArt ?? 0)} ${esc(a.un)}</b><i>${eur(ab?.valorArt ?? 0)}</i></span><span class="rc-s"><small>Entradas</small><b>${nf(tot(noAno, ent))}</b><i>${euros(tot(noAno, (m) => m.vEnt))}</i></span><span class="rc-s"><small>Saídas</small><b>${nf(tot(noAno, sai))}</b><i>${euros(tot(noAno, (m) => m.vSai))}</i></span><span class="rc-s rc-s--total"><small>Stock no fim</small><b>${nf(fim?.saldoArt ?? 0)} ${esc(a.un)}</b><i>${eur(fim?.valorArt ?? 0)} · pr. médio ${euros(fim?.pm ?? a.preco ?? 0)}</i></span>`;
  r.querySelector<HTMLElement>('[data-mva-resumo="ext"]')!.innerHTML = `<span>${nf(noAno.length)} movimentos</span><span>stock de hoje ${nf(stockTotal(a.ref))} ${esc(a.un)}</span>`;
  if (!noAno.length) { g.innerHTML = vazio(inbox, `${esc(a.ref)} não teve movimentos em ${f.ano}.`, 'Escolhe outro ano ou outro artigo.', `<button type="button" class="ak-btn" data-mva-acao="alterar">${L(pencil)}<span>Alterar critérios</span></button>`); return; }
  const linhaAb = `<tr class="mva-abertura"><td colspan="${cs.length - 2}"><b>Saldo do ano anterior</b></td><td class="is-num"><b>${nf(ab?.saldoArt ?? 0)}</b></td><td class="is-num"><b>${eur(ab?.valorArt ?? 0)}</b></td></tr>`;
  const corpo = `<tr class="mac-g"><td colspan="${cs.length}"><div class="mac-g-c"><span class="mac-g-abrir"><b>Ano ${f.ano}</b><small>${nf(noAno.length)} ${noAno.length === 1 ? 'movimento' : 'movimentos'}</small></span></div></td></tr>${linhaAb}${noAno.map((m) => `<tr class="${m.anulacao ? 'is-anulado' : ''}">${cs.map((c) => `<td class="${c.n ? 'is-num' : ''}">${c.cel(m)}</td>`).join('')}</tr>`).join('')}`;
  const rod = `<tr class="rc-total mac-total"><td colspan="5"><b>Total do ano</b></td><td class="is-num"><b>${nf(tot(noAno, ent))}</b></td><td class="is-num"><b>${euros(tot(noAno, (m) => m.vEnt))}</b></td><td class="is-num"><b>${nf(tot(noAno, sai))}</b></td><td class="is-num"><b>${euros(tot(noAno, (m) => m.vSai))}</b></td><td></td><td class="is-num"><b>${nf(fim?.saldoArt ?? 0)}</b></td><td class="is-num"><b>${eur(fim?.valorArt ?? 0)}</b></td></tr>`;
  g.innerHTML = tabela(r, e, 'ext', cs, corpo, rod, 'Extrato do artigo');
  void porArm;
}

/* Saldo: os movimentos de um intervalo de artigos, com o saldo e o preço médio de cada um */
const dentro = (ref: string, ini: string, fim: string) => ref.localeCompare(ini, 'pt', { numeric: true, sensitivity: 'base' }) >= 0 && ref.localeCompare(fim, 'pt', { numeric: true, sensitivity: 'base' }) <= 0;
function desenharSal(r: HTMLElement, e: Est): void {
  const g = r.querySelector<HTMLElement>('[data-mva-g="sal"]')!, s = r.querySelector<HTMLElement>('[data-mva-soma="sal"]')!, f = e.salFeito;
  const gs = r.querySelector<HTMLSelectElement>('[data-mva-grupo]')!; gs.value = e.salGrupo; gs.disabled = !f;
  if (!f) { s.hidden = true; g.innerHTML = vazio(play, 'Diz o artigo inicial e o final e gera os dados.', 'Do 0 ao ZZZZZZ são todos. F10 em qualquer sítio deste separador.'); return; }
  const ms = todosMovimentos().filter((m) => dentro(m.ref, f.ini, f.fim)).sort((a, b) => a.ref.localeCompare(b.ref, 'pt', { numeric: true }) || a.n - b.n);
  const cs: Col[] = [{ ...C.artigo, w: 10, cel: (m: Mov) => `<b class="is-mono">${esc(m.ref)}</b>` }, { k: 'desc', t: 'Descrição', w: 14, cel: (m: Mov) => esc(artigo(m.ref)?.desc ?? ''), v: (m: Mov) => artigo(m.ref)?.desc ?? '' }, C.data, C.qEnt, C.qSai,
    { k: 'saldo', t: 'Saldo', w: 6.5, n: true, cel: (m: Mov) => `<b>${num(m.saldoArt)}</b>`, v: (m: Mov) => m.saldoArt }, { ...C.vEnt, t: 'Valor entrada', w: 8.5 }, { ...C.vSai, t: 'Valor saída', w: 8.5 }, { ...C.pm, t: 'Preço médio' }, C.docTipo, { ...C.tipo, t: 'Designação tipo doc.', w: 16 }];
  const arts = new Set(ms.map((m) => m.ref));
  s.hidden = !ms.length;
  s.innerHTML = `<span class="rc-s"><small>Artigos</small><b>${nf(arts.size)}</b><i>de ${esc(f.ini)} a ${esc(f.fim)}</i></span><span class="rc-s"><small>Entradas</small><b>${nf(tot(ms, ent))}</b><i>${euros(tot(ms, (m) => m.vEnt))}</i></span><span class="rc-s"><small>Saídas</small><b>${nf(tot(ms, sai))}</b><i>${euros(tot(ms, (m) => m.vSai))}</i></span><span class="rc-s rc-s--total"><small>Saldo de hoje</small><b>${nf([...arts].reduce((t_, a) => t_ + stockTotal(a), 0))}</b><i>todos os armazéns</i></span>`;
  r.querySelector<HTMLElement>('[data-mva-resumo="sal"]')!.innerHTML = `<span>${nf(ms.length)} movimentos</span>`;
  if (!ms.length) { g.innerHTML = vazio(inbox, 'Nenhum artigo neste intervalo.', `De «${esc(f.ini)}» a «${esc(f.fim)}» não há artigos com movimentos.`, `<button type="button" class="ak-btn" data-mva-acao="alterar">${L(pencil)}<span>Alterar critérios</span></button>`); return; }
  const tr = (m: Mov) => `<tr class="${m.anulacao ? 'is-anulado' : ''}">${cs.map((c) => `<td class="${c.n ? 'is-num' : ''}">${c.cel(m)}</td>`).join('')}</tr>`;
  const faixa = (t: string, xs: Mov[]) => `<tr class="mac-g"><td colspan="${cs.length}"><div class="mac-g-c"><span class="mac-g-abrir"><b>${esc(t)}</b><small>${nf(xs.length)} ${xs.length === 1 ? 'movimento' : 'movimentos'}</small></span><span class="mac-g-n">entradas <b>${nf(tot(xs, ent))}</b> · saídas <b>${nf(tot(xs, sai))}</b>${e.salGrupo === 'artigo' ? ` · saldo <b>${nf(xs[xs.length - 1].saldoArt)}</b>` : ''}</span></div></td></tr>${xs.map(tr).join('')}`;
  let corpo: string;
  if (e.salGrupo) {
    const gr = new Map<string, Mov[]>(); ms.forEach((m) => { const k = e.salGrupo === 'artigo' ? m.ref : `${m.cod} · ${NOME_TIPO[m.cod]}`; gr.set(k, [...(gr.get(k) ?? []), m]); });
    corpo = [...gr].sort((a, b) => a[0].localeCompare(b[0], 'pt', { numeric: true })).map(([k, xs]) => faixa(e.salGrupo === 'artigo' ? `${k} · ${artigo(k)?.desc ?? ''}` : k, xs)).join('');
  } else corpo = ordenar(e, ms, cs).map(tr).join('');
  const rod = `<tr class="rc-total mac-total"><td colspan="3"><b>Total · ${nf(arts.size)} artigos</b></td><td class="is-num"><b>${nf(tot(ms, ent))}</b></td><td class="is-num"><b>${nf(tot(ms, sai))}</b></td><td></td><td class="is-num"><b>${euros(tot(ms, (m) => m.vEnt))}</b></td><td class="is-num"><b>${euros(tot(ms, (m) => m.vSai))}</b></td><td colspan="3"></td></tr>`;
  g.innerHTML = tabela(r, e, 'sal', cs, corpo, rod, 'Saldo por artigo');
}

/* ---------- o resto da página ---------- */
/** O «Ver extrato» da barra: com um movimento escolhido, abre o extrato desse artigo nesse ano. */
function barraExtrato(r: HTMLElement, e: Est): void {
  const tr = e.escolhido ? r.querySelector<HTMLElement>(`tr[data-mva-n="${e.escolhido}"]`) : null, b = r.querySelector<HTMLElement>('[data-mva-acao="extrato"]'); if (!b) return;
  b.setAttribute('aria-disabled', String(!tr)); b.title = tr ? `O extrato de ${tr.dataset.mvaRef} em ${tr.dataset.mvaAno} (Enter)` : 'Escolhe primeiro um movimento.';
}
function abrirExtrato(r: HTMLElement, e: Est, tr: HTMLElement): void {
  const ref = tr.dataset.mvaRef!, ano = tr.dataset.mvaAno!;
  Object.assign(e, { tab: 'ext', extArt: ref, extAno: ano, extFeito: { art: ref, ano }, extEditar: false, ordem: null, erroCrit: '' }); tudo(r, e); toast(r, `Extrato de ${ref} em ${ano}.`);
}
const avisos = new WeakMap<HTMLElement, number>();
function toast(r: HTMLElement, t: string): void { const p = r.querySelector<HTMLElement>('[data-hm-aviso]'); if (!p) return; p.textContent = t; p.classList.add('is-visivel'); clearTimeout(avisos.get(r)); avisos.set(r, window.setTimeout(() => p.classList.remove('is-visivel'), 3200)); }
function indicador(r: HTMLElement): void {
  const ind = r.querySelector<HTMLElement>('[data-mva-ind]'), b = r.querySelector<HTMLElement>('[data-mva-tab][aria-selected="true"]'); if (!ind || !b) return;
  ind.style.width = `${b.offsetWidth}px`; ind.style.transform = `translateX(${b.offsetLeft}px)`; ind.classList.add('is-pronto');
}
function criterios(r: HTMLElement, e: Est): void {
  (['ext', 'sal'] as const).forEach((k) => {
    const feito = k === 'ext' ? e.extFeito : e.salFeito, editar = k === 'ext' ? e.extEditar : e.salEditar;
    const ab = r.querySelector<HTMLElement>(`[data-mva-aberto="${k}"]`)!, rs = r.querySelector<HTMLElement>(`[data-mva-resumo-crit="${k}"]`)!;
    ab.hidden = !editar; rs.hidden = editar;
    rs.innerHTML = `<h2>Critérios</h2><ul class="ak2-etiquetas">${(k === 'ext' ? [feito && `${(feito as { art: string }).art} · ${artigo((feito as { art: string }).art)?.desc ?? ''}`, feito && `Ano ${(feito as { ano: string }).ano}`] : [feito && `Artigos de ${(feito as { ini: string }).ini} a ${(feito as { fim: string }).fim}`]).filter(Boolean).map((t) => `<li><button type="button" data-mva-acao="alterar">${esc(String(t))}</button></li>`).join('')}</ul><button type="button" class="ak-btn ak-btn--linha" data-mva-acao="alterar">${L(pencil)}<span>Alterar critérios</span></button>`;
  });
  const v = (k: string, x: string) => { const el = r.querySelector<HTMLInputElement>(`[data-mva-c="${k}"]`); if (el && el.value !== x) el.value = x; };
  v('extArt', e.extArt); v('extAno', e.extAno); v('salIni', e.salIni); v('salFim', e.salFim);
}
function tudo(r: HTMLElement, e: Est): void {
  r.querySelectorAll<HTMLElement>('[data-mva-tab]').forEach((b) => { const s = b.dataset.mvaTab === e.tab; b.setAttribute('aria-selected', String(s)); b.tabIndex = s ? 0 : -1; });
  r.querySelectorAll<HTMLElement>('[data-mva-p]').forEach((p) => { p.hidden = p.dataset.mvaP !== e.tab; });
  r.querySelectorAll<HTMLElement>('[data-mva-so]').forEach((x) => { x.hidden = !x.dataset.mvaSo!.split(' ').includes(e.tab); });
  r.querySelectorAll<HTMLElement>('[data-mva-modo]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mvaModo === e.modo && e.comp !== 'encomenda')));
  r.querySelectorAll<HTMLElement>('[data-mva-comp]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mvaComp === e.comp)));
  const q = r.querySelector<HTMLInputElement>('[data-mva-q]')!; if (q.value !== e.q) q.value = e.q;
  q.placeholder = e.comp === 'encomenda' ? 'Encomenda a fornecedor, ex.: EF 2026/04' : MODOS.find((m) => m.k === e.modo)!.ph;
  (['armazem', 'art', 'tipo', 'de', 'ate'] as const).forEach((k) => { const el = r.querySelector<HTMLInputElement>(`[data-mva-f="${k}"]`)!; if (el.value !== e[k]) el.value = e[k]; });
  /* o Pr. médio do antigo: o do artigo escolhido */
  const pm = r.querySelector<HTMLElement>('[data-mva-pm]')!; const ult = e.art ? todosMovimentos().filter((m) => m.ref === e.art).pop() : undefined;
  pm.innerHTML = e.tab === 'mov' && e.art ? `Pr. médio de ${esc(e.art)} <b>${euros(ult?.pm ?? artigo(e.art)?.preco ?? 0)}</b>` : '';
  criterios(r, e);
  if (e.tab === 'mov') desenharMov(r, e); else if (e.tab === 'ext') desenharExt(r, e); else desenharSal(r, e);
  const err = (k: string) => { const p = r.querySelector<HTMLElement>(`[data-mva-erro="${k}"]`)!; p.hidden = !(e.erroCrit && e.tab === k); p.textContent = e.erroCrit; };
  err('ext'); err('sal');
  r.querySelector<HTMLElement>('[data-mva-estado]')!.innerHTML = `<span>Separador <b>${TABS.find((t) => t.k === e.tab)!.t}</b></span>${e.tab === 'mov' ? `<span>Visualização <b>por ${e.comp === 'encomenda' ? 'encomenda a fornecedor' : MODOS.find((m) => m.k === e.modo)!.t.toLowerCase()}</b></span>` : ''}<span class="ak-estado-f is-ok">Pronto</span>${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  const ip = r.querySelector<HTMLElement>('[data-mva-impressao]'); if (ip) ip.innerHTML = `<h1>Movimentos de artigos · ${TABS.find((t) => t.k === e.tab)!.t}</h1><p>Impresso a ${new Date().toLocaleString('pt-PT')}</p>`;
  requestAnimationFrame(() => indicador(r));
}
function gerar(r: HTMLElement, e: Est): void {
  e.erroCrit = '';
  if (e.tab === 'ext') {
    if (!e.extArt) { e.erroCrit = 'Escolhe o artigo.'; tudo(r, e); r.querySelector<HTMLElement>('[data-mva-c="extArt"]')?.focus(); return; }
    if (!/^\d{4}$/.test(e.extAno)) { e.erroCrit = 'O ano tem quatro algarismos, ex.: 2026.'; tudo(r, e); r.querySelector<HTMLElement>('[data-mva-c="extAno"]')?.focus(); return; }
    e.extFeito = { art: e.extArt, ano: e.extAno }; e.extEditar = false;
  } else if (e.tab === 'sal') {
    if (!e.salIni.trim() || !e.salFim.trim()) { e.erroCrit = 'Diz o artigo inicial e o final (0 e ZZZZZZ são todos).'; tudo(r, e); return; }
    if (e.salIni.localeCompare(e.salFim, 'pt', { numeric: true, sensitivity: 'base' }) > 0) { e.erroCrit = 'O artigo inicial vem depois do final.'; tudo(r, e); r.querySelector<HTMLElement>('[data-mva-c="salIni"]')?.focus(); return; }
    e.salFeito = { ini: e.salIni.trim(), fim: e.salFim.trim() }; e.salEditar = false;
  }
  e.ordem = null; tudo(r, e);
  const g = r.querySelector<HTMLElement>(`[data-mva-g="${e.tab}"]`); if (g && !quieto()) g.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}
function exportar(r: HTMLElement, e: Est): void {
  let ms: Mov[] = [];
  if (e.tab === 'mov') ms = filtrarMov(e);
  else if (e.tab === 'ext' && e.extFeito) ms = todosMovimentos().filter((m) => m.ref === e.extFeito!.art && m.data.startsWith(e.extFeito!.ano));
  else if (e.tab === 'sal' && e.salFeito) ms = todosMovimentos().filter((m) => dentro(m.ref, e.salFeito!.ini, e.salFeito!.fim));
  if (!ms.length) { toast(r, e.tab === 'mov' ? 'Não há movimentos para exportar.' : 'Gera os dados primeiro (F10).'); return; }
  const ts = ['Artigo', 'Descrição', 'Armazém', 'Data', 'Série', 'Documento', 'Tipo', 'Tipo de movimento', 'Preço', 'Qt. entrada', 'Qt. saída', 'Valor entradas', 'Valor saídas', 'Pr. médio', 'Qt. stock', 'Valor stock'];
  const rows: Celula[][] = ms.map((m) => [m.ref, artigo(m.ref)?.desc ?? '', curto(m.armazem), dia(m.data), m.serie, m.doc, m.cod, designacao(m), { euros: m.preco }, ent(m), sai(m), { euros: m.vEnt }, { euros: m.vSai }, { euros: m.pm }, m.saldoArt, { euros: m.valorArt }]);
  const nome = `Movimentos-de-artigos-${TABS.find((t) => t.k === e.tab)!.t.replace(/\s+/g, '-')}.xlsx`;
  try { descarregar(xlsx({ nome: 'Movimentos', colunas: ts, linhas: rows, larguras: ts.map((t) => Math.max(10, t.length + 4)) }), nome); e.aviso = `Exportado: ${nome} · ${nf(ms.length)} movimentos.`; }
  catch { e.aviso = 'A exportação falhou; tenta outra vez.'; }
  tudo(r, e); toast(r, e.aviso);
}

/* ---------- os cenários ---------- */
function armar(r: HTMLElement): void {
  if (estados.has(r)) return;
  const e = de(r), cen = r.dataset.mvaCenario ?? 'inicial';
  if (['ext', 'ext-dados', 'ext-2025', 'ext-erro', 'ext-sem'].includes(cen)) e.tab = 'ext';
  if (['sal', 'sal-dados', 'sal-artigo', 'sal-tipo', 'sal-erro', 'sal-vazio'].includes(cen)) e.tab = 'sal';
  if (cen === 'descricao') e.modo = 'descricao';
  if (cen === 'armazem') { e.modo = 'armazem'; e.armazem = '1'; }
  if (cen === 'documento') { e.modo = 'documento'; e.q = 'TA'; }
  if (cen === 'encomenda') { e.comp = 'encomenda'; e.q = 'EF 2026'; }
  if (cen === 'artigo') e.art = '6205-2Z';
  if (cen === 'tipo') e.tipo = 'QB';
  if (cen === 'sem-resultados') { e.q = 'XPTO'; }
  if (cen === 'ext-dados' || cen === 'ext-2025') { e.extArt = '6205-2Z'; e.extAno = cen === 'ext-2025' ? '2025' : '2026'; e.extFeito = { art: e.extArt, ano: e.extAno }; e.extEditar = false; }
  if (cen === 'ext-sem') { e.extArt = '0 986 424 797'; e.extFeito = { art: e.extArt, ano: '2026' }; e.extEditar = false; }
  if (cen === 'ext-erro') e.erroCrit = 'Escolhe o artigo.';
  if (['sal-dados', 'sal-artigo', 'sal-tipo'].includes(cen)) { e.salIni = '6'; e.salFim = '9'; e.salFeito = { ini: '6', fim: '9' }; e.salEditar = false; if (cen === 'sal-artigo') e.salGrupo = 'artigo'; if (cen === 'sal-tipo') e.salGrupo = 'tipo'; }
  if (cen === 'sal-erro') { e.salIni = 'Z'; e.salFim = 'A'; e.erroCrit = 'O artigo inicial vem depois do final.'; }
  if (cen === 'sal-vazio') { e.salIni = 'X1'; e.salFim = 'X9'; e.salFeito = { ini: 'X1', fim: 'X9' }; e.salEditar = false; }
  if (cen === 'exportado') e.aviso = 'Exportado: Movimentos-de-artigos-Movimentos.xlsx.';
  tudo(r, e);
  const aVista = !!r.closest('.ecra:not([hidden]) > .versao:not([hidden])');
  if (!e.editor && aVista && !quieto()) r.classList.add('lf2-entra');
}
const armarTodos = () => document.querySelectorAll<HTMLElement>('[data-mva]').forEach(armar);

let espera = 0;
export function iniciar(): void {
  requestAnimationFrame(armarTodos);
  ['romafe:versao', 'romafe:ecra'].forEach((y) => document.addEventListener(y, () => requestAnimationFrame(armarTodos)));
  window.addEventListener('resize', () => document.querySelectorAll<HTMLElement>('[data-mva]').forEach(indicador));
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const e = de(r); let b: HTMLElement | null;
    const qi = r.querySelector<HTMLInputElement>('[data-mva-q]'); if (qi) { clearTimeout(espera); e.q = qi.value; }
    if ((b = t.closest('[data-mva-tab]'))) { e.tab = b.dataset.mvaTab as Tab; e.ordem = null; e.erroCrit = ''; tudo(r, e); return; }
    if ((b = t.closest('[data-mva-modo]'))) { e.modo = b.dataset.mvaModo as Modo; if (e.comp === 'encomenda') e.comp = 'inicio'; tudo(r, e); qi?.focus(); return; }
    if ((b = t.closest('[data-mva-comp]'))) { e.comp = b.dataset.mvaComp as Comp; tudo(r, e); qi?.focus(); return; }
    if ((b = t.closest('tr[data-mva-ref]'))) { e.escolhido = b.dataset.mvaN!; barraExtrato(r, e); return; }
    if ((b = t.closest('[data-mva-ordenar]'))) { const k = b.dataset.mvaOrdenar!; e.ordem = e.ordem?.k === k ? (e.ordem.dir === 1 ? { k, dir: -1 } : null) : { k, dir: 1 }; tudo(r, e); return; }
    if ((b = t.closest('[data-mva-acao]'))) {
      const k = b.dataset.mvaAcao!;
      if (k === 'extrato') { const tr = e.escolhido ? r.querySelector<HTMLElement>(`tr[data-mva-n="${e.escolhido}"]`) : null; if (tr) abrirExtrato(r, e, tr); else toast(r, 'Escolhe primeiro um movimento.'); }
      else if (k === 'atualizar') { tudo(r, e); toast(r, 'Movimentos atualizados.'); }
      else if (k === 'imprimir' || k === 'imprimir2') window.print();
      else if (k === 'excel') exportar(r, e);
      else if (k === 'limpar') { Object.assign(e, { q: '', armazem: '', art: '', tipo: '', de: '', ate: '' }); tudo(r, e); }
      else if (k === 'gerar') gerar(r, e);
      else if (k === 'cancelar') { if (e.tab === 'ext') { e.extEditar = !e.extFeito; if (e.extFeito) { e.extArt = e.extFeito.art; e.extAno = e.extFeito.ano; } } else { e.salEditar = !e.salFeito; if (e.salFeito) { e.salIni = e.salFeito.ini; e.salFim = e.salFeito.fim; } } e.erroCrit = ''; tudo(r, e); }
      else if (k === 'alterar') { if (e.tab === 'ext') e.extEditar = true; else e.salEditar = true; tudo(r, e); r.querySelector<HTMLElement>(`[data-mva-p="${e.tab}"] [data-mva-c]`)?.focus(); }
    }
  });
  document.addEventListener('dblclick', (ev) => { const t = ev.target as HTMLElement, r = raiz(t), b = t.closest<HTMLElement>('tr[data-mva-ref]'); if (!r || !b || editando()) return; abrirExtrato(r, de(r), b); });
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r) return; const e = de(r);
    if (t.matches('[data-mva-q]')) { clearTimeout(espera); espera = window.setTimeout(() => { e.q = t.value; desenharMov(r, e); }, 120); }
    if (t.matches('[data-mva-c]')) { (e as unknown as Record<string, string>)[t.dataset.mvaC!] = t.value; }
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r || editando()) return; const e = de(r);
    if (t.matches('[data-mva-f]')) { (e as unknown as Record<string, string>)[t.dataset.mvaF!] = t.value; tudo(r, e); }
    if (t.matches('[data-mva-c]')) { (e as unknown as Record<string, string>)[t.dataset.mvaC!] = t.value; }
    if (t.matches('[data-mva-grupo]')) { e.salGrupo = t.value as Est['salGrupo']; tudo(r, e); }
  });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t) ?? visivel(); if (!r || editando()) return; const e = de(r);
    const so = !ev.ctrlKey && !ev.altKey && !ev.metaKey;
    if (t.matches('[data-mva-tab]') && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) { ev.preventDefault(); const i = TABS.findIndex((x) => x.k === e.tab), j = (i + (ev.key === 'ArrowRight' ? 1 : -1) + 3) % 3; e.tab = TABS[j].k; tudo(r, e); r.querySelector<HTMLElement>(`[data-mva-tab="${e.tab}"]`)?.focus(); return; }
    if (e.tab === 'mov' && ev.key === 'Enter' && t.matches('tr[data-mva-ref]')) { ev.preventDefault(); abrirExtrato(r, e, t); return; }
    /* as setas (comportamento/setas-tabelas.ts) mudam a linha: fica escolhida para o «Ver extrato» */
    if (e.tab === 'mov' && t.matches('tr[data-mva-ref]') && ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(ev.key)) requestAnimationFrame(() => { const a = document.activeElement as HTMLElement | null; if (a?.dataset.mvaN) { e.escolhido = a.dataset.mvaN; barraExtrato(r, e); } });
    if (e.tab === 'mov') {
      if (so && ev.shiftKey && ['F1', 'F2', 'F3', 'F6'].includes(ev.key)) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mva-comp="${{ F1: 'inicio', F2: 'contem', F3: 'igual', F6: 'encomenda' }[ev.key]}"]`)?.click(); return; }
      if (so && !ev.shiftKey && ['F1', 'F2', 'F3', 'F4', 'F5'].includes(ev.key)) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mva-modo="${MODOS[Number(ev.key.slice(1)) - 1].k}"]`)?.click(); return; }
      if (so && !ev.shiftKey && (ev.key === 'F9' || ev.key === 'F11')) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mva-acao="${ev.key === 'F9' ? 'atualizar' : 'imprimir'}"]`)?.click(); return; }
      if (ev.key === 'Escape' && e.q) { ev.preventDefault(); e.q = ''; tudo(r, e); }
      return;
    }
    if (so && !ev.shiftKey && ev.key === 'F10') { ev.preventDefault(); const p = r.querySelector<HTMLElement>(`[data-mva-p="${e.tab}"]`)!; p.querySelectorAll<HTMLInputElement>('[data-mva-c]').forEach((x) => { (e as unknown as Record<string, string>)[x.dataset.mvaC!] = x.value; }); gerar(r, e); return; }
    if (so && !ev.shiftKey && ev.key === 'F12') { ev.preventDefault(); window.print(); return; }
    if (so && !ev.shiftKey && ev.key === 'F4') { ev.preventDefault(); exportar(r, e); return; }
    if (ev.key === 'Escape') { const ed = e.tab === 'ext' ? e.extEditar : e.salEditar, feito = e.tab === 'ext' ? e.extFeito : e.salFeito; if (ed && feito) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mva-p="${e.tab}"] [data-mva-acao="cancelar"]`)?.click(); } }
    if (ev.key === 'Enter' && t.matches('[data-mva-c]')) { ev.preventDefault(); const cs = [...r.querySelectorAll<HTMLElement>(`[data-mva-p="${e.tab}"] [data-mva-c]`)], i = cs.indexOf(t); (i < cs.length - 1 ? cs[i + 1] : r.querySelector<HTMLElement>(`[data-mva-p="${e.tab}"] [data-mva-acao="gerar"]`))?.focus(); }
  });
}

/* ---------- os ecrãs ---------- */
const NOTA = 'Movimentos de artigos (18 nov., dos três ecrãs do ERP antigo num só, por separadores): Movimentos (a «Ficha de custeio», com a visualização por artigo, descrição, armazém, data ou documento, F1–F5, e a pesquisa Iniciado por / Contendo / Igual a / Encomenda fornecedor, Shift+F1/F2/F3/F6), Extrato por artigo (critérios artigo e ano, F10, o stock e o preço médio a cada passo) e Saldo (artigo inicial e final, F10, com Agrupar). Os movimentos são os mesmos que mexem no stock nos outros ecrãs; o saldo final é o stock de hoje.';
const ESTADOS: [string, string, string][] = [
  ['artigo', 'Um artigo', 'O filtro Artigo: só os movimentos do 6205-2Z, e o preço médio dele na barra.'],
  ['descricao', 'Por descrição (F2)', 'A lista pela descrição do artigo.'],
  ['armazem', 'Por armazém (F3)', 'Só o Armazém 1 · Porto.'],
  ['documento', 'Por documento (F5)', 'Os documentos que começam por «TA»: as transferências.'],
  ['encomenda', 'Encomenda a fornecedor (Shift+F6)', 'Procura as receções de uma encomenda a fornecedor; no protótipo ainda não há receções lançadas, e diz-se.'],
  ['tipo', 'Um tipo de movimento', 'Só as perdas (QB).'],
  ['sem-resultados', 'Sem movimentos', 'Diz o que se procurou; Limpar filtros.'],
  ['ext', 'Extrato: critérios', 'O separador Extrato por artigo, à espera do artigo e do ano.'],
  ['ext-erro', 'Extrato: falta o artigo', 'F10 sem artigo: o campo marcado.'],
  ['ext-dados', 'Extrato de um artigo', 'O 6205-2Z em 2026: o saldo do ano anterior, cada movimento com o preço médio e o stock, o total do ano.'],
  ['ext-2025', 'Extrato de outro ano', 'O mesmo artigo em 2025.'],
  ['ext-sem', 'Extrato sem movimentos', 'Um artigo novo na tabela: diz que não houve movimentos.'],
  ['sal', 'Saldo: critérios', 'O separador Saldo, com 0 e ZZZZZZ (todos).'],
  ['sal-erro', 'Saldo: intervalo trocado', 'O artigo inicial depois do final.'],
  ['sal-dados', 'Saldo de um intervalo', 'Os artigos de 6 a 9: cada movimento com o saldo, o preço médio e o tipo de documento.'],
  ['sal-artigo', 'Saldo agrupado por artigo', 'Uma faixa por artigo, com o saldo final.'],
  ['sal-tipo', 'Saldo agrupado por tipo', 'Uma faixa por tipo de documento.'],
  ['sal-vazio', 'Saldo sem artigos', 'Um intervalo sem artigos.'],
  ['exportado', 'Exportado para Excel', 'Os movimentos com o preço médio e o stock a cada passo.'],
];
export type IdMapaMov = 'stocks-mapa-movimentos' | `mva-${string}`;
export function ecrasMapaMovimentos(): Ecra<IdErp>[] {
  const v = (cen: string) => ({ id: 'v1', nota: NOTA, html: html(cen) });
  return [
    { id: 'stocks-mapa-movimentos', nome: '77 · Movimentos de artigos', fluxo: 'Stocks', objetivo: 'Os movimentos, o extrato por artigo e o saldo, num só ecrã com três separadores.', versoes: [v('inicial')] as Ecra<IdErp>['versoes'] },
    ...ESTADOS.map(([cen, nome, objetivo], i) => ({ id: `mva-${cen}` as IdErp, nome: `77.${i + 1} · ${nome}`, fluxo: 'Stocks', estadoDe: 'stocks-mapa-movimentos' as IdErp, objetivo, versoes: [v(cen)] as Ecra<IdErp>['versoes'] })),
  ] as Ecra<IdErp>[];
}
