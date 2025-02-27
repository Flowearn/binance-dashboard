import React, { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface VolumeData {
  timestamp: number;
  volume: number;
  trades: number;
}

const VolumePulse: React.FC = () => {
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const symbol = 'btcusdt';
  const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@aggTrade`;

  const { lastMessage } = useWebSocket(wsUrl);

  useEffect(() => {
    if (lastMessage) {
      const trade = JSON.parse(lastMessage.data);
      const volume = parseFloat(trade.q) * parseFloat(trade.p); // quantity * price

      setVolumeData(prev => {
        const now = Date.now();
        const newData = [...prev];
        
        // Group trades into 10-second buckets
        const currentBucket = Math.floor(now / 10000) * 10000;
        const lastEntry = newData[newData.length - 1];

        if (lastEntry && lastEntry.timestamp === currentBucket) {
          lastEntry.volume += volume;
          lastEntry.trades += 1;
        } else {
          newData.push({
            timestamp: currentBucket,
            volume: volume,
            trades: 1
          });
        }

        // Keep last 30 buckets (5 minutes) of data
        return newData.slice(-30);
      });
    }
  }, [lastMessage]);

  const chartData = {
    labels: volumeData.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Volume',
        data: volumeData.map(d => d.volume),
        backgroundColor: volumeData.map(d => 
          d.volume > (d.trades * 1000) ? 'rgba(75, 192, 75, 0.5)' : 'rgba(255, 99, 132, 0.5)'
        ),
        borderColor: volumeData.map(d => 
          d.volume > (d.trades * 1000) ? 'rgb(75, 192, 75)' : 'rgb(255, 99, 132)'
        ),
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'BTC/USDT Volume Pulse (10s)'
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const dataIndex = context.dataIndex;
            const data = volumeData[dataIndex];
            return [
              `Volume: ${data.volume.toFixed(2)} USDT`,
              `Trades: ${data.trades}`,
              `Avg Size: ${(data.volume / data.trades).toFixed(2)} USDT`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Volume (USDT)'
        }
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Volume Pulse</h2>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default VolumePulse; 