/* =========================================================
   PICK — «Ver como»: mudar de função na demonstração (27 out. 2026)
   Ela: «mostra essa diferença, permite na demonstração mudar a role». Tocar nas iniciais da conta (.gp-conta, em
   qualquer ecrã da Pick) abre um diálogo com as quatro funções do armazém — o que cada uma vê e não vê do
   Inventário — e escolher uma leva à página dela. No produto a função vem das permissões da conta e não se escolhe:
   o diálogo di-lo. Um <dialog> nativo (Esc fecha, o foco fica lá dentro e volta às iniciais).
   ========================================================= */
import { mostrar, mostrarVersao } from '../../../comum/ecras';
import { FUNCOES } from '../inventario-estados';

const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const ICONE = { sim: '<path d="M20 6 9 17l-5-5"/>', nao: '<path d="M18 6 6 18M6 6l12 12"/>' };
const svg = (d: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
/** A função de quem está no ecrã, pelas iniciais do cabeçalho. */
const atual = (b: HTMLElement) => FUNCOES.find((f) => f.iniciais === (b.closest('.gp')?.querySelector('.gp-conta')?.textContent ?? b.textContent)?.trim())?.k ?? 'arrumacao';

function abrir(origem: HTMLElement): void {
  document.querySelector('dialog.gi-funcoes')?.remove();
  const d = document.createElement('dialog'), k = atual(origem);
  d.className = 'gi-funcoes'; d.setAttribute('aria-labelledby', 'gi-funcoes-t');
  d.innerHTML = `<form method="dialog" class="gi-funcoes__c">
    <header><h2 id="gi-funcoes-t">Ver como</h2><p>Demonstração: escolha a função. Na Pick a sério, a função vem das permissões da conta e não se escolhe.</p></header>
    <ul role="list">${FUNCOES.map((f) => `<li><button type="button" class="gi-funcao${f.k === k ? ' is-atual' : ''}" data-funcao="${f.ecra}"${f.k === k ? ' aria-current="true"' : ''}>
      <span class="gi-funcao__cab"><i class="gp-av">${f.iniciais}</i><span><b>${f.t}</b><small>${f.nome}</small></span>${f.k === k ? '<em>Agora</em>' : ''}</span>
      <span class="gi-funcao__l">${f.ve.map((x) => `<span class="is-sim">${svg(ICONE.sim)}${x}</span>`).join('')}${f.nao.map((x) => `<span class="is-nao">${svg(ICONE.nao)}${x}</span>`).join('')}</span>
    </button></li>`).join('')}</ul>
    <button type="submit" class="gp-btn gi-btn-sec gi-funcoes__fechar">Fechar</button>
  </form>`;
  /* dentro da página da Pick, para herdar as cores e as letras do .gp */
  (origem.closest('.gp') ?? document.body).appendChild(d);
  d.addEventListener('close', () => { d.remove(); origem.focus({ preventScroll: true }); });
  d.addEventListener('click', (ev) => {
    if (ev.target === d) { d.close(); return; }
    const b = (ev.target as Element).closest<HTMLElement>('[data-funcao]'); if (!b) return;
    /* a versão mais recente da página da função (como as ligações do desenho novo, data-ir-ultima) */
    d.close(); mostrar(b.dataset.funcao!); mostrarVersao('');
  });
  d.showModal();
  d.querySelector<HTMLElement>('.gi-funcao.is-atual')?.focus();
}

/* as Tarefas do gestor: a operação (botões, ou o select da v2 de 28 out.) e a pessoa filtram as linhas da página */
function filtrarTarefas(r: Element): void {
  const tipo = r.querySelector<HTMLSelectElement>('[data-gi-tipo-sel]')?.value ?? r.querySelector<HTMLElement>('[data-gi-tipo][aria-pressed="true"]')?.dataset.giTipo ?? '', quem = r.querySelector<HTMLSelectElement>('[data-gi-quem]')?.value ?? '';
  r.querySelectorAll<HTMLElement>('[data-gi-tipo-l]').forEach((li) => { li.hidden = (!!tipo && li.dataset.giTipoL !== tipo) || (!!quem && li.dataset.giQuemL !== quem); });
}
/* a barra: o indicador desliza do destino de onde se veio; o ícone do destino faz o seu gesto (uma vez) */
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function barraChegou(): void {
  let de: { f: string; k: number } | null = null;
  try { de = JSON.parse(sessionStorage.getItem('pick:barra') ?? 'null'); sessionStorage.removeItem('pick:barra'); } catch { /* sem sessão */ }
  const b = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-gi-barra]'); if (!b || !de || de.f !== b.dataset.giBarra || quieto()) return;
  const i = Number(getComputedStyle(b).getPropertyValue('--i')) || 0, ind = b.querySelector<HTMLElement>('.gi-barra__ind');
  if (ind && de.k !== i) ind.animate([{ transform: `translateX(${de.k * 100}%)` }, { transform: `translateX(${i * 100}%)` }], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
  b.querySelector('.gi-barra__b.is-ativo')?.classList.add('is-gesto');
}

export function iniciar(): void {
  document.addEventListener('click', (ev) => {
    const t = ev.target as Element;
    const bb = t.closest?.<HTMLElement>('.gi-barra__b'); if (bb && !editando()) { try { sessionStorage.setItem('pick:barra', JSON.stringify({ f: bb.closest<HTMLElement>('[data-gi-barra]')?.dataset.giBarra, k: Number(bb.closest<HTMLElement>('[data-gi-barra]')?.querySelector('.is-ativo')?.getAttribute('data-gi-k') ?? 0) })); } catch { /* sem sessão */ } }
    const tp = t.closest?.<HTMLElement>('.gpi [data-gi-tipo]'); if (tp && !editando()) { const r = tp.closest('.gpi')!; r.querySelectorAll('[data-gi-tipo]').forEach((x) => x.setAttribute('aria-pressed', String(x === tp))); filtrarTarefas(r); }
  }, true);
  document.addEventListener('change', (ev) => { const s = (ev.target as Element).closest?.('.gpi :is([data-gi-quem], [data-gi-tipo-sel])'); if (s) filtrarTarefas(s.closest('.gpi')!); });
  /* o select do estado (61 · Inventário): mostra o painel escolhido da mesma página */
  document.addEventListener('change', (ev) => {
    const s = (ev.target as Element).closest?.<HTMLSelectElement>('.gpi [data-gi-sel]'); if (!s || editando()) return;
    s.closest('.gpi')!.querySelectorAll<HTMLElement>('[data-gi-painel]').forEach((p) => { p.hidden = p.dataset.giPainel !== s.value; });
  });
  document.addEventListener('romafe:versao', () => requestAnimationFrame(barraChegou));
  /* os separadores das páginas v2 (Inventário e Arrumação do gestor): mostram o painel da mesma página */
  document.addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest?.<HTMLElement>('.gpi [data-gi-sep]'); if (!b || editando()) return;
    const r = b.closest('.gpi')!;
    r.querySelectorAll<HTMLElement>('[data-gi-sep]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    r.querySelectorAll<HTMLElement>('[data-gi-painel]').forEach((p) => { p.hidden = p.dataset.giPainel !== b.dataset.giSep; });
  });
  document.addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest?.<HTMLElement>('.gp .gp-conta, .gp [data-gi-ver-como]');
    if (!b || editando()) return;
    ev.preventDefault(); abrir(b);
  });
}
