import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCalendarDays, TODAY } from '../api/mock';
import type { CalendarDay } from '../types';

interface VisitCalendarProps {
  initialYear?: number;
  initialMonth?: number;
}

const NOW = new Date();

export default function VisitCalendar({
  initialYear = NOW.getFullYear(),
  initialMonth = NOW.getMonth() + 1,
}: VisitCalendarProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const days = getCalendarDays(year, month);

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const prevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const goToday = () => {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const getDayData = (day: number): CalendarDay | undefined =>
    days.find((d) => parseInt(d.date.split('-')[2], 10) === day);

  const isToday = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === TODAY;
  };

  const isSunday = (dayIndex: number) => dayIndex % 7 === 0;

  return (
    <div className="panel-card p-4 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="panel-title">방문 현황 캘린더</h3>
        <button
          type="button"
          onClick={goToday}
          className="btn-ghost-sm"
        >
          오늘
        </button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-bold text-gray-900">
          {year}.{String(month).padStart(2, '0')}
        </span>
        <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px text-center text-[10px] mb-0.5">
        {weekDays.map((wd, i) => (
          <div key={wd} className={`py-0.5 font-medium ${i === 0 ? 'text-red-500' : 'text-gray-500'}`}>
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}
        {days.map((_, idx) => {
          const day = idx + 1;
          const data = getDayData(day);
          const dayOfWeek = (firstDayOfWeek + idx) % 7;
          const today = isToday(day);

          return (
            <div
              key={day}
              title={data ? `${data.visitCount}명 방문` : undefined}
              className={`h-8 flex flex-col items-center justify-center rounded-md text-[10px] leading-tight transition-colors ${
                today ? 'bg-primary text-white font-bold shadow-sm' : 'hover:bg-gray-50'
              }`}
            >
              <span className={!today && isSunday(dayOfWeek) ? 'text-red-500' : ''}>{day}</span>
              {data && data.visitCount > 0 && (
                <span className="flex items-center gap-0.5 mt-0.5">
                  {data.newCount > 0 && (
                    <span className={`w-1 h-1 rounded-full ${today ? 'bg-green-200' : 'bg-green-500'}`} />
                  )}
                  {data.returningCount > 0 && (
                    <span className={`w-1 h-1 rounded-full ${today ? 'bg-blue-200' : 'bg-primary'}`} />
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          신규
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          재진
        </span>
      </div>
    </div>
  );
}
