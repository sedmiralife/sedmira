// Конфигурация программ тренировок по дням недели (0 - Воскресенье, 1 - Понедельник и т.д.)
const PROGRAM = {
  1: { 
    label: 'Понедельник', 
    items: [
      { id: 'pushups', name: 'Отжимания', cat: 'Грудь / Трицепс', sets: 5, reps: 20, rest: 120 }
    ]
  },
  2: { 
    label: 'Вторник', 
    items: [
      { id: 'pullups', name: 'Подтягивания', cat: 'Спина / Бицепс', sets: 5, reps: 10, rest: 120 }
    ]
  },
  3: { 
    label: 'Среда', 
    items: [
      { id: 'squats_double', name: 'Двойные приседания', cat: 'Бёдра', sets: 5, reps: 20, rest: 120 },
      { id: 'abs_bike', name: 'Велосипед', cat: 'Пресс', sets: 5, reps: 20, rest: 60 }
    ]
  },
  4: { 
    label: 'Четверг', 
    items: [
      { id: 'pushups', name: 'Отжимания', cat: 'Грудь / Трицепс', sets: 5, reps: 20, rest: 120 }
    ]
  },
  5: { 
    label: 'Пятница', 
    items: [
      { id: 'pullups', name: 'Подтягивания', cat: 'Спина / Бицепс', sets: 5, reps: 10, rest: 120 }
    ]
  },
  6: { 
    label: 'Суббота', 
    items: [
      { id: 'squats_bulgarian', name: 'Болгарские приседания', cat: 'Бёдра', sets: 5, reps: 20, rest: 120 },
      { id: 'abs_bike', name: 'Велосипед', cat: 'Пресс', sets: 5, reps: 20, rest: 60 }
    ]
  },
  0: { 
    label: 'Воскресенье', 
    items: [] // День отдыха
  }
};

// Группировка упражнений для аналитики и графиков
const GROUPS = [
  { key: 'pushups', label: 'Отжимания', ids: ['pushups'] },
  { key: 'pullups', label: 'Подтягивания', ids: ['pullups'] },
  { key: 'squats', label: 'Приседания', ids: ['squats_double', 'squats_bulgarian'] },
  { key: 'abs', label: 'Пресс', ids: ['abs_bike'] }
];

// Ключи доступа и вспомогательные константы
const MONTHS = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const JSONBIN_BIN_ID = '6a845072da38895dfef2a60a';
const JSONBIN_API_KEY = '$2a$10$hrlyDpiijedwRt9tLzC4ouo0T8PgPgOL6kau/tNKUPFQApIQx9z5O';
