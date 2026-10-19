/* =========================================================
   ERP · Compras — as páginas da fase 2 (19 out. 2026): requisições e pedidos de cotação
     16 · Requisições    — a lista (as minhas, para eu aprovar, por estado) e «Nova requisição».
     17 · Requisição     — pedir artigos (quantidade, custo estimado, para quando, porquê, anexos), submeter,
                           aprovar/rejeitar (quem pede não aprova), e converter em cotação ou encomenda.
     18 · Cotações       — os pedidos de cotação, com quantos fornecedores já responderam e o prazo.
     19 · Cotação        — o pedido (artigos, fornecedores, prazos), as respostas registadas, e a comparação
                           lado a lado, sem IVA: escolher uma proposta destaca-a, refaz o resumo e mostra o
                           passo seguinte (criar a encomenda), que só acontece depois de confirmar.
   Só desenha; o comportamento está em comportamento2.ts e as regras em dominio2.ts.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { ic } from '../inicio-icones';
import { casca, estadoPadrao, btn, type Estado, type Pagina } from '../inicio';
import { PERFIS, type IdPerfil } from '../inicio-dados';
import { esc, sem, PASSOS_COMPRAS, semAcesso, cabeca } from './ecras';
import { ARTIGOS, FORNECEDORES, artigo, fornecedor, stock, aCaminho, dia, euros, pct, HOJE, encomenda } from './dominio';
import {
  LIMITE_REQ, requisicoesDe, requisicao, cotacoes, cotacao, custoReq, semCusto, aprovadorDe, acoesReq, NOME_REQ, acoesPc, NOME_PC, semResposta, caducada, prazoPassou,
  avaliar, destaques, pode2, type Requisicao, type Cotacao, type EstadoReq, type EstadoPc, type Oferta,
} from './dominio2';

export type IdCompras3 = 'compras-requisicoes' | 'compras-requisicao' | 'compras-cotacoes' | 'compras-cotacao'
  | 'cp-req-aprovar' | 'cp-req-rejeitada' | 'cp-pc-comparar' | 'cp-pc-escolhida' | 'cp-pc-resposta';

const COR_REQ: Record<EstadoReq, string> = { 'Rascunho': 'rascunho', 'Em aprovação': 'aprovar', 'Aprovada': 'aprovada', 'Rejeitada': 'cancelada', 'Convertida': 'recebida', 'Encerrada': 'fechada' };
const COR_PC: Record<EstadoPc, string> = { 'Rascunho': 'rascunho', 'Enviado': 'emitida', 'Com respostas': 'aprovar', 'Decidido': 'recebida', 'Cancelado': 'cancelada' };
export const estadoReq = (r: Requisicao) => `<span class="cp-est cp-est--${COR_REQ[r.estado]}">${r.estado}</span>`;
export const estadoPc = (c: Cotacao) => `<span class="cp-est cp-est--${COR_PC[c.estado]}">${c.estado}</span>${prazoPassou(c) && semResposta(c).length ? `<span class="cp-est cp-est--atraso">${ic('clock')}Prazo passou</span>` : ''}`;
const ligDoc = (ref: string) => `<button type="button" class="cp-ligacao" data-ws-ir="${ref.startsWith('EF') ? 'compras-encomenda' : ref.startsWith('PC') ? 'compras-cotacao' : 'compras-requisicao'}" data-ws-ref="${ref}">${ref}</button>`;
const hist = (h: { quando: string; quem: string; acao: string; detalhe?: string; doc?: string }[]) => `<ol class="cp-hist">${h.slice().reverse().map((x) => `<li><span class="cp-hist__quando">${x.quando}</span><span class="cp-hist__quem">${esc(x.quem)}</span><span class="cp-hist__acao">${esc(x.acao)}${x.detalhe ? ` <span class="cp-fraco">· ${esc(x.detalhe)}</span>` : ''}</span>${x.doc ? ligDoc(x.doc) : ''}</li>`).join('')}</ol>`;
const ICONE: Record<string, string> = { submeter: 'send', aprovar: 'check', rejeitar: 'undo-2', cotar: 'list-checks', encomendar: 'file-plus-2', encerrar: 'x', duplicar: 'file-plus-2', enviar: 'send', responder: 'file-pen', escolher: 'circle-check', cancelar: 'x' };
const faixa = (tipo: '' | 'ok' | 'erro' | 'conflito', icone: string, html: string) => `<div class="cp-faixa${tipo ? ' cp-faixa--' + tipo : ''}" role="${tipo === 'erro' || tipo === 'conflito' ? 'alert' : 'status'}"${tipo === 'erro' ? ' tabindex="-1" data-cp-erros' : ''}>${ic(icone)}<div>${html}</div></div>`;
const erros = (m: string[], titulo: string) => m.length ? faixa('erro', 'circle-alert', `<p class="cp-faixa__titulo">${titulo}</p><ul>${m.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`) : '';
function percurso(passos: { nome: string; data?: string; feito: boolean; atual: boolean; doc?: string; fim?: boolean }[]): string {
  const feitos = passos.filter((p) => p.feito).length;
  return `<ol class="cp-percurso" style="--feitos: ${feitos}; --n: ${passos.length}">${passos.map((p) => {
    const corpo = `<span class="cp-passo__bola">${ic(p.fim ? 'x' : p.feito ? 'check' : 'circle-dot')}</span><span class="cp-passo__nome">${p.nome}</span><span class="cp-passo__data">${p.data ?? (p.atual ? 'agora' : '')}</span>`;
    return `<li class="cp-passo${p.feito ? ' is-feito' : ''}${p.atual ? ' is-atual' : ''}${p.fim ? ' is-cancelada' : ''}">${p.doc ? `<button type="button" class="cp-passo__btn" data-ws-ir="${p.doc.startsWith('EF') ? 'compras-encomenda' : 'compras-cotacao'}" data-ws-ref="${p.doc}" aria-label="${p.nome}: abrir ${p.doc}">${corpo}</button>` : corpo}</li>`;
  }).join('')}</ol>`;
}
const quando = (h: { acao: string; quando: string }[], re: RegExp) => h.slice().reverse().find((x) => re.test(x.acao))?.quando.slice(0, 10);

/* ---------- 16 · Requisições ---------- */
export type FiltroReq = 'todas' | 'aprovar' | 'minhas' | 'em-aprovacao' | 'aprovadas' | 'rascunhos' | 'rejeitadas' | 'convertidas';
const FILTROS_REQ: [FiltroReq, string, (r: Requisicao, p: IdPerfil) => boolean][] = [
  ['todas', 'Todas', () => true],
  ['aprovar', 'Para eu aprovar', (r, p) => r.estado === 'Em aprovação' && r.aprovador === p],
  ['minhas', 'As minhas', (r, p) => r.requerente === p],
  ['em-aprovacao', 'Em aprovação', (r) => r.estado === 'Em aprovação'],
  ['aprovadas', 'Aprovadas', (r) => r.estado === 'Aprovada'],
  ['rascunhos', 'Rascunhos', (r) => r.estado === 'Rascunho'],
  ['rejeitadas', 'Rejeitadas', (r) => r.estado === 'Rejeitada'],
  ['convertidas', 'Convertidas', (r) => r.estado === 'Convertida' || r.estado === 'Encerrada'],
];
export function tabelaReq(p: IdPerfil, f: FiltroReq, q: string): string {
  const s = sem(q.trim()), fn = FILTROS_REQ.find((x) => x[0] === f)![2];
  const l = requisicoesDe(p).filter((r) => fn(r, p) && (!s || sem(`${r.ref} ${PERFIS[r.requerente].pessoa} ${r.departamento} ${r.justificacao} ${r.linhas.map((x) => `${x.ref} ${artigo(x.ref)?.desc}`).join(' ')}`).includes(s)));
  if (!l.length) return `<div class="cp-vazio cp-vazio--curto" data-cp-tabela>${ic('search', 'cp-vazio__icone')}<p class="cp-vazio__titulo">${f === 'aprovar' ? 'Nada para aprovares' : 'Nenhuma requisição aqui'}</p><p class="cp-vazio__texto">${q ? `Nada com «${esc(q)}».` : 'Muda o filtro ou cria uma requisição.'}</p></div>`;
  return `<div class="cp-tabela-rolo" data-cp-tabela><table class="cp-tabela"><caption class="sr-only">Requisições: ${l.length}</caption>
    <thead><tr><th scope="col">Requisição</th><th scope="col">Pedida por</th><th scope="col">Data</th><th scope="col">Precisa em</th><th scope="col">Artigos</th><th scope="col" class="cp-num">Estimado s/ IVA</th><th scope="col">Aprova</th><th scope="col">Estado</th></tr></thead>
    <tbody>${l.map((r) => `<tr class="cp-linha" data-cp-abrir-ir="compras-requisicao" data-cp-abrir-ref="${r.ref}">
      <td data-rotulo="Requisição"><button type="button" class="cp-ref-btn" data-ws-ir="compras-requisicao" data-ws-ref="${r.ref}"><span class="cp-ref">${r.ref}</span></button></td>
      <td data-rotulo="Pedida por"><span class="cp-forte">${PERFIS[r.requerente].pessoa}</span><span class="cp-fraco">${esc(r.departamento)}</span></td>
      <td data-rotulo="Data" class="cp-data">${dia(r.data)}</td>
      <td data-rotulo="Precisa em" class="cp-data${r.necessaria < HOJE && ['Em aprovação', 'Aprovada'].includes(r.estado) ? ' cp-atraso' : ''}">${dia(r.necessaria)}</td>
      <td data-rotulo="Artigos">${r.linhas.map((x) => `<span class="cp-ref">${esc(x.ref)}</span> × ${x.qtd}`).slice(0, 2).join('<br>')}${r.linhas.length > 2 ? `<span class="cp-fraco">e mais ${r.linhas.length - 2}</span>` : ''}</td>
      <td data-rotulo="Estimado s/ IVA" class="cp-num">${euros(custoReq(r))}${semCusto(r) ? `<span class="cp-fraco">${semCusto(r)} sem custo</span>` : ''}</td>
      <td data-rotulo="Aprova">${r.aprovador ? PERFIS[r.aprovador].pessoa : '<span class="cp-fraco">—</span>'}</td>
      <td data-rotulo="Estado">${estadoReq(r)}</td></tr>`).join('')}</tbody></table></div>`;
}
function paginaReqs(e: Estado, f: FiltroReq, q: string): Pagina {
  const p = e.perfil, todas = requisicoesDe(p);
  const conta = (x: FiltroReq) => todas.filter((r) => FILTROS_REQ.find((y) => y[0] === x)![2](r, p)).length;
  return { onde: 'compras-requisicoes', caminho: PASSOS_COMPRAS('Requisições'), html: `<main class="cp" data-cp-pagina="requisicoes">
    ${cabeca('Requisições de compra', pode2(p, 'req-ver-todas') ? 'O que os departamentos pedem para comprar. Quem pede não aprova.' : 'As tuas requisições e as que tens para aprovar.', btn('Nova requisição', 'file-plus-2', { attrs: 'data-cp-nova-req' }))}
    ${conta('aprovar') ? `<div class="cp-resumo"><button type="button" class="cp-resumo__item cp-resumo__item--atraso" data-cp-freq="aprovar"><b>${conta('aprovar')}</b> à espera da tua aprovação</button>${pode2(p, 'req-converter') && conta('aprovadas') ? `<button type="button" class="cp-resumo__item" data-cp-freq="aprovadas"><b>${conta('aprovadas')}</b> aprovadas por converter</button>` : ''}</div>` : ''}
    <section class="cp-caixa">
      <div class="cp-barra-ferr">
        <div class="cp-filtros" role="group" aria-label="Filtrar">${FILTROS_REQ.map(([x, nome]) => { const n = conta(x); return x === 'todas' || n ? `<button type="button" class="cp-filtro${x === 'aprovar' ? ' cp-filtro--atraso' : ''}" aria-pressed="${f === x}" data-cp-freq="${x}">${nome}<span class="cp-filtro__n">${n}</span></button>` : ''; }).join('')}</div>
        <div class="cp-procura">${ic('search', 'cp-procura__lupa')}<input type="search" class="cp-procura__campo" placeholder="Requisição, pessoa, artigo" aria-label="Procurar requisições" value="${esc(q)}" data-cp-qreq></div>
      </div>
      ${tabelaReq(p, f, q)}
    </section>
  </main>` };
}

/* ---------- 17 · Requisição ---------- */
export interface EdReq { r: Requisicao; versao: number; sujo: boolean; erros: string[]; conflito: boolean }
export function linhasReq(ed: EdReq, p: IdPerfil): string {
  const r = ed.r, edita = acoesReq(r, p).includes('editar');
  if (!r.linhas.length) return `<div class="cp-vazio cp-vazio--curto" data-cp-linhas>${ic('boxes', 'cp-vazio__icone')}<p class="cp-vazio__titulo">Ainda sem artigos</p><p class="cp-vazio__texto">Junta o que precisas; o custo estimado vem do último preço, e muda-se se souberes melhor.</p>${edita ? btn('Juntar artigo', 'plus', { cls: 'btn--ghost btn--sm', attrs: 'data-cp-juntar-req' }) : ''}</div>`;
  return `<div class="cp-tabela-rolo" data-cp-linhas><table class="cp-tabela cp-tabela--linhas${edita ? ' is-edita' : ''}"><caption class="sr-only">Artigos da ${r.ref}</caption>
    <thead><tr><th scope="col">Artigo</th><th scope="col">Fornecedor habitual</th><th scope="col" class="cp-num">Stock</th><th scope="col" class="cp-num">A caminho</th><th scope="col" class="cp-num">Quantidade</th><th scope="col" class="cp-num">Custo estimado</th><th scope="col" class="cp-num">Total</th>${edita ? '<th scope="col"><span class="sr-only">Tirar</span></th>' : ''}</tr></thead>
    <tbody>${r.linhas.map((l) => { const a = artigo(l.ref), errQ = ed.erros.some((m) => m.startsWith(l.ref + ': a quantidade')); return `<tr data-cp-l="${l.id}">
      <td data-rotulo="Artigo"><span class="cp-ref">${esc(l.ref)}</span><span class="cp-fraco">${esc(a?.desc ?? '')} · ${esc(a?.marca ?? '')}</span></td>
      <td data-rotulo="Fornecedor habitual">${esc(fornecedor(a?.forn ?? '')?.nome ?? '—')}</td>
      <td data-rotulo="Stock" class="cp-num">${stock(l.ref).toLocaleString('pt-PT')}</td>
      <td data-rotulo="A caminho" class="cp-num">${aCaminho(l.ref).toLocaleString('pt-PT') || '—'}</td>
      <td data-rotulo="Quantidade" class="cp-num">${edita ? `<input class="cp-celula${errQ ? ' is-erro' : ''}" inputmode="numeric" data-cp-rq="qtd" data-cp-linha="${l.id}" value="${l.qtd}" aria-label="Quantidade de ${esc(l.ref)}">` : l.qtd.toLocaleString('pt-PT')} <span class="cp-fraco cp-un">${esc(a?.un ?? '')}</span></td>
      <td data-rotulo="Custo estimado" class="cp-num">${edita ? `<input class="cp-celula" inputmode="decimal" data-cp-rq="custo" data-cp-linha="${l.id}" value="${l.custo === null ? '' : (l.custo / 100).toFixed(2).replace('.', ',')}" placeholder="Sem custo" aria-label="Custo estimado de ${esc(l.ref)}">` : l.custo === null ? '<span class="cp-falta">Sem custo</span>' : euros(l.custo)}</td>
      <td data-rotulo="Total" class="cp-num cp-forte" data-cp-liq="${l.id}">${l.custo === null ? '—' : euros(l.qtd * l.custo)}</td>
      ${edita ? `<td><button type="button" class="ws-ibtn ws-ibtn--sm" aria-label="Tirar ${esc(l.ref)}" data-cp-tirar-req="${l.id}">${ic('x')}</button></td>` : ''}
    </tr>`; }).join('')}</tbody></table></div>`;
}
export function resumoReq(r: Requisicao): string {
  const ap = r.aprovador ?? aprovadorDe(r);
  return `<aside class="cp-resumo-fin" data-cp-resumo aria-labelledby="cp-rq-res"><h2 class="cp-bloco__titulo" id="cp-rq-res">Resumo</h2>
    <dl class="cp-contas"><div class="cp-contas__total"><dt>Estimado s/ IVA</dt><dd data-cp-total="base">${euros(custoReq(r))}</dd></div></dl>
    ${semCusto(r) ? `<p class="cp-aviso cp-aviso--erro">${ic('circle-alert')}${semCusto(r)} ${semCusto(r) === 1 ? 'artigo sem custo' : 'artigos sem custo'}: o estimado é por baixo.</p>` : ''}
    <p class="cp-aviso" data-cp-aprovador>${ic('shield-check')}${r.estado === 'Rascunho' ? `Ao submeter, aprova ${PERFIS[ap].pessoa} (${PERFIS[ap].nome}): ${custoReq(r) > LIMITE_REQ ? `acima de ${euros(LIMITE_REQ)}` : r.requerente === 'compras' || r.requerente === 'admin' ? 'quem pede não aprova a sua' : `até ${euros(LIMITE_REQ)}`}.` : r.aprovador ? `Aprovação de ${PERFIS[r.aprovador].pessoa} (${PERFIS[r.aprovador].nome}).` : ''}</p>
    <dl class="cp-cond"><div><dt>Pedida por</dt><dd>${PERFIS[r.requerente].pessoa} · ${esc(r.departamento)}</dd></div><div><dt>Data</dt><dd>${dia(r.data)}</dd></div>${r.destino.length ? `<div><dt>Deu origem a</dt><dd>${r.destino.map(ligDoc).join(' · ')}</dd></div>` : ''}</dl>
  </aside>`;
}
function paginaReq(e: Estado, ed: EdReq | null, ref: string): Pagina {
  const p = e.perfil, base = PASSOS_COMPRAS('Requisições');
  if (!ed) return { onde: 'compras-requisicoes', caminho: [...base, { nome: ref || '—' }], html: `<main class="cp"><div class="cp-vazio" role="alert">${ic('search', 'cp-vazio__icone')}<p class="cp-vazio__titulo">Não há a requisição ${esc(ref)}</p>${btn('Ver as requisições', 'arrow-right', { cls: 'btn--ghost btn--sm', attrs: 'data-ws-ir="compras-requisicoes"' })}</div></main>` };
  const r = ed.r;
  if (!pode2(p, 'req-ver-todas') && r.requerente !== p && r.aprovador !== p) return { onde: 'compras-requisicoes', caminho: [...base, { nome: r.ref }], html: `<main class="cp">${semAcesso('esta requisição')}</main>` };
  const acoes = acoesReq(r, p), edita = acoes.includes('editar');
  const princ = acoes.filter((a) => ['submeter', 'aprovar', 'cotar', 'encomendar'].includes(a)), sec = acoes.filter((a) => ['rejeitar', 'encerrar', 'duplicar'].includes(a));
  const fim = r.estado === 'Rejeitada' || r.estado === 'Encerrada';
  const ordem: EstadoReq[] = ['Rascunho', 'Em aprovação', 'Aprovada', 'Convertida'], i = ordem.indexOf(r.estado);
  const passos = fim
    ? [{ nome: 'Rascunho', data: quando(r.historico, /Criou/), feito: true, atual: false }, { nome: 'Aprovação', data: quando(r.historico, /Submeteu/), feito: true, atual: false }, { nome: r.estado, data: quando(r.historico, /Rejeitou|Encerrou/), feito: false, atual: true, fim: true }]
    : [{ nome: 'Rascunho', data: quando(r.historico, /Criou/), feito: i > 0, atual: i === 0 }, { nome: 'Aprovação', data: quando(r.historico, /Aprovou|Submeteu/), feito: i >= 2, atual: i === 1 }, { nome: 'Aprovada', data: quando(r.historico, /Aprovou/), feito: i >= 3, atual: i === 2 }, { nome: 'Convertida', data: quando(r.historico, /Converteu/), feito: i === 3, atual: false, doc: r.destino[r.destino.length - 1] }];
  const aviso = r.estado === 'Em aprovação' ? (r.aprovador === p && r.requerente !== p ? faixa('', 'shield-check', `<p class="cp-faixa__titulo">A aprovação é tua</p><p class="cp-texto">${PERFIS[r.requerente].pessoa} (${esc(r.departamento)}) precisa disto até ${dia(r.necessaria)}.</p>`) : faixa('', 'clock', `<p class="cp-texto">À espera de ${PERFIS[r.aprovador!].pessoa} (${PERFIS[r.aprovador!].nome}).</p>`))
    : r.estado === 'Rejeitada' ? faixa('erro', 'undo-2', `<p class="cp-faixa__titulo">Rejeitada por ${esc(r.historico.slice().reverse().find((h) => h.acao === 'Rejeitou')?.quem ?? '')}</p><p class="cp-texto">${esc(r.historico.slice().reverse().find((h) => h.acao === 'Rejeitou')?.detalhe?.replace(/ · Em aprovação → Rejeitada$/, '') ?? '')}</p><p class="cp-texto cp-fraco">A decisão fica no histórico. Para pedir outra vez, duplica e corrige.</p>`).replace(' tabindex="-1" data-cp-erros', '')
    : r.estado === 'Aprovada' && pode2(p, 'req-converter') ? faixa('ok', 'circle-check', '<p class="cp-texto">Aprovada. Pede uma cotação se queres comparar fornecedores, ou cria já a encomenda ao fornecedor habitual de cada artigo.</p>') : '';
  return { onde: 'compras-requisicoes', caminho: [...base, { nome: r.ref }], html: `<main class="cp cp--editor" data-cp-pagina="requisicao" data-cp-ref="${r.ref}">
    ${ed.conflito ? faixa('conflito', 'triangle-alert', `<p class="cp-texto">Alguém guardou a ${r.ref} depois de a abrires; as tuas alterações não foram guardadas.</p>${btn('Recarregar', 'rotate-ccw', { cls: 'btn--ghost btn--sm', attrs: 'data-cp-recarregar-req' })}`) : ''}
    ${erros(ed.erros, 'Antes de submeter, falta:')}
    <header class="cp-doc"><div class="cp-doc__id"><p class="cp-doc__tipo">Requisição de compra</p><h1 class="cp-doc__ref"><span style="view-transition-name: ws-doc">${r.ref}</span></h1>
      <p class="cp-doc__linha"><span>${PERFIS[r.requerente].pessoa} · ${esc(r.departamento)}</span>${estadoReq(r)}<span class="cp-fraco">versão ${r.versao}</span>${ed.sujo ? '<span class="cp-sujo" data-cp-sujo>Alterações por guardar</span>' : ''}</p></div>
      <div class="cp-doc__accoes">
        ${edita ? btn('Guardar', 'check', { cls: 'btn--ghost', attrs: `data-cp-guardar-req${ed.sujo ? '' : ' disabled'}` }) : ''}
        ${princ.map((a) => btn(NOME_REQ[a], ICONE[a], { attrs: `data-cp-req="${a}"` })).join('')}
        ${sec.length ? `<div class="cp-mais"><button type="button" class="btn btn--ghost" data-cp-mais aria-haspopup="true" aria-expanded="false">${ic('chevron-down', 'btn__icone')}<span class="btn__rotulo">Mais</span></button><div class="cp-mais__menu" role="menu" hidden>${sec.map((a) => `<button type="button" role="menuitem" class="ws-menu__item" data-cp-req="${a}">${ic(ICONE[a])}${NOME_REQ[a]}</button>`).join('')}</div></div>` : ''}
      </div></header>
    ${percurso(passos)}
    ${aviso}
    <div class="cp-editor">
      <div class="cp-editor__principal">
        <section class="cp-caixa cp-campos" aria-labelledby="cp-rq-cab"><h2 class="cp-bloco__titulo" id="cp-rq-cab">O pedido</h2>
          <div class="cp-grelha">
            <label class="cp-campo"><span class="cp-campo__rotulo">Precisa em <span class="cp-obrig" aria-hidden="true">*</span></span>${edita ? `<input type="date" class="cp-input" data-cp-rq="necessaria" value="${r.necessaria}" min="${HOJE}">` : `<span class="cp-campo__valor">${dia(r.necessaria)}</span>`}</label>
            <label class="cp-campo"><span class="cp-campo__rotulo">Centro de custo</span>${edita ? `<input class="cp-input" data-cp-rq="centro" value="${esc(r.centro)}" placeholder="Se a contabilidade usar">` : `<span class="cp-campo__valor">${esc(r.centro || '—')}</span>`}</label>
            <div class="cp-campo"><span class="cp-campo__rotulo">Departamento</span><span class="cp-campo__valor">${esc(r.departamento)}</span></div>
          </div>
          <label class="cp-campo cp-campo--largo"><span class="cp-campo__rotulo">Porque precisas <span class="cp-obrig" aria-hidden="true">*</span></span>${edita ? `<textarea class="cp-input cp-notas${ed.erros.some((m) => m.startsWith('Explica')) ? ' is-erro' : ''}" rows="3" data-cp-rq="justificacao" placeholder="Quem aprova lê isto: o que falta, para quê, e o que acontece se não vier.">${esc(r.justificacao)}</textarea>` : `<p class="cp-texto">${esc(r.justificacao) || '<span class="cp-fraco">—</span>'}</p>`}</label>
        </section>
        <section class="cp-caixa" aria-labelledby="cp-rq-lin"><header class="cp-bloco__cabeca"><h2 class="cp-bloco__titulo" id="cp-rq-lin">Artigos <span class="cp-fraco" data-cp-n-linhas>${r.linhas.length}</span></h2>${edita && r.linhas.length ? btn('Juntar artigo', 'plus', { cls: 'btn--ghost btn--sm', attrs: 'data-cp-juntar-req aria-keyshortcuts="Alt+A"' }) : ''}</header>${linhasReq(ed, p)}</section>
        <section class="cp-caixa" aria-labelledby="cp-rq-anx"><header class="cp-bloco__cabeca"><h2 class="cp-bloco__titulo" id="cp-rq-anx">Anexos <span class="cp-fraco">${r.anexos.length}</span></h2>${edita ? `<label class="btn btn--ghost btn--sm cp-anexar">${ic('plus', 'btn__icone')}<span class="btn__rotulo">Juntar ficheiro</span><input type="file" multiple data-cp-anexar class="sr-only"></label>` : ''}</header>
          ${r.anexos.length ? `<ul class="cp-lista-docs cp-anexos">${r.anexos.map((a, k) => `<li class="cp-mov">${ic('file-text')}<span>${esc(a.nome)}</span><span class="cp-fraco">${(a.tamanho / 1024).toLocaleString('pt-PT', { maximumFractionDigits: 0 })} KB</span>${edita ? `<button type="button" class="ws-ibtn ws-ibtn--sm" aria-label="Tirar ${esc(a.nome)}" data-cp-tirar-anexo="${k}">${ic('x')}</button>` : '<span></span>'}</li>`).join('')}</ul>` : '<p class="cp-texto cp-fraco">Sem anexos.</p>'}
          <p class="cp-texto cp-fraco">No protótipo guarda-se só o nome e o tamanho do ficheiro; o ficheiro em si precisa do servidor.</p></section>
        <section class="cp-caixa" aria-labelledby="cp-rq-h"><h2 class="cp-bloco__titulo" id="cp-rq-h">Histórico e decisões</h2>${hist(r.historico)}</section>
      </div>
      ${resumoReq(r)}
    </div>
  </main>` };
}

/* ---------- 18 · Cotações ---------- */
export type FiltroPc = 'todos' | 'rascunho' | 'espera' | 'respostas' | 'decididos' | 'cancelados';
const FILTROS_PC: [FiltroPc, string, (c: Cotacao) => boolean][] = [
  ['todos', 'Todos', (c) => c.estado !== 'Cancelado'], ['rascunho', 'Rascunhos', (c) => c.estado === 'Rascunho'], ['espera', 'À espera de resposta', (c) => c.estado === 'Enviado'],
  ['respostas', 'Com respostas', (c) => c.estado === 'Com respostas'], ['decididos', 'Decididos', (c) => c.estado === 'Decidido'], ['cancelados', 'Cancelados', (c) => c.estado === 'Cancelado'],
];
export function tabelaPc(f: FiltroPc): string {
  const l = cotacoes().filter(FILTROS_PC.find((x) => x[0] === f)![2]);
  if (!l.length) return `<div class="cp-vazio cp-vazio--curto" data-cp-tabela><p class="cp-vazio__texto">Nenhum pedido neste filtro.</p></div>`;
  return `<div class="cp-tabela-rolo" data-cp-tabela><table class="cp-tabela"><caption class="sr-only">Pedidos de cotação</caption>
    <thead><tr><th scope="col">Pedido</th><th scope="col">Artigos</th><th scope="col">Fornecedores</th><th scope="col">Responder até</th><th scope="col">Entrega desejada</th><th scope="col">Origem</th><th scope="col">Estado</th></tr></thead>
    <tbody>${l.map((c) => `<tr class="cp-linha${prazoPassou(c) && semResposta(c).length ? ' is-atraso' : ''}" data-cp-abrir-ir="compras-cotacao" data-cp-abrir-ref="${c.ref}">
      <td data-rotulo="Pedido"><button type="button" class="cp-ref-btn" data-ws-ir="compras-cotacao" data-ws-ref="${c.ref}"><span class="cp-ref">${c.ref}</span></button></td>
      <td data-rotulo="Artigos">${c.linhas.map((x) => `<span class="cp-ref">${esc(x.ref)}</span> × ${x.qtd.toLocaleString('pt-PT')}`).join('<br>')}</td>
      <td data-rotulo="Fornecedores"><span class="cp-forte">${c.ofertas.length} de ${c.fornecedores.length} responderam</span><span class="cp-fraco">${c.fornecedores.map((x) => esc(fornecedor(x)?.nome ?? x)).join(', ') || '—'}</span></td>
      <td data-rotulo="Responder até" class="cp-data${prazoPassou(c) && semResposta(c).length ? ' cp-atraso' : ''}">${dia(c.prazoResposta)}</td>
      <td data-rotulo="Entrega desejada" class="cp-data">${dia(c.entrega)}</td>
      <td data-rotulo="Origem">${c.origem.map(ligDoc).join(', ') || '<span class="cp-fraco">manual</span>'}</td>
      <td data-rotulo="Estado">${estadoPc(c)}${c.encomenda ? `<span class="cp-fraco">→ ${c.encomenda}</span>` : ''}</td></tr>`).join('')}</tbody></table></div>`;
}
function paginaPcs(e: Estado, f: FiltroPc): Pagina {
  const p = e.perfil;
  if (!pode2(p, 'pc-ver')) return { onde: 'compras-cotacoes', caminho: PASSOS_COMPRAS('Cotações'), html: `<main class="cp">${semAcesso('Cotações')}</main>` };
  const conta = (x: FiltroPc) => cotacoes().filter(FILTROS_PC.find((y) => y[0] === x)![2]).length;
  return { onde: 'compras-cotacoes', caminho: PASSOS_COMPRAS('Cotações'), html: `<main class="cp" data-cp-pagina="cotacoes">
    ${cabeca('Pedidos de cotação', 'Pedir preço e prazo a vários fornecedores e comparar antes de encomendar. O ERP ainda não manda correio: exporta o pedido e manda-o tu.', pode2(p, 'pc-gerir') ? btn('Novo pedido', 'file-plus-2', { attrs: 'data-cp-novo-pc' }) : '')}
    <section class="cp-caixa"><div class="cp-barra-ferr"><div class="cp-filtros" role="group" aria-label="Estado">${FILTROS_PC.map(([x, nome]) => { const n = conta(x); return x === 'todos' || n ? `<button type="button" class="cp-filtro" aria-pressed="${f === x}" data-cp-fpc="${x}">${nome}<span class="cp-filtro__n">${n}</span></button>` : ''; }).join('')}</div></div>
      ${tabelaPc(f)}</section>
  </main>` };
}

/* ---------- 19 · Cotação ---------- */
export interface EdPc { c: Cotacao; versao: number; sujo: boolean; erros: string[]; conflito: boolean; escolha: string | null; ordem: 'pedido' | 'total' | 'prazo' }
export function comparacao(ed: EdPc, p: IdPerfil): string {
  const c = ed.c;
  if (!c.ofertas.length) return `<div class="cp-vazio cp-vazio--curto" data-cp-comparar>${ic('clock', 'cp-vazio__icone')}<p class="cp-vazio__titulo">Ainda sem respostas</p><p class="cp-vazio__texto">${c.estado === 'Rascunho' ? 'Primeiro marca o pedido como enviado.' : 'Quando um fornecedor responder, regista a proposta: aparece aqui, ao lado das outras.'}</p></div>`;
  const d = destaques(c);
  let of = c.ofertas.map((o) => ({ o, a: avaliar(c, o) }));
  if (ed.ordem === 'total') of = of.sort((x, y) => x.a.total - y.a.total); else if (ed.ordem === 'prazo') of = of.sort((x, y) => x.o.prazo - y.o.prazo);
  const barata = of.find(({ o }) => o.forn === d.barata)?.a.total;
  const podeEsc = acoesPc(c, p).includes('escolher');
  const col = (o: Oferta) => ` data-col="${o.forn}"${(ed.escolha ?? c.escolhido) === o.forn ? ' class="is-sel"' : ''}`;
  const cel = (o: Oferta, html: string, cls = '') => `<td${col(o).replace('class="is-sel"', `class="is-sel${cls ? ' ' + cls : ''}"`)}${cls && !((ed.escolha ?? c.escolhido) === o.forn) ? ` class="${cls}"` : ''}>${html}</td>`;
  const linhaArt = c.linhas.map((l) => `<tr><th scope="row"><span class="cp-ref">${esc(l.ref)}</span><span class="cp-fraco">${esc(artigo(l.ref)?.desc ?? '')} · ${l.qtd.toLocaleString('pt-PT')} ${esc(artigo(l.ref)?.un ?? '')}</span></th>${of.map(({ o, a }) => {
    const x = o.linhas.find((y) => y.id === l.id), v = a.linhas.find((y) => y.id === l.id)!;
    if (!x || x.preco === null) return cel(o, '<span class="cp-falta">Não cotou</span>');
    const precos = of.map(({ o: oo }) => oo.linhas.find((y) => y.id === l.id)?.preco).filter((n): n is number => n != null), menor = Math.min(...precos);
    return cel(o, `<span class="cp-cmp__valor">${euros(v.liquido!)}</span><span class="cp-fraco">${euros(x.preco)}${x.desc ? ` − ${pct(x.desc)}` : ''} · ${esc(x.refForn)}</span>${x.preco === menor && precos.length > 1 ? '<span class="cp-cmp__marca">preço mais baixo</span>' : ''}${v.abaixoMinimo ? `<span class="cp-cmp__alerta">${ic('triangle-alert')}mínimo ${x.minimo.toLocaleString('pt-PT')}</span>` : ''}`, 'cp-num');
  }).join('')}</tr>`).join('');
  return `<div class="cp-cmp" data-cp-comparar>
    <div class="cp-cmp__barra"><span class="cp-fraco">Ordenar</span>${(['pedido', 'total', 'prazo'] as const).map((k) => `<button type="button" class="cp-filtro" aria-pressed="${ed.ordem === k}" data-cp-ordem-pc="${k}">${k === 'pedido' ? 'Pela resposta' : k === 'total' ? 'Pelo total' : 'Pelo prazo'}</button>`).join('')}<span class="cp-cmp__nota">${ic('info')}Tudo sem IVA (a taxa é igual para todos). Só euros.</span></div>
    <div class="cp-tabela-rolo"><table class="cp-tabela cp-tabela--cmp"><caption class="sr-only">Comparação das propostas do ${c.ref}</caption>
      <thead><tr><th scope="col"><span class="sr-only">Critério</span></th>${of.map(({ o, a }) => `<th scope="col"${col(o)}><span class="cp-cmp__forn">${esc(fornecedor(o.forn)?.nome ?? o.forn)}</span><span class="cp-fraco">respondeu a ${dia(o.respondida)}</span>
        <span class="cp-cmp__tags">${o.forn === d.barata ? '<span class="cp-tag cp-tag--azul">Mais barata</span>' : ''}${o.forn === d.rapida ? '<span class="cp-tag">Mais rápida</span>' : ''}${a.caducada ? '<span class="cp-tag cp-tag--erro">Caducada</span>' : ''}${!a.completa ? '<span class="cp-tag cp-tag--erro">Incompleta</span>' : ''}${c.escolhido === o.forn ? '<span class="cp-tag cp-tag--ok">Escolhida</span>' : ''}</span>
        ${podeEsc ? (a.caducada ? '<span class="cp-fraco">não se escolhe</span>' : `<label class="cp-cmp__escolher"><input type="radio" name="cp-escolha" value="${o.forn}" data-cp-escolher${ed.escolha === o.forn ? ' checked' : ''}><span>Escolher</span></label>`) : ''}</th>`).join('')}</tr></thead>
      <tbody>
        ${linhaArt}
        <tr><th scope="row">Portes</th>${of.map(({ o }) => cel(o, o.portes ? euros(o.portes) : 'Incluídos', 'cp-num')).join('')}</tr>
        <tr class="cp-cmp__total"><th scope="row">Total s/ IVA</th>${of.map(({ o, a }) => cel(o, `<span class="cp-cmp__valor">${euros(a.total)}</span>${barata !== undefined && o.forn !== d.barata && !a.caducada && a.completa ? `<span class="cp-cmp__dif">+ ${euros(a.total - barata)}</span>` : ''}${!a.completa ? `<span class="cp-fraco">${a.artigos} de ${c.linhas.length} artigos</span>` : ''}`, 'cp-num')).join('')}</tr>
        <tr><th scope="row">Prazo</th>${of.map(({ o, a }) => cel(o, `${o.prazo} dias<span class="cp-fraco">chega a ${dia(a.entrega)}${a.entrega > c.entrega ? ' · depois do desejado' : ''}</span>`)).join('')}</tr>
        <tr><th scope="row">Pagamento</th>${of.map(({ o }) => cel(o, esc(o.pagamento))).join('')}</tr>
        <tr><th scope="row">Validade</th>${of.map(({ o }) => cel(o, `<span${caducada(o) ? ' class="cp-atraso"' : ''}>${dia(o.validade)}</span>`)).join('')}</tr>
        <tr><th scope="row">Disponibilidade</th>${of.map(({ o }) => cel(o, esc(o.disponibilidade || '—'))).join('')}</tr>
        <tr><th scope="row">Notas</th>${of.map(({ o }) => cel(o, esc(o.notas || '—'))).join('')}</tr>
      </tbody></table></div>
    <p class="cp-texto cp-fraco cp-cmp__criterio">${esc(d.motivo)}</p>
    ${escolhaResumo(ed)}
  </div>`;
}
/** O resumo da escolha: aparece ao escolher; nada muda até confirmar. */
export function escolhaResumo(ed: EdPc): string {
  const c = ed.c;
  if (c.escolhido) return `<div class="cp-escolha is-feita" data-cp-escolha>${ic('circle-check')}<p>Escolhida a proposta de <b>${esc(fornecedor(c.escolhido)?.nome ?? '')}</b>${c.encomenda ? `: está na ${ligDoc(c.encomenda)}${encomenda(c.encomenda) ? ` (${encomenda(c.encomenda)!.estado.toLowerCase()})` : ''}.` : '.'}</p></div>`;
  if (!ed.escolha) return `<div class="cp-escolha" data-cp-escolha hidden></div>`;
  const o = c.ofertas.find((x) => x.forn === ed.escolha)!, a = avaliar(c, o), d = destaques(c), barata = d.barata ? avaliar(c, c.ofertas.find((x) => x.forn === d.barata)!).total : a.total;
  return `<div class="cp-escolha" data-cp-escolha role="status">
    <dl class="cp-escolha__contas">
      <div><dt>Fornecedor</dt><dd>${esc(fornecedor(o.forn)?.nome ?? '')}</dd></div>
      <div><dt>Total s/ IVA</dt><dd data-cp-total="escolha">${euros(a.total)}</dd></div>
      <div><dt>Face à mais barata</dt><dd data-cp-total="dif">${a.total === barata ? 'é a mais barata' : `+ ${euros(a.total - barata)}`}</dd></div>
      <div><dt>Chega a</dt><dd>${dia(a.entrega)}</dd></div>
      <div><dt>Pagamento</dt><dd>${esc(o.pagamento)}</dd></div>
    </dl>
    ${a.linhas.some((x) => x.abaixoMinimo) ? `<p class="cp-aviso cp-aviso--erro">${ic('triangle-alert')}Há artigos abaixo do mínimo do fornecedor: confirma com ele antes.</p>` : ''}
    ${!a.completa ? `<p class="cp-aviso cp-aviso--erro">${ic('triangle-alert')}Esta proposta não tem todos os artigos: os que faltam ficam de fora da encomenda.</p>` : ''}
    ${btn(`Criar encomenda à ${esc(fornecedor(o.forn)?.nome ?? '')}`, 'file-plus-2', { attrs: 'data-cp-confirmar-escolha' })}
  </div>`;
}
function paginaPc(e: Estado, ed: EdPc | null, ref: string): Pagina {
  const p = e.perfil, base = PASSOS_COMPRAS('Cotações');
  if (!pode2(p, 'pc-ver')) return { onde: 'compras-cotacoes', caminho: base, html: `<main class="cp">${semAcesso('Cotações')}</main>` };
  if (!ed) return { onde: 'compras-cotacoes', caminho: [...base, { nome: ref || '—' }], html: `<main class="cp"><div class="cp-vazio" role="alert">${ic('search', 'cp-vazio__icone')}<p class="cp-vazio__titulo">Não há o pedido ${esc(ref)}</p>${btn('Ver os pedidos', 'arrow-right', { cls: 'btn--ghost btn--sm', attrs: 'data-ws-ir="compras-cotacoes"' })}</div></main>` };
  const c = ed.c, acoes = acoesPc(c, p), edita = acoes.includes('editar');
  const princ = acoes.filter((a) => a === 'enviar'), sec = acoes.filter((a) => ['cancelar', 'duplicar'].includes(a));
  const ordem: EstadoPc[] = ['Rascunho', 'Enviado', 'Com respostas', 'Decidido'], i = ordem.indexOf(c.estado);
  const passos = c.estado === 'Cancelado'
    ? [{ nome: 'Rascunho', data: quando(c.historico, /Criou/), feito: true, atual: false }, { nome: 'Cancelado', data: quando(c.historico, /Cancelou/), feito: false, atual: true, fim: true }]
    : [{ nome: 'Rascunho', data: quando(c.historico, /Criou/), feito: i > 0, atual: i === 0 }, { nome: 'Enviado', data: quando(c.historico, /enviado/), feito: i >= 2, atual: i === 1 }, { nome: `Respostas (${c.ofertas.length}/${c.fornecedores.length})`, data: quando(c.historico, /resposta/), feito: i >= 3, atual: i === 2 }, { nome: 'Decidido', data: quando(c.historico, /Escolheu/), feito: i === 3, atual: false, doc: c.encomenda }];
  const forns = FORNECEDORES.filter((f) => f.ativo);
  return { onde: 'compras-cotacoes', caminho: [...base, { nome: c.ref }], html: `<main class="cp cp--editor" data-cp-pagina="cotacao" data-cp-ref="${c.ref}">
    ${ed.conflito ? faixa('conflito', 'triangle-alert', `<p class="cp-texto">Alguém guardou o ${c.ref} depois de o abrires.</p>${btn('Recarregar', 'rotate-ccw', { cls: 'btn--ghost btn--sm', attrs: 'data-cp-recarregar-pc' })}`) : ''}
    ${erros(ed.erros, 'Antes de marcar como enviado, falta:')}
    <header class="cp-doc"><div class="cp-doc__id"><p class="cp-doc__tipo">Pedido de cotação</p><h1 class="cp-doc__ref"><span style="view-transition-name: ws-doc">${c.ref}</span></h1>
      <p class="cp-doc__linha"><span>${PERFIS[c.comprador].pessoa} · ${dia(c.data)}</span>${estadoPc(c)}<span class="cp-fraco">versão ${c.versao}</span>${ed.sujo ? '<span class="cp-sujo" data-cp-sujo>Alterações por guardar</span>' : ''}</p></div>
      <div class="cp-doc__accoes">
        ${edita ? btn('Guardar', 'check', { cls: 'btn--ghost', attrs: `data-cp-guardar-pc${ed.sujo ? '' : ' disabled'}` }) : ''}
        ${btn('Exportar o pedido', 'arrow-down', { cls: 'btn--ghost', attrs: 'data-cp-exportar-pc' })}
        ${princ.map((a) => btn(NOME_PC[a], ICONE[a], { attrs: `data-cp-pc="${a}"` })).join('')}
        ${sec.length ? `<div class="cp-mais"><button type="button" class="btn btn--ghost" data-cp-mais aria-haspopup="true" aria-expanded="false">${ic('chevron-down', 'btn__icone')}<span class="btn__rotulo">Mais</span></button><div class="cp-mais__menu" role="menu" hidden>${sec.map((a) => `<button type="button" role="menuitem" class="ws-menu__item" data-cp-pc="${a}">${ic(ICONE[a])}${NOME_PC[a]}</button>`).join('')}</div></div>` : ''}
      </div></header>
    ${percurso(passos)}
    ${c.estado === 'Rascunho' ? faixa('', 'info', '<p class="cp-texto">O ERP ainda não manda correio. Exporta o pedido, manda-o aos fornecedores, e depois marca-o como enviado: fica a data no histórico.</p>') : ''}
    <div class="cp-editor cp-editor--pc">
      <div class="cp-editor__principal">
        <section class="cp-caixa cp-campos"><h2 class="cp-bloco__titulo">O pedido</h2>
          <div class="cp-grelha">
            <label class="cp-campo"><span class="cp-campo__rotulo">Responder até</span>${edita ? `<input type="date" class="cp-input" data-cp-pcc="prazoResposta" value="${c.prazoResposta}" min="${HOJE}">` : `<span class="cp-campo__valor${prazoPassou(c) && semResposta(c).length ? ' cp-atraso' : ''}">${dia(c.prazoResposta)}</span>`}</label>
            <label class="cp-campo"><span class="cp-campo__rotulo">Entrega desejada</span>${edita ? `<input type="date" class="cp-input" data-cp-pcc="entrega" value="${c.entrega}" min="${HOJE}">` : `<span class="cp-campo__valor">${dia(c.entrega)}</span>`}</label>
            <div class="cp-campo"><span class="cp-campo__rotulo">Entregar em</span><span class="cp-campo__valor">Romafe, SA · ${esc(c.local)}</span></div>
            <div class="cp-campo"><span class="cp-campo__rotulo">Origem</span><span class="cp-campo__valor">${c.origem.map(ligDoc).join(', ') || 'Manual'}</span></div>
          </div>
          <label class="cp-campo cp-campo--largo"><span class="cp-campo__rotulo">Notas para o fornecedor</span>${edita ? `<textarea class="cp-input cp-notas" rows="2" data-cp-pcc="notas">${esc(c.notas)}</textarea>` : `<p class="cp-texto">${esc(c.notas) || '<span class="cp-fraco">—</span>'}</p>`}</label>
        </section>
        <div class="cp-dois">
          <section class="cp-caixa"><header class="cp-bloco__cabeca"><h2 class="cp-bloco__titulo">Artigos <span class="cp-fraco">${c.linhas.length}</span></h2>${edita ? btn('Juntar artigo', 'plus', { cls: 'btn--ghost btn--sm', attrs: 'data-cp-juntar-pc' }) : ''}</header>
            ${c.linhas.length ? `<ul class="cp-lista-docs cp-pc-arts" data-cp-linhas>${c.linhas.map((l) => `<li class="cp-mov"><span class="cp-ref">${esc(l.ref)}</span><span>${esc(artigo(l.ref)?.desc ?? '')}</span>${edita ? `<input class="cp-celula" inputmode="numeric" data-cp-pcq data-cp-linha="${l.id}" value="${l.qtd}" aria-label="Quantidade de ${esc(l.ref)}">` : `<span class="cp-forte">${l.qtd.toLocaleString('pt-PT')} ${esc(artigo(l.ref)?.un ?? '')}</span>`}${edita ? `<button type="button" class="ws-ibtn ws-ibtn--sm" aria-label="Tirar ${esc(l.ref)}" data-cp-tirar-pc="${l.id}">${ic('x')}</button>` : '<span></span>'}</li>`).join('')}</ul>` : '<p class="cp-texto cp-fraco">Ainda sem artigos.</p>'}</section>
          <section class="cp-caixa"><header class="cp-bloco__cabeca"><h2 class="cp-bloco__titulo">Fornecedores <span class="cp-fraco">${c.fornecedores.length}</span></h2></header>
            ${edita ? `<fieldset class="cp-forns"><legend class="sr-only">A quem pedir</legend>${forns.map((f) => `<label class="ws-caixa"><input type="checkbox" value="${f.id}" data-cp-pcf${c.fornecedores.includes(f.id) ? ' checked' : ''}><span>${esc(f.nome)}<small class="cp-fraco">${f.prazo} dias · ${f.pagamento}</small></span></label>`).join('')}</fieldset>`
              : `<ul class="cp-lista-docs">${c.fornecedores.map((f) => { const o = c.ofertas.find((x) => x.forn === f); return `<li class="cp-mov cp-pc-forn"><span class="cp-forte">${esc(fornecedor(f)?.nome ?? f)}</span><span>${o ? `Respondeu a ${dia(o.respondida)}${caducada(o) ? ' · <span class="cp-atraso">caducada</span>' : ''}` : prazoPassou(c) ? '<span class="cp-atraso">Sem resposta · o prazo passou</span>' : 'Sem resposta'}</span>${acoes.includes('responder') ? btn(o ? 'Corrigir' : 'Registar resposta', 'file-pen', { cls: 'btn--ghost btn--sm', attrs: `data-cp-responder="${f}"` }) : '<span></span>'}</li>`; }).join('')}</ul>`}
          </section>
        </div>
        <section class="cp-caixa" aria-labelledby="cp-cmp-t"><header class="cp-bloco__cabeca"><h2 class="cp-bloco__titulo" id="cp-cmp-t">Comparação das propostas</h2></header>${comparacao(ed, p)}</section>
        <section class="cp-caixa"><h2 class="cp-bloco__titulo">Histórico</h2>${hist(c.historico)}</section>
      </div>
    </div>
  </main>` };
}

/* ---------- gavetas e diálogos ---------- */
export function gavetaTodos(q = '', ja: string[] = []): string {
  const s = sem(q.trim());
  const l = ARTIGOS.filter((a) => !s || sem(`${a.ref} ${a.refForn} ${a.desc} ${a.marca} ${a.ean}`).includes(s));
  return `<div class="ws-veu ws-veu--painel" data-ws-camada="painel"><aside class="ws-painel cp-gaveta" role="dialog" aria-modal="true" aria-labelledby="cp-gav2-t">
    <header class="ws-painel__cabeca"><p class="ws-painel__tipo">Catálogo · ${ARTIGOS.length} artigos</p><h2 class="ws-painel__titulo cp-gaveta__titulo" id="cp-gav2-t">Juntar artigo</h2><button type="button" class="ws-ibtn ws-painel__fechar" aria-label="Fechar" data-ws-fechar>${ic('x')}</button></header>
    <div class="cp-gaveta__procura"><div class="cp-procura">${ic('search', 'cp-procura__lupa')}<input type="search" class="cp-procura__campo" placeholder="Referência, descrição, marca ou EAN" aria-label="Procurar artigo" value="${esc(q)}" data-cp-gaveta2-q autocomplete="off"></div></div>
    <div class="ws-painel__corpo cp-gaveta__corpo" data-cp-gaveta2-lista>${l.length ? `<ul class="cp-arts">${l.map((a) => `<li><button type="button" class="cp-art" data-cp-art2="${esc(a.ref)}">
      <span class="cp-art__id"><span class="cp-ref">${esc(a.ref)}</span><span class="cp-fraco">${esc(fornecedor(a.forn)?.nome ?? '')}</span></span>
      <span class="cp-art__desc">${esc(a.desc)} <span class="cp-fraco">· ${esc(a.marca)}</span></span>
      <span class="cp-art__stock">${stock(a.ref).toLocaleString('pt-PT')} em stock${aCaminho(a.ref) ? ` · ${aCaminho(a.ref).toLocaleString('pt-PT')} a caminho` : ''}</span>
      <span class="cp-art__preco">${a.preco === null ? '<span class="cp-falta">Sem preço</span>' : euros(a.preco)}</span>
      ${ja.includes(a.ref) ? '<span class="cp-art__ja">já está</span>' : ic('plus', 'cp-art__mais')}
    </button></li>`).join('')}</ul>` : `<div class="cp-vazio cp-vazio--curto"><p class="cp-vazio__texto">Nenhum artigo com «${esc(q)}».</p></div>`}</div>
  </aside></div>`;
}
export function dialogoMotivo2(titulo: string, sub: string, ok: string, dados: string): string {
  return `<div class="ws-veu" data-ws-camada="personalizar"><div class="ws-dialogo cp-dialogo" role="dialog" aria-modal="true" aria-labelledby="cp-mot2-t">
    <header class="ws-dialogo__cabeca"><h2 class="ws-dialogo__titulo" id="cp-mot2-t">${titulo}</h2><button type="button" class="ws-ibtn" aria-label="Fechar" data-ws-fechar>${ic('x')}</button></header>
    <div class="ws-dialogo__corpo"><p class="cp-texto">${sub}</p><label class="cp-campo"><span class="cp-campo__rotulo">Motivo</span><textarea class="cp-input" rows="3" data-cp-motivo required></textarea></label><p class="cp-campo__erro" hidden role="alert">${ic('circle-alert')}Escreve o motivo.</p></div>
    <footer class="ws-dialogo__pe">${btn('Voltar', 'arrow-right', { cls: 'btn--ghost', attrs: 'data-ws-fechar' })}${btn(ok, 'check', { attrs: `data-cp-motivo-ok="${dados}"` })}</footer>
  </div></div>`;
}
export function dialogoResposta(c: Cotacao, forn: string, erro = ''): string {
  const f = fornecedor(forn)!, o = c.ofertas.find((x) => x.forn === forn);
  const v = (k: keyof Oferta, def: string) => esc(o ? String(o[k]) : def);
  return `<div class="ws-veu" data-ws-camada="personalizar"><div class="ws-dialogo cp-dialogo cp-dialogo--largo" role="dialog" aria-modal="true" aria-labelledby="cp-resp-t">
    <header class="ws-dialogo__cabeca"><h2 class="ws-dialogo__titulo" id="cp-resp-t">Resposta de ${esc(f.nome)} · ${c.ref}</h2><button type="button" class="ws-ibtn" aria-label="Fechar" data-ws-fechar>${ic('x')}</button></header>
    <form class="ws-dialogo__corpo" data-cp-resposta="${forn}">
      ${erro ? `<p class="cp-campo__erro" role="alert">${ic('circle-alert')}${esc(erro)}</p>` : ''}
      <div class="cp-tabela-rolo"><table class="cp-tabela"><thead><tr><th scope="col">Artigo</th><th scope="col" class="cp-num">Preço unitário</th><th scope="col" class="cp-num">Desconto</th><th scope="col" class="cp-num">Mínimo</th><th scope="col">Ref. do fornecedor</th></tr></thead><tbody>
        ${c.linhas.map((l) => { const x = o?.linhas.find((y) => y.id === l.id); const a = artigo(l.ref); return `<tr><td data-rotulo="Artigo"><span class="cp-ref">${esc(l.ref)}</span><span class="cp-fraco">${l.qtd.toLocaleString('pt-PT')} ${esc(a?.un ?? '')}</span></td>
          <td data-rotulo="Preço" class="cp-num"><input class="cp-celula" inputmode="decimal" name="preco-${l.id}" value="${x?.preco != null ? (x.preco / 100).toFixed(2).replace('.', ',') : ''}" placeholder="Não cotou" aria-label="Preço de ${esc(l.ref)}"></td>
          <td data-rotulo="Desconto" class="cp-num"><input class="cp-celula cp-celula--curta" inputmode="decimal" name="desc-${l.id}" value="${x?.desc ? String(x.desc / 100).replace('.', ',') : ''}" placeholder="0" aria-label="Desconto (%) de ${esc(l.ref)}"></td>
          <td data-rotulo="Mínimo" class="cp-num"><input class="cp-celula cp-celula--curta" inputmode="numeric" name="min-${l.id}" value="${x?.minimo || ''}" placeholder="—" aria-label="Quantidade mínima de ${esc(l.ref)}"></td>
          <td data-rotulo="Ref. do fornecedor"><input class="cp-input" name="ref-${l.id}" value="${esc(x?.refForn ?? (a?.forn === forn ? a.refForn : ''))}" aria-label="Referência do fornecedor para ${esc(l.ref)}"></td></tr>`; }).join('')}
      </tbody></table></div>
      <div class="cp-grelha cp-grelha--resp">
        <label class="cp-campo"><span class="cp-campo__rotulo">Prazo de entrega (dias)</span><input class="cp-input" inputmode="numeric" name="prazo" value="${v('prazo', String(f.prazo))}"></label>
        <label class="cp-campo"><span class="cp-campo__rotulo">Portes (€)</span><input class="cp-input" inputmode="decimal" name="portes" value="${o ? (o.portes / 100).toFixed(2).replace('.', ',') : '0,00'}"></label>
        <label class="cp-campo"><span class="cp-campo__rotulo">Pagamento</span><select class="cp-select" name="pagamento">${['Pronto pagamento', '30 dias', '45 dias', '60 dias', '90 dias'].map((x) => `<option${(o?.pagamento ?? f.pagamento) === x ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
        <label class="cp-campo"><span class="cp-campo__rotulo">Válida até</span><input type="date" class="cp-input" name="validade" value="${v('validade', '')}"></label>
        <label class="cp-campo"><span class="cp-campo__rotulo">Moeda</span><select class="cp-select" name="moeda"><option value="EUR" selected>Euro</option><option value="USD" disabled>Dólar (sem regras de câmbio)</option></select></label>
        <label class="cp-campo"><span class="cp-campo__rotulo">Respondida a</span><input type="date" class="cp-input" name="respondida" value="${v('respondida', HOJE)}" max="${HOJE}"></label>
      </div>
      <label class="cp-campo cp-campo--largo"><span class="cp-campo__rotulo">Disponibilidade</span><input class="cp-input" name="disponibilidade" value="${v('disponibilidade', '')}" placeholder="Em stock, sob encomenda…"></label>
      <label class="cp-campo cp-campo--largo"><span class="cp-campo__rotulo">Notas</span><textarea class="cp-input" rows="2" name="notas">${v('notas', '')}</textarea></label>
    </form>
    <footer class="ws-dialogo__pe">${btn('Cancelar', 'x', { cls: 'btn--ghost', attrs: 'data-ws-fechar' })}${btn('Guardar a resposta', 'check', { attrs: `data-cp-resposta-ok="${forn}"` })}</footer>
  </div></div>`;
}
export function dialogoEscolha(c: Cotacao, forn: string): string {
  const o = c.ofertas.find((x) => x.forn === forn)!, a = avaliar(c, o);
  return `<div class="ws-veu" data-ws-camada="personalizar"><div class="ws-dialogo cp-dialogo" role="alertdialog" aria-modal="true" aria-labelledby="cp-esc-t" aria-describedby="cp-esc-d">
    <header class="ws-dialogo__cabeca"><h2 class="ws-dialogo__titulo" id="cp-esc-t">Criar a encomenda à ${esc(fornecedor(forn)?.nome ?? '')}?</h2></header>
    <div class="ws-dialogo__corpo"><p class="cp-texto" id="cp-esc-d">Cria a encomenda em rascunho, com ${a.artigos} ${a.artigos === 1 ? 'artigo' : 'artigos'}, os preços e o prazo da proposta (${euros(a.total)} sem IVA, entrega a ${dia(a.entrega)}). O ${c.ref} fica decidido${c.origem.length ? ` e a ${c.origem.join(', ')} fica com a encomenda` : ''}. Depois revês e submetes a encomenda como de costume.</p></div>
    <footer class="ws-dialogo__pe">${btn('Voltar', 'arrow-right', { cls: 'btn--ghost', attrs: 'data-ws-fechar' })}${btn('Criar encomenda', 'file-plus-2', { attrs: `data-cp-escolha-ok="${forn}"` })}</footer>
  </div></div>`;
}

/* ---------- o registo e os ecrãs ---------- */
export interface Contexto2 { ref: string; freq?: FiltroReq; qreq?: string; fpc?: FiltroPc; edReq?: EdReq | null; edPc?: EdPc | null }
export const IDS_FASE2 = ['compras-requisicoes', 'compras-requisicao', 'compras-cotacoes', 'compras-cotacao'];
export function paginaFase2(id: string, e: Estado, c: Contexto2): Pagina {
  if (id === 'compras-requisicoes') return paginaReqs(e, c.freq ?? (requisicoesDe(e.perfil).some((r) => r.estado === 'Em aprovação' && r.aprovador === e.perfil) ? 'aprovar' : 'todas'), c.qreq ?? '');
  if (id === 'compras-requisicao') return paginaReq(e, c.edReq ?? null, c.ref);
  if (id === 'compras-cotacoes') return paginaPcs(e, c.fpc ?? 'todos');
  return paginaPc(e, c.edPc ?? null, c.ref);
}
export const edReqDe = (ref: string): EdReq | null => { const r = requisicao(ref); return r ? { r: JSON.parse(JSON.stringify(r)), versao: r.versao, sujo: false, erros: [], conflito: false } : null; };
export const edPcDe = (ref: string): EdPc | null => { const c = cotacao(ref); return c ? { c: JSON.parse(JSON.stringify(c)), versao: c.versao, sujo: false, erros: [], conflito: false, escolha: null, ordem: 'pedido' } : null; };

const ws = (pagina: string, html: string, o: { perfil?: IdPerfil; ref?: string; cenario?: string; fixo?: boolean } = {}) =>
  `<div class="ws" data-densidade="confortavel" data-lado="aberto" data-ws-pagina="${pagina}"${o.fixo && o.perfil ? ` data-ws-perfil="${o.perfil}"` : ''}${o.fixo && o.ref ? ` data-ws-ref="${esc(o.ref)}"` : ''}${o.cenario ? ` data-cp-cenario="${o.cenario}"` : ''}>${html}</div>`;
const desenhar = (pagina: string, o: { perfil?: IdPerfil; ref?: string; cenario?: string; fixo?: boolean } = {}) => {
  const e = estadoPadrao(o.perfil ?? 'compras'), ref = o.ref ?? '';
  const c: Contexto2 = { ref, edReq: pagina === 'compras-requisicao' ? edReqDe(ref) : undefined, edPc: pagina === 'compras-cotacao' ? cenarioPc(edPcDe(ref), o.cenario) : undefined };
  return ws(pagina, casca(e, paginaFase2(pagina, e, c)), o);
};
/** «comparar» = uma proposta já escolhida (antes de confirmar), para se ver o destaque e o resumo. */
export function cenarioPc(ed: EdPc | null, c?: string): EdPc | null { if (ed && c === 'comparar') ed.escolha = 'rnorte'; return ed; }
const NOTA = 'Fase 2 de Compras (19 out.): requisições com aprovação (quem pede não aprova) e pedidos de cotação com a comparação lado a lado, sem IVA';

export function ecrasFase2(): Ecra<IdErp>[] {
  const v = (html: string) => [{ id: 'v1', nota: NOTA, html }] as Ecra<IdErp>['versoes'];
  const est = (id: IdCompras3, de: IdErp, nome: string, objetivo: string, html: string): Ecra<IdErp> => ({ id, nome, fluxo: 'Compras', estadoDe: de, objetivo, versoes: v(html) });
  return [
    { id: 'compras-requisicoes', nome: '16 · Requisições', fluxo: 'Compras', objetivo: 'O que os departamentos pedem para comprar: as minhas, as que tenho para aprovar, e por estado. Compras e Administração veem todas.', versoes: v(desenhar('compras-requisicoes')) },
    { id: 'compras-requisicao', nome: '17 · Requisição', fluxo: 'Compras', objetivo: 'Pedir artigos (quantidade, custo estimado, para quando e porquê, anexos), submeter, aprovar ou rejeitar com o motivo, e converter em cotação ou encomenda.', versoes: v(desenhar('compras-requisicao', { ref: 'RQ 2026/0052' })) },
    { id: 'compras-cotacoes', nome: '18 · Cotações', fluxo: 'Compras', objetivo: 'Os pedidos de cotação: quem já respondeu, o prazo de resposta e a origem.', versoes: v(desenhar('compras-cotacoes')) },
    { id: 'compras-cotacao', nome: '19 · Cotação', fluxo: 'Compras', objetivo: 'O pedido, as respostas registadas e a comparação lado a lado (sem IVA): escolher destaca a proposta e mostra o passo seguinte; só ao confirmar se cria a encomenda.', versoes: v(desenhar('compras-cotacao', { ref: 'PC 2026/0017' })) },
    est('cp-req-aprovar', 'compras-requisicao', '17.1 · Para aprovar', 'A RQ 2026/0051 do Armazém, aberta por quem a aprova (Compras, até 2 500,00 €): Aprovar, e Rejeitar com o motivo em «Mais».', desenhar('compras-requisicao', { fixo: true, ref: 'RQ 2026/0051' })),
    est('cp-req-rejeitada', 'compras-requisicao', '17.2 · Rejeitada', 'A decisão fica: quem rejeitou, quando e porquê; para pedir outra vez, duplica-se.', desenhar('compras-requisicao', { fixo: true, perfil: 'vendas', ref: 'RQ 2026/0048' })),
    est('cp-pc-comparar', 'compras-cotacao', '19.1 · Proposta escolhida', 'A comparação com a proposta da Rolamentos do Norte escolhida: a coluna destaca-se, o resumo diz quanto custa face à mais barata e quando chega, e aparece «Criar encomenda» (nada muda até confirmar).', desenhar('compras-cotacao', { fixo: true, ref: 'PC 2026/0017', cenario: 'comparar' })),
    est('cp-pc-escolhida', 'compras-cotacao', '19.2 · Decidido', 'O PC 2026/0015: a proposta escolhida e a encomenda que deu.', desenhar('compras-cotacao', { fixo: true, ref: 'PC 2026/0015' })),
    est('cp-pc-resposta', 'compras-cotacao', '19.3 · À espera de resposta', 'O PC 2026/0016: o prazo de resposta passou e nenhum dos dois fornecedores respondeu; «Registar resposta» por fornecedor.', desenhar('compras-cotacao', { fixo: true, ref: 'PC 2026/0016' })),
  ];
}
