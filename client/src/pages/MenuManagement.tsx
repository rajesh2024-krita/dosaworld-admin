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
import { api } from "@/lib/axios"

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

export default function MenuManagement() {
  const [activeTab, setActiveTab] = useState<"items" | "categories">("items")
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false)
  const [isEditItemOpen, setIsEditItemOpen] = useState(false)
  const [isViewCategoryOpen, setIsViewCategoryOpen] = useState(false)
  const [isViewItemOpen, setIsViewItemOpen] = useState(false)

  const [categoryQuery, setCategoryQuery] = useState("")
  const [selectedItemCategory, setSelectedItemCategory] = useState<Category | null>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Pagination
  const [itemPage, setItemPage] = useState(1)
  const [categoryPage, setCategoryPage] = useState(1)
  const itemsPerPage = 5
  const categoriesPerPage = 5

  const paginatedItems = items.slice((itemPage - 1) * itemsPerPage, itemPage * itemsPerPage)
  const paginatedCategories = categories.slice((categoryPage - 1) * categoriesPerPage, categoryPage * categoriesPerPage)
  const totalItemPages = Math.ceil(items.length / itemsPerPage)
  const totalCategoryPages = Math.ceil(categories.length / categoriesPerPage)

  const getSerial = (index: number, page: number, perPage: number) => (page - 1) * perPage + index + 1

  // ================== API HELPERS ==================
  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories")
      setCategories(res.data)
    } catch (err) {
      console.error("Error fetching categories:", err)
    }
  }

  const fetchItems = async () => {
    try {
      const res = await api.get("/items")
      setItems(res.data)
    } catch (err) {
      console.error("Error fetching items:", err)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchItems()
  }, [])

  // ================== CATEGORY CRUD ==================
  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  if (isLoading) return

  setIsLoading(true)
  setIsUploading(false)

  try {
    const form = e.currentTarget
    const formData = new FormData(form)

    // Include file in the same formData
    const imageFile = formData.get("imageFile") as File | null
    if (!imageFile || imageFile.size === 0) {
      formData.delete("imageFile") // optional cleanup
    }

    console.log("Sending formData:", formData)

    // Send everything in one request
    const res = await api.post("/categories/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })

    console.log("Category created:", res.data)
    fetchCategories()
    setIsCreateCategoryOpen(false)
    form.reset()
  } catch (err) {
    console.error("Error creating category:", err)
    alert("Failed to create category. Please check console for details.")
  } finally {
    setIsLoading(false)
    setIsUploading(false)
  }
}


  const handleEditCategory = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  if (!selectedCategory || isLoading) return

  setIsLoading(true)

  try {
    const formData = new FormData(e.currentTarget)

    // ✅ Add existing image if no new file selected
    const imageFile = formData.get("imageFile") as File | null
    if (!imageFile || imageFile.size === 0) {
      formData.delete("imageFile") // clean up
      formData.append("image", selectedCategory.image) // keep old one
    }

    console.log('formData == ', formData)

    console.log("Updating category, sending formData...")

    await api.put(`/categories/update/${selectedCategory.id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    fetchCategories()
    setIsEditCategoryOpen(false)
    setSelectedCategory(null)
  } catch (err) {
    console.error("Error updating category:", err)
    alert("Failed to update category. Please check console for details.")
  } finally {
    setIsLoading(false)
  }
}

  const handleDeleteCategory = async (id: number) => {
    if (confirm("Delete this category?")) {
      try {
        await api.delete(`/categories/${id}`)
        fetchCategories()
        fetchItems()
      } catch (err) {
        console.error("Error deleting category:", err)
        alert("Failed to delete category")
      }
    }
  }

  // ================== ITEM CRUD ==================
  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedItemCategory) return alert("Please select a category")
    if (isLoading) return

    setIsLoading(true)
    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      await api.post("/items", {
        code: formData.get("code"),
        name: formData.get("name"),
        description: formData.get("description"),
        price: Number(formData.get("price")),
        categoryId: selectedItemCategory.id
      })

      fetchItems()
      setIsCreateItemOpen(false)
      form.reset()
      setSelectedItemCategory(null)
    } catch (err) {
      console.error("Error creating item:", err)
      alert("Failed to create item")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedItem || !selectedItemCategory || isLoading) return

    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      await api.put(`/items/${selectedItem.id}`, {
        code: formData.get("code"),
        name: formData.get("name"),
        description: formData.get("description"),
        price: Number(formData.get("price")),
        categoryId: selectedItemCategory.id
      })

      fetchItems()
      setIsEditItemOpen(false)
      setSelectedItem(null)
    } catch (err) {
      console.error("Error updating item:", err)
      alert("Failed to update item")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteItem = async (id: number) => {
    if (confirm("Delete this item?")) {
      try {
        await api.delete(`/items/${id}`)
        fetchItems()
      } catch (err) {
        console.error("Error deleting item:", err)
        alert("Failed to delete item")
      }
    }
  }

  return (
    <div className="space-y-4">

      {/* Tabs */}
      <div className="flex flex-wrap border-b overflow-x-auto">
        <button
          className={`px-3 py-2 ${activeTab === "items" ? "border-b-2 border-green-500 font-bold" : ""}`}
          onClick={() => setActiveTab("items")}
        >
          Items
        </button>
        <button
          className={`px-3 py-2 ${activeTab === "categories" ? "border-b-2 border-green-500 font-bold" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          Categories
        </button>
      </div>

      {/* ================= ITEMS TAB ================= */}
      {activeTab === "items" && (
        <div className="space-y-4">

          {/* Create Item */}
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold uppercase">Items Management</h2>
            <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
              <DialogTrigger asChild>
                <Button>+ Create Item</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Item</DialogTitle></DialogHeader>
                <form className="space-y-2" onSubmit={handleCreateItem}>
                  <Input name="code" placeholder="Item Code" required />
                  <Input name="name" placeholder="Item Name" required />
                  <Textarea name="description" placeholder="Description" />
                  <Input name="price" type="number" placeholder="Price" required />
                  <Combobox value={selectedItemCategory} onChange={setSelectedItemCategory}>
                    <div className="relative">
                      <Combobox.Input
                        className="w-full border px-2 py-1 rounded"
                        onChange={(e) => setCategoryQuery(e.target.value)}
                        displayValue={(cat: Category | null) => cat?.name ?? ""}
                        placeholder="Select Category"
                      />
                      <Combobox.Options className="absolute z-10 w-full bg-white border rounded mt-1 max-h-48 overflow-y-auto">
                        {categories
                          .filter(c => c.name.toLowerCase().includes(categoryQuery.toLowerCase()))
                          .map(c => (
                            <Combobox.Option key={c.id} value={c} className="px-2 py-1 hover:bg-green-100">
                              {c.name}
                            </Combobox.Option>
                          ))}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-left">
              <thead className="bg-gray-100 uppercase">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Code</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((it, idx) => {
                  const cat = categories.find(c => c.id === it.categoryId)
                  return (
                    <tr key={it.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{getSerial(idx, itemPage, itemsPerPage)}</td>
                      <td className="p-2">{it.code}</td>
                      <td className="p-2">{it.name}</td>
                      <td className="p-2">₹{it.price}</td>
                      <td className="p-2">{cat?.name}</td>
                      <td className="p-2 flex gap-1">
                        <Button size="sm" variant="outline"
                          onClick={() => { setSelectedItem(it); setSelectedItemCategory(cat || null); setIsEditItemOpen(true) }}>
                          <Edit />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteItem(it.id)}>
                          <Trash2 />
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={() => { setSelectedItem(it); setIsViewItemOpen(true) }}>
                          <Eye />
                        </Button>
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

      {/* ================= EDIT ITEM MODAL ================= */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedItem && (
            <form className="space-y-2" onSubmit={handleEditItem}>
              <Input name="code" defaultValue={selectedItem.code} required />
              <Input name="name" defaultValue={selectedItem.name} required />
              <Textarea name="description" defaultValue={selectedItem.description} />
              <Input name="price" type="number" defaultValue={selectedItem.price} required />
              <Combobox value={selectedItemCategory} onChange={setSelectedItemCategory}>
                <div className="relative">
                  <Combobox.Input
                    className="w-full border px-2 py-1 rounded"
                    onChange={(e) => setCategoryQuery(e.target.value)}
                    displayValue={(cat: Category | null) => cat?.name ?? ""}
                  />
                  <Combobox.Options className="absolute z-10 w-full bg-white border rounded mt-1 max-h-48 overflow-y-auto">
                    {categories
                      .filter(c => c.name.toLowerCase().includes(categoryQuery.toLowerCase()))
                      .map(c => (
                        <Combobox.Option key={c.id} value={c} className="px-2 py-1 hover:bg-green-100">
                          {c.name}
                        </Combobox.Option>
                      ))}
                  </Combobox.Options>
                </div>
              </Combobox>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= CATEGORIES TAB ================= */}
      {activeTab === "categories" && (
        <div className="space-y-4">

          {/* Create Category */}
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold uppercase">Categories Management</h2>
            <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
              <DialogTrigger asChild>
                <Button>+ Create Category</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Category</DialogTitle></DialogHeader>
                <form className="space-y-2" onSubmit={handleCreateCategory}>
                  <Input name="name" placeholder="Category Name" required />
                  <Textarea name="description" placeholder="Description" />
                  <Input type="file" name="imageFile" accept="image/*" required />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || isUploading}
                  >
                    {isUploading ? "Uploading..." : isLoading ? "Creating..." : "Create"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Categories Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-left">
              <thead className="bg-gray-100 uppercase">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Description</th>
                  <th className="p-2">Image</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.map((cat, idx) => (
                  <tr key={cat.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{getSerial(idx, categoryPage, categoriesPerPage)}</td>
                    <td className="p-2">{cat.name}</td>
                    <td className="p-2">{cat.description}</td>
                    <td className="p-2">
                      {cat.image && <img src={cat.image} alt={cat.name} className="w-12 h-12 object-cover" />}
                    </td>
                    <td className="p-2 flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedCategory(cat); setIsEditCategoryOpen(true) }}><Edit /></Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteCategory(cat.id)}><Trash2 /></Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedCategory(cat); setIsViewCategoryOpen(true) }}><Eye /></Button>
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

      {/* ================= EDIT CATEGORY MODAL ================= */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedCategory && (
            <form className="space-y-2" onSubmit={handleEditCategory}>
              <Input name="name" defaultValue={selectedCategory.name} required />
              <Textarea name="description" defaultValue={selectedCategory.description} />
              <Input type="file" name="imageFile" accept="image/*" />
              {selectedCategory.image && (
                <div className="text-sm text-gray-500">
                  Current image: <img src={selectedCategory.image} alt="Current" className="w-12 h-12 object-cover mt-1" />
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isUploading}
              >
                {isUploading ? "Uploading..." : isLoading ? "Saving..." : "Save"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}