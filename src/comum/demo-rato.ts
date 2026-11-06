/* =========================================================
   ROMAFE — a demonstração com o rato (27 out. 2026)
   Ela: «quero que na demonstração apareça um rato a clicar nos botões para o meu chefe ver e perceber o flow». Um
   roteiro (passos registados pela app) leva um rato desenhado até ao botão de cada passo, mostra o clique e clica a
   sério — a navegação é a do protótipo (data-ir), por isso o que se vê é o que a pessoa faria. Uma legenda curta diz
   o que se está a fazer e em que passo se vai.
   Abre-se com «Ver o fluxo com o rato» na barra da demonstração, ou com &rato=1 no endereço (para mandar a quem não
   vai mexer). Esc ou «Parar» acabam. Com «reduzir movimento», o rato salta em vez de deslizar.
   O rato e a legenda são popovers (camada de cima do navegador): ficam por cima também dos diálogos (o «Ver como»).
   ========================================================= */
import { mostrar, mostrarVersao } from './ecras';

export interface Passo {
  /** o ecrã onde o passo começa (se não for o que se vê, o roteiro vai lá) */
  ecra?: string;
  /** o que se clica: um seletor dentro do ecrã que se vê (ou do diálogo aberto) */
  clicar?: string;
  /** escolher um valor num select em vez de clicar */
  escolher?: [string, string];
  /** 28 out. (ERP): o alvo está no separador ativo da área de trabalho (um iframe da mesma origem), e não na página de cima */
  separador?: boolean | string;
  /** a legenda do passo */
  legenda: string;
  /** espera a mais, depois do passo (ms) */
  pausa?: number;
  /** 28 out. (ela: «o fluxo com o rato em mobile também deve representar todos os cenários de todos os ecrãs»): vai a este
      ecrã — clica a ligação verdadeira (data-ir / data-depois) quando o ecrã que se vê a tem; senão mostra-o, como um estado */
  ir?: string;
  /** 6 nov. (ERP, a área de trabalho): arrasta de um elemento até um ponto (calculado já com o arrasto a decorrer, porque as
      guias de acoplar só aparecem nessa altura). O rato desce, leva e larga, com os eventos de ponteiro verdadeiros. */
  arrastar?: { de: string; para: () => { x: number; y: number } | null };
  /** prime uma combinação de teclas («Control+B», «Control+K Control+P»); um selo mostra-a junto do rato */
  tecla?: string;
  /** escreve num campo, letra a letra */
  escrever?: [string, string];
}
type Fonte = Passo[] | (() => Passo[]);
const ROTEIROS = new Map<string, { titulo: string; passos: Fonte; semTexto?: boolean; papel?: string; ecras?: string[] }>();
/** 28 out.: `semTexto` — só o rato e os cliques, sem a legenda (ela: «no erp com rato mas sem texto»). */
/** 2 nov.: `papel` — a função a que o roteiro pertence (a Pick); a barra agrupa por ela e começa na do ecrã que se vê. */
export function registarRoteiro(id: string, titulo: string, passos: Fonte, o: { semTexto?: boolean; papel?: string; ecras?: string[] } = {}): void { ROTEIROS.set(id, { titulo, passos, ...o }); }
/** Os roteiros registados, pela ordem do registo: [id, título, função]. */
export const roteiros = (): [string, string, string?][] => [...ROTEIROS].map(([id, r]) => [id, r.titulo, r.papel]);
/* 2 nov. (ela: «faz isso para todas as roles do PDA»): os casos que mostram este ecrã, para o «Ver o fluxo com o rato» escolher
   sozinho; a lista de cada roteiro é gerada (scripts/roteiro-ecras.mjs) */
export const juntarEcras = (mapa: Record<string, string[]>): void => { for (const [id, ecras] of Object.entries(mapa)) { const r = ROTEIROS.get(id); if (r) r.ecras = ecras; } };
export const roteirosDoEcra = (ecra: string): [string, string][] => [...ROTEIROS].filter(([, r]) => r.ecras?.includes(ecra)).map(([id, r]) => [id, r.titulo]);
export const temRoteiro = () => ROTEIROS.size > 0;

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const dormir = (ms: number) => new Promise<void>((ok) => window.setTimeout(ok, ms));
const SETA = '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M4 2 L4 19 L8.6 14.8 L11.6 21.4 L14.6 20 L11.6 13.6 L18 13.6 Z" fill="#fff" stroke="#102333" stroke-width="1.6" stroke-linejoin="round"/></svg>';

let ativo = false, parar = false;
let rato: HTMLElement | null = null, legenda: HTMLElement | null = null;
let x = 0, y = 0;

function montar(): void {
  rato = document.createElement('div'); rato.className = 'demo-rato'; rato.setAttribute('popover', 'manual'); rato.setAttribute('aria-hidden', 'true');
  rato.innerHTML = `${SETA}<i class="demo-rato__clique"></i>`;
  legenda = document.createElement('div'); legenda.className = 'demo-legenda'; legenda.setAttribute('popover', 'manual'); legenda.setAttribute('role', 'status'); legenda.setAttribute('aria-live', 'polite');
  legenda.innerHTML = '<p class="demo-legenda__passo"></p><p class="demo-legenda__t"></p><button type="button" class="demo-legenda__parar">Parar (Esc)</button>';
  legenda.querySelector('button')!.addEventListener('click', () => { parar = true; });
  document.body.append(rato, legenda);
  x = innerWidth / 2; y = innerHeight * .7; rato.style.transform = `translate(${x}px, ${y}px)`;
}
/** Os dois voltam para cima de tudo (um diálogo aberto depois deles ficava por cima). */
function aoCimo(): void {
  [rato, legenda].forEach((el) => { if (!el) return; try { if (el.matches(':popover-open')) el.hidePopover(); el.showPopover(); } catch { /* sem popover: ficam com z-index */ } });
}
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden])');
/** O documento do separador que se vê (o iframe visível do ecrã), quando o há. */
function doSeparador(): Document | null {
  /* o que está mesmo à frente: os separadores escondidos podem continuar com tamanho, por baixo do ativo */
  const f = [...document.querySelectorAll<HTMLIFrameElement>('.ecra:not([hidden]) iframe')].find((x) => {
    const r = x.getBoundingClientRect(); if (!r.width || !r.height) return false;
    return document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, 200)) === x;
  });
  try { return f?.contentDocument ?? null; } catch { return null; }
}
/** 6 nov.: com os ecrãs lado a lado, o passo pode dizer qual (o seletor do iframe dele). */
function doQuadro(sel: string): Document | null { try { return document.querySelector<HTMLIFrameElement>(sel)?.contentDocument ?? null; } catch { return null; } }
function alvo(sel: string, separador: boolean | string = false): HTMLElement | null {
  const doc = typeof separador === 'string' ? doQuadro(separador) : separador ? doSeparador() : document; if (!doc) return null;
  const d = doc.querySelector<HTMLElement>('dialog[open]');
  const el = (d?.querySelector<HTMLElement>(sel)) ?? doc.querySelector<HTMLElement>(`.ecra:not([hidden]) > .versao:not([hidden]) ${sel}`) ?? (separador ? doc.querySelector<HTMLElement>(sel) : null);
  /* 6 nov.: no Início v3 a barra de ações do ecrã está por cima, na área de trabalho; o rato vai à de cima */
  return (el && doc !== document && (window as unknown as { ideEspelho?: (e: Element) => HTMLElement | null }).ideEspelho?.(el)) || el;
}
/** Onde o documento do elemento começa na janela de cima (0,0 na própria página; o canto do iframe num separador). */
function origem(el: HTMLElement): [number, number] {
  if (el.ownerDocument === document) return [0, 0];
  const f = [...document.querySelectorAll<HTMLIFrameElement>('iframe')].find((x) => { try { return x.contentDocument === el.ownerDocument; } catch { return false; } });
  const r = f?.getBoundingClientRect(); return r ? [r.left, r.top] : [0, 0];
}
/** 28 out. (ela: «melhora o fluxo no erp!!!»): o scrollIntoView rolava também a página de cima (o cabeçalho do ERP fugia
    a meio do fluxo). Agora só rola a caixa que tem o elemento, e só se ele estiver tapado (pela caixa ou pela barra). */
function aVista(el: HTMLElement): boolean {
  const [, oy] = origem(el), barra = document.querySelector('.demo-barra')?.getBoundingClientRect().top ?? innerHeight;
  const r = el.getBoundingClientRect(), fundo = Math.min(barra - oy - 12, el.ownerDocument.defaultView?.innerHeight ?? innerHeight);
  for (let p = el.parentElement; p; p = p.parentElement) {
    const cs = getComputedStyle(p), raiz = p === el.ownerDocument.documentElement;
    /* 6 nov.: a área de trabalho do ERP ocupa a janela e já fica por cima da barra: a página de cima não rola */
    if (raiz && el.ownerDocument === document && el.closest('[data-ide]')) break;
    if (!raiz && !/(auto|scroll)/.test(cs.overflowY)) continue;
    if (p.scrollHeight <= p.clientHeight + 1) { if (raiz) break; continue; }
    const q = raiz ? { top: 0, bottom: fundo } : p.getBoundingClientRect(), baixo = Math.min(q.bottom, fundo);
    if (r.top >= q.top + 4 && r.bottom <= baixo - 4) return false;
    p.scrollBy({ top: r.top - q.top - (baixo - q.top - r.height) / 2, behavior: quieto() ? 'auto' : 'smooth' });
    return true;
  }
  return false;
}
async function mover(el: HTMLElement): Promise<void> {
  if (aVista(el)) await dormir(quieto() ? 0 : 450);
  const r = el.getBoundingClientRect(), [ox, oy] = origem(el), nx = ox + r.left + Math.min(r.width / 2, 60), ny = oy + r.top + r.height / 2;
  const d = Math.hypot(nx - x, ny - y), t = quieto() ? 0 : Math.min(900, 300 + d * 1.1);
  rato!.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: `translate(${nx}px, ${ny}px)` }], { duration: t, easing: 'cubic-bezier(.45, 0, .2, 1)', fill: 'forwards' });
  x = nx; y = ny; rato!.style.transform = `translate(${x}px, ${y}px)`;
  await dormir(t);
}
const ponteiro = (tipo: string, px: number, py: number, alvo?: Element | null) => {
  const el = alvo ?? document.elementFromPoint(px, py) ?? document.body;
  el.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, composed: true, clientX: px, clientY: py, button: 0, buttons: tipo === 'pointerup' ? 0 : 1, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
};
/** Arrastar: desce no elemento, leva o rato em passos (com os eventos pelo caminho) e larga no ponto pedido. */
async function arrastarDe(de: HTMLElement, para: () => { x: number; y: number } | null): Promise<boolean> {
  await mover(de);
  const r = de.getBoundingClientRect(), [ox, oy] = origem(de);
  const x0 = ox + r.left + Math.min(r.width / 2, 60), y0 = oy + r.top + r.height / 2;
  rato!.classList.add('is-preso');
  ponteiro('pointerdown', x0, y0, de);
  /* os primeiros pixéis: começa o arrasto e aparecem as guias */
  for (let k = 1; k <= 4; k++) { ponteiro('pointermove', x0 + k * 4, y0 + k * 3); await dormir(16); }
  x = x0 + 16; y = y0 + 12; rato!.style.transform = `translate(${x}px, ${y}px)`;
  const p = para(); if (!p) { ponteiro('pointerup', x, y); rato!.classList.remove('is-preso'); return false; }
  const n = quieto() ? 2 : 28, xa = x, ya = y;
  for (let k = 1; k <= n; k++) {
    const t = k / n, e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const px = xa + (p.x - xa) * e, py = ya + (p.y - ya) * e;
    x = px; y = py; rato!.style.transform = `translate(${x}px, ${y}px)`;
    ponteiro('pointermove', px, py); await dormir(quieto() ? 0 : 24);
  }
  await dormir(quieto() ? 100 : 500);
  ponteiro('pointerup', p.x, p.y); rato!.classList.remove('is-preso');
  return true;
}
/** As teclas: «Control+B», ou uma sequência «Control+K Control+P». O selo mostra-as como se leem («Ctrl B»). */
const CODIGOS: Record<string, string> = { '\\': 'Backslash', '`': 'Backquote', ',': 'Comma', '.': 'Period', '/': 'Slash', '-': 'Minus', '=': 'Equal' };
async function premir(seq: string): Promise<void> {
  selo(seq.replace(/Control/g, 'Ctrl').replace(/\+/g, ' ').replace(/ArrowRight/g, '→').replace(/ArrowLeft/g, '←'));
  for (const parte of seq.split(' ')) {
    const ks = parte.split('+'), key = ks[ks.length - 1];
    const code = /^[A-Za-z]$/.test(key) ? `Key${key.toUpperCase()}` : /^\d$/.test(key) ? `Digit${key}` : CODIGOS[key] ?? key;
    const o = { key: key.length === 1 ? key.toLowerCase() : key, code, ctrlKey: ks.includes('Control'), shiftKey: ks.includes('Shift'), altKey: ks.includes('Alt'), metaKey: ks.includes('Meta'), bubbles: true, cancelable: true };
    window.dispatchEvent(new KeyboardEvent('keydown', o)); window.dispatchEvent(new KeyboardEvent('keyup', o));
    await dormir(quieto() ? 60 : 260);
  }
}
let seloEl: HTMLElement | null = null;
function selo(t: string): void {
  if (!seloEl) { seloEl = document.createElement('div'); seloEl.className = 'demo-tecla'; seloEl.setAttribute('popover', 'manual'); seloEl.setAttribute('aria-hidden', 'true'); document.body.append(seloEl); }
  seloEl.textContent = t;
  seloEl.style.transform = `translate(${Math.min(x + 26, innerWidth - 180)}px, ${y + 24}px)`;
  try { seloEl.hidePopover(); seloEl.showPopover(); } catch { /* */ }
  if (!quieto()) seloEl.animate([{ opacity: 0, scale: .9 }, { opacity: 1, scale: 1, offset: .12 }, { opacity: 1, offset: .8 }, { opacity: 0 }], { duration: 1600, fill: 'forwards' });
  else window.setTimeout(() => { try { seloEl?.hidePopover(); } catch { /* */ } }, 1200);
}
/** Escreve num campo, letra a letra, com os eventos de input (a página responde como se fosse alguém a escrever). */
async function escreverEm(el: HTMLInputElement, texto: string): Promise<void> {
  el.focus(); el.value = '';
  for (const c of texto) { el.value += c; el.dispatchEvent(new Event('input', { bubbles: true })); await dormir(quieto() ? 10 : 70); }
}
async function clicar(el: HTMLElement): Promise<void> {
  rato!.classList.remove('is-clique'); void rato!.offsetWidth; rato!.classList.add('is-clique');
  el.classList.add('demo-alvo'); await dormir(quieto() ? 80 : 260); el.classList.remove('demo-alvo');
  el.click();
}
function escrever(i: number, n: number, t: string, titulo: string): void {
  legenda!.querySelector('.demo-legenda__passo')!.textContent = `${titulo} · ${i} de ${n}`;
  legenda!.querySelector('.demo-legenda__t')!.textContent = t;
  if (!quieto()) legenda!.animate([{ opacity: .4, translate: '0 6px' }, { opacity: 1, translate: '0 0' }], { duration: 200, easing: 'ease-out' });
}

export async function tocar(id = [...ROTEIROS.keys()][0]): Promise<void> {
  const r = ROTEIROS.get(id); if (!r || ativo) return;
  ativo = true; parar = false;
  if (!rato) montar();
  /* a app pode repor o ecrã para o roteiro começar sempre igual (o ERP: área de trabalho limpa, menu lateral aberto) */
  document.dispatchEvent(new CustomEvent('romafe:rato-inicio', { detail: id }));
  aoCimo(); document.body.classList.add('demo-a-tocar'); document.body.classList.toggle('demo-sem-texto', !!r.semTexto);
  const passos = typeof r.passos === 'function' ? r.passos() : r.passos;
  const fim = (t: string) => { escrever(passos.length, passos.length, t, r.titulo); };
  try {
    for (let i = 0; i < passos.length && !parar; i++) {
      const p = passos[i];
      if (p.ir) { await irPara(p.ir, i + 1, passos.length, r.titulo, p.legenda); continue; }
      if (p.ecra && visivel()?.dataset.ecra !== p.ecra && !document.querySelector('dialog[open]')) { mostrar(p.ecra); mostrarVersao(''); await dormir(500); }
      if (!r.semTexto) escrever(i + 1, passos.length, p.legenda, r.titulo); aoCimo();
      await dormir(quieto() ? 400 : 900);
      if (parar) break;
      if (p.escolher) {
        const s = alvo(p.escolher[0], p.separador) as HTMLSelectElement | null; if (!s) { fim('O roteiro parou: este ecrã mudou.'); break; }
        await mover(s); await clicar(s); s.value = p.escolher[1]; s.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (p.clicar) {
        const el = alvo(p.clicar, p.separador); if (!el) { fim('O roteiro parou: este ecrã mudou.'); break; }
        await mover(el); await clicar(el);
      } else if (p.arrastar) {
        const el = alvo(p.arrastar.de, p.separador); if (!el || !(await arrastarDe(el, p.arrastar.para))) { fim('O roteiro parou: este ecrã mudou.'); break; }
      } else if (p.escrever) {
        const el = alvo(p.escrever[0], p.separador) as HTMLInputElement | null; if (!el) { fim('O roteiro parou: este ecrã mudou.'); break; }
        await mover(el); await escreverEm(el, p.escrever[1]);
      }
      if (p.tecla) await premir(p.tecla);
      await dormir((quieto() ? 300 : 1000) + (p.pausa ?? 0));
      aoCimo();
    }
    if (!parar) await dormir(1800);
  } finally {
    ativo = false; document.body.classList.remove('demo-a-tocar', 'demo-sem-texto');
    try { rato?.hidePopover(); legenda?.hidePopover(); seloEl?.hidePopover(); } catch { /* sem popover */ }
  }
}

/** Vai a um ecrã: com a ligação verdadeira, se o ecrã que se vê a tiver; senão diretamente (um estado escolhe-se assim). */
async function irPara(id: string, i: number, n: number, titulo: string, legenda: string): Promise<void> {
  const aqui = visivel(), destino = document.querySelector<HTMLElement>(`.ecra[data-ecra="${id}"]`);
  if (!destino) return;
  /* 2 nov.: o percurso começa no ecrã que já se vê (o início da função): diz-se o que é, em vez de o saltar */
  if (aqui?.dataset.ecra === id) {
    const o = destino.dataset.objetivo ?? '';
    escrever(i, n, legenda || `${destino.dataset.nome ?? id}. ${o}`, titulo); aoCimo();
    await dormir(quieto() ? 700 : Math.min(5200, 1700 + o.length * 22));
    return;
  }
  const lig = [...(aqui?.querySelectorAll<HTMLElement>(`.versao:not([hidden]) :is([data-ir="${id}"], [data-depois="${id}"])`) ?? [])].find((l) => l.getClientRects().length > 0 && !l.closest('[hidden]'));
  const nome = destino.dataset.nome ?? id;
  const toque = lig ? (lig.getAttribute('aria-label') || lig.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) : '';
  const como = lig ? `Toca em «${toque || 'aqui'}» → ` : destino.dataset.estadoDe ? 'Estado · ' : '';
  escrever(i, n, legenda || `${como}${nome}. ${destino.dataset.objetivo ?? ''}`, titulo); aoCimo();
  if (lig) {
    await dormir(quieto() ? 200 : 500); if (parar) return;
    await mover(lig); await clicar(lig); await dormir(quieto() ? 150 : 450);
  }
  if (visivel()?.dataset.ecra !== id) { mostrar(id); mostrarVersao(''); }
  aoCimo();
  const o = destino.dataset.objetivo ?? '';
  await dormir(quieto() ? 700 : Math.min(5200, 1700 + o.length * 22));
}
/** 28 out.: todos os ecrãs e estados de uma app (ou de um fluxo), pela ordem do número (60, 60.1, 60.2… 61, 61.1, 61.1.5…),
    cada um com a ligação verdadeira quando a há. A explicação de cada ecrã é a que está ao lado (nome e objetivo). */
export function percurso(filtro: (e: HTMLElement) => boolean = () => true): Passo[] {
  const num = (e: HTMLElement) => (/^[\d.]+/.exec(e.dataset.nome ?? '')?.[0] ?? '999').split('.').filter(Boolean).map(Number);
  const cmp = (a: number[], b: number[]) => { for (let k = 0; k < Math.max(a.length, b.length); k++) { const d = (a[k] ?? -1) - (b[k] ?? -1); if (d) return d; } return 0; };
  return [...document.querySelectorAll<HTMLElement>('.ecra[data-ecra]')].filter((e) => !e.hasAttribute('data-fora-da-lista') && filtro(e))
    .sort((a, b) => cmp(num(a), num(b))).map((e) => ({ ir: e.dataset.ecra!, legenda: '' }));
}

export function iniciar(): void {
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && ativo) parar = true; }, true);
  /* &rato=1 toca o primeiro; &rato=<id> toca esse */
  const m = /(?:^|[#&])rato=([^&]+)/.exec(location.hash);
  if (m && temRoteiro()) window.setTimeout(() => { void tocar(ROTEIROS.has(m[1]) ? m[1] : undefined); }, 1200);
}
