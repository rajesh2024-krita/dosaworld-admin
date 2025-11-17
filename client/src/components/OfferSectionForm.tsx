import React, { useState, useEffect } from 'react';
import { OfferSection } from '../Types/OfferSection';
import { offerSectionService } from '../Services/offerSectionService';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

const MySwal = withReactContent(Swal);

interface OfferSectionFormProps {
  section?: OfferSection;
  onSave: () => void;
  onCancel: () => void;
}

const OfferSectionForm: React.FC<OfferSectionFormProps> = ({
  section,
  onSave,
  onCancel,
}) => {
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

  // ✅ Preload data for edit mode
  useEffect(() => {
    if (section) {
      setFormData({
        title: section.title || '',
        subtitle: section.subtitle || '',
        description: section.description || '',
        buckets: Array.isArray(section.buckets)
          ? section.buckets
          : Object.values(section.buckets || []),
        biryaniImage: null,
        isActive: section.isActive,
      });

      const IMAGE_BASE_URL = 'https://dosaworld.de';
      if (section.biryaniImage) {
        const biryaniUrl = section.biryaniImage.startsWith('http')
          ? section.biryaniImage
          : `${IMAGE_BASE_URL}/uploads/categories${section.biryaniImage}`;
        setBiryaniPreview(biryaniUrl);
      } else {
        setBiryaniPreview(null);                 
      }
    }
  }, [section]);

  // ✅ File selection
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev: any) => ({ ...prev, [field]: e.target.files![0] }));
      const reader = new FileReader();
      reader.onload = () => {
        if (field === 'biryaniImage')
          setBiryaniPreview(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // ✅ Input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // ✅ Bucket handlers
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

  // ✅ Debug FormData contents
//   const debugFormData = (formData: FormData) => {
//     console.log('=== FormData Contents ===');
//     for (let [key, value] of formData.entries()) {
//       console.log(`${key}:`, value);
//     }
//     console.log('=== End FormData ===');
//   };
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const data = new FormData();

    // ✅ Append basic fields
    data.append('title', formData.title?.trim() || '');
    data.append('subtitle', formData.subtitle?.trim() || '');
    data.append('description', formData.description?.trim() || '');
    data.append('isActive', String(!!formData.isActive));

    // console.log('data == ', data)

    // ✅ Handle buckets as individual fields (most common backend expectation)
    if (Array.isArray(formData.buckets)) {
      const validBuckets = formData.buckets.filter(
        (b: any) => b.name && b.people && b.price
      );
      
      validBuckets.forEach((bucket: any, index: number) => {
        data.append(`buckets[${index}][name]`, bucket.name);
        data.append(`buckets[${index}][people]`, bucket.people);
        data.append(`buckets[${index}][price]`, bucket.price);
      });
    }

    // ✅ Handle image - use the field name your backend expects
    if (formData.biryaniImage instanceof File) {
      data.append('biryaniImage', formData.biryaniImage);
    } else if (section?.biryaniImage && !formData.biryaniImage) {
      data.append('existingImage', section.biryaniImage);
    }

    // ✅ Debug FormData content
    // console.log('--- FormData Contents ---');
    // for (let [key, value] of data.entries()) {
    //   console.log(`${key}:`, value);
    // }
    // console.log('-------------------------');

    // ✅ Send to backend
    if (section?._id) {
      await offerSectionService.update(section._id, data);
    } else {
      await offerSectionService.create(data);
    }

    MySwal.fire({
      icon: 'success',
      title: section ? 'Updated!' : 'Created!',
      text: `Offer section ${section ? 'updated' : 'created'} successfully.`,
    });

    onSave();
  } catch (err: any) {
    // console.error('Error saving offer section:', err);
    const errorMessage =
      err.response?.data?.message ||
      err.message ||
      'Failed to save offer section. Please check your input.';

    MySwal.fire({
      icon: 'error',
      title: 'Error!',
      text: errorMessage,
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <form
      onSubmit={handleSubmit}
      className='bg-white p-6 border max-w-4xl mx-auto rounded-xl'
    >
      <div className='text-md font-bold mb-6'>
        {section ? 'Edit Offer Section' : 'Create Offer Section'}
      </div>

      {/* Title & Subtitle */}
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

      {/* Description */}
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

      {/* Buckets */}
      <div className='mb-6'>
        <h3 className='text-lg font-semibold mb-3 text-gray-800'>
          Offer Items *
        </h3>
        {formData.buckets.map((bucket: any, index: number) => (
          <div
            key={index}
            className='mb-4 p-4 border rounded-lg bg-gray-50 shadow-sm'
          >
            <div className='flex justify-between items-center mb-2'>
              <span className='font-semibold'>Item {index + 1}</span>
              {formData.buckets.length > 1 && (
                <button
                  type='button'
                  onClick={() => removeBucket(index)}
                  className='text-red-500 hover:underline'
                >
                  Remove
                </button>
              )}
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Input
                placeholder='Name *'
                value={bucket.name}
                onChange={(e) =>
                  handleBucketChange(index, 'name', e.target.value)
                }
                required
                className='p-3 border rounded-lg'
              />
              <Input
                placeholder='People *'
                value={bucket.people}
                onChange={(e) =>
                  handleBucketChange(index, 'people', e.target.value)
                }
                required
                className='p-3 border rounded-lg'
              />
              <Input
                placeholder='Price *'
                value={bucket.price}
                onChange={(e) =>
                  handleBucketChange(index, 'price', e.target.value)
                }
                required
                className='p-3 border rounded-lg'
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

      {/* Image Upload */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
        <div>
          <Label className='block mb-2 text-gray-700'>Item Image</Label>
          <Input
            type='file'
            accept='image/*'
            onChange={(e) => handleFileChange(e, 'biryaniImage')}
          />
          {biryaniPreview && (
            <img
              src={biryaniPreview}
              alt='preview'
              className='mt-2 w-32 rounded shadow-sm'
            />
          )}
        </div>
      </div>

      {/* Active toggle */}
      <div className='flex items-center mb-6'>
        <input
          type='checkbox'
          checked={formData.isActive}
          onChange={(e) =>
            setFormData((prev: any) => ({
              ...prev,
              isActive: e.target.checked,
            }))
          }
          className='mr-2'
        />
        <Label>Active Offer Section</Label>
      </div>

      {/* Buttons */}
      <div className='flex gap-3 justify-end'>
        <Button
          type='button'
          onClick={onCancel}
          className='px-6 py-3 bg-slate-300 border rounded-lg'
        >
          Cancel
        </Button>
        <Button
          type='submit'
          disabled={loading}
          className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
        >
          {loading
            ? 'Saving...'
            : section
            ? 'Update Offer Section'
            : 'Create Offer Section'}
        </Button>
      </div>
    </form>
  );
};

export default OfferSectionForm;