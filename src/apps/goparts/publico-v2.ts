/* =========================================================
   GOPARTS — 00 · A página pública v2: os produtos Romafe (13 out. 2026)
   Ela mandou três imagens de um reel (o site «LUNEA», de café) — «quero ter estes
   efeitos, só que com peças, para produtos Romafe». O que o vídeo faz e o que fica:
     um objeto ao centro que se transforma de secção em secção (lá o café a verter e
       a rodopiar) → aqui as peças: o rolamento roda e, na secção seguinte, abre-se
       peça a peça (os anéis afastam-se, as esferas soltam-se); depois o disco de
       travão com a pinça, o kit de distribuição com as polias a rodar e a chave;
     a lua clara atrás do objeto → um disco claro que muda de sítio com o scroll;
     as gotas a flutuar → pequenas esferas de aço e laranja, cada uma ao seu ritmo;
     o texto de cada secção desvanece e o seguinte sobe, com o número grande
       («Section 2») → «Família 02»;
     o botão claro «Discover» → «Entrar no GoParts», laranja (a ação é sempre laranja);
     os pontos em baixo e a seta à direita → saltam de secção em secção.
   O scroll é que manda (comportamento/produtos.ts põe o progresso em cada peça);
   só transform e opacity. Os textos falam de famílias que a Romafe vende
   (Rolamentos, Máquinas e Ferramentas; SKF desde 1975; 75 000 referências auto).
   ========================================================= */
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowDown from 'lucide-static/icons/arrow-down.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const f = (n: number) => n.toFixed(1);
const rad = (g: number) => (g * Math.PI) / 180;
/** um anel (coroa circular), para desenhar com fill-rule evenodd */
const anel = (R: number, r: number, cx = 0, cy = 0) =>
  `M${cx + R} ${cy}A${R} ${R} 0 1 0 ${cx - R} ${cy}A${R} ${R} 0 1 0 ${cx + R} ${cy}ZM${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}Z`;
/** um setor de coroa entre dois ângulos (graus, 0 = direita, sentido dos ponteiros) */
const setor = (R1: number, R2: number, a1: number, a2: number) => {
  const p = (r: number, a: number) => `${f(r * Math.cos(rad(a)))} ${f(r * Math.sin(rad(a)))}`;
  const g = a2 - a1 > 180 ? 1 : 0;
  return `M${p(R2, a1)}A${R2} ${R2} 0 ${g} 1 ${p(R2, a2)}L${p(R1, a2)}A${R1} ${R1} 0 ${g} 0 ${p(R1, a1)}Z`;
};
const roda = (n: number, r: number, fn: (x: number, y: number, a: number, i: number) => string, a0 = -90) =>
  Array.from({ length: n }, (_, i) => { const a = a0 + (i * 360) / n; return fn(r * Math.cos(rad(a)), r * Math.sin(rad(a)), a, i); }).join('');

/* o aço, comum às peças */
const ACO = `<defs>
  <linearGradient id="pp-aco" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6f8fb"/><stop offset=".45" stop-color="#b7c2ce"/><stop offset="1" stop-color="#5f6b79"/></linearGradient>
  <linearGradient id="pp-aco2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3e9ef"/><stop offset=".5" stop-color="#9aa6b3"/><stop offset="1" stop-color="#4c5765"/></linearGradient>
  <radialGradient id="pp-esfera" cx=".34" cy=".3" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#cfd7df"/><stop offset="1" stop-color="#4a5562"/></radialGradient>
  <radialGradient id="pp-disco" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#d9e0e7"/><stop offset=".6" stop-color="#8f9aa6"/><stop offset="1" stop-color="#56616e"/></radialGradient>
  <linearGradient id="pp-laranja" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb066"/><stop offset=".5" stop-color="#f07c1a"/><stop offset="1" stop-color="#b4530a"/></linearGradient>
</defs>`;

/* 01–02 · o rolamento: anel exterior, gaiola, 12 esferas, anel interior; na 02 abre-se */
const ESFERAS = roda(12, 118, (x, y, a, i) => `<circle class="pp__esfera" data-a="${f(a)}" style="--k:${i}" cx="${f(x)}" cy="${f(y)}" r="19" fill="url(#pp-esfera)"/>`);
const ROLAMENTO = `<svg class="pp__peca pp__rolamento" data-de="0" data-ate="1" viewBox="-260 -260 520 520" aria-hidden="true">${ACO}
  <g class="pp__rodar">
    <g class="pp__ext"><path fill-rule="evenodd" fill="url(#pp-aco)" d="${anel(172, 140)}"/><circle r="156" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="2"/><circle r="171" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/></g>
    <g class="pp__gaiola"><path fill-rule="evenodd" fill="#5a6573" d="${anel(126, 110)}"/>${roda(12, 118, (x, y) => `<circle cx="${f(x)}" cy="${f(y)}" r="22" fill="#3f4955"/>`, -75)}</g>
    <g class="pp__esferas">${ESFERAS}</g>
    <g class="pp__int"><path fill-rule="evenodd" fill="url(#pp-aco2)" d="${anel(96, 62)}"/><circle r="80" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="2"/><circle r="63" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/></g>
  </g>
</svg>`;

/* 03 · o disco de travão ventilado e perfurado, com a pinça laranja */
const FUROS = [118, 138, 156].map((r, k) => roda(18, r, (x, y) => `<circle cx="${f(x)}" cy="${f(y)}" r="4.2" fill="#1d2733"/>`, -90 + k * 7)).join('');
const DISCO = `<svg class="pp__peca pp__disco" data-de="2" data-ate="2" viewBox="-260 -260 520 520" aria-hidden="true">
  <g class="pp__rodar">
    <circle r="172" fill="url(#pp-disco)"/>
    ${[108, 124, 140, 156, 168].map((r) => `<circle r="${r}" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="1.2"/>`).join('')}
    ${FUROS}
    <circle r="94" fill="url(#pp-aco2)"/><circle r="94" fill="none" stroke="#2a3440" stroke-opacity=".5" stroke-width="3"/>
    ${roda(5, 56, (x, y) => `<circle cx="${f(x)}" cy="${f(y)}" r="9.5" fill="#1d2733"/>`)}
    <circle r="27" fill="#1d2733"/>
  </g>
  <path class="pp__pinca" fill="url(#pp-laranja)" d="${setor(128, 196, -78, 8)}"/>
  <path fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" d="${setor(150, 182, -66, -4)}"/>
</svg>`;

/* 04 · o kit de distribuição: a correia à volta de duas polias e do tensor, que rodam */
/* pela ordem dos ponteiros do relógio, para a correia passar por fora */
const POLIAS: [number, number, number][] = [[-70, -40, 100], [128, -110, 38], [110, 120, 58]];
function correia(): string {
  const e = 10; /* meia espessura da correia */
  const c = POLIAS.map(([x, y, r]) => [x, y, r + e] as const);
  const tang = c.map(([x1, y1, r1], i) => {
    const [x2, y2, r2] = c[(i + 1) % c.length];
    const th = Math.atan2(y2 - y1, x2 - x1), L2 = Math.hypot(x2 - x1, y2 - y1), al = Math.acos((r1 - r2) / L2), a = th - al;
    return { p1: [x1 + r1 * Math.cos(a), y1 + r1 * Math.sin(a)], p2: [x2 + r2 * Math.cos(a), y2 + r2 * Math.sin(a)] };
  });
  let d = `M${f(tang[0].p1[0])} ${f(tang[0].p1[1])}`;
  tang.forEach((t, i) => {
    const prox = tang[(i + 1) % tang.length], [cx, cy, r] = c[(i + 1) % c.length];
    /* o arco vai no sentido dos ponteiros; a polia grande abraça mais de meia volta */
    const a1 = Math.atan2(t.p2[1] - cy, t.p2[0] - cx), a2 = Math.atan2(prox.p1[1] - cy, prox.p1[0] - cx);
    const volta = ((a2 - a1) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    d += `L${f(t.p2[0])} ${f(t.p2[1])}A${f(r)} ${f(r)} 0 ${volta > Math.PI ? 1 : 0} 1 ${f(prox.p1[0])} ${f(prox.p1[1])}`;
  });
  return d + 'Z';
}
const POLIA = ([x, y, r]: [number, number, number], i: number) => `<g transform="translate(${x} ${y})"><g class="pp__polia" style="--dur:${f(r / 6)}s">
  <circle r="${r}" fill="${i === 2 ? '#e9eef3' : 'url(#pp-aco)'}"/><circle r="${r - 6}" fill="none" stroke="#000" stroke-opacity=".15" stroke-width="2"/>
  ${i === 2 ? '' : roda(5, r * 0.56, (px, py) => `<circle cx="${f(px)}" cy="${f(py)}" r="${f(r * 0.17)}" fill="#1d2733"/>`)}
  <circle r="${f(r * 0.27)}" fill="url(#pp-aco2)"/><circle r="${f(r * 0.1)}" fill="#1d2733"/>
</g></g>`;
const DISTRIBUICAO = `<svg class="pp__peca pp__distribuicao" data-de="3" data-ate="3" viewBox="-260 -260 520 520" aria-hidden="true">
  <path d="${correia()}" fill="none" stroke="#1b2129" stroke-width="20" stroke-linejoin="round"/>
  <path d="${correia()}" fill="none" stroke="#3a4552" stroke-width="16" stroke-dasharray="5 6"/>
  ${POLIAS.map(POLIA).join('')}
</svg>`;

/* 05 · a chave de boca e luneta */
const CHAVE = `<svg class="pp__peca pp__chave" data-de="4" data-ate="4" viewBox="-260 -260 520 520" aria-hidden="true">
  <defs><mask id="pp-chave-m"><rect x="-260" y="-260" width="520" height="520" fill="#fff"/>
    <polygon fill="#000" points="${roda(12, 26, (x, y) => `${f(x - 160)},${f(y)} `)}"/>
    <path fill="#000" d="M150 -22 L210 -34 L210 34 L150 22 Z"/><circle cx="150" fill="#000" r="22"/>
  </mask></defs>
  <g transform="rotate(-38)" mask="url(#pp-chave-m)">
    <rect x="-150" y="-17" width="300" height="34" rx="12" fill="url(#pp-aco)"/>
    <rect x="-110" y="-8" width="220" height="16" rx="8" fill="#000" fill-opacity=".1"/>
    <circle cx="-160" r="48" fill="url(#pp-aco)"/><circle cx="160" r="50" fill="url(#pp-aco2)"/>
  </g>
</svg>`;

/* as esferas que flutuam (as gotas do vídeo): x, y em %, tamanho, velocidade, cor; ficam do lado das
   peças (x passa a 44–98 %): do lado do texto, a passar por trás das letras, pareciam acentos */
const SOLTAS: [number, number, number, number, number][] = [[8, 18, 10, 120, 0], [16, 72, 6, 220, 1], [30, 40, 8, 160, 0], [44, 86, 12, 90, 1], [52, 12, 5, 260, 0], [61, 64, 7, 200, 1], [70, 24, 14, 110, 0], [78, 80, 6, 240, 1], [86, 48, 9, 150, 0], [93, 14, 7, 190, 1], [38, 62, 5, 280, 1], [24, 30, 4, 300, 0]];

const CENAS: [string, string, string][] = [
  ['Rolamentos', 'Feito para rodar.', 'A Romafe nasceu dos Rolamentos, Máquinas e Ferramentas — e distribui SKF desde 1975.'],
  ['Por dentro', 'Peça a peça.', 'Anéis, gaiola e esferas. No GoParts vê cada referência com as medidas e o stock no Porto e em Sacavém.'],
  ['Travagem', 'Trava quando deve.', 'Discos, pastilhas e pinças para as marcas que entram na sua oficina.'],
  ['Distribuição', 'Tudo a tempo.', 'Kits com correia, tensor e polias, prontos a sair do armazém.'],
  ['Ferramentas', 'A ferramenta certa.', 'Máquinas e ferramentas para a oficina: o «MaFe» do nome Romafe.'],
];
const LINHAS = (t: string) => t.split(' ').reduce<string[]>((ls, p) => {
  const u = ls[ls.length - 1];
  if (u !== undefined && (u + ' ' + p).length <= 10) ls[ls.length - 1] = u + ' ' + p; else ls.push(p);
  return ls;
}, []).map((l, i) => `<span class="pp__linha"><span style="--i:${i}">${l}</span></span>`).join('');

export const htmlPublicoV2 = `<div class="pub pp">
  <header class="pub__barra">
    <a class="pub__marca" href="#" aria-label="Romafe GoParts"><span class="romafe">ROMAFE</span><span class="pub__risco" aria-hidden="true"></span><span class="pub__produto">GoParts</span></a>
    <nav class="pub__nav pp__nav" aria-label="Famílias">${CENAS.filter((_, i) => i !== 1).map(([nome]) => `<a href="#" data-cena="${CENAS.findIndex((c) => c[0] === nome)}">${nome}</a>`).join('')}</nav>
    <button type="button" class="btn btn--acao pub__entrar" data-ir="entrada">${L(logIn, 'btn__icone')}<span class="btn__rotulo">Entrar</span></button>
  </header>

  <section class="pp__palco" aria-label="Os produtos Romafe" style="--n:${CENAS.length}">
    <div class="pp__fixo">
      <div class="pp__lua" aria-hidden="true"></div>
      <div class="pp__soltas" aria-hidden="true">${SOLTAS.map(([x, y, t, v, c]) => `<i class="pp__solta${c ? ' pp__solta--laranja' : ''}" data-v="${v}" style="left:${f(44 + x * 0.54)}%;top:${y}%;width:${t}px;height:${t}px"></i>`).join('')}</div>
      <div class="pp__pecas">${ROLAMENTO}${DISCO}${DISTRIBUICAO}${CHAVE}</div>
      <div class="pp__textos">${CENAS.map(([fam, titulo, texto], i) => `<article class="pp__cena" data-cena="${i}"${i ? '' : ' aria-current="true"'}>
        <p class="pp__familia"><span class="pp__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>${fam} · Família ${String(i + 1).padStart(2, '0')}</p>
        <h2 class="pp__titulo">${LINHAS(titulo)}</h2>
        <p class="pp__texto">${texto}</p>
        ${i ? '' : `<button type="button" class="btn btn--acao pp__cta" data-ir="entrada">${L(logIn, 'btn__icone')}<span class="btn__rotulo">Entrar no GoParts</span></button>`}
      </article>`).join('')}</div>
      <nav class="pp__pontos" aria-label="Secções">${CENAS.map(([fam], i) => `<button type="button" class="pp__ponto" data-cena="${i}" aria-label="${fam}"${i ? '' : ' aria-current="true"'}></button>`).join('')}</nav>
      <button type="button" class="btn btn--ghost pp__seguinte" data-seguinte><span class="btn__rotulo">Seguinte</span>${L(chevronRight, 'btn__icone')}</button>
      <p class="pp__descer" aria-hidden="true">${L(arrowDown)}Role para ver</p>
    </div>
  </section>

  <section class="pp__fim" aria-label="Entrar">
    <p class="pp__fim-num"><strong>75 000</strong> referências auto, com o stock à vista.</p>
    <h2 class="pub__h2 pub__h2--fim pp__fim-titulo"><span class="pp__linha"><span>Entre no</span></span><span class="pp__linha"><span style="--i:1">GoParts.</span></span></h2>
    <button type="button" class="btn btn--acao pub__cta pub__cta--grande" data-ir="entrada"><span class="btn__rotulo">Entrar</span>${L(arrowRight, 'btn__icone')}</button>
  </section>
  <footer class="pub__rodape"><span>2026 © Romafe SA · Porto</span><nav class="pp__rodape-nav" aria-label="A Romafe"><a href="#" data-ir="publico-romafe">A Romafe</a><a href="#" data-ir="publico-entregas">Entregas</a><a href="#" data-ir="publico-marcas">Marcas</a><a href="#" data-ir="publico-contactos">Contactos</a></nav><span>Distribuidor SKF desde 1975 · ISO 9001 desde 2006</span></footer>
</div>`;
