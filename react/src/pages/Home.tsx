import { useNavigate } from 'react-router-dom';
import { useCallback, useState, useEffect } from 'react';
import { Code, BookOpen, Zap, Target, ArrowRight } from 'lucide-react';
import './Home.css';

export function Home() {
  const navigate = useNavigate();
  const [questionsIndex, setQuestionsIndex] = useState<{ questions: { filename: string }[] } | null>(null);
  const [coursesIndex, setCoursesIndex] = useState<{ courses: { filename: string }[] } | null>(null);

  useEffect(() => {
    fetch('/questions/index.json')
      .then(res => res.json())
      .then(setQuestionsIndex)
      .catch(console.error);

    fetch('/courses/index.json')
      .then(res => res.json())
      .then(setCoursesIndex)
      .catch(console.error);
  }, []);

  const navigateToRandomQuestion = useCallback(() => {
    if (questionsIndex && questionsIndex.questions.length > 0) {
      const randomIndex = Math.floor(Math.random() * questionsIndex.questions.length);
      const randomQuestion = questionsIndex.questions[randomIndex];
      navigate(`/questions/${randomQuestion.filename}`);
    } else {
      navigate('/questions/two-sum');
    }
  }, [navigate, questionsIndex]);

  const navigateToRandomCourse = useCallback(() => {
    if (coursesIndex && coursesIndex.courses.length > 0) {
      const randomIndex = Math.floor(Math.random() * coursesIndex.courses.length);
      const randomCourse = coursesIndex.courses[randomIndex];
      navigate(`/courses/${randomCourse.filename}`);
    } else {
      navigate('/courses');
    }
  }, [navigate, coursesIndex]);

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Master Algorithms,
            <br />
            <span className="highlight">One Problem at a Time</span>
          </h1>
          <p className="hero-description">
            Practice coding challenges with instant feedback. Build your skills
            with curated problem sets and structured learning paths.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={navigateToRandomQuestion}>
              <Code size={20} />
              Start Coding
              <ArrowRight size={20} />
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/courses')}>
              <BookOpen size={20} />
              Browse Courses
            </button>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-grid">
          <div className="feature-card" onClick={navigateToRandomQuestion}>
            <div className="feature-icon">
              <Zap size={24} />
            </div>
            <h3>Practice Problems</h3>
            <p>Jump into a random problem and start coding. Real-time Python execution in your browser.</p>
          </div>

          <div className="feature-card" onClick={() => navigate('/courses')}>
            <div className="feature-icon">
              <BookOpen size={24} />
            </div>
            <h3>Structured Courses</h3>
            <p>Follow curated learning paths organized by topic. Track your progress as you go.</p>
          </div>

          <div className="feature-card" onClick={navigateToRandomCourse}>
            <div className="feature-icon">
              <Target size={24} />
            </div>
            <h3>Explore a Course</h3>
            <p>Discover a random course to challenge yourself. From foundations to advanced topics.</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Level Up?</h2>
          <p>Start your journey to mastering algorithms today.</p>
          <button className="btn btn-primary btn-lg" onClick={navigateToRandomQuestion}>
            Get Started
            <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
}
