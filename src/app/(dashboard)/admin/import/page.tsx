import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import CsvImport from "@/components/CsvImport";
import CsvTemplateGenerator from "@/components/CsvTemplateGenerator";
import ImportProcessGuide from "@/components/ImportProcessGuide";
import {
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Users,
  GraduationCap,
  BookOpen,
} from "lucide-react";

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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-3">
            <FileSpreadsheet className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bulk Data Import
            </h1>
            <p className="text-gray-600 mt-1">
              Import students, parents, and teachers in bulk using Excel or CSV
              files.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 rounded-full p-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Students + Parents
              </h3>
              <p className="text-sm text-blue-700">
                Import student and parent data together
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 rounded-full p-3">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">Teachers</h3>
              <p className="text-sm text-green-700">
                Import teaching staff data
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 rounded-full p-3">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900">
                Batch Processing
              </h3>
              <p className="text-sm text-purple-700">
                Process hundreds of records at once
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-orange-100 rounded-full p-3">
              <BookOpen className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-900">
                Auto-Validation
              </h3>
              <p className="text-sm text-orange-700">
                Automatic data validation and error reporting
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Template Generator Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          Download Templates
        </h2>
        <CsvTemplateGenerator />
      </div>

      {/* Import Component */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <FileSpreadsheet className="w-6 h-6 text-green-600" />
          Import Data
        </h2>
        <CsvImport />
      </div>

      {/* Process Guide */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-purple-600" />
          Import Guide & Best Practices
        </h2>
        <ImportProcessGuide />
      </div>

      {/* Important Guidelines */}
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-amber-900 mb-3">
              Critical Guidelines
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="text-sm text-amber-800 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600">•</span>
                  <span>Passwords must be at least 8 characters long</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600">•</span>
                  <span>Email addresses must be unique across the system</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600">•</span>
                  <span>Sex field must be either "MALE" or "FEMALE"</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600">•</span>
                  <span>
                    Dates should be in YYYY-MM-DD format (e.g., 2010-01-15)
                  </span>
                </li>
              </ul>
              <ul className="text-sm text-amber-800 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600">•</span>
                  <span>
                    For students: Class names will be created if they don't
                    exist
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600">•</span>
                  <span>
                    For teachers: Subject names should match existing subjects
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600">•</span>
                  <span>
                    Existing users will be updated with new information
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600">•</span>
                  <span>Always download templates for correct format</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
