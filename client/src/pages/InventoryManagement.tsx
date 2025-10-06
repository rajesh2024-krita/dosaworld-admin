// src/components/InventoryManagement.tsx

import { Button } from "@/components/ui/button";
import { Edit, Trash2, Search, Filter, X } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

const MySwal = withReactContent(Swal)

// Loader Component
const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 border-solid"></div>
    </div>
  );
};

// Types
interface InventoryItem {
  id: number;
  product: string;
  packSize: string;
  price: number | string;
  qty: number | string;
  total: number | string;
  status: string;
  alertQty: number | string;
}

interface UsageItem {
  id: number;
  inventoryId: number;
  product: string;
  usedQty: number | string;
  date: string;
}

interface Toast {
  id: number;
  item: InventoryItem;
  type: 'lowStock';
}

const ITEMS_PER_PAGE = 5;

// Toast Component
interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: number) => void;
  onEdit: (item: InventoryItem) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose, onEdit }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white border border-red-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-right duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-semibold text-sm text-red-800">Low Stock Alert</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">{toast.item.product}</span> is running low. 
                Current stock: <span className="font-semibold text-red-600">{toast.item.qty}</span> 
                (Alert at: {toast.item.alertQty})
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onEdit(toast.item)}
                  className="bg-[#15803d] hover:bg-[#15803d] text-white h-7 text-xs"
                >
                  Add Stock
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onClose(toast.id)}
                  className="h-7 text-xs"
                >
                  Dismiss
                </Button>
              </div>
            </div>
            <button
              onClick={() => onClose(toast.id)}
              className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Pagination Component
interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages === 0) return null;

  const getPageNumbers = () => {
    const delta = 2;
    let pages: number[] = [];
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex justify-center gap-1 mt-4">
      <button
        className="px-3 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>
      {getPageNumbers().map((p) => (
        <button
          key={p}
          className={`px-4 py-2 border rounded-lg transition-colors ${
            p === currentPage 
              ? "bg-[#15803d] text-white border-[#15803d]" 
              : "hover:bg-gray-50"
          }`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        className="px-3 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
};

// Main Component
const InventoryManagement: React.FC = () => {
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inventory & Usage
  const [data, setData] = useState<InventoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<InventoryItem[]>([]);
  const [usageData, setUsageData] = useState<UsageItem[]>([]);
  const [filteredUsageData, setFilteredUsageData] = useState<UsageItem[]>([]);

  // Modals & Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<InventoryItem>({
    id: 0,
    product: "",
    packSize: "",
    price: "",
    qty: "",
    total: "",
    status: "In Stock",
    alertQty: 0,
  });

  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [usageForm, setUsageForm] = useState<{ inventoryId: number; usedQty: number }>({
    inventoryId: 0,
    usedQty: 0,
  });

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [inventoryPage, setInventoryPage] = useState(1);
  
  // Usage Filters & Pagination
  const [usageSearchTerm, setUsageSearchTerm] = useState("");
  const [usageDateFilter, setUsageDateFilter] = useState("all");
  const [usagePage, setUsagePage] = useState(1);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>();

  // Analytics
  const [analyticsPeriod, setAnalyticsPeriod] = useState<
    "daily" | "weekly" | "monthly" | "yearly" | "fiveYear" | "all"
  >("daily");

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);
  const [notifiedItems, setNotifiedItems] = useState<Set<number>>(new Set());

  // Fetch Inventory & Usage
  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/inventory");
      setData(res?.data?.data || []);
      setFilteredData(res?.data?.data || []);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const res = await api.get("/usage");
      setUsageData(res?.data?.data || []);
      setFilteredUsageData(res?.data?.data || []);
    } catch (err) {
      console.error("Error fetching usage:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchInventory(), fetchUsage()]);
    };
    loadData();
  }, []);

  // Check for low stock items and show toasts
  useEffect(() => {
    const lowStockItems = data.filter(
      item => Number(item.qty) <= Number(item.alertQty) && item.status !== "Out of Stock"
    );

    const newNotifiedItems = new Set(notifiedItems);
    const newToasts: Toast[] = [];

    lowStockItems.forEach(item => {
      if (!notifiedItems.has(item.id)) {
        newNotifiedItems.add(item.id);
        newToasts.push({
          id: toastIdCounter + newToasts.length + 1,
          item,
          type: 'lowStock'
        });
      }
    });

    if (newToasts.length > 0) {
      setToastIdCounter(prev => prev + newToasts.length);
      setToasts(prev => [...prev, ...newToasts]);
      setNotifiedItems(newNotifiedItems);
    }

    // Clean up toasts for items that are no longer low stock
    setToasts(prev => prev.filter(toast => 
      lowStockItems.some(item => item.id === toast.item.id)
    ));
  }, [data]);

  // Inventory Filters
  useEffect(() => {
    let tempData = [...data];
    if (searchTerm) {
      tempData = tempData.filter(
        (item, idx) =>
          item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (idx + 1).toString() === searchTerm
      );
    }
    if (statusFilter !== "All") {
      if (statusFilter === "Low Stock") {
        tempData = tempData.filter(
          (item) => Number(item.qty) <= Number(item.alertQty)
        );
      } else {
        tempData = tempData.filter((item) => item.status === statusFilter);
      }
    }
    tempData.sort((a, b) => {
      const aLow = Number(a.qty) <= Number(a.alertQty) ? 0 : 1;
      const bLow = Number(b.qty) <= Number(b.alertQty) ? 0 : 1;
      return aLow - bLow;
    });
    setFilteredData(tempData);
    setInventoryPage(1);
  }, [searchTerm, statusFilter, data]);

  // Usage Filters
  useEffect(() => {
    let tempData = [...usageData];
    
    // Search filter
    if (usageSearchTerm) {
      tempData = tempData.filter((u) =>
        u.product.toLowerCase().includes(usageSearchTerm.toLowerCase())
      );
    }
    
    // Date filter
    if (usageDateFilter !== "all") {
      const now = new Date();
      tempData = tempData.filter((u) => {
        const usageDate = new Date(u.date);
        switch (usageDateFilter) {
          case "today":
            return usageDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return usageDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            return usageDate >= monthAgo;
          case "year":
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            return usageDate >= yearAgo;
          default:
            return true;
        }
      });
    }
    
    // Sort by date (newest first)
    tempData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredUsageData(tempData);
    setUsagePage(1);
  }, [usageData, usageSearchTerm, usageDateFilter]);

  // Toast handlers
  const handleCloseToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleEditFromToast = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
    // Remove the toast for this item since we're editing it
    setToasts(prev => prev.filter(toast => toast.item.id !== item.id));
  };

  // Handle Save (Create or Update)
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        price: Number(formData.price),
        qty: Number(formData.qty),
        alertQty: Number(formData.alertQty),
        total: Number(formData.price) * Number(formData.qty),
      };

      const res = editingItem
        ? await api.put(`/inventory/${editingItem.id}`, payload)
        : await api.post("/inventory", payload);

      if (res.data.success) {
        handleCloseModal();
        await fetchInventory();
        // alert(res.data.message || "Item saved successfully");
        MySwal.fire({
          icon: "success", // ✅ change to success
          title: "Success!",
          text: res.data.message || "Item saved successfully",
          confirmButtonColor: "#15803d" // optional: custom green color
        })

      } else {
        // alert(res.data.message || "Failed to save item");
        MySwal.fire({
          icon: "error",
          title: "Oops...",
          text: res.data.message || "Failed to save item",
        })
      }
    } catch (err: any) {
      // console.error("Error saving item:", err);
      // alert(err.response?.data?.message || "Error saving item");
      MySwal.fire({
          icon: "error",
          title: "Oops...",
          text: err.response?.data?.message || "Error saving item",
        })
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save Usage
  const handleUsageSave = async () => {
    if (!usageForm.inventoryId) 
      return MySwal.fire({
          icon: "error",
          title: "Oops...",
          text: "Please a select valid product",
        })
    // alert("Please select a valid product");
    if (usageForm.usedQty <= 0) 
      return MySwal.fire({
          icon: "error",
          title: "Oops...",
          text: "Please enter a valid quantity ",
        })
    // alert("Please enter a valid quantity");

    try {
      setIsSaving(true);
      const res = await api.post("/usage", {
        inventoryId: usageForm.inventoryId,
        usedQty: usageForm.usedQty,
        date: new Date().toISOString(),
        product: selectedItem?.product || ""
      });

      if (res.data.success) {
        await fetchInventory();
        await fetchUsage();
        handleCloseUsageModal();
        // alert(res.data.message || "Usage recorded successfully");
        MySwal.fire({
          icon: "success", // ✅ change to success
          title: "Success!",
          text: res.data.message || "Usage recorded successfully",
          confirmButtonColor: "#15803d" // optional: custom green color
        })
      } else {
        // alert(res.data.message || "Failed to record usage");
        MySwal.fire({
          icon: "error",
          title: "Oops...",
          text: res.data.message || "Failed to record usage",
        })
      }
    } catch (err: any) {
      console.error("Error recording usage:", err);
      // alert(err.response?.data?.message || "Error recording usage");
      MySwal.fire({
          icon: "error",
          title: "Oops...",
          text: err.response?.data?.message || "Error recording usage",
        })
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      setIsDeleting(true);
      const res = await api.delete(`/inventory/${id}`);
      if (res.data.success) {
        await fetchInventory();
        // alert(res.data.message || "Item deleted successfully");
        MySwal.fire({
          icon: "error",
          title: "Oops...",
          text: res.data.message || "Item deleted successfully",
        })

      } else {
        // alert(res.data.message || "Failed to delete item");
        MySwal.fire({
          icon: "error",
          title: "Oops...",
          text: res.data.message || "Failed to delete item",
        })
      }
    } catch (err) {
      console.error("Error deleting item:", err);
      // alert("Error deleting item");
      MySwal.fire({
          icon: "error",
          title: "Oops...",
          text: "Error deleting item",
        })
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      id: 0,
      product: "",
      packSize: "",
      price: "",
      qty: "",
      total: "",
      status: "In Stock",
      alertQty: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      id: 0,
      product: "",
      packSize: "",
      price: "",
      qty: "",
      total: "",
      status: "In Stock",
      alertQty: 0,
    });
  };

  const handleCloseUsageModal = () => {
    setIsUsageModalOpen(false);
    setUsageForm({ inventoryId: 0, usedQty: 0 });
  };

  // Pagination
  const paginatedInventory = filteredData.slice(
    (inventoryPage - 1) * ITEMS_PER_PAGE,
    inventoryPage * ITEMS_PER_PAGE
  );
  const paginatedUsage = filteredUsageData.slice(
    (usagePage - 1) * ITEMS_PER_PAGE,
    usagePage * ITEMS_PER_PAGE
  );

  // Aggregated Analytics
  const getAggregatedUsage = (usageData: UsageItem[], period: string) => {
    const chartMap: Record<string, number> = {};
    usageData.forEach((u) => {
      const date = new Date(u.date);
      let key = "";
      switch (period) {
        case "daily":
          key = date.toLocaleDateString();
          break;
        case "weekly":
          // Sunday-based week
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDays = Math.floor((date.getTime() - firstDayOfYear.getTime()) / 86400000);
          const week = Math.floor((pastDays + firstDayOfYear.getDay()) / 7) + 1;
          key = `${date.getFullYear()}-W${week}`;
          break;
        case "monthly":
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        case "yearly":
          key = `${date.getFullYear()}`;
          break;
        case "fiveYear":
          const fyStart = date.getFullYear() - (date.getFullYear() % 5);
          key = `${fyStart}-${fyStart + 4}`;
          break;
        case "all":
          key = "All Time";
          break;
      }
      if (!chartMap[key]) chartMap[key] = 0;
      chartMap[key] += Number(u.usedQty);
    });
    return Object.entries(chartMap)
      .map(([date, qty]) => ({ date, qty }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const usageAnalytics = useMemo(() => {
    const totalUsage = usageData.reduce((sum, u) => sum + Number(u.usedQty), 0);
    const avgUsage = usageData.length > 0 ? totalUsage / usageData.length : 0;

    const productMap: Record<string, number> = {};
    usageData.forEach((u) => {
      const qty = Number(u.usedQty);
      if (!productMap[u.product]) productMap[u.product] = 0;
      productMap[u.product] += qty;
    });
    const mostUsedProduct =
      Object.keys(productMap).reduce(
        (a, b) => (productMap[a] > productMap[b] ? a : b),
        ""
      ) || "N/A";

    const chartData = getAggregatedUsage(usageData, analyticsPeriod);

    return { totalUsage, avgUsage, mostUsedProduct, chartData };
  }, [usageData, analyticsPeriod]);

  // Get status badge color
  const getStatusBadge = (status: string, qty: number, alertQty: number) => {
    if (qty <= alertQty) {
      return <Badge variant="destructive">Low Stock</Badge>;
    }
    switch (status) {
      case "In Stock":
        return <Badge variant="default">In Stock</Badge>;
      case "Out of Stock":
        return <Badge variant="secondary">Out of Stock</Badge>;
      case "Pending Price":
        return <Badge variant="outline">Pending Price</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Show loader while initial data is loading
  if (isLoading) {
    return <Loader />;
  }

  // UI
  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Toast Notifications */}
      <ToastContainer 
        toasts={toasts} 
        onClose={handleCloseToast}
        onEdit={handleEditFromToast}
      />

      {/* Inventory Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl font-bold">Inventory Management</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48 pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="In Stock">In Stock</SelectItem>
                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddNew} className="bg-[#15803d] hover:bg-[#15803d]">
                + New Item
              </Button>
              <Button
                onClick={() => {
                  setUsageForm({ inventoryId: 0, usedQty: 0 });
                  setIsUsageModalOpen(true);
                }}
                variant="outline"
              >
                + Record Usage
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Inventory Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-left">
              <thead className="border-b bg-gray-50 uppercase text-sm">
                <tr>
                  <th className="p-3 font-semibold">S.No</th>
                  <th className="p-3 font-semibold">Product</th>
                  <th className="p-3 font-semibold">Pack Size</th>
                  <th className="p-3 font-semibold">Price</th>
                  <th className="p-3 font-semibold">Qty</th>
                  <th className="p-3 font-semibold">Total</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Alert Qty</th>
                  <th className="p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInventory.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b hover:bg-gray-50 text-sm transition-colors ${
                      Number(item.qty) <= Number(item.alertQty) ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="p-3 font-medium">
                      {(inventoryPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </td>
                    <td className="p-3 font-medium">{item.product}</td>
                    <td className="p-3 text-gray-600">{item.packSize}</td>
                    <td className="p-3">€{item.price}</td>
                    <td className="p-3">
                      <span className={`font-semibold ${
                        Number(item.qty) <= Number(item.alertQty) ? "text-red-600" : "text-[#15803d]"
                      }`}>
                        {item.qty}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">€{item.total}</td>
                    <td className="p-3">
                      {getStatusBadge(item.status, Number(item.qty), Number(item.alertQty))}
                    </td>
                    <td className="p-3 text-orange-600 font-medium">{item.alertQty}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {isDeleting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-red-600 border-solid"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginatedInventory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No inventory items found
              </div>
            )}
            <Pagination
              totalItems={filteredData.length}
              itemsPerPage={ITEMS_PER_PAGE}
              currentPage={inventoryPage}
              onPageChange={setInventoryPage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Usage Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl font-bold">Daily Usage</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search usage..."
                  value={usageSearchTerm}
                  onChange={(e) => setUsageSearchTerm(e.target.value)}
                  className="w-48 pl-10"
                />
              </div>
              <Select value={usageDateFilter} onValueChange={setUsageDateFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-left">
              <thead className="border-b bg-gray-50 uppercase text-sm">
                <tr>
                  <th className="p-3 font-semibold">S.No</th>
                  <th className="p-3 font-semibold">Product</th>
                  <th className="p-3 font-semibold">Used Qty</th>
                  <th className="p-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsage.map((u, idx) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50 text-sm transition-colors">
                    <td className="p-3 font-medium">
                      {(usagePage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </td>
                    <td className="p-3 font-medium">{u.product}</td>
                    <td className="p-3">
                      <Badge variant="secondary" className="bg-[#15803d] text-white">
                        {u.usedQty}
                      </Badge>
                    </td>
                    <td className="p-3 text-gray-600">
                      {new Date(u.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginatedUsage.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No usage records found
              </div>
            )}
            <Pagination
              totalItems={filteredUsageData.length}
              itemsPerPage={ITEMS_PER_PAGE}
              currentPage={usagePage}
              onPageChange={setUsagePage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Analytics Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl font-bold">Usage Analytics</CardTitle>
            <Select value={analyticsPeriod} onValueChange={(value: any) => setAnalyticsPeriod(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="fiveYear">Five-Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary Cards */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#15803d]">
                    {usageAnalytics.totalUsage}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Total units consumed</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Average Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#15803d]">
                    {usageAnalytics.avgUsage.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Average per record</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Most Used Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-[#15803d] truncate">
                    {usageAnalytics.mostUsedProduct}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Highest consumption</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Chart */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Usage Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {usageAnalytics.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={usageAnalytics.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="qty" name="Used Quantity" fill="#15803d" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No usage data available for the selected period
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the inventory item details below." : "Add a new item to your inventory below."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product" className="text-sm font-medium">
                Product Name
              </Label>
              <Input
                id="product"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                placeholder="Enter product name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="packSize" className="text-sm font-medium">
                Pack Size
              </Label>
              <Input
                id="packSize"
                value={formData.packSize}
                onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                placeholder="Enter pack size"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium">
                  Price (€)
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qty" className="text-sm font-medium">
                  Quantity
                </Label>
                <Input
                  id="qty"
                  type="number"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alertQty" className="text-sm font-medium">
                Alert Quantity
              </Label>
              <Input
                id="alertQty"
                type="number"
                value={formData.alertQty}
                onChange={(e) => setFormData({ ...formData, alertQty: e.target.value })}
                placeholder="Set low stock alert level"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Stock">In Stock</SelectItem>
                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                  <SelectItem value="Pending Price">Pending Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-[#15803d] hover:bg-[#15803d]"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white border-solid mr-2"></div>
                  {editingItem ? "Updating..." : "Adding..."}
                </>
              ) : (
                editingItem ? "Update Item" : "Add Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usage Modal */}
      <Dialog open={isUsageModalOpen} onOpenChange={setIsUsageModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Record Product Usage</DialogTitle>
            <DialogDescription>
              Record product usage from your inventory. This will deduct from the available quantity.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inventoryId" className="text-sm font-medium">
                Product
              </Label>
              <Select
                value={usageForm.inventoryId.toString()}
                onValueChange={(value) => {
                  const selected = data.find(item => item.id === Number(value));
                  if (selected) setSelectedItem(selected);
                  setUsageForm({ ...usageForm, inventoryId: Number(value) });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {data
                    .filter(item => Number(item.qty) > 0)
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.product}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select> 
            </div>
            <div className="space-y-2">
              <Label htmlFor="usedQty" className="text-sm font-medium">
                Quantity Used
              </Label>
              <Input
                id="usedQty"
                type="number"
                min="1"
                value={usageForm.usedQty}
                onChange={(e) => setUsageForm({ ...usageForm, usedQty: Number(e.target.value) })}
                placeholder="Enter quantity used"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseUsageModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleUsageSave} 
              disabled={isSaving}
              className="bg-[#15803d] hover:bg-[#15803d]"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white border-solid mr-2"></div>
                  Recording...
                </>
              ) : (
                "Record Usage"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;