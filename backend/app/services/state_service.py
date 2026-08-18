from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException

from app.core.db import init_db, read_state, write_state
from app.schemas.state import (
    AddParticipantPayload,
    AppStateData,
    AuthLoginPayload,
    AuthRegisterPayload,
    CreateTournamentPayload,
    JoinTournamentPayload,
    OrganizerRequest,
    OrganizerRequestPayload,
    ResizeTournamentPayload,
    StateResponse,
    Tournament,
    UpdateMatchPayload,
    UpdateProfilePayload,
    User,
)
from app.services.state_logic import (
    build_tournament_structure,
    complete_match,
    copy_state,
    create_seed_data,
    create_tournament_cover,
    ensure_future_start,
    generate_id,
    generate_password,
    generate_public_id,
    generate_tournament_code,
    now_iso,
    recalculate_users,
)


class StateService:
    def __init__(self) -> None:
        init_db()
        snapshot = read_state()
        if snapshot is None:
            self.state = create_seed_data()
            self._save()
        else:
            self.state = recalculate_users(AppStateData.model_validate(snapshot))

    def _save(self) -> None:
        write_state(self.state.model_dump(mode="json"), now_iso())

    def _result(self, ok: bool = True, message: str | None = None, entity_id: str | None = None) -> StateResponse:
        self._save()
        return StateResponse(ok=ok, message=message, state=self.state, entityId=entity_id)

    def get_state(self) -> StateResponse:
        return StateResponse(ok=True, state=self.state)

    def reset_demo(self) -> StateResponse:
        self.state = create_seed_data()
        return self._result(message="Демо-состояние сброшено")

    def register(self, payload: AuthRegisterPayload) -> StateResponse:
        if any(user.email.lower() == payload.email.lower() for user in self.state.users):
            return self._result(False, "Пользователь с таким email уже существует")

        public_id = generate_public_id([user.publicId for user in self.state.users])
        source_ratings = self.state.users[0].disciplineRatings
        user = User(
            id=generate_id("user"),
            publicId=public_id,
            login=payload.login,
            email=payload.email,
            password=payload.password,
            avatar=payload.avatar or payload.login[:2].upper(),
            role="player",
            organizerStatus="not_requested",
            disciplineRatings=[rating.model_copy(update={"rating": 1200}) for rating in source_ratings],
        )
        next_state = copy_state(self.state)
        next_state.users.append(user)
        next_state.currentUserId = user.id
        self.state = recalculate_users(next_state)
        return self._result(entity_id=user.id)

    def login(self, payload: AuthLoginPayload) -> StateResponse:
        next_state = copy_state(self.state)
        if payload.identifier == "admin" and payload.password == "user":
          tournament = next((item for item in next_state.tournaments if item.id == payload.tournamentId), None)
          organizer_id = tournament.organizerId if tournament else next((user.id for user in next_state.users if user.role == "organizer"), None)
          if organizer_id is None:
              return self._result(False, "Организатор не найден")
          next_state.currentUserId = organizer_id
          self.state = next_state
          return self._result()

        user = next(
            (
                item
                for item in next_state.users
                if item.email.lower() == payload.identifier.lower() and item.password == payload.password
            ),
            None,
        )
        if user is None:
            return self._result(False, "Неверный email или пароль")
        next_state.currentUserId = user.id
        self.state = next_state
        return self._result()

    def logout(self) -> StateResponse:
        next_state = copy_state(self.state)
        next_state.currentUserId = None
        self.state = next_state
        return self._result()

    def request_organizer_access(self, payload: OrganizerRequestPayload) -> StateResponse:
        user = self._require_current_user()
        next_state = copy_state(self.state)
        organizer_request = OrganizerRequest(
            name=payload.name,
            contact=payload.contact,
            reason=payload.reason,
            status="pending",
            requestedAt=now_iso(),
        )
        for item in next_state.users:
            if item.id == user.id:
                item.organizerStatus = "pending"
                item.organizerRequest = organizer_request
        self.state = next_state
        return self._result()

    def approve_organizer_access(self) -> StateResponse:
        user = self._require_current_user()
        next_state = copy_state(self.state)
        for item in next_state.users:
            if item.id == user.id:
                item.role = "organizer"
                item.organizerStatus = "approved"
                if item.organizerRequest:
                    item.organizerRequest.status = "approved"
        self.state = next_state
        return self._result()

    def update_profile(self, payload: UpdateProfilePayload) -> StateResponse:
        user = self._require_current_user()
        next_state = copy_state(self.state)
        if any(item.login.lower() == payload.login.lower() and item.id != user.id for item in next_state.users):
            return self._result(False, "Такой логин уже занят")
        for item in next_state.users:
            if item.id == user.id:
                item.login = payload.login
        self.state = next_state
        return self._result()

    def create_tournament(self, payload: CreateTournamentPayload) -> StateResponse:
        user = self._require_current_user()
        if user.role != "organizer":
            return self._result(False, "Нет прав организатора")
        if not ensure_future_start(payload.startAt):
            return self._result(False, "Турнир должен начинаться минимум через 5 минут")

        next_state = copy_state(self.state)
        tournament = Tournament(
            id=generate_id("tournament"),
            code=generate_tournament_code([item.code for item in next_state.tournaments]),
            password=payload.password or generate_password(),
            title=payload.title,
            description=payload.description,
            discipline=payload.discipline,
            customDiscipline=payload.customDiscipline,
            format=payload.format,
            maxParticipants=payload.maxParticipants,
            prize=payload.prize,
            rules=payload.rules,
            startAt=payload.startAt,
            status="registration",
            organizerId=user.id,
            createdAt=now_iso(),
            cover=create_tournament_cover(payload.title),
        )
        tournament = build_tournament_structure(tournament)
        next_state.tournaments.insert(0, tournament)
        next_state.lastCreatedTournamentId = tournament.id
        self.state = recalculate_users(next_state)
        return self._result(entity_id=tournament.id)

    def join_tournament(self, tournament_id: str, payload: JoinTournamentPayload) -> StateResponse:
        user = self._require_current_user()
        next_state = copy_state(self.state)
        tournament = self._find_tournament(next_state, tournament_id)
        if tournament.status != "registration":
            return self._result(False, "Регистрация на турнир закрыта")
        if user.id in tournament.participantIds:
            return self._result(False, "Вы уже участвуете в этом турнире")
        if len(tournament.participantIds) >= tournament.maxParticipants:
            return self._result(False, "Свободных мест больше нет")
        if tournament.password != payload.password:
            return self._result(False, "Неверный пароль турнира")
        tournament.participantIds.append(user.id)
        build_tournament_structure(tournament, tournament.participantIds)
        self.state = recalculate_users(next_state)
        return self._result()

    def add_participant(self, tournament_id: str, payload: AddParticipantPayload) -> StateResponse:
        user = self._require_current_user()
        next_state = copy_state(self.state)
        tournament = self._find_tournament(next_state, tournament_id)
        if tournament.organizerId != user.id:
            return self._result(False, "Нет прав")
        if tournament.status != "registration":
            return self._result(False, "Турнир уже запущен")
        target = next((item for item in next_state.users if item.publicId.lower() == payload.publicId.lower()), None)
        if target is None:
            return self._result(False, "Пользователь не найден")
        if target.id in tournament.participantIds:
            return self._result(False, "Пользователь уже добавлен")
        if len(tournament.participantIds) >= tournament.maxParticipants:
            return self._result(False, "В турнире нет свободных мест")
        tournament.participantIds.append(target.id)
        build_tournament_structure(tournament, tournament.participantIds)
        self.state = recalculate_users(next_state)
        return self._result()

    def remove_participant(self, tournament_id: str, participant_user_id: str) -> StateResponse:
        user = self._require_current_user()
        next_state = copy_state(self.state)
        tournament = self._find_tournament(next_state, tournament_id)
        if tournament.organizerId != user.id:
            return self._result(False, "Нет прав")
        if tournament.status != "registration":
            return self._result(False, "Турнир уже запущен")
        tournament.participantIds = [item for item in tournament.participantIds if item != participant_user_id]
        build_tournament_structure(tournament, tournament.participantIds)
        self.state = recalculate_users(next_state)
        return self._result()

    def resize_tournament(self, tournament_id: str, payload: ResizeTournamentPayload) -> StateResponse:
        user = self._require_current_user()
        next_state = copy_state(self.state)
        tournament = self._find_tournament(next_state, tournament_id)
        if tournament.organizerId != user.id:
            return self._result(False, "Нет прав")
        if tournament.status != "registration":
            return self._result(False, "Турнир уже запущен")
        if len(tournament.participantIds) > payload.maxParticipants:
            return self._result(False, f"Невозможно уменьшить сетку до {payload.maxParticipants}. Сначала удалите лишних участников.")
        tournament.maxParticipants = payload.maxParticipants
        build_tournament_structure(tournament, tournament.participantIds)
        self.state = recalculate_users(next_state)
        return self._result()

    def start_tournament(self, tournament_id: str) -> StateResponse:
        user = self._require_current_user()
        next_state = copy_state(self.state)
        tournament = self._find_tournament(next_state, tournament_id)
        if tournament.organizerId != user.id:
            return self._result(False, "Нет прав")
        tournament.status = "ongoing"
        build_tournament_structure(tournament, tournament.participantIds)
        self.state = recalculate_users(next_state)
        return self._result()

    def update_match(self, tournament_id: str, match_id: str, payload: UpdateMatchPayload) -> StateResponse:
        user = self._require_current_user()
        next_state = copy_state(self.state)
        tournament = self._find_tournament(next_state, tournament_id)
        if tournament.organizerId != user.id:
            return self._result(False, "Нет прав")
        updated = complete_match(
            tournament,
            match_id,
            payload.player1Score,
            payload.player2Score,
            payload.winnerId,
            payload.loserId,
            payload.player1Team,
            payload.player2Team,
        )
        index = next_state.tournaments.index(tournament)
        next_state.tournaments[index] = updated
        self.state = recalculate_users(next_state)
        return self._result()

    def _require_current_user(self) -> User:
        if self.state.currentUserId is None:
            raise HTTPException(status_code=401, detail="Сначала войдите в аккаунт")
        user = next((item for item in self.state.users if item.id == self.state.currentUserId), None)
        if user is None:
            raise HTTPException(status_code=401, detail="Пользователь не найден")
        return user

    @staticmethod
    def _find_tournament(state: AppStateData, tournament_id: str) -> Tournament:
        tournament = next((item for item in state.tournaments if item.id == tournament_id), None)
        if tournament is None:
            raise HTTPException(status_code=404, detail="Турнир не найден")
        return tournament


state_service = StateService()
