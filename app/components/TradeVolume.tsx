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
            <div className="flex justify-between items-center text-sm mb-1">
              <div className="flex items-center">
                <span className="font-medium">{category.name}</span>
                <span className="text-gray-500 ml-2">({category.range})</span>
              </div>
              <span className="font-medium">{category.percentage}%</span>
            </div>
            <div className="relative h-6">
              <div 
                className="volume-bar absolute left-0 top-0"
                style={{ width: `${category.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 