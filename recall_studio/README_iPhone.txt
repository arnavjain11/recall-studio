Recall Studio — iPhone installation (version label 1.0.0)

1. Export a full JSON backup from your current Recall Studio before updating.
2. Upload the files in THIS folder (not the outer folder) into the same location as the existing index.html in your GitHub Pages repository.
   For your earlier setup, that appears to be recall_studio/. Do not create an extra nested recall_studio/ folder.
3. If updating files via the GitHub website, choose existing files and edit/replace them (GitHub may require commits).
   If your workflow cannot overwrite multiple files, GitHub Desktop or git can update the folder together.
4. Your existing site URL is likely https://arnavjain11.github.io/recall-studio/recall_studio/
   (only if GitHub Pages still publishes from the repository root).
5. Open the URL in Safari while connected to the internet; confirm it loads.
6. In Safari Share > Add to Home Screen > Open as Web App (when available) > Add.
7. Open the new Home Screen icon while online once. Turn on Airplane Mode and reopen to verify offline access.
8. Import your JSON backup into the Home Screen app only if sets are missing. Note that Safari and standalone Web App may use separate storage.
9. Do NOT remove an old Home Screen installation until a backup is saved and the new one works.

Limits: On iOS, HTML opened from Files will not reliably work as a full offline app. Install from HTTPS.
No automatic device sync. App data remains local to the Safari/web-app storage context; iOS can evict site data under storage pressure.
The same 6 study modes and version label 1.0.0 are retained. No microphone-based assessment or branching stories.
