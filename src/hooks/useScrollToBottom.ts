/**
 * 自动滚动到底部 Hook
 */
import { ref, nextTick } from 'vue'

export function useScrollToBottom() {
  const containerRef = ref<HTMLElement | null>(null)

  const scrollToBottom = (smooth = false) => {
    nextTick(() => {
      if (containerRef.value) {
        if (smooth) {
          containerRef.value.scrollTo({
            top: containerRef.value.scrollHeight,
            behavior: 'smooth'
          })
        } else {
          containerRef.value.scrollTop = containerRef.value.scrollHeight
        }
      }
    })
  }

  const isScrolledToBottom = (threshold = 50): boolean => {
    if (!containerRef.value) return true
    const { scrollTop, scrollHeight, clientHeight } = containerRef.value
    return scrollHeight - scrollTop - clientHeight < threshold
  }

  return {
    containerRef,
    scrollToBottom,
    isScrolledToBottom
  }
}
