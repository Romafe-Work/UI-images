/* =========================================================
   ERP — 05 · Início v3 (6 nov. 2026), briefing «ROMAFE ERP V3 — Visual Studio-style workspace».
   A área de trabalho passa a ser um IDE: barra de menus, barra de comandos do documento ativo, uma área com divisões
   encaixadas (lado a lado e empilhadas, quantas se quiser), grupos de separadores que se arrastam de um grupo para
   outro, guias de acoplar, janelas de ferramenta que se acoplam, ocultam na borda ou flutuam, e disposições com nome
   guardadas por utilizador. A v1 e a v2 ficam como estavam.
   Modelo: ide/modelo.ts · desenho: ide/vista.ts · motor: comportamento/ide.ts · CSS: css/ide.css.
   Porque não uma biblioteca: o protótipo é TypeScript sem framework (o editor mexe no DOM) e cada ecrã é um iframe
   que não pode mudar de pai no DOM sem recarregar (perdia filtros, seleção e alterações). As bibliotecas avaliadas
   (dockview-core, ativa e MIT; Golden Layout 2, pouco mantida; Lumino) ou mudam o conteúdo de pai ao acoplar, ou
   trazem um modelo de widgets próprio, ou não têm ocultar na borda. O motor próprio põe os iframes numa camada fixa
   e só lhes muda a posição — nada se recarrega ao mover, dividir, flutuar ou mudar de disposição.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { casca } from './vista';
import { preset, idFerr, novoId, type Disposicao } from './modelo';

export const VERSAO_INICIO_V3 = 'v3';
const NOTA = 'O Início v3 (6 nov., briefing «Visual Studio-style workspace»): a área de trabalho como um IDE — divisões encaixadas, separadores que se arrastam entre grupos com guias de acoplar, janelas de ferramenta (Explorador, Propriedades, Stock por armazém…) que se acoplam, ocultam na borda ou flutuam, e disposições com nome guardadas por utilizador. Os ecrãs abertos nunca se recarregam ao mudar de sítio.';
const V3 = { id: VERSAO_INICIO_V3, nota: NOTA };

/** As disposições dos estados (no editor e no protótipo; não se guardam). */
export function disposicaoDoCenario(c: string): Disposicao {
  switch (c) {
    case 'compras': return preset('compras');
    case 'flutuante': {
      const d = preset('compras');
      const g = d.raiz.t === 'div' && d.raiz.filhos[1].t === 'div' ? d.raiz.filhos[1].filhos[1] : null;
      if (g && g.t === 'grupo') { g.itens = g.itens.filter((i) => i !== idFerr('stock')); g.ativo = g.itens[0]; }
      d.flut.push({ id: novoId('f'), grupo: { t: 'grupo', id: novoId('g'), itens: [idFerr('stock')], ativo: idFerr('stock') }, x: 500, y: 150, w: 440, h: 300, z: 1 });
      return d;
    }
    case 'oculto': {
      const d = preset('compras');
      if (d.raiz.t === 'div') { d.raiz = d.raiz.filhos[1]; }
      d.ocultos.push({ item: idFerr('explorador'), lado: 'esq', tam: 280 }, { item: idFerr('pesquisa'), lado: 'esq', tam: 280 });
      return d;
    }
    case 'dividido': {
      const d = preset('padrao');
      d.itens['doc:compras.encomendas'].dividido = { dir: 'v', frac: .5 };
      return d;
    }
    case 'artigos': return preset('artigos');
    default: return preset('padrao');
  }
}
const pagina = (cenario: string) => casca({ cenario, perfil: 'compras', d: disposicaoDoCenario(cenario) });
export const versaoInicioV3 = () => ({ ...V3, html: pagina('normal') });

export type IdIde = 'ide-compras' | 'ide-guias' | 'ide-flutuante' | 'ide-oculto' | 'ide-dividido' | 'ide-disposicoes' | 'ide-artigos';
const ESTADOS: [IdIde, string, string, string][] = [
  ['ide-compras', '05.60 · Disposição Compras', 'A disposição pronta «Compras»: a Lista de Faltas à esquerda, as Encomendas à direita e, por baixo, o stock e as propriedades do artigo escolhido na lista.', 'compras'],
  ['ide-guias', '05.61 · A acoplar um separador', 'A arrastar um separador: as guias aparecem no grupo por baixo do rato (ao centro junta, nos lados divide) e nas bordas da área; a zona escolhida (aqui, em baixo das Encomendas) fica sombreada antes de largar; as setas que dariam ecrãs estreitos demais ficam desligadas.', 'guias'],
  ['ide-flutuante', '05.62 · Janela flutuante', 'O Stock por armazém a flutuar por cima das Encomendas: arrasta-se, redimensiona-se, maximiza-se e volta ao sítio de onde saiu com «Acoplar».', 'flutuante'],
  ['ide-oculto', '05.63 · Explorador oculto na borda', 'O Explorador e a Pesquisa ocultos na borda esquerda: um clique abre-os por cima do trabalho; o alfinete volta a acoplá-los.', 'oculto'],
  ['ide-dividido', '05.64 · Documento dividido', 'As Encomendas divididas em duas vistas: a de cima edita, a de baixo é só de leitura e mostra o que está gravado; cada uma rola sozinha.', 'dividido'],
  ['ide-disposicoes', '05.65 · Disposições', 'Guardar a disposição com um nome, aplicar, duplicar ou eliminar as tuas, e as prontas: Compras, Análise de Fornecedores, Gestão de Artigos e Contabilidade.', 'disposicoes'],
  ['ide-artigos', '05.66 · Disposição Gestão de Artigos', 'O catálogo de artigos à esquerda, as propriedades do artigo à direita e o stock por armazém e o histórico por baixo.', 'artigos'],
];
export function estadosIde(): Ecra<IdErp>[] {
  return ESTADOS.map(([id, nome, objetivo, c]) => ({ id: id as IdErp, nome, fluxo: 'Início', estadoDe: 'inicio' as IdErp, objetivo, versoes: [{ ...V3, html: pagina(c) }] }));
}
