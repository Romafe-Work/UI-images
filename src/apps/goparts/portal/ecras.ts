/* =========================================================
   GOPARTS — os ecrãs do portal (depois de entrar)
   Vieram do Figma-WebShop-GoParts a 8 out. 2026; o HTML de cada um está no
   .html ao lado, e a base põe o topo, as abas e o rodapé.
   ========================================================= */
import type { EcraGoParts } from '../ids';
import { portal, portalLinha, portalLateral, portalTopoLado } from './base';
import inicio from './inicio.html?raw';
import inicioV2 from './inicio-v2.html?raw';
import inicioV21 from './inicio-v21.html?raw';
import inicioV22 from './inicio-v22.html?raw';
import inicioV23 from './inicio-v23.html?raw';
import inicioV3 from './inicio-v3.html?raw';
import inicioV4 from './inicio-v4.html?raw';
import inicioV5 from './inicio-v5.html?raw';
import catalogo from './catalogo.html?raw';
import pedidos from './pedidos.html?raw';
import guias from './guias.html?raw';

const FLUXO = 'Portal';
const NOTA = 'Do Figma-WebShop-GoParts, com o ROMAFE azul em Motor e botões com ícone e texto';

export const ecrasPortal: EcraGoParts[] = [
  { id: 'inicio', nome: '10 · Início', fluxo: FLUXO, versoes: [{ id: 'v1', nota: NOTA, html: portal('inicio', inicio) },
    { id: 'v2', nota: 'A partir de uma imagem de referência (12 out.): claro e escuro, ajustável à janela; as abas na barra do topo, um herói com a procura e as três pesquisas por baixo', html: portalLinha('inicio', inicioV2) },
    { id: 'v2.1', nota: 'A v2 com as três pesquisas num carrossel de cartões 3D: uma ao centro, as outras aos lados, setas com o nome para onde levam (12 out.)', html: portalLinha('inicio', inicioV21) },
    { id: 'v2.2', nota: 'A partir de uma imagem de referência (12 out.): topo e abas da v3, carrossel com um cartão grande ao centro e os outros atrás, setas redondas, pontos e acesso rápido; no azul da Romafe', html: portal('inicio', inicioV22, undefined, { menu: true, rodape: false }) },
    { id: 'v2.3', nota: 'A v2.1 com as três pesquisas a rodar num prisma 3D (Identificar → Selecionar → Pesquisar), com a técnica do card 14 do shadcnspace (12 out.)', html: portalLinha('inicio', inicioV23) },
    { id: 'v3', nota: 'A partir de uma imagem de referência (12 out.): a v1 redesenhada — menu, procura no topo, abas com divisórias, cabeças lisas; claro e escuro, ajustável', html: portal('inicio', inicioV3, undefined, { menu: true, rodape: false }) },
    { id: 'v4', nota: 'A partir de uma imagem de referência (12 out.): menu à esquerda com ajuda, herói com desenho de peças, categorias, pesquisas recentes e últimos pedidos; claro e escuro, ajustável', html: portalLateral('inicio', inicioV4) },
    { id: 'v5', nota: 'A partir de uma imagem de referência (12 out.): topo com a procura, secções à esquerda, faixa com a procura, painéis com o botão à largura toda e quatro factos; claro e escuro, ajustável', html: portalTopoLado('inicio', inicioV5) }],
    objetivo: 'O que se vê depois de entrar: três caminhos para chegar à peça — identificar o veículo (matrícula, chassis, descrição, motor), selecioná-lo (tipo, marca, modelo, veículo) ou pesquisar a referência (IAM, OE ou todas, com equivalências).' },
  { id: 'catalogo', nome: '11 · Catálogo', fluxo: FLUXO, versoes: [{ id: 'v1', nota: NOTA, html: portal('catalogo', catalogo) }],
    objetivo: 'O catálogo de peças: a pesquisa por veículo ou por referência num só sítio, e as marcas de automóveis para escolher.' },
  { id: 'pedidos', nome: '12 · Histórico de pedidos', fluxo: FLUXO, versoes: [{ id: 'v1', nota: NOTA, html: portal('pedidos', pedidos) }],
    objetivo: 'Os pedidos feitos: filtros por datas, número, referência e estado; os totais em cima e a lista com o estado de cada um.' },
  { id: 'guias', nome: '13 · Guias de remessa', fluxo: FLUXO, versoes: [{ id: 'v1', nota: NOTA, html: portal('guias', guias) }],
    objetivo: 'As guias de remessa e as notas de crédito: filtros, os totais faturados e a lista com bruto, desconto, portes e IVA.' },
];
