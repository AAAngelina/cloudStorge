{
    let topPid = -1; //顶层的pid
    let topId = 0;  //顶层id
    let nowId = topId;  //当前选中项的id

    /* 
       一、 数据操作 
            - 慎用 ===，string类型居多，不确定类型时用 ==。
    */

    /* 1. 获取自己: Object getSelf(id),根据id获取对应的当前项数据 */
    function getSelf(id) {
        return data.filter(item => item.id == id)[0]
    }

    /* 2. 获取子级: Array getChild(pid),根据父级id找到所有子级 */
    function getChild(pid) {
        return data.filter(item => item.pid == pid)
    }

    /* 3. 获取父级: Object getParent(id),根据当前项id找到父级 */
    function getParent(id) {
        let s = getSelf(id);
        return getSelf(s.pid)
    }

    /* 4. 获取所有父级: Array getAllParent(id),根据当前项id找到所有父级 */
    function getAllParent(id) {
        let parentArr = [];
        let parent = getParent(id)
        while (parent) {
            parentArr.unshift(parent);
            parent = getParent(parent.id)
        }
        
        return parentArr;
    }

    /* 
        二、视图渲染
        dada-id: 一对一标识所点击的项,关联 树形导航、头部导航以及文件夹内容区域。
             - data：自定义数据属性,在HTML与DOM之间进行专有数据交换。
             - 设置：data-x = ""
             - 访问：HTMLElement.dataset.x/["x"]
        
    */
    let breadNav = document.querySelector(".bread-nav");
    let folders = document.querySelector("#folders");
    let treeMenu = document.querySelector("#tree-menu");

    let nowParent = getAllParent(nowId);
    nowParent.push(getSelf(nowId))

    render();
    function render() {
        nowParent = getAllParent(nowId);
        nowParent.push(getSelf(nowId));  
        treeMenu.innerHTML = renderTreeMenu(topPid, 0);
        breadNav.innerHTML = renderBreadNav();
        folders.innerHTML = renderFolders();
    }
    
    /* 1. 路径导航渲染 renderBreadNav()*/
   
    function renderBreadNav() {
        let parent = getAllParent(nowId);
        let inner = '';
        parent.forEach(p => {
            inner += `<a data-id= "${p.id}">${p.title}</a>`
        })
        inner += ` <span>${getSelf(nowId).title}</span>`
        return inner;
    }

    /* 2. 文件夹视图渲染 renderFolders()*/

    function renderFolders() {
        let child = getChild(nowId);
        let inner = ''
        child.forEach(c => {
            inner += `
                <li class="folder-item" data-id= "${c.id}">
                    <img src="./image/folder-b.png" alt="">
                    <span class="folder-name">${c.title}</span>
                    <input type="text" class="editor" value="${c.title}">
                    <label for="" class="checked">
                        <input type="checkbox" />
                        <span class="iconfont icon-checkbox-checked"></span>
                    </label>
                </li>
            `;
        })
        return inner
    }

    /* 3. 树状菜单的渲染 renderTreeMenu(pid) 
        - level 获取当前层级，设置样式边距
        - open状态：nowId的所有父级都打开，则open
    */

    function renderTreeMenu(pid, level) {
        let child = getChild(pid);
        let inner = `
            <ul>
               ${child.map(item => {
                   let itemChild = getChild(item.id)
                   return `
                        <li class="${nowParent.includes(item) ? "open" : ""}">
                            <p  
                                class="${itemChild.length  ? "has-child" : ""} ${item.id === nowId ? "active" : ""}" 
                                style="padding-left: ${40 + level * 20}px"
                                data-id= "${item.id}"
                            >
                                <span>${item.title}</span>
                            </p>
                            ${itemChild.length ? renderTreeMenu(item.id,level+1) : ""}
                        </li>
                    `;
               }).join("")}
            </ul>
        `;
        return inner;
    }


    /* 三、视图操作: 点击视图变化 */

    /* 弹窗 */
    function alertSuccess(info) {
        let ele = document.querySelector('.alert-success');
        clearTimeout(ele.timer);
        ele.classList.add("alert-show");
        ele.innerHTML = info;
        ele.timer = setTimeout(()=>{
            ele.classList.remove("alert-show");
        },1000);
    }
    function alertWarning(info) {
        let ele = document.querySelector('.alert-warning');
        clearTimeout(ele.timer);
        ele.classList.add("alert-show");
        ele.innerHTML = info;
        ele.timer = setTimeout(()=>{
            ele.classList.remove("alert-show");
        },1000);
    }


    /* 1.树状菜单操作 
            - 事件委托机制
    */
    treeMenu.addEventListener("click", function(e) {
        let item = e.target.tagName === "SPAN" ? e.target.parentNode : e.target;
        if(item.tagName === "P") {
           nowId = item.dataset.id;
           render();
        }
    });

    /* 2. 路径导航操作 */
    breadNav.addEventListener("click",function(e) {
        if(e.target.tagName === 'A') {
            nowId = e.target.dataset.id;
            render();
        }
    });

    /* 3. 文件夹视图：双击展开 */
    folders.addEventListener("dblclick",e => {
        let item = null;
        if(e.target.tagName === 'LI') {
            item = e.target;
        }else if(e.target.tagName === 'IMG') {
            item = e.target.parentNode;
        }
        if(item) {
            nowId = item.dataset.id;
            render();
        }
    })

    /* 4. 新建文件夹
        - getTitle()
            - 过滤符合规则的names
            - 排序、补缺
            - 顺序添加
    */
   let newFolderBtn = document.querySelector('.create-btn');
   newFolderBtn.addEventListener("click",e => {
       data.push({
            id: Date.now(),
            pid: nowId,
            title: getTitle()
       });
       render();
       alertSuccess("添加文件夹成功！");
   })

   function getTitle() {
        let fileNames = getChild(nowId).map(item => item.title);

        fileNames = fileNames.filter(fileName => {
            if(fileName === "新建文件夹") {
                return true;
            }else if(fileName.substring(0,6) === "新建文件夹(" 
                && fileName.substring(6,fileName.length-1) >= 2
                && fileName[fileName.length-1] === ")"){
                return true;
            }
            return false;
        })  

        fileNames.sort((f1,f2)=>{
            f1 = f1.substring(6,f1.length-1);
            f2 = f2.substring(6,f2.length-1);
            f1 = f1 ? f1 : 0;
            f2 = f2 ? f2 : 0;
            return f1-f2;
        })

        if(fileNames[0] !== "新建文件夹") {
            return "新建文件夹";
        }
        fileNames.forEach((fileName,index) => {
            if(index > 0 && fileName.substring(6,fileName.length-1) != index + 1){
                return  `新建文件夹(${index + 1})`
            }
        })
        return `新建文件夹(${fileNames.length + 1})`
   }

   /* 5. 右键菜单 
        5.1 菜单的显示与隐藏
            - 阻止上下文菜单事件contextmenu：鼠标右键
            - 事件代理：处理点击事件
        5.2 菜单的功能
   */
    /* 5.1 菜单的显示与隐藏 */
    let contextmenu = document.querySelector('#contextmenu');
    window.addEventListener('mousedown', e => {
        contextmenu.style.display = "none";
    });
    window.addEventListener('resize', e => {
        contextmenu.style.display = "none";
    });

   document.addEventListener('contextmenu', e => {
       e.preventDefault();   //阻止默认行为
    });
  
   folders.addEventListener('contextmenu', e => {
       if(e.target.tagName === 'LI' || e.target.parentNode.tagName === 'LI') {
           let l = e.clientX;
           let t = e.clientY;
           let lMax = document.documentElement.clientWidth-contextmenu.offsetWidth;
           let tMax = document.documentElement.clientHeight-contextmenu.offsetHeight;
           l = Math.min(l,lMax);
           t = Math.min(t,tMax);
           contextmenu.style.display = "block";
           contextmenu.style.left = l + "px";
           contextmenu.style.top = t + "px";
        }
    })

    folders.addEventListener('scroll', e => {
        contextmenu.style.display = "none";
    });

    /* 5.2 菜单的功能 */
}