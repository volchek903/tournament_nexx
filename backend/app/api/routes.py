from fastapi import APIRouter

from app.schemas.state import (
    AddParticipantPayload,
    AuthLoginPayload,
    AuthRegisterPayload,
    CreateTournamentPayload,
    JoinTournamentPayload,
    OrganizerRequestPayload,
    ResizeTournamentPayload,
    StateResponse,
    UpdateMatchPayload,
    UpdateProfilePayload,
)
from app.services.state_service import state_service

router = APIRouter(prefix="/api")


@router.get("/state", response_model=StateResponse)
def get_state() -> StateResponse:
    return state_service.get_state()


@router.post("/auth/register", response_model=StateResponse)
def register(payload: AuthRegisterPayload) -> StateResponse:
    return state_service.register(payload)


@router.post("/auth/login", response_model=StateResponse)
def login(payload: AuthLoginPayload) -> StateResponse:
    return state_service.login(payload)


@router.post("/auth/logout", response_model=StateResponse)
def logout() -> StateResponse:
    return state_service.logout()


@router.post("/organizer/request", response_model=StateResponse)
def request_organizer(payload: OrganizerRequestPayload) -> StateResponse:
    return state_service.request_organizer_access(payload)


@router.post("/organizer/approve", response_model=StateResponse)
def approve_organizer() -> StateResponse:
    return state_service.approve_organizer_access()


@router.patch("/users/me", response_model=StateResponse)
def update_profile(payload: UpdateProfilePayload) -> StateResponse:
    return state_service.update_profile(payload)


@router.post("/tournaments", response_model=StateResponse)
def create_tournament(payload: CreateTournamentPayload) -> StateResponse:
    return state_service.create_tournament(payload)


@router.post("/tournaments/{tournament_id}/join", response_model=StateResponse)
def join_tournament(tournament_id: str, payload: JoinTournamentPayload) -> StateResponse:
    return state_service.join_tournament(tournament_id, payload)


@router.post("/tournaments/{tournament_id}/participants", response_model=StateResponse)
def add_participant(tournament_id: str, payload: AddParticipantPayload) -> StateResponse:
    return state_service.add_participant(tournament_id, payload)


@router.delete("/tournaments/{tournament_id}/participants/{participant_user_id}", response_model=StateResponse)
def remove_participant(tournament_id: str, participant_user_id: str) -> StateResponse:
    return state_service.remove_participant(tournament_id, participant_user_id)


@router.post("/tournaments/{tournament_id}/resize", response_model=StateResponse)
def resize_tournament(tournament_id: str, payload: ResizeTournamentPayload) -> StateResponse:
    return state_service.resize_tournament(tournament_id, payload)


@router.post("/tournaments/{tournament_id}/start", response_model=StateResponse)
def start_tournament(tournament_id: str) -> StateResponse:
    return state_service.start_tournament(tournament_id)


@router.post("/tournaments/{tournament_id}/matches/{match_id}", response_model=StateResponse)
def update_match(tournament_id: str, match_id: str, payload: UpdateMatchPayload) -> StateResponse:
    return state_service.update_match(tournament_id, match_id, payload)


@router.post("/demo/reset", response_model=StateResponse)
def reset_demo() -> StateResponse:
    return state_service.reset_demo()
