import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/lab',
        component: () => import('@/modules/workspace/view/Layout.vue'),
        children: [
            {
                path: '',
                name: 'evitaLab',
                // route level code-splitting
                // this generates a separate chunk (about.[hash].js) for this route
                // which is lazy-loaded when the route is visited.
                component: () => import(/* webpackChunkName: "home" */ '@/modules/workspace/view/MainView.vue'),
            },
        ],
    },
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
})

/**
 * Instance of router from passed routes and default config
 */
export default router
