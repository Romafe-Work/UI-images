/* =========================================================
   ERP — 05 · Início v3, a área de trabalho como um IDE (6 nov. 2026): o modelo da disposição.
   Uma árvore serializável, sem DOM, para o motor de acoplar (comportamento/ide.ts) e para o desenho (ide/vista.ts):
     - Divisao: filhos lado a lado (dir 'h', colunas) ou empilhados (dir 'v', linhas), com as frações de cada um;
     - Grupo: um grupo de separadores (os itens e o ativo);
     - Flutuante: um grupo fora da árvore, numa janela que flutua na área;
     - Oculto: uma janela de ferramenta escondida na borda (ocultar automaticamente);
     - Item: um documento (um ecrã do ERP, por rota e, se for um registo, por chave) ou uma janela de ferramenta.
   A identidade é estável: «doc:<rota>» ou «doc:<rota>|<chave>» (ex.: doc:compras.encomendas|EF 2026/0413) e
   «ferr:<id>». Abrir o mesmo registo duas vezes leva ao separador que já existe (a política: um registo, um
   separador); para o ver em dois sítios há «Dividir documento», com uma só vista que edita.
   Guarda-se só a arrumação (rotas, chaves, títulos, tamanhos, posições); nunca dados dos documentos.
   ========================================================= */

export const ESQUEMA = 1;
export type Dir = 'h' | 'v';
export type Lado = 'esq' | 'dir' | 'cima' | 'baixo';
export type Zona = Lado | 'centro';
export type IdFerr = 'explorador' | 'pesquisa' | 'propriedades' | 'stock' | 'relacionados' | 'historico' | 'notificacoes' | 'mensagens';

export interface Divisao { t: 'div'; id: string; dir: Dir; filhos: No[]; tam: number[] }
export interface Grupo { t: 'grupo'; id: string; itens: string[]; ativo: string }
export type No = Divisao | Grupo;
export interface Flutuante { id: string; grupo: Grupo; x: number; y: number; w: number; h: number; z: number; max?: boolean }
export interface Oculto { item: string; lado: Exclude<Lado, 'cima'>; tam: number }
/** O que um inspetor mostra: o registo escolhido (segue a seleção) ou um registo fixado. */
export interface Contexto { tipo: 'artigo' | 'encomenda' | 'fornecedor'; chave: string }
/** Onde estava um item antes de flutuar ou de se ocultar, para voltar lá. */
export interface Volta { grupo?: string; vizinho?: string; lado?: Lado }
export interface Item {
  id: string; tipo: 'doc' | 'ferr'; titulo: string;
  rota?: string; chave?: string; modo?: string; ferr?: IdFerr;
  /** separador fixado (fica à esquerda e «Fechar outros» não o fecha) */
  fixo?: boolean;
  /** inspetor fixado num registo (não muda com a seleção) */
  preso?: Contexto | null;
  /** «Dividir documento»: a segunda vista, só de leitura */
  dividido?: { dir: Dir; frac: number };
  volta?: Volta;
}
export interface Disposicao {
  v: typeof ESQUEMA; raiz: No; flut: Flutuante[]; ocultos: Oculto[]; itens: Record<string, Item>;
  ativo: string; grupo: string; max?: string; barraEstado: boolean;
  /** grupos escondidos com Ctrl B, Ctrl J ou Ctrl Alt B (a barra lateral, o painel, a secundária) e qual era qual */
  escondidos?: string[]; regioes?: Partial<Record<'esq' | 'dir' | 'baixo', string[]>>;
}

/* ---------- ids ---------- */
let seq = 0;
export const novoId = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;
export const idDoc = (rota: string, chave?: string) => `doc:${rota}${chave ? `|${chave}` : ''}`;
export const idFerr = (f: IdFerr) => `ferr:${f}`;

/* ---------- as janelas de ferramenta: título e onde se acoplam quando se reabrem ---------- */
export const FERRAMENTAS: Record<IdFerr, { titulo: string; lado: Exclude<Lado, 'cima'>; icone: string; tecla?: string }> = {
  explorador: { titulo: 'Módulos do ERP', lado: 'esq', icone: 'layout-grid' },
  pesquisa: { titulo: 'Procurar no ERP', lado: 'esq', icone: 'package-search' },
  propriedades: { titulo: 'Ficha', lado: 'dir', icone: 'id-card' },
  stock: { titulo: 'Stock por armazém', lado: 'baixo', icone: 'warehouse' },
  relacionados: { titulo: 'Documentos ligados', lado: 'baixo', icone: 'file-stack' },
  historico: { titulo: 'Abertos recentemente', lado: 'baixo', icone: 'history' },
  notificacoes: { titulo: 'Alertas de compras', lado: 'dir', icone: 'triangle-alert' },
  mensagens: { titulo: 'Mensagens', lado: 'baixo', icone: 'message-square' },
};
export const itemFerr = (f: IdFerr): Item => ({ id: idFerr(f), tipo: 'ferr', ferr: f, titulo: FERRAMENTAS[f].titulo });

/* ---------- procurar ---------- */
export function grupos(d: Disposicao): Grupo[] {
  const r: Grupo[] = []; const andar = (n: No) => { if (n.t === 'grupo') r.push(n); else n.filhos.forEach(andar); };
  andar(d.raiz); d.flut.forEach((f) => r.push(f.grupo)); return r;
}
export const grupo = (d: Disposicao, id: string) => grupos(d).find((g) => g.id === id) ?? null;
export const grupoDe = (d: Disposicao, item: string) => grupos(d).find((g) => g.itens.includes(item)) ?? null;
export const flutDe = (d: Disposicao, gid: string) => d.flut.find((f) => f.grupo.id === gid) ?? null;
export const naArvore = (d: Disposicao, gid: string) => !flutDe(d, gid) && !!grupo(d, gid);
/** O pai de um nó na árvore (e a posição nele). */
export function pai(raiz: No, id: string): { p: Divisao; i: number } | null {
  if (raiz.t === 'grupo') return null;
  for (let i = 0; i < raiz.filhos.length; i++) { if (raiz.filhos[i].id === id) return { p: raiz, i }; const r = pai(raiz.filhos[i], id); if (r) return r; }
  return null;
}
export const visivel = (d: Disposicao, item: string) => { const g = grupoDe(d, item); return !!g && g.ativo === item && !(d.escondidos ?? []).includes(g.id) && (!d.max || d.max === g.id || !!flutDe(d, g.id)); };
export const soFerramentas = (d: Disposicao, g: Grupo) => g.itens.length > 0 && g.itens.every((i) => d.itens[i]?.tipo === 'ferr');

/* ---------- arrumar a árvore depois de cada mudança ---------- */
/** Tira grupos vazios (menos o último da árvore, que fica como «poço» dos documentos), junta divisões com um só filho
    e achata divisões dentro de divisões com a mesma direção. */
export function arrumar(d: Disposicao): void {
  const limpar = (n: No): No | null => {
    if (n.t === 'grupo') return n.itens.length ? n : null;
    const fs: No[] = [], ts: number[] = [];
    n.filhos.forEach((f, i) => {
      const x = limpar(f); if (!x) return;
      if (x.t === 'div' && x.dir === n.dir) x.filhos.forEach((y, j) => { fs.push(y); ts.push(n.tam[i] * x.tam[j]); });
      else { fs.push(x); ts.push(n.tam[i]); }
    });
    if (!fs.length) return null;
    if (fs.length === 1) return fs[0];
    const s = ts.reduce((a, b) => a + b, 0) || 1;
    n.filhos = fs; n.tam = ts.map((t) => t / s); return n;
  };
  const r = limpar(d.raiz);
  d.raiz = r ?? { t: 'grupo', id: d.raiz.t === 'grupo' ? d.raiz.id : novoId('g'), itens: [], ativo: '' };
  d.flut = d.flut.filter((f) => f.grupo.itens.length);
  grupos(d).forEach((g) => { if (!g.itens.includes(g.ativo)) g.ativo = g.itens[0] ?? ''; });
  if (d.max && !grupo(d, d.max)) d.max = undefined;
  if (d.escondidos) d.escondidos = d.escondidos.filter((x) => !!grupo(d, x));
  if (d.regioes) (Object.keys(d.regioes) as ('esq' | 'dir' | 'baixo')[]).forEach((l) => { const v = (d.regioes![l] ?? []).filter((x) => !!grupo(d, x)); if (v.length) d.regioes![l] = v; else delete d.regioes![l]; });
  if (!grupo(d, d.grupo)) d.grupo = grupoDe(d, d.ativo)?.id ?? (d.raiz.t === 'grupo' ? d.raiz.id : grupos(d)[0]?.id ?? '');
}

/* ---------- tirar e pôr ---------- */
/** Tira um item de onde estiver (grupo, janela flutuante, borda) e guarda onde estava. Não arruma a árvore. */
export function tirar(d: Disposicao, item: string): void {
  const g = grupoDe(d, item);
  if (g) {
    const it = d.itens[item];
    const i = g.itens.indexOf(item);
    if (it && naArvore(d, g.id)) it.volta = { grupo: g.id, vizinho: g.itens[i + 1] ?? g.itens[i - 1] };
    g.itens.splice(i, 1);
    if (g.ativo === item) g.ativo = g.itens[Math.min(i, g.itens.length - 1)] ?? '';
  }
  d.ocultos = d.ocultos.filter((o) => o.item !== item);
}
/** Põe um item num grupo, na posição pedida (por omissão a seguir ao ativo), e ativa-o. */
export function porNoGrupo(d: Disposicao, item: string, gid: string, pos?: number): void {
  const g = grupo(d, gid); if (!g) return;
  if (g.itens.includes(item)) { g.ativo = item; return; }
  const fixos = g.itens.filter((i) => d.itens[i]?.fixo).length;
  let k = pos ?? (g.itens.indexOf(g.ativo) + 1 || g.itens.length);
  if (!d.itens[item]?.fixo) k = Math.max(k, fixos); else k = Math.min(k, fixos);
  g.itens.splice(Math.max(0, Math.min(g.itens.length, k)), 0, item); g.ativo = item;
}
/** Divide o nó «alvo» da árvore e põe um grupo novo (com o item) do lado pedido. Devolve o id do grupo novo. */
export function dividir(d: Disposicao, alvo: string, lado: Lado, item: string, frac = .5): string {
  const novo: Grupo = { t: 'grupo', id: novoId('g'), itens: [item], ativo: item };
  const dir: Dir = lado === 'esq' || lado === 'dir' ? 'h' : 'v', antes = lado === 'esq' || lado === 'cima';
  const p = pai(d.raiz, alvo);
  const no = alvo === d.raiz.id ? d.raiz : p?.p.filhos[p.i];
  if (!no) return '';
  if (p && p.p.dir === dir) {
    /* o pai já divide nesta direção: o grupo novo entra ao lado, com metade (ou frac) do espaço do alvo */
    const t = p.p.tam[p.i];
    p.p.filhos.splice(antes ? p.i : p.i + 1, 0, novo);
    p.p.tam.splice(p.i, 1, ...(antes ? [t * frac, t * (1 - frac)] : [t * (1 - frac), t * frac]));
  } else {
    const div: Divisao = { t: 'div', id: novoId('d'), dir, filhos: antes ? [novo, no] : [no, novo], tam: antes ? [frac, 1 - frac] : [1 - frac, frac] };
    if (p) p.p.filhos[p.i] = div; else d.raiz = div;
  }
  return novo.id;
}
/** Acopla o item a uma borda da área inteira (as setas das bordas). */
export const acoplarBorda = (d: Disposicao, lado: Lado, item: string, frac: number) => dividir(d, d.raiz.id, lado, item, frac);

/* ---------- validar o que vem guardado ---------- */
const eNo = (n: unknown): n is No => {
  const o = n as No; if (!o || typeof o !== 'object' || typeof o.id !== 'string') return false;
  if (o.t === 'grupo') return Array.isArray(o.itens) && o.itens.every((i) => typeof i === 'string');
  if (o.t === 'div') return (o.dir === 'h' || o.dir === 'v') && Array.isArray(o.filhos) && Array.isArray(o.tam) && o.filhos.length === o.tam.length && o.filhos.every(eNo) && o.tam.every((t) => typeof t === 'number' && t > 0);
  return false;
};
/** Lê uma disposição guardada; devolve null se não for desta versão do esquema ou não fizer sentido. */
export function validar(x: unknown): Disposicao | null {
  const d = x as Disposicao;
  if (!d || typeof d !== 'object' || d.v !== ESQUEMA || !eNo(d.raiz) || !Array.isArray(d.flut) || !Array.isArray(d.ocultos) || !d.itens || typeof d.itens !== 'object') return null;
  if (!d.flut.every((f) => f && eNo(f.grupo) && f.grupo.t === 'grupo' && [f.x, f.y, f.w, f.h].every((n) => typeof n === 'number' && isFinite(n)))) return null;
  if (!d.ocultos.every((o) => o && typeof o.item === 'string' && ['esq', 'dir', 'baixo'].includes(o.lado))) return null;
  const copia = JSON.parse(JSON.stringify(d)) as Disposicao;
  copia.barraEstado = copia.barraEstado !== false;
  return copia;
}
/** Tira os itens que já não se podem abrir (rota que deixou de existir, sem permissão) e diz quais saíram. */
export function filtrar(d: Disposicao, pode: (i: Item) => boolean): Item[] {
  const fora: Item[] = [];
  const usados = new Set([...grupos(d).flatMap((g) => g.itens), ...d.ocultos.map((o) => o.item)]);
  usados.forEach((id) => { const it = d.itens[id]; if (!it || !pode(it)) { if (it) fora.push(it); tirar(d, id); delete d.itens[id]; } });
  Object.keys(d.itens).forEach((k) => { if (!usados.has(k)) delete d.itens[k]; });
  arrumar(d);
  if (!d.itens[d.ativo] || !grupoDe(d, d.ativo)) d.ativo = grupo(d, d.grupo)?.ativo ?? grupos(d)[0]?.ativo ?? '';
  return fora;
}
export const copiar = (d: Disposicao): Disposicao => JSON.parse(JSON.stringify(d)) as Disposicao;

/* ---------- as disposições prontas (configuração da área de trabalho, não módulos novos) ---------- */
export interface Preset { id: string; nome: string; descricao: string; criar: () => Disposicao }
const G = (itens: string[], ativo = itens[0]): Grupo => ({ t: 'grupo', id: novoId('g'), itens, ativo });
const D = (dir: Dir, filhos: No[], tam: number[]): Divisao => ({ t: 'div', id: novoId('d'), dir, filhos, tam });
const doc = (rota: string, titulo: string, chave?: string): Item => ({ id: idDoc(rota, chave), tipo: 'doc', rota, titulo, ...(chave ? { chave } : {}) });
function montar(itens: Item[], raiz: No, ativo: string): Disposicao {
  const d: Disposicao = { v: ESQUEMA, raiz, flut: [], ocultos: [], itens: {}, ativo, grupo: '', barraEstado: true };
  itens.forEach((i) => { d.itens[i.id] = i; });
  d.grupo = grupoDe(d, ativo)?.id ?? ''; return d;
}
const EXP = itemFerr('explorador');
/** Com o Explorador à esquerda: [explorador | resto]. */
const comExplorador = (resto: No, larg = .19): No => D('h', [G([EXP.id, idFerr('pesquisa')]), resto], [larg, 1 - larg]);
export const PRESETS: Preset[] = [
  {
    id: 'padrao', nome: 'Padrão', descricao: 'O Explorador à esquerda e os documentos ao centro.',
    criar: () => { const e = doc('compras.encomendas', 'Encomendas'); return montar([EXP, itemFerr('pesquisa'), e], comExplorador(G([e.id])), e.id); },
  },
  {
    id: 'compras', nome: 'Compras', descricao: 'A Lista de Faltas à esquerda, as Encomendas à direita e o stock do artigo escolhido por baixo.',
    criar: () => {
      const f = doc('compras.faltas', 'Lista de Faltas'), e = doc('compras.encomendas', 'Encomendas'), s = itemFerr('stock'), p = itemFerr('propriedades');
      return montar([EXP, itemFerr('pesquisa'), f, e, s, p], comExplorador(D('v', [D('h', [G([f.id]), G([e.id])], [.5, .5]), G([s.id, p.id])], [.7, .3])), f.id);
    },
  },
  {
    id: 'fornecedores', nome: 'Análise de Fornecedores', descricao: 'A análise de fornecedores à esquerda, o mapa recapitulativo à direita e os documentos relacionados por baixo.',
    criar: () => {
      const a = doc('compras.mapas-analise-forn', 'Análise de fornecedores'), m = doc('compras.mapas-recap', 'Mapa recapitulativo de fornecedores'), r = itemFerr('relacionados');
      return montar([EXP, itemFerr('pesquisa'), a, m, r], comExplorador(D('v', [D('h', [G([a.id]), G([m.id])], [.5, .5]), G([r.id])], [.72, .28])), a.id);
    },
  },
  {
    id: 'artigos', nome: 'Gestão de Artigos', descricao: 'O catálogo de artigos à esquerda, os detalhes do artigo à direita e o stock por armazém por baixo.',
    criar: () => {
      const a = doc('ficheiros.artigos', 'Artigos'), p = itemFerr('propriedades'), s = itemFerr('stock'), h = itemFerr('historico');
      return montar([EXP, itemFerr('pesquisa'), a, p, s, h], comExplorador(D('v', [D('h', [G([a.id]), G([p.id])], [.66, .34]), G([s.id, h.id])], [.7, .3])), a.id);
    },
  },
  {
    id: 'contabilidade', nome: 'Contabilidade', descricao: 'As faturas de fornecedor à esquerda, as guias à direita e o histórico dos documentos por baixo.',
    criar: () => {
      const f = doc('compras.compras-faturas', 'Faturas'), g = doc('compras.compras-guias-entrada', 'Guias'), h = itemFerr('historico'), r = itemFerr('relacionados');
      return montar([EXP, itemFerr('pesquisa'), f, g, h, r], comExplorador(D('v', [D('h', [G([f.id]), G([g.id])], [.5, .5]), G([h.id, r.id])], [.7, .3])), f.id);
    },
  },
];
export const preset = (id: string) => (PRESETS.find((p) => p.id === id) ?? PRESETS[0]).criar();
