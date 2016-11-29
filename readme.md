

##use

``` javascript
import * as IServe from 'express-serve';



const pkg:{name:string} = require('../package.json');

new IServe.ApiServe(pkg.name)
    .accessLog(IServe.AccessLogType.common, 400)
    .router('/api', ApiRouterFacotry())
    .errorHandle(null, true)
    .onPreStart(async () => {
        //await ...
    })
    .onPostStart(async () => {
        //await ...
    })
    .start(3000);
```