"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/axios"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
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
import { Edit, Trash2, Plus, Calendar, User, Phone, Mail, MapPin, Users, Bell, Loader2, Eye, Download } from "lucide-react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

const MySwal = withReactContent(Swal)

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

// PDF Generation function

const generateInvoicePDF = async (party: Party) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;

  // Header
  page.drawText(`Invoice: ${String(party.id).padStart(4, '0')}`, {
    x: 50, y, font: fontBold, size: 16
  });
  y -= 20;
  page.drawText(`Issued on: ${party.issuedDate}    Due by: ${party.dueDate}`, {
    x: 50, y, font, size: 10, color: rgb(0.2, 0.2, 0.2)
  });

  y -= 40;
  page.drawText("From:", { x: 50, y, font: fontBold, size: 12 });
  y -= 15;
  page.drawText("Dosa World Indisch Restaurant UG", { x: 50, y, font, size: 10 });
  y -= 12;
  page.drawText("Lammertwiete 2 21073 Hamburg, Germany", { x: 50, y, font, size: 10 });
  y -= 12;
  page.drawText("info@dosaworld.de | +49 403 2527895 | dosaworld.de", { x: 50, y, font, size: 10 });

  y -= 30;
  page.drawText("To:", { x: 50, y, font: fontBold, size: 12 });
  y -= 15;
  page.drawText(`${party.customerName}`, { x: 50, y, font, size: 10 });
  y -= 12;
  page.drawText(`${party.address}`, { x: 50, y, font, size: 10 });
  y -= 12;
  page.drawText(`${party.email} | ${party.phone}`, { x: 50, y, font, size: 10 });

  y -= 30;
  // Table headers
  page.drawText("Product", { x: 50, y, font: fontBold, size: 10 });
  page.drawText("Qty", { x: 300, y, font: fontBold, size: 10 });
  page.drawText("Unit Price", { x: 350, y, font: fontBold, size: 10 });
  page.drawText("Total", { x: 450, y, font: fontBold, size: 10 });
  y -= 15;

  // Products
  let subtotal = 0;
  party.products.forEach(product => {
    const total = product.quantity * product.price;
    subtotal += total;
    page.drawText(product.name, { x: 50, y, font, size: 10 });
    page.drawText(product.quantity.toString(), { x: 300, y, font, size: 10 });
    page.drawText(`€ ${product.price.toFixed(2)}`, { x: 350, y, font, size: 10 });
    page.drawText(`€ ${total.toFixed(2)}`, { x: 450, y, font, size: 10 });
    y -= 12;
  });

  // Invoice summary
  const tax = subtotal * 0.07;
  const total = subtotal + tax;
  y -= 20;
  page.drawText(`Subtotal: € ${subtotal.toFixed(2)}`, { x: 350, y, font: fontBold, size: 10 });
  y -= 12;
  page.drawText(`Tax (7%): € ${tax.toFixed(2)}`, { x: 350, y, font: fontBold, size: 10 });
  y -= 12;
  page.drawText(`Total: € ${total.toFixed(2)}`, { x: 350, y, font: fontBold, size: 12 });

  y -= 30;
  page.drawText("Terms: 7% VAT Tax is inclusive.", { x: 50, y, font, size: 10 });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};


// Function to download PDF
const downloadInvoicePDF = async (party: Party) => {
  const blob = await generateInvoicePDF(party);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Invoice-${String(party.id).padStart(4,'0')}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

// Function to view PDF in new tab
const viewInvoicePDF = async (party: Party) => {
  const blob = await generateInvoicePDF(party);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
};

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

  // ✅ API functions (using axios)
  const fetchParties = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<ApiResponse<Party[]>>("/parties")
      if (data.success && data.data) {
        // Fix dates to "YYYY-MM-DD" format
        const formatted = data.data.map((p) => ({
          ...p,
          issuedDate: p.issuedDate ? p.issuedDate.split("T")[0] : "",
          dueDate: p.dueDate ? p.dueDate.split("T")[0] : ""
        }))
        setParties(formatted)
      } else {
        throw new Error(data.message || "Failed to fetch parties")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch parties")
      console.error("Error fetching parties:", err)
    } finally {
      setLoading(false)
    }
  }

  const createParty = async (partyData: Omit<Party, "id">) => {
    return await api.post<ApiResponse<Party>>("/parties", partyData)
  }

  const updateParty = async (id: number, partyData: Partial<Party>) => {
    return await api.put<ApiResponse<Party>>(`/parties/${id}`, partyData)
  }

  const updatePartyStatus = async (id: number, status: PartyStatus) => {
    return await api.patch<ApiResponse<Party>>(`/parties/${id}/status`, { status })
  }

  const deleteParty = async (id: number) => {
    return await api.delete<ApiResponse<null>>(`/parties/${id}`)
  }

  const fetchOverdueParties = async () => {
    return await api.get<ApiResponse<Party[]>>("/overdue-parties")
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
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: "This party will be permanently deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: themeColors.primary,
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      try {
        const res = await deleteParty(id)
        if (res.data.success) {
          setParties((prev) => prev.filter((p) => p.id !== id))
          MySwal.fire('Deleted!', 'The party has been deleted.', 'success')
        } else {
          throw new Error(res.data.message || 'Failed to delete party')
        }
      } catch (err) {
        MySwal.fire('Error', err instanceof Error ? err.message : 'Failed to delete party', 'error')
        console.error('Error deleting party:', err)
      }
    }
  }

  const handleStatusChange = async (id: number, status: PartyStatus) => {
    try {
      const response = await updatePartyStatus(id, status)
      const result = response.data

      console.log("Status update API response:", result)

      if (result.success && result.data) {
        setParties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: result.data.status } : p))
        )
        if (status === "paid" || status === "advance paid" || status === "completed") {
          setSelectedNotification(null)
        }
        setError(null)
      } else {
        throw new Error(result.message || "Failed to update status")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status'
      setError(msg)
      MySwal.fire('Error', msg, 'error')
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
      alert("Please fill all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { id, ...partyData } = form;

      if (id) {
        const result = await updateParty(id, partyData);
        if (result.data.success && result.data.data) {
          setParties((prev) => prev.map((p) => (p.id === id ? result.data.data : p)));
          MySwal.fire('Updated!', 'Party details have been updated.', 'success');
        } else {
          throw new Error(result.data.message || 'Failed to update party');
        }
      } else {
        const result = await createParty(partyData);
        if (result.data.success && result.data.data) {
          setParties((prev) => [...prev, result.data.data]);
          MySwal.fire('Created!', 'New party has been created.', 'success');
        } else {
          throw new Error(result.data.message || 'Failed to create party');
        }
      }

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
      });
      setOpen(false);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save party';
      setError(msg);
      MySwal.fire('Error', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

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
                    {/* ... (existing form fields remain the same) ... */}
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
                    <div className="border rounded p-3 space-y-3">
                      <label className="text-sm font-medium">Products & Services</label>
                      {form.products.map((prod, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                          <div className="md:col-span-5 space-y-1">
                            <label className="text-xs font-medium">Product Name</label>
                            <Input
                              placeholder="Product Name"
                              value={prod.name}
                              onChange={(e) => handleProductChange(index, "name", e.target.value)}
                              className="h-8 text-sm"
                              disabled={loading}
                            />
                          </div>
                          <div className="md:col-span-3 space-y-1">
                            <label className="text-xs font-medium">Quantity</label>
                            <Input
                              type="number"
                              placeholder="Qty"
                              value={prod.quantity}
                              onChange={(e) => handleProductChange(index, "quantity", parseInt(e.target.value) || 0)}
                              className="h-8 text-sm"
                              disabled={loading}
                            />
                          </div>
                          <div className="md:col-span-3 space-y-1">
                            <label className="text-xs font-medium">Price</label>
                            <Input
                              type="number"
                              placeholder="Price"
                              value={prod.price}
                              onChange={(e) => handleProductChange(index, "price", parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                              disabled={loading}
                            />
                          </div>
                          <div className="md:col-span-1 flex justify-end">
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
                        {/* View Button */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 w-7 p-0"
                          style={{ borderColor: themeColors.primary, color: themeColors.primary }}
                          onClick={() => viewInvoicePDF(p)}
                          disabled={loading}
                          title="View Invoice"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        {/* Download Button */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 w-7 p-0"
                          style={{ borderColor: "#3b82f6", color: "#3b82f6" }}
                          onClick={() => downloadInvoicePDF(p)}
                          disabled={loading}
                          title="Download Invoice"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        {/* Edit Button */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 w-7 p-0"
                          style={{ borderColor: themeColors.primary, color: themeColors.primary }}
                          onClick={() => handleEdit(p)}
                          disabled={loading}
                          title="Edit Party"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        {/* Delete Button */}
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="h-7 w-7 p-0"
                          onClick={() => handleDelete(p.id)}
                          disabled={loading}
                          title="Delete Party"
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