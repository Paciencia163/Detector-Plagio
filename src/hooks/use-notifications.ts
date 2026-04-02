import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Notification {
  id: string;
  analysisId: string;
  title: string;
  message: string;
  type: "success" | "error";
  read: boolean;
  createdAt: Date;
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("analysis-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "analyses",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;

          // Only notify on status transitions to completed or error
          if (oldData.status === newData.status) return;

          if (newData.status === "completed") {
            const notif: Notification = {
              id: crypto.randomUUID(),
              analysisId: newData.id,
              title: "Análise concluída",
              message: `"${newData.title}" — ${newData.similarity_percentage}% de similaridade`,
              type: "success",
              read: false,
              createdAt: new Date(),
            };
            setNotifications((prev) => [notif, ...prev]);
            toast({
              title: "✅ Análise concluída",
              description: notif.message,
            });
          } else if (newData.status === "error") {
            const notif: Notification = {
              id: crypto.randomUUID(),
              analysisId: newData.id,
              title: "Erro na análise",
              message: `Ocorreu um erro ao analisar "${newData.title}"`,
              type: "error",
              read: false,
              createdAt: new Date(),
            };
            setNotifications((prev) => [notif, ...prev]);
            toast({
              title: "❌ Erro na análise",
              description: notif.message,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return { notifications, unreadCount, markAsRead, markAllAsRead, clearAll };
}
