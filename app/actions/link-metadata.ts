'use server'

import * as cheerio from 'cheerio'

/**
 * Server action: 获取网页标题
 * 仅在本地开发模式 (npm run dev) 下可用，静态导出后不可用。
 * @param url - 要获取标题的网页 URL
 * @returns 网页标题，如果获取失败则返回空字符串
 */
export async function fetchPageTitle(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      return ''
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 优先获取 <title>，回退到 og:title
    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || ''

    return title
  } catch (error) {
    console.error('[fetchPageTitle] Error:', error)
    return ''
  }
}

/**
 * Server action: 获取网页图片（Open Graph Image）
 * 仅在本地开发模式 (npm run dev) 下可用，静态导出后不可用。
 * @param url - 要获取图片的网页 URL
 * @returns 图片 URL，如果没有找到则返回 null
 */
export async function fetchPageImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 优先级: og:image > twitter:image > 页面大图
    let image: string | null = null

    // 1. 尝试获取 OG Image
    const ogImage = $('meta[property="og:image"]').attr('content')
    if (ogImage) {
      image = ogImage
    }

    // 2. 尝试获取 Twitter Card 图片
    if (!image) {
      const twitterImage = $('meta[name="twitter:image"]').attr('content')
      if (twitterImage) {
        image = twitterImage
      }
    }

    // 3. 尝试获取页面中第一个大图 (>300x200)
    if (!image) {
      $('img').each((_, element) => {
        const img = $(element)
        const width = parseInt(img.attr('width') || '0')
        const height = parseInt(img.attr('height') || '0')

        if (width > 300 && height > 200) {
          const src = img.attr('src')
          if (src) {
            image = src
            return false // 跳出循环
          }
        }
      })
    }

    // 处理相对路径为绝对路径
    if (image) {
      try {
        const imageUrl = new URL(image, url)
        image = imageUrl.href
      } catch (error) {
        // URL 解析失败，返回原始值
        console.error('[fetchPageImage] URL parse error:', error)
      }
    }

    return image
  } catch (error) {
    console.error('[fetchPageImage] Error:', error)
    return null
  }
}
