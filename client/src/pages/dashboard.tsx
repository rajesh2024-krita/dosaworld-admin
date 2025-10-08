"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
dayjs.extend(isoWeek);

const API_BILLING_URL = "https://dosaworld-backend.vercel.app/api/billings";
const API_INVENTORY_URL = "https://dosaworld-backend.vercel.app/api/usage";
const API_RESERVATION_URL = "https://dosaworld-backend.vercel.app/api/reservations";
const CHART_COLOR = "#15803d"; // Unified green color for all graphs

export default function Dashboard() {
  const [billingData, setBillingData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [reservationData, setReservationData] = useState<any[]>([]);
  const [period, setPeriod] = useState("today");
  const [loading, setLoading] = useState(true); // NEW

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

  // Fetch data
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [billingRes, inventoryRes, reservationRes] = await Promise.all([
          axios.get(API_BILLING_URL),
          axios.get(API_INVENTORY_URL),
          axios.get(API_RESERVATION_URL),
        ]);

        setBillingData(billingRes.data?.data || []);
        setInventoryData(inventoryRes.data?.data || []);
        setReservationData(reservationRes.data || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

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
