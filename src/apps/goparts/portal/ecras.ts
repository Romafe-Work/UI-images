/* =========================================================
   GOPARTS — os ecrãs do portal (depois de entrar)
   Vieram do Figma-WebShop-GoParts a 8 out. 2026; o HTML de cada um está no
   .html ao lado, e a base põe o topo, as abas e o rodapé.
   ========================================================= */
import type { EcraGoParts } from '../ids';
import { portal, portalLinha } from './base';
import inicio from './inicio.html?raw';
import inicioV2 from './inicio-v2.html?raw';
import catalogo from './catalogo.html?raw';
import pedidos from './pedidos.html?raw';
import guias from './guias.html?raw';

const FLUXO = 'Portal';
const NOTA = 'Do Figma-WebShop-GoParts, com o ROMAFE azul em Motor e botões com ícone e texto';

export const ecrasPortal: EcraGoParts[] = [
  { id: 'inicio', nome: '10 · Início', fluxo: FLUXO, versoes: [{ id: 'v1', nota: NOTA, html: portal('inicio', inicio) },
    { id: 'v2', nota: 'A partir de uma imagem de referência (12 out.): escuro, as abas na barra do topo, um herói com a procura e as três pesquisas por baixo', html: portalLinha('inicio', inicioV2) }],
    objetivo: 'O que se vê depois de entrar: três caminhos para chegar à peça — identificar o veículo (matrícula, chassis, descrição, motor), selecioná-lo (tipo, marca, modelo, veículo) ou pesquisar a referência (IAM, OE ou todas, com equivalências).' },
  { id: 'catalogo', nome: '11 · Catálogo', fluxo: FLUXO, versoes: [{ id: 'v1', nota: NOTA, html: portal('catalogo', catalogo) }],
    objetivo: 'O catálogo de peças: a pesquisa por veículo ou por referência num só sítio, e as marcas de automóveis para escolher.' },
  { id: 'pedidos', nome: '12 · Histórico de pedidos', fluxo: FLUXO, versoes: [{ id: 'v1', nota: NOTA, html: portal('pedidos', pedidos) }],
    objetivo: 'Os pedidos feitos: filtros por datas, número, referência e estado; os totais em cima e a lista com o estado de cada um.' },
  { id: 'guias', nome: '13 · Guias de remessa', fluxo: FLUXO, versoes: [{ id: 'v1', nota: NOTA, html: portal('guias', guias) }],
    objetivo: 'As guias de remessa e as notas de crédito: filtros, os totais faturados e a lista com bruto, desconto, portes e IVA.' },
];
