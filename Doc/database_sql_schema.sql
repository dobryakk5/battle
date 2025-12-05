-- SQL schema for dance competition judging system
-- Using PostgreSQL syntax

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin','judge')),
    telegram_id BIGINT UNIQUE
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE,
    location TEXT
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('amateur','pro','master','debut'))
);

CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('leader','follower','couple')),
    number INT
);

CREATE TABLE rounds (
    id SERIAL PRIMARY KEY,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    round_type TEXT CHECK (round_type IN ('preliminary','semifinal','final')),
    stage_format TEXT
);

CREATE TABLE heats (
    id SERIAL PRIMARY KEY,
    round_id INT REFERENCES rounds(id) ON DELETE CASCADE,
    heat_number INT NOT NULL
);

CREATE TABLE heat_participants (
    id SERIAL PRIMARY KEY,
    heat_id INT REFERENCES heats(id) ON DELETE CASCADE,
    participant_id INT REFERENCES participants(id) ON DELETE CASCADE
);

CREATE TABLE criteria (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    scale_min INT DEFAULT 0,
    scale_max INT DEFAULT 10
);

CREATE TABLE scores (
    id SERIAL PRIMARY KEY,
    round_id INT REFERENCES rounds(id) ON DELETE CASCADE,
    participant_id INT REFERENCES participants(id) ON DELETE CASCADE,
    judge_id INT REFERENCES users(id) ON DELETE CASCADE,
    criterion_id INT REFERENCES criteria(id) ON DELETE CASCADE,
    score INT,
    heat_id INT REFERENCES heats(id)
);

CREATE TABLE final_places (
    id SERIAL PRIMARY KEY,
    round_id INT REFERENCES rounds(id) ON DELETE CASCADE,
    participant_id INT REFERENCES participants(id) ON DELETE CASCADE,
    place INT,
    sum_places INT
);

-- FUNCTION: calculate final places for pro/master categories
CREATE OR REPLACE FUNCTION calc_final_places(p_round_id INT) RETURNS VOID AS $$
BEGIN
    DELETE FROM final_places WHERE round_id = p_round_id;

    INSERT INTO final_places (round_id, participant_id, sum_places, place)
    SELECT
        p_round_id,
        participant_id,
        SUM(score) AS sum_places,
        RANK() OVER (ORDER BY SUM(score)) AS place
    FROM scores
    WHERE round_id = p_round_id
    GROUP BY participant_id
    ORDER BY sum_places;
END;
$$ LANGUAGE plpgsql;
