/* =========================================================
   ERP — Ficheiros (23 out. 2026): 30 · Artigos, 31 · Armazéns, 32 · Famílias, 33 · Marcas, 34 · Unidades de medida.
   São os cinco atalhos do Início que a gestão aprovou (com Encomendas). Para os cartões não serem botões falsos,
   cada um abre um ecrã de consulta a sério: procurar, ordenar, escolher uma linha e ver o detalhe ao lado.
   Só consulta: criar e editar fichas ainda não existe, por isso não aparece (nem na página nem na barra de ações).
   Dados: os artigos, as marcas, as unidades e o stock são os do protótipo (compras/dominio.ts). A família sai da
   descrição do artigo e os armazéns 10 e 20 são os da Lista de faltas — de exemplo, até haver o modelo de stock.
   Comportamento: ficheiros/comportamento.ts. CSS: css/ficheiros.css. Dentro de um separador a moldura esconde-se.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { topoErp } from '../inicio-v2';
import { ARTIGOS, FORNECEDORES, ARMAZEM, stock, euros } from '../compras/dominio';
import { icone, L, esc } from '../espaco';
import search from 'lucide-static/icons/search.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import arrowUpDown from 'lucide-static/icons/arrow-up-down.svg?raw';
import mousePointerClick from 'lucide-static/icons/mouse-pointer-click.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import warehouseIc from 'lucide-static/icons/warehouse.svg?raw';
import usersIc from 'lucide-static/icons/users.svg?raw';
import serverOff from 'lucide-static/icons/server-off.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import lockIc from 'lucide-static/icons/lock.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import refreshCw from 'lucide-static/icons/refresh-cw.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';

export type IdFicheiros = 'ficheiros-artigos' | 'ficheiros-armazens' | 'ficheiros-familias' | 'ficheiros-marcas' | 'ficheiros-unidades';

/** A família, tirada da descrição (de exemplo: o protótipo ainda não tem famílias). */
export function familiaDe(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes('rolamento')) return 'Rolamentos';
  if (d.includes('massa')) return 'Lubrificação';
  if (d.includes('pastilhas') || d.includes('disco')) return 'Travagem';
  if (d.includes('terminal')) return 'Direção e suspensão';
  if (d.includes('vela')) return 'Ignição';
  if (d.includes('embraiagem')) return 'Embraiagem';
  if (d.includes('distribuição') || d.includes('correia')) return 'Distribuição';
  if (d.includes('filtro')) return 'Filtragem';
  return 'Outros';
}
const UNIDADES: Record<string, [string, number]> = { 'un.': ['Unidade', 0], jogo: ['Jogo', 0] };
const fornNome = (id: string) => FORNECEDORES.find((f) => f.id === id)?.nome ?? id;
const n = (k: number) => k.toLocaleString('pt-PT');

export type Col = { k: string; t: string; num?: boolean; mono?: boolean };
/** Uma linha: os valores à vista, os de ordenar (números) e o detalhe (sem ele, sai das colunas). */
export type Linha = { v: Record<string, string>; ord: Record<string, string | number>; det?: string };
/** Uma tabela de consulta (Ficheiros e, desde 23 out., os ecrãs do menu Compras): caminho = o grupo no cabeçalho. */
export interface Tabela { id: string; num: string; titulo: string; ic: string; um: string; varios: string; procura: string; nota: string; cols: Col[]; linhas: () => Linha[]; caminho?: string; vazio?: [string, string] }

/** As janelas de contexto (só dentro de um separador do Início v2, que as abre a partir do botão). */
const janelas = (bs: [string, string, string][]) => `<div class="fx-jans">${bs.map(([alvo, ic, t]) => `<button type="button" class="fx-jan-b" data-dk-janela="${esc(alvo)}">${L(ic)}<span>${esc(t)}</span></button>`).join('')}</div>`;
/** O detalhe: as fichas em pares rótulo/valor e, quando há, os artigos que lhe pertencem. */
export const det = (titulo: string, pares: [string, string][], artigos?: string[], extra = '', rotuloLista = 'Artigos') => `<p class="fx-conta" data-fx-conta></p><h2>${esc(titulo)}</h2>
  <dl>${pares.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
  ${extra}
  ${artigos ? `<h3>${esc(rotuloLista)} <span>${artigos.length}</span></h3><ul>${artigos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}`;
const artigosDe = (f: (a: typeof ARTIGOS[number]) => boolean) => ARTIGOS.filter(f).map((a) => `${a.ref} · ${a.desc}`);

const TABELAS: Tabela[] = [
  { id: 'ficheiros-artigos', num: '30', titulo: 'Artigos', ic: 'package', um: 'artigo', varios: 'artigos', procura: 'Referência, descrição, marca ou EAN', nota: 'O stock é o do armazém 60; a família sai da descrição (de exemplo).',
    cols: [{ k: 'ref', t: 'Referência', mono: true }, { k: 'desc', t: 'Descrição' }, { k: 'marca', t: 'Marca' }, { k: 'fam', t: 'Família' }, { k: 'un', t: 'Un.' }, { k: 'stock', t: 'Stock', num: true }, { k: 'preco', t: 'Último preço', num: true }],
    linhas: () => ARTIGOS.map((a) => { const s = stock(a.ref), fam = familiaDe(a.desc); return {
      v: { ref: a.ref, desc: a.desc, marca: a.marca, fam, un: a.un, stock: n(s), preco: a.preco === null ? '—' : euros(a.preco), _ean: a.ean },
      ord: { stock: s, preco: a.preco ?? -1 },
      det: det(a.ref, [['Descrição', a.desc], ['Marca', a.marca], ['Família', fam], ['Unidade', a.un], ['Stock no armazém 60', n(s)], ['Último preço', a.preco === null ? 'Sem preço' : euros(a.preco)], ['IVA', `${a.iva / 100} %`], ['EAN', a.ean], ['Fornecedor habitual', fornNome(a.forn)], ['Referência no fornecedor', a.refForn]], undefined, janelas([[`artigo:${a.ref}`, warehouseIc, 'Stock por armazém'], [`fornecedor:${a.forn}`, usersIc, 'Ver fornecedor']])),
    }; }) },
  { id: 'ficheiros-armazens', num: '31', titulo: 'Armazéns', ic: 'warehouse', um: 'armazém', varios: 'armazéns', procura: 'Código, nome ou localidade', nota: 'O 60 é o do protótipo; o 10 e o 20 são os da Lista de faltas, de exemplo, ainda sem stock.',
    cols: [{ k: 'cod', t: 'Código', mono: true }, { k: 'nome', t: 'Nome' }, { k: 'loc', t: 'Localidade' }, { k: 'arts', t: 'Artigos com stock', num: true }],
    linhas: () => {
      const com = ARTIGOS.filter((a) => stock(a.ref) > 0);
      return ([['60', ARMAZEM.split(' · ')[0], 'Coimbra', com.length], ['10', 'Armazém 10', 'Porto', null], ['20', 'Armazém 20', 'Sacavém', null]] as [string, string, string, number | null][]).map(([cod, nome, loc, k]) => ({
        v: { cod, nome, loc, arts: k === null ? '—' : n(k) }, ord: { arts: k ?? -1 },
        det: det(`${cod} · ${loc}`, [['Nome', nome], ['Localidade', loc], ['Artigos com stock', k === null ? 'Sem stock no protótipo' : n(k)], ['Posições', cod === '60' ? 'armazém · zona · coluna · prateleira' : '—']], k === null ? undefined : com.map((a) => `${a.ref} · ${n(stock(a.ref))} ${a.un}`)),
      }));
    } },
  { id: 'ficheiros-familias', num: '32', titulo: 'Famílias', ic: 'folder-tree', um: 'família', varios: 'famílias', procura: 'Família ou marca', nota: 'De exemplo: as famílias saem da descrição dos artigos.',
    cols: [{ k: 'fam', t: 'Família' }, { k: 'arts', t: 'Artigos', num: true }, { k: 'marcas', t: 'Marcas' }, { k: 'stock', t: 'Stock', num: true }],
    linhas: () => [...new Set(ARTIGOS.map((a) => familiaDe(a.desc)))].sort().map((fam) => {
      const as = ARTIGOS.filter((a) => familiaDe(a.desc) === fam), marcas = [...new Set(as.map((a) => a.marca))].join(', '), s = as.reduce((t, a) => t + stock(a.ref), 0);
      return { v: { fam, arts: n(as.length), marcas, stock: n(s) }, ord: { arts: as.length, stock: s }, det: det(fam, [['Marcas', marcas], ['Stock no armazém 60', n(s)]], artigosDe((a) => familiaDe(a.desc) === fam)) };
    }) },
  { id: 'ficheiros-marcas', num: '33', titulo: 'Marcas', ic: 'tag', um: 'marca', varios: 'marcas', procura: 'Marca ou fornecedor', nota: 'As marcas dos artigos do protótipo e o fornecedor de cada artigo.',
    cols: [{ k: 'marca', t: 'Marca' }, { k: 'forn', t: 'Fornecedor habitual' }, { k: 'arts', t: 'Artigos', num: true }, { k: 'sem', t: 'Sem stock', num: true }],
    linhas: () => [...new Set(ARTIGOS.map((a) => a.marca))].sort().map((marca) => {
      const as = ARTIGOS.filter((a) => a.marca === marca), forn = [...new Set(as.map((a) => fornNome(a.forn)))].join(', '), sem = as.filter((a) => stock(a.ref) <= 0).length;
      return { v: { marca, forn, arts: n(as.length), sem: n(sem) }, ord: { arts: as.length, sem }, det: det(marca, [['Fornecedor habitual', forn], ['Artigos sem stock', n(sem)]], artigosDe((a) => a.marca === marca), janelas([...new Set(as.map((a) => a.forn))].map((f): [string, string, string] => [`fornecedor:${f}`, usersIc, `Ver ${fornNome(f)}`]))) };
    }) },
  { id: 'ficheiros-unidades', num: '34', titulo: 'Unidades de medida', ic: 'ruler', um: 'unidade', varios: 'unidades', procura: 'Código ou descrição', nota: 'As unidades usadas pelos artigos do protótipo.',
    cols: [{ k: 'cod', t: 'Código', mono: true }, { k: 'desc', t: 'Descrição' }, { k: 'casas', t: 'Casas decimais', num: true }, { k: 'arts', t: 'Artigos', num: true }],
    linhas: () => [...new Set(ARTIGOS.map((a) => a.un))].map((cod) => {
      const [desc, casas] = UNIDADES[cod] ?? [cod, 0], k = ARTIGOS.filter((a) => a.un === cod).length;
      return { v: { cod, desc, casas: String(casas), arts: n(k) }, ord: { casas, arts: k }, det: det(`${cod} · ${desc}`, [['Casas decimais', String(casas)]], artigosDe((a) => a.un === cod)) };
    }) },
];

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Os estados de uma consulta (26 out. 2026, ela: «coloca todos os estados por screen»). */
export type CenarioTabela = 'normal' | 'carregar' | 'linha' | 'sem-resultados' | 'ordenado' | 'vazia' | 'servidor' | 'offline' | 'permissao' | 'sessao';
const ERROS_TABELA: Partial<Record<CenarioTabela, [string, string, string, string]>> = {
  servidor: [serverOff, 'O servidor não respondeu.', 'Não foi possível ler a lista (ERP-503). A procura fica como estava.', 'repetir'],
  offline: [wifiOff, 'Sem ligação à rede.', 'A lista precisa do servidor. Quando a ligação voltar, tenta outra vez.', 'repetir'],
  permissao: [lockIc, 'Sem permissão.', 'O teu perfil não tem acesso a esta consulta. Pede-o a quem gere os acessos do ERP.', ''],
  sessao: [logIn, 'A sessão terminou.', 'Volta a entrar para continuar; voltas a este ecrã.', 'login'],
};
/** 28 out. (ela: «junta os ecrãs assim»): duas consultas no mesmo ecrã (Totais e Detalhes), em vistas por cima da lista,
 *  como nas Encomendas v5; `k` é a vista desta tabela. Cada vista é a sua consulta inteira; mudar só mostra a outra. */
export interface Par { k: string; titulo: string; ic: string; vistas: [string, string, string][] }
const vistasPar = (p: Par) => `<nav class="dv2c-vistas-zona fx-par-zona" aria-label="Vistas"><div class="dv2-vistas dv2c-vistas" role="tablist" aria-label="Ver">${p.vistas.map(([k, t, ic], i) => `<button type="button" role="tab" aria-selected="${k === p.k}"${k === p.k ? '' : ' tabindex="-1"'} data-fx-par-vista="${k}" aria-keyshortcuts="Alt+${i + 1}" title="${esc(t)} (Alt ${i + 1})">${icone(ic)}<span>${esc(t)}</span></button>`).join('')}<i class="dv2c-vistas-ind" data-fx-par-ind aria-hidden="true"></i></div></nav>`;
export function paginaTabela(t: Tabela, cen: CenarioTabela = 'normal', par?: Par): string {
  const tit = par?.titulo ?? t.titulo, ic = par?.ic ?? t.ic, zona = par ? vistasPar(par) : '';
  let ls = cen === 'vazia' ? [] : t.linhas().map((l) => ({ ...l, det: l.det ?? det(l.v[t.cols[0].k], t.cols.slice(1).map((c): [string, string] => [c.t, l.v[c.k]])) }));
  if (cen === 'ordenado') ls = ls.slice().reverse();
  const escolhida = cen === 'linha' ? Math.min(2, ls.length - 1) : 0;
  const erro = ERROS_TABELA[cen];
  if (erro || cen === 'carregar') {
    const corpo = cen === 'carregar' ? `<div class="fx-caixa"><div class="fx-esq" aria-label="A carregar">${Array.from({ length: 8 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div></div><aside class="fx-det"><div class="fx-esq fx-esq--det"><i></i><i></i><i></i><i></i></div></aside>`
      : `<div class="fx-caixa fx-caixa--erro"><div class="fx-nada fx-nada--erro" role="alert">${L(erro![0])}<p><b>${esc(erro![1])}</b>${esc(erro![2])}</p>${erro![3] === 'repetir' ? `<button type="button" class="fx-btn fx-btn--acao" data-fx-repetir="${esc(t.id)}">${L(refreshCw)}<span>Tentar outra vez</span></button>` : erro![3] === 'login' ? `<button type="button" class="fx-btn fx-btn--acao" data-login>${L(logIn)}<span>Voltar a entrar</span></button>` : ''}</div></div>`;
    return `<div class="hm fx" data-hm data-fx data-fx-cenario="${cen}">
  ${topoErp([['ERP', 'inicio'], [t.caminho ?? 'Ficheiros', ''], [tit, '']])}
  <header class="fx-cab">
    <span class="fx-ic">${icone(ic)}</span>
    <div><h1>${esc(tit)}</h1><p class="fx-sub">${cen === 'carregar' ? 'A carregar…' : esc(t.nota)}</p></div>
    <label class="fx-procura">${L(search)}<input type="search" placeholder="${esc(t.procura)}" aria-label="Procurar em ${esc(t.titulo)}" data-fx-q autocomplete="off"${cen === 'carregar' ? '' : ' disabled'}><kbd>Enter</kbd></label>
  </header>
  ${zona}
  <div class="fx-corpo${cen === 'carregar' ? '' : ' fx-corpo--erro'}">${corpo}</div>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
  }
  const vazio = t.vazio ?? [`Ainda não há ${t.varios}.`, 'Quando houver, aparecem aqui.'];
  const th = t.cols.map((c, i) => `<th scope="col"${c.num ? ' class="is-num"' : ''} aria-sort="${i === 0 ? (cen === 'ordenado' ? 'descending' : 'ascending') : 'none'}"><button type="button" data-fx-ord="${c.k}">${esc(c.t)}${L(arrowUpDown)}</button></th>`).join('');
  const tr = ls.map((l, i) => `<tr tabindex="${i === escolhida ? 0 : -1}" aria-selected="${i === escolhida}" data-fx-i="${i}" data-fx-texto="${esc(norm(Object.values(l.v).join(' ')))}" ${t.cols.map((c) => `data-fx-v-${c.k}="${esc(String(l.ord[c.k] ?? norm(l.v[c.k])))}"`).join(' ')}>${t.cols.map((c) => `<td${c.num ? ' class="is-num"' : c.mono ? ' class="is-mono"' : ''}>${esc(l.v[c.k])}</td>`).join('')}</tr>`).join('');
  const q = cen === 'sem-resultados' ? 'XPTO-999' : '';
  return `<div class="hm fx" data-hm data-fx data-fx-cenario="${cen}">
  ${topoErp([['ERP', 'inicio'], [t.caminho ?? 'Ficheiros', ''], [tit, '']])}
  <header class="fx-cab">
    <span class="fx-ic">${icone(ic)}</span>
    <div><h1>${esc(tit)}</h1><p class="fx-sub"><b data-fx-n>${ls.length}</b> <span data-fx-um="${esc(t.um)}" data-fx-varios="${esc(t.varios)}">${ls.length === 1 ? t.um : t.varios}</span> · ${esc(t.nota)}</p></div>
    <label class="fx-procura">${L(search)}<input type="search" placeholder="${esc(t.procura)}" aria-label="Procurar em ${esc(t.titulo)}" data-fx-q autocomplete="off" value="${q}"><kbd>Enter</kbd></label>
  </header>
  ${zona}
  <div class="fx-corpo">
    <div class="fx-caixa">
      ${!ls.length ? `<div class="fx-nada fx-nada--vazio">${L(inbox)}<p><b>${esc(vazio[0])}</b>${esc(vazio[1])}</p></div>` : ''}
      <table class="fx-tab" aria-label="${esc(t.titulo)}"${ls.length && !q ? '' : ' hidden'}><thead><tr>${th}</tr></thead><tbody data-fx-linhas>${tr}</tbody></table>
      <div class="fx-nada" data-fx-nada${q ? '' : ' hidden'}>${L(searchX)}<p><b>Nada para «<span data-fx-nada-q>${q}</span>».</b>Procura em ${esc(t.procura.toLowerCase())}.</p><button type="button" class="fx-btn" data-fx-limpar>${L(x)}<span>Limpar a procura</span></button></div>
    </div>
    <aside class="fx-det" data-fx-det aria-live="polite" aria-label="Detalhe">${q ? `<p class="fx-vazio">${L(mousePointerClick)}Nada para mostrar.</p>` : ls[escolhida]?.det ?? `<p class="fx-vazio">${L(mousePointerClick)}${ls.length ? 'Escolhe uma linha.' : 'Nada para mostrar.'}</p>`}</aside>
    ${ls.map((l, i) => `<template data-fx-det-i="${i}">${l.det}</template>`).join('')}
  </div>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

const NOTA = 'Consulta (23 out., para os atalhos do Início v6 não serem botões falsos): procurar, ordenar, escolher a linha e ver o detalhe; Enter na procura passa à primeira linha. Criar e editar fichas ainda não existe.';
export const DESCRICAO_FICHEIROS = 'Os dados mestres que os atalhos do Início abrem: artigos, armazéns, famílias, marcas e unidades de medida. Só consulta; abrem num separador da área de trabalho.';
/** Os estados de uma consulta, como estados do ecrã (por baixo das versões no editor). */
const ESTADOS_TABELA: [CenarioTabela, string, string][] = [
  ['carregar', 'A carregar', 'A lista e o detalhe em esqueleto; a procura já se escreve.'],
  ['linha', 'Linha escolhida', 'Uma linha escolhida (a terceira): o detalhe é o dela, com o contador «3 de N».'],
  ['sem-resultados', 'Procura sem resultados', 'A procura não encontra nada: diz o que se procurou e onde, e «Limpar a procura».'],
  ['ordenado', 'Ordenado ao contrário', 'O cabeçalho da primeira coluna carregado duas vezes: do fim para o princípio.'],
  ['vazia', 'Sem dados', 'Ainda não há linhas: diz-se, sem ilustrações.'],
  ['servidor', 'Erro do servidor', 'O servidor não respondeu: a referência do erro e «Tentar outra vez».'],
  ['offline', 'Sem ligação', 'Sem rede: tenta-se outra vez quando a ligação voltar.'],
  ['permissao', 'Sem permissão', 'O perfil não tem acesso: diz a quem pedir; não se mostram dados.'],
  ['sessao', 'Sessão terminada', 'Voltar a entrar pelo login comum; volta-se a este ecrã.'],
];
export function estadosTabela(t: Tabela, fluxo: string, nota: string, html = (cen: CenarioTabela) => paginaTabela(t, cen)): Ecra<IdErp>[] {
  return ESTADOS_TABELA.map(([cen, nome, objetivo], i) => ({ id: `${t.id}-est-${cen}` as IdErp, nome: `${t.num}.${i + 1} · ${nome}`, fluxo, estadoDe: t.id as IdErp, objetivo, versoes: [{ id: 'v1', nota, html: html(cen) }] }) as Ecra<IdErp>);
}
export type IdEstados = `${string}-est-${string}`;
export function ecrasFicheiros(): Ecra<IdErp>[] {
  return TABELAS.flatMap((t) => [{ id: t.id as IdErp, nome: `${t.num} · ${t.titulo}`, fluxo: 'Ficheiros', objetivo: `${t.titulo}: procurar, ordenar e ver o detalhe de cada linha. ${t.nota}`, versoes: [{ id: 'v1', nota: NOTA, html: paginaTabela(t) }] } as Ecra<IdErp>, ...estadosTabela(t, 'Ficheiros', NOTA)]);
}
