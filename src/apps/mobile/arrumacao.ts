/* =========================================================
   PICK — a Arrumação (27 out. 2026), do briefing «ROMAFE Warehouse V2 — Manager Inventory & Putaway»
   No Figma e só com rede. A Arrumação tem a mesma atenção que o Inventário, com o que está decidido no armazém:
     - a chegada não é prevista (23 set.): o sistema não sabe o que vem; é a arrumação que regista a chegada no PDA
       (CH-…) — por isso não há «esperado hoje» nem comparação com encomendas de compra;
     - receber é tarefa (22 set.) e uma tarefa é uma guia (24 set.): de cada chegada nascem guias de arrumação (GA-…),
       com uma ou mais paletes; o motor entrega uma de cada vez a quem está livre;
     - o motor atribui; o gestor pode atribuir quando acha necessário, com motivo escrito, e o motor aprende (18 set.):
       «Por atribuir» quer dizer «ninguém da arrumação está livre», não «à espera do gestor»;
     - o mapa é da v2 (22 set.): os destinos são posições de 8 algarismos, sem mapa nem coordenadas inventadas;
     - capacidades de posição não há medidas: não se mostram;
     - o Inventário e a Arrumação ligam-se pela posição: um destino numa zona em contagem às cegas (INV-2026-014, zona
       30) fica bloqueado até a contagem fechar — a arrumação não estraga a contagem; o motor propõe outro destino.
   Gestor: 70 · Arrumação (a faixa, os separadores, as guias), 71 · Guia de arrumação (origem, artigos, destinos
   propostos com as validações, atribuir com motivo), 72 · Acompanhar a guia, 73 · Exceções, 74 · Histórico.
   Operador: 80 · Arrumar — abrir a guia → ler a origem → ler o artigo → ler o destino → confirmar a quantidade →
   concluir; só se confirma no destino da guia. A animação da caixa (da entrada à prateleira) corre uma vez ao
   entrar e quando o servidor confirma o movimento, nunca antes.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { ecra, acao, sec, esperar, aviso, prog, posicao, quantidade, h2, L, trocarIr, type Opcoes } from './inventario-v2';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import pkgX from 'lucide-static/icons/package-x.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import triangle from 'lucide-static/icons/triangle-alert.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import serverOff from 'lucide-static/icons/server-off.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import userPlus from 'lucide-static/icons/user-plus.svg?raw';
import userRound from 'lucide-static/icons/user-round.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import radio from 'lucide-static/icons/radio.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import keyboard from 'lucide-static/icons/keyboard.svg?raw';
import repeat from 'lucide-static/icons/repeat.svg?raw';

/* ---------- os dados de exemplo: as chegadas registadas e as guias que nasceram delas ---------- */
type EstGuia = 'atribuir' | 'curso' | 'excecao' | 'feita';
interface Linha { ref: string; desc: string; q: number }
interface Guia { ref: string; ch: string; paletes: number; origem: string; destino: string; quem: string; est: EstGuia; linhas: Linha[]; feitas: number; motivo?: string; hora?: string }
export const GUIAS: Guia[] = [
  { ref: 'GA-2026-0331', ch: 'CH-2026-0412', paletes: 2, origem: 'Cais 1', destino: '60101203', quem: '', est: 'atribuir', feitas: 0, linhas: [{ ref: 'SKF 6205-2RSH', desc: 'Rolamento rígido de esferas', q: 40 }, { ref: 'SKF VKBA 6556', desc: 'Kit de rolamento de roda', q: 12 }, { ref: 'SKF 6206-2Z', desc: 'Rolamento rígido de esferas', q: 30 }] },
  { ref: 'GA-2026-0330', ch: 'CH-2026-0411', paletes: 1, origem: 'Cais 2', destino: '60120401', quem: 'Inês Rocha', est: 'curso', feitas: 1, linhas: [{ ref: 'CR 30x47x7', desc: 'Retentor de cambota', q: 20 }, { ref: 'CR 35x52x7', desc: 'Retentor de cambota', q: 16 }] },
  { ref: 'GA-2026-0329', ch: 'CH-2026-0411', paletes: 1, origem: 'Cais 2', destino: '60300104', quem: '', est: 'excecao', feitas: 0, motivo: 'Destino em contagem: zona 30 (INV-2026-014)', linhas: [{ ref: 'TRW GDB1330', desc: 'Pastilhas de travão', q: 24 }] },
  { ref: 'GA-2026-0328', ch: 'CH-2026-0410', paletes: 1, origem: 'Cais 1', destino: '60210302', quem: 'Inês Rocha', est: 'excecao', feitas: 0, motivo: 'Quantidade diferente: 12 na guia, 10 arrumadas', linhas: [{ ref: 'NGK BKR6E', desc: 'Vela de ignição', q: 12 }] },
  { ref: 'GA-2026-0327', ch: 'CH-2026-0410', paletes: 1, origem: 'Cais 1', destino: '60100802', quem: 'Inês Rocha', est: 'feita', feitas: 2, hora: '08:12', linhas: [{ ref: 'SKF 6204-2RSH', desc: 'Rolamento rígido de esferas', q: 50 }, { ref: 'SKF VKMV 6PK1873', desc: 'Correia poli-V', q: 10 }] },
  /* 28 out. (Gestor v3): uma guia de um artigo, por atribuir — a que o Gestor arruma ele próprio no 81 */
  { ref: 'GA-2026-0332', ch: 'CH-2026-0412', paletes: 1, origem: 'Cais 1', destino: '60100305', quem: '', est: 'atribuir', feitas: 0, linhas: [{ ref: 'SKF 6205-2Z', desc: 'Rolamento rígido de esferas', q: 30 }] },
];
export const RESUMO_ARRUMACAO = { porArrumar: GUIAS.filter((g) => g.est === 'atribuir').length, emCurso: GUIAS.filter((g) => g.est === 'curso').length, problemas: GUIAS.filter((g) => g.est === 'excecao').length };
const un = (g: Guia) => g.linhas.reduce((s, l) => s + l.q, 0);

/* ---------- a cena: a caixa sai da entrada e vai à prateleira (uma vez; com «reduzir movimento», parada) ---------- */
export const cenaArrumacao = (mini = false) => `<svg class="gi-cena${mini ? ' gi-cena--mini' : ''}" viewBox="0 0 120 56" fill="none" aria-hidden="true" focusable="false">
    <path class="gi-cena__chao" d="M4 50h112"/><path class="gi-cena__cais" d="M6 50V30h22v20"/><path class="gi-cena__seta" d="M34 40h22"/>
    <path class="gi-cena__estante" d="M74 50V8M114 50V8M74 22h40M74 36h40M74 50h40"/>
    <rect class="gi-cena__alvo" x="96" y="25" width="15" height="9" rx="1.5"/>
    <g class="gi-cena__caixa"><rect x="10" y="34" width="14" height="12" rx="1.5"/><path d="M10 39h14M17 34v5"/></g>
  </svg>`;

/* ---------- peças ---------- */
const TAG: Record<EstGuia, [string, string]> = { atribuir: ['Por atribuir', 'planeada'], curso: ['Em curso', 'curso'], excecao: ['Exceção', 'erro'], feita: ['Concluída', 'ok'] };
const percurso = (g: Guia) => `<p class="gi-percurso"><span>${L(truck)}${g.origem}</span>${L(arrowRight, 'gi-percurso__seta')}${posicao(g.destino, `gi-pos--peq${g.est === 'excecao' && g.motivo?.startsWith('Destino') ? ' gi-pos--erro' : ''}`)}</p>`;
function cartao(g: Guia, i: number, aberta = false): string {
  const [t, k] = TAG[g.est];
  return `<li style="--i:${i}"><details class="gi-exp gi-guia gi-guia--${g.est}"${aberta ? ' open' : ''}><summary class="gi-exp__s">
    <span class="gi-exp__topo"><b>${g.ref}</b><span class="gp-tag gp-tag--${k}">${t}</span></span>
    <small>${g.paletes} ${g.paletes === 1 ? 'palete' : 'paletes'} · ${g.linhas.length} ${g.linhas.length === 1 ? 'artigo' : 'artigos'} · ${un(g)} un. · da ${g.ch}</small>
    ${percurso(g)}
    ${g.motivo ? `<p class="gi-guia__mot">${L(triangle)}${g.motivo}</p>` : ''}
    <span class="gi-exp__quem">${L(userRound)}${g.quem || 'Sem pessoa'}${g.est === 'curso' ? ` · ${g.feitas} de ${g.linhas.length} artigos` : g.hora ? ` · às ${g.hora}` : ''}${L(chevronDown, 'gi-exp__seta')}</span></summary>
    <div class="gi-exp__c"><ul class="gi-linhas" role="list">${g.linhas.map((l) => `<li class="gi-linha"><div><b>${l.ref}</b><span>${l.desc}</span></div><div class="gi-linha__q"><b>${l.q} un.</b></div></li>`).join('')}</ul>
      ${g.est === 'feita' ? '' : `<button type="button" class="gp-btn gp-btn--acao" data-ir="${g.est === 'atribuir' ? 'arr-guia' : g.est === 'curso' ? 'arr-acompanhar' : g.motivo?.startsWith('Destino') ? 'arr-guia-bloqueada' : 'arr-excecoes'}">${L(g.est === 'atribuir' ? userPlus : g.est === 'curso' ? list : triangle)}<span>${g.est === 'atribuir' ? 'Abrir e atribuir' : g.est === 'curso' ? 'Acompanhar' : 'Resolver'}</span></button>`}</div></details></li>`;
}
const faixa = () => `<dl class="gi-faixa"><div><dd>${RESUMO_ARRUMACAO.porArrumar}</dd><dt>Por arrumar</dt></div><div><dd>${RESUMO_ARRUMACAO.emCurso}</dd><dt>Em execução</dt></div><div class="is-erro"><dd>${RESUMO_ARRUMACAO.problemas}</dd><dt>Com problemas</dt></div></dl>`;
const G = (titulo: string, voltar = 'arr-inicio'): Opcoes => ({ titulo, voltar, gestor: true, funcao: 'Gestor' });

/* =========================================================
   70 · Arrumação (Gestor)
   ========================================================= */
const SEPS: [EstGuia, string][] = [['atribuir', 'Por atribuir'], ['curso', 'Em curso'], ['excecao', 'Exceções'], ['feita', 'Concluídas']];
export function arrumacaoInicio(cen: 'normal' | 'vazia' = 'normal', barra?: string): string {
  const gs = cen === 'vazia' ? [] : GUIAS;
  return ecra(`<h1 class="gp-titulo">Arrumação</h1>
    ${cen === 'vazia' ? `<section class="gi-vazio">${L(inbox)}<p><b>Nada por arrumar.</b> Quando a arrumação registar uma chegada no PDA, as guias aparecem aqui. O sistema não sabe o que vem antes disso.</p></section>`
    : `${faixa()}
    <div class="gp-filtros" role="tablist" aria-label="Estado">${SEPS.map(([k, t], i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-gi-sep="${k}">${t} <span>${gs.filter((g) => g.est === k).length}</span></button>`).join('')}</div>
    ${SEPS.map(([k], i) => `<ul class="gp-lista gi-sep" role="list" data-gi-painel="${k}"${i ? ' hidden' : ''}>${gs.filter((g) => g.est === k).map((g, j) => cartao(g, j, j === 0)).join('')}</ul>`).join('')}
`}`,
  barra ? { ...G('Arrumação'), voltar: undefined, barra, faixa: '' } : { ...G('Arrumação', 'gestor-inicio'), pe: `${sec('Exceções', triangle, ' data-ir="arr-excecoes"')}${sec('Histórico', history, ' data-ir="arr-historico"')}` });
}

/* =========================================================
   71 · Guia de arrumação: origem, artigos, destinos propostos, atribuir
   ========================================================= */
type E71 = 'normal' | 'bloqueada' | 'a-atribuir' | 'atribuida' | 'ja-atribuida' | 'sem-destino';
function guia(cen: E71 = 'normal'): string {
  const g = cen === 'bloqueada' ? GUIAS[2] : GUIAS[0];
  if (cen === 'atribuida') return ecra(`<section class="gi-movido" role="status">${cenaArrumacao()}<h1>${g.ref} na fila da Inês</h1><p>O servidor confirmou. A guia chega ao PDA dela quando acabar a GA-2026-0330; o motor regista a atribuição e o motivo.</p></section>`,
    { ...G('Guia'), pe: `${acao('Acompanhar a guia', list, ' data-ir="arr-acompanhar"')}${sec('Voltar à Arrumação', arrowLeft, ' data-ir="arr-inicio"')}` });
  if (cen === 'ja-atribuida') return ecra(aviso('aviso', repeat, `${g.ref} já tem pessoa`, 'O Luís Costa (gestor do turno) atribuiu-a à Inês Rocha há instantes. Não se atribui duas vezes.'), { ...G('Guia'), pe: acao('Acompanhar a guia', list, ' data-ir="arr-acompanhar"') });
  const destinos: [string, string, string][] = cen === 'bloqueada'
    ? [['60300104', 'Proposto antes', 'bloq'], ['60301101', 'Zona 30 · mesma família', 'bloq'], ['60120402', 'Zona 12 · livre', 'ok']]
    : cen === 'sem-destino' ? [] : [['60101203', 'Proposto · onde o artigo já está', 'ok'], ['60101204', 'Ao lado', 'ok'], ['60100105', 'Posição inativa', 'inativa']];
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">${g.ref}</h1><span class="gp-tag gp-tag--${cen === 'bloqueada' ? 'erro' : 'planeada'}">${cen === 'bloqueada' ? 'Exceção' : 'Por atribuir'}</span></div>
    <p class="gp-nota">Da ${g.ch} · registada por Joana Silva às 08:40 · ${g.paletes} ${g.paletes === 1 ? 'palete' : 'paletes'} no ${g.origem.toLowerCase()}</p>
    ${cen === 'bloqueada' ? aviso('erro', lock, 'O destino está em contagem', 'A 60300104 é da zona 30, que está a ser contada às cegas (INV-2026-014). Até a contagem fechar não se arruma lá: escolha outro destino.') : ''}
    <section class="gp-sec">${h2('Artigos', g.linhas.length)}<ul class="gi-linhas" role="list">${g.linhas.map((l) => `<li class="gi-linha"><div><b>${l.ref}</b><span>${l.desc}</span></div><div class="gi-linha__q"><b>${l.q} un.</b></div></li>`).join('')}</ul></section>
    <section class="gp-sec">${h2('Destino')}
      ${destinos.length ? `<ul class="gp-escolha" role="radiogroup" aria-label="Destino">${destinos.map(([p, t, k], i) => `<li><label class="gp-op gi-dest${k !== 'ok' ? ' is-ocupada' : ''}"><input type="radio" name="gi-dest"${(cen === 'bloqueada' ? i === 2 : i === 0) ? ' checked' : ''}${k !== 'ok' ? ' disabled' : ''}>${posicao(p, 'gi-pos--peq')}<span><small>${t}</small></span>${k === 'bloq' ? `<em class="is-nao">${L(lock)}Em contagem</em>` : k === 'inativa' ? '<em class="is-nao">Inativa</em>' : ''}</label></li>`).join('')}</ul>`
      : aviso('aviso', mapPin, 'Sem destino proposto', 'O motor não encontrou uma posição ativa da família destes artigos fora das zonas em contagem. Escreva a posição de destino.') + '<label class="gp-campo"><span>Posição de destino</span><input inputmode="numeric" placeholder="8 algarismos"></label>'}
      ${''}</section>
    <section class="gp-sec">${h2('Quem arruma')}
      <ul class="gp-escolha" role="radiogroup" aria-label="Quem arruma">${[['Deixar o motor escolher', 'M', 'Entrega a quem acabar primeiro', ''], ['Inês Rocha', 'IR', 'A seguir à GA-2026-0330, que acaba agora', ''], ['Joana Silva', 'JS', 'Na contagem INV-2026-014', 'o']].map(([q, ini, t, k], i) => `<li><label class="gp-op${k ? ' is-ocupada' : ''}"><input type="radio" name="gi-quem"${i === 1 ? ' checked' : ''}${k ? ' disabled' : ''}><span class="gp-av">${ini}</span><span><b>${q}</b><small>${t}</small></span></label></li>`).join('')}</ul>
      <label class="gp-campo"><span>Motivo (obrigatório ao escolher a pessoa)</span><input value="Cais 1 cheio: a Inês leva-a a seguir à que tem"></label></section>`,
  { ...G('Guia'), pe: cen === 'a-atribuir' ? esperar('A atribuir…') : acao(cen === 'bloqueada' ? 'Mudar o destino' : 'Atribuir à Inês', cen === 'bloqueada' ? mapPin : userPlus, cen === 'bloqueada' ? ' data-ir="arr-guia"' : ' data-ir="arr-guia-atribuida"') });
}

/* =========================================================
   72 · Acompanhar a guia
   ========================================================= */
function acompanhar(cen: 'normal' | 'parcial' | 'concluida-outro' = 'normal'): string {
  const g = GUIAS[1];
  if (cen === 'concluida-outro') return ecra(aviso('info', circleCheck, `${g.ref} concluída noutro PDA`, 'A Inês acabou-a no PDA 24193B1FFC às 10:58. O movimento está confirmado pelo servidor.'), { ...G('Acompanhar'), pe: acao('Voltar à Arrumação', arrowLeft, ' data-ir="arr-inicio"') });
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">${g.ref}</h1><span class="gp-tag gp-tag--curso">Em curso</span></div>
    <p class="gp-nota">Da ${g.ch} · ${g.origem} · Inês Rocha desde as 10:31</p>
    ${percurso(g)}
    ${prog(g.feitas, g.linhas.length, 'Artigos arrumados')}
    <ul class="gi-secoes" role="list">${g.linhas.map((l, i) => `<li class="gi-secao ${i < g.feitas ? 'is-feita' : 'is-atual'}"><span><b>${l.ref}</b><small>${l.desc} · ${l.q} un.</small></span>${i < g.feitas ? `<span class="gp-tag gp-tag--ok">${L(check)}${cen === 'parcial' && i === 0 ? '14 de 20 · parcial' : 'Arrumado'}</span>` : '<span class="gp-tag gp-tag--planeada">Por arrumar</span>'}</li>`).join('')}</ul>
    ${cen === 'parcial' ? aviso('aviso', triangle, 'Arrumação parcial', 'Couberam 14 de 20 na 60120401. As 6 que faltam ficam na guia, no cais 2; o motor propõe outro destino para elas.') : ''}
    ${''}`,
  { ...G('Acompanhar'), pe: `${sec('Reatribuir', repeat, ' data-ir="arr-guia"')}${sec('Ver a guia', list, ' data-ir="arr-inicio"')}` });
}

/* =========================================================
   73 · Exceções · 74 · Histórico
   ========================================================= */
function excecoes(cen: 'normal' | 'vazia' = 'normal'): string {
  const xs: [string, string, string, string, string][] = cen === 'vazia' ? [] : [
    [lock, 'Destino em contagem', 'GA-2026-0329 → 60300104 · zona 30 às cegas', 'Mudar o destino', 'arr-guia-bloqueada'],
    [triangle, 'Quantidade diferente', 'GA-2026-0328 · NGK BKR6E · 12 na guia, 10 arrumadas', 'Ver o movimento', 'arr-op-parcial'],
    [serverOff, 'Movimento recusado', 'GA-2026-0326 · o servidor recusou o destino 60100105 (inativa)', 'Rever a guia', 'arr-guia-sem-destino'],
  ];
  return ecra(`<h1 class="gp-titulo">Exceções</h1>
    ${xs.length ? `<ul class="gp-lista" role="list">${xs.map(([ic, t, x, b, ir], i) => `<li style="--i:${i}"><div class="gi-exc"><span class="gi-exc__ic">${L(ic)}</span><div><b>${t}</b><small>${x}</small></div><button type="button" class="gp-btn gp-btn--acao" data-ir="${ir}">${L(arrowRight)}<span>${b}</span></button></div></li>`).join('')}</ul>`
    : `<p class="gp-vazio">${L(check)}Sem exceções na arrumação.</p>`}
    ${''}`, G('Exceções'));
}
function historico(): string {
  return ecra(`<h1 class="gp-titulo">Histórico</h1>
    <ul class="gp-lista" role="list">${[GUIAS[4], { ...GUIAS[1], ref: 'GA-2026-0325', est: 'feita' as const, hora: '07:50', feitas: 2 }].map((g, i) => `<li style="--i:${i}"><div class="gp-inv-card"><p><b>${g.ref}</b><span class="gp-tag gp-tag--ok">Concluída</span></p><small>${g.linhas.length} artigos · ${un(g)} un. · ${g.quem} · às ${g.hora}</small>${percurso(g)}</div></li>`).join('')}</ul>
    ${''}`, G('Histórico'));
}

/* =========================================================
   80 · Arrumar (operador): origem → artigo → destino → quantidade → concluir
   ========================================================= */
type E80 = 'origem' | 'artigo' | 'destino' | 'quantidade' | 'a-confirmar' | 'confirmado' | 'destino-errado' | 'artigo-errado' | 'bloqueada' | 'parcial' | 'desconhecida' | 'recusado' | 'sem-leitor' | 'sem-rede' | 'sessao' | 'concluida-outro';
const PASSOS80 = ['Origem', 'Artigo', 'Destino', 'Quant.'];
const passos80 = (n: number) => `<ol class="gi-passos" aria-label="Passos da arrumação">${PASSOS80.map((p, i) => `<li class="${i < n ? 'is-feito' : i === n ? 'is-atual' : ''}"${i === n ? ' aria-current="step"' : ''}><i aria-hidden="true"></i><span>${p}</span></li>`).join('')}</ol>`;
const PASSO: Partial<Record<E80, number>> = { origem: 0, artigo: 1, destino: 2, quantidade: 3, 'a-confirmar': 3, 'destino-errado': 2, 'artigo-errado': 1, bloqueada: 2, parcial: 3, desconhecida: 2 };
/** 28 out. (Gestor v3): o Gestor arruma com o MESMO ecrã — `op` muda a conta, `ids` as ligações, `gi`/`li` a guia e o artigo. */
export function arrumar(e: E80 = 'origem', op: Opcoes = {}, ids: Record<string, string> = {}, gi = 1, li = 1): string {
  const g = GUIAS[gi], l = g.linhas[li], o: Opcoes = { titulo: 'Arrumar', funcao: 'Arrumação', quem: { nome: 'Inês Rocha', iniciais: 'IR' }, ...op }, ultimo = li === g.linhas.length - 1;
  const faixaLer = (tom: string, ic: string, t: string, x: string, ir = '') => `<button type="button" class="gi-faixa-ler gi-faixa-ler--${tom}" data-ler="1" data-tipo-leitura="arrumar"${ir ? ` data-depois="${ir}"` : ''}><span class="gi-faixa-ler__ic">${L(ic)}</span><span><b>${t}</b><small>${x}</small></span>${tom === 'pronto' ? '<i class="gi-faixa-ler__varre" aria-hidden="true"></i>' : ''}</button>`;
  const topo = `<p class="gi-ler-inv"><b>${g.ref}</b><span>${g.origem} → ${g.destino.slice(0, 4)}… · artigo ${li + 1} de ${g.linhas.length}</span></p>${PASSO[e] !== undefined ? passos80(PASSO[e]!) : ''}`;
  const art = `<section class="gi-artigo"><span class="gi-artigo__ic">${L(pkg)}</span><div><p class="gi-artigo__ref">${l.ref}</p><p class="gi-artigo__desc">${l.desc}</p><p class="gi-artigo__meta">${l.q} un. na guia</p></div></section>`;
  const dest = `<div class="gi-ler-pos">${L(mapPin)}<span class="gi-mini-r">Destino</span>${posicao(g.destino, 'gi-pos--peq')}</div>`;
  const C: Record<E80, () => [string, string]> = {
    origem: () => [`${faixaLer('pronto', scanBarcode, `Leia a palete no ${g.origem.toLowerCase()}`, `A etiqueta da palete da ${g.ch}`, 'arr-op-artigo')}${dest}`, sec('Escrever à mão', keyboard)],
    artigo: () => [`${faixaLer('pronto', scanBarcode, 'Leia o artigo', `Na palete: ${l.ref}`, 'arr-op-destino')}${dest}`, sec('Escrever à mão', keyboard)],
    destino: () => [`${art}${faixaLer('pronto', mapPin, 'Leia a posição de destino', 'Só a posição desta guia aceita o movimento', 'arr-op-quantidade')}${dest}`, sec('O destino está cheio', triangle, ' data-ir="arr-op-parcial"')],
    quantidade: () => [`${faixaLer('lido', circleCheck, 'Destino certo', `${g.destino} lida`)}${art}${quantidade(String(l.q), { teclado: false, rotulo: 'Quantas arrumou aqui?' })}`, acao('Confirmar o movimento', check, ' data-confirmar data-ir="arr-op-confirmado"')],
    'a-confirmar': () => [`${art}${quantidade(String(l.q), { teclado: false, rotulo: 'Quantas arrumou aqui?' })}`, esperar('A confirmar…')],
    confirmado: () => [`<section class="gi-movido" role="status">${cenaArrumacao()}<h1>Movimento confirmado</h1><p>${l.q} un. de ${l.ref} na ${g.destino}. O servidor confirmou; ${ultimo ? 'a guia está concluída' : `falta${g.linhas.length - li - 1 === 1 ? '' : 'm'} ${g.linhas.length - li - 1} ${g.linhas.length - li - 1 === 1 ? 'artigo' : 'artigos'} desta guia`}.</p></section>`, (ultimo ? acao('Começar a tarefa seguinte', arrowRight, ' data-ir="op-inicio"') : acao('Artigo seguinte', arrowRight, ' data-ir="arr-op-artigo"'))],
    'destino-errado': () => [`${faixaLer('erro', mapPin, 'Este não é o destino da guia', 'Leu 60120403')}${aviso('erro', mapPin, 'O movimento não se confirma aqui', `A guia pede a <b>${g.destino}</b>. Não se arruma numa posição que a guia não autoriza.`)}${dest}`, acao('Ler o destino certo', scanBarcode, ' data-ir="arr-op-destino"')],
    'artigo-errado': () => [`${faixaLer('erro', pkgX, 'Este artigo não é da guia', 'Leu SKF 6205-2RSH')}${aviso('erro', pkgX, 'Não está nesta guia', `A GA-2026-0330 tem ${g.linhas.map((x) => x.ref).join(' e ')}. Deixe este na palete.`)}`, acao('Ler outro artigo', scanBarcode, ' data-ir="arr-op-artigo"')],
    bloqueada: () => [`${faixaLer('erro', lock, 'Destino em contagem', 'Zona 30 · INV-2026-014')}${aviso('erro', lock, 'Não se arruma numa zona em contagem', 'A 60300104 está a ser contada às cegas. O gestor foi avisado e o motor propõe outro destino.')}`, acao('Pedir outro destino', refresh, ' data-ir="arr-op-destino"')],
    parcial: () => [`${art}${quantidade('14', { teclado: false, rotulo: 'Quantas couberam?' })}${aviso('aviso', triangle, 'Arrumação parcial', 'Confirma 14 de 16. As 2 que faltam ficam na guia, no cais; o motor propõe outro destino para elas.')}`, acao('Confirmar 14', check, ' data-ir="arr-op-confirmado"')],
    desconhecida: () => [`${faixaLer('erro', pkgX, 'Posição desconhecida', 'Leu 60999999')}${aviso('erro', mapPin, 'Esta posição não existe no armazém 60', 'Leia a etiqueta da posição de destino; se estiver estragada, avise o gestor.')}`, acao('Ler outra vez', scanBarcode, ' data-ir="arr-op-destino"')],
    recusado: () => [`${aviso('erro', serverOff, 'O servidor recusou o movimento', 'A posição 60120401 foi desativada há instantes. Nada se moveu; o motor propõe outro destino.')}${art}`, acao('Pedir outro destino', refresh, ' data-ir="arr-op-destino"')],
    'sem-leitor': () => [`${faixaLer('erro', radio, 'Leitor indisponível', 'A tecla de leitura não envia códigos')}`, `${acao('Reiniciar o leitor', refresh)}${sec('Escrever à mão', keyboard)}`],
    'sem-rede': () => [`${aviso('erro', wifiOff, 'A Pick parou: sem rede', 'Sem rede nada se confirma e nada fica à espera no PDA. A palete fica onde está.')}<p class="gi-estado" role="status"><span class="girador girador--pequeno" aria-hidden="true"></span>A procurar rede…</p>`, acao('Tentar outra vez', refresh)],
    sessao: () => [aviso('aviso', clock, 'A sessão terminou', 'Entre outra vez; a guia continua sua, no mesmo artigo.'), acao('Entrar outra vez', logIn, ' data-login')],
    'concluida-outro': () => [aviso('info', circleCheck, 'Esta guia já foi concluída', 'Foi acabada noutro PDA às 10:58. Não há nada a arrumar aqui.'), acao('Começar a tarefa seguinte', arrowRight, ' data-ir="op-inicio"')],
  };
  const [corpo, pe] = C[e]();
  return trocarIr(ecra(`${e === 'confirmado' || e === 'sem-rede' || e === 'sessao' || e === 'concluida-outro' ? '' : topo}${corpo}`, { ...o, rede: e !== 'sem-rede', pe }), ids);
}

/* =========================================================
   Os ecrãs
   ========================================================= */
export type IdArrumacao = `arr-${string}`;
const NOTA = 'Do briefing «ROMAFE Warehouse V2 — Manager Inventory & Putaway» (27 out.), no Figma e só com rede: a chegada não é prevista, uma tarefa é uma guia, o motor atribui, sem mapa nem capacidades inventadas, e os destinos em contagem ficam bloqueados.';
export function ecrasArrumacao(): Ecra<string>[] {
  const e = (id: string, nome: string, objetivo: string, html: string, de?: string): Ecra<string> => ({ id, nome, fluxo: 'Arrumação', objetivo, ...(de ? { estadoDe: de } : {}), versoes: [{ id: 'v1', nota: NOTA, html }] });
  const OP: [E80, string, string][] = [
    ['artigo', '80.1 · Ler o artigo', 'A palete certa: lê-se o artigo da guia.'], ['destino', '80.2 · Ler o destino', 'O artigo lido: lê-se a posição de destino; só a da guia aceita.'],
    ['quantidade', '80.3 · Confirmar a quantidade', 'Destino certo: quantas se arrumaram ali.'], ['a-confirmar', '80.4 · A confirmar', 'Só o botão espera; a caixa não anda antes da confirmação.'],
    ['confirmado', '80.5 · Movimento confirmado', 'O servidor confirmou: a caixa vai à prateleira e a guia fecha.'], ['destino-errado', '80.6 · Destino errado', 'Outra posição: não se confirma onde a guia não autoriza.'],
    ['artigo-errado', '80.7 · Artigo errado', 'Um artigo que não é da guia: fica na palete.'], ['bloqueada', '80.8 · Destino em contagem', 'A zona está em contagem às cegas: não se arruma lá; o motor propõe outro.'],
    ['parcial', '80.9 · Arrumação parcial', 'Não coube tudo: confirma-se o que coube; o resto fica na guia.'], ['desconhecida', '80.10 · Posição desconhecida', 'A posição lida não existe: ler outra vez.'],
    ['recusado', '80.11 · Movimento recusado', 'O servidor recusou (posição desativada): nada se moveu.'], ['sem-leitor', '80.12 · Leitor indisponível', 'Reiniciar ou escrever à mão (marcado como escrito).'],
    ['sem-rede', '80.13 · Sem rede', 'A Pick para; nada fica à espera no PDA.'], ['sessao', '80.14 · Sessão terminada', 'Entrar outra vez; a guia continua no mesmo artigo.'],
    ['concluida-outro', '80.15 · Concluída noutro PDA', 'A guia já foi acabada: segue-se para a tarefa seguinte.'],
  ];
  const carga = (o: Opcoes) => ecra(`<p class="gi-estado" role="status"><span class="girador girador--pequeno" aria-hidden="true"></span>A carregar…</p><div class="gp-esq"><i></i><i></i><i></i></div>`, o);
  const semRede = (o: Opcoes) => ecra(aviso('erro', wifiOff, 'Sem rede', 'A Pick precisa de rede: não mostra guias velhas como se fossem de agora. Continua quando houver sinal.'), { ...o, rede: false, pe: acao('Tentar outra vez', refresh) });
  const servidor = (o: Opcoes) => ecra(aviso('erro', serverOff, 'O servidor não respondeu', 'Não foi possível ler as guias. Nada mudou.') + '<p class="gi-ref">Referência <code>PK-2710-A7E0</code></p>', { ...o, pe: acao('Tentar outra vez', refresh) });
  const semPerm = (o: Opcoes) => ecra(aviso('erro', userRound, 'Sem permissão', 'Gerir a arrumação é do gestor. A arrumação recebe as guias pelo motor, no início.'), { ...o, pe: acao('Voltar ao início', arrowLeft, ' data-ir="op-inicio"') });
  return [
    e('arr-inicio', '70 · Arrumação (Gestor)', 'O espaço de trabalho da arrumação: a caixa que vai da entrada à prateleira, a faixa (por arrumar · em execução · com problemas), os separadores e as guias que se abrem no sítio (origem → destino, artigos, quem, ação).', arrumacaoInicio()),
    e('arr-vazia', '70.1 · Nada por arrumar', 'Sem guias: diz-se que aparecem quando a arrumação registar uma chegada.', arrumacaoInicio('vazia'), 'arr-inicio'),
    e('arr-carregar', '70.2 · A carregar', 'As guias a chegar.', carga(G('Arrumação', 'gestor-inicio')), 'arr-inicio'),
    e('arr-sem-rede', '70.3 · Sem rede', 'A Pick para e espera.', semRede(G('Arrumação', 'gestor-inicio')), 'arr-inicio'),
    e('arr-erro', '70.4 · Não carregou', 'O servidor não respondeu.', servidor(G('Arrumação', 'gestor-inicio')), 'arr-inicio'),
    e('arr-permissao', '70.5 · Aberto pela Arrumação', 'Gerir é do gestor: a arrumação recebe as guias pelo motor.', semPerm({ titulo: 'Arrumação', funcao: 'Arrumação' }), 'arr-inicio'),
    e('arr-guia', '71 · Guia de arrumação', 'Uma guia por atribuir: de que chegada vem, os artigos, os destinos propostos (ativos, do armazém 60, fora das zonas em contagem) e quem arruma — o motor, ou uma pessoa com motivo.', guia()),
    e('arr-guia-bloqueada', '71.1 · Destino em contagem', 'O destino proposto ficou numa zona em contagem às cegas: escolhe-se outro.', guia('bloqueada'), 'arr-guia'),
    e('arr-guia-sem-destino', '71.2 · Sem destino proposto', 'O motor não encontrou posição: escreve-se o destino.', guia('sem-destino'), 'arr-guia'),
    e('arr-guia-a-atribuir', '71.3 · A atribuir', 'O servidor atribui; nada se mostra antes.', guia('a-atribuir'), 'arr-guia'),
    e('arr-guia-atribuida', '71.4 · Atribuída', 'Confirmado: a guia vai para a fila da Inês (a caixa anda depois da confirmação).', guia('atribuida'), 'arr-guia'),
    e('arr-guia-ja-atribuida', '71.5 · Já tinha pessoa', 'Outro gestor atribuiu-a entretanto: não se atribui duas vezes.', guia('ja-atribuida'), 'arr-guia'),
    e('arr-acompanhar', '72 · Acompanhar a guia', 'Uma guia em curso: quem, desde quando, o percurso e o que o servidor já confirmou.', acompanhar()),
    e('arr-acompanhar-parcial', '72.1 · Parcial', 'Não coube tudo no destino: o que falta fica na guia, e o motor propõe outro destino.', acompanhar('parcial'), 'arr-acompanhar'),
    e('arr-acompanhar-outro', '72.2 · Concluída noutro PDA', 'Foi acabada noutro PDA: diz-se onde e quando.', acompanhar('concluida-outro'), 'arr-acompanhar'),
    e('arr-excecoes', '73 · Exceções da arrumação', 'Destino em contagem, quantidade diferente e movimento recusado, cada uma com a ação certa.', excecoes()),
    e('arr-excecoes-vazia', '73.1 · Sem exceções', 'Nada para resolver.', excecoes('vazia'), 'arr-excecoes'),
    e('arr-historico', '74 · Histórico da arrumação', 'Os movimentos confirmados pelo servidor.', historico()),
    e('arr-op', '80 · Arrumar (Arrumação)', 'A guia no PDA de quem arruma: ler a palete na origem → o artigo → o destino → a quantidade → confirmar; só o destino da guia aceita o movimento.', arrumar()),
    ...OP.map(([k, nome, objetivo]) => e(`arr-op-${k}`, nome, objetivo, arrumar(k), 'arr-op')),
  ];
}
