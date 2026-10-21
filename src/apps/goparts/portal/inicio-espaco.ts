/* =========================================================
   GOPARTS — 10 · Início: o espaço de trabalho (16 out. 2026)
   Do briefing dela («Ultimate Home Dashboard Redesign»), por cima do Início v3 (uma só versão por ecrã): a
   pesquisa dos três cartões fica como estava (ela tinha-a acertado), e as zonas de baixo passam a blocos que se
   escolhem, escondem e reordenam em «Personalizar Início»:
   - A saudação (Bom dia, Fernando), a conta, o armazém de saída e o que está pendente (tirado dos documentos).
   - O veículo identificado aparece por baixo da pesquisa, aos poucos, com «Ver peças compatíveis».
   - Blocos: Atalhos, As minhas encomendas (contadores e o percurso de cada uma), Continuar onde fiquei,
     A minha garagem, Categorias, Peças que compras frequentemente, Disponibilidade por armazém.
   Nada é inventado: as encomendas, as listas, as faturas e as referências são os dados de exemplo do resto do
   portal; as peças frequentes contam-se dos pedidos e das listas; o stock e a saída são os do catálogo. Onde o
   servidor ainda não dá um valor (hora limite, fotografias dos veículos), diz-se isso.
   Comportamento: comportamento/inicio-espaco.ts. CSS: css/inicio-espaco.css.
   ========================================================= */
import { REFERENCIAS, euros, saida, veiculosDe, MODELOS, type Referencia, type Veiculo } from './catalogo-dados';
import { LINHAS, PEDIDOS, type Pedido, type LinhaPedido } from './pedidos-dados';
import { FATURAS } from './faturas-dados';
import { DEVOLUCOES, estadoDev } from './devolucoes-dados';
import { etapa } from './pedidos-v4';
import { LISTAS } from './lista';
import { CAT_SVG } from './categorias-svg';
import { imagemModelo } from './carros';
import { azulejoPeca } from './pecas-img';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import settings2 from 'lucide-static/icons/settings-2.svg?raw';
import packageIcon from 'lucide-static/icons/package.svg?raw';
import packageCheck from 'lucide-static/icons/package-check.svg?raw';
import packageOpen from 'lucide-static/icons/package-open.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import store from 'lucide-static/icons/store.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import star from 'lucide-static/icons/star.svg?raw';
import ellipsis from 'lucide-static/icons/ellipsis.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import carFront from 'lucide-static/icons/car-front.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import listPlus from 'lucide-static/icons/list-plus.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import cart from 'lucide-static/icons/shopping-cart.svg?raw';
import headset from 'lucide-static/icons/headset.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowUpRight from 'lucide-static/icons/arrow-up-right.svg?raw';
import repeat from 'lucide-static/icons/repeat.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import refreshCcw from 'lucide-static/icons/refresh-ccw.svg?raw';
import gripVertical from 'lucide-static/icons/grip-vertical.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import triangleAlert from 'lucide-static/icons/triangle-alert.svg?raw';
import shieldAlert from 'lucide-static/icons/shield-alert.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import zap from 'lucide-static/icons/zap.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import save from 'lucide-static/icons/save.svg?raw';
import eyeOff from 'lucide-static/icons/eye-off.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';

export const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-i="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
export const IC = { settings2, packageIcon, packageCheck, packageOpen, truck, store, history, star, ellipsis, pencil, trash, plus, search, carFront, hash, layoutGrid, listPlus, list, cart, headset, warehouse, chevronRight, chevronDown, arrowRight, arrowUpRight, repeat, fileText, rotateCcw, refreshCcw, gripVertical, x, check, triangleAlert, shieldAlert, clock, mapPin, receipt, zap, info, save, eyeOff, eye };
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const btn = (texto: string, icone: string, extra = '', cls = '') => `<button type="button" class="btn ini4__btn${cls ? ` ${cls}` : ''}"${extra}>${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;
const acao = (texto: string, icone: string, extra = '', cls = '') => btn(texto, icone, extra, `btn--acao ${cls}`.trim());
let uid = 0;

/* =========================================================
   Os blocos e as preferências
   ========================================================= */
export type IdBloco = 'atencao' | 'resumo' | 'atalhos' | 'encomendas' | 'continuar' | 'garagem' | 'categorias' | 'frequentes' | 'disponibilidade';
/** nome · o que mostra · largura (todo = a linha toda; meio = meia linha a partir de 901 px) */
export const BLOCOS: Record<IdBloco, [string, string, 'todo' | 'meio', string]> = {
  /* (20 out., briefing V4) o que pede uma ação e o resumo, logo por baixo da pesquisa */
  atencao: ['Requer a tua atenção', 'Faturas vencidas, pedidos prontos a levantar, devoluções por enviar', 'meio', triangleAlert],
  resumo: ['Resumo da atividade', 'Os pedidos por estado, as devoluções e as listas — cada número abre a lista filtrada', 'meio', layoutGrid],
  atalhos: ['Acesso rápido', 'Os caminhos que usa mais vezes', 'meio', zap],
  encomendas: ['Últimos pedidos', 'O estado e o percurso de cada pedido, sem sair do Início', 'meio', packageIcon],
  continuar: ['Continuar onde fiquei', 'A última pesquisa, referência, categoria e lista', 'meio', history],
  garagem: ['A minha garagem', 'Os veículos guardados', 'todo', carFront],
  categorias: ['Categorias', 'As famílias de peças mais procuradas', 'todo', layoutGrid],
  frequentes: ['Peças frequentes', 'Das suas encomendas e listas, e as favoritas', 'meio', repeat],
  disponibilidade: ['Disponibilidade por armazém', 'O stock de uma referência no Porto e em Sacavém', 'meio', warehouse],
};
/* (20 out., briefing V4) a ordem segue a do telemóvel do briefing: atenção, pedidos, continuar, garagem, acesso rápido,
   peças; no computador ficam aos pares (atenção | resumo, pedidos | continuar, …) */
export const ORDEM: IdBloco[] = ['atencao', 'resumo', 'encomendas', 'continuar', 'garagem', 'atalhos', 'frequentes', 'categorias', 'disponibilidade'];

export type IdAtalho = 'referencia' | 'identificar' | 'carrinho' | 'pedidos' | 'lista' | 'faturas' | 'devolucoes' | 'favoritos' | 'suporte';
export const ATALHOS: Record<IdAtalho, [string, string]> = {
  referencia: ['Pesquisar peça', hash], faturas: ['Consultar faturas', receipt], devolucoes: ['Abrir devoluções', rotateCcw], identificar: ['Identificar veículo', carFront], carrinho: ['Ver carrinho', cart],
  pedidos: ['Consultar pedidos', packageIcon], lista: ['Criar lista', listPlus], favoritos: ['Peças favoritas', star], suporte: ['Contactar o apoio', headset],
};
export type Prefs = { ordem: IdBloco[]; escondidos: IdBloco[]; densidade: 'confortavel' | 'compacta'; modo: -1 | 0 | 1 | 2; atalhos: IdAtalho[] };
export const PREFS: Prefs = { ordem: [...ORDEM], escondidos: [], densidade: 'confortavel', modo: -1, atalhos: ['referencia', 'identificar', 'carrinho', 'pedidos', 'lista', 'faturas', 'devolucoes'] };
/** As preferências são da pessoa e da conta: num servidor, guardam-se no perfil; aqui, no navegador. */
export const CHAVE_PREFS = 'goparts:inicio:ff-porto:v2'; // v2 a 20 out.: os blocos novos e a ordem do briefing V4

/* =========================================================
   A garagem e a identificação do veículo
   ========================================================= */
/** Um veículo identificado: a versão exata do catálogo (marca, modelo, índice do motor em veiculosDe). */
export type Carro = { id: string; matricula: string; marca: string; modelo: string; v: number; ano: number; nome?: string; favorito?: boolean; ultima?: string; quando?: string };
/* O que o serviço de identificação devolve neste protótipo: só estas matrículas e este VIN (mais nenhum é inventado). */
export const IDENTIFICADOS: Record<string, Omit<Carro, 'id' | 'matricula'>> = {
  'AA-12-BC': { marca: 'Renault', modelo: 'Clio IV (BH_)', v: 1, ano: 2017 },
  '45-XZ-91': { marca: 'Peugeot', modelo: '308 II (LB_, LP_, LW_)', v: 3, ano: 2019 },
  '12-RT-08': { marca: 'VW', modelo: 'Golf VII (5G1, BQ1, BE1, BE2)', v: 1, ano: 2015 },
  '78-QL-22': { marca: 'BMW', modelo: '1 (F20)', v: 0, ano: 2016 },
};
export const VINS: Record<string, string> = { VF1RFB00X56789012: 'AA-12-BC' };
export const GARAGEM: Carro[] = [
  { id: 'c1', matricula: 'AA-12-BC', ...IDENTIFICADOS['AA-12-BC'], favorito: true, ultima: 'Pastilhas de travão', quando: 'hoje' },
  { id: 'c2', matricula: '45-XZ-91', ...IDENTIFICADOS['45-XZ-91'], nome: 'Peugeot 308 do Sr. Costa', ultima: 'Kit de distribuição', quando: '14/10' },
  { id: 'c3', matricula: '12-RT-08', ...IDENTIFICADOS['12-RT-08'], ultima: 'Kit de distribuição', quando: '13/10' },
];
export const CHAVE_GARAGEM = 'goparts:garagem:v1';
/** A matrícula portuguesa: três pares de letras ou algarismos (AA-00-AA, 00-AA-00, 00-00-AA…). */
export const normalizarMatricula = (s: string) => { const c = s.toUpperCase().replace(/[^A-Z0-9]/g, ''); return c.length === 6 ? `${c.slice(0, 2)}-${c.slice(2, 4)}-${c.slice(4)}` : ''; };
export const marcaNome = (m: string) => (m === 'VW' ? 'Volkswagen' : m);
/** «Clio IV (BH_)» → «Clio IV»; «1 (F20)» da BMW → «Série 1». */
export const modeloCurto = (marca: string, modelo: string) => { const s = modelo.replace(/\s*\([^)]*\)\s*$/, ''); return marca === 'BMW' && /^\d/.test(s) ? `Série ${s}` : s; };
export const versaoDe = (c: Pick<Carro, 'marca' | 'modelo' | 'v'>): Veiculo | undefined => veiculosDe(c.marca, c.modelo)[c.v];
export const carrocariaDe = (c: Pick<Carro, 'marca' | 'modelo'>) => (MODELOS[c.marca]?.find((m) => m[0] === c.modelo)?.[3]) ?? 'Hatchback';
export const nomeCarro = (c: Carro) => `${marcaNome(c.marca)} ${modeloCurto(c.marca, c.modelo)} ${versaoDe(c)?.versao ?? ''}`.trim();

/* =========================================================
   O que se fez (Continuar onde fiquei)
   ========================================================= */
export type Atividade = { tipo: 'veiculo' | 'ref' | 'categoria'; titulo: string; sub: string; quando: number; dados: Record<string, string> };
export const CHAVE_ATIVIDADE = 'goparts:atividade:v1';
/** O que se fez na primeira visita do protótipo (no servidor, viria do histórico da conta). */
export function atividadeInicial(agora = Date.now()): Atividade[] {
  const hoje = new Date(agora); hoje.setHours(9, 10, 0, 0);
  const h = (horas: number, min = 0) => hoje.getTime() + (horas - 9) * 3600e3 + (min - 10) * 60e3;
  return [
    { tipo: 'ref', titulo: 'SKF VKBA 6556', sub: 'Kit de rolamento de roda, eixo dianteiro', quando: h(9, 42), dados: { fab: 'SKF', ref: 'VKBA 6556' } },
    { tipo: 'veiculo', titulo: 'BMW Série 1 120d', sub: 'Rolamentos de roda · 78-QL-22', quando: h(9, 10), dados: { matricula: '78-QL-22' } },
    { tipo: 'categoria', titulo: 'Travagem', sub: 'Categoria', quando: h(-15, 15), dados: { categoria: 'Travagem' } },
  ];
}
export function quandoTexto(t: number, agora = Date.now()): string {
  const d = new Date(t), hoje = new Date(agora); hoje.setHours(0, 0, 0, 0);
  const hm = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  if (t >= hoje.getTime()) return `Hoje, ${hm}`;
  if (t >= hoje.getTime() - 864e5) return `Ontem, ${hm}`;
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }).replace('.', '');
}

/* =========================================================
   As encomendas (dos Pedidos)
   ========================================================= */
export type EstadoEnc = 'preparacao' | 'transporte' | 'recolha' | 'entregue';
export const ESTADOS_ENC: [EstadoEnc, string, string][] = [['preparacao', 'Em preparação', packageOpen], ['transporte', 'Em transporte', truck], ['recolha', 'Disponíveis para recolha', store], ['entregue', 'Entregues', packageCheck]];
export const ESTADO_UM: Record<EstadoEnc, string> = { preparacao: 'Em preparação', transporte: 'Em transporte', recolha: 'Para recolha', entregue: 'Entregue' };
export type Encomenda = { linha: LinhaPedido; pedido: Pedido; estado: EstadoEnc; atual: number; artigos: number; valor: number };
/** O estado vem do último passo do percurso que já aconteceu (o do pedido). */
export function encomendas(): Encomenda[] {
  return LINHAS.map((linha) => {
    const pedido = PEDIDOS.find((p) => p.num === linha.num)!;
    const atual = pedido.percurso.reduce((a, p, i) => (p[1] ? i : a), 0);
    const nome = pedido.percurso[atual][0];
    const estado: EstadoEnc = /^(Entregue|Levantado)/.test(nome) ? 'entregue' : /^Pronto/.test(nome) ? 'recolha' : /^Expedido/.test(nome) ? 'transporte' : 'preparacao';
    return { linha, pedido, estado, atual, artigos: pedido.artigos.reduce((s, a) => s + a[0], 0), valor: pedido.artigos.reduce((s, a) => s + a[3], 0) };
  });
}
const PASSO: Record<string, string> = { Recebido: 'Pedido recebido', Separado: 'Em preparação', 'Em separação': 'Em preparação', 'Pronto a levantar': 'Disponível para recolha' };
/** Repetir: cada artigo do pedido procura-se no catálogo atual pela referência; só os que existem entram. */
export function repetirDe(p: Pedido): { artigo: string; qtd: number; r?: Referencia; antes: number }[] {
  return p.artigos.map(([qtd, , artigo, total]) => ({ artigo, qtd, antes: total / qtd, r: REFERENCIAS.find((r) => artigo.includes(r[2])) }));
}
export const liquido = (r: Referencia) => Math.round(r[4] * (1 - r[5] / 100) * 100) / 100;

/* =========================================================
   As peças frequentes (contadas nas encomendas e nas listas)
   ========================================================= */
export type Frequente = { r: Referencia; pedidos: number; listas: number };
export function frequentes(): Frequente[] {
  return REFERENCIAS.map((r) => ({ r, pedidos: PEDIDOS.filter((p) => p.artigos.some((a) => a[2].includes(r[2]))).length, listas: LISTAS.filter((l) => l.pecas.some((p) => p.ref === r[2])).length }))
    .filter((f) => f.pedidos + f.listas > 0).sort((a, b) => b.pedidos * 2 + b.listas - (a.pedidos * 2 + a.listas));
}
export const CHAVE_FAVORITAS = 'goparts:pecas-favoritas:v1';
export const FAVORITAS: string[] = ['VKBA 6556'];

/* =========================================================
   O desenho
   ========================================================= */
export type EstadoEspaco = '' | 'carga' | 'esqueleto' | 'vazio' | 'falha' | 'rede' | 'veiculo' | 'veiculo-nao' | 'linha' | 'repetir' | 'sucesso'
  | 'personalizar' | 'arrastar' | 'compacta' | 'atualizar' | 'parcial' | 'permissao' | 'sem-stock';
export type Dados = { prefs: Prefs; garagem: Carro[]; atividade: Atividade[]; favoritas: string[]; carrinho: number; agora: number };
export const dadosIniciais = (): Dados => ({ prefs: structuredClone(PREFS), garagem: structuredClone(GARAGEM), atividade: atividadeInicial(), favoritas: [...FAVORITAS], carrinho: 3, agora: Date.now() });

const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export const saudacao = (h: number) => (h < 6 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite');
/** O que está pendente: tirado das encomendas, das faturas e das listas — cada um leva ao seu sítio. */
export function pendentes(): [string, string, string, string][] {
  const prep = encomendas().filter((e) => e.estado === 'preparacao').length, trans = encomendas().filter((e) => e.estado === 'transporte').length;
  const venc = FATURAS.filter((f) => f.pagamento === 'vencida').length, rasc = LISTAS.filter((l) => l.estado === 'rascunho').length;
  const p: [string, string, string, string][] = [];
  if (prep) p.push(['preparacao', `${prep} ${prep === 1 ? 'encomenda' : 'encomendas'} em preparação`, packageOpen, 'data-filtrar-enc="preparacao"']);
  if (trans) p.push(['transporte', `${trans} em transporte`, truck, 'data-filtrar-enc="transporte"']);
  if (venc) p.push(['vencida', `${venc} ${venc === 1 ? 'fatura vencida' : 'faturas vencidas'}`, receipt, 'data-ir-fatura-vencida']);
  if (rasc) p.push(['lista', `${rasc} ${rasc === 1 ? 'lista por acabar' : 'listas por acabar'}`, list, `data-abrir-lista="${LISTAS.find((l) => l.estado === 'rascunho')!.id}"`]);
  return p;
}
export function olaHtml(d: Dados, _e: EstadoEspaco = ''): string {
  const agora = new Date(d.agora), data = `${DIAS[agora.getDay()]}, ${agora.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}`;
  /* (20 out., V4) a saudação fica compacta: o que está pendente passou ao bloco «Requer a tua atenção» */
  return `<header class="ini4__ola" data-entra="0">
    <div class="ini4__ola-texto"><p class="ini4__ola-data">${data}</p><h1 class="ini4__ola-titulo"><span data-saudacao>${saudacao(agora.getHours())}</span>, Fernando</h1><p class="ini4__ola-sub">Este é o resumo da tua atividade no Peça A Peça.</p></div>
    ${btn('Personalizar Início', settings2, ' data-personalizar aria-haspopup="dialog"', 'ini4__personalizar')}
    <dl class="ini4__contexto">
      <div><dt>Conta</dt><dd>Fernando F. França · Porto</dd></div>
      <div><dt>Armazém de saída</dt><dd>${L(mapPin)}Porto (1)</dd></div>
    </dl>
  </header>`;
}

/* ---------- o veículo identificado (o «uau» da pesquisa) ---------- */
export function veiculoHtml(c: Carro, naGaragem: boolean, origem = 'matrícula'): string {
  const v = versaoDe(c);
  const linhas: [string, string][] = [
    ...(c.matricula ? [['Matrícula', c.matricula] as [string, string]] : []), ['Ano', String(c.ano)], ['Motor', v ? `${v.versao} · ${v.motor}` : '—'],
    ['Potência', v ? `${v.kw} kW · ${v.cv} cv` : '—'], ['Cilindrada', v ? `${v.cc.toLocaleString('pt-PT')} cm³` : '—'],
    ['Combustível', v?.combustivel ?? '—'], ['Carroçaria', carrocariaDe(c)], ['Produção', v?.anos ?? '—'],
  ];
  return `<div class="ini4__veiculo-caixa" data-matricula="${c.matricula}">
    <div class="ini4__veiculo-img">${imagemModelo(c.modelo, carrocariaDe(c))}<p>Imagem ilustrativa da carroçaria. A fotografia do modelo entra quando o fornecedor do catálogo a der.</p></div>
    <div class="ini4__veiculo-texto">
      <p class="ini4__veiculo-sobre">${L(check)}${origem === 'marca e modelo' ? 'Veículo escolhido pela marca e modelo' : origem === 'descrição' ? 'Veículo confirmado por ti, a partir da descrição' : `Veículo identificado pela ${origem}`}</p>
      <h2 class="ini4__veiculo-nome">${esc(marcaNome(c.marca))} ${esc(modeloCurto(c.marca, c.modelo))} <span>${esc(v?.versao ?? '')}</span></h2>
      <dl class="ini4__veiculo-dados">${linhas.map(([k, val], i) => `<div style="--i:${i}"><dt>${k}</dt><dd>${esc(val)}</dd></div>`).join('')}</dl>
      <p class="ini4__veiculo-nota">${L(info)}As peças que aparecem a seguir são as que o catálogo liga a esta versão. Quando houver dúvida, confirme pela referência OE na ficha da peça.</p>
      <div class="ini4__veiculo-accoes">${c.matricula ? acao('Ver peças compatíveis', arrowRight, ` data-pecas-matricula="${c.matricula}"`) : acao('Ver peças compatíveis', arrowRight, ` data-pecas-modelo="${esc(c.marca)}|${esc(c.modelo)}"`)}${!c.matricula ? '' : naGaragem ? `<span class="ini4__na-garagem">${L(check)}Está na garagem</span>` : btn('Guardar na garagem', save, ` data-guardar-matricula="${c.matricula}"`)}${btn('Fechar', x, ' data-fechar-veiculo')}</div>
    </div>
  </div>`;
}
/* (20 out., V6) identificar pela descrição ou pelo motor: os veículos do catálogo que respondem, para confirmar um.
   Procura-se por palavras na marca, no modelo, na versão e no código do motor (sem acentos). */
const pal = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9.]+/).filter(Boolean);
export function procurarVeiculos(texto: string): { marca: string; modelo: string; v: number }[] {
  const q = pal(texto); if (!q.length) return [];
  const r: { marca: string; modelo: string; v: number }[] = [];
  Object.entries(MODELOS).forEach(([marca, ms]) => ms.forEach(([modelo]) => veiculosDe(marca, modelo).forEach((ve, v) => {
    const t = pal(`${marcaNome(marca)} ${marca} ${modelo} ${ve.versao} ${ve.motor} ${ve.combustivel}`);
    if (q.every((p) => t.some((w) => w.startsWith(p)))) r.push({ marca, modelo, v });
  })));
  return r;
}
export function candidatosHtml(texto: string): string {
  const l = procurarVeiculos(texto);
  if (!l.length) return naoEncontradoHtml(texto, 'descrição');
  return `<div class="ini4__veiculo-caixa ini4__candidatos" role="group" aria-labelledby="i4-cand-t">
    <div><h2 class="ini4__veiculo-nome" id="i4-cand-t">${l.length === 1 ? 'Encontrámos 1 veículo' : `Encontrámos ${l.length} veículos`} para «${esc(texto)}»</h2>
    <p>A descrição não chega para ter a certeza: confirma qual é o teu.</p>
    <ul class="ini4__cand-lista" role="list">${l.slice(0, 8).map((c, i) => { const ve = veiculosDe(c.marca, c.modelo)[c.v]; return `<li style="--i:${i}"><button type="button" class="ini4__cand" data-confirmar-veiculo="${esc(c.marca)}|${esc(c.modelo)}|${c.v}">
      <b>${esc(marcaNome(c.marca))} ${esc(modeloCurto(c.marca, c.modelo))} ${esc(ve.versao)}</b><span>${ve.kw} kW / ${ve.cv} cv · ${esc(ve.motor.split(',')[0])} · ${esc(ve.anos)}</span>${L(arrowRight)}</button></li>`; }).join('')}</ul>
    ${l.length > 8 ? `<p class="ini4__cand-mais">E mais ${l.length - 8}. Escreve mais da descrição (por exemplo, o ano ou a potência) para reduzir.</p>` : ''}
    <div class="ini4__veiculo-accoes">${btn('Fechar', x, ' data-fechar-veiculo')}</div></div>
  </div>`;
}
export function naoEncontradoHtml(m: string, por = 'matrícula'): string {
  return `<div class="ini4__veiculo-caixa ini4__veiculo-caixa--nada" role="alert">
    <span class="ini4__nada-icone">${L(carFront)}</span>
    <div><h2 class="ini4__veiculo-nome">Não encontrámos um veículo com ${por === 'matrícula' ? 'a matrícula' : por === 'descrição' ? 'a descrição' : 'o'} ${esc(m)}.</h2>
    <p>Confirme a matrícula. Se estiver certa, pesquise pelo n.º de chassis (VIN) ou escolha o veículo pela marca e modelo.</p>
    <div class="ini4__veiculo-accoes">${btn('Selecionar veículo', IC.list, ' data-ir-modo="1"')}${btn('Fechar', x, ' data-fechar-veiculo')}</div></div>
  </div>`;
}

/* ---------- um bloco ---------- */
const esq = (n: number, cls: string) => Array.from({ length: n }, () => `<li class="${cls} ini4__esq" aria-hidden="true"><i></i><i></i><i></i></li>`).join('');
function bloco(id: IdBloco, corpo: string, d: Dados, accoes = ''): string {
  const [nome, , tam, ic] = BLOCOS[id];
  const escondido = d.prefs.escondidos.includes(id);
  return `<section class="ini4__bloco ini4__bloco--${tam} ini4__bloco--${id}" data-bloco="${id}" aria-labelledby="i4-${id}-t" style="order:${d.prefs.ordem.indexOf(id)}"${escondido ? ' hidden' : ''}>
    <header class="ini4__bloco-cabeca"><h2 id="i4-${id}-t">${L(ic)}${nome}</h2>${accoes ? `<div class="ini4__bloco-accoes">${accoes}</div>` : ''}</header>
    ${corpo}
  </section>`;
}
const falhaBloco = (o: string, tentar: string) => `<div class="ini4__falha" role="alert"><span class="ini4__falha-icone">${L(triangleAlert)}</span><div><b>Não foi possível carregar ${o}.</b><span>O resto do Início continua a funcionar.</span></div>${btn('Tentar novamente', rotateCcw, ` data-tentar="${tentar}"`)}</div>`;
const vazioBloco = (ic: string, texto: string, accoes = '') => `<div class="ini4__vazio">${L(ic)}<p>${texto}</p>${accoes}</div>`;

/* ---------- (20 out., V4) Requer a tua atenção ----------
   Só o que pede uma ação e que os dados confirmam: faturas vencidas, pedidos prontos a levantar, devoluções por enviar
   e devoluções enviadas à espera do crédito. As mais importantes primeiro. «Não tens ações pendentes» só aparece
   quando as fontes responderam (num estado de falha diz-se que não se conseguiu verificar). */
type Alerta = { k: 'erro' | 'aviso' | 'info'; ic: string; titulo: string; ref: string; quando: string; acao: string; attr: string };
export function alertas(): Alerta[] {
  const a: Alerta[] = [];
  FATURAS.filter((f) => f.pagamento === 'vencida').forEach((f) => a.push({ k: 'erro', ic: receipt, titulo: 'Fatura vencida', ref: f.num, quando: `Venceu a ${f.vencimento}`, acao: 'Ver fatura', attr: ` data-ir-doc="faturas" data-chave="goparts:abrir-fatura" data-valor="${f.num}"` }));
  PEDIDOS.forEach((p) => { if (etapa(p).k !== 'recolher') return; const l = LINHAS.find((x) => x.num === p.num); const passo = p.percurso.filter((s) => s[1]).pop();
    a.push({ k: 'aviso', ic: store, titulo: `Pronto a levantar${l ? ` no balcão · ${l.armazem}` : ''}`, ref: p.num, quando: passo?.[1] ? `Desde ${passo[1]}` : 'Pronto', acao: 'Ver pedido', attr: ` data-ir-doc="pedidos" data-chave="goparts:abrir-pedido" data-valor="${p.num}"` }); });
  DEVOLUCOES.filter((d) => estadoDev(d) === 'rascunho').forEach((d) => a.push({ k: 'aviso', ic: rotateCcw, titulo: 'Devolução por enviar', ref: d.num, quando: 'Ainda não foi enviada', acao: 'Abrir devoluções', attr: ' data-ir-filtro="devolucoes" data-etapa-alvo="rascunho"' }));
  DEVOLUCOES.filter((d) => estadoDev(d) === 'enviada').forEach((d) => a.push({ k: 'info', ic: clock, titulo: 'Devolução à espera do crédito', ref: d.num, quando: d.enviada ? `Enviada a ${d.enviada}` : 'Enviada', acao: 'Abrir devoluções', attr: ' data-ir-filtro="devolucoes" data-etapa-alvo="enviada"' }));
  return a;
}
export function atencaoHtml(d: Dados, e: EstadoEspaco = ''): string {
  const lista = e === 'vazio' ? [] : alertas();
  const corpo = e === 'carga' || e === 'esqueleto' ? `<ul class="ini4__alertas">${esq(3, 'ini4__alerta-li')}</ul>`
    : e === 'falha' || e === 'parcial' ? `<div class="ini4__falha" role="alert"><span class="ini4__falha-icone">${L(triangleAlert)}</span><div><b>Não foi possível verificar se há ações pendentes.</b><span>As faturas e as devoluções não responderam. O resto do Início continua a funcionar.</span></div>${btn('Tentar novamente', rotateCcw, ' data-tentar="atencao"')}</div>`
    : !lista.length ? `<p class="ini4__alertas-nada">${L(check)}Não tens ações pendentes.</p>`
    : `<ul class="ini4__alertas">${lista.slice(0, 4).map((x, i) => `<li class="ini4__alerta-li" style="--i:${i}"><div class="ini4__alerta ini4__alerta--${x.k}">
        <span class="ini4__alerta-icone">${L(x.ic)}</span>
        <span class="ini4__alerta-texto"><b>${esc(x.titulo)}</b><span><span class="ini4__alerta-ref">${esc(x.ref)}</span> · ${esc(x.quando)}</span></span>
        <button type="button" class="btn ini4__btn ini4__alerta-acao"${x.attr}>${L(arrowRight, 'btn__icone')}<span class="btn__rotulo">${x.acao}</span></button>
      </div></li>`).join('')}</ul>${lista.length > 4 ? `<p class="ini4__alertas-mais">E mais ${lista.length - 4} — veja-os em Mensagens e avisos.</p>` : ''}`;
  return bloco('atencao', corpo, d, lista.length && e !== 'falha' && e !== 'parcial' ? `<span class="ini4__conta-alertas">${lista.length}</span>` : '');
}

/* ---------- (20 out., V4) Resumo da atividade ----------
   Os números contam-se dos documentos, pelos mesmos estados que os Pedidos e as Devoluções mostram nas pílulas;
   cada um abre esse ecrã já filtrado. Um zero não leva a lado nenhum. */
export function resumo(): { k: string; nome: string; ic: string; n: number; attr: string }[] {
  const conta = (k: string) => PEDIDOS.filter((p) => etapa(p).k === k).length;
  return [
    { k: 'preparacao', nome: 'Pedidos em preparação', ic: clock, n: conta('preparacao') + conta('preparado'), attr: ` data-ir-filtro="pedidos" data-etapa-alvo="${conta('preparacao') ? 'preparacao' : 'preparado'}"` },
    { k: 'expedido', nome: 'Em transporte', ic: truck, n: conta('expedido'), attr: ' data-ir-filtro="pedidos" data-etapa-alvo="expedido"' },
    { k: 'recolher', nome: 'Prontos para recolha', ic: store, n: conta('recolher'), attr: ' data-ir-filtro="pedidos" data-etapa-alvo="recolher"' },
    { k: 'devolucoes', nome: 'Devoluções por enviar', ic: rotateCcw, n: DEVOLUCOES.filter((x) => estadoDev(x) === 'rascunho').length, attr: ' data-ir-filtro="devolucoes" data-etapa-alvo="rascunho"' },
    { k: 'listas', nome: 'Listas guardadas', ic: list, n: LISTAS.length, attr: ' data-ir-doc="lista" data-chave="goparts:lista-vista" data-valor="listas"' },
  ];
}
export function resumoHtml(d: Dados, e: EstadoEspaco = ''): string {
  const carga = e === 'carga' || e === 'esqueleto';
  const corpo = e === 'falha' ? falhaBloco('o resumo', 'resumo')
    : `<ul class="ini4__resumo">${resumo().map((r, i) => { const n = e === 'vazio' ? 0 : r.n;
      return `<li style="--i:${i}"><button type="button" class="ini4__metrica ini4__metrica--${r.k}"${carga || !n ? ' disabled' : r.attr}${n ? ` aria-label="${r.nome}: ${n}. Abrir a lista filtrada"` : ''}>
        <span class="ini4__metrica-icone">${L(r.ic)}</span><b data-conta="${n}">${carga ? '–' : n}</b><span>${r.nome}</span>${n && !carga ? L(chevronRight, 'ini4__metrica-seta') : ''}</button></li>`; }).join('')}</ul>`;
  return bloco('resumo', corpo, d);
}

/* ---------- Atalhos ---------- */
export function atalhosHtml(d: Dados, e: EstadoEspaco = ''): string {
  return bloco('atalhos', `<ul class="ini4__atalhos">${d.prefs.atalhos.map((a) => `<li><button type="button" class="ini4__atalho" data-atalho="${a}">${L(ATALHOS[a][1])}<span>${ATALHOS[a][0]}</span>${a === 'carrinho' && e !== 'vazio' ? `<b class="ini4__atalho-num" data-carrinho-num>${d.carrinho}</b>` : ''}</button></li>`).join('')}</ul>`, d,
    btn('Escolher atalhos', pencil, ' data-personalizar="atalhos" aria-haspopup="dialog"', 'ini4__btn--leve'));
}

/* ---------- As minhas encomendas ---------- */
export function encomendasHtml(d: Dados, e: EstadoEspaco = '', aberta = ''): string {
  const todas = encomendas();
  const n = (k: EstadoEnc) => todas.filter((x) => x.estado === k).length;
  const kpis = `<div class="ini4__kpis" role="group" aria-label="Filtrar por estado">${ESTADOS_ENC.map(([k, t, ic]) => `<button type="button" class="ini4__kpi ini4__kpi--${k}" data-kpi="${k}" aria-pressed="false"${e === 'carga' || e === 'esqueleto' ? ' disabled' : ''}>${L(ic)}<b data-conta="${n(k)}">${e === 'carga' || e === 'esqueleto' ? '–' : n(k)}</b><span>${t}</span></button>`).join('')}<i class="ini4__kpi-marca" aria-hidden="true"></i></div>`;
  /* (20 out., V4) os contadores passaram ao «Resumo da atividade»; aqui ficam os últimos pedidos (os contadores só
     voltam a aparecer filtrados quando se vem de um número do resumo) */
  void kpis;
  const corpo = e === 'carga' || e === 'esqueleto' ? `<ul class="ini4__encs">${esq(4, 'ini4__enc-li')}</ul>`
    : e === 'vazio' ? vazioBloco(packageIcon, 'Ainda não fez encomendas. Quando fizer, acompanha aqui cada uma, do pedido à entrega.', btn('Ir ao catálogo', layoutGrid, ' data-ir="catalogo"'))
    : e === 'falha' ? falhaBloco('os pedidos', 'encomendas')
    : `<ul class="ini4__encs">${todas.map((x, i) => encomendaHtml(x, x.linha.num === aberta, i >= 4)).join('')}</ul><p class="ini4__filtro-nada" hidden>Nenhuma encomenda neste estado.</p>`;
  const atualizar = e === 'atualizar' ? `<span class="ini4__a-atualizar" role="status">${rolamentoSvg(`i4-at-${++uid}`, 'pesquisar', 'ini4__rs')}A atualizar…</span>` : `<span class="ini4__atualizado" role="status">Atualizado às ${new Date(d.agora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>`;
  return bloco('encomendas', corpo, d, e === 'vazio' ? '' : `${atualizar}${btn('Atualizar', refreshCcw, ' data-atualizar-enc' + (e === 'atualizar' ? ' disabled' : ''), 'ini4__btn--leve')}<button type="button" class="ini4__mais" data-ir="pedidos">Ver todos os pedidos${L(chevronRight)}</button>`);
}
/** As quatro mais recentes à vista; as outras só aparecem quando um contador as filtra. */
export function encomendaHtml(x: Encomenda, aberta = false, extra = false): string {
  const id = `i4-enc-${x.linha.num.replace(/\W/g, '')}`;
  const metodo = x.linha.recolher ? `Levantar no balcão · ${x.linha.armazem}` : `Entrega · ${x.linha.morada[1]}`;
  return `<li class="ini4__enc-li" data-enc="${x.linha.num}" data-estado-enc="${x.estado}"${extra ? ' data-extra hidden' : ''}>
    <button type="button" class="ini4__enc" aria-expanded="${aberta}" aria-controls="${id}">
      <span class="ini4__enc-ponto ini4__enc-ponto--${x.estado}" aria-hidden="true"></span>
      <span class="ini4__enc-texto"><b>${x.linha.num}</b><span>${x.linha.data} · ${x.artigos} ${x.artigos === 1 ? 'artigo' : 'artigos'}</span><span class="ini4__enc-entrega">${L(x.linha.recolher ? store : truck)}${esc(metodo)}</span></span>
      <span class="ini4__enc-estado">${ESTADO_UM[x.estado]}</span>
      <span class="ini4__enc-valor">${euros(x.valor)}</span>
      ${L(chevronDown, 'ini4__enc-seta')}
    </button>
    <div class="ini4__enc-detalhe" id="${id}"${aberta ? '' : ' hidden'}>
      <ol class="ini4__percurso" aria-label="Percurso da encomenda">${x.pedido.percurso.map(([nome, quando, nota], i) => `<li class="${i < x.atual ? 'is-feito' : i === x.atual ? 'is-atual' : 'is-por'}" style="--i:${i}"${i === x.atual ? ' aria-current="step"' : ''}><span class="ini4__percurso-ponto" aria-hidden="true">${i <= x.atual ? L(check) : ''}</span><b>${PASSO[nome] ?? nome}</b><time>${quando || 'Ainda não'}</time>${nota ? `<small>${esc(nota)}</small>` : ''}</li>`).join('')}</ol>
      <dl class="ini4__enc-dados"><div><dt>Entrega</dt><dd>${esc(metodo)}</dd></div><div><dt>Valor</dt><dd>${euros(x.valor)} <small>sem IVA</small></dd></div>${x.linha.obs ? `<div><dt>Observações</dt><dd>${esc(x.linha.obs)}</dd></div>` : ''}</dl>
      <div class="ini4__enc-accoes">${btn('Ver detalhes', fileText, ` data-ver-pedido="${x.linha.num}"`)}${acao('Repetir encomenda', repeat, ` data-repetir-enc="${x.linha.num}" aria-haspopup="dialog"`)}</div>
    </div>
  </li>`;
}

/* ---------- Continuar onde fiquei ---------- */
const ACAO_ATIV: Record<Atividade['tipo'] | 'lista' | 'carrinho', [string, string]> = {
  veiculo: ['Continuar pesquisa', carFront], ref: ['Abrir referência', hash], categoria: ['Abrir categoria', layoutGrid], lista: ['Continuar lista', list], carrinho: ['Ver carrinho', cart],
};
export function continuarHtml(d: Dados, e: EstadoEspaco = ''): string {
  type Item = { tipo: keyof typeof ACAO_ATIV; titulo: string; sub: string; quando: string; dados: string };
  const itens: Item[] = e === 'vazio' ? [] : [
    ...d.atividade.slice().sort((a, b) => b.quando - a.quando).slice(0, 3).map((a) => ({ tipo: a.tipo, titulo: a.titulo, sub: a.sub, quando: quandoTexto(a.quando, d.agora), dados: Object.entries(a.dados).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('') })),
    ...LISTAS.filter((l) => l.estado === 'rascunho').slice(0, 1).map((l) => ({ tipo: 'lista' as const, titulo: l.nome, sub: `Lista por acabar · ${l.pecas.length} peças`, quando: l.atualizada.replace(/^hoje às /, 'Hoje, '), dados: ` data-lista="${l.id}"` })),
    ...(d.carrinho ? [{ tipo: 'carrinho' as const, titulo: 'Encomenda por concluir', sub: `${d.carrinho} ${d.carrinho === 1 ? 'unidade' : 'unidades'} no carrinho`, quando: 'Agora', dados: '' }] : []),
  ];
  const corpo = e === 'carga' || e === 'esqueleto' ? `<ul class="ini4__cont">${esq(4, 'ini4__cont-li')}</ul>`
    : !itens.length ? vazioBloco(history, 'Ainda não há nada para continuar. As pesquisas, as referências que abrir e as listas por acabar aparecem aqui.', btn('Pesquisar referência', hash, ' data-atalho="referencia"'))
    : `<ul class="ini4__cont">${itens.map((it, i) => `<li class="ini4__cont-li" style="--i:${i}"><button type="button" class="ini4__cont-item" data-continuar="${it.tipo}"${it.dados}>
        <span class="ini4__cont-icone">${L(ACAO_ATIV[it.tipo][1])}</span>
        <span class="ini4__cont-texto"><b>${esc(it.titulo)}</b><span>${esc(it.sub)}</span></span>
        <time class="ini4__cont-quando">${it.quando}</time>
        <span class="ini4__cont-acao">${ACAO_ATIV[it.tipo][0]}${L(arrowRight)}</span>
      </button></li>`).join('')}<i class="ini4__cont-marca" aria-hidden="true"></i></ul>`;
  return bloco('continuar', corpo, d);
}

/* ---------- A minha garagem ---------- */
export function carroHtml(c: Carro, escolhido = false): string {
  const v = versaoDe(c), nome = c.nome || `${marcaNome(c.marca)} ${modeloCurto(c.marca, c.modelo)}`;
  return `<li class="ini4__carro${escolhido ? ' is-escolhido' : ''}" data-carro="${c.id}" data-matricula="${c.matricula}">
    <div class="ini4__carro-topo">
      <button type="button" class="ini4__estrela" data-favorito aria-pressed="${!!c.favorito}">${L(star)}<span>${c.favorito ? 'Favorito' : 'Marcar'}</span></button>
      <div class="ini4__menu-sitio"><button type="button" class="ini4__carro-mais" data-menu-carro aria-haspopup="menu" aria-expanded="false">${L(ellipsis)}<span>Mais</span></button>
        <ul class="ini4__menu" role="menu" hidden><li role="none"><button type="button" role="menuitem" data-renomear>${L(pencil)}Mudar o nome</button></li><li role="none"><button type="button" role="menuitem" data-remover-carro>${L(trash)}Tirar da garagem</button></li></ul></div>
    </div>
    <div class="ini4__carro-img">${imagemModelo(c.modelo, carrocariaDe(c))}</div>
    <span class="ini4__matricula">${c.matricula}</span>
    <b class="ini4__carro-nome" data-nome>${esc(nome)}</b>
    <span class="ini4__carro-versao">${esc(c.nome ? `${marcaNome(c.marca)} ${modeloCurto(c.marca, c.modelo)} ` : '')}${esc(v?.versao ?? '')} · ${c.ano}${v ? ` · ${esc(v.motor.split(',')[0])}` : ''}</span>
    <p class="ini4__carro-ultima">${L(history)}${c.ultima ? `Última pesquisa: ${esc(c.ultima)}${c.quando ? ` · ${esc(c.quando)}` : ''}` : 'Ainda sem pesquisas'}</p>
    <div class="ini4__carro-pe">${acao('Peças compatíveis', arrowRight, ` data-pecas-matricula="${c.matricula}"`)}${btn('Usar na pesquisa', search, ` data-usar-matricula="${c.matricula}"`)}</div>
  </li>`;
}
export function garagemHtml(d: Dados, e: EstadoEspaco = '', escolhida = ''): string {
  const carros = e === 'vazio' ? [] : d.garagem.slice().sort((a, b) => Number(!!b.favorito) - Number(!!a.favorito));
  const novo = `<li class="ini4__carro ini4__carro--novo"><form class="ini4__novo" data-garagem-nova novalidate>
      <span class="ini4__novo-icone">${L(plus)}</span><label for="i4-nova-mat">Adicionar veículo</label>
      <p class="ini4__novo-ajuda" id="i4-nova-ajuda">Escreva a matrícula: identificamos a versão.</p>
      <div class="ini4__novo-linha"><input id="i4-nova-mat" placeholder="AA-00-AA" autocomplete="off" spellcheck="false" aria-describedby="i4-nova-ajuda i4-nova-erro" maxlength="10"><button type="submit" class="btn ini4__btn">${L(plus, 'btn__icone')}<span class="btn__rotulo">Adicionar</span></button></div>
      <p class="ini4__novo-erro" id="i4-nova-erro" role="alert"></p></form></li>`;
  const corpo = e === 'carga' || e === 'esqueleto' ? `<ul class="ini4__garagem">${esq(3, 'ini4__carro')}</ul>`
    : `${carros.length ? '' : `<p class="ini4__garagem-vazia">${L(carFront)}Guarda os veículos que consultas mais vezes.</p>`}<ul class="ini4__garagem" aria-label="Veículos guardados">${carros.map((c) => carroHtml(c, c.matricula === escolhida)).join('')}${novo}</ul>`;
  return bloco('garagem', corpo, d, carros.length ? `<span class="ini4__contagem">${carros.length} ${carros.length === 1 ? 'veículo' : 'veículos'}</span>` : '');
}

/* ---------- Categorias ---------- */
const CATS = ['Travagem', 'Suspensão', 'Óleo motor', 'Bateria', 'Filtros', 'Iluminação', 'Correias', 'Embraiagem', 'Direção', 'Ar condicionado'];
export function categoriasHtml(d: Dados, e: EstadoEspaco = ''): string {
  return bloco('categorias', `<ul class="ini4__categorias">${e === 'carga' || e === 'esqueleto' ? esq(10, 'ini3__categoria') : CATS.map((n) => `<li><button type="button" class="ini3__categoria ini4__categoria" data-categoria="${n}">${CAT_SVG[n]}<span>${n}</span>${L(arrowUpRight, 'ini4__cat-seta')}</button></li>`).join('')}</ul>`, d,
    `<a href="#" class="ini4__mais" data-ir="catalogo">Todas as categorias${L(chevronRight)}</a>`);
}

/* ---------- Peças que compras frequentemente ---------- */
export function pecaHtml(f: Frequente, favorita: boolean, o: { semPreco?: boolean } = {}): string {
  const [, fab, ref, desc, pvp, , porto, sacavem] = f.r;
  const vezes = [f.pedidos ? `${f.pedidos === 1 ? 'Pedida 1 vez' : `Pedida ${f.pedidos} vezes`}` : '', f.listas ? `em ${f.listas} ${f.listas === 1 ? 'lista' : 'listas'}` : ''].filter(Boolean).join(' · ') || 'Favorita';
  return `<li class="ini4__peca" data-ref="${ref}" data-fab="${fab}" data-favorita="${favorita}">
    ${azulejoPeca(desc, 'ini4__peca-img', ref)}
    <div class="ini4__peca-texto"><span class="ini4__peca-fab">${fab}</span><b>${ref}</b><span class="ini4__peca-desc">${esc(desc)}</span>
      <span class="ini4__peca-vezes">${vezes}<button type="button" class="ini4__estrela ini4__estrela--peca" data-favorita-peca aria-pressed="${favorita}">${L(star)}<span>${favorita ? 'Favorita' : 'Marcar'}</span></button></span></div>
    <div class="ini4__peca-preco">${o.semPreco ? `<span class="ini4__sem-preco">${L(shieldAlert)}Sem acesso</span>` : `<b>${euros(liquido(f.r))}</b><small>PVP ${euros(pvp)}</small>`}</div>
    <span class="ini4__stock${porto ? ' is-hoje' : sacavem ? ' is-amanha' : ' is-encomenda'}">${saida(porto, sacavem)}</span>
    <div class="ini4__peca-accoes">${btn('Stock', warehouse, ` data-ver-stock="${ref}"`, 'ini4__btn--leve')}${o.semPreco ? '' : acao('Adicionar', cart, ` data-pedir="${ref}"`, 'ini4__pedir')}</div>
  </li>`;
}
export function frequentesHtml(d: Dados, e: EstadoEspaco = ''): string {
  const fs = frequentes(), favs = d.favoritas.filter((r) => !fs.some((f) => f.r[2] === r)).map((r) => ({ r: REFERENCIAS.find((q) => q[2] === r)!, pedidos: 0, listas: 0 })).filter((f) => f.r);
  const todas = [...fs, ...favs];
  const separadores = `<div class="ini4__seg" role="tablist" aria-label="Que peças"><button type="button" role="tab" class="ini4__seg-btn" aria-selected="true" data-pecas-filtro="frequentes">Frequentes</button><button type="button" role="tab" class="ini4__seg-btn" aria-selected="false" data-pecas-filtro="favoritas">Favoritas <b data-n-favoritas>${d.favoritas.length}</b></button><i class="ini4__seg-marca" aria-hidden="true"></i></div>`;
  const corpo = e === 'carga' || e === 'esqueleto' ? `<ul class="ini4__pecas">${esq(4, 'ini4__peca')}</ul>`
    : e === 'parcial' ? falhaBloco('as peças frequentes', 'frequentes')
    : e === 'vazio' ? vazioBloco(repeat, 'Quando encomendar, as peças que pede mais vezes aparecem aqui, com o preço e o stock de hoje.')
    : `${e === 'permissao' ? `<p class="ini4__permissao" role="note">${L(shieldAlert)}<span><b>A sua conta não tem acesso aos preços.</b> Peça ao administrador da conta da oficina para lhe dar a permissão «Ver preços».</span></p>` : ''}<ul class="ini4__pecas">${todas.slice(0, 5).map((f) => pecaHtml(f, d.favoritas.includes(f.r[2]), { semPreco: e === 'permissao' })).join('')}</ul><p class="ini4__filtro-nada" hidden>Ainda não marcou nenhuma peça como favorita. Marque com a estrela as que pede mais vezes.</p>`;
  return bloco('frequentes', corpo, d, e === 'vazio' || e === 'parcial' ? '' : separadores);
}

/* ---------- Disponibilidade por armazém ---------- */
export function disponibilidadeHtml(d: Dados, e: EstadoEspaco = '', ref = ''): string {
  const r = REFERENCIAS.find((q) => q[2] === (ref || (e === 'sem-stock' ? '538 0001 10' : frequentes()[0]?.r[2] ?? 'VKBA 6556')))!;
  const sel = `<label class="ini4__disp-escolha"><span>Referência</span><select data-disp-ref>${REFERENCIAS.map((q) => `<option value="${q[2]}"${q === r ? ' selected' : ''}>${q[1]} ${q[2]} · ${q[0]}</option>`).join('')}</select></label>`;
  const corpo = e === 'carga' || e === 'esqueleto' ? `<ul class="ini4__armazens">${esq(2, 'ini4__armazem')}</ul>`
    : e === 'parcial' ? falhaBloco('o stock dos armazéns', 'disponibilidade')
    : `${sel}<div class="ini4__disp" data-disp>${dispCorpo(r, d.agora, e === 'permissao')}</div>`;
  return bloco('disponibilidade', corpo, d);
}
export function dispCorpo(r: Referencia, agora: number, semPreco = false): string {
  const [, fab, ref, desc, , , porto, sacavem] = r;
  const max = Math.max(porto, sacavem, 1);
  const arm: [string, number, string, string][] = [['Porto (1)', porto, 'Sai hoje', 'é o seu armazém de saída'], ['Sacavém (2)', sacavem, 'Sai amanhã', 'chega um dia depois do Porto']];
  return `<div class="ini4__disp-peca">${azulejoPeca(desc, 'ini4__peca-img', ref)}<div><span class="ini4__peca-fab">${fab}</span> <b>${ref}</b><span class="ini4__peca-desc">${esc(desc)}</span></div>${semPreco ? '' : `<b class="ini4__disp-preco">${euros(liquido(r))}</b>`}</div>
    <ul class="ini4__armazens">${arm.map(([nome, q, sai, nota]) => `<li class="ini4__armazem${q ? '' : ' is-zero'}">
      <span class="ini4__armazem-nome">${L(warehouse)}<b>${nome}</b><small>${nota}</small></span>
      <span class="ini4__armazem-qtd"><b data-qtd="${q}">${q}</b> ${q === 1 ? 'unidade' : 'unidades'}</span>
      <span class="ini4__armazem-barra" aria-hidden="true"><i style="--p:${(q / max).toFixed(3)}"></i></span>
      <span class="ini4__armazem-sai">${q ? `${L(clock)}${sai}` : 'Sem stock'}</span>
      <span class="ini4__armazem-recolha">${q ? `${L(store)}Pode levantar no balcão` : 'Não dá para levantar'}</span>
    </li>`).join('')}</ul>
    ${porto + sacavem ? '' : `<p class="ini4__disp-sem" role="status">${L(triangleAlert)}<span><b>Sem stock nos dois armazéns.</b> Por encomenda ao fornecedor: 3 a 5 dias úteis.</span></p>`}
    <p class="ini4__disp-pe"><span>${L(info)}A hora limite para sair hoje vem do servidor; ainda não é enviada.</span><span class="ini4__disp-hora">Atualizado às <time data-disp-hora>${new Date(agora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</time></span>${btn('Atualizar', refreshCcw, ' data-disp-atualizar', 'ini4__btn--leve')}</p>`;
}

/* =========================================================
   Personalizar Início (gaveta) e Repetir encomenda (diálogo)
   ========================================================= */
export function personalizarHtml(p: Prefs, o: { aberta?: boolean; arrastar?: IdBloco } = {}): string {
  /* o nome do grupo leva um número: no mapa do protótipo há várias gavetas na mesma página */
  const n = ++uid;
  const seg = (nome: string, valor: string, opcoes: [string, string][]) => `<div class="ini4__escolha" role="radiogroup" aria-label="${nome === 'modo' ? 'Pesquisa ao abrir' : 'Densidade'}">${opcoes.map(([v, t]) => `<label class="ini4__escolha-op"><input type="radio" name="i4-${nome}-${n}" data-escolha="${nome}" value="${v}"${v === valor ? ' checked' : ''}><span>${t}</span></label>`).join('')}</div>`;
  return `<div class="ini4__gaveta" data-por-cima role="dialog" aria-modal="true" aria-labelledby="i4-pers-t"${o.aberta ? '' : ' hidden'}>
    <div class="ini4__veu" data-fechar-gaveta></div>
    <div class="ini4__gaveta-caixa">
      <header class="ini4__gaveta-cabeca"><h2 id="i4-pers-t">${L(settings2)}Personalizar Início</h2>${btn('Fechar', x, ' data-fechar-gaveta')}</header>
      <div class="ini4__gaveta-corpo">
        <section aria-labelledby="i4-pers-blocos"><h3 id="i4-pers-blocos">Blocos</h3><p class="ini4__gaveta-ajuda">Arraste pela pega para mudar a ordem (ou use a pega com ↑ ↓). Desligue os que não usa.</p>
          <ol class="ini4__ordem" data-ordem>${p.ordem.map((id) => `${o.arrastar === id ? '<li class="ini4__ordem-lugar" aria-hidden="true" style="height:52px"></li>' : ''}<li class="ini4__ordem-li${o.arrastar === id ? ' is-a-arrastar is-demo' : ''}" data-bloco-ordem="${id}">
            <button type="button" class="ini4__pega" data-pega aria-label="Mover ${BLOCOS[id][0]}" aria-describedby="i4-pers-blocos">${L(gripVertical)}</button>
            <span class="ini4__ordem-texto">${L(BLOCOS[id][3])}<b>${BLOCOS[id][0]}</b><small>${BLOCOS[id][1]}</small></span>
            <label class="ini4__interruptor"><input type="checkbox" data-mostrar-bloco="${id}"${p.escondidos.includes(id) ? '' : ' checked'}><span class="sr-only">Mostrar ${BLOCOS[id][0]}</span><i aria-hidden="true"></i></label>
          </li>`).join('')}</ol><p class="sr-only" role="status" aria-live="polite" data-ordem-aviso></p></section>
        <section><h3>Densidade</h3>${seg('densidade', p.densidade, [['confortavel', 'Confortável'], ['compacta', 'Compacta']])}</section>
        <section><h3>Pesquisa ao abrir</h3>${seg('modo', String(p.modo), [['-1', 'A última usada'], ['0', 'Identificar'], ['1', 'Selecionar'], ['2', 'Referência']])}</section>
        <section id="i4-pers-atalhos" aria-labelledby="i4-pers-atalhos-t"><h3 id="i4-pers-atalhos-t">Atalhos</h3><p class="ini4__gaveta-ajuda">Até 6. Os que ficam desligados continuam no menu.</p>
          <ul class="ini4__atalhos-escolha">${(Object.keys(ATALHOS) as IdAtalho[]).map((a) => `<li><label class="ini4__marcar"><input type="checkbox" data-atalho-escolha="${a}"${p.atalhos.includes(a) ? ' checked' : ''}>${L(ATALHOS[a][1])}<span>${ATALHOS[a][0]}</span></label></li>`).join('')}</ul></section>
      </div>
      <footer class="ini4__gaveta-pe">${btn('Repor o Início de origem', rotateCcw, ' data-repor-inicio')}${acao('Concluído', check, ' data-fechar-gaveta')}</footer>
    </div>
  </div>`;
}
export function repetirHtml(num: string, aberto = false): string {
  const p = PEDIDOS.find((q) => q.num === num);
  if (!p) return '';
  const linhas = repetirDe(p), ok = linhas.filter((l) => l.r), unidades = ok.reduce((s, l) => s + l.qtd, 0);
  const total = ok.reduce((s, l) => s + liquido(l.r!) * l.qtd, 0);
  return `<div class="ini4__dialogo" data-por-cima role="dialog" aria-modal="true" aria-labelledby="i4-rep-t" aria-describedby="i4-rep-d" data-repetir-dialogo="${num}"${aberto ? '' : ' hidden'}>
    <div class="ini4__veu" data-fechar-dialogo></div>
    <div class="ini4__dialogo-caixa">
      <header class="ini4__dialogo-cabeca"><h2 id="i4-rep-t">${L(repeat)}Repetir a encomenda ${num}</h2>${btn('Fechar', x, ' data-fechar-dialogo')}</header>
      <p id="i4-rep-d" class="ini4__dialogo-texto">Cada artigo foi procurado no catálogo de hoje, com o preço e o stock atuais. ${ok.length ? `Entram no carrinho os ${ok.length === 1 ? 'que estão' : `${ok.length} que estão`} no catálogo.` : 'Nenhum está no catálogo atual.'}</p>
      <ul class="ini4__rep">${linhas.map((l, i) => { const agora = l.r ? liquido(l.r) : 0, dif = l.r ? Math.round((agora - l.antes) * 100) / 100 : 0;
        return `<li class="ini4__rep-li${l.r ? '' : ' is-fora'}" style="--i:${i}"><span class="ini4__rep-qtd">${l.qtd}×</span><span class="ini4__rep-nome">${esc(l.artigo)}</span>${l.r
          ? `<span class="ini4__rep-preco">${euros(agora)} <small>${dif === 0 ? 'o mesmo preço' : dif > 0 ? `mais ${euros(dif)}` : `menos ${euros(-dif)}`}</small></span><span class="ini4__stock${l.r[6] ? ' is-hoje' : l.r[7] ? ' is-amanha' : ' is-encomenda'}">${saida(l.r[6], l.r[7])}</span>`
          : '<span class="ini4__rep-fora">Não está no catálogo atual — não entra</span>'}</li>`; }).join('')}</ul>
      <footer class="ini4__dialogo-pe"><p>${ok.length ? `<b>${unidades} ${unidades === 1 ? 'unidade' : 'unidades'}</b> · ${euros(total)} sem IVA` : 'Nada para pôr no carrinho.'}</p>${btn('Cancelar', x, ' data-fechar-dialogo')}${ok.length ? acao(`Pôr ${unidades} no carrinho`, cart, ` data-confirmar-repetir="${num}"`) : btn('Ver detalhes', fileText, ` data-ver-pedido="${num}"`)}</footer>
    </div>
  </div>`;
}

/** (20 out., V5) Os blocos do ecrã «Pesquisar peças»: só os que ajudam a pesquisar, pela ordem de origem (o painel
    da atividade — atenção, resumo, pedidos, atalhos — passou ao Início, painel.ts). */
/* (21 out.) a garagem saiu da Pesquisar peças (ela: «isto desaparece do ecrã de pesquisar peças»): tem o seu ecrã */
export const ORDEM_PESQUISA: IdBloco[] = ['continuar', 'frequentes', 'disponibilidade', 'categorias'];
export function blocosPesquisa(d: Dados, e: EstadoEspaco = ''): string {
  const dd: Dados = { ...d, prefs: { ...d.prefs, ordem: [...ORDEM_PESQUISA, ...ORDEM.filter((b) => !ORDEM_PESQUISA.includes(b))], escondidos: [] } };
  return `<div class="ini4__blocos" data-blocos data-densidade="${d.prefs.densidade}">
    ${continuarHtml(dd, e)}${frequentesHtml(dd, e)}${disponibilidadeHtml(dd, e)}${categoriasHtml(dd, e)}
  </div>`;
}
/** Os blocos todos, pela ordem das preferências (o CSS põe-nos no sítio com `order`). */
export function blocosHtml(d: Dados, e: EstadoEspaco = ''): string {
  return `<div class="ini4__blocos" data-blocos data-densidade="${d.prefs.densidade}">
    ${atencaoHtml(d, e)}${resumoHtml(d, e)}${atalhosHtml(d, e)}${encomendasHtml(d, e, e === 'linha' ? 'P2024/001233' : '')}${continuarHtml(d, e)}${garagemHtml(d, e, e === 'veiculo' ? 'AA-12-BC' : '')}${categoriasHtml(d, e)}${frequentesHtml(d, e)}${disponibilidadeHtml(d, e)}
  </div>`;
}
