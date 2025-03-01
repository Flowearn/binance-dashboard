'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { formatNumber } from '@/lib/utils';

type OrderBookEntry = [string, string]; // [price, quantity]

interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastUpdateId: number;
  timestamp: number;
}

interface OrderBookProps {
  symbol: string;
}

export function OrderBook({ symbol }: OrderBookProps) {
  const { data, isLoading, error } = useQuery<OrderBookData>({
    queryKey: ["orderbook", symbol],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/binance?endpoint=orderbook&symbol=${symbol}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch order book data');
        }
        return response.json();
      } catch (err) {
        console.error('Error fetching order book:', err);
        throw err;
      }
    },
    refetchInterval: 1000,
  });

  if (isLoading) {
    return (
      <Card className="w-full min-h-[400px] flex items-center justify-center">
        <CardContent>
          <div className="text-muted-foreground">Loading order book...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full min-h-[400px] flex items-center justify-center">
        <CardContent>
          <div className="text-red-500">
            {error instanceof Error ? error.message : 'Error loading order book'}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.bids?.length || !data?.asks?.length) {
    return (
      <Card className="w-full min-h-[400px] flex items-center justify-center">
        <CardContent>
          <div className="text-muted-foreground">No order book data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Order Book</CardTitle>
        <div className="text-sm text-muted-foreground">
          Last update: {new Date(data?.timestamp || Date.now()).toLocaleTimeString()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Bids (Buy Orders) */}
          <div>
            <div className="mb-2 text-sm font-semibold text-green-500">Buy Orders</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.bids.slice(0, 10).map(([price, quantity]: OrderBookEntry, index: number) => {
                  const total = parseFloat(price) * parseFloat(quantity);
                  return (
                    <TableRow key={`bid-${index}`}>
                      <TableCell className="text-right font-medium text-green-500">
                        {formatNumber(parseFloat(price), 2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(parseFloat(quantity), 4)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatNumber(total, 4)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Asks (Sell Orders) */}
          <div>
            <div className="mb-2 text-sm font-semibold text-red-500">Sell Orders</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.asks.slice(0, 10).map(([price, quantity]: OrderBookEntry, index: number) => {
                  const total = parseFloat(price) * parseFloat(quantity);
                  return (
                    <TableRow key={`ask-${index}`}>
                      <TableCell className="text-right font-medium text-red-500">
                        {formatNumber(parseFloat(price), 2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(parseFloat(quantity), 4)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatNumber(total, 4)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Showing top 10 orders • Updates every second
        </div>
      </CardContent>
    </Card>
  );
} 