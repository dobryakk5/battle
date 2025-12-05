# Автоматическое распределение участников по заходам

Документ содержит:
- SQL‑процедуру распределения участников по заходам
- новые API‑эндпоинты
- логику доступов (кто нажимает кнопку)
- поведение системы

---

# 1. Кто может нажимать кнопку распределения?
**Роль:** только *главный судья* (`role = admin`).

Причины:
- только главный судья знает точный формат турнира
- распределение влияет на весь раунд
- требуется контроль, чтобы судьи не нажимали кнопку случайно

---

# 2. Логика работы распределения
При нажатии кнопки:
1. Берутся все участники заданного раунда.
2. Определяется желаемое количество участников в заходе:
   - либо задаётся вручную (например, 7, 8, 10)
   - либо передаётся через API.
3. Система создаёт нужное количество заходов.
4. Участники равномерно распределяются по заходам:
   - например, 30 человек при лимите 8 → 4 захода: 8, 8, 7, 7.
5. Существующие заходы очищаются и создаются новые.

---

# 3. SQL-процедура распределения
```
-- Процедура распределения участников по заходам
CREATE OR REPLACE FUNCTION distribute_heats(
    p_round_id INT,
    p_max_in_heat INT
) RETURNS VOID AS $$
DECLARE
    participant_ids INT[];
    total INT;
    heat_count INT;
    heat_idx INT := 1;
    i INT;
    start_index INT;
    end_index INT;
    new_heat_id INT;
BEGIN
    -- Все участники раунда
    SELECT ARRAY_AGG(id ORDER BY id)
    INTO participant_ids
    FROM participants
    WHERE category_id = (SELECT category_id FROM rounds WHERE id = p_round_id);

    total := array_length(participant_ids, 1);
    IF total IS NULL OR total = 0 THEN RETURN; END IF;

    -- Кол-во заходов
    heat_count := CEIL(total::NUMERIC / p_max_in_heat);

    -- Очистка старых заходов
    DELETE FROM heat_participants WHERE heat_id IN (SELECT id FROM heats WHERE round_id = p_round_id);
    DELETE FROM heats WHERE round_id = p_round_id;

    -- Создание и заполнение заходов
    FOR i IN 1..heat_count LOOP
        INSERT INTO heats (round_id, heat_number) VALUES (p_round_id, i) RETURNING id INTO new_heat_id;

        start_index := (i - 1) * p_max_in_heat + 1;
        end_index := LEAST(i * p_max_in_heat, total);

        INSERT INTO heat_participants (heat_id, participant_id)
        SELECT new_heat_id, participant_ids[idx]
        FROM generate_subscripts(participant_ids, 1) AS idx
        WHERE idx BETWEEN start_index AND end_index;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

# 4. Новые API эндпоинты

## 4.1 POST /rounds/{round_id}/distribute
Запускает распределение участников по заходам.

**Доступ:** только `admin`.

### Request
```
{
  "max_in_heat": 8
}
```

### Response
```
{
  "status": "ok",
  "round_id": 12,
  "heats_created": 4
}
```

---

## 4.2 GET /rounds/{round_id}/heats
Получение списка сформированных заходов.

### Response
```
{
  "round_id": 12,
  "heats": [
    {"heat_id": 1, "heat_number": 1, "participants": [5,7,9,11,13,15,18,20]},
    {"heat_id": 2, "heat_number": 2, "participants": [4,6,8,10,12,14,16,19]}
  ]
}
```

---

# 5. UI / Bot — кнопка
В интерфейсе главного судьи должна быть кнопка:

**«Сформировать заходы»**

После нажатия:
- запрос на POST /rounds/{round_id}/distribute
- бот спрашивает: «Сколько человек в одном заходе?»
- главный судья вводит число
- выполняется распределение

---

Если хочешь, могу добавить:
- равномерную случайную ротацию участников
- запрет повторяющихся пар
- AFC (avoid former couple) алгоритм
- UI-сценарий для Telegram‑бота


## Role-Based Access
- **Admin (Главный судья):** создание раундов, распределение по заходам, управление категориями, завершение раундов.
- **Judge (Судья):** просмотр заходов, выставление оценок, редактирование собственных оценок.

## Bot-Only Functions
Некоторые функции могут выполняться только через Telegram-бота:
- Быстрое выставление оценок.
- Переключение между заходами.
- Нотификации о начале раунда.
- Подтверждение готовности судьи.

