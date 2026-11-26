/* =========================================================
   PEÇA A PEÇA — confirmar antes de apagar (26 nov. 2026)
   Ela: «quando faço alguma operação de apagar tem de aparecer um dialog a perguntar se tem a certeza ou não».
   Um só diálogo para o portal todo, com o desenho do «Eliminar a lista» (lista.css): o ícone a vermelho, a pergunta,
   o que acontece, «Cancelar» e o botão de apagar. Usa o <dialog> nativo (modal, prende o foco, Esc cancela).
   O foco começa em «Cancelar» — um Enter distraído não apaga nada — e volta a quem abriu o diálogo.
   ========================================================= */
import trash from 'lucide-static/icons/trash-2.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';

const ic = (raw: string, cls = 'btn__icone') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg class="${cls}" aria-hidden="true"`);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export type Pergunta = { titulo: string; texto: string; sim: string; /** quem recebe o foco se cancelar (por omissão, quem abriu) */ voltar?: HTMLElement | null };

let aberto: Promise<boolean> | null = null;
export function confirmar(p: Pergunta): Promise<boolean> {
  if (aberto) return Promise.resolve(false);
  const de = p.voltar ?? (document.activeElement as HTMLElement | null);
  const raiz = document.querySelector('.ecra:not([hidden]) > .versao:not([hidden]) .portal') ?? document.body;
  const d = document.createElement('dialog');
  d.className = 'cf'; d.setAttribute('role', 'alertdialog'); d.setAttribute('aria-labelledby', 'cf-t'); d.setAttribute('aria-describedby', 'cf-p');
  d.dataset.porCima = '';
  d.innerHTML = `<div class="cf__caixa">
    <span class="cf__ic">${ic(trash, '')}</span>
    <h2 id="cf-t">${esc(p.titulo)}</h2>
    <p id="cf-p">${esc(p.texto)}</p>
    <div class="cf__accoes">
      <button type="button" class="btn cf__nao" data-cf="nao">${ic(x)}<span class="btn__rotulo">Cancelar</span></button>
      <button type="button" class="btn cf__sim" data-cf="sim">${ic(trash)}<span class="btn__rotulo">${esc(p.sim)}</span></button>
    </div></div>`;
  raiz.appendChild(d);
  aberto = new Promise<boolean>((resolver) => {
    let feito = false;
    const fim = (sim: boolean) => {
      if (feito) return; feito = true; aberto = null;
      d.close(); d.remove();
      if (!sim && de?.isConnected) de.focus({ preventScroll: true });
      resolver(sim);
    };
    d.addEventListener('click', (e) => {
      e.stopPropagation();
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-cf]');
      if (b) fim(b.dataset.cf === 'sim');
      else if (e.target === d) fim(false); /* clique no fundo escurecido */
    });
    d.addEventListener('cancel', (e) => { e.preventDefault(); fim(false); });
  });
  d.showModal();
  d.querySelector<HTMLElement>('[data-cf="nao"]')!.focus();
  return aberto;
}
