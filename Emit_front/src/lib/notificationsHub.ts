import * as signalR from "@microsoft/signalr";
import { supabase } from "@/lib/supabase";
import { BASE } from "@/lib/api";

export function createNotificationsConnection(): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${BASE}/hubs/notifications`, {
      accessTokenFactory: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? "";
      },
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}