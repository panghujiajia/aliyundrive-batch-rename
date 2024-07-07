<template>
	<div>
		<el-dialog
			v-model="dialogVisible1"
			:close-on-click-modal="false"
			:close-on-press-escape="false"
			:show-close="false"
			destroy-on-close
			title="排序"
			width="80%"
		>
			<el-alert
				:closable="false"
				title="文件已自动排序，如顺序不对，请手动拖动排序，然后点击确定"
				type="info"
			/>
			<br/>
			<el-card shadow="never">
				<template #header>
					<div class="card-header">
						<span>预览</span>
						<div class="btn">
							<span>过滤非视频文件</span>
							<el-switch
								v-model="needFilter"
								@change="handleFilter"
							>
							</el-switch>
						</div>
					</div>
				</template>
				<div class="sort-wrap">
					<div class="index-wrap">
                        <span
							v-for="(item, index) in data.sortList"
							:key="index"
						>{{ index + 1 }}</span
						>
					</div>
					<div class="list-wrap">
						<draggable
							v-model="data.sortList"
							:animation="0"
							:component-data="{
                                tag: 'ul',
                                name: 'flip-list',
                                type: 'transition'
                            }"
							class="list-group"
							ghostClass="ghost"
							group="description"
							tag="transition-group"
							@end="onSortEnd"
						>
							<template #item="{ element }">
								<li class="item list-group-item">
									<p class="name">{{ element.name }}</p>
									<span @click="handleRemove(element)" class="remove"></span>
								</li>
							</template>
						</draggable>
					</div>
				</div>
			</el-card>
			<template #footer>
                <span class="dialog-footer">
                    <el-button
						:loading="loading"
						@click="dialogVisible1 = false"
					>
                        取消
                    </el-button>
                    <el-button
						:loading="loading"
						type="primary"
						@click="dialogVisible2 = true"
					>
                        确定
                    </el-button>
                </span>
			</template>
		</el-dialog>
		<el-dialog
			v-model="dialogVisible2"
			:closable="false"
			:keyboard="false"
			:maskClosable="false"
			destroyOnClose
			title="确定重命名"
			width="80%"
		>
			<el-tabs
				v-model="activeTab"
				type="border-card"
				@tab-change="handleTabChange"
			>
				<el-tab-pane :name="1" label="按序号重命名">
					<el-space :size="-1" style="width: 100%">
						<el-input v-model="prefix" placeholder="前缀"/>
						<el-input
							v-model="indexNumber"
							:formatter="formatIndexNumber"
							placeholder="序号"
						/>
						<el-input v-model="suffix" placeholder="后缀"/>
					</el-space>
				</el-tab-pane>
				<el-tab-pane :name="2" label="追加重命名">
					<el-space :size="-1" style="width: 100%">
						<el-input v-model="prefix" placeholder="追加前缀"/>
						<el-input v-model="suffix" placeholder="追加后缀"/>
					</el-space>
				</el-tab-pane>
				<el-tab-pane :name="3" label="查找替换">
					<el-space :size="-1" style="width: 100%">
						<el-input v-model="prefix" placeholder="查找内容"/>
						<el-input v-model="suffix" placeholder="替换内容"/>
					</el-space>
				</el-tab-pane>
				<el-tab-pane :name="4" label="正则替换">
					<el-space :size="-1" style="width: 100%">
						<el-input v-model="prefix" placeholder="正则表达式">
							<template #prepend>
								<el-text>/</el-text>
							</template>
							<template #append>
								<el-popover trigger="hover">
									<template #reference>
										<el-link
											:underline="false"
											type="primary"
										>
											/{{ modifiers.join('') }}
										</el-link>
									</template>
									<el-checkbox-group v-model="modifiers">
										<el-checkbox checked label="g">
											全局搜索 -g
										</el-checkbox>
										<el-checkbox label="i">
											忽略大小写 -i
										</el-checkbox>
										<el-checkbox label="m">
											多行模式 -m
										</el-checkbox>
										<el-checkbox label="s">
											包含换行符 -s
										</el-checkbox>
									</el-checkbox-group>
								</el-popover>
							</template>
						</el-input>
						<el-input v-model="suffix" placeholder="替换内容"/>
					</el-space>
				</el-tab-pane>
				<el-tab-pane :name="5" label="文件格式替换">
					<el-space :size="-1" style="width: 100%">
						<el-input v-model="fileExtension" placeholder="替换成"/>
					</el-space>
				</el-tab-pane>
			</el-tabs>
			<br/>
			<el-card header="预览" shadow="never">
				<div class="sort-wrap">
					<div class="index-wrap">
                        <span
							v-for="(item, index) in data.sortList"
							:key="index"
						>
                            {{ index + 1 }}
                        </span>
					</div>
					<div class="list-wrap">
						<ul class="list-group">
							<li class="item"
								v-for="(item, index) in data.sortList">
								<p class="name">{{ item.name }}</p>
								<p class="format-name">{{ formatName(item, index) }}</p>
							</li>
						</ul>
					</div>
				</div>
			</el-card>
			<template #footer>
                <span class="dialog-footer">
                    <el-button
						:loading="loading"
						@click="dialogVisible2 = false"
					>
                        取消
                    </el-button>
                    <el-button
						:loading="loading"
						type="primary"
						@click="confirmRename"
					>
                        确定
                    </el-button>
                </span>
			</template>
		</el-dialog>
		<span id="batchBtn" @click="handleBatchBtnClick"> 批量重命名 </span>
	</div>
</template>
<script setup>
import {computed, reactive, ref} from 'vue';
import draggable from 'vuedraggable';
import {ElMessage, ElMessageBox} from 'element-plus';

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
let needFilter = ref(true);
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
		let index = item.name.lastIndexOf(`.${item.file_extension}`);
		name = item.name.slice(0, index);
		name = `${prefix.value}${name}${suffix.value}`;
	} else if (activeTab.value === 3) {
		let index = item.name.lastIndexOf(`.${item.file_extension}`);
		name = item.name.slice(0, index);
		if (prefix.value) {
			name = `${name.replaceAll(prefix.value, suffix.value)}`;
		}
	} else if (activeTab.value === 4) {
		let index = item.name.lastIndexOf(`.${item.file_extension}`);
		name = item.name.slice(0, index);
		if (prefix.value) {
			try {
				const reg = new RegExp(prefix.value, modifiers.value.join(''));
				name = `${name.replace(reg, suffix.value)}`;
			} catch (e) {
			}
		}
	} else if (activeTab.value === 5) {
		let index = item.name.lastIndexOf(`.${item.file_extension}`);
		name = item.name.slice(0, index);
		newFileExtension = fileExtension.value;
	}
	return `${name}.${newFileExtension}`;
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

function handleBatchBtnClick() {
	if (nextMarker) {
		ElMessage.warning(`当前目录还有未加载完的文件，请滚动页面加载`);
	} else {
		handleFilter(true);
		dialogVisible1.value = true;
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
	if (index && index != 0) {
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
XMLHttpRequest.prototype.open = function () {
	this.addEventListener(
		'readystatechange',
		function () {
			if (this.readyState == 4 && this.status == 200) {
				// 列表
				if (this.responseURL.indexOf('adrive/v3/file/list') > -1) {
					let {items, next_marker} = JSON.parse(this.response);
					nextMarker = next_marker;
					token = this._header_.Authorization;
					let i = 0;
					let len = items.length;
					for (; i < len; i++) {
						const item = items[i];
						if (item.type !== 'file') {
							continue;
						}
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
					let {items, next_marker} = JSON.parse(this.response);
					nextMarker = next_marker;
					token = this._header_.Authorization;
					let i = 0;
					let len = items.length;
					for (; i < len; i++) {
						const item = items[i];
						if (item.type === 'folder') {
							continue;
						}
						obj[item.file_id] = item;
					}
					let list = Object.values(obj);
					data.list = list;
				}
				// 文件夹
				if (this.responseURL.indexOf('adrive/v1/file/get_path') > -1) {
					let {items} = JSON.parse(this.response);
					if (items.length) {
						let {parent_file_id, name} = items[0];
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
			callback: action => {
				window.location.reload();
			}
		});
	} else {
		ElMessageBox.alert(`有 ${len - k} 个重命名失败`, '提示', {
			confirmButtonText: '知道了',
			callback: action => {
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
<style lang="less" scoped>
#batchBtn {
	position: fixed;
	bottom: 120px;
	right: 48px;
	font-size: 14px;
	background: #637dff;
	border-radius: 100px;
	color: #fff;
	cursor: pointer;
	transition: all 0.3s ease;
	box-shadow: 0 3px 8px 0 rgba(28, 28, 32, 0.12),
	0 3px 5px 0 rgba(28, 28, 32, 0.04);
	padding: 8px 16px;
	font-weight: 500;
	z-index: 9999999;
}

/deep/ .el-space__item {
	flex: 1;
}

/deep/ .el-dialog__body {
	padding: 20px 40px;
}

/deep/ .el-dialog {
	border-radius: 10px;
}

.tips {
	ul {
		display: block;
		list-style-type: disc;
		padding-left: 0;
		
		li {
			margin: 1em 0;
		}
		
		ul {
			margin: 1em 0;
			padding-left: 20px;
			list-style-type: circle;
		}
	}
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	
	.btn {
		display: flex;
		align-items: center;
		
		span {
			margin-right: 10px;
		}
	}
}

/deep/ .el-card__header {
	padding: 10px 20px;
}

/deep/ .el-card__body {
	padding: 0;
}

.sort-wrap {
	display: flex;
	line-height: 39px;
	padding: 0;
	box-sizing: border-box;
	height: 500px;
	width: 100%;
	overflow-y: scroll;
	
	.index-wrap {
		display: flex;
		flex-direction: column;
		margin-right: 14px;
		text-align: right;
		padding: 10px 0;
		
		span {
			width: 40px;
			font-size: 14px;
			border-bottom: 1px solid transparent;
		}
	}
	
	.list-wrap {
		flex: 1;
		.item {
			user-select: none;
			margin: 0;
			font-size: 14px;
			box-sizing: border-box;
			position: relative;
			letter-spacing: 1px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			display: flex;
			justify-content: space-between;
			
			&.list-group-item {
				display: flex;
				.name {
					flex: 1;
					overflow: clip;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
				.remove {
					cursor: pointer;
					color: #999;
					font-size: 14px;
					position: relative;
					width: 39px;
					height: 39px;
					display: flex;
					&:before {
						width: 39px;
						font-weight: 200;
						content: '×';
						font-size: 30px;
						text-align: center;
						justify-content: center;
					}
				}
			}
			
			.name, .format-name {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				flex: 1;
				border-bottom: 1px dashed #999;
			}
			.format-name{
				margin-left: 50px;
				border-bottom: 1px solid #dedede;
			}
		}
	}
}

.flip-list-move {
	transition: all ease 0.5s;
}

.no-move {
	transition: all ease 0.5s;
}

.ghost {
	opacity: 0.5;
	background: #c8ebfb;
}

.list-group {
	min-height: 20px;
	width: 100%;
	padding: 10px 0;
}

.list-group-item {
	cursor: grab;
}
::-webkit-scrollbar {
	width: 5px;
	background: #fff;
}
::-webkit-scrollbar-thumb {
	background: #f5f5f5;
	border-radius: 5px;
}
</style>
