import React, { useState } from 'react';
import { Alert } from '../types';

interface AlertsManagerProps {
  alerts: Alert[];
  currentPrices: Record<string, number>;
  onAddAlert: (alert: Omit<Alert, 'id' | 'active'>) => void;
  onDeleteAlert: (id: string) => void;
}

const AlertsManager: React.FC<AlertsManagerProps> = ({ alerts, currentPrices, onAddAlert, onDeleteAlert }) => {
  const [symbol, setSymbol] = useState('');
  const [threshold, setThreshold] = useState('');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  const currentPrice = symbol ? currentPrices[symbol.toUpperCase()] : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !threshold) return;
    
    onAddAlert({
      symbol: symbol.toUpperCase(),
      condition,
      threshold: parseFloat(threshold),
    });
    
    setSymbol('');
    setThreshold('');
  };

  const handleQuickFluctuationAlert = () => {
    if (!currentPrice || !symbol) return;

    // Create Alert for +5%
    const upperThreshold = Math.floor(currentPrice * 1.05);
    onAddAlert({
      symbol: symbol.toUpperCase(),
      condition: 'ABOVE',
      threshold: upperThreshold,
    });

    // Create Alert for -5%
    const lowerThreshold = Math.floor(currentPrice * 0.95);
    onAddAlert({
      symbol: symbol.toUpperCase(),
      condition: 'BELOW',
      threshold: lowerThreshold,
    });

    setSymbol('');
    setThreshold('');
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 shadow-lg flex flex-col h-full">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <span className="mr-2">🔔</span> Cảnh báo giá
      </h3>
      
      <div className="bg-gray-800 p-3 rounded-lg mb-4">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <div className="w-1/3">
                <input 
                    type="text" 
                    placeholder="Mã (VD: FPT)" 
                    value={symbol}
                    onChange={e => setSymbol(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white uppercase placeholder-gray-500 focus:border-blue-500 outline-none"
                />
            </div>
            <select 
                value={condition}
                onChange={e => setCondition(e.target.value as 'ABOVE' | 'BELOW')}
                className="w-2/3 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-blue-500 outline-none"
            >
                <option value="ABOVE">Vượt quá (&gt;)</option>
                <option value="BELOW">Giảm dưới (&lt;)</option>
            </select>
          </div>
          
          {/* Current Price Helper */}
          {symbol && (
            <div className="text-xs flex justify-between items-center text-gray-400 px-1">
                <span>Giá hiện tại: <span className="text-white font-mono">{currentPrice ? currentPrice.toLocaleString() : '???'}</span></span>
            </div>
          )}

          <div className="flex gap-2">
            <input 
                type="number" 
                placeholder="Giá mục tiêu" 
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:border-blue-500 outline-none"
            />
            <button 
                type="submit"
                disabled={!symbol || !threshold}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
                +
            </button>
          </div>
        </form>
        
        {/* Quick Action: +/- 5% */}
        {currentPrice && (
            <div className="mt-3 pt-3 border-t border-gray-700">
                <button
                    onClick={handleQuickFluctuationAlert}
                    className="w-full flex items-center justify-center gap-2 text-xs py-1.5 bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-800 hover:text-white rounded transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                    </svg>
                    Tự động thêm Cảnh báo biến động ±5%
                </button>
            </div>
        )}
      </div>

      <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar space-y-2">
        {alerts.length === 0 && (
          <div className="text-center text-gray-500 text-xs mt-4">Chưa có cảnh báo nào.</div>
        )}
        {alerts.map(alert => (
          <div key={alert.id} className="flex justify-between items-center bg-gray-800/50 p-3 rounded border border-gray-700/50 hover:border-gray-600 transition-colors">
            <div>
              <div className="font-bold text-white text-sm">{alert.symbol}</div>
              <div className="text-xs text-gray-400">
                {alert.condition === 'ABOVE' ? 'Vượt quá' : 'Giảm dưới'} 
                <span className={`ml-1 font-mono font-bold ${alert.condition === 'ABOVE' ? 'text-emerald-450' : 'text-rose-450'}`}>
                    {alert.threshold.toLocaleString()}
                </span>
              </div>
            </div>
            <button 
              onClick={() => onDeleteAlert(alert.id)}
              className="text-gray-500 hover:text-rose-450 transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsManager;