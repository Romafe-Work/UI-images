/* =========================================================
   ROMAFE — o mapa de navegação, o mesmo nas três apps

   Põe os ecrãs todos numa tela, uma linha por fluxo (data-fluxo), e
   desenha uma seta de cada peça com data-ir para o ecrã a que leva.
   Não há um segundo desenho: mudar uma ligação no ecrã muda a seta.

   Duas maneiras de o abrir:
     #doc=fluxo   o botão «Fluxo» do editor. Clicar num ecrã abre-o para editar
     #so=fluxo    só o mapa, sem editor

   A peça que leva a algum lado fica contornada a azul, e a seta sai dela.
   Para o ecrã ao lado vai direita; para mais longe, para trás ou para
   outra linha segue pelos corredores entre os ecrãs, para não os tapar.

   As peças que se repetem em todos os ecrãs levam data-sem-seta: navegam
   no protótipo e ficam fora do mapa, senão as setas repetidas tapavam as
   que dizem alguma coisa.
   ========================================================= */
import type { App } from './tipos';

const LIGACAO = '[data-ir]:not([data-sem-seta])';
const NS = 'http://www.w3.org/2000/svg';
const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2];

interface Opcoes { aoEscolher?: (nome: string) => void }
interface Lugar { ecra: HTMLElement; marcador: Comment; hidden: boolean }
interface Caixa { x: number; y: number; l: number; a: number; readonly d: number; readonly b: number; readonly cy: number }
interface Info { quadro: Caixa; linha: number; ordem: number; topoLinha: number; inicioFila: number }

let app: App | null = null;
let chaveZoom = 'romafe:app:fluxo:zoom';
let tela: HTMLElement | null = null;
let mapa: HTMLElement | null = null;
let svg: SVGSVGElement | null = null;
let zoom = 1;
let opcoes: Opcoes = {};
let lugares: Lugar[] = [];         // para devolver cada ecrã ao sítio

/** A app diz o tamanho da tela e a descrição dos fluxos. */
export function configurar(a: App): void {
  app = a;
  chaveZoom = 'romafe:' + a.id + ':fluxo:zoom';
  const raiz = document.documentElement;
  raiz.style.setProperty('--tela-l', a.tela.l + 'px');
  raiz.style.setProperty('--tela-a', a.tela.a + 'px');
  /* no mapa, um ecrã de computador vai a um quarto; um de telemóvel, que já
     é estreito, vai a metade, para se ler */
  raiz.style.setProperty('--tela-escala', a.tela.l <= 600 ? '.5' : '.25');
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string | null, txt?: string | null): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
}

function ligar(o?: Opcoes): void {
  if (mapa) return;
  opcoes = o || {};
  try { zoom = parseFloat(localStorage.getItem(chaveZoom) || '') || 0; } catch { zoom = 0; }

  const t = tela = el('div', 'fluxo-tela');
  const cabeca = el('header', 'fluxo__cabeca');
  cabeca.appendChild(el('h1', 'fluxo__titulo', 'Mapa de navegação — ' + (app ? app.marca : 'ROMAFE')));
  const leg = el('p', 'fluxo__legenda');
  leg.appendChild(el('span', 'fluxo__amostra'));
  leg.appendChild(document.createTextNode(
    'Contornado a azul: o que leva a outro ecrã. A seta diz a qual. ' +
    'O que se repete em todos os ecrãs não se desenha.' +
    (opcoes.aoEscolher ? ' Clica num ecrã para o abrir.' : '')));
  cabeca.appendChild(leg);
  if (opcoes.aoEscolher) cabeca.appendChild(controlosZoom());
  t.appendChild(cabeca);

  const m = mapa = el('div', 'fluxo');
  t.appendChild(m);

  /* uma linha por fluxo, pela ordem em que os ecrãs aparecem */
  const ecras = Array.from(document.querySelectorAll<HTMLElement>('.ecra'));
  const linhas: Record<string, HTMLElement> = {};
  lugares = [];
  ecras.forEach((ecra) => {
    const marcador = document.createComment('ecra:' + ecra.dataset.ecra);
    ecra.parentNode?.insertBefore(marcador, ecra);
    lugares.push({ ecra, marcador, hidden: ecra.hidden === true });
    ecra.hidden = false;

    const nomeLinha = ecra.dataset.fluxo || 'Sem fluxo';
    let linha = linhas[nomeLinha];
    if (!linha) {
      linha = el('section', 'fluxo__linha');
      const cab = el('div', 'fluxo__cabeca-linha');
      cab.appendChild(el('h2', 'fluxo__rotulo', nomeLinha));
      const d = app?.fluxos[nomeLinha];
      if (d) cab.appendChild(el('p', 'fluxo__descricao', d));
      linha.appendChild(cab);
      linha.appendChild(el('div', 'fluxo__fila'));
      m.appendChild(linha);
      linhas[nomeLinha] = linha;
    }

    const cartao = el('figure', 'fluxo__cartao');
    cartao.dataset.ecra = ecra.dataset.ecra;
    const quadro = el('div', 'fluxo__quadro');
    quadro.appendChild(ecra);
    cartao.appendChild(quadro);
    const leg2 = el('figcaption', 'fluxo__legenda-ecra');
    leg2.appendChild(el('p', 'fluxo__nome', ecra.dataset.nome || ecra.dataset.ecra));
    if (ecra.dataset.objetivo) leg2.appendChild(el('p', 'fluxo__objetivo', ecra.dataset.objetivo));
    cartao.appendChild(leg2);
    const aoEscolher = opcoes.aoEscolher;
    if (aoEscolher) {
      cartao.title = 'Abrir «' + (ecra.dataset.nome || '') + '»';
      cartao.addEventListener('click', () => aoEscolher(ecra.dataset.ecra || ''));
    }
    linha.querySelector('.fluxo__fila')?.appendChild(cartao);
  });

  const s = svg = document.createElementNS(NS, 'svg');
  s.setAttribute('class', 'fluxo__setas');
  s.setAttribute('aria-hidden', 'true');
  m.appendChild(s);

  document.body.appendChild(t);
  document.body.classList.add('com-fluxo');

  if (!zoom) zoom = ajuste();
  aplicarZoom(zoom, true);
  desenhar();
  /* as fontes e a fotografia mudam as medidas depois do primeiro desenho */
  document.fonts?.ready.then(desenhar);
  window.setTimeout(desenhar, 400);
  window.addEventListener('resize', desenhar);
  t.addEventListener('wheel', rodaComCtrl, { passive: false });
}

function desligar(): void {
  if (!mapa) return;
  lugares.forEach((l) => {
    l.marcador.parentNode?.insertBefore(l.ecra, l.marcador);
    l.marcador.remove();
    l.ecra.hidden = l.hidden;
  });
  lugares = [];
  window.removeEventListener('resize', desenhar);
  tela?.remove();
  tela = mapa = null;
  svg = null;
  document.body.classList.remove('com-fluxo');
}

/* ---------------- zoom ---------------- */
function controlosZoom(): HTMLElement {
  const z = el('div', 'fluxo__zoom');
  z.innerHTML =
    '<button type="button" data-z="-" title="Afastar (Ctrl + roda)">−</button>' +
    '<button type="button" data-z="1" class="fluxo__zoom-valor" title="Voltar a 100 %"></button>' +
    '<button type="button" data-z="+" title="Aproximar (Ctrl + roda)">+</button>' +
    '<button type="button" data-z="ajustar" title="Caber na largura">Ajustar</button>';
  z.addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest<HTMLButtonElement>('button');
    if (!b) return;
    const q = b.dataset.z;
    if (q === '1') aplicarZoom(1);
    else if (q === 'ajustar') aplicarZoom(ajuste());
    else passo(q === '+' ? 1 : -1);
  });
  return z;
}

function passo(sentido: 1 | -1): void {
  const lista = sentido > 0 ? ZOOMS : ZOOMS.slice().reverse();
  const z = lista.find((v) => (sentido > 0 ? v > zoom + 0.001 : v < zoom - 0.001));
  if (z !== undefined) aplicarZoom(z);
}

function ajuste(): number {
  if (!mapa) return 1;
  const antes = mapa.style.zoom;
  mapa.style.zoom = '1';
  const natural = mapa.scrollWidth || 1;
  mapa.style.zoom = antes;
  const livre = (tela?.clientWidth || window.innerWidth) - 8;
  return Math.max(0.2, Math.min(1, Math.floor(livre / natural * 100) / 100));
}

function aplicarZoom(z: number, semGuardar?: boolean): void {
  zoom = Math.max(0.2, Math.min(2, Math.round(z * 100) / 100));
  if (mapa) mapa.style.zoom = String(zoom);
  const v = tela?.querySelector('.fluxo__zoom-valor');
  if (v) v.textContent = Math.round(zoom * 100) + '%';
  if (!semGuardar && opcoes.aoEscolher) { try { localStorage.setItem(chaveZoom, String(zoom)); } catch { /* sem armazenamento */ } }
}

function rodaComCtrl(ev: WheelEvent): void {
  if (!ev.ctrlKey && !ev.metaKey) return;
  ev.preventDefault();
  aplicarZoom(zoom * Math.exp(-ev.deltaY * 0.002));
}

/* ---------------- as setas ---------------- */
/* Medidas em unidades do mapa: o retângulo no ecrã, dividido pelo zoom. */
function caixa(n: Element, base: DOMRect): Caixa {
  const r = n.getBoundingClientRect();
  return {
    x: (r.left - base.left) / zoom, y: (r.top - base.top) / zoom,
    l: r.width / zoom, a: r.height / zoom,
    get d() { return this.x + this.l; }, get b() { return this.y + this.a; },
    get cy() { return this.y + this.a / 2; },
  };
}

function no<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  return n;
}

function desenhar(): void {
  if (!mapa || !svg) return;
  const m = mapa, s = svg;
  const base = m.getBoundingClientRect();
  s.textContent = '';
  s.setAttribute('width', String(m.scrollWidth));
  s.setAttribute('height', String(m.scrollHeight));
  s.style.width = m.scrollWidth + 'px';
  s.style.height = m.scrollHeight + 'px';

  const defs = no('defs', {});
  const marca = no('marker', { id: 'fluxo-ponta', viewBox: '0 0 10 10', refX: 9, refY: 5,
                               markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
  marca.appendChild(no('path', { d: 'M0 0 10 5 0 10z', fill: 'currentColor' }));
  defs.appendChild(marca);
  s.appendChild(defs);

  const cartoes = Array.from(m.querySelectorAll<HTMLElement>('.fluxo__cartao'));
  const porNome: Record<string, HTMLElement> = {};
  const info: Record<string, Info> = {};
  const linhasEl = Array.from(m.querySelectorAll('.fluxo__linha'));
  cartoes.forEach((c) => {
    const linha = c.closest('.fluxo__linha') as HTMLElement;
    const fila = linha.querySelector('.fluxo__fila') as HTMLElement;
    const nome = c.dataset.ecra || '';
    porNome[nome] = c;
    info[nome] = {
      quadro: caixa(c.querySelector('.fluxo__quadro') as Element, base),
      linha: linhasEl.indexOf(linha),
      ordem: Array.prototype.indexOf.call(fila.children, c),
      topoLinha: caixa(linha, base).y,
      /* o primeiro ecrã, e não a fila: a fila começa com o corredor */
      inicioFila: caixa(fila.firstElementChild as Element, base).x,
    };
  });

  const G = 120;                              // o vão entre ecrãs, ver .fluxo__fila
  const faixas: Record<number, number> = {};  // linha -> quantas faixas já usadas
  const saidas: Record<string, number> = {};  // ecrã -> setas que já saíram pelo vão da direita
  const entradas: Record<string, number> = {};// ecrã -> setas que já entraram pelo vão da esquerda

  function faixa(linha: number): number {
    const k = faixas[linha] = (faixas[linha] || 0) + 1;
    const primeiro = Object.values(info).find((i) => i.linha === linha) as Info;
    return primeiro.topoLinha + 18 + ((k - 1) % 8) * 11;
  }

  cartoes.forEach((c) => {
    const nome = c.dataset.ecra || '';
    const orig = info[nome];
    c.querySelectorAll<HTMLElement>(LIGACAO).forEach((peca) => {
      const alvo = peca.dataset.ir || '';
      const destino = porNome[alvo];
      if (!destino || destino === c) return;
      const dest = info[alvo];
      const p = caixa(peca, base);
      if (!p.l || !p.a) return;      // escondida: não há de onde sair

      s.appendChild(no('rect', { class: 'fluxo__alvo', x: p.x - 2, y: p.y - 2, width: p.l + 4, height: p.a + 4, rx: 3 }));

      const q = dest.quadro, o = orig.quadro;
      const ty = Math.max(q.y + 14, Math.min(q.b - 14, p.cy));
      const ks = saidas[nome] = (saidas[nome] || 0) + 1;
      const ke = entradas[alvo] = (entradas[alvo] || 0) + 1;
      const xs = o.d + G / 2 - 18 + ((ks - 1) % 6) * 7;
      const xe = q.x - G / 2 + 18 - ((ke - 1) % 6) * 7;
      let d: string;

      if (dest.linha === orig.linha && dest.ordem === orig.ordem + 1) {
        /* o vizinho da direita: direita a ele */
        d = `M${p.d} ${p.cy} H${xs} V${ty} H${q.x}`;
      } else if (dest.linha === orig.linha) {
        const y1 = faixa(orig.linha);
        d = `M${p.d} ${p.cy} H${xs} V${y1} H${xe} V${ty} H${q.x}`;
      } else {
        /* outra linha: sobe à faixa da linha, vai ao corredor da esquerda,
           desce à faixa da linha de destino e entra pelo vão */
        const ya = faixa(orig.linha), yb = faixa(dest.linha);
        const xc = Math.min(orig.inicioFila, dest.inicioFila) - 30 - (((faixas[orig.linha] || 1) - 1) % 5) * 9;
        d = `M${p.d} ${p.cy} H${xs} V${ya} H${xc} V${yb} H${xe} V${ty} H${q.x}`;
      }
      s.appendChild(no('path', { d, 'marker-end': 'url(#fluxo-ponta)' }));
    });
  });
}

export const fluxo = {
  ligar,
  desligar,
  activo: (): boolean => !!mapa,
  desenhar,
};
