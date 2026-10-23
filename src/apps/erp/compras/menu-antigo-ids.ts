/* =========================================================
   ERP — os itens do menu Compras do ERP antigo que, desde 23 out. 2026, abrem um ecrã no protótipo (ela: «no figma
   coloca tudo available»). Só os ids das linhas de MENU_ERP; espaco.ts dá-lhes a rota e compras/menu-antigo.ts o ecrã
   (cm-<id>). Fica num ficheiro sem dependências para espaco.ts o poder ler sem ciclos.
   ========================================================= */
export const MENU_ANTIGO = [
  'compras-agendamento', 'compras-especiais', 'compras-guias-entrada', 'compras-guias-transporte', 'compras-devolucoes',
  'compras-faturas', 'compras-notas-credito', 'compras-pendentes', 'compras-verificacao',
  'mapas-tot-enc', 'mapas-det-enc', 'mapas-tot-ge', 'mapas-det-ge', 'mapas-recap',
  'analise-artigo', 'analise-artigo-forn', 'analise-familia', 'analise-familia-forn',
  'comp-geral', 'comp-geral-var', 'comp-artigo', 'comp-artigo-var', 'comp-familia', 'comp-familia-var', 'comp-forn', 'comp-forn-var',
  'mapas-analise-forn', 'mapas-automatico',
] as const;
export type IdMenuAntigo = `cm-${typeof MENU_ANTIGO[number]}` | `cm-automatico-${'resultados' | 'agrupado' | 'a-gerar' | 'vazio' | 'erro' | 'filtros' | 'detalhe' | 'exportado'
  | 'mais-criterios' | 'invalido' | 'a-atualizar' | 'vistas' | 'export-falhou' | 'offline' | 'tempo' | 'permissao' | 'sessao'}`
  | `cm-${'compgeral' | 'compartigo' | 'compfamilia'}-${'resultados' | 'mensal' | 'agrupado' | 'detalhe' | 'parcial'}`
  | `cm-compforn-${'mensal' | 'resultados' | 'editar' | 'invalido' | 'a-gerar' | 'parcial' | 'vazio' | 'a-atualizar' | 'agrupado' | 'filtros' | 'detalhe' | 'exportado' | 'export-falhou' | 'erro' | 'tempo' | 'offline' | 'permissao' | 'sessao'}`;
