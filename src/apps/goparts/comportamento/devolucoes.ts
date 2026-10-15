/* =========================================================
   GOPARTS — 16 · Devoluções: o comportamento (15 out. 2026)
   - FILTROS: como nas Guias — as datas validadas no próprio campo (dd/mm/aaaa), «A atualizar…» sem bloquear, as que
     saem desvanecem e as que ficam deslizam (FLIP), etiquetas com ×, as contagens contam só quando mudam.
   - CRONOLOGIA: a linha desenha-se com o scroll; a devolução mais perto da altura de leitura fica ativa.
   - ABRIR: clicar no cartão ou na linha abre o painel lateral (300 ms); o escolhido fica a laranja; os artigos entram
     um a um; no percurso, os passos confirmados acendem, a linha enche até ao último (400 ms) e a caixa desce uma vez
     por ele (sem repetir). «Enviar a devolução» (só nas que estão por enviar) espera pelo «servidor» e só depois diz
     que foi enviada.
   - CRIAR: o painel largo com três passos (Fatura → Artigos → Rever e enviar; a risca laranja desliza 300 ms). No
     segundo, «Devolver» faz o artigo voar da fatura para a lista da devolução (uma cópia por cima, 380 ms) e as
     contagens de referências e unidades mudam; a quantidade vai até ao que ainda se pode devolver, e o erro diz
     porquê. Fechar não perde nada: ao voltar a «Criar devolução», está tudo onde ficou. Enviar (ou guardar por
     enviar) espera pela confirmação; só então a devolução entra no topo da cronologia.
   Com «reduzir movimento», tudo troca sem deslizar. Não há servidor: as esperas são de menos de 1 s.
   ========================================================= */
import { DEVOLUCOES, estadoDev, unidades, NOME_ESTADO, type Devolucao } from '../portal/devolucoes-dados';
import { devDe, cabecaDev, detalheDev, painelCriar, passoFatura, passoArtigos, passoRever, peCriar, linhaCesto, disponivel, cronologiaDev, tabelaDev, L } from '../portal/devolucoes';
import { GUIAS } from '../portal/guias-dados';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import { kpi, kpiEntrada } from './kpi';
import { mostrar } from '../../../comum/ecras';
import x from 'lucide-static/icons/x.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';

const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SAIDA = 'cubic-bezier(.22, 1, .36, 1)';
const vivo = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal--dev:not(.portal--estado) .dev');
const $ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => Array.from(r.querySelectorAll<T>(s));
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
/** O «hoje» do protótipo: o dia do documento mais recente (os dados são de março e abril de 2024). */
const HOJE = '16/04/2024';
let nr = 0;

/* ---------- os critérios ---------- */
interface Criterios { de: string; ate: string; num: string; ref: string }
const criterios = new WeakMap<HTMLElement, Criterios>();
const ler = (main: HTMLElement): Criterios => ({ de: $<HTMLInputElement>(main, '#dev-de')!.value.trim(), ate: $<HTMLInputElement>(main, '#dev-ate')!.value.trim(), num: $<HTMLInputElement>(main, '#dev-num')!.value.trim(), ref: $<HTMLInputElement>(main, '#dev-ref')!.value.trim() });
const data = (s: string) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s); if (!m) return NaN; const d = new Date(+m[3], +m[2] - 1, +m[1]); return d.getMonth() === +m[2] - 1 ? +`${m[3]}${m[2]}${m[1]}` : NaN; };
const simples = (s: string) => s.toLowerCase().replace(/[\s/.-]/g, '');
function passa(num: string, c: Criterios, est = 'todas'): boolean {
  const d = devDe(num), dia = +d.criada.split('/').reverse().join('');
  if (est !== 'todas' && estadoDev(d) !== est) return false;
  if (c.de && dia < data(c.de)) return false;
  if (c.ate && dia > data(c.ate)) return false;
  if (c.num && !simples(num).includes(simples(c.num))) return false;
  if (c.ref && !d.linhas.some((l) => simples(l[1]).includes(simples(c.ref)))) return false;
  return true;
}
function validar(main: HTMLElement): boolean {
  const erro = (cid: string, msg: string) => { const i = $<HTMLInputElement>(main, `#${cid}`)!, e = $(main, `#${cid}-erro`)!; if (msg) { i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', `${cid}-erro`); e.textContent = msg; e.hidden = false; } else { i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); e.hidden = true; } return !msg; };
  const c = ler(main);
  const ok1 = erro('dev-de', c.de && Number.isNaN(data(c.de)) ? 'Escreva a data como dd/mm/aaaa.' : '');
  const ok2 = erro('dev-ate', c.ate && Number.isNaN(data(c.ate)) ? 'Escreva a data como dd/mm/aaaa.' : c.de && c.ate && data(c.ate) < data(c.de) ? 'A data final é antes da inicial.' : '');
  if (!ok1 || !ok2) $<HTMLInputElement>(main, '[aria-invalid="true"]')?.focus();
  return ok1 && ok2;
}

/* ---------- os números que contam (só quando mudam) ---------- */
function contar(el: HTMLElement | null, para: number): void {
  if (!el) return;
  const de = Number(el.dataset.valor ?? para);
  el.dataset.valor = String(para);
  if (quieto() || de === para) { el.textContent = String(para); return; }
  const t0 = performance.now(), dur = 320;
  const passo = (t: number) => { const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 3; el.textContent = String(Math.round(de + (para - de) * e)); if (k < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
  el.classList.remove('is-mudou'); void el.offsetWidth; el.classList.add('is-mudou');
}
const inteiro = (n: number) => String(Math.round(n));
const marcar = (texto: string, q: string) => {
  if (!q) return texto;
  const s = simples(q), alvo = simples(texto); const i = alvo.indexOf(s); if (i < 0) return texto;
  const pos: number[] = []; for (let k = 0; k < texto.length; k++) if (!/[\s/.-]/.test(texto[k])) pos.push(k);
  const a = pos[i], b = pos[i + s.length - 1] + 1;
  return `${texto.slice(0, a)}<mark>${texto.slice(a, b)}</mark>${texto.slice(b)}`;
};

/* ---------- aplicar os filtros ---------- */
function aplicar(main: HTMLElement, animar = true): void {
  const c = criterios.get(main) || ler(main), est = main.dataset.etapa || 'todas';
  const cr = $(main, '.ped4__crono')!, itens = $$(cr, '.ped4__c-item');
  const mexer = animar && !quieto() && itens.length <= 40;
  const antes = new Map(itens.filter((li) => !li.hidden).map((li) => [li, li.getBoundingClientRect().top]));
  const entram: HTMLElement[] = [];
  itens.forEach((li) => {
    const num = li.dataset.num!, sim = passa(num, c, est);
    if (sim && li.hidden) entram.push(li);
    li.hidden = !sim;
    $(li, '.ped4__ref')!.innerHTML = marcar(num, c.num);
    const enc = $(li, '.ped4__c-encontrado')!, art = c.ref ? devDe(num).linhas.find((l) => simples(l[1]).includes(simples(c.ref))) : undefined;
    enc.hidden = !art; enc.innerHTML = art ? `Contém ${marcar(art[1], c.ref)}` : '';
  });
  $$(cr, '.ped4__mes').forEach((m) => { const n = $$(m, '.ped4__c-item:not([hidden])').length; m.hidden = !n; $(m, '.ped4__mes-t small')!.innerHTML = `<b>${n}</b> ${n === 1 ? 'devolução' : 'devoluções'}`; });
  $$(cr, '.gui3__ano').forEach((h) => { let n = 0; for (let s = h.nextElementSibling; s && !s.classList.contains('gui3__ano'); s = s.nextElementSibling) if (s.classList.contains('ped4__mes') && !(s as HTMLElement).hidden) n++; h.hidden = !n; });
  const vis = itens.filter((li) => !li.hidden);
  cr.hidden = !vis.length;
  $$(main, 'tr.ped4__linha').forEach((tr) => { tr.hidden = !passa(tr.dataset.num!, c, est); $(tr, '.ped4__ref')!.innerHTML = marcar(tr.dataset.num!, c.num); });
  const tab = $(main, '.ped4__tabela'); if (tab) tab.hidden = !vis.length;
  if (mexer) {
    vis.filter((li) => antes.has(li)).forEach((li) => { const dy = antes.get(li)! - li.getBoundingClientRect().top; if (dy) li.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 260, easing: SAIDA }); });
    entram.forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateX(-12px)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: Math.min(i, 6) * 30, easing: SAIDA, fill: 'backwards' }));
  }
  /* as contagens: do cabeçalho, do topo da lista e das pílulas */
  const ds = vis.map((li) => devDe(li.dataset.num!));
  contar($(main, '.ped4__conta b'), vis.length);
  const conta = $(main, '.ped4__conta'); if (conta) conta.lastChild!.textContent = ` de ${DEVOLUCOES.length} devoluções`;
  kpi($(main, '[data-kpi="n"]'), vis.length, inteiro);
  (['rascunho', 'enviada', 'creditada'] as const).forEach((k) => kpi($(main, `[data-kpi="${k}"]`), ds.filter((d) => estadoDev(d) === k).length, inteiro));
  $$(main, '.ped4__etapa-f').forEach((b) => { $(b, '.ped4__est-n')!.textContent = String(DEVOLUCOES.filter((d) => passa(d.num, c, b.dataset.etapa!)).length); });
  etiquetas(main, c);
  const vazio = $(main, '.ped4__vazio')!;
  vazio.hidden = vis.length > 0;
  if (!vis.length) vazio.innerHTML = `<p><strong>Nenhuma devolução corresponde aos filtros selecionados.</strong> Alargue as datas ou tire um filtro; ${DEVOLUCOES.length} devoluções no total.</p><button type="button" class="btn btn--ghost btn--sm" data-limpar-tudo>${L(rotateCcw, 'btn__icone')}<span class="btn__rotulo">Limpar filtros</span></button>`;
  requestAnimationFrame(() => rolar(main));
}
function etiquetas(main: HTMLElement, c: Criterios): void {
  const itens: [string, string][] = [];
  if (c.de) itens.push(['de', `Desde ${c.de}`]); if (c.ate) itens.push(['ate', `Até ${c.ate}`]);
  if (c.num) itens.push(['num', `Devolução «${c.num}»`]); if (c.ref) itens.push(['ref', `Referência «${c.ref}»`]);
  const e = main.dataset.etapa || 'todas'; if (e !== 'todas') itens.push(['etapa', NOME_ESTADO[e as keyof typeof NOME_ESTADO]]);
  $(main, '.ped4__chips')!.innerHTML = itens.map(([k, txt]) => `<li><span>${txt}</span><button type="button" class="ped4__chip-x" data-tirar="${k}" aria-label="Tirar o filtro ${txt}">${L(x)}</button></li>`).join('');
  const n = $(main, '.ped4__filtros-n')!; n.textContent = String(itens.length); n.hidden = !itens.length;
}
function pesquisar(main: HTMLElement): void {
  if (!validar(main)) return;
  const b = $<HTMLButtonElement>(main, '.ped4__pesquisar')!; if (b.getAttribute('aria-busy') === 'true') return;
  const antes = b.innerHTML, aviso = $(main, '.ped4__a-atualizar')!, cr = $(main, '.ped4__crono')!;
  b.setAttribute('aria-busy', 'true'); b.innerHTML = `${rolamentoSvg('dv-' + ++nr, 'pesquisar', 'ped4__rs')}<span class="btn__rotulo">A pesquisar…</span>`;
  aviso.innerHTML = `${rolamentoSvg('dv-' + ++nr, 'pesquisar', 'ped4__rs')}A atualizar…`; aviso.hidden = false; cr.classList.add('is-a-atualizar');
  window.setTimeout(() => {
    criterios.set(main, ler(main));
    b.removeAttribute('aria-busy'); b.innerHTML = antes; aviso.hidden = true; cr.classList.remove('is-a-atualizar');
    aplicar(main);
  }, quieto() ? 120 : 450);
}
function limpar(main: HTMLElement): void {
  $$<HTMLInputElement>(main, '.ped4__campos .ped4__input').forEach((i) => { i.value = ''; i.removeAttribute('aria-invalid'); });
  $$(main, '.ped4__erro').forEach((e) => { e.hidden = true; });
  main.dataset.etapa = 'todas'; etapas(main);
  criterios.set(main, ler(main));
  aplicar(main);
}
function etapas(main: HTMLElement): void {
  const f = main.dataset.etapa || 'todas';
  $$(main, '.ped4__etapa-f').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.etapa === f)));
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
  if (ind) { const [, m, y] = (a ? devDe(a.dataset.num!).criada : '').split('/'); const t = m ? `${MESES[+m - 1]} de ${y}` : ''; if (ind.textContent !== t) { ind.textContent = t; if (t && !quieto()) ind.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: SAIDA }); } }
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
  const v = (l: HTMLElement) => k === 'num' ? l.dataset.num! : Number(k === 'data' ? l.dataset.data : l.dataset.unid);
  linhas.sort((a, c) => { const x1 = v(a), x2 = v(c); const d = typeof x1 === 'number' ? x1 - (x2 as number) : x1.localeCompare(String(x2), 'pt', { numeric: true }); return sobe ? d : -d; });
  linhas.forEach((l) => corpo.append(l));
  if (quieto()) return;
  linhas.forEach((l) => { const dy = antes.get(l)! - l.getBoundingClientRect().top; if (dy && !l.hidden) l.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 240, easing: SAIDA }); });
}
const lidaVista = () => { try { return localStorage.getItem('goparts-devolucoes-vista'); } catch { return null; } };
function vista(main: HTMLElement, v: string, guardarJa = true): void {
  $(main, '.ped4__lista')!.dataset.vista = v;
  $$(main, '.ped4__vista').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vista === v)));
  if (guardarJa) try { localStorage.setItem('goparts-devolucoes-vista', v); } catch { /* só nesta visita */ }
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
function abrirGaveta(main: HTMLElement, html: string, criar: boolean): HTMLElement {
  const gv = $(main, '.dev__gaveta')!, jaAberto = !gv.hidden;
  gv.classList.toggle('is-criar', criar);
  gv.setAttribute('aria-labelledby', criar ? 'dev-c-titulo' : 'dev-g-num');
  gv.innerHTML = html;
  gv.hidden = false; $(main, '.ped4__veu')!.hidden = false; main.classList.add('tem-gaveta'); fundo(main, true);
  gv.scrollTop = 0;
  if (!quieto()) {
    if (!jaAberto) gv.animate([{ transform: 'translateX(32px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: SAIDA });
    else gv.firstElementChild?.nextElementSibling?.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: SAIDA });
  }
  window.setTimeout(() => $(gv, '.ped4__g-num')?.focus(), quieto() ? 0 : 60);
  return gv;
}
/** O percurso: os passos confirmados acendem; a linha enche até ao último (400 ms); a caixa desce uma vez. */
function animarPercurso(gv: HTMLElement): void {
  const p = $(gv, '.dev__percurso'); if (!p || quieto()) return;
  const feitos = $$(p, '.dev__passo.is-feito'), enche = getComputedStyle(p).getPropertyValue('--enche').trim() || '0';
  feitos.forEach((li, i) => $(li, '.dev__p-ponto')!.animate([{ opacity: .3, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: 200 + i * 180, easing: SAIDA, fill: 'backwards' }));
  $(p, '.dev__p-linha i')?.animate([{ transform: 'scaleY(0)' }, { transform: `scaleY(${enche})` }], { duration: 400 + feitos.length * 120, delay: 200, easing: SAIDA, fill: 'backwards' });
  const ultimo = feitos[feitos.length - 1], caixa = $(p, '.dev__p-caixa');
  if (!caixa || !ultimo || feitos.length < 2) return;
  const dy = ultimo.offsetTop;
  caixa.animate([{ opacity: 0, transform: 'translateY(0)' }, { opacity: 1, transform: 'translateY(0)', offset: .12 }, { opacity: 1, transform: `translateY(${dy}px)`, offset: .82 }, { opacity: 0, transform: `translateY(${dy}px)` }], { duration: 900 + feitos.length * 120, delay: 200, easing: 'cubic-bezier(.45, 0, .2, 1)' });
}
function painelDev(main: HTMLElement, num: string, origem: HTMLElement | null): void {
  const d = devDe(num);
  if (origem) devolver = origem;
  marcarEscolhida(main, num);
  const gv = abrirGaveta(main, `${cabecaDev(d)}${detalheDev(d)}`, false);
  if (!quieto()) $$(gv, '.dev__det > section:first-child .fat2__linha').slice(0, 12).forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: 120 + i * 40, easing: SAIDA, fill: 'backwards' }));
  animarPercurso(gv);
}
function fecharGaveta(main: HTMLElement): void {
  const gv = $(main, '.dev__gaveta')!; if (gv.hidden) return;
  const fim = () => { gv.hidden = true; gv.classList.remove('is-criar'); $(main, '.ped4__veu')!.hidden = true; main.classList.remove('tem-gaveta'); fundo(main, false); marcarEscolhida(main, ''); requestAnimationFrame(() => rolar(main)); devolver?.focus(); };
  if (quieto()) { fim(); return; }
  gv.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(32px)', opacity: 0 }], { duration: 220, easing: 'ease-in' }).finished.then(fim, fim);
}
/** Trocar a cronologia e a tabela (depois de criar ou de enviar), sem perder filtros nem a vista. */
function redesenhar(main: HTMLElement, novo = ''): void {
  $(main, '.ped4__crono')!.outerHTML = cronologiaDev();
  $(main, '.ped4__tabela')!.outerHTML = tabelaDev();
  $$(main, '.ped4__c-item, .gui3__ano, .ped4__mes-t').forEach((el) => el.classList.add('is-entrou'));
  aplicar(main, false);
  if (novo) {
    const li = $(main, `.ped4__c-item[data-num="${novo}"]`);
    if (li) { li.classList.add('is-novo'); if (!quieto()) li.animate([{ opacity: 0, transform: 'translateX(-12px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: SAIDA }); }
  }
}
function enviarRascunho(main: HTMLElement, b: HTMLButtonElement): void {
  if (b.getAttribute('aria-busy') === 'true') return;
  const d = devDe(b.dataset.enviarDev!);
  b.setAttribute('aria-busy', 'true'); b.innerHTML = `${rolamentoSvg('dv-' + ++nr, 'pesquisar', 'ped4__rs')}<span class="btn__rotulo">A enviar…</span>`;
  window.setTimeout(() => {
    d.enviada = HOJE;
    redesenhar(main);
    marcarEscolhida(main, d.num);
    const gv = abrirGaveta(main, `${cabecaDev(d)}${detalheDev(d)}`, false);
    const a = $(gv, '.dev__aviso'); if (a) { a.hidden = false; a.innerHTML = `${L(circleCheck)}<span>Enviada à Romafe a ${HOJE}.</span>`; }
    animarPercurso(gv);
  }, quieto() ? 150 : 800);
}

/* ---------- criar uma devolução ---------- */
interface Rascunho { passo: number; origem: string; escolhidos: [string, number][]; obs: string }
const rascunhos = new WeakMap<HTMLElement, Rascunho>();
const rasc = (main: HTMLElement) => { let r = rascunhos.get(main); if (!r) { r = { passo: 0, origem: '', escolhidos: [], obs: '' }; rascunhos.set(main, r); } return r; };
function abrirCriar(main: HTMLElement, origem: HTMLElement | null): void {
  const r = rasc(main);
  if (origem) devolver = origem;
  marcarEscolhida(main, '');
  abrirGaveta(main, painelCriar(r.passo, r.origem, r.escolhidos, r.obs), true);
}
/** Mudar de passo: o corpo de agora sai para um lado e o novo entra do outro; a risca desliza. */
function irPasso(main: HTMLElement, passo: number): void {
  const r = rasc(main), gv = $(main, '.dev__gaveta')!, frente = passo > r.passo;
  guardarObs(main);
  r.passo = passo;
  $$(gv, '.dev__passos-c li').forEach((li, i) => { li.className = i < passo ? 'is-feito' : i === passo ? 'is-atual' : ''; if (i === passo) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); const s = li.querySelector('span')!; s.innerHTML = i < passo ? L(circleCheck) : String(i + 1); });
  $(gv, '.dev__passos-risca')!.style.setProperty('--p', String(passo));
  const corpo = passo === 0 ? passoFatura(r.origem) : passo === 1 ? passoArtigos(r.origem, r.escolhidos) : passoRever(r.origem, r.escolhidos, r.obs);
  $(gv, '.dev__c-corpo')!.outerHTML = corpo;
  $(gv, '.dev__c-pe')!.outerHTML = peCriar(passo);
  gv.scrollTop = 0;
  if (!quieto()) $(gv, '.dev__c-corpo')!.animate([{ opacity: 0, transform: `translateX(${frente ? 24 : -24}px)` }, { opacity: 1, transform: 'none' }], { duration: 300, easing: SAIDA });
  ($(gv, '.dev__c-guia[aria-checked="true"], .dev__c-por:not([disabled]), #dev-c-obs') as HTMLElement | null)?.focus({ preventScroll: true });
}
const guardarObs = (main: HTMLElement) => { const t = $<HTMLTextAreaElement>(main, '#dev-c-obs'); if (t) rasc(main).obs = t.value; };
function erroPasso(main: HTMLElement, passo: number, msg: string): void {
  const e = $(main, `#dev-c-erro-${passo}`); if (!e) return;
  e.textContent = msg; e.hidden = !msg;
  if (msg && !quieto()) e.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: SAIDA });
}
/** A quantidade de uma linha da devolução: um inteiro de 1 até ao que ainda se pode devolver. */
function validarQtd(main: HTMLElement, li: HTMLElement): boolean {
  const r = rasc(main), desc = li.dataset.desc!, inp = $<HTMLInputElement>(li, '.dev__c-q')!, sm = $(li, '.dev__c-q-erro')!;
  const { faturado, devolvido, livre } = disponivel(r.origem, desc), v = inp.value.trim();
  const msg = !/^\d+$/.test(v) || +v < 1 ? 'Escreva um número inteiro, a partir de 1.' : +v > livre ? `Só pode devolver até ${livre} un. (faturadas ${faturado}${devolvido ? `, já devolvidas ${devolvido}` : ''}).` : '';
  li.classList.toggle('is-invalida', !!msg); sm.textContent = msg; sm.hidden = !msg;
  if (msg) { inp.setAttribute('aria-invalid', 'true'); inp.setAttribute('aria-describedby', sm.id); } else { inp.removeAttribute('aria-invalid'); inp.removeAttribute('aria-describedby'); }
  const e = r.escolhidos.find((x) => x[0] === desc); if (e && !msg) e[1] = +v;
  $<HTMLButtonElement>(li, '.dev__c-menos')!.disabled = !!msg || +v <= 1;
  $<HTMLButtonElement>(li, '.dev__c-mais')!.disabled = !!msg || +v >= livre;
  return !msg;
}
function contarCesto(main: HTMLElement): void {
  const r = rasc(main), gv = $(main, '.dev__gaveta')!;
  contar($(gv, '[data-cesto="ref"]'), r.escolhidos.length);
  contar($(gv, '[data-cesto="unid"]'), r.escolhidos.reduce((s, e) => s + e[1], 0));
  const n = $(gv, '.dev__c-n'); if (n) n.textContent = String(r.escolhidos.length);
  const v = $(gv, '.dev__c-vazio'); if (v) v.hidden = r.escolhidos.length > 0;
  if (r.escolhidos.length) erroPasso(main, 1, '');
}
/** «Devolver»: o artigo passa da fatura para a devolução (a imagem voa; a linha nova aparece onde ela pousa). */
function porNaDevolucao(main: HTMLElement, b: HTMLButtonElement): void {
  const r = rasc(main), desc = b.dataset.por!, gv = $(main, '.dev__gaveta')!;
  if (r.escolhidos.some((e) => e[0] === desc)) return;
  r.escolhidos.push([desc, 1]);
  const fonte = b.closest<HTMLElement>('.dev__c-art')!;
  fonte.classList.add('is-escolhido'); b.disabled = true; b.querySelector('.btn__rotulo')!.textContent = 'Na devolução';
  const lista = $(gv, '.dev__c-lista')!;
  lista.insertAdjacentHTML('beforeend', linhaCesto(r.origem, desc, 1));
  const nova = lista.lastElementChild as HTMLElement;
  contarCesto(main);
  if (quieto()) return;
  const de = $(fonte, '.fat2__l-i')!.getBoundingClientRect(), para = $(nova, '.fat2__l-i')!.getBoundingClientRect();
  const voa = $(fonte, '.fat2__l-i')!.cloneNode(true) as HTMLElement;
  voa.classList.add('dev__voar'); voa.style.left = `${de.left}px`; voa.style.top = `${de.top}px`;
  document.body.appendChild(voa);
  nova.style.opacity = '0';
  const dx = para.left - de.left, dy = para.top - de.top;
  voa.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx * .5}px, ${dy * .5 - 24}px) scale(1.08)`, opacity: 1, offset: .5 }, { transform: `translate(${dx}px, ${dy}px)`, opacity: 1 }], { duration: 380, easing: SAIDA }).finished.then(() => {
    voa.remove(); nova.style.opacity = '';
    nova.animate([{ opacity: 0, transform: 'translateX(8px)' }, { opacity: 1, transform: 'none' }], { duration: 250, easing: SAIDA });
  }, () => { voa.remove(); nova.style.opacity = ''; });
}
function tirarDaDevolucao(main: HTMLElement, li: HTMLElement): void {
  const r = rasc(main), desc = li.dataset.desc!, gv = $(main, '.dev__gaveta')!;
  r.escolhidos = r.escolhidos.filter((e) => e[0] !== desc);
  const fonte = $$(gv, '.dev__c-art').find((a) => a.dataset.desc === desc);
  if (fonte) { fonte.classList.remove('is-escolhido'); const b = $<HTMLButtonElement>(fonte, '.dev__c-por'); if (b) { b.disabled = false; b.querySelector('.btn__rotulo')!.textContent = 'Devolver'; } }
  const fim = () => { li.remove(); contarCesto(main); };
  if (quieto()) { fim(); return; }
  li.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(12px)' }], { duration: 200, easing: 'ease-in' }).finished.then(fim, fim);
}
function seguir(main: HTMLElement): void {
  const r = rasc(main);
  if (r.passo === 0) { if (!r.origem) { erroPasso(main, 0, 'Escolha a fatura de onde vêm os artigos.'); return; } irPasso(main, 1); return; }
  if (r.passo === 1) {
    if (!r.escolhidos.length) { erroPasso(main, 1, 'Escolha pelo menos um artigo para devolver.'); $<HTMLElement>(main, '.dev__c-por:not([disabled])')?.focus(); return; }
    const mas = $$(main, '.dev__c-linha').filter((li) => !validarQtd(main, li));
    if (mas.length) { erroPasso(main, 1, mas.length === 1 ? 'Corrija a quantidade assinalada.' : `Corrija as ${mas.length} quantidades assinaladas.`); $<HTMLInputElement>(mas[0], '.dev__c-q')!.focus(); return; }
    irPasso(main, 2);
  }
}
/** Enviar ou guardar por enviar: os botões esperam; só depois da confirmação a devolução existe e entra na lista. */
function submeter(main: HTMLElement, enviar: boolean): void {
  const r = rasc(main), gv = $(main, '.dev__gaveta')!;
  guardarObs(main);
  const b = $<HTMLButtonElement>(gv, enviar ? '[data-c-enviar]' : '[data-c-guardar]')!; if (b.getAttribute('aria-busy') === 'true') return;
  $$<HTMLButtonElement>(gv, '.dev__c-pe .btn').forEach((x) => { x.disabled = true; });
  b.setAttribute('aria-busy', 'true'); b.innerHTML = `${rolamentoSvg('dv-' + ++nr, 'pesquisar', 'ped4__rs')}<span class="btn__rotulo">${enviar ? 'A enviar…' : 'A guardar…'}</span>`;
  window.setTimeout(() => {
    const maior = Math.max(...DEVOLUCOES.map((d) => +d.num.slice(-5)));
    const d: Devolucao = { num: `DV2024/${String(maior + 1).padStart(5, '0')}`, criada: HOJE, enviada: enviar ? HOJE : '', utilizador: 'Fernando F. França', obs: r.obs.trim(), origem: r.origem, linhas: r.escolhidos.map(([desc, q]) => [q, desc]) };
    DEVOLUCOES.push(d);
    rascunhos.delete(main);
    redesenhar(main, d.num);
    $$(gv, '.dev__passos-c li').forEach((li) => { li.className = 'is-feito'; li.removeAttribute('aria-current'); li.querySelector('span')!.innerHTML = L(circleCheck); });
    $(gv, '.dev__passos-risca')!.style.opacity = '0';
    $(gv, '.dev__c-corpo')!.outerHTML = `<div class="dev__c-corpo"><div class="dev__c-ok" role="status">${L(circleCheck)}<p><strong>${enviar ? `Devolução ${d.num} enviada à Romafe.` : `Devolução ${d.num} guardada por enviar.`}</strong>${d.linhas.length} ${d.linhas.length === 1 ? 'referência' : 'referências'} · ${unidades(d)} ${unidades(d) === 1 ? 'unidade' : 'unidades'}, da fatura ${GUIAS.find((g) => g.num === d.origem)?.doc ?? ''}${enviar ? '. A nota de crédito, se a Romafe a emitir, aparece ligada a ela.' : '. Pode enviá-la mais tarde, no painel dela.'}</p></div></div>`;
    $(gv, '.dev__c-pe')!.outerHTML = `<footer class="dev__c-pe"><button type="button" class="btn btn--ghost" data-c-cancelar>${L(x, 'btn__icone')}<span class="btn__rotulo">Fechar</span></button><span class="dev__c-pe-dir"><button type="button" class="btn btn--acao" data-ver-dev="${d.num}">${L(eye, 'btn__icone')}<span class="btn__rotulo">Ver a devolução</span></button></span></footer>`;
    const ok = $(gv, '.dev__c-ok')!;
    if (!quieto()) { ok.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: SAIDA }); $(ok, 'svg')?.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, delay: 80, easing: SAIDA, fill: 'backwards' }); }
    $<HTMLElement>(gv, '[data-ver-dev]')?.focus();
  }, quieto() ? 150 : 900);
}

/* ---------- ligar ---------- */
function armar(): void {
  const main = vivo(); if (!main) return;
  if (!criterios.has(main)) criterios.set(main, ler(main));
  if (!main.dataset.entrou) { main.dataset.entrou = '1'; if (!quieto()) main.classList.add('ped4--entrar'); kpiEntrada(main, { n: inteiro, rascunho: inteiro, enviada: inteiro, creditada: inteiro }); window.setTimeout(() => main.classList.remove('ped4--entrar'), 900); }
  if (!main.dataset.vistaLida) { main.dataset.vistaLida = '1'; const v = lidaVista(); if (v === 'tabela' || v === 'cronologia') vista(main, v, false); }
  observar(main);
  requestAnimationFrame(() => rolar(main));
}
function irDocumento(chave: string, valor: string, ecra: string): void {
  try { sessionStorage.setItem(chave, valor); } catch { /* nada */ }
  mostrar(ecra);
}

export function iniciar(): void {
  window.addEventListener('click', (ev) => {
    if (editando()) return;
    const main = vivo(); const t = ev.target as Element;
    if (!main || !main.contains(t)) return;
    if (t.closest('[data-criar-dev]')) { abrirCriar(main, t.closest<HTMLElement>('[data-criar-dev]')); return; }
    if (t.closest('.ped4__limpar, [data-limpar-tudo]')) { limpar(main); return; }
    const ef = t.closest<HTMLElement>('.ped4__etapa-f');
    if (ef) { main.dataset.etapa = ef.dataset.etapa; etapas(main); aplicar(main); return; }
    const tirar = t.closest<HTMLElement>('[data-tirar]');
    if (tirar) { const k = tirar.dataset.tirar!; if (k === 'etapa') { main.dataset.etapa = 'todas'; etapas(main); } else { const i = $<HTMLInputElement>(main, `#dev-${k}`)!; i.value = ''; i.removeAttribute('aria-invalid'); $(main, `#dev-${k}-erro`)!.hidden = true; criterios.set(main, ler(main)); } aplicar(main); return; }
    const ab = t.closest<HTMLElement>('.ped4__filtros-abrir'); if (ab) { const sim = ab.getAttribute('aria-expanded') !== 'true'; ab.setAttribute('aria-expanded', String(sim)); main.classList.toggle('filtros-abertos', sim); return; }
    /* os documentos ligados: abrem no ecrã deles, no painel */
    const ped = t.closest<HTMLElement>('[data-abrir-pedido]'); if (ped) { irDocumento('goparts:abrir-pedido', ped.dataset.abrirPedido!, 'pedidos'); return; }
    const gui = t.closest<HTMLElement>('[data-abrir-guia]'); if (gui) { irDocumento('goparts:abrir-guia', gui.dataset.abrirGuia!, 'guias'); return; }
    const fat = t.closest<HTMLElement>('[data-abrir-fatura]'); if (fat) { irDocumento('goparts:abrir-fatura', fat.dataset.abrirFatura!, 'faturas'); return; }
    const env = t.closest<HTMLButtonElement>('[data-enviar-dev]'); if (env) { enviarRascunho(main, env); return; }
    /* criar */
    const og = t.closest<HTMLElement>('.dev__c-guia');
    if (og) { if (og.getAttribute('aria-disabled') === 'true') return; const r = rasc(main); if (r.origem !== og.dataset.origem) { r.origem = og.dataset.origem!; r.escolhidos = []; } $$(main, '.dev__c-guia').forEach((g) => g.setAttribute('aria-checked', String(g === og))); erroPasso(main, 0, ''); return; }
    const por = t.closest<HTMLButtonElement>('.dev__c-por'); if (por) { porNaDevolucao(main, por); return; }
    const li = t.closest<HTMLElement>('.dev__c-linha');
    if (li && t.closest('.dev__c-tirar')) { tirarDaDevolucao(main, li); return; }
    if (li && t.closest('.dev__c-menos, .dev__c-mais')) { const i = $<HTMLInputElement>(li, '.dev__c-q')!; i.value = String(Math.max(1, (parseInt(i.value, 10) || 1) + (t.closest('.dev__c-mais') ? 1 : -1))); validarQtd(main, li); contarCesto(main); return; }
    if (t.closest('[data-c-seguir]')) { seguir(main); return; }
    if (t.closest('[data-c-voltar]')) { irPasso(main, Math.max(0, rasc(main).passo - 1)); return; }
    if (t.closest('[data-c-enviar]')) { submeter(main, true); return; }
    if (t.closest('[data-c-guardar]')) { submeter(main, false); return; }
    const ver = t.closest<HTMLElement>('[data-ver-dev]'); if (ver) { const num = ver.dataset.verDev!; const el = $(main, `.ped4__c-item[data-num="${num}"]`); el?.scrollIntoView({ block: 'center' }); painelDev(main, num, el ? $(el, '.ped4__c-cabeca') : null); return; }
    if (t.closest('[data-c-cancelar], .ped4__g-fechar, .ped4__veu')) { guardarObs(main); fecharGaveta(main); return; }
    const o = t.closest<HTMLElement>('[data-ordenar]'); if (o) { ordenar(main, o); return; }
    const vb = t.closest<HTMLElement>('.ped4__vista'); if (vb) { vista(main, vb.dataset.vista!); return; }
    if (t.closest('.dev__gaveta')) return;
    const cc = t.closest<HTMLElement>('.ped4__c-cabeca');
    if (cc) { const item = cc.closest<HTMLElement>('.ped4__c-item')!; if (!item.classList.contains('ped4__c-esq')) painelDev(main, item.dataset.num!, cc); return; }
    const tr = t.closest<HTMLElement>('tr.ped4__linha');
    if (tr && !t.closest('a, input')) painelDev(main, tr.dataset.num!, $(tr, '.ped4__abrir') ?? tr);
  }, true);
  document.addEventListener('submit', (ev) => { const main = vivo(); if (main && (ev.target as Element).closest?.('#dev-campos')) { ev.preventDefault(); pesquisar(main); } });
  document.addEventListener('keydown', (ev) => { const main = vivo(); if (!main || editando()) return; if (ev.key === 'Escape' && !$(main, '.dev__gaveta')!.hidden) { ev.preventDefault(); guardarObs(main); fecharGaveta(main); } });
  document.addEventListener('input', (ev) => {
    const i = ev.target as HTMLInputElement, main = vivo(); if (!main || !main.contains(i)) return;
    if (i.matches('.ped4__campos .ped4__input[aria-invalid]')) { i.removeAttribute('aria-invalid'); const e = document.getElementById(`${i.id}-erro`); if (e) e.hidden = true; }
    if (i.matches('.dev__c-q')) { validarQtd(main, i.closest<HTMLElement>('.dev__c-linha')!); contarCesto(main); }
  });
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  window.addEventListener('resize', () => { const m = vivo(); if (m) rolar(m); });
  document.addEventListener('scroll', aoRolar, { capture: true, passive: true });
}
