/**
 * API路由 - 获取网页图片
 *
 * GET /api/fetch-page-image?url={encoded_url}
 * - 从指定URL获取网页图片
 * - 使用cheerio解析HTML
 * - 优先获取og:image，回退到twitter:image，最后尝试页面中的大图
 * - 8秒超时防止长时间等待
 *
 * 请求参数:
 * - url: string (必需) - 要获取图片的网页URL
 *
 * 返回格式:
 * - 成功: { image: string | null }
 * - 失败: { error: string }
 *
 * 错误处理:
 * - 400: 缺少URL参数
 * - 500: 请求超时或解析失败
 *
 * 使用场景:
 * - 用户添加项目链接时自动获取预览图
 * - 改善用户体验，自动填充卡片图片
 */

import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    // 原有的图片获取逻辑，添加超时设置
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000), // 8秒超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    const html = await response.text()
    const $ = cheerio.load(html)

    // 尝试获取 Open Graph 图片
    let image = $('meta[property="og:image"]').attr('content')

    // 如果没有 OG 图片，尝试获取 Twitter 卡片图片
    if (!image) {
      image = $('meta[name="twitter:image"]').attr('content')
    }

    // 如果还是没有，尝试获取第一个大图
    if (!image) {
      $('img').each((_, element) => {
        const img = $(element)
        const width = parseInt(img.attr('width') || '0')
        const height = parseInt(img.attr('height') || '0')
        
        // 只选择足够大的图片
        if (width > 300 && height > 200) {
          image = img.attr('src')
          return false // 跳出循环
        }
      })
    }
    
    // 新增逻辑：确保 image URL 是绝对路径
    if (image) {
      try {
        const imageUrl = new URL(image, url); // 使用 new URL() 来处理相对路径和绝对路径
        image = imageUrl.href;
      } catch (error) {
        console.warn('Invalid image URL:', error);
        image = null;
      }
    }

    return NextResponse.json({ image })
  } catch (error) {
    console.error('Error fetching page image:', error)
    return NextResponse.json({ error: 'Failed to fetch page image' }, { status: 500 })
  }
}
