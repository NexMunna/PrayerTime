import axios from "axios";
import * as React from "react";
import { baseURL as envBaseURL } from "../constants/constants";
import { PrayerTime } from "../types/types";
import { SingleDateDto } from "../models/single-day-dto";
import dayjs from "dayjs";

const parseApiTimeTo12h = (apiTime?: string) => {
  if (!apiTime) return "";
  const m = apiTime.match(/(\d{1,2}:\d{2})/);
  if (!m) return apiTime;
  const hhmm = m[1];
  const parsed = dayjs(hhmm, "HH:mm");
  if (!parsed.isValid()) return apiTime;
  return parsed.format("h:mm A");
};

const useTimes = (date: any, params: any) => {
  const baseURL = envBaseURL || "https://api.aladhan.com/v1";
  const stringifiedParams = React.useMemo(() => (params ? JSON.stringify(params) : ""), [params]);

  const [prayerTimes, setPrayerTimes] = React.useState<PrayerTime[]>([]);
  const [hijriDate, setHijriDate] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchPrayerTimes = async () => {
      try {
        const formattedDate = dayjs(date).format("DD-MM-YYYY");
        const parsedParams = stringifiedParams ? JSON.parse(stringifiedParams) : undefined;

        let endpoint = "timingsByCity";
        if (parsedParams && parsedParams.latitude && parsedParams.longitude) endpoint = "timings";
        else if (parsedParams && parsedParams.address) endpoint = "timingsByAddress";

        const qs = parsedParams ? new URLSearchParams(parsedParams as Record<string, string>).toString() : "";
        const url = `${baseURL}/${endpoint}/${formattedDate}${qs ? `?${qs}` : ""}`;

        const response = await axios.get<SingleDateDto>(url);

        const timings = response.data?.data?.timings;
        const dateObj = response.data?.data?.date;

        if (!timings) throw new Error("No timings returned from API");

        // ALWAYS use API times, convert to 12h display
        const formattedTimes: PrayerTime[] = [
          { name: "Fajr", time: parseApiTimeTo12h(timings.Fajr), icon: "🌙", completed: false, notificationEnabled: true },
          { name: "Sunrise", time: parseApiTimeTo12h(timings.Sunrise), icon: "☀️", completed: false, notificationEnabled: false },
          { name: "Dhuhr", time: parseApiTimeTo12h(timings.Dhuhr), icon: "☀️", completed: false, notificationEnabled: true },
          { name: "Asr", time: parseApiTimeTo12h(timings.Asr), icon: "☀️", completed: false, notificationEnabled: true },
          { name: "Maghrib", time: parseApiTimeTo12h(timings.Maghrib), icon: "🌅", completed: false, notificationEnabled: true },
          { name: "Isha", time: parseApiTimeTo12h(timings.Isha), icon: "🌙", completed: false, notificationEnabled: true },
        ];

        if (!cancelled) {
          setPrayerTimes(formattedTimes);
          if (dateObj?.hijri) {
            const h = dateObj.hijri;
            setHijriDate(`${h.day} ${h.month?.en ?? ""} ${h.year}`);
          } else setHijriDate("");
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Error fetching prayer times");
          setPrayerTimes([]);
          setHijriDate("");
          setLoading(false);
          console.error(err);
        }
      }
    };

    fetchPrayerTimes();

    return () => {
      cancelled = true;
    };
  }, [date, stringifiedParams, baseURL]);

  return { prayerTimes, hijriDate, loading, error };
};

export default useTimes;
