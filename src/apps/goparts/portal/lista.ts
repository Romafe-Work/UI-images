/* =========================================================
   GOPARTS — 15 · Minha lista (14 out. 2026)
   Do briefing dela: um espaço de trabalho para montar, orçamentar, guardar e enviar listas de peças e de
   mão de obra. Ela não mandou o ecrã antigo (o GO REPAIR); os campos e as operações são os do briefing:
   - cabeçalho: o nome editável, o estado (guardada / alterações por guardar), o n.º da lista, e as ações —
     «Guardar» (laranja) e «Enviar» destacadas e distintas; «Abrir lista» e «Eliminar» discretas;
   - Peças sobresselentes: Marca, Referência, Descrição, Qtd., e duas colunas agrupadas — «Romafe» (o preço
     líquido, o que a oficina paga) e «Cliente» (PVP, Desc. e Total, o que a oficina cobra);
   - Mão de obra: o mesmo padrão (Descrição, Horas, Preço/hora, Desc., Total);
   - o resumo preso à direita: Peças, Mão de obra, Subtotal antes de descontos, Descontos e o Total, sem IVA
     (como no catálogo: «líquido, sem IVA»); e, à parte, o custo das peças na Romafe.
   As contas: Total da linha = Qtd. × PVP × (1 − Desc.); Subtotal = Σ Qtd. × PVP; Descontos = Σ do desconto;
   Total = Subtotal − Descontos. Os valores são de exemplo (as referências do catálogo).
   Comportamento: comportamento/lista.ts. CSS: css/lista.css.
   ========================================================= */
import { REFERENCIAS } from './catalogo-dados';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import save from 'lucide-static/icons/save.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import minus from 'lucide-static/icons/minus.svg?raw';
import wrench from 'lucide-static/icons/wrench.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import copy from 'lucide-static/icons/copy.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import alert from 'lucide-static/icons/triangle-alert.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import folderOpen from 'lucide-static/icons/folder-open.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import rotate from 'lucide-static/icons/rotate-ccw.svg?raw';
import mail from 'lucide-static/icons/mail.svg?raw';

export const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
export const IC = { save, search, send, trash, plus, minus, wrench, pkg, copy, x, check, alert, lock, folderOpen, pencil, info, rotate, mail };

/** 1 245,90 € — o espaço fino inquebrável entre milhares, como pede o briefing (o pt-PT do navegador não agrupa os de 4 algarismos). */
export function euros(n: number): string {
  const [i, d] = Math.abs(n).toFixed(2).split('.');
  return `${n < 0 ? '−' : ''}${i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${d} €`;
}
/** Um preço no campo: sempre com dois decimais (112,40). */
export const dinheiro = (n: number) => n.toFixed(2).replace('.', ',');
export const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',').replace(/,?0+$/, ''));

export type Peca = { marca: string; ref: string; desc: string; qtd: number; liquido: number; pvp: number; d: number };
export type Mao = { desc: string; horas: number; preco: number; d: number };
const peca = (ref: string, qtd: number, d: number): Peca => {
  const r = REFERENCIAS.find((x) => x[2] === ref)!;
  return { marca: r[1], ref: r[2], desc: r[3], qtd, liquido: r[4] * (1 - r[5] / 100), pvp: r[4], d };
};
export const PECAS: Peca[] = [peca('VKMC 01250-2', 1, 0), peca('VKPC 88618', 1, 5), peca('VKMV 6PK1873', 1, 0), peca('VKBA 6556', 2, 10)];
export const MAO: Mao[] = [{ desc: 'Substituição do kit de distribuição e da bomba de água', horas: 2.5, preco: 38, d: 0 }, { desc: 'Substituição dos rolamentos de roda (eixo dianteiro)', horas: 1.2, preco: 38, d: 10 }];

export const totalPeca = (p: Peca) => p.qtd * p.pvp * (1 - p.d / 100);
export const totalMao = (m: Mao) => m.horas * m.preco * (1 - m.d / 100);
export function contas(pecas: Peca[], mao: Mao[]) {
  const brutoP = pecas.reduce((s, p) => s + p.qtd * p.pvp, 0), brutoM = mao.reduce((s, m) => s + m.horas * m.preco, 0);
  const totP = pecas.reduce((s, p) => s + totalPeca(p), 0), totM = mao.reduce((s, m) => s + totalMao(m), 0);
  return { pecas: totP, mao: totM, subtotal: brutoP + brutoM, descontos: brutoP + brutoM - totP - totM, total: totP + totM, custo: pecas.reduce((s, p) => s + p.qtd * p.liquido, 0), n: pecas.length + mao.length };
}

/* ---------- as linhas ---------- */
const campoNum = (cls: string, rotulo: string, valor: number, extra = '') => `<input class="lst__num ${cls}" inputmode="decimal" aria-label="${rotulo}" value="${cls === 'lst__pvp' && !Number.isNaN(valor) ? dinheiro(valor) : num(valor)}"${extra}>`;
const qtd = (v: number, rot: string, so = false) => `<span class="lst__qtd"><button type="button" class="lst__qtd-b" data-passo="-1" aria-label="Menos um"${so ? ' disabled' : ''}>${L(minus)}</button>${campoNum('lst__q', rot, v, so ? ' readonly' : '')}<button type="button" class="lst__qtd-b" data-passo="1" aria-label="Mais um"${so ? ' disabled' : ''}>${L(plus)}</button></span>`;
const accoesLinha = (so: boolean) => so ? '' : `<span class="lst__linha-accoes"><button type="button" class="lst__icone" data-duplicar aria-label="Duplicar a linha" data-dica="Duplicar">${L(copy)}</button><button type="button" class="lst__icone lst__icone--remover" data-remover aria-label="Remover a linha" data-dica="Remover">${L(trash)}</button></span>`;

export function linhaPeca(p: Peca, i: number, o: { so?: boolean; semPreco?: boolean; erro?: string; nova?: boolean } = {}): string {
  const so = !!o.so;
  return `<tr class="lst__linha${o.nova ? ' is-nova' : ''}" data-tipo="peca" style="--i:${i}">
    <td data-rotulo="Marca"><span class="lst__marca">${p.marca}</span></td>
    <td data-rotulo="Referência"><span class="lst__ref">${p.ref}</span></td>
    <td data-rotulo="Descrição" class="lst__desc">${p.desc}</td>
    <td data-rotulo="Qtd." class="lst__n">${qtd(p.qtd, `Quantidade de ${p.ref}`, so)}</td>
    <td data-rotulo="Preço líquido" class="lst__n lst__romafe" data-liquido="${p.liquido}">${o.semPreco ? '<span class="lst__sem">—</span>' : euros(p.liquido)}</td>
    <td data-rotulo="PVP" class="lst__n${o.erro ? ' is-erro' : ''}">${o.semPreco ? '<span class="lst__sem">—</span>' : campoNum('lst__pvp', `PVP de ${p.ref}`, o.erro ? NaN : p.pvp, `${so ? ' readonly' : ''}${o.erro ? ` aria-invalid="true" aria-describedby="lst-erro-${i}"` : ''}`).replace('value="NaN"', `value="${o.erro}"`)}${o.erro ? `<p class="lst__erro" id="lst-erro-${i}">${L(alert)}Escreva um valor em euros, ex.: 112,40</p>` : ''}</td>
    <td data-rotulo="Desc. %" class="lst__n">${campoNum('lst__d', `Desconto de ${p.ref}, em percentagem`, p.d, so ? ' readonly' : '')}</td>
    <td data-rotulo="Total" class="lst__n lst__total" data-total>${o.semPreco ? '<span class="lst__sem">—</span>' : euros(totalPeca(p))}</td>
    <td class="lst__fim">${accoesLinha(so)}</td>
  </tr>`;
}
export function linhaMao(m: Mao, i: number, o: { so?: boolean; nova?: boolean } = {}): string {
  const so = !!o.so;
  return `<tr class="lst__linha${o.nova ? ' is-nova' : ''}" data-tipo="mao" style="--i:${i}">
    <td data-rotulo="Descrição" class="lst__desc"><input class="lst__texto" aria-label="Descrição do trabalho" value="${m.desc}" placeholder="Ex.: Substituição das pastilhas"${so ? ' readonly' : ''}></td>
    <td data-rotulo="Horas" class="lst__n">${qtd(m.horas, 'Horas', so)}</td>
    <td data-rotulo="Preço/hora" class="lst__n">${campoNum('lst__pvp', 'Preço por hora', m.preco, so ? ' readonly' : '')}</td>
    <td data-rotulo="Desc. %" class="lst__n">${campoNum('lst__d', 'Desconto, em percentagem', m.d, so ? ' readonly' : '')}</td>
    <td data-rotulo="Total" class="lst__n lst__total" data-total>${euros(totalMao(m))}</td>
    <td class="lst__fim">${accoesLinha(so)}</td>
  </tr>`;
}

/* ---------- o ecrã (e os seus estados) ---------- */
export type EstadoLista = '' | 'nova' | 'sujo' | 'a-guardar' | 'guardada' | 'falhou-guardar' | 'a-enviar' | 'enviada' | 'falhou-enviar' | 'invalido'
  | 'sem-referencia' | 'sem-precos' | 'sem-resultados' | 'offline' | 'leitura' | 'sem-permissao' | 'eliminar' | 'remover' | 'adicionar';

const ESTADO_TXT: Record<string, [string, string]> = {
  '': ['guardada', 'Guardada'], nova: ['nova', 'Lista nova, ainda não guardada'], sujo: ['sujo', 'Alterações por guardar'], 'a-guardar': ['a-guardar', 'A guardar…'],
  guardada: ['guardada', 'Guardada agora'], 'falhou-guardar': ['erro', 'Não foi guardada'], leitura: ['leitura', 'Só de leitura'],
};

export function listaHtml(e: EstadoLista = ''): string {
  const nova = e === 'nova', so = e === 'leitura' || e === 'sem-permissao';
  const pecas = nova ? [] : PECAS, mao = nova ? [] : MAO;
  const c = contas(pecas, mao);
  const [estK, estT] = ESTADO_TXT[e] ?? (['sujo', 'Alterações por guardar'] as [string, string]);
  const nome = nova ? 'Nova lista' : 'Renault Scénic II · 12-AB-34';
  const botao = (cls: string, icone: string, texto: string, extra = '') => `<button type="button" class="btn ${cls}"${extra}>${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;
  const aGuardar = e === 'a-guardar', aEnviar = e === 'a-enviar';
  const guardar = aGuardar
    ? `<button type="button" class="btn btn--acao lst__guardar" aria-busy="true" disabled>${rolamentoSvg('lst-g', 'pesquisar', 'lst__rs')}<span class="btn__rotulo">A guardar…</span></button>`
    : botao(`btn--acao lst__guardar${['sujo', 'invalido', 'sem-referencia', 'remover', 'adicionar', 'falhou-guardar'].includes(e) || nova ? ' is-sujo' : ''}`, e === 'guardada' ? check : save, e === 'guardada' ? 'Guardada' : 'Guardar', ` data-guardar${so || e === 'invalido' ? ' disabled' : ''}`);
  const enviar = aEnviar
    ? `<button type="button" class="btn lst__enviar" aria-busy="true" disabled>${rolamentoSvg('lst-e', 'pesquisar', 'lst__rs')}<span class="btn__rotulo">A enviar…</span></button>`
    : botao('lst__enviar', send, 'Enviar', ` data-enviar${nova || so || e === 'invalido' ? ' disabled' : ''}`);
  const linhasP = pecas.map((p, i) => linhaPeca(p, i, { so, semPreco: e === 'sem-precos', erro: e === 'invalido' && i === 1 ? '112,4,0' : '', nova: e === 'adicionar' && i === pecas.length - 1 })).join('');
  const linhasM = mao.map((m, i) => linhaMao(m, i, { so })).join('');
  const faixa = (tipo: string, icone: string, titulo: string, texto: string, acao = '') => `<div class="lst__faixa lst__faixa--${tipo}" role="${tipo === 'erro' ? 'alert' : 'status'}">${icone}<div><b>${titulo}</b><span>${texto}</span></div>${acao}</div>`;
  const tentar = botao('btn--claro btn--sm', rotate, 'Tentar novamente');
  const faixas = ({
    guardada: faixa('ok', `<span class="lst__faixa-ic">${L(check)}</span>`, 'Lista guardada.', 'O servidor confirmou a gravação das 4 peças e 2 trabalhos.'),
    'falhou-guardar': faixa('erro', rolamentoSvg('lst-fg', 'erro', 'lst__rs-faixa'), 'A lista não foi guardada.', 'O servidor não respondeu. As alterações continuam aqui; nada se perdeu.', tentar),
    enviada: faixa('ok', `<span class="lst__faixa-ic">${L(check)}</span>`, 'Lista enviada para oficina@exemplo.pt.', 'O servidor confirmou o envio.'),
    'falhou-enviar': faixa('erro', rolamentoSvg('lst-fe', 'erro', 'lst__rs-faixa'), 'A lista não foi enviada.', 'O endereço oficina@exemplo.pt não foi aceite pelo servidor. Confirme-o e tente outra vez.', tentar),
    'sem-precos': faixa('aviso', `<span class="lst__faixa-ic">${L(alert)}</span>`, 'Os preços estão indisponíveis de momento.', 'As linhas e as quantidades estão certas; os preços e os totais voltam quando o serviço responder.', tentar),
    offline: faixa('aviso', rolamentoSvg('lst-off', 'offline', 'lst__rs-faixa'), 'Estás sem ligação à Internet.', 'Podes continuar a editar; «Guardar» e «Enviar» voltam com a ligação.', tentar),
    leitura: faixa('info', `<span class="lst__faixa-ic">${L(lock)}</span>`, 'Esta lista é só de leitura.', 'Foi enviada a 10 out. e já não se altera. Pode duplicá-la para fazer outra.', botao('btn--claro btn--sm', copy, 'Duplicar a lista')),
    'sem-permissao': faixa('erro', `<span class="lst__faixa-ic">${L(lock)}</span>`, 'Não tem permissão para alterar esta lista.', 'Foi criada por outro utilizador da empresa. Pode vê-la e duplicá-la.', botao('btn--claro btn--sm', copy, 'Duplicar a lista')),
  } as Record<string, string>)[e] ?? '';
  const procuraAberta = e === 'adicionar' || e === 'sem-referencia' || e === 'sem-resultados';
  const procura = `<div class="lst__procura"${procuraAberta ? '' : ' hidden'}>
      <label class="lst__procura-campo"><span class="sr-only">Referência a adicionar</span>${L(search)}<input data-procura-ref role="combobox" aria-autocomplete="list" aria-expanded="${e === 'sem-resultados' ? 'true' : 'false'}" aria-controls="lst-sugestoes" placeholder="Escreva a referência, ex.: VKBA 6557" value="${e === 'sem-resultados' ? 'XQ-99812' : e === 'sem-referencia' ? 'ABC 123' : ''}" autocomplete="off" spellcheck="false"></label>
      <button type="button" class="lst__icone" data-fechar-procura aria-label="Fechar">${L(x)}</button>
      <ul class="lst__sugestoes" id="lst-sugestoes" role="listbox"${e === 'sem-resultados' ? '' : ' hidden'}>${e === 'sem-resultados' ? '<li class="lst__sug-vazio" role="presentation">Nenhuma referência começa por «XQ-99812». Confirme o número ou procure no Catálogo.</li>' : ''}</ul>
      ${e === 'sem-referencia' ? `<p class="lst__erro lst__erro--procura">${L(alert)}A referência «ABC 123» não existe no catálogo. Confirme-a, ou adicione a peça pelo Catálogo.</p>` : ''}
    </div>`;
  const vazio = (txt: string, b: string) => `<div class="lst__vazio">${txt}${b}</div>`;
  const resumo = `<aside class="lst__resumo" aria-label="Resumo da lista">
      <h2 class="lst__resumo-titulo">Resumo</h2>
      <dl>
        <div><dt>Peças <span class="lst__cont" data-n="pecas">${pecas.length}</span></dt><dd data-soma="pecas">${e === 'sem-precos' ? '—' : euros(c.pecas)}</dd></div>
        <div><dt>Mão de obra <span class="lst__cont" data-n="mao">${mao.length}</span></dt><dd data-soma="mao">${euros(c.mao)}</dd></div>
        <div class="lst__resumo-linha"><dt>Subtotal <small>antes de descontos</small></dt><dd data-soma="subtotal">${e === 'sem-precos' ? '—' : euros(c.subtotal)}</dd></div>
        <div><dt>Descontos</dt><dd data-soma="descontos" class="lst__menos">${e === 'sem-precos' ? '—' : euros(-c.descontos)}</dd></div>
        <div class="lst__resumo-total"><dt>Total <small>sem IVA</small></dt><dd data-soma="total">${e === 'sem-precos' ? '—' : euros(c.total)}</dd></div>
      </dl>
      <p class="lst__custo">${L(info)}<span>Custo das peças na Romafe: <b data-soma="custo">${e === 'sem-precos' ? '—' : euros(c.custo)}</b> (preço líquido)</span></p>
      <p class="lst__exemplo">Valores de exemplo; os preços e as regras comerciais vêm do GoParts.</p>
    </aside>`;
  const dialogo = (tipo: string, aberto: boolean, html: string) => `<div class="lst__dialogo" data-dialogo="${tipo}" role="dialog" aria-modal="true"${aberto ? '' : ' hidden'}><div class="lst__dialogo-caixa">${html}</div></div>`;
  return `<div class="portal portal--v3 portal--v22 portal--noite portal--ini3 portal--lista">
  <main class="lst${so ? ' is-leitura' : ''}" data-estado="${e}">
    <header class="lst__topo">
      <div class="lst__titulo">
        <label class="lst__nome"><span class="sr-only">Nome da lista</span><input data-nome value="${nome}"${so ? ' readonly' : ''}>${so ? '' : L(pencil, 'lst__lapis')}</label>
        <p class="lst__meta"><span class="lst__estado lst__estado--${estK}" role="status" aria-live="polite"><i aria-hidden="true"></i>${estT}</span>${nova ? '' : '<span class="lst__numero">Lista L2024/000318</span>'}</p>
      </div>
      <div class="lst__accoes">
        ${botao('btn--ghost lst__discreto', folderOpen, 'Abrir lista', ' data-abrir')}
        ${botao('btn--ghost lst__discreto lst__eliminar', trash, 'Eliminar', ` data-eliminar${nova || so ? ' disabled' : ''}`)}
        <span class="lst__sep" aria-hidden="true"></span>
        ${enviar}${guardar}
      </div>
    </header>
    ${faixas}
    <div class="lst__corpo">
      <div class="lst__seccoes">
        <section class="lst__seccao" data-seccao="pecas" aria-labelledby="lst-t-pecas">
          <header class="lst__seccao-cabeca"><h2 id="lst-t-pecas">${L(pkg)}Peças sobresselentes <span class="lst__cont" data-n="pecas">${pecas.length}</span></h2>${so || !pecas.length ? '' : botao('lst__adicionar', plus, 'Adicionar peça', ' data-adicionar="peca"')}</header>
          ${so ? '' : procura}
          ${pecas.length ? `<div class="lst__rolo"><table class="lst__tabela lst__tabela--pecas">
            <colgroup><col class="c-marca"><col class="c-ref"><col class="c-desc"><col class="c-qtd"><col class="c-n"><col class="c-n"><col class="c-d"><col class="c-n"><col class="c-fim"></colgroup>
            <thead><tr class="lst__grupos"><th colspan="4" scope="colgroup"><span class="sr-only">Peça</span></th><th scope="colgroup" class="lst__g-romafe"><span data-dica="O que a oficina paga à Romafe, por unidade, sem IVA">Romafe ${L(info)}</span></th><th colspan="3" scope="colgroup" class="lst__g-cliente"><span data-dica="O que a oficina cobra ao cliente, sem IVA">Cliente ${L(info)}</span></th><th></th></tr>
            <tr><th scope="col">Marca</th><th scope="col">Referência</th><th scope="col">Descrição</th><th scope="col" class="lst__n">Qtd.</th><th scope="col" class="lst__n">Preço líquido</th><th scope="col" class="lst__n">PVP</th><th scope="col" class="lst__n">Desc. %</th><th scope="col" class="lst__n">Total</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead>
            <tbody>${linhasP}</tbody></table></div>`
          : vazio('<p>Ainda não há peças nesta lista. Adicione pela referência, ou pelo Catálogo com «Adicionar à minha lista».</p>', botao('lst__adicionar', plus, 'Adicionar peça', ' data-adicionar="peca"'))}
        </section>
        <section class="lst__seccao" data-seccao="mao" aria-labelledby="lst-t-mao">
          <header class="lst__seccao-cabeca"><h2 id="lst-t-mao">${L(wrench)}Mão de obra <span class="lst__cont" data-n="mao">${mao.length}</span></h2>${so || !mao.length ? '' : botao('lst__adicionar', plus, 'Adicionar mão de obra', ' data-adicionar="mao"')}</header>
          ${mao.length ? `<div class="lst__rolo"><table class="lst__tabela lst__tabela--mao">
            <colgroup><col class="c-desc"><col class="c-qtd"><col class="c-n"><col class="c-d"><col class="c-n"><col class="c-fim"></colgroup>
            <thead><tr><th scope="col">Descrição</th><th scope="col" class="lst__n">Horas</th><th scope="col" class="lst__n">Preço/hora</th><th scope="col" class="lst__n">Desc. %</th><th scope="col" class="lst__n">Total</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead>
            <tbody>${linhasM}</tbody></table></div>`
          : vazio('<p>Ainda não adicionaste mão de obra.</p>', so ? '' : botao('lst__adicionar', plus, 'Adicionar mão de obra', ' data-adicionar="mao"'))}
        </section>
      </div>
      ${resumo}
    </div>
    <p class="sr-only" data-anuncio role="status" aria-live="polite"></p>
  </main>
  ${dialogo('eliminar', e === 'eliminar', `<span class="lst__dialogo-ic lst__dialogo-ic--erro">${L(trash)}</span><h2>Eliminar a lista «${nome}»?</h2><p>As ${pecas.length} peças e os ${mao.length} trabalhos saem da lista. Os pedidos já feitos a partir dela não mudam. Não se pode desfazer.</p><div class="lst__dialogo-accoes">${botao('btn--ghost', x, 'Cancelar', ' data-fechar')}${botao('lst__perigo', trash, 'Eliminar a lista', ' data-confirmar-eliminar')}</div>`)}
  ${dialogo('enviar', e === 'a-enviar' && false, `<span class="lst__dialogo-ic">${L(send)}</span><h2>Enviar a lista</h2><p>Envie a lista, com os preços do cliente, por correio eletrónico.</p><label class="lst__campo-d"><span>Para</span><span class="lst__caixa-d">${L(mail)}<input type="email" data-destino value="oficina@exemplo.pt" autocomplete="email"></span></label><div class="lst__dialogo-accoes">${botao('btn--ghost', x, 'Cancelar', ' data-fechar')}${botao('btn--acao', send, 'Enviar', ' data-confirmar-enviar')}</div>`)}
  ${dialogo('abrir', false, `<span class="lst__dialogo-ic">${L(folderOpen)}</span><h2>Abrir lista</h2><label class="lst__caixa-d">${L(search)}<input data-procura-listas placeholder="Procurar pelo nome ou pelo n.º" aria-label="Procurar listas"></label><ul class="lst__listas">${[['Renault Scénic II · 12-AB-34', 'L2024/000318', 'hoje'], ['Peugeot 308 · 45-XZ-91', 'L2024/000301', '10 out.'], ['VW Golf VII · revisão', 'L2024/000287', '2 out.']].map(([n, id, q]) => `<li><button type="button" data-fechar><b>${n}</b><span>${id} · alterada ${q}</span></button></li>`).join('')}</ul><div class="lst__dialogo-accoes">${botao('btn--ghost', x, 'Fechar', ' data-fechar')}</div>`)}
  ${dialogo('sair', false, `<span class="lst__dialogo-ic">${L(alert)}</span><h2>Tem alterações por guardar</h2><p>Se sair agora, as alterações à lista «${nome}» perdem-se.</p><div class="lst__dialogo-accoes">${botao('btn--ghost', x, 'Ficar', ' data-fechar')}${botao('btn--ghost', rotate, 'Sair sem guardar', ' data-sair')}${botao('btn--acao', save, 'Guardar e sair', ' data-guardar-sair')}</div>`)}
</div>`;
}
