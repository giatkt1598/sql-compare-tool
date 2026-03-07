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

type SubscriberCountListener = (testCaseId: string, subscriberCount: number) => void;
type ProfileSubscriberCountListener = (profileId: string, subscriberCount: number) => void;

class TestCaseEventService {
  private readonly testCaseSubscribers = new Map<string, Set<Subscriber>>();
  private readonly profileSubscribers = new Map<string, Set<Subscriber>>();
  private readonly subscriberCountListeners = new Set<SubscriberCountListener>();
  private readonly profileSubscriberCountListeners = new Set<ProfileSubscriberCountListener>();

  subscribe(testCaseId: string, response: Response): () => void {
    return this.subscribeToChannel(
      this.testCaseSubscribers,
      testCaseId,
      response,
      'Subscribed to test case events',
      (id, count) => this.notifySubscriberCountChanged(id, count)
    );
  }

  subscribeToProfile(profileId: string, response: Response): () => void {
    return this.subscribeToChannel(
      this.profileSubscribers,
      profileId,
      response,
      'Subscribed to profile test case events',
      (id, count) => this.notifyProfileSubscriberCountChanged(id, count)
    );
  }

  private subscribeToChannel(
    subscribersMap: Map<string, Set<Subscriber>>,
    channelId: string,
    response: Response,
    connectedMessage: string,
    notifyCountChanged: (channelId: string, count: number) => void
  ): () => void {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();

    const keepAlive = setInterval(() => {
      response.write(': keep-alive\n\n');
    }, 25000);

    const subscriber: Subscriber = { response, keepAlive };
    const subscribers = subscribersMap.get(channelId) ?? new Set<Subscriber>();
    subscribers.add(subscriber);
    subscribersMap.set(channelId, subscribers);
    notifyCountChanged(channelId, subscribers.size);

    response.write(
      `event: connected\ndata: ${JSON.stringify({
        type: 'connected',
        testCaseId: channelId,
        message: connectedMessage,
      } satisfies TestCaseRunEvent)}\n\n`
    );

    return () => {
      clearInterval(keepAlive);
      const currentSubscribers = subscribersMap.get(channelId);
      if (!currentSubscribers) {
        return;
      }

      currentSubscribers.delete(subscriber);
      if (currentSubscribers.size === 0) {
        subscribersMap.delete(channelId);
        notifyCountChanged(channelId, 0);
        return;
      }

      notifyCountChanged(channelId, currentSubscribers.size);
    };
  }

  onSubscriberCountChanged(listener: SubscriberCountListener): () => void {
    this.subscriberCountListeners.add(listener);
    return () => {
      this.subscriberCountListeners.delete(listener);
    };
  }

  onProfileSubscriberCountChanged(listener: ProfileSubscriberCountListener): () => void {
    this.profileSubscriberCountListeners.add(listener);
    return () => {
      this.profileSubscriberCountListeners.delete(listener);
    };
  }

  getSubscriberCount(testCaseId: string): number {
    return this.testCaseSubscribers.get(testCaseId)?.size ?? 0;
  }

  hasSubscribers(testCaseId: string): boolean {
    return this.getSubscriberCount(testCaseId) > 0;
  }

  getProfileSubscriberCount(profileId: string): number {
    return this.profileSubscribers.get(profileId)?.size ?? 0;
  }

  hasProfileSubscribers(profileId: string): boolean {
    return this.getProfileSubscriberCount(profileId) > 0;
  }

  publish(testCaseId: string, payload: TestCaseRunEvent): void {
    const subscribers = this.testCaseSubscribers.get(testCaseId);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const data = `event: ${payload.type}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const subscriber of subscribers) {
      subscriber.response.write(data);
    }
  }

  publishToProfile(profileId: string, payload: TestCaseRunEvent): void {
    const subscribers = this.profileSubscribers.get(profileId);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const data = `event: ${payload.type}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const subscriber of subscribers) {
      subscriber.response.write(data);
    }
  }

  private notifySubscriberCountChanged(testCaseId: string, subscriberCount: number): void {
    for (const listener of this.subscriberCountListeners) {
      listener(testCaseId, subscriberCount);
    }
  }

  private notifyProfileSubscriberCountChanged(profileId: string, subscriberCount: number): void {
    for (const listener of this.profileSubscriberCountListeners) {
      listener(profileId, subscriberCount);
    }
  }
}

export default new TestCaseEventService();
