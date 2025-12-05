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
  const [role, setRole] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editRole, setEditRole] = useState("");
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
        role: role || undefined,
        gender,
      });
      setStatus("success");
      setFullName("");
      setNumber("");
      setRole("");
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
    setEditRole(participant.role ?? "");
    setEditGender((participant.gender as "male" | "female") ?? "male");
    setEditStatus("idle");
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFullName("");
    setEditNumber("");
    setEditRole("");
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
        role: editRole || null,
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
    <div className="section-card" style={{ gap: "0.75rem" }}>
      {!lockedCompetition && competitions.length === 0 && (
        <p className="text-muted">Сначала создайте соревнование.</p>
      )}

      {!lockedCompetition && competitions.length > 0 && (
        <>
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
            }}
          >
            {competitions.map((competition) => (
              <option key={competition.id} value={competition.id}>
                {competition.title}
              </option>
            ))}
          </select>
        </>
      )}

      <label className="text-small text-muted" htmlFor="category">
        Категория
      </label>
      <select
        id="category"
        className="glass-panel"
        value={categoryId}
        onChange={(event) => setCategoryId(Number(event.target.value))}
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(2,6,23,0.8)",
          color: "#fff",
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
        }}
      />

      <div className="section-grid-two">
        <label className="text-small text-muted" htmlFor="number">
          Номер (опционально)
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
              marginTop: "0.35rem",
            }}
          />
        </label>
        <label className="text-small text-muted" htmlFor="role">
          Роль
          <input
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="например, leader"
            style={{
              borderRadius: "1rem",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(3, 7, 18, 0.8)",
              color: "#fff",
              padding: "0.7rem 1rem",
              marginTop: "0.35rem",
            }}
          />
        </label>
      </div>

      <button
        type="button"
        className="material-button primary"
        style={{ width: "100%" }}
        onClick={handleSubmit}
        disabled={status === "saving"}
      >
        {status === "saving" ? "Сохраняем..." : "Добавить участника"}
      </button>

      {status === "success" && <p className="text-small" style={{ color: "#34d399" }}>Участник добавлен.</p>}
      {status === "error" && error ? <p className="text-small" style={{ color: "#f87171" }}>{error}</p> : null}

      <div className="glass-panel section-card">
        <h3 className="hero-title" style={{ fontSize: "1.2rem" }}>
          Участники — {categories.find((category) => category.id === categoryId)?.name ?? "Категория"}
        </h3>
        {participants.length === 0 ? (
          <p className="text-muted text-small">В этой категории пока нет участников.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#94a3b8" }}>
                <th style={{ padding: "0.5rem 0" }}>#</th>
                <th style={{ padding: "0.5rem 0" }}>Имя</th>
                <th style={{ padding: "0.5rem 0" }}>Номер</th>
                <th style={{ padding: "0.5rem 0" }}>Роль</th>
                <th style={{ padding: "0.5rem 0" }}>Пол</th>
                <th style={{ padding: "0.5rem 0" }}></th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant) => {
                const isEditing = editingId === participant.id;
                return (
                  <tr key={participant.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <td style={{ padding: "0.4rem 0" }}>{participant.id}</td>
                    <td style={{ padding: "0.4rem 0" }}>
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
                            padding: "0.3rem 0.6rem",
                          }}
                        />
                      ) : (
                        <>
                          {participant.first_name} {participant.last_name}
                        </>
                      )}
                    </td>
                    <td style={{ padding: "0.4rem 0" }}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editNumber}
                          onChange={(event) => setEditNumber(event.target.value)}
                          style={{
                            width: "100%",
                            borderRadius: "0.75rem",
                            border: "1px solid rgba(255,255,255,0.2)",
                            background: "rgba(3, 7, 18, 0.7)",
                            color: "#fff",
                            padding: "0.3rem 0.6rem",
                          }}
                        />
                      ) : (
                        participant.number ?? "—"
                      )}
                    </td>
                    <td style={{ padding: "0.4rem 0" }}>
                      {isEditing ? (
                        <input
                          value={editRole}
                          onChange={(event) => setEditRole(event.target.value)}
                          placeholder="роль"
                          style={{
                            width: "100%",
                            borderRadius: "0.75rem",
                            border: "1px solid rgba(255,255,255,0.2)",
                            background: "rgba(3, 7, 18, 0.7)",
                            color: "#fff",
                            padding: "0.3rem 0.6rem",
                          }}
                        />
                      ) : (
                        participant.role ?? "—"
                      )}
                    </td>
                    <td style={{ padding: "0.4rem 0" }}>
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
                    <td style={{ padding: "0.4rem 0", minWidth: "120px" }}>
                      {isEditing ? (
                        <div className="button-row">
                          <button
                            className="material-button primary"
                            style={{ padding: "0.3rem 0.8rem" }}
                            onClick={saveEdit}
                            disabled={editStatus === "saving"}
                          >
                            Сохранить
                          </button>
                          <button
                            className="material-button secondary"
                            style={{ padding: "0.3rem 0.8rem" }}
                            onClick={cancelEdit}
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          className="material-button secondary"
                          style={{ padding: "0.3rem 0.8rem" }}
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
