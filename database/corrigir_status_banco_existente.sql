USE aga_agendamentos;

-- Corrige dados antigos gerados com o status 'Agendado'.
UPDATE agendamento
SET status_agendamento = 'Pendente'
WHERE status_agendamento = 'Agendado';
