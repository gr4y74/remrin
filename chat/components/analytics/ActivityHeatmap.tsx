'use client';

interface ActivityData {
    date: string; // YYYY-MM-DD
    count: number;
}

interface ActivityHeatmapProps {
    data: ActivityData[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    // Basic implementation of a heatmap grid
    // For a real app, we'd use a more robust library like react-calendar-heatmap
    // Here we'll simulate it with a Rose Pine styled grid

    const getColorClass = (count: number) => {
        if (count === 0) return 'bg-rp-highlight-low';
        if (count < 5) return 'bg-rp-pine/20';
        if (count < 10) return 'bg-rp-pine/40';
        if (count < 20) return 'bg-rp-pine/70';
        return 'bg-rp-pine';
    };

    // Grouping data by week (simplified for demonstration)
    const weeks = Array.from({ length: 12 }, (_, i) => {
        return Array.from({ length: 7 }, (_, j) => {
            const index = i * 7 + j;
            return data[index] || { count: 0, date: '' };
        });
    });

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-rp-surface rounded-lg p-6 border border-rp-highlight-med">
            <h3 className="text-lg font-semibold text-rp-text mb-4">Activity Heatmap</h3>
            <div className="flex gap-2">
                <div className="flex flex-col gap-[7px] mt-6">
                    {dayLabels.map((day, i) => (
                        <span key={day} className="text-[10px] text-rp-subtle h-[12px] leading-none">
                            {i % 2 === 0 ? day : ''}
                        </span>
                    ))}
                </div>
                <div className="flex-1 overflow-x-auto pb-2">
                    <div className="flex gap-[3px]">
                        {weeks.map((week, weekIdx) => (
                            <div key={weekIdx} className="flex flex-col gap-[3px]">
                                {week.map((day, dayIdx) => (
                                    <div
                                        key={`${weekIdx}-${dayIdx}`}
                                        className={`w-[12px] h-[12px] rounded-sm ${getColorClass(day.count)} transition-all hover:scale-125 hover:z-10 cursor-help`}
                                        title={`${day.date || 'No data'}: ${day.count} activities`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-rp-subtle px-1">
                        <span>Nov</span>
                        <span>Dec</span>
                        <span>Jan</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-[10px] text-rp-subtle">
                <span>Less</span>
                <div className="w-[10px] h-[10px] bg-rp-highlight-low rounded-sm" />
                <div className="w-[10px] h-[10px] bg-rp-pine/20 rounded-sm" />
                <div className="w-[10px] h-[10px] bg-rp-pine/40 rounded-sm" />
                <div className="w-[10px] h-[10px] bg-rp-pine/70 rounded-sm" />
                <div className="w-[10px] h-[10px] bg-rp-pine rounded-sm" />
                <span>More</span>
            </div>
        </div>
    );
}
