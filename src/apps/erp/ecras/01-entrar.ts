import { ir, type EcraErp } from '../ids';
import { entrada } from '../bases/entrada';

export const entrar: EcraErp = {
  id: 'entrada',
  nome: '01 · Entrar',
  fluxo: 'Entrar',
  objetivo: 'Passo 1: só o endereço de correio, e o domínio decide o caminho. Conta nossa segue para a palavra-passe (02); empresa com fornecedor próprio segue para a página dele (03). É uma página do Keycloak com o tema Rolgest: a aplicação só redireciona, nunca recebe a palavra-passe.',
  html: entrada({
    discurso: `
<section class="discurso">
      <h1 class="discurso__titulo">Uma plataforma<br>todas as empresas<br>do grupo</h1>

      <!-- Não são argumentos de venda: é o que a pessoa precisa de saber para
           perceber o que este ecrã faz e o que não faz. §5 do resumo v10 —
           três perguntas, três donos, e nenhum consulta os outros. -->
      <ul class="vantagens">
        <li class="vantagem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <div>
            <p class="vantagem__titulo">Uma identidade</p>
            <p class="vantagem__sub">A conta é da sua empresa, não da Romafe</p>
          </div>
        </li>
        <li class="vantagem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 21V8l6-4 6 4v13"/><path d="M15 21V11h6v10"/><path d="M2 21h20"/>
            <path d="M7 11h2"/><path d="M7 15h2"/><path d="M18 15h1"/>
          </svg>
          <div>
            <p class="vantagem__titulo">Uma empresa de cada vez</p>
            <p class="vantagem__sub">Escolhe-se a seguir, e troca-se sem sair</p>
          </div>
        </li>
        <li class="vantagem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>
            <path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/>
          </svg>
          <div>
            <p class="vantagem__titulo">Os módulos que comprou</p>
            <p class="vantagem__sub">A licença diz quantos lugares, o produto diz quem</p>
          </div>
        </li>
      </ul>

      <p class="discurso__assinatura">Rolgest é o produto. Romafe é quem o aloja.</p>
    </section>`,
    cartao: `
<section class="cartao" aria-labelledby="titulo-entrada">
      <div class="cartao__cabeca">
        <span class="lockup lockup--centro">
          <span class="lockup__nome">ROLGEST</span>
          <span class="lockup__risco" aria-hidden="true"></span>
          <span class="lockup__sub" id="titulo-entrada">Plataforma de gestão</span>
        </span>
      </div>

      <!-- 19 §3: uma mensagem só, e nenhum campo ganha borda vermelha.
           Três recusas, três donos, três mensagens — e só uma se vê de cada
           vez. As duas de baixo estão escondidas: mostram-se no painel, em
           Peça → Visível, para se verem lado a lado. -->
      <div class="alerta alerta--licenca" role="alert" data-ed-nome="Alerta · licença" hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>
        </svg>
        <span>A licença da sua empresa expirou a 14 de setembro. Fale com quem a contratou.</span>
      </div>

      <div class="alerta alerta--permissao" role="alert" data-ed-nome="Alerta · permissão" hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>Entrou, mas não tem lugar em nenhum módulo. Peça acesso ao administrador da sua empresa.</span>
      </div>

      <!-- Passo 1. Um endereço que não existe também segue para a
           palavra-passe, e só falha no fim: dizer aqui «não existe»
           confirmava a quem tenta quem tem conta. -->
      <form class="formulario" id="formulario" novalidate>
        <div class="campo campo--icone">
          <label class="campo__label" for="utilizador">Endereço de correio <span class="campo__req" aria-hidden="true">*</span></label>
          <svg class="campo__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>
          </svg>
          <input class="input" id="utilizador" name="utilizador" type="email" required
                 autocomplete="username" placeholder="nome@empresa.pt" value="ana.ribeiro@exemplo.pt">
        </div>

        <div class="formulario__accoes">
          <button type="submit" class="btn btn--acao btn--bloco" id="continuar" ${ir('palavra-passe')}>
            <span class="btn__rotulo">Continuar</span>
            <svg class="btn__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
            </svg>
          </button>

          <!-- No produto não é uma ligação: o Keycloak redireciona sozinho
               quando o domínio pertence a uma organização com fornecedor
               próprio. Aqui leva ao 01d, para o caminho se ver no mapa. -->
          <p class="cartao__nota cartao__nota--caminho" ${ir('federado')}>Se a sua empresa tiver início de sessão próprio, segue para a página dela.</p>

          <!-- Não há «Pedir acesso»: as contas nascem no administrador da
               empresa, e o lugar vem da licença. Ninguém se inscreve num ERP. -->
          <p class="cartao__nota">As contas são criadas pelo administrador da sua empresa.</p>
        </div>
      </form>

      <div class="apoio">
        <div class="apoio__item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
          </svg>
          <div>
            <p class="apoio__titulo">Sessão verificada</p>
            <p class="apoio__sub">A empresa ativa é confirmada em cada pedido</p>
          </div>
        </div>
        <div class="apoio__risco" aria-hidden="true"></div>
        <div class="apoio__item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/>
            <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z"/>
          </svg>
          <div>
            <p class="apoio__titulo">Precisa de ajuda?</p>
            <p class="apoio__sub">Apoio Romafe · 800 000 000</p>
          </div>
        </div>
      </div>

      <p class="cartao__versao">Rolgest 10.0 · compilação 2026.09</p>
    </section>`,
  }),
};
