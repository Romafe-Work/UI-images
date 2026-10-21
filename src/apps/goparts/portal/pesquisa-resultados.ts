/* =========================================================
   PEÇA A PEÇA — 18 · Pesquisar peças (20–21 out. 2026): os resultados da referência, no próprio ecrã
   (21 out., briefing «Redesign clean») os filtros num só botão «Filtros (n)» com a gaveta; os aplicados à vista com ×;
   seis por página, com «Anterior», os números e «Seguinte».
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
import sliders from 'lucide-static/icons/sliders-horizontal.svg?raw';
import chevronLeft from 'lucide-static/icons/chevron-left.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';

export const IC_PR = { cart, fileText, copy, list, layoutGrid, eraser, x, info, searchX, refreshCw, serverOff, rotateCcw, warehouse };
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const btn = (texto: string, icone: string, extra = '', cls = '') => `<button type="button" class="btn pr__btn${cls ? ` ${cls}` : ''}"${extra}>${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;

export type Ordem = 'relevancia' | 'preco-asc' | 'preco-desc' | 'stock';
export type Vista = 'lista' | 'grelha';
/* (21 out., Peça A Peça) os filtros vivem numa gaveta (um só botão «Filtros (n)»); juntam-se o armazém, o preço e a página */
export type Armazem = '' | 'porto' | 'sacavem';
export type Filtros = { q: string; parcial: boolean; equivalencias: boolean; marcas: string[]; grupo: string; stock: boolean; armazem: Armazem; min: number | null; max: number | null; ordem: Ordem; vista: Vista; pagina: number };
export const FILTROS: Filtros = { q: '', parcial: false, equivalencias: true, marcas: [], grupo: '', stock: false, armazem: '', min: null, max: null, ordem: 'relevancia', vista: 'lista', pagina: 1 };
export const POR_PAGINA = 6;
/** Quantos filtros estão aplicados (o número do botão). */
export const nFiltros = (f: Filtros) => f.marcas.length + (f.grupo ? 1 : 0) + (f.stock ? 1 : 0) + (f.armazem ? 1 : 0) + (f.min !== null || f.max !== null ? 1 : 0);
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
  const l = todos.filter((a) => (!f.marcas.length || f.marcas.includes(a.r[1])) && (!f.grupo || a.r[0] === f.grupo) && (!f.stock || a.r[6] + a.r[7] > 0)
    && (!f.armazem || (f.armazem === 'porto' ? a.r[6] : a.r[7]) > 0) && (f.min === null || liquido(a.r) >= f.min) && (f.max === null || liquido(a.r) <= f.max));
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

const eur0 = (n: number) => `${n.toLocaleString('pt-PT', { maximumFractionDigits: 2 })} €`;
/** Os filtros aplicados, cada um com o seu ×, fora da gaveta. */
function ativosDe(f: Filtros): [string, string][] {
  return [
    ...f.marcas.map((m) => [`Marca: ${m}`, `data-pr-tirar-marca="${esc(m)}"`] as [string, string]),
    ...(f.grupo ? [[`Família: ${f.grupo}`, 'data-pr-tirar-grupo'] as [string, string]] : []),
    ...(f.stock ? [['Só com stock', 'data-pr-tirar-stock'] as [string, string]] : []),
    ...(f.armazem ? [[`Armazém: ${f.armazem === 'porto' ? 'Porto' : 'Sacavém'}`, 'data-pr-tirar-armazem'] as [string, string]] : []),
    ...(f.min !== null || f.max !== null ? [[`Preço: ${f.min !== null ? eur0(f.min) : '0 €'} a ${f.max !== null ? eur0(f.max) : '…'}`, 'data-pr-tirar-preco'] as [string, string]] : []),
  ];
}

/** (21 out.) A gaveta dos filtros: grupos claros; muda-se à vontade e só «Mostrar» aplica. Vai para a raiz do portal. */
export function gavetaFiltrosHtml(f: Filtros): string {
  const todos = procurar(f);
  const marcas = [...new Set(todos.map((a) => a.r[1]))].sort(), grupos = [...new Set(todos.map((a) => a.r[0]))].sort();
  const n = filtrar(todos, f).length;
  const conta = (pred: (a: Achado) => boolean) => todos.filter(pred).length;
  return `<div class="pr__gaveta" data-por-cima role="dialog" aria-modal="true" aria-labelledby="pr-g-t">
    <div class="pr__veu" data-pr-fechar></div>
    <form class="pr__gaveta-caixa" data-pr-form novalidate data-enter="seguinte" data-enter-fim="submeter">
      <header class="pr__g-cabeca"><h2 id="pr-g-t">${L(sliders)}Filtros</h2><button type="button" class="btn pr__btn pr__btn--leve" data-pr-fechar>${L(x, 'btn__icone')}<span class="btn__rotulo">Fechar</span></button></header>
      <div class="pr__g-corpo">
        <fieldset class="pr__g-grupo"><legend>Marca</legend>
          <ul class="pr__g-opcoes" role="list">${marcas.map((m) => `<li><label class="pr__g-op"><input type="checkbox" name="marca" value="${esc(m)}"${f.marcas.includes(m) ? ' checked' : ''}><i aria-hidden="true">${L(check)}</i><span>${esc(m)}</span><small>${conta((a) => a.r[1] === m)}</small></label></li>`).join('')}</ul></fieldset>
        ${grupos.length > 1 ? `<fieldset class="pr__g-grupo"><legend>Família</legend>
          <ul class="pr__g-opcoes" role="list"><li><label class="pr__g-op pr__g-op--radio"><input type="radio" name="grupo" value=""${f.grupo ? '' : ' checked'}><i aria-hidden="true"></i><span>Todas</span><small>${todos.length}</small></label></li>${grupos.map((g) => `<li><label class="pr__g-op pr__g-op--radio"><input type="radio" name="grupo" value="${esc(g)}"${g === f.grupo ? ' checked' : ''}><i aria-hidden="true"></i><span>${esc(g)}</span><small>${conta((a) => a.r[0] === g)}</small></label></li>`).join('')}</ul></fieldset>` : ''}
        <fieldset class="pr__g-grupo"><legend>Disponibilidade</legend>
          <label class="pr__g-op"><input type="checkbox" name="stock"${f.stock ? ' checked' : ''}><i aria-hidden="true">${L(check)}</i><span>Só com stock</span><small>${conta((a) => a.r[6] + a.r[7] > 0)}</small></label></fieldset>
        <fieldset class="pr__g-grupo"><legend>Armazém</legend>
          <div class="pr__g-seg" role="radiogroup">${([['', 'Qualquer'], ['porto', 'Porto'], ['sacavem', 'Sacavém']] as const).map(([v, t]) => `<label><input type="radio" name="armazem" value="${v}"${v === f.armazem ? ' checked' : ''}><span>${t}</span></label>`).join('')}</div>
          <p class="pr__g-ajuda">Só as peças com stock nesse armazém.</p></fieldset>
        <fieldset class="pr__g-grupo"><legend>Preço líquido, sem IVA</legend>
          <div class="pr__g-preco"><label><span>De</span><input type="number" name="min" min="0" step="1" inputmode="decimal" placeholder="0" value="${f.min ?? ''}"></label><label><span>Até</span><input type="number" name="max" min="0" step="1" inputmode="decimal" placeholder="Sem limite" value="${f.max ?? ''}"></label></div>
          <p class="pr__g-erro" data-pr-g-erro role="alert" hidden></p></fieldset>
        <fieldset class="pr__g-grupo"><legend>Compatibilidade</legend>
          <p class="pr__g-ajuda">${L(shieldQuestion)}Escolhe o veículo em «Por matrícula» ou «Por veículo»: a compatibilidade confirma-se na ficha de cada peça.</p></fieldset>
      </div>
      <footer class="pr__g-pe">
        <button type="button" class="btn pr__btn" data-pr-g-limpar>${L(eraser, 'btn__icone')}<span class="btn__rotulo">Limpar filtros</span></button>
        <button type="submit" class="btn pr__btn btn--acao" data-pr-g-aplicar>${L(check, 'btn__icone')}<span class="btn__rotulo">Mostrar <b data-pr-g-n>${n}</b> ${n === 1 ? 'resultado' : 'resultados'}</span></button>
      </footer>
    </form>
  </div>`;
}
/** Lê a gaveta para um Filtros (página 1). */
export function lerGaveta(form: HTMLFormElement, f: Filtros): Filtros | string {
  const d = new FormData(form), num = (k: string) => { const v = String(d.get(k) ?? '').trim().replace(',', '.'); return v === '' ? null : Number(v); };
  const min = num('min'), max = num('max');
  if ((min !== null && (Number.isNaN(min) || min < 0)) || (max !== null && (Number.isNaN(max) || max < 0))) return 'Escreve um valor em euros, sem sinal.';
  if (min !== null && max !== null && min > max) return 'O «De» tem de ser menor do que o «Até».';
  return { ...f, marcas: d.getAll('marca').map(String), grupo: String(d.get('grupo') ?? ''), stock: d.get('stock') !== null, armazem: String(d.get('armazem') ?? '') as Armazem, min, max, pagina: 1 };
}

/** O bloco dos resultados: o cabeçalho (termo, contagem, «Filtros (n)», ordem, vista), os filtros aplicados, a lista e as páginas. */
export function resultadosHtml(f: Filtros, o: { estado?: '' | 'carga' | 'servico' } = {}): string {
  const todos = procurar(f), lista = filtrar(todos, f);
  const ativos = ativosDe(f), nf = nFiltros(f);
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA)), pag = Math.min(Math.max(1, f.pagina), paginas);
  const pagina = lista.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA);
  const de = lista.length ? (pag - 1) * POR_PAGINA + 1 : 0, ate = (pag - 1) * POR_PAGINA + pagina.length;
  const cabeca = `<header class="pr__cabeca">
      <div class="pr__titulo"><h2 id="pr-t" tabindex="-1">${o.estado === 'carga' ? 'A pesquisar' : `<b data-pr-n>${lista.length}</b> ${lista.length === 1 ? 'resultado' : 'resultados'}`} para «${esc(f.q)}»</h2>
        ${!o.estado && lista.length ? `<p class="pr__sub">${paginas > 1 ? `${de}–${ate} de ${lista.length}` : ''}${lista.length !== todos.length ? `${paginas > 1 ? ' · ' : ''}${todos.length} sem os filtros` : ''}</p>` : ''}</div>
      <div class="pr__ctrl">
        <button type="button" class="btn pr__btn pr__filtros-btn${nf ? ' is-ativo' : ''}" data-pr-filtros aria-haspopup="dialog"${o.estado || !todos.length ? ' disabled' : ''}>${L(sliders, 'btn__icone')}<span class="btn__rotulo">Filtros</span>${nf ? `<span class="pr__filtros-n" aria-label="${nf} aplicados">${nf}</span>` : ''}</button>
        <label class="pr__ordem"><span>Ordenar</span><select data-pr-ordem${o.estado ? ' disabled' : ''}>${([['relevancia', 'Relevância'], ['preco-asc', 'Preço: mais baixo'], ['preco-desc', 'Preço: mais alto'], ['stock', 'Disponibilidade']] as const).map(([v, t]) => `<option value="${v}"${v === f.ordem ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <div class="pr__vista" role="radiogroup" aria-label="Vista">${([['lista', 'Lista', list], ['grelha', 'Grelha', layoutGrid]] as const).map(([v, t, ic]) => `<button type="button" role="radio" class="pr__vista-op" data-pr-vista="${v}" aria-checked="${v === f.vista}">${L(ic)}<span>${t}</span></button>`).join('')}</div>
        ${btn('Limpar pesquisa', eraser, ' data-pr-limpar', 'pr__btn--leve')}
      </div>
    </header>`;
  const fora = ativos.length && !o.estado ? `<ul class="pr__ativos" role="list" aria-label="Filtros aplicados">${ativos.map(([t, a]) => `<li><button type="button" class="pr__ativo" ${a}>${esc(t)}${L(x)}<span class="sr-only">Tirar o filtro</span></button></li>`).join('')}<li><button type="button" class="pr__ativos-limpar" data-pr-sem-filtros>Limpar filtros</button></li></ul>` : '';
  const paginacao = paginas > 1 && !o.estado ? `<nav class="pr__paginas" aria-label="Páginas dos resultados">
      <button type="button" class="pr__pag pr__pag--seta" data-pr-pagina="${pag - 1}"${pag === 1 ? ' disabled' : ''} aria-label="Página anterior">${L(chevronLeft)}<span>Anterior</span></button>
      <ol role="list">${Array.from({ length: paginas }, (_, i) => `<li><button type="button" class="pr__pag" data-pr-pagina="${i + 1}"${i + 1 === pag ? ' aria-current="page"' : ''} aria-label="Página ${i + 1}">${i + 1}</button></li>`).join('')}</ol>
      <button type="button" class="pr__pag pr__pag--seta" data-pr-pagina="${pag + 1}"${pag === paginas ? ' disabled' : ''} aria-label="Página seguinte"><span>Seguinte</span>${L(chevronRight)}</button>
    </nav>` : '';
  const corpo = o.estado === 'carga' ? `<ul class="pr__lista" data-vista="${f.vista}" aria-busy="true">${Array.from({ length: 4 }, (_, i) => `<li class="pr__item pr__esq" style="--i:${i}" aria-hidden="true"><i></i><i></i><i></i><i></i></li>`).join('')}</ul>`
    : o.estado === 'servico' ? `<div class="pr__vazio pr__vazio--erro" role="alert">${L(serverOff)}<div><h3>A pesquisa não está disponível de momento.</h3><p>O serviço de pesquisa não respondeu. O que escreveste continua no campo; podes tentar de novo ou procurar pelo catálogo.</p><div class="pr__vazio-accoes">${btn('Tentar novamente', rotateCcw, ' data-pr-tentar', 'btn--acao')}${btn('Ir ao catálogo', layoutGrid, ' data-ir="catalogo"')}</div></div></div>`
    : !todos.length ? `<div class="pr__vazio" role="status">${L(searchX)}<div><h3>Não encontrámos «${esc(f.q)}».</h3><p>Confirma a referência. ${f.parcial ? 'Já estás a pesquisar por partes da referência.' : 'Se só tens parte dela, liga a pesquisa parcial.'} Também podes procurar pela marca ou pela descrição da peça.</p><div class="pr__vazio-accoes">${f.parcial ? '' : btn('Pesquisa parcial', refreshCw, ' data-pr-parcial', 'btn--acao')}${btn('Limpar pesquisa', eraser, ' data-pr-limpar')}${btn('Catálogo universal', layoutGrid, ' data-pq-universal')}</div></div></div>`
    : !lista.length ? `<div class="pr__vazio" role="status">${L(searchX)}<div><h3>Nenhum resultado com estes filtros.</h3><p>Há ${todos.length} ${todos.length === 1 ? 'resultado' : 'resultados'} sem eles.</p><div class="pr__vazio-accoes">${btn('Limpar filtros', x, ' data-pr-sem-filtros', 'btn--acao')}${btn('Mudar os filtros', sliders, ' data-pr-filtros')}</div></div></div>`
    : `<ul class="pr__lista" data-vista="${f.vista}" role="list">${pagina.map(resultadoHtml).join('')}</ul>${paginacao}`;
  return `${cabeca}${fora}${corpo}${lista.length && !o.estado ? `<p class="pr__nota">${L(info)}<span>Preços líquidos da tua conta, sem IVA. O stock é o de agora nos armazéns do Porto e de Sacavém.</span></p>` : ''}`;
}
