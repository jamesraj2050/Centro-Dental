"use client"

import { useState } from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

interface PaymentFormProps {
  appointmentId: string
  patientName: string
  currentAmount?: number
  currentTreatmentStatus?: "PENDING" | "PARTIAL" | "COMPLETED"
  onSubmit: (data: PaymentFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export interface PaymentFormData {
  appointmentId: string
  amount: number
  treatmentStatus: "PENDING" | "PARTIAL" | "COMPLETED"
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  appointmentId,
  patientName,
  currentAmount,
  currentTreatmentStatus = "PENDING",
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [amount, setAmount] = useState<string>(currentAmount?.toString() || "")
  const [treatmentStatus, setTreatmentStatus] = useState<
    "PENDING" | "PARTIAL" | "COMPLETED"
  >(currentTreatmentStatus || "PENDING")
  const [error, setError] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 0) {
      setError("Please enter a valid amount")
      return
    }

    await onSubmit({
      appointmentId,
      amount: amountNum,
      treatmentStatus,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-[#f5f5f7] rounded-xl">
        <p className="text-sm text-[#86868b] mb-1">Patient</p>
        <p className="font-semibold text-[#1d1d1f]">{patientName}</p>
      </div>

      <Input
        label="Payment Amount (AUD) *"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value)
          setError("")
        }}
        error={error}
        placeholder="0.00"
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#1d1d1f] mb-3">
            Treatment Status *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["PARTIAL", "COMPLETED"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setTreatmentStatus(status === "COMPLETED" ? "COMPLETED" : "PARTIAL")}
                className={[
                  "p-2.5 sm:p-3 rounded-xl border-2 text-xs sm:text-sm font-medium",
                  "transition-all focus:outline-none focus:ring-0",
                  treatmentStatus === status
                    ? status === "PARTIAL"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-green-600 bg-green-50 text-green-700"
                    : "border-[#e5e5ea] text-[#1d1d1f] hover:border-[#1E40AF]/50",
                ].join(" ")}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e5ea]">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading} loading={isLoading}>
          Update Payment
        </Button>
      </div>
    </form>
  )
}

