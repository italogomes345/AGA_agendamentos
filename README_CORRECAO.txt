AGA - versão corrigida

1) Instale as dependências:
   pip install flask mysql-connector-python python-dotenv

2) Abra o arquivo .env e coloque a senha REAL do seu usuário root do MySQL:
   DB_USER=root
   DB_PASSWORD=SUA_SENHA_DO_MYSQL
   DB_DATABASE=aga_agendamentos

3) No MySQL Workbench, execute banco_teste.sql uma vez para criar as tabelas e os dados de teste.

4) Execute:
   python main.py

5) Abra:
   http://127.0.0.1:5000

Correções desta versão:
- cursor.fechar()/conn.fechar() -> cursor.close()/conn.close()
- carregamento do .env baseado na pasta do projeto
- mensagens de erro de conexão mais claras
- logo H menor e com fundo transparente
- favicon H incluído
- CSS e JavaScript completos incluídos no pacote

Observação: se o banco aga_agendamentos não existir, o programa tenta criá-lo automaticamente. Isso não substitui o banco_teste.sql: o script SQL ainda é necessário para criar todas as tabelas e inserir os dados de teste.
