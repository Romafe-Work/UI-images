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
import { preset, idFerr, idDoc, novoId, grupos, type Disposicao } from './modelo';

export const VERSAO_INICIO_V3 = 'v3';
const NOTA = 'O Início v3 (6 nov., briefing «Visual Studio-style workspace»): a área de trabalho como um IDE — divisões encaixadas, separadores que se arrastam entre grupos com guias de acoplar, janelas de ferramenta (Módulos, Ficha, Stock por armazém…) que se acoplam, ocultam na borda ou flutuam, e disposições com nome guardadas por utilizador. Os ecrãs abertos nunca se recarregam ao mudar de sítio.';
const V3 = { id: VERSAO_INICIO_V3, nota: NOTA };

/** As disposições dos estados (no editor e no protótipo; não se guardam) e o nome que a barra de estado mostra. */
const COMPRAS = new Set(['compras', 'guias', 'disposicoes', 'sujo', 'fechar-sujo', 'max', 'pequena', 'menu-tab', 'relacionados', 'fixado', 'offline', 'a-abrir', 'falha', 'sessao', 'atalhos', 'atalho-conflito', 'flutuante', 'oculto']);
const MUITOS: [string, string][] = [['compras.faltas', 'Lista de Faltas'], ['compras.cotacoes', 'Orçamentos'], ['compras.compras-guias-entrada', 'Guias'], ['compras.compras-faturas', 'Faturas'], ['compras.mapas-tot-enc', 'Documentos de encomenda'],
  ['compras.mapas-tot-ge', 'Documentos de guia de entrada'], ['compras.mapas-recap', 'Mapa recapitulativo de fornecedores'], ['compras.analise-artigo', 'Análise de compras'], ['compras.comp-geral-var', 'Comparativos de compras'], ['compras.mapas-analise-forn', 'Análise de fornecedores'], ['compras.mapas-automatico', 'Artigos/compras automático']];
export function disposicaoDoCenario(c: string): { d: Disposicao; nome: string } {
  const nome = c === 'artigos' ? 'Gestão de Artigos' : COMPRAS.has(c) ? 'Compras' : c === 'flutuante' || c === 'oculto' || c === 'dividido' || c === 'vazio' ? 'Personalizado' : 'Padrão';
  return { d: montarCenario(c), nome: c === 'flutuante' || c === 'oculto' ? 'Personalizado' : nome };
}
function montarCenario(c: string): Disposicao {
  switch (c) {
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
    /* muitos separadores num grupo: a barra rola e a lista mostra-os todos */
    case 'muitos': case 'lista': case 'fechados': {
      const d = preset('padrao');
      const g = grupos(d).find((x) => x.itens.includes('doc:compras.encomendas'))!;
      (c === 'fechados' ? MUITOS.slice(0, 4) : MUITOS).forEach(([rota, titulo]) => { const id = idDoc(rota); d.itens[id] = { id, tipo: 'doc', rota, titulo }; g.itens.push(id); });
      g.ativo = 'doc:compras.cotacoes'; d.ativo = g.ativo; d.grupo = g.id;
      return d;
    }
    /* sem documentos: só o Explorador e o grupo vazio */
    case 'vazio': {
      const d = preset('padrao');
      const g = grupos(d).find((x) => x.itens.includes('doc:compras.encomendas'))!;
      g.itens = []; g.ativo = ''; delete d.itens['doc:compras.encomendas']; d.ativo = idFerr('explorador');
      return d;
    }
    default: return COMPRAS.has(c) ? preset('compras') : preset('padrao');
  }
}
const pagina = (cenario: string) => casca({ cenario, perfil: cenario === 'sem-acesso' ? 'vendas' : 'compras', d: disposicaoDoCenario(cenario).d });
export const versaoInicioV3 = () => ({ ...V3, html: pagina('normal') });

/* 6 nov. (ela: «faz todos os estados de screen do erp»): todos os estados do Início, na v3 */
const ESTADOS: [string, string, string][] = [
  ['compras', 'Disposição Compras', 'A disposição pronta «Compras»: a Lista de Faltas à esquerda, as Encomendas à direita e, por baixo, o stock e as propriedades do artigo escolhido na lista.'],
  ['guias', 'A acoplar um separador', 'A arrastar um separador: as guias aparecem no grupo por baixo do rato (ao centro junta, nos lados divide) e nas bordas da área; a zona escolhida (aqui, em baixo das Encomendas) fica sombreada antes de largar; as setas que dariam ecrãs estreitos demais ficam desligadas.'],
  ['flutuante', 'Janela flutuante', 'O Stock por armazém a flutuar por cima das Encomendas: arrasta-se, redimensiona-se, maximiza-se e volta ao sítio de onde saiu com «Acoplar».'],
  ['oculto', 'Módulos ocultos na borda', 'Os Módulos e o Procurar ocultos na borda esquerda: um clique abre-os por cima do trabalho; o alfinete volta a acoplá-los.'],
  ['dividido', 'Documento dividido', 'As Encomendas divididas em duas vistas: a de cima edita, a de baixo é só de leitura e mostra o que está gravado; cada uma rola sozinha.'],
  ['disposicoes', 'Disposições', 'Guardar a disposição com um nome, aplicar, duplicar ou eliminar as tuas, e as prontas: Compras, Análise de Fornecedores, Gestão de Artigos e Contabilidade.'],
  ['artigos', 'Disposição Gestão de Artigos', 'O catálogo de artigos à esquerda, as propriedades do artigo à direita e o stock por armazém e o histórico por baixo.'],
  ['muitos', 'Muitos separadores', 'Doze ecrãs no mesmo grupo: a barra rola com a roda do rato, o ativo fica sempre à vista e a seta no canto lista-os todos.'],
  ['lista', 'Procurar nos separadores', 'A lista de todos os separadores abertos com a procura «enc» (Ctrl Shift E): só os que a têm no nome; Enter vai para o primeiro.'],
  ['fechados', 'Fechados há pouco', 'Na lista dos separadores, os fechados há pouco ficam para os reabrir (Alt Shift T reabre o último).'],
  ['sujo', 'Alterações por guardar', 'As Encomendas com alterações por guardar: o ponto laranja no separador e a barra de estado a dizer quantos documentos estão assim.'],
  ['fechar-sujo', 'Fechar com alterações por guardar', 'Fechar um documento com alterações pergunta antes: «Voltar ao documento» ou «Fechar sem guardar». Mover, dividir ou aplicar outra disposição nunca as perde.'],
  ['max', 'Grupo maximizado', 'A Lista de Faltas maximizada (duplo clique na barra dos separadores): ocupa a área toda; os outros grupos ficam como estavam, escondidos.'],
  ['pequena', 'Janela pequena', 'Numa janela estreita (menos de 760 px de área) vê-se só o grupo ativo, para nenhum ecrã ficar estreito demais; a disposição fica guardada e volta ao alargar.'],
  ['menu-janela', 'Menu Janela', 'O menu Janela: divisões, mover o separador, flutuar e acoplar, dividir o documento, maximizar, fechar, reabrir e as disposições; e a lista dos abertos.'],
  ['menu-tab', 'Menu do separador', 'Botão direito num separador: fechar, fechar outros ou à direita, fixar, nova divisão para cada lado, mover para outro grupo, flutuar e dividir o documento.'],
  ['atalhos', 'Atalhos de teclado', 'As teclas do ERP antigo (F5, F6, F8, F9, F11…), que não mudam, e as da área de trabalho, que cada pessoa pode trocar.'],
  ['atalho-conflito', 'Atalho já usado', 'A trocar uma tecla: a combinação escolhida é do navegador ou do ERP antigo, e o ERP diz qual e pede outra.'],
  ['vazio', 'Sem documentos abertos', 'Nenhum ecrã aberto: o grupo vazio diz como abrir um (Módulos, arrastar ou disposição).'],
  ['pesquisa', 'Pesquisa global', 'A Pesquisa com «skf»: ecrãs, artigos, fornecedores e encomendas a que a conta tem acesso; um clique abre ou escolhe.'],
  ['relacionados', 'Documentos ligados', 'A encomenda EF 2026/0411 escolhida: o fornecedor, as receções e os artigos dela; uma encomenda abre noutro grupo, ao lado.'],
  ['fixado', 'Inspetor fixado', 'A Ficha fixada no 6206-2RSH não mudam quando se escolhe outro artigo; o Stock, ao lado, segue a seleção (0 986 424 797).'],
  ['notificacoes', 'Alertas de compras', 'Só o que os dados dizem: encomendas por aprovar, entregas atrasadas e artigos sem stock, cada um a abrir o documento.'],
  ['reposta', 'Disposição reposta', 'Ao voltar ao ERP, a disposição é reposta; um ecrã que deixou de existir ou sem acesso fica de fora, e as Mensagens dizem qual.'],
  ['invalida', 'Disposição guardada inválida', 'A disposição guardada não se pôde ler (outra versão do ERP): abre a padrão e as Mensagens dizem porquê.'],
  ['sem-acesso', 'Sem acesso às Compras', 'Uma conta de Vendas: os Módulos ficam vazios, as Encomendas da disposição ficam de fora e abrir um ecrã de Compras diz que não há acesso.'],
  ['sem-rota', 'Ecrã ainda sem rota', 'Pedir um ecrã que ainda não existe no ERP novo (Fornecedores): não abre, diz para continuar no ERP antigo e fica nas Mensagens do sistema.'],
  ['offline', 'Sem ligação', 'Sem ligação ao servidor: a barra de estado fica a vermelho; o que está aberto continua à vista e o que grava espera.'],
  ['a-abrir', 'A abrir', 'Os ecrãs a abrir: «A abrir…» no lugar de cada um e, na barra de estado, quantos faltam.'],
  ['falha', 'Ecrã que não abriu', 'A Lista de Faltas não respondeu a tempo: no lugar dela, o que aconteceu e «Tentar outra vez»; o resto continua a funcionar.'],
  ['sessao', 'Sessão expirada', 'A sessão terminou: «Entrar outra vez» leva ao login comum (ROMAFE Identity); a disposição fica guardada.'],
  ['menu-a-carregar', 'Menu a carregar', 'A navegação ainda a chegar da API central: os Módulos mostram o esqueleto, sem inventar itens.'],
  ['menu-falhou', 'O menu não carregou', 'A navegação não respondeu: os Módulos dizem-no e deixa tentar outra vez; os ecrãs abertos continuam.'],
];
export type IdIde = `ide-${string}`;
export function estadosIde(): Ecra<IdErp>[] {
  return ESTADOS.map(([c, nome, objetivo], i) => ({ id: `ide-${c}` as IdErp, nome: `05.${60 + i} · ${nome}`, fluxo: 'Início', estadoDe: 'inicio' as IdErp, objetivo, versoes: [{ ...V3, html: pagina(c) }] }));
}
