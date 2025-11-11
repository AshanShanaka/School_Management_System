"use client";

import { deleteGrade } from "@/lib/actions";
import { useFormState } from "@/hooks/useFormState";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const GradeDeleteForm = ({
  id,
  setOpen,
}: {
  id: number | string;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const [state, formAction] = useFormState(deleteGrade, {
    success: false,
    error: false,
  });
  const [confirmForce, setConfirmForce] = useState(false);
  const [showDependencies, setShowDependencies] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success("Grade deleted successfully!", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      setOpen(false);
      router.refresh();
    }

    if (state.hasDependencies) {
      setShowDependencies(true);
    }

    if (state.error) {
      toast.error("Failed to delete grade. Please try again.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  }, [state, router, setOpen]);

  const handleSubmit = (formData: FormData) => {
    if (confirmForce) {
      formData.set("force", "true");
    }
    formAction(formData);
  };

  if (showDependencies && !confirmForce) {
    return (
      <div className="p-6 flex flex-col gap-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Cannot Delete Grade {state.gradeLevel}
          </h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 mb-2">
              This grade has{" "}
              <span className="font-semibold">{state.dependencyCount}</span>{" "}
              dependencies:
            </p>
            <p className="text-sm text-yellow-700 font-medium">
              {state.dependencyDetails}
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2">
            ⚠️ Force Delete Option
          </h4>
          <p className="text-xs text-red-700 mb-3">
            You can force delete this grade, which will permanently remove:
          </p>
          <ul className="text-xs text-red-700 list-disc list-inside mb-3 space-y-1">
            <li>The grade itself</li>
            <li>All classes in this grade</li>
            <li>All students in these classes</li>
            <li>All related data (attendance, results, etc.)</li>
          </ul>
          <p className="text-xs font-semibold text-red-800">
            This action cannot be undone!
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setConfirmForce(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium"
          >
            Force Delete
          </button>
        </div>
      </div>
    );
  }

  if (confirmForce) {
    return (
      <div className="p-6 flex flex-col gap-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            ⚠️ Final Confirmation
          </h3>
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800 font-medium mb-2">
              You are about to permanently delete Grade {state.gradeLevel} and
              ALL its data.
            </p>
            <p className="text-sm text-red-700">
              This will remove{" "}
              <span className="font-semibold">{state.dependencyCount}</span>{" "}
              related records.
            </p>
          </div>
        </div>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={id} />

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-700 text-center">
              Type{" "}
              <span className="font-mono font-semibold bg-gray-200 px-1 rounded">
                DELETE
              </span>{" "}
              to confirm:
            </p>
            <input
              type="text"
              placeholder="Type DELETE to confirm"
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-center font-mono"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setConfirmForce(false);
                setShowDependencies(false);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={confirmText !== "DELETE"}
            >
              Permanently Delete
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Normal delete confirmation (no dependencies)
  return (
    <form action={handleSubmit} className="p-4 flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <span className="text-center font-medium">
        All data will be lost. Are you sure you want to delete this grade?
      </span>
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </form>
  );
};

export default GradeDeleteForm;
