export default defineAppConfig({
  pages: [
    'pages/schedule/index',
    'pages/assignment/index',
    'pages/lens/index',
    'pages/delivery/index',
    'pages/optometrist-detail/index',
    'pages/appointment-detail/index',
    'pages/lens-detail/index',
    'pages/delivery-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0ea5e9',
    navigationBarTitleText: '眼科验光配镜系统',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#94a3b8',
    selectedColor: '#0ea5e9',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/schedule/index',
        text: '验光排期'
      },
      {
        pagePath: 'pages/assignment/index',
        text: '自动分配'
      },
      {
        pagePath: 'pages/lens/index',
        text: '镜片批次'
      },
      {
        pagePath: 'pages/delivery/index',
        text: '拆分出库'
      }
    ]
  }
})
