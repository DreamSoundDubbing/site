// Импорты Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    addDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    writeBatch,
    increment,
    arrayUnion,
    arrayRemove,
    runTransaction,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============================================================
// 🔥 КОНФИГУРАЦИЯ FIREBASE
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyB2dCRlD1K8UUsWFd-ejJr9RxYIOzY00yM",
  authDomain: "dsd-site.firebaseapp.com",
  projectId: "dsd-site",
  storageBucket: "dsd-site.firebasestorage.app",
  messagingSenderId: "731430335626",
  appId: "1:731430335626:web:eadc118202be9cad6de973",
  measurementId: "G-NG22ELNX40"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('✅ Firebase подключён');

// ============================================================
// ========== АВТОРИЗАЦИЯ ==========
// ============================================================

async function registerUser(email, password, displayName) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: displayName });
        
        await setDoc(doc(db, "users", user.uid), {
            displayName: displayName,
            email: email,
            photoURL: '',
            role: 'user',
            createdAt: serverTimestamp(),
            viewsCount: 0,
            commentsCount: 0,
            subscribers: [],
            subscriptions: [],
            achievements: [],
            dsCoins: 0,
            wallVisibility: 'all',
            achSlots: 1,
            nickColor: null,
            prefix: null,
            bio: '',
            socialLink: ''
        });
        
        return { success: true, user: user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function logoutUser() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function getCurrentUser() {
    return auth.currentUser;
}

function onAuthStateChangedListener(callback) {
    return onAuthStateChanged(auth, callback);
}

async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== ПОЛЬЗОВАТЕЛИ ==========
// ============================================================

async function getUserData(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        } else {
            const user = getCurrentUser();
            if (user && user.uid === uid) {
                const newData = {
                    displayName: user.displayName || user.email || 'Пользователь',
                    email: user.email,
                    photoURL: user.photoURL || '',
                    role: 'user',
                    createdAt: serverTimestamp(),
                    viewsCount: 0,
                    commentsCount: 0,
                    subscribers: [],
                    subscriptions: [],
                    achievements: [],
                    dsCoins: 0,
                    wallVisibility: 'all',
                    achSlots: 1,
                    nickColor: null,
                    prefix: null,
                    bio: '',
                    socialLink: ''
                };
                await setDoc(docRef, newData);
                return { success: true, data: newData };
            }
            return { success: false, error: "Данные не найдены" };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getUserByEmail(email) {
    try {
        const q = query(collection(db, "users"), where("email", "==", email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { success: true, data: { id: doc.id, ...doc.data() } };
        }
        return { success: false, error: "Пользователь не найден" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getUserRole(uid) {
    try {
        const result = await getUserData(uid);
        if (result.success) {
            return result.data.role || 'user';
        }
        return 'user';
    } catch (error) {
        return 'user';
    }
}

async function updateUserProfile(uid, data) {
    try {
        const docRef = doc(db, "users", uid);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        const user = getCurrentUser();
        if (user && user.uid === uid) {
            if (data.displayName) await updateProfile(user, { displayName: data.displayName });
            if (data.photoURL !== undefined) await updateProfile(user, { photoURL: data.photoURL });
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateUserRole(uid, newRole) {
    try {
        const docRef = doc(db, "users", uid);
        await updateDoc(docRef, { role: newRole });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getAllUsers() {
    try {
        const snapshot = await getDocs(collection(db, "users"));
        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, users: users };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function isAdmin(uid) {
    const role = await getUserRole(uid);
    return role === 'admin';
}

async function isDubber(uid) {
    const role = await getUserRole(uid);
    return role === 'dubber' || role === 'admin';
}

// ============================================================
// ========== ПОДПИСКИ ==========
// ============================================================

async function toggleSubscribe(currentUserId, targetUserId) {
    try {
        const targetRef = doc(db, "users", targetUserId);
        const currentRef = doc(db, "users", currentUserId);
        
        const targetDoc = await getDoc(targetRef);
        if (!targetDoc.exists()) {
            return { success: false, error: "Пользователь не найден" };
        }
        
        const targetData = targetDoc.data();
        const subscribers = targetData.subscribers || [];
        const isSubscribed = subscribers.includes(currentUserId);
        
        await runTransaction(db, async (transaction) => {
            if (isSubscribed) {
                transaction.update(targetRef, { subscribers: arrayRemove(currentUserId) });
                transaction.update(currentRef, { subscriptions: arrayRemove(targetUserId) });
            } else {
                transaction.update(targetRef, { subscribers: arrayUnion(currentUserId) });
                transaction.update(currentRef, { subscriptions: arrayUnion(targetUserId) });
            }
        });
        
        return { success: true, isSubscribed: !isSubscribed };
    } catch (error) {
        console.error('Ошибка при подписке:', error);
        return { success: false, error: error.message };
    }
}

async function getSubscribersCount(uid) {
    try {
        const result = await getUserData(uid);
        if (result.success) {
            return (result.data.subscribers || []).length;
        }
        return 0;
    } catch (error) {
        return 0;
    }
}

async function isSubscribed(currentUserId, targetUserId) {
    try {
        const result = await getUserData(targetUserId);
        if (result.success) {
            return (result.data.subscribers || []).includes(currentUserId);
        }
        return false;
    } catch (error) {
        return false;
    }
}

// ============================================================
// ========== ДОСТИЖЕНИЯ ==========
// ============================================================

const ACHIEVEMENTS = {
    FIRST_COMMENT: { id: 'first_comment', name: 'Первый комментарий', description: 'Написал первый комментарий', icon: '💬' },
    TEN_COMMENTS: { id: 'ten_comments', name: 'Болтун', description: 'Написал 10 комментариев', icon: '🗣️' },
    FIFTY_COMMENTS: { id: 'fifty_comments', name: 'Оратор', description: 'Написал 50 комментариев', icon: '📢' },
    HUNDRED_COMMENTS: { id: 'hundred_comments', name: 'Легенда форума', description: 'Написал 100 комментариев', icon: '👑' },
    FIRST_VIEW: { id: 'first_view', name: 'Первый просмотр', description: 'Посмотрел первую серию', icon: '🎬' },
    TEN_VIEWS: { id: 'ten_views', name: 'Зритель', description: 'Посмотрел 10 серий', icon: '📺' },
    FIFTY_VIEWS: { id: 'fifty_views', name: 'Киноман', description: 'Посмотрел 50 серий', icon: '🎞️' },
    HUNDRED_VIEWS: { id: 'hundred_views', name: 'Гуру аниме', description: 'Посмотрел 100 серий', icon: '🏆' },
};

async function checkAndAddAchievement(uid, type, value) {
    try {
        const result = await getUserData(uid);
        if (!result.success) return;
        
        const userData = result.data;
        const achievements = userData.achievements || [];
        const existingIds = achievements.map(a => a.id);
        let newAchievements = [];
        
        if (type === 'comments') {
            if (value >= 100 && !existingIds.includes('hundred_comments')) {
                newAchievements.push(ACHIEVEMENTS.HUNDRED_COMMENTS);
            } else if (value >= 50 && !existingIds.includes('fifty_comments')) {
                newAchievements.push(ACHIEVEMENTS.FIFTY_COMMENTS);
            } else if (value >= 10 && !existingIds.includes('ten_comments')) {
                newAchievements.push(ACHIEVEMENTS.TEN_COMMENTS);
            } else if (value >= 1 && !existingIds.includes('first_comment')) {
                newAchievements.push(ACHIEVEMENTS.FIRST_COMMENT);
            }
        } else if (type === 'views') {
            if (value >= 100 && !existingIds.includes('hundred_views')) {
                newAchievements.push(ACHIEVEMENTS.HUNDRED_VIEWS);
            } else if (value >= 50 && !existingIds.includes('fifty_views')) {
                newAchievements.push(ACHIEVEMENTS.FIFTY_VIEWS);
            } else if (value >= 10 && !existingIds.includes('ten_views')) {
                newAchievements.push(ACHIEVEMENTS.TEN_VIEWS);
            } else if (value >= 1 && !existingIds.includes('first_view')) {
                newAchievements.push(ACHIEVEMENTS.FIRST_VIEW);
            }
        }
        
        if (newAchievements.length > 0) {
            const docRef = doc(db, "users", uid);
            for (const ach of newAchievements) {
                await updateDoc(docRef, { achievements: arrayUnion(ach) });
            }
        }
    } catch (error) {
        console.error('Ошибка при добавлении достижения:', error);
    }
}

async function addCustomAchievement(uid, achievement) {
    try {
        const docRef = doc(db, "users", uid);
        await updateDoc(docRef, { achievements: arrayUnion(achievement) });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== КОММЕНТАРИИ ==========
// ============================================================

async function addComment(titleId, text, rating, mentionedEmails = []) {
    const user = getCurrentUser();
    if (!user) {
        return { success: false, error: "Необходимо авторизоваться" };
    }
    try {
        const mentions = text.match(/@([^\s]+)/g) || [];
        const mentionedEmailsFromText = mentions.map(m => m.substring(1));
        const allMentions = [...new Set([...mentionedEmailsFromText, ...mentionedEmails])];
        
        const userData = await getUserData(user.uid);
        const displayName = userData.success ? userData.data.displayName : (user.displayName || "Аноним");
        const photoURL = userData.success ? userData.data.photoURL : '';
        
        const docRef = await addDoc(collection(db, "comments"), {
            titleId: titleId,
            uid: user.uid,
            name: displayName,
            photoURL: photoURL,
            text: text,
            rating: rating || 5,
            mentions: allMentions,
            time: serverTimestamp()
        });
        
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { commentsCount: increment(1) });
        
        const newCommentsCount = (userData.success ? userData.data.commentsCount || 0 : 0) + 1;
        await checkAndAddAchievement(user.uid, 'comments', newCommentsCount);
        
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getComments(titleId) {
    try {
        // Без orderBy, чтобы не требовать индекс
        const q = query(
            collection(db, "comments"),
            where("titleId", "==", titleId)
        );
        const querySnapshot = await getDocs(q);
        const comments = [];
        querySnapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() });
        });
        // Сортируем вручную на клиенте (новые сверху)
        comments.sort((a, b) => {
            const timeA = a.time?.seconds || 0;
            const timeB = b.time?.seconds || 0;
            return timeB - timeA;
        });
        return comments;
    } catch (error) {
        console.error('Ошибка загрузки комментариев:', error);
        return [];
    }
}
async function deleteComment(commentId) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: "Не авторизован" };
    try {
        await deleteDoc(doc(db, "comments", commentId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== ПРОСМОТРЫ ==========
// ============================================================

async function trackView(uid, titleId, episodeNumber) {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { viewsCount: increment(1) });
        
        const result = await getUserData(uid);
        if (result.success) {
            const newViewsCount = (result.data.viewsCount || 0) + 1;
            await checkAndAddAchievement(uid, 'views', newViewsCount);
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== РЕЙТИНГИ ==========
// ============================================================

async function getAverageRating(titleId) {
    try {
        const q = query(collection(db, "comments"), where("titleId", "==", titleId));
        const snapshot = await getDocs(q);
        let total = 0;
        let count = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.rating) {
                total += data.rating;
                count++;
            }
        });
        if (count === 0) return 0;
        return Math.round((total / count) * 10) / 10;
    } catch (error) {
        return 0;
    }
}

// ============================================================
// ========== ТАЙТЛЫ ==========
// ============================================================

async function getTitles() {
    try {
        const snapshot = await getDocs(collection(db, "titles"));
        const titles = [];
        snapshot.forEach(doc => {
            titles.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, titles: titles };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getTitleById(titleId) {
    try {
        const docRef = doc(db, "titles", titleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
        }
        return { success: false, error: "Тайтл не найден" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function addTitle(titleData) {
    try {
        const docId = titleData.id || titleData.name;
        if (!docId) {
            return { success: false, error: "ID тайтла не указан" };
        }
        const docRef = doc(db, "titles", docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: false, error: "Тайтл с таким ID уже существует" };
        }
        await setDoc(docRef, {
            ...titleData,
            id: docId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docId, created: true };
    } catch (error) {
        console.error('Ошибка создания тайтла:', error);
        return { success: false, error: error.message };
    }
}

async function updateTitle(titleId, data) {
    try {
        const docRef = doc(db, "titles", titleId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return { success: false, error: "Тайтл не найден для обновления" };
        }
        await updateDoc(docRef, {
            ...data,
            id: titleId,
            updatedAt: serverTimestamp()
        });
        return { success: true, updated: true };
    } catch (error) {
        console.error('Ошибка обновления тайтла:', error);
        return { success: false, error: error.message };
    }
}

async function deleteTitle(titleId) {
    try {
        const docRef = doc(db, "titles", titleId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return { success: false, error: "Тайтл не найден" };
        }
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== ДАББЕРЫ (VOICES) ==========
// ============================================================

async function getVoices() {
    try {
        const snapshot = await getDocs(collection(db, "voices"));
        const voices = [];
        snapshot.forEach(doc => {
            voices.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, voices: voices };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getVoiceById(voiceId) {
    try {
        const docRef = doc(db, "voices", voiceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
        }
        return { success: false, error: "Даббер не найден" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function addVoice(voiceData) {
    try {
        const docId = voiceData.id || voiceData.name;
        if (!docId) {
            return { success: false, error: "ID даббера не указан" };
        }
        const docRef = doc(db, "voices", docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            await updateDoc(docRef, {
                ...voiceData,
                updatedAt: serverTimestamp()
            });
            return { success: true, id: docId, updated: true };
        }
        await setDoc(docRef, {
            ...voiceData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docId, created: true };
    } catch (error) {
        console.error('Ошибка создания даббера:', error);
        return { success: false, error: error.message };
    }
}

async function updateVoice(voiceId, data) {
    try {
        const docRef = doc(db, "voices", voiceId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            await setDoc(docRef, {
                ...data,
                id: voiceId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true, created: true };
        }
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        return { success: true, updated: true };
    } catch (error) {
        console.error('Ошибка обновления даббера:', error);
        return { success: false, error: error.message };
    }
}

async function deleteVoice(voiceId) {
    try {
        const docRef = doc(db, "voices", voiceId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return { success: false, error: "Даббер не найден" };
        }
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== РОЛИ ==========
// ============================================================

async function getRoles() {
    try {
        const snapshot = await getDocs(collection(db, "roles"));
        const roles = [];
        snapshot.forEach(doc => {
            roles.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, roles: roles };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getRolesByTitleId(titleId) {
    try {
        const q = query(collection(db, "roles"), where("titleId", "==", titleId));
        const snapshot = await getDocs(q);
        const roles = [];
        snapshot.forEach(doc => {
            roles.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, roles: roles };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getRolesByVoiceId(voiceId) {
    try {
        const q = query(collection(db, "roles"), where("voiceId", "==", voiceId));
        const snapshot = await getDocs(q);
        const roles = [];
        snapshot.forEach(doc => {
            roles.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, roles: roles };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function addRole(roleData) {
    try {
        const docRef = await addDoc(collection(db, "roles"), {
            ...roleData,
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateRole(roleId, data) {
    try {
        const docRef = doc(db, "roles", roleId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function deleteRole(roleId) {
    try {
        await deleteDoc(doc(db, "roles", roleId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== МАТЕРИАЛЫ DUB-IN ==========
// ============================================================

async function getDubMaterials(titleId) {
    try {
        const docRef = doc(db, "dubMaterials", titleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        }
        return { success: true, data: { raw: [], softsubs: [], hardsubs: [] } };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function addDubMaterial(titleId, materialType, item) {
    try {
        const docRef = doc(db, "dubMaterials", titleId);
        const docSnap = await getDoc(docRef);
        let existing = { raw: [], softsubs: [], hardsubs: [] };
        if (docSnap.exists()) {
            existing = docSnap.data();
        }
        existing[materialType].push(item);
        await setDoc(docRef, existing);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function removeDubMaterial(titleId, materialType, index) {
    try {
        const docRef = doc(db, "dubMaterials", titleId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return { success: false, error: "Материалы не найдены" };
        }
        const data = docSnap.data();
        if (data[materialType] && data[materialType].length > index) {
            data[materialType].splice(index, 1);
            await setDoc(docRef, data);
            return { success: true };
        }
        return { success: false, error: "Элемент не найден" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== ЗАЯВКИ НА ОЗВУЧКУ ==========
// ============================================================

async function createVoiceOrder(orderData) {
    const user = getCurrentUser();
    if (!user) {
        return { success: false, error: "Необходимо авторизоваться" };
    }
    try {
        const docRef = await addDoc(collection(db, "voiceOrders"), {
            ...orderData,
            userId: user.uid,
            userEmail: user.email,
            userName: user.displayName || 'Пользователь',
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getVoiceOrders(userId) {
    try {
        let q;
        if (userId) {
            q = query(
                collection(db, "voiceOrders"),
                where("userId", "==", userId),
                orderBy("createdAt", "desc")
            );
        } else {
            q = query(
                collection(db, "voiceOrders"),
                orderBy("createdAt", "desc")
            );
        }
        const snapshot = await getDocs(q);
        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, orders: orders };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateVoiceOrder(orderId, data) {
    try {
        const docRef = doc(db, "voiceOrders", orderId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== DSCOINS ==========
// ============================================================

async function getUserDSCoins(uid) {
    try {
        const result = await getUserData(uid);
        if (result.success) {
            return { success: true, coins: result.data.dsCoins || 0 };
        }
        return { success: false, error: result.error };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function addDSCoins(uid, amount, reason) {
    try {
        const docRef = doc(db, "users", uid);
        await updateDoc(docRef, {
            dsCoins: increment(amount)
        });
        // Записываем транзакцию
        await addDoc(collection(db, "dsCoinTransactions"), {
            uid: uid,
            amount: amount,
            reason: reason || 'Пополнение',
            timestamp: serverTimestamp(),
            type: 'income'
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function spendDSCoins(uid, amount, reason) {
    try {
        const userResult = await getUserData(uid);
        if (!userResult.success) {
            return { success: false, error: "Пользователь не найден" };
        }
        const currentCoins = userResult.data.dsCoins || 0;
        if (currentCoins < amount) {
            return { success: false, error: "Недостаточно DSCoins" };
        }
        const docRef = doc(db, "users", uid);
        await updateDoc(docRef, { dsCoins: increment(-amount) });
        // Записываем транзакцию
        await addDoc(collection(db, "dsCoinTransactions"), {
            uid: uid,
            amount: -amount,
            reason: reason || 'Покупка',
            timestamp: serverTimestamp(),
            type: 'spend'
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getDSCoinTransactions(uid) {
    try {
        const q = query(
            collection(db, "dsCoinTransactions"),
            where("uid", "==", uid),
            orderBy("timestamp", "desc"),
            limit(50)
        );
        const snapshot = await getDocs(q);
        const transactions = [];
        snapshot.forEach(doc => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, transactions: transactions };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== ЗАЯВКИ НА ПОКУПКУ DSCOINS ==========
// ============================================================

async function createDSCoinOrder(orderData) {
    const user = getCurrentUser();
    if (!user) {
        return { success: false, error: "Необходимо авторизоваться" };
    }
    try {
        const docRef = await addDoc(collection(db, "dsCoinOrders"), {
            ...orderData,
            userId: user.uid,
            userEmail: user.email,
            userName: user.displayName || 'Пользователь',
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getDSCoinOrders(userId) {
    try {
        let q;
        if (userId) {
            q = query(
                collection(db, "dsCoinOrders"),
                where("userId", "==", userId),
                orderBy("createdAt", "desc")
            );
        } else {
            q = query(
                collection(db, "dsCoinOrders"),
                orderBy("createdAt", "desc")
            );
        }
        const snapshot = await getDocs(q);
        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, orders: orders };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateDSCoinOrder(orderId, data) {
    try {
        const docRef = doc(db, "dsCoinOrders", orderId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== ПЛЕЙЛИСТЫ ==========
// ============================================================

async function getPlaylists(uid) {
    try {
        const q = query(
            collection(db, "playlists"),
            where("userId", "==", uid),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const playlists = [];
        snapshot.forEach(doc => {
            playlists.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, playlists: playlists };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function createPlaylist(uid, data) {
    try {
        const docRef = await addDoc(collection(db, "playlists"), {
            ...data,
            userId: uid,
            items: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updatePlaylist(playlistId, data) {
    try {
        const docRef = doc(db, "playlists", playlistId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function deletePlaylist(playlistId) {
    try {
        await deleteDoc(doc(db, "playlists", playlistId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function addToPlaylist(playlistId, item) {
    try {
        const docRef = doc(db, "playlists", playlistId);
        await updateDoc(docRef, { items: arrayUnion(item) });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function removeFromPlaylist(playlistId, itemId) {
    try {
        const docRef = doc(db, "playlists", playlistId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return { success: false, error: "Плейлист не найден" };
        }
        const data = docSnap.data();
        const items = (data.items || []).filter(item => item.id !== itemId);
        await updateDoc(docRef, { items: items });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== СТЕНА ПРОФИЛЯ (ИСПРАВЛЕННАЯ) ==========
// ============================================================

async function getWallPosts(uid, limitCount = 20) {
    try {
        // Проверяем настройки видимости стены
        const userData = await getUserData(uid);
        if (!userData.success) {
            return { success: false, error: "Пользователь не найден" };
        }
        
        const wallVisibility = userData.data.wallVisibility || 'all';
        const currentUser = getCurrentUser();
        
        // Если стена закрыта, только владелец и админ могут видеть
        if (wallVisibility === 'disabled') {
            if (currentUser && (currentUser.uid === uid || await isAdmin(currentUser.uid))) {
                // Владелец или админ видят
            } else {
                return { success: true, posts: [], visibility: wallVisibility };
            }
        }
        
        // Если стена только для подписчиков
        if (wallVisibility === 'friends') {
            if (currentUser) {
                const isSub = await isSubscribed(currentUser.uid, uid);
                if (!isSub && currentUser.uid !== uid && !await isAdmin(currentUser.uid)) {
                    return { success: true, posts: [], visibility: wallVisibility };
                }
            } else {
                return { success: true, posts: [], visibility: wallVisibility };
            }
        }
        
        // Загружаем посты
        const q = query(
            collection(db, "wallPosts"),
            where("userId", "==", uid),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        const posts = [];
        snapshot.forEach(doc => {
            posts.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, posts: posts, visibility: wallVisibility };
    } catch (error) {
        console.error('Ошибка загрузки стены:', error);
        return { success: false, error: error.message };
    }
}

async function addWallPost(uid, text, visibility = 'all') {
    try {
        const userData = await getUserData(uid);
        const userName = userData.success ? userData.data.displayName || 'Пользователь' : 'Пользователь';
        
        // Получаем текущую видимость стены пользователя
        const wallVisibility = userData.success ? (userData.data.wallVisibility || 'all') : 'all';
        
        const docRef = await addDoc(collection(db, "wallPosts"), {
            userId: uid,
            userName: userName,
            text: text,
            visibility: wallVisibility,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Ошибка добавления записи на стену:', error);
        return { success: false, error: error.message };
    }
}

async function deleteWallPost(postId) {
    try {
        await deleteDoc(doc(db, "wallPosts", postId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateWallVisibility(uid, visibility) {
    try {
        const docRef = doc(db, "users", uid);
        await updateDoc(docRef, { wallVisibility: visibility });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== МАГАЗИН DSCOINS (ИСПРАВЛЕННЫЙ) ==========
// ============================================================

async function getShopPrices() {
    try {
        const docRef = doc(db, "settings", "shopPrices");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        }
        const defaultPrices = { colorNick: 500, prefix: 300, achSlot: 200 };
        await setDoc(docRef, defaultPrices);
        return { success: true, data: defaultPrices };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateShopPrices(prices) {
    try {
        const docRef = doc(db, "settings", "shopPrices");
        await setDoc(docRef, prices);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function purchaseColorNick(uid, color) {
    const prices = await getShopPrices();
    if (!prices.success) return { success: false, error: "Ошибка загрузки цен" };
    const cost = prices.data.colorNick || 500;
    const spendResult = await spendDSCoins(uid, cost, `Покупка цветного ника: ${color}`);
    if (!spendResult.success) return spendResult;
    const updateResult = await updateUserProfile(uid, { nickColor: color });
    if (!updateResult.success) return updateResult;
    return { success: true };
}

async function purchasePrefix(uid, prefix) {
    const prices = await getShopPrices();
    if (!prices.success) return { success: false, error: "Ошибка загрузки цен" };
    const cost = prices.data.prefix || 300;
    const spendResult = await spendDSCoins(uid, cost, `Покупка префикса: ${prefix}`);
    if (!spendResult.success) return spendResult;
    const updateResult = await updateUserProfile(uid, { prefix: prefix });
    if (!updateResult.success) return updateResult;
    return { success: true };
}

async function purchaseAchSlot(uid) {
    const prices = await getShopPrices();
    if (!prices.success) return { success: false, error: "Ошибка загрузки цен" };
    const cost = prices.data.achSlot || 200;
    const spendResult = await spendDSCoins(uid, cost, "Покупка дополнительного слота ачивок");
    if (!spendResult.success) return spendResult;
    const userData = await getUserData(uid);
    if (!userData.success) return { success: false, error: "Ошибка загрузки данных" };
    const currentSlots = userData.data.achSlots || 1;
    const updateResult = await updateUserProfile(uid, { achSlots: currentSlots + 1 });
    if (!updateResult.success) return updateResult;
    return { success: true };
}

// ============================================================
// ========== ИНИЦИАЛИЗАЦИЯ ==========
// ============================================================

async function initializeData() {
    try {
        const titlesResult = await getTitles();
        if (titlesResult.success && titlesResult.titles.length > 0) {
            return;
        }

        console.log('📝 Загрузка начальных данных...');
        const batch = writeBatch(db);

        if (window.titlesDatabase && window.titlesDatabase.length > 0) {
            for (const title of window.titlesDatabase) {
                const docRef = doc(db, "titles", title.id || title.name);
                batch.set(docRef, {
                    ...title,
                    createdAt: serverTimestamp()
                });
            }
        }

        if (window.voicesDatabase && window.voicesDatabase.length > 0) {
            for (const voice of window.voicesDatabase) {
                const docRef = doc(db, "voices", voice.id || voice.name);
                batch.set(docRef, {
                    ...voice,
                    createdAt: serverTimestamp()
                });
            }
        }

        if (window.rolesDatabase && window.rolesDatabase.length > 0) {
            for (const role of window.rolesDatabase) {
                const docRef = doc(db, "roles", role.id || `${role.titleId}_${role.voiceId}`);
                batch.set(docRef, {
                    ...role,
                    createdAt: serverTimestamp()
                });
            }
        }

        await batch.commit();
        console.log('✅ Начальные данные загружены');
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
    }
}
// ============================================================
// ========== ОБНОВЛЕНИЕ РЕЙТИНГА ТАЙТЛА ==========
// ============================================================

async function updateTitleRating(titleId) {
    try {
        // Получаем средний рейтинг из комментариев
        const avgRating = await getAverageRating(titleId);
        
        // Обновляем рейтинг в документе тайтла
        const docRef = doc(db, "titles", titleId);
        await updateDoc(docRef, {
            rating: avgRating,
            updatedAt: serverTimestamp()
        });
        
        return { success: true, rating: avgRating };
    } catch (error) {
        console.error('Ошибка обновления рейтинга тайтла:', error);
        return { success: false, error: error.message };
    }
}
// ============================================================
// ========== УНИКАЛЬНЫЕ ПРОСМОТРЫ ТАЙТЛОВ ==========
// ============================================================

async function trackTitleView(titleId, userId) {
    if (!userId) return { success: false, error: "Пользователь не авторизован" };

    try {
        const docRef = doc(db, "titles", titleId);
        
        // Используем транзакцию для атомарности
        return await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            
            if (!docSnap.exists()) {
                // Если тайтла нет — создаём его с массивом [userId] и счётчиком 1
                transaction.set(docRef, {
                    viewedBy: [userId],
                    viewsCount: 1,
                    lastViewedAt: serverTimestamp()
                });
                return { success: true, viewed: true };
            }

            const data = docSnap.data();
            const viewedBy = data.viewedBy || [];
            
            // Если пользователь уже есть в списке — не добавляем
            if (viewedBy.includes(userId)) {
                return { success: true, viewed: false };
            }

            // Добавляем пользователя и увеличиваем счётчик
            transaction.update(docRef, {
                viewedBy: arrayUnion(userId),
                viewsCount: increment(1),
                lastViewedAt: serverTimestamp()
            });

            return { success: true, viewed: true };
        });
    } catch (error) {
        console.error('Ошибка отслеживания просмотра:', error);
        return { success: false, error: error.message };
    }
}

async function getTitleViews(titleId) {
    try {
        const docRef = doc(db, "titles", titleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, views: docSnap.data().viewsCount || 0 };
        }
        return { success: true, views: 0 };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== ЭКСПОРТ ==========
// ============================================================

export {
    auth,
    db,
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    onAuthStateChangedListener,
    resetPassword,
    getUserData,
    getUserByEmail,
    getUserRole,
    updateUserProfile,
    updateUserRole,
    getAllUsers,
    isAdmin,
    isDubber,
    toggleSubscribe,
    getSubscribersCount,
    isSubscribed,
    ACHIEVEMENTS,
    checkAndAddAchievement,
    addCustomAchievement,
    addComment,
    getComments,
    deleteComment,
    trackView,
    getAverageRating,
    getTitles,
    getTitleById,
    addTitle,
    updateTitle,
    deleteTitle,
    getVoices,
    getVoiceById,
    addVoice,
    updateVoice,
    deleteVoice,
    getRoles,
    getRolesByTitleId,
    getRolesByVoiceId,
    addRole,
    updateRole,
    deleteRole,
    getDubMaterials,
    addDubMaterial,
    removeDubMaterial,
    initializeData,
    createVoiceOrder,
    getVoiceOrders,
    updateVoiceOrder,
    getUserDSCoins,
    addDSCoins,
    spendDSCoins,
    getDSCoinTransactions,
    createDSCoinOrder,
    getDSCoinOrders,
    updateDSCoinOrder,
    getPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    getWallPosts,
    addWallPost,
    deleteWallPost,
    updateWallVisibility,
    getShopPrices,
    updateShopPrices,
    purchaseColorNick,
    purchasePrefix,
    purchaseAchSlot,
    updateTitleRating,
    trackTitleView,
    getTitleViews
};

console.log('🔥 Модуль firebase-config.js загружен');
