<template>
  <div id="app">
    <img src="./assets/logo.png" />
    <div>
      <el-button @click="exportMyGoodsList">导出</el-button>
    </div>

    <export-dialog
      ref="exportGoods"
      :options="exportDialogOption"
      @startExport="handleExportGoodsSure"
    />
  </div>
</template>

<script>
export default {
  name: "app",
  components: {},
  data() {
    return {
      exportDialogOption: {
        exportCode: "osgoodsmy",
        downLoadType: 'open',
        hour: 3 * 24, // 缓存几小时
      },
    };
  },
  methods: {
    exportMyGoodsList() {
      this.$refs.exportGoods.exportBefore({
        url: null,
        message: `确认导出当前条件下的所有我的商品数据吗？`,
      });
    },
    // 确认导出
    handleExportGoodsSure() {
      setTimeout(() => {
        const resData = {
          code: 200,
          data: {
            url: "https://cn.vuejs.org/images/logo.png",
          },
        };
        this.$refs.exportGoods.exportComplete({
          status: "success",
          url: resData.data.url,
          logRes: resData,
          message: "下载成功",
        });
      }, 2000);
    },
  },
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
