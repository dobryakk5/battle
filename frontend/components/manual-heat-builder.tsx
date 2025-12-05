"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Participant, createManualHeat } from "../lib/api";

type Props = {
  roundId: number;
  participants: Participant[];
};

export function ManualHeatBuilder({ roundId, participants }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const availableParticipants = useMemo(
    () => participants.filter((participant) => !selectedIds.includes(participant.id)),
    [participants, selectedIds],
  );
  const selectedParticipants = useMemo(
    () => participants.filter((participant) => selectedIds.includes(participant.id)),
    [participants, selectedIds],
  );

  const handleAdd = (participantId: number) => {
    setSelectedIds((prev) => (prev.includes(participantId) ? prev : [...prev, participantId]));
  };

  const handleRemove = (participantId: number) => {
    setSelectedIds((prev) => prev.filter((id) => id !== participantId));
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setStatus("error");
      setMessage("Добавьте хотя бы одного участника");
      return;
    }

    setStatus("saving");
    setMessage(null);
    try {
      await createManualHeat(roundId, selectedIds);
      setSelectedIds([]);
      setStatus("success");
      setMessage("Заход создан. Перейдите назад, чтобы увидеть обновлённый список.");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Не удалось создать заход");
    }
  };

  return (
    <div className="material-card section-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="section-meta">
        <div>
          <h2 className="hero-title" style={{ fontSize: "1.6rem" }}>
            Ручное формирование захода
          </h2>
          <p className="text-muted text-small">
            Перенесите участников справа налево по одному. В новом заходе отображаются выбранные участники.
          </p>
        </div>
      </div>

      <div className="section-grid-three" style={{ gap: "1.5rem", alignItems: "stretch" }}>
        <div className="glass-panel" style={{ minHeight: "320px" }}>
          <h3 className="hero-title" style={{ fontSize: "1.1rem" }}>Все участники</h3>
          {availableParticipants.length === 0 ? (
            <p className="text-muted text-small">Все участники добавлены в список захода.</p>
          ) : (
            <ul className="text-small" style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              {availableParticipants.map((participant) => (
                <li
                  key={participant.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    padding: "0.4rem 0",
                  }}
                >
                  <span>
                    {participant.first_name} {participant.last_name}
                  </span>
                  <button
                    type="button"
                    className="material-button secondary"
                    style={{ padding: "0.25rem 0.75rem" }}
                    onClick={() => handleAdd(participant.id)}
                  >
                    →
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "center", alignItems: "center" }}>
          <p className="text-muted text-small">Выбрано: {selectedIds.length}</p>
          <button
            type="button"
            className="material-button primary"
            onClick={handleSave}
            disabled={status === "saving" || selectedIds.length === 0}
          >
            {status === "saving" ? "Сохраняем..." : "Сохранить заход"}
          </button>
        </div>

        <div className="glass-panel" style={{ minHeight: "320px" }}>
          <h3 className="hero-title" style={{ fontSize: "1.1rem" }}>Участники захода</h3>
          {selectedParticipants.length === 0 ? (
            <p className="text-muted text-small">Добавьте участников с левой стороны.</p>
          ) : (
            <ul className="text-small" style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              {selectedParticipants.map((participant) => (
                <li
                  key={`${participant.id}-selected`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    padding: "0.4rem 0",
                  }}
                >
                  <span>
                    {participant.first_name} {participant.last_name}
                  </span>
                  <button
                    type="button"
                    className="material-button secondary"
                    style={{ padding: "0.25rem 0.75rem" }}
                    onClick={() => handleRemove(participant.id)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {message && (
        <p className="text-small" style={{ color: status === "error" ? "#f87171" : "#34d399" }}>
          {message}
        </p>
      )}
    </div>
  );
}
