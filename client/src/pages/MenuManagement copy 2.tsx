"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, Edit, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { Combobox } from "@headlessui/react"
import { api } from "@/lib/axios";

type Category = {
  id: number
  name: string
  description: string
  image: string
}

type Item = {
  id: number
  code: string
  name: string
  description?: string
  price: number
  categoryId: number
}

const initialCategories: Category[] = [
  { id: 1, name: "Breakfast", description: "Morning meals", image: "/images/cat1.jpg" },
  { id: 2, name: "Lunch", description: "Afternoon meals", image: "/images/cat2.jpg" },
  { id: 3, name: "Snacks", description: "Evening snacks", image: "/images/cat3.jpg" },
  { id: 4, name: "Dinner", description: "Night meals", image: "/images/cat4.jpg" },
  { id: 5, name: "Desserts", description: "Sweet treats", image: "/images/cat5.jpg" },
  { id: 6, name: "Beverages", description: "Drinks", image: "/images/cat6.jpg" },
  { id: 7, name: "Soups", description: "Warm soups", image: "/images/cat7.jpg" },
  { id: 8, name: "Salads", description: "Fresh salads", image: "/images/cat8.jpg" },
  { id: 9, name: "Sandwiches", description: "Quick bites", image: "/images/cat9.jpg" },
  { id: 10, name: "Wraps", description: "Rolled delights", image: "/images/cat10.jpg" },
  { id: 11, name: "Fast Food", description: "Quick meals", image: "/images/cat11.jpg" },
  { id: 12, name: "Seafood", description: "From the ocean", image: "/images/cat12.jpg" },
]

const initialItems: Item[] = [
  { id: 1, code: "B001", name: "Dosa", description: "Crispy rice pancake", price: 50, categoryId: 1 },
  { id: 2, code: "B002", name: "Idli", description: "Steamed rice cake", price: 40, categoryId: 1 },
  { id: 3, code: "L001", name: "Masala Dosa", price: 70, categoryId: 2 },
  { id: 4, code: "S001", name: "Samosa", price: 25, categoryId: 3 },
  { id: 5, code: "D001", name: "Paneer Butter Masala", price: 120, categoryId: 4 },
]

const API_BASE = 'http://localahost:3000';
console.log('API_BASE == ', API_BASE)
export default function MenuManagement() {
  const [activeTab, setActiveTab] = useState<"items" | "categories">("items")

  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])

  // CRUD states
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  // Popup states
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false)
  const [isEditItemOpen, setIsEditItemOpen] = useState(false)
  const [isViewCategoryOpen, setIsViewCategoryOpen] = useState(false)
  const [isViewItemOpen, setIsViewItemOpen] = useState(false)

  const [categoryQuery, setCategoryQuery] = useState("")
  const [selectedItemCategory, setSelectedItemCategory] = useState<Category | null>(null)

  // Pagination
  const [itemPage, setItemPage] = useState(1)
  const [categoryPage, setCategoryPage] = useState(1)
  const itemsPerPage = 5 // Reduced for better mobile view
  const categoriesPerPage = 5 // Reduced for better mobile view

  const paginatedItems = items.slice((itemPage - 1) * itemsPerPage, itemPage * itemsPerPage)
  const paginatedCategories = categories.slice((categoryPage - 1) * categoriesPerPage, categoryPage * categoriesPerPage)

  const totalItemPages = Math.ceil(items.length / itemsPerPage)
  const totalCategoryPages = Math.ceil(categories.length / categoriesPerPage)

  const getSerial = (index: number, page: number, perPage: number) => (page - 1) * perPage + index + 1

  // ================= API HELPERS =================
  // --------- API HELPERS ----------
  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await api.get("/items");
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  useEffect(() => {
    fetchCategories()
    fetchItems()
  }, [])

  // --------- CATEGORY CRUD ----------
  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget; // ✅ store reference early
    const formData = new FormData(form);

    const newCat = {
      name: formData.get("name"),
      description: formData.get("description"),
      image: formData.get("image"),
    };

    await api.post("/categories", newCat);
    fetchCategories();
    setIsCreateCategoryOpen(false);
    form.reset(); // ✅ safe now
  };


  const handleEditCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Testing')
    if (!selectedCategory) return;

    const formData = new FormData(e.currentTarget);
    console.log('formData == ', formData)
    const updatedCat = {
      name: formData.get("name"),
      description: formData.get("description"),
      image: formData.get("image"),
    };

    await api.put(`/categories/${selectedCategory.id}`, updatedCat);
    fetchCategories();
    setIsEditCategoryOpen(false);
    setSelectedCategory(null);
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm("Delete this category?")) {
      await api.delete(`/categories/${id}`);
      fetchCategories();
      fetchItems();
    }
  };

  // --------- ITEM CRUD ----------
  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItemCategory) return alert("Please select a category");

    const form = e.currentTarget; // save reference before await

    const formData = new FormData(form);
    const newItem = {
      code: formData.get("code"),
      name: formData.get("name"),
      description: formData.get("description"),
      price: Number(formData.get("price")),
      categoryId: selectedItemCategory.id,
    };

    await api.post("/items", newItem);
    fetchItems();
    setIsCreateItemOpen(false);
    form.reset(); // safe now
    setSelectedItemCategory(null);
  };


  const handleEditItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem || !selectedItemCategory) return;

    const formData = new FormData(e.currentTarget);
    const updatedItem = {
      code: formData.get("code"),
      name: formData.get("name"),
      description: formData.get("description"),
      price: Number(formData.get("price")),
      categoryId: selectedItemCategory.id,
    };

    await api.put(`/items/${selectedItem.id}`, updatedItem);
    fetchItems();
    setIsEditItemOpen(false);
    setSelectedItem(null);
  };

  const handleDeleteItem = async (id: number) => {
    if (confirm("Delete this item?")) {
      await api.delete(`/items/${id}`);
      fetchItems();
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap border-b overflow-x-auto">
        <button
          className={`px-3 py-2 text-sm sm:text-base ${activeTab === "items" ? "border-b-2 border-green-500 font-bold" : ""}`}
          onClick={() => setActiveTab("items")}
        >
          Items
        </button>
        <button
          className={`px-3 py-2 text-sm sm:text-base ${activeTab === "categories" ? "border-b-2 border-green-500 font-bold" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          Categories
        </button>
      </div>

      {/* ================== ITEMS TAB ================== */}
      {activeTab === "items" && (
        <div className="space-y-4">
          {/* CREATE ITEM BUTTON */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-base sm:text-lg font-semibold uppercase">Items Management</div>
            <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto text-xs sm:text-sm py-1 px-2 h-8"><span>+</span> Create Item</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-sm sm:text-base">Create Item</DialogTitle></DialogHeader>
                <form className="space-y-3" onSubmit={handleCreateItem}>
                  <Input name="code" placeholder="Item Code" required className="text-sm" />
                  <Input name="name" placeholder="Item Name" required className="text-sm" />
                  <Textarea name="description" placeholder="Description (Optional)" className="text-sm min-h-[80px]" />
                  <Input name="price" type="number" placeholder="Price" required className="text-sm" />
                  <Combobox value={selectedItemCategory} onChange={setSelectedItemCategory}>
                    <div className="relative">
                      <Combobox.Input
                        className="w-full border px-2 py-1 rounded text-sm"
                        onChange={(e) => setCategoryQuery(e.target.value)}
                        displayValue={(cat: Category | null) => cat?.name ?? ""}
                        placeholder="Select Category"
                      />
                      <Combobox.Options className="absolute z-10 w-full bg-white border rounded mt-1 max-h-48 overflow-y-auto text-sm">
                        {categories
                          .filter(c => c.name.toLowerCase().includes(categoryQuery.toLowerCase()))
                          .map(c => (
                            <Combobox.Option
                              key={c.id}
                              value={c}
                              className={({ active, selected }) =>
                                `cursor-pointer px-2 py-1 ${active ? "bg-green-100" : ""} ${selected ? "font-bold" : ""}`
                              }
                            >
                              {c.name}
                            </Combobox.Option>
                          ))}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                  <Button type="submit" className="w-full text-sm py-1 h-8">Create</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* ITEMS TABLE */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted-foreground/10 uppercase">
                <tr>
                  <th className="p-2 border-b w-8">#</th>
                  <th className="p-2 border-b">Code</th>
                  <th className="p-2 border-b">Name</th>
                  <th className="p-2 border-b">Price</th>
                  <th className="p-2 border-b hidden xs:table-cell">Category</th>
                  <th className="p-2 border-b w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((it: any, idx) => {
                  const cat = categories.find(c => c.id === it?.category_id)
                  return (
                    <tr key={it.id} className="hover:bg-muted/10 border-b last:border-b-0">
                      <td className="p-2">{getSerial(idx, itemPage, itemsPerPage)}</td>
                      <td className="p-2 font-medium">{it.code}</td>
                      <td className="p-2">{it.name}</td>
                      <td className="p-2">₹{it.price}</td>
                      <td className="p-2 hidden xs:table-cell">{cat?.name}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => { setSelectedItem(it); setSelectedItemCategory(cat || null); setIsEditItemOpen(true) }}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => handleDeleteItem(it.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => { setSelectedItem(it); setIsViewItemOpen(true) }}>
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ITEMS PAGINATION */}
          <div className="flex flex-wrap gap-1 justify-center items-center">
            {/* Previous */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              disabled={itemPage === 1}
              onClick={() => setItemPage(itemPage - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {Array.from({ length: totalItemPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 || // always show first
                  page === totalItemPages || // always show last
                  (page >= itemPage - 1 && page <= itemPage + 1) // only show neighbors on mobile
              )
              .map((page, idx, arr) => (
                <div key={page} className="flex items-center">
                  {/* Ellipsis before gap */}
                  {idx > 0 && arr[idx] - arr[idx - 1] > 1 && (
                    <span className="px-1 text-xs">...</span>
                  )}
                  <Button
                    size="sm"
                    variant={page === itemPage ? "default" : "outline"}
                    className="h-8 w-8 p-0 text-xs"
                    onClick={() => setItemPage(page)}
                  >
                    {page}
                  </Button>
                </div>
              ))}

            {/* Next */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              disabled={itemPage === totalItemPages}
              onClick={() => setItemPage(itemPage + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

        </div>
      )}

      {/* ================== CATEGORIES TAB ================== */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          {/* CREATE CATEGORY */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-base sm:text-lg font-semibold uppercase">Category Management</h1>
            <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto text-xs sm:text-sm py-1 px-2 h-8">+ Create Category</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-sm sm:text-base">Create Category</DialogTitle></DialogHeader>
                <form className="space-y-3" onSubmit={handleCreateCategory}>
                  <Input name="name" placeholder="Category Name" required className="text-sm" />
                  <Textarea name="description" placeholder="Description" className="text-sm min-h-[80px]" />
                  <Input name="image" placeholder="Image URL" className="text-sm" />
                  <Button type="submit" className="w-full text-sm py-1 h-8">Create</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* CATEGORIES TABLE */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted-foreground/10 uppercase">
                <tr>
                  <th className="p-2 border-b w-8">#</th>
                  <th className="p-2 border-b">Name</th>
                  <th className="p-2 border-b hidden xs:table-cell">Description</th>
                  <th className="p-2 border-b">Image</th>
                  <th className="p-2 border-b w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-muted/10 border-b last:border-b-0">
                    <td className="p-2">{getSerial(idx, categoryPage, categoriesPerPage)}</td>
                    <td className="p-2 font-medium">{cat.name}</td>
                    <td className="p-2 hidden xs:table-cell">{cat.description}</td>
                    <td className="p-2">
                      {cat.image && <img src={cat.image} alt={cat.name} className="w-12 h-8 object-cover rounded" />}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => { setSelectedCategory(cat); setIsEditCategoryOpen(true) }}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => handleDeleteCategory(cat.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => { setSelectedCategory(cat); setIsViewCategoryOpen(true) }}>
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CATEGORIES PAGINATION */}
          <div className="flex flex-wrap gap-1 justify-center items-center">
            {/* Previous */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              disabled={categoryPage === 1}
              onClick={() => setCategoryPage(categoryPage - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {Array.from({ length: totalCategoryPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 || // always show first
                  page === totalCategoryPages || // always show last
                  (page >= categoryPage - 1 && page <= categoryPage + 1) // only show neighbors on mobile
              )
              .map((page, idx, arr) => (
                <div key={page} className="flex items-center">
                  {/* Ellipsis before gap */}
                  {idx > 0 && arr[idx] - arr[idx - 1] > 1 && (
                    <span className="px-1 text-xs">...</span>
                  )}
                  <Button
                    size="sm"
                    variant={page === categoryPage ? "default" : "outline"}
                    className="h-8 w-8 p-0 text-xs"
                    onClick={() => setCategoryPage(page)}
                  >
                    {page}
                  </Button>
                </div>
              ))}

            {/* Next */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              disabled={categoryPage === totalCategoryPages}
              onClick={() => setCategoryPage(categoryPage + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

        </div>
      )}

      {/* ================== ITEM VIEW POPUP ================== */}
      <Dialog open={isViewItemOpen} onOpenChange={setIsViewItemOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-semibold text-green-700 dark:text-green-400">
              Item Details
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 space-y-3">
              {/* Header */}
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
                  {selectedItem.name}
                </h2>
                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full self-start xs:self-auto">
                  {categories.find(c => c.id === selectedItem.categoryId)?.name}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 text-xs sm:text-sm">
                <p className="text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-200">Code:</span> {selectedItem.code}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-200">Description:</span>{" "}
                  {selectedItem.description || "No description"}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-200">Price:</span> ₹{selectedItem.price}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================== ITEM EDIT POPUP ================== */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader><DialogTitle className="text-sm sm:text-base">Edit Item</DialogTitle></DialogHeader>
          {selectedItem && (
            <form className="space-y-3" onSubmit={handleEditItem}>
              <Input name="code" defaultValue={selectedItem.code} required className="text-sm" />
              <Input name="name" defaultValue={selectedItem.name} required className="text-sm" />
              <Textarea name="description" defaultValue={selectedItem.description} className="text-sm min-h-[80px]" />
              <Input name="price" type="number" defaultValue={selectedItem.price} required className="text-sm" />
              <Combobox value={selectedItemCategory} onChange={setSelectedItemCategory}>
                <div className="relative">
                  <Combobox.Input
                    className="w-full border px-2 py-1 rounded text-sm"
                    onChange={(e) => setCategoryQuery(e.target.value)}
                    displayValue={(cat: Category | null) => cat?.name ?? ""}
                  />
                  <Combobox.Options className="absolute z-10 w-full bg-white border rounded mt-1 max-h-48 overflow-y-auto text-sm">
                    {categories
                      .filter(c => c.name.toLowerCase().includes(categoryQuery.toLowerCase()))
                      .map(c => (
                        <Combobox.Option
                          key={c.id}
                          value={c}
                          className={({ active, selected }) =>
                            `cursor-pointer px-2 py-1 ${active ? "bg-green-100" : ""} ${selected ? "font-bold" : ""}`
                          }
                        >
                          {c.name}
                        </Combobox.Option>
                      ))}
                  </Combobox.Options>
                </div>
              </Combobox>
              <Button type="submit" className="w-full text-sm py-1 h-8">Save</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ================== CATEGORY VIEW POPUP ================== */}
      <Dialog open={isViewCategoryOpen} onOpenChange={setIsViewCategoryOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-semibold text-green-700 dark:text-green-400">
              Category Details
            </DialogTitle>
          </DialogHeader>

          {selectedCategory && (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 space-y-3">
              {/* Header */}
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
                  {selectedCategory.name}
                </h2>
                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full self-start xs:self-auto">
                  Category
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 text-xs sm:text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Description</p>
                  <p className="text-gray-700 dark:text-gray-200">
                    {selectedCategory.description || "No description available"}
                  </p>
                </div>

                {selectedCategory.image && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Image</p>
                    <img
                      src={selectedCategory.image}
                      alt={selectedCategory.name}
                      className="w-full max-h-40 object-cover rounded border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================== CATEGORY EDIT POPUP ================== */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader><DialogTitle className="text-sm sm:text-base">Edit Category</DialogTitle></DialogHeader>
          {selectedCategory && (
            <form className="space-y-3" onSubmit={handleEditCategory}>
              <Input name="name" defaultValue={selectedCategory.name} required className="text-sm" />
              <Textarea name="description" defaultValue={selectedCategory.description} className="text-sm min-h-[80px]" />
              <Input name="image" defaultValue={selectedCategory.image} className="text-sm" />
              <Button type="submit" className="w-full text-sm py-1 h-8">Save</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}