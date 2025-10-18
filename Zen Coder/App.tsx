import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { QuestionsView } from './components/QuestionsView';
import { CoursesView } from './components/CoursesView';
import { CourseDetailView } from './components/CourseDetailView';
import { ProgressView } from './components/ProgressView';
import { Footer } from './components/Footer';
import type { Course, Question } from './types';
import { MOCK_COURSES, MOCK_QUESTIONS } from './constants';

type Page = 'home' | 'questions' | 'courses' | 'courseDetail' | 'progress';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(MOCK_COURSES[0]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question>(MOCK_QUESTIONS[0]);

  const navigateTo = useCallback((page: Page) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  }, []);

  const handleSelectCourse = useCallback((course: Course) => {
    setSelectedCourse(course);
    navigateTo('courseDetail');
  }, [navigateTo]);
  
  const handleSelectQuestion = useCallback((question: Question) => {
    setSelectedQuestion(question);
    navigateTo('questions');
  }, [navigateTo]);

  const handleSelectRandomQuestion = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * MOCK_QUESTIONS.length);
    setSelectedQuestion(MOCK_QUESTIONS[randomIndex]);
    navigateTo('questions');
  }, [navigateTo]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={navigateTo} />;
      case 'questions':
        return <QuestionsView question={selectedQuestion} />;
      case 'courses':
        return <CoursesView onSelectCourse={handleSelectCourse} />;
      case 'courseDetail':
        return selectedCourse ? <CourseDetailView course={selectedCourse} onSelectQuestion={handleSelectQuestion} /> : <CoursesView onSelectCourse={handleSelectCourse} />;
      case 'progress':
        return <ProgressView onStartChallenge={handleSelectRandomQuestion} />;
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#111111] text-gray-200">
      <Header onNavigate={navigateTo} currentPage={currentPage} />
      <main className="flex-grow pt-16">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

export default App;