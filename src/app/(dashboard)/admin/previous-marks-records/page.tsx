"use client";

import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Exam, ExamType, Grade, ExamSubject, Subject } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type ExamList = Exam & {
  grade: Grade;
  examType: ExamType;
  examSubjects: (ExamSubject & {
    subject: Subject;
  })[];
  _count: {
    results: number;
  };
  uniqueStudentCount: number;
};

const PreviousMarksRecordsPage = ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const [examData, setExamData] = useState<ExamList[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const { page, grade: selectedGrade, class: selectedClass } = searchParams;
  const p = page ? parseInt(page) : 1;

  useEffect(() => {
    // Fetch grades and classes for filters
    const fetchFilters = async () => {
      try {
        const response = await fetch('/api/admin/filters');
        const data = await response.json();
        setGrades(data.grades || []);
        setClasses(data.classes || []);
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        params.append('page', p.toString());
        
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value && key !== 'page') params.append(key, value);
        });

        const response = await fetch(`/api/admin/previous-marks-records?${params}`);
        const result = await response.json();
        
        setExamData(result.data || []);
        setTotalCount(result.count || 0);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams, p]);

  const handleDelete = async (id: number, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        const response = await fetch(`/api/admin/previous-marks-records/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setExamData(examData.filter(item => item.id !== id));
          setTotalCount(totalCount - 1);
          alert('Record deleted successfully');
        } else {
          alert('Failed to delete record');
        }
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Error deleting record');
      }
    }
  };

  const columns = [
    {
      header: "Term/Exam Name",
      accessor: "title",
    },
    {
      header: "Grade",
      accessor: "grade",
    },
    {
      header: "Year",
      accessor: "year",
      className: "hidden md:table-cell",
    },
    {
      header: "Term",
      accessor: "term",
      className: "hidden md:table-cell",
    },
    {
      header: "Students",
      accessor: "students",
      className: "hidden md:table-cell",
    },
    {
      header: "Subjects",
      accessor: "subjects",
      className: "hidden lg:table-cell",
    },
    {
      header: "Actions",
      accessor: "action",
    },
  ];

  const renderRow = (item: ExamList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-purple-50"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold text-purple-800">{item.title}</h3>
          <p className="text-xs text-gray-500">
            Imported: {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>
      </td>
      <td>
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
          Grade {item.grade.level}
        </span>
      </td>
      <td className="hidden md:table-cell">{item.year}</td>
      <td className="hidden md:table-cell">Term {item.term}</td>
      <td className="hidden md:table-cell">
        <span className="text-sm font-medium">
          {item.uniqueStudentCount || 0} students
        </span>
      </td>
      <td className="hidden lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {item.examSubjects.map((examSubject, index) => (
            <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
              {examSubject.subject.name}
            </span>
          ))}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/admin/previous-marks-records/${item.id}`}>
            <button 
              className="w-7 h-7 flex items-center justify-center rounded-full bg-purple-500 hover:bg-purple-600 transition-colors"
              title="View Details"
            >
              <Image src="/view.png" alt="View" width={16} height={16} className="brightness-0 invert" unoptimized />
            </button>
          </Link>
          <Link href={`/admin/previous-marks-records/${item.id}/edit`}>
            <button 
              className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
              title="Edit Record"
            >
              <Image src="/update.png" alt="Edit" width={16} height={16} className="brightness-0 invert" unoptimized />
            </button>
          </Link>
          <button 
            className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            title="Delete Record"
            onClick={() => handleDelete(item.id, item.title)}
          >
            <Image src="/delete.png" alt="Delete" width={16} height={16} className="brightness-0 invert" unoptimized />
          </button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-800">Previous Marks Records</h1>
          <Link
            href="/admin/historical-marks-import"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Image src="/upload.png" alt="" width={14} height={14} />
            Import More Marks
          </Link>
        </div>
        <p className="text-sm text-gray-600">
          View historical marks from Grade 9 & 10 (imported via Excel)
        </p>
      </div>

      {/* INFO BOXES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-xs text-purple-600 font-medium">Total Records</div>
          <div className="text-2xl font-bold text-purple-800 mt-1">{totalCount}</div>
          <div className="text-xs text-gray-500 mt-1">Historical exam records</div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-600 font-medium">Grade 9 Records</div>
          <div className="text-2xl font-bold text-blue-800 mt-1">
            {examData.filter(exam => exam.grade.level === 9).length}
          </div>
          <div className="text-xs text-gray-500 mt-1">From Grade 9</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-xs text-green-600 font-medium">Grade 10 Records</div>
          <div className="text-2xl font-bold text-green-800 mt-1">
            {examData.filter(exam => exam.grade.level === 10).length}
          </div>
          <div className="text-xs text-gray-500 mt-1">From Grade 10</div>
        </div>
      </div>

      {/* TOP */}
      <div className="flex flex-col gap-4 mb-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Grade:</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={selectedGrade || ''}
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) {
                  url.searchParams.set('grade', e.target.value);
                } else {
                  url.searchParams.delete('grade');
                }
                url.searchParams.delete('page');
                window.location.href = url.toString();
              }}
            >
              <option value="">All Grades</option>
              {grades.filter(g => g.level === 9 || g.level === 10).map((grade) => (
                <option key={grade.id} value={grade.id}>
                  Grade {grade.level}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Class:</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={selectedClass || ''}
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) {
                  url.searchParams.set('class', e.target.value);
                } else {
                  url.searchParams.delete('class');
                }
                url.searchParams.delete('page');
                window.location.href = url.toString();
              }}
            >
              <option value="">All Classes</option>
              {classes
                .filter(c => !selectedGrade || c.gradeId === parseInt(selectedGrade))
                .map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
            </select>
          </div>

          {(selectedGrade || selectedClass) && (
            <button
              onClick={() => {
                window.location.href = '/admin/previous-marks-records';
              }}
              className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between">
          <h2 className="hidden md:block text-lg font-semibold">
            All Historical Records
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch />
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* LIST */}
      {examData.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Image 
            src="/result.png" 
            alt="No records" 
            width={64} 
            height={64} 
            className="mx-auto opacity-50 mb-4"
          />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Historical Records Yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Import Grade 9 & 10 historical marks to see them here
          </p>
          <Link
            href="/admin/historical-marks-import"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
          >
            <Image src="/upload.png" alt="" width={14} height={14} />
            Import Historical Marks
          </Link>
        </div>
      ) : (
        <>
          <Table columns={columns} renderRow={renderRow} data={examData} />
          <Pagination page={p} count={totalCount} />
        </>
      )}
    </div>
  );
};

export default PreviousMarksRecordsPage;
