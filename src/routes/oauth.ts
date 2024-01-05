import {Router, urlencoded} from 'express'
import Callback from '../actions/Oauth/Callback.js'

const oauthRoutes: Router = Router()

oauthRoutes.use(urlencoded({extended: true}))
oauthRoutes.post('/callback', Callback)

export default oauthRoutes
