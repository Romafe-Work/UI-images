/* =========================================================
   GOPARTS — os ecrãs do portal (depois de entrar)
   Vieram do Figma-WebShop-GoParts a 8 out. 2026; o HTML de cada um está no
   .html ao lado, e a base põe o topo, as abas e o rodapé.
   ========================================================= */
import type { EcraGoParts } from '../ids';
import { portal } from './base';
import { estadosInicio, estadosCatalogo } from './estados';
import inicioV22 from './inicio-v22.html?raw';
import catalogo from './catalogo.html?raw';
import catalogoV2 from './catalogo-v2.html?raw';
import pedidos from './pedidos.html?raw';
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
  { id: 'catalogo', nome: '11 · Catálogo', fluxo: FLUXO, versoes: [{ id: 'v1', nota: NOTA, html: portal('catalogo', catalogo) },
    { id: 'v2', nota: 'A partir do catálogo atual do GO REPAIR, no estilo do Início v2.2 (12 out.): passos do catálogo, pesquisa por veículo no cartão azul, marcas com Favoritas/Todas e procura; a marca abre os modelos', html: portal('catalogo', catalogoV2, undefined, { menu: true, rodape: false }) }],
    objetivo: 'O catálogo de peças: a pesquisa por veículo ou por referência num só sítio, e as marcas de automóveis para escolher.' },
  ...estadosCatalogo(),
  { id: 'pedidos', nome: '12 · Histórico de pedidos', fluxo: FLUXO, versoes: [{ id: 'v1', nota: NOTA, html: portal('pedidos', pedidos) }],
    objetivo: 'Os pedidos feitos: filtros por datas, número, referência e estado; os totais em cima e a lista com o estado de cada um.' },
  { id: 'guias', nome: '13 · Guias de remessa', fluxo: FLUXO, versoes: [{ id: 'v1', nota: NOTA, html: portal('guias', guias) }],
    objetivo: 'As guias de remessa e as notas de crédito: filtros, os totais faturados e a lista com bruto, desconto, portes e IVA.' },
];
