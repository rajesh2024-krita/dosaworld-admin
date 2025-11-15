import React, { useState, useEffect } from 'react';
import { OfferSection } from '../Types/OfferSection';
import { offerSectionService } from '../Services/offerSectionService';
import OfferSectionForm from './OfferSectionForm';
import { Button } from './ui/button';
import { Edit, Trash2 } from 'lucide-react';

const OfferSectionList: React.FC = () => {
  const [sections, setSections] = useState<OfferSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState<OfferSection | undefined>();

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const response = await offerSectionService.getAll();
      setSections(response.data || []);
    } catch (error) {
      // console.error('Error loading offer sections:', error);
      alert('Error loading offer sections');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this offer section?')) {
      try {
        await offerSectionService.delete(id);
        loadSections();
      } catch (error) {
        // console.error('Error deleting offer section:', error);
        alert('Error deleting offer section');
      }
    }
  };

  const handleEdit = (section: OfferSection) => {
    setEditingSection(section);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSection(undefined);
  };

  const handleFormSave = () => {
    loadSections();
    handleFormClose();
  };

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center min-h-64">
  //       <div className="text-lg text-gray-600">Loading offer sections...</div>
  //     </div>
  //   );
  // }

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight uppercase">Offer Sections</h2>
          {/* <p className="text-gray-600 mt-2">Manage your restaurant offer sections and bucket deals</p> */}
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          + Create New Offer Section
        </Button>
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
  );
};

export default OfferSectionList;
