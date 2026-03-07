import type { Response } from 'express';
import type { TestCaseStatus } from '../types/testCase';

export type TestCaseRunEventType = 'connected' | 'running' | 'completed' | 'error';

export interface TestCaseRunEvent {
  type: TestCaseRunEventType;
  testCaseId: string;
  status?: TestCaseStatus | null;
  executionCount?: number;
  executionTime?: string | null;
  message?: string;
  source?: 'manual' | 'auto';
}

interface Subscriber {
  response: Response;
  keepAlive: NodeJS.Timeout;
}

class TestCaseEventService {
  private readonly subscribers = new Map<string, Set<Subscriber>>();

  subscribe(testCaseId: string, response: Response): () => void {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();

    const keepAlive = setInterval(() => {
      response.write(': keep-alive\n\n');
    }, 25000);

    const subscriber: Subscriber = { response, keepAlive };
    const subscribers = this.subscribers.get(testCaseId) ?? new Set<Subscriber>();
    subscribers.add(subscriber);
    this.subscribers.set(testCaseId, subscribers);

    response.write(
      `event: connected\ndata: ${JSON.stringify({
        type: 'connected',
        testCaseId,
        message: 'Subscribed to test case events',
      } satisfies TestCaseRunEvent)}\n\n`
    );

    return () => {
      clearInterval(keepAlive);
      const currentSubscribers = this.subscribers.get(testCaseId);
      if (!currentSubscribers) {
        return;
      }

      currentSubscribers.delete(subscriber);
      if (currentSubscribers.size === 0) {
        this.subscribers.delete(testCaseId);
      }
    };
  }

  publish(testCaseId: string, payload: TestCaseRunEvent): void {
    const subscribers = this.subscribers.get(testCaseId);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const data = `event: ${payload.type}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const subscriber of subscribers) {
      subscriber.response.write(data);
    }
  }
}

export default new TestCaseEventService();
