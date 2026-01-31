import { useState } from 'react';
import { Tag } from '../types';
import { Check } from 'lucide-react';
import './ContentTabs.css';

interface ContentTabsProps {
  description: string;
  solutionText: string;
  solutionCode: string;
  questionTags: Tag[];
  isCompleted: boolean;
}

export function ContentTabs({
  description,
  solutionText,
  solutionCode,
  questionTags,
  isCompleted
}: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'solution'>('description');

  return (
    <div className="content-tabs">
      <div className="tabs-header">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button
            className={`tab ${activeTab === 'solution' ? 'active' : ''}`}
            onClick={() => setActiveTab('solution')}
          >
            Solution
          </button>
        </div>

        <div className="tabs-right">
          {isCompleted && (
            <div className="completion-badge">
              <Check size={14} />
              <span>Completed</span>
            </div>
          )}
        </div>
      </div>

      <div className="tabs-content">
        {activeTab === 'description' ? (
          <div className="tab-panel description">
            {questionTags.length > 0 && (
              <div className="tags-list">
                {questionTags.map((tag, index) => (
                  <span
                    key={index}
                    className="tag"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.text}
                  </span>
                ))}
              </div>
            )}
            <div
              className="description-content"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>
        ) : (
          <div className="tab-panel solution">
            <div
              className="description-content"
              dangerouslySetInnerHTML={{ __html: solutionText }}
            />
            {solutionCode && (
              <div className="solution-code">
                <div className="code-header">Solution Code</div>
                <pre>
                  <code>{solutionCode}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
