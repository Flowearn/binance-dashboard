'use client';

interface VolumeCategory {
  name: string;
  range: string;
  percentage: number;
}

const TradeVolume = () => {
  const categories: VolumeCategory[] = [
    { name: 'Super Large', range: '>$1M', percentage: 25 },
    { name: 'Large', range: '$100K-$1M', percentage: 35 },
    { name: 'Medium', range: '$10K-$100K', percentage: 20 },
    { name: 'Small', range: '$1K-$10K', percentage: 15 },
    { name: 'Super Small', range: '<$1K', percentage: 5 },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4">Trade Volume Classification</h2>
      <div className="space-y-4">
        {categories.map((category, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span>{category.name} ({category.range})</span>
              <span>{category.percentage}%</span>
            </div>
            <div 
              className="h-6 bg-[#E3F2FD] rounded" 
              style={{ width: `${category.percentage}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradeVolume; 