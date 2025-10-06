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
import { Trash2, Edit, Eye, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Combobox } from "@headlessui/react"
import { api } from "@/lib/axios"
import Loader from "@/components/Loader"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

const MySwal = withReactContent(Swal)



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
  category_id: number
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
  const [isItemsLoading, setIsItemsLoading] = useState(false)
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)

  // Search states
  const [itemSearch, setItemSearch] = useState("")
  const [categorySearch, setCategorySearch] = useState("")

  // Pagination
  const [itemPage, setItemPage] = useState(1)
  const [categoryPage, setCategoryPage] = useState(1)
  const itemsPerPage = 5
  const categoriesPerPage = 5

  // Filtered data based on search
  const filteredItems = items.filter(item => {
    if (!itemSearch) return true;

    const searchTerm = itemSearch.toLowerCase();
    const categoryName = categories.find(cat => cat.id === item.category_id)?.name.toLowerCase() || '';

    return (
      item.name.toLowerCase().includes(searchTerm) ||
      item.code.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm) ||
      categoryName.includes(searchTerm)
    );
  });

  const filteredCategories = categories.filter(category => {
    if (!categorySearch) return true;

    const searchTerm = categorySearch.toLowerCase();
    return (
      category.name.toLowerCase().includes(searchTerm) ||
      category.description.toLowerCase().includes(searchTerm)
    );
  });

  const paginatedItems = filteredItems.slice((itemPage - 1) * itemsPerPage, itemPage * itemsPerPage)
  const paginatedCategories = filteredCategories.slice((categoryPage - 1) * categoriesPerPage, categoryPage * categoriesPerPage)
  const totalItemPages = Math.ceil(filteredItems.length / itemsPerPage)
  const totalCategoryPages = Math.ceil(filteredCategories.length / categoriesPerPage)

  const getSerial = (index: number, page: number, perPage: number) => (page - 1) * perPage + index + 1

  // Reset pagination when search changes or tab changes
  useEffect(() => {
    setItemPage(1)
  }, [itemSearch, activeTab])

  useEffect(() => {
    setCategoryPage(1)
  }, [categorySearch, activeTab])

  // Clear search when switching tabs
  useEffect(() => {
    setItemSearch("")
    setCategorySearch("")
  }, [activeTab])

  // ================== API HELPERS ==================
  const fetchCategories = async () => {
    try {
      setIsCategoriesLoading(true)
      const res = await api.get("/categories")
      setCategories(res.data)
    } catch (err) {
      console.error("Error fetching categories:", err)
    } finally {
      setIsCategoriesLoading(false)
    }
  }

  const fetchItems = async () => {
    try {
      setIsItemsLoading(true)
      const res = await api.get("/items")
      setItems(res.data)
    } catch (err) {
      console.error("Error fetching items:", err)
    } finally {
      setIsItemsLoading(false)
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
    try {
      const formData = new FormData(e.currentTarget)

      // DEBUG: see what's inside
      // for (let [key, val] of formData.entries()) {
      //   console.log(key, val)
      // }

      const res = await api.post("/categories/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      console.log("✅ Category created:", res.data)

      fetchCategories()
      setIsCreateCategoryOpen(false)
      e.currentTarget.reset()
    } catch (err) {
      console.error("❌ Error creating category:", err)
      // alert("Failed to create category")
      MySwal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to create category",
      })

    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCategory || isLoading) return

    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)

      const imageFile = formData.get("imageFile") as File | null
      if (!imageFile || imageFile.size === 0) {
        formData.delete("imageFile")
      }

      // for (let [key, val] of formData.entries()) {
      //   console.log(key, val)
      // }

      await api.put(`/categories/update/${selectedCategory.id}`, formData)
      fetchCategories()
      setIsEditCategoryOpen(false)
      setSelectedCategory(null)
    } catch (err) {
      console.error("❌ Error updating category:", err)
      // alert("Failed to update category")
      MySwal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update category",
      })

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
        // alert("Failed to delete category")
        MySwal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to delete category",
        })

      }
    }
  }

  // ================== ITEM CRUD ==================
  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedItemCategory) 
      return MySwal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please select a category",
      })

    // alert("Please select a category")
    if (isLoading) return

    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)

      await api.post("/items", {
        code: formData.get("code"),
        name: formData.get("name"),
        description: formData.get("description"),
        price: Number(formData.get("price")),
        category_id: selectedItemCategory.id
      })

      fetchItems()
      setIsCreateItemOpen(false)
      e.currentTarget.reset()
      setSelectedItemCategory(null)
    } catch (err) {
      console.error("❌ Error creating item:", err)
      // alert("Failed to create item")
      MySwal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to create item",
      })

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
      // alert("Failed to update item")
      MySwal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update item",
      })

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
        // alert("Failed to delete item")
        MySwal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to delete item",
        })

      }
    }
  }

  if (isItemsLoading && isCategoriesLoading) {
    return <Loader />
  }

  return (
    <div className="space-y-4">
      {/* Show loader when initial data is loading */}
      {(isItemsLoading && activeTab === "items") || (isCategoriesLoading && activeTab === "categories") ? (
        <Loader />
      ) : (
        <>
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

              {/* Header with Search and Create */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-base sm:text-lg font-semibold uppercase">Items Management</h2>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search items..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="pl-8 w-full sm:w-64"
                    />
                  </div>

                  {/* Create Button */}
                  <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
                    <DialogTrigger asChild>
                      <Button>+ Create Item</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogTitle>Create Item</DialogTitle>
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
              </div>

              {/* Results Count */}
              {items.length > 0 && (
                <div className="text-sm text-gray-600">
                  Showing {paginatedItems.length} of {filteredItems.length} items
                  {itemSearch && (
                    <span> for "<strong>{itemSearch}</strong>"</span>
                  )}
                </div>
              )}

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
                    {isItemsLoading ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500">
                          Loading items...
                        </td>
                      </tr>
                    ) : paginatedItems.length > 0 ? (
                      paginatedItems.map((it, idx) => {
                        const cat = categories.find(c => c.id === it.category_id)
                        return (
                          <tr key={it.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{getSerial(idx, itemPage, itemsPerPage)}</td>
                            <td className="p-2">{it.code}</td>
                            <td className="p-2">{it.name}</td>
                            <td className="p-2">€{it.price}</td>
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
                                onClick={() => { setSelectedItem(it); setIsViewItemOpen(true);}}>
                                <Eye />
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500">
                          {itemSearch ? "No items found matching your search." : "No items available."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ITEMS PAGINATION */}
              {totalItemPages > 1 && (
                <div className="flex flex-wrap gap-1 justify-center items-center">
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
                        page === 1 ||
                        page === totalItemPages ||
                        (page >= itemPage - 1 && page <= itemPage + 1)
                    )
                    .map((page, idx, arr) => (
                      <div key={page} className="flex items-center">
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
              )}
            </div>
          )}

          {/* ================= EDIT ITEM MODAL =================
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
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog> */}

          {/* ================= EDIT / VIEW ITEM MODAL ================= */}
          <Dialog open={isEditItemOpen || isViewItemOpen} onOpenChange={(open) => {
            if (!open) {
              setIsEditItemOpen(false);
              setIsViewItemOpen(false);
              setSelectedItem(null);
            }
          }}>
            <DialogContent className="sm:max-w-md">
              {selectedItem && (
                <form
                  className="space-y-2"
                  onSubmit={isViewItemOpen ? (e) => e.preventDefault() : handleEditItem}
                >
                  <Input
                    name="code"
                    defaultValue={selectedItem.code}
                    required
                    readOnly={isViewItemOpen}
                  />
                  <Input
                    name="name"
                    defaultValue={selectedItem.name}
                    required
                    readOnly={isViewItemOpen}
                  />
                  <Textarea
                    name="description"
                    defaultValue={selectedItem.description}
                    readOnly={isViewItemOpen}
                  />
                  <Input
                    name="price"
                    type="number"
                    defaultValue={selectedItem.price}
                    required
                    readOnly={isViewItemOpen}
                  />
                  <Combobox
                    value={selectedItemCategory}
                    onChange={setSelectedItemCategory}
                    readOnly={isViewItemOpen}
                  >
                    <div className="relative">
                      <Combobox.Input
                        className="w-full border px-2 py-1 rounded disabled:bg-gray-100"
                        onChange={(e) => setCategoryQuery(e.target.value)}
                        displayValue={(cat: Category | null) => cat?.name ?? ""}
                        placeholder="Select Category"
                        readOnly={isViewItemOpen}
                      />
                      {!isViewItemOpen && (
                        <Combobox.Options className="absolute z-10 w-full bg-white border rounded mt-1 max-h-48 overflow-y-auto">
                          {categories
                            .filter(c => c.name.toLowerCase().includes(categoryQuery.toLowerCase()))
                            .map(c => (
                              <Combobox.Option key={c.id} value={c} className="px-2 py-1 hover:bg-green-100">
                                {c.name}
                              </Combobox.Option>
                            ))}
                        </Combobox.Options>
                      )}
                    </div>
                  </Combobox>

                  {!isViewItemOpen && (
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save"}
                    </Button>
                  )}
                </form>
              )}
            </DialogContent>
          </Dialog>


          {/* ================= CATEGORIES TAB ================= */}
          {activeTab === "categories" && (
            <div className="space-y-4">

              {/* Header with Search and Create */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-base sm:text-lg font-semibold uppercase">Categories Management</h2>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="pl-8 w-full sm:w-64"
                    />
                  </div>

                  {/* Create Button */}
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
              </div>

              {/* Results Count */}
              {categories.length > 0 && (
                <div className="text-sm text-gray-600">
                  Showing {paginatedCategories.length} of {filteredCategories.length} categories
                  {categorySearch && (
                    <span> for "<strong>{categorySearch}</strong>"</span>
                  )}
                </div>
              )}

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
                    {isCategoriesLoading ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500">
                          Loading categories...
                        </td>
                      </tr>
                    ) : paginatedCategories.length > 0 ? (
                      paginatedCategories.map((cat, idx) => (
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500">
                          {categorySearch ? "No categories found matching your search." : "No categories available."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* CATEGORIES PAGINATION */}
              {totalCategoryPages > 1 && (
                <div className="flex flex-wrap gap-1 justify-center items-center">
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
                        page === 1 ||
                        page === totalCategoryPages ||
                        (page >= categoryPage - 1 && page <= categoryPage + 1)
                    )
                    .map((page, idx, arr) => (
                      <div key={page} className="flex items-center">
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
              )}
            </div>
          )}

          {/* ================= EDIT CATEGORY MODAL ================= */}
          <Dialog open={isEditCategoryOpen || isViewCategoryOpen} onOpenChange={(open) => {
            if (!open) {
              setIsEditCategoryOpen(false);
              setIsViewCategoryOpen(false);
              setSelectedCategory(null);
            }
          }}>
            <DialogContent className="sm:max-w-md">
              {selectedCategory && (
                <form className="space-y-2" onSubmit={handleEditCategory}>
                  <Input name="name" defaultValue={selectedCategory.name} required readOnly={isViewCategoryOpen} />
                  <Textarea name="description" defaultValue={selectedCategory.description} readOnly={isViewCategoryOpen} />
                  <Input type="file" name="imageFile" accept="image/*" readOnly={isViewCategoryOpen} />
                  {selectedCategory.image && (
                    <div className="text-sm text-gray-500" >
                      Current image: <img src={selectedCategory.image} alt="Current" className="w-12 h-12 object-cover mt-1"  />
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
        </>
      )}
    </div>
  )
}