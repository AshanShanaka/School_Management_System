"use client";

import {
  CheckCircle,
  ArrowRight,
  Download,
  Upload,
  Users,
  AlertTriangle,
} from "lucide-react";

const ImportProcessGuide = () => {
  const steps = [
    {
      step: 1,
      title: "Download Template",
      description:
        "Get the correctly formatted Excel template for your data type",
      icon: <Download className="w-5 h-5" />,
      details: [
        "Choose between Students+Parents or Teachers template",
        "Templates include all required columns with examples",
        "Use these as starting points for your data",
      ],
    },
    {
      step: 2,
      title: "Prepare Your Data",
      description: "Fill in the template with your actual data",
      icon: <Users className="w-5 h-5" />,
      details: [
        "Follow the exact column names from the template",
        "Ensure all required fields are filled",
        "Use proper date format (YYYY-MM-DD)",
        "Use 'MALE' or 'FEMALE' for sex fields",
      ],
    },
    {
      step: 3,
      title: "Upload & Review",
      description: "Upload your file and review the preview",
      icon: <Upload className="w-5 h-5" />,
      details: [
        "Select your import type (Students+Parents or Teachers)",
        "Upload your Excel/CSV file",
        "Review the file preview to ensure proper formatting",
        "Check that all required columns are detected",
      ],
    },
    {
      step: 4,
      title: "Import & Verify",
      description: "Start the import process and review results",
      icon: <CheckCircle className="w-5 h-5" />,
      details: [
        "Click 'Import Data' to start processing",
        "Monitor the progress and success rate",
        "Review any errors or skipped records",
        "Fix issues and re-import if necessary",
      ],
    },
  ];

  const tips = [
    {
      title: "Data Validation",
      description:
        "All email addresses must be unique across the entire system",
      type: "info",
    },
    {
      title: "Password Security",
      description: "Passwords must be at least 8 characters long",
      type: "warning",
    },
    {
      title: "Class Creation",
      description:
        "For students: Class names will be automatically created if they don't exist",
      type: "info",
    },
    {
      title: "Subject Matching",
      description:
        "For teachers: Subject names should match existing subjects in the system",
      type: "warning",
    },
    {
      title: "Data Update",
      description:
        "Existing users will be updated with new information from the import",
      type: "info",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Import Process Steps */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Import Process Guide
        </h3>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.step} className="flex items-start space-x-4">
              {/* Step Number */}
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-semibold flex-shrink-0">
                {step.step}
              </div>

              {/* Step Content */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="text-blue-600">{step.icon}</div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {step.title}
                  </h4>
                </div>
                <p className="text-gray-600 mb-3">{step.description}</p>
                <ul className="space-y-1">
                  {step.details.map((detail, detailIndex) => (
                    <li
                      key={detailIndex}
                      className="text-sm text-gray-500 flex items-start space-x-2"
                    >
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <div className="flex items-center justify-center w-6 h-6 text-gray-400">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tips and Best Practices */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Tips & Best Practices
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tips.map((tip, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                tip.type === "warning"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <h4
                className={`font-medium mb-2 ${
                  tip.type === "warning" ? "text-amber-900" : "text-blue-900"
                }`}
              >
                {tip.title}
              </h4>
              <p
                className={`text-sm ${
                  tip.type === "warning" ? "text-amber-700" : "text-blue-700"
                }`}
              >
                {tip.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Format Examples */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Data Format Examples
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">✅ Correct Formats</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-green-50 border border-green-200 rounded">
                <strong>Email:</strong> john.doe@school.com
              </div>
              <div className="p-2 bg-green-50 border border-green-200 rounded">
                <strong>Date:</strong> 2010-01-15
              </div>
              <div className="p-2 bg-green-50 border border-green-200 rounded">
                <strong>Sex:</strong> MALE / FEMALE
              </div>
              <div className="p-2 bg-green-50 border border-green-200 rounded">
                <strong>Grade:</strong> 5
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">❌ Incorrect Formats</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <strong>Email:</strong> john.doe (missing @domain)
              </div>
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <strong>Date:</strong> 01/15/2010
              </div>
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <strong>Sex:</strong> M / F / Male
              </div>
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <strong>Grade:</strong> Fifth / Grade 5
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">📝 Optional Fields</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                <strong>Phone:</strong> Can be left empty
              </div>
              <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                <strong>Subjects:</strong> Math,Science,English
              </div>
              <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                <strong>Address:</strong> Can be shared between family
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportProcessGuide;
