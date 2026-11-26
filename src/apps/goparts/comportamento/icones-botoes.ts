/* =========================================================
   PEÇA A PEÇA — todos os botões com ícone (26 nov. 2026)
   Ela: «todos os buttons devem ter icon, seguir o guião de UI que fiz» (regra de 8 out.: ícone e texto em todos).
   Rede de segurança: qualquer .btn que apareça sem ícone ganha um, escolhido pelo que o botão diz (Lucide).
   Os botões novos devem já trazer o seu; isto apanha os que escaparam («Ver alternativas», «Apagar»…).
   ========================================================= */
import cart from 'lucide-static/icons/shopping-cart.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import alternativas from 'lucide-static/icons/arrow-left-right.svg?raw';
import seguir from 'lucide-static/icons/arrow-right.svg?raw';
import voltar from 'lucide-static/icons/arrow-left.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import save from 'lucide-static/icons/save.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import download from 'lucide-static/icons/download.svg?raw';
import copy from 'lucide-static/icons/copy.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import car from 'lucide-static/icons/car.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import bell from 'lucide-static/icons/bell.svg?raw';
import file from 'lucide-static/icons/file-text.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import filter from 'lucide-static/icons/filter.svg?raw';
import star from 'lucide-static/icons/star.svg?raw';
import { L } from '../portal/devolucoes';

/* pela ordem: a primeira que bate ganha */
const REGRAS: [RegExp, string][] = [
  [/carrinho|encomendar|^pedir/i, cart],
  [/apagar|eliminar|remover|tirar/i, trash],
  [/alternativ|equivalent|compar/i, alternativas],
  [/ve[íi]culo/i, car],
  [/refer[êe]ncias|lista/i, list],
  [/pesquis|encontrar|procurar/i, search],
  [/limpar|cancelar|fechar|descartar/i, x],
  [/informa[çc][ãa]o|t[ée]cnic|ajuda|detalhe/i, info],
  [/guardar|gravar/i, save],
  [/confirmar|aceitar|^ok$|concluir/i, check],
  [/descarregar|exportar|transferir|pdf/i, download],
  [/copiar/i, copy],
  [/editar|alterar|corrigir/i, pencil],
  [/repetir|tentar|atualizar/i, refresh],
  [/enviar|submeter/i, send],
  [/alerta|avis/i, bell],
  [/fatura|guia|documento|pedido/i, file],
  [/desfazer|repor/i, undo],
  [/filtr/i, filter],
  [/favorit/i, star],
  [/^ver|abrir|mostrar/i, eye],
  [/novo|nova|adicionar|criar/i, plus],
  [/voltar|anterior|atr[áa]s/i, voltar],
];

function completar(b: HTMLElement): void {
  if (b.querySelector('svg, img, .girador, .btn__icone')) return;
  const texto = (b.querySelector('.btn__rotulo')?.textContent || b.textContent || '').trim();
  if (!texto) return;
  const ic = REGRAS.find(([r]) => r.test(texto))?.[1] ?? seguir;
  b.insertAdjacentHTML('afterbegin', L(ic, 'btn__icone'));
}
function varrer(raiz: ParentNode): void {
  raiz.querySelectorAll<HTMLElement>('.btn').forEach(completar);
}

export function iniciar(): void {
  varrer(document);
  let pedido = 0;
  new MutationObserver(() => { if (!pedido) pedido = requestAnimationFrame(() => { pedido = 0; varrer(document); }); }).observe(document.body, { childList: true, subtree: true });
}
