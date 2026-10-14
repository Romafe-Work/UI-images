/* =========================================================
   GOPARTS — os ecrãs do portal (depois de entrar)
   Vieram do Figma-WebShop-GoParts a 8 out. 2026; o HTML de cada um está no
   .html ao lado, e a base põe o topo, as abas e o rodapé.
   ========================================================= */

import type { EcraGoParts } from '../ids';
import { portal } from './base';
import { estadosInicio, estadosCatalogo, estadosPedidos, estadosGuias, estadosFaturas } from './estados';
import { faturasV1 } from './faturas-v1';
import { guiasV2 } from './guias-v2';
import { inicioV3 } from './inicio-v3';
import { catalogoV5 } from './catalogo-v5';

/** O catálogo v6: o da v5 com as classes do desenho novo (o Início v3) e do motor de transições. */
export const catalogoV6 = () => catalogoV5.replace('class="portal ', 'class="portal portal--ini3 portal--cat6 ').replace('<main class="cat2 cat3 cat4 cat5"', '<main class="cat2 cat3 cat4 cat5 cat6"');
import pedidosV2 from './pedidos-v2.html?raw';
import { pedidosV3 } from './pedidos-v3';

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
    /* 12 out. 2026: ela pediu para tirar a v1 (a do Figma-WebShop-GoParts) */
    { id: 'v2', nota: 'A partir dos Pedidos atuais do GO REPAIR, no estilo do Início v2.2 (12 out.): filtros no cartão azul, estado em separadores com contagem, resumo, e cada pedido abre os seus artigos', html: portal('pedidos', pedidosV2, undefined, { menu: true, rodape: false }) },
    /* 13 out. 2026: ela, com a imagem do GO REPAIR, «quando clico num pedido queria mostrar de outra forma» */
    { id: 'v3', nota: 'A v2 com o pedido num painel à direita (13 out.): a lista fica à vista; o painel tem o percurso (recebido → entregue), os artigos com pedida, servida e pendente, os totais e repetir / guia / fatura; ↑ ↓ passam de pedido, Esc fecha', html: portal('pedidos', pedidosV3, undefined, { menu: true, rodape: false }) }],
    objetivo: 'Os pedidos feitos: filtros por datas, número, referência e estado; os totais em cima e a lista com o estado de cada um.' },
  ...estadosPedidos(),
  /* 13 out. 2026: ela não gostou da v1 (a do Figma-WebShop-GoParts) — fica só a v2 */
  { id: 'guias', nome: '13 · Guias de remessa', fluxo: FLUXO, versoes: [
    /* 13 out. 2026: ela, «faz este screen com exemplos e animações» e «coloca animações e todos os estados possíveis» */
    { id: 'v2', nota: 'No estilo dos Pedidos v3 (13 out.): filtros no cartão azul com Todas / Faturas / Notas de crédito, as colunas do GO REPAIR com oito guias de exemplo, e a guia num painel à direita (documentos, artigos, valores a contar); estados 13.1 a 13.9', html: portal('guias', guiasV2, undefined, { menu: true, rodape: false }) }],
    objetivo: 'As guias de remessa e as notas de crédito: filtros, os totais faturados e a lista com bruto, desconto, portes e IVA.' },
  ...estadosGuias(),
  /* 13 out. 2026: ela, com a imagem das faturas do GO REPAIR: «para as faturas» (como nas guias) */
  { id: 'faturas', nome: '14 · Faturas', fluxo: FLUXO, versoes: [{ id: 'v1', nota: 'No estilo das Guias v2 (13 out.): resumo com o que está em aberto, filtros no cartão azul, as colunas do GO REPAIR (três pares base/IVA) e o pagamento; a fatura num painel com a referência Multibanco; estados 14.1 a 14.9', html: portal('faturas', faturasV1, undefined, { menu: true, rodape: false }) }],
    objetivo: 'As faturas e as notas de crédito: filtros, o total e o que está por pagar, e a lista com os valores e o estado do pagamento.' },
  ...estadosFaturas(),
];
