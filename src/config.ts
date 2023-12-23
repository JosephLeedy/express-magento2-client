import {existsSync} from 'node:fs'
import {config} from 'dotenv'

const configFileNames: string[] = [`.env.${process.env.NODE_ENV}`, '.env.local', '.env']
const configFile: string = configFileNames.find((fileName: string): boolean => existsSync(fileName)) ?? ''

config({path: configFile})
