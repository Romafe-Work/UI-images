/* =========================================================
   ERP — a rede da empresa: a cena 3D dos ecrãs de entrar da v10 (19 out. 2026)
   Do briefing dela («Everything connected. Everything under control.»): peças da Romafe (rolamentos,
   chumaceira, correia, carreto, retentor, corrente — rede-pecas.ts) ligadas por linhas finas, à volta do cartão. Uma só cena e um só canvas para os
   quatro ecrãs (comportamento/rede.ts muda-o de ecrã sem perder o contexto); cada ecrã só muda os ALVOS,
   e os valores seguem-nos com uma mola amortecida — de um ecrã para o outro nada recomeça.

     neutro   — os nós espalhados em profundidade, a rede a rodar devagar, um impulso de vez em quando;
     foco     — campo do correio em foco: os nós mais perto do cartão arrumam-se e as linhas alinham;
     valido   — o correio está bem escrito: uma ligação laranja fecha-se até ao centro (o único laranja);
     pedido   — à espera da resposta: a rede aperta-se e abranda;
     passe    — o passo da palavra-passe: a mesma rede, rodada um pouco (configuração seguinte);
     alinhar  — a resposta foi «entrou»: os nós alinham-se num anel de frente, o nó central vem à frente
                e todas as ligações chegam a ele; depois a rede apaga-se (rede.ts abre o ERP).

   Entrada: os nós aparecem um a um (60 ms entre eles), as ligações desenham-se a seguir (≈ 1,2 s); o
   cartão não espera por isto. O rato desloca a câmara no máximo ±0,35 (paralaxe, três profundidades).
   Ecrã tátil ou estreito: menos nós, sem nós secundários e sem paralaxe. O canvas é transparente: o fundo
   é o da página (tema claro ou escuro), e as cores das linhas vêm dos tokens --rede-* do CSS.
   Tempos (do briefing): alinhar a rede 400–650 ms; a passagem ao ERP 500–800 ms.
   ========================================================= */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, LineSegments, BufferGeometry, BufferAttribute,
  MeshBasicMaterial, LineBasicMaterial, PointsMaterial, Points, Color, Vector3, Vector2,
} from 'three';
import { PECAS, rolamento, esfera, type Peca } from './rede-pecas';

export type Fase = 'neutro' | 'foco' | 'valido' | 'pedido' | 'passe' | 'alinhar';

/* um número pseudo-aleatório fixo: a composição é sempre a mesma */
function semente(n: number): () => number { let s = n; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

interface No {
  g: Group; peca: Peca; tam: number; inclina: Vector2;
  solto: Vector3;          // onde fica na composição espalhada
  anel: Vector3;           // onde fica na composição arrumada
  alinhado: Vector3;       // onde fica quando a rede se alinha (anel de frente)
  prof: number;            // 0 perto … 1 longe (paralaxe)
  fase: number; dominio: boolean; atraso: number;
}
interface Lig { a: number; b: number; atraso: number; geo: BufferGeometry; linha: LineSegments; central: boolean }
interface Impulso { lig: number; t: number; dur: number; sentido: 1 | -1 }

interface Alvos { org: number; aperto: number; rodar: number; vel: number; centro: number; valido: number; alinhar: number; perto: number }
const ALVOS: Record<Fase, Alvos> = {
  neutro:  { org: 0,    aperto: 1,    rodar: 0,    vel: 1,    centro: 0,   valido: 0, alinhar: 0, perto: 0 },
  foco:    { org: 0.55, aperto: 1,    rodar: 0,    vel: 0.6,  centro: 0,   valido: 0, alinhar: 0, perto: 0 },
  valido:  { org: 0.7,  aperto: 1,    rodar: 0,    vel: 0.55, centro: 0.2, valido: 1, alinhar: 0, perto: 0 },
  pedido:  { org: 1,    aperto: 0.86, rodar: 0,    vel: 0.25, centro: 0.4, valido: 1, alinhar: 0, perto: 0.15 },
  passe:   { org: 0.8,  aperto: 0.94, rodar: 0.5, vel: 0.5,  centro: 0.2, valido: 0, alinhar: 0, perto: 0 },
  alinhar: { org: 1,    aperto: 0.9,  rodar: 0.5, vel: 0.15, centro: 1,   valido: 1, alinhar: 1, perto: 0.35 },
};
/* a rapidez (1/s) com que cada valor segue o alvo: ≈ 0,5 s para alinhar */
/* (a v10 nasceu com sólidos geométricos; a 19 out. ela pediu «mais rolamentos… coisa da Romafe»: rede-pecas.ts) */
const RAPIDEZ: Alvos = { org: 5, aperto: 5, rodar: 3, vel: 3, centro: 6, valido: 7, alinhar: 6.5, perto: 4 };

export class CenaRede {
  private r: WebGLRenderer;
  private cena = new Scene();
  private cam = new PerspectiveCamera(34, 1, 0.1, 100);
  private mundo = new Group();
  private nos: No[] = [];
  private ligs: Lig[] = [];
  private centro: Group;
  private centroPeca: Peca;
  private impulsos: Impulso[] = [];
  private pontos: Points;
  private v: Alvos = { ...ALVOS.neutro };
  private alvo: Alvos = { ...ALVOS.neutro };
  private fase: Fase = 'neutro';
  private t = 0; private ultimo = 0; private ciclo = 0; private ativo = false;
  private entrada = 0; private proximoImpulso = 1.6; private apagar = 0; private apagando = false;
  private rato = new Vector2(); private ratoSuave = new Vector2();
  private ro: ResizeObserver;
  private leve: boolean;
  /* num ecrã ao alto, o anel estreita-se e cresce na vertical, para a rede ficar à volta do cartão */
  private escala = new Vector2(1, 1);
  private mat = {
    corpo: new MeshBasicMaterial({ transparent: true, opacity: 1, depthWrite: true }),
    aresta: new LineBasicMaterial({ transparent: true }),
    arestaLonge: new LineBasicMaterial({ transparent: true }),
    lig: new LineBasicMaterial({ transparent: true }),
    ligCentral: new LineBasicMaterial({ transparent: true }),
    laranja: new LineBasicMaterial({ transparent: true }),
    pulso: new PointsMaterial({ size: 5, sizeAttenuation: false, transparent: true, depthWrite: false }),
  };
  private ligValida: Lig | null = null;

  constructor(readonly canvas: HTMLCanvasElement, private cores: () => Record<string, string>) {
    this.r = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    this.r.setClearColor(0x000000, 0);
    this.leve = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;
    this.r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.leve ? 1.5 : 2));
    this.cena.add(this.mundo);
    this.cam.position.set(0, 0, 15);

    const rnd = semente(1945);
    const pecas = this.leve ? PECAS.slice(0, 6) : PECAS;
    const n = pecas.length;
    const m = { linha: this.mat.aresta, fundo: this.mat.corpo };
    /* as peças da Romafe num anel largo à volta do centro, onde o cartão fica; o centro fica livre */
    pecas.forEach((d, i) => {
      const a = (i / n) * Math.PI * 2 + 0.35;
      const anel = new Vector3(Math.cos(a) * 6.6, Math.sin(a) * 3.7, 0);
      const solto = new Vector3(anel.x * (0.95 + rnd() * 0.3) + (rnd() - 0.5) * 1.6, anel.y * (0.9 + rnd() * 0.35) + (rnd() - 0.5) * 1.2, (rnd() - 0.5) * 5);
      const alinhado = new Vector3(Math.cos(a) * 5.4, Math.sin(a) * 3.2, 0);
      this.nos.push(this.criarNo(d.criar(m), 1.3, solto, anel, alinhado, true, i * 0.06, rnd));
    });
    /* nós secundários: esferas soltas, mais longe; dão estrutura à rede */
    if (!this.leve) {
      for (let i = 0; i < 10; i++) {
        const a = rnd() * Math.PI * 2, raio = 7.4 + rnd() * 2.6;
        const anel = new Vector3(Math.cos(a) * raio, Math.sin(a) * raio * 0.55, -2 - rnd() * 2);
        const solto = anel.clone().add(new Vector3((rnd() - 0.5) * 2, (rnd() - 0.5) * 1.4, (rnd() - 0.5) * 3));
        this.nos.push(this.criarNo(esfera({ linha: this.mat.arestaLonge, fundo: this.mat.corpo }), 1.2, solto, anel, anel.clone().multiplyScalar(0.92), false, 0.5 + i * 0.04, rnd));
      }
    }
    /* o nó central: um rolamento maior, a peça que deu origem à Romafe; fica atrás do cartão até ao «alinhar» */
    this.centroPeca = rolamento(m, 0.75);
    this.centro = new Group();
    this.centro.add(this.centroPeca.g);
    this.centro.position.set(0, 0, -1.5); this.centro.scale.setScalar(0.001);
    this.mundo.add(this.centro);

    /* as ligações: cada domínio ao vizinho (o anel), três cordas, os secundários ao domínio mais perto,
       e cada domínio ao centro (só se veem no «alinhar») */
    const lig = (a: number, b: number, atraso: number, central = false) => {
      const geo = new BufferGeometry(); geo.setAttribute('position', new BufferAttribute(new Float32Array(6), 3));
      const linha = new LineSegments(geo, central ? this.mat.ligCentral : this.mat.lig);
      linha.frustumCulled = false;
      this.mundo.add(linha); this.ligs.push({ a, b, atraso, geo, linha, central });
      return this.ligs[this.ligs.length - 1];
    };
    for (let i = 0; i < n; i++) lig(i, (i + 1) % n, 0.5 + i * 0.07);
    [[0, 3], [1, 5], [2, 6]].forEach(([a, b], k) => { if (a < n && b < n) lig(a, b, 0.9 + k * 0.1); });
    for (let i = n; i < this.nos.length; i++) {
      let melhor = 0, d = Infinity;
      for (let j = 0; j < n; j++) { const dd = this.nos[i].anel.distanceTo(this.nos[j].anel); if (dd < d) { d = dd; melhor = j; } }
      lig(i, melhor, 0.8 + (i - n) * 0.05);
    }
    for (let i = 0; i < n; i++) lig(i, -1, 0, true);
    /* a ligação que se fecha quando o correio está bem escrito: do domínio mais perto do campo ao centro */
    this.ligValida = lig(this.leve ? 3 : 4, -1, 0, true);
    this.ligValida.linha.material = this.mat.laranja;

    const pg = new BufferGeometry(); pg.setAttribute('position', new BufferAttribute(new Float32Array(3 * 6), 3));
    pg.setDrawRange(0, 0);
    this.pontos = new Points(pg, this.mat.pulso); this.pontos.frustumCulled = false;
    this.mundo.add(this.pontos);

    this.pintar();
    this.ro = new ResizeObserver(() => this.medir());
    this.ro.observe(canvas);
  }

  private criarNo(peca: Peca, tam: number, solto: Vector3, anel: Vector3, alinhado: Vector3, dominio: boolean, atraso: number, rnd: () => number): No {
    const g = peca.g;
    /* de frente para a câmara, inclinadas no máximo ±35°, para se ler a peça */
    const inclina = new Vector2((rnd() - 0.5) * (g.userData.direita ? 0.5 : 1.1), (rnd() - 0.5) * 1.2);
    g.rotation.set(inclina.x, inclina.y, g.userData.direita ? (rnd() - 0.5) * 0.3 : rnd() * Math.PI);
    g.scale.setScalar(0.001);
    this.mundo.add(g);
    return { g, peca, tam, inclina, solto, anel, alinhado, prof: Math.min(1, Math.max(0, (-solto.z + 2.5) / 5)), fase: rnd() * Math.PI * 2, dominio, atraso };
  }

  /** As cores vêm do CSS (--rede-*), e mudam com o tema. */
  pintar(): void {
    const c = this.cores();
    this.mat.corpo.color = new Color(c.no);
    this.mat.aresta.color = new Color(c.aresta); this.mat.aresta.opacity = 0.8;
    this.mat.arestaLonge.color = new Color(c.linha); this.mat.arestaLonge.opacity = 0.8;
    this.mat.lig.color = new Color(c.linha); this.mat.lig.opacity = 0.9;
    this.mat.ligCentral.color = new Color(c.aresta); this.mat.ligCentral.opacity = 0;
    this.mat.laranja.color = new Color(c.laranja); this.mat.laranja.opacity = 0;
    this.mat.pulso.color = new Color(c.pulso);
  }

  medir(): void {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.r.setSize(w, h, false);
    this.cam.aspect = w / h;
    const r = w / h;
    this.escala.set(r < 1 ? Math.max(0.4, r * 0.85) : 1, r < 1 ? 1.45 : 1);
    this.cam.updateProjectionMatrix();
  }

  irPara(f: Fase): void {
    this.fase = f; this.alvo = { ...ALVOS[f] };
    if (f === 'alinhar') { this.apagando = false; this.apagar = 0; }
  }
  get faseAtual(): Fase { return this.fase; }
  /** Depois do «alinhar»: a rede apaga-se (≈ 0,45 s); o ERP aparece por baixo. */
  apagarRede(): void { this.apagando = true; }
  /** Volta ao princípio (ao regressar ao 01 depois de ter entrado no ERP). */
  repor(): void { this.apagando = false; this.apagar = 0; this.entrada = 0; this.irPara('neutro'); this.v = { ...ALVOS.neutro }; }

  ponteiro(x: number, y: number): void { if (!this.leve) this.rato.set(x, y); }

  ligar(): void {
    if (this.ativo) return;
    this.ativo = true; this.ultimo = performance.now();
    const passo = (agora: number) => {
      if (!this.ativo) return;
      const dt = Math.min(0.05, (agora - this.ultimo) / 1000); this.ultimo = agora;
      this.atualizar(dt); this.r.render(this.cena, this.cam);
      this.ciclo = requestAnimationFrame(passo);
    };
    this.ciclo = requestAnimationFrame(passo);
  }
  parar(): void { this.ativo = false; cancelAnimationFrame(this.ciclo); }

  private atualizar(dt: number): void {
    const k = (r: number) => 1 - Math.exp(-r * dt);
    (Object.keys(this.v) as (keyof Alvos)[]).forEach((c) => { this.v[c] += (this.alvo[c] - this.v[c]) * k(RAPIDEZ[c]); });
    this.t += dt * this.v.vel; this.entrada += dt;
    if (this.apagando) this.apagar = Math.min(1, this.apagar + dt / 0.45);
    const vida = 1 - this.apagar;

    /* a câmara: paralaxe pequena, com inércia; aproxima-se um pouco no pedido e no alinhar */
    this.ratoSuave.lerp(this.rato, k(3));
    this.cam.position.x = this.ratoSuave.x * 0.35;
    this.cam.position.y = -this.ratoSuave.y * 0.22;
    this.cam.lookAt(0, 0, 0);
    this.mundo.rotation.y = Math.sin(this.t * 0.11) * 0.16 * (1 - this.v.alinhar) + this.v.rodar * 0.12;
    this.mundo.rotation.x = Math.sin(this.t * 0.07) * 0.05 * (1 - this.v.alinhar);
    this.mundo.position.z = this.v.perto * 1.6;

    const p = new Vector3();
    this.nos.forEach((no, i) => {
      const nasce = Math.min(1, Math.max(0, (this.entrada - no.atraso) / 0.5));
      const e = 1 - Math.pow(1 - nasce, 3);
      p.copy(no.solto).lerp(no.anel, this.v.org).multiplyScalar(this.v.aperto);
      p.lerp(no.alinhado, this.v.alinhar);
      p.x *= this.escala.x; p.y *= this.escala.y;
      /* a deriva lenta, que o arrumar e o alinhar acalmam */
      const calma = 1 - Math.max(this.v.org * 0.6, this.v.alinhar);
      p.x += Math.sin(this.t * 0.5 + no.fase) * 0.22 * calma;
      p.y += Math.cos(this.t * 0.43 + no.fase) * 0.16 * calma;
      /* paralaxe por profundidade: os de trás mexem menos */
      p.x -= this.ratoSuave.x * (1 - no.prof) * 0.25;
      no.g.position.copy(p);
      /* a peça balança devagar à volta da sua inclinação; as esferas, os rolos e as polias rodam */
      no.g.rotation.x = no.inclina.x * (1 - this.v.alinhar) + Math.sin(this.t * 0.3 + no.fase) * 0.2 * calma;
      no.g.rotation.y = no.inclina.y * (1 - this.v.alinhar) + Math.cos(this.t * 0.26 + no.fase) * 0.24 * calma;
      const giro = dt * no.peca.vel * (0.35 + this.v.vel * 0.65) * (i % 2 ? -1 : 1);
      no.peca.gira.rotation.z += giro;
      const outra = no.g.userData.outra as Group | undefined; if (outra) outra.rotation.z += giro * outra.userData.razao;
      no.g.scale.setScalar(Math.max(0.001, e * vida * no.tam));
    });

    /* o nó central aparece no alinhar e vem à frente */
    const c = this.v.centro;
    this.centro.scale.setScalar(Math.max(0.001, (0.15 + c * 0.85) * Math.min(1, c * 3) * vida));
    this.centro.position.z = -1.5 + this.v.alinhar * 1.5;
    this.centroPeca.gira.rotation.z += dt * 1.2;
    this.mat.ligCentral.opacity = Math.min(1, this.v.alinhar) * 0.9 * vida;

    /* as ligações desenham-se de a para b; as centrais só existem no alinhar; a laranja no «valido» */
    const pa = new Vector3(), pb = new Vector3();
    this.ligs.forEach((l) => {
      const a = this.nos[l.a].g.position;
      pa.copy(a); pb.copy(l.b < 0 ? this.centro.position : this.nos[l.b].g.position);
      let prog: number;
      if (l === this.ligValida) prog = this.v.valido;
      else if (l.central) prog = this.v.alinhar;
      else prog = Math.min(1, Math.max(0, (this.entrada - l.atraso) / 0.7));
      prog = 1 - Math.pow(1 - prog, 3);
      pb.lerp(pa, 1 - prog);
      const arr = l.geo.attributes.position.array as Float32Array;
      arr[0] = pa.x; arr[1] = pa.y; arr[2] = pa.z; arr[3] = pb.x; arr[4] = pb.y; arr[5] = pb.z;
      l.geo.attributes.position.needsUpdate = true;
    });
    this.mat.laranja.opacity = Math.min(1, this.v.valido) * (1 - this.v.alinhar * 0.6) * vida;
    this.mat.lig.opacity = 0.9 * vida; this.mat.aresta.opacity = 0.8 * vida; this.mat.arestaLonge.opacity = 0.8 * vida;
    this.mat.corpo.opacity = vida;

    /* os impulsos: um ponto curto a percorrer uma ligação, de 2 a 4 s; mais seguidos no pedido */
    this.proximoImpulso -= dt;
    const normais = this.ligs.filter((l) => !l.central);
    if (this.proximoImpulso <= 0 && this.entrada > 2 && this.impulsos.length < 4 && !this.apagando) {
      this.impulsos.push({ lig: this.ligs.indexOf(normais[Math.floor(Math.random() * normais.length)]), t: 0, dur: 1.1 + Math.random() * 0.5, sentido: Math.random() < 0.5 ? 1 : -1 });
      this.proximoImpulso = this.fase === 'pedido' ? 0.45 : 2 + Math.random() * 2;
    }
    const arr = this.pontos.geometry.attributes.position.array as Float32Array;
    let n = 0;
    this.impulsos = this.impulsos.filter((im) => {
      im.t += dt / im.dur;
      if (im.t >= 1) return false;
      const l = this.ligs[im.lig];
      const pos = l.geo.attributes.position.array as Float32Array;
      const s = im.sentido > 0 ? im.t : 1 - im.t;
      arr[n * 3] = pos[0] + (pos[3] - pos[0]) * s; arr[n * 3 + 1] = pos[1] + (pos[4] - pos[1]) * s; arr[n * 3 + 2] = pos[2] + (pos[5] - pos[2]) * s;
      n++;
      return n < 6;
    });
    this.pontos.geometry.setDrawRange(0, n);
    this.pontos.geometry.attributes.position.needsUpdate = true;
    this.mat.pulso.opacity = 0.85 * vida;
  }

  destruir(): void { this.parar(); this.ro.disconnect(); this.r.dispose(); }
}
