import type { App } from '../../comum/tipos';
import { ecrasCarregar } from '../../comum/carregar/carregar';
import { GOPARTS } from './portal/base';
import { DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
import type { IdGoParts, EcraGoParts } from './ids';
import { ecrasEntrar } from './entrar-3d';
import { ecraAbertura } from './abertura';
import { ecrasPortal } from './portal/ecras';
import { ecrasErro } from './erros/erros';
import { portal } from './portal/base';
import { inicioV3, manutencaoV3, type EstadoInicio } from './portal/inicio-v3';

/** Os ecrãs de carregamento e de erro, cada um como estado da página que mostra, numerados a seguir
 *  aos estados que ela já tem (10.8, 11.15, 12.24, 13.21, 14.27). */
const ONDE: Record<string, [IdGoParts, string]> = {
  'carga-pagina': ['inicio', '10.10 · A carregar o portal'], 'carga-inicio': ['inicio', '10.11 · Esqueleto do Início'], 'carga-pecas': ['inicio', '10.12 · Peças a carregar'],
  'erro-404': ['inicio', '10.13 · Página não encontrada'], 'erro-500': ['inicio', '10.14 · Erro do servidor'], 'erro-sessao': ['inicio', '10.15 · Sessão expirada'],
  'erro-formulario': ['inicio', '10.16 · Erros no formulário (página)'], 'erro-manutencao': ['inicio', '10.17 · Em manutenção'],
  'carga-pesquisa': ['catalogo', '11.21 · Pesquisa em curso'], 'erro-vazio': ['catalogo', '11.22 · Pesquisa sem resultados'], 'erro-encomenda': ['catalogo', '11.23 · Encomenda não concluída'],
  'carga-tabela': ['pedidos', '12.25 · Tabela a carregar'], 'carga-mais': ['pedidos', '12.26 · Carregar mais'], 'erro-rede': ['pedidos', '12.27 · Sem ligação (página)'],
  'erro-403': ['guias', '13.22 · Acesso negado (página)'],
  'carga-progresso': ['faturas', '14.28 · A gerar o PDF (página)'],
};
/* 14 out. 2026 (o briefing dos 17 estados do Início): no GoParts, estes estados passam a ser do Início v3, na
   mesma linguagem mecânica (o rolamento); a moldura comum fica para o GoShop */
const ini3 = (est: EstadoInicio) => () => {
  const html = portal('inicio', inicioV3(est), undefined, { menu: true, rodape: false });
  /* com o diálogo da sessão expirada (modal), o resto da página fica inerte */
  return est === 'sessao' ? html.replace('<header class="portal__topo"', '<header class="portal__topo" inert aria-hidden="true"').replace('<nav class="portal__abas"', '<nav class="portal__abas" inert aria-hidden="true"').replace('<main class="ini3', '<main inert aria-hidden="true" class="ini3') : html;
};
const NOVOS: Record<string, [() => string, string]> = {
  'carga-inicio': [ini3('esqueleto'), 'A forma exata do Início em esqueleto, com um pulsar lento: cada zona troca quando os dados chegam, sem saltos.'],
  'carga-pecas': [ini3('pecas'), 'Os resultados a chegar: os filtros e o cabeçalho da tabela ficam; as linhas em esqueleto; o rolamento ao pé da contagem.'],
  'erro-404': [ini3('404'), 'O rolamento a que falta uma esfera roda uma vez e mostra o lugar vazio: «Esta página saiu da rota.»'],
  'erro-500': [ini3('500'), 'O rolamento encrava a meio do movimento: o pedido não se concluiu; «Tentar novamente» ou voltar ao início.'],
  'erro-sessao': [ini3('sessao'), 'Um diálogo calmo por cima do Início: o cadeado fecha-se e «Iniciar sessão»; depois volta à mesma página.'],
  'erro-formulario': [ini3('erros'), 'Dois campos errados: o resumo diz quantos são e cada erro leva ao seu campo; o que se escreveu fica.'],
  'erro-manutencao': [manutencaoV3, 'Sem o portal: o rolamento em vista explodida, devagar — «Estamos a afinar o motor.» — e quando volta.'],
};
function distribuir(): EcraGoParts[] {
  const lista: EcraGoParts[] = [...ecrasPortal];
  for (const e of [...ecrasCarregar(GOPARTS), ...ecrasErro()] as EcraGoParts[]) {
    const [pai, nome] = ONDE[e.id] ?? ['inicio', e.nome];
    let i = lista.length - 1;
    while (i >= 0 && lista[i].id !== pai && lista[i].estadoDe !== pai) i--;
    while (i + 1 < lista.length && lista[i + 1].estadoDe === pai) i++;
    const novo = NOVOS[e.id];
    const versoes = novo ? [{ id: 'v1', nota: 'Do briefing dos estados do Início (14 out.), na linguagem mecânica do rolamento', html: novo[0]() }] as EcraGoParts['versoes'] : e.versoes;
    lista.splice(i + 1, 0, { ...e, nome, fluxo: 'Portal', estadoDe: pai, versoes, objetivo: novo ? novo[1] : e.objetivo });
  }
  /* (15 out., ela: «no fluxo quero que mostres exemplos de diálogos abertos») estes estados entram no mapa, logo a
     seguir ao seu ecrã: os painéis laterais dos Pedidos, das Guias e das Faturas, as pré-visualizações e o diálogo
     de eliminar a lista */
  const DIALOGOS: Record<string, string> = {
    'pedidos-aberto': 'Diálogo aberto · o pedido', 'pedidos-guia': 'Diálogo aberto · a guia do pedido',
    'guias-aberta': 'Diálogo aberto · a guia', 'guias-pdf': 'Diálogo aberto · o documento',
    'faturas-aberta': 'Diálogo aberto · o talão', 'faturas-pdf': 'Diálogo aberto · o documento',
    'lista-eliminar': 'Diálogo aberto · eliminar',
  };
  return lista.map((e) => (DIALOGOS[e.id] ? { ...e, noFluxo: DIALOGOS[e.id] } : e));
}

export const goparts: App<IdGoParts> = {
  id: 'goparts',
  nome: 'GoParts',
  sub: 'O marketplace de peças auto',
  grupo: 'MarketPlace',
  marca: 'GOPARTS',
  tela: { l: 1440, a: 900 },
  fluxos: {
    'Entrar': DESCRICAO_ENTRAR,
    'Portal': 'Depois de entrar: o Início com as três pesquisas, o catálogo, os pedidos e as guias de remessa.',
  },
  /* 14 out. 2026: os quatro ecrãs de entrar à volta do rolamento 3D (entrar-3d.ts), do briefing dela; saíram a v1 e a v2 */
  /* 12 out. 2026: os quatro ecrãs de entrar são os do estilo do Início v2.2, com a
     fotografia da oficina (entrar-v22.ts); a «Família Romafe» saiu (ela não gostou) */
  /* 13 out. 2026: a abertura animada antes do login (abertura.ts) */
  /* 13 out. 2026: a abertura passa à página pública (publico.ts), e o «Entrar» dela leva ao login */
  /* 14 out. 2026: ela, «apaga a página pública» — saíram a página pública e as quatro do menu (A Romafe,
     Entregas, Marcas, Contactos); a abertura volta a levar ao login */
  /* 13 out. 2026: ela, «tudo o que seja carregamentos e erros deve estar distribuído pelas páginas» —
     os grupos Carregamento e Erros saíram; cada ecrã passa a estado da página que mostra (distribuir()) */
  ecras: [ecraAbertura(), ...ecrasEntrar(), ...distribuir()],
};
