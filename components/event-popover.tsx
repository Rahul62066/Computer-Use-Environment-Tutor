import React, { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import dayjs from "dayjs";
import {
  HiOutlineMenuAlt2,
  HiOutlineMenuAlt4,
  HiOutlineUsers,
} from "react-icons/hi";
import { IoCloseSharp } from "react-icons/io5";
import { IoMdCalendar } from "react-icons/io";
import { FiClock, FiMapPin } from "react-icons/fi";
import AddTime from "./add-time";
import { createEvent } from "@/app/actions/event-actions";
import { createTask } from "@/app/actions/task-actions";
import { createAppointment } from "@/app/actions/appointment-actions";
import { cn } from "@/lib/utils";

interface EventPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
}

type EntryType = "event" | "task" | "appointment";

export default function EventPopover({
  isOpen,
  onClose,
  date,
}: EventPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [selectedTime, setSelectedTime] = useState("00:00");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const [entryType, setEntryType] = useState<EntryType>("event");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handlePopoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  async function onSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        let result;

        if (entryType === "event") {
          result = await createEvent(formData);
        } else if (entryType === "task") {
          // For tasks, we need to set dueDate instead of date/time
          const taskFormData = new FormData();
          taskFormData.set("title", formData.get("title") as string);
          taskFormData.set(
            "description",
            formData.get("description") as string,
          );
          const dueDate = formData.get("date") as string;
          const dueTime = formData.get("time") as string;
          if (dueDate && dueTime) {
            taskFormData.set("dueDate", `${dueDate}T${dueTime}:00`);
          }
          result = await createTask(taskFormData);
        } else if (entryType === "appointment") {
          result = await createAppointment(formData);
        }

        if (result && "error" in result) {
          setError(result.error);
        } else if (result && result.success) {
          setSuccess(result.success);
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } catch {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleClose}
    >
      <div
        ref={popoverRef}
        className="w-full max-w-md rounded-lg bg-card shadow-lg"
        onClick={handlePopoverClick}
      >
        <div className="mb-2 flex items-center justify-between rounded-md bg-muted p-1">
          <HiOutlineMenuAlt4 />
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={handleClose}
          >
            <IoCloseSharp className="h-4 w-4" />
          </Button>
        </div>
        <form className="space-y-4 p-6" action={onSubmit}>
          <div>
            <Input
              type="text"
              name="title"
              placeholder="Add title"
              className="my-4 rounded-none border-0 border-b text-2xl focus-visible:border-b-2 focus-visible:border-b-blue-600 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button
              type="button"
              onClick={() => setEntryType("event")}
              className={cn(
                entryType === "event"
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700"
                  : "bg-transparent text-foreground hover:bg-secondary",
              )}
            >
              Event
            </Button>
            <Button
              type="button"
              onClick={() => setEntryType("task")}
              className={cn(
                entryType === "task"
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700"
                  : "bg-transparent text-foreground hover:bg-secondary",
              )}
            >
              Task
            </Button>
            <Button
              type="button"
              onClick={() => setEntryType("appointment")}
              className={cn(
                entryType === "appointment"
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700"
                  : "bg-transparent text-foreground hover:bg-secondary",
              )}
            >
              Appointment{" "}
              <sup className="rounded bg-blue-500 px-1 text-xs text-white">
                new
              </sup>
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <FiClock className="size-5 text-muted-foreground" />
            <div className="flex items-center space-x-3 text-sm">
              <p>{dayjs(date).format("dddd, MMMM D")}</p>
              <AddTime onTimeSelect={setSelectedTime} />
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="time" value={selectedTime} />
            </div>
          </div>

          {/* Show guests field for events and appointments */}
          {(entryType === "event" || entryType === "appointment") && (
            <div className="flex items-center space-x-3">
              <HiOutlineUsers className="size-5 text-muted-foreground" />
              <Input
                type="text"
                name="guests"
                placeholder="Add guests (comma-separated emails)"
                className={cn(
                  "w-full rounded-lg border-0 bg-muted pl-7 placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0",
                )}
              />
            </div>
          )}

          {/* Show location field for appointments */}
          {entryType === "appointment" && (
            <div className="flex items-center space-x-3">
              <FiMapPin className="size-5 text-muted-foreground" />
              <Input
                type="text"
                name="location"
                placeholder="Add location"
                className={cn(
                  "w-full rounded-lg border-0 bg-muted pl-7 placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0",
                )}
              />
            </div>
          )}

          {/* Show duration field for appointments */}
          {entryType === "appointment" && (
            <div className="flex items-center space-x-3">
              <FiClock className="size-5 text-muted-foreground" />
              <Input
                type="number"
                name="duration"
                placeholder="Duration (minutes)"
                defaultValue="60"
                className={cn(
                  "w-full rounded-lg border-0 bg-muted pl-7 placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0",
                )}
              />
            </div>
          )}

          <div className="flex items-center space-x-3">
            <HiOutlineMenuAlt2 className="size-5 text-muted-foreground" />
            <Input
              type="text"
              name="description"
              placeholder="Add description"
              className={cn(
                "w-full rounded-lg border-0 bg-muted pl-7 placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0",
              )}
            />
          </div>

          <div className="flex items-center space-x-3">
            <IoMdCalendar className="size-5 text-muted-foreground" />
            <div className="">
              <div className="flex items-center space-x-3 text-sm">
                {" "}
                <p>De Mawo</p>{" "}
                <div className="h-4 w-4 rounded-full bg-violet-500"></div>{" "}
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <span>Busy</span>
                <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
                <span>Default visibility</span>{" "}
                <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
                <span>Notify 30 minutes before</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>

          {error && <p className="mt-2 px-6 text-red-500">{error}</p>}
          {success && <p className="mt-2 px-6 text-green-500">Success</p>}
        </form>
      </div>
    </div>
  );
}
