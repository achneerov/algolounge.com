import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoiceService, VoiceSession } from '../../services/voice.service';
import { WebRTCService, ParticipantState } from '../../services/webrtc.service';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-voice',
  imports: [CommonModule, FormsModule],
  templateUrl: './voice.component.html',
  styleUrl: './voice.component.scss'
})
export class VoiceComponent implements OnInit, OnDestroy {
  private voiceService = inject(VoiceService);
  private webrtcService = inject(WebRTCService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // State
  sessions: VoiceSession[] = [];
  participants: ParticipantState = {};
  currentSession: VoiceSession | null = null;
  isConnected = false;
  isCreating = false;
  isJoining = false;
  newSessionName = '';
  isMuted = false;
  isVideoEnabled = true;
  localStream: MediaStream | null = null;
  currentUserId: number | null = null;

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.currentUserId = user.id;
        }
      });

    // Load active sessions
    this.voiceService.getSessions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sessions) => {
          this.sessions = sessions;
        },
        error: (error) => console.error('Failed to load sessions:', error)
      });

    // Monitor WebRTC state
    this.webrtcService.getConnected$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((connected) => {
        this.isConnected = connected;
      });

    this.webrtcService.getParticipants$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((participants) => {
        this.participants = participants;
      });

    this.webrtcService.getLocalStream$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((stream) => {
        this.localStream = stream;
      });
  }

  // Create a new voice session
  async createSession(): Promise<void> {
    if (!this.newSessionName.trim() || this.isCreating) return;

    this.isCreating = true;
    try {
      const session = await this.voiceService.createSession(this.newSessionName).toPromise();
      if (session) {
        this.sessions.push(session);
        this.newSessionName = '';
        await this.joinSession(session);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      this.isCreating = false;
    }
  }

  // Join a voice session
  async joinSession(session: VoiceSession): Promise<void> {
    if (this.isJoining || this.isConnected) return;

    this.isJoining = true;
    try {
      this.voiceService.setCurrentSession(session);
      this.currentSession = session;
      await this.webrtcService.connectToVoiceSession(session.id);
    } catch (error) {
      console.error('Failed to join session:', error);
      this.currentSession = null;
      this.voiceService.setCurrentSession(null);
    } finally {
      this.isJoining = false;
    }
  }

  // Leave current session
  async leaveSession(): Promise<void> {
    try {
      await this.webrtcService.disconnect();
      this.currentSession = null;
      this.voiceService.setCurrentSession(null);
      this.isConnected = false;
    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  }

  // Toggle mute
  async toggleMute(): Promise<void> {
    if (!this.currentSession) return;

    try {
      this.isMuted = !this.isMuted;
      await this.webrtcService.setMuted(this.currentSession.id, this.isMuted);
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      this.isMuted = !this.isMuted;
    }
  }

  // Toggle video
  async toggleVideo(): Promise<void> {
    if (!this.currentSession) return;

    try {
      this.isVideoEnabled = !this.isVideoEnabled;
      await this.webrtcService.toggleVideo(this.currentSession.id, this.isVideoEnabled);
    } catch (error) {
      console.error('Failed to toggle video:', error);
      this.isVideoEnabled = !this.isVideoEnabled;
    }
  }

  // Close session (creator only)
  async closeSession(session: VoiceSession): Promise<void> {
    if (!this.currentUserId || session.createdByUserId !== this.currentUserId) return;

    try {
      await this.voiceService.closeSession(session.id).toPromise();
      this.sessions = this.sessions.filter((s) => s.id !== session.id);

      if (this.currentSession?.id === session.id) {
        await this.leaveSession();
      }
    } catch (error) {
      console.error('Failed to close session:', error);
    }
  }

  // Get participant count text
  getParticipantCountText(session: VoiceSession): string {
    const count = session.participantCount || 0;
    return `${count} ${count === 1 ? 'person' : 'people'}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.isConnected) {
      this.leaveSession();
    }
  }
}
