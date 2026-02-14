import { NextResponse } from 'next/server'

// GitHub 语言颜色映射
const LANGUAGE_COLORS: { [key: string]: string } = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#ffac45',
  Go: '#00ADD8',
  Rust: '#dea584',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  React: '#61dafb',
  'C#': '#178600',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Other: '#ededed'
}

// 定义响应类型
export type GithubRepo = {
  id: string
  name: string
  description: string
  language: string
  languageColor: string
  stars: number
  lastUpdated: string
  topics: string[]
}

/**
 * 获取 GitHub 用户的仓库列表或单个仓库信息
 * 
 * @param request - 包含查询参数的请求对象
 * @returns 用户仓库列表或单个仓库信息
 */
export async function GET(request: Request) {
  try {
    // 从 URL 参数中获取用户名和仓库名
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const repo = searchParams.get('repo')

    if (!username) {
      return NextResponse.json(
        { error: '缺少 username 参数' },
        { status: 400 }
      )
    }

    // 构建 GitHub API 请求 URL
    const apiUrl = repo
      ? `https://api.github.com/repos/${username}/${repo}`
      : `https://api.github.com/users/${username}/repos?per_page=100`
    
    // 调用 GitHub API
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ResearchAI-App'
    }

    const githubToken = process.env.GITHUB_TOKEN
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`
    }

    const response = await fetch(apiUrl, {
      headers,
      // 因为这是服务器端请求，可以设置较长的超时时间
      next: { revalidate: 60 } // 缓存 60 秒
    })

    // 处理错误响应
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: repo ? '未找到该仓库' : '未找到该 GitHub 用户' },
          { status: 404 }
        )
      } else if (response.status === 403) {
        return NextResponse.json(
          { error: 'API 请求频率超限，请稍后再试' },
          { status: 403 }
        )
      } else {
        return NextResponse.json(
          { error: `GitHub API 请求失败: ${response.status}` },
          { status: response.status }
        )
      }
    }

    // 解析响应数据
    const data = await response.json()
    
    if (repo) {
      // 处理单个仓库的响应
      const language = data.language || '未指定'

      const repoData: GithubRepo = {
        id: data.id.toString(),
        name: data.name,
        description: data.description || '',
        language: language,
        languageColor: LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Other,
        stars: data.stargazers_count,
        lastUpdated: data.updated_at,
        topics: data.topics || [] // 直接使用仓库响应中的 topics
      }
      return NextResponse.json(repoData, { status: 200 })
    } else {
      // 处理仓库列表的响应
      if (!Array.isArray(data) || data.length === 0) {
        return NextResponse.json(
          { 
            message: '该用户没有公开的仓库或用户不存在',
            repos: [] 
          },
          { status: 200 }
        )
      }

      // 格式化仓库数据
      const repos: GithubRepo[] = data.map(repo => {
        const language = repo.language || '未指定'
        return {
          id: repo.id.toString(),
          name: repo.name,
          description: repo.description || '',
          language: language,
          languageColor: LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Other,
          stars: repo.stargazers_count,
          lastUpdated: repo.updated_at,
          topics: repo.topics || []
        }
      })

      // 返回格式化后的仓库数据
      return NextResponse.json({ repos }, { status: 200 })
    }
  } catch (error) {
    console.error('获取 GitHub 仓库失败:', error)
    return NextResponse.json(
      { error: '服务器处理请求时出错' },
      { status: 500 }
    )
  }
}
