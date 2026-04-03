/**
 * 聊天相关常量
 */

// WebSocket 消息类型
export const WS_MESSAGE_TYPE = {
  WELCOME: 'welcome',
  USER: 'user',
  STREAM_START: 'stream_start',
  TEXT_DELTA: 'text_delta',
  THINKING_DELTA: 'thinking_delta',
  TEXT_STOP: 'text_stop',
  TOOL_USE_START: 'tool_use_start',
  TOOL_USE_STOP: 'tool_use_stop',
  TOOL_CALL: 'tool_call',
  TOOL_RESULT: 'tool_result',
  RESPONSE: 'response',
  STATUS: 'status',
  ERROR: 'error',
  THINKING: 'thinking'
} as const

// 工具调用状态
export const TOOL_STATUS = {
  PREPARING: 'preparing',
  EXECUTING: 'executing',
  COMPLETED: 'completed'
} as const

// 消息角色
export const MESSAGE_ROLE = {
  USER: 'user',
  ASSISTANT: 'assistant'
} as const

// 内容块类型
export const CONTENT_BLOCK_TYPE = {
  TEXT: 'text',
  THINKING: 'thinking',
  TOOL_USE: 'tool_use',
  TOOL_RESULT: 'tool_result'
} as const

// 推荐问题列表（真实业务场景）
export interface SuggestedQuestion {
  text: string
  businessLine?: 'product' | 'oa' | 'common'
}

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  // 通用问题
  { text: '你好，帮我介绍一下你有哪些功能', businessLine: 'common' },
  // 下单购物类 —— 完整购物链路，最能体现 Agent 多工具调用能力
  {
    text: '我想购买一台 iPhone 15 Pro 256GB，帮我查下库存和价格，然后下单，收货人张伟，电话 18800001234，地址北京市朝阳区三里屯1号',
    businessLine: 'product'
  },
  {
    text: '帮我下单一台 MacBook Air 15寸 M3，微信支付，收货人李明，电话 13900001234，地址上海市浦东新区世纪大道100号',
    businessLine: 'product'
  },
  {
    text: '我想买一副 AirPods Pro，先帮我预留库存，然后创建订单，用支付宝付款，地址广州市天河区体育西路1号',
    businessLine: 'product'
  },
  {
    text: '帮我买一台小米14 Pro，先预留库存再下单，支付宝付款，收货人王芳，电话 13700001234，地址深圳市南山区科技园',
    businessLine: 'product'
  },
  // 商品查询 & 比价类
  {
    text: '帮我对比 iPhone 15 Pro、华为 Mate 60 Pro 和小米14 Pro 三款手机的价格与库存，推荐最值得买的一款',
    businessLine: 'product'
  },
  {
    text: '我有 4000 元预算想买一款降噪耳机，搜索所有符合条件的商品并对比规格',
    businessLine: 'product'
  },
  {
    text: '搜索所有苹果品牌的商品，按价格从低到高排列，并告诉我哪款性价比最高',
    businessLine: 'product'
  },
  // 热销推荐类
  {
    text: '查看手机品类当前热销榜 Top5，并告诉我每款的库存和价格',
    businessLine: 'product'
  },
  {
    text: '我有 8000 元预算想买一台笔记本电脑，推荐几款并比较性价比，然后帮我下单最合适的那款',
    businessLine: 'product'
  },
  { text: 'AirPods Max 太贵了，推荐几款价格相近的替代耳机，比较一下优劣', businessLine: 'product' },
  // 订单 & 库存查询类
  { text: '查询手机号 13800138001 的所有历史订单记录', businessLine: 'product' },
  { text: '帮我查订单 ORD2026032000002 的详细信息和商品明细', businessLine: 'product' },
  { text: '查看 iPhone 15 Pro 的当前库存和预留情况，是否还有现货？', businessLine: 'product' },
  // 组合推荐 & 礼品类
  {
    text: '帮我找3款500元以内适合商务送礼的好茶，分别介绍特点，然后帮我下单最受欢迎的一款，收货人陈总，电话 13600001234，地址北京市西城区金融街1号',
    businessLine: 'product'
  },
  {
    text: '推荐一个手机+配套耳机的最佳搭配方案，预算 12000 元以内，帮我一起下单，收货人赵磊，电话 13500001234，地址成都市高新区天府大道100号',
    businessLine: 'product'
  },
  // 数据分析类 —— 触发销售统计、库存预警、品类分析等分析接口
  {
    text: '统计各品类的销售情况，哪个品类销售额最高？哪款商品最畅销？给我一份完整的销售分析报告',
    businessLine: 'product'
  },
  {
    text: '查询当前库存预警商品（低于30件），汇总哪些商品需要紧急补货，并按库存从少到多排列',
    businessLine: 'product'
  },
  {
    text: '分析手机品类的热销榜和库存状况，结合各品类销售数据，给我推荐现在最值得进货的品类',
    businessLine: 'product'
  },
  {
    text: '帮我做一次全面的经营健康检查：统计各品类商品数量与销售额、找出滞销和热销商品、列出库存告急的SKU',
    businessLine: 'product'
  },
  // ========== OA 办公自动化类 ==========
  // 员工管理 - 查询类
  { text: '查看公司所有员工列表，按部门分组显示', businessLine: 'oa' },
  { text: '查询员工刘洋的详细信息，包括职位、部门、入职时间等', businessLine: 'oa' },
  { text: '搜索名字包含"张"的员工', businessLine: 'oa' },
  { text: '查看技术部有哪些员工', businessLine: 'oa' },
  { text: '统计一下各部门有多少员工', businessLine: 'oa' },
  // 请假管理 - 查询类
  { text: '查看刘洋的所有请假记录', businessLine: 'oa' },
  { text: '查询员工编号 EMP007 的请假历史', businessLine: 'oa' },
  { text: '查看本月所有待审批的请假申请', businessLine: 'oa' },
  { text: '统计各部门本月请假人数和总天数', businessLine: 'oa' },
  // 请假管理 - 操作类
  { text: '帮我提交一个请假申请：年假 3 天，4月5日到4月7日', businessLine: 'oa' },
  { text: '提交一个病假申请：4月10日一天，身体不适需要休息', businessLine: 'oa' },
  { text: '查询请假申请 LV20260301001 的审批状态', businessLine: 'oa' },
  { text: '取消我的待审批请假申请', businessLine: 'oa' },
  // 报销管理 - 查询类
  { text: '查看刘洋的所有报销记录', businessLine: 'oa' },
  { text: '查询本月所有待审批的报销申请', businessLine: 'oa' },
  { text: '统计本月报销金额最高的前 5 位员工', businessLine: 'oa' },
  // 报销管理 - 操作类
  { text: '帮我提交一个报销申请：差旅费 1500 元，3月份北京出差', businessLine: 'oa' },
  { text: '提交一个交通费报销：256.5元，机房维护打车费用', businessLine: 'oa' },
  { text: '查询报销申请 EX20260301001 的审批进度', businessLine: 'oa' }
]
