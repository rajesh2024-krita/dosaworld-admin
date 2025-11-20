"use client"
import React, { useEffect, useState } from "react"
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
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { api } from "@/lib/axios"
import TablesPage from "./TablesPage"

const MySwal = withReactContent(Swal)

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
  const [tables, setTables] = useState([]);

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const [dateFilter, setDateFilter] = useState<"all" | "thisWeek" | "comingWeek" | "thisMonth">("all");


  const reservationsPerPage = 5

  const [loading, setLoading] = useState(false) // loader state

  const API_URL = "https://api.dosaworld.de/api/reservations"
  const SLOT_API = "https://api.dosaworld.de/api/timeslots"


  // const API_URL = "http://localhost:3000/api/reservations"
  // const SLOT_API = "http://localhost:3000/api/timeslots"

  // -------------------- Fetch Reservations --------------------
  const fetchReservations = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/reservations`)
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
      const res = await api.get(`/timeslots`)
      setTimeSlots(res.data)
    } catch (err) {
      console.error("Error fetching slots:", err)
    } finally {
      setLoading(false)
    }
  }

  const getTables = async () => {
    try {
      const res = await api.get('/tables');
      const data = res.data;
      setTables(data)
      return data;
    } catch (error) {
      console.error("Error fetching tables:", error);
      return [];
    }
  };
  useEffect(() => {
    const load = async () => {
      await getTables();
    };
    load();
  }, []);

  useEffect(() => { fetchReservations() }, [])
  useEffect(() => { fetchSlots() }, [])

  // -------------------- Reservation Actions --------------------
  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (editId) {
        await api.put(`/reservations/${editId}`, form);
        await MySwal.fire({
          icon: "success",
          title: "Updated!",
          text: "Reservation has been updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await api.post(`/reservations`, form);
        await MySwal.fire({
          icon: "success",
          title: "Created!",
          text: "Reservation has been created successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      // Reset form & close modal
      setForm({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        party_size: 1,
        date: "",
        time: "",
      });
      setEditId(null);
      setOpenForm(false);

      await fetchReservations();
    } catch (err) {
      console.error("Error saving reservation:", err);

      // ✅ Show custom message if DUPLICATE_SLOT
      const message =
        err.response?.data?.code === "DUPLICATE_SLOT"
          ? err.response.data.message
          : "Failed to save reservation";

      await MySwal.fire({
        icon: "warning", // can use "error" as well
        title: "Oops...",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id: number) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "This reservation will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    })

    if (result.isConfirmed) {
      try {
        setLoading(true)
        await api.delete(`/reservations/${id}`)

        // Show success alert
        await MySwal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Reservation has been deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        })

        await fetchReservations()
      } catch (err) {
        console.error("Error deleting reservation:", err)
        await MySwal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to delete reservation",
        })
      } finally {
        setLoading(false)
      }
    }
  }


  // -------------------- Time Slot Actions --------------------
  const handleSlotSubmit = async () => {
    try {
      setLoading(true);

      if (editSlotId) {
        await api.put(`/timeslots/${editSlotId}`, slotForm);
        await MySwal.fire({
          icon: "success",
          title: "Updated!",
          text: "Slot has been updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await api.post(`/timeslots`, slotForm);
        await MySwal.fire({
          icon: "success",
          title: "Created!",
          text: "Slot has been created successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      // Reset form & close modal
      setSlotForm({ start_time: "", end_time: "" });
      setEditSlotId(null);
      setOpenSlotForm(false);

      await fetchSlots();
    } catch (err: any) {
      // console.error("Error saving slot:", err);

      // Check if server sent the "Time slot already exists" warning
      if (err.response && err.response.status === 400 && err.response.data?.message) {
        await MySwal.fire({
          icon: "warning",
          title: "Warning",
          text: err.response.data.message,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await MySwal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to save slot",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSlotDelete = async (id: number) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "This slot will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    })

    if (result.isConfirmed) {
      try {
        setLoading(true)
        await api.delete(`/timeslots/${id}`)

        // Show success alert
        await MySwal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Slot has been deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        })

        await fetchSlots()
      } catch (err) {
        // console.error("Error deleting slot:", err)
        await MySwal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to delete slot",
        })
      } finally {
        setLoading(false)
      }
    }
  }


  // -------------------- Search & Pagination --------------------
  useEffect(() => {
    const query = searchQuery.toLowerCase()
    console.log('reservations == ')
    const filtered = reservations.filter((r) => {
      const fullDate1 = new Date(r.date).toLocaleDateString("en-GB")
      const fullDate2 = new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      return (
        r.first_name.toLowerCase().includes(query) ||
        r.last_name.toLowerCase().includes(query) ||
        (r.party_size?.toString().includes(query)) ||
        fullDate1.includes(query) ||
        fullDate2.toLowerCase().includes(query)
      )
    })
    setFilteredReservations(filtered)
    setReservationPage(1)
  }, [searchQuery, reservations])

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getStartOfNextWeek = (date: Date) => {
    const start = getStartOfWeek(date);
    start.setDate(start.getDate() + 7);
    return start;
  };

  const getStartOfMonth = (date: Date) => {
    const d = new Date(date);
    d.setDate(1);
    return d;
  };

  useEffect(() => {
    const today = new Date();

    const thisWeekStart = getStartOfWeek(today);
    const nextWeekStart = getStartOfNextWeek(today);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

    const thisMonthStart = getStartOfMonth(today);

    let updated = [...reservations]; // original full list

    updated = updated.filter(r => {
      const created = new Date(r.created_at);

      switch (dateFilter) {
        case "thisWeek":
          return created >= thisWeekStart && created <= today;

        case "comingWeek":
          return created >= nextWeekStart && created <= nextWeekEnd;

        case "thisMonth":
          return created >= thisMonthStart;

        default:
          return true;
      }
    });

    setFilteredReservations(updated);
  }, [dateFilter, reservations]);

  const totalReservationPages = Math.ceil(filteredReservations.length / reservationsPerPage)
  const startIndex = (reservationPage - 1) * reservationsPerPage
  const paginatedReservations = filteredReservations.slice(startIndex, startIndex + reservationsPerPage)


  const sortedReservations = React.useMemo(() => {
    let sorted = [...paginatedReservations];
    if (sortConfig !== null) {
      sorted.sort((a, b) => {
        const key = sortConfig.key as keyof typeof a;
        const valueA = a[key];
        const valueB = b[key];

        if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [paginatedReservations, sortConfig]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };
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
            <select
              className="border px-2 py-1 rounded text-xs"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="thisWeek">This Week</option>
              <option value="comingWeek">Next Week</option>
              <option value="thisMonth">This Month</option>
            </select>

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
                <th
                  className="p-2 border-b cursor-pointer select-none"
                  onClick={() => handleSort("first_name")}
                >
                  Name {sortConfig?.key === "first_name" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                {/* <th className="p-2 border-b">Last Name</th> */}
                <th
                  className="p-2 border-b cursor-pointer select-none hidden xs:table-cell"
                  onClick={() => handleSort("phone")}
                >
                  Phone {sortConfig?.key === "phone" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-2 border-b hidden xs:table-cell">Email</th>
                <th
                  className="p-2 border-b cursor-pointer select-none"
                  onClick={() => handleSort("party_size")}
                >
                  Table no {sortConfig?.key === "party_size" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  className="p-2 border-b cursor-pointer select-none"
                  onClick={() => handleSort("date")}
                >
                  Reserved on {sortConfig?.key === "date" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-2 border-b">Time Slot</th>
                <th
                  className="p-2 border-b cursor-pointer select-none"
                  onClick={() => handleSort("created_at")}
                >
                  Created At {sortConfig?.key === "created_at" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                <th className="p-2 border-b w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedReservations.map((r, i) => (
                <tr key={r.id} className="border-b last:border-b-0 hover:bg-muted/10">
                  <td className="p-2">{startIndex + i + 1}</td>
                  <td className="p-2 font-medium">{r.first_name} {r.last_name}</td>
                  {/* <td className="p-2 font-medium">{r.last_name}</td> */}
                  <td className="p-2 hidden xs:table-cell">{r.phone}</td>
                  <td className="p-2 hidden xs:table-cell">{r.email}</td>
                  <td className="p-2">{r.party_size}</td>
                  <td className="p-2">{new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td className="p-2">{r.time}</td>
                  <td className="p-2">{new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
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

      {/* Table management */}
      <TablesPage />

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
          <div className="space-y-3 h-96 overflow-auto p-2">
            <div className="flex gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <Input
                  placeholder="First Name"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <Input
                  placeholder="Last Name"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Party Size</label>
              <select
                className="border p-2 rounded w-full text-sm"
                value={form.party_size}
                onChange={(e) => setForm({ ...form, party_size: Number(e.target.value) })}
              >
                {tables.map((table) => (
                  <option key={table.id} value={table.table_no}>
                    Table {table.table_no} ({table.seats} seats)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input
                  type="date"
                  value={form.date ? form.date.split('T')[0] : ''}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="text-sm w-full"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Time Slot</label>
                <select
                  className="border py-2.5 w-full text-sm"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                >
                  <option value="">Select Time Slot</option>
                  {timeSlots
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .filter((slot) => {
                      if (!form.date) return true;

                      const today = new Date();
                      const selectedDate = new Date(form.date);
                      const [hours, minutes] = slot.start_time.split(":").map(Number);

                      if (
                        selectedDate.toDateString() === today.toDateString() &&
                        (hours < today.getHours() || (hours === today.getHours() && minutes <= today.getMinutes()))
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((slot) => (
                      <option key={slot.id} value={slot.start_time}>
                        {slot.start_time}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <Button className="w-full text-sm py-1 h-8" onClick={handleSubmit}>
              {editId ? "Update" : "Create"}
            </Button>
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
            <div className="bg-white">

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">

                {/* Name */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 text-gray-400">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</span>
                  </div>
                  <span className="block text-gray-900 font-medium text-base pl-7">
                    {viewData.first_name} {viewData.last_name}
                  </span>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 text-gray-400">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</span>
                  </div>
                  <a href={`tel:${viewData.phone}`} className="block text-green-600 hover:text-green-700 font-medium text-base pl-7 transition-colors">
                    {viewData.phone}
                  </a>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 text-gray-400">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</span>
                  </div>
                  <a href={`mailto:${viewData.email}`} className="block text-green-600 hover:text-green-700 font-medium text-base pl-7 break-all transition-colors">
                    {viewData.email}
                  </a>
                </div>

                {/* Party Size */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 text-gray-400">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Table No</span>
                  </div>
                  <div className="flex items-center gap-2 pl-7">
                    <span className="text-gray-900 font-medium text-base">
                      {viewData.party_size}
                    </span>
                    {/* <span className="text-xs text-gray-500">Seat</span> */}
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 text-gray-400">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</span>
                  </div>
                  <span className="block text-gray-900 font-medium text-base pl-7">
                    {new Date(viewData.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {/* Time */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 text-gray-400">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time</span>
                  </div>
                  <span className="block text-gray-900 font-medium text-base pl-7">
                    {viewData.time}
                  </span>
                </div>

              </div>
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
