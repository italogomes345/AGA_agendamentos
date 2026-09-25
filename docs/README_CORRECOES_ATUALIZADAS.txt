AGA — correções da agenda, dashboard e exclusão de alunos

Principais correções desta versão:

1. Calendário mensal:
- Dias do mês voltam a ter marcadores coloridos quando possuem agendamentos.
- Cores dos marcadores indicam Confirmado, Pendente, Concluído e Cancelado.
- Dia atual e dia selecionado continuam destacados.
- Corrigidas referências quebradas que impediam a renderização completa da agenda.

2. Agenda diária:
- Corrigido o cálculo da posição dos eventos (variável de início do horário).
- Filtro de professor continua funcionando.

3. Dashboard:
- Corrigida a ordenação dos professores por quantidade de atendimentos.
- Corrigidas variáveis de cor que apontavam para nomes antigos.
- Gráfico vazio usa a cor do tema atual.
- Status 'Agendado' vindo de bancos antigos é tratado como 'Pendente'.

4. Exclusão de alunos:
- O botão de exclusão agora usa o nome correto da variável da rota.
- Quando o aluno possui agendamentos, eles são removidos na mesma transação antes do cadastro do aluno, evitando erro de chave estrangeira.
- O usuário recebe confirmação explicando essa consequência.

5. Backend:
- Status de agendamento aceitos: Pendente, Confirmado, Cancelado e Concluído.
- 'Agendado' ainda é aceito na entrada somente para compatibilidade e é convertido para Pendente.
- Mantida a conversão de timedelta/date/time para JSON.

Para instalar as bibliotecas:
pip install -r requirements.txt

Para corrigir um banco que já possui registros com status 'Agendado', execute corrigir_status_banco_existente.sql.
