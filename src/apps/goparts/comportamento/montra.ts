/* =========================================================
   PEÇA A PEÇA — 10 · Início V10, a montra: o que mexe (21 out. 2026)
   - O rolamento vivo: um só progresso p = clamp((topo da cena já passado) / (altura da secção − altura da parte
     presa)), sem relógio. p manda nas peças (anel exterior → gaiola e esferas → anel interior), na câmara, nas
     etiquetas e no texto (abertura → 01 → 02 → 03 → «Da engenharia à peça certa.»). Parar o scroll para-o; subir
     monta-o; recarregar a meio põe-no no sítio certo.
   - Antes de se descer, o rolamento entra (≈600 ms) e inclina-se um pouco para o rato (só com rato).
   - Desenha só quando algo muda e com a cena à vista; sem WebGL, a imagem de reserva; com «reduzir movimento»,
     montado e parado, sem a secção comprida.
   - Os botões levam aos ecrãs verdadeiros: a pesquisa no modo certo, o catálogo num grupo ou numa referência,
     o pedido, o veículo no catálogo, a lista; «Adicionar ao carrinho» usa o carrinho a sério.
   ========================================================= */
import { Scene, PerspectiveCamera, WebGLRenderer, Object3D, Vector3, ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { criarRolamento, ambiente, R, N_ESFERAS, type Rolamento } from './rolamento-3d';
import { irPara } from './navegar';
import * as carrinho from './carrinho';
import { GARAGEM, CHAVE_GARAGEM, type Carro } from '../portal/inicio-espaco';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const limitar = (x: number) => Math.min(1, Math.max(0, x));
const suave = (a: number, b: number, p: number) => { const k = limitar((p - a) / (b - a)); return k * k * (3 - 2 * k); };
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const tmp = new Object3D(), v = new Vector3();

type Vivo = { sec: HTMLElement; r: WebGLRenderer; cena: Scene; cam: PerspectiveCamera; rol: Rolamento; p: number; visivel: boolean; pedido: number; w: number; h: number; rato: [number, number]; t0: number; obs: IntersectionObserver; ro: ResizeObserver };
let vivo: Vivo | null = null;

function progresso(sec: HTMLElement): number {
  if (sec.classList.contains('is-estatico')) return 0;
  const fixo = sec.querySelector<HTMLElement>('.mt__fixo')!, topo = parseFloat(getComputedStyle(fixo).top) || 0;
  const dist = sec.offsetHeight - fixo.offsetHeight;
  return dist > 0 ? limitar((topo - sec.getBoundingClientRect().top) / dist) : 0;
}
/** A pose para (p, entrada, rato) — o scroll manda; o tempo só na entrada. */
function pose(x: Vivo, p: number, entrada: number): void {
  const { rol, cam } = x, estreito = x.w < 600 || x.w < x.h;
  const exp = suave(.66, .84, p), abre = suave(.4, .62, p);
  rol.ext.position.z = -(1.05 * suave(.16, .4, p) + .55 * exp);
  rol.gaiola.children[0].position.z = -.1 - .42 * abre - .2 * exp;
  rol.gaiola.children[1].position.z = .1 + .42 * abre + .2 * exp;
  rol.int.position.z = 1.05 * suave(.55, .8, p) + .55 * exp;
  const raio = R.primitivo + .3 * suave(.45, .75, p), giro = p * 2.2;
  for (let i = 0; i < N_ESFERAS; i++) { const a = giro + (i / N_ESFERAS) * Math.PI * 2; tmp.position.set(Math.cos(a) * raio, Math.sin(a) * raio, 0); tmp.updateMatrix(); rol.esferas.setMatrixAt(i, tmp.matrix); }
  rol.esferas.instanceMatrix.needsUpdate = true;
  /* no início, inclina-se um pouco para o rato; ao descer, passa à vista isométrica */
  const iso = suave(.35, .7, p), solto = 1 - suave(0, .12, p);
  rol.grupo.rotation.set(mix(-.3, -.5, iso) + x.rato[1] * .12 * solto, mix(.45 + p * .9, 1.05, iso) + x.rato[0] * .18 * solto, 0);
  /* a entrada: chega da direita, a rodar o que o caminho pede */
  const k = 1 - (1 - entrada) ** 3;
  rol.grupo.position.x = (1 - k) * 2.2;
  rol.ext.rotation.z = rol.int.rotation.z = -(1 - k) * 2.2 / R.ext;
  cam.position.set(0, 0, mix(estreito ? 5.6 : 3.9, estreito ? 9.6 : 7.6, suave(.3, .84, p)));
  cam.lookAt(0, 0, 0);
}
function etiquetas(x: Vivo, p: number): void {
  const { rol, cam, sec } = x, estreito = x.w < 560;
  const alvo: Record<string, [Object3D, Vector3, number]> = {
    ext: [rol.ext, new Vector3(0, R.ext, 0), .22], gaiola: [rol.gaiola.children[1], new Vector3(0, -R.primitivo, 0), .42],
    esferas: [rol.gaiola, new Vector3(R.primitivo + .3 * suave(.45, .75, p), 0, 0), .48], int: [rol.int, new Vector3(0, R.furo, 0), .6],
  };
  const atual = p < .4 ? 'ext' : p < .5 ? 'gaiola' : p < .6 ? 'esferas' : 'int';
  sec.querySelectorAll<HTMLElement>('[data-etq]').forEach((el) => {
    const [obj, local, desde] = alvo[el.dataset.etq!];
    v.copy(local); obj.localToWorld(v); v.project(cam);
    const vis = p >= desde && p < .9 && (!estreito || el.dataset.etq === atual);
    const lx = Math.min(Math.max(((v.x + 1) / 2) * x.w, 0), x.w - el.offsetWidth - 24), ly = Math.min(Math.max(((1 - v.y) / 2) * x.h, 20), x.h - 12);
    el.style.transform = `translate(${lx}px, ${ly}px)`; el.classList.toggle('is-visivel', vis);
  });
}
/** O texto da etapa: cada camada aparece no seu intervalo (sem saltos: cruzam-se). */
function texto(sec: HTMLElement, p: number): void {
  const camada = (el: HTMLElement | null, de: number, ate: number) => {
    if (!el) return; const a = suave(de - .05, de, p) * (1 - suave(ate, ate + .05, p));
    el.style.opacity = String(a); el.style.transform = `translateY(${(1 - a) * 12}px)`;
    const ativo = a > .5; el.toggleAttribute('inert', !ativo); el.setAttribute('aria-hidden', String(!ativo));
  };
  const heroi = sec.querySelector<HTMLElement>('[data-mt-heroi]');
  if (heroi) { const a = 1 - suave(.06, .14, p); heroi.style.opacity = String(a); heroi.style.transform = `translateY(${-(1 - a) * 16}px)`; heroi.toggleAttribute('inert', a < .5); }
  camada(sec.querySelector('[data-mt-passo="1"]'), .19, .38); camada(sec.querySelector('[data-mt-passo="2"]'), .43, .6); camada(sec.querySelector('[data-mt-passo="3"]'), .65, .82);
  camada(sec.querySelector('[data-mt-fim]'), .88, 2);
  sec.querySelector<HTMLElement>('[data-mt-fim] button')?.setAttribute('tabindex', p > .88 ? '0' : '-1');
  sec.querySelector<HTMLElement>('[data-mt-barra]')?.style.setProperty('--p', String(p));
}
function desenhar(x: Vivo, forcar = false): void {
  x.pedido = 0;
  if (!x.sec.isConnected) { largar(); return; }
  const p = progresso(x.sec), entrada = quieto() ? 1 : limitar((performance.now() - x.t0) / 650);
  const mudou = forcar || Math.abs(p - x.p) > 1e-4 || entrada < 1;
  if (!mudou) return;
  x.p = p; texto(x.sec, p);
  if (!x.visivel && !forcar) return;
  pose(x, p, entrada); x.r.render(x.cena, x.cam); etiquetas(x, p);
  if (entrada < 1) pedir();
}
function pedir(): void { if (vivo && !vivo.pedido) vivo.pedido = requestAnimationFrame(() => vivo && desenhar(vivo)); }
function medir(x: Vivo): void {
  const c = x.sec.querySelector<HTMLElement>('.mt__cena')!; x.w = c.clientWidth; x.h = c.clientHeight; if (!x.w || !x.h) return;
  x.r.setSize(x.w, x.h, false); x.cam.aspect = x.w / x.h; x.cam.updateProjectionMatrix(); desenhar(x, true);
}
function largar(): void {
  if (!vivo) return;
  vivo.obs.disconnect(); vivo.ro.disconnect(); if (vivo.pedido) cancelAnimationFrame(vivo.pedido);
  vivo.cena.traverse((o) => { const m = o as { geometry?: { dispose(): void }; material?: { dispose(): void } }; m.geometry?.dispose(); m.material?.dispose(); });
  vivo.cena.environment?.dispose(); vivo.r.dispose(); vivo = null;
}
function ligar(sec: HTMLElement): void {
  if (vivo?.sec === sec) return;
  largar();
  if (quieto()) sec.classList.add('is-estatico');
  const main = sec.closest<HTMLElement>('.mt')!;
  if (main.classList.contains('is-sem-3d')) { texto(sec, 0); return; }
  let r: WebGLRenderer;
  try { r = new WebGLRenderer({ canvas: sec.querySelector<HTMLCanvasElement>('.mt__tela')!, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch { main.classList.add('is-sem-3d'); sec.querySelector<HTMLElement>('.mt__reserva')!.hidden = false; texto(sec, progresso(sec)); return; }
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); r.outputColorSpace = SRGBColorSpace; r.toneMapping = ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  const cena = new Scene(), cam = new PerspectiveCamera(30, 1, .1, 50), rol = criarRolamento();
  ambiente(r, cena); cena.add(rol.grupo);
  const x: Vivo = { sec, r, cena, cam, rol, p: -1, visivel: true, pedido: 0, w: 0, h: 0, rato: [0, 0], t0: performance.now(), obs: null as unknown as IntersectionObserver, ro: null as unknown as ResizeObserver };
  x.obs = new IntersectionObserver(([e]) => { x.visivel = e.isIntersecting; if (x.visivel) desenhar(x, true); }, { rootMargin: '100px' }); x.obs.observe(sec);
  x.ro = new ResizeObserver(() => medir(x)); x.ro.observe(sec.querySelector('.mt__cena')!);
  vivo = x; medir(x);
}
function armar(): void {
  const sec = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .mt [data-mt-palco]');
  if (sec) ligar(sec); else if (vivo && !vivo.sec.isConnected) largar();
}

/* ---------- os botões ---------- */
function abrirCatalogo(o: Record<string, string>): void { try { sessionStorage.setItem('goparts:catalogo-abrir', JSON.stringify(o)); } catch { /* abre o catálogo */ } irPara('catalogo'); }
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
    if (!vivo || ev.pointerType !== 'mouse' || quieto() || vivo.p > .12) return;
    const r = vivo.sec.querySelector('.mt__cena')!.getBoundingClientRect();
    vivo.rato = [limitar((ev.clientX - r.left) / r.width) * 2 - 1, limitar((ev.clientY - r.top) / r.height) * 2 - 1]; vivo.p = -1; pedir();
  }, { passive: true });
  document.addEventListener('click', (ev) => {
    const t = ev.target as Element, main = t.closest?.('.portal--mt'); if (!main || document.body.classList.contains('editando')) return;
    let b: HTMLElement | null;
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
