幫在Feed點擊進入第二層的文章中，多一個""，新增一個排程設定，可以讓user去設定，但因為user不懂crontab語法，請設計比較白話的介面


Backend API說明如下:

ENDPOINT: https://pm.moneydj.com/djshakespeare/
POST /articles/generate-key-image
為文章產生 N 張封面配圖。

Request Body
欄位	型別	必填	預設值	說明
article	string	✅	—	文章內容（純文字或 Markdown）
title	string	—	""	文章標題（提供可提升圖片相關性）
size	string	—	"1024x1024"	圖片尺寸：1024x1024 / 1536x1024（橫）/ 1024x1536（直）
n_images	integer	—	3	產生幾張圖，範圍 1–10
Response Body
{
  "images": [
    {
      "prompt": "The English prompt sent to the image model...",
      "image_base64": "<PNG base64 string>"
    }
  ]
}
images 陣列長度等於 n_images
image_base64 直接用於 <img src="data:image/png;base64,{image_base64}" />
注意事項
圖片風格：寫實攝影風，白天明亮光線，色調依文章情緒而定
回應時間較長（每張約 10–20 秒），建議 UI 顯示 loading 狀態
成本考量，n_images 建議維持預設 3 張，讓使用者選一張使用