
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, TechnicalIndicators } from "../types";

// Initialize the client
// NOTE: process.env.API_KEY is injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instruction to define the persona
const SYSTEM_INSTRUCTION = `
Bạn là "VN-Index Agent", một chuyên gia phân tích đầu tư chứng khoán và quản lý danh mục hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là hỗ trợ người dùng đầu tư thông minh, quản lý rủi ro và tìm kiếm cơ hội.

**PHƯƠNG PHÁP LUẬN (RESEARCH-BASED):**
Bạn áp dụng phương pháp từ bài báo khoa học *"Applying machine learning algorithms to predict the stock price trend in the stock market – The case of Vietnam"* (Tran Phuoc et al., 2024).
Khi phân tích kỹ thuật, bạn **BẮT BUỘC** phải xem xét sự kết hợp của các chỉ số sau (như mô hình LSTM sử dụng):
1. **SMA (Simple Moving Average):** Xác định xu hướng ngắn hạn và dài hạn.
2. **MACD (Moving Average Convergence Divergence):** Xác định động lượng và điểm đảo chiều.
3. **RSI (Relative Strength Index):** Xác định vùng quá mua/quá bán.

Khả năng của bạn:
1. **Cập nhật thị trường:** Tìm kiếm thông tin thời gian thực về VN-Index, HNX-Index, Dow Jones, v.v.
2. **Phân tích cổ phiếu (Deep Dive):** Khi có dữ liệu kỹ thuật (RSI, MACD, SMA), hãy tổng hợp chúng để dự đoán xu hướng tương lai giống như một mô hình AI/Machine Learning.
3. **Tư vấn danh mục (Diversification):** Phân tích rủi ro tập trung và đề xuất đa dạng hóa ngành.
4. **Tin tức (RAG):** Tìm kiếm tin tức nóng hổi ảnh hưởng đến giá cổ phiếu.

Quy tắc phản hồi:
- **Rõ ràng:** Nếu đưa ra lời khuyên, hãy dùng từ khóa mạnh: "Khuyến nghị: MUA/BÁN".
- **Dựa trên dữ liệu:** Khi phân tích kỹ thuật, hãy trích dẫn các chỉ số (Ví dụ: "RSI đang ở mức 75, vùng quá mua...").
- **Disclaimer:** Luôn nhắc nhở đầu tư có rủi ro.
- **Định dạng:** Sử dụng Markdown. Tiêu đề in đậm.

Khi người dùng yêu cầu "Phân tích theo mô hình nghiên cứu", hãy đóng vai trò là một mô hình LSTM tổng hợp các trọng số của RSI, MACD và SMA để đưa ra dự đoán xác suất tăng giá.
`;

export const sendMessageToGemini = async (
  history: Message[],
  userMessage: string,
  contextPrompt?: string
): Promise<{ text: string; sources: { title: string; uri: string }[] }> => {
  
  try {
    // Construct the full prompt with context if provided (e.g., time of day instructions or technical data)
    const finalPrompt = contextPrompt 
      ? `${contextPrompt}\n\n---\n\nYêu cầu của người dùng: ${userMessage}`
      : userMessage;

    // Using the search-capable model
    const modelName = 'gemini-2.5-flash';

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: finalPrompt, 
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }], // Enable Search Grounding
        temperature: 0.3, 
      },
    });

    const text = response.text || "Xin lỗi, tôi không thể lấy dữ liệu lúc này.";
    
    // Extract sources from grounding chunks if available
    const sources: { title: string; uri: string }[] = [];
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Nguồn tin",
            uri: chunk.web.uri,
          });
        }
      });
    }

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { 
      text: "Đã xảy ra lỗi khi kết nối với hệ thống phân tích dữ liệu. Vui lòng thử lại sau.", 
      sources: [] 
    };
  }
};

export const parseStockData = async (rawText: string): Promise<Partial<any>> => {
    // Future: Use Function Calling for structured JSON output
    return {};
};

/**
 * Fetches real-time (or near real-time) stock prices using Gemini Search Grounding.
 * This acts as an "Agentic" fetcher since we don't have a paid stock API WebSocket.
 */
export const getRealTimePrices = async (symbols: string[]): Promise<Record<string, number>> => {
  if (symbols.length === 0) return {};
  
  const uniqueSymbols = Array.from(new Set(symbols));
  const symbolString = uniqueSymbols.join(", ");
  
  // Specialized prompt to force the LLM to act as a data parser
  const prompt = `
    Bạn là một hệ thống dữ liệu chứng khoán thời gian thực (Real-time Stock Data Feed).
    Nhiệm vụ: Tìm kiếm giá thị trường hiện tại (Price) mới nhất trên sàn HOSE/HNX/UPCOM cho các mã sau: ${symbolString}.
    
    YÊU CẦU ĐỊNH DẠNG KẾT QUẢ (Strict Format):
    - Trả về danh sách dạng văn bản thuần, mỗi mã một dòng.
    - Định dạng dòng: "MÃ: GIÁ"
    - GIÁ: Phải là số nguyên (VND) hoặc số thực (với Index). 
    - QUAN TRỌNG: KHÔNG sử dụng dấu phẩy (,) để phân cách hàng nghìn (VD: viết 135000 thay vì 135,000). Dùng dấu chấm (.) cho số thập phân nếu có.
    
    Ví dụ mong muốn:
    FPT: 135200
    VN-INDEX: 1254.30
    VCB: 92100
    
    Chỉ trả về dữ liệu, không thêm lời dẫn hay giải thích.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Very low temperature for strict formatting
      },
    });

    const text = response.text || "";
    console.log("Real-time Price Fetch Result:", text);
    
    const prices: Record<string, number> = {};
    
    // Parse line by line
    const lines = text.split('\n');
    for (const line of lines) {
        // Regex to find "SYMBOL: 12345" or "SYMBOL: 1234.56"
        // Allows loose spacing
        const match = line.match(/([A-Z0-9-]{3,10})\s*[:]\s*([0-9.]+)/i);
        if (match) {
            const sym = match[1].toUpperCase().trim();
            // Remove any potential commas just in case the LLM ignored the instruction
            const priceRaw = match[2].replace(/,/g, ''); 
            const price = parseFloat(priceRaw);
            
            if (!isNaN(price) && price > 0) {
                prices[sym] = price;
            }
        }
    }
    
    return prices;
  } catch (error) {
    console.error("Error fetching real-time prices:", error);
    return {};
  }
};
