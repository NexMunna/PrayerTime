import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import PrayerCard from "../../components/PrayerCard/PrayedCard";
import { useForm } from "react-hook-form";
import { PrayerFormData } from "../../types/types";
import PrayerTimer from "../../components/PrayerTimer/PrayerTimer";
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import useTimes from "../../hooks/useTimes";
import { useLocationStore } from "../../store/useLocationStore";

const PrayerTimesPage = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const selectedCountry = useLocationStore((s) => s.selectedCountry);
  const selectedCity = useLocationStore((s) => s.selectedCity);

  // compute API params from selected location (updates when selection changes)
  const apiParams = useMemo(() => {
    if (selectedCity && selectedCity.latitude && selectedCity.longitude) {
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
      return {
        city: selectedCity.name,
        country: (selectedCity.code as string) || "",
      };
    }
    // fallback: default city/country if you want a default
    return { city: "tokyo", country: "JP" };
  }, [selectedCity, selectedCountry]);

  // pass apiParams to useTimes so it re-fetches when selection changes
  const { prayerTimes, hijriDate, loading, error } = useTimes(currentDate, apiParams);

  const [dayName, setDayName] = useState("Today");

  const { register, handleSubmit, watch } = useForm<PrayerFormData>({
    defaultValues: {
      completedPrayers: prayerTimes
        ?.filter((prayer) => prayer.completed)
        .map((prayer) => prayer.name) || [],
      notifications: prayerTimes
        ?.filter((prayer) => prayer.notificationEnabled)
        .map((prayer) => prayer.name) || [],
    },
  });

  const completedPrayers = watch("completedPrayers");
  const notifications = watch("notifications");

  // Watch for changes and submit immediately
  useEffect(() => {
    handleSubmit(onSubmit)();
  }, [completedPrayers, notifications]);

  const onSubmit = (data: PrayerFormData) => {
    console.log("Form submitted:", data);
    // Handle form submission here
  };

  const addDay = () => {
    setCurrentDate(currentDate.add(1, 'day'));
  }

  const subtractDay = () => {
    setCurrentDate(currentDate.subtract(1, 'day'));
  }

  useEffect(() => {
    const today = dayjs();

    if (currentDate.isSame(today, "day")) {
      setDayName("Today");
    } else if (currentDate.isSame(today.add(1, "day"), "day")) {
      setDayName("Tomorrow");
    } else if (currentDate.isSame(today.subtract(1, "day"), "day")) {
      setDayName("Yesterday");
    } else {
      setDayName(currentDate.format("dddd"));
    }
  }, [currentDate]);

  return (
    <div className="flex flex-col bg-light rounded-lg">
      <main className="flex-1 px-4 pb-4">
        <div>
          <div className="my-4 flex items-center justify-between">
            <button onClick={subtractDay}><FaChevronLeft color="#1f2328" /></button>

            <div className="text-lg font-semibold mb-2 text-center">
              <p className={"text-black-primary text-sm"}>{dayName}</p>
              <p className={"text-xs text-black-secondary capitalize"}>
                {selectedCity?.name}, {currentDate.format('DD MMM YYYY')}, {hijriDate}
              </p>
            </div>

            <button onClick={addDay}><FaChevronRight color="#1f2328" /></button>
          </div>

          <div className="overview mb-4">
            <PrayerTimer prayerTimes={prayerTimes} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-screen">
              Loading...
            </div>
          ) : (
            <div className="prayer-list space-y-3">
              {prayerTimes.map((prayer) => (
                <PrayerCard
                  key={prayer.name}
                  prayer={prayer}
                  register={register}
                  completedPrayers={completedPrayers}
                  notifications={notifications}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PrayerTimesPage;
