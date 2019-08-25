import Vue from 'vue'
import App from './App.vue'
import ProgressBar from 'vuejs-progress-bar'

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')

Vue.use(ProgressBar);