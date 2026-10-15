/* =========================================================
   GOPARTS — 16 · Devoluções (15 out. 2026)
   Do briefing dela («ROMAFE Returns Management Center») e da nota que juntou («daria prioridade à criação de
   devoluções num fluxo guiado e à visualização cronológica […] os artigos a passarem da encomenda original para a
   lista de devolução»). O ecrã é da família dos Pedidos, Guias e Faturas (classes ped4__* dos filtros, da cronologia,
   da tabela e do painel; o que é só das devoluções tem dev__*):
   - CRONOLOGIA por ano e mês, da mais recente para a mais antiga; o estado por baixo da data e o marcador na cor dele.
   - ABRIR (clicar no cartão ou na linha): o painel lateral com os artigos devolvidos, o percurso da devolução (só os
     passos que os dados confirmam: criada, enviada, nota de crédito emitida), os documentos (Pedido → Guia → Devolução
     → Nota de crédito, só os que existem), os dados e as ações.
   - CRIAR DEVOLUÇÃO: um painel com três passos — a fatura (guia de remessa) de onde vêm os artigos; os artigos (cada
     um passa da fatura para a lista da devolução, como um carrinho ao contrário, com a quantidade até ao que ainda se
     pode devolver); rever, observações e enviar (ou guardar por enviar).
   Campos: os da tabela do GO REPAIR (n.º, data de criação, data de envio, total de referências, total de unidades,
   observações, utilizador). Não há estados nem valores inventados (devolucoes-dados.ts). O subtítulo trata o cliente
   por «você», como o resto do portal (o briefing tinha «tu»). Feito em TypeScript e CSS, sem React.
   Comportamento: comportamento/devolucoes.ts. CSS: css/devolucoes.css (+ css/pedidos-v4.css e css/guias-v3.css).
   ========================================================= */
import { DEVOLUCOES, referencias, unidades, estadoDev, NOME_ESTADO, type Devolucao, type EstadoDev } from './devolucoes-dados';
import { GUIAS, total as totalGuia, euros } from './guias-dados';
import { PEDIDOS } from './pedidos-dados';
import { azulejoPeca } from './pecas-img';
import { pilulasEstado } from './pedidos-v4';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import minus from 'lucide-static/icons/minus.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import filePen from 'lucide-static/icons/file-pen-line.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import shoppingCart from 'lucide-static/icons/shopping-cart.svg?raw';
import calendar from 'lucide-static/icons/calendar.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import barcode from 'lucide-static/icons/barcode.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import eraser from 'lucide-static/icons/eraser.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import table from 'lucide-static/icons/table.svg?raw';
import slidersHorizontal from 'lucide-static/icons/sliders-horizontal.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import save from 'lucide-static/icons/save.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import boxes from 'lucide-static/icons/boxes.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import arrowUpDown from 'lucide-static/icons/arrow-up-down.svg?raw';

export const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-i="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const aaaammdd = (d: string) => d.split('/').reverse().join('');
const id = (num: string) => num.replace(/\D/g, '');
export const devDe = (num: string) => DEVOLUCOES.find((d) => d.num === num)!;
const guiaDe = (num: string) => GUIAS.find((g) => g.num === num);
const temPedido = (num: string) => PEDIDOS.some((p) => p.num === num);
const plural = (n: number, um: string, varios: string) => `${n.toLocaleString('pt-PT')} ${n === 1 ? um : varios}`;

/* ---------- o estado: texto, ícone e cor (nunca só a cor) ---------- */
const ICONE_ESTADO: Record<EstadoDev, string> = { rascunho: filePen, enviada: send, creditada: circleCheck };
export const SELO = (e: EstadoDev) => `<span class="ped4__selo dev__selo dev__selo--${e}">${L(ICONE_ESTADO[e])}${NOME_ESTADO[e]}</span>`;
const quantidades = (d: Devolucao) => `<span class="dev__qtd"><b>${plural(referencias(d), 'referência', 'referências')}</b><small>${plural(unidades(d), 'unidade', 'unidades')}</small></span>`;

/** As pílulas «Estado»: só os três que os dados dizem. */
export function estadosDev(lista = DEVOLUCOES): string {
  const ks: EstadoDev[] = ['rascunho', 'enviada', 'creditada'];
  return pilulasEstado(ks.map((k) => ({ k, nome: NOME_ESTADO[k], icone: L(ICONE_ESTADO[k]), n: lista.filter((d) => estadoDev(d) === k).length })), lista.length);
}

/* ---------- uma devolução na cronologia ---------- */
export function itemDev(d: Devolucao, i: number): string {
  const [dia, m] = d.criada.split('/'), e = estadoDev(d);
  return `<li class="ped4__c-item dev__item" data-num="${d.num}" data-estado="${e}" style="--i:${i}">
      <span class="ped4__c-data" aria-hidden="true"><b>${dia}</b>${MESES[+m - 1].slice(0, 3)}<em class="ped4__c-etapa dev__etapa--${e}">${NOME_ESTADO[e]}</em></span>
      <span class="ped4__c-marca dev__marca" aria-hidden="true">${L(undo)}</span>
      <article class="ped4__c-cartao">
        <button type="button" class="ped4__c-cabeca dev__cabeca" aria-haspopup="dialog">
          <span class="ped4__c-id"><span class="ped4__ref">${d.num}</span><span class="sr-only">${NOME_ESTADO[e]}. </span><span class="ped4__c-meta">Criada ${d.criada} · ${d.enviada ? `enviada ${d.enviada}` : 'por enviar'} · ${esc(d.utilizador)}</span><span class="ped4__c-encontrado" hidden></span></span>
          <span class="dev__obs">${d.obs ? esc(d.obs) : '<span class="ped4__nada">Sem observações</span>'}</span>
          ${quantidades(d)}
          <span class="ped4__c-selos">${SELO(e)}</span>
          <span class="ped4__c-seta" aria-hidden="true">${L(chevronRight)}</span>
        </button>
      </article>
    </li>`;
}

export function cronologiaDev(lista = DEVOLUCOES): string {
  const meses = new Map<string, Devolucao[]>();
  [...lista].sort((a, b) => aaaammdd(b.criada).localeCompare(aaaammdd(a.criada)) || b.num.localeCompare(a.num)).forEach((d) => { const [, m, a] = d.criada.split('/'); const k = `${a}-${m}`; meses.set(k, [...(meses.get(k) || []), d]); });
  let i = 0, ano = '';
  return `<div class="ped4__crono gui3__crono dev__crono">
      <span class="ped4__c-linha" aria-hidden="true"><span class="ped4__c-linha-cheia"></span></span>
      ${Array.from(meses).map(([k, ds]) => {
        const [a, m] = k.split('-'), nomeMes = MESES[+m - 1];
        const cabAno = a !== ano ? `<h2 class="gui3__ano">${a}</h2>` : ''; ano = a;
        return `${cabAno}<section class="ped4__mes" data-mes="${k}" aria-label="${nomeMes} de ${a}"><h3 class="ped4__mes-t"><span>${nomeMes[0].toUpperCase()}${nomeMes.slice(1)} de ${a}</span><small><b>${ds.length}</b> ${ds.length === 1 ? 'devolução' : 'devoluções'}</small></h3><ol class="ped4__c-lista">${ds.map((d) => itemDev(d, i++)).join('')}</ol></section>`;
      }).join('')}
      <p class="ped4__c-fim"><span class="ped4__c-marca" aria-hidden="true"></span>Não há devoluções mais antigas neste período.</p>
    </div>`;
}

/* ---------- a tabela (a alternativa): as colunas todas do GO REPAIR, e o estado ---------- */
const ord = (k: string, t: string, cls = '') => `<th${cls ? ` class="${cls}"` : ''} aria-sort="none"><button type="button" class="ped4__ordenar" data-ordenar="${k}">${t}${L(arrowUpDown)}</button></th>`;
export function linhaDev(d: Devolucao, i: number): string {
  const e = estadoDev(d);
  return `<tr class="ped4__linha dev__linha" data-num="${d.num}" data-estado="${e}" data-data="${aaaammdd(d.criada)}" data-unid="${unidades(d)}" style="--i:${i}">
      <td class="ped4__c-abrir"><button type="button" class="ped4__abrir" aria-haspopup="dialog" aria-label="Abrir a devolução ${d.num}">${L(chevronRight)}</button></td>
      <td data-r="Devolução"><span class="ped4__ref">${d.num}</span></td><td data-r="Criada" class="ped4__data">${d.criada}</td>
      <td data-r="Enviada" class="ped4__data">${d.enviada || '<span class="ped4__nada">—</span>'}</td>
      <td data-r="Referências" class="ped4__num">${referencias(d)}</td><td data-r="Unidades" class="ped4__num">${unidades(d)}</td>
      <td data-r="Observações" class="ped4__c-obs">${d.obs ? esc(d.obs) : '<span class="ped4__nada">—</span>'}</td>
      <td data-r="Utilizador">${esc(d.utilizador)}</td><td data-r="Estado">${SELO(e)}</td>
    </tr>`;
}
export const tabelaDev = (lista = DEVOLUCOES) => `<div class="ped4__tabela gui3__tabela dev__tabela"><table>
        <thead><tr><th class="ped4__c-abrir"><span class="sr-only">Abrir</span></th>${ord('num', 'N.º devolução')}${ord('data', 'Data de criação')}<th>Data de envio</th><th class="ped4__num">Total ref.</th>${ord('unid', 'Total unid.', 'ped4__num')}<th class="ped4__c-obs">Observações</th><th>Utilizador</th><th>Estado</th></tr></thead>
        <tbody>${lista.map(linhaDev).join('')}</tbody>
      </table></div>`;

/* ---------- a devolução no painel ---------- */
/** Os artigos devolvidos, como a lista de compras das Guias e Faturas, ao contrário: a quantidade é o que conta. */
export function artigosDev(d: Devolucao): string {
  return `<ol class="fat2__linhas dev__linhas">${d.linhas.map(([q, desc], i) => `<li class="fat2__linha dev__linha-art" style="--i:${i}">${azulejoPeca(desc, 'fat2__l-i')}<span class="fat2__l-desc"><b>${esc(desc)}</b><small>Da guia ${d.origem}</small></span><span class="dev__l-q"><b>${q.toLocaleString('pt-PT')}</b> un.</span></li>`).join('')}</ol>
    <p class="dev__soma">${L(boxes)}<span><b>${plural(referencias(d), 'referência', 'referências')}</b> · <b>${plural(unidades(d), 'unidade', 'unidades')}</b> a devolver</span></p>`;
}

/** O percurso da devolução: só os passos que os dados confirmam, com a data. O que ainda não aconteceu fica a
    tracejado, sem data; não se diz «recebida» nem «em análise» porque os dados não o dizem. */
export function percursoDev(d: Devolucao): string {
  const nc = d.credito ? guiaDe(d.credito) : undefined;
  const passos: [string, string, string, boolean][] = [
    ['Devolução criada', d.criada, `por ${esc(d.utilizador)}`, true],
    d.enviada ? ['Enviada à Romafe', d.enviada, 'A Romafe recebeu o pedido de devolução', true] : ['Ainda não enviada', '', 'Está guardada por enviar; a Romafe só a vê depois de enviada', false],
  ];
  if (nc) passos.push(['Nota de crédito emitida', nc.data, `${nc.doc} · ${euros(totalGuia(nc))}`, true]);
  else if (d.enviada) passos.push(['Nota de crédito', '', 'Ainda não há nota de crédito desta devolução', false]);
  const feitos = passos.filter((p) => p[3]).length;
  return `<div class="dev__percurso" style="--enche:${passos.length > 1 ? ((feitos - 1) / (passos.length - 1)).toFixed(3) : 0}">
      <span class="dev__p-linha" aria-hidden="true"><i></i></span>
      <span class="dev__p-caixa" aria-hidden="true">${L(pkg)}</span>
      <ol class="dev__passos">${passos.map(([t, data, nota, ok]) => `<li class="dev__passo${ok ? ' is-feito' : ''}"><span class="dev__p-ponto" aria-hidden="true">${ok ? L(circleCheck) : L(clock)}</span><span class="dev__p-texto"><b>${t}</b>${data ? `<time>${data}</time>` : '<span class="dev__p-sem">Sem data</span>'}<small>${nota}</small></span></li>`).join('')}</ol>
    </div>`;
}

/** Os documentos: Pedido → Guia (fatura) → Devolução → Nota de crédito; só os que existem. */
export function documentosDev(d: Devolucao): string {
  const g = guiaDe(d.origem), nc = d.credito ? guiaDe(d.credito) : undefined;
  const no = (cls: string, icone: string, rot: string, num: string, extra = '', tag = 'button') => `<li><${tag}${tag === 'button' ? ' type="button"' : ''} class="gui3__no ${cls}"${extra}><span class="gui3__no-i">${L(icone)}</span><span><small>${rot}</small><b>${num}</b></span></${tag}></li>`;
  const seta = '<li class="gui3__seta" aria-hidden="true"><i class="gui3__fio"></i></li>';
  const nos = [
    g && temPedido(g.pedido) ? no('gui3__no--pedido', shoppingCart, 'Pedido', g.pedido, ` data-abrir-pedido="${g.pedido}"`) : g ? no('gui3__no--pedido gui3__no--indisponivel', shoppingCart, 'Pedido', g.pedido, '', 'span') : '',
    g ? no('gui3__no--fatura', receipt, `Guia · ${g.doc}`, g.num, ` data-abrir-guia="${g.num}"`) : '',
    no('gui3__no--atual', undo, 'Devolução', d.num, ' aria-current="true"', 'span'),
    nc ? no('gui3__no--credito', receipt, 'Nota de crédito', nc.doc, ` data-abrir-fatura="${nc.doc}"`) : '',
  ].filter(Boolean);
  return `<div class="gui3__percurso dev__docs"><ol class="gui3__nos">${nos.join(seta)}</ol>${nc ? '' : `<p class="gui3__ind">${L(info)}<span>${d.enviada ? 'A nota de crédito aparece aqui, ligada, quando a Romafe a emitir. O valor a creditar é o dela.' : 'Depois de enviada, a devolução segue para a Romafe; a nota de crédito, se houver, aparece aqui ligada.'}</span></p>`}</div>`;
}

export function cabecaDev(d: Devolucao, idNum = 'dev-g-num'): string {
  const e = estadoDev(d);
  return `<header class="ped4__g-cabeca"><div><p class="ped4__g-rotulo">Devolução · <span class="dev__etapa--${e}">${NOME_ESTADO[e]}</span></p><h2 class="ped4__g-num" id="${idNum}" tabindex="-1">${d.num}</h2><p class="ped4__g-meta">Criada ${d.criada} · ${esc(d.utilizador)} · ${plural(unidades(d), 'unidade', 'unidades')}</p></div><button type="button" class="ped4__g-fechar" aria-label="Fechar (Esc)">${L(x)}</button></header>`;
}
export function detalheDev(d: Devolucao): string {
  const e = estadoDev(d), nc = d.credito ? guiaDe(d.credito) : undefined;
  return `<div class="dev__det">
    <section aria-label="Artigos devolvidos"><h3 class="ped4__h">Artigos devolvidos <span>${referencias(d)}</span></h3>${artigosDev(d)}</section>
    <section aria-label="Percurso da devolução"><h3 class="ped4__h">Percurso da devolução</h3>${percursoDev(d)}</section>
    <section aria-label="Documentos"><h3 class="ped4__h">Documentos</h3>${documentosDev(d)}</section>
    <section aria-label="Dados da devolução"><h3 class="ped4__h">Dados da devolução</h3>
      <dl class="ped4__dl">
        <div><dt>N.º da devolução</dt><dd>${d.num}</dd></div><div><dt>Utilizador</dt><dd>${esc(d.utilizador)}</dd></div>
        <div><dt>Data de criação</dt><dd>${d.criada}</dd></div><div><dt>Data de envio</dt><dd>${d.enviada || '<span class="ped4__nada">Por enviar</span>'}</dd></div>
        <div><dt>Total de referências</dt><dd>${referencias(d)}</dd></div><div><dt>Total de unidades</dt><dd>${unidades(d)}</dd></div>
      </dl>
      ${d.obs ? `<p class="gui3__obs"><b>Observações</b>${esc(d.obs)}</p>` : ''}
    </section>
    <section class="dev__det-accoes" aria-label="Ações">
      <div class="ped4__det-accoes gui3__accoes">
        ${e === 'rascunho' ? `<button type="button" class="btn btn--acao btn--sm" data-enviar-dev="${d.num}">${L(send, 'btn__icone')}<span class="btn__rotulo">Enviar a devolução</span></button>` : ''}
        ${nc ? `<button type="button" class="btn btn--acao btn--sm" data-abrir-fatura="${nc.doc}">${L(receipt, 'btn__icone')}<span class="btn__rotulo">Ver a nota de crédito</span></button>` : ''}
        <button type="button" class="btn btn--ghost btn--sm" data-abrir-guia="${d.origem}">${L(fileText, 'btn__icone')}<span class="btn__rotulo">Abrir a guia de origem</span></button>
      </div>
      <p class="dev__aviso" role="status" hidden></p>
    </section>
  </div>`;
}

/* ---------- criar uma devolução: três passos num painel ---------- */
/** Quanto de uma linha da guia ainda se pode devolver: o faturado menos o que outras devoluções já levam. */
export function disponivel(origem: string, desc: string): { faturado: number; devolvido: number; livre: number } {
  const g = guiaDe(origem); const faturado = g?.linhas.find((l) => l[1] === desc)?.[0] ?? 0;
  const devolvido = DEVOLUCOES.filter((d) => d.origem === origem).reduce((s, d) => s + d.linhas.filter((l) => l[1] === desc).reduce((t, l) => t + l[0], 0), 0);
  return { faturado, devolvido, livre: Math.max(0, faturado - devolvido) };
}
export const guiasElegiveis = () => GUIAS.filter((g) => g.tipo === 'fatura');
const PASSOS = ['Fatura', 'Artigos', 'Rever e enviar'];
export function passosCriar(atual: number): string {
  return `<ol class="dev__passos-c" aria-label="Passos">${PASSOS.map((p, i) => `<li class="${i < atual ? 'is-feito' : i === atual ? 'is-atual' : ''}"${i === atual ? ' aria-current="step"' : ''}><span>${i < atual ? L(circleCheck) : i + 1}</span>${p}</li>`).join('')}<i class="dev__passos-risca" aria-hidden="true" style="--p:${atual}"></i></ol>`;
}
/** Passo 1: a guia de remessa (com a fatura) de onde vêm os artigos. */
export function passoFatura(escolhida = ''): string {
  return `<div class="dev__c-corpo" data-passo="0">
      <p class="dev__c-intro">De que fatura são os artigos? A devolução fica ligada a ela.</p>
      <div class="dev__c-guias" role="radiogroup" aria-label="Fatura de origem">${guiasElegiveis().map((g) => {
        const livres = g.linhas.filter((l) => disponivel(g.num, l[1]).livre > 0).length;
        return `<button type="button" class="dev__c-guia" role="radio" aria-checked="${g.num === escolhida}" data-origem="${g.num}"${livres ? '' : ' aria-disabled="true"'}>
          <span class="dev__c-g-i">${L(receipt)}</span>
          <span class="dev__c-g-t"><b>${g.doc}</b><small>Guia ${g.num} · ${g.data} · pedido ${g.pedido}</small></span>
          <span class="dev__c-g-n">${livres ? plural(livres, 'artigo', 'artigos') : 'Já devolvida'}</span>
        </button>`;
      }).join('')}</div>
      <p class="dev__c-erro" id="dev-c-erro-0" role="alert" hidden></p>
    </div>`;
}
/** Passo 2: os artigos da fatura à esquerda; a lista da devolução à direita (o carrinho ao contrário). */
export function passoArtigos(origem: string, escolhidos: [string, number][] = []): string {
  const g = guiaDe(origem)!;
  return `<div class="dev__c-corpo dev__c-dois" data-passo="1" data-origem="${origem}">
      <section class="dev__c-fonte" aria-label="Artigos da fatura ${g.doc}">
        <h3 class="ped4__h">Artigos da fatura ${g.doc}</h3>
        <ol class="dev__c-arts">${g.linhas.map(([q, desc]) => {
          const dsp = disponivel(origem, desc), ja = escolhidos.some((e) => e[0] === desc);
          return `<li class="dev__c-art${dsp.livre ? '' : ' is-indisponivel'}${ja ? ' is-escolhido' : ''}" data-desc="${esc(desc)}" data-livre="${dsp.livre}">
            ${azulejoPeca(desc, 'fat2__l-i')}
            <span class="fat2__l-desc"><b>${esc(desc)}</b><small>Faturado ${q} un.${dsp.devolvido ? ` · já devolvido ${dsp.devolvido}` : ''}</small></span>
            ${dsp.livre ? `<button type="button" class="btn btn--ghost btn--sm dev__c-por" data-por="${esc(desc)}"${ja ? ' disabled' : ''}>${L(plus, 'btn__icone')}<span class="btn__rotulo">${ja ? 'Na devolução' : 'Devolver'}</span></button>` : '<span class="dev__c-nao">Já devolvido</span>'}
          </li>`;
        }).join('')}</ol>
      </section>
      <section class="dev__c-cesto" aria-label="A devolver">
        <h3 class="ped4__h">A devolver <span class="dev__c-n">${escolhidos.length}</span></h3>
        <ol class="dev__c-lista">${escolhidos.map(([desc, q]) => linhaCesto(origem, desc, q)).join('')}</ol>
        <p class="dev__c-vazio"${escolhidos.length ? ' hidden' : ''}>${L(undo)}<span>Escolha à esquerda os artigos que vai devolver.</span></p>
        ${resumoCesto(escolhidos)}
        <p class="dev__c-erro" id="dev-c-erro-1" role="alert" hidden></p>
      </section>
    </div>`;
}
export function linhaCesto(origem: string, desc: string, q: number, erro = ''): string {
  const { livre } = disponivel(origem, desc), cid = `dev-q-${id(desc + origem)}-${desc.length}`;
  return `<li class="dev__c-linha${erro ? ' is-invalida' : ''}" data-desc="${esc(desc)}" data-livre="${livre}">
      ${azulejoPeca(desc, 'fat2__l-i')}
      <span class="fat2__l-desc"><b>${esc(desc)}</b><small>Até ${livre} un.</small></span>
      <span class="dev__c-qtd"><button type="button" class="dev__c-menos" aria-label="Menos uma unidade"${q <= 1 ? ' disabled' : ''}>${L(minus)}</button><input class="dev__c-q" id="${cid}" type="text" inputmode="numeric" value="${q}" aria-label="Unidades a devolver de ${esc(desc)}"${erro ? ` aria-invalid="true" aria-describedby="${cid}-e"` : ''}><button type="button" class="dev__c-mais" aria-label="Mais uma unidade"${q >= livre ? ' disabled' : ''}>${L(plus)}</button></span>
      <button type="button" class="dev__c-tirar" aria-label="Tirar ${esc(desc)} da devolução">${L(x)}</button>
      <small class="dev__c-q-erro" id="${cid}-e"${erro ? '' : ' hidden'}>${erro}</small>
    </li>`;
}
export function resumoCesto(escolhidos: [string, number][]): string {
  const u = escolhidos.reduce((s, e) => s + e[1], 0);
  return `<dl class="dev__c-resumo"><div><dt>Referências</dt><dd data-cesto="ref" data-valor="${escolhidos.length}">${escolhidos.length}</dd></div><div><dt>Unidades</dt><dd data-cesto="unid" data-valor="${u}">${u}</dd></div></dl>`;
}
/** Passo 3: rever, observações, e enviar ou guardar por enviar. */
export function passoRever(origem: string, escolhidos: [string, number][], obs = ''): string {
  const g = guiaDe(origem)!, u = escolhidos.reduce((s, e) => s + e[1], 0);
  return `<div class="dev__c-corpo" data-passo="2" data-origem="${origem}">
      <dl class="ped4__dl dev__c-rever-dl"><div><dt>Fatura</dt><dd>${g.doc} · guia ${g.num}</dd></div><div><dt>Pedido</dt><dd>${g.pedido}</dd></div><div><dt>Referências</dt><dd>${escolhidos.length}</dd></div><div><dt>Unidades</dt><dd>${u}</dd></div></dl>
      <ol class="fat2__linhas dev__linhas">${escolhidos.map(([desc, q]) => `<li class="fat2__linha dev__linha-art">${azulejoPeca(desc, 'fat2__l-i')}<span class="fat2__l-desc"><b>${esc(desc)}</b><small>Da guia ${g.num}</small></span><span class="dev__l-q"><b>${q}</b> un.</span></li>`).join('')}</ol>
      <div class="ped4__campo dev__c-obs"><label for="dev-c-obs">Observações <small>(o motivo da devolução; a Romafe lê-o)</small></label><textarea class="ped4__input" id="dev-c-obs" rows="3" maxlength="240" placeholder="Por exemplo: peça errada, danificada na entrega…">${esc(obs)}</textarea></div>
      <p class="gui3__ind">${L(info)}<span>Enviar não cria nota de crédito: a Romafe analisa a devolução e, se a aceitar, emite a nota de crédito, que aparece ligada a esta devolução.</span></p>
      <p class="dev__c-erro" id="dev-c-erro-2" role="alert" hidden></p>
    </div>`;
}
/** O pé do painel de criar: voltar e seguir (no último passo, guardar por enviar e enviar). */
export function peCriar(passo: number): string {
  const voltar = passo > 0 ? `<button type="button" class="btn btn--ghost" data-c-voltar>${L(arrowLeft, 'btn__icone')}<span class="btn__rotulo">Voltar</span></button>` : `<button type="button" class="btn btn--ghost" data-c-cancelar>${L(x, 'btn__icone')}<span class="btn__rotulo">Cancelar</span></button>`;
  const seguir = passo < 2
    ? `<button type="button" class="btn btn--acao" data-c-seguir>${L(arrowRight, 'btn__icone')}<span class="btn__rotulo">${passo === 0 ? 'Escolher os artigos' : 'Rever'}</span></button>`
    : `<button type="button" class="btn btn--ghost" data-c-guardar>${L(save, 'btn__icone')}<span class="btn__rotulo">Guardar por enviar</span></button><button type="button" class="btn btn--acao" data-c-enviar>${L(send, 'btn__icone')}<span class="btn__rotulo">Enviar a devolução</span></button>`;
  return `<footer class="dev__c-pe">${voltar}<span class="dev__c-pe-dir">${seguir}</span></footer>`;
}
export function cabecaCriar(idNum = 'dev-c-titulo'): string {
  return `<header class="ped4__g-cabeca"><div><p class="ped4__g-rotulo">Nova devolução</p><h2 class="ped4__g-num dev__c-titulo" id="${idNum}" tabindex="-1">Criar devolução</h2><p class="ped4__g-meta">Escolha a fatura, os artigos e as quantidades.</p></div><button type="button" class="ped4__g-fechar" aria-label="Fechar (Esc)">${L(x)}</button></header>`;
}
/** O painel de criar inteiro, num passo (os estados usam-no já montado). */
export function painelCriar(passo: number, origem = '', escolhidos: [string, number][] = [], obs = ''): string {
  const corpo = passo === 0 ? passoFatura(origem) : passo === 1 ? passoArtigos(origem, escolhidos) : passoRever(origem, escolhidos, obs);
  return `${cabecaCriar()}${passosCriar(passo)}${corpo}${peCriar(passo)}`;
}

const campo = (cid: string, rotulo: string, icone: string, extra: string) => `<div class="ped4__campo"><label for="${cid}">${rotulo}</label><span class="ped4__caixa">${L(icone)}<input class="ped4__input" id="${cid}" ${extra}></span><small class="ped4__erro" id="${cid}-erro" hidden></small></div>`;

export function devolucoesV1(vista: 'cronologia' | 'tabela' = 'cronologia', lista = DEVOLUCOES): string {
  const n = (k: EstadoDev) => lista.filter((d) => estadoDev(d) === k).length;
  return `<div class="portal portal--v3 portal--v22 portal--noite portal--dev">
  <main class="ped4 gui3 dev" data-devolucoes>
    <header class="ped4__cabeca dev__cabeca-pag">
      <div><h1 class="ped4__titulo">Devoluções</h1><p class="ped4__sub">Consulte e acompanhe os seus pedidos de devolução.</p></div>
      <div class="dev__topo-dir">
        <dl class="ped4__kpi">
          <div><dt>${L(layers)}Devoluções</dt><dd data-kpi="n" data-valor="${lista.length}">${lista.length}</dd></div>
          <div><dt>${L(filePen)}Por enviar</dt><dd data-kpi="rascunho" data-valor="${n('rascunho')}">${n('rascunho')}</dd></div>
          <div><dt>${L(send)}Enviadas</dt><dd data-kpi="enviada" data-valor="${n('enviada')}">${n('enviada')}</dd></div>
          <div><dt>${L(circleCheck)}Creditadas</dt><dd data-kpi="creditada" data-valor="${n('creditada')}">${n('creditada')}</dd></div>
        </dl>
        <button type="button" class="btn btn--acao dev__criar" data-criar-dev aria-haspopup="dialog">${L(plus, 'btn__icone')}<span class="btn__rotulo">Criar devolução</span></button>
      </div>
    </header>

    <section class="ped4__filtros" aria-label="Filtrar devoluções">
      <button type="button" class="btn btn--ghost btn--sm ped4__filtros-abrir" aria-expanded="false" aria-controls="dev-campos">${L(slidersHorizontal, 'btn__icone')}<span class="btn__rotulo">Filtros</span><span class="ped4__filtros-n" hidden></span></button>
      <form class="ped4__campos" id="dev-campos" novalidate>
        ${campo('dev-de', 'Data a partir de', calendar, 'type="text" value="01/03/2024" inputmode="numeric" placeholder="dd/mm/aaaa" autocomplete="off"')}
        ${campo('dev-ate', 'Data até', calendar, 'type="text" inputmode="numeric" placeholder="dd/mm/aaaa" autocomplete="off"')}
        ${campo('dev-num', 'N.º da devolução', hash, 'type="text" placeholder="DV2024/…" autocomplete="off"')}
        ${campo('dev-ref', 'Referência', barcode, 'type="text" placeholder="Referência da peça" autocomplete="off"')}
        <div class="ped4__botoes">
          <button type="button" class="btn btn--ghost ped4__limpar">${L(eraser, 'btn__icone')}<span class="btn__rotulo">Limpar</span></button>
          <button type="submit" class="btn btn--acao ped4__pesquisar">${L(search, 'btn__icone')}<span class="btn__rotulo">Pesquisar</span></button>
        </div>
      </form>
      <div class="ped4__baixo">
        ${estadosDev(lista)}
        <ul class="ped4__chips" aria-label="Filtros aplicados"></ul>
      </div>
    </section>

    <section class="ped4__lista" aria-label="Devoluções" data-vista="${vista}">
      <div class="ped4__lista-cabeca"><p class="ped4__conta" aria-live="polite">A mostrar <b>${lista.length}</b> de ${lista.length} devoluções</p><p class="ped4__a-atualizar" role="status" hidden></p><p class="gui3__mes-atual" aria-hidden="true"></p>
        <div class="ped4__vistas" role="group" aria-label="Ver como"><button type="button" class="ped4__vista" data-vista="cronologia" aria-pressed="${vista === 'cronologia'}">${L(history)}Cronologia</button><button type="button" class="ped4__vista" data-vista="tabela" aria-pressed="${vista === 'tabela'}">${L(table)}Tabela</button></div></div>
      ${cronologiaDev(lista)}
      ${tabelaDev(lista)}
      <div class="ped4__vazio" hidden></div>
      <p class="ped4__pe">Desde 01/03/2024 até hoje · as devoluções da conta, de todos os utilizadores</p>
    </section>

    <div class="ped4__veu" hidden></div>
    <aside class="ped4__gaveta gui3__gaveta dev__gaveta" role="dialog" aria-modal="true" aria-labelledby="dev-g-num" hidden></aside>
  </main>
</div>`;
}

/** O estado vazio de quem ainda não tem devoluções (não é o mesmo que «nenhuma com estes filtros»). */
export const vazioInicial = (icone = L(undo)) => `<div class="dev__vazio">${icone}<p><strong>Ainda não existem devoluções.</strong> Quando criar uma devolução, pode acompanhá-la aqui: o envio, a resposta da Romafe e a nota de crédito, quando houver.</p><button type="button" class="btn btn--acao btn--sm" data-criar-dev>${L(plus, 'btn__icone')}<span class="btn__rotulo">Criar devolução</span></button></div>`;
