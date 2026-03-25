/**
 * 应用配置常量
 */

// 应用名称
export const APP_NAME = 'AI MCP Gateway'

// 应用版本
export const APP_VERSION = '1.0.0'

// 默认后端地址
export const DEFAULT_API_BASE_URL = `http://${window.location.hostname}:8777`

// 默认网关 Key
export const DEFAULT_GATEWAY_KEY = 'sk-defaultkey001:Xy7zA1b2C3d4E5f6G7h8I9j0KlMnOpQrStUvWxYz'

// 默认 LLM Key (MiniMax JWT)
export const DEFAULT_LLM_KEY =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiLnmb7ono3kupHliJsiLCJVc2VyTmFtZSI6IueZvuiejeS6keWImyIsIkFjY291bnQiOiIiLCJTdWJqZWN0SUQiOiIxOTk4NjY2Nzg0MTg5NzE0Njk5IiwiUGhvbmUiOiIxOTUxMTk4MTY4OSIsIkdyb3VwSUQiOiIxOTk4NjY2Nzg0MTgxMzI2MDkxIiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiIiwiQ3JlYXRlVGltZSI6IjIwMjUtMTItMTAgMjE6MzI6MTYiLCJUb2tlblR5cGUiOjQsImlzcyI6Im1pbmltYXgifQ.u5vB41nODwjoj-a728IeKgtdnoL7AC0rJbw3Uv8iXA6CVqXQ3SY5RCTo87yAzAeva8prR4YcBQ-nIG5mtXYd_jemI-mjA909hYN3yvWsjuD4m_3U2SqoDY5E6vV6gyGPzQlnB0OkzOKJCwQbb6FUfcymWTSiAtw2k8DgfCeQLJLUMKmxOjHYOontut_gujCxY57wU-8h0p4PWkS74hLnritLO3oIBq6ZNmf1d3uC4pw-jVCflSlymm16luObc-DeohNc83fAOtMPSJ76mi_bdAcoIgCOyAP3VUan53QyLHwzcq-i8YI-TuxkAvH3slauNsHAfUWNhlqJouRXdFwsHg'

// Storage Keys
export const STORAGE_KEYS = {
  CONFIG: 'config',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
} as const
