import { ligacoes, type Ecra } from '../../comum/tipos';
import type { IdEntrar } from '../../comum/entrar/entrar';
import type { IdCarregarPick, IdErroPick } from './estados';
import type { IdInventario, IdEstadoInventario } from './inventario';
import type { IdInvCompleto } from './inventario-completo';
import type { IdNavegacao } from './navegacao';

/** Os ecrãs da app Mobile: os do início de sessão (comuns) e os seus. */
export type IdEstadoEntrarPk = 'entrar-pk-preenchido' | 'entrar-pk-a-entrar' | 'entrar-pk-sucesso' | 'entrar-pk-credenciais' | 'entrar-pk-sem-rede' | 'entrar-pk-servidor' | 'entrar-pk-tempo' | 'entrar-pk-auth' | 'entrar-pk-bloqueada' | 'entrar-pk-pda' | 'entrar-pk-sessao' | 'entrar-pk-restaurar';
export type IdEstadoAberturaPk = 'abertura-pk-sem-rede' | 'abertura-pk-leitor' | 'abertura-pk-sem-acesso';
export type IdGestor = 'gestor-inicio' | 'gestor-carregar' | 'gestor-sem-inventarios' | 'gestor-sem-tarefas' | 'gestor-erro' | 'gestor-sem-rede' | 'gestor-menus' | 'gestor-permissao' | 'gestor-sessao' | 'gestor-sem-acesso' | 'gestor-sem-armazem' | 'gestor-inventario' | 'gestor-inv-novo' | 'gestor-atribuir';
export type IdMobile = IdEntrar | 'abertura' | IdEstadoAberturaPk | IdGestor | IdEstadoEntrarPk | IdCarregarPick | IdErroPick | IdInventario | IdEstadoInventario | IdInvCompleto | IdNavegacao;

export type EcraMobile = Ecra<IdMobile>;

export const ir = ligacoes<IdMobile>();
