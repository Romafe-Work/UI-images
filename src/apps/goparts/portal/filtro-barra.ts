/* =========================================================
   PEÇA A PEÇA — a barra de filtros dos documentos (21 out. 2026)
   Do briefing «Premium filter bar redesign»: numa linha, a pesquisa (o principal), um menu por dimensão
   («Processamento: Todos ▾», «Estado: Todos ▾» — nunca dois «Todos» à vista), «Filtros» (o período e a referência,
   num painel que se abre) e «Limpar tudo» (só com filtros aplicados). Os botões de cada dimensão são os de
   antes (.ped4__est, .ped4__etapa-f): a lógica de filtrar de cada ecrã não muda; o menu só os arruma.
   Comportamento: comportamento/filtro-barra.ts. Partilhado por Pedidos, Guias, Faturas e Devoluções.
   ========================================================= */
import { L } from './inicio-espaco';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';

/** Um menu de uma dimensão, com o grupo de botões de sempre lá dentro. */
export const menuFiltro = (rotulo: string, grupo: string) => `<div class="fb-menu" data-fb-menu>
  <button type="button" class="fb-menu__btn" aria-haspopup="true" aria-expanded="false"><span class="fb-menu__r">${rotulo}:</span><b data-fb-valor>Todos</b>${L(chevronDown, 'fb-menu__seta')}</button>
  <div class="fb-menu__lista" hidden>${grupo}</div>
</div>`;
