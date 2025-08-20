import React, { useEffect, useState } from "preact/hooks";
import { useLocationStore } from "../../store/useLocationStore";

interface LocationSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationSettingsDrawer = ({
  isOpen,
  onClose,
}: LocationSettingsDrawerProps) => {
  const {
    locationType,
    countries,
    cities,
    selectedCountry,
    isLoadingCountries,
    isLoadingCities,
    fetchCountries,
    setLocationType,
    setSelectedCountry,
    setSelectedCity,
    getLocationType,
  } = useLocationStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCities, setFilteredCities] = useState<any[]>([]);

  useEffect(() => {
    getLocationType();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCountries();
    }
  }, [isOpen, fetchCountries]);

  useEffect(() => {
    if (searchTerm && cities.length > 0) {
      setFilteredCities(
        cities.filter((city) =>
          city.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredCities(cities);
    }
  }, [searchTerm, cities]);

  useEffect(() => {
    const country = localStorage.getItem("selectedCountry");
    const city = localStorage.getItem("selectedCity");

    if (country) {
      const parsedCountry = JSON.parse(country);

      if (parsedCountry && parsedCountry.code) {
        setSelectedCountry(parsedCountry);
      }
    }

    if (city) {
      const parsedCity = JSON.parse(city);
      if (typeof parsedCity === "string") {
        setSearchTerm(parsedCity);
      } else if (parsedCity && parsedCity.name) {
        setSearchTerm(parsedCity.name);
        setSelectedCity(parsedCity);
      }
    }
  }, []);

  if (!isOpen) return null;

  const clearCity = () => {
    setSelectedCity("");
    setSearchTerm("");
    localStorage.removeItem("selectedCity");
  };

  // Example: when user saves a city selection:
  const handleSaveCity = (selectedCountry, selectedCity) => {
    // pass city & country to useTimes through whatever state you use (store or props)
    // e.g., setLocationParams({ city: selectedCity.name, country: selectedCountry.code });
  };

  // Replace or add the save handlers so they write to the store
  const handleSaveSelection = () => {
    if (selectedCountry) setSelectedCountry(selectedCountry);
    if (selectedCity) {
      // ensure city object contains latitude & longitude when available
      setSelectedCity(selectedCity);
    }
    // close drawer (call existing close handler)
    onClose?.();
  };

  // Example: when user chooses device location (use geolocation)
  const handleUseDeviceLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const cityLike = {
          name: "Device location",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        // store as selected city with lat/lon
        setSelectedCity(cityLike);
        onClose?.();
      },
      (err) => {
        console.error("Geolocation error", err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Example: when user enters an address
  const handleSaveAddress = (address) => {
    // pass address param to useTimes: setLocationParams({ address: address });
  };

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#00000066] z-[1999]"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[2000] transition-all duration-300 ease-in-out ${
          isOpen ? "w-80" : "w-0 opacity-0"
        }`}
      >
        <div className="h-full bg-primary w-80 overflow-hidden flex flex-col">
          <div className="p-4 bg-primary flex items-center border-b border-border-color">
            <button onClick={onClose} className="mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h2 className="text-xl font-semibold">Settings</h2>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            <h3 className="font-medium mb-2">Location Type</h3>

            <div className="mb-4">
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  id="auto"
                  name="locationType"
                  className="mr-2 accent-black-primary"
                  checked={locationType === "auto"}
                  onChange={() => setLocationType("auto")}
                />
                <label htmlFor="auto">Auto</label>
              </div>

              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  id="giveAccess"
                  name="locationType"
                  className="mr-2 accent-black-primary"
                  checked={locationType === "giveAccess"}
                  onChange={() => setLocationType("giveAccess")}
                />
                <label htmlFor="giveAccess">Give Location Access</label>
              </div>

              <div className="flex items-center">
                <input
                  type="radio"
                  id="select"
                  name="locationType"
                  className="mr-2 accent-black-primary"
                  checked={locationType === "select"}
                  onChange={() => setLocationType("select")}
                />
                <label htmlFor="select">Select Location</label>
              </div>
            </div>

            {locationType === "select" && (
              <div className="mt-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-black-secondary">
                    Country
                  </label>

                  <div className="relative">
                    {isLoadingCountries ? (
                      <div className="w-full p-2 border rounded bg-gray-50">
                        Loading countries...
                      </div>
                    ) : (
                      <select
                        className="w-full px-2 border-black-secondary border rounded-lg pr-8 appearance-none bg-primary"
                        value={selectedCountry?.name || ""}
                        onChange={(e) => {
                          const country = countries.find(
                            (c) => c.name === e.currentTarget.value
                          );
                          if (country) setSelectedCountry(country);
                        }}
                      >
                        {countries.map((country) => (
                          <option key={country.code} value={country.name}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-black-secondary">
                    City
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-2 border rounded-lg border-black-secondary pr-8"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.currentTarget.value);
                        if (e.currentTarget.value === "") {
                          clearCity();
                        }
                      }}
                      placeholder="Search for a city..."
                    />

                    {searchTerm && (
                      <button
                        className="absolute inset-y-0 right-8 flex items-center pr-2"
                        onClick={() => {
                          clearCity();
                        }}
                      >
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}

                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>

                  {isLoadingCities ? (
                    <div className="mt-1 p-2 border rounded bg-gray-50">
                      Loading cities...
                    </div>
                  ) : (
                    searchTerm && (
                      <div className="mt-1 border border-[#d1d9e0b3] rounded-lg max-h-48 overflow-y-auto bg-light">
                        {filteredCities.length > 0 ? (
                          filteredCities.map((city) => (
                            <div
                              key={city.name}
                              className="px-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setSelectedCity(city);
                                setSearchTerm(city.name);
                              }}
                            >
                              {city.name}
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-gray-500">
                            No cities found
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Save and Use Device Location buttons */}
            <div className="flex justify-between mt-4">
              <button
                onClick={handleSaveSelection}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Save
              </button>

              <button
                onClick={handleUseDeviceLocation}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                Use my location
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LocationSettingsDrawer;
