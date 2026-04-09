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

  const maxRetries = 5;
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

// --- Dữ liệu khởi tạo ---
const HOT_NEWS = [
  { id: 'h1', title: 'Brazil dự báo sản lượng niên vụ mới giảm 5% do khô hạn', tag: 'TIN NÓNG AI', type: 'alert', color: 'bg-stone-900' },
  { id: 'h2', title: 'Giá Robusta đạt đỉnh 15 năm trên sàn London sáng nay', tag: 'CẢNH BÁO GIÁ', type: 'trending', color: 'bg-emerald-900' },
  { id: 'h3', title: 'Cảng Santos (Brazil) đình công gây tắc nghẽn vận tải', tag: 'LOGISTICS', type: 'globe', color: 'bg-blue-900' }
];

const INITIAL_PRICES = {
  domestic: [
    { id: 'daklak', province: 'Đắk Lắk', price: 85300, change: -400, history: [82000, 83500, 86000, 89300, 87000, 86000, 85300], high30d: 92000, low30d: 78000, trend: 'Bearish', analysis: 'Giá đang điều chỉnh sau đợt tăng nóng.' },
    { id: 'lamdong', province: 'Lâm Đồng', price: 84700, change: -100, history: [81500, 82000, 85500, 88800, 86500, 85500, 84700], high30d: 91500, low30d: 77500, trend: 'Bearish', analysis: 'Tâm lý chốt lời của nông dân ảnh hưởng giá.' },
    { id: 'gialai', province: 'Gia Lai', price: 85100, change: +200, history: [81800, 83000, 85800, 89100, 86800, 85800, 85100], high30d: 91800, low30d: 78200, trend: 'Neutral', analysis: 'Lực mua từ các đơn vị XK vẫn ổn định.' },
    { id: 'daknong', province: 'Đắk Nông', price: 85200, change: +300, history: [81900, 83200, 85900, 89100, 86900, 85900, 85200], high30d: 91900, low30d: 78100, trend: 'Neutral', analysis: 'Nguồn cung hạn chế giúp giá vững.' },
  ],
  global: [
    { id: 'london', market: 'London (Robusta)', price: 3412, unit: 'USD/Tấn', change: -85, history: [3200, 3250, 3350, 3500, 3480, 3450, 3412], high30d: 3650, low30d: 3100, trend: 'Bullish', analysis: 'Thiếu hụt nguồn cung toàn cầu.' },
    { id: 'newyork', market: 'New York (Arabica)', price: 212.45, unit: 'cts/lb', change: +1.2, history: [205.1, 208.4, 210.2, 215.0, 213.5, 211.2, 212.45], high30d: 225.0, low30d: 198.5, trend: 'Bullish', analysis: 'Lo ngại về thời tiết tại Brazil.' },
  ],
  brazil: {
    harvestProgress: 15, expectedOutput: '70.7M bao', outputChange: -2.3, weatherStatus: 'Khô hạn kéo dài',
    riskLevel: 'Nghiêm trọng', sentiment: 'Bullish', confidence: 88,
    portStatus: 'Kẹt cảng 12 ngày', soilMoisture: '28%', temperatureAnomaly: '+2.5°C',
    regions: [
      { name: 'Minas Gerais', status: 'Hạn hán', impact: 'Nặng' }, 
      { name: 'Sao Paulo', status: 'Thiếu nước', impact: 'Trung bình' },
      { name: 'Espírito Santo', status: 'Ổn định', impact: 'Thấp' }
    ],
    deepAnalysis: [
      "Hiện tượng El Nino đang duy trì nền nhiệt cao hơn 2.5°C so với trung bình nhiều năm tại vành đai Arabica.",
      "Độ ẩm đất tại Minas Gerais rơi xuống mức nguy hiểm (28%), đe dọa trực tiếp đến giai đoạn phát triển kích thước hạt, có thể làm giảm tỷ lệ hạt to (Screen 17/18).",
      "Về Logistics: Cảng Santos đang quá tải, thời gian chờ bốc xếp kéo dài lên 12 ngày, làm gián đoạn chuỗi cung ứng và tạo độ trễ nguồn cung toàn cầu, trực tiếp đẩy giá Robusta thay thế lên cao."
    ]
  },
  aiInsights: {
    marketSentiment: 'Thận trọng', sentimentScore: 62, summary: 'Thị trường đang chốt lời ngắn hạn nhưng tin Brazil vẫn hỗ trợ giá.', newsImpact: 'Tích cực trung hạn', recommendation: 'Ưu tiên giữ hàng.'
  }
};

const MOCK_NEWS = [
  {
    id: 'n1', category: 'Thị trường', title: 'Xuất khẩu cà phê Việt Nam quý 1 đạt kỷ lục chưa từng có', author: 'Minh Quang', readTime: '5 phút đọc',
    summary: 'Kim ngạch xuất khẩu tăng trưởng mạnh nhờ giá neo cao...', time: '1 giờ trước',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800',
    content: [
      { type: 'lead', text: "Kết thúc quý 1 năm 2026, ngành cà phê Việt Nam ghi nhận một cột mốc lịch sử mới khi kim ngạch xuất khẩu đạt hơn 1,9 tỷ USD, tăng 54% so với cùng kỳ năm ngoái, mặc dù sản lượng xuất khẩu chỉ tăng nhẹ." },
      { type: 'paragraph', text: "Theo số liệu sơ bộ từ Tổng cục Hải quan, lượng cà phê xuất khẩu trong 3 tháng đầu năm ước đạt 580.000 tấn. Mặc dù khối lượng không có sự đột biến lớn, nhưng giá trị thu về lại tăng vọt nhờ giá cà phê thế giới liên tục phá đỉnh." },
      { type: 'subheading', text: "Động lực từ nguồn cung toàn cầu suy yếu" },
      { type: 'paragraph', text: "Nguyên nhân chính dẫn đến đà tăng giá phi mã này xuất phát từ những lo ngại về nguồn cung tại các quốc gia sản xuất lớn khác. Brazil và Indonesia, hai đối thủ cạnh tranh chính của Việt Nam, đều đang phải đối mặt với tình trạng thời tiết cực đoan do ảnh hưởng của hiện tượng El Nino kéo dài." },
      { type: 'quote', text: "Với tình hình khan hiếm hàng thực như hiện nay, các nhà rang xay toàn cầu đang phải đổ dồn về thị trường Việt Nam để tìm kiếm nguồn cung thay thế, chấp nhận mức giá cao chưa từng thấy.", author: "Chuyên gia phân tích thị trường" },
      { type: 'paragraph', text: "Cụ thể, giá xuất khẩu bình quân của cà phê Việt Nam trong quý 1 đạt mức 3.200 USD/tấn, mức cao nhất trong lịch sử ghi nhận. Thậm chí, nhiều lô hàng giao ngay còn được giao dịch với giá cao hơn mức giá tham chiếu trên sàn London." },
      { type: 'subheading', text: "Dự báo triển vọng tỷ đô" },
      { type: 'paragraph', text: "Nhiều chuyên gia dự báo, nếu đà giá này tiếp tục được duy trì và nguồn cung trong nước còn đủ để đáp ứng các đơn hàng đã ký, kim ngạch xuất khẩu cà phê của Việt Nam trong năm 2026 hoàn toàn có khả năng vượt mốc 5 tỷ USD - một con số mơ ước của ngành nông nghiệp." }
    ]
  },
  {
    id: 'n2', category: 'Thời tiết', title: 'Brazil đối mặt rủi ro khô hạn kép tại vùng Arabica trọng điểm', author: 'Hương Giang', readTime: '4 phút đọc',
    summary: 'Cảnh báo El Nino gây hạn hán kéo dài tại Brazil...', time: '3 giờ trước',
    image: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&q=80&w=800',
    content: [
      { type: 'lead', text: "Cơ quan Khí tượng Quốc gia Brazil (INMET) vừa phát đi cảnh báo đỏ về tình trạng khô hạn kéo dài tại khu vực Đông Nam, nơi tập trung các vành đai trồng cà phê Arabica lớn nhất thế giới." },
      { type: 'paragraph', text: "Báo cáo mới nhất cho thấy lượng mưa đo được tại các bang Minas Gerais và Sao Paulo trong 30 ngày qua thấp hơn tới 40% so với trung bình nhiều năm. Đáng lo ngại hơn, tình trạng này xảy ra đúng vào giai đoạn cây cà phê đang nuôi trái, cần lượng nước dồi dào để phát triển kích thước hạt." },
      { type: 'subheading', text: "Nguy cơ sụt giảm sản lượng và chất lượng" },
      { type: 'paragraph', text: "Việc thiếu nước nghiêm trọng kết hợp với nhiệt độ trung bình cao hơn bình thường khoảng 2-3 độ C khiến độ ẩm đất giảm mạnh. Cây cà phê bị stress nhiệt có thể dẫn đến hiện tượng rụng trái non hoặc hạt nhỏ (cherry size), trực tiếp làm giảm tỷ lệ hạt đạt chuẩn xuất khẩu loại 1." },
      { type: 'quote', text: "Nếu không có những cơn mưa lớn trong 2 tuần tới, chúng tôi ước tính sản lượng Arabica của khu vực này có thể giảm từ 10% đến 15% so với dự báo ban đầu.", author: "Hợp tác xã nông nghiệp Minas Gerais" },
      { type: 'paragraph', text: "Ngay khi thông tin này được công bố, thị trường tài chính đã phản ứng dữ dội. Trên sàn giao dịch ICE New York, giá cà phê Arabica kỳ hạn đã nhảy vọt hơn 3% chỉ trong phiên giao dịch buổi sáng, đạt mức cao nhất trong 6 tháng qua." },
      { type: 'paragraph', text: "Sự cố thời tiết tại Brazil không chỉ ảnh hưởng đến giá Arabica mà còn tạo hiệu ứng lan tỏa, hỗ trợ đà tăng cho cả giá cà phê Robusta trên sàn London, gián tiếp mang lại lợi thế cho giá cà phê nội địa Việt Nam." }
    ]
  },
  {
    id: 'n3', category: 'Logistics', title: 'Cước vận tải biển tăng vọt do căng thẳng Biển Đỏ', author: 'Trần Hải', readTime: '3 phút đọc',
    summary: 'Chi phí vận chuyển cà phê sang châu Âu tăng mạnh...', time: '5 giờ trước',
    image: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&q=80&w=800',
    content: [
      { type: 'lead', text: "Chi phí vận chuyển container từ châu Á sang châu Âu đã tăng gấp đôi trong vòng 2 tháng qua." },
      { type: 'paragraph', text: "Sự gián đoạn tại Biển Đỏ buộc các hãng tàu phải đi vòng qua Mũi Hảo Vọng, kéo dài thời gian hành trình thêm 10-15 ngày và đội chi phí lên cao. Điều này khiến giá cà phê cập cảng châu Âu bị cộng thêm một khoản phụ phí không nhỏ." }
    ]
  },
  {
    id: 'n4', category: 'Phân tích', title: 'Quỹ đầu cơ xả hàng, thị trường liệu có đảo chiều?', author: 'Góc nhìn AI', readTime: '6 phút đọc',
    summary: 'Dấu hiệu chốt lời từ các quỹ đầu cơ lớn trên sàn London...', time: '12 giờ trước',
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=800',
    content: [
      { type: 'lead', text: "Báo cáo COT mới nhất cho thấy các quỹ đầu tư đang thu hẹp vị thế mua ròng (net long) trên cả hai sàn giao dịch kỳ hạn." },
      { type: 'paragraph', text: "Tuy nhiên, lực bán vẫn chưa đủ mạnh để bẻ gãy xu hướng tăng dài hạn do cấu trúc thiếu hụt nguồn cung cơ bản vẫn chưa được giải quyết dứt điểm." }
    ]
  }
];

// Hàm sinh tin tức tự động
const generateAutoNews = () => {
  const now = new Date();
  return {
    id: `auto_${now.getTime()}`,
    category: ['Thị trường', 'Giá cả', 'Thời tiết', 'Xuất khẩu'][Math.floor(Math.random() * 4)],
    title: `Bản tin nhanh thị trường cà phê lúc ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
    author: 'AI Reporter',
    readTime: '2 phút đọc',
    summary: 'Bản tin tổng hợp tự động các biến động mới nhất trên thị trường nội địa và quốc tế...',
    time: 'Vừa xong',
    image: `https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=800&sig=${now.getTime()}`,
    content: [
      { type: 'lead', text: `Hệ thống ghi nhận biến động mới nhất vào lúc ${now.toLocaleTimeString('vi-VN')}.` },
      { type: 'paragraph', text: 'Đây là bản tin được tổng hợp tự động hàng giờ bởi hệ thống AI nhằm giúp người dùng nắm bắt nhanh nhất các xu hướng của thị trường cà phê toàn cầu.' }
    ]
  };
};

export default function App() {
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prices, setPrices] = useState(INITIAL_PRICES);
  const [news, setNews] = useState(MOCK_NEWS);
  const [visibleNewsCount, setVisibleNewsCount] = useState(3);
  const [bookmarks, setBookmarks] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [toast, setToast] = useState(null);
  
  // Use a ref to always access the latest prices inside async functions
  const pricesRef = useRef(prices);
  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  // --- Gemini Specific States ---
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);

  // --- 1. Load External Scripts (Tailwind CSS & Supabase) ---
  useEffect(() => {
    // Inject Tailwind CSS để đảm bảo giao diện luôn hiển thị chính xác mọi nơi
    if (!document.getElementById('tailwind-script')) {
      const twScript = document.createElement('script');
      twScript.id = 'tailwind-script';
      twScript.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(twScript);
    }

    // Inject Supabase JS Client
    if (!document.getElementById('supabase-script')) {
      const sbScript = document.createElement('script');
      sbScript.id = 'supabase-script';
      sbScript.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      sbScript.async = true;
      sbScript.onload = () => {
        if (supabaseUrl && supabaseKey && window.supabase) {
          const client = window.supabase.createClient(supabaseUrl, supabaseKey);
          setSupabaseClient(client);
        }
      };
      document.head.appendChild(sbScript);
    } else if (window.supabase && supabaseUrl && supabaseKey && !supabaseClient) {
      const client = window.supabase.createClient(supabaseUrl, supabaseKey);
      setSupabaseClient(client);
    }
  }, [supabaseClient]);

  // --- 2. Auth & Setup ---
  useEffect(() => {
    if (!supabaseClient) return;
    const initAuth = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) setUser(session.user);
      else {
        const { data, error } = await supabaseClient.auth.signInAnonymously();
        if (!error) setUser(data.user);
      }
    };
    initAuth();
    const { data: authListener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => authListener.subscription.unsubscribe();
  }, [supabaseClient]);

  // --- 3. Data Sync ---
  useEffect(() => {
    if (!supabaseClient || !user) return;
    const fetchInitialData = async () => {
      const { data: mData, error: mError } = await supabaseClient.from('market_data').select('*').eq('id', 'latest').single();
      if (!mError && mData) {
        setPrices(mData.prices_json);
        setLastUpdate(new Date().toLocaleTimeString());
      } else if (mError?.code === 'PGRST116') {
        await supabaseClient.from('market_data').upsert({ id: 'latest', prices_json: INITIAL_PRICES });
      }
      const { data: uData, error: uError } = await supabaseClient.from('user_profiles').select('bookmarks').eq('user_id', user.id).single();
      if (!uError && uData) setBookmarks(uData.bookmarks || []);
      else if (uError?.code === 'PGRST116') {
        await supabaseClient.from('user_profiles').upsert({ user_id: user.id, bookmarks: [] });
      }
    };
    fetchInitialData();
    const channel = supabaseClient.channel('market-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'market_data', filter: 'id=eq.latest' }, payload => {
        if (payload.new && payload.new.prices_json) {
          setPrices(payload.new.prices_json);
          setLastUpdate(new Date().toLocaleTimeString());
        }
      }).subscribe();
    return () => { supabaseClient.removeChannel(channel); };
  }, [supabaseClient, user]);

  // --- 4. Auto Fetch Real Data on First Load ---
  const hasAutoFetched = useRef(false);
  useEffect(() => {
    const isSupabaseReady = (supabaseUrl && supabaseKey) ? supabaseClient !== null : true;
    
    // Nếu có API Key và chưa auto fetch bao giờ thì kích hoạt lấy dữ liệu thực tế
    if (!hasAutoFetched.current && apiKey && isSupabaseReady) {
      hasAutoFetched.current = true;
      // Delay 1.5s để UI khởi tạo xong rồi mới load ngầm
      setTimeout(() => {
        handleRefresh(true);
      }, 1500);
    }
  }, [supabaseClient]);

  // Tự động chuyển slide cho News
  useEffect(() => {
    if (activeTab === 'news' && !selectedItem) {
      const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % HOT_NEWS.length), 4000);
      return () => clearInterval(timer);
    }
  }, [activeTab, selectedItem]);

  // Auto update news every 1 hour
  useEffect(() => {
    const ONE_HOUR = 60 * 60 * 1000;
    const interval = setInterval(() => {
      setNews(prevNews => [generateAutoNews(), ...prevNews]);
    }, ONE_HOUR);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleRefresh = async (isAutoLoad = false) => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    if (!isAutoLoad) {
      showToast(apiKey ? "Đang tìm kiếm giá thực tế trên Internet..." : "Đang làm mới giá (Chế độ Local)...");
    } else if (apiKey) {
      showToast("Tự động đồng bộ dữ liệu mới nhất ✨");
    }
    
    let currentPrices = pricesRef.current || INITIAL_PRICES;
    let updatedPrices = { ...currentPrices };

    try {
      if (!apiKey) throw new Error("Chưa cấu hình API Key, chuyển sang chế độ Local");

      const prompt = `Hãy tìm kiếm trên Internet giá cà phê thực tế mới nhất hôm nay tại Việt Nam và thế giới (London, New York).
      Trích xuất dữ liệu và trả về đúng định dạng JSON này (CHỈ TRẢ VỀ JSON, KHÔNG CÓ BẤT KỲ TEXT NÀO KHÁC):
      {
        "domestic": [
          {"id": "daklak", "price": <giá số nguyên VD: 105000>, "change": <số chênh lệch so với hôm qua>, "trend": "Bullish/Bearish/Neutral", "analysis": "Nhận định ngắn từ tin tức mới nhất"},
          {"id": "lamdong", "price": <số>, "change": <số>, "trend": "...", "analysis": "..."},
          {"id": "gialai", "price": <số>, "change": <số>, "trend": "...", "analysis": "..."},
          {"id": "daknong", "price": <số>, "change": <số>, "trend": "...", "analysis": "..."}
        ],
        "global": [
          {"id": "london", "price": <số USD>, "change": <số>, "trend": "...", "analysis": "..."},
          {"id": "newyork", "price": <số Cent>, "change": <số>, "trend": "...", "analysis": "..."}
        ],
        "aiInsights": {
          "marketSentiment": "Tên xu hướng ngắn gọn",
          "sentimentScore": <điểm 0-100>,
          "summary": "Tóm tắt thị trường hôm nay dựa trên dữ liệu thực tế"
        }
      }`;
      
      const jsonStr = await callGeminiAPI(prompt, "Bạn là bot lấy dữ liệu thực tế mới nhất.", true);
      const realData = JSON.parse(jsonStr);

      const newDomestic = currentPrices.domestic.map(old => {
        const fresh = realData.domestic?.find(d => d.id === old.id) || {};
        const newPrice = fresh.price || old.price;
        return { ...old, ...fresh, history: [...old.history.slice(1), newPrice] };
      });

      const newGlobal = currentPrices.global.map(old => {
        const fresh = realData.global?.find(g => g.id === old.id) || {};
        const newPrice = fresh.price || old.price;
        return { ...old, ...fresh, history: [...old.history.slice(1), newPrice] };
      });

      updatedPrices = { 
        ...currentPrices, 
        domestic: newDomestic, 
        global: newGlobal, 
        aiInsights: { ...currentPrices.aiInsights, ...realData.aiInsights } 
      };
    } catch (e) {
      console.error("Lỗi lấy dữ liệu thực tế, dùng dữ liệu dự phòng:", e);
      const newDomestic = (currentPrices.domestic || []).map(p => ({
        ...p, price: p.price + (Math.floor(Math.random() * 401) - 200), change: Math.floor(Math.random() * 800) - 400
      }));
      const newGlobal = (currentPrices.global || []).map(g => ({
        ...g, price: g.price + parseFloat(((Math.random() * 10) - 5).toFixed(2)), change: Math.floor(Math.random() * 100) - 50
      }));
      updatedPrices = { ...currentPrices, domestic: newDomestic, global: newGlobal, aiInsights: { ...currentPrices.aiInsights, sentimentScore: Math.floor(Math.random() * 100) } };
    }

    // LUÔN LUÔN cập nhật giao diện ngay lập tức để người dùng không phải chờ đợi
    setPrices(updatedPrices);
    setLastUpdate(new Date().toLocaleTimeString());

    if (!supabaseClient) {
      if (!isAutoLoad) showToast("Đã cập nhật giá dự phòng (Local) ✨");
      setIsRefreshing(false);
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('market_data')
        .update({ prices_json: updatedPrices })
        .eq('id', 'latest');
      
      if (error) throw error;
      if (!isAutoLoad) showToast("Đã đồng bộ lên máy chủ ✨");
    } catch (e) { 
      if (!isAutoLoad) showToast("Lỗi đồng bộ, chỉ cập nhật Local"); 
    } finally { 
      setIsRefreshing(false); 
    }
  };

  const toggleBookmark = async (id) => {
    if (!user) return;
    const isBookmarked = bookmarks.includes(id);
    const next = isBookmarked ? bookmarks.filter(b => b !== id) : [...bookmarks, id];
    
    if (!supabaseClient) {
      setBookmarks(next);
      showToast(isBookmarked ? "Đã gỡ lưu (Local)" : "Đã lưu tin (Local) ✨");
      return;
    }

    try {
      const { error } = await supabaseClient.from('user_profiles').update({ bookmarks: next }).eq('user_id', user.id);
      if (error) throw error;
      setBookmarks(next);
      showToast(isBookmarked ? "Đã gỡ lưu" : "Đã lưu tin ✨");
    } catch (e) { showToast("Lỗi lưu dữ liệu"); }
  };

  // --- Gemini Logic ---
  const handleAiMarketAnalysis = async () => {
    if (!apiKey) { showToast("Vui lòng cấu hình Gemini API Key"); return; }
    setIsAiAnalyzing(true);
    setAiAnalysisResult(null);
    try {
      const prompt = `Dựa trên dữ liệu giá cà phê sau: Nội địa: ${prices.domestic.map(p => `${p.province}: ${p.price}đ`).join(', ')}. Thế giới: ${prices.global.map(g => `${g.market}: ${g.price}`).join(', ')}. Tin tức Brazil: ${prices.brazil.weatherStatus}, tiến độ ${prices.brazil.harvestProgress}%. Hãy đưa ra 1 tóm tắt thị trường ngắn gọn (3 dòng) và lời khuyên 'Mua', 'Bán' hoặc 'Chờ' cho nông dân Việt Nam.`;
      const result = await callGeminiAPI(prompt, "Bạn là chuyên gia kinh tế cao cấp ngành cà phê.");
      setAiAnalysisResult(result);
    } catch (err) {
      showToast("AI đang bận, vui lòng thử lại sau.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleAiSummarizeNews = async (newsItem) => {
    if (!apiKey) { showToast("Vui lòng cấu hình Gemini API Key"); return; }
    setIsAiAnalyzing(true);
    try {
      const contentText = Array.isArray(newsItem.content) 
        ? newsItem.content.map(block => typeof block === 'string' ? block : block.text).join(' ') 
        : '';
        
      const prompt = `Tóm tắt tin tức sau thành 3 ý chính quan trọng nhất cho người kinh doanh cà phê: Tiêu đề: ${newsItem.title}. Nội dung: ${contentText}. Hãy dùng icon để đánh dấu các ý.`;
      const result = await callGeminiAPI(prompt, "Bạn là trợ lý AI tóm tắt tin tức kinh tế.");
      setSelectedItem({ ...newsItem, aiSummary: result, type: 'news' });
    } catch (err) {
      showToast("AI tóm tắt gặp lỗi.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleAiPredictTrend = async (priceItem) => {
    if (!apiKey) { showToast("Vui lòng cấu hình Gemini API Key"); return; }
    setIsAiAnalyzing(true);
    try {
      const prompt = `Phân tích lịch sử giá vùng ${priceItem.province || priceItem.market}: ${priceItem.history.join(', ')}. Giá hiện tại: ${priceItem.price}. Với xu hướng ${priceItem.trend}, hãy dự báo giá trong 3 ngày tới và đưa ra 1 hành động cụ thể ✨. Trả lời thật ngắn gọn.`;
      const result = await callGeminiAPI(prompt, "Bạn là máy học dự báo tài chính cà phê.");
      setSelectedItem({ ...priceItem, aiPrediction: result, type: 'price' });
    } catch (err) {
      showToast("Dự báo AI thất bại.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // --- Fixed Sparkline SVG ---
  const renderSparkline = (history = [], isNegative) => {
    if (!history || history.length < 2) return null;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = (max - min) || 1;
    
    const width = 64;
    const height = 32;
    const strokeWidth = 2.5;
    
    const points = history.map((d, i) => {
      const x = (i / (history.length - 1)) * (width - strokeWidth * 2) + strokeWidth;
      const y = height - (((d - min) / range) * (height - strokeWidth * 2)) - strokeWidth;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="w-16 h-8 shrink-0 flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible block">
          <polyline 
            fill="none" 
            stroke={isNegative ? "#ef4444" : "#10b981"} 
            strokeWidth={strokeWidth} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            points={points} 
          />
        </svg>
      </div>
    );
  };

  const getHotIcon = (type) => {
    switch (type) {
      case 'alert': return <AlertTriangle size={80} />;
      case 'trending': return <TrendingUp size={80} />;
      case 'globe': return <Globe size={80} />;
      default: return <Coffee size={80} />;
    }
  };

  // --- UI Views ---
  const DashboardView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-1">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">AI Market Intelligence</h3>
            <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-2">
              <Gauge size={12} /> Score: {prices.aiInsights?.sentimentScore || 0}
            </span>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl font-black">{prices.aiInsights?.marketSentiment || '---'}</div>
            <div className="h-10 w-px bg-white/20"></div>
            <p className="text-xs font-medium opacity-90 leading-relaxed line-clamp-2">
              {prices.aiInsights?.summary}
            </p>
          </div>

          {!aiAnalysisResult ? (
            <button 
              onClick={() => handleAiMarketAnalysis()}
              disabled={isAiAnalyzing}
              className="w-full flex items-center justify-center gap-2 bg-white text-emerald-800 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
            >
              {isAiAnalyzing ? <RotateCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isAiAnalyzing ? "Đang phân tích..." : "Phân tích thị trường tổng thể ✨"}
            </button>
          ) : (
            <div className="bg-black/20 p-4 rounded-2xl border border-white/10 animate-in zoom-in-95">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">Dự báo Gemini ✨</span>
                <button onClick={() => setAiAnalysisResult(null)}><X size={12} /></button>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90 italic">"{aiAnalysisResult}"</p>
            </div>
          )}
        </div>
        <Zap className="absolute right-[-20px] top-[-20px] text-white/5" size={120} />
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-stone-900">Bảng Giá</h2>
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Cập nhật: {lastUpdate}</p>
        </div>
        <button 
          onClick={() => handleRefresh(false)} 
          disabled={isRefreshing}
          className={`p-3 bg-white rounded-2xl shadow-sm border border-stone-100 text-emerald-600 active:scale-90 transition-all ${isRefreshing ? 'opacity-50' : ''}`}
        >
          <RotateCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <section>
        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
          <MapPin size={12} className="text-emerald-500" /> GIÁ NỘI ĐỊA (VN)
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {prices?.domestic?.map(item => (
            <div key={item.id} onClick={() => setSelectedItem({...item, type: 'price'})} className="bg-white p-4 rounded-3xl shadow-sm border border-stone-100 active:scale-95 transition-all cursor-pointer">
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black text-stone-400 uppercase">{item.province}</p>
                {renderSparkline(item.history, item.change < 0)}
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-xl font-black text-stone-900">{item.price?.toLocaleString()}</span>
                <span className="text-[9px] text-stone-400 font-bold uppercase">đ/kg</span>
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black mt-1 ${item.change < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {item.change < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                {Math.abs(item.change || 0).toLocaleString()}đ
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
          <Globe size={12} className="text-blue-500" /> SÀN THẾ GIỚI
        </h4>
        <div className="space-y-3">
          {prices?.global?.map(item => (
            <div key={item.id} onClick={() => setSelectedItem({...item, type: 'price'})} className="bg-stone-900 p-4 rounded-[2rem] flex justify-between items-center active:bg-stone-800 transition-all cursor-pointer">
              <div className="flex-1">
                <p className="text-stone-500 text-[9px] font-black uppercase">{item.market}</p>
                <p className="text-xl font-black text-white mt-1">{item.price?.toLocaleString()} <span className="text-[10px] text-stone-500 font-bold">{item.unit}</span></p>
              </div>
              <div className="flex items-center gap-4">
                {renderSparkline(item.history, item.change < 0)}
                <div className={`px-3 py-1 rounded-full text-[10px] font-black ${item.change < 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {item.change > 0 ? '+' : ''}{item.change}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const BrazilView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 px-1">
      <div className="relative h-56 bg-stone-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <img src="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-60" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 to-transparent p-6 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-md uppercase">LIVE REPORT</span>
            <span className="text-stone-300 text-[10px] font-bold uppercase tracking-widest">Brazil Intel</span>
          </div>
          <h2 className="text-white text-2xl font-black">Tình Hình Cung Ứng</h2>
          <p className="text-emerald-400 text-sm font-black mt-1">Xu hướng: {prices.brazil?.sentiment}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100">
          <p className="text-[10px] font-black text-stone-400 uppercase mb-2">TIẾN ĐỘ THU HOẠCH</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-stone-800">{prices.brazil?.harvestProgress || 0}%</p>
            <span className="text-[9px] text-emerald-500 font-bold mb-1">+2%/Tuần</span>
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${prices.brazil?.harvestProgress || 0}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100">
          <p className="text-[10px] font-black text-stone-400 uppercase mb-2">SẢN LƯỢNG DỰ BÁO</p>
          <p className="text-3xl font-black text-stone-800">{prices.brazil?.expectedOutput}</p>
          <p className="text-[9px] text-red-500 font-bold mt-2 flex items-center gap-1">
            <TrendingDown size={10} /> Giảm {Math.abs(prices.brazil?.outputChange || 0)}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
        <h3 className="text-xs font-black text-stone-800 uppercase tracking-widest flex items-center gap-2 mb-6">
          <CloudSun size={18} className="text-stone-400" /> Rủi ro & Logistics
        </h3>
        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600"><Thermometer size={16} /></div>
            <div>
              <p className="text-[9px] font-black text-stone-400 uppercase mb-1">Nhiệt độ</p>
              <p className="text-sm font-black text-stone-900">{prices.brazil?.temperatureAnomaly || '+2.5°C'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Droplets size={16} /></div>
            <div>
              <p className="text-[9px] font-black text-stone-400 uppercase mb-1">Độ ẩm đất</p>
              <p className="text-sm font-black text-red-500">{prices.brazil?.soilMoisture || '28%'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600"><Globe size={16} /></div>
            <div>
              <p className="text-[9px] font-black text-stone-400 uppercase mb-1">Cảng Santos</p>
              <p className="text-sm font-black text-stone-900">{prices.brazil?.portStatus || 'Kẹt 12 ngày'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-50 rounded-xl text-red-600"><AlertTriangle size={16} /></div>
            <div>
              <p className="text-[9px] font-black text-stone-400 uppercase mb-1">Mức rủi ro</p>
              <p className="text-sm font-black text-red-500">{prices.brazil?.riskLevel || 'Nghiêm trọng'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-stone-900 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-400" size={24} />
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest">Đánh giá AI chuyên sâu</h3>
              <p className="text-[10px] text-stone-500 font-bold uppercase">Độ tin cậy: {prices.brazil?.confidence || 0}%</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {(prices.brazil?.deepAnalysis || [
              "Hạn hán tại Minas Gerais ảnh hưởng trực tiếp đến quy mô hạt, đẩy giá Arabica New York tăng nóng."
            ]).map((paragraph, idx) => (
              <p key={idx} className="text-[13px] text-stone-300 leading-relaxed italic bg-white/5 p-4 rounded-2xl border border-white/5">
                "{paragraph}"
              </p>
            ))}
          </div>

          <div className="pt-2">
            <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3">Tác động theo vùng</p>
            <div className="space-y-2">
              {prices.brazil?.regions?.map((reg, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-black/20 rounded-2xl border border-white/5">
                  <span className="text-xs font-bold text-stone-200">{reg.name}</span>
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full ${reg.impact === 'Nặng' ? 'bg-red-500/20 text-red-400' : reg.impact === 'Trung bình' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    TÁC ĐỘNG: {reg.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Globe className="absolute right-[-30px] top-[40%] text-white/5" size={180} />
      </div>
    </div>
  );

  const NewsView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-1">
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex gap-4 items-start shadow-sm">
        <div className="bg-amber-500 p-2.5 rounded-2xl text-white shadow-md shadow-amber-200 shrink-0">
          <FileText size={20} />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Tóm lược AI ngày {new Date().toLocaleDateString('vi-VN')}</h4>
          <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
            Tin tức cho thấy <span className="font-bold text-emerald-700">tác động {prices.aiInsights?.newsImpact || 'tích cực'}</span>. 
            Xuất khẩu kỷ lục và hạn hán Brazil duy trì đà tăng cho Robusta Việt Nam.
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2.5rem] group h-44 shadow-xl border border-stone-100">
        <div className="flex h-full transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {HOT_NEWS.map((hot) => (
            <div key={hot.id} className={`min-w-full ${hot.color} p-6 text-white relative flex flex-col justify-center`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                <h3 className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">{hot.tag}</h3>
              </div>
              <p className="text-lg font-bold leading-tight mb-4 pr-16 relative z-10">{hot.title}</p>
              <button className="flex items-center gap-2 text-[10px] font-black bg-white/10 px-4 py-2 rounded-full w-fit uppercase border border-white/10 relative z-10 hover:bg-white/20 transition-all">Đọc nhanh <ArrowRight size={14} /></button>
              <div className="absolute right-[-10px] bottom-[-10px] opacity-10 pointer-events-none">{getHotIcon(hot.type)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-stone-900">Tin Tức Mới Nhất</h2>
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{news.length} Bản tin</span>
        </div>
        {news.slice(0, visibleNewsCount).map(n => (
          <div key={n.id} onClick={() => setSelectedItem({...n, type: 'news'})} className="bg-white p-3 rounded-3xl flex gap-4 shadow-sm border border-stone-50 active:scale-98 transition-all cursor-pointer hover:border-emerald-100 group">
            <div className="relative shrink-0">
              <img src={n.image} className="w-24 h-24 object-cover rounded-2xl" alt="" />
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-lg">
                 <p className="text-[8px] font-black text-stone-900 uppercase">{n.readTime}</p>
              </div>
            </div>
            <div className="flex flex-col justify-between py-1 flex-1">
              <div>
                <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">{n.category}</p>
                <h4 className="text-sm font-bold text-stone-900 leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors">{n.title}</h4>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock size={10} className="text-stone-300" />
                  <span className="text-[9px] text-stone-400 font-black uppercase">{n.time}</span>
                </div>
                {bookmarks.includes(n.id) && <Bookmark size={12} className="text-emerald-500 fill-current" />}
              </div>
            </div>
          </div>
        ))}
        
        {visibleNewsCount < news.length && (
          <button 
            onClick={() => setVisibleNewsCount(prev => prev + 3)}
            className="w-full py-4 mt-2 bg-stone-100 text-stone-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 active:scale-95 transition-all"
          >
            Tải thêm tin tức
          </button>
        )}
      </div>
    </div>
  );

  const DetailOverlay = () => {
    if (!selectedItem) return null;
    const isNews = selectedItem.type === 'news';
    return (
      <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="max-w-md mx-auto min-h-screen bg-white pb-20 shadow-2xl">
          <header className="sticky top-0 bg-white/80 backdrop-blur-md p-6 flex justify-between items-center z-10 border-b border-stone-50">
            <button onClick={() => setSelectedItem(null)} className="p-2.5 bg-stone-100 rounded-2xl text-stone-600 active:scale-90 transition-all"><ChevronLeft size={20} /></button>
            <div className="flex gap-2">
              {isNews && (
                <button onClick={() => toggleBookmark(selectedItem.id)} className={`p-2.5 rounded-2xl transition-all ${bookmarks.includes(selectedItem.id) ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-stone-100 text-stone-600'}`}>
                  <Bookmark size={20} fill={bookmarks.includes(selectedItem.id) ? "white" : "none"} />
                </button>
              )}
              <button className="p-2.5 bg-stone-100 rounded-2xl text-stone-600"><Share2 size={20} /></button>
            </div>
          </header>
          <main className="px-6 py-6 space-y-8">
            {isNews ? (
              <>
                <div className="relative">
                   <img src={selectedItem.image} className="w-full h-64 object-cover rounded-[3rem] shadow-xl" alt="" />
                   <div className="absolute -bottom-4 right-8 bg-white px-6 py-3 rounded-2xl shadow-lg border border-stone-50">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Tác giả</p>
                      <p className="text-xs font-bold text-stone-900">{selectedItem.author}</p>
                   </div>
                </div>
                <div className="flex gap-3 items-center text-[10px] font-black text-stone-400 uppercase pt-4">
                  <span className="bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-full">{selectedItem.category}</span>
                  <span>{selectedItem.readTime}</span>
                  <span>•</span>
                  <span>{selectedItem.time}</span>
                </div>
                <h1 className="text-3xl font-black text-stone-900 leading-tight">{selectedItem.title}</h1>
                
                <button 
                  onClick={() => handleAiSummarizeNews(selectedItem)}
                  disabled={isAiAnalyzing}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-100 text-emerald-800 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  <Sparkles size={16} /> {isAiAnalyzing ? "AI Đang tóm tắt..." : "Tóm tắt tin tức bằng AI ✨"}
                </button>

                {selectedItem.aiSummary && (
                  <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] animate-in slide-in-from-top-4">
                    <h4 className="text-[10px] font-black uppercase text-emerald-800 mb-3 tracking-widest">Tóm lược thông minh ✨</h4>
                    <div className="text-sm text-emerald-900/80 leading-relaxed font-medium whitespace-pre-line">
                      {selectedItem.aiSummary}
                    </div>
                  </div>
                )}

                <div className="mt-8 space-y-6">
                  {selectedItem.content?.map((block, i) => {
                    if (typeof block === 'string') {
                      return <p key={i} className="text-[15px] text-stone-700 leading-loose font-medium">{block}</p>;
                    }
                    
                    switch (block.type) {
                      case 'lead':
                        return <p key={i} className="text-base text-stone-900 leading-relaxed font-bold">{block.text}</p>;
                      case 'paragraph':
                        return <p key={i} className="text-[15px] text-stone-700 leading-loose font-medium">{block.text}</p>;
                      case 'subheading':
                        return <h3 key={i} className="text-xl font-black text-stone-900 mt-10 mb-4 border-b border-stone-100 pb-2">{block.text}</h3>;
                      case 'quote':
                        return (
                          <blockquote key={i} className="my-8 p-6 bg-emerald-50/50 border-l-4 border-emerald-500 rounded-2xl relative shadow-sm">
                            <Quote size={24} className="text-emerald-200 absolute top-4 right-4" />
                            <p className="text-[15px] italic text-emerald-900/80 font-medium relative z-10">"{block.text}"</p>
                            {block.author && <footer className="mt-3 text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2">— {block.author}</footer>}
                          </blockquote>
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="text-center pt-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 rounded-full mb-4">
                    <MapPin size={12} className="text-stone-400" />
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{selectedItem.province || selectedItem.market}</p>
                  </div>
                  
                  <div className="flex items-baseline justify-center gap-2">
                    <h1 className="text-6xl font-black text-stone-900 tracking-tighter">{selectedItem.price?.toLocaleString()}</h1>
                    <span className="text-xl font-bold text-stone-400">{selectedItem.unit || 'đ/kg'}</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-black shadow-sm border ${selectedItem.change < 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                      {selectedItem.change < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                      {Math.abs(selectedItem.change || 0).toLocaleString()}đ
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-[11px] font-black text-stone-500 uppercase tracking-widest">
                      Xu hướng: {selectedItem.trend === 'Bullish' ? 'Tăng' : selectedItem.trend === 'Bearish' ? 'Giảm' : 'Đi ngang'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="p-4 bg-white border border-stone-100 rounded-3xl shadow-sm flex flex-col items-center justify-center">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Đỉnh 30 ngày</p>
                    <p className="text-xl font-black text-stone-800">{selectedItem.high30d?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-white border border-stone-100 rounded-3xl shadow-sm flex flex-col items-center justify-center">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Đáy 30 ngày</p>
                    <p className="text-xl font-black text-stone-800">{selectedItem.low30d?.toLocaleString()}</p>
                  </div>
                </div>

                <button 
                  onClick={() => handleAiPredictTrend(selectedItem)}
                  disabled={isAiAnalyzing}
                  className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-stone-900/20 mt-4"
                >
                  <BrainCircuit size={16} /> {isAiAnalyzing ? "AI Đang dự báo..." : "Chiến lược bán hàng AI ✨"}
                </button>

                {selectedItem.aiPrediction && (
                  <div className="bg-stone-900 p-6 rounded-[2rem] border border-white/10 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap size={14} className="text-emerald-400" />
                      <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Dự báo ngắn hạn ✨</h4>
                    </div>
                    <p className="text-xs text-stone-300 italic leading-relaxed">
                      "{selectedItem.aiPrediction}"
                    </p>
                  </div>
                )}

                <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm mt-4">
                  <div className="flex items-center justify-between mb-8">
                     <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Lịch sử 7 ngày qua</h4>
                     <Calendar size={14} className="text-stone-300"/>
                  </div>
                  <div className="h-40 w-full flex items-end justify-between gap-2 px-1">
                    {selectedItem.history?.map((h, i) => (
                      <div key={i} className="flex flex-col items-center flex-1 gap-2 h-full justify-end group">
                        <div className="text-[10px] font-black text-stone-500 mb-1 opacity-80 group-hover:opacity-100 group-hover:text-stone-900 transition-colors">
                           {(h/1000).toFixed(1)}
                        </div>
                        <div className={`w-full rounded-t-xl transition-all duration-1000 ease-out ${selectedItem.change < 0 ? 'bg-red-400/40 group-hover:bg-red-400/60' : 'bg-emerald-400/40 group-hover:bg-emerald-400/60'}`} style={{ height: `${((h - Math.min(...selectedItem.history)) / (Math.max(...selectedItem.history) - Math.min(...selectedItem.history) || 1) * 60) + 15}%` }}></div>
                        <span className="text-[9px] font-bold text-stone-400 mt-1">T{i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-100 mt-4 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-stone-100">
                       <Info size={16} className="text-stone-600"/>
                    </div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-800">Phân tích thị trường</h4>
                  </div>
                  <p className="text-[14px] text-stone-600 leading-relaxed relative z-10 font-medium">
                    {selectedItem.analysis}
                  </p>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-stone-50 min-h-screen relative font-sans text-stone-900 select-none overflow-x-hidden">
      {toast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[150] bg-stone-900 text-white px-6 py-3.5 rounded-full text-xs font-black shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border border-white/10">
          <CheckCircle2 size={16} className="text-emerald-400" /> {toast}
        </div>
      )}

      {(!supabaseUrl || !supabaseKey) && (
        <div className="bg-amber-100 text-amber-900 p-3 text-[10px] font-black text-center border-b border-amber-200">
          VUI LÒNG ĐIỀN SUPABASE URL & KEY VÀO CODE ĐỂ KÍCH HOẠT BACKEND
        </div>
      )}

      <header className="px-8 py-8 flex justify-between items-center bg-stone-50/80 backdrop-blur-md sticky top-0 z-40 border-b border-stone-100/50">
        <div>
          <h1 className="text-3xl font-black text-stone-900 leading-none">
            {activeTab === 'dashboard' ? 'Thị Trường' : activeTab === 'brazil' ? 'Báo Cáo' : 'Tin Tức'}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <p className="text-[9px] text-emerald-600 font-black tracking-widest uppercase">Gemini AI Enhanced ✨</p>
          </div>
        </div>
        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden p-1 shrink-0">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'guest'}`} className="w-full h-full object-cover bg-stone-50 rounded-xl" alt="Profile" />
        </div>
      </header>

      <main className="px-8 pt-6 pb-28">
        {activeTab === 'dashboard' ? <DashboardView /> : activeTab === 'brazil' ? <BrazilView /> : <NewsView />}
      </main>

      <DetailOverlay />

      <nav className="fixed bottom-8 left-8 right-8 h-20 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 flex items-center justify-around px-4 z-50 max-w-sm mx-auto">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-emerald-600 scale-110' : 'text-stone-300'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'dashboard' ? 'bg-emerald-50' : ''}`}><BarChart3 size={24} /></div>
          <span className="text-[8px] font-black uppercase tracking-tighter">Giá cả</span>
        </button>
        <button onClick={() => setActiveTab('brazil')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'brazil' ? 'text-emerald-600 scale-110' : 'text-stone-300'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'brazil' ? 'bg-emerald-50' : ''}`}><Globe size={24} /></div>
          <span className="text-[8px] font-black uppercase tracking-tighter">Brazil</span>
        </button>
        <button onClick={() => setActiveTab('news')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'news' ? 'text-emerald-600 scale-110' : 'text-stone-300'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'news' ? 'bg-emerald-50' : ''}`}><Newspaper size={24} /></div>
          <span className="text-[8px] font-black uppercase tracking-tighter">Tin tức</span>
        </button>
      </nav>
    </div>
  );
}