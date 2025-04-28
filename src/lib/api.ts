export const createTeacher = async (teacherData: any) => {
  try {
    const response = await fetch('/api/teachers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teacherData),
    });

    if (!response.ok) {
      throw new Error('Failed to create teacher');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating teacher:', error);
    throw error;
  }
};

export const updateTeacher = async (id: string, teacherData: any) => {
  try {
    const response = await fetch(`/api/teachers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teacherData),
    });

    if (!response.ok) {
      throw new Error('Failed to update teacher');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating teacher:', error);
    throw error;
  }
};

export const deleteTeacher = async (id: string) => {
  try {
    const response = await fetch(`/api/teachers/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete teacher');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting teacher:', error);
    throw error;
  }
};

export const getTeachers = async () => {
  try {
    const response = await fetch('/api/teachers');

    if (!response.ok) {
      throw new Error('Failed to fetch teachers');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }
};

export const createExam = async (examData: any) => {
  try {
    const response = await fetch('/api/exams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(examData),
    });

    if (!response.ok) {
      throw new Error('Failed to create exam');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating exam:', error);
    throw error;
  }
};

export const updateExam = async (id: string, examData: any) => {
  try {
    const response = await fetch(`/api/exams/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(examData),
    });

    if (!response.ok) {
      throw new Error('Failed to update exam');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating exam:', error);
    throw error;
  }
};

export const deleteExam = async (id: string) => {
  try {
    const response = await fetch(`/api/exams/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete exam');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting exam:', error);
    throw error;
  }
};

export const getExams = async () => {
  try {
    const response = await fetch('/api/exams');

    if (!response.ok) {
      throw new Error('Failed to fetch exams');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching exams:', error);
    throw error;
  }
};

export const getSubjects = async () => {
  try {
    const response = await fetch('/api/subjects');

    if (!response.ok) {
      throw new Error('Failed to fetch subjects');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching subjects:', error);
    throw error;
  }
};

export const getExamTypes = async () => {
  try {
    const response = await fetch('/api/exam-types');

    if (!response.ok) {
      throw new Error('Failed to fetch exam types');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching exam types:', error);
    throw error;
  }
};

export const getLessons = async () => {
  const response = await fetch("/api/lessons");
  if (!response.ok) {
    throw new Error("Failed to fetch lessons");
  }
  return response.json();
}; 