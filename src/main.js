import {createApp} from 'vue';
import App from './App.vue'

import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

const app = createApp(App);

const appContainer = () => {
	const app = document.createElement('div');
	document.body.append(app);
	return app;
};
app.use(ElementPlus);
app.mount(appContainer());
