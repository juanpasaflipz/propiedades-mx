'use client';

import { MockProperty } from '@/types/mockProperty';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface PropertyListProps {
  properties: MockProperty[];
  loading: boolean;
}

export default function PropertyList({ properties, loading }: PropertyListProps) {
  const router = useRouter();
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
        <p className="mt-2 text-sm text-gray-500">Try adjusting your search filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <div
          key={property.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          <div className="relative h-48">
            <Image
              src={property.image || '/placeholder-property.svg'}
              alt={property.title}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-property.svg';
              }}
              unoptimized={property.image?.includes('mlstatic.com')}
            />
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {property.title}
              </h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {property.transactionType === 'rent' ? 'For Rent' : 'For Sale'}
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900 mb-2">
              ${property.price.toLocaleString()}
              {property.transactionType === 'rent' && <span className="text-sm font-normal">/month</span>}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              {property.location}, {property.country}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{property.bedrooms} beds</span>
              <span>{property.bathrooms} baths</span>
              <span>{property.type}</span>
            </div>
            <button
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => router.push(`/property/${property.id}`)}
            >
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 