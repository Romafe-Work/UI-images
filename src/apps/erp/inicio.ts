/* =========================================================
   ERP — 05 · Início: o espaço de trabalho (19 out. 2026)
   Do briefing dela «ROMAFE ERP V11 — Intelligent Enterprise Workspace», com a tabela «A diferença que
   quero entre GoParts e ERP»: no ERP o centro são as tarefas e as operações, não a pesquisa de peças;
   listas e painéis de contexto, não cartões de produto; as animações são de fluxos e de mudanças de
   estado. O que ela mais valoriza: «Continuar onde fiquei».
   O briefing aponta para o 01 · Entrar v10, mas o que descreve é o ecrã que se vê depois de entrar:
   por isso é um ecrã novo, o Início do ERP (o módulo «Início» da moldura, que não tinha ecrã), e o
   «Entrar» da v10 passa a abrir aqui. O login da v10 fica como está.

   Responde a três perguntas, por esta ordem:
     1. o que precisa de mim?        — As minhas prioridades (lista, com a ação direta em cada linha);
     2. em que estava a trabalhar?   — Continuar onde fiquei (rascunhos, documentos, fichas, pesquisas, listas fixadas);
     3. o que posso fazer a seguir?  — Acesso rápido (só as operações do perfil) e o fluxo das operações.
   À direita, o painel de contexto (alertas, prazos, atividade, atalhos), que se recolhe.
   Em cima: a barra lateral (recolhe-se, procura de módulos, fixados, recentes), o caminho, a procura
   Ctrl+K, Criar, Avisos, Tema e Conta.

   Este ficheiro só desenha (funções puras de estado → HTML); o comportamento (comportamento/inicio.ts)
   redesenha com as mesmas funções. Os dados são de exemplo (inicio-dados.ts) e o perfil escolhe-se na
   conta, em «Ver como (protótipo)»: no produto o perfil vem da sessão e as permissões da API.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import type { IdErp } from './ids';
import { ic } from './inicio-icones';
import * as cp from './compras/dominio';
import {
  PERFIS, EMPRESA, HOJE, MODULOS, DOCS, PRIORIDADES, RECENTES, OPERACOES, ETAPAS, AVISOS, PRAZOS, ATIVIDADE, INDICE, nomeModulo,
  AGEM, type IdPerfil, type Modulo, type Nivel, type Recente, type Doc, type Achado, type Operacao,
} from './inicio-dados';

export type IdInicio = 'inicio' | 'inicio-carregar' | 'inicio-vazio' | 'inicio-offline' | 'inicio-procura' | 'inicio-procura-nada'
  | 'inicio-avisos' | 'inicio-personalizar' | 'inicio-painel' | 'inicio-criar' | 'inicio-compacta' | 'inicio-armazem' | 'inicio-admin';

/* ---------- o estado (o comportamento guarda-o por pessoa) ---------- */
export type Bloco = 'continuar' | 'acesso' | 'fluxo' | 'contexto';
export interface Prefs {
  blocos: Record<Bloco, boolean>;
  ordem: string[]; escondidas: string[]; fixados: Modulo[];
  densidade: 'confortavel' | 'compacta'; lado: 'aberto' | 'recolhido'; omissao: 'inicio' | 'compras';
}
export interface Estado {
  perfil: IdPerfil; prefs: Prefs;
  /** documentos tratados: referência → o que se fez («aprovada»…) */ feitos: Record<string, string>;
  lidas: string[]; recentes: Recente[]; criados: Doc[];
  filtro: 'todas' | Nivel; etapa: string | null; saudacao: string;
  carga?: 'carregar' | 'vazio' | 'offline';
}
export const prefsPadrao = (perfil: IdPerfil): Prefs => ({
  blocos: { continuar: true, acesso: true, fluxo: true, contexto: true },
  ordem: OPERACOES.map((o) => o.id), escondidas: [],
  fixados: perfil === 'armazem' ? ['armazem'] : perfil === 'vendas' ? ['vendas'] : perfil === 'financeiro' ? ['faturacao'] : ['compras'],
  densidade: 'confortavel', lado: 'aberto', omissao: 'inicio',
});
export const estadoPadrao = (perfil: IdPerfil = 'compras'): Estado => ({
  perfil, prefs: prefsPadrao(perfil), feitos: {}, lidas: [], recentes: RECENTES[perfil].slice(), criados: [], filtro: 'todas', etapa: 'compra', saudacao: 'Bom dia',
});

/* ---------- ajudas ---------- */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const pode = (e: Estado, m: Modulo) => PERFIS[e.perfil].modulos.includes(m);
export const podeTratar = (e: Estado, d: Doc) => (d.agem ?? AGEM[d.modulo]).includes(e.perfil);
/** As encomendas a fornecedor vêm do domínio de Compras (compras/dominio.ts): o estado, os totais e a ação
 *  que o perfil pode fazer são os de lá; os outros documentos ainda são os de exemplo (DOCS). */
export function docDeEncomenda(e: Estado, ref: string): Doc | undefined {
  const x = cp.encomenda(ref); if (!x) return undefined;
  const t = cp.totais(x), f = cp.fornecedor(x.forn), atr = cp.atrasada(x);
  const acoes = cp.acoesDe(x, e.perfil);
  const acao = acoes.includes('aprovar') ? { id: 'aprovar' as const, rotulo: 'Aprovar', icone: 'check', feito: 'aprovada' }
    : acoes.includes('lembrar') && x.lembrada !== cp.HOJE ? { id: 'lembrar' as const, rotulo: 'Lembrar fornecedor', icone: 'send', feito: 'lembrete registado' } : undefined;
  return {
    ref, tipo: 'Encomenda a fornecedor', modulo: 'compras', entidade: f?.nome ?? '—', ecra: 'compras-encomenda', agem: [e.perfil],
    estado: atr ? `Atrasada ${cp.diasAtraso(x.entrega)} dias` : x.estado,
    nivel: atr ? 'atrasada' : x.estado === 'A aprovar' ? (cp.diasAtraso(x.data) > 14 ? 'atrasada' : 'urgente') : x.estado === 'Rascunho' ? 'normal' : 'info',
    datas: [['Data', cp.dia(x.data)], ['Entrega prevista', cp.dia(x.entrega)]], total: `${cp.euros(t.base)} s/ IVA`,
    linhas: x.linhas.map((l) => ({ ref: l.ref, desc: cp.artigo(l.ref)?.desc ?? '', qtd: `${l.qtd.toLocaleString('pt-PT')} ${cp.artigo(l.ref)?.un ?? ''}`, valor: cp.linhaLiquida(l) === null ? 'Sem preço' : cp.euros(cp.linhaLiquida(l)!) })),
    nota: x.estado === 'A aprovar' ? (e.perfil === 'admin' ? `Acima do limite do comprador (${cp.euros(cp.LIMITE_COMPRADOR)}): a aprovação é tua.` : 'À espera da Administração (acima do limite do comprador).') : x.estado === 'Parcialmente recebida' ? `Faltam ${x.linhas.filter((l) => cp.pendente(l)).length} de ${x.linhas.length} linhas.` : x.notas || undefined,
    acao,
  };
}
/** Uma encomenda só é prioridade enquanto pede alguma coisa a alguém. */
const pedeAtencao = (ref: string) => { const x = cp.encomenda(ref); return !x || x.estado === 'A aprovar' || x.estado === 'Rascunho' || x.estado === 'Parcialmente recebida' || cp.atrasada(x); };
export const doc = (e: Estado, ref: string): Doc | undefined => docDeEncomenda(e, ref) || DOCS[ref] || e.criados.find((d) => d.ref === ref);
const NIVEL: Record<Nivel, { nome: string; icone: string }> = {
  atrasada: { nome: 'Atrasada', icone: 'clock' }, urgente: { nome: 'Urgente', icone: 'triangle-alert' },
  normal: { nome: 'Por tratar', icone: 'circle-dot' }, info: { nome: 'Para saber', icone: 'info' },
};
const ORDEM_NIVEL: Nivel[] = ['atrasada', 'urgente', 'normal', 'info'];
export const btn = (texto: string, icone: string, o: { cls?: string; attrs?: string; depois?: boolean } = {}) =>
  `<button type="button" class="btn ${o.cls ?? 'btn--acao'}"${o.attrs ? ' ' + o.attrs : ''}>${o.depois ? '' : ic(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span>${o.depois ? ic(icone, 'btn__icone') : ''}</button>`;
const ibtn = (rotulo: string, icone: string, attrs = '', cls = '') => `<button type="button" class="ws-ibtn${cls ? ' ' + cls : ''}" aria-label="${rotulo}" data-dica="${rotulo}" ${attrs}>${ic(icone)}</button>`;

/** As prioridades ainda abertas do perfil, já pela ordem (atrasadas primeiro). */
export function prioridades(e: Estado) {
  if (e.carga === 'vazio') return [];
  return PRIORIDADES[e.perfil]
    .map((p) => ({ ...p, d: doc(e, p.doc)! }))
    .filter((p) => p.d && pode(e, p.d.modulo) && pedeAtencao(p.doc))
    .sort((a, b) => ORDEM_NIVEL.indexOf(a.d.nivel ?? 'normal') - ORDEM_NIVEL.indexOf(b.d.nivel ?? 'normal'));
}
export const contas = (e: Estado) => {
  const abertas = prioridades(e).filter((p) => !e.feitos[p.doc]);
  const c = { todas: abertas.length, atrasada: 0, urgente: 0, normal: 0, info: 0 } as Record<'todas' | Nivel, number>;
  abertas.forEach((p) => { c[p.d.nivel ?? 'normal']++; });
  return c;
};

/* ---------- a barra lateral ---------- */
function lado(e: Estado, ondeEstou = 'inicio'): string {
  const grupos = ['Trabalho', 'Consulta', 'Sistema'] as const;
  const mods = MODULOS.filter((m) => pode(e, m.id));
  const item = (m: typeof MODULOS[number]) => {
    const ativo = m.id === ondeEstou;
    const dentro = m.subs.some((x) => x.id === ondeEstou);
    const fixo = e.prefs.fixados.includes(m.id);
    const sub = m.subs.length ? `<ul class="ws-lado__subs" id="ws-sub-${m.id}"${dentro ? '' : ' hidden'}>${m.subs.map((s) => `<li><button type="button" class="ws-lado__sub"${s.id === ondeEstou ? ' aria-current="page"' : ''} ${s.ecra ? `data-ws-ir="${s.ecra}"` : `data-ws-sem-ecra="${esc(s.nome)}"`}>${esc(s.nome)}${s.ecra ? '' : '<span class="ws-lado__falta">sem ecrã</span>'}</button></li>`).join('')}</ul>` : '';
    return `<li class="ws-lado__li" data-modulo="${m.id}">
      <div class="ws-lado__linha">
        <button type="button" class="ws-lado__item${dentro ? ' is-dentro' : ''}"${ativo ? ' aria-current="page"' : ''} data-dica="${m.nome}" ${m.subs.length ? `aria-expanded="${dentro}" aria-controls="ws-sub-${m.id}" data-ws-abrir-sub="${m.id}"` : m.id === 'inicio' ? 'data-ws-ir="inicio"' : `data-ws-sem-ecra="${m.nome}"`}>${ic(m.icone, 'ws-lado__icone')}<span class="ws-lado__nome">${m.nome}</span>${m.subs.length ? ic('chevron-down', 'ws-lado__seta') : ''}</button>
        ${m.id === 'inicio' ? '' : `<button type="button" class="ws-lado__pino${fixo ? ' is-fixo' : ''}" aria-pressed="${fixo}" aria-label="${fixo ? 'Tirar dos fixados' : 'Fixar'}: ${m.nome}" data-ws-fixar="${m.id}">${ic(fixo ? 'pin-off' : 'pin')}</button>`}
      </div>${sub}</li>`;
  };
  const fixados = e.prefs.fixados.filter((m) => pode(e, m));
  const recentes = e.recentes.filter((r) => r.tipo !== 'pesquisa').slice(0, 3);
  return `<nav class="ws-lado" aria-label="Módulos">
    <div class="ws-lado__cima">
      <a class="ws-marca" data-ws-ir="inicio" href="#" aria-label="ROMAFE ERP, Início"><span class="romafe ws-marca__romafe">ROMAFE</span><span class="ws-marca__erp">ERP</span></a>
      ${ibtn(e.prefs.lado === 'recolhido' ? 'Abrir a barra lateral' : 'Recolher a barra lateral', 'panel-left', 'data-ws-lado aria-expanded="' + (e.prefs.lado !== 'recolhido') + '"', 'ws-lado__recolher')}
    </div>
    <div class="ws-lado__procura">${ic('search', 'ws-lado__lupa')}<input type="search" class="ws-lado__campo" placeholder="Procurar módulo" aria-label="Procurar módulo" data-ws-procura-modulo></div>
    ${fixados.length ? `<p class="ws-lado__grupo">Fixados</p><ul class="ws-lado__lista ws-lado__lista--fixados">${fixados.map((id) => { const m = MODULOS.find((x) => x.id === id)!; return `<li><button type="button" class="ws-lado__item ws-lado__item--fixado" data-dica="${m.nome}" ${m.id === 'compras' ? 'data-ws-ir="compras"' : `data-ws-sem-ecra="${m.nome}"`}${m.subs.some((x) => x.id === ondeEstou) ? ' aria-current="true"' : ''}>${ic(m.icone, 'ws-lado__icone')}<span class="ws-lado__nome">${m.nome}</span></button></li>`; }).join('')}</ul>` : ''}
    ${grupos.map((g) => { const ms = mods.filter((m) => m.grupo === g); return ms.length ? `<p class="ws-lado__grupo">${g}</p><ul class="ws-lado__lista" data-grupo="${g}">${ms.map(item).join('')}</ul>` : ''; }).join('')}
    <p class="ws-lado__nada" hidden>Nenhum módulo com esse nome.</p>
    ${recentes.length ? `<p class="ws-lado__grupo">Recentes</p><ul class="ws-lado__lista ws-lado__lista--recentes">${recentes.map((r) => `<li><button type="button" class="ws-lado__item ws-lado__item--recente" data-dica="${esc(r.titulo)}" data-ws-retomar="${r.id}">${ic('history', 'ws-lado__icone')}<span class="ws-lado__nome">${esc(r.titulo)}</span></button></li>`).join('')}</ul>` : ''}
  </nav>`;
}

/* ---------- o topo ---------- */
export interface Passo { nome: string; ir?: string; ref?: string }
function topo(e: Estado, caminho: Passo[] = [{ nome: 'Início' }]): string {
  const p = PERFIS[e.perfil];
  const porLer = AVISOS[e.perfil].filter((a) => !e.lidas.includes(a.id)).length;
  return `<header class="ws-topo">
    ${ibtn('Menu', 'panel-left', 'data-ws-gaveta aria-expanded="false"', 'ws-topo__gaveta')}
    <nav class="ws-caminho" aria-label="Onde estás"><ol>
      <li><button type="button" class="ws-caminho__item" data-ws-menu="empresa" aria-haspopup="true" aria-expanded="false">${ic('building-2')}${EMPRESA.nome}</button></li>
      ${caminho.map((c, i) => i === caminho.length - 1 ? `<li aria-current="page"><span class="ws-caminho__aqui">${esc(c.nome)}</span></li>` : `<li><button type="button" class="ws-caminho__item" data-ws-ir="${c.ir}"${c.ref ? ` data-ws-ref="${esc(c.ref)}"` : ''}>${esc(c.nome)}</button></li>`).join('')}
    </ol></nav>
    <button type="button" class="ws-procura" data-ws-procura aria-label="Procurar no ERP (Ctrl+K)">${ic('search')}<span class="ws-procura__texto">Procurar artigos, documentos, fornecedores…</span><kbd class="ws-procura__tecla">Ctrl K</kbd></button>
    <div class="ws-topo__direita">
      ${OPERACOES.some((o) => o.tipo === 'criar' && o.perfis.includes(e.perfil)) ? btn('Criar', 'plus', { cls: 'btn--acao ws-topo__criar', attrs: 'data-ws-menu="criar" aria-haspopup="true" aria-expanded="false"' }) : ''}
      <button type="button" class="ws-ibtn ws-topo__avisos" data-ws-menu="avisos" aria-haspopup="true" aria-expanded="false" aria-label="Avisos${porLer ? `, ${porLer} por ler` : ''}" data-dica="Avisos">${ic('bell')}${porLer ? `<span class="ws-selo" data-ws-por-ler>${porLer}</span>` : ''}</button>
      <div class="ws-tema" role="group" aria-label="Tema">
        <button type="button" class="segmented__btn ws-tema__btn" data-tema="light" aria-label="Tema claro" data-dica="Claro">${ic('sun')}</button>
        <button type="button" class="segmented__btn ws-tema__btn" data-tema="dark" aria-label="Tema escuro" data-dica="Escuro">${ic('moon')}</button>
        <button type="button" class="segmented__btn ws-tema__btn" data-tema="auto" aria-label="Tema do sistema" data-dica="Sistema">${ic('monitor')}</button>
      </div>
      <button type="button" class="ws-conta" data-ws-menu="conta" aria-haspopup="true" aria-expanded="false" aria-label="A tua conta: ${p.pessoa}, ${p.nome}">
        <span class="ws-conta__inicial" aria-hidden="true">${p.iniciais}</span>
        <span class="ws-conta__texto"><span class="ws-conta__nome">${p.pessoa}</span><span class="ws-conta__perfil">${p.nome}</span></span>${ic('chevron-down', 'ws-conta__seta')}
      </button>
    </div>
  </header>`;
}

/* ---------- a cabeça: curta ---------- */
function cabeca(e: Estado): string {
  const p = PERFIS[e.perfil], c = contas(e);
  const resumo = e.carga === 'carregar' ? '<span class="ws-esq ws-esq--texto"></span>' : e.carga === 'offline' ? 'Sem ligação: o que vês pode não estar atualizado.'
    : c.todas ? [c.atrasada && `<b class="ws-n ws-n--atrasada">${c.atrasada}</b> ${c.atrasada === 1 ? 'atrasada' : 'atrasadas'}`, c.urgente && `<b class="ws-n ws-n--urgente">${c.urgente}</b> ${c.urgente === 1 ? 'urgente' : 'urgentes'}`, (c.normal + c.info) && `<b class="ws-n">${c.normal + c.info}</b> para tratar ou saber`].filter(Boolean).join('<span class="ws-cabeca__ponto" aria-hidden="true">·</span>')
    : 'Nada à tua espera. Está tudo em dia.';
  return `<header class="ws-cabeca">
    <div class="ws-cabeca__texto">
      <h1 class="ws-cabeca__ola"><span data-ws-saudacao>${e.saudacao}</span>, ${p.primeiro}</h1>
      <p class="ws-cabeca__sub">Boas-vindas ao teu espaço de trabalho. <span class="ws-cabeca__resumo" data-ws-resumo>${resumo}</span></p>
    </div>
    <dl class="ws-cabeca__meta">
      <div><dt>Hoje</dt><dd>${HOJE.dia}</dd></div>
      <div><dt>Empresa</dt><dd>${EMPRESA.nome} · ${EMPRESA.local}</dd></div>
      <div><dt>Espaço</dt><dd>${p.nome}</dd></div>
    </dl>
    ${btn('Personalizar', 'sliders-horizontal', { cls: 'btn--ghost btn--sm ws-cabeca__personalizar', attrs: 'data-ws-personalizar' })}
  </header>`;
}

/* ---------- 1. as minhas prioridades ---------- */
export function linhaPrioridade(e: Estado, p: ReturnType<typeof prioridades>[number]): string {
  const d = p.d, n = d.nivel ?? 'normal', feito = e.feitos[p.doc];
  const acao = d.acao && !feito && podeTratar(e, d) ? btn(d.acao.rotulo, d.acao.icone, { cls: 'btn--acao btn--sm ws-pri__acao', attrs: `data-ws-acao="${esc(p.doc)}"` }) : '';
  return `<li class="ws-pri ws-pri--${n}${feito ? ' is-feita' : ''}" data-ws-pri="${esc(p.doc)}" data-nivel="${n}">
    <div class="ws-pri__corpo">
      <button type="button" class="ws-pri__abrir" data-ws-doc="${esc(p.doc)}">
        <span class="ws-pri__titulo">${esc(p.titulo)}</span>
        <span class="ws-pri__ref"><span class="ws-ref">${esc(d.ref)}</span> · ${esc(d.entidade)}${d.total ? ` · ${d.total}` : ''}</span>
      </button>
      <div class="ws-pri__meta">
        <span class="ws-pri__nivel">${ic(feito ? 'circle-check' : NIVEL[n].icone)}<span class="ws-pri__nivel-nome">${feito ? 'Feito' : NIVEL[n].nome}</span></span>
        <span class="ws-pri__prazo"><span class="ws-pri__data">${p.prazo === '—' ? 'Sem prazo' : p.prazo}</span><span class="ws-pri__quando">${esc(p.quando)}</span></span>
        <span class="ws-estado" data-ws-estado-doc>${feito ? esc(feito[0].toUpperCase() + feito.slice(1)) : esc(d.estado)}</span>
        <span class="ws-pri__modulo">${nomeModulo(d.modulo)}</span>
      </div>
    </div>
    <span class="ws-pri__accoes">${acao}${ibtn('Abrir ' + d.ref, 'arrow-right', `data-ws-doc="${esc(p.doc)}"`, 'ws-pri__ir')}</span>
  </li>`;
}
export function blocoPrioridades(e: Estado): string {
  const c = contas(e);
  const lista = prioridades(e).filter((p) => !e.feitos[p.doc] && (e.filtro === 'todas' || (p.d.nivel ?? 'normal') === e.filtro));
  const filtros: ['todas' | Nivel, string][] = [['todas', 'Todas'], ['atrasada', 'Atrasadas'], ['urgente', 'Urgentes'], ['normal', 'Por tratar'], ['info', 'Para saber']];
  let corpo: string;
  if (e.carga === 'carregar') corpo = `<ul class="ws-pris" aria-busy="true">${Array.from({ length: 5 }, () => '<li class="ws-pri ws-pri--esq"><div class="ws-pri__corpo"><span class="ws-esq ws-esq--linha"></span><span class="ws-esq ws-esq--curta"></span></div><span class="ws-esq ws-esq--marca"></span></li>').join('')}</ul><p class="sr-only" role="status">A carregar as prioridades…</p>`;
  else if (e.carga === 'offline') corpo = `<div class="ws-vazio ws-vazio--erro" role="alert">${ic('wifi-off', 'ws-vazio__icone')}<p class="ws-vazio__titulo">Não foi possível carregar as prioridades</p><p class="ws-vazio__texto">Sem ligação ao servidor. O que está em baixo é o que já tinhas aberto neste computador.</p>${btn('Tentar outra vez', 'rotate-ccw', { cls: 'btn--ghost btn--sm', attrs: 'data-ws-repetir' })}</div>`;
  else if (!c.todas) corpo = `<div class="ws-vazio">${ic('circle-check', 'ws-vazio__icone ws-vazio__icone--ok')}<p class="ws-vazio__titulo">Tudo em dia</p><p class="ws-vazio__texto">Não há nada à tua espera em ${PERFIS[e.perfil].nome}. Quando houver, aparece aqui primeiro.</p></div>`;
  else if (!lista.length) corpo = `<div class="ws-vazio ws-vazio--curto"><p class="ws-vazio__texto">Nada neste filtro.</p>${btn('Ver todas', 'list-checks', { cls: 'btn--ghost btn--sm', attrs: 'data-ws-filtro="todas"' })}</div>`;
  else corpo = `<ol class="ws-pris" data-ws-pris>${lista.map((p) => linhaPrioridade(e, p)).join('')}</ol>`;
  return `<section class="ws-bloco ws-bloco--prioridades" aria-labelledby="ws-t-pri" data-bloco="prioridades">
    <header class="ws-bloco__cabeca">
      <h2 class="ws-bloco__titulo" id="ws-t-pri">As minhas prioridades</h2>
      <div class="ws-filtros" role="group" aria-label="Filtrar prioridades">${filtros.filter(([f]) => f === 'todas' || c[f]).map(([f, nome]) => `<button type="button" class="ws-filtro${f !== 'todas' ? ' ws-filtro--' + f : ''}" aria-pressed="${e.filtro === f}" data-ws-filtro="${f}">${nome}<span class="ws-filtro__n" data-ws-conta="${f}">${e.carga ? '–' : c[f]}</span></button>`).join('')}</div>
    </header>
    ${corpo}
  </section>`;
}

/* ---------- 2. continuar onde fiquei ---------- */
const TIPO_RECENTE: Record<Recente['tipo'], [string, string]> = {
  rascunho: ['file-pen', 'Rascunho'], documento: ['file-text', 'Documento'], registo: ['bookmark', 'Ficha'], pesquisa: ['search', 'Pesquisa'], espaco: ['pin', 'Fixado'],
};
export function blocoContinuar(e: Estado): string {
  const lista = [...e.recentes].sort((a, b) => Number(!!b.fixado) - Number(!!a.fixado)).slice(0, 6);
  return `<section class="ws-bloco ws-bloco--continuar" aria-labelledby="ws-t-cont" data-bloco="continuar">
    <header class="ws-bloco__cabeca"><h2 class="ws-bloco__titulo" id="ws-t-cont">Continuar onde fiquei</h2><span class="ws-bloco__nota">Só o teu trabalho, neste e noutros computadores</span></header>
    ${lista.length ? `<ul class="ws-conts">${lista.map((r, i) => `<li class="ws-cont${i === 0 && !r.fixado ? ' ws-cont--primeiro' : ''}" data-ws-cont="${r.id}">
      <button type="button" class="ws-cont__retomar" data-ws-retomar="${r.id}">
        <span class="ws-cont__icone ws-cont__icone--${r.tipo}">${ic(TIPO_RECENTE[r.tipo][0])}</span>
        <span class="ws-cont__texto"><span class="ws-cont__titulo">${esc(r.titulo)}</span><span class="ws-cont__sub">${esc(r.sub)}</span></span>
        <span class="ws-cont__quando">${esc(r.quando)}</span>
        <span class="ws-cont__ir">${i === 0 && !r.fixado ? '<span class="ws-cont__ir-texto">Retomar</span>' : ''}${ic('corner-down-left')}</span>
      </button>
      <button type="button" class="ws-cont__pino${r.fixado ? ' is-fixo' : ''}" aria-pressed="${!!r.fixado}" aria-label="${r.fixado ? 'Tirar dos fixados' : 'Fixar'}: ${esc(r.titulo)}" data-ws-fixar-cont="${r.id}">${ic(r.fixado ? 'pin-off' : 'pin')}</button>
    </li>`).join('')}</ul>` : `<div class="ws-vazio ws-vazio--curto"><p class="ws-vazio__texto">Ainda não abriste nada. O que abrires aparece aqui, para retomares com um clique.</p></div>`}
  </section>`;
}

/* ---------- 3. acesso rápido ---------- */
export function operacoes(e: Estado): Operacao[] {
  return e.prefs.ordem.map((id) => OPERACOES.find((o) => o.id === id)!).filter((o) => o && pode(e, o.modulo) && o.perfis.includes(e.perfil));
}
function blocoAcesso(e: Estado): string {
  const ops = operacoes(e).filter((o) => !e.prefs.escondidas.includes(o.id)).slice(0, 8);
  return `<section class="ws-bloco ws-bloco--acesso" aria-labelledby="ws-t-acesso" data-bloco="acesso">
    <header class="ws-bloco__cabeca"><h2 class="ws-bloco__titulo" id="ws-t-acesso">Acesso rápido</h2><button type="button" class="ws-ligacao" data-ws-personalizar="acesso">Ordenar</button></header>
    <ul class="ws-ops">${ops.map((o) => `<li><button type="button" class="ws-op" data-ws-op="${o.id}"${o.tecla ? ` title="Alt+${o.tecla}" aria-keyshortcuts="Alt+${o.tecla}"` : ''}>${ic(o.icone, 'ws-op__icone')}<span class="ws-op__nome">${o.nome}</span></button></li>`).join('')}</ul>
  </section>`;
}

/* ---------- o fluxo das operações ---------- */
export function blocoFluxo(e: Estado): string {
  const sel = ETAPAS.find((x) => x.id === e.etapa) ?? null;
  const ix = sel ? ETAPAS.indexOf(sel) : -1;
  const det = sel ? (pode(e, sel.modulo)
    ? `<div class="ws-fluxo__det" data-ws-fluxo-det><p class="ws-fluxo__det-titulo">${ic(sel.icone)}${sel.nome}<span class="ws-fluxo__det-modulo">${nomeModulo(sel.modulo)}</span></p><p class="ws-fluxo__det-diz">${sel.diz}</p>
       <ul class="ws-fluxo__docs">${sel.docs.map((r) => doc(e, r)).filter((d): d is Doc => !!d).map((d) => `<li><button type="button" class="ws-fluxo__doc" data-ws-doc="${esc(d.ref)}"><span class="ws-ref">${esc(d.ref)}</span><span>${esc(d.entidade)}</span><span class="ws-estado">${esc(e.feitos[d.ref] ?? d.estado)}</span>${ic('arrow-right')}</button></li>`).join('')}</ul></div>`
    : `<div class="ws-fluxo__det ws-fluxo__det--fechado" data-ws-fluxo-det>${ic('lock')}<p>O perfil ${PERFIS[e.perfil].nome} não tem acesso a ${nomeModulo(sel.modulo)}. Vês onde a etapa fica no fluxo, mas não o que lá está.</p></div>`) : '';
  return `<section class="ws-bloco ws-bloco--fluxo" aria-labelledby="ws-t-fluxo" data-bloco="fluxo">
    <header class="ws-bloco__cabeca"><h2 class="ws-bloco__titulo" id="ws-t-fluxo">O fluxo das operações</h2><span class="ws-bloco__nota">Da compra à fatura, no armazém 60 · escolhe uma etapa</span></header>
    <div class="ws-fluxo" style="--sel: ${ix}; --n: ${ETAPAS.length}">
      <div class="ws-fluxo__trilho" aria-hidden="true"><span class="ws-fluxo__feito"></span></div>
      <ol class="ws-fluxo__etapas">${ETAPAS.map((x, i) => {
        const tem = pode(e, x.modulo);
        return `<li class="ws-fluxo__etapa${i === ix ? ' is-sel' : ''}${i < ix ? ' is-antes' : ''}${tem ? '' : ' is-fechada'}">
          <button type="button" class="ws-fluxo__no" data-ws-etapa="${x.id}" aria-pressed="${i === ix}" aria-label="${x.nome}${tem ? `: ${x.conta} pendentes` : ', sem acesso'}">
            <span class="ws-fluxo__bola">${ic(tem ? x.icone : 'lock')}</span>
            <span class="ws-fluxo__nome">${x.nome}</span>
            <span class="ws-fluxo__conta">${tem ? x.conta : '—'}</span>
          </button></li>`;
      }).join('')}</ol>
    </div>
    ${det}
  </section>`;
}

/* ---------- o painel de contexto ---------- */
function contexto(e: Estado): string {
  const p = e.perfil;
  const fixados = e.prefs.fixados.filter((m) => pode(e, m));
  return `<aside class="ws-contexto" aria-labelledby="ws-t-ctx" data-bloco="contexto">
    <header class="ws-contexto__cabeca"><h2 class="ws-contexto__titulo" id="ws-t-ctx">Contexto</h2>${ibtn('Recolher o contexto', 'panel-right', 'data-ws-contexto aria-expanded="true"')}</header>
    <section class="ws-ctx"><h3 class="ws-ctx__titulo">${ic('triangle-alert')}Alertas</h3>
      <ul class="ws-ctx__lista">${AVISOS[p].filter((a) => pode(e, a.modulo)).slice(0, 3).map((a) => `<li><button type="button" class="ws-ctx__item" ${a.doc ? `data-ws-doc="${esc(a.doc)}"` : 'data-ws-procura-texto="6206"'}><span class="ws-ctx__nome">${esc(a.titulo)}</span><span class="ws-ctx__sub">${esc(a.texto)}</span></button></li>`).join('')}</ul></section>
    <section class="ws-ctx"><h3 class="ws-ctx__titulo">${ic('clock')}Próximos prazos</h3>
      <ul class="ws-ctx__lista">${PRAZOS[p].map((x) => `<li><button type="button" class="ws-ctx__item ws-ctx__item--prazo" ${x.doc ? `data-ws-doc="${esc(x.doc)}"` : ''}><span class="ws-ctx__dia">${x.dia}</span><span class="ws-ctx__nome">${esc(x.texto)}</span></button></li>`).join('')}</ul></section>
    <section class="ws-ctx"><h3 class="ws-ctx__titulo">${ic('history')}Atividade</h3>
      <ul class="ws-ctx__lista ws-ctx__lista--atividade">${ATIVIDADE[p].map((x) => `<li><span class="ws-ctx__quem">${esc(x.quem)}</span> ${esc(x.texto)} <span class="ws-ctx__quando">${x.quando}</span></li>`).join('')}</ul></section>
    ${fixados.length ? `<section class="ws-ctx"><h3 class="ws-ctx__titulo">${ic('pin')}Os meus atalhos</h3><div class="ws-ctx__atalhos">${fixados.map((m) => { const mod = MODULOS.find((x) => x.id === m)!; return `<button type="button" class="ws-chip" ${m === 'compras' ? 'data-ws-ir="compras"' : `data-ws-sem-ecra="${mod.nome}"`}>${ic(mod.icone)}${mod.nome}</button>`; }).join('')}</div></section>` : ''}
  </aside>`;
}

/* ---------- as camadas por cima: menus, procura, painel, personalizar ---------- */
export function menuConta(e: Estado): string {
  const p = PERFIS[e.perfil];
  return `<div class="ws-menu ws-menu--conta" role="dialog" aria-label="A tua conta" data-ws-camada="conta">
    <div class="ws-menu__pessoa"><span class="ws-conta__inicial ws-conta__inicial--grande" aria-hidden="true">${p.iniciais}</span><div><p class="ws-menu__nome">${p.pessoa}</p><p class="ws-menu__sub">${p.cargo} · perfil ${p.nome}</p><p class="ws-menu__sub">${p.correio}</p></div></div>
    <p class="ws-menu__linha">${ic('building-2')}${EMPRESA.nome} · ${EMPRESA.local}</p>
    <fieldset class="ws-menu__perfis"><legend>Ver como <span class="ws-menu__proto">protótipo</span></legend>
      ${Object.values(PERFIS).map((x) => `<label class="ws-radio"><input type="radio" name="ws-perfil" value="${x.id}"${x.id === e.perfil ? ' checked' : ''} data-ws-perfil-escolha><span>${x.nome}<small>${x.pessoa}</small></span></label>`).join('')}
      <p class="ws-menu__nota">No produto, o perfil vem da sessão e quem decide o que se vê é o servidor.</p>
    </fieldset>
    <div class="ws-menu__accoes">
      ${btn('Personalizar o meu espaço', 'sliders-horizontal', { cls: 'btn--ghost btn--sm btn--bloco', attrs: 'data-ws-personalizar' })}
      ${btn('Terminar sessão', 'log-out', { cls: 'btn--ghost btn--sm btn--bloco', attrs: 'data-ws-sair' })}
    </div>
  </div>`;
}
export function menuAvisos(e: Estado): string {
  const avisos = AVISOS[e.perfil];
  return `<div class="ws-menu ws-menu--avisos" role="dialog" aria-label="Avisos" data-ws-camada="avisos">
    <header class="ws-menu__cabeca"><p class="ws-menu__titulo">Avisos</p>${avisos.some((a) => !e.lidas.includes(a.id)) ? `<button type="button" class="ws-ligacao" data-ws-ler-todos>Marcar todos como lidos</button>` : ''}</header>
    <ul class="ws-avisos">${avisos.map((a) => `<li><button type="button" class="ws-aviso${e.lidas.includes(a.id) ? '' : ' is-novo'}" data-ws-aviso="${a.id}" ${a.doc ? `data-ws-doc="${esc(a.doc)}"` : ''}>
      <span class="ws-aviso__ponto" aria-hidden="true"></span><span class="ws-aviso__texto"><span class="ws-aviso__titulo">${esc(a.titulo)}</span><span class="ws-aviso__sub">${esc(a.texto)}</span></span><span class="ws-aviso__quando">${a.quando}${e.lidas.includes(a.id) ? '' : '<span class="sr-only">, por ler</span>'}</span></button></li>`).join('')}</ul>
  </div>`;
}
export function menuCriar(e: Estado): string {
  return `<div class="ws-menu ws-menu--criar" role="menu" aria-label="Criar" data-ws-camada="criar">${OPERACOES.filter((o) => o.tipo === 'criar' && o.perfis.includes(e.perfil)).map((o) => `<button type="button" role="menuitem" class="ws-menu__item" data-ws-op="${o.id}">${ic(o.icone)}${o.nome}</button>`).join('')}</div>`;
}
export function menuEmpresa(): string {
  return `<div class="ws-menu ws-menu--empresa" role="dialog" aria-label="Empresa" data-ws-camada="empresa"><p class="ws-menu__titulo">${EMPRESA.nome}</p><p class="ws-menu__sub">${EMPRESA.local}</p><p class="ws-menu__nota">É a única empresa desta conta. Com mais de uma, escolhe-se aqui; cada uma tem os seus dados (o mandante).</p></div>`;
}

/** A procura: só nos módulos do perfil (no produto, a API devolve só o que a sessão pode ver).
 *  Cada palavra tem de aparecer no título ou no subtítulo; os resultados vêm por tipo, no máximo 5 por tipo. */
const sem = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function buscar(e: Estado, q: string): [string, Achado[]][] {
  const palavras = sem(q).split(/\s+/).filter(Boolean);
  if (!palavras.length) return [];
  const tudo = [...INDICE, ...e.criados.map((d): Achado => ({ tipo: 'Compras', titulo: `${d.ref} · ${d.entidade}`, sub: `${d.tipo} · ${d.estado}`, modulo: d.modulo, icone: 'file-pen', doc: d.ref, ecra: d.ecra }))];
  const achados = tudo.filter((x) => pode(e, x.modulo) && palavras.every((w) => sem(x.titulo + ' ' + x.sub).includes(w)))
    /* os fornecedores e as encomendas abrem nas páginas de Compras */
    .map((x) => { const f = x.tipo === 'Fornecedores' ? cp.FORNECEDORES.find((y) => y.nome === x.titulo) : undefined; return f ? { ...x, doc: undefined, ecra: 'compras-fornecedor', ref: f.id } : x; });
  const grupos = new Map<string, Achado[]>();
  achados.forEach((x) => { const g = grupos.get(x.tipo) || []; if (g.length < 5) g.push(x); grupos.set(x.tipo, g); });
  return [...grupos.entries()];
}
export const sugestoes = (e: Estado): Achado[] => INDICE.filter((x) => x.tipo === 'Destinos' && pode(e, x.modulo) && (x.ecra || x.sub === 'Módulo')).slice(0, 5);

export function procura(o: { q: string; grupos: [string, Achado[]][] | null; recentes: Achado[]; sugestoes: Achado[]; a: 'procura' | 'nada' | 'erro' | 'pronto' }): string {
  const linha = (x: Achado, i: number) => `<li role="option" id="ws-r-${i}" class="ws-res" data-ws-res="${i}" aria-selected="${i === 0}"><span class="ws-res__icone">${ic(x.icone)}</span><span class="ws-res__texto"><span class="ws-res__titulo">${esc(x.titulo)}</span><span class="ws-res__sub">${esc(x.sub)}</span></span>${ic('corner-down-left', 'ws-res__enter')}</li>`;
  let corpo = '', i = 0;
  const grupo = (nome: string, xs: Achado[]) => `<li role="presentation"><p class="ws-res__grupo" id="ws-g-${nome}">${nome}</p><ul role="group" aria-labelledby="ws-g-${nome}">${xs.map((x) => linha(x, i++)).join('')}</ul></li>`;
  if (o.a === 'procura') corpo = `<p class="ws-paleta__estado" role="status"><span class="ws-girador" aria-hidden="true"></span>A procurar «${esc(o.q)}»…</p>`;
  else if (o.a === 'erro') corpo = `<div class="ws-paleta__estado ws-paleta__estado--erro" role="alert">${ic('wifi-off')}<p>Sem ligação: não foi possível procurar. Os teus recentes continuam aqui em baixo.</p></div>`;
  else if (o.a === 'nada') corpo = `<div class="ws-paleta__estado" role="status">${ic('search')}<p>Nada com «${esc(o.q)}» nos módulos a que tens acesso.</p><p class="ws-paleta__dica">Experimenta a referência (EF 2026/0412), o nome do fornecedor ou do artigo.</p></div>`;
  const lista = o.grupos && o.a === 'pronto' ? o.grupos : [...(o.recentes.length ? [['Recentes', o.recentes] as [string, Achado[]]] : []), ['Ir para', o.sugestoes] as [string, Achado[]]];
  if (o.a === 'pronto' || !o.q) corpo += `<ul class="ws-paleta__lista" role="listbox" id="ws-paleta-lista" aria-label="Resultados">${lista.map(([n, xs]) => grupo(n, xs)).join('')}</ul>`;
  return `<div class="ws-veu" data-ws-camada="procura"><div class="ws-paleta" role="dialog" aria-modal="true" aria-label="Procurar no ERP">
    <div class="ws-paleta__campo">${ic('search')}<input type="text" class="ws-paleta__input" value="${esc(o.q)}" placeholder="Procurar artigos, documentos, fornecedores, clientes, módulos…" role="combobox" aria-expanded="true" aria-controls="ws-paleta-lista" aria-autocomplete="list" aria-activedescendant="ws-r-0" data-ws-paleta-input autocomplete="off" spellcheck="false"><kbd class="ws-procura__tecla">Esc</kbd></div>
    <div class="ws-paleta__corpo">${corpo}</div>
    <footer class="ws-paleta__pe"><span><kbd>↑</kbd><kbd>↓</kbd> escolher</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> fechar</span></footer>
  </div></div>`;
}

export function painel(e: Estado, ref: string, extra?: Achado): string {
  const d = doc(e, ref);
  if (!d && extra) {
    return `<div class="ws-veu ws-veu--painel" data-ws-camada="painel"><aside class="ws-painel" role="dialog" aria-modal="true" aria-labelledby="ws-painel-t">
      <header class="ws-painel__cabeca"><p class="ws-painel__tipo">${esc(extra.tipo === 'Artigos' ? 'Artigo' : extra.tipo === 'Fornecedores' ? 'Fornecedor' : extra.tipo === 'Clientes' ? 'Cliente' : extra.tipo)}</p>
        <h2 class="ws-painel__titulo" id="ws-painel-t" style="view-transition-name: ws-doc">${esc(extra.titulo)}</h2>${ibtn('Fechar', 'x', 'data-ws-fechar', 'ws-painel__fechar')}</header>
      <div class="ws-painel__corpo"><p class="ws-painel__nota">${esc(extra.sub)}</p><p class="ws-painel__falta">${ic('info')}A ficha completa abre no módulo ${nomeModulo(extra.modulo)}, que ainda não tem ecrã no protótipo.</p></div>
      <footer class="ws-painel__pe">${btn('Fechar', 'x', { cls: 'btn--ghost', attrs: 'data-ws-fechar' })}</footer></aside></div>`;
  }
  if (!d) return '';
  const feito = e.feitos[d.ref];
  const acao = d.acao && !feito && podeTratar(e, d) ? btn(d.acao.rotulo, d.acao.icone, { attrs: `data-ws-acao="${esc(d.ref)}"` }) : '';
  return `<div class="ws-veu ws-veu--painel" data-ws-camada="painel"><aside class="ws-painel" role="dialog" aria-modal="true" aria-labelledby="ws-painel-t">
    <header class="ws-painel__cabeca">
      <p class="ws-painel__tipo">${esc(d.tipo)} · ${nomeModulo(d.modulo)}</p>
      <h2 class="ws-painel__titulo" id="ws-painel-t" style="view-transition-name: ws-doc">${esc(d.ref)}</h2>
      <p class="ws-painel__entidade">${esc(d.entidade)}<span class="ws-estado ws-estado--${feito ? 'feito' : d.nivel ?? 'normal'}" data-ws-estado-doc>${esc(feito ? feito[0].toUpperCase() + feito.slice(1) : d.estado)}</span></p>
      ${ibtn('Fechar', 'x', 'data-ws-fechar', 'ws-painel__fechar')}
    </header>
    <div class="ws-painel__corpo">
      <dl class="ws-painel__datas">${d.datas.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}${d.total ? `<div><dt>Total</dt><dd class="ws-painel__total">${d.total}</dd></div>` : ''}</dl>
      ${d.nota ? `<p class="ws-painel__nota">${esc(d.nota)}</p>` : ''}
      ${d.linhas?.length ? `<div class="ws-painel__rolo"><table class="ws-tabela"><caption class="sr-only">Linhas de ${esc(d.ref)}</caption><thead><tr><th>Artigo</th><th>Descrição</th><th class="ws-num">Quantidade</th><th class="ws-num">Valor</th></tr></thead><tbody>${d.linhas.map((l) => `<tr><td class="ws-ref">${esc(l.ref)}</td><td>${esc(l.desc)}</td><td class="ws-num">${esc(l.qtd)}</td><td class="ws-num">${esc(l.valor)}</td></tr>`).join('')}</tbody></table></div>` : ''}
      ${d.acao && !feito && !podeTratar(e, d) ? `<p class="ws-painel__falta">${ic('lock')}Só leitura: ${esc(d.acao.rotulo.toLowerCase())} é com ${(d.agem ?? AGEM[d.modulo]).filter((x) => x !== 'admin').map((x) => PERFIS[x].nome).join(' ou ')}.</p>` : ''}
      ${d.ecra ? '' : `<p class="ws-painel__falta">${ic('info')}O módulo ${nomeModulo(d.modulo)} ainda não tem ecrã no protótipo: o documento completo abrirá lá.</p>`}
    </div>
    <footer class="ws-painel__pe">${acao}${d.ecra ? btn(d.ecra === 'compras-encomenda' ? 'Abrir a encomenda' : 'Abrir em Compras', 'arrow-right', { cls: 'btn--ghost', attrs: `data-ws-ir="${d.ecra}"${d.ecra === 'compras-encomenda' ? ` data-ws-ref="${esc(d.ref)}"` : ''}` }) : ''}${btn('Fechar', 'x', { cls: 'btn--ghost', attrs: 'data-ws-fechar' })}</footer>
  </aside></div>`;
}

export function criar(_e: Estado, op: 'nova-ef' | 'nova-ec'): string {
  const ef = op === 'nova-ef';
  const opcoes = ef ? ['SKF Portugal', 'Bosch', 'Brembo', 'TRW', 'Valeo', 'Gates', 'NGK', 'UFI Filters'] : ['Auto Peças Lima', 'Oficina Central de Coimbra', 'Recauchutagem Mondego'];
  return `<div class="ws-veu ws-veu--painel" data-ws-camada="painel"><aside class="ws-painel" role="dialog" aria-modal="true" aria-labelledby="ws-painel-t">
    <header class="ws-painel__cabeca"><p class="ws-painel__tipo">${ef ? 'Compras' : 'Vendas'}</p><h2 class="ws-painel__titulo" id="ws-painel-t">${ef ? 'Nova encomenda a fornecedor' : 'Nova encomenda de cliente'}</h2>${ibtn('Fechar', 'x', 'data-ws-fechar', 'ws-painel__fechar')}</header>
    <form class="ws-painel__corpo ws-form" data-ws-criar="${op}">
      <label class="ws-campo"><span class="ws-campo__rotulo">${ef ? 'Fornecedor' : 'Cliente'}</span><select name="entidade" class="ws-campo__select" required><option value="">Escolhe…</option>${opcoes.map((x) => `<option>${x}</option>`).join('')}</select></label>
      <label class="ws-campo"><span class="ws-campo__rotulo">Armazém</span><select name="armazem" class="ws-campo__select"><option>${EMPRESA.local}</option></select></label>
      <p class="ws-painel__nota">Fica como rascunho e aparece em «Continuar onde fiquei». As linhas juntam-se depois, no documento.</p>
      <p class="ws-campo__erro" hidden role="alert">${ic('circle-alert')}Escolhe o ${ef ? 'fornecedor' : 'cliente'}.</p>
    </form>
    <footer class="ws-painel__pe">${btn('Criar rascunho', 'file-plus-2', { attrs: 'data-ws-criar-ok' })}${btn('Cancelar', 'x', { cls: 'btn--ghost', attrs: 'data-ws-fechar' })}</footer>
  </aside></div>`;
}

export function personalizar(e: Estado): string {
  const b = e.prefs.blocos;
  const sw = (k: Bloco, nome: string, sub: string) => `<label class="ws-interruptor"><input type="checkbox" data-ws-bloco="${k}"${b[k] ? ' checked' : ''}><span class="ws-interruptor__texto">${nome}<small>${sub}</small></span><span class="ws-interruptor__marca" aria-hidden="true"></span></label>`;
  const ops = operacoes(e);
  return `<div class="ws-veu" data-ws-camada="personalizar"><div class="ws-dialogo" role="dialog" aria-modal="true" aria-labelledby="ws-pers-t">
    <header class="ws-dialogo__cabeca"><h2 id="ws-pers-t" class="ws-dialogo__titulo">Personalizar o meu espaço</h2>${ibtn('Fechar', 'x', 'data-ws-fechar')}</header>
    <div class="ws-dialogo__corpo">
      <section class="ws-pers"><h3 class="ws-pers__titulo">Blocos</h3><p class="ws-pers__sub">«As minhas prioridades» fica sempre.</p>
        ${sw('continuar', 'Continuar onde fiquei', 'rascunhos, documentos e pesquisas recentes')}${sw('acesso', 'Acesso rápido', 'as operações do teu perfil')}${sw('fluxo', 'O fluxo das operações', 'da compra à fatura')}${sw('contexto', 'Painel de contexto', 'alertas, prazos e atividade, à direita')}</section>
      <section class="ws-pers" data-ws-pers="acesso"><h3 class="ws-pers__titulo">Acesso rápido</h3><p class="ws-pers__sub">Arrasta ou usa as setas para ordenar; tira o visto para esconder.</p>
        <ol class="ws-ordem">${ops.map((o, i) => `<li class="ws-ordem__item" draggable="true" data-ws-ordem="${o.id}">${ic('grip-vertical', 'ws-ordem__pega')}<label class="ws-ordem__ver"><input type="checkbox" data-ws-mostrar="${o.id}"${e.prefs.escondidas.includes(o.id) ? '' : ' checked'}><span>${o.nome}</span></label>
          <button type="button" class="ws-ibtn ws-ibtn--sm" aria-label="Subir ${o.nome}" data-ws-subir="${o.id}"${i === 0 ? ' disabled' : ''}>${ic('arrow-up')}</button><button type="button" class="ws-ibtn ws-ibtn--sm" aria-label="Descer ${o.nome}" data-ws-descer="${o.id}"${i === ops.length - 1 ? ' disabled' : ''}>${ic('arrow-down')}</button></li>`).join('')}</ol></section>
      <section class="ws-pers"><h3 class="ws-pers__titulo">Módulos fixados</h3><div class="ws-pers__grelha">${MODULOS.filter((m) => m.id !== 'inicio' && pode(e, m.id)).map((m) => `<label class="ws-caixa"><input type="checkbox" data-ws-fixar-pers="${m.id}"${e.prefs.fixados.includes(m.id) ? ' checked' : ''}><span>${m.nome}</span></label>`).join('')}</div></section>
      <section class="ws-pers"><h3 class="ws-pers__titulo">Ao entrar, abrir</h3><div class="ws-pers__grelha">
        <label class="ws-radio"><input type="radio" name="ws-omissao" value="inicio" data-ws-omissao${e.prefs.omissao === 'inicio' ? ' checked' : ''}><span>Início</span></label>
        ${pode(e, 'compras') ? `<label class="ws-radio"><input type="radio" name="ws-omissao" value="compras" data-ws-omissao${e.prefs.omissao === 'compras' ? ' checked' : ''}><span>Encomendas a fornecedor</span></label>` : ''}</div></section>
      <section class="ws-pers"><h3 class="ws-pers__titulo">Densidade</h3><div class="ws-pers__grelha">
        <label class="ws-radio"><input type="radio" name="ws-densidade" value="confortavel" data-ws-densidade${e.prefs.densidade === 'confortavel' ? ' checked' : ''}><span>Confortável<small>mais espaço e alvos maiores</small></span></label>
        <label class="ws-radio"><input type="radio" name="ws-densidade" value="compacta" data-ws-densidade${e.prefs.densidade === 'compacta' ? ' checked' : ''}><span>Compacta<small>mais linhas à vista</small></span></label></div></section>
      <section class="ws-pers"><h3 class="ws-pers__titulo">Tema</h3><div class="ws-tema ws-tema--largo" role="group" aria-label="Tema">
        <button type="button" class="segmented__btn ws-tema__btn" data-tema="light">${ic('sun')}<span>Claro</span></button><button type="button" class="segmented__btn ws-tema__btn" data-tema="dark">${ic('moon')}<span>Escuro</span></button><button type="button" class="segmented__btn ws-tema__btn" data-tema="auto">${ic('monitor')}<span>Sistema</span></button></div></section>
    </div>
    <footer class="ws-dialogo__pe">${btn('Repor o espaço de origem', 'rotate-ccw', { cls: 'btn--ghost', attrs: 'data-ws-repor' })}${btn('Feito', 'check', { attrs: 'data-ws-fechar' })}</footer>
  </div></div>`;
}

/* ---------- a casca: a barra lateral, o topo e as camadas, à volta de uma página ---------- */
/** Uma página do ERP dentro da casca: onde se está na barra lateral, o caminho e o conteúdo. */
export interface Pagina { onde: string; caminho: Passo[]; html: string }
export function casca(e: Estado, p: Pagina): string {
  return `${lado(e, p.onde)}
  <div class="ws-principal">
    ${topo(e, p.caminho)}
    ${e.carga === 'offline' ? `<p class="ws-faixa" role="status">${ic('wifi-off')}Sem ligação ao servidor desde as 09:41. As alterações ficam guardadas e seguem quando a ligação voltar.</p>` : ''}
    ${p.html}
  </div>
  <div class="ws-camadas" data-ws-camadas data-por-cima></div>
  <div class="ws-avisos-curtos" role="status" aria-live="polite" data-ws-toasts data-por-cima></div>`;
}

/* ---------- o Início ---------- */
export function paginaInicio(e: Estado): Pagina {
  const b = e.prefs.blocos;
  return { onde: 'inicio', caminho: [{ nome: 'Início' }], html: `
    <div class="ws-area${b.contexto ? '' : ' sem-contexto'}">
      <main class="ws-trabalho" id="ws-trabalho">
        ${cabeca(e)}
        ${blocoPrioridades(e)}
        ${b.continuar || b.acesso ? `<div class="ws-par${b.continuar && b.acesso ? '' : ' ws-par--um'}">${b.continuar ? blocoContinuar(e) : ''}${b.acesso ? blocoAcesso(e) : ''}</div>` : ''}
        ${b.fluxo ? blocoFluxo(e) : ''}
      </main>
      ${b.contexto ? contexto(e) : `<button type="button" class="ws-contexto-abrir" data-ws-contexto aria-expanded="false">${ic('panel-right')}<span>Contexto</span></button>`}
    </div>` };
}
export const corpo = (e: Estado) => casca(e, paginaInicio(e));

/** O Início com um estado (os estados do ecrã guardam o que mudam em data-ws-*; o comportamento lê-os). */
function ecra(o: { perfil?: IdPerfil; carga?: Estado['carga']; abrir?: string; densidade?: Prefs['densidade']; lado?: Prefs['lado'] } = {}): string {
  const e = estadoPadrao(o.perfil);
  e.carga = o.carga;
  if (o.densidade) e.prefs.densidade = o.densidade;
  if (o.lado) e.prefs.lado = o.lado;
  let camada = '';
  if (o.abrir?.startsWith('procura:')) { const q = o.abrir.slice(8), g = buscar(e, q); camada = procura({ q, grupos: g, recentes: [], sugestoes: sugestoes(e), a: g.length ? 'pronto' : 'nada' }); }
  else if (o.abrir === 'avisos') camada = menuAvisos(e);
  else if (o.abrir === 'personalizar') camada = personalizar(e);
  else if (o.abrir?.startsWith('painel:')) camada = painel(e, o.abrir.slice(7));
  else if (o.abrir === 'criar:nova-ef') camada = criar(e, 'nova-ef');
  const html = corpo(e).replace('<div class="ws-camadas" data-ws-camadas data-por-cima></div>', `<div class="ws-camadas" data-ws-camadas data-por-cima>${camada}</div>`);
  return `<div class="ws" data-densidade="${e.prefs.densidade}" data-lado="${e.prefs.lado}"${o.perfil ? ` data-ws-perfil="${o.perfil}"` : ''}${o.carga ? ` data-ws-carga="${o.carga}"` : ''}${o.abrir ? ` data-ws-abrir="${esc(o.abrir)}"` : ''}${o.densidade ? ` data-ws-densidade-fixa="${o.densidade}"` : ''}${o.lado ? ` data-ws-lado-fixo="${o.lado}"` : ''}>${html}</div>`;
}

const NOTA = 'O espaço de trabalho (19 out., briefing «ERP V11»): prioridades com a ação na linha, «Continuar onde fiquei», acesso rápido, o fluxo das operações e o contexto; Ctrl+K, perfis e personalização';

export function ecrasInicio(): Ecra<IdErp>[] {
  const v = (html: string) => [{ id: 'v1', nota: NOTA, html }] as Ecra<IdErp>['versoes'];
  const est = (id: IdInicio, nome: string, objetivo: string, html: string, noFluxo?: string): Ecra<IdErp> => ({ id, nome, fluxo: 'Início', estadoDe: 'inicio', objetivo, versoes: v(html), ...(noFluxo ? { noFluxo } : {}) });
  return [
    { id: 'inicio', nome: '05 · Início', fluxo: 'Início', objetivo: 'O espaço de trabalho depois de entrar: o que precisa de mim (prioridades, com a ação direta), em que estava a trabalhar (Continuar onde fiquei) e o que posso fazer a seguir (acesso rápido e o fluxo das operações). Adapta-se ao perfil e personaliza-se.', versoes: v(ecra()) },
    est('inicio-carregar', '05.1 · A carregar', 'Só as prioridades esperam pelo servidor: a barra, a cabeça e os blocos ficam no sítio, com esqueletos do tamanho das linhas (nada salta quando chegam).', ecra({ carga: 'carregar' })),
    est('inicio-vazio', '05.2 · Tudo em dia', 'Sem prioridades: diz-se que está tudo em dia, sem ilustrações; o resto do espaço fica igual.', ecra({ carga: 'vazio' })),
    est('inicio-offline', '05.3 · Sem ligação', 'O servidor não respondeu: a faixa diz desde quando, as prioridades dizem que não carregaram e há «Tentar outra vez»; o que é local (Continuar, Acesso rápido) continua.', ecra({ carga: 'offline' })),
    est('inicio-procura', '05.4 · Procura (Ctrl+K)', 'A procura global: resultados agrupados por tipo, só dos módulos do perfil; setas para escolher, Enter para abrir, Esc para fechar.', ecra({ abrir: 'procura:skf' }), 'Procura aberta'),
    est('inicio-procura-nada', '05.5 · Procura sem resultados', 'Nada encontrado nos módulos do perfil: diz-se o que se procurou e dá-se um exemplo do que se pode escrever.', ecra({ abrir: 'procura:zzz' })),
    est('inicio-avisos', '05.6 · Avisos', 'Os avisos do perfil, os por ler marcados; clicar abre o documento e marca como lido; «Marcar todos como lidos».', ecra({ abrir: 'avisos' }), 'Avisos abertos'),
    est('inicio-painel', '05.7 · Documento aberto', 'Uma prioridade aberta no painel lateral: dados, linhas, a ação que o documento pede e «Abrir em Compras».', ecra({ abrir: 'painel:EF 2026/0412' }), 'Painel aberto'),
    est('inicio-criar', '05.8 · Nova encomenda', 'Criar: o fornecedor e o armazém; fica como rascunho e aparece em «Continuar onde fiquei».', ecra({ abrir: 'criar:nova-ef' })),
    est('inicio-personalizar', '05.9 · Personalizar o meu espaço', 'Blocos, ordem do acesso rápido, módulos fixados, o que abre ao entrar, densidade e tema; guarda-se por pessoa e repõe-se.', ecra({ abrir: 'personalizar' }), 'Personalizar'),
    est('inicio-compacta', '05.10 · Compacta, barra recolhida', 'A densidade compacta (mais linhas à vista, o mesmo tamanho de letra) com a barra lateral só com os ícones.', ecra({ densidade: 'compacta', lado: 'recolhido' })),
    est('inicio-armazem', '05.11 · Perfil Armazém', 'O mesmo ecrã para a gestora do armazém 60: chegadas por arrumar, separação, expedição e correções de posição; Vendas e Faturação ficam fechadas no fluxo.', ecra({ perfil: 'armazem' })),
    est('inicio-admin', '05.12 · Perfil Administração', 'Para a administração: processos com erro e aprovações de vários departamentos; todos os módulos.', ecra({ perfil: 'admin' })),
  ];
}

export const DESCRICAO_INICIO = 'O espaço de trabalho do ERP: prioridades, continuar onde fiquei, acesso rápido e o fluxo das operações.';
