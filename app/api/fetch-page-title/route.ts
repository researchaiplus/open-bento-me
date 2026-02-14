/**
 * API路由 - 获取网页标题
 *
 * GET /api/fetch-page-title?url={encoded_url}
 * - 从指定URL获取网页标题
 * - 使用cheerio解析HTML
 * - 优先获取<title>标签，回退到og:title meta标签
 * - 8秒超时防止长时间等待
 *
 * 请求参数:
 * - url: string (必需) - 要获取标题的网页URL
 *
 * 返回格式:
 * - 成功: { title: string }
 * - 失败: { error: string }
 *
 * 错误处理:
 * - 400: 缺少URL参数
 * - 500: 请求超时或解析失败
 *
 * 使用场景:
 * - 用户添加项目链接时自动获取标题
 * - 预览外部链接
 * - 改善用户体验，避免手动输入
 */

import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

/**
 * GET /api/fetch-page-title
 * 从指定URL获取网页标题
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000), // 8秒超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    const html = await response.text()
    const $ = cheerio.load(html)
    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || ''

    return NextResponse.json({ title })
  } catch (error) {
    console.error('Error fetching page title:', error)
    return NextResponse.json({ error: 'Failed to fetch page title' }, { status: 500 })
  }
}
