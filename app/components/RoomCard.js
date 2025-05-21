// app/components/RoomCard.js
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function RoomCard({ room, property, onBookNow }) {
  const router = useRouter();
  
  // Helper function to calculate total price
  const calculateTotalPrice = () => {
    if (property.pricing?.type === "perRoom") {
      return room.pricing?.price || 0;
    } else {
      const adultRate = room.pricing?.adultRate || (room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) || 0;
      const childRate = room.pricing?.childRate || Math.floor((room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) / 2) || 0;
      const numAdults = room.numAdults || 1;
      const numChildren = room.numChildren || 0;
      return (numAdults * adultRate) + (numChildren * childRate);
    }
  };
  
  // Get placeholder image if no images
  const roomImage = room.images && room.images.length > 0
    ? (room.images[0].startsWith('/uploads/') ? room.images[0] : `/uploads/rooms/${room.images[0]}`)
    : '/placeholder-room.jpg';

  // Navigate to booking page
  const handleBookNow = () => {
    if (onBookNow) {
      onBookNow();
    } else {
      router.push(`/booking/${property.uniqueUrl}/${room._id}`);
    }
  };
  
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      {/* Room Image */}
      <div className="relative h-48 w-full">
        <Image 
          src={roomImage}
          alt={`${room.category} - Room ${room.roomNumber}`}
          width={400}
          height={300}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Room Details */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{room.category}</h3>
            <p className="text-gray-600 text-sm">Room {room.roomNumber}</p>
          </div>
          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-sm font-medium">
            {room.capacity?.total} {room.capacity?.total === 1 ? 'Person' : 'People'}
          </span>
        </div>
        
        {/* Amenities */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-700">Amenities</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {room.amenities.map((amenity, idx) => (
                <span key={idx} className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Pricing */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          {property.pricing?.type === "perRoom" ? (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Price per night</span>
              <span className="text-lg font-semibold text-gray-800">₹{room.pricing?.price}</span>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total for {room.numAdults || 1} {(room.numAdults || 1) === 1 ? 'adult' : 'adults'}{room.numChildren > 0 ? ` & ${room.numChildren} ${room.numChildren === 1 ? 'child' : 'children'}` : ''}</span>
                <span className="text-lg font-semibold text-gray-800">₹{calculateTotalPrice()}</span>
              </div>
              
              <div className="mt-1 text-xs text-gray-500">
                <div>Adults: ₹{room.pricing?.adultRate || (room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) || 0} per person</div>
                <div>Children: ₹{room.pricing?.childRate || Math.floor((room.pricing?.perPersonPrices && room.pricing.perPersonPrices[1]) / 2) || 0} per child</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Book Now Button */}
        <Link href={`/booking/${property.uniqueUrl}/${room._id}`} passHref legacyBehavior>
          <button
            className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Book Now
          </button>
        </Link>
      </div>
    </div>
  );
}