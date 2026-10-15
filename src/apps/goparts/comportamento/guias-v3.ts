/* =========================================================
   GOPARTS — 13 · Guias de remessa v3: o comportamento (15 out. 2026)
   - TIPO: Todos / Fatura / Nota de crédito filtram logo (o mesmo significado do GO REPAIR); a risca laranja
     desliza (220 ms); as contagens e o total contam até ao número novo, só quando mudam.
   - PESQUISAR: valida as datas (dd/mm/aaaa; a final não antes da inicial), diz o erro no próprio campo e guarda
     o que se escreveu. Enquanto «procura», as guias de antes ficam esbatidas e o rolamento diz «A atualizar…»;
     depois as que saem desvanecem, as que ficam deslizam (FLIP) e as novas entram. Etiquetas com ×.
   - CRONOLOGIA: a linha desenha-se com o scroll (scaleY); as guias acima da altura de leitura acendem; a mais
     perto fica ativa (laranja) e o mês dela aparece ao lado da contagem; cada guia entra uma vez.
   - ABRIR (ela, 15 out.: «os diálogos que te pedi quando clico num pedido ou guias de remessa»): clicar numa guia,
     no cartão ou na linha, abre-a no painel lateral (300 ms); o escolhido fica marcado a laranja; o fio do percurso
     documental desenha-se (450 ms) e os valores contam. «Do mesmo pedido» troca a guia no painel. O pedido abre
     nos Pedidos (no painel deles); o que não existe diz porquê.
   - DOCUMENTO: «Ver documento» passa ao documento no mesmo painel, com «Voltar à guia»; «Descarregar PDF»
     espera e confirma. Esc fecha e o foco volta ao cartão.
   A guia aberta fica guardada na visita (sessionStorage): ao voltar ao ecrã, abre-se outra vez.
   Com «reduzir movimento», tudo troca sem deslizar. Não há servidor: as esperas são de menos de 1 s.
   ========================================================= */
import { GUIAS, euros } from '../portal/guias-dados';
import { estadoGuia, guiaDe, detalheGuia, cabecaGuia, cabecaDoc, paginaDoc, rodapeDoc, L, ICONES3 } from '../portal/guias-v3';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import { kpi, kpiEntrada } from './kpi';
import { mostrar } from '../../../comum/ecras';
import x from 'lucide-static/icons/x.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';

const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SAIDA = 'cubic-bezier(.22, 1, .36, 1)';
const vivo = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal--gui3:not(.portal--estado) .gui3');
const $ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => Array.from(r.querySelectorAll<T>(s));
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const GUARDADA = 'goparts:guia-aberta';
const guardar = (num: string) => { try { if (num) sessionStorage.setItem(GUARDADA, num); else sessionStorage.removeItem(GUARDADA); } catch { /* só nesta página */ } };
const lerGuardada = () => { try { return sessionStorage.getItem(GUARDADA); } catch { return null; } };
let nr = 0;

/* ---------- os critérios ---------- */
interface Criterios { de: string; ate: string; num: string; ref: string }
const criterios = new WeakMap<HTMLElement, Criterios>();
const ler = (main: HTMLElement): Criterios => ({ de: $<HTMLInputElement>(main, '#gui3-de')!.value.trim(), ate: $<HTMLInputElement>(main, '#gui3-ate')!.value.trim(), num: $<HTMLInputElement>(main, '#gui3-num')!.value.trim(), ref: $<HTMLInputElement>(main, '#gui3-ref')!.value.trim() });
const data = (s: string) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s); if (!m) return NaN; const d = new Date(+m[3], +m[2] - 1, +m[1]); return d.getMonth() === +m[2] - 1 ? +`${m[3]}${m[2]}${m[1]}` : NaN; };
const simples = (s: string) => s.toLowerCase().replace(/[\s/.-]/g, '');
function passa(num: string, c: Criterios, tipo: string, est = 'todas'): boolean {
  const g = guiaDe(num), d = +g.data.split('/').reverse().join('');
  if (tipo !== 'todos' && g.tipo !== tipo) return false;
  if (est !== 'todas' && estadoGuia(g)?.k !== est) return false;
  if (c.de && d < data(c.de)) return false;
  if (c.ate && d > data(c.ate)) return false;
  if (c.num && !simples(num).includes(simples(c.num))) return false;
  if (c.ref && !g.linhas.some((l) => simples(l[1]).includes(simples(c.ref)))) return false;
  return true;
}
function validar(main: HTMLElement): boolean {
  const erro = (cid: string, msg: string) => { const i = $<HTMLInputElement>(main, `#${cid}`)!, e = $(main, `#${cid}-erro`)!; if (msg) { i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', `${cid}-erro`); e.textContent = msg; e.hidden = false; } else { i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); e.hidden = true; } return !msg; };
  const c = ler(main);
  const ok1 = erro('gui3-de', c.de && Number.isNaN(data(c.de)) ? 'Escreva a data como dd/mm/aaaa.' : '');
  const ok2 = erro('gui3-ate', c.ate && Number.isNaN(data(c.ate)) ? 'Escreva a data como dd/mm/aaaa.' : c.de && c.ate && data(c.ate) < data(c.de) ? 'A data final é antes da inicial.' : '');
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

/* ---------- aplicar os filtros à cronologia ---------- */
function aplicar(main: HTMLElement, animar = true): void {
  const c = criterios.get(main) || ler(main);
  const tipo = main.dataset.filtro || 'todos', est = main.dataset.etapa || 'todas';
  const cr = $(main, '.ped4__crono')!, itens = $$(cr, '.ped4__c-item');
  const mexer = animar && !quieto() && itens.length <= 40;
  const antes = new Map(itens.filter((li) => !li.hidden).map((li) => [li, li.getBoundingClientRect().top]));
  const entram: HTMLElement[] = [];
  itens.forEach((li) => {
    const num = li.dataset.num!, sim = passa(num, c, tipo, est);
    if (sim && li.hidden) entram.push(li);
    if (!sim && li.classList.contains('is-aberto')) fecharItem(main, li, false);
    li.hidden = !sim;
    $(li, '.ped4__ref')!.innerHTML = marcar(num, c.num);
    const enc = $(li, '.ped4__c-encontrado')!, art = c.ref ? guiaDe(num).linhas.find((l) => simples(l[1]).includes(simples(c.ref))) : undefined;
    enc.hidden = !art; enc.innerHTML = art ? `Contém ${marcar(art[1], c.ref)}` : '';
  });
  $$(cr, '.ped4__mes').forEach((m) => { const n = $$(m, '.ped4__c-item:not([hidden])').length; m.hidden = !n; $(m, '.ped4__mes-t small')!.innerHTML = `<b>${n}</b> ${n === 1 ? 'documento' : 'documentos'}`; });
  $$(cr, '.gui3__ano').forEach((h) => { let n = 0; for (let s = h.nextElementSibling; s && !s.classList.contains('gui3__ano'); s = s.nextElementSibling) if (s.classList.contains('ped4__mes') && !(s as HTMLElement).hidden) n++; h.hidden = !n; });
  const vis = itens.filter((li) => !li.hidden);
  cr.hidden = !vis.length;
  /* a tabela segue os mesmos filtros */
  $$(main, 'tr.ped4__linha').forEach((tr) => { const sim = passa(tr.dataset.num!, c, tipo, est); if (!sim && tr.classList.contains('is-aberto')) fecharLinha(tr); tr.hidden = !sim; $(tr, '.ped4__ref')!.innerHTML = marcar(tr.dataset.num!, c.num); });
  const tab = $(main, '.ped4__tabela'); if (tab) tab.hidden = !vis.length;
  if (mexer) {
    vis.filter((li) => antes.has(li)).forEach((li) => { const dy = antes.get(li)! - li.getBoundingClientRect().top; if (dy) li.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 260, easing: SAIDA }); });
    entram.forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateX(-12px)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: Math.min(i, 6) * 30, easing: SAIDA, fill: 'backwards' }));
  }
  /* as contagens: as do cabeçalho, a do topo da lista e as do seletor */
  contar($(main, '.ped4__conta b'), vis.length, inteiro);
  kpi($(main, '[data-kpi="n"]'), vis.length, inteiro);
  kpi($(main, '[data-kpi="f"]'), vis.filter((li) => li.dataset.tipo === 'fatura').length, inteiro);
  kpi($(main, '[data-kpi="c"]'), vis.filter((li) => li.dataset.tipo === 'credito').length, inteiro);
  kpi($(main, '[data-kpi="total"]'), vis.reduce((s, li) => s + Number(li.dataset.total), 0), euros);
  $$(main, '.ped4__est').forEach((b) => { $(b, '.ped4__est-n')!.textContent = String(GUIAS.filter((g) => passa(g.num, c, b.dataset.filtro!, est)).length); });
  $$(main, '.ped4__etapa-f').forEach((b) => { $(b, '.ped4__est-n')!.textContent = String(GUIAS.filter((g) => passa(g.num, c, tipo, b.dataset.etapa!)).length); });
  etiquetas(main, c);
  const vazio = $(main, '.ped4__vazio')!;
  vazio.hidden = vis.length > 0;
  if (!vis.length) vazio.innerHTML = `<p><strong>Nenhum documento com estes filtros.</strong> Alargue as datas ou tire um filtro; ${GUIAS.length} documentos no total.</p><button type="button" class="btn btn--ghost btn--sm" data-limpar-tudo>${L(rotateCcw, 'btn__icone')}<span class="btn__rotulo">Limpar filtros</span></button>`;
  requestAnimationFrame(() => rolar(main));
}
function etiquetas(main: HTMLElement, c: Criterios): void {
  const itens: [string, string][] = [];
  if (c.de) itens.push(['de', `Desde ${c.de}`]); if (c.ate) itens.push(['ate', `Até ${c.ate}`]);
  if (c.num) itens.push(['num', `Guia «${c.num}»`]); if (c.ref) itens.push(['ref', `Referência «${c.ref}»`]);
  const t = main.dataset.filtro || 'todos'; if (t !== 'todos') itens.push(['tipo', t === 'fatura' ? 'Fatura' : 'Nota de crédito']);
  const e = main.dataset.etapa || 'todas'; if (e !== 'todas') itens.push(['etapa', e === 'entregue' ? 'Entregue' : e === 'em-entrega' ? 'Em entrega' : 'Devolução']);
  $(main, '.ped4__chips')!.innerHTML = itens.map(([k, txt]) => `<li><span>${txt}</span><button type="button" class="ped4__chip-x" data-tirar="${k}" aria-label="Tirar o filtro ${txt}">${L(x)}</button></li>`).join('');
  const n = $(main, '.ped4__filtros-n')!; n.textContent = String(itens.length); n.hidden = !itens.length;
}
function pesquisar(main: HTMLElement): void {
  if (!validar(main)) return;
  const b = $<HTMLButtonElement>(main, '.ped4__pesquisar')!; if (b.getAttribute('aria-busy') === 'true') return;
  const antes = b.innerHTML, aviso = $(main, '.ped4__a-atualizar')!, cr = $(main, '.ped4__crono')!;
  b.setAttribute('aria-busy', 'true'); b.innerHTML = `${rolamentoSvg('g3-' + ++nr, 'pesquisar', 'ped4__rs')}<span class="btn__rotulo">A pesquisar…</span>`;
  aviso.innerHTML = `${rolamentoSvg('g3-' + ++nr, 'pesquisar', 'ped4__rs')}A atualizar…`; aviso.hidden = false; cr.classList.add('is-a-atualizar');
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
  /* com o painel aberto, o ativo é o escolhido (só um a laranja) */
  const escolhido = $(cr, '.ped4__c-item.is-aberto'); if (escolhido) ativo = escolhido;
  $$(cr, '.ped4__c-item.is-ativo').forEach((li) => { if (li !== ativo && !li.classList.contains('is-aberto')) li.classList.remove('is-ativo'); });
  const a = ativo as HTMLElement | null; a?.classList.add('is-ativo');
  /* o mês da guia ativa, ao lado da contagem */
  const ind = $(main, '.gui3__mes-atual');
  if (ind) { const [, m, y] = (a ? guiaDe(a.dataset.num!).data : '').split('/'); const t = m ? `${MESES[+m - 1]} de ${y}` : ''; if (ind.textContent !== t) { ind.textContent = t; if (t && !quieto()) ind.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: SAIDA }); } }
}
let pedidoRolar = 0;
const aoRolar = () => { if (pedidoRolar) return; pedidoRolar = requestAnimationFrame(() => { pedidoRolar = 0; const m = vivo(); if (m) rolar(m); }); };
const entrada = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-entrou'); entrada?.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
function observar(main: HTMLElement): void {
  const itens = $$(main, '.ped4__c-item:not(.is-entrou), .gui3__ano:not(.is-entrou), .ped4__mes-t:not(.is-entrou)');
  /* muitos documentos: sem entradas com o scroll */
  if (quieto() || !entrada || itens.length > 60) { itens.forEach((li) => li.classList.add('is-entrou')); return; }
  itens.forEach((li) => entrada.observe(li));
}

/* ---------- abrir e fechar no sítio ---------- */
function deslizarDepois(main: HTMLElement, li: HTMLElement, mudar: () => void): void {
  const depois = $$(main, '.ped4__c-item:not([hidden]), .ped4__mes-t, .gui3__ano, .ped4__c-fim').filter((el) => li.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING && !li.contains(el));
  const antes = new Map(depois.map((el) => [el, el.getBoundingClientRect().top]));
  mudar();
  if (quieto()) return;
  depois.forEach((el) => { const dy = antes.get(el)! - el.getBoundingClientRect().top; if (dy) el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 320, easing: SAIDA }); });
}
/** O fio do percurso: do pedido à guia, da guia à fatura; os nós acendem pela ordem. */
function animarPercurso(raiz: HTMLElement): void {
  const p = $(raiz, '.gui3__percurso'); if (!p || p.dataset.visto || quieto()) return;
  p.dataset.visto = '1';
  $$(p, '.gui3__fio').forEach((f, i) => f.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 450, delay: 120 + i * 220, easing: SAIDA, fill: 'backwards' }));
  $$(p, '.gui3__nos > li:not(.gui3__seta)').forEach((n, i) => n.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 240, delay: 80 + i * 220, easing: 'ease-out', fill: 'backwards' }));
}
function fecharItem(main: HTMLElement, li: HTMLElement, animar = true): void {
  const topo = li.getBoundingClientRect().top;
  const mudar = () => { $(li, '.ped4__c-det')!.hidden = true; li.classList.remove('is-aberto'); $(li, '.ped4__c-cabeca')!.setAttribute('aria-expanded', 'false'); };
  if (animar) deslizarDepois(main, li, mudar); else mudar();
  if (animar && topo < 0) li.scrollIntoView({ block: 'start' });
  if (lerGuardada() === li.dataset.num) guardar('');
  requestAnimationFrame(() => rolar(main));
}
/** Abrir uma guia pelo número (do mesmo pedido, ou vinda dos Pedidos): tira o filtro que a esconde. */
function irPara(main: HTMLElement, num: string, abrirPainel = true): void {
  const tabela = $(main, '.ped4__lista')?.dataset.vista === 'tabela';
  const el = tabela ? $(main, `tr.ped4__linha[data-num="${num}"]`) : $(main, `.ped4__c-item[data-num="${num}"]`); if (!el) return;
  if (el.hidden) limpar(main);
  el.scrollIntoView({ block: 'center' });
  if (abrirPainel) painelGuia(main, num, $(el, '.ped4__c-cabeca, .ped4__abrir') ?? el);
  else { el.classList.add('is-ativo'); }
}

/* ---------- a tabela: abrir na linha, ordenar, e a escolha da vista ---------- */
function fecharLinha(tr: HTMLElement): void {
  (tr.nextElementSibling as HTMLElement).hidden = true; tr.classList.remove('is-aberto'); $(tr, '.ped4__abrir')!.setAttribute('aria-expanded', 'false');
}
function ordenar(main: HTMLElement, b: HTMLElement): void {
  const th = b.closest('th')!, k = b.dataset.ordenar!, sobe = th.getAttribute('aria-sort') !== 'ascending';
  $$(main, 'thead th[aria-sort]').forEach((t) => t.setAttribute('aria-sort', 'none'));
  th.setAttribute('aria-sort', sobe ? 'ascending' : 'descending');
  const corpo = $(main, '.ped4__tabela tbody')!, linhas = $$(corpo, 'tr.ped4__linha');
  const antes = new Map(linhas.map((l) => [l, l.getBoundingClientRect().top]));
  const v = (l: HTMLElement) => k === 'num' ? l.dataset.num! : Number(k === 'data' ? l.dataset.data : l.dataset.total);
  linhas.sort((a, c) => { const x1 = v(a), x2 = v(c); const d = typeof x1 === 'number' ? x1 - (x2 as number) : x1.localeCompare(String(x2), 'pt', { numeric: true }); return sobe ? d : -d; });
  linhas.forEach((l) => corpo.append(l, l.nextElementSibling!));
  if (quieto() || linhas.length > 40) return;
  linhas.forEach((l) => { const dy = antes.get(l)! - l.getBoundingClientRect().top; if (dy && !l.hidden) l.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 240, easing: SAIDA }); });
}
const lidaVista = () => { try { return localStorage.getItem('goparts-guias-vista'); } catch { return null; } };
function vista(main: HTMLElement, v: string, guardarJa = true): void {
  $(main, '.ped4__lista')!.dataset.vista = v;
  $$(main, '.ped4__vista').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vista === v)));
  if (guardarJa) try { localStorage.setItem('goparts-guias-vista', v); } catch { /* só nesta visita */ }
  if (!quieto() && guardarJa) $(main, v === 'tabela' ? '.ped4__tabela' : '.ped4__crono')?.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: SAIDA });
  observar(main); requestAnimationFrame(() => rolar(main));
}

/* ---------- o documento no painel ---------- */
function fundo(main: HTMLElement, inerte: boolean): void {
  const portal = main.closest('.portal')!;
  [...$$(portal, ':scope > header, :scope > nav'), ...$$(main, ':scope > header, :scope > section')].forEach((el) => { el.inert = inerte; if (inerte) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden'); });
}
let devolver: HTMLElement | null = null;
/** A guia escolhida fica marcada (cartão e linha) enquanto o painel está aberto. */
function marcarEscolhida(main: HTMLElement, num: string): void {
  $$(main, '.ped4__c-item.is-aberto, tr.ped4__linha.is-aberto').forEach((el) => el.classList.remove('is-aberto'));
  if (!num) return;
  $$(main, `.ped4__c-item[data-num="${num}"], tr.ped4__linha[data-num="${num}"]`).forEach((el) => { el.classList.add('is-aberto'); if (el.matches('.ped4__c-item')) el.classList.add('is-ativo'); });
}
/* (ela, 15 out.: «os diálogos que te pedi quando clico num pedido ou guias de remessa») — clicar numa guia, no
   cartão ou na linha, abre-a no painel lateral: o percurso documental, os valores, a entrega, os artigos e as
   ações; «Do mesmo pedido» troca a guia no painel; «Ver documento» mostra o documento no mesmo painel. */
function painelGuia(main: HTMLElement, num: string, origem: HTMLElement | null): void {
  const g = guiaDe(num), gv = $(main, '.gui3__gaveta')!, veu = $(main, '.ped4__veu')!, jaAberto = !gv.hidden;
  if (origem) devolver = origem;
  marcarEscolhida(main, num); guardar(num);
  gv.innerHTML = `${cabecaGuia(g)}<div class="ped4__g-guia">${detalheGuia(g)}</div>`;
  gv.hidden = false; veu.hidden = false; main.classList.add('tem-gaveta'); fundo(main, true);
  gv.scrollTop = 0;
  if (!quieto()) {
    if (!jaAberto) gv.animate([{ transform: 'translateX(32px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: SAIDA });
    else $(gv, '.ped4__g-guia')?.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: SAIDA });
    /* como o talão das Faturas: os artigos entram um a um (no máximo 12), depois o resumo, o traço e o total em destaque;
       os valores já estão certos (nada conta a partir do zero) */
    $$(gv, '.fat2__linha').slice(0, 12).forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: 120 + i * 35, easing: SAIDA, fill: 'backwards' }));
    const n = Math.min(12, $$(gv, '.fat2__linha').length), t0 = 160 + n * 35;
    $$(gv, '.fat2__recibo .fat2__r').forEach((r, i) => r.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: t0 + i * 50, easing: SAIDA, fill: 'backwards' }));
    $(gv, '.fat2__traco')?.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 420, delay: t0 + 300, easing: SAIDA, fill: 'backwards' });
    const tt = $(gv, '.fat2__r--total'); window.setTimeout(() => tt?.classList.add('is-destaque'), t0 + 600);
  }
  animarPercurso(gv);
  window.setTimeout(() => $(gv, '.ped4__g-num')?.focus(), quieto() ? 0 : 60);
}
function verDoc(main: HTMLElement, num: string, origem: HTMLElement): void {
  const g = guiaDe(num), gv = $(main, '.gui3__gaveta')!, veu = $(main, '.ped4__veu')!, daGuia = !gv.hidden;
  if (!daGuia) devolver = origem;
  /* primeiro o cabeçalho e o rolamento; a página do documento chega depois. Vindo da guia, «Voltar à guia» */
  gv.innerHTML = `${cabecaDoc(g)}${daGuia ? `<p class="gui3__g-voltar"><button type="button" class="ped4__ligacao gui3__voltar" data-voltar-guia="${g.num}">${L(arrowLeft)}Voltar à guia</button></p>` : ''}<div class="gui3__g-corpo"><p class="gui3__g-carga" role="status">${rolamentoSvg('g3-' + ++nr, 'carregar', 'ped4__rs')}A abrir o documento…</p></div>${rodapeDoc(g)}`;
  gv.hidden = false; veu.hidden = false; main.classList.add('tem-gaveta'); fundo(main, true); gv.scrollTop = 0;
  if (!quieto() && !daGuia) gv.animate([{ transform: 'translateX(32px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: SAIDA });
  $(gv, '.ped4__g-num')?.focus();
  window.setTimeout(() => { if (gv.hidden) return; const c = $(gv, '.gui3__g-corpo')!; c.innerHTML = paginaDoc(g); if (!quieto()) c.firstElementChild?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' }); }, quieto() ? 0 : 500);
}
function fecharDoc(main: HTMLElement): void {
  const gv = $(main, '.gui3__gaveta')!; if (gv.hidden) return;
  const fim = () => { gv.hidden = true; $(main, '.ped4__veu')!.hidden = true; main.classList.remove('tem-gaveta'); fundo(main, false); marcarEscolhida(main, ''); requestAnimationFrame(() => rolar(main)); devolver?.focus(); };
  if (quieto()) { fim(); return; }
  gv.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(32px)', opacity: 0 }], { duration: 220, easing: 'ease-in' }).finished.then(fim, fim);
}
function descarregar(b: HTMLButtonElement): void {
  if (b.getAttribute('aria-busy') === 'true') return;
  const antes = b.innerHTML, num = b.dataset.descarregar!, aviso = b.closest('.gui3__det-artigos, .gui3__g-pe')?.querySelector<HTMLElement>('.gui3__descarga');
  b.setAttribute('aria-busy', 'true'); b.innerHTML = `${rolamentoSvg('g3-' + ++nr, 'pesquisar', 'ped4__rs')}<span class="btn__rotulo">A preparar o PDF…</span>`;
  window.setTimeout(() => {
    b.removeAttribute('aria-busy'); b.classList.add('is-feito');
    b.innerHTML = `${L(check, 'btn__icone')}<span class="btn__rotulo">PDF descarregado</span>`;
    if (aviso) { aviso.hidden = false; aviso.innerHTML = `${ICONES3.fileText}<span>${num.replace('/', '-')}.pdf · na pasta das transferências</span>`; }
    window.setTimeout(() => { b.classList.remove('is-feito'); b.innerHTML = antes; }, 2400);
  }, quieto() ? 150 : 800);
}

/* ---------- ligar ---------- */
function armar(): void {
  const main = vivo(); if (!main) return;
  if (!main.dataset.filtro) main.dataset.filtro = 'todos';
  if (!criterios.has(main)) criterios.set(main, ler(main));
  if (!main.dataset.entrou) { main.dataset.entrou = '1'; if (!quieto()) main.classList.add('ped4--entrar'); kpiEntrada(main, { n: inteiro, f: inteiro, c: inteiro, total: euros }); window.setTimeout(() => main.classList.remove('ped4--entrar'), 900); }
  if (!main.dataset.vistaLida) { main.dataset.vistaLida = '1'; const v = lidaVista(); if (v === 'tabela' || v === 'cronologia') vista(main, v, false); }
  observar(main);
  requestAnimationFrame(() => {
    risca(main);
    /* a guia vinda dos Pedidos («Ver guia»), ou a que estava aberta nesta visita */
    let pedida: string | null = null; try { pedida = sessionStorage.getItem('goparts:abrir-guia'); sessionStorage.removeItem('goparts:abrir-guia'); } catch { /* nada */ }
    const g = pedida || lerGuardada();
    if (g && GUIAS.some((x) => x.num === g)) irPara(main, g, !!pedida);
    if (!pedida && g) guardar('');
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
    if (t.closest('.ped4__limpar, [data-limpar-tudo]')) { limpar(main); return; }
    const tirar = t.closest<HTMLElement>('[data-tirar]');
    const ef = t.closest<HTMLElement>('.ped4__etapa-f');
    if (ef) { main.dataset.etapa = ef.dataset.etapa; etapas(main); aplicar(main); return; }
    if (tirar) { const k = tirar.dataset.tirar!; if (k === 'etapa') { main.dataset.etapa = 'todas'; etapas(main); } else if (k === 'tipo') { main.dataset.filtro = 'todos'; tipos(main); } else { const i = $<HTMLInputElement>(main, `#gui3-${k}`)!; i.value = ''; i.removeAttribute('aria-invalid'); $(main, `#gui3-${k}-erro`)!.hidden = true; criterios.set(main, ler(main)); } aplicar(main); return; }
    const ab = t.closest<HTMLElement>('.ped4__filtros-abrir'); if (ab) { const sim = ab.getAttribute('aria-expanded') !== 'true'; ab.setAttribute('aria-expanded', String(sim)); main.classList.toggle('filtros-abertos', sim); return; }
    const irma = t.closest<HTMLElement>('[data-ir-guia]'); if (irma) { painelGuia(main, irma.dataset.irGuia!, null); return; }
    const vg = t.closest<HTMLElement>('[data-voltar-guia]'); if (vg) { painelGuia(main, vg.dataset.voltarGuia!, null); return; }
    const ind = t.closest<HTMLElement>('[data-pedido-indisponivel]');
    if (ind) { const p = ind.closest('.gui3__percurso')!.querySelector<HTMLElement>('.gui3__ind')!; p.hidden = false; if (!quieto()) p.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: SAIDA }); return; }
    const ped = t.closest<HTMLElement>('[data-abrir-pedido]');
    if (ped) { try { sessionStorage.setItem('goparts:abrir-pedido', ped.dataset.abrirPedido!); } catch { /* nada */ } mostrar('pedidos'); return; }
    { const fd = t.closest<HTMLElement>('[data-abrir-doc]'); if (fd) try { sessionStorage.setItem('goparts:abrir-fatura', fd.dataset.abrirDoc!); } catch { /* nada */ } }
    if (t.closest('.gui3__gaveta [data-ir]')) { const gv = $(main, '.gui3__gaveta')!; gv.hidden = true; $(main, '.ped4__veu')!.hidden = true; main.classList.remove('tem-gaveta'); fundo(main, false); marcarEscolhida(main, ''); return; }
    const vd = t.closest<HTMLElement>('[data-ver-doc]'); if (vd) { verDoc(main, vd.dataset.verDoc!, vd); return; }
    const dl = t.closest<HTMLButtonElement>('[data-descarregar]'); if (dl) { descarregar(dl); return; }
    if (t.closest('.ped4__g-fechar, .ped4__veu')) { fecharDoc(main); return; }
    const o = t.closest<HTMLElement>('[data-ordenar]'); if (o) { ordenar(main, o); return; }
    const vb = t.closest<HTMLElement>('.ped4__vista'); if (vb) { vista(main, vb.dataset.vista!); return; }
    const cc = t.closest<HTMLElement>('.ped4__c-cabeca');
    if (cc) { const li = cc.closest<HTMLElement>('.ped4__c-item')!; if (!li.classList.contains('ped4__c-esq')) painelGuia(main, li.dataset.num!, cc); return; }
    if (t.closest('.ped4__linha-det, .gui3__gaveta')) return;
    const tr = t.closest<HTMLElement>('tr.ped4__linha');
    if (tr && !t.closest('a, input')) painelGuia(main, tr.dataset.num!, $(tr, '.ped4__abrir') ?? tr);
  }, true);
  document.addEventListener('submit', (ev) => { const main = vivo(); if (main && (ev.target as Element).closest?.('#gui3-campos')) { ev.preventDefault(); pesquisar(main); } });
  document.addEventListener('keydown', (ev) => { const main = vivo(); if (!main || editando()) return; if (ev.key === 'Escape' && !$(main, '.gui3__gaveta')!.hidden) { ev.preventDefault(); fecharDoc(main); } });
  document.addEventListener('input', (ev) => { const i = ev.target as HTMLInputElement; if (i.matches?.('.gui3 .ped4__input[aria-invalid]')) { i.removeAttribute('aria-invalid'); const e = document.getElementById(`${i.id}-erro`); if (e) e.hidden = true; } });
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  window.addEventListener('resize', () => { const m = vivo(); if (m) { risca(m); rolar(m); } });
  document.addEventListener('scroll', aoRolar, { capture: true, passive: true });
}
