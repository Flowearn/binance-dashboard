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

interface KlineData {
  t: number; // Timestamp
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  c: string; // Close price
  v: string; // Volume
}

const KlineChart: React.FC = () => {
  const [klineData, setKlineData] = useState<KlineData[]>([]);
  const symbol = 'btcusdt';
  const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@kline_1m`;

  const { lastMessage } = useWebSocket(wsUrl);

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      if (data.k) {
        setKlineData(prevData => {
          const newData = [...prevData, {
            t: data.k.t,
            o: data.k.o,
            h: data.k.h,
            l: data.k.l,
            c: data.k.c,
            v: data.k.v
          }].slice(-30);
          return newData;
        });
      }
    }
  }, [lastMessage]);

  const chartData = {
    labels: klineData.map(k => new Date(k.t).toLocaleTimeString()),
    datasets: [
      {
        label: 'Price',
        data: klineData.map(k => parseFloat(k.c)),
        borderColor: 'rgb(75, 192, 192)',
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
        text: 'BTC/USDT Price Chart'
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Price Chart (1m)</h2>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default KlineChart; 