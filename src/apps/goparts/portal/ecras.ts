/* =========================================================
   GOPARTS — os ecrãs do portal (depois de entrar)
   Vieram do Figma-WebShop-GoParts a 8 out. 2026; o HTML de cada um está no
   .html ao lado, e a base põe o topo, as abas e o rodapé.
   ========================================================= */

import { garagemPagina } from './garagem';
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
import { painelV5, type EstadoPn } from './painel';
import { catalogoV5 } from './catalogo-v5';

/** O catálogo v6: o da v5 com as classes do desenho novo (o Início v3) e do motor de transições. */
export const catalogoV6 = () => catalogoV5.replace('class="portal ', 'class="portal portal--ini3 portal--cat6 ').replace('<main class="cat2 cat3 cat4 cat5"', '<main class="cat2 cat3 cat4 cat5 cat6"');
import { pedidosV4 } from './pedidos-v4';

const FLUXO = 'Portal';

export const ecrasPortal: EcraGoParts[] = [
  /* 21 out.: a garagem passa a ecrã próprio, o primeiro do menu (ela: «a minha garagem deve ser a primeira opção de menu») */
  { id: 'garagem', nome: '09 · A minha garagem', fluxo: FLUXO, objetivo: 'Os veículos com que a oficina trabalha: o favorito primeiro, marcar, mudar o nome, tirar e adicionar pela matrícula; «Peças compatíveis» abre o Catálogo com o veículo e «Usar na pesquisa» identifica-o na Pesquisar peças.', versoes: [{ id: 'v1', nota: 'A garagem como ecrã (21 out.), com o bloco que estava na Pesquisar peças', html: portal('garagem', garagemPagina(), undefined, { menu: true, rodape: false }) }] },
  /* 20 out. 2026 (V5, briefing «New Command Dashboard & Separate Parts Search Workspace»): o Início passa a painel da
     atividade e a pesquisa de peças vai para o seu ecrã (18 · Pesquisar peças, logo a seguir). Uma só versão por
     ecrã: a v3 (o espaço de trabalho com a pesquisa) saiu daqui — o código dela é o da Pesquisar peças. */
  { id: 'inicio', nome: '10 · Início', fluxo: FLUXO, versoes: [
    { id: 'v7', nota: 'O painel em cartões (21 out., V9, do briefing «Redesign clean»): saudação, data, conta e armazém; «O que procuras hoje?» com os três cartões da pesquisa (azul, azul, laranja), cada um abre a pesquisa no seu modo; sete atalhos com o seu número (em curso, vencidas, em aberto); últimos pedidos e o que requer atenção; o resumo em cartões compactos (guias, devoluções, pesquisas, listas, peças frequentes). Saíram os quatro números, o gráfico e o período', html: portal('inicio', painelV5(), undefined, { menu: true, rodape: false }) }],
    objetivo: 'Perceber de relance a atividade da conta e agir: quanto se comprou e quando, onde está cada encomenda, o que pede uma ação (faturas vencidas, recolhas, devoluções), os últimos pedidos e documentos, e os atalhos para o resto do portal. Pesquisar peças é no ecrã seguinte.' },
  ...estadosPainel(),
  { id: 'pesquisa', nome: '18 · Pesquisar peças', fluxo: FLUXO, versoes: [
    { id: 'v1', nota: 'A pesquisa que estava no Início (20 out., V5): «Como queres pesquisar?» — Matrícula, Veículo ou Referência, um formulário de cada vez; o veículo identificado por baixo; as opções da referência e a pesquisa avançada (catálogo, universal, informação técnica) que se abrem; e o que ajuda a pesquisar — continuar onde fiquei, a garagem, as peças frequentes, o stock por armazém e as categorias', html: portal('pesquisa', inicioV3(), undefined, { menu: true, rodape: false }) }],
    objetivo: 'Encontrar a peça certa: identificar o veículo pela matrícula ou pelo VIN, escolhê-lo pela marca e modelo, ou pesquisar a referência (com equivalências); depois, as peças compatíveis no catálogo.' },
  /* os estados da pesquisa (18.1…), que eram os do Início v3 e do espaço de trabalho */
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
  /* 14 out. 2026: do briefing dela, a Minha lista — peças e mão de obra, o resumo ao vivo, guardar e enviar.
     16 out. 2026: substituída (uma só versão) pelo espaço de orçamento do segundo briefing */
  { id: 'lista', nome: '15 · Minha lista', fluxo: FLUXO, versoes: [{ id: 'v2', nota: 'O espaço de orçamento (16 out., do briefing «Premium My List & Quotation Builder» e do esquema dela): cabeçalho compacto com o estado e «Por guardar», «Guardar lista» e «Mais ações»; peças, mão-de-obra (à hora ou fixo), outros custos e notas; o resumo preso com base, IVA 23 % e total com IVA; a gaveta «Adicionar peças», a pré-visualização e «Minhas listas»', html: portal('lista', listaHtml(), undefined, { menu: true, rodape: false }) }],
    objetivo: 'Montar um orçamento: procurar e adicionar peças, acertar quantidades, preços e descontos, juntar mão-de-obra e outros custos, ver os totais com e sem IVA, pré-visualizar, guardar, enviar ou pôr as peças no carrinho.' },
  ...estadosLista(),
  /* 15 out. 2026: do briefing dela («Returns Management Center») e da nota («daria prioridade à criação de devoluções
     num fluxo guiado e à visualização cronológica»): o ecrã novo, da família dos Pedidos, Guias e Faturas */
  { id: 'devolucoes', nome: '16 · Devoluções', fluxo: FLUXO, versoes: [{ id: 'v1', nota: 'Como os Pedidos, as Guias e as Faturas (15 out.): as devoluções por ano e mês, o estado por baixo da data (Por enviar, Enviada, Creditada — só o que os dados dizem); clicar abre o painel com os artigos devolvidos, o percurso confirmado (a caixa desce uma vez), Pedido → Guia → Devolução → Nota de crédito; «Criar devolução» em três passos, com os artigos a passar da fatura para a devolução', html: portal('devolucoes', devolucoesV1(), undefined, { menu: true, rodape: false }) }],
    objetivo: 'Criar, procurar e acompanhar as devoluções: filtros por datas, número e referência; a cronologia com o estado de cada uma; o painel com os artigos, o percurso e os documentos; a criação guiada a partir da fatura.' },
  ...estadosDevolucoes(),
  /* 15 out. 2026: v2 por cima da v1 (uma só versão por ecrã). Do briefing dela («Automotive Technical Intelligence Center») e da nota («seleção do veículo mais
     clara, navegação técnica agrupada e visualização de documentação com zoom […] depois, o explorador visual»):
     a aba «Inf. técnica», que ainda não tinha ecrã */
  { id: 'tecnica', nome: '17 · Informações técnicas', fluxo: FLUXO, versoes: [{ id: 'v2', nota: 'Do segundo briefing (15 out., «Automotive Engineering Workspace») e da nota dela («usaria o modelo 3D como porta de entrada»): três áreas — a navegação (recolhe-se a ícones), o conteúdo e o contexto (fecha-se); o carro em 3D na Visão geral (ilustrativo; a câmara vai ao sistema escolhido, exterior/técnica); a vista explodida do rolamento 6206; esquemas e fusíveis em galeria; o visor com as miniaturas; ao ler, o documento fica com o espaço', html: portal('tecnica', tecnicaV1(), undefined, { menu: true, rodape: false }) }],
    objetivo: 'Consultar a informação técnica de um veículo: escolhê-lo pela marca, modelo ou código do motor, e depois a manutenção, a reparação, o diagnóstico e os esquemas do WorkshopData, com o veículo sempre à vista.' },
  ...estadosTecnica(),
];

/** (20 out., V5) os estados do painel (10.1…). */
function estadosPainel(): EcraGoParts[] {
  /* (21 out., V7) os estados do briefing do Início: cada bloco carrega, falha e fica vazio sozinho */
  const E: [EstadoPn, EcraGoParts['id'], string, string][] = [
    ['carga', 'painel-carga', '10.1 · A carregar o Início', 'Os pedidos, os alertas e o resumo em esqueleto, com a forma do que vão mostrar; os cartões da pesquisa e os atalhos já se podem usar.'],
    ['atualizar', 'painel-atualizar', '10.2 · A atualizar', 'Os dados ficam à vista; só a hora no cabeçalho diz «A atualizar…».'],
    ['sem-pedidos', 'painel-vazio', '10.3 · Primeira utilização', 'Conta sem pedidos: os pedidos vazios com «Pesquisar peças», a atenção em dia, o resumo com o que vai aparecer em cada cartão.'],
    ['sem-alertas', 'painel-sem-alertas', '10.4 · Sem nada pendente', '«Está tudo em dia.» — compacto, sem ilustração.'],
    ['parcial', 'painel-parcial', '10.5 · Dados parciais', 'Os alertas não responderam: o bloco di-lo e tenta de novo; o resto do Início continua.'],
    ['offline', 'painel-offline', '10.6 · Sem ligação', 'A faixa diz de quando são os dados; «Atualizar» desligado até a ligação voltar.'],
    ['sessao', 'painel-sessao', '10.7 · Sessão expirada', 'O Início fica atrás, inerte; o diálogo pede para entrar outra vez e diz que se volta ao mesmo sítio.'],
    ['sem-permissao', 'painel-sem-permissao', '10.8 · Sem acesso aos pedidos', 'A conta não vê os pedidos: o bloco diz a quem pedir o acesso.'],
    ['nav-erro', 'painel-nav-erro', '10.9 · O pedido não abriu', 'A faixa diz que não foi possível abrir o pedido, com «Tentar de novo»; fica-se no Início.'],
    ['personalizar', 'painel-personalizar', '10.10 · Definições do Início', 'A gaveta: os blocos à vista (atalhos, pedidos, atenção, resumo) e repor.'],
  ];
  return E.map(([est, id, nome, objetivo]) => {
    let html = portal('inicio', painelV5(est).replace('class="portal ', 'class="portal portal--estado '), undefined, { menu: true, rodape: false });
    if (est === 'personalizar' || est === 'sessao') html = html.replace('<header class="portal__topo"', '<header class="portal__topo" inert aria-hidden="true"').replace('<nav class="portal__lado"', '<nav class="portal__lado" inert aria-hidden="true"').replace('<main class="pn"', '<main inert aria-hidden="true" class="pn"');
    return { id, nome, fluxo: FLUXO, estadoDe: 'inicio' as EcraGoParts['id'], objetivo, versoes: [{ id: 'v1', nota: 'Do briefing «Redesign clean» (21 out., V9)', html }] };
  });
}

function estadosLista(): EcraGoParts[] {
  /* 16 out. 2026: os 24 estados do briefing do espaço de orçamento, e os que a lista já tinha (enviada, só de leitura,
     sem permissão) e os da pré-visualização, de «Minhas listas» e do editor do serviço */
  const E: [EstadoLista, string, string][] = [
    ['vazia', '15.1 · Lista vazia', 'Uma lista guardada sem nada: cada secção diz o que falta numa linha, com o botão; nada de tabelas vazias.'],
    ['nova', '15.2 · Lista nova', 'Estado «Nova», «Por guardar», o nome para escrever; «Eliminar» desligado até haver lista guardada.'],
    ['pecas', '15.3 · Só com peças', 'Peças com imagem, disponibilidade, PVP e desconto na linha; a mão-de-obra vazia e compacta.'],
    ['mao', '15.4 · Só com mão-de-obra', 'Serviços à hora e a preço fixo; as peças vazias com «Adicionar peças».'],
    ['completa', '15.5 · Peças e mão-de-obra', 'Tudo com preço: o resumo com peças, mão-de-obra, descontos, base, IVA 23 % e total com IVA.'],
    ['sem-preco', '15.6 · Peças sem preço', 'O Peça A Peça não devolveu preços: «Preço indisponível» em cada linha e «— €» no total — nunca 0,00 €.'],
    ['indisponivel', '15.7 · Peça indisponível', 'Uma peça sem stock no Porto nem em Sacavém: dito na linha (texto e cor); não entra no carrinho.'],
    ['qtd-invalida', '15.8 · Quantidade inválida', '«1,5» numa peça: a mensagem por baixo, o total da linha em «—», e «Guardar lista» à espera da correção.'],
    ['desc-invalido', '15.9 · Desconto inválido', '120 %: o desconto vai de 0 a 100 %; o valor escrito fica, não é trocado em silêncio.'],
    ['sujo', '15.10 · Alterações por guardar', 'Uma quantidade mudada: «Por guardar» ao lado do estado, o ponto no «Guardar lista», a linha marcada.'],
    ['a-guardar', '15.11 · A guardar', 'O rolamento no botão e no indicador enquanto o servidor não responde.'],
    ['guardada', '15.12 · Guardada', 'O servidor confirmou: «Guardada agora», o estado passa a Guardada e o aviso em baixo.'],
    ['falhou-guardar', '15.13 · Não foi guardada', 'O servidor não respondeu: o rolamento encrava, a referência do erro e «Tentar novamente»; nada se perdeu.'],
    ['offline', '15.14 · Sem ligação', 'O rolamento abranda até parar; continua-se a editar; «Guardar lista» e «Enviar» voltam com a ligação.'],
    ['sem-resultados', '15.15 · Procura sem resultados', 'Na gaveta: a peça a que falta uma esfera, o que fazer e «Ir ao Catálogo».'],
    ['adicionar', '15.16 · A adicionar uma peça', 'A gaveta aberta com a procura, a peça escolhida e a quantidade; a linha nova acesa e o aviso com «Desfazer».'],
    ['remover', '15.17 · A remover uma peça', 'A linha a sair (desvanece e as outras sobem); o aviso «Retiraste…» com «Desfazer».'],
    ['remover-ultima', '15.18 · Remover a última peça', 'A secção das peças volta ao vazio compacto; a faixa diz o que fica e deixa desfazer.'],
    ['a-carregar', '15.19 · A abrir uma lista', 'O rolamento monta-se e desmonta-se enquanto a lista não chega; o resumo em «—».'],
    ['duplicar', '15.20 · Lista duplicada', 'A cópia aberta, estado Nova e por guardar; a faixa diz que a original não muda e leva de volta.'],
    ['eliminar', '15.21 · Eliminar a lista', 'O diálogo diz o nome, o que sai e que não se desfaz; «Eliminar a lista» a vermelho.'],
    ['a-enviar', '15.22 · A enviar', 'Depois de confirmar o endereço: o rolamento no «Enviar» até o servidor confirmar.'],
    ['falhou-enviar', '15.23 · O envio falhou', 'O endereço não foi aceite: a faixa diz porquê; a lista ficou guardada; «Enviar outra vez».'],
    ['sessao', '15.24 · Sessão expirada', 'O diálogo por cima: a lista fica no ecrã com as alterações; «Iniciar sessão».'],
    ['enviada', '15.25 · Enviada', 'O servidor confirmou o envio: estado Enviada, só de leitura, «Duplicar lista».'],
    ['leitura', '15.26 · Só de leitura', 'Uma lista enviada antes: vê-se e duplica-se, não se edita.'],
    ['sem-permissao', '15.27 · Sem permissão', 'Uma lista de outro utilizador da empresa: vê-se e duplica-se.'],
    ['previsualizar', '15.28 · Pré-visualização', 'O orçamento como vai sair, por cima da edição: rascunho, não emitido; Imprimir e Voltar à edição.'],
    ['listas', '15.29 · Minhas listas', 'As listas guardadas: procurar, filtrar por estado, datas, artigos e total; abrir repõe o que foi guardado.'],
    ['servico', '15.30 · Adicionar serviço', 'O editor do serviço aberto na secção: descrição com sugestões, por hora ou preço fixo, preço, desconto e total.'],
  ];
  return E.map(([est, nome, objetivo]) => {
    let html = listaHtml(est);
    /* 15.10: a quantidade mudada (2 → 3) e a linha marcada */
    if (est === 'sujo') html = html.replace(/(data-ref="VKBA 6556"[^>]*>)/, '$1').replace('lst__linha lst__linha--peca" data-tipo="peca" data-flip data-ref="VKBA 6556"', 'lst__linha lst__linha--peca is-alterada" data-tipo="peca" data-flip data-ref="VKBA 6556"').replace(/(aria-label="Quantidade de SKF VKBA 6556" value=")2"/, '$13"');
    html = html.replace('class="portal ', 'class="portal portal--estado ');
    /* com um diálogo aberto, o resto fica inerte */
    if (['eliminar', 'sessao', 'previsualizar', 'adicionar', 'sem-resultados'].includes(est)) html = html.replace('<main class="lst', '<main inert aria-hidden="true" class="lst');
    let final = portal('lista', html, undefined, { menu: true, rodape: false });
    if (['eliminar', 'sessao', 'previsualizar', 'adicionar', 'sem-resultados'].includes(est)) final = final.replace('<header class="portal__topo"', '<header class="portal__topo" inert aria-hidden="true"').replace('<nav class="portal__abas"', '<nav class="portal__abas" inert aria-hidden="true"');
    return { id: `lista-${est}` as EcraGoParts['id'], nome, fluxo: FLUXO, estadoDe: 'lista' as EcraGoParts['id'], objetivo, versoes: [{ id: 'v1', nota: 'Do briefing do espaço de orçamento (16 out.)', html: final }] };
  });
}
