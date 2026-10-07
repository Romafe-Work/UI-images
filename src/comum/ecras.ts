/* =========================================================
   ROMAFE — qual ecrã se vê, e o protótipo

   #ecra=menu          abre nesse ecrã (o editor também o lê)
   #so=ecra&ecra=menu  esse ecrã sem a moldura do editor
   #so=fluxo           só o mapa de navegação
   #doc=fluxo          o editor, já no mapa

   Fora do editor, os ecrãs funcionam como protótipo: clicar numa peça com
   data-ir leva ao ecrã que ela diz. No editor o clique escolhe a peça, e o
   ecrã a que ela leva está no painel de propriedades.
   ========================================================= */
import { fluxo } from './fluxo';

export function ler(chave: string): string {
  const m = new RegExp('(?:^|[#&])' + chave + '=([^&]+)').exec(location.hash);
  return m ? decodeURIComponent(m[1]) : '';
}

function existe(nome: string | undefined): nome is string {
  return !!(nome && document.querySelector('.ecra[data-ecra="' + nome + '"]'));
}

export function mostrar(nome: string): boolean {
  if (!existe(nome)) return false;
  document.querySelectorAll<HTMLElement>('.ecra').forEach((e) => {
    e.hidden = e.dataset.ecra !== nome;
  });
  /* o endereço diz onde se está, para recarregar e voltar ao mesmo ecrã */
  const h = location.hash.replace(/^#/, '').split('&').filter((p) => p && p.indexOf('ecra=') !== 0);
  h.push('ecra=' + nome);
  try { history.replaceState(null, '', '#' + h.join('&')); } catch { /* ficheiro local */ }
  window.scrollTo(0, 0);
  return true;
}

export function iniciar(): void {
  const pedido = ler('ecra');
  if (existe(pedido)) mostrar(pedido);

  const so = ler('so');
  if (so) document.body.classList.add('so-' + so);

  /* O protótipo. Corre na fase de captura, antes do comportamento de cada
     ecrã, para a navegação ganhar à recusa de exemplo. */
  document.addEventListener('click', (ev) => {
    if (document.body.classList.contains('editando')) return;
    if (document.body.classList.contains('com-fluxo')) return;
    const peca = (ev.target as Element).closest?.<HTMLElement>('[data-ir]');
    if (!peca || !existe(peca.dataset.ir)) return;
    ev.preventDefault();
    ev.stopPropagation();
    mostrar(peca.dataset.ir);
  }, true);

  if (so === 'fluxo') fluxo.ligar({});
}
