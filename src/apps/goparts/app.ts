import type { App } from '../../comum/tipos';
import { ecrasCarregar } from '../../comum/carregar/carregar';
import { GOPARTS } from './portal/base';
import { DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
import type { IdGoParts, EcraGoParts } from './ids';
import { ecrasEntrar } from './entrar-3d';
import { ecraAbertura } from './abertura';
import { ecrasPortal } from './portal/ecras';
import { ecrasErro } from './erros/erros';

/** Os ecrãs de carregamento e de erro, cada um como estado da página que mostra, numerados a seguir
 *  aos estados que ela já tem (10.8, 11.15, 12.8, 13.9, 14.9). */
const ONDE: Record<string, [IdGoParts, string]> = {
  'carga-pagina': ['inicio', '10.10 · A carregar o portal'], 'carga-inicio': ['inicio', '10.11 · Esqueleto do Início'], 'carga-pecas': ['inicio', '10.12 · Peças a carregar'],
  'erro-404': ['inicio', '10.13 · Página não encontrada'], 'erro-500': ['inicio', '10.14 · Erro do servidor'], 'erro-sessao': ['inicio', '10.15 · Sessão expirada'],
  'erro-formulario': ['inicio', '10.16 · Erros no formulário (página)'], 'erro-manutencao': ['inicio', '10.17 · Em manutenção'],
  'carga-pesquisa': ['catalogo', '11.16 · Pesquisa em curso'], 'erro-vazio': ['catalogo', '11.17 · Pesquisa sem resultados'], 'erro-encomenda': ['catalogo', '11.18 · Encomenda não concluída'],
  'carga-tabela': ['pedidos', '12.9 · Tabela a carregar'], 'carga-mais': ['pedidos', '12.10 · Carregar mais'], 'erro-rede': ['pedidos', '12.11 · Sem ligação'],
  'erro-403': ['guias', '13.10 · Sem permissão'],
  'carga-progresso': ['faturas', '14.10 · A gerar o PDF'],
};
function distribuir(): EcraGoParts[] {
  const lista: EcraGoParts[] = [...ecrasPortal];
  for (const e of [...ecrasCarregar(GOPARTS), ...ecrasErro()] as EcraGoParts[]) {
    const [pai, nome] = ONDE[e.id] ?? ['inicio', e.nome];
    let i = lista.length - 1;
    while (i >= 0 && lista[i].id !== pai && lista[i].estadoDe !== pai) i--;
    while (i + 1 < lista.length && lista[i + 1].estadoDe === pai) i++;
    lista.splice(i + 1, 0, { ...e, nome, fluxo: 'Portal', estadoDe: pai });
  }
  return lista;
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
