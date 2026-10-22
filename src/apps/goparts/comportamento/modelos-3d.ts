/* =========================================================
   PEÇA A PEÇA — as cinco peças da montra, em 3D (21 out. 2026; o amortecedor e a embraiagem no mesmo dia)
   Ela: «pode ser a construção de um rolamento, mas… voltei ao Início e pode mudar para um travão… quero 3
   exemplos». Cada visita ao Início mostra a seguinte: o rolamento SKF 6206 (rolamento-3d.ts, à escala), um travão
   de disco (disco ventilado, pastilhas, pinça e êmbolo) e uma bomba de água (polia, veio com rolamento, corpo e
   rotor). O travão e a bomba são modelos ilustrativos do tipo de peça — formas certas, sem medidas de uma
   referência. Todos com o eixo em z e o mesmo contrato: as peças (para escolher e acender), a pose para um
   progresso p (0 montado → 1 explodido), o ponto de cada etiqueta e a distância da câmara.
   ========================================================= */
import { Group, Mesh, Object3D, Vector3, Quaternion, CylinderGeometry, BoxGeometry, LatheGeometry, TorusGeometry, Vector2, MeshPhysicalMaterial, DoubleSide, Shape, ExtrudeGeometry, InstancedMesh, CanvasTexture, RepeatWrapping, Curve, TubeGeometry } from 'three';
import { criarRolamento, R, N_ESFERAS } from './rolamento-3d';

export type IdExemplo = 'rolos' | 'rolamento' | 'travao' | 'bomba' | 'amortecedor' | 'embraiagem';
/** (22 out.) o rolamento de rolos esféricos SKF, das fotografias dela no armazém, é a primeira peça da montra */
export const EXEMPLOS: IdExemplo[] = ['rolos', 'rolamento', 'travao', 'bomba', 'amortecedor', 'embraiagem'];
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

/* ---------- 0. o rolamento de rolos esféricos SKF (22 out.), das fotografias dela no armazém ----------
   Ela: «eis um rolamento real da SKF, coloca este animado». Um autocompensador de rolos: o anel exterior com a
   pista esférica por dentro (e o sulco de lubrificação a meio, por fora), duas filas de rolos em barril, inclinados
   um contra o outro, a gaiola de aço escura com uma janela por rolo, e o anel interior com as duas pistas e o
   anel-guia ao meio. As proporções são as da fotografia (furo ≈ metade do diâmetro, largura ≈ um quarto); a
   referência não se via na caixa, por isso não há cotas. A animação mostra primeiro o que o distingue: o interior
   inclina-se dentro do anel exterior e volta ao sítio (a autocompensação); depois desmonta-se pela ordem do 6206. */
const RS = .885, ROLO_R = .09, ROLO_L = .24, N_ROLOS = 17, PITCH = .785, FILA_Z = .14;
const BETA = Math.atan2(FILA_Z, PITCH);
function rolos(): Modelo {
  const ri = riscas();
  const aneis = new MeshPhysicalMaterial({ color: '#c9ced3', metalness: 1, roughness: .26, map: ri, roughnessMap: ri, side: DoubleSide });
  const rolosM = mat('#dfe3e7', 1, .16), gaiolaM = mat('#3b4148', .7, .4), sulcoM = mat('#7c838a', .9, .4);
  const pista = (z: number) => Math.sqrt(RS * RS - z * z);
  /* o anel exterior: o cilindro de fora (com chanfros e o sulco), e a pista esférica por dentro */
  const perfilExt: Vector2[] = [new Vector2(pista(-.28), -.28), new Vector2(1.08, -.28), new Vector2(1.1, -.26), new Vector2(1.1, -.035), new Vector2(1.082, -.03), new Vector2(1.082, .03), new Vector2(1.1, .035), new Vector2(1.1, .26), new Vector2(1.08, .28)];
  for (let i = 0; i <= 24; i++) { const z = .28 - (i / 24) * .56; perfilExt.push(new Vector2(pista(z), z)); }
  const ext = new Mesh(eixoZ(new LatheGeometry(perfilExt, 160)), aneis.clone());
  const furosLub = Array.from({ length: 3 }, (_, i) => { const a = (i / 3) * Math.PI * 2 + .4, m = new Mesh(new CylinderGeometry(.022, .022, .04, 12), sulcoM.clone()); m.position.set(Math.cos(a) * 1.085, Math.sin(a) * 1.085, 0); m.rotation.z = a - Math.PI / 2; return m; });
  const exterior = new Group(); exterior.add(ext, ...furosLub);
  /* o anel interior: o furo, os ombros, as duas pistas (côncavas, uma por fila) e o anel-guia ao meio */
  const perfilInt: Vector2[] = [new Vector2(.57, .28), new Vector2(.57, -.28), new Vector2(.7, -.28), new Vector2(.715, -.265)];
  for (let i = 0; i <= 12; i++) { const z = -.25 + (i / 12) * .22; perfilInt.push(new Vector2(.69 - .02 * Math.sin(((z + .25) / .22) * Math.PI), z)); }
  perfilInt.push(new Vector2(.705, -.02), new Vector2(.705, .02));
  for (let i = 0; i <= 12; i++) { const z = .03 + (i / 12) * .22; perfilInt.push(new Vector2(.69 - .02 * Math.sin(((z - .03) / .22) * Math.PI), z)); }
  perfilInt.push(new Vector2(.715, .265), new Vector2(.7, .28), new Vector2(.57, .28));
  const int = new Mesh(eixoZ(new LatheGeometry(perfilInt, 128)), aneis.clone());
  /* os rolos: um barril (mais largo ao meio), em duas filas desencontradas meio passo */
  const perfilRolo: Vector2[] = [new Vector2(0, -ROLO_L / 2), new Vector2(ROLO_R - .012, -ROLO_L / 2)];
  for (let i = 0; i <= 10; i++) { const y = -ROLO_L / 2 + (i / 10) * ROLO_L; perfilRolo.push(new Vector2(ROLO_R - .35 * y * y, y)); }
  perfilRolo.push(new Vector2(ROLO_R - .012, ROLO_L / 2), new Vector2(0, ROLO_L / 2));
  const rolosI = new InstancedMesh(new LatheGeometry(perfilRolo, 40), rolosM.clone(), N_ROLOS * 2);
  /* a gaiola: os dois aros dos lados, as barras entre os rolos e o anel-guia */
  /* os aros ficam por baixo dos rolos (como na fotografia: de frente veem-se os rolos, não a gaiola) */
  const aro = (z: number) => { const m = new Mesh(eixoZ(new LatheGeometry([new Vector2(.705, z - .012), new Vector2(.735, z - .012), new Vector2(.735, z + .012), new Vector2(.705, z + .012), new Vector2(.705, z - .012)], 128)), gaiolaM.clone()); return m; };
  const barras = new InstancedMesh(new BoxGeometry(.03, .06, .2), gaiolaM.clone(), N_ROLOS * 2);
  for (let k = 0; k < N_ROLOS * 2; k++) {
    const fila = k < N_ROLOS ? 1 : -1, a = ((k % N_ROLOS) + .5 + (fila < 0 ? .5 : 0)) / N_ROLOS * Math.PI * 2;
    tmp.position.set(Math.cos(a) * .76, Math.sin(a) * .76, fila * FILA_Z); tmp.rotation.set(0, 0, a); tmp.updateMatrix(); barras.setMatrixAt(k, tmp.matrix);
  }
  tmp.rotation.set(0, 0, 0);
  const guia = new Mesh(eixoZ(new LatheGeometry([new Vector2(.71, -.018), new Vector2(.75, -.018), new Vector2(.75, .018), new Vector2(.71, .018), new Vector2(.71, -.018)], 128)), gaiolaM.clone());
  const aros = [aro(-.272), aro(.272)];
  const gaiola = new Group(); gaiola.add(...aros, barras, guia);
  /* o «miolo» (anel interior, rolos e gaiola) é o que se inclina na autocompensação */
  const miolo = new Group(); miolo.add(int, rolosI, gaiola);
  const grupo = new Group(); grupo.add(exterior, miolo);
  const Y = new Vector3(0, 1, 0), eixo = new Vector3(), qa = new Quaternion(), qg = new Quaternion();
  return {
    grupo,
    pecas: { ext: [ext, ...furosLub], rolos: [rolosI as unknown as Mesh], gaiola: [...aros, barras as unknown as Mesh, guia], int: [int] },
    pose(p) {
      /* 1. a autocompensação: o miolo inclina-se ~9° e volta, com o anel exterior no sítio */
      const inclina = suave(.12, .22, p) * (1 - suave(.28, .36, p));
      miolo.rotation.x = .16 * inclina;
      /* 2. o anel exterior sai; 3. os rolos afastam-se e as filas separam-se; 4. a gaiola sai; 5. tudo explodido */
      const exp = suave(.66, .84, p);
      exterior.position.z = -(1.15 * suave(.36, .5, p) + .5 * exp);
      const raio = PITCH + .34 * suave(.44, .58, p), separa = .3 * suave(.5, .66, p) + .2 * exp;
      gaiola.position.z = 1.05 * suave(.58, .76, p) + .45 * exp;
      int.position.z = -.25 * exp;
      const giro = p * 2.2, rodar = -giro * (PITCH / ROLO_R);
      for (let k = 0; k < N_ROLOS * 2; k++) {
        const fila = k < N_ROLOS ? 1 : -1, a = giro + ((k % N_ROLOS) + (fila < 0 ? .5 : 0)) / N_ROLOS * Math.PI * 2;
        const c = Math.cos(a), s = Math.sin(a);
        /* o eixo do rolo, no plano (radial, z), perpendicular à linha do centro: as filas inclinam-se uma contra a outra */
        eixo.set(-fila * Math.sin(BETA) * c, -fila * Math.sin(BETA) * s, Math.cos(BETA)).normalize();
        qa.setFromUnitVectors(Y, eixo); qg.setFromAxisAngle(Y, rodar);
        tmp.quaternion.copy(qa).multiply(qg);
        tmp.position.set(c * raio, s * raio, fila * (FILA_Z + separa));
        tmp.updateMatrix(); rolosI.setMatrixAt(k, tmp.matrix);
      }
      tmp.quaternion.identity();
      rolosI.instanceMatrix.needsUpdate = true;
      gaiola.rotation.z = giro;
    },
    etiqueta: { ext: [ext, new Vector3(0, 1.1, 0), .28], rolos: [miolo, new Vector3(PITCH + .45, 0, .2), .46], gaiola: [gaiola, new Vector3(0, -.8, .27), .6], int: [int, new Vector3(0, .7, .28), .72] },
    atual: (p) => (p < .44 ? 'ext' : p < .6 ? 'rolos' : p < .74 ? 'gaiola' : 'int'),
    dist: [5.3, 8.6],
  };
}

/* ---------- 2. o travão de disco: disco ventilado, pastilhas, pinça flutuante e êmbolo ----------
   (21 out.) ela: «nada realista» (a pinça era uma caixa e o disco um prato liso). Agora: o disco com as faces
   maquinadas (riscas concêntricas), furado, com as aletas à vista no bordo e o chapéu com os cinco furos dos
   pernos; a pinça curva a acompanhar o disco, com o suporte em ferro, os parafusos-guia e o purgador; as pastilhas
   em arco, com a chapa de aço atrás do material de atrito; o êmbolo cromado com o guarda-pó. */
/** um setor de coroa (r1 → r2, centrado no ângulo «meio», com a abertura «ab») */
const setor = (r1: number, r2: number, meio: number, ab: number) => { const s = new Shape(); s.absarc(0, 0, r2, meio - ab / 2, meio + ab / 2, false); s.absarc(0, 0, r1, meio + ab / 2, meio - ab / 2, true); s.closePath(); return s; };
const extrudir = (sh: Shape, prof: number, bisel: number) => { const g = new ExtrudeGeometry(sh, { depth: prof, bevelEnabled: bisel > 0, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 4, curveSegments: 48 }); g.translate(0, 0, -prof / 2); return g; };
/** as riscas da maquinagem: no torno, o v corre ao longo do perfil, por isso as riscas horizontais ficam concêntricas */
function riscas(): CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = 4; c.height = 512;
  const x = c.getContext('2d'); if (!x) return null;
  for (let y = 0; y < 512; y++) { const v = 200 + Math.round(Math.sin(y * 1.7) * 14 + (Math.random() - .5) * 40); x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(0, y, 4, 1); }
  const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; return t;
}
function travao(): Modelo {
  const ri = riscas();
  const ferro = mat('#9aa1a8', .9, .38), maquinado = new MeshPhysicalMaterial({ color: '#c3c8cd', metalness: 1, roughness: .32, map: ri, roughnessMap: ri, side: DoubleSide });
  const fundido = mat('#5b6168', .75, .7), pintura = new MeshPhysicalMaterial({ color: '#c8571a', metalness: .2, roughness: .42, clearcoat: .6, clearcoatRoughness: .25 });
  const atrito = mat('#2c3036', .1, .95), chapa = mat('#7d858d', .85, .45), cromado = mat('#f2f4f6', 1, .08), borracha = mat('#16191c', 0, .85), furo = mat('#15181b', .3, .9);
  /* o disco: as duas faces maquinadas (com chanfro), as aletas entre elas, os furos e o chapéu */
  const disco = new Group();
  const face = (z: number) => { const m = new Mesh(eixoZ(new LatheGeometry([new Vector2(.46, -.035), new Vector2(.985, -.035), new Vector2(1, -.02), new Vector2(1, .02), new Vector2(.985, .035), new Vector2(.46, .035)], 128)), maquinado.clone()); m.position.z = z; return m; };
  const faces = [face(-.095), face(.095)];
  const aletas = Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2, m = new Mesh(new BoxGeometry(.5, .028, .12), ferro.clone()); m.position.set(Math.cos(a) * .74, Math.sin(a) * .74, 0); m.rotation.z = a + .18; return m; });
  const nFuros = 3 * 10, furos = new InstancedMesh(new CylinderGeometry(.024, .024, .27, 14), furo.clone(), nFuros);
  for (let k = 0; k < nFuros; k++) { const anel = k % 3, a = (Math.floor(k / 3) / 10) * Math.PI * 2 + anel * .17, r = .62 + anel * .12; tmp.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); tmp.rotation.set(Math.PI / 2, 0, 0); tmp.updateMatrix(); furos.setMatrixAt(k, tmp.matrix); }
  tmp.rotation.set(0, 0, 0);
  const chapeu = new Mesh(eixoZ(new LatheGeometry([new Vector2(.1, -.4), new Vector2(.36, -.4), new Vector2(.4, -.37), new Vector2(.42, -.08), new Vector2(.47, -.06), new Vector2(.47, -.04), new Vector2(.4, -.06), new Vector2(.38, -.36), new Vector2(.1, -.36)], 96)), ferro.clone());
  const pernos = Array.from({ length: 5 }, (_, i) => { const a = (i / 5) * Math.PI * 2 + Math.PI / 2, m = new Mesh(eixoZ(new CylinderGeometry(.045, .045, .06, 20)), furo.clone()); m.position.set(Math.cos(a) * .26, Math.sin(a) * .26, -.39); return m; });
  disco.add(...faces, ...aletas, furos, chapeu, ...pernos);
  const malhasDisco = [...faces, ...aletas, furos as unknown as Mesh, chapeu];
  /* as pastilhas: a chapa de aço atrás e o material de atrito virado ao disco, em arco como a pista */
  const META = Math.PI / 2;
  const pastilha = (s: 1 | -1) => {
    const g = new Group();
    const a = new Mesh(extrudir(setor(.66, .97, META, .78), .07, .008), atrito.clone()); a.position.z = s * .035;
    const c = new Mesh(extrudir(setor(.63, 1.0, META, .86), .022, .004), chapa.clone()); c.position.z = s * .085;
    g.add(a, c); g.userData.malhas = [a, c]; return g;
  };
  const pastilhas = [pastilha(1), pastilha(-1)];
  /* a pinça: a metade de fora, a de dentro (a do êmbolo) e a ponte por cima do bordo, com o suporte em ferro */
  const pinca = new Group();
  const fora = new Mesh(extrudir(setor(.6, 1.12, META, 1.0), .12, .03), pintura.clone()); fora.position.z = .34;
  const dentro = new Mesh(extrudir(setor(.58, 1.12, META, 1.06), .2, .03), pintura.clone()); dentro.position.z = -.38;
  const ponte = new Mesh(extrudir(setor(1.05, 1.16, META, .86), .62, .03), pintura.clone());
  const janela = new Mesh(extrudir(setor(1.0, 1.07, META, .5), .3, 0), furo.clone());
  const suporte = new Mesh(extrudir(setor(.86, 1.06, META, 1.42), .08, .015), fundido.clone()); suporte.position.z = -.58;
  const guia = (s: 1 | -1) => { const m = new Mesh(eixoZ(new CylinderGeometry(.06, .06, .14, 6)), cromado.clone()); const a = META + s * .62; m.position.set(Math.cos(a) * .96, Math.sin(a) * .96, -.56); return m; };
  const guias = [guia(1), guia(-1)];
  const purgador = new Mesh(new CylinderGeometry(.028, .028, .14, 12), cromado.clone()); purgador.position.set(.18, 1.18, -.4); purgador.rotation.z = -.15;
  pinca.add(fora, dentro, ponte, janela, suporte, ...guias, purgador);
  /* o êmbolo, do lado de dentro, com o guarda-pó em borracha */
  const embolo = new Group();
  const cil = new Mesh(eixoZ(new CylinderGeometry(.17, .17, .18, 48)), cromado.clone());
  const po = new Mesh(new TorusGeometry(.18, .025, 12, 48), borracha.clone()); po.position.z = -.08;
  embolo.add(cil, po);
  const grupo = new Group(); grupo.add(disco, ...pastilhas, pinca, embolo);
  grupo.position.y = -.3;
  return {
    grupo,
    pecas: { disco: malhasDisco, pastilhas: pastilhas.flatMap((g) => g.userData.malhas as Mesh[]), pinca: [fora, dentro, ponte, suporte, ...guias, purgador], embolo: [cil, po] },
    pose(p) {
      const sobe = suave(.16, .42, p), abre = suave(.42, .66, p), exp = suave(.66, .84, p);
      pinca.position.set(0, .7 * sobe + .25 * exp, .2 * exp);
      pastilhas[0].position.set(0, .32 * sobe, .17 + .4 * abre + .2 * exp);
      pastilhas[1].position.set(0, .32 * sobe, -.17 - .4 * abre - .2 * exp);
      embolo.position.set(0, .84 + .7 * sobe + .25 * exp, -.34 - .6 * suave(.55, .8, p) - .25 * exp);
      disco.rotation.z = -p * 2.4;
    },
    etiqueta: { pinca: [ponte, new Vector3(.3, 1.16, 0), .22], pastilhas: [pastilhas[0], new Vector3(.4, .9, 0), .45], embolo: [cil, new Vector3(.17, 0, 0), .58], disco: [faces[1], new Vector3(.95, -.25, 0), .7] },
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

/* ---------- 4. o amortecedor (21 out.): copela, mola, batente com guarda-pó e o amortecedor ----------
   Ela: «dá mais exemplos de coisas animadas». Um conjunto McPherson ilustrativo, de pé (o eixo em y): a copela sai
   por cima, a mola sobe e estica, o batente e o guarda-pó deixam ver a haste, que sai do corpo. */
class Helice extends Curve<Vector3> {
  constructor(private r: number, private h: number, private voltas: number) { super(); }
  getPoint(t: number, alvo = new Vector3()): Vector3 { const a = t * this.voltas * Math.PI * 2; return alvo.set(Math.cos(a) * this.r, t * this.h, Math.sin(a) * this.r); }
}
function amortecedor(): Modelo {
  const pintura = new MeshPhysicalMaterial({ color: '#c8571a', metalness: .3, roughness: .4, clearcoat: .5, clearcoatRoughness: .3 });
  const corpoM = mat('#2f353c', .6, .45), cromado = mat('#f2f4f6', 1, .06), borracha = mat('#1b1e22', 0, .8), aco = mat('#9aa1a8', .9, .35);
  const deY = <T extends Mesh>(m: T) => m; /* as peças já nascem de pé (o torno roda em y) */
  /* o amortecedor: o corpo, o olhal de baixo, o prato da mola e a haste cromada */
  const corpo = deY(new Mesh(new LatheGeometry([new Vector2(0, -1.25), new Vector2(.19, -1.25), new Vector2(.2, -1.2), new Vector2(.2, .3), new Vector2(.15, .36), new Vector2(.07, .38), new Vector2(0, .38)], 64), corpoM.clone()));
  const olhal = new Mesh(new TorusGeometry(.13, .05, 16, 40), corpoM.clone()); olhal.position.y = -1.36;
  const prato = new Mesh(new LatheGeometry([new Vector2(.2, -.42), new Vector2(.52, -.4), new Vector2(.56, -.34), new Vector2(.5, -.36), new Vector2(.2, -.38)], 64), aco.clone());
  const haste = new Mesh(new CylinderGeometry(.055, .055, 1.1, 32), cromado.clone()); haste.position.y = .85;
  const porca = new Mesh(new CylinderGeometry(.08, .08, .07, 6), aco.clone()); porca.position.y = 1.42;
  /* a mola: a hélice, apertada entre o prato de baixo e a copela */
  const mola = new Mesh(new TubeGeometry(new Helice(.44, 1.62, 5.5), 360, .05, 12), pintura.clone()); mola.position.y = -.36;
  /* o batente (sanfona de borracha) e o guarda-pó à volta da haste */
  const perfil: Vector2[] = [new Vector2(.06, 0)];
  for (let i = 0; i <= 10; i++) perfil.push(new Vector2(i % 2 ? .17 : .13, .05 + i * .07));
  perfil.push(new Vector2(.06, .8));
  const guarda = new Mesh(new LatheGeometry(perfil, 48), borracha.clone()); guarda.position.y = .42;
  /* a copela: o prato de cima, a borracha e o rolamento */
  const copela = new Group();
  const pratoC = new Mesh(new LatheGeometry([new Vector2(.06, 0), new Vector2(.56, -.02), new Vector2(.6, .05), new Vector2(.5, .06), new Vector2(.06, .06)], 64), aco.clone());
  const borr = new Mesh(new LatheGeometry([new Vector2(.08, .06), new Vector2(.42, .06), new Vector2(.46, .2), new Vector2(.3, .28), new Vector2(.08, .28)], 64), borracha.clone());
  const rolC = new Mesh(new TorusGeometry(.2, .045, 12, 40), cromado.clone()); rolC.rotation.x = Math.PI / 2; rolC.position.y = .3;
  copela.add(pratoC, borr, rolC); copela.position.y = 1.3;
  const grupo = new Group(); grupo.add(corpo, olhal, prato, haste, porca, mola, guarda, copela);
  grupo.scale.setScalar(.92); grupo.position.y = .05;
  return {
    grupo,
    pecas: { copela: [pratoC, borr, rolC], mola: [mola], guarda: [guarda], corpo: [corpo, olhal, prato, haste, porca] },
    pose(p) {
      const sai = suave(.16, .4, p), mo = suave(.42, .62, p), ha = suave(.55, .8, p), exp = suave(.66, .84, p);
      copela.position.y = 1.3 + 1.1 * sai + .35 * exp;
      mola.position.y = -.36 + .55 * mo + .2 * exp; mola.scale.y = 1 + .12 * mo;
      guarda.position.y = .42 + .5 * ha + .5 * mo + .15 * exp;
      haste.position.y = .85 + .32 * ha; porca.position.y = 1.42 + .32 * ha;
      copela.rotation.y = p * 1.4;
    },
    etiqueta: { copela: [pratoC, new Vector3(.58, .05, 0), .22], mola: [mola, new Vector3(.46, .9, 0), .45], guarda: [guarda, new Vector3(.17, .4, 0), .58], corpo: [corpo, new Vector3(.2, -.6, 0), .7] },
    atual: (p) => (p < .42 ? 'copela' : p < .58 ? 'mola' : p < .7 ? 'guarda' : 'corpo'),
    dist: [5.6, 8.4],
  };
}

/* ---------- 5. a embraiagem (21 out.): rolamento, prato de pressão, disco e volante ----------
   O kit de frente, no eixo z como o rolamento: o rolamento de embraiagem sai primeiro, depois o prato (com os
   dedos do diafragma), o disco (o atrito e as molas do cubo) e, atrás, o volante com a coroa dentada. */
function embraiagem(): Modelo {
  const ri = riscas();
  const aco = mat('#aab1b8', .9, .32), estampado = mat('#7f878f', .8, .45), maquinado = new MeshPhysicalMaterial({ color: '#c3c8cd', metalness: 1, roughness: .3, map: ri, roughnessMap: ri, side: DoubleSide });
  const atrito = mat('#4a3f36', .05, .95), mola = mat('#3f6fa8', .5, .4), escuro = mat('#2a2f35', .5, .5), cromado = mat('#eef1f4', 1, .1);
  /* o volante: a face maquinada, o cubo e a coroa dentada (dentes instanciados) */
  const volante = new Group();
  const face = new Mesh(eixoZ(new LatheGeometry([new Vector2(.18, -.1), new Vector2(1.08, -.1), new Vector2(1.1, -.06), new Vector2(1.1, .06), new Vector2(1.04, .08), new Vector2(.18, .08)], 128)), maquinado.clone());
  const nDentes = 96, dentes = new InstancedMesh(new BoxGeometry(.05, .07, .1), aco.clone(), nDentes);
  for (let k = 0; k < nDentes; k++) { const a = (k / nDentes) * Math.PI * 2; tmp.position.set(Math.cos(a) * 1.13, Math.sin(a) * 1.13, -.02); tmp.rotation.set(0, 0, a); tmp.updateMatrix(); dentes.setMatrixAt(k, tmp.matrix); }
  tmp.rotation.set(0, 0, 0);
  volante.add(face, dentes); volante.position.z = -.3;
  /* o disco: o anel de atrito (as duas faces), a chapa, o cubo estriado e as seis molas */
  const disco = new Group();
  const anel = new Mesh(eixoZ(new LatheGeometry([new Vector2(.52, -.05), new Vector2(.94, -.05), new Vector2(.94, .05), new Vector2(.52, .05)], 96)), atrito.clone());
  const chapa = new Mesh(eixoZ(new LatheGeometry([new Vector2(.14, -.012), new Vector2(.54, -.012), new Vector2(.54, .012), new Vector2(.14, .012)], 96)), estampado.clone());
  const cubo = new Mesh(eixoZ(new CylinderGeometry(.16, .16, .22, 24)), escuro.clone());
  const molas = Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2, m = new Mesh(new CylinderGeometry(.05, .05, .2, 16), mola.clone()); m.position.set(Math.cos(a) * .34, Math.sin(a) * .34, .03); m.rotation.z = a; return m; });
  disco.add(anel, chapa, cubo, ...molas); disco.position.z = -.14;
  /* o prato de pressão: a tampa estampada e os dedos do diafragma */
  const prato = new Group();
  const tampa = new Mesh(eixoZ(new LatheGeometry([new Vector2(.5, -.08), new Vector2(1.06, -.08), new Vector2(1.06, -.02), new Vector2(.98, .04), new Vector2(.86, .2), new Vector2(.62, .22), new Vector2(.58, .14), new Vector2(.5, .12)], 96)), estampado.clone());
  const dedos = Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2, m = new Mesh(new BoxGeometry(.4, .07, .025), aco.clone()); m.position.set(Math.cos(a) * .42, Math.sin(a) * .42, .17); m.rotation.set(0, 0, a); return m; });
  prato.add(tampa, ...dedos); prato.position.z = 0;
  /* o rolamento de embraiagem: a pista e a manga */
  const rolE = new Group();
  const pista = new Mesh(new TorusGeometry(.2, .06, 16, 48), cromado.clone());
  const manga = new Mesh(eixoZ(new CylinderGeometry(.14, .14, .34, 32)), escuro.clone()); manga.position.z = .16;
  rolE.add(pista, manga); rolE.position.z = .32;
  const grupo = new Group(); grupo.add(volante, disco, prato, rolE);
  return {
    grupo,
    pecas: { rolamento: [pista, manga], prato: [tampa, ...dedos], disco: [anel, chapa, cubo, ...molas], volante: [face, dentes as unknown as Mesh] },
    pose(p) {
      const exp = suave(.66, .84, p);
      rolE.position.z = .32 + .8 * suave(.16, .4, p) + .25 * exp;
      prato.position.z = .75 * suave(.42, .62, p) + .3 * exp;
      disco.position.z = -.14 + .3 * suave(.5, .7, p) + .1 * exp;
      volante.position.z = -.3 - .45 * suave(.55, .8, p) - .3 * exp;
      const gira = -p * 2.4; volante.rotation.z = gira; disco.rotation.z = gira; prato.rotation.z = gira;
    },
    etiqueta: { rolamento: [pista, new Vector3(0, .26, 0), .22], prato: [tampa, new Vector3(0, 1.06, 0), .45], disco: [anel, new Vector3(.94, 0, 0), .58], volante: [face, new Vector3(0, -1.1, 0), .7] },
    atual: (p) => (p < .42 ? 'rolamento' : p < .58 ? 'prato' : p < .7 ? 'disco' : 'volante'),
    dist: [5.2, 8.6],
  };
}

export const criarModelo = (id: IdExemplo): Modelo => (id === 'travao' ? travao() : id === 'bomba' ? bomba() : id === 'amortecedor' ? amortecedor() : id === 'embraiagem' ? embraiagem() : id === 'rolos' ? rolos() : rolamento());
