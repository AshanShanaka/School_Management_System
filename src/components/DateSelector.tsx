"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface DateSelectorProps {
  selectedDate: string;
  currentDay: string;
  isSchoolDay: boolean;
}

const DateSelector = ({
  selectedDate,
  currentDay,
  isSchoolDay,
}: DateSelectorProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDateChange = (newDate: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("date", newDate);
    params.delete("slotId"); // Reset slot selection when date changes
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Date
      </label>
      <div className="flex items-center gap-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <span className="text-sm text-gray-600">
          Current day: <strong>{currentDay}</strong>
          {!isSchoolDay && (
            <span className="ml-2 text-orange-600 font-medium">
              (Weekend - No school activities)
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default DateSelector;
