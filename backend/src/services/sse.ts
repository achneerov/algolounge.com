import { Response } from "express";

interface SSEClient {
  userId: number;
  response: Response;
}

// Map of eventId -> list of connected clients
const eventClients = new Map<number, SSEClient[]>();

/**
 * Add a client to an event's SSE stream
 */
export function addClient(eventId: number, userId: number, res: Response) {
  const clients = eventClients.get(eventId) || [];

  const client: SSEClient = {
    userId,
    response: res,
  };

  clients.push(client);
  eventClients.set(eventId, clients);

  // Remove client when connection closes
  res.on("close", () => {
    removeClient(eventId, userId);
  });
}

/**
 * Remove a client from an event's SSE stream
 */
export function removeClient(eventId: number, userId: number) {
  const clients = eventClients.get(eventId) || [];
  const filtered = clients.filter((c) => c.userId !== userId);

  if (filtered.length === 0) {
    eventClients.delete(eventId);
  } else {
    eventClients.set(eventId, filtered);
  }
}

/**
 * Send an event to all clients subscribed to a quiz event
 */
export function broadcastToEvent(
  eventId: number,
  eventType: string,
  data: any
) {
  const clients = eventClients.get(eventId) || [];

  const message = {
    type: eventType,
    data,
    timestamp: Date.now(),
  };

  const sseMessage = `event: ${eventType}\ndata: ${JSON.stringify(message)}\n\n`;

  clients.forEach((client) => {
    try {
      client.response.write(sseMessage);
    } catch (error) {
      console.error("Error sending SSE message:", error);
      removeClient(eventId, client.userId);
    }
  });
}

/**
 * Event type definitions for SSE
 */
export const SSE_EVENTS = {
  PLAYER_JOINED: "player_joined",
  QUIZ_STARTED: "quiz_started",
  ROUND_STARTED: "round_started",
  ROUND_ENDED: "round_ended",
  QUIZ_ENDED: "quiz_ended",
} as const;
