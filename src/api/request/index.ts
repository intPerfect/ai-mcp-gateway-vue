/**
 * Axios 请求封装 - 统一异常处理
 */
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  AxiosError
} from 'axios'
import { Message } from '@arco-design/web-vue'
import { API_BASE_URL, REQUEST_TIMEOUT, API_CODE } from '@/constants'
import type { ApiResponse } from '@/types'
import { getStorage, removeStorage } from '@/utils'

// ============ 错误类型枚举 ============
export enum ErrorType {
  /** 未授权/Token过期 */
  UNAUTHORIZED = 'UNAUTHORIZED',
  /** 无权限 */
  FORBIDDEN = 'FORBIDDEN',
  /** 资源不存在 */
  NOT_FOUND = 'NOT_FOUND',
  /** 服务器错误 */
  SERVER_ERROR = 'SERVER_ERROR',
  /** 请求超时 */
  TIMEOUT = 'TIMEOUT',
  /** 网络错误 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** 业务错误 */
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  /** 未知错误 */
  UNKNOWN = 'UNKNOWN'
}

// ============ 自定义错误类 ============
export class RequestError extends Error {
  type: ErrorType
  code?: string
  status?: number
  data?: any

  constructor(type: ErrorType, message: string, code?: string, status?: number, data?: any) {
    super(message)
    this.type = type
    this.code = code
    this.status = status
    this.data = data
    this.name = 'RequestError'
  }
}

// ============ 请求配置选项 ============
export interface RequestOptions extends AxiosRequestConfig {
  /** 是否显示错误提示（默认 true） */
  showError?: boolean
  /** 是否在401时跳转登录页（默认 true） */
  redirectOn401?: boolean
  /** 自定义错误提示信息 */
  errorMessage?: string
  /** 是否静默模式（不显示任何提示） */
  silent?: boolean
}

// ============ 401 处理标志 ============
let isRedirecting = false

// 重置跳转标志（登录成功后调用）
export function resetRedirectFlag() {
  isRedirecting = false
}

// ============ 创建 axios 实例 ============
const service: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ============ 请求拦截器 ============
service.interceptors.request.use(
  config => {
    const token = getStorage<string>('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('Request config error:', error)
    return Promise.reject(new RequestError(ErrorType.UNKNOWN, '请求配置错误'))
  }
)

// ============ 响应拦截器 ============
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response
    const options = response.config as RequestOptions

    // 检查业务响应码
    if (data.code === API_CODE.SUCCESS) {
      return response
    }

    // 业务错误
    const error = new RequestError(
      ErrorType.BUSINESS_ERROR,
      data.info || '请求失败',
      data.code,
      response.status,
      data
    )

    // 显示错误提示（除非静默模式）
    if (!options.silent && options.showError !== false) {
      Message.error({
        content: options.errorMessage || data.info || '请求失败',
        duration: 5000,
        id: 'request-error'
      })
    }

    return Promise.reject(error)
  },
  (error: AxiosError<ApiResponse>) => {
    const config = error.config as RequestOptions
    let requestError: RequestError

    // HTTP 错误处理
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 401:
          requestError = new RequestError(
            ErrorType.UNAUTHORIZED,
            '登录已过期，请重新登录',
            data?.code,
            status,
            data
          )
          // 处理401：清除token并跳转登录页（登录接口不跳转）
          if (
            config?.redirectOn401 !== false &&
            !isRedirecting &&
            !config?.url?.includes('/auth/login')
          ) {
            isRedirecting = true
            removeStorage('token')
            // 强制刷新页面跳转到登录页，确保所有状态重置
            window.location.replace('/login')
          }
          break

        case 403: {
          const detail = data?.detail || data?.info || ''
          const msg = detail ? `权限不足：${detail}` : '没有权限访问'
          requestError = new RequestError(
            ErrorType.FORBIDDEN,
            msg,
            data?.code,
            status,
            data
          )
          break
        }

        case 404:
          requestError = new RequestError(
            ErrorType.NOT_FOUND,
            '请求的资源不存在',
            data?.code,
            status,
            data
          )
          break

        case 400:
          requestError = new RequestError(
            ErrorType.BUSINESS_ERROR,
            data?.info || '请求参数错误',
            data?.code,
            status,
            data
          )
          break

        case 500:
        case 502:
        case 503:
        case 504:
          requestError = new RequestError(
            ErrorType.SERVER_ERROR,
            data?.info || '服务器错误，请稍后重试',
            data?.code,
            status,
            data
          )
          break

        default:
          requestError = new RequestError(
            ErrorType.UNKNOWN,
            data?.info || error.message || '未知错误',
            data?.code,
            status,
            data
          )
      }
    } else if (error.code === 'ECONNABORTED') {
      requestError = new RequestError(ErrorType.TIMEOUT, '请求超时，请稍后重试')
    } else if (!window.navigator.onLine) {
      requestError = new RequestError(ErrorType.NETWORK_ERROR, '网络连接已断开')
    } else {
      requestError = new RequestError(ErrorType.NETWORK_ERROR, '网络错误，请检查网络连接')
    }

    // 显示错误提示（除非静默模式）
    if (!config?.silent && config?.showError !== false) {
      Message.error({
        content: config?.errorMessage || requestError.message,
        duration: 5000,
        id: 'request-error'
      })
    }

    return Promise.reject(requestError)
  }
)

// ============ 通用请求方法 ============

/**
 * 通用请求方法
 * @param config 请求配置
 * @returns 返回业务数据 data 字段
 */
export async function request<T>(config: RequestOptions): Promise<T> {
  const response = await service.request<ApiResponse<T>>(config)
  return response.data.data
}

/**
 * GET 请求
 * @param url 请求地址
 * @param params 查询参数
 * @param options 请求选项
 */
export async function get<T>(url: string, params?: object, options?: RequestOptions): Promise<T> {
  return request<T>({ ...options, method: 'GET', url, params })
}

/**
 * POST 请求
 * @param url 请求地址
 * @param data 请求体数据
 * @param options 请求选项
 */
export async function post<T>(url: string, data?: object, options?: RequestOptions): Promise<T> {
  return request<T>({ ...options, method: 'POST', url, data })
}

/**
 * PUT 请求
 * @param url 请求地址
 * @param data 请求体数据
 * @param options 请求选项
 */
export async function put<T>(url: string, data?: object, options?: RequestOptions): Promise<T> {
  return request<T>({ ...options, method: 'PUT', url, data })
}

/**
 * DELETE 请求
 * @param url 请求地址
 * @param params 查询参数
 * @param options 请求选项
 */
export async function del<T>(url: string, params?: object, options?: RequestOptions): Promise<T> {
  return request<T>({ ...options, method: 'DELETE', url, params })
}

/**
 * 上传文件
 * @param url 请求地址
 * @param file 文件对象
 * @param options 请求选项
 */
export async function upload<T>(
  url: string,
  file: File,
  fieldName = 'file',
  options?: RequestOptions
): Promise<T> {
  const formData = new FormData()
  formData.append(fieldName, file)

  return request<T>({
    ...options,
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// ============ 判断错误类型的辅助函数 ============

export function isUnauthorized(error: unknown): boolean {
  return error instanceof RequestError && error.type === ErrorType.UNAUTHORIZED
}

export function isForbidden(error: unknown): boolean {
  return error instanceof RequestError && error.type === ErrorType.FORBIDDEN
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof RequestError && error.type === ErrorType.NOT_FOUND
}

export function isServerError(error: unknown): boolean {
  return error instanceof RequestError && error.type === ErrorType.SERVER_ERROR
}

export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof RequestError &&
    (error.type === ErrorType.NETWORK_ERROR || error.type === ErrorType.TIMEOUT)
  )
}

export function isBusinessError(error: unknown): boolean {
  return error instanceof RequestError && error.type === ErrorType.BUSINESS_ERROR
}

export function isRequestError(error: unknown): error is RequestError {
  return error instanceof RequestError
}

// ============ 导出 ============
export { service }
export default service
