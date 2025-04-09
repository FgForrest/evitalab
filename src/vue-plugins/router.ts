import { createRouter, createWebHashHistory, createWebHistory, Router, RouteRecordRaw, RouterHistory } from 'vue-router'
import { LabRunMode } from '@/LabRunMode'

const runMode: LabRunMode = resolveLabRunMode()

const routes: Readonly<RouteRecordRaw[]> = [
    {
        path: runMode === LabRunMode.Driver
            ? '/'
            : '/lab',
        component: () => import('@/modules/workspace/view/Layout.vue'),
        children: [
            {
                path: '',
                name: 'evitaLab',
                // route level code-splitting
                // this generates a separate chunk (about.[hash].js) for this route
                // which is lazy-loaded when the route is visited.
                component: () => import(
                    /* webpackChunkName: "home" */
                    runMode === LabRunMode.Driver
                        ? '@/modules/workspace/view/DriverMainView.vue'
                        : '@/modules/workspace/view/StandaloneMainView.vue'
                ),
            }
        ]
    }
]

const history: RouterHistory = runMode === LabRunMode.Driver
    ? createWebHashHistory(process.env.BASE_URL)
    : createWebHistory(process.env.BASE_URL)

const router: Router = createRouter({ history, routes })

/**
 * Instance of router from passed routes and default config
 */
export default router

function resolveLabRunMode(): LabRunMode {
    // same as in EvitaLabConfig but this is resolved before loading EvitaLabConfig
    const rawRunMode: string | undefined = import.meta.env.VITE_RUN_MODE
    if (rawRunMode == undefined || rawRunMode.trim() === '' || rawRunMode === LabRunMode.Standalone) {
        return LabRunMode.Standalone
    } else if (rawRunMode === LabRunMode.Driver) {
        return LabRunMode.Driver
    } else {
        throw new Error(`Unsupported run mode ${rawRunMode}`)
    }
}
