"use client";

import { useState } from "react";

import { Criterion, HeatParticipant, HeatStatus } from "../lib/api";
import { ScoreForm, SubmittedScore } from "./score-form";

type Props = {
  heatId: number;
  roundId: number;
  participants: HeatParticipant[];
  criteria: Criterion[];
  defaultJudgeId: number;
  initialStatus: HeatStatus;
  initialSubmitted: Record<number, SubmittedScore>;
};

export function JudgeHeatScoringPanel({
  heatId,
  roundId,
  participants,
  criteria,
  defaultJudgeId,
  initialStatus,
  initialSubmitted,
}: Props) {
  const [submitted, setSubmitted] = useState<Record<number, SubmittedScore>>(initialSubmitted);

  const handleSubmitted = (entry: SubmittedScore) =>
    setSubmitted((prev) => ({ ...prev, [entry.participantId]: entry }));

  return (
    <section className="section-grid-two" style={{ gridTemplateColumns: "minmax(240px, 1fr) 2fr" }}>
      <article className="glass-panel section-card">
        <h2 className="hero-title" style={{ fontSize: "1.4rem" }}>
          Участники
        </h2>
        {participants.length === 0 ? (
          <p className="text-muted text-small">Список участников пуст.</p>
        ) : (
          <ul className="text-muted" style={{ paddingLeft: "1.2rem", listStyle: "disc" }}>
            {participants.map((participant) => (
              <li
                key={participant.participant_id}
                style={{
                  marginBottom: "0.4rem",
                  color: submitted[participant.participant_id] ? "#6ee7b7" : undefined,
                }}
              >
                {participant.participant_name}
              </li>
            ))}
          </ul>
        )}
      </article>

      <ScoreForm
        heatId={heatId}
        roundId={roundId}
        participants={participants}
        criteria={criteria}
        defaultJudgeId={defaultJudgeId}
        initialStatus={initialStatus}
        submitted={submitted}
        onSubmitted={handleSubmitted}
      />
    </section>
  );
}
