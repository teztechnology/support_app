"use client";

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onDateRangeChange: (range: { start: string; end: string }) => void;
}

export function DateRangeSelector({
  startDate,
  endDate,
  onDateRangeChange,
}: DateRangeSelectorProps) {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateRangeChange({
      start: e.target.value,
      end: endDate,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateRangeChange({
      start: startDate,
      end: e.target.value,
    });
  };

  const setPresetRange = (days: number) => {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    onDateRangeChange({ start, end });
  };

  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
      <div className="flex space-x-4">
        <div>
          <label
            htmlFor="start-date"
            className="block text-sm font-medium text-gray-700"
          >
            Start Date
          </label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={handleStartDateChange}
            className="mt-1 block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="end-date"
            className="block text-sm font-medium text-gray-700"
          >
            End Date
          </label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={handleEndDateChange}
            className="mt-1 block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex items-end space-x-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Quick Select
          </label>
          <div className="mt-1 flex space-x-2">
            <button
              onClick={() => setPresetRange(7)}
              className="rounded-md bg-gray-100 px-3 py-2 text-xs text-gray-700 hover:bg-gray-200"
            >
              Last 7 days
            </button>
            <button
              onClick={() => setPresetRange(30)}
              className="rounded-md bg-gray-100 px-3 py-2 text-xs text-gray-700 hover:bg-gray-200"
            >
              Last 30 days
            </button>
            <button
              onClick={() => setPresetRange(90)}
              className="rounded-md bg-gray-100 px-3 py-2 text-xs text-gray-700 hover:bg-gray-200"
            >
              Last 90 days
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
