import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import {
  categoryAPI,
  courseAPI,
  topicAPI,
  materialAPI,
  enrollmentAPI,
  quizAPI,
  certificateAPI,
  notificationAPI,
  progressAPI,
  userAPI,
  feedbackAPI,
  todoAPI,
} from '../services/apiClient';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [progress, setProgress] = useState([]);
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const toLocalDateISOString = (value) => {
    if (!value || typeof value !== 'string') return value;
    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!match) return value;

    const [, year, month, day, hour, minute] = match;
    const localDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      0,
      0
    );

    return Number.isNaN(localDate.getTime()) ? value : localDate.toISOString();
  };

  // Categories
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await categoryAPI.getAll();
      if (response.success) {
        setCategories(response.categories || []);
      }
      return response;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCategory = async (name) => {
    try {
      const response = await categoryAPI.create({ name });
      if (response.success) {
        setCategories((prev) => [...prev, response.category]);
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteCategory = async (id) => {
    try {
      const response = await categoryAPI.delete(id);
      if (response.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Courses
  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await courseAPI.getAll();
      if (response.success) {
        setCourses(response.courses || []);
      }
      return response;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCourseById = async (id) => {
    try {
      const response = await courseAPI.getById(id);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const addCourse = async (courseData) => {
    try {
      const response = await courseAPI.create(courseData);
      if (response.success) {
        setCourses((prev) => [...prev, response.course]);
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateCourse = async (id, courseData) => {
    try {
      const response = await courseAPI.update(id, courseData);
      if (response.success) {
        setCourses((prev) => prev.map((c) => (c.id === id ? response.course : c)));
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteCourse = async (id) => {
    try {
      const response = await courseAPI.delete(id);
      if (response.success) {
        setCourses((prev) => prev.filter((c) => c.id !== id));
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const publishCourse = async (id) => {
    try {
      const response = await courseAPI.publish(id);
      if (response.success) {
        setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'published' } : c)));
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Topics
  const addTopic = async (topicData) => {
    try {
      const response = await topicAPI.create(topicData);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateTopic = async (id, topicData) => {
    try {
      const response = await topicAPI.update(id, topicData);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteTopic = async (id) => {
    try {
      const response = await topicAPI.delete(id);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Materials
  const addMaterial = async (materialData) => {
    try {
      const response = await materialAPI.create(materialData);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteMaterial = async (id) => {
    try {
      const response = await materialAPI.delete(id);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Enrollments
  // Normalize enrollment: backend uses `progressPercentage`, frontend expects `progress`
  const normalizeEnrollment = (e) => ({
    ...e,
    progress: e.progressPercentage ?? e.progress ?? 0,
  });

  const fetchMyEnrollments = useCallback(async () => {
    try {
      const response = await enrollmentAPI.getMyEnrollments();
      if (response.success) {
        setEnrollments((response.enrollments || []).map(normalizeEnrollment));
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const enrollInCourse = async (courseId) => {
    try {
      const response = await enrollmentAPI.enroll(courseId);
      if (response.success) {
        setEnrollments((prev) => [...prev, normalizeEnrollment(response.enrollment)]);
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const unenrollFromCourse = async (courseId) => {
    try {
      const response = await enrollmentAPI.unenroll(courseId);
      if (response.success) {
        setEnrollments((prev) => prev.filter((e) => e.courseId !== courseId));
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const checkEnrollment = useCallback(async (courseId) => {
    try {
      const response = await enrollmentAPI.checkEnrollment(courseId);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Progress
  const fetchMyProgress = useCallback(async () => {
    try {
      const response = await progressAPI.getMyProgress();
      if (response.success) {
        setProgress(response.progress || []);
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const updateTopicProgress = async (data) => {
    try {
      const response = await progressAPI.updateTopicProgress(data);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const getLearningStats = async () => {
    try {
      const response = await progressAPI.getLearningStats();
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Quizzes
  const fetchQuizzes = useCallback(async (params) => {
    try {
      const response = await quizAPI.getAll(params);
      if (response.success) {
        setQuizzes(response.quizzes || []);
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const getQuizById = async (id) => {
    try {
      const response = await quizAPI.getById(id);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const submitQuiz = async (data) => {
    try {
      const response = await quizAPI.submit(data);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const getMyQuizResults = async () => {
    try {
      const response = await quizAPI.getMyResults();
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Certificates
  const fetchMyCertificates = useCallback(async () => {
    try {
      const response = await certificateAPI.getMyCertificates();
      if (response.success) {
        setCertificates(response.certificates || []);
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const generateCertificate = async (data) => {
    try {
      const response = await certificateAPI.generate(data);
      if (response.success) {
        setCertificates((prev) => [...prev, response.certificate]);
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Notifications
  const fetchMyNotifications = useCallback(async (unreadOnly = false) => {
    try {
      const response = await notificationAPI.getMyNotifications(unreadOnly);
      if (response.success) {
        setNotifications(response.notifications || []);
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const markNotificationAsRead = async (id) => {
    try {
      const response = await notificationAPI.markAsRead(id);
      if (response.success) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await notificationAPI.markAllAsRead();
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Users (Admin)
  const fetchStudents = useCallback(async () => {
    try {
      const response = await userAPI.getStudents();
      if (response.success) {
        setStudents(response.students || []);
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const updateUser = async (id, data) => {
    try {
      const response = await userAPI.update(id, data);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteUser = async (id) => {
    try {
      const response = await userAPI.delete(id);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const toggleUserStatus = async (id) => {
    try {
      const response = await userAPI.toggleStatus(id);
      if (response.success) {
        // Update students list
        await fetchStudents();
      }
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Todos
  const fetchTodos = useCallback(async () => {
    try {
      const response = await todoAPI.getMyTodos();
      if (response.success) setTodos(response.todos || []);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const addTodo = async ({ text, type, scheduledAt }) => {
    try {
      const response = await todoAPI.create({
        text,
        type: type || 'reminder',
        scheduledAt: scheduledAt ? toLocalDateISOString(scheduledAt) : null
      });
      if (response.success) setTodos((prev) => [response.todo, ...prev]);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const toggleTodo = async (id) => {
    try {
      const response = await todoAPI.toggle(id);
      if (response.success) setTodos((prev) => prev.map((t) => t.id === id ? response.todo : t));
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteTodo = async (id) => {
    try {
      const response = await todoAPI.delete(id);
      if (response.success) setTodos((prev) => prev.filter((t) => t.id !== id));
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Feedback
  const fetchFeedback = useCallback(async () => {
    try {
      const response = await feedbackAPI.getAll();
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const addFeedback = async (data) => {
    try {
      const response = await feedbackAPI.create(data);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Initialize data on mount
  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, [fetchCategories, fetchCourses]);

  const value = {
    // State
    courses,
    categories,
    students,
    enrollments,
    notifications,
    certificates,
    quizzes,
    progress,
    isLoading,
    error,

    // Categories
    fetchCategories,
    addCategory,
    deleteCategory,

    // Courses
    fetchCourses,
    getCourseById,
    addCourse,
    updateCourse,
    deleteCourse,
    publishCourse,

    // Topics
    addTopic,
    updateTopic,
    deleteTopic,

    // Materials
    addMaterial,
    deleteMaterial,

    // Enrollments
    fetchMyEnrollments,
    enrollInCourse,
    unenrollFromCourse,
    checkEnrollment,

    // Progress
    fetchMyProgress,
    updateTopicProgress,
    getLearningStats,

    // Quizzes
    fetchQuizzes,
    getQuizById,
    submitQuiz,
    getMyQuizResults,

    // Certificates
    fetchMyCertificates,
    generateCertificate,

    // Notifications
    fetchMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,

    // Users
    fetchStudents,
    updateUser,
    deleteUser,
    toggleUserStatus,

    // Todos
    todos,
    fetchTodos,
    addTodo,
    toggleTodo,
    deleteTodo,

    // Feedback
    fetchFeedback,
    addFeedback,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
