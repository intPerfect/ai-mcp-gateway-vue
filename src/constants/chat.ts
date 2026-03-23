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

// 推荐问题列表
export const SUGGESTED_QUESTIONS = [
  // 分类分析类
  { text: '统计各分类商品数量，找出商品最多的分类' },
  { text: '分析销售数据，给出补货和促销建议' },
  { text: '对比各分类的平均价格区间' },
  // 商品查询类
  { text: '查看热销榜单Top5的详情和库存' },
  { text: '查找库存不足商品，推荐价格相近替代品' },
  { text: '搜索价格在100-500元之间的热销商品' },
  { text: '查找评分最高的商品及其评价详情' },
  // 订单操作类
  { text: '帮商品ID为1下单：查库存、算价格、创建订单' },
  { text: '查询最近订单的物流状态' },
  { text: '帮用户下单一件热销商品并确认库存' },
  // 数据分析类
  { text: '分析当前库存状态，给出预警建议' },
  { text: '统计今日销售额和订单量' },
  { text: '找出利润率最高的商品分类' },
  { text: '对比本月与上月销售趋势' },
  // 综合任务类
  { text: '推荐三款性价比最高的商品' },
  { text: '查找用户最常购买的商品组合' },
  { text: '分析哪些商品适合做促销活动' }
] as const
