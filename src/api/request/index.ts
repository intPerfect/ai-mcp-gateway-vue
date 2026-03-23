/**
 * Axios 请求封装
 */
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { Message } from '@arco-design/web-vue'
import { API_BASE_URL, REQUEST_TIMEOUT, API_CODE } from '@/constants'
import type { ApiResponse } from '@/types'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 可以在这里添加 token 等
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response

    // 检查业务响应码
    if (data.code === API_CODE.SUCCESS) {
      return response
    }

    // 业务错误
    Message.error(data.info || '请求失败')
    return Promise.reject(new Error(data.info || '请求失败'))
  },
  error => {
    // HTTP 错误处理
    let message = '网络错误，请稍后重试'

    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '登录已过期，请重新登录'
          // 可以在这里处理登出逻辑
          break
        case 403:
          message = '没有权限访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器错误'
          break
        default:
          message = error.response.data?.message || error.message
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时'
    }

    Message.error(message)
    return Promise.reject(error)
  }
)

/**
 * 通用请求方法
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await service.request<ApiResponse<T>>(config)
  return response.data.data
}

/**
 * GET 请求
 */
export async function get<T>(url: string, params?: object): Promise<T> {
  return request<T>({ method: 'GET', url, params })
}

/**
 * POST 请求
 */
export async function post<T>(url: string, data?: object): Promise<T> {
  return request<T>({ method: 'POST', url, data })
}

/**
 * PUT 请求
 */
export async function put<T>(url: string, data?: object): Promise<T> {
  return request<T>({ method: 'PUT', url, data })
}

/**
 * DELETE 请求
 */
export async function del<T>(url: string, params?: object): Promise<T> {
  return request<T>({ method: 'DELETE', url, params })
}

export default service
