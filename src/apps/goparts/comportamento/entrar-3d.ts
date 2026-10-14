/* =========================================================
   GOPARTS — os ecrãs de entrar: o controlador da cena partilhada (14 out. 2026)
   - Há UM canvas e UMA cena (entrar-cena.ts, carregada à parte com o Three.js). Quando um ecrã de
     entrar aparece, o canvas muda-se para o palco dele (mudar um canvas de sítio no DOM não perde o
     contexto WebGL) e a cena recebe a fase: entrada, palavra, empresa ou ajuda. Nada recomeça.
   - As passagens animadas, antes da navegação do protótipo:
       «Continuar» (01) — o anel trava e a câmara avança; passa à palavra-passe ao fim de 0,45 s;
       «Entrar» (02)    — o rolamento completa-se, a marca laranja acende, a câmara atravessa o
                          centro; passa ao Início ao fim de 1,5 s (o palco escurece no fim);
       «Continuar na página da empresa» (03) — as peças juntam-se; segue ao fim de 0,9 s.
     Não há servidor neste protótipo: o «Entrar» é o do protótipo; o erro é o estado 02.1.
   - Um campo em foco abranda o rolamento; na ajuda, passar o rato (ou o foco) numa opção traz a sua
     peça à frente; o olho mostra e esconde a palavra-passe.
   - Fora dos ecrãs de entrar, ou com a página escondida, a cena para de desenhar.
   - Com «reduzir movimento», ou sem WebGL, o palco mostra o desenho parado (CSS) e a navegação é
     imediata. No editor não há passagens animadas.
   ========================================================= */
import { mostrar } from '../../../comum/ecras';
import type { CenaEntrar, Estado, Peca, Cotas } from './entrar-cena';

const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let cena: CenaEntrar | null = null;
let carregar: Promise<CenaEntrar | null> | null = null;
let raiz: HTMLElement | null = null;
let semWebgl = false;

const temWebgl = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } };
const fundo = () => getComputedStyle(raiz ?? document.documentElement).getPropertyValue('--ent3-cena').trim() || getComputedStyle(raiz ?? document.documentElement).getPropertyValue('--ent3-lado').trim() || '#06131f';

function obterCena(): Promise<CenaEntrar | null> {
  if (cena) return Promise.resolve(cena);
  if (semWebgl) return Promise.resolve(null);
  carregar = carregar || import('./entrar-cena').then(({ CenaEntrar: C }) => {
    const cv = document.createElement('canvas'); cv.className = 'ent3__canvas';
    try { cena = new C(cv, fundo); } catch { semWebgl = true; cena = null; }
    return cena;
  });
  return carregar;
}

/** O ecrã de entrar à vista mudou: o canvas vai para o palco dele, e a cena para a fase dele. */
async function armar(): Promise<void> {
  const ent = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .ent3');
  if (!ent) { raiz = null; cena?.parar(); return; }
  const mudou = ent !== raiz;
  raiz = ent;
  ent.classList.remove('is-voo');
  if (quieto() || (!cena && !temWebgl())) { semWebgl = semWebgl || !temWebgl(); ent.classList.add('is-parado'); return; }
  const c = await obterCena();
  if (!c || raiz !== ent) { if (!c) ent.classList.add('is-parado'); return; }
  const lugar = ent.querySelector<HTMLElement>('.ent3__lugar')!;
  if (c.canvas.parentElement !== lugar) lugar.appendChild(c.canvas);
  c.medir(); c.pintarFundo();
  const cotas = new Map<string, Cotas>();
  ent.querySelectorAll<SVGGElement>('.ent3__cota').forEach((g) => cotas.set(g.dataset.cota!, { linha: g.querySelector('line')!, ponto: g.querySelector('circle')!, rotulo: ent.querySelector<HTMLElement>(`.ent3__rotulo[data-cota="${g.dataset.cota}"]`)! }));
  c.ligarCotas(cotas);
  if (mudou) c.irPara(ent.dataset.fase as Estado);
  if (ent.closest('[data-ecra="palavra-passe-erro"]') && mudou) window.setTimeout(() => c.resistir(), 500);
  c.ligar();
  ent.classList.add('is-cena');
}

/** As passagens animadas: a cena mexe-se primeiro, a navegação vem depois. */
function aoClicar(ev: MouseEvent): void {
  if (editando() || document.body.classList.contains('com-fluxo')) return;
  const alvo = ev.target as Element;
  const olho = alvo.closest?.<HTMLButtonElement>('.ent3 [data-ent3="olho"]');
  if (olho) {
    const inp = olho.parentElement!.querySelector('input')!, ver = inp.type === 'password';
    inp.type = ver ? 'text' : 'password';
    olho.setAttribute('aria-pressed', String(ver)); olho.setAttribute('aria-label', ver ? 'Esconder a palavra-passe' : 'Mostrar a palavra-passe');
    return;
  }
  const b = alvo.closest?.<HTMLElement>('.ent3 [data-ent3][data-ir]');
  if (!b || !cena || !raiz || quieto() || raiz.classList.contains('is-parado')) return;
  const acao = b.dataset.ent3, destino = b.dataset.ir!;
  const espera = acao === 'continuar' ? 450 : acao === 'entrar' ? 1500 : acao === 'empresa' ? 900 : 0;
  if (!espera) return;
  ev.preventDefault(); ev.stopPropagation();
  b.setAttribute('aria-busy', 'true'); b.classList.add('is-a-carregar');
  if (acao === 'continuar') { cena.travar(); }
  else if (acao === 'entrar') { cena.travar(); cena.atravessar(); window.setTimeout(() => raiz?.classList.add('is-voo'), 1050); }
  else if (acao === 'empresa') { cena.irPara('palavra'); }
  const ent = raiz;
  window.setTimeout(() => {
    b.removeAttribute('aria-busy'); b.classList.remove('is-a-carregar');
    if (raiz !== ent) return;
    mostrar(destino);
  }, espera);
}

export function iniciar(): void {
  requestAnimationFrame(() => { armar(); });
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(() => { armar(); })));
  window.addEventListener('hashchange', () => requestAnimationFrame(() => { armar(); }));
  window.addEventListener('click', aoClicar, true);
  /* um campo em foco abranda o rolamento; na ajuda, a opção em foco ou debaixo do rato traz a sua peça */
  document.addEventListener('focusin', (ev) => {
    const el = ev.target as Element;
    if (el.closest?.('.ent3 input')) cena?.campoEmFoco(true);
    const op = el.closest?.<HTMLElement>('.ent3 [data-peca]'); if (op) cena?.focar(op.dataset.peca as Peca);
  });
  document.addEventListener('focusout', (ev) => {
    const el = ev.target as Element;
    if (el.closest?.('.ent3 input')) cena?.campoEmFoco(false);
    if (el.closest?.('.ent3 [data-peca]')) cena?.focar('');
  });
  document.addEventListener('pointerover', (ev) => { const op = (ev.target as Element).closest?.<HTMLElement>('.ent3 [data-peca]'); if (op) cena?.focar(op.dataset.peca as Peca); });
  document.addEventListener('pointerout', (ev) => { const op = (ev.target as Element).closest?.<HTMLElement>('.ent3 [data-peca]'); if (op && !op.contains(ev.relatedTarget as Node)) cena?.focar(''); });
  /* o fundo da cena segue o tema */
  new MutationObserver(() => cena?.pintarFundo()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => cena?.pintarFundo());
}
