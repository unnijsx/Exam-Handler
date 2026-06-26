import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ExamContext = createContext(null);

export const useExam = () => useContext(ExamContext);

export const ExamProvider = ({ children }) => {
  const { user, updateStudentStatus } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null); // Active countdown in seconds
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);

  const saveIntervalRef = useRef(null);
  const tickIntervalRef = useRef(null);
  const sessionRef = useRef(null); 

  // Refs for tracking real-time states in interval callback closures
  const timeRemainingRef = useRef(timeRemaining);
  const answersRef = useRef(answers);
  const currentIdxRef = useRef(currentIdx);

  sessionRef.current = session;

  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);

  const fetchSession = async (showLoading = true) => {
    if (!user || user.role !== 'student') return;
    if (showLoading) setLoading(true);
    try {
      const response = await api.get('/exam/session');
      const data = response.data;
      setSession(data);
      setAnswers(data.mcqAnswers || {});
      setCurrentIdx(data.currentQuestionIndex || 0);
      
      // Determine active timer
      if (user.examStatus === 'mcq_in_progress') {
        setTimeRemaining(data.mcqTimeRemaining);
      } else if (user.examStatus === 'coding_in_progress') {
        setTimeRemaining(data.codingTimeRemaining);
      }
      if (showLoading) setLoading(false);
    } catch (error) {
      console.error('Failed to fetch exam session:', error);
      if (showLoading) setLoading(false);
    }
  };

  // Sync state with server
  const saveState = async (forceSaveData = null) => {
    // Only save if session exists, student is logged in, and exam has started
    if (!sessionRef.current || !sessionRef.current.examStarted || !user || user.role !== 'student') return;
    
    // If coding in progress and coding not started, don't autosave
    if (user.examStatus === 'coding_in_progress' && !sessionRef.current.codingStarted) return;

    // If session is paused, don't push saves
    if (sessionRef.current.isPaused) return;

    // Read state from parameters or active state refs
    const activeAnswers = forceSaveData?.answers || answersRef.current;
    const activeIdx = forceSaveData?.currentIdx !== undefined ? forceSaveData.currentIdx : currentIdxRef.current;
    const activeTime = forceSaveData?.timeRemaining !== undefined ? forceSaveData.timeRemaining : timeRemainingRef.current;

    try {
      const payload = {
        currentQuestionIndex: activeIdx,
        mcqAnswers: activeAnswers,
      };

      if (user.examStatus === 'mcq_in_progress') {
        payload.mcqTimeRemaining = activeTime;
      } else if (user.examStatus === 'coding_in_progress') {
        payload.codingTimeRemaining = activeTime;
      }

      await api.post('/exam/save', payload);
    } catch (error) {
      console.error('Autosave failed:', error);
    }
  };

  // Officially start the exam
  const startExam = async () => {
    try {
      const response = await api.post('/exam/start');
      const updatedSession = response.data.session;
      setSession(updatedSession);
      
      if (user.examStatus === 'mcq_in_progress') {
        setTimeRemaining(updatedSession.mcqTimeRemaining);
      } else if (user.examStatus === 'coding_in_progress') {
        setTimeRemaining(updatedSession.codingTimeRemaining);
      }
      return updatedSession;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to start examination.');
    }
  };

  // Start the Coding Exam phase
  const startCodingExam = async () => {
    try {
      const response = await api.post('/exam/start-coding');
      const updatedSession = response.data.session;
      setSession(updatedSession);
      setTimeRemaining(updatedSession.codingTimeRemaining);
      return updatedSession;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to start coding phase.');
    }
  };

  // Request Pause
  const requestPause = async () => {
    try {
      const response = await api.post('/exam/request-pause');
      const updatedSession = response.data.session;
      setSession(updatedSession);
      return updatedSession;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to request exam pause.');
    }
  };

  // Select an MCQ Option
  const selectOption = (questionId, optionValue) => {
    const updatedAnswers = { ...answers, [questionId]: optionValue };
    setAnswers(updatedAnswers);
    // Trigger immediate state save for quick responsiveness
    saveState({ answers: updatedAnswers, currentIdx, timeRemaining });
  };

  // Move to next/prev index
  const navigateToQuestion = (index) => {
    setCurrentIdx(index);
    saveState({ answers, currentIdx: index, timeRemaining });
  };

  // Submit MCQ Phase
  const submitMCQ = async () => {
    try {
      const response = await api.post('/exam/submit-mcq');
      updateStudentStatus('coding_in_progress');
      
      // Fetch session again to update local config to Coding
      await fetchSession();
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit MCQ.');
    }
  };

  // Load session when user signs in as Student
  useEffect(() => {
    if (user && user.role === 'student' && user.examStatus !== 'completed') {
      fetchSession();
    } else {
      setSession(null);
      setLoading(false);
    }
  }, [user]);

  // Sync / Poll session from server periodically to fetch admin pauses
  useEffect(() => {
    if (!user || user.role !== 'student' || user.examStatus === 'completed') return;

    const pollInterval = setInterval(() => {
      fetchSession(false);
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [user]);

  // Setup Clock timer tick (Every 1 second)
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || loading || !session || !session.examStarted) {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      return;
    }

    // Do not tick if exam is paused
    if (session.isPaused) {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      return;
    }

    // Do not tick if in coding phase and coding has not been started
    if (user?.examStatus === 'coding_in_progress' && !session.codingStarted) {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      return;
    }

    tickIntervalRef.current = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(tickIntervalRef.current);
          // Time ended! Trigger automatic submission
          if (user?.examStatus === 'mcq_in_progress') {
            submitMCQ().catch(err => console.error('MCQ Auto-submit failed:', err));
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [timeRemaining, loading, session?.isPaused, session?.codingStarted, session?.examStarted, user?.examStatus]);

  // Setup Autosave interval (Every 5 seconds)
  useEffect(() => {
    if (!session || !session.examStarted || loading || user?.examStatus === 'completed' || session.isPaused) {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
      return;
    }

    if (user?.examStatus === 'coding_in_progress' && !session.codingStarted) {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
      return;
    }

    saveIntervalRef.current = setInterval(() => {
      saveState();
    }, 5000); // Save time and answers every 5 seconds

    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [session?.examStarted, session?.isPaused, session?.codingStarted, loading, user?.examStatus]);

  return (
    <ExamContext.Provider value={{
      session,
      loading,
      timeRemaining,
      answers,
      currentIdx,
      selectOption,
      navigateToQuestion,
      submitMCQ,
      saveState,
      startExam,
      startCodingExam,
      requestPause,
      refreshSession: fetchSession,
    }}>
      {children}
    </ExamContext.Provider>
  );
};
