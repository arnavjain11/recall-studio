RECALL STUDIO v3 — FREE OFFLINE STUDY APP
======================================

HOW TO OPEN
Mac / Windows / Linux: Double-click Recall_Studio_v3_Offline.html.
Android / iOS: The installable version (this folder) needs an HTTPS URL once, such as your own static hosting. Visit it in your phone browser, then Add to Home Screen / Install. After the site and its files are cached, it can run without internet. Standalone HTML opened directly from mobile file managers is browser-dependent and may not retain storage reliably.

WHAT'S NEW IN v3
- Four offline-friendly study games: Match, Blocks, Charms and Blast.
- Dedicated unlimited MCQ mode, Learn, Write, Flashcards, Spaced Review, Blitz and Tests.
- Random flashcard order, starred-only quiz, and a special Review last 10 mistakes mode.
- Per-set stats: correct answers, accuracy, mastered, still learning and unstudied words.
- Browse all still-learning terms, recent mistakes, and practice history.
- Star button INSIDE top-right of flashcards and questions.
- Keyboard shortcuts: Space flip, arrows navigate, F star, R randomize, 1-4 answers, ? help, Alt/Option+P optional pronunciation, S speak if enabled.
- Optional transcription/pronunciation hidden by default, configurable under Settings.
- Autosaved decks and progress, JSON/CSV exports, and full backups.
- 274 user-supplied English vocabulary entries included in a local set.

SAFE UPGRADE: BACK UP FIRST
1. Open your previous Recall Studio v2 and use Settings -> Back up everything.
2. Open Recall Studio v3 and use Import cards to select that JSON backup.
3. Confirm replacement when prompted. This replaces v3 demo decks with your backup contents, retaining the actual saved cards and stats in that file. If your v2 sets appear automatically, still keep the backup.
Browser storage is tied to a URL and, for standalone files, browser-specific file origins. New HTML filenames can be treated as new storage by Safari/Chrome. Opening a new version is not a substitute for importing an old backup. There is no automatic syncing between devices.

INSTALLABLE APP
Upload the `recall_studio` folder and its files to static HTTPS hosting, or run locally via a server for testing. `index.html`, `app.js`, `styles.css`, icons, manifest and sw.js are all included. No JavaScript libraries or network APIs are needed for study features. The service worker caches core assets for offline use after an initial successful visit.

PRIVACY AND DATA
The app has no accounts, trackers or API calls. Study state is stored in the browser using IndexedDB with a localStorage fallback. Export full JSON backups regularly, especially before browser updates, reinstallations or clearing browser data. Browser storage can be erased, and using Private Browsing is not safe for saving study progress. No guarantees of cross-device or cross-browser automatic persistence.

VOICE
Optional pronunciation uses local voices when the device/browser makes them available. Some browsers may use an online speech service; leave the setting disabled for strictly local study. Pinyin/transcription is NEVER auto-generated.

Source code is included in the installable package, with an MIT license. Game designs are original implementations inspired by general study-game ideas and are not copies of Quizlet code or artwork.


RECALL STUDIO V4 — OCTOBER 2026
--------------------------------
- True/False practice and tests: False is left, True is right (also on phones).
- Blitz: correct answers advance immediately; incorrect answers show feedback.
- In-study quick accessibility tools: larger text, focus mode, reduced motion and
  optional pronunciation/audio, preserving existing settings and local sets.
- A Chinese-character handwriting room appears ONLY in study sets that contain
  Hanzi. Draw with a touch screen, pen or mouse; select characters and erase ink.
- The local stroke-order hints cover 29 introductory characters as simplified
  stroke-centerline guides. All other characters use ungraded freehand practice,
  not a claimed verified stroke order. This is not handwriting recognition.
- Keeping your pre-existing sets: local app/browser origins determine whether
  data from a previous standalone HTML is visible. Export the previous app's
  full JSON backup and import it here if needed; do not delete the old version
  before verifying progress.
- There are no remote scripts, assets or backend calls in this package.


RECALL STUDIO V5 — LIBRARY MANAGEMENT
--------------------------------------
- Delete individual sets directly from My Library (small trash icon) or
  from their detail pages. Requires confirmation.
- Multi-select and delete multiple sets in one confirmed action.
- Search, folder, subject and progress filters; sort by recency, name,
  size, review count or mastery. Filters do not alter cards.
- Older Mandarin starter decks are NOT automatically reinstalled or deleted.
  If they appear, they belong to existing locally saved study data. Delete
  a set explicitly using the trash icon. Existing sets are preserved.
- Deleted set history, recent mistakes, matching and arcade records are
  removed as part of the confirmed delete. Export a JSON backup beforehand.
- The same v1 storage key is maintained for migration; different file URLs
  can still have different browser storage. When in doubt, import a backup.


Version 5.1 iPhone white-screen fix:
Upload ALL files from this folder to the same repository root, replacing the old files. Safari should be tested on the public HTTPS Pages URL first. Versioned JS/CSS URLs bypass outdated script caches; navigation uses network-first with offline fallback. If app startup fails, an error message is displayed instead of an endless loading screen.
Always back up your study sets before resetting Safari website data or deleting a Home Screen app.
