import type { App } from '../../comum/tipos';
import type { IdErp } from './ids';
import { ecrasCompras, DESCRICAO_COMPRAS } from './compras';
import type { Ecra } from '../../comum/tipos';
import { ecraAbertura } from './abertura';
import { versaoAberturaV4, estadosAberturaV4 } from './abertura-v4';
import { ecrasInicio, DESCRICAO_INICIO } from './inicio';
import { ecrasCompras2, VERSAO_COMPRAS_V2 } from './compras/ecras';
import { ecrasFase2 } from './compras/ecras2';
import { ecrasCarregarErp, ecrasErroErp, DESCRICAO_CARREGAR_ERP, DESCRICAO_ERROS_ERP } from './estados';

/* 19 out. 2026: a 00 · Abertura ganha a v2 (briefing «V2 Cinematic Opening»); a v1 fica como estava */
/* 22 out. 2026: e a v3 (briefing «Cinematic Opening Experience»: uma empresa, tudo ligado; sem login próprio — vem
   da ROMAFE Identity e passa ao Início); a v1 e a v2 ficam como estavam */
/* 22 out. 2026: ela, «só quero uma versão» — a 00 · Abertura fica só com a v3; saem a v1, a v2 e os estados da v2
   (o código delas fica em abertura.ts e abertura-v2.ts) */
/* 22 out. 2026 (tarde): a v4 (briefing «Minimal Cinematic Opening»: menos texto, um só gesto) substitui a v3 — uma
   só versão; o código da v3 fica em abertura-v3.ts */
const soAberturaV3 = (e: Ecra<IdErp>): Ecra<IdErp> => ({ ...e, objetivo: 'A entrada no ERP, depois do login comum (ROMAFE Identity): por trás do ROMAFE e do ERP, os anéis de um rolamento maquinado montam-se em ≈0,6 s, e a cena fica parada. Com sessão, segue para o Início (a marca passa à da barra); sem sessão, só «Iniciar sessão».', versoes: [versaoAberturaV4()] as Ecra<IdErp>['versoes'] });

/* 19 out. 2026: a fase 1 de Compras (compras/ecras.ts) — o 10 · Compras ganha a v2, na casca do Início */
const comV2 = (ecras: Ecra<IdErp>[]) => ecras.map((e) => e.id === 'compras' ? { ...e, versoes: [...e.versoes, VERSAO_COMPRAS_V2()] as Ecra<IdErp>['versoes'] } : e);

/* por baixo do ROMAFE, o nome por extenso e não «E R P» espaçado (ela, 8 out. 2026) */
export const erp: App<IdErp> = {
  id: 'erp',
  nome: 'ERP',
  sub: 'A plataforma de gestão',
  grupo: 'ERP',
  marca: 'ROMAFE',
  tela: { l: 1440, a: 900 },
  fluxos: { 'Entrar': 'O login é o comum a todas as apps (ROMAFE Identity, em identidade/); ao escolher o ERP, passa a abertura e depois o Início. «Terminar sessão» e a sessão expirada voltam ao login comum.', 'Início': DESCRICAO_INICIO, 'Compras': DESCRICAO_COMPRAS, 'Carregamento': DESCRICAO_CARREGAR_ERP, 'Erros': DESCRICAO_ERROS_ERP },
  /* 19 out. 2026: a 00 · Abertura («um ecrã wow como temos no goparts») antes do 01 · Entrar */
  /* 22 out. 2026: o login é o comum a todas as apps (ROMAFE Identity): saem os ecrãs de entrar do ERP (01–04, as
     versões até à v11, os estados da rede), a 06 · Escolher a empresa e a 07 · Escolher a aplicação — isso é da
     Identity. O código fica (entrar.ts, entrar-rede.ts, entrar-central.ts). */
  ecras: [soAberturaV3(ecraAbertura()), ...estadosAberturaV4(), ...ecrasInicio(), ...comV2(ecrasCompras()), ...ecrasCompras2(), ...ecrasFase2(), ...ecrasCarregarErp(), ...ecrasErroErp()],
};
