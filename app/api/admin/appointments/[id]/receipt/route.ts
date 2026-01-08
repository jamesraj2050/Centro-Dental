import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildReceiptPdf } from "@/lib/receipt"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
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

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    if (appointment.paymentStatus !== "PAID") {
      return NextResponse.json(
        { error: "Receipt available only after payment is marked as received." },
        { status: 400 }
      )
    }

    const receiptBuffer = buildReceiptPdf({
      clinicName: "Centro Dental",
      clinicPhone: "(08) 9964 2861",
      clinicEmail: "info@centrodental.com.au",
      patientName: appointment.patient?.name || appointment.patientName || "Valued Patient",
      service: appointment.service,
      amount: appointment.paymentAmount ? Number(appointment.paymentAmount) : 0,
      appointmentDate: appointment.date,
      paymentDate: new Date(),
      issuedBy: session.user.name || "Admin",
    })

    // Convert the Uint8Array into a proper ArrayBuffer first
    const arrayBuffer = receiptBuffer.buffer.slice(
      receiptBuffer.byteOffset,
      receiptBuffer.byteOffset + receiptBuffer.byteLength
    )

    // Wrap ArrayBuffer in a Blob so NextResponse gets a valid BodyInit
    const pdfBlob = new Blob([arrayBuffer], { type: "application/pdf" })

    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"receipt-${params.id}.pdf\"`,
      },
    })
  } catch (error) {
    console.error("Error generating receipt:", error)
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 })
  }
}

