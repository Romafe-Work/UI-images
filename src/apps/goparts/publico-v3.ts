/* =========================================================
   GOPARTS — 00 · A página pública v3: os produtos Romafe, realistas (13 out. 2026)
   Ela, sobre a v2: «estás quase lá… não gosto daquela lua, quero coisas realistas,
   e a lua não faz sentido na Romafe». Muda:
     atrás das peças — em vez da lua, as fotografias verdadeiras da Romafe, uma por
       família (Rolamentos: o corredor com as caixas SKF; Travagem: a separação;
       Distribuição: a fachada; Ferramentas: a oficina), que trocam com o scroll;
     as peças — desenhadas como se fossem fotografadas: a luz fica parada enquanto a
       peça roda (o brilho está numa camada fixa por cima), aço com faixas de reflexo,
       a folga escura entre os anéis do rolamento, esferas com o reflexo da janela,
       gaiola com rebites, o disco com os riscos do polimento, furos chanfrados e o
       chapéu mais escuro, a pinça com parafusos e a sombra dela no disco, polias com
       ranhuras e cubo sextavado, a chave cromada e gravada; uma sombra no chão;
     as esferas soltas são todas de aço (as laranja não existem).
   O resto (texto, scroll, pontos, menu, fim) é o da v2 (publico-v2.ts).
   ========================================================= */
import { paginaProdutos, f, anel, setor, roda, POLIAS, correia } from './publico-v2';
import corredor from '../../comum/img/corredor.webp';
import separacao from '../../comum/img/separacao.webp';
import fachada from '../../comum/img/fachada.webp';
import oficina from '../../comum/img/oficina.webp';

const V = 'viewBox="-260 -260 520 520" aria-hidden="true"';
/* o aço: faixas de reflexo como num cromado fotografado, a luz de cima à esquerda */
const DEFS = `<defs>
  <linearGradient id="r3-aco" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f9fb"/><stop offset=".16" stop-color="#cfd6dd"/><stop offset=".38" stop-color="#7c8792"/><stop offset=".52" stop-color="#e9edf1"/><stop offset=".7" stop-color="#9aa4ae"/><stop offset="1" stop-color="#4e5761"/></linearGradient>
  <linearGradient id="r3-aco2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef2f5"/><stop offset=".3" stop-color="#8d97a2"/><stop offset=".55" stop-color="#dfe5ea"/><stop offset=".8" stop-color="#6b7580"/><stop offset="1" stop-color="#3f4750"/></linearGradient>
  <radialGradient id="r3-esfera" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#ffffff"/><stop offset=".1" stop-color="#eef2f5"/><stop offset=".38" stop-color="#aab4be"/><stop offset=".72" stop-color="#555f6a"/><stop offset="1" stop-color="#262c33"/></radialGradient>
  <linearGradient id="r3-gaiola" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9aa3ad"/><stop offset=".5" stop-color="#5d6670"/><stop offset="1" stop-color="#3a4149"/></linearGradient>
  <linearGradient id="r3-brilho" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".62" stop-color="#fff" stop-opacity=".12"/><stop offset=".75" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <radialGradient id="r3-chao" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <linearGradient id="r3-disco" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c4ccd3"/><stop offset=".5" stop-color="#959fa9"/><stop offset="1" stop-color="#5f6872"/></linearGradient>
  <radialGradient id="r3-chapeu" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#7d8690"/><stop offset=".7" stop-color="#4a525b"/><stop offset="1" stop-color="#30363d"/></radialGradient>
  <linearGradient id="r3-pinca" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb46e"/><stop offset=".3" stop-color="#f58a2c"/><stop offset=".65" stop-color="#d9670f"/><stop offset="1" stop-color="#8f3f05"/></linearGradient>
  <linearGradient id="r3-cromado" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfd"/><stop offset=".22" stop-color="#aab3bc"/><stop offset=".45" stop-color="#eef1f4"/><stop offset=".62" stop-color="#7a848f"/><stop offset=".85" stop-color="#d6dbe0"/><stop offset="1" stop-color="#5d6771"/></linearGradient>
</defs>`;
const CHAO = (y: number, rx: number) => `<ellipse cx="0" cy="${y}" rx="${rx}" ry="${f(rx * 0.13)}" fill="url(#r3-chao)"/>`;
/** chanfro: a aresta de cima apanha luz, a de baixo fica escura */
const CHANFRO = (r: number, w = 1.5) => `<circle r="${r}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="${w}"/>`;
const SOMBRA = (r: number, w = 3, o = 0.35) => `<circle r="${r}" fill="none" stroke="#000" stroke-opacity="${o}" stroke-width="${w}"/>`;

/* 01–02 · o rolamento rígido de esferas: os anéis ficam parados (são redondos: rodar não se via) e a gaiola
   com as esferas roda; na 02 abre-se como na v2 */
const ESFERA = (x: number, y: number, a: number, i: number) => `<g class="pp__esfera" data-a="${f(a)}" style="--k:${i}">
  <circle cx="${f(x)}" cy="${f(y)}" r="19.5" fill="url(#r3-esfera)"/>
  <ellipse cx="${f(x - 6)}" cy="${f(y - 7)}" rx="5.5" ry="3.6" fill="#fff" fill-opacity=".9" transform="rotate(-35 ${f(x - 6)} ${f(y - 7)})"/>
  <path d="M${f(x - 12)} ${f(y + 9)}a15 15 0 0 0 24 0" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1.5"/>
</g>`;
const ROLAMENTO = `<svg class="pp__peca pp__rolamento" data-de="0" data-ate="1" ${V}>${DEFS}
  ${CHAO(210, 190)}
  <g class="pp__ext">
    <path fill-rule="evenodd" fill="url(#r3-aco)" d="${anel(172, 140)}"/>
    ${CHANFRO(171)}${SOMBRA(166, 2, 0.22)}${SOMBRA(141, 4, 0.5)}
    <path fill-rule="evenodd" fill="#20262d" fill-opacity=".55" d="${anel(147, 140)}"/>
    <path fill-rule="evenodd" fill="url(#r3-brilho)" d="${anel(172, 140)}"/>
  </g>
  <path class="pp__folga" fill-rule="evenodd" fill="#141920" d="${anel(140, 96)}"/>
  <g class="pp__rodar">
    <g class="pp__gaiola"><path fill-rule="evenodd" fill="url(#r3-gaiola)" d="${anel(127, 109)}"/>${roda(12, 118, (x, y) => `<circle cx="${f(x)}" cy="${f(y)}" r="24" fill="url(#r3-gaiola)"/>`)}${roda(12, 118, (x, y) => `<circle cx="${f(x)}" cy="${f(y)}" r="3.2" fill="#d5dbe0"/><circle cx="${f(x + 0.8)}" cy="${f(y + 0.8)}" r="3.2" fill="none" stroke="#000" stroke-opacity=".35"/>`, -75)}</g>
    <g class="pp__esferas">${roda(12, 118, ESFERA)}</g>
  </g>
  <g class="pp__int">
    <path fill-rule="evenodd" fill="url(#r3-aco2)" d="${anel(96, 62)}"/>
    ${SOMBRA(95, 4, 0.45)}${CHANFRO(90, 1.2)}${SOMBRA(64, 3, 0.4)}${CHANFRO(62.5, 1.2)}
    <path fill-rule="evenodd" fill="url(#r3-brilho)" d="${anel(96, 62)}"/>
  </g>
</svg>`;

/* 03 · o disco de travão perfurado: polido na pista, o chapéu mais escuro, furos chanfrados;
   a pinça laranja com dois parafusos, a sangria e a sombra no disco */
const FUROS = [118, 138, 156].map((r, k) => roda(18, r, (x, y) => `<circle cx="${f(x)}" cy="${f(y)}" r="5.6" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/><circle cx="${f(x)}" cy="${f(y)}" r="4.4" fill="#0f1318"/>`, -90 + k * 7)).join('');
const RISCOS = Array.from({ length: 24 }, (_, i) => 100 + i * 3).map((r, i) => `<circle r="${r}" fill="none" stroke="${i % 2 ? '#000' : '#fff'}" stroke-opacity="${i % 3 ? 0.05 : 0.09}" stroke-width="1.2"/>`).join('');
const DISCO = `<svg class="pp__peca pp__disco" data-de="2" data-ate="2" ${V}>
  ${CHAO(212, 190)}
  <g class="pp__rodar">
    <circle r="172" fill="url(#r3-disco)"/>${RISCOS}${FUROS}
    ${SOMBRA(171, 4, 0.5)}${CHANFRO(169, 1.2)}
    <circle r="96" fill="#2c3238"/><circle r="93" fill="url(#r3-chapeu)"/>${CHANFRO(80, 1)}
    ${roda(5, 56, (x, y) => `<circle cx="${f(x)}" cy="${f(y)}" r="11" fill="#5a636c"/><circle cx="${f(x)}" cy="${f(y)}" r="8.6" fill="#0d1115"/>`)}
    <circle r="30" fill="#5a636c"/><circle r="26" fill="#0b0f13"/>
  </g>
  <circle r="172" fill="url(#r3-brilho)"/>
  <path transform="translate(8 10)" fill="#000" fill-opacity=".35" d="${setor(128, 196, -78, 8)}"/>
  <path fill="#262b31" d="${setor(124, 130, -74, 4)}"/>
  <path fill="url(#r3-pinca)" d="${setor(128, 196, -78, 8)}"/>
  <path fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2" d="${setor(150, 184, -66, -4)}"/>
  <path fill="none" stroke="#5a2704" stroke-opacity=".5" stroke-width="1.5" d="${setor(129, 195, -77, 7)}"/>
  ${[-70, 0].map((a) => { const x = 178 * Math.cos((a * Math.PI) / 180), y = 178 * Math.sin((a * Math.PI) / 180); return `<circle cx="${f(x)}" cy="${f(y)}" r="9" fill="url(#r3-aco)"/><polygon fill="#2a3036" points="${roda(6, 5, (px, py) => `${f(x + px)},${f(y + py)} `)}"/>`; }).join('')}
  <circle cx="${f(160 * Math.cos(-0.6))}" cy="${f(160 * Math.sin(-0.6))}" r="4.5" fill="url(#r3-aco)"/>
</svg>`;

/* 04 · o kit de distribuição: correia com dentes, polias com ranhuras e cubo sextavado, o tensor liso */
const POLIA = ([x, y, r]: [number, number, number], i: number) => `<g transform="translate(${x} ${y})">
  <g class="pp__polia" style="--dur:${f(r / 6)}s">
    <circle r="${r}" fill="${i === 1 ? '#c9d0d7' : 'url(#r3-aco)'}"/>
    ${Array.from({ length: 3 }, (_, k) => SOMBRA(r - 3 - k * 4, 1, 0.18)).join('')}
    <circle r="${f(r * 0.78)}" fill="#59626c"/><circle r="${f(r * 0.74)}" fill="url(#r3-aco2)"/>
    ${i === 1 ? '' : roda(5, r * 0.5, (px, py) => `<circle cx="${f(px)}" cy="${f(py)}" r="${f(r * 0.15)}" fill="#0f1318"/><circle cx="${f(px)}" cy="${f(py)}" r="${f(r * 0.15 + 1.2)}" fill="none" stroke="#fff" stroke-opacity=".3"/>`)}
    <circle r="${f(r * 0.26)}" fill="#3f474f"/>
    <polygon fill="url(#r3-aco)" points="${roda(6, r * 0.18, (px, py) => `${f(px)},${f(py)} `)}"/>
    <circle r="${f(r * 0.07)}" fill="#0b0f13"/>
  </g>
  <circle r="${r}" fill="url(#r3-brilho)"/>
</g>`;
const DISTRIBUICAO = `<svg class="pp__peca pp__distribuicao" data-de="3" data-ate="3" ${V}>
  ${CHAO(232, 200)}
  <path d="${correia()}" fill="none" stroke="#111418" stroke-width="22" stroke-linejoin="round"/>
  <path d="${correia()}" fill="none" stroke="#2b3138" stroke-width="16" stroke-dasharray="4 5"/>
  <path d="${correia()}" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="2"/>
  ${POLIAS.map(POLIA).join('')}
</svg>`;

/* 05 · a chave de boca e luneta, cromada, gravada com a medida */
const CHAVE = `<svg class="pp__peca pp__chave" data-de="4" data-ate="4" ${V}>
  <defs><mask id="r3-chave-m"><rect x="-260" y="-260" width="520" height="520" fill="#fff"/>
    <polygon fill="#000" points="${roda(12, 26, (x, y, _a, i) => { const r = i % 2 ? 26 : 22; const k = r / 26; return `${f(x * k - 160)},${f(y * k)} `; })}"/>
    <path fill="#000" d="M150 -22 L215 -36 L215 36 L150 22 Z"/><circle cx="150" fill="#000" r="22"/>
  </mask></defs>
  ${CHAO(200, 210)}
  <g transform="rotate(-30)">
    <g mask="url(#r3-chave-m)">
      <rect x="-150" y="-18" width="300" height="36" rx="12" fill="url(#r3-cromado)"/>
      <rect x="-104" y="-9" width="208" height="18" rx="9" fill="#5d6771"/><rect x="-102" y="-7" width="204" height="14" rx="7" fill="url(#r3-cromado)" opacity=".8"/>
      <circle cx="-160" r="50" fill="url(#r3-cromado)"/><circle cx="160" r="52" fill="url(#r3-cromado)"/>
      <circle cx="-160" r="49" fill="none" stroke="#fff" stroke-opacity=".6"/><circle cx="160" r="51" fill="none" stroke="#fff" stroke-opacity=".6"/>
    </g>
    <text x="-60" y="4.5" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#3b434c" fill-opacity=".75" letter-spacing="1">22 MM · CR-V</text>
  </g>
</svg>`;

/* as fotografias da Romafe, uma por família (a 02 é o mesmo rolamento: fica o corredor) */
const FOTOS: [string, string][] = [[corredor, 'Caixas SKF, no armazém do Porto'], [corredor, 'Caixas SKF, no armazém do Porto'], [separacao, 'A separação, no Porto'], [fachada, 'A Romafe, Rua Eng. Ezequiel de Campos'], [oficina, 'Na oficina']];
const FUNDO = `<div class="pp__lua pp__lua--foto" aria-hidden="true">${FOTOS.map(([img, t], i) => `<figure data-cena="${i}"><img src="${img}" alt=""><figcaption>${t}</figcaption></figure>`).join('')}</div>`;

export const htmlPublicoV3 = paginaProdutos(ROLAMENTO + DISCO + DISTRIBUICAO + CHAVE, FUNDO, true, ' pp--real');
