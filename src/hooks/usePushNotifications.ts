import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (user && isSupported) {
      checkSubscription();
      checkShouldShowPrompt();
    }
  }, [user, isSupported]);

  const checkSubscription = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsSubscribed(!!data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const checkShouldShowPrompt = () => {
    // Don't show if already subscribed or permission denied
    if (isSubscribed || permission === 'denied') {
      setShowPrompt(false);
      return;
    }

    // Check if user dismissed the prompt recently
    const dismissedAt = localStorage.getItem('notification_prompt_dismissed');
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowPrompt(false);
        return;
      }
    }

    // Show prompt if user has had at least 2 conversations
    const conversationCount = localStorage.getItem('conversation_count');
    if (conversationCount && parseInt(conversationCount) >= 2) {
      setShowPrompt(true);
    }
  };

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!user?.id || !isSupported) return false;

    try {
      // Request permission first
      const granted = await requestPermission();
      if (!granted) return false;

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
        )
      });

      const subscriptionJson = subscription.toJSON();

      // Save to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth
        });

      if (error) throw error;

      setIsSubscribed(true);
      setShowPrompt(false);
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }, [user?.id, isSupported, requestPermission]);

  const unsubscribe = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsSubscribed(false);
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  }, [user?.id]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem('notification_prompt_dismissed', new Date().toISOString());
    setShowPrompt(false);
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    showPrompt,
    subscribe,
    unsubscribe,
    dismissPrompt
  };
};

// Helper function
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}