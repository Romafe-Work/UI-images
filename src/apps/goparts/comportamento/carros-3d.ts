/* =========================================================
   PEÇA A PEÇA — os carros a girar em 3D (21 out. 2026)
   Ela: «quero os carros a girar em 3D». Não há modelos 3D licenciados dos carros (nem fotografias): o carro 3D
   nasce da mesma silhueta da carroçaria (portal/carros.ts), extrudida com cantos boleados, com os vidros escuros
   a atravessar, quatro rodas com jante e uma sombra no chão. Roda devagar como num prato giratório e as rodas
   giram no eixo. Só nas imagens grandes (garagem, catálogo, informação técnica, «Continuar»); nas miniaturas das
   tabelas fica o desenho. Uma só cena WebGL desenha todos os carros visíveis, um de cada vez, e copia cada
   imagem para a tela do cartão (sem um contexto WebGL por cartão). Com «reduzir movimento», fica parado a 3/4.
   Se o WebGL falhar, fica a silhueta.
   ========================================================= */
import { Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, ExtrudeGeometry, CylinderGeometry, CircleGeometry, MeshPhysicalMaterial, MeshBasicMaterial, CanvasTexture, ShapeUtils, SRGBColorSpace, ACESFilmicToneMapping, type Shape } from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { ambiente } from './rolamento-3d';
import { formaDe } from '../portal/carros';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MIN = 110; /* abaixo desta largura (as miniaturas das tabelas) fica a silhueta */
const LARGURA = .9; /* a largura do carro, nas unidades do desenho (/100) */

type Item = { svg: SVGSVGElement; tela: HTMLCanvasElement; ctx: CanvasRenderingContext2D; carro: string; fase: number; visivel: boolean };
let r: WebGLRenderer | null = null, cena: Scene, cam: PerspectiveCamera, falhou = false;
const itens = new Map<SVGSVGElement, Item>();
const modelos = new Map<string, { grupo: Group; rodas: Group[] }>();
let obs: IntersectionObserver, pedido = 0;

const formas = (d: string): Shape[] => {
  const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`);
  return svg.paths.flatMap((p) => SVGLoader.createShapes(p)).filter((s) => Math.abs(ShapeUtils.area(s.getPoints())) > 20);
};
function sombra(): Mesh {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d')!; const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(10,20,30,.38)'); g.addColorStop(1, 'rgba(10,20,30,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const m = new Mesh(new CircleGeometry(1, 48), new MeshBasicMaterial({ map: new CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.scale.set(1.5, .75, 1); return m;
}
function modelo(carro: string): { grupo: Group; rodas: Group[] } {
  const ja = modelos.get(carro); if (ja) return ja;
  const [corpo, janelas, y] = formaDe(carro);
  const raio = (y === 80 ? 17 : 15) / 100;
  const pintura = new MeshPhysicalMaterial({ color: '#c9d2da', metalness: .55, roughness: .32, clearcoat: 1, clearcoatRoughness: .12 });
  const vidro = new MeshPhysicalMaterial({ color: '#1f2933', metalness: .3, roughness: .08, clearcoat: 1 });
  const pneu = new MeshPhysicalMaterial({ color: '#1a1d21', metalness: 0, roughness: .85 });
  const jante = new MeshPhysicalMaterial({ color: '#e3e7eb', metalness: 1, roughness: .2 });
  /* o desenho tem o y para baixo e 240 × 100: o centro do carro vai à origem, o chão a y = 0 */
  const chao = (y + raio * 100) / 100;
  const ajustar = (g: ExtrudeGeometry) => { g.scale(.01, -.01, 1); g.translate(-1.2, chao, 0); return g; };
  const bisel = { bevelEnabled: true, bevelThickness: .05, bevelSize: .025, bevelSegments: 4, curveSegments: 24 };
  const carroc = new ExtrudeGeometry(formas(corpo), { depth: LARGURA - .1, ...bisel }); carroc.translate(0, 0, -(LARGURA - .1) / 2);
  const grupo = new Group();
  grupo.add(new Mesh(ajustar(carroc), pintura));
  const vid = formas(janelas);
  if (vid.length) { const g = new ExtrudeGeometry(vid, { depth: LARGURA - .04, bevelEnabled: false, curveSegments: 16 }); g.translate(0, 0, -(LARGURA - .04) / 2); grupo.add(new Mesh(ajustar(g), vidro)); }
  /* as rodas: o pneu, a jante e cinco raios, a sobressair dos lados */
  const rodas: Group[] = [];
  for (const x of [58, 182]) for (const s of [1, -1]) {
    const roda = new Group();
    const p = new Mesh(new CylinderGeometry(raio, raio, .2, 40), pneu); p.rotation.x = Math.PI / 2; roda.add(p);
    const j = new Mesh(new CylinderGeometry(raio * .62, raio * .62, .21, 32), jante); j.rotation.x = Math.PI / 2; roda.add(j);
    for (let k = 0; k < 5; k++) { const b = new Mesh(new CylinderGeometry(.012, .012, raio * .55, 8), pneu); b.position.set(0, 0, s * .106); b.rotation.z = (k / 5) * Math.PI * 2; b.translateY(raio * .28); roda.add(b); }
    roda.position.set(x / 100 - 1.2, chao - y / 100, s * (LARGURA / 2 - .04));
    grupo.add(roda); rodas.push(roda);
  }
  grupo.add(sombra());
  modelos.set(carro, { grupo, rodas });
  return { grupo, rodas };
}

function arrancar(): boolean {
  if (r || falhou) return !!r;
  try {
    r = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.outputColorSpace = SRGBColorSpace; r.toneMapping = ACESFilmicToneMapping; r.setClearColor(0x000000, 0);
    cena = new Scene(); ambiente(r, cena);
    cam = new PerspectiveCamera(24, 2.4, .1, 50);
    return true;
  } catch { falhou = true; return false; }
}

function desenhar(t: number): void {
  pedido = 0;
  if (!r) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let algum = false;
  for (const it of itens.values()) {
    if (!it.visivel || !it.svg.isConnected) continue;
    const w = Math.round(it.tela.clientWidth * dpr), h = Math.round(it.tela.clientHeight * dpr);
    if (!w || !h) continue;
    if (it.tela.width !== w || it.tela.height !== h) { it.tela.width = w; it.tela.height = h; }
    r.setSize(w, h, false);
    const { grupo, rodas } = modelo(it.carro);
    cena.add(grupo);
    const a = quieto() ? -.65 : it.fase + t / 2600; /* um giro em ~16 s */
    grupo.rotation.y = a;
    rodas.forEach((rd) => { rd.rotation.z = quieto() ? 0 : -t / 260; });
    cam.aspect = w / h; cam.position.set(0, 1.0, Math.max(3.6, 3.2 / (.425 * cam.aspect))); cam.lookAt(0, .45, 0); cam.updateProjectionMatrix();
    r.render(cena, cam);
    cena.remove(grupo);
    it.ctx.clearRect(0, 0, w, h); it.ctx.drawImage(r.domElement, 0, 0, w, h);
    algum = true;
  }
  if (algum && !quieto()) pedido = requestAnimationFrame(desenhar);
}
const pedir = () => { if (!pedido) pedido = requestAnimationFrame(desenhar); };
/** a tela fica por cima da silhueta (que guarda o lugar no cartão) */
const colocar = (it: Item) => { const s = it.svg, b = s.getBoundingClientRect(), pb = s.parentElement!.getBoundingClientRect(); Object.assign(it.tela.style, { left: `${b.left - pb.left}px`, top: `${b.top - pb.top}px`, width: `${b.width}px`, height: `${b.height}px` }); };

function procurar(): void {
  for (const [svg, it] of itens) { if (!svg.isConnected) { obs.unobserve(it.tela); it.tela.remove(); itens.delete(svg); } else colocar(it); }
  const novos = Array.from(document.querySelectorAll<SVGSVGElement>('.ecra:not([hidden]) svg.cat6__silhueta[data-carro]:not([data-3d])'));
  for (const svg of novos) {
    const larg = svg.getBoundingClientRect().width;
    if (larg < MIN || svg.closest('.portal--estado, .tec__ctx, .tec__guia, table')) continue;
    if (!arrancar()) return;
    const pai = svg.parentElement!; if (getComputedStyle(pai).position === 'static') pai.style.position = 'relative';
    const tela = document.createElement('canvas'); tela.className = 'cat6__3d'; tela.setAttribute('aria-hidden', 'true');
    svg.after(tela); svg.dataset['3d'] = '1';
    const ctx = tela.getContext('2d'); if (!ctx) continue;
    const it: Item = { svg, tela, ctx, carro: svg.dataset.carro || 'Hatchback', fase: Math.random() * Math.PI * 2, visivel: false };
    itens.set(svg, it); colocar(it); obs.observe(tela);
  }
  pedir();
}

export function iniciar(): void {
  obs = new IntersectionObserver((es) => { for (const e of es) { for (const it of itens.values()) if (it.tela === e.target) it.visivel = e.isIntersecting; } pedir(); });
  let t = 0;
  const depois = () => { window.clearTimeout(t); t = window.setTimeout(procurar, 150); };
  new MutationObserver(depois).observe(document.body, { childList: true, subtree: true });
  ['hashchange', 'resize'].forEach((e) => window.addEventListener(e, depois));
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, depois));
  depois();
}
