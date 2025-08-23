import React from "react";
import Image from "next/image";

interface DeleteErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
  dependencies?: {
    students?: number;
    classes?: number;
    lessons?: number;
    events?: number;
    announcements?: number;
  };
  itemType: string;
  itemName: string;
}

const DeleteErrorModal: React.FC<DeleteErrorModalProps> = ({
  isOpen,
  onClose,
  error,
  dependencies,
  itemType,
  itemName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-red-100 rounded-full p-2">
            <Image
              src="/delete.png"
              alt="Delete Error"
              width={24}
              height={24}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Cannot Delete {itemType}
            </h3>
            <p className="text-sm text-gray-600">{itemName}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-3">{error}</p>

          {dependencies && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                Dependencies found:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {dependencies.students && dependencies.students > 0 && (
                  <li>• {dependencies.students} student(s)</li>
                )}
                {dependencies.classes && dependencies.classes > 0 && (
                  <li>• {dependencies.classes} class(es)</li>
                )}
                {dependencies.lessons && dependencies.lessons > 0 && (
                  <li>• {dependencies.lessons} lesson(s)</li>
                )}
                {dependencies.events && dependencies.events > 0 && (
                  <li>• {dependencies.events} event(s)</li>
                )}
                {dependencies.announcements &&
                  dependencies.announcements > 0 && (
                    <li>• {dependencies.announcements} announcement(s)</li>
                  )}
              </ul>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              // Navigate to dependencies management (could be implemented later)
              onClose();
            }}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Manage Dependencies
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteErrorModal;
