/* =========================================================
   PEÇA A PEÇA — o rolamento que se desmonta com o scroll (21 out. 2026)
   Do briefing «Scroll-controlled bearing assembly». Um só valor manda em tudo:
     progresso = clamp((topo da secção já passado) / (altura da secção − altura da parte fixa), 0, 1)
   e dele saem as posições das peças, a rotação, a câmara, as etiquetas, o passo do texto e a barra. Não há
   relógio: parar o scroll para o rolamento; subir monta-o pelo mesmo caminho; saltar para o meio da página
   põe-no logo na posição certa. Desenha-se só quando o progresso ou o tamanho mudam, e só com a secção à vista.
   Etapas: 0–20 % montado (a câmara roda um pouco), 20–40 % sai o anel exterior, 40–65 % a gaiola abre-se e as
   esferas afastam-se (vista isométrica, etiquetas), 65–85 % vista explodida, 85–100 % as medidas.
   Com «reduzir movimento»: a vista explodida parada, sem secção comprida. Sem WebGL: só o texto.
   ========================================================= */
import { Scene, PerspectiveCamera, WebGLRenderer, Object3D, Vector3, ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { criarRolamento, ambiente, R, N_ESFERAS, type Rolamento } from './rolamento-3d';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const limitar = (x: number) => Math.min(1, Math.max(0, x));
const suave = (a: number, b: number, p: number) => { const k = limitar((p - a) / (b - a)); return k * k * (3 - 2 * k); };
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const ETAPAS = [0, .2, .4, .65, .85];

type Vivo = { sec: HTMLElement; r: WebGLRenderer; cena: Scene; cam: PerspectiveCamera; rol: Rolamento; p: number; visivel: boolean; pedido: number; w: number; h: number; obs: IntersectionObserver; ro: ResizeObserver };
let vivo: Vivo | null = null;
const tmp = new Object3D(), v = new Vector3();

/** O progresso a partir da posição da secção no ecrã (funciona com a janela ou com outro contentor a rolar). */
function progresso(sec: HTMLElement): number {
  const fixo = sec.querySelector<HTMLElement>('.rol3__fixo')!;
  const topoFixo = parseFloat(getComputedStyle(fixo).top) || 0;
  const dist = sec.offsetHeight - fixo.offsetHeight;
  return dist > 0 ? limitar((topoFixo - sec.getBoundingClientRect().top) / dist) : .78;
}

/** A pose do rolamento para um progresso — só depende de p. */
function pose(x: Vivo, p: number): void {
  const { rol, cam } = x;
  const exp = suave(.65, .85, p);
  rol.ext.position.z = -(1.05 * suave(.2, .4, p) + .55 * exp);
  const abre = suave(.4, .65, p);
  rol.gaiola.children[0].position.z = -.1 - .42 * abre - .2 * exp;
  rol.gaiola.children[1].position.z = .1 + .42 * abre + .2 * exp;
  rol.int.position.z = 1.05 * suave(.55, .8, p) + .55 * exp;
  /* as esferas afastam-se do eixo e rodam um pouco com o scroll (o ângulo é de p, não do tempo) */
  const raio = R.primitivo + .3 * suave(.45, .75, p), giro = p * 1.4;
  for (let i = 0; i < N_ESFERAS; i++) {
    const a = giro + (i / N_ESFERAS) * Math.PI * 2;
    tmp.position.set(Math.cos(a) * raio, Math.sin(a) * raio, 0); tmp.updateMatrix(); rol.esferas.setMatrixAt(i, tmp.matrix);
  }
  rol.esferas.instanceMatrix.needsUpdate = true;
  /* a câmara: de frente a três quartos (0–20 %), depois a vista isométrica que mostra o eixo, e mais longe na explodida */
  const iso = suave(.4, .7, p);
  rol.grupo.rotation.set(mix(-.32, -.5, iso), mix(.25 + .35 * suave(0, .2, p), 1.0, iso), 0);
  const estreito = x.w < x.h;
  cam.position.set(0, 0, mix(estreito ? 6.2 : 4.6, estreito ? 10.5 : 8.4, suave(.3, .85, p)));
  cam.lookAt(0, 0, 0);
}

/** As etiquetas seguem as peças (projetadas para o ecrã) e aparecem por etapa; no estreito, só a da etapa. */
function etiquetas(x: Vivo, p: number): void {
  const { rol, cam, sec } = x, estreito = x.w < 560;
  const alvo: Record<string, [Object3D, Vector3, number]> = {
    ext: [rol.ext, new Vector3(0, R.ext, 0), .25], gaiola: [rol.gaiola.children[1], new Vector3(0, -R.primitivo, 0), .45],
    esferas: [rol.esferas, new Vector3(Math.cos(p * 1.4) * (R.primitivo + .3 * suave(.45, .75, p)), Math.sin(p * 1.4) * (R.primitivo + .3 * suave(.45, .75, p)), 0), .5], int: [rol.int, new Vector3(0, R.furo, 0), .6],
  };
  const atual = p < .4 ? 'ext' : p < .55 ? 'gaiola' : p < .65 ? 'esferas' : 'int';
  sec.querySelectorAll<HTMLElement>('[data-etq]').forEach((el) => {
    const [obj, local, desde] = alvo[el.dataset.etq!];
    v.copy(local); obj.localToWorld(v); v.project(cam);
    const vis = p >= desde && (!estreito || el.dataset.etq === atual || p >= .85);
    /* sempre dentro da cena: a etiqueta não sai pelos lados nem por cima */
    const lx = Math.min(Math.max(((v.x + 1) / 2) * x.w, 0), x.w - el.offsetWidth - 24), ly = Math.min(Math.max(((1 - v.y) / 2) * x.h, 20), x.h - 12);
    el.style.transform = `translate(${lx}px, ${ly}px)`;
    el.classList.toggle('is-visivel', vis);
  });
}

function texto(sec: HTMLElement, p: number): void {
  const i = ETAPAS.reduce((k, e, j) => (p >= e ? j : k), 0);
  sec.querySelectorAll<HTMLElement>('.rol3__passo').forEach((li, j) => { li.classList.toggle('is-atual', j === i); li.toggleAttribute('aria-current', j === i); });
  sec.querySelector<HTMLElement>('[data-rol3-barra]')?.style.setProperty('--p', String(p));
  sec.classList.toggle('is-fim', p >= .85);
}

function desenhar(x: Vivo, forcar = false): void {
  x.pedido = 0;
  if (!x.sec.isConnected) { largar(); return; }
  const p = x.sec.classList.contains('is-estatico') ? .82 : progresso(x.sec);
  if (!forcar && Math.abs(p - x.p) < 1e-4) return;
  x.p = p;
  texto(x.sec, p);
  if (!x.visivel && !forcar) return;
  pose(x, p); x.r.render(x.cena, x.cam); etiquetas(x, p);
}
const pedir = () => { if (vivo && !vivo.pedido) vivo.pedido = requestAnimationFrame(() => vivo && desenhar(vivo)); };
function medir(x: Vivo): void {
  const caixa = x.sec.querySelector<HTMLElement>('.rol3__cena')!;
  x.w = caixa.clientWidth; x.h = caixa.clientHeight; if (!x.w || !x.h) return;
  x.r.setSize(x.w, x.h, false); x.cam.aspect = x.w / x.h; x.cam.updateProjectionMatrix();
  desenhar(x, true);
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
  const tela = sec.querySelector<HTMLCanvasElement>('.rol3__tela')!;
  let r: WebGLRenderer;
  try { r = new WebGLRenderer({ canvas: tela, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch { sec.classList.add('is-sem-3d'); sec.querySelector<HTMLElement>('.rol3__sem3d')!.hidden = false; texto(sec, progresso(sec)); return; }
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); r.outputColorSpace = SRGBColorSpace; r.toneMapping = ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  const cena = new Scene(), cam = new PerspectiveCamera(30, 1, .1, 50), rol = criarRolamento();
  ambiente(r, cena); cena.add(rol.grupo);
  const x: Vivo = { sec, r, cena, cam, rol, p: -1, visivel: true, pedido: 0, w: 0, h: 0, obs: null as unknown as IntersectionObserver, ro: null as unknown as ResizeObserver };
  x.obs = new IntersectionObserver(([e]) => { x.visivel = e.isIntersecting; if (x.visivel) desenhar(x, true); }, { rootMargin: '100px' });
  x.obs.observe(sec);
  x.ro = new ResizeObserver(() => medir(x)); x.ro.observe(sec.querySelector('.rol3__cena')!);
  vivo = x; medir(x);
}
function armar(): void {
  const sec = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .pn [data-rol3]');
  if (sec) ligar(sec); else if (vivo && !vivo.sec.isConnected) largar();
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  /* o Início volta a desenhar-se (definições, atualizar): a secção é outra */
  new MutationObserver(() => { if (vivo && !vivo.sec.isConnected) requestAnimationFrame(armar); }).observe(document.body, { childList: true, subtree: true });
  /* o scroll da janela ou de qualquer contentor; passivo, um desenho por quadro */
  document.addEventListener('scroll', pedir, { capture: true, passive: true });
  window.addEventListener('resize', pedir, { passive: true });
}
