"use client";

import {
  deleteClass,
  deleteExam,
  deleteParent,
  deleteStudent,
  deleteSubject,
  deleteTeacher,
  deleteLesson,
  deleteAssignment,
  deleteGrade,
  deleteTimetable,
  deleteEvent,
  deleteAnnouncement,
} from "@/lib/actions";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";
import {
  createTeacher,
  updateTeacher,
  createExam,
  updateExam,
  getTeachers,
  getSubjects,
  getExamTypes,
  getLessons,
} from "@/lib/api";

const deleteActionMap = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  student: deleteStudent,
  exam: deleteExam,
  parent: deleteParent,
  lesson: deleteLesson,
  assignment: deleteAssignment,
  grade: deleteGrade,
  result: deleteSubject,
  attendance: deleteSubject,
  event: deleteEvent,
  announcement: deleteAnnouncement,
  timetable: deleteTimetable,
};

// USE LAZY LOADING

// import TeacherForm from "./forms/TeacherForm";
// import StudentForm from "./forms/StudentForm";

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ClassForm = dynamic(() => import("./forms/ClassForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ExamForm = dynamic(() => import("./forms/ExamForm"), {
  loading: () => <h1>Loading...</h1>,
});

const ParentForm = dynamic(() => import("./forms/ParentForm"), {
  loading: () => <h1>Loading...</h1>,
});

const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"), {
  loading: () => <h1>Loading...</h1>,
});

const SimpleLessonForm = dynamic(() => import("./forms/SimpleLessonForm"), {
  loading: () => <h1>Loading...</h1>,
});

const GradeForm = dynamic(() => import("./forms/GradeForm"), {
  loading: () => <h1>Loading...</h1>,
});

const GradeDeleteForm = dynamic(() => import("./forms/GradeDeleteForm"), {
  loading: () => <h1>Loading...</h1>,
});

const TimetableForm = dynamic(() => import("./forms/TimetableForm"), {
  loading: () => <h1>Loading...</h1>,
});

const EventForm = dynamic(() => import("./forms/EventForm"), {
  loading: () => <h1>Loading...</h1>,
});

const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"), {
  loading: () => <h1>Loading...</h1>,
});

// TODO: OTHER FORMS

interface Teacher {
  id: string;
  name: string;
  surname: string;
  subjects: Array<{ name: string }>;
}

interface Subject {
  id: number;
  name: string;
}

interface ExamType {
  id: number;
  name: string;
}

const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => React.JSX.Element;
} = {
  subject: (setOpen, type, data, relatedData) => (
    <SubjectForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  class: (setOpen, type, data, relatedData) => (
    <ClassForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  student: (setOpen, type, data, relatedData) => (
    <StudentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  exam: (setOpen, type, data, relatedData) => (
    <ExamForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  parent: (setOpen, type, data, relatedData) => (
    <ParentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  assignment: (setOpen, type, data, relatedData) => (
    <AssignmentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  lesson: (setOpen, type, data, relatedData) => (
    <SimpleLessonForm
      type={type}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  grade: (setOpen, type, data) => (
    <GradeForm type={type} data={data} setOpen={setOpen} />
  ),
  timetable: (setOpen, type, data, relatedData) => (
    <TimetableForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  event: (setOpen, type, data) => (
    <EventForm type={type} data={data} />
  ),
  announcement: (setOpen, type, data) => (
    <AnnouncementForm type={type} data={data} />
  ),
  teachers: (setOpen, type, data, relatedData) => (
    <TeacherForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
  onError,
}: FormContainerProps & { relatedData?: any; onError?: () => void }) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-lamaYellow"
      : type === "update"
      ? "bg-lamaSky"
      : "bg-lamaPurple";

  const [open, setOpen] = useState(false);
  
  // Debug: Log whenever open state changes
  useEffect(() => {
    console.log("🔄 Modal open state changed:", open);
    if (open) {
      console.log("✅ Modal should now be visible!");
    }
  }, [open]);
  
  // Simple test handler
  const handleButtonClick = () => {
    console.log("========== BUTTON CLICK START ==========");
    console.log("Current open state:", open);
    console.log("Table:", table);
    console.log("Type:", type);
    console.log("Related Data:", relatedData);
    
    setOpen(true);
    
    console.log("setOpen(true) has been called");
    console.log("========== BUTTON CLICK END ==========");
  };
  
  const [state, formAction] = useFormState<
    { success: boolean; error: boolean },
    FormData
  >((state, formData) => deleteActionMap[table](state, formData), {
    success: false,
    error: false,
  });
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`${table} has been deleted successfully!`, {
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
    if (state.error) {
      if (onError) {
        onError();
      } else {
        toast.error(`Failed to delete ${table}. Please try again.`, {
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
    }
  }, [state, router, table, onError]);

  const Form = () => {
    // Special handling for grade deletion
    if (type === "delete" && table === "grade" && id) {
      return <GradeDeleteForm id={id} setOpen={setOpen} />;
    }

    return type === "delete" && id ? (
      <form action={formAction} className="p-4 flex flex-col gap-4">
        <input type="hidden" name="id" value={id} />
        <span className="text-center font-medium">
          All data will be lost. Are you sure you want to delete this {table}?
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
    ) : type === "create" || type === "update" ? (
      forms[table](setOpen, type, data, relatedData)
    ) : (
      "Form not found!"
    );
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor} hover:opacity-80`}
        onClick={handleButtonClick}
        type="button"
        style={{ 
          cursor: 'pointer', 
          zIndex: 1000, 
          position: 'relative'
        }}
        title={`${type} ${table}`}
      >
        <Image src={`/${type}.png`} alt={type} width={16} height={16} />
      </button>
      
      {/* Debug: Always show what open state is */}
      {console.log("Rendering, open =", open)}
      
      {open && (
        <div 
          className="w-screen h-screen fixed left-0 top-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center"
          onClick={() => {
            console.log("Overlay clicked, closing modal");
            setOpen(false);
          }}
        >
          <div
            className={`bg-white p-4 rounded-md relative ${
              table === "exam"
                ? "w-[80%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]"
                : "w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]"
            }`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent closing when clicking inside modal
              console.log("Modal content clicked (should not close)");
            }}
          >
            <Form />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => {
                console.log("Close button clicked");
                setOpen(false);
              }}
            >
              <Image src="/close.png" alt="close" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
