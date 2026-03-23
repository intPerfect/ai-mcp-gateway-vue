import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/Layout.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    children: [
      { path: 'home', name: 'Home', component: () => import('../views/Home.vue') },
      { path: 'apikey', name: 'ApiKey', component: () => import('../views/ApiKey.vue') },
      {
        path: 'microservice',
        name: 'Microservice',
        component: () => import('../views/Microservice.vue')
      },
      { path: 'tools', name: 'Tools', component: () => import('../views/Tools.vue') },
      { path: 'chat', name: 'Chat', component: () => import('../views/Chat.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
