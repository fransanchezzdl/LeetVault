!macro customInstall
  ; Ensure the user-data directory exists so the app can write the SQLite DB on first run.
  ; Path mirrors v1 (Inno Setup) so existing leetcode.db is picked up automatically.
  CreateDirectory "$APPDATA\LeetVault"
!macroend

!macro customUnInstall
  ; Keep the database directory intact on uninstall — user data must survive.
!macroend
