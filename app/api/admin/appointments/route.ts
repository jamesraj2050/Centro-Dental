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
  doctorId: z.string().uuid().optional().nullable(),
})

// GET: Get all appointments with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await setCurrentUserIdForRLS(session.user.id)

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status")

    const where: any = {}

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    if (status) {
      where.status = status
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
        doctor: {
          select: {
            name: true,
            email: true,
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

// POST: Create appointment (guest or linked to user)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await setCurrentUserIdForRLS(session.user.id)

    const body = await request.json()
    const validatedData = appointmentSchema.parse(body)

    // Combine date and time
    const appointmentDate = new Date(validatedData.date)
    const [hours, minutes] = validatedData.time.split(":").map(Number)
    appointmentDate.setHours(hours, minutes, 0, 0)

    // If a doctor is specified, avoid double-booking that doctor at this time
    if (validatedData.doctorId) {
      const slotTaken = await prisma.appointment.findFirst({
        where: {
          date: appointmentDate,
          status: {
            notIn: ["CANCELLED"],
          },
          doctor: {
            is: { id: validatedData.doctorId },
          },
        },
      })

      if (slotTaken) {
        return NextResponse.json(
          { error: "This doctor already has an appointment at that time." },
          { status: 400 }
        )
      }
    }

    // Try to find existing user, otherwise create guest appointment
    let user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    const appointmentData: any = {
      service: validatedData.service,
      date: appointmentDate,
      status: "CONFIRMED",
      ...(validatedData.notes ? { notes: validatedData.notes } : {}),
      createdBy: "ADMIN",
      paymentStatus: "PENDING",
      // treatmentStatus omitted here to stay compatible with current Prisma schema/client
    }

    if (validatedData.doctorId) {
      appointmentData.doctor = {
        connect: { id: validatedData.doctorId },
      }
    }

    if (user) {
      // Link to existing user via relation
      appointmentData.patient = {
        connect: { id: user.id },
      }
    } else {
      // Guest appointment
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
        doctor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(
      { success: true, appointment },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating appointment:", error)
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    )
  }
}

