/* =========================================================
   GOPARTS — 11 · Catálogo: Cartões ou Tabela, e as imagens dos veículos (15 out. 2026)
   Ela, com a imagem dos Veículos: «aqui quero imagens também; em cada sítio com cards coloca a possibilidade
   com tabela, com esta abordagem» (a escolha Tabela / Lista e as colunas com ↑↓).
   - MARCAS e MODELOS: «Cartões | Tabela» ao lado do título. Na tabela, as colunas que se ordenam levam o ↑↓
     (Marca e Modelos; Modelo, Fabricado desde e Fabricado até). São os mesmos elementos em duas formas, por isso a
     procura, a estrela, as favoritas e os filtros continuam a valer nas duas. A escolha fica guardada neste
     browser.
   - VEÍCULOS: uma coluna com a silhueta da carroçaria (não há fotografias licenciadas; ver portal/carros.ts).
   As linhas deslizam para o sítio novo ao ordenar (só transform, 220 ms); com «reduzir movimento», trocam.
   ========================================================= */
import { L } from '../portal/catalogo-v3';
import { MODELOS } from '../portal/catalogo-dados';
import { silhueta } from '../portal/carros';
import arrowUpDown from 'lucide-static/icons/arrow-up-down.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import table from 'lucide-static/icons/table.svg?raw';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lido = (k: string) => { try { return localStorage.getItem(`goparts-ver-${k}`); } catch { return null; } };
const guardar = (k: string, v: string) => { try { localStorage.setItem(`goparts-ver-${k}`, v); } catch { /* sem armazenamento: fica só nesta visita */ } };

const botoesVer = (k: string) => `<div class="cat5__modos cat6__ver" role="group" aria-label="Ver como" data-ver-de="${k}">`
  + `<button type="button" class="cat5__modo" data-ver="cartoes" aria-pressed="true">${L(layoutGrid)}Cartões</button>`
  + `<button type="button" class="cat5__modo" data-ver="tabela" aria-pressed="false">${L(table)}Tabela</button></div>`;
const ordenador = (k: string, t: string) => `<button type="button" class="cat5__ordenar" data-ordenar6="${k}">${t}${L(arrowUpDown)}</button>`;

function aplicarVer(alvo: HTMLElement, botoes: HTMLElement, modo: string): void {
  alvo.dataset.ver = modo;
  botoes.querySelectorAll<HTMLElement>('[data-ver]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ver === modo)));
}

/* ---------- Marcas ---------- */
function marcas(main: HTMLElement): void {
  const sec = main.querySelector<HTMLElement>('.cat2__marcas'); if (!sec) return;
  const cab = sec.querySelector<HTMLElement>('.cat2__marcas-cabeca'), grelha = sec.querySelector<HTMLElement>('.cat2__grelha');
  if (!cab || !grelha) return;
  if (!cab.querySelector('.cat6__ver')) {
    cab.insertAdjacentHTML('beforeend', botoesVer('marcas'));
    aplicarVer(sec, cab.querySelector<HTMLElement>('.cat6__ver')!, lido('marcas') || 'tabela');
  }
  if (!sec.querySelector('.cat6__t-cabeca')) grelha.insertAdjacentHTML('beforebegin', `<div class="cat6__t-cabeca" data-so="marcas"${main.dataset.vista && main.dataset.vista !== 'marcas' ? ' hidden' : ''}><span data-ordem="none">${ordenador('nome', 'Marca')}</span><span data-ordem="none">${ordenador('modelos', 'Modelos')}</span><span>Favorita</span></div>`);
  grelha.querySelectorAll<HTMLElement>('li.cat2__marca').forEach((li) => {
    if (li.querySelector('.cat6__m-n')) return;
    const n = (MODELOS[li.dataset.nome || ''] || []).length;
    li.dataset.modelos = String(n);
    li.querySelector('.cat2__marca-botao')?.insertAdjacentHTML('beforeend', `<span class="cat6__m-n">${n ? `${n} ${n === 1 ? 'modelo' : 'modelos'}` : '—'}</span>`);
  });
}

/* ---------- Modelos ---------- */
function modelos(main: HTMLElement): void {
  const v = main.querySelector<HTMLElement>('.cat3__vista[data-so="modelos"]'); if (!v) return;
  const cab = v.querySelector<HTMLElement>('.cat4__cabeca');
  if (cab && !cab.querySelector('.cat6__ver')) {
    cab.insertAdjacentHTML('beforeend', botoesVer('modelos'));
    aplicarVer(v, cab.querySelector<HTMLElement>('.cat6__ver')!, lido('modelos') || 'tabela');
  }
  const tr = v.querySelector<HTMLElement>('thead tr');
  if (tr && !tr.querySelector('.cat6__th-foto')) {
    tr.insertAdjacentHTML('afterbegin', '<th class="cat6__th-foto">Imagem</th>');
    const th = Array.from(tr.children) as HTMLElement[];
    ([[1, 'nome', 'Modelo'], [3, 'desde', 'Fabricado desde'], [4, 'ate', 'Fabricado até']] as [number, string, string][]).forEach(([i, k, t]) => {
      if (!th[i]) return;
      th[i].setAttribute('aria-sort', 'none'); th[i].innerHTML = ordenador(k, t);
    });
  }
}

/* ---------- Veículos: a silhueta da carroçaria em cada linha ---------- */
function veiculos(main: HTMLElement): void {
  const v = main.querySelector<HTMLElement>('.cat5__resultados[data-so="veiculos"]'); if (!v) return;
  const tr = v.querySelector<HTMLElement>('thead tr');
  if (tr && !tr.querySelector('.cat6__th-foto')) tr.children[0]?.insertAdjacentHTML('afterend', '<th class="cat6__th-foto"><span class="sr-only">Imagem</span></th>');
  v.querySelectorAll<HTMLElement>('tbody tr.cat3__linha').forEach((l) => {
    if (l.querySelector('.cat6__v-foto')) return;
    const c = l.querySelector('td[data-r="Carroçaria"]')?.textContent?.trim() || '';
    l.children[0]?.insertAdjacentHTML('afterend', `<td class="cat6__v-foto" aria-hidden="true"><span class="cat6__carro">${silhueta(c)}</span></td>`);
  });
  v.querySelectorAll<HTMLElement>('tbody tr.cat5__detalhe > td[colspan="9"]').forEach((td) => td.setAttribute('colspan', '10'));
}

/** Ordena as marcas ou os modelos pela coluna; outro clique inverte. */
function ordenar(b: HTMLElement): void {
  const cel = b.parentElement as HTMLElement, k = b.dataset.ordenar6 || '';
  const sobe = (cel.getAttribute('aria-sort') || cel.dataset.ordem) !== 'ascending';
  cel.parentElement!.querySelectorAll<HTMLElement>('[aria-sort], [data-ordem]').forEach((x) => { if (x.hasAttribute('aria-sort')) x.setAttribute('aria-sort', 'none'); if (x.dataset.ordem) x.dataset.ordem = 'none'; });
  if (cel.tagName === 'TH') cel.setAttribute('aria-sort', sobe ? 'ascending' : 'descending'); else cel.dataset.ordem = sobe ? 'ascending' : 'descending';
  const daMarca = !!b.closest('.cat6__t-cabeca');
  const corpo = daMarca ? b.closest('.cat2__marcas')!.querySelector<HTMLElement>('.cat2__grelha')! : b.closest('table')!.querySelector('tbody')!;
  const linhas = Array.from(corpo.querySelectorAll<HTMLElement>(daMarca ? 'li.cat2__marca' : 'tr.cat3__linha'));
  const val = (l: HTMLElement): string | number => daMarca ? (k === 'nome' ? l.dataset.nome || '' : Number(l.dataset.modelos)) : k === 'nome' ? l.dataset.modelo || '' : Number(k === 'desde' ? l.dataset.mes : l.dataset.ate);
  const antes = new Map(linhas.map((l) => [l, l.getBoundingClientRect().top]));
  linhas.sort((a, c) => { const x = val(a), y = val(c); const d = typeof x === 'number' ? x - (y as number) : x.localeCompare(String(y), 'pt', { numeric: true }); return sobe ? d : -d; });
  linhas.forEach((l) => corpo.appendChild(l));
  const aviso = document.querySelector<HTMLElement>('.ecra:not([hidden]) .cat6__aviso');
  if (aviso) aviso.textContent = `Ordenado por ${b.textContent?.trim()}, ${sobe ? 'crescente' : 'decrescente'}.`;
  if (quieto()) return;
  linhas.forEach((l) => { const dy = antes.get(l)! - l.getBoundingClientRect().top; if (dy && !l.hidden) l.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2, .8, .2, 1)' }); });
}

/** «1 veículo encontrado», «2 veículos encontrados» (a contagem muda no comportamento da v3/v5). */
function plurais(main: HTMLElement): void {
  main.querySelectorAll<HTMLElement>('.cat3__conta').forEach((c) => {
    const n = Number(c.querySelector('strong')?.textContent), t = c.lastChild;
    if (!t || t.nodeType !== Node.TEXT_NODE || Number.isNaN(n)) return;
    const novo = (t.textContent || '').replace(/(veículo|modelo)s? (encontrado)s?/, (_, a, b) => n === 1 ? `${a} ${b}` : `${a}s ${b}s`);
    if (novo !== t.textContent) t.textContent = novo;
  });
}
export function decorarVistas(main: HTMLElement): void { marcas(main); modelos(main); veiculos(main); plurais(main); }

/** Os cliques desta camada (fase de captura, antes da v5). Devolve true se tratou o clique. */
export function cliqueVistas(t: Element): boolean {
  const o = t.closest<HTMLElement>('.cat6 [data-ordenar6]'); if (o) { ordenar(o); return true; }
  const b = t.closest<HTMLElement>('.cat6 .cat6__ver [data-ver]');
  if (b) {
    const grupo = b.closest<HTMLElement>('.cat6__ver')!, k = grupo.dataset.verDe || '';
    const alvo = (k === 'marcas' ? b.closest('.cat2__marcas') : b.closest('.cat3__vista')) as HTMLElement | null;
    if (!alvo || alvo.dataset.ver === b.dataset.ver) return true;
    aplicarVer(alvo, grupo, b.dataset.ver || 'cartoes'); guardar(k, b.dataset.ver || 'cartoes');
    if (!quieto()) (alvo.querySelector('.cat2__grelha, .cg-tabela') as HTMLElement | null)?.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    return true;
  }
  return false;
}
