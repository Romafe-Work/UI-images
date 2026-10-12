/* =========================================================
   ERP — os ecrãs de carregamento e de erro (12 out. 2026)
   Ela: «para o ERP vamos criar os ecrãs de loading e de error states».
   As mesmas regras do GoParts: o esqueleto tem a forma do que vem; o
   girador só onde não se sabe a forma; a percentagem só quando se sabe
   quanto falta. Cada erro diz o que aconteceu, o que fazer e dá uma saída.
   O conteúdo é do módulo de Compras, o primeiro do ERP.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { erp, I, IC } from './moldura';

export type IdCarregarErp = 'carga-pagina' | 'carga-inicio' | 'carga-tabela' | 'carga-ficha' | 'carga-mais' | 'carga-progresso' | 'carga-pecas';
export type IdErroErp = 'erro-404' | 'erro-500' | 'erro-403' | 'erro-licenca' | 'erro-sessao' | 'erro-rede' | 'erro-manutencao' | 'erro-formulario' | 'erro-conflito' | 'erro-vazio';

const GIRADOR = (cls = '') => `<span class="girador${cls ? ' ' + cls : ''}" aria-hidden="true"></span>`;
const E = (largura: number | string, cls = '') => `<span class="esq${cls ? ' ' + cls : ''}" style="width:${typeof largura === 'number' ? largura + '%' : largura}"></span>`;
const BOTAO = (texto: string, icone: string, tipo = 'btn--acao', extra = '') => `<button type="button" class="btn ${tipo}"${extra}>${I(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;

const IC2 = {
  mais: '<path d="M12 5v14M5 12h14"/>',
  pdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  denovo: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  guardar: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  semrede: '<path d="m2 2 20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.8a15 15 0 0 1 4.2-2.7M10.7 5.1A15 15 0 0 1 22 8.8M5 12.9a10 10 0 0 1 5.2-2.7M16.8 11.2a10 10 0 0 1 2.2 1.7"/><path d="M12 20h.01"/>',
  mapa: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2Z"/><path d="M9 4v14M15 6v14"/>',
  servidor: '<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  cadeado: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  lugares: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M17 8v6M14 11h6"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  entrar: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
  chave: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8-1.3-1.3a4 4 0 0 0-5-5L13 2l-2 2 3.7 2.3Z"/><path d="m3 21 6-6"/>',
  aviso: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  caixa: '<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
  telefone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  voltar: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
  olho: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  filtro: '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
  copiar: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
};

const APOIO = `<p class="er-apoio">${I(IC2.telefone)}<span>Apoio do ERP · <strong>+351 226 158 300</strong> · indique a empresa e o ecrã</span></p>`;

/* ---------- os dados de exemplo das encomendas a fornecedor ---------- */
const CABECA = ['Encomenda', 'Fornecedor', 'Data', 'Entrega prevista', 'Linhas', 'Total', 'Estado', ''];
const ENCOMENDAS = [
  ['EF 2026/0412', 'SKF', '09/10/2026', '16/10/2026', '24', '18 420,00 €', 'Enviada'],
  ['EF 2026/0411', 'Brembo', '08/10/2026', '20/10/2026', '9', '6 312,40 €', 'Parcialmente recebida'],
  ['EF 2026/0410', 'UFI Filters', '07/10/2026', '14/10/2026', '15', '2 980,15 €', 'Recebida'],
];
const estado = (e: string) => `<span class="cg-estado${e === 'Recebida' ? '' : e === 'Enviada' ? ' erp-estado--azul' : ' cg-estado--aviso'}">${e}</span>`;
const linhaFeita = (l: string[]) => `<tr>${l.map((c, i) => `<td${i === 5 ? ' class="erp-num"' : ''}>${i === 0 ? `<a href="#">${c}</a>` : i === 6 ? estado(c) : c}</td>`).join('')}<td>${BOTAO('Abrir', IC2.olho, 'btn--ghost btn--sm')}</td></tr>`;
const linhasEsq = (n: number) => Array.from({ length: n }, (_, i) => `<tr class="cg-linha">${[70, 60, 50, 55, 25, 50, 60, 35].map((c) => `<td>${E(Math.max(25, c - (i % 3) * 10), 'esq--texto')}</td>`).join('')}</tr>`).join('');
const titulo = (t: string, sub: string, botoes = '') => `<header class="erp-cabeca"><div><p class="erp-cabeca__caminho">Compras</p><h1 class="erp-cabeca__titulo">${t}</h1><p class="erp-cabeca__sub">${sub}</p></div>${botoes ? `<div class="erp-cabeca__botoes">${botoes}</div>` : ''}</header>`;
function tabela(corpo: string, estadoTopo: string, barra: boolean, rodape = ''): string {
  return `<section class="cg-tabela erp-tabela">
    <div class="cg-tabela__topo"><h2 class="cg-tabela__titulo">Encomendas a fornecedor</h2><p class="cg-tabela__estado" role="status">${estadoTopo}</p></div>
    ${barra ? '<div class="progresso progresso--indeterminado progresso--fino" aria-hidden="true"><span></span></div>' : ''}
    <div class="erp-tabela__rolo"><table><thead><tr>${CABECA.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${corpo}</tbody></table></div>
    ${rodape}
  </section>`;
}
const filtros = (aCarregar: boolean) => `<section class="erp-filtros">
    <div class="campo"><label class="campo__label">Fornecedor</label><input class="input" value="Todos" disabled></div>
    <div class="campo"><label class="campo__label">Data a partir de</label><input class="input" value="01/10/2026" disabled></div>
    <div class="campo"><label class="campo__label">Estado</label><input class="input" value="Por receber" disabled></div>
    ${aCarregar ? `<button type="button" class="btn btn--acao is-a-carregar" disabled>${GIRADOR('girador--claro')}<span class="btn__rotulo">A filtrar…</span></button>` : BOTAO('Filtrar', IC2.filtro)}
  </section>`;

/* ================= CARREGAMENTO ================= */

/* 20 · o ERP a abrir, depois de entrar */
const pagina = () => `<div class="carga-pagina erp-carga" role="status" aria-live="polite">
    <span class="romafe carga-pagina__romafe">ROMAFE</span>
    <span class="carga-pagina__risco" aria-hidden="true"></span>
    <p class="carga-pagina__produto">Enterprise Resource Planning</p>
    <div class="progresso progresso--indeterminado carga-pagina__barra" aria-hidden="true"><span></span></div>
    <p class="carga-pagina__texto">A abrir a Romafe, SA…</p>
  </div>`;

/* 21 · o Início em esqueleto */
const inicio = () => erp(`<div class="erp-pagina" aria-busy="true">
    <p class="sr-only" role="status">A carregar o Início</p>
    <header class="erp-cabeca"><div>${E('120px', 'esq--rotulo')}${E('280px', 'esq--titulo')}</div></header>
    <div class="erp-numeros">${Array.from({ length: 4 }, () => `<section class="erp-numero" aria-hidden="true">${E(50, 'esq--rotulo')}${E(70, 'esq--preco')}${E(40, 'esq--texto')}</section>`).join('')}</div>
    <div class="erp-dois">
      ${tabela(linhasEsq(5), GIRADOR('girador--pequeno') + 'A carregar…', false).replace('Encomendas a fornecedor', 'Últimas encomendas')}
      <section class="erp-caixa" aria-hidden="true">${E(50, 'esq--titulo')}${Array.from({ length: 5 }, () => `<div class="erp-caixa__linha">${E('36px', 'esq--quadrado esq--botao')}<div>${E(80, 'esq--texto')}${E(50, 'esq--texto')}</div></div>`).join('')}</section>
    </div>
  </div>`, { modulo: 'inicio', sub: null });

/* 22 · uma lista a carregar */
const lista = () => erp(`<div class="erp-pagina" aria-busy="true">
    ${titulo('Encomendas a fornecedor', 'As encomendas feitas aos fornecedores e o que falta receber.', BOTAO('Nova encomenda', IC2.mais, 'btn--acao', ' disabled'))}
    ${filtros(true)}
    ${tabela(linhasEsq(8), GIRADOR('girador--pequeno') + 'A carregar encomendas…', true)}
  </div>`);

/* 23 · uma ficha a carregar: o cabeçalho já chegou, as linhas vêm a caminho */
const ficha = () => erp(`<div class="erp-pagina">
    ${titulo('EF 2026/0412 · SKF', 'Encomenda enviada a 09/10/2026 · entrega prevista a 16/10/2026', BOTAO('PDF', IC2.pdf, 'btn--ghost') + BOTAO('Receber', IC2.caixa))}
    <section class="erp-ficha">
      <div><p class="erp-ficha__rotulo">Fornecedor</p><p class="erp-ficha__valor">SKF</p></div>
      <div><p class="erp-ficha__rotulo">Armazém de entrega</p><p class="erp-ficha__valor">60 · Coimbra</p></div>
      <div><p class="erp-ficha__rotulo">Condições</p><p class="erp-ficha__valor">30 dias</p></div>
      <div><p class="erp-ficha__rotulo">Total</p><p class="erp-ficha__valor">${E('110px', 'esq--preco')}</p></div>
    </section>
    <section class="cg-tabela erp-tabela" aria-busy="true">
      <div class="cg-tabela__topo"><h2 class="cg-tabela__titulo">Linhas</h2><p class="cg-tabela__estado" role="status">${GIRADOR('girador--pequeno')}A carregar 24 linhas…</p></div>
      <div class="erp-tabela__rolo"><table><thead><tr><th>Artigo</th><th>Descrição</th><th>Quantidade</th><th>Recebida</th><th>Preço</th><th>Total</th></tr></thead>
      <tbody>${Array.from({ length: 6 }, (_, i) => `<tr>${[45, 90, 30, 30, 40, 45].map((c) => `<td>${E(Math.max(25, c - (i % 2) * 12), 'esq--texto')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    </section>
  </div>`);

/* 24 · carregar mais, no fim da lista */
const mais = () => erp(`<div class="erp-pagina">
    ${titulo('Encomendas a fornecedor', 'As primeiras já se veem; as outras estão a vir.', BOTAO('Nova encomenda', IC2.mais))}
    ${filtros(false)}
    ${tabela(ENCOMENDAS.map(linhaFeita).join('') + linhasEsq(2), 'A mostrar 3 de 126', false, `<div class="cg-mais" role="status">${GIRADOR('girador--pequeno')}A carregar mais encomendas… <span class="cg-mais__conta">3 de 126</span></div>`)}
  </div>`);

/* 25 · progresso com percentagem: importar a tabela de preços de um fornecedor */
const progresso = () => erp(`<div class="erp-pagina cg-pagina--atras" aria-hidden="true">
    ${titulo('Fornecedores', 'Tabelas de preços e condições de cada fornecedor.')}
    <section class="cg-tabela erp-tabela">
      <div class="cg-tabela__topo"><h2 class="cg-tabela__titulo">Tabelas de preços</h2></div>
      <div class="erp-tabela__rolo"><table><thead><tr><th>Fornecedor</th><th>Tabela</th><th>Artigos</th><th>Atualizada</th><th>Estado</th></tr></thead><tbody>
        <tr><td>SKF</td><td>Setembro de 2026</td><td class="erp-num">12 905</td><td>02/09/2026</td><td>${estado('Recebida').replace('Recebida', 'Em vigor')}</td></tr>
        <tr><td>Brembo</td><td>Outubro de 2026</td><td class="erp-num">8 412</td><td>—</td><td>${estado('Parcialmente recebida').replace('Parcialmente recebida', 'A importar')}</td></tr>
        <tr><td>UFI Filters</td><td>Julho de 2026</td><td class="erp-num">3 288</td><td>15/07/2026</td><td>${estado('Recebida').replace('Recebida', 'Em vigor')}</td></tr>
      </tbody></table></div>
    </section>
  </div>`, { sub: 1, extra: `<div class="cg-veu"></div>
  <section class="cg-dialogo" role="dialog" aria-labelledby="erp-imp-titulo">
    <div class="cg-dialogo__icone">${I(IC2.pdf)}</div>
    <h2 class="cg-dialogo__titulo" id="erp-imp-titulo">A importar a tabela de preços</h2>
    <p class="cg-dialogo__texto">Brembo · tabela de outubro de 2026 · 8 412 artigos</p>
    <div class="progresso" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="64"><span style="width:64%"></span></div>
    <p class="cg-dialogo__conta"><span>5 384 de 8 412 artigos</span><strong>64%</strong></p>
    <p class="cg-dialogo__texto">Pode continuar a trabalhar; avisamos quando acabar.</p>
    <div class="erp-dialogo__botoes">${BOTAO('Continuar a trabalhar', IC2.voltar, 'btn--acao')}${BOTAO('Cancelar', IC2.x, 'btn--ghost')}</div>
  </section>` });

/* 26 · as peças pequenas */
const pecas = () => erp(`<div class="erp-pagina">
    ${titulo('Estados de carregamento', 'As peças que esperam, e o que se vê quando a espera falha.')}
    <div class="erp-grelha">
      <section class="cg-caso"><h3>Botão a guardar</h3>
        <div class="cg-caso__linha">
          <button type="button" class="btn btn--acao is-a-carregar" disabled>${GIRADOR('girador--claro')}<span class="btn__rotulo">A enviar ao fornecedor…</span></button>
          <button type="button" class="btn btn--ghost is-a-carregar" disabled>${GIRADOR()}<span class="btn__rotulo">A guardar rascunho…</span></button>
        </div>
        <p class="cg-caso__nota">O botão mantém a largura, desliga-se e o ícone passa a girador.</p></section>
      <section class="cg-caso"><h3>Lista a carregar</h3>
        <div class="campo"><label class="campo__label">Fornecedor</label>
          <div class="cg-select">${GIRADOR('girador--pequeno')}<span>A carregar fornecedores…</span></div></div>
        <p class="cg-caso__nota">A lista só abre quando chega; até lá diz o que está a vir.</p></section>
      <section class="cg-caso"><h3>Campo a verificar</h3>
        <div class="campo"><label class="campo__label">Artigo</label>
          <div class="cg-input-girador"><input class="input" value="VKBA 3525" readonly>${GIRADOR('girador--pequeno')}</div></div>
        <p class="cg-caso__nota">A procurar o artigo e o último preço enquanto se escreve, sem bloquear a linha.</p></section>
      <section class="cg-caso"><h3>Aviso a guardar</h3>
        <div class="cg-toast" role="status">${GIRADOR('girador--pequeno')}<span>A guardar a encomenda EF 2026/0413…</span></div>
        <div class="cg-toast cg-toast--feito" role="status">${I(IC2.guardar)}<span>Encomenda guardada como rascunho</span></div>
        <p class="cg-caso__nota">O aviso troca de texto quando acaba; não aparece outro por cima.</p></section>
      <section class="cg-caso"><h3>Total a recalcular</h3>
        <div class="erp-total"><span>Total da encomenda</span><strong>${GIRADOR('girador--pequeno')}18 420,00 €</strong></div>
        <p class="cg-caso__nota">Ao mudar uma quantidade, o total antigo fica à vista com o girador ao lado até chegar o novo.</p></section>
      <section class="cg-caso"><h3>Falhou o carregamento</h3>
        <div class="cg-falha">${I(IC2.semrede)}<div><p class="cg-falha__titulo">Não foi possível carregar as encomendas</p><p class="cg-falha__texto">Verifique a ligação. Os filtros ficaram como estavam.</p></div>
          ${BOTAO('Tentar de novo', IC2.denovo, 'btn--ghost btn--sm')}</div>
        <p class="cg-caso__nota">Diz o que falhou e dá uma saída, no sítio onde ia aparecer o conteúdo.</p></section>
    </div>
  </div>`);

/* ================= ERROS ================= */

function cartao(o: { codigo: string; icone: string; cor: 'azul' | 'erro' | 'aviso'; titulo: string; texto: string; botoes: string; ref?: string }): string {
  return `<div class="erp-pagina erp-pagina--centro"><section class="er-cartao" role="alert">
      <div class="er-cartao__cabeca"><span class="er-icone er-icone--${o.cor}">${I(o.icone)}</span><p class="er-codigo">${o.codigo}</p></div>
      <h1 class="er-titulo">${o.titulo}</h1>
      <p class="er-texto">${o.texto}</p>
      <div class="er-botoes">${o.botoes}</div>
      ${o.ref ? `<p class="er-ref">Referência do erro: <code>${o.ref}</code> · diga-a ao apoio, se ligar</p>` : ''}
      ${APOIO}
    </section></div>`;
}

const e404 = () => erp(cartao({ codigo: '404', icone: IC2.mapa, cor: 'azul', titulo: 'Este ecrã não existe', texto: 'Pode ter vindo de uma ligação antiga ou de um favorito de outra versão do ERP. Nada foi alterado.', botoes: BOTAO('Ir para o Início', IC.inicio) + BOTAO('Procurar', IC.lupa, 'btn--ghost') }), { modulo: null, sub: null });
const e500 = () => erp(cartao({ codigo: '500', icone: IC2.servidor, cor: 'erro', titulo: 'Algo correu mal do nosso lado', texto: 'A encomenda que estava a abrir não se perdeu. Tente de novo dentro de um minuto; se continuar, ligue ao apoio com a referência abaixo.', botoes: BOTAO('Tentar de novo', IC2.denovo) + BOTAO('Ir para o Início', IC.inicio, 'btn--ghost'), ref: 'ERP-20261012-4C1E' }));
const e403 = () => erp(cartao({ codigo: '403', icone: IC2.cadeado, cor: 'aviso', titulo: 'O seu perfil não pode aprovar encomendas', texto: 'Encomendas acima de 10 000 € são aprovadas pela direção de compras. A EF 2026/0412 ficou à espera de aprovação; pode pedi-la daqui.', botoes: BOTAO('Pedir aprovação', IC2.entrar) + BOTAO('Voltar à encomenda', IC2.voltar, 'btn--ghost') }));
const licenca = () => erp(cartao({ codigo: 'Licença', icone: IC2.lugares, cor: 'aviso', titulo: 'Não há lugares livres no módulo Vendas', texto: 'A Romafe, SA tem 12 lugares em Vendas e estão todos em uso. Quem gere a licença pode libertar um lugar ou comprar mais.', botoes: BOTAO('Avisar quem gere a licença', IC2.entrar) + BOTAO('Voltar a Compras', IC2.voltar, 'btn--ghost') }), { modulo: 'vendas', sub: null });

const sessao = () => erp(`<div class="erp-pagina" aria-hidden="true">
    ${titulo('Nova encomenda a fornecedor', 'Rascunho · SKF · 18 linhas')}
    <div class="er-fantasma erp-fantasma"></div>
  </div>`, { extra: `<div class="er-veu"></div>
  <section class="er-dialogo" role="alertdialog" aria-labelledby="erp-sessao-titulo">
    <span class="er-icone er-icone--aviso">${I(IC2.relogio)}</span>
    <h2 class="er-titulo er-titulo--dialogo" id="erp-sessao-titulo">A sua sessão terminou</h2>
    <p class="er-texto">Esteve 30 minutos sem atividade. O rascunho da encomenda ficou guardado com as 18 linhas; volte a entrar para continuar.</p>
    <div class="er-botoes er-botoes--coluna">${BOTAO('Voltar a entrar', IC2.entrar, 'btn--acao btn--bloco')}</div>
  </section>` });

const rede = () => erp(`<div class="er-faixa erp-faixa" role="alert">${I(IC2.semrede)}<span><strong>Sem ligação ao servidor.</strong> Está a ver as encomendas de há 3 minutos. Guardar e enviar voltam quando a ligação voltar.</span>${BOTAO('Tentar de novo', IC2.denovo, 'btn--ghost btn--sm')}</div>
  <div class="erp-pagina">
    ${titulo('Encomendas a fornecedor', 'Os dados podem não estar atualizados.', BOTAO('Nova encomenda', IC2.mais, 'btn--acao', ' disabled title="Sem ligação"'))}
    <div class="erp-antiga">${tabela(ENCOMENDAS.map(linhaFeita).join(''), 'Atualizado às 10:42', false)}</div>
  </div>`);

const manutencao = () => `<div class="er-manutencao erp-carga" role="alert">
    <span class="romafe er-manutencao__romafe">ROMAFE</span>
    <span class="er-manutencao__risco" aria-hidden="true"></span>
    <p class="er-manutencao__produto">Enterprise Resource Planning</p>
    <span class="er-icone er-icone--azul">${I(IC2.chave)}</span>
    <h1 class="er-titulo">O ERP está em atualização</h1>
    <p class="er-texto">Volta <strong>hoje às 20:00</strong>. O que ficou guardado antes das 19:00 está seguro; o que não ficou guardado, repita depois.</p>
    ${APOIO}
  </div>`;

const formulario = () => erp(`<div class="erp-pagina">
    ${titulo('Nova encomenda a fornecedor', 'Rascunho · ainda não enviada')}
    <div class="er-resumo" role="alert">${I(IC2.aviso)}<div><p><strong>Há 3 campos a corrigir antes de enviar</strong></p><ul><li><a href="#">Fornecedor</a></li><li><a href="#">Entrega prevista</a></li><li><a href="#">Linha 2 · Quantidade</a></li></ul></div></div>
    <section class="erp-form">
      <div class="campo campo--erro"><label class="campo__label" for="erp-forn">Fornecedor</label>
        <input class="input" id="erp-forn" placeholder="Escolha o fornecedor" aria-invalid="true" aria-describedby="erp-forn-msg">
        <p class="campo__erro" id="erp-forn-msg">${I(IC2.aviso)}Escolha o fornecedor: os preços das linhas vêm da tabela dele.</p></div>
      <div class="campo campo--erro"><label class="campo__label" for="erp-data">Entrega prevista</label>
        <input class="input" id="erp-data" value="03/10/2026" aria-invalid="true" aria-describedby="erp-data-msg">
        <p class="campo__erro" id="erp-data-msg">${I(IC2.aviso)}A data já passou. Use hoje (12/10/2026) ou mais tarde.</p></div>
      <div class="campo"><label class="campo__label" for="erp-arm">Armazém de entrega</label><input class="input" id="erp-arm" value="60 · Coimbra"></div>
    </section>
    <section class="cg-tabela erp-tabela">
      <div class="erp-tabela__rolo"><table><thead><tr><th>#</th><th>Artigo</th><th>Descrição</th><th>Quantidade</th><th>Preço</th></tr></thead><tbody>
        <tr><td>1</td><td>VKBA 3525</td><td>Rolamento de roda</td><td><input class="input erp-celula" value="20"></td><td class="erp-num">—</td></tr>
        <tr class="erp-linha--erro"><td>2</td><td>VKMA 01250</td><td>Kit de distribuição</td><td><div class="campo--erro"><input class="input erp-celula" value="0" aria-invalid="true" aria-describedby="erp-q2"></div><p class="campo__erro" id="erp-q2">${I(IC2.aviso)}Pelo menos 1.</p></td><td class="erp-num">—</td></tr>
      </tbody></table></div>
    </section>
    <div class="er-botoes er-botoes--fim">${BOTAO('Guardar rascunho', IC2.guardar, 'btn--ghost')}${BOTAO('Enviar ao fornecedor', IC2.entrar)}</div>
  </div>`);

const conflito = () => erp(`<div class="erp-pagina">
    ${titulo('EF 2026/0412 · SKF', 'Enviada a 09/10/2026')}
    <div class="er-resumo erp-resumo--aviso" role="alert">${I(IC2.aviso)}<div><p><strong>A Ana Costa alterou esta encomenda enquanto a editava.</strong> As suas alterações não foram gravadas por cima das dela. Escolha o que fica.</p></div></div>
    <section class="cg-tabela erp-tabela">
      <div class="erp-tabela__rolo"><table><thead><tr><th>Campo</th><th>A sua alteração</th><th>A da Ana Costa, às 11:02</th></tr></thead><tbody>
        <tr><td>Linha 4 · VKBA 3525 · quantidade</td><td><strong>30</strong></td><td><strong>40</strong></td></tr>
        <tr><td>Entrega prevista</td><td>16/10/2026 (sem alteração)</td><td><strong>18/10/2026</strong></td></tr>
      </tbody></table></div>
    </section>
    <div class="er-botoes er-botoes--fim">${BOTAO('Copiar as minhas alterações', IC2.copiar, 'btn--ghost')}${BOTAO('Ficar com a versão da Ana', IC2.denovo, 'btn--ghost')}${BOTAO('Juntar: 30 unidades e entrega a 18/10', IC2.guardar)}</div>
  </div>`);

const vazio = () => erp(`<div class="erp-pagina">
    ${titulo('Encomendas a fornecedor', 'As encomendas feitas aos fornecedores e o que falta receber.', BOTAO('Nova encomenda', IC2.mais))}
    ${filtros(false).replace('value="Todos"', 'value="Bosch"')}
    <section class="er-vazio">
      <span class="er-icone er-icone--azul">${I(IC2.caixa)}</span>
      <h2 class="er-titulo">Nenhuma encomenda à Bosch por receber desde 01/10/2026</h2>
      <p class="er-texto">Os filtros podem estar apertados demais. Experimente:</p>
      <ul class="er-sugestoes">
        <li>Mostrar <a href="#">todos os estados</a>, não só «Por receber»</li>
        <li>Recuar a data para <a href="#">o início do ano</a></li>
      </ul>
      <div class="er-botoes">${BOTAO('Limpar filtros', IC2.denovo, 'btn--ghost')}${BOTAO('Nova encomenda à Bosch', IC2.mais)}</div>
    </section>
  </div>`);

export function ecrasCarregarErp(): Ecra<IdCarregarErp>[] {
  const FLUXO = 'Carregamento';
  const e = (id: IdCarregarErp, nome: string, objetivo: string, html: string): Ecra<IdCarregarErp> =>
    ({ id, nome, fluxo: FLUXO, objetivo, versoes: [{ id: 'v1', nota: 'Primeira versão, no módulo de Compras', html }] });
  return [
    e('carga-pagina', '20 · A abrir o ERP', 'Depois de entrar, enquanto o ERP abre a empresa: o ROMAFE, o nome por extenso e uma barra sem fim.', pagina()),
    e('carga-inicio', '21 · Esqueleto do Início', 'O Início com a forma dos números, das últimas encomendas e dos avisos: quando chegam, nada salta.', inicio()),
    e('carga-tabela', '22 · Lista a carregar', 'As encomendas a fornecedor: filtros já escolhidos, a cabeça da tabela à vista e as linhas em esqueleto.', lista()),
    e('carga-ficha', '23 · Ficha a carregar', 'Uma encomenda aberta: o cabeçalho já chegou e as 24 linhas vêm a caminho; só o total espera por elas.', ficha()),
    e('carga-mais', '24 · Carregar mais', 'As primeiras três de 126 encomendas já se veem; as seguintes vêm no fim da lista.', mais()),
    e('carga-progresso', '25 · Progresso com percentagem', 'Importar a tabela de preços de um fornecedor (8 412 artigos): a percentagem, quantos faltam e a opção de continuar a trabalhar.', progresso()),
    e('carga-pecas', '26 · Estados de carregamento', 'As peças pequenas: botão, lista, campo, aviso, total a recalcular e a falha com «Tentar de novo».', pecas()),
  ];
}

export function ecrasErroErp(): Ecra<IdErroErp>[] {
  const FLUXO = 'Erros';
  const e = (id: IdErroErp, nome: string, objetivo: string, html: string): Ecra<IdErroErp> =>
    ({ id, nome, fluxo: FLUXO, objetivo, versoes: [{ id: 'v1', nota: 'Primeira versão, no módulo de Compras', html }] });
  return [
    e('erro-404', '30 · Ecrã não encontrado', 'Uma ligação antiga ou um favorito: diz que o ecrã não existe e leva ao Início ou à procura.', e404()),
    e('erro-500', '31 · Erro do servidor', 'Uma falha do nosso lado: não se perdeu nada, tente de novo, e a referência para o apoio.', e500()),
    e('erro-403', '32 · Sem permissão', 'O perfil entra no módulo mas não pode fazer isto (aprovar acima de 10 000 €): diz quem pode e deixa pedir.', e403()),
    e('erro-licenca', '33 · Sem lugares na licença', 'O módulo está na licença mas todos os lugares estão em uso: a licença diz quantos, o produto diz quem.', licenca()),
    e('erro-sessao', '34 · Sessão expirada', 'Depois de 30 minutos parado: um aviso por cima, com o rascunho guardado.', sessao()),
    e('erro-rede', '35 · Sem ligação', 'O servidor não responde: uma faixa em cima, os dados de há pouco à vista e as ações que gravam desligadas.', rede()),
    e('erro-manutencao', '36 · Em atualização', 'O ERP parado de propósito: até quando, e o que está seguro.', manutencao()),
    e('erro-formulario', '37 · Erros no formulário', 'Uma encomenda nova com três campos errados: o resumo com ligações e cada campo a dizer o que está mal e como deve ser.', formulario()),
    e('erro-conflito', '38 · Alterado por outra pessoa', 'Duas pessoas na mesma encomenda: nada é gravado por cima, mostra as duas versões e deixa escolher ou juntar.', conflito()),
    e('erro-vazio', '39 · Lista sem resultados', 'Os filtros não deixam nada: diz o que se procurou e como alargar.', vazio()),
  ];
}

export const DESCRICAO_CARREGAR_ERP = 'O que se vê enquanto se espera no ERP: a abertura, esqueletos, listas, fichas, progresso e as peças pequenas.';
export const DESCRICAO_ERROS_ERP = 'O que se vê quando algo falha no ERP: ecrãs que não existem, falhas nossas, permissões, licença, sessão, rede, atualização, formulários, conflitos e listas vazias.';
