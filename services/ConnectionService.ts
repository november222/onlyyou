import { supabase } from '@/lib/supabase';
import AuthService from '@/services/AuthService';

export interface PartnerInfo {
  partnerId?: string;
  partnerName?: string;
  partnerAvatarUrl?: string | null;
}

/**
 * Fetch partner info (id, name, avatar_url) from connections + users tables.
 * Prefers roomCode; requires current user to be user1 or user2 in the row.
 */
export async function getPartnerInfoFromConnections(roomCode?: string): Promise<PartnerInfo | null> {
  try {
    const currentUserId = AuthService.getAuthState().user?.id;
    if (!currentUserId) return null;

    if (!roomCode) return null;

    const { data: conn, error } = await supabase
      .from('connections')
      .select('id, room_code, user1_id, user2_id, user1_name, user2_name')
      .eq('room_code', roomCode)
      .maybeSingle();

    if (error || !conn) return null;

    let partnerId: string | undefined;
    let partnerName: string | undefined;
    if (conn.user1_id === currentUserId) {
      partnerId = conn.user2_id || undefined;
      partnerName = conn.user2_name || undefined;
    } else if (conn.user2_id === currentUserId) {
      partnerId = conn.user1_id || undefined;
      partnerName = conn.user1_name || undefined;
    } else {
      // Current user not part of this room row
      return null;
    }

    let partnerAvatarUrl: string | null | undefined = null;
    if (partnerId) {
      const { data: user, error: userErr } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', partnerId)
        .maybeSingle();
      if (!userErr && user) {
        partnerAvatarUrl = user.avatar_url ?? null;
      }
    }

    return { partnerId, partnerName, partnerAvatarUrl: partnerAvatarUrl ?? null };
  } catch (e) {
    console.error('getPartnerInfoFromConnections failed:', e);
    return null;
  }
}

