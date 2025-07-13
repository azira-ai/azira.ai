import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { api } from "@/lib/api";

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  category: string;
  is_exclusive: boolean;
  is_public: boolean;
  max_attendees: number;
  current_attendees: number;
  partner_name?: string;
  partner_logo_url?: string;
  cover_image_url: string;
  created_at: string;
  is_participating: boolean;
  participation_id?: string;
}

interface EventsContextData {
  events: Event[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  participate: (eventId: string) => Promise<void>;
  cancelParticipation: (
    participationId: string,
    eventId: string
  ) => Promise<void>;
}

const EventsContext = createContext<EventsContextData>({} as EventsContextData);

export function EventsProvider({ children }: { children: ReactNode }) {
  /** carrega cache (sessionStorage) para evitar chamada inicial */
  const [events, setEvents] = useState<Event[]>(() => {
    const cached = sessionStorage.getItem("events");
    return cached ? (JSON.parse(cached) as Event[]) : [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Event[]>("api/events/recommended");
      setEvents(data);
      sessionStorage.setItem("events", JSON.stringify(data));
      setError(null);
    } catch {
      setError("Erro ao carregar eventos");
    } finally {
      setLoading(false);
    }
  };

  const participate = async (eventId: string) => {
    const { data } = await api.post<{ id: string }>("/event-participations", {
      event_id: eventId,
      status: "confirmed",
    });
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              is_participating: true,
              participation_id: data.id,
              current_attendees: e.current_attendees + 1,
            }
          : e
      )
    );
  };

  const cancelParticipation = async (
    participationId: string,
    eventId: string
  ) => {
    await api.patch(`api/event-participations/${participationId}`, {
      status: "cancelled",
    });
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              is_participating: false,
              participation_id: undefined,
              current_attendees: e.current_attendees - 1,
            }
          : e
      )
    );
  };

  return (
    <EventsContext.Provider
      value={{
        events,
        loading,
        error,
        refresh,
        participate,
        cancelParticipation,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export const useEvents = () => useContext(EventsContext);
