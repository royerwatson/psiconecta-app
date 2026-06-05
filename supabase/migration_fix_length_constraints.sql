-- =============================================================
-- migration_fix_length_constraints.sql
-- Añade restricciones de longitud máxima en campos de texto libre.
--
-- Sin estos CHECK constraints, un input malicioso puede enviar
-- payloads enormes causando DoS o acumulación excesiva de datos.
-- Las longitudes fueron calibradas para uso clínico real.
-- =============================================================

-- messages: contenido de chat
ALTER TABLE messages
  ADD CONSTRAINT messages_content_length
    CHECK (length(content) BETWEEN 1 AND 10000);

-- clinical_history: campos clínicos
ALTER TABLE clinical_history
  ADD CONSTRAINT clinical_diagnosis_length
    CHECK (diagnosis IS NULL OR length(diagnosis) <= 5000),
  ADD CONSTRAINT clinical_treatment_length
    CHECK (treatment_plan IS NULL OR length(treatment_plan) <= 10000),
  ADD CONSTRAINT clinical_notes_length
    CHECK (session_notes IS NULL OR length(session_notes) <= 10000);

-- patient_tasks: tareas asignadas al paciente
ALTER TABLE patient_tasks
  ADD CONSTRAINT tasks_title_length
    CHECK (length(title) BETWEEN 1 AND 300),
  ADD CONSTRAINT tasks_description_length
    CHECK (description IS NULL OR length(description) <= 3000);

-- ai_checkins: respuestas del check-in de bienestar
ALTER TABLE ai_checkins
  ADD CONSTRAINT checkin_qa_length
    CHECK (questions_answers IS NULL OR length(questions_answers) <= 5000),
  ADD CONSTRAINT checkin_message_length
    CHECK (ai_message IS NULL OR length(ai_message) <= 2000);

-- reviews: comentarios de reseñas
ALTER TABLE reviews
  ADD CONSTRAINT reviews_comment_length
    CHECK (comment IS NULL OR length(comment) <= 2000);

-- therapist_profiles: bio
ALTER TABLE therapist_profiles
  ADD CONSTRAINT tp_bio_length
    CHECK (bio IS NULL OR length(bio) <= 3000);
