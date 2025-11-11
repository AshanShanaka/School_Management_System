import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import CsvImport from "@/components/CsvImport";
import CsvTemplateGenerator from "@/components/CsvTemplateGenerator";
import { FileSpreadsheet, Download } from "lucide-react";

const ImportPage = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is admin
  if (user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-600 rounded-full p-3">
            <FileSpreadsheet className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Data Import
            </h1>
            <p className="text-gray-600 mt-1">
              Import users in bulk using CSV or Excel files
            </p>
          </div>
        </div>
      </div>

      {/* Template Generator Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
          <Download className="w-5 h-5 text-blue-600" />
          Download Templates
        </h2>
        <CsvTemplateGenerator />
      </div>

      {/* Import Component */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          Import Data
        </h2>
        <CsvImport />
      </div>
    </div>
  );
};

export default ImportPage;
