import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create default availability (Monday to Friday, 9 AM to 5 PM)
  const daysOfWeek = [
    { day: 1, name: "Monday" },
    { day: 2, name: "Tuesday" },
    { day: 3, name: "Wednesday" },
    { day: 4, name: "Thursday" },
    { day: 5, name: "Friday" },
  ]

  for (const day of daysOfWeek) {
    const existing = await prisma.availability.findFirst({
      where: { dayOfWeek: day.day },
    })

    if (!existing) {
      await prisma.availability.create({
        data: {
          dayOfWeek: day.day,
          startTime: "09:00",
          endTime: "17:00",
          isActive: true,
        },
      })
    } else {
      await prisma.availability.update({
        where: { id: existing.id },
        data: {
          startTime: "09:00",
          endTime: "17:00",
          isActive: true,
        },
      })
    }
  }

  console.log("✅ Seeded availability data")

  // Create Admin user
  const adminEmail = "Admin@AusDenta.au"
  const adminPassword = "Admin@135"
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10)

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        password: hashedAdminPassword,
        role: "ADMIN",
      },
    })
    console.log("✅ Created admin user")
  } else {
    // Update existing admin password if needed
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password: hashedAdminPassword,
        role: "ADMIN",
      },
    })
    console.log("✅ Updated admin user")
  }

  // Create Doctor user (you can customize this)
  const doctorEmail = "Doctor@AusDenta.au"
  const doctorPassword = "Doctor@123"
  const hashedDoctorPassword = await bcrypt.hash(doctorPassword, 10)

  const existingDoctor = await prisma.user.findUnique({
    where: { email: doctorEmail },
  })

  if (!existingDoctor) {
    await prisma.user.create({
      data: {
        email: doctorEmail,
        name: "Dr. Chandy Koruthu",
        password: hashedDoctorPassword,
        role: "DOCTOR",
      },
    })
    console.log("✅ Created doctor user")
  } else {
    await prisma.user.update({
      where: { email: doctorEmail },
      data: {
        password: hashedDoctorPassword,
        role: "DOCTOR",
      },
    })
    console.log("✅ Updated doctor user")
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

