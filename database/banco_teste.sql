-- ============================================================
-- AGA - AGENDA ACADÊMICA
-- BANCO DE DADOS DE TESTE
-- 20 alunos + 20 professores + tipos + agendamentos +
-- disponibilidades + bloqueios
-- Compatível com MySQL 8.x
-- ============================================================

CREATE DATABASE IF NOT EXISTS aga_agendamentos
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE aga_agendamentos;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS bloqueios_agenda;
DROP TABLE IF EXISTS disponibilidades_professores;
DROP TABLE IF EXISTS agendamento;
DROP TABLE IF EXISTS tipos_atendimento;
DROP TABLE IF EXISTS professores;
DROP TABLE IF EXISTS alunos;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- TABELA DE ALUNOS
-- ============================================================
CREATE TABLE alunos (
    id_aluno INT AUTO_INCREMENT PRIMARY KEY,
    nome_aluno VARCHAR(120) NOT NULL,
    matricula VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefone VARCHAR(25),
    curso VARCHAR(100) NOT NULL,
    turma VARCHAR(30) NOT NULL,
    periodo VARCHAR(20) NOT NULL,
    consentimento_lgpd BOOLEAN NOT NULL DEFAULT FALSE,
    data_consentimento DATE NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABELA DE PROFESSORES
-- ============================================================
CREATE TABLE professores (
    id_professor INT AUTO_INCREMENT PRIMARY KEY,
    nome_professor VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    especialidade VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABELA DE TIPOS DE ATENDIMENTO
-- ============================================================
CREATE TABLE tipos_atendimento (
    id_tipo_atendimento INT AUTO_INCREMENT PRIMARY KEY,
    nome_tipo_atendimento VARCHAR(100) NOT NULL,
    descricao TEXT,
    duracao_minutos INT NOT NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABELA DE AGENDAMENTOS
-- ============================================================
CREATE TABLE agendamento (
    id_agendamento INT AUTO_INCREMENT PRIMARY KEY,
    id_tipo_atendimento INT NOT NULL,
    id_aluno INT NOT NULL,
    id_professor INT NOT NULL,
    data_agendamento DATE NOT NULL,
    horario TIME NOT NULL,
    motivo VARCHAR(255),
    status_agendamento VARCHAR(30) NOT NULL DEFAULT 'Pendente',

    CONSTRAINT fk_agendamento_tipo
        FOREIGN KEY (id_tipo_atendimento)
        REFERENCES tipos_atendimento(id_tipo_atendimento),

    CONSTRAINT fk_agendamento_aluno
        FOREIGN KEY (id_aluno)
        REFERENCES alunos(id_aluno),

    CONSTRAINT fk_agendamento_professor
        FOREIGN KEY (id_professor)
        REFERENCES professores(id_professor)
) ENGINE=InnoDB;

-- ============================================================
-- TABELA DE DISPONIBILIDADES DOS PROFESSORES
-- ============================================================
CREATE TABLE disponibilidades_professores (
    id_disponibilidade INT AUTO_INCREMENT PRIMARY KEY,
    id_professor INT NOT NULL,
    dia_semana VARCHAR(20) NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_disponibilidade_professor
        FOREIGN KEY (id_professor)
        REFERENCES professores(id_professor)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABELA DE BLOQUEIOS DA AGENDA
-- ============================================================
CREATE TABLE bloqueios_agenda (
    id_bloqueio INT AUTO_INCREMENT PRIMARY KEY,
    id_professor INT NOT NULL,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    motivo VARCHAR(255) NOT NULL,

    CONSTRAINT fk_bloqueio_professor
        FOREIGN KEY (id_professor)
        REFERENCES professores(id_professor)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- DADOS: 20 ALUNOS
-- ============================================================
INSERT INTO alunos
(nome_aluno, matricula, email, telefone, curso, turma, periodo, consentimento_lgpd, data_consentimento)
VALUES
('Ana Beatriz Souza', '20260001', 'ana.souza@alunos.aga.edu.br', '(31) 98801-1001', 'Administração', 'ADM-1', '1', 1, '2026-08-01'),
('Bruno Henrique Lima', '20260002', 'bruno.lima@alunos.aga.edu.br', '(31) 98801-1002', 'Sistemas de Informação', 'SI-1', '1', 1, '2026-08-02'),
('Camila Rodrigues Alves', '20260003', 'camila.alves@alunos.aga.edu.br', '(31) 98801-1003', 'Engenharia de Produção', 'EP-2', '2', 1, '2026-08-02'),
('Daniel Martins Costa', '20260004', 'daniel.costa@alunos.aga.edu.br', '(31) 98801-1004', 'Direito', 'DIR-3', '3', 1, '2026-08-03'),
('Eduarda Ferreira Melo', '20260005', 'eduarda.melo@alunos.aga.edu.br', '(31) 98801-1005', 'Pedagogia', 'PED-1', '1', 1, '2026-08-03'),
('Felipe Augusto Silva', '20260006', 'felipe.silva@alunos.aga.edu.br', '(31) 98801-1006', 'Ciência da Computação', 'CC-2', '2', 1, '2026-08-04'),
('Gabriela Oliveira Santos', '20260007', 'gabriela.santos@alunos.aga.edu.br', '(31) 98801-1007', 'Psicologia', 'PSI-1', '1', 1, '2026-08-04'),
('Henrique Almeida Souza', '20260008', 'henrique.souza@alunos.aga.edu.br', '(31) 98801-1008', 'Administração', 'ADM-2', '2', 1, '2026-08-05'),
('Isabela Cristina Rocha', '20260009', 'isabela.rocha@alunos.aga.edu.br', '(31) 98801-1009', 'Enfermagem', 'ENF-3', '3', 1, '2026-08-05'),
('João Pedro Nunes', '20260010', 'joao.nunes@alunos.aga.edu.br', '(31) 98801-1010', 'Sistemas de Informação', 'SI-2', '2', 1, '2026-08-06'),
('Karen Vitória Mendes', '20260011', 'karen.mendes@alunos.aga.edu.br', '(31) 98801-1011', 'Marketing', 'MKT-1', '1', 1, '2026-08-06'),
('Lucas Gabriel Martins', '20260012', 'lucas.martins@alunos.aga.edu.br', '(31) 98801-1012', 'Engenharia Civil', 'EC-4', '4', 1, '2026-08-07'),
('Mariana Lopes Reis', '20260013', 'mariana.reis@alunos.aga.edu.br', '(31) 98801-1013', 'Arquitetura', 'ARQ-2', '2', 1, '2026-08-07'),
('Nicolas Barbosa Lima', '20260014', 'nicolas.lima@alunos.aga.edu.br', '(31) 98801-1014', 'Economia', 'ECO-3', '3', 1, '2026-08-08'),
('Olivia Martins Duarte', '20260015', 'olivia.duarte@alunos.aga.edu.br', '(31) 98801-1015', 'Nutrição', 'NUT-1', '1', 1, '2026-08-08'),
('Paulo Henrique Castro', '20260016', 'paulo.castro@alunos.aga.edu.br', '(31) 98801-1016', 'Engenharia de Software', 'ES-2', '2', 1, '2026-08-09'),
('Rafaela Gomes Freitas', '20260017', 'rafaela.freitas@alunos.aga.edu.br', '(31) 98801-1017', 'Administração', 'ADM-3', '3', 1, '2026-08-09'),
('Samuel Ribeiro Alves', '20260018', 'samuel.alves@alunos.aga.edu.br', '(31) 98801-1018', 'Educação Física', 'EDF-2', '2', 1, '2026-08-10'),
('Tatiane Souza Campos', '20260019', 'tatiane.campos@alunos.aga.edu.br', '(31) 98801-1019', 'Ciências Contábeis', 'CCO-1', '1', 1, '2026-08-10'),
('Victor Hugo Pereira', '20260020', 'victor.pereira@alunos.aga.edu.br', '(31) 98801-1020', 'Sistemas de Informação', 'SI-3', '3', 1, '2026-08-11');

-- ============================================================
-- DADOS: 20 PROFESSORES
-- ============================================================
INSERT INTO professores
(nome_professor, email, especialidade)
VALUES
('Marcos Antônio Ribeiro', 'marcos.ribeiro@aga.edu.br', 'Administração'),
('Juliana Carvalho Mendes', 'juliana.mendes@aga.edu.br', 'Sistemas de Informação'),
('Ricardo Alves Pereira', 'ricardo.pereira@aga.edu.br', 'Engenharia de Produção'),
('Fernanda Oliveira Costa', 'fernanda.costa@aga.edu.br', 'Direito'),
('Carlos Eduardo Martins', 'carlos.martins@aga.edu.br', 'Pedagogia'),
('Patrícia Gomes Silva', 'patricia.silva@aga.edu.br', 'Ciência da Computação'),
('André Luiz Souza', 'andre.souza@aga.edu.br', 'Psicologia'),
('Renata Ferreira Lima', 'renata.lima@aga.edu.br', 'Marketing'),
('Gustavo Henrique Rocha', 'gustavo.rocha@aga.edu.br', 'Engenharia Civil'),
('Larissa Beatriz Nunes', 'larissa.nunes@aga.edu.br', 'Arquitetura'),
('Eduardo Ramos Duarte', 'eduardo.duarte@aga.edu.br', 'Economia'),
('Simone Cristina Alves', 'simone.alves@aga.edu.br', 'Nutrição'),
('Thiago Martins Reis', 'thiago.reis@aga.edu.br', 'Engenharia de Software'),
('Aline Barbosa Freitas', 'aline.freitas@aga.edu.br', 'Ciências Contábeis'),
('Roberto César Melo', 'roberto.melo@aga.edu.br', 'Educação Física'),
('Camila Fernanda Lopes', 'camila.lopes@aga.edu.br', 'Administração'),
('Diego Henrique Castro', 'diego.castro@aga.edu.br', 'Sistemas de Informação'),
('Priscila Mendes Rocha', 'priscila.rocha@aga.edu.br', 'Engenharia de Produção'),
('Fábio Augusto Santos', 'fabio.santos@aga.edu.br', 'Direito'),
('Vanessa Almeida Gomes', 'vanessa.gomes@aga.edu.br', 'Pedagogia');

-- ============================================================
-- DADOS: TIPOS DE ATENDIMENTO
-- ============================================================
INSERT INTO tipos_atendimento
(nome_tipo_atendimento, descricao, duracao_minutos)
VALUES
('Orientação acadêmica', 'Orientação sobre disciplinas, matrícula e trajetória acadêmica.', 30),
('Atendimento pedagógico', 'Acompanhamento de dificuldades de aprendizagem e planejamento.', 45),
('Revisão de matrícula', 'Conferência e orientação sobre matrícula e componentes curriculares.', 30),
('Orientação de estágio', 'Orientações para estágio obrigatório e não obrigatório.', 45),
('Atendimento financeiro', 'Esclarecimentos sobre mensalidades, bolsas e pendências.', 30),
('Orientação de TCC', 'Acompanhamento de tema, cronograma e etapas do trabalho de conclusão.', 60);

-- ============================================================
-- DADOS: AGENDAMENTOS
-- ============================================================
INSERT INTO agendamento
(id_tipo_atendimento, id_aluno, id_professor, data_agendamento, horario, motivo, status_agendamento)
VALUES
(1, 1, 1, '2026-08-18', '08:00:00', 'Orientação sobre matrícula', 'Confirmado'),
(2, 2, 2, '2026-08-18', '09:00:00', 'Dúvidas sobre disciplinas', 'Pendente'),
(3, 3, 3, '2026-08-18', '10:30:00', 'Planejamento do semestre', 'Confirmado'),
(4, 4, 4, '2026-08-18', '13:30:00', 'Orientação sobre estágio', 'Pendente'),
(2, 5, 5, '2026-08-18', '15:00:00', 'Acompanhamento pedagógico', 'Concluído'),
(6, 6, 6, '2026-08-19', '08:30:00', 'Dúvidas sobre programação', 'Pendente'),
(1, 7, 7, '2026-08-19', '10:00:00', 'Acompanhamento acadêmico', 'Confirmado'),
(1, 8, 8, '2026-08-19', '14:00:00', 'Orientação profissional', 'Pendente'),
(4, 9, 9, '2026-08-20', '09:00:00', 'Planejamento de estágio', 'Pendente'),
(3, 10, 10, '2026-08-20', '11:00:00', 'Revisão de matrícula', 'Confirmado'),
(5, 11, 11, '2026-08-20', '14:30:00', 'Orientação financeira', 'Pendente'),
(6, 12, 12, '2026-08-21', '08:00:00', 'Orientação de TCC', 'Confirmado'),
(6, 13, 13, '2026-08-21', '10:00:00', 'Definição de tema do TCC', 'Pendente'),
(1, 14, 14, '2026-08-21', '13:00:00', 'Orientação acadêmica', 'Cancelado'),
(2, 15, 15, '2026-08-22', '09:30:00', 'Acompanhamento pedagógico', 'Pendente'),
(4, 16, 16, '2026-08-24', '08:00:00', 'Orientação de estágio', 'Pendente'),
(1, 17, 17, '2026-08-24', '10:30:00', 'Planejamento acadêmico', 'Confirmado'),
(3, 18, 18, '2026-08-25', '14:00:00', 'Revisão de matrícula', 'Pendente'),
(5, 19, 19, '2026-08-26', '09:00:00', 'Orientação financeira', 'Pendente'),
(6, 20, 20, '2026-08-27', '16:00:00', 'Orientação de TCC', 'Confirmado'),
(1, 2, 2, '2026-09-01', '09:00:00', 'Acompanhamento de disciplina', 'Pendente'),
(4, 6, 6, '2026-09-02', '14:00:00', 'Orientação de estágio', 'Pendente'),
(1, 8, 8, '2026-09-03', '10:00:00', 'Planejamento acadêmico', 'Pendente'),
(6, 13, 13, '2026-09-04', '15:00:00', 'Orientação de TCC', 'Pendente'),
(3, 17, 17, '2026-09-05', '09:00:00', 'Revisão de matrícula', 'Pendente'),
(1, 1, 1, '2026-09-08', '08:00:00', 'Orientação acadêmica', 'Pendente');

-- ============================================================
-- DADOS: DISPONIBILIDADES
-- ============================================================
INSERT INTO disponibilidades_professores
(id_professor, dia_semana, horario_inicio, horario_fim, ativo)
VALUES
(1, 'Segunda', '13:00:00', '17:00:00', 1),
(1, 'Terça', '08:00:00', '12:00:00', 1),
(1, 'Quinta', '08:00:00', '12:00:00', 1),
(1, 'Sexta', '13:00:00', '17:00:00', 1),
(2, 'Segunda', '08:00:00', '12:00:00', 1),
(2, 'Quarta', '08:00:00', '12:00:00', 1),
(2, 'Quinta', '13:00:00', '17:00:00', 1),
(2, 'Sábado', '13:00:00', '17:00:00', 1),
(3, 'Terça', '08:00:00', '12:00:00', 1),
(3, 'Quarta', '13:00:00', '17:00:00', 1),
(3, 'Sexta', '13:00:00', '17:00:00', 1),
(3, 'Sábado', '08:00:00', '12:00:00', 1),
(4, 'Segunda', '08:00:00', '12:00:00', 1),
(4, 'Terça', '13:00:00', '17:00:00', 1),
(4, 'Quinta', '13:00:00', '17:00:00', 1),
(4, 'Sexta', '08:00:00', '12:00:00', 1),
(5, 'Segunda', '13:00:00', '17:00:00', 1),
(5, 'Quarta', '13:00:00', '17:00:00', 1),
(5, 'Quinta', '08:00:00', '12:00:00', 1),
(5, 'Sábado', '08:00:00', '12:00:00', 1),
(6, 'Terça', '13:00:00', '17:00:00', 1),
(6, 'Quarta', '08:00:00', '12:00:00', 1),
(6, 'Sexta', '08:00:00', '12:00:00', 1),
(6, 'Sábado', '13:00:00', '17:00:00', 1),
(7, 'Segunda', '13:00:00', '17:00:00', 1),
(7, 'Terça', '08:00:00', '12:00:00', 1),
(7, 'Quinta', '08:00:00', '12:00:00', 1),
(7, 'Sexta', '13:00:00', '17:00:00', 1),
(8, 'Segunda', '08:00:00', '12:00:00', 1),
(8, 'Quarta', '08:00:00', '12:00:00', 1),
(8, 'Quinta', '13:00:00', '17:00:00', 1),
(8, 'Sábado', '13:00:00', '17:00:00', 1),
(9, 'Terça', '08:00:00', '12:00:00', 1),
(9, 'Quarta', '13:00:00', '17:00:00', 1),
(9, 'Sexta', '13:00:00', '17:00:00', 1),
(9, 'Sábado', '08:00:00', '12:00:00', 1),
(10, 'Segunda', '08:00:00', '12:00:00', 1),
(10, 'Terça', '13:00:00', '17:00:00', 1),
(10, 'Quinta', '13:00:00', '17:00:00', 1),
(10, 'Sexta', '08:00:00', '12:00:00', 1),
(11, 'Segunda', '13:00:00', '17:00:00', 1),
(11, 'Quarta', '13:00:00', '17:00:00', 1),
(11, 'Quinta', '08:00:00', '12:00:00', 1),
(11, 'Sábado', '08:00:00', '12:00:00', 1),
(12, 'Terça', '13:00:00', '17:00:00', 1),
(12, 'Quarta', '08:00:00', '12:00:00', 1),
(12, 'Sexta', '08:00:00', '12:00:00', 1),
(12, 'Sábado', '13:00:00', '17:00:00', 1),
(13, 'Segunda', '13:00:00', '17:00:00', 1),
(13, 'Terça', '08:00:00', '12:00:00', 1),
(13, 'Quinta', '08:00:00', '12:00:00', 1),
(13, 'Sexta', '13:00:00', '17:00:00', 1),
(14, 'Segunda', '08:00:00', '12:00:00', 1),
(14, 'Quarta', '08:00:00', '12:00:00', 1),
(14, 'Quinta', '13:00:00', '17:00:00', 1),
(14, 'Sábado', '13:00:00', '17:00:00', 1),
(15, 'Terça', '08:00:00', '12:00:00', 1),
(15, 'Quarta', '13:00:00', '17:00:00', 1),
(15, 'Sexta', '13:00:00', '17:00:00', 1),
(15, 'Sábado', '08:00:00', '12:00:00', 1),
(16, 'Segunda', '08:00:00', '12:00:00', 1),
(16, 'Terça', '13:00:00', '17:00:00', 1),
(16, 'Quinta', '13:00:00', '17:00:00', 1),
(16, 'Sexta', '08:00:00', '12:00:00', 1),
(17, 'Segunda', '13:00:00', '17:00:00', 1),
(17, 'Quarta', '13:00:00', '17:00:00', 1),
(17, 'Quinta', '08:00:00', '12:00:00', 1),
(17, 'Sábado', '08:00:00', '12:00:00', 1),
(18, 'Terça', '13:00:00', '17:00:00', 1),
(18, 'Quarta', '08:00:00', '12:00:00', 1),
(18, 'Sexta', '08:00:00', '12:00:00', 1),
(18, 'Sábado', '13:00:00', '17:00:00', 1),
(19, 'Segunda', '13:00:00', '17:00:00', 1),
(19, 'Terça', '08:00:00', '12:00:00', 1),
(19, 'Quinta', '08:00:00', '12:00:00', 1),
(19, 'Sexta', '13:00:00', '17:00:00', 1),
(20, 'Segunda', '08:00:00', '12:00:00', 1),
(20, 'Quarta', '08:00:00', '12:00:00', 1),
(20, 'Quinta', '13:00:00', '17:00:00', 1),
(20, 'Sábado', '13:00:00', '17:00:00', 1);

-- ============================================================
-- DADOS: BLOQUEIOS
-- ============================================================
INSERT INTO bloqueios_agenda
(id_professor, data_inicio, data_fim, motivo)
VALUES
(1, '2026-08-20 12:00:00', '2026-08-20 13:00:00', 'Intervalo institucional'),
(2, '2026-08-21 12:00:00', '2026-08-21 14:00:00', 'Reunião de colegiado'),
(5, '2026-08-22 12:00:00', '2026-08-22 17:00:00', 'Compromisso externo'),
(8, '2026-08-25 08:00:00', '2026-08-25 12:00:00', 'Capacitação docente'),
(13, '2026-08-27 13:00:00', '2026-08-27 17:00:00', 'Reunião acadêmica'),
(20, '2026-09-03 08:00:00', '2026-09-03 12:00:00', 'Atividade institucional');

-- ============================================================
-- CONFERÊNCIA DOS DADOS
-- ============================================================
SELECT 'Alunos' AS tabela, COUNT(*) AS quantidade FROM alunos
UNION ALL
SELECT 'Professores', COUNT(*) FROM professores
UNION ALL
SELECT 'Tipos de atendimento', COUNT(*) FROM tipos_atendimento
UNION ALL
SELECT 'Agendamentos', COUNT(*) FROM agendamento
UNION ALL
SELECT 'Disponibilidades', COUNT(*) FROM disponibilidades_professores
UNION ALL
SELECT 'Bloqueios', COUNT(*) FROM bloqueios_agenda;

-- Exemplos úteis para conferir os relacionamentos:
SELECT
    a.id_agendamento,
    DATE_FORMAT(a.data_agendamento, '%d/%m/%Y') AS data,
    TIME_FORMAT(a.horario, '%H:%i') AS horario,
    al.nome_aluno AS aluno,
    p.nome_professor AS professor,
    ta.nome_tipo_atendimento AS atendimento,
    a.status_agendamento AS status
FROM agendamento a
JOIN alunos al ON al.id_aluno = a.id_aluno
JOIN professores p ON p.id_professor = a.id_professor
JOIN tipos_atendimento ta ON ta.id_tipo_atendimento = a.id_tipo_atendimento
ORDER BY a.data_agendamento, a.horario;
