// src/components/InventoryManagement.tsx
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { api } from "@/lib/axios";

interface InventoryItem {
  id: number;
  product: string;
  packSize: string;
  price: number | string;
  qty: number | string;
  total: number | string;
  status: string;
}

const API_URL = "http://localhost:5000/api/inventory";

const InventoryManagement: React.FC = () => {
  const [data, setData] = useState<InventoryItem[]>([]);
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
  });

  // Fetch all items
  const fetchInventory = async () => {
    try {
      const res = await api.get("/inventory");
      setData(res.data);
    } catch (err) {
      console.error("❌ Error fetching inventory:", err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Create or Update
  const handleSave = async () => {
    try {
      if (editingItem) {
        // Update existing item
        await api.put(`/inventory/${editingItem.id}`, formData);
      } else {
        // Create new item
        await api.post("/inventory", formData);
      }
      fetchInventory();
      setIsModalOpen(false);
    } catch (err) {
      console.error("❌ Error saving item:", err);
    }
  };

  const openNewModal = () => {
    setEditingItem(null);
    setFormData({
      id: 0,
      product: "",
      packSize: "",
      price: "",
      qty: "",
      total: "",
      status: "In Stock",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      total:
        name === "price" || name === "qty"
          ? String(Number(name === "price" ? value : prev.price) * Number(name === "qty" ? value : prev.qty))
          : prev.total,
    }));
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/inventory/${id}`);
      fetchInventory();
    } catch (err) {
      console.error("❌ Error deleting item:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-base sm:text-lg font-semibold uppercase">Inventory Management</h1>
        <Button onClick={openNewModal}>+ New Item</Button>
      </div>

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
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.id} className="border-b hover:bg-gray-50 text-sm">
                <td className="p-2">{idx + 1}</td>
                <td className="p-2">{item.product}</td>
                <td className="p-2">{item.packSize}</td>
                <td className="p-2">€{item.price}</td>
                <td className="p-2">{item.qty}</td>
                <td className="p-2">€{item.total}</td>
                <td className="p-2">{item.status}</td>
                <td className="p-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditModal(item)}>
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
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? "Edit Item" : "New Item"}
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                name="product"
                value={formData.product}
                onChange={handleChange}
                placeholder="Product Name"
                className="border w-full p-2 rounded"
              />
              <input
                type="text"
                name="packSize"
                value={formData.packSize}
                onChange={handleChange}
                placeholder="Pack Size"
                className="border w-full p-2 rounded"
              />
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Price"
                className="border w-full p-2 rounded"
              />
              <input
                type="number"
                name="qty"
                value={formData.qty}
                onChange={handleChange}
                placeholder="Quantity"
                className="border w-full p-2 rounded"
              />
              <input
                type="text"
                name="total"
                value={formData.total}
                readOnly
                className="border w-full p-2 rounded bg-gray-100"
              />
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="border w-full p-2 rounded"
              >
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
                <option>Pending Price</option>
              </select>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
