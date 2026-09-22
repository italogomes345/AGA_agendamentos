from main import app
import main
from flask import render_template, request


# ==========================================================
# ARQUITETURA DAS ROTAS
# ==========================================================
# Este arquivo concentra as páginas e as APIs REST do sistema.
# Cada recurso possui operações de CRUD: criar, listar, consultar,
# atualizar e excluir.

# ==========================================================
# ROTA PRINCIPAL
# ==========================================================

@app.route("/")
def pagina_inicial():
    return render_template("pagina_inicial.html")


# ==========================================================
# FUNÇÕES AUXILIARES DAS ROTAS
# ==========================================================

def resposta_erro(erro, mensagem="Falha ao processar a solicitação"):
    print(f"{mensagem}: {erro}")
    return {"erro": mensagem}, 500


def normalizar_booleano(valor):
    if isinstance(valor, bool):
        return valor
    if isinstance(valor, (int, float)):
        return valor != 0
    return str(valor).strip().lower() in {"1", "true", "sim", "yes", "on"}


STATUS_AGENDAMENTO_VALIDOS = {"Pendente", "Confirmado", "Cancelado", "Concluído"}

def normalizar_status_agendamento(valor):
    status = str(valor or "Pendente").strip()
    if status == "Agendado":
        status = "Pendente"
    if status not in STATUS_AGENDAMENTO_VALIDOS:
        raise ValueError("Status de agendamento inválido")
    return status


# ==========================================================
# ALUNOS
# ==========================================================

# CREATE — cadastra um novo aluno
@app.route("/api/alunos", methods=["POST"])
def cadastrar_aluno():
    dados = request.get_json(silent=True) or {}

    campos = [
        "nome_aluno",
        "matricula",
        "email",
        "telefone",
        "curso",
        "turma",
        "periodo",
        "consentimento_lgpd",
        "data_consentimento"
    ]

    valores = tuple(dados.get(campo) for campo in campos)

    if any(valor is None for valor in valores):
        return {"erro": "Todos os campos são obrigatórios"}, 400

    sql = main.montar_insercao("alunos", campos)

    try:
        main.executar_comando_sql(sql, valores)
        return {"mensagem": "Aluno cadastrado com sucesso"}, 201
    except Exception as erro:
        return resposta_erro(erro, "Falha ao cadastrar aluno")


# READ — lista todos os alunos
@app.route("/api/alunos", methods=["GET"])
def listar_alunos():
    sql = """
        SELECT *
        FROM alunos
        ORDER BY id_aluno
    """

    try:
        resultados = main.consultar_todos_sql(sql)
        return resultados, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao listar alunos")


# READ — consulta um aluno pelo ID
@app.route("/api/alunos/<int:id_aluno>", methods=["GET"])
def consultar_aluno(id_aluno):
    sql = """
        SELECT *
        FROM alunos
        WHERE id_aluno = %s
    """

    try:
        resultado = main.consultar_um_sql(sql, (id_aluno,))

        if not resultado:
            return {"erro": "Aluno não encontrado"}, 404

        return resultado, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao consultar aluno")


# UPDATE — atualiza os dados de um aluno
@app.route("/api/alunos/<int:id_aluno>", methods=["PUT"])
def atualizar_aluno(id_aluno):
    dados = request.get_json(silent=True) or {}

    campos = [
        "nome_aluno",
        "matricula",
        "email",
        "telefone",
        "curso",
        "turma",
        "periodo",
        "consentimento_lgpd",
        "data_consentimento"
    ]

    if not all(campo in dados for campo in campos):
        return {"erro": "Informe todos os campos do aluno"}, 400

    sql = """
        UPDATE alunos
        SET nome_aluno = %s,
            matricula = %s,
            email = %s,
            telefone = %s,
            curso = %s,
            turma = %s,
            periodo = %s,
            consentimento_lgpd = %s,
            data_consentimento = %s
        WHERE id_aluno = %s
    """

    valores = tuple(dados[campo] for campo in campos) + (id_aluno,)

    try:
        resultado = main.consultar_um_sql(
            "SELECT id_aluno FROM alunos WHERE id_aluno = %s",
            (id_aluno,)
        )

        if not resultado:
            return {"erro": "Aluno não encontrado"}, 404

        main.executar_comando_sql(sql, valores)
        return {"mensagem": "Aluno atualizado com sucesso"}, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao atualizar aluno")


# DELETE — exclui um aluno
@app.route("/api/alunos/<int:id_aluno>", methods=["DELETE"])
def excluir_aluno(id_aluno):
    try:
        resultado = main.consultar_um_sql(
            "SELECT id_aluno FROM alunos WHERE id_aluno = %s",
            (id_aluno,)
        )

        if not resultado:
            return {"erro": "Aluno não encontrado"}, 404

        # O aluno possui uma chave estrangeira nos agendamentos.
        # Removemos primeiro os vínculos e depois o cadastro do aluno,
        # tudo na mesma transação para evitar banco em estado parcial.
        main.executar_transacao_sql([
            ("DELETE FROM agendamento WHERE id_aluno = %s", (id_aluno,)),
            ("DELETE FROM alunos WHERE id_aluno = %s", (id_aluno,))
        ])

        return {"mensagem": "Aluno e agendamentos vinculados foram excluídos com sucesso"}, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao excluir aluno")


# ==========================================================
# PROFESSORES
# ==========================================================

# CREATE — cadastra um professor
@app.route("/api/professores", methods=["POST"])
def cadastrar_professor():
    dados = request.get_json(silent=True) or {}

    campos = [
        "nome_professor",
        "email",
        "especialidade"
    ]

    if not all(campo in dados for campo in campos):
        return {"erro": "Todos os campos são obrigatórios"}, 400

    valores = tuple(dados[campo] for campo in campos)
    sql = main.montar_insercao("professores", campos)

    try:
        main.executar_comando_sql(sql, valores)
        return {"mensagem": "Professor cadastrado com sucesso"}, 201
    except Exception as erro:
        return resposta_erro(erro, "Falha ao cadastrar professor")


# READ — lista os professores
@app.route("/api/professores", methods=["GET"])
def listar_professores():
    sql = """
        SELECT *
        FROM professores
        ORDER BY id_professor
    """

    try:
        return main.consultar_todos_sql(sql), 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao listar professores")


# READ — consulta um professor
@app.route("/api/professores/<int:id_professor>", methods=["GET"])
def consultar_professor(id_professor):
    sql = """
        SELECT *
        FROM professores
        WHERE id_professor = %s
    """

    try:
        resultado = main.consultar_um_sql(sql, (id_professor,))

        if not resultado:
            return {"erro": "Professor não encontrado"}, 404

        return resultado, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao consultar professor")


# UPDATE — atualiza um professor
@app.route("/api/professores/<int:id_professor>", methods=["PUT"])
def atualizar_professor(id_professor):
    dados = request.get_json(silent=True) or {}

    campos = [
        "nome_professor",
        "email",
        "especialidade"
    ]

    if not all(campo in dados for campo in campos):
        return {"erro": "Informe todos os campos do professor"}, 400

    sql = """
        UPDATE professores
        SET nome_professor = %s,
            email = %s,
            especialidade = %s
        WHERE id_professor = %s
    """

    valores = tuple(dados[campo] for campo in campos) + (id_professor,)

    try:
        resultado = main.consultar_um_sql(
            "SELECT id_professor FROM professores WHERE id_professor = %s",
            (id_professor,)
        )

        if not resultado:
            return {"erro": "Professor não encontrado"}, 404

        main.executar_comando_sql(sql, valores)
        return {"mensagem": "Professor atualizado com sucesso"}, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao atualizar professor")


# DELETE — exclui um professor
@app.route("/api/professores/<int:id_professor>", methods=["DELETE"])
def excluir_professor(id_professor):
    try:
        resultado = main.consultar_um_sql(
            "SELECT id_professor FROM professores WHERE id_professor = %s",
            (id_professor,)
        )

        if not resultado:
            return {"erro": "Professor não encontrado"}, 404

        main.executar_comando_sql(
            "DELETE FROM professores WHERE id_professor = %s",
            (id_professor,)
        )

        return {"mensagem": "Professor excluído com sucesso"}, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao excluir professor")


# ==========================================================
# TIPOS DE ATENDIMENTO
# ==========================================================

# CREATE — cadastra um tipo de atendimento
@app.route("/api/tipos-atendimento", methods=["POST"])
def cadastrar_tipo_atendimento():
    dados = request.get_json(silent=True) or {}

    campos = [
        "nome_tipo_atendimento",
        "descricao",
        "duracao_minutos"
    ]

    if not all(campo in dados for campo in campos):
        return {"erro": "Todos os campos são obrigatórios"}, 400

    valores = tuple(dados[campo] for campo in campos)
    sql = main.montar_insercao("tipos_atendimento", campos)

    try:
        main.executar_comando_sql(sql, valores)
        return {"mensagem": "Tipo de atendimento cadastrado com sucesso"}, 201
    except Exception as erro:
        return resposta_erro(erro, "Falha ao cadastrar tipo de atendimento")


# READ — lista os tipos de atendimento
@app.route("/api/tipos-atendimento", methods=["GET"])
def listar_tipos_atendimento():
    sql = """
        SELECT *
        FROM tipos_atendimento
        ORDER BY id_tipo_atendimento
    """

    try:
        return main.consultar_todos_sql(sql), 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao listar tipos de atendimento")


@app.route("/api/tipos-atendimento/<int:id_tipo_atendimento>", methods=["GET"])
def consultar_tipo_atendimento(id_tipo_atendimento):
    sql = """
        SELECT *
        FROM tipos_atendimento
        WHERE id_tipo_atendimento = %s
    """

    try:
        resultado = main.consultar_um_sql(sql, (id_tipo_atendimento,))

        if not resultado:
            return {"erro": "Tipo de atendimento não encontrado"}, 404

        return resultado, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao consultar tipo de atendimento")


@app.route("/api/tipos-atendimento/<int:id_tipo_atendimento>", methods=["PUT"])
def atualizar_tipo_atendimento(id_tipo_atendimento):
    dados = request.get_json(silent=True) or {}

    campos = [
        "nome_tipo_atendimento",
        "descricao",
        "duracao_minutos"
    ]

    if not all(campo in dados for campo in campos):
        return {"erro": "Informe todos os campos do tipo de atendimento"}, 400

    sql = """
        UPDATE tipos_atendimento
        SET nome_tipo_atendimento = %s,
            descricao = %s,
            duracao_minutos = %s
        WHERE id_tipo_atendimento = %s
    """

    valores = tuple(dados[campo] for campo in campos) + (id_tipo_atendimento,)

    try:
        resultado = main.consultar_um_sql(
            """
                SELECT id_tipo_atendimento
                FROM tipos_atendimento
                WHERE id_tipo_atendimento = %s
            """,
            (id_tipo_atendimento,)
        )

        if not resultado:
            return {"erro": "Tipo de atendimento não encontrado"}, 404

        main.executar_comando_sql(sql, valores)
        return {"mensagem": "Tipo de atendimento atualizado com sucesso"}, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao atualizar tipo de atendimento")


@app.route("/api/tipos-atendimento/<int:id_tipo_atendimento>", methods=["DELETE"])
def excluir_tipo_atendimento(id_tipo_atendimento):
    try:
        resultado = main.consultar_um_sql(
            """
                SELECT id_tipo_atendimento
                FROM tipos_atendimento
                WHERE id_tipo_atendimento = %s
            """,
            (id_tipo_atendimento,)
        )

        if not resultado:
            return {"erro": "Tipo de atendimento não encontrado"}, 404

        main.executar_comando_sql(
            """
                DELETE FROM tipos_atendimento
                WHERE id_tipo_atendimento = %s
            """,
            (id_tipo_atendimento,)
        )

        return {"mensagem": "Tipo de atendimento excluído com sucesso"}, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao excluir tipo de atendimento")


# ==========================================================
# AGENDAMENTOS
# ==========================================================

# CREATE — cria um agendamento
@app.route("/api/agendamentos", methods=["POST"])
def cadastrar_agendamento():
    dados = request.get_json(silent=True) or {}

    campos = [
        "id_tipo_atendimento",
        "id_aluno",
        "id_professor",
        "data_agendamento",
        "horario",
        "motivo",
        "status_agendamento"
    ]

    if not all(campo in dados for campo in campos):
        return {"erro": "Todos os campos são obrigatórios"}, 400

    try:
        dados["status_agendamento"] = normalizar_status_agendamento(dados.get("status_agendamento"))
    except ValueError as erro:
        return {"erro": str(erro)}, 400

    valores = tuple(dados[campo] for campo in campos)
    sql = main.montar_insercao("agendamento", campos)

    try:
        main.executar_comando_sql(sql, valores)
        return {"mensagem": "Agendamento cadastrado com sucesso"}, 201
    except Exception as erro:
        return resposta_erro(erro, "Falha ao cadastrar agendamento")


# READ — lista os agendamentos
@app.route("/api/agendamentos", methods=["GET"])
def listar_agendamentos():
    sql = """
        SELECT
            a.id_agendamento,
            a.id_tipo_atendimento,
            ta.nome_tipo_atendimento,
            a.id_aluno,
            al.nome_aluno,
            a.id_professor,
            p.nome_professor,
            a.data_agendamento,
            a.horario,
            a.motivo,
            a.status_agendamento
        FROM agendamento a
        INNER JOIN alunos al
            ON a.id_aluno = al.id_aluno
        INNER JOIN professores p
            ON a.id_professor = p.id_professor
        INNER JOIN tipos_atendimento ta
            ON a.id_tipo_atendimento = ta.id_tipo_atendimento
        ORDER BY a.data_agendamento, a.horario
    """

    try:
        return main.consultar_todos_sql(sql), 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao listar agendamentos")


@app.route("/api/agendamentos/<int:id_agendamento>", methods=["GET"])
def consultar_agendamento(id_agendamento):
    sql = """
        SELECT *
        FROM agendamento
        WHERE id_agendamento = %s
    """

    try:
        resultado = main.consultar_um_sql(sql, (id_agendamento,))

        if not resultado:
            return {"erro": "Agendamento não encontrado"}, 404

        return resultado, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao consultar agendamento")


@app.route("/api/agendamentos/<int:id_agendamento>", methods=["PUT"])
def atualizar_agendamento(id_agendamento):
    dados = request.get_json(silent=True) or {}

    campos = [
        "id_tipo_atendimento",
        "id_aluno",
        "id_professor",
        "data_agendamento",
        "horario",
        "motivo",
        "status_agendamento"
    ]

    if not all(campo in dados for campo in campos):
        return {"erro": "Informe todos os campos do agendamento"}, 400

    sql = """
        UPDATE agendamento
        SET id_tipo_atendimento = %s,
            id_aluno = %s,
            id_professor = %s,
            data_agendamento = %s,
            horario = %s,
            motivo = %s,
            status_agendamento = %s
        WHERE id_agendamento = %s
    """

    try:
        dados["status_agendamento"] = normalizar_status_agendamento(dados.get("status_agendamento"))
    except ValueError as erro:
        return {"erro": str(erro)}, 400

    valores = tuple(dados[campo] for campo in campos) + (id_agendamento,)

    try:
        resultado = main.consultar_um_sql(
            "SELECT id_agendamento FROM agendamento WHERE id_agendamento = %s",
            (id_agendamento,)
        )

        if not resultado:
            return {"erro": "Agendamento não encontrado"}, 404

        main.executar_comando_sql(sql, valores)
        return {"mensagem": "Agendamento atualizado com sucesso"}, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao atualizar agendamento")


@app.route("/api/agendamentos/<int:id_agendamento>", methods=["DELETE"])
def excluir_agendamento(id_agendamento):
    try:
        resultado = main.consultar_um_sql(
            "SELECT id_agendamento FROM agendamento WHERE id_agendamento = %s",
            (id_agendamento,)
        )

        if not resultado:
            return {"erro": "Agendamento não encontrado"}, 404

        main.executar_comando_sql(
            "DELETE FROM agendamento WHERE id_agendamento = %s",
            (id_agendamento,)
        )

        return {"mensagem": "Agendamento excluído com sucesso"}, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao excluir agendamento")


# ==========================================================
# DISPONIBILIDADES DOS PROFESSORES
# ==========================================================

# CREATE — cria um horário de disponibilidade
@app.route("/api/disponibilidades", methods=["POST"])
def cadastrar_disponibilidade():
    dados = request.get_json(silent=True) or {}

    campos = [
        "id_professor",
        "dia_semana",
        "horario_inicio",
        "horario_fim",
        "ativo"
    ]

    if not all(campo in dados for campo in campos):
        return {"erro": "Todos os campos da disponibilidade são obrigatórios"}, 400

    try:
        id_professor = int(dados["id_professor"])
    except (TypeError, ValueError):
        return {"erro": "Professor inválido"}, 400

    dia_semana = str(dados["dia_semana"]).strip()
    horario_inicio = str(dados["horario_inicio"])[:5]
    horario_fim = str(dados["horario_fim"])[:5]
    ativo = normalizar_booleano(dados["ativo"])

    if horario_fim <= horario_inicio:
        return {"erro": "O horário final deve ser maior que o horário inicial"}, 400

    try:
        professor = main.consultar_um_sql(
            "SELECT id_professor FROM professores WHERE id_professor = %s",
            (id_professor,)
        )
        if not professor:
            return {"erro": "Professor não encontrado"}, 404

        duplicado = main.consultar_um_sql(
            """
            SELECT id_disponibilidade
            FROM disponibilidades_professores
            WHERE id_professor = %s
              AND dia_semana = %s
              AND horario_inicio = %s
              AND horario_fim = %s
            """,
            (id_professor, dia_semana, horario_inicio, horario_fim)
        )
        if duplicado:
            return {"erro": "Essa disponibilidade já está cadastrada para o professor"}, 409

        campos_insert = ["id_professor", "dia_semana", "horario_inicio", "horario_fim", "ativo"]
        valores = (id_professor, dia_semana, horario_inicio, horario_fim, ativo)
        sql = main.montar_insercao("disponibilidades_professores", campos_insert)
        main.executar_comando_sql(sql, valores)
        return {"mensagem": "Disponibilidade cadastrada com sucesso"}, 201
    except Exception as erro:
        return resposta_erro(erro, "Falha ao cadastrar disponibilidade")


# READ — lista as disponibilidades
@app.route("/api/disponibilidades", methods=["GET"])
def listar_disponibilidades():
    sql = """
        SELECT
            d.id_disponibilidade,
            d.id_professor,
            p.nome_professor,
            d.dia_semana,
            TIME_FORMAT(d.horario_inicio, '%H:%i') AS horario_inicio,
            TIME_FORMAT(d.horario_fim, '%H:%i') AS horario_fim,
            d.ativo
        FROM disponibilidades_professores d
        INNER JOIN professores p
            ON d.id_professor = p.id_professor
        ORDER BY
            d.id_professor,
            CASE d.dia_semana
                WHEN 'Segunda' THEN 1
                WHEN 'Terça' THEN 2
                WHEN 'Quarta' THEN 3
                WHEN 'Quinta' THEN 4
                WHEN 'Sexta' THEN 5
                WHEN 'Sábado' THEN 6
                ELSE 7
            END,
            d.horario_inicio
    """

    try:
        return main.consultar_todos_sql(sql), 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao listar disponibilidades")


@app.route("/api/disponibilidades/<int:id_disponibilidade>", methods=["GET"])
def consultar_disponibilidade(id_disponibilidade):
    sql = """
        SELECT
            id_disponibilidade,
            id_professor,
            dia_semana,
            TIME_FORMAT(horario_inicio, '%H:%i') AS horario_inicio,
            TIME_FORMAT(horario_fim, '%H:%i') AS horario_fim,
            ativo
        FROM disponibilidades_professores
        WHERE id_disponibilidade = %s
    """

    try:
        resultado = main.consultar_um_sql(sql, (id_disponibilidade,))

        if not resultado:
            return {"erro": "Disponibilidade não encontrada"}, 404

        return resultado, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao consultar disponibilidade")


@app.route("/api/disponibilidades/<int:id_disponibilidade>", methods=["PUT"])
def atualizar_disponibilidade(id_disponibilidade):
    dados = request.get_json(silent=True) or {}

    campos = [
        "id_professor",
        "dia_semana",
        "horario_inicio",
        "horario_fim",
        "ativo"
    ]

    if not all(campo in dados for campo in campos):
        return {"erro": "Informe todos os campos da disponibilidade"}, 400

    try:
        id_professor = int(dados["id_professor"])
    except (TypeError, ValueError):
        return {"erro": "Professor inválido"}, 400

    dia_semana = str(dados["dia_semana"]).strip()
    horario_inicio = str(dados["horario_inicio"])[:5]
    horario_fim = str(dados["horario_fim"])[:5]
    ativo = normalizar_booleano(dados["ativo"])

    if horario_fim <= horario_inicio:
        return {"erro": "O horário final deve ser maior que o horário inicial"}, 400

    try:
        existente = main.consultar_um_sql(
            "SELECT id_disponibilidade FROM disponibilidades_professores WHERE id_disponibilidade = %s",
            (id_disponibilidade,)
        )
        if not existente:
            return {"erro": "Disponibilidade não encontrada"}, 404

        professor = main.consultar_um_sql(
            "SELECT id_professor FROM professores WHERE id_professor = %s",
            (id_professor,)
        )
        if not professor:
            return {"erro": "Professor não encontrado"}, 404

        duplicado = main.consultar_um_sql(
            """
            SELECT id_disponibilidade
            FROM disponibilidades_professores
            WHERE id_professor = %s
              AND dia_semana = %s
              AND horario_inicio = %s
              AND horario_fim = %s
              AND id_disponibilidade <> %s
            """,
            (id_professor, dia_semana, horario_inicio, horario_fim, id_disponibilidade)
        )
        if duplicado:
            return {"erro": "Essa disponibilidade já está cadastrada para o professor"}, 409

        sql = """
            UPDATE disponibilidades_professores
            SET id_professor = %s,
                dia_semana = %s,
                horario_inicio = %s,
                horario_fim = %s,
                ativo = %s
            WHERE id_disponibilidade = %s
        """
        valores = (id_professor, dia_semana, horario_inicio, horario_fim, ativo, id_disponibilidade)
        main.executar_comando_sql(sql, valores)
        return {"mensagem": "Disponibilidade atualizada com sucesso"}, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao atualizar disponibilidade")


@app.route("/api/disponibilidades/<int:id_disponibilidade>", methods=["DELETE"])
def excluir_disponibilidade(id_disponibilidade):
    try:
        resultado = main.consultar_um_sql(
            "SELECT id_disponibilidade FROM disponibilidades_professores WHERE id_disponibilidade = %s",
            (id_disponibilidade,)
        )

        if not resultado:
            return {"erro": "Disponibilidade não encontrada"}, 404

        main.executar_comando_sql(
            "DELETE FROM disponibilidades_professores WHERE id_disponibilidade = %s",
            (id_disponibilidade,)
        )

        return {"mensagem": "Disponibilidade excluída com sucesso"}, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao excluir disponibilidade")


# ==========================================================
# BLOQUEIOS DE AGENDA
# ==========================================================

# CREATE — cria um bloqueio de agenda
@app.route("/api/bloqueios", methods=["POST"])
def cadastrar_bloqueio():
    dados = request.get_json(silent=True) or {}

    campos = [
        "id_professor",
        "data_inicio",
        "data_fim",
        "motivo"
    ]

    if not all(campo in dados for campo in campos):
        return {"erro": "Todos os campos são obrigatórios"}, 400

    valores = tuple(dados[campo] for campo in campos)
    sql = main.montar_insercao("bloqueios_agenda", campos)

    try:
        main.executar_comando_sql(sql, valores)
        return {"mensagem": "Bloqueio cadastrado com sucesso"}, 201
    except Exception as erro:
        return resposta_erro(erro, "Falha ao cadastrar bloqueio")


# READ — lista os bloqueios
@app.route("/api/bloqueios", methods=["GET"])
def listar_bloqueios():
    sql = """
        SELECT
            b.id_bloqueio,
            b.id_professor,
            p.nome_professor,
            b.data_inicio,
            b.data_fim,
            b.motivo
        FROM bloqueios_agenda b
        INNER JOIN professores p
            ON b.id_professor = p.id_professor
        ORDER BY b.data_inicio
    """

    try:
        return main.consultar_todos_sql(sql), 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao listar bloqueios")


@app.route("/api/bloqueios/<int:id_bloqueio>", methods=["GET"])
def consultar_bloqueio(id_bloqueio):
    sql = """
        SELECT *
        FROM bloqueios_agenda
        WHERE id_bloqueio = %s
    """

    try:
        resultado = main.consultar_um_sql(sql, (id_bloqueio,))

        if not resultado:
            return {"erro": "Bloqueio não encontrado"}, 404

        return resultado, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao consultar bloqueio")


@app.route("/api/bloqueios/<int:id_bloqueio>", methods=["PUT"])
def atualizar_bloqueio(id_bloqueio):
    dados = request.get_json(silent=True) or {}

    campos = [
        "id_professor",
        "data_inicio",
        "data_fim",
        "motivo"
    ]

    if not all(campo in dados for campo in campos):
        return {"erro": "Informe todos os campos do bloqueio"}, 400

    sql = """
        UPDATE bloqueios_agenda
        SET id_professor = %s,
            data_inicio = %s,
            data_fim = %s,
            motivo = %s
        WHERE id_bloqueio = %s
    """

    valores = tuple(dados[campo] for campo in campos) + (id_bloqueio,)

    try:
        resultado = main.consultar_um_sql(
            """
                SELECT id_bloqueio
                FROM bloqueios_agenda
                WHERE id_bloqueio = %s
            """,
            (id_bloqueio,)
        )

        if not resultado:
            return {"erro": "Bloqueio não encontrado"}, 404

        main.executar_comando_sql(sql, valores)
        return {"mensagem": "Bloqueio atualizado com sucesso"}, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao atualizar bloqueio")


@app.route("/api/bloqueios/<int:id_bloqueio>", methods=["DELETE"])
def excluir_bloqueio(id_bloqueio):
    try:
        resultado = main.consultar_um_sql(
            """
                SELECT id_bloqueio
                FROM bloqueios_agenda
                WHERE id_bloqueio = %s
            """,
            (id_bloqueio,)
        )

        if not resultado:
            return {"erro": "Bloqueio não encontrado"}, 404

        main.executar_comando_sql(
            "DELETE FROM bloqueios_agenda WHERE id_bloqueio = %s",
            (id_bloqueio,)
        )

        return {"mensagem": "Bloqueio excluído com sucesso"}, 200
    except Exception as erro:
        return resposta_erro(erro, "Falha ao excluir bloqueio")
