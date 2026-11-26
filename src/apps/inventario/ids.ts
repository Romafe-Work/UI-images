import { ligacoes, type Ecra } from '../../comum/tipos';

/** Os ecrãs da app Inventário (Kotlin, 1.8.1 de 25 nov. 2026), como estão no PDA. */
export type IdInventario =
  | 'entrar' | 'entrar-primeira'
  | 'inicio' | 'inicio-vazio' | 'inicio-por-enviar' | 'inicio-recontar' | 'inicio-a-bloquear'
  | 'prateleira' | 'prateleira-escrever' | 'prateleira-ocupada' | 'prateleira-ja-contada' | 'prateleira-concluida' | 'prateleira-sorteada' | 'prateleira-recontar-outra'
  | 'contar' | 'contar-lido' | 'contar-escrever' | 'contar-corrigir' | 'contar-parece-prateleira' | 'contar-mesma' | 'contar-sair' | 'contar-descartar'
  | 'resumo' | 'resumo-com-fotos' | 'resumo-vazia'
  | 'camara' | 'camara-lido'
  | 'contagens' | 'contagens-limpar' | 'ver'
  | 'exportado' | 'exportado-erro'
  | 'ligacao' | 'ligacao-ligada' | 'ligacao-a-meio';

export type EcraInventario = Ecra<IdInventario>;
export const ir = ligacoes<IdInventario>();
