/**
 * ReAlimenta - Interface grafica (cliente)
 *
 * Toda a tela consome a API REST servida pelo proprio backend NestJS em /api.
 * Nenhum dado fica em memoria no navegador: cada acao le ou grava no
 * PostgreSQL atraves da API.
 */
const API = '/api';

/* ------------------------------------------------------------ utilitarios */

async function chamar(metodo, caminho, corpo) {
  const opcoes = { method: metodo, headers: { 'Content-Type': 'application/json' } };
  if (corpo !== undefined) opcoes.body = JSON.stringify(corpo);

  const resposta = await fetch(API + caminho, opcoes);
  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : null;

  if (!resposta.ok) {
    const mensagem = Array.isArray(dados?.message) ? dados.message.join(' | ') : dados?.message;
    throw new Error(mensagem || `Erro ${resposta.status}`);
  }
  return dados;
}

function avisar(mensagem, erro = false) {
  const caixa = document.getElementById('aviso');
  caixa.textContent = mensagem;
  caixa.className = erro ? 'aviso aviso--erro' : 'aviso';
  caixa.hidden = false;
  clearTimeout(avisar.timer);
  avisar.timer = setTimeout(() => { caixa.hidden = true; }, 4200);
}

const escapar = (valor) => String(valor ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const dataHora = (valor) => valor
  ? new Date(valor).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  : '—';

const paraIso = (valorInput) => new Date(valorInput).toISOString();

const paraInput = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

/* ------------------------------------------------------------------ abas */

document.getElementById('abas').addEventListener('click', (evento) => {
  const botao = evento.target.closest('.aba');
  if (!botao) return;

  document.querySelectorAll('.aba').forEach((b) => b.classList.remove('aba--ativa'));
  botao.classList.add('aba--ativa');

  document.querySelectorAll('.secao').forEach((s) => s.classList.remove('secao--ativa'));
  document.getElementById('secao-' + botao.dataset.aba).classList.add('secao--ativa');

  atualizarTudo();
});

/* -------------------------------------------------------------- PAINEL */

async function carregarPainel() {
  const impacto = await chamar('GET', '/doacoes/impacto');
  const s = impacto.doacoesPorStatus;

  document.getElementById('cartoesImpacto').innerHTML = `
    ${cartao('Alimento resgatado', impacto.alimentoResgatadoKg + ' kg', 'Total confirmado em retiradas')}
    ${cartao('Refeições equivalentes', impacto.refeicoesEquivalentes, 'ODS 2 — Fome Zero')}
    ${cartao('CO₂e evitado', impacto.co2EvitadoKg + ' kg', 'ODS 12 — meta 12.3')}
    ${cartao('Retiradas registradas', impacto.totalDeRetiradas, 'Registros imutáveis de auditoria')}
    ${cartao('Doações disponíveis', s.disponiveis, `${s.reservadas} reservadas · ${s.retiradas} retiradas · ${s.expiradas} expiradas`)}
  `;

  const participantes = await chamar('GET', '/participantes');
  document.getElementById('tabelaPolimorfismo').innerHTML = participantes.length === 0
    ? '<p class="vazio">Nenhum participante cadastrado.</p>'
    : `<div class="rolavel"><table>
        <thead><tr>
          <th>#</th><th>Nome</th><th>Classe (runtime)</th>
          <th class="th--codigo">papel()</th>
          <th class="th--codigo">descricaoResumida()</th>
          <th class="th--codigo">podeReivindicarDoacoes()</th>
        </tr></thead>
        <tbody>${participantes.map((p) => `
          <tr>
            <td>${p.id}</td>
            <td><strong>${escapar(p.nome)}</strong></td>
            <td><code>${escapar(p.classe)}</code></td>
            <td>${escapar(p.papel)}</td>
            <td>${escapar(p.descricaoResumida)}</td>
            <td><span class="etiqueta etiqueta--${p.podeReivindicarDoacoes ? 'sim' : 'nao'}">
              ${p.podeReivindicarDoacoes ? 'SIM' : 'NÃO'}</span></td>
          </tr>`).join('')}
        </tbody></table></div>`;
}

const cartao = (rotulo, valor, nota) => `
  <div class="cartao">
    <div class="cartao__rotulo">${rotulo}</div>
    <div class="cartao__valor">${valor}</div>
    <div class="cartao__nota">${nota}</div>
  </div>`;

/* ------------------------------------------------------------- DOACOES */

async function carregarDoacoes() {
  const [doadores, receptoras] = await Promise.all([
    chamar('GET', '/participantes/doadores'),
    chamar('GET', '/participantes/receptoras'),
  ]);

  const seletor = document.getElementById('doacaoDoador');
  const selecionado = seletor.value;
  seletor.innerHTML = doadores.map((d) =>
    `<option value="${d.id}">${escapar(d.nome)}</option>`).join('');
  if (selecionado) seletor.value = selecionado;

  const filtro = document.getElementById('filtroStatus').value;
  const doacoes = await chamar('GET', '/doacoes' + (filtro ? `?status=${filtro}` : ''));
  const validadas = receptoras.filter((r) => r.validada);

  document.getElementById('listaDoacoes').innerHTML = doacoes.length === 0
    ? '<p class="vazio">Nenhuma doação encontrada para o filtro selecionado.</p>'
    : doacoes.map((d) => cartaoDoacao(d, validadas)).join('');
}

function cartaoDoacao(d, receptorasValidadas) {
  const manifestacoes = d.manifestacoes ?? [];
  const opcoes = receptorasValidadas
    .filter((r) => !manifestacoes.some((m) => m.receptoraId === r.id))
    .map((r) => `<option value="${r.id}">${escapar(r.nome)}</option>`).join('');

  const listaManifestacoes = manifestacoes.length === 0 ? '' : `
    <div class="doacao__meta" style="margin-top:8px">
      <strong>Interessadas (REQ08):</strong>
      ${manifestacoes
        .slice()
        .sort((a, b) => Number(a.distanciaKm) - Number(b.distanciaKm))
        .map((m) => `${escapar(m.receptora?.nome ?? 'Organização ' + m.receptoraId)} — ${Number(m.distanciaKm).toFixed(2)} km`)
        .join(' · ')}
    </div>`;

  const acoes = [];
  if (d.status === 'DISPONIVEL') {
    if (opcoes) {
      acoes.push(`
        <select class="filtro" data-receptora="${d.id}" style="font-size:12px;padding:6px 8px">${opcoes}</select>
        <button class="botao botao--pequeno" data-acao="manifestar" data-id="${d.id}">Manifestar interesse</button>`);
    }
    if (manifestacoes.length > 0) {
      acoes.push(`<button class="botao botao--pequeno botao--primario" data-acao="priorizar" data-id="${d.id}">Aplicar priorização (REQ08)</button>`);
    }
  }
  if (d.status === 'RESERVADA') {
    acoes.push(`<button class="botao botao--pequeno botao--primario" data-acao="retirar" data-id="${d.id}" data-qtd="${d.quantidadeEstimadaKg}">Confirmar retirada (REQ09)</button>`);
  }
  if (d.status !== 'RETIRADA' && d.status !== 'CANCELADA') {
    acoes.push(`<button class="botao botao--pequeno" data-acao="editar" data-id="${d.id}">Editar</button>`);
    acoes.push(`<button class="botao botao--pequeno" data-acao="cancelar" data-id="${d.id}">Cancelar</button>`);
  }
  if (d.status !== 'RETIRADA') {
    acoes.push(`<button class="botao botao--pequeno botao--perigo" data-acao="excluir" data-id="${d.id}">Excluir</button>`);
  }

  const registro = d.registroRetirada ? `
    <div class="doacao__meta" style="margin-top:8px">
      <strong>Registro de retirada #${d.registroRetirada.id}:</strong>
      ${Number(d.registroRetirada.quantidadeRetiradaKg).toFixed(2)} kg ·
      ${d.registroRetirada.refeicoesEquivalentes} refeições ·
      ${Number(d.registroRetirada.co2EvitadoKg).toFixed(2)} kg CO₂e · ${dataHora(d.registroRetirada.retiradoEm)}
    </div>` : '';

  return `
    <article class="doacao">
      <div class="doacao__topo">
        <div>
          <p class="doacao__titulo">#${d.id} · ${escapar(d.tipoAlimento)}</p>
          <p class="doacao__meta">${escapar(d.doador?.nome ?? '')} · ${escapar(d.descricao ?? 'sem descrição')}</p>
        </div>
        <span class="etiqueta etiqueta--${d.status}">${d.status}</span>
      </div>
      <div class="doacao__dados">
        <span>Quantidade<strong>${Number(d.quantidadeEstimadaKg).toFixed(2)} kg</strong></span>
        <span>Validade<strong>${dataHora(d.validadeAte)}</strong></span>
        <span>Retirar até<strong>${dataHora(d.horarioLimiteRetirada)}</strong></span>
        <span>Local<strong>${escapar(d.localRetirada)}</strong></span>
        <span>Reservada para<strong>${escapar(d.receptora?.nome ?? '—')}</strong></span>
      </div>
      ${listaManifestacoes}
      ${registro}
      <div class="doacao__acoes">${acoes.join('')}</div>
    </article>`;
}

/* --------------------------------------------- acoes dos cartoes de doacao */

document.getElementById('listaDoacoes').addEventListener('click', async (evento) => {
  const botao = evento.target.closest('button[data-acao]');
  if (!botao) return;

  const id = botao.dataset.id;
  const acao = botao.dataset.acao;

  try {
    if (acao === 'manifestar') {
      const seletor = document.querySelector(`select[data-receptora="${id}"]`);
      await chamar('POST', `/doacoes/${id}/manifestacoes`, { receptoraId: Number(seletor.value) });
      avisar('Interesse registrado. A doação segue disponível até a priorização.');
    }

    if (acao === 'priorizar') {
      const doacao = await chamar('POST', `/doacoes/${id}/priorizacao`);
      avisar(`Doação reservada para ${doacao.receptora?.nome ?? 'organização ' + doacao.receptoraId} (mais próxima).`);
    }

    if (acao === 'retirar') {
      const padrao = botao.dataset.qtd;
      const quantidade = prompt('Quantidade efetivamente retirada (kg):', padrao);
      if (quantidade === null) return;
      await chamar('POST', `/doacoes/${id}/retirada`, { quantidadeRetiradaKg: Number(quantidade) });
      avisar('Retirada confirmada e registro imutável gerado.');
    }

    if (acao === 'cancelar') {
      if (!confirm('Cancelar esta doação?')) return;
      await chamar('PATCH', `/doacoes/${id}/cancelamento`);
      avisar('Doação cancelada.');
    }

    if (acao === 'excluir') {
      if (!confirm('Excluir definitivamente esta doação?')) return;
      await chamar('DELETE', `/doacoes/${id}`);
      avisar('Doação excluída.');
    }

    if (acao === 'editar') {
      const doacao = await chamar('GET', `/doacoes/${id}`);
      preencherFormularioDoacao(doacao);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    await atualizarTudo();
  } catch (erro) {
    avisar(erro.message, true);
  }
});

function preencherFormularioDoacao(d) {
  document.getElementById('doacaoId').value = d.id;
  document.getElementById('doacaoDoador').value = d.doadorId;
  document.getElementById('doacaoDoador').disabled = true;
  document.getElementById('doacaoTipo').value = d.tipoAlimento;
  document.getElementById('doacaoDescricao').value = d.descricao ?? '';
  document.getElementById('doacaoQuantidade').value = d.quantidadeEstimadaKg;
  document.getElementById('doacaoValidade').value = paraInput(d.validadeAte);
  document.getElementById('doacaoLimite').value = paraInput(d.horarioLimiteRetirada);
  document.getElementById('doacaoLocal').value = d.localRetirada;
  document.getElementById('doacaoLat').value = d.latitude;
  document.getElementById('doacaoLon').value = d.longitude;

  document.getElementById('tituloFormDoacao').innerHTML = `Editar doação #${d.id} <small>(REQ10)</small>`;
  document.getElementById('btnSalvarDoacao').textContent = 'Salvar alterações';
  document.getElementById('btnCancelarEdicao').hidden = false;
}

function limparFormularioDoacao() {
  document.getElementById('formDoacao').reset();
  document.getElementById('doacaoId').value = '';
  document.getElementById('doacaoDoador').disabled = false;
  document.getElementById('tituloFormDoacao').innerHTML = 'Publicar doação <small>(REQ04)</small>';
  document.getElementById('btnSalvarDoacao').textContent = 'Publicar doação';
  document.getElementById('btnCancelarEdicao').hidden = true;
  preencherDatasPadrao();
}

document.getElementById('btnCancelarEdicao').addEventListener('click', limparFormularioDoacao);

document.getElementById('formDoacao').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const id = document.getElementById('doacaoId').value;

  const comum = {
    tipoAlimento: document.getElementById('doacaoTipo').value,
    descricao: document.getElementById('doacaoDescricao').value || undefined,
    quantidadeEstimadaKg: Number(document.getElementById('doacaoQuantidade').value),
    validadeAte: paraIso(document.getElementById('doacaoValidade').value),
    horarioLimiteRetirada: paraIso(document.getElementById('doacaoLimite').value),
    localRetirada: document.getElementById('doacaoLocal').value,
    latitude: Number(document.getElementById('doacaoLat').value),
    longitude: Number(document.getElementById('doacaoLon').value),
  };

  try {
    if (id) {
      await chamar('PATCH', `/doacoes/${id}`, comum);
      avisar(`Doação #${id} atualizada.`);
    } else {
      await chamar('POST', '/doacoes', {
        doadorId: Number(document.getElementById('doacaoDoador').value),
        ...comum,
      });
      avisar('Doação publicada e organizações compatíveis notificadas.');
    }
    limparFormularioDoacao();
    await atualizarTudo();
  } catch (erro) {
    avisar(erro.message, true);
  }
});

document.getElementById('filtroStatus').addEventListener('change', () => carregarDoacoes());

function preencherDatasPadrao() {
  const agora = Date.now();
  document.getElementById('doacaoValidade').value = paraInput(new Date(agora + 36e5 * 24));
  document.getElementById('doacaoLimite').value = paraInput(new Date(agora + 36e5 * 6));
  document.getElementById('doacaoLat').value = -23.4253;
  document.getElementById('doacaoLon').value = -51.9386;
}

/* ------------------------------------------------------------ DOADORES */

document.getElementById('formDoador').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  try {
    await chamar('POST', '/participantes/doadores', {
      nome: document.getElementById('doadorNome').value,
      cnpj: document.getElementById('doadorCnpj').value,
      email: document.getElementById('doadorEmail').value,
      telefone: document.getElementById('doadorTelefone').value,
      endereco: document.getElementById('doadorEndereco').value,
      categoriaEstabelecimento: document.getElementById('doadorCategoria').value,
      latitude: Number(document.getElementById('doadorLat').value),
      longitude: Number(document.getElementById('doadorLon').value),
    });
    evento.target.reset();
    avisar('Estabelecimento doador cadastrado.');
    await atualizarTudo();
  } catch (erro) {
    avisar(erro.message, true);
  }
});

async function carregarDoadores() {
  const doadores = await chamar('GET', '/participantes/doadores');
  document.getElementById('listaDoadores').innerHTML = doadores.length === 0
    ? '<p class="vazio">Nenhum doador cadastrado.</p>'
    : `<div class="rolavel"><table>
        <thead><tr><th>#</th><th>Nome</th><th>Categoria</th><th>CNPJ</th><th>Contato</th><th></th></tr></thead>
        <tbody>${doadores.map((d) => `
          <tr>
            <td>${d.id}</td>
            <td><strong>${escapar(d.nome)}</strong><br><span style="color:var(--cinza-600);font-size:12px">${escapar(d.endereco)}</span></td>
            <td>${escapar(d.categoriaEstabelecimento)}</td>
            <td>${escapar(d.cnpj)}</td>
            <td>${escapar(d.email)}<br><span style="color:var(--cinza-600);font-size:12px">${escapar(d.telefone)}</span></td>
            <td><button class="botao botao--pequeno botao--perigo" data-excluir-participante="${d.id}">Excluir</button></td>
          </tr>`).join('')}
        </tbody></table></div>`;
}

/* ---------------------------------------------------------- RECEPTORAS */

document.getElementById('formReceptora').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  try {
    await chamar('POST', '/participantes/receptoras', {
      nome: document.getElementById('receptoraNome').value,
      cnpj: document.getElementById('receptoraCnpj').value,
      email: document.getElementById('receptoraEmail').value,
      telefone: document.getElementById('receptoraTelefone').value,
      endereco: document.getElementById('receptoraEndereco').value,
      documentacaoComprobatoria: document.getElementById('receptoraDoc').value,
      capacidadeAtendimento: Number(document.getElementById('receptoraCapacidade').value),
      raioAtuacaoKm: Number(document.getElementById('receptoraRaio').value),
      latitude: Number(document.getElementById('receptoraLat').value),
      longitude: Number(document.getElementById('receptoraLon').value),
    });
    evento.target.reset();
    avisar('Organização cadastrada. Ela precisa ser validada para reivindicar doações (REQ03).');
    await atualizarTudo();
  } catch (erro) {
    avisar(erro.message, true);
  }
});

async function carregarReceptoras() {
  const receptoras = await chamar('GET', '/participantes/receptoras');
  document.getElementById('listaReceptoras').innerHTML = receptoras.length === 0
    ? '<p class="vazio">Nenhuma organização cadastrada.</p>'
    : `<div class="rolavel"><table>
        <thead><tr><th>#</th><th>Nome</th><th>Atendimento</th><th>Situação</th><th>Ações</th></tr></thead>
        <tbody>${receptoras.map((r) => `
          <tr>
            <td>${r.id}</td>
            <td><strong>${escapar(r.nome)}</strong><br><span style="color:var(--cinza-600);font-size:12px">${escapar(r.documentacaoComprobatoria ?? '')}</span></td>
            <td>${r.capacidadeAtendimento ?? 0} pessoas<br><span style="color:var(--cinza-600);font-size:12px">raio de ${r.raioAtuacaoKm ?? 0} km</span></td>
            <td><span class="etiqueta etiqueta--${r.validada ? 'sim' : 'nao'}">${r.validada ? 'VALIDADA' : 'PENDENTE'}</span></td>
            <td>
              <button class="botao botao--pequeno" data-validar="${r.id}" data-valor="${r.validada ? 'false' : 'true'}">
                ${r.validada ? 'Revogar' : 'Validar'}
              </button>
              <button class="botao botao--pequeno botao--perigo" data-excluir-participante="${r.id}">Excluir</button>
            </td>
          </tr>`).join('')}
        </tbody></table></div>`;
}

document.body.addEventListener('click', async (evento) => {
  const validar = evento.target.closest('button[data-validar]');
  const excluir = evento.target.closest('button[data-excluir-participante]');
  if (!validar && !excluir) return;

  try {
    if (validar) {
      await chamar('PATCH', `/participantes/receptoras/${validar.dataset.validar}/validacao`, {
        validada: validar.dataset.valor === 'true',
      });
      avisar('Situação da organização atualizada (REQ03).');
    }
    if (excluir) {
      if (!confirm('Excluir este participante? As doações vinculadas também serão removidas.')) return;
      await chamar('DELETE', `/participantes/${excluir.dataset.excluirParticipante}`);
      avisar('Participante excluído.');
    }
    await atualizarTudo();
  } catch (erro) {
    avisar(erro.message, true);
  }
});

/* -------------------------------------------------------- NOTIFICACOES */

async function carregarNotificacoes() {
  const notificacoes = await chamar('GET', '/notificacoes');
  document.getElementById('listaNotificacoes').innerHTML = notificacoes.length === 0
    ? '<p class="vazio">Nenhuma notificação enviada até o momento.</p>'
    : `<div class="rolavel"><table>
        <thead><tr><th>#</th><th>Organização</th><th>Mensagem</th><th>Distância</th><th>Enviada em</th></tr></thead>
        <tbody>${notificacoes.map((n) => `
          <tr>
            <td>${n.id}</td>
            <td>${escapar(n.receptora?.nome ?? 'Organização ' + n.receptoraId)}</td>
            <td>${escapar(n.mensagem)}</td>
            <td>${Number(n.distanciaKm).toFixed(2)} km</td>
            <td>${dataHora(n.enviadaEm)}</td>
          </tr>`).join('')}
        </tbody></table></div>`;
}

/* ---------------------------------------------------------------- carga */

async function atualizarTudo() {
  const aba = document.querySelector('.aba--ativa').dataset.aba;
  try {
    if (aba === 'painel') await carregarPainel();
    if (aba === 'doacoes') await carregarDoacoes();
    if (aba === 'doadores') await carregarDoadores();
    if (aba === 'receptoras') await carregarReceptoras();
    if (aba === 'notificacoes') await carregarNotificacoes();

    const status = document.getElementById('statusConexao');
    status.className = 'topo__status';
    status.innerHTML = '<span class="ponto"></span> Conectado ao PostgreSQL';
  } catch (erro) {
    const status = document.getElementById('statusConexao');
    status.className = 'topo__status topo__status--erro';
    status.innerHTML = '<span class="ponto"></span> Sem conexão com o banco';
    avisar(erro.message, true);
  }
}

preencherDatasPadrao();
atualizarTudo();
