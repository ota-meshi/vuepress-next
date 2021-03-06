import { onMounted, ref, useSSRContext, watch } from 'vue'
import { isPlainObject, isString } from '@vuepress/shared'
import type { HeadConfig, VuepressSSRContext } from '@vuepress/shared'
import { usePageHead } from './pageHead'
import { usePageLang } from './pageLang'

/**
 * Create head tag from head config
 */
export const createHeadTag = ([
  tagName,
  attrs,
  content,
]: HeadConfig): HTMLElement | null => {
  if (!isString(tagName)) {
    return null
  }

  // create element
  const tag = document.createElement(tagName)

  // set attributes
  if (isPlainObject(attrs)) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (isString(value)) {
        tag.setAttribute(key, value)
      } else if (value === true) {
        tag.setAttribute(key, '')
      }
    })
  }

  // set content
  if (isString(content)) {
    tag.appendChild(document.createTextNode(content))
  }

  return tag
}

/**
 * Auto update head
 *
 * This composable function should be used only once in the root app
 */
export const useUpdateHead = (): void => {
  const head = usePageHead()
  const lang = usePageLang()

  // ssr-only, extract page meta info to ssrContext
  if (__SSR__) {
    const ssrContext: VuepressSSRContext | undefined = useSSRContext()
    if (ssrContext) {
      ssrContext.head = head.value
      ssrContext.lang = lang.value
    }
    return
  }

  // current tag elements that generated by this function
  const currentTags = ref<HTMLElement[]>([])

  const updateHead = (): void => {
    if (!document) {
      return
    }

    document.documentElement.lang = lang.value

    currentTags.value.forEach((el) => {
      if (el.parentNode === document.head) {
        document.head.removeChild(el)
      }
    })
    currentTags.value.splice(0, currentTags.value.length)

    head.value.forEach((item) => {
      const tag = createHeadTag(item)
      if (tag !== null) {
        document.head.appendChild(tag)
        currentTags.value.push(tag)
      }
    })
  }

  onMounted(() => updateHead())
  watch(head, () => updateHead())
}
