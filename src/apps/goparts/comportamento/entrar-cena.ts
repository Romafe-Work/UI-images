/* =========================================================
   GOPARTS — os ecrãs de entrar: a cena 3D partilhada (14 out. 2026)
   Uma só cena e um só canvas para os quatro ecrãs (comportamento/entrar-3d.ts muda o canvas de
   ecrã sem perder o contexto). O rolamento nunca recomeça: cada ecrã só muda os ALVOS do estado
   mecânico e da câmara, e os valores atuais seguem-nos com uma mola amortecida — por isso, de um
   ecrã para o outro, o movimento continua de onde estava.
     entrada   — o anel exterior no sítio, a rodar; as esferas giram à volta, ainda soltas;
     palavra   — o anel interior entra pelo eixo e roda até alinhar; as esferas assentam;
     empresa   — vista explodida: as peças afastam-se ao longo do eixo; a câmara roda ~20°; cotas;
     ajuda     — desmontado, as peças suspensas a flutuar; a escolhida vem à frente;
     completo  — tudo montado, a gaiola fecha, a marca laranja de alinhamento; a câmara atravessa
                 o centro do rolamento (o «Entrar» bem-sucedido).
   Impulsos: `travar()` (o anel trava com um pequeno ressalto) e `resistir()` (palavra-passe errada:
   o anel interior tenta rodar e volta, sem bloquear nada). O rato inclina o rolamento com inércia e
   desloca a câmara; com um campo em foco, tudo abranda. Tempos: câmara ~0,8 s, peças ~1 s.
   ========================================================= */
import { WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, BoxGeometry, MeshBasicMaterial, Object3D, Vector2, Vector3, Matrix4, Color, ACESFilmicToneMapping, SRGBColorSpace, type MeshPhysicalMaterial } from 'three';
import { R, N_ESFERAS, criarRolamento, ambiente, type Rolamento } from './rolamento-3d';

export type Estado = 'entrada' | 'palavra' | 'empresa' | 'ajuda' | 'completo';
export type Peca = 'ext' | 'int' | 'esf' | 'gai' | '';

interface Valores { ext: number; int: number; assento: number; gaiola: number; explodir: number; flutuar: number; marcador: number; dist: number; yaw: number; pitch: number; vel: number }
const ALVOS: Record<Estado, Valores> = {
  entrada:  { ext: 1, int: 0, assento: 0, gaiola: 0, explodir: 0,   flutuar: 0, marcador: 0, dist: 1,    yaw: 0.42, pitch: -0.28, vel: 0.35 },
  palavra:  { ext: 1, int: 1, assento: 1, gaiola: 0, explodir: 0,   flutuar: 0, marcador: 0, dist: 0.92, yaw: 0.36, pitch: -0.22, vel: 0.25 },
  empresa:  { ext: 1, int: 1, assento: 1, gaiola: 1, explodir: 1,   flutuar: 0, marcador: 0, dist: 1.12, yaw: 0.78, pitch: -0.18, vel: 0.08 },
  ajuda:    { ext: 1, int: 1, assento: 1, gaiola: 1, explodir: 1.5, flutuar: 1, marcador: 0, dist: 1.2,  yaw: 0.1,  pitch: -0.3,  vel: 0.04 },
  completo: { ext: 1, int: 1, assento: 1, gaiola: 1, explodir: 0,   flutuar: 0, marcador: 1, dist: 0.9,  yaw: 0,    pitch: 0,     vel: 1.6 },
};
/* a rapidez com que cada valor segue o alvo (1/s): as peças ~1 s, a câmara ~0,8 s */
const RAPIDEZ: Valores = { ext: 4, int: 3.6, assento: 3.4, gaiola: 4, explodir: 3.4, flutuar: 2, marcador: 5, dist: 4.5, yaw: 4.5, pitch: 4.5, vel: 2.5 };
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const lim = (v: number) => Math.max(0, Math.min(1, v));

export interface Cotas { linha: SVGLineElement; ponto: SVGCircleElement; rotulo: HTMLElement }

export class CenaEntrar {
  private r: WebGLRenderer;
  private cena = new Scene();
  private cam = new PerspectiveCamera(30, 1, 0.05, 100);
  private rol: Rolamento;
  private eixo = new Group();
  private marcador: Mesh;
  private aux = new Object3D();
  private v: Valores = { ...ALVOS.entrada, ext: 0, dist: 1.25 };
  private alvo: Valores = { ...ALVOS.entrada };
  private foco: Peca = '';
  private focoV = { ext: 0, int: 0, esf: 0, gai: 0 };
  private emFoco = false; private abrandar = 1;
  private ang = 0; private angEsf = 0; private t = 0; private ultimo = 0;
  private trava = -10; private resiste = -10; private voo = Infinity;
  private rato = new Vector2(); private ratoSuave = new Vector2();
  private ciclo = 0; private ativo = false;
  private zBase = 8.6;
  private ro: ResizeObserver;
  private cotas = new Map<string, Cotas>();

  constructor(readonly canvas: HTMLCanvasElement, private fundo: () => string) {
    this.r = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.r.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 2));
    this.r.toneMapping = ACESFilmicToneMapping; this.r.toneMappingExposure = 1.05; this.r.outputColorSpace = SRGBColorSpace;
    ambiente(this.r, this.cena);
    this.pintarFundo();
    this.rol = criarRolamento();
    this.eixo.add(this.rol.grupo);
    /* a marca laranja de alinhamento, na face do anel exterior, ao alto */
    this.marcador = new Mesh(new BoxGeometry(0.035, 0.12, 0.012), new MeshBasicMaterial({ color: '#ef7b10' }));
    this.marcador.position.set(0, R.ext - 0.09, R.meia + 0.008);
    this.rol.ext.add(this.marcador);
    this.cena.add(this.eixo);
    window.addEventListener('pointermove', this.mover, { passive: true });
    document.addEventListener('visibilitychange', this.visibilidade);
    this.ro = new ResizeObserver(() => this.medir());
    this.ro.observe(canvas);
    this.medir();
  }

  /* ---------- o que o controlador pede ---------- */
  irPara(e: Estado): void { this.alvo = { ...ALVOS[e] }; if (e !== 'completo') this.voo = Infinity; if (e !== 'ajuda') this.foco = ''; }
  focar(p: Peca): void { this.foco = p; }
  campoEmFoco(sim: boolean): void { this.emFoco = sim; }
  travar(): void { this.trava = this.t; }
  resistir(): void { this.resiste = this.t; }
  /** O «Entrar» bem-sucedido: completa-se, e a câmara atravessa o centro do rolamento. */
  atravessar(): void { this.irPara('completo'); this.voo = this.t + 0.7; }
  ligarCotas(m: Map<string, Cotas>): void { this.cotas = m; }
  pintarFundo(): void { this.cena.background = new Color(this.fundo()); }
  /** Salta para o estado (sem animação): «reduzir movimento», ou ao chegar diretamente a um ecrã. */
  saltarPara(e: Estado): void { this.irPara(e); this.v = { ...ALVOS[e] }; this.voo = Infinity; }

  ligar(): void { if (this.ativo) return; this.ativo = true; this.ultimo = performance.now(); this.ciclo = requestAnimationFrame(this.frame); }
  parar(): void { this.ativo = false; cancelAnimationFrame(this.ciclo); this.ciclo = 0; }

  private visibilidade = () => { if (document.hidden) { cancelAnimationFrame(this.ciclo); this.ciclo = 0; } else if (this.ativo && !this.ciclo) { this.ultimo = performance.now(); this.ciclo = requestAnimationFrame(this.frame); } };
  private mover = (e: PointerEvent) => { this.rato.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); };

  medir(): void {
    const w = this.canvas.clientWidth || 1, h = this.canvas.clientHeight || 1;
    this.r.setSize(w, h, false);
    this.cam.aspect = w / h;
    this.zBase = 8.6 * Math.max(1, 1.05 / this.cam.aspect); /* (ela, 14 out.: «o rolamento mais pequeno») */
    this.cam.updateProjectionMatrix();
  }

  private frame = (agora: number) => {
    this.ciclo = requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, (agora - this.ultimo) / 1000); this.ultimo = agora;
    const t = (this.t += dt);
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* os valores seguem os alvos (mola amortecida, sem ressalto) */
    (Object.keys(this.v) as (keyof Valores)[]).forEach((k) => { this.v[k] += (this.alvo[k] - this.v[k]) * (quieto ? 1 : 1 - Math.exp(-RAPIDEZ[k] * dt)); });
    (['ext', 'int', 'esf', 'gai'] as const).forEach((p) => { this.focoV[p] += ((this.foco === p ? 1 : 0) - this.focoV[p]) * (1 - Math.exp(-6 * dt)); });
    this.abrandar += ((this.emFoco ? 0.25 : 1) - this.abrandar) * (1 - Math.exp(-3 * dt));
    this.ratoSuave.lerp(this.rato, 1 - Math.exp(-2.5 * dt));
    const v = this.v;

    /* a câmara: à volta do rolamento (yaw, pitch, distância) e um pouco atrás do rato; no voo, entra pelo eixo */
    const voo = lim((t - this.voo) / 0.9), vooK = voo * voo * (3 - 2 * voo);
    const yaw = v.yaw + this.ratoSuave.x * 0.12, pitch = v.pitch + this.ratoSuave.y * 0.08;
    const d = this.zBase * mix(v.dist, 0.02, vooK);
    this.cam.position.set(Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d, Math.cos(yaw) * Math.cos(pitch) * d);
    this.cam.lookAt(0, 0, 0);

    /* o rolamento roda (abranda com um campo em foco); o rato inclina-o com inércia */
    if (!quieto) { this.ang += dt * v.vel * this.abrandar; this.angEsf += dt * mix(0.9, 0.2, v.assento) * this.abrandar; }
    const tr = t - this.trava, trava = tr < 1.2 ? Math.exp(-7 * tr) * Math.sin(tr * 22) * 0.12 : 0;
    const rs = t - this.resiste, resiste = rs < 1.4 ? Math.exp(-4.5 * rs) * Math.sin(rs * 15) * 0.3 : 0;
    this.eixo.rotation.set(-this.ratoSuave.y * 0.18, this.ratoSuave.x * 0.25, 0);
    const g = this.rol;
    g.grupo.rotation.z = this.ang;

    /* as peças: o explodido afasta-as ao longo do eixo; a ajuda põe-nas a flutuar; a escolhida vem à frente */
    const ex = v.explodir, fl = v.flutuar;
    const boia = (fase: number) => Math.sin(t * 0.9 + fase) * 0.06 * fl;
    const frente = (p: keyof typeof this.focoV) => this.focoV[p] * 0.55;
    g.ext.scale.setScalar(mix(0.001, 1, lim(v.ext)) * (1 + this.focoV.ext * 0.04));
    g.ext.position.set(0, boia(0), mix(-2.2, 0, v.ext) - 0.95 * ex + frente('ext'));
    g.ext.rotation.z = trava;
    const vInt = lim(v.int);
    g.int.visible = vInt > 0.01;
    g.int.position.set(0, boia(1.6), mix(-2.6, 0, vInt) + 1.0 * ex + frente('int'));
    g.int.rotation.z = mix(Math.PI * 0.75, 0, vInt) + resiste;
    g.int.scale.setScalar(1 + this.focoV.int * 0.05);
    const vGai = lim(v.gaiola);
    g.gaiola.visible = vGai > 0.01;
    g.gaiola.scale.setScalar(mix(0.6, 1, vGai) * (1 + this.focoV.gai * 0.05));
    g.gaiola.children.forEach((c, i) => { c.position.z = (i ? 1 : -1) * mix(0.8, 0.1, vGai) + 0.5 * ex + frente('gai'); c.position.y = boia(2.4 + i); });
    for (let i = 0; i < N_ESFERAS; i++) {
      const a = (i / N_ESFERAS) * Math.PI * 2 + this.angEsf;
      const raio = mix(R.primitivo + 0.2, R.primitivo, lim(v.assento)) + 0.3 * ex;
      this.aux.position.set(Math.cos(a) * raio, Math.sin(a) * raio + boia(i * 0.7), mix(0.28, 0, lim(v.assento)) + 0.25 * ex + frente('esf'));
      this.aux.rotation.set(t * 1.1, t * 0.7, 0);
      this.aux.scale.setScalar(1 + this.focoV.esf * 0.12);
      this.aux.updateMatrix(); g.esferas.setMatrixAt(i, this.aux.matrix);
    }
    g.esferas.instanceMatrix.needsUpdate = true;
    this.marcador.visible = v.marcador > 0.05;
    this.marcador.scale.set(1, lim(v.marcador), 1);

    this.porCotas();
    this.r.render(this.cena, this.cam);
  };

  /** As cotas da vista explodida (03): âncoras nas peças, rótulos por fora do rolamento. */
  private porCotas(): void {
    if (!this.cotas.size) return;
    const cv = this.canvas.getBoundingClientRect();
    if (!cv.width) return;
    const v = new Vector3(), m = new Matrix4();
    const proj = (p: Vector3) => { p.project(this.cam); return [(p.x + 1) / 2 * cv.width, (1 - p.y) / 2 * cv.height]; };
    this.eixo.updateMatrixWorld(true);
    const g = this.rol;
    const ancora: Record<string, () => Vector3> = {
      ext: () => v.set(R.ext * 0.7, R.ext * 0.7, 0).applyMatrix4(g.ext.matrixWorld),
      int: () => v.set(-R.furo * 0.9, -R.furo * 0.5, 0).applyMatrix4(g.int.matrixWorld),
      esf: () => { g.esferas.getMatrixAt(2, m); m.premultiply(g.esferas.matrixWorld); return v.set(0, 0, 0).applyMatrix4(m); },
      gai: () => v.set(-R.primitivo * 0.7, R.primitivo * 0.7, 0).applyMatrix4((g.gaiola.children[1] as Mesh).matrixWorld),
    };
    const [cx, cy] = proj(v.set(0, 0, 0).applyMatrix4(this.eixo.matrixWorld));
    const raio = Math.min(cv.width, cv.height) * 0.4;
    const desvio: Record<string, number> = { ext: -0.3, int: 0.4, esf: 0.15, gai: -0.15 };
    this.cotas.forEach(({ linha, ponto, rotulo }, k) => {
      if (!ancora[k]) return;
      const [x, y] = proj(ancora[k]());
      const ang = Math.atan2(y - cy, x - cx) + desvio[k];
      const esq = cx + Math.cos(ang) * raio < cx, larg = rotulo.offsetWidth + 14;
      /* o rótulo nunca sai do palco: limita-se pela largura do próprio texto */
      const lx = esq ? Math.max(larg, cx + Math.cos(ang) * raio) : Math.min(cv.width - larg, cx + Math.cos(ang) * raio), ly = Math.max(60, Math.min(cv.height - 60, cy + Math.sin(ang) * raio));
      linha.setAttribute('x1', x.toFixed(1)); linha.setAttribute('y1', y.toFixed(1)); linha.setAttribute('x2', lx.toFixed(1)); linha.setAttribute('y2', ly.toFixed(1));
      ponto.setAttribute('cx', x.toFixed(1)); ponto.setAttribute('cy', y.toFixed(1));
      rotulo.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px) translate(${esq ? '-100%' : '0'}, -50%)`;
      rotulo.classList.toggle('is-esq', esq);
    });
  }

  destruir(): void {
    this.parar();
    window.removeEventListener('pointermove', this.mover);
    document.removeEventListener('visibilitychange', this.visibilidade);
    this.ro.disconnect();
    this.cena.traverse((o) => { const m = o as Mesh; m.geometry?.dispose(); const mt = m.material as MeshPhysicalMaterial | MeshPhysicalMaterial[] | undefined; (Array.isArray(mt) ? mt : mt ? [mt] : []).forEach((x) => x.dispose()); });
    this.cena.environment?.dispose();
    this.r.dispose(); this.r.forceContextLoss();
  }
}
