/* =========================================================
   GOPARTS — chegar a uma lista já filtrada (20 out. 2026, briefing V4)
   Os números do «Resumo da atividade» e os alertas do Início abrem os Pedidos ou as Devoluções com a pílula
   «Estado» certa escolhida. O Início deixa o pedido na sessão; quando o ecrã aparece, carrega-se na pílula como
   se fosse a pessoa (o filtro é o do próprio ecrã, com a contagem e o «Limpar» dele). Sem a pílula (zero
   desse estado), o ecrã abre sem filtro.
   ========================================================= */
import { mostrar } from '../../../comum/ecras';

const CHAVE = 'goparts:filtro-etapa';

export function irFiltrado(ecra: string, etapa: string): void {
  try { sessionStorage.setItem(CHAVE, JSON.stringify({ ecra, etapa })); } catch { /* abre sem filtro */ }
  mostrar(ecra);
}

function aplicar(): void {
  let pedido: { ecra: string; etapa: string } | null = null;
  try { pedido = JSON.parse(sessionStorage.getItem(CHAVE) || 'null'); } catch { return; }
  if (!pedido) return;
  const ecra = document.querySelector<HTMLElement>('.ecra:not([hidden])');
  if (ecra?.dataset.ecra !== pedido.ecra) return;
  try { sessionStorage.removeItem(CHAVE); } catch { /* */ }
  const pilula = ecra.querySelector<HTMLElement>(`:scope > .versao:not([hidden]) .ped4__etapa-f[data-etapa="${pedido.etapa}"]`);
  if (pilula && pilula.getAttribute('aria-pressed') !== 'true') pilula.click();
}

export function iniciar(): void {
  /* depois do comportamento do ecrã (que prepara a lista no seu rAF) */
  document.addEventListener('romafe:versao', () => requestAnimationFrame(() => requestAnimationFrame(aplicar)));
}
