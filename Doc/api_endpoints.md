# API эндпоинты (черновик)

## 1. Авторизация и пользователи
**POST /auth/login** — вход по логину/паролю или коду.
**POST /auth/telegram** — привязка Telegram ID.
**GET /users/me** — получить профиль текущего пользователя.
**POST /users** — создать судью/секретаря/админа.
**GET /users** — список пользователей.
**PATCH /users/{id}** — обновить данные пользователя.

---

## 2. Соревнования
**POST /competitions** — создать соревнование.
**GET /competitions** — список соревнований.
**GET /competitions/{id}** — получить данные соревнования.
**PATCH /competitions/{id}** — обновление настроек.

---

## 3. Категории и критерии
**POST /competitions/{id}/categories** — создать категорию.
**GET /competitions/{id}/categories** — список категорий.
**PATCH /categories/{id}** — обновить категорию.
**POST /categories/{id}/criteria** — добавить критерии.

---

## 4. Участники
**POST /competitions/{id}/participants** — создание участника.
**GET /competitions/{id}/participants** — список участников.
**PATCH /participants/{id}** — обновить данные.

---

## 5. Заходы (Heats)
**POST /categories/{id}/heats/auto** — автоматическое распределение.
**POST /categories/{id}/heats** — создать заход вручную.
**GET /categories/{id}/heats** — список заходов.
**GET /heats/{id}** — данные конкретного захода.
**PATCH /heats/{id}** — обновить состав.
**POST /heats/{id}/lock** — зафиксировать оценки.

---

## 6. Оценки (Scores)
**POST /scores** — сохранить оценки судьи.
**GET /heats/{id}/scores** — получить оценки по заходу.
**GET /participants/{id}/scores** — все оценки участника.

---

## 7. Финалы (места для профи/мастеров)
**POST /final/places** — сохранить место судьи.
**GET /final/{category_id}/results** — итоговое ранжирование.

---

## 8. Экспорт
**GET /export/competition/{id}/excel** — экспорт Excel.
**GET /export/competition/{id}/pdf** — PDF.
**POST /export/google/{id}** — выгрузка в Google Sheets.

---

## 9. Технические эндпоинты
**GET /health** — статус сервера.
**GET /version** — версия API.


## JSON-схемы запросов и ответов

### 1. Judges
#### POST /judges — создать судью
**Request:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "role": "main|side|observer",
  "categories": ["hiphop", "popping", "breaking"]
}
```
**Response:**
```json
{
  "id": "string",
  "first_name": "string",
  "last_name": "string",
  "role": "main|side|observer",
  "categories": ["string"]
}
```

#### PATCH /judges/{id}
**Request:**
```json
{
  "first_name": "string?",
  "last_name": "string?",
  "role": "string?",
  "categories": ["string"]?
}
```
**Response:** — как при GET

---

### 2. Categories
#### POST /categories
**Request:**
```json
{
  "name": "string",
  "age_group": "kids|teens|adults|pro",
  "style": "hiphop|popping|breaking|allstyles"
}
```
**Response:**
```json
{
  "id": "string",
  "name": "string",
  "age_group": "string",
  "style": "string"
}
```

---

### 3. Athletes
#### POST /athletes
**Request:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "team": "string?",
  "country": "string",
  "age": 0,
  "categories": ["string"]
}
```
**Response:**
```json
{
  "id": "string",
  "first_name": "string",
  "last_name": "string",
  "team": "string|null",
  "country": "string",
  "age": 0,
  "categories": ["string"]
}
```

---

### 4. Scores / оценки
#### POST /scores
**Request:**
```json
{
  "athlete_id": "string",
  "judge_id": "string",
  "category_id": "string",
  "round": "preselect|top16|top8|semis|final",
  "criteria": {
    "technique": 0,
    "musicality": 0,
    "originality": 0,
    "presence": 0
  }
}
```
**Response:**
```json
{
  "id": "string",
  "athlete_id": "string",
  "judge_id": "string",
  "category_id": "string",
  "round": "string",
  "criteria": {
    "technique": 0,
    "musicality": 0,
    "originality": 0,
    "presence": 0
  },
  "total": 0
}
```

---

### 5. Results
#### GET /results/{categoryId}
**Response:**
```json
{
  "category_id": "string",
  "category_name": "string",
  "rounds": [
    {
      "round": "string",
      "athletes": [
        {
          "athlete_id": "string",
          "name": "string",
          "total_score": 0,
          "placement": 1
        }
      ]
    }
  ]
}
```
