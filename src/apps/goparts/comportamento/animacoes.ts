/* =========================================================
   PEÇA A PEÇA — desligar as animações (27 nov. 2026)
   Ela: «no início permite um botão que inibe animações, nem todos conseguem ter animações» e «mete sempre
   disable, apenas em UI, a referência e os detalhes».
   - O botão está no Início (Início v8, por baixo dos atalhos): «Desligar animações» / «Ligar animações». A escolha
     fica guardada neste navegador (localStorage) e vale para o portal todo.
   - Com as animações desligadas o portal porta-se como com «reduzir movimento» do sistema: todo o código que já
     pergunta por `(prefers-reduced-motion: reduce)` recebe «sim», as animações e transições de CSS acabam logo e as
     do Web Animations duram 0.
   - No Catálogo, os passos Referências e Detalhes não animam nunca, esteja o botão como estiver (nem a passagem
     para lá, nem o que lá dentro mexe).
   ========================================================= */
import pause from 'lucide-static/icons/pause.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';

const CHAVE = 'goparts:animacoes';
const PARADOS = 'main[data-vista="referencias"], main[data-vista="detalhes"]';

export const desligadas = (): boolean => { try { return localStorage.getItem(CHAVE) === 'nao'; } catch { return false; } };
/** Referências ou Detalhes do Catálogo à vista. */
const catalogoParado = (): boolean => !!document.querySelector(`.ecra:not([hidden]) :is(${PARADOS})`);
export const semMovimento = (): boolean => desligadas() || catalogoParado();

function aplicar(): void {
  const nao = desligadas();
  document.documentElement.dataset.animacoes = nao ? 'nao' : 'sim';
  document.querySelectorAll<HTMLElement>('[data-mt-palco]').forEach((s) => s.classList.toggle('is-estatico', nao));
  document.querySelectorAll<HTMLButtonElement>('[data-animacoes-botao]').forEach((b) => {
    b.setAttribute('aria-pressed', String(nao));
    b.innerHTML = `${nao ? play : pause}<span>${nao ? 'Ligar animações' : 'Desligar animações'}</span>`;
    b.querySelector('svg')?.setAttribute('aria-hidden', 'true');
  });
}

/* todo o código que pergunta por «reduzir movimento» passa a ouvir também o botão (e os passos parados) */
function ligarPerguntas(): void {
  const real = window.matchMedia.bind(window);
  window.matchMedia = (q: string) => {
    const m = real(q);
    if (!/prefers-reduced-motion:\s*reduce/.test(q)) return m;
    return new Proxy(m, { get: (t, p) => (p === 'matches' ? t.matches || semMovimento() : (typeof (t as never)[p] === 'function' ? ((t as never)[p] as (...a: unknown[]) => unknown).bind(t) : (t as never)[p])) });
  };
  const animar = Element.prototype.animate;
  Element.prototype.animate = function (this: Element, k: Keyframe[] | PropertyIndexedKeyframes | null, o?: number | KeyframeAnimationOptions) {
    if (desligadas() || this.closest?.(PARADOS)) o = typeof o === 'number' ? 0 : { ...(o || {}), duration: 0, delay: 0, iterations: 1 };
    return animar.call(this, k, o);
  };
}

/* já ao carregar o módulo, antes de qualquer outro comportamento perguntar */
ligarPerguntas();

export function iniciar(): void {
  aplicar();
  document.addEventListener('click', (e) => {
    const b = (e.target as Element).closest?.('[data-animacoes-botao]'); if (!b) return;
    try { localStorage.setItem(CHAVE, desligadas() ? 'sim' : 'nao'); } catch { /* fica só nesta página */ }
    aplicar();
  });
  document.addEventListener('romafe:mostrado', aplicar);
}
