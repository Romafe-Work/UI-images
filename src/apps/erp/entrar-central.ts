/* =========================================================
   ERP — v11 do início de sessão: o início de sessão geral (20 out. 2026)
   Do retorno à v10 (Teams, 20 out.): «tirava o bem-vindo ao Romafe ERP» e «a pessoa vai dar login numa
   parte geral e depois é que escolhe onde quer entrar — vai ser um login centralizado». O Gonçalo: «Sim».
   Ela escolheu a ordem: primeiro a empresa, depois a aplicação.
     01–04 — os da v10 (a mesma rede e o mesmo cartão), com a marca só ROMAFE e os textos de todas as
             aplicações; «Entrar» já não abre o ERP, abre o 06.
     06 — a empresa: as empresas a que a conta tem acesso (spec Rolgest v10: uma pessoa pode ter várias
          e troca sem sair). A última usada vem marcada. Com uma empresa só, este passo não aparece.
     07 — a aplicação: as da plataforma, conforme a licença da empresa escolhida. (20 out., ela: «o login é
          global; depois do login é que se vai para as apps».) O ERP abre como na v10 (o cartão sai e a moldura
          do ERP desenha-se); o Peça A Peça abre o Início dele, já com a sessão; o GoShop ainda não tem ecrãs no
          protótipo; a Pick entra-se no PDA (o mesmo início de sessão, no terminal).
   No produto é o Keycloak que sabe quem é a pessoa; as empresas e as aplicações vêm da API do Rolgest
   (GET /v1/empresas) e da licença de cada empresa. A v10 fica como estava.
   ========================================================= */
import type { EcraErp } from './ids';
import { L, aviso, botao, moldura, correio, passe, empresa, ajuda, CORREIO, type Op } from './entrar-rede';
import mail from 'lucide-static/icons/mail.svg?raw';
import building from 'lucide-static/icons/building-2.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import layoutDashboard from 'lucide-static/icons/layout-dashboard.svg?raw';
import store from 'lucide-static/icons/store.svg?raw';
import shoppingCart from 'lucide-static/icons/shopping-cart.svg?raw';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import arrowLeftRight from 'lucide-static/icons/arrow-left-right.svg?raw';
import logOut from 'lucide-static/icons/log-out.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import userX from 'lucide-static/icons/user-x.svg?raw';

export const VERSAO_CENTRAL = 'v11';
export const NOTA_CENTRAL = 'O início de sessão geral (20 out., retorno à v10): sem o «Bem-vindo ao ROMAFE ERP», a marca só ROMAFE, e depois da palavra-passe escolhe-se a empresa e a aplicação';

/* as empresas da conta do Rui Matos: a Romafe e duas de exemplo (as do grupo não estão no protótipo) */
export interface Empresa { id: string; nome: string; local: string; ultima?: boolean; semErp?: boolean }
export const EMPRESAS: Empresa[] = [
  { id: 'romafe', nome: 'Romafe, SA', local: 'Armazém 60 · Coimbra', ultima: true },
  { id: 'exemplo-pecas', nome: 'Exemplo Peças, Lda', local: 'Porto · empresa de exemplo' },
  { id: 'exemplo-logistica', nome: 'Exemplo Logística, Lda', local: 'Lisboa · empresa de exemplo', semErp: true },
];

/* as aplicações da plataforma: as que abrem daqui levam a página delas (pagina); as outras dizem porquê não abrem */
const APPS: { id: string; nome: string; desc: string; icone: string; pagina?: string; estado?: string }[] = [
  { id: 'erp', nome: 'ROMAFE ERP', desc: 'Compras, stocks, vendas e a gestão da empresa.', icone: layoutDashboard },
  { id: 'goparts', nome: 'Peça A Peça', desc: 'O marketplace de peças auto.', icone: store, pagina: 'goparts' },
  { id: 'goshop', nome: 'GoShop', desc: 'A loja online de peças.', icone: shoppingCart, estado: 'Ainda sem ecrãs no protótipo' },
  { id: 'pick', nome: 'Pick', desc: 'A aplicação do armazém.', icone: scanBarcode, estado: 'Entra-se no PDA' },
];

const conta = `<div class="rede__conta" data-rede-conta>${L(mail)}<span class="rede__conta-correio">${CORREIO}</span><button type="button" class="rede__mudar" data-ir="entrada" data-rede-acao="sair">${L(logOut)}Sair</button></div>`;

/* ---------- 06 · a empresa ---------- */
interface OpEmpresa { vazio?: boolean }
function passoEmpresa(k: string, o: OpEmpresa = {}): string {
  if (o.vazio) return `<div class="rede__passo central">
    <h1 class="rede__titulo" id="rede-titulo-${k}">Ainda sem empresa</h1>
    <p class="rede__sub">A tua conta entrou, mas ainda não tem acesso a nenhuma empresa.</p>
    ${conta}
    <p class="rede__nota rede__nota--caixa">${L(userX)}<span>Quem dá o acesso é o administrador da tua empresa. Quando o tiveres, volta a entrar e a empresa aparece aqui.</span></p>
    ${botao('Terminar sessão', logOut, { ir: 'entrada', tipo: 'button', rede: 'sair' })}
  </div>`;
  const n = EMPRESAS.length;
  return `<div class="rede__passo central">
    <h1 class="rede__titulo" id="rede-titulo-${k}">Escolhe a empresa</h1>
    <p class="rede__sub">A tua conta tem acesso a ${n === 2 ? 'duas' : n === 3 ? 'três' : n} empresas. Podes trocar depois, sem sair.</p>
    ${conta}
    <ul class="central__lista" aria-label="Empresas">
      ${EMPRESAS.map((e) => `<li><button type="button" class="central__opcao" data-ir="escolher-app" data-rede-acao="empresa-escolher" data-empresa="${e.id}">
        <span class="central__icone">${L(building)}</span>
        <span class="central__texto"><span class="central__nome">${e.nome}</span><span class="central__desc">${e.local}</span></span>
        <span class="central__marca" data-central-ultima${e.ultima ? '' : ' hidden'}>${L(history)}Última usada</span>
        ${L(chevronRight, 'central__seta')}
      </button></li>`).join('')}
    </ul>
  </div>`;
}

/* ---------- 07 · a aplicação ---------- */
interface OpApp { empresa?: Empresa; abrir?: boolean }
function passoApp(k: string, o: OpApp = {}): string {
  const e = o.empresa || EMPRESAS[0];
  const app = (a: typeof APPS[number]) => {
    const corpo = `<span class="central__icone">${L(a.icone)}</span><span class="central__texto"><span class="central__nome">${a.nome}</span><span class="central__desc">${a.desc}</span></span>`;
    if (a.id === 'erp' && e.semErp) return `<li><div class="central__opcao is-fechada" data-app="erp">${corpo}<span class="central__estado">${L(lock)}A empresa não tem esta aplicação</span></div></li>`;
    if (a.id === 'erp') return `<li><button type="button" class="central__opcao is-principal" data-ir="inicio" data-rede-acao="abrir-erp" data-app="erp"${o.abrir ? ' aria-busy="true" disabled' : ''}>${corpo}${o.abrir ? '<span class="central__estado"><span class="central__girar" aria-hidden="true"></span>A abrir…</span>' : `<span class="central__abrir">Abrir${L(chevronRight)}</span>`}</button></li>`;
    if (a.pagina) return `<li><button type="button" class="central__opcao" data-rede-acao="abrir-app" data-app="${a.id}" data-pagina="${a.pagina}">${corpo}<span class="central__abrir central__abrir--leve">Abrir${L(chevronRight)}</span></button></li>`;
    return `<li><div class="central__opcao is-fechada" data-app="${a.id}">${corpo}<span class="central__estado">${a.estado}</span></div></li>`;
  };
  return `<div class="rede__passo central">
    <h1 class="rede__titulo" id="rede-titulo-${k}">Onde queres entrar?</h1>
    <p class="rede__sub">As aplicações de <strong data-central-empresa>${e.nome}</strong>.</p>
    <span class="rede__conta-correio" hidden>${CORREIO}</span>
    <div class="rede__conta">${L(building)}<span class="central__empresa" data-central-empresa>${e.nome}</span><button type="button" class="rede__mudar" data-ir="escolher-empresa">${L(arrowLeftRight)}Trocar</button></div>
    ${e.semErp ? aviso([lock, 'Esta empresa não tem o ERP', 'A licença desta empresa não inclui o ROMAFE ERP. Escolhe outra empresa, ou fala com o administrador.', 'info']) : ''}
    <ul class="central__lista" aria-label="Aplicações">${APPS.map(app).join('')}</ul>
  </div>`;
}

const geral = (o: Op = {}): Op => ({ ...o, geral: true });

/** A v11 de cada um dos quatro ecrãs de entrar (os da v10, com o início de sessão geral). */
export const CENTRAL_ENTRAR: Record<'entrada' | 'palavra-passe' | 'federado' | 'ajuda', string> = {
  entrada: correio('11-01', geral({ correio: CORREIO, rede: 'valido' })),
  'palavra-passe': passe('11-02', geral()),
  federado: empresa('11-03', true),
  ajuda: ajuda('11-04', true),
};

export type IdCentral = 'escolher-empresa' | 'escolher-app' | 'central-sem-empresa' | 'central-sem-erp' | 'central-a-abrir';

/** Os dois passos novos (06 e 07) e os estados deles. Só existem na v11. */
export function ecrasCentral(): EcraErp[] {
  const v = (html: string) => [{ id: VERSAO_CENTRAL, nota: NOTA_CENTRAL, html }] as EcraErp['versoes'];
  const m = (k: string, corpo: string, rede = 'neutro') => moldura(k, 'central', corpo, { geral: true, rede });
  const e = (id: IdCentral, de: 'escolher-empresa' | 'escolher-app', nome: string, objetivo: string, html: string): EcraErp =>
    ({ id, nome, fluxo: 'Entrar', estadoDe: de, objetivo, versoes: v(html) });
  return [
    { id: 'escolher-empresa', nome: '06 · Escolher a empresa', fluxo: 'Entrar',
      objetivo: 'Depois da palavra-passe, no início de sessão geral: as empresas a que a conta tem acesso, com a última usada marcada. Escolher uma leva às aplicações dela. Com uma empresa só, este passo salta-se.',
      versoes: v(m('06', passoEmpresa('06'))) },
    e('central-sem-empresa', 'escolher-empresa', '06.1 · Sem empresa', 'A conta entrou no Keycloak mas não tem acesso a nenhuma empresa do Rolgest: diz-se isso, e quem dá o acesso. Não se mostra uma lista vazia.',
      m('06-1', passoEmpresa('06-1', { vazio: true }))),
    { id: 'escolher-app', nome: '07 · Escolher a aplicação', fluxo: 'Entrar',
      objetivo: 'Depois do início de sessão global, as aplicações da empresa escolhida. O ERP abre o espaço de trabalho (05 · Início); o Peça A Peça abre o Início dele; o GoShop ainda não tem ecrãs; a Pick entra-se no PDA. «Trocar» volta às empresas.',
      versoes: v(m('07', passoApp('07'))) },
    e('central-a-abrir', 'escolher-app', '07.1 · A abrir o ERP', 'Depois de escolher o ERP: a espera na própria linha, enquanto se pede a sessão da empresa; depois o cartão sai e a moldura do ERP desenha-se.',
      m('07-1', passoApp('07-1', { abrir: true }), 'pedido')),
    e('central-sem-erp', 'escolher-app', '07.2 · Empresa sem o ERP', 'A licença da empresa escolhida não inclui o ERP: a linha diz isso e não se clica; o aviso diz o que fazer. As outras aplicações aparecem na mesma.',
      m('07-2', passoApp('07-2', { empresa: EMPRESAS[2] }))),
  ];
}
