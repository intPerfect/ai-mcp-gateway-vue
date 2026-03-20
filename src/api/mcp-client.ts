/**
 * MCP Gateway API Client
 */

export interface JSONRPCRequest {
  jsonrpc: string
  method: string
  id: string | number
  params?: Record<string, any>
}

export interface JSONRPCResponse {
  jsonrpc: string
  id: string | number | null
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

export interface Tool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties?: Record<string, any>
    required?: string[]
  }
}

export interface SSEMessage {
  event: string
  data: string
}

/**
 * MCP SSE Client for connecting to MCP Gateway
 */
export class McpSseClient {
  private eventSource: EventSource | null = null
  private messageEndpoint: string = ''
  private gatewayId: string
  private apiKey: string
  private requestId: number = 0
  private onMessage: (msg: JSONRPCResponse) => void
  private onStatus: (status: string) => void
  private onError: (error: string) => void

  constructor(
    gatewayId: string,
    apiKey: string,
    callbacks: {
      onMessage: (msg: JSONRPCResponse) => void
      onStatus: (status: string) => void
      onError: (error: string) => void
    }
  ) {
    this.gatewayId = gatewayId
    this.apiKey = apiKey
    this.onMessage = callbacks.onMessage
    this.onStatus = callbacks.onStatus
    this.onError = callbacks.onError
  }

  /**
   * Connect to MCP Gateway via SSE
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `/api-gateway/${this.gatewayId}/mcp/sse?api_key=${this.apiKey}`
      
      this.onStatus('Connecting...')
      this.eventSource = new EventSource(url)

      this.eventSource.addEventListener('endpoint', (event: MessageEvent) => {
        this.messageEndpoint = event.data
        this.onStatus('Connected')
        resolve()
      })

      this.eventSource.addEventListener('message', (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data) as JSONRPCResponse
          this.onMessage(response)
        } catch (e) {
          console.error('Failed to parse message:', e)
        }
      })

      this.eventSource.addEventListener('error', (event: MessageEvent) => {
        try {
          const error = JSON.parse(event.data)
          this.onError(error.info || 'Connection error')
        } catch {
          this.onError('Connection error')
        }
        reject(new Error('SSE connection error'))
      })

      this.eventSource.addEventListener('ping', () => {
        // Heartbeat, ignore
      })

      this.eventSource.onerror = () => {
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.onStatus('Disconnected')
          this.onError('Connection closed')
        }
      }
    })
  }

  /**
   * Disconnect from MCP Gateway
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.onStatus('Disconnected')
    }
  }

  /**
   * Send JSON-RPC request
   */
  async sendRequest(method: string, params?: Record<string, any>): Promise<void> {
    if (!this.messageEndpoint) {
      throw new Error('Not connected')
    }

    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      method,
      id: `${Date.now()}-${++this.requestId}`,
      params
    }

    const response = await fetch(this.messageEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }
  }

  /**
   * Initialize MCP session
   */
  async initialize(): Promise<void> {
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'Vue MCP Client',
        version: '1.0.0'
      }
    })
  }

  /**
   * List available tools
   */
  async listTools(): Promise<void> {
    await this.sendRequest('tools/list', {})
  }

  /**
   * Call a tool
   */
  async callTool(name: string, args: Record<string, any>): Promise<void> {
    await this.sendRequest('tools/call', {
      name,
      arguments: args
    })
  }

  /**
   * Send ping
   */
  async ping(): Promise<void> {
    await this.sendRequest('ping')
  }

  get isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN
  }
}
