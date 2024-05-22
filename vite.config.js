import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, {cdn, util} from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		monkey({
			entry: 'src/main.js',
			userscript: {
				name: '阿里云盘批量重命名',
				version: '0.5.5',
				noframes: true,
				icon: 'https://img.alicdn.com/imgextra/i2/O1CN011vHpiQ251TseXpbH7_!!6000000007466-2-tps-120-120.png',
				author: 'https://github.com/panghujiajia',
				namespace: 'https://github.com/panghujiajia',
				match: ['https://www.aliyundrive.com/*', '*://*.alipan.com/*'],
				description:
					'对某个剧集里面的内容进行批量重命名，同时支持对搜索结果进行批量重命名，支持序号重命名、追加重命名、查找替换、正则替换四种模式',
				license: 'GPL'
			},
			build: {
				externalGlobals: {
					vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js').concat(
						await util.fn2dataUrl(() => {
							// @ts-ignore
							window.Vue = Vue;
						})
					),
					'element-plus': cdn.jsdelivr(
						'ElementPlus',
						'dist/index.full.min.js'
					)
				},
				externalResource: {
					'vuedraggable/dist/vuedraggable.umd.min.js': cdn.jsdelivr(),
					'element-plus/dist/index.css': cdn.jsdelivr()
				}
			}
		})
	]
});
