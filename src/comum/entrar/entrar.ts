/* =========================================================
   ROMAFE — o início de sessão, comum às três apps

   O processo é o mesmo em todas, porque a identidade é uma só (Keycloak):

     01 Entrar ── conta nossa ──▶ 02 A palavra-passe
        └──── cliente federado ─▶ 03 O início de sessão da empresa

   O que muda é quanto se mostra à volta:
     completa  (ERP, Web)  fotografia, texto de apresentação, tema e idioma,
                           alertas de licença e de lugar, «manter sessão»,
                           apoio, versão e rodapé
     compacta  (Mobile)    a fotografia e o cartão: a marca, o campo e o botão. Sem
                           barra de topo (a marca já está no cartão) e sem
                           «manter sessão», porque o aparelho é partilhado
   ========================================================= */
import type { Ecra } from '../tipos';
import { discurso as discursoDe, type Apresentacao } from './discurso';

export type IdEntrar = 'entrada' | 'palavra-passe' | 'federado';
export type Variante = 'completa' | 'compacta';
/** onde fica o cartão na variante completa: à direita, com a apresentação
    à esquerda (v1); ao centro, sozinho sobre a fotografia (v2); ou ao
    centro, com o título por cima e as vantagens por baixo (v3) */
export type Disposicao = 'lado' | 'centro' | 'centro-apresentacao';

export interface OpcoesEntrar {
  variante: Variante;
  /** só na completa; por omissão «lado» */
  disposicao?: Disposicao;
  /** sem nada da Romafe à vista (v4): o produto é vendido, e pode ser de
      outra empresa. Saem os direitos, o «Alojado pela Romafe», o apoio com
      o nome, a fotografia do armazém da Romafe e o desenho do logótipo dela
      (a letra Motor e o risco laranja); fica o nome do produto, em letra neutra */
  semRomafe?: boolean;
  /** o nome na marca e a linha por baixo: ROLGEST · Plataforma de gestão */
  marca: { nome: string; sub: string };
  /** como o produto se chama numa frase: «O Rolgest não vê a sua palavra-passe» */
  produto: string;
  /** só na completa: o título e as três vantagens à esquerda do 01, de cada app */
  apresentacao?: Apresentacao;
  /** o nome do fluxo no mapa e no seletor; por omissão «Entrar» */
  fluxo?: string;
  /** só na completa: a linha discreta no fim do cartão do 01 */
  versao?: string;
  /** só na completa: o realm do Keycloak, no fim do cartão do 02 */
  realm?: string;
}

/** O que muda quando a mesma app tem dois produtos:
    os ids dos ecrãs e das peças levam um prefixo, para não se repetirem. */
interface Chaves { ir: (id: IdEntrar) => string; id: (peca: string) => string }

/* ---------------- peças ---------------- */

function lockup(m: OpcoesEntrar['marca'], cls: string, idSub = ''): string {
  return `<span class="lockup ${cls}">
      <span class="lockup__nome">${m.nome}</span>
      <span class="lockup__risco" aria-hidden="true"></span>
      <span class="lockup__sub"${idSub ? ` id="${idSub}"` : ''}>${m.sub}</span>
    </span>`;
}

function topo(o: OpcoesEntrar): string {
  const accoes = `
    <div class="topo__accoes">
      <div class="segmented" role="group" aria-label="Tema da interface">
        <button type="button" class="segmented__btn" data-tema="light" aria-pressed="false">Claro</button>
        <button type="button" class="segmented__btn" data-tema="dark" aria-pressed="false">Escuro</button>
        <button type="button" class="segmented__btn" data-tema="auto" aria-pressed="true">Auto</button>
      </div>
      <button type="button" class="topo__idioma" aria-label="Mudar idioma: Português">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20Z"/>
        </svg>
        Português
      </button>
    </div>`;
  return `<header class="topo">
    ${lockup(o.marca, 'lockup--sm')}${accoes}
  </header>`;
}

function rodape(o: OpcoesEntrar): string {
  if (o.variante === 'compacta') return '';
  return `<footer class="rodape">
    <p class="rodape__direitos" data-ed-nome="Direitos">© 2026 ${o.semRomafe ? o.produto : 'Romafe SA'}. Todos os direitos reservados.</p>
    <ul class="rodape__ligacoes">
      <li><a href="#">Aviso legal</a></li>
      <li><a href="#">Política de privacidade</a></li>
      <li><a href="#">Contactos</a></li>
    </ul>
    ${o.semRomafe ? '' : `<p class="rodape__selo">
      <span class="rodape__barras" aria-hidden="true">///</span>
      <span class="rodape__lema">Alojado<br>pela Romafe</span>
    </p>`}
  </footer>`;
}

/** A base: o topo, o palco e o rodapé à volta do cartão de cada passo. */
function pagina(o: OpcoesEntrar, discurso: string, cartao: string): string {
  const completa = o.variante === 'completa';
  const centro = completa && o.disposicao === 'centro';
  const centroApr = completa && o.disposicao === 'centro-apresentacao';
  const cls = (centro ? ' entrada--centro' : centroApr ? ' entrada--centro entrada--centro-apresentacao' : '')
    + (o.semRomafe ? ' entrada--neutra' : '');
  return `<div class="entrada entrada--${o.variante}${cls}">
  ${completa ? topo(o) : ''}
  <main class="palco">
    ${o.semRomafe ? '' : '<div class="palco__foto" role="img" aria-label="Armazém da Romafe"></div>'}
    <div class="palco__veu" aria-hidden="true"></div>
    ${completa && !centro ? discurso : ''}
    ${cartao}
  </main>
  ${rodape(o)}
</div>`;
}

const SVG_SETA = `<svg class="btn__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>`;

/* ---------------- 01 · Entrar ---------------- */
function cartaoEntrada(o: OpcoesEntrar, k: Chaves): string {
  const completa = o.variante === 'completa';
  /* 19 §3: uma mensagem só, e nenhum campo ganha borda vermelha. As duas
     recusas de outro dono (a licença, o lugar) estão escondidas: mostram-se
     no painel, em Peça → Visível. No Mobile não cabem: lá a recusa é do PDA. */
  const alertas = completa ? `
      <div class="alerta alerta--licenca" role="alert" data-ed-nome="Alerta · licença" hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>
        <span>A licença da sua empresa expirou a 14 de setembro. Fale com quem a contratou.</span>
      </div>
      <div class="alerta alerta--permissao" role="alert" data-ed-nome="Alerta · permissão" hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span>Entrou, mas não tem lugar em nenhum módulo. Peça acesso ao administrador da sua empresa.</span>
      </div>` : '';

  const apoio = completa ? `
      <div class="apoio">
        <div class="apoio__item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
          <div>
            <p class="apoio__titulo">Sessão verificada</p>
            <p class="apoio__sub">A empresa ativa é confirmada em cada pedido</p>
          </div>
        </div>
        <div class="apoio__risco" aria-hidden="true"></div>
        <div class="apoio__item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z"/></svg>
          <div>
            <p class="apoio__titulo">Precisa de ajuda?</p>
            <p class="apoio__sub">${o.semRomafe ? 'Apoio ao cliente' : 'Apoio Romafe'} · 800 000 000</p>
          </div>
        </div>
      </div>
      ${o.versao ? `<p class="cartao__versao">${o.versao}</p>` : ''}` : '';

  return `<section class="cartao" aria-labelledby="${k.id('titulo-entrada')}">
      <div class="cartao__cabeca">${lockup(o.marca, 'lockup--centro', k.id('titulo-entrada'))}</div>
      ${alertas}
      <!-- Passo 1. Um endereço que não existe também segue para a
           palavra-passe, e só falha no fim: dizer aqui «não existe»
           confirmava a quem tenta quem tem conta. -->
      <form class="formulario" id="${k.id('formulario')}" novalidate>
        <div class="campo campo--icone">
          <label class="campo__label" for="${k.id('utilizador')}">Endereço de correio <span class="campo__req" aria-hidden="true">*</span></label>
          <svg class="campo__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
          <input class="input" id="${k.id('utilizador')}" name="utilizador" type="email" required
                 autocomplete="username" placeholder="nome@empresa.pt" value="ana.ribeiro@exemplo.pt">
        </div>
        <div class="formulario__accoes">
          <button type="submit" class="btn btn--acao btn--bloco" id="${k.id('continuar')}" ${k.ir('palavra-passe')}>
            <span class="btn__rotulo">Continuar</span>${SVG_SETA}
          </button>
        </div>
      </form>
      ${apoio}
    </section>`;
}

/* ---------------- 02 · A palavra-passe ---------------- */
function cartaoPalavraPasse(o: OpcoesEntrar, k: Chaves): string {
  /* 19 §5: desligada e com a dica. No Mobile não existe: o PDA é de todos. */
  const manter = o.variante === 'completa' ? `
        <div class="opcao">
          <input type="checkbox" id="${k.id('manter')}" name="manter">
          <label class="opcao__texto" for="${k.id('manter')}">Manter sessão iniciada
            <span class="opcao__ajuda">Não usar em computadores partilhados</span>
          </label>
        </div>` : '';
  return `<section class="cartao" aria-labelledby="${k.id('titulo-passe')}">
      <div class="cartao__cabeca">${lockup(o.marca, 'lockup--centro')}</div>
      <div class="alerta" id="${k.id('alerta')}" data-credenciais role="alert" data-ed-nome="Alerta · credenciais" hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 16.5v.5"/></svg>
        <span>Endereço ou palavra-passe incorretos.</span>
      </div>
      <form class="formulario" id="${k.id('formulario-passe')}" data-palavra-passe novalidate>
        <p class="identidade">
          <span class="identidade__correio">ana.ribeiro@exemplo.pt</span>
          <a class="identidade__mudar" href="#" ${k.ir('entrada')}>mudar</a>
        </p>
        <div class="campo campo--icone">
          <label class="campo__label" for="${k.id('palavra-passe')}" id="${k.id('titulo-passe')}">Palavra-passe <span class="campo__req" aria-hidden="true">*</span></label>
          <svg class="campo__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <input class="input" id="${k.id('palavra-passe')}" name="password" type="password" required
                 autocomplete="current-password" data-com-botao placeholder="A sua palavra-passe">
          <!-- 19 §2.1: é um <button>, e o rótulo muda -->
          <button type="button" class="campo__acao" id="${k.id('ver-palavra-passe')}" aria-label="Mostrar palavra-passe" aria-pressed="false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>${manter}
        <div class="formulario__accoes">
          <button type="submit" class="btn btn--acao btn--bloco" id="${k.id('entrar')}">
            <svg class="btn__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>
            <span class="btn__rotulo">Entrar</span>
          </button>
          <!-- 19 §1: a recuperação é a última coisa do formulário, e é do Keycloak. -->
          <a class="ligacao-recuperar" href="#">Esqueceu-se da palavra-passe?</a>
        </div>
      </form>
      ${o.variante === 'completa' && o.realm ? `<p class="cartao__versao">Valida no Keycloak · realm ${o.realm}</p>` : ''}
    </section>`;
}

/* ---------------- 03 · O início de sessão da empresa ---------------- */
function cartaoFederado(o: OpcoesEntrar, k: Chaves): string {
  return `<section class="cartao cartao--fora" aria-labelledby="${k.id('titulo-fora')}">
      <p class="fora__marca">Fora do ${o.produto}</p>
      <h2 class="cartao__titulo" id="${k.id('titulo-fora')}">Página do fornecedor da empresa</h2>
      <p class="cartao__sub">Por exemplo, o Entra ID da Exemplo, Lda. O desenho é o dela.</p>
      <div class="formulario">
        <p class="identidade"><span class="identidade__correio">ana.ribeiro@exemplo.pt</span></p>
        <div class="campo">
          <label class="campo__label" for="${k.id('passe-empresa')}">Palavra-passe da empresa</label>
          <input class="input" id="${k.id('passe-empresa')}" type="password" value="••••••••••" disabled>
        </div>
        <div class="campo">
          <label class="campo__label" for="${k.id('fator-empresa')}">Segundo fator do cliente</label>
          <input class="input" id="${k.id('fator-empresa')}" type="text" value="código da aplicação" disabled>
        </div>
        <div class="formulario__accoes">
          <button type="button" class="btn btn--acao btn--bloco"><span class="btn__rotulo">Entrar na Exemplo</span></button>
        </div>
      </div>
      <div class="cartao__pe">
        <span>Não é a sua empresa?</span>
        <a class="ligacao-recuperar" href="#" ${k.ir('entrada')}>Usar outro endereço</a>
      </div>
    </section>`;
}

/** Uma versão do início de sessão: as opções com que se desenha. */
export interface VersaoEntrar { id: string; nota: string; opcoes: OpcoesEntrar }

/** Os três ecrãs do início de sessão, para a app que os pede, com as versões
    que ela tiver. Se uma app tiver dois produtos, cada um passa o seu prefixo
    para os ids dos ecrãs não se repetirem. */
export function ecrasEntrar<P extends string = ''>(versoes: [VersaoEntrar, ...VersaoEntrar[]], prefixo = '' as P): Ecra<`${P}${IdEntrar}`>[] {
  /* cada versão desenha os três ecrãs; as peças levam a versão no id, para
     duas versões do mesmo ecrã não terem dois #palavra-passe */
  const desenhos = versoes.map((v, i) => {
    const o = v.opcoes;
    const k: Chaves = {
      ir: (id) => `data-ir="${prefixo}${id}"`,
      id: (peca) => prefixo + (i ? v.id + '-' : '') + peca,
    };
    const d = o.variante === 'completa' && o.apresentacao
      ? discursoDe(o.produto, o.apresentacao, !!o.semRomafe)
      : { entrada: '', palavraPasse: '', federado: '' };
    return {
      entrada: pagina(o, d.entrada, cartaoEntrada(o, k)),
      'palavra-passe': pagina(o, d.palavraPasse, cartaoPalavraPasse(o, k)),
      federado: pagina(o, d.federado, cartaoFederado(o, k)),
    } as Record<IdEntrar, string>;
  });
  const fluxo = versoes[0].opcoes.fluxo || 'Entrar';
  const ecra = (id: IdEntrar, nome: string, objetivo: string): Ecra<`${P}${IdEntrar}`> => ({
    id: `${prefixo}${id}` as `${P}${IdEntrar}`, nome, fluxo, objetivo,
    versoes: versoes.map((v, i) => ({ id: v.id, nota: v.nota, html: desenhos[i][id] })) as Ecra['versoes'],
  });
  return [
    ecra('entrada', '01 · Entrar',
      'Passo 1: só o endereço de correio, e o domínio decide o caminho. Conta nossa segue para a palavra-passe (02); empresa com fornecedor próprio segue sozinha para a página dela (03). É uma página do Keycloak: a aplicação só redireciona, nunca recebe a palavra-passe.'),
    ecra('palavra-passe', '02 · A palavra-passe',
      'Passo 2, conta nossa: a palavra-passe valida no Keycloak. O endereço fica à vista com «mudar». A recusa é sempre a mesma, esteja a conta errada, desativada ou inexistente.'),
    ecra('federado', '03 · O início de sessão da empresa',
      'Passo 2, cliente federado: o domínio pertence a uma organização com fornecedor próprio (por exemplo o Entra ID da empresa). A palavra-passe e o segundo fator são do cliente; a página não é nossa. Volta à aplicação já com o token. Não há botão que leve aqui: é o Keycloak que redireciona quando reconhece o domínio do endereço do 01.'),
  ];
}

/** As versões do início de sessão completo (7 de outubro): v1 com o cartão
    à direita; v2 com o cartão ao centro, sugestão da chefia; v3 a v2 com a
    apresentação de volta, porque à v2 «falta mais algo»; v4 a v3 sem nada
    da Romafe, porque o produto pode ser vendido a outra empresa. O que a
    app quiser diferente na v4 (um texto que falava da Romafe) vem em `v4`. */
export function versoesCompletas(o: OpcoesEntrar, v4: Partial<OpcoesEntrar> = {}): [VersaoEntrar, VersaoEntrar, VersaoEntrar, VersaoEntrar] {
  return [
    { id: 'v1', nota: 'Cartão à direita, com a apresentação da app', opcoes: { ...o, disposicao: 'lado' } },
    { id: 'v2', nota: 'Cartão ao centro, sozinho sobre a fotografia', opcoes: { ...o, disposicao: 'centro' } },
    { id: 'v3', nota: 'Cartão ao centro, com o título por cima e as vantagens por baixo', opcoes: { ...o, disposicao: 'centro-apresentacao' } },
    { id: 'v4', nota: 'A v3 sem nada da Romafe: nem o nome, nem o desenho do logótipo, nem a fotografia do armazém', opcoes: { ...o, marca: { ...o.marca, nome: o.produto }, ...v4, disposicao: 'centro-apresentacao', semRomafe: true } },
  ];
}

export const DESCRICAO_ENTRAR =
  'Primeiro o endereço, e o domínio decide o caminho: palavra-passe nossa (02) ou a página da empresa (03). É o mesmo nas três apps.';
