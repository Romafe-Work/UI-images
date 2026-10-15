/* =========================================================
   GOPARTS — 14 · Faturas v2: o comportamento (15 out. 2026)
   - TIPO: Todas / Fatura / Nota de crédito (o mesmo significado do GO REPAIR); a risca laranja desliza (220 ms).
     PAGAMENTO: as pílulas Paga / Em aberto / Vencida / Creditada. As contagens e os totais contam só quando mudam.
   - PESQUISAR: valida as datas (dd/mm/aaaa; a final não antes da inicial) no próprio campo e guarda o que se
     escreveu; enquanto «procura», os documentos de antes ficam esbatidos; depois saem, deslizam (FLIP) e entram.
   - CRONOLOGIA: a linha desenha-se com o scroll; o mais perto da altura de leitura fica ativo; o mês dele aparece
     ao lado da contagem; cada documento entra uma vez.
   - PAINEL: clicar numa fatura (cartão ou linha) abre-a no painel lateral (320 ms); o escolhido fica marcado a
     laranja. A «Discriminação do IVA» abre e fecha (250 ms): as linhas aparecem (sem contar, porque não mudam) e o
     que está por baixo desliza (FLIP), sem animar a altura. «Do mesmo pedido» troca a fatura no painel; «Ver
     fatura» mostra o documento no mesmo painel, com «Voltar à fatura». Esc fecha e o foco volta ao cartão.
   Os filtros ficam guardados durante a visita (sessionStorage). Com «reduzir movimento», tudo troca sem deslizar.
   ========================================================= */
import { FATURAS } from '../portal/faturas-dados';
import { euros } from '../portal/guias-dados';
import { faturaDe, detalheFatura, cabecaFatura, cabecaDocFatura, paginaFatura, rodapeDocFatura, ehCredito, somaFaturado, somaCreditos, somaAberto, L, ICONES_F } from '../portal/faturas-v2';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import { kpi, kpiEntrada } from './kpi';
import x from 'lucide-static/icons/x.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';

const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SAIDA = 'cubic-bezier(.22, 1, .36, 1)';
const vivo = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal--fat2:not(.portal--estado) .fat2');
const $ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => Array.from(r.querySelectorAll<T>(s));
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const FILTROS = 'goparts:faturas-filtros';
let nr = 0;

/* ---------- os critérios ---------- */
interface Criterios { de: string; ate: string; num: string }
const criterios = new WeakMap<HTMLElement, Criterios>();
const ler = (main: HTMLElement): Criterios => ({ de: $<HTMLInputElement>(main, '#fat2-de')!.value.trim(), ate: $<HTMLInputElement>(main, '#fat2-ate')!.value.trim(), num: $<HTMLInputElement>(main, '#fat2-num')!.value.trim() });
const data = (s: string) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s); if (!m) return NaN; const d = new Date(+m[3], +m[2] - 1, +m[1]); return d.getMonth() === +m[2] - 1 ? +`${m[3]}${m[2]}${m[1]}` : NaN; };
const simples = (s: string) => s.toLowerCase().replace(/[\s/.-]/g, '');
function passa(num: string, c: Criterios, tipo: string, pag = 'todas'): boolean {
  const f = faturaDe(num), d = +f.guia.data.split('/').reverse().join('');
  if (tipo !== 'todos' && f.guia.tipo !== tipo) return false;
  if (pag !== 'todas' && f.pagamento !== pag) return false;
  if (c.de && d < data(c.de)) return false;
  if (c.ate && d > data(c.ate)) return false;
  if (c.num && !simples(num).includes(simples(c.num))) return false;
  return true;
}
function validar(main: HTMLElement): boolean {
  const erro = (cid: string, msg: string) => { const i = $<HTMLInputElement>(main, `#${cid}`)!, e = $(main, `#${cid}-erro`)!; if (msg) { i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', `${cid}-erro`); e.textContent = msg; e.hidden = false; } else { i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); e.hidden = true; } return !msg; };
  const c = ler(main);
  const ok1 = erro('fat2-de', c.de && Number.isNaN(data(c.de)) ? 'Escreva a data como dd/mm/aaaa.' : '');
  const ok2 = erro('fat2-ate', c.ate && Number.isNaN(data(c.ate)) ? 'Escreva a data como dd/mm/aaaa.' : c.de && c.ate && data(c.ate) < data(c.de) ? 'A data final é antes da inicial.' : '');
  if (!ok1 || !ok2) $<HTMLInputElement>(main, '[aria-invalid="true"]')?.focus();
  return ok1 && ok2;
}

/* ---------- os números que contam (só quando mudam) ---------- */
function contar(el: HTMLElement | null, para: number, fmt: (n: number) => string): void {
  if (!el) return;
  const de = Number(el.dataset.valor ?? para);
  el.dataset.valor = String(para);
  if (quieto() || de === para) { el.textContent = fmt(para); return; }
  const t0 = performance.now(), dur = 320;
  const passo = (t: number) => { const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 3; el.textContent = fmt(de + (para - de) * e); if (k < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}
const inteiro = (n: number) => String(Math.round(n));
const marcar = (texto: string, q: string) => {
  if (!q) return texto;
  const s = simples(q), alvo = simples(texto); const i = alvo.indexOf(s); if (i < 0) return texto;
  const pos: number[] = []; for (let k = 0; k < texto.length; k++) if (!/[\s/.-]/.test(texto[k])) pos.push(k);
  const a = pos[i], b = pos[i + s.length - 1] + 1;
  return `${texto.slice(0, a)}<mark>${texto.slice(a, b)}</mark>${texto.slice(b)}`;
};

/* ---------- aplicar os filtros (cronologia e tabela) ---------- */
function aplicar(main: HTMLElement, animar = true): void {
  const c = criterios.get(main) || ler(main);
  const tipo = main.dataset.filtro || 'todos', pag = main.dataset.etapa || 'todas';
  const cr = $(main, '.ped4__crono')!, itens = $$(cr, '.ped4__c-item');
  const mexer = animar && !quieto() && itens.length <= 40;
  const antes = new Map(itens.filter((li) => !li.hidden).map((li) => [li, li.getBoundingClientRect().top]));
  const entram: HTMLElement[] = [];
  itens.forEach((li) => {
    const num = li.dataset.num!, sim = passa(num, c, tipo, pag);
    if (sim && li.hidden) entram.push(li);
    li.hidden = !sim;
    $(li, '.ped4__ref')!.innerHTML = marcar(num, c.num);
  });
  $$(cr, '.ped4__mes').forEach((m) => { const n = $$(m, '.ped4__c-item:not([hidden])').length; m.hidden = !n; $(m, '.ped4__mes-t small')!.innerHTML = `<b>${n}</b> ${n === 1 ? 'documento' : 'documentos'}`; });
  $$(cr, '.gui3__ano').forEach((h) => { let n = 0; for (let s = h.nextElementSibling; s && !s.classList.contains('gui3__ano'); s = s.nextElementSibling) if (s.classList.contains('ped4__mes') && !(s as HTMLElement).hidden) n++; h.hidden = !n; });
  const vis = itens.filter((li) => !li.hidden);
  cr.hidden = !vis.length;
  $$(main, 'tr.ped4__linha').forEach((tr) => { tr.hidden = !passa(tr.dataset.num!, c, tipo, pag); $(tr, '.ped4__ref')!.innerHTML = marcar(tr.dataset.num!, c.num); });
  const tab = $(main, '.ped4__tabela'); if (tab) tab.hidden = !vis.length;
  if (mexer) {
    vis.filter((li) => antes.has(li)).forEach((li) => { const dy = antes.get(li)! - li.getBoundingClientRect().top; if (dy) li.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 260, easing: SAIDA }); });
    entram.forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateX(-12px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: Math.min(i, 6) * 30, easing: SAIDA, fill: 'backwards' }));
  }
  const fs = vis.map((li) => faturaDe(li.dataset.num!));
  contar($(main, '.ped4__conta b'), vis.length, inteiro);
  kpi($(main, '[data-kpi="n"]'), vis.length, inteiro);
  kpi($(main, '[data-kpi="faturado"]'), somaFaturado(fs), euros);
  kpi($(main, '[data-kpi="creditos"]'), somaCreditos(fs), euros);
  kpi($(main, '[data-kpi="aberto"]'), somaAberto(fs), euros);
  $$(main, '.ped4__est').forEach((b) => { $(b, '.ped4__est-n')!.textContent = String(FATURAS.filter((f) => passa(f.num, c, b.dataset.filtro!, pag)).length); });
  $$(main, '.ped4__etapa-f').forEach((b) => { $(b, '.ped4__est-n')!.textContent = String(FATURAS.filter((f) => passa(f.num, c, tipo, b.dataset.etapa!)).length); });
  etiquetas(main, c);
  guardarFiltros(main);
  const vazio = $(main, '.ped4__vazio')!;
  vazio.hidden = vis.length > 0;
  if (!vis.length) vazio.innerHTML = `<p><strong>Nenhum documento com estes filtros.</strong> Alargue as datas ou tire um filtro; ${FATURAS.length} documentos no total.</p><button type="button" class="btn btn--ghost btn--sm" data-limpar-tudo>${L(rotateCcw, 'btn__icone')}<span class="btn__rotulo">Limpar filtros</span></button>`;
  requestAnimationFrame(() => rolar(main));
}
const NOMES_PAG: Record<string, string> = { paga: 'Paga', aberto: 'Em aberto', vencida: 'Vencida', creditada: 'Creditada' };
function etiquetas(main: HTMLElement, c: Criterios): void {
  const itens: [string, string][] = [];
  if (c.de) itens.push(['de', `Desde ${c.de}`]); if (c.ate) itens.push(['ate', `Até ${c.ate}`]);
  if (c.num) itens.push(['num', `Documento «${c.num}»`]);
  const t = main.dataset.filtro || 'todos'; if (t !== 'todos') itens.push(['tipo', t === 'fatura' ? 'Fatura' : 'Nota de crédito']);
  const p = main.dataset.etapa || 'todas'; if (p !== 'todas') itens.push(['etapa', NOMES_PAG[p]]);
  $(main, '.ped4__chips')!.innerHTML = itens.map(([k, txt]) => `<li><span>${txt}</span><button type="button" class="ped4__chip-x" data-tirar="${k}" aria-label="Tirar o filtro ${txt}">${L(x)}</button></li>`).join('');
  const n = $(main, '.ped4__filtros-n')!; n.textContent = String(itens.length); n.hidden = !itens.length;
}
/* os filtros ficam durante a visita (o briefing: «manter o estado dos filtros durante a navegação») */
function guardarFiltros(main: HTMLElement): void {
  try { sessionStorage.setItem(FILTROS, JSON.stringify({ ...(criterios.get(main) || ler(main)), tipo: main.dataset.filtro || 'todos', pag: main.dataset.etapa || 'todas' })); } catch { /* só nesta página */ }
}
function repor(main: HTMLElement): boolean {
  let f: (Criterios & { tipo: string; pag: string }) | null = null;
  try { f = JSON.parse(sessionStorage.getItem(FILTROS) || 'null'); } catch { f = null; }
  if (!f) return false;
  $<HTMLInputElement>(main, '#fat2-de')!.value = f.de; $<HTMLInputElement>(main, '#fat2-ate')!.value = f.ate; $<HTMLInputElement>(main, '#fat2-num')!.value = f.num;
  main.dataset.filtro = f.tipo; main.dataset.etapa = f.pag; tipos(main); etapas(main);
  criterios.set(main, ler(main));
  return true;
}
function pesquisar(main: HTMLElement): void {
  if (!validar(main)) return;
  const b = $<HTMLButtonElement>(main, '.ped4__pesquisar')!; if (b.getAttribute('aria-busy') === 'true') return;
  const antes = b.innerHTML, aviso = $(main, '.ped4__a-atualizar')!, cr = $(main, '.ped4__crono')!;
  b.setAttribute('aria-busy', 'true'); b.innerHTML = `${rolamentoSvg('f2-' + ++nr, 'pesquisar', 'ped4__rs')}<span class="btn__rotulo">A pesquisar…</span>`;
  aviso.innerHTML = `${rolamentoSvg('f2-' + ++nr, 'pesquisar', 'ped4__rs')}A atualizar…`; aviso.hidden = false; cr.classList.add('is-a-atualizar');
  window.setTimeout(() => {
    criterios.set(main, ler(main));
    b.removeAttribute('aria-busy'); b.innerHTML = antes; aviso.hidden = true; cr.classList.remove('is-a-atualizar');
    aplicar(main);
  }, quieto() ? 120 : 450);
}
function limpar(main: HTMLElement): void {
  $$<HTMLInputElement>(main, '.ped4__input').forEach((i) => { i.value = ''; i.removeAttribute('aria-invalid'); });
  $$(main, '.ped4__erro').forEach((e) => { e.hidden = true; });
  main.dataset.filtro = 'todos'; tipos(main); main.dataset.etapa = 'todas'; etapas(main);
  criterios.set(main, ler(main));
  aplicar(main);
}
function tipos(main: HTMLElement): void {
  const f = main.dataset.filtro || 'todos';
  $$(main, '.ped4__est').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtro === f)));
  risca(main);
}
function etapas(main: HTMLElement): void {
  const f = main.dataset.etapa || 'todas';
  $$(main, '.ped4__etapa-f').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.etapa === f)));
}
function risca(main: HTMLElement): void {
  const a = $(main, '.ped4__est[aria-pressed="true"]'), r = $(main, '.ped4__est-risca'); if (!a || !r) return;
  r.style.setProperty('--x', `${a.offsetLeft}px`); r.style.setProperty('--w', `${a.offsetWidth}px`);
}

/* ---------- a cronologia com o scroll ---------- */
function rolar(main: HTMLElement): void {
  const cr = $(main, '.ped4__crono'); if (!cr || cr.hidden || $(main, '.ped4__lista')?.dataset.vista !== 'cronologia') return;
  const r = cr.getBoundingClientRect(), leitura = innerHeight * 0.55;
  cr.style.setProperty('--prog', Math.max(0, Math.min(1, (leitura - r.top) / Math.max(1, r.height))).toFixed(4));
  let ativo: HTMLElement | null = null, melhor = Infinity;
  $$(cr, '.ped4__c-item:not([hidden])').forEach((li) => {
    const t = li.getBoundingClientRect().top + 22;
    li.classList.toggle('is-passado', t <= leitura);
    const d = Math.abs(t - leitura); if (t <= leitura + 40 && d < melhor) { melhor = d; ativo = li; }
  });
  const escolhido = $(cr, '.ped4__c-item.is-aberto'); if (escolhido) ativo = escolhido;
  $$(cr, '.ped4__c-item.is-ativo').forEach((li) => { if (li !== ativo && !li.classList.contains('is-aberto')) li.classList.remove('is-ativo'); });
  const a = ativo as HTMLElement | null; a?.classList.add('is-ativo');
  const ind = $(main, '.gui3__mes-atual');
  if (ind) { const [, m, y] = (a ? faturaDe(a.dataset.num!).guia.data : '').split('/'); const t = m ? `${MESES[+m - 1]} de ${y}` : ''; if (ind.textContent !== t) { ind.textContent = t; if (t && !quieto()) ind.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: SAIDA }); } }
}
let pedidoRolar = 0;
const aoRolar = () => { if (pedidoRolar) return; pedidoRolar = requestAnimationFrame(() => { pedidoRolar = 0; const m = vivo(); if (m) rolar(m); }); };
const entrada = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-entrou'); entrada?.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
function observar(main: HTMLElement): void {
  const itens = $$(main, '.ped4__c-item:not(.is-entrou), .gui3__ano:not(.is-entrou), .ped4__mes-t:not(.is-entrou)');
  if (quieto() || !entrada || itens.length > 60) { itens.forEach((li) => li.classList.add('is-entrou')); return; }
  itens.forEach((li) => entrada.observe(li));
}

/* ---------- a tabela e a vista ---------- */
function ordenar(main: HTMLElement, b: HTMLElement): void {
  const th = b.closest('th')!, k = b.dataset.ordenar!, sobe = th.getAttribute('aria-sort') !== 'ascending';
  $$(main, 'thead th[aria-sort]').forEach((t) => t.setAttribute('aria-sort', 'none'));
  th.setAttribute('aria-sort', sobe ? 'ascending' : 'descending');
  const corpo = $(main, '.ped4__tabela tbody')!, linhas = $$(corpo, 'tr.ped4__linha');
  const antes = new Map(linhas.map((l) => [l, l.getBoundingClientRect().top]));
  const v = (l: HTMLElement) => k === 'num' ? l.dataset.num! : Number(k === 'data' ? l.dataset.data : l.dataset.total);
  linhas.sort((a, c) => { const x1 = v(a), x2 = v(c); const d = typeof x1 === 'number' ? x1 - (x2 as number) : x1.localeCompare(String(x2), 'pt', { numeric: true }); return sobe ? d : -d; });
  linhas.forEach((l) => corpo.append(l));
  if (quieto() || linhas.length > 40) return;
  linhas.forEach((l) => { const dy = antes.get(l)! - l.getBoundingClientRect().top; if (dy && !l.hidden) l.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 240, easing: SAIDA }); });
}
const lidaVista = () => { try { return localStorage.getItem('goparts-faturas-vista'); } catch { return null; } };
function vista(main: HTMLElement, v: string, guardarJa = true): void {
  $(main, '.ped4__lista')!.dataset.vista = v;
  $$(main, '.ped4__vista').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vista === v)));
  if (guardarJa) try { localStorage.setItem('goparts-faturas-vista', v); } catch { /* só nesta visita */ }
  if (!quieto() && guardarJa) $(main, v === 'tabela' ? '.ped4__tabela' : '.ped4__crono')?.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: SAIDA });
  observar(main); requestAnimationFrame(() => rolar(main));
}

/* ---------- o painel ---------- */
function fundo(main: HTMLElement, inerte: boolean): void {
  const portal = main.closest('.portal')!;
  [...$$(portal, ':scope > header, :scope > nav'), ...$$(main, ':scope > header, :scope > section')].forEach((el) => { el.inert = inerte; if (inerte) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden'); });
}
let devolver: HTMLElement | null = null;
function marcarEscolhida(main: HTMLElement, num: string): void {
  $$(main, '.ped4__c-item.is-aberto, tr.ped4__linha.is-aberto').forEach((el) => el.classList.remove('is-aberto'));
  if (!num) return;
  $$(main, `.ped4__c-item[data-num="${num}"], tr.ped4__linha[data-num="${num}"]`).forEach((el) => { el.classList.add('is-aberto'); if (el.matches('.ped4__c-item')) el.classList.add('is-ativo'); });
}
function painelFatura(main: HTMLElement, num: string, origem: HTMLElement | null): void {
  const f = faturaDe(num), gv = $(main, '.fat2__gaveta')!, veu = $(main, '.ped4__veu')!, jaAberto = !gv.hidden;
  if (origem) devolver = origem;
  marcarEscolhida(main, num);
  gv.innerHTML = `${cabecaFatura(f)}<div class="ped4__g-guia">${detalheFatura(f)}</div>`;
  gv.hidden = false; veu.hidden = false; main.classList.add('tem-gaveta'); fundo(main, true);
  gv.scrollTop = 0;
  if (!quieto()) {
    if (!jaAberto) gv.animate([{ transform: 'translateX(32px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: SAIDA });
    else $(gv, '.ped4__g-guia')?.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: SAIDA });
    /* o que é revelado aparece (não conta: os valores não mudam); o fio do percurso desenha-se */
    $$(gv, '.fat2__disc .gui3__v, .fat2__iva-t tbody tr').forEach((r, i) => r.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: 80 + i * 35, easing: SAIDA, fill: 'backwards' }));
    $$(gv, '.gui3__fio').forEach((fi, i) => fi.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 450, delay: 260 + i * 220, easing: SAIDA, fill: 'backwards' }));
  }
  window.setTimeout(() => $(gv, '.ped4__g-num')?.focus(), quieto() ? 0 : 60);
}
/** A discriminação do IVA abre e fecha: o conteúdo aparece; o que está por baixo desliza (FLIP), sem animar a altura. */
function alternarIva(b: HTMLElement): void {
  const corpo = document.getElementById(b.getAttribute('aria-controls')!)!, abre = b.getAttribute('aria-expanded') !== 'true';
  const caixa = b.closest('.ped4__g-guia, .gui3__det') || document.body;
  const depois = $$(caixa, '.fat2__fim, section').filter((el) => b.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING && !el.contains(b));
  const antes = new Map(depois.map((el) => [el, el.getBoundingClientRect().top]));
  b.setAttribute('aria-expanded', String(abre)); corpo.hidden = !abre;
  if (quieto()) return;
  depois.forEach((el) => { const dy = antes.get(el)! - el.getBoundingClientRect().top; if (dy) el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 250, easing: SAIDA }); });
  if (abre) $$(corpo, 'tr, .fat2__iva-nota').forEach((r, i) => r.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: i * 40, easing: SAIDA, fill: 'backwards' }));
}
function verDoc(main: HTMLElement, num: string, origem: HTMLElement): void {
  const f = faturaDe(num), gv = $(main, '.fat2__gaveta')!, veu = $(main, '.ped4__veu')!, daFatura = !gv.hidden;
  if (!daFatura) devolver = origem;
  gv.innerHTML = `${cabecaDocFatura(f)}${daFatura ? `<p class="gui3__g-voltar"><button type="button" class="gui3__voltar" data-voltar-fatura="${f.num}">${L(arrowLeft)}Voltar à ${ehCredito(f) ? 'nota de crédito' : 'fatura'}</button></p>` : ''}<div class="gui3__g-corpo"><p class="gui3__g-carga" role="status">${rolamentoSvg('f2-' + ++nr, 'carregar', 'ped4__rs')}A abrir o documento…</p></div>${rodapeDocFatura(f)}`;
  gv.hidden = false; veu.hidden = false; main.classList.add('tem-gaveta'); fundo(main, true); gv.scrollTop = 0;
  if (!quieto() && !daFatura) gv.animate([{ transform: 'translateX(32px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: SAIDA });
  $(gv, '.ped4__g-num')?.focus();
  window.setTimeout(() => { if (gv.hidden) return; const c = $(gv, '.gui3__g-corpo'); if (!c) return; c.innerHTML = paginaFatura(f); if (!quieto()) c.firstElementChild?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' }); }, quieto() ? 0 : 500);
}
function fecharPainel(main: HTMLElement, devolverFoco = true): void {
  const gv = $(main, '.fat2__gaveta')!; if (gv.hidden) return;
  const fim = () => { gv.hidden = true; $(main, '.ped4__veu')!.hidden = true; main.classList.remove('tem-gaveta'); fundo(main, false); marcarEscolhida(main, ''); requestAnimationFrame(() => rolar(main)); if (devolverFoco) devolver?.focus(); };
  if (quieto() || !devolverFoco) { fim(); return; }
  gv.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(32px)', opacity: 0 }], { duration: 220, easing: 'ease-in' }).finished.then(fim, fim);
}
function descarregar(b: HTMLButtonElement): void {
  if (b.getAttribute('aria-busy') === 'true') return;
  const antes = b.innerHTML, num = b.dataset.descarregar!, aviso = b.closest('.gui3__det-artigos, .gui3__g-pe')?.querySelector<HTMLElement>('.gui3__descarga');
  b.setAttribute('aria-busy', 'true'); b.innerHTML = `${rolamentoSvg('f2-' + ++nr, 'pesquisar', 'ped4__rs')}<span class="btn__rotulo">A preparar o PDF…</span>`;
  window.setTimeout(() => {
    b.removeAttribute('aria-busy'); b.classList.add('is-feito');
    b.innerHTML = `${ICONES_F.check}<span class="btn__rotulo">PDF descarregado</span>`;
    if (aviso) { aviso.hidden = false; aviso.innerHTML = `${ICONES_F.fileText}<span>${num.replace('/', '-')}.pdf · na pasta das transferências</span>`; }
    window.setTimeout(() => { b.classList.remove('is-feito'); b.innerHTML = antes; }, 2400);
  }, quieto() ? 150 : 800);
}

/* ---------- ligar ---------- */
function armar(): void {
  const main = vivo(); if (!main) return;
  if (!main.dataset.filtro) main.dataset.filtro = 'todos';
  if (!main.dataset.reposto) { main.dataset.reposto = '1'; if (repor(main)) aplicar(main, false); }
  if (!criterios.has(main)) criterios.set(main, ler(main));
  if (!main.dataset.entrou) { main.dataset.entrou = '1'; if (!quieto()) main.classList.add('ped4--entrar'); kpiEntrada(main, { n: inteiro, faturado: euros, creditos: euros, aberto: euros }); window.setTimeout(() => main.classList.remove('ped4--entrar'), 900); }
  if (!main.dataset.vistaLida) { main.dataset.vistaLida = '1'; const v = lidaVista(); if (v === 'tabela' || v === 'cronologia') vista(main, v, false); }
  observar(main);
  requestAnimationFrame(() => {
    risca(main);
    /* a fatura pedida noutro ecrã (Guias, Pedidos): aberta no painel, à vista na lista */
    let pedida: string | null = null; try { pedida = sessionStorage.getItem('goparts:abrir-fatura'); sessionStorage.removeItem('goparts:abrir-fatura'); } catch { /* nada */ }
    if (pedida && FATURAS.some((f) => f.num === pedida)) {
      let el = $(main, `.ped4__c-item[data-num="${pedida}"]`); if (el?.hidden) { limpar(main); el = $(main, `.ped4__c-item[data-num="${pedida}"]`); }
      el?.scrollIntoView({ block: 'center' });
      painelFatura(main, pedida, el ? $(el, '.ped4__c-cabeca') : null);
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
    if (est) { main.dataset.filtro = est.dataset.filtro; tipos(main); aplicar(main); return; }
    const ef = t.closest<HTMLElement>('.ped4__etapa-f');
    if (ef) { main.dataset.etapa = ef.dataset.etapa; etapas(main); aplicar(main); return; }
    if (t.closest('.ped4__limpar, [data-limpar-tudo]')) { limpar(main); return; }
    const tirar = t.closest<HTMLElement>('[data-tirar]');
    if (tirar) { const k = tirar.dataset.tirar!; if (k === 'etapa') { main.dataset.etapa = 'todas'; etapas(main); } else if (k === 'tipo') { main.dataset.filtro = 'todos'; tipos(main); } else { const i = $<HTMLInputElement>(main, `#fat2-${k}`)!; i.value = ''; i.removeAttribute('aria-invalid'); $(main, `#fat2-${k}-erro`)!.hidden = true; criterios.set(main, ler(main)); } aplicar(main); return; }
    const ab = t.closest<HTMLElement>('.ped4__filtros-abrir'); if (ab) { const sim = ab.getAttribute('aria-expanded') !== 'true'; ab.setAttribute('aria-expanded', String(sim)); main.classList.toggle('filtros-abertos', sim); return; }
    const o = t.closest<HTMLElement>('[data-ordenar]'); if (o) { ordenar(main, o); return; }
    const vb = t.closest<HTMLElement>('.ped4__vista'); if (vb) { vista(main, vb.dataset.vista!); return; }
    const iv = t.closest<HTMLElement>('.fat2__iva-abrir'); if (iv) { alternarIva(iv); return; }
    const irma = t.closest<HTMLElement>('[data-ir-fatura]'); if (irma) { painelFatura(main, irma.dataset.irFatura!, null); return; }
    const vf = t.closest<HTMLElement>('[data-voltar-fatura]'); if (vf) { painelFatura(main, vf.dataset.voltarFatura!, null); return; }
    const ind = t.closest<HTMLElement>('[data-pedido-indisponivel]');
    if (ind) { const p = ind.closest('.gui3__percurso')?.querySelector<HTMLElement>('.gui3__ind'); if (p) { p.hidden = false; if (!quieto()) p.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: SAIDA }); } return; }
    /* a guia ou o pedido noutro ecrã: abre lá no painel; este fecha antes de a navegação (data-ir) seguir */
    const fora = t.closest<HTMLElement>('.fat2__gaveta [data-ir]');
    if (fora) { try { if (fora.dataset.abrirGuiaPagina) sessionStorage.setItem('goparts:abrir-guia', fora.dataset.abrirGuiaPagina); if (fora.dataset.abrirPedidoPagina) sessionStorage.setItem('goparts:abrir-pedido', fora.dataset.abrirPedidoPagina); } catch { /* nada */ } fecharPainel(main, false); return; }
    const vd = t.closest<HTMLElement>('[data-ver-doc]'); if (vd) { verDoc(main, vd.dataset.verDoc!, vd); return; }
    const dl = t.closest<HTMLButtonElement>('[data-descarregar]'); if (dl) { descarregar(dl); return; }
    if (t.closest('.ped4__g-fechar, .ped4__veu')) { fecharPainel(main); return; }
    const cc = t.closest<HTMLElement>('.ped4__c-cabeca');
    if (cc) { const li = cc.closest<HTMLElement>('.ped4__c-item')!; if (!li.classList.contains('ped4__c-esq')) painelFatura(main, li.dataset.num!, cc); return; }
    if (t.closest('.fat2__gaveta')) return;
    const tr = t.closest<HTMLElement>('tr.ped4__linha');
    if (tr && !t.closest('a, input')) painelFatura(main, tr.dataset.num!, $(tr, '.ped4__abrir') ?? tr);
  }, true);
  document.addEventListener('submit', (ev) => { const main = vivo(); if (main && (ev.target as Element).closest?.('#fat2-campos')) { ev.preventDefault(); pesquisar(main); } });
  document.addEventListener('keydown', (ev) => { const main = vivo(); if (!main || editando()) return; if (ev.key === 'Escape' && !$(main, '.fat2__gaveta')!.hidden) { ev.preventDefault(); fecharPainel(main); } });
  document.addEventListener('input', (ev) => { const i = ev.target as HTMLInputElement; if (i.matches?.('.fat2 .ped4__input[aria-invalid]')) { i.removeAttribute('aria-invalid'); const e = document.getElementById(`${i.id}-erro`); if (e) e.hidden = true; } });
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  window.addEventListener('resize', () => { const m = vivo(); if (m) { risca(m); rolar(m); } });
  document.addEventListener('scroll', aoRolar, { capture: true, passive: true });
}
