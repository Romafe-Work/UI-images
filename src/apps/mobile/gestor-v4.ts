/* =========================================================
   PICK — o Centro de operações do Gestor (28 out. 2026)
   Do briefing dela «ROMAFE Warehouse — Ultimate Manager Experience»: o Gestor vê tudo, acompanha as equipas, consulta
   insights das quatro operações e executa qualquer tarefa, sem mudar de perfil; e «monta todos os possíveis estados do
   ecrã». Responde a três perguntas: o que está a acontecer, o que precisa de mim, o que faço agora.
     - 60 v5 · Centro de operações: o estado do armazém (hoje, dito), as quatro operações (o que está por fazer e o
       estado que mais importa), «Requer atenção» e «O que fazer agora» com o porquê de cada sugestão (regras à vista,
       não adivinhas);
     - a barra: Início · Tarefas · Ler · Insights · Mais (as Operações passam para os cartões do Início e para o Mais);
     - 65 v3 · Todas as tarefas: operação, estado, zona e responsável; cada uma com o «desde» e a ação seguinte;
     - 77 · Equipa: quem está em quê, pelas tarefas atribuídas e pelos eventos confirmados — sem presença inventada,
       sem localização, sem ranking;
     - 78 · Insights: o período (hoje, 7 dias, 30 dias, outro) e a vista (geral, as quatro operações, a equipa);
       todas as medidas no mesmo período, os «agora» ditos como tal; um gráfico só; cada insight diz o que aconteceu,
       porquê importa, a regra, e leva às tarefas.
   O que fica de fora, e porquê: sincronização e «por sincronizar» (a Pick não trabalha sem rede), notificações (não há
   serviço de avisos), escolher armazém (só há o 60), prioridades e prazos (não estão definidos no armazém), percentagens
   de âmbito incompleto. Os números são de exemplo e saem todos das mesmas listas (gestor-v3.ts), para baterem certo.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { ecra, acao, sec, esperar, aviso, nota, prog, h2, L, type Opcoes } from './inventario-v2';
import { barra } from './navegacao';
import { carregar as eCarregar, semRede as eSemRede, servidor as eServidor, sessao as eSessao } from './inventario-estados';
import { TAREFAS, MODULOS, ICONE_MOD, type TarefaG, type TipoT, type Modulo } from './gestor-v3';
import { CAIXA } from './cena';
import pkg from 'lucide-static/icons/package.svg?raw';
import pkgOpen from 'lucide-static/icons/package-open.svg?raw';
import basket from 'lucide-static/icons/shopping-basket.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import triangle from 'lucide-static/icons/triangle-alert.svg?raw';
import userRound from 'lucide-static/icons/user-round.svg?raw';
import userPlus from 'lucide-static/icons/user-plus.svg?raw';
import users from 'lucide-static/icons/users.svg?raw';
import repeat from 'lucide-static/icons/repeat.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import lifeBuoy from 'lucide-static/icons/life-buoy.svg?raw';
import logOut from 'lucide-static/icons/log-out.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import lightbulb from 'lucide-static/icons/lightbulb.svg?raw';
import serverOff from 'lucide-static/icons/server-off.svg?raw';
import calendar from 'lucide-static/icons/calendar-days.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import chartColumn from 'lucide-static/icons/chart-column.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';

const AGORA = '10:45';
const G = (titulo: string, ativo: string, o: Opcoes = {}): Opcoes => ({ titulo, gestor: true, funcao: 'Gestor', barra: barra('gestor', ativo), ...o });
const TIPO_MOD: Record<TipoT, Modulo> = { inventario: 'inv', arrumacao: 'arr', separacao: 'sep', expedicao: 'exp' };
const NOME_T: Record<TipoT, string> = { inventario: 'Inventário', arrumacao: 'Arrumação', separacao: 'Separação', expedicao: 'Expedição' };
const IC_T: Record<TipoT, string> = { inventario: pkg, arrumacao: pkgOpen, separacao: basket, expedicao: truck };
const n = (k: TarefaG['est']) => TAREFAS.filter((x) => x.est === k).length;
/** Concluídas hoje (eventos confirmados): GA-2026-0327 às 08:12, GS13454205 expedida às 08:30, GS13454209 pousada às 09:40. */
const CONCLUIDAS_HOJE = 3;
const linhaItem = (ic: string, t: string, x: string, ir: string, tom = '') => `<li><button type="button" class="gp-item${tom ? ` gp-item--${tom}` : ''}" data-ir="${ir}"><span class="gp-item-ic">${L(ic)}</span><span class="gp-item-t"><b>${t}</b><small>${x}</small></span>${L(arrowRight, 'gi-seta')}</button></li>`;

/* =========================================================
   60 v5 · Centro de operações
   ========================================================= */
/** O estado do armazém: quatro números, todos de hoje até agora, e cada um leva às tarefas dele. */
const estado = (o: { zero?: boolean; carregar?: boolean } = {}) => {
  const xs: [string, number, string, string][] = [['Em curso', n('curso'), 'g-tarefas-curso', ''], ['Por fazer', n('fazer'), 'g-tarefas', ''], ['Exceções', n('atencao'), 'g-tarefas-atencao', 'erro'], ['Concluídas', CONCLUIDAS_HOJE, 'g-insights', 'ok']];
  return `<section class="gx-estado" aria-labelledby="gx-estado-t"><p class="gx-estado__cab"><b id="gx-estado-t">Estado do armazém</b><span>${L(clock)}Hoje, até às ${AGORA}</span></p>
    <div class="gx-estado__l">${xs.map(([t, k, ir, tom]) => `<button type="button" class="gx-num${tom ? ` is-${tom}` : ''}" data-ir="${ir}"${o.carregar ? ' disabled' : ''}><b>${o.carregar ? '<i class="gx-esq"></i>' : o.zero ? 0 : k}</b><span>${t}</span></button>`).join('')}</div></section>`;
};
/** Por módulo: o que está por fazer ou pede atenção, e o estado que mais importa. */
const ESTADO_MOD: Record<Modulo, string> = { inv: '1 por validar há 10 dias', arr: '2 por atribuir', sep: '1 guia com falta', exp: '2 prontas para recolher' };
const abertas = (m: Modulo) => TAREFAS.filter((x) => TIPO_MOD[x.tipo] === m && x.est !== 'curso').length;
const tile = ([k, t, ir]: typeof MODULOS[number], i: number, zero = false) => `<li style="--i:${i}"><button type="button" class="gx-mod gx-mod--${k}" data-ir="${ir}" aria-label="${t}: ${zero ? 'nada por fazer' : `${abertas(k)} por fazer, ${ESTADO_MOD[k]}`}">
    <span class="gi-mod__ic">${k === 'inv' ? CAIXA() : L(ICONE_MOD[k])}</span><b>${t}</b><span class="gx-mod__n"><strong>${zero ? 0 : abertas(k)}</strong> por fazer</span><small>${zero ? 'Nada pendente' : ESTADO_MOD[k]}</small></button></li>`;
/** A prioridade, explicada: a primeira regra que uma tarefa cumpre decide a ordem. */
const AGORA_FAZER: [string, string, string, string, string, string][] = [
  ['Validar o INV-2026-011', 'Submetido há 10 dias, com 2 divergências por decidir.', 'Validações paradas há mais de 24 h vêm primeiro: o stock da zona 21 fica por ajustar.', 'Validar', 'gestor-validar', 'shield'],
  ['Recolher a GS13454208', 'Pronta nos preparados desde as 09:12.', 'Guias prontas há mais de 1 h vêm a seguir: o cliente está à espera.', 'Recolher', 'g-exp-outra', 'truck'],
];
type ECentro = 'normal' | 'sem-atencao' | 'zero' | 'desatualizado' | 'carregar-parcial';
export function centro(e: ECentro = 'normal', b = barra('gestor', 'inicio')): string {
  const at = e === 'sem-atencao' || e === 'zero' ? [] : TAREFAS.filter((x) => x.est === 'atencao');
  const sug = e === 'zero' ? [] : e === 'sem-atencao' ? [['Separar a GS13454212', 'Por separar desde as 09:58; ninguém da separação está livre.', 'Sem exceções, vêm primeiro as guias de cliente sem pessoa.', 'Separar eu', 'g-sep-guia', 'basket'] as typeof AGORA_FAZER[number]] : AGORA_FAZER;
  return ecra(`${e === 'desatualizado' ? `<p class="gx-velho" role="status">${L(clock)}<span><b>Dados das 10:31.</b> O servidor não respondeu às duas últimas atualizações.</span><button type="button" class="gp-ligacao">${L(refresh)}Atualizar</button></p>` : ''}
    ${estado({ zero: e === 'zero', carregar: e === 'carregar-parcial' })}
    <section class="gp-sec">${h2('Operações')}<ul class="gx-mods" role="list">${MODULOS.map((m, i) => tile(m, i, e === 'zero')).join('')}</ul></section>
    <section class="gp-sec">${h2('Requer atenção', at.length || undefined)}
      ${e === 'carregar-parcial' ? '<div class="gp-esq"><i></i><i></i></div>' : at.length ? `<ul class="gp-lista" role="list">${at.slice(0, 3).map((x) => linhaItem(IC_T[x.tipo], `${x.ref} · ${NOME_T[x.tipo]}`, x.t, x.acao[1], 'erro')).join('')}</ul>${at.length > 3 ? `<button type="button" class="gp-ligacao" data-ir="g-tarefas-atencao">${L(list)}Ver as ${at.length} exceções</button>` : ''}`
      : `<p class="gp-vazio">${L(check)}Nada pede a sua atenção agora.</p>`}</section>
    <section class="gp-sec">${h2('O que fazer agora')}
      ${sug.length ? `<ol class="gx-agora" role="list">${sug.map(([t, x, porque, b2, ir, ic], i) => `<li style="--i:${i}"><div class="gx-agora__c"><span class="gx-agora__n">${i + 1}</span><div><b>${t}</b><small>${x}</small><p class="gx-porque">${L(lightbulb)}<span><b>Porquê:</b> ${porque}</span></p></div>
        <button type="button" class="gp-btn gp-btn--acao" data-ir="${ir}">${L(ic === 'truck' ? truck : ic === 'basket' ? basket : check)}<span>${b2}</span></button></div></li>`).join('')}</ol>`
      : `<p class="gp-vazio">${L(check)}Não há nada por fazer neste momento. As tarefas novas aparecem aqui quando o ERP as criar.</p>`}</section>`,
  { titulo: 'Centro de operações', gestor: true, funcao: 'Gestor', barra: b, rede: true });
}

/* =========================================================
   65 v3 · Todas as tarefas
   ========================================================= */
const EXTRA: Record<string, [string, string]> = {
  GS13454212: ['10 12 21', 'desde as 09:58'], 'GA-2026-0332': ['10', 'desde as 08:40'], 'GA-2026-0331': ['10', 'desde as 08:40'], 'INV-2026-015': ['10', 'desde 22/10'],
  GS13454209: ['prep', 'pronta desde as 09:40'], GS13454208: ['prep', 'pronta desde as 09:12'], 'INV-2026-014': ['30', 'desde 21/10'], 'GA-2026-0330': ['12', 'desde as 10:31'],
  GS13454211: ['10 12 21', 'desde as 10:12'], GS13454207: ['prep', 'desde as 10:05'], 'INV-2026-011': ['21', 'submetido a 18/10'], GS13454210: ['21', 'desde as 10:20'],
  'GA-2026-0329': ['30', 'desde as 09:02'], GS13454206: ['prep', 'desde as 09:55'],
};
const ZONAS: [string, string][] = [['10', 'Zona 10'], ['12', 'Zona 12'], ['21', 'Zona 21'], ['30', 'Zona 30'], ['prep', 'Preparados']];
const TAG_EST: Record<TarefaG['est'], [string, string]> = { fazer: ['Por fazer', 'planeada'], curso: ['Em curso', 'curso'], atencao: ['Exceção', 'erro'] };
type ETarefas = { sep?: TarefaG['est']; vazio?: boolean; filtro?: boolean; aviso?: string; semAtribuir?: boolean };
export function todasTarefas(o: ETarefas = {}): string {
  const SEPS: [TarefaG['est'], string][] = [['fazer', 'Por fazer'], ['curso', 'Em curso'], ['atencao', 'Exceções']];
  const sel = o.sep ?? 'fazer';
  const linha = (x: TarefaG, i: number) => { const [z, desde] = EXTRA[x.ref] ?? ['', ''], [te, tk] = TAG_EST[x.est], [b, ir, ic] = o.semAtribuir && x.acao[0] === 'Atribuir' ? ['Abrir', x.acao[1], list] : x.acao;
    return `<li style="--i:${i}" data-gi-tipo-l="${x.tipo}" data-gi-quem-l="${x.quem || '-'}" data-gi-zona-l="${z}"><div class="gx-tarefa">
      <p class="gx-tarefa__cab"><span class="gx-op-tag gx-op-tag--${x.tipo}">${L(IC_T[x.tipo])}${NOME_T[x.tipo]}</span><span class="gp-tag gp-tag--${tk}">${te}</span></p>
      <b class="gx-tarefa__ref">${x.ref}</b><small>${x.t}</small>${x.p ? prog(x.p[0], x.p[1], x.p[2]) : ''}
      <p class="gx-tarefa__meta"><span>${L(userRound)}${x.quem || 'Sem pessoa'}</span><span>${L(clock)}${desde}</span></p>
      <button type="button" class="gp-btn ${x.est === 'curso' ? 'gi-btn-sec' : 'gp-btn--acao'}" data-ir="${ir}">${L(ic)}<span>${b}</span></button></div></li>`; };
  const pessoas = [...new Set(TAREFAS.map((x) => x.quem).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
  const vazio = (k: string) => o.filtro ? `<li><section class="gi-vazio">${L(searchX)}<p><b>Nada com estes filtros.</b> A Zona 30 não tem nada ${k === 'curso' ? 'em curso' : 'por fazer'} da Separação. Mude a zona ou a operação.</p></section></li>` : `<li><p class="gp-vazio">${L(check)}Nenhuma tarefa ${SEPS.find((s) => s[0] === k)![1].toLowerCase()}.</p></li>`;
  return ecra(`<h1 class="gp-titulo">Todas as tarefas</h1>${o.aviso ?? ''}
    <div class="gx-filtros gx-filtros--3">
      <label class="gp-campo"><span>Operação</span><select data-gi-tipo-sel>${[['', 'Todas'], ['inventario', 'Inventário'], ['arrumacao', 'Arrumação'], ['separacao', 'Separação'], ['expedicao', 'Expedição']].map(([k, t]) => `<option value="${k}"${o.filtro && k === 'separacao' ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="gp-campo"><span>Zona</span><select data-gi-zona><option value="">Todas</option>${ZONAS.map(([k, t]) => `<option value="${k}"${o.filtro && k === '30' ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="gp-campo"><span>Responsável</span><select data-gi-quem><option value="">Todos</option><option value="-">Sem pessoa</option>${pessoas.map((p) => `<option>${p}</option>`).join('')}</select></label>
    </div>
    <div class="gp-filtros" role="tablist" aria-label="Estado">${SEPS.map(([k, t]) => `<button type="button" role="tab" aria-selected="${k === sel}" data-gi-sep="${k}">${t} <span>${o.vazio ? 0 : n(k)}</span></button>`).join('')}</div>
    ${SEPS.map(([k]) => { const xs = o.vazio || o.filtro ? [] : TAREFAS.filter((x) => x.est === k); return `<ul class="gp-lista gi-sep" role="list" data-gi-painel="${k}"${k === sel ? '' : ' hidden'}>${xs.length ? xs.map(linha).join('') : vazio(k)}</ul>`; }).join('')}
    ${nota('Armazém 60 · hoje. Cada tarefa mostra só a ação que o estado e as suas permissões permitem.')}`, G('Tarefas', 'tarefas'));
}

/* =========================================================
   77 · Equipa (pelas tarefas atribuídas e pelos eventos confirmados)
   ========================================================= */
interface Pessoa { k: string; nome: string; ini: string; funcao: string; agora: [string, string, string] | null; maos: number; feitas: string; exc: number }
const EQUIPA: Pessoa[] = [
  { k: 'ines', nome: 'Inês Rocha', ini: 'IR', funcao: 'Arrumação', agora: ['GA-2026-0330', 'Arrumação · 1 de 2 artigos · desde as 10:31', 'arr-acompanhar'], maos: 1, feitas: '1 guia', exc: 1 },
  { k: 'joana', nome: 'Joana Silva', ini: 'JS', funcao: 'Arrumação', agora: ['INV-2026-014', 'Contagem · 18 de 46 posições · desde 21/10', 'gestor-acompanhar'], maos: 1, feitas: '18 posições', exc: 1 },
  { k: 'luis', nome: 'Luís Costa', ini: 'LC', funcao: 'Gestor', agora: null, maos: 0, feitas: '—', exc: 0 },
  { k: 'paulo', nome: 'Paulo Reis', ini: 'PR', funcao: 'Expedição', agora: ['GS13454207', 'Expedição · recolhida às 10:05', 'g-exp-acomp-curso'], maos: 1, feitas: '1 guia', exc: 1 },
  { k: 'tiago', nome: 'Tiago Lopes', ini: 'TL', funcao: 'Separação', agora: ['GS13454211', 'Separação · 2 de 3 linhas · desde as 10:12', 'g-sep-guia-curso'], maos: 1, feitas: '1 guia', exc: 1 },
];
type EEquipa = 'normal' | 'vazia' | 'sem-tarefas';
function equipa(e: EEquipa = 'normal'): string {
  const ps = e === 'vazia' ? [] : e === 'sem-tarefas' ? EQUIPA.map((p) => ({ ...p, agora: null, maos: 0, feitas: '—', exc: 0 })) : EQUIPA;
  return ecra(`<h1 class="gp-titulo">Equipa</h1><p class="gp-nota">Armazém 60 · hoje · pelo que está atribuído e pelo que o servidor confirmou</p>
    ${ps.length ? `<ul class="gp-lista" role="list">${ps.map((p, i) => `<li style="--i:${i}"><button type="button" class="gx-pessoa" data-ir="${p.k === 'tiago' ? 'g-equipa-tiago' : p.k === 'luis' || !p.agora ? 'g-equipa-livre' : p.agora[2]}" aria-label="${p.k === 'tiago' || !p.agora ? `Ver ${p.nome}` : `Ver a tarefa de ${p.nome}: ${p.agora[0]}`}">
      <span class="gp-av">${p.ini}</span><span class="gx-pessoa__t"><b>${p.nome}</b><small>${p.funcao}</small>
      <span class="gx-pessoa__agora">${p.agora ? `${L(clock)}<span><b>${p.agora[0]}</b> · ${p.agora[1]}</span>` : `${L(check)}<span>Sem tarefa em mãos</span>`}</span>
      <span class="gx-pessoa__n"><span><b>${p.maos}</b> em mãos</span><span><b>${p.feitas}</b> hoje</span>${p.exc ? `<span class="is-erro"><b>${p.exc}</b> ${p.exc === 1 ? 'exceção' : 'exceções'}</span>` : ''}</span></span>${L(arrowRight, 'gi-seta')}</button></li>`).join('')}</ul>`
    : `<section class="gi-vazio">${L(users)}<p><b>Ninguém atribuído ao armazém 60.</b> O administrador atribui as pessoas na conta ROMAFE de cada uma.</p></section>`}
    ${nota('Não há presença nem localização: «em mãos» é o que está atribuído, e «hoje» o que o servidor confirmou.')}`, G('Equipa', 'mais', { voltar: 'g-mais' }));
}
type EPessoa = 'normal' | 'livre' | 'reatribuir' | 'a-reatribuir' | 'reatribuida' | 'conflito';
function pessoa(e: EPessoa = 'normal'): string {
  if (e === 'livre') return ecra(`<div class="gx-pessoa-cab"><span class="gp-av">LC</span><span><h1 class="gp-titulo">Luís Costa</h1><small>Gestor · armazém 60</small></span></div>
    <section class="gi-vazio">${L(check)}<p><b>Sem tarefa em mãos.</b> Hoje não confirmou nenhuma operação. Os gestores também podem executar: atribuir-lhe uma tarefa é como a qualquer pessoa.</p></section>`,
  G('Equipa', 'mais', { voltar: 'g-equipa', pe: sec('Atribuir uma tarefa', userPlus, ' data-ir="g-tarefas"') }));
  if (e === 'reatribuida') return ecra(`<section class="gi-movido" role="status">${L(repeat, 'gx-movido-ic')}<h1>GS13454211 com a Ana</h1><p>O servidor confirmou às 10:46. As 2 linhas que o Tiago separou ficam com o nome dele; a guia aparece-lhe a si em «Separar».</p></section>`,
  G('Equipa', 'mais', { voltar: 'g-equipa-tiago', pe: `${acao('Continuar a separação', basket, ' data-ir="g-sep-pos"')}${sec('Voltar à equipa', arrowLeft, ' data-ir="g-equipa"')}` }));
  if (e === 'conflito') return ecra(aviso('aviso', repeat, 'A GS13454211 mudou entretanto', 'O Tiago acabou a última linha às 10:46, antes de a reatribuição chegar ao servidor. A guia está separada; não se reatribui.'), G('Equipa', 'mais', { voltar: 'g-equipa-tiago', pe: acao('Voltar ao Tiago', arrowLeft, ' data-ir="g-equipa-tiago"') }));
  if (e === 'reatribuir' || e === 'a-reatribuir') return ecra(`<h1 class="gp-titulo">Reatribuir GS13454211</h1><p class="gp-nota">Garagem Central de Braga · 2 de 3 linhas · com o Tiago desde as 10:12</p>
    <ul class="gp-escolha" role="radiogroup" aria-label="Para quem">${[['Eu (Ana Ferreira)', 'AF', 'Continuo no meu PDA, na linha 3', ''], ['Deixar o motor escolher', 'M', 'Entrega a quem acabar primeiro', ''], ['Luís Costa', 'LC', 'Gestor, sem tarefa em mãos', ''], ['Paulo Reis', 'PR', 'Expedição: não separa', 'o']].map(([q, ini, x, k], i) => `<li><label class="gp-op${k ? ' is-ocupada' : ''}"><input type="radio" name="gx-reat"${i === 0 ? ' checked' : ''}${k ? ' disabled' : ''}><span class="gp-av">${ini}</span><span><b>${q}</b><small>${x}</small></span></label></li>`).join('')}</ul>
    <label class="gp-campo"><span>Motivo (obrigatório)</span><input value="O Tiago foi para a receção do cais 2"></label>
    ${nota('O que já se separou fica com quem o fez; a auditoria guarda quem reatribuiu, quando e porquê.')}`,
  G('Reatribuir', 'mais', { voltar: 'g-equipa-tiago', pe: e === 'a-reatribuir' ? esperar('A reatribuir…') : acao('Reatribuir a mim', repeat, ' data-confirmar data-ir="g-equipa-reatribuida"') }));
  const p = EQUIPA[4];
  return ecra(`<div class="gx-pessoa-cab"><span class="gp-av">${p.ini}</span><span><h1 class="gp-titulo">${p.nome}</h1><small>${p.funcao} · armazém 60</small></span></div>
    <section class="gp-sec">${h2('Em mãos', 1)}<div class="gx-tarefa"><p class="gx-tarefa__cab"><span class="gx-op-tag gx-op-tag--separacao">${L(basket)}Separação</span><span class="gp-tag gp-tag--curso">Em curso</span></p><b class="gx-tarefa__ref">GS13454211</b><small>Garagem Central de Braga</small>${prog(2, 3, 'Linhas')}
      <p class="gx-tarefa__meta"><span>${L(clock)}desde as 10:12</span></p><button type="button" class="gp-btn gi-btn-sec" data-ir="g-equipa-reatribuir">${L(repeat)}<span>Reatribuir</span></button></div></section>
    <section class="gp-sec">${h2('Hoje')}<ol class="gx-hist" aria-label="O que o servidor confirmou hoje">${[['09:16', 'Começou a GS13454209', ''], ['09:40', 'GS13454209 pousada nos preparados · 24 min', 'ok'], ['09:58', 'Começou a GS13454210', ''], ['10:20', 'Falta registada na 60210305 · P 85 020, 2 de 4', 'erro'], ['10:12', 'Começou a GS13454211', '']].sort((a, b) => a[0].localeCompare(b[0])).map(([h, t, k]) => `<li class="${k ? `is-${k}` : ''}"><b>${h}</b><span>${t}</span></li>`).join('')}</ol></section>
    <section class="gp-sec">${h2('Exceções', 1)}<ul class="gp-lista" role="list">${linhaItem(basket, 'GS13454210 com falta', 'P 85 020 · havia 2 de 4 na 60210305', 'g-sep-guia-falta', 'erro')}</ul></section>`,
  G('Equipa', 'mais', { voltar: 'g-equipa' }));
}

/* =========================================================
   78 · Insights
   ========================================================= */
type Periodo = 'hoje' | '7d' | '30d' | 'outro';
interface Dados { rot: string; geral: [string, string, string][]; graf: { t: string; xs: [string, number][]; parcial?: boolean }; mods: Record<Modulo, [string, string][]>; equipa: [string, string, string, number, string][] }
const D: Record<Exclude<Periodo, 'outro'>, Dados> = {
  hoje: { rot: `Hoje, até às ${AGORA}`, geral: [['Criadas', '11', ''], ['Concluídas', '3', 'ok'], ['Exceções', '4', 'erro'], ['Duração média', '28 min', '']],
    graf: { t: 'Tarefas concluídas, por hora', xs: [['07h', 0], ['08h', 2], ['09h', 1], ['10h', 0]], parcial: true },
    mods: { inv: [['Posições contadas', '18'], ['Correções', '1'], ['Divergências por rever', '2'], ['Validações à espera', '1']], arr: [['Guias concluídas', '1'], ['Duração média', '32 min'], ['Por atribuir agora', '2'], ['Exceções', '2']], sep: [['Guias preparadas', '1'], ['Duração média', '24 min'], ['Com falta', '1 de 3'], ['Por separar agora', '1']], exp: [['Guias expedidas', '1'], ['Prontas à espera agora', '2'], ['Espera mais longa', '1 h 33'], ['Exceções', '1']] },
    equipa: [['Inês Rocha', 'Arrumação', '1 guia', 1, '32 min'], ['Joana Silva', 'Arrumação', '18 posições', 1, '—'], ['Paulo Reis', 'Expedição', '1 guia', 1, '—'], ['Tiago Lopes', 'Separação', '1 guia', 1, '24 min']] },
  '7d': { rot: 'De 22 a 28 de outubro', geral: [['Criadas', '58', ''], ['Concluídas', '45', 'ok'], ['Exceções', '9', 'erro'], ['Duração média', '31 min', '']],
    graf: { t: 'Tarefas concluídas, por dia', xs: [['qui.', 11], ['sex.', 9], ['sáb.', 0], ['dom.', 0], ['seg.', 12], ['ter.', 10], ['qua.', 3]], parcial: true },
    mods: { inv: [['Posições contadas', '94'], ['Correções', '4'], ['Divergências', '7'], ['Recontagens', '2']], arr: [['Guias concluídas', '17'], ['Duração média', '29 min'], ['Por atribuir agora', '2'], ['Exceções', '4']], sep: [['Guias preparadas', '16'], ['Duração média', '26 min'], ['Com falta', '3 de 18'], ['Por separar agora', '1']], exp: [['Guias expedidas', '12'], ['Prontas à espera agora', '2'], ['Espera média', '48 min'], ['Exceções', '2']] },
    equipa: [['Inês Rocha', 'Arrumação', '9 guias', 2, '30 min'], ['Joana Silva', 'Arrumação', '8 guias · 94 posições', 2, '28 min'], ['Paulo Reis', 'Expedição', '12 guias', 2, '—'], ['Tiago Lopes', 'Separação', '16 guias', 3, '26 min']] },
  '30d': { rot: 'De 29 de setembro a 28 de outubro', geral: [['Criadas', '214', ''], ['Concluídas', '169', 'ok'], ['Exceções', '31', 'erro'], ['Duração média', '33 min', '']],
    graf: { t: 'Tarefas concluídas, por semana (começa à segunda)', xs: [['6 out.', 40], ['13 out.', 46], ['20 out.', 38], ['27 out.', 45]], parcial: true },
    mods: { inv: [['Posições contadas', '312'], ['Correções', '15'], ['Divergências', '22'], ['Inventários fechados', '3']], arr: [['Guias concluídas', '64'], ['Duração média', '31 min'], ['Por atribuir agora', '2'], ['Exceções', '13']], sep: [['Guias preparadas', '58'], ['Duração média', '27 min'], ['Com falta', '9 de 61'], ['Por separar agora', '1']], exp: [['Guias expedidas', '47'], ['Prontas à espera agora', '2'], ['Espera média', '52 min'], ['Exceções', '6']] },
    equipa: [['Inês Rocha', 'Arrumação', '33 guias', 7, '31 min'], ['Joana Silva', 'Arrumação', '31 guias · 312 posições', 6, '30 min'], ['Paulo Reis', 'Expedição', '47 guias', 6, '—'], ['Tiago Lopes', 'Separação', '58 guias', 12, '27 min']] },
};
/** Um gráfico de barras, uma série: concluídas. O valor em cima de cada barra; a última, ainda a decorrer, tracejada. */
function grafico(g: Dados['graf']): string {
  const W = 288, H = 132, topo = 18, base = 108, max = Math.max(1, ...g.xs.map(([, v]) => v)), passo = W / g.xs.length, lb = Math.min(36, passo - 10);
  const bar = ([t, v]: [string, number], i: number) => { const h = Math.round((base - topo) * v / max), x = Math.round(i * passo + (passo - lb) / 2), y = base - h, ult = g.parcial && i === g.xs.length - 1;
    return `<g class="gx-graf__b${ult ? ' is-parcial' : ''}" style="--i:${i}"><title>${t}: ${v} concluídas${ult ? ' (até agora)' : ''}</title>${h ? `<path d="M${x},${base}V${y + 4}q0,-4 4,-4h${lb - 8}q4,0 4,4V${base}z"/>` : ''}<text class="gx-graf__v" x="${x + lb / 2}" y="${y - 5}">${v}</text><text class="gx-graf__x" x="${x + lb / 2}" y="${H - 6}">${t}${ult ? '*' : ''}</text></g>`; };
  return `<figure class="gx-graf"><figcaption>${g.t}</figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${g.t}: ${g.xs.map(([t, v]) => `${t} ${v}`).join(', ')}"><path class="gx-graf__base" d="M0,${base}.5H${W}"/>${g.xs.map(bar).join('')}</svg>
    ${g.parcial ? `<p class="gx-graf__nota">* ainda a decorrer, até às ${AGORA}.</p>` : ''}
    <details class="gx-graf__tab"><summary>Ver em tabela</summary><table><tbody>${g.xs.map(([t, v]) => `<tr><th scope="row">${t}</th><td>${v}</td></tr>`).join('')}</tbody></table></details></figure>`;
}
const metricas = (xs: [string, string, string?][]) => `<dl class="gx-met">${xs.map(([t, v, tom]) => `<div${tom ? ` class="is-${tom}"` : ''}><dd>${v}</dd><dt>${t}</dt></div>`).join('')}</dl>`;
/** Um insight: o que aconteceu, porquê importa, a regra, e a ação. */
const insight = (t: string, porque: string, regra: string, b: string, ic: string, ir: string, tom: 'erro' | 'aviso' | 'info' = 'aviso') => `<li><div class="gx-ins gx-ins--${tom}"><b>${t}</b><p>${porque}</p><p class="gx-ins__regra">Regra: ${regra}</p><button type="button" class="gp-btn gp-btn--acao" data-ir="${ir}">${L(ic)}<span>${b}</span></button></div></li>`;
const INS: Record<Modulo, string> = {
  inv: insight('1 inventário espera validação há 10 dias', 'O INV-2026-011 tem 2 divergências por decidir; o stock da zona 21 não é ajustado até fechar.', 'validações à espera há mais de 24 h.', 'Validar contagens', check, 'gestor-validar'),
  arr: insight('2 guias de arrumação por atribuir há 2 h', 'Ninguém da arrumação está livre; as paletes ocupam o cais 1.', 'por atribuir há mais de 30 min, o objetivo do armazém.', 'Ver tarefas', list, 'g-tarefas'),
  sep: insight('1 guia seguiu com falta', 'A GS13454210 saiu com 2 de 4 pastilhas P 85 020; a falta ficou na 60210305.', 'qualquer falta registada hoje.', 'Rever a falta', triangle, 'g-sep-guia-falta', 'erro'),
  exp: insight('A GS13454208 está pronta há 1 h 33', 'O cliente espera e a prateleira de preparados enche.', 'guias prontas há mais de 1 h sem recolha.', 'Recolher', truck, 'g-exp-outra'),
};
const DEFINICOES = 'Concluídas: as que o servidor confirmou no período. Duração: da tomada à confirmação, só entre tarefas do mesmo tipo. «Agora» é o momento, não o período.';
const VISTAS: [string, string][] = [['geral', 'Geral'], ['inv', 'Inventário'], ['arr', 'Arrumação'], ['sep', 'Separação'], ['exp', 'Expedição'], ['equipa', 'Equipa']];
type EInsights = { p?: Periodo; vista?: string; estado?: 'carregar' | 'indisponivel' | 'velho' | 'vazio' | 'sem-rede' | 'invalido' };
export function insights(o: EInsights = {}): string {
  const p = o.p ?? 'hoje', vista = o.vista ?? 'geral', d = D[p === 'outro' ? '7d' : p];
  const per = `<nav class="gx-per" aria-label="Período">${([['hoje', 'Hoje', 'g-insights'], ['7d', '7 dias', 'g-insights-7d'], ['30d', '30 dias', 'g-insights-30d'], ['outro', 'Outro', 'g-insights-outro']] as const).map(([k, t, ir]) => `<button type="button" data-ir="${ir}"${k === p ? ' aria-current="page"' : ''}>${t}</button>`).join('')}</nav>`;
  const cab = `<div class="gi-acomp-cab"><h1 class="gp-titulo">Insights</h1><span class="gx-chip">${L(warehouse)}Armazém 60</span></div>${per}`;
  const datas = p === 'outro' ? `<div class="gx-datas"><label class="gp-campo"><span>De</span><input type="date" value="${o.estado === 'invalido' ? '2026-10-28' : '2026-10-22'}"${o.estado === 'invalido' ? ' aria-invalid="true" aria-describedby="gx-datas-e"' : ''}></label><label class="gp-campo"><span>Até</span><input type="date" value="${o.estado === 'invalido' ? '2026-10-20' : '2026-10-28'}"></label></div>${o.estado === 'invalido' ? `<p class="gi-porque is-erro" id="gx-datas-e">${L(triangle)}O início não pode ser depois do fim.</p>` : ''}` : '';
  const op = (o2: Opcoes = {}) => G('Insights', 'insights', o2);
  if (o.estado === 'carregar') return ecra(`${cab}<p class="gi-estado" role="status"><span class="girador girador--pequeno" aria-hidden="true"></span>A calcular as medidas…</p><div class="gx-met is-esq">${'<div><i class="gx-esq"></i></div>'.repeat(4)}</div><div class="gp-esq"><i></i><i></i><i></i></div>`, op());
  if (o.estado === 'indisponivel') return ecra(`${cab}${aviso('erro', serverOff, 'Os insights não estão disponíveis', 'O serviço das medidas não respondeu. As operações continuam: as tarefas e as exceções estão no Início e em Tarefas.')}<p class="gi-ref">Referência <code>PK-2810-INS4</code></p>`, op({ pe: `${acao('Tentar outra vez', refresh)}${sec('Ver as tarefas', list, ' data-ir="g-tarefas"')}` }));
  if (o.estado === 'sem-rede') return eSemRede(op());
  if (o.estado === 'invalido') return ecra(`${cab}${datas}`, op({ pe: `<button type="button" class="gp-btn gp-btn--acao gp-btn--grande" disabled>${L(calendar)}<span>Ver o período</span></button>` }));
  if (o.estado === 'vazio') return ecra(`${cab}<p class="gx-per__rot">${L(calendar)}Domingo, 25 de outubro</p><section class="gi-vazio">${L(inbox)}<p><b>Nada neste período.</b> O armazém não teve operações confirmadas nesse dia. Escolha outro período.</p></section>`, op());
  const paineis = VISTAS.map(([k]) => {
    const corpo = k === 'geral' ? `${metricas(d.geral)}${grafico(d.graf)}<section class="gp-sec">${h2('Onde está a parar', 4)}<ul class="gp-lista gx-ins-l" role="list">${INS.inv}${INS.exp}${INS.arr}${INS.sep}</ul></section>`
      : k === 'equipa' ? `<ul class="gx-eq" role="list">${d.equipa.map(([nome, f, feitas, exc, dur]) => `<li><p><b>${nome}</b><small>${f}</small></p><dl><div><dt>Concluídas</dt><dd>${feitas}</dd></div><div><dt>Duração média</dt><dd>${dur}</dd></div><div${exc ? ' class="is-erro"' : ''}><dt>Exceções</dt><dd>${exc}</dd></div></dl></li>`).join('')}</ul>
        ${nota('Por ordem alfabética, sem classificação: uma contagem de 46 posições não se compara com uma guia de 2 linhas, e o número de tarefas não mede esforço nem qualidade.')}<button type="button" class="gp-ligacao" data-ir="g-equipa">${L(users)}Ver a equipa e o que tem em mãos</button>`
      : `${metricas(d.mods[k as Modulo])}<ul class="gp-lista gx-ins-l" role="list">${INS[k as Modulo]}</ul>`;
    return `<div class="gi-sep" data-gi-painel="${k}"${k === vista ? '' : ' hidden'}>${corpo}</div>`;
  }).join('');
  return ecra(`${cab}${datas}<p class="gx-per__rot">${L(calendar)}${d.rot}</p>
    ${o.estado === 'velho' ? `<p class="gx-velho" role="status">${L(clock)}<span><b>Medidas das 09:30.</b> O cálculo seguinte ainda não chegou; os números podem estar atrasados uma hora.</span><button type="button" class="gp-ligacao">${L(refresh)}Atualizar</button></p>` : ''}
    <label class="gp-campo gi-sel"><span>Ver</span><select data-gi-sel aria-label="Ver os insights de">${VISTAS.map(([k, t]) => `<option value="${k}"${k === vista ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
    ${paineis}
    <details class="gx-def"><summary>Como se calcula</summary><p>${DEFINICOES}</p></details>`, op());
}

/* =========================================================
   66 v3 · Mais
   ========================================================= */
const itemMais = (ic: string, t: string, x: string, ir: string) => `<li><button type="button" class="gi-mais"${ir ? ` data-ir="${ir}"` : ''}><span class="gi-mais__ic">${L(ic)}</span><span><b>${t}</b><small>${x}</small></span>${L(arrowRight, 'gi-seta')}</button></li>`;
function maisV3(): string {
  return ecra(`<h1 class="gp-titulo">Mais</h1>
    <section class="gp-sec">${h2('Operações')}<ul class="gi-mais-l" role="list">${MODULOS.map(([k, t, ir, x]) => itemMais(ICONE_MOD[k], t, x, ir)).join('')}${itemMais(layoutGrid, 'As quatro lado a lado', 'Os números e Acompanhar ou Executar', 'g-operacoes')}</ul></section>
    <section class="gp-sec">${h2('Pessoas e histórico')}<ul class="gi-mais-l" role="list">${itemMais(users, 'Equipa', 'Quem tem o quê em mãos, e o que fez hoje', 'g-equipa')}${itemMais(history, 'Histórico', 'Inventários fechados, movimentos e expedições', 'gestor-historico')}</ul></section>
    <section class="gp-sec">${h2('O armazém e a conta')}<div class="gx-armazem">${L(warehouse)}<span><b>Armazém 60</b><small>O único da sua conta</small></span></div>
      <ul class="gi-mais-l" role="list">${itemMais(lifeBuoy, 'Ajuda', 'O leitor, a rede e a quem pedir', 'g-ajuda')}${itemMais(logOut, 'Terminar sessão', 'Ana Ferreira · volta ao início de sessão comum', 'gestor-sessao')}</ul></section>`,
  G('Mais', 'mais'));
}

/* =========================================================
   Os ecrãs e os estados
   ========================================================= */
const NOTA = 'Do briefing «ROMAFE Warehouse — Ultimate Manager Experience» (28 out.), no Figma e só com rede: o Centro de operações responde ao que está a acontecer, ao que precisa do Gestor e ao que ele pode fazer agora; Insights das quatro operações e da equipa, no mesmo período e com regras à vista; a Equipa pelas tarefas, sem presença nem ranking.';
/** As versões novas: 60 v5, 65 v3 e 66 v3. */
export function comGestorV4<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  const V: Record<string, [string, () => string]> = { 'gestor-inicio': ['v5', () => centro()], 'g-tarefas': ['v3', () => todasTarefas()], 'g-mais': ['v3', maisV3] };
  const OBJ: Record<string, string> = {
    'gestor-inicio': 'A Ana, gestora, vê num relance o que está a acontecer no armazém hoje (em curso, por fazer, exceções, concluídas), as quatro operações com o que têm por fazer, o que pede a atenção dela e o que deve fazer agora — cada sugestão com o porquê.',
    'g-tarefas': 'Todas as tarefas das quatro operações: filtra-se por operação, zona e responsável; cada uma diz desde quando está assim e a ação seguinte que o estado permite.',
    'g-mais': 'As quatro operações, a equipa, o histórico, o armazém, a ajuda e terminar sessão.',
  };
  return ecras.map((e) => V[e.id] ? { ...e, objetivo: OBJ[e.id] ?? e.objetivo, nome: e.id === 'gestor-inicio' ? '60 · Centro de operações' : e.id === 'g-tarefas' ? '65 · Todas as tarefas' : e.nome, versoes: [...e.versoes, { id: V[e.id][0], nota: NOTA, html: V[e.id][1]() }] as Ecra<T>['versoes'] } : e);
}
/** Os estados do Início que já existiam (60.1–60.14) passam a desenhar-se no Centro de operações. */
export const ESTADOS_CENTRO: Record<string, () => string> = {
  'gestor-sem-tarefas': () => centro('sem-atencao'),
  'gestor-carregar': () => centro('carregar-parcial'),
};
export function ecrasGestorV4(): Ecra<string>[] {
  const e = (id: string, nome: string, objetivo: string, html: string, de?: string, v = 'v1'): Ecra<string> => ({ id, nome, fluxo: 'Gestor', objetivo, ...(de ? { estadoDe: de } : {}), versoes: [{ id: v, nota: NOTA, html }] });
  const GT = G('Tarefas', 'tarefas'), GQ = G('Equipa', 'mais', { voltar: 'g-mais' });
  return [
    /* 60 · os estados novos do Centro de operações */
    e('gestor-centro-desatualizado', '60.15 · Dados desatualizados', 'O servidor falhou duas atualizações: diz-se de quando são os números e oferece Atualizar; nada se mostra como se fosse de agora.', centro('desatualizado'), 'gestor-inicio', 'v5'),
    e('gestor-centro-zero', '60.16 · Nada a acontecer', 'Início do dia, sem operações: os números a zero ditos, os cartões sem pendentes e nada para fazer.', centro('zero'), 'gestor-inicio', 'v5'),
    /* 65 · Todas as tarefas */
    e('g-tarefas-curso', '65.1 · Em curso', 'O separador «Em curso»: quem está em quê, com o progresso e o «desde».', todasTarefas({ sep: 'curso' }), 'g-tarefas', 'v3'),
    e('g-tarefas-atencao', '65.2 · Exceções', 'O separador «Exceções»: cada uma com a ação que a resolve.', todasTarefas({ sep: 'atencao' }), 'g-tarefas', 'v3'),
    e('g-tarefas-filtro-vazio', '65.3 · Nada com estes filtros', 'Separação na Zona 30: nada; diz-se o filtro e o que mudar.', todasTarefas({ filtro: true }), 'g-tarefas', 'v3'),
    e('g-tarefas-vazia', '65.4 · Sem tarefas', 'O armazém sem nada pendente.', todasTarefas({ vazio: true }), 'g-tarefas', 'v3'),
    e('g-tarefas-mudou', '65.5 · Mudou entretanto', 'Outro gestor atribuiu uma tarefa enquanto a lista estava aberta: diz-se quem e quando; a lista já está atualizada.', todasTarefas({ aviso: aviso('info', refresh, 'A lista foi atualizada', 'O Luís Costa atribuiu a GA-2026-0331 à Inês às 10:44. Passou para Em curso.') }), 'g-tarefas', 'v3'),
    e('g-tarefas-so-consulta', '65.6 · Sem permissão para atribuir', 'A conta vê as tarefas mas não atribui: «Atribuir» passa a «Abrir».', todasTarefas({ semAtribuir: true, aviso: `<p class="gi-porque">${L(lock)}A sua conta não tem «Atribuir tarefas»: pode abrir e executar.</p>` }), 'g-tarefas', 'v3'),
    e('g-tarefas-carregar', '65.7 · A carregar', 'As tarefas a chegar.', eCarregar(GT, 4), 'g-tarefas', 'v3'),
    e('g-tarefas-erro', '65.8 · Não carregou', 'O servidor não respondeu.', eServidor(GT, 'PK-2810-T65'), 'g-tarefas', 'v3'),
    e('g-tarefas-sem-rede', '65.9 · Sem rede', 'A Pick para e espera; não mostra a lista velha.', eSemRede(GT), 'g-tarefas', 'v3'),
    e('g-tarefas-sessao', '65.10 · Sessão terminada', 'Entrar outra vez; volta-se às tarefas.', eSessao(GT), 'g-tarefas', 'v3'),
    /* 77 · Equipa */
    e('g-equipa', '77 · Equipa', 'Cada pessoa do armazém 60: a função, o que tem em mãos agora (pela atribuição), o que fez hoje (pelo servidor) e as exceções. Sem presença, sem localização, sem ranking.', equipa()),
    e('g-equipa-tiago', '77.1 · Uma pessoa', 'O Tiago: a guia em mãos (reatribuir), o que o servidor confirmou hoje e as exceções dele.', pessoa(), 'g-equipa'),
    e('g-equipa-livre', '77.2 · Sem tarefa em mãos', 'O Luís, gestor, sem nada atribuído: diz-se, e pode-se atribuir-lhe uma tarefa.', pessoa('livre'), 'g-equipa'),
    e('g-equipa-reatribuir', '77.3 · Reatribuir', 'Para quem passa a guia, com motivo; quem não separa fica desligado.', pessoa('reatribuir'), 'g-equipa'),
    e('g-equipa-a-reatribuir', '77.4 · A reatribuir', 'Só o botão espera.', pessoa('a-reatribuir'), 'g-equipa'),
    e('g-equipa-reatribuida', '77.5 · Reatribuída', 'O servidor confirmou: a guia é da Ana, e o que o Tiago fez fica com o nome dele.', pessoa('reatribuida'), 'g-equipa'),
    e('g-equipa-conflito', '77.6 · Mudou entretanto', 'O Tiago acabou antes de a reatribuição chegar: não se reatribui.', pessoa('conflito'), 'g-equipa'),
    e('g-equipa-sem-tarefas', '77.7 · Ninguém com tarefas', 'Início do dia: todos sem nada em mãos.', equipa('sem-tarefas'), 'g-equipa'),
    e('g-equipa-vazia', '77.8 · Sem pessoas', 'Ninguém atribuído ao armazém: a quem pedir.', equipa('vazia'), 'g-equipa'),
    e('g-equipa-carregar', '77.9 · A carregar', 'A equipa a chegar.', eCarregar(GQ, 4), 'g-equipa'),
    e('g-equipa-erro', '77.10 · Não carregou', 'O servidor não respondeu.', eServidor(GQ, 'PK-2810-E77'), 'g-equipa'),
    e('g-equipa-sem-rede', '77.11 · Sem rede', 'A Pick para e espera.', eSemRede(GQ), 'g-equipa'),
    /* 78 · Insights */
    e('g-insights', '78 · Insights', 'O desempenho do armazém 60, hoje: as medidas gerais, um gráfico das concluídas e onde está a parar — cada insight com o porquê, a regra e a ação. «Ver» muda para cada operação e para a equipa.', insights()),
    e('g-insights-7d', '78.1 · 7 dias', 'O mesmo, nos últimos 7 dias (o dia de hoje marcado como a decorrer).', insights({ p: '7d' }), 'g-insights'),
    e('g-insights-30d', '78.2 · 30 dias', 'Os últimos 30 dias, por semana.', insights({ p: '30d' }), 'g-insights'),
    e('g-insights-outro', '78.3 · Outro período', 'As datas de início e fim; todas as medidas nesse período.', insights({ p: 'outro' }), 'g-insights'),
    e('g-insights-invalido', '78.4 · Período inválido', 'O início depois do fim: diz-se, e «Ver o período» fica desligado.', insights({ p: 'outro', estado: 'invalido' }), 'g-insights'),
    e('g-insights-inv', '78.5 · Inventário', 'Posições contadas, correções, divergências e validações à espera — sem percentagens de um âmbito incompleto.', insights({ vista: 'inv' }), 'g-insights'),
    e('g-insights-arr', '78.6 · Arrumação', 'Guias concluídas, duração média, por atribuir agora e exceções.', insights({ vista: 'arr' }), 'g-insights'),
    e('g-insights-sep', '78.7 · Separação', 'Guias preparadas, duração média, faltas (em quantas guias) e por separar agora.', insights({ vista: 'sep' }), 'g-insights'),
    e('g-insights-exp', '78.8 · Expedição', 'Guias expedidas, prontas à espera agora, a espera mais longa e exceções.', insights({ vista: 'exp' }), 'g-insights'),
    e('g-insights-equipa', '78.9 · Equipa', 'Por pessoa: concluídas, duração média do seu tipo e exceções; por ordem alfabética, sem classificação.', insights({ vista: 'equipa' }), 'g-insights'),
    e('g-insights-carregar', '78.10 · A calcular', 'As medidas a chegar; o período e a vista já servem.', insights({ estado: 'carregar' }), 'g-insights'),
    e('g-insights-velho', '78.11 · Medidas atrasadas', 'O cálculo seguinte não chegou: diz-se de quando são.', insights({ estado: 'velho' }), 'g-insights'),
    e('g-insights-vazio', '78.12 · Nada no período', 'Um domingo sem operações: diz-se, sem gráficos vazios.', insights({ estado: 'vazio' }), 'g-insights'),
    e('g-insights-indisponivel', '78.13 · Insights indisponíveis', 'O serviço das medidas não respondeu: as operações continuam, e diz-se onde.', insights({ estado: 'indisponivel' }), 'g-insights'),
    e('g-insights-sem-rede', '78.14 · Sem rede', 'Sem rede não se mostram medidas velhas como se fossem de agora.', insights({ estado: 'sem-rede' }), 'g-insights'),
  ];
}
void chartColumn; void circleCheck; void userPlus;
