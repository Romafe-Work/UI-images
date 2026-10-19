/* =========================================================
   ERP — as peças da rede (19 out. 2026)
   Ela, ao ver a v10: «não quero cubos, quero mais rolamentos… coisa da Romafe». Os nós da rede passam a
   ser peças que a Romafe vende, desenhadas a traço fino (o mesmo traço das ligações), com um disco liso
   por trás para as linhas de trás não se cruzarem com a peça:
     rolamento rígido de esferas · rolamento de rolos cónicos · rolamento axial · chumaceira ·
     correia com polias · carreto · retentor · corrente
   e, a seguir (ela: «coloca óleos»), os lubrificantes: bidão de óleo de 5 L · garrafa de óleo de 1 L ·
   almotolia (com a gota a pingar) · lata de massa; e gotas soltas entre as esferas, ao fundo.
   As peças torneadas (garrafa, lata, almotolia) são anéis e geratrizes à volta do eixo y, com a silhueta
   lisa no plano do meio: a metade de trás dos anéis fica escondida, e a peça lê-se como um sólido.
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

/* ---------- os lubrificantes ---------- */

/** O contorno de uma gota (ponta em cima), de altura 2r, centrado em (cx, cy). */
function contornoGota(r: number, cx = 0, cy = 0, z = 0, seg = 28): number[] {
  const p: number[] = [];
  for (let i = 0; i < seg; i++) { const t = (i / seg) * Math.PI * 2; p.push(cx + Math.sin(t) * Math.sin(t / 2) * r * 0.95, cy + Math.cos(t) * r, z); }
  return p;
}
function silhueta(p: number[], m: Material, z = 0): Mesh {
  const s = new Shape(); for (let i = 0; i < p.length; i += 3) (i ? s.lineTo(p[i], p[i + 1]) : s.moveTo(p[i], p[i + 1])); s.closePath();
  const f = new Mesh(new ShapeGeometry(s), m); f.position.z = z; f.renderOrder = -1; return f;
}

/** Uma peça torneada à volta do eixo y: um anel em cada ponto do perfil (raio, altura), `n` geratrizes,
 *  e a silhueta lisa no plano do meio, que esconde a metade de trás. */
function torneado(perfil: [number, number][], m: Materiais, n = 6): Group {
  const g = new Group();
  perfil.forEach(([r, y]) => { if (r > 0.01) { const p: number[] = []; for (let i = 0; i < SEG; i++) { const a = (i / SEG) * Math.PI * 2; p.push(Math.cos(a) * r, y, Math.sin(a) * r); } g.add(laco(p, m.linha)); } });
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.PI / 2; g.add(linha(perfil.flatMap(([r, y]) => [Math.cos(a) * r, y, Math.sin(a) * r]), m.linha)); }
  const sil = [...perfil.map(([r, y]) => [r, y, 0]), ...[...perfil].reverse().map(([r, y]) => [-r, y, 0])].flat();
  g.add(silhueta(sil, m.fundo));
  return g;
}

/** Bidão de óleo de 5 L: o corpo, a pega com o furo, o bocal com a tampa, e o rótulo com a gota. */
export function bidao(m: Materiais): Peca {
  const p = novo(0, true), e = 0.13;
  const caixa = (x0: number, y0: number, x1: number, y1: number, rc: number) => {
    const s = new Shape();
    s.moveTo(x0 + rc, y0); s.lineTo(x1 - rc, y0); s.quadraticCurveTo(x1, y0, x1, y0 + rc); s.lineTo(x1, y1 - rc); s.quadraticCurveTo(x1, y1, x1 - rc, y1);
    s.lineTo(x0 + rc, y1); s.quadraticCurveTo(x0, y1, x0, y1 - rc); s.lineTo(x0, y0 + rc); s.quadraticCurveTo(x0, y0, x0 + rc, y0);
    return s;
  };
  const faces = (s: Shape, z: number, fundo = true) => {
    const c = s.getPoints(8).flatMap((v) => [v.x, v.y, 0]);
    p.g.add(laco(c.map((v, i) => (i % 3 === 2 ? z : v)), m.linha), laco(c.map((v, i) => (i % 3 === 2 ? -z : v)), m.linha));
    if (fundo) { const f = new Mesh(new ShapeGeometry(s, 8), m.fundo); f.renderOrder = -1; p.g.add(f); }
  };
  const corpo = caixa(-0.38, -0.5, 0.38, 0.34, 0.08);
  faces(corpo, e);
  p.g.add(segs([-0.38, -0.42, e, -0.38, -0.42, -e, 0.38, -0.42, e, 0.38, -0.42, -e, -0.38, 0.26, e, -0.38, 0.26, -e, 0.38, 0.26, e, 0.38, 0.26, -e], m.linha));
  const pega = caixa(0.02, 0.34, 0.36, 0.56, 0.07); pega.holes.push(caixa(0.09, 0.4, 0.29, 0.5, 0.04));
  faces(pega, 0.05);
  faces(caixa(-0.32, 0.34, -0.12, 0.52, 0.02), 0.07);
  p.g.add(segs([-0.32, 0.44, 0.07, -0.12, 0.44, 0.07], m.linha));
  /* o rótulo e a gota */
  p.g.add(laco(caixa(-0.27, -0.36, 0.27, 0.16, 0.04).getPoints(6).flatMap((v) => [v.x, v.y, e + 0.002]), m.linha));
  p.g.add(laco(contornoGota(0.11, 0, -0.08, e + 0.003), m.linha));
  return p;
}

/** Garrafa de óleo de 1 L: torneada, com o rótulo (duas linhas à volta) e a tampa. */
export function garrafa(m: Materiais): Peca {
  const p = novo(0, true), g = torneado([[0.27, -0.5], [0.3, -0.46], [0.3, -0.3], [0.3, 0.04], [0.3, 0.12], [0.2, 0.26], [0.1, 0.31], [0.1, 0.36], [0.13, 0.36], [0.13, 0.5]], m);
  g.add(laco(contornoGota(0.08, 0, -0.13, 0.302, 20), m.linha));
  g.rotation.x = 0.28; p.g.add(g);
  return p;
}

/** Lata de massa lubrificante: larga e baixa, a tampa com a aba, vista um pouco de cima. */
export function lata(m: Materiais): Peca {
  const p = novo(0, true), g = torneado([[0.44, -0.28], [0.44, 0.17], [0.48, 0.19], [0.48, 0.28], [0.36, 0.28]], m, 8);
  g.rotation.x = 0.42; p.g.add(g);
  return p;
}

/** Almotolia: o corpo em cone, o bico comprido, a asa; a gota forma-se na ponta do bico e cai. */
export function almotolia(m: Materiais): Peca {
  const p = novo(0, true), g = torneado([[0.34, -0.48], [0.36, -0.44], [0.36, -0.3], [0.14, 0.02], [0.07, 0.08], [0.07, 0.12]], m);
  g.rotation.x = 0.25; g.position.x = -0.1; p.g.add(g);
  /* o bico: um tubo fino da tampa até à ponta */
  const [x0, y0, x1, y1, w] = [-0.06, 0.12, 0.5, 0.5, 0.025];
  p.g.add(segs([x0 - w, y0 + w, 0, x1 - w, y1 + w, 0, x0 + w, y0 - w, 0, x1 + w, y1 - w, 0], m.linha));
  /* a asa, do lado de trás */
  const asa: number[] = []; for (let i = 0; i <= 20; i++) { const a = Math.PI * 0.55 + (i / 20) * Math.PI * 0.9; asa.push(-0.46 + Math.cos(a) * 0.16, -0.2 + Math.sin(a) * 0.2, 0); }
  p.g.add(linha(asa, m.linha));
  const gota = new Group(); gota.position.set(x1 + 0.01, y1 - 0.1, 0); gota.userData.y0 = gota.position.y;
  gota.add(silhueta(contornoGota(0.06, 0, 0, 0, 20), m.fundo), laco(contornoGota(0.06, 0, 0, 0.001, 20), m.linha));
  p.g.add(gota); p.g.userData.gota = gota;
  return p;
}

/** Uma gota de óleo solta (como as esferas, ao fundo). */
export function gota(m: Materiais): Peca {
  const p = novo(0, true), c = contornoGota(0.12);
  p.g.add(silhueta(c, m.fundo), laco(c.map((v, i) => (i % 3 === 2 ? 0.001 : v)), m.linha), linha([-0.035, -0.02, 0.002, -0.05, -0.07, 0.002], m.linha));
  return p;
}

/** As peças da rede, pela ordem do anel (as seis primeiras são as do telemóvel). */
export const PECAS: { nome: string; criar: (m: Materiais) => Peca }[] = [
  { nome: 'Rolamento rígido de esferas', criar: (m) => rolamento(m) },
  { nome: 'Bidão de óleo', criar: bidao },
  { nome: 'Chumaceira', criar: chumaceira },
  { nome: 'Rolamento de rolos cónicos', criar: rolos },
  { nome: 'Garrafa de óleo', criar: garrafa },
  { nome: 'Correia e polias', criar: correia },
  { nome: 'Rolamento axial', criar: axial },
  { nome: 'Almotolia', criar: almotolia },
  { nome: 'Carreto', criar: carreto },
  { nome: 'Retentor', criar: retentor },
  { nome: 'Lata de massa', criar: lata },
  { nome: 'Corrente', criar: corrente },
];
