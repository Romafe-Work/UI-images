/* =========================================================
   PEÇA A PEÇA — as três peças da montra, em 3D (21 out. 2026)
   Ela: «pode ser a construção de um rolamento, mas… voltei ao Início e pode mudar para um travão… quero 3
   exemplos». Cada visita ao Início mostra a seguinte: o rolamento SKF 6206 (rolamento-3d.ts, à escala), um travão
   de disco (disco ventilado, pastilhas, pinça e êmbolo) e uma bomba de água (polia, veio com rolamento, corpo e
   rotor). O travão e a bomba são modelos ilustrativos do tipo de peça — formas certas, sem medidas de uma
   referência. Todos com o eixo em z e o mesmo contrato: as peças (para escolher e acender), a pose para um
   progresso p (0 montado → 1 explodido), o ponto de cada etiqueta e a distância da câmara.
   ========================================================= */
import { Group, Mesh, Object3D, Vector3, CylinderGeometry, BoxGeometry, LatheGeometry, TorusGeometry, Vector2, MeshPhysicalMaterial, DoubleSide } from 'three';
import { criarRolamento, R, N_ESFERAS } from './rolamento-3d';

export type IdExemplo = 'rolamento' | 'travao' | 'bomba';
export const EXEMPLOS: IdExemplo[] = ['rolamento', 'travao', 'bomba'];
export interface Modelo {
  grupo: Group;
  /** as malhas de cada peça (cada uma com o seu material, para acender sozinha) */
  pecas: Record<string, Mesh[]>;
  /** a pose para p ∈ [0, 1] e um giro das partes que rodam (o ângulo é de p) */
  pose(p: number): void;
  /** onde fica a etiqueta de cada peça, e a partir de que p aparece */
  etiqueta: Record<string, [Object3D, Vector3, number]>;
  /** a peça da etapa (no ecrã estreito só aparece uma etiqueta) */
  atual(p: number): string;
  /** a câmara: montado → explodido */
  dist: [number, number];
}
const limitar = (x: number) => Math.min(1, Math.max(0, x));
const suave = (a: number, b: number, p: number) => { const k = limitar((p - a) / (b - a)); return k * k * (3 - 2 * k); };
const tmp = new Object3D();
const proprio = (m: Mesh) => { m.material = (m.material as MeshPhysicalMaterial).clone(); return m; };
const mat = (cor: string, metal: number, rug: number) => new MeshPhysicalMaterial({ color: cor, metalness: metal, roughness: rug, side: DoubleSide });
const eixoZ = <T extends { rotateX(a: number): T }>(g: T) => g.rotateX(Math.PI / 2);

/* ---------- 1. o rolamento SKF 6206 ---------- */
function rolamento(): Modelo {
  const rol = criarRolamento();
  [rol.ext, rol.int, rol.esferas as unknown as Mesh, ...rol.gaiola.children as Mesh[]].forEach(proprio);
  return {
    grupo: rol.grupo,
    pecas: { ext: [rol.ext], gaiola: rol.gaiola.children as Mesh[], esferas: [rol.esferas as unknown as Mesh], int: [rol.int] },
    pose(p) {
      const exp = suave(.66, .84, p), abre = suave(.4, .62, p);
      rol.ext.position.z = -(1.05 * suave(.16, .4, p) + .55 * exp);
      rol.gaiola.children[0].position.z = -.1 - .42 * abre - .2 * exp;
      rol.gaiola.children[1].position.z = .1 + .42 * abre + .2 * exp;
      rol.int.position.z = 1.05 * suave(.55, .8, p) + .55 * exp;
      const raio = R.primitivo + .3 * suave(.45, .75, p), giro = p * 2.2;
      for (let i = 0; i < N_ESFERAS; i++) { const a = giro + (i / N_ESFERAS) * Math.PI * 2; tmp.position.set(Math.cos(a) * raio, Math.sin(a) * raio, 0); tmp.updateMatrix(); rol.esferas.setMatrixAt(i, tmp.matrix); }
      rol.esferas.instanceMatrix.needsUpdate = true;
    },
    etiqueta: { ext: [rol.ext, new Vector3(0, R.ext, 0), .22], gaiola: [rol.gaiola.children[1], new Vector3(0, -R.primitivo, 0), .42], esferas: [rol.gaiola, new Vector3(R.primitivo + .25, 0, 0), .48], int: [rol.int, new Vector3(0, R.furo, 0), .6] },
    atual: (p) => (p < .4 ? 'ext' : p < .5 ? 'gaiola' : p < .6 ? 'esferas' : 'int'),
    dist: [5.2, 8.8],
  };
}

/* ---------- 2. o travão de disco: disco ventilado, pastilhas, pinça flutuante e êmbolo ---------- */
function travao(): Modelo {
  const ferro = mat('#8c939a', .85, .45), pintura = mat('#e8740c', .35, .38), atrito = mat('#3b4148', .2, .85), cromado = mat('#eef1f4', 1, .12);
  /* o disco: duas faces com aletas entre elas e o chapéu ao centro */
  const disco = new Group();
  const face = (z: number) => { const m = new Mesh(eixoZ(new LatheGeometry([new Vector2(.42, -.03), new Vector2(1, -.03), new Vector2(1, .03), new Vector2(.42, .03)], 96)), ferro.clone()); m.position.z = z; return m; };
  const faces = [face(-.09), face(.09)];
  const aletas = Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2, m = new Mesh(new BoxGeometry(.5, .025, .12), ferro.clone()); m.position.set(Math.cos(a) * .72, Math.sin(a) * .72, 0); m.rotation.z = a; return m; });
  const chapeu = new Mesh(eixoZ(new LatheGeometry([new Vector2(.12, -.32), new Vector2(.44, -.32), new Vector2(.44, -.06), new Vector2(.42, -.06), new Vector2(.42, -.3), new Vector2(.12, -.3)], 64)), ferro.clone());
  disco.add(...faces, ...aletas, chapeu);
  const malhasDisco = [...faces, ...aletas, chapeu];
  /* as pastilhas: placa de aço e material de atrito, uma de cada lado, junto ao bordo de cima */
  const pastilha = (s: 1 | -1) => { const g = new Mesh(new BoxGeometry(.62, .3, .08), atrito.clone()); g.position.set(0, .78, s * .17); return g; };
  const pastilhas = [pastilha(1), pastilha(-1)];
  /* a pinça: a ponte por cima do disco e as duas faces, pintada */
  const pinca = new Group();
  const ponte = new Mesh(new BoxGeometry(.78, .16, .62), pintura.clone()); ponte.position.set(0, 1.06, 0);
  const lado = (s: 1 | -1) => { const m = new Mesh(new BoxGeometry(.78, .5, .12), pintura.clone()); m.position.set(0, .86, s * .32); return m; };
  const ladosP = [lado(1), lado(-1)];
  pinca.add(ponte, ...ladosP);
  /* o êmbolo, do lado de dentro */
  const embolo = new Mesh(eixoZ(new CylinderGeometry(.16, .16, .16, 48)), cromado.clone()); embolo.position.set(0, .8, .3);
  const grupo = new Group(); grupo.add(disco, ...pastilhas, pinca, embolo);
  grupo.position.y = -.25;
  return {
    grupo,
    pecas: { disco: malhasDisco, pastilhas, pinca: [ponte, ...ladosP], embolo: [embolo] },
    pose(p) {
      const sobe = suave(.16, .42, p), abre = suave(.42, .66, p), exp = suave(.66, .84, p);
      pinca.position.set(0, .75 * sobe + .25 * exp, .25 * exp);
      pastilhas[0].position.set(0, .78 + .35 * sobe, .17 + .38 * abre + .2 * exp);
      pastilhas[1].position.set(0, .78 + .35 * sobe, -.17 - .38 * abre - .2 * exp);
      embolo.position.set(0, .8 + .75 * sobe + .25 * exp, .3 + .6 * suave(.55, .8, p) + .25 * exp);
      disco.rotation.z = -p * 2.4;
    },
    etiqueta: { pinca: [ponte, new Vector3(.39, .08, 0), .22], pastilhas: [pastilhas[0], new Vector3(.31, 0, 0), .45], embolo: [embolo, new Vector3(.16, 0, 0), .58], disco: [faces[1], new Vector3(.95, -.25, 0), .7] },
    atual: (p) => (p < .42 ? 'pinca' : p < .58 ? 'pastilhas' : p < .7 ? 'embolo' : 'disco'),
    dist: [5.0, 7.8],
  };
}

/* ---------- 3. a bomba de água: polia, veio com rolamento, corpo e rotor ---------- */
function bomba(): Modelo {
  const aco = mat('#cfd6dd', 1, .28), aluminio = mat('#aeb6bf', .8, .42), escuro = mat('#4a5560', .7, .4), rotorM = mat('#d9dee3', .9, .3);
  /* a polia: um disco com as gargantas da correia (poly-V), no eixo */
  const perfil: Vector2[] = [new Vector2(.12, -.1), new Vector2(.6, -.1)];
  for (let i = 0; i <= 6; i++) perfil.push(new Vector2(i % 2 ? .66 : .7, -.1 + (i / 6) * .2));
  perfil.push(new Vector2(.6, .1), new Vector2(.12, .1));
  const polia = new Mesh(eixoZ(new LatheGeometry(perfil, 96)), aluminio.clone()); polia.position.z = -.7;
  /* o veio e o rolamento */
  const veio = new Mesh(eixoZ(new CylinderGeometry(.07, .07, 1.5, 32)), aco.clone()); veio.position.z = -.05;
  const rol = new Mesh(eixoZ(new CylinderGeometry(.2, .2, .42, 48)), escuro.clone()); rol.position.z = -.25;
  /* o corpo: o cubo, a flange com os furos e a voluta */
  const corpo = new Group();
  const cubo = new Mesh(eixoZ(new LatheGeometry([new Vector2(.22, -.45), new Vector2(.3, -.45), new Vector2(.34, -.05), new Vector2(.78, 0), new Vector2(.78, .1), new Vector2(.22, .1)], 96)), aluminio.clone());
  const furos = Array.from({ length: 5 }, (_, i) => { const a = (i / 5) * Math.PI * 2 + .3, m = new Mesh(new TorusGeometry(.06, .02, 8, 20), escuro.clone()); m.position.set(Math.cos(a) * .66, Math.sin(a) * .66, .1); return m; });
  corpo.add(cubo, ...furos);
  /* o rotor: o cubo e as pás curvas */
  const rotor = new Group();
  const centro = new Mesh(eixoZ(new CylinderGeometry(.14, .2, .1, 32)), rotorM.clone());
  const pas = Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2, m = new Mesh(new BoxGeometry(.34, .03, .12), rotorM.clone()); m.position.set(Math.cos(a) * .3, Math.sin(a) * .3, 0); m.rotation.z = a + .5; return m; });
  rotor.add(centro, ...pas); rotor.position.z = .25;
  const grupo = new Group(); grupo.add(polia, veio, rol, corpo, rotor);
  return {
    grupo,
    pecas: { polia: [polia], veio: [veio, rol], corpo: [cubo], rotor: [centro, ...pas] },
    pose(p) {
      const exp = suave(.66, .84, p);
      polia.position.z = -.7 - 1.0 * suave(.16, .4, p) - .4 * exp;
      rotor.position.z = .25 + 1.0 * suave(.42, .62, p) + .4 * exp;
      const sai = suave(.55, .78, p); veio.position.z = -.05 - .55 * sai - .2 * exp; rol.position.z = -.25 - .55 * sai - .2 * exp;
      const gira = -p * 3; polia.rotation.z = gira; rotor.rotation.z = gira; veio.rotation.z = gira;
    },
    etiqueta: { polia: [polia, new Vector3(0, .7, 0), .22], rotor: [rotor, new Vector3(.45, 0, 0), .45], veio: [rol, new Vector3(0, .2, 0), .58], corpo: [cubo, new Vector3(0, -.78, 0), .7] },
    atual: (p) => (p < .42 ? 'polia' : p < .58 ? 'rotor' : p < .7 ? 'veio' : 'corpo'),
    dist: [4.8, 8.2],
  };
}

export const criarModelo = (id: IdExemplo): Modelo => (id === 'travao' ? travao() : id === 'bomba' ? bomba() : rolamento());
