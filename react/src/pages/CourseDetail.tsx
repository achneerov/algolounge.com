import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuestionSearch } from '../hooks/useQuestionSearch';
import { useTags } from '../hooks/useTags';
import { useCompletion } from '../context/CompletionContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { Tag } from '../types';
import { ArrowLeft, Heart, ChevronDown, ChevronRight, Check, ExternalLink } from 'lucide-react';
import './CourseDetail.css';

interface CourseUrl {
  url: string;
  tooltip: string;
  color: string;
  visibleString?: string;
}

interface CourseQuestion {
  filename: string;
  title: string;
  urls?: CourseUrl[];
  tags?: Tag[];
}

interface CourseSection {
  title: string;
  description?: string;
  questions: CourseQuestion[];
  unitKey: string;
}

interface Course {
  course_name: string;
  course_description: string;
  [key: string]: unknown;
}

export function CourseDetail() {
  const { filename } = useParams<{ filename: string }>();
  const navigate = useNavigate();
  const { allQuestions, isLoaded: questionsLoaded } = useQuestionSearch();
  const { getDifficultyTag, getTags } = useTags();
  const { isCompleted } = useCompletion();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Extract sections from course data
  const extractSections = useCallback((courseData: Course) => {
    const sections: CourseSection[] = [];

    const formatTitle = (key: string) => {
      return key
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const formatQuestionTitle = (filename: string) => {
      return filename
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const enrichQuestion = (question: { filename: string; urls?: CourseUrl[] }): CourseQuestion => {
      const questionData = allQuestions.find(q => q.filename === question.filename);
      const tags: Tag[] = [];

      if (questionData) {
        tags.push(getDifficultyTag(questionData.difficulty));
        if (questionData.tags.length > 0) {
          tags.push(...getTags(questionData.tags));
        }
      }

      return {
        filename: question.filename,
        title: formatQuestionTitle(question.filename),
        urls: question.urls,
        tags
      };
    };

    for (const [key, value] of Object.entries(courseData)) {
      if (key !== 'course_name' && key !== 'course_description' && key !== 'duration' &&
          key !== 'difficulty' && key !== 'filename' && key !== 'keywords' && key !== 'badge') {
        if (typeof value === 'object' && value !== null) {
          // This is a container for sections (units, weeks, etc.)
          for (const [sectionKey, sectionValue] of Object.entries(value as Record<string, unknown>)) {
            if (typeof sectionValue === 'object' && sectionValue !== null) {
              const section = sectionValue as { title?: string; description?: string; questions?: unknown[] };
              const sectionData: CourseSection = {
                title: section.title || formatTitle(sectionKey),
                description: section.description,
                questions: [],
                unitKey: sectionKey
              };

              if (section.questions && Array.isArray(section.questions)) {
                for (const q of section.questions) {
                  if (typeof q === 'string') {
                    sectionData.questions.push(enrichQuestion({ filename: q }));
                  } else if (typeof q === 'object' && q !== null && 'filename' in q) {
                    sectionData.questions.push(enrichQuestion(q as { filename: string; urls?: CourseUrl[] }));
                  }
                }
              }

              sections.push(sectionData);
            }
          }
        }
      }
    }

    return sections;
  }, [allQuestions, getDifficultyTag, getTags]);

  // Load course
  useEffect(() => {
    if (!filename || !questionsLoaded) return;

    setLoading(true);
    fetch(`/courses/${filename}.json`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data: Course) => {
        setCourse(data);
        const sections = extractSections(data);
        setCourseSections(sections);
        // Expand first section by default
        if (sections.length > 0) {
          setExpandedSections(new Set([sections[0].unitKey]));
        }
        setLoading(false);
      })
      .catch(() => {
        navigate('/courses');
      });
  }, [filename, questionsLoaded, extractSections, navigate]);

  const toggleSection = useCallback((unitKey: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(unitKey)) {
        next.delete(unitKey);
      } else {
        next.add(unitKey);
      }
      return next;
    });
  }, []);

  const handleQuestionClick = useCallback((questionFilename: string) => {
    window.open(`/questions/${questionFilename}`, '_blank');
  }, []);

  const handleUrlClick = useCallback((e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank');
  }, []);

  const handleToggleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/auth/sign-in');
      return;
    }
    if (filename) {
      await toggleFavorite(filename);
    }
  }, [isAuthenticated, navigate, filename, toggleFavorite]);

  // Progress calculations
  const totalQuestions = useMemo(() => {
    return courseSections.reduce((sum, section) => sum + section.questions.length, 0);
  }, [courseSections]);

  const completedCount = useMemo(() => {
    let count = 0;
    courseSections.forEach(section => {
      section.questions.forEach(q => {
        if (isCompleted(q.filename)) count++;
      });
    });
    return count;
  }, [courseSections, isCompleted]);

  const overallProgress = totalQuestions > 0 ? Math.round((completedCount / totalQuestions) * 100) : 0;

  const getSectionProgress = useCallback((section: CourseSection) => {
    const completed = section.questions.filter(q => isCompleted(q.filename)).length;
    return section.questions.length > 0 ? Math.round((completed / section.questions.length) * 100) : 0;
  }, [isCompleted]);

  const getSectionCompletedCount = useCallback((section: CourseSection) => {
    return section.questions.filter(q => isCompleted(q.filename)).length;
  }, [isCompleted]);

  if (loading || !course) {
    return (
      <div className="course-detail-page">
        <div className="loading">
          <div className="spinner" />
          <span>Loading course...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      <div className="course-detail-header">
        <button className="back-btn" onClick={() => navigate('/courses')}>
          <ArrowLeft size={20} />
          <span>Back to Courses</span>
        </button>

        <div className="course-info">
          <div className="course-title-row">
            <h1>{course.course_name}</h1>
            <button
              className={`favorite-btn ${isFavorite(filename || '') ? 'active' : ''}`}
              onClick={handleToggleFavorite}
              aria-label={isFavorite(filename || '') ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart size={20} fill={isFavorite(filename || '') ? 'currentColor' : 'none'} />
            </button>
          </div>
          <p className="course-description">{course.course_description}</p>

          <div className="course-progress">
            <div className="progress-text">
              <span>{completedCount} of {totalQuestions} problems completed</span>
              <span>{overallProgress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="course-sections">
        {courseSections.map((section, index) => (
          <div key={section.unitKey} className="section">
            <button
              className="section-header"
              onClick={() => toggleSection(section.unitKey)}
            >
              <div className="section-toggle">
                {expandedSections.has(section.unitKey) ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
              </div>
              <div className="section-info">
                <span className="section-number">{index + 1}</span>
                <div className="section-title-wrapper">
                  <h3>{section.title}</h3>
                  {section.description && (
                    <p className="section-description">{section.description}</p>
                  )}
                </div>
              </div>
              <div className="section-progress">
                <span className="progress-count">
                  {getSectionCompletedCount(section)}/{section.questions.length}
                </span>
                <div className="mini-progress-bar">
                  <div
                    className="mini-progress-fill"
                    style={{ width: `${getSectionProgress(section)}%` }}
                  />
                </div>
              </div>
            </button>

            {expandedSections.has(section.unitKey) && (
              <div className="section-content">
                <ul className="questions-list">
                  {section.questions.map((question) => (
                    <li key={question.filename}>
                      <button
                        className="question-item"
                        onClick={() => handleQuestionClick(question.filename)}
                      >
                        <div className="question-status">
                          {isCompleted(question.filename) ? (
                            <Check size={16} className="completed-icon" />
                          ) : (
                            <div className="uncompleted-circle" />
                          )}
                        </div>
                        <div className="question-content">
                          <span className="question-title">{question.title}</span>
                          {question.tags && question.tags.length > 0 && (
                            <div className="question-tags">
                              {question.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="tag"
                                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                                >
                                  {tag.text}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="question-actions">
                          {question.urls && question.urls.map((url, i) => (
                            <button
                              key={i}
                              className="url-btn"
                              onClick={(e) => handleUrlClick(e, url.url)}
                              title={url.tooltip}
                              style={{ color: url.color }}
                            >
                              <ExternalLink size={14} />
                            </button>
                          ))}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
