/* =========================================================
   PEÇA A PEÇA — 09 · A minha garagem v2 (26 nov. 2026): o veículo em uso
   O resto (favorito, mudar o nome, tirar, adicionar, peças compatíveis, usar na pesquisa) é o comportamento da
   garagem de sempre, em comportamento/inicio-espaco.ts. Aqui só:
   - escolher o veículo em uso (o círculo, ou um clique no cartão fora dos botões); fica guardado no navegador;
   - abrir as peças ou a pesquisa de um veículo passa-o a «em uso» (quem volta encontra-o escolhido);
   - «Sem matrícula? Escolher marca e modelo» abre o Catálogo nas marcas.
   ========================================================= */
import { CHAVE_EM_USO } from '../portal/garagem-v2';
import { mostrar } from '../../../comum/ecras';

const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function guardar(m: string): void { try { localStorage.setItem(CHAVE_EM_USO, m); } catch { /* sem armazenamento */ } }

function marcar(lista: HTMLElement, m: string, anunciar: boolean): void {
  let nome = '';
  lista.querySelectorAll<HTMLElement>('.gar2__carro').forEach((li) => {
    const sim = li.dataset.matricula === m;
    li.classList.toggle('is-em-uso', sim);
    if (sim) { li.setAttribute('aria-current', 'true'); nome = li.querySelector('[data-nome]')?.textContent ?? m; } else li.removeAttribute('aria-current');
    const r = li.querySelector<HTMLInputElement>('[data-gar2-usar]'); if (r) r.checked = sim;
    const selo = li.querySelector<HTMLElement>('.gar2__selo--uso'); if (selo) selo.hidden = !sim;
    li.querySelector('.gar2__principal')?.classList.toggle('btn--acao', sim);
    li.querySelector('.gar2__escolha')?.setAttribute('title', sim ? 'Veículo em uso' : 'Usar este veículo');
    if (sim && !quieto()) li.animate([{ boxShadow: 'inset 3px 0 0 var(--gar2-azul), 0 0 0 0 transparent' }, { boxShadow: 'inset 3px 0 0 var(--gar2-azul), 0 0 0 4px var(--gar2-azul-suave)' }, { boxShadow: 'inset 3px 0 0 var(--gar2-azul), 0 0 0 0 transparent' }], { duration: 420, easing: 'ease-out' });
  });
  guardar(m);
  if (anunciar) { const a = lista.closest('.portal')?.querySelector<HTMLElement>('.ini3__aviso'); if (a) a.textContent = `${nome} (${m}) passou a ser o veículo em uso.`; }
}

document.addEventListener('change', (ev) => {
  const r = (ev.target as HTMLElement).closest?.<HTMLInputElement>('[data-gar2-usar]'); if (!r) return;
  marcar(r.closest<HTMLElement>('.gar2__lista')!, r.value, true);
});

/* em captura: antes de o comportamento da garagem sair do ecrã */
document.addEventListener('click', (ev) => {
  const t = ev.target as HTMLElement;
  const gar = t.closest?.<HTMLElement>('[data-gar2]'); if (!gar) return;
  if (t.closest('[data-gar2-manual]')) { mostrar('catalogo'); return; }
  const ir = t.closest<HTMLElement>('.gar2__carro [data-pecas-matricula], .gar2__carro [data-usar-matricula]');
  if (ir) { guardar(ir.closest<HTMLElement>('.gar2__carro')!.dataset.matricula!); return; }
  /* um clique no cartão (fora de botões, campos e menus) escolhe-o */
  const li = t.closest<HTMLElement>('.gar2__carro');
  if (li && !t.closest('button, a, input, label, .ini4__menu, .ini4__renomear') && !li.classList.contains('is-em-uso')) {
    marcar(li.closest<HTMLElement>('.gar2__lista')!, li.dataset.matricula!, true);
  }
}, true);
