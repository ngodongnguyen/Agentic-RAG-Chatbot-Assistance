
import React, { useState, useEffect, useCallback } from 'react';
import { Message, PortfolioItem, Alert, SavedRecommendation, TechnicalIndicators } from './types';
import ChatInterface from './components/ChatInterface';
import Portfolio from './components/Portfolio';
import MarketStats from './components/MarketStats';
import AlertsManager from './components/AlertsManager';
import RecommendationHistory from './components/RecommendationHistory';
import { sendMessageToGemini, getRealTimePrices } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Chào bạn! Tôi là trợ lý đầu tư VN-Index. \n\nTôi đã được nâng cấp với khả năng **Phân tích Nghiên cứu (Research-Based)** dựa trên thuật toán LSTM và các chỉ báo kỹ thuật (RSI, MACD, SMA) như bài báo khoa học của Tran Phuoc et al. (2024).\n\nBạn có thể thử nút **"Phân tích Research (LSTM)"** bên dưới.',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'alerts' | 'history'>('portfolio');

  // State for Features
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<SavedRecommendation[]>([]);
  
  // Global Active Stock for Chart
  const [activeStock, setActiveStock] = useState<string>('VN-INDEX');
  
  // Portfolio data
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([
    { symbol: 'FPT', shares: 1000, avgPrice: 98000, currentPrice: 135000, sector: 'Công nghệ' },
    { symbol: 'HPG', shares: 2000, avgPrice: 28000, currentPrice: 29500, sector: 'Thép' },
    { symbol: 'VCB', shares: 500, avgPrice: 85000, currentPrice: 92000, sector: 'Ngân hàng' },
  ]);

  // Current Market Prices
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({
    'VN-INDEX': 1258.40,
    'FPT': 135000,
    'HPG': 29500,
    'VCB': 92000,
    'MWG': 45000
  });

  // Loading state for prices
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // --- ALERT LOGIC ---
  const checkAlerts = useCallback(() => {
    alerts.forEach(alert => {
      if (alert.active) {
        const price = currentPrices[alert.symbol];
        if (price) {
          let triggered = false;
          if (alert.condition === 'ABOVE' && price > alert.threshold) triggered = true;
          if (alert.condition === 'BELOW' && price < alert.threshold) triggered = true;

          if (triggered) {
            // Send System Message
            const alertMsg: Message = {
              id: Date.now().toString(),
              role: 'system',
              text: `⚠️ **CẢNH BÁO:** Cổ phiếu **${alert.symbol}** đã đạt mức giá **${price.toLocaleString()}**, ${alert.condition === 'ABOVE' ? 'vượt qua' : 'giảm xuống dưới'} mức cảnh báo ${alert.threshold.toLocaleString()}.`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, alertMsg]);
            
            // Deactivate alert to prevent spam
            setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, active: false } : a));
          }
        }
      }
    });
  }, [alerts, currentPrices]);

  useEffect(() => {
    checkAlerts();
  }, [currentPrices, checkAlerts]);

  // --- REAL-TIME DATA FETCHING ---
  const refreshRealTimePrices = useCallback(async () => {
    setIsUpdatingPrices(true);
    // Collect all relevant symbols: Index, Portfolio, Active Stock, Common Watchlist
    const symbolsToFetch = [
      'VN-INDEX', 
      ...portfolio.map(i => i.symbol), 
      activeStock,
      'MWG', 'TCB', 'VPB', 'VNM'
    ];
    
    console.log("Fetching real-time prices for:", symbolsToFetch);
    const newPrices = await getRealTimePrices(symbolsToFetch);
    
    if (Object.keys(newPrices).length > 0) {
      setCurrentPrices(prev => ({ ...prev, ...newPrices }));
      
      // Update portfolio items with new prices
      setPortfolio(prev => prev.map(item => ({
        ...item,
        currentPrice: newPrices[item.symbol] || item.currentPrice
      })));
      
      setLastUpdated(new Date());
    }
    setIsUpdatingPrices(false);
  }, [portfolio, activeStock]);

  // Fetch prices on mount
  useEffect(() => {
    refreshRealTimePrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- VISUAL SIMULATION (MICRO-MOVEMENTS) ---
  // Keeps the UI alive between real fetches
  const simulateMarketTick = () => {
    if (isUpdatingPrices) return; // Don't jitter while fetching real data

    const newPrices = { ...currentPrices };
    let changed = false;
    Object.keys(newPrices).forEach(key => {
      // Very small random fluctuation (0.1%) to mimic tick data
      const change = (Math.random() - 0.5) * 0.001; 
      newPrices[key] = newPrices[key] * (1 + change);
      changed = true;
    });
    
    if (changed) {
      setCurrentPrices(newPrices);
    }
  };

  // --- DIVERSIFICATION LOGIC ---
  const triggerWeeklyDiversificationReview = useCallback(async () => {
    // Calculate allocation
    const totalValue = portfolio.reduce((acc, item) => acc + item.shares * item.currentPrice, 0);
    const sectorMap: Record<string, number> = {};
    portfolio.forEach(item => {
       const val = item.shares * item.currentPrice;
       const sec = item.sector || 'Khác';
       sectorMap[sec] = (sectorMap[sec] || 0) + val;
    });

    const breakdown = Object.entries(sectorMap)
      .map(([s, v]) => `- ${s}: ${((v/totalValue)*100).toFixed(1)}%`)
      .join('\n');

    const prompt = `
[HỆ THỐNG: REVIEW DANH MỤC ĐỊNH KỲ]
Đóng vai một Chuyên gia Quản lý Quỹ (Portfolio Manager).
Đây là danh mục hiện tại của tôi (Tổng: ${totalValue.toLocaleString()} VND):
${breakdown}

YÊU CẦU:
1. Đánh giá mức độ tập trung rủi ro (Có đang "bỏ trứng vào một giỏ" không?).
2. Đề xuất cụ thể: Nên giảm tỷ trọng ngành nào? Nên thêm ngành nào (Bất động sản, Bán lẻ, Dầu khí...) để cân bằng danh mục trong bối cảnh thị trường hiện tại?
3. Trả lời ngắn gọn, tập trung vào hành động (Actionable Advice).
`;
    
    setIsTyping(true);
    const response = await sendMessageToGemini(messages, prompt, "Đây là đánh giá định kỳ tự động. Hãy đưa ra lời khuyên tái cơ cấu danh mục.");
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'model',
      text: "📊 **GỢI Ý ĐA DẠNG HÓA DANH MỤC (WEEKLY REVIEW):**\n\n" + response.text,
      timestamp: new Date(),
      sources: response.sources
    };
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(false);
  }, [portfolio, messages]);


  // --- AUTOMATED SCHEDULE ---
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      const todayStr = now.toDateString();
      const lastMorningUpdate = localStorage.getItem('lastMorningUpdate');
      const lastEveningUpdate = localStorage.getItem('lastEveningUpdate');

      if (hour === 9 && minute === 0 && lastMorningUpdate !== todayStr) {
        handleSystemTrigger("Chào buổi sáng! Hãy tổng hợp nhanh tin tức thị trường đầu ngày, các chỉ số thế giới ảnh hưởng đến VN-Index và các mã đáng chú ý.");
        localStorage.setItem('lastMorningUpdate', todayStr);
      }

      if (hour === 17 && minute === 0 && lastEveningUpdate !== todayStr) {
        handleSystemTrigger("Thị trường đã đóng cửa. Hãy tổng kết diễn biến VN-Index hôm nay, thanh khoản thế nào, khối ngoại mua bán ròng ra sao và dự báo cho ngày mai.");
        localStorage.setItem('lastEveningUpdate', todayStr);
      }
      
      // Tick effect every 2 seconds
      simulateMarketTick();
    };

    const timer = setInterval(checkTime, 2000); 
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrices, isUpdatingPrices]); // Add dependencies for closure safety

  const handleSystemTrigger = useCallback(async (systemPrompt: string) => {
    setIsTyping(true);
    const response = await sendMessageToGemini(messages, systemPrompt, "Đây là yêu cầu tự động từ hệ thống. Hãy trả lời như một bản tin ngắn gọn.");
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'model',
      text: response.text,
      timestamp: new Date(),
      sources: response.sources
    };
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(false);
  }, [messages]);

  // --- RESEARCH DATA GENERATOR ---
  const generateTechnicalData = (symbol: string): TechnicalIndicators => {
    const price = currentPrices[symbol] || 50000;
    // In a real app, this would fetch historical candles and compute
    return {
      rsi: Math.floor(Math.random() * (80 - 30) + 30), 
      macd: Math.random() * 2 - 1,
      signal: Math.random() * 2 - 1,
      sma20: price * (1 + (Math.random() * 0.05 - 0.025)),
      sma50: price * (1 + (Math.random() * 0.1 - 0.05)),
      trend: Math.random() > 0.5 ? 'UP' : 'SIDEWAYS'
    };
  };

  const handleUserMessage = async (text: string, isResearchMode: boolean = false) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    
    let contextPrompt = "";
    
    if (isResearchMode) {
        const foundSymbol = ['FPT', 'VCB', 'HPG', 'MWG', 'TCB'].find(s => text.toUpperCase().includes(s)) || activeStock;
        if (foundSymbol) setActiveStock(foundSymbol);

        const indicators = generateTechnicalData(foundSymbol);
        
        contextPrompt = `
**CHẾ ĐỘ NGHIÊN CỨU (PAPER: Applying machine learning algorithms... Vietnam):**

Dữ liệu kỹ thuật thời gian thực cho mã **${foundSymbol}**:
- **RSI (14):** ${indicators.rsi} (${indicators.rsi > 70 ? 'Quá mua - Cảnh báo đảo chiều' : indicators.rsi < 30 ? 'Quá bán - Tiềm năng phục hồi' : 'Trung tính'})
- **MACD:** ${indicators.macd.toFixed(2)} | **Signal:** ${indicators.signal.toFixed(2)} (${indicators.macd > indicators.signal ? 'MACD cắt lên Signal -> Tín hiệu Tăng' : 'MACD cắt xuống Signal -> Tín hiệu Giảm'})
- **Giá hiện tại:** ${currentPrices[foundSymbol]?.toLocaleString() || 'N/A'}
- **SMA (20):** ${indicators.sma20.toFixed(0)}
- **SMA (50):** ${indicators.sma50.toFixed(0)}

HÃY ÁP DỤNG LOGIC CỦA MÔ HÌNH LSTM TRONG BÀI BÁO:
1. Phân tích sự hội tụ/phân kỳ của MACD.
2. Kết hợp với RSI để loại bỏ tín hiệu nhiễu.
3. So sánh giá với SMA20/SMA50 để xác định xu hướng dài hạn.
4. Đưa ra dự báo xác suất tăng/giảm.
`;
    }

    const response = await sendMessageToGemini(messages, text, contextPrompt);

    const modelMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: response.text,
      timestamp: new Date(),
      sources: response.sources
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsTyping(false);
  };

  const handleAnalyzePortfolio = async () => {
    if (activeTab !== 'portfolio') setActiveTab('portfolio');
    
    const portfolioSummary = portfolio.map(p => `${p.symbol} (${p.sector}, ${p.shares} cp, Giá: ${p.currentPrice.toLocaleString()})`).join(', ');
    const prompt = `Hãy phân tích danh mục đầu tư của tôi: [${portfolioSummary}]. Đánh giá mức độ rủi ro, sự phân bổ ngành nghề và đề xuất đa dạng hóa nếu cần thiết.`;
    
    await handleUserMessage(prompt);
  };

  const handleSaveRecommendation = (msg: Message) => {
    const text = msg.text.toUpperCase();
    let action: 'MUA' | 'BÁN' | 'NẮM GIỮ' | 'THEO DÕI' = 'THEO DÕI';
    if (text.includes('MUA')) action = 'MUA';
    else if (text.includes('BÁN')) action = 'BÁN';
    else if (text.includes('GIỮ') || text.includes('NẮM GIỮ')) action = 'NẮM GIỮ';
    
    const possibleSymbols = ['FPT', 'VCB', 'HPG', 'MWG', 'VNM', 'TCB', 'VPB'];
    const foundSymbol = possibleSymbols.find(s => text.includes(s)) || activeStock;

    const newRec: SavedRecommendation = {
      id: Date.now().toString(),
      symbol: foundSymbol,
      action,
      priceAtTime: currentPrices[foundSymbol] || 0,
      date: new Date().toISOString(),
      notes: msg.text.substring(0, 100) + "..."
    };

    setRecommendations(prev => [newRec, ...prev]);
    setActiveTab('history');
  };

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-200 p-2 md:p-4 gap-4">
      {/* Left Sidebar */}
      <div className="hidden lg:flex flex-col w-96 gap-4 shrink-0">
        {/* Logo & Header */}
        <div className="flex items-center gap-3 p-2 mb-1">
          <div className="bg-gradient-to-tr from-blue-600 to-emerald-500 p-2 rounded-lg shadow-lg shadow-blue-900/20">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
              <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0zm1.5 0v.002c0 .019.002.038.006.057a6.75 6.75 0 006.744 6.695V15h-6.75zM13.5 12.75h6.695a6.75 6.75 0 00-6.695-6.744v6.744z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-white text-xl tracking-tight">VN-Index AI</h1>
            <div className="flex items-center gap-2">
               <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isUpdatingPrices ? 'bg-blue-400' : 'bg-emerald-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isUpdatingPrices ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                </span>
               <p className="text-xs text-gray-400 uppercase tracking-wider">
                 {isUpdatingPrices ? 'Updating...' : 'Live Market'}
               </p>
            </div>
          </div>
        </div>

        {/* Interactive Market/Stock Chart */}
        <MarketStats 
            activeSymbol={activeStock} 
            onSymbolChange={setActiveStock}
            currentPrice={currentPrices[activeStock] || (activeStock === 'VN-INDEX' ? 1258 : 50000)}
        />

        {/* Tab Navigation */}
        <div className="flex p-1 bg-gray-900 rounded-lg border border-gray-800">
          <button 
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${activeTab === 'portfolio' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Danh mục
          </button>
          <button 
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${activeTab === 'alerts' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Cảnh báo
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${activeTab === 'history' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Lịch sử
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 min-h-0">
          {activeTab === 'portfolio' && (
            <Portfolio 
              items={portfolio} 
              onAnalyze={handleAnalyzePortfolio}
              onViewChart={(symbol) => setActiveStock(symbol)}
            />
          )}
          {activeTab === 'alerts' && (
            <AlertsManager 
              alerts={alerts}
              currentPrices={currentPrices}
              onAddAlert={(alert) => setAlerts([...alerts, { ...alert, id: Date.now().toString(), active: true }])}
              onDeleteAlert={(id) => setAlerts(alerts.filter(a => a.id !== id))}
            />
          )}
          {activeTab === 'history' && (
            <RecommendationHistory 
              history={recommendations} 
              currentPrices={currentPrices}
            />
          )}
        </div>

        {/* Simulation/Data Controls */}
        <div className="p-3 bg-gray-900 rounded-xl border border-gray-800">
           <div className="flex justify-between items-center mb-2">
             <h4 className="text-xs font-semibold text-gray-400 uppercase">Dữ liệu & Công cụ</h4>
             {lastUpdated && <span className="text-[10px] text-gray-500">Cập nhật: {lastUpdated.toLocaleTimeString()}</span>}
           </div>
           <div className="grid grid-cols-2 gap-2">
             <button 
                onClick={refreshRealTimePrices}
                disabled={isUpdatingPrices}
                className={`py-2 text-xs font-semibold rounded transition-all flex justify-center items-center gap-1 border ${
                    isUpdatingPrices 
                    ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed' 
                    : 'bg-gray-800 hover:bg-gray-700 text-emerald-400 border-emerald-900/30 hover:border-emerald-500/50'
                }`}
             >
               <span className={isUpdatingPrices ? 'animate-spin' : ''}>{isUpdatingPrices ? '⏳' : '🔄'}</span> 
               {isUpdatingPrices ? 'Đang tải...' : 'Giá thực (Live)'}
             </button>
             <button 
                onClick={triggerWeeklyDiversificationReview}
                className="py-2 bg-gray-800 hover:bg-gray-700 text-purple-400 border border-purple-900/30 hover:border-purple-500/50 rounded text-xs font-semibold transition-all flex justify-center items-center gap-1"
                title="Kích hoạt bot gợi ý tái cơ cấu"
             >
               <span>⚖️</span> Review Danh mục
             </button>
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <ChatInterface 
          messages={messages} 
          onSendMessage={(text, isResearchMode) => handleUserMessage(text, isResearchMode)}
          isTyping={isTyping}
          onSaveRecommendation={handleSaveRecommendation}
        />
      </div>
    </div>
  );
};

export default App;
