/* =========================================================
   GOPARTS — 17 · Informações técnicas (15 out. 2026)
   Do briefing dela («Automotive Technical Intelligence Center») e da nota que juntou: «começaria por três
   mudanças: seleção do veículo mais clara, navegação técnica agrupada e visualização de documentação com zoom.
   Depois, acrescentaria o explorador visual do automóvel». O ecrã gira à volta do veículo escolhido:
   - ESCOLHER: os veículos do Catálogo por modelo, com as quatro colunas do ecrã antigo (Modelo, Código do motor,
     Fabricado desde, Fabricado até; ela, 15 out.: «tem isto tudo, faz»), a pesquisa por marca, modelo ou motor;
     ao lado, o que fica disponível depois de escolher (em vez do branco do ecrã antigo).
   - A BARRA DO VEÍCULO (sempre à vista): Marca → Modelo → Motorização → Código do motor, o combustível, a potência,
     os anos; a pesquisa técnica; «Mudar de veículo». Ao escolher, o nome voa da linha para a barra.
   - A NAVEGAÇÃO AGRUPADA: as 15 abas do ecrã antigo (o mesmo sentido) em Veículo, Manutenção, Reparação,
     Diagnóstico e Recursos, com a risca laranja na secção aberta; e a Visão geral por cima.
   - O EXPLORADOR: a silhueta da carroçaria com zonas gerais (dianteira, eixos, habitáculo, piso); escolher um
     sistema acende a zona e lista os documentos dele. As zonas não dizem onde está cada peça (isso é a «Posição
     de peças») e o sistema elétrico é o veículo todo.
   - OS DOCUMENTOS: a lista da secção, o leitor em três colunas (os documentos da secção, o documento, os
     relacionados do mesmo sistema) e o visor das figuras com zoom e arrastar, a abrir a partir da miniatura.
   O conteúdo dos documentos é do WorkshopData e o protótipo não o reproduz: nenhum valor, procedimento, código
   de avaria ou esquema inventado (tecnica-dados.ts). Trata o cliente por «você», como o resto do portal.
   Feito em TypeScript e CSS, sem React. Comportamento: comportamento/tecnica.ts. CSS: css/tecnica.css.
   ========================================================= */
import { L } from './devolucoes';
import { formaDe, silhueta } from './carros';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import { veiculosDe } from './catalogo-dados';
import {
  SECCOES, GRUPOS, SISTEMAS, MARCAS, seccaoDe, grupoDe, sistemaDe, veiculoDe, veiculosDaMarca, procurarVeiculos, docsDe, docsDaSeccao,
  docsDoSistema, procurarTec, EXEMPLO, type IdSeccao, type IdSistema, type Doc, type VeiculoTec, type TipoDoc,
} from './tecnica-dados';
import carFront from 'lucide-static/icons/car-front.svg?raw';
import clipboardList from 'lucide-static/icons/clipboard-list.svg?raw';
import droplet from 'lucide-static/icons/droplet.svg?raw';
import ruler from 'lucide-static/icons/ruler.svg?raw';
import timer from 'lucide-static/icons/timer.svg?raw';
import bookOpen from 'lucide-static/icons/book-open.svg?raw';
import megaphone from 'lucide-static/icons/megaphone.svg?raw';
import stickyNote from 'lucide-static/icons/sticky-note.svg?raw';
import circleDot from 'lucide-static/icons/circle-dot.svg?raw';
import activity from 'lucide-static/icons/activity.svg?raw';
import cable from 'lucide-static/icons/cable.svg?raw';
import plugZap from 'lucide-static/icons/plug-zap.svg?raw';
import armchair from 'lucide-static/icons/armchair.svg?raw';
import locateFixed from 'lucide-static/icons/locate-fixed.svg?raw';
import externalLink from 'lucide-static/icons/external-link.svg?raw';
import engine from 'lucide-static/icons/engine.svg?raw';
import fan from 'lucide-static/icons/fan.svg?raw';
import cog from 'lucide-static/icons/cog.svg?raw';
import disc from 'lucide-static/icons/disc.svg?raw';
import moveVertical from 'lucide-static/icons/move-vertical.svg?raw';
import zap from 'lucide-static/icons/zap.svg?raw';
import snowflake from 'lucide-static/icons/snowflake.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import arrowLeftRight from 'lucide-static/icons/arrow-left-right.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import chevronLeft from 'lucide-static/icons/chevron-left.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import table from 'lucide-static/icons/table.svg?raw';
import image from 'lucide-static/icons/image.svg?raw';
import imageOff from 'lucide-static/icons/image-off.svg?raw';
import zoomIn from 'lucide-static/icons/zoom-in.svg?raw';
import zoomOut from 'lucide-static/icons/zoom-out.svg?raw';
import maximize from 'lucide-static/icons/maximize.svg?raw';
import scan from 'lucide-static/icons/scan.svg?raw';
import fileX from 'lucide-static/icons/file-x.svg?raw';
import listTree from 'lucide-static/icons/list-tree.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import refreshCw from 'lucide-static/icons/refresh-cw.svg?raw';
import triangleAlert from 'lucide-static/icons/triangle-alert.svg?raw';
import panelLeftClose from 'lucide-static/icons/panel-left-close.svg?raw';
import panelRightClose from 'lucide-static/icons/panel-right-close.svg?raw';
import panelRightOpen from 'lucide-static/icons/panel-right-open.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';
import expand from 'lucide-static/icons/expand.svg?raw';
import shrink from 'lucide-static/icons/shrink.svg?raw';
import move3d from 'lucide-static/icons/move-3d.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';

const ICONES: Record<string, string> = {
  'car-front': carFront, 'clipboard-list': clipboardList, droplet, ruler, timer, 'book-open': bookOpen, megaphone, 'sticky-note': stickyNote,
  'circle-dot': circleDot, activity, cable, 'plug-zap': plugZap, armchair, 'locate-fixed': locateFixed, 'external-link': externalLink,
  engine, fan, cog, disc, 'move-vertical': moveVertical, zap, snowflake,
};
export const ic = (nome: string, cls = '') => L(ICONES[nome] || info, cls);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const plural = (n: number, um: string, varios: string) => `${n.toLocaleString('pt-PT')} ${n === 1 ? um : varios}`;
const BOTAO = (texto: string, icone: string, tipo = 'btn--acao', extra = '') => `<button type="button" class="btn ${tipo}"${extra}>${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;
let nRs = 0;
export const GIRA = (cls = 'tec__rs') => rolamentoSvg(`tec-${++nRs}`, 'pesquisar', `girador-rs ${cls}`);
const ICONE_TIPO: Record<TipoDoc, string> = { Plano: clipboardList, Procedimento: fileText, Tabela: table, Esquema: cable, Figura: image };

/** O que um ecrã (ou um estado) mostra. */
export interface Opcoes {
  px?: string;                         // o prefixo dos ids (cada estado tem o seu)
  veiculo?: string;                    // a chave do veículo escolhido
  seccao?: IdSeccao | 'geral';
  doc?: string;                        // o documento aberto no leitor
  sistema?: IdSistema;                 // o sistema escolhido (explorador) ou o filtro da secção
  q?: string; marca?: string;          // a pesquisa e a marca da escolha
  vistaSel?: 'cronologia' | 'tabela';  // a escolha em cronologia (por omissão, como os Pedidos) ou em tabela
  procura?: string;                    // a pesquisa técnica aberta com este texto
  fig?: number;                        // o visor aberto nesta figura
  aviso?: string;                      // uma faixa por cima do conteúdo
  carga?: 'veiculos' | 'pesquisa' | 'categorias' | 'doc' | 'img' | 'wd';
  erro?: 'veiculos' | 'doc' | 'img' | 'wd' | 'permissao';
  esbatido?: boolean;                  // sem ligação: o que já estava, esbatido
  ver?: 'veiculo' | 'explodida';       // o explorador: o carro ou a vista explodida do rolamento
  peca?: PecaRol;                      // a peça escolhida na vista explodida
  lado?: boolean;                      // o painel de contexto aberto (por omissão, fecha ao ler um documento)
  compacta?: boolean;                  // a navegação só com ícones (por omissão, ao ler um documento)
  sem3d?: boolean;                     // o navegador não tem WebGL: fica o desenho 2D
}
export type PecaRol = 'ext' | 'int' | 'esf' | 'gai';

/** Uma faixa (aviso ou erro) com o que aconteceu, o que fazer e uma saída. */
export const faixa = (tipo: 'erro' | 'aviso' | 'info', titulo: string, texto: string, botao = '') =>
  `<div class="tec__faixa tec__faixa--${tipo}" role="${tipo === 'erro' ? 'alert' : 'status'}">${L(tipo === 'info' ? info : triangleAlert)}<div><b>${titulo}</b><span>${texto}</span></div>${botao}</div>`;

/* ---------- a barra do veículo ---------- */
export const nomeVeiculo = (v: VeiculoTec) => `${v.marca} ${v.modelo} ${v.versao}`;
const potencia = (v: VeiculoTec) => `${v.kw} kW / ${v.cv} cv`;
const [desdeDe, ateDe] = [(v: VeiculoTec) => v.anos.split(' – ')[0], (v: VeiculoTec) => v.anos.split(' – ')[1].replace('…', 'hoje')];

/** A secção aberta, para a barra do veículo. */
export function nomeSeccao(v: VeiculoTec, o: Opcoes): string {
  const d = o.doc ? docsDe(v).find((x) => x.id === o.doc) : undefined;
  const s = d ? d.seccao : o.seccao || 'geral';
  return s === 'geral' ? 'Visão geral' : seccaoDe(s).nome;
}
export const ladoAberto = (o: Opcoes) => o.lado ?? !o.doc;
export const navCompacta = (o: Opcoes) => o.compacta ?? !!o.doc;

export function contexto(v: VeiculoTec | undefined, o: Opcoes = {}): string {
  const px = o.px || 'tec';
  if (!v) return `<section class="tec__ctx is-vazio" aria-label="Veículo escolhido">
      <span class="tec__ctx-carro" aria-hidden="true">${silhueta('Hatchback')}</span>
      <div class="tec__ctx-texto"><p class="tec__ctx-nada">Nenhum veículo escolhido</p><p class="tec__ctx-dica">Selecione um veículo para consultar as informações técnicas.</p></div>
    </section>`;
  return `<section class="tec__ctx" aria-label="Veículo escolhido">
      <span class="tec__ctx-carro" aria-hidden="true">${silhueta(v.carrocaria)}</span>
      <div class="tec__ctx-texto">
        <ol class="tec__migalhas" aria-label="Veículo"><li>${esc(v.marca)}</li><li>${esc(v.modelo)}</li><li>${esc(v.versao)}</li><li class="tec__motor">${esc(v.motor)}</li></ol>
        <p class="tec__ctx-dados"><span>${v.combustivel}</span><span>${potencia(v)}</span><span>${v.cc.toLocaleString('pt-PT')} cm³</span><span>${v.anos.replace('…', 'hoje')}</span><span class="tec__ctx-sec">${nomeSeccao(v, o)}</span></p>
      </div>
      <div class="tec__ctx-accoes">
        ${procuraTec(v, o, px)}
        ${BOTAO('Contexto', ladoAberto(o) ? panelRightClose : panelRightOpen, 'btn--ghost btn--sm tec__lado-btn', ` data-lado aria-pressed="${ladoAberto(o)}"`)}
        ${BOTAO('Mudar de veículo', arrowLeftRight, 'btn--ghost btn--sm', ' data-mudar')}
      </div>
    </section>`;
}

/** A pesquisa técnica: secções, sistemas e títulos dos documentos do veículo. */
function procuraTec(v: VeiculoTec, o: Opcoes, px: string): string {
  const q = o.procura || '';
  return `<div class="tec__procura" role="search">
      <label class="tec__caixa">${L(search)}<span class="tec__sr">Pesquisar nas informações técnicas</span>
        <input class="tec__procura-campo" id="${px}-procura" type="search" placeholder="Secção, documento ou sistema" autocomplete="off" role="combobox" aria-expanded="${q ? 'true' : 'false'}" aria-controls="${px}-sugestoes" aria-autocomplete="list" value="${esc(q)}"${o.esbatido ? ' disabled' : ''}>
      </label>
      <div class="tec__sugestoes" id="${px}-sugestoes" role="listbox" aria-label="Resultados"${q ? '' : ' hidden'}>${q ? sugestoes(v, q) : ''}</div>
    </div>`;
}
export function sugestoes(v: VeiculoTec, q: string): string {
  const r = procurarTec(docsDe(v), q);
  const n = r.seccoes.length + r.sistemas.length + r.docs.length;
  if (!n) return `<p class="tec__sug-nada">Nada com «${esc(q)}» nas informações técnicas deste veículo.</p>`;
  const opcao = (dados: string, icone: string, texto: string, sub: string) => `<button type="button" role="option" class="tec__sug" ${dados}>${icone}<span>${texto}<small>${sub}</small></span></button>`;
  return [
    r.seccoes.length ? `<p class="tec__sug-grupo">Secções</p>${r.seccoes.map((s) => opcao(`data-sec="${s.id}"`, ic(s.icone), s.nome, grupoDe(s.grupo).nome)).join('')}` : '',
    r.sistemas.length ? `<p class="tec__sug-grupo">Sistemas</p>${r.sistemas.map((s) => opcao(`data-sis="${s.id}"`, ic(s.icone), s.nome, plural(docsDoSistema(docsDe(v), s.id).length, 'documento', 'documentos'))).join('')}` : '',
    r.docs.length ? `<p class="tec__sug-grupo">Documentos</p>${r.docs.map((d) => opcao(`data-doc="${d.id}"`, L(ICONE_TIPO[d.tipo]), esc(d.titulo), `${seccaoDe(d.seccao).nome}${d.sistema ? ' · ' + sistemaDe(d.sistema).nome : ''}`)).join('')}` : '',
  ].join('');
}

/* ---------- ESCOLHER o veículo ---------- */
function linhaVeiculo(v: VeiculoTec, i: number): string {
  return `<tr class="tec__v" data-chave="${esc(v.chave)}" tabindex="0" style="--i:${i}">
      <td class="tec__v-nome" data-r="Modelo"><span class="tec__v-carro" aria-hidden="true">${silhueta(v.carrocaria)}</span><span><b>${esc(v.versao)}</b><small>${esc(v.marca)} ${esc(v.modelo)}</small></span></td>
      <td class="tec__mono" data-r="Código do motor">${esc(v.motor)}</td>
      <td class="tec__num" data-r="Fabricado desde">${desdeDe(v)}</td>
      <td class="tec__num" data-r="Fabricado até">${ateDe(v)}</td>
      <td class="tec__v-acao"><button type="button" class="btn btn--ghost btn--sm tec__escolher-btn" tabindex="-1">${L(check, 'btn__icone')}<span class="btn__rotulo">Escolher</span></button></td>
    </tr>`;
}
/** As linhas da tabela, por modelo (o modelo e os anos dele por cima das motorizações). */
export function linhasVeiculos(lista: VeiculoTec[]): string {
  let i = 0;
  const modelos = Array.from(new Set(lista.map((v) => `${v.marca}|${v.modelo}`)));
  return modelos.map((m) => {
    const vs = lista.filter((v) => `${v.marca}|${v.modelo}` === m);
    const [marca, modelo] = m.split('|');
    return `<tbody class="tec__modelo"><tr class="tec__m"><th colspan="5" scope="rowgroup"><b>${esc(marca)} ${esc(modelo)}</b><span>${vs[0].carrocaria} · ${plural(vs.length, 'motorização', 'motorizações')}</span></th></tr>${vs.map((v) => linhaVeiculo(v, i++)).join('')}</tbody>`;
  }).join('');
}
/* (15 out., ela: «quero a mesma ordem de cronologia […] prefiro mudar do que estar em table») a escolha em
   cronologia, como os Pedidos, as Guias e as Faturas: por ano e mês de «Fabricado desde», da mais recente para a mais
   antiga; o marcador com o carro, azul se ainda se fabrica; por baixo da data, até quando. A tabela é a alternativa. */
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const chaveData = (v: VeiculoTec) => { const [m, a] = desdeDe(v).split('/'); return `${a}-${m}`; };
export function cronologiaVeiculos(lista: VeiculoTec[]): string {
  const meses = new Map<string, VeiculoTec[]>();
  [...lista].sort((a, b) => chaveData(b).localeCompare(chaveData(a)) || a.marca.localeCompare(b.marca) || a.modelo.localeCompare(b.modelo)).forEach((v) => { const k = chaveData(v); meses.set(k, [...(meses.get(k) || []), v]); });
  let i = 0, ano = '';
  return `<div class="ped4__crono tec__crono">
      <span class="ped4__c-linha" aria-hidden="true"><span class="ped4__c-linha-cheia"></span></span>
      ${Array.from(meses).map(([k, vs]) => {
        const [a, m] = k.split('-'), nome = MESES[+m - 1];
        const cabAno = a !== ano ? `<h2 class="gui3__ano is-entrou">${a}</h2>` : ''; ano = a;
        return `${cabAno}<section class="ped4__mes" aria-label="${nome} de ${a}"><h3 class="ped4__mes-t is-entrou"><span>${nome[0].toUpperCase()}${nome.slice(1)} de ${a}</span><small><b>${vs.length}</b> ${vs.length === 1 ? 'motorização' : 'motorizações'}</small></h3>
          <ol class="ped4__c-lista">${vs.map((v) => itemVeiculo(v, i++)).join('')}</ol></section>`;
      }).join('')}
      <p class="ped4__c-fim"><span class="ped4__c-marca" aria-hidden="true"></span>Não há motorizações mais antigas nesta lista.</p>
    </div>`;
}
function itemVeiculo(v: VeiculoTec, i: number): string {
  const [m] = desdeDe(v).split('/'), ainda = v.anos.endsWith('…');
  return `<li class="ped4__c-item tec__c-item is-entrou" style="--i:${i}">
      <span class="ped4__c-data" aria-hidden="true"><b>${MESES[+m - 1].slice(0, 3)}</b><em class="ped4__c-etapa${ainda ? ' ped4__c-etapa--expedido' : ''}">${ainda ? 'a fabricar' : 'até ' + ateDe(v)}</em></span>
      <span class="ped4__c-marca tec__c-marca" aria-hidden="true">${L(carFront)}</span>
      <article class="ped4__c-cartao">
        <button type="button" class="ped4__c-cabeca tec__v tec__c-cabeca" data-chave="${esc(v.chave)}">
          <span class="tec__v-nome"><span class="tec__v-carro" aria-hidden="true">${silhueta(v.carrocaria)}</span><span><b>${esc(v.versao)}</b><small>${esc(v.marca)} ${esc(v.modelo)} · ${v.carrocaria}</small></span></span>
          <span class="tec__c-campo"><small>Código do motor</small><span class="tec__mono">${esc(v.motor)}</span></span>
          <span class="tec__c-campo"><small>Fabricado</small><span>${desdeDe(v)} – ${ateDe(v)}</span></span>
          <span class="ped4__c-seta" aria-hidden="true">${L(chevronRight)}</span>
        </button>
      </article>
    </li>`;
}

const CABECA_TABELA = `<thead><tr><th scope="col">Modelo</th><th scope="col">Código do motor</th><th scope="col" class="tec__num">Fabricado desde</th><th scope="col" class="tec__num">Fabricado até</th><th scope="col"><span class="tec__sr">Escolher</span></th></tr></thead>`;

export function contaVeiculos(lista: VeiculoTec[], q: string, marca: string): string {
  if (q) return `<b>${plural(lista.length, 'veículo', 'veículos')}</b> com «${esc(q)}», em todas as marcas`;
  return `<b>${plural(lista.length, 'veículo', 'veículos')}</b> ${esc(marca)} · do mais recente para o mais antigo`;
}
export function semVeiculos(q: string): string {
  return `<div class="tec__vazio" role="status">${L(search)}<p><strong>Nenhum veículo corresponde à pesquisa.</strong>Não há marca, modelo nem código do motor com «${esc(q)}». Experimente só o código do motor (por exemplo, N47) ou escolha a marca.</p>${BOTAO('Limpar a pesquisa', x, 'btn--ghost btn--sm', ' data-limpar')}</div>`;
}

export function escolher(o: Opcoes): string {
  const px = o.px || 'tec', q = o.q || '', marca = o.marca || 'BMW';
  const lista = q ? procurarVeiculos(q) : veiculosDaMarca(marca);
  let corpo: string;
  if (o.carga === 'veiculos') corpo = `<table class="tec__tabela is-esq" aria-busy="true">${CABECA_TABELA}<tbody>${Array.from({ length: 7 }, (_, i) => `<tr class="tec__v-esq" style="--i:${i}"><td colspan="5"><span class="tec__esq" style="width:28%"></span><span class="tec__esq" style="width:14%"></span><span class="tec__esq" style="width:10%"></span><span class="tec__esq" style="width:16%"></span></td></tr>`).join('')}</tbody></table>`;
  else if (o.erro === 'veiculos') corpo = `<div class="tec__vazio tec__vazio--erro" role="alert">${L(triangleAlert)}<p><strong>Não foi possível carregar os veículos.</strong>O serviço do catálogo não respondeu (erro 503 · ref. VT-2611). A pesquisa que escreveu fica; tente de novo ou ligue para o apoio: +351 226 158 300.</p>${BOTAO('Tentar novamente', refreshCw, 'btn--acao btn--sm')}</div>`;
  else if (!lista.length) corpo = semVeiculos(q);
  else corpo = (o.vistaSel || 'cronologia') === 'cronologia' ? `<div class="tec__crono-caixa${o.carga === 'pesquisa' ? ' is-a-pesquisar' : ''}">${cronologiaVeiculos(lista)}</div>`
    : `<table class="tec__tabela${o.carga === 'pesquisa' ? ' is-a-pesquisar' : ''}">${CABECA_TABELA}${linhasVeiculos(lista)}</table>`;
  const conta = o.carga === 'veiculos' ? 'A carregar os veículos…' : o.erro === 'veiculos' ? 'Sem veículos' : o.carga === 'pesquisa' ? `${GIRA()} A pesquisar «${esc(q)}»…` : contaVeiculos(lista, q, marca);
  return `<section class="tec__escolher" aria-label="Escolher o veículo">
      <div class="tec__sel">
        ${o.aviso || ''}
        <div class="tec__sel-topo">
          <label class="tec__caixa tec__caixa--grande" for="${px}-q">${L(search)}<span class="tec__sr">Pesquisar veículo</span>
            <input class="tec__q" id="${px}-q" type="search" placeholder="Marca, modelo ou código do motor (por exemplo, N47)" autocomplete="off" value="${esc(q)}">
          </label>
          <div class="tec__marcas" role="radiogroup" aria-label="Marca">${MARCAS.map((m) => `<button type="button" role="radio" class="tec__marca" data-marca="${esc(m)}" aria-checked="${!q && m === marca}">${esc(m)}</button>`).join('')}</div>
        </div>
        <div class="tec__conta-linha"><p class="tec__conta" aria-live="polite">${conta}</p>
          <div class="ped4__vistas tec__vistas" role="group" aria-label="Ver como"><button type="button" class="ped4__vista" data-vista-sel="cronologia" aria-pressed="${(o.vistaSel || 'cronologia') === 'cronologia'}">${L(history)}Cronologia</button><button type="button" class="ped4__vista" data-vista-sel="tabela" aria-pressed="${o.vistaSel === 'tabela'}">${L(table)}Tabela</button></div></div>
        <div class="tec__lista">${corpo}</div>
      </div>
      ${guia()}
    </section>`;
}

/** Ao lado da lista, no lugar do branco do ecrã antigo: o que fica disponível depois de escolher. */
function guia(): string {
  return `<aside class="tec__guia" aria-label="Depois de escolher">
      <span class="tec__guia-carro" aria-hidden="true">${silhueta('Hatchback')}</span>
      <p class="tec__guia-titulo">Selecione um veículo para consultar as informações técnicas.</p>
      <p class="tec__guia-texto">Escolha a motorização na lista. O veículo fica preso no topo enquanto consulta:</p>
      <ul class="tec__guia-grupos">${GRUPOS.map((g) => `<li><b>${g.nome}</b><span>${g.id === 'veiculo' ? 'Os dados do veículo e as outras motorizações do modelo' : SECCOES.filter((s) => s.grupo === g.id).map((s) => s.nome).join(' · ')}</span></li>`).join('')}</ul>
      <p class="tec__guia-nota">${L(info)}Para trocar de veículo depois, use «Mudar de veículo» na barra de cima.</p>
    </aside>`;
}

/* ---------- a navegação agrupada ---------- */
export function navegacao(_v: VeiculoTec, docs: Doc[], ativa: IdSeccao | 'geral', o: Opcoes = {}): string {
  const n = (s: IdSeccao) => docsDaSeccao(docs, s).length;
  const conta = (s: IdSeccao) => s === 'veiculo' ? '' : s === 'workshopdata' ? `<span class="tec__item-n">${L(externalLink)}</span>` : `<span class="tec__item-n${n(s) ? '' : ' is-zero'}">${n(s)}</span>`;
  const carga = o.carga === 'categorias';
  const item = (id: string, nome: string, icone: string, extra: string, i: number) =>
    `<li style="--i:${i}"><button type="button" class="tec__item" data-sec="${id}" title="${nome}"${id === ativa ? ' aria-current="page"' : ''}>${icone}<span class="tec__item-nome">${nome}</span>${extra}</button></li>`;
  let i = 0;
  return `<nav class="tec__nav${carga ? ' is-a-carregar' : ''}" aria-label="Secções técnicas"${carga ? ' aria-busy="true"' : ''}>
      <button type="button" class="tec__nav-abrir" aria-expanded="false" aria-controls="${o.px || 'tec'}-nav-lista">${L(listTree)}<span>Secção · <b>${ativa === 'geral' ? 'Visão geral' : seccaoDe(ativa).nome}</b></span>${L(chevronDown)}</button>
      <div class="tec__nav-lista" id="${o.px || 'tec'}-nav-lista">
        <button type="button" class="tec__nav-recolher" data-nav-recolher aria-pressed="${navCompacta(o)}" title="${navCompacta(o) ? 'Mostrar os nomes' : 'Recolher a navegação'}">${L(panelLeftClose)}<span>Recolher a navegação</span></button>
        <span class="tec__indicador" aria-hidden="true"></span>
        <ul class="tec__itens tec__itens--topo">${item('geral', 'Visão geral', L(layoutGrid), '', i++)}</ul>
        ${GRUPOS.map((g) => {
          const ss = SECCOES.filter((s) => s.grupo === g.id);
          const total = ss.reduce((a, s) => a + n(s.id), 0);
          return `<div class="tec__grupo" data-grupo="${g.id}">
            <button type="button" class="tec__grupo-t" aria-expanded="true" aria-controls="${o.px || 'tec'}-g-${g.id}"><span>${g.nome}</span>${g.id !== 'veiculo' && g.id !== 'recursos' ? `<small>${total}</small>` : ''}${L(chevronDown)}</button>
            <ul class="tec__itens" id="${o.px || 'tec'}-g-${g.id}">${carga ? ss.map(() => `<li style="--i:${i++}"><span class="tec__item tec__item--esq"><span class="tec__esq" style="width:16px;height:16px"></span><span class="tec__esq" style="width:60%"></span></span></li>`).join('')
              : ss.map((s) => item(s.id, s.nome, ic(s.icone), conta(s.id), i++)).join('')}</ul>
          </div>`;
        }).join('')}
      </div>
    </nav>`;
}

/* ---------- o explorador do veículo ---------- */
/* zonas GERAIS na silhueta de lado (frente à esquerda): o que o desenho pode dizer sem dados de posição. A
   transmissão segue a tração do Catálogo (traseira: até ao eixo de trás). O sistema elétrico é o veículo todo. */
function zonas(v: VeiculoTec): Record<IdSistema, string> {
  const [corpo, janelas, y] = formaDe(v.carrocaria);
  const r = y === 80 ? 17 : 15, f = 58, t = 182;
  const traseira = v.tracao === 'Tração traseira';
  return {
    arrefecimento: `<rect x="16" y="${y - 24}" width="16" height="20" rx="3"/>`,
    motor: `<rect x="32" y="${y - 30}" width="44" height="24" rx="4"/>`,
    transmissao: traseira ? `<rect x="74" y="${y - 12}" width="22" height="10" rx="3"/><rect x="96" y="${y - 9}" width="${t - 96}" height="5" rx="2.5"/>` : `<rect x="72" y="${y - 16}" width="22" height="13" rx="3"/>`,
    travoes: `<circle cx="${f}" cy="${y}" r="${r * .62}"/><circle cx="${t}" cy="${y}" r="${r * .62}"/>`,
    suspensao: `<rect x="${f - 7}" y="${y - r - 13}" width="14" height="15" rx="3"/><rect x="${t - 7}" y="${y - r - 13}" width="14" height="15" rx="3"/>`,
    direcao: `<circle cx="${f}" cy="${y}" r="${r + 2.5}" class="tec__zona-anel"/><path d="M${f + 8} ${y - 12} L${f + 40} ${y - 30}" class="tec__zona-linha"/>`,
    eletrico: `<path d="${corpo}" class="tec__zona-todo"/>`,
    climatizacao: `<path d="${janelas}"/>`,
  };
}
const ROTULO: Record<IdSistema, [number, number]> = { arrefecimento: [24, -28], motor: [54, -34], transmissao: [110, -18], travoes: [182, 22], suspensao: [182, -36], direcao: [58, 24], eletrico: [130, -62], climatizacao: [128, -54] };

/* a vista explodida: o rolamento rígido de esferas 6206 (as medidas normalizadas que o rolamento 3D já usa) */
export const PECAS: Record<PecaRol, { nome: string; medidas: [string, string][]; texto: string }> = {
  ext: { nome: 'Anel exterior', medidas: [['Diâmetro exterior (D)', '62 mm'], ['Largura (B)', '16 mm']], texto: 'A pista das esferas está cavada por dentro.' },
  gai: { nome: 'Gaiola', medidas: [['Esferas guiadas', '9']], texto: 'Mantém as esferas à mesma distância umas das outras.' },
  esf: { nome: 'Esferas', medidas: [['Quantidade', '9'], ['Diâmetro', '9,525 mm'], ['Diâmetro primitivo', '46 mm']], texto: 'Rolam entre as pistas dos dois anéis.' },
  int: { nome: 'Anel interior', medidas: [['Furo (d)', '30 mm'], ['Largura (B)', '16 mm']], texto: 'Monta no veio; a pista das esferas está por fora.' },
};
const ORDEM_PECAS: PecaRol[] = ['ext', 'gai', 'esf', 'int'];
/** O desenho 2D da vista explodida (de frente, à escala, em mm): para quando não há 3D. */
function rolamentoPlano(peca?: PecaRol): string {
  const anel = (cx: number, R: number, r: number) => `M${cx - R} 42a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0ZM${cx - r} 42a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const g = (p: PecaRol, x: number, corpo: string) => `<g class="tec__peca2d" data-peca="${p}"${p === peca ? ' aria-current="true"' : ''}>${corpo}<text x="${x}" y="88" text-anchor="middle">${PECAS[p].nome}</text></g>`;
  const bolas = Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2; return `<circle cx="${(156 + 23 * Math.cos(a)).toFixed(2)}" cy="${(42 + 23 * Math.sin(a)).toFixed(2)}" r="4.76"/>`; }).join('');
  return `<svg class="tec__rol2d" viewBox="0 0 300 96" role="group" aria-label="Rolamento 6206 desmontado">
      ${g('ext', 36, `<path d="${anel(36, 31, 26.7)}" fill-rule="evenodd"/>`)}
      ${g('gai', 96, `<circle cx="96" cy="42" r="23" class="tec__gaiola2d"/>`)}
      ${g('esf', 156, bolas)}
      ${g('int', 238, `<path d="${anel(238, 19.3, 15)}" fill-rule="evenodd"/>`)}
    </svg>`;
}

export function explorador(v: VeiculoTec, docs: Doc[], o: Opcoes = {}): string {
  const px = o.px || 'tec', sis = o.sistema, ver = o.ver || 'veiculo';
  const [corpo, janelas, y] = formaDe(v.carrocaria);
  const r = y === 80 ? 17 : 15;
  const z = zonas(v);
  const roda = (cx: number) => `<circle class="tec__roda" cx="${cx}" cy="${y}" r="${r}"/><circle class="tec__jante" cx="${cx}" cy="${y}" r="${r * .45}"/>`;
  const comDocs = SISTEMAS.filter((s) => docsDoSistema(docs, s.id).length);
  const separadores = `<div class="tec__ver" role="group" aria-label="O que explorar">
      <button type="button" class="tec__ver-b" data-ver="veiculo" aria-pressed="${ver === 'veiculo'}">${L(carFront)}Veículo</button>
      <button type="button" class="tec__ver-b" data-ver="explodida" aria-pressed="${ver === 'explodida'}">${L(layers)}Vista explodida</button>
    </div>`;
  const falta3d = o.sem3d ? `<p class="tec__3d-falta">${L(info)}Este navegador não mostra 3D (WebGL desligado). Fica o desenho; os sistemas e os documentos funcionam na mesma.</p>` : '';
  if (ver === 'explodida') return `<section class="tec__cartao tec__expl" data-ver="explodida" aria-labelledby="${px}-expl-t"${o.sem3d ? ' data-sem3d' : ''}>
      <header class="tec__expl-cabeca"><div><h2 id="${px}-expl-t">${L(layers)}Vista explodida</h2><p>Rolamento rígido de esferas 6206: escolha uma peça para a ver em separado.</p></div>${separadores}</header>
      <div class="tec__expl-corpo">
        <figure class="tec__expl-fig tec__expl-fig--rol">
          <div class="tec__palco3d" data-palco="rolamento"></div>
          <p class="tec__3d-rotulo" hidden></p>
          ${rolamentoPlano(o.peca)}
          <div class="tec__3d-barra"><span class="tec__3d-nota">${L(info)}Medidas normalizadas do 6206. Não é uma peça escolhida deste veículo.</span>
            <span class="tec__3d-ctl">${BOTAO('Montar', shrink, 'btn--ghost btn--sm', ' data-explodir="0"')}${BOTAO('Separar', expand, 'btn--ghost btn--sm', ' data-explodir="1"')}${BOTAO('Repor', rotateCcw, 'btn--ghost btn--sm', ' data-repor')}</span></div>
          ${falta3d}
          <figcaption><span class="so-3d">Arraste para rodar; a roda do rato aproxima. Clique numa peça para a escolher.</span><span class="so-2d">O conjunto desmontado, de frente e à escala. Clique numa peça para a escolher.</span></figcaption>
        </figure>
        <ul class="tec__sistemas" aria-label="Peças">${ORDEM_PECAS.map((p, i) => `<li style="--i:${i}"><button type="button" class="tec__sistema" data-peca="${p}" aria-pressed="${p === o.peca}">${L(p === 'esf' ? circleDot : p === 'gai' ? cog : disc)}<span>${PECAS[p].nome}</span><small>${PECAS[p].medidas[0][1]}</small></button></li>`).join('')}</ul>
      </div>
    </section>`;
  return `<section class="tec__cartao tec__expl" data-ver="veiculo" aria-labelledby="${px}-expl-t"${sis ? ` data-sis="${sis}"` : ''}${o.sem3d ? ' data-sem3d' : ''}>
      <header class="tec__expl-cabeca"><div><h2 id="${px}-expl-t">${L(move3d)}Explorador do veículo</h2><p>Escolha um sistema no desenho ou na lista: a câmara aproxima-se e os documentos dele aparecem por baixo.</p></div>${separadores}</header>
      <div class="tec__expl-corpo">
        <figure class="tec__expl-fig">
          <div class="tec__palco3d" data-palco="carro" data-carrocaria="${esc(v.carrocaria)}" data-tracao="${esc(v.tracao)}"></div>
          <p class="tec__3d-rotulo" hidden></p>
          <svg class="tec__expl-svg" viewBox="0 0 240 112" role="group" aria-label="Zonas do veículo">
            <path class="tec__chao" d="M6 ${y + r + 1}h228"/>
            <path class="tec__corpo" d="${corpo}"/><path class="tec__janelas" d="${janelas}"/>${roda(58)}${roda(182)}
            ${comDocs.map((s) => { const [lx, ly] = ROTULO[s.id]; return `<g class="tec__zona" data-sis="${s.id}"${s.id === sis ? ' aria-current="true"' : ''}>${z[s.id]}<text x="${lx}" y="${y + ly}" text-anchor="middle">${s.nome === 'Aquecimento e ar condicionado' ? 'Climatização' : s.nome}</text></g>`; }).join('')}
          </svg>
          <div class="tec__3d-barra"><span class="tec__3d-nota">${L(info)}Modelo ilustrativo (${esc(v.carrocaria.toLowerCase())}): não é o ${esc(nomeVeiculo(v))}.</span>
            <span class="tec__3d-ctl"><span class="tec__seg" role="group" aria-label="Vista"><button type="button" class="tec__seg-b" data-vista3d="exterior" aria-pressed="${!sis}">Exterior</button><button type="button" class="tec__seg-b" data-vista3d="tecnica" aria-pressed="${!!sis}">Técnica</button></span>${BOTAO('Repor', rotateCcw, 'btn--ghost btn--sm', ' data-repor')}</span></div>
          ${falta3d}
          <figcaption>${L(info)}<span><span class="so-3d">Arraste para rodar; a roda do rato aproxima. </span>Zonas gerais do veículo, com a frente à esquerda. A posição exata de cada peça está em <button type="button" class="tec__ligacao" data-sec="posicao">Posição de peças</button>.</span></figcaption>
        </figure>
        <ul class="tec__sistemas" aria-label="Sistemas">${comDocs.map((s, i) => `<li style="--i:${i}"><button type="button" class="tec__sistema" data-sis="${s.id}" aria-pressed="${s.id === sis}">${ic(s.icone)}<span>${s.nome}</span><small>${docsDoSistema(docs, s.id).length}</small></button></li>`).join('')}</ul>
      </div>
      <div class="tec__expl-docs" aria-live="polite">${sis ? docsSistema(v, docs, sis) : `<p class="tec__expl-dica">${L(info)}Nenhum sistema escolhido. Os ${docs.length} documentos deste veículo estão também nas secções, à esquerda.</p>`}</div>
    </section>`;
}
export function docsSistema(v: VeiculoTec, docs: Doc[], sis: IdSistema): string {
  const ds = docsDoSistema(docs, sis);
  return `<div class="tec__sis-cabeca">${ic(sistemaDe(sis).icone)}<h3>${sistemaDe(sis).nome}</h3><span>${plural(ds.length, 'documento', 'documentos')} para o ${esc(v.versao)} (${esc(v.motor)})</span>
      <button type="button" class="btn btn--acao btn--sm" data-ir="catalogo">${L(pkg, 'btn__icone')}<span class="btn__rotulo">Ver as peças no Catálogo</span></button></div>
    <ul class="tec__docs tec__docs--compacta">${ds.map((d, i) => linhaDoc(d, i, true)).join('')}</ul>`;
}

/* ---------- as secções ---------- */
function linhaDoc(d: Doc, i: number, comSeccao = false): string {
  return `<li style="--i:${i}"><button type="button" class="tec__doc" data-doc="${d.id}">
      <span class="tec__doc-i" aria-hidden="true">${L(ICONE_TIPO[d.tipo])}</span>
      <span class="tec__doc-t"><b>${esc(d.titulo)}</b><small>${comSeccao ? seccaoDe(d.seccao).nome : 'WorkshopData'}</small></span>
      <span class="tec__doc-sis">${d.sistema ? sistemaDe(d.sistema).nome : 'Geral'}</span>
      <span class="tec__doc-tipo">${d.tipo}</span>
      <span class="tec__doc-fig">${d.figuras ? `${L(image)}${d.figuras}` : ''}</span>
      <span class="tec__doc-abrir">Abrir${L(chevronRight)}</span>
    </button></li>`;
}

/** A visão geral: o explorador (o que há em cada grupo está no painel de contexto). */
function visaoGeral(v: VeiculoTec, docs: Doc[], o: Opcoes): string {
  const px = o.px || 'tec';
  return `<div class="tec__pagina" data-pagina="geral">
      <header class="tec__pag-cabeca"><p class="tec__olho">Visão geral</p><h2 class="tec__pag-titulo" id="${px}-pag-t">${esc(nomeVeiculo(v))}</h2>
        <p class="tec__pag-meta">${plural(docs.length, 'documento', 'documentos')} do WorkshopData para o motor ${esc(v.motor)}</p></header>
      ${explorador(v, docs, o)}
    </div>`;
}

/* ---------- o painel de contexto (à direita) ---------- */
function ladoVeiculo(v: VeiculoTec, docs: Doc[]): string {
  const dado = (t: string, d: string, cls = '') => `<div><dt>${t}</dt><dd${cls ? ` class="${cls}"` : ''}>${d}</dd></div>`;
  return `<section class="tec__lado-bloco"><span class="tec__lado-carro" aria-hidden="true">${silhueta(v.carrocaria)}</span><h3>${esc(nomeVeiculo(v))}</h3>
      <dl class="tec__lado-dl">${dado('Código do motor', esc(v.motor), 'tec__mono')}${dado('Combustível', v.combustivel)}${dado('Potência', potencia(v))}${dado('Cilindrada', `${v.cc.toLocaleString('pt-PT')} cm³`)}${dado('Tração', v.tracao)}${dado('Fabricado', v.anos.replace('…', 'hoje'))}</dl></section>
    <section class="tec__lado-bloco"><h3>Neste veículo</h3>${GRUPOS.filter((g) => g.id !== 'veiculo' && g.id !== 'recursos').map((g) => `<p class="tec__lado-g">${g.nome}</p><ul class="tec__lado-l">${SECCOES.filter((s) => s.grupo === g.id).map((s) => {
      const k = docsDaSeccao(docs, s.id).length;
      return `<li><button type="button" class="tec__lado-s${k ? '' : ' is-zero'}" data-sec="${s.id}">${ic(s.icone)}<span>${s.nome}</span><b>${k || '—'}</b></button></li>`;
    }).join('')}</ul>`).join('')}</section>`;
}
function ladoSistema(v: VeiculoTec, docs: Doc[], sis: IdSistema): string {
  const ds = docsDoSistema(docs, sis);
  const secs = SECCOES.filter((s) => ds.some((d) => d.seccao === s.id));
  return `<section class="tec__lado-bloco"><p class="tec__lado-sis">${ic(sistemaDe(sis).icone)}<span><b>${sistemaDe(sis).nome}</b><small>${plural(ds.length, 'documento', 'documentos')} · ${esc(v.versao)} (${esc(v.motor)})</small></span></p>
      <ul class="tec__lado-l">${secs.map((s) => `<li><button type="button" class="tec__lado-s" data-sec="${s.id}" data-com-sis="${sis}">${ic(s.icone)}<span>${s.nome}</span><b>${ds.filter((d) => d.seccao === s.id).length}</b></button></li>`).join('')}</ul>
      <button type="button" class="btn btn--acao btn--sm tec__lado-pecas" data-ir="catalogo">${L(pkg, 'btn__icone')}<span class="btn__rotulo">Peças de ${sistemaDe(sis).nome.toLowerCase()} no Catálogo</span></button></section>`;
}
function ladoDoc(docs: Doc[], d: Doc): string {
  const rel = d.sistema ? docs.filter((x) => x.sistema === d.sistema && x.id !== d.id && x.seccao !== d.seccao) : [];
  return `<section class="tec__lado-bloco"><p class="tec__cap-t">${d.sistema ? ic(sistemaDe(d.sistema).icone) : L(info)}${d.sistema ? `Também de ${sistemaDe(d.sistema).nome.toLowerCase()}` : 'Relacionados'}</p>
      ${rel.length ? `<ul class="tec__lado-l">${rel.map((x) => `<li><button type="button" class="tec__rel-i" data-doc="${x.id}"><b>${esc(x.titulo)}</b><small>${seccaoDe(x.seccao).nome} · ${x.tipo}</small></button></li>`).join('')}</ul>` : '<p class="tec__rel-nada">Sem outros documentos deste sistema.</p>'}
      ${d.sistema ? `<button type="button" class="btn btn--ghost btn--sm tec__lado-pecas" data-ir="catalogo">${L(pkg, 'btn__icone')}<span class="btn__rotulo">Peças de ${sistemaDe(d.sistema).nome.toLowerCase()}</span></button>` : ''}</section>`;
}
function ladoPeca(p?: PecaRol): string {
  const dl = (m: [string, string][]) => `<dl class="tec__lado-dl">${m.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>`;
  return `<section class="tec__lado-bloco">${p ? `<p class="tec__lado-sis">${L(p === 'esf' ? circleDot : p === 'gai' ? cog : disc)}<span><b>${PECAS[p].nome}</b><small>Rolamento rígido de esferas 6206</small></span></p><p class="tec__lado-texto">${PECAS[p].texto}</p>${dl(PECAS[p].medidas)}`
    : `<h3>Rolamento rígido de esferas 6206</h3><p class="tec__lado-texto">Quatro peças: anel exterior, gaiola, 9 esferas e anel interior. Escolha uma para a ver em separado.</p>${dl([['Diâmetro exterior (D)', '62 mm'], ['Furo (d)', '30 mm'], ['Largura (B)', '16 mm'], ['Esferas', '9 × 9,525 mm']])}`}
      <p class="tec__lado-nota">${L(info)}Medidas normalizadas (ISO 15). É o único conjunto com geometria verificada neste protótipo; não é uma peça escolhida deste veículo.</p>
      <button type="button" class="btn btn--ghost btn--sm tec__lado-pecas" data-ir="catalogo">${L(pkg, 'btn__icone')}<span class="btn__rotulo">Procurar 6206 no Catálogo</span></button></section>`;
}
/** O painel de contexto: o veículo; o sistema escolhido; os relacionados do documento; a peça da vista explodida. */
export function lado(v: VeiculoTec, o: Opcoes): string {
  const docs = docsDe(v);
  const d = o.doc ? docs.find((x) => x.id === o.doc) : undefined;
  const geral = (o.seccao || 'geral') === 'geral' && !d;
  const corpo = !docs.length ? ladoVeiculo(v, docs) : d ? ladoDoc(docs, d) : geral && o.ver === 'explodida' ? ladoPeca(o.peca) : geral && o.sistema ? ladoSistema(v, docs, o.sistema) : ladoVeiculo(v, docs);
  return `<header class="tec__lado-cabeca"><p class="tec__olho">Contexto</p><button type="button" class="btn btn--ghost btn--sm" data-lado-fechar>${L(panelRightClose, 'btn__icone')}<span class="btn__rotulo">Recolher</span></button></header>${corpo}`;
}

/** Os dados do veículo (só os do Catálogo) e as outras motorizações do mesmo modelo. */
function seccaoVeiculo(v: VeiculoTec, o: Opcoes): string {
  const px = o.px || 'tec';
  const outros = veiculosDe(v.marca, v.modelo).filter((w) => w.versao !== v.versao);
  const dado = (t: string, d: string, cls = '') => `<div><dt>${t}</dt><dd${cls ? ` class="${cls}"` : ''}>${d}</dd></div>`;
  return `<div class="tec__pagina" data-pagina="veiculo">
      <header class="tec__pag-cabeca"><p class="tec__olho">Veículo</p><h2 class="tec__pag-titulo" id="${px}-pag-t">Veículo</h2><p class="tec__pag-meta">Os dados do Catálogo para este veículo</p></header>
      <section class="tec__cartao tec__ident">
        <span class="tec__ident-carro" aria-hidden="true">${silhueta(v.carrocaria)}</span>
        <dl class="tec__dl">${dado('Marca', esc(v.marca))}${dado('Modelo', esc(v.modelo))}${dado('Motorização', esc(v.versao))}${dado('Código do motor', esc(v.motor), 'tec__mono')}
          ${dado('Combustível', v.combustivel)}${dado('Potência', potencia(v))}${dado('Cilindrada', `${v.cc.toLocaleString('pt-PT')} cm³`)}${dado('Tração', v.tracao)}
          ${dado('Carroçaria', v.carrocaria)}${dado('Fabricado desde', desdeDe(v))}${dado('Fabricado até', ateDe(v))}</dl>
      </section>
      <section class="tec__cartao" aria-labelledby="${px}-outros-t">
        <header class="tec__cartao-cabeca"><h2 id="${px}-outros-t">${L(arrowLeftRight)}Outras motorizações do ${esc(v.modelo)}</h2><p>Escolha outra para trocar o veículo sem voltar à lista.</p></header>
        <table class="tec__tabela tec__tabela--curta">${CABECA_TABELA}<tbody>${outros.map((w, i) => linhaVeiculo({ ...w, marca: v.marca, modelo: v.modelo, chave: `${v.marca}|${v.modelo}|${w.versao}` }, i)).join('')}</tbody></table>
      </section>
    </div>`;
}

/** Uma secção de documentos: a lista (com o filtro por sistema) ou o vazio dela. */
function seccaoDocs(v: VeiculoTec, docs: Doc[], s: IdSeccao, o: Opcoes): string {
  const px = o.px || 'tec';
  const sec = seccaoDe(s);
  const todos = docsDaSeccao(docs, s);
  const lista = o.sistema ? todos.filter((d) => d.sistema === o.sistema) : todos;
  const sistemas = SISTEMAS.filter((x) => todos.some((d) => d.sistema === x.id));
  const cabeca = `<header class="tec__pag-cabeca"><p class="tec__olho">${grupoDe(sec.grupo).nome}</p><h2 class="tec__pag-titulo" id="${px}-pag-t">${sec.nome}</h2>
      <p class="tec__pag-meta">${todos.length ? `${plural(todos.length, 'documento', 'documentos')} · WorkshopData · ${esc(v.versao)} (${esc(v.motor)})` : 'WorkshopData'}</p></header>`;
  let corpo: string;
  if (o.erro === 'permissao') corpo = `<div class="tec__vazio" role="status">${L(LOCK)}<p><strong>Esta conta não tem acesso aos ${sec.nome.toLowerCase()}.</strong>O acesso a esta secção depende do contrato com o WorkshopData. Peça ao administrador da conta (F. França) para o ativar; as outras secções continuam abertas.</p>${BOTAO('Ver a visão geral', layoutGrid, 'btn--ghost btn--sm', ' data-sec="geral"')}</div>`;
  else if (!todos.length) corpo = `<div class="tec__vazio" role="status">${ic(sec.icone)}<p><strong>Não há ${sec.nome.toLowerCase()} para este veículo.</strong>O WorkshopData não tem ${s === 'boletins' ? 'boletins técnicos do fabricante' : 'notas'} para o ${esc(v.versao)} (${esc(v.motor)}). Quando houver, aparecem aqui.</p></div>`;
  else corpo = `${s === 'diagnosticos' ? avaria(px) : ''}
      ${sistemas.length > 1 ? `<div class="tec__filtro" role="group" aria-label="Sistema"><button type="button" class="tec__pilula" data-filtro="" aria-pressed="${!o.sistema}">Todos <small>${todos.length}</small></button>${sistemas.map((x) => `<button type="button" class="tec__pilula" data-filtro="${x.id}" aria-pressed="${o.sistema === x.id}">${ic(x.icone)}${x.nome} <small>${todos.filter((d) => d.sistema === x.id).length}</small></button>`).join('')}</div>` : ''}
      ${GALERIA.includes(s) ? `<ul class="tec__galeria">${lista.map((d, i) => `<li style="--i:${i}"><button type="button" class="tec__cartaz" data-doc="${d.id}">${folhaMini()}<span class="tec__cartaz-t"><b>${esc(d.titulo)}</b><small>${d.sistema ? sistemaDe(d.sistema).nome : 'Geral'} · ${d.tipo} · ${plural(d.figuras, 'figura', 'figuras')}</small></span><span class="tec__cartaz-abrir">${L(zoomIn)}Abrir</span></button></li>`).join('')}</ul>`
      : `<div class="tec__docs-cabeca" aria-hidden="true"><span></span><span>Documento</span><span>Sistema</span><span>Tipo</span><span>Figuras</span><span></span></div>
      <ul class="tec__docs">${lista.map((d, i) => linhaDoc(d, i)).join('')}</ul>`}`;
  return `<div class="tec__pagina" data-pagina="${s}">${cabeca}${corpo}</div>`;
}
/* as secções que são sobretudo imagens abrem-se em galeria, com a folha à vista */
const GALERIA: IdSeccao[] = ['eletricos', 'fusiveis', 'conforto', 'posicao'];
const LOCK = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

/** Nos Diagnósticos: procurar um código de avaria no documento do fornecedor (o significado é dele). */
function avaria(px: string): string {
  return `<form class="tec__avaria" novalidate>
      <label class="tec__avaria-r" for="${px}-avaria">Código de avaria</label>
      <span class="tec__caixa">${ic('activity')}<input class="tec__avaria-campo" id="${px}-avaria" type="text" placeholder="Por exemplo, P0401" autocomplete="off" spellcheck="false" aria-describedby="${px}-avaria-n"></span>
      <button type="submit" class="btn btn--acao btn--sm">${L(search, 'btn__icone')}<span class="btn__rotulo">Procurar no WorkshopData</span></button>
      <p class="tec__avaria-n" id="${px}-avaria-n">A descrição e os passos de diagnóstico de cada código são os do fornecedor; a Romafe não os escreve.</p>
    </form>`;
}

/** O WorkshopData: abre fora, já com o veículo. */
function seccaoWorkshop(v: VeiculoTec, o: Opcoes): string {
  const px = o.px || 'tec';
  const estado = o.carga === 'wd' ? `<p class="tec__wd-estado" role="status">${GIRA()} A ligar ao WorkshopData com a sessão da sua conta…</p>`
    : o.erro === 'wd' ? faixa('erro', 'O WorkshopData não está a responder.', 'O serviço do fornecedor está indisponível neste momento (ref. WD-504). Os documentos que já abriu aqui continuam disponíveis; tente de novo dentro de alguns minutos.', BOTAO('Tentar novamente', refreshCw, 'btn--acao btn--sm')) : '';
  return `<div class="tec__pagina" data-pagina="workshopdata">
      <header class="tec__pag-cabeca"><p class="tec__olho">Recursos</p><h2 class="tec__pag-titulo" id="${px}-pag-t">WorkshopData</h2><p class="tec__pag-meta">O portal do fornecedor dos dados técnicos</p></header>
      <section class="tec__cartao tec__wd">
        ${estado}
        <p>O WorkshopData abre numa janela nova, com a sessão da sua conta e já com este veículo: <b>${esc(nomeVeiculo(v))}</b>, motor <b class="tec__mono">${esc(v.motor)}</b>.</p>
        <p class="tec__wd-nota">Lá encontra as ferramentas do próprio fornecedor. Tudo o que está nas secções à esquerda já vem de lá.</p>
        <button type="button" class="btn btn--acao tec__wd-abrir"${o.carga === 'wd' ? ' disabled aria-busy="true"' : ''}>${L(externalLink, 'btn__icone')}<span class="btn__rotulo">${o.carga === 'wd' ? 'A abrir…' : 'Abrir o WorkshopData'}</span></button>
      </section>
    </div>`;
}

/* ---------- o leitor: os documentos da secção · o documento · os relacionados ---------- */
export function folhaMini(): string {
  return `<svg class="tec__folha-mini" viewBox="0 0 84 60" aria-hidden="true"><rect x="2" y="2" width="80" height="56" rx="2"/><path d="M58 46h22M58 50h22M58 54h14M58 44v12"/></svg>`;
}
function leitor(v: VeiculoTec, docs: Doc[], d: Doc, o: Opcoes): string {
  const px = o.px || 'tec';
  const irmaos = docsDaSeccao(docs, d.seccao);
  const meta = (t: string, dd: string) => `<div><dt>${t}</dt><dd>${dd}</dd></div>`;
  let fonte: string;
  if (o.carga === 'doc') fonte = `<div class="tec__fonte is-a-carregar" aria-busy="true"><p class="tec__fonte-estado" role="status">${GIRA()} A abrir o documento no WorkshopData…</p>${Array.from({ length: 6 }, (_, i) => `<span class="tec__esq" style="width:${[92, 80, 86, 60, 88, 70][i]}%"></span>`).join('')}<div class="tec__figs">${Array.from({ length: Math.min(d.figuras, 3) }, () => '<span class="tec__esq tec__esq--fig"></span>').join('')}</div></div>`;
  else if (o.erro === 'doc') fonte = `<div class="tec__vazio tec__vazio--erro" role="alert">${L(fileX)}<p><strong>Este documento já não existe no WorkshopData.</strong>O fornecedor retirou-o ou substituiu-o (ref. ${d.id.toUpperCase()}-404). Os outros documentos da secção continuam à esquerda.</p>${BOTAO('Voltar à lista', arrowLeft, 'btn--acao btn--sm', ' data-voltar')}</div>`;
  else fonte = `<div class="tec__fonte">
        <p class="tec__fonte-cabeca">${L(fileText)}Conteúdo do WorkshopData</p>
        <p>${d.tipo === 'Tabela' || d.tipo === 'Plano' ? 'A tabela, as unidades e as notas deste documento aparecem aqui como o fornecedor as envia.' : d.tipo === 'Esquema' ? 'O esquema aparece aqui na resolução do fornecedor, com as referências dos componentes.' : 'Os passos, as tabelas e as imagens deste procedimento aparecem aqui como o fornecedor os envia.'} O protótipo não os reproduz: nenhum valor nem passo é escrito pela Romafe.</p>
        ${d.figuras ? `<div class="tec__figs">${Array.from({ length: d.figuras }, (_, i) => `<button type="button" class="tec__fig" data-fig="${i + 1}" aria-haspopup="dialog">${o.erro === 'img' && i === 0 ? `<span class="tec__fig-nao">${L(imageOff)}Imagem indisponível</span>` : o.carga === 'img' && i === 0 ? `<span class="tec__esq tec__esq--fig"></span>` : folhaMini()}<span class="tec__fig-r">${L(zoomIn)}Figura ${i + 1}</span></button>`).join('')}</div>` : ''}
      </div>`;
  return `<div class="tec__pagina tec__leitor" data-pagina="${d.seccao}" data-doc="${d.id}">
      <aside class="tec__cap" aria-label="${seccaoDe(d.seccao).nome}">
        <p class="tec__cap-t">${ic(seccaoDe(d.seccao).icone)}${seccaoDe(d.seccao).nome}</p>
        <ul>${irmaos.map((x) => `<li><button type="button" class="tec__cap-i" data-doc="${x.id}"${x.id === d.id ? ' aria-current="true"' : ''}>${esc(x.titulo)}</button></li>`).join('')}</ul>
      </aside>
      <article class="tec__doc-aberto" aria-labelledby="${px}-doc-t">
        ${BOTAO('Voltar à lista', arrowLeft, 'btn--acao btn--sm tec__voltar', ' data-voltar')}
        <p class="tec__olho">${grupoDe(seccaoDe(d.seccao).grupo).nome} · ${seccaoDe(d.seccao).nome}</p>
        <h2 class="tec__pag-titulo" id="${px}-doc-t">${esc(d.titulo)}</h2>
        <dl class="tec__meta">${meta('Sistema', d.sistema ? sistemaDe(d.sistema).nome : 'Geral')}${meta('Tipo', d.tipo)}${meta('Aplica-se a', `${esc(nomeVeiculo(v))} · <span class="tec__mono">${esc(v.motor)}</span>`)}${meta('Fornecedor', 'WorkshopData')}</dl>
        ${fonte}
        ${irmaos.length > 1 ? (() => { const i = irmaos.findIndex((x) => x.id === d.id), ant = irmaos[i - 1], seg = irmaos[i + 1];
          return `<nav class="tec__passa" aria-label="Outros documentos de ${seccaoDe(d.seccao).nome.toLowerCase()}">${ant ? `<button type="button" class="tec__passa-b" data-doc="${ant.id}">${L(chevronLeft)}<span><small>Anterior</small>${esc(ant.titulo)}</span></button>` : '<span></span>'}${seg ? `<button type="button" class="tec__passa-b tec__passa-b--seg" data-doc="${seg.id}"><span><small>Seguinte</small>${esc(seg.titulo)}</span>${L(chevronRight)}</button>` : ''}</nav>`; })() : ''}
      </article>
    </div>`;
}

/* ---------- o visor das figuras ---------- */
export function visorCorpo(v: VeiculoTec, d: Doc, fig: number, o: Opcoes = {}): string {
  const px = o.px || 'tec';
  const folha = o.carga === 'img' ? `<div class="tec__visor-estado" role="status">${GIRA('tec__rs tec__rs--grande')}<p>A carregar a figura na resolução original…</p></div>`
    : o.erro === 'img' ? `<div class="tec__visor-estado" role="alert">${L(imageOff)}<p><strong>A imagem não está disponível.</strong>O WorkshopData não enviou a figura ${fig} (ref. IMG-${d.id.toUpperCase()}-${fig}). O texto do documento continua no leitor.</p>${BOTAO('Tentar novamente', refreshCw, 'btn--acao btn--sm')}</div>`
    : `<div class="tec__visor-folha" style="transform:translate(0px,0px) scale(1)">
        <svg viewBox="0 0 420 297" aria-hidden="true"><rect class="tec__f-moldura" x="8" y="8" width="404" height="281"/><rect class="tec__f-moldura" x="14" y="14" width="392" height="269"/>
          <path class="tec__f-grelha" d="${Array.from({ length: 13 }, (_, i) => `M${14 + i * 30.15} 14v269`).join('')}${Array.from({ length: 9 }, (_, i) => `M14 ${14 + i * 33.6}h392`).join('')}"/>
          <rect class="tec__f-quadro" x="276" y="243" width="130" height="40"/><path class="tec__f-moldura" d="M276 257h130M276 270h130M340 243v40"/>
          <text x="282" y="253">WorkshopData</text><text x="346" y="253">Fig. ${fig} de ${d.figuras}</text><text x="282" y="266">${esc(v.motor)}</text><text x="282" y="279">${esc(d.tipo)}</text>
        </svg>
        <p class="tec__visor-nota">${L(image)}<span><b>${esc(d.titulo)}</b>A imagem do WorkshopData aparece aqui na resolução original. As referências e as legendas continuam legíveis com o zoom.</span></p>
      </div>`;
  return `<header class="tec__visor-barra">
      <div class="tec__visor-t"><p class="tec__olho">${seccaoDe(d.seccao).nome} · Figura ${fig} de ${d.figuras}</p><h2 id="${px}-visor-t">${esc(d.titulo)}</h2></div>
      <div class="tec__visor-ctl" role="group" aria-label="Figura">
        <button type="button" class="tec__ctl" data-fig-ir="-1" aria-label="Figura anterior"${fig <= 1 ? ' disabled' : ''}>${L(chevronLeft)}</button>
        <span class="tec__ctl-n">${fig} / ${d.figuras}</span>
        <button type="button" class="tec__ctl" data-fig-ir="1" aria-label="Figura seguinte"${fig >= d.figuras ? ' disabled' : ''}>${L(chevronRight)}</button>
      </div>
      <div class="tec__visor-ctl" role="group" aria-label="Zoom">
        <button type="button" class="tec__ctl" data-zoom="-1" aria-label="Afastar">${L(zoomOut)}</button>
        <output class="tec__ctl-n tec__zoom-n" aria-live="polite">100%</output>
        <button type="button" class="tec__ctl" data-zoom="1" aria-label="Aproximar">${L(zoomIn)}</button>
        <button type="button" class="btn btn--ghost btn--sm" data-zoom="0">${L(scan, 'btn__icone')}<span class="btn__rotulo">Ajustar</span></button>
        <button type="button" class="btn btn--ghost btn--sm tec__inteiro" data-inteiro>${L(maximize, 'btn__icone')}<span class="btn__rotulo">Ecrã inteiro</span></button>
      </div>
      <button type="button" class="btn btn--acao btn--sm tec__visor-fechar" data-fechar-visor>${L(x, 'btn__icone')}<span class="btn__rotulo">Fechar</span></button>
    </header>
    <div class="tec__visor-palco" tabindex="0" aria-label="Figura: arraste para mover, roda do rato ou + e − para o zoom">${folha}</div>
    ${d.figuras > 1 ? `<div class="tec__visor-tira" role="group" aria-label="Figuras do documento">${Array.from({ length: d.figuras }, (_, i) => `<button type="button" class="tec__tira-b" data-fig-n="${i + 1}"${i + 1 === fig ? ' aria-current="true"' : ''}>${folhaMini()}<span>Figura ${i + 1}</span></button>`).join('')}</div>` : ''}`;
}

/* ---------- o espaço de trabalho ---------- */
export function conteudo(v: VeiculoTec, o: Opcoes): string {
  const docs = docsDe(v);
  const s = o.seccao || 'geral';
  const d = o.doc ? docs.find((x) => x.id === o.doc) : undefined;
  if (o.carga === 'categorias') return `<div class="tec__pagina" aria-busy="true"><header class="tec__pag-cabeca"><p class="tec__olho">Visão geral</p><h2 class="tec__pag-titulo">${esc(nomeVeiculo(v))}</h2><p class="tec__pag-meta" role="status">${GIRA()} A carregar as categorias técnicas do WorkshopData…</p></header>
      <section class="tec__cartao"><div class="tec__expl-esq"><span class="tec__esq tec__esq--carro"></span><div>${Array.from({ length: 6 }, () => '<span class="tec__esq" style="height:34px"></span>').join('')}</div></div></section></div>`;
  if (!docs.length && s !== 'veiculo' && s !== 'workshopdata') return `<div class="tec__pagina"><header class="tec__pag-cabeca"><p class="tec__olho">Visão geral</p><h2 class="tec__pag-titulo">${esc(nomeVeiculo(v))}</h2></header>
      <div class="tec__vazio" role="status">${L(fileX)}<p><strong>Não existem dados técnicos disponíveis para este veículo.</strong>O WorkshopData ainda não publicou documentação para o ${esc(v.versao)} (${esc(v.motor)}), de ${desdeDe(v)}. Os dados do veículo continuam em «Veículo»; as peças, no Catálogo.</p>
      <div class="tec__vazio-botoes">${BOTAO('Ver os dados do veículo', carFront, 'btn--ghost btn--sm', ' data-sec="veiculo"')}${BOTAO('Ver as peças no Catálogo', pkg, 'btn--acao btn--sm', ' data-ir="catalogo"')}</div></div></div>`;
  if (d) return leitor(v, docs, d, o);
  if (s === 'geral') return visaoGeral(v, docs, o);
  if (s === 'veiculo') return seccaoVeiculo(v, o);
  if (s === 'workshopdata') return seccaoWorkshop(v, o);
  return seccaoDocs(v, docs, s, o);
}

export function trabalho(v: VeiculoTec, o: Opcoes): string {
  const docs = docsDe(v);
  const s = o.doc ? docs.find((x) => x.id === o.doc)?.seccao || 'geral' : o.seccao || 'geral';
  return `<div class="tec__trabalho${o.esbatido ? ' is-esbatido' : ''}${navCompacta(o) ? ' nav-compacta' : ''}${ladoAberto(o) ? '' : ' sem-lado'}">
      ${navegacao(v, docs, s, o)}
      <div class="tec__conteudo" data-atual="${s}">${o.aviso || ''}${conteudo(v, o)}</div>
      <aside class="tec__lado" aria-label="Contexto"${o.carga === 'categorias' ? ' aria-busy="true"' : ''}>${lado(v, o)}</aside>
    </div>`;
}

/** O ecrã: sem veículo, a escolha; com veículo, o espaço de trabalho dele. */
export function tecnicaV1(o: Opcoes = {}): string {
  const px = o.px || 'tec';
  const v = o.veiculo ? veiculoDe(o.veiculo) : undefined;
  const d = v && o.doc && o.fig ? docsDe(v).find((x) => x.id === o.doc) : undefined;
  return `<div class="portal portal--v3 portal--v22 portal--noite portal--tec">
  <main class="tec" data-tecnica data-px="${px}"${v ? ` data-veiculo="${esc(v.chave)}"` : ''}>
    <header class="tec__cabeca">
      <h1 class="tec__titulo">Informações técnicas</h1>
      <p class="tec__sub">Dados técnicos, manutenção, reparação e diagnóstico do veículo, do WorkshopData.</p>
    </header>
    ${contexto(v, o)}
    ${v ? trabalho(v, o) : escolher(o)}
    <div class="tec__veu"${d ? '' : ' hidden'}></div>
    <div class="tec__visor" role="dialog" aria-modal="true" aria-labelledby="${px}-visor-t"${d ? '' : ' hidden'}>${d && v ? visorCorpo(v, d, o.fig!, o) : ''}</div>
  </main>
</div>`;
}
export { EXEMPLO, veiculoDe, docsDe };
