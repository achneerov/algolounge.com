import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface RemoteParticipant {
  userId: number;
  isMuted: number;
  isVideoEnabled: number;
  audioTrack?: MediaStreamTrack;
  videoTrack?: MediaStreamTrack;
}

export interface ParticipantState {
  [userId: number]: RemoteParticipant;
}

@Injectable({
  providedIn: 'root'
})
export class WebRTCService {
  private authService = inject(AuthService);

  private socket: Socket | null = null;
  private device: mediasoupClient.Device | null = null;
  private sendTransport: mediasoupClient.types.Transport | null = null;
  private localStream: MediaStream | null = null;
  private producers: Map<string, mediasoupClient.types.Producer> = new Map();
  private consumers: Map<string, mediasoupClient.types.Consumer> = new Map();

  private participants$ = new BehaviorSubject<ParticipantState>({});
  private connected$ = new BehaviorSubject<boolean>(false);
  private localStream$ = new BehaviorSubject<MediaStream | null>(null);
  private error$ = new Subject<string>();

  constructor() {}

  // Initialize WebRTC connection
  async connectToVoiceSession(sessionId: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      let timeoutId: any;
      let resolved = false;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
      };

      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve();
        }
      };

      const safeReject = (error: any) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(error);
        }
      };

      try {
        // Get auth token
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No auth token found');
        }

        // Set timeout for connection
        timeoutId = setTimeout(() => {
          safeReject(new Error('Voice session connection timeout (30s)'));
          if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
          }
        }, 30000);

        // Create Socket.io connection to voice namespace
        console.log('Connecting to voice namespace at:', `${environment.apiUrl}/voice`);
        this.socket = io(`${environment.apiUrl}/voice`, {
          auth: { token },
          transports: ['websocket', 'polling']
        });

        // Handle socket connection
        this.socket.on('connect', () => {
          console.log('Connected to voice namespace');
        });

        // Handle socket errors
        this.socket.on('connect_error', (error: any) => {
          console.error('Socket connection error:', error);
          console.error('Error message:', error.message || error);
          this.error$.next(`Connection error: ${error.message || error}`);
          safeReject(error);
        });

        // Handle authentication error
        this.socket.on('error', (error: any) => {
          console.error('Socket error:', error);
          this.error$.next(`Socket error: ${error}`);
          safeReject(error);
        });

        // Handle user joined
        this.socket.on('user_joined', (data: { userId: number; participantCount: number }) => {
          console.log(`User ${data.userId} joined, total: ${data.participantCount}`);
        });

        // Handle user left
        this.socket.on('user_left', (data: { userId: number }) => {
          console.log(`User ${data.userId} left`);
          this.removeParticipant(data.userId);
        });

        // Handle user muted
        this.socket.on('user_muted', (data: { userId: number; isMuted: boolean }) => {
          const participants = this.participants$.value;
          if (participants[data.userId]) {
            participants[data.userId].isMuted = data.isMuted ? 1 : 0;
            this.participants$.next({ ...participants });
          }
        });

        // Handle user video toggled
        this.socket.on('user_video_toggled', (data: { userId: number; isVideoEnabled: boolean }) => {
          const participants = this.participants$.value;
          if (participants[data.userId]) {
            participants[data.userId].isVideoEnabled = data.isVideoEnabled ? 1 : 0;
            this.participants$.next({ ...participants });
          }
        });

        // Handle producer added
        this.socket.on('producer_added', async (data: { producerId: string; userId: number; kind: 'audio' | 'video' }) => {
          try {
            await this.consumeProducer(data.producerId, data.userId, data.kind);
          } catch (error) {
            console.error('Failed to consume producer:', error);
          }
        });

        // Join the voice session
        console.log('Emitting join for session:', sessionId);
        this.socket.emit('join', { sessionId }, async (joinResponse: any) => {
          console.log('Join response received:', joinResponse);
          try {
            if (joinResponse.error) {
              throw new Error(joinResponse.error);
            }

            console.log('Initializing mediasoup device with capabilities:', joinResponse.rtpCapabilities);
            // Initialize mediasoup device
            this.device = new mediasoupClient.Device();
            await this.device.load({ routerRtpCapabilities: joinResponse.rtpCapabilities });
            console.log('Mediasoup device loaded');

            // Get local media stream
            console.log('Requesting local media stream...');
            try {
              this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                },
              });
              console.log('Local media stream obtained:', this.localStream);
              this.localStream$.next(this.localStream);
            } catch (error) {
              console.warn('Failed to get media stream, continuing without local media:', error);
            }

            // Create send transport
            this.socket!.emit('create-send-transport', { sessionId }, async (transportResponse: any) => {
              try {
                if (transportResponse.error) {
                  throw new Error(transportResponse.error);
                }

                this.sendTransport = this.device!.createSendTransport(transportResponse.params);

                // Handle transport connection
                this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                  this.socket!.emit('connect-send-transport', { sessionId, dtlsParameters }, (connectResponse: any) => {
                    if (connectResponse.error) {
                      errback(new Error(connectResponse.error));
                    } else {
                      callback();
                    }
                  });
                });

                // Handle produce
                this.sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
                  this.socket!.emit('produce', { sessionId, kind, rtpParameters }, (produceResponse: any) => {
                    if (produceResponse.error) {
                      errback(new Error(produceResponse.error));
                    } else {
                      callback({ id: produceResponse.id });
                    }
                  });
                });

                // Produce audio if available
                if (this.localStream) {
                  const audioTrack = this.localStream.getAudioTracks()[0];
                  if (audioTrack) {
                    const audioProducer = await this.sendTransport.produce({
                      track: audioTrack,
                      encodings: [{ maxBitrate: 100000 }],
                    });
                    this.producers.set('audio', audioProducer);
                  }

                  // Produce video if available
                  const videoTrack = this.localStream.getVideoTracks()[0];
                  if (videoTrack) {
                    const videoProducer = await this.sendTransport.produce({
                      track: videoTrack,
                      encodings: [
                        { maxBitrate: 5000000 },
                        { maxBitrate: 1000000 },
                        { maxBitrate: 300000 },
                      ],
                    });
                    this.producers.set('video', videoProducer);
                  }
                }

                // Setup existing participants from join response
                const participants: ParticipantState = {};
                for (const participant of joinResponse.participants) {
                  if (!participant.isCurrentUser) {
                    participants[participant.userId] = {
                      userId: participant.userId,
                      isMuted: participant.isMuted,
                      isVideoEnabled: participant.isVideoEnabled,
                    };
                  }
                }
                this.participants$.next(participants);

                this.connected$.next(true);
                safeResolve();
              } catch (error) {
                console.error('Failed to create send transport:', error);
                this.error$.next(`Transport creation failed: ${error}`);
                safeReject(error);
              }
            });
          } catch (error) {
            console.error('Join error:', error);
            this.error$.next(`Join failed: ${error}`);
            safeReject(error);
          }
        });
      } catch (error) {
        console.error('WebRTC connection error:', error);
        this.error$.next(`Connection failed: ${error}`);
        safeReject(error);
      }
    });
  }

  // Consume a producer from another participant
  private async consumeProducer(producerId: string, userId: number, kind: 'audio' | 'video'): Promise<void> {
    if (!this.socket || !this.device) {
      throw new Error('Not connected');
    }

    // Create receive transport if not exists
    if (!this.sendTransport) {
      return;
    }

    try {
      // Create consumer (simplified - would need receive transport in production)
      const participants = this.participants$.value;
      if (!participants[userId]) {
        participants[userId] = {
          userId,
          isMuted: 0,
          isVideoEnabled: 1,
        };
        this.participants$.next({ ...participants });
      }
    } catch (error) {
      console.error('Failed to consume producer:', error);
    }
  }

  // Mute/unmute audio
  async setMuted(sessionId: number, isMuted: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('mute', { sessionId, isMuted }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          // Stop audio track if muting
          if (this.localStream) {
            this.localStream.getAudioTracks().forEach((track) => {
              track.enabled = !isMuted;
            });
          }
          resolve();
        }
      });
    });
  }

  // Toggle video
  async toggleVideo(sessionId: number, isVideoEnabled: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('toggle-video', { sessionId, isVideoEnabled }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          // Stop video track if disabling
          if (this.localStream) {
            this.localStream.getVideoTracks().forEach((track) => {
              track.enabled = isVideoEnabled;
            });
          }
          resolve();
        }
      });
    });
  }

  // Disconnect from voice session
  async disconnect(): Promise<void> {
    // Close producers
    for (const producer of this.producers.values()) {
      producer.close();
    }
    this.producers.clear();

    // Close consumers
    for (const consumer of this.consumers.values()) {
      consumer.close();
    }
    this.consumers.clear();

    // Stop local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
      this.localStream$.next(null);
    }

    // Close transports
    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = null;
    }

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connected$.next(false);
    this.participants$.next({});
  }

  // Remove participant
  private removeParticipant(userId: number): void {
    const participants = this.participants$.value;
    delete participants[userId];
    this.participants$.next({ ...participants });
  }

  // Get observables
  getParticipants$(): Observable<ParticipantState> {
    return this.participants$.asObservable();
  }

  getConnected$(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  getLocalStream$(): Observable<MediaStream | null> {
    return this.localStream$.asObservable();
  }

  getError$(): Observable<string> {
    return this.error$.asObservable();
  }
}
