import '../../comum/css/tokens.css';
import '../../comum/css/base.css';
import '../../comum/entrar/entrar.css';
import '../../comum/css/telemovel.css';
import '../../comum/carregar/carregar.css';
import './css/pick.css';
import './css/inventario.css';
import './css/entrar-industrial.css';
import './css/cena.css';
import './css/abertura-pick.css';
import './css/gestor.css';
import './css/inventario-v2.css';
import './css/arrumacao.css';
import './css/navegacao.css';
import './css/gestor-v3.css';
import './css/gestor-v4.css';
import './css/gestor-v5.css';
import './css/arrumador.css';
import '../goparts/css/entrar-3d.css';
import '../identidade/css/identidade.css';
import './css/login-pick.css';
import '../../comum/css/editor.css';

import { montar } from '../../comum/pagina';
/* o roteiro da demonstração com o rato regista-se antes de a página montar (demo.ts procura-o) */
import './roteiro';
import { iniciar as entrar } from '../../comum/entrar/comportamento';
import { mobile } from './app';
import { iniciar as inventario } from './comportamento/inventario';
import { iniciar as entrarIndustrial } from './comportamento/entrar-industrial';
import { iniciar as navegar } from './comportamento/navegar';
import { iniciar as aberturaPick } from './comportamento/abertura-pick';
import { iniciar as gestor } from './comportamento/gestor';
import { iniciar as funcoes } from './comportamento/funcoes';
import { iniciar as arrumador } from './comportamento/arrumador';

montar(mobile, [navegar, entrar, inventario, entrarIndustrial, aberturaPick, gestor, funcoes, arrumador]);
