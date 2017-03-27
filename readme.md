

##use

``` javascript
import * as IServe from 'express-serve';



const pkg:{name:string} = require('../package.json');
const wwwRoot = "/to/bar/foo";
new IServe.ExpressServe(pkg.name)
    .accessLog(IServe.AccessLogType.dev)
    .viewengineSwig(path.join(wwwRoot, 'views'))
    // public asset public
    .serveStatic('/public', path.join(wwwRoot, 'public'))
    .serveStatic('/bower_components', path.join(wwwRoot, 'bower_components'))

    .use( ...  )    
    
    .router('/api', new api.ApiRoot().root)    
    .router(['/rs', '/resource'], ... )
    //html
    .router('/*', SysopRoute.index)
    .errorHandle()
    .onPreStart(async () => {
        //**
    })
    .onPostStart(async () => {
        if (config.sysop.runCron) {
            ICron.start();
            console.log(`starting cron`);
        }
    })
    .start(3000)
```