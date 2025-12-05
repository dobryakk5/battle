"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Competition,
  Participant,
  createParticipant,
  fetchParticipants,
  updateParticipant,
} from "../lib/api";

type Props =
  | { competition: Competition; competitions?: never }
  | { competitions: Competition[]; competition?: never };

export function ParticipantForm(props: Props) {
  const lockedCompetition = "competition" in props ? props.competition : undefined;
  const competitions = lockedCompetition ? [lockedCompetition] : props.competitions ?? [];
  const [competitionId, setCompetitionId] = useState(
    lockedCompetition?.id ?? competitions[0]?.id ?? 0,
  );

  const categories = useMemo(() => {
    if (lockedCompetition) return lockedCompetition.categories;
    return competitions.find((item) => item.id === competitionId)?.categories ?? [];
  }, [competitions, competitionId, lockedCompetition]);

  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id ?? 0);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [fullName, setFullName] = useState("");
  const [number, setNumber] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editGender, setEditGender] = useState<"male" | "female">("male");
  const [editStatus, setEditStatus] = useState<"idle" | "saving" | "error">("idle");
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setCategoryId(categories[0]?.id ?? 0);
  }, [categories]);

  useEffect(() => {
    if (!competitionId || !categoryId) {
      setParticipants([]);
      return;
    }
    fetchParticipants(competitionId, categoryId)
      .then(setParticipants)
      .catch(() => setParticipants([]));
  }, [competitionId, categoryId]);

  const handleCompetitionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newCompetitionId = Number(event.target.value);
    setCompetitionId(newCompetitionId);
    const defaultCategoryId =
      competitions.find((item) => item.id === newCompetitionId)?.categories[0]?.id ?? 0;
    setCategoryId(defaultCategoryId);
  };

  const handleSubmit = async () => {
    if (!competitionId || !categoryId) {
      setError("Выберите категорию");
      setStatus("error");
      return;
    }
    if (!fullName.trim()) {
      setError("Введите имя и фамилию");
      setStatus("error");
      return;
    }

    setStatus("saving");
    setError(null);
    try {
      await createParticipant(competitionId, {
        full_name: fullName.trim(),
        category_id: categoryId,
        number: number ? Number(number) : undefined,
        gender,
      });
      setStatus("success");
      setFullName("");
      setNumber("");
      setGender("male");
      const updated = await fetchParticipants(competitionId, categoryId);
      setParticipants(updated);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Не удалось создать участника");
    }
  };

  const startEdit = (participant: Participant) => {
    setEditingId(participant.id);
    setEditFullName(`${participant.first_name} ${participant.last_name}`.trim());
    setEditNumber(participant.number?.toString() ?? "");
    setEditGender((participant.gender as "male" | "female") ?? "male");
    setEditStatus("idle");
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFullName("");
    setEditNumber("");
    setEditGender("male");
    setEditStatus("idle");
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editFullName.trim()) {
      setEditError("Введите имя и фамилию");
      setEditStatus("error");
      return;
    }

    setEditStatus("saving");
    setEditError(null);
    try {
      await updateParticipant(competitionId, editingId, {
        full_name: editFullName.trim(),
        number: editNumber ? Number(editNumber) : null,
        gender: editGender,
      });
      const updated = await fetchParticipants(competitionId, categoryId);
      setParticipants(updated);
      cancelEdit();
    } catch (err) {
      setEditStatus("error");
      setEditError(err instanceof Error ? err.message : "Не удалось обновить участника");
    }
  };

  return (
    <div className="section-card" style={{ gap: "1.5rem", padding: "2rem" }}>
      {!lockedCompetition && competitions.length === 0 && (
        <p className="text-muted">Сначала создайте соревнование.</p>
      )}

      {!lockedCompetition && competitions.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <label className="text-small text-muted" htmlFor="competition">
            Соревнование
          </label>
          <select
            id="competition"
            className="glass-panel"
            value={competitionId}
            onChange={handleCompetitionChange}
            style={{
              borderRadius: "1rem",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(2,6,23,0.8)",
              color: "#fff",
              marginTop: "0.5rem",
              padding: "0.7rem 1rem",
            }}
          >
            {competitions.map((competition) => (
              <option key={competition.id} value={competition.id}>
                {competition.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="section-grid-two" style={{ gap: "2rem", marginBottom: "0.5rem" }}>
        <div>
          <label className="text-small text-muted" htmlFor="fullName">
            Имя и фамилия
          </label>
          <input
            id="fullName"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Иван Петров"
            style={{
              borderRadius: "1rem",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(3, 7, 18, 0.8)",
              color: "#fff",
              padding: "0.7rem 1rem",
              marginTop: "0.5rem",
              width: "100%",
            }}
          />
        </div>
        <div>
          <label className="text-small text-muted" htmlFor="category-select">
            Категория
          </label>
          <select
            id="category-select"
            className="glass-panel"
            value={categoryId}
            onChange={(event) => setCategoryId(Number(event.target.value))}
            style={{
              borderRadius: "1rem",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(2,6,23,0.8)",
              color: "#fff",
              marginTop: "0.5rem",
              padding: "0.7rem 1rem",
              width: "100%",
            }}
            disabled={categories.length === 0}
          >
            {categories.length === 0 ? (
              <option>Категории отсутствуют</option>
            ) : (
              categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="section-grid-two" style={{ gap: "2rem", marginBottom: "1rem" }}>
        <div>
          <label className="text-small text-muted">
            Пол
          </label>
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "1.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="radio"
                name="gender"
                value="male"
                checked={gender === "male"}
                onChange={() => setGender("male")}
                style={{ cursor: "pointer", width: "18px", height: "18px" }}
              />
              <span>Муж</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="radio"
                name="gender"
                value="female"
                checked={gender === "female"}
                onChange={() => setGender("female")}
                style={{ cursor: "pointer", width: "18px", height: "18px" }}
              />
              <span>Жен</span>
            </label>
          </div>
        </div>
        <div>
          <label className="text-small text-muted" htmlFor="number">
            Номер
          </label>
          <input
            id="number"
            type="number"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            style={{
              borderRadius: "1rem",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(3, 7, 18, 0.8)",
              color: "#fff",
              padding: "0.7rem 1rem",
              marginTop: "0.5rem",
              width: "100%",
              maxWidth: "90px",
            }}
          />
        </div>
      </div>

      <button
        type="button"
        className="material-button primary"
        style={{ width: "100%", marginTop: "0.5rem", padding: "0.85rem 1.5rem", fontSize: "1rem" }}
        onClick={handleSubmit}
        disabled={status === "saving"}
      >
        {status === "saving" ? "Сохраняем..." : "Добавить участника"}
      </button>

      {status === "success" && <p className="text-small" style={{ color: "#34d399", marginTop: "0.5rem" }}>Участник добавлен.</p>}
      {status === "error" && error ? <p className="text-small" style={{ color: "#f87171", marginTop: "0.5rem" }}>{error}</p> : null}

      <div className="glass-panel section-card" style={{ marginTop: "2rem", padding: "2rem" }}>
        <h3 className="hero-title" style={{ fontSize: "1.2rem", marginBottom: "1.5rem" }}>
          Участники — {categories.find((category) => category.id === categoryId)?.name ?? "Категория"}
        </h3>
        {participants.length === 0 ? (
          <p className="text-muted text-small">В этой категории пока нет участников.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#94a3b8" }}>
                <th style={{ padding: "1rem 0.5rem", paddingLeft: "0" }}>#</th>
                <th style={{ padding: "1rem 0.5rem" }}>Имя</th>
                <th style={{ padding: "1rem 0.5rem" }}>Номер</th>
                <th style={{ padding: "1rem 0.5rem" }}>Пол</th>
                <th style={{ padding: "1rem 0.5rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant) => {
                const isEditing = editingId === participant.id;
                return (
                  <tr key={participant.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <td style={{ padding: "1rem 0.5rem", paddingLeft: "0" }}>{participant.id}</td>
                    <td style={{ padding: "1rem 0.5rem" }}>
                      {isEditing ? (
                        <input
                          value={editFullName}
                          onChange={(event) => setEditFullName(event.target.value)}
                          style={{
                            width: "100%",
                            borderRadius: "0.75rem",
                            border: "1px solid rgba(255,255,255,0.2)",
                            background: "rgba(3, 7, 18, 0.7)",
                            color: "#fff",
                            padding: "0.6rem 0.9rem",
                          }}
                        />
                      ) : (
                        <>
                          {participant.first_name} {participant.last_name}
                        </>
                      )}
                    </td>
                    <td style={{ padding: "1rem 0.5rem" }}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editNumber}
                          onChange={(event) => setEditNumber(event.target.value)}
                          style={{
                            width: "100%",
                            maxWidth: "80px",
                            borderRadius: "0.75rem",
                            border: "1px solid rgba(255,255,255,0.2)",
                            background: "rgba(3, 7, 18, 0.7)",
                            color: "#fff",
                            padding: "0.6rem 0.9rem",
                          }}
                        />
                      ) : (
                        participant.number ?? "—"
                      )}
                    </td>
                    <td style={{ padding: "1rem 0.5rem" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <input
                              type="radio"
                              name={`gender-${participant.id}`}
                              value="male"
                              checked={editGender === "male"}
                              onChange={() => setEditGender("male")}
                            />
                            Муж
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <input
                              type="radio"
                              name={`gender-${participant.id}`}
                              value="female"
                              checked={editGender === "female"}
                              onChange={() => setEditGender("female")}
                            />
                            Жен
                          </label>
                        </div>
                      ) : participant.gender ? (
                        participant.gender === "male" ? "Муж" : "Жен"
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ padding: "1rem 0.5rem", minWidth: "140px" }}>
                      {isEditing ? (
                        <div className="button-row" style={{ gap: "0.5rem" }}>
                          <button
                            className="material-button primary"
                            style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                            onClick={saveEdit}
                            disabled={editStatus === "saving"}
                          >
                            Сохранить
                          </button>
                          <button
                            className="material-button secondary"
                            style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                            onClick={cancelEdit}
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          className="material-button secondary"
                          style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                          onClick={() => startEdit(participant)}
                        >
                          Изменить
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {editStatus === "error" && editError ? (
          <p className="text-small" style={{ color: "#f87171" }}>{editError}</p>
        ) : null}
      </div>
    </div>
  );
}
