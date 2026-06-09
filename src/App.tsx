import React, { useState, useEffect, FormEvent } from 'react';
import { 
  Instagram, 
  Mail, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Heart, 
  RefreshCw,
  Sliders,
  Check,
  ChevronDown,
  X
} from 'lucide-react';
import { Work, Journal, AboutInfo, ContactInfo, ActiveTab, CustomTab } from './types';
import { INITIAL_WORKS, INITIAL_JOURNALS, INITIAL_ABOUT, INITIAL_CONTACT } from './initialData';
import defaultVideo from './assets/images/japanese_blue_ambient.mp4';
import homeHeroImg from './assets/images/home_hero_1780643011034.png';
import fukuokaRainImg from './assets/images/fukuoka_rain_1780643028212.png';
import blueStationImg from './assets/images/blue_station_1780643044740.png';
import summerCrossingImg from './assets/images/summer_crossing_1780643057527.png';

// Premium high-quality photography presets for easy admin creation/replacement tasks
const PHOTO_PRESETS = [
  { url: homeHeroImg, label: '후쿠오카 저물녘 (Blue Hour)' },
  { url: fukuokaRainImg, label: '비 내리는 텐진 (Rainy Fukuoka)' },
  { url: blueStationImg, label: '교토 밤기차 정류장 (Blue Station)' },
  { url: summerCrossingImg, label: '여름의 교차로 (Summer Crossing)' },
  { url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1000&auto=format&fit=crop&q=80', label: '도쿄 밤거리 골목길' },
  { url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80', label: '도쿄 가로등 자전거' },
  { url: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1000&auto=format&fit=crop&q=80', label: '벚꽃 날리는 자판기' },
  { url: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=1000&auto=format&fit=crop&q=80', label: '전철 창 너머 노을' },
  { url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=80', label: '해질녘 일본식 가옥' },
  { url: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=1000&auto=format&fit=crop&q=80', label: '눈 내리는 소박한 전차' },
  { url: 'https://images.unsplash.com/photo-1524413840003-05898d0c4765?w=1000&auto=format&fit=crop&q=80', label: '따뜻한 골목 어귀' }
];

// --- IndexedDB for High-Performance Video Storage ---
const DB_NAME = 'macoloris_media_db';
const STORE_NAME = 'media_store';
const VIDEO_KEY = 'landing_video_blob';

const saveVideoToIndexedDB = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(file, VIDEO_KEY);
      
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    
    request.onerror = () => reject(request.error);
  });
};

const loadVideoFromIndexedDB = (): Promise<Blob | null> => {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          resolve(null);
          return;
        }
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(VIDEO_KEY);
        
        getReq.onsuccess = () => {
          resolve(getReq.result || null);
        };
        getReq.onerror = () => resolve(null);
      };
      
      request.onerror = () => resolve(null);
    } catch (err) {
      resolve(null);
    }
  });
};

const deleteVideoFromIndexedDB = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          resolve();
          return;
        }
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const delReq = store.delete(VIDEO_KEY);
        delReq.onsuccess = () => resolve();
        delReq.onerror = () => resolve();
      };
      request.onerror = () => resolve();
    } catch (err) {
      resolve();
    }
  });
};

const compressImageFile = (file: File, maxW = 2048, maxH = 2048, quality = 0.92): Promise<string> => {
  return new Promise((resolve) => {
    // 만약 파일 크기가 아주 작고 이미 최적화된 상태라면 (< 400KB), Canvas 스케일링을 거치지 않고 원본 화질 그대로 data URL로 읽어들여 원본 화질을 상실 없이 완벽히 유지합니다.
    if (file.size < 400 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // 고해상도 경계를 초과하는 경우에만 비율 유지하여 스케일 다운
        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // 브라우저 렌더러의 고화질 스무딩 기법 활성화
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          // PNG가 투명 영역을 가진 경우를 안전하게 보존하기 위함
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          if (mimeType === 'image/png') {
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(canvas.toDataURL('image/jpeg', quality));
          }
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      resolve('');
    };
    reader.readAsDataURL(file);
  });
};

const DEFAULT_VIDEO_URL = defaultVideo;

const blobUrlCache = new Map<string, string>();

const getPlayableVideoUrl = (url: string): string => {
  if (!url) return '';
  if (url === 'video.mp4' || url.includes('mixkit.co') || url === 'indexeddb_data') return DEFAULT_VIDEO_URL;
  if (!url.startsWith('data:video/')) return url;
  
  const cached = blobUrlCache.get(url);
  if (cached) return cached;
  
  try {
    const parts = url.split(',');
    if (parts.length < 2) return url;
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'video/mp4';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    const blobUrl = URL.createObjectURL(blob);
    blobUrlCache.set(url, blobUrl);
    return blobUrl;
  } catch (e) {
    console.error("Failed to convert data URL to Blob URL:", e);
    return url;
  }
};

const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  if (url.includes('#video')) return true;
  return url.startsWith('data:video/') || 
         url.toLowerCase().endsWith('.mp4') || 
         url.toLowerCase().endsWith('.mov') || 
         url.toLowerCase().endsWith('.quicktime') || 
         url.toLowerCase().endsWith('.webm');
};

export default function App() {
  // --- Persistent States ---
  const [works, setWorks] = useState<Work[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [about, setAbout] = useState<AboutInfo>(INITIAL_ABOUT);
  const [contact, setContact] = useState<ContactInfo>(INITIAL_CONTACT);
  
  // --- Persistent Emotion States ---
  const [emotions, setEmotions] = useState<{ name: string; english: string; description: string; detail: string }[]>(() => {
    const saved = localStorage.getItem('macoloris_emotions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [
      { 
        name: '그리움', 
        english: 'Nostalgia', 
        description: '해질녘의 긴 여운처럼, 마음 한편에 소리 없이 쌓여 지워지지 않는 그리움의 기록들.', 
        detail: '사그라지지 않고 남아 있는 그늘진 마음의 결들.' 
      },
      { 
        name: '외로움', 
        english: 'Solitude', 
        description: '가만히 시선을 돌렸을 때, 고요 위로 길게 늘어앉았던 소박한 홀로됨의 순간들.', 
        detail: '세상이 잠든 고요한 역장, 온전히 한 사람으로 머물던 어귀의 푸른 어둠.' 
      },
      { 
        name: '청춘', 
        english: 'Youth', 
        description: '미완성의 서투른 날갯짓처럼, 거리를 채우는 자전거 바퀴와 빨간 신호등의 감각.', 
        detail: '서투르고 온당하지만 무엇보다 찬연히 빛났던 그날들의 조각.' 
      },
      { 
        name: '여름', 
        english: 'Summer (Natsu)', 
        description: '푸른 하늘과 눈부신 뭉게구름, 그리고 뜨거웠던 모래바람마저 애틋했던 찬란한 기억.', 
        detail: '바다 지평선과 끝없던 푸른 하늘, 그리고 한 줄기 소나기의 감성.' 
      }
    ];
  });

  const saveEmotionsToStorage = (updatedList: typeof emotions) => {
    setEmotions(updatedList);
    localStorage.setItem('macoloris_emotions', JSON.stringify(updatedList));
    syncPortfolioWithServer({ emotions: updatedList });
  };
  
  // High performance local video state
  const [tempVideoFile, setTempVideoFile] = useState<File | null>(null);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  
  // --- Custom Tab/Sections States ---
  const [customTabs, setCustomTabs] = useState<CustomTab[]>(() => {
    const saved = localStorage.getItem('macoloris_custom_tabs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'exhibitions',
        name: 'Exhibition',
        content: `### Solitary Blue (고독의 푸름)

2026 fukuoka, japan.

바쁜 아침의 건널목, 해질녘 골목의 가로등 아래, 비오는 날의 차창 바깥...
어디에나 청색의 숨결이 스며 있습니다.

• 일시: 2026. 03. 10 - 2026. 04. 10
• 장소: 가라쓰 블루 큐브 아틀리에

많은 방문을 소망합니다.`,
        visible: true,
        image: 'https://images.unsplash.com/photo-1547891654-e66ed7edd96c?w=1200&auto=format&fit=crop&q=80'
      }
    ];
  });

  const saveCustomTabsToStorage = (newTabs: CustomTab[]) => {
    setCustomTabs(newTabs);
    localStorage.setItem('macoloris_custom_tabs', JSON.stringify(newTabs));
    syncPortfolioWithServer({ customTabs: newTabs });
  };

  const [editingCustomTab, setEditingCustomTab] = useState<Partial<CustomTab> | null>(null);
  const [isCreatingNewCustomTab, setIsCreatingNewCustomTab] = useState<boolean>(false);


  // --- Section/Menu Visibility State ---
  const [visibleSections, setVisibleSections] = useState<{
    works: boolean;
    archive: boolean;
    emotions: boolean;
    journal: boolean;
    about: boolean;
    introVideo: boolean;
    footerContact: boolean;
    showBirthYear: boolean;
    showBirthPlace: boolean;
    showOccupation: boolean;
    showGears: boolean;
    showContactForm: boolean;
  }>(() => {
    const saved = localStorage.getItem('macoloris_visible_sections');
    return saved ? {
      works: true,
      archive: true,
      emotions: true,
      journal: true,
      about: true,
      introVideo: true,
      footerContact: true,
      showBirthYear: true,
      showBirthPlace: true,
      showOccupation: true,
      showGears: true,
      showContactForm: true,
      ...JSON.parse(saved)
    } : {
      works: true,
      archive: true,
      emotions: true,
      journal: true,
      about: true,
      introVideo: true,
      footerContact: true,
      showBirthYear: true,
      showBirthPlace: true,
      showOccupation: true,
      showGears: true,
      showContactForm: true
    };
  });

  const saveVisibleSectionsToStorage = (newSections: typeof visibleSections) => {
    setVisibleSections(newSections);
    localStorage.setItem('macoloris_visible_sections', JSON.stringify(newSections));
    syncPortfolioWithServer({ visibleSections: newSections });
  };

  // --- UI Control States ---
  const [hasEntered, setHasEntered] = useState<boolean>(() => {
    const saved = localStorage.getItem('macoloris_visible_sections');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.introVideo === false) {
          return true; // Auto-skip intro if disabled
        }
      } catch (e) {
        // fallback
      }
    }
    return false;
  });
  const [videoUrl, setVideoUrl] = useState<string>(() => {
    return localStorage.getItem('macoloris_video_url') || DEFAULT_VIDEO_URL;
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const saved = localStorage.getItem('macoloris_visible_sections');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.works !== false) return 'WORKS';
        if (parsed.archive !== false) return 'ARCHIVE';
        if (parsed.emotions !== false) return 'EMOTIONS';
        if (parsed.journal !== false) return 'JOURNAL';
        if (parsed.about !== false) return 'ABOUT';
      } catch (e) {
        // fallback
      }
    }
    const savedCustom = localStorage.getItem('macoloris_custom_tabs');
    if (savedCustom) {
      try {
        const parsedCustom = JSON.parse(savedCustom);
        const firstCustom = parsedCustom.find((ct: any) => ct.visible);
        if (firstCustom) return firstCustom.id;
      } catch (e) {
        // fallback
      }
    }
    return 'WORKS';
  });
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [showDetailInfo, setShowDetailInfo] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [coverMobileMenuOpen, setCoverMobileMenuOpen] = useState<boolean>(false);
  
  // --- Admin States ---
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');
  const [showAdminEntry, setShowAdminEntry] = useState<boolean>(false);
  const [secretClickCount, setSecretClickCount] = useState<number>(0);

  // --- Admin Settings Temporary Workspaces ---
  const [tempAbout, setTempAbout] = useState<AboutInfo | null>(null);
  const [tempContact, setTempContact] = useState<ContactInfo | null>(null);
  const [tempVideoUrl, setTempVideoUrl] = useState<string>('');
  const [tempVisibleSections, setTempVisibleSections] = useState<any>(null);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState<string>('');

  const triggerSecretAdmin = () => {
    setSecretClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setShowAdminEntry(curr => !curr);
        setAdminPassword('');
        setAdminError('');
        return 0; // reset
      }
      return next;
    });
  };
  
  // --- Admin Editing Forms State ---
  const [editingWork, setEditingWork] = useState<Partial<Work> | null>(null);
  const [editingJournal, setEditingJournal] = useState<Partial<Journal> | null>(null);
  const [editingEmotion, setEditingEmotion] = useState<{ originalName?: string; name: string; english: string; description: string; detail: string } | null>(null);
  const [isCreatingNewWork, setIsCreatingNewWork] = useState<boolean>(false);
  const [isCreatingNewJournal, setIsCreatingNewJournal] = useState<boolean>(false);
  const [isCreatingNewEmotion, setIsCreatingNewEmotion] = useState<boolean>(false);

  // --- Drag and Drop / Tap-to-Swap reorder states ---
  const [draggedWorkImageIdx, setDraggedWorkImageIdx] = useState<number | null>(null);
  const [draggedJournalImageIdx, setDraggedJournalImageIdx] = useState<number | null>(null);
  const [dragHoverWorkImageIdx, setDragHoverWorkImageIdx] = useState<number | null>(null);
  const [dragHoverJournalImageIdx, setDragHoverJournalImageIdx] = useState<number | null>(null);
  const [selectedReorderWorkImageIdx, setSelectedReorderWorkImageIdx] = useState<number | null>(null);
  const [selectedReorderJournalImageIdx, setSelectedReorderJournalImageIdx] = useState<number | null>(null);

  const handleDropWorkImage = (targetIdx: number) => {
    if (draggedWorkImageIdx === null || !editingWork || !editingWork.images) return;
    if (draggedWorkImageIdx === targetIdx) return;
    const newImages = [...editingWork.images];
    const draggedImg = newImages[draggedWorkImageIdx];
    newImages.splice(draggedWorkImageIdx, 1);
    newImages.splice(targetIdx, 0, draggedImg);
    setEditingWork({ ...editingWork, images: newImages });
    setDraggedWorkImageIdx(null);
    setDragHoverWorkImageIdx(null);
  };

  const handleDropJournalImage = (targetIdx: number) => {
    if (draggedJournalImageIdx === null || !editingJournal || !editingJournal.images) return;
    if (draggedJournalImageIdx === targetIdx) return;
    const newImages = [...editingJournal.images];
    const draggedImg = newImages[draggedJournalImageIdx];
    newImages.splice(draggedJournalImageIdx, 1);
    newImages.splice(targetIdx, 0, draggedImg);
    setEditingJournal({ ...editingJournal, images: newImages });
    setDraggedJournalImageIdx(null);
    setDragHoverJournalImageIdx(null);
  };

  // --- Synchronize state with backend disk storage in real-time ---
  const syncPortfolioWithServer = async (updatedOverride: {
    works?: Work[];
    journals?: Journal[];
    about?: AboutInfo;
    contact?: ContactInfo;
    emotions?: typeof emotions;
    customTabs?: CustomTab[];
    visibleSections?: typeof visibleSections;
    videoUrl?: string;
  } = {}) => {
    try {
      const payload = {
        works: updatedOverride.works !== undefined ? updatedOverride.works : works,
        journals: updatedOverride.journals !== undefined ? updatedOverride.journals : journals,
        about: updatedOverride.about !== undefined ? updatedOverride.about : about,
        contact: updatedOverride.contact !== undefined ? updatedOverride.contact : contact,
        emotions: updatedOverride.emotions !== undefined ? updatedOverride.emotions : emotions,
        customTabs: updatedOverride.customTabs !== undefined ? updatedOverride.customTabs : customTabs,
        visibleSections: updatedOverride.visibleSections !== undefined ? updatedOverride.visibleSections : visibleSections,
        videoUrl: updatedOverride.videoUrl !== undefined ? updatedOverride.videoUrl : videoUrl
      };

      // Sanitize base64 videos/blobs from payload to keep network payload size small
      if (payload.videoUrl && (payload.videoUrl.startsWith('data:') || payload.videoUrl.startsWith('blob:') || payload.videoUrl === 'indexeddb_data')) {
        payload.videoUrl = '';
      }

      await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("Could not sync with server db, locally protected:", err);
    }
  };

  // --- Export complete portfolio configuration as a backup file ---
  const handleExportBackup = () => {
    try {
      const backupData = {
        works,
        journals,
        about,
        contact,
        emotions,
        customTabs,
        visibleSections,
        videoUrl: videoUrl === 'indexeddb_data' ? '' : videoUrl
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `macoloris_portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("백업 파일 내보내기 중 오류가 발생했습니다: " + err);
    }
  };

  // --- Import portfolio configuration from a backup file ---
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const raw = event.target?.result as string;
          const data = JSON.parse(raw);
          
          if (data.works) {
            setWorks(data.works);
            localStorage.setItem('macoloris_works', JSON.stringify(data.works));
          }
          if (data.journals) {
            setJournals(data.journals);
            localStorage.setItem('macoloris_journals', JSON.stringify(data.journals));
          }
          if (data.about) {
            setAbout(data.about);
            localStorage.setItem('macoloris_about', JSON.stringify(data.about));
          }
          if (data.contact) {
            setContact(data.contact);
            localStorage.setItem('macoloris_contact', JSON.stringify(data.contact));
          }
          if (data.emotions) {
            setEmotions(data.emotions);
            localStorage.setItem('macoloris_emotions', JSON.stringify(data.emotions));
          }
          if (data.customTabs) {
            setCustomTabs(data.customTabs);
            localStorage.setItem('macoloris_custom_tabs', JSON.stringify(data.customTabs));
          }
          if (data.visibleSections) {
            setVisibleSections(data.visibleSections);
            localStorage.setItem('macoloris_visible_sections', JSON.stringify(data.visibleSections));
          }
          if (data.videoUrl) {
            setVideoUrl(data.videoUrl);
            localStorage.setItem('macoloris_video_url', data.videoUrl);
            localStorage.setItem('macoloris_video_source', 'url');
          }
          
          // Sync with server as well
          await fetch("/api/portfolio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          });
          
          alert("✨ 백업 정보 복원이 완료되었습니다! 기기 간 데이터 통합이 완료되었습니다.");
          window.location.reload();
        } catch (err) {
          alert("파일 해석에 실패했습니다. 올바른 포맷의 백업 JSON 파일인지 확인하십시오.");
        }
      };
      reader.readAsText(file);
    } catch (err) {
      alert("백업 파일 가져오기 실패: " + err);
    }
  };

  // --- Initialize data from Server database first, with local fallback ---
  useEffect(() => {
    const initializePortfolio = async () => {
      let serverData: any = null;
      try {
        const res = await fetch("/api/portfolio");
        if (res.ok) {
          const parsed = await res.json();
          if (parsed && parsed.status !== "none") {
            serverData = parsed;
          }
        }
      } catch (err) {
        console.warn("Server-side db loading failed, applying offline local memory fallback:", err);
      }

      // 1. Works
      if (serverData?.works) {
        setWorks(serverData.works);
        localStorage.setItem('macoloris_works', JSON.stringify(serverData.works));
      } else {
        const storedWorks = localStorage.getItem('macoloris_works');
        if (storedWorks) {
          setWorks(JSON.parse(storedWorks));
        } else {
          setWorks(INITIAL_WORKS);
          localStorage.setItem('macoloris_works', JSON.stringify(INITIAL_WORKS));
        }
      }

      // 2. Journals
      if (serverData?.journals) {
        setJournals(serverData.journals);
        localStorage.setItem('macoloris_journals', JSON.stringify(serverData.journals));
      } else {
        const storedJournals = localStorage.getItem('macoloris_journals');
        if (storedJournals) {
          setJournals(JSON.parse(storedJournals));
        } else {
          setJournals(INITIAL_JOURNALS);
          localStorage.setItem('macoloris_journals', JSON.stringify(INITIAL_JOURNALS));
        }
      }

      // 3. About
      if (serverData?.about) {
        setAbout(serverData.about);
        localStorage.setItem('macoloris_about', JSON.stringify(serverData.about));
      } else {
        const storedAbout = localStorage.getItem('macoloris_about');
        if (storedAbout) {
          setAbout(JSON.parse(storedAbout));
        } else {
          setAbout(INITIAL_ABOUT);
          localStorage.setItem('macoloris_about', JSON.stringify(INITIAL_ABOUT));
        }
      }

      // 4. Contact
      if (serverData?.contact) {
        setContact(serverData.contact);
        localStorage.setItem('macoloris_contact', JSON.stringify(serverData.contact));
      } else {
        const storedContact = localStorage.getItem('macoloris_contact');
        if (storedContact) {
          const parsedContact = JSON.parse(storedContact);
          if (parsedContact.email === 'j7o8945@gmail.com') {
            parsedContact.email = 'fkdlsh74jp@gmail.com';
            localStorage.setItem('macoloris_contact', JSON.stringify(parsedContact));
          }
          setContact(parsedContact);
        } else {
          setContact(INITIAL_CONTACT);
          localStorage.setItem('macoloris_contact', JSON.stringify(INITIAL_CONTACT));
        }
      }

      // 5. Emotions
      if (serverData?.emotions) {
        setEmotions(serverData.emotions);
        localStorage.setItem('macoloris_emotions', JSON.stringify(serverData.emotions));
      }

      // 6. CustomTabs
      if (serverData?.customTabs) {
        setCustomTabs(serverData.customTabs);
        localStorage.setItem('macoloris_custom_tabs', JSON.stringify(serverData.customTabs));
      }

      // 7. Visible Sections
      if (serverData?.visibleSections) {
        setVisibleSections(serverData.visibleSections);
        localStorage.setItem('macoloris_visible_sections', JSON.stringify(serverData.visibleSections));
      }

      // 8. Video load logic
      let finalVideoUrl = DEFAULT_VIDEO_URL;
      if (serverData?.videoUrl && serverData.videoUrl !== 'indexeddb_data') {
        finalVideoUrl = serverData.videoUrl;
        setVideoUrl(serverData.videoUrl);
        localStorage.setItem('macoloris_video_url', serverData.videoUrl);
        localStorage.setItem('macoloris_video_source', 'url');
        setIsVideoReady(true);
      } else {
        const videoSource = localStorage.getItem('macoloris_video_source');
        if (videoSource === 'indexeddb') {
          loadVideoFromIndexedDB().then(blob => {
            if (blob) {
              const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
              if (isMobile || blob.size < 12 * 1024 * 1024) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                    setVideoUrl(reader.result);
                    setIsVideoReady(true);
                  }
                };
                reader.readAsDataURL(blob);
              } else {
                const objUrl = URL.createObjectURL(blob);
                setVideoUrl(objUrl);
                setIsVideoReady(true);
              }
            } else {
              const savedUrl = localStorage.getItem('macoloris_video_url') || DEFAULT_VIDEO_URL;
              if (savedUrl === 'indexeddb_data' || savedUrl === 'video.mp4' || savedUrl.includes('mixkit.co')) {
                setVideoUrl(DEFAULT_VIDEO_URL);
                localStorage.setItem('macoloris_video_url', DEFAULT_VIDEO_URL);
              } else {
                setVideoUrl(savedUrl);
              }
              setIsVideoReady(true);
            }
          }).catch(err => {
            console.error("IndexedDB load failed, falling back to default:", err);
            setVideoUrl(DEFAULT_VIDEO_URL);
            setIsVideoReady(true);
          });
        } else {
          const savedUrl = localStorage.getItem('macoloris_video_url') || DEFAULT_VIDEO_URL;
          if (savedUrl && !savedUrl.startsWith('data:') && !savedUrl.startsWith('blob:') && savedUrl !== 'indexeddb_data' && savedUrl !== 'video.mp4' && !savedUrl.includes('mixkit.co')) {
            setVideoUrl(savedUrl);
          } else {
            setVideoUrl(DEFAULT_VIDEO_URL);
            localStorage.setItem('macoloris_video_url', DEFAULT_VIDEO_URL);
          }
          setIsVideoReady(true);
        }
      }
    };

    initializePortfolio();
  }, []);

  // Sync body background color with entry state to prevent any white gap, scroll borders, or page cuts during intro
  useEffect(() => {
    if (!hasEntered) {
      document.body.style.backgroundColor = '#121212';
    } else {
      document.body.style.backgroundColor = ''; // Restores standard off-white theme
    }
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [hasEntered]);

  // Programmatically trigger video load & play to bypass aggressive mobile browser restrictions
  useEffect(() => {
    if (isVideoReady && videoRef.current) {
      const video = videoRef.current;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      
      const playVideo = () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Autoplay was prevented by mobile browser. Retrying muted play on action:", error);
            const startPlay = () => {
              video.play().catch(e => console.log("Play failed after interaction:", e));
              document.removeEventListener('touchstart', startPlay);
              document.removeEventListener('click', startPlay);
            };
            document.addEventListener('touchstart', startPlay, { passive: true });
            document.addEventListener('click', startPlay, { passive: true });
          });
        }
      };

      playVideo();
    }
  }, [videoUrl, isVideoReady, hasEntered]);

  // --- Admin settings sync workspace ---
  useEffect(() => {
    if (activeTab === 'ADMIN' && isAdmin) {
      setTempAbout({ ...about });
      setTempContact({ ...contact });
      setTempVideoUrl(videoUrl);
      setTempVisibleSections({ ...visibleSections });
      setSettingsSavedMessage('');
    }
  }, [activeTab, isAdmin]);

  const handleSaveAllSettings = async () => {
    if (tempAbout && tempContact && tempVisibleSections) {
      // 1. Save About
      setAbout({ ...tempAbout });
      localStorage.setItem('macoloris_about', JSON.stringify(tempAbout));
      
      // 2. Save Contact
      setContact({ ...tempContact });
      localStorage.setItem('macoloris_contact', JSON.stringify(tempContact));
      
      let finalVideoUrlToSync = tempVideoUrl;

      // 3. Save Video Url
      if (tempVideoFile) {
        try {
          await saveVideoToIndexedDB(tempVideoFile);
          localStorage.setItem('macoloris_video_source', 'indexeddb');
          
          // Read base64 synchronously as promise so we can upload it before syncing
          const base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string || '');
            reader.readAsDataURL(tempVideoFile);
          });

          // Upload to backend storage on server disk
          try {
            const uploadRes = await fetch("/api/video/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ base64: base64Data })
            });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              localStorage.setItem('macoloris_video_url', uploadData.url);
              localStorage.setItem('macoloris_video_source', 'url');
              setVideoUrl(uploadData.url);
              finalVideoUrlToSync = uploadData.url;
            } else {
              localStorage.setItem('macoloris_video_url', 'indexeddb_data');
              setVideoUrl(base64Data);
              finalVideoUrlToSync = 'indexeddb_data';
            }
          } catch (apiErr) {
            console.error("Failed to upload video to server:", apiErr);
            localStorage.setItem('macoloris_video_url', 'indexeddb_data');
            setVideoUrl(base64Data);
            finalVideoUrlToSync = 'indexeddb_data';
          }
          
          setTempVideoFile(null);
        } catch (err) {
          console.error("IndexedDB video save error:", err);
          alert("동영상 파일을 웹 데이터베이스에 저장하는 도중 오류가 발생했습니다. 브라우저 여유 공간이 부족하거나 보안 제약이 있는 환경(예: 일부 인앱 브라우저나 프라이빗 탭)일 수 있습니다. 직접 MP4 파일의 URL 주소를 입력하여 저장하시는 것을 추천합니다.");
        }
      } else {
        // If there is no new file uploaded, check if the video URL was modified (and is not an internal blob/data link)
        if (tempVideoUrl !== videoUrl && tempVideoUrl !== '') {
          if (!tempVideoUrl.startsWith('blob:') && !tempVideoUrl.startsWith('data:') && tempVideoUrl !== 'indexeddb_data') {
            localStorage.setItem('macoloris_video_source', 'url');
            localStorage.setItem('macoloris_video_url', tempVideoUrl);
            setVideoUrl(tempVideoUrl);
            await deleteVideoFromIndexedDB();
            finalVideoUrlToSync = tempVideoUrl;
          }
        } else {
          // Keep active videoUrl
          finalVideoUrlToSync = videoUrl;
        }
      }
      
      // 4. Save Visible Sections
      setVisibleSections({ ...tempVisibleSections });
      localStorage.setItem('macoloris_visible_sections', JSON.stringify(tempVisibleSections));

      // Synchronize all settings directly with the server database
      await syncPortfolioWithServer({
        about: tempAbout,
        contact: tempContact,
        visibleSections: tempVisibleSections,
        videoUrl: finalVideoUrlToSync
      });
      
      // 5. Show save complete message
      setSettingsSavedMessage('✨ 모든 기본 설정과 인트로 영상이 정상적으로 저장되었습니다!');
      setTimeout(() => setSettingsSavedMessage(''), 5500);
    }
  };

  // --- Save helpers ---
  const saveWorksToStorage = (newWorks: Work[]) => {
    setWorks(newWorks);
    try {
      localStorage.setItem('macoloris_works', JSON.stringify(newWorks));
      syncPortfolioWithServer({ works: newWorks });
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        alert("⚠️ 브라우저의 저장 용량 한도(5MB~10MB)를 초과하여 게시물이 로컬에 저장되지 못했습니다. 새로 추가하시려는 동영상/이미지 파일의 용량이 너무 큽니다. 모바일 및 웹에서의 쾌적한 재생을 위해 5MB 이하 수준으로 압축된 MP4(동영상) 또는 JPEG(사진) 파일을 업로드하는 것을 절대 권장합니다.");
      } else {
        console.error("Storage save error:", e);
      }
    }
  };

  const saveJournalsToStorage = (newJournals: Journal[]) => {
    setJournals(newJournals);
    try {
      localStorage.setItem('macoloris_journals', JSON.stringify(newJournals));
      syncPortfolioWithServer({ journals: newJournals });
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        alert("⚠️ 브라우저의 저장 용량 한도(5MB~10MB)를 초과하여 저널이 로컬에 저장되지 못했습니다. 동영상/이미지 파일의 해상도나 용량을 약간 줄여서 압축된 파일로 재업로드하십시오.");
      } else {
        console.error("Storage save error:", e);
      }
    }
  };

  const saveAboutToStorage = (newAbout: AboutInfo) => {
    setAbout(newAbout);
    localStorage.setItem('macoloris_about', JSON.stringify(newAbout));
    syncPortfolioWithServer({ about: newAbout });
  };

  const saveContactToStorage = (newContact: ContactInfo) => {
    setContact(newContact);
    localStorage.setItem('macoloris_contact', JSON.stringify(newContact));
    syncPortfolioWithServer({ contact: newContact });
  };

  const saveVideoUrlToStorage = (url: string) => {
    setVideoUrl(url);
    localStorage.setItem('macoloris_video_url', url);
    syncPortfolioWithServer({ videoUrl: url });
  };

  const handleSaveCustomTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomTab || !editingCustomTab.name || !editingCustomTab.id) return;
    
    const formattedId = editingCustomTab.id.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const tabData: CustomTab = {
      id: formattedId,
      name: editingCustomTab.name,
      content: editingCustomTab.content || '',
      visible: editingCustomTab.visible !== undefined ? editingCustomTab.visible : true,
      image: editingCustomTab.image
    };

    let updatedList = [...customTabs];
    const existingIndex = customTabs.findIndex(t => t.id === editingCustomTab.id);
    if (existingIndex > -1 && !isCreatingNewCustomTab) {
      updatedList[existingIndex] = tabData;
    } else {
      if (customTabs.some(t => t.id === formattedId)) {
        alert("이미 존재하는 탭 ID입니다. 고유한 ID를 사용해 주십시오.");
        return;
      }
      updatedList.push(tabData);
    }
    
    saveCustomTabsToStorage(updatedList);
    setEditingCustomTab(null);
  };

  const handleDeleteCustomTab = (id: string) => {
    if (confirm("정말로 이 커스텀 탭 메뉴를 삭제하시겠습니까?")) {
      const filtered = customTabs.filter(t => t.id !== id);
      saveCustomTabsToStorage(filtered);
      if (activeTab === id) {
        setActiveTab(getFirstActiveTab());
      }
    }
  };

  const handleMoveCustomTabUp = (index: number) => {
    if (index === 0) return;
    const updatedList = [...customTabs];
    const temp = updatedList[index];
    updatedList[index] = updatedList[index - 1];
    updatedList[index - 1] = temp;
    saveCustomTabsToStorage(updatedList);
  };

  const handleMoveCustomTabDown = (index: number) => {
    if (index === customTabs.length - 1) return;
    const updatedList = [...customTabs];
    const temp = updatedList[index];
    updatedList[index] = updatedList[index + 1];
    updatedList[index + 1] = temp;
    saveCustomTabsToStorage(updatedList);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('모든 데이터를 초기 값으로 복원하시겠습니까? 추가하신 데이터가 모두 삭제됩니다.')) {
      saveWorksToStorage(INITIAL_WORKS);
      saveJournalsToStorage(INITIAL_JOURNALS);
      saveAboutToStorage(INITIAL_ABOUT);
      saveContactToStorage(INITIAL_CONTACT);
      localStorage.removeItem('macoloris_video_url');
      localStorage.removeItem('macoloris_visible_sections');
      localStorage.removeItem('macoloris_emotions');
      alert('초기 국가/감정 포트폴리오 상태로 성공적으로 재설정되었습니다.');
      window.location.reload();
    }
  };

  // --- Auth Handlers ---
  const handleAdminVerify = (e: FormEvent) => {
    e.preventDefault();
    if (adminPassword === '1619') {
      setIsAdmin(true);
      setAdminError('');
      setAdminPassword('');
      alert('관리자 모드가 활성화되었습니다.');
    } else {
      setAdminError('비밀번호가 올바르지 않습니다.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    alert('로그아웃 되었습니다.');
  };

  // --- Work Logic (Add, Edit, Delete) ---
  const handleSaveWork = (e: FormEvent) => {
    e.preventDefault();
    if (!editingWork || !editingWork.title || !editingWork.location) {
      alert('제목과 장소를 반드시 입력해주세요.');
      return;
    }

    const currentYear = editingWork.year || new Date().getFullYear();
    const cleanWork: Work = {
      id: editingWork.id || `work-${Date.now()}`,
      title: editingWork.title || '이름 없는 기억',
      year: Number(currentYear),
      location: editingWork.location || 'Japan',
      date: editingWork.date || `${currentYear}.01`,
      emotion: editingWork.emotion || '그리움',
      preface: editingWork.preface || '여기에 새로운 감정 서문을 입력하세요.',
      images: editingWork.images && editingWork.images.length > 0 ? editingWork.images : PHOTO_PRESETS.slice(0, 3).map(p => p.url),
      closing: editingWork.closing || '또한 생각이 나면 여기에 서성이리라.',
      featured: editingWork.featured !== undefined ? editingWork.featured : true
    };

    let updatedList: Work[];
    if (isCreatingNewWork) {
      updatedList = [cleanWork, ...works];
    } else {
      updatedList = works.map(w => w.id === cleanWork.id ? cleanWork : w);
    }

    saveWorksToStorage(updatedList);
    setEditingWork(null);
    setIsCreatingNewWork(false);
    alert('포트폴리오가 정상적으로 저장되었습니다.');
  };

  const handleDeleteWork = (id: string) => {
    if (window.confirm('이 포트폴리오 기록을 정말로 영구 삭제하시겠습니까?')) {
      const filtered = works.filter(w => w.id !== id);
      saveWorksToStorage(filtered);
      if (selectedWorkId === id) setSelectedWorkId(null);
    }
  };

  // --- Emotion Logic (Add, Edit, Delete) ---
  const handleSaveEmotion = (e: FormEvent) => {
    e.preventDefault();
    if (!editingEmotion || !editingEmotion.name) {
      alert('감정 이름은 필수 항목입니다.');
      return;
    }

    const cleanName = editingEmotion.name.trim();
    if (!cleanName) {
      alert('올바른 감정 이름을 입력해주세요.');
      return;
    }

    const emotionData = {
      name: cleanName,
      english: (editingEmotion.english || '').trim() || 'Custom Sentiments',
      description: (editingEmotion.description || '').trim() || `"${cleanName}에 관한 마음의 조각들."`,
      detail: (editingEmotion.detail || '').trim() || `"${cleanName} 아래 스쳐 간 기억의 결들."`
    };

    let updatedList = [...emotions];

    if (isCreatingNewEmotion) {
      // Check for duplicate name
      if (emotions.some(emo => emo.name === cleanName)) {
        alert('이미 동일한 이름의 감정 분위기가 존재합니다.');
        return;
      }
      updatedList.push(emotionData);
    } else {
      const origName = editingEmotion.originalName;
      const index = emotions.findIndex(emo => emo.name === origName);
      if (index > -1) {
        // If name changed, check duplicate for the new name
        if (cleanName !== origName && emotions.some(emo => emo.name === cleanName)) {
          alert('이미 동일한 이름의 감정 분위기가 존재합니다.');
          return;
        }
        updatedList[index] = emotionData;

        // Cascade rename into existing works!
        if (origName && cleanName !== origName) {
          const updatedWorks = works.map(w => w.emotion === origName ? { ...w, emotion: cleanName } : w);
          setWorks(updatedWorks);
          saveWorksToStorage(updatedWorks);
        }
      } else {
        updatedList.push(emotionData);
      }
    }

    saveEmotionsToStorage(updatedList);
    setEditingEmotion(null);
    setIsCreatingNewEmotion(false);
    alert('감정 키워드가 성공적으로 저장되어 전체 탭 및 포탈에 반영되었습니다.');
  };

  const handleDeleteEmotion = (nameToDelete: string) => {
    if (emotions.length <= 1) {
      alert('최소 하나의 감정 분위기는 시스템에 남아있어야 에세이를 매핑할 수 있습니다.');
      return;
    }

    if (window.confirm(`"${nameToDelete}" 감정 분위기를 정말로 삭제하시겠습니까?\n이 감정 분위기 하에 등록되었던 기존 포트폴리오 에세이들은 자동으로 다른 감정 분위기로 이관됩니다.`)) {
      const fallbackName = emotions.find(e => e.name !== nameToDelete)?.name || '그리움';
      
      // Cascade delete / fallback existing works!
      const updatedWorks = works.map(w => w.emotion === nameToDelete ? { ...w, emotion: fallbackName } : w);
      setWorks(updatedWorks);
      saveWorksToStorage(updatedWorks);

      // Filter emotions list
      const filtered = emotions.filter(emo => emo.name !== nameToDelete);
      saveEmotionsToStorage(filtered);

      // Reset selected filter if currently selected
      if (selectedEmotion === nameToDelete) {
        setSelectedEmotion(null);
      }
      alert(`"${nameToDelete}" 감정 키워드가 삭제되었으며, 관련 에세이들은 "${fallbackName}" 분위기로 이관되었습니다.`);
    }
  };

  const handleMoveEmotionUp = (index: number) => {
    if (index === 0) return;
    const updated = [...emotions];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    saveEmotionsToStorage(updated);
  };

  const handleMoveEmotionDown = (index: number) => {
    if (index === emotions.length - 1) return;
    const updated = [...emotions];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    saveEmotionsToStorage(updated);
  };

  // --- Journal Logic ---
  const handleSaveJournal = (e: FormEvent) => {
    e.preventDefault();
    if (!editingJournal || !editingJournal.title || !editingJournal.content) {
      alert('제목과 일기 내용을 기록해주십시오.');
      return;
    }

    const cleanJournal: Journal = {
      id: editingJournal.id || `journal-${Date.now()}`,
      title: editingJournal.title || '비가 그치는 소리',
      content: editingJournal.content || '',
      date: editingJournal.date || new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      images: editingJournal.images && editingJournal.images.length > 0 ? editingJournal.images : [PHOTO_PRESETS[1].url]
    };

    let updatedList: Journal[];
    if (isCreatingNewJournal) {
      updatedList = [cleanJournal, ...journals];
    } else {
      updatedList = journals.map(j => j.id === cleanJournal.id ? cleanJournal : j);
    }

    saveJournalsToStorage(updatedList);
    setEditingJournal(null);
    setIsCreatingNewJournal(false);
    alert('저널 기록이 저장되었습니다.');
  };

  const handleDeleteJournal = (id: string) => {
    if (window.confirm('이 저널 일기를 정말로 삭제하시겠습니까?')) {
      const filtered = journals.filter(j => j.id !== id);
      saveJournalsToStorage(filtered);
    }
  };

  // --- Reorder & Arrangement Managers ---
  const handleMoveWorkUp = (index: number) => {
    if (index === 0) return;
    const updatedList = [...works];
    const temp = updatedList[index];
    updatedList[index] = updatedList[index - 1];
    updatedList[index - 1] = temp;
    saveWorksToStorage(updatedList);
  };

  const handleMoveWorkDown = (index: number) => {
    if (index === works.length - 1) return;
    const updatedList = [...works];
    const temp = updatedList[index];
    updatedList[index] = updatedList[index + 1];
    updatedList[index + 1] = temp;
    saveWorksToStorage(updatedList);
  };

  const handleMoveJournalUp = (index: number) => {
    if (index === 0) return;
    const updatedList = [...journals];
    const temp = updatedList[index];
    updatedList[index] = updatedList[index - 1];
    updatedList[index - 1] = temp;
    saveJournalsToStorage(updatedList);
  };

  const handleMoveJournalDown = (index: number) => {
    if (index === journals.length - 1) return;
    const updatedList = [...journals];
    const temp = updatedList[index];
    updatedList[index] = updatedList[index + 1];
    updatedList[index + 1] = temp;
    saveJournalsToStorage(updatedList);
  };

  // --- Navigation & Auto scroll back helper ---
  const getFirstActiveTab = (): ActiveTab => {
    if (visibleSections.works !== false) return 'WORKS';
    if (visibleSections.archive !== false) return 'ARCHIVE';
    if (visibleSections.emotions !== false) return 'EMOTIONS';
    if (visibleSections.journal !== false) return 'JOURNAL';
    if (visibleSections.about !== false) return 'ABOUT';
    const firstCustom = customTabs.find(ct => ct.visible);
    if (firstCustom) return firstCustom.id;
    return 'WORKS';
  };

  const navigateTo = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSelectedWorkId(null);
    setSelectedEmotion(null);
    setSelectedYear(null);
    setActivePhotoIndex(0);
    setShowDetailInfo(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWorkClick = (id: string) => {
    setSelectedWorkId(id);
    setActivePhotoIndex(0);
    setShowDetailInfo(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Group archive works by year
  const archiveYears = Array.from(new Set(works.map(w => w.year))).sort((a: number, b: number) => b - a);

  // Filtered archive list
  const filteredWorksByYear = selectedYear 
    ? works.filter(w => w.year === selectedYear)
    : works;

  // Selected work detail model
  const activeWorkDetail = works.find(w => w.id === selectedWorkId);

  // If before first entrance, render full screen video cover exactly as requested
  if (!hasEntered) {
    return (
      <div 
        className="relative w-full h-[100dvh] min-h-[450px] sm:min-h-[550px] md:min-h-[650px] bg-[#121212] bg-cover bg-center bg-no-repeat text-white font-serif select-none flex flex-col justify-between p-4 sm:p-8 md:p-12 z-0 overflow-hidden"
        style={{ backgroundImage: `url(${homeHeroImg})` }}
      >
        {/* Background video playing looping ambiently */}
        <div className="absolute inset-0 w-full h-full z-[-1] overflow-hidden">
          <video 
            ref={(el) => {
              (videoRef as any).current = el;
              if (el) {
                el.setAttribute('muted', 'true');
                el.setAttribute('playsinline', 'true');
                el.muted = true;
                el.playsInline = true;
                el.play().catch(() => {});
              }
            }}
            key={videoUrl}
            src={getPlayableVideoUrl(videoUrl)}
            poster={homeHeroImg}
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover opacity-80"
          />
          {/* Subtle vignette/shading mask to mimic photographic depth and secure text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/65"></div>
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Header on top of cover */}
        <div className="w-full flex flex-row justify-between items-center z-10">
          {/* Logo on Left */}
          <div>
            <h1 className="text-lg md:text-2xl font-light tracking-widest text-white/95 uppercase drop-shadow-sm font-serif">
              MACOLORIS BLUE
            </h1>
            <p className="text-[9px] tracking-[0.35em] text-white/50 uppercase mt-1 font-mono">
              Nihon no Ao Record
            </p>
          </div>

          {/* Navigation Links on Right (Desktop Only) */}
          <div className="hidden md:flex items-center gap-x-4 md:gap-x-5 text-[9px] sm:text-[10px] font-sans text-white/70 tracking-[0.15em]">
            {visibleSections.works !== false && (
              <button 
                onClick={() => { setHasEntered(true); navigateTo('WORKS'); }}
                className="hover:text-white transition-colors cursor-pointer border-b border-transparent hover:border-white/50 pb-0.5"
              >
                Works
              </button>
            )}
            {visibleSections.archive !== false && (
              <button 
                onClick={() => { setHasEntered(true); navigateTo('ARCHIVE'); }}
                className="hover:text-white transition-colors cursor-pointer border-b border-transparent hover:border-white/50 pb-0.5"
              >
                Archive
              </button>
            )}
            {visibleSections.emotions !== false && (
              <button 
                onClick={() => { setHasEntered(true); navigateTo('EMOTIONS'); }}
                className="hover:text-white transition-colors cursor-pointer border-b border-transparent hover:border-white/50 pb-0.5"
              >
                Emotions
              </button>
            )}
            {visibleSections.journal !== false && (
              <button 
                onClick={() => { setHasEntered(true); navigateTo('JOURNAL'); }}
                className="hover:text-white transition-colors cursor-pointer border-b border-transparent hover:border-white/50 pb-0.5"
              >
                Journal
              </button>
            )}
            {visibleSections.about !== false && (
              <button 
                onClick={() => { setHasEntered(true); navigateTo('ABOUT'); }}
                className="hover:text-white transition-colors cursor-pointer border-b border-transparent hover:border-white/50 pb-0.5"
              >
                About
              </button>
            )}

            {customTabs.filter(ct => ct.visible).map(ct => (
              <button 
                key={ct.id}
                onClick={() => { setHasEntered(true); navigateTo(ct.id); }}
                className="hover:text-white transition-colors cursor-pointer border-b border-transparent hover:border-white/50 pb-0.5 capitalize"
              >
                {ct.name}
              </button>
            ))}

            {isAdmin && (
              <button 
                onClick={() => { setHasEntered(true); navigateTo('ADMIN'); }}
                className="hover:text-white transition-colors cursor-pointer ml-3 font-semibold text-[#4A6FA5]"
              >
                CONSOLE
              </button>
            )}
          </div>

          {/* Navigation Toggle - Mobile Only */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setCoverMobileMenuOpen(!coverMobileMenuOpen)}
              className="text-white/90 font-semibold text-xs tracking-widest uppercase hover:text-[#4A6FA5] transition-colors select-none focus:outline-none cursor-pointer"
            >
              {coverMobileMenuOpen ? 'Close —' : 'Menu —'}
            </button>
          </div>
        </div>

        {/* Middle part - spacer & Cover Mobile Menu Dropdown overlay */}
        <div className="flex-1 flex items-center justify-center relative my-4">
          {coverMobileMenuOpen && (
            <div className="fixed inset-0 z-[100] bg-[#121212]/98 backdrop-blur-md flex flex-col justify-between p-6 sm:p-10 text-left animate-fade-in font-sans">
              {/* Header inside full screen mobile menu */}
              <div className="flex justify-between items-center w-full">
                <div>
                  <h1 className="text-lg font-light tracking-widest text-white/95 uppercase font-serif">
                    MACOLORIS BLUE
                  </h1>
                  <p className="text-[8px] tracking-[0.35em] text-white/50 uppercase mt-1 font-mono">
                    Nihon no Ao Record
                  </p>
                </div>
                <button 
                  onClick={() => setCoverMobileMenuOpen(false)}
                  className="text-white hover:text-red-400 font-mono text-[11px] tracking-widest uppercase cursor-pointer"
                >
                  Close ×
                </button>
              </div>

              {/* Menu Links with scrolling inside if too many custom tabs */}
              <div className="flex-1 flex items-center justify-center my-6 overflow-y-auto max-h-[70vh] w-full">
                <div className="flex flex-col gap-4 font-sans text-xs sm:text-sm tracking-[0.2em] uppercase font-light text-white/90 w-full max-w-xs mx-auto">
                  {visibleSections.works !== false && (
                    <button 
                      onClick={() => { setCoverMobileMenuOpen(false); setHasEntered(true); navigateTo('WORKS'); }} 
                      className="py-2.5 text-center border-b border-white/[0.05] hover:text-[#4A6FA5] transition-colors w-full cursor-pointer"
                    >
                      Works
                    </button>
                  )}
                  {visibleSections.archive !== false && (
                    <button 
                      onClick={() => { setCoverMobileMenuOpen(false); setHasEntered(true); navigateTo('ARCHIVE'); }} 
                      className="py-2.5 text-center border-b border-white/[0.05] hover:text-[#4A6FA5] transition-colors w-full cursor-pointer"
                    >
                      Archive
                    </button>
                  )}
                  {visibleSections.emotions !== false && (
                    <button 
                      onClick={() => { setCoverMobileMenuOpen(false); setHasEntered(true); navigateTo('EMOTIONS'); }} 
                      className="py-2.5 text-center border-b border-white/[0.05] italic flex items-center justify-center gap-1 hover:text-[#4A6FA5] transition-colors w-full cursor-pointer"
                    >
                      Emotions <span className="text-[6.5px] text-[#4A6FA5]">●</span>
                    </button>
                  )}
                  {visibleSections.journal !== false && (
                    <button 
                      onClick={() => { setCoverMobileMenuOpen(false); setHasEntered(true); navigateTo('JOURNAL'); }} 
                      className="py-2.5 text-center border-b border-white/[0.05] hover:text-[#4A6FA5] transition-colors w-full cursor-pointer"
                    >
                      Journal
                    </button>
                  )}
                  {visibleSections.about !== false && (
                    <button 
                      onClick={() => { setCoverMobileMenuOpen(false); setHasEntered(true); navigateTo('ABOUT'); }} 
                      className="py-2.5 text-center border-b border-white/[0.05] hover:text-[#4A6FA5] transition-colors w-full cursor-pointer"
                    >
                      About
                    </button>
                  )}

                  {customTabs.filter(ct => ct.visible).map(ct => (
                    <button 
                      key={ct.id}
                      onClick={() => { setCoverMobileMenuOpen(false); setHasEntered(true); navigateTo(ct.id); }} 
                      className="py-2.5 text-center border-b border-[#ffffff]/0.05 hover:text-[#4A6FA5] transition-colors w-full cursor-pointer"
                    >
                      {ct.name}
                    </button>
                  ))}

                  {isAdmin && (
                    <button 
                      onClick={() => { setCoverMobileMenuOpen(false); setHasEntered(true); navigateTo('ADMIN'); }} 
                      className="py-2.5 text-center text-[#4A6FA5] font-semibold border-b border-white/[0.05] w-full cursor-pointer"
                    >
                      CONSOLE (ADMIN)
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom footer */}
              <div className="w-full text-center">
                <span className="font-mono text-[8px] tracking-[0.2em] text-white/30 uppercase">
                  Nihon no Ao Record
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom portion - side-by-side on desktop, single column bottom on mobile */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-end gap-6 z-10">
          
          {/* Bottom Left: Photographic index column from work entries */}
          {visibleSections.works !== false ? (
            <div className="max-w-md hidden sm:flex flex-col gap-2 animate-fade-in text-left">
              <span className="font-mono text-[9px] tracking-[0.4em] text-white/45 uppercase block mb-1">
                LATEST ENTRIES INDEX
              </span>
              <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-3 font-mono text-[10.5px] text-white/50 scrollbar-none">
                {works.slice(0, 10).map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setHasEntered(true);
                      navigateTo('WORKS');
                      setSelectedWorkId(w.id);
                    }}
                    className="text-left hover:text-white hover:translate-x-1 transition-all duration-300 truncate focus:outline-none cursor-pointer"
                  >
                    {w.title}, {w.location}, {w.year}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="hidden sm:block" />
          )}

          {/* Bottom Right: Clean Entry Action */}
          <div className="w-full sm:w-auto flex flex-col sm:items-end gap-2 text-center sm:text-right">
            <button 
              onClick={() => { setHasEntered(true); navigateTo(getFirstActiveTab()); }}
              className="group w-full sm:w-auto flex items-center justify-center gap-2 border border-white/30 hover:border-white/60 bg-black/35 hover:bg-black/55 backdrop-blur-xs px-5 py-2.5 rounded-[2px] text-[10.5px] font-mono tracking-widest text-white transition-all cursor-pointer"
            >
              Enter Gallery
            </button>
            <span className="font-mono text-[8.5px] tracking-[0.2em] text-white/20 uppercase">
              Nihon no Ao Record
            </span>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6F2] text-[#222222] font-serif selection:bg-[#4A6FA5] selection:text-white">
      
      {/* Top sticky/fixed minimalist header */}
      {!selectedWorkId && (
        <header className="w-full sticky top-0 z-40 bg-[#F7F6F2]/95 backdrop-blur-md border-b border-gray-200/80">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 md:py-5 flex flex-row justify-between items-center gap-4">
          
          {/* Logo on Left - sets hasEntered back to false to show the majestic home intro screen if enabled */}
          <div>
            <button 
              onClick={() => {
                if (visibleSections.introVideo !== false) {
                  setHasEntered(false);
                }
              }} 
              disabled={visibleSections.introVideo === false}
              className="text-left group cursor-pointer block disabled:cursor-default"
              title={visibleSections.introVideo !== false ? "홈화면 인트로 무비로 돌아가기" : "홈화면 (인트로 비활성화됨)"}
            >
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl tracking-tighter font-light text-[#222222] transition-colors group-hover:text-[#4A6FA5] group-disabled:hover:text-[#222222]">
                  MACOLORIS BLUE
                </h1>
                {isAdmin && (
                  <span className="inline-flex bg-[#4A6FA5] text-white font-mono text-[8px] px-1.5 py-0.5 rounded tracking-wider items-center gap-1 animate-pulse">
                    <Unlock size={8} /> ADMIN
                  </span>
                )}
              </div>
              <p className="text-[10px] tracking-[0.2em] text-gray-400 uppercase mt-0.5 group-hover:text-[#4A6FA5]/80 transition-colors font-mono group-disabled:hover:text-gray-400">
                Nihon no Ao Record
              </p>
            </button>
          </div>

          {/* Navigation Menu on Right (Desktop Only) */}
          <div className="hidden md:flex items-center gap-x-4 sm:gap-x-5 gap-y-1.5 flex-wrap text-[9px] sm:text-[10px] font-sans tracking-[0.16em] justify-center sm:justify-end font-normal">
            {visibleSections.works !== false && (
              <button 
                onClick={() => navigateTo('WORKS')} 
                className={`cursor-pointer hover:text-[#4A6FA5] transition-colors ${activeTab === 'WORKS' && !selectedWorkId ? 'text-[#4A6FA5] font-semibold' : 'text-[#222222]/70'}`}
              >
                Works
              </button>
            )}
            {visibleSections.archive !== false && (
              <button 
                onClick={() => navigateTo('ARCHIVE')} 
                className={`cursor-pointer hover:text-[#4A6FA5] transition-colors ${activeTab === 'ARCHIVE' ? 'text-[#4A6FA5] font-semibold' : 'text-[#222222]/70'}`}
              >
                Archive
              </button>
            )}
            {visibleSections.emotions !== false && (
              <button 
                onClick={() => navigateTo('EMOTIONS')} 
                className={`cursor-pointer italic text-[9px] sm:text-[10px] hover:text-[#4A6FA5] transition-colors py-0.5 flex items-center gap-0.5 ${activeTab === 'EMOTIONS' ? 'text-[#4A6FA5] font-semibold' : 'text-[#222222]/70'}`}
              >
                Emotions <span className="text-[6.5px] text-[#4A6FA5] ml-0.5">●</span>
              </button>
            )}
            {visibleSections.journal !== false && (
              <button 
                onClick={() => navigateTo('JOURNAL')} 
                className={`cursor-pointer hover:text-[#4A6FA5] transition-colors ${activeTab === 'JOURNAL' ? 'text-[#4A6FA5] font-semibold' : 'text-[#222222]/70'}`}
              >
                Journal
              </button>
            )}
            {visibleSections.about !== false && (
              <button 
                onClick={() => navigateTo('ABOUT')} 
                className={`cursor-pointer hover:text-[#4A6FA5] transition-colors ${activeTab === 'ABOUT' ? 'text-[#4A6FA5] font-semibold' : 'text-[#222222]/70'}`}
              >
                About
              </button>
            )}

            {customTabs.filter(ct => ct.visible).map(ct => (
              <button 
                key={ct.id}
                onClick={() => navigateTo(ct.id)} 
                className={`cursor-pointer hover:text-[#4A6FA5] transition-colors ${activeTab === ct.id ? 'text-[#4A6FA5] font-semibold font-bold' : 'text-[#222222]/70'}`}
              >
                {ct.name}
              </button>
            ))}
            
            {isAdmin && (
              <div className="flex items-center gap-3 border-l border-gray-300/60 pl-3 ml-2">
                <button 
                  onClick={() => navigateTo('ADMIN')} 
                  className={`text-[#4A6FA5] font-bold uppercase hover:underline transition-all ${activeTab === 'ADMIN' ? 'underline' : ''}`}
                >
                  CONSOLE
                </button>
                <button 
                  onClick={handleAdminLogout} 
                  className="text-stone-400 hover:text-red-500 font-bold uppercase transition-colors"
                  title="LOGOUT"
                >
                  LOGOUT
                </button>
              </div>
            )}
          </div>

          {/* Navigation Toggle - Mobile Only */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#222222] font-semibold text-xs tracking-widest uppercase hover:text-[#4A6FA5] transition-colors select-none focus:outline-none cursor-pointer"
            >
              {mobileMenuOpen ? 'Close —' : 'Menu —'}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Dropdown Menu Sheet */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#F7F6F2] border-t border-gray-200/50 animate-fade-in w-full shadow-xs">
            <div className="px-6 py-5 flex flex-col gap-4 font-sans text-[11px] sm:text-xs tracking-[0.16em] uppercase text-left font-normal border-b border-gray-200">
              {visibleSections.works !== false && (
                <button 
                  onClick={() => { navigateTo('WORKS'); setMobileMenuOpen(false); }} 
                  className={`py-1 text-left ${activeTab === 'WORKS' && !selectedWorkId ? 'text-[#4A6FA5] font-bold' : 'text-[#222222]/70'}`}
                >
                  Works
                </button>
              )}
              {visibleSections.archive !== false && (
                <button 
                  onClick={() => { navigateTo('ARCHIVE'); setMobileMenuOpen(false); }} 
                  className={`py-1 text-left ${activeTab === 'ARCHIVE' ? 'text-[#4A6FA5] font-bold' : 'text-[#222222]/70'}`}
                >
                  Archive
                </button>
              )}
              {visibleSections.emotions !== false && (
                <button 
                  onClick={() => { navigateTo('EMOTIONS'); setMobileMenuOpen(false); }} 
                  className={`py-1 text-left italic flex items-center gap-1 ${activeTab === 'EMOTIONS' ? 'text-[#4A6FA5] font-bold' : 'text-[#222222]/70'}`}
                >
                  Emotions <span className="text-[6.5px] text-[#4A6FA5]">●</span>
                </button>
              )}
              {visibleSections.journal !== false && (
                <button 
                  onClick={() => { navigateTo('JOURNAL'); setMobileMenuOpen(false); }} 
                  className={`py-1 text-left ${activeTab === 'JOURNAL' ? 'text-[#4A6FA5] font-bold' : 'text-[#222222]/70'}`}
                >
                  Journal
                </button>
              )}
              {visibleSections.about !== false && (
                <button 
                  onClick={() => { navigateTo('ABOUT'); setMobileMenuOpen(false); }} 
                  className={`py-1 text-left ${activeTab === 'ABOUT' ? 'text-[#4A6FA5] font-bold' : 'text-[#222222]/70'}`}
                >
                  About
                </button>
              )}

              {customTabs.filter(ct => ct.visible).map(ct => (
                <button 
                  key={ct.id}
                  onClick={() => { navigateTo(ct.id); setMobileMenuOpen(false); }} 
                  className={`py-1 text-left ${activeTab === ct.id ? 'text-[#4A6FA5] font-bold' : 'text-[#222222]/70'}`}
                >
                  {ct.name}
                </button>
              ))}
              
              {isAdmin && (
                <div className="flex flex-col gap-3 border-t border-gray-200/60 pt-4 mt-2">
                  <button 
                    onClick={() => { navigateTo('ADMIN'); setMobileMenuOpen(false); }} 
                    className="text-[#4A6FA5] font-bold hover:underline py-1 text-left text-[11px]"
                  >
                    CONSOLE (ADMIN)
                  </button>
                  <button 
                    onClick={() => { handleAdminLogout(); setMobileMenuOpen(false); }} 
                    className="text-stone-400 font-bold hover:text-red-500 py-1 text-left text-[11px]"
                  >
                    LOGOUT
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      )}

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col w-full overflow-x-hidden">
        
        {/* Admin Quick Entry Dropdown */}
        {showAdminEntry && !isAdmin && (
          <div className="bg-[#F2F1EC] border-b border-[#222222]/10 py-5 px-6 animate-fade-in flex flex-col items-center justify-center">
            <form onSubmit={handleAdminVerify} className="max-w-xs w-full flex flex-col gap-2">
              <label className="text-[11px] font-mono tracking-widest text-[#222222]/60 text-center uppercase block mb-1">
                Admin Key Verification
              </label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  placeholder="Enter Passcode" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="bg-white border border-[#222222]/20 px-3 py-1.5 text-xs text-[#222222] tracking-widest focus:outline-none focus:border-[#4A6FA5] w-full text-center font-mono rounded"
                  autoFocus
                />
                <button 
                  type="submit" 
                  className="bg-[#4A6FA5] text-white text-xs px-4 py-1.5 tracking-wider hover:bg-[#3d5e8c] transition-colors font-mono rounded cursor-pointer"
                >
                  Enter
                </button>
              </div>
              {adminError && <p className="text-red-500 text-[10px] text-center font-mono mt-1">{adminError}</p>}
            </form>
          </div>
        )}

      {/* --- Main Contents Container --- */}
      <div className="flex-grow">

        {/* ========================================================= */}
        {/* TAB 2: WORKS LIST (Grid Style like Hideaki Hamada)       */}
        {/* ========================================================= */}
        {activeTab === 'WORKS' && !selectedWorkId && (
          <div className="fade-in px-6 md:px-12 py-8 md:py-14 w-full max-w-[100rem] mx-auto">
            {/* Minimalist Section Header like Hideaki Hamada */}
            <div className="flex justify-between items-baseline mb-6 md:mb-8 border-b border-black/[0.05] pb-4">
              <h2 className="text-lg md:text-xl font-serif font-light tracking-widest text-[#222222] uppercase">
                WORKS (2012-2026)
              </h2>
              <div className="font-mono text-[9.5px] sm:text-[10px] tracking-widest text-stone-400 select-none">
                <span className="text-[#4A6FA5] font-semibold">Grid</span> &mdash; List
              </div>
            </div>

            {/* State Portals Section: Beautifully formatted as double columns on mobile, side-by-side on desktop */}
            <div className="mb-8 select-none">
              <span className="block font-mono text-[9px] sm:text-[10px] tracking-widest text-[#222222]/40 uppercase mb-3.5 font-bold">State Portals:</span>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-6 gap-y-3 text-[11.5px] sm:text-[10.5px] font-mono tracking-wider text-[#222222]">
                <button 
                  onClick={() => setSelectedEmotion(null)}
                  className={`hover:text-[#4A6FA5] transition-colors cursor-pointer flex items-center gap-1.5 text-left ${!selectedEmotion ? 'text-[#4A6FA5] font-bold' : 'text-[#222222]/60'}`}
                >
                  <span className="text-[12px] font-sans h-3 flex items-center font-bold">{!selectedEmotion ? '—' : '·'}</span>
                  <span>All ({works.length})</span>
                </button>
                {emotions.map(e => e.name).map((emo) => {
                  const count = works.filter(w => w.emotion === emo).length;
                  const isActive = selectedEmotion === emo;
                  return (
                    <button 
                      key={emo}
                      onClick={() => setSelectedEmotion(emo)}
                      className={`hover:text-[#4A6FA5] transition-colors cursor-pointer flex items-center gap-1.5 text-left ${isActive ? 'text-[#4A6FA5] font-bold' : 'text-[#222222]/60'}`}
                    >
                      <span className="text-[12px] font-sans h-3 flex items-center font-bold">{isActive ? '—' : '·'}</span>
                      <span>{emo} ({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Photography Contact sheets grid - fully optimized mobile grid cols 2 to large sizes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-1.5 md:gap-[4px]">
              {(() => {
                const displayedWorks = selectedEmotion 
                  ? works.filter(w => w.emotion === selectedEmotion)
                  : works;

                return displayedWorks.map((work, index) => {
                  const bgColors = ['bg-[#E8E7E2]', 'bg-[#DFDFD9]', 'bg-[#E5E4DE]', 'bg-[#E0E2E5]', 'bg-[#E8E8E3]', 'bg-[#D6D8D9]'];
                  const cardBg = bgColors[index % bgColors.length];
                  
                  return (
                    <div 
                      key={work.id}
                      onClick={() => handleWorkClick(work.id)}
                      className="group cursor-pointer flex flex-col transition-all duration-300 transform hover:-translate-y-0.5 animate-fadeIn"
                    >
                      {/* Photo wrapper: vertical elegant portraits on mobile, standards on desktop */}
                      <div className={`aspect-[3/4] sm:aspect-[3/2] ${cardBg} mb-1 relative overflow-hidden rounded-[1.5px] border border-black/[0.015] shadow-3xs transition-all duration-500`}>
                        {isVideoUrl(work.images[0] || '') ? (
                          <video 
                            key={work.images[0]}
                            ref={(el) => {
                              if (el) {
                                el.setAttribute('muted', 'true');
                                el.setAttribute('playsinline', 'true');
                                el.muted = true;
                                el.playsInline = true;
                                el.play().catch(() => {});
                              }
                            }}
                            src={getPlayableVideoUrl(work.images[0])} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            className="w-full h-full object-cover transition-transform duration-[1250ms] ease-out group-hover:scale-105"
                          />
                        ) : (
                          <img 
                            src={work.images[0] || PHOTO_PRESETS[0].url} 
                            alt={work.title} 
                            className="w-full h-full object-cover transition-transform duration-[1250ms] ease-out group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="absolute inset-0 bg-[#4A6FA5]/3 opacity-100 group-hover:opacity-0 transition-opacity duration-300"></div>
                        <div className="absolute bottom-1.5 left-1.5 text-white text-[7px] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity font-mono bg-[#4A6FA5]/95 px-1.5 py-0.5 backdrop-blur-3xs rounded-[1px]">
                          VIEW
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {works.filter(w => !selectedEmotion || w.emotion === selectedEmotion).length === 0 && (
              <div className="text-center py-20 text-[#222222]/40 font-serif-ja text-sm bg-[#E8E7E2]/10 border border-dashed border-[#222222]/20 rounded">
                등록된 포트폴리오 기사가 없습니다. 관리자 메뉴에서 새로운 기록을 등록해주세요.
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB TAB: PROJECT DETAIL VIEW                               */}
        {/* ========================================================= */}
        {selectedWorkId && activeWorkDetail && (
          <div className="fade-in px-6 md:px-12 py-6 w-full max-w-6xl mx-auto font-serif flex flex-col justify-between min-h-[82vh]">
            
            {/* Top Navigation Row matching Hideaki Hamada style */}
            <div className="flex justify-between items-center text-[10.5px] md:text-[11.5px] font-mono tracking-[0.2em] uppercase border-b border-black/[0.04] pb-5 select-none">
              <button 
                onClick={() => {
                  setSelectedWorkId(null);
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }}
                className="hover:text-[#4A6FA5] font-semibold transition-colors cursor-pointer"
              >
                Index
              </button>
              
              <div className="flex gap-6 items-center">
                <button 
                  onClick={() => {
                    setActivePhotoIndex((prev) => 
                      prev > 0 ? prev - 1 : activeWorkDetail.images.length - 1
                    );
                  }}
                  className="hover:text-[#4A6FA5] transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button 
                  onClick={() => {
                    setActivePhotoIndex((prev) => 
                      (prev + 1) % activeWorkDetail.images.length
                    );
                  }}
                  className="hover:text-[#4A6FA5] transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Immersive Center Photograph Area */}
            <div className="flex-grow flex items-center justify-center py-10 md:py-14 select-none">
              <div 
                onClick={() => {
                  setActivePhotoIndex((prev) => (prev + 1) % activeWorkDetail.images.length);
                }}
                className="cursor-pointer max-w-full max-h-[66vh] overflow-hidden bg-[#E8E7E2]/15 border border-black/[0.015] rounded-[1.5px] transition-all duration-300 transform hover:brightness-102"
              >
                {isVideoUrl(activeWorkDetail.images[activePhotoIndex] || '') ? (
                  <video 
                    key={activeWorkDetail.images[activePhotoIndex]}
                    ref={(el) => {
                      if (el) {
                        el.setAttribute('muted', 'true');
                        el.setAttribute('playsinline', 'true');
                        el.muted = true;
                        el.playsInline = true;
                        el.play().catch(() => {});
                      }
                    }}
                    src={getPlayableVideoUrl(activeWorkDetail.images[activePhotoIndex])} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="max-h-[64vh] max-w-full w-auto object-contain mx-auto shadow-2xs"
                  />
                ) : (
                  <img 
                    src={activeWorkDetail.images[activePhotoIndex] || PHOTO_PRESETS[0].url} 
                    alt={`${activeWorkDetail.title} - ${activePhotoIndex + 1}`} 
                    className="max-h-[64vh] max-w-full w-auto object-contain mx-auto shadow-2xs"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            </div>

            {/* Bottom Meta & Description Row */}
            <div className="flex flex-col md:flex-row justify-between items-baseline md:items-end gap-6 border-t border-black/[0.04] pt-5">
              {/* Left Column: Title & Toggle */}
              <div className="flex flex-col text-left max-w-2xl">
                <h4 className="text-sm md:text-base font-medium font-serif text-[#222222] tracking-wide leading-none">
                  {activeWorkDetail.title.split('(')[0].trim()}, {activeWorkDetail.year}
                </h4>
                
                {/* Clickable details toggle */}
                <button 
                  onClick={() => setShowDetailInfo(!showDetailInfo)}
                  className="text-[10px] md:text-[10.5px] font-mono tracking-wider text-stone-400 hover:text-[#4A6FA5] transition-all mt-2.5 text-left underline select-none cursor-pointer focus:outline-none"
                >
                  {showDetailInfo ? 'details -' : 'detail +'}
                </button>

                {/* Expanded Memoir & Story details */}
                {showDetailInfo && (
                  <div className="mt-4 max-w-2xl text-[12px] md:text-[13px] text-[#222222]/85 leading-relaxed font-serif animate-fade-in border-t border-black/[0.04] pt-4">
                    <div className="flex gap-2 items-center text-[8.5px] font-mono tracking-widest text-[#4A6FA5] uppercase mb-2 font-bold select-text">
                      <span>{activeWorkDetail.location} / {activeWorkDetail.date}</span>
                      <span>&middot;</span>
                      <span>심상 감정: {activeWorkDetail.emotion}</span>
                    </div>
                    <p className="whitespace-pre-line text-left leading-loose text-stone-800 select-text">
                      {activeWorkDetail.preface}
                    </p>
                    {activeWorkDetail.closing && (
                      <p className="italic text-stone-400 font-serif border-l-2 border-[#4A6FA5]/25 pl-4 mt-4 leading-relaxed text-[11px] md:text-[12px] select-text">
                        "{activeWorkDetail.closing}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Frame position indicator like "1 / 41" */}
              <div className="text-stone-500 font-mono text-[11.5px] md:text-xs tracking-wider select-none self-end pr-1 pt-2">
                {activePhotoIndex + 1} / {activeWorkDetail.images.length}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ARCHIVE CHRONOLOGY INDEX                          */}
        {/* ========================================================= */}
        {activeTab === 'ARCHIVE' && !selectedWorkId && (
          <div className="fade-in px-6 md:px-12 lg:px-20 py-12 md:py-16 w-full max-w-7xl mx-auto">
            
            {/* Header Context aligned with design HTML */}
            <header className="mb-12 flex flex-col md:flex-row justify-between items-baseline md:items-end border-b border-gray-200 pb-6 gap-2">
              <div>
                <h2 className="text-3xl font-light tracking-tight italic text-[#222222]">ARCHIVE INDEX</h2>
                <p className="text-[10px] uppercase tracking-widest text-[#4A6FA5] mt-1 font-mono font-semibold">Classified Moments of Solitude &amp; Nostalgia</p>
              </div>
              <div className="flex gap-4 text-[10px] uppercase tracking-widest opacity-60 font-mono text-right">
                <span>YEARS INDEX</span>
              </div>
            </header>

            {/* Year filter selector styled Warm Organic */}
            <div className="flex justify-center items-center gap-3 md:gap-6 flex-wrap mb-12 border-b border-gray-200 pb-8">
              <button
                onClick={() => setSelectedYear(null)}
                className={`px-4 py-1.5 font-mono text-[11px] tracking-widest transition-all uppercase rounded border ${selectedYear === null ? 'bg-[#4A6FA5] text-white border-[#4A6FA5]' : 'bg-transparent text-[#222222]/60 border-transparent hover:text-[#4A6FA5] hover:border-gray-200'}`}
              >
                ALL YEARS
              </button>
              {archiveYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-1.5 font-mono text-[11px] tracking-widest transition-all rounded border ${selectedYear === year ? 'bg-[#4A6FA5] text-white border-[#4A6FA5]' : 'bg-[#E8E7E2]/40 text-[#222222]/70 border-gray-200 hover:text-[#4A6FA5] hover:border-[#4A6FA5]'}`}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* Chronological List of Cards */}
            <div className="max-w-4xl mx-auto flex flex-col gap-10">
              {filteredWorksByYear.map((work, index) => {
                const bgColors = ['bg-[#E8E7E2]', 'bg-[#DFDFD9]', 'bg-[#E5E4DE]', 'bg-[#E0E2E5]'];
                const itemBg = bgColors[index % bgColors.length];
                
                return (
                  <div 
                    key={work.id}
                    onClick={() => handleWorkClick(work.id)}
                    className="group cursor-pointer flex flex-col md:flex-row gap-6 md:gap-10 border-b border-gray-200 pb-8 items-center transition-all hover:bg-[#E8E7E2]/10 p-4 rounded"
                  >
                    {/* Thumbnail Side styled like the Design HTML slots */}
                    <div className={`w-full md:w-1/3 aspect-[4/3] md:aspect-[3/2] ${itemBg} overflow-hidden rounded relative border border-black/[0.02]`}>
                      {isVideoUrl(work.images[0] || '') ? (
                        <video 
                          key={work.images[0]}
                          ref={(el) => {
                            if (el) {
                              el.setAttribute('muted', 'true');
                              el.setAttribute('playsinline', 'true');
                              el.muted = true;
                              el.playsInline = true;
                              el.play().catch(() => {});
                            }
                          }}
                          src={getPlayableVideoUrl(work.images[0])} 
                          autoPlay 
                          loop 
                          muted 
                          playsInline 
                          className="w-full h-full object-cover transition-transform duration-750 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <img 
                          src={work.images[0] || PHOTO_PRESETS[0].url} 
                          alt={work.title} 
                          className="w-full h-full object-cover transition-transform duration-750 ease-out group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="absolute inset-0 bg-[#4A6FA5]/5 group-hover:opacity-0 transition-opacity"></div>
                    </div>
                    
                    {/* Text Side with beautiful editorial spacing */}
                    <div className="w-full md:w-2/3 flex flex-col justify-center">
                      <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                        <span className="font-mono text-xs tracking-widest text-[#4A6FA5] font-semibold uppercase">
                          {work.location} / {work.date}
                        </span>
                        <span className="font-mono text-[9px] text-[#222222]/50 border border-gray-200 px-2 py-0.5 rounded uppercase tracking-wider">
                          {work.emotion}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-bold text-[#222222] group-hover:text-[#4A6FA5] transition-colors font-serif mb-3">
                        {work.title}
                      </h4>
                      <p className="font-serif-ja text-[12px] text-[#222222]/75 leading-relaxed line-clamp-2">
                        {work.preface}
                      </p>
                      
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wider text-[#4A6FA5] font-bold uppercase mt-4">
                        VIEW MEMORY <ChevronRight size={10} />
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>

            {filteredWorksByYear.length === 0 && (
              <div className="text-center py-20 text-[#222222]/50 font-serif-ja text-xs bg-white/25 border border-dashed border-gray-200 rounded">
                해당 연도에 기록된 아카이브 에세이가 아직 존재하지 않습니다.
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: EMOTIONS PORTAL (Your distinct differentiator)     */}
        {/* ========================================================= */}
        {activeTab === 'EMOTIONS' && !selectedWorkId && (
          <div className="fade-in px-6 md:px-12 lg:px-20 py-12 md:py-16 w-full max-w-7xl mx-auto">
            
            {/* Header Context aligned with design HTML */}
            <header className="mb-12 flex flex-col md:flex-row justify-between items-baseline md:items-end border-b border-gray-200 pb-6 gap-2">
              <div>
                <h2 className="text-3xl font-light tracking-tight italic text-[#222222]">EMOTIONS PORTAL</h2>
                <p className="text-[10px] uppercase tracking-widest text-[#4A6FA5] mt-1 font-mono font-semibold">Navigating Memories Through Sentiments Instead of Places</p>
              </div>
              <div className="flex gap-4 text-[10px] uppercase tracking-widest opacity-60 font-mono text-right">
                <span>PORTAL CHANNELS</span>
              </div>
            </header>

            {/* If no emotion is selected, show general category list */}
            {!selectedEmotion ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-5xl mx-auto">
                {emotions.map((emoObj, index) => {
                  const colors = ['bg-[#E8E7E2]/50 hover:bg-[#E8E7E2]/70', 'bg-[#DFDFD9]/50 hover:bg-[#DFDFD9]/70', 'bg-[#E5E4DE]/50 hover:bg-[#E5E4DE]/70', 'bg-[#E0E2E5]/50 hover:bg-[#E0E2E5]/70', 'bg-[#E8E8E3]/50 hover:bg-[#E8E8E3]/70', 'bg-[#D6D8D9]/50 hover:bg-[#D6D8D9]/70'];
                  const colorClass = colors[index % colors.length];
                  return (
                    <div 
                      key={emoObj.name}
                      onClick={() => { setSelectedEmotion(emoObj.name); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`group cursor-pointer border border-gray-200 p-8 rounded shadow-xs relative overflow-hidden transition-all duration-500 hover:shadow-md hover:border-[#4A6FA5]/45 ${colorClass}`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#4A6FA5]/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700"></div>
                      
                      <span className="font-mono text-[10px] tracking-widest text-[#4A6FA5] uppercase font-semibold">EMOTION {String(index + 1).padStart(2, '0')}</span>
                      <h4 className="font-serif text-xl tracking-widest text-[#222222] font-bold uppercase mt-2 mb-4">
                        {emoObj.name} <span className="font-serif text-xs text-[#222222]/60 font-light italic ml-2">{emoObj.english}</span>
                      </h4>
                      <p className="font-serif-ja text-[12px] text-[#222222]/60 leading-relaxed mb-6 font-medium">
                        {emoObj.description}
                      </p>
                      
                      <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-[#4A6FA5] font-bold uppercase">
                        <span>EXPLORE PORTAL</span>
                        <ChevronRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Emotion Specific Gallery View styled with layout matching design HTML
              <div className="fade-in max-w-5xl mx-auto bg-[#E8E7E2]/10 p-6 md:p-10 rounded border border-gray-250">
                {/* Back button */}
                <button 
                  onClick={() => setSelectedEmotion(null)}
                  className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#222222]/50 hover:text-[#4A6FA5] mb-8 cursor-pointer"
                >
                  <ArrowLeft size={12} /> BACK TO EMOTIONS CHANNELS
                </button>

                {/* Sentiment Header */}
                <div className="mb-10 border-b border-gray-200 pb-6">
                  <span className="font-mono text-[10px] tracking-widest text-[#4A6FA5] font-bold uppercase">FILTERED MEMORIES</span>
                  <h4 className="font-serif text-2xl tracking-wider text-[#222222] font-semibold mt-1">
                    JOURNAL STATE: <span className="text-[#4A6FA5] uppercase">{selectedEmotion}</span>
                  </h4>
                  <p className="text-xs text-[#222222]/60 mt-2 font-serif-ja leading-relaxed italic">
                    {(() => {
                      const found = emotions.find(e => e.name === selectedEmotion);
                      return found ? `"${found.detail}"` : '"스쳐 간 기억의 결들."';
                    })()}
                  </p>
                </div>

                 {/* Filter and group photos matching this exact emotion across ALL works */}
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                   {works
                     .filter(w => w.emotion === selectedEmotion)
                     .map((matchingWork, index) => {
                        const bgColors = ['bg-[#E8E7E2]', 'bg-[#DFDFD9]', 'bg-[#E5E4DE]'];
                        const cardBg = bgColors[index % bgColors.length];
                        return (
                          <div 
                            key={matchingWork.id}
                            onClick={() => handleWorkClick(matchingWork.id)}
                            className="group cursor-pointer flex flex-col transition-all duration-300 transform hover:-translate-y-0.5"
                          >
                            <div className={`aspect-[3/2] ${cardBg} mb-2 relative overflow-hidden rounded-[2px] border border-black/[0.02] shadow-2xs hover:shadow-xs transition-all duration-500`}>
                              {isVideoUrl(matchingWork.images[0] || '') ? (
                                <video 
                                  key={matchingWork.images[0]}
                                  ref={(el) => {
                                    if (el) {
                                      el.setAttribute('muted', 'true');
                                      el.setAttribute('playsinline', 'true');
                                      el.muted = true;
                                      el.playsInline = true;
                                      el.play().catch(() => {});
                                    }
                                  }}
                                  src={getPlayableVideoUrl(matchingWork.images[0])} 
                                  autoPlay 
                                  loop 
                                  muted 
                                  playsInline 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <img 
                                  src={matchingWork.images[0]} 
                                  alt={matchingWork.title} 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <div className="absolute inset-0 bg-[#4A6FA5]/5 opacity-100 group-hover:opacity-0 transition-opacity"></div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-1 text-[9px] font-mono tracking-tight text-[#222222]/80 uppercase">
                              <span className="truncate">{matchingWork.location} / {matchingWork.year}</span>
                              <span className="text-[#4A6FA5] font-semibold italic truncate ml-1">{matchingWork.emotion}</span>
                            </div>
                          </div>
                        );
                     })}
                 </div>

                {works.filter(w => w.emotion === selectedEmotion).length === 0 && (
                  <div className="text-center py-20 text-[#222222]/50 font-serif-ja text-xs">
                    이 감정 폴더에 매핑된 사진이나 에세이가 아직 존재하지 않습니다.
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: JOURNAL BLOG konsep                                  */}
        {/* ========================================================= */}
        {activeTab === 'JOURNAL' && (
          <div className="fade-in px-6 md:px-12 lg:px-20 py-12 md:py-16 w-full max-w-5xl mx-auto font-serif">
            
            {/* Header Context aligned with design HTML */}
            <header className="mb-12 flex flex-col md:flex-row justify-between items-baseline md:items-end border-b border-gray-200 pb-6 gap-2">
              <div>
                <h2 className="text-3xl font-light tracking-tight italic text-[#222222]">JOURNAL MEMOIRS</h2>
                <p className="text-[10px] uppercase tracking-widest text-[#4A6FA5] mt-1 font-mono font-semibold font-serif">Reflections and Thoughts Recorded in Deep Solitude</p>
              </div>
              <div className="flex gap-4 text-[10px] uppercase tracking-widest opacity-60 font-mono text-right">
                <span>MEMOIRS BLOG</span>
              </div>
            </header>

            {/* List of journals */}
            <div className="flex flex-col gap-12 md:gap-20">
              {journals.map((post) => (
                <article key={post.id} className="border-b border-gray-200 pb-12">
                  
                  {/* Title & Metadata */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-[#4A6FA5] font-mono text-[10px] tracking-widest uppercase mb-1">
                      <Clock size={10} />
                      <span>{post.date}</span>
                    </div>
                    <h3 className="text-xl md:text-2xl text-[#222222] font-semibold tracking-tight font-serif">
                      {post.title}
                    </h3>
                  </div>

                  {/* Prose Content Essay styled like design HTML body slots */}
                  <div className="text-[13px] md:text-[14px] text-[#222222]/85 leading-[2.1] whitespace-pre-line mb-6 bg-[#E8E7E2]/25 p-5 md:p-6 rounded border border-gray-200/60 text-left">
                    {post.content}
                  </div>

                  {/* Curated Grid of Photos with matching slots colors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {post.images.map((imgUrl, imageIndex) => {
                      const bgColors = ['bg-[#E8E7E2]', 'bg-[#DFDFD9]', 'bg-[#E5E4DE]'];
                      const cardBg = bgColors[imageIndex % bgColors.length];
                      return (
                        <div key={imageIndex} className={`${cardBg} overflow-hidden border border-black/[0.02] rounded aspect-[4/3]`}>
                          {isVideoUrl(imgUrl) ? (
                            <video 
                              key={imgUrl}
                              ref={(el) => {
                                if (el) {
                                  el.setAttribute('muted', 'true');
                                  el.setAttribute('playsinline', 'true');
                                  el.muted = true;
                                  el.playsInline = true;
                                  el.play().catch(() => {});
                                }
                              }}
                              src={getPlayableVideoUrl(imgUrl)} 
                              autoPlay 
                              loop 
                              muted 
                              playsInline 
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-103"
                            />
                          ) : (
                            <img 
                              src={imgUrl} 
                              alt={`${post.title} - ${imageIndex + 1}`} 
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-103"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                </article>
              ))}

              {journals.length === 0 && (
                <div className="text-center py-20 text-[#222222]/50 font-serif text-sm bg-white/20 border border-dashed border-[#222222]/20 rounded">
                  기재된 저널 로그가 없습니다. 관리자 인증 후 채워보세요.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: ABOUT & CONTACT                                    */}
        {/* ========================================================= */}
        {activeTab === 'ABOUT' && (
          <div className="fade-in px-6 md:px-12 lg:px-20 py-12 md:py-16 w-full max-w-4xl mx-auto font-serif">
            
            {/* Header Context aligned with design HTML */}
            <header className="mb-12 flex flex-col md:flex-row justify-between items-baseline md:items-end border-b border-gray-200 pb-6 gap-2">
              <div>
                <h2 className="text-3xl font-light tracking-tight italic text-[#222222]">ABOUT AUTHOR</h2>
                <p className="text-[10px] uppercase tracking-widest text-[#4A6FA5] mt-1 font-mono font-semibold font-serif">The Mind and Lenses Behind the Blue Records</p>
              </div>
              <div className="flex gap-4 text-[10px] uppercase tracking-widest opacity-60 font-mono text-right">
                <span>AUTHOR CONTEXT</span>
              </div>
            </header>

            {/* Profile Intro styled in Warm Organic */}
            <div className="bg-[#E8E7E2]/50 border border-gray-200 p-8 md:p-12 rounded shadow-xs mb-10">
              
              {/* Minimal Info Badges instead of a resume */}
              {(visibleSections.showBirthYear !== false || visibleSections.showBirthPlace !== false || visibleSections.showOccupation !== false) && (
                <div className="flex flex-wrap gap-4 justify-center md:justify-start items-center mb-8 border-b border-gray-200 pb-6">
                  {visibleSections.showBirthYear !== false && (
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#222222]/70 uppercase tracking-widest px-3 py-1 bg-[#E8E7E2] rounded-sm animate-fade-in">
                      <span>BORN IN:</span>
                      <span className="font-bold text-[#222222]">{about.birthYear}</span>
                    </div>
                  )}
                  {visibleSections.showBirthPlace !== false && (
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#222222]/70 uppercase tracking-widest px-3 py-1 bg-[#E8E7E2] rounded-sm animate-fade-in">
                      <span>ORIGIN:</span>
                      <span className="font-bold text-[#222222]">{about.birthPlace}</span>
                    </div>
                  )}
                  {visibleSections.showOccupation !== false && (
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#222222]/70 uppercase tracking-widest px-3 py-1 bg-[#E8E7E2] rounded-sm animate-fade-in">
                      <span>OCCUPATION:</span>
                      <span className="font-bold text-[#4A6FA5]">{about.profession}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Biography (Elegantly structured) */}
              <div className="text-[14px] text-[#222222]/90 leading-[2.3] text-left whitespace-pre-line max-w-2xl mb-12">
                {about.biography}
              </div>

              {/* Simple Equipment specs at the bottom - strictly minimal style */}
              {visibleSections.showGears !== false && (
                <div className="border-t border-gray-200 pt-8 animate-fade-in">
                  <span className="font-mono text-[10px] tracking-[0.42em] text-[#222222]/50 uppercase block mb-3 font-bold">
                    GEARS & SPECIFICATION
                  </span>
                  
                  <ul className="flex flex-col gap-2 font-mono text-[11px] text-[#222222]/70">
                    {about.equipments.map((gear, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[#4A6FA5]"></span>
                        <span>{gear}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* CONTACT FOOTER DRAWER styled with Warm Organic parameters */}
            {visibleSections.showContactForm !== false && (
              <div className="bg-[#DFDFD9]/50 border border-gray-250 p-8 rounded text-center animate-fade-in">
                <span className="font-mono text-[9px] tracking-[0.4em] text-[#4A6FA5] uppercase block mb-2 font-bold">INQUIRIES &amp; CONNECTION</span>
                <h4 className="text-lg text-[#222222] tracking-wider font-semibold uppercase mb-4">
                  CONTACT THE AUTHOR
                </h4>
                <p className="text-xs text-[#222222]/70 leading-relaxed max-w-md mx-auto mb-6">
                  사진 아카이브 협업, 도서 작업 혹은 감정에 대한 고요한 교류는 아래 채널로 편히 연락해주세요.
                </p>

                <div className="flex flex-wrap justify-center items-center gap-6">
                  {/* Real link to instagram using user ID */}
                  <a 
                    href="https://www.instagram.com/macolorisblue" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#222222]/85 hover:text-[#4A6FA5] transition-colors hover:underline"
                  >
                    <Instagram size={14} className="text-[#4A6FA5]" />
                    <span>{contact.instagram}</span>
                  </a>
                  
                  <a 
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#222222]/85 hover:text-[#4A6FA5] transition-colors hover:underline"
                  >
                    <Mail size={14} className="text-[#4A6FA5]" />
                    <span>{contact.email}</span>
                  </a>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* CUSTOM TABS RENDERER                                      */}
        {/* ========================================================= */}
        {customTabs.some(ct => ct.id === activeTab && ct.visible) && (
          (() => {
            const currentTab = customTabs.find(ct => ct.id === activeTab);
            if (!currentTab) return null;
            return (
              <div className="fade-in px-6 md:px-12 lg:px-20 py-12 max-w-5xl mx-auto animate-fade-in animate-duration-300">
                <div className="text-center mb-10">
                  <span className="font-mono text-[9px] tracking-[0.4em] text-[#4A6FA5] uppercase block mb-2 font-bold select-none">
                    SECTION VIEW
                  </span>
                  <h3 className="font-serif text-2xl tracking-[0.1em] text-[#222222] font-semibold uppercase">
                    {currentTab.name}
                  </h3>
                </div>

                <div className="bg-[#E8E7E2]/50 border border-gray-250 p-6 md:p-12 rounded shadow-xs mb-10">
                  {currentTab.image && (
                    <div className="mb-8 overflow-hidden rounded border border-gray-200/80 shadow-xs max-h-[550px]">
                      <img 
                        src={currentTab.image} 
                        className="w-full h-full object-cover select-none" 
                        alt={currentTab.name}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <div className="text-[14px] text-[#222222]/90 leading-[2.1] text-left whitespace-pre-line max-w-2xl mx-auto font-sans">
                    {currentTab.content}
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* ========================================================= */}
        {/* TAB 7: ADMINISTRATIVE CONTROL CONSOLE                     */}
        {/* ========================================================= */}
        {activeTab === 'ADMIN' && isAdmin && (
          <div className="fade-in px-6 md:px-12 lg:px-20 py-12 max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-black/[0.05] pb-6 mb-8">
              <div>
                <span className="font-mono text-[9px] tracking-widest text-[#4A6FA5] uppercase font-bold">Admin Console</span>
                <h3 className="font-serif text-2xl tracking-widest text-[#222222] font-semibold uppercase">
                  MANAGEMENT CENTER
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleResetToDefaults}
                  className="bg-[#222222] text-white font-mono text-[10px] px-3 py-1.5 rounded tracking-widest hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw size={12} /> RESET TO DEFAULTS
                </button>
                <button 
                  onClick={handleAdminLogout}
                  className="bg-red-500 text-white font-mono text-[10px] px-3 py-1.5 rounded tracking-widest hover:bg-red-600 transition-colors cursor-pointer"
                >
                  LOGOUT
                </button>
              </div>
            </div>

            {/* MAIN FORMS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: List and Trigger of Works */}
              <div className="lg:col-span-2 bg-white/60 border p-6 rounded">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-serif text-sm tracking-wider font-bold text-[#222222] uppercase">
                    1. PORTFOLIO WORKS ({works.length})
                  </h4>
                  <button 
                    onClick={() => {
                      setIsCreatingNewWork(true);
                      setEditingWork({
                        id: `work-${Date.now()}`,
                        title: '',
                        year: 2026,
                        location: 'Fukuoka',
                        date: '2026.06',
                        emotion: '그리움',
                        preface: '',
                        images: [homeHeroImg],
                        closing: '',
                        featured: true
                      });
                    }}
                    className="bg-[#4A6FA5] text-white font-mono text-[10px] px-2.5 py-1 rounded tracking-wider flex items-center gap-1 hover:bg-[#3d5e8c]"
                  >
                    <Plus size={12} /> ADD NEW
                  </button>
                </div>

                {/* Edit Work form overlay or card */}
                {editingWork && (
                  <form onSubmit={handleSaveWork} className="bg-[#F2F1EC] p-5 rounded border border-[#222222]/15 mb-6 animate-fade-in text-xs">
                    <h5 className="font-serif text-xs font-bold text-[#4A6FA5] uppercase mb-4 focus:ring-0">
                      {isCreatingNewWork ? '새 포트폴리오 프로젝트 생성' : '기존 포트폴리오 수정'}
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block font-mono text-[10px] text-[#222222]/70 uppercase mb-1">제목 (Title - Kor/Ja combined)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 春が終わる頃 (봄이 끝날 무렵)"
                          value={editingWork.title || ''}
                          onChange={(e) => setEditingWork({...editingWork, title: e.target.value})}
                          className="w-full bg-white p-2 border border-[#222222]/15 rounded"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-[#222222]/70 uppercase mb-1">장소 (Location)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Fukuoka"
                          value={editingWork.location || ''}
                          onChange={(e) => setEditingWork({...editingWork, location: e.target.value})}
                          className="w-full bg-white p-2 border border-[#222222]/15 rounded"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <label className="block font-mono text-[10px] text-[#222222]/70 uppercase mb-1">연도 (Year)</label>
                        <input 
                          type="number" 
                          value={editingWork.year || 2026}
                          onChange={(e) => setEditingWork({...editingWork, year: Number(e.target.value)})}
                          className="w-full bg-white p-2 border border-[#222222]/15 rounded font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-[#222222]/70 uppercase mb-1">구체 월일 (Date String)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 2026.03"
                          value={editingWork.date || ''}
                          onChange={(e) => setEditingWork({...editingWork, date: e.target.value})}
                          className="w-full bg-white p-2 border border-[#222222]/15 rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-[#222222]/70 uppercase mb-1">감정 분위기 (Emotion Label)</label>
                        <select 
                          value={editingWork.emotion || (emotions[0]?.name || '그리움')}
                          onChange={(e) => setEditingWork({...editingWork, emotion: e.target.value})}
                          className="w-full bg-white p-2 border border-[#222222]/15 rounded font-serif-ja font-semibold"
                        >
                          {emotions.map(e => (
                            <option key={e.name} value={e.name}>{e.name} ({e.english})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Local File Uploader with Drop & Drag indicator and clear button */}
                    <div className="mb-4">
                      {/* Local File Uploader for images and video */}
                      <div className="mt-3">
                        <span className="block text-[9px] text-[#222222]/60 uppercase mb-1 font-bold">📂 로컬 미디어 파일 업로드 (이미지 및 동영상):</span>
                        <div className="border-2 border-dashed border-[#4A6FA5]/30 hover:border-[#4A6FA5] hover:bg-[#4A6FA5]/5 p-4 rounded text-center transition-colors cursor-pointer relative">
                          <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={(e) => {
                              if (e.target.files) {
                                const filesArray = Array.from(e.target.files) as File[];
                                filesArray.forEach(async (file) => {
                                  try {
                                    if (file.type.startsWith('video/')) {
                                      if (file.size > 15 * 1024 * 1024) {
                                        alert("경고: 업로드하신 동영상 크기가 15MB를 초과합니다. 쾌적한 재생을 위해 가급적 5M~10MB 내외의 비디오 파일을 권장합니다.");
                                      }
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        if (typeof reader.result === 'string') {
                                          const videoDataUrl = reader.result;
                                          setEditingWork(prev => {
                                            if (!prev) return null;
                                            const currentImgs = prev.images || [];
                                            return {
                                              ...prev,
                                              images: [...currentImgs, videoDataUrl]
                                            };
                                          });
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    } else {
                                      const compressedData = await compressImageFile(file as File);
                                      if (compressedData) {
                                        setEditingWork(prev => {
                                          if (!prev) return null;
                                          const currentImgs = prev.images || [];
                                          return {
                                            ...prev,
                                            images: [...currentImgs, compressedData]
                                          };
                                        });
                                      }
                                    }
                                  } catch (err) {
                                    console.error("Image/video loading error:", err);
                                  }
                                });
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <p className="text-[10px] font-mono text-[#222222]/70">📷 클릭하거나 이미지를 드래그하여 업로드 (사진/동영상 다중 선택 가능)</p>
                          <p className="text-[8px] text-[#222222]/40 mt-0.5">선택된 미디어는 아래 목록에 즉시 추가됩니다.</p>
                        </div>
                        {editingWork.images && editingWork.images.length > 0 && (
                          <div className="mt-3">
                            <span className="text-[10px] text-[#222222]/80 block mb-1 font-bold">
                              📷 등록된 미디어 목록 ({editingWork.images.length}개)
                            </span>
                            <p className="text-[9px] text-[#4A6FA5] font-semibold mb-2 bg-sky-50 p-1.5 rounded leading-normal border border-sky-100">
                              💡 <b>순서 변경 방법</b>: 항목을 마우스로 직접 <b>드래그 앤 드롭</b>하여 끌어다 놓거나, 모바일에서는 <b>바꾸고 싶은 두 항목을 차례대로 터치</b>하면 간편하게 순서가 바뀝니다!
                            </p>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto bg-stone-100 p-2 rounded border border-stone-200">
                              {editingWork.images.map((img, idx) => {
                                const isDragged = draggedWorkImageIdx === idx;
                                const isHovered = dragHoverWorkImageIdx === idx;
                                const isSelected = selectedReorderWorkImageIdx === idx;
                                const hasSelectionInList = selectedReorderWorkImageIdx !== null;

                                return (
                                  <div 
                                    key={idx} 
                                    draggable={true}
                                    onDragStart={(e) => {
                                      setDraggedWorkImageIdx(idx);
                                      e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnter={(e) => {
                                      e.preventDefault();
                                      setDragHoverWorkImageIdx(idx);
                                    }}
                                    onDragLeave={() => {
                                      if (dragHoverWorkImageIdx === idx) setDragHoverWorkImageIdx(null);
                                    }}
                                    onDragEnd={() => {
                                      setDraggedWorkImageIdx(null);
                                      setDragHoverWorkImageIdx(null);
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      handleDropWorkImage(idx);
                                    }}
                                    onClick={(e) => {
                                      const target = e.target as HTMLElement;
                                      if (target.closest('button')) return;
                                      
                                      if (selectedReorderWorkImageIdx === null) {
                                        setSelectedReorderWorkImageIdx(idx);
                                      } else {
                                        if (selectedReorderWorkImageIdx !== idx) {
                                          const newImages = [...(editingWork.images || [])];
                                          const draggedImg = newImages[selectedReorderWorkImageIdx];
                                          newImages.splice(selectedReorderWorkImageIdx, 1);
                                          newImages.splice(idx, 0, draggedImg);
                                          setEditingWork({ ...editingWork, images: newImages });
                                        }
                                        setSelectedReorderWorkImageIdx(null);
                                      }
                                    }}
                                    className={`relative w-20 h-20 rounded overflow-hidden border bg-stone-200 transition-all duration-250 cursor-grab active:cursor-grabbing group/workmedia flex flex-col justify-between select-none
                                      ${isDragged ? 'opacity-30 border-dashed border-sky-400 bg-sky-50 scale-95' : 'border-stone-300'}
                                      ${isHovered ? 'scale-105 border-double border-2 border-sky-500 shadow-md ring-1 ring-sky-300 z-10' : ''}
                                      ${isSelected ? 'scale-105 ring-2 ring-[#4A6FA5] border-[#4A6FA5] z-10 shadow-lg' : ''}
                                      ${!isSelected && hasSelectionInList ? 'hover:border-sky-300 active:scale-102' : ''}
                                    `}
                                  >
                                    {isVideoUrl(img) ? (
                                      <video 
                                        src={getPlayableVideoUrl(img)} 
                                        className="w-full h-full object-cover pointer-events-none" 
                                        ref={(el) => {
                                          if (el) {
                                            el.setAttribute('muted', 'true');
                                            el.setAttribute('playsinline', 'true');
                                            el.muted = true;
                                            el.playsInline = true;
                                            el.play().catch(() => {});
                                          }
                                        }}
                                        muted 
                                        playsInline 
                                      />
                                    ) : (
                                      <img src={img} className="w-full h-full object-cover pointer-events-none" alt="Preview" referrerPolicy="no-referrer" />
                                    )}
                                    
                                    {/* Visual Indicator of Move Selection */}
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-[#4A6FA5]/25 flex items-center justify-center pointer-events-none">
                                        <div className="bg-[#4A6FA5] text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow animate-pulse">
                                          여기 클릭시 이동
                                        </div>
                                      </div>
                                    )}

                                    {/* Drag & Drop Visual Indicator overlay when there is any item dragged */}
                                    {draggedWorkImageIdx !== null && !isDragged && (
                                      <div className="absolute inset-0 bg-transparent border-dashed border border-sky-400/50 pointer-events-none flex items-center justify-center">
                                        <div className="text-[7px] text-sky-600 bg-white/95 px-1 rounded shadow-sm">놓기</div>
                                      </div>
                                    )}

                                    {/* Hover Control Overlay with Index and Delete */}
                                    <div className="absolute inset-x-0 bottom-0 bg-black/65 p-1 opacity-0 group-hover/workmedia:opacity-100 transition-opacity flex justify-between items-center z-10">
                                      <span className="text-white text-[8px] font-mono font-bold tracking-tighter">#{idx + 1}</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingWork({
                                            ...editingWork,
                                            images: editingWork.images.filter((_, i) => i !== idx)
                                          });
                                          if (selectedReorderWorkImageIdx === idx) setSelectedReorderWorkImageIdx(null);
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white px-1.5 py-0.5 rounded text-[8px] font-bold cursor-pointer transition-colors"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                    
                                    {/* Permanent index label */}
                                    <div className="absolute top-1 left-1 bg-black/50 text-white font-mono text-[7px] px-1 rounded z-10">
                                      #{idx + 1}
                                    </div>

                                    {/* Permanent Grip handle hint */}
                                    <div className="absolute top-1 right-1 bg-white/75 text-gray-700 p-0.5 rounded-full shadow-sm cursor-grab group-hover/workmedia:bg-white transition-colors z-10">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grip-vertical"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block font-mono text-[10px] text-[#222222]/70 uppercase mb-1">감정 서문 (Preface essay / multiline)</label>
                      <textarea 
                        rows={4}
                        placeholder="그날은 특별한 일이 없었다..."
                        value={editingWork.preface || ''}
                        onChange={(e) => setEditingWork({...editingWork, preface: e.target.value})}
                        className="w-full bg-white p-2 border border-[#222222]/15 rounded font-serif-ja leading-relaxed"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block font-mono text-[10px] text-[#222222]/70 uppercase mb-1">마지막 끝맺음 짧은 문장 (Closing essay sentence)</label>
                      <input 
                        type="text" 
                        placeholder="また思い出したらここへ帰ってくる。"
                        value={editingWork.closing || ''}
                        onChange={(e) => setEditingWork({...editingWork, closing: e.target.value})}
                        className="w-full bg-white p-2 border border-[#222222]/15 rounded font-serif-ja"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button 
                        type="button" 
                        onClick={() => { setEditingWork(null); setIsCreatingNewWork(false); }}
                        className="bg-stone-300 text-stone-800 font-mono tracking-wider px-3 py-1.5 rounded"
                      >
                        취소 (Cancel)
                      </button>
                      <button 
                        type="submit" 
                        className="bg-[#4A6FA5] text-white font-mono tracking-wider px-4 py-1.5 rounded"
                      >
                        성공 저장 (Save)
                      </button>
                    </div>
                  </form>
                )}

                {/* Grid list in admin view */}
                <div className="flex flex-col gap-3">
                  {works.map((work, index) => (
                    <div key={work.id} className="bg-white border p-3 flex justify-between items-center rounded">
                      <div className="flex items-center gap-3">
                        {/* Reorder Buttons */}
                        <div className="flex flex-col gap-1 mr-1">
                          <button 
                            type="button"
                            onClick={() => handleMoveWorkUp(index)}
                            disabled={index === 0}
                            className={`p-1 border rounded hover:bg-stone-100 flex items-center justify-center text-[8px] h-5 w-5 ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                            title="위로 이동 (Move Up)"
                          >
                            ▲
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleMoveWorkDown(index)}
                            disabled={index === works.length - 1}
                            className={`p-1 border rounded hover:bg-stone-100 flex items-center justify-center text-[8px] h-5 w-5 ${index === works.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                            title="아래로 이동 (Move Down)"
                          >
                            ▼
                          </button>
                        </div>

                        {isVideoUrl(work.images[0] || '') ? (
                          <video 
                            src={getPlayableVideoUrl(work.images[0])} 
                            className="w-12 h-10 object-cover rounded shadow-3xs" 
                            ref={(el) => {
                              if (el) {
                                el.setAttribute('muted', 'true');
                                el.setAttribute('playsinline', 'true');
                                el.muted = true;
                                el.playsInline = true;
                                el.play().catch(() => {});
                              }
                            }}
                            muted
                            playsInline
                          />
                        ) : (
                          <img 
                            src={work.images[0]} 
                            className="w-12 h-10 object-cover rounded shadow-3xs" 
                            alt="Thumbnail admin"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div>
                          <p className="font-serif-ja font-bold text-xs text-[#222222]">{work.title}</p>
                          <span className="font-mono text-[9px] text-[#222222]/50">
                            {work.year} &middot; {work.location} &middot; [{work.emotion}] &middot; 사진 {work.images.length}장
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => {
                            setEditingWork(work);
                            setIsCreatingNewWork(false);
                          }}
                          className="p-1 px-2 border hover:bg-[#4A6FA5]/10 hover:text-[#4A6FA5] rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={11} /> EDIT
                        </button>
                        <button 
                          onClick={() => handleDeleteWork(work.id)}
                          className="p-1 px-2 border border-red-200 text-red-500 hover:bg-red-50 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={11} /> DEL
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Profile & Contact & Journals */}
              <div className="flex flex-col gap-6">
                
                {/* 2. Admin Bio Setting */}
                <div className="bg-white/60 border p-6 rounded">
                  <h4 className="font-serif text-sm tracking-wider font-bold text-[#222222] uppercase mb-4">
                    2. BIOGRAPHY PROFILE
                  </h4>
                  
                  <div className="flex flex-col gap-3 text-xs">
                    <div>
                      <label className="block font-mono text-[10px] text-[#222222]/70 uppercase mb-0.5">출생연도</label>
                      <input 
                        type="text" 
                        value={tempAbout?.birthYear ?? about.birthYear}
                        onChange={(e) => {
                          const updated = { ...(tempAbout || about), birthYear: e.target.value };
                          setTempAbout(updated);
                        }}
                        className="w-full bg-white p-2 border border-[#222222]/15 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-[#222222]/70 uppercase mb-0.5">출생지역</label>
                      <input 
                        type="text" 
                        value={tempAbout?.birthPlace ?? about.birthPlace}
                        onChange={(e) => {
                          const updated = { ...(tempAbout || about), birthPlace: e.target.value };
                          setTempAbout(updated);
                        }}
                        className="w-full bg-white p-2 border border-[#222222]/15 rounded"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-[#222222]/70 uppercase mb-0.5">직업 (본업)</label>
                      <input 
                        type="text" 
                        value={tempAbout?.profession ?? about.profession}
                        onChange={(e) => {
                          const updated = { ...(tempAbout || about), profession: e.target.value };
                          setTempAbout(updated);
                        }}
                        className="w-full bg-white p-2 border border-[#222222]/15 rounded"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-[#222222]/70 uppercase mb-0.5">에세이 자기소개 (Essays)</label>
                      <textarea 
                        rows={4}
                        value={tempAbout?.biography ?? about.biography}
                        onChange={(e) => {
                          const updated = { ...(tempAbout || about), biography: e.target.value };
                          setTempAbout(updated);
                        }}
                        className="w-full bg-white p-2 border border-[#222222]/15 rounded font-serif-ja leading-relaxed"
                      />
                    </div>
                    
                    <div>
                      <label className="block font-mono text-[10px] text-[#222222]/70 uppercase">사용 장비 (Separated by comma)</label>
                      <input 
                        type="text" 
                        value={(tempAbout?.equipments ?? about.equipments).join(', ')}
                        onChange={(e) => {
                          const updated = { ...(tempAbout || about), equipments: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) };
                          setTempAbout(updated);
                        }}
                        className="w-full bg-white p-2 border border-[#222222]/15 rounded font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Contact Setting */}
                <div className="bg-white/60 border p-6 rounded">
                  <h4 className="font-serif text-sm tracking-wider font-bold text-[#222222] uppercase mb-4">
                    3. CONTACT LINKS
                  </h4>
                  <div className="flex flex-col gap-3 text-xs">
                    <div>
                      <label className="block font-mono text-[10px] text-[#222222]/70 uppercase mb-0.5">Instagram ID</label>
                      <input 
                        type="text" 
                        value={tempContact?.instagram ?? contact.instagram}
                        onChange={(e) => {
                          const updated = { ...(tempContact || contact), instagram: e.target.value };
                          setTempContact(updated);
                        }}
                        className="w-full bg-white p-2 border border-[#222222]/15 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-[#222222]/70 uppercase mb-0.5">Contact Email</label>
                      <input 
                        type="email" 
                        value={tempContact?.email ?? contact.email}
                        onChange={(e) => {
                          const updated = { ...(tempContact || contact), email: e.target.value };
                          setTempContact(updated);
                        }}
                        className="w-full bg-white p-2 border border-[#222222]/15 rounded font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Intro Video Setting */}
                <div className="bg-white/60 border p-6 rounded animate-fade-in">
                  <h4 className="font-serif text-sm tracking-wider font-bold text-[#222222] uppercase mb-4">
                    5. INTRO LANDING VIDEO URL &amp; UPLOAD
                  </h4>
                  <div className="flex flex-col gap-3 text-xs">
                    <div>
                      <label className="block font-mono text-[10px] text-[#222222]/70 uppercase mb-0.5">인트로 영상 MP4 URL (직접 링크)</label>
                      <input 
                        type="text" 
                        value={tempVideoUrl !== '' ? tempVideoUrl : videoUrl}
                        onChange={(e) => setTempVideoUrl(e.target.value)}
                        placeholder="동영상 직접 재생 주소 (MP4)"
                        className="w-full bg-white p-2 border border-[#222222]/15 rounded font-mono"
                      />
                      
                      <div className="mt-3">
                        <span className="block font-mono text-[10px] text-[#222222]/70 uppercase mb-1 font-bold">🎥 로컬 비디오 파일 직접 업로드하고 적용:</span>
                        <div className="border-2 border-dashed border-[#4A6FA5]/30 hover:border-[#4A6FA5] hover:bg-[#4A6FA5]/5 p-4 rounded text-center transition-colors cursor-pointer relative">
                          <input 
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 20 * 1024 * 1024) {
                                  alert("경고: 업로드하신 동영상 크기가 20MB를 넘습니다. 브라우저 로컬 데이터베이스 및 로딩의 최적화 보장을 위해 10MB 이하의 용량으로 압축된 비디오 파일을 절대적으로 권장합니다.");
                                }
                                const localUrl = URL.createObjectURL(file);
                                setTempVideoFile(file);
                                setTempVideoUrl(localUrl);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <p className="text-[10px] text-[#222222]/70 font-mono">🎥 드래그 앤 드롭 또는 클릭하여 로컬 MP4 비디오 파일 업로드</p>
                          <p className="text-[8px] text-amber-700 mt-0.5 font-sans">※ 브라우저 용량 관계상 저용량 웹용 MP4 파일을 등록하십시오.</p>
                        </div>
                      </div>

                      <p className="text-[9px] text-[#222222]/50 font-sans mt-3">
                        * 첫 접속 시 또는 상단 로고 클릭 시 로드되는 풀스크린 인트로 커버 영상의 재생 주소입니다. (MP4 direct link 또는 로컬 파일을 업로드하여 저장용량 한도 내에서 사용할 수 있습니다.)
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6. Site Sections & Predefined Elements Visibility Settings */}
                <div className="bg-white/60 border p-6 rounded animate-fade-in">
                  <h4 className="font-serif text-sm tracking-wider font-bold text-[#222222] uppercase mb-1">
                    6. SITE SECTIONS &amp; MENU VISIBILITY
                  </h4>
                  <p className="text-[10px] text-[#222222]/50 font-sans mb-4">
                    * 체크 해제 시 해당 목차, 탭 메뉴, 또는 프로필 세부 영역이 웹사이트에서 즉시 숨겨지며 비공개 처리됩니다.
                  </p>
                  
                  <div className="space-y-4 text-xs font-sans">
                    
                    {/* Primary Tab Navigation Control */}
                    <div className="border-b border-black/5 pb-3">
                      <span className="block font-mono text-[9.5px] text-[#4A6FA5] font-bold uppercase tracking-wider mb-2">메인 탭 메뉴 활성화 (Main Navigation Tabs)</span>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={(tempVisibleSections ?? visibleSections).works !== false}
                            onChange={(e) => {
                              const updated = { ...(tempVisibleSections || visibleSections), works: e.target.checked };
                              setTempVisibleSections(updated);
                            }}
                            className="rounded text-[#4A6FA5] focus:ring-[#4A6FA5]"
                          />
                          <span>Works 탭</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={(tempVisibleSections ?? visibleSections).archive !== false}
                            onChange={(e) => {
                              const updated = { ...(tempVisibleSections || visibleSections), archive: e.target.checked };
                              setTempVisibleSections(updated);
                            }}
                            className="rounded text-[#4A6FA5] focus:ring-[#4A6FA5]"
                          />
                          <span>Archive 탭</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={(tempVisibleSections ?? visibleSections).emotions !== false}
                            onChange={(e) => {
                              const updated = { ...(tempVisibleSections || visibleSections), emotions: e.target.checked };
                              setTempVisibleSections(updated);
                            }}
                            className="rounded text-[#4A6FA5] focus:ring-[#4A6FA5]"
                          />
                          <span>Emotions 탭</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={(tempVisibleSections ?? visibleSections).journal !== false}
                            onChange={(e) => {
                              const updated = { ...(tempVisibleSections || visibleSections), journal: e.target.checked };
                              setTempVisibleSections(updated);
                            }}
                            className="rounded text-[#4A6FA5] focus:ring-[#4A6FA5]"
                          />
                          <span>Journal 탭</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none col-span-2">
                          <input 
                            type="checkbox" 
                            checked={(tempVisibleSections ?? visibleSections).about !== false}
                            onChange={(e) => {
                              const updated = { ...(tempVisibleSections || visibleSections), about: e.target.checked };
                              setTempVisibleSections(updated);
                            }}
                            className="rounded text-[#4A6FA5] focus:ring-[#4A6FA5]"
                          />
                          <span>About Author 탭 (숨길 시 프로필 전체 비공개)</span>
                        </label>
                      </div>
                    </div>

                    {/* Predefined About elements control */}
                    <div className="border-b border-black/5 pb-3">
                      <span className="block font-mono text-[9.5px] text-[#4A6FA5] font-bold uppercase tracking-wider mb-2">작가 프로필 및 세부 성격 제어 (About Profile Details)</span>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={(tempVisibleSections ?? visibleSections).showBirthYear !== false}
                            onChange={(e) => {
                              const updated = { ...(tempVisibleSections || visibleSections), showBirthYear: e.target.checked };
                              setTempVisibleSections(updated);
                            }}
                            className="rounded text-[#4A6FA5] focus:ring-[#4A6FA5]"
                          />
                          <span>출생연도 배지 보이기 (BORN IN)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={(tempVisibleSections ?? visibleSections).showBirthPlace !== false}
                            onChange={(e) => {
                              const updated = { ...(tempVisibleSections || visibleSections), showBirthPlace: e.target.checked };
                              setTempVisibleSections(updated);
                            }}
                            className="rounded text-[#4A6FA5] focus:ring-[#4A6FA5]"
                          />
                          <span>출생지역 배지 보이기 (ORIGIN)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={(tempVisibleSections ?? visibleSections).showOccupation !== false}
                            onChange={(e) => {
                              const updated = { ...(tempVisibleSections || visibleSections), showOccupation: e.target.checked };
                              setTempVisibleSections(updated);
                            }}
                            className="rounded text-[#4A6FA5] focus:ring-[#4A6FA5]"
                          />
                          <span>직업명 배지 보이기 (OCCUPATION)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={(tempVisibleSections ?? visibleSections).showGears !== false}
                            onChange={(e) => {
                              const updated = { ...(tempVisibleSections || visibleSections), showGears: e.target.checked };
                              setTempVisibleSections(updated);
                            }}
                            className="rounded text-[#4A6FA5] focus:ring-[#4A6FA5]"
                          />
                          <span>사용 장비/스펙 리스트 보이기 (GEARS &amp; SPEC)</span>
                        </label>
                      </div>
                    </div>

                    {/* Intro landing video & inquiry controls */}
                    <div className="border-b border-black/5 pb-3">
                      <span className="block font-mono text-[9.5px] text-[#4A6FA5] font-bold uppercase tracking-wider mb-2">랜딩화면 인트로 및 하단 연결 (Intro &amp; Contact Drawers)</span>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={(tempVisibleSections ?? visibleSections).introVideo !== false}
                            onChange={(e) => {
                              const updated = { ...(tempVisibleSections || visibleSections), introVideo: e.target.checked };
                              setTempVisibleSections(updated);
                            }}
                            className="rounded text-[#4A6FA5] focus:ring-[#4A6FA5]"
                          />
                          <span className="font-semibold text-amber-700">무비 랜딩커버 활성화 (비활성화 시 첫 진입 생략)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={(tempVisibleSections ?? visibleSections).showContactForm !== false}
                            onChange={(e) => {
                              const updated = { ...(tempVisibleSections || visibleSections), showContactForm: e.target.checked };
                              setTempVisibleSections(updated);
                            }}
                            className="rounded text-[#4A6FA5] focus:ring-[#4A6FA5]"
                          />
                          <span>ABOUT 탭 하단 &apos;CONTACT AUTHOR&apos; 이메일/인스타 카드 보이기</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={(tempVisibleSections ?? visibleSections).footerContact !== false}
                            onChange={(e) => {
                              const updated = { ...(tempVisibleSections || visibleSections), footerContact: e.target.checked };
                              setTempVisibleSections(updated);
                            }}
                            className="rounded text-[#4A6FA5] focus:ring-[#4A6FA5]"
                          />
                          <span>전체 화면 하단 (Footer) SNS/이메일 정보 보이기</span>
                        </label>
                      </div>
                    </div>

                    {/* EXPLICIT SAVE ACTION FOR PREFERENCES */}
                    <div className="bg-[#4A6FA5]/5 border border-[#4A6FA5]/20 p-4 rounded mt-4">
                      <span className="block font-mono text-[10px] text-[#4A6FA5] font-bold uppercase tracking-wider mb-2">💾 설정 사항 보존 제어기 (Preferences Controller)</span>
                      <p className="text-[9.5px] text-stone-600 font-sans mb-3 font-semibold">
                        위 인트로 비디오 파일/주소, 자기소개 글, SNS 계정 정보, 메뉴 체크 상자는 아래 저장을 눌러야 최종 브라우저(Local Storage)에 기록됩니다.
                      </p>
                      
                      <button
                        type="button"
                        onClick={handleSaveAllSettings}
                        className="w-full bg-[#4A6FA5] hover:bg-[#35537D] text-white py-2.5 px-4 rounded font-mono text-xs font-bold tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        💾 변경 지사항 최종 적용 저장하기 (Save Settings)
                      </button>

                      {settingsSavedMessage && (
                        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-[10.5px] text-emerald-800 font-semibold text-center animate-pulse">
                          {settingsSavedMessage}
                        </div>
                      )}

                      {/* premium backup and sync control module */}
                      <div className="mt-4 pt-3 border-t border-[#4A6FA5]/20">
                        <span className="block font-mono text-[9px] text-[#4A6FA5] font-bold uppercase tracking-wider mb-1">📲 모바일/기기 간 포트폴리오 백업 가공기 (Data Migration)</span>
                        <p className="text-[9px] text-stone-500 font-sans mb-3">
                          모든 기기(PC, 휴대폰)에 글과 순서가 <strong>실시간 클라우드 동기화</strong>되나, 물리적인 백업 복제를 원하는 경우 아래 백업 다운로드 및 모바일에서 파일 불러오기를 수행하면 원클릭 완벽 통합됩니다.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleExportBackup}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 px-3 rounded font-mono text-[9.5px] font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200"
                          >
                            📥 백업 받기 (Export)
                          </button>
                          
                          <label className="bg-[#4A6FA5]/10 hover:bg-[#4A6FA5]/20 text-[#4A6FA5] py-2 px-3 rounded font-mono text-[9.5px] font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-[#4A6FA5]/20 text-center">
                            📤 백업 적용 (Import)
                            <input
                              type="file"
                              accept=".json"
                              onChange={handleImportBackup}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    {/* 나만의 커스텀 탭 메뉴 제어 (Custom Tabs Manager) */}
                    <div className="border-t border-black/5 pt-3 mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="block font-mono text-[9.5px] text-[#4A6FA5] font-bold uppercase tracking-wider">나만의 커스텀 탭 추가/삭제/비공개 (Custom Navigation Tabs)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingNewCustomTab(true);
                            setEditingCustomTab({
                              id: `menu_${Date.now()}`,
                              name: '',
                              content: '',
                              visible: true,
                              image: ''
                            });
                          }}
                          className="bg-[#4A6FA5] hover:bg-[#3d5e8c] text-white flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded tracking-wide font-extrabold cursor-pointer transition-colors"
                        >
                          <Plus size={10} /> ADD TAB
                        </button>
                      </div>

                      {/* Editing / Creating Custom Tab Form right inside Section 6 */}
                      {editingCustomTab && (
                        <div className="bg-[#F2F1EC] p-4 rounded border border-[#222222]/15 my-3 animate-fade-in text-[11px] leading-relaxed">
                          <h5 className="font-serif text-xs font-bold text-[#4A6FA5] uppercase mb-3 text-left">
                            {isCreatingNewCustomTab ? '🆕 새 커스텀 메뉴 생성' : '⚙️ 기존 커스텀 메뉴 편집'}
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-left">
                            <div>
                              <label className="block font-mono text-[9px] text-[#222222]/70 uppercase mb-0.5 font-bold">메뉴 영문 ID (Slug)</label>
                              <input
                                type="text"
                                placeholder="exhibition"
                                value={editingCustomTab.id}
                                onChange={(e) => setEditingCustomTab({ ...editingCustomTab, id: e.target.value })}
                                disabled={!isCreatingNewCustomTab}
                                className="w-full bg-white p-1.5 border border-[#222222]/15 rounded font-mono text-xs disabled:opacity-50"
                                required
                              />
                            </div>
                            <div>
                              <label className="block font-mono text-[9px] text-[#222222]/70 uppercase mb-0.5 font-bold">메뉴 명칭 (Name)</label>
                              <input
                                type="text"
                                placeholder="Exhibition (전시)"
                                value={editingCustomTab.name}
                                onChange={(e) => setEditingCustomTab({ ...editingCustomTab, name: e.target.value })}
                                className="w-full bg-white p-1.5 border border-[#222222]/15 rounded text-xs animate-none font-sans"
                                required
                              />
                            </div>
                          </div>

                          <div className="mb-3 text-left">
                            <label className="block font-mono text-[9px] text-[#222222]/70 uppercase mb-0.5 font-bold">본문 내용 (Content - 멀티라인)</label>
                            <textarea
                              rows={4}
                              placeholder="보여줄 에세이, 소식 등의 본문을 작성해 주세요."
                              value={editingCustomTab.content || ''}
                              onChange={(e) => setEditingCustomTab({ ...editingCustomTab, content: e.target.value })}
                              className="w-full bg-white p-1.5 border border-[#222222]/15 rounded font-serif-ja text-xs leading-relaxed"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-left">
                            <div>
                              <label className="block font-mono text-[9px] text-[#222222]/70 uppercase mb-0.5 font-bold">대표 배너 이미지 주소</label>
                              <input
                                type="text"
                                placeholder="https://..."
                                value={editingCustomTab.image || ''}
                                onChange={(e) => setEditingCustomTab({ ...editingCustomTab, image: e.target.value })}
                                className="w-full bg-white p-1.5 border border-[#222222]/15 rounded text-xs font-mono"
                              />
                            </div>
                            <div>
                              <label className="block font-mono text-[9px] text-[#222222]/70 uppercase mb-0.5 font-bold">📁 사진 파일 직접 업로드</label>
                              <div className="border border-dashed border-[#4A6FA5]/45 bg-white hover:bg-[#4A6FA5]/5 p-1 rounded text-center transition-colors cursor-pointer relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const compressedData = await compressImageFile(file);
                                        if (compressedData) {
                                          setEditingCustomTab({ ...editingCustomTab, image: compressedData });
                                        }
                                      } catch (err) {
                                        console.error("Custom tab banner upload error:", err);
                                      }
                                    }
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <span className="text-[9px] text-[#4A6FA5] font-mono font-bold">📷 대문 배너 업로드</span>
                              </div>
                            </div>
                          </div>

                          {editingCustomTab.image && (
                            <div className="mb-3 text-left">
                              <div className="max-w-xs h-16 overflow-hidden rounded border">
                                <img src={editingCustomTab.image} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-4 pt-2 border-t">
                            <label className="flex items-center gap-1.5 text-[10px] font-mono cursor-pointer select-none text-left">
                              <input
                                type="checkbox"
                                checked={editingCustomTab.visible !== false}
                                onChange={(e) => setEditingCustomTab({ ...editingCustomTab, visible: e.target.checked })}
                                className="rounded text-[#4A6FA5]"
                              />
                              <span>네비게이션에 즉시 공개</span>
                            </label>

                            <div className="flex gap-1.5 font-sans">
                              <button
                                type="button"
                                onClick={() => setEditingCustomTab(null)}
                                className="bg-stone-300 hover:bg-stone-400 text-stone-800 text-[9px] px-2.5 py-1 rounded cursor-pointer font-bold"
                              >
                                CANCEL
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleSaveCustomTab(e as any)}
                                className="bg-[#4A6FA5] hover:bg-[#3d5e8c] text-white text-[9px] px-3 py-1 rounded font-bold cursor-pointer"
                              >
                                SAVE &amp; APPLY
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Custom Tab List with Visibilities checkboxes and edit / delete / order actions */}
                      <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
                        {customTabs.length === 0 ? (
                          <p className="text-[10px] text-gray-400 italic py-2 text-center text-left">직접 생성한 커스텀 탭이 없습니다.</p>
                        ) : (
                          customTabs.map((ct, idx) => (
                            <div key={ct.id} className="flex items-center justify-between bg-stone-50 hover:bg-stone-100/80 p-2 rounded border border-black/[0.03]">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={ct.visible !== false}
                                  onChange={(e) => {
                                    const updated = customTabs.map(t => t.id === ct.id ? { ...t, visible: e.target.checked } : t);
                                    saveCustomTabsToStorage(updated);
                                  }}
                                  className="rounded text-[#4A6FA5] focus:ring-[#4A6FA5]"
                                  title={ct.visible ? "공개 상태 (활성화)" : "비공개 상태"}
                                />
                                <div className="leading-tight text-left">
                                  <span className="font-serif font-bold text-[#222222] text-[11px] block">{ct.name}</span>
                                  <span className="font-mono text-[8px] text-stone-400">/{ct.id}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <div className="flex gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveCustomTabUp(idx)}
                                    disabled={idx === 0}
                                    className={`p-0.5 border rounded bg-white hover:bg-stone-100 text-[8px] h-5 w-5 flex items-center justify-center font-bold ${idx === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                                    title="위로 이동"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveCustomTabDown(idx)}
                                    disabled={idx === customTabs.length - 1}
                                    className={`p-0.5 border rounded bg-white hover:bg-stone-100 text-[8px] h-5 w-5 flex items-center justify-center font-bold ${idx === customTabs.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                                    title="아래로 이동"
                                  >
                                    ▼
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsCreatingNewCustomTab(false);
                                    setEditingCustomTab(ct);
                                  }}
                                  className="text-stone-500 bg-stone-200/50 hover:bg-stone-300 font-mono text-[8.5px] px-2 py-0.5 rounded cursor-pointer"
                                >
                                  EDIT
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomTab(ct.id)}
                                  className="text-red-500 bg-red-55/70 hover:bg-red-500 hover:text-white font-mono text-[8.5px] px-2 py-0.5 rounded cursor-pointer"
                                >
                                  DEL
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* 4. Journal Log Manager */}
                <div className="bg-white/60 border p-6 rounded">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-serif text-sm tracking-wider font-bold text-[#222222] uppercase">
                      4. JOURNAL LOGS ({journals.length})
                    </h4>
                    <button 
                      onClick={() => {
                        setIsCreatingNewJournal(true);
                        setEditingJournal({
                          id: `journal-${Date.now()}`,
                          title: '',
                          content: '',
                          date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
                          images: [fukuokaRainImg]
                        });
                      }}
                      className="bg-[#4A6FA5] text-white font-mono text-[9px] px-2 py-0.5 rounded hover:bg-[#3d5e8c]"
                    >
                      + ADD
                    </button>
                  </div>

                  {editingJournal && (
                    <form onSubmit={handleSaveJournal} className="bg-[#F2F1EC] p-3 rounded border border-[#222222]/15 mb-4 text-xs flex flex-col gap-2">
                      <div>
                        <label className="block font-mono text-[9px] uppercase">일기 제목</label>
                        <input 
                          type="text" 
                          value={editingJournal.title || ''}
                          onChange={(e) => setEditingJournal({...editingJournal, title: e.target.value})}
                          className="w-full bg-white p-1.5 border border-[#222222]/15 rounded text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[9px] uppercase">작성일</label>
                        <input 
                          type="text" 
                          value={editingJournal.date || ''}
                          onChange={(e) => setEditingJournal({...editingJournal, date: e.target.value})}
                          className="w-full bg-white p-1.5 border border-[#222222]/15 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[9px] uppercase">글감 내용 (Content)</label>
                        <textarea 
                          rows={4}
                          value={editingJournal.content || ''}
                          onChange={(e) => setEditingJournal({...editingJournal, content: e.target.value})}
                          className="w-full bg-white p-1.5 border border-[#222222]/15 rounded text-xs font-serif-ja leading-relaxed"
                          required
                        />
                      </div>
                      {/* Local File Uploader for Journal images and videos */}
                      <div className="mt-2">
                        <span className="block text-[9px] uppercase font-mono font-bold mb-1">📂 로컬 미디어 파일 업로드 (이미지 및 동영상):</span>
                        <div className="border-2 border-dashed border-[#4A6FA5]/30 hover:border-[#4A6FA5] hover:bg-[#4A6FA5]/5 p-3 rounded text-center transition-colors cursor-pointer relative">
                          <input 
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={(e) => {
                              if (e.target.files) {
                                const filesArray = Array.from(e.target.files) as File[];
                                filesArray.forEach(async (file) => {
                                  try {
                                    if (file.type.startsWith('video/')) {
                                      if (file.size > 15 * 1024 * 1024) {
                                        alert("경고: 업로드하신 동영상 크기가 15MB를 초과합니다. 쾌적한 재생을 위해 가급적 5M~10MB 내외의 비디오 파일을 권장합니다.");
                                      }
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        if (typeof reader.result === 'string') {
                                          const videoDataUrl = reader.result;
                                          setEditingJournal(prev => {
                                            if (!prev) return null;
                                            const currentImgs = prev.images || [];
                                            return {
                                              ...prev,
                                              images: [...currentImgs, videoDataUrl]
                                            };
                                          });
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    } else {
                                      const compressedData = await compressImageFile(file as File);
                                      if (compressedData) {
                                        setEditingJournal(prev => {
                                          if (!prev) return null;
                                          const currentImgs = prev.images || [];
                                          return {
                                            ...prev,
                                            images: [...currentImgs, compressedData]
                                          };
                                        });
                                      }
                                    }
                                  } catch (err) {
                                    console.error("Journal image/video compression error:", err);
                                  }
                                });
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <p className="text-[10px] text-[#222222]/70 font-mono">📷 클릭하거나 미디어를 드래그하여 업로드 (사진/동영상 다중 선택 가능)</p>
                        </div>
                        {editingJournal.images && editingJournal.images.length > 0 && (
                          <div className="mt-3">
                            <span className="text-[10px] text-[#222222]/80 block mb-1 font-bold">
                              📷 등록된 미디어 목록 ({editingJournal.images.length}개)
                            </span>
                            <p className="text-[9px] text-[#4A6FA5] font-semibold mb-2 bg-sky-50 p-1.5 rounded leading-normal border border-sky-100">
                              💡 <b>순서 변경 방법</b>: 항목을 마우스로 직접 <b>드래그 앤 드롭</b>하여 끌어다 놓거나, 모바일에서는 <b>바꾸고 싶은 두 항목을 차례대로 터치</b>하면 간편하게 순서가 바뀝니다!
                            </p>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto bg-stone-100 p-2 rounded border border-stone-200">
                              {editingJournal.images.map((img, idx) => {
                                const isDragged = draggedJournalImageIdx === idx;
                                const isHovered = dragHoverJournalImageIdx === idx;
                                const isSelected = selectedReorderJournalImageIdx === idx;
                                const hasSelectionInList = selectedReorderJournalImageIdx !== null;

                                return (
                                  <div 
                                    key={idx} 
                                    draggable={true}
                                    onDragStart={(e) => {
                                      setDraggedJournalImageIdx(idx);
                                      e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnter={(e) => {
                                      e.preventDefault();
                                      setDragHoverJournalImageIdx(idx);
                                    }}
                                    onDragLeave={() => {
                                      if (dragHoverJournalImageIdx === idx) setDragHoverJournalImageIdx(null);
                                    }}
                                    onDragEnd={() => {
                                      setDraggedJournalImageIdx(null);
                                      setDragHoverJournalImageIdx(null);
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      handleDropJournalImage(idx);
                                    }}
                                    onClick={(e) => {
                                      const target = e.target as HTMLElement;
                                      if (target.closest('button')) return;
                                      
                                      if (selectedReorderJournalImageIdx === null) {
                                        setSelectedReorderJournalImageIdx(idx);
                                      } else {
                                        if (selectedReorderJournalImageIdx !== idx) {
                                          const newImages = [...(editingJournal.images || [])];
                                          const draggedImg = newImages[selectedReorderJournalImageIdx];
                                          newImages.splice(selectedReorderJournalImageIdx, 1);
                                          newImages.splice(idx, 0, draggedImg);
                                          setEditingJournal({ ...editingJournal, images: newImages });
                                        }
                                        setSelectedReorderJournalImageIdx(null);
                                      }
                                    }}
                                    className={`relative w-20 h-20 rounded overflow-hidden border bg-stone-200 transition-all duration-250 cursor-grab active:cursor-grabbing group/journalmedia flex flex-col justify-between select-none
                                      ${isDragged ? 'opacity-30 border-dashed border-sky-400 bg-sky-50 scale-95' : 'border-stone-300'}
                                      ${isHovered ? 'scale-105 border-double border-2 border-sky-500 shadow-md ring-1 ring-sky-300 z-10' : ''}
                                      ${isSelected ? 'scale-105 ring-2 ring-[#4A6FA5] border-[#4A6FA5] z-10 shadow-lg' : ''}
                                      ${!isSelected && hasSelectionInList ? 'hover:border-sky-300 active:scale-102' : ''}
                                    `}
                                  >
                                    {isVideoUrl(img) ? (
                                      <video 
                                        src={getPlayableVideoUrl(img)} 
                                        className="w-full h-full object-cover pointer-events-none" 
                                        ref={(el) => {
                                          if (el) {
                                            el.setAttribute('muted', 'true');
                                            el.setAttribute('playsinline', 'true');
                                            el.muted = true;
                                            el.playsInline = true;
                                            el.play().catch(() => {});
                                          }
                                        }}
                                        muted 
                                        playsInline 
                                      />
                                    ) : (
                                      <img src={img} className="w-full h-full object-cover pointer-events-none" alt="Preview" referrerPolicy="no-referrer" />
                                    )}
                                    
                                    {/* Visual Indicator of Move Selection */}
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-[#4A6FA5]/25 flex items-center justify-center pointer-events-none">
                                        <div className="bg-[#4A6FA5] text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow animate-pulse">
                                          여기 클릭시 이동
                                        </div>
                                      </div>
                                    )}

                                    {/* Drag & Drop Visual Indicator overlay when there is any item dragged */}
                                    {draggedJournalImageIdx !== null && !isDragged && (
                                      <div className="absolute inset-0 bg-transparent border-dashed border border-sky-400/50 pointer-events-none flex items-center justify-center">
                                        <div className="text-[7px] text-sky-600 bg-white/95 px-1 rounded shadow-sm">놓기</div>
                                      </div>
                                    )}

                                    {/* Hover Control Overlay with Index and Delete */}
                                    <div className="absolute inset-x-0 bottom-0 bg-black/65 p-1 opacity-0 group-hover/journalmedia:opacity-100 transition-opacity flex justify-between items-center z-10">
                                      <span className="text-white text-[8px] font-mono font-bold tracking-tighter">#{idx + 1}</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingJournal({
                                            ...editingJournal,
                                            images: editingJournal.images.filter((_, i) => i !== idx)
                                          });
                                          if (selectedReorderJournalImageIdx === idx) setSelectedReorderJournalImageIdx(null);
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white px-1.5 py-0.5 rounded text-[8px] font-bold cursor-pointer transition-colors"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                    
                                    {/* Permanent index label */}
                                    <div className="absolute top-1 left-1 bg-black/50 text-white font-mono text-[7px] px-1 rounded z-10">
                                      #{idx + 1}
                                    </div>

                                    {/* Permanent Grip handle hint */}
                                    <div className="absolute top-1 right-1 bg-white/75 text-gray-700 p-0.5 rounded-full shadow-sm cursor-grab group-hover/journalmedia:bg-white transition-colors z-10">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grip-vertical"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 justify-end mt-2">
                        <button type="button" onClick={() => setEditingJournal(null)} className="bg-stone-300 p-1 rounded font-mono text-[10px]">CANC</button>
                        <button type="submit" className="bg-[#4A6FA5] text-white p-1 rounded font-mono text-[10px]">SAVE</button>
                      </div>
                    </form>
                  )}

                  <div className="flex flex-col gap-2">
                    {journals.map((post, index) => (
                      <div key={post.id} className="bg-white border p-2 rounded flex justify-between items-center text-xs animate-fadeIn">
                        <div className="flex items-center gap-3">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button 
                              type="button"
                              onClick={() => handleMoveJournalUp(index)}
                              disabled={index === 0}
                              className={`p-0.5 border rounded-sm text-[7px] hover:bg-stone-100 flex items-center justify-center h-4 w-4 ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                              title="위로 이동"
                            >
                              ▲
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleMoveJournalDown(index)}
                              disabled={index === journals.length - 1}
                              className={`p-0.5 border rounded-sm text-[7px] hover:bg-stone-100 flex items-center justify-center h-4 w-4 ${index === journals.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                              title="아래로 이동"
                            >
                              ▼
                            </button>
                          </div>
                          <div>
                            <p className="font-serif-ja font-bold text-[#222222] truncate max-w-[12rem]">{post.title}</p>
                            <span className="font-mono text-[9px] text-[#222222]/45 block leading-none mt-0.5">{post.date}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            type="button" 
                            onClick={() => { setEditingJournal(post); setIsCreatingNewJournal(false); }}
                            className="bg-[#4a6fa5]/10 text-[#4a6fa5] hover:bg-[#4a6fa5] hover:text-white px-2 py-0.5 rounded text-[8px] font-mono transition-colors cursor-pointer"
                          >
                            EDIT
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteJournal(post.id)}
                            className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-2 py-0.5 rounded text-[8px] font-mono transition-colors cursor-pointer"
                          >
                            DEL
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* 7. Emotion Portal Keywords */}
                <div className="bg-white/60 border p-6 rounded animate-fade-in mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-serif text-sm tracking-wider font-bold text-[#222222] uppercase">
                      7. EMOTION PORTAL KEYWORDS ({emotions.length})
                    </h4>
                    <button 
                      onClick={() => {
                        setIsCreatingNewEmotion(true);
                        setEditingEmotion({
                          name: '',
                          english: '',
                          description: '',
                          detail: ''
                        });
                      }}
                      className="bg-[#4A6FA5] text-white font-mono text-[9px] px-2 py-0.5 rounded hover:bg-[#3d5e8c]"
                    >
                      + ADD
                    </button>
                  </div>

                  {editingEmotion && (
                    <form onSubmit={handleSaveEmotion} className="bg-[#F2F1EC] p-3 rounded border border-[#222222]/15 mb-4 text-xs flex flex-col gap-2 animate-fade-in">
                      <h5 className="font-serif text-xs font-bold text-[#4A6FA5] uppercase">
                        {isCreatingNewEmotion ? '🆕 새 감정 분위기 추가' : '⚙️ 감정 분위기 세부 수정'}
                      </h5>
                      <div>
                        <label className="block font-mono text-[9px] uppercase font-bold">감정 한글 단어 (Name)</label>
                        <input 
                          type="text" 
                          placeholder="예: 그리움, 고요, 푸름..."
                          value={editingEmotion.name || ''}
                          onChange={(e) => setEditingEmotion({...editingEmotion, name: e.target.value})}
                          className="w-full bg-white p-1.5 border border-[#222222]/15 rounded text-xs animate-none font-sans"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[9px] uppercase font-bold">영문 레이블 (English)</label>
                        <input 
                          type="text" 
                          placeholder="예: Nostalgia, Serenity, Azure..."
                          value={editingEmotion.english || ''}
                          onChange={(e) => setEditingEmotion({...editingEmotion, english: e.target.value})}
                          className="w-full bg-white p-1.5 border border-[#222222]/15 rounded text-xs font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[9px] uppercase font-bold">메인 목록 서문 (Description - Main Screen)</label>
                        <textarea 
                          rows={2}
                          placeholder="포탈 메인 채널 보드에 보일 한 줄 에세이..."
                          value={editingEmotion.description || ''}
                          onChange={(e) => setEditingEmotion({...editingEmotion, description: e.target.value})}
                          className="w-full bg-white p-1.5 border border-[#222222]/15 rounded text-xs font-serif-ja leading-relaxed"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[9px] uppercase font-bold">에세이 필터링 페이지 서문 (Detail Description - Filter Page)</label>
                        <textarea 
                          rows={2}
                          placeholder="해당 감정을 필터링했을 때 상단 헤더에 들어갈 아련한 느낌의 한 줄 에세이..."
                          value={editingEmotion.detail || ''}
                          onChange={(e) => setEditingEmotion({...editingEmotion, detail: e.target.value})}
                          className="w-full bg-white p-1.5 border border-[#222222]/15 rounded text-xs font-serif-ja leading-relaxed"
                          required
                        />
                      </div>

                      <div className="flex gap-2 justify-end mt-2 pt-2 border-t text-right">
                        <button 
                          type="button" 
                          onClick={() => setEditingEmotion(null)} 
                          className="bg-stone-300 hover:bg-stone-400 p-1 rounded font-mono text-[10px] px-2.5 font-bold cursor-pointer"
                        >
                          CANCEL
                        </button>
                        <button 
                          type="submit" 
                          className="bg-[#4A6FA5] hover:bg-[#3d5e8c] text-white p-1 rounded font-mono text-[10px] px-3 font-bold cursor-pointer animate-none"
                        >
                          SAVE &amp; APPLY
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="flex flex-col gap-2">
                    {emotions.map((emo, index) => (
                      <div key={emo.name} className="bg-white border p-2 rounded flex justify-between items-center text-xs animate-fadeIn hover:bg-stone-50 transition-colors">
                        <div className="flex items-center gap-3">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button 
                              type="button"
                              onClick={() => handleMoveEmotionUp(index)}
                              disabled={index === 0}
                              className={`p-0.5 border rounded-sm text-[7px] hover:bg-stone-100 flex items-center justify-center h-4 w-4 ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                              title="위로 이동"
                            >
                              ▲
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleMoveEmotionDown(index)}
                              disabled={index === emotions.length - 1}
                              className={`p-0.5 border rounded-sm text-[7px] hover:bg-stone-100 flex items-center justify-center h-4 w-4 ${index === emotions.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                              title="아래로 이동"
                            >
                              ▼
                            </button>
                          </div>
                          <div>
                            <p className="font-serif-ja font-bold text-[#222222] truncate max-w-[12rem]">{emo.name}</p>
                            <span className="font-mono text-[9px] text-[#222222]/45 block leading-none mt-0.5">{emo.english}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            type="button" 
                            onClick={() => { 
                              setEditingEmotion({
                                originalName: emo.name,
                                name: emo.name,
                                english: emo.english,
                                description: emo.description,
                                detail: emo.detail
                              }); 
                              setIsCreatingNewEmotion(false); 
                            }}
                            className="bg-[#4a6fa5]/10 text-[#4a6fa5] hover:bg-[#4a6fa5] hover:text-white px-2 py-0.5 rounded text-[8px] font-mono transition-colors cursor-pointer"
                          >
                            EDIT
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteEmotion(emo.name)}
                            className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-2 py-0.5 rounded text-[8px] font-mono transition-colors cursor-pointer"
                          >
                            DEL
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[9.5px] text-[#222222]/40 font-serif leading-relaxed mt-4">
                    ※ 감정 키워드를 직접 추가/삭제/수정할 수 있습니다. 감정이 수정되거나 삭제될 시, 해당 감정을 사용하던 기존 에세이에도 변경 사항이 안전하게 자동 연쇄 적용(Cascade update/delete)됩니다.
                  </p>
                </div>

              </div>

            </div>



          </div>
        )}

      </div>

      {/* --- Global Minimalist Grid Footer --- */}
      <footer className="w-full bg-[#F7F6F2] py-14 select-none px-6 md:px-12 mt-16 border-t border-black/[0.05]">
        <div className="max-w-[100rem] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center">
          
          {/* Column 1: App Info (Left aligned on md+) */}
          <div className="flex gap-2 items-center justify-center md:justify-start text-[#222222]/50 text-[10.5px] font-sans tracking-widest uppercase">
            <span className="font-serif text-[11.5px] font-semibold text-[#222222]/70">MACOLORIS BLUE</span>
            <span>&middot;</span>
            <span className="text-[9.5px]">日本の青 記録</span>
          </div>

          {/* Column 2: Social Links (Centered on md+) */}
          {visibleSections.footerContact !== false ? (
            <div className="flex justify-center items-center gap-6 text-[10.5px] font-sans tracking-widest text-[#222222]/50 animate-fade-in">
              <a 
                href="https://www.instagram.com/macolorisblue" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 hover:text-[#4A6FA5] transition-colors"
              >
                <Instagram size={11} className="text-[#4A6FA5]" />
                <span>{contact.instagram}</span>
              </a>
              <a 
                href={`mailto:${contact.email}`} 
                className="flex items-center gap-1.5 hover:text-[#4A6FA5] transition-colors"
              >
                <Mail size={11} className="text-[#4A6FA5]" />
                <span>{contact.email}</span>
              </a>
            </div>
          ) : (
            <div />
          )}

          {/* Column 3: Copyright (Right aligned on md+) */}
          <div 
            onClick={triggerSecretAdmin} 
            className="text-[9px] font-mono tracking-[0.15em] text-[#222222]/30 uppercase text-center md:text-right cursor-pointer select-none active:opacity-60 transition-opacity"
          >
            &copy; {new Date().getFullYear()} ALL RIGHTS RESERVED
          </div>

        </div>
      </footer>

    </main>
  </div>
  );
}
