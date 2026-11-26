/* =========================================================
   PEÇA A PEÇA — Claro · Escuro · Galáxia na barra de cima (26 nov. 2026)
   Ela: «sol e lua ficam junto do carrinho no header e quero galáxia theme». Claro e Escuro são o tema de sempre
   (comum/tema.ts, a mesma chave do editor); a Galáxia é o escuro com a classe tema-galaxia no <html>
   (css/tema-galaxia.css), guardada à parte. Sem escolha, segue o sistema (claro ou escuro).
   ========================================================= */
import { aplicar, actual } from '../../../comum/tema';

const CHAVE = 'goparts:tema-galaxia';
/* (26 nov.) ela: «o dark mode é o tema galáxia» — o escuro tem sempre o céu; a Galáxia deixou de ser um terceiro tema */
function escolhido(): string {
  const t = actual();
  return t === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t;
}
function marcar(): void {
  const v = escolhido();
  document.documentElement.classList.toggle('tema-galaxia', v === 'dark');
  /* (26 nov.) «a galáxia deve estar no light mode too» */
  document.documentElement.classList.toggle('tema-galaxia-claro', v === 'light');
  document.querySelectorAll<HTMLElement>('[data-tema-p]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.temaP === v)));
}
function escolher(v: string): void {
  try { localStorage.removeItem(CHAVE); } catch { /* sem armazenamento */ }
  aplicar(v === 'light' ? 'light' : 'dark');
  marcar();
}
export function iniciar(): void {
  marcar();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', marcar);
  document.addEventListener('click', (ev) => { const b = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-tema-p]'); if (b) escolher(b.dataset.temaP!); });
  /* os ecrãs constroem-se quando aparecem: os botões novos ficam marcados */
  let pedido = 0; new MutationObserver(() => { if (!pedido) pedido = requestAnimationFrame(() => { pedido = 0; marcar(); }); }).observe(document.body, { childList: true, subtree: true });
}
