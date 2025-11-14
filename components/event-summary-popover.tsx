'use client'

import React, { useRef, useEffect, useState, useTransition } from 'react'
import dayjs from 'dayjs'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IoCloseSharp } from "react-icons/io5"
import { CalendarEventType } from '@/lib/store'
import { updateEvent, deleteEvent } from '@/app/actions/event-actions'
import { FiEdit, FiTrash2, FiClock } from 'react-icons/fi'
import { HiOutlineUsers, HiOutlineMenuAlt2 } from 'react-icons/hi'
import { cn } from '@/lib/utils'

interface EventSummaryPopoverProps {
  isOpen: boolean
  onClose: () => void
  event: CalendarEventType
}

export function EventSummaryPopover({ isOpen, onClose, event }: EventSummaryPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean | null>(null)

  // Form state
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description || '')
  const [date, setDate] = useState(dayjs(event.date).format('YYYY-MM-DD'))
  const [time, setTime] = useState(dayjs(event.date).format('HH:mm'))
  const [guests, setGuests] = useState(event.guests || '')

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this event?')) return

    startTransition(async () => {
      try {
        const result = await deleteEvent(event.id)
        if ('error' in result) {
          setError(result.error)
        } else {
          setSuccess(true)
          setTimeout(() => {
            onClose()
          }, 1000)
        }
      } catch {
        setError('Failed to delete event')
      }
    })
  }

  const handleUpdate = () => {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      try {
        const startDateTime = new Date(`${date}T${time}:00`)
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)

        const result = await updateEvent(event.id, {
          title,
          description,
          date: startDateTime,
          endDate: endDateTime,
          guests: guests || undefined,
        })

        if ('error' in result) {
          setError(result.error)
        } else {
          setSuccess(true)
          setIsEditing(false)
          setTimeout(() => {
            onClose()
          }, 1000)
        }
      } catch {
        setError('Failed to update event')
      }
    })
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        ref={popoverRef}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{isEditing ? 'Edit Event' : 'Event Details'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <IoCloseSharp className="h-4 w-4" />
          </Button>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-3">
              <FiClock className="size-5 text-gray-600" />
              <div className="flex items-center space-x-2">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-auto"
                />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-auto"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <HiOutlineUsers className="size-5 text-slate-600" />
              <Input
                type="text"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                placeholder="Add guests (comma-separated emails)"
                className={cn(
                  "w-full rounded-lg border-0 bg-slate-100 pl-7 placeholder:text-slate-600",
                  "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0",
                )}
              />
            </div>

            <div className="flex items-center space-x-3">
              <HiOutlineMenuAlt2 className="size-5 text-slate-600" />
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description"
                className={cn(
                  "w-full rounded-lg border-0 bg-slate-100 pl-7 placeholder:text-slate-600",
                  "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0",
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-semibold">{event.title}</p>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <FiClock className="size-4" />
              <p>{dayjs(event.date).format("dddd, MMMM D, YYYY h:mm A")}</p>
            </div>
            {event.description && (
              <div className="flex items-start space-x-2">
                <HiOutlineMenuAlt2 className="size-5 text-gray-600 mt-0.5" />
                <p className="text-gray-700">{event.description}</p>
              </div>
            )}
            {event.guests && (
              <div className="flex items-start space-x-2">
                <HiOutlineUsers className="size-5 text-gray-600 mt-0.5" />
                <p className="text-gray-700">{event.guests}</p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                <FiEdit className="size-4" />
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isPending} className="flex items-center gap-2">
                <FiTrash2 className="size-4" />
                {isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
        {success && <p className="mt-2 text-green-500 text-sm">Success!</p>}
      </div>
    </div>
  )
}
