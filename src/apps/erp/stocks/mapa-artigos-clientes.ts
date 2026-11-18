/* =========================================================
   ERP — Stocks ▸ Mapas ▸ 75 · Artigos/clientes (18 nov. 2026). Ela mostrou o «MAPAS» do ERP antigo: Visualização
   p/ Artigo (Ctrl+F1) e p/ Cliente (Ctrl+F2), Pesquisa Iniciado por (Shift+F1), Contendo (Shift+F2) e Exactamente
   igual a (Shift+F3), os campos #Cliente e #Artigo e a grelha das linhas de venda (Nr. Doc., Dt. Doc., Tipo Doc.,
   Nr. Req. Cli., #Cliente, #Artigo, #Uni, Qt., Pr. Unit., Desc 1, Desc 2, #STx, Pr. Unit. Liq., Valor); F9 Refrescar,
   F11 Imprimir, Esc. No novo, com o desenho dos outros ecrãs de Stocks:
     - «Por artigo»: quem comprou o artigo, uma faixa por cliente com o que levou; «Por cliente»: o que o cliente comprou,
       uma faixa por artigo. O outro campo (#Cliente ou #Artigo) filtra;
     - a pesquisa procura artigos (referência ou descrição) ou clientes (número ou nome) com as três formas do antigo e
       mostra as hipóteses por baixo; Enter escolhe;
     - em cada faixa, «Ver o que comprou» (ou «Ver quem comprou») troca de visualização nesse cliente ou artigo, e um
       «Voltar» repõe o que se via;
     - Somatórios por cima (quantidade, valor líquido, preço médio, documentos), a tabela cabe na largura (sem barra de
       lado), Excel e Imprimir (F11). As notas de crédito entram a subtrair.
   Dados: stocks/vendas.ts. CSS: css/mapa-artigos-clientes.css, com css/faltas-v2.css e css/docs-v2.css.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { topoErp } from '../inicio-v2';
import { L, esc } from '../espaco';
import { BTN } from '../compras/docs-v2';
import { ARTIGOS, artigo, euros, dia, HOJE } from '../compras/dominio';
import { xlsx, descarregar, type Celula } from '../compras/xlsx';
import { CLIENTES, cliente, vendas, NOME_VENDA, type LinhaVenda, type TipoVenda } from './vendas';
import usersIc from 'lucide-static/icons/users.svg?raw';
import packageIc from 'lucide-static/icons/package.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import sheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import arrowUp from 'lucide-static/icons/arrow-up.svg?raw';
import arrowDown from 'lucide-static/icons/arrow-down.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import arrowRightLeft from 'lucide-static/icons/arrow-right-left.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import loader from 'lucide-static/icons/loader.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import calendarRange from 'lucide-static/icons/calendar-range.svg?raw';

/* ---------- o estado ---------- */
type Modo = 'artigo' | 'cliente';
type Comp = 'inicio' | 'contem' | 'igual';
type ColK = 'doc' | 'data' | 'tipo' | 'req' | 'outro' | 'un' | 'qtd' | 'preco' | 'd1' | 'd2' | 'stx' | 'liq' | 'valor';
interface Volta { modo: Modo; art: string; cli: string }
interface Est {
  modo: Modo; comp: Comp; q: string; art: string; cli: string; de: string; ate: string; tipo: '' | TipoVenda;
  ordem: { k: ColK; dir: 1 | -1 } | null; fase: 'ok' | 'carregar' | 'erro'; erro?: 'servidor' | 'offline' | 'sessao' | 'permissao';
  sugAberta: boolean; sugI: number; volta?: Volta; aviso: string; hora: number; editor: boolean; fechadas: Set<string>;
}
const DE0 = '2026-01-01';
const novo = (): Est => ({ modo: 'artigo', comp: 'inicio', q: '', art: '', cli: '', de: DE0, ate: HOJE, tipo: '', ordem: null, fase: 'ok', sugAberta: false, sugI: 0, aviso: '', hora: 0, editor: document.body.classList.contains('editando'), fechadas: new Set() });
const estados = new WeakMap<HTMLElement, Est>();
const de = (r: HTMLElement) => { let e = estados.get(r); if (!e) { e = novo(); estados.set(r, e); } return e; };
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
const raiz = (t: Element | null) => t?.closest<HTMLElement>('[data-mac]') ?? null;
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-mac]');
const nf = (n: number) => n.toLocaleString('pt-PT');
/* «6 jogos», «1 jogo»; «un.» fica */
const unid = (n: number, un: string) => un === 'jogo' && Math.abs(n) !== 1 ? 'jogos' : un;
const dec = (c: number) => (c / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const CHAVE = 'erp:stocks:mapa-ac';

/* ---------- a pesquisa: artigos ou clientes, com as três formas do antigo ---------- */
interface Hip { k: string; cod: string; nome: string; extra: string }
const sem = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
function compara(comp: Comp, valor: string, q: string): boolean { const v = sem(valor), x = sem(q); return comp === 'igual' ? v === x : comp === 'contem' ? v.includes(x) : v.startsWith(x); }
function hipoteses(modo: Modo, comp: Comp, q: string): Hip[] {
  if (!q.trim()) return [];
  if (modo === 'artigo') return ARTIGOS.filter((a) => compara(comp, a.ref, q) || compara(comp, a.desc, q)).map((a) => ({ k: a.ref, cod: a.ref, nome: a.desc, extra: a.marca }));
  return CLIENTES.filter((c) => compara(comp, c.num, q) || compara(comp, c.nome, q)).map((c) => ({ k: c.num, cod: c.num, nome: c.nome, extra: c.cidade }));
}
const NOME_COMP: Record<Comp, string> = { inicio: 'começa por', contem: 'contém', igual: 'é exatamente' };

/* ---------- as linhas e as colunas ---------- */
function linhas(e: Est): LinhaVenda[] {
  if (e.modo === 'artigo' ? !e.art : !e.cli) return [];
  let ls = vendas().filter((l) => (!e.art || l.ref === e.art) && (!e.cli || l.cli === e.cli) && l.data >= e.de && l.data <= e.ate && (!e.tipo || l.tipo === e.tipo));
  if (e.ordem) { const { k, dir } = e.ordem; ls = ls.slice().sort((a, b) => { const x = val(e, a, k), y = val(e, b, k); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt', { numeric: true })) * dir; }); }
  return ls;
}
interface Col { k: ColK; t: string; w: number; num?: boolean; mono?: boolean; titulo?: string }
const cols = (_e?: Est): Col[] => [
  { k: 'doc', t: 'N.º doc.', w: 11, mono: true },
  { k: 'data', t: 'Data', w: 8.5 },
  { k: 'tipo', t: 'Tipo', w: 11 },
  { k: 'req', t: 'Req. cliente', w: 9, mono: true, titulo: 'Nr. Req. Cli. do antigo: a requisição (ou encomenda) do cliente' },
  /* o cliente (por artigo) ou o artigo (por cliente) não é coluna: a faixa já o diz; no Excel vai em colunas */
  { k: 'un', t: 'Un.', w: 5.5 },
  { k: 'qtd', t: 'Qt.', w: 6, num: true },
  { k: 'preco', t: 'Pr. unit.', w: 8, num: true },
  { k: 'd1', t: 'Desc. 1', w: 7, num: true },
  { k: 'd2', t: 'Desc. 2', w: 7, num: true },
  { k: 'stx', t: 'IVA', w: 6, num: true, titulo: '#STx do antigo: a taxa de IVA da linha' },
  { k: 'liq', t: 'Pr. unit. líq.', w: 9, num: true },
  { k: 'valor', t: 'Valor', w: 12, num: true },
];
function val(e: Est, l: LinhaVenda, k: ColK): string | number {
  if (k === 'outro') return e.modo === 'artigo' ? l.cli : l.ref;
  if (k === 'tipo') return NOME_VENDA[l.tipo];
  return l[k];
}
function celula(e: Est, l: LinhaVenda, c: Col): string {
  switch (c.k) {
    case 'doc': return `<b>${esc(l.doc)}</b>`;
    case 'data': return dia(l.data);
    case 'tipo': return `<span class="mac-tipo mac-tipo--${l.tipo}">${NOME_VENDA[l.tipo]}</span>`;
    case 'req': return l.req ? esc(l.req) : '<span class="is-nada">—</span>';
    case 'outro': if (e.modo === 'artigo') { const c_ = cliente(l.cli); return `<span class="mac-ent-c"><b class="is-mono">${esc(l.cli)}</b> ${esc(c_?.nome ?? '')}</span>`; } else { const a = artigo(l.ref); return `<span class="mac-ent-c"><b class="is-mono">${esc(l.ref)}</b> ${esc(a?.desc ?? '')}</span>`; }
    case 'un': return esc(l.un);
    case 'qtd': return `<span class="${l.qtd < 0 ? 'mac-neg' : ''}">${l.qtd < 0 ? '−' : ''}${nf(Math.abs(l.qtd))}</span>`;
    case 'preco': return dec(l.preco);
    case 'd1': return l.d1 ? `${l.d1} %` : '<span class="is-nada">0</span>';
    case 'd2': return l.d2 ? `${l.d2} %` : '<span class="is-nada">0</span>';
    case 'stx': return `<span title="Taxa ${esc(l.stx)} (normal)">${l.iva / 100} %</span>`;
    case 'liq': return dec(l.liq);
    case 'valor': return `<b class="${l.valor < 0 ? 'mac-neg' : ''}">${euros(l.valor)}</b>`;
  }
}
const somaQ = (ls: LinhaVenda[]) => ls.reduce((s, l) => s + l.qtd, 0);
const somaV = (ls: LinhaVenda[]) => ls.reduce((s, l) => s + l.valor, 0);
const docs = (ls: LinhaVenda[]) => new Set(ls.map((l) => l.doc)).size;

/* ---------- a página ---------- */
function html(cen: string): string {
  const id = (x: string) => `mac-${x}-${cen}`;
  const opT = (v: string, t: string) => `<option value="${v}">${esc(t)}</option>`;
  return `<div class="hm ak lf2 dv2 mac" data-hm data-mac data-mac-cenario="${cen}" data-teclas="F9 F11 Escape">
  ${topoErp([['ERP', 'inicio'], ['Stocks', ''], ['Mapas', ''], ['Artigos/clientes', '']])}
  <header class="ak-cab lf2-cab">
    <span class="ak-cab-ic">${L(usersIc)}</span>
    <div><h1>Artigos/clientes</h1><p>Quem comprou cada artigo e o que comprou cada cliente, linha a linha.</p></div>
    <span class="lf2-restaurada" data-mac-restaurada hidden></span>
  </header>

  <div class="ak-barra lf2-barra mac-barra" role="toolbar" aria-label="Ações do mapa">
    ${BTN('atualizar', refresh, 'Atualizar', 'F9').replace('data-dv2-acao', 'data-mac-acao')}
    ${BTN('imprimir', printer, 'Imprimir', 'F11').replace('data-dv2-acao', 'data-mac-acao')}
    <i class="ak-sep" aria-hidden="true"></i>
    ${BTN('excel', sheet, 'Exportar para Excel', '').replace('data-dv2-acao', 'data-mac-acao')}
    <span class="ak2-esp"></span>
    <span class="rc-hora" data-mac-hora></span>
  </div>

  <section class="lf-filtros lf2-filtros dv2-filtros mac-filtros" aria-label="Pesquisa e filtros">
    <div class="ak-campo dv2-pesquisa mac-pesquisa" role="group" aria-labelledby="${id('pq-t')}">
      <span id="${id('pq-t')}">Visualização</span>
      <div class="dv2-pq mac-pq">
        <span class="dv2-modos" role="radiogroup" aria-label="Visualizar por">
          <button type="button" role="radio" aria-checked="true" data-mac-modo="artigo" title="Visualizar por artigo: quem o comprou (Ctrl+F1)">${L(packageIc)}<span>Por artigo</span><kbd>Ctrl+F1</kbd></button>
          <button type="button" role="radio" aria-checked="false" data-mac-modo="cliente" title="Visualizar por cliente: o que comprou (Ctrl+F2)">${L(usersIc)}<span>Por cliente</span><kbd>Ctrl+F2</kbd></button>
        </span>
        <span class="lf2-comp" role="radiogroup" aria-label="Como compara">
          <button type="button" role="radio" aria-checked="true" data-mac-comp="inicio" title="Pesquisa iniciada por (Shift+F1)">Iniciado por</button>
          <button type="button" role="radio" aria-checked="false" data-mac-comp="contem" title="Pesquisa contendo (Shift+F2)">Contendo</button>
          <button type="button" role="radio" aria-checked="false" data-mac-comp="igual" title="Pesquisa exatamente igual a (Shift+F3)">Igual a</button>
        </span>
        <label class="lf2-pq-in">${L(search)}<input type="search" id="${id('q')}" data-mac-q autocomplete="off" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="${id('sug')}" placeholder="Referência ou descrição do artigo" aria-label="Pesquisar artigo"></label>
      </div>
      <ul class="mac-sug" id="${id('sug')}" role="listbox" aria-label="Hipóteses" data-mac-sug hidden></ul>
    </div>
    <div class="mac-campos">
      ${(['art', 'cli'] as const).map((k) => `<div class="ak-campo mac-ent" data-mac-campo-ent="${k}"><span id="${id(`ent-${k}`)}">${k === 'art' ? 'Artigo' : 'Cliente'}</span><div class="mac-ent-v" data-mac-ent="${k}"></div><div class="mac-ent-f" data-mac-ent-filtro="${k}" hidden><select data-mac-sel="${k}" aria-labelledby="${id(`ent-${k}`)}"><option value="">Todos</option></select></div></div>`).join('')}
      <div class="ak-campo dv2-periodo mac-periodo" role="group" aria-labelledby="${id('per')}"><span id="${id('per')}">Período</span><span class="ak2-per"><input type="date" id="${id('de')}" data-mac-f="de" aria-label="Período — de"><i>a</i><input type="date" id="${id('ate')}" data-mac-f="ate" aria-label="Período — até"></span></div>
      <label class="ak-campo mac-tipo-f" for="${id('tipo')}"><span>Tipo de documento</span><select id="${id('tipo')}" data-mac-f="tipo">${opT('', 'Todos')}${(Object.keys(NOME_VENDA) as TipoVenda[]).map((t) => opT(t, NOME_VENDA[t])).join('')}</select></label>
    </div>
  </section>

  <div class="rc-somatorios mac-soma" data-mac-soma role="status" aria-live="polite" hidden></div>
  <section class="lf2-lista dv2-lista mac-lista" aria-labelledby="${id('lista-t')}">
    <div class="lf2-lista-cab"><h2 id="${id('lista-t')}" data-mac-lista-t>Linhas de venda</h2><p class="lf2-resumo" data-mac-resumo></p><span class="mac-volta" data-mac-volta></span></div>
    <div class="lf2-grelha lf2-grelha--ajusta" data-mac-grelha tabindex="-1"></div>
  </section>
  <div class="mac-impressao" aria-hidden="true" data-mac-impressao></div>
  <footer class="ak-estado lf2-estado" data-mac-estado role="status" aria-live="polite"></footer>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

/* ---------- desenhar ---------- */
const avisos = new WeakMap<HTMLElement, number>();
function toast(r: HTMLElement, t: string): void { const p = r.querySelector<HTMLElement>('[data-hm-aviso]'); if (!p) return; p.textContent = t; p.classList.add('is-visivel'); clearTimeout(avisos.get(r)); avisos.set(r, window.setTimeout(() => p.classList.remove('is-visivel'), 3200)); }
const nomeArt = (ref: string) => { const a = artigo(ref); return a ? `${a.ref} · ${a.desc}` : ref; };
const nomeCli = (num: string) => { const c = cliente(num); return c ? `${c.num} · ${c.nome}` : num; };

function pesquisa(r: HTMLElement, e: Est): void {
  r.querySelectorAll<HTMLElement>('[data-mac-modo]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.macModo === e.modo)));
  r.querySelectorAll<HTMLElement>('[data-mac-comp]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.macComp === e.comp)));
  const q = r.querySelector<HTMLInputElement>('[data-mac-q]')!;
  if (q.value !== e.q) q.value = e.q;
  q.placeholder = e.modo === 'artigo' ? 'Referência ou descrição do artigo' : 'Número ou nome do cliente';
  q.setAttribute('aria-label', `Pesquisar ${e.modo === 'artigo' ? 'artigo' : 'cliente'}, ${NOME_COMP[e.comp]}`);
  /* o campo do modo é o que se procura; o outro filtra */
  (['art', 'cli'] as const).forEach((k) => {
    const v = e[k], el = r.querySelector<HTMLElement>(`[data-mac-ent="${k}"]`)!, principal = (k === 'art') === (e.modo === 'artigo');
    r.querySelector(`[data-mac-campo-ent="${k}"] > span`)!.innerHTML = `${k === 'art' ? 'Artigo' : 'Cliente'}${principal ? '' : ' <small>filtro</small>'}`;
    const f = r.querySelector<HTMLElement>(`[data-mac-ent-filtro="${k}"]`)!;
    el.hidden = !principal; f.hidden = principal;
    if (principal) {
      el.classList.add('is-principal');
      el.innerHTML = v ? `<span class="mac-ent-chip"><b class="is-mono">${esc(v)}</b><span>${esc(k === 'art' ? artigo(v)?.desc ?? '' : cliente(v)?.nome ?? '')}</span><button type="button" data-mac-limpar="${k}" aria-label="Tirar ${k === 'art' ? 'o artigo' : 'o cliente'}">${L(xIc)}</button></span>`
        : `<span class="mac-ent-vazio">Procura em cima${e.modo === 'artigo' ? ' um artigo' : ' um cliente'}</span>`;
      return;
    }
    /* o filtro: os clientes (ou os artigos) que aparecem nas linhas do principal, no período */
    const sel = f.querySelector<HTMLSelectElement>('select')!, alvo = e.modo === 'artigo' ? e.art : e.cli;
    const ks = alvo ? [...new Set(vendas().filter((l) => (e.modo === 'artigo' ? l.ref === e.art : l.cli === e.cli) && l.data >= e.de && l.data <= e.ate).map((l) => k === 'cli' ? l.cli : l.ref))] : [];
    if (v && !ks.includes(v)) ks.unshift(v);
    ks.sort((a, b) => (k === 'cli' ? nomeCli(a) : a).localeCompare(k === 'cli' ? nomeCli(b) : b, 'pt', { numeric: true }));
    const ops = `<option value="">${alvo ? 'Todos' : `Escolhe primeiro ${e.modo === 'artigo' ? 'o artigo' : 'o cliente'}`}</option>${ks.map((x) => `<option value="${esc(x)}">${esc(k === 'cli' ? nomeCli(x) : nomeArt(x))}</option>`).join('')}`;
    if (sel.dataset.ops !== ops) { sel.innerHTML = ops; sel.dataset.ops = ops; }
    sel.value = v; sel.disabled = !alvo && !v;
  });
  const fd = r.querySelector<HTMLInputElement>('[data-mac-f="de"]')!, fa = r.querySelector<HTMLInputElement>('[data-mac-f="ate"]')!, ft = r.querySelector<HTMLSelectElement>('[data-mac-f="tipo"]')!;
  fd.value = e.de; fa.value = e.ate; ft.value = e.tipo;
  sugestoes(r, e);
}
function sugestoes(r: HTMLElement, e: Est): void {
  const ul = r.querySelector<HTMLElement>('[data-mac-sug]')!, q = r.querySelector<HTMLInputElement>('[data-mac-q]')!;
  const hs = hipoteses(e.modo, e.comp, e.q), aberta = e.sugAberta && !!e.q.trim();
  ul.hidden = !aberta; q.setAttribute('aria-expanded', String(aberta));
  if (!aberta) { q.removeAttribute('aria-activedescendant'); return; }
  if (!hs.length) {
    const outra = e.comp !== 'contem' && hipoteses(e.modo, 'contem', e.q).length;
    ul.innerHTML = `<li class="mac-sug-nada" role="option" aria-disabled="true">${L(searchX)}<span>Nenhum ${e.modo === 'artigo' ? 'artigo' : 'cliente'} ${NOME_COMP[e.comp]} «${esc(e.q)}».${outra ? ` <button type="button" class="lf2-limpar" data-mac-comp-ir="contem">Contendo (Shift+F2) encontra ${outra}</button>` : ''}</span></li>`; return;
  }
  e.sugI = Math.max(0, Math.min(hs.length - 1, e.sugI));
  const marca = (t: string) => { const x = sem(e.q); if (!x) return esc(t); const i = sem(t).indexOf(x); if (i < 0 || (e.comp === 'inicio' && i > 0)) return esc(t);
    /* a marca segue as letras (sem espaços nem acentos) até às do texto original */
    let a = -1, b = -1, n = 0; for (let j = 0; j < t.length; j++) { if (/\s/.test(t[j])) continue; if (n === i && a < 0) a = j; n++; if (n === i + x.length) { b = j + 1; break; } }
    return a < 0 || b < 0 ? esc(t) : `${esc(t.slice(0, a))}<mark>${esc(t.slice(a, b))}</mark>${esc(t.slice(b))}`; };
  const MAX = 8;
  ul.innerHTML = hs.slice(0, MAX).map((h, i) => `<li role="option" id="${ul.id}-${i}" aria-selected="${i === e.sugI}" data-mac-hip="${esc(h.k)}"><b class="is-mono">${marca(h.cod)}</b><span>${marca(h.nome)}</span><small>${esc(h.extra)}</small></li>`).join('')
    + (hs.length > MAX ? `<li class="mac-sug-mais" role="presentation">Mais ${hs.length - MAX}: escreve mais letras</li>` : '');
  q.setAttribute('aria-activedescendant', `${ul.id}-${e.sugI}`);
}
function grelha(r: HTMLElement, e: Est, revelar = false): void {
  const g = r.querySelector<HTMLElement>('[data-mac-grelha]')!;
  r.classList.toggle('is-ocupada', e.fase === 'carregar' && !!g.querySelector('table'));
  const vazio = (ic: string, t: string, d: string, botao = '') => { g.innerHTML = `<div class="ak-vazio lf2-vazio">${L(ic)}<p><b>${t}</b>${d}</p>${botao}</div>`; };
  if (e.fase === 'erro') {
    if (e.erro === 'offline') return vazio(wifiOff, 'Sem ligação à rede.', 'A pesquisa e os filtros ficam. Quando a ligação voltar, atualiza (F9).', `<button type="button" class="ak-btn ak-btn--acao" data-mac-acao="atualizar">${L(refresh)}<span>Tentar outra vez</span></button>`);
    if (e.erro === 'sessao') return vazio(logIn, 'A sessão terminou.', 'Volta a entrar para continuar; a pesquisa fica neste ecrã.', `<button type="button" class="ak-btn ak-btn--acao" data-login>${L(logIn)}<span>Voltar a entrar</span></button>`);
    if (e.erro === 'permissao') return vazio(lock, 'O teu perfil não tem acesso aos mapas de Stocks.', 'Pede acesso a quem gere os acessos do ERP.');
    return vazio(circleAlert, 'Não foi possível ler as vendas.', 'O servidor das vendas não respondeu (ERP-VND-503). A pesquisa fica.', `<button type="button" class="ak-btn ak-btn--acao" data-mac-acao="atualizar">${L(refresh)}<span>Tentar outra vez</span></button>`);
  }
  if (e.fase === 'carregar' && !g.querySelector('table')) { g.innerHTML = `<div class="lf2-esq" aria-label="A ler as vendas">${Array.from({ length: 8 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>`; return; }
  if (e.modo === 'artigo' ? !e.art : !e.cli) return vazio(search, e.modo === 'artigo' ? 'Escolhe um artigo.' : 'Escolhe um cliente.', e.modo === 'artigo' ? 'Escreve em cima a referência ou a descrição; aparecem os clientes que o compraram.' : 'Escreve em cima o número ou o nome; aparecem os artigos que comprou.');
  const ls = linhas(e), cs = cols(e);
  if (!ls.length) {
    const largo = e.de !== DE0 || e.ate !== HOJE || !!e.tipo || (e.modo === 'artigo' ? !!e.cli : !!e.art);
    return vazio(inbox, e.modo === 'artigo' ? `O artigo ${esc(e.art)} não tem vendas ${largo ? 'com estes filtros' : 'este ano'}.` : `O cliente ${esc(e.cli)} não tem compras ${largo ? 'com estes filtros' : 'este ano'}.`,
      largo ? 'Alarga o período, o tipo de documento ou tira o outro filtro.' : 'Pode ser novo na tabela; as vendas aparecem aqui quando houver.', largo ? `<button type="button" class="ak-btn" data-mac-acao="alargar">${L(calendarRange)}<span>Todo o ano, sem filtros</span></button>` : '');
  }
  const sort = (k: ColK) => e.ordem?.k === k ? (e.ordem.dir === 1 ? 'ascending' : 'descending') : 'none';
  const cab = `<tr>${cs.map((c) => `<th scope="col" class="${c.num ? 'is-num' : ''}" aria-sort="${sort(c.k)}"${c.titulo ? ` title="${esc(c.titulo)}"` : ''}><button type="button" data-mac-ordenar="${c.k}">${esc(c.t)}${e.ordem?.k === c.k ? `<span class="lf2-ord">${L(e.ordem.dir === 1 ? arrowUp : arrowDown)}</span>` : ''}</button></th>`).join('')}</tr>`;
  const tr = (l: LinhaVenda) => `<tr data-mac-linha="${esc(l.id)}" class="${l.tipo === 'NC' ? 'is-credito' : ''}">${cs.map((c) => `<td class="${c.num ? 'is-num ' : ''}${c.mono ? 'is-mono' : ''}">${celula(e, l, c)}</td>`).join('')}</tr>`;
  /* uma faixa por cliente (por artigo) ou por artigo (por cliente), com o que levou; ordenadas pelo valor */
  const chave = (l: LinhaVenda) => e.modo === 'artigo' ? l.cli : l.ref;
  const gs = new Map<string, LinhaVenda[]>(); ls.forEach((l) => gs.set(chave(l), [...(gs.get(chave(l)) ?? []), l]));
  const ordem = [...gs].sort((a, b) => somaV(b[1]) - somaV(a[1]));
  const un = e.modo === 'artigo' ? artigo(e.art)?.un ?? 'un.' : '';
  const corpo = ordem.map(([k, xs]) => {
    const fechada = e.fechadas.has(k), nome = e.modo === 'artigo' ? nomeCli(k) : nomeArt(k), extra = e.modo === 'artigo' ? cliente(k)?.cidade ?? '' : artigo(k)?.marca ?? '';
    const q = somaQ(xs), unG = e.modo === 'artigo' ? un : artigo(k)?.un ?? 'un.';
    return `<tr class="mac-g" data-mac-g="${esc(k)}"><td colspan="${cs.length}"><div class="mac-g-c">
      <button type="button" class="mac-g-abrir" data-mac-abrir="${esc(k)}" aria-expanded="${!fechada}" title="${fechada ? 'Mostrar' : 'Esconder'} as linhas">${L(arrowDown, 'mac-g-seta')}<b>${esc(nome)}</b>${extra && extra !== '—' ? `<small>${esc(extra)}</small>` : ''}</button>
      <span class="mac-g-n">${nf(docs(xs))} ${docs(xs) === 1 ? 'documento' : 'documentos'} · <b>${nf(q)} ${esc(unid(q, unG))}</b> · <b>${euros(somaV(xs))}</b> · última ${dia(xs.reduce((m, l) => l.data > m ? l.data : m, ''))}</span>
      ${k === '1' ? '' : `<button type="button" class="lf2-limpar mac-g-trocar" data-mac-trocar="${esc(k)}" title="${e.modo === 'artigo' ? 'Visualizar o que este cliente comprou (Ctrl+F2)' : 'Visualizar quem comprou este artigo (Ctrl+F1)'}">${L(arrowRightLeft)}<span>${e.modo === 'artigo' ? 'Ver o que comprou' : 'Ver quem comprou'}</span></button>`}
    </div></td></tr>${fechada ? '' : xs.map(tr).join('')}`;
  }).join('');
  const tot = `<tr class="rc-total mac-total"><td colspan="${cs.findIndex((c) => c.k === 'qtd')}"><b>Total · ${nf(ls.length)} ${ls.length === 1 ? 'linha' : 'linhas'} · ${nf(gs.size)} ${e.modo === 'artigo' ? (gs.size === 1 ? 'cliente' : 'clientes') : (gs.size === 1 ? 'artigo' : 'artigos')}</b></td><td class="is-num"><b>${e.modo === 'artigo' ? nf(somaQ(ls)) : ''}</b></td><td colspan="${cs.length - cs.findIndex((c) => c.k === 'qtd') - 2}"></td><td class="is-num"><b>${euros(somaV(ls))}</b></td></tr>`;
  g.innerHTML = `<table class="lf2-tab lf2-tab--ajusta mac-tab" aria-label="Linhas de venda"><colgroup>${cs.map((c) => `<col style="width:${c.w}%">`).join('')}</colgroup><thead>${cab}</thead><tbody>${corpo}</tbody><tfoot>${tot}</tfoot></table>`;
  if (revelar && !quieto()) g.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}
function somatorios(r: HTMLElement, e: Est): void {
  const s = r.querySelector<HTMLElement>('[data-mac-soma]')!, ls = e.fase === 'erro' ? [] : linhas(e);
  s.hidden = !ls.length; if (!ls.length) { s.innerHTML = ''; return; }
  const v = somaV(ls), q = somaQ(ls), ncs = ls.filter((l) => l.tipo === 'NC');
  const outros = new Set(ls.map((l) => e.modo === 'artigo' ? l.cli : l.ref)).size;
  const medio = e.modo === 'artigo' && q > 0 ? Math.round(v / q) : 0;
  s.innerHTML = `<span class="rc-s rc-s--total"><small>Valor líquido</small><b>${euros(v)}</b><i>sem IVA · as notas de crédito subtraem</i></span>
    ${e.modo === 'artigo' ? `<span class="rc-s"><small>Quantidade</small><b>${nf(q)} ${esc(unid(q, artigo(e.art)?.un ?? ''))}</b><i>${ncs.length ? `${nf(-somaQ(ncs))} devolvidas` : 'nenhuma devolvida'}</i></span>
    <span class="rc-s"><small>Preço médio líquido</small><b>${medio ? euros(medio) : '—'}</b><i>de tabela ${euros(ls[0].preco)}</i></span>` : `<span class="rc-s"><small>Artigos diferentes</small><b>${nf(outros)}</b><i>${nf(somaQ(ls))} unidades no total</i></span>`}
    <span class="rc-s"><small>Documentos</small><b>${nf(docs(ls))}</b><i>${ncs.length ? `${nf(docs(ncs))} de crédito` : 'nenhum de crédito'}</i></span>
    ${e.modo === 'artigo' ? `<span class="rc-s"><small>Clientes</small><b>${nf(outros)}</b><i>o maior: ${esc(cliente([...new Map(ls.map((l) => [l.cli, 0])).keys()].sort((a, b) => somaV(ls.filter((l) => l.cli === b)) - somaV(ls.filter((l) => l.cli === a)))[0])?.nome ?? '')}</i></span>` : ''}
    <span class="rc-s"><small>Última venda</small><b>${dia(ls.reduce((m, l) => l.data > m ? l.data : m, ''))}</b><i>${esc(NOME_VENDA[ls.slice().sort((a, b) => b.data.localeCompare(a.data))[0].tipo])}</i></span>`;
}
function cabLista(r: HTMLElement, e: Est): void {
  const t = r.querySelector<HTMLElement>('[data-mac-lista-t]')!, p = r.querySelector<HTMLElement>('[data-mac-resumo]')!, v = r.querySelector<HTMLElement>('[data-mac-volta]')!;
  const ent = e.modo === 'artigo' ? e.art : e.cli;
  t.textContent = !ent ? 'Linhas de venda' : e.modo === 'artigo' ? `Quem comprou ${nomeArt(e.art)}` : `O que comprou ${nomeCli(e.cli)}`;
  const fs = [e.de !== DE0 || e.ate !== HOJE ? `${dia(e.de)} a ${dia(e.ate)}` : 'Este ano', e.tipo ? NOME_VENDA[e.tipo] : '', e.modo === 'artigo' && e.cli ? `só ${nomeCli(e.cli)}` : '', e.modo === 'cliente' && e.art ? `só ${e.art}` : ''].filter(Boolean);
  p.innerHTML = ent ? fs.map((x) => `<span>${esc(x)}</span>`).join('') : '';
  v.innerHTML = e.volta ? `<button type="button" class="lf2-limpar" data-mac-acao="voltar">${L(arrowLeft)}<span>${esc(e.volta.modo === 'artigo' ? `Voltar a quem comprou ${e.volta.art}` : `Voltar ao que comprou ${e.volta.cli}`)}</span></button>` : '';
}
function estado(r: HTMLElement, e: Est): void {
  const ls = e.fase === 'erro' ? [] : linhas(e), ent = e.modo === 'artigo' ? e.art : e.cli;
  const fase = e.fase === 'carregar' ? 'A ler…' : e.fase === 'erro' ? 'Erro' : ent ? 'Pronto' : 'À espera de um ' + (e.modo === 'artigo' ? 'artigo' : 'cliente');
  r.querySelector<HTMLElement>('[data-mac-estado]')!.innerHTML = `<span>Visualização <b>por ${e.modo}</b></span><span>Pesquisa <b>${e.comp === 'inicio' ? 'iniciado por' : e.comp === 'contem' ? 'contendo' : 'igual a'}</b></span>${ent ? `<span>Linhas <b>${nf(ls.length)}</b></span>` : ''}<span class="ak-estado-f is-${e.fase === 'ok' ? 'ok' : 'a-gerar'}">${e.fase === 'carregar' ? L(loader) : ''}${fase}</span>${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  r.querySelector<HTMLElement>('[data-mac-hora]')!.innerHTML = e.hora ? `Atualizado às <b>${new Date(e.hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</b>` : '';
  r.querySelectorAll<HTMLElement>('.mac-barra [data-mac-acao]').forEach((b) => {
    const k = b.dataset.macAcao!, p = k !== 'atualizar' && !ls.length ? (ent ? 'Não há linhas para isso.' : `Escolhe primeiro um ${e.modo === 'artigo' ? 'artigo' : 'cliente'}.`) : '';
    b.setAttribute('aria-disabled', String(!!p)); b.title = p || `${b.querySelector('span')?.textContent}${b.getAttribute('aria-keyshortcuts') ? ` (${b.getAttribute('aria-keyshortcuts')})` : ''}`;
  });
  const ip = r.querySelector<HTMLElement>('[data-mac-impressao]');
  if (ip) ip.innerHTML = ent ? `<h1>Artigos/clientes · ${esc(e.modo === 'artigo' ? `quem comprou ${nomeArt(e.art)}` : `o que comprou ${nomeCli(e.cli)}`)}</h1><p>Período ${dia(e.de)} a ${dia(e.ate)}${e.tipo ? ` · ${NOME_VENDA[e.tipo]}` : ''}${e.modo === 'artigo' && e.cli ? ` · só ${esc(nomeCli(e.cli))}` : ''}${e.modo === 'cliente' && e.art ? ` · só ${esc(e.art)}` : ''} · impresso a ${new Date().toLocaleString('pt-PT')}</p>` : '';
}
function tudo(r: HTMLElement, e: Est, revelar = false): void { pesquisa(r, e); grelha(r, e, revelar); somatorios(r, e); cabLista(r, e); estado(r, e); }

/* ---------- ações ---------- */
function guardar(e: Est): void { if (e.editor) return; try { localStorage.setItem(CHAVE, JSON.stringify({ modo: e.modo, comp: e.comp, art: e.art, cli: e.cli, de: e.de, ate: e.ate, tipo: e.tipo })); } catch { /* sem armazenamento */ } }
async function ler(r: HTMLElement, e: Est, revelar = true): Promise<void> {
  e.fase = 'carregar'; e.erro = undefined; tudo(r, e);
  await new Promise((ok) => window.setTimeout(ok, quieto() ? 0 : 180));
  e.fase = 'ok'; e.hora = Date.now(); guardar(e); tudo(r, e, revelar);
}
function escolher(r: HTMLElement, e: Est, k: string): void {
  if (e.modo === 'artigo') e.art = k; else e.cli = k;
  e.q = ''; e.sugAberta = false; e.sugI = 0; e.fechadas.clear(); e.aviso = '';
  void ler(r, e);
  r.querySelector<HTMLElement>('[data-mac-grelha]')?.focus({ preventScroll: true });
}
function mudarModo(r: HTMLElement, e: Est, m: Modo): void {
  if (e.modo === m) return; e.modo = m; e.q = ''; e.sugAberta = false; e.fechadas.clear(); e.ordem = null; e.volta = undefined;
  tudo(r, e, true); guardar(e); r.querySelector<HTMLInputElement>('[data-mac-q]')?.focus();
}
function trocar(r: HTMLElement, e: Est, k: string): void {
  e.volta = { modo: e.modo, art: e.art, cli: e.cli };
  if (e.modo === 'artigo') { e.modo = 'cliente'; e.cli = k; e.art = ''; } else { e.modo = 'artigo'; e.art = k; e.cli = ''; }
  e.fechadas.clear(); e.ordem = null; void ler(r, e);
  toast(r, e.modo === 'cliente' ? `Agora: o que comprou ${nomeCli(k)}.` : `Agora: quem comprou ${nomeArt(k)}.`);
}
function exportar(r: HTMLElement, e: Est): void {
  const ls = linhas(e); if (!ls.length) return;
  try {
    const cs = cols(e);
    const ts = ['N.º cliente', 'Nome do cliente', 'Artigo', 'Descrição', ...cs.map((c) => c.k === 'stx' ? 'IVA %' : c.t)];
    const rows: Celula[][] = ls.map((l) => [l.cli, cliente(l.cli)?.nome ?? '', l.ref, artigo(l.ref)?.desc ?? '', ...cs.map((c): Celula => c.k === 'valor' || c.k === 'preco' || c.k === 'liq' ? { euros: l[c.k] } : c.k === 'qtd' || c.k === 'd1' || c.k === 'd2' ? l[c.k] : c.k === 'stx' ? l.iva / 100 : c.k === 'data' ? dia(l.data) : String(val(e, l, c.k) ?? '') || null)]);
    rows.push(ts.map((t, i): Celula => i === 0 ? `Total · ${ls.length}` : t === 'Qt.' ? somaQ(ls) : t === 'Valor' ? { euros: somaV(ls) } : null));
    const alvo = e.modo === 'artigo' ? e.art : e.cli;
    const nome = `Artigos-clientes-${e.modo}-${alvo.replace(/[^\w.-]+/g, '_')}-${e.de}-${e.ate}.xlsx`;
    descarregar(xlsx({ nome: 'Artigos-clientes', colunas: ts, linhas: rows, larguras: ts.map((t) => Math.max(8, t.length + 4)) }), nome);
    e.aviso = `Exportado: ${nome} · ${nf(ls.length)} linhas.`; estado(r, e); toast(r, e.aviso);
  } catch { e.aviso = 'A exportação falhou. As linhas ficam; tenta outra vez.'; estado(r, e); toast(r, e.aviso); }
}

/* ---------- os cenários (os estados no editor) ---------- */
const PRIMEIRO_ART = '6206-2RSH', PRIMEIRO_CLI = '10231';
function armar(r: HTMLElement): void {
  if (estados.has(r)) return;
  const e = de(r), cen = r.dataset.macCenario ?? 'inicial';
  if (cen === 'inicial' && !e.editor) { try { const v = JSON.parse(localStorage.getItem(CHAVE) ?? 'null'); if (v) Object.assign(e, { modo: v.modo ?? 'artigo', comp: v.comp ?? 'inicio', art: v.art ?? '', cli: v.cli ?? '', de: v.de ?? DE0, ate: v.ate ?? HOJE, tipo: v.tipo ?? '' }); } catch { /* */ } }
  const comDados = !['inicial', 'cliente-vazio', 'sugestoes', 'igual', 'sem-hipoteses', 'cliente-sug', 'a-carregar'].includes(cen);
  if (comDados) { e.art = PRIMEIRO_ART; e.hora = Date.parse('2026-11-18T10:14:00'); }
  if (['por-cliente', 'cliente-filtro', 'trocado'].includes(cen)) { e.modo = 'cliente'; e.cli = PRIMEIRO_CLI; e.art = cen === 'cliente-filtro' ? 'GDB1330' : ''; }
  if (cen === 'cliente-vazio' || cen === 'cliente-sug') e.modo = 'cliente';
  if (cen === 'cliente-sug') { e.q = 'mec'; e.comp = 'contem'; e.sugAberta = true; }
  if (cen === 'sugestoes') { e.q = 'pastilhas'; e.comp = 'contem'; e.sugAberta = true; e.sugI = 1; }
  if (cen === 'igual') { e.q = 'bkr6e'; e.comp = 'igual'; e.sugAberta = true; }
  if (cen === 'sem-hipoteses') { e.q = 'travão'; e.comp = 'inicio'; e.sugAberta = true; }
  if (cen === 'filtro-cliente') e.cli = PRIMEIRO_CLI;
  if (cen === 'notas-credito') e.tipo = 'NC';
  if (cen === 'periodo') { e.de = '2026-07-01'; e.ate = '2026-09-30'; }
  if (cen === 'sem-vendas') e.art = '0 986 424 797';
  if (cen === 'sem-vendas-filtros') { e.de = '2026-10-15'; e.tipo = 'FR'; }
  if (cen === 'ordenado') e.ordem = { k: 'valor', dir: -1 };
  if (cen === 'faixas-fechadas') { const ls = linhas(e); new Set(ls.map((l) => l.cli)).forEach((k) => e.fechadas.add(k)); }
  if (cen === 'trocado') e.volta = { modo: 'artigo', art: PRIMEIRO_ART, cli: '' };
  if (cen === 'a-carregar') { e.art = PRIMEIRO_ART; e.fase = 'carregar'; }
  if (cen === 'a-atualizar') { tudo(r, e); e.fase = 'carregar'; }
  if (['servidor', 'offline', 'sessao', 'permissao'].includes(cen)) { e.fase = 'erro'; e.erro = cen as Est['erro']; }
  if (cen === 'exportado') e.aviso = `Exportado: Artigos-clientes-artigo-6206-2RSH-2026-01-01-${HOJE}.xlsx · ${nf(linhas(e).length)} linhas.`;
  if (cen === 'imprimir') e.aviso = 'A preparar a impressão: o título, o artigo, o período, as faixas e o total.';
  tudo(r, e);
  if (cen === 'restaurado') { const x = r.querySelector<HTMLElement>('[data-mac-restaurada]')!; x.hidden = false; x.innerHTML = `${L(undo)}Reposto como o deixaste às 09:12`; }
  const aVista = !!r.closest('.ecra:not([hidden]) > .versao:not([hidden])');
  if (!e.editor && aVista && !quieto()) r.classList.add('lf2-entra');
  if (!e.editor && aVista && cen === 'inicial' && !e.art && !e.cli) r.querySelector<HTMLInputElement>('[data-mac-q]')?.focus({ preventScroll: true });
}
const armarTodos = () => document.querySelectorAll<HTMLElement>('[data-mac]').forEach(armar);

export function iniciar(): void {
  requestAnimationFrame(armarTodos);
  ['romafe:versao', 'romafe:ecra'].forEach((y) => document.addEventListener(y, () => requestAnimationFrame(armarTodos)));
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const e = de(r); let b: HTMLElement | null;
    if ((b = t.closest('[data-mac-acao][aria-disabled="true"]'))) { toast(r, b.title); return; }
    if ((b = t.closest('[data-mac-modo]'))) { mudarModo(r, e, b.dataset.macModo as Modo); return; }
    if ((b = t.closest('[data-mac-comp], [data-mac-comp-ir]'))) { e.comp = (b.dataset.macComp ?? b.dataset.macCompIr) as Comp; e.sugI = 0; e.sugAberta = !!e.q; pesquisa(r, e); estado(r, e); guardar(e); r.querySelector<HTMLInputElement>('[data-mac-q]')?.focus(); return; }
    if ((b = t.closest('[data-mac-hip]'))) { escolher(r, e, b.dataset.macHip!); return; }
    if ((b = t.closest('[data-mac-limpar]'))) { const k = b.dataset.macLimpar as 'art' | 'cli'; e[k] = ''; e.volta = undefined; tudo(r, e, true); guardar(e); if ((k === 'art') === (e.modo === 'artigo')) r.querySelector<HTMLInputElement>('[data-mac-q]')?.focus(); return; }
    /* escolher o filtro do outro lado: a pesquisa passa ao outro modo só para o escolher, e volta */
    if ((b = t.closest('[data-mac-ordenar]'))) { const k = b.dataset.macOrdenar as ColK; e.ordem = e.ordem?.k === k ? (e.ordem.dir === 1 ? { k, dir: -1 } : null) : { k, dir: 1 }; grelha(r, e); return; }
    if ((b = t.closest('[data-mac-abrir]'))) { const k = b.dataset.macAbrir!; if (e.fechadas.has(k)) e.fechadas.delete(k); else e.fechadas.add(k); grelha(r, e); r.querySelector<HTMLElement>(`[data-mac-abrir="${CSS.escape(k)}"]`)?.focus(); return; }
    if ((b = t.closest('[data-mac-trocar]'))) { trocar(r, e, b.dataset.macTrocar!); return; }
    if ((b = t.closest('[data-mac-acao]'))) {
      const k = b.dataset.macAcao!;
      if (k === 'atualizar') void ler(r, e, false);
      else if (k === 'imprimir') window.print();
      else if (k === 'excel') exportar(r, e);
      else if (k === 'alargar') { e.de = DE0; e.ate = HOJE; e.tipo = ''; if (e.modo === 'artigo') e.cli = ''; else e.art = ''; void ler(r, e); }
      else if (k === 'voltar' && e.volta) { Object.assign(e, e.volta); e.volta = undefined; e.fechadas.clear(); void ler(r, e); }
      return;
    }
    if (!t.closest('.mac-pesquisa') && e.sugAberta) { e.sugAberta = false; sugestoes(r, e); }
  });
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r || !t.matches('[data-mac-q]')) return; const e = de(r);
    e.q = t.value; e.sugI = 0; e.sugAberta = true; sugestoes(r, e);
  });
  document.addEventListener('focusin', (ev) => { const t = ev.target as HTMLElement, r = raiz(t); if (!r || !t.matches('[data-mac-q]')) return; const e = de(r); if (e.q && !e.sugAberta) { e.sugAberta = true; sugestoes(r, e); } });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r || editando()) return; const e = de(r);
    if (t.matches('[data-mac-sel]')) { e[t.dataset.macSel as 'art' | 'cli'] = t.value; e.fechadas.clear(); void ler(r, e); return; }
    if (!t.matches('[data-mac-f]')) return;
    const k = t.dataset.macF as 'de' | 'ate' | 'tipo';
    if (k === 'tipo') e.tipo = t.value as Est['tipo']; else if (t.value) e[k] = t.value;
    if (e.de > e.ate) { toast(r, 'A data inicial é depois da final: trocam-se.'); [e.de, e.ate] = [e.ate, e.de]; }
    void ler(r, e);
  });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t) ?? visivel(); if (!r || editando()) return; const e = de(r);
    if (ev.ctrlKey && !ev.shiftKey && !ev.altKey && (ev.key === 'F1' || ev.key === 'F2')) { ev.preventDefault(); mudarModo(r, e, ev.key === 'F1' ? 'artigo' : 'cliente'); return; }
    if (ev.shiftKey && !ev.ctrlKey && !ev.altKey && ['F1', 'F2', 'F3'].includes(ev.key)) { ev.preventDefault(); r.querySelector<HTMLElement>(`[data-mac-comp="${{ F1: 'inicio', F2: 'contem', F3: 'igual' }[ev.key]}"]`)?.click(); return; }
    if ((ev.key === 'F9' || ev.key === 'F11') && !ev.ctrlKey && !ev.shiftKey && !ev.altKey && !ev.metaKey) { ev.preventDefault(); r.querySelector<HTMLElement>(`.mac-barra [data-mac-acao="${ev.key === 'F9' ? 'atualizar' : 'imprimir'}"]`)?.click(); return; }
    if (t.matches('[data-mac-q]')) {
      const hs = hipoteses(e.modo, e.comp, e.q).slice(0, 8);
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); if (!e.sugAberta) e.sugAberta = true; else e.sugI = (e.sugI + (ev.key === 'ArrowDown' ? 1 : -1) + hs.length) % Math.max(1, hs.length); sugestoes(r, e); return; }
      if (ev.key === 'Enter') { ev.preventDefault(); if (hs[e.sugI]) escolher(r, e, hs[e.sugI].k); else if (e.q) toast(r, `Nenhum ${e.modo === 'artigo' ? 'artigo' : 'cliente'} ${NOME_COMP[e.comp]} «${e.q}».`); return; }
      if (ev.key === 'Escape') { ev.preventDefault(); if (e.sugAberta && e.q) { e.sugAberta = false; sugestoes(r, e); } else { e.q = ''; (t as HTMLInputElement).value = ''; sugestoes(r, e); } return; }
    }
    if (ev.key === 'Escape' && e.sugAberta) { e.sugAberta = false; sugestoes(r, e); ev.preventDefault(); }
  });
}
/* ---------- os ecrãs ---------- */
const NOTA = 'Artigos/clientes (18 nov., do «MAPAS» do ERP antigo): Visualização por artigo (Ctrl+F1) ou por cliente (Ctrl+F2), a pesquisa Iniciado por / Contendo / Igual a (Shift+F1/F2/F3) com as hipóteses por baixo, o outro campo como filtro, o período e o tipo de documento; as linhas de venda com as colunas do antigo numa faixa por cliente (ou por artigo), «Ver o que comprou» troca de visualização, os Somatórios, Atualizar (F9), Imprimir (F11) e Excel. A tabela cabe na largura.';
const ESTADOS: [string, string, string][] = [
  ['por-artigo', 'Por artigo', 'O 6206-2RSH: uma faixa por cliente com o que levou, ordenadas pelo valor; os Somatórios por cima.'],
  ['sugestoes', 'Hipóteses da pesquisa', '«pastilhas» contendo: os artigos que servem, com as letras marcadas; ↑ ↓ e Enter escolhem.'],
  ['igual', 'Exatamente igual a', 'Shift+F3: só a referência certa (BKR6E), sem maiúsculas a contar.'],
  ['sem-hipoteses', 'A pesquisa não encontra', '«travão» iniciado por não dá nenhum; diz quantos encontra Contendo (Shift+F2).'],
  ['filtro-cliente', 'Artigo e um só cliente', 'O campo Cliente filtra: só o que esse cliente levou deste artigo.'],
  ['por-cliente', 'Por cliente', 'Ctrl+F2: o que o cliente comprou, uma faixa por artigo.'],
  ['cliente-vazio', 'Por cliente, sem cliente', 'A visualização por cliente à espera: o número ou o nome em cima.'],
  ['cliente-sug', 'Hipóteses de clientes', '«mec» contendo: os clientes com a cidade.'],
  ['cliente-filtro', 'Cliente e um só artigo', 'O campo Artigo filtra: só esse artigo nas compras do cliente.'],
  ['trocado', 'Trocar de visualização', '«Ver o que comprou» numa faixa: passa a esse cliente, e «Voltar» repõe o artigo.'],
  ['periodo', 'Um trimestre', 'O período encurta as linhas e os Somatórios.'],
  ['notas-credito', 'Só notas de crédito', 'O tipo de documento: as devoluções, a subtrair.'],
  ['ordenado', 'Ordenado pelo valor', 'Tocar no título de uma coluna ordena dentro de cada faixa; outra vez inverte, a terceira tira.'],
  ['faixas-fechadas', 'Faixas fechadas', 'Cada faixa fecha-se e fica só o resumo do cliente.'],
  ['sem-vendas', 'Artigo sem vendas', 'Um artigo novo na tabela: diz que ainda não se vendeu.'],
  ['sem-vendas-filtros', 'Sem linhas com estes filtros', 'Os filtros deixam zero: «Todo o ano, sem filtros».'],
  ['a-carregar', 'A ler as vendas', 'A grelha em esqueleto; a pesquisa já serve.'],
  ['a-atualizar', 'A atualizar (F9)', 'As linhas ficam à vista, esbatidas, até chegar a resposta.'],
  ['exportado', 'Exportado para Excel', 'As linhas com o nome do cliente (ou a descrição) numa coluna à parte, e o total.'],
  ['imprimir', 'Imprimir (F11)', 'O título, o artigo, o período, as faixas e o total.'],
  ['servidor', 'Servidor indisponível', 'O servidor das vendas não respondeu: Tentar outra vez.'],
  ['offline', 'Sem ligação', 'Sem rede: a pesquisa e os filtros ficam.'],
  ['sessao', 'Sessão terminada', 'Voltar a entrar pelo login comum.'],
  ['permissao', 'Sem permissão', 'O perfil não tem acesso aos mapas de Stocks.'],
  ['restaurado', 'Área de trabalho reposta', 'Ao voltar: a visualização, o artigo e os filtros como estavam.'],
];
export type IdMapaAc = 'stocks-mapa-artigos-clientes' | `mac-${string}`;
export function ecrasMapaArtigosClientes(): Ecra<IdErp>[] {
  const v = (cen: string) => ({ id: 'v1', nota: NOTA, html: html(cen) });
  return [
    { id: 'stocks-mapa-artigos-clientes', nome: '75 · Artigos/clientes', fluxo: 'Stocks', objetivo: 'Quem comprou um artigo, ou o que comprou um cliente: as linhas de venda, por faixas, com os Somatórios.', versoes: [v('inicial')] as Ecra<IdErp>['versoes'] },
    ...ESTADOS.map(([cen, nome, objetivo], i) => ({ id: `mac-${cen}` as IdErp, nome: `75.${i + 1} · ${nome}`, fluxo: 'Stocks', estadoDe: 'stocks-mapa-artigos-clientes' as IdErp, objetivo, versoes: [v(cen)] as Ecra<IdErp>['versoes'] })),
  ] as Ecra<IdErp>[];
}
