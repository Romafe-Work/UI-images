/* =========================================================
   ERP — Stocks: 70 · Inventário inicial (18 nov. 2026), o primeiro ecrã de Stocks. Ela mostrou o menu Stocks do ERP
   antigo e a janela «Documentos de Stock» do Inventário Inicial (Número, Data, Valor Total; Data de Emissão e
   Observações; <F2> Actualizar, F7 Guardar, Esc Cancelar) e pediu «mantém a consistência» com o que se fez nas Compras.
   Por isso é o mesmo motor das listas de documentos (compras/docs-v2.ts), com o cabeçalho das Faturas, a barra da casa
   (Novo F5 · Editar F6 · Anular F8 · Atualizar F9 · Imprimir F11), a Série (F4), Pesquisar por Número/Data/Código/
   Descrição (F1 F2 F10 F12) e cada documento numa janela flutuante, como nas Guias e nos Orçamentos:
     - o «Código» é o do armazém (60, 10, 20) e o filtro do lado é o Armazém;
     - o «<F2> Actualizar» do antigo é Lançar no stock (Ctrl+F2, como o Transferir dos Orçamentos: o F2 é a pesquisa
       por data); o F7 Guardar do antigo é o Gravar da ficha (Ctrl+Enter);
     - Anular (F8) com o motivo; um lançado anulado tira as quantidades do stock.
   As regras estão em stocks/dominio.ts; o stock é o das compras (compras/dominio.ts), num sítio só.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { registar, paginaDoc, BTN, L, esc, type CfgDoc, type Doc, type EstDoc, type Ficha } from '../compras/docs-v2';
import { toast, dialogo, fecharDialogo, tudo, ativoDe, quieto, nf } from '../compras/docs-v2-comportamento';
import { inventarios, inventario, valorTotal, valorLinha, quantidade, porqueLancar, podeInv, criarInv, guardarInv, lancarInv, anularInv, ARMAZENS, armazemDe, artigo, ARTIGOS, stockEm, HOJE, Recusa, type DocInv } from './dominio';
import { euros, dia, lerEuros } from '../compras/dominio';
import { PERFIS } from '../inicio-dados';
import packagePlus from 'lucide-static/icons/package-plus.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import boxes from 'lucide-static/icons/boxes.svg?raw';
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

/* ---------- as linhas: um documento de inventário inicial por linha ---------- */
const pessoa = (p: string) => PERFIS[p as keyof typeof PERFIS]?.pessoa ?? p;
function linhas(e: EstDoc): Doc[] {
  return inventarios().map((d): Doc => {
    const anulado = d.estado === 'Anulado' || e.extra.anuladoSim === d.ref;
    /* no estado «Lançado» do editor, o rascunho mostra-se como lançado sem gravar nada */
    const lancado = !anulado && (d.estado === 'Lançado' || e.extra.lancadoSim === d.ref);
    return { id: d.ref, ref: d.ref, numero: d.ref, n: d.ref.split(' ')[1] ?? d.ref, serie: d.ref.split('/')[0], data: d.data, armazem: d.armazem, armazemNome: armazemDe(d.armazem),
      notas: d.notas, artigos: d.linhas.length, qtd: quantidade(d), valor: valorTotal(d), estado: anulado ? 'Anulado' : lancado ? 'Lançado' : d.estado, anulado, lancado,
      uIns: pessoa(d.criador), uAlt: pessoa(d.alterado), moeda: 'EUR' };
  });
}
const doc = (d: Doc) => inventario(String(d.ref))!;

/* ---------- a configuração ---------- */
const COLS: CfgDoc['cols'] = [
  { k: 'numero', t: 'Número', tipo: 'mono', w: 130, presa: true, antiga: true },
  { k: 'data', t: 'Data de emissão', tipo: 'data', w: 120, antiga: true },
  { k: 'armazem', t: 'Armazém', tipo: 'mono', w: 90 },
  { k: 'armazemNome', t: 'Nome do armazém', tipo: 'txt', w: 190 },
  { k: 'notas', t: 'Observações', tipo: 'txt', w: 250, antiga: true },
  { k: 'valor', t: 'Valor total', tipo: 'eur', w: 130, antiga: true },
  { k: 'estado', t: 'Estado', tipo: 'estado', w: 130 },
  { k: 'artigos', t: 'Artigos', tipo: 'n', w: 80 },
  { k: 'qtd', t: 'Quantidade', tipo: 'n', w: 100 },
  { k: 'uIns', t: 'Utilizador de inserção', tipo: 'txt', w: 160 },
  { k: 'uAlt', t: 'Utilizador de alteração', tipo: 'txt', w: 160 },
];
const badge = (cls: string, ic: string, t: string, title = '') => `<span class="lf2-b ${cls}"${title ? ` title="${esc(title)}"` : ''}>${L(ic)}${t}</span>`;
function celula(d: Doc, k: string): string {
  switch (k) {
    case 'numero': return `<span class="lf2-art"><b>${esc(String(d.numero))}</b></span>`;
    case 'data': return dia(String(d.data));
    case 'artigos': case 'qtd': return nf(d[k] as number);
    case 'valor': return euros(d.valor as number);
    case 'estado': return `<span class="lf2-badges">${d.anulado ? badge('lf2-b--rutura', ban, 'Anulado') : d.lancado ? badge('lf2-b--pend', circleCheck, 'Lançado') : badge('lf2-b--enc', clock, 'Rascunho', 'Ainda não entrou no stock')}</span>`;
    default: return esc(String(d[k] ?? '')) || '<span class="is-nada">—</span>';
  }
}
function valor(d: Doc, k: string): string | number { return (d[k] as string | number) ?? ''; }
const editavel = (e: EstDoc, d: Doc | undefined) => !!d && !d.anulado && !d.lancado && podeInv(e.perfil, 'editar');
const porqueLancar_ = (e: EstDoc, d: Doc | undefined) => d?.anulado ? 'O documento está anulado.' : porqueLancar(e.perfil, d ? doc(d) : undefined);

/* ---------- o painel do documento escolhido ---------- */
const dd = (t: string, v: string, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${t}</dt><dd>${v}</dd></div>`;
function painel(e: EstDoc, d: Doc | undefined, tab: string): string {
  if (!d) return '';
  const x = doc(d);
  if (tab === '_alvo') return `<b>${esc(x.ref)}</b><span>${esc(armazemDe(x.armazem))} · ${nf(x.linhas.length)} ${x.linhas.length === 1 ? 'artigo' : 'artigos'} · ${euros(valorTotal(x))}</span>`;
  if (tab === 'detalhes') {
    const t = porqueLancar_(e, d);
    return `${e.recusa ? `<p class="lf2-recusa" role="alert">${L(circleAlert)}${esc(e.recusa)}</p>` : ''}
      <div class="dv2-estado-faixa ${d.anulado ? 'is-anulado' : d.lancado ? 'is-ok' : t ? 'is-espera' : 'is-pronto'}">${d.anulado ? `${L(ban)}<span><b>Anulado${x.anulado ? ` a ${esc(x.anulado.quando)}` : ''}.</b> ${esc(x.anulado?.motivo ?? '')} Fica no histórico; não mexe no stock.</span>` : d.lancado ? `${L(circleCheck)}<span><b>Lançado no stock a ${esc(x.lancado ?? '')}.</b> ${x.base ? 'É o stock de partida do armazém 60.' : `As quantidades entraram no ${esc(armazemDe(x.armazem))}.`} Para corrigir, anula-se (F8) e faz-se outro.</span>` : t ? `${L(clock)}<span><b>Rascunho.</b> ${esc(t)}</span>` : `${L(arrowDownToLine)}<span><b>Pronto a lançar.</b> Ctrl+F2 põe ${nf(quantidade(x))} unidades no stock do ${esc(armazemDe(x.armazem))}.</span>`}</div>
      <dl class="lf2-dl dv2-dl">${dd('Número', `<b class="is-mono">${esc(x.ref)}</b>`)}${dd('Data de emissão', dia(x.data))}${dd('Armazém', `${esc(armazemDe(x.armazem))}<small>Código ${esc(x.armazem)}</small>`)}${dd('Moeda', 'EUR · euro')}
        ${dd('Observações', esc(x.notas) || '<span class="is-nada">—</span>', 'is-largo')}
        ${dd('Artigos', nf(x.linhas.length))}${dd('Quantidade', nf(quantidade(x)))}${dd('Valor total', `<b>${euros(valorTotal(x))}</b><small>Quantidade × custo unitário</small>`)}${dd('Estado', esc(String(d.estado)))}
        ${dd('Inserido por', esc(String(d.uIns)))}${dd('Alterado por', `${esc(String(d.uAlt))}<small>${esc(x.historico[x.historico.length - 1]?.quando ?? '')}</small>`)}</dl>
      <details class="dv2-hist"><summary>Histórico do documento (${x.historico.length})</summary><ol>${x.historico.slice().reverse().map((h) => `<li><time>${esc(h.quando)}</time><b>${esc(h.acao)}</b>${h.detalhe ? ` · ${esc(h.detalhe)}` : ''}<small>${esc(h.quem)}</small></li>`).join('')}</ol></details>`;
  }
  if (tab === 'linhas') return `<table class="lf2-mini dv2-linhas-t"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">Quantidade</th><th>Un.</th><th class="is-num">Custo unitário</th><th class="is-num">Valor</th></tr></thead><tbody>${x.linhas.map((l) => { const a = artigo(l.ref);
      return `<tr><td class="is-mono">${esc(l.ref)}</td><td>${esc(a?.desc ?? '')}</td><td class="is-num">${nf(l.qtd)}</td><td>${esc(a?.un ?? '')}</td><td class="is-num">${euros(l.custo)}</td><td class="is-num"><b>${euros(valorLinha(l))}</b></td></tr>`; }).join('')}</tbody>
      <tfoot><tr class="is-total"><td colspan="2">Total</td><td class="is-num">${nf(quantidade(x))}</td><td></td><td></td><td class="is-num"><b>${euros(valorTotal(x))}</b></td></tr></tfoot></table>`;
  if (tab === 'stock') {
    const nome = armazemDe(x.armazem);
    const linha = (l: DocInv['linhas'][number]) => { const a = artigo(l.ref), agora_ = stockEm(l.ref, nome);
      const depois = d.lancado || d.anulado ? '' : `<td class="is-num"><b>${nf(agora_ + l.qtd)}</b></td>`;
      return `<tr><td class="is-mono">${esc(l.ref)}</td><td>${esc(a?.desc ?? '')}</td><td class="is-num">${nf(l.qtd)}</td><td class="is-num">${nf(agora_)}</td>${depois}</tr>`; };
    return `<p class="lf2-nota">${d.anulado ? `Anulado: ${x.lancado ? 'as quantidades que tinha lançado já saíram do stock' : 'nunca entrou no stock'}.` : d.lancado ? (x.base ? 'Este é o stock de partida do armazém 60: o stock de hoje é ele mais as receções e os outros documentos.' : `Entrou no stock a ${esc(x.lancado ?? '')}; o stock de hoje já o conta.`) : `Ainda não entrou no stock. Ao lançar (Ctrl+F2), cada artigo passa ao valor da última coluna.`}</p>
      <table class="lf2-mini dv2-linhas-t"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">No inventário</th><th class="is-num">Stock hoje · ${esc(x.armazem)}</th>${d.lancado || d.anulado ? '' : '<th class="is-num">Depois de lançar</th>'}</tr></thead><tbody>${x.linhas.map(linha).join('')}</tbody></table>`;
  }
  return '';
}

/* ---------- a ficha ---------- */
const campo = (k: string, t: string, input: string, cls = '') => `<label class="ak-campo${cls ? ` ${cls}` : ''}" for="dv2-ff-${k}"><span>${t}</span>${input}</label>`;
const datalist = `<datalist id="inv-artigos">${ARTIGOS.map((a) => `<option value="${esc(a.ref)}">${esc(a.desc)} · ${esc(a.marca)}</option>`).join('')}</datalist>`;
const virgula = (c: number) => (c / 100).toFixed(2).replace('.', ',');
function linhaFicha(i: number, ref = '', qtd = '', custo = '', dis = false): string {
  const a = artigo(ref);
  return `<tr data-dv2-linha="${i}"><td><input type="text" list="inv-artigos" value="${esc(ref)}" data-dv2-ff="art-${i}" data-dv2-l="ref" aria-label="Artigo da linha ${i + 1}" placeholder="Referência"${dis ? ' disabled' : ''}></td><td data-dv2-l-desc>${esc(a?.desc ?? '')}</td><td><input type="text" inputmode="numeric" class="is-num" value="${esc(qtd)}" data-dv2-ff="qtd-${i}" data-dv2-l="qtd" aria-label="Quantidade da linha ${i + 1}"${dis ? ' disabled' : ''}></td><td data-dv2-l-un>${esc(a?.un ?? '')}</td><td><input type="text" inputmode="decimal" class="is-num" value="${esc(custo)}" data-dv2-ff="cus-${i}" data-dv2-l="custo" aria-label="Custo unitário da linha ${i + 1}" placeholder="0,00"${dis ? ' disabled' : ''}></td><td class="is-num" data-dv2-l-valor>—</td><td>${dis ? '' : `<button type="button" class="dv2-x" data-dv2-acao="del-linha" aria-label="Tirar a linha ${i + 1}">${L(trash)}</button>`}</td></tr>`;
}
function ficha(e: EstDoc, f: Ficha, d: Doc | undefined): string {
  const x = d ? doc(d) : undefined, ver = f.modo === 'editar' && !editavel(e, d);
  const titulo = f.modo === 'criar' ? 'Novo inventário inicial' : `${x!.ref} · ${armazemDe(x!.armazem)}`;
  const cab = `<header class="dv2-ficha-cab"><span class="dv2-ficha-ic">${L(packagePlus)}</span><div><small>${f.modo === 'criar' ? 'Criação' : ver ? 'Visualização' : 'Edição'}</small><h2>${esc(titulo)}</h2></div>
    <div class="dv2-ficha-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="fechar-ficha">${L(arrowLeft)}<span>${ver ? 'Voltar à lista' : 'Cancelar'}</span><kbd>Esc</kbd></button>${ver ? '' : `<button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="gravar">${L(save)}<span>Gravar</span><kbd>Ctrl Enter</kbd></button>`}</div></header>
    <p class="lf2-recusa" data-dv2-ficha-erro role="alert" hidden></p>`;
  const pe = ver ? (d!.anulado ? 'O documento está anulado: só se vê.' : `Lançado no stock a ${esc(x!.lancado ?? '')}: já não se altera. Para corrigir, anula-se (F8) e faz-se outro.`)
    : f.modo === 'criar' ? 'O documento nasce em rascunho e não mexe no stock até ser lançado (Ctrl+F2). O custo vem do último preço do fornecedor; muda-se se for outro.' : 'Rascunho: os artigos, as quantidades e os custos alteram-se; o stock só muda ao lançar.';
  const ls = x?.linhas ?? [];
  return `<div class="dv2-ficha-c">${cab}<p class="dv2-ficha-modo">${pe}</p>
    <input type="hidden" data-dv2-ff-versao value="${x?.versao ?? 0}">
    <div class="dv2-ficha-g">
      ${campo('serie', 'Série', '<select id="dv2-ff-serie" disabled><option>II 2026</option></select>')}
      ${campo('numero', 'Número', `<input type="text" id="dv2-ff-numero" value="${esc(x?.ref ?? 'Atribuído ao gravar')}" readonly>`)}
      ${campo('data', 'Data de emissão', `<input type="date" id="dv2-ff-data" value="${x?.data ?? HOJE}" max="${HOJE}" data-dv2-ff="data"${ver ? ' disabled' : ''}>`)}
      ${campo('armazem', 'Armazém', `<select id="dv2-ff-armazem" data-dv2-ff="armazem"${ver ? ' disabled' : ''}>${f.modo === 'criar' ? '<option value="">Escolhe o armazém…</option>' : ''}${ARMAZENS.map((a) => `<option value="${a.cod}"${a.cod === x?.armazem ? ' selected' : ''}>${esc(a.cod)} · ${esc(a.nome)}</option>`).join('')}</select>`)}
      ${campo('notas', 'Observações', `<textarea id="dv2-ff-notas" rows="2" data-dv2-ff="notas"${ver ? ' disabled' : ''}>${esc(x?.notas ?? '')}</textarea>`, 'is-largo')}
    </div>
    <h3 class="dv2-h3">Artigos</h3>${datalist}
    <div class="dv2-linhas-rolo"><table class="lf2-mini dv2-linhas-ed"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">Quantidade</th><th>Un.</th><th class="is-num">Custo unitário (€)</th><th class="is-num">Valor</th><th><span class="sr">Tirar</span></th></tr></thead>
      <tbody data-dv2-linhas>${(ls.length ? ls : [{ id: 'a', ref: '', qtd: -1, custo: -1 }]).map((l, i) => linhaFicha(i, l.ref, l.qtd >= 0 ? String(l.qtd) : '', l.custo >= 0 ? virgula(l.custo) : '', ver)).join('')}</tbody>
      <tfoot><tr class="is-total"><td colspan="2">Total</td><td class="is-num" data-dv2-r-qtd>—</td><td></td><td></td><td class="is-num" data-dv2-r-total>—</td><td></td></tr></tfoot></table></div>
    ${ver ? '' : `<button type="button" class="ak-btn ak-btn--linha dv2-mais-linha" data-dv2-acao="add-linha">${L(plus)}<span>Juntar artigo</span></button>`}
    <p class="dv2-ficha-dica">Enter passa ao campo seguinte; no último, vai a Gravar. Quantidades inteiras; custos com vírgula (ex.: 4,12). Ctrl+Enter grava; Esc fecha (com alterações, pergunta).</p></div>`;
}
interface Lido { data: string; armazem: string; notas: string; versao: number; linhas: { ref: string; qtd: number; custo: number; custoTxt: string }[] }
function lerFicha(r: HTMLElement): Lido {
  const v = (k: string) => r.querySelector<HTMLInputElement>(`[data-dv2-ficha] [data-dv2-ff="${k}"]`)?.value.trim() ?? '';
  const linhas = [...r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas] tr')].map((tr) => {
    const g = (k: string) => tr.querySelector<HTMLInputElement>(`[data-dv2-l="${k}"]`)!.value.trim();
    const qtd = g('qtd').replace(/\s/g, ''), custoTxt = g('custo');
    return { ref: g('ref'), qtd: qtd ? Number(qtd) : NaN, custo: custoTxt ? lerEuros(custoTxt) ?? NaN : NaN, custoTxt };
  }).filter((l) => l.ref || !Number.isNaN(l.qtd) || l.custoTxt);
  return { data: v('data'), armazem: v('armazem'), notas: r.querySelector<HTMLTextAreaElement>('[data-dv2-ficha] [data-dv2-ff="notas"]')?.value ?? '', versao: Number(r.querySelector<HTMLInputElement>('[data-dv2-ficha] [data-dv2-ff-versao]')?.value ?? 0), linhas };
}
function gravar(r: HTMLElement, e: EstDoc, f: Ficha): { ref: string; msg: string } {
  const x = lerFicha(r), pedido = { data: x.data, armazem: x.armazem, notas: x.notas, linhas: x.linhas.map(({ ref, qtd, custo }) => ({ ref, qtd, custo })) };
  if (f.modo === 'criar') { const d = criarInv(e.perfil, pedido); return { ref: d.ref, msg: `${d.ref} criado em rascunho no ${armazemDe(d.armazem)}: ainda não mexe no stock.` }; }
  const d = ativoDe(r, e); if (!d) throw new Recusa('O documento já não está na lista.');
  const g = guardarInv(e.perfil, String(d.ref), pedido, x.versao);
  return { ref: g.ref, msg: `${g.ref} gravado: ${nf(g.linhas.length)} artigos, ${euros(valorTotal(g))}.` };
}
/** Na ficha: a descrição e a unidade do artigo, o custo de partida e os valores de cada linha e do total. */
function recalcular(r: HTMLElement): void {
  let q = 0, t = 0;
  r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas] tr').forEach((tr) => {
    const qtd = Number(tr.querySelector<HTMLInputElement>('[data-dv2-l="qtd"]')!.value.trim() || 'NaN'), custo = lerEuros(tr.querySelector<HTMLInputElement>('[data-dv2-l="custo"]')!.value.trim());
    const ok = Number.isInteger(qtd) && qtd >= 0 && custo !== null, v = ok ? qtd * custo! : null;
    tr.querySelector<HTMLElement>('[data-dv2-l-valor]')!.textContent = v === null ? '—' : euros(v);
    if (Number.isInteger(qtd) && qtd >= 0) q += qtd; if (v !== null) t += v;
  });
  const rq = r.querySelector<HTMLElement>('[data-dv2-r-qtd]'), rt = r.querySelector<HTMLElement>('[data-dv2-r-total]');
  if (rq) rq.textContent = nf(q); if (rt) rt.textContent = euros(t);
}

/* ---------- lançar no stock (Ctrl+F2) ---------- */
function dlgLancar(r: HTMLElement, e: EstDoc, erro = ''): void {
  const d = ativoDe(r, e); if (!d) return;
  const porque = porqueLancar_(e, d); if (porque && !erro) { toast(r, porque); return; }
  const x = doc(d), nome = armazemDe(x.armazem);
  dialogo(r, `<h2 id="dv2-dlg-t">${L(arrowDownToLine)}Lançar no stock</h2><p class="lf2-dlg-sub"><b class="is-mono">${esc(x.ref)}</b> · ${esc(nome)} · emitido a ${dia(x.data)}</p>
    <table class="lf2-mini"><thead><tr><th>Artigo</th><th class="is-num">Stock hoje</th><th class="is-num">Entra</th><th class="is-num">Fica</th></tr></thead><tbody>${x.linhas.map((l) => { const s = stockEm(l.ref, nome); return `<tr><td class="is-mono">${esc(l.ref)}</td><td class="is-num">${nf(s)}</td><td class="is-num">+${nf(l.qtd)}</td><td class="is-num"><b>${nf(s + l.qtd)}</b></td></tr>`; }).join('')}</tbody><tfoot><tr class="is-total"><td>Total</td><td></td><td class="is-num">+${nf(quantidade(x))}</td><td class="is-num"><b>${euros(valorTotal(x))}</b></td></tr></tfoot></table>
    <ul class="dv2-regras"><li>As quantidades entram <b>todas ou nenhuma</b> no stock do ${esc(nome)}.</li><li>O documento passa a <b>Lançado</b> e já não se altera; para corrigir, anula-se (F8) e faz-se outro.</li><li>O ${esc(nome)} fica com este inventário inicial; outro só depois de anular este.</li></ul>
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
    const x = lancarInv(e.perfil, String(d.ref));
    e.ocupado = ''; fecharDialogo(r); e.tab = 'detalhes'; tudo(r, e, true);
    const cel = r.querySelector<HTMLElement>(`tr[data-dv2-id="${CSS.escape(d.id)}"] td[data-col="estado"]`);
    if (cel && !quieto()) cel.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: .6 }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    toast(r, `${x.ref} lançado: ${nf(quantidade(x))} unidades entraram no ${armazemDe(x.armazem)}.`);
  } catch (x) {
    e.ocupado = ''; dlgLancar(r, e, x instanceof Recusa ? x.message : 'O servidor não confirmou o lançamento. Nada se repete sozinho: atualiza a lista (F9) para ver se ficou lançado antes de tentar outra vez.');
  }
}

/* ---------- registar ---------- */
const CFG = registar({
  k: 'inv', titulo: 'Inventário Inicial', sub: 'Documentos de stock com as quantidades e os custos de partida de cada armazém.', icone: packagePlus, um: 'documento', o: 'o',
  caminho: [['ERP', 'inicio'], ['Stocks', 'stocks'], ['Inventário inicial', '']],
  cols: COLS, verIniciais: ['numero', 'data', 'armazem', 'armazemNome', 'notas', 'valor', 'estado', 'artigos', 'qtd', 'uIns', 'uAlt'],
  campos: { numero: 'n', data: 'data', codigo: 'armazem', descricao: 'notas' },
  rotuloForn: 'Armazém', phCodigo: 'Código do armazém, ex.: 60',
  linhas, series: () => [...new Set(inventarios().map((d) => d.ref.split('/')[0]))], serieDe: (d) => String(d.serie), fornDe: (d) => String(d.armazem), dataDe: (d) => String(d.data), moedaDe: (d) => String(d.moeda),
  estados: [['', 'Todos'], ['rasc', 'Rascunhos'], ['lanc', 'Lançados'], ['anul', 'Anulados']],
  estadoPassa: (d, v) => v === 'rasc' ? !d.lancado && !d.anulado : v === 'lanc' ? !!d.lancado : v === 'anul' ? !!d.anulado : true,
  celula, valor,
  resumo: (ls) => { const l = ls.filter((d) => d.lancado).length, a = ls.filter((d) => d.anulado).length, v = ls.filter((d) => !d.anulado).reduce((s, d) => s + (d.valor as number), 0); const pl = (n: number, um: string, vv: string) => `<span><b>${nf(n)}</b> ${n === 1 ? um : vv}</span>`; return ls.length ? `${pl(ls.length - l - a, 'rascunho', 'rascunhos')}${pl(l, 'lançado', 'lançados')}${pl(a, 'anulado', 'anulados')}<span><b>${euros(v)}</b> em valor</span>` : ''; },
  barra: BTN('lancar', arrowDownToLine, 'Lançar no stock', 'Ctrl+F2', '', 'ak-btn--acao'), teclasExtra: '',
  janelas: { titulo: 'Inventário inicial', icone: packagePlus, estados: ['ja-lancado', 'anulado', 'gravado', 'lancado'] },
  tabs: [{ k: 'detalhes', t: 'Detalhes', ic: info }, { k: 'linhas', t: 'Linhas', ic: list }, { k: 'stock', t: 'Stock', ic: boxes }, { k: 'anexos', t: 'Anexos', ic: paperclip }],
  painel, ficha, gravar,
  porque: {
    novo: (e) => podeInv(e.perfil, 'criar') ? '' : 'O teu perfil só consulta os documentos de stock.',
    editar: (e, d) => !d ? 'Escolhe um documento na lista.' : !podeInv(e.perfil, 'editar') ? 'O teu perfil só consulta os documentos de stock.' : editavel(e, d) ? '' : d.anulado ? 'O documento está anulado: só se vê (Enter).' : 'Já foi lançado no stock: não se altera; anula-se (F8) e faz-se outro. Enter abre-o para ver.',
    anular: (e, d) => !d ? 'Escolhe um documento na lista.' : !podeInv(e.perfil, 'anular') ? 'O teu perfil não anula documentos de stock.' : d.anulado ? 'Já está anulado.' : '',
  },
  anular: {
    texto: (d) => { const x = doc(d); return [`Anular o ${x.ref}?`, x.estado === 'Lançado' ? `Já está lançado: <b>${nf(quantidade(x))} unidades saem do stock</b> do ${esc(armazemDe(x.armazem))}. Nada se apaga: o documento fica no histórico, anulado.` : 'É um rascunho: nunca entrou no stock. Nada se apaga: fica no histórico, anulado.']; },
    fazer: (e, d, motivo) => { const x = anularInv(e.perfil, String(d.ref), motivo); return `${x.ref} anulado${x.lancado ? ': as quantidades saíram do stock' : ''}. Fica no histórico.`; },
  },
  docAnexo: (d) => d.id,
  teclas: [{ tecla: 'Ctrl+F2', acao: 'lancar' }],
  acao(r, e, k, b) {
    if (k === '_barra') { const t = porqueLancar_(e, ativoDe(r, e)), x = r.querySelector<HTMLElement>('.dv2-barra [data-dv2-acao="lancar"]'); if (x && !e.ocupado) { x.setAttribute('aria-disabled', String(!!t)); x.title = t || 'Lançar no stock (Ctrl+F2)'; } return true; }
    if (k === '_ficha-aberta') { recalcular(r); return true; }
    if (k === '_ficha-input') {
      const i = b as HTMLInputElement;
      if (i.dataset.dv2L === 'ref') { const tr = i.closest('tr')!, a = artigo(i.value.trim()); tr.querySelector('[data-dv2-l-desc]')!.textContent = a?.desc ?? ''; tr.querySelector('[data-dv2-l-un]')!.textContent = a?.un ?? ''; const c = tr.querySelector<HTMLInputElement>('[data-dv2-l="custo"]')!; if (a && !c.value.trim() && a.preco !== null) c.value = virgula(a.preco); }
      recalcular(r); return true;
    }
    if (k === 'lancar') { dlgLancar(r, e); return true; }
    if (k === 'lancar-sim') { void lancar(r, e, b); return true; }
    if (k === 'add-linha') { const tb = r.querySelector<HTMLElement>('[data-dv2-linhas]')!, i = tb.children.length; tb.insertAdjacentHTML('beforeend', linhaFicha(i)); const tr = tb.lastElementChild as HTMLElement; if (!quieto()) tr.animate([{ opacity: 0, transform: 'scaleY(.4)', transformOrigin: 'top' }, { opacity: 1, transform: 'none', transformOrigin: 'top' }], { duration: 180, easing: 'ease-out' }); tr.querySelector<HTMLElement>('input')?.focus(); if (e.ficha) e.ficha.sujo = true; return true; }
    if (k === 'del-linha') { const tr = b.closest('tr'), tb = tr?.parentElement; if (tr && tb && tb.children.length > 1) { tr.remove(); recalcular(r); if (e.ficha) e.ficha.sujo = true; (tb.querySelector('input') as HTMLElement | null)?.focus(); } else toast(r, 'O inventário precisa de pelo menos um artigo.'); return true; }
    return false;
  },
  cenario(r, e, cen) {
    const ls = linhas(e), rasc = ls.find((d) => !porqueLancar_(e, d)), lanc = ls.find((d) => d.lancado);
    if (['lancar', 'a-lancar', 'lancar-falhou'].includes(cen) && rasc) e.ativo = rasc.id;
    if (cen === 'lancado' && rasc) { e.ativo = rasc.id; e.extra.lancadoSim = rasc.id; }
    if (cen === 'ja-lancado' && lanc) { e.ativo = lanc.id; e.recusa = porqueLancar_(e, lanc); }
    if (cen === 'editar' && rasc) e.ativo = rasc.id;
    if (cen === 'anular-lancado' && lanc) e.ativo = lanc.id;
    if (cen === 'anulado' && rasc) { e.extra.anuladoSim = rasc.id; e.ativo = rasc.id; e.aviso = `${rasc.ref} anulado: «Contagem repetida: o armazém 2 conta outra vez a 20/10». Fica no histórico.`; }
    if (cen === 'gravado' && ls[0]) e.ativo = ls[0].id;
    requestAnimationFrame(() => {
      if (cen === 'lancar' || cen === 'a-lancar' || cen === 'lancar-falhou') dlgLancar(r, e, cen === 'lancar-falhou' ? 'O servidor não confirmou o lançamento (ERP-STK-504). Nada se repete sozinho: atualiza a lista (F9) para ver se ficou lançado antes de tentar outra vez.' : '');
      if (cen === 'a-lancar') { const b = r.querySelector<HTMLElement>('[data-dv2-acao="lancar-sim"]'); if (b) { b.classList.add('is-carregar'); b.setAttribute('aria-disabled', 'true'); b.innerHTML = `${L(loader)}<span>A lançar…</span>`; } }
      if (cen === 'lancado' && rasc) { e.aviso = `${rasc.ref} lançado: ${nf(rasc.qtd as number)} unidades entraram no ${rasc.armazemNome}.`; tudo(r, e); }
      if (cen === 'anular-lancado') dialogo(r, `<h2 id="dv2-dlg-t" class="is-perigo">${L(ban)}${esc(CFG.anular.texto(ativoDe(r, e)!)[0])}</h2><p>${CFG.anular.texto(ativoDe(r, e)!)[1]}</p><label class="ak-campo dv2-motivo" for="dv2-motivo"><span>Motivo (obrigatório)</span><textarea id="dv2-motivo" rows="3" maxlength="300" data-dv2-motivo data-dv2-primeiro placeholder="Porque se anula — fica no histórico"></textarea></label><p class="ak-erro-campo" data-dv2-dlg-erro role="alert" hidden></p><div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar>${L(xIc)}<span>Manter</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--perigo" data-dv2-acao="anular-sim">${L(ban)}<span>Anular</span></button></div>`);
    });
  },
  dica: 'Período e moeda juntam-se à pesquisa. Enter passa ao campo seguinte.',
});

/* ---------- os ecrãs ---------- */
const NOTA = 'Inventário inicial (18 nov., do menu Stocks e da janela «Documentos de Stock» do ERP antigo), no motor das listas das Compras: as colunas do antigo (Número, Data de emissão, Observações, Valor total) e as que faltavam (armazém, artigos, quantidade, estado), Pesquisar por Número/Data/Código do armazém/Observações (F1 F2 F10 F12), Série (F4), cada documento numa janela (Detalhes, Linhas, Stock, Anexos), a ficha (criar e editar o rascunho), Lançar no stock (Ctrl+F2, o «<F2> Actualizar» do antigo) e Anular (F8).';
export const ESTADOS_INV: [string, string, string][] = [
  ['carregar', '70.11 · A carregar', 'A lista em esqueleto; a pesquisa e os filtros já servem.'],
  ['vazia', '70.12 · Sem documentos', 'Ainda não há inventários iniciais: Novo (F5).'],
  ['sem-resultados', '70.13 · Pesquisa sem resultados', 'Diz em que modo se procurou e como se compara; oferece Contendo e Limpar.'],
  ['criar', '70.14 · Novo inventário inicial', 'Novo (F5) abre a ficha numa janela «A criar»: data de emissão, armazém, observações e artigos com quantidade e custo; o total recalcula-se.'],
  ['editar', '70.15 · Editar o rascunho', 'Só o rascunho se altera: artigos, quantidades, custos, data e observações.'],
  ['por-gravar', '70.16 · Alterações por gravar', 'Fechar a ficha com alterações: continuar a editar ou descartar.'],
  ['a-gravar', '70.17 · A gravar', 'O botão espera; nada se diz antes de as regras aceitarem.'],
  ['gravado', '70.18 · Gravado', 'A ficha fecha, a linha acende e a barra de estado diz o que se gravou.'],
  ['gravar-falhou', '70.19 · Gravar falhou', 'O servidor não respondeu: as alterações ficam na ficha.'],
  ['lancar', '70.20 · Lançar no stock (Ctrl+F2)', 'O stock de hoje, o que entra e com quanto fica cada artigo; todas ou nenhuma.'],
  ['a-lancar', '70.21 · A lançar', 'O botão espera e o Cancelar desliga-se: não há lançamentos repetidos.'],
  ['lancado', '70.22 · Lançado', 'O estado acende «Lançado» e o documento já não se altera.'],
  ['ja-lancado', '70.23 · Já lançado', 'Ctrl+F2 num lançado diz quando entrou e como se corrige (anular e fazer outro).'],
  ['lancar-falhou', '70.24 · O lançamento falhou', 'Sem confirmação: nada se repete sozinho; atualizar antes de tentar outra vez.'],
  ['anular', '70.25 · Anular (F8)', 'A confirmação diz o que acontece ao stock e pede o motivo.'],
  ['anular-lancado', '70.26 · Anular um lançado', 'Um lançado anulado tira as quantidades do stock; diz-se antes quantas.'],
  ['anulado', '70.27 · Anulado', 'O documento fica, com «Anulado»; não se lança nem se altera.'],
  ['anexos', '70.28 · Anexos', 'As folhas de contagem e outros anexos do documento: ver, descarregar, carregar e remover.'],
  ['imprimir', '70.29 · Imprimir (F11)', 'Imprime-se só a lista, com as colunas à vista.'],
  ['permissao', '70.30 · Sem permissão', 'O perfil só consulta: as ações dizem porquê.'],
  ['sessao', '70.31 · Sessão terminada', 'Voltar a entrar pelo login comum; o que estava escrito fica.'],
  ['offline', '70.32 · Sem ligação', 'Sem rede: a pesquisa e os filtros ficam.'],
  ['servidor', '70.33 · Servidor indisponível', 'O servidor dos stocks não respondeu: Tentar outra vez.'],
  ['restaurada', '70.34 · Área de trabalho reposta', 'Ao voltar: a pesquisa, os filtros e o documento escolhido como estavam.'],
  ['janela', '70.35 · Documento numa janela', 'Tocar num documento abre-o numa janela flutuante: Detalhes, Linhas, Stock e Anexos lá dentro; a lista fica à vista.'],
  ['janelas', '70.36 · Várias janelas', 'Vários documentos abertos em cascata; a da frente é a última tocada e é a ela que as ações se aplicam.'],
  ['maximizada', '70.37 · Janela maximizada', 'Duplo clique no cabeçalho (ou o botão) enche o ecrã; outra vez, volta ao tamanho que tinha.'],
  ['editar-sujo', '70.38 · A editar, com alterações', 'Editar na janela do documento: o ● no título diz que há alterações por gravar; fechar pergunta.'],
];
const armazensDaLista = (): [string, string][] => ARMAZENS.map((a) => [a.cod, `${a.cod} · ${a.nome}`]);
export function versaoInventario(cen = 'normal') { return { id: 'v1', nota: NOTA, html: paginaDoc(CFG, cen, armazensDaLista()) }; }
export type IdStocks = 'stocks-inventario-inicial' | `inv-${string}`;
export const DESCRICAO_STOCKS = 'O menu Stocks do ERP antigo. O 70 · Inventário inicial (as quantidades e os custos de partida de cada armazém) e o 71 · Transferências entre armazéns (de um armazém para outro, só com stock na origem) entram no stock ao lançar (Ctrl+F2). Os outros itens do menu ainda não têm ecrã novo e aparecem desligados.';
export function ecrasStocks(): Ecra<IdErp>[] {
  return [
    { id: 'stocks-inventario-inicial', nome: '70 · Inventário inicial', fluxo: 'Stocks', objetivo: 'Os documentos de stock do inventário inicial de cada armazém: criar o rascunho, lançar no stock (Ctrl+F2) e anular, com o motor das listas das Compras.', versoes: [versaoInventario()] as Ecra<IdErp>['versoes'] },
    ...ESTADOS_INV.map(([cen, nome, objetivo]) => ({ id: `inv-${cen}` as IdErp, nome, fluxo: 'Stocks', estadoDe: 'stocks-inventario-inicial' as IdErp, objetivo, versoes: [versaoInventario(cen)] as Ecra<IdErp>['versoes'] })),
  ];
}
