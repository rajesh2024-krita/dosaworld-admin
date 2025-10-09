"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
dayjs.extend(isoWeek);

const CHART_COLOR = "#15803d"; // Unified green color for all graphs

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

interface Toast {
  id: number;
  item: InventoryItem;
  type: 'lowStock';
}

// Toast Component
interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: number) => void;
  onAddStock: (item: InventoryItem) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose, onAddStock }) => {
  if (toasts.length === 0) return null;

  // Function to clear all toasts
  const handleClearAll = () => {
    toasts.forEach(toast => onClose(toast.id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {/* Header with Clear All Button */}
      <div className="flex justify-between items-center mb-2 bg-white/80 backdrop-blur-sm p-2 rounded-md border border-gray-200 shadow-sm">
        <span className="font-semibold text-sm text-gray-800">Notifications</span>
        <button
          onClick={handleClearAll}
          className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Toast list */}
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
                  onClick={() => onAddStock(toast.item)}
                  className="bg-[#15803d] hover:bg-[#15803d] text-white h-7 text-xs"
                >
                  View Inventory
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


export default function Dashboard() {
  const [billingData, setBillingData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [reservationData, setReservationData] = useState<any[]>([]);
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);

  // Toast states
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);
  const [notifiedItems, setNotifiedItems] = useState<Set<number>>(new Set());
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  const periodOptions = [
    { value: "today", label: "Daily" },
    { value: "week", label: "Weekly" },
    { value: "month", label: "Monthly" },
    { value: "last3months", label: "Last 3 Months" },
    { value: "last6months", label: "Last 6 Months" },
    { value: "year", label: "Yearly" },
    { value: "5year", label: "5 Year" },
    { value: "all", label: "All Time" },
  ];

  // Fetch all data including inventory for low stock alerts
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [billingRes, inventoryRes, reservationRes, inventoryItemsRes] = await Promise.all([
          api.get("/billings"),
          api.get("/usage"),
          api.get("/reservations"),
          api.get("/inventory") // Fetch inventory items for low stock alerts
        ]);

        setBillingData(billingRes.data?.data || []);
        setInventoryData(inventoryRes.data?.data || []);
        setReservationData(reservationRes.data || []);
        setInventoryItems(inventoryItemsRes.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Check for low stock items and show toasts
  useEffect(() => {
    const lowStockItems = inventoryItems.filter(
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
  }, [inventoryItems]);

  // Toast handlers
  const handleCloseToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleAddStock = (item: InventoryItem) => {
    window.location.href = `/inventory-management?editItem=${item.id}`;
    setToasts(prev => prev.filter(toast => toast.item.id !== item.id));
  };

  // Group by period
  const groupByPeriod = (arr: any[], period: string, type: "billing" | "inventory" | "reservation") => {
    const grouped: Record<string, any> = {};
    const now = dayjs();

    arr.forEach(row => {
      const rowDate = dayjs(row.date);
      let key = "";

      switch (period) {
        case "today":
          if (!rowDate.isSame(now, "day")) return;
          key = rowDate.format("YYYY-MM-DD");
          break;
        case "week":
          if (!rowDate.isSame(now, "week")) return;
          key = `Week ${rowDate.isoWeek()}-${rowDate.year()}`;
          break;
        case "month":
          if (!rowDate.isSame(now, "month")) return;
          key = rowDate.format("YYYY-MM");
          break;
        case "last3months":
          if (!rowDate.isAfter(now.subtract(3, "month"))) return;
          key = rowDate.format("YYYY-MM");
          break;
        case "last6months":
          if (!rowDate.isAfter(now.subtract(6, "month"))) return;
          key = rowDate.format("YYYY-MM");
          break;
        case "year":
          if (!rowDate.isSame(now, "year")) return;
          key = rowDate.format("YYYY");
          break;
        case "5year":
          const startYear = Math.floor(rowDate.year() / 5) * 5;
          const endYear = startYear + 4;
          key = `${startYear}-${endYear}`;
          break;
        case "all":
          key = "All Time";
          break;
      }

      if (!grouped[key]) grouped[key] = { date: key, Income: 0, Expenses: 0, Inventory: 0, Reservations: 0 };
      if (type === "billing") {
        grouped[key].Income += Number(row.card || 0) + Number(row.cash || 0);
        grouped[key].Expenses += Number(row.paid || 0);
      } else if (type === "inventory") {
        grouped[key].Inventory += Number(row.usedQty || 0);
      } else if (type === "reservation") {
        grouped[key].Reservations += 1;
      }
    });

    return Object.values(grouped).sort((a, b) => (a.date < b.date ? 1 : -1));
  };

  const renderChart = (title: string, dataKey: string, data: any[]) => (
    <Card>
      <CardHeader><CardTitle className="text-base sm:text-md font-semibold uppercase">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey={dataKey} fill={CHART_COLOR} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const billingRows = groupByPeriod(billingData, period, "billing");
  const inventoryRows = groupByPeriod(inventoryData, period, "inventory");
  const reservationRows = groupByPeriod(reservationData, period, "reservation");

  const totalIncome = billingRows.reduce((a, r) => a + Number(r.Income || 0), 0);
  const totalExpenses = billingRows.reduce((a, r) => a + Number(r.Expenses || 0), 0);
  const totalInventory = inventoryRows.reduce((a, r) => a + Number(r.Inventory || 0), 0);
  const totalReservations = reservationRows.reduce((a, r) => a + Number(r.Reservations || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 border-solid"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <ToastContainer 
        toasts={toasts} 
        onClose={handleCloseToast}
        onAddStock={handleAddStock}
      />

      {/* Period Dropdown */}
      <div className="flex justify-between">
        <h2 className="text-base sm:text-lg font-semibold uppercase">DashBoard</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select Period" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardHeader><CardTitle className="text-md font-medium">Total Inventory Used</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalInventory}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-md font-medium">Total Reservations</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalReservations}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-md font-medium">Total Income</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">€{totalIncome.toFixed(2)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-md font-medium">Total Expenses</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">€{totalExpenses.toFixed(2)}</p></CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderChart("Reservations", "Reservations", reservationRows)}
        {renderChart("Income", "Income", billingRows)}
        {renderChart("Inventory Usage", "Inventory", inventoryRows)}
        {renderChart("Expenses", "Expenses", billingRows)}
      </div>
    </div>
  );
}