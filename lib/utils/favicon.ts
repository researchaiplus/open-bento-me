/**
 * 获取网站的 favicon URL
 * @param url 网站 URL
 * @returns favicon URL 或 null
 */
export async function getFaviconUrl(url: string): Promise<string | null> {
    try {
      const domain = new URL(url).hostname;
      
      // 设置 fetch 超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 秒超时
      
      // 尝试多个来源获取 favicon，按可靠性排序
      const faviconSources = [
        `https://${domain}/favicon.ico`,
        `https://${domain}/favicon.png`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`
      ];
  
      // 尝试获取第一个可用的 favicon
      for (const source of faviconSources) {
        try {
          const response = await fetch(source, {
            method: 'HEAD', // 只检查资源是否存在，不下载内容
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId); // 清除超时
          
          if (response.ok) {
            return source;
          }
        } catch (error: any) {
          if (error?.name === 'AbortError') {
            console.warn(`获取 favicon 超时 (${source})`);
          } else {
            console.warn(`获取 favicon 失败 (${source}):`, error);
          }
          continue;
        }
      }
  
      // 如果所有尝试都失败，使用 Google 的 favicon 服务作为默认选项
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  
    } catch (error) {
      console.error("获取 favicon 时发生错误:", error);
      return null;
    }
  }