/* =========================================================
   ERP — 00 · Abertura: a cena 3D do rolamento (19 out. 2026)
   Carrega-se à parte (import dinâmico em comportamento/abertura.ts), só quando a abertura aparece.
   É a do GoParts (o mesmo SKF 6206 de goparts/comportamento/rolamento-3d.ts, o mesmo aço), com o que é
   do ERP: a gota de óleo que lubrifica o rolamento, e as cotas da vista explodida trocadas pelos dados
   do artigo no ERP (referência, stock, fornecedor, custo, a encomenda de compra). A rede das peças e
   dos óleos não é desta cena: é a da v10 (rede-cena.ts), que abertura.ts põe por baixo, num canvas
   próprio, e que passa inteira ao 01 · Entrar.
   O canvas é transparente: o fundo é o da página (os tokens --rede-*), o mesmo do 01, para a passagem
   não ter costura.
   ========================================================= */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, InstancedMesh, LatheGeometry, TorusGeometry,
  MeshPhysicalMaterial, Vector2, Vector3, Matrix4, Object3D, Color, BufferGeometry,
  BufferAttribute, Points, ShaderMaterial, ACESFilmicToneMapping, SRGBColorSpace, NormalBlending,
} from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { R, N_ESFERAS, criarRolamento, ambiente } from '../../goparts/comportamento/rolamento-3d';

/* ---------- a linha do tempo (s) ---------- */
export const T = { montar: 1, oleo: 2.05, cai: 2.5, explodir: 3.0, cotas: 3.4, rede: 4.2, juntar: 4.4, particulas: 4.9, logotipo: 6.2, erp: 6.45, linha: 6.7, fim: 7.4 };
const lim = (v: number) => Math.max(0, Math.min(1, v));
const curva = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

type Cota = { linha: SVGLineElement; ponto: SVGCircleElement; rotulo: HTMLElement };
export interface Opcoes {
  /** um instante (s) em que a sequência fica parada, para rever (#…&pausa=3.6) */ pausa?: number;
  canvas: HTMLCanvasElement; logotipo: HTMLElement; cotas: Map<string, Cota>;
  /** as cores das partículas: a do aço e a do ROMAFE (lidas do CSS, mudam com o tema) */ cores: () => { aco: string; marca: string };
}

/** A gota: um perfil de lágrima torneado (ponta em cima). */
function geometriaGota(r: number): LatheGeometry {
  const p = Array.from({ length: 25 }, (_, i) => { const t = (i / 24) * Math.PI; return new Vector2(Math.max(0.0001, Math.sin(t) * Math.sin(t / 2) * r * 0.95), Math.cos(t) * r); });
  return new LatheGeometry(p, 48);
}

export class Cena {
  private r: WebGLRenderer;
  private cena = new Scene();
  private cam = new PerspectiveCamera(30, 1, 0.1, 100);
  private rol = new Group();
  private ext: Mesh; private int: Mesh; private gaiola: Group; private esferas: InstancedMesh;
  private gota: Mesh; private pelicula: Mesh;
  private aux = new Object3D();
  private pontos: Points | null = null;
  private origem: Float32Array = new Float32Array(0); private destino: Float32Array = new Float32Array(0); private desvio: Float32Array = new Float32Array(0); private atraso: Float32Array = new Float32Array(0);
  private amostras: { malha: Mesh | InstancedMesh; locais: Float32Array; inst?: number }[] = [];
  private t0 = 0; private t = 0; private ciclo = 0; private vivo = true;
  private rato = new Vector2(); private ratoSuave = new Vector2();
  private arrasto = { ativo: false, x: 0, y: 0, rx: 0, ry: 0, vx: 0, vy: 0 };
  private zBase = 7;
  private ro: ResizeObserver;
  private aoFim: () => void = () => {};
  private marcadoFim = false;

  constructor(private o: Opcoes) {
    this.r = new WebGLRenderer({ canvas: o.canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.r.setClearColor(0x000000, 0);
    this.r.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.r.toneMapping = ACESFilmicToneMapping; this.r.toneMappingExposure = 1.05; this.r.outputColorSpace = SRGBColorSpace;
    ambiente(this.r, this.cena);
    const rol = criarRolamento();
    this.ext = rol.ext; this.int = rol.int; this.esferas = rol.esferas; this.gaiola = rol.gaiola;
    this.rol.add(...rol.grupo.children);
    this.cena.add(this.rol);

    /* o óleo: âmbar, liso, um pouco transparente; a gota cai sobre o rolamento e espalha-se numa película
       fina na pista das esferas, que desaparece devagar */
    const oleo = new MeshPhysicalMaterial({ color: '#d9961f', metalness: 0, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.94 });
    this.gota = new Mesh(geometriaGota(0.12), oleo);
    this.gota.visible = false; this.cena.add(this.gota);
    this.pelicula = new Mesh(new TorusGeometry(R.primitivo, R.esfera * 1.05, 16, 160), oleo.clone());
    (this.pelicula.material as MeshPhysicalMaterial).opacity = 0; this.pelicula.visible = false;
    this.rol.add(this.pelicula);

    this.prepararAmostras();
    o.canvas.addEventListener('pointerdown', this.premir);
    window.addEventListener('pointermove', this.mover, { passive: true });
    window.addEventListener('pointerup', this.largar);
    this.ro = new ResizeObserver(() => this.medir());
    this.ro.observe(o.canvas);
    this.medir();
  }

  /** Começa (ou recomeça) a sequência; `fim` corre uma vez, quando a sequência acaba. */
  comecar(fim: () => void): void {
    this.aoFim = fim; this.marcadoFim = false;
    this.t0 = performance.now();
    this.arrasto.rx = this.arrasto.ry = this.arrasto.vx = this.arrasto.vy = 0;
    if (this.pontos) { this.cena.remove(this.pontos); this.pontos.geometry.dispose(); (this.pontos.material as ShaderMaterial).dispose(); this.pontos = null; }
    [this.ext, this.int, this.esferas, this.gaiola].forEach((m) => { m.visible = true; });
    if (!this.ciclo) this.ciclo = requestAnimationFrame(this.frame);
  }

  /** O tema mudou: as partículas seguem-no. */
  pintar(): void {
    if (!this.pontos) return;
    const c = this.o.cores(), u = (this.pontos.material as ShaderMaterial).uniforms;
    u.uCorA.value = new Color(c.aco); u.uCorB.value = new Color(c.marca);
  }

  private medir(): void {
    const c = this.o.canvas, w = c.clientWidth || 1, h = c.clientHeight || 1;
    this.r.setSize(w, h, false);
    this.cam.aspect = w / h;
    /* num ecrã alto e estreito a câmara afasta-se, para o rolamento caber na largura */
    this.zBase = 7 * Math.max(1, 1.15 / this.cam.aspect);
    this.cam.updateProjectionMatrix();
  }

  /* ---------- o arrasto e o rato ---------- */
  private premir = (e: PointerEvent) => { if (this.t > T.particulas) return; this.arrasto.ativo = true; this.arrasto.x = e.clientX; this.arrasto.y = e.clientY; this.o.canvas.setPointerCapture?.(e.pointerId); this.o.canvas.classList.add('is-arrastar'); };
  private mover = (e: PointerEvent) => {
    this.rato.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    const a = this.arrasto; if (!a.ativo) return;
    const dx = e.clientX - a.x, dy = e.clientY - a.y; a.x = e.clientX; a.y = e.clientY;
    a.vy = dx * 0.008; a.vx = dy * 0.008; a.ry += a.vy; a.rx += a.vx;
  };
  private largar = () => { this.arrasto.ativo = false; this.o.canvas.classList.remove('is-arrastar'); };

  /* ---------- as partículas ---------- */
  private static N = 7000;
  private prepararAmostras(): void {
    const v = new Vector3();
    const tirar = (malha: Mesh, n: number) => { const s = new MeshSurfaceSampler(malha).build(); const a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { s.sample(v); a.set([v.x, v.y, v.z], i * 3); } return a; };
    const n = Cena.N;
    this.amostras.push({ malha: this.ext, locais: tirar(this.ext, Math.round(n * 0.38)) });
    this.amostras.push({ malha: this.int, locais: tirar(this.int, Math.round(n * 0.24)) });
    const bola = new Mesh(this.esferas.geometry);
    for (let i = 0; i < N_ESFERAS; i++) this.amostras.push({ malha: this.esferas, inst: i, locais: tirar(bola, Math.round((n * 0.32) / N_ESFERAS)) });
    const g0 = this.gaiola.children[0] as Mesh, g1 = this.gaiola.children[1] as Mesh;
    this.amostras.push({ malha: g0, locais: tirar(g0, Math.round(n * 0.03)) }, { malha: g1, locais: tirar(g1, Math.round(n * 0.03)) });
  }

  /** O ROMAFE: os píxeis da palavra na letra Motor, no sítio exato do logótipo HTML, levados ao plano
   *  z = 0 com a câmara da posição final. */
  private alvosDoLogotipo(n: number): Float32Array {
    const el = this.o.logotipo;
    const cv = this.o.canvas.getBoundingClientRect(), r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    const tela = document.createElement('canvas'); tela.width = w; tela.height = h;
    const ctx = tela.getContext('2d')!;
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
    ctx.fillText(el.textContent || 'ROMAFE', w / 2, h / 2 + parseFloat(cs.fontSize) * 0.04, w);
    const px = ctx.getImageData(0, 0, w, h).data, cheios: number[] = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 128) cheios.push(x, y);
    const out = new Float32Array(n * 3), v = new Vector3(), dir = new Vector3();
    const cam = this.cam.clone(); cam.position.set(0, 0, this.zBase * 0.86); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    for (let i = 0; i < n; i++) {
      const k = cheios.length ? (Math.floor(Math.random() * (cheios.length / 2)) * 2) : 0;
      const sx = r.left - cv.left + (cheios[k] ?? w / 2) + Math.random() - 0.5, sy = r.top - cv.top + (cheios[k + 1] ?? h / 2) + Math.random() - 0.5;
      v.set((sx / cv.width) * 2 - 1, -(sy / cv.height) * 2 + 1, 0.5).unproject(cam);
      dir.copy(v).sub(cam.position).normalize();
      const d = -cam.position.z / dir.z;
      out.set([cam.position.x + dir.x * d, cam.position.y + dir.y * d, 0], i * 3);
    }
    return out;
  }

  private criarParticulas(): void {
    const n = Cena.N, origem = new Float32Array(n * 3), m = new Matrix4(), v = new Vector3();
    let i = 0;
    this.rol.updateMatrixWorld(true);
    for (const a of this.amostras) {
      if (a.inst !== undefined) { this.esferas.getMatrixAt(a.inst, m); m.premultiply(this.esferas.matrixWorld); } else m.copy(a.malha.matrixWorld);
      for (let j = 0; j < a.locais.length && i < n; j += 3, i++) { v.set(a.locais[j], a.locais[j + 1], a.locais[j + 2]).applyMatrix4(m); origem.set([v.x, v.y, v.z], i * 3); }
    }
    for (; i < n; i++) origem.set(origem.subarray(0, 3), i * 3);
    this.origem = origem;
    this.destino = this.alvosDoLogotipo(n);
    this.desvio = new Float32Array(n * 3); this.atraso = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const ox = origem[k * 3], oy = origem[k * 3 + 1];
      this.desvio.set([ox * 0.45 + (Math.random() - 0.5) * 0.35, oy * 0.45 + (Math.random() - 0.5) * 0.35, (Math.random() - 0.3) * 0.8], k * 3);
      this.atraso[k] = Math.random() * 0.5 + Math.hypot(ox, oy) * 0.15;
    }
    const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(origem.slice(), 3));
    const c = this.o.cores();
    const mat = new ShaderMaterial({
      transparent: true, depthWrite: false, blending: NormalBlending,
      uniforms: { uTam: { value: 2.6 * Math.min(devicePixelRatio, 2) }, uCorA: { value: new Color(c.aco) }, uCorB: { value: new Color(c.marca) }, uMix: { value: 0 }, uOpac: { value: 0 } },
      vertexShader: 'uniform float uTam;void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=uTam;}',
      fragmentShader: 'uniform vec3 uCorA;uniform vec3 uCorB;uniform float uMix;uniform float uOpac;void main(){vec2 c=gl_PointCoord-.5;if(dot(c,c)>.25)discard;gl_FragColor=vec4(mix(uCorA,uCorB,uMix),uOpac);}',
    });
    this.pontos = new Points(g, mat); this.pontos.frustumCulled = false;
    this.cena.add(this.pontos);
  }

  /* ---------- um frame ---------- */
  private frame = (agora: number) => {
    if (!this.vivo) return;
    this.ciclo = requestAnimationFrame(this.frame);
    const t = (this.t = this.o.pausa ?? (agora - this.t0) / 1000);
    const f = (a: number, b: number) => curva(lim((t - a) / (b - a)));

    const a = this.arrasto;
    if (!a.ativo) { a.vx *= 0.94; a.vy *= 0.94; a.rx += a.vx; a.ry += a.vy; a.rx *= 0.985; }
    this.ratoSuave.lerp(this.rato, 0.05);
    const solto = 1 - f(T.particulas - 0.3, T.particulas + 0.2);

    /* a câmara: aproxima-se no início, recua para a vista explodida, avança para o logótipo */
    const z = this.zBase * mix(mix(mix(1.3, 1, f(0, 1.1)), 1.1, f(T.explodir, T.cotas)), 0.86, f(T.juntar, T.logotipo));
    this.cam.position.set(this.ratoSuave.x * 0.35 * solto, this.ratoSuave.y * 0.22 * solto, z);
    this.cam.lookAt(0, 0, 0);

    const ex = f(T.explodir, T.explodir + 0.6) * (1 - f(T.juntar, T.particulas));
    const frente = f(T.juntar, T.particulas);
    this.rol.rotation.set(mix(mix(-0.55, -0.35, ex), 0, frente) + a.rx, mix(mix(0.5 + t * 0.25, 1.05, ex), 0, frente) + a.ry, t * 0.05);
    this.rol.position.y = Math.sin(t * 1.4) * 0.04 * (1 - frente);

    /* as peças, de fora para dentro */
    const mExt = f(T.montar, T.montar + 0.6);
    this.ext.scale.setScalar(mix(0.001, 1, mExt)); this.ext.position.z = mix(-2.5, 0, mExt) - 0.95 * ex;
    const mInt = f(T.montar + 0.8, T.montar + 1.35);
    this.int.scale.setScalar(mix(0.001, 1, mInt)); this.int.position.z = mix(2.5, 0, mInt) + 1.05 * ex;
    const mGai = f(T.montar + 1.0, T.montar + 1.5);
    this.gaiola.children.forEach((g, i) => { g.position.z = (i ? 1 : -1) * mix(0.9, 0.1, mGai) + 0.5 * ex; });
    this.gaiola.scale.setScalar(mix(0.001, 1, mGai));
    /* depois do óleo as esferas rodam mais soltas: o ângulo ganha velocidade a partir da gota */
    const lubrificado = Math.max(0, t - T.cai) * 0.9 * f(T.cai, T.cai + 0.8);
    for (let i = 0; i < N_ESFERAS; i++) {
      const ang = (i / N_ESFERAS) * Math.PI * 2 + t * 0.6 + lubrificado;
      const k = i === 0 ? f(T.montar - 0.1, T.montar + 0.5) : f(T.montar + 0.1 + i * 0.07, T.montar + 0.6 + i * 0.07);
      const raio = mix(i === 0 ? 0 : 2.4, R.primitivo, k) + 0.28 * ex;
      const escala = i === 0 ? mix(0.55, 1, k) : mix(0.001, 1, k);
      this.aux.position.set(Math.cos(ang) * raio, Math.sin(ang) * raio, mix(i === 0 ? 0 : 1.6, 0, k) + 0.25 * ex);
      if (i === 0) this.aux.position.y += Math.sin(t * 2) * 0.05 * (1 - k);
      this.aux.rotation.set(t * 1.3, t * 0.9, 0);
      this.aux.scale.setScalar(escala); this.aux.updateMatrix();
      this.esferas.setMatrixAt(i, this.aux.matrix);
    }
    this.esferas.instanceMatrix.needsUpdate = true;

    /* a gota: forma-se em cima, cai em aceleração até ao rolamento e entra nele; a película acende-se
       na pista e apaga-se até à vista explodida */
    const queda = lim((t - T.oleo) / (T.cai - T.oleo));
    this.gota.visible = t > T.oleo - 0.25 && t < T.cai + 0.12;
    if (this.gota.visible) {
      const nasce = f(T.oleo - 0.25, T.oleo);
      const entra = 1 - f(T.cai - 0.02, T.cai + 0.12);
      this.gota.position.set(0.05, mix(1.75, 0.35, queda * queda), 0.5);
      this.gota.scale.set(nasce * entra * (1 - queda * 0.12), nasce * entra * (1 + queda * 0.25), nasce * entra);
    }
    const pel = this.pelicula.material as MeshPhysicalMaterial;
    pel.opacity = 0.55 * f(T.cai, T.cai + 0.18) * (1 - f(T.cai + 0.3, T.explodir + 0.2));
    this.pelicula.visible = pel.opacity > 0.005;
    this.pelicula.scale.setScalar(mix(0.85, 1, f(T.cai, T.cai + 0.35)));

    /* as partículas: nascem nas peças, voam numa curva e assentam na forma do ROMAFE */
    if (t >= T.particulas && !this.pontos) this.criarParticulas();
    if (this.pontos) {
      const mat = this.pontos.material as ShaderMaterial;
      const pos = this.pontos.geometry.getAttribute('position') as BufferAttribute, arr = pos.array as Float32Array;
      for (let k = 0; k < Cena.N; k++) {
        const kk = curva(lim((t - T.particulas - 0.15 - this.atraso[k] * 0.6) / 0.85));
        const arco = Math.sin(kk * Math.PI);
        for (let c = 0; c < 3; c++) arr[k * 3 + c] = mix(this.origem[k * 3 + c], this.destino[k * 3 + c], kk) + this.desvio[k * 3 + c] * arco;
      }
      pos.needsUpdate = true;
      mat.uniforms.uMix.value = f(T.logotipo - 0.6, T.logotipo - 0.1);
      mat.uniforms.uOpac.value = f(T.particulas, T.particulas + 0.2) * (1 - f(T.logotipo + 0.15, T.logotipo + 0.55));
      const pecas = t < T.particulas + 0.18;
      [this.ext, this.int, this.esferas, this.gaiola].forEach((m) => { m.visible = pecas; });
    }

    this.cotas(t, ex);
    this.r.render(this.cena, this.cam);

    if (t >= T.fim && !this.marcadoFim && this.o.pausa === undefined) { this.marcadoFim = true; this.aoFim(); }
  };

  /** As cotas da vista explodida (aqui, os dados do artigo): cada âncora projetada no ecrã, ligada ao rótulo. */
  private cotas(t: number, ex: number): void {
    const vis = t > T.cotas && t < T.juntar + 0.1;
    const cv = this.o.canvas.getBoundingClientRect();
    const v = new Vector3(), m = new Matrix4();
    this.rol.updateMatrixWorld(true);
    const proj = (p: Vector3) => { p.project(this.cam); return [(p.x + 1) / 2 * cv.width, (1 - p.y) / 2 * cv.height]; };
    const ancora: Record<string, () => Vector3> = {
      ext: () => v.set(R.ext * 0.72, R.ext * 0.72, 0).applyMatrix4(this.ext.matrixWorld),
      int: () => v.set(-R.furo, -R.furo * 0.2, 0).applyMatrix4(this.int.matrixWorld),
      esf: () => { this.esferas.getMatrixAt(2, m); m.premultiply(this.esferas.matrixWorld); return v.set(0, 0, 0).applyMatrix4(m); },
      gai: () => v.set(-R.primitivo * 0.7, R.primitivo * 0.7, 0).applyMatrix4((this.gaiola.children[1] as Mesh).matrixWorld),
      lar: () => v.set(0, -R.ext, R.meia).applyMatrix4(this.ext.matrixWorld),
    };
    const [cx, cy] = proj(v.set(0, 0, 0).applyMatrix4(this.rol.matrixWorld));
    const raio = Math.min(cv.width, cv.height) * 0.36;
    const desvio: Record<string, number> = { ext: -0.35, int: 0.5, esf: 0.15, gai: -0.15, lar: 0 };
    this.o.cotas.forEach(({ linha, ponto, rotulo }, k) => {
      const [x, y] = proj(ancora[k]());
      const ang = Math.atan2(y - cy, x - cx) + desvio[k];
      const esq = cx + Math.cos(ang) * raio < cx, larg = rotulo.offsetWidth || 0;
      /* o rótulo inteiro fica dentro do ecrã (no telemóvel, o raio leva-o para fora) */
      const lx = esq ? Math.max(16 + larg, Math.min(cv.width - 16, cx + Math.cos(ang) * raio)) : Math.max(16, Math.min(cv.width - 16 - larg, cx + Math.cos(ang) * raio));
      const ly = Math.max(70, Math.min(cv.height - 70, cy + Math.sin(ang) * raio));
      linha.setAttribute('x1', x.toFixed(1)); linha.setAttribute('y1', y.toFixed(1)); linha.setAttribute('x2', lx.toFixed(1)); linha.setAttribute('y2', ly.toFixed(1));
      ponto.setAttribute('cx', x.toFixed(1)); ponto.setAttribute('cy', y.toFixed(1));
      rotulo.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px) translate(${esq ? '-100%' : '0'}, -50%)`;
      rotulo.classList.toggle('is-esq', esq);
    });
    this.o.canvas.parentElement!.classList.toggle('is-cotas', vis && ex > 0.5);
  }

  /** Larga tudo: o ciclo, os ouvintes, as geometrias, os materiais e o contexto WebGL. */
  destruir(): void {
    this.vivo = false; cancelAnimationFrame(this.ciclo); this.ciclo = 0;
    this.o.canvas.removeEventListener('pointerdown', this.premir);
    window.removeEventListener('pointermove', this.mover); window.removeEventListener('pointerup', this.largar);
    this.ro.disconnect();
    this.cena.traverse((o) => { const m = o as Mesh; m.geometry?.dispose(); const mt = m.material as MeshPhysicalMaterial | MeshPhysicalMaterial[] | undefined; (Array.isArray(mt) ? mt : mt ? [mt] : []).forEach((x) => x.dispose()); });
    this.cena.environment?.dispose();
    this.r.dispose(); this.r.forceContextLoss();
  }
}
