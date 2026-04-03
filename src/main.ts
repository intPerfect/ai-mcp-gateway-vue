import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ArcoVue from '@arco-design/web-vue'
import App from './App.vue'
import router from './router'
import { setupPermissionDirectives } from './utils/permission'
import '@arco-design/web-vue/dist/arco.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ArcoVue)
app.use(router)

// 注册权限指令
setupPermissionDirectives(app)

app.mount('#app')
