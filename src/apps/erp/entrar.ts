/* =========================================================
   ERP — o que o início de sessão tem de próprio no Rolgest
   O processo e o cartão são os comuns (src/comum/entrar); aqui só a
   marca e o texto de apresentação à esquerda de cada passo.
   ========================================================= */
import type { OpcoesEntrar } from '../../comum/entrar/entrar';

export const entrarErp: OpcoesEntrar = {
  variante: 'completa',
  marca: { nome: 'ROLGEST', sub: 'Plataforma de gestão' },
  produto: 'Rolgest',
  versao: 'Rolgest 10.0 · compilação 2026.09',
  realm: 'rolgest',
  discurso: {
    entrada: `
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
    palavraPasse: `
    <section class="discurso">
      <h1 class="discurso__titulo">Uma conta<br>da Romafe</h1>
      <p class="discurso__assinatura">O endereço é de uma conta criada no Rolgest. A palavra-passe confirma-se aqui.</p>
    </section>`,
    federado: `
    <section class="discurso">
      <h1 class="discurso__titulo">A conta<br>é da sua empresa</h1>
      <p class="discurso__assinatura">O Rolgest não vê a sua palavra-passe. Quem a confirma é a sua empresa, e devolve-o aqui já com a sessão aberta.</p>
    </section>`,
  },
};
