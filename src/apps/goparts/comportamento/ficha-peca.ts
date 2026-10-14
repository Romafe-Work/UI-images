/* =========================================================
   GOPARTS — 11 · Catálogo: a ficha da peça e os seis separadores (15 out. 2026)
   Do briefing dela («ROMAFE Product Details V4»). Por cima de abrirDetalhes (catalogo-v5.ts), que continua a
   escrever os dados; esta camada dá-lhes a forma nova sempre que a ficha se refaz:
   - A IMAGEM: sem fotografia, um lugar discreto («Sem fotografia») em vez do cubo grande.
   - OS SEPARADORES: a risca laranja desliza (catalogo-v6.ts); o conteúdo anterior desvanece (120 ms) e o novo
     entra com 8 px (220 ms); ← → Início Fim entre separadores. A altura não se anima (as regras dela: nada de
     animar a altura no fluxo); muda de uma vez.
   - OE: um diretório por fabricante do veículo, uma linha por número, com «Copiar» (o ícone passa a visto e
     diz «Copiado»). Sem «Pesquisar»: o protótipo não tem a procura por número de origem.
   - VEÍCULOS APLICÁVEIS: agrupados por modelo, com a silhueta da carroçaria; o (i) abre os dados técnicos;
     Veículo, Ano, kW e cv ordenam-se (↑↓); o veículo do cliente leva a risca azul e «O seu veículo»;
     «Ver peças deste veículo» leva ao Grupo montagem desse veículo.
   - CARACTERÍSTICAS: em grupos (Medidas, Construção e montagem, Informação), propriedade à esquerda e valor à
     direita, com a unidade à parte. Só os valores que existem nos dados.
   - DOCUMENTOS: linhas compactas com o tipo e o tamanho. Não há ficheiros neste protótipo, por isso
     «Descarregar» diz-o em vez de fingir que descarregou; não há pré-visualização pela mesma razão.
   - NO TELEMÓVEL: uma barra presa em baixo com o líquido e «Adicionar».
   ========================================================= */
import { L } from '../portal/catalogo-v3';
import { veiculosDe } from '../portal/catalogo-dados';
import { silhueta } from '../portal/carros';
import { encherModelos, encherVeiculos, ir } from './catalogo-v3';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import imageOff from 'lucide-static/icons/image-off.svg?raw';
import copy from 'lucide-static/icons/copy.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import download from 'lucide-static/icons/download.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowUpDown from 'lucide-static/icons/arrow-up-down.svg?raw';
import cart from 'lucide-static/icons/shopping-cart.svg?raw';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
let nr = 0;

/* ---------- a imagem ---------- */
function imagem(main: HTMLElement): void {
  const im = main.querySelector<HTMLElement>('.cat6__ficha .cat5__peca-imagem');
  if (!im || im.querySelector('.cat6__sem-foto')) return;
  im.innerHTML = `<span class="cat6__sem-foto">${L(imageOff)}<span>Sem fotografia</span></span>`;
}

/* ---------- OE ---------- */
function oe(main: HTMLElement): void {
  const ul = main.querySelector<HTMLElement>('[data-corpo="oe"] ul.cat5__oe'); if (!ul) return;
  const grupos = new Map<string, string[]>();
  ul.querySelectorAll('li').forEach((li) => { const f = li.querySelector('span')?.textContent || ''; const n = li.querySelector('strong')?.textContent || ''; grupos.set(f, [...(grupos.get(f) || []), n]); });
  ul.outerHTML = `<div class="cat6__oe">${Array.from(grupos).map(([f, ns]) => `<section class="cat6__oe-grupo" aria-label="Números de origem ${esc(f)}"><h3 class="cat6__oe-fab">${esc(f)}<small>${ns.length} ${ns.length === 1 ? 'número' : 'números'}</small></h3><ul class="cat6__oe-lista">${ns.map((n, i) => `<li class="cat6__oe-l" style="--i:${i}" tabindex="0"><span class="cat6__oe-de">${esc(f)}</span><span class="cat6__oe-n">${esc(n)}</span><button type="button" class="cat5__copiar cat6__oe-copiar" data-copiar="${esc(n)}" aria-label="Copiar ${esc(n)}">${L(copy)}<span>Copiar</span></button></li>`).join('')}</ul></section>`).join('')}</div>`;
}

/* ---------- Características ---------- */
const GRUPO = (k: string) => /^(Fabricante|Grupo de montagem)$/.test(k) ? 'Informação' : /diâmetro|largura|comprimento|peso|número|dentado/i.test(k) ? 'Medidas' : 'Construção e montagem';
const valor = (v: string) => { const m = /^([\d.,]+)\s*(mm|cm|kg|g)$/.exec(v.trim()); return m ? `<span class="cat6__v-n">${m[1]}</span><span class="cat6__v-u">${m[2]}</span>` : esc(v); };
function caracteristicas(main: HTMLElement): void {
  const dl = main.querySelector<HTMLElement>('[data-corpo="caracteristicas"] dl.cat5__carac'); if (!dl) return;
  const linhas = Array.from(dl.querySelectorAll('div')).map((d) => [d.querySelector('dt')?.textContent || '', d.querySelector('dd')?.textContent || ''] as [string, string]);
  const ordem = ['Medidas', 'Construção e montagem', 'Informação'];
  let i = 0;
  dl.outerHTML = `<div class="cat6__carac">${ordem.map((g) => { const ls = linhas.filter(([k]) => GRUPO(k) === g); return ls.length ? `<section class="cat6__carac-grupo"><h3>${g}</h3><dl>${ls.map(([k, v]) => `<div style="--i:${i++}"><dt>${esc(k)}</dt><dd>${valor(v)}</dd></div>`).join('')}</dl></section>` : ''; }).join('')}</div>`;
}

/* ---------- Documentos ---------- */
function documentos(main: HTMLElement): void {
  const ul = main.querySelector<HTMLElement>('[data-corpo="documentos"] ul.cat5__docs'); if (!ul) return;
  const docs = Array.from(ul.querySelectorAll('li')).map((li) => { const nome = li.querySelector('.cat5__doc-nome'); const meta = nome?.querySelector('small')?.textContent || ''; return [nome?.firstChild?.textContent?.trim() || '', meta] as [string, string]; });
  ul.outerHTML = `<ul class="cat6__docs">${docs.map(([t, meta], i) => { const [tipo, tam] = meta.split('·').map((s) => s.trim()); return `<li class="cat6__doc" style="--i:${i}"><span class="cat6__doc-icone" aria-hidden="true">${L(fileText)}</span><span class="cat6__doc-nome"><b>${esc(t)}</b><small><span class="cat6__doc-tipo">${esc(tipo || '')}</span>${tam ? ` ${esc(tam)}` : ''}</small></span><span class="cat6__doc-nota" role="status"></span><button type="button" class="btn btn--ghost btn--sm cat6__descarregar" data-descarregar="${esc(t)}">${L(download, 'btn__icone')}<span class="btn__rotulo">Descarregar</span></button></li>`; }).join('')}</ul>`;
}
function descarregar(b: HTMLButtonElement): void {
  if (b.getAttribute('aria-busy') === 'true') return;
  const li = b.closest('li')!, nota = li.querySelector<HTMLElement>('.cat6__doc-nota')!, antes = b.innerHTML;
  b.setAttribute('aria-busy', 'true'); b.innerHTML = `${rolamentoSvg('doc-' + ++nr, 'pesquisar', 'cat6__rs-botao')}<span class="btn__rotulo">A preparar…</span>`;
  window.setTimeout(() => {
    b.removeAttribute('aria-busy'); b.innerHTML = antes;
    /* não há ficheiro: diz-se, não se finge a descarga */
    nota.textContent = 'Ficheiro por ligar: o protótipo não tem os documentos do fabricante.';
    li.classList.add('is-sem-ficheiro');
  }, quieto() ? 150 : 600);
}

/* ---------- Veículos aplicáveis ---------- */
const ord = (k: string, t: string, cls = '') => `<th${cls ? ` class="${cls}"` : ''} aria-sort="none"><button type="button" class="cat5__ordenar" data-ap-ordenar="${k}">${t}${L(arrowUpDown)}</button></th>`;
function aplicaveis(main: HTMLElement): void {
  const corpo = main.querySelector<HTMLElement>('[data-corpo="veiculos"]'); if (!corpo) return;
  const velha = corpo.querySelector<HTMLElement>('.cg-tabela:not(.cat6__ap-tabela)'); if (!velha) return;
  /* os mesmos veículos que abrirDetalhes mostra (o exemplo da BMW), agora com o modelo de cada um */
  const todos = [...veiculosDe('BMW', '1 (E81)').map((v) => ({ ...v, modelo: '1 (E81)' })), ...veiculosDe('BMW', '1 (E87)').map((v) => ({ ...v, modelo: '1 (E87)' }))].slice(0, 6);
  const seu = main.dataset.refs === 'veiculo' ? `${main.dataset.modelo} ${main.dataset.versao}` : '';
  const modelos = Array.from(new Set(todos.map((v) => v.modelo)));
  velha.outerHTML = `<div class="cg-tabela erp-tabela cat5__tabela cat6__ap-tabela"><div class="erp-tabela__rolo"><table>
    <thead><tr><th class="cat5__i"><span class="sr-only">Detalhes</span></th><th class="cat6__th-foto"><span class="sr-only">Imagem</span></th>${ord('versao', 'Veículo')}${ord('ano', 'Ano')}${ord('kw', 'kW', 'erp-num')}${ord('cv', 'cv', 'erp-num')}<th>Motor</th></tr></thead>
    ${modelos.map((m) => { const vs = todos.filter((v) => v.modelo === m); return `<tbody data-modelo="${esc(m)}"><tr class="cat6__ap-grupo"><th colspan="7" scope="rowgroup">BMW ${esc(m)}<small>${esc(vs[0].carrocaria)} · ${vs.length} ${vs.length === 1 ? 'veículo' : 'veículos'}</small></th></tr>`
      + vs.map((v, i) => { const e = v.nome === seu; return `<tr class="cat6__ap${e ? ' is-seu' : ''}" style="--i:${i}" tabindex="0" data-modelo="${esc(m)}" data-versao="${esc(v.versao)}" data-ano="${v.desde}" data-kw="${v.kw}" data-cv="${v.cv}"${e ? ' aria-current="true"' : ''}>`
        + `<td class="cat5__i"><button type="button" class="cat5__info cat6__ap-info" aria-expanded="false" aria-label="Dados técnicos do ${esc(v.versao)}">${L(info)}</button></td>`
        + `<td class="cat6__v-foto" aria-hidden="true"><span class="cat6__carro">${silhueta(v.carrocaria)}</span></td>`
        + `<td><strong>${esc(v.versao)}</strong>${e ? `<span class="cat6__seu">${L(check)}O seu veículo</span>` : ''}</td><td class="cat3__nowrap">${v.anos}</td><td class="erp-num">${v.kw}</td><td class="erp-num">${v.cv}</td><td>${esc(v.motor)}</td></tr>`
        + `<tr class="cat6__ap-det" hidden><td colspan="7"><div class="cat6__ap-painel"><dl><div><dt>Combustível</dt><dd>${v.combustivel}</dd></div><div><dt>Cilindrada</dt><dd>${v.cc} cc</dd></div><div><dt>Potência</dt><dd>${v.kw} kW · ${v.cv} cv</dd></div><div><dt>Tração</dt><dd>${v.tracao}</dd></div><div><dt>Carroçaria</dt><dd>${v.carrocaria}</dd></div><div><dt>Motor</dt><dd>${esc(v.motor)}</dd></div></dl>`
        + `<button type="button" class="btn btn--acao btn--sm cat6__ap-ver"><span class="btn__rotulo">Ver peças deste veículo</span>${L(arrowRight, 'btn__icone')}</button></div></td></tr>`; }).join('') + '</tbody>'; }).join('')}
  </table></div></div>`;
}
function abrirAplicavel(tr: HTMLElement): void {
  const det = tr.nextElementSibling as HTMLElement, b = tr.querySelector<HTMLElement>('.cat6__ap-info')!;
  const sim = det.hidden;
  det.hidden = !sim; b.setAttribute('aria-expanded', String(sim));
  if (sim && !quieto()) det.querySelector('.cat6__ap-painel')?.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}
function ordenarAplicaveis(b: HTMLElement): void {
  const th = b.closest('th')!, k = b.dataset.apOrdenar || '';
  const sobe = th.getAttribute('aria-sort') !== 'ascending';
  th.closest('tr')!.querySelectorAll('th[aria-sort]').forEach((x) => x.setAttribute('aria-sort', 'none'));
  th.setAttribute('aria-sort', sobe ? 'ascending' : 'descending');
  th.closest('table')!.querySelectorAll('tbody').forEach((tb) => {
    const ls = Array.from(tb.querySelectorAll<HTMLElement>('tr.cat6__ap'));
    const antes = new Map(ls.map((l) => [l, l.getBoundingClientRect().top]));
    ls.sort((x, y) => { const d = k === 'versao' ? (x.dataset.versao || '').localeCompare(y.dataset.versao || '', 'pt', { numeric: true }) : Number(x.dataset[k]) - Number(y.dataset[k]); return sobe ? d : -d; });
    ls.forEach((l) => { const det = l.nextElementSibling!; tb.append(l, det); });
    if (!quieto()) ls.forEach((l) => { const dy = antes.get(l)! - l.getBoundingClientRect().top; if (dy) l.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2, .8, .2, 1)' }); });
  });
}
/** A procura nos veículos aplicáveis: as linhas e o seu grupo. */
export function procurarAplicaveis(i: HTMLInputElement): void {
  const q = i.value.trim().toLowerCase();
  i.closest('[data-corpo]')!.querySelectorAll<HTMLElement>('tbody[data-modelo]').forEach((tb) => {
    let algum = false;
    tb.querySelectorAll<HTMLElement>('tr.cat6__ap').forEach((tr) => { const sim = !q || `bmw ${tr.dataset.modelo} ${tr.textContent}`.toLowerCase().includes(q); tr.hidden = !sim; if (!sim) (tr.nextElementSibling as HTMLElement).hidden = true; algum ||= sim; });
    (tb.querySelector('.cat6__ap-grupo') as HTMLElement).hidden = !algum;
  });
}
/** «Ver peças deste veículo»: o catálogo passa a esse veículo (o contexto em cima muda com ele). */
function verVeiculo(main: HTMLElement, tr: HTMLElement): void {
  const modelo = tr.dataset.modelo || '', versao = tr.dataset.versao || '';
  main.dataset.marca = 'BMW';
  encherModelos(main, 'BMW');
  encherVeiculos(main, 'BMW', modelo);
  Object.assign(main.dataset, { modelo, versao });
  ir(main, 'grupos');
}

/* ---------- a barra da compra no telemóvel ---------- */
function barraCompra(main: HTMLElement): void {
  const f = main.querySelector<HTMLElement>('.cat6__ficha'); if (!f) return;
  const liq = main.querySelector('.cat6__ficha .cat5__peca-liq')?.firstChild?.textContent?.trim() || '';
  const ref = main.querySelector('.cat6__ficha .cat5__peca-ref')?.textContent || '';
  let b = f.querySelector<HTMLElement>('.cat6__barra-compra');
  if (!b) { f.insertAdjacentHTML('beforeend', `<div class="cat6__barra-compra"><p><b class="cat6__barra-liq"></b><small>líquido, sem IVA</small></p><button type="button" class="btn btn--acao cat6__barra-adicionar">${L(cart, 'btn__icone')}<span class="btn__rotulo">Adicionar</span></button></div>`); b = f.querySelector<HTMLElement>('.cat6__barra-compra')!; }
  b.querySelector('.cat6__barra-liq')!.textContent = liq;
  b.querySelector('.cat6__barra-adicionar')!.setAttribute('aria-label', `Adicionar ${ref} ao carrinho`);
}

/** Dá a forma nova ao que abrirDetalhes escreveu (pode chamar-se muitas vezes: só mexe no que ainda é velho). */
export function fichaV4(main: HTMLElement): void {
  imagem(main); oe(main); caracteristicas(main); documentos(main); aplicaveis(main); barraCompra(main);
}

/* ---------- os separadores ---------- */
export function trocarAba(main: HTMLElement, k: string, depois: () => void): void {
  const abas = Array.from(main.querySelectorAll<HTMLElement>('.cat5__aba'));
  const nova = main.querySelector<HTMLElement>(`[data-corpo="${k}"]`);
  const velha = Array.from(main.querySelectorAll<HTMLElement>('.cat5__aba-corpo')).find((c) => !c.hidden);
  if (!nova || velha === nova) return;
  abas.forEach((b) => { const sim = b.dataset.aba === k; b.setAttribute('aria-selected', String(sim)); b.tabIndex = sim ? 0 : -1; });
  depois();
  const mostrar = () => {
    main.querySelectorAll<HTMLElement>('.cat5__aba-corpo').forEach((c) => { c.hidden = c !== nova; });
    if (!quieto()) nova.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
  };
  if (!velha || quieto()) { mostrar(); return; }
  velha.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'ease-out' }).finished.then(mostrar, mostrar);
}
export function tecladoAbas(ev: KeyboardEvent, depois: (main: HTMLElement) => void): void {
  const a = (ev.target as Element).closest?.<HTMLElement>('.cat6 .cat5__aba'); if (!a) return;
  const abas = Array.from(a.parentElement!.querySelectorAll<HTMLElement>('.cat5__aba'));
  const i = abas.indexOf(a);
  const j = ev.key === 'ArrowRight' ? (i + 1) % abas.length : ev.key === 'ArrowLeft' ? (i - 1 + abas.length) % abas.length : ev.key === 'Home' ? 0 : ev.key === 'End' ? abas.length - 1 : -1;
  if (j < 0) return;
  ev.preventDefault();
  const main = a.closest<HTMLElement>('.cat6')!;
  abas[j].focus();
  trocarAba(main, abas[j].dataset.aba || 'stock', () => depois(main));
}

/** Os cliques desta camada (fase de captura). Devolve true se tratou o clique. */
export function cliqueFicha(main: HTMLElement, t: Element, depois: () => void): boolean {
  if (!t.closest('.cat6__ficha')) return false;
  const a = t.closest<HTMLElement>('.cat5__aba'); if (a) { trocarAba(main, a.dataset.aba || 'stock', depois); return true; }
  const d = t.closest<HTMLButtonElement>('[data-descarregar]'); if (d) { descarregar(d); return true; }
  const o = t.closest<HTMLElement>('[data-ap-ordenar]'); if (o) { ordenarAplicaveis(o); return true; }
  const v = t.closest<HTMLElement>('.cat6__ap-ver'); if (v) { verVeiculo(main, (v.closest('tr')!.previousElementSibling as HTMLElement)); return true; }
  const ap = t.closest<HTMLElement>('tr.cat6__ap'); if (ap) { abrirAplicavel(ap); return true; }
  const l = t.closest<HTMLElement>('.cat6__oe-l');
  if (l && !t.closest('button')) { l.parentElement!.querySelectorAll('.cat6__oe-l').forEach((x) => x.removeAttribute('aria-current')); l.setAttribute('aria-current', 'true'); return true; }
  if (t.closest('.cat6__barra-adicionar')) { main.querySelector<HTMLElement>('.cat6__ficha .cat5__peca-compra .cat5__adicionar')?.click(); return true; }
  return false;
}
