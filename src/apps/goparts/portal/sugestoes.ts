/* =========================================================
   PEÇA A PEÇA — quatro sugestões (26 nov. 2026)
   Ela colou quatro ideias e pediu-as no menu, por baixo da Minha lista, com «(sugestão)»: o comparador de
   alternativas, a encomenda em lote (CSV ou colado do Excel), a pesquisa por fotografia e os alertas de
   disponibilidade. O assistente (o bot opcional) é um botão no canto inferior direito, em comportamento/sugestoes.ts.
   Tudo com os dados do catálogo de exemplo (REFERENCIAS, equivalentes); o que o protótipo não sabe, diz-se:
   - a compatibilidade com a versão exata confirma-se na ficha (o catálogo de exemplo não a liga a veículos);
   - um .xlsx não se lê sem uma biblioteca nova: copiam-se as colunas do Excel ou guarda-se como CSV;
   - a leitura do texto da fotografia só existe nos navegadores com TextDetector; nos outros, escreve-se o código.
   Os ecrãs usam as peças do histórico (css/historico.css) e as suas (css/sugestoes.css).
   ========================================================= */
import { L, GARAGEM, nomeCarro } from './inicio-espaco';
import { interesseBtn } from './interesse';
import { REFERENCIAS, euros, saida, equivalentes, type Referencia } from './catalogo-dados';
import search from 'lucide-static/icons/search.svg?raw';
import upload from 'lucide-static/icons/upload.svg?raw';
import download from 'lucide-static/icons/download.svg?raw';
import camera from 'lucide-static/icons/camera.svg?raw';
import bell from 'lucide-static/icons/bell-plus.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import cart from 'lucide-static/icons/shopping-cart.svg?raw';
import lightbulb from 'lucide-static/icons/lightbulb.svg?raw';

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const cab = (titulo: string, sub: string) => `<header class="hx__cabeca"><div><p class="sg__selo">${L(lightbulb)}Sugestão</p><h1 class="hx__titulo">${titulo}</h1><p class="hx__sub">${sub}</p></div></header>`;
const pagina = (k: string, corpo: string) => `<div class="portal portal--v3 portal--v22 portal--noite portal--ini3 portal--hx portal--sg portal--sg-${k}"><main class="hx sg" data-sg="${k}">${corpo}</main><p class="sr-only" role="status" aria-live="polite" data-sg-aviso></p></div>`;
export const liquido = (r: Referencia) => Math.round(r[4] * (1 - r[5] / 100) * 100) / 100;
const opcoesRefs = () => REFERENCIAS.map((r) => `<option value="${esc(r[2])}">${esc(r[1])} ${esc(r[2])} · ${esc(r[3])}</option>`).join('');
const opcoesCarros = (vazio: string) => `<option value="">${vazio}</option>${GARAGEM.map((c) => `<option value="${c.matricula}">${esc(nomeCarro(c))} · ${c.matricula}</option>`).join('')}`;

/* ---------- 3 · Comparador de alternativas ---------- */
export function comparadorHtml(): string {
  return pagina('comparador', `${cab('Comparar alternativas', 'Escolha a peça: as referências equivalentes de outros fabricantes aparecem lado a lado, com o preço da sua conta, o stock e o prazo.')}
    <form class="hx__barra" onsubmit="return false">
      <label class="hx__campo hx__campo--sel sg__largo">${L(search)}<span class="sr-only">Peça</span><select data-sg-ref>${opcoesRefs()}</select></label>
      <label class="hx__campo hx__campo--sel"><span class="sr-only">Veículo</span><select data-sg-carro>${opcoesCarros('Sem veículo')}</select></label>
      <label class="hx__campo hx__campo--sel"><span class="sr-only">Ordenar</span><select data-sg-ordem><option value="preco">Mais barata primeiro</option><option value="prazo">Mais rápida primeiro</option><option value="stock">Mais stock primeiro</option></select></label>
    </form>
    <div data-sg-comparacao></div>
    <p class="hx__aviso-l">${L(info)}<span>As alternativas são as equivalências do catálogo: o mesmo grupo de montagem, a mesma posição e a mesma composição. A compatibilidade com a versão exata do veículo confirma-se na ficha de cada peça.</span></p>`);
}
export function comparacao(ref: string, carro: string, ordem: string): string {
  const r = REFERENCIAS.find((x) => x[2] === ref) ?? REFERENCIAS[0];
  const prazo = (x: Referencia) => (x[6] ? 0 : x[7] ? 1 : 4);
  const todas = [r, ...equivalentes(r)].sort((a, b) => (ordem === 'prazo' ? prazo(a) - prazo(b) || liquido(a) - liquido(b) : ordem === 'stock' ? (b[6] + b[7]) - (a[6] + a[7]) : liquido(a) - liquido(b)));
  const barata = Math.min(...todas.map(liquido)), c = GARAGEM.find((g) => g.matricula === carro);
  if (todas.length === 1) return `<div class="hx__vazio"><div><b>${esc(r[1])} ${esc(r[2])} não tem equivalências no catálogo.</b><p>Escolha outra peça, ou procure no Catálogo por grupo de montagem.</p></div></div>`;
  /* (26 nov.) ela: «quero em cards lado a lado para comparar» — um cartão por opção, as mesmas linhas à mesma altura
     (subgrid): referência, características, preço, disponibilidade, compatibilidade, ação */
  return `<p class="hx__conta"><b>${todas.length}</b> opções para «${esc(r[3])}»${c ? ` · para o ${esc(nomeCarro(c))} (${c.matricula})` : ''}</p>
    <ul class="sg__cartoes" role="list">${todas.map((x) => { const tem = x[6] + x[7] > 0; return `<li class="sg__cartao${x === r ? ' is-escolhida' : ''}${liquido(x) === barata ? ' is-barata' : ''}">
      <div class="sg__c-cab"><span class="sg__fab">${esc(x[1])}</span><b class="hx__ref sg__ref">${esc(x[2])}</b>${x === r ? '<span class="sg__etq">A que escolheu</span>' : ''}</div>
      <p class="sg__c-desc">${esc(x[3])}</p>
      <div class="sg__c-preco"><b>${euros(liquido(x))}</b>${liquido(x) === barata ? '<span class="sg__melhor">A mais barata</span>' : `<span>+${euros(liquido(x) - barata)} do que a mais barata</span>`}<small>PVP ${euros(x[4])} · −${x[5]} %</small></div>
      <div class="sg__c-disp"><span class="hx__estado hx__estado--${tem ? 'ok' : 'atencao'}"><span>${tem ? saida(x[6], x[7]) : saida(0, 0)}</span></span><small>${tem ? `Porto ${x[6]} · Sacavém ${x[7]}` : 'Sem stock agora'}</small></div>
      <div class="sg__c-compat"><small>${c ? 'Confirme na ficha para esta versão.' : 'Escolha o veículo para confirmar.'}</small><button type="button" class="hx__limpar sg__ficha" data-sg-ficha="${esc(x[2])}" data-sg-fab="${esc(x[1])}">Abrir a ficha</button></div>
      <div class="sg__c-acao">${tem ? `<button type="button" class="btn btn--acao" data-sg-pedir="${esc(x[2])}">${L(cart, 'btn__icone')}<span class="btn__rotulo">Adicionar ao carrinho</span></button>` : interesseBtn(x[2])}</div>
    </li>`; }).join('')}</ul>`;
}

/* ---------- 4 · Encomenda em lote ---------- */
export function loteHtml(): string {
  return pagina('lote', `${cab('Encomenda em lote', 'Carregue uma lista de referências e quantidades: o portal encontra os artigos, assinala os que precisam de confirmação e prepara o carrinho.')}
    <section class="sg__lote-entrada">
      <label class="sg__soltar" data-sg-soltar>${L(upload)}<span><b>Escolher ficheiro CSV</b> ou arrastar para aqui</span><small>Uma linha por artigo: referência e quantidade (separadas por «;», «,» ou tabulação). Um .xlsx guarda-se como CSV no Excel — ou copiam-se as duas colunas e colam-se em baixo.</small>
        <input type="file" accept=".csv,text/csv,.txt" data-sg-ficheiro class="sr-only"></label>
      <label class="dvn__rotulo" for="sg-colar">Ou cole aqui as colunas do Excel</label>
      <textarea id="sg-colar" class="dvn__texto sg__colar" rows="6" data-sg-colar placeholder="VKBA 6556;2&#10;VKMV 6PK1873;1&#10;GDB1550;4"></textarea>
      <div class="hx__acoes"><button type="button" class="btn btn--acao" data-sg-ler>${L(search, 'btn__icone')}<span class="btn__rotulo">Identificar os artigos</span></button>
        <button type="button" class="btn hx__btn" data-sg-exemplo>${L(download, 'btn__icone')}<span class="btn__rotulo">Descarregar um exemplo</span></button></div>
    </section>
    <div data-sg-lote></div>`);
}
const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
export type LinhaLote = { pedido: string; qtd: number; estado: 'ok' | 'confirmar' | 'nao'; r?: Referencia; candidatas: Referencia[]; motivo: string };
/** Cada linha: a referência exata, ou as que a contêm (a confirmar), ou nenhuma. */
export function lerLote(texto: string): LinhaLote[] {
  return texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const [ref0, q0] = l.split(/[;\t,]/).map((x) => x.trim());
    const qtd = Number((q0 ?? '1').replace(',', '.')), pedido = ref0 ?? '';
    const n = norm(pedido), exata = REFERENCIAS.find((r) => norm(r[2]) === n);
    const parecidas = n.length >= 4 ? REFERENCIAS.filter((r) => norm(r[2]).includes(n) || n.includes(norm(r[2]))) : [];
    if (!Number.isInteger(qtd) || qtd < 1) return { pedido, qtd: 1, estado: 'confirmar', r: exata, candidatas: exata ? [exata] : parecidas, motivo: `Quantidade «${q0 ?? ''}» não é um número inteiro: confirme.` };
    if (exata) return exata[6] + exata[7] >= qtd ? { pedido, qtd, estado: 'ok', r: exata, candidatas: [exata], motivo: saida(exata[6], exata[7]) } : { pedido, qtd, estado: 'confirmar', r: exata, candidatas: [exata], motivo: `Só há ${exata[6] + exata[7]} em stock para ${qtd} pedidas.` };
    if (parecidas.length) return { pedido, qtd, estado: 'confirmar', candidatas: parecidas, motivo: parecidas.length === 1 ? 'Referência parecida: confirme que é esta.' : `${parecidas.length} referências parecidas: escolha a certa.` };
    return { pedido, qtd, estado: 'nao', candidatas: [], motivo: 'Não existe no catálogo.' };
  });
}

/* ---------- 5 · Pesquisa por fotografia ---------- */
export function fotoHtml(): string {
  return pagina('foto', `${cab('Pesquisar por fotografia', 'Fotografe a etiqueta ou a referência gravada na peça. O código procura-se no catálogo e confirma-se antes de ver os resultados.')}
    <div class="sg__foto">
      <label class="sg__soltar sg__soltar--foto" data-sg-soltar>${L(camera)}<span><b>Tirar ou escolher uma fotografia</b></span><small>No telemóvel abre a câmara.</small>
        <input type="file" accept="image/*" capture="environment" data-sg-imagem class="sr-only"></label>
      <figure class="sg__previa" data-sg-previa hidden><img alt="A fotografia escolhida" data-sg-img><figcaption data-sg-leitura></figcaption></figure>
      <form class="sg__codigo" data-sg-codigo-form onsubmit="return false" hidden>
        <label class="dvn__rotulo" for="sg-codigo">Código que se lê na peça</label>
        <div class="hx__acoes"><input id="sg-codigo" class="dvn__texto sg__codigo-campo" data-sg-codigo autocomplete="off" spellcheck="false" placeholder="ex.: VKBA 6556">
          <button type="submit" class="btn btn--acao" data-sg-procurar>${L(search, 'btn__icone')}<span class="btn__rotulo">Procurar este código</span></button></div>
      </form>
      <div data-sg-foto-res></div>
    </div>`);
}

/* ---------- 7 · Alertas de disponibilidade ---------- */
export const CHAVE_ALERTAS = 'goparts:alertas:v1';
export function alertasHtml(): string {
  const sem = REFERENCIAS.filter((r) => r[6] + r[7] === 0);
  return pagina('alertas', `${cab('Alertas de disponibilidade', 'Peça para ser avisado quando uma peça sem stock voltar a ter, ou quando o prazo mudar. O aviso traz a referência, o veículo e o acesso rápido à encomenda.')}
    <form class="hx__barra sg__novo-alerta" data-sg-alerta-form onsubmit="return false">
      <label class="hx__campo hx__campo--sel sg__largo"><span class="sr-only">Peça</span><select data-sg-alerta-ref>${REFERENCIAS.map((r) => `<option value="${esc(r[2])}">${esc(r[1])} ${esc(r[2])} · ${r[6] + r[7] ? `${r[6] + r[7]} em stock` : 'sem stock'}</option>`).join('')}</select></label>
      <label class="hx__campo hx__campo--sel"><span class="sr-only">Veículo</span><select data-sg-alerta-carro>${opcoesCarros('Sem veículo')}</select></label>
      <button type="submit" class="btn btn--acao" data-sg-alerta-criar>${L(bell, 'btn__icone')}<span class="btn__rotulo">Avisar-me</span></button>
    </form>
    <p class="hx__conta">${sem.length} ${sem.length === 1 ? 'peça do catálogo está' : 'peças do catálogo estão'} sem stock agora: ${sem.map((r) => `${esc(r[1])} ${esc(r[2])}`).join(', ')}.</p>
    <div data-sg-alertas></div>
    <p class="hx__aviso-l">${L(info)}<span>Neste protótipo os alertas ficam no navegador e o estado vê-se aqui (pelo stock dos dados); num servidor, o aviso chegaria também por e-mail.</span></p>`);
}
