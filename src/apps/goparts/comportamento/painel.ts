/* =========================================================
   GOPARTS — 10 · Início V7: o que mexe (21 out. 2026)
   O desenho está em portal/painel.ts; os números em portal/painel-dados.ts.
   - Ao abrir (uma vez por sessão): o cabeçalho, os números, os pedidos, a atenção e o gráfico entram em sequência
     curta (opacidade e 8 px, 300 ms, 60 ms entre cada). Tudo se pode usar logo. Os números não contam do zero: só
     se animam quando o valor muda de facto (ao atualizar).
   - O período (cabeçalho) muda o gráfico; «Personalizado» abre as datas. A métrica muda no próprio bloco.
   - O gráfico desenha-se uma vez quando aparece; mudar de métrica desliza os valores; mudar de período redesenha.
   - Cada pedido (a linha toda), número e alerta leva ao seu ecrã; um alerta abre o pormenor no sítio.
   - «Atualizar»: os dados ficam à vista, só a hora diz «A atualizar…»; sem ligação, o aviso diz de quando são.
   - As definições: os blocos à vista, o período ao abrir e o acesso rápido; ficam no navegador por conta.
   Com «reduzir movimento», nada se anima.
   ========================================================= */
import { irFiltrado } from './filtro-chegada';
import { irPara } from './navegar';
import {
  PREFS_PN, CHAVE_PN, ORDEM_W, ATALHOS_PN, IC_PN, desenharGrafico, totalGrafico, atalhosHtml, gavetaHtml, cabecaHtml, blocosPn,
  evolucaoHtml, pedidosHtml, atencaoHtml, avisoOffline, avisoNav, type PrefsPn, type IdW, type IdAtalhoPn, type Metrica,
} from '../portal/painel';
import { HOJE, INICIO_PEDIDOS, kpis, serie, periodo, textoPeriodo, curta, longa, euros, deIso, numerica, type IdPeriodo, type Periodo } from '../portal/painel-dados';
import { saudacao, L } from '../portal/inicio-espaco';

const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CURVA = 'cubic-bezier(.22, 1, .36, 1)';
const vivo = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .pn');
const real = (pn: HTMLElement | null) => !!pn && !pn.dataset.estado;
const ler = <T,>(k: string, v: T): T => { try { const x = localStorage.getItem(k); return x === null ? v : JSON.parse(x) as T; } catch { return v; } };
const gravar = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* fica só nesta página */ } };
function prefs(): PrefsPn {
  const p = ler<Partial<PrefsPn>>(CHAVE_PN, {});
  return { ...structuredClone(PREFS_PN), ...p, escondidos: (p.escondidos ?? []).filter((w) => ORDEM_W.includes(w)), atalhos: (p.atalhos ?? PREFS_PN.atalhos).filter((a) => a in ATALHOS_PN) };
}
const entrar = (el: Element | null, dur = 260, de = 'translateY(8px)', atraso = 0) => { if (el && !quieto()) el.animate([{ opacity: 0, transform: de }, { opacity: 1, transform: 'none' }], { duration: dur, delay: atraso, easing: CURVA, fill: 'backwards' }); };
const espera = (ms: number) => new Promise((r) => window.setTimeout(r, quieto() ? Math.min(ms, 150) : ms));
function aviso(pn: HTMLElement, t: string): void { const a = pn.closest('.portal--pn')?.querySelector('[data-pn-aviso]'); if (a) a.textContent = t; }
const hora = () => new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

/* ---------- os segmentos (rádio) ---------- */
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
  const pontos = serie(p);
  g.dataset.metrica = metrica; g.dataset.de = String(p.de); g.dataset.ate = String(p.ate);
  /* os segmentos do bloco */
  const sm = pn.querySelector<HTMLElement>(`[data-metrica="${metrica}"]`), sp = pn.querySelector<HTMLElement>(`[data-periodo="${p.id}"]`);
  if (sm) escolherSeg(sm.parentElement!, sm); if (sp) escolherSeg(sp.parentElement!, sp);
  const { w: W, h: H } = dimensoes(tela);
  const st: EstadoG = { de: p.de, ate: p.ate, metrica, pontos, xs: [], acumulado: [], foco: -1, visto: antes?.visto ?? false, anim: 0 };
  G.set(g, st);
  const total = g.querySelector<HTMLElement>('[data-graf-total]')!;
  const rotulo = g.querySelector<HTMLElement>('.pn__graf-total span');
  if (rotulo) rotulo.textContent = `${metrica === 'valor' ? 'sem IVA · ' : ''}${textoPeriodo(p)}`;
  g.setAttribute('aria-label', `Atividade de compras, ${textoPeriodo(p)}: ${totalGrafico(pontos, metrica)}. Usa as setas para percorrer os dias.`);
  /* sem pedidos no período, ou antes do histórico: di-lo por cima do gráfico (nunca zeros inventados) */
  g.querySelector('.pn__graf-nada')?.remove();
  const semHist = pontos.every((x) => x.semDados);
  if (semHist || !pontos.some((x) => x.pedidos)) { const n = document.createElement('p'); n.className = 'pn__graf-nada'; n.setAttribute('role', 'status'); n.textContent = semHist ? `Sem histórico neste período: os pedidos começam a ${numerica(INICIO_PEDIDOS)}.` : 'Nenhum pedido neste período.'; g.appendChild(n); }
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
   Navegar a partir do Início (com o aviso, se o ecrã não abrir)
   ========================================================= */
function ir(pn: HTMLElement, id: string, chave?: string, valor?: string): void {
  if (!document.querySelector(`.ecra[data-ecra="${id}"]`)) { const av = pn.querySelector('[data-avisos]'); if (av && valor) { av.innerHTML = avisoNav(valor); entrar(av.firstElementChild, 200, 'translateY(-4px)'); } return; }
  if (chave) try { sessionStorage.setItem(chave, valor ?? ''); } catch { /* abre só o ecrã */ }
  irPara(id);
}
const barra = (tipo: string) => document.querySelector<HTMLElement>(`.ecra:not([hidden]) > .versao:not([hidden]) [data-barra="${tipo}"]:not([hidden])`)?.click();
function atalho(pn: HTMLElement, a: IdAtalhoPn): void {
  if (a === 'carrinho') { barra('carrinho'); return; }
  if (a === 'lista') { ir(pn, 'lista', 'goparts:lista-vista', 'listas'); return; }
  irPara(a);
}

/* =========================================================
   Desenhar com as definições da pessoa; atualizar; sem ligação
   ========================================================= */
function desenhar(pn: HTMLElement): void {
  const p = prefs(), per = periodo(p.periodo);
  const t = document.createElement('template');
  t.innerHTML = cabecaHtml(per) + blocosPn(per, p);
  pn.replaceChildren(...Array.from(t.content.childNodes));
  if (!navigator.onLine) semLigacao(pn, true);
}
function aplicarPrefs(pn: HTMLElement, p: PrefsPn): void {
  pn.querySelectorAll<HTMLElement>('[data-w]').forEach((w) => { w.hidden = p.escondidos.includes(w.dataset.w as IdW); });
  /* sem a atenção, os pedidos ocupam a linha; sem o gráfico, o acesso rápido */
  pn.querySelector('.pn__centro')?.classList.toggle('is-um', pn.querySelectorAll('.pn__centro > [data-w]:not([hidden])').length < 2);
  pn.querySelector('.pn__baixo')?.classList.toggle('is-um', pn.querySelectorAll('.pn__baixo > [data-w]:not([hidden])').length < 2);
}
function semLigacao(pn: HTMLElement, sim: boolean): void {
  const av = pn.querySelector<HTMLElement>('[data-avisos]'), b = pn.querySelector<HTMLButtonElement>('[data-pn-atualizar]');
  if (b) b.disabled = sim;
  if (!av) return;
  const atual = av.querySelector('.pn__aviso-linha--offline');
  if (sim && !atual) { const quando = (pn.querySelector('[data-atualizado]')?.textContent ?? '').replace(/^Atualizado às /, '') || hora(); av.insertAdjacentHTML('afterbegin', avisoOffline(quando)); entrar(av.firstElementChild, 200, 'translateY(-4px)'); }
  if (!sim && atual) atual.remove();
}
function contarKpi(el: HTMLElement, de: number, para: number): void {
  const fmt = (n: number) => String(Math.round(n)).padStart(2, '0');
  if (quieto() || de === para) { el.textContent = fmt(para); return; }
  const t0 = performance.now(), dur = 400;
  const passo = (t: number) => { const k = Math.min(1, (t - t0) / dur); el.textContent = fmt(de + (para - de) * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
  el.closest('.pn__kpi')?.animate([{ boxShadow: 'inset 0 0 0 1px var(--c-acao)' }, { boxShadow: 'inset 0 0 0 1px transparent' }], { duration: 800 });
}
/** «Atualizar»: os dados ficam à vista; só a hora diz que está a atualizar. Os números só mexem se mudarem. */
async function atualizar(pn: HTMLElement): Promise<void> {
  const b = pn.querySelector<HTMLButtonElement>('[data-pn-atualizar]'), h = pn.querySelector<HTMLElement>('[data-atualizado]');
  if (!b || b.disabled) return;
  b.disabled = true; b.classList.add('is-a-rodar'); if (h) h.innerHTML = `${L(IC_PN.refreshCw, 'pn__roda')}A atualizar…`;
  await espera(900);
  b.classList.remove('is-a-rodar');
  if (!navigator.onLine) { semLigacao(pn, true); if (h) h.textContent = 'Por atualizar'; return; }
  b.disabled = false; if (h) h.textContent = `Atualizado às ${hora()}`;
  kpis().forEach((k) => { const v = pn.querySelector<HTMLElement>(`[data-kpi="${k.id}"] .pn__kpi-valor`); if (!v) return; const de = Number(v.dataset.valor); v.dataset.valor = String(k.valor); contarKpi(v, de, k.valor); });
  aviso(pn, `Dados atualizados às ${hora()}.`);
}

/* =========================================================
   (V8) Um pedido: a linha abre-se e o percurso revela-se, passo a passo; o atual em destaque
   ========================================================= */
function abrirLinha(tr: HTMLElement): void {
  const bt = tr.querySelector<HTMLElement>('.pn__abrir'); if (!bt) return;
  const det = document.getElementById(bt.getAttribute('aria-controls')!)!, abrir = bt.getAttribute('aria-expanded') !== 'true';
  bt.setAttribute('aria-expanded', String(abrir)); tr.classList.toggle('is-aberta', abrir); det.hidden = !abrir;
  if (abrir && !quieto()) { entrar(det.querySelector('.pn__percurso'), 240, 'translateY(-4px)'); det.querySelectorAll<HTMLElement>('.pn__percurso li').forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateX(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: 70 * i, easing: CURVA, fill: 'backwards' })); }
}

/* =========================================================
   Os alertas: abrir o pormenor no sítio
   ========================================================= */
function abrirAlerta(cab: HTMLElement): void {
  const det = document.getElementById(cab.getAttribute('aria-controls')!)!, abrir = cab.getAttribute('aria-expanded') !== 'true';
  cab.setAttribute('aria-expanded', String(abrir)); det.hidden = !abrir;
  if (abrir) entrar(det, 220, 'translateY(-4px)');
}

/* =========================================================
   As definições (gaveta)
   ========================================================= */
let deOnde: HTMLElement | null = null;
function fundo(portal: HTMLElement, sim: boolean): void {
  portal.querySelectorAll<HTMLElement>(':scope > .portal__topo, :scope > .portal__lado, :scope > .pn').forEach((el) => { el.inert = sim; if (sim) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden'); });
}
function abrirGaveta(pn: HTMLElement, de: HTMLElement): void {
  const portal = pn.closest<HTMLElement>('.portal--pn')!;
  const t = document.createElement('template'); t.innerHTML = gavetaHtml(real(pn) ? prefs() : prefsDoEcra(pn), true).trim();
  const g = t.content.firstElementChild as HTMLElement;
  const velha = portal.querySelector<HTMLElement>('.pn__gaveta:not(.pn__sessao)'); if (velha) velha.replaceWith(g); else portal.appendChild(g);
  deOnde = de; fundo(portal, true); document.documentElement.classList.add('barra-presa');
  if (!quieto()) { g.querySelector('.pn__veu')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 }); g.querySelector('.pn__gaveta-caixa')?.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }], { duration: 260, easing: CURVA }); }
  g.querySelector<HTMLElement>('input')?.focus();
}
function fecharGaveta(g: HTMLElement): void {
  const portal = g.closest<HTMLElement>('.portal--pn')!;
  document.documentElement.classList.remove('barra-presa');
  const fim = () => { g.hidden = true; fundo(portal, false); deOnde?.focus({ preventScroll: true }); };
  if (quieto()) { fim(); return; }
  g.querySelector('.pn__veu')?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' });
  g.querySelector('.pn__gaveta-caixa')!.animate([{ transform: 'none' }, { transform: 'translateX(100%)' }], { duration: 200, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' }).onfinish = fim;
}
function prefsDoEcra(pn: HTMLElement): PrefsPn {
  const p = structuredClone(PREFS_PN);
  pn.querySelectorAll<HTMLElement>('[data-w]').forEach((w) => { if (w.hidden) p.escondidos.push(w.dataset.w as IdW); });
  return p;
}
function prefsDaGaveta(g: HTMLElement, pn: HTMLElement): PrefsPn {
  const p = real(pn) ? prefs() : prefsDoEcra(pn);
  p.escondidos = Array.from(g.querySelectorAll<HTMLInputElement>('[data-pn-mostrar]')).filter((x) => !x.checked).map((x) => x.dataset.pnMostrar as IdW);
  p.periodo = (g.querySelector<HTMLInputElement>('[data-pn-periodo-omissao]:checked')?.value as PrefsPn['periodo']) ?? '30';
  p.atalhos = Array.from(g.querySelectorAll<HTMLInputElement>('[data-pn-atalho-escolha]:checked')).map((x) => x.dataset.pnAtalhoEscolha as IdAtalhoPn);
  return p;
}
function aplicar(g: HTMLElement): void {
  const pn = g.closest('.portal--pn')!.querySelector<HTMLElement>('.pn')!, p = prefsDaGaveta(g, pn);
  if (real(pn)) gravar(CHAVE_PN, p);
  const aparecem = Array.from(pn.querySelectorAll<HTMLElement>('[data-w]')).filter((w) => w.hidden && !p.escondidos.includes(w.dataset.w as IdW));
  aplicarPrefs(pn, p);
  aparecem.forEach((w) => entrar(w, 260, 'scale(.98)'));
  const at = pn.querySelector<HTMLElement>('[data-w="atalhos"]');
  if (at && Array.from(at.querySelectorAll<HTMLElement>('[data-pn-atalho]')).map((x) => x.dataset.pnAtalho).join() !== p.atalhos.join()) {
    const t = document.createElement('template'); t.innerHTML = atalhosHtml(p).trim();
    const novo = t.content.firstElementChild as HTMLElement; novo.hidden = at.hidden; at.replaceWith(novo);
  }
  requestAnimationFrame(() => redesenharGrafico(pn));
}
function repor(g: HTMLElement): void {
  const t = document.createElement('template'); t.innerHTML = gavetaHtml(structuredClone(PREFS_PN), true).trim();
  g.querySelector('.pn__gaveta-corpo')!.replaceWith((t.content.firstElementChild as HTMLElement).querySelector('.pn__gaveta-corpo')!);
  aplicar(g); g.querySelector<HTMLElement>('[data-pn-repor]')?.focus();
  aviso(g.closest('.portal--pn')!.querySelector<HTMLElement>('.pn')!, 'As definições do Início voltaram às de origem.');
}

/* =========================================================
   Tentar de novo (um bloco que falhou)
   ========================================================= */
async function tentar(pn: HTMLElement, b: HTMLElement): Promise<void> {
  const w = b.dataset.pnTentar as IdW, bloco = b.closest<HTMLElement>('[data-w]')!;
  b.setAttribute('aria-busy', 'true'); (b as HTMLButtonElement).disabled = true; b.querySelector('.btn__rotulo')!.textContent = 'A carregar…';
  await espera(900);
  const pr = real(pn) ? prefs() : structuredClone(PREFS_PN), p = periodoAtual(pn);
  const html = w === 'evolucao' ? evolucaoHtml(p, pr) : w === 'pedidos' ? pedidosHtml(pr) : w === 'atencao' ? atencaoHtml(pr) : '';
  if (!html) return;
  const t = document.createElement('template'); t.innerHTML = html.trim();
  const novo = t.content.firstElementChild as HTMLElement; bloco.replaceWith(novo);
  entrar(novo.querySelector('[data-corpo]'), 260);
  if (w === 'evolucao') requestAnimationFrame(() => { novo.querySelectorAll<HTMLElement>('.pn__seg').forEach(marcaSeg); grafico(pn, p, 'valor'); });
}

/* =========================================================
   Ligar
   ========================================================= */
function periodoAtual(pn: HTMLElement): Periodo {
  const g = pn.querySelector<HTMLElement>('[data-graf]'), id = (pn.querySelector<HTMLElement>('[data-periodo][aria-checked="true"]')?.dataset.periodo as IdPeriodo) || '30';
  return g ? periodo(id, Number(g.dataset.de), Number(g.dataset.ate)) : periodo(id === 'pers' ? '30' : id);
}
function redesenharGrafico(pn: HTMLElement): void {
  const g = pn.querySelector<HTMLElement>('[data-graf]'); if (!g) return;
  const st = G.get(g);
  grafico(pn, periodoAtual(pn), (g.dataset.metrica as Metrica) || 'valor');
  if (st?.visto) g.querySelector('.pn__g')?.classList.add('is-visto');
}
/** A entrada, uma vez por sessão: cabeçalho, números, pedidos, atenção, gráfico. */
function entrada(pn: HTMLElement): void {
  if (quieto() || pn.dataset.estado || editando()) return;
  try { if (sessionStorage.getItem('goparts:pn-entrou')) return; sessionStorage.setItem('goparts:pn-entrou', '1'); } catch { return; }
  const partes = [pn.querySelector('.pn__cabeca'), ...Array.from(pn.querySelectorAll('.pn__kpis > li')), pn.querySelector('[data-w="pedidos"]'), pn.querySelector('[data-w="atencao"]'), pn.querySelector('[data-w="evolucao"]'), pn.querySelector('[data-w="atalhos"]')];
  partes.forEach((el, i) => { if (el && !(el as HTMLElement).hidden && el.getBoundingClientRect().top < window.innerHeight) entrar(el, 300, 'translateY(8px)', i * 60); });
}
let atual: HTMLElement | null = null;
function armar(): void {
  const pn = vivo();
  if (!pn || pn === atual) { if (!pn) atual = null; return; }
  atual = pn;
  if (real(pn) && !editando()) { desenhar(pn); aplicarPrefs(pn, prefs()); }
  else { const s = pn.querySelector('[data-saudacao]'); if (s) s.textContent = saudacao(new Date().getHours()); }
  requestAnimationFrame(() => {
    pn.querySelectorAll<HTMLElement>('.pn__seg').forEach(marcaSeg);
    if (pn.querySelector('[data-graf]')) grafico(pn, periodoAtual(pn), (pn.querySelector<HTMLElement>('[data-graf]')!.dataset.metrica as Metrica) || 'valor');
    entrada(pn);
  });
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  let rt = 0;
  window.addEventListener('resize', () => { window.clearTimeout(rt); rt = window.setTimeout(() => { const pn = vivo(); if (!pn) return; pn.querySelectorAll<HTMLElement>('.pn__seg').forEach(marcaSeg); redesenharGrafico(pn); }, 120); });
  window.addEventListener('offline', () => { const pn = vivo(); if (pn && real(pn)) semLigacao(pn, true); });
  window.addEventListener('online', () => { const pn = vivo(); if (pn && real(pn)) { semLigacao(pn, false); void atualizar(pn); } });

  document.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element, portal = t.closest?.<HTMLElement>('.portal--pn'); if (!portal) return;
    const pn = portal.querySelector<HTMLElement>('.pn')!;
    const q = <E extends HTMLElement = HTMLElement>(s: string) => t.closest<E>(s);
    let b: HTMLElement | null;
    const g = q('.pn__gaveta:not(.pn__sessao)');
    if (g) { if (q('[data-pn-fechar]')) fecharGaveta(g); else if (q('[data-pn-repor]')) repor(g); return; }
    if (!pn.contains(t)) return;
    if ((b = q('[data-pn-personalizar]'))) { abrirGaveta(pn, b); return; }
    if ((b = q('[data-pn-atualizar]'))) { void atualizar(pn); return; }
    if (q('[data-pn-fechar-aviso]')) { q('.pn__aviso-linha')?.remove(); return; }
    /* o período (cabeçalho): muda o gráfico */
    if ((b = q('[role="radio"][data-periodo]'))) {
      const id = b.dataset.periodo as IdPeriodo, f = pn.querySelector<HTMLFormElement>('[data-pers]');
      escolherSeg(b.parentElement!, b);
      if (id === 'pers') { if (f) { f.hidden = false; entrar(f, 200, 'translateY(-4px)'); f.querySelector<HTMLInputElement>('input')?.focus(); } return; }
      if (f) f.hidden = true;
      if (pn.querySelector('[data-graf]')) grafico(pn, periodo(id), (pn.querySelector<HTMLElement>('[data-graf]')!.dataset.metrica as Metrica) || 'valor', true);
      aviso(pn, `Período: ${textoPeriodo(periodo(id))}.`);
      return;
    }
    if ((b = q('[role="radio"][data-metrica]'))) { const gg = pn.querySelector<HTMLElement>('[data-graf]'); if (gg) { const st = G.get(gg)!; grafico(pn, { id: 'pers', de: st.de, ate: st.ate }, b.dataset.metrica as Metrica, true); } return; }
    if ((b = q('.pn__alerta-cab'))) { abrirAlerta(b); return; }
    if ((b = q('[data-pn-ir]'))) { const e = b.dataset.etapa; if (e) irFiltrado(b.dataset.pnIr!, e); else irPara(b.dataset.pnIr!); return; }
    if ((b = q('[data-ir-doc]'))) { ir(pn, b.dataset.irDoc!, b.dataset.chave, b.dataset.valor); return; }
    if ((b = q('[data-ir-filtro]'))) { irFiltrado(b.dataset.irFiltro!, b.dataset.etapaAlvo!); return; }
    if ((b = q('[data-abrir-pedido]'))) { ir(pn, 'pedidos', 'goparts:abrir-pedido', b.dataset.abrirPedido); return; }
    /* (V8) a linha do pedido (fora do «Ver») abre o percurso no sítio */
    if ((b = q('.pn__linha'))) { abrirLinha(b); return; }
    if ((b = q('[data-pn-atalho]'))) { atalho(pn, b.dataset.pnAtalho as IdAtalhoPn); return; }
    if ((b = q('[data-pn-tentar]'))) { void tentar(pn, b); return; }
  });

  document.addEventListener('submit', (ev) => {
    const f = ev.target as HTMLFormElement; if (!f.matches?.('.pn [data-pers]')) return;
    ev.preventDefault();
    const pn = f.closest<HTMLElement>('.pn')!, err = f.querySelector<HTMLElement>('.pn__pers-erro')!;
    const de = (f.elements.namedItem('de') as HTMLInputElement).value, ate = (f.elements.namedItem('ate') as HTMLInputElement).value;
    if (!de || !ate) { err.textContent = 'Escolhe as duas datas.'; return; }
    const a = deIso(de), b = deIso(ate);
    if (a > b) { err.textContent = 'A data «De» tem de ser antes da data «Até».'; return; }
    if (b > HOJE) { err.textContent = `Os dados vão até ${curta(HOJE, true)}.`; return; }
    if (b - a > 365) { err.textContent = 'Escolhe no máximo um ano.'; return; }
    err.textContent = '';
    if (pn.querySelector('[data-graf]')) grafico(pn, periodo('pers', a, b), (pn.querySelector<HTMLElement>('[data-graf]')!.dataset.metrica as Metrica) || 'valor', true);
    aviso(pn, `Período: ${textoPeriodo(periodo('pers', a, b))}.`);
  });

  /* o gráfico: o rato, o dedo e as setas */
  document.addEventListener('pointermove', (ev) => { const g = (ev.target as Element).closest?.<HTMLElement>('.pn [data-graf]'); if (g) focar(g, maisPerto(g, ev.clientX)); });
  document.addEventListener('pointerdown', (ev) => { const g = (ev.target as Element).closest?.<HTMLElement>('.pn [data-graf]'); if (g && ev.pointerType !== 'mouse') focar(g, maisPerto(g, ev.clientX)); });
  document.addEventListener('pointerout', (ev) => { if (ev.pointerType !== 'mouse') return; const g = (ev.target as Element).closest?.<HTMLElement>('.pn [data-graf]'); if (g && !g.contains(ev.relatedTarget as Node) && document.activeElement !== g) largar(g); });
  document.addEventListener('pointerdown', (ev) => { if (ev.pointerType === 'mouse' || (ev.target as Element).closest?.('.pn [data-graf]')) return; document.querySelectorAll<HTMLElement>('.pn [data-graf]').forEach(largar); });
  document.addEventListener('focusout', (ev) => { const g = (ev.target as Element).closest?.<HTMLElement>('.pn [data-graf]'); if (g && ev.target === g) largar(g); });

  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLElement, g = t.closest?.<HTMLElement>('.pn__gaveta'); if (!g) return;
    if (t.matches('[data-pn-atalho-escolha]') && g.querySelectorAll('[data-pn-atalho-escolha]:checked').length > 6) { (t as HTMLInputElement).checked = false; return; }
    aplicar(g);
  });

  document.addEventListener('keydown', (ev) => {
    if (editando()) return;
    const t = ev.target as HTMLElement;
    const g = t.closest?.<HTMLElement>('.pn__gaveta:not(.pn__sessao)');
    if (g) {
      if (ev.key === 'Escape') { ev.preventDefault(); fecharGaveta(g); return; }
      if (ev.key === 'Tab') {
        const f = Array.from(g.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')).filter((x) => x.offsetParent);
        if (ev.shiftKey && t === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); } else if (!ev.shiftKey && t === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
      }
      return;
    }
    /* a linha do pedido com o foco: Enter abre */
    if (t.matches?.('.pn [role="radio"]') && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) {
      ev.preventDefault();
      const ops = Array.from(t.parentElement!.querySelectorAll<HTMLElement>('[role="radio"]')), i = ops.indexOf(t);
      const n = ops[(i + (ev.key === 'ArrowRight' ? 1 : -1) + ops.length) % ops.length]; n.focus(); n.click(); return;
    }
    if (t.matches?.('.pn [data-graf]')) {
      const st = G.get(t); if (!st) return;
      const k = ev.key === 'ArrowRight' ? st.foco + 1 : ev.key === 'ArrowLeft' ? (st.foco < 0 ? st.pontos.length - 1 : st.foco - 1) : ev.key === 'Home' ? 0 : ev.key === 'End' ? st.pontos.length - 1 : null;
      if (k === null) { if (ev.key === 'Escape') largar(t); return; }
      ev.preventDefault(); focar(t, Math.max(0, Math.min(st.pontos.length - 1, k)), true);
    }
  });
}
