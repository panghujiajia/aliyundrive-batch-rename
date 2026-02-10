<template>
	<!-- 弹窗容器: 文字颜色设为 slate-700 (灰蓝色) -->
	<div class="text-slate-700">
		<!-- 选择/排序弹窗 -->
		<el-dialog v-model="dialogVisible1" width="80%" destroy-on-close>
			<!-- 文件列表 -->
			<el-card shadow="never" class="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur">
				<!-- 列表头部 -->
				<template #header>
					<div class="flex items-center justify-between text-sm font-semibold text-slate-800">
						<span>拖动调整排序</span>
						<div class="flex items-center">
							<span class="mr-2.5 text-slate-500">过滤非视频文件</span>
							<el-switch v-model="needFilter" @change="handleFilter">
							</el-switch>
						</div>
					</div>
				</template>
				<!-- 列表内容 -->
				<div id="selectList" class="flex gap-4 leading-9.75 p-0 box-border max-h-[60vh] w-full overflow-y-auto tw-scroll rounded-xl border border-slate-200/60 bg-slate-50/70">
					<!-- 左边索引 -->
					<div class="flex flex-col text-right py-2.5 pl-2 border-r border-slate-200/70 pr-4 bg-white/50">
						<span v-for="(_, index) in data.sortList" :key="index"
							class="w-10 h-9.75 leading-9.75 flex items-center justify-end text-xs font-medium text-slate-500 border-b border-transparent">{{ index + 1 }}</span>
					</div>
					<!-- 可拖拽列表 -->
					<div class="flex-1 pl-1">
						<draggable v-model="data.sortList" :item-key="'file_id'" :animation="0"
							class="min-h-5 w-full py-2.5 pr-2" ghostClass="tw-ghost" group="description" tag="ul"
							@end="onSortEnd">
							<template #item="{ element }">
								<li
									class="m-0 box-border relative tracking-[1px] whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-between text-sm select-none cursor-grab rounded-lg px-3 h-9.75 hover:bg-white/80">
									<p
										class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap border-b border-dashed border-slate-300 text-slate-700">
										{{ element.name }}</p>
									<span @click="handleRemove(element)"
										class="flex items-center justify-center w-9.75 h-9.75 text-[26px] font-light text-slate-400 cursor-pointer hover:text-rose-500">×</span>
								</li>
							</template>
						</draggable>
					</div>
				</div>
			</el-card>

			<template #footer>
				<span class="flex justify-end gap-2">
					<el-button :loading="loading" @click="dialogVisible1 = false">
						取消
					</el-button>
					<el-button :loading="loading" type="primary" @click="dialogVisible2 = true">
						确定
					</el-button>
				</span>
			</template>
		</el-dialog>

		<!-- 重命名弹窗 -->
		<el-dialog v-model="dialogVisible2" class="dialog-fixed-body" destroyOnClose title="确定重命名" width="80%">
			<!-- 重命名栏 -->
			<div class="flex flex-col gap-3 min-h-0">
				<!-- 重命名 -->
				<el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange"
					class="rounded-xl border border-slate-200/70">
					<el-tab-pane :name="1" label="按序号重命名">
						<el-space :size="-1" :fill="true" class="w-full">
							<el-input v-model="prefix" placeholder="前缀" />
							<el-input v-model="indexNumber" :formatter="formatIndexNumber" placeholder="序号" />
							<el-input v-model="suffix" placeholder="后缀" />
						</el-space>
					</el-tab-pane>
					<el-tab-pane :name="2" label="追加重命名">
						<el-space :size="-1" :fill="true" class="w-full">
							<el-input v-model="prefix" placeholder="追加前缀" />
							<el-input v-model="suffix" placeholder="追加后缀" />
						</el-space>
					</el-tab-pane>
					<el-tab-pane :name="3" label="查找替换">
						<el-space :size="-1" :fill="true" class="w-full">
							<el-input v-model="prefix" placeholder="查找内容" />
							<el-input v-model="suffix" placeholder="替换内容" />
						</el-space>
					</el-tab-pane>
					<el-tab-pane :name="4" label="正则替换">
						<el-space :size="-1" :fill="true" class="w-full">
							<el-input v-model="prefix" placeholder="正则表达式">
								<template #prepend>
									<el-text>/</el-text>
								</template>
								<template #append>
									<el-popover trigger="hover">
										<template #reference>
											<el-link underline="never" type="primary">
												/{{ modifiers.join('') }}
											</el-link>
										</template>
										<el-checkbox-group v-model="modifiers">
											<el-checkbox checked value="g" label="g">
												全局搜索 -g
											</el-checkbox>
											<el-checkbox value="i" label="i">
												忽略大小写 -i
											</el-checkbox>
											<el-checkbox value="m" label="m">
												多行模式 -m
											</el-checkbox>
											<el-checkbox value="s" label="s">
												包含换行符 -s
											</el-checkbox>
										</el-checkbox-group>
									</el-popover>
								</template>
							</el-input>
							<el-input v-model="suffix" placeholder="替换内容" />
						</el-space>
					</el-tab-pane>
					<el-tab-pane :name="5" label="文件格式替换">
						<el-space :size="-1" :fill="true" class="w-full">
							<el-input v-model="fileExtension" placeholder="替换成" />
						</el-space>
					</el-tab-pane>
				</el-tabs>
				<!-- 结果预览 -->
				<el-card header="预览" shadow="never"
					class="preview-card rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur flex-1 min-h-0">
					<div id="previewList" class="flex flex-1 min-h-0 gap-4 leading-9.75 p-0 box-border w-full overflow-y-auto tw-scroll rounded-xl border border-slate-200/60 bg-slate-50/70">
						<!-- 索引 -->
						<div class="flex flex-col text-right py-2.5 pl-2 border-r border-slate-200/70 pr-4 bg-white/50">
							<span v-for="(_, index) in data.sortList" :key="index"
								class="w-10 h-9.75 leading-9.75 flex items-center justify-end text-xs font-medium text-slate-500 border-b border-transparent">
								{{ index + 1 }}
							</span>
						</div>
						<!-- 预览列表 -->
						<div class="flex-1 pl-1">
							<ul class="min-h-5 w-full py-2.5 pr-2">
								<li class="m-0 box-border relative tracking-[1px] whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-between text-sm select-none rounded-lg px-3 h-9.75 hover:bg-white/80"
									v-for="(item, index) in data.sortList">
									<p
										class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap border-b border-dashed border-slate-300 text-slate-700">
										{{ item.name }}</p>
									<p
										class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap border-b border-solid border-slate-200 ml-12.5 text-slate-500">
										{{ formatName(item, index) }}</p>
								</li>
							</ul>
						</div>
					</div>
				</el-card>
			</div>
			<template #footer>
				<span class="flex justify-end gap-2">
					<el-button :loading="loading" @click="dialogVisible2 = false">
						取消
					</el-button>
					<el-button :loading="loading" type="primary" @click="confirmRename">
						确定
					</el-button>
				</span>
			</template>
		</el-dialog>

		<!-- 启动按钮 -->
		<el-button @click="handleBatchBtnClick"
			class="fixed z-1000 bottom-30 right-12 rounded-full! border-0! px-8 h-10 text-white  bg-linear-to-r from-[#637dff] to-[#637dff] transition-all duration-300 ease-out active:translate-y-0 active:shadow-[0_8px_20px_rgba(99,125,255,0.35)]" type="primary">
			批量重命名
		</el-button>
	</div>
</template>


<script setup>

import { computed, reactive, ref } from 'vue';
import draggable from 'vuedraggable';
import { ElMessage, ElMessageBox } from 'element-plus';

let obj = {};
let nextMarker = '';
let parent_file_id = '';
let token = '';
let parentFileName = '';

let dialogVisible1 = ref(false);
let dialogVisible2 = ref(false);
let loading = ref(false);
let indexNumber = ref('');
let prefix = ref('');
let suffix = ref('');
let needFilter = ref(false);
let activeTab = ref(1);
let modifiers = ref([]);
let fileExtension = ref('');

const data = reactive({
	list: [], // 原始列表
	sortList: [] // 排序后的列表
});

const padStartNum = computed(() => {
	const len = data.sortList.length;
	if (indexNumber.value) {
		return indexNumber.value.length;
	} else {
		return len.toString().length;
	}
});

function formatIndexNumber(val) {
	indexNumber.value = val.replace(/[^0-9]/gi, '').slice(0, 16);
	return val.replace(/[^0-9]/gi, '').slice(0, 16);
}

function formatName(item, i) {
	let name = '';
	const isFolder = item.type === 'folder' || !item.file_extension;
	let newFileExtension = item.file_extension;
	if (activeTab.value === 1) {
		let index = '';
		if (indexNumber.value) {
			let num = parseInt(indexNumber.value);
			index = num === 0 ? num + i + 1 : num + i;
		} else {
			index = i + 1;
		}
		name = `${prefix.value}${index
			.toString()
			.padStart(padStartNum.value, '0')}${suffix.value}`;
	} else if (activeTab.value === 2) {
		if (isFolder) {
			name = item.name;
		} else {
			let index = item.name.lastIndexOf(`.${item.file_extension}`);
			name = item.name.slice(0, index);
		}
		name = `${prefix.value}${name}${suffix.value}`;
	} else if (activeTab.value === 3) {
		if (isFolder) {
			name = item.name;
		} else {
			let index = item.name.lastIndexOf(`.${item.file_extension}`);
			name = item.name.slice(0, index);
		}
		if (prefix.value) {
			name = `${name.replaceAll(prefix.value, suffix.value)}`;
		}
	} else if (activeTab.value === 4) {
		if (isFolder) {
			name = item.name;
		} else {
			let index = item.name.lastIndexOf(`.${item.file_extension}`);
			name = item.name.slice(0, index);
		}
		if (prefix.value) {
			try {
				const reg = new RegExp(prefix.value, modifiers.value.join(''));
				name = `${name.replace(reg, suffix.value)}`;
			} catch (e) {
				ElMessage.warning(`正则表达式错误: ${e.message}`);
			}
		}
	} else if (activeTab.value === 5) {
		if (isFolder) {
			name = item.name;
		} else {
			let index = item.name.lastIndexOf(`.${item.file_extension}`);
			name = item.name.slice(0, index);
			newFileExtension = fileExtension.value;
		}
	}
	return isFolder ? name : `${name}.${newFileExtension}`;
}

function handleTabChange(val) {
	prefix.value = '';
	indexNumber.value = '';
	suffix.value = '';
	if (val === 1) {
		prefix.value = parentFileName;
	}
}

function handleRemove(item) {
	data.sortList = data.sortList.filter(i => i.file_id !== item.file_id);
}

// 过滤非视频文件
function handleFilter(val) {
	if (val) {
		data.sortList = data.list.filter(item => item.category === 'video');
	} else {
		data.sortList = data.list;
	}
	data.sortList = data.sortList.sort(compareEpisodes);
}

async function handleBatchBtnClick() {
	let loadingMessage;
	if (nextMarker) {
		loadingMessage = ElMessage({
			message: `正在加载所有文件`,
			type: 'info',
			duration: 0
		});
		try {
			await autoScrollToLoadAll();
		} finally {
			loadingMessage.close();
		}
	}
	handleFilter(needFilter.value);
	dialogVisible1.value = true;
}

async function autoScrollToLoadAll() {
	// 等待DOM更新
	await new Promise(resolve => setTimeout(resolve, 100));

	const wait = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));
	const fireScroll = el => {
		el.dispatchEvent(new Event('scroll', { bubbles: true }));
		el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 120 }));
	};
	const getScroller = () => {
		// 阿里云盘自带列表滚动容器（支持列表+网格两种布局）
		const selectors = [
			'.scroller---esn7',
			'[class*="scroller---"]',
			'.node-list-table-view--rX4DA .tbody--Na444 [style*="overflow: auto"]',
			'.grid-scroll--O0kCz',
			'.node-list-grid-view--RRe27 .grid-scroll--O0kCz',
			'.node-list-grid-view--RRe27 .grid--QtRCl [style*="overflow: auto"]'
		];
		for (const selector of selectors) {
			const scroller = document.querySelector(selector);
			if (scroller) {
				return scroller;
			}
		}
		return document.scrollingElement || document.documentElement;
	};

	let guard = 0;
	while (nextMarker && guard < 200) {
		const scroller = getScroller();
		if (scroller) {
			scroller.scrollTop = scroller.scrollHeight;
			fireScroll(scroller);
		} else {
			window.scrollTo(0, document.body.scrollHeight);
		}
		guard++;
		await wait(500);
	}
}

function onSortEnd() {
	// console.log(`list: ${data.list[0].name}`);
	// console.log(`sort: ${data.sortList[0].name}`);
}

async function confirmRename() {
	if (loading.value) {
		return;
	}
	loading.value = true;
	let index = indexNumber.value;
	// 用户设定序号
	if (index !== '' && parseInt(index) !== 0) {
		if (!/^[0-9]*$/.test(index)) {
			ElMessage.warning(`序号格式不正确`);
			loading.value = false;
		} else {
			await handleRename();
		}
	} else {
		await handleRename();
	}
}

const open = XMLHttpRequest.prototype.open;
const setRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

// Capture request headers so we can read Authorization later
XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
	if (!this._header_) {
		this._header_ = {};
	}
	this._header_[header] = value;
	return setRequestHeader.apply(this, arguments);
};

XMLHttpRequest.prototype.open = function () {
	this.addEventListener(
		'readystatechange',
		function () {
			if (this.readyState == 4 && this.status == 200) {
				// 列表
				if (this.responseURL.indexOf('adrive/v3/file/list') > -1) {
					let { items, next_marker } = JSON.parse(this.response);
					nextMarker = next_marker;
					token =
						(this._header_ && (this._header_.Authorization || this._header_.authorization)) ||
						token;
					let i = 0;
					let len = items.length;
					for (; i < len; i++) {
						const item = items[i];
						parent_file_id = item.parent_file_id;
						obj[item.file_id] = item;
					}
					let list = Object.values(obj);
					list = list.filter(
						item => item.parent_file_id == parent_file_id
					);
					data.list = list;
				}
				// 搜索结果
				if (this.responseURL.indexOf('adrive/v3/file/search') > -1) {
					obj = {};
					let { items, next_marker } = JSON.parse(this.response);
					nextMarker = next_marker;
					token =
						(this._header_ && (this._header_.Authorization || this._header_.authorization)) ||
						token;
					let i = 0;
					let len = items.length;
					for (; i < len; i++) {
						const item = items[i];
						obj[item.file_id] = item;
					}
					let list = Object.values(obj);
					data.list = list;
				}
				// 文件夹
				if (this.responseURL.indexOf('adrive/v1/file/get_path') > -1) {
					let { items } = JSON.parse(this.response);
					if (items.length) {
						let { parent_file_id, name } = items[0];
						if (parent_file_id !== 'root') {
							parentFileName = name;
							prefix.value = name;
						}
					}
				}
			}
		},
		false
	);
	open.apply(this, arguments);
};

async function handleRename() {
	let k = 0;
	const len = data.sortList.length;
	for (let i = 0; i < len; i++) {
		const item = data.sortList[i];
		let name = formatName(item, i);
		let body = `{"drive_id":"${item.drive_id}","file_id":"${item.file_id}","name":"${name}","check_name_mode":"refuse"}`;
		const res = await rename(body);
		if (res) {
			k++;
		}
	}
	if (k === len) {
		ElMessageBox.alert('重命名完成', '提示', {
			confirmButtonText: '知道了',
			callback: () => {
				window.location.reload();
			}
		});
	} else {
		ElMessageBox.alert(`有 ${len - k} 个重命名失败`, '提示', {
			confirmButtonText: '知道了',
			callback: () => {
				window.location.reload();
			}
		});
	}
}

function compareEpisodes(a, b) {
	const nameA = a.name;
	const nameB = b.name;
	return nameA.localeCompare(nameB, undefined, {
		numeric: true,
		sensitivity: 'base'
	});
}

async function rename(body) {
	try {
		const res = await fetch('https://api.aliyundrive.com/v3/file/update', {
			headers: {
				accept: 'application/json, text/plain, */*',
				'accept-language': 'zh-CN,zh;q=0.9',
				authorization: token,
				'cache-control': 'no-cache',
				'content-type': 'application/json',
				pragma: 'no-cache',
				'sec-ch-ua':
					'"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
				'sec-ch-ua-mobile': '?0',
				'sec-ch-ua-platform': '"macOS"',
				'sec-fetch-dest': 'empty',
				'sec-fetch-mode': 'cors',
				'sec-fetch-site': 'same-site',
				'x-canary': 'client=web,app=adrive,version=v4.9.0',
				'x-device-id': 'a4c5a51d-2fd5-4919-abdd-1d15e3fbdbbd',
				'x-signature':
					'30ef6ffed7e9513dfe692c9064fe1fdf7ca97941d11ab610b1dff75476ef811c6e9b746c658eb38e146bbfee148005d2ddf1c771ca485dd0ee72e3c1a03e4e3c01',
				Referer: 'https://www.aliyundrive.com/',
				'Referrer-Policy': 'origin'
			},
			body,
			method: 'POST'
		});
		return Promise.resolve(res.ok);
	} catch (error) {
		return Promise.resolve(false);
	}
}

</script>


<style scoped>
/* Element Plus dialog 样式覆盖 */
:deep(.el-overlay) {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	overflow: hidden;
}

:deep(.el-overlay-dialog) {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

:deep(.el-dialog) {
	margin: 0;
}

:deep(.dialog-fixed-body .el-dialog__body) {
	max-height: 80vh;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

:deep(.preview-card .el-card__body) {
	display: flex;
	flex-direction: column;
	min-height: 0;
}

.tw-scroll {
	scrollbar-gutter: stable;
	scrollbar-width: thin;
	scrollbar-color: #cbd5e1 transparent;
}

.tw-scroll::-webkit-scrollbar {
	width: 8px;
}

.tw-scroll::-webkit-scrollbar-thumb {
	background-color: #cbd5e1;
	border-radius: 999px;
}

.tw-scroll::-webkit-scrollbar-track {
	background: transparent;
}
</style>