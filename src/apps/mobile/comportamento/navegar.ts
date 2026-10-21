/* =========================================================
   PICK — andar entre os ecrãs (21 out. 2026)
   Do briefing «Every movement counts»: a passagem tem direção — para a frente desliza da direita, para trás da
   esquerda (pela ordem dos ecrãs na app) — e a caixa (.pk-caixa-viva) passa de um ecrã para o outro quando está nos
   dois (abertura → entrada → Inventário). View Transitions do navegador: ≈ 250 ms; nada espera por ela (o leitor
   continua pronto). Sem View Transitions, com «reduzir movimento», no editor ou na demonstração, muda logo.
   ========================================================= */
import { definirTransicao } from '../../../comum/ecras';

type Doc = Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } };
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const ordem = () => Array.from(document.querySelectorAll<HTMLElement>('.ecra')).findIndex((e) => !e.hidden);

export function iniciar(): void {
  if (/(?:^|[#&])demo=1(?:&|$)/.test(location.hash) || document.body.classList.contains('demo')) return;
  definirTransicao((mudar) => {
    const doc = document as Doc;
    if (!doc.startViewTransition || quieto() || editando()) { mudar(); return; }
    const antes = ordem();
    const raiz = document.documentElement;
    const t = doc.startViewTransition(() => { mudar(); raiz.dataset.pkSentido = ordem() < antes ? 'tras' : 'frente'; });
    t.finished.finally(() => { delete raiz.dataset.pkSentido; });
  });
}
