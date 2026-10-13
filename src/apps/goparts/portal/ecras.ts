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
import inicioV22 from './inicio-v22.html?raw';
import catalogoV2 from './catalogo-v2.html?raw';
import { catalogoV3 } from './catalogo-v3';
import { catalogoV4 } from './catalogo-v4';
import { catalogoV5 } from './catalogo-v5';
import pedidosV2 from './pedidos-v2.html?raw';
import { pedidosV3 } from './pedidos-v3';
import guias from './guias.html?raw';

const FLUXO = 'Portal';
const NOTA = 'Do Figma-WebShop-GoParts, com o ROMAFE azul em Motor e botões com ícone e texto';

export const ecrasPortal: EcraGoParts[] = [
  { id: 'inicio', nome: '10 · Início', fluxo: FLUXO, versoes: [
    /* 12 out. 2026: ela pediu «no screen 10 mantém apenas v2.2»; saíram a v1, v2, v2.1, v2.3, v3, v4 e v5 */
    { id: 'v2.2', nota: 'A partir de uma imagem de referência (12 out.): topo e abas da v3, carrossel com um cartão grande ao centro e os outros atrás, setas redondas e pontos; por baixo, categorias, pesquisas recentes e últimos pedidos; no azul da Romafe; animações suaves', html: portal('inicio', inicioV22, undefined, { menu: true, rodape: false }) }],
    objetivo: 'O que se vê depois de entrar: três caminhos para chegar à peça — identificar o veículo (matrícula, chassis, descrição, motor), selecioná-lo (tipo, marca, modelo, veículo) ou pesquisar a referência (IAM, OE ou todas, com equivalências).' },
  /* os estados do Início (10.1, 10.2…), logo a seguir a ele (12 out. 2026) */
  ...estadosInicio(),
  { id: 'catalogo', nome: '11 · Catálogo', fluxo: FLUXO, versoes: [
    /* 12 out. 2026: ela pediu para tirar a v1 (a do Figma-WebShop-GoParts) */
    { id: 'v2', nota: 'A partir do catálogo atual do GO REPAIR, no estilo do Início v2.2 (12 out.): passos do catálogo, pesquisa por veículo no cartão azul, marcas com Favoritas/Todas e procura; a marca abre os modelos', html: portal('catalogo', catalogoV2, undefined, { menu: true, rodape: false }) },
    /* 13 out. 2026: ela, com as imagens do GO REPAIR, «faz os modelos e veiculos no catalogo» */
    { id: 'v3', nota: 'A v2 com os passos Modelos e Veículos do GO REPAIR (13 out.): a marca abre a tabela dos modelos, o modelo a dos veículos; os filtros de cada passo no cartão azul, que fica no sítio', html: portal('catalogo', catalogoV3, undefined, { menu: true, rodape: false }) },
    /* 13 out. 2026: ela mandou a imagem de um catálogo novo e a proposta das animações */
    { id: 'v4', nota: 'A partir da imagem dela (13 out.): «Encontrar veículo» num painel à esquerda que recolhe, as Marcas à direita com a contagem e uma faixa, cartões maiores; animações só quando se mexe (cartão, estrela, procura, Marca → Modelo, risca). Com os Modelos e Veículos da v3', html: portal('catalogo', catalogoV4, undefined, { menu: true, rodape: false }) },
    /* 13 out. 2026: a terceira imagem dela (Veículos) e a proposta das animações para Modelos e Veículos */
    { id: 'v5', nota: 'A v4 com os Veículos da terceira imagem (13 out.): barra BMW / 1 (E81), «Filtrar veículos» a toda a largura com listas que se ajustam umas às outras, Tabela/Lista, resultados por página, ordenar por ano, kW, cv e cc, e o (i) que abre os dados do motor; animações da proposta dela nos Modelos e nos Veículos. Também as Referências (fabricantes em etiquetas, agrupar, ver próprias, comparar; só em tabela) e o Universal (grupos em Árvore, Lista ou Colunas, e os fabricantes de cada grupo)', html: portal('catalogo', catalogoV5, undefined, { menu: true, rodape: false }) }],
    objetivo: 'O catálogo de peças: a pesquisa por veículo ou por referência num só sítio, e as marcas de automóveis para escolher.' },
  ...estadosCatalogo(),
  { id: 'pedidos', nome: '12 · Histórico de pedidos', fluxo: FLUXO, versoes: [
    /* 12 out. 2026: ela pediu para tirar a v1 (a do Figma-WebShop-GoParts) */
    { id: 'v2', nota: 'A partir dos Pedidos atuais do GO REPAIR, no estilo do Início v2.2 (12 out.): filtros no cartão azul, estado em separadores com contagem, resumo, e cada pedido abre os seus artigos', html: portal('pedidos', pedidosV2, undefined, { menu: true, rodape: false }) },
    /* 13 out. 2026: ela, com a imagem do GO REPAIR, «quando clico num pedido queria mostrar de outra forma» */
    { id: 'v3', nota: 'A v2 com o pedido num painel à direita (13 out.): a lista fica à vista; o painel tem o percurso (recebido → entregue), os artigos com pedida, servida e pendente, os totais e repetir / guia / fatura; ↑ ↓ passam de pedido, Esc fecha', html: portal('pedidos', pedidosV3, undefined, { menu: true, rodape: false }) }],
    objetivo: 'Os pedidos feitos: filtros por datas, número, referência e estado; os totais em cima e a lista com o estado de cada um.' },
  ...estadosPedidos(),
  { id: 'guias', nome: '13 · Guias de remessa', fluxo: FLUXO, versoes: [{ id: 'v1', nota: NOTA, html: portal('guias', guias) },
    /* 13 out. 2026: ela, «faz este screen com exemplos e animações» e «coloca animações e todos os estados possíveis» */
    { id: 'v2', nota: 'No estilo dos Pedidos v3 (13 out.): filtros no cartão azul com Todas / Faturas / Notas de crédito, as colunas do GO REPAIR com oito guias de exemplo, e a guia num painel à direita (documentos, artigos, valores a contar); estados 13.1 a 13.9', html: portal('guias', guiasV2, undefined, { menu: true, rodape: false }) }],
    objetivo: 'As guias de remessa e as notas de crédito: filtros, os totais faturados e a lista com bruto, desconto, portes e IVA.' },
  ...estadosGuias(),
  /* 13 out. 2026: ela, com a imagem das faturas do GO REPAIR: «para as faturas» (como nas guias) */
  { id: 'faturas', nome: '14 · Faturas', fluxo: FLUXO, versoes: [{ id: 'v1', nota: 'No estilo das Guias v2 (13 out.): resumo com o que está em aberto, filtros no cartão azul, as colunas do GO REPAIR (três pares base/IVA) e o pagamento; a fatura num painel com a referência Multibanco; estados 14.1 a 14.9', html: portal('faturas', faturasV1, undefined, { menu: true, rodape: false }) }],
    objetivo: 'As faturas e as notas de crédito: filtros, o total e o que está por pagar, e a lista com os valores e o estado do pagamento.' },
  ...estadosFaturas(),
];
