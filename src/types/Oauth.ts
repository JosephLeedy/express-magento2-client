export type OauthCredentials = {
    oauth_consumer_key: string
    oauth_consumer_secret: string
    store_base_url: string
    oauth_verifier: string
}

export type OauthRequestParameters = {
    oauth_consumer_key: string
    oauth_nonce: string
    oauth_signature_method: string
    oauth_timestamp: string
    oauth_token: string | null
    oauth_verifier: string | null
    oauth_version: string
}

export type OauthToken = {
    oauth_token: string
    oauth_token_secret: string
}
