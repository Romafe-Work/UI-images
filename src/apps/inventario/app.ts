import type { App } from '../../comum/tipos';
import type { IdInventario } from './ids';
import { ecrasInventario } from './ecras';

/* A app Kotlin Inventário, separada da Pick, como está na 2.1.5 (27 nov. 2026). Entra-se só com o nome; o inventário e
   cada secção começam e acabam com botão. A prateleira passa por quatro estados, que vêm sempre da API: livre →
   trancada a contar → trancada para o acerto → liberta (para a separação e a expedição). Só o gestor acerta.
   Tela do EDA61K, como a Pick. */
export const inventario: App<IdInventario> = {
  id: 'inventario',
  nome: 'Inventário',
  sub: 'A contagem de prateleiras no PDA (app Kotlin)',
  grupo: 'Inventário',
  marca: 'INVENTÁRIO',
  tela: { l: 320, a: 533 },
  fluxos: {
    Entrar: 'Quem vai contar: sem função nem palavra-passe, só o nome.',
    'Inventário e secções': 'Iniciar e terminar o inventário; em cada secção, «Continuar», «Acertar» (só o gestor) e «Terminar». Só se conta nas secções a decorrer.',
    Contar: 'Prateleira (começa por 60) → artigos → «Trancar prateleira». Enquanto se conta está trancada; depois fica trancada para o acerto, mesmo sem diferenças.',
    Acertar: 'Só o gestor: pica a prateleira trancada, acerta o contado à mão ou picando de novo, e «Acertar» liberta-a.',
    'Histórico': 'O histórico de uma prateleira ou artigo, por blocos, só do inventário a decorrer; e a ligação ao servidor.',
  },

  ecras: ecrasInventario(),
};
