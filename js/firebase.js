// ====================================================
// FREE PORT Firebase Firestore 連携
// Firestore にサイトデータを保存・読込
// ====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAr2O-a0vMkyjpODx2T2mYAjnCmthgm-Cs",
  authDomain: "freeport-bf780.firebaseapp.com",
  projectId: "freeport-bf780",
  storageBucket: "freeport-bf780.firebasestorage.app",
  messagingSenderId: "1020840624366",
  appId: "1:1020840624366:web:5dce15a1227e00ee47f3ff"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ====== ページデータ保存 ======
// コレクション: siteData / ドキュメント: ページ名 (camp, coffee, gear, etc., password)
// 例: savePageData('password', { value: 'newpass' }) → siteData/password.value = 'newpass'
// エラー時は例外を投げる（呼び出し側で .catch() してエラー内容を表示すること）
export async function savePageData(pageName, data) {
  await setDoc(doc(db, "siteData", pageName), data);
  return true;
}

// ====== ページデータ読込 ======
// ドキュメントが存在しない場合は null を返す
// 接続エラーや権限エラーは例外を投げる
export async function loadPageData(pageName) {
  const snap = await getDoc(doc(db, "siteData", pageName));
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

// ====== 画像データ保存（base64） ======
// コレクション: siteData / ドキュメント: images_<pageName>
export async function saveImageData(pageName, imageKey, base64DataUrl) {
  try {
    const docRef = doc(db, "siteData", "images_" + pageName);
    const snap = await getDoc(docRef);
    const existing = snap.exists() ? snap.data() : {};
    existing[imageKey] = base64DataUrl;
    await setDoc(docRef, existing);
    return true;
  } catch (e) {
    console.error("Firestore saveImageData error:", e);
    return false;
  }
}

// ====== 画像データ一括読込 ======
export async function loadImageData(pageName) {
  try {
    const snap = await getDoc(doc(db, "siteData", "images_" + pageName));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (e) {
    console.error("Firestore loadImageData error:", e);
    return null;
  }
}

// ====== 画像リサイズ（base64保存前に圧縮） ======
// Firestore ドキュメント上限 1MB に収まるよう 1200x900 以下、JPEG 0.8 品質
export function resizeImage(file, maxWidth, maxHeight) {
  maxWidth = maxWidth || 1200;
  maxHeight = maxHeight || 900;
  return new Promise(function(resolve) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var w = img.width;
        var h = img.height;
        if (w > maxWidth || h > maxHeight) {
          var ratio = Math.min(maxWidth / w, maxHeight / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        var dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
