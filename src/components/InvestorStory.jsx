import React, { useEffect, useRef, useState } from 'react'
import './InvestorStory.css'

const TREE_EXAMPLE = {
  root: '蘋果交棒',
  branches: [
    {
      id: 'b1',
      title: '蘋果交棒股價與資金流動',
      children: [
        '蘋果交棒接班時間線',
        '蘋果交棒對產品路線影響',
        '蘋果交棒對企業治理變動',
        '蘋果交棒媒體與投資人情緒',
        '蘋果交棒與歷史接班案例比較',
      ],
    },
    {
      id: 'b2',
      title: '蘋果交棒對台積電/鴻海訂單衝擊',
      children: [
        '蘋果交棒當日股價與成交量',
        '蘋果交棒觸發美股與那指資金流向',
        '蘋果交棒對AAPL期權IV與未平倉量',
        '蘋果交棒相關ETF與被動指數資金動向',
        '蘋果交棒導致ADR與台股資金移位',
      ],
    },
    {
      id: 'b3',
      title: '蘋果交棒後營運KPI與估值影響',
      children: [
        '蘋果交棒對台積電晶圓訂單量影響',
        '蘋果交棒對台積電先進製程利用率',
        '蘋果交棒對鴻海iPhone組裝訂單分配',
        '蘋果交棒讓Samsung與立訊承接訂單機會',
        '蘋果交棒引發供應鏈庫存與付款條件變化',
      ],
    },
    {
      id: 'b4',
      title: '法人觀點彙整：投行對蘋果交棒解讀',
      children: [
        '蘋果交棒對營收成長率與iPhone出貨影響',
        '蘋果交棒對毛利率與產品組合影響',
        '蘋果交棒對自由現金流與資本回饋政策',
        '蘋果交棒對PE/EV/DCF估值敏感度',
        '蘋果交棒下分部(Sources)估值重估',
      ],
    },
    {
      id: 'b5',
      title: '情境分析：蘋果交棒下EPS與DCF模型',
      children: [
        '摩根士丹利對蘋果交棒多空論點整理',
        '高盛對蘋果交棒策略與評等觀察',
        '摩根大通與花旗對交棒後資本支出預估',
        '國內投信與外資對蘋果交棒持股調整',
        '法人共識分歧：增持VS減持指標比較',
      ],
    },
  ],
}

const EXTRA_LEAVES = [
  '蘋果交棒三情境EPS成長假設表',
  '蘋果交棒DCF之自由現金流與折現率假設',
  '蘋果交棒下回購與股利敏感度分析',
  '蘋果交棒悲觀情境市值下檔量化估算',
]

const STEPS = [
  {
    key: 's1',
    title: 'Step 1',
    name: '鎖定今日五大主題',
    body:
      '從當日全部新聞中，萃取最具市場意義的五個主題。這五則就是 Feed 牆上「五篇就好」的錨點，確保讀者每天只看最關鍵的敘事主軸。',
  },
  {
    key: 's2',
    title: 'Step 2',
    name: '主題樹狀擴增與史料檢索',
    body:
      '每一個主題會以樹狀結構擴增：深度為 2、每一層長出 5 個子節點。接著以每個子主題去檢索近 90 日相關新聞，作為後續撰寫的事實與脈絡素材庫。',
  },
  {
    key: 's3',
    title: 'Step 3',
    name: '引爆點與消息面開篇',
    body:
      '在蒐集到的新聞中，從「今日新聞」挑選與主題最相關的引爆點，據此下標題、撰寫導言與消息面段落，讓文章一開頭就扣住當日市場情緒。',
  },
  {
    key: 's4',
    title: 'Step 4',
    name: '產業面與基本面延伸',
    body:
      '以 Step 3 的導言與消息面為起點，延伸產業結構、供應鏈與基本面章節，把「發生什麼事」帶到「為什麼重要、影響誰、影響多久」。',
  },
  {
    key: 's5',
    title: 'Final',
    name: '引用、刪冗與潤稿',
    body:
      '補上 citation、刪除冗句、潤稿並檢查邏輯銜接，讓消息面 → 產業面 → 基本面一氣呵成，方便投資人快速掃讀與深度閱讀並行。',
  },
]

function useReveal() {
  const containerRef = useRef(null)

  useEffect(() => {
    const root = containerRef.current
    if (!root) return undefined

    const els = root.querySelectorAll('[data-reveal]')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          }
        })
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )

    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return containerRef
}

function TopicTree() {
  const [openId, setOpenId] = useState(null)

  return (
    <div className="ist-tree" data-reveal>
      <div className="ist-tree-glow" aria-hidden />
      <div className="ist-tree-root">
        <span className="ist-tree-root-label">主題（深度 0）</span>
        <div className="ist-tree-root-node">
          <span className="ist-tree-pulse" aria-hidden />
          {TREE_EXAMPLE.root}
        </div>
      </div>

      <div className="ist-tree-spine" aria-hidden>
        <span className="ist-tree-spine-line" />
      </div>

      <p className="ist-tree-hint">
        點選下方任一主幹，可展開 5 個子主題（深度 2）。實際系統會對<strong>每個</strong>子主題各查近 90 日新聞。
      </p>

      <div className="ist-tree-branches">
        {TREE_EXAMPLE.branches.map((b, i) => {
          const open = openId === b.id
          return (
            <div
              key={b.id}
              className={`ist-tree-branch ist-stagger-${(i % 5) + 1} ${open ? 'is-open' : ''}`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <button
                type="button"
                className="ist-tree-l1"
                onClick={() => setOpenId(open ? null : b.id)}
                aria-expanded={open}
              >
                <span className="ist-tree-l1-index">L1 · {i + 1}</span>
                <span className="ist-tree-l1-title">{b.title}</span>
                <span className="ist-tree-l1-chev" aria-hidden>
                  {open ? '▾' : '▸'}
                </span>
              </button>

              <div className="ist-tree-l2-wrap" aria-hidden={!open}>
                <ul className="ist-tree-l2-list">
                  {b.children.map((c, j) => (
                    <li
                      key={c}
                      className="ist-tree-l2-item"
                      style={{ animationDelay: `${j * 0.04}s` }}
                    >
                      <span className="ist-tree-l2-dot" aria-hidden />
                      <span className="ist-tree-l2-badge">L2</span>
                      <span className="ist-tree-l2-text">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </div>

      <div className="ist-tree-extra" data-reveal>
        <span className="ist-tree-extra-title">同流程可再深挖（範例延伸）</span>
        <ul className="ist-tree-extra-list">
          {EXTRA_LEAVES.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function InvestorStory() {
  const revealRef = useReveal()

  return (
    <div className="ist" ref={revealRef}>
      <div className="ist-hero">
        <div className="ist-hero-aurora" aria-hidden />
        <div className="ist-hero-grid" aria-hidden />
        <div className="ist-hero-inner" data-reveal>
          <p className="ist-hero-kicker">給使用者的說明</p>
          <h2 className="ist-hero-title">這些文章是怎麼產生的？</h2>
          <p className="ist-hero-lead">
            我們把「每日五則」當成產品承諾：從海量新聞中挑出五條主線，再用結構化的研究樹補齊脈絡，最後寫成可掃讀、可深讀的一貫敘事。
          </p>
        </div>
      </div>

      <div className="ist-body">
        <section className="ist-section" data-reveal>
          <h3 className="ist-section-title">一鍵看懂的產製管線</h3>
          <p className="ist-section-desc">
            下列節點會依序「點亮」，呼應實際流程：從主題萃取 → 史料與子題展開 → 當日引爆點開篇 → 產業與基本面延展 → 引用與潤稿定稿。
          </p>
          <div className="ist-pipeline" aria-label="產製流程">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.key}>
                <div
                  className={`ist-pipeline-node ist-stagger-${(idx % 5) + 1}`}
                  style={{ animationDelay: `${idx * 0.12}s` }}
                >
                  <span className="ist-pipeline-ring" aria-hidden />
                  <span className="ist-pipeline-step">{s.title}</span>
                  <span className="ist-pipeline-name">{s.name}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="ist-pipeline-connector" aria-hidden>
                    <span className="ist-pipeline-connector-line" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        <section className="ist-section ist-section-steps" data-reveal>
          <h3 className="ist-section-title">各步驟在做什麼</h3>
          <div className="ist-step-cards">
            {STEPS.map((s, i) => (
              <article
                key={s.key}
                className={`ist-step-card ist-stagger-${(i % 5) + 1}`}
                data-reveal
              >
                <header className="ist-step-card-head">
                  <span className="ist-step-badge">{s.title}</span>
                  <h4 className="ist-step-name">{s.name}</h4>
                </header>
                <p className="ist-step-body">{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="ist-section" data-reveal>
          <h3 className="ist-section-title">主題樹：5 × 5 的可視化範例</h3>
          <p className="ist-section-desc">
            以下用您提供的「蘋果交棒」示意：根節點 1 個、第一層子主題 5 個、每個子主題再展開 5 個子節點（深度 2）。系統會對<strong>每個葉節點</strong>各跑一次近 90 日新聞檢索，再把精華餵給後續撰文模型。
          </p>
          <TopicTree />
        </section>

        <section className="ist-section ist-section-foot" data-reveal>
          <div className="ist-foot-card">
            <h3 className="ist-foot-title">結語</h3>
            <p className="ist-foot-copy">
              Feed 牆上的每一篇，背後都是「當日主題 × 結構化子題 × 近季新聞證據」疊出來的；我們刻意把閱讀負擔壓在五則，把研究深度藏在樹狀展開與引用裡，讓您能快取結論、也能循線驗證。
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
