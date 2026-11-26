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

/* (26 nov., v3) clicar no chão do lugar é o mesmo que «Ver peças compatíveis» */
document.addEventListener('click', (ev) => {
  const chao = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-gar3] [data-gar3-abrir]'); if (!chao) return;
  chao.closest('.gar3__lugar')?.querySelector<HTMLElement>('[data-pecas-matricula]')?.click();
});

/* (26 nov., v3) um veículo novo entra no lugar de marcha-atrás: o comportamento da garagem troca o bloco inteiro,
   por isso compara-se com o que lá estava */
const vistas = new WeakMap<HTMLElement, Set<string>>();
function estacionar(main: HTMLElement): void {
  const agora = new Set(Array.from(main.querySelectorAll<HTMLElement>('.gar3__lugar[data-matricula]')).map((l) => l.dataset.matricula!));
  const antes = vistas.get(main); vistas.set(main, agora);
  if (!antes || quieto()) return;
  agora.forEach((m) => { if (antes.has(m)) return; main.querySelector(`.gar3__lugar[data-matricula="${m}"] .gar3__carro`)?.classList.add('is-a-entrar'); });
}
/* (26 nov.) encher a última fila com lugares vazios (só desenho), com o número seguinte */
function encher(main: HTMLElement): void {
  const ul = main.querySelector<HTMLElement>('.gar3__lugares'); if (!ul) return;
  ul.querySelectorAll('.gar3__lugar--vazio').forEach((x) => x.remove());
  const cols = getComputedStyle(ul).gridTemplateColumns.split(' ').filter(Boolean).length;
  const n = ul.children.length, falta = cols > 1 ? (cols - (n % cols)) % cols : 0;
  ul.dataset.cols = String(cols);
  for (let i = 0; i < falta; i++) ul.insertAdjacentHTML('beforeend', `<li class="gar3__lugar gar3__lugar--vazio" aria-hidden="true"><div class="gar3__chao"><span class="gar3__n">${String(n + i + 1).padStart(2, '0')}</span></div><div class="gar3__info"></div></li>`);
}
const medidos = new WeakSet<HTMLElement>();
function vigiar(): void {
  document.querySelectorAll<HTMLElement>('[data-gar3]').forEach((main) => {
    encher(main);
    if (medidos.has(main)) return; medidos.add(main);
    let pedido = 0; new ResizeObserver(() => { cancelAnimationFrame(pedido); pedido = requestAnimationFrame(() => encher(main)); }).observe(main);
  });
  document.querySelectorAll<HTMLElement>('[data-gar3]').forEach((main) => {
    if (vistas.has(main)) return;
    estacionar(main);
    /* o bloco redesenhado (adicionar, tirar, favorito) volta sem os lugares vazios: enche-se outra vez */
    new MutationObserver(() => { estacionar(main); const ul = main.querySelector<HTMLElement>('.gar3__lugares'); if (ul && ul.dataset.cols === undefined) encher(main); }).observe(main, { childList: true, subtree: true });
  });
}
document.addEventListener('romafe:ecra', vigiar); document.addEventListener('romafe:versao', vigiar);
window.addEventListener('hashchange', () => window.setTimeout(vigiar, 50));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => window.setTimeout(vigiar, 50)); else window.setTimeout(vigiar, 50);
