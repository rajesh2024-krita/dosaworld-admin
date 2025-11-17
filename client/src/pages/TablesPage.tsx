import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = "https://api.dosaworld.de/api/tables";

interface TableItem {
  id?: number;
  table_no: number;
  seats: number;
  status: "available" | "booked";
}

export default function TablesPage() {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [form, setForm] = useState<TableItem>({
    table_no: 0,
    seats: 0,
    status: "available",
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; tableId: number | null; tableNo: number }>({
    isOpen: false,
    tableId: null,
    tableNo: 0,
  });

  // Load all tables
  const fetchTables = async () => {
    const res = await axios.get(API_URL);
    setTables(res.data);
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Input change handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "table_no" || name === "seats" ? Number(value) : value });
  };

  // Open dialog for create
  const handleCreate = () => {
    setForm({ table_no: 0, seats: 0, status: "available" });
    setEditId(null);
    setOpenForm(true);
  };

  // Open dialog for edit
  const handleEdit = (item: TableItem) => {
    setForm(item);
    setEditId(item.id || null);
    setOpenForm(true);
  };

  // Create or Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editId) {
      await axios.put(`${API_URL}/${editId}`, form);
    } else {
      await axios.post(API_URL, form);
    }

    setOpenForm(false);
    fetchTables();
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (id: number | undefined, tableNo: number) => {
    if (id) {
      setDeleteDialog({ isOpen: true, tableId: id, tableNo });
    }
  };

  // Delete a table
  const handleDelete = async () => {
    if (deleteDialog.tableId) {
      await axios.delete(`${API_URL}/${deleteDialog.tableId}`);
      setDeleteDialog({ isOpen: false, tableId: null, tableNo: 0 });
      fetchTables();
    }
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    return status === "available" 
      ? "bg-green-100 text-green-800 border-green-200" 
      : "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <div className="">
      <div className="max-w-7xl mx-auto">
        {/* Header */}

        {/* Table Management Section */}
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-base sm:text-lg font-semibold uppercase">Table Management</h2>
            <Button
              className="w-full sm:w-auto text-xs sm:text-sm py-1 px-2 h-8"
              onClick={handleCreate}
            >
              <Plus className="w-3 h-3 mr-1" /> Create Table
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tables.map((table) => (
              <Card key={table.id} className="shadow-sm border rounded-lg flex items-center">
                {/* Card Header */}
                <CardHeader className="p-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-semibold text-gray-900">Table #{table.table_no}</CardTitle>
                      <p className="text-xs text-gray-500 mt-1">{table.seats} seats</p>
                    </div>
                  </div>
                </CardHeader>

                {/* Card Actions */}
                <CardContent className="flex justify-center gap-1 p-2 pt-0">
                  <Button 
                    size="sm" variant="outline" className="h-6 w-6 p-0"
                    onClick={() => handleEdit(table)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" variant="outline" className="h-6 w-6 p-0"
                    onClick={() => openDeleteDialog(table.id, table.table_no)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {tables.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="max-w-md mx-auto">
                <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <TableIcon className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tables yet</h3>
                <p className="text-gray-500 mb-6">Get started by creating your first table.</p>
                <Button
                  onClick={handleCreate}
                  className="w-full sm:w-auto text-xs sm:text-sm py-1 px-2 h-8"
                >
                  <Plus className="w-3 h-3 mr-1" /> Create Table
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Form Dialog */}
        {openForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {editId ? "Edit Table" : "Create Table"}
                  </h3>
                  <button
                    onClick={() => setOpenForm(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Table Number
                    </label>
                    <input
                      type="number"
                      name="table_no"
                      value={form.table_no}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Seats
                    </label>
                    <input
                      type="number"
                      name="seats"
                      value={form.seats}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                      min="1"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={() => setOpenForm(false)}
                      className="w-full sm:w-auto text-xs sm:text-sm py-1 px-2 h-8 bg-white text-gray-600 border-2 border-gray-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="w-full sm:w-auto text-xs sm:text-sm py-1 px-2 h-8"
                    >
                      {editId ? "Update Table" : "Create Table"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteDialog.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-sm w-full">
              <div className="p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Table</h3>
                <p className="text-gray-500 mb-6">
                  Are you sure you want to delete Table #{deleteDialog.tableNo}? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setDeleteDialog({ isOpen: false, tableId: null, tableNo: 0 })}
                    className="w-full sm:w-auto text-xs sm:text-sm py-1 px-2 h-8 bg-white text-gray-600 border-2 border-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Icon components (you can replace these with your actual icon library)
const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const Edit = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const Trash2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TableIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);