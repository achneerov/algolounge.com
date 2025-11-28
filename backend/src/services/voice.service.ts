import { db } from "../db";
import { voiceSessions, NewVoiceSession, VoiceSession } from "../db/models/voice-sessions";
import { voiceParticipants, NewVoiceParticipant, VoiceParticipant } from "../db/models/voice-participants";
import { eq, and } from "drizzle-orm";

export class VoiceService {
  // Create a new voice session
  async createSession(
    name: string,
    createdByUserId: number
  ): Promise<VoiceSession> {
    const result = await db
      .insert(voiceSessions)
      .values({
        name,
        createdByUserId,
        status: "active",
        createdAt: Math.floor(Date.now()),
      })
      .returning();

    return result[0];
  }

  // Get session by ID
  async getSession(sessionId: number): Promise<VoiceSession | undefined> {
    const result = await db
      .select()
      .from(voiceSessions)
      .where(eq(voiceSessions.id, sessionId));

    return result[0];
  }

  // Get all active sessions
  async getActiveSessions(): Promise<VoiceSession[]> {
    return db
      .select()
      .from(voiceSessions)
      .where(eq(voiceSessions.status, "active"));
  }

  // Close a voice session
  async closeSession(sessionId: number): Promise<void> {
    await db
      .update(voiceSessions)
      .set({
        status: "closed",
        closedAt: Math.floor(Date.now()),
      })
      .where(eq(voiceSessions.id, sessionId));
  }

  // Add participant to session
  async addParticipant(
    voiceSessionId: number,
    userId: number
  ): Promise<VoiceParticipant> {
    const result = await db
      .insert(voiceParticipants)
      .values({
        voiceSessionId,
        userId,
        joinedAt: Math.floor(Date.now()),
        isMuted: 0,
        isVideoEnabled: 1,
      })
      .returning();

    return result[0];
  }

  // Remove participant from session
  async removeParticipant(
    voiceSessionId: number,
    userId: number
  ): Promise<void> {
    await db
      .update(voiceParticipants)
      .set({
        leftAt: Math.floor(Date.now()),
      })
      .where(
        and(
          eq(voiceParticipants.voiceSessionId, voiceSessionId),
          eq(voiceParticipants.userId, userId)
        )
      );
  }

  // Get session participants
  async getParticipants(voiceSessionId: number): Promise<VoiceParticipant[]> {
    return db
      .select()
      .from(voiceParticipants)
      .where(
        and(
          eq(voiceParticipants.voiceSessionId, voiceSessionId),
          eq(voiceParticipants.leftAt, null)
        )
      );
  }

  // Get participant count
  async getParticipantCount(voiceSessionId: number): Promise<number> {
    const result = await db
      .select()
      .from(voiceParticipants)
      .where(
        and(
          eq(voiceParticipants.voiceSessionId, voiceSessionId),
          eq(voiceParticipants.leftAt, null)
        )
      );

    return result.length;
  }

  // Update participant mute status
  async updateMuteStatus(
    voiceSessionId: number,
    userId: number,
    isMuted: boolean
  ): Promise<void> {
    await db
      .update(voiceParticipants)
      .set({
        isMuted: isMuted ? 1 : 0,
      })
      .where(
        and(
          eq(voiceParticipants.voiceSessionId, voiceSessionId),
          eq(voiceParticipants.userId, userId)
        )
      );
  }

  // Update participant video status
  async updateVideoStatus(
    voiceSessionId: number,
    userId: number,
    isVideoEnabled: boolean
  ): Promise<void> {
    await db
      .update(voiceParticipants)
      .set({
        isVideoEnabled: isVideoEnabled ? 1 : 0,
      })
      .where(
        and(
          eq(voiceParticipants.voiceSessionId, voiceSessionId),
          eq(voiceParticipants.userId, userId)
        )
      );
  }

  // Check if user is in session
  async isUserInSession(voiceSessionId: number, userId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(voiceParticipants)
      .where(
        and(
          eq(voiceParticipants.voiceSessionId, voiceSessionId),
          eq(voiceParticipants.userId, userId),
          eq(voiceParticipants.leftAt, null)
        )
      );

    return result.length > 0;
  }
}

export const voiceService = new VoiceService();
