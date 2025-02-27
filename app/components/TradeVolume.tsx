'use client';

import React, { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TradeData {
  timestamp: number;
  buyVolume: number;
  sellVolume: number;
}

const TradeVolume: React.FC = () => {
  const [tradeHistory, setTradeHistory] = useState<TradeData[]>([]);
  const symbol = 'btcusdt';
  const wsUrl = `wss://fstream.binance.com/ws/${symbol}@aggTrade`;

  const { lastMessage } = useWebSocket(wsUrl);

  useEffect(() => {
    if (lastMessage) {
      const trade = JSON.parse(lastMessage.data);
      const isBuyerMaker = trade.m; // true for sell, false for buy
      const volume = parseFloat(trade.q) * parseFloat(trade.p); // quantity * price

      setTradeHistory(prev => {
        const now = Date.now();
        const newData = [...prev];
        
        // Group trades into 1-minute buckets
        const currentMinute = Math.floor(now / 60000) * 60000;
        const lastEntry = newData[newData.length - 1];

        if (lastEntry && lastEntry.timestamp === currentMinute) {
          if (isBuyerMaker) {
            lastEntry.sellVolume += volume;
          } else {
            lastEntry.buyVolume += volume;
          }
        } else {
          newData.push({
            timestamp: currentMinute,
            buyVolume: isBuyerMaker ? 0 : volume,
            sellVolume: isBuyerMaker ? volume : 0
          });
        }

        // Keep last 30 minutes of data
        return newData.slice(-30);
      });
    }
  }, [lastMessage]);

  const chartData = {
    labels: tradeHistory.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Buy Volume',
        data: tradeHistory.map(d => d.buyVolume),
        borderColor: 'rgb(75, 192, 75)',
        backgroundColor: 'rgba(75, 192, 75, 0.5)',
        tension: 0.1
      },
      {
        label: 'Sell Volume',
        data: tradeHistory.map(d => d.sellVolume),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1
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
        text: 'BTC/USDT Trade Volume Classification'
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
      <h2 className="text-xl font-bold mb-4">Trade Volume Classification</h2>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default TradeVolume; 