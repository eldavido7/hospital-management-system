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
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface AdmissionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientName: string
  onComplete: () => void
}

interface RoomType {
  id: string
  name: string
  price: number
  description: string
}

export function AdmissionModal({ open, onOpenChange, patientName, onComplete }: AdmissionModalProps) {
  const [selectedRoomType, setSelectedRoomType] = useState("")
  const [selectedRoom, setSelectedRoom] = useState("")
  const [admissionNotes, setAdmissionNotes] = useState("")
  const { toast } = useToast()

  // Mock room types data
  const roomTypes: RoomType[] = [
    { id: "ward", name: "General Ward", price: 15000, description: "Shared room with 4-6 beds" },
    { id: "semi", name: "Semi-Private", price: 25000, description: "Shared room with 2 beds" },
    { id: "private", name: "Private Room", price: 45000, description: "Private room with en-suite bathroom" },
    { id: "vip", name: "VIP Suite", price: 85000, description: "Luxury suite with living area and premium amenities" },
  ]

  // Mock rooms based on selected type
  const availableRooms = [
    { id: "101", number: "101" },
    { id: "102", number: "102" },
    { id: "103", number: "103" },
    { id: "201", number: "201" },
    { id: "202", number: "202" },
  ]

  const handleAdmit = () => {
    toast({
      title: "Patient Admitted Successfully",
      description: `${patientName} has been admitted to Room ${selectedRoom}`,
    })

    setSelectedRoomType("")
    setSelectedRoom("")
    setAdmissionNotes("")
    onOpenChange(false)
    onComplete()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Admit Patient</DialogTitle>
          <DialogDescription>
            This will admit {patientName} as an inpatient. Please select a room type and room number.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type</Label>
            <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
              <SelectTrigger id="roomType">
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} - ₦{type.price.toLocaleString()}/day
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRoomType && (
              <p className="text-sm text-muted-foreground mt-1">
                {roomTypes.find((t) => t.id === selectedRoomType)?.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="room">Room Number</Label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom} disabled={!selectedRoomType}>
              <SelectTrigger id="room">
                <SelectValue placeholder="Select room number" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    Room {room.number}
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
              placeholder="Enter any additional notes for admission"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdmit} disabled={!selectedRoomType || !selectedRoom}>
            Admit Patient
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
