import { ligacoes, type Ecra } from '../../comum/tipos';

/** Os ecrãs da app Inventário (Kotlin, 2.3.0 de 27 nov. 2026), como estão no PDA. */
export type IdInventario =
  | 'entrar' | 'entrar-primeira'
  | 'inicio' | 'inicio-gestor' | 'inicio-gestor-aviso' | 'inicio-sem-inventario' | 'inicio-iniciar' | 'inicio-a-iniciar' | 'inicio-nenhuma-seccao' | 'inicio-terminar-seccao' | 'inicio-terminar' | 'inicio-por-fechar' | 'inicio-sem-servidor'
  | 'prateleira' | 'prateleira-gestor' | 'prateleira-escrever' | 'prateleira-a-abrir' | 'prateleira-ja-contada' | 'prateleira-ocupada' | 'prateleira-nao-iniciada' | 'prateleira-fechada' | 'prateleira-fechada-acertos' | 'prateleira-artigo' | 'prateleira-outra-seccao' | 'prateleira-ficar' | 'prateleira-sem-rede' | 'prateleira-por-fechar'
  | 'contar' | 'contar-lido' | 'contar-escrever' | 'contar-corrigir' | 'contar-parece-prateleira' | 'contar-mesma' | 'contar-sair' | 'contar-descartar' | 'contar-sem-rede'
  | 'resumo' | 'resumo-vazia' | 'resumo-a-fechar'
  | 'camara' | 'camara-lido'
  | 'acertar-picar' | 'acertar-picar-feito' | 'acertar-picar-nao-contada' | 'acertar-picar-outra' | 'acertar-picar-sem-rede'
  | 'acertar' | 'acertar-lido' | 'acertar-mudar' | 'acertar-de-novo' | 'acertar-zerado' | 'acertar-confirmar' | 'acertar-a-acertar' | 'acertar-sem-rede'
  | 'historico' | 'historico-vazio' | 'historico-prateleira' | 'historico-artigo' | 'historico-escrever' | 'historico-sem-rede'
  | 'prateleiras'
  | 'ligacao' | 'ligacao-testada' | 'ligacao-ocupada';

export type EcraInventario = Ecra<IdInventario>;
export const ir = ligacoes<IdInventario>();
