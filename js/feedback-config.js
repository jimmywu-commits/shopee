/* 使用者反饋雲端設定
 * 1. 建立 Firebase 專案，啟用 Firestore、Storage 與 Anonymous Authentication。
 * 2. 將 Firebase Web App 設定貼到 firebaseConfig。
 * 3. 設定完成後，所有使用者送出的反饋與附件會集中到 Firebase；
 *    feedback-admin.html 可跨裝置查看並勾選「已修正」。
 */
window.BN_FEEDBACK_CONFIG = {
  firebaseConfig: null,
  collectionName: 'bn_feedback',
  storageFolder: 'bn_feedback_attachments',
  maxAttachmentBytes: 10 * 1024 * 1024
};
