<template>
    <el-dialog :visible="dialogToggle" :width="defaultOptions.dialogWidth" :title="defaultOptions.title" @close="dialogClose">
        <!-- 导出提示信息 -->
        <el-row>
            <el-col :span="24" style="color:#666;font-size:18px;margin:15px 0;padding-left:20px">
                <p v-if="defaultOptions.status == 'success'" class="tipicons"><el-button type="success" icon="el-icon-check" circle class="tipicon"></el-button>导出完成!</p>
                <p v-if="defaultOptions.status == 'error'" class="tipicons"><el-button type="danger" icon="el-icon-close" circle class="tipicon"></el-button>导出异常!</p>
                <p v-html="defaultOptions.message"></p>
                <p v-if="defaultOptions.url && !defaultOptions.successAutoClose">
                    <span>{{ defaultOptions.url }}</span>
                    <el-button icon="el-icon-download" size="mini" @click="downLoadFile(defaultOptions.url)" type="success" round>下载</el-button>
                </p>
            </el-col>
        </el-row>
        <!-- 导出历史记录 -->
        <el-row v-if="defaultOptions.isHistory && historyData.length > 0" style="margin-top:30px;">
            <el-divider content-position="left">
                <span>
                    <span @click="defaultOptions.showHistory = !defaultOptions.showHistory" :title="tipTimes">导出记录<i v-if="defaultOptions.showHistory" class="el-icon-caret-bottom"></i><i v-else class="el-icon-caret-top"></i>（{{ historyData.length }}）</span>
                    <el-button type="text" @click="clearHistory()"> 清空</el-button>
                </span>
            </el-divider>
            <el-table :data="historyData" v-show="defaultOptions.showHistory" :max-height="defaultOptions.maxHeightTable" style="width: 100%">
                <el-table-column label="文件名">
                    <template slot-scope="scope">
                        <el-tooltip class="item" effect="dark" :content="scope.row.url" placement="top">
                            <span>{{ scope.row.filename }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column label="提示" width="160" show-overflow-tooltip>
                    <template slot-scope="scope">
                        <span @click="logRes(scope.row)">{{ scope.row.message }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="时间" width="160">
                    <template slot-scope="scope">
                        <span @click="logRes(scope.row)">{{ scope.row.datetime }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="90">
                    <template slot-scope="scope">
                        <el-button size="mini" type="text" @click="deleteRecord(scope)">删除</el-button>
                        <el-button size="mini" type="text" @click="downLoadFile(scope.row.url)" v-if="scope.row.url">下载</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-row>
        <!-- 操作按钮 -->
        <div slot="footer" class="dialog-footer">
            <el-button @click="dialogClose">取 消</el-button>
            <el-button type="primary" @click="startExport" :loading="loadingExport">{{ defaultOptions.btnStartExport }}</el-button>
        </div>
    </el-dialog>
</template>

<script>
export default {
    name: 'ExportDialog',
    props: {
        options: {
            type: Object,
            required: true
        }
    },
    computed: {
        tipTimes: function() {
            if (this.defaultOptions.forever) return '';
            return '记录缓存' + this.defaultOptions.hour + '小时';
        }
    },
    data() {
        return {
            defaultOptions: {
                title: '导出提示',
                message: '是否导出当前条件下的数据！',
                btnStartExport: '开始导出',
                downLoadType: 'href', // 下载方式： open :新窗口打开 (会闪烁) , href:当前页面 ,iframe :iframe 标签打开
                exportCode: null, // 用于缓存标识
                isHistory: true, // 是否需要启用历史记录功能
                showHistory: false, // 显示历史记录
                dialogWidth: '800px', // 对话弹出框高度
                maxHeightTable: 280, // 历史记录表格高度
                successAutoClose: true, // 导出下载成功 自动关闭
                autoDownLoadTimes: 2000,
                forever: false, // 永久存储
                hour: 3 * 24, // 缓存几小时 3天
                url: '', // 导出完成后的链接地址
                status: 'before' // 'sucess' 'error'
            },
            historyData: [],
            dialogToggle: false,
            loadingExport: false
        };
    },
    mounted() {
        this.defaultOptions = { ...this.defaultOptions, ...this.options };
        if (!this.defaultOptions.exportCode) {
            this.defaultOptions.exportCode = 'temp_' + new Date().getTime();
            console.warn('请传入系统唯一的 exportCode ，便于本地缓存记录！ ', this.defaultOptions.exportCode);
        }

        let exportHistoryData = JSON.parse(window.localStorage.getItem(`exportHistoryData`)) || {};
        this.historyData = exportHistoryData[this.defaultOptions.exportCode] || [];
        this.saveHistory();

        // 支持时间通知方式
        // this.$refs.exportGoods.$emit('exportBefore', resData);
        this.$on('exportBefore', function(option) {
            this.exportBefore(option);
        });
        // this.$refs.exportGoods.$emit('exportBefore', resData);
        this.$on('exportComplete', function(option) {
            this.exportComplete(option);
        });
        // this.$refs.exportGoods.$emit('exportSuccess', resData);
        this.$on('exportSuccess', function(option) {
            this.exportSuccess(option);
        });
        // this.$refs.exportGoods.$emit('exportError', resData);
        this.$on('exportError', function(option) {
            this.exportError(option);
        });
    },
    methods: {
        /**
         * @description: 弹出导出窗口 预备导出
         * @param {*} message 提示消息
         * @param {*} title 提示消息
         * this.$refs.exportGoods.exportBefore();
         */
        exportBefore({ message = this.defaultOptions.message, title = this.defaultOptions.title, url = this.defaultOptions.url }) {
            this.defaultOptions = { ...this.defaultOptions, message, title, url };
            this.defaultOptions.status = 'before';
            this.dialogToggle = true;
            this.loadingExport = false;
        },
        /**
         * @description: 导出文件完成
         * @param {*} url 导出完成后的链接地址  不需要下载链接 url:''
         * @param {*} logRes 把返回结果作为日志信息
         * @param {*} message 提示消息
         * @param {*} title 提示消息
         * @param {*} status before success  error
            this.$refs.exportGoods.exportComplete({
                status: 'success',
                url: resData.data.content.content,
                logRes: resData,
                message: resData.data.msg
            });
         */
        exportComplete({ url = this.defaultOptions.url, logRes = this.defaultOptions.logRes, message = this.defaultOptions.message, title = this.defaultOptions.title, status = this.defaultOptions.status }) {
            this.defaultOptions = { ...this.defaultOptions, url, logRes, message, title, status };
            this.dialogToggle = true;
            this.loadingExport = false;
            try {
                let url = this.defaultOptions.url || '';
                let filename = url.substr(url.lastIndexOf('/') + 1);
                this.historyData.unshift({
                    times: new Date().getTime(),
                    datetime: this.nowDate(),
                    url,
                    filename,
                    message: this.defaultOptions.message || '',
                    logRes: this.defaultOptions.logRes || ''
                });
            } catch (error) {
                console.error('缓存导出记录失败', error);
            }
            this.saveHistory();

            if (this.defaultOptions.status == 'success') {
                if (this.defaultOptions.successAutoClose) {
                    this.$message({ showClose: true, message: '导出完成，下载中！', type: 'success' });
                    setTimeout(() => {
                        this.dialogToggle = false;
                        this.downLoadFile(this.defaultOptions.url);
                    }, this.defaultOptions.autoDownLoadTimes);
                } else {
                    setTimeout(() => {
                        this.downLoadFile(this.defaultOptions.url);
                    }, this.defaultOptions.autoDownLoadTimes);
                }
            } else if (this.defaultOptions.status == 'error') {
                this.$message({ showClose: true, message: this.defaultOptions.message || '导出异常！', type: 'error' });
            }
        },
        exportSuccess(option) {
            this.exportComplete({ ...option, status: 'success' });
        },
        exportError(option) {
            this.exportComplete({ ...option, status: 'error' });
        },
        // 获取当前时间
        nowDate() {
            function getzf(num) {
                if (parseInt(num) < 10) {
                    num = '0' + num;
                }
                return num;
            }
            var oDate = new Date(),
                oYear = oDate.getFullYear(),
                oMonth = oDate.getMonth() + 1,
                oDay = oDate.getDate(),
                oHour = oDate.getHours(),
                oMin = oDate.getMinutes(),
                oSen = oDate.getSeconds(),
                oTime = oYear + '-' + getzf(oMonth) + '-' + getzf(oDay) + ' ' + getzf(oHour) + ':' + getzf(oMin) + ':' + getzf(oSen); //最后拼接时间
            return oTime;
        },
        // 控制台 打印导出日志
        logRes(row) {
            console.info(`查看导出日志 ${row.datetime} ：`, JSON.parse(JSON.stringify(row)));
        },
        // 开始导出
        startExport() {
            this.loadingExport = true;
            this.$emit('startExport');
        },
        deleteRecord(scope) {
            this.historyData.splice(scope.$index, 1);
            this.saveHistory();
        },
        // 清空缓存数据
        clearHistory() {
            this.historyData = [];
            this.saveHistory();
        },
        // 缓存数据
        saveHistory() {
            if (!this.defaultOptions.isHistory) return;
            let exportHistoryData = JSON.parse(window.localStorage.getItem(`exportHistoryData`)) || {};
            exportHistoryData[this.defaultOptions.exportCode] = this.historyData || [];
            window.localStorage.setItem(`exportHistoryData`, JSON.stringify(exportHistoryData || {}));
            this.updateHistoryData();
        },
        // 更新缓存数据 过期时间
        updateHistoryData() {
            if (!this.defaultOptions.isHistory) return;
            let exportHistoryData = JSON.parse(window.localStorage.getItem(`exportHistoryData`)) || {};
            for (const key in exportHistoryData) {
                exportHistoryData[key] = exportHistoryData[key].filter(item => {
                    if (this.defaultOptions.forever) return true; // 永久存储
                    let passTimes = item.times + (this.defaultOptions.hour || 1) * 60 * 60 * 1000;
                    return passTimes > new Date().getTime();
                });
                if (exportHistoryData[key].length == 0) {
                    delete exportHistoryData[key];
                }
            }
            window.localStorage.setItem(`exportHistoryData`, JSON.stringify(exportHistoryData || {}));
        },
        // 下载文件
        downLoadFile(url = '') {
            // console.log('下载文件地址： ', url);
            if (url.indexOf('/') > -1) {
                if (this.defaultOptions.downLoadType == 'href') {
                    location.href = url; // 本地打开链接
                } else if (this.defaultOptions.downLoadType == 'iframe') {
                    this.iframeDownLoad(url);
                } else {
                    window.open(url, '_blank'); // 新窗口打开外链接
                }
            } else {
                this.$message({ showClose: true, message: '导出错误 ' + url, type: 'error' });
            }
        },
        iframeDownLoad(url) {
            try {
                var elemIF = document.createElement('iframe');
                elemIF.src = url;
                elemIF.style.display = 'none';
                document.body.appendChild(elemIF);
            } catch (err) {
                console.error('下载异常！', err);
                window.open(url, '_blank'); // 新窗口打开外链接
                // alert('下载异常！');
            }
        },
        // 关闭对话框
        dialogClose() {
            this.dialogToggle = false;
        }
    }
};
</script>
<style>
.tipicons {
    margin: 10px 0;
    overflow: hidden;
}
.tipicon {
    margin-right: 20px;
}
</style>
