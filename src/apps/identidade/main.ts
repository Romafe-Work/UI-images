import '../../comum/css/tokens.css';
import '../../comum/css/base.css';
import '../../comum/entrar/entrar.css';
import './css/identidade.css';
import '../../comum/css/editor.css';

import { montar } from '../../comum/pagina';
import { identidade } from './app';
import { iniciar } from './comportamento/identidade';

montar(identidade, [iniciar]);
