import Vue from "vue";
import App from "./App.vue";
import "./plugins/element.js";

Vue.config.productionTip = false;

import exportDialog from "./packages/exportDialog";
Vue.use(exportDialog);

// import packages from "./packages";
// Vue.use(packages);

new Vue({
  render: (h) => h(App),
}).$mount("#app");
