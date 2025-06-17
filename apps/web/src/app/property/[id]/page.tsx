'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MockProperty } from '@/types/mockProperty';
import { PropertyListing, SearchResponse } from '@/types/api';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<MockProperty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        // Fetch property details directly from the backend API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
        const response = await fetch(`${apiUrl}/api/properties/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Property not found');
        }
        
        const data = await response.json();
        
        // The backend returns a single property object
        if (data) {
          const mappedProperty: MockProperty = {
            id: parseInt(data.id) || 1,
            title: data.title,
            price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            type: data.property_type || data.propertyType,
            location: data.city || data.location,
            country: data.country || 'Mexico',
            transactionType: data.transaction_type || data.transactionType || 'sale',
            image: data.image_url || data.imageUrl || '/placeholder-property.svg',
          };
          setProperty(mappedProperty);
        }
      } catch (error) {
        console.error('Error fetching property details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPropertyDetails();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Property not found</h1>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
          >
            ← Back to Search
          </button>
        </div>

        {/* Property Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Image Gallery */}
          <div className="relative h-96 bg-gray-200 dark:bg-gray-700">
            <Image
              src={property.image}
              alt={property.title}
              fill
              className="object-cover"
              unoptimized={property.image?.includes('mlstatic.com')}
            />
          </div>

          {/* Property Info */}
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {property.title}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  {property.location}, {property.country}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  ${property.price.toLocaleString()}
                  {property.transactionType === 'rent' && (
                    <span className="text-lg font-normal">/month</span>
                  )}
                </p>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium px-3 py-1 rounded inline-block mt-2">
                  {property.transactionType === 'rent' ? 'For Rent' : 'For Sale'}
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {property.bedrooms}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Bedrooms</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {property.bathrooms}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Bathrooms</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                  {property.type}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Property Type</div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Description
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                This beautiful {property.type} features {property.bedrooms} bedrooms and{' '}
                {property.bathrooms} bathrooms. Located in the heart of {property.location},{' '}
                this property offers modern amenities and convenient access to local attractions.
                Perfect for those looking for a comfortable home in {property.country}.
              </p>
            </div>

            {/* Contact Section */}
            <div className="border-t pt-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Interested in this property?
              </h2>
              <div className="flex gap-4">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Contact Agent
                </button>
                <button className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  Schedule Viewing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}