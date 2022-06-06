
// 给友链套上动画
var arr = document.getElementsByClassName("site-card");
for (var i = 0; i < arr.length; i++) {
  arr[i].classList.add("wow");
  arr[i].classList.add("animate__flipInY");
  arr[i].setAttribute("data-wow-duration", "3s");
  arr[i].setAttribute("data-wow-delay", "100ms");
}

var arr = document.getElementsByClassName("recent-post-item");
for(var i = 0;i<arr.length;i++){
  arr[i].classList.remove("wow");
  arr[i].classList.remove("animate__flipInY");
  arr[i].removeAttribute('data-wow-duration');
  arr[i].removeAttribute('data-wow-delay');
}

var arr = document.getElementsByClassName("card-widget");
for(var i = 0;i<arr.length;i++){
  arr[i].classList.remove("wow");
  arr[i].classList.remove("animate__flipInY");
  arr[i].removeAttribute('data-wow-duration');
  arr[i].removeAttribute('data-wow-delay');
}


wow = new WOW({
  boxClass: "wow",
  // 当用户滚动时显示隐藏框的类名称
  animateClass: "animate__animated",
  // 触发 CSS 动画的类名称（动画库默认为"animate.css"库）
  offset: 0,
  // 定义浏览器视口底部与隐藏框顶部之间的距离。
  // 当用户滚动并到达此距离时，将显示隐藏的框。
  mobile: false,
  // 在移动设备上打开/关闭wow.js。
  live: true,
  // 在页面上检查新的 wow.js元素。
});
wow.init();