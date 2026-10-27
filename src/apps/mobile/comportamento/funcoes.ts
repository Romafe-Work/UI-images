/* =========================================================
   PICK — «Ver como»: mudar de função na demonstração (27 out. 2026)
   Ela: «mostra essa diferença, permite na demonstração mudar a role». Tocar nas iniciais da conta (.gp-conta, em
   qualquer ecrã da Pick) abre um diálogo com as quatro funções do armazém — o que cada uma vê e não vê do
   Inventário — e escolher uma leva à página dela. No produto a função vem das permissões da conta e não se escolhe:
   o diálogo di-lo. Um <dialog> nativo (Esc fecha, o foco fica lá dentro e volta às iniciais).
   ========================================================= */
import { mostrar } from '../../../comum/ecras';
import { FUNCOES } from '../inventario-estados';

const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const ICONE = { sim: '<path d="M20 6 9 17l-5-5"/>', nao: '<path d="M18 6 6 18M6 6l12 12"/>' };
const svg = (d: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
/** A função de quem está no ecrã, pelas iniciais do cabeçalho. */
const atual = (b: HTMLElement) => FUNCOES.find((f) => f.iniciais === b.textContent?.trim())?.k ?? 'arrumacao';

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
    d.close(); mostrar(b.dataset.funcao!);
  });
  d.showModal();
  d.querySelector<HTMLElement>('.gi-funcao.is-atual')?.focus();
}

export function iniciar(): void {
  document.addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest?.<HTMLElement>('.gp .gp-conta');
    if (!b || editando()) return;
    ev.preventDefault(); abrir(b);
  });
}
