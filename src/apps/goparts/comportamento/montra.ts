/* =========================================================
   PEÇA A PEÇA — 10 · Início V10, a montra: o que mexe (21 out. 2026)
   - Cinco peças (comportamento/modelos-3d.ts): rolamento, travão, bomba de água, amortecedor e embraiagem — cada regresso ao Início mostra a
     seguinte (ela: «voltei ao Início e pode mudar para um travão… quero 3 exemplos»). O texto, os insights e os
     botões da exploração trocam com ela (data-ex no <main>).
   - Um só progresso p = clamp((topo da cena já passado) / (altura da secção − parte presa)), sem relógio: p manda
     nas peças, na câmara, nos insights e no texto. Parar o scroll para-a; subir monta-a; recarregar a meio põe-na
     no sítio certo.
   - Os insights: junto de cada peça quando ela sai, e somem quando volta ao sítio (no estreito, só o da etapa).
   - «Explorar componente»: a peça abre-se (vista explodida, 400 ms), arrasta-se para rodar, tocar numa peça (ou
     escolhê-la no painel) acende-a e o painel diz o que é e leva ao catálogo; Escape sai.
   - Antes de se descer, a peça entra (≈650 ms) e inclina-se um pouco para o rato. Desenha só quando algo muda e
     com a cena à vista; sem WebGL, a imagem de reserva; com «reduzir movimento», montada e parada.
   - Os botões levam aos ecrãs verdadeiros (pesquisa no modo certo e já escrita, catálogo num grupo ou numa
     referência, pedido, veículo, lista); «Adicionar ao carrinho» usa o carrinho a sério.
   ========================================================= */
import { Scene, PerspectiveCamera, WebGLRenderer, Object3D, Vector3, Vector2, Raycaster, Color, ACESFilmicToneMapping, SRGBColorSpace, type Mesh, type MeshPhysicalMaterial } from 'three';
import { ambiente } from './rolamento-3d';
import { criarModelo, EXEMPLOS, type IdExemplo, type Modelo } from './modelos-3d';
import { irPara } from './navegar';
import * as carrinho from './carrinho';
import { GARAGEM, CHAVE_GARAGEM, type Carro } from '../portal/inicio-espaco';
import { EXEMPLOS_TEXTO } from '../portal/montra';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const limitar = (x: number) => Math.min(1, Math.max(0, x));
const suave = (a: number, b: number, p: number) => { const k = limitar((p - a) / (b - a)); return k * k * (3 - 2 * k); };
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const v = new Vector3();
const CHAVE_EX = 'goparts:montra-exemplo';

type Vivo = { sec: HTMLElement; main: HTMLElement; r: WebGLRenderer; cena: Scene; cam: PerspectiveCamera; ex: IdExemplo; m: Modelo; p: number; visivel: boolean; pedido: number; w: number; h: number;
  rato: [number, number]; t0: number; obs: IntersectionObserver; ro: ResizeObserver; explorar: boolean; giro: [number, number]; abre: number; escolhida: string | null };
let vivo: Vivo | null = null;

function progresso(sec: HTMLElement): number {
  if (sec.classList.contains('is-estatico')) return 0;
  const fixo = sec.querySelector<HTMLElement>('.mt__fixo')!, topo = parseFloat(getComputedStyle(fixo).top) || 0;
  const dist = sec.offsetHeight - fixo.offsetHeight;
  return dist > 0 ? limitar((topo - sec.getBoundingClientRect().top) / dist) : 0;
}
/** A pose para (p, entrada, rato, exploração) — o scroll manda; o tempo só na entrada e ao abrir a exploração. */
function pose(x: Vivo, p0: number, entrada: number): number {
  const estreito = x.w < 600 || x.w < x.h, p = mix(p0, .8, x.abre), g = x.m.grupo;
  x.m.pose(p);
  const iso = suave(.35, .7, p), solto = 1 - suave(0, .12, p);
  const k = 1 - (1 - entrada) ** 3;
  g.rotation.set(mix(-.3, -.5, iso) + x.rato[1] * .12 * solto + x.giro[1], mix(.45 + p * .9, 1.05, iso) + x.rato[0] * .18 * solto + x.giro[0], -(1 - k) * 2.2);
  g.position.x = (1 - k) * 2.2;
  /* (21 out.) «coloca o rolamento mais pequeno»: a câmara de cada peça, mais afastada no estreito */
  const [perto, longe] = x.m.dist;
  x.cam.position.set(0, 0, mix(perto + (estreito ? 1.2 : 0), longe + (estreito ? 1.6 : 0), suave(.3, .84, p)));
  x.cam.lookAt(0, 0, 0);
  return p;
}
function insights(x: Vivo, p: number): void {
  const estreito = x.w < 560, atual = x.m.atual(p);
  x.sec.querySelectorAll<HTMLElement>(`[data-etq][data-ex="${x.ex}"]`).forEach((el) => {
    const a = x.m.etiqueta[el.dataset.etq!]; if (!a) return;
    const [obj, local, desde] = a;
    v.copy(local); obj.localToWorld(v); v.project(x.cam);
    /* só o insight da peça que está a sair (ou a voltar): nunca uns por cima dos outros */
    const vis = !x.explorar && p >= desde && p < .9 && el.dataset.etq === atual; void estreito;
    const lx = Math.min(Math.max(((v.x + 1) / 2) * x.w, 0), x.w - el.offsetWidth - 24), ly = Math.min(Math.max(((1 - v.y) / 2) * x.h, 20), x.h - el.offsetHeight - 8);
    el.style.transform = `translate(${lx}px, ${ly}px)`; el.classList.toggle('is-visivel', vis);
  });
}
/** O texto da etapa da peça em uso: cada camada aparece no seu intervalo (cruzam-se, sem saltos). */
function texto(x: { sec: HTMLElement; ex: IdExemplo }, p: number): void {
  const { sec, ex } = x;
  const camada = (el: HTMLElement | null, de: number, ate: number) => {
    if (!el) return; const a = suave(de - .05, de, p) * (1 - suave(ate, ate + .05, p));
    el.style.opacity = String(a); el.style.transform = `translateY(${(1 - a) * 12}px)`;
    const ativo = a > .5; el.toggleAttribute('inert', !ativo); el.setAttribute('aria-hidden', String(!ativo));
  };
  const heroi = sec.querySelector<HTMLElement>('[data-mt-heroi]');
  if (heroi) { const a = 1 - suave(.06, .14, p); heroi.style.opacity = String(a); heroi.style.transform = `translateY(${-(1 - a) * 16}px)`; heroi.toggleAttribute('inert', a < .5); }
  /* (21 out.) sem sobreposições: cada texto sai antes de o seguinte entrar */
  camada(sec.querySelector(`[data-mt-passo="1"][data-ex="${ex}"]`), .2, .34); camada(sec.querySelector(`[data-mt-passo="2"][data-ex="${ex}"]`), .45, .57); camada(sec.querySelector(`[data-mt-passo="3"][data-ex="${ex}"]`), .69, .8);
  const fim = sec.querySelector<HTMLElement>(`[data-mt-fim][data-ex="${ex}"]`); camada(fim, .88, 2);
  fim?.querySelector('button')?.setAttribute('tabindex', p > .88 ? '0' : '-1');
  sec.querySelector<HTMLElement>('[data-mt-barra]')?.style.setProperty('--p', String(p));
}
function desenhar(x: Vivo, forcar = false): void {
  x.pedido = 0;
  if (!x.sec.isConnected) { largar(); return; }
  const p = progresso(x.sec), entrada = quieto() ? 1 : limitar((performance.now() - x.t0) / 650);
  const alvo = x.explorar ? 1 : 0; if (x.abre !== alvo) x.abre = quieto() ? alvo : limitar(x.abre + (alvo ? 1 : -1) * .045);
  if (!(forcar || Math.abs(p - x.p) > 1e-4 || entrada < 1 || x.abre !== alvo || x.explorar)) return;
  x.p = p; texto(x, p);
  if (!x.visivel && !forcar) return;
  const pp = pose(x, p, entrada); x.r.render(x.cena, x.cam); insights(x, pp);
  if (entrada < 1 || x.abre !== alvo) pedir();
}
function pedir(): void { if (vivo && !vivo.pedido) vivo.pedido = requestAnimationFrame(() => vivo && desenhar(vivo)); }
function medir(x: Vivo): void {
  const c = x.sec.querySelector<HTMLElement>('.mt__cena')!; x.w = c.clientWidth; x.h = c.clientHeight; if (!x.w || !x.h) return;
  x.r.setSize(x.w, x.h, false); x.cam.aspect = x.w / x.h; x.cam.updateProjectionMatrix(); desenhar(x, true);
}
const libertar = (o: Object3D) => o.traverse((n) => { const m = n as { geometry?: { dispose(): void }; material?: { dispose(): void } }; m.geometry?.dispose(); m.material?.dispose(); });
function largar(): void {
  if (!vivo) return;
  vivo.obs.disconnect(); vivo.ro.disconnect(); if (vivo.pedido) cancelAnimationFrame(vivo.pedido);
  libertar(vivo.cena); vivo.cena.environment?.dispose(); vivo.r.dispose(); vivo = null;
}

/* ---------- qual das três peças: a seguinte a cada regresso ao Início ---------- */
function proximo(): IdExemplo {
  let i = -1; try { i = Number(sessionStorage.getItem(CHAVE_EX) ?? -1); } catch { /* começa no rolamento */ }
  const n = (Number.isFinite(i) ? i + 1 : 0) % EXEMPLOS.length;
  try { sessionStorage.setItem(CHAVE_EX, String(n)); } catch { /* fica nesta */ }
  return EXEMPLOS[n];
}
function trocarPeca(x: Vivo, ex: IdExemplo): void {
  if (x.explorar) explorar(false);
  x.cena.remove(x.m.grupo); libertar(x.m.grupo);
  x.ex = ex; x.m = criarModelo(ex); x.cena.add(x.m.grupo); x.main.dataset.ex = ex;
  x.t0 = performance.now(); x.giro = [0, 0]; x.p = -1;
  x.sec.querySelectorAll('.mt__insight.is-visivel').forEach((e) => e.classList.remove('is-visivel'));
  desenhar(x, true);
}
function ligar(sec: HTMLElement, ex: IdExemplo): void {
  largar();
  const main = sec.closest<HTMLElement>('.mt')!; main.dataset.ex = ex;
  if (quieto()) sec.classList.add('is-estatico');
  if (main.classList.contains('is-sem-3d')) { texto({ sec, ex }, 0); return; }
  let r: WebGLRenderer;
  try { r = new WebGLRenderer({ canvas: sec.querySelector<HTMLCanvasElement>('.mt__tela')!, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch { main.classList.add('is-sem-3d'); sec.querySelector<HTMLElement>('.mt__reserva')!.hidden = false; texto({ sec, ex }, progresso(sec)); return; }
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); r.outputColorSpace = SRGBColorSpace; r.toneMapping = ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  const cena = new Scene(), cam = new PerspectiveCamera(30, 1, .1, 50), m = criarModelo(ex);
  ambiente(r, cena); cena.add(m.grupo);
  const x: Vivo = { sec, main, r, cena, cam, ex, m, p: -1, visivel: true, pedido: 0, w: 0, h: 0, rato: [0, 0], t0: performance.now(), obs: null as unknown as IntersectionObserver, ro: null as unknown as ResizeObserver, explorar: false, giro: [0, 0], abre: 0, escolhida: null };
  x.obs = new IntersectionObserver(([e]) => { x.visivel = e.isIntersecting; if (x.visivel) desenhar(x, true); }, { rootMargin: '100px' }); x.obs.observe(sec);
  x.ro = new ResizeObserver(() => medir(x)); x.ro.observe(sec.querySelector('.mt__cena')!);
  vivo = x; medir(x);
}
let noInicio = false;
function armar(): void {
  const sec = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .mt [data-mt-palco]');
  if (!sec) { noInicio = false; if (vivo && !vivo.sec.isConnected) largar(); return; }
  const chegou = !noInicio; noInicio = true;
  if (vivo?.sec === sec) { if (chegou) trocarPeca(vivo, proximo()); return; }
  ligar(sec, proximo());
}

/* ---------- «Explorar componente» ---------- */
function pecaDe(x: Vivo, o: Object3D | null): string | null {
  for (let n = o; n; n = n.parent) for (const [k, l] of Object.entries(x.m.pecas)) if (l.includes(n as Mesh)) return k;
  return null;
}
function acender(x: Vivo, id: string | null): void {
  x.escolhida = id;
  Object.entries(x.m.pecas).forEach(([k, l]) => l.forEach((m) => { const mt = m.material as MeshPhysicalMaterial; mt.emissive = new Color(k === id ? '#f58214' : '#000000'); mt.emissiveIntensity = k === id ? .45 : 0; mt.transparent = !!id && k !== id; mt.opacity = id && k !== id ? .3 : 1; mt.needsUpdate = true; }));
  const painel = x.sec.querySelector<HTMLElement>('[data-mt-painel3d]')!, t = EXEMPLOS_TEXTO[x.ex];
  painel.querySelectorAll<HTMLElement>(`[data-ex="${x.ex}"] [data-mt-peca]`).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mtPeca === id)));
  const pc = id ? t.pecas[id] : null, [, , rotulo, attr] = t.fim;
  painel.querySelector<HTMLElement>('[data-mt-info]')!.innerHTML = pc
    ? `<h3>${pc.nome}</h3><p>${pc.texto}</p><p class="mt__painel3d-medida">${pc.medida} · ${t.modelo}</p><div class="mt__painel3d-accoes"><button type="button" class="btn btn--acao mt__btn"${attr}><span class="btn__rotulo">${rotulo}</span></button><button type="button" class="btn mt__btn" data-pn-ir="tecnica"><span class="btn__rotulo">Informação técnica</span></button></div>`
    : '<p class="mt__painel3d-dica">Toca numa peça, ou escolhe-a acima.</p>';
  x.p = -1; pedir();
}
function explorar(sim: boolean): void {
  const x = vivo; if (!x) return;
  x.explorar = sim; if (!sim) { x.giro = [0, 0]; acender(x, null); }
  const b = x.sec.querySelector<HTMLElement>('[data-mt-explorar]')!, p = x.sec.querySelector<HTMLElement>('[data-mt-painel3d]')!;
  b.setAttribute('aria-pressed', String(sim)); b.hidden = sim; p.hidden = !sim; x.sec.classList.toggle('is-a-explorar', sim);
  if (sim) p.querySelector<HTMLElement>(`[data-ex="${x.ex}"] [data-mt-peca]`)?.focus(); else b.focus();
  x.p = -1; pedir();
}
function escolherNoEcra(x: Vivo, cx: number, cy: number): void {
  const r = x.r.domElement.getBoundingClientRect(), ray = new Raycaster();
  ray.setFromCamera(new Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), x.cam);
  const h = ray.intersectObjects(Object.values(x.m.pecas).flat(), false)[0];
  acender(x, h ? pecaDe(x, h.object) : null);
}

/* ---------- os botões ---------- */
function abrirCatalogo(o: Record<string, string>): void { try { sessionStorage.setItem('goparts:catalogo-abrir', JSON.stringify(o)); } catch { /* abre o catálogo */ } irPara('catalogo'); }
/** «Os mais pesquisados» e o que não tem ficha: a pesquisa no modo certo, já escrita (a referência pesquisa logo). */
function pesquisarTermo(termo: string, modo: number): void {
  irPara('pesquisa', modo);
  let n = 0; const t = window.setInterval(() => {
    const ini = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .ini3');
    const inp = ini?.querySelector<HTMLInputElement>(modo === 0 ? '#i3-matricula' : '#i3-referencia');
    if (!inp && ++n < 20) return; window.clearInterval(t); if (!inp) return;
    inp.value = termo; inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.closest('.ini3__cartao')?.querySelector<HTMLElement>('[data-pesquisar]')?.click();
  }, 80);
}
async function pedir1(b: HTMLButtonElement): Promise<void> {
  if (b.getAttribute('aria-busy')) return;
  const antes = b.innerHTML; b.setAttribute('aria-busy', 'true'); b.disabled = true; b.querySelector('.btn__rotulo')!.textContent = 'A adicionar…';
  const ok = await carrinho.adicionar(b.dataset.mtPedir!, 1);
  b.removeAttribute('aria-busy'); b.querySelector('.btn__rotulo')!.textContent = ok ? 'No carrinho' : 'Não adicionado'; b.classList.toggle('is-feito', ok);
  const a = b.closest('.portal--mt')?.querySelector('[data-mt-aviso]'); if (a) a.textContent = ok ? `${b.dataset.mtPedir} adicionado ao carrinho.` : 'Não foi possível adicionar ao carrinho.';
  window.setTimeout(() => { b.innerHTML = antes; b.disabled = false; b.classList.remove('is-feito'); }, 1600);
}
const garagem = (): Carro[] => { try { const x = localStorage.getItem(CHAVE_GARAGEM); return x ? JSON.parse(x) as Carro[] : GARAGEM; } catch { return GARAGEM; } };

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  document.addEventListener('scroll', pedir, { capture: true, passive: true });
  window.addEventListener('resize', pedir, { passive: true });
  document.addEventListener('pointermove', (ev) => {
    if (!vivo || vivo.explorar || ev.pointerType !== 'mouse' || quieto() || vivo.p > .12) return;
    const r = vivo.sec.querySelector('.mt__cena')!.getBoundingClientRect();
    vivo.rato = [limitar((ev.clientX - r.left) / r.width) * 2 - 1, limitar((ev.clientY - r.top) / r.height) * 2 - 1]; vivo.p = -1; pedir();
  }, { passive: true });
  /* a explorar: arrastar roda; tocar sem arrastar escolhe a peça */
  let arr: { x: number; y: number; g: [number, number]; mexeu: boolean } | null = null;
  document.addEventListener('pointerdown', (ev) => { if (!vivo?.explorar || !(ev.target as Element).closest?.('.mt__tela')) return; arr = { x: ev.clientX, y: ev.clientY, g: [...vivo.giro] as [number, number], mexeu: false }; });
  document.addEventListener('pointermove', (ev) => { if (!arr || !vivo) return; const dx = ev.clientX - arr.x, dy = ev.clientY - arr.y; if (Math.abs(dx) + Math.abs(dy) > 4) arr.mexeu = true; vivo.giro = [arr.g[0] + dx * .01, Math.max(-1.2, Math.min(1.2, arr.g[1] + dy * .01))]; vivo.p = -1; pedir(); });
  document.addEventListener('pointerup', (ev) => { if (!arr || !vivo) return; if (!arr.mexeu) escolherNoEcra(vivo, ev.clientX, ev.clientY); arr = null; });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && vivo?.explorar) { ev.preventDefault(); explorar(false); } });
  document.addEventListener('click', (ev) => {
    const t = ev.target as Element, main = t.closest?.('.portal--mt'); if (!main || document.body.classList.contains('editando')) return;
    let b: HTMLElement | null;
    if (t.closest('[data-mt-explorar]')) { explorar(true); return; }
    if (t.closest('[data-mt-explorar-fechar]')) { explorar(false); return; }
    if ((b = t.closest('[data-mt-peca]')) && vivo) { acender(vivo, b.dataset.mtPeca!); return; }
    if ((b = t.closest('[data-mt-pesquisar]'))) { pesquisarTermo(b.dataset.mtPesquisar!, Number(b.dataset.mtModo ?? 2)); return; }
    if ((b = t.closest('[data-pn-modo]'))) { irPara('pesquisa', Number(b.dataset.pnModo)); return; }
    if ((b = t.closest('[data-pn-ir]'))) { irPara(b.dataset.pnIr!); return; }
    if ((b = t.closest('[data-pn-atalho]'))) { irPara(b.dataset.pnAtalho!); return; }
    if ((b = t.closest('[data-mt-grupo]'))) { abrirCatalogo({ tipo: 'grupo', grupo: b.dataset.mtGrupo! }); return; }
    if ((b = t.closest('[data-mt-ficha]'))) { abrirCatalogo({ tipo: 'ref', fab: b.dataset.mtFab!, ref: b.dataset.mtFicha! }); return; }
    if ((b = t.closest('[data-mt-pedir]'))) { void pedir1(b as HTMLButtonElement); return; }
    if ((b = t.closest('[data-pecas-matricula]'))) { const c = garagem().find((g) => g.matricula === b!.dataset.pecasMatricula); if (c) abrirCatalogo({ tipo: 'modelo', marca: c.marca, modelo: c.modelo }); return; }
    if ((b = t.closest('[data-abrir-pedido]'))) { try { sessionStorage.setItem('goparts:abrir-pedido', b.dataset.abrirPedido!); } catch { /* abre os pedidos */ } irPara('pedidos'); return; }
    if ((b = t.closest('[data-ir-doc]'))) { if (b.dataset.chave) try { sessionStorage.setItem(b.dataset.chave, b.dataset.valor ?? ''); } catch { /* abre só o ecrã */ } irPara(b.dataset.irDoc!); }
  });
}
