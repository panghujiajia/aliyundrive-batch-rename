import {createApp} from 'vue';
import App from './App.vue'
import './style.css'
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

const app = createApp(App);

/**
 * 动态在 body 中创建一个 div 作为 Vue 应用的挂载点
 * 适用于需要完全由 JS 控制挂载的场景（如用户脚本、插件等）
 */
const appContainer = () => {
	const container = document.createElement('div');
	document.body.append(container);
	return container;
};

app.use(ElementPlus);
app.mount(appContainer());
