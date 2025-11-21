import React from 'react';
import { SavedRecommendation } from '../types';

interface RecommendationHistoryProps {
  history: SavedRecommendation[];
  currentPrices: Record<string, number>; // To calculate performance
}

const RecommendationHistory: React.FC<RecommendationHistoryProps> = ({ history, currentPrices }) => {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 shadow-lg flex flex-col h-full">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <span className="mr-2">📜</span> Lịch sử khuyến nghị
      </h3>
      
      <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar space-y-3">
        {history.length === 0 && (
          <div className="text-center text-gray-500 text-xs mt-4">Chưa có dữ liệu lưu trữ.</div>
        )}
        {history.map(rec => {
          const currentPrice = currentPrices[rec.symbol] || rec.priceAtTime;
          const gain = currentPrice - rec.priceAtTime;
          const gainPercent = (gain / rec.priceAtTime) * 100;
          
          // Invert logic for SELL recommendations? For now keep simple P/L based on price movement since time of rec
          
          return (
            <div key={rec.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700 relative">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-400">{rec.symbol}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    rec.action === 'MUA' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 
                    rec.action === 'BÁN' ? 'bg-rose-900/50 text-rose-400 border border-rose-800' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {rec.action}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500">
                  {new Date(rec.date).toLocaleDateString('vi-VN')}
                </div>
              </div>
              
              <div className="text-xs text-gray-300 mb-2 line-clamp-2 italic bg-gray-900/30 p-1 rounded">
                "{rec.notes}"
              </div>
              
              <div className="flex justify-between items-center text-xs border-t border-gray-700 pt-2 mt-2">
                <div>
                  <div className="text-gray-500">Giá khuyến nghị</div>
                  <div className="font-mono">{rec.priceAtTime.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500">Hiệu suất</div>
                  <div className={`font-mono font-bold ${gain >= 0 ? 'text-emerald-450' : 'text-rose-450'}`}>
                    {gain >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationHistory;
