// ========== ТАЙТЛЫ ==========
const titlesDatabase = [
    {
        id: 'dandadan',
        name: 'ДанДаДан',
        nameEn: 'DanDaDan',
        imageVertical: 'images/dandadan_vert.jpg',
        imageHorizontal: 'images/dandadan_horiz.jpg',
        type: 'Сериал',
        seasons: 1,
        episodes: 12,
        year: 2024,
        rating: 5,
        genres: ['Комедия', 'Экшен', 'Романтика'],
        description: 'Момо и Окарун — обычные старшеклассники, которые вдруг сталкиваются с пришельцами и духами. Их жизнь переворачивается с ног на голову!',
        episodesList: [
            { number: 1, title: 'Первая серия', url: 'https://drive.google.com/file/d/XXXXX1/preview', status: 'Озвучено' },
            { number: 2, title: 'Вторая серия', url: 'https://drive.google.com/file/d/XXXXX2/preview', status: 'Озвучено' },
            { number: 3, title: 'Третья серия', url: 'https://drive.google.com/file/d/XXXXX3/preview', status: 'Озвучено' },
            { number: 4, title: 'Четвёртая серия', url: 'https://drive.google.com/file/d/XXXXX4/preview', status: 'Озвучено' },
            { number: 5, title: 'Пятая серия', url: 'https://drive.google.com/file/d/XXXXX5/preview', status: 'Озвучено' },
            { number: 6, title: 'Шестая серия', url: 'https://drive.google.com/file/d/XXXXX6/preview', status: 'Озвучено' },
            { number: 7, title: 'Седьмая серия', url: 'https://drive.google.com/file/d/XXXXX7/preview', status: 'Озвучено' },
            { number: 8, title: 'Восьмая серия', url: '', status: 'Скоро' },
            { number: 9, title: 'Девятая серия', url: '', status: 'Скоро' },
            { number: 10, title: 'Десятая серия', url: '', status: 'Скоро' },
            { number: 11, title: 'Одиннадцатая серия', url: '', status: 'Скоро' },
            { number: 12, title: 'Двенадцатая серия', url: '', status: 'Скоро' },
        ]
    },
    {
        id: 'tatsuki_fujimoto_17-26',
        name: 'Тацуки Фудзимото "17-26"',
        nameEn: 'Tatsuki Fujimoto "17-26"',
        imageVertical: 'images/fujimoto_vert.jpg',
        imageHorizontal: 'images/fujimoto_horiz.jpg',
        type: 'Сериал',
        seasons: 1,
        episodes: 8,
        year: 2025,
        rating: 4.5,
        genres: [],
        description: '',
        episodesList: [
            { number: 1, title: 'Серия 1', url: '', status: 'Скоро' },
            { number: 2, title: 'Серия 2', url: '', status: 'Скоро' },
            { number: 3, title: 'Серия 3', url: '', status: 'Скоро' },
            { number: 4, title: 'Серия 4', url: '', status: 'Скоро' },
            { number: 5, title: 'Серия 5', url: '', status: 'Скоро' },
            { number: 6, title: 'Серия 6', url: '', status: 'Скоро' },
            { number: 7, title: 'Серия 7', url: '', status: 'Скоро' },
            { number: 8, title: 'Серия 8', url: '', status: 'Скоро' },
        ]
    },
    {
        id: 'trapezoid',
        name: 'Трапеция',
        nameEn: 'Trapezoid',
        imageVertical: 'images/trapezoid_vert.jpg',
        imageHorizontal: 'images/trapezoid_horiz.jpg',
        type: 'Фильм',
        seasons: 1,
        episodes: 1,
        year: 2024,
        rating: 4.0,
        genres: [],
        description: '',
        episodesList: [
            { number: 1, title: 'Фильм', url: '', status: 'Скоро' },
        ]
    },
    {
        id: 'alice_and_theresa',
        name: 'Фабрика иллюзий Алисы и Терезы',
        nameEn: 'Alice and Theresa\'s Illusion Factory',
        imageVertical: 'images/alice_theresa_vert.jpg',
        imageHorizontal: 'images/alice_theresa_horiz.jpg',
        type: 'Фильм',
        seasons: 1,
        episodes: 1,
        year: 2023,
        rating: 4.2,
        genres: [],
        description: '',
        episodesList: [
            { number: 1, title: 'Фильм', url: '', status: 'Скоро' },
        ]
    },
    {
        id: 'promised_neverland',
        name: 'Обещанный Неверленд',
        nameEn: 'The Promised Neverland',
        imageVertical: 'images/neverland_vert.jpg',
        imageHorizontal: 'images/neverland_horiz.jpg',
        type: 'Сериал',
        seasons: 1,
        episodes: 12,
        year: 2019,
        rating: 4.8,
        genres: [],
        description: '',
        episodesList: [
            { number: 1, title: 'Серия 1', url: '', status: 'Скоро' },
            { number: 2, title: 'Серия 2', url: '', status: 'Скоро' },
            { number: 3, title: 'Серия 3', url: '', status: 'Скоро' },
            { number: 4, title: 'Серия 4', url: '', status: 'Скоро' },
            { number: 5, title: 'Серия 5', url: '', status: 'Скоро' },
            { number: 6, title: 'Серия 6', url: '', status: 'Скоро' },
            { number: 7, title: 'Серия 7', url: '', status: 'Скоро' },
            { number: 8, title: 'Серия 8', url: '', status: 'Скоро' },
            { number: 9, title: 'Серия 9', url: '', status: 'Скоро' },
            { number: 10, title: 'Серия 10', url: '', status: 'Скоро' },
            { number: 11, title: 'Серия 11', url: '', status: 'Скоро' },
            { number: 12, title: 'Серия 12', url: '', status: 'Скоро' },
        ]
    }
];

// ========== ДАББЕРЫ ==========
const voicesDatabase = [
    { 
        id: 'runi',
        name: 'Руни',
        nameEn: 'Runi',
        image: 'images/runi.jpg',
        roleType: 'dubber',
        status: 'Основатель студии, даббер',
        joinDate: '2025',
        bio: 'Основатель студии, даббер',
        social: { vk: 'id619472027', telegram: 'kkxzsyUwU' }
    },
    { 
        id: 'miki-angel',
        name: 'Miki-angel',
        nameRu: 'Мики',
        image: 'images/miki.jpg',
        roleType: 'dubber',
        status: 'Даббер',
        joinDate: '2025',
        bio: 'Даббер',
        social: { telegram: 'kadrzakadrommikiangel' }
    },
    { 
        id: 'chep',
        name: 'chep',
        nameRu: 'Чеп',
        image: 'images/chep.jpg',
        roleType: 'both',
        status: 'Даббер, веб-разработчик',
        joinDate: '2026',
        bio: 'Даббер, веб-разработчик',
        social: { telegram: 'chepsdub' }
    },
    { 
        id: 'diablo',
        name: 'Diablo',
        nameRu: 'Диабло',
        image: 'images/diablo.jpg',
        roleType: 'dubber',
        status: 'Даббер',
        joinDate: '2026',
        bio: 'Даббер',
        social: {}
    },
    { 
        id: 'nik-gus',
        name: 'Никита Гусельников',
        nameEn: 'Nikita Guselnikov',
        image: 'images/nik-gus.jpg',
        roleType: 'dubber',
        status: 'Даббер',
        joinDate: '2026',
        bio: 'Даббер',
        social: {}
    },
    { 
        id: 'libertea',
        name: 'LiberTea',
        nameRu: 'ЛиберТи',
        image: 'images/LiberTea.jpg',
        roleType: 'both',
        status: 'Даббер, звукорежиссёр',
        joinDate: '2026',
        bio: 'Даббер, звукорежиссёр',
        social: {}
    },
    { 
        id: 'noty',
        name: 'Noty',
        nameRu: 'Ноти',
        image: 'images/noty.jpg',
        roleType: 'dubber',
        status: 'Даббер',
        joinDate: '2026',
        bio: 'Даббер',
        social: {}
    },
    { 
        id: 'roma',
        name: 'Рома',
        nameEn: 'Roma',
        image: 'images/roma.jpg',
        roleType: 'dubber',
        status: 'Даббер',
        joinDate: '2026',
        bio: 'Даббер',
        social: {}
    },
    { 
        id: 'tenmag',
        name: 'Tenmag',
        nameRu: 'Тенмаг',
        image: 'images/tenmag.jpg',
        roleType: 'both',
        status: 'Даббер, звукорежиссёр',
        joinDate: '2026',
        bio: 'Даббер, звукорежиссёр',
        social: {}
    },
    { 
        id: 'hikkou',
        name: 'hikkou',
        nameRu: 'Хиккоу',
        image: 'images/hikkou.jpg',
        roleType: 'dubber',
        status: 'Даббер',
        joinDate: '2026',
        bio: 'Даббер',
        social: {}
    },
    { 
        id: 'katsyri',
        name: 'Katsyri',
        nameRu: 'Кацури',
        image: 'images/katsyri.jpg',
        roleType: 'dubber',
        status: 'Даббер',
        joinDate: '2025',
        bio: 'Даббер',
        social: { telegram:'katsyrii' }
    },
    { 
        id: 'anonym8',
        name: 'Anonym8',
        nameRu: 'Аноним8',
        image: 'images/anonym8.jpg',
        roleType: 'dubber',
        status: 'Даббер',
        joinDate: '2026',
        bio: 'Даббер',
        social: {}
    },
    { 
        id: 'vadim',
        name: 'Вадим',
        nameEn: 'Vadim',
        image: 'images/vadim.jpg',
        roleType: 'tech',
        status: 'Звукорежиссёр',
        joinDate: '2026',
        bio: 'Звукорежиссёр',
        social: {}
    },
    { 
        id: 'persival',
        name: 'Persival',
        nameRu: 'Персиваль',
        image: 'images/persival.jpg',
        roleType: 'tech',
        status: 'Менеджер',
        joinDate: '2026',
        bio: 'Мое почтение дамы и господа, с вами Персиваль. На повестке дня я расскажу о себе как о человеке чья личность все же будет скрыта под богом "Секретно". Мне 23 года проживаю в Великой державе. Днями и ночами напролет этот прохиндей работает на множество структур. А так, кто захочет сам узнает обо мне, ведь я не скрываюсь)',
        social: { vk:'6ap_cuk' }
    },
    { 
        id: 'nemo',
        name: 'Nemo',
        status: 'Удалён из команды',
        joinDate: '-',
        image: 'images/deleted.jpg',
    }
];

// ========== РОЛИ ==========
const rolesDatabase = [
    { titleId: 'dandadan', voiceId: 'runi', character: 'Момо', characterImage: 'images/momo.jpg', episodes: '1-12', type: 'main' },
    { titleId: 'dandadan', voiceId: 'nemo', character: 'Окарун', characterImage: 'images/okarun.jpg', episodes: '1-12', type: 'main' },
];

// ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ (для инициализации)
window.titlesDatabase = titlesDatabase;
window.voicesDatabase = voicesDatabase;
window.rolesDatabase = rolesDatabase;

console.log('✅ data.js загружен');
console.log(`📊 Тайтлов: ${titlesDatabase.length}`);
console.log(`🎭 Дабберов: ${voicesDatabase.length}`);
console.log(`🔗 Ролей: ${rolesDatabase.length}`);