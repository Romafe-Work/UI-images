/* =========================================================
   ERP — as peças da rede (19 out. 2026)
   Ela, ao ver a v10: «não quero cubos, quero mais rolamentos… coisa da Romafe». Os nós da rede passam a
   ser peças que a Romafe vende, desenhadas a traço fino (o mesmo traço das ligações), com um disco liso
   por trás para as linhas de trás não se cruzarem com a peça:
     rolamento rígido de esferas · rolamento de rolos cónicos · rolamento axial · chumaceira ·
     correia com polias · carreto · retentor · corrente
   Cada peça tem um grupo `gira` (as esferas, os rolos, a polia, o carreto) que roda à volta do eixo
   dela; o resto fica parado. As medidas são de desenho (raio exterior ≈ 0,5), não cotas de catálogo.
   ========================================================= */
import { Group, Line, LineLoop, LineSegments, BufferGeometry, Float32BufferAttribute, Mesh, CircleGeometry, ShapeGeometry, Shape, type Material } from 'three';

export interface Peca { g: Group; gira: Group; vel: number }
export interface Materiais { linha: Material; fundo: Material }

const SEG = 56;
function circulo(r: number, z = 0, cx = 0, cy = 0, seg = SEG): number[] {
  const p: number[] = [];
  for (let i = 0; i < seg; i++) { const a = (i / seg) * Math.PI * 2; p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z); }
  return p;
}
const geo = (p: number[]) => { const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(p, 3)); return g; };
const laco = (p: number[], m: Material) => new LineLoop(geo(p), m);
const linha = (p: number[], m: Material) => new Line(geo(p), m);
const segs = (p: number[], m: Material) => new LineSegments(geo(p), m);
/* as arestas que ligam a face da frente à de trás, em n pontos de um círculo */
function geratrizes(r1: number, z1: number, r2: number, z2: number, n: number, a0 = 0): number[] {
  const p: number[] = [];
  for (let i = 0; i < n; i++) { const a = a0 + (i / n) * Math.PI * 2; p.push(Math.cos(a) * r1, Math.sin(a) * r1, z1, Math.cos(a) * r2, Math.sin(a) * r2, z2); }
  return p;
}
function disco(r: number, m: Material, z = 0, r0 = 0): Mesh {
  const d = new Mesh(r0 ? anel(r, r0) : new CircleGeometry(r, SEG), m); d.position.z = z; d.renderOrder = -1; return d;
}
function anel(r: number, r0: number): ShapeGeometry {
  const s = new Shape(); s.absarc(0, 0, r, 0, Math.PI * 2, false);
  const h = new Shape(); h.absarc(0, 0, r0, 0, Math.PI * 2, true); s.holes.push(h);
  return new ShapeGeometry(s, SEG);
}
const novo = (vel: number, direita = false) => { const g = new Group(), gira = new Group(); g.add(gira); g.userData.direita = direita; return { g, gira, vel }; };
/* `direita`: a peça tem um lado de baixo (a chumaceira assenta na base) e não roda no plano */

/** Rolamento rígido de esferas: anel exterior e interior com espessura, 9 esferas a rodar. */
export function rolamento(m: Materiais, R = 0.5): Peca {
  const p = novo(0.9), e = 0.12 * R / 0.5, ri = R * 0.46, rb = R * 0.14, rc = (R * 0.8 + ri * 1.15) / 2;
  p.g.add(disco(R, m.fundo, 0, ri * 0.82));
  [e, -e].forEach((z) => { p.g.add(laco(circulo(R, z), m.linha), laco(circulo(R * 0.8, z), m.linha), laco(circulo(ri * 1.15, z), m.linha), laco(circulo(ri * 0.82, z), m.linha)); });
  p.g.add(segs(geratrizes(R, e, R, -e, 12), m.linha));
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; p.gira.add(laco(circulo(rb, 0.001, Math.cos(a) * rc, Math.sin(a) * rc, 20), m.linha)); }
  return p;
}

/** Rolamento de rolos cónicos: a taça e o cone, e os rolos inclinados entre eles. */
export function rolos(m: Materiais): Peca {
  const p = novo(0.7);
  p.g.add(disco(0.5, m.fundo, 0, 0.2));
  p.g.add(laco(circulo(0.5, -0.15), m.linha), laco(circulo(0.42, 0.15), m.linha), laco(circulo(0.24, -0.15), m.linha), laco(circulo(0.2, 0.15), m.linha));
  p.g.add(segs(geratrizes(0.5, -0.15, 0.42, 0.15, 10), m.linha));
  p.gira.add(segs(geratrizes(0.4, -0.12, 0.3, 0.12, 14, 0.1), m.linha));
  p.gira.add(laco(circulo(0.36, 0), m.linha));
  return p;
}

/** Rolamento axial: duas anilhas planas e a coroa de esferas entre elas. */
export function axial(m: Materiais): Peca {
  const p = novo(0.8);
  p.g.add(disco(0.5, m.fundo, 0, 0.22));
  [0.1, -0.1].forEach((z) => { p.g.add(laco(circulo(0.5, z), m.linha), laco(circulo(0.22, z), m.linha)); });
  p.g.add(segs(geratrizes(0.5, 0.1, 0.5, -0.1, 8), m.linha));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.gira.add(laco(circulo(0.055, 0.001, Math.cos(a) * 0.36, Math.sin(a) * 0.36, 16), m.linha)); }
  return p;
}

/** Chumaceira de pé (tipo UCP): a base com os dois furos, a caixa redonda e o rolamento dentro. */
export function chumaceira(m: Materiais): Peca {
  const p = novo(0.6, true);
  const s = new Shape();
  s.moveTo(-0.62, -0.36); s.lineTo(0.62, -0.36); s.lineTo(0.62, -0.22); s.lineTo(0.32, -0.18);
  s.absarc(0, 0.06, 0.4, -0.6, Math.PI + 0.6, false); s.lineTo(-0.62, -0.22); s.closePath();
  const fundo = new Mesh(new ShapeGeometry(s, 32), m.fundo); fundo.renderOrder = -1; p.g.add(fundo);
  const contorno = s.getPoints(32).flatMap((v) => [v.x, v.y, 0.1]);
  p.g.add(laco(contorno, m.linha), laco(contorno.map((v, i) => (i % 3 === 2 ? -0.1 : v)), m.linha));
  p.g.add(laco(circulo(0.045, 0.1, -0.48, -0.29, 14), m.linha), laco(circulo(0.045, 0.1, 0.48, -0.29, 14), m.linha));
  const r = rolamento(m, 0.27); r.g.position.set(0, 0.06, 0); p.g.add(r.g); p.gira = r.gira;
  return p;
}

/** Correia com duas polias: as polias rodam, a correia fica. */
export function correia(m: Materiais): Peca {
  const p = novo(1.1, true);
  const [x1, r1, x2, r2] = [-0.34, 0.3, 0.42, 0.18];
  /* as tangentes exteriores às duas polias */
  const d = x2 - x1, a = Math.asin((r1 - r2) / d);
  const t = (s: number) => [x1 + r1 * Math.sin(a), s * r1 * Math.cos(a), 0, x2 + r2 * Math.sin(a), s * r2 * Math.cos(a), 0];
  p.g.add(segs([...t(1), ...t(-1)], m.linha));
  const polia = (x: number, r: number) => {
    const g = new Group(); g.position.x = x;
    g.add(disco(r, m.fundo), laco(circulo(r, 0), m.linha), laco(circulo(r * 0.78, 0.01), m.linha), laco(circulo(r * 0.25, 0.01), m.linha));
    const raios: number[] = []; for (let i = 0; i < 4; i++) { const b = (i / 4) * Math.PI * 2; raios.push(Math.cos(b) * r * 0.25, Math.sin(b) * r * 0.25, 0.01, Math.cos(b) * r * 0.78, Math.sin(b) * r * 0.78, 0.01); }
    g.add(segs(raios, m.linha)); return g;
  };
  const a1 = polia(x1, r1), a2 = polia(x2, r2);
  /* a polia grande é o `gira`; a pequena roda mais depressa, na razão dos raios (o comportamento lê o userData) */
  p.g.add(a1, a2); p.g.remove(p.gira); p.gira = a1;
  a2.userData.razao = r1 / r2; p.g.userData.outra = a2;
  return p;
}

/** Carreto (roda dentada de corrente): 16 dentes, o cubo e o furo. */
export function carreto(m: Materiais): Peca {
  const p = novo(0.5), n = 16, pts: number[] = [];
  for (let i = 0; i < n * 4; i++) {
    const a = (i / (n * 4)) * Math.PI * 2, k = i % 4;
    const r = k === 1 || k === 2 ? 0.5 : 0.42;
    pts.push(Math.cos(a) * r, Math.sin(a) * r, 0.06);
  }
  p.gira.add(disco(0.47, m.fundo));
  p.gira.add(laco(pts, m.linha), laco(pts.map((v, i) => (i % 3 === 2 ? -0.06 : v)), m.linha));
  p.gira.add(laco(circulo(0.2, 0.06), m.linha), laco(circulo(0.1, 0.06), m.linha), laco(circulo(0.2, -0.06), m.linha));
  return p;
}

/** Retentor: o anel com o lábio e a mola. */
export function retentor(m: Materiais): Peca {
  const p = novo(0.4);
  p.g.add(disco(0.5, m.fundo, 0, 0.26));
  [0.08, -0.08].forEach((z) => p.g.add(laco(circulo(0.5, z), m.linha)));
  p.g.add(laco(circulo(0.44, 0.08), m.linha), laco(circulo(0.3, 0.02), m.linha), laco(circulo(0.26, -0.08), m.linha));
  p.g.add(segs(geratrizes(0.5, 0.08, 0.5, -0.08, 8), m.linha));
  /* a mola, em ziguezague à volta do lábio */
  const mola: number[] = []; for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2, r = 0.35 + (i % 2 ? 0.025 : -0.025); mola.push(Math.cos(a) * r, Math.sin(a) * r, 0.03); }
  p.gira.add(linha(mola, m.linha));
  return p;
}

/** Corrente de rolos: cinco elos, alternando interiores e exteriores. */
export function corrente(m: Materiais): Peca {
  const p = novo(0, true);
  const elo = (cx: number, larg: number, alt: number, z: number) => {
    const pts: number[] = [], r = alt / 2;
    for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + (i / 16) * Math.PI; pts.push(cx + larg / 2 + Math.cos(a) * r, Math.sin(a) * r, z); }
    for (let i = 0; i <= 16; i++) { const a = Math.PI / 2 + (i / 16) * Math.PI; pts.push(cx - larg / 2 + Math.cos(a) * r, Math.sin(a) * r, z); }
    return laco(pts, m.linha);
  };
  for (let i = 0; i < 5; i++) {
    const cx = -0.56 + i * 0.28;
    p.g.add(elo(cx, 0.2, i % 2 ? 0.2 : 0.24, i % 2 ? 0.02 : -0.02));
    p.g.add(laco(circulo(0.05, 0.03, cx - 0.1, 0, 14), m.linha), laco(circulo(0.05, 0.03, cx + 0.1, 0, 14), m.linha));
  }
  const f = new Mesh(new ShapeGeometry(new Shape().moveTo(-0.78, -0.12).lineTo(0.78, -0.12).lineTo(0.78, 0.12).lineTo(-0.78, 0.12).closePath()), m.fundo); f.renderOrder = -1; f.position.z = -0.03; p.g.add(f);
  return p;
}

/** Uma esfera solta (os nós pequenos, mais longe). */
export function esfera(m: Materiais): Peca {
  const p = novo(0);
  p.g.add(disco(0.11, m.fundo), laco(circulo(0.11, 0.001, 0, 0, 20), m.linha), laco(circulo(0.06, 0.002, 0.025, 0.03, 12), m.linha));
  return p;
}

/** As peças da rede, pela ordem do anel. */
export const PECAS: { nome: string; criar: (m: Materiais) => Peca }[] = [
  { nome: 'Rolamento rígido de esferas', criar: (m) => rolamento(m) },
  { nome: 'Chumaceira', criar: chumaceira },
  { nome: 'Rolamento de rolos cónicos', criar: rolos },
  { nome: 'Correia e polias', criar: correia },
  { nome: 'Rolamento axial', criar: axial },
  { nome: 'Carreto', criar: carreto },
  { nome: 'Retentor', criar: retentor },
  { nome: 'Corrente', criar: corrente },
];
