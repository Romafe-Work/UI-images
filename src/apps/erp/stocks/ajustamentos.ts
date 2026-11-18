/* =========================================================
   ERP — Stocks: 72 · Ajustamento em valor (18 nov. 2026). Ela mostrou a janela do ERP antigo «Documentos de Stock -
   Ajustamentos em Valor» (Número, Data de Emissão, Observações, Valor Total; Novo F5, Editar F6, Apagar F8, Filtrar F3,
   Refrescar F9, Linhas F10, Actualizar (F11)) e pediu «quero tudo parecido». O mesmo motor e desenho do 70 e do 71:
     - um ajustamento muda o CUSTO dos artigos, sem mexer nas quantidades; o valor total é a diferença no valor do stock
       (stock × (custo novo − custo atual)), e pode ser negativo, como no antigo (−0,02);
     - a ficha mostra, por linha, o stock, o custo atual e a diferença enquanto se escreve o custo novo;
     - Lançar (Ctrl+F2, o «Actualizar» do antigo) guarda o custo e o stock de então e o custo novo passa a ser o do
       artigo (as transferências passam a valorizar com ele); Anular (F8) volta ao custo anterior, se nenhum ajuste
       posterior o mudou.
   Regras em stocks/dominio.ts.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { registar, paginaDoc, BTN, L, esc, type CfgDoc, type Doc, type EstDoc, type Ficha } from '../compras/docs-v2';
import { toast, dialogo, fecharDialogo, tudo, ativoDe, quieto, nf } from '../compras/docs-v2-comportamento';
import { ajustamentos, ajustamento, linhaAj, valorAj, porqueLancarAj, podeInv, criarAj, guardarAj, lancarAj, anularAj, custoDe, stockTotal, artigo, ARTIGOS, HOJE, Recusa } from './dominio';
import { euros, dia, lerEuros } from '../compras/dominio';
import { PERFIS } from '../inicio-dados';
import scale from 'lucide-static/icons/scale.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import paperclip from 'lucide-static/icons/paperclip.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import loader from 'lucide-static/icons/loader.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import save from 'lucide-static/icons/save.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import arrowDownToLine from 'lucide-static/icons/arrow-down-to-line.svg?raw';

const pessoa = (p: string) => PERFIS[p as keyof typeof PERFIS]?.pessoa ?? p;
const sinal = (c: number) => (c > 0 ? '+' : '') + euros(c);
function linhas(e: EstDoc): Doc[] {
  return ajustamentos().map((d): Doc => {
    const anulado = d.estado === 'Anulado' || e.extra.anuladoSim === d.ref;
    const lancado = !anulado && (d.estado === 'Lançado' || e.extra.lancadoSim === d.ref);
    return { id: d.ref, ref: d.ref, numero: d.ref, n: d.ref.split(' ')[1] ?? d.ref, serie: d.ref.split('/')[0], data: d.data, notas: d.notas, artigos: d.linhas.length,
      refs: d.linhas.map((l) => l.ref).join(', '), valor: valorAj(d), estado: anulado ? 'Anulado' : lancado ? 'Lançado' : d.estado, anulado, lancado, uIns: pessoa(d.criador), uAlt: pessoa(d.alterado), moeda: 'EUR', forn: '' };
  });
}
const doc = (d: Doc) => ajustamento(String(d.ref))!;

const COLS: CfgDoc['cols'] = [
  { k: 'numero', t: 'Número', tipo: 'mono', w: 130, presa: true, antiga: true },
  { k: 'data', t: 'Data de emissão', tipo: 'data', w: 120, antiga: true },
  { k: 'notas', t: 'Observações', tipo: 'txt', w: 280, antiga: true },
  { k: 'refs', t: 'Artigos', tipo: 'txt', w: 220 },
  { k: 'valor', t: 'Valor total', tipo: 'eur', w: 130, antiga: true },
  { k: 'estado', t: 'Estado', tipo: 'estado', w: 130 },
  { k: 'uIns', t: 'Utilizador de inserção', tipo: 'txt', w: 160 },
  { k: 'uAlt', t: 'Utilizador de alteração', tipo: 'txt', w: 160 },
];
const badge = (cls: string, ic: string, t: string, title = '') => `<span class="lf2-b ${cls}"${title ? ` title="${esc(title)}"` : ''}>${L(ic)}${t}</span>`;
function celula(d: Doc, k: string): string {
  switch (k) {
    case 'numero': return `<span class="lf2-art"><b>${esc(String(d.numero))}</b></span>`;
    case 'data': return dia(String(d.data));
    case 'refs': return `<span class="is-mono">${esc(String(d.refs))}</span>`;
    case 'valor': return sinal(d.valor as number);
    case 'estado': return `<span class="lf2-badges">${d.anulado ? badge('lf2-b--rutura', ban, 'Anulado') : d.lancado ? badge('lf2-b--pend', circleCheck, 'Lançado') : badge('lf2-b--enc', clock, 'Rascunho', 'O custo ainda não mudou')}</span>`;
    default: return esc(String(d[k] ?? '')) || '<span class="is-nada">—</span>';
  }
}
const valor = (d: Doc, k: string): string | number => (d[k] as string | number) ?? '';
const editavel = (e: EstDoc, d: Doc | undefined) => !!d && !d.anulado && !d.lancado && podeInv(e.perfil, 'editar');
const porqueLancar_ = (e: EstDoc, d: Doc | undefined) => d?.anulado ? 'O ajustamento está anulado.' : d?.lancado ? `Já foi lançado${doc(d).lancado ? ` a ${doc(d).lancado}` : ''}.` : porqueLancarAj(e.perfil, d ? doc(d) : undefined);

const dd = (t: string, v: string, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${t}</dt><dd>${v}</dd></div>`;
function painel(e: EstDoc, d: Doc | undefined, tab: string): string {
  if (!d) return '';
  const x = doc(d), v = valorAj(x);
  if (tab === '_alvo') return `<b>${esc(x.ref)}</b><span>${esc(x.notas)} · ${nf(x.linhas.length)} ${x.linhas.length === 1 ? 'artigo' : 'artigos'} · ${sinal(v)}</span>`;
  if (tab === 'detalhes') {
    const t = porqueLancar_(e, d);
    return `${e.recusa ? `<p class="lf2-recusa" role="alert">${L(circleAlert)}${esc(e.recusa)}</p>` : ''}
      <div class="dv2-estado-faixa ${d.anulado ? 'is-anulado' : d.lancado ? 'is-ok' : t ? 'is-espera' : 'is-pronto'}">${d.anulado ? `${L(ban)}<span><b>Anulado${x.anulado ? ` a ${esc(x.anulado.quando)}` : ''}.</b> ${esc(x.anulado?.motivo ?? '')} O custo voltou ao anterior.</span>` : d.lancado ? `${L(circleCheck)}<span><b>Lançado a ${esc(x.lancado ?? 'hoje')}.</b> O custo novo é o dos artigos; as quantidades não mudaram. Para corrigir, anula-se (F8).</span>` : t ? `${L(clock)}<span><b>Rascunho.</b> ${esc(t)}</span>` : `${L(arrowDownToLine)}<span><b>Pronto a lançar.</b> Ctrl+F2 muda o custo de ${nf(x.linhas.length)} ${x.linhas.length === 1 ? 'artigo' : 'artigos'}: ${sinal(v)} no valor do stock.</span>`}</div>
      <dl class="lf2-dl dv2-dl">${dd('Número', `<b class="is-mono">${esc(x.ref)}</b>`)}${dd('Data de emissão', dia(x.data))}${dd('Artigos', nf(x.linhas.length))}${dd('Moeda', 'EUR · euro')}
        ${dd('Observações', esc(x.notas) || '<span class="is-nada">—</span>', 'is-largo')}
        ${dd('Valor total', `<b>${sinal(v)}</b><small>Stock × (custo novo − custo ${d.lancado || d.anulado ? 'de então' : 'atual'})</small>`)}${dd('Estado', esc(String(d.estado)))}
        ${dd('Inserido por', esc(String(d.uIns)))}${dd('Alterado por', `${esc(String(d.uAlt))}<small>${esc(x.historico[x.historico.length - 1]?.quando ?? '')}</small>`)}</dl>
      <details class="dv2-hist"><summary>Histórico do ajustamento (${x.historico.length})</summary><ol>${x.historico.slice().reverse().map((h) => `<li><time>${esc(h.quando)}</time><b>${esc(h.acao)}</b>${h.detalhe ? ` · ${esc(h.detalhe)}` : ''}<small>${esc(h.quem)}</small></li>`).join('')}</ol></details>`;
  }
  if (tab === 'linhas') {
    const quando = d.lancado || d.anulado ? 'de então' : 'atual';
    return `<table class="lf2-mini dv2-linhas-t"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">Stock</th><th class="is-num">Custo ${quando}</th><th class="is-num">Custo novo</th><th class="is-num">Diferença</th></tr></thead><tbody>${x.linhas.map((l) => { const a = artigo(l.ref), c = linhaAj(x, l);
      return `<tr><td class="is-mono">${esc(l.ref)}</td><td>${esc(a?.desc ?? '')}</td><td class="is-num">${nf(c.qtd)}</td><td class="is-num">${euros(c.atual)}</td><td class="is-num"><b>${euros(l.novo)}</b></td><td class="is-num"><b>${sinal(c.dif)}</b></td></tr>`; }).join('')}</tbody>
      <tfoot><tr class="is-total"><td colspan="5">Valor total</td><td class="is-num"><b>${sinal(v)}</b></td></tr></tfoot></table>
      <p class="lf2-nota">${d.lancado || d.anulado ? 'O stock e o custo são os do lançamento.' : 'O stock é o de todos os armazéns, hoje; o custo atual é o do último ajuste lançado (ou o último preço do fornecedor).'}</p>`;
  }
  return '';
}

const campo = (k: string, t: string, input: string, cls = '') => `<label class="ak-campo${cls ? ` ${cls}` : ''}" for="dv2-ff-${k}"><span>${t}</span>${input}</label>`;
const datalist = `<datalist id="aj-artigos">${ARTIGOS.map((a) => `<option value="${esc(a.ref)}">${esc(a.desc)} · ${esc(a.marca)}</option>`).join('')}</datalist>`;
const virgula = (c: number) => (c / 100).toFixed(2).replace('.', ',');
function linhaFicha(i: number, ref = '', novo = '', dis = false): string {
  const a = artigo(ref);
  return `<tr data-dv2-linha="${i}"><td><input type="text" list="aj-artigos" value="${esc(ref)}" data-dv2-ff="art-${i}" data-dv2-l="ref" aria-label="Artigo da linha ${i + 1}" placeholder="Referência"${dis ? ' disabled' : ''}></td><td data-dv2-l-desc>${esc(a?.desc ?? '')}</td><td class="is-num" data-dv2-l-stock>—</td><td class="is-num" data-dv2-l-atual>—</td><td><input type="text" inputmode="decimal" class="is-num" value="${esc(novo)}" data-dv2-ff="nov-${i}" data-dv2-l="novo" aria-label="Custo novo da linha ${i + 1}" placeholder="0,00"${dis ? ' disabled' : ''}></td><td class="is-num" data-dv2-l-dif>—</td><td>${dis ? '' : `<button type="button" class="dv2-x" data-dv2-acao="del-linha" aria-label="Tirar a linha ${i + 1}">${L(trash)}</button>`}</td></tr>`;
}
function ficha(e: EstDoc, f: Ficha, d: Doc | undefined): string {
  const x = d ? doc(d) : undefined, ver = f.modo === 'editar' && !editavel(e, d), dis = ver ? ' disabled' : '';
  const titulo = f.modo === 'criar' ? 'Novo ajustamento em valor' : `${x!.ref} · ${x!.notas}`;
  const cab = `<header class="dv2-ficha-cab"><span class="dv2-ficha-ic">${L(scale)}</span><div><small>${f.modo === 'criar' ? 'Criação' : ver ? 'Visualização' : 'Edição'}</small><h2>${esc(titulo)}</h2></div>
    <div class="dv2-ficha-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="fechar-ficha">${L(arrowLeft)}<span>${ver ? 'Voltar à lista' : 'Cancelar'}</span><kbd>Esc</kbd></button>${ver ? '' : `<button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="gravar">${L(save)}<span>Gravar</span><kbd>Ctrl Enter</kbd></button>`}</div></header>
    <p class="lf2-recusa" data-dv2-ficha-erro role="alert" hidden></p>`;
  const pe = ver ? (d!.anulado ? 'O ajustamento está anulado: só se vê.' : `Lançado a ${esc(x!.lancado ?? '')}: já não se altera. Para corrigir, anula-se (F8) e faz-se outro.`)
    : f.modo === 'criar' ? 'Muda o custo dos artigos sem mexer nas quantidades. Nasce em rascunho; o custo só muda ao lançar (Ctrl+F2).' : 'Rascunho: os artigos e os custos novos alteram-se; o custo dos artigos só muda ao lançar.';
  const ls = x?.linhas ?? [];
  return `<div class="dv2-ficha-c">${cab}<p class="dv2-ficha-modo">${pe}</p>
    <input type="hidden" data-dv2-ff-versao value="${x?.versao ?? 0}">
    <div class="dv2-ficha-g">
      ${campo('serie', 'Série', '<select id="dv2-ff-serie" disabled><option>AV 2026</option></select>')}
      ${campo('numero', 'Número', `<input type="text" id="dv2-ff-numero" value="${esc(x?.ref ?? 'Atribuído ao gravar')}" readonly>`)}
      ${campo('data', 'Data de emissão', `<input type="date" id="dv2-ff-data" value="${x?.data ?? HOJE}" max="${HOJE}" data-dv2-ff="data"${dis}>`)}
      ${campo('notas', 'Observações', `<input type="text" id="dv2-ff-notas" value="${esc(x?.notas ?? '')}" placeholder="Ex.: Acerto de referência" data-dv2-ff="notas"${dis}>`, 'is-largo')}
    </div>
    <h3 class="dv2-h3">Artigos</h3>${datalist}
    <div class="dv2-linhas-rolo"><table class="lf2-mini dv2-linhas-ed"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">Stock</th><th class="is-num">Custo atual</th><th class="is-num">Custo novo (€)</th><th class="is-num">Diferença</th><th><span class="sr">Tirar</span></th></tr></thead>
      <tbody data-dv2-linhas>${(ls.length ? ls : [{ id: 'a', ref: '', novo: -1 }]).map((l, i) => linhaFicha(i, l.ref, l.novo >= 0 ? virgula(l.novo) : '', ver)).join('')}</tbody>
      <tfoot><tr class="is-total"><td colspan="5">Valor total</td><td class="is-num" data-dv2-r-total>—</td><td></td></tr></tfoot></table></div>
    ${ver ? '' : `<button type="button" class="ak-btn ak-btn--linha dv2-mais-linha" data-dv2-acao="add-linha">${L(plus)}<span>Juntar artigo</span></button>`}
    <p class="dv2-ficha-dica">Enter passa ao campo seguinte; no último, vai a Gravar. Custos com vírgula (ex.: 4,12). Ctrl+Enter grava; Esc fecha (com alterações, pergunta).</p></div>`;
}
function lerFicha(r: HTMLElement) {
  const v = (k: string) => r.querySelector<HTMLInputElement>(`[data-dv2-ficha] [data-dv2-ff="${k}"]`)?.value.trim() ?? '';
  const linhas = [...r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas] tr')].map((tr) => {
    const g = (k: string) => tr.querySelector<HTMLInputElement>(`[data-dv2-l="${k}"]`)!.value.trim(), n = g('novo');
    return { ref: g('ref'), novo: n ? lerEuros(n) ?? NaN : NaN, txt: n };
  }).filter((l) => l.ref || l.txt).map(({ ref, novo }) => ({ ref, novo }));
  return { data: v('data'), notas: v('notas'), versao: Number(r.querySelector<HTMLInputElement>('[data-dv2-ficha] [data-dv2-ff-versao]')?.value ?? 0), linhas };
}
function gravar(r: HTMLElement, e: EstDoc, f: Ficha): { ref: string; msg: string } {
  const x = lerFicha(r), pedido = { data: x.data, notas: x.notas, linhas: x.linhas };
  if (f.modo === 'criar') { const d = criarAj(e.perfil, pedido); return { ref: d.ref, msg: `${d.ref} criado em rascunho: o custo só muda ao lançar.` }; }
  const d = ativoDe(r, e); if (!d) throw new Recusa('O ajustamento já não está na lista.');
  const g = guardarAj(e.perfil, String(d.ref), pedido, x.versao);
  return { ref: g.ref, msg: `${g.ref} gravado: ${sinal(valorAj(g))} no valor do stock, ao lançar.` };
}
function recalcular(r: HTMLElement): void {
  let t = 0;
  r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas] tr').forEach((tr) => {
    const ref = tr.querySelector<HTMLInputElement>('[data-dv2-l="ref"]')!.value.trim(), a = artigo(ref), novo = lerEuros(tr.querySelector<HTMLInputElement>('[data-dv2-l="novo"]')!.value.trim());
    const q = a ? stockTotal(ref) : null, c = a ? custoDe(ref) : null, dif = a && novo !== null ? q! * (novo - c!) : null;
    tr.querySelector<HTMLElement>('[data-dv2-l-stock]')!.textContent = q === null ? '—' : nf(q);
    tr.querySelector<HTMLElement>('[data-dv2-l-atual]')!.textContent = c === null ? '—' : euros(c);
    tr.querySelector<HTMLElement>('[data-dv2-l-dif]')!.textContent = dif === null ? '—' : sinal(dif);
    if (dif !== null) t += dif;
  });
  const rt = r.querySelector<HTMLElement>('[data-dv2-r-total]'); if (rt) rt.textContent = sinal(t);
}

function dlgLancar(r: HTMLElement, e: EstDoc, erro = ''): void {
  const d = ativoDe(r, e); if (!d) return;
  const porque = porqueLancar_(e, d); if (porque && !erro) { toast(r, porque); return; }
  const x = doc(d);
  dialogo(r, `<h2 id="dv2-dlg-t">${L(arrowDownToLine)}Lançar o ajustamento</h2><p class="lf2-dlg-sub"><b class="is-mono">${esc(x.ref)}</b> · ${esc(x.notas)} · emitido a ${dia(x.data)}</p>
    <table class="lf2-mini"><thead><tr><th>Artigo</th><th class="is-num">Stock</th><th class="is-num">Custo</th><th class="is-num">Passa a</th><th class="is-num">Diferença</th></tr></thead><tbody>${x.linhas.map((l) => { const c = linhaAj(x, l); return `<tr><td class="is-mono">${esc(l.ref)}</td><td class="is-num">${nf(c.qtd)}</td><td class="is-num">${euros(c.atual)}</td><td class="is-num"><b>${euros(l.novo)}</b></td><td class="is-num">${sinal(c.dif)}</td></tr>`; }).join('')}</tbody><tfoot><tr class="is-total"><td colspan="4">Valor do stock</td><td class="is-num"><b>${sinal(valorAj(x))}</b></td></tr></tfoot></table>
    <ul class="dv2-regras"><li>O custo novo passa a ser o dos artigos, <b>todos ou nenhum</b>; as quantidades não mudam.</li><li>Fica guardado o custo e o stock de agora, para se poder anular (F8) e voltar ao custo anterior.</li></ul>
    ${erro ? `<p class="lf2-recusa" role="alert">${L(circleAlert)}${esc(erro)}</p>` : ''}
    <div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar>${L(xIc)}<span>Cancelar</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="lancar-sim" data-dv2-primeiro>${L(arrowDownToLine)}<span>Lançar</span><kbd>Ctrl Enter</kbd></button></div>`);
}
async function lancar(r: HTMLElement, e: EstDoc, b: HTMLElement): Promise<void> {
  const d = ativoDe(r, e); if (!d || e.ocupado) return;
  e.ocupado = 'lancar'; e.extra.ocupadoTexto = 'A lançar…';
  b.classList.add('is-carregar'); b.setAttribute('aria-disabled', 'true'); b.querySelector('span')!.textContent = 'A lançar…';
  r.querySelector<HTMLElement>('[data-dv2-dlg-fechar]')?.setAttribute('disabled', '');
  await new Promise((ok) => requestAnimationFrame(() => ok(null)));
  try {
    const x = lancarAj(e.perfil, String(d.ref));
    e.ocupado = ''; fecharDialogo(r); e.tab = 'detalhes'; tudo(r, e, true);
    const cel = r.querySelector<HTMLElement>(`tr[data-dv2-id="${CSS.escape(d.id)}"] td[data-col="estado"]`);
    if (cel && !quieto()) cel.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: .6 }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    toast(r, `${x.ref} lançado: ${sinal(valorAj(x))} no valor do stock.`);
  } catch (x) {
    e.ocupado = ''; dlgLancar(r, e, x instanceof Recusa ? x.message : 'O servidor não confirmou o lançamento. Nada se repete sozinho: atualiza a lista (F9) antes de tentar outra vez.');
  }
}

const CFG = registar({
  k: 'ajv', titulo: 'Ajustamentos em Valor', sub: 'Documentos de stock que mudam o custo dos artigos sem mexer nas quantidades.', icone: scale, um: 'ajustamento', o: 'o',
  caminho: [['ERP', 'inicio'], ['Stocks', 'stocks'], ['Ajustamento em valor', '']],
  cols: COLS, verIniciais: ['numero', 'data', 'notas', 'refs', 'valor', 'estado'], ajustar: true,
  campos: { numero: 'n', data: 'data', codigo: 'refs', descricao: 'notas' },
  rotuloForn: 'Utilizador', phCodigo: 'Artigo, ex.: BKR6E',
  linhas, series: () => [...new Set(ajustamentos().map((d) => d.ref.split('/')[0]))], serieDe: (d) => String(d.serie), fornDe: (d) => String(d.uIns), dataDe: (d) => String(d.data), moedaDe: (d) => String(d.moeda),
  estados: [['', 'Todos'], ['rasc', 'Rascunhos'], ['lanc', 'Lançados'], ['anul', 'Anulados']],
  estadoPassa: (d, v) => v === 'rasc' ? !d.lancado && !d.anulado : v === 'lanc' ? !!d.lancado : v === 'anul' ? !!d.anulado : true,
  celula, valor,
  resumo: (ls) => { const l = ls.filter((d) => d.lancado), a = ls.filter((d) => d.anulado).length, v = l.reduce((s, d) => s + (d.valor as number), 0); const pl = (n: number, um: string, vv: string) => `<span><b>${nf(n)}</b> ${n === 1 ? um : vv}</span>`; return ls.length ? `${pl(ls.length - l.length - a, 'rascunho', 'rascunhos')}${pl(l.length, 'lançado', 'lançados')}${pl(a, 'anulado', 'anulados')}<span><b>${sinal(v)}</b> no valor do stock</span>` : ''; },
  barra: BTN('lancar', arrowDownToLine, 'Lançar', 'Ctrl+F2', '', 'ak-btn--acao'), teclasExtra: '',
  janelas: { titulo: 'Ajustamento em valor', icone: scale, estados: ['ja-lancado', 'anulado', 'gravado', 'lancado'] },
  tabs: [{ k: 'detalhes', t: 'Detalhes', ic: info }, { k: 'linhas', t: 'Linhas', ic: list }, { k: 'anexos', t: 'Anexos', ic: paperclip }],
  painel, ficha, gravar,
  porque: {
    novo: (e) => podeInv(e.perfil, 'criar') ? '' : 'O teu perfil só consulta os documentos de stock.',
    editar: (e, d) => !d ? 'Escolhe um ajustamento na lista.' : !podeInv(e.perfil, 'editar') ? 'O teu perfil só consulta os documentos de stock.' : editavel(e, d) ? '' : d.anulado ? 'O ajustamento está anulado: só se vê (Enter).' : 'Já foi lançado: não se altera; anula-se (F8) e faz-se outro. Enter abre-o para ver.',
    anular: (e, d) => !d ? 'Escolhe um ajustamento na lista.' : !podeInv(e.perfil, 'anular') ? 'O teu perfil não anula documentos de stock.' : d.anulado ? 'Já está anulado.' : '',
  },
  anular: {
    texto: (d) => { const x = doc(d); return [`Anular o ${x.ref}?`, x.estado === 'Lançado' ? `Já está lançado: <b>o custo de ${x.linhas.map((l) => esc(l.ref)).join(', ')} volta ao anterior</b> (se nenhum ajuste posterior o mudou). Nada se apaga: fica no histórico, anulado.` : 'É um rascunho: o custo nunca mudou. Nada se apaga: fica no histórico, anulado.']; },
    fazer: (e, d, motivo) => { const x = anularAj(e.perfil, String(d.ref), motivo); return `${x.ref} anulado${x.lancado ? ': o custo voltou ao anterior' : ''}. Fica no histórico.`; },
  },
  docAnexo: (d) => d.id,
  teclas: [{ tecla: 'Ctrl+F2', acao: 'lancar' }],
  acao(r, e, k, b) {
    if (k === '_barra') { const t = porqueLancar_(e, ativoDe(r, e)), x = r.querySelector<HTMLElement>('.dv2-barra [data-dv2-acao="lancar"]'); if (x && !e.ocupado) { x.setAttribute('aria-disabled', String(!!t)); x.title = t || 'Lançar (Ctrl+F2)'; } return true; }
    if (k === '_ficha-aberta') { recalcular(r); return true; }
    if (k === '_ficha-input') { const i = b as HTMLInputElement; if (i.dataset.dv2L === 'ref') { const tr = i.closest('tr')!, a = artigo(i.value.trim()); tr.querySelector('[data-dv2-l-desc]')!.textContent = a?.desc ?? ''; } recalcular(r); return true; }
    if (k === 'lancar') { dlgLancar(r, e); return true; }
    if (k === 'lancar-sim') { void lancar(r, e, b); return true; }
    if (k === 'add-linha') { const tb = r.querySelector<HTMLElement>('[data-dv2-linhas]')!, i = tb.children.length; tb.insertAdjacentHTML('beforeend', linhaFicha(i)); const tr = tb.lastElementChild as HTMLElement; if (!quieto()) tr.animate([{ opacity: 0, transform: 'scaleY(.4)', transformOrigin: 'top' }, { opacity: 1, transform: 'none', transformOrigin: 'top' }], { duration: 180, easing: 'ease-out' }); tr.querySelector<HTMLElement>('input')?.focus(); if (e.ficha) e.ficha.sujo = true; return true; }
    if (k === 'del-linha') { const tr = b.closest('tr'), tb = tr?.parentElement; if (tr && tb && tb.children.length > 1) { tr.remove(); recalcular(r); if (e.ficha) e.ficha.sujo = true; (tb.querySelector('input') as HTMLElement | null)?.focus(); } else toast(r, 'O ajustamento precisa de pelo menos um artigo.'); return true; }
    return false;
  },
  cenario(r, e, cen) {
    const ls = linhas(e), rasc = ls.find((d) => !d.lancado && !d.anulado), lanc = ls.find((d) => d.lancado);
    if (['lancar', 'a-lancar', 'lancar-falhou', 'editar'].includes(cen) && rasc) e.ativo = rasc.id;
    if (cen === 'lancado' && rasc) { e.ativo = rasc.id; e.extra.lancadoSim = rasc.id; }
    if (cen === 'ja-lancado' && lanc) { e.ativo = lanc.id; e.recusa = porqueLancar_(e, lanc); }
    if (cen === 'anular-lancado' && lanc) e.ativo = lanc.id;
    if (cen === 'anulado' && rasc) { e.extra.anuladoSim = rasc.id; e.ativo = rasc.id; e.aviso = `${rasc.ref} anulado: «O fornecedor corrigiu a fatura». Fica no histórico.`; }
    if (cen === 'gravado' && ls[0]) e.ativo = ls[0].id;
    requestAnimationFrame(() => {
      if (cen === 'lancar' || cen === 'a-lancar' || cen === 'lancar-falhou') dlgLancar(r, e, cen === 'lancar-falhou' ? 'O servidor não confirmou o lançamento (ERP-STK-504). Nada se repete sozinho: atualiza a lista (F9) antes de tentar outra vez.' : '');
      if (cen === 'a-lancar') { const b = r.querySelector<HTMLElement>('[data-dv2-acao="lancar-sim"]'); if (b) { b.classList.add('is-carregar'); b.setAttribute('aria-disabled', 'true'); b.innerHTML = `${L(loader)}<span>A lançar…</span>`; } }
      if (cen === 'lancado' && rasc) { e.aviso = `${rasc.ref} lançado: ${sinal(rasc.valor as number)} no valor do stock.`; tudo(r, e); }
      if (cen === 'anular-lancado') { const t = CFG.anular.texto(ativoDe(r, e)!); dialogo(r, `<h2 id="dv2-dlg-t" class="is-perigo">${L(ban)}${esc(t[0])}</h2><p>${t[1]}</p><label class="ak-campo dv2-motivo" for="dv2-motivo"><span>Motivo (obrigatório)</span><textarea id="dv2-motivo" rows="3" maxlength="300" data-dv2-motivo data-dv2-primeiro placeholder="Porque se anula — fica no histórico"></textarea></label><p class="ak-erro-campo" data-dv2-dlg-erro role="alert" hidden></p><div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar>${L(xIc)}<span>Manter</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--perigo" data-dv2-acao="anular-sim">${L(ban)}<span>Anular</span></button></div>`); }
    });
  },
  dica: 'Período e moeda juntam-se à pesquisa. Enter passa ao campo seguinte.',
});

const NOTA = 'Ajustamento em valor (18 nov., da janela «Documentos de Stock - Ajustamentos em Valor» do ERP antigo): as colunas do antigo (Número, Data de emissão, Observações, Valor total) mais os artigos e o estado; o valor total é a diferença no valor do stock e pode ser negativo; a ficha mostra o stock, o custo atual e a diferença por linha; Lançar (Ctrl+F2, o «Actualizar (F11)» do antigo) muda o custo dos artigos; Anular (F8) volta ao anterior.';
export const ESTADOS_AJV: [string, string, string][] = [
  ['carregar', '72.11 · A carregar', 'A lista em esqueleto; a pesquisa e os filtros já servem.'],
  ['vazia', '72.12 · Sem ajustamentos', 'Ainda não há ajustamentos: Novo (F5).'],
  ['sem-resultados', '72.13 · Pesquisa sem resultados', 'Diz em que modo se procurou e como se compara; oferece Contendo e Limpar.'],
  ['criar', '72.14 · Novo ajustamento', 'Novo (F5) abre a ficha numa janela: data, observações e, por artigo, o custo novo; a diferença calcula-se enquanto se escreve.'],
  ['editar', '72.15 · Editar o rascunho', 'Só o rascunho se altera.'],
  ['por-gravar', '72.16 · Alterações por gravar', 'Fechar a ficha com alterações: continuar a editar ou descartar.'],
  ['a-gravar', '72.17 · A gravar', 'O botão espera; nada se diz antes de as regras aceitarem.'],
  ['gravado', '72.18 · Gravado', 'A ficha fecha, a linha acende e a barra de estado diz o que se gravou.'],
  ['gravar-falhou', '72.19 · Gravar falhou', 'O servidor não respondeu: as alterações ficam na ficha.'],
  ['lancar', '72.20 · Lançar (Ctrl+F2)', 'O custo de cada artigo, para quanto passa e a diferença no valor do stock.'],
  ['a-lancar', '72.21 · A lançar', 'O botão espera e o Cancelar desliga-se: não há lançamentos repetidos.'],
  ['lancado', '72.22 · Lançado', 'O estado acende «Lançado»; o custo novo é o dos artigos.'],
  ['ja-lancado', '72.23 · Já lançado', 'Ctrl+F2 num lançado diz quando foi e como se corrige.'],
  ['lancar-falhou', '72.24 · O lançamento falhou', 'Sem confirmação: nada se repete sozinho; atualizar antes de tentar outra vez.'],
  ['anular', '72.25 · Anular (F8)', 'No lugar do «Apagar» do antigo: nada se apaga, pede o motivo.'],
  ['anular-lancado', '72.26 · Anular um lançado', 'O custo volta ao anterior, se nenhum ajuste posterior o mudou.'],
  ['anulado', '72.27 · Anulado', 'O ajustamento fica, com «Anulado»; não se lança nem se altera.'],
  ['anexos', '72.28 · Anexos', 'Faturas e notas de crédito que justificam o ajuste.'],
  ['imprimir', '72.29 · Imprimir (F11)', 'Imprime-se só a lista, com as colunas à vista.'],
  ['permissao', '72.30 · Sem permissão', 'O perfil só consulta: as ações dizem porquê.'],
  ['sessao', '72.31 · Sessão terminada', 'Voltar a entrar pelo login comum; o que estava escrito fica.'],
  ['offline', '72.32 · Sem ligação', 'Sem rede: a pesquisa e os filtros ficam.'],
  ['servidor', '72.33 · Servidor indisponível', 'O servidor dos stocks não respondeu: Tentar outra vez.'],
  ['restaurada', '72.34 · Área de trabalho reposta', 'Ao voltar: a pesquisa, os filtros e o ajustamento escolhido como estavam.'],
  ['janela', '72.35 · Ajustamento numa janela', 'Tocar num ajustamento abre-o numa janela: Detalhes, Linhas e Anexos; a lista fica à vista.'],
  ['janelas', '72.36 · Várias janelas', 'Vários ajustamentos abertos em cascata; a da frente é a última tocada.'],
  ['maximizada', '72.37 · Janela maximizada', 'Duplo clique no cabeçalho (ou o botão) enche o ecrã; outra vez, volta ao tamanho que tinha.'],
  ['editar-sujo', '72.38 · A editar, com alterações', 'O ● no título diz que há alterações por gravar; fechar pergunta.'],
];
const utilizadores = (): [string, string][] => [...new Set(ajustamentos().map((d) => pessoa(d.criador)))].map((p) => [p, p] as [string, string]);
export function versaoAjustamentos(cen = 'normal') { return { id: 'v1', nota: NOTA, html: paginaDoc(CFG, cen, utilizadores()) }; }
export type IdAjv = 'stocks-ajuste-valor' | `ajv-${string}`;
export function ecrasAjustamentos(): Ecra<IdErp>[] {
  return [
    { id: 'stocks-ajuste-valor', nome: '72 · Ajustamento em valor', fluxo: 'Stocks', objetivo: 'Mudar o custo dos artigos sem mexer nas quantidades: o rascunho, Lançar (Ctrl+F2) e Anular (F8), que volta ao custo anterior.', versoes: [versaoAjustamentos()] as Ecra<IdErp>['versoes'] },
    ...ESTADOS_AJV.map(([cen, nome, objetivo]) => ({ id: `ajv-${cen}` as IdErp, nome, fluxo: 'Stocks', estadoDe: 'stocks-ajuste-valor' as IdErp, objetivo, versoes: [versaoAjustamentos(cen)] as Ecra<IdErp>['versoes'] })),
  ];
}
