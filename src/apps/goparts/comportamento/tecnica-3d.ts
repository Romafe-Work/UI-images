/* =========================================================
   GOPARTS — 17 · Informações técnicas: o 3D (15 out. 2026; carregado só quando a Visão geral abre)
   Do segundo briefing dela («Automotive Engineering Workspace») e da nota: «usaria o modelo 3D como porta de
   entrada e para explorar componentes» — e não permanentemente no meio de todas as páginas.
   - CARRO: um modelo ILUSTRATIVO, feito a partir da silhueta da carroçaria do Catálogo (extrudida), com os
     sistemas em blocos simples no sítio geral deles (o motor e o arrefecimento à frente, a transmissão conforme a
     tração, os discos e as suspensões nas rodas, a direção no eixo da frente, a climatização atrás do tablier).
     O ecrã diz que não é o veículo escolhido. Não há bateria nem peças com posição própria: isso seria inventar.
     O sistema elétrico é o carro todo (as arestas acendem).
   - ROLAMENTO: a vista explodida do SKF 6206 (rolamento-3d.ts, geometria normalizada: D 62, d 30, B 16 mm,
     9 esferas de 9,525 mm) — o único conjunto com geometria verificada no protótipo.
   Rodar com o rato, zoom com a roda, focar um sistema ou uma peça (câmara em 800 ms). Desenha só enquanto alguma
   coisa se mexe (sem ciclo contínuo); `destruir()` liberta as geometrias, os materiais e o contexto WebGL.
   Luz de estúdio branca, sem reflexos coloridos, brilhos nem gradientes.
   ========================================================= */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshStandardMaterial, ExtrudeGeometry, ShapeGeometry, CylinderGeometry, BoxGeometry,
  HemisphereLight, DirectionalLight, Vector3, Vector2, Raycaster, EdgesGeometry, LineSegments, LineBasicMaterial, Object3D, Color, Box3,
  DoubleSide, SRGBColorSpace, PMREMGenerator, type Material, type InstancedMesh,
} from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { criarRolamento, R, N_ESFERAS, type Rolamento } from './rolamento-3d';
import { formaDe } from '../portal/carros';
import type { IdSistema } from '../portal/tecnica-dados';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const suave = (t: number) => 1 - Math.pow(1 - t, 3);
const AZUL = new Color('#0873BC');
export const temWebGL = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } };

interface Camara { alvo: Vector3; yaw: number; pitch: number; dist: number }

/** O palco comum: o canvas, a câmara em órbita, o rato e o desenho a pedido. */
abstract class Palco {
  protected r: WebGLRenderer;
  protected cena = new Scene();
  protected cam = new PerspectiveCamera(30, 1, 1, 6000);
  protected c: Camara;
  protected inicio: Camara;
  private anim: { de: Camara; para: Camara; t0: number; dur: number } | null = null;
  private raf = 0;
  private ro: ResizeObserver;
  private arrasto: { x: number; y: number; moveu: boolean } | null = null;
  protected ultimo = 0;
  protected distMin = 1; protected distMax = 10;
  protected rotulo: HTMLElement | null;
  protected pontoRotulo: Vector3 | null = null;
  private fora: Array<[EventTarget, string, EventListener]> = [];

  constructor(protected host: HTMLElement, c: Camara) {
    this.c = { ...c, alvo: c.alvo.clone() }; this.inicio = { ...c, alvo: c.alvo.clone() };
    this.r = new WebGLRenderer({ antialias: true, alpha: true });
    this.r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.r.outputColorSpace = SRGBColorSpace;
    this.r.domElement.className = 'tec__canvas';
    this.r.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(this.r.domElement);
    this.rotulo = host.parentElement?.querySelector<HTMLElement>('.tec__3d-rotulo') ?? null;
    const cv = this.r.domElement;
    this.ouvir(cv, 'pointerdown', (e) => { const p = e as PointerEvent; this.arrasto = { x: p.clientX, y: p.clientY, moveu: false }; cv.setPointerCapture(p.pointerId); });
    this.ouvir(cv, 'pointermove', (e) => {
      const p = e as PointerEvent; if (!this.arrasto) return;
      const dx = p.clientX - this.arrasto.x, dy = p.clientY - this.arrasto.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) this.arrasto.moveu = true;
      this.arrasto.x = p.clientX; this.arrasto.y = p.clientY;
      this.anim = null;
      this.c.yaw -= dx * 0.008; this.c.pitch = Math.max(-0.15, Math.min(1.35, this.c.pitch + dy * 0.006));
      cv.classList.add('is-a-arrastar'); this.pedir();
    });
    this.ouvir(cv, 'pointerup', (e) => {
      const p = e as PointerEvent; const a = this.arrasto; this.arrasto = null; cv.classList.remove('is-a-arrastar');
      if (a && !a.moveu) this.tocar(p);
    });
    this.ouvir(cv, 'wheel', (e) => { const w = e as WheelEvent; w.preventDefault(); this.anim = null; this.c.dist = Math.max(this.distMin, Math.min(this.distMax, this.c.dist * Math.exp(w.deltaY * 0.0012))); this.pedir(); }, { passive: false });
    this.ro = new ResizeObserver(() => { this.tamanho(); this.pedir(); });
    this.ro.observe(host);
    this.tamanho();
  }
  private ouvir(t: EventTarget, ev: string, f: EventListener, o?: AddEventListenerOptions): void { t.addEventListener(ev, f, o); this.fora.push([t, ev, f]); }
  private tamanho(): void {
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
  }
  /** O que o rato tocou (sem arrastar). */
  private tocar(p: PointerEvent): void {
    const b = this.r.domElement.getBoundingClientRect();
    const rc = new Raycaster(); rc.setFromCamera(new Vector2(((p.clientX - b.left) / b.width) * 2 - 1, -((p.clientY - b.top) / b.height) * 2 + 1), this.cam);
    this.escolhido(rc);
  }
  protected abstract escolhido(rc: Raycaster): void;
  /** Animações próprias (opacidades, cores, a explosão); devolve true enquanto não acabaram. */
  protected antes(_dt: number): boolean { return false; }
  pedir(): void { if (!this.raf) this.raf = requestAnimationFrame((t) => this.quadro(t)); }
  private quadro(t: number): void {
    this.raf = 0;
    const dt = this.ultimo ? Math.min(0.05, (t - this.ultimo) / 1000) : 0.016; this.ultimo = t;
    let continuar = false;
    if (this.anim) {
      const k = Math.min(1, (t - this.anim.t0) / this.anim.dur), e = suave(k), { de, para } = this.anim;
      this.c.alvo.lerpVectors(de.alvo, para.alvo, e);
      this.c.yaw = de.yaw + (para.yaw - de.yaw) * e; this.c.pitch = de.pitch + (para.pitch - de.pitch) * e; this.c.dist = de.dist + (para.dist - de.dist) * e;
      if (k < 1) continuar = true; else this.anim = null;
    }
    if (this.antes(dt)) continuar = true;
    const { alvo, yaw, pitch, dist } = this.c;
    this.cam.position.set(alvo.x + dist * Math.cos(pitch) * Math.sin(yaw), alvo.y + dist * Math.sin(pitch), alvo.z + dist * Math.cos(pitch) * Math.cos(yaw));
    this.cam.lookAt(alvo);
    this.r.render(this.cena, this.cam);
    this.porRotulo();
    if (continuar) this.pedir(); else this.ultimo = 0;
  }
  private porRotulo(): void {
    if (!this.rotulo) return;
    if (!this.pontoRotulo) { this.rotulo.hidden = true; return; }
    const v = this.pontoRotulo.clone().project(this.cam);
    const w = this.host.clientWidth, h = this.host.clientHeight;
    this.rotulo.hidden = false;
    this.rotulo.style.transform = `translate(${Math.round((v.x + 1) / 2 * w)}px, ${Math.round((1 - v.y) / 2 * h)}px) translate(-50%, -100%)`;
  }
  /** A câmara vai até lá (800 ms; com «reduzir movimento», salta). */
  irPara(para: Camara, dur = 800): void {
    const p = { ...para, alvo: para.alvo.clone() };
    /* o caminho mais curto à volta do carro */
    while (p.yaw - this.c.yaw > Math.PI) p.yaw -= Math.PI * 2;
    while (this.c.yaw - p.yaw > Math.PI) p.yaw += Math.PI * 2;
    if (quieto()) { this.c = p; this.anim = null; } else this.anim = { de: { ...this.c, alvo: this.c.alvo.clone() }, para: p, t0: performance.now(), dur };
    this.pedir();
  }
  repor(): void { this.irPara(this.inicio); }
  destruir(): void {
    cancelAnimationFrame(this.raf); this.ro.disconnect();
    this.fora.forEach(([t, ev, f]) => t.removeEventListener(ev, f));
    this.cena.traverse((o) => {
      const m = o as Mesh; m.geometry?.dispose();
      const mat = m.material as Material | Material[] | undefined; (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
    });
    this.cena.environment?.dispose();
    this.r.dispose(); this.r.forceContextLoss(); this.r.domElement.remove();
    if (this.rotulo) this.rotulo.hidden = true;
  }
  protected luzes(): void {
    this.cena.add(new HemisphereLight('#ffffff', '#3a3f45', 1.1));
    const chave = new DirectionalLight('#ffffff', 1.6); chave.position.set(300, 500, 400); this.cena.add(chave);
    const recorte = new DirectionalLight('#ffffff', 0.6); recorte.position.set(-400, 200, -300); this.cena.add(recorte);
  }
}

/* ---------- o carro ilustrativo ---------- */
const NOME: Record<IdSistema, string> = { motor: 'Motor', arrefecimento: 'Arrefecimento', transmissao: 'Transmissão', travoes: 'Travões', suspensao: 'Suspensão', direcao: 'Direção', eletrico: 'Sistema elétrico · todo o veículo', climatizacao: 'Aquecimento e ar condicionado' };
/* para onde a câmara olha em cada sistema: [yaw, pitch, distância] (a frente do carro está em −x) */
const VISTA: Record<IdSistema, [number, number, number]> = {
  motor: [-0.75, 0.5, 300], arrefecimento: [-1.15, 0.32, 270], transmissao: [0.25, 0.95, 330], travoes: [0.4, 0.18, 330],
  suspensao: [0.4, 0.3, 340], direcao: [-0.55, 0.62, 300], eletrico: [0.62, 0.32, 600], climatizacao: [0.3, 0.6, 300],
};

export class Carro3D extends Palco {
  private corpoMat: MeshStandardMaterial;
  private vidroMat: MeshStandardMaterial;
  private arestas: LineSegments;
  private sistemas = new Map<IdSistema, Group>();
  private mats = new Map<IdSistema, MeshStandardMaterial>();
  private escolha: IdSistema | undefined;
  private tecnica = false;
  private opCorpo = 1;

  constructor(host: HTMLElement, carrocaria: string, tracao: string, private aoEscolher: (s: IdSistema) => void) {
    super(host, { alvo: new Vector3(0, 34, 0), yaw: 0.62, pitch: 0.28, dist: 500 });
    this.distMin = 160; this.distMax = 1100;
    this.luzes();
    const [corpo, janelas, y] = formaDe(carrocaria);
    const r = y === 80 ? 17 : 15, chao = y + r, W = 96;
    const X = (xs: number) => xs - 120, Y = (ys: number) => chao - ys;
    const svg = (d: string) => new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`).paths[0].toShapes(true);
    /* a carroçaria: a silhueta extrudida na largura, com as arestas boleadas */
    const g = new ExtrudeGeometry(svg(corpo), { depth: W, bevelEnabled: true, bevelThickness: 7, bevelSize: 4, bevelSegments: 4, curveSegments: 16 });
    g.translate(-120, -chao, -W / 2); g.rotateX(Math.PI); /* virar (em vez de espelhar) mantém as faces para fora */
    this.corpoMat = new MeshStandardMaterial({ color: '#a7aeb6', roughness: 0.55, metalness: 0.15, side: DoubleSide, transparent: true });
    const carro = new Mesh(g, this.corpoMat); carro.renderOrder = 2; this.cena.add(carro);
    this.arestas = new LineSegments(new EdgesGeometry(g, 28), new LineBasicMaterial({ color: '#4b5563', transparent: true, opacity: 0.35 }));
    this.cena.add(this.arestas);
    /* os vidros laterais: só o contorno fechado das janelas, dos dois lados */
    this.vidroMat = new MeshStandardMaterial({ color: '#2b3138', roughness: 0.4, metalness: 0.1, side: DoubleSide, transparent: true });
    const fechado = janelas.split(/[Zz]/)[0] + 'Z';
    [-1, 1].forEach((s) => {
      const vg = new ShapeGeometry(svg(fechado)); vg.translate(-120, -chao, 0); vg.rotateX(Math.PI);
      const v = new Mesh(vg, this.vidroMat); v.position.z = s * (W / 2 + 7.4); v.renderOrder = 3; this.cena.add(v);
    });
    /* as rodas */
    const pneu = new MeshStandardMaterial({ color: '#25292e', roughness: 0.9 }), jante = new MeshStandardMaterial({ color: '#8b939b', roughness: 0.45, metalness: 0.5 });
    [58, 182].forEach((xs) => [-1, 1].forEach((s) => {
      const p = new Mesh(new CylinderGeometry(r, r, 16, 40).rotateX(Math.PI / 2), pneu); p.position.set(X(xs), r, s * (W / 2 - 4)); this.cena.add(p);
      const j = new Mesh(new CylinderGeometry(r * 0.55, r * 0.55, 16.6, 32).rotateX(Math.PI / 2), jante); j.position.copy(p.position); this.cena.add(j);
    }));
    /* os sistemas, em blocos simples no sítio geral de cada um */
    const sis = (id: IdSistema) => {
      const m = new MeshStandardMaterial({ color: '#6b737c', roughness: 0.6, metalness: 0.25, transparent: true });
      const gr = new Group(); gr.userData.sis = id; gr.visible = false; this.sistemas.set(id, gr); this.mats.set(id, m); this.cena.add(gr);
      return (geo: CylinderGeometry | BoxGeometry, x: number, yy: number, z = 0, rz = 0) => { const k = new Mesh(geo, m); k.position.set(x, yy, z); k.rotation.z = rz; k.userData.sis = id; gr.add(k); return k; };
    };
    sis('arrefecimento')(new BoxGeometry(5, 22, W - 22), X(25), Y(y - 14));
    sis('motor')(new BoxGeometry(40, 24, 56), X(54), Y(y - 20));
    const tr = sis('transmissao');
    if (tracao === 'Tração traseira') {
      tr(new BoxGeometry(24, 13, 26), X(88), Y(y - 10));
      tr(new CylinderGeometry(2.6, 2.6, 182 - 100, 16), X(141), Y(y - 6), 0, Math.PI / 2);
      tr(new BoxGeometry(12, 12, 18), X(182), r);
    } else tr(new BoxGeometry(22, 15, 42), X(84), Y(y - 12));
    const tv = sis('travoes'), su = sis('suspensao');
    [58, 182].forEach((xs) => [-1, 1].forEach((s) => {
      tv(new CylinderGeometry(r * 0.62, r * 0.62, 2.6, 32).rotateX(Math.PI / 2), X(xs), r, s * (W / 2 - 14));
      su(new CylinderGeometry(2.4, 2.4, 26, 14), X(xs), r + 14, s * (W / 2 - 20));
    }));
    const di = sis('direcao');
    di(new CylinderGeometry(2.2, 2.2, W - 28, 14).rotateX(Math.PI / 2), X(64), r + 3);
    const [ax, ay, bx, by] = [X(64), r + 3, X(98), Y(y - 31)], comp = Math.hypot(bx - ax, by - ay);
    di(new CylinderGeometry(1.5, 1.5, comp, 10), (ax + bx) / 2, (ay + by) / 2, -W / 4, Math.atan2(by - ay, bx - ax) - Math.PI / 2);
    sis('climatizacao')(new BoxGeometry(14, 10, W - 30), X(97), Y(y - 32));
    /* o sistema elétrico é o veículo todo: as arestas da carroçaria */
    const el = new Group(); el.userData.sis = 'eletrico'; this.sistemas.set('eletrico', el);
    this.cena.add(el);
    this.pedir();
  }
  /** Exterior (a carroçaria cheia) ou técnica (a carroçaria quase transparente e os sistemas à vista). */
  vista(tecnica: boolean): void { this.tecnica = tecnica; this.sistemas.forEach((g) => { if (tecnica) g.visible = true; }); this.pedir(); }
  get emTecnica(): boolean { return this.tecnica; }
  /** Focar um sistema (ou voltar ao carro todo). */
  focar(s: IdSistema | undefined): void {
    this.escolha = s;
    if (s && s !== 'eletrico' && !this.tecnica) this.vista(true);
    if (!s) { this.pontoRotulo = null; this.repor(); return; }
    const g = this.sistemas.get(s)!;
    const caixa = s === 'eletrico' ? new Box3().setFromObject(this.arestas) : new Box3().setFromObject(g);
    const centro = caixa.getCenter(new Vector3());
    const [yaw, pitch, dist] = VISTA[s];
    this.pontoRotulo = s === 'eletrico' ? new Vector3(centro.x, caixa.max.y + 6, centro.z) : new Vector3(centro.x, caixa.max.y + 4, caixa.max.z);
    if (this.rotulo) this.rotulo.textContent = NOME[s];
    this.irPara({ alvo: s === 'eletrico' ? new Vector3(0, 34, 0) : centro, yaw, pitch, dist });
  }
  protected escolhido(rc: Raycaster): void {
    const alvos: Object3D[] = []; this.sistemas.forEach((g) => { if (g.visible) alvos.push(...g.children); });
    const t = rc.intersectObjects(alvos, false)[0];
    if (t) this.aoEscolher(t.object.userData.sis as IdSistema);
  }
  protected antes(dt: number): boolean {
    const k = 1 - Math.exp(-dt * 9);
    let mexe = false;
    const segue = (atual: number, alvo: number) => { const n = atual + (alvo - atual) * k; if (Math.abs(alvo - n) > 0.004) mexe = true; return Math.abs(alvo - n) > 0.004 ? n : alvo; };
    this.opCorpo = segue(this.opCorpo, this.tecnica ? 0.14 : 1);
    this.corpoMat.opacity = this.opCorpo; this.corpoMat.depthWrite = this.opCorpo > 0.9;
    this.vidroMat.opacity = Math.max(0.1, this.opCorpo);
    const elet = this.escolha === 'eletrico';
    const am = this.arestas.material as LineBasicMaterial;
    am.color.lerp(elet ? AZUL : new Color('#4b5563'), k); am.opacity = segue(am.opacity, elet ? 1 : this.tecnica ? 0.6 : 0.35);
    if (elet && !am.color.equals(AZUL)) mexe = true;
    this.mats.forEach((m, id) => {
      const sel = id === this.escolha;
      const cor = sel ? AZUL : new Color('#6b737c');
      m.color.lerp(cor, k); if (Math.abs(m.color.r - cor.r) + Math.abs(m.color.b - cor.b) > 0.004) mexe = true;
      m.opacity = segue(m.opacity, !this.tecnica ? 0 : this.escolha && !sel ? 0.4 : 1);
    });
    if (!this.tecnica && this.opCorpo > 0.98) this.sistemas.forEach((g) => { g.visible = false; });
    return mexe;
  }
}

/* ---------- a vista explodida do rolamento ---------- */
export type Peca = 'ext' | 'int' | 'esf' | 'gai';
const NOME_PECA: Record<Peca, string> = { ext: 'Anel exterior', int: 'Anel interior', esf: 'Esferas (9)', gai: 'Gaiola' };
export class Rolamento3D extends Palco {
  private rol: Rolamento;
  private aux = new Object3D();
  private explodir = 0; private alvoExp = 0;
  private escolha: Peca | undefined;
  private mats: Record<Peca, MeshStandardMaterial[]>;

  constructor(host: HTMLElement, private aoEscolher: (p: Peca) => void) {
    super(host, { alvo: new Vector3(0, 0, 0), yaw: 0.75, pitch: 0.32, dist: 7.2 });
    this.distMin = 2.6; this.distMax = 14;
    const pm = new PMREMGenerator(this.r); this.cena.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
    this.luzes();
    this.rol = criarRolamento();
    /* cada peça com o seu material, para acender só a escolhida */
    const cl = (m: Mesh | InstancedMesh) => { const c = (m.material as MeshStandardMaterial).clone(); c.transparent = true; m.material = c; return c; };
    this.mats = { ext: [cl(this.rol.ext)], int: [cl(this.rol.int)], esf: [cl(this.rol.esferas)], gai: this.rol.gaiola.children.map((g) => cl(g as Mesh)) };
    this.rol.ext.userData.peca = 'ext'; this.rol.int.userData.peca = 'int'; this.rol.esferas.userData.peca = 'esf'; this.rol.gaiola.children.forEach((g) => { g.userData.peca = 'gai'; });
    this.cena.add(this.rol.grupo);
    this.porEsferas();
    this.pedir();
  }
  private porEsferas(): void {
    const z = 0.36 * this.explodir;
    for (let i = 0; i < N_ESFERAS; i++) {
      const a = (i / N_ESFERAS) * Math.PI * 2;
      this.aux.position.set(R.primitivo * Math.cos(a), R.primitivo * Math.sin(a), z); this.aux.updateMatrix(); this.rol.esferas.setMatrixAt(i, this.aux.matrix);
    }
    this.rol.esferas.instanceMatrix.needsUpdate = true;
    this.rol.esferas.computeBoundingSphere();
    this.rol.ext.position.z = -1.05 * this.explodir;
    this.rol.gaiola.position.z = -0.34 * this.explodir;
    this.rol.int.position.z = 1.05 * this.explodir;
  }
  separar(sim: boolean): void { this.alvoExp = sim ? 1 : 0; if (quieto()) { this.explodir = this.alvoExp; this.porEsferas(); } this.pedir(); }
  get separado(): boolean { return this.alvoExp === 1; }
  focar(p: Peca | undefined): void {
    this.escolha = p;
    if (p && !this.separado) this.separar(true);
    if (!p) { this.pontoRotulo = null; this.repor(); return; }
    const z = { ext: -1.05, gai: -0.34, esf: 0.36, int: 1.05 }[p];
    const raio = { ext: R.ext, gai: R.primitivo, esf: R.primitivo + R.esfera, int: R.primitivo - 0.12 }[p];
    this.pontoRotulo = new Vector3(0, raio + 0.08, z);
    if (this.rotulo) this.rotulo.textContent = NOME_PECA[p];
    this.irPara({ alvo: new Vector3(0, 0, z * 0.6), yaw: 0.9, pitch: 0.28, dist: 5.2 });
  }
  protected escolhido(rc: Raycaster): void {
    const t = rc.intersectObjects([this.rol.ext, this.rol.int, this.rol.esferas, ...this.rol.gaiola.children], false)[0];
    if (t) this.aoEscolher(t.object.userData.peca as Peca);
  }
  protected antes(dt: number): boolean {
    let mexe = false;
    if (this.explodir !== this.alvoExp) {
      const k = 1 - Math.exp(-dt * 5.5);
      this.explodir += (this.alvoExp - this.explodir) * k;
      if (Math.abs(this.alvoExp - this.explodir) < 0.002) this.explodir = this.alvoExp; else mexe = true;
      this.porEsferas();
    }
    const k = 1 - Math.exp(-dt * 9);
    (Object.keys(this.mats) as Peca[]).forEach((p) => this.mats[p].forEach((m) => {
      const sel = p === this.escolha, alvo = this.escolha && !sel ? 0.28 : 1;
      m.opacity += (alvo - m.opacity) * k; if (Math.abs(alvo - m.opacity) > 0.004) mexe = true; else m.opacity = alvo;
      m.depthWrite = m.opacity > 0.9;
      if (!m.userData.base) m.userData.base = m.color.clone();
      const cor = sel ? (m.userData.base as Color).clone().lerp(AZUL, 0.7) : (m.userData.base as Color);
      m.color.lerp(cor, k); if (Math.abs(m.color.b - cor.b) + Math.abs(m.color.r - cor.r) > 0.004) mexe = true;
    }));
    return mexe;
  }
}
