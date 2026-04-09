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

// --- Dữ liệu khởi tạo mặc định ---
const INITIAL_HOT_NEWS = [
  { 
    id: 'h1', title: 'Brazil dự báo sản lượng niên vụ mới giảm 5% do khô hạn', tag: 'TIN NÓNG AI', type: 'alert', color: 'bg-stone-900',
    author: 'AI System', readTime: '3 phút đọc', time: 'Vừa cập nhật', category: 'Cảnh báo', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=800',
    content: [
      { type: 'lead', text: 'Hệ thống AI phát hiện rủi ro thời tiết cực đoan tại Brazil, dự báo có thể làm giảm 5% sản lượng cà phê niên vụ tới.' },
      { type: 'paragraph', text: 'Phân tích từ dữ liệu vệ tinh cho thấy độ ẩm đất tại Minas Gerais đang ở ngưỡng báo động đỏ.' },
      { type: 'quote', text: 'Thị trường đang phản ứng mạnh với các báo cáo khô hạn từ Nam Mỹ.', author: 'Nhận định từ chuyên gia ICO' }
    ]
  }
];

const INITIAL_PRICES = {
  domestic: [
    { id: 'daklak', province: 'Đắk Lắk', price: 85300, change: -400, history: [82000, 83500, 86000, 89300, 87000, 86000, 85300], high30d: 92000, low30d: 78000, trend: 'Bearish', analysis: 'Giá đang điều chỉnh nhẹ.' },
    { id: 'lamdong', province: 'Lâm Đồng', price: 84700, change: -100, history: [81500, 82000, 85500, 88800, 86500, 85500, 84700], high30d: 91500, low30d: 77500, trend: 'Bearish', analysis: 'Tâm lý chốt lời ảnh hưởng giá.' },
    { id: 'gialai', province: 'Gia Lai', price: 85100, change: +200, history: [81800, 83000, 85800, 89100, 86800, 85800, 85100], high30d: 91800, low30d: 78200, trend: 'Neutral', analysis: 'Lực mua vẫn ổn định.' },
    { id: 'daknong', province: 'Đắk Nông', price: 85200, change: +300, history: [81900, 83200, 85900, 89100, 86900, 85900, 85200], high30d: 91900, low30d: 78100, trend: 'Neutral', analysis: 'Nguồn cung hạn chế giúp giá vững.' },
  ],
  global: [
    { id: 'london', market: 'London (Robusta)', price: 3412, unit: 'USD/Tấn', change: -85, history: [3200, 3250, 3350, 3500, 3480, 3450, 3412], high30d: 3650, low30d: 3100, trend: 'Bullish', analysis: 'Thiếu hụt nguồn cung toàn cầu.' },
    { id: 'newyork', market: 'New York (Arabica)', price: 212.45, unit: 'cts/lb', change: +1.2, history: [205.1, 208.4, 210.2, 215.0, 213.5, 211.2, 212.45], high30d: 225.0, low30d: 198.5, trend: 'Bullish', analysis: 'Lo ngại về thời tiết Brazil.' },
  ],
  brazil: {
    harvestProgress: 15, expectedOutput: '70.7M', outputChange: -2.3, weatherStatus: 'Khô hạn kéo dài',
    riskLevel: 'Nghiêm trọng', sentiment: 'Bullish', confidence: 88,
    portStatus: 'Kẹt cảng 12 ngày', soilMoisture: '28%', temperatureAnomaly: '+2.5°C',
    regions: [{ name: 'Minas Gerais', status: 'Hạn hán', impact: 'Nặng' }],
    deepAnalysis: ["Hiện tượng El Nino đang gây khô hạn nghiêm trọng tại Brazil.", "Độ ẩm đất tại Minas Gerais rơi xuống mức nguy hiểm.", "Về Logistics: Cảng Santos đang quá tải làm gián đoạn chuỗi cung ứng toàn cầu."]
  },
  aiInsights: {
    marketSentiment: 'Thận trọng', sentimentScore: 62, summary: 'Thị trường đang chốt lời ngắn hạn.', newsImpact: 'Tích cực trung hạn', recommendation: 'Ưu tiên giữ hàng.'
  }
};

// Hàm sinh tin tức phân tích chuyên sâu (Local Fallback)
const generateAutoNews = () => {
  const now = new Date();
  const topics = [
    {
      title: "Phân tích: Quỹ đầu cơ tăng vị thế mua Robusta trên sàn London",
      lead: "Báo cáo mới nhất cho thấy các quỹ quản lý vốn đã tăng 12% vị thế mua ròng đối với cà phê Robusta kỳ hạn tháng 7.",
      para: "Đà tăng này được củng cố bởi thông tin sản lượng tại Việt Nam có thể sụt giảm do hiện tượng khô hạn cục bộ.",
      quote: "Chúng tôi nhận thấy dòng tiền đang đổ mạnh vào hàng hóa nông sản như một kênh trú ẩn trước lạm phát.", author: "Phân tích từ SocGen"
    },
    {
      title: "Xu hướng xuất khẩu cà phê Việt Nam sang thị trường Trung Quốc tăng đột biến",
      lead: "Trong 3 tháng đầu năm, kim ngạch xuất khẩu cà phê Việt Nam sang Trung Quốc tăng trưởng hơn 40%.",
      para: "Nhu cầu tiêu thụ cà phê tại các thành phố lớn của Trung Quốc đang bùng nổ mạnh mẽ.",
      quote: "Đây là thị trường tiềm năng có thể thay thế một phần nhu cầu đang bão hòa tại châu Âu.", author: "Đại diện VICOFA"
    }
  ];
  const selected = topics[Math.floor(Math.random() * topics.length)];
  return {
    id: `auto_${now.getTime()}`,
    category: 'Phân tích chuyên sâu',
    title: selected.title,
    author: 'Hệ thống AI',
    readTime: '4 phút đọc',
    summary: selected.lead.substring(0, 80) + '...',
    time: 'Vừa xong',
    image: `https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=800&sig=${now.getTime()}`,
    content: [
      { type: 'lead', text: selected.lead },
      { type: 'paragraph', text: selected.para },
      { type: 'quote', text: selected.quote, author: selected.author }
    ]
  };
};

const generateAutoHotNews = () => {
  const now = new Date();
  const types = ['alert', 'trending', 'globe'];
  const colors = ['bg-stone-900', 'bg-emerald-900', 'bg-blue-900'];
  const randIdx = Math.floor(Math.random() * 3);
  return {
    id: `hot_${now.getTime()}`,
    category: 'TIN NÓNG',
    title: `Biến động bất thường lúc ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
    tag: 'CẢNH BÁO AI',
    type: types[randIdx],
    color: colors[randIdx],
    author: 'AI Monitor',
    readTime: '2 phút đọc',
    time: 'Vừa xong',
    image: `https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=800&sig=${now.getTime() + 1}`,
    content: [
      { type: 'lead', text: `Hệ thống AI vừa quét và ghi nhận biến động bất thường của dòng tiền trên thị trường phái sinh.` },
      { type: 'paragraph', text: "Khối lượng giao dịch tăng đột biến ở các hợp đồng kỳ hạn gần, cho thấy tín hiệu gom hàng thực." },
      { type: 'quote', text: "Khuyến nghị nhà đầu tư theo dõi sát sao diễn biến.", author: "AI Coffee Intel" }
    ]
  };
};

export default function App() {
  const [isSystemReady, setIsSystemReady] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prices, setPrices] = useState(INITIAL_PRICES);
  const [news, setNews] = useState([]);
  const [hotNews, setHotNews] = useState(INITIAL_HOT_NEWS);
  const [visibleNewsCount, setVisibleNewsCount] = useState(3);
  const [bookmarks, setBookmarks] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [toast, setToast] = useState(null);
  
  const pricesRef = useRef(prices);
  const newsRef = useRef([]);
  const hotNewsRef = useRef(INITIAL_HOT_NEWS);

  useEffect(() => { pricesRef.current = prices; }, [prices]);
  useEffect(() => { newsRef.current = news; }, [news]);
  useEffect(() => { hotNewsRef.current = hotNews; }, [hotNews]);

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);

  // --- Initialize Scripts & Ensure Environment is Ready ---
  useEffect(() => {
    let twReady = !!document.getElementById('tailwind-script');
    let sbReady = !!window.supabase;

    const checkAndSetReady = () => {
      if (twReady && sbReady) setIsSystemReady(true);
    };

    if (!twReady) {
      const twScript = document.createElement('script');
      twScript.id = 'tailwind-script';
      twScript.src = "https://cdn.tailwindcss.com";
      twScript.onload = () => { twReady = true; checkAndSetReady(); };
      twScript.onerror = () => { twReady = true; checkAndSetReady(); }; // Fallback if blocked
      document.head.appendChild(twScript);
    }

    if (!sbReady && !document.getElementById('supabase-script')) {
      const sbScript = document.createElement('script');
      sbScript.id = 'supabase-script';
      sbScript.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      sbScript.onload = () => { 
        sbReady = true; 
        if (supabaseUrl && supabaseKey && window.supabase) {
          setSupabaseClient(window.supabase.createClient(supabaseUrl, supabaseKey));
        }
        checkAndSetReady(); 
      };
      sbScript.onerror = () => { sbReady = true; checkAndSetReady(); };
      document.head.appendChild(sbScript);
    } else if (sbReady) {
      if (supabaseUrl && supabaseKey && !supabaseClient) {
        setSupabaseClient(window.supabase.createClient(supabaseUrl, supabaseKey));
      }
      checkAndSetReady();
    }
  }, []);

  // --- Auth ---
  useEffect(() => {
    if (!isSystemReady || !supabaseClient) return;
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
  }, [supabaseClient, isSystemReady]);

  // --- Fetch Data & Realtime ---
  useEffect(() => {
    if (!isSystemReady || !supabaseClient || !user) return;
    const fetchInitialData = async () => {
      const { data: mData } = await supabaseClient.from('market_data').select('*').eq('id', 'latest').single();
      if (mData?.prices_json) {
        setPrices(mData.prices_json);
        if (mData.prices_json.hotNews) setHotNews(mData.prices_json.hotNews);
      } else {
        await supabaseClient.from('market_data').upsert({ id: 'latest', prices_json: { ...INITIAL_PRICES, hotNews: INITIAL_HOT_NEWS } });
      }

      const { data: nData } = await supabaseClient.from('market_data').select('*').neq('id', 'latest');
      if (nData) {
        const newsList = nData
          .map(row => row.prices_json)
          .filter(item => item && item.type === 'news_article')
          .sort((a, b) => b.timestamp - a.timestamp);
        setNews(newsList);
      }

      const { data: uData } = await supabaseClient.from('user_profiles').select('bookmarks').eq('user_id', user.id).single();
      if (uData) setBookmarks(uData.bookmarks || []);
    };
    fetchInitialData();

    const channel = supabaseClient.channel('realtime-news')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'market_data' }, payload => {
        if (payload.new && payload.new.id === 'latest') {
          setPrices(payload.new.prices_json);
        } else if (payload.new && payload.new.prices_json?.type === 'news_article') {
          setNews(prev => {
            const exists = prev.some(n => n.id === payload.new.id);
            if (exists) return prev;
            return [payload.new.prices_json, ...prev].sort((a, b) => b.timestamp - a.timestamp);
          });
        }
      }).subscribe();
    return () => { supabaseClient.removeChannel(channel); };
  }, [supabaseClient, user, isSystemReady]);

  const showToast = (msg) => {
    setToast(String(msg));
    setTimeout(() => setToast(null), 2500);
  };

  // --- Logic Chuyển Tab ---
  const handleTabChange = async (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
      setSelectedItem(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('market_data').select('*').eq('id', 'latest').single();
      if (!error && data && data.prices_json) {
        setPrices(data.prices_json);
        setLastUpdate(new Date().toLocaleTimeString('vi-VN'));
      }
    }
  };

  // --- Logic Tự động cập nhật Tin tức ---
  const handleRefreshNews = async () => {
    if (isRefreshingNews) return;
    setIsRefreshingNews(true);
    showToast(apiKey ? "AI đang thực hiện báo cáo chuyên sâu..." : "Đang tải phân tích...");

    try {
      if (!apiKey) throw new Error("No Key");
      const prompt = `Bạn là chuyên gia kinh tế. Hãy duyệt web tìm dữ liệu MỚI NHẤT TRONG 24H QUA về cà phê. 
      Viết 1 bài phân tích CHUYÊN SÂU. Trả về JSON:
      {"category": "Phân tích vĩ mô", "title": "Tiêu đề mang tính thời sự", "summary": "Tóm tắt 1 câu", "content": [ {"type": "lead", "text": "..."}, {"type": "paragraph", "text": "..."} ]}`;

      const jsonStr = await callGeminiAPI(prompt, "Bạn là máy viết báo cáo JSON chuyên sâu.", true);
      const data = JSON.parse(jsonStr);

      const newArticleId = `news_${Date.now()}`;
      const newArticle = {
        ...data,
        id: newArticleId,
        type: 'news_article',
        timestamp: Date.now(),
        author: 'Hệ thống AI Pro',
        readTime: '4 phút đọc',
        time: 'Vừa xong',
        image: `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800&sig=${Date.now()}`
      };

      const isDup = newsRef.current.some(n => String(n.title).trim().toLowerCase() === String(newArticle.title).trim().toLowerCase());
      if (isDup) {
        showToast("Bản tin đã có nội dung tương tự.");
        setIsRefreshingNews(false);
        return;
      }

      if (supabaseClient) {
        await supabaseClient.from('market_data').insert([{ id: newArticleId, prices_json: newArticle }]);
        showToast("Đã lưu tin chuyên sâu vào Database ✨");
      } else {
        setNews(prev => [newArticle, ...prev]);
        showToast("Đã cập nhật (Chế độ Local) ✨");
      }
    } catch (e) {
      showToast("Tải dữ liệu dự phòng hoàn tất.");
    } finally {
      setIsRefreshingNews(false);
    }
  };

  const handleRefreshPrices = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    showToast("Đang cập nhật bảng giá...");
    
    try {
      if (!apiKey) throw new Error("No Key");
      const prompt = `Lấy GIÁ CÀ PHÊ MỚI NHẤT HÔM NAY tại VN và thế giới. Trả về JSON: {"domestic": [...], "global": [...], "aiInsights": {...}}`;
      const jsonStr = await callGeminiAPI(prompt, "Bot lấy giá JSON nhanh.", true);
      const realData = JSON.parse(jsonStr);

      const updatedPrices = {
        ...pricesRef.current,
        domestic: pricesRef.current.domestic.map(old => ({...old, ...realData.domestic?.find(d => d.id === old.id)})),
        global: pricesRef.current.global.map(old => ({...old, ...realData.global?.find(g => g.id === old.id)})),
        aiInsights: realData.aiInsights || pricesRef.current.aiInsights
      };

      if (supabaseClient) {
        await supabaseClient.from('market_data').upsert({ id: 'latest', prices_json: { ...updatedPrices, hotNews: hotNewsRef.current } });
      } else {
        setPrices(updatedPrices);
      }
    } catch (e) {
      showToast("Kết nối AI gián đoạn, sử dụng giá tham khảo.");
    } finally {
      setIsRefreshing(false);
      setLastUpdate(new Date().toLocaleTimeString('vi-VN'));
    }
  };

  const toggleBookmark = async (id) => {
    if (!user) return;
    const next = bookmarks.includes(id) ? bookmarks.filter(b => b !== id) : [...bookmarks, id];
    setBookmarks(next);
    if (supabaseClient) await supabaseClient.from('user_profiles').update({ bookmarks: next }).eq('user_id', user.id);
  };

  const handleAiMarketAnalysis = async () => {
    if (!apiKey) { showToast("Vui lòng cấu hình Gemini API Key"); return; }
    setIsAiAnalyzing(true);
    setAiAnalysisResult(null);
    try {
      const prompt = `Dựa trên dữ liệu giá cà phê. Đưa ra 1 tóm tắt thị trường ngắn gọn (3 dòng).`;
      const result = await callGeminiAPI(prompt, "Bạn là chuyên gia kinh tế.");
      setAiAnalysisResult(String(result || ''));
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
      const contentText = Array.isArray(newsItem.content) ? newsItem.content.map(b => typeof b === 'string' ? b : b.text).join(' ') : '';
      const prompt = `Tóm tắt tin tức sau: ${newsItem.title}. Nội dung: ${contentText}`;
      const result = await callGeminiAPI(prompt, "Bạn là trợ lý AI tóm tắt tin tức.");
      setSelectedItem({ ...newsItem, aiSummary: String(result || ''), type: 'news' });
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
      const prompt = `Dự báo giá vùng ${priceItem.province || priceItem.market}. Giá hiện tại: ${priceItem.price}. Trả lời ngắn gọn.`;
      const result = await callGeminiAPI(prompt, "Bạn là máy học dự báo tài chính.");
      setSelectedItem({ ...priceItem, aiPrediction: String(result || ''), type: 'price' });
    } catch (err) {
      showToast("Dự báo AI thất bại.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const renderSparkline = (history = [], isNegative) => {
    if (!history || history.length < 2) return null;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = (max - min) || 1;
    return (
      <div className="w-16 h-8 shrink-0">
        <svg viewBox="0 0 64 32" className="w-full h-full overflow-visible block">
          <polyline fill="none" stroke={isNegative ? "#ef4444" : "#10b981"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
            points={history.map((d, i) => `${(i/(history.length-1))*60+2},${30-((d-min)/range)*26-2}`).join(' ')} 
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

  // --- RENDER VIEWS (SAFE FUNCTIONS) ---
  const renderDashboardView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-1 relative">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">AI Market Intelligence</h3>
            <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-2">
              <Gauge size={12} /> Score: {String(prices.aiInsights?.sentimentScore || 0)}
            </span>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl font-black">{String(prices.aiInsights?.marketSentiment || '---')}</div>
            <div className="h-10 w-px bg-white/20"></div>
            <p className="text-xs font-medium opacity-90 leading-relaxed line-clamp-2">
              {String(prices.aiInsights?.summary || 'Đang chờ phân tích dữ liệu thị trường')}
            </p>
          </div>

          {!aiAnalysisResult ? (
            <button onClick={() => handleAiMarketAnalysis()} disabled={isAiAnalyzing} className="w-full flex items-center justify-center gap-2 bg-white text-emerald-800 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50">
              {isAiAnalyzing ? <RotateCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isAiAnalyzing ? "Đang phân tích..." : "Phân tích thị trường tổng thể ✨"}
            </button>
          ) : (
            <div className="bg-black/20 p-4 rounded-2xl border border-white/10 animate-in zoom-in-95">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">Dự báo Gemini ✨</span>
                <button onClick={() => setAiAnalysisResult(null)}><X size={12} /></button>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90 italic">"{String(aiAnalysisResult)}"</p>
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
        <button onClick={handleRefreshPrices} disabled={isRefreshing} className={`p-3 bg-white rounded-2xl shadow-sm border border-stone-100 text-emerald-600 active:scale-90 transition-all ${isRefreshing ? 'opacity-50' : ''}`}>
          <RotateCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="relative">
        {isRefreshing && (
          <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="bg-white p-4 rounded-2xl shadow-xl flex flex-col items-center border border-emerald-100">
              <RotateCw size={24} className="animate-spin text-emerald-500 mb-2" />
              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest animate-pulse">AI Đang Quét Dữ Liệu...</span>
            </div>
          </div>
        )}

        <section>
          <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <MapPin size={12} className="text-emerald-500" /> GIÁ NỘI ĐỊA (VN)
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {prices?.domestic?.map(item => (
              <div key={item.id} onClick={() => setSelectedItem({...item, type: 'price'})} className="bg-white p-4 rounded-3xl shadow-sm border border-stone-100 active:scale-95 transition-all cursor-pointer">
                <div className="flex justify-between items-start">
                  <p className="text-[9px] font-black text-stone-400 uppercase">{String(item.province)}</p>
                  {renderSparkline(item.history, item.change < 0)}
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-xl font-black text-stone-900">{Number(item.price || 0).toLocaleString()}</span>
                  <span className="text-[9px] text-stone-400 font-bold uppercase">đ/kg</span>
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black mt-1 ${item.change < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {item.change < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                  {Math.abs(Number(item.change || 0)).toLocaleString()}đ
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <Globe size={12} className="text-blue-500" /> SÀN THẾ GIỚI
          </h4>
          <div className="space-y-3">
            {prices?.global?.map(item => (
              <div key={item.id} onClick={() => setSelectedItem({...item, type: 'price'})} className="bg-stone-900 p-4 rounded-[2rem] flex justify-between items-center active:bg-stone-800 transition-all cursor-pointer">
                <div className="flex-1">
                  <p className="text-stone-500 text-[9px] font-black uppercase">{String(item.market)}</p>
                  <p className="text-xl font-black text-white mt-1">{Number(item.price || 0).toLocaleString()} <span className="text-[10px] text-stone-500 font-bold">{String(item.unit)}</span></p>
                </div>
                <div className="flex items-center gap-4">
                  {renderSparkline(item.history, item.change < 0)}
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black ${item.change < 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {item.change > 0 ? '+' : ''}{Number(item.change || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const renderBrazilView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 px-1">
      <div className="relative h-56 bg-stone-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <img src="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-60" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 to-transparent p-6 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-md uppercase">LIVE REPORT</span>
            <span className="text-stone-300 text-[10px] font-bold uppercase tracking-widest">Brazil Intel</span>
          </div>
          <h2 className="text-white text-2xl font-black">Tình Hình Cung Ứng</h2>
          <p className="text-emerald-400 text-sm font-black mt-1">Xu hướng: {String(prices.brazil?.sentiment || '')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100">
          <p className="text-[10px] font-black text-stone-400 uppercase mb-2">TIẾN ĐỘ THU HOẠCH</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-stone-800">{String(prices.brazil?.harvestProgress || 0)}%</p>
            <span className="text-[9px] text-emerald-500 font-bold mb-1">+2%/Tuần</span>
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${prices.brazil?.harvestProgress || 0}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100">
          <p className="text-[10px] font-black text-stone-400 uppercase mb-2">SẢN LƯỢNG DỰ BÁO</p>
          <p className="text-3xl font-black text-stone-800">{String(prices.brazil?.expectedOutput || '')}</p>
          <p className="text-[9px] text-red-500 font-bold mt-2 flex items-center gap-1">
            <TrendingDown size={10} /> Giảm {Math.abs(Number(prices.brazil?.outputChange || 0))}%
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
              <p className="text-sm font-black text-stone-900">{String(prices.brazil?.temperatureAnomaly || '')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Droplets size={16} /></div>
            <div>
              <p className="text-[9px] font-black text-stone-400 uppercase mb-1">Độ ẩm đất</p>
              <p className="text-sm font-black text-red-500">{String(prices.brazil?.soilMoisture || '')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600"><Globe size={16} /></div>
            <div>
              <p className="text-[9px] font-black text-stone-400 uppercase mb-1">Cảng Santos</p>
              <p className="text-sm font-black text-stone-900">{String(prices.brazil?.portStatus || '')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-50 rounded-xl text-red-600"><AlertTriangle size={16} /></div>
            <div>
              <p className="text-[9px] font-black text-stone-400 uppercase mb-1">Mức rủi ro</p>
              <p className="text-sm font-black text-red-500">{String(prices.brazil?.riskLevel || '')}</p>
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
              <p className="text-[10px] text-stone-500 font-bold uppercase">Độ tin cậy: {String(prices.brazil?.confidence || 0)}%</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {(prices.brazil?.deepAnalysis || []).map((paragraph, idx) => (
              <p key={idx} className="text-[13px] text-stone-300 leading-relaxed italic bg-white/5 p-4 rounded-2xl border border-white/5">
                "{String(paragraph)}"
              </p>
            ))}
          </div>

          <div className="pt-2">
            <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3">Tác động theo vùng</p>
            <div className="space-y-2">
              {prices.brazil?.regions?.map((reg, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-black/20 rounded-2xl border border-white/5">
                  <span className="text-xs font-bold text-stone-200">{String(reg.name)}</span>
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full ${reg.impact === 'Nặng' ? 'bg-red-500/20 text-red-400' : reg.impact === 'Trung bình' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    TÁC ĐỘNG: {String(reg.impact)}
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

  const renderNewsView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-1">
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex gap-4 items-start shadow-sm relative z-10">
        <div className="bg-amber-500 p-2.5 rounded-2xl text-white shadow-md shadow-amber-200 shrink-0">
          <FileText size={20} />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Tóm lược AI ngày {new Date().toLocaleDateString('vi-VN')}</h4>
          <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
            Tin tức cho thấy <span className="font-bold text-emerald-700">tác động {String(prices.aiInsights?.newsImpact || 'tích cực')}</span>. 
            Xuất khẩu kỷ lục và hạn hán Brazil duy trì đà tăng cho Robusta Việt Nam.
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2.5rem] group h-44 shadow-xl border border-stone-100 z-10">
        <div className="flex h-full transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {hotNews.map((hot) => (
            <div key={hot.id} className={`min-w-full ${String(hot.color)} p-6 text-white relative flex flex-col justify-center`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                <h3 className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">{String(hot.tag)}</h3>
              </div>
              <p className="text-lg font-bold leading-tight mb-4 pr-16 relative z-10 line-clamp-2">{String(hot.title)}</p>
              <button onClick={() => setSelectedItem({ ...hot, type: 'news' })} className="flex items-center gap-2 text-[10px] font-black bg-white/10 px-4 py-2 rounded-full w-fit uppercase border border-white/10 relative z-10 hover:bg-white/20 transition-all cursor-pointer">
                Đọc nhanh <ArrowRight size={14} />
              </button>
              <div className="absolute right-[-10px] bottom-[-10px] opacity-10 pointer-events-none">{getHotIcon(hot.type)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-stone-900">Tin Tức Mới Nhất</h2>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{news.length} Bản tin</span>
             <button onClick={handleRefreshNews} disabled={isRefreshingNews} className="p-2 bg-white rounded-xl shadow-sm border border-stone-100 text-emerald-600 active:scale-90 transition-all hover:bg-emerald-50">
               <RotateCw size={14} className={isRefreshingNews ? 'animate-spin' : ''} />
             </button>
          </div>
        </div>
        {news.slice(0, visibleNewsCount).map(n => (
          <div key={n.id} onClick={() => setSelectedItem({...n, type: 'news'})} className="bg-white p-3 rounded-3xl flex gap-4 shadow-sm border border-stone-50 active:scale-98 transition-all cursor-pointer hover:border-emerald-100 group">
            <div className="relative shrink-0">
              <img src={n.image} className="w-24 h-24 object-cover rounded-2xl" alt="" />
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-lg">
                 <p className="text-[8px] font-black text-stone-900 uppercase">{String(n.readTime)}</p>
              </div>
            </div>
            <div className="flex flex-col justify-between py-1 flex-1">
              <div>
                <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">{String(n.category)}</p>
                <h4 className="text-sm font-bold text-stone-900 leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors">{String(n.title)}</h4>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock size={10} className="text-stone-300" />
                  <span className="text-[9px] text-stone-400 font-black uppercase">{String(n.time)}</span>
                </div>
                {bookmarks.includes(n.id) && <Bookmark size={12} className="text-emerald-500 fill-current" />}
              </div>
            </div>
          </div>
        ))}
        {visibleNewsCount < news.length && (
          <button onClick={() => setVisibleNewsCount(prev => prev + 3)} className="w-full py-4 mt-2 bg-stone-100 text-stone-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 active:scale-95 transition-all">
            Tải thêm tin tức
          </button>
        )}
      </div>
    </div>
  );

  const renderDetailOverlay = () => {
    if (!selectedItem) return null;
    const isNews = (selectedItem.type === 'news' || selectedItem.type === 'news_article');
    
    return (
      <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-sm flex justify-center animate-in fade-in duration-200">
        <div className="w-full max-w-md h-full overflow-y-auto bg-white shadow-2xl relative animate-in slide-in-from-bottom-8 duration-300 flex flex-col">
          <header className="sticky top-0 bg-white/90 backdrop-blur-md p-6 flex justify-between items-center z-20 border-b border-stone-50 shrink-0">
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
          
          <main className="px-6 py-6 pb-24 space-y-8 relative z-10 flex-1">
            {isNews ? (
              <>
                <div className="relative">
                   <img src={selectedItem.image} className="w-full h-64 object-cover rounded-[3rem] shadow-xl" alt="" />
                   <div className="absolute -bottom-4 right-8 bg-white px-6 py-3 rounded-2xl shadow-lg border border-stone-50">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Tác giả</p>
                      <p className="text-xs font-bold text-stone-900">{String(selectedItem.author || 'Hệ thống AI')}</p>
                   </div>
                </div>
                <div className="flex gap-3 items-center text-[10px] font-black text-stone-400 uppercase pt-4">
                  <span className="bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-full">{String(selectedItem.category || 'Tin tức')}</span>
                  <span>{String(selectedItem.readTime || '3 phút đọc')}</span>
                  <span>•</span>
                  <span>{String(selectedItem.time || 'Vừa xong')}</span>
                </div>
                <h1 className="text-3xl font-black text-stone-900 leading-tight">{String(selectedItem.title || '')}</h1>
                
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
                      {String(selectedItem.aiSummary)}
                    </div>
                  </div>
                )}

                <div className="mt-8 space-y-6">
                  {Array.isArray(selectedItem.content) && selectedItem.content.map((block, i) => {
                    if (typeof block === 'string') {
                      return <p key={i} className="text-[15px] text-stone-700 leading-loose font-medium">{String(block)}</p>;
                    }
                    
                    switch (block.type) {
                      case 'lead':
                        return <p key={i} className="text-base text-stone-900 leading-relaxed font-bold">{String(block.text || '')}</p>;
                      case 'paragraph':
                        return <p key={i} className="text-[15px] text-stone-700 leading-loose font-medium">{String(block.text || '')}</p>;
                      case 'subheading':
                        return <h3 key={i} className="text-xl font-black text-stone-900 mt-10 mb-4 border-b border-stone-100 pb-2">{String(block.text || '')}</h3>;
                      case 'quote':
                        return (
                          <blockquote key={i} className="my-8 p-6 bg-emerald-50/50 border-l-4 border-emerald-500 rounded-2xl relative shadow-sm">
                            <Quote size={24} className="text-emerald-200 absolute top-4 right-4" />
                            <p className="text-[15px] italic text-emerald-900/80 font-medium relative z-10">"{String(block.text || '')}"</p>
                            {block.author && <footer className="mt-3 text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2">— {String(block.author)}</footer>}
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
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{String(selectedItem.province || selectedItem.market || '')}</p>
                  </div>
                  
                  <div className="flex items-baseline justify-center gap-2">
                    <h1 className="text-6xl font-black text-stone-900 tracking-tighter">{Number(selectedItem.price || 0).toLocaleString()}</h1>
                    <span className="text-xl font-bold text-stone-400">{String(selectedItem.unit || 'đ/kg')}</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-black shadow-sm border ${selectedItem.change < 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                      {selectedItem.change < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                      {Math.abs(Number(selectedItem.change || 0)).toLocaleString()}đ
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-[11px] font-black text-stone-500 uppercase tracking-widest">
                      Xu hướng: {selectedItem.trend === 'Bullish' ? 'Tăng' : selectedItem.trend === 'Bearish' ? 'Giảm' : 'Đi ngang'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="p-4 bg-white border border-stone-100 rounded-3xl shadow-sm flex flex-col items-center justify-center">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Đỉnh 30 ngày</p>
                    <p className="text-xl font-black text-stone-800">{Number(selectedItem.high30d || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-white border border-stone-100 rounded-3xl shadow-sm flex flex-col items-center justify-center">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Đáy 30 ngày</p>
                    <p className="text-xl font-black text-stone-800">{Number(selectedItem.low30d || 0).toLocaleString()}</p>
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
                      "{String(selectedItem.aiPrediction)}"
                    </p>
                  </div>
                )}

                <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm mt-4">
                  <div className="flex items-center justify-between mb-8">
                     <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Lịch sử 7 ngày qua</h4>
                     <Calendar size={14} className="text-stone-300"/>
                  </div>
                  <div className="h-40 w-full flex items-end justify-between gap-2 px-1">
                    {Array.isArray(selectedItem.history) && selectedItem.history.map((h, i) => (
                      <div key={i} className="flex flex-col items-center flex-1 gap-2 h-full justify-end group">
                        <div className="text-[10px] font-black text-stone-500 mb-1 opacity-80 group-hover:opacity-100 group-hover:text-stone-900 transition-colors">
                           {(Number(h)/1000).toFixed(1)}
                        </div>
                        <div className={`w-full rounded-t-xl transition-all duration-1000 ease-out ${selectedItem.change < 0 ? 'bg-red-400/40 group-hover:bg-red-400/60' : 'bg-emerald-400/40 group-hover:bg-emerald-400/60'}`} style={{ height: `${((Number(h) - Math.min(...selectedItem.history)) / (Math.max(...selectedItem.history) - Math.min(...selectedItem.history) || 1) * 60) + 15}%` }}></div>
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
                    {String(selectedItem.analysis || '')}
                  </p>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    );
  };

  // Nếu CSS chưa tải xong, hiển thị màn hình chờ mượt mà
  if (!isSystemReady) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', backgroundColor: '#fafaf9', fontFamily: 'system-ui, sans-serif', color: '#047857' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>Coffee Intel Pro</div>
        <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Đang khởi tạo tài nguyên hệ thống...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-stone-50 min-h-screen relative font-sans text-stone-900 select-none overflow-x-hidden">
      {toast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[150] bg-stone-900 text-white px-6 py-3.5 rounded-full text-xs font-black shadow-2xl flex items-center gap-3 border border-white/10 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={16} className="text-emerald-400" /> {String(toast)}
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
          <p className="text-[9px] text-emerald-600 font-black tracking-widest uppercase mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Gemini AI Intelligence ✨
          </p>
        </div>
        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden p-1 shrink-0">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'guest'}`} className="w-full h-full object-cover bg-stone-50 rounded-xl" alt="Profile" />
        </div>
      </header>

      <main className="px-8 pt-6 pb-28 relative z-10">
        {activeTab === 'dashboard' ? renderDashboardView() : activeTab === 'brazil' ? renderBrazilView() : renderNewsView()}
      </main>

      {renderDetailOverlay()}

      <nav className="fixed bottom-8 left-8 right-8 h-20 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 flex items-center justify-around px-4 z-50 max-w-sm mx-auto">
        <button onClick={() => handleTabChange('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'dashboard' ? 'text-emerald-600 scale-110' : 'text-stone-300'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'dashboard' ? 'bg-emerald-50' : ''}`}><BarChart3 size={24} /></div>
          <span className="text-[8px] font-black uppercase tracking-tighter">Giá cả</span>
        </button>
        <button onClick={() => handleTabChange('brazil')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'brazil' ? 'text-emerald-600 scale-110' : 'text-stone-300'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'brazil' ? 'bg-emerald-50' : ''}`}><Globe size={24} /></div>
          <span className="text-[8px] font-black uppercase tracking-tighter">Brazil</span>
        </button>
        <button onClick={() => handleTabChange('news')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'news' ? 'text-emerald-600 scale-110' : 'text-stone-300'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'news' ? 'bg-emerald-50' : ''}`}><Newspaper size={24} /></div>
          <span className="text-[8px] font-black uppercase tracking-tighter">Tin tức</span>
        </button>
      </nav>
    </div>
  );
}