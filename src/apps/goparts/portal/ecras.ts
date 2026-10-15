/* =========================================================
   GOPARTS — os ecrãs do portal (depois de entrar)
   Vieram do Figma-WebShop-GoParts a 8 out. 2026; o HTML de cada um está no
   .html ao lado, e a base põe o topo, as abas e o rodapé.
   ========================================================= */

import type { EcraGoParts } from '../ids';
import { portal } from './base';
import { estadosInicio, estadosCatalogo, estadosPedidos, estadosGuias, estadosFaturas, estadosDevolucoes } from './estados';
import { devolucoesV1 } from './devolucoes';
import { tecnicaV1 } from './tecnica';
import { estadosTecnica } from './tecnica-estados';
import { faturasV2 } from './faturas-v2';
import { listaHtml, type EstadoLista } from './lista';
import { guiasV3 } from './guias-v3';
import { inicioV3 } from './inicio-v3';
import { catalogoV5 } from './catalogo-v5';

/** O catálogo v6: o da v5 com as classes do desenho novo (o Início v3) e do motor de transições. */
export const catalogoV6 = () => catalogoV5.replace('class="portal ', 'class="portal portal--ini3 portal--cat6 ').replace('<main class="cat2 cat3 cat4 cat5"', '<main class="cat2 cat3 cat4 cat5 cat6"');
import { pedidosV4 } from './pedidos-v4';

const FLUXO = 'Portal';

export const ecrasPortal: EcraGoParts[] = [
  { id: 'inicio', nome: '10 · Início', fluxo: FLUXO, versoes: [
    /* 14 out. 2026: do briefing dela, o espaço de trabalho de todos os dias; «só quero uma versão por screen» — saiu a v2.2 */
    { id: 'v3', nota: 'O espaço de trabalho de todos os dias (14 out.): os três modos em separadores com a risca laranja, o carrossel com perspetiva de 3°, sugestões ao escrever, Ctrl+K, e por baixo categorias, pesquisas recentes, últimos pedidos e veículos guardados', html: portal('inicio', inicioV3(), undefined, { menu: true, rodape: false }) }],
    objetivo: 'O que se vê depois de entrar: três caminhos para chegar à peça — identificar o veículo (matrícula, chassis, descrição, motor), selecioná-lo (tipo, marca, modelo, veículo) ou pesquisar a referência (IAM, OE ou todas, com equivalências).' },
  /* os estados do Início (10.1, 10.2…), logo a seguir a ele (12 out. 2026) */
  ...estadosInicio(),
  /* 13 out. 2026: ela, «mostra só a v2» — a v3, a v4 e a v5 ficam aqui escritas mas fora da lista
     (o filtro no fim); para voltarem, basta tirar o filtro */
  /* 14 out. 2026: do briefing dela («todo o ciclo do catálogo»), uma só versão: o percurso completo da v5
     (Marcas → Modelos → Veículos → Grupo montagem → Referências → Detalhes, e o Universal) com o desenho do
     Início v3, transições partilhadas e os estados na linguagem do rolamento (catalogo-v6.css,
     comportamento/catalogo-v6.ts); a v2 (só Marcas) e as v3–v4 saíram — o código delas fica, a v5 é feita
     por cima delas */
  { id: 'catalogo', nome: '11 · Catálogo', fluxo: FLUXO, versoes: [
    { id: 'v3', nota: 'O ciclo completo do catálogo (14 out.): Marcas → Modelos → Veículos → Grupo montagem → Referências → Detalhes e o Universal; liso, sem gradientes; o logótipo da marca voa para o cabeçalho dos Modelos, a referência para os Detalhes; o veículo fica sempre à vista; o carrinho confirma e a peça voa para ele', html: portal('catalogo', catalogoV6(), undefined, { menu: true, rodape: false }) }],
    objetivo: 'O catálogo de peças: a pesquisa por veículo ou por referência num só sítio, e as marcas de automóveis para escolher.' },
  ...estadosCatalogo(),
  { id: 'pedidos', nome: '12 · Histórico de pedidos', fluxo: FLUXO, versoes: [
    /* 15 out. 2026: do briefing dela («Histórico de Pedidos»); uma só versão por ecrã — saíram a v2 e a v3 (o código fica) */
    /* 15 out. (tarde): o segundo briefing dela, «Order journey» — a cronologia passa a ser o ecrã; a tabela fica como alternativa */
    { id: 'v5', nota: 'Cronologia: os pedidos do mais recente para o mais antigo, por mês, numa linha vertical que se desenha com o scroll; o pedido ativo a laranja; cada cartão abre-se no sítio (resumo, percurso só com os passos confirmados, artigos, entrega, documentos). Filtros compactos com etiquetas; «Tabela» como alternativa.', html: portal('pedidos', pedidosV4(), undefined, { menu: true, rodape: false }) }],
    objetivo: 'Os pedidos feitos: filtros por datas, número, referência e estado; os totais em cima e a lista com o estado de cada um.' },
  ...estadosPedidos(),
  /* 13 out. 2026: ela não gostou da v1 (a do Figma-WebShop-GoParts) — fica só a v2 */
  { id: 'guias', nome: '13 · Guias de remessa', fluxo: FLUXO, versoes: [
    /* 13 out. 2026: ela, «faz este screen com exemplos e animações» e «coloca animações e todos os estados possíveis» */
    /* 15 out. 2026: do briefing dela («Logistics Document Center») e «a guias faz tipo histórico também»: uma só versão — saiu a v2 (o código fica) */
    { id: 'v3', nota: 'Como o Histórico de pedidos (15 out.): as guias por ano e mês numa linha que se desenha com o scroll; cada guia abre-se no sítio com o percurso documental (Pedido → Guia → Fatura ou Nota de crédito, só as ligações que existem), a entrega, os valores e os artigos; o documento num painel com descarga; a Tabela com as colunas todas como alternativa', html: portal('guias', guiasV3(), undefined, { menu: true, rodape: false }) }],
    objetivo: 'As guias de remessa e as notas de crédito: filtros, os totais faturados e a lista com bruto, desconto, portes e IVA.' },
  ...estadosGuias(),
  /* 13 out. 2026: ela, com a imagem das faturas do GO REPAIR: «para as faturas» (como nas guias) */
  /* 15 out. 2026: do briefing dela («Financial Document Center») e da nota («manteria a ordem cronológica, tal como nos
     Pedidos e Guias […] daria maior destaque ao desdobramento dos impostos»): uma só versão — saiu a v1 (o código fica) */
  { id: 'faturas', nome: '14 · Faturas', fluxo: FLUXO, versoes: [{ id: 'v2', nota: 'Como os Pedidos e as Guias (15 out.): as faturas e as notas de crédito por ano e mês, o pagamento por baixo da data; clicar abre o painel com a discriminação (valores comerciais, IVA por taxa, total), o pagamento, Pedido → Guia → Fatura, a entrega e os artigos; Tabela com as colunas todas do GO REPAIR', html: portal('faturas', faturasV2(), undefined, { menu: true, rodape: false }) }],
    objetivo: 'As faturas e as notas de crédito: filtros, o total e o que está por pagar, e a lista com os valores e o estado do pagamento.' },
  ...estadosFaturas(),
  /* 14 out. 2026: do briefing dela, a Minha lista — peças e mão de obra, o resumo ao vivo, guardar e enviar */
  { id: 'lista', nome: '15 · Minha lista', fluxo: FLUXO, versoes: [{ id: 'v1', nota: 'Do briefing dela (14 out.): o editor de listas — nome editável e estado, Guardar e Enviar distintos, peças (Romafe / Cliente) e mão de obra com o mesmo padrão, edição na linha, o resumo preso com os totais que passam do valor antigo ao novo', html: portal('lista', listaHtml(), undefined, { menu: true, rodape: false }) }],
    objetivo: 'Montar, orçamentar, guardar e enviar uma lista de peças e de mão de obra: edição na própria linha, os totais ao vivo (sem IVA), e o custo das peças na Romafe à parte.' },
  ...estadosLista(),
  /* 15 out. 2026: do briefing dela («Returns Management Center») e da nota («daria prioridade à criação de devoluções
     num fluxo guiado e à visualização cronológica»): o ecrã novo, da família dos Pedidos, Guias e Faturas */
  { id: 'devolucoes', nome: '16 · Devoluções', fluxo: FLUXO, versoes: [{ id: 'v1', nota: 'Como os Pedidos, as Guias e as Faturas (15 out.): as devoluções por ano e mês, o estado por baixo da data (Por enviar, Enviada, Creditada — só o que os dados dizem); clicar abre o painel com os artigos devolvidos, o percurso confirmado (a caixa desce uma vez), Pedido → Guia → Devolução → Nota de crédito; «Criar devolução» em três passos, com os artigos a passar da fatura para a devolução', html: portal('devolucoes', devolucoesV1(), undefined, { menu: true, rodape: false }) }],
    objetivo: 'Criar, procurar e acompanhar as devoluções: filtros por datas, número e referência; a cronologia com o estado de cada uma; o painel com os artigos, o percurso e os documentos; a criação guiada a partir da fatura.' },
  ...estadosDevolucoes(),
  /* 15 out. 2026: do briefing dela («Automotive Technical Intelligence Center») e da nota («seleção do veículo mais
     clara, navegação técnica agrupada e visualização de documentação com zoom […] depois, o explorador visual»):
     a aba «Inf. técnica», que ainda não tinha ecrã */
  { id: 'tecnica', nome: '17 · Informações técnicas', fluxo: FLUXO, versoes: [{ id: 'v1', nota: 'O espaço de trabalho do veículo (15 out.): escolher a motorização (modelo, código do motor, fabricado desde / até, combustível, potência) com a pesquisa; o nome voa para a barra do veículo, sempre à vista; as 15 secções do ecrã antigo agrupadas (Veículo, Manutenção, Reparação, Diagnóstico, Recursos) com a risca laranja; o explorador com as zonas gerais do veículo; o leitor em três colunas e o visor das figuras com zoom e arrastar. Conteúdo técnico só do fornecedor', html: portal('tecnica', tecnicaV1(), undefined, { menu: true, rodape: false }) }],
    objetivo: 'Consultar a informação técnica de um veículo: escolhê-lo pela marca, modelo ou código do motor, e depois a manutenção, a reparação, o diagnóstico e os esquemas do WorkshopData, com o veículo sempre à vista.' },
  ...estadosTecnica(),
];

function estadosLista(): EcraGoParts[] {
  const E: [EstadoLista, string, string][] = [
    ['nova', '15.1 · Lista nova', 'A lista vazia: o nome para mudar, «Adicionar peça» e «Adicionar mão de obra»; «Enviar» e «Eliminar» desligados.'],
    ['sujo', '15.2 · Alterações por guardar', 'Uma alteração feita: o estado diz «Alterações por guardar» e o «Guardar» ganha o ponto.'],
    ['a-guardar', '15.3 · A guardar', 'O rolamento no «Guardar» até o servidor confirmar; o estado diz «A guardar…».'],
    ['guardada', '15.4 · Guardada', 'O servidor confirmou: «Guardada agora» e a faixa verde.'],
    ['falhou-guardar', '15.5 · Não foi guardada', 'O servidor não respondeu: nada se perdeu, «Tentar novamente».'],
    ['a-enviar', '15.6 · A enviar', 'Depois de confirmar o endereço: o rolamento no «Enviar».'],
    ['enviada', '15.7 · Enviada', 'O servidor confirmou o envio para o endereço.'],
    ['falhou-enviar', '15.8 · O envio falhou', 'O endereço não foi aceite: a faixa diz porquê e deixa tentar de novo.'],
    ['invalido', '15.9 · Campo inválido', 'Um PVP que não é número: a mensagem por baixo da célula; «Guardar» e «Enviar» esperam pela correção.'],
    ['adicionar', '15.10 · A adicionar uma peça', 'A procura da referência aberta e a linha nova a entrar, com o foco na quantidade.'],
    ['remover', '15.11 · Remover uma linha', 'A confirmação no próprio sítio: «Remover? Sim / Não»; só depois a linha se fecha.'],
    ['sem-referencia', '15.12 · Referência inexistente', 'A referência escrita não existe no catálogo: o que fazer.'],
    ['sem-resultados', '15.13 · Procura sem resultados', 'Nenhuma referência começa assim: confirmar ou ir ao Catálogo.'],
    ['sem-precos', '15.14 · Preços indisponíveis', 'Os preços não chegaram: «—» nos preços e nos totais; as linhas e quantidades continuam.'],
    ['offline', '15.15 · Sem ligação', 'O rolamento abranda até parar; continua-se a editar; «Guardar» e «Enviar» voltam com a ligação.'],
    ['leitura', '15.16 · Só de leitura', 'Uma lista já enviada: os campos não se editam; «Duplicar a lista».'],
    ['sem-permissao', '15.17 · Sem permissão', 'Uma lista de outro utilizador: vê-se e duplica-se, não se altera.'],
    ['eliminar', '15.18 · Eliminar a lista', 'O diálogo diz o nome da lista e o que acontece; «Eliminar a lista» a vermelho, «Cancelar» à mão.'],
  ];
  return E.map(([est, nome, objetivo]) => {
    let html = listaHtml(est);
    /* 15.11: a primeira linha já com a confirmação no sítio */
    if (est === 'remover') html = html.replace('<span class="lst__linha-accoes">', '<span class="lst__linha-accoes is-confirmar">').replace('aria-label="Remover a linha" data-dica="Remover">', 'aria-label="Remover a linha" data-dica="Remover">').replace(/(<span class="lst__linha-accoes is-confirmar">[\s\S]*?<\/button><\/span>)/, (m) => m.replace(/<\/span>$/, '<span class="lst__confirmar" role="group" aria-label="Confirmar remoção"><span>Remover?</span><button type="button" class="lst__sim">Sim</button><button type="button" class="lst__nao">Não</button></span></span>'));
    html = html.replace('class="portal ', 'class="portal portal--estado ');
    /* 15.18: com o diálogo aberto, o resto fica inerte */
    if (est === 'eliminar') html = html.replace('<main class="lst', '<main inert aria-hidden="true" class="lst');
    return { id: `lista-${est}` as EcraGoParts['id'], nome, fluxo: FLUXO, estadoDe: 'lista' as EcraGoParts['id'], objetivo, versoes: [{ id: 'v1', nota: 'Do briefing da Minha lista (14 out.)', html: portal('lista', html, undefined, { menu: true, rodape: false }) }] };
  });
}
