import * as mediasoup from "mediasoup";

interface RtpCodecCapability {
  kind: "audio" | "video";
  mimeType: string;
  preferredPayloadType?: number;
  clockRate: number;
  channels?: number;
  parameters?: Record<string, any>;
  rtcpFeedback?: Array<{
    type: string;
    parameter?: string;
  }>;
}

export class MediasoupService {
  private static instance: MediasoupService;
  private worker: mediasoup.Worker | null = null;
  private routers: Map<number, mediasoup.Router> = new Map();

  private constructor() {}

  static getInstance(): MediasoupService {
    if (!MediasoupService.instance) {
      MediasoupService.instance = new MediasoupService();
    }
    return MediasoupService.instance;
  }

  async initialize(): Promise<void> {
    try {
      this.worker = await mediasoup.createWorker({
        logLevel: "warn",
        logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"],
        rtcMinPort: 40000,
        rtcMaxPort: 49999,
      });

      this.worker.on("died", () => {
        console.error("Mediasoup worker died, exiting process");
        process.exit(1);
      });

      console.log("Mediasoup worker created successfully");
    } catch (error) {
      console.error("Failed to create mediasoup worker:", error);
      throw error;
    }
  }

  async createRouter(voiceSessionId: number): Promise<mediasoup.Router> {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }

    if (this.routers.has(voiceSessionId)) {
      return this.routers.get(voiceSessionId)!;
    }

    const mediaCodecs: RtpCodecCapability[] = [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: "video",
        mimeType: "video/VP8",
        clockRate: 90000,
        parameters: {
          "x-google-start-bitrate": 1000,
        },
      },
    ];

    const router = await this.worker.createRouter({ mediaCodecs });

    router.on("workerclose", () => {
      console.log(`Router for session ${voiceSessionId} closed`);
      this.routers.delete(voiceSessionId);
    });

    this.routers.set(voiceSessionId, router);
    return router;
  }

  getRouter(voiceSessionId: number): mediasoup.Router | undefined {
    return this.routers.get(voiceSessionId);
  }

  closeRouter(voiceSessionId: number): void {
    const router = this.routers.get(voiceSessionId);
    if (router) {
      router.close();
      this.routers.delete(voiceSessionId);
    }
  }

  async shutdown(): Promise<void> {
    for (const router of this.routers.values()) {
      router.close();
    }
    this.routers.clear();

    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }
}
