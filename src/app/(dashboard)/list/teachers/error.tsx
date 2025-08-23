"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-red-500 text-6xl">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-800">
            Something went wrong!
          </h2>
          <p className="text-gray-600">
            There was an error loading the teachers data.
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
