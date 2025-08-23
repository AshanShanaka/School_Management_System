const Loading = () => {
  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    </div>
  );
};

export default Loading;
