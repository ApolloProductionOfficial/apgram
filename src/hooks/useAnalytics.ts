import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

// Generate or get session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export type AnalyticsEventType = 
  | 'page_view'
  | 'button_click'
  | 'translation_started'
  | 'translation_completed'
  | 'room_joined'
  | 'room_left'
  | 'feature_used'
  | 'error';

interface TrackEventParams {
  eventType: AnalyticsEventType;
  eventData?: Record<string, Json>;
  pagePath?: string;
}

export const useAnalytics = () => {
  const { user } = useAuth();
  const sessionId = useRef(getSessionId());

  const trackEvent = useCallback(async ({ eventType, eventData = {}, pagePath }: TrackEventParams) => {
    try {
      await supabase.from('site_analytics').insert([{
        event_type: eventType,
        event_data: eventData as Json,
        user_id: user?.id || null,
        session_id: sessionId.current,
        page_path: pagePath || window.location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      }]);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, [user?.id]);

  // Track page view on mount
  const trackPageView = useCallback((pageName?: string) => {
    trackEvent({
      eventType: 'page_view',
      eventData: { page_name: pageName || null },
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
  };
};

// Standalone function for use outside React components
export const trackAnalyticsEvent = async (
  eventType: AnalyticsEventType,
  eventData: Record<string, Json> = {},
  userId?: string
) => {
  try {
    const sessionId = getSessionId();
    await supabase.from('site_analytics').insert([{
      event_type: eventType,
      event_data: eventData as Json,
      user_id: userId || null,
      session_id: sessionId,
      page_path: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    }]);
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};
