import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePresence = (currentRoom?: string) => {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) return;

    const updatePresence = async (isOnline: boolean, room?: string) => {
      // Try to upsert presence
      const { error } = await supabase
        .from('user_presence')
        .upsert(
          {
            user_id: user.id,
            is_online: isOnline,
            last_seen: new Date().toISOString(),
            current_room: room || null,
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error updating presence:', error);
      }
    };

    // Set online
    updatePresence(true, currentRoom);

    // Update every 30 seconds
    intervalRef.current = setInterval(() => {
      updatePresence(true, currentRoom);
    }, 30000);

    // Set offline on page unload
    const handleUnload = () => {
      updatePresence(false);
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('beforeunload', handleUnload);
      updatePresence(false);
    };
  }, [user, currentRoom]);
};
