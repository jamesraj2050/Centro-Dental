import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma, setCurrentUserIdForRLS } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ hasAppointment: false })
    }

    await setCurrentUserIdForRLS(session.user.id)

    // Check if user has an active appointment (not cancelled or completed)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ hasAppointment: false })
    }

    const activeAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: user.id,
        status: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
        date: {
          gte: new Date(),
        },
      },
    })

    return NextResponse.json({ hasAppointment: !!activeAppointment })
  } catch (error) {
    console.error("Error checking appointment:", error)
    return NextResponse.json({ hasAppointment: false })
  }
}

