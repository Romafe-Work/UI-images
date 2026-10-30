/* =========================================================
   PICK — Operações V2 do Gestor (29 out. 2026)
   Do briefing dela «ROMAFE Warehouse — Gestor Operations V2» (auditar primeiro, depois acrescentar; não refazer).
   A auditoria (public/documentos/Pick-Auditoria-Operacoes.docx) mostrou que as quatro operações, as Tarefas, a Equipa,
   os Insights e as exceções já existem; faltavam as Operações como centro de trabalho e as duas capacidades que
   atravessam as quatro operações: saber o que há numa posição ou de um artigo, e quem fez o quê, onde e quando.
     - 69 v2 · Operações: o resumo (por fazer, em curso, por validar, bloqueadas, cada um leva às tarefas dele, com a
       hora dos dados), os quatro módulos com três números, a próxima ação e Acompanhar | Executar; e «Consultar»;
     - 82 · Posição: o que o sistema diz que lá está, as tarefas que lhe tocam, se está bloqueada e porquê, os últimos
       movimentos. A capacidade não está registada no armazém 60: diz-se, não se inventa; não há mapa (é da v2);
     - 83 · Artigo: o stock por posição, o reservado e o que vem a caminho; a contagem de hoje à parte (não é stock
       enquanto o inventário não for validado);
     - 84 · Atividade: os registos do servidor (quem, operação, documento, artigo, quantidade, de onde para onde, hora,
       resultado), por operação e por pessoa; não se editam.
   Os números são de exemplo e saem das mesmas listas (gestor-v3.ts, arrumacao.ts), para baterem certo.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { ecra, acao, sec, aviso, posicao, h2, L, type Opcoes } from './inventario-v2';
import { barra } from './navegacao';
import { TAREFAS, MODULOS, ICONE_MOD, MODO, faixa, itemMais, lerGestor, SEP, EXP, type Modulo, type TipoT } from './gestor-v3';
import { GUIAS, RESUMO_ARRUMACAO } from './arrumacao';
import pkg from 'lucide-static/icons/package.svg?raw';
import pkgOpen from 'lucide-static/icons/package-open.svg?raw';
import basket from 'lucide-static/icons/shopping-basket.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';

const AGORA = '10:45';
const G = (titulo: string, ativo: string, o: Opcoes = {}): Opcoes => ({ titulo, gestor: true, funcao: 'Gestor', barra: barra('gestor', ativo), ...o });
const conta = <T extends { est: string }>(xs: T[], k: string) => xs.filter((x) => x.est === k).length;
const NOME_T: Record<TipoT, string> = { inventario: 'Inventário', arrumacao: 'Arrumação', separacao: 'Separação', expedicao: 'Expedição' };
const IC_T: Record<TipoT, string> = { inventario: pkg, arrumacao: pkgOpen, separacao: basket, expedicao: truck };

/* =========================================================
   69 v2 · Operações
   ========================================================= */
/** Por validar: as tarefas paradas à espera do Gestor; bloqueadas: as outras exceções (não andam sem uma decisão). */
const porValidar = TAREFAS.filter((x) => x.est === 'atencao' && x.acao[0] === 'Validar').length;
const bloqueadas = TAREFAS.filter((x) => x.est === 'atencao').length - porValidar;
const NUMEROS: [string, number, string, string][] = [
  ['Por fazer', TAREFAS.filter((x) => x.est === 'fazer').length, 'g-tarefas', ''],
  ['Em curso', TAREFAS.filter((x) => x.est === 'curso').length, 'g-tarefas-curso', ''],
  ['Por validar', porValidar, 'gestor-inventario-validar', 'aviso'],
  ['Bloqueadas', bloqueadas, 'g-tarefas-atencao', 'erro'],
];
const NUMS: Record<Modulo, [string, number, ('aviso' | 'erro' | '')?][]> = {
  inv: [['Em curso', 1], ['Por validar', 1, 'aviso'], ['Divergências', 2, 'erro']],
  arr: [['Por arrumar', RESUMO_ARRUMACAO.porArrumar], ['Em curso', RESUMO_ARRUMACAO.emCurso], ['Problemas', RESUMO_ARRUMACAO.problemas, 'erro']],
  sep: [['Por separar', conta(SEP, 'separar')], ['Em separação', conta(SEP, 'curso')], ['Com faltas', conta(SEP, 'falta'), 'erro']],
  exp: [['Prontas', conta(EXP, 'pronta')], ['Em expedição', conta(EXP, 'expedicao')], ['Exceções', conta(EXP, 'excecao'), 'erro']],
};
/** A próxima ação de cada módulo: a mesma regra do Centro (o que está parado há mais tempo à espera de alguém). */
const PROXIMA: Record<Modulo, [string, string]> = {
  inv: ['Validar o INV-2026-011 · há 10 dias', 'gestor-validar'],
  arr: ['Arrumar eu a GA-2026-0331 · 2 paletes no cais 1', 'arr-guia'],
  sep: ['Rever a falta da GS13454210', 'g-sep-guia-falta'],
  exp: ['Recolher a GS13454208 · pronta desde as 09:12', 'g-exp-outra'],
};
type EOps = 'normal' | 'desatualizado' | 'carregar';
export function operacoesV2(e: EOps = 'normal'): string {
  const c = e === 'carregar';
  return ecra(`<div class="gx-cab"><h1 class="gp-titulo">Operações</h1><p>Acompanha e executa as operações do armazém.</p></div>
    ${e === 'desatualizado' ? `<p class="gx-velho" role="status">${L(clock)}<span><b>Dados das 10:31.</b> O servidor não respondeu às duas últimas atualizações.</span><button type="button" class="gp-ligacao">${L(refresh)}Atualizar</button></p>` : ''}
    <section class="gx-estado" aria-labelledby="gx-ops-t"><p class="gx-estado__cab"><b id="gx-ops-t" class="sr-only">Resumo</b><span>${L(clock)}Armazém 60 · hoje, até às ${e === 'desatualizado' ? '10:31' : AGORA}</span></p>
      <div class="gx-estado__l">${NUMEROS.map(([t, k, ir, tom]) => `<button type="button" class="gx-num${tom ? ` is-${tom}` : ''}" data-ir="${ir}"${c ? ' disabled' : ''}><b>${c ? '<i class="gx-esq"></i>' : k}</b><span>${t}</span></button>`).join('')}</div></section>
    <ul class="gx-ops" role="list">${MODULOS.map(([k, t, , x], i) => `<li style="--i:${i}"><section class="gx-op gx-op--${k}" aria-labelledby="gx-op2-${k}">
      <header><span class="gx-op__ic">${L(ICONE_MOD[k])}</span><span><h2 id="gx-op2-${k}">${t}</h2><small>${x}</small></span></header>
      ${c ? '<div class="gp-esq"><i></i></div>' : faixa(NUMS[k])}
      ${c ? '' : `<button type="button" class="gx-prox" data-ir="${PROXIMA[k][1]}"><span><small>A seguir</small><b>${PROXIMA[k][0]}</b></span>${L(arrowRight, 'gi-seta')}</button>`}
      <div class="gx-op__b"><button type="button" class="gp-btn gi-btn-sec" data-ir="${MODO[k][0]}">${L(eye)}<span>Acompanhar</span></button><button type="button" class="gp-btn gp-btn--acao" data-ir="${MODO[k][1]}">${L(play)}<span>Executar</span></button></div>
    </section></li>`).join('')}</ul>
    <section class="gp-sec">${h2('Consultar')}<ul class="gi-mais-l" role="list">${itemMais(mapPin, 'Posição ou artigo', 'Leia a etiqueta: o que lá está, as tarefas e os movimentos', 'g-ler')}${itemMais(history, 'Atividade', 'Quem fez o quê, onde e quando', 'g-atividade')}</ul></section>`,
  G('Operações', 'mais', { voltar: 'g-mais' }));
}

/* =========================================================
   84 · Atividade: os registos do servidor
   ========================================================= */
type Res = 'ok' | 'falta' | 'excecao' | 'contagem';
interface Mov { h: string; quem: string; tipo: TipoT; doc: string; o: string; art?: string; q?: string; de?: string; para?: string; res: Res }
const RES: Record<Res, [string, string]> = { ok: ['Confirmado', 'ok'], falta: ['Falta registada', 'erro'], excecao: ['Exceção', 'erro'], contagem: ['Contagem registada', 'planeada'] };
const ga = (ref: string) => GUIAS.find((g) => g.ref === ref)!;
export const MOVIMENTOS: Mov[] = [
  { h: '10:42', quem: 'Joana Silva', tipo: 'inventario', doc: 'INV-2026-014', o: 'Contou', art: 'SKF VKBA 6556', q: '4 un.', de: '60300102', res: 'contagem' },
  { h: '10:40', quem: 'Joana Silva', tipo: 'inventario', doc: 'INV-2026-014', o: 'Contou', art: 'SKF VKMV 6PK1873', q: '12 un.', de: '60300101', res: 'contagem' },
  { h: '10:21', quem: 'Tiago Lopes', tipo: 'separacao', doc: 'GS13454211', o: 'Tirou', art: 'SKF 6204-2RSH', q: '10 un.', de: '60100802', para: 'Guia', res: 'ok' },
  { h: '10:05', quem: 'Paulo Reis', tipo: 'expedicao', doc: 'GS13454207', o: 'Recolheu a guia', q: '2 linhas', de: '60400101', para: 'Cais', res: 'ok' },
  { h: '09:55', quem: 'Paulo Reis', tipo: 'expedicao', doc: 'GS13454206', o: 'Leu a guia nos preparados', de: '60400101', res: 'excecao' },
  { h: '09:50', quem: 'Tiago Lopes', tipo: 'separacao', doc: 'GS13454210', o: 'Tirou', art: 'P 85 020', q: '2 de 4 un.', de: '60210305', para: 'Guia', res: 'falta' },
  { h: '09:40', quem: 'Tiago Lopes', tipo: 'separacao', doc: 'GS13454209', o: 'Pousou a guia', q: '3 linhas', para: '60400101', res: 'ok' },
  { h: '09:31', quem: 'Inês Rocha', tipo: 'arrumacao', doc: 'GA-2026-0330', o: 'Arrumou', art: ga('GA-2026-0330').linhas[0].ref, q: `${ga('GA-2026-0330').linhas[0].q} un.`, de: 'Cais 2', para: '60120401', res: 'ok' },
  { h: '08:50', quem: 'Inês Rocha', tipo: 'arrumacao', doc: 'GA-2026-0328', o: 'Arrumou', art: 'NGK BKR6E', q: '10 de 12 un.', de: 'Cais 1', para: '60210302', res: 'excecao' },
  { h: '08:30', quem: 'Paulo Reis', tipo: 'expedicao', doc: 'GS13454205', o: 'Expediu a guia', q: '4 linhas', de: 'Cais', res: 'ok' },
  { h: '08:12', quem: 'Inês Rocha', tipo: 'arrumacao', doc: 'GA-2026-0327', o: 'Arrumou', q: '2 artigos', de: 'Cais 1', para: '60100802', res: 'ok' },
];
const onde = (m: Mov) => m.de && m.para ? `${m.de} → ${m.para}` : m.para ? `→ ${m.para}` : m.de ?? '';
const linhaMov = (m: Mov, i: number) => `<li style="--i:${i}" data-gi-tipo-l="${m.tipo}" data-gi-quem-l="${m.quem}">${m.doc === 'GS13454210' ? '<button type="button" class="gx-mov" data-ir="g-atividade-mov">' : '<div class="gx-mov">'}
    <span class="gx-mov__h">${m.h}</span>
    <span class="gx-mov__t"><span class="gx-op-tag gx-op-tag--${m.tipo}">${L(IC_T[m.tipo])}${m.doc}</span><b>${m.o}${m.art ? ` ${m.art}` : ''}${m.q ? ` · ${m.q}` : ''}</b><small>${onde(m)}${onde(m) ? ' · ' : ''}${m.quem}</small></span>
    <span class="gp-tag gp-tag--${RES[m.res][1]}">${RES[m.res][0]}</span>${m.doc === 'GS13454210' ? '</button>' : '</div>'}</li>`;
type EAtiv = 'normal' | 'filtro-vazio';
export function atividade(e: EAtiv = 'normal'): string {
  const pessoas = [...new Set(MOVIMENTOS.map((m) => m.quem))].sort((a, b) => a.localeCompare(b, 'pt'));
  const sel = (k: string, v: string) => (k === v ? ' selected' : '');
  const tipo = e === 'filtro-vazio' ? 'expedicao' : '', quem = e === 'filtro-vazio' ? 'Inês Rocha' : '';
  return ecra(`<div class="gx-cab"><h1 class="gp-titulo">Atividade</h1><p>Hoje · registos do servidor</p></div>
    <div class="gx-filtros">
      <label class="gp-campo"><span>Operação</span><select data-gi-tipo-sel><option value="">Todas</option>${(Object.keys(NOME_T) as TipoT[]).map((k) => `<option value="${k}"${sel(k, tipo)}>${NOME_T[k]}</option>`).join('')}</select></label>
      <label class="gp-campo"><span>Pessoa</span><select data-gi-quem><option value="">Todas</option>${pessoas.map((p) => `<option${sel(p, quem)}>${p}</option>`).join('')}</select></label>
    </div>
    ${e === 'filtro-vazio' ? `<p class="gp-vazio">${L(inbox)}A Inês Rocha não tem registos da Expedição hoje. Mude a operação ou a pessoa.</p>`
      : `<ul class="gp-lista gx-movs" role="list">${MOVIMENTOS.map(linhaMov).join('')}</ul>`}`,
  G('Atividade', 'mais', { voltar: 'g-operacoes' }));
}
/** 84.1 · Um registo: tudo o que o servidor guardou, e para onde ir a partir dele. */
export function movimento(): string {
  const m = MOVIMENTOS.find((x) => x.doc === 'GS13454210')!;
  const dl: [string, string][] = [['Documento', m.doc], ['Operação', NOME_T[m.tipo]], ['Pessoa', m.quem], ['Artigo', `${m.art} · Pastilhas de travão`], ['Quantidade', 'Pedidas 4 · tiradas 2'], ['Origem', m.de!], ['Destino', 'A guia'], ['Hora', `Hoje, ${m.h}:12`], ['Resultado', 'Falta registada na posição']];
  return ecra(`<div class="gx-cab"><h1 class="gp-titulo">${m.o} ${m.art}</h1><p><span class="gp-tag gp-tag--erro">${RES[m.res][0]}</span></p></div>
    <dl class="gx-dl">${dl.map(([t, v]) => `<div><dt>${t}</dt><dd>${v}</dd></div>`).join('')}</dl>
    <ul class="gi-mais-l" role="list">${itemMais(basket, 'Abrir a guia', 'GS13454210 · Oficina Moreira & Filhos', 'g-sep-guia-falta')}</ul>`,
  G('Registo', 'mais', { voltar: 'g-atividade' }));
}

/* =========================================================
   82 · Posição
   ========================================================= */
type EPos = 'normal' | 'bloqueada' | 'vazia' | 'nao-existe';
const linhaArt = (ref: string, desc: string, q: string, extra = '') => `<li class="gi-linha"><div><b>${ref}</b><span>${desc}${extra}</span></div><div class="gi-linha__q"><b>${q}</b></div></li>`;
const movsEm = (p: string) => MOVIMENTOS.filter((m) => m.de === p || m.para === p);
export function posicaoG(e: EPos = 'normal'): string {
  const o = G('Posição', 'ler', { voltar: 'g-ler-posicao' });
  if (e === 'nao-existe') return ecra(`${aviso('erro', searchX, 'A posição 60990101 não existe', 'Não há zona 99 no armazém 60. Leia outra vez a etiqueta, ou confirme-a com quem a colou.')}`, { ...o, pe: acao('Ler outra vez', scanBarcode, ' data-ir="g-ler"') });
  const p = e === 'bloqueada' ? '60300102' : e === 'vazia' ? '60120405' : '60100305';
  const zona = e === 'bloqueada' ? 'Zona 30 · travões' : e === 'vazia' ? 'Zona 12 · retentores' : 'Zona 10 · rolamentos';
  const estado = e === 'bloqueada'
    ? aviso('aviso', lock, 'Bloqueada: em contagem', 'O INV-2026-014 conta a zona 30 às cegas (Joana Silva). Até ser submetido, ninguém arruma nem separa aqui.')
    : `<p class="gx-livre">${L(mapPin)}<span><b>Livre para movimentos</b> · a capacidade não está registada no armazém 60</span></p>`;
  const arts = e === 'vazia' ? `<p class="gp-vazio">${L(inbox)}O sistema não tem artigos nesta posição.</p>`
    : e === 'bloqueada' ? `<ul class="gi-linhas" role="list">${linhaArt('SKF VKBA 6556', 'Kit de rolamento de roda', '6 un.')}</ul>`
    : `<ul class="gi-linhas" role="list">${linhaArt('SKF 6205-2Z', 'Rolamento rígido de esferas', '18 un.')}</ul><p class="gx-reserva">6 un. reservadas para a GS13454212 (por separar)</p>`;
  const tarefas = e === 'vazia' ? `<p class="gp-vazio">${L(inbox)}Nenhuma tarefa lhe toca.</p>`
    : e === 'bloqueada' ? `<ul class="gi-mais-l" role="list">${itemMais(pkg, 'INV-2026-014 · a contar', 'Joana Silva · zona 30', 'gestor-acompanhar')}${itemMais(pkgOpen, 'GA-2026-0329 · à espera', 'Na mesma zona: o destino 60300104 está bloqueado', 'arr-guia-bloqueada')}</ul>`
    : `<ul class="gi-mais-l" role="list">${itemMais(pkgOpen, 'Arrumar aqui', 'GA-2026-0332 · 30 un. de SKF 6205-2Z vêm para cá', 'g-arr-op')}${itemMais(basket, 'Separar daqui', 'GS13454212 · linha 1 · 6 un.', 'g-sep-pos')}${itemMais(pkg, 'Contar', 'INV-2026-015 · zona 10 · por iniciar', 'g-inv-ficou')}</ul>`;
  const ms = e === 'normal' ? [{ h: '09:28', quem: 'Tiago Lopes', tipo: 'separacao', doc: 'GS13454209', o: 'Tirou', art: 'SKF 6205-2Z', q: '4 un.', de: p, para: 'Guia', res: 'ok' } as Mov] : movsEm(p);
  return ecra(`<section class="gi-cartao gx-pos">${posicao(p, 'gi-pos--grande')}<p>${zona}</p></section>
    ${e === 'vazia' ? '' : estado}
    <section class="gp-sec">${h2('O que o sistema diz que lá está')}${arts}</section>
    <section class="gp-sec">${h2('Tarefas aqui')}${tarefas}</section>
    <section class="gp-sec">${h2('Últimos movimentos')}${ms.length ? `<ul class="gp-lista gx-movs" role="list">${ms.map(linhaMov).join('')}</ul>` : `<p class="gp-vazio">${L(inbox)}Sem movimentos hoje.</p>`}
      <button type="button" class="gp-ligacao" data-ir="g-atividade">${L(history)}Toda a atividade</button></section>`,
  { ...o, pe: e === 'bloqueada' ? '' : sec('Corrigir esta posição', pencil, ' data-ir="inv-cp-ler"') });
}

/* =========================================================
   83 · Artigo
   ========================================================= */
type EArt = 'normal' | 'sem-stock' | 'nao-existe';
export function artigoG(e: EArt = 'normal'): string {
  const o = G('Artigo', 'ler', { voltar: 'g-ler-artigo' });
  if (e === 'nao-existe') return ecra(`${aviso('erro', searchX, 'Artigo desconhecido', 'O código 5601234000017 não é de nenhum artigo do catálogo. Se a etiqueta é nova, o artigo tem de ser criado no ERP.')}`, { ...o, pe: acao('Ler outra vez', scanBarcode, ' data-ir="g-ler"') });
  const vem = GUIAS.find((g) => g.ref === 'GA-2026-0331')!.linhas.find((l) => l.ref === 'SKF VKBA 6556')!.q;
  const sem = e === 'sem-stock';
  const nums: [string, string, string][] = sem ? [['Em stock', '0', 'erro'], ['Reservado', '0', ''], ['A chegar', `${vem}`, '']] : [['Em stock', '20', ''], ['Reservado', '0', ''], ['A chegar', `${vem}`, '']];
  return ecra(`<div class="gx-cab"><h1 class="gp-titulo">SKF VKBA 6556</h1><p>Kit de rolamento de roda · 7316201250277</p></div>
    <dl class="gi-faixa gx-faixa">${nums.map(([t, v, tom]) => `<div${tom ? ` class="is-${tom}"` : ''}><dd>${v}</dd><dt>${t}</dt></div>`).join('')}</dl>
    <section class="gp-sec">${h2('Por posição')}${sem ? `<p class="gp-vazio">${L(inbox)}Nenhuma posição o tem. Vêm ${vem} un. na GA-2026-0331 (cais 1, à espera).</p>`
      : `<ul class="gi-mais-l" role="list">${itemMais(mapPin, '60101203 · 14 un.', 'Zona 10 · de onde a separação tira', 'g-posicao')}${itemMais(mapPin, '60300102 · 6 un.', 'Zona 30 · bloqueada: em contagem', 'g-posicao-bloqueada')}</ul>`}</section>
    ${sem ? '' : `<p class="gx-nota-cont">${L(pkg)}<span><b>Contadas hoje: 4 un. na 60300102</b> (INV-2026-014). Não é stock: o stock só muda quando o inventário for validado.</span></p>`}
    <section class="gp-sec">${h2('Tarefas com este artigo')}<ul class="gi-mais-l" role="list">${itemMais(pkgOpen, 'GA-2026-0331 · por atribuir', `${vem} un. · cais 1 → 60101203`, 'arr-guia')}${sem ? '' : itemMais(pkg, 'INV-2026-014 · a contar', 'Joana Silva · zona 30', 'gestor-acompanhar')}</ul></section>
    <button type="button" class="gp-ligacao" data-ir="g-atividade">${L(history)}Os movimentos deste artigo</button>`, o);
}

/* =========================================================
   Os ecrãs, as versões novas e os estados
   ========================================================= */
const NOTA = 'Do briefing «ROMAFE Warehouse — Gestor Operations V2» (29 out.): auditar e acrescentar sem refazer; as Operações como centro de trabalho (resumo, próxima ação, Acompanhar | Executar) e o que atravessa as quatro operações: a posição, o artigo e a atividade (rastreabilidade).';
/** 69 v2; Ler 75.1 e 75.3 v2 (levam à Posição e ao Artigo). */
export function comGestorV5<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  const V: Record<string, [string, () => string]> = {
    'g-operacoes': ['v2', () => operacoesV2()],
    'g-ler-posicao': ['v2', () => lerGestor('posicao').replace('<ul class="gi-mais-l" role="list">', `<ul class="gi-mais-l" role="list">${itemMais(mapPin, 'Ver a posição', 'O que lá está, se está bloqueada e os movimentos', 'g-posicao')}`)],
    'g-ler-artigo': ['v2', () => lerGestor('artigo').replace(/<li><button type="button" class="gi-mais" data-ir="inv-consultar">[\s\S]*?<\/li>/, itemMais(pkg, 'Ver o artigo', 'O stock por posição, o reservado e o que vem a caminho', 'g-artigo'))],
  };
  return ecras.map((e) => V[e.id] ? { ...e, versoes: [...e.versoes, { id: V[e.id][0], nota: NOTA, html: V[e.id][1]() }] as Ecra<T>['versoes'] } : e);
}
export function ecrasGestorV5(): Ecra<string>[] {
  const e = (id: string, nome: string, objetivo: string, html: string, de?: string, v = 'v1'): Ecra<string> => ({ id, nome, fluxo: 'Gestor', objetivo, ...(de ? { estadoDe: de } : {}), versoes: [{ id: v, nota: NOTA, html }] });
  return [
    e('g-operacoes-desatualizado', '69.1 · Dados desatualizados', 'O servidor falhou duas atualizações: diz-se de quando são os números e oferece Atualizar.', operacoesV2('desatualizado'), 'g-operacoes', 'v2'),
    e('g-operacoes-carregar', '69.2 · A carregar', 'Os módulos e as ações já servem; os números chegam a seguir.', operacoesV2('carregar'), 'g-operacoes', 'v2'),
    e('g-posicao', '82 · Posição', 'Uma posição lida: o que o sistema diz que lá está (e o reservado), se está livre ou bloqueada e porquê, as tarefas que lhe tocam e os últimos movimentos. A capacidade não se inventa: não está registada.', posicaoG()),
    e('g-posicao-bloqueada', '82.1 · Bloqueada', 'Em contagem às cegas: diz-se quem conta e até quando; a guia com destino na mesma zona espera ou muda de destino.', posicaoG('bloqueada'), 'g-posicao'),
    e('g-posicao-vazia', '82.2 · Vazia', 'O sistema não tem nada nela e nenhuma tarefa lhe toca.', posicaoG('vazia'), 'g-posicao'),
    e('g-posicao-nao-existe', '82.3 · Não existe', 'Um código com o formato de posição que não existe no armazém 60.', posicaoG('nao-existe'), 'g-posicao'),
    e('g-artigo', '83 · Artigo', 'Um artigo lido: em stock, reservado e a chegar; por posição; a contagem de hoje à parte (não é stock até o inventário ser validado); as tarefas com ele e os movimentos.', artigoG()),
    e('g-artigo-sem-stock', '83.1 · Sem stock', 'Nenhuma posição o tem: diz-se o que vem a caminho.', artigoG('sem-stock'), 'g-artigo'),
    e('g-artigo-nao-existe', '83.2 · Desconhecido', 'O código não é de nenhum artigo: o artigo cria-se no ERP.', artigoG('nao-existe'), 'g-artigo'),
    e('g-atividade', '84 · Atividade', 'Rastreabilidade: os registos do servidor de hoje — hora, documento, o que se fez, artigo, quantidade, de onde para onde, quem e o resultado —, por operação e por pessoa. Não se editam.', atividade()),
    e('g-atividade-mov', '84.1 · Um registo', 'Tudo o que o servidor guardou de uma falta na separação, e daí a guia.', movimento(), 'g-atividade'),
    e('g-atividade-filtro-vazio', '84.2 · Nada com estes filtros', 'Expedição e Inês Rocha: nada hoje; diz-se o filtro e o que mudar.', atividade('filtro-vazio'), 'g-atividade'),
  ];
}
