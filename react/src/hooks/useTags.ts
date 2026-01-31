import { useState, useEffect, useCallback } from 'react';
import { Tag, TagConfig } from '../types';

let cachedConfig: TagConfig | null = null;
let configPromise: Promise<TagConfig> | null = null;

async function loadTagConfig(): Promise<TagConfig> {
  if (cachedConfig) return cachedConfig;
  if (configPromise) return configPromise;

  configPromise = fetch('/tags-config.json')
    .then(res => res.json())
    .then(data => {
      cachedConfig = data;
      return data;
    });

  return configPromise;
}

const DEFAULT_COLOR = '#94a3b8';

export function useTags() {
  const [config, setConfig] = useState<TagConfig | null>(cachedConfig);
  const [isLoaded, setIsLoaded] = useState(!!cachedConfig);

  useEffect(() => {
    loadTagConfig().then(data => {
      setConfig(data);
      setIsLoaded(true);
    }).catch(err => {
      console.error('Failed to load tags config:', err);
    });
  }, []);

  const getDifficultyColor = useCallback((difficulty: string): string => {
    if (!config) return DEFAULT_COLOR;
    return config.difficulties[difficulty] || DEFAULT_COLOR;
  }, [config]);

  const getTagColor = useCallback((tagName: string): string => {
    if (!config) return DEFAULT_COLOR;
    return config.tags[tagName] || DEFAULT_COLOR;
  }, [config]);

  const getDifficultyTag = useCallback((difficulty: string): Tag => {
    return {
      text: difficulty,
      color: getDifficultyColor(difficulty)
    };
  }, [getDifficultyColor]);

  const getTag = useCallback((tagName: string): Tag => {
    return {
      text: tagName,
      color: getTagColor(tagName)
    };
  }, [getTagColor]);

  const getTags = useCallback((tagNames: string[]): Tag[] => {
    return tagNames.map(name => getTag(name));
  }, [getTag]);

  const getQuestionTags = useCallback((difficulty: string, tags: string[]): Tag[] => {
    const result: Tag[] = [];

    if (difficulty) {
      result.push(getDifficultyTag(difficulty));
    }

    if (tags && tags.length > 0) {
      result.push(...getTags(tags));
    }

    return result;
  }, [getDifficultyTag, getTags]);

  return {
    isLoaded,
    getDifficultyColor,
    getTagColor,
    getDifficultyTag,
    getTag,
    getTags,
    getQuestionTags
  };
}
