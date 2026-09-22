// ==========================================================
// ESTADO GLOBAL E SELETORES DO DOM
// ==========================================================
// Guarda os dados carregados da API e a dados/filtros da agenda.
const estadoSistema = {
    alunos: [], professores: [], tipos: [], agendamentos: [], disponibilidades: [], bloqueios: [],
    dataAgenda: new Date(), filtroAgenda: ''
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ==========================================================
// FUNÇÕES UTILITÁRIAS
// ==========================================================
// Pequenas funções reutilizadas em várias telas.
function escaparHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function formatarData(value) {
    if (!value) return '—';
    const [y,m,d] = String(value).slice(0,10).split('-').map(Number);
    if (!y || !m || !d) return value;
    return new Intl.DateTimeFormat('pt-BR', {day:'2-digit', month:'2-digit', year:'numeric'}).format(new Date(y,m-1,d));
}
function formatarHora(value) { return value ? String(value).slice(0,5) : '—'; }
function chaveData(dados) { const y = dados.getFullYear(); const m = String(dados.getMonth()+1).padStart(2,'0'); const d = String(dados.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; }
function iniciais(name='') { return name.split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0]).join('').toUpperCase() || 'AG'; }
function normalizarStatus(status='') {
    return status === 'Agendado' ? 'Pendente' : status;
}
function classeStatus(status='') {
    const statusNormalizado = normalizarStatus(status);
    return ({'Pendente':'statusPendente','Confirmado':'statusConfirmado','Cancelado':'statusCancelado','Concluído':'statusConcluido'})[statusNormalizado] || 'statusPendente';
}
function mostrarAviso(titulo, mensagem, tipoAviso='sucesso') {
    $('#tituloAviso').textContent = titulo;
    $('#mensagemAviso').textContent = mensagem;
    $('#iconeAviso').textContent = tipoAviso === 'erro' ? '!' : '✓';
    $('#avisoFlutuante').classList.add('visivel');
    clearTimeout(mostrarAviso.timer); mostrarAviso.timer = setTimeout(() => $('#avisoFlutuante').classList.remove('visivel'), 3200);
}

// ==========================================================
// COMUNICAÇÃO COM A API
// ==========================================================
// Centraliza as requisições HTTP para o Flask.
async function api(url, opcoes={}) {
    const resposta = await fetch(url, {headers: {'Content-Type':'application/json', ...(opcoes.headers||{})}, ...opcoes});
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível concluir a operação.');
    return dados;
}

// ==========================================================
// NAVEGAÇÃO ENTRE TELAS
// ==========================================================
function navegarPara(secao) {
    $$('.secaoPagina').forEach(x => x.classList.remove('secaoAtiva'));
    $(`#${secao}`)?.classList.add('secaoAtiva');
    $$('.itemNavegacao').forEach(x => x.classList.toggle('ativo', x.dataset.secao === secao));
    history.replaceState(null, '', `#${secao}`);
    if (window.innerWidth <= 860) $('#barraLateral').classList.remove('abrir');
}

// ==========================================================
// CARREGAMENTO DOS DADOS
// ==========================================================
// Busca os recursos do sistema e atualiza o estado global.
async function carregarTodosDados() {
    try {
        const [alunos, professores, tipos, agendamentos, disponibilidades, bloqueios] = await Promise.all([
            api('/api/alunos'), api('/api/professores'), api('/api/tipos-atendimento'), api('/api/agendamentos'), api('/api/disponibilidades'), api('/api/bloqueios')
        ]);
        agendamentos.forEach(agendamento => { agendamento.status_agendamento = normalizarStatus(agendamento.status_agendamento); });
        Object.assign(estadoSistema, {alunos, professores, tipos, agendamentos, disponibilidades, bloqueios});
        renderizarTudo();
    } catch (erro) {
        mostrarAviso('Banco indisponível', erro.message, 'erro');
        renderizarTudo();
    }
}

// ==========================================================
// RENDERIZAÇÃO GERAL
// ==========================================================
function renderizarTudo() {
    renderizarPainel(); renderizarAlunos(); renderizarProfessores(); renderizarAgendamentos(); renderizarDisponibilidades(); renderizarBloqueios(); renderizarAgenda(); preencherSeletoresProfessores();
}

// ==========================================================
// DASHBOARD
// ==========================================================
function renderizarPainel() {
    const hoje = chaveData(new Date());
    const agendamentosHoje = estadoSistema.agendamentos.filter(a => String(a.data_agendamento).slice(0,10) === hoje);
    const obterStatus = agendamento => normalizarStatus(agendamento.status_agendamento);
    const confirmados = agendamentosHoje.filter(a => obterStatus(a) === 'Confirmado').length;
    $('#totalHoje').textContent = agendamentosHoje.length;
    $('#resumoHoje').textContent = agendamentosHoje.length ? `${agendamentosHoje.length} compromisso${agendamentosHoje.length > 1 ? 's' : ''}` : 'Nenhum agendamento';
    $('#totalProfessores').textContent = estadoSistema.professores.length;
    $('#totalAlunos').textContent = estadoSistema.alunos.length;
    $('#totalConfirmados').textContent = confirmados;
    $('#resumoConfirmados').textContent = `${agendamentosHoje.length} hoje`;

    const proximosAgendamentos = [...estadoSistema.agendamentos]
        .filter(a => String(a.data_agendamento).slice(0,10) >= hoje && obterStatus(a) !== 'Cancelado')
        .sort((a,b) => (`${a.data_agendamento} ${a.horario}`).localeCompare(`${b.data_agendamento} ${b.horario}`))
        .slice(0,6);
    $('#listaProximos').innerHTML = proximosAgendamentos.length ? proximosAgendamentos.map(a => `<div class="linhaAgendamento" data-id="${a.id_agendamento}">
        <div class="blocoHorario"><strong>${formatarHora(a.horario)}</strong><small>${formatarData(a.data_agendamento)}</small></div>
        <div class="conteudoAgendamento"><strong>${escaparHtml(a.nome_aluno)}</strong><small>${escaparHtml(a.nome_professor)}</small><span class="etiquetaTipo">${escaparHtml(a.nome_tipo_atendimento)}</span></div>
        <span class="etiquetaStatus ${classeStatus(a.status_agendamento)}">${escaparHtml(a.status_agendamento)}</span>
    </div>`).join('') : '<div class="estadoVazio">Nenhum atendimento futuro encontrado.</div>';

    const counts = {'Pendente':0,'Confirmado':0,'Cancelado':0,'Concluído':0};
    agendamentosHoje.forEach(a => {
        const status = obterStatus(a);
        if (counts[status] !== undefined) counts[status]++;
    });

    const total = agendamentosHoje.length;
    const coresGrafico = {
        'Pendente': 'var(--cor-grafico-pendente)',
        'Confirmado': 'var(--cor-grafico-confirmado)',
        'Cancelado': 'var(--cor-grafico-cancelado)',
        'Concluído': 'var(--cor-grafico-concluido)'
    };

    let acumulado = 0;
    const fatias = Object.entries(counts)
        .filter(([, quantidade]) => quantidade > 0)
        .map(([status, quantidade]) => {
            const inicio = acumulado;
            acumulado += (quantidade / total) * 100;
            return `${coresGrafico[status]} ${inicio}% ${acumulado}%`;
        });

    $('#graficoStatus').style.background = total
        ? `conic-gradient(${fatias.join(', ')})`
        : 'conic-gradient(var(--cor-grafico-vazio) 0 100%)';
    $('#legendaStatus').innerHTML = Object.entries(counts).map(([s,c]) => `<div class="itemLegenda"><span class="ladoLegenda"><i class="pontoLegenda" style="background:${coresGrafico[s]}"></i>${s}</span><strong>${c}</strong></div>`).join('');

    const quantidadePorProfessor = estadoSistema.professores.map(p => ({
        ...p,
        quantidade: estadoSistema.agendamentos.filter(a =>
            Number(a.id_professor) === Number(p.id_professor) && normalizarStatus(a.status_agendamento) !== 'Cancelado'
        ).length
    })).sort((a,b) => b.quantidade - a.quantidade).slice(0,5);
    const maximo = Math.max(...quantidadePorProfessor.map(x=>x.quantidade),1);
    $('#listaProfessores').innerHTML = quantidadePorProfessor.length ? quantidadePorProfessor.map(p => `<div class="linhaProfessor"><div class="avatar">${iniciais(p.nome_professor)}</div><div><strong>${escaparHtml(p.nome_professor)}</strong><div class="barraProfessor"><span style="width:${(p.quantidade/maximo)*100}%"></span></div><small>${p.quantidade} atendimento${p.quantidade===1?'':'s'}</small></div><div class="percentualProfessor">${Math.round((p.quantidade/maximo)*100)}%</div></div>`).join('') : '<div class="estadoVazio">Nenhum professor cadastrado.</div>';
}

// ==========================================================
// ALUNOS
// ==========================================================
function renderizarAlunos() {
    const busca = ($('#buscaAlunos')?.value || '').toLowerCase();
    const linhas = estadoSistema.alunos.filter(a => `${a.nome_aluno} ${a.matricula} ${a.curso}`.toLowerCase().includes(busca));
    $('#contagemAlunos').textContent = `${linhas.length} resultado${linhas.length !== 1 ? 's' : ''}`;
    $('#tabelaAlunos').innerHTML = linhas.length ? linhas.map(a => `<tr><td><strong>${escaparHtml(a.nome_aluno)}</strong><small>${escaparHtml(a.email)}</small></td><td>${escaparHtml(a.matricula)}</td><td><strong>${escaparHtml(a.curso)}</strong><small>${escaparHtml(a.turma)}</small></td><td>${escaparHtml(a.periodo)}</td><td>${escaparHtml(a.telefone)}</td><td><div class="acoesLinha"><button class="botaoAcao" onclick="abrirModalAluno(${a.id_aluno})">✎</button><button class="botaoAcao perigo" onclick="excluirRegistro('alunos',${a.id_aluno})">×</button></div></td></tr>`).join('') : '<tr><td colspan="6"><div class="estadoVazio">Nenhum aluno encontrado.</div></td></tr>';
}

// ==========================================================
// PROFESSORES
// ==========================================================
function renderizarProfessores() {
    $('#cartoesProfessores').innerHTML = estadoSistema.professores.length ? estadoSistema.professores.map(p => {
        const quantidade = estadoSistema.agendamentos.filter(a=>a.id_professor===p.id_professor).length;
        const ativo = estadoSistema.disponibilidades.filter(d => Number(d.id_professor) === Number(p.id_professor) && disponibilidadeEstaAtiva(d.ativo)).length;
        return `<article class="cartaoProfessor"><div class="topoProfessor"><div class="avatar">${iniciais(p.nome_professor)}</div><div><h3>${escaparHtml(p.nome_professor)}</h3><p>${escaparHtml(p.especialidade)}</p></div></div><div class="metaProfessor"><div class="caixaMeta"><span>Atendimentos</span><strong>${quantidade}</strong></div><div class="caixaMeta"><span>Disponibilidades</span><strong>${ativo}</strong></div></div><button class="acaoCartao" onclick="abrirModalProfessor(${p.id_professor})">Editar professor</button></article>`;
    }).join('') : '<div class="estadoVazio">Nenhum professor cadastrado.</div>';
}

// ==========================================================
// AGENDAMENTOS
// ==========================================================
function renderizarAgendamentos() {
    const busca = ($('#buscaAgendamentos')?.value || '').toLowerCase(); const status = $('#filtroStatus')?.value || '';
    const linhas = estadoSistema.agendamentos.filter(a => `${a.nome_aluno} ${a.nome_professor} ${a.nome_tipo_atendimento}`.toLowerCase().includes(busca) && (!status || a.status_agendamento===status));
    $('#tabelaAgendamentos').innerHTML = linhas.length ? linhas.map(a => `<tr><td><strong>${formatarData(a.data_agendamento)}</strong><small>${formatarHora(a.horario)}</small></td><td>${escaparHtml(a.nome_aluno)}</td><td>${escaparHtml(a.nome_professor)}</td><td>${escaparHtml(a.nome_tipo_atendimento)}</td><td><span class="etiquetaStatus ${classeStatus(a.status_agendamento)}">${escaparHtml(a.status_agendamento)}</span></td><td><div class="acoesLinha"><button class="botaoAcao" onclick="abrirModalAgendamento(${a.id_agendamento})">✎</button><button class="botaoAcao perigo" onclick="excluirRegistro('agendamentos',${a.id_agendamento})">×</button></div></td></tr>`).join('') : '<tr><td colspan="6"><div class="estadoVazio">Nenhum agendamento encontrado.</div></td></tr>';
}

function disponibilidadeEstaAtiva(value) {
    return value === true || value === 1 || value === '1' || value === 'true';
}

const ordemDiasDisponibilidade = {
    Segunda: 1, Terça: 2, Quarta: 3, Quinta: 4, Sexta: 5, Sábado: 6
};

// ==========================================================
// DISPONIBILIDADES DOS PROFESSORES
// ==========================================================
function renderizarDisponibilidades() {
    const agrupados = {};
    estadoSistema.disponibilidades.forEach(d => {
        (agrupados[d.id_professor] ||= []).push(d);
    });

    const cartoes = Object.entries(agrupados).map(([id, lista]) => {
        const ordenados = [...lista].sort((a, b) => {
            const diferencaDias = (ordemDiasDisponibilidade[a.dia_semana] || 99) - (ordemDiasDisponibilidade[b.dia_semana] || 99);
            if (diferencaDias !== 0) return diferencaDias;
            return formatarHora(a.horario_inicio).localeCompare(formatarHora(b.horario_inicio));
        });

        const idProfessor = Number(id);
        const nomeProfessor = ordenados[0]?.nome_professor || estadoSistema.professores.find(p => p.id_professor === idProfessor)?.nome_professor || 'Professor';

        return `<article class="cartaoDisponibilidade">
            <div class="cabecalhoCartaoDisponibilidade">
                <div><strong>${escaparHtml(nomeProfessor)}</strong><small class="contagemDisponibilidade">${ordenados.length} horário${ordenados.length !== 1 ? 's' : ''}</small></div>
                <button class="botaoAcao" title="Adicionar disponibilidade" onclick="abrirModalDisponibilidade(null, ${idProfessor})">＋</button>
            </div>
            <div class="listaDisponibilidade">
                ${ordenados.map(d => {
                    const ativo = disponibilidadeEstaAtiva(d.ativo);
                    return `<div class="linhaDisponibilidade ${ativo ? '' : 'inativo'}">
                        <div class="diaDisponibilidade">
                            <span>${escaparHtml(d.dia_semana)}</span>
                            <small class="statusDisponibilidade ${ativo ? 'ativo' : 'inativo'}">${ativo ? 'Ativo' : 'Inativo'}</small>
                        </div>
                        <strong>${formatarHora(d.horario_inicio)} — ${formatarHora(d.horario_fim)}</strong>
                        <div class="acoesLinha acoesDisponibilidade">
                            <button class="botaoAcao" title="Editar" onclick="abrirModalDisponibilidade(${d.id_disponibilidade})">✎</button>
                            <button class="botaoAcao perigo" title="Excluir" onclick="excluirRegistro('disponibilidades', ${d.id_disponibilidade})">×</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </article>`;
    });

    $('#cartoesDisponibilidade').innerHTML = cartoes.length ? cartoes.join('') : '<div class="estadoVazio">Nenhuma disponibilidade cadastrada.</div>';
}

// ==========================================================
// BLOQUEIOS DA AGENDA
// ==========================================================
function renderizarBloqueios() {
    $('#tabelaBloqueios').innerHTML = estadoSistema.bloqueios.length ? estadoSistema.bloqueios.map(b => `<tr><td>${escaparHtml(b.nome_professor)}</td><td>${formatarData(b.data_inicio)}</td><td>${formatarData(b.data_fim)}</td><td>${escaparHtml(b.motivo || 'Sem motivo')}</td><td><div class="acoesLinha"><button class="botaoAcao" onclick="abrirModalBloqueio(${b.id_bloqueio})">✎</button><button class="botaoAcao perigo" onclick="excluirRegistro('bloqueios',${b.id_bloqueio})">×</button></div></td></tr>`).join('') : '<tr><td colspan="5"><div class="estadoVazio">Nenhum bloqueio cadastrado.</div></td></tr>';
}

// ==========================================================
// CALENDÁRIO MENSAL
// ==========================================================
function obterDiasDoMes(ano, mes) {
    const primeiro = new Date(ano, mes, 1);
    const primeiroDiaSemana = primeiro.getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const diasMesAnterior = new Date(ano, mes, 0).getDate();
    const celulas = [];

    for (let i = 0; i < 42; i++) {
        const deslocamentoDia = i - primeiroDiaSemana + 1;
        let dataCelula;
        let noMesAtual = true;
        if (deslocamentoDia < 1) {
            dataCelula = new Date(ano, mes - 1, diasMesAnterior + deslocamentoDia);
            noMesAtual = false;
        } else if (deslocamentoDia > diasNoMes) {
            dataCelula = new Date(ano, mes + 1, deslocamentoDia - diasNoMes);
            noMesAtual = false;
        } else {
            dataCelula = new Date(ano, mes, deslocamentoDia);
        }
        celulas.push({dados: dataCelula, noMesAtual});
    }
    return celulas;
}

function quantidadeAgendamentosMes(chave) {
    return estadoSistema.agendamentos.filter(a => String(a.data_agendamento).slice(0,10) === chave && (!estadoSistema.filtroAgenda || String(a.id_professor) === String(estadoSistema.filtroAgenda))).length;
}

function obterMarcadoresDia(chave) {
    const eventos = estadoSistema.agendamentos.filter(a => String(a.data_agendamento).slice(0,10) === chave && (!estadoSistema.filtroAgenda || String(a.id_professor) === String(estadoSistema.filtroAgenda)));
    const ordem = ['Confirmado', 'Pendente', 'Concluído', 'Cancelado'];
    const presentes = ordem.filter(status => eventos.some(a => normalizarStatus(a.status_agendamento) === status));
    const marcadores = presentes.slice(0, 3).map(status => `<span class="marcadorDia ${status.toLowerCase().replace('í','i')}" title="${status}"></span>`).join('');
    return { quantidade: eventos.length, html: marcadores ? `<span class="marcadoresDia">${marcadores}</span>` : '<span class="marcadoresDia vazio"></span>' };
}

function renderizarCalendarioMensal() {
    const dados = estadoSistema.dataAgenda;
    const ano = dados.getFullYear();
    const mes = dados.getMonth();
    const chaveSelecionada = chaveData(dados);
    const chaveHoje = chaveData(new Date());
    const titulo = new Intl.DateTimeFormat('pt-BR', {month:'long', year:'numeric'}).format(dados);
    $('#tituloCalendarioMensal').textContent = titulo.charAt(0).toUpperCase() + titulo.slice(1);

    const celulas = obterDiasDoMes(ano, mes);
    $('#gradeCalendarioMensal').innerHTML = celulas.map(({dados: dataCelula, noMesAtual}) => {
        const chave = chaveData(dataCelula);
        const quantidade = quantidadeAgendamentosMes(chave);
        const selecionado = chave === chaveSelecionada;
        const hoje = chave === chaveHoje;
        const diaSemana = dataCelula.getDay();
        const classes = [
            'diaCalendario',
            noMesAtual ? 'mesAtual' : 'foraDoMes',
            selecionado ? 'selecionado' : '',
            hoje ? 'diaAtual' : '',
            diaSemana === 0 || diaSemana === 6 ? 'fimDeSemana' : ''
        ].filter(Boolean).join(' ');
        const dadosMarcadores = obterMarcadoresDia(chave);
        const textoQuantidade = dadosMarcadores.quantidade ? `<small>${dadosMarcadores.quantidade} ${dadosMarcadores.quantidade === 1 ? 'atendimento' : 'atendimentos'}</small>` : '<small class="diaCalendarioVazio">&nbsp;</small>';
        return `<button class="${classes}" type="button" onclick="selecionarDataAgenda('${chave}')"><span class="numeroDiaCalendario">${dataCelula.getDate()}</span>${dadosMarcadores.html}${textoQuantidade}</button>`;
    }).join('');
}

// ==========================================================
// AGENDA DIÁRIA
// ==========================================================
function renderizarAgenda() {
    const dados = estadoSistema.dataAgenda;
    const chave = chaveData(dados);
    const formatada = new Intl.DateTimeFormat('pt-BR',{weekday:'long', day:'2-digit', month:'long', year:'numeric'}).format(dados);
    $('#dataAgenda').textContent = formatada.charAt(0).toUpperCase() + formatada.slice(1);
    renderizarCalendarioMensal();

    const eventos = estadoSistema.agendamentos.filter(a => String(a.data_agendamento).slice(0,10) === chave && (!estadoSistema.filtroAgenda || String(a.id_professor) === String(estadoSistema.filtroAgenda)));
    $('#cabecalhoDia').innerHTML = `<strong>${new Intl.DateTimeFormat('pt-BR',{weekday:'long'}).format(dados).replace(/^./, c => c.toUpperCase())}</strong><span>${formatarData(chave)} • ${eventos.length} ${eventos.length === 1 ? 'atendimento' : 'atendimentos'}</span>`;

    const inicio = 7, fim = 20;
    let esquerda = '', direita = '';
    for(let h=inicio; h<fim; h++){ esquerda += `<div class="rotuloHorario">${String(h).padStart(2,'0')}:00</div>`; direita += `<div class="faixaHorario"></div>`; }
    const htmlEventos = eventos.map(a=>{
        const minutos = Number(String(a.horario).slice(3,5))||0;
        const h = Number(String(a.horario).slice(0,2));
        const inicio = 7;
        const topo = ((h-inicio)*70) + (minutos/60*70);
        return `<button type="button" class="eventoAgenda" style="top:${topo}px" onclick="abrirModalAgendamento(${a.id_agendamento})"><strong>${formatarHora(a.horario)} • ${escaparHtml(a.nome_aluno)}</strong><small>${escaparHtml(a.nome_tipo_atendimento)} · ${escaparHtml(a.nome_professor)}</small><span class="etiquetaStatus ${classeStatus(a.status_agendamento)}">${escaparHtml(a.status_agendamento)}</span></button>`;
    }).join('');
    $('#gradeHorarios').innerHTML = `<div class="colunaHorarios">${esquerda}</div><div class="areaHorarios">${direita}${htmlEventos}</div>`;

    const resumo = {
        total: eventos.length,
        confirmados: eventos.filter(a=>a.status_agendamento==='Confirmado').length,
        pendentes: eventos.filter(a=>a.status_agendamento==='Pendente').length,
        cancelados: eventos.filter(a=>a.status_agendamento==='Cancelado').length,
        concluidos: eventos.filter(a=>a.status_agendamento==='Concluído').length
    };
    $('#resumoDia').innerHTML = `<div class="linhaResumo"><span>Total</span><strong>${resumo.total}</strong></div><div class="linhaResumo"><span>Confirmados</span><strong>${resumo.confirmados}</strong></div><div class="linhaResumo"><span>Pendentes</span><strong>${resumo.pendentes}</strong></div><div class="linhaResumo"><span>Concluídos</span><strong>${resumo.concluidos}</strong></div><div class="linhaResumo"><span>Cancelados</span><strong>${resumo.cancelados}</strong></div>`;
}

window.selecionarDataAgenda = function(chave) {
    const [y,m,d] = chave.split('-').map(Number);
    estadoSistema.dataAgenda = new Date(y, m-1, d);
    renderizarAgenda();
};

// ==========================================================
// FORMULÁRIOS E MODAIS
// ==========================================================
function preencherSeletoresProfessores(){
    const opcoes = '<option value="">Todos os professores</option>' + estadoSistema.professores.map(p=>`<option value="${p.id_professor}">${escaparHtml(p.nome_professor)}</option>`).join('');
    $('#filtroProfessorAgenda').innerHTML = opcoes;
}

function abrirModal(conteudo){ $('#corpoModal').innerHTML = conteudo; $('#fundoModal').classList.add('abrir'); }
function fecharModal(){ $('#fundoModal').classList.remove('abrir'); }
$('#fecharModal').addEventListener('click', fecharModal); $('#fundoModal').addEventListener('click', e => { if(e.target === $('#fundoModal')) fecharModal(); });

function formularioBase(titulo, subtitulo, camposHtml, aoEnviar){
    abrirModal(`<h2 class="tituloModal">${titulo}</h2><p class="subtituloModal">${subtitulo}</p><form id="formularioDinamico"><div class="gradeFormulario">${camposHtml}</div><div class="acoesFormulario"><button type="button" class="botaoContorno" onclick="fecharModal()">Cancelar</button><button class="botaoPrincipal" type="submit">Salvar</button></div></form>`);
    $('#formularioDinamico').addEventListener('submit', async e => { e.preventDefault(); try { await aoEnviar(new FormData(e.target)); fecharModal(); await carregarTodosDados(); mostrarAviso('Tudo certo','Alterações salvas com sucesso.'); } catch(err){ mostrarAviso('Não foi possível salvar',err.message,'erro'); } });
}

window.abrirModalAluno = function(id=null){
    const a = id ? estadoSistema.alunos.find(x=>x.id_aluno===id) : {};
    formularioBase(id?'Editar aluno':'Novo aluno','Cadastre os dados básicos e o consentimento LGPD.',`
        <div class="grupoFormulario completo"><label>Nome completo</label><input name="nome_aluno" value="${escaparHtml(a.nome_aluno||'')}" required></div>
        <div class="grupoFormulario"><label>Matrícula</label><input name="matricula" value="${escaparHtml(a.matricula||'')}" required></div>
        <div class="grupoFormulario"><label>E-mail</label><input type="email" name="email" value="${escaparHtml(a.email||'')}" required></div>
        <div class="grupoFormulario"><label>Telefone</label><input name="telefone" value="${escaparHtml(a.telefone||'')}" required></div>
        <div class="grupoFormulario"><label>Curso</label><input name="curso" value="${escaparHtml(a.curso||'')}" required></div>
        <div class="grupoFormulario"><label>Turma</label><input name="turma" value="${escaparHtml(a.turma||'')}" required></div>
        <div class="grupoFormulario"><label>Período</label><input name="periodo" value="${escaparHtml(a.periodo||'')}" required></div>
        <div class="grupoFormulario completo">
            <label class="campoCaixaSelecao ${a.consentimento_lgpd ? 'marcado' : ''}">
                <input type="checkbox" name="consentimento_lgpd" value="1" ${a.consentimento_lgpd ? 'checked' : ''}>
                <span class="marcaSelecao" aria-hidden="true">✓</span>
                <span><strong>Consentimento LGPD</strong><small>Autorizo o tratamento dos dados pessoais do aluno para cadastro e gestão de agendamentos.</small></span>
            </label>
        </div>`, async fd => {
        const dadosEnvio = Object.fromEntries(fd); dadosEnvio.consentimento_lgpd = fd.get('consentimento_lgpd') === '1'; dadosEnvio.data_consentimento = dadosEnvio.consentimento_lgpd ? new Date().toISOString().slice(0,19).replace('T',' ') : null;
        await api(id?`/api/alunos/${id}`:'/api/alunos',{method:id?'PUT':'POST',body:JSON.stringify(dadosEnvio)});
    });
};

window.abrirModalProfessor = function(id=null){
    const p = id ? estadoSistema.professores.find(x=>x.id_professor===id) : {};
    formularioBase(id?'Editar professor':'Novo professor','Cadastre um professor e sua especialidade.',`
        <div class="grupoFormulario completo"><label>Nome</label><input name="nome_professor" value="${escaparHtml(p.nome_professor||'')}" required></div>
        <div class="grupoFormulario"><label>E-mail</label><input type="email" name="email" value="${escaparHtml(p.email||'')}" required></div>
        <div class="grupoFormulario"><label>Especialidade</label><input name="especialidade" value="${escaparHtml(p.especialidade||'')}" required></div>`, async fd => api(id?`/api/professores/${id}`:'/api/professores',{method:id?'PUT':'POST',body:JSON.stringify(Object.fromEntries(fd))}));
};

window.abrirModalAgendamento = function(id=null){
    const a = id ? estadoSistema.agendamentos.find(x=>x.id_agendamento===id) : {};
    const opcoesProfessores = estadoSistema.professores.map(p=>`<option value="${p.id_professor}" ${String(a.id_professor)===String(p.id_professor)?'selected':''}>${escaparHtml(p.nome_professor)}</option>`).join('');
    const opcoesAlunos = estadoSistema.alunos.map(s=>`<option value="${s.id_aluno}" ${String(a.id_aluno)===String(s.id_aluno)?'selected':''}>${escaparHtml(s.nome_aluno)}</option>`).join('');
    const opcoesTipos = estadoSistema.tipos.map(t=>`<option value="${t.id_tipo_atendimento}" ${String(a.id_tipo_atendimento)===String(t.id_tipo_atendimento)?'selected':''}>${escaparHtml(t.nome_tipo_atendimento)} · ${t.duracao_minutos} min</option>`).join('');
    const dataPadrao = a.data_agendamento ? String(a.data_agendamento).slice(0,10) : chaveData(new Date());
    formularioBase(id?'Editar agendamento':'Novo agendamento','Reserve um horário sem conflito de professor ou aluno.',`
        <div class="grupoFormulario"><label>Aluno</label><select name="id_aluno" required>${opcoesAlunos}</select></div>
        <div class="grupoFormulario"><label>Professor</label><select name="id_professor" required>${opcoesProfessores}</select></div>
        <div class="grupoFormulario"><label>Tipo de atendimento</label><select name="id_tipo_atendimento" required>${opcoesTipos}</select></div>
        <div class="grupoFormulario"><label>Data</label><input type="date" name="data_agendamento" value="${dataPadrao}" required></div>
        <div class="grupoFormulario"><label>Horário</label><input type="time" name="horario" value="${formatarHora(a.horario==='—'?'':a.horario)}" required></div>
        <div class="grupoFormulario"><label>Status</label><select name="status_agendamento"><option>Pendente</option><option ${a.status_agendamento==='Confirmado'?'selected':''}>Confirmado</option><option ${a.status_agendamento==='Cancelado'?'selected':''}>Cancelado</option><option ${a.status_agendamento==='Concluído'?'selected':''}>Concluído</option></select></div>
        <div class="grupoFormulario completo"><label>Motivo</label><textarea name="motivo" required>${escaparHtml(a.motivo||'')}</textarea></div>`, async fd => { const dadosEnvio=Object.fromEntries(fd); dadosEnvio.id_aluno=Number(dadosEnvio.id_aluno); dadosEnvio.id_professor=Number(dadosEnvio.id_professor); dadosEnvio.id_tipo_atendimento=Number(dadosEnvio.id_tipo_atendimento); await api(id?`/api/agendamentos/${id}`:'/api/agendamentos',{method:id?'PUT':'POST',body:JSON.stringify(dadosEnvio)}); });
};

window.abrirModalDisponibilidade = function(id=null, idProfessor=null){
    const d = id ? estadoSistema.disponibilidades.find(x=>Number(x.id_disponibilidade)===Number(id)) : {};
    const professorSelecionado = id ? d.id_professor : idProfessor;
    const ativo = disponibilidadeEstaAtiva(d.ativo);
    const opcoes = estadoSistema.professores.map(p=>`<option value="${p.id_professor}" ${String(professorSelecionado)===String(p.id_professor)?'selected':''}>${escaparHtml(p.nome_professor)}</option>`).join('');

    formularioBase(id?'Editar disponibilidade':'Nova disponibilidade','Defina um período de atendimento recorrente.',`
        <div class="grupoFormulario completo"><label>Professor</label><select name="id_professor" required>${opcoes}</select></div>
        <div class="grupoFormulario"><label>Dia da semana</label><select name="dia_semana" required>${['Segunda','Terça','Quarta','Quinta','Sexta','Sábado'].map(x=>`<option ${d.dia_semana===x?'selected':''}>${x}</option>`).join('')}</select></div>
        <div class="grupoFormulario"><label>Início</label><input type="time" name="horario_inicio" value="${formatarHora(d.horario_inicio||'08:00')}" required></div>
        <div class="grupoFormulario"><label>Fim</label><input type="time" name="horario_fim" value="${formatarHora(d.horario_fim||'17:00')}" required></div>
        <div class="grupoFormulario completo"><label>Disponibilidade</label><label class="campoCaixaSelecao ${ativo || !id ? 'marcado' : ''}"><input type="checkbox" name="ativo" value="1" ${ativo || !id ? 'checked' : ''}><span class="marcaSelecao" aria-hidden="true">✓</span><span><strong>Horário ativo</strong><small>Desmarque para manter o horário cadastrado sem disponibilizá-lo para novos agendamentos.</small></span></label></div>`, async fd => {
        const dadosEnvio = Object.fromEntries(fd);
        dadosEnvio.id_professor = Number(dadosEnvio.id_professor);
        dadosEnvio.horario_inicio = String(dadosEnvio.horario_inicio || '').slice(0,5);
        dadosEnvio.horario_fim = String(dadosEnvio.horario_fim || '').slice(0,5);
        dadosEnvio.ativo = fd.get('ativo') === '1';

        if (!dadosEnvio.horario_inicio || !dadosEnvio.horario_fim) throw new Error('Informe o horário inicial e final.');
        if (dadosEnvio.horario_fim <= dadosEnvio.horario_inicio) throw new Error('O horário final deve ser maior que o horário inicial.');

        await api(id?`/api/disponibilidades/${id}`:'/api/disponibilidades',{method:id?'PUT':'POST',body:JSON.stringify(dadosEnvio)});
    });
};

window.abrirModalBloqueio = function(id=null){
    const b=id?estadoSistema.bloqueios.find(x=>x.id_bloqueio===id):{}; const opcoes=estadoSistema.professores.map(p=>`<option value="${p.id_professor}" ${String(b.id_professor)===String(p.id_professor)?'selected':''}>${escaparHtml(p.nome_professor)}</option>`).join('');
    formularioBase(id?'Editar bloqueio':'Novo bloqueio','Marque férias ou períodos indisponíveis.',`
        <div class="grupoFormulario completo"><label>Professor</label><select name="id_professor" required>${opcoes}</select></div>
        <div class="grupoFormulario"><label>Data de início</label><input type="date" name="data_inicio" value="${String(b.data_inicio||'').slice(0,10)}" required></div>
        <div class="grupoFormulario"><label>Data de fim</label><input type="date" name="data_fim" value="${String(b.data_fim||'').slice(0,10)}" required></div>
        <div class="grupoFormulario completo"><label>Motivo</label><input name="motivo" value="${escaparHtml(b.motivo||'')}" placeholder="Ex.: Férias, reunião, evento..."></div>`, async fd=>{const dadosEnvio=Object.fromEntries(fd); dadosEnvio.id_professor=Number(dadosEnvio.id_professor); await api(id?`/api/bloqueios/${id}`:'/api/bloqueios',{method:id?'PUT':'POST',body:JSON.stringify(dadosEnvio)});});
};

window.excluirRegistro = async function(resource, id){
    const mensagem = resource === 'alunos'
        ? 'Este aluno e os agendamentos vinculados poderão ser removidos. Deseja continuar?'
        : 'Tem certeza que deseja excluir este registro?';
    if (!confirm(mensagem)) return;
    try {
        await api(`/api/${resource}/${id}`, {method: 'DELETE'});
        await carregarTodosDados();
        mostrarAviso('Registro excluído', 'O item foi removido com sucesso.');
    } catch (erro) {
        mostrarAviso('Exclusão bloqueada', erro.message, 'erro');
    }
};

$('#novoAluno').addEventListener('click',()=>abrirModalAluno());
$('#novoProfessor').addEventListener('click',()=>abrirModalProfessor());
$('#novoAgendamento').addEventListener('click',()=>abrirModalAgendamento());
$('#novoAgendamentoAgenda').addEventListener('click',()=>abrirModalAgendamento());
$('#novaDisponibilidade').addEventListener('click',()=>abrirModalDisponibilidade());
$('#novoBloqueio').addEventListener('click',()=>abrirModalBloqueio());
$('#agendamentoRapido').addEventListener('click',()=>abrirModalAgendamento());
$('#botaoEncontrarHorario').addEventListener('click',()=>abrirModalAgendamento());

$$('.itemNavegacao').forEach(btn=>btn.addEventListener('click',()=>navegarPara(btn.dataset.secao)));
$$('[data-link-secao]').forEach(btn=>btn.addEventListener('click',()=>navegarPara(btn.dataset.linkSecao)));
$('#alternarMenuMobile').addEventListener('click',()=>$('#barraLateral').classList.toggle('abrir'));
// ==========================================================
// MENU DO PERFIL E CONSENTIMENTO LGPD
// ==========================================================
const botaoMenuPerfil = $('#botaoMenuPerfil');
const menuPerfil = $('#menuPerfil');
const mostrarConsentimentoLgpd = $('#mostrarConsentimentoLgpd');

function fecharMenuPerfil() {
    menuPerfil?.classList.remove('abrir');
    menuPerfil?.setAttribute('aria-hidden', 'true');
    botaoMenuPerfil?.setAttribute('aria-expanded', 'false');
}

botaoMenuPerfil?.addEventListener('click', (event) => {
    event.stopPropagation();
    const abrir = !menuPerfil.classList.contains('abrir');
    menuPerfil.classList.toggle('abrir', abrir);
    menuPerfil.setAttribute('aria-hidden', String(!abrir));
    botaoMenuPerfil.setAttribute('aria-expanded', String(abrir));
});

document.addEventListener('click', (event) => {
    if (menuPerfil?.classList.contains('abrir') && !menuPerfil.contains(event.target) && event.target !== botaoMenuPerfil) {
        fecharMenuPerfil();
    }
});

mostrarConsentimentoLgpd?.addEventListener('click', () => {
    fecharMenuPerfil();
    abrirConsentimentoParaRevisao();
});
$('#botaoAtualizar').addEventListener('click', async()=>{ await carregarTodosDados(); mostrarAviso('Dados atualizados','As informações foram recarregadas.'); });
$('#buscaAlunos').addEventListener('input',renderizarAlunos); $('#buscaAgendamentos').addEventListener('input',renderizarAgendamentos); $('#filtroStatus').addEventListener('change',renderizarAgendamentos);
$('#filtroProfessorAgenda').addEventListener('change',e=>{estadoSistema.filtroAgenda=e.target.value;renderizarAgenda();});
$('#diaAnterior').addEventListener('click',()=>{estadoSistema.dataAgenda.setDate(estadoSistema.dataAgenda.getDate()-1);renderizarAgenda();});
$('#proximoDia').addEventListener('click',()=>{estadoSistema.dataAgenda.setDate(estadoSistema.dataAgenda.getDate()+1);renderizarAgenda();});
$('#botaoHoje').addEventListener('click',()=>{estadoSistema.dataAgenda=new Date();renderizarAgenda();});
$('#mesAnterior').addEventListener('click',()=>{estadoSistema.dataAgenda = new Date(estadoSistema.dataAgenda.getFullYear(), estadoSistema.dataAgenda.getMonth()-1, 1); renderizarAgenda();});
$('#proximoMes').addEventListener('click',()=>{estadoSistema.dataAgenda = new Date(estadoSistema.dataAgenda.getFullYear(), estadoSistema.dataAgenda.getMonth()+1, 1); renderizarAgenda();});
// Busca geral: pesquisa enquanto o usuário digita e permite abrir o resultado diretamente.
function configurarBuscaGeral() {
    const campo = $('#buscaGeral');
    const lista = $('#resultadosBuscaGeral');
    if (!campo || !lista) return;

    const textoSeguro = valor => String(valor ?? '').toLowerCase();

    function obterResultados(consulta) {
        const termo = textoSeguro(consulta).trim();
        if (!termo) return [];
        const resultados = [];

        estadoSistema.alunos.forEach(aluno => {
            const nome = textoSeguro(aluno.nome_aluno);
            const matricula = textoSeguro(aluno.matricula);
            const curso = textoSeguro(aluno.curso);
            if (`${nome} ${matricula} ${curso}`.includes(termo)) {
                resultados.push({tipo:'Aluno', nome:aluno.nome_aluno, detalhe:aluno.matricula || aluno.curso || '', secao:'alunos', busca:termo});
            }
        });

        estadoSistema.professores.forEach(professor => {
            const nome = textoSeguro(professor.nome_professor);
            const especialidade = textoSeguro(professor.especialidade);
            if (`${nome} ${especialidade}`.includes(termo)) {
                resultados.push({tipo:'Professor', nome:professor.nome_professor, detalhe:professor.especialidade || '', secao:'professores', busca:''});
            }
        });

        estadoSistema.agendamentos.forEach(agendamento => {
            const texto = `${textoSeguro(agendamento.nome_aluno)} ${textoSeguro(agendamento.nome_professor)} ${textoSeguro(agendamento.nome_tipo_atendimento)} ${textoSeguro(agendamento.data_agendamento)}`;
            if (texto.includes(termo)) {
                resultados.push({tipo:'Agendamento', nome:agendamento.nome_aluno || 'Agendamento', detalhe:`${agendamento.nome_professor || ''} • ${formatarData(agendamento.data_agendamento)} • ${formatarHora(agendamento.horario)}`, secao:'atendimentos', busca:termo});
            }
        });

        return resultados.slice(0, 8);
    }

    function esconderResultados() {
        lista.hidden = true;
        lista.innerHTML = '';
    }

    function mostrarResultados() {
        const resultados = obterResultados(campo.value);
        if (!campo.value.trim()) return esconderResultados();
        lista.hidden = false;
        lista.innerHTML = resultados.length
            ? resultados.map((resultado, indice) => `<button type="button" class="resultadoBuscaItem" data-indice="${indice}"><span class="resultadoBuscaTipo">${escaparHtml(resultado.tipo)}</span><span><strong class="resultadoBuscaNome">${escaparHtml(resultado.nome)}</strong><small class="resultadoBuscaDetalhe">${escaparHtml(resultado.detalhe)}</small></span></button>`).join('')
            : '<div class="resultadoBuscaVazio">Nenhum resultado encontrado.</div>';
        lista.querySelectorAll('.resultadoBuscaItem').forEach(botao => botao.addEventListener('click', () => {
            const resultado = resultados[Number(botao.dataset.indice)];
            if (!resultado) return;
            campo.value = '';
            esconderResultados();
            navegarPara(resultado.secao);
            if (resultado.secao === 'alunos') {
                $('#buscaAlunos').value = resultado.busca;
                renderizarAlunos();
            } else if (resultado.secao === 'atendimentos') {
                $('#buscaAgendamentos').value = resultado.busca;
                renderizarAgendamentos();
            }
        }));
    }

    campo.addEventListener('input', mostrarResultados);
    campo.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        const primeiro = lista.querySelector('.resultadoBuscaItem');
        if (primeiro) primeiro.click();
        else if (campo.value.trim()) mostrarAviso('Busca', 'Nenhum resultado encontrado.', 'erro');
    });
    campo.addEventListener('focus', () => { if (campo.value.trim()) mostrarResultados(); });
    document.addEventListener('click', event => {
        if (!campo.closest('.campoBusca')?.contains(event.target)) esconderResultados();
    });
}

configurarBuscaGeral();



// ==========================================================
// MODO CLARO / ESCURO
// ==========================================================
function configurarTema() {
    const raiz = document.documentElement;
    const botaoTema = document.getElementById('alternarTema');
    const chave = 'aga_theme';

    const salvo = localStorage.getItem(chave);
    const preferenciaEscura = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const escuro = salvo ? salvo === 'escuro' : preferenciaEscura;

    raiz.classList.toggle('modoEscuro', escuro);
    atualizarBotaoTema(escuro);

    botaoTema?.addEventListener('click', () => {
        const proximoModoEscuro = !raiz.classList.contains('modoEscuro');
        raiz.classList.toggle('modoEscuro', proximoModoEscuro);
        localStorage.setItem(chave, proximoModoEscuro ? 'escuro' : 'claro');
        atualizarBotaoTema(proximoModoEscuro);
    });
}

function atualizarBotaoTema(escuro) {
    const botaoTema = document.getElementById('alternarTema');
    if (!botaoTema) return;
    botaoTema.textContent = escuro ? '☀' : '☾';
    botaoTema.title = escuro ? 'Ativar modo claro' : 'Ativar modo escuro';
    botaoTema.setAttribute('aria-label', botaoTema.title);
}

// ==========================================================
// REVISÃO DO CONSENTIMENTO LGPD
// ==========================================================
function abrirConsentimentoParaRevisao() {
    const fundo = $('#fundoConsentimento');
    const caixaSelecao = $('#caixaConsentimentoInicial');
    const botaoTema = $('#aceitarConsentimento');
    if (!fundo || !caixaSelecao || !botaoTema) return;

    caixaSelecao.checked = false;
    botaoTema.disabled = true;
    fundo.classList.add('abrir');
    fundo.setAttribute('aria-hidden', 'false');
    document.body.classList.add('iconeConsentimento');
}

// ==========================================================
// CONSENTIMENTO NO PRIMEIRO ACESSO
// ==========================================================
function configurarConsentimentoInicial() {
    const fundo = $('#fundoConsentimento');
    const caixaSelecao = $('#caixaConsentimentoInicial');
    const botaoTema = $('#aceitarConsentimento');
    const chaveConsentimento = 'aga_initial_consent_v1';

    caixaSelecao?.addEventListener('change', () => {
        botaoTema.disabled = !caixaSelecao.checked;
    });

    botaoTema?.addEventListener('click', () => {
        if (!caixaSelecao.checked) return;
        localStorage.setItem(chaveConsentimento, 'accepted');
        fundo.classList.remove('abrir');
        fundo.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('iconeConsentimento');
        mostrarAviso('Consentimento registrado', 'Sua confirmação foi registrada novamente.');
    });

    if (localStorage.getItem(chaveConsentimento) !== 'accepted') {
        abrirConsentimentoParaRevisao();
    } else {
        fundo.classList.remove('abrir');
        fundo.setAttribute('aria-hidden', 'true');
    }
}

const hash = location.hash.replace('#',''); if(hash && document.getElementById(hash)) navegarPara(hash);
configurarTema();
configurarConsentimentoInicial();
carregarTodosDados();
