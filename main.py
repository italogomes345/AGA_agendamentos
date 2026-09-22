# ==========================================================
# IMPORTAÇÕES
# ==========================================================
# Bibliotecas utilizadas pela aplicação.
from flask import Flask
from dotenv import load_dotenv
import mysql.connector
import os
from datetime import date, datetime, time, timedelta
from decimal import Decimal


# ==========================================================
# CONFIGURAÇÃO DO AMBIENTE
# ==========================================================
# Carrega as variáveis do arquivo .env
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"), override=False)


# ==========================================================
# CRIAÇÃO DA APLICAÇÃO FLASK
# ==========================================================
# Cria o objeto principal que representa o servidor web.
app = Flask(__name__)


# Importa as rotas depois da criação da aplicação
# e antes do app.run().
from routes import *


# ==========================================================
# CONEXÃO COM O BANCO DE DADOS
# ==========================================================
# Lê as configurações do MySQL no arquivo .env e abre uma conexão.
# ==========================================================
# Banco de Dados
def obter_conexao_banco():
    """Abre uma conexão com o MySQL usando as configurações do .env."""
    host_banco = (os.getenv("DB_HOST") or "127.0.0.1").strip()
    usuario_banco = (os.getenv("DB_USER") or "root").strip()
    senha_banco = os.getenv("DB_PASSWORD") or ""
    nome_banco = (os.getenv("DB_DATABASE") or "aga_agendamentos").strip()
    porta_banco = int(os.getenv("DB_PORT") or 3306)

    configuracao = {
        "host": host_banco,
        "user": usuario_banco,
        "password": senha_banco,
        "database": nome_banco,
        "port": porta_banco,
        "connection_timeout": 5,
    }

    try:
        return mysql.connector.connect(**configuracao)
    except mysql.connector.Error as erro:
        # Se o MySQL estiver funcionando, mas o banco ainda não existir,
        # tenta criá-lo automaticamente usando o mesmo usuário.
        if getattr(erro, "errno", None) == 1049:
            try:
                conexao_criacao = mysql.connector.connect(
                    host=host_banco,
                    user=usuario_banco,
                    password=senha_banco,
                    port=porta_banco,
                    connection_timeout=5,
                )
                cursor_criacao = conexao_criacao.cursor()
                cursor_criacao.execute(
                    f"CREATE DATABASE IF NOT EXISTS `{nome_banco}` "
                    "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
                cursor_criacao.close()
                conexao_criacao.close()
                return mysql.connector.connect(**configuracao)
            except mysql.connector.Error as erro_criacao:
                erro = erro_criacao

        print("\n========== ERRO DE CONEXÃO COM O MYSQL ==========")
        print(f"Servidor: {host_banco}:{porta_banco}")
        print(f"Usuário: {usuario_banco}")
        print(f"Banco: {nome_banco}")
        print(f"Código MySQL: {getattr(erro, 'errno', 'desconhecido')}")
        print(f"Mensagem: {erro}")
        print("Confira se o MySQL está em execução e se DB_USER/DB_PASSWORD no .env estão corretos.")
        print("==================================================\n")
        raise


# ==========================================================
# CONVERSÃO DE VALORES DO MYSQL PARA JSON
# ==========================================================
# O MySQL Connector retorna campos TIME como timedelta.
# O JSON não aceita timedelta diretamente, então convertemos
# datas, horários, duração e valores decimais para formatos
# que o JavaScript consegue receber normalmente.

def converter_valor_json(valor):
    if isinstance(valor, datetime):
        return valor.isoformat(sep=" ")

    if isinstance(valor, (date, time)):
        return valor.isoformat()

    if isinstance(valor, timedelta):
        total_segundos = int(valor.total_seconds())
        horas = total_segundos // 3600
        minutos = (total_segundos % 3600) // 60
        segundos = total_segundos % 60
        return f"{horas:02d}:{minutos:02d}:{segundos:02d}"

    if isinstance(valor, Decimal):
        return float(valor)

    if isinstance(valor, dict):
        return {chave: converter_valor_json(item) for chave, item in valor.items()}

    if isinstance(valor, (list, tuple)):
        return [converter_valor_json(item) for item in valor]

    return valor


# ==========================================================
# FUNÇÕES SQL
# ==========================================================
# Estas funções centralizam INSERT, UPDATE, DELETE e consultas.
# Assim, as rotas não precisam repetir toda a lógica de conexão.
# ==========================================================

def executar_comando_sql(sql, parametros=None):
    conn = None
    cursor = None

    try:
        conn = obter_conexao_banco()
        cursor = conn.cursor(dictionary=True)

        if parametros is not None:
            cursor.execute(sql, parametros)
        else:
            cursor.execute(sql)

        conn.commit()

    except Exception as erro:
        if conn:
            conn.rollback()

        print(f"Erro ao executar SQL: {erro}")
        raise

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


# Consulta vários registros e devolve uma lista de dicionários.
def consultar_todos_sql(sql, parametros=None):
    conn = None
    cursor = None

    try:
        conn = obter_conexao_banco()
        cursor = conn.cursor(dictionary=True)

        if parametros is not None:
            cursor.execute(sql, parametros)
        else:
            cursor.execute(sql)

        resultados = cursor.fetchall()
        return converter_valor_json(resultados)

    except Exception as erro:
        print(f"Erro ao consultar dados: {erro}")
        raise

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


# Consulta um único registro e devolve um dicionário ou None.
def consultar_um_sql(sql, parametros=None):
    conn = None
    cursor = None

    try:
        conn = obter_conexao_banco()
        cursor = conn.cursor(dictionary=True)

        if parametros is not None:
            cursor.execute(sql, parametros)
        else:
            cursor.execute(sql)

        resultado = cursor.fetchone()
        return converter_valor_json(resultado)

    except Exception as erro:
        print(f"Erro ao consultar dado: {erro}")
        raise

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


def executar_transacao_sql(comandos):
    conn = None
    cursor = None
    try:
        conn = obter_conexao_banco()
        cursor = conn.cursor(dictionary=True)
        for sql_comando, parametros in comandos:
            cursor.execute(sql_comando, parametros)
        conn.commit()
    except Exception:
        if conn:
            conn.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# Monta automaticamente um INSERT usando os nomes dos campos recebidos.
def montar_insercao(tabela, campos):
    colunas = ", ".join(campos)
    placeholders = ", ".join(["%s"] * len(campos))

    return f"""
        INSERT INTO {tabela} ({colunas})
        VALUES ({placeholders})
    """


# ==========================================================
# INICIALIZAÇÃO DO SERVIDOR
# ==========================================================
# Executa o Flask somente quando este arquivo for iniciado diretamente.
if __name__ == "__main__":
    app.run(debug=True)
