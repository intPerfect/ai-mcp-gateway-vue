/**
 * 自动滚动到底部 Hook（支持用户滚动检测与智能自动滚动）
 *
 * - scrollToBottom()      : 仅在用户未手动向上滚动时滚到底部（流式输出增量调用）
 * - scrollToBottomForce() : 强制滚到底部并重置用户滚动状态（发送消息时调用）
 * - userScrolled          : 用户是否处于"向上滚动"状态（用于显示下箭头按钮）
 * - initScroll / cleanupScroll : 挂载/卸载时注册/移除 scroll 事件监听
 */
import { ref, nextTick } from 'vue'

export function useScrollToBottom() {
  const containerRef = ref<HTMLElement | null>(null)
  const userScrolled = ref(false)
  let isProgrammaticScroll = false

  // 用户手动滚动时更新状态
  const onScroll = () => {
    if (isProgrammaticScroll) return
    if (!containerRef.value) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.value
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    // 距底部 > 100px 则认为用户向上翻阅
    userScrolled.value = distanceFromBottom > 100
  }

  const initScroll = () => {
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', onScroll, { passive: true })
    }
  }

  const cleanupScroll = () => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', onScroll)
    }
  }

  // 内部通用滚动实现：nextTick + RAF 双保险，确保 DOM 高度已更新
  const _doScroll = (smooth: boolean) => {
    isProgrammaticScroll = true
    nextTick(() => {
      requestAnimationFrame(() => {
        if (containerRef.value) {
          if (smooth) {
            containerRef.value.scrollTo({
              top: containerRef.value.scrollHeight,
              behavior: 'smooth'
            })
            // 平滑滚动动画通常需要 300-500ms，延长保护时间避免竞态
            setTimeout(() => {
              isProgrammaticScroll = false
            }, 800)
          } else {
            containerRef.value.scrollTop = containerRef.value.scrollHeight
            // 即时滚动同步完成，短暂保护即可
            setTimeout(() => {
              isProgrammaticScroll = false
            }, 150)
          }
        } else {
          isProgrammaticScroll = false
        }
      })
    })
  }

  /**
   * 条件滚动：仅当用户未手动向上翻阅时才滚到底部。
   * 适合流式输出增量调用。
   */
  const scrollToBottom = (smooth = false) => {
    if (userScrolled.value) return
    _doScroll(smooth)
  }

  /**
   * 强制滚到底部并重置 userScrolled 状态。
   * 适合用户主动发送消息或点击下箭头按钮。
   */
  const scrollToBottomForce = (smooth = false) => {
    userScrolled.value = false
    _doScroll(smooth)
  }

  const isScrolledToBottom = (threshold = 50): boolean => {
    if (!containerRef.value) return true
    const { scrollTop, scrollHeight, clientHeight } = containerRef.value
    return scrollHeight - scrollTop - clientHeight < threshold
  }

  return {
    containerRef,
    userScrolled,
    scrollToBottom,
    scrollToBottomForce,
    isScrolledToBottom,
    initScroll,
    cleanupScroll
  }
}
