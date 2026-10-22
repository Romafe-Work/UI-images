import type { App } from '../../comum/tipos';
import { ecrasEntrar, versoesRomafe, DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
import type { IdErp } from './ids';
import { entrarErp } from './entrar';
import { ecrasCompras, DESCRICAO_COMPRAS } from './compras';
import { REDE_ENTRAR, VERSAO_REDE, NOTA_REDE, estadosRede } from './entrar-rede';
import { CENTRAL_ENTRAR, VERSAO_CENTRAL, NOTA_CENTRAL, ecrasCentral } from './entrar-central';
import type { Ecra } from '../../comum/tipos';
import { ecraAbertura } from './abertura';
import { versaoAberturaV2, estadosAberturaV2 } from './abertura-v2';
import { versaoAberturaV3, estadosAberturaV3 } from './abertura-v3';
import { ecrasInicio, DESCRICAO_INICIO } from './inicio';
import { ecrasCompras2, VERSAO_COMPRAS_V2 } from './compras/ecras';
import { ecrasFase2 } from './compras/ecras2';
import { ecrasCarregarErp, ecrasErroErp, DESCRICAO_CARREGAR_ERP, DESCRICAO_ERROS_ERP } from './estados';

/* 19 out. 2026: a v10 (a rede da empresa, do briefing dela) junta-se às versões dos quatro ecrãs de entrar;
   as outras ficam como estavam. Na ajuda, que tem versões a menos, leva o número seguinte ao da última. */
function comRede(ecras: Ecra<IdErp>[]): Ecra<IdErp>[] {
  return ecras.map((e) => {
    const html = REDE_ENTRAR[e.id as keyof typeof REDE_ENTRAR];
    if (!html) return e;
    const id = e.id === 'ajuda' ? 'v' + (e.versoes.length + 1) : VERSAO_REDE;
    /* 20 out. 2026: a v11, o início de sessão geral (entrar-central.ts), logo a seguir */
    const id11 = e.id === 'ajuda' ? 'v' + (e.versoes.length + 2) : VERSAO_CENTRAL;
    const html11 = CENTRAL_ENTRAR[e.id as keyof typeof CENTRAL_ENTRAR];
    return { ...e, versoes: [...e.versoes, { id, nota: NOTA_REDE, html }, { id: id11, nota: NOTA_CENTRAL, html: html11 }] as Ecra<IdErp>['versoes'] };
  });
}

/* 19 out. 2026: a 00 · Abertura ganha a v2 (briefing «V2 Cinematic Opening»); a v1 fica como estava */
/* 22 out. 2026: e a v3 (briefing «Cinematic Opening Experience»: uma empresa, tudo ligado; sem login próprio — vem
   da ROMAFE Identity e passa ao Início); a v1 e a v2 ficam como estavam */
const comAberturaV2 = (e: Ecra<IdErp>): Ecra<IdErp> => ({ ...e, versoes: [...e.versoes, versaoAberturaV2(), versaoAberturaV3()] as Ecra<IdErp>['versoes'] });

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
  fluxos: { 'Entrar': DESCRICAO_ENTRAR, 'Início': DESCRICAO_INICIO, 'Compras': DESCRICAO_COMPRAS, 'Carregamento': DESCRICAO_CARREGAR_ERP, 'Erros': DESCRICAO_ERROS_ERP },
  /* 19 out. 2026: a 00 · Abertura («um ecrã wow como temos no goparts») antes do 01 · Entrar */
  ecras: [comAberturaV2(ecraAbertura()), ...estadosAberturaV2(), ...estadosAberturaV3(), ...comRede(ecrasEntrar(versoesRomafe(entrarErp, 'Enterprise Resource Planning'))), ...estadosRede(), ...ecrasCentral(), ...ecrasInicio(), ...comV2(ecrasCompras()), ...ecrasCompras2(), ...ecrasFase2(), ...ecrasCarregarErp(), ...ecrasErroErp()],
};
