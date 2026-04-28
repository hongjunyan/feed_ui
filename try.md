幫我在feed的第一層的頁面的上方，新增一個"加入新主題"的按鈕，
按下去之後，可以讓user去填寫topic和日期(最大值限定是昨天)，按送出後，會call backend POST /workflow/run-topic。
注意，如果已經存在topic，就終止，並跟user說topic已存在。
接著，執行中可以透過GET "/tasks/{task_id}/status"來取得進度，以及目前執行到哪一個node。
如果狀態確認是完成，就釋放讓"加入新主題"的按鈕。

請注意，該篇文章有按過執行的話，請紀錄每個topic對應的task_id，方便追蹤進度，也避免user跳轉其他頁面而失去狀態，
等到task_id狀態是完成，才清除掉


Backend API說明如下:

ENDPOINT: https://pm.moneydj.com/djshakespeare/

1. POST /workflow/run-topic — 以指定主題執行 workflow
Input:


{
  "topics": ["台積電法說會", "聯準會升息"],   // required, 主題列表
  "end": "2026-04-27"                         // optional, 結束日期，預設今天
}
Output:


{
  "task_id": "a1b2c3d4e5f6",
  "thread_id": "abcdef123456..."
}

2. GET /tasks/{task_id}/status — 查詢任務狀態
Input: path parameter task_id

Output:


{
  "task_id": "a1b2c3d4e5f6",
  "status": "running",              // "pending" | "running" | "completed" | "failed"
  "created_at": "2026-04-27T08:00:00Z",
  "finished_at": null,              // 完成後才有值
  "current_node": "write_article_body",  // 當前執行的 node，完成後為 null
  "langfuse_trace_url": "https://cloud.langfuse.com/trace/xxx",
  "thread_id": "abcdef123456...",
  "error": null                     // 失敗時才有值
}