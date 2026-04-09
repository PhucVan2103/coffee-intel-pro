import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, TrendingDown, Info, CloudSun, Globe, 
  MapPin, Calendar, BarChart3, AlertTriangle, MessageSquare,
  RefreshCw, Coffee, ChevronLeft, RotateCw, Newspaper, ArrowRight, Clock,
  Share2, Bookmark, Type, CheckCircle2, X, ShieldCheck, Zap, Lightbulb,
  Droplets, Wind, Thermometer, User, ThumbsUp, Send, Gauge, FileText, Sparkles, BrainCircuit, Quote
} from 'lucide-react';

// --- Gemini API Setup ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 

const callGeminiAPI = async (prompt, systemPrompt = "Bạn là chuyên gia phân tích thị trường cà phê Việt Nam và thế giới.", isJson = false) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    tools: [{ google_search: {} }]
  };

  if (isJson) {
    payload.generationConfig = { responseMimeType: "application/json" };
  }

  const maxRetries = 2;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// --- Supabase Configuration ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; 
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- Dữ liệu Khởi tạo ---
const INITIAL_PRICES = {
  domestic: [
    { id: 'daklak', province: 'Đắk Lắk', price: 105300, change: 1200, history: [102000, 103500, 106000, 109300, 107000, 106000, 105300], high30d: 112000, low30d: 98000, trend: 'Bullish', analysis: 'Giá duy trì ở mức cao kỷ lục do nguồn cung khan hiếm.' },
    { id: 'lamdong', province: 'Lâm Đồng', price: 104700, change: 800, history: [101500, 102000, 105500, 108800, 106500, 105500, 104700], high30d: 111500, low30d: 97500, trend: 'Bullish', analysis: 'Chất lượng hạt tốt giúp giá Lâm Đồng bám sát Đắk Lắk.' },
    { id: 'gialai', province: 'Gia Lai', price: 105100, change: 1500, history: [101800, 103000, 105800, 109100, 106800, 105800, 105100], high30d: 111800, low30d: 98200, trend: 'Bullish', analysis: 'Lực thu mua mạnh từ các đại lý nội địa.' },
    { id: 'daknong', province: 'Đắk Nông', price: 105200, change: 1100, history: [101900, 103200, 105900, 109100, 106900, 105900, 105200], high30d: 111900, low30d: 98100, trend: 'Bullish', analysis: 'Kỳ vọng sản lượng mới giảm khiến giá trụ vững.' },
  ],
  global: [
    { id: 'london', market: 'London (Robusta)', price: 4412, unit: 'USD/Tấn', change: 45, history: [4200, 4250, 4350, 4500, 4480, 4450, 4412], high30d: 4650, low30d: 4100, trend: 'Bullish', analysis: 'Tồn kho trên sàn liên tục chạm mức thấp.' },
    { id: 'newyork', market: 'New York (Arabica)', price: 242.45, unit: 'cts/lb', change: -1.2, history: [235.1, 238.4, 240.2, 245.0, 243.5, 241.2, 242.45], high30d: 255.0, low30d: 228.5, trend: 'Neutral', analysis: 'Áp lực chốt lời ngắn hạn từ các quỹ.' },
  ],
  brazil: {
    harvestProgress: 22, expectedOutput: '68.5M', outputChange: -4.1, weatherStatus: 'Nắng nóng cực đoan',
    riskLevel: 'Cao', sentiment: 'Bullish', confidence: 92,
    portStatus: 'Chậm trễ 8 ngày', soilMoisture: '22%', temperatureAnomaly: '+3.2°C',
    regions: [
      { name: 'Minas Gerais', status: 'Khô hạn', impact: 'Nặng' }, 
      { name: 'Sao Paulo', status: 'Thiếu hụt', impact: 'Trung bình' },
      { name: 'Espírito Santo', status: 'Ổn định', impact: 'Thấp' }
    ],
    deepAnalysis: [
      "Hiện tượng El Nino đang gây ra đợt khô hạn tồi tệ nhất trong 10 năm tại Minas Gerais.",
      "Sản lượng Arabica dự kiến giảm mạnh do rụng trái non.",
      "Logistics tại cảng Santos gặp khó khăn do thiếu container rỗng."
    ]
  },
  aiInsights: {
    marketSentiment: 'Lạc quan (Bullish)', sentimentScore: 78, summary: 'Thị trường thế giới đang lo ngại về nguồn cung, tạo đà tăng vững chắc cho giá nội địa.', newsImpact: 'Tích cực', recommendation: 'Tiếp tục nắm giữ hàng, chờ đợi các mốc giá cao hơn.'
  }
};

const MOCK_NEWS = [
  {
    id: 'n1', category: 'Phân tích vĩ mô', title: 'Tại sao giá cà phê Việt Nam liên tục phá đỉnh lịch sử?', author: 'Chuyên gia AI', readTime: '5 phút đọc',
    summary: 'Sự kết hợp giữa mất mùa tại Brazil và nhu cầu Robusta tăng vọt toàn cầu đã đẩy giá cà phê Việt Nam vượt mốc 100.000đ/kg. Các doanh nghiệp xuất khẩu đang gặp khó khăn trong việc gom hàng giao ngay do người nông dân có tâm lý găm giữ chờ giá tốt hơn.', time: '1 giờ trước',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800',
    insights: [
      "Chênh lệch cung cầu Robusta toàn cầu hụt 2.5 triệu bao trong niên vụ này.",
      "Các quỹ đầu cơ (Hedge Funds) trên sàn London tăng vị thế Long lên mức cao nhất 5 năm.",
      "Chiến lược: Nông dân nên chốt lời từng phần (30%), giữ lại 70% đón đỉnh mới."
    ],
    content: [
      { type: 'lead', text: "Lần đầu tiên trong lịch sử, giá cà phê nhân xô tại Tây Nguyên đã vượt ngưỡng sáu con số, gây kinh ngạc cho giới quan sát thị trường." },
      { type: 'paragraph', text: "Nguyên nhân trực tiếp đến từ tình trạng thiếu hụt nguồn cung trầm trọng tại hai quốc gia sản xuất Robusta hàng đầu là Việt Nam và Brazil. Tại Việt Nam, đợt hạn hán kéo dài vào đầu mùa khô đã ảnh hưởng lớn đến giai đoạn làm nhân. Báo cáo từ các hợp tác xã cho thấy tỷ lệ hạt nhỏ (Screen 13) tăng đột biến, làm khan hiếm dòng hạt chuẩn (Screen 16/18)." },
      { type: 'quote', text: "Thị trường đang ở trong tình trạng 'vắt giá' (backwardation) cực đoan. Hợp đồng giao ngay cao hơn hợp đồng kỳ hạn hàng trăm USD, chứng tỏ các nhà rang xay đang khát hàng trầm trọng.", author: "Báo cáo phân tích dòng tiền Vicofa" },
      { type: 'paragraph', text: "Dự báo trong tháng tới, khi dòng vốn từ các quỹ tiếp tục đổ vào hàng hóa nông sản để phòng ngừa lạm phát, mức giá này hoàn toàn có thể thiết lập một mặt bằng mới." }
    ]
  },
  {
    id: 'n2', category: 'Cảnh báo thời tiết', title: 'Brazil: Dự báo mưa sẽ không đủ để cứu vãn mùa vụ', author: 'Reuters / AI', readTime: '3 phút đọc',
    summary: 'Mặc dù có dự báo mưa nhẹ vào cuối tuần, nhưng lượng nước không đủ để bù đắp cho sự thiếu hụt độ ẩm đất kéo dài. Tình trạng nắng nóng khắc nghiệt đang làm tổn thương hoa và quả non tại vành đai cà phê lớn nhất thế giới.', time: '3 giờ trước',
    image: 'https://images.unsplash.com/photo-1524350303359-33887037f093?auto=format&fit=crop&q=80&w=800',
    insights: [
      "Độ ẩm đất tại Minas Gerais rơi xuống 22% - mức nguy hiểm cho cây cà phê non.",
      "Nhiệt độ cao làm tỷ lệ rụng trái non tăng 15% so với cùng kỳ năm ngoái.",
      "Tác động: Áp lực nguồn cung Arabica sẽ gián tiếp hỗ trợ giá Robusta Việt Nam."
    ],
    content: [
      { type: 'lead', text: "Nhiệt độ tại bang Minas Gerais, vùng trồng cà phê trọng điểm của Brazil, tiếp tục duy trì trên mức 35 độ C, đe dọa trực tiếp đến sản lượng niên vụ tới." },
      { type: 'paragraph', text: "Cơ quan khí tượng địa phương cho rằng chu kỳ khô hạn này đang ảnh hưởng trực tiếp đến quá trình ra hoa của niên vụ 2025/2026. Lượng mưa tích lũy trong tháng qua chỉ đạt 30% so với mức trung bình nhiều năm." },
      { type: 'paragraph', text: "Sự sụt giảm sản lượng Arabica từ Brazil sẽ buộc các hãng rang xay toàn cầu phải thay đổi công thức phối trộn (blend), tăng tỷ lệ Robusta để tối ưu chi phí. Đây là lực đẩy vô hình nhưng cực kỳ mạnh mẽ đối với giá cà phê Việt Nam trong quý tới." }
    ]
  },
  {
    id: 'n3', category: 'Chính sách toàn cầu', title: 'Quy định EUDR: Cú hích định giá lại cà phê Việt Nam', author: 'Hội đồng Cà phê', readTime: '4 phút đọc',
    summary: 'Châu Âu sẽ chính thức áp dụng quy định chống phá rừng (EUDR). Cà phê Việt Nam đang nắm giữ lợi thế tuyệt đối so với các nước Nam Mỹ nhờ diện tích canh tác ổn định.', time: '6 giờ trước',
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=800',
    insights: [
      "100% lô hàng xuất sang EU phải có tọa độ GPS chứng minh không phá rừng.",
      "Nguồn cung đạt chuẩn EUDR đang thiếu hụt, tạo ra mức giá cộng thêm (Premium).",
      "Việt Nam đã sẵn sàng số hóa 80% diện tích, vượt xa các đối thủ cạnh tranh."
    ],
    content: [
      { type: 'lead', text: "Luật chống phá rừng của EU (EUDR) không còn là rào cản, mà đang trở thành tấm 'vé vàng' giúp nâng tầm giá trị hạt cà phê Việt." },
      { type: 'paragraph', text: "Khác với tình trạng mở rộng diện tích cà phê vào rừng Amazon ở Nam Mỹ hay rừng rậm châu Phi, diện tích cà phê Việt Nam phần lớn đã ổn định từ trước năm 2020. Việc đáp ứng yêu cầu không phá rừng theo EUDR trở nên dễ dàng hơn nhiều." },
      { type: 'quote', text: "Những lô hàng cà phê Việt Nam có đầy đủ tọa độ GPS hiện đang được các nhà nhập khẩu châu Âu săn đón với mức giá chênh lệch cao hơn 50-100 USD/tấn so với giá niêm yết.", author: "Chuyên gia chuỗi cung ứng" }
    ]
  }
];

const HOT_NEWS_SLIDES = [
  { 
    id: 'h1', title: 'CẢNH BÁO: Tồn kho Robusta thế giới xuống mức thấp nhất 20 năm', tag: 'KHẨN CẤP', color: 'from-red-600 to-red-900', icon: 'AlertTriangle',
    category: 'Thị trường thế giới', author: 'Reuters / AI', readTime: '5 phút đọc', time: 'Vừa xong',
    image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=800',
    summary: 'Lượng tồn kho Robusta được cấp chứng nhận trên sàn ICE London đã giảm xuống mức thấp nhất kể từ năm 2014, tạo áp lực lớn lên nguồn cung toàn cầu và đẩy giá giao ngay lên cao.',
    insights: [
      "Tồn kho ICE London chỉ còn đủ đáp ứng vài tuần tiêu thụ.",
      "Giới đầu cơ đang tích cực rút hàng thực khỏi kho thay vì thanh lý hợp đồng.",
      "Dự báo: Trạng thái khan hiếm này sẽ còn kéo dài ít nhất đến đầu quý 3."
    ],
    content: [
      { type: 'lead', text: 'Báo cáo mới nhất từ sàn giao dịch ICE London cho thấy lượng tồn kho Robusta đã giảm xuống mức đáng báo động.' },
      { type: 'paragraph', text: 'Sự sụt giảm này phản ánh tình trạng khan hiếm hàng thực tại các quốc gia xuất khẩu lớn như Việt Nam và Indonesia. Nhu cầu tiêu thụ Robusta toàn cầu vẫn đang tăng mạnh do các nhà rang xay tìm cách giảm giá thành sản phẩm bằng cách thay thế một phần Arabica đắt đỏ.' }
    ]
  },
  { 
    id: 'h2', title: 'Dự báo giá cà phê có thể chạm mốc 120.000đ/kg trong tháng tới', tag: 'DỰ BÁO AI', color: 'from-emerald-600 to-emerald-900', icon: 'TrendingUp',
    category: 'Phân tích kỹ thuật', author: 'Coffee Intel AI', readTime: '4 phút đọc', time: '30 phút trước',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=800',
    summary: 'Thuật toán học máy của Coffee Intel vừa phát ra tín hiệu mua mạnh (Strong Buy) dựa trên mô hình phân tích dòng tiền và đứt gãy chuỗi cung ứng tại vùng Tây Nguyên.',
    insights: [
      "Mô hình AI dự đoán xác suất 85% giá sẽ vượt 110.000đ/kg trong 2 tuần.",
      "Động lực chính: Các doanh nghiệp FDI bắt buộc phải mua bù thiếu hụt hợp đồng giao xa.",
    ],
    content: [
      { type: 'lead', text: 'Biểu đồ giá nội địa đang hình thành mẫu hình tăng giá kỹ thuật cực kỳ vững chắc.' },
      { type: 'paragraph', text: 'Hệ thống AI của chúng tôi phân tích các chỉ báo RSI, MACD kết hợp với dữ liệu thu mua thực tế từ các đại lý lớn. Kết quả cho thấy lực cầu ở vùng giá dưới 100.000đ/kg là rất lớn, tạo thành một mức hỗ trợ cứng không thể xuyên thủng trong ngắn hạn.' }
    ]
  },
  { 
    id: 'h3', title: 'EUDR: Châu Âu siết chặt quy định nhập khẩu, cà phê Việt cần chuẩn bị gì?', tag: 'LOGISTICS', color: 'from-blue-600 to-blue-900', icon: 'ShieldCheck',
    category: 'Chính sách xuất khẩu', author: 'Hiệp hội Cà phê', readTime: '6 phút đọc', time: '2 giờ trước',
    image: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&q=80&w=800',
    summary: 'Hạn chót áp dụng quy định EUDR đang đến gần, đòi hỏi toàn bộ chuỗi cung ứng phải minh bạch nguồn gốc. Đây là thách thức nhưng cũng là cơ hội vàng cho Việt Nam.',
    content: [
      { type: 'lead', text: 'Đồng hồ đếm ngược cho quy định chống phá rừng của EU (EUDR) đã bắt đầu.' },
      { type: 'paragraph', text: 'Các nhà nhập khẩu châu Âu đang ráo riết yêu cầu đối tác Việt Nam cung cấp dữ liệu định vị địa lý (polygon) cho từng vườn cà phê. Quá trình chuyển đổi số này đòi hỏi sự chung tay của cả nông dân, đại lý và nhà xuất khẩu.' }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('news'); // Default to news for review
  const [prices, setPrices] = useState(INITIAL_PRICES);
  const [news, setNews] = useState(MOCK_NEWS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString('vi-VN'));
  const [currentSlide, setCurrentSlide] = useState(0);
  const [toast, setToast] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState(null);

  // --- Khởi tạo Tailwind CSS dự phòng ---
  useEffect(() => {
    if (!document.getElementById('tailwind-script')) {
      const twScript = document.createElement('script');
      twScript.id = 'tailwind-script';
      twScript.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(twScript);
    }
  }, []);

  // --- Khởi tạo Supabase Client ---
  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) return;
    
    if (!document.getElementById('supabase-script')) {
      const sbScript = document.createElement('script');
      sbScript.id = 'supabase-script';
      sbScript.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      sbScript.async = true;
      sbScript.onload = () => {
        if (window.supabase) {
          setSupabaseClient(window.supabase.createClient(supabaseUrl, supabaseKey));
        }
      };
      document.head.appendChild(sbScript);
    } else if (window.supabase && !supabaseClient) {
      setSupabaseClient(window.supabase.createClient(supabaseUrl, supabaseKey));
    }
  }, [supabaseClient]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HOT_NEWS_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // --- TỰ ĐỘNG CẬP NHẬT TIN TỨC & INSERT DB (10 PHÚT/LẦN) ---
  useEffect(() => {
    const fetchAndSaveNews = async () => {
      if (!apiKey) return; // Bỏ qua nếu chưa cấu hình API Key
      
      try {
        const prompt = `Tìm kiếm tin tức và viết 1 bản tin MỚI NHẤT về thị trường cà phê hôm nay.
        Trả về đúng định dạng JSON:
        {
          "category": "Tin tức tự động",
          "title": "Tiêu đề bài viết (10-15 chữ)",
          "author": "AI Bot",
          "readTime": "3 phút đọc",
          "summary": "Tóm tắt nội dung 2-3 câu.",
          "image": "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=800",
          "insights": ["Phân tích 1", "Phân tích 2", "Phân tích 3"],
          "content": [
            { "type": "lead", "text": "Mở bài..." },
            { "type": "paragraph", "text": "Nội dung chi tiết..." }
          ]
        }`;
        
        const result = await callGeminiAPI(prompt, "Bạn là nhà báo phân tích cà phê tự động.", true);
        if (result && result.text) {
          const parsed = JSON.parse(result.text);
          const newArticle = {
            ...parsed,
            id: `auto_news_${Date.now()}`,
            time: 'Vừa cập nhật'
          };
          
          // 1. Cập nhật state UI (chèn lên đầu danh sách, giữ tối đa 50 bài để không nặng trình duyệt)
          setNews(prev => [newArticle, ...prev].slice(0, 50));
          
          // 2. Gọi hàm Insert vào Database
          await saveNewsToDB(newArticle);
        }
      } catch (error) {
        console.error("Lỗi auto update news:", error);
      }
    };

    const INTERVAL_TIME = 10 * 60 * 1000; // 10 phút = 600,000 milliseconds
    const intervalId = setInterval(fetchAndSaveNews, INTERVAL_TIME);
    
    return () => clearInterval(intervalId); // Dọn dẹp interval khi component unmount
  }, [supabaseClient]);

  const saveNewsToDB = async (article) => {
    if (!supabaseClient) {
      console.warn("[DATABASE] Supabase chưa sẵn sàng. Chỉ lưu vào state tạm.");
      return;
    }
    
    try {
      const { data, error } = await supabaseClient
        .from('market_news') // Bảng market_news
        .insert([
          { 
            id: article.id, 
            title: article.title,
            category: article.category,
            author: article.author,
            summary: article.summary,
            content_json: article, 
            created_at: new Date().toISOString()
          }
        ]);
        
      if (error) throw error;
      console.log("[DATABASE] Đã lưu bài viết tự động vào DB thành công:", article.title);
    } catch (error) {
      console.error("[DATABASE] Lỗi khi insert tin tức:", error);
    }
  };
  // ------------------------------------------------------------

  const showToast = (msg, isError = false) => {
    setToast({ text: msg, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    showToast("AI đang thu thập dữ liệu thị trường trực tuyến...");
    
    try {
      const prompt = `Cập nhật giá cà phê nhân xô tại Việt Nam (Đắk Lắk, Lâm Đồng, Gia Lai, Đắk Nông) và giá Robusta London, Arabica New York hôm nay. Trả về JSON: { "domestic": [{"id": "daklak", "price": 105000, "change": 500}, ...], "global": [{"id": "london", "price": 4400, "change": 20}, ...], "aiSummary": "Tóm tắt xu hướng 1 câu" }`;
      const result = await callGeminiAPI(prompt, "Bạn là máy lấy dữ liệu giá cà phê chuyên nghiệp.", true);
      
      if (result && result.text) {
        const data = JSON.parse(result.text);
        setPrices(prev => {
          const nextPrices = { ...prev };
          if (data.domestic) {
            nextPrices.domestic = prev.domestic.map(p => {
              const update = data.domestic.find(d => d.id === p.id);
              return update ? { ...p, price: update.price, change: update.change, history: [...p.history.slice(1), update.price] } : p;
            });
          }
          if (data.global) {
            nextPrices.global = prev.global.map(g => {
              const update = data.global.find(d => d.id === g.id);
              return update ? { ...g, price: update.price, change: update.change, history: [...g.history.slice(1), update.price] } : g;
            });
          }
          if (data.aiSummary) nextPrices.aiInsights.summary = data.aiSummary;
          
          // Lưu giá trị thị trường mới vào Supabase
          if (supabaseClient) {
            supabaseClient
              .from('market_data')
              .upsert({ id: 'latest', prices_json: nextPrices })
              .then(({ error }) => {
                if (error) console.error("[DATABASE] Lỗi cập nhật giá:", error);
                else console.log("[DATABASE] Đã đồng bộ giá mới lên Supabase.");
              });
          }

          return nextPrices;
        });
        setLastUpdate(new Date().toLocaleTimeString('vi-VN'));
        showToast("Dữ liệu thị trường đã được làm mới ✨");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối AI: " + (err.message.includes("401") ? "Vấn đề xác thực API" : err.message), true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const runAiAnalysis = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    setAiAnalysis(null);
    try {
      const prompt = `Dựa trên dữ liệu giá hiện tại: ${JSON.stringify(prices.domestic)}. Hãy phân tích xu hướng ngắn hạn và đưa ra lời khuyên cụ thể (Mua/Bán/Giữ) cho nông dân Việt Nam. Sử dụng biểu tượng cảm xúc phù hợp.`;
      const result = await callGeminiAPI(prompt);
      setAiAnalysis(result);
    } catch (err) {
      showToast("Phân tích AI thất bại: " + err.message, true);
    } finally {
      setIsAiLoading(false);
    }
  };

  const Sparkline = ({ history, color }) => {
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const points = history.map((val, i) => {
      const x = (i / (history.length - 1)) * 60;
      const y = 20 - ((val - min) / range) * 20;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="60" height="20" className="opacity-80">
        <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      </svg>
    );
  };

  const DashboardView = () => (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
              <Zap size={12} fill="currentColor" /> Market Pulse
            </span>
            <span className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">AI Score: {prices.aiInsights.sentimentScore}/100</span>
          </div>
          <h2 className="text-2xl font-black mb-2">{prices.aiInsights.marketSentiment}</h2>
          <p className="text-stone-400 text-xs leading-relaxed mb-6 italic">"{prices.aiInsights.summary}"</p>
          
          <button 
            onClick={runAiAnalysis}
            disabled={isAiLoading}
            className="w-full bg-white text-stone-900 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
          >
            {isAiLoading ? <RotateCw className="animate-spin" size={16} /> : <BrainCircuit size={16} />}
            {isAiLoading ? "Đang suy luận..." : "Phân tích chiến lược AI ✨"}
          </button>

          {aiAnalysis && (
            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 animate-in slide-in-from-top-2 overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Phân tích chuyên sâu</span>
                <button onClick={() => setAiAnalysis(null)}><X size={12} className="text-stone-500" /></button>
              </div>
              <p className="text-[13px] text-stone-200 leading-relaxed font-medium whitespace-pre-wrap">
                {typeof aiAnalysis === 'string' ? aiAnalysis : aiAnalysis.text}
              </p>
              {aiAnalysis.groundings?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[9px] font-black text-stone-500 uppercase mb-2">Nguồn tin cậy:</p>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.groundings.slice(0, 2).map((g, i) => (
                      <a key={i} href={g.uri} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 underline truncate max-w-full">
                        {g.title || 'Nguồn tin'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <Coffee className="absolute -right-8 -bottom-8 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" size={200} />
      </div>

      <section>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-black text-stone-900">Thị trường nội địa</h3>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cập nhật: {lastUpdate}</p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-3 bg-white rounded-2xl shadow-sm border border-stone-100 text-stone-900 transition-all active:scale-90 ${isRefreshing ? 'opacity-50' : ''}`}
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {prices.domestic.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem({...item, type: 'price'})}
              className="bg-white p-4 rounded-3xl shadow-sm border border-stone-100 hover:border-emerald-200 transition-all cursor-pointer group active:scale-95"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-stone-400 uppercase">{item.province}</span>
                <Sparkline history={item.history} color={item.change >= 0 ? '#10b981' : '#ef4444'} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-stone-900">{item.price.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-stone-400">đ/kg</span>
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-black mt-1 ${item.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {item.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(item.change).toLocaleString()}đ
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-8">
        <h3 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Sàn giao dịch quốc tế</h3>
        <div className="space-y-3">
          {prices.global.map((item) => (
            <div 
              key={item.id}
              onClick={() => setSelectedItem({...item, type: 'price'})}
              className="bg-stone-50 p-5 rounded-[2rem] flex justify-between items-center border border-stone-200/50 hover:bg-white transition-all cursor-pointer active:scale-98"
            >
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase">{item.market}</p>
                <p className="text-xl font-black text-stone-900 mt-1">{item.price.toLocaleString()} <span className="text-[11px] text-stone-400 font-bold">{item.unit}</span></p>
              </div>
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-[11px] font-black ${item.change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {item.change >= 0 ? '+' : ''}{item.change}
                </div>
                <p className="text-[9px] font-bold text-stone-400 mt-2 uppercase tracking-tighter">{item.trend}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const BrazilView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="relative h-64 rounded-[3rem] overflow-hidden shadow-2xl">
        <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Brazil" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent p-8 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-white text-[10px] font-black tracking-widest uppercase">Live Report: Brazil</span>
          </div>
          <h2 className="text-white text-3xl font-black leading-tight">Mùa vụ Brazil 2024</h2>
          <p className="text-emerald-400 text-sm font-bold mt-1">Xu hướng: Cung ứng thắt chặt</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100">
          <p className="text-[10px] font-black text-stone-400 uppercase mb-2">THU HOẠCH</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-stone-900">{prices.brazil.harvestProgress}%</span>
            <span className="text-[10px] text-emerald-600 font-bold mb-1">+5% w/w</span>
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${prices.brazil.harvestProgress}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100">
          <p className="text-[10px] font-black text-stone-400 uppercase mb-2">DỰ BÁO SẢN LƯỢNG</p>
          <p className="text-3xl font-black text-stone-900">{prices.brazil.expectedOutput}</p>
          <p className="text-[10px] text-red-500 font-bold mt-2 flex items-center gap-1">
            <TrendingDown size={10} /> Giảm {Math.abs(prices.brazil.outputChange)}%
          </p>
        </div>
      </div>

      <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-200/50 space-y-4">
        <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest flex items-center gap-2">
          <CloudSun size={16} /> Chỉ số sinh trưởng & Logistics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Nhiệt độ', val: prices.brazil.temperatureAnomaly, icon: Thermometer, color: 'text-orange-500' },
            { label: 'Độ ẩm đất', val: prices.brazil.soilMoisture, icon: Droplets, color: 'text-blue-500' },
            { label: 'Cảng Santos', val: prices.brazil.portStatus, icon: Coffee, color: 'text-indigo-500' },
            { label: 'Mức rủi ro', val: prices.brazil.riskLevel, icon: AlertTriangle, color: 'text-red-500' }
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`p-2 bg-white rounded-xl ${stat.color} shadow-sm border border-stone-100`}>
                <stat.icon size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black text-stone-400 uppercase">{stat.label}</p>
                <p className="text-xs font-black text-stone-900">{stat.val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-emerald-500 p-2 rounded-xl text-white">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase text-emerald-900 tracking-widest">Đánh giá chuyên sâu (AI)</h4>
            <p className="text-[9px] font-bold text-emerald-600">Độ tin cậy: {prices.brazil.confidence}%</p>
          </div>
        </div>
        <div className="space-y-3">
          {prices.brazil.deepAnalysis.map((line, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-emerald-500 font-bold">•</span>
              <p className="text-xs text-emerald-900/80 leading-relaxed font-medium">{line}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const NewsView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="relative h-48 rounded-[2.5rem] overflow-hidden group shadow-xl bg-stone-900">
        {HOT_NEWS_SLIDES.map((slide, i) => (
          <div 
            key={slide.id}
            className={`absolute inset-0 bg-gradient-to-br ${slide.color} p-8 flex flex-col justify-center transition-all duration-700 ease-in-out ${i === currentSlide ? 'opacity-100 scale-100 z-10 pointer-events-auto' : 'opacity-0 scale-95 z-0 pointer-events-none'}`}
          >
            <div className="flex items-center gap-2 mb-2 relative z-20">
              <span className="px-2 py-0.5 bg-white/20 text-white text-[9px] font-black rounded-md uppercase tracking-widest">{slide.tag}</span>
            </div>
            <h3 className="text-white text-xl font-black leading-tight pr-8 relative z-20">{slide.title}</h3>
            
            {/* CẬP NHẬT: Thêm sự kiện onClick cho nút "Xem chi tiết" và set type = 'news' */}
            <button 
              onClick={() => setSelectedItem({...slide, type: 'news'})}
              className="mt-4 flex w-fit items-center gap-2 text-[10px] font-black text-white/80 uppercase hover:text-white transition-colors relative z-20 cursor-pointer active:scale-95"
            >
              Xem chi tiết <ArrowRight size={14} />
            </button>
            
            {/* Lớp phủ ẩn để người dùng có thể click toàn bộ slide nếu muốn */}
            <div 
              className="absolute inset-0 z-10 cursor-pointer" 
              onClick={() => setSelectedItem({...slide, type: 'news'})}
            ></div>
          </div>
        ))}
        <div className="absolute bottom-6 right-8 flex gap-1.5 z-30">
          {HOT_NEWS_SLIDES.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-4 bg-white' : 'w-1 bg-white/40'}`} />
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-stone-900">Bản tin phân tích</h3>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{news.length} Bài viết</span>
      </div>

      {/* CẬP NHẬT: Giao diện thẻ bài viết dọc với nhiều không gian hơn và phần "Góc nhìn AI" */}
      <div className="space-y-6 pb-20">
        {news.map((item) => (
          <div 
            key={item.id} 
            onClick={() => setSelectedItem({...item, type: 'news'})}
            className="bg-white p-5 rounded-[2.5rem] flex flex-col shadow-sm border border-stone-100 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group active:scale-98"
          >
            {/* Ảnh cover full chiều ngang, không bị méo */}
            <div className="w-full h-48 rounded-2xl overflow-hidden mb-5 shrink-0">
              <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.title} />
            </div>
            
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md uppercase">{item.category}</span>
                  <span className="text-[10px] text-stone-500 font-bold">{item.author}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-stone-400">
                  <Clock size={12} /> {item.time}
                </div>
              </div>
              
              <h4 className="text-[18px] font-black text-stone-900 leading-snug group-hover:text-emerald-700 transition-colors mb-3">{item.title}</h4>
              <p className="text-[14px] text-stone-600 leading-relaxed mb-5">{item.summary}</p>
              
              {/* Phần phân tích sâu mới (Insights) */}
              {item.insights && (
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100/80 mb-2">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-700">Góc nhìn AI</span>
                  </div>
                  <ul className="space-y-2.5">
                    {item.insights.map((insight, idx) => (
                      <li key={idx} className="text-[13px] text-stone-700 font-medium flex gap-2.5 items-start leading-relaxed">
                        <span className="text-emerald-500 mt-0.5 font-bold">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const DetailOverlay = () => {
    if (!selectedItem) return null;
    const isNews = selectedItem.type === 'news';

    return (
      <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
        <div className="w-full max-w-md mx-auto bg-white rounded-t-[3rem] max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-12 duration-500">
          <div className="sticky top-0 bg-white/80 backdrop-blur-md px-8 py-6 flex justify-between items-center z-10 border-b border-stone-50">
            <button onClick={() => setSelectedItem(null)} className="p-2 bg-stone-100 rounded-2xl text-stone-600 active:scale-90 transition-all">
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-2">
              <button className="p-2 bg-stone-100 rounded-2xl text-stone-600"><Share2 size={18} /></button>
              <button className="p-2 bg-stone-100 rounded-2xl text-stone-600"><Bookmark size={18} /></button>
            </div>
          </div>

          <div className="px-8 pt-4 pb-12">
            {isNews ? (
              <article>
                <img src={selectedItem.image} className="w-full h-56 object-cover rounded-[2.5rem] mb-6 shadow-md" alt="" />
                <div className="flex gap-3 items-center text-[10px] font-black text-stone-400 uppercase mb-4">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{selectedItem.category}</span>
                  <span>{selectedItem.time}</span>
                  <span>•</span>
                  <span>{selectedItem.readTime}</span>
                </div>
                <h1 className="text-2xl font-black text-stone-900 leading-tight mb-4">{selectedItem.title}</h1>
                <p className="text-stone-500 text-[15px] italic mb-8 border-l-4 border-emerald-500 pl-4 leading-relaxed">{selectedItem.summary}</p>
                
                {selectedItem.insights && (
                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100/50 mb-8">
                    <h3 className="text-xs font-black uppercase text-emerald-800 tracking-widest mb-4 flex items-center gap-2">
                      <Sparkles size={16} /> Nhận định lõi
                    </h3>
                    <ul className="space-y-3">
                      {selectedItem.insights.map((insight, idx) => (
                        <li key={idx} className="text-sm text-emerald-900 font-medium flex gap-3 items-start">
                          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                          <span className="leading-relaxed">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-6">
                  {selectedItem.content.map((block, i) => (
                    <div key={i}>
                      {block.type === 'lead' && <p className="text-[17px] font-bold text-stone-900 leading-relaxed">{block.text}</p>}
                      {block.type === 'paragraph' && <p className="text-[15px] text-stone-700 leading-loose font-medium">{block.text}</p>}
                      {block.type === 'quote' && (
                        <blockquote className="bg-stone-50 p-6 rounded-3xl border-l-4 border-stone-900 my-8 shadow-sm">
                          <p className="text-[15px] italic font-bold text-stone-800 leading-relaxed">"{block.text}"</p>
                          <cite className="text-[10px] font-black uppercase text-stone-400 mt-3 block flex items-center gap-2">
                            <span className="w-4 h-px bg-stone-300"></span> {block.author}
                          </cite>
                        </blockquote>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ) : (
              <div className="space-y-8">
                <div className="text-center py-6">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">{selectedItem.province || selectedItem.market}</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-6xl font-black text-stone-900">{selectedItem.price.toLocaleString()}</span>
                    <span className="text-xl font-bold text-stone-400">{selectedItem.unit || 'đ/kg'}</span>
                  </div>
                  <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-2xl text-sm font-black ${selectedItem.change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {selectedItem.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {Math.abs(selectedItem.change).toLocaleString()}đ
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-stone-50 p-6 rounded-[2rem] text-center border border-stone-100">
                    <p className="text-[9px] font-black text-stone-400 uppercase mb-1">Đỉnh 30 ngày</p>
                    <p className="text-xl font-black text-stone-900">{selectedItem.high30d?.toLocaleString() || '---'}</p>
                  </div>
                  <div className="bg-stone-50 p-6 rounded-[2rem] text-center border border-stone-100">
                    <p className="text-[9px] font-black text-stone-400 uppercase mb-1">Đáy 30 ngày</p>
                    <p className="text-xl font-black text-stone-900">{selectedItem.low30d?.toLocaleString() || '---'}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BarChart3 size={16} /> Biến động 7 phiên gần nhất
                  </h4>
                  <div className="h-32 flex items-end justify-between gap-1">
                    {selectedItem.history.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-1000 ${selectedItem.change >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}
                          style={{ height: `${(h / Math.max(...selectedItem.history)) * 100}%` }}
                        />
                        <span className="text-[8px] font-bold text-stone-400">P{i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-stone-900 text-white p-8 rounded-[2.5rem]">
                  <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Info size={16} className="text-emerald-400" /> Nhận định thị trường
                  </h4>
                  <p className="text-sm text-stone-300 leading-relaxed font-medium">
                    {selectedItem.analysis}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-stone-50 min-h-screen relative font-sans text-stone-900 selection:bg-emerald-200 overflow-x-hidden">
      {toast && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] ${toast.isError ? 'bg-red-600' : 'bg-stone-900'} text-white px-6 py-4 rounded-full text-xs font-black shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border border-white/10`}>
          {toast.isError ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} className="text-emerald-400" />} {toast.text}
        </div>
      )}

      <header className="px-8 py-10 flex justify-between items-center bg-stone-50/80 backdrop-blur-md sticky top-0 z-40">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tighter">Coffee Intel</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <p className="text-[10px] text-stone-400 font-black tracking-widest uppercase">Chuyên gia AI Độc lập ✨</p>
          </div>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center text-stone-300 overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
        </div>
      </header>

      <main className="px-8 pt-2 pb-32">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'brazil' && <BrazilView />}
        {activeTab === 'news' && <NewsView />}
      </main>

      <DetailOverlay />

      <nav className="fixed bottom-8 left-8 right-8 h-20 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 flex items-center justify-around px-4 z-40 max-w-sm mx-auto">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-emerald-600 scale-110' : 'text-stone-300'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'dashboard' ? 'bg-emerald-50' : ''}`}><BarChart3 size={24} /></div>
          <span className="text-[9px] font-black uppercase tracking-tighter">Thị trường</span>
        </button>
        <button onClick={() => setActiveTab('brazil')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'brazil' ? 'text-emerald-600 scale-110' : 'text-stone-300'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'brazil' ? 'bg-emerald-50' : ''}`}><Globe size={24} /></div>
          <span className="text-[9px] font-black uppercase tracking-tighter">Brazil</span>
        </button>
        <button onClick={() => setActiveTab('news')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'news' ? 'text-emerald-600 scale-110' : 'text-stone-300'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'news' ? 'bg-emerald-50' : ''}`}><Newspaper size={24} /></div>
          <span className="text-[9px] font-black uppercase tracking-tighter">Tin tức</span>
        </button>
      </nav>

      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-40">
        <div className="absolute top-[10%] left-[-10%] w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-80 h-80 bg-stone-200/30 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}