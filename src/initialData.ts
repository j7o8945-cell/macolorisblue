import { Work, Journal, AboutInfo, ContactInfo } from './types';

// Curated high quality photography of Japan from Unsplash and our generated assets
export const INITIAL_WORKS: Work[] = [
  {
    id: 'work-1',
    title: '春が終わる頃 (봄이 끝날 무렵)',
    year: 2026,
    location: 'Fukuoka / Tokyo',
    date: '2026.05',
    emotion: '청춘',
    preface: `그날은 특별한 일이 없었다.\n\n퇴근하는 사람들, 빨간 신호등, 편의점 앞에 놓인 자전거.\n\n그런데 이상하게도 모든 것이 조금 아름다워 보였다.\n\n나는 그 감정을 잊고 싶지 않았다. 이윽고 불어온 남풍에 흩어지던 봄날의 잔상들.`,
    images: [
      '/src/assets/images/home_hero_1780643011034.png',
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524413840003-05898d0c4765?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=1000&auto=format&fit=crop&q=80'
    ],
    closing: '또 생각이 나면, 이곳으로 돌아오겠지. 봄은 그렇게 짧게 머물렀다.',
    featured: true
  },
  {
    id: 'work-2',
    title: '名前のない夕方 (이름 없는 저녁)',
    year: 2026,
    location: 'Kyoto',
    date: '2026.03',
    emotion: '그리움',
    preface: `해질녘의 하늘은 너무나도 푸르고 붉어서,\n\n우리가 나누었던 말이 어떤 온도였는지 잊게 만들었다.\n\n누구의 것도 아닌 시간, 골목 어귀에 살포시 번지는 이름 없는 쓸쓸함.\n\n나는 매일 저녁 같은 길을 걸었다.`,
    images: [
      '/src/assets/images/blue_station_1780643044740.png',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1000&auto=format&fit=crop&q=80'
    ],
    closing: '또 마음에 아지랑이가 필 때 즈음, 이 기억을 꺼내어 볼 테다.',
    featured: true
  },
  {
    id: 'work-3',
    title: '青を探して歩く。 (블루 크로싱)',
    year: 2025,
    location: 'Tokyo / Kamakura',
    date: '2025.07',
    emotion: '여름',
    preface: `유난히 긴 겨울이 지나고 찾아온 것은,\n\n비명 소리 같은 선명하게 우는 매미 소리와 한없이 푸른 하늘이었다.\n\n바닷바람에 실려 오던 소금기 짙은 냄새.\n\n땀에 젖은 셔츠 마저 사랑스러웠던 그해 여름의 파란색 기록.`,
    images: [
      '/src/assets/images/summer_crossing_1780643057527.png',
      'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80'
    ],
    closing: '뜨거웠던 바람은 언제나 마음 한구석 깊고 푸른 자리에 숨어 산다.',
    featured: true
  },
  {
    id: 'work-4',
    title: 'ひとりだけの冬 (혼자만의 겨울)',
    year: 2025,
    location: 'Hokkaido',
    date: '2025.12',
    emotion: '외로움',
    preface: `하얀 입김이 가득 채우던 하코다테의 전차 정류소.\n\n길을 잃은 나에게 건네진 차가운 눈발.\n\n아무도 밟지 않은 소복한 백색 위에서야 비로소 깨닫는다.\n\n외로움이란, 투명한 바람 같은 것임을.`,
    images: [
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524413840003-05898d0c4765?w=1000&auto=format&fit=crop&q=80'
    ],
    closing: '차가운 저녁, 다시 눈이 내리기 시작했다.',
    featured: true
  },
  {
    id: 'work-5',
    title: '青の記憶 (푸른 호흡)',
    year: 2024,
    location: 'Okinawa',
    date: '2024.09',
    emotion: '여름',
    preface: `지평선 끝에 걸려 있던 남빛 구름.\n\n파도가 쓸고 간 고요한 모래사장 위에서 보았던 산들바람.\n\n더 이상 깊어질 곳 없는 심해의 색을 보고 있으면 온 감격이 입안을 가득 채운다.`,
    images: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=1000&auto=format&fit=crop&q=80'
    ],
    closing: '파란빛을 등지고 멀어지던 해질녘의 긴 여운.',
    featured: true
  },
  {
    id: 'work-6',
    title: '暮れなずむ街 (저물어가는 거리)',
    year: 2024,
    location: 'Osaka',
    date: '2024.04',
    emotion: '그리움',
    preface: `붉은 벽돌 뒤로 그늘이 드리워지던 뒷골목.\n\n낡은 라디오 장식, 저물어가는 해질녘 노을과 소박한 상점가.\n\n사라져가는 무정함 속에서 영원을 비추는 빛을 건져 올려 한 장에 담아둔다.`,
    images: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1000&auto=format&fit=crop&q=80'
    ],
    closing: '빛나던 순간은 아쉽게도 늘 찰나에 지나지 않았다.',
    featured: true
  }
];

export const INITIAL_JOURNALS: Journal[] = [
  {
    id: 'journal-1',
    title: '후쿠오카의 비',
    content: `비가 내리는 후쿠오카의 골목은 유난히 깊은 채도로 옷을 갈아입는다.
빛 바랜 자판기, 타일 벽에 튀기는 투명한 물방울, 멀리서 울리는 차분한 노면전차의 구동음.
우산을 받쳐 들고 텐진의 뒷골목을 걸으며 마주했던 그 풍경 속에서,
기억은 가랑비처럼 소리 없이 스며든다.
비는 장소를 감상으로 치환하는 묘한 마력을 가졌다.`,
    date: '2026.04.12',
    images: [
      '/src/assets/images/fukuoka_rain_1780643028212.png',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1000&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'journal-2',
    title: '마지막 열차',
    content: `자정을 넘긴 간이역 정류소.
플랫폼 끝자락에 울리는 소리 없는 초침 소리.
떠나가는 열차 창문 너머로 보이던 익명의 얼굴들.
지친 어깨를 이끌고 돌아가는 그들의 시선을 지키던 밤빛 속에서,
나는 마침내 나만의 속도로 숨을 쉰다.
마음이 고요해지던 막차 역전의 시선.`,
    date: '2026.03.20',
    images: [
      '/src/assets/images/blue_station_1780643044740.png',
      'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=1000&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'journal-3',
    title: '편의점 불빛',
    content: `고독한 밤길을 지키는 등대이자 나그네의 작은 성지.
차가운 화이트 형광등 불빛 아래 정연히 놓인 음료 캔들,
비닐 봉지를 흔들며 총총히 사라지는 사람들의 뒤태.
어두운 골목 구석을 홀로 푸르게 비추는 이 보잘것없는 도심의 등대가
이상하리만치 마음을 편안하게 만들어주는 날이 있다.`,
    date: '2026.02.15',
    images: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1000&auto=format&fit=crop&q=80'
    ]
  }
];

export const INITIAL_ABOUT: AboutInfo = {
  birthYear: '1997',
  birthPlace: '한국 출생',
  profession: '사회복지사',
  biography: `사진을 시작한 뒤 일본의 평범한 순간들을 기록하고 있다.\n\n특별하고 거창한 랜드마크보다,\n누구 한 명 주목하지 않는 평범한 시간 속에서 아지랑이처럼 번지는 애틋한 감정을 사랑한다.`,
  equipments: [
    'FUJIFILM X-T4',
    'TAMRON 18-300mm F3.5-6.3',
    'OLYMPUS ZUIKO 55mm F1.2'
  ]
};

export const INITIAL_CONTACT: ContactInfo = {
  instagram: '@macolorisblue',
  email: 'fkdlsh74jp@gmail.com'
};
