import { supabase } from '@/lib/supabase';
import type { Match, TournamentParticipant } from '@/types/database';

interface WorkingMatch {
  id: string;
  round: number;
  match_number: number;
  next_match_id: string | null;
  participant1_id: string | null;
  participant2_id: string | null;
  status: string;
  winner_id: string | null;
}

export async function generateBracket(
  tournamentId: string,
  participants: TournamentParticipant[],
  bracketSize: number
) {
  const size = Math.max(2, bracketSize);
  const totalRounds = Math.log2(size);

  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const slots: (string | null)[] = Array.from({ length: size }, (_, i) => shuffled[i]?.id ?? null);

  const roundMatchIds: string[][] = [];

  for (let r = totalRounds; r >= 1; r--) {
    const count = size / Math.pow(2, r);
    const ids: string[] = [];
    for (let m = 0; m < count; m++) {
      const nextMatchId = r === totalRounds ? null : roundMatchIds[0][Math.floor(m / 2)];
      const { data, error } = await supabase
        .from('matches')
        .insert({
          tournament_id: tournamentId,
          round: r,
          match_number: m,
          next_match_id: nextMatchId,
          status: 'pending',
        })
        .select('id')
        .single();
      if (error) throw error;
      ids.push(data.id);
    }
    roundMatchIds.unshift(ids);
  }

  const round1Ids = roundMatchIds[0];
  for (let m = 0; m < round1Ids.length; m++) {
    const { error } = await supabase
      .from('matches')
      .update({ participant1_id: slots[2 * m], participant2_id: slots[2 * m + 1] })
      .eq('id', round1Ids[m]);
    if (error) throw error;
  }

  const { data: allMatches, error: fetchError } = await supabase
    .from('matches')
    .select('id, round, match_number, next_match_id, participant1_id, participant2_id, status, winner_id')
    .eq('tournament_id', tournamentId);
  if (fetchError) throw fetchError;

  const resolved = resolveByes(allMatches as WorkingMatch[]);

  for (const m of resolved) {
    const { error } = await supabase
      .from('matches')
      .update({
        participant1_id: m.participant1_id,
        participant2_id: m.participant2_id,
        status: m.status,
        winner_id: m.winner_id,
      })
      .eq('id', m.id);
    if (error) throw error;
  }
}

function resolveByes(matches: WorkingMatch[]): WorkingMatch[] {
  const byId = new Map(matches.map((m) => [m.id, { ...m }]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const m of byId.values()) {
      if (m.status === 'completed') continue;
      const p1 = m.participant1_id;
      const p2 = m.participant2_id;
      if ((p1 && !p2) || (!p1 && p2)) {
        const winner = p1 ?? p2;
        m.status = 'completed';
        m.winner_id = winner;
        changed = true;
        if (m.next_match_id) {
          const next = byId.get(m.next_match_id);
          if (next) {
            if (m.match_number % 2 === 0) next.participant1_id = winner;
            else next.participant2_id = winner;
          }
        }
      }
    }
  }
  return Array.from(byId.values());
}

export async function advanceWinner(match: Match, winnerId: string, loserId: string | null) {
  const { error } = await supabase
    .from('matches')
    .update({ winner_id: winnerId, status: 'completed' })
    .eq('id', match.id);
  if (error) throw error;

  if (loserId) {
    await supabase.from('tournament_participants').update({ status: 'eliminated' }).eq('id', loserId);
  }

  if (match.next_match_id) {
    const slotField = match.match_number % 2 === 0 ? 'participant1_id' : 'participant2_id';
    await supabase
      .from('matches')
      .update({ [slotField]: winnerId })
      .eq('id', match.next_match_id);
  } else {
    await supabase.from('tournament_participants').update({ status: 'winner' }).eq('id', winnerId);
    await supabase.from('tournaments').update({ status: 'completed' }).eq('id', match.tournament_id);
  }
}
