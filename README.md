# 匯率換算

GitHub Pages / iPhone PWA 版本。功能包含：

- TWD / KRW / PHP / USD 任意兩幣別換算
- `+ − × ÷` 計算機，可直接算旅費總額
- 市場匯率自動更新，並把上次成功匯率存在手機
- 離線可使用計算機與上次匯率
- 「我的匯率」可自訂，例如 `1 USD = 58 PHP`
- 自訂匯率會保存在瀏覽器本機，不需要網路

## 上 GitHub Pages

把這 7 個檔案全部放到 repository 根目錄：

1. index.html
2. style.css
3. app.js
4. service-worker.js
5. manifest.json
6. icon.svg
7. README.md

GitHub → Settings → Pages → Deploy from branch → main / root。

網址可使用：
`https://roni8268.github.io/exchange-rate/`

第一次開啟時先讓它取得一次市場匯率。之後即使到菲律賓網路不穩，仍可使用計算機、我的匯率，以及最後一次成功儲存的市場匯率。
