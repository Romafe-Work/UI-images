/* =========================================================
   GOPARTS — 17 · Informações técnicas: os estados (15 out. 2026)
   Os do briefing (§18), cada um a partir do próprio ecrã (tecnicaV1 com as opções do estado) e com os ids dele
   (o prefixo e17…). Os erros dizem o que aconteceu, o que fazer e dão uma saída; ficam no sítio do que falhou.
   ========================================================= */
import type { EcraGoParts, IdGoParts } from '../ids';
import { portal } from './base';
import { tecnicaV1, faixa, type Opcoes } from './tecnica';
import { L } from './devolucoes';
import { EXEMPLO, docsDe, veiculoDe } from './tecnica-dados';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import refreshCw from 'lucide-static/icons/refresh-cw.svg?raw';

export type IdEstadoTecnica = 'tecnica-carga' | 'tecnica-pesquisa' | 'tecnica-sem-veiculos' | 'tecnica-invalido' | 'tecnica-falha' | 'tecnica-escolhido'
  | 'tecnica-sistema' | 'tecnica-categorias' | 'tecnica-veiculo' | 'tecnica-lista' | 'tecnica-documento' | 'tecnica-doc-carga' | 'tecnica-doc-nao'
  | 'tecnica-esquema' | 'tecnica-img-carga' | 'tecnica-img-nao' | 'tecnica-sem-dados' | 'tecnica-boletins' | 'tecnica-wd-carga' | 'tecnica-wd-nao'
  | 'tecnica-procura' | 'tecnica-avaria' | 'tecnica-rede' | 'tecnica-sessao' | 'tecnica-sem-permissao';

const BOTAO = (texto: string, icone: string, tipo = 'btn--acao btn--sm') => `<button type="button" class="btn ${tipo}">${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;
const doc = (titulo: string) => docsDe(veiculoDe(EXEMPLO)!).find((d) => d.titulo === titulo)!.id;
const PASTILHAS = doc('Substituir as pastilhas e os discos dianteiros');
const ESQUEMA = doc('Esquema · gestão do motor');

const ecra = (o: Opcoes) => {
  let html = tecnicaV1(o).replace('portal--tec', 'portal--tec portal--estado');
  /* com o visor aberto, o resto fica inerte */
  if (o.fig) html = html.replace(/<(header|section|div) class="(tec__cabeca|tec__ctx|tec__trabalho)/g, '<$1 inert aria-hidden="true" class="$2');
  const h = portal('tecnica', html, undefined, { menu: true, rodape: false });
  return o.fig ? h.replace('<header class="portal__topo"', '<header class="portal__topo" inert aria-hidden="true"').replace('<nav class="portal__abas"', '<nav class="portal__abas" inert aria-hidden="true"') : h;
};
const e = (id: IdEstadoTecnica, n: number, nome: string, objetivo: string, o: Opcoes, depois?: (html: string) => string): EcraGoParts => ({
  id: id as IdGoParts, nome: `17.${n} · ${nome}`, fluxo: 'Portal', objetivo, estadoDe: 'tecnica',
  versoes: [{ id: 'v1', nota: 'Do briefing das Informações técnicas (15 out.)', html: depois ? depois(ecra({ px: `e17${n}`, ...o })) : ecra({ px: `e17${n}`, ...o }) }],
});
const V = { veiculo: EXEMPLO };

export const estadosTecnica = (): EcraGoParts[] => [
  e('tecnica-carga', 1, 'A carregar os veículos', 'A forma da tabela (modelo e motorizações) enquanto o catálogo responde; a pesquisa e as marcas já servem.', { carga: 'veiculos' }),
  e('tecnica-pesquisa', 2, 'A pesquisar', 'Com «n47» escrito: «A pesquisar…» e a lista de antes esbatida, sem bloquear a escrita.', { q: 'n47', carga: 'pesquisa' }),
  e('tecnica-sem-veiculos', 3, 'Nenhum veículo corresponde à pesquisa', '«Série 9»: o que procurou, o que experimentar (só o código do motor, ou a marca) e «Limpar a pesquisa».', { q: 'Série 9' }),
  e('tecnica-invalido', 4, 'Seleção de veículo inválida', 'Uma ligação com um veículo que o catálogo já não tem: a faixa diz isso por cima da lista, com a marca aberta.', {
    aviso: faixa('erro', 'O veículo que pediu já não existe no catálogo.', 'A ligação trazia um veículo que deixou de estar disponível (ref. VT-404). Escolha-o outra vez na lista; a marca BMW já está aberta.'),
  }),
  e('tecnica-falha', 5, 'Erro do servidor', 'O catálogo não respondeu: a pesquisa fica, a referência do erro, o apoio e «Tentar novamente».', { erro: 'veiculos' }),
  e('tecnica-escolhido', 6, 'Veículo escolhido · visão geral', 'BMW → 1 (E81) → 118d → N47 D20 C na barra de cima; as secções agrupadas à esquerda; o explorador do veículo e o que há em cada grupo.', V),
  e('tecnica-sistema', 7, 'Sistema escolhido no explorador', 'Travões: as rodas acendem no desenho e os documentos dos travões (manuais, ajuste, tempos, lubrificantes, esquemas) aparecem por baixo.', { ...V, sistema: 'travoes' }),
  e('tecnica-categorias', 8, 'Categorias a carregar', 'O veículo já está na barra; as secções e o explorador em esqueleto enquanto o WorkshopData responde.', { ...V, carga: 'categorias' }),
  e('tecnica-veiculo', 9, 'Veículo', 'Os dados do Catálogo para o veículo (sem nada a mais) e as outras motorizações do 1 (E81), para trocar sem voltar à lista.', { ...V, seccao: 'veiculo' }),
  e('tecnica-lista', 10, 'Manuais de reparação', 'A secção aberta com a risca laranja; os documentos com o sistema, o tipo e as figuras; o filtro por sistema.', { ...V, seccao: 'manuais' }),
  e('tecnica-documento', 11, 'Documento aberto', 'O leitor: os manuais à esquerda, o documento ao centro (o conteúdo é do WorkshopData) com as figuras, e os relacionados dos travões à direita.', { ...V, doc: PASTILHAS }),
  e('tecnica-doc-carga', 12, 'Documento a carregar', 'O título e os dados já lá estão; o conteúdo e as figuras em esqueleto.', { ...V, doc: PASTILHAS, carga: 'doc' }),
  e('tecnica-doc-nao', 13, 'Documento não encontrado', 'O fornecedor retirou o documento: diz isso no sítio dele; os outros da secção continuam à esquerda.', { ...V, doc: PASTILHAS, erro: 'doc' }),
  e('tecnica-esquema', 14, 'Figura aberta no visor', 'A miniatura cresceu até ao visor: figura 1 de 3, zoom, ajustar, ecrã inteiro e arrastar para mover. A imagem é a do fornecedor (aqui, só a folha).', { ...V, doc: ESQUEMA, fig: 1 }),
  e('tecnica-img-carga', 15, 'Imagem a carregar', 'O visor aberto e a figura a chegar na resolução original.', { ...V, doc: ESQUEMA, fig: 1, carga: 'img' }),
  e('tecnica-img-nao', 16, 'Imagem indisponível', 'O fornecedor não mandou a figura: a referência, «Tentar novamente», e o texto do documento continua no leitor.', { ...V, doc: ESQUEMA, fig: 1, erro: 'img' }),
  e('tecnica-sem-dados', 17, 'Sem dados técnicos para o veículo', 'Um BMW 1 (F70) de 2024: «Não existem dados técnicos disponíveis para este veículo.», com os dados do veículo e as peças à mão.', { veiculo: 'BMW|1 (F70)|116i' }),
  e('tecnica-boletins', 18, 'Secção sem documentos', 'Os Boletins: o fornecedor não tem nenhum para este motor; a secção diz isso em vez de ficar em branco.', { ...V, seccao: 'boletins' }),
  e('tecnica-wd-carga', 19, 'A ligar ao WorkshopData', 'O fornecedor externo a abrir com a sessão da conta: o botão espera.', { ...V, seccao: 'workshopdata', carga: 'wd' }),
  e('tecnica-wd-nao', 20, 'WorkshopData indisponível', 'O fornecedor não responde: a faixa no sítio, a referência e «Tentar novamente»; o resto do ecrã continua.', { ...V, seccao: 'workshopdata', erro: 'wd' }),
  e('tecnica-procura', 21, 'Pesquisa técnica', '«travões» na barra: as secções, o sistema e os documentos deste veículo que batem, com as setas e Enter.', { ...V, procura: 'travões' }),
  e('tecnica-avaria', 22, 'Código de avaria inválido', 'Nos Diagnósticos, «P04» não é um código: a mensagem diz como se escreve; o significado de cada código é do fornecedor.', { ...V, seccao: 'diagnosticos' },
    (h) => h.replace(/(<input class="tec__avaria-campo"[^>]*?)( autocomplete)/, '$1 value="P04" aria-invalid="true"$2').replace('<p class="tec__avaria-n" ', '<p class="tec__avaria-n is-erro" ').replace(/(<p class="tec__avaria-n is-erro"[^>]*>)[^<]*/, '$1«P04» não é um código de avaria. Escreva uma letra (P, B, C ou U) e quatro algarismos, por exemplo P0401.')),
  e('tecnica-rede', 23, 'Sem ligação', 'A faixa por cima; o documento de há pouco esbatido; a pesquisa espera pela ligação.', {
    ...V, seccao: 'manuais', esbatido: true,
    aviso: faixa('aviso', 'Sem ligação à internet.', 'O que já está aberto continua; a pesquisa e os documentos novos esperam pela ligação. Tentamos de novo sozinhos.', BOTAO('Tentar agora', refreshCw, 'btn--ghost btn--sm')),
  }),
  e('tecnica-sessao', 24, 'Sessão terminada', 'A página fica; abrir documentos e o WorkshopData pede para entrar outra vez.', {
    ...V, seccao: 'manuais',
    aviso: faixa('aviso', 'A sessão terminou.', 'Por segurança, a sessão fecha depois de algum tempo sem atividade. A página fica como está; para abrir documentos, entre outra vez.', BOTAO('Entrar outra vez', logIn)),
  }),
  e('tecnica-sem-permissao', 25, 'Sem permissão', 'Esta conta não tem os esquemas elétricos no contrato: a secção diz quem pode ativar; as outras continuam abertas.', { ...V, seccao: 'eletricos', erro: 'permissao' }),
];
