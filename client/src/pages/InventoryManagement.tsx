// src/components/InventoryManagement.tsx

import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
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

const ITEMS_PER_PAGE = 5;

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
    <div className="flex justify-center gap-1 mt-2">
      <button
        className="px-2 py-1 border rounded disabled:opacity-50"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Prev
      </button>
      {getPageNumbers().map((p) => (
        <button
          key={p}
          className={`px-3 py-1 border rounded ${
            p === currentPage ? "bg-gray-300" : ""
          }`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        className="px-2 py-1 border rounded disabled:opacity-50"
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
  const [usagePage, setUsagePage] = useState(1);

  // Analytics
  const [analyticsPeriod, setAnalyticsPeriod] = useState<
    "daily" | "weekly" | "monthly" | "yearly" | "fiveYear" | "all"
  >("daily");

  // Fetch Inventory & Usage
  const fetchInventory = async () => {
    try {
      const res = await api.get("/inventory");
      setData(res?.data?.data || []);
      setFilteredData(res?.data?.data || []);
    } catch (err) {
      console.error("Error fetching inventory:", err);
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
    fetchInventory();
    fetchUsage();
  }, []);

  // Filters
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

  useEffect(() => {
    let tempData = [...usageData];
    if (searchTerm) {
      tempData = tempData.filter((u) =>
        u.product.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredUsageData(tempData);
    setUsagePage(1);
  }, [usageData, searchTerm]);

  // Handle Save Inventory
  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        qty: Number(formData.qty),
        alertQty: Number(formData.alertQty),
        total: Number(formData.price) * Number(formData.qty),
      };

      if (editingItem) {
        const res = await api.put(`/inventory/${editingItem.id}`, payload);
        if (res.data.success) {
          fetchInventory();
        } else {
          alert(res.data.message || "Failed to update item");
        }
      } else {
        const res = await api.post("/inventory", payload);
        if (res.data.success) {
          fetchInventory();
        } else {
          alert(res.data.message || "Failed to add item");
        }
      }
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
    } catch (err: any) {
      alert(err.response?.data?.message || "Error saving item");
    }
  };

  // Handle Save Usage
  const handleUsageSave = async () => {
    const inventoryItem = data.find((i) => i.id === usageForm.inventoryId);
    if (!inventoryItem) {
      alert("Please select a valid product");
      return;
    }
    if (usageForm.usedQty <= 0) {
      alert("Please enter a valid quantity");
      return;
    }
    if (Number(inventoryItem.qty) < usageForm.usedQty) {
      alert("Not enough stock available");
      return;
    }

    try {
      await api.post("/usage", {
        inventoryId: usageForm.inventoryId,
        usedQty: usageForm.usedQty,
        date: new Date().toISOString(),
        product: inventoryItem.product,
      });

      await api.put(`/inventory/${usageForm.inventoryId}`, {
        ...inventoryItem,
        qty: Number(inventoryItem.qty) - usageForm.usedQty,
      });

      await fetchInventory();
      await fetchUsage();

      setIsUsageModalOpen(false);
      setUsageForm({ inventoryId: 0, usedQty: 0 });
    } catch (err) {
      console.error("Error saving usage:", err);
      alert("Error recording usage");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      await api.delete(`/inventory/${id}`);
      fetchInventory();
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Error deleting item");
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
          const week = Math.ceil(
            ((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) /
              86400000 +
              new Date(date.getFullYear(), 0, 1).getDay() +
              1) /
              7
          );
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

  // UI
  return (
    <div className="space-y-6 p-4">
      {/* Inventory Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
          <h1 className="text-base sm:text-lg font-semibold uppercase">
            Inventory Management
          </h1>
          <div className="flex gap-2 flex-wrap text-sm">
            <Input
              type="text"
              placeholder="Search by product or S.No"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="In Stock">In Stock</SelectItem>
                <SelectItem value="Low Stock">Low Stock</SelectItem>
                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                <SelectItem value="Pending Price">Pending Price</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddNew}>+ New Item</Button>
            <Button
              onClick={() => {
                setUsageForm({ inventoryId: 0, usedQty: 0 });
                setIsUsageModalOpen(true);
              }}
            >
              + Usage
            </Button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-left">
            <thead className="border-b uppercase text-sm">
              <tr>
                <th className="p-2">S.No</th>
                <th className="p-2">Product</th>
                <th className="p-2">Pack Size</th>
                <th className="p-2">Price</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Total</th>
                <th className="p-2">Status</th>
                <th className="p-2">Alert Qty</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInventory.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-b hover:bg-gray-50 text-sm ${
                    Number(item.qty) <= Number(item.alertQty) ? "bg-red-50" : ""
                  }`}
                >
                  <td className="p-2">
                    {(inventoryPage - 1) * ITEMS_PER_PAGE + idx + 1}
                  </td>
                  <td className="p-2">{item.product}</td>
                  <td className="p-2">{item.packSize}</td>
                  <td className="p-2">€{item.price}</td>
                  <td className="p-2">{item.qty}</td>
                  <td className="p-2">€{item.total}</td>
                  <td className="p-2">{item.status}</td>
                  <td className="p-2">{item.alertQty}</td>
                  <td className="p-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            totalItems={filteredData.length}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={inventoryPage}
            onPageChange={setInventoryPage}
          />
        </div>
      </div>

      {/* Usage Section */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-semibold uppercase">Daily Usage</h2>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-left">
            <thead className="border-b uppercase text-sm">
              <tr>
                <th className="p-2">S.No</th>
                <th className="p-2">Product</th>
                <th className="p-2">Used Qty</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsage.map((u, idx) => (
                <tr key={u.id} className="border-b hover:bg-gray-50 text-sm">
                  <td className="p-2">{(usagePage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                  <td className="p-2">{u.product}</td>
                  <td className="p-2">{u.usedQty}</td>
                  <td className="p-2">{new Date(u.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            totalItems={filteredUsageData.length}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={usagePage}
            onPageChange={setUsagePage}
          />
        </div>
      </div>

      {/* Analytics Section */}
      <div className="space-y-4 mt-6">
        <h2 className="text-base sm:text-lg font-semibold uppercase">Usage Analytics</h2>
        <div className="flex gap-2 mb-2 flex-wrap">
          <Select value={analyticsPeriod} onValueChange={(value: any) => setAnalyticsPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="fiveYear">Five-Year</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-100 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-gray-700">Summary</h3>
            <p>Total Usage: {usageAnalytics.totalUsage}</p>
            <p>Average Usage: {usageAnalytics.avgUsage.toFixed(2)}</p>
            <p>Most Used Product: {usageAnalytics.mostUsedProduct}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Usage Over Time</h3>
            {usageAnalytics.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={usageAnalytics.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="qty" name="Used Qty" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p>No usage data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Item" : "Add New Item"}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the inventory item details." : "Add a new item to your inventory."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="product" className="text-right">
                Product
              </Label>
              <Input
                id="product"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="packSize" className="text-right">
                Pack Size
              </Label>
              <Input
                id="packSize"
                value={formData.packSize}
                onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="qty" className="text-right">
                Quantity
              </Label>
              <Input
                id="qty"
                type="number"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alertQty" className="text-right">
                Alert Qty
              </Label>
              <Input
                id="alertQty"
                type="number"
                value={formData.alertQty}
                onChange={(e) => setFormData({ ...formData, alertQty: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="col-span-3">
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
            <Button onClick={handleSave}>
              {editingItem ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usage Modal */}
      <Dialog open={isUsageModalOpen} onOpenChange={setIsUsageModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Usage</DialogTitle>
            <DialogDescription>
              Record product usage from your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="inventoryId" className="text-right">
                Product
              </Label>
              <Select 
                value={usageForm.inventoryId.toString()} 
                onValueChange={(value) => setUsageForm({ ...usageForm, inventoryId: Number(value) })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {data.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.product} (Stock: {item.qty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="usedQty" className="text-right">
                Used Qty
              </Label>
              <Input
                id="usedQty"
                type="number"
                min="1"
                value={usageForm.usedQty}
                onChange={(e) => setUsageForm({ ...usageForm, usedQty: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseUsageModal}>
              Cancel
            </Button>
            <Button onClick={handleUsageSave}>
              Save Usage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;