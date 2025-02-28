'use client';

interface VolumeCategory {
  name: string;
  range: string;
  percentage: number;
}

export default function TradeVolume() {
  const categories: VolumeCategory[] = [
    { name: 'Super Large', range: '>$1M', percentage: 25 },
    { name: 'Large', range: '$100K-$1M', percentage: 35 },
    { name: 'Medium', range: '$10K-$100K', percentage: 20 },
    { name: 'Small', range: '$1K-$10K', percentage: 15 },
    { name: 'Super Small', range: '<$1K', percentage: 5 },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Trade Volume Classification</h2>
      <div className="space-y-4">
        {categories.map((category, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span>{category.name} ({category.range})</span>
              <span>{category.percentage}%</span>
            </div>
            <div 
              className="volume-bar"
              style={{ 
                width: `${category.percentage}%`,
                backgroundColor: 'var(--light-blue)'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 