import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma, setCurrentUserIdForRLS } from "@/lib/prisma"
import { z } from "zod"

const appointmentSchema = z.object({
  date: z.string(),
  time: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  service: z.string().min(1),
  notes: z.string().optional(),
})

// GET: Get appointments for doctor
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await setCurrentUserIdForRLS(session.user.id)

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {
      doctorId: session.user.id,
      status: {
        notIn: ["CANCELLED"],
      },
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        patient: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    )
  }
}

// POST: Doctor-created appointment
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await setCurrentUserIdForRLS(session.user.id)

    const body = await request.json()
    const validatedData = appointmentSchema.parse(body)

    // Handle date - could be ISO string or separate date/time
    let appointmentDate: Date
    if (validatedData.date.includes('T') || validatedData.date.includes('Z')) {
      // Already an ISO string with time
      appointmentDate = new Date(validatedData.date)
    } else {
      // Separate date and time - combine them
      appointmentDate = new Date(validatedData.date)
      const [hours, minutes] = validatedData.time.split(":").map(Number)
      appointmentDate.setHours(hours, minutes, 0, 0)
    }

    const slotTaken = await prisma.appointment.findFirst({
      where: {
        date: appointmentDate,
        status: {
          notIn: ["CANCELLED"],
        },
        // Ensure the same dentist is not double-booked for this time
        doctor: {
          is: { id: session.user.id },
        },
      },
    })

    if (slotTaken) {
      return NextResponse.json(
        { error: "This slot is already filled. Please select another time." },
        { status: 400 }
      )
    }

    let user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    // Build base data for appointment
    const appointmentData: any = {
      service: validatedData.service,
      date: appointmentDate,
      status: "CONFIRMED",
      ...(validatedData.notes ? { notes: validatedData.notes } : {}),
      createdBy: "DOCTOR",
      paymentStatus: "PENDING",
      // Link via relation instead of doctorId scalar to stay compatible with Prisma client
      doctor: {
        connect: { id: session.user.id },
      },
      // treatmentStatus omitted here to stay compatible with current Prisma schema/client
    }

    if (user) {
      // Link existing user via relation
      appointmentData.patient = {
        connect: { id: user.id },
      }
    } else {
      // Guest-style appointment (no linked user record)
      appointmentData.patientName = validatedData.name
      appointmentData.patientEmail = validatedData.email
      appointmentData.patientPhone = validatedData.phone
    }

    const appointment = await prisma.appointment.create({
      data: appointmentData,
      include: {
        patient: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, appointment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating appointment:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    // Strip ANSI escape codes from error message
    const cleanErrorMessage = errorMessage.replace(/\x1b\[[0-9;]*m/g, '')
    return NextResponse.json(
      { error: "Failed to create appointment", details: cleanErrorMessage },
      { status: 500 }
    )
  }
}

