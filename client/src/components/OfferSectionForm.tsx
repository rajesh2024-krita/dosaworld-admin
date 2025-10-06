import React, { useState, useEffect } from 'react';
import { OfferSection } from '../Types/OfferSection';
import { offerSectionService } from '../Services/offerSectionService';

interface OfferSectionFormProps {
    section?: OfferSection;
    onSave: () => void;
    onCancel: () => void;
}

const OfferSectionForm: React.FC<OfferSectionFormProps> = ({ section, onSave, onCancel }) => {
    const [formData, setFormData] = useState<any>({
        title: '',
        subtitle: '',
        description: '',
        buckets: [{ name: '', people: '', price: '' }],
        backgroundImage: null,
        biryaniImage: null,
        isActive: true
    });
    const [loading, setLoading] = useState(false);
    const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
    const [biryaniPreview, setBiryaniPreview] = useState<string | null>(null);

    useEffect(() => {
        if (section) {
            setFormData({
                title: section.title,
                subtitle: section.subtitle,
                description: section.description,
                buckets: Array.isArray(section.buckets)
                    ? section.buckets
                    : Object.values(section.buckets),
                backgroundImage: null,
                biryaniImage: null,
                isActive: section.isActive
            });
            setBackgroundPreview(section.backgroundImage || null);
            setBiryaniPreview(section.biryaniImage || null);
        }
    }, [section]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        if (e.target.files && e.target.files[0]) {
            setFormData((prev: any) => ({ ...prev, [field]: e.target.files![0] }));
            const reader = new FileReader();
            reader.onload = () => {
                if (field === 'backgroundImage') setBackgroundPreview(reader.result as string);
                if (field === 'biryaniImage') setBiryaniPreview(reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleBucketChange = (index: number, field: string, value: string) => {
        const newBuckets = [...formData.buckets];
        newBuckets[index][field] = value;
        setFormData((prev: any) => ({ ...prev, buckets: newBuckets }));
    };

    const addBucket = () => {
        setFormData((prev: any) => ({
            ...prev,
            buckets: [...prev.buckets, { name: '', people: '', price: '' }]
        }));
    };

    const removeBucket = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            buckets: prev.buckets.filter((_: any, i: number) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('subtitle', formData.subtitle);
            data.append('description', formData.description);
            data.append('isActive', String(formData.isActive));

            if (formData.backgroundImage instanceof File) {
                data.append('backgroundImage', formData.backgroundImage);
            }
            if (formData.biryaniImage instanceof File) {
                data.append('biryaniImage', formData.biryaniImage);
            }

            data.append('buckets', JSON.stringify(formData.buckets));

            if (section?._id) {
                await offerSectionService.update(section._id, data); // pass FormData
            } else {
                await offerSectionService.create(data); // pass FormData
            }


            onSave();
        } catch (err) {
            console.error('Error saving offer section:', err);
            alert('Error saving offer section');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{section ? 'Edit Offer Section' : 'Create Offer Section'}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block mb-2 text-gray-700">Title *</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="w-full p-3 border rounded-lg"
                    />
                </div>
                <div>
                    <label className="block mb-2 text-gray-700">Subtitle *</label>
                    <input
                        type="text"
                        name="subtitle"
                        value={formData.subtitle}
                        onChange={handleChange}
                        required
                        className="w-full p-3 border rounded-lg"
                    />
                </div>
            </div>

            <div className="mb-6">
                <label className="block mb-2 text-gray-700">Description *</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    required
                    className="w-full p-3 border rounded-lg"
                />
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Offer Items</h3>
                {formData.buckets.map((bucket: any, index: number) => (
                    <div key={index} className="mb-4 p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">Item {index + 1}</span>
                            {formData.buckets.length > 1 && (
                                <button type="button" onClick={() => removeBucket(index)} className="text-red-500 hover:underline">
                                    Remove
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input placeholder="Name" value={bucket.name} onChange={(e) => handleBucketChange(index, 'name', e.target.value)} className="p-3 border rounded-lg" required />
                            <input placeholder="People" value={bucket.people} onChange={(e) => handleBucketChange(index, 'people', e.target.value)} className="p-3 border rounded-lg" required />
                            <input placeholder="Price" value={bucket.price} onChange={(e) => handleBucketChange(index, 'price', e.target.value)} className="p-3 border rounded-lg" required />
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addBucket} className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    + Add Bucket
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block mb-2 text-gray-700">Background Image</label>
                    <input type="file" onChange={(e) => handleFileChange(e, 'backgroundImage')} />
                    {backgroundPreview && <img src={backgroundPreview} alt="preview" className="mt-2 w-32 rounded" />}
                </div>
                <div>
                    <label className="block mb-2 text-gray-700">Biryani Image</label>
                    <input type="file" onChange={(e) => handleFileChange(e, 'biryaniImage')} />
                    {biryaniPreview && <img src={biryaniPreview} alt="preview" className="mt-2 w-32 rounded" />}
                </div>
            </div>

            <div className="flex items-center mb-6">
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData((prev: any) => ({ ...prev, isActive: e.target.checked }))} className="mr-2" />
                <label>Active Offer Section</label>
            </div>

            <div className="flex gap-3 justify-end">
                <button type="button" onClick={onCancel} className="px-6 py-3 border rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-lg">{loading ? 'Saving...' : (section ? 'Update Offer Section' : 'Create Offer Section')}</button>
            </div>
        </form>
    );
};

export default OfferSectionForm;
