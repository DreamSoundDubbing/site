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
    runTransaction
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
            achievements: []
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
                    achievements: []
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
                transaction.update(targetRef, {
                    subscribers: arrayRemove(currentUserId)
                });
                transaction.update(currentRef, {
                    subscriptions: arrayRemove(targetUserId)
                });
            } else {
                transaction.update(targetRef, {
                    subscribers: arrayUnion(currentUserId)
                });
                transaction.update(currentRef, {
                    subscriptions: arrayUnion(targetUserId)
                });
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
                await updateDoc(docRef, {
                    achievements: arrayUnion(ach)
                });
            }
        }
    } catch (error) {
        console.error('Ошибка при добавлении достижения:', error);
    }
}

async function addCustomAchievement(uid, achievement) {
    try {
        const docRef = doc(db, "users", uid);
        await updateDoc(docRef, {
            achievements: arrayUnion(achievement)
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== КОММЕНТАРИИ (с отметками) ==========
// ============================================================

async function addComment(titleId, text, rating, mentionedEmails = []) {
    const user = getCurrentUser();
    if (!user) {
        return { success: false, error: "Необходимо авторизоваться" };
    }
    try {
        // Поиск упоминаний @email
        const mentions = text.match(/@([^\s]+)/g) || [];
        const mentionedEmailsFromText = mentions.map(m => m.substring(1));
        
        // Объединяем с переданными email
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
        await updateDoc(userRef, {
            commentsCount: increment(1)
        });
        
        const newCommentsCount = (userData.success ? userData.data.commentsCount || 0 : 0) + 1;
        await checkAndAddAchievement(user.uid, 'comments', newCommentsCount);
        
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getComments(titleId) {
    try {
        const q = query(
            collection(db, "comments"),
            where("titleId", "==", titleId),
            orderBy("time", "desc")
        );
        const querySnapshot = await getDocs(q);
        const comments = [];
        querySnapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() });
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
// ========== ПРОСМОТРЫ СЕРИЙ ==========
// ============================================================

async function trackView(uid, titleId, episodeNumber) {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            viewsCount: increment(1)
        });
        
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
// ========== СРЕДНЯЯ ОЦЕНКА ТАЙТЛА ==========
// ============================================================

async function getAverageRating(titleId) {
    try {
        const q = query(
            collection(db, "comments"),
            where("titleId", "==", titleId)
        );
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
// ========== ДАННЫЕ (ТАЙТЛЫ, ДАББЕРЫ, РОЛИ) ==========
// ============================================================

// ---- ТАЙТЛЫ ----

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
        
        // Если документ существует, обновляем его (чтобы избежать дублирования)
        if (docSnap.exists()) {
            await updateDoc(docRef, {
                ...titleData,
                updatedAt: serverTimestamp()
            });
            return { success: true, id: docId, updated: true };
        }
        
        // Если не существует, создаём
        await setDoc(docRef, {
            ...titleData,
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
        
        // Проверяем, существует ли документ
        if (!docSnap.exists()) {
            // Если документ не существует, создаём его
            await setDoc(docRef, {
                ...data,
                id: titleId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true, created: true };
        }
        
        // Если существует, обновляем
        await updateDoc(docRef, {
            ...data,
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

// ---- ДАББЕРЫ ----

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
        
        // Если документ существует, обновляем его (чтобы избежать дублирования)
        if (docSnap.exists()) {
            await updateDoc(docRef, {
                ...voiceData,
                updatedAt: serverTimestamp()
            });
            return { success: true, id: docId, updated: true };
        }
        
        // Если не существует, создаём
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
        
        // Проверяем, существует ли документ
        if (!docSnap.exists()) {
            // Если документ не существует, создаём его
            await setDoc(docRef, {
                ...data,
                id: voiceId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true, created: true };
        }
        
        // Если существует, обновляем
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

// ---- РОЛИ ----

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

// ---- МАТЕРИАЛЫ ДЛЯ ОЗВУЧКИ ----

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
        // Убедитесь, что используете правильную коллекцию
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
        console.error('Ошибка создания заявки:', error);
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
// ========== ОПЛАТА ЧЕРЕЗ ЮMONEY ==========
// ============================================================

async function createPayment(orderId, amount, description) {
    try {
        const response = await fetch('https://api.yoomoney.ru/v2/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Bearer ' + YOOMONEY_ACCESS_TOKEN
            },
            body: new URLSearchParams({
                'amount': amount.toString(),
                'currency': 'RUB',
                'payment_method_data[type]': 'bank_card',
                'confirmation[type]': 'redirect',
                'confirmation[return_url]': window.location.origin + '/profile.html?payment=success',
                'description': description,
                'metadata[order_id]': orderId
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'pending' || data.status === 'waiting_for_capture') {
            await updateVoiceOrder(orderId, {
                paymentId: data.id,
                paymentStatus: data.status,
                paymentAmount: amount
            });
            
            return { 
                success: true, 
                paymentId: data.id,
                confirmationUrl: data.confirmation?.confirmation_url || null,
                status: data.status
            };
        } else {
            return { success: false, error: 'Ошибка создания платежа: ' + JSON.stringify(data) };
        }
    } catch (error) {
        console.error('Ошибка создания платежа:', error);
        return { success: false, error: error.message };
    }
}

async function checkPaymentStatus(paymentId) {
    try {
        const response = await fetch('https://api.yoomoney.ru/v2/payments/' + paymentId, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + YOOMONEY_ACCESS_TOKEN
            }
        });
        
        const data = await response.json();
        
        return { success: true, status: data.status, data: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// ========== АЧИВКИ ЗА ОПЛАТУ ==========
// ============================================================

async function grantPaymentAchievement(userId, orderId, achievementName, achievementIcon = '💎') {
    try {
        const achievement = {
            id: 'payment_' + Date.now(),
            name: achievementName || '💎 Платный заказ',
            icon: achievementIcon,
            description: 'Оплаченная заявка на озвучку #' + orderId,
            type: 'payment'
        };
        
        const result = await addCustomAchievement(userId, achievement);
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
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
        console.error('❌ Ошибка:', error);
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
    updateVoiceOrder
};

console.log('🔥 Модуль firebase-config.js загружен');