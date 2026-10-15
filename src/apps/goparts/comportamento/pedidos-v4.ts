/* =========================================================
   GOPARTS — 12 · Pedidos v4: o comportamento (15 out. 2026)
   - ESTADO: Todos / Processado / Sem processamento filtram logo; a risca laranja desliza (240 ms).
   - PESQUISAR: valida as datas (dd/mm/aaaa; a final não antes da inicial) e diz o erro no próprio campo, sem
     apagar o que se escreveu. Enquanto «procura», as linhas de antes ficam à vista, esbatidas, e o rolamento diz
     «A atualizar…»; depois as que saem desvanecem, as que ficam deslizam (FLIP, só transform) e as novas entram.
     Os filtros aplicados ficam em etiquetas com ×. A contagem e o valor no período contam até ao número novo.
   - ORDENAR por Pedido, Data e Valor (↑↓; outro clique inverte).
   - ABRIR NA LINHA: o pedido abre-se por baixo da linha; as linhas de baixo deslizam para o sítio (FLIP), o
     conteúdo entra com 8 px. Na primeira vez, o percurso enche-se até ao passo onde o pedido está e o ícone
     (camião, embalagem, visto) anda até lá. Fechar não tira a página do sítio.
   - PAINEL: «Abrir no painel» mostra o mesmo pedido à direita (ecrã inteiro no telemóvel); o número voa da linha
     para o título (View Transitions, onde o browser as tem). Esc fecha e o foco volta ao botão.
   Nada disto anima a altura; com «reduzir movimento», tudo troca sem deslizar. Não há servidor: a «procura» e
   «Repetir pedido» confirmam ao fim de menos de 1 s.
   ========================================================= */
import { LINHAS, euros } from '../portal/pedidos-dados';
import { detalhe, pedidoDe, linhaDe, valorDe, L, ICONES, etapa } from '../portal/pedidos-v4';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import x from 'lucide-static/icons/x.svg?raw';
import { guiaDe, detalheGuia, nomeTipo } from '../portal/guias-v3';
import { GUIAS, total as totalGuia, euros as eurosGuia } from '../portal/guias-dados';

const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SAIDA = 'cubic-bezier(.22, 1, .36, 1)';
const vivo = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal--ped4:not(.portal--estado) .ped4');
const $ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => Array.from(r.querySelectorAll<T>(s));
let nr = 0;

/* ---------- os critérios ---------- */
interface Criterios { de: string; ate: string; num: string; ref: string }
const criterios = new WeakMap<HTMLElement, Criterios>();
const ler = (main: HTMLElement): Criterios => ({ de: $<HTMLInputElement>(main, '#ped4-de')!.value.trim(), ate: $<HTMLInputElement>(main, '#ped4-ate')!.value.trim(), num: $<HTMLInputElement>(main, '#ped4-num')!.value.trim(), ref: $<HTMLInputElement>(main, '#ped4-ref')!.value.trim() });
const data = (s: string) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s); if (!m) return NaN; const d = new Date(+m[3], +m[2] - 1, +m[1]); return d.getMonth() === +m[2] - 1 ? +`${m[3]}${m[2]}${m[1]}` : NaN; };
const simples = (s: string) => s.toLowerCase().replace(/[\s/.-]/g, '');
function passa(num: string, c: Criterios, estado: string, et = 'todas'): boolean {
  const l = linhaDe(num), p = pedidoDe(num), d = +l.data.split('/').reverse().join('');
  if (estado !== 'todos' && l.estado !== estado) return false;
  if (et !== 'todas' && etapa(p).k !== et) return false;
  if (c.de && d < data(c.de)) return false;
  if (c.ate && d > data(c.ate)) return false;
  if (c.num && !simples(num).includes(simples(c.num))) return false;
  if (c.ref && !p.artigos.some((a) => simples(a[2]).includes(simples(c.ref)))) return false;
  return true;
}

/** Valida as datas; o erro fica no campo, o que se escreveu também. */
function validar(main: HTMLElement): boolean {
  const erro = (id: string, msg: string) => { const i = $<HTMLInputElement>(main, `#${id}`)!, e = $(main, `#${id}-erro`)!; if (msg) { i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', `${id}-erro`); e.textContent = msg; e.hidden = false; } else { i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); e.hidden = true; } return !msg; };
  const c = ler(main);
  const ok1 = erro('ped4-de', c.de && Number.isNaN(data(c.de)) ? 'Escreva a data como dd/mm/aaaa.' : '');
  const ok2 = erro('ped4-ate', c.ate && Number.isNaN(data(c.ate)) ? 'Escreva a data como dd/mm/aaaa.' : c.de && c.ate && data(c.ate) < data(c.de) ? 'A data final é antes da inicial.' : '');
  if (!ok1 || !ok2) $<HTMLInputElement>(main, '[aria-invalid="true"]')?.focus();
  return ok1 && ok2;
}

/* ---------- os números que contam ---------- */
function contar(el: HTMLElement, para: number, fmt: (n: number) => string): void {
  const de = Number(el.dataset.valor ?? para);
  el.dataset.valor = String(para);
  if (quieto() || de === para) { el.textContent = fmt(para); return; }
  const t0 = performance.now(), dur = 320;
  const passo = (t: number) => { const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 3; el.textContent = fmt(de + (para - de) * e); if (k < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}

/* ---------- aplicar os filtros à tabela ---------- */
async function aplicar(main: HTMLElement, animar = true): Promise<void> {
  const c = criterios.get(main) || ler(main);
  const estado = main.dataset.filtro || 'todos';
  const linhas = $$(main, 'tr.ped4__linha');
  const muitas = linhas.length > 40, mexer = animar && !quieto() && !muitas;
  const et = main.dataset.etapa || 'todas';
  const fica = new Map(linhas.map((tr) => [tr, passa(tr.dataset.num!, c, estado, et)]));
  const saem = linhas.filter((tr) => !tr.hidden && !fica.get(tr)), entram = linhas.filter((tr) => tr.hidden && fica.get(tr));
  const antes = new Map(linhas.filter((tr) => !tr.hidden).map((tr) => [tr, tr.getBoundingClientRect().top]));
  if (mexer && saem.length) await Promise.all(saem.map((tr) => tr.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-out', fill: 'forwards' }).finished.catch(() => undefined)));
  linhas.forEach((tr) => {
    const sim = fica.get(tr)!; tr.hidden = !sim;
    const det = tr.nextElementSibling as HTMLElement;
    if (!sim && !det.hidden) fechar(main, tr, false);
    tr.getAnimations().forEach((a) => a.cancel());
    $(tr, '.ped4__ref')!.innerHTML = marcar(tr.dataset.num!, c.num);
  });
  if (mexer) {
    linhas.filter((tr) => !tr.hidden && antes.has(tr)).forEach((tr) => { const dy = antes.get(tr)! - tr.getBoundingClientRect().top; if (dy) tr.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 240, easing: SAIDA }); });
    entram.forEach((tr, i) => tr.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: Math.min(i, 6) * 30, easing: SAIDA, fill: 'backwards' }));
  }
  aplicarCrono(main, (n) => passa(n, c, estado, et), c, mexer);
  /* as contagens */
  const vis = linhas.filter((tr) => !tr.hidden);
  const conta = $(main, '.ped4__conta b'); if (conta) contar(conta, vis.length, (n) => String(Math.round(n)));
  contar($(main, '[data-kpi="n"]')!, vis.length, (n) => String(Math.round(n)));
  contar($(main, '[data-kpi="total"]')!, vis.reduce((s, tr) => s + Number(tr.dataset.valor), 0), euros);
  $$(main, '.ped4__est').forEach((b) => { const k = b.dataset.filtro!; $(b, '.ped4__est-n')!.textContent = String(LINHAS.filter((l) => passa(l.num, c, k, et)).length); });
  $$(main, '.ped4__etapa-f').forEach((b) => { $(b, '.ped4__est-n')!.textContent = String(LINHAS.filter((l) => passa(l.num, c, estado, b.dataset.etapa!)).length); });
  etiquetas(main, c);
  /* sem resultados: diz porquê e dá a saída */
  const vazio = $(main, '.ped4__vazio')!;
  vazio.hidden = vis.length > 0;
  if (!vis.length) vazio.innerHTML = `<p><strong>Nenhum pedido com estes filtros.</strong> Alargue as datas ou tire um filtro; ${LINHAS.length} pedidos no total.</p><button type="button" class="btn btn--ghost btn--sm" data-limpar-tudo>${ICONES.rotateCcw}<span class="btn__rotulo">Limpar filtros</span></button>`;
}

/** As etiquetas dos filtros aplicados, cada uma com ×. */
function etiquetas(main: HTMLElement, c: Criterios): void {
  const ul = $(main, '.ped4__chips')!;
  const itens: [string, string][] = [];
  if (c.de) itens.push(['de', `Desde ${c.de}`]); if (c.ate) itens.push(['ate', `Até ${c.ate}`]);
  if (c.num) itens.push(['num', `Pedido «${c.num}»`]); if (c.ref) itens.push(['ref', `Referência «${c.ref}»`]);
  const e = main.dataset.filtro || 'todos'; if (e !== 'todos') itens.push(['estado', e === 'proc' ? 'Processado' : 'Sem processamento']);
  const et = main.dataset.etapa || 'todas'; if (et !== 'todas') itens.push(['etapa', ($(main, `.ped4__etapa-f[data-etapa="${et}"]`)?.textContent || '').replace(/\s*\d+\s*$/, '').trim()]);
  ul.innerHTML = itens.map(([k, t]) => `<li><span>${t}</span><button type="button" class="ped4__chip-x" data-tirar="${k}" aria-label="Tirar o filtro ${t}">${L(x)}</button></li>`).join('');
  const n = $(main, '.ped4__filtros-n')!; n.textContent = String(itens.length); n.hidden = !itens.length;
}

/* ---------- pesquisar (com o «a atualizar» por cima das linhas de antes) ---------- */
function pesquisar(main: HTMLElement): void {
  if (!validar(main)) return;
  const b = $<HTMLButtonElement>(main, '.ped4__pesquisar')!; if (b.getAttribute('aria-busy') === 'true') return;
  const antes = b.innerHTML, aviso = $(main, '.ped4__a-atualizar')!, tabela = $(main, '.ped4__tabela')!;
  b.setAttribute('aria-busy', 'true'); b.innerHTML = `${rolamentoSvg('p4-' + ++nr, 'pesquisar', 'ped4__rs')}<span class="btn__rotulo">A pesquisar…</span>`;
  aviso.innerHTML = `${rolamentoSvg('p4-' + ++nr, 'pesquisar', 'ped4__rs')}A atualizar…`; aviso.hidden = false; tabela.classList.add('is-a-atualizar');
  window.setTimeout(() => {
    criterios.set(main, ler(main));
    b.removeAttribute('aria-busy'); b.innerHTML = antes; aviso.hidden = true; tabela.classList.remove('is-a-atualizar');
    aplicar(main);
  }, quieto() ? 120 : 450);
}
function limpar(main: HTMLElement, aplicarJa = true): void {
  $$<HTMLInputElement>(main, '.ped4__input').forEach((i) => { i.value = ''; i.removeAttribute('aria-invalid'); });
  $$(main, '.ped4__erro').forEach((e) => { e.hidden = true; });
  main.dataset.filtro = 'todos'; estados(main); main.dataset.etapa = 'todas'; etapas(main);
  criterios.set(main, ler(main));
  if (aplicarJa) aplicar(main);
}

/* ---------- o estado (Todos / Processado / Sem processamento) e a risca ---------- */
function estados(main: HTMLElement): void {
  const f = main.dataset.filtro || 'todos';
  $$(main, '.ped4__est').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtro === f)));
  risca(main);
}
function risca(main: HTMLElement): void {
  const a = $(main, `.ped4__est[aria-pressed="true"]`), r = $(main, '.ped4__est-risca'); if (!a || !r) return;
  r.style.setProperty('--x', `${a.offsetLeft}px`); r.style.setProperty('--w', `${a.offsetWidth}px`);
}

/** As pílulas do estado do percurso: uma só escolhida. */
function etapas(main: HTMLElement): void {
  const f = main.dataset.etapa || 'todas';
  $$(main, '.ped4__etapa-f').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.etapa === f)));
}

/* ---------- ordenar ---------- */
function ordenar(main: HTMLElement, b: HTMLElement): void {
  const th = b.closest('th')!, k = b.dataset.ordenar!;
  const sobe = th.getAttribute('aria-sort') !== 'ascending';
  $$(main, 'thead th[aria-sort]').forEach((x) => x.setAttribute('aria-sort', 'none'));
  th.setAttribute('aria-sort', sobe ? 'ascending' : 'descending');
  const corpo = $(main, '.ped4__tabela tbody')!, linhas = $$(corpo, 'tr.ped4__linha');
  const antes = new Map(linhas.map((l) => [l, l.getBoundingClientRect().top]));
  const v = (l: HTMLElement) => k === 'num' ? l.dataset.num! : Number(k === 'data' ? l.dataset.data : l.dataset.valor);
  linhas.sort((a, c) => { const x1 = v(a), x2 = v(c); const d = typeof x1 === 'number' ? x1 - (x2 as number) : x1.localeCompare(String(x2), 'pt', { numeric: true }); return sobe ? d : -d; });
  linhas.forEach((l) => corpo.append(l, l.nextElementSibling!));
  if (quieto() || linhas.length > 40) return;
  linhas.forEach((l) => { const dy = antes.get(l)! - l.getBoundingClientRect().top; if (dy && !l.hidden) l.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 240, easing: SAIDA }); });
}

/* ---------- abrir e fechar na linha ---------- */
/** As linhas de baixo deslizam do sítio onde estavam (FLIP): a mudança de altura acontece de uma vez, sem animar a altura. */
function deslizarAbaixo(main: HTMLElement, tr: HTMLElement, mudar: () => void): void {
  const abaixo = $$(main, 'tr.ped4__linha').filter((l) => !l.hidden && (tr.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING));
  const antes = new Map(abaixo.map((l) => [l, l.getBoundingClientRect().top]));
  mudar();
  if (quieto()) return;
  abaixo.forEach((l) => { const dy = antes.get(l)! - l.getBoundingClientRect().top; if (dy) l.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 320, easing: SAIDA }); });
}
function animarPercurso(raiz: HTMLElement): void {
  const tl = $(raiz, '.ped4__tl'); if (!tl || tl.dataset.visto || quieto()) return;
  tl.dataset.visto = '1';
  const p = Number(getComputedStyle(tl).getPropertyValue('--p')) || 0;
  $(tl, '.ped4__tl-cheia')?.animate([{ transform: 'scaleX(0)' }, { transform: `scaleX(${p})` }], { duration: 650, delay: 120, easing: SAIDA, fill: 'backwards' });
  $(tl, '.ped4__tl-mover')?.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${p * 100}%)` }], { duration: 650, delay: 120, easing: SAIDA, fill: 'backwards' });
  $$(tl, '.ped4__tl-passo.is-feito .ped4__tl-ponto').forEach((d, i) => d.animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, delay: 120 + i * (650 / Math.max(1, $$(tl, '.ped4__tl-passo').length - 1)), easing: SAIDA, fill: 'backwards' }));
}
function abrir(main: HTMLElement, tr: HTMLElement): void {
  const det = tr.nextElementSibling as HTMLElement, td = det.firstElementChild as HTMLElement;
  if (!td.firstElementChild) td.innerHTML = detalhe(pedidoDe(tr.dataset.num!), linhaDe(tr.dataset.num!));
  deslizarAbaixo(main, tr, () => { det.hidden = false; tr.classList.add('is-aberto'); $(tr, '.ped4__abrir')!.setAttribute('aria-expanded', 'true'); });
  if (!quieto()) $(td, '.ped4__det')?.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: SAIDA });
  animarPercurso(td);
}
function fechar(main: HTMLElement, tr: HTMLElement, animar = true): void {
  const det = tr.nextElementSibling as HTMLElement;
  const topo = tr.getBoundingClientRect().top;
  const mudar = () => { det.hidden = true; tr.classList.remove('is-aberto'); $(tr, '.ped4__abrir')!.setAttribute('aria-expanded', 'false'); };
  if (animar) deslizarAbaixo(main, tr, mudar); else mudar();
  /* a linha fica onde estava no ecrã */
  if (animar && topo < 0) tr.scrollIntoView({ block: 'start' });
}

/* ---------- o painel à direita ---------- */
/** Com o painel aberto, o resto da página fica inerte (modal): o topo, as abas e a lista. */
function fundo(main: HTMLElement, inerte: boolean): void {
  const portal = main.closest('.portal')!;
  [...$$(portal, ':scope > header, :scope > nav'), ...$$(main, ':scope > header, :scope > section')].forEach((el) => { el.inert = inerte; if (inerte) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden'); });
}
let devolver: HTMLElement | null = null;
function gaveta(main: HTMLElement, num: string, origem: HTMLElement): void {
  const g = $(main, '.ped4__gaveta')!, veu = $(main, '.ped4__veu')!, l = linhaDe(num), p = pedidoDe(num);
  const ref = main.querySelector<HTMLElement>(`tr.ped4__linha[data-num="${num}"] .ped4__ref`);
  devolver = origem;
  const encher = () => {
    g.innerHTML = `<header class="ped4__g-cabeca"><div><p class="ped4__g-rotulo">Pedido</p><h2 class="ped4__g-num" id="ped4-g-num" tabindex="-1">${num}</h2><p class="ped4__g-meta">${l.data} · ${l.armazem} · ${euros(valorDe(p))}</p></div><button type="button" class="ped4__g-fechar" aria-label="Fechar (Esc)">${L(x)}</button></header>${detalhe(p, l, 'gaveta')}`;
    g.hidden = false; veu.hidden = false; main.classList.add('tem-gaveta'); fundo(main, true);
    if (ref) ref.style.viewTransitionName = '';
    $(g, '.ped4__g-num')!.style.viewTransitionName = 'ped4-num';
  };
  const vt = (document as Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } }).startViewTransition;
  if (ref && vt && !quieto()) { ref.style.viewTransitionName = 'ped4-num'; vt.call(document, encher).finished.finally(() => { const t = $(g, '.ped4__g-num'); if (t) t.style.viewTransitionName = ''; }); }
  else { encher(); if (!quieto()) g.animate([{ transform: 'translateX(24px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 340, easing: SAIDA }); }
  window.setTimeout(() => { $(g, '.ped4__g-num')?.focus(); animarPercurso(g); }, quieto() ? 0 : 60);
}
/** A guia de remessa no painel lateral: o percurso documental, o documento, os valores e os artigos. */
function gavetaGuia(main: HTMLElement, num: string, origem: HTMLElement): void {
  if (!GUIAS.some((g) => g.num === num)) return;
  const g = guiaDe(num), gv = $(main, '.ped4__gaveta')!, veu = $(main, '.ped4__veu')!, jaAberto = !gv.hidden;
  devolver = origem;
  gv.innerHTML = `<header class="ped4__g-cabeca"><div><p class="ped4__g-rotulo">Guia de remessa · ${nomeTipo(g)} ${g.doc}</p><h2 class="ped4__g-num" id="ped4-g-num" tabindex="-1">${g.num}</h2><p class="ped4__g-meta">${g.data} · Pedido ${g.pedido} · ${eurosGuia(totalGuia(g))}</p></div><button type="button" class="ped4__g-fechar" aria-label="Fechar (Esc)">${L(x)}</button></header><div class="ped4__g-guia">${detalheGuia(g, 'pedidos')}</div>`;
  gv.hidden = false; veu.hidden = false; main.classList.add('tem-gaveta'); fundo(main, true);
  if (!quieto()) {
    if (!jaAberto) gv.animate([{ transform: 'translateX(32px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: SAIDA });
    else $(gv, '.ped4__g-guia')?.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: SAIDA });
    /* o fio do percurso desenha-se do pedido à guia e da guia à fatura */
    $$(gv, '.gui3__fio').forEach((f, i) => f.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 450, delay: 200 + i * 220, easing: SAIDA, fill: 'backwards' }));
  }
  gv.scrollTop = 0;
  window.setTimeout(() => $(gv, '.ped4__g-num')?.focus(), quieto() ? 0 : 60);
}
function descarregarGuia(b: HTMLButtonElement): void {
  if (b.getAttribute('aria-busy') === 'true') return;
  const antes = b.innerHTML, aviso = b.closest('.gui3__det-artigos')?.querySelector<HTMLElement>('.gui3__descarga');
  b.setAttribute('aria-busy', 'true'); b.innerHTML = `${rolamentoSvg('p4-' + ++nr, 'pesquisar', 'ped4__rs')}<span class="btn__rotulo">A preparar o PDF…</span>`;
  window.setTimeout(() => {
    b.removeAttribute('aria-busy'); b.classList.add('is-feito'); b.innerHTML = `${ICONES.check.replace('<svg', '<svg class="btn__icone"')}<span class="btn__rotulo">PDF descarregado</span>`;
    if (aviso) { aviso.hidden = false; aviso.textContent = `${b.dataset.descarregar!.replace('/', '-')}.pdf · na pasta das transferências`; }
    window.setTimeout(() => { b.classList.remove('is-feito'); b.innerHTML = antes; }, 2400);
  }, quieto() ? 150 : 800);
}
function fecharGaveta(main: HTMLElement): void {
  const g = $(main, '.ped4__gaveta')!; if (g.hidden) return;
  const fim = () => { g.hidden = true; $(main, '.ped4__veu')!.hidden = true; main.classList.remove('tem-gaveta'); fundo(main, false); devolver?.focus(); };
  if (quieto()) { fim(); return; }
  g.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(24px)', opacity: 0 }], { duration: 220, easing: 'ease-in' }).finished.then(fim, fim);
}

/* ---------- repetir o pedido (pendente → confirmado) ---------- */
function repetir(b: HTMLButtonElement): void {
  if (b.getAttribute('aria-busy') === 'true' || b.classList.contains('is-feito')) return;
  const antes = b.innerHTML;
  b.setAttribute('aria-busy', 'true'); b.innerHTML = `${rolamentoSvg('p4-' + ++nr, 'pesquisar', 'ped4__rs')}<span class="btn__rotulo">A adicionar…</span>`;
  window.setTimeout(() => {
    b.removeAttribute('aria-busy'); b.classList.add('is-feito');
    b.innerHTML = `${ICONES.check.replace('<svg', '<svg class="btn__icone"')}<span class="btn__rotulo">Artigos no carrinho</span>`;
    window.setTimeout(() => { b.classList.remove('is-feito'); b.innerHTML = antes; }, 2200);
  }, quieto() ? 150 : 700);
}

/* =========================================================
   A cronologia (15 out., o segundo briefing dela: «Order journey»)
   - a linha vertical desenha-se com o scroll (scaleY, ida e volta) até à altura de leitura (55% da janela);
   - os marcadores acima dessa altura acendem; o pedido mais perto dela fica ativo (laranja);
   - cada cartão entra uma vez, com 12 px na horizontal (IntersectionObserver), e não volta a animar;
   - abrir um cartão: o detalhe aparece no sítio e os de baixo deslizam (FLIP, sem animar a altura);
   - os filtros tiram os cartões que não passam, escondem os meses vazios e destacam o que se procurou.
   ========================================================= */
const marcar = (texto: string, q: string) => {
  if (!q) return texto;
  const s = simples(q), alvo = simples(texto); const i = alvo.indexOf(s); if (i < 0) return texto;
  /* mapa entre o texto simplificado e o original (sem espaços, barras, pontos e hífenes) */
  const pos: number[] = []; for (let k = 0; k < texto.length; k++) if (!/[\s/.-]/.test(texto[k])) pos.push(k);
  const a = pos[i], b = pos[i + s.length - 1] + 1;
  return `${texto.slice(0, a)}<mark>${texto.slice(a, b)}</mark>${texto.slice(b)}`;
};
function aplicarCrono(main: HTMLElement, fica: (num: string) => boolean, c: Criterios, mexer: boolean): void {
  const cr = $(main, '.ped4__crono'); if (!cr) return;
  const itens = $$(cr, '.ped4__c-item');
  const antes = new Map(itens.filter((li) => !li.hidden).map((li) => [li, li.getBoundingClientRect().top]));
  const entram: HTMLElement[] = [];
  itens.forEach((li) => {
    const num = li.dataset.num!, sim = fica(num);
    if (sim && li.hidden) entram.push(li);
    if (!sim && li.classList.contains('is-aberto')) fecharItem(main, li, false);
    li.hidden = !sim;
    $(li, '.ped4__ref')!.innerHTML = marcar(num, c.num);
    const enc = $(li, '.ped4__c-encontrado')!, art = c.ref ? pedidoDe(num).artigos.find((a) => simples(a[2]).includes(simples(c.ref))) : undefined;
    enc.hidden = !art; enc.innerHTML = art ? `Contém ${marcar(art[2], c.ref)}` : '';
  });
  $$(cr, '.ped4__mes').forEach((m) => { const n = $$(m, '.ped4__c-item:not([hidden])').length; m.hidden = !n; $(m, '.ped4__mes-t small')!.innerHTML = `<b>${n}</b> ${n === 1 ? 'pedido' : 'pedidos'}`; });
  cr.hidden = !itens.some((li) => !li.hidden);
  if (mexer) {
    itens.filter((li) => !li.hidden && antes.has(li)).forEach((li) => { const dy = antes.get(li)! - li.getBoundingClientRect().top; if (dy) li.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 260, easing: SAIDA }); });
    entram.forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateX(-12px)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: Math.min(i, 6) * 30, easing: SAIDA, fill: 'backwards' }));
  }
  requestAnimationFrame(() => rolar(main));
}

/** A linha que se desenha, os marcadores que acendem e o pedido ativo — conforme o scroll (e ao contrário). */
function rolar(main: HTMLElement): void {
  const cr = $(main, '.ped4__crono'); if (!cr || cr.hidden || main.querySelector('.ped4__lista')?.getAttribute('data-vista') !== 'cronologia') return;
  const r = cr.getBoundingClientRect(), leitura = innerHeight * 0.55;
  const prog = Math.max(0, Math.min(1, (leitura - r.top) / Math.max(1, r.height)));
  cr.style.setProperty('--prog', prog.toFixed(4));
  let ativo: HTMLElement | null = null, melhor = Infinity;
  $$(cr, '.ped4__c-item:not([hidden])').forEach((li) => {
    const t = li.getBoundingClientRect().top + 22;
    li.classList.toggle('is-passado', t <= leitura);
    const d = Math.abs(t - leitura); if (t <= leitura + 40 && d < melhor) { melhor = d; ativo = li; }
  });
  $$(cr, '.ped4__c-item.is-ativo').forEach((li) => { if (li !== ativo) li.classList.remove('is-ativo'); });
  (ativo as HTMLElement | null)?.classList.add('is-ativo');
}
let pedidoRolar = 0;
const aoRolar = () => { if (pedidoRolar) return; pedidoRolar = requestAnimationFrame(() => { pedidoRolar = 0; const m = vivo(); if (m) rolar(m); }); };

/** Cada cartão entra uma vez, quando chega à janela (nunca volta a animar). */
const entrada = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-entrou"); entrada?.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
function observar(main: HTMLElement): void {
  $$(main, '.ped4__c-item:not(.is-entrou)').forEach((li) => { if (quieto() || !entrada) li.classList.add('is-entrou'); else entrada.observe(li); });
}

function abrirItem(main: HTMLElement, li: HTMLElement): void {
  const det = $(li, '.ped4__c-det')!;
  if (!det.firstElementChild) det.innerHTML = detalhe(pedidoDe(li.dataset.num!), linhaDe(li.dataset.num!));
  deslizarDepois(main, li, () => { det.hidden = false; li.classList.add('is-aberto'); $(li, '.ped4__c-cabeca')!.setAttribute('aria-expanded', 'true'); });
  if (!quieto()) $(det, '.ped4__det')?.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: SAIDA });
  animarPercurso(det);
  requestAnimationFrame(() => rolar(main));
}
function fecharItem(main: HTMLElement, li: HTMLElement, animar = true): void {
  const topo = li.getBoundingClientRect().top;
  const mudar = () => { $(li, '.ped4__c-det')!.hidden = true; li.classList.remove('is-aberto'); $(li, '.ped4__c-cabeca')!.setAttribute('aria-expanded', 'false'); };
  if (animar) deslizarDepois(main, li, mudar); else mudar();
  if (animar && topo < 0) li.scrollIntoView({ block: 'start' });
  requestAnimationFrame(() => rolar(main));
}
/** Os cartões e os meses de baixo deslizam do sítio onde estavam (FLIP). */
function deslizarDepois(main: HTMLElement, li: HTMLElement, mudar: () => void): void {
  const depois = $$(main, '.ped4__c-item:not([hidden]), .ped4__mes-t, .ped4__c-fim').filter((x) => li.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING && !li.contains(x));
  const antes = new Map(depois.map((x) => [x, x.getBoundingClientRect().top]));
  mudar();
  if (quieto()) return;
  depois.forEach((x) => { const dy = antes.get(x)! - x.getBoundingClientRect().top; if (dy) x.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 320, easing: SAIDA }); });
}
const lidaVista = () => { try { return localStorage.getItem('goparts-pedidos-vista'); } catch { return null; } };
function vista(main: HTMLElement, v: string, guardar = true): void {
  const l = $(main, '.ped4__lista')!; l.dataset.vista = v;
  $$(main, '.ped4__vista').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vista === v)));
  if (guardar) try { localStorage.setItem('goparts-pedidos-vista', v); } catch { /* fica só nesta visita */ }
  if (!quieto() && guardar) $(main, v === 'tabela' ? '.ped4__tabela' : '.ped4__crono')?.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: SAIDA });
  observar(main); requestAnimationFrame(() => rolar(main));
}

/* ---------- ligar ---------- */
function armar(): void {
  const main = vivo(); if (!main) return;
  if (!main.dataset.filtro) main.dataset.filtro = 'todos';
  if (!criterios.has(main)) criterios.set(main, ler(main));
  if (!main.dataset.entrou) { main.dataset.entrou = '1'; if (!quieto()) main.classList.add('ped4--entrar'); window.setTimeout(() => main.classList.remove('ped4--entrar'), 900); }
  $$(main, '[data-kpi]').forEach((d) => { if (!d.dataset.valor) d.dataset.valor = d.dataset.kpi === 'n' ? String(LINHAS.length) : String(LINHAS.reduce((s, l) => s + valorDe(pedidoDe(l.num)), 0)); });
  if (!main.dataset.vistaLida) { main.dataset.vistaLida = '1'; const v = lidaVista(); if (v === 'tabela' || v === 'cronologia') vista(main, v, false); }
  observar(main);
  requestAnimationFrame(() => {
    risca(main);
    /* o pedido vindo das Guias («Abrir o pedido»): aberto no seu cartão (ou na sua linha), à vista */
    let pedido: string | null = null; try { pedido = sessionStorage.getItem('goparts:abrir-pedido'); sessionStorage.removeItem('goparts:abrir-pedido'); } catch { /* nada */ }
    if (pedido && LINHAS.some((l) => l.num === pedido)) {
      const tabela = $(main, '.ped4__lista')?.dataset.vista === 'tabela';
      const el = tabela ? $(main, `tr.ped4__linha[data-num="${pedido}"]`) : $(main, `.ped4__c-item[data-num="${pedido}"]`);
      if (el?.hidden) limpar(main);
      if (el && !el.classList.contains('is-aberto')) { if (tabela) abrir(main, el); else abrirItem(main, el); }
      el?.scrollIntoView({ block: 'center', behavior: quieto() ? 'auto' : 'smooth' });
    }
    rolar(main);
  });
}

export function iniciar(): void {
  window.addEventListener('click', (ev) => {
    if (editando()) return;
    const main = vivo(); const t = ev.target as Element;
    if (!main || !main.contains(t)) return;
    const est = t.closest<HTMLElement>('.ped4__est');
    if (est) { main.dataset.filtro = est.dataset.filtro; estados(main); aplicar(main); return; }
    if (t.closest('.ped4__limpar, [data-limpar-tudo]')) { limpar(main); return; }
    const tirar = t.closest<HTMLElement>('[data-tirar]');
    const ef = t.closest<HTMLElement>('.ped4__etapa-f');
    if (ef) { main.dataset.etapa = ef.dataset.etapa; etapas(main); aplicar(main); return; }
    if (tirar) { const k = tirar.dataset.tirar!; if (k === 'etapa') { main.dataset.etapa = 'todas'; etapas(main); } else if (k === 'estado') { main.dataset.filtro = 'todos'; estados(main); } else { const i = $<HTMLInputElement>(main, `#ped4-${k}`)!; i.value = ''; i.removeAttribute('aria-invalid'); $(main, `#ped4-${k}-erro`)!.hidden = true; criterios.set(main, ler(main)); } aplicar(main); return; }
    const o = t.closest<HTMLElement>('[data-ordenar]'); if (o) { ordenar(main, o); return; }
    const ab = t.closest<HTMLElement>('.ped4__filtros-abrir'); if (ab) { const sim = ab.getAttribute('aria-expanded') !== 'true'; ab.setAttribute('aria-expanded', String(sim)); main.classList.toggle('filtros-abertos', sim); return; }
    /* «Ver guia» (ela, 15 out.: «quando clico numa guia de remessa do pedido abre um diálogo lateral»): a guia no
       painel à direita, sem sair dos Pedidos; «Abrir nas Guias de remessa» leva à página com a guia aberta */
    const vg = t.closest<HTMLElement>('[data-abrir-guia]'); if (vg) { ev.preventDefault(); ev.stopPropagation(); gavetaGuia(main, vg.dataset.abrirGuia!, vg); return; }
    const irma = t.closest<HTMLElement>('.ped4__gaveta [data-ir-guia]'); if (irma) { gavetaGuia(main, irma.dataset.irGuia!, devolver || irma); return; }
    const gp = t.closest<HTMLElement>('[data-guia-pagina]'); if (gp) { try { sessionStorage.setItem('goparts:abrir-guia', gp.dataset.guiaPagina!); } catch { /* nada */ } return; }
    const pg = t.closest<HTMLElement>('.ped4__gaveta [data-abrir-pedido]'); if (pg) { const num = pg.dataset.abrirPedido!; fecharGaveta(main); const li = $(main, `.ped4__c-item[data-num="${num}"]`); if (li && !li.hidden) { if (!li.classList.contains('is-aberto')) abrirItem(main, li); li.scrollIntoView({ block: 'center', behavior: quieto() ? 'auto' : 'smooth' }); } return; }
    const ind = t.closest<HTMLElement>('.ped4__gaveta [data-pedido-indisponivel]'); if (ind) { const n = ind.closest('.gui3__percurso')?.querySelector<HTMLElement>('.gui3__ind'); if (n) n.hidden = false; return; }
    const dg = t.closest<HTMLButtonElement>('.ped4__gaveta [data-descarregar]'); if (dg) { descarregarGuia(dg); return; }
    /* a fatura ou a página das Guias: o painel fecha antes de a navegação (data-ir) seguir */
    if (t.closest('.ped4__gaveta [data-ir]')) { const gv = $(main, '.ped4__gaveta')!; gv.hidden = true; $(main, '.ped4__veu')!.hidden = true; main.classList.remove('tem-gaveta'); fundo(main, false); return; }
    const rep = t.closest<HTMLButtonElement>('[data-repetir]'); if (rep) { repetir(rep); return; }
    const gv = t.closest<HTMLElement>('[data-gaveta]'); if (gv) { gaveta(main, gv.dataset.gaveta!, gv); return; }
    if (t.closest('.ped4__g-fechar, .ped4__veu')) { fecharGaveta(main); return; }
    const vb = t.closest<HTMLElement>('.ped4__vista'); if (vb) { vista(main, vb.dataset.vista!); return; }
    const cc = t.closest<HTMLElement>('.ped4__c-cabeca');
    if (cc) { const li = cc.closest<HTMLElement>('.ped4__c-item')!; if (li.classList.contains('is-aberto')) fecharItem(main, li); else abrirItem(main, li); return; }
    if (t.closest('.ped4__linha-det, .ped4__gaveta')) return;
    const tr = t.closest<HTMLElement>('tr.ped4__linha');
    if (tr && !t.closest('a, input')) { if (tr.classList.contains('is-aberto')) fechar(main, tr); else abrir(main, tr); }
  }, true);
  document.addEventListener('submit', (ev) => { const main = vivo(); if (main && (ev.target as Element).closest?.('.ped4__campos')) { ev.preventDefault(); pesquisar(main); } });
  document.addEventListener('keydown', (ev) => {
    const main = vivo(); if (!main || editando()) return;
    if (ev.key === 'Escape' && !$(main, '.ped4__gaveta')!.hidden) { ev.preventDefault(); fecharGaveta(main); }
  });
  document.addEventListener('input', (ev) => { const i = ev.target as HTMLInputElement; if (i.matches?.('.ped4__input[aria-invalid]')) { i.removeAttribute('aria-invalid'); const e = document.getElementById(`${i.id}-erro`); if (e) e.hidden = true; } });
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  window.addEventListener('resize', () => { const m = vivo(); if (m) { risca(m); rolar(m); } });
  document.addEventListener('scroll', aoRolar, { capture: true, passive: true });
}
