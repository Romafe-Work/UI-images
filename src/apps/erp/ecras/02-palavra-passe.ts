import { ir, type EcraErp } from '../ids';
import { entrada } from '../bases/entrada';

export const palavraPasse: EcraErp = {
  id: 'palavra-passe',
  nome: '02 · A palavra-passe',
  fluxo: 'Entrar',
  objetivo: 'Passo 2, conta nossa: a palavra-passe valida no Keycloak, realm rolgest. O endereço fica à vista com «mudar». A recusa é sempre a mesma, esteja a conta errada, desativada ou inexistente.',
  html: entrada({
    discurso: `
<section class="discurso">
      <h1 class="discurso__titulo">Uma conta<br>da Romafe</h1>
      <p class="discurso__assinatura">O endereço é de uma conta criada no Rolgest. A palavra-passe confirma-se aqui.</p>
    </section>`,
    cartao: `
<section class="cartao" aria-labelledby="titulo-passe">
      <div class="cartao__cabeca">
        <span class="lockup lockup--centro">
          <span class="lockup__nome">ROLGEST</span>
          <span class="lockup__risco" aria-hidden="true"></span>
          <span class="lockup__sub">Plataforma de gestão</span>
        </span>
      </div>

      <div class="alerta" id="alerta" role="alert" data-ed-nome="Alerta · credenciais" hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 16.5v.5"/>
        </svg>
        <span>Endereço ou palavra-passe incorretos.</span>
      </div>

      <form class="formulario" id="formulario-passe" novalidate aria-labelledby="titulo-passe">
      <p class="identidade">
        <span class="identidade__correio">ana.ribeiro@exemplo.pt</span>
        <a class="identidade__mudar" href="#" ${ir('entrada')}>mudar</a>
      </p>

        <div class="campo campo--icone">
          <label class="campo__label" for="palavra-passe" id="titulo-passe">Palavra-passe <span class="campo__req" aria-hidden="true">*</span></label>
          <svg class="campo__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <input class="input" id="palavra-passe" name="password" type="password" required
                 autocomplete="current-password" data-com-botao placeholder="A sua palavra-passe">
          <!-- 19 §2.1: é um <button>, e o rótulo muda -->
          <button type="button" class="campo__acao" id="ver-palavra-passe" aria-label="Mostrar palavra-passe" aria-pressed="false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>

        <!-- 19 §5: desligada e com a dica. Um posto de ERP também é partilhado
             — o balcão, a expedição, a oficina. -->
        <div class="opcao">
          <input type="checkbox" id="manter" name="manter">
          <label class="opcao__texto" for="manter">Manter sessão iniciada
            <span class="opcao__ajuda">Não usar em computadores partilhados</span>
          </label>
        </div>

        <div class="formulario__accoes">
          <button type="submit" class="btn btn--acao btn--bloco" id="entrar">
            <svg class="btn__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>
            </svg>
            <span class="btn__rotulo">Entrar</span>
          </button>
          <!-- 19 §1: a recuperação é a última coisa do formulário, e é do Keycloak. -->
          <a class="ligacao-recuperar" href="#">Esqueceu-se da palavra-passe?</a>
        </div>
      </form>
      <p class="cartao__versao">Valida no Keycloak · realm rolgest</p>
    </section>`,
  }),
};
