import { defineState } from "eve/context";
import { emptyTripState, type Itinerary, type FareComparison, type TripState } from "@/lib/trip";

export const tripSession = defineState("travel-gennie.session", () => ({
  trip: emptyTripState() as TripState,
  savedTripId: undefined as string | undefined,
  itinerary: undefined as Itinerary | undefined,
  comparison: undefined as FareComparison | undefined,
}));
