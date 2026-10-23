/* =========================================================
   ERP — Compras ▸ Mapas ▸ Artigos / Compras Automático (23 out. 2026), do briefing dela («Modern Enterprise Analysis
   Workspace with Full Keyboard Support») e do ecrã do ERP antigo (a grelha com «Arraste para aqui o cabeçalho de uma
   coluna…» e os critérios).
   Um ecrã de trabalho, de cima para baixo: título e uma linha · a barra (Filtrar F2, Limpar filtros F3, Excel F4,
   Gerar dados F10, Imprimir F12) · os critérios (Armazém, Fornecedor, Família, Subfamília, Período,
   Artigo/Referência, Tipo de análise; mais: Marca e Stock) · a zona de agrupar · a grelha (cabeçalho preso, ordenar,
   filtrar por coluna, mostrar/esconder, reordenar e alargar colunas, agrupar em vários níveis, escolher várias
   linhas) · o detalhe do artigo à direita · a barra de estado.
   Dados: os artigos, o stock, as encomendas e as receções do protótipo (compras/dominio.ts). O mínimo e a sugestão vêm
   da Lista de faltas (de exemplo, só para os artigos que lá estão); a família sai da descrição. Nada se inventa: o que
   não existe fica «—». Gerar corre aqui mesmo (o protótipo não tem servidor); a carga dura o que o cálculo durar.
   Comportamento: compras/automatico-comportamento.ts. CSS: css/automatico.css. Excel: compras/xlsx.ts.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { topoErp } from '../inicio-v2';
import { ARTIGOS, FORNECEDORES, encomendas, stock, linhaLiquida, pendente, HOJE } from './dominio';
import { faltas } from './faltas';
import { familiaDe } from '../ficheiros/ecras';
import { L, esc } from '../espaco';
import funnel from 'lucide-static/icons/funnel.svg?raw';
import funnelX from 'lucide-static/icons/funnel-x.svg?raw';
import sheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';
import chartBar from 'lucide-static/icons/chart-bar.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import ellipsis from 'lucide-static/icons/ellipsis.svg?raw';
import bookmark from 'lucide-static/icons/bookmark.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import chevronsUp from 'lucide-static/icons/chevrons-up.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';

/* ---------- os critérios e as linhas ---------- */
export type Tipo = 'todos' | 'com' | 'sem' | 'rutura' | 'minimo';
export interface Crit { armazem: string; forn: string; fam: string; sub: string; de: string; ate: string; ref: string; tipo: Tipo; marca: string; stock: 'todos' | 'com' | 'sem' }
export const CRIT0 = (): Crit => ({ armazem: '60', forn: '', fam: '', sub: '', de: '2026-09-01', ate: HOJE, ref: '', tipo: 'todos', marca: '', stock: 'todos' });
export interface Compra { enc: string; data: string; qtd: number; preco: number | null; estado: string; recebida: number; valor: number }
export interface LinhaAk {
  ref: string; desc: string; refForn: string; marca: string; fam: string; sub: string; forn: string; un: string;
  stock: number; min: number | null; curso: number; sug: number | null; qtd: number; valor: number; encs: number; ult: string; preco: number | null; hist: Compra[];
}
export type TipoCol = 'txt' | 'mono' | 'n' | 'eur' | 'data';
export interface ColAk { k: keyof LinhaAk; t: string; tipo: TipoCol; w: number; soma?: boolean }
/** As colunas da grelha (a ordem de partida); soma = somam-se nos grupos. */
export const COLS: ColAk[] = [
  { k: 'ref', t: 'Artigo', tipo: 'mono', w: 130 }, { k: 'desc', t: 'Descrição', tipo: 'txt', w: 220 }, { k: 'refForn', t: 'Ref. fornecedor', tipo: 'mono', w: 130 },
  { k: 'marca', t: 'Marca', tipo: 'txt', w: 90 }, { k: 'fam', t: 'Família', tipo: 'txt', w: 130 }, { k: 'sub', t: 'Subfamília', tipo: 'txt', w: 190 },
  { k: 'forn', t: 'Fornecedor', tipo: 'txt', w: 140 }, { k: 'un', t: 'Un.', tipo: 'txt', w: 60 },
  { k: 'stock', t: 'Stock', tipo: 'n', w: 80, soma: true }, { k: 'min', t: 'Mínimo', tipo: 'n', w: 80 }, { k: 'curso', t: 'Em curso', tipo: 'n', w: 90, soma: true },
  { k: 'sug', t: 'Sugestão', tipo: 'n', w: 90, soma: true }, { k: 'qtd', t: 'Qtd. comprada', tipo: 'n', w: 120, soma: true }, { k: 'valor', t: 'Valor comprado', tipo: 'eur', w: 130, soma: true },
  { k: 'encs', t: 'Encomendas', tipo: 'n', w: 100, soma: true }, { k: 'ult', t: 'Última compra', tipo: 'data', w: 115 }, { k: 'preco', t: 'Último preço', tipo: 'eur', w: 110 },
];
const fNome = (id: string) => FORNECEDORES.find((f) => f.id === id)?.nome ?? id;
/** Gera a análise para os critérios (o «pedido ao servidor»): uma linha por artigo, com as compras do período. */
export function gerar(c: Crit): LinhaAk[] {
  const fs = new Map(faltas().map((f) => [f.ref, f]));
  const encs = encomendas().filter((e) => e.estado !== 'Rascunho' && e.estado !== 'Cancelada' && (!c.armazem || e.armazem.includes(c.armazem)));
  return ARTIGOS.map((a): LinhaAk => {
    const hist: Compra[] = encs.filter((e) => e.data >= c.de && e.data <= c.ate).flatMap((e) => e.linhas.filter((l) => l.ref === a.ref).map((l) => ({ enc: e.ref, data: e.data, qtd: l.qtd, preco: l.preco, estado: e.estado, recebida: l.recebida, valor: linhaLiquida(l) ?? 0 })))
      .sort((x, y) => y.data.localeCompare(x.data));
    const curso = encs.filter((e) => ['Aprovada', 'Emitida', 'Parcialmente recebida'].includes(e.estado)).flatMap((e) => e.linhas).filter((l) => l.ref === a.ref).reduce((s, l) => s + pendente(l), 0);
    const f = fs.get(a.ref);
    return { ref: a.ref, desc: a.desc, refForn: a.refForn, marca: a.marca, fam: familiaDe(a.desc), sub: a.desc, forn: fNome(a.forn), un: a.un, stock: stock(a.ref), min: f?.min ?? null, curso, sug: f?.sugestao ?? null,
      qtd: hist.reduce((s, h) => s + h.qtd, 0), valor: hist.reduce((s, h) => s + h.valor, 0), encs: new Set(hist.map((h) => h.enc)).size, ult: hist[0]?.data ?? '', preco: hist[0]?.preco ?? a.preco, hist };
  }).filter((l) => (!c.forn || l.forn === c.forn) && (!c.fam || l.fam === c.fam) && (!c.sub || l.sub === c.sub) && (!c.marca || l.marca === c.marca)
    && (!c.ref || `${l.ref} ${l.refForn} ${l.desc}`.toLowerCase().includes(c.ref.trim().toLowerCase()))
    && (c.tipo === 'todos' || (c.tipo === 'com' && l.encs > 0) || (c.tipo === 'sem' && l.encs === 0) || (c.tipo === 'rutura' && l.stock <= 0) || (c.tipo === 'minimo' && l.min !== null && l.stock < l.min))
    && (c.stock === 'todos' || (c.stock === 'com' && l.stock > 0) || (c.stock === 'sem' && l.stock <= 0)));
}

/* ---------- a página ---------- */
export type CenarioAk = 'inicial' | 'resultados' | 'agrupado' | 'a-gerar' | 'vazio' | 'erro' | 'filtros' | 'detalhe' | 'exportado'
  /* só na v2 */
  | 'mais-criterios' | 'invalido' | 'a-atualizar' | 'vistas' | 'export-falhou' | 'offline' | 'tempo' | 'permissao' | 'sessao';
const op = (v: string, t: string, sel = false) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(t)}</option>`;
const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'pt'));
const B = (k: string, ic: string, t: string, tecla: string, extra = '', cls = '') => `<button type="button" class="ak-btn${cls ? ` ${cls}` : ''}" data-ak-acao="${k}"${extra}>${L(ic)}<span>${t}</span>${tecla ? `<kbd>${tecla}</kbd>` : ''}</button>`;
function html(cen: CenarioAk): string {
  const c = CRIT0(), id = (x: string) => `ak-${x}-${cen}`;
  const campo = (k: string, t: string, input: string, cls = '') => `<label class="ak-campo${cls ? ` ${cls}` : ''}" for="${id(k)}"><span>${t}</span>${input}</label>`;
  const forns = uniq(ARTIGOS.map((a) => fNome(a.forn))), fams = uniq(ARTIGOS.map((a) => familiaDe(a.desc))), marcas = uniq(ARTIGOS.map((a) => a.marca));
  return `<div class="hm ak" data-hm data-ak data-ak-cenario="${cen}" data-teclas="F2 F3 F4 F10 F12">
  ${topoErp([['ERP', 'inicio'], ['Compras', 'compras'], ['Mapas', ''], ['Artigos / Compras Automático', '']])}
  <header class="ak-cab">
    <span class="ak-cab-ic">${L(chartBar)}</span>
    <div><h1>Artigos / Compras Automático</h1><p>Consulta e analisa os artigos e respetiva informação de compras.</p></div>
  </header>
  <div class="ak-barra" role="toolbar" aria-label="Ações da análise">
    ${B('filtrar', funnel, 'Filtrar tabela', 'F2', ' aria-pressed="false"')}
    ${B('limpar', funnelX, 'Remover filtros', 'F3')}
    <i class="ak-sep" aria-hidden="true"></i>
    <span class="ak-menu-c">${B('exportar', sheet, 'Exportar para Excel', 'F4', ' aria-haspopup="menu" aria-expanded="false"')}
      <div class="ak-menu" role="menu" data-ak-menu="exportar" hidden>
        <button type="button" role="menuitem" data-ak-exportar="todos">Todos os resultados <small data-ak-n-todos></small></button>
        <button type="button" role="menuitem" data-ak-exportar="escolhidos">Só as linhas escolhidas <small data-ak-n-sel></small></button>
        <p>Exporta as linhas que passam nos filtros da tabela, com todos os grupos abertos, e só as colunas à vista.</p>
      </div></span>
    <i class="ak-sep" aria-hidden="true"></i>
    ${B('imprimir', printer, 'Imprimir', 'F12')}
  </div>

  <form class="ak-crit" data-ak-crit aria-labelledby="${id('crit-t')}" novalidate>
    <div class="ak-crit-cab"><h2 id="${id('crit-t')}">Critérios</h2><button type="button" class="ak-crit-x" data-ak-acao="criterios" aria-expanded="true" aria-controls="${id('crit-c')}" title="Esconder os critérios">${L(xIc)}<span>Esconder</span></button></div>
    <div class="ak-crit-c" id="${id('crit-c')}">
      <div class="ak-crit-g">
        ${campo('armazem', 'Armazém', `<select id="${id('armazem')}" name="armazem" data-ak-primeiro>${op('60', 'Armazém 60', true)}${op('', 'Todos')}</select>`)}
        ${campo('forn', 'Fornecedor', `<select id="${id('forn')}" name="forn">${op('', 'Todos')}${forns.map((f) => op(f, f)).join('')}</select>`)}
        ${campo('fam', 'Família', `<select id="${id('fam')}" name="fam">${op('', 'Todas')}${fams.map((f) => op(f, f)).join('')}</select>`)}
        ${campo('sub', 'Subfamília', `<select id="${id('sub')}" name="sub" data-ak-sub>${op('', 'Todas')}</select>`)}
        ${campo('de', 'Período — de', `<input type="date" id="${id('de')}" name="de" value="${c.de}">`)}
        ${campo('ate', 'Período — até', `<input type="date" id="${id('ate')}" name="ate" value="${c.ate}">`)}
        ${campo('ref', 'Artigo / Referência', `<input type="search" id="${id('ref')}" name="ref" list="${id('refs')}" placeholder="Referência ou descrição" autocomplete="off"><datalist id="${id('refs')}">${ARTIGOS.map((a) => `<option value="${esc(a.ref)}">${esc(a.desc)}</option>`).join('')}</datalist>`)}
        ${campo('tipo', 'Tipo de análise', `<select id="${id('tipo')}" name="tipo">${op('todos', 'Todos os artigos', true)}${op('com', 'Com compras no período')}${op('sem', 'Sem compras no período')}${op('rutura', 'Em rutura')}${op('minimo', 'Abaixo do mínimo')}</select>`)}
        ${campo('marca', 'Marca', `<select id="${id('marca')}" name="marca">${op('', 'Todas')}${marcas.map((m) => op(m, m)).join('')}</select>`)}
        ${campo('stock', 'Stock', `<select id="${id('stock')}" name="stock">${op('todos', 'Todos', true)}${op('com', 'Com stock')}${op('sem', 'Sem stock')}</select>`)}
      </div>
      <div class="ak-crit-acoes">
        ${B('gerar', play, 'Gerar dados', 'F10', ' data-ak-gerar-crit', 'ak-btn--acao')}
        ${B('cancelar', xIc, 'Cancelar', 'Esc', '', 'ak-btn--linha')}
      </div>
    </div>
    <p class="ak-erro-campo" data-ak-erro-campo role="alert" hidden></p>
    <p class="ak-crit-dica">Enter passa ao campo seguinte; no último, vai a Gerar dados. Cancelar repõe os critérios da última análise.</p>
  </form>

  <section class="ak-res" aria-labelledby="${id('res-t')}">
    <h2 id="${id('res-t')}" class="ak-res-t">Resultados</h2>
    <div class="ak-grupos" data-ak-grupos aria-label="Agrupar por">${L(layers)}<span class="ak-grupos-dica">Arraste para aqui o cabeçalho de uma coluna para agrupar</span></div>
    <div class="ak-corpo">
      <div class="ak-grelha" data-ak-grelha tabindex="-1"></div>
      <aside class="ak-det" data-ak-det aria-label="Detalhe do artigo" hidden></aside>
    </div>
  </section>
  <footer class="ak-estado" data-ak-estado role="status" aria-live="polite"></footer>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

/* ---------- v2 (23 out., briefing «Artigos / Compras Automático V2»): os mesmos dados e o mesmo motor
   (automatico-comportamento.ts), com os critérios em dois estados (abertos / resumo em etiquetas), «Mais critérios»,
   o resumo dos resultados, as Vistas guardadas, Atualizar (F9) e Mais ações (colunas e linhas, que saíram da barra). */
function html2(cen: CenarioAk): string {
  const c = CRIT0(), id = (x: string) => `ak2-${x}-${cen}`;
  const campo = (k: string, t: string, input: string, cls = '') => `<label class="ak-campo${cls ? ` ${cls}` : ''}" for="${id(k)}"><span>${t}</span>${input}</label>`;
  const forns = uniq(ARTIGOS.map((a) => fNome(a.forn))), fams = uniq(ARTIGOS.map((a) => familiaDe(a.desc))), marcas = uniq(ARTIGOS.map((a) => a.marca));
  return `<div class="hm ak ak2" data-hm data-ak data-ak-v="2" data-ak-cenario="${cen}" data-teclas="F2 F3 F4 F9 F10 F12">
  ${topoErp([['ERP', 'inicio'], ['Compras', 'compras'], ['Mapas', ''], ['Artigos / Compras Automático', '']])}
  <header class="ak-cab">
    <span class="ak-cab-ic">${L(chartBar)}</span>
    <div><h1>Artigos / Compras Automático</h1><p>Consulta e analisa os artigos e respetiva informação de compras.</p></div>
    <span class="ak2-vista-ativa" data-ak-vista-ativa hidden></span>
  </header>
  <div class="ak-barra ak2-barra" role="toolbar" aria-label="Ações dos resultados">
    ${B('filtrar', funnel, 'Filtrar', 'F2', ' aria-pressed="false"')}
    ${B('limpar', funnelX, 'Remover filtros', 'F3')}
    <i class="ak-sep" aria-hidden="true"></i>
    <span class="ak-menu-c">${B('exportar', sheet, 'Exportar Excel', 'F4', ' aria-haspopup="menu" aria-expanded="false"')}
      <div class="ak-menu" role="menu" data-ak-menu="exportar" hidden>
        <button type="button" role="menuitem" data-ak-exportar="todos">Todos os resultados <small data-ak-n-todos></small></button>
        <button type="button" role="menuitem" data-ak-exportar="escolhidos">Só as linhas escolhidas <small data-ak-n-sel></small></button>
        <p>Exporta as linhas que passam nos filtros da tabela, com todos os grupos abertos, e só as colunas à vista.</p>
      </div></span>
    ${B('imprimir', printer, 'Imprimir', 'F12')}
    <i class="ak-sep" aria-hidden="true"></i>
    <span class="ak-menu-c">${B('vistas', bookmark, 'Vistas guardadas', '', ' aria-haspopup="menu" aria-expanded="false"')}
      <div class="ak-menu ak2-vistas" role="menu" data-ak-menu="vistas" hidden></div></span>
    <span class="ak2-esp"></span>
    ${B('atualizar', refresh, 'Atualizar', 'F9')}
    <span class="ak-menu-c">${B('mais', ellipsis, 'Mais ações', '', ' aria-haspopup="menu" aria-expanded="false"')}
      <div class="ak-menu ak-menu--dir ak2-mais-menu" role="menu" data-ak-menu="mais" hidden>
        <p class="ak-menu-t">Linhas</p>
        <div class="ak2-dens" role="group" aria-label="Linhas"><button type="button" role="menuitemradio" data-ak-densidade="compacta" aria-checked="true">Compactas</button><button type="button" role="menuitemradio" data-ak-densidade="normal" aria-checked="false">Normais</button></div>
        <div data-ak-cols></div>
      </div></span>
  </div>

  <form class="ak-crit ak2-crit" data-ak-crit aria-labelledby="${id('crit-t')}" novalidate>
    <div class="ak2-resumo-crit" data-ak-resumo-crit>
      <h2>Critérios</h2><ul class="ak2-etiquetas" data-ak-etiquetas></ul>
      <button type="button" class="ak-btn ak-btn--linha" data-ak-acao="alterar">${L(pencil)}<span>Alterar critérios</span></button>
    </div>
    <div class="ak2-aberto" data-ak-aberto>
      <div class="ak-crit-cab"><h2 id="${id('crit-t')}">Critérios</h2><button type="button" class="ak-crit-x" data-ak-acao="recolher" title="Recolher os critérios num resumo" hidden>${L(chevronsUp)}<span>Recolher</span></button></div>
      <div class="ak-crit-c">
        <div class="ak2-campos">
          <div class="ak-crit-g ak2-essenciais">
            ${campo('armazem', 'Armazém', `<select id="${id('armazem')}" name="armazem" data-ak-primeiro>${op('60', 'Armazém 60', true)}${op('', 'Todos')}</select>`)}
            ${campo('forn', 'Fornecedor', `<select id="${id('forn')}" name="forn">${op('', 'Todos')}${forns.map((f) => op(f, f)).join('')}</select>`)}
            <div class="ak-campo ak2-periodo" role="group" aria-labelledby="${id('per')}"><span id="${id('per')}">Período</span><span class="ak2-per"><input type="date" id="${id('de')}" name="de" value="${c.de}" aria-label="Período — de"><i>a</i><input type="date" id="${id('ate')}" name="ate" value="${c.ate}" aria-label="Período — até"></span></div>
            ${campo('ref', 'Artigo / Referência', `<input type="search" id="${id('ref')}" name="ref" list="${id('refs')}" placeholder="Referência ou descrição" autocomplete="off"><datalist id="${id('refs')}">${ARTIGOS.map((a) => `<option value="${esc(a.ref)}">${esc(a.desc)}</option>`).join('')}</datalist>`)}
          </div>
          <details class="ak2-mais" data-ak-mais${cen === 'mais-criterios' ? ' open' : ''}>
            <summary>${L(chevronDown)}<span>Mais critérios</span><small data-ak-n-mais></small></summary>
            <div class="ak-crit-g ak2-secundarios">
              ${campo('fam', 'Família', `<select id="${id('fam')}" name="fam">${op('', 'Todas')}${fams.map((f) => op(f, f)).join('')}</select>`)}
              ${campo('sub', 'Subfamília', `<select id="${id('sub')}" name="sub" data-ak-sub>${op('', 'Todas')}</select>`)}
              ${campo('marca', 'Marca', `<select id="${id('marca')}" name="marca">${op('', 'Todas')}${marcas.map((m) => op(m, m)).join('')}</select>`)}
              ${campo('stock', 'Stock', `<select id="${id('stock')}" name="stock">${op('todos', 'Todos', true)}${op('com', 'Com stock')}${op('sem', 'Sem stock')}</select>`)}
              ${campo('tipo', 'Tipo de análise', `<select id="${id('tipo')}" name="tipo">${op('todos', 'Todos os artigos', true)}${op('com', 'Com compras no período')}${op('sem', 'Sem compras no período')}${op('rutura', 'Em rutura')}${op('minimo', 'Abaixo do mínimo')}</select>`)}
            </div>
          </details>
        </div>
        <div class="ak-crit-acoes">
          ${B('gerar', play, 'Gerar dados', 'F10', ' data-ak-gerar-crit', 'ak-btn--acao')}
          ${B('cancelar', xIc, 'Cancelar', 'Esc', '', 'ak-btn--linha')}
        </div>
      </div>
      <p class="ak-erro-campo" data-ak-erro-campo role="alert" hidden></p>
    </div>
  </form>

  <section class="ak-res" aria-labelledby="${id('res-t')}">
    <h2 id="${id('res-t')}" class="sr">Resultados</h2>
    <div class="ak2-sumario" data-ak-sumario role="status" aria-live="polite" hidden></div>
    <div class="ak-grupos" data-ak-grupos aria-label="Agrupar por">${L(layers)}<span class="ak-grupos-dica">Arraste para aqui o cabeçalho de uma coluna para agrupar</span></div>
    <div class="ak-corpo">
      <div class="ak-grelha" data-ak-grelha tabindex="-1"></div>
      <aside class="ak-det" data-ak-det aria-label="Detalhe do artigo" hidden></aside>
    </div>
  </section>
  <div class="ak-menu ak2-ctx" role="menu" data-ak-ctx hidden></div>
  <footer class="ak-estado" data-ak-estado role="status" aria-live="polite"></footer>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

const NOTA = 'Artigos / Compras Automático (23 out., briefing «Modern Enterprise Analysis Workspace with Full Keyboard Support» e o ecrã do ERP antigo): critérios compactos, Gerar dados (F10), grelha com ordenar, filtrar (F2/F3), colunas, agrupar a arrastar, detalhe do artigo e Excel (F4).';
const ESTADOS: [Exclude<CenarioAk, 'inicial'>, string, string][] = [
  ['resultados', '67.1 · Resultados', 'Os artigos do armazém 60 com as compras do período; o primeiro escolhido.'],
  ['agrupado', '67.2 · Agrupado por fornecedor', 'O cabeçalho «Fornecedor» arrastado para a zona de agrupar: um grupo por fornecedor, com as somas.'],
  ['detalhe', '67.3 · Detalhe do artigo', 'O artigo escolhido à direita: os dados, o stock e o histórico de compras com as encomendas (abrem num separador).'],
  ['a-gerar', '67.4 · A gerar', 'Gerar dados a correr: a grelha fica, os botões esperam; sem percentagens inventadas.'],
  ['vazio', '67.5 · Sem resultados', 'Os critérios não deixam nenhum artigo: «Alterar critérios» volta ao primeiro campo.'],
  ['filtros', '67.6 · Filtros da tabela sem resultados', 'Os filtros da tabela (F2) não deixam nenhuma linha; F3 tira-os sem tocar nos critérios.'],
  ['erro', '67.7 · Erro', 'Não foi possível gerar a análise: «Tentar outra vez»; os resultados anteriores ficam.'],
  ['exportado', '67.9 · Exportado', 'O Excel foi gerado: o nome do ficheiro e o que levou, na barra de estado.'],
];
const NOTA2 = 'Artigos / Compras Automático v2 (23 out., briefing «Advanced Motion, Intelligent Filters & Professional Data Workspace»): os critérios essenciais à vista e «Mais critérios»; depois de gerar, recolhem-se num resumo em etiquetas e a grelha ganha a altura; resumo dos resultados; Vistas guardadas; Atualizar (F9); colunas e linhas em Mais ações.';
/** Os estados que só existem na v2. */
const ESTADOS2: [CenarioAk, string, string][] = [
  ['mais-criterios', '67.10 · Mais critérios', 'Família, Subfamília, Marca, Stock e Tipo de análise abertos; fechados, contam-se os que estão escolhidos.'],
  ['invalido', '67.11 · Critérios inválidos', 'O fim do período antes do início: o campo marcado e a mensagem; os critérios não se recolhem.'],
  ['a-atualizar', '67.12 · A atualizar (F9)', 'Atualizar volta a pedir a mesma análise: as linhas ficam à vista, esbatidas, até chegar a resposta.'],
  ['vistas', '67.13 · Vistas guardadas', 'Guardar, carregar, atualizar e eliminar vistas (critérios, colunas, larguras, ordem, grupos e linhas), por utilizador e empresa.'],
  ['export-falhou', '67.14 · A exportação falhou', 'O Excel não foi gerado: diz-se, e os resultados ficam.'],
  ['offline', '67.15 · Sem ligação', 'Sem rede: os critérios ficam; tenta-se outra vez quando a ligação voltar.'],
  ['tempo', '67.16 · Tempo esgotado', 'O servidor demorou demasiado: reduzir o período ou tentar outra vez.'],
  ['permissao', '67.17 · Sem permissão', 'O utilizador não tem acesso a este mapa: quem pode dar acesso; os critérios ficam.'],
  ['sessao', '67.18 · Sessão terminada', 'A sessão terminou: voltar a entrar pelo login comum; nada se perde.'],
];
export function ecrasAutomatico(num: string): Ecra<IdErp>[] {
  const v = (cen: CenarioAk) => [{ id: 'v1', nota: NOTA, html: html(cen) }, { id: 'v2', nota: NOTA2, html: html2(cen) }] as Ecra<IdErp>['versoes'];
  const so2 = (cen: CenarioAk) => [{ id: 'v2', nota: NOTA2, html: html2(cen) }] as Ecra<IdErp>['versoes'];
  return [
    { id: 'cm-mapas-automatico' as IdErp, nome: `${num} · Artigos / Compras Automático`, fluxo: 'Compras', objetivo: 'Compras ▸ Mapas ▸ Artigos/Compras Automático: definir os critérios, gerar a análise (F10) e trabalhar a grelha — ordenar, filtrar (F2/F3), agrupar a arrastar, ver o artigo e exportar para Excel (F4).', versoes: v('inicial') },
    ...ESTADOS.map(([cen, nome, objetivo]) => ({ id: `cm-automatico-${cen}` as IdErp, nome, fluxo: 'Compras', estadoDe: 'cm-mapas-automatico' as IdErp, objetivo, versoes: v(cen) })),
    ...ESTADOS2.map(([cen, nome, objetivo]) => ({ id: `cm-automatico-${cen}` as IdErp, nome, fluxo: 'Compras', estadoDe: 'cm-mapas-automatico' as IdErp, objetivo, versoes: so2(cen) })),
  ];
}
export type IdAutomatico = `cm-automatico-${Exclude<CenarioAk, 'inicial'>}`;
