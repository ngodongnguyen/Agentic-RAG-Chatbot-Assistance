
import React from 'react';
import { PortfolioItem } from '../types';

interface PortfolioProps {
  items: PortfolioItem[];
  onAnalyze: () => void;
  onViewChart: (symbol: string) => void;
}

const Portfolio: React.FC<PortfolioProps> = ({ items, onAnalyze, onViewChart }) => {
  const totalValue = items.reduce((acc, item) => acc + item.shares * item.currentPrice, 0);
  const totalCost = items.reduce((acc, item) => acc + item.shares * item.avgPrice, 0);
  const totalPL = totalValue - totalCost;
  const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  // Calculate Sector Allocation
  const sectorMap: Record<string, number> = {};
  items.forEach(item => {
    const value = item.shares * item.currentPrice;
    const sector = item.sector || 'Khác';
    sectorMap[sector] = (sectorMap[sector] || 0) + value;
  });

  const sortedSectors = Object.entries(sectorMap)
    .sort(([, a], [, b]) => b - a)
    .map(([sector, value]) => ({
      sector,
      value,
      percent: (value / totalValue) * 100
    }));

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 shadow-lg flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <span className="mr-2">💼</span> Danh mục
        </h3>
        <button 
          onClick={onAnalyze}
          className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-full transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1">
            <path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H1.75A.75.75 0 011 2.75zm1.327 1.987a.75.75 0 01.796-.06l3.48 1.547a.75.75 0 00.602 0l3.48-1.548a.75.75 0 01.796.06l2.935 1.76V9.75h-2.5a.75.75 0 000 1.5h2.5v3.25a.75.75 0 01-1.5 0V13H10a.75.75 0 000 1.5h2.75a2.25 2.25 0 002.25-2.25V6.133l1.673-.837a.75.75 0 01.67 1.342L15 7.827v6.673a.75.75 0 01-1.5 0v-6l-2.935-1.76a2.25 2.25 0 00-2.388-.179l-2.82 1.253-2.82-1.253a2.25 2.25 0 00-2.388.18L1.75 7.826a.75.75 0 01-.854-1.234l1.43-1.855z" clipRule="evenodd" />
          </svg>
          Phân tích
        </button>
      </div>
      
      <div className="mb-4 p-3 bg-gray-800 rounded-lg">
        <div className="text-xs text-gray-400 uppercase">Tổng tài sản</div>
        <div className="text-xl font-bold text-white">{totalValue.toLocaleString('vi-VN')} ₫</div>
        <div className={`text-sm font-medium ${totalPL >= 0 ? 'text-emerald-450' : 'text-rose-450'}`}>
          {totalPL >= 0 ? '+' : ''}{totalPL.toLocaleString('vi-VN')} ({totalPLPercent.toFixed(2)}%)
        </div>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar mb-2">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500 border-b border-gray-700 sticky top-0 bg-gray-900">
            <tr>
              <th className="pb-2 pl-1">Mã</th>
              <th className="pb-2 text-right">Giá TT</th>
              <th className="pb-2 text-right pr-1">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {items.map((item) => {
              const plPercent = ((item.currentPrice - item.avgPrice) / item.avgPrice) * 100;
              return (
                <tr key={item.symbol} className="hover:bg-gray-800/50 transition-colors group">
                  <td className="py-3 pl-1">
                    <div className="font-bold text-blue-400">{item.symbol}</div>
                    <div className="text-[10px] text-gray-500">{item.sector || 'Khác'}</div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="text-gray-300">{item.currentPrice.toLocaleString('vi-VN')}</div>
                    <div className={`text-[10px] ${plPercent >= 0 ? 'text-emerald-450' : 'text-rose-450'}`}>
                        {plPercent >= 0 ? '+' : ''}{plPercent.toFixed(1)}%
                    </div>
                  </td>
                  <td className="py-3 text-right pr-1">
                    <button 
                        onClick={() => onViewChart(item.symbol)}
                        className="text-gray-500 hover:text-blue-400 p-1 transition-colors"
                        title="Xem biểu đồ"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M15.5 2A1.5 1.5 0 0014 3.5v8a1.5 1.5 0 001.5 1.5h3.5a.5.5 0 00.5-.5v-9a1.5 1.5 0 00-1.5-1.5h-2.5zM14 3.5a.5.5 0 01.5-.5h2.5a.5.5 0 01.5.5v7.5h-3.5v-7.5zM3 3a1 1 0 00-1 1v4.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V4a1 1 0 00-1-1H3z" />
                            <path d="M3.5 10a.5.5 0 00-.5.5v3.5a1 1 0 001 1h4.5a.5.5 0 00.5-.5V11a1 1 0 00-1-1h-4.5z" />
                        </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sector Allocation Visualization */}
      <div className="border-t border-gray-800 pt-3">
        <div className="text-[10px] text-gray-400 uppercase mb-2 font-semibold">Phân bổ ngành</div>
        <div className="flex h-1.5 w-full rounded-full overflow-hidden mb-2 bg-gray-700">
          {sortedSectors.map((s, idx) => (
            <div 
              key={s.sector}
              style={{ width: `${s.percent}%` }}
              className={`${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-emerald-500' : idx === 2 ? 'bg-purple-500' : 'bg-gray-500'}`}
              title={`${s.sector}: ${s.percent.toFixed(1)}%`}
            ></div>
          ))}
        </div>
        <div className="space-y-1">
          {sortedSectors.slice(0, 3).map((s, idx) => (
             <div key={s.sector} className="flex justify-between text-[10px] items-center">
               <div className="flex items-center gap-1.5">
                 <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-emerald-500' : idx === 2 ? 'bg-purple-500' : 'bg-gray-500'}`}></div>
                 <span className="text-gray-300">{s.sector}</span>
               </div>
               <span className="text-gray-400 font-mono">{s.percent.toFixed(1)}%</span>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
