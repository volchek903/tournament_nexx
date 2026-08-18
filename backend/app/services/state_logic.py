from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime, timedelta
from math import log2
from random import randint
from uuid import uuid4

from app.schemas.state import (
    AppStateData,
    Discipline,
    DisciplineRating,
    MatchBracket,
    OrganizerRequest,
    OrganizerRequestPayload,
    PlayerStatistics,
    Tournament,
    TournamentGroup,
    TournamentGroupStanding,
    TournamentHistoryEntry,
    TournamentMatch,
    TournamentRound,
    TournamentStatus,
    User,
)


DISCIPLINES: list[tuple[Discipline, str]] = [
    ("football", "Футбол"),
    ("basketball", "Баскетбол"),
    ("volleyball", "Волейбол"),
    ("tennis", "Теннис"),
    ("table_tennis", "Настольный теннис"),
    ("hockey", "Хоккей"),
    ("esports", "Киберспорт"),
    ("other", "Другое"),
]


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def generate_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:8]}"


def generate_tournament_code(existing: list[str]) -> str:
    while True:
        code = uuid4().hex[:6].upper()
        if code not in existing:
            return code


def generate_public_id(existing: list[str]) -> str:
    while True:
        public_id = f"PL-{randint(100000, 999999)}"
        if public_id not in existing:
            return public_id


def generate_password() -> str:
    return f"PLAY{randint(1000, 9999)}"


def create_tournament_cover(label: str) -> str:
    return f"linear-gradient(135deg, rgba(59,130,246,0.24), rgba(124,58,237,0.34)), {label}"


def create_match(tournament_id: str, bracket: MatchBracket, round_number: int, position: int, total_rounds: int) -> TournamentMatch:
    if total_rounds == 1 or round_number == total_rounds:
        label = "Финал"
    elif round_number == total_rounds - 1:
        label = "Полуфинал"
    elif round_number == total_rounds - 2:
        label = "Четвертьфинал"
    else:
        label = f"Раунд {round_number}"

    if bracket != "main":
      label = f"{bracket} {round_number}"

    return TournamentMatch(
        id=generate_id("match"),
        tournamentId=tournament_id,
        bracket=bracket,
        round=round_number,
        position=position,
        label=label,
    )


def distribute_participants(size: int, participant_ids: list[str]) -> list[tuple[str | None, str | None]]:
    first_round_matches = max(1, size // 2)
    participant_count = min(len(participant_ids), size)
    full_matches = max(0, participant_count - first_round_matches)
    singles = participant_count - full_matches * 2
    pairs: list[tuple[str | None, str | None]] = []
    cursor = 0

    for _ in range(full_matches):
        pairs.append((participant_ids[cursor], participant_ids[cursor + 1]))
        cursor += 2

    for _ in range(singles):
        pairs.append((participant_ids[cursor], None))
        cursor += 1

    while len(pairs) < first_round_matches:
        pairs.append((None, None))

    return pairs


def resolve_byes(matches: list[TournamentMatch]) -> None:
    matches_by_id = {match.id: match for match in matches}
    changed = True

    while changed:
        changed = False
        for match in matches:
            if match.status == "completed":
                continue

            player1_id = match.player1Id
            player2_id = match.player2Id
            if (player1_id and player2_id) or (not player1_id and not player2_id):
                continue

            winner_id = player1_id or player2_id
            if winner_id is None:
                continue

            match.winnerId = winner_id
            match.loserId = None
            match.status = "completed"
            changed = True

            if match.nextMatchId:
                next_match = matches_by_id.get(match.nextMatchId)
                if next_match:
                    if match.nextSlot == 1:
                        next_match.player1Id = winner_id
                    elif match.nextSlot == 2:
                        next_match.player2Id = winner_id
                    if next_match.player1Id and next_match.player2Id and next_match.status != "completed":
                        next_match.status = "ready"


def build_single_elimination(tournament_id: str, size: int, participant_ids: list[str]) -> tuple[list[TournamentRound], list[TournamentMatch]]:
    total_rounds = int(log2(size))
    rounds: list[TournamentRound] = []
    matches: list[TournamentMatch] = []
    round_buckets: list[list[TournamentMatch]] = []

    for round_number in range(1, total_rounds + 1):
        count = size // (2 ** round_number)
        bucket: list[TournamentMatch] = []
        for position in range(count):
            match = create_match(tournament_id, "main", round_number, position, total_rounds)
            bucket.append(match)
            matches.append(match)
        round_buckets.append(bucket)
        rounds.append(
            TournamentRound(
                id=generate_id("round"),
                title=bucket[0].label if bucket else f"Раунд {round_number}",
                bracket="main",
                round=round_number,
                matchIds=[item.id for item in bucket],
            )
        )

    for round_index in range(len(round_buckets) - 1):
        for index, match in enumerate(round_buckets[round_index]):
            next_match = round_buckets[round_index + 1][index // 2]
            match.nextMatchId = next_match.id
            match.nextSlot = 1 if index % 2 == 0 else 2

    if round_buckets:
        for match, (player1_id, player2_id) in zip(round_buckets[0], distribute_participants(size, participant_ids), strict=False):
            match.player1Id = player1_id
            match.player2Id = player2_id
            match.status = "ready" if match.player1Id and match.player2Id else "pending"
        resolve_byes(matches)

    return rounds, matches


def build_groups(tournament: Tournament) -> list[TournamentGroup]:
    group_count = max(2, min(4, tournament.maxParticipants // 4))
    groups: list[TournamentGroup] = []
    for group_index in range(group_count):
        member_ids = [user_id for index, user_id in enumerate(tournament.participantIds) if index % group_count == group_index]
        groups.append(
            TournamentGroup(
                id=generate_id("group"),
                title=f"Группа {chr(65 + group_index)}",
                memberIds=member_ids,
                standings=[
                    TournamentGroupStanding(
                        userId=user_id,
                        played=0,
                        wins=0,
                        losses=0,
                        points=max(len(member_ids) - index, 0),
                    )
                    for index, user_id in enumerate(member_ids)
                ],
            )
        )
    return groups


def build_tournament_structure(tournament: Tournament, participant_ids: list[str] | None = None) -> Tournament:
    participant_ids = participant_ids if participant_ids is not None else tournament.participantIds
    rounds, matches = build_single_elimination(tournament.id, tournament.maxParticipants, participant_ids)
    groups: list[TournamentGroup] = []

    if tournament.format == "double_elimination":
        rounds.extend(
            [
                TournamentRound(id=generate_id("round"), title="Loser Bracket", bracket="losers", round=1, matchIds=[]),
                TournamentRound(id=generate_id("round"), title="Grand Final", bracket="grand_final", round=len(rounds) + 1, matchIds=[]),
            ]
        )
    elif tournament.format == "groups_playoff":
        groups = build_groups(deepcopy(tournament))

    tournament.rounds = rounds
    tournament.matches = matches
    tournament.groups = groups
    tournament.participantIds = participant_ids
    return tournament


def compute_history_entry(tournament: Tournament, user_id: str) -> TournamentHistoryEntry:
    completed_matches = [
        match
        for match in tournament.matches
        if match.status == "completed" and (match.player1Id == user_id or match.player2Id == user_id)
    ]
    wins = len([match for match in completed_matches if match.winnerId == user_id])
    losses = len([match for match in completed_matches if match.loserId == user_id])
    place = 1 if tournament.championId == user_id else (2 if wins > 0 else None)
    return TournamentHistoryEntry(
        tournamentId=tournament.id,
        title=tournament.title,
        discipline=tournament.discipline,
        finishedAt=tournament.startAt,
        place=place,
        participantCount=len(tournament.participantIds),
        wins=wins,
        losses=losses,
    )


def recalculate_users(state: AppStateData) -> AppStateData:
    finished_tournaments = [tournament for tournament in state.tournaments if tournament.status == "completed"]
    next_users: list[User] = []

    for user in state.users:
        stats = PlayerStatistics()
        history = [compute_history_entry(tournament, user.id) for tournament in finished_tournaments if user.id in tournament.participantIds]

        for entry in history:
            stats.tournamentsPlayed += 1
            stats.matchesPlayed += entry.wins + entry.losses
            stats.wins += entry.wins
            stats.losses += entry.losses
            if entry.place == 1:
                stats.tournamentWins += 1
            if entry.place and (stats.bestPlace is None or entry.place < stats.bestPlace):
                stats.bestPlace = entry.place

        discipline_ratings = []
        for item in user.disciplineRatings:
            discipline_history = [entry for entry in history if entry.discipline == item.discipline]
            rating = 1200
            for entry in discipline_history:
                place_bonus = 70 if entry.place == 1 else 30 if entry.place == 2 else 10
                rating += entry.wins * 12 - entry.losses * 6 + place_bonus
            discipline_ratings.append(DisciplineRating(discipline=item.discipline, rating=rating))

        next_users.append(
            user.model_copy(
                update={
                    "statistics": stats,
                    "disciplineRatings": discipline_ratings,
                    "tournamentHistory": history,
                }
            )
        )

    state.users = next_users
    return state


def create_seed_data() -> AppStateData:
    base_users = [
        "AlexPro",
        "MaxStorm",
        "DenisPlay",
        "Frost",
        "Titan",
        "Wolf",
        "Sova",
        "Vortex",
        "Leon",
        "Urban",
        "Rush",
        "NextLevel",
    ]
    avatars = ["AX", "MS", "DP", "FR", "TT", "WF", "SV", "VX", "LN", "UR", "RS", "NL"]

    users = []
    for index, login in enumerate(base_users):
        users.append(
            User(
                id=f"user_{index + 1}",
                publicId=f"PL-{483921 + index}",
                login=login,
                email=f"{login.lower()}@demo.app",
                password="user" if index == 0 else "demo123",
                avatar=avatars[index],
                role="organizer" if index == 0 else "player",
                organizerStatus="approved" if index == 0 else "not_requested",
                disciplineRatings=[DisciplineRating(discipline=value, rating=1200 + randint(0, 180)) for value, _ in DISCIPLINES],
            )
        )

    organizer_id = users[0].id
    user_ids = [user.id for user in users]

    def tournament_base(
        id_: str,
        title: str,
        discipline: Discipline,
        format_: str,
        max_participants: int,
        participant_ids: list[str],
        start_at: datetime,
        status: TournamentStatus,
        description: str,
        prize: str,
    ) -> Tournament:
        label = dict(DISCIPLINES).get(discipline, title)
        tournament = Tournament(
            id=id_,
            code=id_[-6:].upper(),
            password="PLAY2026",
            title=title,
            description=description,
            discipline=discipline,
            format=format_,
            maxParticipants=max_participants,
            participantIds=participant_ids,
            prize=prize,
            rules="Матч проходит до двух побед.",
            startAt=start_at.isoformat(),
            status=status,
            organizerId=organizer_id,
            createdAt=(start_at - timedelta(days=5)).isoformat(),
            cover=create_tournament_cover(label),
        )
        return build_tournament_structure(tournament, participant_ids)

    future = tournament_base(
        "summer_football",
        "Summer Football Cup",
        "football",
        "single_elimination",
        16,
        user_ids[:10],
        datetime.now(UTC) + timedelta(days=2),
        "registration",
        "Приватный футбольный турнир для друзей и локального комьюнити.",
        "200 BYN",
    )
    ongoing = tournament_base(
        "street_basket",
        "Street Basketball Night",
        "basketball",
        "double_elimination",
        8,
        user_ids[:8],
        datetime.now(UTC) + timedelta(hours=5),
        "ongoing",
        "Вечерний баскетбольный турнир с короткими матчами.",
        "Сертификат MVP",
    )
    if len(ongoing.matches) > 1:
        ongoing.matches[0].player1Id = user_ids[0]
        ongoing.matches[0].player2Id = user_ids[1]
        ongoing.matches[0].status = "ready"
        ongoing.matches[1].player1Id = user_ids[2]
        ongoing.matches[1].player2Id = user_ids[3]
        ongoing.matches[1].status = "ready"

    completed = tournament_base(
        "cyber_weekend",
        "Cyber Weekend",
        "esports",
        "single_elimination",
        16,
        user_ids,
        datetime.now(UTC) - timedelta(days=7),
        "completed",
        "Киберспортивный уикенд для быстрых серий playoff.",
        "500 BYN",
    )
    for index, match in enumerate(completed.matches):
        if match.round == 1:
            p1 = completed.participantIds[index * 2] if index * 2 < len(completed.participantIds) else None
            p2 = completed.participantIds[index * 2 + 1] if index * 2 + 1 < len(completed.participantIds) else None
            match.player1Id = p1
            match.player2Id = p2
            match.player1Score = 2
            match.player2Score = 1
            match.winnerId = p1
            match.loserId = p2
            match.status = "completed"
    completed.championId = completed.participantIds[0]

    groups = tournament_base(
        "volley_friends",
        "Volleyball Friends Cup",
        "volleyball",
        "groups_playoff",
        8,
        user_ids[4:12],
        datetime.now(UTC) + timedelta(days=4),
        "registration",
        "Групповой этап для друзей и финальный playoff.",
        "Кубок и медали",
    )

    state = AppStateData(
        users=users,
        tournaments=[future, ongoing, completed, groups],
        currentUserId=None,
        lastCreatedTournamentId=None,
    )
    return recalculate_users(state)


def complete_match(tournament: Tournament, match_id: str, player1_score: int, player2_score: int, winner_id: str, loser_id: str | None, player1_team: str = "", player2_team: str = "") -> Tournament:
    matches = [match.model_copy(deep=True) for match in tournament.matches]
    completed = next((match for match in matches if match.id == match_id), None)
    if not completed:
        return tournament

    completed.player1Score = player1_score
    completed.player2Score = player2_score
    completed.winnerId = winner_id
    completed.loserId = loser_id
    completed.player1Team = player1_team
    completed.player2Team = player2_team
    completed.status = "completed"

    if completed.nextMatchId and completed.winnerId:
        next_match = next((match for match in matches if match.id == completed.nextMatchId), None)
        if next_match:
            if completed.nextSlot == 1:
                next_match.player1Id = completed.winnerId
            elif completed.nextSlot == 2:
                next_match.player2Id = completed.winnerId
            if next_match.player1Id and next_match.player2Id:
                next_match.status = "ready"

    championship_match = next((match for match in matches if match.nextMatchId is None), None)
    champion_id = tournament.championId
    status = tournament.status
    if championship_match and championship_match.status == "completed" and championship_match.winnerId:
        champion_id = championship_match.winnerId
        status = "completed"

    return tournament.model_copy(update={"matches": matches, "championId": champion_id, "status": status})


def ensure_future_start(start_at: str) -> bool:
    try:
        start = datetime.fromisoformat(start_at.replace("Z", "+00:00"))
    except ValueError:
        return False
    return start.timestamp() - datetime.now(UTC).timestamp() >= 300


def copy_state(state: AppStateData) -> AppStateData:
    return AppStateData.model_validate(deepcopy(state.model_dump()))
