import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ExcelImport from "@/components/ExcelImport";

const ImportPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user is admin
  const user = await clerkClient.users.getUser(userId);
  if (user.publicMetadata?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Excel Bulk Import</h1>
        <p className="text-gray-600 mt-2">
          Import students, parents, and teachers in bulk using Excel files.
          Download the templates below to ensure proper formatting.
        </p>
      </div>

      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">
          Important Notes
        </h2>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Passwords must be at least 8 characters long</li>
          <li>• Email addresses must be unique across the system</li>
          <li>
            • Sex field must be either &quot;MALE&quot; or &quot;FEMALE&quot;
          </li>
          <li>• Dates should be in YYYY-MM-DD format (e.g., 2010-01-15)</li>
          <li>
            • For students: Class names will be created if they don&apos;t exist
          </li>
          <li>
            • For teachers: Subject names should match existing subjects in the
            system
          </li>
          <li>• Existing users will be updated with new information</li>
        </ul>
      </div>

      <ExcelImport />

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">
          Excel Format Guidelines
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <h3 className="font-medium text-blue-700 mb-2">
              Students + Parents Excel Columns:
            </h3>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• student_email</li>
              <li>• student_password</li>
              <li>• student_first_name</li>
              <li>• student_last_name</li>
              <li>• student_phone (optional)</li>
              <li>• student_birthday</li>
              <li>• student_class</li>
              <li>• student_grade</li>
              <li>• student_sex</li>
              <li>• address</li>
              <li>• parent_email</li>
              <li>• parent_password</li>
              <li>• parent_first_name</li>
              <li>• parent_last_name</li>
              <li>• parent_phone</li>
              <li>• parent_birthday</li>
              <li>• parent_sex</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-blue-700 mb-2">
              Teachers Excel Columns:
            </h3>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• teacher_email</li>
              <li>• teacher_password</li>
              <li>• teacher_first_name</li>
              <li>• teacher_last_name</li>
              <li>• teacher_phone (optional)</li>
              <li>• teacher_birthday</li>
              <li>• teacher_sex</li>
              <li>• address</li>
              <li>• subjects (optional, comma-separated)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
