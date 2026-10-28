/* =========================================================
   PICK — o Gestor faz tudo (28 out. 2026)
   Ela: «para já só tenho de fazer o armazém e vamos começar pelo gestor que pode fazer tudo», e depois o briefing
   «ROMAFE Warehouse — Gestor V1 · Four Warehouse Operations · One Manager». No Figma primeiro; o Kotlin depois.
   O Gestor acompanha E executa as quatro operações — Inventário, Arrumação, Separação, Expedição — sem mudar de função:
     - 60 · Início v4: o que pede atenção e as quatro operações (o cartão abre o módulo; o Executar está lá dentro);
     - a barra: Início · Tarefas · Ler (ao centro) · Operações · Mais (navegacao.ts); sai nos ecrãs de leitura;
     - cada módulo com «Acompanhar | Executar» no topo, em vez de dois botões em cada cartão;
     - o Gestor conta no MESMO 43 · Ler e contar e arruma no MESMO 80 · Arrumar que o operador usa (só a conta muda);
     - Separação (90–92) e Expedição (95–96) de raiz, com as regras decididas: uma tarefa é uma guia (24 set.); a falta
       corrige-se na posição (21 out.); a expedição levanta as guias na prateleira de preparados (16 set.).
   O que fica de fora de propósito, e porquê: escolher o armazém (só há o 60), sincronização (a Pick não trabalha sem
   rede), mapa (é da v2), transportadora, viatura, rota e prova de entrega (ninguém os pediu ao processo real).
   28 out. (ela): a prateleira de preparados é uma posição de 8 algarismos, como as outras (a 60400101 é de exemplo); as
   guias têm o formato GS + 8 algarismos (GS13454212); a linha em falta não prende a guia — segue com o que se tirou, e
   o ERP vê a falta; o Gestor não valida a contagem que ele próprio fez — fecha-a outro gestor. Os clientes são de exemplo.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { ecra, acao, sec, esperar, aviso, nota, prog, posicao, quantidade, h2, leitor, L, type Opcoes } from './inventario-v2';
import { INVENTARIOS } from './gestor';
import { inventarioV2 } from './gestor-v2';
import { GUIAS, RESUMO_ARRUMACAO, arrumacaoInicio, arrumar } from './arrumacao';
import { lerContar, type Contagem } from './inventario-completo';
import { barra } from './navegacao';
import { carregar as eCarregar, semRede as eSemRede, servidor as eServidor, vazio as eVazio } from './inventario-estados';
import { CAIXA } from './cena';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import pkgOpen from 'lucide-static/icons/package-open.svg?raw';
import pkgX from 'lucide-static/icons/package-x.svg?raw';
import pkgCheck from 'lucide-static/icons/package-check.svg?raw';
import basket from 'lucide-static/icons/shopping-basket.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import triangle from 'lucide-static/icons/triangle-alert.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import userPlus from 'lucide-static/icons/user-plus.svg?raw';
import userRound from 'lucide-static/icons/user-round.svg?raw';
import shieldCheck from 'lucide-static/icons/shield-check.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import radio from 'lucide-static/icons/radio.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import keyboard from 'lucide-static/icons/keyboard.svg?raw';
import repeat from 'lucide-static/icons/repeat.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import logOut from 'lucide-static/icons/log-out.svg?raw';
import lifeBuoy from 'lucide-static/icons/life-buoy.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import minus from 'lucide-static/icons/minus.svg?raw';

/* =========================================================
   Os dados de exemplo da Separação e da Expedição (uma guia = uma tarefa)
   ========================================================= */
export type EstSep = 'separar' | 'curso' | 'falta' | 'feita';
export interface LinhaS { pos: string; ref: string; desc: string; q: number; tirada?: number }
export interface GuiaS { ref: string; cli: string; quem: string; est: EstSep; linhas: LinhaS[]; feitas: number; hora?: string; falta?: string }
const L1187: LinhaS[] = [
  { pos: '60100305', ref: 'SKF 6205-2Z', desc: 'Rolamento rígido de esferas', q: 6 },
  { pos: '60100802', ref: 'SKF VKMV 6PK1873', desc: 'Correia poli-V', q: 2 },
  { pos: '60120401', ref: 'CR 30x47x7', desc: 'Retentor de cambota', q: 4 },
  { pos: '60210302', ref: 'NGK BKR6E', desc: 'Vela de ignição', q: 8 },
];
export const SEP: GuiaS[] = [
  { ref: 'GS13454212', cli: 'Auto Reparadora Silva', quem: '', est: 'separar', feitas: 0, linhas: L1187 },
  { ref: 'GS13454211', cli: 'Garagem Central de Braga', quem: 'Tiago Lopes', est: 'curso', feitas: 2, linhas: [{ pos: '60100802', ref: 'SKF 6204-2RSH', desc: 'Rolamento rígido de esferas', q: 10 }, { pos: '60120401', ref: 'CR 35x52x7', desc: 'Retentor de cambota', q: 2 }, { pos: '60210302', ref: 'NGK BKR6E', desc: 'Vela de ignição', q: 4 }] },
  { ref: 'GS13454210', cli: 'Oficina Moreira & Filhos', quem: 'Tiago Lopes', est: 'falta', feitas: 2, falta: 'P 85 020 na 60210305: a guia pede 4, havia 2', linhas: [{ pos: '60101203', ref: 'SKF VKBA 6556', desc: 'Kit de rolamento de roda', q: 2 }, { pos: '60210305', ref: 'P 85 020', desc: 'Pastilhas de travão', q: 4, tirada: 2 }] },
  { ref: 'GS13454209', cli: 'Pneus e Travões do Minho', quem: 'Tiago Lopes', est: 'feita', feitas: 3, hora: '09:40', linhas: [{ pos: '60100305', ref: 'SKF 6205-2Z', desc: 'Rolamento rígido de esferas', q: 4 }, { pos: '60101203', ref: 'SKF VKBA 6556', desc: 'Kit de rolamento de roda', q: 2 }, { pos: '60210302', ref: 'NGK BKR6E', desc: 'Vela de ignição', q: 4 }] },
];
export type EstExp = 'pronta' | 'expedicao' | 'expedida' | 'excecao';
export interface GuiaE { ref: string; cli: string; est: EstExp; linhas: number; desde: string; quem: string; nota?: string }
export const EXP: GuiaE[] = [
  { ref: 'GS13454209', cli: 'Pneus e Travões do Minho', est: 'pronta', linhas: 3, desde: '09:40', quem: 'Separada por Tiago Lopes' },
  { ref: 'GS13454208', cli: 'Auto Peças Viana', est: 'pronta', linhas: 5, desde: '09:12', quem: 'Separada por Tiago Lopes', nota: '1 linha com falta, registada na posição' },
  { ref: 'GS13454207', cli: 'Garagem Central de Braga', est: 'expedicao', linhas: 2, desde: '10:05', quem: 'Recolhida por Paulo Reis' },
  { ref: 'GS13454206', cli: 'Oficina Moreira & Filhos', est: 'excecao', linhas: 3, desde: '09:55', quem: 'Paulo Reis', nota: 'Não está na prateleira de preparados' },
  { ref: 'GS13454205', cli: 'Auto Reparadora Silva', est: 'expedida', linhas: 4, desde: '08:30', quem: 'Expedida por Paulo Reis' },
];
/** A posição da prateleira de preparados (28 out., ela: «sim», é uma posição de 8 algarismos; esta é de exemplo). */
const PREP = '60400101';
const conta = <T extends { est: string }>(xs: T[], k: string) => xs.filter((x) => x.est === k).length;
const un = (g: GuiaS) => g.linhas.reduce((s, l) => s + l.q, 0);

/* =========================================================
   Peças
   ========================================================= */
const G = (titulo: string, o: Opcoes = {}): Opcoes => ({ titulo, gestor: true, funcao: 'Gestor', ...o });
const comBarra = (titulo: string, ativo = 'inventario', o: Opcoes = {}): Opcoes => G(titulo, { barra: barra('gestor', ativo), ...o });
const faixa = (xs: [string, number, ('aviso' | 'erro' | 'ok' | '')?][]) => `<dl class="gi-faixa gx-faixa">${xs.map(([t, n, tom]) => `<div${tom ? ` class="is-${tom}"` : ''}><dd>${n}</dd><dt>${t}</dt></div>`).join('')}</dl>`;
/** «Acompanhar | Executar»: um interruptor no topo de cada módulo, em vez de dois botões em cada cartão. */
export type Modulo = 'inv' | 'arr' | 'sep' | 'exp';
const MODO: Record<Modulo, [string, string]> = { inv: ['gestor-inventario', 'g-inv-exec'], arr: ['arr-inicio', 'g-arr-exec'], sep: ['g-sep-acomp', 'g-sep'], exp: ['g-exp-acomp', 'g-exp'] };
const modo = (m: Modulo, exec: boolean) => `<nav class="gx-modo" aria-label="Modo"><button type="button" data-ir="${MODO[m][0]}"${exec ? '' : ' aria-current="page"'}>${L(eye)}<span>Acompanhar</span></button><button type="button" data-ir="${MODO[m][1]}"${exec ? ' aria-current="page"' : ''}>${L(play)}<span>Executar</span></button></nav>`;
const linhaArt = (ref: string, desc: string, q: string, extra = '') => `<li class="gi-linha${extra}"><div><b>${ref}</b><span>${desc}</span></div><div class="gi-linha__q"><b>${q}</b></div></li>`;
const faixaLer = (tom: 'pronto' | 'lido' | 'ok' | 'erro' | 'aviso', ic: string, t: string, x: string, ir = '', tipo = '') => `<button type="button" class="gi-faixa-ler gi-faixa-ler--${tom}" data-ler="1" data-tipo-leitura="${tipo}"${ir ? ` data-depois="${ir}"` : ''}><span class="gi-faixa-ler__ic">${L(ic)}</span><span><b>${t}</b><small>${x}</small></span>${tom === 'pronto' ? '<i class="gi-faixa-ler__varre" aria-hidden="true"></i>' : ''}</button>`;
const passosDe = (nomes: string[], n: number, rot: string) => `<ol class="gi-passos" aria-label="${rot}">${nomes.map((p, i) => `<li class="${i < n ? 'is-feito' : i === n ? 'is-atual' : ''}"${i === n ? ' aria-current="step"' : ''}><i aria-hidden="true"></i><span>${p}</span></li>`).join('')}</ol>`;
const tarefaCartao = (ic: string, t: string, x: string, b: string, bic: string, ir: string, i: number, extra = '') => `<li style="--i:${i}"><div class="gx-exec"><span class="gx-exec__ic">${L(ic)}</span><div><b>${t}</b><small>${x}</small>${extra}</div><button type="button" class="gp-btn gp-btn--acao" data-ir="${ir}">${L(bic)}<span>${b}</span></button></div></li>`;

/* ---------- as cenas (uma vez; com «reduzir movimento», paradas no fim) ---------- */
/** Separação: o artigo sai da prateleira e cai na caixa da guia. */
const cenaSeparacao = () => `<svg class="gi-cena gx-cena-sep" viewBox="0 0 120 56" fill="none" aria-hidden="true" focusable="false">
    <path class="gi-cena__chao" d="M4 50h112"/><path class="gi-cena__estante" d="M8 50V8M44 50V8M8 22h36M8 36h36M8 50h36"/>
    <path class="gi-cena__seta" d="M50 24c14-8 26-4 36 8"/>
    <g class="gx-cena__caixa"><path d="M80 34h28l-3 16H83z"/><path d="M80 34l5-5h18l5 5"/></g>
    <rect class="gx-cena__item" x="22" y="12" width="10" height="8" rx="1.5"/>
  </svg>`;
/** Expedição: a guia preparada sai da prateleira de preparados para o cais. */
const cenaExpedicao = () => `<svg class="gi-cena gx-cena-exp" viewBox="0 0 120 56" fill="none" aria-hidden="true" focusable="false">
    <path class="gi-cena__chao" d="M4 50h112"/><path class="gi-cena__estante" d="M8 50V14M38 50V14M8 30h30M8 50h30"/>
    <path class="gx-cena__porta" d="M92 50V10h24v40"/><path class="gi-cena__seta" d="M44 40h40"/>
    <g class="gx-cena__guia"><rect x="13" y="34" width="20" height="14" rx="1.5"/><path d="M17 39h12M17 43h8"/></g>
  </svg>`;

/* =========================================================
   60 · Início do Gestor v4: atenção + as quatro operações
   ========================================================= */
export const ATENCAO: [string, string, string, string, 'erro' | 'aviso' | 'info'][] = [
  [shieldCheck, 'INV-2026-011 por validar', '16 posições · 2 divergências', 'gestor-validar', 'aviso'],
  [pkgX, 'Falta na GS13454210', 'P 85 020 · havia 2 de 4 na 60210305', 'g-sep-guia-falta', 'erro'],
  [lock, 'Destino em contagem', 'GA-2026-0329 → 60300104 · zona 30 às cegas', 'arr-guia-bloqueada', 'erro'],
];
export const MODULOS: [Modulo, string, string, string, string][] = [
  ['inv', 'Inventário', 'gestor-inventario', 'Contar e validar', '1 por validar'],
  ['arr', 'Arrumação', 'arr-inicio', 'Localizar e arrumar', `${RESUMO_ARRUMACAO.porArrumar} por arrumar`],
  ['sep', 'Separação', 'g-sep-acomp', 'Preparar guias', `${conta(SEP, 'separar')} por separar`],
  ['exp', 'Expedição', 'g-exp-acomp', 'Confirmar saídas', `${conta(EXP, 'pronta')} prontas`],
];
export const ICONE_MOD: Record<Modulo, string> = { inv: scanBarcode, arr: pkgOpen, sep: basket, exp: truck };
const modCartao = ([k, t, ir, x, n]: typeof MODULOS[number], i: number) => `<li style="--i:${i}"><button type="button" class="gx-mod gx-mod--${k}" data-ir="${ir}" aria-label="Abrir ${t}: ${n}">
    <span class="gi-mod__ic">${k === 'inv' ? CAIXA() : L(ICONE_MOD[k])}</span><b>${t}</b><small>${x}</small><em>${n}</em></button></li>`;
export function inicioV4(cen: 'normal' | 'sem-atencao' = 'normal', b = barra('gestor', 'inicio')): string {
  const at = cen === 'sem-atencao' ? [] : ATENCAO;
  return ecra(`<div class="gp-ola gi-ola-peq"><h1><span data-gp-saudacao>Bom dia</span>, Ana</h1></div>
    <section class="gp-sec">${h2('Precisa da tua atenção', at.length || undefined)}
      ${at.length ? `<ul class="gp-lista" role="list">${at.map(([ic, t, x, ir, tom], i) => `<li style="--i:${i}"><button type="button" class="gp-item gp-item--${tom}" data-ir="${ir}"><span class="gp-item-ic">${L(ic)}</span><span class="gp-item-t"><b>${t}</b><small>${x}</small></span>${L(arrowRight, 'gi-seta')}</button></li>`).join('')}</ul>`
      : `<p class="gp-vazio">${L(check)}Nada pede a tua atenção agora.</p>`}
    </section>
    <section class="gp-sec">${h2('Operações')}<ul class="gx-mods" role="list">${MODULOS.map(modCartao).join('')}</ul></section>`,
  { titulo: 'Início', gestor: true, barra: b });
}

/* =========================================================
   69 · Operações: os quatro módulos, cada um com Acompanhar e Executar
   ========================================================= */
function operacoes(): string {
  const F: Record<Modulo, [string, number, ('aviso' | 'erro' | '')?][]> = {
    inv: [['Em curso', 1], ['Por validar', 1, 'aviso'], ['Divergências', 2, 'erro']],
    arr: [['Por arrumar', RESUMO_ARRUMACAO.porArrumar], ['Em curso', RESUMO_ARRUMACAO.emCurso], ['Problemas', RESUMO_ARRUMACAO.problemas, 'erro']],
    sep: [['Por separar', conta(SEP, 'separar')], ['Em separação', conta(SEP, 'curso')], ['Com faltas', conta(SEP, 'falta'), 'erro']],
    exp: [['Prontas', conta(EXP, 'pronta')], ['Em expedição', conta(EXP, 'expedicao')], ['Exceções', conta(EXP, 'excecao'), 'erro']],
  };
  return ecra(`<h1 class="gp-titulo">Operações</h1>
    <ul class="gx-ops" role="list">${MODULOS.map(([k, t, , x], i) => `<li style="--i:${i}"><section class="gx-op gx-op--${k}" aria-labelledby="gx-op-${k}">
      <header><span class="gx-op__ic">${L(ICONE_MOD[k])}</span><span><h2 id="gx-op-${k}">${t}</h2><small>${x}</small></span></header>
      ${faixa(F[k])}
      <div class="gx-op__b"><button type="button" class="gp-btn gi-btn-sec" data-ir="${MODO[k][0]}">${L(eye)}<span>Acompanhar</span></button><button type="button" class="gp-btn gp-btn--acao" data-ir="${MODO[k][1]}">${L(play)}<span>Executar</span></button></div>
    </section></li>`).join('')}</ul>`, comBarra('Operações', 'operacoes', { voltar: 'g-mais' }));
}

/* =========================================================
   Os módulos que já existiam, com o interruptor no topo
   ========================================================= */
/* o cartão do Início passa a título do módulo (View Transitions: o mesmo nome nos dois ecrãs) */
export const comModo = (html: string, m: Modulo, titulo: string) => html.replace(new RegExp(`<h1 class="gp-titulo">${titulo}</h1>((?:</div>)?)`), `<h1 class="gp-titulo gx-vt-${m}">${titulo}</h1>$1${modo(m, false)}`);
export const inventarioV4 = () => comModo(inventarioV2(barra('gestor', 'inventario')), 'inv', 'Inventário');
export const arrumacaoV3 = () => comModo(arrumacaoInicio('normal', barra('gestor', 'arrumacao')), 'arr', 'Arrumação');

/* =========================================================
   76 · Contar (Gestor): o mesmo 43 · Ler e contar do operador
   ========================================================= */
const C15: Contagem = { inv: 'INV-2026-015', linha: 'Zona 10 · às cegas · 0 de 30 posições', pos: '60100305', ambito: 'zona 10, rolamentos' };
const IDS_CONTAR: Record<string, string> = { 'inv-ler-lido': 'g-inv-lido', 'inv-ler-registado': 'g-inv-registado', 'inv-fim-posicao': 'g-inv-fim', 'inv-posicao': 'g-inv-pos', 'inv-ler': 'g-inv-ler', 'op-inicio': 'g-inv-exec', 'inv-corrigir': 'g-inv-ler' };
const contar = (e: Parameters<typeof lerContar>[0]) => lerContar(e, G('Ler e contar', { voltar: 'g-inv-exec' }), IDS_CONTAR, C15);
type E76 = 'lista' | 'ficou' | 'pos' | 'fim' | 'submeter' | 'a-submeter' | 'submetida';
function contarGestor(e: E76 = 'lista'): string {
  if (e === 'lista') return ecra(`<h1 class="gp-titulo">Inventário</h1>${modo('inv', true)}
    <section class="gp-sec">${h2('Contagens que pode fazer', 2)}<ul class="gp-lista" role="list">
      ${tarefaCartao(pkg, 'INV-2026-015 · zona 10', 'Cíclica · rolamentos · 30 posições · às cegas · sem quem conte', 'Contar eu', play, 'g-inv-ficou', 0)}
      ${tarefaCartao(pkg, 'INV-2026-014 · colunas 13–24', 'Zona 30 · às cegas · a Joana conta as colunas 01–12', 'Atribuir', userPlus, 'gestor-atribuir', 1)}
    </ul></section>
    ${''}`, comBarra('Inventário'));
  if (e === 'ficou') return ecra(`${aviso('ok', userRound, 'A INV-2026-015 ficou consigo', 'O servidor atribuiu-lhe as 30 posições da zona 10. Comece pela primeira: a Pick diz qual é.')}
    <dl class="gi-revisao"><div><dt>Âmbito</dt><dd>Zona 10 · rolamentos · 30 posições</dd></div><div><dt>Regras</dt><dd>Às cegas · uma contagem · recontar divergências</dd></div><div><dt>Começa em</dt><dd>${posicao('60100305', 'gi-pos--peq')}</dd></div></dl>`,
  G('Contar', { voltar: 'g-inv-exec', pe: acao('Começar a contagem', play, ' data-ir="g-inv-pos"') }));
  if (e === 'pos') return ecra(`<p class="gi-ler-inv"><b>INV-2026-015</b><span>Zona 10 · às cegas · 0 de 30 posições</span></p>
    ${leitor({ titulo: 'Leia a posição', texto: 'A etiqueta da prateleira onde vai contar. Comece na 60100305.', codigo: '60100305', tipo: 'posicao', ir: 'g-inv-ler' })}
    <div class="gi-ler-pos">${L(mapPin)}<span class="gi-mini-r">A seguir</span>${posicao('60100305', 'gi-pos--peq')}</div>`,
  G('Ler a posição', { voltar: 'g-inv-exec', pe: sec('Escrever à mão', keyboard) }));
  if (e === 'fim') return ecra(`${aviso('ok', circleCheck, 'Posição 60100305 contada', '3 artigos registados. O servidor tem tudo; nada fica no PDA.')}
    ${prog(1, 30)}
    <ul class="gi-linhas" role="list">${linhaArt('SKF VKBA 6556', 'Kit de rolamento de roda', '4 un.')}${linhaArt('SKF 6205-2Z', 'Rolamento rígido de esferas', '36 un.')}${linhaArt('SKF 6206-2Z', 'Rolamento rígido de esferas', '12 un.')}</ul>`,
  G('Posição contada', { pe: `${acao('Ler a posição seguinte', mapPin, ' data-ir="g-inv-pos"')}${sec('Submeter a contagem', send, ' data-ir="g-inv-submeter"')}` }));
  if (e === 'submetida') return ecra(`${aviso('ok', send, 'INV-2026-015 submetido', 'O servidor recebeu as 30 posições. Como foi a Ana a contar, valida e fecha outro gestor: quem conta não decide as divergências da própria contagem.')}`,
  G('Submetido', { pe: `${acao('Voltar ao Inventário', arrowLeft, ' data-ir="gestor-inventario"')}${sec('Ver a validação', shieldCheck, ' data-ir="g-inv-validar-propria"')}` }));
  return ecra(`<h1 class="gp-titulo">Submeter a contagem</h1>
    <dl class="gi-resumo"><div><dt>Posições</dt><dd>30</dd></div><div><dt>Contadas</dt><dd>30</dd></div><div><dt>Escritas à mão</dt><dd>0</dd></div><div><dt>Correções</dt><dd>1</dd></div></dl>
    ${nota('Depois de submeter já não se conta nem se corrige; uma recontagem volta como tarefa nova.')}`,
  G('Submeter', { voltar: 'g-inv-fim', pe: e === 'a-submeter' ? esperar('A submeter…') : acao('Submeter a contagem', send, ' data-confirmar data-ir="g-inv-submetida"') }));
}

/** 63.5 · A contagem é sua: o Gestor vê, mas não decide nem fecha (28 out., ela: «o que achares melhor»). */
function validarPropria(): string {
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">Validar INV-2026-015</h1><span class="gp-tag gp-tag--validar">Por validar</span></div>
    <p class="gp-nota">Cíclica · zona 10 · rolamentos · submetido por Ana Ferreira hoje</p>
    ${aviso('info', lock, 'Esta contagem é sua', 'Foi a Ana a contar a zona 10. As divergências e o fecho são de outro gestor (o Luís Costa, de turno): quem conta não aceita as próprias diferenças nem ajusta o stock com elas.')}
    <dl class="gi-resumo"><div><dt>Posições</dt><dd>30</dd></div><div><dt>Sem diferença</dt><dd>28</dd></div><div class="is-aviso"><dt>Divergências</dt><dd>2</dd></div><div><dt>Por decidir</dt><dd>2</dd></div></dl>`,
  G('Validar', { voltar: 'gestor-inventario', pe: `<button type="button" class="gp-btn gp-btn--acao gp-btn--grande" disabled aria-describedby="gx-propria">${L(lock)}<span>Fechar o inventário</span></button><p class="gi-porque" id="gx-propria">Fecha outro gestor: a contagem é sua.</p>` }));
}

/* =========================================================
   81 · Arrumar (Gestor): o mesmo 80 · Arrumar do operador
   ========================================================= */
const GI_ARR = GUIAS.findIndex((g) => g.ref === 'GA-2026-0332');
const IDS_ARR: Record<string, string> = { 'arr-op-artigo': 'g-arr-artigo', 'arr-op-destino': 'g-arr-destino', 'arr-op-quantidade': 'g-arr-qtd', 'arr-op-confirmado': 'g-arr-ok', 'arr-op-parcial': 'g-arr-destino', 'op-inicio': 'g-arr-exec' };
const arrumarG = (e: Parameters<typeof arrumar>[0]) => arrumar(e, G('Arrumar', { voltar: 'g-arr-exec', quem: undefined }), IDS_ARR, GI_ARR, 0);
function arrumarGestor(): string {
  const g = GUIAS[GI_ARR];
  return ecra(`<h1 class="gp-titulo">Arrumação</h1>${modo('arr', true)}
    <section class="gp-sec">${h2('Guias que pode arrumar', 2)}<ul class="gp-lista" role="list">
      ${tarefaCartao(pkgOpen, g.ref, `${g.linhas[0].ref} · ${g.linhas[0].q} un. · ${g.origem} → ${g.destino}`, 'Arrumar eu', play, 'g-arr-op', 0)}
      ${tarefaCartao(pkgOpen, 'GA-2026-0331', '2 paletes · 3 artigos · cais 1 → 60101203 · ninguém livre', 'Arrumar eu', play, 'arr-guia', 1)}
    </ul></section>
    ${''}`, comBarra('Arrumação'));
}

/* =========================================================
   90 · Separação (acompanhar) · 91 · Guia de separação · 92 · Separar (executar)
   ========================================================= */
const TAG_S: Record<EstSep, [string, string]> = { separar: ['Por separar', 'planeada'], curso: ['Em separação', 'curso'], falta: ['Com falta', 'erro'], feita: ['Concluída', 'ok'] };
function cartaoS(g: GuiaS, i: number, aberta: boolean): string {
  const [t, k] = TAG_S[g.est];
  const [b, bic, ir] = g.est === 'separar' ? ['Abrir a guia', list, 'g-sep-guia'] : g.est === 'curso' ? ['Acompanhar', list, 'g-sep-guia-curso'] : g.est === 'falta' ? ['Ver a falta', triangle, 'g-sep-guia-falta'] : ['', '', ''];
  return `<li style="--i:${i}"><details class="gi-exp gi-guia gx-guia--${g.est}"${aberta ? ' open' : ''}><summary class="gi-exp__s">
    <span class="gi-exp__topo"><b>${g.ref}</b><span class="gp-tag gp-tag--${k}">${t}</span></span>
    <small>${g.cli} · ${g.linhas.length} linhas · ${un(g)} un.</small>
    ${g.est === 'curso' || g.est === 'falta' ? prog(g.feitas, g.linhas.length, 'Linhas separadas') : ''}
    ${g.falta ? `<p class="gi-guia__mot">${L(pkgX)}${g.falta}</p>` : ''}
    <span class="gi-exp__quem">${L(userRound)}${g.quem || 'Sem pessoa'}${g.hora ? ` · nos preparados às ${g.hora}` : ''}${L(chevronDown, 'gi-exp__seta')}</span></summary>
    <div class="gi-exp__c"><ul class="gi-linhas" role="list">${g.linhas.map((l) => `<li class="gi-linha"><div><b>${l.ref}</b><span>${l.desc} · ${l.pos}</span></div><div class="gi-linha__q"><b>${l.tirada !== undefined ? `${l.tirada} de ${l.q}` : `${l.q} un.`}</b></div></li>`).join('')}</ul>
      ${b ? `<button type="button" class="gp-btn ${g.est === 'curso' ? 'gp-btn--sec' : 'gp-btn--acao'}" data-ir="${ir}">${L(bic)}<span>${b}</span></button>` : ''}</div></details></li>`;
}
const GRUPOS_S: [EstSep, string][] = [['separar', 'Por separar'], ['curso', 'Em separação'], ['falta', 'Com faltas'], ['feita', 'Concluídas']];
function separacaoAcomp(o: { sel?: EstSep; vazio?: boolean } = {}): string {
  const sel = o.sel ?? 'separar';
  return ecra(`<h1 class="gp-titulo gx-vt-sep">Separação</h1>${modo('sep', false)}
    ${faixa([['Por separar', conta(SEP, 'separar')], ['Em separação', conta(SEP, 'curso')], ['Com faltas', conta(SEP, 'falta'), 'erro'], ['Concluídas', conta(SEP, 'feita'), 'ok']])}
    <label class="gp-campo gi-sel"><span>Mostrar</span><select data-gi-sel aria-label="Mostrar as guias">${GRUPOS_S.map(([k, t]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
    ${GRUPOS_S.map(([k, t]) => { const xs = o.vazio && k === sel ? [] : SEP.filter((g) => g.est === k); return `<ul class="gp-lista gi-sep" role="list" data-gi-painel="${k}"${k === sel ? '' : ' hidden'}>${xs.length ? xs.map((g, j) => cartaoS(g, j, j === 0)).join('') : `<li><p class="gp-vazio">${L(check)}Nenhuma guia ${t.toLowerCase()}.</p></li>`}</ul>`; }).join('')}`,
  comBarra('Separação'));
}
type E91 = 'normal' | 'atribuida' | 'curso' | 'falta';
function guiaSep(e: E91 = 'normal'): string {
  const g = e === 'curso' ? SEP[1] : e === 'falta' ? SEP[2] : SEP[0];
  if (e === 'atribuida') return ecra(`<section class="gi-movido" role="status">${cenaSeparacao()}<h1>${g.ref} na fila do Tiago</h1><p>O servidor confirmou. A guia chega ao PDA dele quando acabar a GS13454211; o motor regista a atribuição e o motivo.</p></section>`,
    G('Guia', { voltar: 'g-sep-acomp', pe: `${acao('Voltar à Separação', arrowLeft, ' data-ir="g-sep-acomp"')}` }));
  const [t, k] = TAG_S[g.est];
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">${g.ref}</h1><span class="gp-tag gp-tag--${k}">${t}</span></div>
    <p class="gp-nota">${g.cli} · ${g.linhas.length} linhas · ${un(g)} un.${g.quem ? ` · ${g.quem}` : ''}</p>
    ${e === 'falta' ? aviso('erro', pkgX, 'Falta registada na posição', 'O Tiago tirou 2 das 4 pastilhas P 85 020: só havia 2 na 60210305. A falta ficou na posição e o servidor corrigiu o stock dela; a guia seguiu com 2 de 4.') : ''}
    ${e === 'curso' ? prog(g.feitas, g.linhas.length, 'Linhas separadas') : ''}
    <section class="gp-sec">${h2('Linhas, pelo percurso', g.linhas.length)}<ul class="gi-secoes" role="list">${g.linhas.map((l, i) => `<li class="gi-secao ${l.tirada !== undefined ? 'is-falta' : i < g.feitas ? 'is-feita' : 'is-atual'}"><span><b>${l.ref}</b><small>${l.desc} · ${l.tirada !== undefined ? `${l.tirada} de ${l.q}` : `${l.q} un.`}</small></span>${posicao(l.pos, 'gi-pos--peq')}</li>`).join('')}</ul></section>
    ${e === 'normal' ? `<section class="gp-sec">${h2('Quem separa')}
      <ul class="gp-escolha" role="radiogroup" aria-label="Quem separa">${[['Deixar o motor escolher', 'M', 'Entrega a quem acabar primeiro', ''], ['Tiago Lopes', 'TL', 'A seguir à GS13454211, que está a meio', ''], ['Eu (Ana Ferreira)', 'AF', 'Separo agora, no meu PDA', '']].map(([q, ini, x], i) => `<li><label class="gp-op"><input type="radio" name="gx-sep-quem"${i === 0 ? ' checked' : ''}><span class="gp-av">${ini}</span><span><b>${q}</b><small>${x}</small></span></label></li>`).join('')}</ul>
      <label class="gp-campo"><span>Motivo (obrigatório ao escolher a pessoa)</span><input placeholder="Ex.: cliente à espera ao balcão"></label></section>` : ''}
    ${''}`,
  G('Guia de separação', { voltar: 'g-sep-acomp', pe: e === 'normal' ? `${acao('Separar eu', play, ' data-ir="g-sep-pos"')}${sec('Atribuir ao Tiago', userPlus, ' data-ir="g-sep-atribuida"')}` : e === 'curso' ? sec('Reatribuir', repeat, ' data-ir="g-sep-guia"') : '' }));
}
/* 92 · Separar: ler a posição → ler o artigo → a quantidade → a linha seguinte; a falta na posição; os preparados */
type E92 = 'lista' | 'pos' | 'art' | 'qtd' | 'ok' | 'l2' | 'falta' | 'a-registar-falta' | 'falta-ok' | 'fim' | 'entregar' | 'pronta' | 'pos-errada' | 'art-errado' | 'prat-errada' | 'sem-rede' | 'outro';
const PASSOS92 = ['Posição', 'Artigo', 'Quant.'];
function separar(e: E92 = 'lista'): string {
  const g = SEP[0], l = g.linhas[0], l2 = g.linhas[1];
  const o = (titulo: string, x: Opcoes = {}) => G(titulo, { voltar: 'g-sep', ...x });
  if (e === 'lista') return ecra(`<h1 class="gp-titulo">Separação</h1>${modo('sep', true)}
    <section class="gp-sec">${h2('Guias que pode separar', 1)}<ul class="gp-lista" role="list">${tarefaCartao(basket, g.ref, `${g.cli} · ${g.linhas.length} linhas · ${un(g)} un. · ninguém livre`, 'Separar', play, 'g-sep-pos', 0)}</ul></section>
    ${''}`, comBarra('Separação'));
  const topo = (i: number, n?: number) => `<p class="gi-ler-inv"><b>${g.ref}</b><span>${g.cli} · linha ${i + 1} de ${g.linhas.length}</span></p>${n !== undefined ? passosDe(PASSOS92, n, 'Passos desta linha') : ''}`;
  const pedido = (x: LinhaS) => `<section class="gi-artigo"><span class="gi-artigo__ic">${L(pkg)}</span><div><p class="gi-artigo__ref">${x.ref}</p><p class="gi-artigo__desc">${x.desc}</p><p class="gi-artigo__meta">A guia pede ${x.q} un.</p></div></section>`;
  /* «há menos» junto da quantidade, e não no pé: no EDA61K o pé com dois botões tapava a quantidade */
  const menos = `<button type="button" class="gp-ligacao" data-ir="g-sep-falta">${L(minus)}Há menos na posição</button>`;
  const onde = (x: LinhaS) => `<div class="gi-ler-pos">${L(mapPin)}<span class="gi-mini-r">Posição</span>${posicao(x.pos, 'gi-pos--peq')}</div>`;
  const C: Record<Exclude<E92, 'lista'>, () => [string, string, string?]> = {
    pos: () => [`${topo(0, 0)}${faixaLer('pronto', mapPin, `Vá à ${l.pos} e leia a posição`, 'Só a posição desta linha aceita', 'g-sep-art', 'posicao')}${onde(l)}${pedido(l)}`, sec('Escrever à mão', keyboard)],
    art: () => [`${topo(0, 1)}${faixaLer('pronto', scanBarcode, 'Leia o artigo', `Na prateleira: ${l.ref}`, 'g-sep-qtd', 'artigo')}${onde(l)}${pedido(l)}`, sec('Escrever à mão', keyboard)],
    qtd: () => [`${topo(0, 2)}${faixaLer('lido', circleCheck, 'Artigo certo', `${l.ref} na ${l.pos}`)}${pedido(l)}${quantidade(String(l.q), { teclado: false, rotulo: 'Quantas tirou?' })}${menos}`, acao(`Confirmar ${l.q}`, check, ' data-confirmar data-ir="g-sep-ok"')],
    ok: () => [`${topo(0)}${aviso('ok', circleCheck, 'Linha 1 confirmada', `${l.q} un. de ${l.ref} tiradas da ${l.pos}. O servidor confirmou.`)}${h2('A seguir')}${onde(l2)}${pedido(l2)}`, acao('Ir à linha seguinte', arrowRight, ' data-ir="g-sep-l2"')],
    l2: () => [`<p class="gi-ler-inv"><b>${g.ref}</b><span>${g.cli} · linha 2 de ${g.linhas.length}</span></p>${passosDe(PASSOS92, 2, 'Passos desta linha')}${faixaLer('lido', circleCheck, 'Artigo certo', `${l2.ref} na ${l2.pos}`)}${pedido(l2)}${quantidade(String(l2.q), { teclado: false, rotulo: 'Quantas tirou?' })}${menos}`, acao(`Confirmar ${l2.q}`, check, ' data-confirmar data-ir="g-sep-fim"')],
    falta: () => [`<p class="gi-ler-inv"><b>${g.ref}</b><span>Linha 2 · ${l2.ref}</span></p>${onde(l2)}${aviso('aviso', pkgX, 'Falta na posição', `A guia pede ${l2.q}. Diga quantas há <b>de facto</b> na ${l2.pos}: a falta fica registada nesta posição, e o servidor corrige o stock dela.`)}${quantidade('1', { teclado: false, rotulo: 'Quantas há na posição?' })}`, `${acao('Registar a falta', check, ' data-confirmar data-ir="g-sep-falta-ok"')}${sec('Afinal há todas', arrowLeft, ' data-ir="g-sep-l2"')}`],
    'a-registar-falta': () => [`${onde(l2)}${quantidade('1', { teclado: false, rotulo: 'Quantas há na posição?' })}`, esperar('A registar…')],
    'falta-ok': () => [`${aviso('ok', circleCheck, 'Falta registada na 60100802', `Tirou 1 de ${l2.q}. O servidor corrigiu o stock da posição e a linha fica com 1; o gestor e o ERP veem a falta.`)}${h2('A seguir')}${onde(g.linhas[2])}${pedido(g.linhas[2])}`, acao('Ir à linha seguinte', arrowRight, ' data-ir="g-sep-fim"')],
    fim: () => [`<h1 class="gp-titulo">${g.ref} separada</h1><p class="gp-nota">${g.cli} · as ${g.linhas.length} linhas confirmadas pelo servidor</p>
      <ul class="gi-linhas" role="list">${g.linhas.map((x, i) => linhaArt(x.ref, `${x.desc} · ${x.pos}`, i === 1 ? `1 de ${x.q}` : `${x.q} un.`, i === 1 ? ' is-falta' : '')).join('')}</ul>
      ${aviso('aviso', pkgX, '1 linha com falta', 'A falta está registada na posição 60100802. A guia não fica à espera da reposição: segue para os preparados com o que se tirou, e o ERP vê a linha em falta.')}`, acao('Levar aos preparados', arrowRight, ' data-ir="g-sep-entregar"')],
    entregar: () => [`<p class="gi-ler-inv"><b>${g.ref}</b><span>Separada · 4 linhas</span></p>${faixaLer('pronto', pkgCheck, `Leia a posição ${PREP}`, 'A prateleira de preparados, onde pousa a guia', 'g-sep-pronta', 'posicao')}<div class="gi-ler-pos">${L(mapPin)}<span class="gi-mini-r">Preparados</span>${posicao(PREP, 'gi-pos--peq')}</div>${''}`, sec('Escrever à mão', keyboard)],
    pronta: () => [`<section class="gi-movido" role="status">${cenaSeparacao()}<h1>${g.ref} pronta</h1><p>Pousada nos preparados, na ${PREP}. O servidor confirmou; a Expedição já a vê nas prontas.</p></section>`, `${acao('Separar outra guia', basket, ' data-ir="g-sep"')}${sec('Ver na Expedição', truck, ' data-ir="g-exp-acomp"')}`],
    'pos-errada': () => [`${topo(0, 0)}${faixaLer('erro', mapPin, 'Esta não é a posição da linha', 'Leu 60100306')}${aviso('erro', mapPin, 'Não se tira daqui', `A linha 1 é na <b>${l.pos}</b>. Um artigo igual noutra posição não conta para esta guia.`)}${onde(l)}`, acao('Ler a posição certa', scanBarcode, ' data-ir="g-sep-pos"')],
    'art-errado': () => [`${topo(0, 1)}${faixaLer('erro', pkgX, 'Este artigo não é da linha', 'Leu SKF 6206-2Z')}${aviso('erro', pkgX, 'Não está nesta linha', `A linha 1 pede <b>${l.ref}</b>. Deixe este na prateleira.`)}`, acao('Ler outro artigo', scanBarcode, ' data-ir="g-sep-art"')],
    'prat-errada': () => [`${faixaLer('erro', pkgX, 'Esta não é a posição de preparados', 'Leu 60100305')}${aviso('erro', pkgCheck, 'A guia não pousa aqui', `A 60100305 é uma posição de arrumação. Uma guia separada só fica pronta nos preparados, na <b>${PREP}</b>.`)}<div class="gi-ler-pos">${L(mapPin)}<span class="gi-mini-r">Preparados</span>${posicao(PREP, 'gi-pos--peq')}</div>`, acao('Ler outra vez', scanBarcode, ' data-ir="g-sep-entregar"')],
    'sem-rede': () => [`${aviso('erro', wifiOff, 'A Pick parou: sem rede', 'Sem rede nada se confirma e nada fica à espera no PDA. As linhas já confirmadas estão no servidor.')}<p class="gi-estado" role="status"><span class="girador girador--pequeno" aria-hidden="true"></span>A procurar rede…</p>`, acao('Tentar outra vez', refresh), 'sem-rede'],
    outro: () => [aviso('info', repeat, `${g.ref} passou para o Tiago`, 'Outro gestor reatribuiu-a há instantes. A linha que confirmou fica registada com o seu nome; o resto já não é consigo.'), acao('Voltar à Separação', arrowLeft, ' data-ir="g-sep"')],
  };
  const [corpo, pe, k] = C[e]();
  return ecra(corpo, o('Separar', { pe, rede: k !== 'sem-rede' }));
}

/* =========================================================
   95 · Expedição (acompanhar) · 96 · Recolher e expedir (executar)
   ========================================================= */
const TAG_E: Record<EstExp, [string, string]> = { pronta: ['Pronta', 'planeada'], expedicao: ['Em expedição', 'curso'], expedida: ['Expedida', 'ok'], excecao: ['Exceção', 'erro'] };
const GRUPOS_E: [EstExp, string][] = [['pronta', 'Prontas'], ['expedicao', 'Em expedição'], ['excecao', 'Exceções'], ['expedida', 'Expedidas']];
function cartaoE(g: GuiaE, i: number): string {
  const [t, k] = TAG_E[g.est];
  const b: [string, string, string] | null = g.est === 'pronta' ? ['Recolher', play, 'g-exp-prat'] : g.est === 'excecao' ? ['Resolver', triangle, 'g-exp-excecao'] : null;
  return `<li style="--i:${i}"><div class="gx-guia-e gx-guia-e--${g.est}"><p><b>${g.ref}</b><span class="gp-tag gp-tag--${k}">${t}</span></p>
    <small>${g.cli} · ${g.linhas} linhas</small><small>${g.quem} · ${g.est === 'expedida' ? 'às' : 'desde as'} ${g.desde}</small>
    ${g.nota ? `<p class="gi-guia__mot">${L(g.est === 'excecao' ? triangle : pkgX)}${g.nota}</p>` : ''}
    ${b ? `<button type="button" class="gp-btn gp-btn--acao" data-ir="${b[2]}">${L(b[1])}<span>${b[0]}</span></button>` : ''}</div></li>`;
}
function expedicaoAcomp(o: { sel?: EstExp; vazio?: boolean } = {}): string {
  const sel = o.sel ?? 'pronta';
  return ecra(`<h1 class="gp-titulo gx-vt-exp">Expedição</h1>${modo('exp', false)}
    ${faixa([['Prontas', conta(EXP, 'pronta')], ['Em expedição', conta(EXP, 'expedicao')], ['Exceções', conta(EXP, 'excecao'), 'erro'], ['Expedidas', conta(EXP, 'expedida'), 'ok']])}
    <label class="gp-campo gi-sel"><span>Mostrar</span><select data-gi-sel aria-label="Mostrar as guias">${GRUPOS_E.map(([k, t]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
    ${GRUPOS_E.map(([k, t]) => { const xs = o.vazio && k === sel ? [] : EXP.filter((g) => g.est === k); return `<ul class="gp-lista gi-sep" role="list" data-gi-painel="${k}"${k === sel ? '' : ' hidden'}>${xs.length ? xs.map(cartaoE).join('') : `<li><p class="gp-vazio">${L(check)}Nenhuma guia ${t.toLowerCase()}.</p></li>`}</ul>`; }).join('')}
    ${''}`,
  comBarra('Expedição'));
}
type E96 = 'lista' | 'prat' | 'guia' | 'verificar' | 'recolhida' | 'a-confirmar' | 'expedida' | 'nao-pronta' | 'outra' | 'ja' | 'sem-rede' | 'excecao';
function expedir(e: E96 = 'lista'): string {
  const g = EXP[0];
  if (e === 'lista') return ecra(`<h1 class="gp-titulo">Expedição</h1>${modo('exp', true)}
    <section class="gp-sec">${h2('Prontas na prateleira de preparados', conta(EXP, 'pronta'))}<ul class="gp-lista" role="list">
      ${EXP.filter((x) => x.est === 'pronta').map((x, i) => tarefaCartao(truck, x.ref, `${x.cli} · ${x.linhas} linhas · desde as ${x.desde}${x.nota ? ` · ${x.nota}` : ''}`, 'Recolher', play, i === 0 ? 'g-exp-prat' : 'g-exp-outra', i)).join('')}
    </ul></section>`, comBarra('Expedição'));
  const o = (titulo: string, x: Opcoes = {}) => G(titulo, { voltar: 'g-exp', ...x });
  const topo = (n: number) => `<p class="gi-ler-inv"><b>${g.ref}</b><span>${g.cli} · ${g.linhas} linhas</span></p>${passosDe(['Prateleira', 'Guia', 'Verificar'], n, 'Passos da recolha')}`;
  const C: Record<Exclude<E96, 'lista'>, () => [string, string, string?]> = {
    prat: () => [`${topo(0)}${faixaLer('pronto', pkgCheck, `Leia a posição ${PREP}`, 'A prateleira de preparados, onde a separação pousou a guia', 'g-exp-guia', 'posicao')}<div class="gi-ler-pos">${L(mapPin)}<span class="gi-mini-r">Preparados</span>${posicao(PREP, 'gi-pos--peq')}</div>`, sec('Escrever à mão', keyboard)],
    guia: () => [`${topo(1)}${faixaLer('pronto', scanBarcode, 'Leia a etiqueta da guia', `A ${g.ref}, na prateleira`, 'g-exp-verificar', 'guia')}`, sec('Escrever à mão', keyboard)],
    verificar: () => [`${topo(2)}${faixaLer('lido', circleCheck, 'Guia certa', `${g.ref} · pronta`)}
      <dl class="gi-revisao"><div><dt>Separação</dt><dd>${g.quem} · às ${g.desde}</dd></div><div><dt>Linhas</dt><dd>${g.linhas} · sem faltas</dd></div></dl>`, acao('Confirmar a recolha', check, ' data-ir="g-exp-recolhida"')],
    recolhida: () => [`${aviso('ok', circleCheck, `${g.ref} recolhida`, 'O servidor registou que saiu da prateleira de preparados consigo, às 10:41. Falta confirmar a saída.')}`, acao('Confirmar a saída', send, ' data-confirmar data-ir="g-exp-expedida"')],
    'a-confirmar': () => [`${aviso('info', truck, `${g.ref} a sair`, 'Só fica expedida quando o servidor confirmar.')}`, esperar('A confirmar a saída…')],
    expedida: () => [`<section class="gi-movido" role="status">${cenaExpedicao()}<h1>${g.ref} expedida</h1><p>O servidor confirmou a saída às 10:42. Fica no histórico da Expedição, com quem e quando.</p></section>`, `${acao('Recolher a seguinte', truck, ' data-ir="g-exp"')}${sec('Ver as expedidas', history, ' data-ir="g-exp-acomp-expedidas"')}`],
    'nao-pronta': () => [`${faixaLer('erro', lock, 'Esta guia ainda não está pronta', 'Leu GS13454211')}${aviso('erro', lock, 'A GS13454211 está em separação', 'O Tiago está a separá-la (2 de 3 linhas). Só se recolhe depois de pousada na prateleira de preparados.')}`, acao('Ler outra guia', scanBarcode, ' data-ir="g-exp-guia"')],
    outra: () => [`${faixaLer('aviso', triangle, 'Leu outra guia pronta', 'GS13454208, não a GS13454209')}${aviso('aviso', triangle, 'Recolher a GS13454208?', 'Também está pronta (Auto Peças Viana · 5 linhas · 1 com falta). Se a recolher, a GS13454209 fica na prateleira.')}`, `${acao('Recolher a GS13454208', check, ' data-ir="g-exp-recolhida"')}${sec('Ler a GS13454209', scanBarcode, ' data-ir="g-exp-guia"')}`],
    ja: () => [`${faixaLer('erro', repeat, 'Já recolhida', 'GS13454207')}${aviso('erro', repeat, 'O Paulo já a recolheu', 'A GS13454207 saiu da prateleira com o Paulo Reis às 10:05. Não se recolhe duas vezes.')}`, acao('Ler outra guia', scanBarcode, ' data-ir="g-exp-guia"')],
    'sem-rede': () => [`${aviso('erro', wifiOff, 'A Pick parou: sem rede', 'Sem rede nada se recolhe nem se expede, e nada fica à espera no PDA. A guia fica onde está.')}<p class="gi-estado" role="status"><span class="girador girador--pequeno" aria-hidden="true"></span>A procurar rede…</p>`, acao('Tentar outra vez', refresh), 'sem-rede'],
    excecao: () => [`<div class="gi-acomp-cab"><h1 class="gp-titulo">GS13454206</h1><span class="gp-tag gp-tag--erro">Exceção</span></div>
      ${aviso('erro', triangle, 'Não está na prateleira de preparados', `O Paulo leu a ${PREP} às 09:55 e a guia não estava lá. A separação deu-a como pousada às 09:31 (Tiago Lopes).`)}
      <dl class="gi-revisao"><div><dt>Cliente</dt><dd>Oficina Moreira &amp; Filhos</dd></div><div><dt>Linhas</dt><dd>3</dd></div><div><dt>Pousada por</dt><dd>Tiago Lopes · 09:31</dd></div></dl>
      ${nota('Procura-se primeiro na prateleira; se apareceu, lê-se e segue. Nada se dá como expedido sem a guia na mão.')}`, `${acao('Encontrei: ler a guia', scanBarcode, ' data-ir="g-exp-guia"')}${sec('Pedir ao Tiago que a procure', userRound)}`],
  };
  const [corpo, pe, k] = C[e]();
  return ecra(corpo, o(e === 'excecao' ? 'Exceção' : 'Recolher e expedir', { pe, rede: k !== 'sem-rede', voltar: e === 'excecao' ? 'g-exp-acomp' : 'g-exp' }));
}

/* =========================================================
   75 · Ler (Gestor): o leitor ao centro; o código só vale dentro de uma operação
   ========================================================= */
const itemMais = (ic: string, t: string, x: string, ir: string) => `<li><button type="button" class="gi-mais"${ir ? ` data-ir="${ir}"` : ''}><span class="gi-mais__ic">${L(ic)}</span><span><b>${t}</b><small>${x}</small></span>${L(arrowRight, 'gi-seta')}</button></li>`;
type E75 = 'normal' | 'posicao' | 'guia' | 'artigo' | 'desconhecido' | 'sem-leitor' | 'sem-rede';
function lerGestor(e: E75 = 'normal'): string {
  const o = (x: Opcoes = {}) => comBarra('Ler', 'ler', x);
  if (e === 'posicao') return ecra(`<h1 class="gp-titulo">Leu 60100305</h1>
    <section class="gi-cartao">${posicao('60100305', 'gi-pos--grande')}<p>Zona 10 · rolamentos. Está em três operações:</p></section>
    <ul class="gi-mais-l" role="list">${itemMais(pkgOpen, 'Arrumar aqui', 'GA-2026-0332 · 30 un. de SKF 6205-2Z têm este destino', 'g-arr-op')}${itemMais(basket, 'Separar daqui', 'GS13454212 · linha 1 · 6 un.', 'g-sep-pos')}${itemMais(pkg, 'Contar esta posição', 'INV-2026-015 · zona 10 · por iniciar', 'g-inv-ficou')}${itemMais(search, 'Consultar o stock', 'O que o sistema diz que há', 'inv-consultar')}</ul>`, o());
  if (e === 'guia') return ecra(`<h1 class="gp-titulo">Leu GS13454209</h1>
    ${aviso('info', pkgCheck, 'Guia pronta na prateleira de preparados', 'Pneus e Travões do Minho · 3 linhas · separada pelo Tiago às 09:40.')}
    <ul class="gi-mais-l" role="list">${itemMais(truck, 'Recolher para expedir', 'Verifica e confirma a recolha', 'g-exp-verificar')}${itemMais(list, 'Ver a guia', 'As linhas e quem as separou', 'g-exp-acomp')}</ul>`, o());
  if (e === 'artigo') return ecra(`${aviso('info', scanBarcode, 'Leu 7316201250277', 'É um artigo (SKF VKBA 6556). Nenhuma operação sua o pede agora: o que quer fazer?')}
    <ul class="gi-mais-l" role="list">${itemMais(search, 'Consultar o stock', 'Onde está e quanto o sistema diz que há', 'inv-consultar')}${itemMais(pencil, 'Corrigir uma posição', 'Lê primeiro a posição', 'inv-cp-ler')}</ul>
    ${''}`, o());
  if (e === 'desconhecido') return ecra(`${aviso('erro', pkgX, 'Código desconhecido', 'Leu <b>5601234000017</b>: não é posição, artigo, palete nem guia do armazém 60.')}`, o({ pe: acao('Ler outra vez', scanBarcode, ' data-ir="g-ler"') }));
  if (e === 'sem-leitor') return ecra(`${leitor({ titulo: 'O leitor não responde', texto: 'Prima a tecla de leitura de novo. Se não ler, reinicie o leitor; até lá pode escrever o código à mão — fica marcado como escrito.', estado: 'parado' })}`, o({ pe: `${acao('Reiniciar o leitor', refresh)}${sec('Escrever à mão', keyboard)}` }));
  if (e === 'sem-rede') return ecra(aviso('erro', wifiOff, 'Sem rede', 'O leitor lê, mas sem rede a Pick não sabe o que o código é: nada se faz até voltar.'), o({ rede: false, pe: acao('Tentar outra vez', refresh) }));
  return ecra(`${leitor({ titulo: 'Leia uma etiqueta', texto: 'Posição, artigo, palete ou guia. A Pick diz o que pode fazer com ela.', codigo: '60100305', tipo: 'contexto', ir: 'g-ler-posicao' })}
    <section class="gp-sec">${h2('Ou escolha primeiro')}<div class="gp-dois">
      <button type="button" class="gp-rap" data-ir="g-inv-exec">${L(pkg)}<span>Contar</span></button>
      <button type="button" class="gp-rap" data-ir="g-arr-exec">${L(pkgOpen)}<span>Arrumar</span></button>
      <button type="button" class="gp-rap" data-ir="g-sep">${L(basket)}<span>Separar</span></button>
      <button type="button" class="gp-rap" data-ir="g-exp">${L(truck)}<span>Recolher</span></button></div></section>`, o());
}

/* =========================================================
   65 · Tarefas v2 · 66 · Mais v2 · 66.1 · Ajuda
   ========================================================= */
export type TipoT = 'inventario' | 'arrumacao' | 'separacao' | 'expedicao';
export interface TarefaG { tipo: TipoT; ref: string; t: string; quem: string; est: 'fazer' | 'curso' | 'atencao'; acao: [string, string, string]; p?: [number, number, string] }
export const TAREFAS: TarefaG[] = [
  { tipo: 'separacao', ref: 'GS13454212', t: 'Auto Reparadora Silva · 4 linhas · ninguém livre', quem: '', est: 'fazer', acao: ['Iniciar', 'g-sep-guia', play] },
  { tipo: 'arrumacao', ref: 'GA-2026-0332', t: '30 un. · cais 1 → 60100305', quem: '', est: 'fazer', acao: ['Iniciar', 'g-arr-op', play] },
  { tipo: 'arrumacao', ref: 'GA-2026-0331', t: '2 paletes · cais 1 → 60101203', quem: '', est: 'fazer', acao: ['Atribuir', 'arr-guia', userPlus] },
  { tipo: 'inventario', ref: 'INV-2026-015', t: 'Cíclica · zona 10 · 30 posições', quem: '', est: 'fazer', acao: ['Atribuir', 'gestor-atribuir', userPlus] },
  { tipo: 'expedicao', ref: 'GS13454209', t: 'Pronta desde as 09:40 · 3 linhas', quem: '', est: 'fazer', acao: ['Recolher', 'g-exp-prat', truck] },
  { tipo: 'expedicao', ref: 'GS13454208', t: 'Pronta desde as 09:12 · 5 linhas', quem: '', est: 'fazer', acao: ['Recolher', 'g-exp-outra', truck] },
  { tipo: 'inventario', ref: INVENTARIOS[0].ref, t: `${INVENTARIOS[0].area} · às cegas`, quem: 'Joana Silva', est: 'curso', acao: ['Acompanhar', 'gestor-acompanhar', list], p: [INVENTARIOS[0].feitas, INVENTARIOS[0].total, 'Posições'] },
  { tipo: 'arrumacao', ref: 'GA-2026-0330', t: '2 artigos · cais 2 → 60120401', quem: 'Inês Rocha', est: 'curso', acao: ['Acompanhar', 'arr-acompanhar', list], p: [1, 2, 'Artigos'] },
  { tipo: 'separacao', ref: 'GS13454211', t: 'Garagem Central de Braga', quem: 'Tiago Lopes', est: 'curso', acao: ['Acompanhar', 'g-sep-guia-curso', list], p: [2, 3, 'Linhas'] },
  { tipo: 'expedicao', ref: 'GS13454207', t: 'Recolhida às 10:05', quem: 'Paulo Reis', est: 'curso', acao: ['Acompanhar', 'g-exp-acomp-curso', list] },
  { tipo: 'inventario', ref: 'INV-2026-011', t: 'Submetido · 2 divergências', quem: 'Joana Silva', est: 'atencao', acao: ['Validar', 'gestor-validar', shieldCheck] },
  { tipo: 'separacao', ref: 'GS13454210', t: 'Falta: P 85 020 · 2 de 4', quem: 'Tiago Lopes', est: 'atencao', acao: ['Rever', 'g-sep-guia-falta', triangle] },
  { tipo: 'arrumacao', ref: 'GA-2026-0329', t: 'Destino em contagem: 60300104', quem: '', est: 'atencao', acao: ['Mudar o destino', 'arr-guia-bloqueada', mapPin] },
  { tipo: 'expedicao', ref: 'GS13454206', t: 'Não está na prateleira de preparados', quem: 'Paulo Reis', est: 'atencao', acao: ['Rever', 'g-exp-excecao', triangle] },
];
/** As que se fazem já: o número da barra (navegacao.ts, «por fazer»). */
export const POR_FAZER = TAREFAS.filter((x) => x.est === 'fazer').length;
const IC_T: Record<TipoT, string> = { inventario: pkg, arrumacao: pkgOpen, separacao: basket, expedicao: truck };
function tarefasV2(): string {
  const SEPS: [TarefaG['est'], string][] = [['fazer', 'Por fazer'], ['curso', 'Em curso'], ['atencao', 'Atenção']];
  const linha = (x: TarefaG, i: number) => `<li style="--i:${i}" data-gi-tipo-l="${x.tipo}" data-gi-quem-l="${x.quem || '-'}"><div class="gi-tarefa-l gi-tarefa-l--${x.est === 'fazer' ? 'atribuir' : x.est}">
      <span class="gi-tarefa-l__ic gx-tarefa-ic--${x.tipo}">${L(IC_T[x.tipo])}</span>
      <div class="gi-tarefa-l__t"><b>${x.ref}</b><small>${x.t}</small>${x.p ? prog(x.p[0], x.p[1], x.p[2]) : ''}<small class="gi-tarefa-l__quem">${L(userRound)}${x.quem || 'Sem pessoa'}</small></div>
      <button type="button" class="gp-btn ${x.est === 'curso' ? 'gp-btn--sec' : 'gp-btn--acao'}" data-ir="${x.acao[1]}">${L(x.acao[2])}<span>${x.acao[0]}</span></button></div></li>`;
  const pessoas = [...new Set(TAREFAS.map((x) => x.quem).filter(Boolean))];
  return ecra(`<h1 class="gp-titulo">Tarefas</h1>
    <div class="gx-filtros">
      <label class="gp-campo"><span>Operação</span><select data-gi-tipo-sel>${[['', 'Todas'], ['inventario', 'Inventário'], ['arrumacao', 'Arrumação'], ['separacao', 'Separação'], ['expedicao', 'Expedição']].map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></label>
      <label class="gp-campo"><span>Pessoa</span><select data-gi-quem><option value="">Todas</option><option value="-">Sem pessoa</option>${pessoas.map((p) => `<option>${p}</option>`).join('')}</select></label>
    </div>
    <div class="gp-filtros" role="tablist" aria-label="Estado">${SEPS.map(([k, t], i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-gi-sep="${k}">${t} <span>${TAREFAS.filter((x) => x.est === k).length}</span></button>`).join('')}</div>
    ${SEPS.map(([k], i) => `<ul class="gp-lista gi-sep" role="list" data-gi-painel="${k}"${i ? ' hidden' : ''}>${TAREFAS.filter((x) => x.est === k).map(linha).join('')}</ul>`).join('')}
    ${''}`, comBarra('Tarefas', 'tarefas'));
}
function maisV2(): string {
  return ecra(`<h1 class="gp-titulo">Mais</h1>
    <section class="gp-sec">${h2('Histórico')}<ul class="gi-mais-l" role="list">${itemMais(pkg, 'Inventário', 'Os inventários fechados e os ajustes enviados ao ERP', 'gestor-historico')}${itemMais(pkgOpen, 'Arrumação', 'Os movimentos confirmados', 'arr-historico')}${itemMais(truck, 'Separação e expedição', 'As guias expedidas hoje', 'g-exp-acomp-expedidas')}</ul></section>
    <section class="gp-sec">${h2('O armazém')}<div class="gx-armazem">${L(warehouse)}<span><b>Armazém 60</b><small>O único da sua conta</small></span></div></section>
    <section class="gp-sec">${h2('Ajuda e conta')}<ul class="gi-mais-l" role="list">${itemMais(lifeBuoy, 'Ajuda', 'O leitor, a rede e a quem pedir', 'g-ajuda')}${itemMais(logOut, 'Terminar sessão', 'Ana Ferreira · volta ao início de sessão comum', 'gestor-sessao')}</ul></section>`,
  comBarra('Mais', 'mais'));
}
function ajuda(): string {
  return ecra(`<h1 class="gp-titulo">Ajuda</h1>
    <ul class="gi-mais-l" role="list">
      <li><div class="gi-mais gx-ajuda"><span class="gi-mais__ic">${L(radio)}</span><span><b>O leitor</b><small>Prima a tecla de leitura do PDA. Se não ler, reinicie o leitor; pode escrever à mão, e fica marcado como escrito.</small></span></div></li>
      <li><div class="gi-mais gx-ajuda"><span class="gi-mais__ic">${L(wifiOff)}</span><span><b>Sem rede</b><small>A Pick precisa de rede para tudo. Sem rede para e espera; o que já confirmou está no servidor.</small></span></div></li>
      <li><div class="gi-mais gx-ajuda"><span class="gi-mais__ic">${L(userRound)}</span><span><b>A quem pedir</b><small>Acessos e permissões: o administrador da conta ROMAFE.</small></span></div></li>
    </ul>`, G('Ajuda', { voltar: 'g-mais' }));
}

/* =========================================================
   Os ecrãs
   ========================================================= */
export type IdGestorV3 = `g-${string}`;
const NOTA = 'Do briefing «ROMAFE Warehouse — Gestor V1 · Four Warehouse Operations» (28 out.), no Figma e só com rede: o Gestor acompanha e executa o Inventário, a Arrumação, a Separação e a Expedição; uma tarefa é uma guia; a falta corrige-se na posição; a expedição levanta as guias na prateleira de preparados.';
/** As versões novas dos ecrãs que já existiam: Início v4, Inventário v4, Arrumação v3, Tarefas v2, Mais v2. */
export function comGestorV3<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  const V: Record<string, [string, () => string]> = { 'gestor-inicio': ['v4', () => inicioV4()], 'gestor-inventario': ['v4', inventarioV4], 'arr-inicio': ['v3', arrumacaoV3], 'g-tarefas': ['v2', tarefasV2], 'g-mais': ['v2', maisV2] };
  return ecras.map((e) => V[e.id] ? { ...e, versoes: [...e.versoes, { id: V[e.id][0], nota: NOTA, html: V[e.id][1]() }] as Ecra<T>['versoes'] } : e);
}
export function ecrasGestorV3(): Ecra<string>[] {
  const e = (id: string, nome: string, fluxo: string, objetivo: string, html: string, de?: string): Ecra<string> => ({ id, nome, fluxo, objetivo, ...(de ? { estadoDe: de } : {}), versoes: [{ id: 'v1', nota: NOTA, html }] });
  const est = (id: string, de: string, nome: string, fluxo: string, objetivo: string, html: string) => e(id, nome, fluxo, objetivo, html, de);
  const GS: Opcoes = comBarra('Separação'), GE: Opcoes = comBarra('Expedição');
  return [
    /* Gestor */
    e('g-operacoes', '69 · Operações', 'Gestor', 'Os quatro módulos, cada um com os seus números e «Acompanhar» ou «Executar».', operacoes()),
    e('g-ler', '75 · Ler (Gestor)', 'Gestor', 'O leitor ao centro: lê uma etiqueta e a Pick diz o que o Gestor pode fazer com ela em cada operação; ou escolhe-se primeiro a operação.', lerGestor()),
    est('g-ler-posicao', 'g-ler', '75.1 · Leu uma posição', 'Gestor', 'Uma posição em três operações: arrumar aqui, separar daqui, contar; ou consultar o stock.', lerGestor('posicao')),
    est('g-ler-guia', 'g-ler', '75.2 · Leu uma guia', 'Gestor', 'Uma guia pronta nos preparados: recolher para expedir.', lerGestor('guia')),
    est('g-ler-artigo', 'g-ler', '75.3 · Leu um artigo sem operação', 'Gestor', 'Nada o pede: consultar o stock ou corrigir uma posição; o leitor não adivinha pelo formato.', lerGestor('artigo')),
    est('g-ler-desconhecido', 'g-ler', '75.4 · Código desconhecido', 'Gestor', 'Não é nada do armazém 60: ler outra vez.', lerGestor('desconhecido')),
    est('g-ler-sem-leitor', 'g-ler', '75.5 · Leitor indisponível', 'Gestor', 'A tecla não envia: reiniciar ou escrever à mão (marcado como escrito).', lerGestor('sem-leitor')),
    est('g-ler-sem-rede', 'g-ler', '75.6 · Sem rede', 'Gestor', 'Sem rede o código não se interpreta: espera.', lerGestor('sem-rede')),
    e('g-ajuda', '66.1 · Ajuda', 'Gestor', 'O leitor, a rede e a quem pedir.', ajuda(), 'g-mais'),
    /* Inventário: o Gestor conta */
    e('g-inv-exec', '76 · Contar (Gestor)', 'Inventário', 'Inventário em «Executar»: as contagens que o Gestor pode fazer ele próprio, ou atribuir.', contarGestor()),
    est('g-inv-ficou', 'g-inv-exec', '76.1 · A contagem ficou consigo', 'Inventário', 'O servidor atribuiu a contagem ao Gestor: o âmbito, as regras e onde começa.', contarGestor('ficou')),
    est('g-inv-pos', 'g-inv-exec', '76.2 · Ler a posição', 'Inventário', 'A mira: lê-se a etiqueta da posição onde se conta.', contarGestor('pos')),
    est('g-inv-ler', 'g-inv-exec', '76.3 · Ler e contar (o 43)', 'Inventário', 'O mesmo 43 · Ler e contar do operador, com a conta do Gestor: pronto a ler o artigo.', contar('pronto')),
    est('g-inv-lido', 'g-inv-exec', '76.4 · Artigo lido', 'Inventário', 'O artigo e a quantidade, às cegas; Confirmar regista no servidor.', contar('lido')),
    est('g-inv-registado', 'g-inv-exec', '76.5 · Registado', 'Inventário', 'O verde, o último registado e o leitor já pronto para o artigo seguinte.', contar('registado')),
    est('g-inv-fim', 'g-inv-exec', '76.6 · Posição contada', 'Inventário', 'A posição acabada: a seguinte ou submeter.', contarGestor('fim')),
    est('g-inv-submeter', 'g-inv-exec', '76.7 · Submeter', 'Inventário', 'O resumo antes de submeter; depois já não se corrige.', contarGestor('submeter')),
    est('g-inv-a-submeter', 'g-inv-exec', '76.8 · A submeter', 'Inventário', 'Só o botão espera.', contarGestor('a-submeter')),
    est('g-inv-submetida', 'g-inv-exec', '76.9 · Submetido', 'Inventário', 'Fica por validar por outro gestor: quem conta não valida a própria contagem.', contarGestor('submetida')),
    est('g-inv-validar-propria', 'g-inv-exec', '76.10 · A contagem é sua', 'Inventário', 'O Gestor abre a validação de uma contagem que ele próprio fez: vê o resumo, mas as divergências e o fecho são de outro gestor.', validarPropria()),
    /* Arrumação: o Gestor arruma */
    e('g-arr-exec', '81 · Arrumar (Gestor)', 'Arrumação', 'Arrumação em «Executar»: as guias que o Gestor pode arrumar ele próprio.', arrumarGestor()),
    est('g-arr-op', 'g-arr-exec', '81.1 · Ler a palete (o 80)', 'Arrumação', 'O mesmo 80 · Arrumar do operador, com a conta do Gestor: a palete no cais.', arrumarG('origem')),
    est('g-arr-artigo', 'g-arr-exec', '81.2 · Ler o artigo', 'Arrumação', 'O artigo da guia, na palete.', arrumarG('artigo')),
    est('g-arr-destino', 'g-arr-exec', '81.3 · Ler o destino', 'Arrumação', 'Só a posição da guia aceita o movimento.', arrumarG('destino')),
    est('g-arr-qtd', 'g-arr-exec', '81.4 · Confirmar a quantidade', 'Arrumação', 'Destino certo: quantas se arrumaram.', arrumarG('quantidade')),
    est('g-arr-ok', 'g-arr-exec', '81.5 · Movimento confirmado', 'Arrumação', 'O servidor confirmou: a caixa vai à prateleira e a guia fecha.', arrumarG('confirmado')),
    /* Separação */
    e('g-sep-acomp', '90 · Separação (Gestor)', 'Separação', 'Acompanhar: as guias por separar, em separação, com faltas e concluídas, num select; cada cartão abre-se no sítio com as linhas e a ação.', separacaoAcomp()),
    est('g-sep-acomp-curso', 'g-sep-acomp', '90.1 · Em separação', 'Separação', 'O select em «Em separação».', separacaoAcomp({ sel: 'curso' })),
    est('g-sep-acomp-falta', 'g-sep-acomp', '90.2 · Com faltas', 'Separação', 'O select em «Com faltas».', separacaoAcomp({ sel: 'falta' })),
    est('g-sep-acomp-feitas', 'g-sep-acomp', '90.3 · Concluídas', 'Separação', 'O select em «Concluídas»: as guias pousadas nos preparados.', separacaoAcomp({ sel: 'feita' })),
    est('g-sep-acomp-nada', 'g-sep-acomp', '90.4 · Nada neste estado', 'Separação', 'O estado escolhido sem guias: diz-se.', separacaoAcomp({ sel: 'separar', vazio: true })),
    est('g-sep-carregar', 'g-sep-acomp', '90.5 · A carregar', 'Separação', 'As guias a chegar.', eCarregar(GS, 4)),
    est('g-sep-vazia', 'g-sep-acomp', '90.6 · Sem guias', 'Separação', 'Ainda não há guias para separar.', eVazio(GS, inbox, 'Não há guias para separar.', 'Quando o ERP emitir uma guia, ela aparece aqui.')),
    est('g-sep-erro', 'g-sep-acomp', '90.7 · Não carregou', 'Separação', 'O servidor não respondeu.', eServidor(GS, 'PK-2810-5E21')),
    est('g-sep-sem-rede', 'g-sep-acomp', '90.8 · Sem rede', 'Separação', 'A Pick para e espera.', eSemRede(GS)),
    e('g-sep-guia', '91 · Guia de separação', 'Separação', 'Uma guia por separar: as linhas pelo percurso, com a posição; quem separa — o motor, uma pessoa com motivo, ou o próprio Gestor.', guiaSep()),
    est('g-sep-atribuida', 'g-sep-guia', '91.1 · Atribuída', 'Separação', 'O servidor confirmou: a guia vai para a fila do Tiago.', guiaSep('atribuida')),
    est('g-sep-guia-curso', 'g-sep-guia', '91.2 · Em separação', 'Separação', 'A guia a meio: as linhas feitas e quem está nela.', guiaSep('curso')),
    est('g-sep-guia-falta', 'g-sep-guia', '91.3 · Com falta', 'Separação', 'A falta ficou na posição e o servidor corrigiu o stock dela; a guia seguiu com o que se tirou.', guiaSep('falta')),
    e('g-sep', '92 · Separar (Gestor)', 'Separação', 'Separação em «Executar»: a guia que o Gestor pode separar ele próprio (uma guia de cada vez).', separar()),
    est('g-sep-pos', 'g-sep', '92.1 · Ler a posição', 'Separação', 'Linha 1: ir à posição e lê-la; só a posição da linha aceita.', separar('pos')),
    est('g-sep-art', 'g-sep', '92.2 · Ler o artigo', 'Separação', 'O artigo da linha, na prateleira.', separar('art')),
    est('g-sep-qtd', 'g-sep', '92.3 · Quantas tirou', 'Separação', 'A quantidade da guia, confirmar; ou «Há menos na posição».', separar('qtd')),
    est('g-sep-ok', 'g-sep', '92.4 · Linha confirmada', 'Separação', 'O servidor confirmou a linha; a seguinte, com a posição.', separar('ok')),
    est('g-sep-l2', 'g-sep', '92.5 · Linha 2', 'Separação', 'Posição e artigo lidos (como na 1): a guia pede 2.', separar('l2')),
    est('g-sep-falta', 'g-sep', '92.6 · Falta na posição', 'Separação', 'Há menos do que a guia pede: diz-se quantas há DE FACTO na posição; a falta fica registada ali.', separar('falta')),
    est('g-sep-a-registar', 'g-sep', '92.7 · A registar a falta', 'Separação', 'Só o botão espera; o stock não muda pelo PDA.', separar('a-registar-falta')),
    est('g-sep-falta-ok', 'g-sep', '92.8 · Falta registada', 'Separação', 'O servidor corrigiu o stock da posição; a linha fica com o que se tirou.', separar('falta-ok')),
    est('g-sep-fim', 'g-sep', '92.9 · Guia separada', 'Separação', 'As linhas confirmadas (as 3 e 4 como a 1), a falta à vista; levar aos preparados.', separar('fim')),
    est('g-sep-entregar', 'g-sep', '92.10 · Ler os preparados', 'Separação', 'Lê-se a prateleira de preparados onde a guia fica.', separar('entregar')),
    est('g-sep-pronta', 'g-sep', '92.11 · Pronta para expedir', 'Separação', 'O servidor confirmou: o artigo cai na caixa da guia; a Expedição já a vê.', separar('pronta')),
    est('g-sep-pos-errada', 'g-sep', '92.12 · Posição errada', 'Separação', 'Outra posição: não se tira daqui.', separar('pos-errada')),
    est('g-sep-art-errado', 'g-sep', '92.13 · Artigo errado', 'Separação', 'Um artigo que não é da linha: fica na prateleira.', separar('art-errado')),
    est('g-sep-prat-errada', 'g-sep', '92.14 · Não é a prateleira de preparados', 'Separação', 'A guia só fica pronta nos preparados.', separar('prat-errada')),
    est('g-sep-sem-rede-op', 'g-sep', '92.15 · Sem rede', 'Separação', 'A Pick para; nada fica à espera no PDA.', separar('sem-rede')),
    est('g-sep-outro', 'g-sep', '92.16 · Reatribuída', 'Separação', 'Outro gestor passou a guia ao Tiago: o que confirmou fica com o seu nome.', separar('outro')),
    /* Expedição */
    e('g-exp-acomp', '95 · Expedição (Gestor)', 'Expedição', 'Acompanhar: as guias prontas, em expedição, com exceção e expedidas, num select.', expedicaoAcomp()),
    est('g-exp-acomp-curso', 'g-exp-acomp', '95.1 · Em expedição', 'Expedição', 'O select em «Em expedição».', expedicaoAcomp({ sel: 'expedicao' })),
    est('g-exp-acomp-excecoes', 'g-exp-acomp', '95.2 · Exceções', 'Expedição', 'O select em «Exceções».', expedicaoAcomp({ sel: 'excecao' })),
    est('g-exp-acomp-expedidas', 'g-exp-acomp', '95.3 · Expedidas', 'Expedição', 'O select em «Expedidas»: o histórico de hoje.', expedicaoAcomp({ sel: 'expedida' })),
    est('g-exp-acomp-nada', 'g-exp-acomp', '95.4 · Nada pronto', 'Expedição', 'Nenhuma guia pronta: diz-se.', expedicaoAcomp({ sel: 'pronta', vazio: true })),
    est('g-exp-carregar', 'g-exp-acomp', '95.5 · A carregar', 'Expedição', 'As guias a chegar.', eCarregar(GE, 4)),
    est('g-exp-erro', 'g-exp-acomp', '95.6 · Não carregou', 'Expedição', 'O servidor não respondeu.', eServidor(GE, 'PK-2810-7A04')),
    est('g-exp-sem-rede', 'g-exp-acomp', '95.7 · Sem rede', 'Expedição', 'A Pick para e espera.', eSemRede(GE)),
    est('g-exp-excecao', 'g-exp-acomp', '95.8 · Guia não encontrada', 'Expedição', 'A guia não estava nos preparados: procura-se; nada se expede sem a guia na mão.', expedir('excecao')),
    e('g-exp', '96 · Recolher e expedir (Gestor)', 'Expedição', 'Expedição em «Executar»: as guias prontas na prateleira de preparados.', expedir()),
    est('g-exp-prat', 'g-exp', '96.1 · Ler os preparados', 'Expedição', 'Lê-se a prateleira de preparados.', expedir('prat')),
    est('g-exp-guia', 'g-exp', '96.2 · Ler a guia', 'Expedição', 'Lê-se a etiqueta da guia na prateleira.', expedir('guia')),
    est('g-exp-verificar', 'g-exp', '96.3 · Verificar', 'Expedição', 'O estado da guia (pronta), o cliente, quem separou e as linhas; confirmar a recolha.', expedir('verificar')),
    est('g-exp-recolhida', 'g-exp', '96.4 · Recolhida', 'Expedição', 'O servidor registou a recolha; falta confirmar a saída.', expedir('recolhida')),
    est('g-exp-a-confirmar', 'g-exp', '96.5 · A confirmar a saída', 'Expedição', 'Só fica expedida quando o servidor confirmar.', expedir('a-confirmar')),
    est('g-exp-expedida', 'g-exp', '96.6 · Expedida', 'Expedição', 'Confirmado: a guia sai da prateleira para o cais.', expedir('expedida')),
    est('g-exp-nao-pronta', 'g-exp', '96.7 · Ainda em separação', 'Expedição', 'Leu uma guia que não está pronta: não se recolhe.', expedir('nao-pronta')),
    est('g-exp-outra', 'g-exp', '96.8 · Outra guia pronta', 'Expedição', 'Leu outra guia também pronta: recolher essa ou ler a escolhida.', expedir('outra')),
    est('g-exp-ja', 'g-exp', '96.9 · Já recolhida', 'Expedição', 'Outra pessoa já a recolheu: não se recolhe duas vezes.', expedir('ja')),
    est('g-exp-sem-rede-op', 'g-exp', '96.10 · Sem rede', 'Expedição', 'A Pick para; a guia fica onde está.', expedir('sem-rede')),
  ];
}
