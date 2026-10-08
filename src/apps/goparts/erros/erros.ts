/* =========================================================
   GOPARTS — os ecrãs de erro
   Ela, 8 out. 2026: «no GoParts fazer agora os ecrãs de erro».
   Cada um diz o que aconteceu em linguagem de quem compra peças, o que
   fazer a seguir, e dá sempre uma saída: um botão (ícone e texto) e o
   contacto da Romafe. O código técnico fica pequeno, para o apoio.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import { portal, GOPARTS, type IdPortal } from '../portal/base';

export type IdErro = 'erro-404' | 'erro-500' | 'erro-403' | 'erro-sessao' | 'erro-rede' | 'erro-manutencao' | 'erro-formulario' | 'erro-vazio' | 'erro-encomenda';

const I = (d: string, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const BOTAO = (texto: string, icone: string, tipo = 'btn--acao', extra = '') => `<button type="button" class="btn ${tipo}"${extra}>${I(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;

const IC = {
  inicio: '<path d="m3 11 9-7 9 7"/><path d="M5.5 9.5V20h13V9.5"/>',
  voltar: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
  denovo: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  lupa: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/>',
  mapa: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2Z"/><path d="M9 4v14M15 6v14"/>',
  servidor: '<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  cadeado: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  entrar: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
  semrede: '<path d="m2 2 20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.8a15 15 0 0 1 4.2-2.7M10.7 5.1A15 15 0 0 1 22 8.8M5 12.9a10 10 0 0 1 5.2-2.7M16.8 11.2a10 10 0 0 1 2.2 1.7"/><path d="M12 20h.01"/>',
  chave: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8-1.3-1.3a4 4 0 0 0-5-5L13 2l-2 2 3.7 2.3Z"/><path d="m3 21 6-6"/>',
  aviso: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  caixa: '<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
  telefone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  lixo: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>',
  carrinho: '<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
};

const APOIO = `<p class="er-apoio">${I(IC.telefone)}<span>Apoio Romafe · <strong>+351 226 158 300</strong> · romafe@romafe.com</span></p>`;

/** O erro de página inteira, dentro do portal: um número grande, o que
    aconteceu, o que fazer, os botões e o apoio. */
function pagina(ativa: IdPortal | null, o: { codigo: string; icone: string; cor: 'azul' | 'erro' | 'aviso'; titulo: string; texto: string; botoes: string; ref?: string }): string {
  return portal(ativa, `<div class="portal portal--erro">
  <main class="er-pagina">
    <section class="er-cartao" role="alert">
      <div class="er-cartao__cabeca">
        <span class="er-icone er-icone--${o.cor}">${I(o.icone)}</span>
        <p class="er-codigo">${o.codigo}</p>
      </div>
      <h1 class="er-titulo">${o.titulo}</h1>
      <p class="er-texto">${o.texto}</p>
      <div class="er-botoes">${o.botoes}</div>
      ${o.ref ? `<p class="er-ref">Referência do erro: <code>${o.ref}</code> · diga-a ao apoio, se ligar</p>` : ''}
      ${APOIO}
    </section>
  </main>
</div>`, GOPARTS);
}

/* ---------- 33 · sessão expirada: o Início por trás, e o aviso por cima ---------- */
function sessao(): string {
  return portal('inicio', `<div class="portal portal--erro">
  <main class="er-pagina er-pagina--atras" aria-hidden="true">
    <div class="er-fantasma"></div><div class="er-fantasma"></div><div class="er-fantasma"></div>
  </main>
  <div class="er-veu"></div>
  <section class="er-dialogo" role="alertdialog" aria-labelledby="er-sessao-titulo">
    <span class="er-icone er-icone--aviso">${I(IC.relogio)}</span>
    <h2 class="er-titulo er-titulo--dialogo" id="er-sessao-titulo">A sua sessão terminou</h2>
    <p class="er-texto">Esteve 30 minutos sem atividade. Por segurança, volte a entrar. O carrinho e a pesquisa ficam como estavam.</p>
    <div class="er-botoes er-botoes--coluna">${BOTAO('Voltar a entrar', IC.entrar, 'btn--acao btn--bloco')}</div>
  </section>
</div>`, GOPARTS);
}

/* ---------- 34 · sem ligação: faixa por cima, o que já estava continua à vista ---------- */
const LINHAS = [
  ['P2026/001256', '07/10/2026', 'Porto', 'Rua da Indústria, 123', '342,50 €'],
  ['P2026/001233', '06/10/2026', 'Lisboa', 'Av. Infante D. Henrique, 55', '1 245,90 €'],
  ['P2026/001198', '02/10/2026', 'Porto', 'Rua da Indústria, 123', '87,30 €'],
];
function rede(): string {
  return portal('pedidos', `<div class="portal portal--erro">
  <div class="er-faixa" role="alert">${I(IC.semrede)}<span><strong>Sem ligação à internet.</strong> Está a ver os pedidos de há 4 minutos. Pesquisar e encomendar volta quando a ligação voltar.</span>${BOTAO('Tentar de novo', IC.denovo, 'btn--ghost btn--sm')}</div>
  <main class="er-conteudo">
    <h1 class="er-titulo er-titulo--pagina">Histórico de pedidos</h1>
    <table class="er-tabela er-tabela--antiga">
      <thead><tr><th>Pedido</th><th>Data</th><th>Armazém</th><th>Morada de entrega</th><th>Valor</th></tr></thead>
      <tbody>${LINHAS.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    <div class="er-acao-parada">${BOTAO('Pesquisar', IC.lupa, 'btn--acao', ' disabled title="Sem ligação"')}<span>Desligado até a ligação voltar</span></div>
  </main>
</div>`, GOPARTS);
}

/* ---------- 35 · manutenção: sem portal, que não está disponível ---------- */
function manutencao(): string {
  return `<div class="er-manutencao" role="alert">
    <span class="romafe er-manutencao__romafe">ROMAFE</span>
    <span class="er-manutencao__risco" aria-hidden="true"></span>
    <p class="er-manutencao__produto">GoParts</p>
    <span class="er-icone er-icone--azul">${I(IC.chave)}</span>
    <h1 class="er-titulo">Estamos a melhorar o GoParts</h1>
    <p class="er-texto">O portal volta <strong>hoje às 07:00</strong>. Para encomendas urgentes até lá, ligue para o apoio.</p>
    ${APOIO}
  </div>`;
}

/* ---------- 36 · erros no formulário ---------- */
function formulario(): string {
  return portal('inicio', `<div class="portal portal--erro">
  <main class="er-conteudo er-conteudo--estreito">
    <section class="er-painel">
      <header class="er-painel__cabeca">${I('<path d="M5 17h14"/><path d="M3 13l2-6h14l2 6v4H3Z"/><circle cx="7.5" cy="14" r="1"/><circle cx="16.5" cy="14" r="1"/>')}<h2>Identificar veículo</h2></header>
      <div class="er-resumo" role="alert">${I(IC.aviso)}<div><p><strong>Há 2 campos a corrigir</strong></p><ul><li><a href="#">Matrícula</a></li><li><a href="#">N.º de chassi</a></li></ul></div></div>
      <div class="campo campo--erro">
        <label class="campo__label" for="er-mat">Matrícula</label>
        <input class="input" id="er-mat" value="AA-0-BB" aria-invalid="true" aria-describedby="er-mat-msg">
        <p class="campo__erro" id="er-mat-msg">${I(IC.aviso)}A matrícula tem 6 letras ou números, com ou sem traços: AA-00-BB.</p>
      </div>
      <div class="campo campo--erro">
        <label class="campo__label" for="er-chassi">N.º de chassi</label>
        <input class="input" id="er-chassi" value="VF1RFB00X5" aria-invalid="true" aria-describedby="er-chassi-msg">
        <p class="campo__erro" id="er-chassi-msg">${I(IC.aviso)}O n.º de chassi tem 17 caracteres. Este tem 10.</p>
      </div>
      <div class="campo">
        <label class="campo__label" for="er-motor">Motor</label>
        <input class="input" id="er-motor" value="K9K 608">
      </div>
      <footer class="er-painel__pe">${BOTAO('Limpar', IC.lixo, 'btn--ghost')}${BOTAO('Pesquisar', IC.lupa)}</footer>
    </section>
  </main>
</div>`, GOPARTS);
}

/* ---------- 37 · pesquisa sem resultados ---------- */
function vazio(): string {
  return portal('catalogo', `<div class="portal portal--erro">
  <main class="er-conteudo">
    <div class="er-pesquisa"><span class="er-pesquisa__termo">${I(IC.lupa)}Referência <strong>0986 4B 99X</strong></span><span class="er-pesquisa__filtros">IAM · com equivalências</span></div>
    <section class="er-vazio">
      <span class="er-icone er-icone--azul">${I(IC.caixa)}</span>
      <h1 class="er-titulo">Não encontrámos a referência 0986 4B 99X</h1>
      <p class="er-texto">Pode ser um carácter trocado. Experimente:</p>
      <ul class="er-sugestoes">
        <li>Procurar só o início da referência: <a href="#">0986 4B</a></li>
        <li>Incluir as referências de origem (OE), além das IAM</li>
        <li>Procurar pela matrícula do veículo, em vez da referência</li>
      </ul>
      <div class="er-botoes">${BOTAO('Procurar 0986 4B', IC.lupa)}${BOTAO('Pesquisar por matrícula', IC.voltar, 'btn--ghost')}</div>
      <p class="er-ref">Não encontra a peça? Ligue para o apoio, que procura connosco: +351 226 158 300</p>
    </section>
  </main>
</div>`, GOPARTS);
}

/* ---------- 38 · encomenda não concluída ---------- */
function encomenda(): string {
  return portal(null, `<div class="portal portal--erro">
  <main class="er-conteudo er-conteudo--estreito">
    <h1 class="er-titulo er-titulo--pagina">${I(IC.carrinho)}O seu carrinho</h1>
    <div class="er-resumo" role="alert">${I(IC.aviso)}<div><p><strong>A encomenda não foi feita.</strong> Um dos artigos deixou de ter stock suficiente enquanto encomendava. Nada foi cobrado.</p></div></div>
    <ul class="er-carrinho">
      <li><div><p class="er-carrinho__nome">Disco de travão dianteiro · Brembo 09.A727.11</p><p class="er-carrinho__nota">2 unidades · Porto</p></div><strong>86,40 €</strong></li>
      <li class="er-carrinho__falha"><div><p class="er-carrinho__nome">Pastilhas de travão · TRW GDB1550</p><p class="er-carrinho__nota er-carrinho__nota--erro">${I(IC.aviso)}Pediu 4, há 2 no Porto. Lisboa tem 6, com entrega amanhã.</p></div><strong>52,10 €</strong></li>
      <li><div><p class="er-carrinho__nome">Filtro de óleo · UFI 23.130.00</p><p class="er-carrinho__nota">1 unidade · Porto</p></div><strong>7,85 €</strong></li>
    </ul>
    <div class="er-botoes er-botoes--fim">${BOTAO('Tirar 2 do Porto e 2 de Lisboa', IC.caixa, 'btn--ghost')}${BOTAO('Encomendar só as 2 do Porto', IC.carrinho)}</div>
  </main>
</div>`, GOPARTS);
}

export function ecrasErro(): Ecra<IdErro>[] {
  const FLUXO = 'Erros';
  const e = (id: IdErro, nome: string, objetivo: string, html: string): Ecra<IdErro> =>
    ({ id, nome, fluxo: FLUXO, objetivo, versoes: [{ id: 'v1', nota: 'Primeira versão', html }] });
  return [
    e('erro-404', '30 · Página não encontrada', 'Uma ligação antiga ou um endereço escrito à mão: diz que a página não existe e leva ao Início ou à pesquisa.',
      pagina(null, { codigo: '404', icone: IC.mapa, cor: 'azul', titulo: 'Esta página não existe', texto: 'Pode ter vindo de uma ligação antiga, ou o endereço tem um engano. As suas encomendas e o carrinho não foram tocados.', botoes: BOTAO('Ir para o Início', IC.inicio) + BOTAO('Pesquisar peças', IC.lupa, 'btn--ghost') })),
    e('erro-500', '31 · Erro do servidor', 'Uma falha do nosso lado: pede desculpa, diz que não se perdeu nada e dá a referência para o apoio.',
      pagina(null, { codigo: '500', icone: IC.servidor, cor: 'erro', titulo: 'Algo correu mal do nosso lado', texto: 'Não perdeu nada: o carrinho está guardado. Tente de novo dentro de um minuto; se continuar, ligue-nos com a referência abaixo.', botoes: BOTAO('Tentar de novo', IC.denovo) + BOTAO('Ir para o Início', IC.inicio, 'btn--ghost'), ref: 'GP-20261008-7F3A' })),
    e('erro-403', '32 · Sem permissão', 'A conta entra, mas esta área não é para ela (por exemplo, as faturas são só do administrador da empresa).',
      pagina('guias', { codigo: '403', icone: IC.cadeado, cor: 'aviso', titulo: 'Esta área não está aberta à sua conta', texto: 'As guias de remessa da Oficina Exemplo só se veem com a conta do administrador. Peça-lhe acesso, ou entre com essa conta.', botoes: BOTAO('Voltar', IC.voltar) + BOTAO('Ir para o Início', IC.inicio, 'btn--ghost') })),
    e('erro-sessao', '33 · Sessão expirada', 'Depois de 30 minutos parado: um aviso por cima do ecrã, sem perder o carrinho nem a pesquisa.', sessao()),
    e('erro-rede', '34 · Sem ligação', 'A internet caiu: uma faixa em cima, o que já estava continua à vista, e as ações que precisam da rede ficam desligadas.', rede()),
    e('erro-manutencao', '35 · Em manutenção', 'O portal está parado de propósito: diz até quando e como encomendar com urgência.', manutencao()),
    e('erro-formulario', '36 · Erros no formulário', 'A pesquisa por veículo com dois campos errados: um resumo em cima com ligações, e cada campo diz o que está mal e como deve ser.', formulario()),
    e('erro-vazio', '37 · Pesquisa sem resultados', 'A referência não existe: sugere o que pode estar mal e dá outros caminhos.', vazio()),
    e('erro-encomenda', '38 · Encomenda não concluída', 'O stock mudou enquanto se encomendava: diz que nada foi cobrado, aponta o artigo e propõe duas saídas.', encomenda()),
  ];
}

export const DESCRICAO_ERROS = 'O que se vê quando algo falha: páginas que não existem, falhas nossas, falta de acesso, sessão, rede, manutenção, formulários, pesquisas vazias e encomendas.';
