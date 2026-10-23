/* =========================================================
   ERP — a navegação do Início v6 (23 out. 2026), como viria da API central da ROMAFE (GET /api/v1/navegacao?app=erp).
   As linhas são configuração, não código do ecrã: id estável, aplicação, pai, rótulo, ícone, rota, ordem,
   permissões, se está ativa e, para os atalhos do Início, a ordem na casa. O ecrã só desenha:
     - as linhas ativas e permitidas ao perfil;
     - e, das folhas, só as que têm rota registada (ROTAS) ou ação conhecida (ACOES_NAV). Nada vindo da base executa
       código, e o que não está registado não aparece — o menu lateral não se enche de módulos que ainda não existem.
   Ver o menu não dá acesso: abrir uma rota volta a verificar a permissão (comportamento/espaco.ts → abrirRota), como
   no servidor.
   Os grupos seguem o negócio e não o menu antigo: Ficheiros tem os dados mestres; Compras os ecrãs de Compras (as
   linhas de MENU_ERP, as mesmas da v5). Não há cache: a resposta desenha-se e pronto (ela/José: «nunca guardamos nada
   em memória»), e sem rede o menu não se inventa.
   ========================================================= */
import type { IdPerfil } from './inicio-dados';
import { MENU_ERP, ROTAS } from './espaco';

export interface LinhaNav { id: string; app: 'erp'; pai: string | null; rotulo: string; icone: string; rota: string | null; acao?: string; ordem: number; permissoes: IdPerfil[] | '*'; ativo: boolean; casa?: number; curto?: string }
const G = (id: string, rotulo: string, icone: string, ordem: number): LinhaNav => ({ id, app: 'erp', pai: null, rotulo, icone, rota: null, ordem, permissoes: '*', ativo: true });
const F = (id: string, pai: string, rotulo: string, icone: string, rota: string, ordem: number, casa?: number): LinhaNav => ({ id, app: 'erp', pai, rotulo, icone, rota, ordem, permissoes: '*', ativo: true, casa });

/** As ações da aplicação que uma linha pode pedir (como as rotas: o que não está aqui não se executa). */
export const ACOES_NAV: Record<string, string> = { casa: 'Abrir a área de trabalho', atalhos: 'Mostrar os atalhos de teclado' };

export const NAV_ERP: LinhaNav[] = [
  G('principal', 'Principal', 'house', 10),
  { ...F('inicio', 'principal', 'Início', 'house', '', 10), rota: null, acao: 'casa' },
  G('ficheiros', 'Ficheiros', 'file', 20),
  F('ficheiros-artigos', 'ficheiros', 'Artigos', 'package', 'ficheiros.artigos', 10, 1),
  F('ficheiros-armazens', 'ficheiros', 'Armazéns', 'warehouse', 'ficheiros.armazens', 20, 2),
  F('ficheiros-familias', 'ficheiros', 'Famílias', 'folder-tree', 'ficheiros.familias', 30, 3),
  F('ficheiros-marcas', 'ficheiros', 'Marcas', 'tag', 'ficheiros.marcas', 40, 4),
  F('ficheiros-unidades', 'ficheiros', 'Unidades de medida', 'ruler', 'ficheiros.unidades', 50, 5),
  { ...G('compras', 'Compras', 'shopping-cart', 30), permissoes: MENU_ERP.find((l) => l.id === 'compras')!.permissoes },
  /* os ecrãs de Compras: as linhas de MENU_ERP (a mesma configuração da v5); Encomendas é o 6.º atalho */
  ...MENU_ERP.filter((l) => l.pai === 'compras' && !l.so).map((l): LinhaNav => ({ id: l.id, app: 'erp', pai: 'compras', rotulo: l.rotulo, icone: l.icone, rota: l.rota, ordem: l.ordem, permissoes: l.permissoes, ativo: l.ativo, casa: l.rota === 'compras.encomendas' ? 6 : undefined, curto: l.rota === 'compras.encomendas' ? 'Encomendas' : undefined })),
  G('ajuda', 'Ajuda', 'life-buoy', 90),
  { ...F('ajuda-atalhos', 'ajuda', 'Atalhos de teclado', 'keyboard', '', 10), rota: null, acao: 'atalhos' },
];

export interface NoNav extends LinhaNav { filhos: NoNav[] }
const pode = (l: LinhaNav, p: IdPerfil) => l.permissoes === '*' || l.permissoes.includes(p);
const valida = (l: LinhaNav) => (l.rota ? !!ROTAS[l.rota] : !!(l.acao && ACOES_NAV[l.acao]));
/** O que a API devolve a este perfil, em árvore; grupos que ficam sem nada não aparecem. */
export function navegacao(p: IdPerfil, linhas: LinhaNav[] = NAV_ERP): NoNav[] {
  const ramo = (pai: string | null): NoNav[] => linhas.filter((l) => l.pai === pai && l.ativo && pode(l, p)).sort((a, b) => a.ordem - b.ordem)
    .map((l) => ({ ...l, filhos: ramo(l.id) }))
    .filter((n) => n.filhos.length ? true : pai !== null && valida(n));
  return ramo(null);
}
/** Os atalhos do Início (os seis que a gestão aprovou), pela ordem da casa; só os permitidos e registados. */
export const atalhosCasa = (p: IdPerfil): LinhaNav[] => {
  const ok = new Set<string>(); const andar = (ns: NoNav[]) => ns.forEach((n) => { ok.add(n.id); andar(n.filhos); }); andar(navegacao(p));
  return NAV_ERP.filter((l) => l.casa && ok.has(l.id) && l.rota && ROTAS[l.rota]).sort((a, b) => a.casa! - b.casa!);
};
