/* =========================================================
   GOPARTS — 10 · Início V5: o que mexe no painel (20 out. 2026)
   O desenho está em portal/painel.ts; os números em portal/painel-dados.ts.
   - Ao abrir: as preferências da pessoa (ordem, blocos escondidos, atalhos, período por omissão) e as pesquisas
     feitas neste navegador entram na «Atividade recente». Num estado do protótipo (10.x) nada se grava.
   - O período (Hoje, 7, 30 dias, Personalizado) muda só o que depende dele: os números contam até ao valor novo
     (≤ 400 ms) e acendem uma vez; o gráfico acompanha (Hoje mostra os últimos 7 dias). O que é «agora» fica.
   - O gráfico: desenha-se à largura do bloco; ao entrar no ecrã, os eixos aparecem, depois os pontos, a linha
     desenha-se e o total aparece (≈ 650 ms, uma vez). Mudar de métrica com o mesmo número de dias desliza os
     valores; mudar de período desenha de novo. O rato, o dedo ou as setas (com o foco no gráfico) percorrem os
     dias: a dica diz a data, os pedidos do dia, o valor do dia e o acumulado.
   - Cada número, estado, alerta, pedido e atividade leva ao seu ecrã — aberto no documento, ou já filtrado.
   - Personalizar: a gaveta muda o Início ao mesmo tempo (os blocos deslizam para o lugar novo, só transform).
   Com «reduzir movimento», nada se anima: muda logo.
   ========================================================= */
import { irFiltrado } from './filtro-chegada';
import { irPara } from './navegar';
import * as carrinho from './carrinho';
import {
  PREFS_PN, CHAVE_PN, ORDEM_W, WIDGETS, ATALHOS_PN, IC_PN, desenharGrafico, totalGrafico, atalhosHtml, gavetaHtml, atividadeLista,
  evolucaoHtml, pedidosHtml, cabecaHtml, blocosPn, type PrefsPn, type IdW, type IdAtalhoPn, type Metrica,
} from '../portal/painel';
import { HOJE, serie, periodo, textoPeriodo, eventosDocs, curta, longa, euros, deIso, type IdPeriodo, type Periodo, type Evento } from '../portal/painel-dados';
import { CHAVE_ATIVIDADE, atividadeInicial, saudacao, L, type Atividade } from '../portal/inicio-espaco';

const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CURVA = 'cubic-bezier(.22, 1, .36, 1)', MOLA = 'cubic-bezier(.2, .9, .25, 1.05)';
const vivo = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .pn');
const real = (pn: HTMLElement | null) => !!pn && !pn.dataset.estado;
const ler = <T,>(k: string, v: T): T => { try { const x = localStorage.getItem(k); return x === null ? v : JSON.parse(x) as T; } catch { return v; } };
const gravar = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento: fica só nesta página */ } };
function prefs(): PrefsPn {
  const p = ler<Partial<PrefsPn>>(CHAVE_PN, {});
  const ordem = (p.ordem ?? []).filter((w) => w in WIDGETS);
  ORDEM_W.forEach((w) => { if (!ordem.includes(w)) ordem.push(w); });
  return { ...structuredClone(PREFS_PN), ...p, ordem, atalhos: (p.atalhos ?? PREFS_PN.atalhos).filter((a) => a in ATALHOS_PN) };
}
const entrar = (el: Element | null, dur = 260, de = 'translateY(8px)') => { if (el && !quieto()) el.animate([{ opacity: 0, transform: de }, { opacity: 1, transform: 'none' }], { duration: dur, easing: CURVA }); };
const espera = (ms: number) => new Promise((r) => window.setTimeout(r, quieto() ? Math.min(ms, 150) : ms));
function aviso(pn: HTMLElement, t: string): void { const a = pn.closest('.portal--pn')?.querySelector('[data-pn-aviso]'); if (a) a.textContent = t; }

/* =========================================================
   O período
   ========================================================= */
function marcaSeg(seg: HTMLElement | null): void {
  if (!seg) return;
  const m = seg.querySelector<HTMLElement>('.pn__seg-marca'), a = seg.querySelector<HTMLElement>('[aria-checked="true"]');
  if (!m || !a) return;
  m.style.setProperty('--x', `${a.offsetLeft}px`); m.style.setProperty('--w', `${a.offsetWidth}px`);
}
function escolherSeg(seg: HTMLElement, b: HTMLElement): void {
  seg.querySelectorAll<HTMLElement>('[role="radio"]').forEach((x) => { const sim = x === b; x.setAttribute('aria-checked', String(sim)); x.tabIndex = sim ? 0 : -1; });
  marcaSeg(seg);
}
/* =========================================================
   O gráfico
   ========================================================= */
type EstadoG = { de: number; ate: number; metrica: Metrica; pontos: ReturnType<typeof serie>; xs: number[]; acumulado: number[]; foco: number; visto: boolean; anim: number };
const G = new WeakMap<HTMLElement, EstadoG>();
const dimensoes = (tela: HTMLElement) => { const w = Math.max(280, Math.round(tela.clientWidth)); return { w, h: w < 520 ? 220 : 248 }; };
function grafico(pn: HTMLElement, p: Periodo, metrica: Metrica, mudanca = false): void {
  const g = pn.querySelector<HTMLElement>('[data-graf]'); if (!g) return;
  const tela = g.querySelector<HTMLElement>('[data-graf-tela]')!;
  const antes = G.get(g);
  const pontos = serie(p).map((x) => (pn.dataset.estado === 'vazio' ? { ...x, valor: 0, pedidos: 0, nums: [] } : x));
  g.dataset.metrica = metrica; g.dataset.de = String(p.de); g.dataset.ate = String(p.ate);
  /* os segmentos do bloco */
  const w = g.closest<HTMLElement>('[data-w="evolucao"]')!;
  const sm = w.querySelector<HTMLElement>(`[data-metrica="${metrica}"]`), sp = w.querySelector<HTMLElement>(`[data-graf-periodo="${p.id}"]`);
  if (sm) escolherSeg(sm.parentElement!, sm); if (sp) escolherSeg(sp.parentElement!, sp);
  const { w: W, h: H } = dimensoes(tela);
  const st: EstadoG = { de: p.de, ate: p.ate, metrica, pontos, xs: [], acumulado: [], foco: -1, visto: antes?.visto ?? false, anim: 0 };
  G.set(g, st);
  const total = g.querySelector<HTMLElement>('[data-graf-total]')!;
  const rotulo = g.querySelector<HTMLElement>('.pn__graf-total span');
  if (rotulo) rotulo.textContent = `${metrica === 'valor' ? 'Valor das compras' : 'Pedidos'} · ${textoPeriodo(p)}`;
  g.setAttribute('aria-label', `Evolução das compras, ${textoPeriodo(p)}: ${totalGrafico(pontos, metrica)} acumulado. Use as setas para percorrer os dias.`);
  const nada = g.querySelector<HTMLElement>('.pn__graf-nada:not([data-fixo])');
  const temPedidos = pontos.some((x) => x.pedidos);
  if (pn.dataset.estado !== 'vazio') { if (nada) nada.remove(); if (!temPedidos) { const n = document.createElement('p'); n.className = 'pn__graf-nada'; n.textContent = 'Nenhum pedido neste período.'; g.appendChild(n); } }
  /* a mesma janela de dias: os valores deslizam do desenho antigo para o novo */
  const valores = (m: Metrica) => pontos.map((x) => (m === 'valor' ? x.valor : x.pedidos));
  if (mudanca && antes && antes.de === p.de && antes.ate === p.ate && antes.metrica !== metrica && !quieto() && antes.visto) {
    const a0 = escalar(antes.pontos.map((x) => (antes.metrica === 'valor' ? x.valor : x.pedidos)), valores(metrica));
    const v1 = valores(metrica), t0 = performance.now(), dur = 450;
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 3;
      const d = desenharGrafico(pontos, metrica, W, H, v1.map((v, i) => a0[i] + (v - a0[i]) * e));
      tela.innerHTML = d.svg; tela.querySelector('.pn__g')!.classList.add('is-visto');
      st.xs = d.xs; st.acumulado = d.acumulado;
      if (k < 1) st.anim = requestAnimationFrame(passo);
    };
    cancelAnimationFrame(antes.anim); st.anim = requestAnimationFrame(passo);
    contarTexto(total, totalGrafico(pontos, metrica));
    return;
  }
  const d = desenharGrafico(pontos, metrica, W, H);
  st.xs = d.xs; st.acumulado = d.acumulado;
  if (mudanca && !quieto() && st.visto) {
    const velho = tela.querySelector<SVGElement>('.pn__g');
    const trocar = () => { tela.innerHTML = d.svg; animarEntrada(tela.querySelector('.pn__g')!, true); };
    if (velho) velho.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'ease-in', fill: 'forwards' }).onfinish = trocar; else trocar();
    contarTexto(total, totalGrafico(pontos, metrica));
    return;
  }
  tela.innerHTML = d.svg;
  total.textContent = totalGrafico(pontos, metrica);
  const svg = tela.querySelector<SVGElement>('.pn__g')!;
  if (st.visto || quieto() || editando() || pn.dataset.estado) { svg.classList.add('is-visto'); st.visto = true; }
  else observar(g, svg, total);
}
/** Os valores antigos postos na escala dos novos (para o deslize entre métricas não saltar de escala). */
function escalar(a: number[], b: number[]): number[] {
  const sa = a.reduce((s, x) => s + x, 0) || 1, sb = b.reduce((s, x) => s + x, 0);
  return a.map((x) => (x / sa) * sb);
}
function contarTexto(el: HTMLElement, t: string): void { el.textContent = t; if (!quieto()) el.animate([{ opacity: .3, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: CURVA }); }
/** A entrada: eixos → pontos → linha → total. */
function animarEntrada(svg: SVGElement, rapida = false): void {
  svg.classList.remove('is-visto', 'is-espera'); void svg.getBoundingClientRect();
  svg.classList.add(rapida ? 'is-a-mudar' : 'is-a-entrar');
  window.setTimeout(() => { svg.classList.remove('is-a-entrar', 'is-a-mudar'); svg.classList.add('is-visto'); }, rapida ? 520 : 1000);
}
let obs: IntersectionObserver | null = null;
function observar(g: HTMLElement, svg: SVGElement, total: HTMLElement): void {
  obs ??= new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    obs!.unobserve(e.target);
    const gg = e.target as HTMLElement, st = G.get(gg); if (!st || st.visto) return;
    st.visto = true;
    const s = gg.querySelector<SVGElement>('.pn__g'); if (s) animarEntrada(s);
    const t = gg.querySelector<HTMLElement>('[data-graf-total]'); if (t && !quieto()) t.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 650, easing: CURVA, fill: 'backwards' });
  }), { threshold: .35 });
  void total;
  svg.classList.add('is-espera');
  obs.observe(g);
}
/* a dica: o dia mais perto do rato, do dedo ou das setas */
function focar(g: HTMLElement, i: number, anunciar = false): void {
  const st = G.get(g); if (!st || i < 0 || i >= st.pontos.length) return;
  st.foco = i;
  const p = st.pontos[i], dica = g.querySelector<HTMLElement>('[data-dica]')!, tela = g.querySelector<HTMLElement>('[data-graf-tela]')!;
  const cur = tela.querySelector<SVGLineElement>('.pn__g-cursor'), x = st.xs[i];
  if (cur) { cur.removeAttribute('hidden'); cur.setAttribute('x1', String(x)); cur.setAttribute('x2', String(x)); }
  tela.querySelectorAll('.pn__g-ponto').forEach((c) => c.classList.toggle('is-foco', Math.abs(Number(c.getAttribute('cx')) - x) < .5));
  const ac = st.acumulado[i];
  dica.innerHTML = p.semDados
    ? `<b>${longa(p.n)}</b><span>Sem dados: o histórico começa a ${curta(st.pontos.find((q) => !q.semDados)?.n ?? HOJE, true)}.</span>`
    : `<b>${longa(p.n)}</b><span>${p.pedidos ? `${p.pedidos} ${p.pedidos === 1 ? 'pedido' : 'pedidos'} · ${euros(p.valor)}` : 'Sem pedidos'}</span>${p.nums.length ? `<span class="pn__dica-nums">${p.nums.join(', ')}</span>` : ''}<span class="pn__dica-ac">Acumulado: ${st.metrica === 'valor' ? euros(ac) : `${ac} ${ac === 1 ? 'pedido' : 'pedidos'}`}</span>`;
  dica.hidden = false;
  const tw = tela.clientWidth, dw = dica.offsetWidth;
  dica.style.setProperty('--x', `${Math.max(0, Math.min(tw - dw, x - dw / 2)) + tela.offsetLeft}px`);
  if (!anunciar) dica.removeAttribute('role'); else dica.setAttribute('role', 'status');
}
function largar(g: HTMLElement): void {
  const st = G.get(g); if (st) st.foco = -1;
  g.querySelector<HTMLElement>('[data-dica]')!.hidden = true;
  g.querySelector('.pn__g-cursor')?.setAttribute('hidden', '');
  g.querySelectorAll('.pn__g-ponto.is-foco').forEach((c) => c.classList.remove('is-foco'));
}
function maisPerto(g: HTMLElement, clientX: number): number {
  const st = G.get(g); if (!st || !st.xs.length) return -1;
  const svg = g.querySelector<SVGSVGElement>('.pn__g'); if (!svg) return -1;
  const r = svg.getBoundingClientRect(), x = (clientX - r.left) * (svg.viewBox.baseVal.width / r.width);
  let k = 0; st.xs.forEach((v, i) => { if (Math.abs(v - x) < Math.abs(st.xs[k] - x)) k = i; });
  return k;
}

/* =========================================================
   Navegar a partir do painel
   ========================================================= */
function ir(id: string, chave?: string, valor?: string): void { if (chave) try { sessionStorage.setItem(chave, valor ?? ''); } catch { /* abre só o ecrã */ } irPara(id); }
const barra = (tipo: string) => document.querySelector<HTMLElement>(`.ecra:not([hidden]) > .versao:not([hidden]) [data-barra="${tipo}"]:not([hidden])`)?.click();
function atalho(a: IdAtalhoPn): void {
  if (a === 'carrinho') { barra('carrinho'); return; }
  if (a === 'lista') { ir('lista', 'goparts:lista-vista', 'listas'); return; }
  irPara(a);
}
function evento(v: string): void {
  const [ecra, chave, valor] = v.split('|');
  if (chave === 'filtro') { irFiltrado(ecra, valor); return; }
  if (ecra === 'pesquisa-ref') { ir('catalogo', 'goparts:catalogo-abrir', valor); return; }
  ir(ecra, chave || undefined, valor);
}

/* =========================================================
   A atividade deste navegador (as pesquisas) junta-se à dos documentos
   ========================================================= */
function eventosPesquisa(): Evento[] {
  return ler<Atividade[]>(CHAVE_ATIVIDADE, atividadeInicial()).map((a) => {
    const d = new Date(a.quando), n = Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
    const ref = a.tipo === 'ref' ? JSON.stringify({ tipo: 'ref', fab: a.dados.fab, ref: a.dados.ref }) : '';
    return { n, min: d.getHours() * 60 + d.getMinutes(), tipo: 'pesquisa' as const, titulo: a.tipo === 'ref' ? `Pesquisaste ${a.titulo}` : a.tipo === 'veiculo' ? `Identificaste ${a.titulo}` : `Abriste ${a.titulo}`, sub: a.sub, ir: ref ? ['pesquisa-ref', '', ref] as Evento['ir'] : ['pesquisa'] as Evento['ir'] };
  });
}
function atividade(pn: HTMLElement, max = 8): void {
  const sitio = pn.querySelector<HTMLElement>('[data-atividade]'); if (!sitio) return;
  const ev = [...eventosDocs(), ...(real(pn) ? eventosPesquisa() : [])];
  sitio.innerHTML = atividadeLista(ev, max);
  const mais = pn.querySelector<HTMLElement>('[data-mais-atividade]'); if (mais) mais.hidden = ev.length <= 8;
}

/* =========================================================
   Desenhar com as preferências (ao abrir e depois de personalizar)
   ========================================================= */
function aplicarPrefs(pn: HTMLElement, p: PrefsPn): void {
  const grelha = pn.querySelector<HTMLElement>('[data-pn-grelha]'); if (!grelha) return;
  grelha.querySelectorAll<HTMLElement>('[data-w]').forEach((w) => { const id = w.dataset.w as IdW; w.style.order = String(p.ordem.indexOf(id)); w.hidden = p.escondidos.includes(id); });
  if (p.ordem.join() === ORDEM_W.join()) grelha.dataset.ordem = 'origem'; else delete grelha.dataset.ordem;
}
function desenhar(pn: HTMLElement): void {
  const p = prefs(), per = periodo(p.periodo);
  const t = document.createElement('template');
  t.innerHTML = cabecaHtml() + blocosPn(per, p);
  pn.replaceChildren(...Array.from(t.content.childNodes));
  atividade(pn);
}

/* =========================================================
   Personalizar
   ========================================================= */
let deOnde: HTMLElement | null = null;
function fundo(portal: HTMLElement, sim: boolean): void {
  portal.querySelectorAll<HTMLElement>(':scope > .portal__topo, :scope > .portal__lado, :scope > .pn').forEach((el) => { el.inert = sim; if (sim) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden'); });
}
function abrirGaveta(pn: HTMLElement, de: HTMLElement, secao = ''): void {
  const portal = pn.closest<HTMLElement>('.portal--pn')!;
  const t = document.createElement('template'); t.innerHTML = gavetaHtml(real(pn) ? prefs() : prefsDoEcra(pn), true).trim();
  const g = t.content.firstElementChild as HTMLElement;
  const velha = portal.querySelector<HTMLElement>('.pn__gaveta'); if (velha) velha.replaceWith(g); else portal.appendChild(g);
  deOnde = de; fundo(portal, true); document.documentElement.classList.add('barra-presa');
  if (!quieto()) { g.querySelector('.pn__veu')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 }); g.querySelector('.pn__gaveta-caixa')?.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }], { duration: 260, easing: CURVA }); }
  const alvo = secao ? g.querySelector<HTMLElement>(`#pn-g-${secao}`) : null;
  if (alvo) { alvo.scrollIntoView({ block: 'start' }); alvo.querySelector<HTMLElement>('input')?.focus(); } else g.querySelector<HTMLElement>('[data-pn-pega]')?.focus();
}
function fecharGaveta(g: HTMLElement): void {
  const portal = g.closest<HTMLElement>('.portal--pn')!;
  document.documentElement.classList.remove('barra-presa');
  const fim = () => { g.hidden = true; fundo(portal, false); deOnde?.focus({ preventScroll: true }); };
  if (quieto()) { fim(); return; }
  g.querySelector('.pn__veu')?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' });
  g.querySelector('.pn__gaveta-caixa')!.animate([{ transform: 'none' }, { transform: 'translateX(100%)' }], { duration: 200, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' }).onfinish = fim;
}
/** Num estado do protótipo, as preferências de origem com o que o ecrã mostra. */
function prefsDoEcra(pn: HTMLElement): PrefsPn {
  const p = structuredClone(PREFS_PN);
  pn.querySelectorAll<HTMLElement>('[data-w]').forEach((w) => { if (w.hidden) p.escondidos.push(w.dataset.w as IdW); });
  return p;
}
function prefsDaGaveta(g: HTMLElement, pn: HTMLElement): PrefsPn {
  const p = real(pn) ? prefs() : prefsDoEcra(pn);
  p.ordem = Array.from(g.querySelectorAll<HTMLElement>('[data-w-ordem]')).map((x) => x.dataset.wOrdem as IdW);
  p.escondidos = Array.from(g.querySelectorAll<HTMLInputElement>('[data-pn-mostrar]')).filter((x) => !x.checked).map((x) => x.dataset.pnMostrar as IdW);
  p.periodo = (g.querySelector<HTMLInputElement>('[data-pn-periodo-omissao]:checked')?.value as PrefsPn['periodo']) ?? '7';
  p.atalhos = Array.from(g.querySelectorAll<HTMLInputElement>('[data-pn-atalho-escolha]:checked')).map((x) => x.dataset.pnAtalhoEscolha as IdAtalhoPn);
  return p;
}
/** Os blocos deslizam para o lugar novo (FLIP: só transform). */
function flip(els: HTMLElement[], mudar: () => void, dur = 380): void {
  if (quieto()) { mudar(); return; }
  const antes = new Map(els.map((el) => [el, el.getBoundingClientRect()]));
  mudar();
  els.forEach((el) => {
    const a = antes.get(el)!; if (el.hidden || !a.height) return;
    const b = el.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: dur, easing: MOLA });
  });
}
function aplicar(g: HTMLElement): void {
  const pn = g.closest('.portal--pn')!.querySelector<HTMLElement>('.pn')!, p = prefsDaGaveta(g, pn);
  if (real(pn)) gravar(CHAVE_PN, p);
  const ws = Array.from(pn.querySelectorAll<HTMLElement>('[data-w]'));
  const aparecem = ws.filter((w) => w.hidden && !p.escondidos.includes(w.dataset.w as IdW));
  flip(ws, () => aplicarPrefs(pn, p));
  aparecem.forEach((w) => entrar(w, 300, 'scale(.98)'));
  const at = pn.querySelector<HTMLElement>('[data-w="atalhos"]');
  if (at && Array.from(at.querySelectorAll<HTMLElement>('[data-pn-atalho]')).map((x) => x.dataset.pnAtalho).join() !== p.atalhos.join()) {
    const t = document.createElement('template'); t.innerHTML = atalhosHtml(p).trim();
    const novo = t.content.firstElementChild as HTMLElement; novo.style.order = at.style.order; novo.hidden = at.hidden; at.replaceWith(novo);
  }
  /* depois de a grelha mudar, o gráfico pode ter outra largura */
  requestAnimationFrame(() => redesenharGrafico(pn));
}
type Arrasto = { li: HTMLElement; lugar: HTMLElement; lista: HTMLElement; dy: number; id: number };
let arrasto: Arrasto | null = null;
function comecarArrasto(ev: PointerEvent, pega: HTMLElement): void {
  const li = pega.closest<HTMLElement>('.pn__ordem-li')!, lista = li.parentElement as HTMLElement, r = li.getBoundingClientRect();
  ev.preventDefault(); pega.setPointerCapture(ev.pointerId);
  const lugar = document.createElement('li'); lugar.className = 'pn__ordem-lugar'; lugar.setAttribute('aria-hidden', 'true'); lugar.style.height = `${r.height}px`;
  li.after(lugar); li.classList.add('is-a-arrastar');
  Object.assign(li.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, zIndex: '5' });
  arrasto = { li, lugar, lista, dy: ev.clientY - r.top, id: ev.pointerId };
}
function moverArrasto(ev: PointerEvent): void {
  if (!arrasto || ev.pointerId !== arrasto.id) return;
  const { li, lugar, lista, dy } = arrasto;
  li.style.top = `${ev.clientY - dy}px`;
  const irmaos = Array.from(lista.querySelectorAll<HTMLElement>('.pn__ordem-li:not(.is-a-arrastar)'));
  const depois = irmaos.find((x) => { const r = x.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2; }) ?? null;
  const atual = lugar.nextElementSibling === li ? li.nextElementSibling : lugar.nextElementSibling;
  if (depois === atual) return;
  flip(irmaos, () => { if (depois) lista.insertBefore(lugar, depois); else lista.appendChild(lugar); }, 220);
  lista.insertBefore(li, lugar);
  aplicar(lista.closest<HTMLElement>('.pn__gaveta')!);
}
function largarArrasto(ev: PointerEvent): void {
  if (!arrasto || ev.pointerId !== arrasto.id) return;
  const { li, lugar, lista } = arrasto; arrasto = null;
  const de = li.getBoundingClientRect(), para = lugar.getBoundingClientRect();
  li.classList.remove('is-a-arrastar'); li.removeAttribute('style'); lugar.replaceWith(li);
  if (!quieto()) li.animate([{ transform: `translate(${de.left - para.left}px, ${de.top - para.top}px)` }, { transform: 'none' }], { duration: 320, easing: MOLA });
  const g = lista.closest<HTMLElement>('.pn__gaveta')!; aplicar(g); anunciar(g, li);
  li.querySelector<HTMLElement>('[data-pn-pega]')?.focus({ preventScroll: true });
}
function anunciar(g: HTMLElement, li: HTMLElement): void {
  const todos = Array.from(g.querySelectorAll('[data-w-ordem]')), a = g.querySelector('[data-pn-ordem-aviso]');
  if (a) a.textContent = `${WIDGETS[li.dataset.wOrdem as IdW][0]}: posição ${todos.indexOf(li) + 1} de ${todos.length}.`;
}
function moverComTeclas(pega: HTMLElement, passo: number): void {
  const li = pega.closest<HTMLElement>('.pn__ordem-li')!, lista = li.parentElement!, irmaos = Array.from(lista.children) as HTMLElement[];
  const i = irmaos.indexOf(li), j = i + passo; if (j < 0 || j >= irmaos.length) return;
  flip(irmaos, () => { if (passo < 0) lista.insertBefore(li, irmaos[j]); else irmaos[j].after(li); }, 220);
  pega.focus(); const g = lista.closest<HTMLElement>('.pn__gaveta')!; aplicar(g); anunciar(g, li);
}
function repor(g: HTMLElement): void {
  const t = document.createElement('template'); t.innerHTML = gavetaHtml(structuredClone(PREFS_PN), true).trim();
  g.querySelector('.pn__gaveta-corpo')!.replaceWith((t.content.firstElementChild as HTMLElement).querySelector('.pn__gaveta-corpo')!);
  aplicar(g);
  g.querySelector<HTMLElement>('[data-pn-repor]')?.focus();
  const pn = g.closest('.portal--pn')!.querySelector<HTMLElement>('.pn')!; aviso(pn, 'O Início voltou à disposição de origem.');
}

/* =========================================================
   Tentar de novo (um bloco que falhou)
   ========================================================= */
async function tentar(pn: HTMLElement, b: HTMLElement): Promise<void> {
  const w = b.dataset.pnTentar as IdW, bloco = b.closest<HTMLElement>('[data-w]')!;
  b.setAttribute('aria-busy', 'true'); (b as HTMLButtonElement).disabled = true;
  b.querySelector('.btn__rotulo')!.textContent = 'A carregar…';
  await espera(900);
  const gg = pn.querySelector<HTMLElement>('[data-graf]'), p = gg ? { id: 'pers' as IdPeriodo, de: Number(gg.dataset.de), ate: Number(gg.dataset.ate) } : periodo('7'), pr = real(pn) ? prefs() : structuredClone(PREFS_PN);
  const html = w === 'evolucao' ? evolucaoHtml(p, pr) : w === 'pedidos' ? pedidosHtml(pr) : '';
  if (!html) return;
  const t = document.createElement('template'); t.innerHTML = html.trim();
  const novo = t.content.firstElementChild as HTMLElement; novo.style.order = bloco.style.order; bloco.replaceWith(novo);
  entrar(novo.querySelector('[data-corpo]'), 260);
  if (w === 'evolucao') requestAnimationFrame(() => { novo.querySelectorAll<HTMLElement>('.pn__seg').forEach(marcaSeg); grafico(pn, periodo(pr.periodo), 'valor'); });
}

/* =========================================================
   Ligar
   ========================================================= */
/** «Adicionar» das referências frequentes: só diz «No carrinho» depois de o carrinho aceitar. */
async function pedir(b: HTMLElement): Promise<void> {
  if (b.getAttribute('aria-busy')) return;
  const antes = b.innerHTML; b.setAttribute('aria-busy', 'true'); (b as HTMLButtonElement).disabled = true;
  b.querySelector('.btn__rotulo')!.textContent = 'A adicionar…';
  const ok = await carrinho.adicionar(b.dataset.pnPedir!, 1);
  b.removeAttribute('aria-busy');
  b.innerHTML = `${L(ok ? IC_PN.check : IC_PN.triangleAlert, 'btn__icone')}<span class="btn__rotulo">${ok ? 'No carrinho' : 'Não adicionado'}</span>`;
  b.classList.toggle('is-feito', ok);
  window.setTimeout(() => { b.innerHTML = antes; b.classList.remove('is-feito'); (b as HTMLButtonElement).disabled = false; }, ok ? 1600 : 2400);
}
function redesenharGrafico(pn: HTMLElement): void {
  const g = pn.querySelector<HTMLElement>('[data-graf]'); if (!g) return;
  const st = G.get(g), p = periodo((pn.querySelector<HTMLElement>('[data-graf-periodo][aria-checked="true"]')?.dataset.grafPeriodo as IdPeriodo) || '7', Number(g.dataset.de), Number(g.dataset.ate));
  grafico(pn, p.id === 'pers' ? { id: 'pers', de: Number(g.dataset.de), ate: Number(g.dataset.ate) } : p, (g.dataset.metrica as Metrica) || 'valor');
  if (st?.visto) g.querySelector('.pn__g')?.classList.add('is-visto');
}
let atual: HTMLElement | null = null;
function armar(): void {
  const pn = vivo();
  if (!pn || pn === atual) { if (!pn) atual = null; return; }
  atual = pn;
  if (real(pn) && !editando()) desenhar(pn);
  else { const s = pn.querySelector('[data-saudacao]'); if (s) s.textContent = saudacao(new Date().getHours()); }
  requestAnimationFrame(() => {
    pn.querySelectorAll<HTMLElement>('.pn__seg').forEach(marcaSeg);
    const g = pn.querySelector<HTMLElement>('[data-graf]');
    if (g) { const pg = periodo((g.closest('[data-w]')!.querySelector<HTMLElement>('[data-graf-periodo][aria-checked="true"]')?.dataset.grafPeriodo as IdPeriodo) || '7', Number(g.dataset.de), Number(g.dataset.ate)); grafico(pn, pg, (g.dataset.metrica as Metrica) || 'valor'); }
    entradaBarras(pn);
  });
}
/** As barras do estado das encomendas crescem uma vez, quando aparecem (só transform). */
function entradaBarras(pn: HTMLElement): void {
  if (quieto() || pn.dataset.estado || editando()) return;
  const ul = pn.querySelector<HTMLElement>('.pn__estados'); if (!ul) return;
  ul.classList.add('is-a-esperar');
  const o = new IntersectionObserver((es) => { if (!es[0].isIntersecting) return; o.disconnect(); ul.classList.remove('is-a-esperar'); ul.classList.add('is-a-crescer'); }, { threshold: .3 });
  o.observe(ul);
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  let rt = 0;
  window.addEventListener('resize', () => { window.clearTimeout(rt); rt = window.setTimeout(() => { const pn = vivo(); if (!pn) return; pn.querySelectorAll<HTMLElement>('.pn__seg').forEach(marcaSeg); redesenharGrafico(pn); }, 120); });
  /* o carrinho mudou: nada a mudar no painel além do atalho, que abre o carrinho da barra */
  carrinho.ouvir(() => {});

  document.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element, portal = t.closest?.<HTMLElement>('.portal--pn'); if (!portal) return;
    const pn = portal.querySelector<HTMLElement>('.pn')!;
    const q = <E extends HTMLElement = HTMLElement>(s: string) => t.closest<E>(s);
    let b: HTMLElement | null;
    const g = q('.pn__gaveta');
    if (g) {
      if (q('[data-pn-fechar]')) { fecharGaveta(g); return; }
      if (q('[data-pn-repor]')) { repor(g); return; }
      return;
    }
    if (!pn.contains(t)) return;
    if ((b = q('[data-pn-personalizar]'))) { abrirGaveta(pn, b, b.dataset.pnPersonalizar ?? ''); return; }
    /* (V6) o atalho da pesquisa: abre a Pesquisar peças no modo escolhido */
    if ((b = q('[data-pn-pesquisa]'))) { irPara('pesquisa', Number(b.dataset.pnPesquisa)); return; }
    if ((b = q('[data-pn-ficha]'))) { ir('catalogo', 'goparts:catalogo-abrir', JSON.stringify({ tipo: 'ref', fab: b.dataset.pnFab, ref: b.dataset.pnFicha })); return; }
    if ((b = q('[data-pn-pedir]'))) { void pedir(b); return; }
    if ((b = q('[data-pn-lista]'))) { ir('lista', 'goparts:lista-abrir', b.dataset.pnLista); return; }
    /* o gráfico */
    if ((b = q('[data-metrica]')) && b.matches('[role="radio"]')) { const gg = pn.querySelector<HTMLElement>('[data-graf]'); if (gg) { const st = G.get(gg)!; grafico(pn, { id: 'pers', de: st.de, ate: st.ate }, b.dataset.metrica as Metrica, true); } return; }
    if ((b = q('[data-graf-periodo]'))) {
      const id = b.dataset.grafPeriodo as IdPeriodo, gg = pn.querySelector<HTMLElement>('[data-graf]'); if (!gg) return;
      const f = pn.querySelector<HTMLFormElement>('[data-w="evolucao"] [data-pers]');
      /* «Personalizado» abre as datas; o gráfico muda quando se aplicam */
      if (id === 'pers') { escolherSeg(b.parentElement!, b); if (f) { f.hidden = false; entrar(f, 200, 'translateY(-4px)'); f.querySelector<HTMLInputElement>('input')?.focus(); } return; }
      if (f) f.hidden = true;
      grafico(pn, periodo(id), gg.dataset.metrica as Metrica, true);
      return;
    }
    /* para onde levam os números, os estados, os alertas, os pedidos e a atividade */
    if ((b = q('[data-pn-ir]'))) { const e = b.dataset.etapa; if (e) irFiltrado(b.dataset.pnIr!, e); else if (b.dataset.pnChave) ir(b.dataset.pnIr!, b.dataset.pnChave, b.dataset.pnValor); else irPara(b.dataset.pnIr!); return; }
    if ((b = q('[data-ir-doc]'))) { ir(b.dataset.irDoc!, b.dataset.chave, b.dataset.valor); return; }
    if ((b = q('[data-ir-filtro]'))) { irFiltrado(b.dataset.irFiltro!, b.dataset.etapaAlvo!); return; }
    if ((b = q('[data-abrir-pedido]'))) { ir('pedidos', 'goparts:abrir-pedido', b.dataset.abrirPedido); return; }
    if ((b = q('[data-evento]'))) { evento(b.dataset.evento!); return; }
    if ((b = q('[data-pn-atalho]'))) { atalho(b.dataset.pnAtalho as IdAtalhoPn); return; }
    if ((b = q('[data-mais-atividade]'))) { const aberto = b.getAttribute('aria-expanded') === 'true'; atividade(pn, aberto ? 8 : 40); b.setAttribute('aria-expanded', String(!aberto)); b.querySelector('svg')?.style.setProperty('transform', aberto ? '' : 'rotate(180deg)'); b.firstChild!.textContent = aberto ? 'Mostrar mais' : 'Mostrar menos'; return; }
    if ((b = q('[data-pn-tentar]'))) { void tentar(pn, b); return; }
  });

  document.addEventListener('submit', (ev) => {
    const f = ev.target as HTMLFormElement; if (!f.matches?.('.pn [data-pers]')) return;
    ev.preventDefault();
    const pn = f.closest<HTMLElement>('.pn')!, err = f.querySelector<HTMLElement>('.pn__pers-erro')!, gg = pn.querySelector<HTMLElement>('[data-graf]');
    const de = (f.elements.namedItem('de') as HTMLInputElement).value, ate = (f.elements.namedItem('ate') as HTMLInputElement).value;
    if (!de || !ate) { err.textContent = 'Escolhe as duas datas.'; return; }
    const a = deIso(de), b = deIso(ate);
    if (a > b) { err.textContent = 'A data «De» tem de ser antes da data «Até».'; return; }
    if (b > HOJE) { err.textContent = `Os dados vão até ${curta(HOJE, true)}.`; return; }
    if (b - a > 365) { err.textContent = 'Escolhe no máximo um ano.'; return; }
    err.textContent = '';
    if (gg) grafico(pn, periodo('pers', a, b), gg.dataset.metrica as Metrica, true);
    aviso(pn, `Gráfico: ${textoPeriodo(periodo('pers', a, b))}.`);
  });

  /* o gráfico: o rato, o dedo e as setas */
  document.addEventListener('pointermove', (ev) => { const g = (ev.target as Element).closest?.<HTMLElement>('.pn [data-graf]'); if (g) focar(g, maisPerto(g, ev.clientX)); });
  document.addEventListener('pointerdown', (ev) => { const g = (ev.target as Element).closest?.<HTMLElement>('.pn [data-graf]'); if (g && ev.pointerType !== 'mouse') focar(g, maisPerto(g, ev.clientX)); });
  /* com o rato, a dica sai quando ele sai; com o dedo, fica até tocar fora do gráfico */
  document.addEventListener('pointerout', (ev) => { if (ev.pointerType !== 'mouse') return; const g = (ev.target as Element).closest?.<HTMLElement>('.pn [data-graf]'); if (g && !g.contains(ev.relatedTarget as Node) && document.activeElement !== g) largar(g); });
  document.addEventListener('pointerdown', (ev) => { if (ev.pointerType === 'mouse' || (ev.target as Element).closest?.('.pn [data-graf]')) return; document.querySelectorAll<HTMLElement>('.pn [data-graf]').forEach(largar); });
  document.addEventListener('focusout', (ev) => { const g = (ev.target as Element).closest?.<HTMLElement>('.pn [data-graf]'); if (g && ev.target === g) largar(g); });

  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLElement, g = t.closest?.<HTMLElement>('.pn__gaveta'); if (!g) return;
    if (t.matches('[data-pn-atalho-escolha]') && g.querySelectorAll('[data-pn-atalho-escolha]:checked').length > 8) { (t as HTMLInputElement).checked = false; return; }
    aplicar(g);
  });
  document.addEventListener('pointerdown', (ev) => { const p = (ev.target as Element).closest?.<HTMLElement>('.pn__gaveta [data-pn-pega]'); if (p && ev.button === 0) comecarArrasto(ev, p); });
  document.addEventListener('pointermove', moverArrasto);
  document.addEventListener('pointerup', largarArrasto);
  document.addEventListener('pointercancel', largarArrasto);

  document.addEventListener('keydown', (ev) => {
    if (editando()) return;
    const t = ev.target as HTMLElement;
    const g = t.closest?.<HTMLElement>('.pn__gaveta');
    if (g) {
      if (ev.key === 'Escape') { ev.preventDefault(); fecharGaveta(g); return; }
      if (t.matches('[data-pn-pega]') && (ev.key === 'ArrowUp' || ev.key === 'ArrowDown')) { ev.preventDefault(); moverComTeclas(t, ev.key === 'ArrowUp' ? -1 : 1); return; }
      if (ev.key === 'Tab') {
        const f = Array.from(g.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')).filter((x) => x.offsetParent);
        if (ev.shiftKey && t === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); } else if (!ev.shiftKey && t === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
      }
      return;
    }
    /* os segmentos (rádio): ← → mudam e escolhem */
    if (t.matches?.('.pn [role="radio"]') && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) {
      ev.preventDefault();
      const ops = Array.from(t.parentElement!.querySelectorAll<HTMLElement>('[role="radio"]')), i = ops.indexOf(t);
      const n = ops[(i + (ev.key === 'ArrowRight' ? 1 : -1) + ops.length) % ops.length]; n.focus(); n.click(); return;
    }
    /* o gráfico com o foco: ← → um dia, Home End o primeiro e o último */
    if (t.matches?.('.pn [data-graf]')) {
      const st = G.get(t); if (!st) return;
      const k = ev.key === 'ArrowRight' ? st.foco + 1 : ev.key === 'ArrowLeft' ? (st.foco < 0 ? st.pontos.length - 1 : st.foco - 1) : ev.key === 'Home' ? 0 : ev.key === 'End' ? st.pontos.length - 1 : null;
      if (k === null) { if (ev.key === 'Escape') largar(t); return; }
      ev.preventDefault(); focar(t, Math.max(0, Math.min(st.pontos.length - 1, k)), true);
    }
    /* uma linha da tabela: Enter abre (o botão do número já o faz) */
  });
}
