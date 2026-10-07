/* =========================================================
   ROMAFE — editor do ecrã, o mesmo nas três apps
   Cada app diz quem é no <html>: data-app (erp, web, mobile),
   data-marca (o nome no canto) e data-tela (1440x900, 480x800…).
   Clicar numa peça e mudá-la no sítio, como numa tela de desenho.

   A regra que manda: o editor só oferece o que o manual tem.
   Não há selecionador de cor livre, não há caixa para escrever um
   número de folga. Escolhe-se um token, e o que sai é um token —
   por isso o CSS exportado nunca traz um valor inventado.
   ========================================================= */
import { mostrar } from './ecras';
import { fluxo } from './fluxo';
import { aplicar as aplicarTema, actual as temaActual } from './tema';

/** Uma peça do ecrã: um elemento HTML ou um ícone SVG. Os dois têm style e dataset. */
type Peca = HTMLElement | SVGElement;

type Estilos = Record<string, Record<string, string>>;
type Originais = { textos: Record<string, string>; classes: Record<string, string>; fotos: Record<string, string> };

type Passo =
  | { tipo: 'estilo'; seletor: string; propriedade: string; antes: string | undefined }
  | { tipo: 'texto'; seletor: string; antes: string | undefined }
  | { tipo: 'classe'; seletor: string; antes: string };

/* cada app guarda as suas alterações à parte: as do ERP não pintam o Mobile */
let APP = 'app';
let MARCA = 'ROMAFE';
let CHAVE = 'romafe:app:editor:v1';
const CHAVE_PAINEIS = 'romafe:editor:paineis';

/* ---------------- o que o manual permite ---------------- */

/* 02 §1.2: nenhum laranja serve de texto. Por isso a paleta de tinta
   não o tem — não é esquecimento. */
const TINTAS: [string, string][] = [
  ['--c-texto', 'Tinta principal'],
  ['--c-texto-2', 'Tinta secundária'],
  ['--c-texto-3', 'Tinta discreta'],
  ['--c-marca', 'Azul da marca'],
  ['--c-marca-forte', 'Azul premido'],
  ['--c-logotipo', 'Azul do logótipo'],
  ['--c-erro', 'Erro'],
  ['--c-ok', 'Estado bom'],
  ['--c-aviso', 'Aviso'],
  ['--c-entrada-tinta', 'Branco sobre foto'],
  ['--c-entrada-tinta-2', 'Branco discreto']
];

const FUNDOS: [string, string][] = [
  ['--c-superficie', 'Superfície'],
  ['--c-superficie-2', 'Superfície 2'],
  ['--c-superficie-3', 'Superfície 3'],
  ['--c-fundo', 'Fundo da página'],
  ['--c-marca', 'Azul da marca'],
  ['--c-marca-suave', 'Azul suave'],
  ['--c-acao', 'Laranja de ação'],
  ['--c-acao-traco', 'Laranja premido'],
  ['--c-erro', 'Erro'],
  ['--c-erro-suave', 'Erro suave'],
  ['--c-ok-suave', 'Bom suave'],
  ['--c-aviso-suave', 'Aviso suave'],
  ['--c-entrada-fundo', 'Superfície invertida']
];

/* O ícone é traço e preenchimento, não é texto. Por isso aqui o laranja
   entra — 02 §1.2 proíbe-o como tinta, não como traço. */
const CORES_ICONE: [string, string][] = [
  ['--c-marca-fundo', 'Azul ROMAFE'],
  ['--c-marca', 'Azul do tema'],
  ['--c-acao', 'Laranja de ação'],
  ['--c-acao-traco', 'Laranja escuro'],
  ['--c-texto', 'Tinta principal'],
  ['--c-texto-2', 'Tinta secundária'],
  ['--c-texto-3', 'Tinta discreta'],
  ['--c-entrada-tinta', 'Branco'],
  ['--c-erro', 'Erro'],
  ['--c-ok', 'Bom']
];
const TRACOS = ['1', '1.5', '2', '2.5', '3'];
const MEDIDAS = ['16px', '20px', '24px', '32px', '40px', '48px'];

const TAMANHOS = ['--t-xs', '--t-sm', '--t-md', '--t-lg', '--t-xl', '--t-2xl', '--t-3xl'];
const PESOS: [string, string][] = [['400', 'Normal'], ['600', 'Meio'], ['700', 'Forte']];
const RAIOS = ['0', '--r-sm', '--r-md', '--r-lg', '--r-full'];
const FOLGAS = ['0', '--e-1', '--e-2', '--e-3', '--e-4', '--e-5', '--e-6', '--e-7', '--e-8'];

/* 09 §2.1 — a variante vem da categoria da ação, não de uma cor solta.
   Trocar de variante troca a classe, e a cor vem atrás. */
const VARIANTES: [string, string][] = [
  ['btn--acao',     'Ação (laranja)'],
  ['btn--primario', 'Primário (azul)'],
  ['',              'Neutro'],
  ['btn--ghost',    'Fantasma'],
  ['btn--perigo',   'Destrutivo']
];
const CLASSES_VARIANTE = ['btn--acao', 'btn--primario', 'btn--ghost', 'btn--perigo'];

/* nomes legíveis para o painel de camadas */
const NOMES: Record<string, string> = {
  'entrada': 'Ecrã de entrada', 'topo': 'Barra de topo', 'palco': 'Palco',
  'discurso': 'Discurso', 'vantagens': 'Vantagens', 'vantagem': 'Vantagem',
  'cartao': 'Cartão de sessão', 'cartao__cabeca': 'Cabeça do cartão',
  'formulario': 'Formulário', 'campo': 'Campo', 'opcao': 'Caixa de verificação',
  'btn': 'Botão', 'apoio': 'Apoio', 'rodape': 'Rodapé', 'alerta': 'Alerta',
  'separador': 'Separador', 'segmented': 'Segmentado', 'input': 'Caixa de texto',
  'aba': 'Aba', 'paineis': 'Painéis', 'painel': 'Painel',
  'painel__cabeca': 'Cabeça do painel', 'painel__corpo': 'Corpo do painel',
  'painel__pe': 'Pé do painel', 'painel__titulo': 'Título do painel',
  'opcoes': 'Opções', 'ecra': 'Ecrã', 'cartao__nota': 'Nota do cartão',
  'lockup': 'Marca'
};

/* o texto de um botão diz mais do que a palavra "Botão" */
function rotuloCurto(alvo: Element): string {
  const t = (alvo.textContent || '').trim().replace(/\s+/g, ' ');
  if (!t || t.length > 24) return '';
  return t;
}

/* ---------------- estado ---------------- */
/* Como no Figma: o primeiro clique escolhe a peça inteira, e só o
   clique seguinte entra lá dentro. Sem isto, clicar num botão escolhia
   o texto do botão e a variante não aparecia. */
const COMPONENTES = '.lockup, .btn, .campo, .opcao, .vantagem, .apoio__item, .alerta, .separador, .segmented, .cartao, .topo, .rodape';

let estilos: Estilos = {};                     // seletor -> { propriedade: valor }
let textos: Record<string, string> = {};       // seletor -> texto
let classes: Record<string, string> = {};      // seletor -> lista de classes (a variante do botão)
let fotos: Record<string, string> = {};        // seletor -> nome do ficheiro de fundo trocado à mão
let historico: Passo[] = [];
/* O que a página era antes de o editor lhe tocar. Fica só em memória, e é
   apanhado antes de qualquer alteração, incluindo as que vêm guardadas do
   navegador — senão "repor tudo" repunha o estado guardado e não o original. */
let originais: Originais = { textos: {}, classes: {}, fotos: {} };

function lembrar(tipo: keyof Originais, sel: string, valor: string): void {
  if (originais[tipo][sel] === undefined) originais[tipo][sel] = valor;
}
let seleccionado: Peca | null = null;
let ligado = false;

let folha: HTMLStyleElement;
let painelEsq: HTMLElement;
let painelDir: HTMLElement;
let listaCamadas: HTMLElement;
let corpoProps: HTMLElement;
let dialogo: HTMLDialogElement;
let codigoDialogo: HTMLElement;
let avisoEl: HTMLElement | null = null;

/* o botão de cada camada sabe a que peça pertence */
const alvoDaCamada = new WeakMap<Element, Peca>();

/* ---------------- utilitários ---------------- */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string | null, texto?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (classe) n.className = classe;
  if (texto !== undefined) n.textContent = texto;
  return n;
}

/** o elemento de um evento, se for um elemento */
function alvoDe(ev: Event): Element | null {
  return ev.target instanceof Element ? ev.target : null;
}

function valorToken(v: string): string {
  return v.indexOf('--') === 0 ? 'var(' + v + ')' : v;
}

function corDoToken(token: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || '#888';
}

/* O rótulo que segue o rato. Os quadrados de cor e os degraus de escala
   não dizem o que são; a etiqueta diz o nome, o token e o valor. */
let dicaEl: HTMLElement;
function montarDica(): void {
  dicaEl = el('div', 'ed-dica-flutuante');
  dicaEl.setAttribute('role', 'tooltip');
  dicaEl.hidden = true;
  document.body.appendChild(dicaEl);

  document.addEventListener('mouseover', function (ev) {
    const alvo = alvoDe(ev)?.closest<HTMLElement>('[data-ed-dica]');
    if (!alvo) { dicaEl.hidden = true; return; }
    dicaEl.textContent = alvo.dataset.edDica ?? '';
    dicaEl.hidden = false;
    posicionar(alvo);
  }, true);

  document.addEventListener('mouseout', function (ev) {
    if (alvoDe(ev)?.closest('[data-ed-dica]')) dicaEl.hidden = true;
  }, true);
}

function posicionar(alvo: Element): void {
  const r = alvo.getBoundingClientRect();
  const l = dicaEl.getBoundingClientRect();
  const x = r.left + r.width / 2 - l.width / 2;
  let y = r.top - l.height - 8;
  if (y < 4) y = r.bottom + 8;
  dicaEl.style.left = Math.max(6, Math.min(x, window.innerWidth - l.width - 6)) + 'px';
  dicaEl.style.top = y + 'px';
}

function aviso(texto: string): void {
  if (avisoEl) avisoEl.remove();
  avisoEl = el('p', 'ed-aviso', texto);
  avisoEl.setAttribute('role', 'status');
  document.body.appendChild(avisoEl);
  window.setTimeout(function () { if (avisoEl) { avisoEl.remove(); avisoEl = null; } }, 1800);
}

/* Um seletor estável para o elemento: id se houver, senão o caminho
   de classes até ao ecrã, com :nth-of-type só quando é preciso. */
function ecraDe(alvo: Element): string {
  const e = alvo.closest<HTMLElement>('.ecra');
  return e?.dataset.ecra ?? 'entrada';
}

function seletor(alvo: Element): string {
  const ambito = '[data-ecra="' + ecraDe(alvo) + '"] ';
  if (alvo.id) return ambito + '#' + alvo.id;

  const partes: string[] = [];
  let n: Element | null = alvo;
  while (n && n !== document.body) {
    let parte = n.tagName.toLowerCase();
    /* num <svg>, className é um SVGAnimatedString e não uma string:
       lê-se o atributo, senão o seletor sai com "[object SVGAnimatedString]" */
    const cls = (n.getAttribute('class') || '').split(/\s+/)
      .filter(function (c) { return c && c.indexOf('ed-') !== 0 && c !== 'editando'; })
      .slice(0, 2);
    if (cls.length) parte += '.' + cls.join('.');

    /* Irmãos com o mesmo nome e as mesmas classes — três painéis
       iguais, três vantagens iguais — precisam da posição, senão a
       regra exportada apanha os três. */
    const pai: Element | null = n.parentElement;
    if (pai) {
      const atual: Element = n;
      const iguais = Array.from(pai.children).filter(function (f) {
        if (f.tagName !== atual.tagName) return false;
        if (!cls.length) return true;
        return cls.every(function (c) { return f.classList.contains(c); });
      });
      if (iguais.length > 1) parte += ':nth-of-type(' + (iguais.indexOf(n) + 1) + ')';
    }
    partes.unshift(parte);

    if (n.id) { partes[0] = '#' + n.id; break; }
    if (n.classList && n.classList.contains('ecra')) { partes.shift(); break; }
    n = pai;
  }

  let s = ambito + partes.join(' > ');
  // se ainda apanhar mais do que um, desempata pela posição
  try {
    const pai2 = alvo.parentElement;
    if (pai2 && document.querySelectorAll(s).length > 1) {
      const irmaos = Array.from(pai2.children).filter(function (f) { return f.tagName === alvo.tagName; });
      s += ':nth-of-type(' + (irmaos.indexOf(alvo) + 1) + ')';
    }
  } catch (e) { /* seletor inválido: fica como está */ }
  return s;
}

function nomeDe(alvo: Peca): string {
  if (alvo.dataset.edNome) return alvo.dataset.edNome;

  const cls = (alvo.getAttribute('class') || '').split(/\s+/);
  let base = '';
  for (let i = 0; i < cls.length && !base; i++) {
    const c = cls[i];
    if (NOMES[c]) base = NOMES[c];
    else {
      const raiz = c.split('__')[0].split('--')[0];
      if (NOMES[raiz]) base = NOMES[raiz] + (c.indexOf('__') > 0 ? ' · ' + c.split('__')[1] : '');
    }
  }

  if (!base) {
    if (alvo.tagName === 'svg') base = 'Ícone';
    else if (alvo.tagName === 'INPUT') base = 'Caixa de texto';
    else if (alvo.tagName === 'SELECT') base = 'Seleção';
    else if (alvo.tagName === 'BUTTON') base = 'Botão';
    else if (/^H[1-4]$/.test(alvo.tagName)) base = 'Título';
    else if (alvo.tagName === 'LABEL') base = 'Etiqueta';
  }

  const curto = rotuloCurto(alvo);
  if (!base) return curto || alvo.tagName.toLowerCase();
  if (curto && (alvo.tagName === 'BUTTON' || alvo.tagName === 'A' || alvo.children.length === 0)) {
    return base + ' · ' + curto;
  }
  return base;
}

/* ---------------- aplicar e guardar ---------------- */
function escrever(): void {
  const linhas: string[] = [];
  Object.keys(estilos).forEach(function (s) {
    const props = estilos[s];
    const corpo = Object.keys(props).map(function (p) { return '  ' + p + ': ' + props[p] + ';'; });
    if (corpo.length) linhas.push('.editando ' + s + ',\n' + s + ' {\n' + corpo.join('\n') + '\n}');
  });
  folha.textContent = linhas.join('\n\n');
  guardar();
}

function guardar(): void {
  try { localStorage.setItem(CHAVE, JSON.stringify({ estilos: estilos, textos: textos, classes: classes })); } catch (e) { /* sem armazenamento */ }
}

function carregar(): void {
  try {
    const g = JSON.parse(localStorage.getItem(CHAVE) || '{}') as { estilos?: Estilos; textos?: Record<string, string>; classes?: Record<string, string> };
    estilos = g.estilos || {};
    textos  = g.textos  || {};
    classes = g.classes || {};
  } catch (e) { estilos = {}; textos = {}; classes = {}; }

  Object.keys(classes).forEach(function (s) {
    try {
      const n = document.querySelector(s);
      if (n) { lembrar('classes', s, n.getAttribute('class') || ''); n.setAttribute('class', classes[s]); }
    } catch (e) { /* seletor que já não existe */ }
  });

  Object.keys(textos).forEach(function (s) {
    try {
      const n = document.querySelector(s);
      if (n) { lembrar('textos', s, n.textContent ?? ''); n.textContent = textos[s]; }
    } catch (e) { /* seletor que já não existe */ }
  });
  escrever();
}

function definir(alvo: Element, propriedade: string, valor: string | null): void {
  /* num ícone, mudar a largura sem mudar a altura deforma o desenho */
  if (propriedade === 'width' && alvo.tagName === 'svg') definir(alvo, 'height', valor);
  const s = seletor(alvo);
  if (!estilos[s]) estilos[s] = {};
  historico.push({ tipo: 'estilo', seletor: s, propriedade: propriedade, antes: estilos[s][propriedade] });
  if (valor === null) delete estilos[s][propriedade];
  else estilos[s][propriedade] = valor;
  escrever();
}

function anular(): void {
  const passo = historico.pop();
  if (!passo) { aviso('Não há nada para anular'); return; }

  if (passo.tipo === 'estilo') {
    if (!estilos[passo.seletor]) estilos[passo.seletor] = {};
    if (passo.antes === undefined) delete estilos[passo.seletor][passo.propriedade];
    else estilos[passo.seletor][passo.propriedade] = passo.antes;
    escrever();
  } else if (passo.tipo === 'texto') {
    const n = document.querySelector(passo.seletor);
    if (n) n.textContent = passo.antes ?? '';
    if (passo.antes === undefined) delete textos[passo.seletor];
    else textos[passo.seletor] = passo.antes;
    guardar();
  } else if (passo.tipo === 'classe') {
    const m = document.querySelector(passo.seletor);
    if (m) m.setAttribute('class', passo.antes);
    classes[passo.seletor] = passo.antes;
    guardar();
  }
  pintarProps();
  aviso('Anulado');
}

function reporTudo(): void {
  /* devolve o texto, as classes e a fotografia ao que eram */
  Object.keys(originais.textos).forEach(function (s) {
    try { const n = document.querySelector(s); if (n) n.textContent = originais.textos[s]; } catch (e) { /* seletor perdido */ }
  });
  Object.keys(originais.classes).forEach(function (s) {
    try { const n = document.querySelector(s); if (n) n.setAttribute('class', originais.classes[s]); } catch (e) { /* seletor perdido */ }
  });
  Object.keys(originais.fotos).forEach(function (s) {
    try { const n = document.querySelector<HTMLElement>(s); if (n) n.style.backgroundImage = originais.fotos[s]; } catch (e) { /* seletor perdido */ }
  });

  estilos = {}; textos = {}; classes = {}; fotos = {};
  originais = { textos: {}, classes: {}, fotos: {} };
  historico = [];
  try { localStorage.removeItem(CHAVE); } catch (e) { /* sem armazenamento */ }

  escrever();
  seleccionar(null);
  construirCamadas();
  aviso('Voltou tudo ao original — texto, variantes e fotografia');
}

/* ---------------- mover ----------------
   A peça move-se com transform: translate, e não com margens ou com
   position. Assim nada à volta se desarruma, e o que sai no CSS é uma
   linha só que se pode copiar para o produto. */
function lerPosicao(alvo: Element): { x: number; y: number } {
  const v = (estilos[seletor(alvo)] || {})['transform'] || '';
  const m = v.match(/translate\(\s*(-?\d+(?:\.\d+)?)px\s*,\s*(-?\d+(?:\.\d+)?)px\s*\)/);
  return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 0, y: 0 };
}

function mover(alvo: Element, x: number, y: number): void {
  if (!x && !y) definir(alvo, 'transform', null);
  else definir(alvo, 'transform', 'translate(' + Math.round(x) + 'px, ' + Math.round(y) + 'px)');
}

let arrasto: { alvo: Peca; x0: number; y0: number; bx: number; by: number; moveu: boolean } | null = null;
let engoleClique = false, mudouNoMousedown = false;

function comecarArrasto(ev: MouseEvent): void {
  if (!ligado || ev.button !== 0) return;
  const destino = alvoDe(ev);
  if (!destino || ehMoldura(destino)) return;
  if (destino.getAttribute('contenteditable') === 'true') return;

  const alvo = candidata(destino);
  if (!alvo) return;

  /* O mousedown já escolhe. Se escolheu agora, o clique que vem a seguir
     não pode entrar dentro da peça: seria escolher e entrar no mesmo gesto. */
  mudouNoMousedown = alvo !== seleccionado;
  if (mudouNoMousedown) seleccionar(alvo);

  const base = lerPosicao(alvo);
  arrasto = { alvo: alvo, x0: ev.clientX, y0: ev.clientY, bx: base.x, by: base.y, moveu: false };
  ev.preventDefault();
}

function durante(ev: MouseEvent): void {
  if (!arrasto) return;
  const dx = ev.clientX - arrasto.x0, dy = ev.clientY - arrasto.y0;
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) arrasto.moveu = true;
  /* enquanto se arrasta é estilo em linha: é mais rápido do que reescrever
     a folha a cada pixel, e no fim apaga-se */
  arrasto.alvo.style.transform = 'translate(' + (arrasto.bx + dx) + 'px, ' + (arrasto.by + dy) + 'px)';
}

function largar(ev: MouseEvent): void {
  if (!arrasto) return;
  const a = arrasto; arrasto = null;
  a.alvo.style.transform = '';
  if (!a.moveu) return;
  engoleClique = true;
  mover(a.alvo, a.bx + (ev.clientX - a.x0), a.by + (ev.clientY - a.y0));
  pintarProps();
}

/* ---------------- seleção ---------------- */
function seleccionar(alvo: Peca | null): void {
  if (seleccionado) seleccionado.removeAttribute('data-ed-sel');
  seleccionado = alvo || null;
  if (seleccionado) seleccionado.setAttribute('data-ed-sel', '');
  marcarCamada();
  pintarProps();
}

function marcarCamada(): void {
  const botoes = listaCamadas.querySelectorAll('.ed-camada');
  for (let i = 0; i < botoes.length; i++) {
    botoes[i].setAttribute('aria-current', String(alvoDaCamada.get(botoes[i]) === seleccionado));
  }
}

/* ---------------- painel de camadas ---------------- */
const IGNORAR: Record<string, 1> = { SCRIPT: 1, STYLE: 1, BR: 1, PATH: 1, CIRCLE: 1, RECT: 1, LINE: 1, DIALOG: 1 };

function construirCamadas(): void {
  listaCamadas.textContent = '';
  const raiz = ecraVisivel();
  if (!raiz) return;

  (function andar(no: Element, nivel: number): void {
    for (let i = 0; i < no.children.length; i++) {
      const f = no.children[i] as Peca;
      if (IGNORAR[f.tagName]) continue;
      if (f.closest('.ed-painel')) continue;

      f.setAttribute('data-ed-alvo', '');

      if (nivel <= 3) {
        const b = el('button', 'ed-camada');
        b.type = 'button';
        b.style.paddingLeft = (12 + nivel * 12) + 'px';
        alvoDaCamada.set(b, f);
        b.appendChild(el('span', 'ed-camada__icone', f.tagName === 'svg' ? '◇' : '▢'));
        b.appendChild(el('span', 'ed-camada__nome', nomeDe(f)));
        b.addEventListener('click', function () { seleccionar(f); f.scrollIntoView({ block: 'center' }); });
        listaCamadas.appendChild(b);
      }
      if (f.tagName !== 'svg') andar(f, nivel + 1);
    }
  })(raiz, 0);
}

function ecraVisivel(): Element | null {
  const e = document.querySelector('.ecra:not([hidden])');
  return e || document.querySelector('.ecra');
}

function trocarEcra(nome: string): void {
  mostrar(nome);
  seleccionar(null);
  construirCamadas();
  window.scrollTo(0, 0);
}

/* ---------------- painel de propriedades ---------------- */
function seccao(titulo: string): HTMLDivElement {
  const s = el('div', 'ed-seccao');
  s.appendChild(el('p', 'ed-seccao__titulo', titulo));
  return s;
}

function grelhaTokens(lista: [string, string][], propriedade: string, comNenhum: boolean): HTMLDivElement {
  const g = el('div', 'ed-tokens');
  const alvo = seleccionado;
  if (!alvo) return g;
  const s = seletor(alvo);
  const actual = (estilos[s] || {})[propriedade];

  if (comNenhum) {
    const nada = el('button', 'ed-token ed-token--nenhum');
    nada.type = 'button';
    nada.dataset.edDica = 'Sem cor própria — herda de quem está por cima';
    nada.setAttribute('aria-pressed', String(!actual));
    nada.addEventListener('click', function () { definir(alvo, propriedade, null); pintarProps(); });
    g.appendChild(nada);
  }

  lista.forEach(function (par) {
    const token = par[0], nome = par[1];
    const b = el('button', 'ed-token');
    b.type = 'button';
    b.dataset.edDica = nome + '  ·  ' + token + '  ·  ' + corDoToken(token);
    b.style.background = 'var(' + token + ')';
    b.setAttribute('aria-pressed', String(actual === 'var(' + token + ')'));
    b.addEventListener('click', function () { definir(alvo, propriedade, 'var(' + token + ')'); pintarProps(); });
    g.appendChild(b);
  });
  return g;
}

function degraus(lista: string[], propriedade: string, rotulo?: (v: string) => string): HTMLDivElement {
  const linha = el('div', 'ed-degraus');
  const alvo = seleccionado;
  if (!alvo) return linha;
  const s = seletor(alvo);
  const actual = (estilos[s] || {})[propriedade];

  lista.forEach(function (v) {
    const b = el('button', 'ed-degrau', rotulo ? rotulo(v) : v.replace('--', '').replace(/^[te]-/, ''));
    b.type = 'button';
    b.dataset.edDica = descreverDegrau(v, propriedade);
    b.setAttribute('aria-pressed', String(actual === valorToken(v)));
    b.addEventListener('click', function () { definir(alvo, propriedade, valorToken(v)); pintarProps(); });
    linha.appendChild(b);
  });
  return linha;
}

/* "--t-lg · 1.125rem · 18px" — o nome, o valor e o que isso dá em píxeis */
function descreverDegrau(v: string, propriedade: string): string {
  if (v.indexOf('--') !== 0) {
    return propriedade === 'font-weight' ? 'Peso ' + v : v + 'px';
  }
  const bruto = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  let px = '';
  if (bruto.indexOf('rem') > 0) px = '  ·  ' + Math.round(parseFloat(bruto) * 16) + 'px';
  return v + '  ·  ' + bruto + px;
}

function pintarProps(): void {
  corpoProps.textContent = '';

  const alvoEl = document.querySelector('.ed-painel--dir .ed-alvo-nome');
  const alvo = seleccionado;

  if (!alvo) {
    if (alvoEl) alvoEl.textContent = '—';
    corpoProps.appendChild(el('p', 'ed-vazio', emFluxo()
      ? 'No mapa não se edita. Clica num ecrã para o abrir, ou volta a «Ecrãs» em baixo do seletor.'
      : 'Clica numa peça do ecrã, ou escolhe-a nas camadas à esquerda.'));
    return;
  }

  if (alvoEl) alvoEl.textContent = nomeDe(alvo);

  /* --- para onde leva, no protótipo e no mapa --- */
  const comLigacao = alvo.closest<HTMLElement>('[data-ir]');
  if (comLigacao) {
    const destino = comLigacao.dataset.ir ?? '';
    const destinoEl = document.querySelector<HTMLElement>('.ecra[data-ecra="' + destino + '"]');
    const sl = seccao('Leva a');
    sl.appendChild(el('p', 'ed-dica', destinoEl ? (destinoEl.dataset.nome || destino) : 'Ecrã que não existe: ' + destino));
    if (comLigacao.hasAttribute('data-sem-seta')) sl.appendChild(el('p', 'ed-dica', 'Repete-se em todos os ecrãs, por isso não tem seta no mapa.'));
    if (destinoEl) {
      const bIr = el('button', 'ed-botao', 'Ir para lá');
      bIr.type = 'button';
      bIr.addEventListener('click', function () { irPara(destino); });
      sl.appendChild(bIr);
    }
    corpoProps.appendChild(sl);
  }

  /* --- variante, só para botões (09 §2) --- */
  if (alvo.classList.contains('btn')) {
    const sv = seccao('Variante');
    const sel = el('select', 'ed-select');
    VARIANTES.forEach(function (par) {
      const o = el('option', null, par[1]);
      o.value = par[0];
      const tem = par[0] ? alvo.classList.contains(par[0]) : CLASSES_VARIANTE.every(function (c) { return !alvo.classList.contains(c); });
      if (tem) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () {
      const sc2 = seletor(alvo);
      lembrar('classes', sc2, alvo.getAttribute('class') || '');
      historico.push({ tipo: 'classe', seletor: sc2, antes: alvo.getAttribute('class') || '' });
      CLASSES_VARIANTE.forEach(function (c) { alvo.classList.remove(c); });
      if (sel.value) alvo.classList.add(sel.value);
      classes[sc2] = alvo.getAttribute('class') || '';
      guardar();
      pintarProps();
    });
    const l = el('div', 'ed-linha');
    l.appendChild(el('label', null, 'Categoria'));
    l.appendChild(sel);
    sv.appendChild(l);
    sv.appendChild(el('p', 'ed-dica', 'A cor vem da variante. Um botão não muda de cor sozinho: muda de categoria, e a cor vem atrás — 09 §2.'));
    corpoProps.appendChild(sv);
  }

  /* --- texto --- */
  const so = alvo.children.length === 0 && (alvo.textContent || '').trim();
  if (so) {
    const st = seccao('Texto');
    const ta = el('textarea', 'ed-texto');
    ta.value = alvo.textContent ?? '';
    ta.addEventListener('change', function () {
      const s2 = seletor(alvo);
      lembrar('textos', s2, alvo.textContent ?? '');
      historico.push({ tipo: 'texto', seletor: s2, antes: textos[s2] !== undefined ? textos[s2] : (alvo.textContent ?? '') });
      alvo.textContent = ta.value;
      textos[s2] = ta.value;
      guardar();
      construirCamadas();
      marcarCamada();
    });
    st.appendChild(ta);
    corpoProps.appendChild(st);
  }

  /* --- tinta --- */
  const sc = seccao('Tinta');
  sc.appendChild(grelhaTokens(TINTAS, 'color', true));
  sc.appendChild(el('p', 'ed-dica', 'Não há laranja nesta paleta: o laranja é fundo, traço e preenchimento, nunca tinta — 02 §1.2.'));
  corpoProps.appendChild(sc);

  /* --- fundo --- */
  const sf = seccao('Fundo');
  sf.appendChild(grelhaTokens(FUNDOS, 'background-color', true));
  corpoProps.appendChild(sf);

  /* --- letra --- */
  const sl = seccao('Letra');
  const lt = el('div', 'ed-linha');
  lt.appendChild(el('label', null, 'Tamanho'));
  lt.appendChild(degraus(TAMANHOS, 'font-size', function (v) { return v.replace('--t-', ''); }));
  sl.appendChild(lt);

  const lp = el('div', 'ed-linha');
  lp.appendChild(el('label', null, 'Peso'));
  lp.appendChild(degraus(PESOS.map(function (p) { return p[0]; }), 'font-weight'));
  sl.appendChild(lp);
  sl.appendChild(el('p', 'ed-dica', 'Sete tamanhos, e não há oitavo — 04 §2.'));
  corpoProps.appendChild(sl);

  /* --- forma e folga --- */
  const sg = seccao('Forma e folga');
  const lr = el('div', 'ed-linha');
  lr.appendChild(el('label', null, 'Raio'));
  lr.appendChild(degraus(RAIOS, 'border-radius', function (v) { return v === '0' ? '0' : v.replace('--r-', ''); }));
  sg.appendChild(lr);

  const lf = el('div', 'ed-linha');
  lf.appendChild(el('label', null, 'Folga'));
  lf.appendChild(degraus(FOLGAS, 'padding', function (v) { return v === '0' ? '0' : v.replace('--e-', ''); }));
  sg.appendChild(lf);

  const estilo = getComputedStyle(alvo);
  if (estilo.display === 'flex' || estilo.display === 'grid' || estilo.display === 'inline-flex') {
    const lg = el('div', 'ed-linha');
    lg.appendChild(el('label', null, 'Espaço'));
    lg.appendChild(degraus(FOLGAS, 'gap', function (v) { return v === '0' ? '0' : v.replace('--e-', ''); }));
    sg.appendChild(lg);
  }
  sg.appendChild(el('p', 'ed-dica', 'Escala de 4pt, oito degraus — 07 §7.'));
  corpoProps.appendChild(sg);

  /* --- ícone --- */
  if (alvo.tagName === 'svg') {
    const si = seccao('Ícone');
    si.appendChild(grelhaTokens(CORES_ICONE, 'color', false));

    const lt2 = el('div', 'ed-linha');
    lt2.appendChild(el('label', null, 'Traço'));
    lt2.appendChild(degraus(TRACOS, 'stroke-width'));
    si.appendChild(lt2);

    const lm = el('div', 'ed-linha');
    lm.appendChild(el('label', null, 'Tamanho'));
    lm.appendChild(degraus(MEDIDAS, 'width', function (v) { return v.replace('px', ''); }));
    si.appendChild(lm);

    si.appendChild(el('p', 'ed-dica', 'A cor do ícone é o traço, e por isso pode ser laranja. O que nunca é laranja é a letra — 02 §1.2.'));
    corpoProps.insertBefore(si, corpoProps.firstChild);
  }

  /* --- fotografia de fundo do ecrã --- */
  if (alvo.classList.contains('palco__foto')) {
    corpoProps.insertBefore(seccaoFotografia(alvo), corpoProps.firstChild);
  }

  /* --- a peça em si --- */
  const sp = seccao('Peça');

  const lv = el('div', 'ed-linha');
  lv.appendChild(el('label', null, 'Visível'));
  const escondida = getComputedStyle(alvo).display === 'none';
  const bv = el('button', 'ed-degrau', escondida ? 'Mostrar' : 'Esconder');
  bv.type = 'button';
  bv.dataset.edDica = escondida
    ? 'Traz a peça de volta ao ecrã'
    : 'Tira a peça do ecrã sem a apagar. Volta por aqui ou pelas camadas.';
  bv.addEventListener('click', function () {
    definir(alvo, 'display', escondida ? 'block' : 'none');
    pintarProps();
  });
  lv.appendChild(bv);
  sp.appendChild(lv);

  const la = el('div', 'ed-linha');
  la.appendChild(el('label', null, 'Alinhar'));
  la.appendChild(degraus(['left', 'center', 'right'], 'text-align', function (v) {
    return v === 'left' ? 'esq' : v === 'center' ? 'centro' : 'dir';
  }));
  sp.appendChild(la);

  const pos = lerPosicao(alvo);
  const lpos = el('div', 'ed-linha');
  lpos.appendChild(el('label', null, 'Posição'));
  const caixaPos = el('div', 'ed-coords');

  /* X e Y escrevem-se à mão. Arrastar é o mesmo valor, com o rato. */
  const coord = function (eixo: 'x' | 'y', valor: number): HTMLLabelElement {
    const env = el('label', 'ed-coord');
    env.appendChild(el('span', null, eixo.toUpperCase()));
    const campo = el('input', 'ed-select');
    campo.type = 'number';
    campo.step = '1';
    campo.value = String(valor);
    campo.dataset.edDica = 'Deslocamento em píxeis a partir do sítio de origem';
    campo.addEventListener('change', function () {
      const p3 = lerPosicao(alvo);
      const x = eixo === 'x' ? parseFloat(campo.value || '0') : p3.x;
      const y = eixo === 'y' ? parseFloat(campo.value || '0') : p3.y;
      mover(alvo, x, y);
      pintarProps();
    });
    env.appendChild(campo);
    return env;
  };

  caixaPos.appendChild(coord('x', pos.x));
  caixaPos.appendChild(coord('y', pos.y));
  const bpos = el('button', 'ed-degrau', 'Repor');
  bpos.type = 'button';
  bpos.dataset.edDica = 'Devolve a peça ao sítio de origem';
  bpos.addEventListener('click', function () { mover(alvo, 0, 0); pintarProps(); });
  caixaPos.appendChild(bpos);
  lpos.appendChild(caixaPos);
  sp.appendChild(lpos);

  const ls = el('div', 'ed-linha');
  ls.appendChild(el('label', null, 'Sombra'));
  ls.appendChild(degraus(['none', '--s-1', '--s-2', '--s-3'], 'box-shadow', function (v) {
    return v === 'none' ? 'sem' : v.replace('--s-', 's');
  }));
  sp.appendChild(ls);
  corpoProps.appendChild(sp);

  corpoProps.appendChild(seccaoCss(alvo));

  /* --- repor esta peça --- */
  const sr = el('div', 'ed-seccao');
  const br = el('button', 'ed-botao', 'Repor esta peça');
  br.type = 'button';
  br.addEventListener('click', function () {
    const s3 = seletor(alvo);
    historico.push({ tipo: 'estilo', seletor: s3, propriedade: '*', antes: undefined });
    delete estilos[s3];
    escrever(); pintarProps();
  });
  sr.appendChild(br);
  corpoProps.appendChild(sr);
}

/* A fotografia do ecrã de entrada: ver qual é, trocá-la, ajustá-la
   e decidir quanto é que o véu a escurece. */
function seccaoFotografia(alvo: Peca): HTMLDivElement {
  const sf = seccao('Fotografia de fundo');

  const pre = el('div', 'ed-foto');
  pre.style.backgroundImage = getComputedStyle(alvo).backgroundImage;
  sf.appendChild(pre);

  const nome = el('p', 'ed-dica', fotos[seletor(alvo)] || 'img/armazem.webp');
  sf.appendChild(nome);

  const rotulo = el('label', 'ed-botao ed-botao--accao ed-ficheiro', 'Trocar fotografia');
  const ficheiro = el('input');
  ficheiro.type = 'file';
  ficheiro.accept = 'image/*';
  ficheiro.addEventListener('change', function () {
    const f = ficheiro.files && ficheiro.files[0];
    if (!f) return;
    const leitor = new FileReader();
    leitor.onload = function () {
      lembrar('fotos', seletor(alvo), alvo.style.backgroundImage || '');
      alvo.style.backgroundImage = 'url(' + String(leitor.result) + ')';
      fotos[seletor(alvo)] = f.name;
      pintarProps();
      aviso('Fotografia trocada — o ficheiro fica só neste separador');
    };
    leitor.readAsDataURL(f);
  });
  rotulo.appendChild(ficheiro);
  sf.appendChild(rotulo);

  const lj = el('div', 'ed-linha');
  lj.appendChild(el('label', null, 'Ajuste'));
  lj.appendChild(degraus(['cover', 'contain'], 'background-size', function (v) {
    return v === 'cover' ? 'preencher' : 'caber';
  }));
  sf.appendChild(lj);

  const lp = el('div', 'ed-linha');
  lp.appendChild(el('label', null, 'Posição'));
  lp.appendChild(degraus(['top', 'center', 'bottom'], 'background-position', function (v) {
    return v === 'top' ? 'topo' : v === 'center' ? 'centro' : 'base';
  }));
  sf.appendChild(lp);

  /* o véu é irmão da fotografia: é ele que faz o texto branco ler-se */
  const veu = alvo.parentElement?.querySelector('.palco__veu');
  if (veu) {
    const lvu = el('div', 'ed-linha');
    lvu.appendChild(el('label', null, 'Véu'));
    const linha = el('div', 'ed-degraus');
    const sv = seletor(veu);
    [['0', 'sem'], ['0.5', 'leve'], ['0.8', 'médio'], ['1', 'cheio']].forEach(function (par) {
      const b = el('button', 'ed-degrau', par[1]);
      b.type = 'button';
      b.dataset.edDica = 'Opacidade do véu: ' + par[0];
      const actual = (estilos[sv] || {})['opacity'];
      b.setAttribute('aria-pressed', String(actual === par[0] || (!actual && par[0] === '1')));
      b.addEventListener('click', function () { definir(veu, 'opacity', par[0]); pintarProps(); });
      linha.appendChild(b);
    });
    lvu.appendChild(linha);
    sf.appendChild(lvu);
    sf.appendChild(el('p', 'ed-dica', 'Sem véu, o texto branco deixa de se ler sobre a fotografia clara — 17 §1.'));
  }
  return sf;
}

/* ---------------- o CSS da peça escolhida ----------------
   Mostra o que a peça é agora, não o que o editor lhe fez. Onde o valor
   bater certo com um token, aparece o nome do token: é assim que se vê
   se uma peça está no sistema ou fora dele. */
const PROPRIEDADES: [string, string][] = [
  ['font-family', 'font-family'], ['font-size', 'font-size'], ['font-weight', 'font-weight'],
  ['line-height', 'line-height'], ['letter-spacing', 'letter-spacing'],
  ['color', 'color'], ['background-color', 'background-color'],
  ['border', 'border'], ['border-radius', 'border-radius'],
  ['box-shadow', 'box-shadow'], ['padding', 'padding'], ['gap', 'gap'],
  ['display', 'display'], ['width', 'width'], ['height', 'height'],
  ['stroke-width', 'stroke-width'], ['transform', 'transform']
];
const VAZIOS = ['none', 'normal', '0px', 'auto', 'rgba(0, 0, 0, 0)', 'matrix(1, 0, 0, 1, 0, 0)', '0', ''];

function hexParaRgb(h: string): string | null {
  h = h.trim();
  if (h.indexOf('#') !== 0 || (h.length !== 7 && h.length !== 4)) return null;
  if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  return 'rgb(' + parseInt(h.slice(1, 3), 16) + ', ' + parseInt(h.slice(3, 5), 16) + ', ' + parseInt(h.slice(5, 7), 16) + ')';
}

/* Uma família por propriedade. Sem isto, 16px de altura de linha vinha
   dado como var(--r-lg), que é um raio, só porque calha ter o mesmo valor. */
const FAMILIAS: Record<string, () => string[]> = {
  'color':            function () { return TINTAS.concat(CORES_ICONE).map(function (p) { return p[0]; }); },
  'background-color': function () { return FUNDOS.map(function (p) { return p[0]; }); },
  'font-size':        function () { return TAMANHOS; },
  'border-radius':    function () { return RAIOS; },
  'padding':          function () { return FOLGAS; },
  'gap':              function () { return FOLGAS; }
};

function tokenPara(propriedade: string, valor: string): string | null {
  const fam = FAMILIAS[propriedade];
  if (!fam) return null;
  const nomes = fam();
  for (let i = 0; i < nomes.length; i++) {
    const t = nomes[i];
    if (t.indexOf('--') !== 0) continue;
    const v = getComputedStyle(document.documentElement).getPropertyValue(t).trim();
    if (!v) continue;
    if (v === valor) return t;
    if (hexParaRgb(v) === valor) return t;
    if (v.indexOf('rem') > 0 && (parseFloat(v) * 16) + 'px' === valor) return t;
  }
  return null;
}

function cssDaPeca(alvo: Element): string {
  const estilo = getComputedStyle(alvo);
  const linhas = [seletor(alvo) + ' {'];

  PROPRIEDADES.forEach(function (par) {
    let v = estilo.getPropertyValue(par[1]);
    if (!v) return;
    v = v.trim();
    if (VAZIOS.indexOf(v) >= 0) return;
    if (par[1] === 'font-family') v = v.split(',')[0].replace(/["']/g, '');
    if (par[1] === 'border' && v.indexOf('0px') === 0) return;
    const token = tokenPara(par[1], v);
    linhas.push('  ' + par[0] + ': ' + (token ? 'var(' + token + ')  /* ' + v + ' */' : v) + ';');
  });

  linhas.push('}');

  const meus = estilos[seletor(alvo)];
  if (meus && Object.keys(meus).length) {
    linhas.push('', '/* do que mudaste aqui: */');
    Object.keys(meus).forEach(function (k) { linhas.push('  ' + k + ': ' + meus[k] + ';'); });
  }
  return linhas.join('\n');
}

function seccaoCss(alvo: Element): HTMLDivElement {
  const sc = seccao('CSS da peça');
  const pre = el('pre', 'ed-css');
  pre.textContent = cssDaPeca(alvo);
  sc.appendChild(pre);

  const b = el('button', 'ed-botao', 'Copiar este CSS');
  b.type = 'button';
  b.addEventListener('click', function () {
    if (navigator.clipboard) navigator.clipboard.writeText(pre.textContent ?? '').then(function () { aviso('CSS da peça copiado'); });
  });
  sc.appendChild(b);
  return sc;
}

/* ---------------- exportar ---------------- */
function cssFinal(): string {
  const partes = ['/* ' + MARCA + ' — alterações feitas no editor.',
                  '   Só tokens: nenhum valor aqui foi inventado. */', ''];

  Object.keys(estilos).forEach(function (s) {
    const props = estilos[s];
    const chaves = Object.keys(props);
    if (!chaves.length) return;
    partes.push(s + ' {');
    chaves.forEach(function (p) { partes.push('  ' + p + ': ' + props[p] + ';'); });
    partes.push('}', '');
  });

  const chavesFoto = Object.keys(fotos);
  if (chavesFoto.length) {
    partes.push('/* Fotografia trocada — grava o ficheiro na pasta img/ da app e aponta o url:');
    chavesFoto.forEach(function (s) { partes.push('   ' + s + '  →  ' + fotos[s]); });
    partes.push('*/', '');
  }

  const chavesClasse = Object.keys(classes);
  if (chavesClasse.length) {
    partes.push('/* Variante trocada — isto muda a classe no HTML, não o CSS:');
    chavesClasse.forEach(function (s) { partes.push('   ' + s + '  →  class="' + classes[s] + '"'); });
    partes.push('*/', '');
  }

  const chavesTexto = Object.keys(textos);
  if (chavesTexto.length) {
    partes.push('/* Texto alterado — isto muda no HTML, não no CSS:');
    chavesTexto.forEach(function (s) { partes.push('   ' + s + '  →  "' + textos[s] + '"'); });
    partes.push('*/');
  }

  if (partes.length <= 3) partes.push('/* Ainda não mudaste nada. */');
  return partes.join('\n');
}

/* ---------------- abrir e fechar os painéis ----------------
   Fechado, o painel sai do caminho e a tela fica com o ecrã inteiro.
   Fica um botão encostado à margem para o trazer de volta. */
type Lado = 'esq' | 'dir';

function estadoPaineis(): Partial<Record<Lado, boolean>> {
  try { return JSON.parse(localStorage.getItem(CHAVE_PAINEIS) || '{}') as Partial<Record<Lado, boolean>>; } catch (e) { return {}; }
}

function alternarPainel(lado: Lado, fechar?: boolean): void {
  const e = estadoPaineis();
  if (fechar === undefined) fechar = !e[lado];
  e[lado] = fechar;
  try { localStorage.setItem(CHAVE_PAINEIS, JSON.stringify(e)); } catch (err) { /* sem armazenamento */ }
  document.body.classList.toggle('ed-sem-' + lado, !!fechar);
}

function botaoFechar(lado: Lado, seta: string): HTMLButtonElement {
  const b = el('button', 'ed-fechar', seta);
  b.type = 'button';
  b.dataset.edDica = 'Fechar este painel';
  b.setAttribute('aria-label', 'Fechar o painel');
  b.addEventListener('click', function () { alternarPainel(lado, true); });
  return b;
}

function botaoAbrir(lado: Lado, seta: string, titulo: string): void {
  const b = el('button', 'ed-abrir ed-abrir--' + lado, seta);
  b.type = 'button';
  b.dataset.edDica = 'Abrir ' + titulo;
  b.setAttribute('aria-label', 'Abrir ' + titulo);
  b.addEventListener('click', function () { alternarPainel(lado, false); });
  document.body.appendChild(b);
}

/* ---------------- montagem ---------------- */
function montar(): void {
  folha = el('style');
  folha.id = 'ed-alteracoes';
  document.head.appendChild(folha);

  /* painel esquerdo: ecrãs e camadas */
  painelEsq = el('aside', 'ed-painel ed-painel--esq');
  const cabecaE = el('div', 'ed-cabeca');
  const marca = el('p', 'ed-cabeca__marca', MARCA);
  marca.style.margin = '0';
  cabecaE.appendChild(marca);
  cabecaE.appendChild(el('h2', null, 'Camadas'));
  cabecaE.appendChild(botaoFechar('esq', '‹'));
  painelEsq.appendChild(cabecaE);

  const barraEcras = el('div', 'ed-ecras');
  barraEcras.appendChild(el('label', null, 'Ecrã'));
  const selEcras = el('select', 'ed-select');
  /* agrupados pelo fluxo a que pertencem, como no mapa */
  const ecras = document.querySelectorAll<HTMLElement>('.ecra');
  let grupo: HTMLOptGroupElement | null = null;
  for (let i = 0; i < ecras.length; i++) {
    const fl = ecras[i].dataset.fluxo || '';
    if (!grupo || grupo.label !== fl) {
      grupo = el('optgroup');
      grupo.label = fl;
      selEcras.appendChild(grupo);
    }
    const o = el('option', null, ecras[i].dataset.nome || ecras[i].dataset.ecra);
    o.value = ecras[i].dataset.ecra ?? '';
    if (!ecras[i].hidden) o.selected = true;
    grupo.appendChild(o);
  }
  selEcras.addEventListener('change', function () { trocarEcra(selEcras.value); });
  barraEcras.appendChild(selEcras);
  painelEsq.appendChild(barraEcras);

  /* Um ecrã de cada vez, ou o mapa com todos e as setas entre eles */
  const vistas = el('div', 'ed-degraus ed-vistas');
  [['ecras', 'Ecrãs'], ['fluxo', 'Fluxo']].forEach(function (par) {
    const b = el('button', 'ed-degrau', par[1]);
    b.type = 'button';
    b.dataset.vista = par[0];
    b.dataset.edDica = par[0] === 'fluxo' ? 'Todos os ecrãs, com as setas de onde cada peça leva' : 'Um ecrã de cada vez, para editar';
    b.setAttribute('aria-pressed', String(par[0] === 'ecras'));
    b.addEventListener('click', function () { abrirFluxo(par[0] === 'fluxo'); });
    vistas.appendChild(b);
  });
  painelEsq.appendChild(vistas);

  listaCamadas = el('div', 'ed-corpo');
  painelEsq.appendChild(listaCamadas);

  const peE = el('div', 'ed-pe');
  const bCss = el('button', 'ed-botao ed-botao--accao', 'Ver o CSS');
  bCss.type = 'button';
  bCss.addEventListener('click', abrirDialogo);
  const bAnular = el('button', 'ed-botao', 'Anular');
  bAnular.type = 'button';
  bAnular.addEventListener('click', anular);
  const bRepor = el('button', 'ed-botao', 'Repor tudo');
  bRepor.type = 'button';
  bRepor.addEventListener('click', reporTudo);
  peE.appendChild(bCss); peE.appendChild(bAnular); peE.appendChild(bRepor);

  /* o tema muda-se aqui, porque na tela o clique escolhe peças */
  const temaBarra = el('div', 'ed-degraus');
  ([['light', 'Claro'], ['dark', 'Escuro'], ['auto', 'Auto']] as const).forEach(function (par) {
    const b = el('button', 'ed-degrau', par[1]);
    b.type = 'button';
    b.dataset.edDica = 'Ver o ecrã no tema ' + par[1].toLowerCase();
    b.addEventListener('click', function () {
      aplicarTema(par[0]);
      const irmaos = temaBarra.querySelectorAll('.ed-degrau');
      for (let k = 0; k < irmaos.length; k++) irmaos[k].setAttribute('aria-pressed', String(irmaos[k] === b));
      pintarProps();
    });
    if (temaActual() === par[0]) b.setAttribute('aria-pressed', 'true');
    temaBarra.appendChild(b);
  });
  peE.appendChild(temaBarra);
  painelEsq.appendChild(peE);

  /* painel direito: propriedades */
  painelDir = el('aside', 'ed-painel ed-painel--dir');
  const cabecaD = el('div', 'ed-cabeca');
  cabecaD.appendChild(el('h2', null, 'Propriedades'));
  const nome = el('span', 'ed-alvo-nome', '—');
  nome.style.color = 'var(--ed-tinta-3)';
  cabecaD.appendChild(nome);
  cabecaD.appendChild(botaoFechar('dir', '›'));
  painelDir.appendChild(cabecaD);

  corpoProps = el('div', 'ed-corpo');
  painelDir.appendChild(corpoProps);

  document.body.appendChild(painelEsq);
  document.body.appendChild(painelDir);

  botaoAbrir('esq', '›', 'as camadas');
  botaoAbrir('dir', '‹', 'as propriedades');
  const guardado = estadoPaineis();
  alternarPainel('esq', !!guardado.esq);
  alternarPainel('dir', !!guardado.dir);

  /* diálogo do CSS */
  dialogo = el('dialog', 'ed-dialogo');
  const topoD = el('div', 'ed-dialogo__topo');
  topoD.appendChild(el('h2', null, 'O que mudaste'));
  const bFechar = el('button', 'ed-botao', 'Fechar');
  bFechar.type = 'button';
  bFechar.addEventListener('click', function () { dialogo.close(); });
  topoD.appendChild(bFechar);
  const pre = el('pre');
  const code = el('code');
  pre.appendChild(code);
  const accoesD = el('div', 'ed-dialogo__accoes');
  const bCopiar = el('button', 'ed-botao ed-botao--accao', 'Copiar');
  bCopiar.type = 'button';
  bCopiar.addEventListener('click', function () {
    const t = code.textContent ?? '';
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { aviso('CSS copiado'); });
  });
  accoesD.appendChild(bCopiar);
  dialogo.appendChild(topoD); dialogo.appendChild(pre); dialogo.appendChild(accoesD);
  codigoDialogo = code;
  document.body.appendChild(dialogo);
}

/* ---------------- o mapa ----------------
   No mapa a tela não se edita: os ecrãs estão a um quarto do tamanho, e
   clicar num deles volta aos ecrãs com esse aberto. */
function emFluxo(): boolean { return fluxo.activo(); }

function abrirFluxo(sim: boolean): void {
  if (sim === emFluxo()) return;
  if (sim) {
    seleccionar(null);
    ligado = false;
    document.body.classList.add('ed-fluxo');
    fluxo.ligar({ aoEscolher: function (nome) { abrirFluxo(false); irPara(nome); } });
  } else {
    fluxo.desligar();
    document.body.classList.remove('ed-fluxo');
    ligado = true;
    construirCamadas();
  }
  const bs = painelEsq.querySelectorAll<HTMLElement>('.ed-vistas .ed-degrau');
  for (let k = 0; k < bs.length; k++) bs[k].setAttribute('aria-pressed', String((bs[k].dataset.vista === 'fluxo') === sim));
  const h = location.hash.replace(/^#/, '').split('&').filter(function (p) { return p && p.indexOf('doc=') !== 0; });
  if (sim) h.unshift('doc=fluxo');
  try { history.replaceState(null, '', h.length ? '#' + h.join('&') : location.pathname); } catch (e) { /* sem história */ }
  pintarProps();
}

function abrirDialogo(): void {
  codigoDialogo.textContent = cssFinal();
  dialogo.showModal();
}

/* Enquanto se edita, o ecrã não funciona como ecrã: um clique escolhe
   a peça e mais nada. Senão o botão submetia o formulário a cada escolha. */
/* A moldura do editor não é tela: cliques nela passam como cliques normais.
   Sem isto, o botão de reabrir um painel ficava morto, porque o editor
   engolia o clique antes de ele chegar lá. */
function ehMoldura(no: Element | null): boolean {
  return !!(no && (no.closest('.ed-painel') || no.closest('.ed-dialogo') ||
            no.closest('.ed-abrir') || no.closest('.ed-aviso') || no.closest('.ed-dica-flutuante')));
}

/* a peça que um clique aqui escolheria */
function candidata(destino: Element): Peca | null {
  const fundo = destino.closest<HTMLElement | SVGElement>('[data-ed-alvo]');
  if (!fundo) return null;
  const peca = destino.closest<HTMLElement | SVGElement>(COMPONENTES);
  const jaLaDentro = peca && seleccionado && (seleccionado === peca || peca.contains(seleccionado));
  return jaLaDentro || !peca ? fundo : peca;
}

let sobre: Element | null = null;
function realcar(ev: MouseEvent): void {
  if (!ligado) return;
  if (sobre) { sobre.removeAttribute('data-ed-hover'); sobre = null; }
  const destino = alvoDe(ev);
  if (!destino || ehMoldura(destino)) return;
  const c = candidata(destino);
  if (c && c !== seleccionado) { c.setAttribute('data-ed-hover', ''); sobre = c; }
}

function interceptar(ev: MouseEvent): void {
  if (!ligado) return;
  const destino = alvoDe(ev);
  if (!destino || ehMoldura(destino)) return;
  if (destino.getAttribute('contenteditable') === 'true') return;

  ev.preventDefault();
  ev.stopPropagation();

  /* o clique que fecha um arrasto não muda a seleção */
  if (engoleClique) { engoleClique = false; return; }
  if (mudouNoMousedown) { mudouNoMousedown = false; return; }

  const escolha = candidata(destino);
  if (escolha) seleccionar(escolha);
}

/** Abre um ecrã no editor (sai do mapa, se for preciso). */
export function irPara(nome: string): void {
  if (emFluxo()) abrirFluxo(false);
  const picker = painelEsq && painelEsq.querySelector<HTMLSelectElement>('.ed-ecras select');
  if (picker) picker.value = nome;
  trocarEcra(nome);
}

/** Liga o editor. O main chama-o depois de pôr os ecrãs no DOM. */
export function iniciar(): void {
  /* A tela abre em edição. A única saída é «#so=ecra», que não é um modo
     de ver: é o que o gerador fotografa, e o que se mostra numa reunião
     sem ter a moldura do editor pelo meio. */
  if (/(^|[#&])so=(ecra|fluxo)\b/.test(location.hash)) return;

  APP = document.documentElement.dataset.app || 'app';
  MARCA = document.documentElement.dataset.marca || 'ROMAFE';
  CHAVE = 'romafe:' + APP + ':editor:v1';

  ligado = true;
  document.body.classList.add('editando');

  montar();
  montarDica();
  carregar();
  construirCamadas();
  pintarProps();

  document.addEventListener('click', interceptar, true);
  document.addEventListener('mouseover', realcar, true);
  document.addEventListener('mousedown', comecarArrasto, true);
  document.addEventListener('mousemove', durante, true);
  document.addEventListener('mouseup', largar, true);
  document.addEventListener('submit', function (ev) { if (ligado) ev.preventDefault(); }, true);

  /* duplo clique escreve no sítio */
  document.addEventListener('dblclick', function (ev) {
    if (!ligado) return;
    const alvo = alvoDe(ev)?.closest<HTMLElement | SVGElement>('[data-ed-alvo]');
    if (!alvo || alvo.children.length) return;
    alvo.setAttribute('contenteditable', 'true');
    alvo.focus();
    const s = seletor(alvo);
    const antes = alvo.textContent ?? '';
    lembrar('textos', s, antes);
    alvo.addEventListener('blur', function sair() {
      alvo.removeAttribute('contenteditable');
      alvo.removeEventListener('blur', sair);
      if (alvo.textContent !== antes) {
        historico.push({ tipo: 'texto', seletor: s, antes: antes });
        textos[s] = alvo.textContent ?? '';
        guardar();
      }
    });
  }, true);

  if (/(^|[#&])doc=fluxo\b/.test(location.hash)) abrirFluxo(true);

  document.addEventListener('keydown', function (ev) {
    if (!ligado) return;
    if (ev.key === 'Escape') seleccionar(null);
    if ((ev.ctrlKey || ev.metaKey) && ev.key === 'z') { ev.preventDefault(); anular(); }

    /* setas movem a peça: um pixel, ou oito com Shift */
    const setas: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const seta = setas[ev.key];
    if (seleccionado && seta && !alvoDe(ev)?.closest('.ed-painel')) {
      ev.preventDefault();
      const passo = ev.shiftKey ? 8 : 1;
      const p2 = lerPosicao(seleccionado);
      mover(seleccionado, p2.x + seta[0] * passo, p2.y + seta[1] * passo);
      pintarProps();
    }
  });
}
