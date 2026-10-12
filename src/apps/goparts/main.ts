import '../../comum/css/tokens.css';
import '../../comum/css/base.css';
import '../../comum/entrar/entrar.css';
import './css/portal.css';
import './css/catalogo.css';
import './css/pedidos.css';
import './css/guias.css';
import './css/melhorias.css';
import './css/inicio-v2.css';
import './css/inicio-v21.css';
import './css/inicio-v22.css';
import './css/inicio-v23.css';
import './css/inicio-v2-animacao.css';
import './css/noite.css';
import './css/inicio-v3.css';
import './css/inicio-v4.css';
import './css/inicio-v5.css';
import './erros/erros.css';
import '../../comum/carregar/carregar.css';
import '../../comum/css/editor.css';

import { montar } from '../../comum/pagina';
import { iniciar as entrar } from '../../comum/entrar/comportamento';
import { goparts } from './app';
import { iniciar as carrossel } from './comportamento/carrossel';
import { iniciar as entrada } from './comportamento/entrada';
import { iniciar as v2animacao } from './comportamento/v2-animacao';

montar(goparts, [entrar, carrossel, entrada, v2animacao]);
