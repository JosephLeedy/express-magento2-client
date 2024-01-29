import {Router, urlencoded} from 'express'
import Callback from '../handlers/Oauth/Callback.js'
import Identity from '../handlers/Oauth/Identity.js'

const oauthRoutes: Router = Router()

oauthRoutes.use(urlencoded({extended: true}))
oauthRoutes.post('/callback', Callback)
oauthRoutes.get('/identity', Identity)

export default oauthRoutes
