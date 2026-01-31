import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseSearch } from '../hooks/useCourseSearch';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { CourseSearchResult } from '../types';
import { Search, X, Heart, BookOpen } from 'lucide-react';
import './Courses.css';

export function Courses() {
  const navigate = useNavigate();
  const { isLoaded, allCourses, searchCourses } = useCourseSearch();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [showingFavorites, setShowingFavorites] = useState(false);

  const favoriteCourses = useMemo(() => {
    return allCourses.filter(c => favorites.includes(c.filename));
  }, [allCourses, favorites]);

  const displayResults = useMemo(() => {
    let results: CourseSearchResult[];

    if (showingFavorites) {
      results = searchTerm
        ? favoriteCourses.filter(c =>
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.filename.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : favoriteCourses;
    } else {
      results = searchTerm ? searchCourses(searchTerm) : allCourses;
    }

    // Sort: favorites first, then alphabetically
    const favoriteFilenames = new Set(favorites);
    const favorited = results.filter(c => favoriteFilenames.has(c.filename));
    const nonFavorited = results.filter(c => !favoriteFilenames.has(c.filename));

    favorited.sort((a, b) => a.title.localeCompare(b.title));
    nonFavorited.sort((a, b) => a.title.localeCompare(b.title));

    return showingFavorites ? results : [...favorited, ...nonFavorited];
  }, [showingFavorites, searchTerm, favoriteCourses, allCourses, searchCourses, favorites]);

  const handleSelect = useCallback((course: CourseSearchResult) => {
    navigate(`/courses/${course.filename}`);
  }, [navigate]);

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent, course: CourseSearchResult) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/auth/sign-in');
      return;
    }

    await toggleFavorite(course.filename);
  }, [isAuthenticated, navigate, toggleFavorite]);

  const getSearchResultText = () => {
    if (showingFavorites) {
      if (searchTerm) {
        return `Showing ${displayResults.length} of ${favoriteCourses.length} favorites`;
      }
      return `${favoriteCourses.length} ${favoriteCourses.length === 1 ? 'favorite' : 'favorites'}`;
    } else {
      if (searchTerm) {
        return `Showing ${displayResults.length} of ${allCourses.length} courses`;
      }
      return `${allCourses.length} ${allCourses.length === 1 ? 'course' : 'courses'}`;
    }
  };

  const getEmptyStateTitle = () => {
    if (showingFavorites && favoriteCourses.length === 0) {
      return 'No Favorites Yet';
    }
    if (showingFavorites && favoriteCourses.length > 0) {
      return 'No Matches Found';
    }
    if (searchTerm) {
      return `No results for "${searchTerm}"`;
    }
    return 'No Courses Found';
  };

  const getEmptyStateMessage = () => {
    if (showingFavorites && favoriteCourses.length === 0) {
      return 'Start building your personalized learning path by adding courses to your favorites. Click the heart icon on any course to get started.';
    }
    if (showingFavorites && favoriteCourses.length > 0) {
      return 'No favorites match your search. Try a different search term or clear the search to see all your favorites.';
    }
    if (searchTerm) {
      return 'Try adjusting your search term or browse all available courses.';
    }
    return 'No courses match your search. Try a different search term.';
  };

  return (
    <div className="courses-page">
      <div className="courses-header">
        <h1>Courses</h1>
        <p>Structured learning paths to master algorithms and data structures</p>
      </div>

      <div className="courses-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${!showingFavorites ? 'active' : ''}`}
            onClick={() => setShowingFavorites(false)}
          >
            <BookOpen size={16} />
            All Courses
          </button>
          <button
            className={`filter-tab ${showingFavorites ? 'active' : ''}`}
            onClick={() => setShowingFavorites(true)}
          >
            <Heart size={16} />
            Favorites
          </button>
        </div>

        <div className="results-count">
          {getSearchResultText()}
        </div>
      </div>

      <div className="courses-content">
        {!isLoaded ? (
          <div className="courses-loading">
            <div className="spinner" />
            <span>Loading courses...</span>
          </div>
        ) : displayResults.length === 0 ? (
          <div className="courses-empty">
            <BookOpen size={48} className="empty-icon" />
            <h3>{getEmptyStateTitle()}</h3>
            <p>{getEmptyStateMessage()}</p>
          </div>
        ) : (
          <div className="courses-grid">
            {displayResults.map((course) => (
              <div
                key={course.filename}
                className="course-card"
                onClick={() => handleSelect(course)}
              >
                <div className="course-card-header">
                  <h3 className="course-title">{course.title}</h3>
                  <button
                    className={`favorite-btn ${isFavorite(course.filename) ? 'active' : ''}`}
                    onClick={(e) => handleToggleFavorite(e, course)}
                    aria-label={isFavorite(course.filename) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={18} fill={isFavorite(course.filename) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <p className="course-description">{course.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
