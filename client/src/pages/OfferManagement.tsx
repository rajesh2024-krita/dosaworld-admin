import React, { useState, useEffect } from 'react';
import OfferSectionList from '../components/OfferSectionList';
import OfferSection from '../components/OfferSection';
import { OfferSection as OfferSectionType } from '../Types/OfferSection';
import { offerSectionService } from '../Services/offerSectionService';

function OfferMaganement() {
  const [currentView, setCurrentView] = useState<'manage' | 'display'>('manage');
  const [activeSection, setActiveSection] = useState<OfferSectionType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveSection();
  }, []);

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

  return (
    <div className="App">
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Biryani Restaurant - Offer Sections</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentView('manage')}
              className={`px-4 py-2 rounded ${
                currentView === 'manage' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Manage Offer Sections
            </button>
            <button
              onClick={() => setCurrentView('display')}
              className={`px-4 py-2 rounded ${
                currentView === 'display' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              View Active Offer
            </button>
          </div>
        </div>
      </nav>

      <main>
        {currentView === 'manage' ? (
          <OfferSectionList />
        ) : loading ? (
          <div className="flex justify-center items-center min-h-64">
            <div className="text-lg text-gray-600">Loading active offer section...</div>
          </div>
        ) : activeSection ? (
          <OfferSection section={activeSection} />
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">😔</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No active offer section found</h3>
            <p className="text-gray-500 mb-6">Create an offer section and mark it as active to display it here.</p>
            <button
              onClick={() => setCurrentView('manage')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Management
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default OfferMaganement;