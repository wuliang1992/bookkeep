import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
Vue.use(ElementUI)
import http from "@/utils/api";


Vue.prototype.getAjax = http.get
Vue.prototype.postAjax = http.post
Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
