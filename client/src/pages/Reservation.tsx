"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Edit, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import Loader from "@/components/Loader"

interface Reservation {
  id?: number
  first_name: string
  last_name: string
  phone: string
  email: string
  party_size: number
  date: string
  time: string
}

interface TimeSlot {
  id?: number
  start_time: string
  end_time: string
}

export default function ReservationPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([])
  const [form, setForm] = useState<Reservation>({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    party_size: 1,
    date: "",
    time: "",
  })
  const [editId, setEditId] = useState<number | null>(null)
  const [viewData, setViewData] = useState<Reservation | null>(null)
  const [openForm, setOpenForm] = useState(false)
  const [openView, setOpenView] = useState(false)

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [slotForm, setSlotForm] = useState<TimeSlot>({ start_time: "", end_time: "" })
  const [editSlotId, setEditSlotId] = useState<number | null>(null)
  const [openSlotForm, setOpenSlotForm] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [reservationPage, setReservationPage] = useState(1)
  const reservationsPerPage = 5

  const [loading, setLoading] = useState(false) // loader state

  const API_URL = "https://dosaworld-backend-xypt.onrender.com/api/reservations"
  const SLOT_API = "https://dosaworld-backend-xypt.onrender.com/api/timeslots"

  // -------------------- Fetch Reservations --------------------
  const fetchReservations = async () => {
    try {
      setLoading(true)
      const res = await axios.get(API_URL)
      setReservations(res.data)
      setFilteredReservations(res.data)
    } catch (err) {
      console.error("Error fetching reservations:", err)
    } finally {
      setLoading(false)
    }
  }

  // -------------------- Fetch Time Slots --------------------
  const fetchSlots = async () => {
    try {
      setLoading(true)
      const res = await axios.get(SLOT_API)
      setTimeSlots(res.data)
    } catch (err) {
      console.error("Error fetching slots:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReservations() }, [])
  useEffect(() => { fetchSlots() }, [])

  // -------------------- Reservation Actions --------------------
  const handleSubmit = async () => {
    try {
      setLoading(true)
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, form)
      } else {
        await axios.post(API_URL, form)
      }
      setForm({ first_name: "", last_name: "", phone: "", email: "", party_size: 1, date: "", time: "" })
      setEditId(null)
      setOpenForm(false)
      await fetchReservations()
    } catch (err) {
      console.error("Error saving reservation:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      setLoading(true)
      await axios.delete(`${API_URL}/${id}`)
      await fetchReservations()
    } catch (err) {
      console.error("Error deleting reservation:", err)
    } finally {
      setLoading(false)
    }
  }

  // -------------------- Time Slot Actions --------------------
  const handleSlotSubmit = async () => {
    try {
      setLoading(true)
      if (editSlotId) {
        await axios.put(`${SLOT_API}/${editSlotId}`, slotForm)
      } else {
        await axios.post(SLOT_API, slotForm)
      }
      setSlotForm({ start_time: "", end_time: "" })
      setEditSlotId(null)
      setOpenSlotForm(false)
      await fetchSlots()
    } catch (err) {
      console.error("Error saving slot:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSlotDelete = async (id: number) => {
    try {
      setLoading(true)
      await axios.delete(`${SLOT_API}/${id}`)
      await fetchSlots()
    } catch (err) {
      console.error("Error deleting slot:", err)
    } finally {
      setLoading(false)
    }
  }

  // -------------------- Search & Pagination --------------------
  useEffect(() => {
    const query = searchQuery.toLowerCase()
    const filtered = reservations.filter((r) => {
      const fullDate1 = new Date(r.date).toLocaleDateString("en-GB")
      const fullDate2 = new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      return (
        r.first_name.toLowerCase().includes(query) ||
        r.last_name.toLowerCase().includes(query) ||
        fullDate1.includes(query) ||
        fullDate2.toLowerCase().includes(query)
      )
    })
    setFilteredReservations(filtered)
    setReservationPage(1)
  }, [searchQuery, reservations])

  const totalReservationPages = Math.ceil(filteredReservations.length / reservationsPerPage)
  const startIndex = (reservationPage - 1) * reservationsPerPage
  const paginatedReservations = filteredReservations.slice(startIndex, startIndex + reservationsPerPage)

  // -------------------- Loader Render --------------------
  if (loading) return <Loader />

  // -------------------- Main Render --------------------
  return (
    <div className="space-y-6">
      {/* Reservations Table */}
      <div className="mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold uppercase">Reservation Management</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input
              placeholder="Search by name or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm h-8 px-2 w-full sm:w-auto"
            />
            <Button
              size="sm"
              className="h-8 px-2 text-sm w-full sm:w-auto flex items-center justify-center gap-1"
              onClick={() => {
                setForm({ first_name: "", last_name: "", phone: "", email: "", party_size: 1, date: "", time: "" })
                setEditId(null)
                setOpenForm(true)
              }}
            >
              <Plus className="w-3 h-3" /> Create Reservation
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead className="bg-muted-foreground/10 uppercase">
              <tr>
                <th className="p-2 border-b w-8">#</th>
                <th className="p-2 border-b">First Name</th>
                <th className="p-2 border-b">Last Name</th>
                <th className="p-2 border-b hidden xs:table-cell">Phone</th>
                <th className="p-2 border-b hidden xs:table-cell">Email</th>
                <th className="p-2 border-b hidden xs:table-cell">Party Size</th>
                <th className="p-2 border-b">Date</th>
                <th className="p-2 border-b hidden xs:table-cell">Time</th>
                <th className="p-2 border-b w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReservations.map((r, i) => (
                <tr key={r.id} className="border-b last:border-b-0 hover:bg-muted/10">
                  <td className="p-2">{startIndex + i + 1}</td>
                  <td className="p-2 font-medium">{r.first_name}</td>
                  <td className="p-2 font-medium">{r.last_name}</td>
                  <td className="p-2 hidden xs:table-cell">{r.phone}</td>
                  <td className="p-2 hidden xs:table-cell">{r.email}</td>
                  <td className="p-2 hidden xs:table-cell">{r.party_size}</td>
                  <td className="p-2">{new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td className="p-2 hidden xs:table-cell">{r.time}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => { setForm(r); setEditId(r.id!); setOpenForm(true) }}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => { setViewData(r); setOpenView(true) }}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => handleDelete(r.id!)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalReservationPages > 1 && (
          <div className="flex flex-wrap gap-1 justify-center items-center mt-4">
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={reservationPage === 1} onClick={() => setReservationPage(reservationPage - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: totalReservationPages }, (_, i) => i + 1)
              .filter(page => page === 1 || page === totalReservationPages || (page >= reservationPage - 1 && page <= reservationPage + 1))
              .map((page, idx, arr) => (
                <div key={page} className="flex items-center">
                  {idx > 0 && arr[idx] - arr[idx - 1] > 1 && <span className="px-1 text-xs">...</span>}
                  <Button size="sm" variant={page === reservationPage ? "default" : "outline"} className="h-8 w-8 p-0 text-xs" onClick={() => setReservationPage(page)}>
                    {page}
                  </Button>
                </div>
              ))}
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={reservationPage === totalReservationPages} onClick={() => setReservationPage(reservationPage + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Time Slot Management */}
      <div className="mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold uppercase">Time Slot Management</h2>
          <Button
            size="sm"
            className="w-full sm:w-auto text-xs sm:text-sm py-1 px-2 h-8"
            onClick={() => {
              setSlotForm({ start_time: "", end_time: "" })
              setEditSlotId(null)
              setOpenSlotForm(true)
            }}
          >
            <Plus className="w-3 h-3 mr-1" /> Create Time Slot
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {timeSlots.map((slot) => (
            <Card key={slot.id} className="shadow-sm border rounded-lg flex items-center">
              <CardHeader className="p-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-center">{slot.start_time}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center gap-1 p-2 pt-0">
                <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => { setSlotForm(slot); setEditSlotId(slot.id!); setOpenSlotForm(true) }}>
                  <Edit className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => handleSlotDelete(slot.id!)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Reservation Form Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">{editId ? "Edit Reservation" : "New Reservation"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="text-sm" />
            <Input placeholder="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="text-sm" />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="text-sm" />
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="text-sm" />
            <select className="border p-2 rounded w-full text-sm" value={form.party_size} onChange={(e) => setForm({ ...form, party_size: Number(e.target.value) })}>
              {[1,2,3,4,5,6].map(size => <option key={size} value={size}>{size} Guests</option>)}
              <option value={7}>7+ Guests</option>
            </select>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="text-sm" />
            <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="text-sm" />
            <Button className="w-full text-sm py-1 h-8" onClick={handleSubmit}>{editId ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reservation View Dialog */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">Reservation Details</DialogTitle>
          </DialogHeader>
          {viewData && (
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {viewData.first_name} {viewData.last_name}</p>
              <p><strong>Phone:</strong> {viewData.phone}</p>
              <p><strong>Email:</strong> {viewData.email}</p>
              <p><strong>Party Size:</strong> {viewData.party_size}</p>
              <p><strong>Date:</strong> {viewData.date}</p>
              <p><strong>Time:</strong> {viewData.time}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Slot Form Dialog */}
      <Dialog open={openSlotForm} onOpenChange={setOpenSlotForm}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">{editSlotId ? "Edit Time Slot" : "New Time Slot"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 flex gap-4">
            <Input type="time" value={slotForm.start_time} onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })} className="text-sm" />
            <Button className="w-full text-sm py-1 h-8" onClick={handleSlotSubmit}>{editSlotId ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
