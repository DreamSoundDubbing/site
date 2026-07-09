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
            dsCoins: 90,
            lastDailyClaim: null,
            inventory: [],
            equippedStatus: null,
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
// ========== СИСТЕМА ЕЖЕДНЕВНОГО БОНУСА ==========
// ============================================================

async function claimDailyBonus(uid) {
    try {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) return { success: false, error: "Пользователь не найден" };

        const data = docSnap.data();
        const lastClaim = data.lastDailyClaim?.toDate?.() || null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (lastClaim) {
            const lastDate = new Date(lastClaim);
            lastDate.setHours(0, 0, 0, 0);
            if (lastDate.getTime() === today.getTime()) {
                return { success: false, error: "Вы уже получили бонус сегодня!" };
            }
        }

        const bonusAmount = 10; // Ежедневный бонус (10 монет)
        await updateDoc(userRef, {
            dsCoins: increment(bonusAmount),
            lastDailyClaim: serverTimestamp()
        });

        return { success: true, coins: bonusAmount };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== ИНВЕНТАРЬ И ПРЕДМЕТЫ ==========
// ============================================================

async function addItemToInventory(uid, item) {
    try {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
            return { success: false, error: "Пользователь не найден" };
        }

        let inventory = docSnap.data().inventory || [];

        // Если у item есть serverTimestamp, убираем его (он не нужен в массиве)
        // Мы просто удаляем поле purchasedAt, чтобы оно не ломало arrayUnion
        const cleanItem = { ...item };
        delete cleanItem.purchasedAt; // <--- ВАЖНО! Убираем serverTimestamp

        // Проверяем, есть ли уже такой предмет (по id)
        const existingIndex = inventory.findIndex(i => i.id === cleanItem.id);
        
        if (existingIndex !== -1) {
            // Если есть, увеличиваем стак
            inventory[existingIndex].count = (inventory[existingIndex].count || 1) + 1;
        } else {
            // Если нет, добавляем с count: 1 и без serverTimestamp
            inventory.push({ ...cleanItem, count: 1 });
        }

        // Обновляем весь инвентарь целиком (без arrayUnion, через set/update)
        await updateDoc(userRef, { inventory: inventory });

        return { success: true };
    } catch (error) {
        console.error('Ошибка добавления в инвентарь:', error);
        return { success: false, error: error.message };
    }
}

// Удалить предмет из инвентаря
async function removeItemFromInventory(uid, itemId) {
    try {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) return { success: false, error: "Пользователь не найден" };

        const inventory = docSnap.data().inventory || [];
        const itemIndex = inventory.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return { success: false, error: "Предмет не найден" };

        inventory.splice(itemIndex, 1);
        await updateDoc(userRef, { inventory: inventory });

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Надеть статус (облачко) - обязательно должен быть в инвентаре
async function equipStatus(uid, statusId, statusText) {
    try {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        const inventory = docSnap.data().inventory || [];
        
        // Проверяем, есть ли этот предмет в инвентаре
        const hasItem = inventory.some(item => item.id === statusId && item.type === 'status');
        if (!hasItem) return { success: false, error: "У вас нет этого статуса в инвентаре" };

        await updateDoc(userRef, {
            equippedStatus: { id: statusId, text: statusText }
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Снять статус (убрать облачко)
async function unequipStatus(uid) {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { equippedStatus: null });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Изменить текст статуса (платно)
window.saveStatusText = async function() {
    const user = getCurrentUser();
    if (!user) { showToast('❌ Войдите в аккаунт', 'error'); return; }
    
    const input = document.getElementById('statusTextInput');
    const newText = input.value.trim();
    
    // Проверяем, что текст существует и не пустой
    if (!newText || newText === '') {
        showToast('❌ Текст не может быть пустым', 'error');
        return;
    }
    if (newText.length > 50) {
        showToast('❌ Максимум 50 символов', 'error');
        return;
    }

    // Если есть pendingEquipItemId — значит мы надеваем статус
    if (window._pendingEquipItemId) {
        // Сначала сохраняем текст в профиль
        const textResult = await updateUserProfile(user.uid, { statusText: newText });
        if (!textResult.success) {
            showToast('❌ Ошибка сохранения текста: ' + textResult.error, 'error');
            window._pendingEquipItemId = null;
            return;
        }
        // Надеваем статус
        const equipResult = await equipStatus(user.uid, window._pendingEquipItemId);
        window._pendingEquipItemId = null;
        if (equipResult.success) {
            showToast('✅ Статус надет!', 'success');
            closeModal('m-status-text');
            await loadInventory();
        } else {
            showToast('❌ ' + equipResult.error, 'error');
        }
    } else {
        // Иначе — просто меняем текст (платно)
        const result = await updateStatusText(user.uid, newText);
        if (result.success) {
            showToast(`✅ Текст статуса обновлён! Списано ${result.cost} монет`, 'success');
            closeModal('m-status-text');
            await loadInventory();
        } else {
            showToast('❌ ' + result.error, 'error');
        }
    }
};

// Изменить текст статуса (платно)
async function updateStatusText(uid, newText) {
    try {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        const equipped = docSnap.data().equippedStatus;
        if (!equipped) return { success: false, error: "Статус не надет" };

        const cost = 150; // Стоимость смены текста
        const coins = docSnap.data().dsCoins || 0;
        if (coins < cost) return { success: false, error: `Недостаточно монет. Нужно ${cost}` };

        // Списываем монеты и меняем текст
        await updateDoc(userRef, {
            dsCoins: increment(-cost),
            "equippedStatus.text": newText
        });
        return { success: true, cost: cost };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Подарить предмет другому пользователю
async function giftItem(uid, targetUid, itemId) {
    try {
        // 1. Удаляем предмет у себя
        const removeResult = await removeItemFromInventory(uid, itemId);
        if (!removeResult.success) return removeResult;

        // 2. Добавляем предмет получателю
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        const inventory = docSnap.data().inventory || [];
        const item = inventory.find(i => i.id === itemId);
        if (!item) return { success: false, error: "Предмет не найден" };

        // Добавляем копию предмета с новым ID, чтобы не сломать логику
        const giftItem = { ...item, id: item.id + "_gift_" + Date.now() };
        const addResult = await addItemToInventory(targetUid, giftItem);
        if (!addResult.success) return addResult;

        return { success: true, message: "Подарок успешно отправлен!" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Продать предмет (за 90% цены)
async function sellItem(uid, itemId) {
    try {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        const inventory = docSnap.data().inventory || [];
        const item = inventory.find(i => i.id === itemId);
        if (!item) return { success: false, error: "Предмет не найден" };

        const price = item.price || 100; // Цена предмета (по умолчанию 100)
        const sellPrice = Math.floor(price * 0.9); // 90% от цены

        // Удаляем предмет и добавляем монеты
        await updateDoc(userRef, {
            inventory: arrayRemove(item),
            dsCoins: increment(sellPrice)
        });

        return { success: true, coins: sellPrice };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== МАГАЗИН (Покупка товаров) ==========
// ============================================================

async function buyItem(uid, shopItem) {
    try {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        const coins = docSnap.data().dsCoins || 0;

        if (coins < shopItem.price) {
            return { success: false, error: `Недостаточно монет. Нужно ${shopItem.price}` };
        }

        // Создаём предмет для инвентаря
        const newItem = {
    id: shopItem.id + "_" + Date.now(),
    type: shopItem.type,
    name: shopItem.name,
    icon: shopItem.icon || '🎁',
    price: shopItem.price,
    // purchasedAt: serverTimestamp() // <--- УДАЛИТЬ ЭТУ СТРОКУ
};

        // Списываем монеты и добавляем в инвентарь
        await updateDoc(userRef, {
            dsCoins: increment(-shopItem.price),
            inventory: arrayUnion(newItem)
        });

        return { success: true, item: newItem };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== ПЕРЕДАЧА МОНЕТ (ПОЛЬЗОВАТЕЛЬ -> ПОЛЬЗОВАТЕЛЬ) ==========
// ============================================================

async function transferCoins(senderUid, receiverUid, amount) {
    try {
        if (senderUid === receiverUid) {
            return { success: false, error: "Нельзя перевести монеты самому себе" };
        }
        if (amount < 1) {
            return { success: false, error: "Сумма должна быть больше 0" };
        }

        const senderRef = doc(db, "users", senderUid);
        const receiverRef = doc(db, "users", receiverUid);

        // Проверяем баланс отправителя
        const senderSnap = await getDoc(senderRef);
        if (!senderSnap.exists()) {
            return { success: false, error: "Отправитель не найден" };
        }
        const senderCoins = senderSnap.data().dsCoins || 0;
        if (senderCoins < amount) {
            return { success: false, error: `Недостаточно монет. У вас ${senderCoins}` };
        }

        // Выполняем транзакцию
        await runTransaction(db, async (transaction) => {
            transaction.update(senderRef, { dsCoins: increment(-amount) });
            transaction.update(receiverRef, { dsCoins: increment(amount) });
        });

        // Записываем транзакции в историю
        await addDoc(collection(db, "dsCoinTransactions"), {
            uid: senderUid,
            amount: -amount,
            reason: `Перевод пользователю ${receiverUid}`,
            timestamp: serverTimestamp(),
            type: 'transfer_out'
        });
        await addDoc(collection(db, "dsCoinTransactions"), {
            uid: receiverUid,
            amount: amount,
            reason: `Перевод от пользователя ${senderUid}`,
            timestamp: serverTimestamp(),
            type: 'transfer_in'
        });

        return { success: true, amount: amount };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== ЛУТБОКСЫ (ОБНОВЛЕННАЯ ЛОГИКА) ==========
// ============================================================

// ============================================================
// ========== НОВАЯ ЛОГИКА ЛУТБОКСОВ СО СТАКАМИ ==========
// ============================================================

// Список всех предметов магазина
const SHOP_ITEMS = [
    { id: 'color_nick', type: 'color_nick', name: '🎨 Цвет ника', icon: '🎨', price: 500 },
    { id: 'prefix', type: 'prefix', name: '🏷️ Префикс', icon: '🏷️', price: 300 },
    { id: 'status', type: 'status', name: '💬 Статус (облачко)', icon: '💬', price: 1000 },
];

// Максимальное количество одинаковых предметов
const MAX_STACK_SIZE = 25;

// Вспомогательная функция: найти предмет в стаке
function findItemInStack(inventory, itemId) {
    return inventory.find(item => item.id === itemId);
}

// ============================================================
// ========== ИЗМЕНЕНИЕ ТЕКСТА СТАТУСА (ПЛАТНОЕ) ==========
// ============================================================

async function updateStatusText(uid, newText) {
    try {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        const equipped = docSnap.data().equippedStatus;
        if (!equipped) {
            return { success: false, error: "Статус не надет" };
        }

        if (!newText || newText.trim() === '') {
            return { success: false, error: "Текст не может быть пустым" };
        }

        const cost = 15; // Стоимость смены текста
        const coins = docSnap.data().dsCoins || 0;
        if (coins < cost) {
            return { success: false, error: `Недостаточно монет. Нужно ${cost}` };
        }

        // Списываем монеты и меняем текст
        await updateDoc(userRef, {
            dsCoins: increment(-cost),
            "equippedStatus.text": newText.trim()
        });

        return { success: true, cost: cost };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function openLootbox(uid, price) {
    try {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) return { success: false, error: "Пользователь не найден" };

        const coins = docSnap.data().dsCoins || 0;
        if (coins < price) {
            return { success: false, error: `Недостаточно монет. Нужно ${price}` };
        }

        // Списываем монеты за лутбокс
        await updateDoc(userRef, { dsCoins: increment(-price) });

        let inventory = docSnap.data().inventory || [];
        const MAX_STACK_SIZE = 25;

        // ===== ШАНСЫ =====
        let coinAmounts, itemChanceModifier;
        if (price === 10) {
            coinAmounts = [2, 5, 10, 15, 20];
            itemChanceModifier = 0.03;
        } else if (price === 50) {
            coinAmounts = [10, 25, 50, 75, 100];
            itemChanceModifier = 0.08;
        } else if (price === 100) {
            coinAmounts = [20, 50, 100, 150, 200];
            itemChanceModifier = 0.15;
        } else {
            return { success: false, error: "Неизвестная цена лутбокса" };
        }

        let allPrizes = [];
        coinAmounts.forEach(amount => {
            allPrizes.push({
                type: 'coins',
                amount: amount,
                label: `${amount} монет`,
                icon: '🪙',
                chance: 1
            });
        });

        SHOP_ITEMS.forEach(item => {
            let baseChance = itemChanceModifier;
            if (price === 10 && item.price > 400) baseChance *= 0.3;
            if (price === 100 && item.price < 500) baseChance *= 1.5;
            baseChance = Math.max(0.001, Math.min(0.2, baseChance));
            allPrizes.push({
                type: 'item',
                item: item,
                label: item.name,
                icon: item.icon,
                chance: baseChance
            });
        });

        const totalChance = allPrizes.reduce((sum, p) => sum + p.chance, 0);
        allPrizes.forEach(p => p.chance = p.chance / totalChance);

        let roll = Math.random();
        let selectedPrize = allPrizes[allPrizes.length - 1];
        for (const prize of allPrizes) {
            if (roll < prize.chance) {
                selectedPrize = prize;
                break;
            }
            roll -= prize.chance;
        }

        let inventoryItem;
        let rewardText;
        let isStackOverflow = false;

        if (selectedPrize.type === 'coins') {
            // Монеты в инвентарь
            inventoryItem = {
                id: 'coin_' + Date.now(),
                type: 'coin',
                name: `${selectedPrize.amount} DSCoins`,
                icon: '🪙',
                amount: selectedPrize.amount,
                price: selectedPrize.amount
                // serverTimestamp() УДАЛЕН
            };
            rewardText = `${selectedPrize.amount} 🪙`;
        } else {
            const shopItem = selectedPrize.item;
            const existingItem = inventory.find(item => item.id === shopItem.id);

            if (existingItem) {
                const currentCount = existingItem.count || 1;
                if (currentCount >= MAX_STACK_SIZE) {
                    isStackOverflow = true;
                    const refundAmount = Math.floor(shopItem.price * 0.9);
                    await updateDoc(userRef, { dsCoins: increment(refundAmount) });
                    rewardText = `🔥 Стак переполнен! Получено ${refundAmount} монет`;
                    return {
                        success: true,
                        prize: selectedPrize,
                        rewardText: rewardText,
                        isStackOverflow: true,
                        refundAmount: refundAmount
                    };
                } else {
                    // Обновляем стак вручную
                    const newInventory = inventory.map(item => {
                        if (item.id === shopItem.id) {
                            return { ...item, count: currentCount + 1 };
                        }
                        return item;
                    });
                    await updateDoc(userRef, { inventory: newInventory });
                    rewardText = `${shopItem.icon} ${shopItem.name} x${currentCount + 1}`;
                    return {
                        success: true,
                        prize: selectedPrize,
                        rewardText: rewardText,
                        isStackOverflow: false,
                        inventoryItem: { ...shopItem, count: currentCount + 1 }
                    };
                }
            } else {
                // Новый предмет
                inventoryItem = {
                    id: shopItem.id,
                    type: shopItem.type,
                    name: shopItem.name,
                    icon: shopItem.icon,
                    price: shopItem.price
                    // serverTimestamp() УДАЛЕН
                };
                rewardText = shopItem.icon + ' ' + shopItem.name;
            }
        }

        // Добавляем в инвентарь через исправленную addItemToInventory (без arrayUnion)
        if (inventoryItem) {
            const addResult = await addItemToInventory(uid, inventoryItem);
            if (!addResult.success) {
                // Возвращаем монеты если не удалось добавить
                await updateDoc(userRef, { dsCoins: increment(price) });
                return { success: false, error: addResult.error };
            }
        }

        return {
            success: true,
            prize: selectedPrize,
            inventoryItem: inventoryItem,
            rewardText: rewardText,
            isStackOverflow: false
        };

    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== ПРОДАЖА МОНЕТ ИЗ ИНВЕНТАРЯ ==========
// ============================================================

async function sellCoinFromInventory(uid, itemId) {
    try {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) return { success: false, error: "Пользователь не найден" };

        const inventory = docSnap.data().inventory || [];
        const itemIndex = inventory.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return { success: false, error: "Предмет не найден" };

        const item = inventory[itemIndex];
        if (item.type !== 'coin') {
            return { success: false, error: "Это не монета" };
        }

        // Удаляем предмет из инвентаря
        inventory.splice(itemIndex, 1);
        await updateDoc(userRef, {
            inventory: inventory,
            dsCoins: increment(item.amount) // Добавляем монеты на баланс
        });

        return { success: true, amount: item.amount };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== ЭКСПОРТ ==========
// ============================================================

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
    getTitleViews,
    claimDailyBonus,
    addItemToInventory,
    removeItemFromInventory,
    equipStatus,
    unequipStatus,
    giftItem,
    updateStatusText,
    sellItem,
    buyItem,
    openLootbox,
    transferCoins
};

console.log('🔥 Модуль firebase-config.js загружен');