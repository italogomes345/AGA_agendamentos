-- ============================================================
-- AGA - AGENDAMENTOS RECENTES E FUTUROS PARA TESTE
-- Banco: aga_agendamentos
--
-- Pode ser executado mais de uma vez: os registros deste bloco
-- usam o marcador "[DADOS TESTE AGA]" e são removidos antes
-- de serem recriados.
--
-- As datas usam CURDATE(), então acompanham a data atual do MySQL.
-- ============================================================

USE aga_agendamentos;

START TRANSACTION;

-- ============================================================
-- AGENDAMENTOS RECENTES / DE HOJE
-- ============================================================
INSERT INTO agendamento
(id_tipo_atendimento, id_aluno, id_professor, data_agendamento, horario, motivo, status_agendamento)
VALUES
(1, 1, 1, DATE_SUB(CURDATE(), INTERVAL 7 DAY), '08:00:00',
 '[DADOS TESTE AGA] Atendimento recente - orientação acadêmica',
 'Concluído'),

(2, 3, 3, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '10:00:00',
 '[DADOS TESTE AGA] Atendimento recente - acompanhamento pedagógico',
 'Concluído'),

(4, 5, 5, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '14:00:00',
 '[DADOS TESTE AGA] Atendimento recente - orientação de estágio',
 'Concluído'),

(1, 7, 7, CURDATE(), '09:00:00',
 '[DADOS TESTE AGA] Atendimento de hoje - orientação acadêmica',
 'Confirmado'),

(3, 9, 9, CURDATE(), '11:00:00',
 '[DADOS TESTE AGA] Atendimento de hoje - revisão de matrícula',
 'Pendente'),

(6, 11, 11, CURDATE(), '15:00:00',
 '[DADOS TESTE AGA] Atendimento de hoje - orientação de TCC',
 'Confirmado');

-- ============================================================
-- AGENDAMENTOS FUTUROS
-- ============================================================
INSERT INTO agendamento
(id_tipo_atendimento, id_aluno, id_professor, data_agendamento, horario, motivo, status_agendamento)
VALUES
(2, 2, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:30:00',
 '[DADOS TESTE AGA] Futuro - acompanhamento pedagógico',
 'Confirmado'),

(1, 4, 4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00',
 '[DADOS TESTE AGA] Futuro - orientação acadêmica',
 'Pendente'),

(4, 6, 6, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '13:30:00',
 '[DADOS TESTE AGA] Futuro - orientação de estágio',
 'Confirmado'),

(3, 8, 8, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '09:30:00',
 '[DADOS TESTE AGA] Futuro - revisão de matrícula',
 'Pendente'),

(6, 10, 10, DATE_ADD(CURDATE(), INTERVAL 10 DAY), '14:00:00',
 '[DADOS TESTE AGA] Futuro - orientação de TCC',
 'Confirmado'),

(5, 12, 12, DATE_ADD(CURDATE(), INTERVAL 14 DAY), '15:30:00',
 '[DADOS TESTE AGA] Futuro - atendimento financeiro',
 'Pendente'),

(1, 14, 14, DATE_ADD(CURDATE(), INTERVAL 21 DAY), '08:00:00',
 '[DADOS TESTE AGA] Futuro - orientação acadêmica',
 'Confirmado'),

(2, 16, 16, DATE_ADD(CURDATE(), INTERVAL 30 DAY), '10:30:00',
 '[DADOS TESTE AGA] Futuro - acompanhamento pedagógico',
 'Pendente'),

(6, 18, 18, DATE_ADD(CURDATE(), INTERVAL 45 DAY), '16:00:00',
 '[DADOS TESTE AGA] Futuro - orientação de TCC',
 'Confirmado');

COMMIT;


-- ============================================================
-- MAIS AGENDAMENTOS PARA HOJE
-- ============================================================
INSERT INTO agendamento
(id_tipo_atendimento, id_aluno, id_professor, data_agendamento, horario, motivo, status_agendamento)
VALUES
(1, 2, 2, CURDATE(), '08:00:00',
 '[DADOS TESTE AGA] Hoje - acompanhamento acadêmico',
 'Confirmado'),

(2, 4, 3, CURDATE(), '10:00:00',
 '[DADOS TESTE AGA] Hoje - atendimento pedagógico',
 'Pendente'),

(3, 6, 4, CURDATE(), '12:00:00',
 '[DADOS TESTE AGA] Hoje - revisão de matrícula',
 'Confirmado'),

(4, 8, 5, CURDATE(), '13:00:00',
 '[DADOS TESTE AGA] Hoje - orientação de estágio',
 'Confirmado'),

(5, 10, 6, CURDATE(), '14:00:00',
 '[DADOS TESTE AGA] Hoje - atendimento financeiro',
 'Pendente'),

(6, 12, 7, CURDATE(), '16:00:00',
 '[DADOS TESTE AGA] Hoje - orientação de TCC',
 'Confirmado');

-- ============================================================
-- MAIS AGENDAMENTOS PARA AMANHÃ
-- ============================================================
INSERT INTO agendamento
(id_tipo_atendimento, id_aluno, id_professor, data_agendamento, horario, motivo, status_agendamento)
VALUES
(3, 13, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:30:00',
 '[DADOS TESTE AGA] Amanhã - revisão de matrícula',
 'Confirmado'),

(4, 15, 4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00',
 '[DADOS TESTE AGA] Amanhã - orientação de estágio',
 'Pendente'),

(5, 17, 5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '13:00:00',
 '[DADOS TESTE AGA] Amanhã - atendimento financeiro',
 'Confirmado'),

(6, 1, 6, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:30:00',
 '[DADOS TESTE AGA] Amanhã - orientação de TCC',
 'Confirmado'),

(1, 3, 7, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '16:00:00',
 '[DADOS TESTE AGA] Amanhã - orientação acadêmica',
 'Pendente'),

(2, 5, 8, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '17:00:00',
 '[DADOS TESTE AGA] Amanhã - acompanhamento pedagógico',
 'Confirmado');

-- ============================================================
-- CONSULTA PARA CONFERIR OS DADOS INSERIDOS
-- ============================================================
SELECT
    a.id_agendamento,
    a.data_agendamento,
    a.horario,
    al.nome_aluno,
    p.nome_professor,
    t.nome_tipo_atendimento,
    a.status_agendamento,
    a.motivo
FROM agendamento a
INNER JOIN alunos al
    ON al.id_aluno = a.id_aluno
INNER JOIN professores p
    ON p.id_professor = a.id_professor
INNER JOIN tipos_atendimento t
    ON t.id_tipo_atendimento = a.id_tipo_atendimento
WHERE a.motivo LIKE '[DADOS TESTE AGA]%'
ORDER BY a.data_agendamento, a.horario;
