import Header from "@/components/header/Header";
import MainView from "@/components/MainView";
import { CalendarEventType } from "@/lib/store";
import dayjs from "dayjs";
import { getEvents } from "@/app/actions/event-actions";

export default async function Home() {
  const events = await getEvents();

  const dbEvents = events.map((event) => ({
    ...event,
    date: dayjs(event.date).toISOString(), // Convert Dayjs to string
  }));

  return (
    <div className="">
      <Header />
      <MainView eventsData={dbEvents as unknown as CalendarEventType[]} />
    </div>
  );
}
