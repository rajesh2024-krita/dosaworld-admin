import React from 'react';
import { useTranslation } from "react-i18next";
import { OfferSection as OfferSectionType } from '../Types/OfferSection';

interface OfferSectionProps {
  section: OfferSectionType;
}

const OfferSection: React.FC<OfferSectionProps> = ({ section }) => {
  const { t } = useTranslation();

  return (
    <section 
      className="bg-cover bg-center w-full min-h-96" 
      style={{ backgroundImage: `url(${section.backgroundImage})` }}
    >
      <div className="bg-black bg-opacity-50 w-full h-full">
        <div className="text-white p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-[#FF8800]">
                {section.title}
              </h2>
              <p className="text-lg mb-2">{section.subtitle}</p>
              <p className="text-sm mb-6 text-orange-100">{section.description}</p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white bg-opacity-10 p-4 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-xl">{section.buckets.S.name}</h3>
                    <p className="text-orange-100">{section.buckets.S.people}</p>
                  </div>
                  <span className="text-2xl font-bold text-[#FF8800]">{section.buckets.S.price}</span>
                </div>
                
                <div className="flex justify-between items-center bg-white bg-opacity-10 p-4 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-xl">{section.buckets.M.name}</h3>
                    <p className="text-orange-100">{section.buckets.M.people}</p>
                  </div>
                  <span className="text-2xl font-bold text-[#FF8800]">{section.buckets.M.price}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <img 
                src={section.biryaniImage} 
                alt={section.title} 
                className="w-64 h-64 object-cover rounded-lg shadow-2xl border-4 border-white"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfferSection;