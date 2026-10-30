/* =========================================================
   PICK — a barra de navegação inferior por função (27 out. 2026)
   Do briefing dela «ROMAFE Warehouse V3 — Role-Based Bottom Navigation», no Figma e só com rede, com as duas
   recomendações dela: no Gestor, Tarefas em destaque (junta o trabalho do Inventário e da Arrumação); no Operador,
   Ler em destaque, ao centro (o leitor é o centro do dia no PDA).
   Uma só barra, configurada pelo menu central (as linhas de MENU_BARRA são como viriam de /api/v1/navigation?app=pick:
   aplicação, função, destino, rótulo, ícone, ordem, destaque, ativo). Até cinco destinos; o resto em «Mais».
     - Gestor: Início · Tarefas · Inventário · Arrumação · Mais;
     - Arrumação: Início · Tarefas · Ler · Histórico · Mais;
     - Separação e Expedição: Início · Mais (os módulos delas ainda não estão na Pick — não aparecem como feitos).
   O que está decidido e muda o briefing:
     - as funções são as do armazém (gestor, arrumação, separação, expedição): não há «supervisor» inventado;
     - a pessoa não vê a fila (24 set.): as Tarefas do operador mostram a tarefa em mãos e as contagens atribuídas,
       nunca a fila das guias — o motor entrega uma de cada vez;
     - só com rede: o Histórico é o que o servidor confirmou, sem «por sincronizar»;
     - em «Mais», só o que existe (sem Relatórios, Configurações nem «Alterar armazém» — só há o armazém 60).
   Nos ecrãs de leitura (43 · Ler e contar, 80 · Arrumar) a barra sai, para não haver toques por engano; fica o voltar.
   Os números nos destinos são os mesmos das faixas (por atribuir, divergências, problemas), contados uma vez.
   A mudança de destino: o indicador desliza do destino de onde se veio (comportamento/funcoes.ts), o ícone responde,
   e o do Inventário e o da Arrumação fazem o seu gesto (o leitor varre; a caixa sobe à prateleira) — uma vez.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { ecra, acao, sec, aviso, prog, posicao, h2, L, type Opcoes } from './inventario-v2';
import { inicioV2, inventarioV2, ARRUMACAO_ATIVA } from './gestor-v2';
import { inicioV4 } from './gestor-v3';
import { centro, ESTADOS_CENTRO } from './gestor-v4';
import { arrumacaoInicio, RESUMO_ARRUMACAO } from './arrumacao';
import { inicioOperador } from './inventario-completo';
import { paginaSemInventario } from './inventario-estados';
import { INVENTARIOS, camadaAbertura, type CenarioAbertura } from './gestor';
import { carregar as eCarregar, semRede as eSemRede, servidor as eServidor, sessao as eSessao, semPermissao as eSemPermissao, vazio as eVazio } from './inventario-estados';
import { INV, POS } from './inventario';
import home from 'lucide-static/icons/house.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import chartColumn from 'lucide-static/icons/chart-column.svg?raw';
import listTodo from 'lucide-static/icons/list-todo.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import boxes from 'lucide-static/icons/package-open.svg?raw';
import ellipsis from 'lucide-static/icons/ellipsis.svg?raw';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import userPlus from 'lucide-static/icons/user-plus.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import triangle from 'lucide-static/icons/triangle-alert.svg?raw';
import shieldCheck from 'lucide-static/icons/shield-check.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import logOut from 'lucide-static/icons/log-out.svg?raw';
import users from 'lucide-static/icons/users.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import serverOff from 'lucide-static/icons/server-off.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import repeat from 'lucide-static/icons/repeat.svg?raw';
import userRound from 'lucide-static/icons/user-round.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import inboxIc from 'lucide-static/icons/inbox.svg?raw';

/* ---------- o menu da barra, como viria do menu central ---------- */
type Funcao = 'gestor' | 'arrumacao' | 'separacao' | 'expedicao';
interface Destino { id: string; funcao: Funcao; rotulo: string; icone: string; ecra: string; ordem: number; destaque?: boolean; ativo: boolean; gesto?: 'ler' | 'caixa' | 'tarefas' }
const ICONES: Record<string, string> = { insights: chartColumn, operacoes: layoutGrid, inicio: home, tarefas: listTodo, inventario: pkg, arrumacao: boxes, mais: ellipsis, ler: scanBarcode, historico: history };
/** 27 out. (ela: «para já remove as tarefas»): as Tarefas saem da barra do Gestor e da Arrumação; os ecrãs ficam no editor. */
export const TAREFAS_ATIVAS = false;
/** 27 out. (ela: «remove o mais por agora»): o Mais sai de todas as barras; os ecrãs dele ficam no editor. */
export const MAIS_ATIVO = false;
export const MENU_BARRA: Destino[] = [
  /* 28 out. (briefing «Gestor V1 — Four Warehouse Operations»: o Gestor acompanha e executa tudo): Início · Tarefas · Ler
     (ao centro, em destaque) · Operações · Mais; o Inventário e a Arrumação passam para Operações, com a Separação e a Expedição */
  { id: 'inicio', funcao: 'gestor', rotulo: 'Início', icone: 'inicio', ecra: 'gestor-inicio', ordem: 10, ativo: true },
  { id: 'tarefas', funcao: 'gestor', rotulo: 'Tarefas', icone: 'tarefas', ecra: 'g-tarefas', ordem: 20, ativo: true, gesto: 'tarefas' },
  { id: 'ler', funcao: 'gestor', rotulo: 'Ler', icone: 'ler', ecra: 'g-ler', ordem: 30, destaque: true, ativo: true, gesto: 'ler' },
  /* 28 out. (briefing «Ultimate Manager»): Insights no lugar de Operações; os quatro módulos ficam nos cartões do Início
     e em Mais › Operações */
  { id: 'insights', funcao: 'gestor', rotulo: 'Insights', icone: 'insights', ecra: 'g-insights', ordem: 40, ativo: true },
  { id: 'mais', funcao: 'gestor', rotulo: 'Mais', icone: 'mais', ecra: 'g-mais', ordem: 90, ativo: true },
  { id: 'inicio', funcao: 'arrumacao', rotulo: 'Início', icone: 'inicio', ecra: 'ta-inicio', ordem: 10, ativo: true },
  /* 30 out. (briefing «Figma interativo V2 · Trabalhador de Arrumação»): Início · Tarefas · Ler · Mais — as Tarefas são só as
     da pessoa (89), e o Histórico passa para o Mais */
  { id: 'tarefas', funcao: 'arrumacao', rotulo: 'Tarefas', icone: 'tarefas', ecra: 'ta-tarefas', ordem: 20, ativo: true, gesto: 'tarefas' },
  { id: 'ler', funcao: 'arrumacao', rotulo: 'Ler', icone: 'ler', ecra: 'op-ler', ordem: 30, destaque: true, ativo: true, gesto: 'ler' },
  { id: 'historico', funcao: 'arrumacao', rotulo: 'Histórico', icone: 'historico', ecra: 'op-historico', ordem: 40, ativo: false },
  { id: 'mais', funcao: 'arrumacao', rotulo: 'Mais', icone: 'mais', ecra: 'op-mais', ordem: 90, ativo: true },
  { id: 'inicio', funcao: 'separacao', rotulo: 'Início', icone: 'inicio', ecra: 'op-separacao', ordem: 10, ativo: true },
  { id: 'mais', funcao: 'separacao', rotulo: 'Mais', icone: 'mais', ecra: 'op-mais-separacao', ordem: 90, ativo: MAIS_ATIVO },
  { id: 'inicio', funcao: 'expedicao', rotulo: 'Início', icone: 'inicio', ecra: 'op-expedicao', ordem: 10, ativo: true },
  { id: 'mais', funcao: 'expedicao', rotulo: 'Mais', icone: 'mais', ecra: 'op-mais-expedicao', ordem: 90, ativo: MAIS_ATIVO },
];
/** Os números verdadeiros, os mesmos das faixas: contados uma vez. */
/* GA-2026-0331 e as colunas 07–12 do INV-2026-015 — com a Arrumação desligada, só as do Inventário */
/* 28 out. (Gestor v3): as tarefas «por fazer» das quatro operações (gestor-v3.ts, POR_FAZER) */
const POR_ATRIBUIR = ARRUMACAO_ATIVA ? 6 : 1;
const NUMEROS: Partial<Record<string, [number, string]>> = {
  /* 27 out. (ela: «não quero muita confusão na UI»): um número só, o das Tarefas — os outros repetiam as faixas.
     28 out. (ponto 2): nem esse — o «6 Por fazer» já está no Centro de operações, e a barra repetia-o */
};
void POR_ATRIBUIR;

/* ---------- a barra ---------- */
export function barra(funcao: Funcao, ativo: string, o: { semNumeros?: boolean; so?: string[] } = {}): string {
  const ds = MENU_BARRA.filter((d) => d.funcao === funcao && d.ativo && (!o.so || o.so.includes(d.id))).sort((a, b) => a.ordem - b.ordem).slice(0, 5);
  /* com um destino só a barra não serve: não se mostra */
  if (ds.length < 2) return '';
  /* os módulos (Inventário, Arrumação, Separação, Expedição) estão em Operações */
  const MOD = ['inventario', 'arrumacao', 'separacao', 'expedicao'], tem = (k: string) => ds.some((d) => d.id === k);
  /* sem Operações na barra (28 out.): os módulos abrem-se do Início, e as Operações vivem no Mais */
  const alvo = tem(ativo) ? ativo : MOD.includes(ativo) ? (tem('operacoes') ? 'operacoes' : 'inicio') : ativo === 'operacoes' ? 'mais' : ativo;
  const i = Math.max(0, ds.findIndex((d) => d.id === alvo));
  return `<nav class="gi-barra gi-barra--${ds.length}" data-por-cima aria-label="Navegação" data-gi-barra="${funcao}" style="--n:${ds.length};--i:${i}">
    <i class="gi-barra__ind" aria-hidden="true"></i>
    ${ds.map((d, k) => { const n = o.semNumeros ? undefined : NUMEROS[`${funcao}:${d.id}`], at = k === i;
      return `<button type="button" class="gi-barra__b${d.destaque ? ' is-destaque' : ''}${at ? ' is-ativo' : ''}" data-ir="${d.ecra}" data-gi-k="${k}"${d.gesto ? ` data-gesto="${d.gesto}"` : ''}${at ? ' aria-current="page"' : ''}>
        <span class="gi-barra__ic">${L(ICONES[d.icone])}${n && n[0] ? `<span class="gi-barra__n" aria-label="${n[0]} ${n[1]}">${n[0]}</span>` : ''}</span><span class="gi-barra__t">${d.rotulo}</span></button>`; }).join('')}
  </nav>`;
}

/* =========================================================
   Gestor · 65 · Tarefas (o centro das tarefas: inventário e arrumação)
   ========================================================= */
type Tipo = 'inventario' | 'arrumacao';
interface Tarefa { tipo: Tipo; ref: string; t: string; quem: string; est: 'atribuir' | 'curso' | 'atencao'; zona: string; acao: [string, string, string]; p?: [number, number] }
const TAREFAS: Tarefa[] = [
  { tipo: 'arrumacao', ref: 'GA-2026-0331', t: '2 paletes · 82 un. · cais 1 → 60101203', quem: '', est: 'atribuir', zona: 'Zona 10', acao: ['Atribuir', 'arr-guia', userPlus] },
  { tipo: 'inventario', ref: 'INV-2026-015 · colunas 07–12', t: 'Cíclica · rolamentos · 15 posições', quem: '', est: 'atribuir', zona: 'Zona 10', acao: ['Atribuir', 'gestor-atribuir', userPlus] },
  { tipo: 'inventario', ref: INVENTARIOS[0].ref, t: `${INVENTARIOS[0].area} · às cegas`, quem: 'Joana Silva', est: 'curso', zona: 'Zona 30', acao: ['Acompanhar', 'gestor-acompanhar', list], p: [INVENTARIOS[0].feitas, INVENTARIOS[0].total] },
  { tipo: 'arrumacao', ref: 'GA-2026-0330', t: '2 artigos · cais 2 → 60120401', quem: 'Inês Rocha', est: 'curso', zona: 'Zona 12', acao: ['Acompanhar', 'arr-acompanhar', list], p: [1, 2] },
  { tipo: 'inventario', ref: 'INV-2026-011', t: 'Submetido · 2 divergências', quem: 'Joana Silva', est: 'atencao', zona: 'Zona 21', acao: ['Validar', 'gestor-validar', shieldCheck] },
  { tipo: 'arrumacao', ref: 'GA-2026-0329', t: 'Destino em contagem: 60300104', quem: '', est: 'atencao', zona: 'Zona 30', acao: ['Mudar o destino', 'arr-guia-bloqueada', mapPin] },
  { tipo: 'arrumacao', ref: 'GA-2026-0328', t: 'Quantidade diferente: 12 na guia, 10 arrumadas', quem: 'Inês Rocha', est: 'atencao', zona: 'Zona 21', acao: ['Resolver', 'arr-excecoes', triangle] },
];
function tarefasGestor(): string {
  const TS = TAREFAS.filter((x) => ARRUMACAO_ATIVA || x.tipo === 'inventario');
  const SEP: [Tarefa['est'], string][] = [['atribuir', 'Por atribuir'], ['curso', 'Em curso'], ['atencao', 'Atenção']];
  const linha = (x: Tarefa, i: number) => `<li style="--i:${i}" data-gi-tipo-l="${x.tipo}" data-gi-quem-l="${x.quem || '-'}"><div class="gi-tarefa-l gi-tarefa-l--${x.est}">
      <span class="gi-tarefa-l__ic gi-tarefa-l__ic--${x.tipo}">${L(x.tipo === 'inventario' ? pkg : boxes)}</span>
      <div class="gi-tarefa-l__t"><b>${x.ref}</b><small>${x.t}</small>${x.p ? prog(x.p[0], x.p[1], x.tipo === 'inventario' ? 'Posições' : 'Artigos') : ''}<small class="gi-tarefa-l__quem">${L(userRound)}${x.quem || 'Sem pessoa'} · ${x.zona}</small></div>
      <button type="button" class="gp-btn ${x.est === 'curso' ? 'gp-btn--sec' : 'gp-btn--acao'}" data-ir="${x.acao[1]}">${L(x.acao[2])}<span>${x.acao[0]}</span></button></div></li>`;
  return ecra(`<h1 class="gp-titulo">Tarefas</h1>
    ${ARRUMACAO_ATIVA ? `<div class="gi-tipos" role="group" aria-label="Tipo">${[['', 'Tudo'], ['inventario', 'Inventário'], ['arrumacao', 'Arrumação']].map(([k, t], i) => `<button type="button" class="gi-tipo" data-gi-tipo="${k}" aria-pressed="${i === 0}">${t}</button>`).join('')}</div>` : ''}
    <div class="gp-filtros" role="tablist" aria-label="Estado">${SEP.map(([k, t], i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-gi-sep="${k}">${t} <span>${TS.filter((x) => x.est === k).length}</span></button>`).join('')}</div>
    ${SEP.map(([k], i) => `<ul class="gp-lista gi-sep" role="list" data-gi-painel="${k}"${i ? ' hidden' : ''}>${TS.filter((x) => x.est === k).map(linha).join('')}</ul>`).join('')}`,
  { titulo: 'Tarefas', gestor: true, barra: barra('gestor', 'tarefas') });
}

/* ---------- Gestor · 66 · Mais ---------- */
const itemMais = (ic: string, t: string, x: string, ir: string, extra = '') => `<li><button type="button" class="gi-mais"${ir ? ` data-ir="${ir}"` : ''}${extra}><span class="gi-mais__ic">${L(ic)}</span><span><b>${t}</b><small>${x}</small></span>${L(arrowRight, 'gi-seta')}</button></li>`;
function maisGestor(): string {
  return ecra(`<h1 class="gp-titulo">Mais</h1>
    <section class="gp-sec">${h2('Inventário')}<ul class="gi-mais-l" role="list">${itemMais(triangle, 'Divergências', '2 por rever no INV-2026-014', 'inv-divergencias')}${itemMais(history, 'Histórico do inventário', 'Os inventários fechados e os ajustes enviados ao ERP', 'gestor-historico')}</ul></section>
    ${ARRUMACAO_ATIVA ? `<section class="gp-sec">${h2('Arrumação')}<ul class="gi-mais-l" role="list">${itemMais(triangle, 'Exceções da arrumação', `${RESUMO_ARRUMACAO.problemas} por resolver`, 'arr-excecoes')}${itemMais(history, 'Histórico da arrumação', 'Os movimentos confirmados', 'arr-historico')}</ul></section>` : ''}
    <section class="gp-sec">${h2('A conta')}<ul class="gi-mais-l" role="list">${itemMais(users, 'Ver como (demonstração)', 'Gestor, Arrumação, Separação, Expedição', '', ' data-gi-ver-como')}${itemMais(logOut, 'Terminar sessão', 'Ana Ferreira · volta ao início de sessão comum', 'gestor-sessao')}</ul></section>
`,
  { titulo: 'Mais', gestor: true, barra: barra('gestor', 'mais') });
}

/* =========================================================
   Operador (Arrumação) · 58 · Tarefas · 59 · Ler · 67 · Histórico · 68 · Mais
   ========================================================= */
const OP: Opcoes = { funcao: 'Arrumação' };
function tarefasOperador(): string {
  return ecra(`<h1 class="gp-titulo">Tarefas</h1>
    <section class="gi-dom"><p class="gi-tarefa__rot">${L(play)}Em mãos</p><div class="gi-tarefa__cab"><b>${INV}</b><span class="gp-tag gp-tag--curso">A meio</span></div><p class="gi-dom__meta">Contagem · zona 30 · às cegas</p><p class="gi-dom__onde">${L(mapPin)}<span>Parou em</span>${posicao(POS, 'gi-pos--peq')}</p>${prog(18, 46)}${acao('Continuar', play, ' data-ir="inv-ler"')}</section>
    <section class="gp-sec">${h2('Contagens atribuídas', 1)}<ul class="gi-mais-l" role="list">${itemMais(listTodo, 'INV-2026-015', 'Cíclica · zona 10 · 30 posições · a seguir', 'inv-lista')}</ul></section>
`,
  { ...OP, titulo: 'Tarefas', barra: barra('arrumacao', 'tarefas') });
}
type ELer = 'normal' | 'lido' | 'sem-contexto';
function ler(e: ELer = 'normal'): string {
  if (e === 'lido') return ecra(`<h1 class="gp-titulo">Leu 60300102</h1>
    <section class="gi-cartao">${posicao(POS, 'gi-pos--grande')}<p>Uma posição da zona 30 — é da contagem que tem a meio.</p></section>
    <ul class="gi-mais-l" role="list">${itemMais(play, 'Continuar a contagem aqui', `${INV} · esta posição`, 'inv-artigo')}${itemMais(pencil, 'Corrigir esta posição', 'Fica fechado: está em contagem às cegas', 'inv-cp-em-contagem')}</ul>`,
  { ...OP, titulo: 'Ler', barra: barra('arrumacao', 'ler') });
  if (e === 'sem-contexto') return ecra(`${aviso('info', scanBarcode, 'Leu 7316201250277', 'É um artigo (SKF VKBA 6556). Não tem nenhuma tarefa em mãos que o peça: o que quer fazer?')}
    <ul class="gi-mais-l" role="list">${itemMais(search, 'Consultar o stock', 'Onde está e quanto o sistema diz que há', 'inv-consultar')}${itemMais(pencil, 'Corrigir uma posição', 'Lê primeiro a posição', 'inv-cp-ler')}</ul>
    ${''}`,
  { ...OP, titulo: 'Ler', barra: barra('arrumacao', 'ler') });
  return ecra(`<button type="button" class="gi-leitor" data-ler="60300102" data-tipo-leitura="contexto" data-depois="op-ler-lido">
      <span class="gi-mira" aria-hidden="true"><i></i><i></i><i></i><i></i><span class="gi-mira__linha"></span>${L(scanBarcode, 'gi-mira__ic')}</span>
      <b class="gi-leitor__t">Leia uma etiqueta</b><small class="gi-leitor__x">Posição, artigo ou palete. A Pick diz o que pode fazer com ela na tarefa em mãos.</small><span class="gi-leitor__tecla">Prima a tecla de leitura</span></button>
    <section class="gp-sec">${h2('Ou escolha primeiro')}<div class="gp-dois">
      <button type="button" class="gp-rap" data-ir="inv-ler">${L(play)}<span>Continuar a contagem</span></button>
      <button type="button" class="gp-rap" data-ir="inv-cp-ler">${L(pencil)}<span>Corrigir posição</span></button>
      <button type="button" class="gp-rap" data-ir="inv-consultar">${L(search)}<span>Consultar stock</span></button></div></section>`,
  { ...OP, titulo: 'Ler', barra: barra('arrumacao', 'ler') });
}
function historicoOperador(vazio = false): string {
  const H: [string, string, string, string][] = [['10:44', 'Contagem', 'SKF02553 · 12 un. · 60300102', 'inv-contados'], ['10:42', 'Contagem', 'SKF VKBA 6556 · 4 un. · 60300102', 'inv-contados'], ['10:29', 'Correção', 'SKF VKPC 88618 · 5 un. · 60300101', 'inv-contados'], ['08:40', 'Chegada', 'CH-2026-0412 · Transportes Vieira · 3 paletes', '']];
  return ecra(`<h1 class="gp-titulo">Histórico</h1><p class="gp-nota">Hoje · só o que o servidor confirmou</p>
    ${vazio ? `<section class="gi-vazio">${L(clock)}<p><b>Ainda nada hoje.</b> Cada contagem, correção ou chegada confirmada aparece aqui.</p></section>`
    : `<ul class="gi-linhas" role="list">${H.map(([h, t, x, ir]) => `<li class="gi-linha"${ir ? ` data-ir="${ir}" role="button" tabindex="0"` : ''}><div><b>${t}</b><span>${x}</span></div><div class="gi-linha__q"><b>${h}</b></div></li>`).join('')}</ul>`}`,
  { ...OP, titulo: 'Histórico', barra: barra('arrumacao', 'historico') });
}
function maisOperador(k: Funcao = 'arrumacao'): string {
  const nome = { arrumacao: 'Inês Rocha', separacao: 'Tiago Lopes', expedicao: 'Paulo Reis', gestor: 'Ana Ferreira' }[k];
  const quem = { arrumacao: { nome: 'Inês Rocha', iniciais: 'IR' }, separacao: { nome: 'Tiago Lopes', iniciais: 'TL' }, expedicao: { nome: 'Paulo Reis', iniciais: 'PR' }, gestor: { nome: 'Ana Ferreira', iniciais: 'AF' } }[k];
  return ecra(`<h1 class="gp-titulo">Mais</h1>
    ${k === 'arrumacao' ? `<section class="gp-sec">${h2('Arrumação')}<ul class="gi-mais-l" role="list">${itemMais(history, 'Histórico de arrumações', 'O que o servidor confirmou', 'ta-historico')}</ul></section>` : ''}
    ${k !== 'gestor' ? `<section class="gp-sec">${h2('Inventário')}<ul class="gi-mais-l" role="list">${itemMais(list, 'Contagens atribuídas', 'As suas contagens e o estado', 'inv-lista')}${itemMais(search, 'Consultar stock', 'Ler um artigo ou uma posição', 'inv-consultar')}</ul></section>` : ''}
    <section class="gp-sec">${h2('A conta')}<ul class="gi-mais-l" role="list">${itemMais(users, 'Ver como (demonstração)', 'Mudar de função', '', ' data-gi-ver-como')}${itemMais(logOut, 'Terminar sessão', `${nome} · volta ao início de sessão comum`, 'op-sessao')}</ul></section>
`,
  { titulo: 'Mais', funcao: { arrumacao: 'Arrumação', separacao: 'Separação', expedicao: 'Expedição', gestor: 'Gestor' }[k], quem, barra: barra(k, 'mais') });
}

/* =========================================================
   Os estados da navegação
   ========================================================= */
const barraCarregar = (n: number) => `<nav class="gi-barra gi-barra--${n} is-carregar" data-por-cima aria-label="Navegação a carregar" style="--n:${n};--i:0">${'<span class="gi-barra__esq"><i></i><i></i></span>'.repeat(n)}</nav>`;
const estadosNav = (): [string, string, string, string, string, string][] => [
  ['gestor-nav-carregar', 'gestor-inicio', '60.12 · A barra a carregar', 'O menu central ainda não respondeu: a barra em esqueleto, o Início já está.', centro('normal', barraCarregar(5)), 'v3'],
  ['gestor-nav-falhou', 'gestor-inicio', '60.13 · O menu não carregou', 'O menu central não respondeu: ficam Início e Mais, e diz-se; tentar outra vez.', centro('normal', `<p class="gi-barra-aviso" data-por-cima role="status">${L(serverOff)}O menu não carregou: só Início e Mais. <button type="button" class="gp-ligacao">${L(refresh)}Tentar outra vez</button></p>${barra('gestor', 'inicio', { so: ['inicio', 'mais'] })}`), 'v3'],
  ['gestor-nav-indisponivel', 'gestor-inicio', '60.14 · Destino indisponível', 'A Arrumação foi desligada no menu central a meio do dia: sai das Operações, e quem estava lá vê porquê.', ecra(aviso('info', lock, 'A Arrumação deixou de estar disponível', 'O administrador desligou o módulo. O que estava atribuído continua no servidor; não se perde nada.'), { titulo: 'Arrumação', gestor: true, barra: barra('gestor', 'operacoes') }), 'v3'],
  ['op-nav-sem-destinos', 'op-inicio', '57.10 · Sem destinos autorizados', 'A conta entrou mas não tem nenhum módulo da Pick: só Mais (a conta e terminar sessão).', ecra(aviso('erro', lock, 'Ainda não tem módulos na Pick', 'A sua conta não tem permissões para nenhum módulo do armazém 60. Peça-as ao gestor do turno.'), { ...OP, titulo: 'Início', barra: barra('arrumacao', 'mais', { so: ['mais'] }) }), 'v2'],
  ['op-por-confirmar', 'op-inicio', '57.11 · Uma contagem por confirmar', 'Tocou noutro destino com a quantidade escrita e por confirmar: pergunta antes de sair; nada se perde sem querer.', ecra(`${aviso('aviso', triangle, 'Tem uma contagem por confirmar', 'SKF VKBA 6556 · 4 un. na 60300102 ainda não foi registada. Se sair, o número não fica.')}`, { ...OP, titulo: 'Ler e contar', pe: `${acao('Voltar e confirmar', check, ' data-ir="inv-ler-lido"')}${sec('Sair sem registar', arrowLeft, ' data-ir="op-tarefas"')}` }), 'v2'],
  ['op-reatribuida', 'op-inicio', '57.12 · Tarefa reatribuída', 'O gestor passou a contagem para outra pessoa: sai das Tarefas e diz-se; o que contou fica.', ecra(aviso('info', repeat, 'A contagem passou para a Inês', `O gestor reatribuiu o ${INV}. As 18 posições que contou ficam registadas com o seu nome.`), { ...OP, titulo: 'Tarefas', barra: barra('arrumacao', 'tarefas') }), 'v2'],
  ['op-permissao-retirada', 'op-inicio', '57.13 · Permissão retirada', 'O Inventário deixou de estar autorizado: os destinos dele saem da barra.', ecra(aviso('erro', userRound, 'Já não tem o Inventário', 'A permissão «Registar contagens» foi retirada da sua conta. Ler e as Tarefas saíram da barra.'), { ...OP, titulo: 'Início', barra: barra('arrumacao', 'inicio', { so: ['inicio', 'historico', 'mais'] }) }), 'v2'],
];

/* =========================================================
   Os ecrãs e as versões
   ========================================================= */
export type IdNavegacao = `g-${string}`;
const NOTA = 'A barra inferior por função (27 out., briefing «Role-Based Bottom Navigation», no Figma e só com rede): Tarefas em destaque no Gestor, Ler em destaque no Operador; sem fila de guias, sem supervisor inventado, «Mais» só com o que existe.';
/** As versões com a barra: Início do Gestor v3, Inventário v3, Arrumação v2, Início do Operador v2 e as páginas da Separação e da Expedição v2. */
export function comBarra<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  const V: Record<string, [string, () => string]> = {
    'gestor-inicio': ['v3', () => inicioV2('normal', barra('gestor', 'inicio'))],
    'gestor-inventario': ['v3', () => inventarioV2(barra('gestor', 'inventario'))],
    'arr-inicio': ['v2', () => arrumacaoInicio('normal', barra('gestor', 'arrumacao'))],
    'op-inicio': ['v2', () => inicioOperador('normal', barra('arrumacao', 'inicio'))],
    'op-separacao': ['v2', () => paginaSemInventario('separacao', barra('separacao', 'inicio'))],
    'op-expedicao': ['v2', () => paginaSemInventario('expedicao', barra('expedicao', 'inicio'))],
  };
  return ecras.map((e) => V[e.id] ? { ...e, versoes: [...e.versoes, { id: V[e.id][0], nota: NOTA, html: V[e.id][1]() }] as Ecra<T>['versoes'] } : e);
}
export function ecrasNavegacao(): Ecra<string>[] {
  const e = (id: string, nome: string, fluxo: string, objetivo: string, html: string, de?: string, v = 'v1'): Ecra<string> => ({ id, nome, fluxo, objetivo, ...(de ? { estadoDe: de } : {}), versoes: [{ id: v, nota: NOTA, html }] });
  return [
    e('g-tarefas', '65 · Tarefas (Gestor)', 'Gestor', 'O centro das tarefas: Inventário e Arrumação juntos, por estado (por atribuir, em curso, atenção), filtrados por tipo e pessoa, cada uma com a ação seguinte.', tarefasGestor()),
    e('g-mais', '66 · Mais (Gestor)', 'Gestor', 'O que não cabe na barra: divergências, históricos, exceções, a conta e o «Ver como».', maisGestor()),
    e('op-tarefas', '58 · Tarefas (Arrumação)', 'Inventário', 'A tarefa em mãos e as contagens atribuídas; a fila das guias não se mostra (o motor entrega uma de cada vez).', tarefasOperador()),
    e('op-ler', '59 · Ler', 'Inventário', 'O leitor ao centro: lê uma etiqueta e a Pick diz o que pode fazer com ela na tarefa em mãos; ou escolhe-se primeiro a operação.', ler()),
    e('op-ler-lido', '59.1 · Leu uma posição', 'Inventário', 'Uma posição lida: o que se pode fazer com ela, pela tarefa em mãos (e o que está fechado, e porquê).', ler('lido'), 'op-ler'),
    e('op-ler-sem-contexto', '59.2 · Leu sem tarefa', 'Inventário', 'Um artigo lido sem tarefa que o peça: a Pick pergunta o que fazer; nunca adivinha.', ler('sem-contexto'), 'op-ler'),
    e('op-historico', '67 · Histórico (Arrumação)', 'Inventário', 'O que o servidor confirmou hoje: contagens, correções e chegadas, com a hora.', historicoOperador()),
    e('op-historico-vazio', '67.1 · Ainda nada hoje', 'Inventário', 'Sem nada confirmado hoje.', historicoOperador(true), 'op-historico'),
    e('op-mais', '68 · Mais (Arrumação)', 'Inventário', 'As contagens atribuídas, consultar stock, a conta e o «Ver como».', maisOperador('arrumacao')),
    e('op-mais-separacao', '68.1 · Mais (Separação)', 'Inventário', 'As contagens atribuídas e consultar stock (o Inventário é de todos) e a conta; o módulo da Separação ainda não está na Pick.', maisOperador('separacao'), 'op-mais'),
    e('op-mais-expedicao', '68.2 · Mais (Expedição)', 'Inventário', 'As contagens atribuídas, consultar stock e a conta.', maisOperador('expedicao'), 'op-mais'),
    ...estadosNav().map(([id, de, nome, objetivo, html, v]) => e(id, nome, de.startsWith('gestor') ? 'Gestor' : 'Inventário', objetivo, html, de, v)),
    /* os estados novos do 61 (os que já existiam ganham a versão nova em soUltima) */
    ...ESTADOS_INVENTARIO_GESTOR.filter(([id]) => !['gestor-inventario-carregar', 'gestor-inventario-vazio', 'gestor-inventario-erro', 'gestor-inventario-sem-rede', 'gestor-inventario-operador'].includes(id)).map(([id, nome, objetivo, html]) => e(id, nome, 'Gestor', objetivo, html(), 'gestor-inventario', 'v3')),
  ];
}

/* =========================================================
   27 out. (ela: «só quero a última versão, não todos»): na Pick cada ecrã fica só com a última versão. Para isso:
     - a abertura passa a desenhar-se por cima do Início do Gestor v3 (com a barra), e não da v1;
     - os estados do Início do Gestor que eram da v1 (60.1–60.10) passam a ser da v3;
     - o «Nada pede atenção» da v2 (60.11) sai: é o mesmo que o 60.3.
   ========================================================= */
/** A abertura por cima do Início v3: as mesmas marcas que o comportamento da abertura procura (data-gp…). */
export function aberturaV3(cen: CenarioAbertura = 'normal'): string {
  /* 28 out.: por cima do Início v4 (o Gestor faz tudo); a caixa voa para o ícone do Inventário */
  return centro()
    .replace('<div class="gp gpi" data-gpi data-ir-ultima>', `<div class="gp gpi is-abertura" data-gpi data-ir-ultima data-gp data-gp-cenario="normal" data-gp-abertura>`)
    .replace('<div class="gp-marca">', '<div class="gp-marca" data-gp-marca>')
    .replace('<span class="gi-mod__ic">', '<span class="gi-mod__ic" data-gp-alvo>')
    .replace('<main class="gp-corpo gi-corpo">', '<main class="gp-corpo gi-corpo" aria-hidden="true" inert>')
    .replace(/<\/div>\s*$/, `${camadaAbertura(cen)}</div>`);
}
const GI: Opcoes = { titulo: 'Centro de operações', gestor: true, funcao: 'Gestor' };
const comB = (o: Opcoes): Opcoes => ({ ...o, barra: barra('gestor', 'inicio') });
/** Os estados do Início do Gestor, agora na v3. */
export const ESTADOS_GESTOR_V3: Record<string, () => string> = {
  'gestor-carregar': () => eCarregar(comB(GI), 4),
  'gestor-sem-inventarios': () => ecra(`<div class="gp-ola gi-ola-peq"><h1>Bom dia, Ana</h1><p>O armazém 60 agora.</p></div><section class="gi-vazio">${L(pkg)}<p><b>Não há inventários em curso.</b> Crie um no Inventário: escolhe o âmbito e quem conta.</p></section>${acao('Novo inventário', userPlus, ' data-ir="gestor-inv-novo"')}`, comB(GI)),
  'gestor-sem-tarefas': () => inicioV4('sem-atencao'),
  'gestor-erro': () => eServidor(comB(GI), 'PK-2710-0C17'),
  'gestor-sem-rede': () => eSemRede(comB(GI)),
  'gestor-menus': () => centro('normal', `<p class="gi-barra-aviso" data-por-cima role="status">${L(serverOff)}O menu não carregou: só Início e Mais. <button type="button" class="gp-ligacao">${L(refresh)}Tentar outra vez</button></p>${barra('gestor', 'inicio', { so: ['inicio', 'mais'] })}`),
  'gestor-permissao': () => ecra(aviso('info', userRound, 'As suas permissões mudaram', 'Agora vê só o que é da <b>Arrumação</b>. Entre outra vez para as atualizar.'), { ...GI, pe: acao('Entrar outra vez', refresh, ' data-login') }),
  'gestor-sessao': () => eSessao(GI),
  'gestor-sem-acesso': () => ecra(aviso('erro', lock, 'A sua conta não tem acesso à Pick', 'Peça o acesso ao administrador da sua empresa.'), GI),
  'gestor-sem-armazem': () => ecra(aviso('erro', mapPin, 'Ainda não tem um armazém atribuído', 'O administrador atribui-lhe o armazém 60 na sua conta ROMAFE.'), GI),
};
/* 27 out. (ela: «faz todos os possíveis estados do screen»): o 61 · Inventário, todos com a barra e o select */
const GINV: Opcoes = { titulo: 'Inventário', gestor: true };
const bInv = () => barra('gestor', 'inventario');
export const ESTADOS_INVENTARIO_GESTOR: [string, string, string, () => string][] = [
  ['gestor-inventario-carregar', '61.3 · A carregar', 'Os inventários a chegar; a faixa e a lista em esqueleto, a barra já está.', () => eCarregar({ ...GINV, barra: bInv() }, 4)],
  ['gestor-inventario-vazio', '61.4 · Sem inventários', 'Ainda nenhum: Novo inventário.', () => eVazio({ ...GINV, barra: bInv() }, inboxIc, 'Ainda não há inventários.', 'Crie o primeiro: o âmbito, as regras e quem conta.', acao('Novo inventário', userPlus, ' data-ir="gestor-inv-novo"'))],
  ['gestor-inventario-erro', '61.5 · Não carregou', 'O servidor não respondeu: tentar outra vez, com a referência.', () => eServidor({ ...GINV, barra: bInv() }, 'PK-2710-1B9D')],
  ['gestor-inventario-sem-rede', '61.6 · Sem rede', 'A Pick para e espera; não mostra a lista velha como se fosse de agora.', () => eSemRede({ ...GINV, barra: bInv() })],
  ['gestor-inventario-operador', '61.7 · Aberto pela Arrumação', 'Criar, atribuir e validar é do gestor: a Arrumação vai para o seu Inventário.', () => eSemPermissao({ titulo: 'Inventário', funcao: 'Arrumação', barra: barra('arrumacao', 'inicio') }, 'Criar, atribuir e validar inventários é do gestor. O seu Inventário é o de contar.', 'op-inicio')],
  ['gestor-inventario-iniciar', '61.8 · Por iniciar', 'Tocar em «Por iniciar»: o INV-2026-015, à espera de quem conte.', () => inventarioV2(bInv(), { sep: 'planeada' })],
  ['gestor-inventario-validar', '61.9 · Por validar', 'Tocar em «Por validar»: o INV-2026-011 submetido, com Validar.', () => inventarioV2(bInv(), { sep: 'validar' })],
  ['gestor-inventario-concluidos', '61.10 · Concluídos', 'Tocar em «Concluídos»: o INV-2026-009, com o histórico.', () => inventarioV2(bInv(), { sep: 'concluidos' })],
  ['gestor-inventario-fechados', '61.11 · Cartões fechados', 'Nenhum cartão aberto: tocar num abre-o no sítio, com as tarefas e a ação.', () => inventarioV2(bInv(), { fechados: true })],
  ['gestor-inventario-grupo-vazio', '61.12 · Nada neste estado', 'O estado escolhido não tem inventários: diz-se, sem lista vazia.', () => inventarioV2(bInv(), { sep: 'validar', vazio: true })],
  ['gestor-inventario-so-consulta', '61.13 · Só consulta', 'A conta vê os inventários mas não os cria: Novo inventário desligado, com o porquê.', () => inventarioV2(bInv(), { semCriar: true })],
  ['gestor-inventario-mudou', '61.14 · Mudou entretanto', 'Outro gestor validou um inventário enquanto se via a lista: diz-se quem e quando, e a lista já está atualizada.', () => inventarioV2(bInv(), { aviso: aviso('info', refresh, 'A lista foi atualizada', 'O Luís Costa validou o INV-2026-010 às 11:52. Passou para Concluídos.') })],
  ['gestor-inventario-sessao', '61.15 · Sessão terminada', 'Entrar outra vez; volta-se a esta lista.', () => eSessao(GINV)],
];

/* 29 out. (ela: «na app do gestor faltam backs», «de voltar atrás em todos os screens»): todos os ecrãs com o voltar no
   cabeçalho. Quem não o tinha leva-o para o ecrã de cima: as páginas da barra para o Centro de operações, os módulos para
   as Operações, o acompanhar e o executar para o seu módulo; o Centro e a abertura voltam ao início de sessão comum. */
const LOGIN = '';
const PAI: [RegExp, string][] = [
  [/^gestor-inventario/, 'g-operacoes'], [/^gestor-validar/, 'gestor-inventario'], [/^g-inv-fim/, 'g-inv-exec'], [/^g-inv-/, 'gestor-inventario'],
  [/^arr-inicio/, 'g-operacoes'], [/^(g-arr-|arr-)/, 'arr-inicio'], [/^g-sep-acomp/, 'g-sep'], [/^g-sep/, 'g-operacoes'], [/^g-exp-acomp/, 'g-exp'], [/^g-exp/, 'g-operacoes'],
  [/^(abertura|gestor-)/, LOGIN], [/^(op-|inv-)/, 'op-inicio'],
];
function comVoltar<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  const ids = new Set<string>(ecras.map((e) => e.id));
  return ecras.map((e) => {
    const base = e.estadoDe ?? e.id;
    let pai = PAI.find(([r]) => r.test(base))?.[1] ?? 'gestor-inicio';
    if (pai === base || (pai && !ids.has(pai))) pai = pai === 'op-inicio' || base.startsWith('op-') ? LOGIN : 'gestor-inicio';
    const botao = `<button type="button" class="gp-voltar" ${pai ? `data-ir="${pai}" aria-label="Voltar"` : 'data-login aria-label="Voltar ao início de sessão"'}>${L(arrowLeft)}</button>`;
    const versoes = e.versoes.map((v) => v.html.includes('class="gp-topo"') && !v.html.includes('class="gp-voltar"') ? { ...v, html: v.html.replace(/(<header class="gp-topo">)/, `$1\n    ${botao}`) } : v);
    return { ...e, versoes } as Ecra<T>;
  });
}

/** Só a última versão de cada ecrã; os estados do Início do Gestor na v3; a abertura por cima da v3. */
export function soUltima<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  const ABERTURA: Record<string, CenarioAbertura> = { abertura: 'normal', 'abertura-pk-sem-rede': 'sem-rede', 'abertura-pk-sem-acesso': 'sem-acesso' };
  return comVoltar(semRepetidos(ecras.filter((e) => e.id !== 'gestor-inicio-sem-atencao' && e.id !== 'gestor-sem-inventarios').map((e) => {
    const ultima = e.versoes[e.versoes.length - 1];
    if (ABERTURA[e.id]) return { ...e, versoes: [{ ...ultima, id: 'v3', nota: `${ultima.nota} — por cima do Início do Gestor v3, com a barra (27 out.).`, html: aberturaV3(ABERTURA[e.id]) }] as Ecra<T>['versoes'] };
    if (ESTADOS_CENTRO[e.id]) return { ...e, versoes: [{ id: 'v5', nota: NOTA, html: ESTADOS_CENTRO[e.id]() }] as Ecra<T>['versoes'] };
    if (ESTADOS_GESTOR_V3[e.id]) return { ...e, versoes: [{ id: 'v3', nota: NOTA, html: ESTADOS_GESTOR_V3[e.id]() }] as Ecra<T>['versoes'] };
    const ei = ESTADOS_INVENTARIO_GESTOR.find(([id]) => id === e.id); if (ei) return { ...e, nome: ei[1], objetivo: ei[2], versoes: [{ id: 'v3', nota: NOTA, html: ei[3]() }] as Ecra<T>['versoes'] };
    return { ...e, versoes: [ultima] };
  })));
}
/* 28 out. (ela: «sim» ao que eu mudaria na app do Gestor, ponto 5): o mesmo «Sem rede», «A carregar», «Não carregou» e
   «Sessão terminada» repetidos em cada ecrã (mais de 40) saem. Ficam os do Centro de operações (60.x), os do fluxo Erros
   (30–36), e os que são mesmo diferentes: a falta de rede a meio de uma operação (a linha fica onde estava), o «A calcular»
   das Insights (o período já serve). O 60.2 «Sem inventários» sai também: é o 60.16 «Nada a acontecer» só com o Inventário. */
const GENERICOS = ['não mostra dados velhos como se fossem de agora', 'Não foi possível ler os dados. Nada mudou.', 'Por segurança, entre outra vez pelo início de sessão comum'];
function semRepetidos<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  const generico = (e: Ecra<T>) => {
    if (!e.estadoDe || e.estadoDe === 'gestor-inicio') return false;
    const h = e.versoes[e.versoes.length - 1].html;
    return GENERICOS.some((g) => h.includes(g)) || (/· A carregar$/.test(e.nome) && h.includes('girador girador--pequeno'));
  };
  /* um que outro ecrã abre por uma ligação fica (o «Terminar sessão» do Mais leva ao 57.8) */
  const ligados = new Set(ecras.flatMap((e) => [...e.versoes[e.versoes.length - 1].html.matchAll(/data-(?:ir|depois)="([^"]+)"/g)].map((m) => m[1])));
  const fora = new Set(ecras.filter((e) => generico(e) && !ligados.has(e.id)).map((e) => e.id));
  return ecras.filter((e) => !fora.has(e.id));
}
