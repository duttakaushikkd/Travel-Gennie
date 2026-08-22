import type { OtaPlatform, TripState } from "./trip";

type DeepLink = {
  platform: OtaPlatform;
  label: string;
  url: string;
};

function formatDmy(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function compactDate(isoDate: string): string {
  return isoDate.replaceAll("-", "");
}

export function buildOtaDeepLinks(trip: TripState): DeepLink[] {
  const origin = trip.originIata;
  const destination = trip.destinationIata;
  const date = trip.startDate;
  if (!origin || !destination || !date) {
    return [];
  }

  const adults = trip.adults ?? 1;
  const children = trip.children ?? 0;
  const infants = trip.infants ?? 0;
  const dmy = formatDmy(date);
  const ymd = compactDate(date);

  return [
    {
      platform: "makemytrip",
      label: "MakeMyTrip",
      url: `https://www.makemytrip.com/flight/search?itinerary=${origin}-${destination}-${dmy}&tripType=O&paxType=A-${adults}_C-${children}_I-${infants}&cabinClass=E&intl=false`,
    },
    {
      platform: "goibibo",
      label: "Goibibo",
      url: `https://www.goibibo.com/flights/air-${origin}-${destination}-${ymd}--${adults}-${children}-${infants}-E-D/`,
    },
    {
      platform: "easemytrip",
      label: "EaseMyTrip",
      url: `https://flight.easemytrip.com/FlightList/Index?frm=${origin}&to=${destination}&dep=${dmy}&adults=${adults}&child=${children}&infant=${infants}&cabin=0`,
    },
  ];
}

export const PRICE_DISCLAIMER =
  "Quoted fares are snapshots and can change before you pay. Travel Gennie does not book tickets. Opening a platform sends you to a third-party site to complete purchase. We may earn an affiliate commission.";
