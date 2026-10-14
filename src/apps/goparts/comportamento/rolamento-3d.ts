/* =========================================================
   GOPARTS — o rolamento 3D (14 out. 2026), comum à 00 · Abertura e à 00 · Página pública
   Um SKF 6206 à escala (1 unidade = 31 mm): D 62, d 30, B 16 mm, 9 esferas de 9,525 mm no
   diâmetro primitivo de 46 mm. Os anéis são LatheGeometry com a pista das esferas cavada; as
   esferas, uma InstancedMesh (uma só chamada de desenho); a gaiola, dois anéis finos. O eixo do
   rolamento é o z. `ambiente()` põe o reflexo do aço (um RoomEnvironment, sem mapas de fora), a luz
   principal branca e um contraluz laranja fraco.
   ========================================================= */
import { Group, Mesh, InstancedMesh, LatheGeometry, SphereGeometry, TorusGeometry, MeshPhysicalMaterial, DirectionalLight, Vector2, PMREMGenerator, DoubleSide, type Scene, type WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const mix = (a: number, b: number, k: number) => a + (b - a) * k;
export const R = { ext: 1, furo: 30 / 62, meia: 8 / 31, primitivo: 23 / 31, esfera: 4.7625 / 31, pista: 4.9 / 31 };
export const N_ESFERAS = 9;
const CHANF = 0.015;

/** Os perfis dos anéis (x = raio, y = eixo) para a LatheGeometry: um contorno fechado com chanfros, e a
 *  pista das esferas cavada na face que dá para elas (um arco de raio R.pista à volta do diâmetro primitivo). */
const P = R.primitivo, TERRA = 0.118;
function pistaArco(sentido: 1 | -1, de: number, ate: number): Vector2[] {
  return Array.from({ length: 17 }, (_, i) => { const a = mix(de, ate, i / 16); return new Vector2(P + sentido * R.pista * Math.cos(a), R.pista * Math.sin(a)); });
}
function perfilExterior(): Vector2[] {
  const m = R.meia, C = CHANF, lo = P + TERRA, a0 = Math.acos(TERRA / R.pista), gy = R.pista * Math.sin(a0);
  return [new Vector2(lo + C, -m), new Vector2(R.ext - C, -m), new Vector2(R.ext, -m + C), new Vector2(R.ext, m - C), new Vector2(R.ext - C, m),
    new Vector2(lo + C, m), new Vector2(lo, m - C), new Vector2(lo, gy), ...pistaArco(1, a0, -a0), new Vector2(lo, -gy), new Vector2(lo, -m + C), new Vector2(lo + C, -m)];
}
function perfilInterior(): Vector2[] {
  const m = R.meia, C = CHANF, li = P - TERRA, a0 = Math.acos(TERRA / R.pista), gy = R.pista * Math.sin(a0);
  return [new Vector2(R.furo + C, -m), new Vector2(li - C, -m), new Vector2(li, -m + C), new Vector2(li, -gy), ...pistaArco(-1, -a0, a0), new Vector2(li, gy),
    new Vector2(li, m - C), new Vector2(li - C, m), new Vector2(R.furo + C, m), new Vector2(R.furo, m - C), new Vector2(R.furo, -m + C), new Vector2(R.furo + C, -m)];
}

export interface Rolamento { grupo: Group; ext: Mesh; int: Mesh; esferas: InstancedMesh; gaiola: Group }

export function criarRolamento(): Rolamento {
  const aco = new MeshPhysicalMaterial({ color: '#d4dae0', metalness: 1, roughness: 0.3, clearcoat: 0.25, side: DoubleSide });
  const cromado = new MeshPhysicalMaterial({ color: '#f3f5f7', metalness: 1, roughness: 0.07 });
  const escuro = new MeshPhysicalMaterial({ color: '#5a636c', metalness: 0.9, roughness: 0.42 });
  const torno = (g: LatheGeometry) => { g.rotateX(Math.PI / 2); return g; };
  const ext = new Mesh(torno(new LatheGeometry(perfilExterior(), 160)), aco);
  const int = new Mesh(torno(new LatheGeometry(perfilInterior(), 160)), aco);
  const esferas = new InstancedMesh(new SphereGeometry(R.esfera, 40, 28), cromado, N_ESFERAS);
  const gaiola = new Group();
  [-1, 1].forEach((s) => { const g = new Mesh(new TorusGeometry(R.primitivo, 0.014, 10, 160), escuro); g.position.z = s * 0.1; gaiola.add(g); });
  const grupo = new Group(); grupo.add(ext, int, esferas, gaiola);
  return { grupo, ext, int, esferas, gaiola };
}

/** O reflexo do aço e as duas luzes. */
export function ambiente(r: WebGLRenderer, cena: Scene): void {
  const pmrem = new PMREMGenerator(r);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const luz = new DirectionalLight('#ffffff', 1.4); luz.position.set(3, 4, 5); cena.add(luz);
  const contra = new DirectionalLight('#ef7b10', 0.55); contra.position.set(-4, -2, -3); cena.add(contra);
}
