import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestionSearch } from '../hooks/useQuestionSearch';
import { useTags } from '../hooks/useTags';
import { useCompletion } from '../context/CompletionContext';
import { useSidebar } from '../context/SidebarContext';
import { QuestionSearchResult } from '../types';
import { Search, X, Check, ChevronDown, Tag } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  currentQuestionFilename: string;
}

export function Sidebar({ currentQuestionFilename }: SidebarProps) {
  const navigate = useNavigate();
  const { isLoaded, allQuestions, searchQuestions, getUniqueTags } = useQuestionSearch();
  const { getDifficultyColor, getTagColor } = useTags();
  const { isCompleted } = useCompletion();
  const { isVisible } = useSidebar();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState<boolean | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showTagsPopover, setShowTagsPopover] = useState(false);

  const tagsRef = useRef<HTMLDivElement>(null);

  const availableTags = useMemo(() => getUniqueTags(), [getUniqueTags]);

  const filteredQuestions = useMemo(() => {
    let result = searchQuery.trim() ? searchQuestions(searchQuery) : allQuestions;

    // Difficulty filter
    if (selectedDifficulty) {
      result = result.filter(q => q.difficulty.toLowerCase() === selectedDifficulty.toLowerCase());
    }

    // Tag filter
    if (selectedTag) {
      result = result.filter(q =>
        q.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
      );
    }

    // Completion filter
    if (showCompleted !== null) {
      result = result.filter(q => {
        const completed = isCompleted(q.filename);
        return showCompleted ? completed : !completed;
      });
    }

    // Sort by difficulty, then by first tag
    const difficultyOrder: Record<string, number> = {
      'easy': 1,
      'medium': 2,
      'hard': 3
    };

    return result.sort((a, b) => {
      const diffA = difficultyOrder[a.difficulty.toLowerCase()] || 999;
      const diffB = difficultyOrder[b.difficulty.toLowerCase()] || 999;

      if (diffA !== diffB) return diffA - diffB;

      const tagA = a.tags[0]?.toLowerCase() || '';
      const tagB = b.tags[0]?.toLowerCase() || '';
      return tagA.localeCompare(tagB);
    });
  }, [allQuestions, searchQuestions, searchQuery, selectedDifficulty, selectedTag, showCompleted, isCompleted]);

  const toggleDifficulty = useCallback((difficulty: string) => {
    setSelectedDifficulty(prev => prev === difficulty ? null : difficulty);
  }, []);

  const toggleStatus = useCallback((completed: boolean) => {
    setShowCompleted(prev => prev === completed ? null : completed);
  }, []);

  const selectTag = useCallback((tag: string) => {
    setSelectedTag(tag);
    setShowTagsPopover(false);
  }, []);

  const clearTag = useCallback(() => {
    setSelectedTag(null);
    setShowTagsPopover(false);
  }, []);

  const handleSelect = useCallback((filename: string) => {
    navigate(`/questions/${filename}`);
  }, [navigate]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagsRef.current && !tagsRef.current.contains(event.target as Node)) {
        setShowTagsPopover(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDifficultyLabel = (difficulty: string) => {
    return difficulty.toLowerCase() === 'medium' ? 'Med' : difficulty;
  };

  if (!isVisible) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filters">
          <div className="filter-group">
            {['Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                className={`filter-btn difficulty ${selectedDifficulty === diff ? 'active' : ''}`}
                style={{
                  '--difficulty-color': getDifficultyColor(diff)
                } as React.CSSProperties}
                onClick={() => toggleDifficulty(diff)}
              >
                {getDifficultyLabel(diff)}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <button
              className={`filter-btn status ${showCompleted === true ? 'active' : ''}`}
              onClick={() => toggleStatus(true)}
            >
              <Check size={12} />
              Done
            </button>
            <button
              className={`filter-btn status ${showCompleted === false ? 'active' : ''}`}
              onClick={() => toggleStatus(false)}
            >
              Todo
            </button>
          </div>

          <div className="tags-section" ref={tagsRef}>
            <button
              className={`filter-btn tags-btn ${selectedTag ? 'active' : ''}`}
              onClick={() => setShowTagsPopover(!showTagsPopover)}
            >
              <Tag size={12} />
              {selectedTag || 'Tags'}
              <ChevronDown size={12} />
            </button>

            {showTagsPopover && (
              <div className="tags-popover">
                <button className="tag-option clear" onClick={clearTag}>
                  Clear Filter
                </button>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    className={`tag-option ${selectedTag === tag ? 'selected' : ''}`}
                    onClick={() => selectTag(tag)}
                  >
                    <span
                      className="tag-dot"
                      style={{ backgroundColor: getTagColor(tag) }}
                    />
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="results-count">
          {filteredQuestions.length} questions
        </div>
      </div>

      <div className="sidebar-content">
        {!isLoaded ? (
          <div className="sidebar-loading">
            <div className="spinner" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="sidebar-empty">No questions found</div>
        ) : (
          <ul className="question-list">
            {filteredQuestions.map((question) => (
              <li key={question.filename}>
                <button
                  className={`question-item ${currentQuestionFilename === question.filename ? 'active' : ''}`}
                  onClick={() => handleSelect(question.filename)}
                >
                  <div className="question-info">
                    <span
                      className="question-difficulty"
                      style={{ color: getDifficultyColor(question.difficulty) }}
                    >
                      {getDifficultyLabel(question.difficulty)}
                    </span>
                    <span className="question-title">{question.title}</span>
                  </div>
                  {isCompleted(question.filename) && (
                    <Check size={14} className="completed-icon" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
