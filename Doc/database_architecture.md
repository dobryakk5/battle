# Архитектура базы данных

Ниже представлена архитектура (структура) базы данных для системы судейства танцевальных соревнований.

## Основные сущности

### 1. **Users (Пользователи / Судьи / Главный судья)**
- **id** (PK)
- **name**
- **role** (admin, judge)
- **telegram_id** (для авторизации в боте)

### 2. **Events (События / Конкурсы)**
- **id** (PK)
- **title**
- **date**
- **location**

### 3. **Categories (Категории участников)**
- **id** (PK)
- **event_id** (FK → Events)
- **name** (например, "Любители начинающие", "Профессионалы", "Мастера", "Дебютанты")
- **type** (amateur, pro, master, debut)

### 4. **Participants (Участники)**
- **id** (PK)
- **event_id** (FK → Events)
- **category_id** (FK → Categories)
- **first_name**
- **last_name**
- **role** (leader, follower, couple?)
- **number** (номер на соревнованиях)

### 5. **Rounds (Раунды / Этапы)**
- **id** (PK)
- **event_id** (FK → Events)
- **category_id** (FK → Categories)
- **round_type** (preliminary, semifinal, final)
- **stage_format** (1-8, 1-4, 1-2, final)

### 6. **Heats (Заходы)**
- **id** (PK)
- **round_id** (FK → Rounds)
- **heat_number**

### 7. **HeatParticipants (Участники в заходах)**
- **id** (PK)
- **heat_id** (FK → Heats)
- **participant_id** (FK → Participants)

### 8. **Criteria (Критерии оценки)**
- **id** (PK)
- **category_id** (FK → Categories)
- **name** (техника, музыкальность, взаимодействие, ведение/следование)
- **scale_min**
- **scale_max**

### 9. **Scores (Оценки судей)**
- **id** (PK)
- **round_id** (FK → Rounds)
- **participant_id** (FK → Participants)
- **judge_id** (FK → Users)
- **criterion_id** (FK → Criteria — если категория аматоры)
- **score** (0–10 или место 1–5)
- **heat_id** (опционально, если оценка в отборочных)

### 10. **FinalPlaces (Финальные места)**
(для профи и мастеров – после суммирования мест)
- **id** (PK)
- **round_id** (FK → Rounds)
- **participant_id** (FK → Participants)
- **place**
- **sum_places**

---

## Связи между сущностями

- **Events → Categories** (1 ко многим)
- **Events → Participants** (1 ко многим)
- **Categories → Participants** (1 ко многим)
- **Categories → Criteria** (1 ко многим)
- **Rounds → Heats** (1 ко многим)
- **Heats → HeatParticipants** (1 ко многим)
- **Participants → HeatParticipants** (1 ко многим)
- **Rounds → Scores** (1 ко многим)
- **Participants → Scores** (1 ко многим)
- **Criteria → Scores** (1 ко многим)
- **Users (judges) → Scores** (1 ко многим)

---

## Пример логики работы базы

### Отборочные (баллы 0–10)
- Judges → Scores (по каждому критерию)
- Round → Heats → HeatParticipants фиксируют, кто в каком заходе

### Финалы (любители, дебютанты)
- Judges → Scores по 3–4 критериям

### Финалы (профессионалы, мастера)
- Judges выставляют места → Scores
- Алгоритм суммирует места → FinalPlaces

---

Если хочешь — могу добавить:
- ER-диаграмму в виде ASCII или как изображение,
- SQL-скрипт `CREATE TABLE` для всей базы,
- нормализацию (1NF–3NF),
- или оптимизацию под высокую нагрузку.

