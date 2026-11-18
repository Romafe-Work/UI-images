/* =========================================================
   ERP — Stocks: 73 · Acréscimos e 74 · Perdas (18 nov. 2026). Ela pediu os dois a seguir ao Ajustamento em valor e
   mostrou as «Perdas» do ERP antigo, que lá se chamam «Documentos de Stock - Quebras» (Número, Data de Emissão,
   Observações, Valor Total; Novo F5, Editar F6, Apagar F8, Filtrar F3, Refrescar F9, Linhas F10, Actualizar (F11)).
   Os dois têm a mesma forma — um armazém, o motivo e as linhas com quantidade e custo — e por isso são uma só
   configuração do motor das listas (compras/docs-v2.ts), com o desenho do 70, 71 e 72:
     - Acréscimo: as quantidades ENTRAM no armazém ao lançar; anular um lançado tira-as (se ainda lá estiverem);
     - Perda: SAEM ao lançar, nunca abaixo de zero (diz qual artigo falta); anular uma lançada devolve-as;
     - a ficha mostra o stock do armazém por linha e, na perda, avisa logo quando não chega;
     - Apagar passa a Anular (F8), com o motivo; o «Actualizar (F11)» do antigo é Lançar no stock (Ctrl+F2).
   Regras em stocks/dominio.ts.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { registar, paginaDoc, BTN, L, esc, type CfgDoc, type Doc, type EstDoc, type Ficha } from '../compras/docs-v2';
import { toast, dialogo, fecharDialogo, tudo, ativoDe, quieto, nf } from '../compras/docs-v2-comportamento';
import { movimentos, movimento, valorMov, quantidadeMov, porqueLancarMov, podeInv, criarMov, guardarMov, lancarMov, anularMov, NOME_MOV, ARMAZENS, armazemDe, artigo, ARTIGOS, stockEm, custoDe, HOJE, Recusa, type TipoMov } from './dominio';
import { euros, dia, lerEuros } from '../compras/dominio';
import { PERFIS } from '../inicio-dados';
import circlePlus from 'lucide-static/icons/circle-plus.svg?raw';
import circleMinus from 'lucide-static/icons/circle-minus.svg?raw';
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
import triangleAlert from 'lucide-static/icons/triangle-alert.svg?raw';

const pessoa = (p: string) => PERFIS[p as keyof typeof PERFIS]?.pessoa ?? p;
const curto = (cod: string) => armazemDe(cod).split(' · ')[1] ?? cod;
const virgula = (c: number) => (c / 100).toFixed(2).replace('.', ',');
const badge = (cls: string, ic: string, t: string, title = '') => `<span class="lf2-b ${cls}"${title ? ` title="${esc(title)}"` : ''}>${L(ic)}${t}</span>`;
const dd = (t: string, v: string, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${t}</dt><dd>${v}</dd></div>`;
const campo = (k: string, t: string, input: string, cls = '') => `<label class="ak-campo${cls ? ` ${cls}` : ''}" for="dv2-ff-${k}"><span>${t}</span>${input}</label>`;

interface Def { tipo: TipoMov; k: string; num: string; id: 'stocks-acrescimos' | 'stocks-perdas'; pre: string; titulo: string; sub: string; menu: string; icone: string; antigo: string }
const DEFS: Def[] = [
  { tipo: 'AC', k: 'acr', num: '73', id: 'stocks-acrescimos', pre: 'acr', titulo: 'Acréscimos', sub: 'Documentos de stock com as quantidades que entram num armazém fora das compras.', menu: 'Acréscimos', icone: circlePlus, antigo: 'Documentos de Stock - Acréscimos' },
  { tipo: 'QB', k: 'qbr', num: '74', id: 'stocks-perdas', pre: 'qbr', titulo: 'Perdas', sub: 'Documentos de stock com as quantidades que saem de um armazém: quebras, extravios e acertos.', menu: 'Perdas', icone: circleMinus, antigo: 'Documentos de Stock - Quebras' },
];

function montar(def: Def) {
  const n = NOME_MOV[def.tipo], A = n.o === 'a' ? 'A' : 'O', o = n.o, entra = n.entra, um = n.um;
  const linhas = (e: EstDoc): Doc[] => movimentos(def.tipo).map((d): Doc => {
    const anulado = d.estado === 'Anulado' || e.extra.anuladoSim === d.ref, lancado = !anulado && (d.estado === 'Lançado' || e.extra.lancadoSim === d.ref);
    return { id: d.ref, ref: d.ref, numero: d.ref, n: d.ref.split(' ')[1] ?? d.ref, serie: d.ref.split('/')[0], data: d.data, armazem: d.armazem, armazemNome: curto(d.armazem), notas: d.notas,
      artigos: d.linhas.length, qtd: quantidadeMov(d), valor: valorMov(d), estado: anulado ? 'Anulado' : lancado ? 'Lançado' : d.estado, anulado, lancado, uIns: pessoa(d.criador), uAlt: pessoa(d.alterado), moeda: 'EUR' };
  });
  const doc = (d: Doc) => movimento(String(d.ref))!;
  const COLS: CfgDoc['cols'] = [
    { k: 'numero', t: 'Número', tipo: 'mono', w: 130, presa: true, antiga: true },
    { k: 'data', t: 'Data de emissão', tipo: 'data', w: 120, antiga: true },
    { k: 'armazem', t: 'Armazém', tipo: 'txt', w: 170 },
    { k: 'notas', t: 'Observações', tipo: 'txt', w: 290, antiga: true },
    { k: 'qtd', t: 'Quantidade', tipo: 'n', w: 100 },
    { k: 'valor', t: 'Valor total', tipo: 'eur', w: 130, antiga: true },
    { k: 'estado', t: 'Estado', tipo: 'estado', w: 130 },
    { k: 'artigos', t: 'Artigos', tipo: 'n', w: 80 },
    { k: 'uIns', t: 'Utilizador de inserção', tipo: 'txt', w: 160 },
    { k: 'uAlt', t: 'Utilizador de alteração', tipo: 'txt', w: 160 },
  ];
  const sinalQ = (q: number) => q ? `${entra ? '+' : '−'}${nf(q)}` : '0';
  function celula(d: Doc, k: string): string {
    switch (k) {
      case 'numero': return `<span class="lf2-art"><b>${esc(String(d.numero))}</b></span>`;
      case 'data': return dia(String(d.data));
      case 'armazem': return `<span class="is-mono">${esc(String(d.armazem))}</span> ${esc(String(d.armazemNome))}`;
      case 'qtd': return sinalQ(d.qtd as number);
      case 'artigos': return nf(d.artigos as number);
      case 'valor': return euros(d.valor as number);
      case 'estado': return `<span class="lf2-badges">${d.anulado ? badge('lf2-b--rutura', ban, `Anulad${o}`) : d.lancado ? badge('lf2-b--pend', circleCheck, `Lançad${o}`) : badge('lf2-b--enc', clock, 'Rascunho', 'Ainda não mexeu no stock')}</span>`;
      default: return esc(String(d[k] ?? '')) || '<span class="is-nada">—</span>';
    }
  }
  const valor = (d: Doc, k: string): string | number => k === 'armazem' ? `${d.armazem} ${d.armazemNome}` : (d[k] as string | number) ?? '';
  const editavel = (e: EstDoc, d: Doc | undefined) => !!d && !d.anulado && !d.lancado && podeInv(e.perfil, 'editar');
  const porqueLancar_ = (e: EstDoc, d: Doc | undefined) => d?.anulado ? `${A} ${um} está anulad${o}.` : d?.lancado ? `Já foi lançad${o} no stock${doc(d).lancado ? ` a ${doc(d).lancado}` : ''}.` : porqueLancarMov(e.perfil, d ? doc(d) : undefined);

  function painel(e: EstDoc, d: Doc | undefined, tab: string): string {
    if (!d) return '';
    const x = doc(d), nome = armazemDe(x.armazem);
    if (tab === '_alvo') return `<b>${esc(x.ref)}</b><span>${esc(nome)} · ${sinalQ(quantidadeMov(x))} un. · ${euros(valorMov(x))}</span>`;
    if (tab === 'detalhes') {
      const t = porqueLancar_(e, d);
      return `${e.recusa ? `<p class="lf2-recusa" role="alert">${L(circleAlert)}${esc(e.recusa)}</p>` : ''}
        <div class="dv2-estado-faixa ${d.anulado ? 'is-anulado' : d.lancado ? 'is-ok' : t ? 'is-espera' : 'is-pronto'}">${d.anulado ? `${L(ban)}<span><b>Anulad${o}${x.anulado ? ` a ${esc(x.anulado.quando)}` : ''}.</b> ${esc(x.anulado?.motivo ?? '')} Fica no histórico; não mexe no stock.</span>` : d.lancado ? `${L(circleCheck)}<span><b>Lançad${o} a ${esc(x.lancado ?? 'hoje')}.</b> As quantidades ${entra ? 'entraram no' : 'saíram do'} ${esc(nome)}. Para corrigir, anula-se (F8).</span>` : t ? `${L(clock)}<span><b>Rascunho.</b> ${esc(t)}</span>` : `${L(arrowDownToLine)}<span><b>Pront${o} a lançar.</b> Ctrl+F2 ${entra ? 'põe' : 'tira'} ${nf(quantidadeMov(x))} unidades ${entra ? 'no' : 'do'} ${esc(nome)}.</span>`}</div>
        <dl class="lf2-dl dv2-dl">${dd('Número', `<b class="is-mono">${esc(x.ref)}</b>`)}${dd('Data de emissão', dia(x.data))}${dd('Armazém', `${esc(nome)}<small>Código ${esc(x.armazem)}</small>`)}${dd('Moeda', 'EUR · euro')}
          ${dd('Observações', esc(x.notas) || '<span class="is-nada">—</span>', 'is-largo')}
          ${dd('Artigos', nf(x.linhas.length))}${dd('Quantidade', sinalQ(quantidadeMov(x)))}${dd('Valor total', `<b>${euros(valorMov(x))}</b><small>Quantidade × custo unitário</small>`)}${dd('Estado', esc(String(d.estado)))}
          ${dd('Inserido por', esc(String(d.uIns)))}${dd('Alterado por', `${esc(String(d.uAlt))}<small>${esc(x.historico[x.historico.length - 1]?.quando ?? '')}</small>`)}</dl>
        <details class="dv2-hist"><summary>Histórico (${x.historico.length})</summary><ol>${x.historico.slice().reverse().map((h) => `<li><time>${esc(h.quando)}</time><b>${esc(h.acao)}</b>${h.detalhe ? ` · ${esc(h.detalhe)}` : ''}<small>${esc(h.quem)}</small></li>`).join('')}</ol></details>`;
    }
    if (tab === 'linhas') {
      const antes = !d.lancado && !d.anulado;
      return `<table class="lf2-mini dv2-linhas-t"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">Quantidade</th><th class="is-num">Custo unitário</th><th class="is-num">Valor</th><th class="is-num">Stock ${esc(x.armazem)} · hoje</th>${antes ? '<th class="is-num">Depois de lançar</th>' : ''}</tr></thead><tbody>${x.linhas.map((l) => { const a = artigo(l.ref), s = stockEm(l.ref, nome), dep = s + (entra ? l.qtd : -l.qtd);
        return `<tr><td class="is-mono">${esc(l.ref)}</td><td>${esc(a?.desc ?? '')}</td><td class="is-num">${sinalQ(l.qtd)}</td><td class="is-num">${euros(l.custo)}</td><td class="is-num"><b>${euros(l.qtd * l.custo)}</b></td><td class="is-num">${nf(s)}</td>${antes ? `<td class="is-num">${dep < 0 ? `<span class="lf2-b lf2-b--rutura" title="Não há stock que chegue">${L(triangleAlert)}${nf(dep)}</span>` : `<b>${nf(dep)}</b>`}</td>` : ''}</tr>`; }).join('')}</tbody>
        <tfoot><tr class="is-total"><td colspan="2">Total</td><td class="is-num">${sinalQ(quantidadeMov(x))}</td><td></td><td class="is-num"><b>${euros(valorMov(x))}</b></td><td></td>${antes ? '<td></td>' : ''}</tr></tfoot></table>`;
    }
    return '';
  }

  const dl = `${def.pre}-artigos`;
  const datalist = `<datalist id="${dl}">${ARTIGOS.map((a) => `<option value="${esc(a.ref)}">${esc(a.desc)} · ${esc(a.marca)}</option>`).join('')}</datalist>`;
  const linhaFicha = (i: number, ref = '', qtd = '', custo = '', dis = false) => { const a = artigo(ref);
    return `<tr data-dv2-linha="${i}"><td><input type="text" list="${dl}" value="${esc(ref)}" data-dv2-ff="art-${i}" data-dv2-l="ref" aria-label="Artigo da linha ${i + 1}" placeholder="Referência"${dis ? ' disabled' : ''}></td><td data-dv2-l-desc>${esc(a?.desc ?? '')}</td><td class="is-num" data-dv2-l-ha>—</td><td><input type="text" inputmode="numeric" class="is-num" value="${esc(qtd)}" data-dv2-ff="qtd-${i}" data-dv2-l="qtd" aria-label="Quantidade da linha ${i + 1}"${dis ? ' disabled' : ''}></td><td><input type="text" inputmode="decimal" class="is-num" value="${esc(custo)}" data-dv2-ff="cus-${i}" data-dv2-l="custo" aria-label="Custo unitário da linha ${i + 1}" placeholder="0,00"${dis ? ' disabled' : ''}></td><td class="is-num" data-dv2-l-valor>—</td><td>${dis ? '' : `<button type="button" class="dv2-x" data-dv2-acao="del-linha" aria-label="Tirar a linha ${i + 1}">${L(trash)}</button>`}</td></tr>`; };
  function ficha(e: EstDoc, f: Ficha, d: Doc | undefined): string {
    const x = d ? doc(d) : undefined, ver = f.modo === 'editar' && !editavel(e, d), dis = ver ? ' disabled' : '';
    const titulo = f.modo === 'criar' ? `Nov${o} ${um}` : `${x!.ref} · ${armazemDe(x!.armazem)}`;
    const pe = ver ? (d!.anulado ? `${A} ${um} está anulad${o}: só se vê.` : `Lançad${o} a ${esc(x!.lancado ?? '')}: já não se altera. Para corrigir, anula-se (F8).`)
      : f.modo === 'criar' ? `Nasce em rascunho e não mexe no stock até ser lançad${o} (Ctrl+F2). ${entra ? 'As quantidades entram no armazém.' : 'As quantidades saem do armazém, nunca abaixo de zero.'} O custo vem do custo atual do artigo.` : 'Rascunho: o armazém, o motivo, os artigos e as quantidades alteram-se; o stock só muda ao lançar.';
    const ls = x?.linhas ?? [];
    return `<div class="dv2-ficha-c"><header class="dv2-ficha-cab"><span class="dv2-ficha-ic">${L(def.icone)}</span><div><small>${f.modo === 'criar' ? 'Criação' : ver ? 'Visualização' : 'Edição'}</small><h2>${esc(titulo)}</h2></div>
      <div class="dv2-ficha-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="fechar-ficha">${L(arrowLeft)}<span>${ver ? 'Voltar à lista' : 'Cancelar'}</span><kbd>Esc</kbd></button>${ver ? '' : `<button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="gravar">${L(save)}<span>Gravar</span><kbd>Ctrl Enter</kbd></button>`}</div></header>
      <p class="lf2-recusa" data-dv2-ficha-erro role="alert" hidden></p><p class="dv2-ficha-modo">${pe}</p>
      <input type="hidden" data-dv2-ff-versao value="${x?.versao ?? 0}">
      <div class="dv2-ficha-g">
        ${campo('serie', 'Série', `<select id="dv2-ff-serie" disabled><option>${def.tipo} 2026</option></select>`)}
        ${campo('numero', 'Número', `<input type="text" id="dv2-ff-numero" value="${esc(x?.ref ?? 'Atribuído ao gravar')}" readonly>`)}
        ${campo('data', 'Data de emissão', `<input type="date" id="dv2-ff-data" value="${x?.data ?? HOJE}" max="${HOJE}" data-dv2-ff="data"${dis}>`)}
        ${campo('armazem', 'Armazém', `<select id="dv2-ff-armazem" data-dv2-ff="armazem"${dis}>${ARMAZENS.map((a) => `<option value="${a.cod}"${a.cod === (x?.armazem ?? '60') ? ' selected' : ''}>${esc(a.cod)} · ${esc(curto(a.cod))}</option>`).join('')}</select>`)}
        ${campo('notas', 'Observações (o motivo)', `<input type="text" id="dv2-ff-notas" value="${esc(x?.notas ?? '')}" placeholder="${entra ? 'Ex.: Acerto de stock — sobra na contagem' : 'Ex.: Acerto de stock — extravio'}" data-dv2-ff="notas"${dis}>`, 'is-largo')}
      </div>
      <h3 class="dv2-h3">Artigos</h3>${datalist}
      <div class="dv2-linhas-rolo"><table class="lf2-mini dv2-linhas-ed"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">No armazém</th><th class="is-num">Quantidade</th><th class="is-num">Custo unitário (€)</th><th class="is-num">Valor</th><th><span class="sr">Tirar</span></th></tr></thead>
        <tbody data-dv2-linhas>${(ls.length ? ls : [{ id: 'a', ref: '', qtd: 0, custo: -1 }]).map((l, i) => linhaFicha(i, l.ref, l.qtd ? String(l.qtd) : '', l.custo >= 0 ? virgula(l.custo) : '', ver)).join('')}</tbody>
        <tfoot><tr class="is-total"><td colspan="3">Total</td><td class="is-num" data-dv2-r-qtd>—</td><td></td><td class="is-num" data-dv2-r-total>—</td><td></td></tr></tfoot></table></div>
      <p class="lf2-recusa" data-mv-aviso hidden></p>
      ${ver ? '' : `<button type="button" class="ak-btn ak-btn--linha dv2-mais-linha" data-dv2-acao="add-linha">${L(plus)}<span>Juntar artigo</span></button>`}
      <p class="dv2-ficha-dica">Enter passa ao campo seguinte; no último, vai a Gravar. Quantidades inteiras; custos com vírgula (ex.: 4,12). Ctrl+Enter grava; Esc fecha (com alterações, pergunta).</p></div>`;
  }
  function lerFicha(r: HTMLElement) {
    const v = (k: string) => r.querySelector<HTMLInputElement>(`[data-dv2-ficha] [data-dv2-ff="${k}"]`)?.value.trim() ?? '';
    const ls = [...r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas] tr')].map((tr) => {
      const g = (k: string) => tr.querySelector<HTMLInputElement>(`[data-dv2-l="${k}"]`)!.value.trim(), q = g('qtd').replace(/\s/g, ''), c = g('custo');
      return { ref: g('ref'), qtd: q ? Number(q) : NaN, custo: c ? lerEuros(c) ?? NaN : NaN, vazio: !g('ref') && !q && !c };
    }).filter((l) => !l.vazio).map(({ ref, qtd, custo }) => ({ ref, qtd, custo }));
    return { data: v('data'), armazem: v('armazem'), notas: v('notas'), versao: Number(r.querySelector<HTMLInputElement>('[data-dv2-ficha] [data-dv2-ff-versao]')?.value ?? 0), linhas: ls };
  }
  function gravar(r: HTMLElement, e: EstDoc, f: Ficha): { ref: string; msg: string } {
    const x = lerFicha(r), pedido = { data: x.data, armazem: x.armazem, notas: x.notas, linhas: x.linhas };
    if (f.modo === 'criar') { const d = criarMov(e.perfil, def.tipo, pedido); return { ref: d.ref, msg: `${d.ref} criad${o} em rascunho no ${armazemDe(d.armazem)}: ainda não mexe no stock.` }; }
    const d = ativoDe(r, e); if (!d) throw new Recusa('O documento já não está na lista.');
    const g = guardarMov(e.perfil, String(d.ref), pedido, x.versao);
    return { ref: g.ref, msg: `${g.ref} gravad${o}: ${nf(quantidadeMov(g))} unidades, ${euros(valorMov(g))}.` };
  }
  function recalcular(r: HTMLElement): void {
    const arm = r.querySelector<HTMLSelectElement>('[data-dv2-ficha] [data-dv2-ff="armazem"]')?.value ?? '';
    let q = 0, t = 0; const faltam: string[] = [];
    r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas] tr').forEach((tr) => {
      const ref = tr.querySelector<HTMLInputElement>('[data-dv2-l="ref"]')!.value.trim(), a = artigo(ref), qtd = Number(tr.querySelector<HTMLInputElement>('[data-dv2-l="qtd"]')!.value.trim() || 'NaN'), custo = lerEuros(tr.querySelector<HTMLInputElement>('[data-dv2-l="custo"]')!.value.trim());
      const ha = a && arm ? stockEm(ref, armazemDe(arm)) : null, ok = Number.isInteger(qtd) && qtd > 0;
      const cel = tr.querySelector<HTMLElement>('[data-dv2-l-ha]')!; cel.textContent = ha === null ? '—' : nf(ha); cel.classList.toggle('is-zero', !entra && ha !== null && ok && qtd > ha);
      tr.querySelector<HTMLElement>('[data-dv2-l-valor]')!.textContent = ok && custo !== null ? euros(qtd * custo) : '—';
      if (ok) { q += qtd; if (custo !== null) t += qtd * custo; if (!entra && ha !== null && qtd > ha) faltam.push(`${ref} (perdes ${nf(qtd)}, há ${nf(ha)})`); }
    });
    const rq = r.querySelector<HTMLElement>('[data-dv2-r-qtd]'), rt = r.querySelector<HTMLElement>('[data-dv2-r-total]'); if (rq) rq.textContent = sinalQ(q); if (rt) rt.textContent = euros(t);
    const av = r.querySelector<HTMLElement>('[data-mv-aviso]'); if (av) { av.hidden = !faltam.length; av.innerHTML = faltam.length ? `${L(triangleAlert)}<span>Não há stock que chegue no ${esc(armazemDe(arm))}: ${esc(faltam.join('; '))}. Grava-se em rascunho, mas só se lança com stock.</span>` : ''; }
  }
  function dlgLancar(r: HTMLElement, e: EstDoc, erro = ''): void {
    const d = ativoDe(r, e); if (!d) return;
    const porque = porqueLancar_(e, d); if (porque && !erro) { toast(r, porque); return; }
    const x = doc(d), nome = armazemDe(x.armazem);
    dialogo(r, `<h2 id="dv2-dlg-t">${L(arrowDownToLine)}Lançar ${o === 'a' ? 'a' : 'o'} ${um}</h2><p class="lf2-dlg-sub"><b class="is-mono">${esc(x.ref)}</b> · ${esc(nome)} · ${esc(x.notas)}</p>
      <table class="lf2-mini"><thead><tr><th>Artigo</th><th class="is-num">Stock hoje</th><th class="is-num">${entra ? 'Entra' : 'Sai'}</th><th class="is-num">Fica</th></tr></thead><tbody>${x.linhas.map((l) => { const s = stockEm(l.ref, nome); return `<tr><td class="is-mono">${esc(l.ref)}</td><td class="is-num">${nf(s)}</td><td class="is-num">${sinalQ(l.qtd)}</td><td class="is-num"><b>${nf(s + (entra ? l.qtd : -l.qtd))}</b></td></tr>`; }).join('')}</tbody><tfoot><tr class="is-total"><td>Total</td><td></td><td class="is-num">${sinalQ(quantidadeMov(x))}</td><td class="is-num"><b>${euros(valorMov(x))}</b></td></tr></tfoot></table>
      <ul class="dv2-regras"><li>As quantidades ${entra ? 'entram no' : 'saem do'} ${esc(nome)}, <b>todas ou nenhuma</b>${entra ? '' : '; o stock nunca fica negativo'}.</li><li>Passa a <b>Lançad${o}</b> e já não se altera; para corrigir, anula-se (F8).</li></ul>
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
      const x = lancarMov(e.perfil, String(d.ref));
      e.ocupado = ''; fecharDialogo(r); e.tab = 'detalhes'; tudo(r, e, true);
      const cel = r.querySelector<HTMLElement>(`tr[data-dv2-id="${CSS.escape(d.id)}"] td[data-col="estado"]`);
      if (cel && !quieto()) cel.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: .6 }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      toast(r, `${x.ref} lançad${o}: ${nf(quantidadeMov(x))} unidades ${entra ? 'entraram no' : 'saíram do'} ${armazemDe(x.armazem)}.`);
    } catch (x) {
      e.ocupado = ''; dlgLancar(r, e, x instanceof Recusa ? x.message : 'O servidor não confirmou o lançamento. Nada se repete sozinho: atualiza a lista (F9) antes de tentar outra vez.');
    }
  }

  const CFG = registar({
    k: def.k, titulo: def.titulo, sub: def.sub, icone: def.icone, um, o,
    caminho: [['ERP', 'inicio'], ['Stocks', 'stocks'], [def.menu, '']],
    cols: COLS, verIniciais: ['numero', 'data', 'armazem', 'notas', 'qtd', 'valor', 'estado'], ajustar: true,
    campos: { numero: 'n', data: 'data', codigo: 'armazem', descricao: 'notas' },
    rotuloForn: 'Armazém', phCodigo: 'Código do armazém, ex.: 60',
    linhas, series: () => [...new Set(movimentos(def.tipo).map((d) => d.ref.split('/')[0]))], serieDe: (d) => String(d.serie), fornDe: (d) => String(d.armazem), dataDe: (d) => String(d.data), moedaDe: (d) => String(d.moeda),
    estados: [['', 'Todos'], ['rasc', 'Rascunhos'], ['lanc', `Lançad${o}s`], ['anul', `Anulad${o}s`]],
    estadoPassa: (d, v) => v === 'rasc' ? !d.lancado && !d.anulado : v === 'lanc' ? !!d.lancado : v === 'anul' ? !!d.anulado : true,
    celula, valor,
    resumo: (ls) => { const l = ls.filter((d) => d.lancado), a = ls.filter((d) => d.anulado).length, v = l.reduce((s, d) => s + (d.valor as number), 0); const pl = (k: number, s1: string, s2: string) => `<span><b>${nf(k)}</b> ${k === 1 ? s1 : s2}</span>`; return ls.length ? `${pl(ls.length - l.length - a, 'rascunho', 'rascunhos')}${pl(l.length, `lançad${o}`, `lançad${o}s`)}${pl(a, `anulad${o}`, `anulad${o}s`)}<span><b>${euros(v)}</b> ${entra ? 'entraram' : 'perdidos'} no stock</span>` : ''; },
    barra: BTN('lancar', arrowDownToLine, 'Lançar no stock', 'Ctrl+F2', '', 'ak-btn--acao'), teclasExtra: '',
    janelas: { titulo: def.menu.replace(/s$/, ''), icone: def.icone, estados: ['ja-lancado', 'anulado', 'gravado', 'lancado'] },
    tabs: [{ k: 'detalhes', t: 'Detalhes', ic: info }, { k: 'linhas', t: 'Linhas', ic: list }, { k: 'anexos', t: 'Anexos', ic: paperclip }],
    painel, ficha, gravar,
    porque: {
      novo: (e) => podeInv(e.perfil, 'criar') ? '' : 'O teu perfil só consulta os documentos de stock.',
      editar: (e, d) => !d ? 'Escolhe um documento na lista.' : !podeInv(e.perfil, 'editar') ? 'O teu perfil só consulta os documentos de stock.' : editavel(e, d) ? '' : d.anulado ? `Está anulad${o}: só se vê (Enter).` : `Já foi lançad${o}: não se altera; anula-se (F8) e faz-se outr${o}. Enter abre para ver.`,
      anular: (e, d) => !d ? 'Escolhe um documento na lista.' : !podeInv(e.perfil, 'anular') ? 'O teu perfil não anula documentos de stock.' : d.anulado ? `Já está anulad${o}.` : '',
    },
    anular: {
      texto: (d) => { const x = doc(d); return [`Anular ${o === 'a' ? 'a' : 'o'} ${x.ref}?`, x.estado === 'Lançado' ? `Já está lançad${o}: <b>${nf(quantidadeMov(x))} unidades ${entra ? 'saem do' : 'voltam ao'} ${esc(armazemDe(x.armazem))}</b>. Nada se apaga: fica no histórico, anulad${o}.` : `É um rascunho: nunca mexeu no stock. Nada se apaga: fica no histórico, anulad${o}.`]; },
      fazer: (e, d, motivo) => { const x = anularMov(e.perfil, String(d.ref), motivo); return `${x.ref} anulad${o}${x.lancado ? `: as quantidades ${entra ? 'saíram do' : 'voltaram ao'} stock` : ''}. Fica no histórico.`; },
    },
    docAnexo: (d) => d.id,
    teclas: [{ tecla: 'Ctrl+F2', acao: 'lancar' }],
    acao(r, e, k, b) {
      if (k === '_barra') { const t = porqueLancar_(e, ativoDe(r, e)), x = r.querySelector<HTMLElement>('.dv2-barra [data-dv2-acao="lancar"]'); if (x && !e.ocupado) { x.setAttribute('aria-disabled', String(!!t)); x.title = t || 'Lançar no stock (Ctrl+F2)'; } return true; }
      if (k === '_ficha-aberta') { recalcular(r); return true; }
      if (k === '_ficha-input') { const i = b as HTMLInputElement; if (i.dataset.dv2L === 'ref') { const tr = i.closest('tr')!, a = artigo(i.value.trim()); tr.querySelector('[data-dv2-l-desc]')!.textContent = a?.desc ?? ''; const c = tr.querySelector<HTMLInputElement>('[data-dv2-l="custo"]')!; if (a && !c.value.trim()) c.value = virgula(custoDe(a.ref)); } recalcular(r); return true; }
      if (k === 'lancar') { dlgLancar(r, e); return true; }
      if (k === 'lancar-sim') { void lancar(r, e, b); return true; }
      if (k === 'add-linha') { const tb = r.querySelector<HTMLElement>('[data-dv2-linhas]')!, i = tb.children.length; tb.insertAdjacentHTML('beforeend', linhaFicha(i)); const tr = tb.lastElementChild as HTMLElement; if (!quieto()) tr.animate([{ opacity: 0, transform: 'scaleY(.4)', transformOrigin: 'top' }, { opacity: 1, transform: 'none', transformOrigin: 'top' }], { duration: 180, easing: 'ease-out' }); tr.querySelector<HTMLElement>('input')?.focus(); if (e.ficha) e.ficha.sujo = true; return true; }
      if (k === 'del-linha') { const tr = b.closest('tr'), tb = tr?.parentElement; if (tr && tb && tb.children.length > 1) { tr.remove(); recalcular(r); if (e.ficha) e.ficha.sujo = true; (tb.querySelector('input') as HTMLElement | null)?.focus(); } else toast(r, 'O documento precisa de pelo menos um artigo.'); return true; }
      return false;
    },
    cenario(r, e, cen) {
      const ls = linhas(e), rasc = ls.find((d) => !d.lancado && !d.anulado), lanc = ls.find((d) => d.lancado);
      if (['lancar', 'a-lancar', 'lancar-falhou', 'editar'].includes(cen) && rasc) e.ativo = rasc.id;
      if (cen === 'lancado' && rasc) { e.ativo = rasc.id; e.extra.lancadoSim = rasc.id; }
      if (cen === 'ja-lancado' && lanc) { e.ativo = lanc.id; e.recusa = porqueLancar_(e, lanc); }
      if (cen === 'anular-lancado' && lanc) e.ativo = lanc.id;
      if (cen === 'anulado' && rasc) { e.extra.anuladoSim = rasc.id; e.ativo = rasc.id; e.aviso = `${rasc.ref} anulad${o}: «Contado outra vez: estava certo». Fica no histórico.`; }
      if (cen === 'gravado' && ls[0]) e.ativo = ls[0].id;
      requestAnimationFrame(() => {
        if (cen === 'lancar' || cen === 'a-lancar' || cen === 'lancar-falhou') dlgLancar(r, e, cen === 'lancar-falhou' ? 'O servidor não confirmou o lançamento (ERP-STK-504). Nada se repete sozinho: atualiza a lista (F9) antes de tentar outra vez.' : '');
        if (cen === 'a-lancar') { const bb = r.querySelector<HTMLElement>('[data-dv2-acao="lancar-sim"]'); if (bb) { bb.classList.add('is-carregar'); bb.setAttribute('aria-disabled', 'true'); bb.innerHTML = `${L(loader)}<span>A lançar…</span>`; } }
        if (cen === 'lancado' && rasc) { e.aviso = `${rasc.ref} lançad${o}: ${nf(rasc.qtd as number)} unidades ${entra ? 'entraram no' : 'saíram do'} ${armazemDe(String(rasc.armazem))}.`; tudo(r, e); }
        if (cen === 'anular-lancado') { const t = CFG.anular.texto(ativoDe(r, e)!); dialogo(r, `<h2 id="dv2-dlg-t" class="is-perigo">${L(ban)}${esc(t[0])}</h2><p>${t[1]}</p><label class="ak-campo dv2-motivo" for="dv2-motivo"><span>Motivo (obrigatório)</span><textarea id="dv2-motivo" rows="3" maxlength="300" data-dv2-motivo data-dv2-primeiro placeholder="Porque se anula — fica no histórico"></textarea></label><p class="ak-erro-campo" data-dv2-dlg-erro role="alert" hidden></p><div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar>${L(xIc)}<span>Manter</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--perigo" data-dv2-acao="anular-sim">${L(ban)}<span>Anular</span></button></div>`); }
      });
    },
    dica: 'Período e moeda juntam-se à pesquisa. Enter passa ao campo seguinte.',
  });

  const nota = `${def.titulo} (18 nov., da janela «${def.antigo}» do ERP antigo): as colunas do antigo (Número, Data de emissão, Observações, Valor total) mais o armazém, a quantidade e o estado, sem barra de lado; a ficha mostra o stock do armazém por linha${entra ? '' : ' e avisa quando não chega'}; Lançar no stock (Ctrl+F2, o «Actualizar (F11)» do antigo); Anular (F8) no lugar de Apagar.`;
  const N = def.num, X = entra ? 'acréscimo' : 'perda';
  const estados: [string, string, string][] = [
    ['carregar', `${N}.11 · A carregar`, 'A lista em esqueleto; a pesquisa e os filtros já servem.'],
    ['vazia', `${N}.12 · Sem documentos`, `Ainda não há ${X}s: Novo (F5).`],
    ['sem-resultados', `${N}.13 · Pesquisa sem resultados`, 'Diz em que modo se procurou e como se compara; oferece Contendo e Limpar.'],
    ['criar', `${N}.14 · Nov${o} ${X}`, `Novo (F5) abre a ficha numa janela: data, armazém, o motivo e os artigos com quantidade e custo${entra ? '' : '; avisa quando o armazém não tem que chegue'}.`],
    ['editar', `${N}.15 · Editar o rascunho`, 'Só o rascunho se altera.'],
    ['por-gravar', `${N}.16 · Alterações por gravar`, 'Fechar a ficha com alterações: continuar a editar ou descartar.'],
    ['a-gravar', `${N}.17 · A gravar`, 'O botão espera; nada se diz antes de as regras aceitarem.'],
    ['gravado', `${N}.18 · Gravad${o}`, 'A ficha fecha, a linha acende e a barra de estado diz o que se gravou.'],
    ['gravar-falhou', `${N}.19 · Gravar falhou`, 'O servidor não respondeu: as alterações ficam na ficha.'],
    ['lancar', `${N}.20 · Lançar no stock (Ctrl+F2)`, `O stock de hoje, o que ${entra ? 'entra' : 'sai'} e com quanto fica cada artigo; todos ou nenhum.`],
    ['a-lancar', `${N}.21 · A lançar`, 'O botão espera e o Cancelar desliga-se: não há lançamentos repetidos.'],
    ['lancado', `${N}.22 · Lançad${o}`, `O estado acende «Lançad${o}» e já não se altera.`],
    ['ja-lancado', `${N}.23 · Já lançad${o}`, 'Ctrl+F2 diz quando foi e como se corrige.'],
    ['lancar-falhou', `${N}.24 · O lançamento falhou`, 'Sem confirmação: nada se repete sozinho; atualizar antes de tentar outra vez.'],
    ['anular', `${N}.25 · Anular (F8)`, 'No lugar do «Apagar» do antigo: nada se apaga, pede o motivo.'],
    ['anular-lancado', `${N}.26 · Anular ${o === 'a' ? 'uma lançada' : 'um lançado'}`, `As quantidades ${entra ? 'saem do' : 'voltam ao'} armazém; diz-se antes quantas.`],
    ['anulado', `${N}.27 · Anulad${o}`, `Fica, com «Anulad${o}»; não se lança nem se altera.`],
    ['anexos', `${N}.28 · Anexos`, 'Fotografias e documentos que justificam o movimento.'],
    ['imprimir', `${N}.29 · Imprimir (F11)`, 'Imprime-se só a lista, com as colunas à vista.'],
    ['permissao', `${N}.30 · Sem permissão`, 'O perfil só consulta: as ações dizem porquê.'],
    ['sessao', `${N}.31 · Sessão terminada`, 'Voltar a entrar pelo login comum; o que estava escrito fica.'],
    ['offline', `${N}.32 · Sem ligação`, 'Sem rede: a pesquisa e os filtros ficam.'],
    ['servidor', `${N}.33 · Servidor indisponível`, 'O servidor dos stocks não respondeu: Tentar outra vez.'],
    ['restaurada', `${N}.34 · Área de trabalho reposta`, 'Ao voltar: a pesquisa, os filtros e o documento escolhido como estavam.'],
    ['janela', `${N}.35 · Documento numa janela`, 'Tocar num documento abre-o numa janela: Detalhes, Linhas e Anexos; a lista fica à vista.'],
    ['janelas', `${N}.36 · Várias janelas`, 'Vários documentos abertos em cascata; a da frente é a última tocada.'],
    ['maximizada', `${N}.37 · Janela maximizada`, 'Duplo clique no cabeçalho (ou o botão) enche o ecrã; outra vez, volta ao tamanho que tinha.'],
    ['editar-sujo', `${N}.38 · A editar, com alterações`, 'O ● no título diz que há alterações por gravar; fechar pergunta.'],
  ];
  const armazens = (): [string, string][] => ARMAZENS.map((a) => [a.cod, `${a.cod} · ${curto(a.cod)}`]);
  const versao = (cen = 'normal') => ({ id: 'v1', nota, html: paginaDoc(CFG, cen, armazens()) });
  return [
    { id: def.id, nome: `${N} · ${def.menu}`, fluxo: 'Stocks', objetivo: `${def.sub} O rascunho, Lançar no stock (Ctrl+F2) e Anular (F8).`, versoes: [versao()] as Ecra<IdErp>['versoes'] },
    ...estados.map(([cen, nome, objetivo]) => ({ id: `${def.pre}-${cen}` as IdErp, nome, fluxo: 'Stocks', estadoDe: def.id as IdErp, objetivo, versoes: [versao(cen)] as Ecra<IdErp>['versoes'] })),
  ] as Ecra<IdErp>[];
}

export type IdMov = 'stocks-acrescimos' | 'stocks-perdas' | `acr-${string}` | `qbr-${string}`;
export const ecrasMovimentos = (): Ecra<IdErp>[] => DEFS.flatMap(montar);
