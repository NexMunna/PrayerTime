import { create } from "zustand";
import {
  Country as AppCountry,
  City as AppCity,
  LocationState,
  LocationType,
} from "../types/types";
import { Country, City, State, ICity } from "country-state-city";

const LOCATION_TYPE_KEY = "selectedLocationType";

export const useLocationStore = create<LocationState>((set, get) => ({
  locationType: "select",
  countries: [],
  cities: [],
  selectedCountry: null,
  selectedCity: null,
  isLoadingCountries: false,
  isLoadingCities: false,

  fetchCountries: async () => {
    set({ isLoadingCountries: true });

    try {
      // Get countries from the country-state-city package
      const allCountries = Country.getAllCountries();

      const countries = allCountries
        .map((country) => ({
          name: country.name,
          code: country.isoCode,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      set({
        countries,
        isLoadingCountries: false,
        selectedCountry: countries.length > 0 ? countries[0] : null,
      });

      // If we have a selected country, fetch its cities
      if (countries.length > 0) {
        get().fetchCities(countries[0].name);
      }
    } catch (error) {
      console.error("Error loading countries:", error);
      set({ isLoadingCountries: false });
    }
  },

  fetchCities: async (countryName: string) => {
    set({ isLoadingCities: true });

    try {
      const storedCountryJson = localStorage.getItem("selectedCountry");
      let countryCode;

      if (storedCountryJson) {
        try {
          const storedCountry = JSON.parse(storedCountryJson);
          countryCode = storedCountry.code;
          if (get().selectedCountry?.code !== storedCountry.code) {
            set({ selectedCountry: storedCountry });
            countryName = storedCountry.name;
          }
        } catch (e) {
          console.error("Error parsing stored country:", e);
        }
      }

      if (!countryCode) {
        countryCode = get().selectedCountry?.code;
      }

      if (!countryCode) {
        throw new Error("No country code available");
      }

      const states = State.getStatesOfCountry(countryCode);
      let citiesList: ICity[] = [];

      for (const state of states) {
        const stateCities = City.getCitiesOfState(countryCode, state.isoCode);
        citiesList = [...citiesList, ...stateCities];
      }

      if (citiesList.length === 0) {
        const fallbackCities = getFallbackCities(countryName, countryCode);
        set({
          cities: fallbackCities as unknown as AppCity[],
          isLoadingCities: false,
        });
        return;
      }

      // Map cities and preserve latitude/longitude if provided by the library
      const cities = citiesList.map((city) => ({
        name: city.name,
        country: countryName,
        code: city.countryCode ?? countryCode,
        latitude: city.latitude ?? undefined,
        longitude: city.longitude ?? undefined,
        // keep other properties as needed by your app
      })) as AppCity[];

      set({
        cities,
        isLoadingCities: false,
      });
    } catch (error) {
      console.error("Error loading cities:", error);
      const countryCode = get().selectedCountry?.code || "";
      const fallbackCities = getFallbackCities(countryName, countryCode);

      set({
        cities: fallbackCities as unknown as AppCity[],
        isLoadingCities: false,
      });
    }
  },

  setLocationType: (type) => {
    set({ locationType: type });

    // set location type in local storage
    try {
      localStorage.setItem(LOCATION_TYPE_KEY, type);
    } catch (e) {
      console.error("Unable to persist location type:", e);
    }
  },

  getLocationType: () => {
    const storedType = typeof window !== "undefined" ? localStorage.getItem(LOCATION_TYPE_KEY) : null;
    if (storedType) {
      set({ locationType: storedType as LocationType });
    }
  },

  setSelectedCountry: (country) => {
    set({ selectedCountry: country, selectedCity: null });
    get().fetchCities(country.name);
    localStorage.setItem("selectedCountry", JSON.stringify(country));
  },

  setSelectedCity: (city) => {
    set({ selectedCity: city });
    localStorage.setItem("selectedCity", JSON.stringify(city));
  },

  // Load selected country and city from local storage
  loadSelectedLocation: () => {
    const storedCountry = localStorage.getItem("selectedCountry");
    const storedCity = localStorage.getItem("selectedCity");

    if (storedCountry) {
      try {
        const country: AppCountry = JSON.parse(storedCountry);
        set({ selectedCountry: country });

        // Fetch cities for this country
        get().fetchCities(country.name);
      } catch (e) {
        console.error("Error parsing stored country:", e);
      }
    }

    if (storedCity) {
      try {
        const city = JSON.parse(storedCity);
        set({ selectedCity: city });
      } catch (e) {
        console.error("Error parsing stored city:", e);
      }
    }
  },

  clearSelectedLocation: () => {
    set({ selectedCountry: null, selectedCity: null });
    localStorage.removeItem("selectedCountry");
    localStorage.removeItem("selectedCity");
  },

  // expose selectedCountry and selectedCity (already present) and keep them in sync
  // Add helper to compute API params from selected values (not stored, computed on read)
  getApiParams: () => {
    const s = get();
    const selectedCity = s.selectedCity;
    const selectedCountry = s.selectedCountry;

    if (selectedCity && selectedCity.latitude && selectedCity.longitude) {
      // return as strings (URLSearchParams expects strings)
      return {
        latitude: String(selectedCity.latitude),
        longitude: String(selectedCity.longitude),
      };
    }

    if (selectedCity && selectedCountry) {
      return {
        city: selectedCity.name,
        country: selectedCountry.code,
      };
    }

    if (selectedCity) {
      // fallback if selectedCountry not set
      return {
        city: selectedCity.name,
        country: (selectedCity.code as string) || "",
      };
    }

    return undefined;
  },
}));

// Helper function to provide fallback cities for common countries
const getFallbackCities = (
  countryName: string,
  countryCode: string
): AppCity[] => {
  // Map of major cities by country code
  const fallbackCityMap: { [key: string]: string[] } = {
    US: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"],
    GB: ["London", "Manchester", "Birmingham", "Glasgow", "Liverpool"],
    JP: ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya"],
    IN: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai"],
    CA: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
    BD: ["Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Kushtia"],
    PK: ["Karachi", "Lahore", "Islamabad", "Faisalabad", "Rawalpindi"],
    // Add more countries as needed
  };

  // Return cities for the specified country, or an empty array if none
  const cityNames = fallbackCityMap[countryCode] || [];
  return cityNames.map((name) => ({
    name,
    country: countryName,
    prototype: {}, // Add the required prototype property
  })) as AppCity[];
};
