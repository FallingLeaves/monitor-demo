const Koa = require('koa')
const serve = require('koa-static')
const app = new Koa()
const path = require('path')

const Router = require('koa-router');
// 创建koa-router的实例router
const router = new Router();

const port = 3000

const url = `http://localhost:${port}/browser/index.html`

const filePaths = {
  "/dist": path.resolve(__dirname, '../../dist'),
  "/browser": path.resolve(__dirname, '../browser')
}


app.use(serve(path.resolve(__dirname, '../')))

const ServerUrls = {
  normalGet: '/normal',
  exceptionGet: '/exception',
  normalPost: '/normal/post',
  exceptionPost: '/exception/post',
  errorsUpload: '/errors/upload'
}

// mock
router.get(ServerUrls.normalGet, ctx => {
  ctx.body = 'get 正常请求响应体'
})

router.get(ServerUrls.exceptionGet, ctx => {
  ctx.status = 500
  ctx.body = 'get 异常响应体!!!'
})

router.post(ServerUrls.normalPost, ctx => {
  ctx.body = 'post 正常请求响应体'
})

router.post(ServerUrls.exceptionPost, ctx => {
  ctx.status = 500
  ctx.body = 'post 异常响应体!!!'
})

router.post(ServerUrls.errorsUpload, ctx => {
  ctx.body = '错误上报成功'
})

app.use(router.routes());

app.listen(port, () => {
  console.log('examples is available at: http://localhost:' + port)
})
