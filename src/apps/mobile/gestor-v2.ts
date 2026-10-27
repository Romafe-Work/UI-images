/* =========================================================
   PICK — o Gestor v2: Inventário e Arrumação (27 out. 2026)
   Do briefing dela «ROMAFE Warehouse V2 — Manager Inventory & Putaway», no Figma e só com rede (as respostas de
   hoje: «apenas com rede», «no figma»). As versões novas não mexem nas que ela já viu:
     - 60 · Início do Gestor v2: o cabeçalho compacto (ROMAFE | Pick, armazém, ligação, conta), «Precisa da tua
       atenção» (só exceções verdadeiras) e os dois módulos — Inventário e Arrumação — como espaços de trabalho, cada
       um com a sua faixa de estado e a sua entrada; sem gráficos nem contadores a mais;
     - 61 · Inventário v2: a faixa (em curso · por validar · divergências), «Novo inventário», os separadores e o
       cartão que se abre no sítio (o progresso continua ligado, as tarefas aparecem por baixo);
     - 61.1 · Criar v3: cinco passos (âmbito, regras, quem conta, rever, criar) — nada se cria antes de o servidor
       confirmar;
     - 53 · Divergências v3: contado, sistema (só o gestor), diferença, o histórico das contagens e quem as fez;
       pedir e atribuir a recontagem; resolver só com o ajuste do servidor.
   O que fica de fora de propósito: sincronização pendente (a Pick não trabalha sem rede), mapa do armazém (é da v2,
   22 set.), capacidades de posição (não há valores medidos). A Arrumação está em arrumacao.ts.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { ecra, acao, sec, aviso, nota, prog, posicao, h2, L } from './inventario-v2';
import { INVENTARIOS } from './gestor';
import { CAIXA } from './cena';
import { RESUMO_ARRUMACAO } from './arrumacao';
import check from 'lucide-static/icons/check.svg?raw';
import triangle from 'lucide-static/icons/triangle-alert.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import rotate from 'lucide-static/icons/rotate-ccw.svg?raw';
import shieldCheck from 'lucide-static/icons/shield-check.svg?raw';
import userPlus from 'lucide-static/icons/user-plus.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import eyeOff from 'lucide-static/icons/eye-off.svg?raw';
import userRound from 'lucide-static/icons/user-round.svg?raw';

const G = { gestor: true } as const;
/** 27 out. (ela: «por agora no menu mostra só inventário»): a Arrumação fica desligada no menu — como o «ativo» do menu
 *  central. Os ecrãs dela continuam no editor; com true, voltam à barra, ao Início, às Tarefas e ao Mais. */
export const ARRUMACAO_ATIVA = false;

/* ---------- a faixa de estado de um módulo: números verdadeiros, pequenos, lado a lado ---------- */
const faixa = (xs: [string, number, ('aviso' | 'erro' | '')?][]) => `<dl class="gi-faixa">${xs.map(([t, n, tom]) => `<div${tom ? ` class="is-${tom}"` : ''}><dd>${n}</dd><dt>${t}</dt></div>`).join('')}</dl>`;

/* =========================================================
   60 · Início do Gestor v2
   ========================================================= */
const ATENCAO: [string, string, string, string, 'erro' | 'aviso' | 'info'][] = [
  [shieldCheck, 'INV-2026-011 por validar', '16 posições · 2 divergências', 'gestor-validar', 'aviso'],
  [lock, 'Destino em contagem', 'GA-2026-0329 → 60300104 · zona 30 às cegas', 'arr-guia-bloqueada', 'erro'],
  [userPlus, 'GA-2026-0331 sem pessoa', 'Ninguém da arrumação livre · 2 paletes', 'arr-guia', 'info'],
];
export function inicioV2(cen: 'normal' | 'sem-atencao' = 'normal', barra?: string): string {
  const at = cen === 'sem-atencao' ? [] : ATENCAO.filter(([, , , ir]) => ARRUMACAO_ATIVA || !ir.startsWith('arr-'));
  return ecra(`<div class="gp-ola gi-ola-peq"><h1>Bom dia, Ana</h1></div>
    <section class="gp-sec">${h2('Precisa da tua atenção', at.length || undefined)}
      ${at.length ? `<ul class="gp-lista" role="list">${at.map(([ic, t, x, ir, tom], i) => `<li style="--i:${i}"><button type="button" class="gp-item gp-item--${tom}" data-ir="${ir}"><span class="gp-item-ic">${L(ic)}</span><span class="gp-item-t"><b>${t}</b><small>${x}</small></span>${L(arrowRight, 'gi-seta')}</button></li>`).join('')}</ul>`
      : `<p class="gp-vazio">${L(check)}Nada pede a tua atenção agora.</p>`}
    </section>
    <button type="button" class="gi-mod gi-mod--inv" data-ir="gestor-inventario" aria-label="Abrir o Inventário">
      <span class="gi-mod__cab"><span class="gi-mod__ic">${CAIXA()}</span><b>Inventário</b>${L(arrowRight, 'gi-seta')}</span>
      ${faixa([['Em curso', 1], ['Por validar', 1, 'aviso'], ['Divergências', 2, 'erro']])}
    </button>
    ${ARRUMACAO_ATIVA ? `    <button type="button" class="gi-mod gi-mod--arr" data-ir="arr-inicio" aria-label="Abrir a Arrumação">
      <span class="gi-mod__cab"><b>Arrumação</b>${L(arrowRight, 'gi-seta')}</span>
      ${faixa([['Por arrumar', RESUMO_ARRUMACAO.porArrumar], ['Em curso', RESUMO_ARRUMACAO.emCurso], ['Problemas', RESUMO_ARRUMACAO.problemas, 'erro']])}
    </button>` : ''}
  `, { titulo: 'Início', ...G, barra });
}

/* =========================================================
   61 · Inventário v2: a faixa, os separadores e o cartão que se abre
   ========================================================= */
const TAREFAS: Record<string, [string, string, number, number][]> = {
  'INV-2026-014': [['Colunas 01–12', 'Joana Silva', 18, 46]],
  'INV-2026-011': [['Colunas 01–04', 'Joana Silva', 16, 16]],
  'INV-2026-009': [['Toda a zona 12', 'Inês Rocha', 24, 24]],
};
const PROXIMA: Record<string, [string, string, string]> = { curso: ['Acompanhar', 'gestor-acompanhar', list], planeada: ['Atribuir', 'gestor-atribuir', userPlus], submetida: ['Validar', 'gestor-validar', shieldCheck], concluida: ['Ver no histórico', 'gestor-historico', history] };
const ROTULO: Record<string, [string, string]> = { curso: ['Em curso', 'curso'], planeada: ['Por iniciar', 'planeada'], submetida: ['Por validar', 'validar'], concluida: ['Concluído', 'ok'] };
/** As variantes do 61 para os estados (27 out., ela: «faz todos os possíveis estados do screen»). */
export interface OInv { sep?: 'curso' | 'planeada' | 'validar' | 'concluidos'; fechados?: boolean; vazio?: boolean; semCriar?: boolean; aviso?: string }
export function inventarioV2(barra?: string, o: OInv = {}): string {
  /* 27 out. (ela: «select»): o estado escolhe-se num select, e não em separadores que saíam da tela; os números estão na faixa */
  const grupos: [NonNullable<OInv['sep']>, string, string[]][] = [['curso', 'Em curso', ['curso']], ['planeada', 'Por iniciar', ['planeada']], ['validar', 'Por validar', ['submetida']], ['concluidos', 'Concluídos', ['concluida']]];
  const sel = o.sep ?? 'curso';
  const cartao = (i: number, aberto: boolean) => { const v = INVENTARIOS[i], [t, k] = ROTULO[v.estado], [pt, pir, pic] = PROXIMA[v.estado], ts = TAREFAS[v.ref] ?? [];
    return `<details class="gi-exp"${aberto ? ' open' : ''}><summary class="gi-exp__s"><span class="gi-exp__topo"><b>${v.ref}</b><span class="gp-tag gp-tag--${k}">${t}</span></span>
      <small>${v.tipo} · ${v.area}</small>${v.total ? prog(v.feitas, v.total) : ''}<span class="gi-exp__quem">${L(userRound)}${v.quem || 'Sem operador'}${L(chevronDown, 'gi-exp__seta')}</span></summary>
      <div class="gi-exp__c">${ts.length ? `<ul class="gi-secoes" role="list">${ts.map(([s, q, f, n]) => `<li class="gi-secao ${f === n ? 'is-feita' : 'is-atual'}"><span><b>${s}</b><small>${f} de ${n} posições</small></span><span class="gi-secao__quem"><i class="gp-av">${q.split(' ').map((p) => p[0]).join('')}</i>${q}</span></li>`).join('')}</ul>` : `<p class="gp-nota">Ainda sem quem conte.</p>`}
        <button type="button" class="gp-btn gp-btn--acao" data-ir="${pir}">${L(pic)}<span>${pt}</span></button></div></details>`; };
  const painel = (k: string, es: string[]) => { const xs = o.vazio && k === sel ? [] : INVENTARIOS.map((v, j) => es.includes(v.estado) ? j : -1).filter((j) => j >= 0);
    return xs.length ? xs.map((j, n) => cartao(j, !o.fechados && n === 0)).join('') : `<p class="gp-vazio">${L(check)}Nenhum inventário ${grupos.find((g) => g[0] === k)![1].toLowerCase()}.</p>`; };
  return ecra(`<div class="gi-acomp-cab"><h1 class="gp-titulo">Inventário</h1></div>
    ${o.aviso ?? ''}
    ${faixa([['Em curso', 1], ['Por validar', 1, 'aviso'], ['Divergências', 2, 'erro']])}
    ${o.semCriar ? `<button type="button" class="gp-btn gp-btn--acao gp-btn--grande" disabled aria-describedby="gi-sem-criar">${L(lock)}<span>Novo inventário</span></button><p class="gi-porque" id="gi-sem-criar">A sua conta só consulta: criar é do gestor com essa permissão.</p>` : acao('Novo inventário', plus, ' data-ir="gestor-inv-novo"')}
    <label class="gp-campo gi-sel"><span>Mostrar</span><select data-gi-sel aria-label="Mostrar os inventários">${grupos.map(([k, t]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
    ${grupos.map(([k, , es]) => `<div class="gi-sep" data-gi-painel="${k}"${k === sel ? '' : ' hidden'}>${painel(k, es)}</div>`).join('')}
    <button type="button" class="gp-ligacao" data-ir="inv-divergencias">${L(triangle)}Rever as 2 divergências</button>`,
  { voltar: barra ? undefined : 'gestor-inicio', titulo: 'Inventário', ...G, barra });
}

/* =========================================================
   61.1 · Criar inventário v3: cinco passos
   ========================================================= */
const PASSOS = ['Âmbito', 'Regras', 'Quem conta', 'Rever'];
const passos = (n: number) => `<ol class="gi-passos gi-passos--criar" aria-label="Passo ${n + 1} de 4">${PASSOS.map((p, i) => `<li class="${i < n ? 'is-feito' : i === n ? 'is-atual' : ''}"${i === n ? ' aria-current="step"' : ''}><i aria-hidden="true"></i><span>${p}</span></li>`).join('')}</ol>`;
export function criarPasso(n: 1 | 2 | 3 | 4 | 5): string {
  const o = { voltar: n > 2 && n < 5 ? `gestor-criar-${n - 1}` : n === 2 ? 'gestor-inv-novo' : 'gestor-inventario', titulo: 'Novo inventário', ...G };
  if (n === 5) return ecra(`${aviso('ok', shieldCheck, 'INV-2026-016 criado', 'O servidor confirmou. Zona 12 · retentores · 24 posições · às cegas · Inês Rocha. A tarefa chega ao PDA dela quando entrar ou acabar a que tem.')}`, { ...o, pe: `${acao('Acompanhar', list, ' data-ir="gestor-acompanhar"')}${sec('Voltar ao Inventário', arrowLeft, ' data-ir="gestor-inventario"')}` });
  const corpo = n === 1 ? `<fieldset class="gi-seg"><legend>O que se conta</legend>${['Armazém', 'Zonas', 'Posições', 'Artigos'].map((t, i) => `<label><input type="radio" name="gi-c1"${i === 1 ? ' checked' : ''}><span>${t}</span></label>`).join('')}</fieldset>
      <fieldset class="gi-zonas"><legend>Zonas</legend>${[['10', 'Rolamentos', 30, ''], ['12', 'Retentores', 24, 'x'], ['21', 'Kits de distribuição', 16, ''], ['30', 'Travagem e diversos', 46, 'o']].map(([z, t, q, k]) => `<label class="gi-zona${k === 'o' ? ' is-ocupada' : ''}"><input type="checkbox"${k === 'x' ? ' checked' : ''}${k === 'o' ? ' disabled' : ''}><span><b>Zona ${z}</b><small>${t} · ${q} posições</small></span>${k === 'o' ? '<em>Em contagem</em>' : ''}</label>`).join('')}</fieldset>`
    : n === 2 ? `<label class="gi-interruptor"><input type="checkbox" checked><span><b>Às cegas</b><small>Quem conta não vê o stock do sistema.</small></span></label>
      <fieldset class="gi-seg"><legend>Contagens por posição</legend><label><input type="radio" name="gi-c2" checked><span>Uma</span></label><label><input type="radio" name="gi-c2"><span>Duas</span></label></fieldset>
      <label class="gi-interruptor"><input type="checkbox" checked><span><b>Recontar as divergências</b><small>Uma diferença pede recontagem antes de se decidir.</small></span></label>
      ${nota('As regras vêm da configuração do armazém; aqui só se escolhe entre as que ela permite. Fechar pede sempre o gestor.')}`
    : n === 3 ? `<ul class="gp-escolha" role="radiogroup" aria-label="Quem conta">${[['Inês Rocha', 'IR', 'Sem contagem', ''], ['Joana Silva', 'JS', 'Já conta o INV-2026-014', 'o'], ['Deixar o motor escolher', 'M', 'Entrega a quem acabar primeiro', '']].map(([q, ini, t, k], i) => `<li><label class="gp-op${k ? ' is-ocupada' : ''}"><input type="radio" name="gi-c3"${i === 0 ? ' checked' : ''}${k ? ' disabled' : ''}><span class="gp-av">${ini}</span><span><b>${q}</b><small>${t}</small></span></label></li>`).join('')}</ul>`
    : `<dl class="gi-revisao"><div><dt>Âmbito</dt><dd>Zona 12 · retentores · 24 posições</dd></div><div><dt>Regras</dt><dd>Às cegas · uma contagem · recontar divergências</dd></div><div><dt>Quem conta</dt><dd>Inês Rocha</dd></div></dl>${nota('Nada se cria antes de o servidor confirmar. Se a zona entrar noutra contagem entretanto, diz-se e não se cria.')}`;
  return ecra(`<h1 class="gp-titulo">Novo inventário</h1>${passos(n - 1)}${corpo}`, { ...o, pe: n === 4 ? acao('Criar inventário', send, ' data-ir="gestor-criar-5"') : acao('Seguinte', arrowRight, ` data-ir="gestor-criar-${n + 1}"`) });
}

/* =========================================================
   53 · Divergências v3: o histórico das contagens, quem e o estado
   ========================================================= */
export function divergenciasV3(): string {
  const D: [string, string, number, number, [string, string, number][], 'rever' | 'recontar' | 'segunda'][] = [
    ['60300102', 'SKF02553 · Autocolante', 14, 18, [['1.ª', 'Joana Silva · 10:44', 12], ['correção', 'Joana Silva · 10:51', 14]], 'rever'],
    ['60300107', 'INA 530 0089 10 · Kit de distribuição', 0, 3, [['1.ª', 'Joana Silva · 10:12', 0]], 'recontar'],
    ['60300101', 'SKF VKPC 88618 · Bomba de água', 4, 5, [['1.ª', 'Joana Silva · 10:29', 5], ['2.ª (recontagem)', 'Inês Rocha · 11:20', 4]], 'segunda'],
  ];
  return ecra(`<h1 class="gp-titulo">Divergências</h1><p class="gp-nota">${INVENTARIOS[0].ref} · ${L(eyeOff)} só o gestor vê o sistema</p>
    <ul class="gp-lista" role="list">${D.map(([p, a, c, s, h, k], i) => `<li style="--i:${i}"><details class="gi-exp gi-div gi-div--${k === 'rever' ? '' : k === 'recontar' ? 'recontar' : 'ok'}"${i === 0 ? ' open' : ''}><summary class="gi-exp__s">${posicao(p, 'gi-pos--peq')}<p class="gi-div__art">${a}</p>
      <dl><div><dt>Contado</dt><dd>${c}</dd></div><div><dt>Sistema</dt><dd>${s}</dd></div><div><dt>Diferença</dt><dd class="${c < s ? 'is-menos' : 'is-mais'}">${c < s ? '−' : '+'}${Math.abs(c - s)}</dd></div></dl>
      <span class="gi-exp__quem">${k === 'rever' ? '<span class="gp-tag gp-tag--validar">Por rever</span>' : k === 'recontar' ? '<span class="gp-tag gp-tag--planeada">Recontagem pedida · Inês</span>' : '<span class="gp-tag gp-tag--curso">2.ª contagem por rever</span>'}${L(chevronDown, 'gi-exp__seta')}</span></summary>
      <div class="gi-exp__c"><ol class="gi-hist" aria-label="Contagens">${h.map(([q, quem, n]) => `<li><b>${n}</b><span>${q} · ${quem}</span></li>`).join('')}</ol>
        ${k === 'recontar' ? '<p class="gp-nota">A Inês reconta às cegas; a contagem da Joana fica guardada.</p>' : `<div class="gi-div__acoes"><button type="button" class="gp-btn gp-btn--acao" data-ir="gestor-validar">${L(check)}<span>Aceitar ${c}</span></button><button type="button" class="gp-btn gp-btn--sec" data-ir="gestor-atribuir">${L(rotate)}<span>Recontar</span></button></div>`}</div></details></li>`).join('')}</ul>
    ${nota('Aceitar não ajusta o stock: o ajuste só se faz ao fechar, pelo servidor, e fica na auditoria.')}`,
  { voltar: 'gestor-inventario', titulo: 'Divergências', ...G });
}

/* =========================================================
   Os ecrãs: as versões novas e os passos de criar
   ========================================================= */
const NOTA_V = 'Do briefing «ROMAFE Warehouse V2 — Manager Inventory & Putaway» (27 out.), no Figma e só com rede.';
/** 60 v2, 61 v2, 61.1 v3 e 53 v3 (as versões que ela já viu ficam). */
export function comGestorV2b<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  const V: Record<string, [string, () => string]> = { 'gestor-inicio': ['v2', () => inicioV2()], 'gestor-inventario': ['v2', inventarioV2], 'gestor-inv-novo': ['v3', () => criarPasso(1)], 'inv-divergencias': ['v3', divergenciasV3] };
  return ecras.map((e) => V[e.id] ? { ...e, versoes: [...e.versoes, { id: V[e.id][0], nota: NOTA_V, html: V[e.id][1]() }] as Ecra<T>['versoes'] } : e);
}
export function ecrasGestorV2(): Ecra<string>[] {
  const e = (id: string, de: string, nome: string, objetivo: string, html: string, v: string): Ecra<string> => ({ id, nome, fluxo: 'Gestor', objetivo, estadoDe: de, versoes: [{ id: v, nota: NOTA_V, html }] });
  return [
    e('gestor-inicio-sem-atencao', 'gestor-inicio', '60.11 · Nada pede atenção', 'O Início v2 sem exceções: diz-se, e os dois módulos ficam à frente.', inicioV2('sem-atencao'), 'v2'),
    e('gestor-criar-2', 'gestor-inv-novo', '61.1.5 · Passo 2: regras', 'Às cegas, uma ou duas contagens, recontar as divergências — só o que a configuração do armazém permite.', criarPasso(2), 'v3'),
    e('gestor-criar-3', 'gestor-inv-novo', '61.1.6 · Passo 3: quem conta', 'A arrumação livre, ou deixar o motor escolher; quem já conta fica desligado.', criarPasso(3), 'v3'),
    e('gestor-criar-4', 'gestor-inv-novo', '61.1.7 · Passo 4: rever', 'O resumo antes de criar; nada se cria sem o servidor.', criarPasso(4), 'v3'),
    e('gestor-criar-5', 'gestor-inv-novo', '61.1.8 · Criado', 'O servidor confirmou: o inventário existe e a tarefa vai para a fila de quem conta.', criarPasso(5), 'v3'),
  ];
}
