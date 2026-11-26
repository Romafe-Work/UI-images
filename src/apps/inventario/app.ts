import type { App } from '../../comum/tipos';
import type { IdInventario } from './ids';
import { ecrasInventario } from './ecras';

/* 26 nov. 2026: a app Kotlin Inventário, separada da Pick, como está na 2.0.0 — entra-se só com o nome, o inventário e
   cada secção começam e acabam com botão, cada prateleira conta-se uma vez, o tempo de prateleira fica registado e
   fechar faz o acerto automático no servidor (endpoints inventados, base de dados em Excel). Sem Excel exportado nem
   fotografias. Tela do EDA61K, como a Pick. */
export const inventario: App<IdInventario> = {
  id: 'inventario',
  nome: 'Inventário',
  sub: 'A contagem de prateleiras no PDA (app Kotlin)',
  grupo: 'Inventário',
  marca: 'INVENTÁRIO',
  tela: { l: 320, a: 533 },
  fluxos: {
    Entrar: 'Quem vai contar: sem função nem palavra-passe, só o nome.',
    'Inventário e secções': 'Iniciar e terminar o inventário; iniciar e terminar cada secção (ex.: Óleos). Só se conta nas secções a decorrer.',
    Contar: 'Prateleira → artigos → fechar: o servidor abre a prateleira (bloqueada), recusa a já contada, regista o tempo e faz os acertos ao fechar.',
    'Histórico e contagens': 'O histórico de uma prateleira ou artigo, as contagens deste PDA e a ligação ao servidor.',
  },
  ecras: ecrasInventario(),
};
