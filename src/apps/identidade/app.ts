import type { App } from '../../comum/tipos';
import type { IdIdentidade } from './ids';
import { ecrasIdentidade } from './ecras';

/* 21 out. 2026: a porta comum da ROMAFE (briefing «ROMAFE Identity — One login, three applications»). Só ecrãs:
   o fornecedor de identidade, os clientes de cada aplicação e o registo ficam por ligar. */
export const identidade: App<IdIdentidade> = {
  id: 'identidade',
  nome: 'ROMAFE Identity',
  sub: 'Uma conta para todas as aplicações',
  grupo: 'Identidade',
  marca: 'ROMAFE',
  tela: { l: 1440, a: 900 },
  fluxos: { Entrar: 'Entrar uma vez na ROMAFE: o e-mail, a palavra-passe e a aplicação — ou o regresso à aplicação de onde se veio; recuperar a palavra-passe; a mesma conta no PDA.' },
  ecras: ecrasIdentidade(),
};
