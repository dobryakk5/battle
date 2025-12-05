"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createCompetition } from "../lib/api";

export function CreateCompetitionButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Название обязательно");
      return;
    }

    setStatus("saving");
    setError(null);
    try {
      const competition = await createCompetition({
        title: title.trim(),
        date: date || undefined,
        location: location || undefined,
      });
      setStatus("idle");
      setIsOpen(false);
      setTitle("");
      setDate("");
      setLocation("");
      router.push(`/battle/${competition.id}`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Не удалось создать соревнование");
    }
  };

  if (!isOpen) {
    return (
      <button className="material-button primary" onClick={() => setIsOpen(true)}>
        Создать
      </button>
    );
  }

  return (
    <div className="material-card section-card" style={{ maxWidth: "380px" }}>
      <label className="text-small text-muted" htmlFor="newTitle">
        Название
      </label>
      <input
        id="newTitle"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Battle of the Year"
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(3, 7, 18, 0.8)",
          color: "#fff",
          padding: "0.7rem 1rem",
        }}
      />

      <label className="text-small text-muted" htmlFor="newDate">
        Дата
      </label>
      <input
        id="newDate"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(3, 7, 18, 0.8)",
          color: "#fff",
          padding: "0.7rem 1rem",
        }}
      />

      <label className="text-small text-muted" htmlFor="newLocation">
        Локация
      </label>
      <input
        id="newLocation"
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        placeholder="Москва"
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(3, 7, 18, 0.8)",
          color: "#fff",
          padding: "0.7rem 1rem",
        }}
      />

      <div className="button-row" style={{ justifyContent: "flex-end" }}>
        <button className="material-button secondary" onClick={() => setIsOpen(false)}>
          Отмена
        </button>
        <button
          className="material-button primary"
          onClick={handleSubmit}
          disabled={status === "saving"}
        >
          {status === "saving" ? "Создаём..." : "Создать"}
        </button>
      </div>
      {status === "error" && error ? (
        <p className="text-small" style={{ color: "#f87171" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
