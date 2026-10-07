import type { App } from '../../comum/tipos';
import type { IdErp } from './ids';
import { entrar } from './ecras/01-entrar';
import { palavraPasse } from './ecras/02-palavra-passe';
import { federado } from './ecras/03-federado';

export const erp: App<IdErp> = {
  id: 'erp',
  nome: 'ERP',
  sub: 'Rolgest, a plataforma de gestão',
  marca: 'ROLGEST',
  tela: { l: 1440, a: 900 },
  fluxos: {
    'Entrar': 'Primeiro o endereço, e o domínio decide o caminho: palavra-passe nossa (02) ou a página da empresa (03).',
  },
  ecras: [entrar, palavraPasse, federado],
};
