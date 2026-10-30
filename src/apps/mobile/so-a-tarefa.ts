/* =========================================================
   PICK — quem não é gestor só vê a tarefa que lhe deram (30 out. 2026)
   Ela: «ninguém, tirando o gestor, pode escolher o que fazer, por isso não faz sentido haver fila e executar» e «não
   mexas na app do gestor; mexe na arrumação, separação e expedição: ninguém que tenha esse cargo consegue ver a fila de
   tarefas, apenas o gestor». O Inventário é de todos, e era lá que a fila aparecia:
     - sai o 57 · Início do Operador (a Joana, com «As minhas contagens» Atribuídas · Em curso · Concluídas) — o início
       de cada função é o 85, o 110 e o 130; os estados dele ficam presos ao 40;
     - sai o 41 · Contagens atribuídas (a lista para escolher) e o seu vazio;
     - o 40 · Inventário perde «A seguir» e «Ver as contagens atribuídas»: fica a contagem que o motor deu.
   O que ligava a esses ecrãs passa a ir para o início da função ou para o 40. Nada do Gestor muda.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { trocarIr } from './inventario-v2';

const SAEM = new Set(['op-inicio', 'op-nova', 'op-sem', 'inv-lista', 'inv-lista-vazia']);
const PARA: Record<string, string> = { 'op-inicio': 'ta-inicio', 'op-nova': 'ta-inicio', 'op-sem': 'ta-inicio', 'inv-lista': 'inv-inicio', 'inv-lista-vazia': 'inv-inicio' };
const NOTA = 'Só a tarefa que o motor deu (30 out., ela: «ninguém que tenha esse cargo consegue ver a fila de tarefas, apenas o gestor»): sem «A seguir» nem a lista das contagens atribuídas.';
const A_SEGUIR = /\s*<section class="gp-sec"><h2 class="gp-h">A seguir<\/h2>[\s\S]*?<\/section>/;

export function comSoATarefa<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  return ecras.filter((e) => !SAEM.has(e.id)).map((e) => {
    const versoes = e.versoes.map((v) => ({ ...v, html: trocarIr(v.html, PARA) })) as Ecra<T>['versoes'];
    const x: Ecra<T> = { ...e, versoes, ...(e.estadoDe && SAEM.has(e.estadoDe) ? { estadoDe: 'inv-inicio' as T } : {}) };
    if (e.id !== 'inv-inicio') return x;
    const ultima = versoes[versoes.length - 1];
    return { ...x, objetivo: 'A contagem que o motor deu, para continuar (com as posições contadas, nunca as unidades do sistema), e as duas operações: corrigir posição e consultar stock. Sem as contagens seguintes.', versoes: [...versoes, { id: `v${versoes.length + 1}`, nota: NOTA, html: ultima.html.replace(A_SEGUIR, '') }] as Ecra<T>['versoes'] };
  });
}
