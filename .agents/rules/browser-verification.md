---
trigger: always_on
---

# 瀏覽器實機畫面驗證規則

當需要進行瀏覽器實機畫面驗證時，若 `http://localhost:9222/json/version` 未回應，請先在背景執行：

```powershell
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--headless=new", "--remote-debugging-port=9222", "--user-data-dir=C:\ChromeDebugProfile"
```

等待 2 秒後再透過 `localhost:9222` 連線驗證，驗證完成後關閉該測試程序。
