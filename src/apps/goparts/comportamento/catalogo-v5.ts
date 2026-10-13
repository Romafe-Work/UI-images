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
import { linhasVeiculos5, veiculosDe, REFERENCIAS, linhaReferencia, fabricantesDe, euros, type Referencia } from '../portal/catalogo-dados';
import { ir } from './catalogo-v3';
import pkg from 'lucide-static/icons/package.svg?raw';
import boxes from 'lucide-static/icons/boxes.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import minus from 'lucide-static/icons/minus.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
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
  $$<HTMLSelectElement>(main, '.cat5__cartao select[data-filtro]').forEach((s) => { s.value = ''; });
  progressivo(main, false);
  if (!veiculosDe(marca, modelo).length) vista.querySelector('tbody')!.innerHTML = '<tr class="cat3__sem"><td colspan="10">Ainda não há veículos de exemplo para este modelo.</td></tr>';
}

/** Filtros progressivos: cada lista mostra só os valores que ainda existem com os outros filtros. */
export function progressivo(main: HTMLElement, animar = true): void {
  const cartao = main.querySelector<HTMLElement>('.cat5__cartao');
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
    const antes = new Map(Array.from(ver.keys()).filter((l) => !l.hidden).map((l) => [l, l.getBoundingClientRect().top]));
    ver.forEach((v, l) => { l.hidden = !v; l.style.opacity = ''; });
    depois();
    if (quieto()) return;
    ver.forEach((v, l) => {
      if (!v || l.classList.contains('is-fora')) return;
      const a = antes.get(l);
      if (a === undefined) { l.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' }); return; }
      const dy = a - l.getBoundingClientRect().top;
      if (dy) l.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 180, easing: FACIL });
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

/** Os cliques só da v5. Devolve true se tratou o clique. */
export function clique(main: HTMLElement, t: Element): boolean {
  if (!eV5(main)) return false;
  const i = t.closest<HTMLElement>('.cat5__info');
  if (i) { detalhe(i.closest<HTMLElement>('.cat3__linha')!); return true; }
  const o = t.closest<HTMLElement>('[data-ordenar]');
  if (o) { ordenar(o); return true; }
  const m = t.closest<HTMLElement>('.cat5__modo');
  if (m) {
    $$(m.parentElement!, '.cat5__modo').forEach((b) => b.setAttribute('aria-pressed', String(b === m)));
    /* o Tabela / Grelha das referências está no cartão de cima, não nos resultados */
    const vista = m.closest<HTMLElement>('.cat5__resultados') || main.querySelector<HTMLElement>('.cat5__refs')!;
    vista.dataset.modo = m.dataset.modo;
    if (!quieto()) vista.querySelector('.cat5__tabela')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
    return true;
  }
  if (t.closest('.cat5__pecas')) {
    /* o Grupo montagem ainda não está desenhado: vai-se às Referências do veículo, com a SKF */
    abrirReferencias(main, '', ['SKF'], 'veiculo');
    ir(main, 'referencias');
    return true;
  }
  if (cliqueReferencias(main, t) || cliqueUniversal(main, t)) return true;
  if (t.closest('.cat5__detalhe')) return true;
  const l = t.closest<HTMLElement>('.cat3__linha');
  if (l && !l.dataset.modelo) { escolher(l); return false; /* o v3 marca o passo seguinte */ }
  return false;
}

/* =========================================================
   Referências (13 out., a quarta imagem): as peças do veículo ou do grupo.
   Etiquetas de fabricante, grupo, agrupar, ver próprias, ordenar por preço
   ou stock, Tabela / Grelha e comparar as marcadas. A tabela refaz-se a cada
   filtro (são poucas linhas) e as linhas entram em cascata, só as 8 primeiras.
   ========================================================= */
const ICONES_REF = () => ({ imagem: L(pkg), caixa: L(boxes) });
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
  if (origem === 'universal') {
    tMarca.textContent = 'Universal'; tMarca.dataset.irVista = 'universal';
    tModelo.textContent = grupo || 'Todos os grupos';
    direita.hidden = true;
  } else {
    tMarca.textContent = main.dataset.marca || ''; tMarca.dataset.irVista = 'veiculos';
    tModelo.textContent = `${main.dataset.modelo || ''} ${main.dataset.versao || ''}`.trim();
    direita.hidden = false;
  }
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
      html += `<tr class="cat5__grupo-linha"><th colspan="8" scope="colgroup">${c}<span>${destes.length}</span></th></tr>` + destes.map((r) => linhaReferencia(r, i++, ICONES_REF())).join('');
    });
  } else html = rs.map((r, i) => linhaReferencia(r, i, ICONES_REF())).join('');
  vista.querySelector('tbody')!.innerHTML = html;
  vista.querySelector('.cat5__refs-conta strong')!.textContent = String(rs.length);
  vista.querySelector<HTMLElement>('.cat5__refs-vazio')!.hidden = rs.length > 0;
  vista.querySelector<HTMLInputElement>('.cat5__todas')!.checked = false;
  vista.querySelector<HTMLElement>('.cat5__comparacao')!.hidden = true;
  /* as opções do «Adicionar fabricante» são as que ainda não estão escolhidas */
  $$<HTMLOptionElement>(main, '[data-mais-fabricante] option').forEach((o) => { if (o.value) o.disabled = fabs.includes(o.value); });
  contarComparar(main);
}

function contarComparar(main: HTMLElement): void {
  const n = $$(main, '.cat5__refs tbody input[type="checkbox"]:checked').length;
  main.querySelector('.cat5__n-comparar')!.textContent = String(n);
  main.querySelector<HTMLButtonElement>('.cat5__comparar')!.disabled = n < 2;
  $$(main, '.cat5__refs tbody .cat5__ref').forEach((l) => l.classList.toggle('is-marcada', !!l.querySelector<HTMLInputElement>('input:checked')));
}

function comparar(main: HTMLElement): void {
  const linhas = $$(main, '.cat5__refs tbody .cat5__ref.is-marcada');
  const caixa = main.querySelector<HTMLElement>('.cat5__comparacao')!;
  const barata = Math.min(...linhas.map((l) => Number(l.dataset.preco)));
  caixa.querySelector('.cat5__comparacao-grelha')!.innerHTML = linhas.map((l) => {
    const r = REFERENCIAS.find((q) => q[2] === l.dataset.ref && q[1] === l.dataset.fabricante)!;
    const liq = r[4] * (1 - r[5] / 100);
    return `<article class="cat5__cmp${liq === barata ? ' is-barata' : ''}"><p class="cat5__cmp-fab">${r[1]}</p><h4 class="cat5__cmp-ref">${r[2]}</h4><p class="cat5__cmp-desc">${r[3]}</p>`
      + `<dl><div><dt>Líquido</dt><dd>${euros(liq)}</dd></div><div><dt>Preço</dt><dd>${euros(r[4])} · −${r[5]}%</dd></div><div><dt>Stock</dt><dd>Porto ${r[6]} · Sacavém ${r[7]}</dd></div></dl>`
      + (liq === barata ? '<p class="cat5__cmp-nota">A mais barata</p>' : '') + '</article>';
  }).join('');
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
  if (t.closest('.cat5__comparar')) { comparar(main); return true; }
  if (t.closest('.cat5__refs-limpar')) {
    porChips(main, []);
    const g = main.querySelector<HTMLSelectElement>('[data-ref-grupo]')!;
    g.value = ''; g.dispatchEvent(new Event('change'));
    desenharRefs(main);
    return true;
  }
  /* as caixas de marcar tratam-se no «change» */
  if (t.closest('.cat5__marcar')) return true;
  return false;
}

/* =========================================================
   Universal (13 out., a quinta imagem): os grupos de montagem sem veículo.
   Árvore (abre e fecha com + / −), Lista ou Colunas; a procura mostra só os
   grupos com aquele nome. Escolhido o grupo, à direita os fabricantes e
   «Ver referências». A árvore abre sem animar a altura: os grupos aparecem a
   desvanecer e a descer 4 px, em cascata curta.
   ========================================================= */
function ramo(b: HTMLElement, abrir?: boolean): void {
  const ul = document.getElementById(b.getAttribute('aria-controls') || '');
  if (!ul) return;
  const sim = abrir ?? b.getAttribute('aria-expanded') !== 'true';
  b.setAttribute('aria-expanded', String(sim));
  b.querySelector('.cat5__mais-menos')!.innerHTML = L(sim ? minus : plus);
  ul.hidden = !sim;
  if (sim && !quieto()) $$(ul, 'li:not([hidden])').slice(0, 8).forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 180, delay: i * 25, easing: 'ease-out', fill: 'backwards' }));
}

function escolherGrupo(main: HTMLElement, grupo: string): void {
  $$(main, '.cat5__universal .cat5__folha').forEach((f) => { if (f.dataset.grupo === grupo) f.setAttribute('aria-current', 'true'); else f.removeAttribute('aria-current'); });
  main.dataset.uGrupo = grupo;
  const lado = main.querySelector<HTMLElement>('.cat5__u-lado')!;
  lado.querySelector('.cat5__u-grupo')!.textContent = grupo;
  lado.querySelector('.cat5__u-sub')!.textContent = 'Escolha o fabricante, ou «Todos», e veja as referências.';
  lado.querySelector('.cat5__u-fabricantes')!.innerHTML = ['Todos', ...fabricantesDe(grupo)].map((f, i) =>
    `<li style="--i:${i}"><button type="button" class="cat5__u-fab" data-fabricante="${i ? f : ''}" aria-pressed="${i === 0}">${f}</button></li>`).join('');
  lado.querySelector<HTMLButtonElement>('.cat5__u-ver')!.disabled = false;
  if (!quieto()) lado.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
}

function procurarGrupo(main: HTMLElement): void {
  const termo = (main.querySelector<HTMLInputElement>('#' + CSS.escape('cat5-u-procura'))?.value || main.querySelector<HTMLInputElement>('.cat5__u-campo input')!.value).trim().toLowerCase();
  const caixa = main.querySelector<HTMLElement>('.cat5__u-grupos')!;
  let algum = false;
  $$(caixa, '.cat5__folha').forEach((f) => {
    const ver = !termo || (f.dataset.grupo || '').toLowerCase().includes(termo);
    f.closest('li')!.hidden = !ver;
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
  if (fab) { $$(main, '.cat5__u-fab').forEach((b) => b.setAttribute('aria-pressed', String(b === fab))); return true; }
  if (t.closest('.cat5__u-ver')) {
    const escolhido = main.querySelector<HTMLElement>('.cat5__u-fab[aria-pressed="true"]')?.dataset.fabricante || '';
    abrirReferencias(main, main.dataset.uGrupo || '', escolhido ? [escolhido] : [], 'universal');
    ir(main, 'referencias');
    return true;
  }
  if (t.closest('.cat5__u-pesquisar')) { procurarGrupo(main); return true; }
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
      $$<HTMLInputElement>(main, '.cat5__refs tbody input[type="checkbox"]').forEach((c) => { c.checked = (s as HTMLInputElement).checked; });
      contarComparar(main);
    } else if (main && s.matches('.cat5__refs tbody input[type="checkbox"]')) contarComparar(main);
  });
  /* a procura do Universal filtra enquanto se escreve, e Enter também */
  document.addEventListener('input', (ev) => {
    const i = ev.target as HTMLElement;
    if (document.body.classList.contains('editando') || !i.matches('.cat5__u-campo input')) return;
    procurarGrupo(i.closest<HTMLElement>('.cat5')!);
  });
}
