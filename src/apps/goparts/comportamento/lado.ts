/* =========================================================
   GOPARTS — a barra lateral (20 out. 2026, briefing «Collapsible Sidebar & Intelligent Home Dashboard»)
   - Recolher / abrir: a escolha fica neste computador (localStorage) e vale para todos os ecrãs; põe-se na
     raiz (html.gp-lado-recolhido) logo ao carregar, para não piscar.
   - A animação não mexe a largura de nada no fluxo: a coluna muda num passo só e a barra (que está por
     cima da sua coluna) recorta-se com clip-path. Ao abrir, a coluna alarga primeiro e a barra revela-se;
     ao recolher, a barra recolhe-se primeiro e só no fim a coluna estreita. Os ícones nunca saem do sítio.
   - O indicador do ativo: ao mudar de ecrã, desliza da secção de onde se veio para a atual.
   - Sem escolha guardada, abre recolhida abaixo de 1440 px (o conteúdo dos ecrãs largos, como a Minha lista,
     precisa da largura) e aberta acima. Depois de a pessoa escolher, vale a escolha dela.
   - (20 out., V5) No tablet (768–1199 px) a barra fica sempre recolhida, sem mexer na escolha guardada; abaixo de
     768 px (o telemóvel) não há barra: o ☰ abre a gaveta (barra.ts).
   ========================================================= */
const CHAVE = 'goparts:lado';
const RAIZ = 'gp-lado-recolhido';
const DURA = 240;
const CURVA = 'cubic-bezier(.22, 1, .36, 1)';

const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const recolhido = () => document.documentElement.classList.contains(RAIZ);
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal__lado');

const ESTREITA = '(max-width: 1439.98px)';
const TABLET = '(max-width: 1199.98px)';
function escolhida(): string | null { try { return localStorage.getItem(CHAVE); } catch { return null; } }
function porOmissao(): void {
  const e = escolhida();
  document.documentElement.classList.toggle(RAIZ, window.matchMedia(TABLET).matches || (e ? e === 'recolhido' : window.matchMedia(ESTREITA).matches));
}
/* logo ao carregar o módulo, antes da primeira pintura dos ecrãs */
porOmissao();

function marcarBotoes(): void {
  const r = recolhido();
  document.querySelectorAll<HTMLElement>('[data-lado-recolher]').forEach((b) => {
    b.setAttribute('aria-expanded', String(!r));
    b.setAttribute('aria-label', r ? 'Abrir o menu' : 'Recolher o menu');
  });
}

function guardar(r: boolean): void {
  try { localStorage.setItem(CHAVE, r ? 'recolhido' : 'aberto'); } catch { /* */ }
}

/* o recorte: a barra tem sempre a largura da sua coluna; recolhida, fica visível só a faixa dos ícones */
const FECHADO = 'inset(0 calc(100% - 68px) 0 0)';
let aAnimar = false;
function alternar(): void {
  if (aAnimar || window.matchMedia(TABLET).matches) return;
  const lado = visivel();
  const r = !recolhido();
  guardar(r);
  if (!lado || quieto()) { document.documentElement.classList.toggle(RAIZ, r); marcarBotoes(); posicionar(false); return; }
  aAnimar = true;
  if (r) {
    lado.classList.add('is-a-recolher');
    const a = lado.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: FECHADO }], { duration: DURA, easing: CURVA });
    a.onfinish = a.oncancel = () => { document.documentElement.classList.add(RAIZ); lado.classList.remove('is-a-recolher'); marcarBotoes(); posicionar(false); aAnimar = false; };
  } else {
    document.documentElement.classList.remove(RAIZ);
    marcarBotoes(); posicionar(false);
    lado.classList.add('is-a-abrir');
    const a = lado.animate([{ clipPath: FECHADO }, { clipPath: 'inset(0 0 0 0)' }], { duration: DURA, easing: CURVA });
    a.onfinish = a.oncancel = () => { lado.classList.remove('is-a-abrir'); aAnimar = false; };
  }
}

/* o indicador: guarda-se onde estava, para no ecrã seguinte partir de lá */
let ultimoY: number | null = null;
function posicionar(deslizar: boolean): void {
  const lado = visivel();
  if (!lado) return;
  const ind = lado.querySelector<HTMLElement>('.lado__ativo');
  const ativo = lado.querySelector<HTMLElement>('.lado__item[aria-current="page"]');
  if (!ind) return;
  if (!ativo) { ind.hidden = true; return; }
  ind.hidden = false;
  const rolo = ind.parentElement!;
  const y = ativo.getBoundingClientRect().top - rolo.getBoundingClientRect().top + rolo.scrollTop;
  ind.style.height = `${ativo.offsetHeight}px`;
  if (deslizar && ultimoY !== null && ultimoY !== y && !quieto() && !editando()) {
    ind.animate([{ transform: `translateY(${ultimoY}px)` }, { transform: `translateY(${y}px)` }], { duration: 280, easing: CURVA });
  }
  ind.style.transform = `translateY(${y}px)`;
  ultimoY = y;
}

export function iniciar(): void {
  marcarBotoes();
  requestAnimationFrame(() => posicionar(false));
  ['romafe:ecra', 'romafe:versao'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(() => { marcarBotoes(); posicionar(true); })));
  window.addEventListener('resize', () => posicionar(false), { passive: true });
  /* sem escolha guardada, a barra segue a largura da janela */
  window.matchMedia(ESTREITA).addEventListener('change', () => { if (!escolhida()) { porOmissao(); marcarBotoes(); requestAnimationFrame(() => posicionar(false)); } });
  window.matchMedia(TABLET).addEventListener('change', () => { porOmissao(); marcarBotoes(); requestAnimationFrame(() => posicionar(false)); });
  document.addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest?.('[data-lado-recolher]');
    if (!b || editando()) return;
    ev.preventDefault();
    alternar();
  });
  /* Ctrl+B (como nos editores) recolhe e abre a barra */
  document.addEventListener('keydown', (ev) => {
    if (!(ev.ctrlKey || ev.metaKey) || ev.key.toLowerCase() !== 'b' || ev.altKey || ev.shiftKey) return;
    const t = ev.target as HTMLElement;
    if (t.closest?.('input, textarea, [contenteditable="true"]') || !visivel() || editando()) return;
    ev.preventDefault(); alternar();
  });
  /* noutro separador mudou-se a escolha */
  window.addEventListener('storage', (ev) => {
    if (ev.key !== CHAVE) return;
    porOmissao(); marcarBotoes(); posicionar(false);
  });
}
