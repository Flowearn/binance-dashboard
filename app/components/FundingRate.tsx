'use client';

import React, { useEffect, useState } from 'react';
import { useWebSocketManager } from '../hooks/useWebSocketManager';

interface FundingRateData {
  rate: number;
  nextSettlement: Date;
}

const FundingRate: React.FC = () => {
  const [fundingRate, setFundingRate] = useState<FundingRateData>({
    rate: 0,
    nextSettlement: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);
  const symbol = 'btcusdt';

  const { error } = useWebSocketManager(`${symbol}@markPrice@1s`, {
    onMessage: (data) => {
      if (data.r) {
        const rate = parseFloat(data.r) * 100;
        const nextSettlement = new Date(Math.ceil(Date.now() / (8 * 3600000)) * 8 * 3600000);
        setFundingRate({ rate, nextSettlement });
        setIsLoading(false);
      }
    },
    onOpen: () => setIsLoading(false)
  });

  // Initial funding rate fetch
  useEffect(() => {
    fetch('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT')
      .then(response => response.json())
      .then(data => {
        const rate = parseFloat(data.lastFundingRate) * 100;
        const nextSettlement = new Date(Math.ceil(Date.now() / (8 * 3600000)) * 8 * 3600000);
        setFundingRate({ rate, nextSettlement });
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching funding rate:', error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="box">
        <h2>Funding Rate</h2>
        <div className="loading-container">
          <div className="loading-text">Loading funding rate data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="box">
        <h2>Funding Rate</h2>
        <div className="error-container">
          <div className="error-text">{error}</div>
        </div>
      </div>
    );
  }

  const rateClass = fundingRate.rate >= 0 ? 'trend-up' : 'trend-down';

  return (
    <div className="box">
      <h2>Funding Rate</h2>
      <div className={rateClass} style={{ fontSize: '24px', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
        Current Rate: {fundingRate.rate.toFixed(4)}%
      </div>
      <div className="next-funding" style={{ textAlign: 'center' }}>
        Next Settlement: {fundingRate.nextSettlement.toLocaleTimeString()}
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
        (Positive: Longs pay Shorts, Negative: Shorts pay Longs)
      </div>
    </div>
  );
};

export default FundingRate; 