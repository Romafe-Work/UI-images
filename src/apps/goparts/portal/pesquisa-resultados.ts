/* =========================================================
   GOPARTS — 18 · Pesquisar peças V6 (20 out. 2026): os resultados da referência, no próprio ecrã
   Do briefing «Complete UX Refinement, Search Cards…»: depois de pesquisar, os resultados aparecem por baixo do
   formulário, com a mesma linguagem (não é outro produto). Procura-se nas referências de exemplo do catálogo
   (catalogo-dados.ts), como faria um índice de texto no servidor:
   - a referência escrita de qualquer forma («vkba6556», «VKBA-6556») encontra «VKBA 6556» (normalizada);
   - exata primeiro; a pesquisa parcial (opção) aceita um pedaço da referência; a marca e a descrição procuram-se
     por palavras, sem acentos;
   - «Incluir equivalências»: a uma referência exata juntam-se as equivalentes do catálogo, marcadas como tal.
   Filtros que os dados permitem: marca, família e «só com stock». A compatibilidade com um veículo não está nas
   referências de exemplo: a ficha da peça é que a confirma, e diz-se isso em cada resultado.
   ========================================================= */
import { REFERENCIAS, equivalentes, saida, type Referencia } from './catalogo-dados';
import { euros } from './pedidos-dados';
import { azulejoPeca } from './pecas-img';
import { L } from './inicio-espaco';
import cart from 'lucide-static/icons/shopping-cart.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import copy from 'lucide-static/icons/copy.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import eraser from 'lucide-static/icons/eraser.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import refreshCw from 'lucide-static/icons/refresh-cw.svg?raw';
import serverOff from 'lucide-static/icons/server-off.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import shieldQuestion from 'lucide-static/icons/shield-question.svg?raw';

export const IC_PR = { cart, fileText, copy, list, layoutGrid, eraser, x, info, searchX, refreshCw, serverOff, rotateCcw, warehouse };
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const btn = (texto: string, icone: string, extra = '', cls = '') => `<button type="button" class="btn pr__btn${cls ? ` ${cls}` : ''}"${extra}>${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;

export type Ordem = 'relevancia' | 'preco-asc' | 'preco-desc' | 'stock';
export type Vista = 'lista' | 'grelha';
export type Filtros = { q: string; parcial: boolean; equivalencias: boolean; marcas: string[]; grupo: string; stock: boolean; ordem: Ordem; vista: Vista };
export const FILTROS: Filtros = { q: '', parcial: false, equivalencias: true, marcas: [], grupo: '', stock: false, ordem: 'relevancia', vista: 'lista' };
export type Tipo = 'exata' | 'parcial' | 'texto' | 'equivalente';
export type Achado = { r: Referencia; tipo: Tipo };

/** «vkba-6556» → «VKBA6556»; sem acentos nem pontuação. */
export const norm = (s: string) => s.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]/g, '');
const palavras = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(Boolean);
export const liquido = (r: Referencia) => Math.round(r[4] * (1 - r[5] / 100) * 100) / 100;

/** Todas as referências que respondem à pesquisa, antes dos filtros. */
export function procurar(f: Pick<Filtros, 'q' | 'parcial' | 'equivalencias'>): Achado[] {
  const qn = norm(f.q), qp = palavras(f.q);
  if (!qn) return [];
  const r: Achado[] = [];
  REFERENCIAS.forEach((ref) => {
    const rn = norm(ref[2]), fr = norm(`${ref[1]}${ref[2]}`), mais = qn.length > norm(ref[1]).length; /* «SKF» é a marca; «SKFVKBA» já tem referência */
    let tipo: Tipo | null = null;
    if (rn === qn || fr === qn) tipo = 'exata';
    else if ((f.parcial && qn.length >= 2 && (rn.includes(qn) || (mais && fr.includes(qn)))) || (qn.length >= 3 && (rn.startsWith(qn) || (mais && fr.startsWith(qn))))) tipo = 'parcial';
    else { const texto = palavras(`${ref[1]} ${ref[3]} ${ref[0]}`); if (qp.length && qp.every((p) => texto.some((t) => t.startsWith(p)))) tipo = 'texto'; }
    if (tipo) r.push({ r: ref, tipo });
  });
  if (f.equivalencias) r.filter((a) => a.tipo === 'exata').forEach((a) => equivalentes(a.r).forEach((q) => { if (!r.some((b) => b.r === q)) r.push({ r: q, tipo: 'equivalente' }); }));
  return r;
}
const PESO: Record<Tipo, number> = { exata: 0, parcial: 1, equivalente: 2, texto: 3 };
/** Os filtros e a ordem. */
export function filtrar(todos: Achado[], f: Filtros): Achado[] {
  const l = todos.filter((a) => (!f.marcas.length || f.marcas.includes(a.r[1])) && (!f.grupo || a.r[0] === f.grupo) && (!f.stock || a.r[6] + a.r[7] > 0));
  const stock = (r: Referencia) => (r[6] ? 2 : r[7] ? 1 : 0);
  return l.sort((a, b) => f.ordem === 'preco-asc' ? liquido(a.r) - liquido(b.r) : f.ordem === 'preco-desc' ? liquido(b.r) - liquido(a.r) : f.ordem === 'stock' ? stock(b.r) - stock(a.r) : PESO[a.tipo] - PESO[b.tipo]);
}

const ETIQUETA: Record<Tipo, string> = { exata: 'Referência exata', parcial: 'Referência parcial', texto: 'Pela marca ou descrição', equivalente: 'Equivalente' };
export function resultadoHtml(a: Achado, i: number): string {
  const [grupo, fab, ref, desc, pvp, desc100, porto, sacavem] = a.r, id = `pr-${norm(ref)}`;
  return `<li class="pr__item" style="--i:${i}" data-ref="${esc(ref)}">
    <article class="pr__peca" aria-labelledby="${id}">
      <div class="pr__img">${azulejoPeca(desc, 'pr__azulejo', ref)}</div>
      <div class="pr__id">
        <p class="pr__linha1"><span class="pr__fab">${esc(fab)}</span><span class="pr__tipo pr__tipo--${a.tipo}">${ETIQUETA[a.tipo]}</span></p>
        <h3 class="pr__ref" id="${id}">${esc(ref)}<button type="button" class="pr__copiar" data-copiar="${esc(`${fab} ${ref}`)}" aria-label="Copiar a referência ${esc(ref)}">${L(copy)}</button></h3>
        <p class="pr__desc">${esc(desc)} <span class="pr__grupo">· ${esc(grupo)}</span></p>
        <p class="pr__compat">${L(shieldQuestion)}Sem veículo escolhido: a compatibilidade confirma-se na ficha.</p>
      </div>
      <div class="pr__stock">
        <span class="pr__saida${porto ? ' is-hoje' : sacavem ? ' is-amanha' : ' is-encomenda'}">${saida(porto, sacavem)}</span>
        <span class="pr__armazens">${L(warehouse)}Porto ${porto} · Sacavém ${sacavem}</span>
      </div>
      <div class="pr__preco"><b>${euros(liquido(a.r))}</b><small>PVP ${euros(pvp)} · −${desc100} %</small><small>sem IVA</small></div>
      <div class="pr__accoes">
        ${btn('Adicionar', cart, ` data-pr-pedir="${esc(ref)}"`, 'btn--acao')}
        ${btn('Ver ficha', fileText, ` data-pr-ficha="${esc(ref)}" data-pr-fab="${esc(fab)}"`)}
      </div>
    </article>
  </li>`;
}

/** O bloco dos resultados: o cabeçalho (termo, contagem, filtros ativos, ordem, vista), as facetas e a lista. */
export function resultadosHtml(f: Filtros, o: { estado?: '' | 'carga' | 'servico' } = {}): string {
  const todos = procurar(f), lista = filtrar(todos, f);
  const marcas = [...new Set(todos.map((a) => a.r[1]))].sort(), grupos = [...new Set(todos.map((a) => a.r[0]))].sort();
  const ativos = [...f.marcas.map((m) => [`Marca: ${m}`, `data-pr-tirar-marca="${esc(m)}"`]), ...(f.grupo ? [[`Família: ${f.grupo}`, 'data-pr-tirar-grupo']] : []), ...(f.stock ? [['Só com stock', 'data-pr-tirar-stock']] : [])];
  const cabeca = `<header class="pr__cabeca">
      <div class="pr__titulo"><h2 id="pr-t" tabindex="-1">${o.estado === 'carga' ? 'A pesquisar' : `<b data-pr-n>${lista.length}</b> ${lista.length === 1 ? 'resultado' : 'resultados'}`} para «${esc(f.q)}»</h2>
        ${lista.length !== todos.length && !o.estado ? `<p class="pr__sub">${todos.length} sem os filtros</p>` : ''}</div>
      <div class="pr__ctrl">
        <label class="pr__ordem"><span>Ordenar</span><select data-pr-ordem${o.estado ? ' disabled' : ''}>${([['relevancia', 'Relevância'], ['preco-asc', 'Preço: mais baixo'], ['preco-desc', 'Preço: mais alto'], ['stock', 'Disponibilidade']] as const).map(([v, t]) => `<option value="${v}"${v === f.ordem ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <div class="pr__vista" role="radiogroup" aria-label="Vista">${([['lista', 'Lista', list], ['grelha', 'Grelha', layoutGrid]] as const).map(([v, t, ic]) => `<button type="button" role="radio" class="pr__vista-op" data-pr-vista="${v}" aria-checked="${v === f.vista}">${L(ic)}<span>${t}</span></button>`).join('')}</div>
        ${btn('Limpar pesquisa', eraser, ' data-pr-limpar', 'pr__btn--leve')}
      </div>
    </header>`;
  const facetas = todos.length && !o.estado ? `<div class="pr__facetas" role="group" aria-label="Filtros">
      <span class="pr__facetas-r">Marca</span>${marcas.map((m) => `<button type="button" class="pr__faceta" data-pr-marca="${esc(m)}" aria-pressed="${f.marcas.includes(m)}">${esc(m)} <span>${todos.filter((a) => a.r[1] === m).length}</span></button>`).join('')}
      ${grupos.length > 1 ? `<label class="pr__familia"><span class="pr__facetas-r">Família</span><select data-pr-grupo><option value="">Todas</option>${grupos.map((g) => `<option${g === f.grupo ? ' selected' : ''}>${esc(g)}</option>`).join('')}</select></label>` : ''}
      <label class="pr__so-stock"><input type="checkbox" data-pr-stock${f.stock ? ' checked' : ''}> Só com stock</label>
    </div>${ativos.length ? `<ul class="pr__ativos" role="list" aria-label="Filtros ativos">${ativos.map(([t, a]) => `<li><button type="button" class="pr__ativo" ${a}>${esc(t)}${L(x)}<span class="sr-only">Tirar o filtro</span></button></li>`).join('')}</ul>` : ''}` : '';
  const corpo = o.estado === 'carga' ? `<ul class="pr__lista" data-vista="${f.vista}" aria-busy="true">${Array.from({ length: 4 }, (_, i) => `<li class="pr__item pr__esq" style="--i:${i}" aria-hidden="true"><i></i><i></i><i></i><i></i></li>`).join('')}</ul>`
    : o.estado === 'servico' ? `<div class="pr__vazio pr__vazio--erro" role="alert">${L(serverOff)}<div><h3>A pesquisa não está disponível de momento.</h3><p>O serviço de pesquisa não respondeu. O que escreveste continua no campo; podes tentar de novo ou procurar pelo catálogo.</p><div class="pr__vazio-accoes">${btn('Tentar novamente', rotateCcw, ' data-pr-tentar', 'btn--acao')}${btn('Ir ao catálogo', layoutGrid, ' data-ir="catalogo"')}</div></div></div>`
    : !todos.length ? `<div class="pr__vazio" role="status">${L(searchX)}<div><h3>Não encontrámos «${esc(f.q)}».</h3><p>Confirma a referência. ${f.parcial ? 'Já estás a pesquisar por partes da referência.' : 'Se só tens parte dela, liga a pesquisa parcial.'} Também podes procurar pela marca ou pela descrição da peça.</p><div class="pr__vazio-accoes">${f.parcial ? '' : btn('Pesquisa parcial', refreshCw, ' data-pr-parcial', 'btn--acao')}${btn('Limpar pesquisa', eraser, ' data-pr-limpar')}${btn('Catálogo universal', layoutGrid, ' data-pq-universal')}</div></div></div>`
    : !lista.length ? `<div class="pr__vazio" role="status">${L(searchX)}<div><h3>Nenhum resultado com estes filtros.</h3><p>Há ${todos.length} ${todos.length === 1 ? 'resultado' : 'resultados'} sem eles.</p><div class="pr__vazio-accoes">${btn('Tirar os filtros', x, ' data-pr-sem-filtros', 'btn--acao')}</div></div></div>`
    : `<ul class="pr__lista" data-vista="${f.vista}" role="list">${lista.map(resultadoHtml).join('')}</ul>`;
  return `${cabeca}${facetas}${corpo}${lista.length && !o.estado ? `<p class="pr__nota">${L(info)}<span>Preços líquidos da tua conta, sem IVA. O stock é o de agora nos armazéns do Porto e de Sacavém.</span></p>` : ''}`;
}
