/* =========================================================
   GOPARTS — o Catálogo v5 (13 out. 2026): Modelos e Veículos com as animações
   da proposta que ela colou («diferentes, mas consistentes; sem brilhos,
   sombras ou movimentos exagerados»):
   - Marca → Modelos → Veículos: o conteúdo desliza 20 px e aparece (280 ms);
     o cabeçalho e os menus não se mexem (catalogo-v3.ts, ir);
   - linhas: entram com 25 ms entre si, só as 8 primeiras (180 ms; CSS);
   - procura e filtros: as linhas que saem desvanecem (180 ms) e as outras
     ocupam o espaço a deslizar (FLIP, só transform);
   - filtros progressivos: cada lista só oferece o que ainda existe com os
     outros filtros, e a que mudou pisca de opacidade (180 ms);
   - escolher um veículo: fundo, borda azul ao lado e «Selecionado» (180 ms);
     abre por baixo o painel com os dados do motor e «Encontrar peças
     compatíveis». A proposta pedia «Height + fade»; animar a altura mexe a
     página (e ela não quer), por isso o painel desvanece e desce 6 px;
   - ordenar por Ano, kW, cv ou cc: as linhas deslizam para o sítio (220 ms).
   ========================================================= */
import { linhasVeiculos5, veiculosDe, REFERENCIAS, linhaReferencia, fabricantesDe, euros, fichaDe, equivalentes, type Referencia } from '../portal/catalogo-dados';
import cart from 'lucide-static/icons/shopping-cart.svg?raw';
import copy from 'lucide-static/icons/copy.svg?raw';
import star from 'lucide-static/icons/star.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import download from 'lucide-static/icons/download.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import replace from 'lucide-static/icons/replace.svg?raw';
import badgeCheck from 'lucide-static/icons/badge-check.svg?raw';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import { ir } from './catalogo-v3';
import pkg from 'lucide-static/icons/package.svg?raw';
import boxes from 'lucide-static/icons/boxes.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import minus from 'lucide-static/icons/minus.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import globe from 'lucide-static/icons/globe.svg?raw';
import bosch from 'simple-icons/icons/bosch.svg?raw';
import { L } from '../portal/catalogo-v3';
import info from 'lucide-static/icons/info.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => Array.from(r.querySelectorAll<T>(s));
const FACIL = 'cubic-bezier(.2, .8, .2, 1)';
export const eV5 = (main: Element) => main.classList.contains('cat5');

/** A linha e o seu painel de detalhes, juntos. */
const par = (l: HTMLElement) => [l, l.nextElementSibling as HTMLElement].filter((x) => x && (x === l || x.classList.contains('cat5__detalhe')));

export function encherVeiculos5(main: HTMLElement, marca: string, modelo: string): void {
  const vista = main.querySelector<HTMLElement>('.cat3__vista[data-so="veiculos"]')!;
  vista.querySelector('tbody')!.innerHTML = linhasVeiculos5(marca, modelo, { info: L(info), visto: L(circleCheck), seta: L(arrowRight, 'btn__icone') });
  $$(vista, 'th[aria-sort]').forEach((th) => th.setAttribute('aria-sort', 'none'));
  main.querySelector('.cat5__t-marca')!.textContent = marca;
  main.querySelector('.cat5__t-modelo')!.textContent = modelo;
  main.querySelector('.cat5__m-marca')!.textContent = marca;
  main.querySelector('.cat5__m-modelo')!.textContent = modelo;
  const m = main.querySelector<HTMLElement>(`.cat2__marca[data-nome="${CSS.escape(marca)}"] .cat2__logo`);
  main.querySelector('.cat5__logo')!.innerHTML = m ? m.outerHTML : '';
  $$<HTMLSelectElement>(main, '.cat5__cartao[data-so="veiculos"] select[data-filtro]').forEach((s) => { s.value = ''; });
  progressivo(main, false);
  if (!veiculosDe(marca, modelo).length) vista.querySelector('tbody')!.innerHTML = '<tr class="cat3__sem"><td colspan="10">Ainda não há veículos de exemplo para este modelo.</td></tr>';
}

/** Filtros progressivos: cada lista mostra só os valores que ainda existem com os outros filtros. */
export function progressivo(main: HTMLElement, animar = true): void {
  const cartao = main.querySelector<HTMLElement>('.cat5__cartao[data-so="veiculos"]');
  if (!cartao) return;
  const linhas = $$(main, '.cat3__vista[data-so="veiculos"] tbody .cat3__linha');
  const sels = $$<HTMLSelectElement>(cartao, 'select[data-filtro]');
  const valor = (k: string) => sels.find((s) => s.dataset.filtro === k)?.value || '';
  const passa = (l: HTMLElement, sem: string) => sels.every((s) => {
    const k = s.dataset.filtro!, v = s.value;
    if (k === sem || !v) return true;
    if (k === 'ano') return Number(l.dataset.desde) <= Number(v) && Number(v) <= Number(l.dataset.ate);
    return (l.dataset[k] || '') === v;
  });
  sels.forEach((s) => {
    const k = s.dataset.filtro!;
    const ficam = linhas.filter((l) => passa(l, k));
    let vals: (string | number)[];
    if (k === 'ano') {
      const anos = new Set<number>();
      ficam.forEach((l) => { for (let a = Number(l.dataset.desde); a <= Number(l.dataset.ate); a++) anos.add(a); });
      vals = Array.from(anos).sort((a, b) => b - a);
    } else {
      vals = Array.from(new Set(ficam.map((l) => l.dataset[k] || ''))).sort((a, b) => (isNaN(+a) ? a.localeCompare(b, 'pt') : +a - +b));
    }
    const atual = valor(k);
    const html = `<option value="">${s.dataset.vazio || 'Todos'}</option>` + vals.map((v) => `<option value="${v}"${String(v) === atual ? ' selected' : ''}>${v}</option>`).join('');
    if (s.innerHTML === html) return;
    s.innerHTML = html;
    if (animar && !quieto()) s.closest('.campo')?.animate([{ opacity: .45 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
  });
}

/** Mostra e esconde linhas: as que saem desvanecem, as que ficam deslizam para o sítio. */
export function aplicar(tabela: HTMLElement, ver: Map<HTMLElement, boolean>, depois: () => void): void {
  /* qualquer filtro fecha os detalhes abertos */
  $$(tabela, '.cat5__detalhe:not([hidden])').forEach((d) => { d.hidden = true; });
  $$(tabela, '.cat5__info[aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  const saem = Array.from(ver).filter(([l, v]) => !v && !l.hidden).map(([l]) => l);
  const entram = Array.from(ver).filter(([l, v]) => v && l.hidden).map(([l]) => l);
  const acabar = () => {
    const antes = new Map(Array.from(ver.keys()).filter((l) => !l.hidden).map((l) => [l, l.getBoundingClientRect()]));
    ver.forEach((v, l) => { l.hidden = !v; l.style.opacity = ''; });
    depois();
    if (quieto()) return;
    ver.forEach((v, l) => {
      if (!v || l.classList.contains('is-fora')) return;
      const a = antes.get(l);
      if (a === undefined) { l.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' }); return; }
      /* (14 out.) em 2D: nos cartões dos modelos as linhas mudam também de coluna */
      const d = l.getBoundingClientRect(), dx = a.left - d.left, dy = a.top - d.top;
      if (dx || dy) l.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 240, easing: FACIL });
    });
  };
  if (quieto() || !saem.length) { acabar(); return; }
  saem.forEach((l) => l.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).onfinish = null);
  window.setTimeout(() => { saem.forEach((l) => l.getAnimations().forEach((x) => x.cancel())); acabar(); }, 180);
  void entram;
}

/** «Resultados por página»: as linhas a mais escondem-se (a contagem é a de todas). */
export function paginar(vista: HTMLElement): void {
  const n = Number(vista.querySelector<HTMLSelectElement>('[data-por-pagina]')?.value || 0);
  if (!n) return;
  $$(vista, 'tbody .cat3__linha:not([hidden])').forEach((l, i) => l.classList.toggle('is-fora', i >= n));
}

/** Abre (ou fecha) o painel de detalhes de uma linha; os outros fecham. */
function detalhe(linha: HTMLElement, abrir?: boolean): void {
  const d = linha.nextElementSibling as HTMLElement | null;
  if (!d || !d.classList.contains('cat5__detalhe')) return;
  const sim = abrir ?? d.hidden;
  $$(linha.closest('tbody')!, '.cat5__detalhe').forEach((x) => { if (x !== d) x.hidden = true; });
  $$(linha.closest('tbody')!, '.cat5__info').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  d.hidden = !sim;
  linha.querySelector('.cat5__info')?.setAttribute('aria-expanded', String(sim));
  if (sim && !quieto()) d.querySelector('.cat5__painel')?.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 250, easing: FACIL });
}

function escolher(linha: HTMLElement): void {
  const main = linha.closest<HTMLElement>('.cat5');
  if (main) main.dataset.versao = linha.dataset.versao || '';
  $$(linha.closest('tbody')!, '.cat3__linha[aria-selected]').forEach((l) => l.removeAttribute('aria-selected'));
  linha.setAttribute('aria-selected', 'true');
  detalhe(linha, true);
}

/** Ordena pela coluna (Ano, kW, cv, cc); outro clique inverte. As linhas deslizam para o sítio. */
function ordenar(botao: HTMLElement): void {
  const th = botao.closest('th')!;
  const k = botao.dataset.ordenar!;
  const sobe = th.getAttribute('aria-sort') !== 'ascending';
  $$(th.closest('tr')!, 'th[aria-sort]').forEach((x) => x.setAttribute('aria-sort', 'none'));
  th.setAttribute('aria-sort', sobe ? 'ascending' : 'descending');
  const corpo = th.closest('table')!.querySelector('tbody')!;
  const linhas = $$(corpo, '.cat3__linha');
  const antes = new Map(linhas.map((l) => [l, l.getBoundingClientRect().top]));
  const val = (l: HTMLElement) => Number(k === 'ano' ? l.dataset.desde : l.dataset[k]);
  linhas.sort((a, b) => (sobe ? 1 : -1) * (val(a) - val(b)));
  linhas.forEach((l) => par(l).forEach((x) => corpo.appendChild(x)));
  paginar(corpo.closest<HTMLElement>('.cat3__vista')!);
  if (quieto()) return;
  linhas.forEach((l) => {
    const dy = antes.get(l)! - l.getBoundingClientRect().top;
    if (dy && !l.hidden) l.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 220, easing: FACIL });
  });
}

/* =========================================================
   O menu dos passos (13 out.): a linha de sempre, Marcas … Universal; os
   passos acendem-se à medida que há o que mostrar.
   ========================================================= */
type VistaV5 = 'marcas' | 'modelos' | 'veiculos' | 'grupos' | 'referencias' | 'detalhes' | 'universal';
export function fluxo(main: HTMLElement, vista: VistaV5): void {
  const nav = (main.closest('.portal') || document).querySelector<HTMLElement>('.cat5__fluxo');
  if (!nav) return;
  /* a linha de sempre: cada passo acende-se quando há o que mostrar; o Grupo montagem não está desenhado */
  /* (14 out.) o Grupo montagem passa a existir: os grupos do veículo escolhido */
  const pode: Record<string, boolean> = { 0: true, 1: !!main.dataset.marca, 2: !!main.dataset.modelo, 3: !!main.dataset.versao, 4: !!main.dataset.refs, 5: !!main.dataset.ref, 6: true };
  const atual = { marcas: 0, modelos: 1, veiculos: 2, grupos: 3, referencias: 4, detalhes: 5, universal: 6 }[vista];
  /* a comparação só fica aberta nas Referências e nos Detalhes */
  if (vista !== 'referencias' && vista !== 'detalhes') { const c = main.querySelector<HTMLElement>('.cat5__comparacao'); if (c) c.hidden = true; }
  /* nos Modelos e nos Veículos, a barra de cima é a da marca e do modelo (podia ter ficado a do Universal) */
  if (vista === 'modelos' || vista === 'veiculos' || vista === 'grupos') {
    const modelo = vista === 'veiculos' ? main.dataset.modelo || '' : vista === 'grupos' ? `${main.dataset.modelo || ''} ${main.dataset.versao || ''}`.trim() : '';
    const tMarca = main.querySelector<HTMLElement>('.cat5__t-marca');
    if (tMarca) { tMarca.textContent = main.dataset.marca || ''; tMarca.dataset.irVista = vista === 'grupos' ? 'veiculos' : vista === 'veiculos' ? 'modelos' : 'marcas'; }
    const tModelo = main.querySelector<HTMLElement>('.cat5__t-modelo');
    if (tModelo) tModelo.textContent = modelo;
    const direita = main.querySelector<HTMLElement>('.cat5__marca');
    if (direita) direita.hidden = false;
    const mMarca = main.querySelector('.cat5__m-marca'), mModelo = main.querySelector('.cat5__m-modelo');
    if (mMarca) mMarca.textContent = main.dataset.marca || '';
    if (mModelo) mModelo.textContent = modelo;
    const logo = main.querySelector<HTMLElement>(`.cat2__marca[data-nome="${CSS.escape(main.dataset.marca || '')}"] .cat2__logo`);
    const onde = main.querySelector('.cat5__logo');
    if (onde && logo) onde.innerHTML = logo.outerHTML;
  }
  $$<HTMLButtonElement>(nav, '.cat2__passo').forEach((b) => {
    const n = Number(b.dataset.passo);
    if (n === atual) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    b.disabled = !pode[n];
  });
}

/** Um clique num passo do menu. */
function cliqueFluxo(main: HTMLElement, t: Element): boolean {
  if (!t.closest('.cat5__fluxo')) return false;
  const p = t.closest<HTMLButtonElement>('.cat2__passo');
  const vista = ({ 0: 'marcas', 1: 'modelos', 2: 'veiculos', 3: 'grupos', 4: 'referencias', 5: 'detalhes', 6: 'universal' } as const)[Number(p?.dataset.passo) as 0 | 1 | 2 | 3 | 4 | 5 | 6];
  if (p && !p.disabled && vista) ir(main, vista);
  return true;
}

/** Os cliques só da v5. Devolve true se tratou o clique. */
export function clique(main: HTMLElement, t: Element): boolean {
  if (!eV5(main)) return false;
  if (cliqueFluxo(main, t)) return true;
  if (t.closest('.cat5__comparar')) { comparar(main); return true; }
  if (t.closest('.cat5__cmp-fechar')) { main.querySelector<HTMLElement>('.cat5__comparacao')!.hidden = true; return true; }
  const tirar = t.closest<HTMLElement>('.cat5__cmp-tirar');
  if (tirar) { marcarComparar(main, tirar.dataset.tirar || '', false); return true; }
  /* as caixas «Comparar» tratam-se no «change» */
  if (t.closest('.cat5__marcar, .cat5__peca-comparar')) return true;
  const i = t.closest<HTMLElement>('.cat5__info');
  if (i) { detalhe(i.closest<HTMLElement>('.cat3__linha')!); return true; }
  const o = t.closest<HTMLElement>('[data-ordenar]');
  if (o) { ordenar(o); return true; }
  const m = t.closest<HTMLElement>('.cat5__modo');
  if (m) {
    $$(m.parentElement!, '.cat5__modo').forEach((b) => b.setAttribute('aria-pressed', String(b === m)));
    const vista = m.closest<HTMLElement>('.cat5__resultados')!;
    vista.dataset.modo = m.dataset.modo;
    if (!quieto()) vista.querySelector('.cat5__tabela')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
    return true;
  }
  if (t.closest('.cat5__pecas')) {
    /* (14 out.) «Encontrar peças compatíveis» abre o Grupo montagem do veículo: a árvore do Universal, com o
       veículo na barra de cima; escolhido o grupo e o fabricante, as Referências são as do veículo */
    ir(main, 'grupos');
    return true;
  }
  if (cliquePedir(t) || cliqueDetalhes(main, t) || cliqueReferencias(main, t) || cliqueUniversal(main, t)) return true;
  if (t.closest('.cat5__detalhe')) return true;
  const l = t.closest<HTMLElement>('.cat3__linha');
  if (l && !l.dataset.modelo) { escolher(l); return false; /* o v3 marca o passo seguinte */ }
  return false;
}

/* =========================================================
   Referências (13 out., a quarta imagem): as peças do veículo ou do grupo.
   Etiquetas de fabricante, grupo, agrupar, ver próprias, ordenar por preço
   ou stock e comparar as marcadas; só em tabela. A tabela refaz-se a cada
   filtro (são poucas linhas) e as linhas entram em cascata, só as 8 primeiras.
   ========================================================= */
const ICONES_REF = () => ({ imagem: L(pkg), caixa: L(boxes), pedir: `<span class="cat5__pedir-linha">${quantidade()}<button type="button" class="btn btn--acao btn--sm cat5__adicionar">${L(cart, 'btn__icone')}<span class="btn__rotulo">Pedir</span></button></span>` });
let ordemRef: { k: string; sobe: boolean } | null = null;

function chips(main: HTMLElement): string[] {
  return $$(main, '.cat5__chip').map((c) => c.dataset.fabricante || '');
}
function porChips(main: HTMLElement, fabs: string[]): void {
  main.querySelector('.cat5__chips-lista')!.innerHTML = fabs.map((f) => `<button type="button" class="cat5__chip" data-fabricante="${f}" aria-label="Tirar ${f}">${f}${L(x)}</button>`).join('');
}

export function abrirReferencias(main: HTMLElement, grupo: string, fabs: string[], origem: 'veiculo' | 'universal'): void {
  main.dataset.refs = origem;
  porChips(main, fabs);
  const g = main.querySelector<HTMLSelectElement>('[data-ref-grupo]')!;
  if (grupo && !Array.from(g.options).some((o) => o.value === grupo)) g.insertAdjacentHTML('beforeend', `<option>${grupo}</option>`);
  g.value = grupo;
  g.dispatchEvent(new Event('change'));
  ordemRef = null;
  /* a barra de cima: o veículo, ou «Universal» e o grupo */
  const tMarca = main.querySelector<HTMLElement>('.cat5__t-marca')!;
  const tModelo = main.querySelector<HTMLElement>('.cat5__t-modelo')!;
  const direita = main.querySelector<HTMLElement>('.cat5__marca')!;
  delete main.dataset.ref;
  if (origem === 'universal') {
    tMarca.textContent = 'Universal'; tMarca.dataset.irVista = 'universal';
    tModelo.textContent = grupo || 'Todos os grupos';
    direita.hidden = true;
  } else {
    tMarca.textContent = main.dataset.marca || ''; tMarca.dataset.irVista = 'veiculos';
    tModelo.textContent = `${main.dataset.modelo || ''} ${main.dataset.versao || ''}`.trim();
    direita.hidden = false;
  }
  main.dataset.barra = tModelo.textContent || '';
  desenharRefs(main);
}

function desenharRefs(main: HTMLElement): void {
  const vista = main.querySelector<HTMLElement>('.cat5__refs')!;
  const fabs = chips(main);
  const grupo = main.querySelector<HTMLSelectElement>('[data-ref-grupo]')!.value;
  const agrupar = main.querySelector<HTMLSelectElement>('[data-agrupar]')!.value as '' | 'fabricante' | 'grupo';
  const proprias = main.querySelector('.cat5__proprias')!.getAttribute('aria-pressed') === 'true';
  let rs: Referencia[] = REFERENCIAS.filter((r) => (!fabs.length || fabs.includes(r[1])) && (!grupo || r[0] === grupo) && (!proprias || r[6] + r[7] > 0));
  if (ordemRef) {
    const o = ordemRef;
    const v = (r: Referencia) => (o.k === 'preco' ? r[4] * (1 - r[5] / 100) : r[6] + r[7]);
    rs = rs.slice().sort((a, b) => (o.sobe ? 1 : -1) * (v(a) - v(b)));
  }
  let html = '';
  if (agrupar) {
    const k = agrupar === 'fabricante' ? 1 : 0;
    const chaves = Array.from(new Set(rs.map((r) => r[k]))).sort((a, b) => a.localeCompare(b, 'pt'));
    let i = 0;
    chaves.forEach((c) => {
      const destes = rs.filter((r) => r[k] === c);
      html += `<tr class="cat5__grupo-linha"><th colspan="9" scope="colgroup">${c}<span>${destes.length}</span></th></tr>` + destes.map((r) => linhaReferencia(r, i++, ICONES_REF())).join('');
    });
  } else html = rs.map((r, i) => linhaReferencia(r, i, ICONES_REF())).join('');
  vista.querySelector('tbody')!.innerHTML = html;
  /* a contagem diz se há filtro de fabricante e quantas há sem ele */
  const semFab = REFERENCIAS.filter((r) => (!grupo || r[0] === grupo) && (!proprias || r[6] + r[7] > 0));
  const nFab = new Set(rs.map((r) => r[1])).size;
  vista.querySelector('.cat5__refs-conta')!.innerHTML = fabs.length
    ? `<strong>${rs.length}</strong> de ${semFab.length} referências · ${fabs.join(', ')} <button type="button" class="cat3__ligacao cat5__refs-todos">Ver todos os fabricantes</button>`
    : `<strong>${rs.length}</strong> referências · ${nFab} ${nFab === 1 ? 'fabricante' : 'fabricantes'}`;
  vista.querySelector<HTMLElement>('.cat5__refs-vazio')!.hidden = rs.length > 0;
  /* as opções do «Adicionar fabricante» são as que ainda não estão escolhidas */
  $$<HTMLOptionElement>(main, '[data-mais-fabricante] option').forEach((o) => {
    if (!o.value) return;
    const n = semFab.filter((r) => r[1] === o.value).length;
    o.textContent = `${o.value} (${n})`;
    o.disabled = fabs.includes(o.value) || n === 0;
  });
  contarComparar(main);
}

/* ---------- Comparar (13 out.: «se eu selecionar ali o SKF, ali em cima aparece comparar») ----------
   Uma só lista por catálogo: marca-se a peça nas Referências, nos Detalhes ou nas
   Equivalências, e «Comparar (n)» aparece na barra de cima, em qualquer passo.
   Com duas ou mais, abre a comparação por baixo da barra. */
const aComparar = new WeakMap<HTMLElement, string[]>();
const chave = (fab: string, ref: string) => `${fab}|${ref}`;
const lista = (main: HTMLElement) => aComparar.get(main) || [];

export function marcarComparar(main: HTMLElement, k: string, sim: boolean): void {
  const l = lista(main).filter((x) => x !== k);
  if (sim) l.push(k);
  aComparar.set(main, l);
  contarComparar(main);
}

/** Acerta as caixas à vista com a lista, e o botão da barra. */
export function contarComparar(main: HTMLElement): void {
  const l = lista(main);
  $$<HTMLInputElement>(main, 'input[data-comparar]').forEach((c) => {
    c.checked = l.includes(c.dataset.comparar || '');
    c.closest('.cat5__ref')?.classList.toggle('is-marcada', c.checked);
  });
  const todas = main.querySelector<HTMLInputElement>('.cat5__todas');
  const visiveis = $$<HTMLInputElement>(main, '.cat5__refs tbody input[data-comparar]');
  if (todas) todas.checked = visiveis.length > 0 && visiveis.every((c) => c.checked);
  const b = main.querySelector<HTMLButtonElement>('.cat5__comparar')!;
  const antes = b.hidden;
  b.hidden = l.length === 0;
  b.disabled = l.length < 2;
  b.dataset.dica = l.length < 2 ? 'Marque mais uma peça para comparar' : 'Comparar as peças marcadas';
  main.querySelector('.cat5__n-comparar')!.textContent = String(l.length);
  if (antes && !b.hidden && !quieto() && b.isConnected) b.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
  /* a comparação aberta acompanha a lista; com menos de duas, fecha */
  const caixa = main.querySelector<HTMLElement>('.cat5__comparacao')!;
  if (!caixa.hidden) { if (l.length < 2) caixa.hidden = true; else desenharComparacao(main); }
}

function desenharComparacao(main: HTMLElement): void {
  const rs = lista(main).map((k) => REFERENCIAS.find((q) => chave(q[1], q[2]) === k)!).filter(Boolean);
  const barata = Math.min(...rs.map((r) => r[4] * (1 - r[5] / 100)));
  main.querySelector('.cat5__comparacao-grelha')!.innerHTML = rs.map((r) => {
    const liq = r[4] * (1 - r[5] / 100);
    return `<article class="cat5__cmp${liq === barata ? ' is-barata' : ''}"><button type="button" class="cat5__cmp-tirar" data-tirar="${chave(r[1], r[2])}" aria-label="Tirar ${r[1]} ${r[2]} da comparação">${L(x)}</button><p class="cat5__cmp-fab">${r[1]}</p><h4 class="cat5__cmp-ref">${r[2]}</h4><p class="cat5__cmp-desc">${r[3]}</p>`
      + `<dl><div><dt>Líquido</dt><dd>${euros(liq)}</dd></div><div><dt>Preço</dt><dd>${euros(r[4])} · −${r[5]}%</dd></div><div><dt>Stock</dt><dd>Porto ${r[6]} · Sacavém ${r[7]}</dd></div><div><dt>Grupo</dt><dd>${r[0]}</dd></div></dl>`
      + (liq === barata ? '<p class="cat5__cmp-nota">A mais barata</p>' : '') + '</article>';
  }).join('');
}

function comparar(main: HTMLElement): void {
  const caixa = main.querySelector<HTMLElement>('.cat5__comparacao')!;
  desenharComparacao(main);
  caixa.hidden = false;
  if (!quieto()) caixa.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 250, easing: FACIL });
  caixa.scrollIntoView({ behavior: quieto() ? 'auto' : 'smooth', block: 'nearest' });
}

function cliqueReferencias(main: HTMLElement, t: Element): boolean {
  const chip = t.closest<HTMLElement>('.cat5__chip');
  if (chip) {
    if (!quieto()) chip.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.9)' }], { duration: 150, easing: 'ease-in' }).onfinish = () => { chip.remove(); desenharRefs(main); };
    else { chip.remove(); desenharRefs(main); }
    return true;
  }
  if (t.closest('.cat5__proprias')) {
    const b = t.closest<HTMLElement>('.cat5__proprias')!;
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
    desenharRefs(main);
    return true;
  }
  const o = t.closest<HTMLElement>('[data-ordenar-ref]');
  if (o) {
    const k = o.dataset.ordenarRef!;
    const sobe = !(ordemRef && ordemRef.k === k && ordemRef.sobe);
    ordemRef = { k, sobe };
    $$(o.closest('tr')!, 'th[aria-sort]').forEach((th) => th.setAttribute('aria-sort', 'none'));
    o.closest('th')!.setAttribute('aria-sort', sobe ? 'ascending' : 'descending');
    desenharRefs(main);
    return true;
  }

  if (t.closest('.cat5__refs-todos')) { porChips(main, []); desenharRefs(main); return true; }
  if (t.closest('.cat5__refs-limpar')) {
    porChips(main, []);
    const g = main.querySelector<HTMLSelectElement>('[data-ref-grupo]')!;
    g.value = ''; g.dispatchEvent(new Event('change'));
    desenharRefs(main);
    return true;
  }
  /* as caixas de marcar tratam-se no «change» */
  if (t.closest('.cat5__marcar')) return true;
  /* a linha abre os Detalhes da referência */
  const linha = t.closest<HTMLElement>('.cat5__ref');
  if (linha) {
    abrirDetalhes(main, linha.dataset.fabricante || '', linha.dataset.ref || '');
    ir(main, 'detalhes');
    return true;
  }
  return false;
}

/* =========================================================
   Detalhes (13 out., a sexta imagem: o detalhe do GO REPAIR, melhorado).
   Em cima, a peça: fabricante, referência, descrição, ref. do fornecedor
   (copiar), substituída por, EAN e garantia; à direita, o preço com o
   desconto e o líquido, o stock e pedir (− 1 +, Adicionar, Minha lista).
   Por baixo, os separadores: Stock por armazém com o prazo, Equivalências
   (abrem o detalhe delas), OE, Veículos aplicáveis, Características e
   Documentos. A risca laranja desliza entre separadores; o conteúdo desvanece.
   ========================================================= */
const quantidade = (q = 1) => `<span class="cat5__qtd" role="group" aria-label="Quantidade"><button type="button" class="cat5__qtd-menos" aria-label="Menos um">${L(minus)}</button><input class="cat5__qtd-n" type="number" min="1" value="${q}" aria-label="Quantidade"><button type="button" class="cat5__qtd-mais" aria-label="Mais um">${L(plus)}</button></span>`;
const pastilha = (n: number) => `<span class="cat5__stock cat5__stock--${n === 0 ? 'sem' : n < 5 ? 'pouco' : 'ok'}">${L(boxes)}${n === 0 ? 'Sem stock' : `${n} un.`}</span>`;
const prazo = (n: number, porto: boolean) => (n === 0 ? 'Por encomenda · 3 a 5 dias úteis' : porto ? 'Hoje, se pedir até às 16h' : 'Amanhã de manhã');

export function abrirDetalhes(main: HTMLElement, fab: string, ref: string): void {
  const r = REFERENCIAS.find((q) => q[1] === fab && q[2] === ref);
  if (!r) return;
  const [grupo, , , desc, preco, d, porto, sacavem] = r;
  const f = fichaDe(r);
  const liq = preco * (1 - d / 100);
  main.dataset.ref = ref;
  main.querySelector('.cat5__t-modelo')!.textContent = `${main.dataset.barra || ''} / ${ref}`;
  main.querySelector('.cat5__peca')!.innerHTML = `
    <div class="cat5__peca-lado"><div class="cat5__peca-imagem" aria-hidden="true">${L(pkg)}</div>
      <label class="cat5__peca-comparar"><input type="checkbox" data-comparar="${fab}|${ref}">Comparar</label></div>
    <div class="cat5__peca-info">
      <p class="cat5__peca-fab">${fab}<span>${grupo}</span></p>
      <h1 class="cat5__peca-ref">${ref}</h1>
      <p class="cat5__peca-desc">${desc}</p>
      <dl class="cat5__peca-dados">
        <div><dt>Ref. do fornecedor</dt><dd>${fab}${ref.replace(/\s/g, '')}<button type="button" class="cat5__copiar" data-copiar="${fab}${ref.replace(/\s/g, '')}" aria-label="Copiar a referência">${L(copy)}</button></dd></div>
        <div><dt>Substituída por</dt><dd>${f.substituida ? `${L(replace)}${f.substituida}` : '—'}</dd></div>
        <div><dt>EAN</dt><dd>${L(scanBarcode)}${f.ean}</dd></div>
        <div><dt>Garantia</dt><dd>${L(badgeCheck)}${f.garantia}</dd></div>
      </dl>
    </div>
    <div class="cat5__peca-compra">
      <p class="cat5__peca-preco"><span class="cat5__riscado">${euros(preco)}</span><span class="cat5__menos">−${d}%</span></p>
      <p class="cat5__peca-liq">${euros(liq)}<span>líquido, sem IVA</span></p>
      <p class="cat5__peca-stock">${pastilha(porto + sacavem)}<span>Porto ${porto} · Sacavém ${sacavem}</span></p>
      <div class="cat5__peca-pedir">${quantidade()}<button type="button" class="btn btn--acao cat5__adicionar">${L(cart, 'btn__icone')}<span class="btn__rotulo">Adicionar ao carrinho</span></button></div>
      <button type="button" class="btn btn--ghost cat5__lista" aria-pressed="false">${L(star, 'btn__icone')}<span class="btn__rotulo">Adicionar à minha lista</span></button>
    </div>`;
  const corpo = (k: string) => main.querySelector<HTMLElement>(`[data-corpo="${k}"]`)!;
  const n = (k: string, v: number | string) => { main.querySelector(`.cat5__aba[data-aba="${k}"] .cat5__aba-n`)!.textContent = String(v); };
  /* Stock */
  corpo('stock').innerHTML = `<div class="cg-tabela erp-tabela cat5__tabela"><div class="erp-tabela__rolo"><table><thead><tr><th>Armazém</th><th>Stock</th><th>Entrega</th><th>Pedir</th></tr></thead><tbody>`
    + ([['Porto', porto, true], ['Sacavém', sacavem, false]] as [string, number, boolean][]).map(([a, q, p], i) => `<tr class="cat5__arm" style="--i:${i}"><td><strong>${a}</strong></td><td>${pastilha(q)}</td><td>${L(truck)}${prazo(q, p)}</td><td><span class="cat5__pedir-linha">${quantidade()}<button type="button" class="btn btn--ghost btn--sm cat5__adicionar"${q ? '' : ' disabled'}>${L(cart, 'btn__icone')}<span class="btn__rotulo">Pedir</span></button></span></td></tr>`).join('')
    + '</tbody></table></div></div>';
  /* Equivalências */
  const eq = equivalentes(r);
  n('equivalencias', eq.length || '');
  corpo('equivalencias').innerHTML = eq.length
    ? `<div class="cg-tabela erp-tabela cat5__tabela cat5__tabela-refs"><div class="erp-tabela__rolo"><table><thead><tr><th class="cat5__marcar"></th><th>Imagem</th><th>Referência</th><th>Descrição</th><th class="erp-num">Preço</th><th class="erp-num">Desc.</th><th class="erp-num">Líquido</th><th>Stock</th><th>Pedir</th></tr></thead><tbody>${eq.map((q, i) => linhaReferencia(q, i, ICONES_REF())).join('')}</tbody></table></div></div>`
    : '<p class="cat5__nada">Sem equivalências conhecidas para esta referência.</p>';
  /* OE */
  n('oe', f.oe.length || '');
  corpo('oe').innerHTML = f.oe.length ? `<ul class="cat5__oe">${f.oe.map((o) => `<li><span>BMW</span><strong>${o}</strong></li>`).join('')}</ul>` : '<p class="cat5__nada">Sem números de origem.</p>';
  /* Veículos aplicáveis: os do exemplo da BMW; o do cliente, se veio de um veículo, marcado */
  const vs = [...veiculosDe('BMW', '1 (E81)'), ...veiculosDe('BMW', '1 (E87)')].slice(0, 6);
  n('veiculos', vs.length);
  const seu = main.dataset.refs === 'veiculo' ? `${main.dataset.modelo} ${main.dataset.versao}` : '';
  corpo('veiculos').innerHTML = `<div class="cg-tabela erp-tabela cat5__tabela"><div class="erp-tabela__rolo"><table><thead><tr><th>Veículo</th><th>Ano</th><th class="erp-num">kW</th><th class="erp-num">cv</th><th>Motor</th></tr></thead><tbody>`
    + vs.map((v, i) => `<tr class="cat5__aplic${v.nome === seu ? ' is-seu' : ''}" style="--i:${i}"><td><strong>BMW ${v.nome}</strong>${v.nome === seu ? `<span class="cat5__escolhido">${L(check)}O seu veículo</span>` : ''}</td><td>${v.anos}</td><td class="erp-num">${v.kw}</td><td class="erp-num">${v.cv}</td><td>${v.motor}</td></tr>`).join('')
    + '</tbody></table></div></div>';
  /* Características e Documentos */
  corpo('caracteristicas').innerHTML = `<dl class="cat5__carac">${f.caracteristicas.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}<div><dt>Fabricante</dt><dd>${fab}</dd></div><div><dt>Grupo de montagem</dt><dd>${grupo}</dd></div></dl>`;
  n('documentos', f.documentos.length);
  corpo('documentos').innerHTML = `<ul class="cat5__docs">${f.documentos.map(([t, tam]) => `<li><span class="cat5__doc-icone" aria-hidden="true">${L(fileText)}</span><span class="cat5__doc-nome">${t}<small>${tam}</small></span><button type="button" class="btn btn--ghost btn--sm">${L(download, 'btn__icone')}<span class="btn__rotulo">Descarregar</span></button></li>`).join('')}</ul>`;
  aba(main, 'stock', false);
  contarComparar(main);
}

function aba(main: HTMLElement, k: string, animar = true): void {
  $$(main, '.cat5__aba').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.aba === k)));
  $$(main, '.cat5__aba-corpo').forEach((c) => { c.hidden = c.dataset.corpo !== k; });
  const c = main.querySelector<HTMLElement>(`[data-corpo="${k}"]`);
  if (animar && c && !quieto()) c.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: FACIL });
}

/** A quantidade (− 1 +) e o «Pedir» / «Adicionar ao carrinho», na ficha e nas linhas das tabelas. */
function cliquePedir(t: Element): boolean {
  const q = t.closest<HTMLElement>('.cat5__qtd-menos, .cat5__qtd-mais');
  if (q) {
    const i = q.parentElement!.querySelector<HTMLInputElement>('input')!;
    i.value = String(Math.max(1, Number(i.value || 1) + (q.classList.contains('cat5__qtd-mais') ? 1 : -1)));
    return true;
  }
  const ad = t.closest<HTMLButtonElement>('.cat5__adicionar');
  if (ad) {
    /* a confirmação fica 1,5 s no próprio botão; não há carrinho desenhado */
    if (ad.classList.contains('is-feito')) return true;
    const antes = ad.innerHTML;
    ad.classList.add('is-feito');
    ad.innerHTML = `${L(check, 'btn__icone')}<span class="btn__rotulo">Adicionado</span>`;
    window.setTimeout(() => { ad.classList.remove('is-feito'); ad.innerHTML = antes; }, 1500);
    return true;
  }
  /* o resto da célula «Pedir» (o campo da quantidade, a linha «Porto · hoje») não abre a ficha */
  return !!t.closest('.cat5__pedir-ref');
}

function cliqueDetalhes(main: HTMLElement, t: Element): boolean {
  if (!t.closest('.cat5__peca, .cat5__detalhes')) return false;
  const a = t.closest<HTMLElement>('.cat5__aba');
  if (a) { aba(main, a.dataset.aba || 'stock'); return true; }
  const li = t.closest<HTMLElement>('.cat5__lista');
  if (li) {
    const sim = li.getAttribute('aria-pressed') !== 'true';
    li.setAttribute('aria-pressed', String(sim));
    li.querySelector('.btn__rotulo')!.textContent = sim ? 'Na minha lista' : 'Adicionar à minha lista';
    return true;
  }
  const cp = t.closest<HTMLElement>('.cat5__copiar');
  if (cp) {
    navigator.clipboard?.writeText(cp.dataset.copiar || '').catch(() => undefined);
    cp.innerHTML = L(check); cp.classList.add('is-feito');
    window.setTimeout(() => { cp.innerHTML = L(copy); cp.classList.remove('is-feito'); }, 1200);
    return true;
  }
  /* uma equivalência abre o seu próprio detalhe, a desvanecer */
  const eq = t.closest<HTMLElement>('.cat5__detalhes .cat5__ref');
  if (eq) {
    abrirDetalhes(main, eq.dataset.fabricante || '', eq.dataset.ref || '');
    if (!quieto()) $$(main, '.cat5__peca, .cat5__detalhes').forEach((x) => x.animate([{ opacity: 0, transform: 'translateX(12px)' }, { opacity: 1, transform: 'none' }], { duration: 250, easing: FACIL }));
    return true;
  }
  return true;
}

/* =========================================================
   Universal (13 out., a quinta imagem; redesenhado pela do «pode ser»): os grupos
   de montagem sem veículo. Árvore (a seta roda ao abrir), Lista ou Colunas; a
   procura, dentro do painel, mostra só os grupos com aquele nome. Escolhido o
   grupo, à direita o caminho, o grupo em grande e os fabricantes em cartões:
   clicar num leva às referências dele. A árvore abre sem animar a altura: os
   grupos aparecem a desvanecer e a descer 4 px, em cascata curta.
   ========================================================= */
export function ramo(b: HTMLElement, abrir?: boolean): void {
  /* pelo ramo e não pelo id: os estados parados montam-se fora do documento */
  const ul = b.closest('.cat5__ramo')?.querySelector<HTMLElement>('.cat5__folhas');
  if (!ul) return;
  const sim = abrir ?? b.getAttribute('aria-expanded') !== 'true';
  b.setAttribute('aria-expanded', String(sim));
  ul.hidden = !sim;
  if (sim && !quieto() && ul.isConnected) $$(ul, 'li:not([hidden])').slice(0, 8).forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 180, delay: i * 25, easing: 'ease-out', fill: 'backwards' }));
}

/** O logótipo do fabricante: o do simple-icons, se houver (só a Bosch); senão, o nome escrito. */
const LOGOS: Record<string, string> = { Bosch: bosch.replace(/<title>[\s\S]*?<\/title>/, '') };
const logoFab = (f: string) => (f ? (LOGOS[f] ? L(LOGOS[f]) : `<span class="cat5__u-palavra">${f}</span>`) : L(globe));

export function escolherGrupo(main: HTMLElement, grupo: string): void {
  let cat = '';
  $$(main, '.cat5__universal .cat5__folha').forEach((f) => {
    if (f.dataset.grupo === grupo) { f.setAttribute('aria-current', 'true'); cat = f.dataset.cat || cat; } else f.removeAttribute('aria-current');
  });
  main.dataset.uGrupo = grupo;
  const lado = main.querySelector<HTMLElement>('.cat5__u-lado')!;
  const caminho = lado.querySelector<HTMLElement>('.cat5__u-caminho')!;
  caminho.hidden = false;
  caminho.querySelector('.cat5__u-cat')!.textContent = cat;
  caminho.querySelector('.cat5__u-grupo-c')!.textContent = grupo;
  lado.querySelector('.cat5__u-grupo')!.textContent = grupo;
  lado.querySelector('.cat5__u-sub')!.textContent = 'Clique no fabricante, ou em «Todos», para ver as referências.';
  lado.querySelector<HTMLElement>('.cat5__u-fab-caixa')!.hidden = false;
  /* ela, 13 out.: sem o botão «Ver referências» — o fabricante leva logo às referências */
  lado.querySelector('.cat5__u-fabricantes')!.innerHTML = ['', ...fabricantesDe(grupo)].map((f, i) =>
    `<li style="--i:${i}"><button type="button" class="cat5__u-fab" data-fabricante="${f}"><span class="cat5__u-logo" aria-hidden="true">${logoFab(f)}</span><span class="cat5__u-fab-nome">${f || 'Todos'}</span></button></li>`).join('');
  if (!quieto() && lado.isConnected) lado.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function procurarGrupo(main: HTMLElement): void {
  const termo = (main.querySelector<HTMLInputElement>('#' + CSS.escape('cat5-u-procura'))?.value || main.querySelector<HTMLInputElement>('.cat5__u-campo input')!.value).trim().toLowerCase();
  const caixa = main.querySelector<HTMLElement>('.cat5__u-grupos')!;
  let algum = false;
  /* (14 out.) o nome da categoria também conta (mostra os grupos todos dela), e o que corresponde fica destacado */
  const marcar = (el: Element | null, texto: string) => { if (!el) return; const i = termo ? texto.toLowerCase().indexOf(termo) : -1; el.innerHTML = i < 0 ? esc(texto) : `${esc(texto.slice(0, i))}<mark>${esc(texto.slice(i, i + termo.length))}</mark>${esc(texto.slice(i + termo.length))}`; };
  $$(caixa, '.cat5__ramo').forEach((r) => { const n = r.querySelector('.cat5__abrir-ramo > .cat5__folha-nome'); if (n) { const t = (n as HTMLElement).dataset.t ?? n.textContent ?? ''; (n as HTMLElement).dataset.t = t; marcar(n, t); } });
  $$(caixa, '.cat5__folha').forEach((f) => {
    const daCat = !!termo && (f.dataset.cat || '').toLowerCase().includes(termo);
    const ver = !termo || daCat || (f.dataset.grupo || '').toLowerCase().includes(termo);
    f.closest('li')!.hidden = !ver;
    marcar(f.querySelector('.cat5__folha-nome'), f.dataset.grupo || '');
    if (ver) algum = true;
  });
  /* na árvore: os ramos sem nada escondem-se; com procura, os que ficam abrem */
  $$(caixa, '.cat5__ramo').forEach((r) => {
    const tem = $$(r, '.cat5__folhas > li:not([hidden])').length > 0;
    r.hidden = !tem;
    ramo(r.querySelector<HTMLElement>('.cat5__abrir-ramo')!, !!termo && tem);
  });
  $$(caixa, '.cat5__col-cat').forEach((c) => {
    const ul = caixa.querySelector<HTMLElement>(`[data-de-cat="${c.dataset.cat}"]`)!;
    c.closest('li')!.hidden = !$$(ul, 'li:not([hidden])').length;
  });
  /* em Colunas, se a categoria aberta saiu da procura, abre a primeira que ficou */
  const aberta = caixa.querySelector<HTMLElement>('.cat5__col-cat[aria-current="true"]');
  if (aberta && aberta.closest('li')!.hidden) {
    const outra = $$(caixa, '.cat5__col-cat').find((c) => !c.closest('li')!.hidden);
    $$(caixa, '.cat5__col-cat').forEach((c) => { if (c === outra) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current'); });
    $$(caixa, '[data-de-cat]').forEach((u) => { u.hidden = !outra || u.dataset.deCat !== outra.dataset.cat; });
  }
  caixa.querySelector<HTMLElement>('.cat5__u-vazio')!.hidden = algum;
}

function cliqueUniversal(main: HTMLElement, t: Element): boolean {
  const forma = t.closest<HTMLElement>('.cat5__forma');
  if (forma) {
    $$(forma.parentElement!, '.cat5__forma').forEach((b) => { if (b === forma) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    $$(main, '[data-de-forma]').forEach((x) => { x.hidden = x.dataset.deForma !== forma.dataset.forma; });
    const nova = main.querySelector<HTMLElement>(`[data-de-forma="${forma.dataset.forma}"]`);
    if (nova && !quieto()) nova.animate([{ opacity: 0, transform: 'translateX(12px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: FACIL });
    return true;
  }
  const r = t.closest<HTMLElement>('.cat5__abrir-ramo');
  if (r) { ramo(r); return true; }
  const c = t.closest<HTMLElement>('.cat5__col-cat');
  if (c) {
    $$(c.closest('.cat5__colunas')!, '.cat5__col-cat').forEach((b) => { if (b === c) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    $$(main, '[data-de-cat]').forEach((u) => { u.hidden = u.dataset.deCat !== c.dataset.cat; });
    const u = main.querySelector<HTMLElement>(`[data-de-cat="${c.dataset.cat}"]`);
    if (u && !quieto()) u.animate([{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: FACIL });
    return true;
  }
  const f = t.closest<HTMLElement>('.cat5__universal .cat5__folha');
  if (f) { escolherGrupo(main, f.dataset.grupo || ''); return true; }
  const fab = t.closest<HTMLElement>('.cat5__u-fab');
  if (fab) {
    const f = fab.dataset.fabricante || '';
    abrirReferencias(main, main.dataset.uGrupo || '', f ? [f] : [], main.dataset.vista === 'grupos' ? 'veiculo' : 'universal');
    ir(main, 'referencias');
    return true;
  }
  /* o caminho da direita: a categoria abre na árvore */
  const uc = t.closest<HTMLElement>('.cat5__u-cat');
  if (uc) {
    main.querySelector<HTMLElement>('.cat5__forma[data-forma="arvore"]')?.click();
    const b = $$(main, '.cat5__abrir-ramo').find((x) => (x.textContent || '').trim() === (uc.textContent || '').trim());
    if (b) { ramo(b, true); b.scrollIntoView({ behavior: quieto() ? 'auto' : 'smooth', block: 'nearest' }); b.focus(); }
    return true;
  }
  if (t.closest('.cat5__u-limpar')) { main.querySelector<HTMLInputElement>('.cat5__u-campo input')!.value = ''; procurarGrupo(main); return true; }
  return false;
}

export function iniciar(): void {
  document.addEventListener('change', (ev) => {
    const s = ev.target as HTMLElement;
    if (document.body.classList.contains('editando')) return;
    const main = s.closest<HTMLElement>('.cat5');
    if (s.matches('[data-por-pagina]')) paginar(s.closest<HTMLElement>('.cat3__vista')!);
    else if (main && s.matches('[data-ref-grupo], [data-agrupar]')) desenharRefs(main);
    else if (main && s.matches('[data-mais-fabricante]')) {
      const v = (s as HTMLSelectElement).value;
      if (v && !chips(main).includes(v)) porChips(main, [...chips(main), v]);
      (s as HTMLSelectElement).value = '';
      desenharRefs(main);
      const novo = main.querySelector<HTMLElement>(`.cat5__chip[data-fabricante="${CSS.escape(v)}"]`);
      if (novo && !quieto()) novo.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
    } else if (main && s.matches('.cat5__todas')) {
      const sim = (s as HTMLInputElement).checked;
      $$<HTMLInputElement>(main, '.cat5__refs tbody input[data-comparar]').forEach((c) => marcarComparar(main, c.dataset.comparar || '', sim));
    } else if (main && s.matches('input[data-comparar]')) marcarComparar(main, s.dataset.comparar || '', (s as HTMLInputElement).checked);
  });
  /* a procura do Universal filtra enquanto se escreve, e Enter também */
  document.addEventListener('input', (ev) => {
    const i = ev.target as HTMLElement;
    if (document.body.classList.contains('editando') || !i.matches('.cat5__u-campo input')) return;
    procurarGrupo(i.closest<HTMLElement>('.cat5')!);
  });
}
