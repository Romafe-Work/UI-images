import { ligacoes, type Ecra } from '../../comum/tipos';

/** Os ecrãs da app Inventário (Kotlin, 2.1.0 de 26 nov. 2026), como estão no PDA. */
export type IdInventario =
  | 'entrar' | 'entrar-primeira'
  | 'inicio' | 'inicio-sem-inventario' | 'inicio-iniciar' | 'inicio-a-iniciar' | 'inicio-nenhuma-seccao' | 'inicio-terminar-seccao' | 'inicio-terminar' | 'inicio-por-fechar' | 'inicio-sem-servidor'
  | 'prateleira' | 'prateleira-escrever' | 'prateleira-a-abrir' | 'prateleira-ja-contada' | 'prateleira-ocupada' | 'prateleira-nao-iniciada' | 'prateleira-fechada' | 'prateleira-fechada-acertos' | 'prateleira-artigo' | 'prateleira-outra-seccao' | 'prateleira-ficar' | 'prateleira-sem-rede' | 'prateleira-por-fechar'
  | 'contar' | 'contar-lido' | 'contar-escrever' | 'contar-corrigir' | 'contar-parece-prateleira' | 'contar-mesma' | 'contar-sair' | 'contar-descartar' | 'contar-ja-picado' | 'contar-sem-rede'
  | 'resumo' | 'resumo-vazia' | 'resumo-a-fechar'
  | 'camara' | 'camara-lido'
  | 'acertar-picar' | 'acertar-picar-feito' | 'acertar-picar-nao-contada' | 'acertar-picar-outra' | 'acertar-picar-sem-rede'
  | 'acertar' | 'acertar-lido' | 'acertar-mudar' | 'acertar-de-novo' | 'acertar-zerado' | 'acertar-confirmar' | 'acertar-a-acertar' | 'acertar-sem-rede'
  | 'historico' | 'historico-vazio' | 'historico-prateleira' | 'historico-artigo' | 'historico-escrever' | 'historico-sem-rede'
  | 'ligacao' | 'ligacao-testada' | 'ligacao-ocupada';

export type EcraInventario = Ecra<IdInventario>;
export const ir = ligacoes<IdInventario>();
