"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/axios"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Edit, Trash2, Plus, Calendar, User, Phone, Mail, MapPin, Users, Bell, Loader2 } from "lucide-react"

interface Product {
  name: string
  quantity: number
  price: number
}

type PartyStatus = "registered" | "advance paid" | "paid" | "unpaid" | "completed"

interface Party {
  id: number
  partyName: string
  customerName: string
  phone: string
  email: string
  issuedDate: string
  dueDate: string
  guests: number
  status: PartyStatus
  products: Product[]
  address: string
  createdAt?: string
  updatedAt?: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  count?: number
}

// const API_BASE_URL = "http://localhost:5000/api"

export default function PartyManagement() {
  const [parties, setParties] = useState<Party[]>([])
  const [form, setForm] = useState<Party>({
    id: 0,
    partyName: "",
    customerName: "",
    phone: "",
    email: "",
    issuedDate: "",
    dueDate: "",
    guests: 0,
    status: "registered",
    products: [{ name: "", quantity: 0, price: 0 }],
    address: "",
  })
  const [open, setOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Color constants based on the theme
  const themeColors = {
    primary: "#15803d",
    primaryLight: "#dcfce7",
    primaryDark: "#166534",
    card: "#ffffff",
    text: "#1a1a1a"
  }

  // API functions
  const fetchParties = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/parties`)
      const result: ApiResponse<Party[]> = await response.json()
      
      if (result.success && result.data) {
        setParties(result.data)
      } else {
        throw new Error(result.message || 'Failed to fetch parties')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch parties')
      console.error('Error fetching parties:', err)
    } finally {
      setLoading(false)
    }
  }

  const createParty = async (partyData: Omit<Party, 'id'>) => {
    const response = await fetch(`${API_BASE_URL}/parties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(partyData),
    })
    return await response.json()
  }

  const updateParty = async (id: number, partyData: Partial<Party>) => {
    const response = await fetch(`${API_BASE_URL}/parties/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(partyData),
    })
    return await response.json()
  }

  const updatePartyStatus = async (id: number, status: PartyStatus) => {
    const response = await fetch(`${API_BASE_URL}/parties/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })
    return await response.json()
  }

  const deleteParty = async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/parties/${id}`, {
      method: 'DELETE',
    })
    return await response.json()
  }

  const fetchOverdueParties = async () => {
    const response = await fetch(`${API_BASE_URL}/overdue-parties`)
    return await response.json()
  }

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    setForm((prev) => ({ ...prev, issuedDate: today }))
    fetchParties()
  }, [])

  // Overdue parties not completed
  const overdueParties = parties.filter(
    (p) => p.dueDate && p.dueDate < new Date().toISOString().split("T")[0] && p.status !== "completed"
  )

  const handleEdit = (party: Party) => {
    setForm(party)
    setOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this party?')) return

    try {
      const result = await deleteParty(id)
      if (result.success) {
        setParties((prev) => prev.filter((p) => p.id !== id))
      } else {
        throw new Error(result.message || 'Failed to delete party')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete party')
      console.error('Error deleting party:', err)
    }
  }

  const handleStatusChange = async (id: number, status: PartyStatus) => {
    try {
      const result = await updatePartyStatus(id, status)
      if (result.success) {
        setParties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status } : p))
        )
        if (status === "paid" || status === "advance paid" || status === "completed") {
          setSelectedNotification(null)
        }
      } else {
        throw new Error(result.message || 'Failed to update status')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
      console.error('Error updating status:', err)
    }
  }

  const handleProductChange = (index: number, field: keyof Product, value: any) => {
    const updatedProducts = [...form.products]
    updatedProducts[index][field] = value
    setForm({ ...form, products: updatedProducts })
  }

  const addProductRow = () => {
    setForm({
      ...form,
      products: [...form.products, { name: "", quantity: 0, price: 0 }],
    })
  }

  const handleSubmit = async () => {
    if (!form.partyName || !form.customerName || !form.address || !form.dueDate) {
      alert("Please fill all required fields.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { id, ...partyData } = form

      if (id) {
        // Update existing party
        const result = await updateParty(id, partyData)
        if (result.success && result.data) {
          setParties((prev) => prev.map((p) => (p.id === id ? result.data : p)))
        } else {
          throw new Error(result.message || 'Failed to update party')
        }
      } else {
        // Create new party
        const result = await createParty(partyData)
        if (result.success && result.data) {
          setParties((prev) => [...prev, result.data])
        } else {
          throw new Error(result.message || 'Failed to create party')
        }
      }

      // Reset form
      setForm({
        id: 0,
        partyName: "",
        customerName: "",
        phone: "",
        email: "",
        issuedDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        guests: 0,
        status: "registered",
        products: [{ name: "", quantity: 0, price: 0 }],
        address: "",
      })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save party')
      console.error('Error saving party:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: PartyStatus) => {
    const colors = {
      registered: "bg-blue-100 text-blue-800",
      "advance paid": "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      unpaid: "bg-red-100 text-red-800",
      completed: "bg-gray-100 text-gray-800"
    }
    return colors[status]
  }

  return (
    <div className="p-4">
      {/* Header Section */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold" style={{ color: themeColors.primary }}>
          Party Management
        </h1>
        <p className="text-sm text-gray-600">Manage your events, parties, and customer details</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* 🔔 Notifications */}
      {overdueParties.length > 0 && (
        <Card className="mb-4 border-l-4" style={{ borderLeftColor: "#dc2626" }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-red-600" />
              <h3 className="font-semibold text-red-700 text-sm">Pending Action Required</h3>
            </div>
            <p className="text-xs text-red-600 mb-2">
              The following parties are overdue. Click to update status:
            </p>
            <div className="space-y-2">
              {overdueParties.map((party) => (
                <div
                  key={party.id}
                  className="flex justify-between items-center p-2 rounded border border-red-200 bg-white hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{party.partyName}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {party.customerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due: {party.dueDate}
                      </span>
                      <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(party.status)}`}>
                        {party.status}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="text-xs h-7"
                    style={{ backgroundColor: themeColors.primary }}
                    onClick={() => {
                      handleEdit(party)
                      setSelectedNotification(party.id)
                    }}
                  >
                    Update
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Party Management Table */}
      <Card className="shadow-sm border">
        <CardHeader 
          className="border-b p-3"
          style={{ backgroundColor: themeColors.primary, color: "white" }}
        >
          <div className="flex justify-between items-center">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              All Parties
            </CardTitle>
            <div className="flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="shadow-sm hover:shadow transition-all text-sm h-8"
                    style={{ backgroundColor: "white", color: themeColors.primary }}
                    disabled={loading}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Party
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg" style={{ color: themeColors.primary }}>
                      {form.id ? "Edit Party" : "Add New Party"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Party Name *
                        </label>
                        <Input
                          placeholder="Birthday Party, Wedding, etc."
                          value={form.partyName}
                          onChange={(e) => setForm({ ...form, partyName: e.target.value })}
                          className="h-9"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Customer Name *
                        </label>
                        <Input
                          placeholder="Customer full name"
                          value={form.customerName}
                          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                          className="h-9"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Phone *
                        </label>
                        <Input
                          placeholder="Phone number"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="h-9"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          Email *
                        </label>
                        <Input
                          placeholder="Email address"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="h-9"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Address *
                      </label>
                      <Input
                        placeholder="Full address"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="h-9"
                        disabled={loading}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Guests *
                        </label>
                        <Input
                          type="number"
                          placeholder="50"
                          value={form.guests}
                          onChange={(e) => setForm({ ...form, guests: parseInt(e.target.value) || 0 })}
                          className="h-9"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Issued Date</label>
                        <Input 
                          type="date" 
                          value={form.issuedDate} 
                          readOnly 
                          className="h-9 cursor-not-allowed bg-gray-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Due Date *</label>
                        <Input
                          type="date"
                          value={form.dueDate}
                          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                          className="h-9"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Products Section */}
                    <div className="border rounded p-3 space-y-2">
                      <label className="text-sm font-medium">Products & Services</label>
                      {form.products.map((prod, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                          <div className="md:col-span-5">
                            <Input
                              placeholder="Product Name"
                              value={prod.name}
                              onChange={(e) => handleProductChange(index, "name", e.target.value)}
                              className="h-8 text-sm"
                              disabled={loading}
                            />
                          </div>
                          <div className="md:col-span-3">
                            <Input
                              type="number"
                              placeholder="Qty"
                              value={prod.quantity}
                              onChange={(e) => handleProductChange(index, "quantity", parseInt(e.target.value) || 0)}
                              className="h-8 text-sm"
                              disabled={loading}
                            />
                          </div>
                          <div className="md:col-span-3">
                            <Input
                              type="number"
                              placeholder="Price"
                              value={prod.price}
                              onChange={(e) => handleProductChange(index, "price", parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                              disabled={loading}
                            />
                          </div>
                          <div className="md:col-span-1">
                            {form.products.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  const updatedProducts = form.products.filter((_, i) => i !== index)
                                  setForm({ ...form, products: updatedProducts })
                                }}
                                disabled={loading}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        className="w-full h-8 text-sm" 
                        onClick={addProductRow}
                        style={{ borderColor: themeColors.primary, color: themeColors.primary }}
                        disabled={loading}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Product
                      </Button>
                    </div>

                    {/* Status Dropdown */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Status</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as PartyStatus })}
                        className="w-full border rounded p-2 text-sm h-9 focus:ring-1 focus:ring-green-500 focus:border-transparent"
                        style={{ borderColor: themeColors.primary }}
                        disabled={loading}
                      >
                        <option value="registered">Registered</option>
                        <option value="advance paid">Advance Paid</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <Button 
                      className="w-full h-9 font-medium"
                      style={{ backgroundColor: themeColors.primary }}
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {form.id ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        form.id ? "Update Party" : "Create Party"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: themeColors.primaryLight }}>
                  <th className="p-2 text-left font-semibold">Party Details</th>
                  <th className="p-2 text-left font-semibold">Contact Info</th>
                  <th className="p-2 text-left font-semibold">Event Details</th>
                  <th className="p-2 text-left font-semibold">Status</th>
                  <th className="p-2 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parties.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-2">
                      <div>
                        <p className="font-semibold text-gray-900">{p.partyName}</p>
                        <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          {p.customerName}
                        </p>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="space-y-0.5">
                        <p className="text-xs flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {p.phone}
                        </p>
                        <p className="text-xs flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {p.email}
                        </p>
                        <p className="text-xs flex items-start gap-1">
                          <MapPin className="w-3 h-3 mt-0.5" />
                          <span className="flex-1">{p.address}</span>
                        </p>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="space-y-0.5">
                        <p className="text-xs">
                          <span className="font-medium">Guests:</span> {p.guests}
                        </p>
                        <p className="text-xs">
                          <span className="font-medium">Issued:</span> {p.issuedDate}
                        </p>
                        <p className="text-xs">
                          <span className="font-medium">Due:</span> {p.dueDate}
                        </p>
                      </div>
                    </td>
                    <td className="p-2">
                      <select
                        value={p.status}
                        onChange={(e) => handleStatusChange(p.id, e.target.value as PartyStatus)}
                        className={`w-full border rounded p-1 text-xs font-medium h-7 ${getStatusColor(p.status)}`}
                        disabled={loading}
                      >
                        <option value="registered">Registered</option>
                        <option value="advance paid">Advance Paid</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 w-7 p-0"
                          style={{ borderColor: themeColors.primary, color: themeColors.primary }}
                          onClick={() => handleEdit(p)}
                          disabled={loading}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="h-7 w-7 p-0"
                          onClick={() => handleDelete(p.id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {parties.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="text-center p-4 text-gray-500 text-sm">
                      <Calendar className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                      <p>No parties available.</p>
                      <p className="text-xs">Click "Add Party" to get started.</p>
                    </td>
                  </tr>
                )}
                {loading && parties.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-4">
                      <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2">Loading parties...</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}























// "use client"

// import { useState, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"
// import { Edit, Trash2, Plus, Calendar, User, Phone, Mail, MapPin, Users, Bell } from "lucide-react"

// interface Product {
//   name: string
//   quantity: number
//   price: number
// }

// type PartyStatus = "registered" | "advance paid" | "paid" | "unpaid" | "completed"

// interface Party {
//   id: number
//   partyName: string
//   customerName: string
//   phone: string
//   email: string
//   issuedDate: string
//   dueDate: string
//   guests: number
//   status: PartyStatus
//   products: Product[]
//   address: string
// }

// export default function PartyManagement() {
//   const [parties, setParties] = useState<Party[]>([])
//   const [form, setForm] = useState<Party>({
//     id: 0,
//     partyName: "",
//     customerName: "",
//     phone: "",
//     email: "",
//     issuedDate: "",
//     dueDate: "",
//     guests: 0,
//     status: "registered",
//     products: [{ name: "", quantity: 0, price: 0 }],
//     address: "",
//   })
//   const [open, setOpen] = useState(false)
//   const [selectedNotification, setSelectedNotification] = useState<number | null>(null)

//   // Color constants based on the theme
//   const themeColors = {
//     primary: "#15803d",
//     primaryLight: "#dcfce7",
//     primaryDark: "#166534",
//     card: "#ffffff",
//     text: "#1a1a1a"
//   }

//   useEffect(() => {
//     const today = new Date().toISOString().split("T")[0]
//     setForm((prev) => ({ ...prev, issuedDate: today }))

//     // Default party for notification
//     const defaultParty: Party = {
//       id: 1,
//       partyName: "John Birthday Party",
//       customerName: "John Doe",
//       phone: "9876543210",
//       email: "john@example.com",
//       issuedDate: "2025-09-20",
//       dueDate: "2025-09-25",
//       guests: 50,
//       status: "unpaid",
//       address: "123, Green Street, Chennai",
//       products: [
//         { name: "Dosa", quantity: 20, price: 40 },
//         { name: "Vada", quantity: 30, price: 15 },
//       ],
//     }

//     setParties([defaultParty])
//   }, [])

//   // Overdue parties not completed
//   const overdueParties = parties.filter(
//     (p) => p.dueDate && p.dueDate < new Date().toISOString().split("T")[0] && p.status !== "completed"
//   )

//   const handleEdit = (party: Party) => {
//     setForm(party)
//     setOpen(true)
//   }

//   const handleDelete = (id: number) => {
//     setParties((prev) => prev.filter((p) => p.id !== id))
//   }

//   const handleStatusChange = (id: number, status: PartyStatus) => {
//     setParties((prev) =>
//       prev.map((p) => (p.id === id ? { ...p, status } : p))
//     )
//     if (status === "paid" || status === "advance paid" || status === "completed") {
//       setSelectedNotification(null)
//     }
//   }

//   const handleProductChange = (index: number, field: keyof Product, value: any) => {
//     const updatedProducts = [...form.products]
//     updatedProducts[index][field] = value
//     setForm({ ...form, products: updatedProducts })
//   }

//   const addProductRow = () => {
//     setForm({
//       ...form,
//       products: [...form.products, { name: "", quantity: 0, price: 0 }],
//     })
//   }

//   const handleSubmit = () => {
//     if (!form.partyName || !form.customerName || !form.address || !form.dueDate) {
//       alert("Please fill all required fields.")
//       return
//     }

//     if (form.id) {
//       setParties((prev) => prev.map((p) => (p.id === form.id ? { ...form } : p)))
//     } else {
//       setParties((prev) => [...prev, { ...form, id: Date.now() }])
//     }

//     setForm({
//       id: 0,
//       partyName: "",
//       customerName: "",
//       phone: "",
//       email: "",
//       issuedDate: new Date().toISOString().split("T")[0],
//       dueDate: "",
//       guests: 0,
//       status: "registered",
//       products: [{ name: "", quantity: 0, price: 0 }],
//       address: "",
//     })
//     setOpen(false)
//   }

//   const getStatusColor = (status: PartyStatus) => {
//     const colors = {
//       registered: "bg-blue-100 text-blue-800",
//       "advance paid": "bg-yellow-100 text-yellow-800",
//       paid: "bg-green-100 text-green-800",
//       unpaid: "bg-red-100 text-red-800",
//       completed: "bg-gray-100 text-gray-800"
//     }
//     return colors[status]
//   }

//   return (
//     <div className="p-4">
//       {/* Header Section */}
//       <div className="mb-4">
//         <h1 className="text-2xl font-bold" style={{ color: themeColors.primary }}>
//           Party Management
//         </h1>
//         <p className="text-sm text-gray-600">Manage your events, parties, and customer details</p>
//       </div>

//       {/* 🔔 Notifications */}
//       {overdueParties.length > 0 && (
//         <Card className="mb-4 border-l-4" style={{ borderLeftColor: "#dc2626" }}>
//           <CardContent className="p-3">
//             <div className="flex items-center gap-2 mb-2">
//               <Bell className="w-4 h-4 text-red-600" />
//               <h3 className="font-semibold text-red-700 text-sm">Pending Action Required</h3>
//             </div>
//             <p className="text-xs text-red-600 mb-2">
//               The following parties are overdue. Click to update status:
//             </p>
//             <div className="space-y-2">
//               {overdueParties.map((party) => (
//                 <div
//                   key={party.id}
//                   className="flex justify-between items-center p-2 rounded border border-red-200 bg-white hover:shadow-sm transition-shadow cursor-pointer"
//                 >
//                   <div className="flex-1">
//                     <p className="font-medium text-sm text-gray-900">{party.partyName}</p>
//                     <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
//                       <span className="flex items-center gap-1">
//                         <User className="w-3 h-3" />
//                         {party.customerName}
//                       </span>
//                       <span className="flex items-center gap-1">
//                         <Calendar className="w-3 h-3" />
//                         Due: {party.dueDate}
//                       </span>
//                       <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(party.status)}`}>
//                         {party.status}
//                       </span>
//                     </div>
//                   </div>
//                   <Button
//                     size="sm"
//                     className="text-xs h-7"
//                     style={{ backgroundColor: themeColors.primary }}
//                     onClick={() => {
//                       handleEdit(party)
//                       setSelectedNotification(party.id)
//                     }}
//                   >
//                     Update
//                   </Button>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Party Management Table */}
//       <Card className="shadow-sm border">
//         <CardHeader 
//           className="border-b p-3"
//           style={{ backgroundColor: themeColors.primary, color: "white" }}
//         >
//           <div className="flex justify-between items-center">
//             <CardTitle className="text-white text-lg flex items-center gap-2">
//               <Calendar className="w-5 h-5" />
//               All Parties
//             </CardTitle>
//             <Dialog open={open} onOpenChange={setOpen}>
//               <DialogTrigger asChild>
//                 <Button 
//                   className="shadow-sm hover:shadow transition-all text-sm h-8"
//                   style={{ backgroundColor: "white", color: themeColors.primary }}
//                 >
//                   <Plus className="w-3 h-3 mr-1" /> Add Party
//                 </Button>
//               </DialogTrigger>
//               <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
//                 <DialogHeader>
//                   <DialogTitle className="text-lg" style={{ color: themeColors.primary }}>
//                     {form.id ? "Edit Party" : "Add New Party"}
//                   </DialogTitle>
//                 </DialogHeader>
//                 <div className="space-y-3 mt-2">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     <div className="space-y-1">
//                       <label className="text-sm font-medium flex items-center gap-1">
//                         <Calendar className="w-3 h-3" />
//                         Party Name *
//                       </label>
//                       <Input
//                         placeholder="Birthday Party, Wedding, etc."
//                         value={form.partyName}
//                         onChange={(e) => setForm({ ...form, partyName: e.target.value })}
//                         className="h-9"
//                       />
//                     </div>
//                     <div className="space-y-1">
//                       <label className="text-sm font-medium flex items-center gap-1">
//                         <User className="w-3 h-3" />
//                         Customer Name *
//                       </label>
//                       <Input
//                         placeholder="Customer full name"
//                         value={form.customerName}
//                         onChange={(e) => setForm({ ...form, customerName: e.target.value })}
//                         className="h-9"
//                       />
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     <div className="space-y-1">
//                       <label className="text-sm font-medium flex items-center gap-1">
//                         <Phone className="w-3 h-3" />
//                         Phone *
//                       </label>
//                       <Input
//                         placeholder="Phone number"
//                         value={form.phone}
//                         onChange={(e) => setForm({ ...form, phone: e.target.value })}
//                         className="h-9"
//                       />
//                     </div>
//                     <div className="space-y-1">
//                       <label className="text-sm font-medium flex items-center gap-1">
//                         <Mail className="w-3 h-3" />
//                         Email *
//                       </label>
//                       <Input
//                         placeholder="Email address"
//                         value={form.email}
//                         onChange={(e) => setForm({ ...form, email: e.target.value })}
//                         className="h-9"
//                       />
//                     </div>
//                   </div>

//                   <div className="space-y-1">
//                     <label className="text-sm font-medium flex items-center gap-1">
//                       <MapPin className="w-3 h-3" />
//                       Address *
//                     </label>
//                     <Input
//                       placeholder="Full address"
//                       value={form.address}
//                       onChange={(e) => setForm({ ...form, address: e.target.value })}
//                       className="h-9"
//                     />
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                     <div className="space-y-1">
//                       <label className="text-sm font-medium flex items-center gap-1">
//                         <Users className="w-3 h-3" />
//                         Guests *
//                       </label>
//                       <Input
//                         type="number"
//                         placeholder="50"
//                         value={form.guests}
//                         onChange={(e) => setForm({ ...form, guests: parseInt(e.target.value) })}
//                         className="h-9"
//                       />
//                     </div>
//                     <div className="space-y-1">
//                       <label className="text-sm font-medium">Issued Date</label>
//                       <Input 
//                         type="date" 
//                         value={form.issuedDate} 
//                         readOnly 
//                         className="h-9 cursor-not-allowed bg-gray-50"
//                       />
//                     </div>
//                     <div className="space-y-1">
//                       <label className="text-sm font-medium">Due Date *</label>
//                       <Input
//                         type="date"
//                         value={form.dueDate}
//                         onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
//                         className="h-9"
//                       />
//                     </div>
//                   </div>

//                   {/* Products Section */}
//                   <div className="border rounded p-3 space-y-2">
//                     <label className="text-sm font-medium">Products & Services</label>
//                     {form.products.map((prod, index) => (
//                       <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
//                         <div className="md:col-span-5">
//                           <Input
//                             placeholder="Product Name"
//                             value={prod.name}
//                             onChange={(e) => handleProductChange(index, "name", e.target.value)}
//                             className="h-8 text-sm"
//                           />
//                         </div>
//                         <div className="md:col-span-3">
//                           <Input
//                             type="number"
//                             placeholder="Qty"
//                             value={prod.quantity}
//                             onChange={(e) => handleProductChange(index, "quantity", parseInt(e.target.value))}
//                             className="h-8 text-sm"
//                           />
//                         </div>
//                         <div className="md:col-span-3">
//                           <Input
//                             type="number"
//                             placeholder="Price"
//                             value={prod.price}
//                             onChange={(e) => handleProductChange(index, "price", parseFloat(e.target.value))}
//                             className="h-8 text-sm"
//                           />
//                         </div>
//                         <div className="md:col-span-1">
//                           {form.products.length > 1 && (
//                             <Button
//                               type="button"
//                               variant="outline"
//                               size="sm"
//                               className="h-8 w-8 p-0"
//                               onClick={() => {
//                                 const updatedProducts = form.products.filter((_, i) => i !== index)
//                                 setForm({ ...form, products: updatedProducts })
//                               }}
//                             >
//                               <Trash2 className="w-3 h-3" />
//                             </Button>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                     <Button 
//                       variant="outline" 
//                       className="w-full h-8 text-sm" 
//                       onClick={addProductRow}
//                       style={{ borderColor: themeColors.primary, color: themeColors.primary }}
//                     >
//                       <Plus className="w-3 h-3 mr-1" /> Add Product
//                     </Button>
//                   </div>

//                   {/* Status Dropdown */}
//                   <div className="space-y-1">
//                     <label className="text-sm font-medium">Status</label>
//                     <select
//                       value={form.status}
//                       onChange={(e) => setForm({ ...form, status: e.target.value as PartyStatus })}
//                       className="w-full border rounded p-2 text-sm h-9 focus:ring-1 focus:ring-green-500 focus:border-transparent"
//                       style={{ borderColor: themeColors.primary }}
//                     >
//                       <option value="registered">Registered</option>
//                       <option value="advance paid">Advance Paid</option>
//                       <option value="paid">Paid</option>
//                       <option value="unpaid">Unpaid</option>
//                       <option value="completed">Completed</option>
//                     </select>
//                   </div>

//                   <Button 
//                     className="w-full h-9 font-medium"
//                     style={{ backgroundColor: themeColors.primary }}
//                     onClick={handleSubmit}
//                   >
//                     {form.id ? "Update Party" : "Create Party"}
//                   </Button>
//                 </div>
//               </DialogContent>
//             </Dialog>
//           </div>
//         </CardHeader>

//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr style={{ backgroundColor: themeColors.primaryLight }}>
//                   <th className="p-2 text-left font-semibold">Party Details</th>
//                   <th className="p-2 text-left font-semibold">Contact Info</th>
//                   <th className="p-2 text-left font-semibold">Event Details</th>
//                   <th className="p-2 text-left font-semibold">Status</th>
//                   <th className="p-2 text-left font-semibold">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {parties.map((p) => (
//                   <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
//                     <td className="p-2">
//                       <div>
//                         <p className="font-semibold text-gray-900">{p.partyName}</p>
//                         <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
//                           <User className="w-3 h-3" />
//                           {p.customerName}
//                         </p>
//                       </div>
//                     </td>
//                     <td className="p-2">
//                       <div className="space-y-0.5">
//                         <p className="text-xs flex items-center gap-1">
//                           <Phone className="w-3 h-3" />
//                           {p.phone}
//                         </p>
//                         <p className="text-xs flex items-center gap-1">
//                           <Mail className="w-3 h-3" />
//                           {p.email}
//                         </p>
//                         <p className="text-xs flex items-start gap-1">
//                           <MapPin className="w-3 h-3 mt-0.5" />
//                           <span className="flex-1">{p.address}</span>
//                         </p>
//                       </div>
//                     </td>
//                     <td className="p-2">
//                       <div className="space-y-0.5">
//                         <p className="text-xs">
//                           <span className="font-medium">Guests:</span> {p.guests}
//                         </p>
//                         <p className="text-xs">
//                           <span className="font-medium">Issued:</span> {p.issuedDate}
//                         </p>
//                         <p className="text-xs">
//                           <span className="font-medium">Due:</span> {p.dueDate}
//                         </p>
//                       </div>
//                     </td>
//                     <td className="p-2">
//                       <select
//                         value={p.status}
//                         onChange={(e) => handleStatusChange(p.id, e.target.value as PartyStatus)}
//                         className={`w-full border rounded p-1 text-xs font-medium h-7 ${getStatusColor(p.status)}`}
//                       >
//                         <option value="registered">Registered</option>
//                         <option value="advance paid">Advance Paid</option>
//                         <option value="paid">Paid</option>
//                         <option value="unpaid">Unpaid</option>
//                         <option value="completed">Completed</option>
//                       </select>
//                     </td>
//                     <td className="p-2">
//                       <div className="flex gap-1">
//                         <Button 
//                           size="sm" 
//                           variant="outline"
//                           className="h-7 w-7 p-0"
//                           style={{ borderColor: themeColors.primary, color: themeColors.primary }}
//                           onClick={() => handleEdit(p)}
//                         >
//                           <Edit className="w-3 h-3" />
//                         </Button>
//                         <Button 
//                           size="sm" 
//                           variant="destructive"
//                           className="h-7 w-7 p-0"
//                           onClick={() => handleDelete(p.id)}
//                         >
//                           <Trash2 className="w-3 h-3" />
//                         </Button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//                 {parties.length === 0 && (
//                   <tr>
//                     <td colSpan={5} className="text-center p-4 text-gray-500 text-sm">
//                       <Calendar className="w-8 h-8 mx-auto mb-1 text-gray-300" />
//                       <p>No parties available.</p>
//                       <p className="text-xs">Click "Add Party" to get started.</p>
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }