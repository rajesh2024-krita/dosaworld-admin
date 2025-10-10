"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, Plus, X, Calendar, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Loader from "@/components/Loader";
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

const MySwal = withReactContent(Swal)

dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);

// const API_URL = "https://dosaworld-backend.vercel.app/api/billings";
const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function EODBilling() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    card: "",
    cash: "",
    handledBy: "",
    trinkgeld: "",
    trinkgeldBar: "",
    paid: "",
  });
  const [data, setData] = useState<any[]>([]);
  const [filter, setFilter] = useState({ from: "", to: "" });
  const [activeTab, setActiveTab] = useState("daily");
  const [page, setPage] = useState(1)
  const pageSize = 5;

  // Fetch from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/billings");
      setData(res.data?.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Handle form inputs
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit new entry
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post("/billings", form);

      // Show success alert
      await MySwal.fire({
        icon: "success",
        title: "Saved!",
        text: "Entry has been saved successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      await fetchData();
      setOpen(false);
      setForm({
        date: new Date().toISOString().split("T")[0],
        card: "",
        cash: "",
        handledBy: "",
        trinkgeld: "",
        trinkgeldBar: "",
        paid: "",
      });
    } catch (err) {
      console.error(err);
      await MySwal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to save entry",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (rows: any[]) => {
    let csv = "Date,Card,Cash,Handled By,Trinkgeld,Trinkgeld Bar,Paid\n";
    let totals = { card: 0, cash: 0, trinkgeld: 0, trinkgeldBar: 0, paid: 0 };

    rows.forEach((row: any) => {
      csv += `${row.date},${row.card},${row.cash},${row.handledBy},${row.trinkgeld},${row.trinkgeldBar},${row.paid}\n`;
      totals.card += Number(row.card || 0);
      totals.cash += Number(row.cash || 0);
      totals.trinkgeld += Number(row.trinkgeld || 0);
      totals.trinkgeldBar += Number(row.trinkgeldBar || 0);
      totals.paid += Number(row.paid || 0);
    });

    csv += `Totals,${totals.card},${totals.cash},,${totals.trinkgeld},${totals.trinkgeldBar},${totals.paid}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eod_report_${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
  };


  // Apply filters
  const filteredData = data.filter((row: any) => {
    if (filter.from && row.date < filter.from) return false;
    if (filter.to && row.date > filter.to) return false;
    return true;
  });

  // Group data
  const groupBy = (arr: any[], type: "day" | "week" | "month" | "year") => {
    const grouped: any = {};
    arr.forEach((row) => {
      let key = row.date;
      if (type === "week") key = `${dayjs(row.date).year()}-W${dayjs(row.date).isoWeek()}`;
      if (type === "month") key = dayjs(row.date).format("YYYY-MM");
      if (type === "year") key = dayjs(row.date).format("YYYY");
      if (!grouped[key]) {
        grouped[key] = { date: key, card: 0, cash: 0, trinkgeld: 0, trinkgeldBar: 0, paid: 0 };
      }
      grouped[key].card += Number(row.card || 0);
      grouped[key].cash += Number(row.cash || 0);
      grouped[key].trinkgeld += Number(row.trinkgeld || 0);
      grouped[key].trinkgeldBar += Number(row.trinkgeldBar || 0);
      grouped[key].paid += Number(row.paid || 0);
    });
    return Object.values(grouped).sort((a: any, b: any) => (a.date < b.date ? 1 : -1));
  };

  const tabsConfig = [
    { key: "daily", label: "Daily", rows: filteredData },
    { key: "weekly", label: "Weekly", rows: groupBy(filteredData, "week") },
    { key: "monthly", label: "Monthly", rows: groupBy(filteredData, "month") },
    { key: "yearly", label: "Yearly", rows: groupBy(filteredData, "year") },
    { key: "overall", label: "Overall", rows: groupBy(filteredData, "day") },
  ];

  const formatDate = (value: string) => {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    }
    if (/^\d{4}-W\d{2}$/.test(value)) {
      const [year, week] = value.split("-W");
      return `Week ${week}, ${year}`;
    }
    if (/^\d{4}-\d{2}$/.test(value)) {
      return new Date(value + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    }
    return value;
  };

  // Table Renderer
  const renderTable = (rows: any[]) => {
    const totalPages = Math.ceil(rows.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedRows = rows.slice(startIndex, startIndex + pageSize);

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead className="bg-muted-foreground/10 uppercase">
              <tr>
                <th className="p-2 border-b">S. No</th>
                <th className="p-2 border-b">Date</th>
                <th className="p-2 border-b">Card</th>
                <th className="p-2 border-b">Cash</th>
                <th className="p-2 border-b">Handled By</th>
                <th className="p-2 border-b">Trinkgeld</th>
                <th className="p-2 border-b">Trinkgeld Bar</th>
                <th className="p-2 border-b">Paid (Expenses)</th>
                <th className="p-2 border-b">Total (Cash+Card)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row: any, idx: number) => {
                const total = Number(row.card || 0) + Number(row.cash || 0);
                return (
                  <tr key={idx} className="border-t even:bg-muted/20 hover:bg-muted/10">
                    <td className="p-3 font-medium">{idx + 1 + (page - 1) * pageSize}</td>
                    <td className="p-3 font-medium">{formatDate(row.date)}</td>
                    <td className="p-3">€{Number(row.card || 0).toFixed(2)}</td>
                    <td className="p-3">€{Number(row.cash || 0).toFixed(2)}</td>
                    <td className="p-3">{row.handledBy || "-"}</td>
                    <td className="p-3">€{Number(row.trinkgeld || 0).toFixed(2)}</td>
                    <td className="p-3">€{Number(row.trinkgeldBar || 0).toFixed(2)}</td>
                    <td className="p-3">€{Number(row.paid || 0).toFixed(2)}</td>
                    <td className="p-3 font-medium">€{total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length > pageSize && (
          <div className="flex justify-between items-center p-4 text-sm">
            <div>Page {page} of {totalPages}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}

        {rows.length === 0 && <div className="p-8 text-center text-muted-foreground">No data available</div>}
      </div>
    );
  };

  // Chart Renderer
  const renderCharts = (rows: any[]) => {
    if (rows.length === 0) return <div className="p-8 text-center text-muted-foreground">No data available for charts</div>;

    const chartData = rows.map((r: any) => ({
      date: r.date,
      Card: Number(r.card || 0),
      Cash: Number(r.cash || 0),
      Paid: Number(r.paid || 0),
    }));

    const pieData = [
      { name: "Card", value: rows.reduce((a, r) => a + Number(r.card || 0), 0) },
      { name: "Cash", value: rows.reduce((a, r) => a + Number(r.cash || 0), 0) },
      { name: "Paid", value: rows.reduce((a, r) => a + Number(r.paid || 0), 0) },
    ];

    const totalIncome = pieData.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Income</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">€{totalIncome.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Card Payments</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">€{pieData[0].value.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cash Payments</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">€{pieData[1].value.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Expenses</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">€{pieData[2].value.toFixed(2)}</div></CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Income vs Paid</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`€${value}`, ""]} />
                  <Legend />
                  <Bar dataKey="Card" fill="#4f46e5" />
                  <Bar dataKey="Cash" fill="#10b981" />
                  <Bar dataKey="Paid" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Distribution</CardTitle>
              <PieChartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(value) => [`€${value}`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ---------------- Show loader if loading ----------------
  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Top bar, filters, dialog trigger & form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between gap-4 w-full">
          <CardTitle className="text-lg font-semibold tracking-tight uppercase">Billing Management</CardTitle>
          <div className="flex items-center justify-between gap-2">
            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} className="pl-8 w-[130px]" />
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="date" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} className="pl-8 w-[130px]" />
            </div>
            {(filter.from || filter.to) && <Button variant="ghost" size="icon" onClick={() => setFilter({ from: "", to: "" })}><X className="h-4 w-4" /></Button>}
            <Button
              variant="outline"
              onClick={() => {
                const currentTab = tabsConfig.find(t => t.key === activeTab);
                downloadReport(currentTab?.rows || []);
              }}
              className="gap-2"
            >
              <Download className="h-4 w-4" /> Export
            </Button>

          </div>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> New Entry</Button></DialogTrigger>
        </div>

        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add EOD Billing Entry</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Date</label><Input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                readOnly={false} // make sure user can select
                max={new Date().toISOString().split("T")[0]} // today's date in YYYY-MM-DD format
              />
              </div>
              <div><label className="text-sm font-medium">Handled By</label><Input name="handledBy" placeholder="Name" value={form.handledBy} onChange={handleChange} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Card (€)</label><Input name="card" type="number" value={form.card} onChange={handleChange} /></div>
              <div><label className="text-sm font-medium">Cash (€)</label><Input name="cash" type="number" value={form.cash} onChange={handleChange} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Trinkgeld (€)</label><Input name="trinkgeld" type="number" value={form.trinkgeld} onChange={handleChange} /></div>
              <div><label className="text-sm font-medium">Trinkgeld Bar (€)</label><Input name="trinkgeldBar" type="number" value={form.trinkgeldBar} onChange={handleChange} /></div>
            </div>
            <div><label className="text-sm font-medium">Paid / Expenses (€)</label><Input name="paid" type="number" value={form.paid} onChange={handleChange} /></div>
            <div className="flex justify-end gap-2"><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button type="submit">Save</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          {tabsConfig.map((t) => (<TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>))}
        </TabsList>
        {tabsConfig.map((t) => (
          <TabsContent key={t.key} value={t.key} className="space-y-6">
            {renderTable(t.rows)}
            {renderCharts(t.rows)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
