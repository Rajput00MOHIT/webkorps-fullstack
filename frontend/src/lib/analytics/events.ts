/**
 * Lightweight, non-invasive analytics event emitter
 */

import type { AnalyticsEvent } from '../../types';
import { sendAnalyticsTelemetry } from '../api';

type EventListener = (event: AnalyticsEvent) => void;

class AnalyticsManager {
  private listeners: EventListener[] = [];

  public subscribe(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public track(event: AnalyticsEvent): void {
    const payload: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || Date.now()
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Analytics Event]', payload);
    }

    sendAnalyticsTelemetry(payload as any);

    this.listeners.forEach(listener => {
      try {
        listener(payload);
      } catch (err) {
        console.error('Analytics listener error:', err);
      }
    });
  }

  public trackCtaClick(label: string, location: string): void {
    this.track({
      eventName: 'cta_click',
      category: 'cta',
      label,
      metadata: { location }
    });
  }

  public trackNavigation(target: string): void {
    this.track({
      eventName: 'navigation_click',
      category: 'navigation',
      label: target
    });
  }
}

export const analytics = new AnalyticsManager();
