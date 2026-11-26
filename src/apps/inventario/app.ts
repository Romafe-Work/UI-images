import type { App } from '../../comum/tipos';
import type { IdInventario } from './ids';
import { ecrasInventario } from './ecras';

/* 26 nov. 2026 (ela: «coloca no figma a app do inventario»): a app Kotlin Inventário, separada da Pick, como está na
   1.8.1 — entra-se só com o nome, cada leitura soma 1, sem pausa, fotografia de frente para concluir, ERP de
   demonstração ou Rolgest, e o Excel. Tela do EDA61K, como a Pick. */
export const inventario: App<IdInventario> = {
  id: 'inventario',
  nome: 'Inventário',
  sub: 'A contagem de prateleiras no PDA (app Kotlin)',
  grupo: 'Inventário',
  marca: 'INVENTÁRIO',
  tela: { l: 320, a: 533 },
  fluxos: {
    Entrar: 'Quem vai contar: sem função nem palavra-passe, só o nome.',
    Contar: 'Prateleira → artigos → concluir: a prateleira fica bloqueada no ERP do início ao fim; cada leitura soma 1; quem começa acaba; recontagem às cegas.',
    'Enviar e exportar': 'As contagens deste PDA, o Excel em Download/Inventario e a ligação ao ERP (demonstração ou Rolgest).',
  },
  ecras: ecrasInventario(),
};
