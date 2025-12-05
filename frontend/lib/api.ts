export type Criterion = {
  id: number;
  name: string;
  scale_min: number;
  scale_max: number;
};

export type Category = {
  id: number;
  name: string;
  type: string;
  criteria: Criterion[];
};

export type Competition = {
  id: number;
  title: string;
  date?: string | null;
  location?: string | null;
  categories: Category[];
};

export type CompetitionPayload = {
  title: string;
  date?: string | null;
  location?: string | null;
};

export type Round = {
  id: number;
  event_id: number;
  category_id: number;
  round_type: string;
  stage_format?: string | null;
};

export type RoundPayload = {
  event_id: number;
  category_id: number;
  round_type: string;
  stage_format?: string | null;
};

export type HeatStatus = "waiting" | "in_progress" | "finished";

export type HeatParticipant = {
  participant_id: number;
  participant_name: string;
};

export type Heat = {
  id: number;
  heat_number: number;
  status: HeatStatus;
  participants: HeatParticipant[];
};

export type HeatDetail = Heat & {
  round_id: number;
  round_type: string;
  event_id: number;
  event_title: string;
  category_id: number;
  category_name: string;
  criteria: Criterion[];
};

export type Participant = {
  id: number;
  first_name: string;
  last_name: string;
  number?: number | null;
  role?: string | null;
  gender?: "male" | "female" | null;
};

export type ParticipantPayload = {
  full_name: string;
  number?: number | null;
  role?: string | null;
  gender: "male" | "female";
  category_id: number;
};

export type ParticipantUpdatePayload = {
  full_name?: string;
  number?: number | null;
  role?: string | null;
  gender?: "male" | "female";
  category_id?: number;
};

export type CategoryPayload = {
  competitionId: number;
  name: string;
  type: string;
  criteria: string[];
};

export type ScorePayload = {
  participant_id: number;
  judge_id: number;
  round_id: number;
  heat_id: number;
  criterion_id?: number | null;
  score: number;
};

export type Score = {
  id: number;
  participant_id: number;
  judge_id: number;
  round_id: number;
  heat_id: number | null;
  criterion_id: number | null;
  score: number;
};

export type HeatDistributionResponse = {
  status: string;
  round_id: number;
  heats_created: number;
};

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let detail = "Ошибка запроса к API";
    try {
      const payload = await response.json();
      if (payload?.detail) {
        detail = Array.isArray(payload.detail) ? payload.detail[0]?.msg ?? detail : payload.detail;
      }
    } catch {
      // fallback to status text
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export async function fetchCompetitions(): Promise<Competition[]> {
  return request<Competition[]>("/competitions");
}

export async function createCompetition(payload: CompetitionPayload): Promise<Competition> {
  return request<Competition>("/competitions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchRounds(eventId: number): Promise<Round[]> {
  return request<Round[]>(`/rounds?event_id=${eventId}`);
}

export async function createRound(payload: RoundPayload): Promise<Round> {
  return request<Round>("/rounds", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchCompetitionById(competitionId: number): Promise<Competition> {
  return request<Competition>(`/competitions/${competitionId}`);
}

export async function fetchRound(roundId: number): Promise<Round> {
  return request<Round>(`/rounds/${roundId}`);
}

export async function fetchHeats(roundId: number): Promise<Heat[]> {
  return request<Heat[]>(`/rounds/${roundId}/heats`);
}

export async function distributeHeats(roundId: number, maxInHeat: number) {
  return request<HeatDistributionResponse>(`/rounds/${roundId}/distribute`, {
    method: "POST",
    body: JSON.stringify({ max_in_heat: maxInHeat }),
  });
}

export async function updateHeatStatus(heatId: number, status: HeatStatus) {
  return request<{ id: number; status: HeatStatus }>(`/heats/${heatId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function createManualHeat(roundId: number, participantIds: number[]): Promise<Heat> {
  return request<Heat>(`/rounds/${roundId}/heats`, {
    method: "POST",
    body: JSON.stringify({ participant_ids: participantIds }),
  });
}

export async function updateManualHeat(
  roundId: number,
  heatId: number,
  participantIds: number[],
): Promise<Heat> {
  return request<Heat>(`/rounds/${roundId}/heats/${heatId}`, {
    method: "PUT",
    body: JSON.stringify({ participant_ids: participantIds }),
  });
}

export async function deleteHeat(roundId: number, heatId: number): Promise<void> {
  await request<void>(`/rounds/${roundId}/heats/${heatId}`, {
    method: "DELETE",
  });
}

export async function fetchScoresForHeat(heatId: number): Promise<Score[]> {
  return request<Score[]>(`/scores/heats/${heatId}`);
}

export async function fetchHeatDetail(heatId: number): Promise<HeatDetail> {
  return request<HeatDetail>(`/heats/${heatId}`);
}

export async function createParticipant(
  competitionId: number,
  payload: ParticipantPayload,
): Promise<Participant> {
  return request<Participant>(`/competitions/${competitionId}/participants`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchParticipants(
  competitionId: number,
  categoryId: number,
): Promise<Participant[]> {
  return request<Participant[]>(
    `/competitions/${competitionId}/participants?category_id=${categoryId}`,
  );
}

export async function updateParticipant(
  competitionId: number,
  participantId: number,
  payload: ParticipantUpdatePayload,
): Promise<Participant> {
  return request<Participant>(`/competitions/${competitionId}/participants/${participantId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  return request<Category>(`/competitions/${payload.competitionId}/categories`, {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      type: payload.type,
      criteria: payload.criteria,
    }),
  });
}

export async function submitScore(payload: ScorePayload) {
  return request("/scores", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type ScoreDetail = {
  id: number;
  score: number;
  judge_name: string;
  criterion_name: string | null;
  round_id: number;
  heat_id: number | null;
};

export type HeatDetailStats = {
  id: number;
  heat_number: number;
  status: HeatStatus;
  round_id: number;
  round_type: string;
  stage_format: string | null;
  category_name: string;
  event_title: string;
};

export type ParticipantStats = {
  id: number;
  first_name: string;
  last_name: string;
  number: number | null;
  role: string | null;
  gender: string | null;
  category_id: number;
  category_name: string;
  event_id: number;
  event_title: string;
  event_date: string | null;
  event_location: string | null;
  scores: ScoreDetail[];
  heats: HeatDetailStats[];
};

export async function fetchParticipantStats(participantId: number): Promise<ParticipantStats> {
  return request<ParticipantStats>(`/participants/${participantId}`);
}
