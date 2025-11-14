import React, { useState, useEffect } from 'react';
import { OfferSection as OfferSectionType } from '../Types/OfferSection';
import { offerSectionService } from '../Services/offerSectionService';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Trash2 } from 'lucide-react';
import Loader from "@/components/Loader";

const MySwal = withReactContent(Swal);

// ✅ Offer Section Form Component
const OfferSectionForm: React.FC<{
  section?: OfferSectionType;
  onSave: () => void;
  onCancel: () => void;
}> = ({ section, onSave, onCancel }) => {
  const [formData, setFormData] = useState<any>({
    title: '',
    subtitle: '',
    description: '',
    buckets: [{ name: '', people: '', price: '' }],
    biryaniImage: null,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [biryaniPreview, setBiryaniPreview] = useState<string | null>(null);

  useEffect(() => {
    if (section) {
      setFormData({
        title: section.title || '',
        subtitle: section.subtitle || '',
        description: section.description || '',
        // buckets: Array.isArray(section.buckets)
        //   ? section.buckets
        //   : Object.values(section.buckets || []),
        buckets: Array.isArray(section.buckets)
          ? section.buckets.map((b: any) => ({ ...b, isExisting: true })) // ✅ mark as existing
          : Object.values(section.buckets || []).map((b: any) => ({ ...b, isExisting: true })),
        biryaniImage: null,
        isActive: section.isActive,
      });

      console.log('section == ', section)

      const IMAGE_BASE_URL = 'https://dosaworld.de/';
      if (section.biryaniImage) {
        // Remove the server path prefix
        const cleanedPath = section.biryaniImage.replace("/var/www/dosaworld-frontend/dist/", "");

        const biryaniUrl = cleanedPath.startsWith("http")
          ? cleanedPath
          : `${IMAGE_BASE_URL}${cleanedPath}`;

        setBiryaniPreview(biryaniUrl);
      } else {
        setBiryaniPreview(null);
      }

    }
  }, [section]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev: any) => ({ ...prev, [field]: e.target.files![0] }));
      const reader = new FileReader();
      reader.onload = () => {
        if (field === 'biryaniImage') setBiryaniPreview(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleBucketChange = (index: number, field: string, value: string) => {
    const newBuckets = [...formData.buckets];
    newBuckets[index][field] = value;
    setFormData((prev: any) => ({ ...prev, buckets: newBuckets }));
  };

  const addBucket = () => {
    setFormData((prev: any) => ({
      ...prev,
      buckets: [...prev.buckets, { name: '', people: '', price: '' }],
    }));
  };

  const removeBucket = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      buckets: prev.buckets.filter((_: any, i: number) => i !== index),
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("🟢 formData before sending:", formData);

      const data = new FormData();

      // ✅ Append only changed or non-empty values
      if (!section || formData.title !== section.title)
        data.append("title", formData.title.trim());
      if (!section || formData.subtitle !== section.subtitle)
        data.append("subtitle", formData.subtitle.trim());
      if (!section || formData.description !== section.description)
        data.append("description", formData.description.trim());
      if (!section || formData.isActive !== section.isActive)
        data.append("isActive", formData.isActive ? "true" : "false");

      // ✅ Buckets: only append if changed
      if (
        !section ||
        JSON.stringify(formData.buckets) !== JSON.stringify(section.buckets)
      ) {
        data.append("buckets", JSON.stringify(formData.buckets));
      }

      // ✅ File handling (only if new image selected)
      if (formData.biryaniImage instanceof File) {
        data.append("biryaniImage", formData.biryaniImage);
      }

      // ✅ Debug FormData
      console.log("🧾 Final FormData before send:");
      for (let [key, value] of data.entries()) {
        console.log(`FormData → ${key}:`, value);
      }

      // ✅ Skip API call if no change
      if (data.entries().next().done) {
        MySwal.fire({
          icon: "info",
          title: "No changes detected",
          text: "Nothing to update.",
        });
        setLoading(false);
        return;
      }

      // ✅ API call
      const response = section?._id
        ? await offerSectionService.update(section._id, data)
        : await offerSectionService.create(data);

      MySwal.fire({
        icon: "success",
        title: section ? "Updated!" : "Created!",
        text: "Offer section saved successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      onSave();
    } catch (err: any) {
      console.error("❌ Error saving offer section:", err);
      const msg = err.response?.data?.message || err.message || "Save failed";
      MySwal.fire({ icon: "error", title: "Error!", text: msg });
    } finally {
      setLoading(false);
    }
  };



  return (
    <form onSubmit={handleSubmit} className='bg-white p-6 border max-w-4xl mx-auto rounded-xl'>
      <div className='text-md font-bold mb-6'>
        {section ? 'Edit Offer Section' : 'Create Offer Section'}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
        <div>
          <Label className='block mb-2 text-gray-700'>Title *</Label>
          <Input
            type='text'
            name='title'
            value={formData.title}
            onChange={handleChange}
            required
            className='w-full p-3 border rounded-lg'
          />
        </div>
        <div>
          <Label className='block mb-2 text-gray-700'>Subtitle *</Label>
          <Input
            type='text'
            name='subtitle'
            value={formData.subtitle}
            onChange={handleChange}
            required
            className='w-full p-3 border rounded-lg'
          />
        </div>
      </div>

      <div className='mb-6'>
        <Label className='block mb-2 text-gray-700'>Description *</Label>
        <Textarea
          name='description'
          value={formData.description}
          onChange={handleChange}
          rows={3}
          required
          className='w-full p-3 border rounded-lg'
        />
      </div>
      <div className='mb-6'>
        <h3 className='text-lg font-semibold mb-3 text-gray-800'>Offer Items *</h3>

        {formData.buckets.map((bucket: any, index: number) => (
          <div key={index} className='mb-4 p-4 border rounded-lg bg-gray-50 shadow-sm'>
            <div className='flex justify-between items-center mb-2'>
              <span className='font-semibold'>Item {index + 1}</span>
              <button
                type='button'
                onClick={() => removeBucket(index)}
                className='text-red-500 hover:underline'
              >
                Remove
              </button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Input
                placeholder='Name *'
                value={bucket.name}
                onChange={(e) => handleBucketChange(index, 'name', e.target.value)}
                required
                disabled={bucket.isExisting} // ✅ disable if existing
                className={`p-3 border rounded-lg ${bucket.isExisting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              <Input
                placeholder='People *'
                value={bucket.people}
                onChange={(e) => handleBucketChange(index, 'people', e.target.value)}
                required
                disabled={bucket.isExisting} // ✅ disable if existing
                className={`p-3 border rounded-lg ${bucket.isExisting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              <Input
                placeholder='Price *'
                value={bucket.price}
                onChange={(e) => handleBucketChange(index, 'price', e.target.value)}
                required
                disabled={bucket.isExisting} // ✅ disable if existing
                className={`p-3 border rounded-lg ${bucket.isExisting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
        ))}

        <Button
          type='button'
          onClick={addBucket}
          className='mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
        >
          + Add Bucket
        </Button>
      </div>



      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
        <div>
          <Label className='block mb-2 text-gray-700'>Item Image</Label>
          <Input
            type='file'
            accept='image/*'
            onChange={(e) => handleFileChange(e, 'biryaniImage')}
          />
          {biryaniPreview && (
            <img src={biryaniPreview} alt='preview' className='mt-2 w-32 rounded shadow-sm' />
          )}
        </div>
      </div>

      <div className='flex items-center mb-6'>
        <input
          type='checkbox'
          checked={formData.isActive}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, isActive: e.target.checked }))}
          className='mr-2'
        />
        <Label>Active Offer Section</Label>
      </div>

      <div className='flex gap-3 justify-end'>
        <Button
          type='button'
          onClick={onCancel}
          className='bg-slate-300 border'
        >
          Cancel
        </Button>
        <Button
          type='submit'
          disabled={loading}
          className=''
        >
          {loading ? 'Saving...' : section ? 'Update Offer Section' : 'Create Offer Section'}
        </Button>
      </div>
    </form>
  );
};


// ✅ Main Offer Management Component
const OfferManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<'manage' | 'display'>('manage');
  const [sections, setSections] = useState<OfferSectionType[]>([]);
  const [activeSection, setActiveSection] = useState<OfferSectionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState<OfferSectionType | undefined>();

  useEffect(() => {
    loadSections();
    loadActiveSection();
  }, []);

  const loadSections = async () => {
    try {
      const response = await offerSectionService.getAll();
      setSections(response.data || []);
    } catch (error) {
      console.error('Error loading offer sections:', error);
      alert('Error loading offer sections');
    }
  };

  const loadActiveSection = async () => {
    try {
      const response = await offerSectionService.getActive();
      setActiveSection(response.data);
    } catch (error) {
      console.error('Error loading active offer section:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      // cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await offerSectionService.delete(id);
        MySwal.fire('Deleted!', 'Offer section has been deleted.', 'success');
        loadSections();
        loadActiveSection(); // Refresh active section in case it was deleted
      } catch (error) {
        console.error('Error deleting offer section:', error);
        MySwal.fire('Error!', 'Error deleting offer section', 'error');
      }
    }
  };

  const handleEdit = (section: OfferSectionType) => {
    setEditingSection(section);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSection(undefined);
  };

  const handleFormSave = () => {
    loadSections();
    loadActiveSection(); // Refresh active section
    handleFormClose();
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="App">
      <main>
        {currentView === 'manage' ? (
          <div className="">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight uppercase">Offer Sections</h2>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  + Create New Offer Section
                </Button>
              </div>
            </div>

            {showForm && (
              <div className="mb-8">
                <OfferSectionForm
                  section={editingSection}
                  onSave={handleFormSave}
                  onCancel={handleFormClose}
                />
              </div>
            )}

            <div className="grid gap-6">
              {sections.map((section) => (
                <div key={section._id} className="border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                      <p className="text-gray-600 mt-1 text-xs">{section.subtitle}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(section)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(section._id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 text-sm">{section.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    {['S', 'M'].map((size) => {
                      const bucket = section.buckets?.[size];
                      if (!bucket) return null;

                      const bgColor = size === 'S' ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200';
                      const textColor = size === 'S' ? ['text-orange-800', 'text-orange-600', 'text-orange-700'] : ['text-red-800', 'text-red-600', 'text-red-700'];

                      return (
                        <div key={size} className={`p-4 rounded-lg border ${bgColor}`}>
                          <h4 className={`font-semibold text-lg ${textColor[0]}`}>{bucket.name}</h4>
                          <p className={`${textColor[1]} text-sm mt-1`}>{bucket.people}</p>
                          <p className={`${textColor[2]} text-2xl font-bold mt-2`}>{bucket.price}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-500 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4 mb-2 sm:mb-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${section.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {section.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {section.backgroundImage && (
                        <span className="text-blue-600">Has Background Image</span>
                      )}
                      {section.biryaniImage && (
                        <span className="text-purple-600">Has Item Image</span>
                      )}
                    </div>
                    <span>Created: {new Date(section.createdAt!).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {sections.length === 0 && !showForm && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No offer sections found</h3>
                <p className="text-gray-500 mb-6">Create your first offer section to showcase your restaurant deals!</p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Create Your First Offer Section
                </Button>
              </div>
            )}
          </div>
        ) : activeSection ? (
          <div>
            <div className="mb-4">
              <Button
                onClick={() => setCurrentView('manage')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                ← Back to Management
              </Button>
            </div>
            <OfferSectionDisplay section={activeSection} />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">😔</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No active offer section found</h3>
            <p className="text-gray-500 mb-6">Create an offer section and mark it as active to display it here.</p>
            <Button
              onClick={() => setCurrentView('manage')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Management
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default OfferManagement;