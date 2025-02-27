'use client';

import React, { useEffect, useState } from 'react';

interface FundingRateData {
  symbol: string;
  fundingRate: string;
  nextFundingTime: number;
}

const FundingRate: React.FC = () => {
  const [fundingRates, setFundingRates] = useState<FundingRateData[]>([]);

  useEffect(() => {
    const fetchFundingRates = async () => {
      try {
        const response = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex');
        const data = await response.json();
        setFundingRates(data);
      } catch (error) {
        console.error('Error fetching funding rates:', error);
      }
    };

    fetchFundingRates();
    const interval = setInterval(fetchFundingRates, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Funding Rates</h2>
      <div className="overflow-auto max-h-[400px]">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">Symbol</th>
              <th className="px-4 py-2">Funding Rate</th>
              <th className="px-4 py-2">Next Funding</th>
            </tr>
          </thead>
          <tbody>
            {fundingRates.map((rate) => (
              <tr key={rate.symbol} className="border-b">
                <td className="px-4 py-2">{rate.symbol}</td>
                <td className="px-4 py-2">
                  {(parseFloat(rate.fundingRate) * 100).toFixed(4)}%
                </td>
                <td className="px-4 py-2">
                  {new Date(rate.nextFundingTime).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FundingRate; 