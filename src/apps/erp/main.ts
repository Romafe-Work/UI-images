import '../../comum/css/tokens.css';
import '../../comum/css/base.css';
import '../../comum/entrar/entrar.css';
import '../../comum/carregar/carregar.css';
import '../goparts/erros/erros.css';
import './css/erp.css';
import './css/entrar-rede.css';
import './css/abertura.css';
import '../../comum/css/editor.css';

import { montar } from '../../comum/pagina';
import { iniciar as entrar } from '../../comum/entrar/comportamento';
import { erp } from './app';
import { iniciar as rede } from './comportamento/rede';
import { iniciar as abertura } from './comportamento/abertura';

montar(erp, [entrar, rede, abertura]);
