// 协作选项类型定义

// 定义选项映射
export const SEEKING_OPTIONS = [
  { key: 'INDUSTRY_INSIGHTS_TRENDS', text: 'Industry insights and trends' },
  { key: 'POTENTIAL_EMPLOYERS', text: 'Potential employers' },
  { key: 'TECHNICAL_COLLABORATORS_EXPERTS', text: 'Potential technical collaborators / experts' },
  { key: 'PAPER_RESEARCH_COLLABORATORS', text: 'Paper / research collaborators' },
  { key: 'POTENTIAL_CO_FOUNDERS', text: 'Potential co-founders' },
  { key: 'EARLY_ADOPTERS_BETA_USERS', text: 'Early adopters / beta users' },
  { key: 'INVESTORS_FUNDING_CONTACTS', text: 'Investors or funding contacts' },
  { key: 'BUSINESS_PARTNERSHIP_RELATIONS', text: 'Business partnership relations' },
  { key: 'OPEN_SOURCE_CONTRIBUTORS', text: 'Open-source contributors' },
  { key: 'API_PLATFORM_PARTNERS', text: 'API / platform partners' },
  { key: 'PURE_TECHNICAL_EXCHANGE_NETWORKING', text: 'Pure technical exchange / networking' },
  { key: 'OTHERS', text: 'Others' },
] as const

export const OFFERING_OPTIONS = [
  { key: 'INDUSTRY_INSIGHTS_TRENDS', text: 'Industry insights and trends' },
  { key: 'JOB_OPPORTUNITIES', text: 'Job opportunities' },
  { key: 'TECHNICAL_EXPERTISE_EXCHANGE_CONSULTING', text: 'Technical expertise exchange / consulting' },
  { key: 'PAPER_RESEARCH_EXCHANGE', text: 'Paper / research exchange' },
  { key: 'ENTREPRENEURIAL_EXPERIENCE_LESSONS', text: 'Entrepreneurial experience and lessons' },
  { key: 'MENTORSHIP_YOUNG_DEVELOPERS', text: 'Mentorship for young developers' },
  { key: 'INVESTMENT_FUNDING_RESOURCES', text: 'Investment or funding resources' },
  { key: 'INDUSTRY_RESOURCE_CONNECTIONS', text: 'Industry resource connections' },
  { key: 'TECHNICAL_INFRASTRUCTURE_RESOURCES', text: 'Technical infrastructure / resources' },
  { key: 'ACCESS_AI_APIS_PLATFORMS', text: 'Access to AI APIs / platforms' },
  { key: 'OTHERS', text: 'Others' },
] as const

export type SeekingOptionKey = typeof SEEKING_OPTIONS[number]['key']
export type OfferingOptionKey = typeof OFFERING_OPTIONS[number]['key']

// 工具函数
export const getSeekingOptionText = (key: SeekingOptionKey): string => {
  return SEEKING_OPTIONS.find(option => option.key === key)?.text || key
}

export const getOfferingOptionText = (key: OfferingOptionKey): string => {
  return OFFERING_OPTIONS.find(option => option.key === key)?.text || key
}

// 验证函数
export const isValidSeekingOption = (key: string): key is SeekingOptionKey => {
  return SEEKING_OPTIONS.some(option => option.key === key)
}

export const isValidOfferingOption = (key: string): key is OfferingOptionKey => {
  return OFFERING_OPTIONS.some(option => option.key === key)
}
