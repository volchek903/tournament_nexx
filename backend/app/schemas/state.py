from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


UserRole = Literal["player", "organizer"]
OrganizerRequestStatus = Literal["not_requested", "pending", "approved"]
Discipline = Literal[
    "football",
    "basketball",
    "volleyball",
    "tennis",
    "table_tennis",
    "hockey",
    "esports",
    "other",
]
TournamentFormat = Literal["single_elimination", "double_elimination", "groups_playoff"]
TournamentStatus = Literal["registration", "ongoing", "completed"]
MatchStatus = Literal["pending", "ready", "completed"]
MatchBracket = Literal["main", "winners", "losers", "grand_final"]


class PlayerStatistics(BaseModel):
    tournamentsPlayed: int = 0
    matchesPlayed: int = 0
    wins: int = 0
    losses: int = 0
    tournamentWins: int = 0
    bestPlace: int | None = None


class DisciplineRating(BaseModel):
    discipline: Discipline
    rating: int


class TournamentHistoryEntry(BaseModel):
    tournamentId: str
    title: str
    discipline: Discipline
    finishedAt: str
    place: int | None = None
    participantCount: int
    wins: int
    losses: int


class OrganizerRequest(BaseModel):
    name: str
    contact: str
    reason: str
    status: OrganizerRequestStatus
    requestedAt: str


class User(BaseModel):
    id: str
    publicId: str
    login: str
    email: str
    password: str
    avatar: str
    role: UserRole
    organizerStatus: OrganizerRequestStatus
    organizerRequest: OrganizerRequest | None = None
    statistics: PlayerStatistics = Field(default_factory=PlayerStatistics)
    disciplineRatings: list[DisciplineRating] = Field(default_factory=list)
    tournamentHistory: list[TournamentHistoryEntry] = Field(default_factory=list)


class TournamentMatch(BaseModel):
    id: str
    tournamentId: str
    bracket: MatchBracket
    round: int
    position: int
    label: str
    player1Id: str | None = None
    player2Id: str | None = None
    player1Team: str = ""
    player2Team: str = ""
    player1Score: int = 0
    player2Score: int = 0
    winnerId: str | None = None
    loserId: str | None = None
    status: MatchStatus = "pending"
    nextMatchId: str | None = None
    nextSlot: Literal[1, 2] | None = None


class TournamentRound(BaseModel):
    id: str
    title: str
    bracket: MatchBracket
    round: int
    matchIds: list[str] = Field(default_factory=list)


class TournamentGroupStanding(BaseModel):
    userId: str
    played: int
    wins: int
    losses: int
    points: int


class TournamentGroup(BaseModel):
    id: str
    title: str
    memberIds: list[str] = Field(default_factory=list)
    standings: list[TournamentGroupStanding] = Field(default_factory=list)


class Tournament(BaseModel):
    id: str
    code: str
    password: str
    title: str
    description: str
    discipline: Discipline
    customDiscipline: str = ""
    format: TournamentFormat
    maxParticipants: int
    participantIds: list[str] = Field(default_factory=list)
    prize: str = ""
    rules: str = ""
    startAt: str
    status: TournamentStatus
    organizerId: str
    rounds: list[TournamentRound] = Field(default_factory=list)
    matches: list[TournamentMatch] = Field(default_factory=list)
    groups: list[TournamentGroup] = Field(default_factory=list)
    championId: str | None = None
    createdAt: str
    cover: str = ""


class AppStateData(BaseModel):
    users: list[User]
    tournaments: list[Tournament]
    currentUserId: str | None = None
    lastCreatedTournamentId: str | None = None


class AuthRegisterPayload(BaseModel):
    login: str
    email: str
    password: str
    avatar: str | None = None


class AuthLoginPayload(BaseModel):
    identifier: str
    password: str
    tournamentId: str | None = None


class OrganizerRequestPayload(BaseModel):
    name: str
    contact: str
    reason: str


class UpdateProfilePayload(BaseModel):
    login: str


class CreateTournamentPayload(BaseModel):
    title: str
    discipline: Discipline
    customDiscipline: str = ""
    format: TournamentFormat
    maxParticipants: int
    description: str
    prize: str = ""
    rules: str = ""
    startAt: str
    password: str


class JoinTournamentPayload(BaseModel):
    password: str


class AddParticipantPayload(BaseModel):
    publicId: str


class ResizeTournamentPayload(BaseModel):
    maxParticipants: int


class UpdateMatchPayload(BaseModel):
    player1Score: int
    player2Score: int
    winnerId: str
    loserId: str | None = None
    player1Team: str = ""
    player2Team: str = ""


class StateResponse(BaseModel):
    ok: bool
    message: str | None = None
    state: AppStateData
    entityId: str | None = None
