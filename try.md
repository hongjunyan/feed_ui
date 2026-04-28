幫我多一個分頁是"主題探索"，當user進入該分頁時，
會call backend GET /djshakespeare/news/clustering?date=2026-04-27，載入昨日新聞的clusters，並精美且明瞭的呈現每一個cluster。
因為載入需要時間(大約1分鐘)，因此可以做一些有趣的等待畫面，
在頁面上，user可以選擇日期(最大日期只能到昨天)去察看對應的新聞cluster。



Backend API說明如下:

ENDPOINT: https://pm.moneydj.com/djshakespeare/

GET /djshakespeare/news/clustering

參數	型別	必填	說明
date	string	是	目標日期，格式 YYYY-MM-DD

範例
GET /djshakespeare/news/clustering?date=2026-04-27

Response
{
  "date": "2026-04-27",
  "total": 651,        // 新聞總數
  "n_clusters": 8,     // 群數
  "clusters": [        // 每群摘要（按 cluster_id 排序）
    { "cluster_id": 0, "topic": "台積電法說會與半導體展望", "count": 85 },
    { "cluster_id": 1, "topic": "Fed 利率決議", "count": 62 }
    // ...
  ],
  "items": [           // 逐篇新聞（每篇帶所屬 cluster 資訊）
    {
      "cluster_id": 0,
      "topic": "台積電法說會與半導體展望",
      "title": "台積電Q1營收創新高...",
      "date": "2026-04-27T08:00:00",
      "news_url": "https://...",
      "ref": "a1b2c3d4"
    }
    // ...
  ]
}

錯誤
404 — 該日期無新聞：{"detail": "No news found for date 2026-04-27"}