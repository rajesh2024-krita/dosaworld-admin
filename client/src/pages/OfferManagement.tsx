// export default OfferMaganement;

import React, { useState, useEffect } from 'react';
import OfferSectionList from '../components/OfferSectionList';
import OfferSection from '../components/OfferSection';
import { OfferSection as OfferSectionType } from '../Types/OfferSection';
import { offerSectionService } from '../Services/offerSectionService';
import Loader from "@/components/Loader"; // ✅ Import Loader

function OfferMaganement() {
  const [currentView, setCurrentView] = useState<'manage' | 'display'>('manage');
  const [activeSection, setActiveSection] = useState<OfferSectionType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveSection();
  }, []);

  const loadActiveSection = async () => {
    try {
      setLoading(true); // ✅ show loader
      const response = await offerSectionService.getActive();
      setActiveSection(response.data);
    } catch (error) {
      console.error('Error loading active offer section:', error);
    } finally {
      setLoading(false); // ✅ hide loader
    }
  };

  // ✅ Conditional loader render
  if (loading) return <Loader />;

  return (
    <div className="App">
      <main>
        {currentView === 'manage' ? (
          <OfferSectionList />
        ) : activeSection ? (
          <OfferSection section={activeSection} />
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">😔</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No active offer section found
            </h3>
            <p className="text-gray-500 mb-6">
              Create an offer section and mark it as active to display it here.
            </p>
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
