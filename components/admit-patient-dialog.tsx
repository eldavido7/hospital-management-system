"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getAvailableRooms } from "@/lib/data/inpatient-dummy-data"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface AdmitPatientDialogProps {
  patientId: string
  patientName: string
}

export default function AdmitPatientDialog({ patientId, patientName }: AdmitPatientDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<string>("")
  const [admissionNotes, setAdmissionNotes] = useState<string>("")

  const availableRooms = getAvailableRooms()

  const handleAdmit = () => {
    // In a real app, we would update the database
    // For this simulation, we'll just navigate to the room page
    setOpen(false)

    if (selectedRoomId) {
      router.push(`/inpatient/room/${selectedRoomId}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Admit as Inpatient</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Admit Patient</DialogTitle>
          <DialogDescription>Admit {patientName} as an inpatient and assign a room.</DialogDescription>
        </DialogHeader>

        {availableRooms.length === 0 ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No rooms available</AlertTitle>
            <AlertDescription>There are currently no available rooms for admission.</AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room">Select Room</Label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      Room {room.number} - {room.type} (₦{room.dailyRate.toLocaleString()}/day)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Admission Notes</Label>
              <Textarea
                id="notes"
                value={admissionNotes}
                onChange={(e) => setAdmissionNotes(e.target.value)}
                placeholder="Enter any notes for admission"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdmit} disabled={!selectedRoomId || availableRooms.length === 0}>
            Admit Patient
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
