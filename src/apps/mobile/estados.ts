/* =========================================================
   PICK — os ecrãs de carregamento e de erro (12 out. 2026)
   Ela: «and then do it for mobile as well», depois dos do ERP.
   No ecrã do EDA61K (320 × 533): uma coisa por ecrã, letra grande, e o
   botão da ação em baixo, à largura toda, laranja, com ícone e texto.

   O que está decidido no armazém e se vê aqui:
   - a Pick não trabalha sem rede (16 set.): sem rede, para e espera;
   - entra-se com palavra-passe, não com PIN (17 set.);
   - o sistema entrega uma guia de cada vez; a pessoa não vê a fila (24 set.);
   - falta de quantidade corrige-se na posição, ninguém conta (18 set.);
   - posições com oito algarismos: armazém 60 · zona · coluna · prateleira.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { CARRINHO_MINI } from './cena';

export type IdCarregarPick = 'carga-pagina' | 'carga-tarefa' | 'carga-leitura' | 'carga-fechar';
export type IdErroPick = 'erro-rede' | 'erro-codigo' | 'erro-posicao' | 'erro-quantidade' | 'erro-sessao' | 'erro-servidor' | 'erro-sem-tarefa';

export const I = (d: string, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const GIRADOR = (cls = '') => `<span class="girador${cls ? ' ' + cls : ''}" aria-hidden="true"></span>`;
export const E = (largura: number | string, cls = '') => `<span class="esq${cls ? ' ' + cls : ''}" style="width:${typeof largura === 'number' ? largura + '%' : largura}"></span>`;
export const BOTAO = (texto: string, icone: string, tipo = 'btn--acao', extra = '') => `<button type="button" class="btn ${tipo} pk-botao"${extra}>${I(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;

export const IC = {
  denovo: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  semrede: '<path d="m2 2 20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.8a15 15 0 0 1 4.2-2.7M10.7 5.1A15 15 0 0 1 22 8.8M5 12.9a10 10 0 0 1 5.2-2.7M16.8 11.2a10 10 0 0 1 2.2 1.7"/><path d="M12 20h.01"/>',
  rede: '<path d="M5 12.6a10 10 0 0 1 14 0M8.5 16.1a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0"/><path d="M12 20h.01"/>',
  codigo: '<path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14"/>',
  ler: '<path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3M7 12h10"/>',
  posicao: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  aviso: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  corrigir: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  entrar: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
  servidor: '<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  cafe: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 2v3M12 2v3"/>',
  voltar: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
  fechar: '<path d="M20 6 9 17l-5-5"/>',
  telefone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  gestor: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
};

/* a guia de exemplo: uma guia de separação, linha 7 de 12 */
const GUIA = 'S 2026/1832';

/** O ecrã da Pick: a barra de cima (Pick, a função, a rede e quem está), o corpo e o pé com os botões. */
export function pick(corpo: string, o: { pe?: string; rede?: boolean; classe?: string; funcao?: string } = {}): string {
  return `<div class="pk${o.classe ? ' ' + o.classe : ''}">
  <header class="pk__topo">
    <span class="pk__nome">Pick</span>
    <span class="pk__funcao">${o.funcao ?? 'Separação'}</span>
    <span class="pk__rede${o.rede === false ? ' pk__rede--sem' : ''}" aria-label="${o.rede === false ? 'Sem rede' : 'Com rede'}">${I(o.rede === false ? IC.semrede : IC.rede)}</span>
    <span class="pk__quem" aria-label="Joana Silva">JS</span>
  </header>
  <main class="pk__corpo">${corpo}</main>
  ${o.pe ? `<footer class="pk__pe">${o.pe}</footer>` : ''}
</div>`;
}
const guiaTopo = (linha = 7) => `<p class="pk-guia"><span>Guia ${GUIA}</span><span>Linha ${linha} de 12</span></p>`;
export const aviso = (cor: 'erro' | 'aviso' | 'azul', icone: string, titulo: string, texto: string) => `<section class="pk-aviso pk-aviso--${cor}" role="alert">
      <span class="pk-aviso__icone">${I(icone)}</span>
      <h1 class="pk-aviso__titulo">${titulo}</h1>
      <p class="pk-aviso__texto">${texto}</p>
    </section>`;

/* ================= CARREGAMENTO ================= */

const pagina = () => `<div class="pk pk--cheio" role="status" aria-live="polite">
    <span class="romafe pk-abrir__romafe">ROMAFE</span>
    <span class="pk-abrir__risco" aria-hidden="true"></span>
    <p class="pk-abrir__nome">Pick</p>
    <div class="pk-abrir__via" aria-hidden="true"><span class="pk-abrir__carro">${CARRINHO_MINI}</span></div>
    <p class="pk-abrir__texto">A ligar ao servidor…</p>
  </div>`;

const tarefa = () => pick(`<p class="pk-estado" role="status">${GIRADOR('girador--pequeno')}A receber a sua próxima guia…</p>
    <section class="pk-cartao" aria-hidden="true">
      ${E(55, 'esq--rotulo')}${E(80, 'esq--titulo')}
      <div class="pk-cartao__linha">${E('40px', 'esq--botao esq--quadrado')}<div>${E(70, 'esq--texto')}${E(45, 'esq--texto')}</div></div>
      <div class="pk-cartao__linha">${E('40px', 'esq--botao esq--quadrado')}<div>${E(60, 'esq--texto')}${E(35, 'esq--texto')}</div></div>
    </section>
    <p class="pk-nota">O sistema escolhe a guia pela ordem do armazém. Não precisa de fazer nada.</p>`,
  { pe: `<button type="button" class="btn btn--acao pk-botao is-a-carregar" disabled>${GIRADOR('girador--claro')}<span class="btn__rotulo">A receber…</span></button>` });

const leitura = () => pick(`${guiaTopo()}
    <section class="pk-cartao">
      <p class="pk-rotulo">Vá à posição</p>
      <p class="pk-posicao">60300102</p>
      <p class="pk-posicao__partes">Armazém 60 · Zona 30 · Coluna 01 · Prateleira 02</p>
    </section>
    <div class="campo"><label class="campo__label" for="pk-ler">Leia a posição</label>
      <div class="cg-input-girador"><input class="input pk-campo" id="pk-ler" value="60300102" readonly>${GIRADOR('girador--pequeno')}</div></div>
    <p class="pk-estado" role="status">A confirmar a posição…</p>
    <section class="pk-cartao" aria-hidden="true">${E(40, 'esq--rotulo')}${E(90, 'esq--texto')}${E(60, 'esq--texto')}</section>`,
  { pe: `<button type="button" class="btn btn--acao pk-botao is-a-carregar" disabled>${GIRADOR('girador--claro')}<span class="btn__rotulo">A confirmar…</span></button>` });

const fechar = () => pick(`<p class="pk-guia"><span>Guia ${GUIA}</span><span>12 de 12</span></p>
    <section class="pk-cartao pk-cartao--feito">
      <span class="pk-aviso__icone pk-aviso__icone--ok">${I(IC.fechar)}</span>
      <p class="pk-cartao__titulo">Todas as linhas recolhidas</p>
      <p class="pk-nota">12 linhas · 47 unidades · carro 3</p>
    </section>
    <p class="pk-estado" role="status">${GIRADOR('girador--pequeno')}A fechar a guia e a pedir a próxima…</p>
    <div class="progresso progresso--indeterminado" aria-hidden="true"><span></span></div>`,
  { pe: `<button type="button" class="btn btn--acao pk-botao is-a-carregar" disabled>${GIRADOR('girador--claro')}<span class="btn__rotulo">A fechar a guia…</span></button>` });

/* ================= ERROS ================= */

const rede = () => pick(aviso('aviso', IC.semrede, 'Sem rede', 'A Pick precisa de rede para trabalhar. Aproxime-se de uma zona com sinal; a guia continua sua.')
    + `<p class="pk-nota">O que já confirmou está guardado até à linha 6. A linha 7 fica por confirmar.</p>
    <p class="pk-estado" role="status">${GIRADOR('girador--pequeno')}A procurar rede…</p>`,
  { rede: false, pe: BOTAO('Tentar de novo', IC.denovo) });

const codigo = () => pick(`${guiaTopo()}` + aviso('erro', IC.codigo, 'Código não reconhecido', 'O código lido não é de nenhum artigo nem de nenhuma posição: <strong>5600998877</strong>.')
    + `<p class="pk-nota">Leia a etiqueta da posição ou a do artigo.</p>`,
  { pe: BOTAO('Ler outra vez', IC.ler) });

const posicao = () => pick(`${guiaTopo()}` + aviso('erro', IC.posicao, 'Posição errada', 'Leu <strong>60300104</strong>. A guia pede <strong>60300102</strong>: a mesma coluna, duas prateleiras abaixo.'),
  { pe: BOTAO('Ler a posição certa', IC.ler) });

const quantidade = () => pick(`${guiaTopo()}
    <section class="pk-cartao">
      <p class="pk-rotulo">60300102 · SKF VKBA 3525</p>
      <p class="pk-cartao__titulo">A guia pede 6. Quantos estão aqui?</p>
    </section>
    <div class="campo"><label class="campo__label" for="pk-qt">Na posição estão</label>
      <input class="input pk-campo" id="pk-qt" value="4" inputmode="numeric"></div>
    <p class="pk-nota">Ao corrigir, a posição fica com 4 e recolhe os 4. O sistema procura as outras 2 noutra posição.</p>`,
  { pe: BOTAO('Corrigir a posição', IC.corrigir) + BOTAO('Voltar', IC.voltar, 'btn--ghost') });

const sessao = () => pick(aviso('aviso', IC.relogio, 'A sua sessão terminou', `Esteve 15 minutos sem usar a Pick. A guia ${GUIA} continua sua, na linha 7.`)
    + `<div class="campo"><label class="campo__label" for="pk-pp">Palavra-passe</label>
      <input class="input pk-campo" id="pk-pp" type="password" placeholder="A sua palavra-passe"></div>`,
  { pe: BOTAO('Voltar a entrar', IC.entrar) });

const servidor = () => pick(aviso('erro', IC.servidor, 'O servidor não respondeu', 'A leitura não ficou registada. Leia outra vez dentro de um minuto.')
    + `<p class="pk-ref">Referência: <code>PK-1012-9A2C</code></p>
    <p class="pk-nota pk-nota--apoio">${I(IC.gestor)}Se repetir, avise o gestor do turno.</p>`,
  { pe: BOTAO('Tentar de novo', IC.denovo) });

const semTarefa = () => pick(aviso('azul', IC.cafe, 'Não há guias para si agora', 'Assim que houver uma guia de separação, o sistema entrega-a aqui. Não precisa de fazer nada.')
    + `<div class="pk-numeros"><div><strong>0</strong><span>guias por fazer</span></div><div><strong>14</strong><span>feitas hoje</span></div></div>
    <p class="pk-estado" role="status">${GIRADOR('girador--pequeno')}À espera da próxima guia…</p>`,
  { pe: BOTAO('Atualizar', IC.denovo, 'btn--ghost') });

export function ecrasCarregarPick(): Ecra<IdCarregarPick>[] {
  const FLUXO = 'Carregamento';
  const e = (id: IdCarregarPick, nome: string, objetivo: string, html: string): Ecra<IdCarregarPick> =>
    ({ id, nome, fluxo: FLUXO, objetivo, versoes: [{ id: 'v1', nota: 'Primeira versão', html }] });
  return [
    e('carga-pagina', '20 · A abrir a Pick', 'Depois de entrar: o ROMAFE, o nome Pick e uma barra sem fim enquanto liga ao servidor.', pagina()),
    e('carga-tarefa', '21 · A receber a guia', 'Ao entrar ou ao acabar uma guia: o sistema escolhe a próxima. O cartão da guia aparece em esqueleto.', tarefa()),
    e('carga-leitura', '22 · A confirmar a leitura', 'Depois de ler a posição: o campo com o girador e o artigo em esqueleto até a resposta chegar.', leitura()),
    e('carga-fechar', '23 · A fechar a guia', 'Todas as linhas recolhidas: a guia a fechar e a próxima a ser pedida, sem outro toque.', fechar()),
  ];
}

export function ecrasErroPick(): Ecra<IdErroPick>[] {
  const FLUXO = 'Erros';
  const e = (id: IdErroPick, nome: string, objetivo: string, html: string): Ecra<IdErroPick> =>
    ({ id, nome, fluxo: FLUXO, objetivo, versoes: [{ id: 'v1', nota: 'Primeira versão', html }] });
  return [
    e('erro-rede', '30 · Sem rede', 'A Pick não trabalha sem rede: para, diz até onde ficou guardado e tenta voltar sozinha.', rede()),
    e('erro-codigo', '31 · Código não reconhecido', 'O leitor leu um código que o sistema não conhece: mostra-o e diz que etiqueta ler.', codigo()),
    e('erro-posicao', '32 · Posição errada', 'Leu outra posição: mostra a lida e a pedida, e onde fica a certa.', posicao()),
    e('erro-quantidade', '33 · Falta quantidade', 'Não estão na posição as unidades que a guia pede: corrige-se a posição ali mesmo; ninguém conta.', quantidade()),
    e('erro-sessao', '34 · Sessão terminada', 'Depois de 15 minutos parada: volta a entrar com a palavra-passe e a guia continua na mesma linha.', sessao()),
    e('erro-servidor', '35 · Erro do servidor', 'O servidor não respondeu: a leitura não ficou registada; tentar de novo, e a referência para o gestor.', servidor()),
    e('erro-sem-tarefa', '36 · Sem guias', 'Não há guias para esta pessoa: o sistema entrega a próxima quando houver.', semTarefa()),
  ];
}

export const DESCRICAO_CARREGAR_PICK = 'O que se vê na Pick enquanto se espera: a abrir, a receber a guia, a confirmar a leitura e a fechar a guia.';
export const DESCRICAO_ERROS_PICK = 'O que se vê na Pick quando algo falha: sem rede, códigos e posições errados, falta de quantidade, sessão, servidor e sem guias.';
