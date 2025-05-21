// app/context/RoomSelectionContext.js
"use client";

import { createContext, useContext, useState } from "react";

const RoomSelectionContext = createContext();

export function RoomSelectionProvider({ children }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);

  return (
    <RoomSelectionContext.Provider value={{
      selectedRoom,
      setSelectedRoom,
      selectedProperty,
      setSelectedProperty
    }}>
      {children}
    </RoomSelectionContext.Provider>
  );
}

// Custom hook to use the room selection context
export function useRoomSelection() {
  const context = useContext(RoomSelectionContext);
  if (context === undefined) {
    throw new Error('useRoomSelection must be used within a RoomSelectionProvider');
  }
  return context;
}