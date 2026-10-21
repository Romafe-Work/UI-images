/* =========================================================
   PEÇA A PEÇA — o rolamento 3D no cabeçalho do Início, a andar (21 out. 2026)
   Ela: «quero o rolamento a andar aqui» (ao lado da saudação), depois de não querer a secção grande do scroll.
   O SKF 6206 de rolamento-3d.ts, pequeno: entra a rolar da esquerda (vai rodando o que corresponde ao caminho
   que percorre) e depois continua a andar devagar — o anel interior e a gaiola giram, as esferas rodam à volta
   no diâmetro primitivo, à velocidade da gaiola (≈ 0,4 da do anel interior), e o rolamento inclina-se um pouco
   para se verem as esferas. Desenha só com o cabeçalho à vista e a página visível; com «reduzir movimento», parado.
   ========================================================= */
import { Scene, PerspectiveCamera, WebGLRenderer, Object3D, ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { criarRolamento, ambiente, R, N_ESFERAS, type Rolamento } from './rolamento-3d';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const tmp = new Object3D();
const ENTRA = 1300;           // ms da entrada a rolar
const VOLTA = 9000;           // ms por volta do anel interior, depois de chegar
type Vivo = { caixa: HTMLElement; r: WebGLRenderer; cena: Scene; cam: PerspectiveCamera; rol: Rolamento; t0: number; raf: number; visivel: boolean; obs: IntersectionObserver };
let vivo: Vivo | null = null;

function esferas(rol: Rolamento, a: number): void {
  for (let i = 0; i < N_ESFERAS; i++) {
    const k = a + (i / N_ESFERAS) * Math.PI * 2;
    tmp.position.set(Math.cos(k) * R.primitivo, Math.sin(k) * R.primitivo, 0); tmp.rotation.set(0, 0, -k * 3); tmp.updateMatrix(); rol.esferas.setMatrixAt(i, tmp.matrix);
  }
  rol.esferas.instanceMatrix.needsUpdate = true;
}
/** A pose para um instante t (ms desde o início). */
function pose(x: Vivo, t: number): void {
  const { rol } = x;
  const k = Math.min(1, t / ENTRA), e = 1 - (1 - k) ** 3;
  /* a entrada: vem da esquerda e roda o que o caminho pede (distância / raio) */
  const dx = (1 - e) * -2.6;
  rol.grupo.position.x = dx;
  const rolar = dx / R.ext;
  /* depois de chegar: o anel interior e a gaiola giram; o exterior fica */
  const depois = Math.max(0, t - ENTRA), ang = (depois / VOLTA) * Math.PI * 2;
  rol.grupo.rotation.set(-.42, .5, 0);
  rol.ext.rotation.z = rolar;
  rol.int.rotation.z = rolar - ang;
  rol.gaiola.rotation.z = rolar - ang * .4;
  esferas(rol, rolar - ang * .4);
}
function quadro(x: Vivo, agora: number): void {
  x.raf = 0;
  if (!x.caixa.isConnected) { largar(); return; }
  pose(x, quieto() ? ENTRA : agora - x.t0);
  x.r.render(x.cena, x.cam);
  if (!quieto() && x.visivel && document.visibilityState === 'visible') x.raf = requestAnimationFrame((n) => quadro(x, n));
}
function largar(): void {
  if (!vivo) return;
  cancelAnimationFrame(vivo.raf); vivo.obs.disconnect();
  vivo.cena.traverse((o) => { const m = o as { geometry?: { dispose(): void }; material?: { dispose(): void } }; m.geometry?.dispose(); m.material?.dispose(); });
  vivo.cena.environment?.dispose(); vivo.r.dispose(); vivo = null;
}
function ligar(caixa: HTMLElement): void {
  if (vivo?.caixa === caixa) return;
  largar();
  const tela = caixa.querySelector<HTMLCanvasElement>('canvas')!;
  let r: WebGLRenderer;
  try { r = new WebGLRenderer({ canvas: tela, antialias: true, alpha: true, powerPreference: 'low-power' }); } catch { caixa.hidden = true; return; }
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); r.outputColorSpace = SRGBColorSpace; r.toneMapping = ACESFilmicToneMapping;
  const w = caixa.clientWidth || 200, h = caixa.clientHeight || 104; r.setSize(w, h, false);
  const cena = new Scene(), cam = new PerspectiveCamera(26, w / h, .1, 30), rol = criarRolamento();
  cam.position.set(0, 0, 4.3); cam.lookAt(0, 0, 0);
  ambiente(r, cena); cena.add(rol.grupo);
  const x: Vivo = { caixa, r, cena, cam, rol, t0: performance.now(), raf: 0, visivel: true, obs: null as unknown as IntersectionObserver };
  x.obs = new IntersectionObserver(([en]) => { x.visivel = en.isIntersecting; if (x.visivel && !x.raf) x.raf = requestAnimationFrame((n) => quadro(x, n)); });
  x.obs.observe(caixa);
  vivo = x; x.raf = requestAnimationFrame((n) => quadro(x, n));
}
function armar(): void {
  const c = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .pn [data-rol-cabeca]');
  if (c && c.offsetWidth) ligar(c); else if (vivo && (!vivo.caixa.isConnected || !c)) largar();
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((ev) => document.addEventListener(ev, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  /* o Início volta a desenhar-se (definições, atualizar): o cabeçalho é outro */
  let pedido = 0;
  new MutationObserver(() => { if (vivo && !vivo.caixa.isConnected && !pedido) pedido = requestAnimationFrame(() => { pedido = 0; armar(); }); }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('visibilitychange', () => { if (vivo && document.visibilityState === 'visible' && !vivo.raf) vivo.raf = requestAnimationFrame((n) => vivo && quadro(vivo, n)); });
}
