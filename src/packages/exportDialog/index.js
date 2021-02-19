import exportDialog from './exportDialog'

exportDialog.install = function(Vue) {
  Vue.component(exportDialog.name, exportDialog)
}

export default exportDialog