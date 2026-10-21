import { ligacoes, type Ecra } from '../../comum/tipos';

/** Os ecrãs da ROMAFE Identity (21 out. 2026): entrar, a palavra-passe, a escolha da aplicação, recuperar e o PDA. */
export type IdIdentidade = 'entrada' | 'entrada-de-app' | 'entrada-erro-email' | 'entrada-a-verificar' | 'entrada-servico' | 'entrada-offline'
  | 'entrada-sessao' | 'entrada-saida' | 'entrada-redirecionamento' | 'entrada-restaurada'
  | 'palavra-passe' | 'passe-a-entrar' | 'passe-credenciais' | 'passe-bloqueada' | 'passe-sucesso'
  | 'aplicacoes' | 'apps-a-abrir' | 'apps-uma' | 'apps-indisponivel' | 'apps-nenhuma' | 'apps-revogado'
  | 'recuperar' | 'recuperar-enviado' | 'pda';

export type EcraIdentidade = Ecra<IdIdentidade>;
export const ir = ligacoes<IdIdentidade>();
