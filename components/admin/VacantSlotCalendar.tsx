"use client"

import { useState, useEffect } from "react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

interface Slot {
  date: string
  time: string
  isBooked: boolean
  appointment?: {
    id: string
    patientName?: string
    patient?: { name: string }
  }
}

interface VacantSlotCalendarProps {
  onSlotClick?: (date: string, time: string) => void
}

export const VacantSlotCalendar: React.FC<VacantSlotCalendarProps> = ({
  onSlotClick,
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [slots, setSlots] = useState<Slot[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  useEffect(() => {
    fetchSlots()
  }, [currentWeek])

  const fetchSlots = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/admin/slots?startDate=${format(weekStart, "yyyy-MM-dd")}&endDate=${format(weekEnd, "yyyy-MM-dd")}`
      )
      if (response.ok) {
        const data = await response.json()
        setSlots(data.slots)
      }
    } catch (error) {
      console.error("Error fetching slots:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSlotForDateTime = (date: Date, time: string) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return slots.find(
      (slot) => slot.date === dateStr && slot.time === time
    )
  }

  const generateTimeSlots = () => {
    const slots: string[] = []
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        slots.push(timeString)
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  return (
    <div className="w-full">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-lg font-semibold text-[#1d1d1f]">
          {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[#86868b]">Loading slots...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-sm font-semibold text-[#1d1d1f] border-b border-[#e5e5ea]">
                  Time
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day.toString()}
                    className="p-2 text-center text-sm font-semibold text-[#1d1d1f] border-b border-[#e5e5ea] min-w-[120px]"
                  >
                    <div>{format(day, "EEE")}</div>
                    <div className="text-xs text-[#86868b]">{format(day, "MMM d")}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time) => (
                <tr key={time}>
                  <td className="p-2 text-sm font-medium text-[#1d1d1f] border-r border-[#e5e5ea]">
                    {format(new Date(`2000-01-01T${time}`), "h:mm a")}
                  </td>
                  {weekDays.map((day) => {
                    const slot = getSlotForDateTime(day, time)
                    const isBooked = slot?.isBooked || false
                    const patientName =
                      slot?.appointment?.patientName ||
                      slot?.appointment?.patient?.name ||
                      ""

                    return (
                      <td
                        key={`${day}-${time}`}
                        className={cn(
                          "p-2 border border-[#e5e5ea] text-center cursor-pointer transition-all text-xs",
                          isBooked
                            ? "bg-[#f4f4f5] text-[#52525b]"
                            : "bg-green-50 text-[#065f46] hover:bg-green-100",
                          onSlotClick && !isBooked && "hover:ring-2 hover:ring-[#1E40AF]"
                        )}
                        onClick={() => {
                          if (!isBooked && onSlotClick) {
                            onSlotClick(format(day, "yyyy-MM-dd"), time)
                          }
                        }}
                        title={
                          isBooked
                            ? `Booked: ${patientName}`
                            : "Available - Click to book"
                        }
                      >
                        {isBooked ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-medium text-[#111111]">
                              {patientName || "Filled"}
                            </span>
                            <span className="text-[10px] uppercase tracking-wide text-[#6b7280]">
                              Filled
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-semibold">Available</span>
                            <span className="text-[10px] uppercase tracking-wide">
                              Open
                            </span>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

