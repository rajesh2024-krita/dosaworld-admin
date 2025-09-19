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
    const form = e.currentTarget
    const formData = new FormData(form)

    const imageFile = formData.get("imageFile") as File | null
    let imageUrl = formData.get("image") as string

    if (imageFile && imageFile.size > 0) {
      const imgForm = new FormData()
      imgForm.append("file", imageFile)
      const uploadRes = await api.post("/upload-category-image", imgForm)
      imageUrl = uploadRes.data.url
    }

    await api.post("/categories", {
      name: formData.get("name"),
      description: formData.get("description"),
      image: imageUrl
    })

    fetchCategories()
    setIsCreateCategoryOpen(false)
    form.reset()
  }

  const handleEditCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCategory) return
    const formData = new FormData(e.currentTarget)

    const imageFile = formData.get("imageFile") as File | null
    let imageUrl = formData.get("image") as string

    if (imageFile && imageFile.size > 0) {
      const imgForm = new FormData()
      imgForm.append("file", imageFile)
      const uploadRes = await api.post("/upload-category-image", imgForm)
      imageUrl = uploadRes.data.url
    }

    await api.put(`/categories/${selectedCategory.id}`, {
      name: formData.get("name"),
      description: formData.get("description"),
      image: imageUrl
    })

    fetchCategories()
    setIsEditCategoryOpen(false)
    setSelectedCategory(null)
  }

  const handleDeleteCategory = async (id: number) => {
    if (confirm("Delete this category?")) {
      await api.delete(`/categories/${id}`)
      fetchCategories()
      fetchItems()
    }
  }

  // ================== ITEM CRUD ==================
  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedItemCategory) return alert("Please select a category")

    const form = e.currentTarget
    const formData = new FormData(form)

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
  }

  const handleEditItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedItem || !selectedItemCategory) return

    const formData = new FormData(e.currentTarget)

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
  }

  const handleDeleteItem = async (id: number) => {
    if (confirm("Delete this item?")) {
      await api.delete(`/items/${id}`)
      fetchItems()
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
            <h2 className="font-semibold">Items Management</h2>
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
                  <Button type="submit" className="w-full">Create</Button>
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
                  const cat = categories.find(c => c.id === it?.category_id)
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
              <Button type="submit" className="w-full">Save</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= CATEGORIES TAB ================= */}
      {activeTab === "categories" && (
        <div className="space-y-4">

          {/* Create Category */}
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Categories Management</h2>
            <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
              <DialogTrigger asChild>
                <Button>+ Create Category</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Category</DialogTitle></DialogHeader>
                <form className="space-y-2" onSubmit={handleCreateCategory}>
                  <Input name="name" placeholder="Category Name" required />
                  <Textarea name="description" placeholder="Description" />
                  <Input type="hidden" name="image" />
                  <Input type="file" name="imageFile" accept="image/*" />
                  <Button type="submit" className="w-full">Create</Button>
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
        </div>
      )}

      {/* ================= EDIT CATEGORY MODAL ================= */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedCategory && (
            <form className="space-y-2" onSubmit={handleEditCategory}>
              <Input name="name" defaultValue={selectedCategory.name} required />
              <Textarea name="description" defaultValue={selectedCategory.description} />
              <Input type="hidden" name="image" defaultValue={selectedCategory.image} />
              <Input type="file" name="imageFile" accept="image/*" />
              <Button type="submit" className="w-full">Save</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
