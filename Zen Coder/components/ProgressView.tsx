import React from 'react';
import { MOCK_PROGRESS_DATA, MOTIVATIONAL_QUOTES } from '../constants';
import { FlameIcon, BrainCircuitIcon, CalendarIcon, CheckCircleIcon, TrophyIcon, TargetIcon, ShieldCheckIcon, AwardIcon, ClipboardListIcon, RocketIcon } from './IconComponents';
import type { ProgressData, Achievement } from '../types';

interface ProgressViewProps {
  onStartChallenge: () => void;
}

const iconMap: { [key in Achievement['icon']]: React.FC<any> } = {
  flame: FlameIcon,
  'check-circle': CheckCircleIcon,
  target: TargetIcon,
  award: AwardIcon,
  trophy: TrophyIcon,
};

const TodaysQuest: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const quoteIndex = new Date().getDate() % MOTIVATIONAL_QUOTES.length;
  const quote = MOTIVATIONAL_QUOTES[quoteIndex];

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 text-emerald-500/10">
            <RocketIcon className="w-full h-full" />
        </div>
        <div className="relative z-10">
            <h3 className="text-xl font-bold text-gray-100">Today's Quest</h3>
            <p className="text-gray-400 mt-2 mb-4 italic">"{quote}"</p>
            <button
                onClick={onStart}
                className="bg-emerald-500 text-white font-semibold px-6 py-2 rounded-md hover:bg-emerald-600 transition-all transform hover:scale-105"
            >
                Start Today's Challenge
            </button>
        </div>
    </div>
  );
};

const ActivityHeatmap: React.FC<{ activity: ProgressData['activity'] }> = ({ activity }) => {
  const activityMap = new Map(activity.map(a => [a.date, a.count]));
  const today = new Date();
  const days = Array.from({ length: 365 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const getColor = (count: number) => {
    if (count > 4) return 'bg-emerald-500';
    if (count > 2) return 'bg-emerald-600';
    if (count > 0) return 'bg-emerald-700';
    return 'bg-gray-800';
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-emerald-400" />
        Activity Heatmap
      </h3>
      <div className="grid grid-rows-7 grid-flow-col gap-1 overflow-x-auto pb-2">
        {days.map(day => (
          <div key={day} className={`w-3.5 h-3.5 rounded-sm ${getColor(activityMap.get(day) || 0)}`} title={`${day}: ${activityMap.get(day) || 0} problems`}></div>
        ))}
      </div>
    </div>
  );
};

const Achievements: React.FC<{ achievements: ProgressData['achievements'] }> = ({ achievements }) => (
  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
    <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
      <TrophyIcon className="w-5 h-5 text-emerald-400" />
      Achievements
    </h3>
    <div className="grid grid-cols-4 gap-4">
      {achievements.map(ach => {
        const Icon = iconMap[ach.icon];
        return (
          <div key={ach.id} className="relative group flex justify-center" title={`${ach.name}: ${ach.description}`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${ach.unlocked ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-gray-700/50 border-gray-600 text-gray-500'}`}>
              <Icon className="w-7 h-7" />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const SkillMastery: React.FC<{ skills: ProgressData['skills'] }> = ({ skills }) => (
  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
    <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
      <BrainCircuitIcon className="w-5 h-5 text-emerald-400" />
      Skill Mastery
    </h3>
    <div className="space-y-4">
      {skills.map(skill => (
        <div key={skill.name}>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-200">{skill.name}</span>
              {skill.level >= 80 && <span title="Mastered"><ShieldCheckIcon className="w-4 h-4 text-sky-400" /></span>}
            </div>
            <span className="text-xs font-mono text-gray-400">{skill.level}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${skill.level}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SpacedRepetition: React.FC<{ reviews: ProgressData['reviews'] }> = ({ reviews }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calculateDays = (dateStr: string) => {
    const date = new Date(dateStr);
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const diffTime = utcDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
        <ClipboardListIcon className="w-5 h-5 text-emerald-400" />
        Upcoming Reviews
      </h3>
      <ul className="space-y-3">
        {reviews.sort((a,b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()).map(review => {
          const daysUntil = calculateDays(review.nextReviewDate);
          let timeText, textColor;

          if (daysUntil < 0) {
            timeText = `Overdue`;
            textColor = 'text-red-400';
          } else if (daysUntil === 0) {
            timeText = 'Due today';
            textColor = 'text-yellow-400';
          } else {
            timeText = `In ${daysUntil}d`;
            textColor = 'text-sky-400';
          }
           return (
            <li key={review.topic} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-200">{review.topic}</p>
                <p className="text-xs text-gray-500">Last reviewed: {new Date(review.lastReviewed).toLocaleDateString()}</p>
              </div>
              <span className={`text-sm font-semibold ${textColor}`}>{timeText}</span>
            </li>
           )
        })}
      </ul>
    </div>
  );
};


export const ProgressView: React.FC<ProgressViewProps> = ({ onStartChallenge }) => {
  const data = MOCK_PROGRESS_DATA;
  const xpPercentage = (data.xp / data.xpToNextLevel) * 100;
  const streakPercentage = Math.min((data.currentStreak / data.longestStreak) * 100, 100);

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-gray-100 mb-8">Your Progress</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <TodaysQuest onStart={onStartChallenge} />

          {/* Level Card */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-2xl text-white">Level {data.level}</p>
                <p className="text-emerald-400 font-semibold">{data.rank}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono text-gray-300">{data.xp} / {data.xpToNextLevel} XP</p>
                <p className="text-xs text-gray-500">To next level</p>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
              <div className="bg-gradient-to-r from-emerald-500 to-sky-500 h-2.5 rounded-full" style={{ width: `${xpPercentage}%` }}></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Streak Card */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5 flex flex-col items-center justify-center text-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-gray-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
                    <circle
                      className="text-emerald-500"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 42}
                      strokeDashoffset={2 * Math.PI * 42 * (1 - streakPercentage / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="50"
                      cy="50"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <FlameIcon className="w-8 h-8 text-orange-400 mb-1" />
                    <span className="text-4xl font-bold text-white">{data.currentStreak}</span>
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-200 mt-3">Day Streak</p>
                <p className="text-xs text-gray-500">Longest: {data.longestStreak} days</p>
            </div>
            {/* Other Stats */}
            <div className="space-y-4">
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400">Longest Streak</p>
                  <p className="text-2xl font-bold text-white">{data.longestStreak} days</p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400">Total Solved</p>
                  <p className="text-2xl font-bold text-white">{data.totalSolved}</p>
              </div>
            </div>
          </div>
          
          <ActivityHeatmap activity={data.activity} />
        </div>

        {/* Side Column */}
        <div className="space-y-6">
          <Achievements achievements={data.achievements} />
          <SkillMastery skills={data.skills} />
          <SpacedRepetition reviews={data.reviews} />
        </div>
      </div>
    </div>
  );
};